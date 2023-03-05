-- Migration number: 0004 	 2023-03-05T14:38:00.605Z
CREATE TABLE videos_phash_idx (
  id INTEGER PRIMARY KEY,
  creator_id TEXT,
  p1 TEXT,
  p2 TEXT,
  p3 TEXT,
  p4 TEXT,
  p5 TEXT,
  p6 TEXT,
  p7 TEXT,
  p8 TEXT,
  p9 TEXT,
  p10 TEXT,
  p11 TEXT,
  p12 TEXT,
  p13 TEXT,
  p14 TEXT,
  p15 TEXT,
  p16 TEXT
);

-- Populate values from existing videos table
INSERT INTO videos_phash_idx (
    id, creator_id,
    p1, p2, p3, p4, p5, p6, p7, p8,
    p9, p10, p11, p12, p13, p14, p15, p16
)
SELECT
  id,
  creator_id,
  SUBSTR(phash, (0 * 4) + 1, 4),
  SUBSTR(phash, (1 * 4) + 1, 4),
  SUBSTR(phash, (2 * 4) + 1, 4),
  SUBSTR(phash, (3 * 4) + 1, 4),
  SUBSTR(phash, (4 * 4) + 1, 4),
  SUBSTR(phash, (5 * 4) + 1, 4),
  SUBSTR(phash, (6 * 4) + 1, 4),
  SUBSTR(phash, (7 * 4) + 1, 4),
  SUBSTR(phash, (8 * 4) + 1, 4),
  SUBSTR(phash, (9 * 4) + 1, 4),
  SUBSTR(phash, (10 * 4) + 1, 4),
  SUBSTR(phash, (11 * 4) + 1, 4),
  SUBSTR(phash, (12 * 4) + 1, 4),
  SUBSTR(phash, (13 * 4) + 1, 4),
  SUBSTR(phash, (14 * 4) + 1, 4),
  SUBSTR(phash, (15 * 4) + 1, 4)
FROM videos

-- Triggers to keep the index up to date.
CREATE TRIGGER phash_videos_ai AFTER INSERT ON videos BEGIN
  INSERT INTO videos_phash_idx(
    id, creator_id,
    p1, p2, p3, p4, p5, p6, p7, p8,
    p9, p10, p11, p12, p13, p14, p15, p16
  )
  VALUES (
    new.id,
    new.creator_id,
    SUBSTR(new.phash, (0 * 4) + 1, 4),
    SUBSTR(new.phash, (1 * 4) + 1, 4),
    SUBSTR(new.phash, (2 * 4) + 1, 4),
    SUBSTR(new.phash, (3 * 4) + 1, 4),
    SUBSTR(new.phash, (4 * 4) + 1, 4),
    SUBSTR(new.phash, (5 * 4) + 1, 4),
    SUBSTR(new.phash, (6 * 4) + 1, 4),
    SUBSTR(new.phash, (7 * 4) + 1, 4),
    SUBSTR(new.phash, (8 * 4) + 1, 4),
    SUBSTR(new.phash, (9 * 4) + 1, 4),
    SUBSTR(new.phash, (10 * 4) + 1, 4),
    SUBSTR(new.phash, (11 * 4) + 1, 4),
    SUBSTR(new.phash, (12 * 4) + 1, 4),
    SUBSTR(new.phash, (13 * 4) + 1, 4),
    SUBSTR(new.phash, (14 * 4) + 1, 4),
    SUBSTR(new.phash, (15 * 4) + 1, 4)
  );
END;

CREATE TRIGGER phash_videos_ad AFTER DELETE ON videos BEGIN
  DELETE FROM videos_phash_idx WHERE id = old.id;
END;

CREATE TRIGGER phash_videos_au AFTER UPDATE ON videos BEGIN
  UPDATE videos_phash_idx
  SET
    creator_id = new.creator_id,
    p1 = SUBSTR(new.phash, (0 * 4) + 1, 4),
    p2 = SUBSTR(new.phash, (1 * 4) + 1, 4),
    p3 = SUBSTR(new.phash, (2 * 4) + 1, 4),
    p4 = SUBSTR(new.phash, (3 * 4) + 1, 4),
    p5 = SUBSTR(new.phash, (4 * 4) + 1, 4),
    p6 = SUBSTR(new.phash, (5 * 4) + 1, 4),
    p7 = SUBSTR(new.phash, (6 * 4) + 1, 4),
    p8 = SUBSTR(new.phash, (7 * 4) + 1, 4),
    p9 = SUBSTR(new.phash, (8 * 4) + 1, 4),
    p10 = SUBSTR(new.phash, (9 * 4) + 1, 4),
    p11 = SUBSTR(new.phash, (10 * 4) + 1, 4),
    p12 = SUBSTR(new.phash, (11 * 4) + 1, 4),
    p13 = SUBSTR(new.phash, (12 * 4) + 1, 4),
    p14 = SUBSTR(new.phash, (13 * 4) + 1, 4),
    p15 = SUBSTR(new.phash, (14 * 4) + 1, 4),
    p16 = SUBSTR(new.phash, (15 * 4) + 1, 4)
  WHERE id = new.id;
END;
