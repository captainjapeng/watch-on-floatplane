import { getPHash } from './phash'
import { Env, Video } from './types'
import { arrayParameters } from './utils'

export async function scrape(env: Env, id: string, offset = 0, limit = 20) {
  const url = new URL('https://www.floatplane.com/api/v3/content/creator')
  url.searchParams.set('id', id)
  url.searchParams.set('fetchAfter', `${offset}`)
  url.searchParams.set('limit', `${limit}`)

  const scrapeResp = await fetch(url)
  let scrapedVideos = await scrapeResp.json<any[]>()

  if (scrapedVideos.length === 0) return []

  // Filter out posts that are not on the database or
  // the thumbnail has not yet changed
  const scrapedVideoIds = scrapedVideos.map((video: any) => video.id)
  const existingVideos = await env.DB.prepare(`
    SELECT *
    FROM videos
    WHERE video_id IN (${arrayParameters(scrapedVideoIds.length)})
  `).bind(...scrapedVideoIds).all<Video>()

  scrapedVideos = scrapedVideos.filter(video => {
    const match = existingVideos.results?.find(el => el.video_id === video.id)
    return !match || match.thumbnail !== video.thumbnail?.path
  })

  if (!scrapedVideos.length) return []

  // Fetch thumbnail hashes
  const thumbUrls = scrapedVideos.map((video: any) => video.thumbnail?.path || '')
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

  const statements = scrapedVideos.map((video: any, idx: number) => {
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
