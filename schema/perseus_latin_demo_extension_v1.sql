PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS perseus_latin_documents (
    document_id TEXT PRIMARY KEY REFERENCES documents(document_id) ON DELETE CASCADE,
    shelf_order INTEGER NOT NULL UNIQUE,
    basket TEXT NOT NULL,
    work_urn TEXT NOT NULL UNIQUE,
    edition_urn TEXT NOT NULL UNIQUE,
    source_repository TEXT NOT NULL,
    source_commit TEXT NOT NULL,
    license_spdx TEXT NOT NULL,
    rights_review TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_perseus_latin_basket
    ON perseus_latin_documents(basket, shelf_order);
