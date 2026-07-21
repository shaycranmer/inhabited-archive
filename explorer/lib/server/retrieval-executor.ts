import type { AdaptationProposal, BadgerAdaptationPlan } from "../adaptation-plan";
import type { QueryWorkspace } from "../query-plan";
import {
  MAX_SOURCE_UNITS_PER_CANDIDATE,
  canonicalJson,
  cleanParentRunId,
  compileRetrievalPlan,
  deduplicateAndRankHits,
  executionPacketForHash,
  sha256Hex,
  type CandidateReadingUnit,
  type CandidateSourceUnit,
  type RawRetrievalHit,
  type RetrievalRun,
  type TranslationPreference,
} from "../retrieval-run";
import { literalShelfQuery, shelfPreviewCorpus } from "../shelf-preview";
import type { ArchiveD1Database } from "./archive-db";
import {
  applyCatalogueScope,
  type CatalogueWork,
} from "../catalogue-scope";

const MATCHES_PER_PROPOSAL = 14;

type ReceiptRow = { key: string; value: string };

type CatalogueRow = {
  document_id: string;
  work_urn: string;
  author: string | null;
  work_title: string | null;
  composition_start_year: number;
  composition_end_year: number;
  date_label: string;
  date_certainty: string;
  genre_tags_json: string;
  tradition_tags_json: string;
  scope_note: string;
};

type RetrievalRow = {
  segment_id: string;
  document_id: string;
  sequence_number: number;
  segment_type: string;
  citation_label: string | null;
  text: string;
  author: string | null;
  work_title: string | null;
  source_url: string | null;
  source_sha256: string;
  rights_statement: string | null;
  basket: string;
  lexical_rank: number | null;
};

type SourceUnitRow = {
  segment_id: string;
  document_id: string;
  sequence_number: number;
  citation_label: string | null;
  text: string;
};

type VerifiedUnitRow = SourceUnitRow & { source_sha256: string };

async function readCorpusReceipt(db: ArchiveD1Database) {
  const rows = await db.prepare(
    `SELECT key, value FROM shelf_receipt
     WHERE key IN ('corpus_id', 'source_commit', 'content_sha256', 'catalogue_scope_sha256')`,
  ).all<ReceiptRow>();
  const receipt = new Map(rows.results.map((row) => [row.key, row.value]));
  if (
    receipt.get("corpus_id") !== shelfPreviewCorpus.corpusId ||
    !receipt.get("source_commit") ||
    !receipt.get("content_sha256") ||
    !receipt.get("catalogue_scope_sha256")
  ) {
    throw new Error("The installed shelf does not have the complete provenance receipt required for retrieval.");
  }
  return {
    corpusId: receipt.get("corpus_id")!,
    sourceCommit: receipt.get("source_commit")!,
    contentSha256: receipt.get("content_sha256")!,
    catalogueScopeSha256: receipt.get("catalogue_scope_sha256")!,
  };
}

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function readCatalogueWorks(db: ArchiveD1Database): Promise<CatalogueWork[]> {
  const rows = await db.prepare(
    `SELECT p.document_id,
            p.work_urn,
            d.author,
            d.title AS work_title,
            c.composition_start_year,
            c.composition_end_year,
            c.date_label,
            c.date_certainty,
            c.genre_tags_json,
            c.tradition_tags_json,
            c.scope_note
     FROM perseus_latin_documents p
     JOIN documents d ON d.document_id = p.document_id
     JOIN work_catalogue_scope c ON c.work_urn = p.work_urn
     ORDER BY p.shelf_order`,
  ).all<CatalogueRow>();
  if (rows.results.length !== 30) {
    throw new Error("The installed demonstration shelf is missing its reviewed thirty-work scope catalogue.");
  }
  return rows.results.map((row) => ({
    documentId: row.document_id,
    workUrn: row.work_urn,
    author: row.author || "Author not stated",
    workTitle: row.work_title || "Untitled work",
    compositionStartYear: Number(row.composition_start_year),
    compositionEndYear: Number(row.composition_end_year),
    dateLabel: row.date_label,
    dateCertainty: row.date_certainty,
    genreTags: parseTags(row.genre_tags_json),
    traditionTags: parseTags(row.tradition_tags_json),
    scopeNote: row.scope_note,
  }));
}

