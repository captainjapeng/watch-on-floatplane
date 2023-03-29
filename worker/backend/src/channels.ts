import { Channel, Env } from './types'

export async function getChannels(env: Env) {
  const result = await env.DB
    .prepare(`
      SELECT * FROM channels
      ORDER BY fp_name ASC
    `)
    .all<Channel>()
  return result.results || []
}
