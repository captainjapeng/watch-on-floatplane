-- Migration number: 0000 	 2023-03-04T14:49:09.928Z
CREATE TABLE videos (
  id INTEGER PRIMARY KEY,
  creator_id TEXT,
  video_id TEXT UNIQUE,
  title TEXT,
  thumbnail TEXT,
  video_duration INTEGER,
  upload_date TEXT
);
