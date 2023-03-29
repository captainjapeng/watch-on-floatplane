export interface Env {
  DB: D1Database
  PHASH_HOST: string
  LOCAL: boolean
}

export interface Video {
  creator_id: string
  video_id: string
  title: string
  thumbnail: string
  video_duration: number
  upload_date: string
}

export interface Channel {
  id: number
  fp_name: string
  fp_url: string
  fp_id: string
  yt_name: string
  yt_url: string
}

export class EndpointDisableError extends Error {
  constructor() {
    super('Endpoint is disabled')
  }
}

export class BadUserInputError extends Error { }

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
}
