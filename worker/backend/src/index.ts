/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { scrape, scrapeFromEnd } from './scrape'
import { match } from './search'
import { EndpointDisableError, Env } from './types'
import { backfillPHash } from './phash'
import { getChannels } from './channels'

const app = new Hono<{ Bindings: Env }>()
app.use('*', cors({
  origin: [
    'https://www.youtube.com'
  ]
}))

const cache = caches.default

app.get('/match', async (ctx) => {
  const cacheResp = await cache.match(ctx.req.raw)
  if (cacheResp) return cacheResp

  const creatorId = ctx.req.query('creatorId')
  if (!creatorId) return ctx.json({ error: 'Missing creatorId in query params' }, 400)

  const videoUrl = decodeURIComponent(ctx.req.query('videoUrl') || '')
  if (!videoUrl) return ctx.json({ error: 'Missing videoUrl in query params' }, 400)

  const result = await match(ctx.env, creatorId, videoUrl)
  const resp = ctx.json(result, 200, {
    'Cache-Control': 'public, max-age=1800'
  })

  ctx.executionCtx.waitUntil(cache.put(ctx.req.raw, resp.clone()))
  return resp
})

// Scrape Latest Videos
app.get('/scrape', async (ctx) => {
  if (!ctx.env.LOCAL) throw new EndpointDisableError()
  const id = ctx.req.query('id')
  if (!id) return ctx.json({ error: 'Missing id in query params' }, 400)

  const result = await scrape(ctx.env, id)
  return ctx.json(result)
})

// Scrape Latest Videos
app.get('/scrape-all', async (ctx) => {
  if (!ctx.env.LOCAL) throw new EndpointDisableError()

  const channels = await getChannels(ctx.env)
  const tasks = channels.map(async el => ({
    ...el,
    result: await scrape(ctx.env, el.fp_id, undefined, 10)
  }))

  const result = await Promise.all(tasks)
  return ctx.json(result)
})

// Scrape Old Videos
app.get('/scrape-end', async (ctx) => {
  if (!ctx.env.LOCAL) throw new EndpointDisableError()
  const id = ctx.req.query('id')
  if (!id) return ctx.json({ error: 'Missing id in query params' }, 400)

  const result = await scrapeFromEnd(ctx.env, id)

  if (result.length > 0) {
    ctx.header('Refresh', `5; url=${ctx.req.url.toString()}`)
  }

  return ctx.json(result)
})

// Backfill videos's phash
app.get('/backfill-phash', async (ctx) => {
  if (!ctx.env.LOCAL) throw new EndpointDisableError()
  const result = await backfillPHash(ctx.env)
  return ctx.json(result)
})

app.onError((err, ctx) => {
  if (err instanceof EndpointDisableError) {
    return ctx.json({ error: err.message }, 403)
  } else if (['D1_ERROR', 'D1_EXEC_ERROR'].includes(err.message)) {
    console.error((err as any).cause)
  } else (console.error(err))

  return ctx.json({ error: 'Unknown error occured.' }, 500)
})

export default {
  fetch: app.fetch,
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
    const channels = await getChannels(env)
    const tasks = channels.map(async el => ({
      ...el,
      result: await scrape(env, el.fp_id, undefined, 10)
    }))

    await Promise.all(tasks)
  }
}
