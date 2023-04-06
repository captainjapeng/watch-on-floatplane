import _ from 'lodash'
import { Env } from './types'
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

export interface Range {
  min: number,
  max: number,
  interval: number
}

export interface AnalyticsQueryResult<T> {
  meta: {
    name: string
    type: string
  }[]
  data: T[],
  rows: number,
  range: Range
}

export interface DAUItem {
  t: string,
  count: string
}

export interface RequestItem {
  t: string,
  path: string
  count: string
}

export interface LineGraphItem {
  t: string
  count: string
}

export type TitleHandler = (data: LineGraphItem[], x: number, item: any) => string
export type LegendHandler = () => string

export function dailyActiveUsers(env: Env): Promise<AnalyticsQueryResult<DAUItem>> {
  const rangeMax = Math.floor(Date.now() / (ONE_DAY)) * (ONE_DAY)
  const rangeMin = rangeMax - (7 * ONE_DAY)
  const rangeInterval = ONE_DAY

  return queryAnalytics<DAUItem>(env, `
    SELECT
        intDiv(toUInt32(timestamp), 24 * 60 * 60) * (24 * 60 * 60 * 1000) AS t,
        COUNT(DISTINCT blob3) AS count
    FROM "wofp-requests"
    WHERE
      timestamp > NOW() - INTERVAL '7' DAY
    GROUP BY t
  `, {
    min: rangeMin,
    max: rangeMax,
    interval: rangeInterval
  })
}

export function hourlyRequests(env: Env): Promise<AnalyticsQueryResult<RequestItem>> {
  const rangeMax = Math.floor(Date.now() / (ONE_HOUR)) * (ONE_HOUR)
  const rangeMin = rangeMax - (24 * ONE_HOUR)
  const rangeInterval = ONE_HOUR

  return queryAnalytics<RequestItem>(env, `
    SELECT
        intDiv(toUInt32(timestamp), 60 * 60) * (60 * 60 * 1000) AS t,
        index1 as path,
        SUM(_sample_interval) as count
    FROM "wofp-requests"
    WHERE
      timestamp > NOW() - INTERVAL '1' DAY
    GROUP BY index1, t
  `, {
    min: rangeMin,
    max: rangeMax,
    interval: rangeInterval
  })
}

async function queryAnalytics<T = any>(env: Env, query: string, range: Range): Promise<AnalyticsQueryResult<T>> {
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`
    },
    body: query.trim()
  })
  return { ...await resp.json(), range }
}

export interface XRange {
  min: number,
  max: number,
  interval: number
}

export function lineGraph(
  data: LineGraphItem[][],
  tz: string,
  xRange: XRange,
  getTitle?: TitleHandler,
  generateLegend?: LegendHandler
): string {
  const yMax = Math.max(...data.flatMap(el => el).map(el => el.count) as any[])
  const yAxis = generateSteps(yMax)

  const xAxis = generateSteps(
    xRange.max,
    xRange.min,
    undefined,
    xRange.interval
  )

  if (!getTitle) {
    getTitle = function(_, x, item) {
      const time = formatInTimeZone(x, tz, 'MMM d, yyyy h:mm aa')
      const count = item?.count || 0
      return `Time: ${time}\nCount: ${count}`
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" class="graph" viewBox="0 0 1000 500">
      <style>
        .graph .labels.x-labels {
          text-anchor: middle;
        }

        .graph .labels.y-labels {
          text-anchor: end;
        }

        .graph {
          height: auto;
          width: 100%;
          font-family: 'Open Sans', sans-serif;
          background: white;
        }

        .graph .grid {
          stroke: #ccc;
          stroke-dasharray: 0;
          stroke-width: 1;
        }

        .labels {
          font-size: 13px;
        }

        .label-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          fill: black;
        }

        .legend {
          font-weight: bold;
          font-size: 14px;
          fill: black;
        }
      </style>
      <g class="grid x-grid">
        <line x1="90" y1="370" x2="905" y2="370"></line>
      </g>
      <g class="grid y-grid">
        <line x1="90" y1="10" x2="90" y2="371"></line>
      </g>
      <g class="labels x-labels">
        ${generateXAxis(xAxis, tz, xRange.interval)}
        <text x="497" y="390" class="label-title">Time (Local)</text>
      </g>
      <g class="labels y-labels">
        ${generateYAxis(yAxis)}
        <text x="50" y="190" class="label-title">Count</text>
      </g>
      <g class="data">
        ${generateDataset(xAxis, yAxis, data, getTitle)}
      </g>
      <g class="legend">
        ${generateLegend ? generateLegend() : ''}
      </g>
    </svg>
  `
}

