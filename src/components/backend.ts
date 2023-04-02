import { BexBridge } from '@quasar/app-vite'
import { LocalStorage } from 'quasar'
import { BASE_URL, SYNC_INTERVAL } from './config'

export interface Channel {
  id: number
  fp_name: string
  fp_url: string
  fp_id: string
  yt_name: string
  yt_url: string
}

export interface SearchItem {
  id: string
  title: string
  link: string
  upload_date: string
  video_duration: number
  thumbnail: string
  channel_name: string
}

export interface SearchResult {
  items: SearchItem[]
  error?: string
}

export async function getChannels(bridge?: BexBridge): Promise<Channel[]> {
  const url = new URL('/channels', BASE_URL)
  const resp = await fetch(url)
  if (resp.status === 200) {
    const channels = await resp.json()
    saveLocal('channels', channels, bridge)
    saveLocal('lastChannelsSynced', new Date().toISOString(), bridge)
    return channels
  } else {
    throw new Error(resp.statusText)
  }
}

export async function getLocalChannels(bridge?: BexBridge): Promise<Channel[]> {
  const lastChannelsSynced = await getLastChannelsSynced(bridge)
  const lastSyncedMs = Date.now() - new Date(lastChannelsSynced).valueOf()
  const channels = await getLocal('channels', bridge)
  if (!channels) {
    return getChannels(bridge)
  } else if (lastSyncedMs > SYNC_INTERVAL) {
    getChannels(bridge) // allow to waterfall
  }

  return channels
}

async function getLastChannelsSynced(bridge?: BexBridge) {
  const lastChannelsSynced = await getLocal('lastChannelsSynced', bridge)
  return new Date(lastChannelsSynced || 0)
}

export async function getMatch(creatorId: string, videoUrl: string) {
  const url = new URL('/match', BASE_URL)
  url.searchParams.set('creatorId', creatorId)
  url.searchParams.set('videoUrl', videoUrl)

  const resp = await fetch(url)
  if (resp.status === 200) {
    return resp.json()
  } else {
    throw new Error(resp.statusText)
  }
}

export async function getSearchResult(creatorId: string, query: string): Promise<SearchResult> {
  if (!creatorId) throw new Error('creatorId is not provided')

  const url = new URL('/search', BASE_URL)
  url.searchParams.set('creatorId', creatorId)
  url.searchParams.set('query', query)

  const resp = await fetch(url)
  if (resp.status === 200) {
    return resp.json()
  } else if (resp.status === 400) {
    const body = await resp.json()
    return { items: [], ...body }
  } else {
    throw new Error(resp.statusText)
  }
}

export async function saveLocal(key: string, value: any, bridge?: BexBridge) {
  if (bridge) {
    const resp = await bridge.send('storage.set', { key, value })
    return resp.data
  } else {
    return LocalStorage.set(key, value)
  }
}

export async function getLocal(key: string, bridge?: BexBridge) {
  if (bridge) {
    const resp = await bridge.send('storage.get', { key })
    return resp.data
  } else {
    return LocalStorage.getItem(key)
  }
}

export async function saveSync(key: string, value: any, bridge?: BexBridge) {
  if (bridge) {
    const resp = await bridge.send('sync.set', { key, value })
    return resp.data
  } else {
    return LocalStorage.set(key, value)
  }
}

export async function getSync(key: string, bridge?: BexBridge) {
  if (bridge) {
    const resp = await bridge.send('sync.get', { key })
    return resp.data
  } else {
    return LocalStorage.getItem(key)
  }
}
