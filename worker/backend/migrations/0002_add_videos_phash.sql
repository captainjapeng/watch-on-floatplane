-- Migration number: 0002 	 2023-03-05T08:59:41.520Z
ALTER TABLE videos
ADD COLUMN phash TEXT;
