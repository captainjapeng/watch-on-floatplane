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

  const results = await Promise.all(urls.map(async (url) => {
    if (!url) return ''
    const img = await jimp.read({ url })
    return img.hash(2)
  }))

  context.response.body = results
})

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: parseInt(Deno.env.get('PORT') || '8080') })
