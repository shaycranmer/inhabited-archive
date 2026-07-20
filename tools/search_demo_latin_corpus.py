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
MAX_ORTHOGRAPHIC_VARIANTS = 64


def latin_orthographic_variants(word: str) -> list[str]:
    """Expand the editorial u/v and i/j distinctions mechanically.

    The source text and displayed citation remain untouched. Expansion happens
    only in the literal FTS query so mixed-vintage editions cannot silently
    lose a hit merely because they print vita/uita or iam/jam differently.
    """

    variants = {""}
    for character in word.casefold():
        if character in {"u", "v"}:
            choices = ("u", "v")
        elif character in {"i", "j"}:
            choices = ("i", "j")
        else:
            choices = (character,)
        if len(variants) * len(choices) > MAX_ORTHOGRAPHIC_VARIANTS:
            raise ValueError(
                f"Orthographic expansion exceeds {MAX_ORTHOGRAPHIC_VARIANTS} variants"
            )
        variants = {prefix + choice for prefix in variants for choice in choices}
    return sorted(variants, key=lambda variant: (variant != word.casefold(), variant))


def literal_fts_query(value: str, mode: str) -> str:
    words = WORD_RE.findall(value)
    if not words:
        raise ValueError("Search query contains no searchable words")
    operator = " AND " if mode == "all" else " OR "
    groups = []
    for word in words:
        quoted = [
            f'"{variant.replace(chr(34), chr(34) * 2)}"'
            for variant in latin_orthographic_variants(word)
        ]
        groups.append(quoted[0] if len(quoted) == 1 else f"({' OR '.join(quoted)})")
    return operator.join(groups)


def _row_to_result(
    connection: sqlite3.Connection,
    row: sqlite3.Row | tuple[object, ...],
    *,
    context: int,
) -> dict[str, object]:
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
    return {
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

    return [_row_to_result(connection, row, context=context) for row in rows]


def preview_database(
    connection: sqlite3.Connection,
    query: str,
    *,
    sample_limit: int = 3,
    context: int = 1,
    include_editorial_notes: bool = False,
) -> dict[str, object]:
    """Count literal shelf matches and return diverse diagnostic examples.

    Examples are the first matching authorial passage in different documents,
    ordered by declared shelf order. They are not relevance judgments.
    """

    if not 1 <= sample_limit <= 10:
        raise ValueError("sample_limit must be between 1 and 10")
    note_clause = "" if include_editorial_notes else "AND s.segment_type != 'editorial_note'"
    total_segment_matches, total_document_matches = connection.execute(
        f"""SELECT COUNT(*), COUNT(DISTINCT s.document_id)
            FROM segment_search
            JOIN segments s ON s.rowid = segment_search.rowid
            WHERE segment_search MATCH ? {note_clause}""",
        (query,),
    ).fetchone()
    basket_rows = connection.execute(
        f"""SELECT p.basket, COUNT(*) AS segment_matches,
                   COUNT(DISTINCT s.document_id) AS document_matches
            FROM segment_search
            JOIN segments s ON s.rowid = segment_search.rowid
            JOIN perseus_latin_documents p ON p.document_id = s.document_id
            WHERE segment_search MATCH ? {note_clause}
            GROUP BY p.basket
            ORDER BY segment_matches DESC, p.basket""",
        (query,),
    ).fetchall()
    sample_rows = connection.execute(
        f"""WITH matched AS (
                SELECT s.rowid AS segment_rowid,
                       ROW_NUMBER() OVER (
                           PARTITION BY s.document_id ORDER BY s.sequence_number
                       ) AS document_rank
                FROM segment_search
                JOIN segments s ON s.rowid = segment_search.rowid
                WHERE segment_search MATCH ? {note_clause}
            )
            SELECT s.segment_id, s.document_id, s.sequence_number, s.segment_type,
                   s.source_xpath, s.source_xpath_end, s.source_n, s.citation_label,
                   s.text, d.author, d.title, d.source_url, d.source_sha256,
                   d.rights_statement, p.work_urn, p.edition_urn, p.basket,
                   NULL AS score, substr(s.text, 1, 360) AS snippet
            FROM matched
            JOIN segments s ON s.rowid = matched.segment_rowid
            JOIN documents d ON d.document_id = s.document_id
            JOIN perseus_latin_documents p ON p.document_id = s.document_id
            WHERE matched.document_rank = 1
            ORDER BY p.shelf_order, s.sequence_number
            LIMIT ?""",
        (query, sample_limit),
    ).fetchall()
    samples = []
    for row in sample_rows:
        highlighted = connection.execute(
            """SELECT snippet(segment_search, 1, '⟦', '⟧', ' … ', 32)
               FROM segment_search
               JOIN segments s ON s.rowid = segment_search.rowid
               WHERE s.segment_id = ? AND segment_search MATCH ?""",
            (row[0], query),
        ).fetchone()[0]
        samples.append(
            _row_to_result(
                connection,
                (*row[:-1], highlighted),
                context=context,
            )
        )
    return {
        "kind": "diagnostic_shelf_preview",
        "status": "matches_found" if total_segment_matches else "no_matches",
        "query": query,
        "orthographic_matching": (
            "Literal query-time expansion is insensitive to u/v and i/j and to case. "
            "It does not yet fold ae/e or oe/e, strip diacritics, split enclitics, or lemmatize."
        ),
        "total_segment_matches": total_segment_matches,
        "total_document_matches": total_document_matches,
        "basket_matches": [
            {
                "basket": row[0],
                "segment_matches": row[1],
                "document_matches": row[2],
            }
            for row in basket_rows
        ],
        "samples": samples,
        "notice": (
            "These are raw diagnostic examples from distinct works where possible, "
            "not relevance judgments. No matches on this shelf would not prove "
            "historical absence."
        ),
    }


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


def print_preview(preview: dict[str, object]) -> None:
    print(f"Shelf check: {preview['query']}")
    print(
        f"Matches: {preview['total_segment_matches']} passages across "
        f"{preview['total_document_matches']} works"
    )
    for index, result in enumerate(preview["samples"], start=1):
        locus = result["citation_label"] or result["source_n"] or "source XML"
        print()
        print(f"[{index}] {result['author']}, {result['work_title']} — {locus}")
        print(f"    {result['snippet']}")
        print(f"    Source: {result['source_url']}")
    print()
    print(preview["notice"])
    print(preview["orthographic_matching"])


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
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Count matches and show raw examples from different works",
    )
    parser.add_argument("--sample-limit", type=int, default=3)
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
        if args.preview:
            output = preview_database(
                connection,
                query,
                sample_limit=args.sample_limit,
                context=args.context,
                include_editorial_notes=args.include_editorial_notes,
            )
        else:
            output = search_database(
                connection,
                query,
                limit=args.limit,
                context=args.context,
                include_editorial_notes=args.include_editorial_notes,
            )
    finally:
        connection.close()

    if args.json:
        if args.preview:
            print(json.dumps(output, indent=2, ensure_ascii=False))
        else:
            print(json.dumps({"query": query, "results": output}, indent=2, ensure_ascii=False))
    elif args.preview:
        print_preview(output)
    else:
        print_human(output, query)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