function snapshotLanguagePlan(plan: BadgerAdaptationPlan): BadgerAdaptationPlan {
  const snapshotProposal = (proposal: AdaptationProposal) => {
    const snapshot = { ...proposal };
    delete snapshot.shelfPreview;
    return snapshot;
  };
  return {
    ...plan,
    folios: plan.folios.map((folio) => ({
      ...folio,
      proposals: folio.proposals.map(snapshotProposal),
    })),
  };
}

async function retrieveProposalHits(
  db: ArchiveD1Database,
  proposal: ReturnType<typeof compileRetrievalPlan>["positiveProposals"][number],
  eligibleDocumentIds: string[],
  catalogueByDocument: Map<string, CatalogueWork>,
) {
  if (!eligibleDocumentIds.length) return [];
  const ftsQuery = literalShelfQuery(proposal.queryForms, "any");
  const documentPlaceholders = eligibleDocumentIds.map(() => "?").join(", ");
  const rows = await db.prepare(
    `SELECT s.segment_id,
            s.document_id,
            s.sequence_number,
            s.segment_type,
            s.citation_label,
            s.text,
            d.author,
            d.title AS work_title,
            d.source_url,
            d.source_sha256,
            d.rights_statement,
            p.basket,
            bm25(segment_search) AS lexical_rank
     FROM segment_search
     JOIN segments s ON s.rowid = segment_search.rowid
     JOIN documents d ON d.document_id = s.document_id
     JOIN perseus_latin_documents p ON p.document_id = s.document_id
     WHERE segment_search MATCH ?
       AND s.segment_type != 'editorial_note'
       AND s.document_id IN (${documentPlaceholders})
     ORDER BY lexical_rank, p.shelf_order, s.sequence_number
     LIMIT ?`,
  ).bind(ftsQuery, ...eligibleDocumentIds, MATCHES_PER_PROPOSAL).all<RetrievalRow>();

  return rows.results.map((row): RawRetrievalHit => {
    const catalogue = catalogueByDocument.get(row.document_id);
    if (!catalogue) throw new Error("A retrieved work is missing its reviewed catalogue metadata.");
    return {
      segmentId: row.segment_id,
      documentId: row.document_id,
      sequenceNumber: Number(row.sequence_number),
      segmentType: row.segment_type,
      citationLabel: row.citation_label || "Citation in source XML",
      text: row.text,
      author: row.author || "Author not stated",
      workTitle: row.work_title || "Untitled work",
      sourceUrl: row.source_url || "",
      sourceSha256: row.source_sha256,
      rightsStatement: row.rights_statement || "Rights statement unavailable",
      basket: row.basket,
      compositionDateLabel: catalogue.dateLabel,
      dateCertainty: catalogue.dateCertainty,
      genreTags: catalogue.genreTags,
      traditionTags: catalogue.traditionTags,
      lexicalRank: Number(row.lexical_rank ?? 0),
      attribution: proposal,
    };
  });
}

async function contextForCandidate(
  db: ArchiveD1Database,
  seed: ReturnType<typeof deduplicateAndRankHits>["selected"][number],
) {
  const start = Math.max(1, seed.startSequence - 1);
  const end = seed.endSequence + 1;
  const rows = await db.prepare(
    `SELECT segment_id, document_id, sequence_number, citation_label, text
     FROM segments
     WHERE document_id = ?
       AND sequence_number BETWEEN ? AND ?
       AND segment_type != 'editorial_note'
     ORDER BY sequence_number
     LIMIT ?`,
  ).bind(seed.documentId, start, end, MAX_SOURCE_UNITS_PER_CANDIDATE).all<SourceUnitRow>();
  const matched = new Set(seed.matchedSegmentIds);
  return rows.results.map((row): CandidateSourceUnit => ({
    segmentId: row.segment_id,
    sequenceNumber: Number(row.sequence_number),
    citationLabel: row.citation_label || "Citation in source XML",
    text: row.text,
    matched: matched.has(row.segment_id),
  }));
}

