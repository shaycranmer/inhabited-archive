PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS openiti_versions (
    document_id TEXT PRIMARY KEY REFERENCES documents(document_id) ON DELETE CASCADE,
    version_uri TEXT NOT NULL UNIQUE,
    book_uri TEXT NOT NULL,
    version_status TEXT NOT NULL CHECK (version_status IN ('pri', 'sec')),
    stage TEXT NOT NULL CHECK (stage IN ('plain', 'completed', 'mARkdown', 'inProgress')),
    source_language_string TEXT NOT NULL,
    subcorpus TEXT,
    uncorrected_ocr INTEGER NOT NULL DEFAULT 0 CHECK (uncorrected_ocr IN (0, 1)),
    author_date_code TEXT,
    author_ar TEXT,
    author_lat TEXT,
    title_ar TEXT,
    title_lat TEXT,
    edition_info TEXT,
    provider_token_count INTEGER,
    provider_character_count INTEGER,
    source_collection_id TEXT,
    source_tags_json TEXT NOT NULL DEFAULT '[]',
    manuscript_metadata_json TEXT NOT NULL DEFAULT '{}',
    parts_metadata_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_openiti_versions_book
    ON openiti_versions(book_uri);
CREATE INDEX IF NOT EXISTS idx_openiti_versions_status_stage
    ON openiti_versions(version_status, stage);

CREATE TABLE IF NOT EXISTS openiti_segment_locators (
    segment_id TEXT PRIMARY KEY REFERENCES segments(segment_id) ON DELETE CASCADE,
    source_line_start INTEGER NOT NULL,
    source_line_end INTEGER NOT NULL,
    page_marker_start TEXT,
    page_marker_end TEXT,
    milestone_start TEXT,
    milestone_end TEXT,
    section_depth INTEGER,
    raw_heading_marker TEXT,
    inherited_tags_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_openiti_locators_page
    ON openiti_segment_locators(page_marker_start, page_marker_end);
CREATE INDEX IF NOT EXISTS idx_openiti_locators_milestone
    ON openiti_segment_locators(milestone_start, milestone_end);
