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
import { scrape, scrapeFromEnd } from './scrape'
import { search } from './search'
import { Env } from './types'
import { backfillPHash, getPHash, getPHashDistance } from './phash'

const app = new Hono<{ Bindings: Env }>()

app.get('/search', async (ctx) => {
  const id = ctx.req.query('id')
  if (!id) return ctx.json({ error: 'Missing id in query params' }, 400)

  const title = ctx.req.query('title')
  if (!title) return ctx.json({ error: 'Missing title in query params' }, 400)

  const result = await search(ctx.env, id, title)
  return ctx.json(result)
})

// Scrape Latest Videos
app.get('/scrape', async (ctx) => {
  const id = ctx.req.query('id')
  if (!id) return ctx.json({ error: 'Missing id in query params' }, 400)

  const result = await scrape(ctx.env, id)
  return ctx.json(result)
})

// Scrape Old Videos
app.get('/scrape-end', async (ctx) => {
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
  const result = await backfillPHash(ctx.env)
  return ctx.json(result)
})

app.onError((err, ctx) => {
  if (['D1_ERROR', 'D1_EXEC_ERROR'].includes(err.message)) {
    console.error((err as any).cause)
  } else (console.error(err))

  return ctx.json({ error: 'Unknown error occured.' }, 500)
})

export default app

// export default {
//   async fetch(
//     request: Request,
//     env: Env,
//     ctx: ExecutionContext
//   ): Promise<Response> {
//     try {
//       const scraped = await scrapeFromEnd(env, '59f94c0bdd241b70349eb72b')
//       return new Response(JSON.stringify(scraped), { headers: { contentType: 'application/json' } })
//     } catch (e: any) {
//       return new Response('Internal Server Error', { status: 500 })
//     }
//   }
// }
