import { NextResponse } from "next/server";
import { getArchiveDb } from "../../../lib/server/archive-db";
import { protectSameOriginRequest } from "../../../lib/server/openai-route";
import {
  literalShelfQuery,
  parseShelfPreviewRequest,
  shelfPreviewCorpus,
  type ShelfPreviewResponse,
} from "../../../lib/shelf-preview";

export const runtime = "edge";

type CountRow = {
  total_segment_matches: number;
  total_document_matches: number;
};

type BasketRow = {
  basket: string;
  segment_matches: number;
  document_matches: number;
};

type SampleRow = {
  segment_id: string;
  document_id: string;
  author: string | null;
  work_title: string | null;
  citation_label: string | null;
  snippet: string;
  source_url: string | null;
  source_sha256: string;
  rights_statement: string | null;
};

type ReceiptRow = { key: string; value: string };

function safeSourceUrl(value: string | null) {
  return value?.startsWith("https://github.com/PerseusDL/canonical-latinLit/")
    ? value
    : "";
}

export async function POST(request: Request) {
  const protection = protectSameOriginRequest(request);
  if (!protection.allowed) {
    return NextResponse.json(
      { error: protection.error, code: protection.code },
      { status: protection.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The shelf request was unreadable." }, { status: 400 });
  }

  const previewRequest = parseShelfPreviewRequest(body);
  if (!previewRequest) {
    return NextResponse.json(
      { error: "Choose one inspectable Latin proposal with literal forms to test." },
      { status: 400 },
    );
  }

  let ftsQuery = "";
  try {
    ftsQuery = literalShelfQuery(previewRequest.queryForms, previewRequest.queryMode);
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "The proposed forms could not be tested safely." },
      { status: 400 },
    );
  }

  try {
    const db = await getArchiveDb();
    const receiptRows = await db.prepare(
      `SELECT key, value FROM shelf_receipt
       WHERE key IN ('corpus_id', 'source_commit', 'content_sha256')`,
    ).all<ReceiptRow>();
    const receipt = new Map(receiptRows.results.map((row) => [row.key, row.value]));
    if (
      receipt.get("corpus_id") !== shelfPreviewCorpus.corpusId ||
      !receipt.get("source_commit") ||
      !receipt.get("content_sha256")
    ) {
      return NextResponse.json(
        {
          error: "The Latin shelf exists, but its provenance receipt is incomplete. No preview was run.",
          code: "shelf_receipt_required",
        },
        { status: 503 },
      );
    }

    const count = await db.prepare(
      `SELECT COUNT(*) AS total_segment_matches,
              COUNT(DISTINCT s.document_id) AS total_document_matches
       FROM segment_search
       JOIN segments s ON s.rowid = segment_search.rowid
       WHERE segment_search MATCH ? AND s.segment_type != 'editorial_note'`,
    ).bind(ftsQuery).first<CountRow>();
    if (!count) throw new Error("The shelf returned no count receipt.");

    const baskets = await db.prepare(
      `SELECT p.basket,
              COUNT(*) AS segment_matches,
              COUNT(DISTINCT s.document_id) AS document_matches
       FROM segment_search
       JOIN segments s ON s.rowid = segment_search.rowid
       JOIN perseus_latin_documents p ON p.document_id = s.document_id
       WHERE segment_search MATCH ? AND s.segment_type != 'editorial_note'
       GROUP BY p.basket
       ORDER BY segment_matches DESC, p.basket`,
    ).bind(ftsQuery).all<BasketRow>();

    const samples = await db.prepare(
      `WITH first_match AS (
         SELECT s.document_id, MIN(s.sequence_number) AS first_sequence
         FROM segment_search
         JOIN segments s ON s.rowid = segment_search.rowid
         WHERE segment_search MATCH ? AND s.segment_type != 'editorial_note'
         GROUP BY s.document_id
       )
       SELECT s.segment_id,
              s.document_id,
              d.author,
              d.title AS work_title,
              s.citation_label,
              snippet(segment_search, 1, '⟦', '⟧', ' … ', 32) AS snippet,
              d.source_url,
              d.source_sha256,
              d.rights_statement
       FROM segment_search
       JOIN segments s ON s.rowid = segment_search.rowid
       JOIN first_match f
         ON f.document_id = s.document_id AND f.first_sequence = s.sequence_number
       JOIN documents d ON d.document_id = s.document_id
       JOIN perseus_latin_documents p ON p.document_id = s.document_id
       WHERE segment_search MATCH ? AND s.segment_type != 'editorial_note'
       ORDER BY p.shelf_order, s.sequence_number
       LIMIT 5`,
    ).bind(ftsQuery, ftsQuery).all<SampleRow>();

    const totalSegmentMatches = Number(count.total_segment_matches ?? 0);
    const totalDocumentMatches = Number(count.total_document_matches ?? 0);
    const response: ShelfPreviewResponse = {
      kind: "diagnostic_shelf_preview",
      proposalId: previewRequest.proposalId,
      status: totalSegmentMatches ? "matches_found" : "no_matches",
      ...shelfPreviewCorpus,
      queryForms: previewRequest.queryForms,
      queryMode: previewRequest.queryMode,
      totalSegmentMatches,
      totalDocumentMatches,
      basketMatches: baskets.results.map((row) => ({
        basket: row.basket,
        segmentMatches: Number(row.segment_matches),
        documentMatches: Number(row.document_matches),
      })),
      samples: samples.results.map((row) => ({
        segmentId: row.segment_id,
        documentId: row.document_id,
        author: row.author || "Author not stated",
        workTitle: row.work_title || "Untitled work",
        citationLabel: row.citation_label || "Citation in source XML",
        snippet: row.snippet,
        sourceUrl: safeSourceUrl(row.source_url),
        sourceSha256: row.source_sha256,
        rightsStatement: row.rights_statement || "Rights statement unavailable",
      })),
      notice:
        "These are raw diagnostic examples from distinct works where possible, not relevance judgments. No matches on this shelf would not prove historical absence.",
      orthographicMatching:
        "Literal query-time expansion is insensitive to u/v and i/j and to case. It does not yet fold ae/e or oe/e, strip diacritics, split enclitics, or lemmatize.",
      shelfReceipt: {
        sourceCommit: receipt.get("source_commit")!,
        contentSha256: receipt.get("content_sha256")!,
      },
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: "The Latin shelf is not available to this copy of the archive yet. The proposal is unchanged.",
        code: "shelf_unavailable",
      },
      { status: 503 },
    );
  }
}
