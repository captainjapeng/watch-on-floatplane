import { Channel, Env } from './types'

export async function getChannels(env: Env) {
  const result = await env.DB
    .prepare('SELECT * FROM channels')
    .all<Channel>()
  return result.results || []
}
