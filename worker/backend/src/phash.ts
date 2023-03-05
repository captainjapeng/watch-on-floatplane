import { Env } from './types'

export async function getPHash(env: Env, imgUrls: string[]) {
  const chunkSize = 5
  const resultPromises: Promise<string[]>[] = []
  for (let i = 0; i < imgUrls.length; i += chunkSize) {
    const chunk = imgUrls.slice(i, i + chunkSize)
    resultPromises.push(_fetchPHash(env, chunk))
  }

  const results = await Promise.all(resultPromises)
  return results.flat()
}

async function _fetchPHash(env: Env, imgUrls: string[]) {
  const url = new URL('/phash', env.PHASH_HOST)
  for (const imgUrl of imgUrls) {
    url.searchParams.append('url', imgUrl)
  }
  const resp = await fetch(url)

  if (resp.status === 200) {
    return resp.json<string[]>()
  } else {
    const body = await resp.text()
    throw new Error(body)
  }
}

export function getPHashDistance(hash1: string, hash2: string) {
  let counter = 0

  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) counter++
  }

  return counter / hash1.length
}

export async function backfillPHash(env: Env) {
  const videos = await env.DB.prepare(`
    SELECT * FROM videos
    WHERE
      (phash = '' OR phash IS NULL) AND
      thumbnail != ''
    LIMIT 20
  `).all<any>()

  if (!videos.results?.length) return []

  const thumbUrls = videos.results.map((video: any) => video.thumbnail)
  const hashes = await getPHash(env, thumbUrls)
  videos.results.forEach((video, idx) => {
    video.phash = hashes[idx]
  })

  const updateStmt = await env.DB.prepare(`
    UPDATE videos
    SET thumbnail = ?2
    WHERE id = ?1
  `)

  await env.DB.batch(videos.results.map(video => {
    return updateStmt.bind(video.id, video.phash)
  }))

  return videos
}
