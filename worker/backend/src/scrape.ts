import { getPHash } from './phash'
import { Env } from './types'

export async function scrape(env: Env, id: string, offset = 0, limit = 20) {
  const url = new URL('https://www.floatplane.com/api/v3/content/creator')
  url.searchParams.set('id', id)
  url.searchParams.set('fetchAfter', `${offset}`)
  url.searchParams.set('limit', `${limit}`)

  const postsResp = await fetch(url)
  const posts = await postsResp.json<any[]>()

  if (posts.length === 0) return []

  // Fetch thumbnail hashes
  const thumbUrls = posts.map((video: any) => video.thumbnail?.path || '')
  const hashes = await getPHash(env, thumbUrls)

  const insertVideoStatement = env.DB.prepare(`
    INSERT INTO videos (
      creator_id,
      video_id,
      title,
      thumbnail,
      video_duration,
      upload_date,
      phash
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    ON CONFLICT (video_id)
    DO UPDATE SET
      creator_id = EXCLUDED.creator_id,
      title = EXCLUDED.title,
      thumbnail = EXCLUDED.thumbnail,
      video_duration = EXCLUDED.video_duration,
      upload_date = EXCLUDED.upload_date,
      phash = EXCLUDED.phash
    RETURNING *
  `)

  const statements = posts.map((video: any, idx: number) => {
    return insertVideoStatement.bind(
      video.creator.id,
      video.id,
      video.title,
      video.thumbnail?.path || '',
      video.metadata?.videoDuration || 0,
      video.releaseDate,
      hashes[idx]
    )
  })

  const dbResults = await env.DB.batch(statements)
  return dbResults.map((el) => el.results && el.results[0])
}

export async function scrapeFromEnd(env: Env, id: string) {
  const results = []
  for (let i = 0; i < 5; i++) {
    const countResult: any = await env.DB
      .prepare('SELECT COUNT(*) as count FROM videos WHERE creator_id = ?1')
      .bind(id)
      .first()

    const scrapeResult = await scrape(env, id, countResult.count)
    if (scrapeResult.length === 0) break
    else results.push(...scrapeResult)
  }

  return results
}