function citationForUnits(units: CandidateSourceUnit[]) {
  const citations = [...new Set(units.map((unit) => unit.citationLabel).filter(Boolean))];
  if (!citations.length) return "Citation in source XML";
  return citations.length === 1 ? citations[0] : `${citations[0]} – ${citations.at(-1)}`;
}

export async function executeApprovedRetrieval(args: {
  db: ArchiveD1Database;
  question: string;
  workspace: QueryWorkspace;
  plan: BadgerAdaptationPlan;
  translationPreference: TranslationPreference;
  parentRunId?: unknown;
}) {
  const compiledPlan = compileRetrievalPlan(args.workspace, args.plan);
  const corpusReceipt = await readCorpusReceipt(args.db);
  if (compiledPlan.corpusId !== corpusReceipt.corpusId) {
    throw new Error("The approved language plan names a different corpus than the attached shelf.");
  }

  const catalogueWorks = await readCatalogueWorks(args.db);
  const catalogueSelection = applyCatalogueScope(catalogueWorks, args.workspace);
  const eligibleDocumentIds = catalogueSelection.eligibleWorks.map((work) => work.documentId);
  const catalogueByDocument = new Map(catalogueWorks.map((work) => [work.documentId, work]));

  const hits: RawRetrievalHit[] = [];
  const skippedProposalIds: string[] = [];
  for (const proposal of compiledPlan.positiveProposals) {
    try {
      hits.push(...await retrieveProposalHits(
        args.db,
        proposal,
        eligibleDocumentIds,
        catalogueByDocument,
      ));
    } catch {
      skippedProposalIds.push(proposal.id);
    }
  }
  if (!hits.length && skippedProposalIds.length === compiledPlan.positiveProposals.length) {
    throw new Error("None of the approved proposal branches could become a safe literal shelf query.");
  }

  const ranked = deduplicateAndRankHits(hits, compiledPlan, args.workspace);
  const candidates: CandidateReadingUnit[] = [];
  for (const [index, seed] of ranked.selected.entries()) {
    const sourceUnits = await contextForCandidate(args.db, seed);
    if (!sourceUnits.length) continue;
    candidates.push({
      candidateId: `candidate-${String(index + 1).padStart(3, "0")}`,
      documentId: seed.documentId,
      author: seed.author,
      workTitle: seed.workTitle,
      citationLabel: citationForUnits(sourceUnits),
      languageCode: compiledPlan.languageCode,
      languageLabel: compiledPlan.languageLabel,
      basket: seed.basket,
      compositionDateLabel: seed.compositionDateLabel,
      dateCertainty: seed.dateCertainty,
      genreTags: seed.genreTags,
      traditionTags: seed.traditionTags,
      sourceUrl: seed.sourceUrl,
      sourceSha256: seed.sourceSha256,
      rightsStatement: seed.rightsStatement,
      sourceUnits,
      matchedSegmentIds: seed.matchedSegmentIds.filter((id) =>
        sourceUnits.some((unit) => unit.segmentId === id)
      ),
      matchAttributions: seed.matchAttributions,
      exclusionSignals: seed.exclusionSignals,
      relationshipIds: seed.relationshipIds,
      deterministicScore: seed.deterministicScore,
      retrievalRank: candidates.length + 1,
    });
  }

  const languagePlanSnapshot = snapshotLanguagePlan(args.plan);
  const parentRunId = cleanParentRunId(args.parentRunId);
  const hashes = {
    inquirySha256: await sha256Hex(args.workspace),
    languagePlanSha256: await sha256Hex(languagePlanSnapshot),
    candidatePacketSha256: await sha256Hex(candidates),
    executionPacketSha256: "",
  };
  const runId = `retrieval_${hashes.candidatePacketSha256.slice(0, 12)}_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const limitations = [
    ...compiledPlan.limitations,
    ...(skippedProposalIds.length
      ? [`${skippedProposalIds.length} proposal branches could not become safe bounded literal queries and were recorded as unexecuted.`]
      : []),
  ];
  const stats = {
    executedProposalCount: compiledPlan.positiveProposals.length - skippedProposalIds.length,
    rawMatchCount: hits.length,
    deduplicatedCandidateCount: ranked.seeds.length,
    returnedCandidateCount: candidates.length,
  };
  hashes.executionPacketSha256 = await sha256Hex(executionPacketForHash({
    runId,
    createdAt,
    question: args.question,
    translationPreference: args.translationPreference,
    parentRunId,
    inquirySnapshot: args.workspace,
    languagePlanSnapshot,
    compiledPlan,
    corpusReceipt,
    catalogueScope: catalogueSelection.receipt,
    candidates,
    stats,
    limitations,
  }));

  return {
    contractVersion: "retrieval-run-v1",
    runId,
    parentRunId,
    createdAt,
    question: args.question,
    translationPreference: args.translationPreference,
    inquirySnapshot: structuredClone(args.workspace),
    languagePlanSnapshot,
    compiledPlan,
    corpusReceipt,
    catalogueScope: catalogueSelection.receipt,
    hashes,
    stats,
    candidates,
    limitations,
  } satisfies RetrievalRun;
}

export async function verifyRetrievalRunAgainstShelf(
  db: ArchiveD1Database,
  run: RetrievalRun,
) {
  const receipt = await readCorpusReceipt(db);
  if (canonicalJson(receipt) !== canonicalJson(run.corpusReceipt)) {
    throw new Error("The retrieval run belongs to a different shelf receipt.");
  }
  if (
    await sha256Hex(run.inquirySnapshot) !== run.hashes.inquirySha256 ||
    await sha256Hex(run.languagePlanSnapshot) !== run.hashes.languagePlanSha256 ||
    await sha256Hex(run.candidates) !== run.hashes.candidatePacketSha256 ||
    await sha256Hex(executionPacketForHash(run)) !== run.hashes.executionPacketSha256
  ) {
    throw new Error("The retrieval run changed after its reproducibility hashes were issued.");
  }

  const units = run.candidates.flatMap((candidate) =>
    candidate.sourceUnits.map((unit) => ({ ...unit, documentId: candidate.documentId, sourceSha256: candidate.sourceSha256 }))
  );
  if (!units.length) return true;
  const placeholders = units.map(() => "?").join(", ");
  const rows = await db.prepare(
    `SELECT s.segment_id, s.document_id, s.sequence_number, s.citation_label, s.text, d.source_sha256
     FROM segments s
     JOIN documents d ON d.document_id = s.document_id
     WHERE s.segment_id IN (${placeholders})`,
  ).bind(...units.map((unit) => unit.segmentId)).all<VerifiedUnitRow>();
  const verified = new Map(rows.results.map((row) => [row.segment_id, row]));
  if (verified.size !== units.length) {
    throw new Error("At least one candidate source unit is missing from the attached shelf.");
  }
  units.forEach((unit) => {
    const row = verified.get(unit.segmentId);
    if (
      !row ||
      row.document_id !== unit.documentId ||
      row.text !== unit.text ||
      row.source_sha256 !== unit.sourceSha256
    ) {
      throw new Error(`Candidate source unit ${unit.segmentId} no longer matches the attached shelf.`);
    }
  });
  return true;
}
