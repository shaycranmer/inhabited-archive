CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  title TEXT,
  author TEXT,
  source_url TEXT,
  source_sha256 TEXT NOT NULL,
  rights_statement TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS segments (
  segment_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(document_id),
  sequence_number INTEGER NOT NULL,
  segment_type TEXT NOT NULL,
  source_xpath TEXT NOT NULL,
  source_xpath_end TEXT NOT NULL,
  source_n TEXT,
  citation_label TEXT,
  text TEXT NOT NULL,
  UNIQUE (document_id, sequence_number)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_segments_document
  ON segments(document_id, sequence_number);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS perseus_latin_documents (
  document_id TEXT PRIMARY KEY REFERENCES documents(document_id),
  shelf_order INTEGER NOT NULL UNIQUE,
  basket TEXT NOT NULL,
  work_urn TEXT NOT NULL UNIQUE,
  edition_urn TEXT NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_perseus_latin_basket
  ON perseus_latin_documents(basket, shelf_order);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS segment_search USING fts5(
  citation_label,
  text,
  content = 'segments',
  content_rowid = 'rowid',
  tokenize = 'unicode61 remove_diacritics 0'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS shelf_receipt (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