function generateSteps(max: number, startVal = 0, numElements = 10, interval: number | null = null) {
  if (!interval) {
    interval = Math.ceil((max - startVal) / numElements)
    max += interval
  }

  const steps = []
  for (let i = startVal; i <= max; i += interval) {
    steps.push(i)
  }
  return steps
}

function generateYAxis(values: number[]) {
  const yMin = 10, yMax = 371 - yMin
  return values.map(val => [val, (1 - getAxisPercentage(values, val)) * yMax + yMin])
    .map(([val, y]) => `<text x="80" y="${y}" alignment-baseline="central">${val}</text>`)
    .join('\n')
}

function generateXAxis(values: number[], tz = 'Asia/Manila', interval: number) {
  const xMin = 90, xMax = 905 - xMin
  return values.map(val => [val, getAxisPercentage(values, val) * xMax + xMin])
    .map(([val, x]) => {
      let format = 'MMM d, h:mm aa'
      if (interval === ONE_HOUR) {
        const zonedTime = utcToZonedTime(val, tz)
        const isStartOfDay = startOfDay(zonedTime).valueOf() === zonedTime.valueOf()
        if (isStartOfDay) format = 'MMM d'
      } else if (interval === ONE_DAY) {
        format = 'MMM d'
      }

      return `
      <text text-anchor="start" alignment-baseline="central" style="transform: translate(${x}px, 400px) rotate(25deg)">
        ${formatInTimeZone(val, tz, format)}
      </text>
    `
    })
    .join('\n')
}

function generateDataset(
  xSteps: number[],
  ySteps: number[],
  datasets: LineGraphItem[][],
  getTitle: TitleHandler
) {
  const xMin = 90, xMax = 905 - xMin
  const yMin = 10, yMax = 371 - yMin

  const result: string[] = []
  for (const [idx, data] of datasets.entries()) {
    const color = getColor(idx)
    const lookup = _.keyBy(data, 't')

    const points: string[] = []
    for (const x of xSteps) {
      const yVal = parseInt(lookup[x]?.count || '0')
      const yCoord = (1 - getAxisPercentage(ySteps, yVal)) * yMax + yMin
      const xCoord = getAxisPercentage(xSteps, x) * xMax + xMin
      points.push(`${xCoord},${yCoord}`)
      const el = `
        <circle cx="${xCoord}" cy="${yCoord}" r="3" fill="${color}" stroke="${color}">
          <title>${getTitle(data, x, lookup[x])}</title>
        </circle>
      `
      result.push(el)
    }
    const el = `<polyline stroke="${color}" stroke-width="3" fill="none" points="${points.join(' ')}"></polyline>`
    result.unshift(el)
  }

  return result.join('\n')
}

function getAxisPercentage(steps: number[], value: number) {
  const range = steps[steps.length - 1] - steps[0]
  return (value - steps[0]) / range
}

export function getColor(idx: number) {
  return COLOR_PALLETE[idx % COLOR_PALLETE.length]
}

export function sortRequestDataset(result: AnalyticsQueryResult<RequestItem>) {
  return _(result.data)
    .groupBy('path')
    .map((items) => {
      return {
        items,
        max: _.sum(items.map(el => parseInt(el.count)))
      }
    })
    .sortBy('max')
    .reverse()
    .value()
}

export function requestsTitle(tz: string): TitleHandler {
  return function(data, x, item) {
    const time = formatInTimeZone(x, tz, 'MMM d, yyyy h:mm aa')
    const path = (data[0] as any).path
    const count = item?.count || 0
    return `Time: ${time}\nPath: ${path}\nCount: ${count}`
  }
}

export function requestsLegend(dataset: any) {
  return function() {
    const legends: any[] = []
    let y = 25

    for (const [idx, data] of dataset.entries()) {
      const node = `
        <g>
          <rect x="115" y="${y}" width="10" height="10" fill="${getColor(idx)}"></rect>
          <text x="130" y="${y + 6}" alignment-baseline="central">${data.max}</text>
          <text x="160" y="${y + 6}" alignment-baseline="central">${data.items[0].path}</text>
        </g>
      `

      legends.push(node)
      y += 18
    }
    return `
      ${legends.join('\n')}
      <rect x="110" y="20" width="300" height="${y - 20}" fill="none" stroke="black" stroke-width="1"></rect>
    `
  }
}

const COLOR_PALLETE = [
  '#3f51b5',
  '#03a9f4',
  '#009688',
  '#8bc34a',
  '#ffeb3b',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#795548'
]
