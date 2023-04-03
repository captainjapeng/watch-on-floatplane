import { Context, Hono } from 'hono'
import { Env, HonoEnv } from '../types'
import _ from 'lodash'

export interface ProgressData {
  progress: number
  lastUpdate: number
}

export interface ProgressDataWithID extends ProgressData {
  id: string
}

const ITEMS_PER_CHUNK = 1000
const MAX_CHUNKS = 5

export class User implements DurableObject {
  private app: Hono<HonoEnv>
  private progressData: Record<string, ProgressData> = {}

  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {
    this.app = new Hono<HonoEnv>()
    this.app.post('/user/sync/progress', this.syncProgress.bind(this))
    this.app.delete('/user', this.deleteData.bind(this))

    this.state.blockConcurrencyWhile(async () => {
      const numChunks = await this.state.storage.get<number>('progressChunks') || 1
      const tasks = []
      for (let i = 0; i < numChunks; i++) {
        tasks.push(this.state.storage.get(`progress:${i}`))
      }

      for (const chunk of await Promise.all(tasks)) {
        Object.assign(this.progressData, chunk)
      }
    })
  }

  async syncProgress(ctx: Context<HonoEnv>): Promise<Response> {
    const progressData = await ctx.req.json<Record<string, ProgressData>>()

    // Merge new data and sort by lastUpdate in order to drop old records
    const sortedData = new Array<ProgressDataWithID>(Object.keys(progressData).length)
    for (const [key, value] of Object.entries(progressData)) {
      const existing = this.progressData[key]
      if (!existing || value.lastUpdate > existing.lastUpdate) {
        this.progressData[key] = value
      }

      const item = { id: key, ...value }
      const insertIdx = _.sortedIndexBy(sortedData, item, 'lastUpdate')
      sortedData[insertIdx] = item
    }

    // Extract last MAX_CHUNKS * ITEMS_PER_CHUNK from sortedData and
    // save it to storage in chunk of ITEMS_PER_CHUNK
    let numChunks = 0
    while (sortedData.length > 0) {
      const chunk = sortedData.splice(-ITEMS_PER_CHUNK, ITEMS_PER_CHUNK)
        .reduce((aggr, curr) => {
          const { id, ...value } = curr
          aggr[id] = value
          return aggr
        }, {} as Record<string, ProgressData>)
      this.state.storage.put(`progress:${numChunks}`, chunk)

      numChunks++
      if (numChunks >= MAX_CHUNKS) {
        numChunks--
        break
      }
    }

    // Remove remaining keys
    for (const item of sortedData) {
      delete this.progressData[item.id]
    }

    this.state.storage.put('progressChunks', numChunks)
    return ctx.json(this.progressData)
  }

  async deleteData(ctx: Context<HonoEnv>): Promise<Response> {
    return this.state.blockConcurrencyWhile(async () => {
      this.progressData = {}
      await this.state.storage.deleteAll()
      return ctx.json({ success: true })
    })
  }

  fetch(request: Request<unknown>): Response | Promise<Response> {
    return this.app.fetch(request, this.env)
  }
}
