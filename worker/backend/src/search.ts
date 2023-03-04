import { removeStopwords } from 'stopword'
import { Env } from './types'

const PUNCTUATIONS_REGEX = /[*+-:;^’`]/g
export async function search(env: Env, id: string, query: string) {
  const queryWords = removeStopwords(query.split(' '))
    .map(word => {
      if (PUNCTUATIONS_REGEX.test(word)) {
        return `"${word.toLowerCase()}"`
      } else return word.toLowerCase()
    })

  // Individually query top 3 longest word
  const longestWords = queryWords.sort((a, b) => b.length - a.length)
  queryWords.push(` OR ${longestWords[0]}`)
  for (let i = 0; i < Math.min(longestWords.length - 1, 3); i++) {
    queryWords.push(` OR ${longestWords[i]} ${longestWords[i + 1]}`)
  }

  query = queryWords.join(' ')
  const result = await env.DB
    .prepare(`
      SELECT idx.rank, videos.*
      FROM videos_fts "idx"
      JOIN videos ON videos.id = idx.rowid
      WHERE
        idx.creator_id = ?1 AND
        idx.title MATCH ?2
      ORDER BY idx.rank
      LIMIT 3
    `)
    .bind(id, query)
    .all()

  return result
}
