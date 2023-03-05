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
  video_duration: string
  upload_date: string
}

export class EndpointDisableError extends Error {
  constructor() {
    super('Endpoint is disabled')
  }
}
