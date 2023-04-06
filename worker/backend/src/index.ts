/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { scrape, scrapeFromEnd } from './scrape'
import { match, search } from './search'
import { BadUserInputError, EndpointDisableError, Env, HonoEnv } from './types'
import { backfillPHash } from './phash'
import { getChannels } from './channels'

export { User } from './objects/user'

const cache = caches.default
const app = new Hono<HonoEnv>()
app.use('*', cors())
app.use('*', async (ctx, next) => {
  const startTime = Date.now()
  await next()
  const elapsed = Date.now() - startTime

  const cf = ctx.req.raw.cf
  const path = new URL(ctx.req.url).pathname
  const country = (cf as any)?.country || 'N/A'
  const city = (cf as any)?.city || 'N/A'
  const ipAddr = ctx.req.headers.get('CF-Connecting-IP')
  const ua = ctx.req.headers.get('User-Agent')

  const visitorDigest = await crypto.subtle.digest(
    { name: 'SHA-256' },
    new TextEncoder().encode([ipAddr, country, city, ua].join(''))
  )
  const visitorId = Array.from(new Uint8Array(visitorDigest))
    .map(el => el.toString(16).padStart(2, '0'))
    .join('')

  ctx.env.REQUESTS.writeDataPoint({
    blobs: [country, city, visitorId],
    doubles: [1, elapsed],
    indexes: [path]
  })
})

app.get('/match', async (ctx) => {
  const cacheKey = new Request(ctx.req.url.toString(), ctx.req.raw)
  const cacheResp = await cache.match(cacheKey)
  if (cacheResp) return new Response(cacheResp.body, cacheResp)

  const creatorId = ctx.req.query('creatorId')
  if (!creatorId) return ctx.json({ error: 'Missing creatorId in query params' }, 400)

  const videoUrl = decodeURIComponent(ctx.req.query('videoUrl') || '')
  if (!videoUrl) return ctx.json({ error: 'Missing videoUrl in query params' }, 400)

  const result = await match(ctx.env, creatorId, videoUrl)
  ctx.header('Cache-Control', 'public, max-age=1800')
  const resp = ctx.json(result)

  ctx.executionCtx.waitUntil(cache.put(cacheKey, resp.clone()))
  return resp
})

app.get('/search', async (ctx) => {
  const creatorId = ctx.req.query('creatorId')
  if (!creatorId) return ctx.json({ error: 'Missing creatorId in query params' }, 400)

  const query = decodeURIComponent(ctx.req.query('query') || '').replaceAll('+', ' ')

  const result = await search(ctx.env, creatorId, query)
  const resp = ctx.json(result)

  return resp
})

app.get('/channels', async (ctx) => {
  const result = await getChannels(ctx.env)
  const resp = ctx.json(result)
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

  if (result.length > 0) {
    ctx.header('Refresh', `1; url=${ctx.req.url.toString()}`)
  }
  return ctx.json(result)
})

// User object
async function handleUserReq(ctx: Context<HonoEnv>): Promise<Response> {
  const userId = ctx.req.header('authorization')?.replace('Bearer ', '') || ''
  if (!userId) return ctx.json({ error: 'Missing authorization header' }, 401)

  const id = ctx.env.USER.idFromName(userId)
  const obj = ctx.env.USER.get(id)

  const doResp = await obj.fetch(ctx.req.raw)
  const doBody = await doResp.blob()
  return new Response(doBody, doResp)
}
app.post('/user/sync/progress', handleUserReq)
app.delete('/user', handleUserReq)

app.onError((err, ctx) => {
  if (err instanceof EndpointDisableError) {
    return ctx.json({ error: err.message }, 403)
  } else if (err instanceof BadUserInputError) {
    return ctx.json({ error: err.message }, 400)
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
