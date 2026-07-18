PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_info (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    schema_version TEXT NOT NULL,
    normalizer_version TEXT NOT NULL,
    corpus_code TEXT NOT NULL,
    source_id TEXT NOT NULL,
    collection TEXT NOT NULL,
    title TEXT,
    author TEXT,
    languages_json TEXT NOT NULL DEFAULT '[]',
    source_languages_json TEXT NOT NULL DEFAULT '[]',
    publication_date TEXT,
    publisher TEXT,
    edition TEXT,
    series_id TEXT,
    source_url TEXT,
    source_path TEXT NOT NULL,
    source_sha256 TEXT NOT NULL,
    provenance_path TEXT,
    rights_statement TEXT,
    estimated_source_words INTEGER,
    ingest_status TEXT NOT NULL,
    segment_count INTEGER NOT NULL DEFAULT 0,
    normalized_char_count INTEGER NOT NULL DEFAULT 0,
    extraction_coverage REAL,
    ingested_at TEXT NOT NULL,
    UNIQUE (corpus_code, source_id)
);

CREATE TABLE IF NOT EXISTS document_languages (
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    source_language_codes_json TEXT NOT NULL DEFAULT '[]',
    language_label TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    PRIMARY KEY (document_id, language_code)
);

CREATE TABLE IF NOT EXISTS segments (
    segment_id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    segment_type TEXT NOT NULL,
    source_element TEXT NOT NULL,
    source_xpath TEXT NOT NULL,
    source_xpath_end TEXT NOT NULL,
    source_unit_count INTEGER NOT NULL DEFAULT 1,
    source_xml_id TEXT,
    source_n TEXT,
    source_type TEXT,
    language_code TEXT,
    source_language_code TEXT,
    page_marker TEXT,
    citation_label TEXT,
    citation_path_json TEXT NOT NULL DEFAULT '[]',
    part_number INTEGER NOT NULL DEFAULT 1,
    part_count INTEGER NOT NULL DEFAULT 1,
    text TEXT NOT NULL,
    char_count INTEGER NOT NULL,
    token_count_approx INTEGER NOT NULL,
    UNIQUE (document_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_segments_document
    ON segments(document_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_segments_language
    ON segments(language_code);
CREATE INDEX IF NOT EXISTS idx_documents_collection
    ON documents(collection);
CREATE INDEX IF NOT EXISTS idx_documents_author
    ON documents(author);

CREATE TABLE IF NOT EXISTS ingest_issues (
    issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT,
    source_id TEXT,
    collection TEXT,
    severity TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    source_path TEXT,
    detail TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingest_issues_type
    ON ingest_issues(issue_type, severity);

CREATE VIRTUAL TABLE IF NOT EXISTS document_search USING fts5(
    title,
    author,
    collection,
    content = 'documents',
    content_rowid = 'rowid',
    tokenize = 'unicode61 remove_diacritics 0'
);

CREATE VIRTUAL TABLE IF NOT EXISTS segment_search USING fts5(
    citation_label,
    text,
    content = 'segments',
    content_rowid = 'rowid',
    tokenize = 'unicode61 remove_diacritics 0'
);
