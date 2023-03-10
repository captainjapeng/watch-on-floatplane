import { Env } from './types'

export async function getPHash(env: Env, imgUrls: string[]) {
  const chunkSize = 10
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
    ORDER BY upload_date DESC
    LIMIT 20
  `).all<any>()

  if (!videos.results?.length) return []

  const thumbUrls = videos.results.map((video: any) => video.thumbnail)
  const hashes = await getPHash(env, thumbUrls)
  videos.results.forEach((video, idx) => {
    video.phash = hashes[idx]
  })

  const updateVideosStmt = env.DB.prepare(`
    UPDATE videos
    SET phash = ?2
    WHERE id = ?1
  `)

  const updatePHashIdxStmt = env.DB.prepare(`
    INSERT INTO videos_phash_idx (
      id, p1, p2, p3, p4, p5, p6, p7, p8,
      p9, p10, p11, p12, p13, p14, p15, p16
    )
    VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
      ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17
    )
    ON CONFLICT (id)
    DO UPDATE SET
      p1 =  EXCLUDED.p1,
      p2 =  EXCLUDED.p2,
      p3 =  EXCLUDED.p3,
      p4 =  EXCLUDED.p4,
      p5 =  EXCLUDED.p5,
      p6 =  EXCLUDED.p6,
      p7 =  EXCLUDED.p7,
      p8 =  EXCLUDED.p8,
      p9 =  EXCLUDED.p9,
      p10 =  EXCLUDED.p10,
      p11 =  EXCLUDED.p11,
      p12 =  EXCLUDED.p12,
      p13 =  EXCLUDED.p13,
      p14 =  EXCLUDED.p14,
      p15 =  EXCLUDED.p15,
      p16 =  EXCLUDED.p16
  `)

  await env.DB.batch(videos.results.flatMap(video => {
    const hashParts: string[] = []
    for (let i = 0; i < 16; i++) {
      hashParts.push(video.phash.substring(i * 4, (i * 4) + 4))
    }

    return [
      updateVideosStmt.bind(video.id, video.phash),
      updatePHashIdxStmt.bind(video.id, ...hashParts)
    ]
  }))

  return videos.results
}
