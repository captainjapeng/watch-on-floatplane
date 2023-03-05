-- Migration number: 0001 	 2023-03-04T16:41:08.946Z
CREATE VIRTUAL TABLE videos_fts USING fts5(
  creator_id UNINDEXED,
  title,
  content = 'videos',
  content_rowid = 'id'
);

-- Triggers to keep the FTS index up to date.
CREATE TRIGGER videos_ai AFTER INSERT ON videos BEGIN
  INSERT INTO videos_fts(rowid, creator_id, title) VALUES (new.id, new.creator_id, new.title);
END;
CREATE TRIGGER videos_ad AFTER DELETE ON videos BEGIN
  INSERT INTO videos_fts(videos_fts, rowid, creator_id, title) VALUES('delete', old.id, old.creator_id, old.title);
END;
CREATE TRIGGER videos_au AFTER UPDATE ON videos BEGIN
  INSERT INTO videos_fts(videos_fts, rowid, creator_id, title) VALUES('delete', old.id, old.creator_id, old.title);
  INSERT INTO videos_fts(rowid, creator_id, title) VALUES (new.id, new.creator_id, new.title);
END;
