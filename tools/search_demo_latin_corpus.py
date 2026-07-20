#!/usr/bin/env python3
"""Search the local Perseus Latin demonstration index with visible receipts."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path
from typing import Iterable


WORD_RE = re.compile(r"\w+", re.UNICODE)


def literal_fts_query(value: str, mode: str) -> str:
    words = WORD_RE.findall(value)
    if not words:
        raise ValueError("Search query contains no searchable words")
    operator = " AND " if mode == "all" else " OR "
    return operator.join(f'"{word.replace(chr(34), chr(34) * 2)}"' for word in words)


def search_database(
    connection: sqlite3.Connection,
    query: str,
    *,
    limit: int = 10,
    context: int = 1,
    include_editorial_notes: bool = False,
) -> list[dict[str, object]]:
    note_clause = "" if include_editorial_notes else "AND s.segment_type != 'editorial_note'"
    rows = connection.execute(
        f"""SELECT s.segment_id, s.document_id, s.sequence_number, s.segment_type,
                   s.source_xpath, s.source_xpath_end, s.source_n, s.citation_label,
                   s.text, d.author, d.title, d.source_url, d.source_sha256,
                   d.rights_statement, p.work_urn, p.edition_urn, p.basket,
                   bm25(segment_search) AS score,
                   snippet(segment_search, 1, '⟦', '⟧', ' … ', 32) AS snippet
            FROM segment_search
            JOIN segments s ON s.rowid = segment_search.rowid
            JOIN documents d ON d.document_id = s.document_id
            JOIN perseus_latin_documents p ON p.document_id = s.document_id
            WHERE segment_search MATCH ? {note_clause}
            ORDER BY score, p.shelf_order, s.sequence_number
            LIMIT ?""",
        (query, limit),
    ).fetchall()

    results: list[dict[str, object]] = []
    for row in rows:
        (
            segment_id,
            document_id,
            sequence_number,
            segment_type,
            source_xpath,
            source_xpath_end,
            source_n,
            citation_label,
            text,
            author,
            title,
            source_url,
            source_sha256,
            rights_statement,
            work_urn,
            edition_urn,
            basket,
            score,
            snippet,
        ) = row
        neighboring = connection.execute(
            """SELECT sequence_number, citation_label, source_n, text
               FROM segments
               WHERE document_id = ? AND sequence_number BETWEEN ? AND ?
               ORDER BY sequence_number""",
            (
                document_id,
                max(1, int(sequence_number) - context),
                int(sequence_number) + context,
            ),
        ).fetchall()
        results.append(
            {
                "segment_id": segment_id,
                "document_id": document_id,
                "sequence_number": sequence_number,
                "segment_type": segment_type,
                "author": author,
                "work_title": title,
                "basket": basket,
                "work_urn": work_urn,
                "edition_urn": edition_urn,
                "citation_label": citation_label,
                "source_n": source_n,
                "source_xpath": source_xpath,
                "source_xpath_end": source_xpath_end,
                "score": score,
                "snippet": snippet,
                "text": text,
                "context": [
                    {
                        "sequence_number": item[0],
                        "citation_label": item[1],
                        "source_n": item[2],
                        "text": item[3],
                        "is_hit": item[0] == sequence_number,
                    }
                    for item in neighboring
                ],
                "source_url": source_url,
                "source_sha256": source_sha256,
                "rights_statement": rights_statement,
            }
        )
    return results


def print_human(results: list[dict[str, object]], query: str) -> None:
    print(f"Search plan: {query}")
    print(f"Candidates: {len(results)}")
    for index, result in enumerate(results, start=1):
        locus_parts = [
            str(value)
            for value in (result["citation_label"], result["source_n"])
            if value
        ]
        locus = " > ".join(dict.fromkeys(locus_parts)) or "citation in source XML"
        print()
        print(f"[{index}] {result['author']}, {result['work_title']} — {locus}")
        print(f"    {result['edition_urn']}")
        print(f"    segment {result['segment_id']} | score {result['score']:.4f}")
        print(f"    {result['snippet']}")
        print(f"    Source: {result['source_url']}")


def main(argv: Iterable[str] | None = None) -> int:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Search the local demo Latin index")
    parser.add_argument("query", help="Latin word or words to search")
    parser.add_argument(
        "--db",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.sqlite3",
    )
    parser.add_argument("--mode", choices=("any", "all"), default="any")
    parser.add_argument("--fts-query", action="store_true", help="Treat query as raw FTS5 syntax")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--context", type=int, default=1)
    parser.add_argument("--include-editorial-notes", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    if not args.db.is_file():
        raise SystemExit(
            f"Index not found: {args.db}\nRun tools/build_demo_latin_corpus.py first."
        )
    query = args.query if args.fts_query else literal_fts_query(args.query, args.mode)
    connection = sqlite3.connect(f"file:{args.db}?mode=ro", uri=True)
    try:
        results = search_database(
            connection,
            query,
            limit=args.limit,
            context=args.context,
            include_editorial_notes=args.include_editorial_notes,
        )
    finally:
        connection.close()

    if args.json:
        print(json.dumps({"query": query, "results": results}, indent=2, ensure_ascii=False))
    else:
        print_human(results, query)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
