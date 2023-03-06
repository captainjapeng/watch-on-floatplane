import jimp from 'npm:jimp@0.22.7'
import { Application, Router } from 'https://deno.land/x/oak@v12.0.0/mod.ts'

const router = new Router()
router.get('/phash', async (context) => {
  const urls = context.request.url.searchParams.getAll('url')

  if (!urls.length) {
    context.response.body = { error: 'Must provide url query params' }
    context.response.status = 400
    return
  }

  const chunkSize = 5
  const results: string[] = []
  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize)

    const chunkHashes = await Promise.all(chunk.map(async (url) => {
      if (!url) return ''
      const img = await jimp.read({ url })
      return img.hash(2)
    }))
    results.push(...chunkHashes)
  }

  context.response.headers.set('Cache-Control', 'public, max-age=86400')
  context.response.body = results
})

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: parseInt(Deno.env.get('PORT') || '8080') })
