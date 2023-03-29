import { removeStopwords } from 'stopword'
import { BadUserInputError, Env, SearchItem, SearchResult, Video } from './types'
import { getPHash, getPHashDistance } from './phash'

const PUNCTUATIONS_REGEX = /[+\-’`]/
const STRIP_PUNCTUATIONS_REGEX = /[():;*^`]/g
const YOUTUBE_WATCH_PREFIX = 'https://www.youtube.com/watch'
const YOUTUBE_VIDEO_ID_REGEX = /v=([\w-]+)&?/
const FLOATPLANE_POST_PREFIX = 'https://www.floatplane.com/post/'

export async function match(env: Env, creatorId: string, videoUrl: string) {
  // Get the thumbnail url of the provided url
  let thumbUrl = ''
  if (videoUrl.startsWith(YOUTUBE_WATCH_PREFIX)) {
    const matches = YOUTUBE_VIDEO_ID_REGEX.exec(videoUrl)
    if (matches && matches[1]) {
      thumbUrl = `https://img.youtube.com/vi/${matches[1]}/maxresdefault.jpg`
    }
  }

  // Input video's url might be unsupported
  // TODO: Send alert notification
  if (!thumbUrl) return []

  const hashResult = await getPHash(env, [thumbUrl])
  const thumbHash = hashResult[0]

  // We're unable to get the thumbnail of the input video
  // TODO: Send alert notification
  if (!thumbHash) return []

  // Split hash into sections for partial matching
  const hashParts: string[] = []
  for (let i = 0; i < 16; i++) {
    hashParts.push(thumbHash.substring(i * 4, (i * 4) + 4))
  }

  // Check if we have exact match
  const exactMatch = await env.DB.prepare(`
    SELECT * FROM videos
    WHERE
      creator_id = ?1 AND
      phash = ?2
    LIMIT 1
  `).bind(creatorId, thumbHash).first<any>()

  if (exactMatch) {
    exactMatch.rank = 1
    exactMatch.link = FLOATPLANE_POST_PREFIX + exactMatch.video_id
    return [exactMatch]
  }

  // Get the closest thumbnail based on sections
  const thumbnailMatches = await env.DB.prepare(`
    WITH ranking AS (
      SELECT
        id,
        (
          (p1 = ?1) + (p2 = ?2) + (p3 = ?3) + (p4 = ?4) +
          (p5 = ?5) + (p6 = ?6) + (p7 = ?7) + (p8 = ?8) +
          (p9 = ?9) + (p10 = ?10) + (p11 = ?11) + (p12 = ?12) +
          (p13 = ?13) + (p14 = ?14) + (p15 = ?15) + (p16 = ?16)
        ) / 16.0 AS rank
      FROM videos_phash_idx
      WHERE
        creator_id = ?17 AND
        (
          p1 = ?1 OR  p2 = ?2 OR p3 = ?3 OR p4 = ?4 OR
          p5 = ?5 OR p6 = ?6 OR p7 = ?7 OR p8 = ?8 OR
          p9 = ?9 OR p10 = ?10 OR p11 = ?11 OR p12 = ?12 OR
          p13 = ?13 OR p14 = ?14 OR p15 = ?15 OR p16 = ?16
        )
    )
    SELECT ranking.id, rank, videos.* FROM ranking
    LEFT JOIN videos ON videos.id = ranking.id
    ORDER BY rank DESC
    LIMIT 5;

  `).bind(...hashParts, creatorId).all<any>()

  // Recalculate hash based on hamming distance instead of sections
  const videos = thumbnailMatches?.results || []
  videos.forEach(video => {
    video.rank = getPHashDistance(video.phash, thumbHash)
    video.link = FLOATPLANE_POST_PREFIX + video.video_id
  })

  return videos.filter(video => video.rank > 0.95)
}

export async function search(env: Env, id: string, title: string): Promise<SearchResult> {
  if (!title) throw new BadUserInputError('Please provide a query')
  // Strip Punctuation Marks
  title = title.replaceAll(STRIP_PUNCTUATIONS_REGEX, '')
    .trim()

  // Remove stopwords and escape words w/ punctuations if needed
  const titleWords = removeStopwords(title.split(/\s+/g))
    .map(word => {
      if (PUNCTUATIONS_REGEX.test(word)) {
        return `"${word.toLowerCase()}"`
      } else return word.toLowerCase()
    })

  if (titleWords.length === 0 && title.length > 0) {
    throw new BadUserInputError('No words detected')
  }

  const perWordQuery = titleWords
    .sort((a, b) => b.length - a.length)
    .join(' OR ')

  const result = await env.DB
    .prepare(`
      SELECT videos.*, channels.fp_name as channel_name
      FROM videos_fts "idx"
      JOIN videos ON videos.id = idx.rowid
      JOIN channels ON channels.fp_id = idx.creator_id
      WHERE
        idx.creator_id = ?1 AND
        idx.title MATCH ?2
      ORDER BY idx.rank
      LIMIT 5
    `)
    .bind(id, perWordQuery)
    .all<Video>()

  if (!result.success) {
    throw result.error
  }

  const items: SearchItem[] = []
  for (const video of result.results || []) {
    items.push({
      id: video.video_id,
      title: video.title,
      link: FLOATPLANE_POST_PREFIX + video.video_id,
      upload_date: video.upload_date,
      video_duration: video.video_duration,
      channel_name: (video as any).channel_name,
      thumbnail: video.thumbnail
    })
  }

  return {
    items
  }
}
