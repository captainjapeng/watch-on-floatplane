import jimp from 'npm:jimp@0.22.7'
import { Application, Router, helpers } from "https://deno.land/x/oak@v12.0.0/mod.ts"

const router = new Router()
router.get('/phash', async (context) => {
  const query = helpers.getQuery(context)
  if (!query.url) {
    context.response.body = { error: `Must provide url query params`}
    context.response.status = 400
    return
  }

  const img = await jimp.read({ url: query.url })
  context.response.body = img.hash(2)
})

const app = new Application()
app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: parseInt(Deno.env.get('PORT') || `8080`) })
