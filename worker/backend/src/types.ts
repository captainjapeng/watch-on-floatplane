export interface Env {
  DB: D1Database
  PHASH_HOST: string
}

export interface Video {
  creator_id: string
  video_id: string
  title: string
  thumbnail: string
  video_duration: string
  upload_date: string
}
