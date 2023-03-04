DROP TABLE IF EXISTS videos_fts;
DROP TRIGGER IF EXISTS videos_ai;
DROP TRIGGER IF EXISTS videos_ad;
DROP TRIGGER IF EXISTS videos_au;
CREATE VIRTUAL TABLE videos_fts USING fts5(
  creator_id UNINDEXED,
  title,
  content = 'videos',
  content_rowid = 'id'
);

-- Triggers to keep the FTS index up to date.
CREATE TRIGGER videos_ai AFTER INSERT ON videos BEGIN
  INSERT INTO videos_fts(rowid, creator_id, title) VALUES (new.ID, new.creator_id, new.title);
END;
CREATE TRIGGER videos_ad AFTER DELETE ON videos BEGIN
  INSERT INTO videos_fts(videos_fts, rowid, creator_id, title) VALUES('delete', old.ID, old.creator_id, old.title);
END;
CREATE TRIGGER videos_au AFTER UPDATE ON videos BEGIN
  INSERT INTO videos_fts(videos_fts, rowid, creator_id, title) VALUES('delete', old.ID, old.creator_id, old.title);
  INSERT INTO videos_fts(rowid, creator_id, title) VALUES (new.ID, new.creator_id, new.title);
END;
