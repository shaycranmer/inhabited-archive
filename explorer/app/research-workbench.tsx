"use client";

import { useEffect, useRef, useState } from "react";
import {
  attachShelfPreview,
  summarizeFolio,
  type AdaptationProposal,
  type BadgerAdaptationPlan,
  type BadgerPendingResponse,
  type BadgerResponse,
  type ShelfPreview,
} from "../lib/adaptation-plan";
import type { ShelfPreviewResponse } from "../lib/shelf-preview";
import {
  candidateForJudgment,
  translationForCandidate,
  type OwlPendingResponse,
  type OwlResponse,
  type OwlRunRecord,
  type TranslationAddendum,
} from "../lib/owl-adjudication";
import type {
  RetrievalRun,
  TranslationPreference,
} from "../lib/retrieval-run";
import {
  documentedQuestion,
  documentedWorkspace,
  unresolvedCatalogueConstraint,
  type BoundaryCard,
  type ConceptFamily,
  type ConceptRelationship,
  type ConceptTerm,
  type ExplorerResponse,
  type QueryWorkspace,
} from "../lib/query-plan";

function catalogueConstraintSummary(card: BoundaryCard) {
  const constraint = card.catalogueConstraint;
  if (constraint.status === "needs_clarification") return constraint.interpretation;
  if (constraint.status === "not_catalogue_filter") return constraint.interpretation;
  return constraint.interpretation || "Resolved catalogue boundary.";
}

type ConversationTurn = {
  id: string;
  speaker: "fox" | "scholar";
  text: string;
  cardId?: string;
  cardTitle?: string;
};

type SetAsideItem =
  | {
      id: string;
      kind: "term";
      term: ConceptTerm;
      originFamilyId: string;
      originFamilyTitle: string;
    }
  | { id: string; kind: "family"; family: ConceptFamily }
  | { id: string; kind: "scope" | "exclusion"; card: BoundaryCard };

type Receipt = {
  message: string;
  viewCardId?: string;
  previousWorkspace: QueryWorkspace;
  previousPile: SetAsideItem[];
};

type BoundaryKind = "scope" | "exclusion";

type BoundaryDraft = {
  kind: BoundaryKind;
  id: string;
  label: string;
  rationale: string;
};

type ProposalDraft = {
  proposalId: string;
  sourceLanguageExpression: string;
  englishSense: string;
  rationale: string;
  searchForms: string;
};

type OwlStage = "retrieving" | "starting" | "queued" | "in_progress";

const initialWorkspace = documentedWorkspace();

const revisionLoadingNotes = [
  "The fox is reconsidering the table. Nothing will move until his revision is ready.",
  "He’s checking which cards your change touches—and which it should leave alone.",
  "A little reshuffling. The present map remains safe until the new one is ready.",
];

const badgerLoadingNotes = [
  "Each fox card is being adapted into a source-language folio.",
  "Direct wording is being separated from looser historical associations.",
  "Broad source-language words are being asked to explain themselves.",
  "Word forms a literal catalogue might otherwise miss are being listed.",
  "Likely false positives are being recorded before they can look impressive.",
  "Your approved fox table remains fixed while the folios take shape.",
];

const categoryLabels = {
  lexical_translation: "Direct wording",
  morphological_expansion: "Word-form expansion",
  historical_semantic_expansion: "Historical meaning",
  conceptual_association: "Exploratory association",
  exclusion_rule: "Keep-out rule",
  uncertainty: "Uncertainty",
} as const;

const effectLabels = {
  include: "Include",
  demote: "Use cautiously",
  exclude: "Keep matching passages out",
  disclose_only: "Disclosure only",
} as const;

const confidenceLabels = {
  secure: "Well-supported wording",
  probable: "Promising wording",
  speculative: "Exploratory wording",
} as const;

function FoxLoadingVignette({ compact = false }: { compact?: boolean }) {
  const notes = revisionLoadingNotes;
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNoteIndex((current) => (current + 1) % notes.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [notes.length]);

  return (
    <div className={`fox-loading-vignette ${compact ? "compact" : ""}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="catalogue-motion" aria-hidden="true">
        <span className="catalogue-drawer" />
        <span className="catalogue-card card-one" />
        <span className="catalogue-card card-two" />
        <span className="catalogue-thread" />
      </div>
      <div>
        <span>The table stays put</span>
        <p key={noteIndex}>{notes[noteIndex]}</p>
      </div>
    </div>
  );
}

function FoxThinkingTurn({ firstReply = false }: { firstReply?: boolean }) {
  return (
    <article className="fox-turn fox fox-thinking-turn" role="status" aria-live="polite">
      <div className="fox-turn-meta"><strong>The fox</strong><span>Thinking with you</span></div>
      <p>
        {firstReply
          ? "One moment. I’m listening for the shape of the question before we make any cards."
          : "Let me think that through before I answer."}
        <span className="thinking-dots" aria-hidden="true"><i /><i /><i /></span>
      </p>
    </article>
  );
}

function BadgerLoadingVignette({ status }: { status: "starting" | "queued" | "in_progress" }) {
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNoteIndex((current) => (current + 1) % badgerLoadingNotes.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="badger-loading-vignette" role="status" aria-live="polite" aria-atomic="true">
      <div className="folio-motion" aria-hidden="true">
        <span className="folio-sheet folio-sheet-one" />
        <span className="folio-sheet folio-sheet-two" />
      </div>
      <div>
        <span>{status === "starting"
          ? "The language desk is opening"
          : status === "queued"
            ? "The badger has your folios in the queue"
            : "The language desk is working"}</span>
        <p key={noteIndex}>{badgerLoadingNotes[noteIndex]}</p>
        <small>
          This can take several minutes—usually 3–5. The badger is drafting and checking the language plan—not
          searching the corpus yet. The app is checking back without holding one fragile connection open.
          Your approved fox table will not change. Optional literal shelf checks happen later, only when you ask for them.
        </small>
      </div>
    </div>
  );
}

function ShelfPreviewResult({
  preview,
  languageLabel,
}: {
  preview: ShelfPreview;
  languageLabel: string;
}) {
  return (
    <section className={`shelf-preview-result ${preview.status}`} aria-label="Diagnostic shelf preview">
      <header>
        <div>
          <span>Literal coverage check · not your inquiry results</span>
          <strong>
            {preview.totalSegmentMatches.toLocaleString()} passages across{" "}
            {preview.totalDocumentMatches.toLocaleString()} works
          </strong>
        </div>
        <small>{preview.queryForms.join(" · ")}</small>
      </header>

      <p className="shelf-coverage-explanation">
        These exact forms appear in the counts above. Full retrieval will combine your
        approved concepts, relationships, scope, and exclusions before the owl judges
        which passages may actually answer your question.
      </p>

      {preview.basketMatches?.length ? (
        <div className="shelf-baskets" aria-label="Matches by shelf basket">
          {preview.basketMatches.map((basket) => (
            <span key={basket.basket}>
              <b>{basket.segmentMatches.toLocaleString()}</b>{" "}
              {basket.basket.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      ) : null}

      {preview.samples.length ? (
        <details className="shelf-sample-disclosure">
          <summary>Inspect sample occurrences — most useful if you read {languageLabel}</summary>
          <div className="shelf-samples">
            {preview.samples.map((sample) => (
              <article key={sample.segmentId}>
                <span>{sample.author} · {sample.workTitle} · {sample.citationLabel}</span>
                <p>{sample.snippet}</p>
                <div>
                  {sample.sourceUrl ? (
                    <a href={sample.sourceUrl} target="_blank" rel="noreferrer">Inspect source ↗</a>
                  ) : null}
                  <small title={sample.sourceSha256}>Source receipt {sample.sourceSha256.slice(0, 12)}…</small>
                </div>
              </article>
            ))}
          </div>
        </details>
      ) : (
        <p className="shelf-empty">No literal matches appeared on this selective shelf.</p>
      )}

      <details>
        <summary>What this check can—and cannot—tell you</summary>
        <p>{preview.notice}</p>
        {preview.orthographicMatching ? <p>{preview.orthographicMatching}</p> : null}
        {preview.shelfReceipt ? (
          <p>
            Shelf receipt: source commit {preview.shelfReceipt.sourceCommit.slice(0, 12)}… ·
            content {preview.shelfReceipt.contentSha256.slice(0, 12)}…
          </p>
        ) : null}
      </details>
    </section>
  );
}

function OwlWaitingVignette({ stage }: { stage: OwlStage }) {
  const copy = {
    retrieving: {
      label: "Searching the declared shelf",
      text: "The application is executing the approved folios and gathering literal candidates. No relevance judgment has run yet.",
    },
    starting: {
      label: "Preparing the owl’s evidence packet",
      text: "Overlapping passages are becoming bounded reading units while the fox map, language folios, and source receipts remain attached.",
    },
    queued: {
      label: "The owl has your passages in the queue",
      text: "The complete inquiry snapshot is fixed. The app is checking a background receipt without changing the retrieved texts.",
    },
    in_progress: {
      label: "The owl is comparing the passages to your question",
      text: "He is checking relationships, uncertainty, quotation, and incidental matches before arranging a reading list.",
    },
  }[stage];
  return (
    <div className="owl-waiting" data-stage={stage} role="status" aria-live="polite" aria-atomic="true">
      <div className="owl-waiting-mark" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <span>{copy.label}</span>
        <p>{copy.text}</p>
        <small>The original question, approved folios, candidate IDs, and corpus receipt travel together.</small>
      </div>
    </div>
  );
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("en");
}

function describeFox(workspace: QueryWorkspace) {
  return `${workspace.foxReply}\n\n${workspace.nextQuestion}`;
}

function initialConversation(): ConversationTurn[] {
  return [
    {
      id: "demo-scholar",
      speaker: "scholar",
      text: documentedQuestion,
    },
    {
      id: "demo-fox",
      speaker: "fox",
      text: describeFox(initialWorkspace),
    },
  ];
}

function setAsideLabel(item: SetAsideItem) {
  if (item.kind === "term") return item.term.label;
  if (item.kind === "family") return item.family.title;
  return item.card.label;
}

function mergeWorkspace(
  previous: QueryWorkspace,
  incoming: QueryWorkspace,
  pile: SetAsideItem[],
) {
  const forbidden = new Set(pile.map((item) => normalized(setAsideLabel(item))));
  const removed: SetAsideItem[] = [];
  const matchedPreviousFamilyIds = new Set<string>();

  const conceptFamilies = incoming.conceptFamilies.flatMap((nextFamily) => {
    const oldFamily = previous.conceptFamilies.find(
      (family) => normalized(family.title) === normalized(nextFamily.title),
    );
    if (!oldFamily) {
      if (forbidden.has(normalized(nextFamily.title))) return [];
      return [nextFamily];
    }

    matchedPreviousFamilyIds.add(oldFamily.id);
    if (oldFamily.pinned) return [oldFamily];

    const matchedOldTermIds = new Set<string>();
    const terms = nextFamily.terms.flatMap((nextTerm) => {
      const oldTerm = oldFamily.terms.find(
        (term) => normalized(term.label) === normalized(nextTerm.label),
      );
      if (oldTerm) {
        matchedOldTermIds.add(oldTerm.id);
        return [{
          ...nextTerm,
          id: oldTerm.id,
          pinned: oldTerm.pinned,
          inquiryFocus: oldTerm.inquiryFocus,
          origin: oldTerm.origin,
        }];
      }
      if (forbidden.has(normalized(nextTerm.label))) return [];
      return [nextTerm];
    });

    oldFamily.terms.forEach((oldTerm) => {
      if (matchedOldTermIds.has(oldTerm.id)) return;
      if (oldTerm.pinned || oldTerm.inquiryFocus || oldTerm.origin === "scholar") {
        terms.push(oldTerm);
      } else if (!forbidden.has(normalized(oldTerm.label))) {
        removed.push({
          id: makeId("aside-term"),
          kind: "term",
          term: oldTerm,
          originFamilyId: oldFamily.id,
          originFamilyTitle: oldFamily.title,
        });
      }
    });

    return [{
      ...nextFamily,
      id: oldFamily.id,
      pinned: oldFamily.pinned,
      inquiryFocus: oldFamily.inquiryFocus,
      origin: oldFamily.origin,
      terms,
    }];
  });

  previous.conceptFamilies.forEach((oldFamily) => {
    if (matchedPreviousFamilyIds.has(oldFamily.id)) return;
    if (oldFamily.pinned || oldFamily.inquiryFocus || oldFamily.origin === "scholar") {
      conceptFamilies.push(oldFamily);
    } else if (!forbidden.has(normalized(oldFamily.title))) {
      removed.push({ id: makeId("aside-family"), kind: "family", family: oldFamily });
    }
  });

  const activeFamilyTitles = new Set(conceptFamilies.map((family) => normalized(family.title)));

  function mergeBoundaries(
    oldCards: BoundaryCard[],
    newCards: BoundaryCard[],
    kind: "scope" | "exclusion",
  ) {
    const matched = new Set<string>();
    const cards = newCards.flatMap((nextCard) => {
      const oldCard = oldCards.find((card) => normalized(card.label) === normalized(nextCard.label));
      if (oldCard) {
        matched.add(oldCard.id);
        return [{
          ...nextCard,
          id: oldCard.id,
          pinned: oldCard.pinned,
          origin: oldCard.origin,
        }];
      }
      if (forbidden.has(normalized(nextCard.label))) return [];
      return [nextCard];
    });
    oldCards.forEach((card) => {
      if (matched.has(card.id)) return;
      if (card.pinned || card.origin === "scholar") cards.push(card);
      else if (!forbidden.has(normalized(card.label))) {
        removed.push({ id: makeId(`aside-${kind}`), kind, card });
      }
    });
    return cards;
  }

  const matchedRelationshipIds = new Set<string>();
  const relationships = incoming.relationships.flatMap((nextRelationship) => {
    const oldRelationship = previous.relationships.find(
      (relationship) =>
        normalized(relationship.sourceTitle) === normalized(nextRelationship.sourceTitle) &&
        normalized(relationship.targetTitle) === normalized(nextRelationship.targetTitle),
    );
    if (!oldRelationship) return [nextRelationship];
    matchedRelationshipIds.add(oldRelationship.id);
    if (oldRelationship.pinned || oldRelationship.origin === "scholar") return [oldRelationship];
    return [{
      ...nextRelationship,
      id: oldRelationship.id,
      pinned: oldRelationship.pinned,
      origin: oldRelationship.origin,
    }];
  });
  previous.relationships.forEach((relationship) => {
    if (
      !matchedRelationshipIds.has(relationship.id) &&
      (relationship.pinned || relationship.origin === "scholar")
    ) {
      relationships.push(relationship);
    }
  });

  return {
    workspace: {
      ...incoming,
      conceptFamilies,
      relationships: relationships.filter(
        (relationship) =>
          activeFamilyTitles.has(normalized(relationship.sourceTitle)) &&
          activeFamilyTitles.has(normalized(relationship.targetTitle)),
      ),
      scopeChoices: mergeBoundaries(previous.scopeChoices, incoming.scopeChoices, "scope"),
      exclusions: mergeBoundaries(previous.exclusions, incoming.exclusions, "exclusion"),
    },
    removed,
  };
}

export function ResearchWorkbench() {
  const [question, setQuestion] = useState(documentedQuestion);
  const [workspace, setWorkspace] = useState<QueryWorkspace>(initialWorkspace);
  const [conversation, setConversation] = useState<ConversationTurn[]>(initialConversation);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [inquiryStarted, setInquiryStarted] = useState(false);
  const [tableVisible, setTableVisible] = useState(false);
  const [notice, setNotice] = useState(
    "For live queries, add an OpenAI API key to this local app. You can open the saved demonstration without one.",
  );
  const [focusedFamilyId, setFocusedFamilyId] = useState<string | null>(null);
  const [pile, setPile] = useState<SetAsideItem[]>([]);
  const [pileOpen, setPileOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [loadingTarget, setLoadingTarget] = useState<"question" | "conversation" | string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [boundaryDraft, setBoundaryDraft] = useState<BoundaryDraft | null>(null);
  const [newBoundary, setNewBoundary] = useState<Record<BoundaryKind, string>>({
    scope: "",
    exclusion: "",
  });
  const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);
  const [relationshipValue, setRelationshipValue] = useState("");
  const [newRelationshipLabel, setNewRelationshipLabel] = useState("");
  const [newRelationshipTarget, setNewRelationshipTarget] = useState("");
  const [cardOrder, setCardOrder] = useState<string[]>(
    initialWorkspace.conceptFamilies.map((family) => family.id),
  );
  const [draggingFamilyId, setDraggingFamilyId] = useState<string | null>(null);
  const [mapApproved, setMapApproved] = useState(false);
  const [badgerPlan, setBadgerPlan] = useState<BadgerAdaptationPlan | null>(null);
  const [badgerLoading, setBadgerLoading] = useState(false);
  const [badgerJobStatus, setBadgerJobStatus] = useState<"starting" | "queued" | "in_progress">("starting");
  const [badgerError, setBadgerError] = useState("");
  const [expandedFolioIds, setExpandedFolioIds] = useState<string[]>([]);
  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [shelfPreviewLoadingId, setShelfPreviewLoadingId] = useState<string | null>(null);
  const [shelfPreviewErrors, setShelfPreviewErrors] = useState<Record<string, string>>({});
  const [translationPreference, setTranslationPreference] = useState<TranslationPreference>("auto_strong");
  const [owlRuns, setOwlRuns] = useState<OwlRunRecord[]>([]);
  const [activeOwlRunId, setActiveOwlRunId] = useState<string | null>(null);
  const [owlStage, setOwlStage] = useState<OwlStage | null>(null);
  const [owlError, setOwlError] = useState("");
  const [translationLoadingId, setTranslationLoadingId] = useState<string | null>(null);
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});
  const [librarianPetted, setLibrarianPetted] = useState(false);
  const badgerAbortRef = useRef<AbortController | null>(null);
  const owlAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    badgerAbortRef.current?.abort();
    owlAbortRef.current?.abort();
  }, []);

  function commit(
    nextWorkspace: QueryWorkspace,
    nextPile: SetAsideItem[],
    message: string,
    viewCardId?: string,
  ) {
    badgerAbortRef.current?.abort();
    badgerAbortRef.current = null;
    owlAbortRef.current?.abort();
    owlAbortRef.current = null;
    setReceipt({
      message,
      viewCardId,
      previousWorkspace: workspace,
      previousPile: pile,
    });
    setWorkspace(nextWorkspace);
    setPile(nextPile);
    setMapApproved(false);
    setBadgerPlan(null);
    setBadgerLoading(false);
    setBadgerJobStatus("starting");
    setBadgerError("");
    setExpandedFolioIds([]);
    setProposalDraft(null);
    setShelfPreviewLoadingId(null);
    setShelfPreviewErrors({});
    setOwlStage(null);
    setOwlError("");
  }

  function undoReceipt() {
    if (!receipt) return;
    setWorkspace(receipt.previousWorkspace);
    setPile(receipt.previousPile);
    setReceipt(null);
  }

  function viewCard(cardId: string) {
    setPileOpen(false);
    setFocusedFamilyId(cardId);
    requestAnimationFrame(() => {
      document.getElementById(cardId)?.focus();
    });
  }

  async function beginInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    const scholarTurn: ConversationTurn = {
      id: makeId("turn"),
      speaker: "scholar",
      text: question.trim(),
    };
    setInquiryStarted(true);
    setTableVisible(false);
    setConversation([scholarTurn]);
    setLoadingTarget("question");
    setError("");
    setNotice("The fox is listening. No concept table is visible yet.");
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", question }),
      });
      const result = (await response.json()) as ExplorerResponse & { error?: string; code?: string };
      if (!response.ok) throw new Error(result.error || "The fox could not begin the inquiry.");
      setWorkspace(result.workspace);
      setCardOrder(result.workspace.conceptFamilies.map((family) => family.id));
      setConversation([
        scholarTurn,
        { id: makeId("turn"), speaker: "fox", text: describeFox(result.workspace) },
      ]);
      setMode("live");
      setInquiryStarted(true);
      setNotice(result.notice);
      setPile([]);
      setReceipt(null);
      setFocusedFamilyId(null);
      setMapApproved(false);
      setBadgerPlan(null);
      setBadgerError("");
      setExpandedFolioIds([]);
      setShelfPreviewLoadingId(null);
      setShelfPreviewErrors({});
      setOwlRuns([]);
      setActiveOwlRunId(null);
      setOwlStage(null);
      setOwlError("");
      setTranslationLoadingId(null);
      setTranslationErrors({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fox could not begin the inquiry.");
      setNotice("The live inquiry did not begin. You can return to the question or open the clearly labeled saved example.");
    } finally {
      setLoadingTarget(null);
    }
  }

  async function continueConversation(
    message: string,
    focusFamily: ConceptFamily | null,
  ) {
    const trimmed = message.trim();
    if (!trimmed) return;
    const target = focusFamily?.id || "conversation";
    setLoadingTarget(target);
    setError("");
    const scholarTurn: ConversationTurn = {
      id: makeId("turn"),
      speaker: "scholar",
      text: trimmed,
      cardId: focusFamily?.id,
      cardTitle: focusFamily?.title,
    };
    const nextConversation = [...conversation, scholarTurn];
    setConversation(nextConversation);
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine",
          question,
          message: trimmed,
          focusCardTitle: focusFamily?.title,
          conversation: nextConversation.map(({ speaker, text, cardTitle }) => ({
            speaker,
            text,
            cardTitle,
          })),
          workspace,
          setAsideLabels: pile.map(setAsideLabel),
        }),
      });
      const result = (await response.json()) as ExplorerResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "The fox could not revise the table.");

      const merged = mergeWorkspace(workspace, result.workspace, pile);
      setWorkspace(merged.workspace);
      setPile([...pile, ...merged.removed]);
      setMode("live");
      setInquiryStarted(true);
      setNotice(result.notice);
      setMapApproved(false);
      setBadgerPlan(null);
      setBadgerError("");
      setExpandedFolioIds([]);
      setShelfPreviewLoadingId(null);
      setShelfPreviewErrors({});
      setConversation([
        ...nextConversation,
        {
          id: makeId("turn"),
          speaker: "fox",
          text: describeFox(result.workspace),
          cardId: focusFamily?.id,
          cardTitle: focusFamily?.title,
        },
      ]);
      if (merged.removed.length) {
        setReceipt({
          message: `${merged.removed.length} earlier ${merged.removed.length === 1 ? "idea was" : "ideas were"} set aside.`,
          previousWorkspace: workspace,
          previousPile: pile,
          viewCardId: focusFamily?.id,
        });
      }
      setFollowUp("");
      setCardMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fox could not revise the table.");
    } finally {
      setLoadingTarget(null);
    }
  }

  function updateFamily(familyId: string, updater: (family: ConceptFamily) => ConceptFamily) {
    return {
      ...workspace,
      conceptFamilies: workspace.conceptFamilies.map((family) =>
        family.id === familyId ? updater(family) : family,
      ),
    };
  }

  function toggleFamilyPin(family: ConceptFamily) {
    const next = updateFamily(family.id, (current) => ({ ...current, pinned: !current.pinned }));
    commit(next, pile, `${family.title} ${family.pinned ? "unpinned" : "pinned against fox revision"}.`, family.id);
  }

  function toggleTermPin(family: ConceptFamily, term: ConceptTerm) {
    const next = updateFamily(family.id, (current) => ({
      ...current,
      terms: current.terms.map((item) =>
        item.id === term.id ? { ...item, pinned: !item.pinned } : item,
      ),
    }));
    commit(next, pile, `${term.label} ${term.pinned ? "unpinned" : "pinned"}.`, family.id);
  }

  function setInquiryFocus(family: ConceptFamily, term?: ConceptTerm) {
    const removingFocus = term ? term.inquiryFocus : family.inquiryFocus;
    const next = {
      ...workspace,
      conceptFamilies: workspace.conceptFamilies.map((candidate) => ({
        ...candidate,
        inquiryFocus: !removingFocus && !term && candidate.id === family.id,
        terms: candidate.terms.map((candidateTerm) => ({
          ...candidateTerm,
          inquiryFocus:
            !removingFocus && Boolean(term) && candidateTerm.id === term?.id,
        })),
      })),
    };
    const label = term?.label || family.title;
    commit(
      next,
      pile,
      removingFocus
        ? `${label} is no longer the Focus of Inquiry; the search remains broad.`
        : `${label} is now the Focus of Inquiry; the other ideas remain in play.`,
      family.id,
    );
  }

  function saveTermEdit(family: ConceptFamily, term: ConceptTerm) {
    const label = editingValue.trim();
    if (!label || label === term.label) {
      setEditingTermId(null);
      return;
    }
    const next = updateFamily(family.id, (current) => ({
      ...current,
      terms: current.terms.map((item) =>
        item.id === term.id
          ? { ...item, label, origin: "scholar", pinned: true }
          : item,
      ),
    }));
    commit(next, pile, `Changed ${term.label} to ${label} and pinned the scholar's wording.`, family.id);
    setEditingTermId(null);
  }

  function addTermToFamily(family: ConceptFamily) {
    const label = newTerm.trim();
    if (!label) return;
    const term: ConceptTerm = {
      id: makeId("scholar-term"),
      label,
      rationale: "Added directly by the scholar.",
      pinned: true,
      inquiryFocus: false,
      origin: "scholar",
    };
    const next = updateFamily(family.id, (current) => ({
      ...current,
      terms: [...current.terms, term],
    }));
    commit(next, pile, `Added and pinned ${label} inside ${family.title}.`, family.id);
    setNewTerm("");
  }

  function setAsideTerm(family: ConceptFamily, term: ConceptTerm) {
    const next = updateFamily(family.id, (current) => ({
      ...current,
      terms: current.terms.filter((item) => item.id !== term.id),
    }));
    const item: SetAsideItem = {
      id: makeId("aside-term"),
      kind: "term",
      term: { ...term, inquiryFocus: false, restored: false },
      originFamilyId: family.id,
      originFamilyTitle: family.title,
    };
    commit(next, [...pile, item], `${term.label} moved to the set-aside stack.`, family.id);
  }

  function setAsideFamily(family: ConceptFamily) {
    const inactiveFamily = {
      ...family,
      inquiryFocus: false,
      terms: family.terms.map((term) => ({ ...term, inquiryFocus: false })),
    };
    const next = {
      ...workspace,
      conceptFamilies: workspace.conceptFamilies.filter((item) => item.id !== family.id),
      relationships: workspace.relationships.filter(
        (relationship) =>
          relationship.sourceTitle !== family.title && relationship.targetTitle !== family.title,
      ),
    };
    commit(
      next,
      [...pile, { id: makeId("aside-family"), kind: "family", family: inactiveFamily }],
      `${family.title} moved to the set-aside stack.`,
    );
    setFocusedFamilyId(null);
  }

  function setAsideBoundary(kind: "scope" | "exclusion", card: BoundaryCard) {
    const key = kind === "scope" ? "scopeChoices" : "exclusions";
    const next = { ...workspace, [key]: workspace[key].filter((item) => item.id !== card.id) };
    commit(
      next,
      [...pile, { id: makeId(`aside-${kind}`), kind, card }],
      `${card.label} moved to the set-aside stack.`,
    );
  }

  function updateBoundary(
    kind: BoundaryKind,
    cardId: string,
    updater: (card: BoundaryCard) => BoundaryCard,
  ) {
    const key = kind === "scope" ? "scopeChoices" : "exclusions";
    return {
      ...workspace,
      [key]: workspace[key].map((card) => card.id === cardId ? updater(card) : card),
    };
  }

  function saveBoundaryEdit() {
    if (!boundaryDraft) return;
    const label = boundaryDraft.label.trim();
    const rationale = boundaryDraft.rationale.trim();
    if (!label || !rationale) return;
    const current = (boundaryDraft.kind === "scope"
      ? workspace.scopeChoices
      : workspace.exclusions).find((card) => card.id === boundaryDraft.id);
    if (!current) return;
    const next = updateBoundary(boundaryDraft.kind, boundaryDraft.id, (card) => ({
      ...card,
      label,
      rationale,
      catalogueConstraint: unresolvedCatalogueConstraint(
        `How should “${label}” become an exact catalogue boundary?`,
      ),
      pinned: true,
      origin: "scholar",
    }));
    commit(next, pile, `Changed ${current.label} and pinned the scholar's wording.`);
    setBoundaryDraft(null);
  }

  function toggleBoundaryPin(kind: BoundaryKind, card: BoundaryCard) {
    const next = updateBoundary(kind, card.id, (current) => ({
      ...current,
      pinned: !current.pinned,
    }));
    commit(next, pile, `${card.label} ${card.pinned ? "unpinned" : "pinned against fox revision"}.`);
  }

  function addBoundary(kind: BoundaryKind) {
    const label = newBoundary[kind].trim();
    if (!label) return;
    const card: BoundaryCard = {
      id: makeId(`scholar-${kind}`),
      label,
      rationale: kind === "scope"
        ? "Scope choice added directly by the scholar."
        : "Active exclusion added directly by the scholar.",
      catalogueConstraint: unresolvedCatalogueConstraint(
        `What exact catalogue boundary should “${label}” mean?`,
      ),
      pinned: true,
      origin: "scholar",
    };
    const key = kind === "scope" ? "scopeChoices" : "exclusions";
    commit(
      { ...workspace, [key]: [...workspace[key], card] },
      pile,
      `Added and pinned ${label} as ${kind === "scope" ? "a scope choice" : "an active exclusion"}.`,
    );
    setNewBoundary((current) => ({ ...current, [kind]: "" }));
  }

  function convertBoundary(kind: BoundaryKind, card: BoundaryCard) {
    const sourceKey = kind === "scope" ? "scopeChoices" : "exclusions";
    const destinationKey = kind === "scope" ? "exclusions" : "scopeChoices";
    const converted = { ...card, pinned: true, origin: "scholar" as const };
    commit(
      {
        ...workspace,
        [sourceKey]: workspace[sourceKey].filter((item) => item.id !== card.id),
        [destinationKey]: [...workspace[destinationKey], converted],
      },
      pile,
      kind === "scope"
        ? `${card.label} is now an active exclusion; matching material will be kept out.`
        : `${card.label} is now a scope choice; matching material is allowed back into consideration.`,
    );
  }

  function updateRelationship(
    relationshipId: string,
    updater: (relationship: ConceptRelationship) => ConceptRelationship,
  ) {
    return {
      ...workspace,
      relationships: workspace.relationships.map((relationship) =>
        relationship.id === relationshipId ? updater(relationship) : relationship,
      ),
    };
  }

  function saveRelationshipEdit(relationship: ConceptRelationship) {
    const label = relationshipValue.trim();
    if (!label) return;
    const next = updateRelationship(relationship.id, (current) => ({
      ...current,
      label,
      rationale: "Relationship wording set directly by the scholar.",
      pinned: true,
      origin: "scholar",
    }));
    commit(next, pile, `Changed the thread to “${label}” and pinned the scholar's wording.`);
    setEditingRelationshipId(null);
    setRelationshipValue("");
  }

  function toggleRelationshipPin(relationship: ConceptRelationship) {
    const next = updateRelationship(relationship.id, (current) => ({
      ...current,
      pinned: !current.pinned,
    }));
    commit(next, pile, `Relationship ${relationship.pinned ? "unpinned" : "pinned against fox revision"}.`);
  }

  function deleteRelationship(relationship: ConceptRelationship) {
    commit(
      {
        ...workspace,
        relationships: workspace.relationships.filter((item) => item.id !== relationship.id),
      },
      pile,
      `Removed the “${relationship.label}” relationship.`,
    );
  }

  function addRelationship(source: ConceptFamily) {
    const label = newRelationshipLabel.trim();
    const target = workspace.conceptFamilies.find((family) => family.id === newRelationshipTarget);
    if (!label || !target || target.id === source.id) return;
    const relationship: ConceptRelationship = {
      id: makeId("scholar-relationship"),
      sourceTitle: source.title,
      targetTitle: target.title,
      label,
      rationale: "Relationship added directly by the scholar.",
      pinned: true,
      origin: "scholar",
    };
    commit(
      { ...workspace, relationships: [...workspace.relationships, relationship] },
      pile,
      `Tied ${source.title} to ${target.title} with “${label}.”`,
      source.id,
    );
    setNewRelationshipLabel("");
    setNewRelationshipTarget("");
  }

  function restoreTerm(item: Extract<SetAsideItem, { kind: "term" }>, asNewCard: boolean) {
    let nextWorkspace = workspace;
    let destinationId = item.originFamilyId;
    let nextPile = pile.filter((entry) => entry.id !== item.id);
    const restoredTerm = { ...item.term, restored: true };

    if (asNewCard) {
      destinationId = makeId("scholar-family");
      nextWorkspace = {
        ...workspace,
        conceptFamilies: [
          ...workspace.conceptFamilies,
          {
            id: destinationId,
            title: item.term.label,
            rationale: `Restored from ${item.originFamilyTitle} for independent treatment.`,
            pinned: false,
            inquiryFocus: false,
            origin: "scholar",
            restored: true,
            terms: [restoredTerm],
          },
        ],
      };
    } else {
      let family = workspace.conceptFamilies.find((entry) => entry.id === item.originFamilyId);
      if (!family) {
        const familyInPile = pile.find(
          (entry): entry is Extract<SetAsideItem, { kind: "family" }> =>
            entry.kind === "family" && entry.family.id === item.originFamilyId,
        );
        family = familyInPile?.family;
        if (familyInPile) nextPile = nextPile.filter((entry) => entry.id !== familyInPile.id);
      }
      const restoredFamily: ConceptFamily = family
        ? {
            ...family,
            restored: true,
            terms: family.terms.some((term) => term.id === restoredTerm.id)
              ? family.terms.map((term) => term.id === restoredTerm.id ? restoredTerm : term)
              : [...family.terms, restoredTerm],
          }
        : {
            id: item.originFamilyId,
            title: item.originFamilyTitle,
            rationale: "Original family restored with this concept.",
            pinned: false,
            inquiryFocus: false,
            origin: "scholar",
            restored: true,
            terms: [restoredTerm],
          };
      nextWorkspace = {
        ...workspace,
        conceptFamilies: workspace.conceptFamilies.some((entry) => entry.id === restoredFamily.id)
          ? workspace.conceptFamilies.map((entry) => entry.id === restoredFamily.id ? restoredFamily : entry)
          : [...workspace.conceptFamilies, restoredFamily],
      };
    }

    commit(
      nextWorkspace,
      nextPile,
      asNewCard
        ? `Restored ${item.term.label} as a new table card.`
        : `Restored ${item.term.label} to ${item.originFamilyTitle}.`,
      destinationId,
    );
  }

  function restoreOther(item: Exclude<SetAsideItem, { kind: "term" }>) {
    let next: QueryWorkspace;
    let viewCardId: string | undefined;
    if (item.kind === "family") {
      viewCardId = item.family.id;
      next = {
        ...workspace,
        conceptFamilies: [...workspace.conceptFamilies, { ...item.family, restored: true }],
      };
    } else if (item.kind === "scope") {
      next = { ...workspace, scopeChoices: [...workspace.scopeChoices, { ...item.card, restored: true }] };
    } else {
      next = { ...workspace, exclusions: [...workspace.exclusions, { ...item.card, restored: true }] };
    }
    commit(
      next,
      pile.filter((entry) => entry.id !== item.id),
      `Restored ${setAsideLabel(item)} to the worktable.`,
      viewCardId,
    );
  }

  function openDocumentedConversation() {
    badgerAbortRef.current?.abort();
    badgerAbortRef.current = null;
    owlAbortRef.current?.abort();
    owlAbortRef.current = null;
    const exampleWorkspace = documentedWorkspace();
    setQuestion(documentedQuestion);
    setWorkspace(exampleWorkspace);
    setCardOrder(exampleWorkspace.conceptFamilies.map((family) => family.id));
    setConversation(initialConversation());
    setMode("demo");
    setInquiryStarted(true);
    setTableVisible(false);
    setNotice("Saved example: this conversation and its editable worktable are prewritten documentation, not a live model response.");
    setPile([]);
    setReceipt(null);
    setFocusedFamilyId(null);
    setMapApproved(false);
    setBadgerPlan(null);
    setBadgerLoading(false);
    setBadgerJobStatus("starting");
    setBadgerError("");
    setExpandedFolioIds([]);
    setShelfPreviewLoadingId(null);
    setShelfPreviewErrors({});
    setOwlRuns([]);
    setActiveOwlRunId(null);
    setOwlStage(null);
    setOwlError("");
    setTranslationLoadingId(null);
    setTranslationErrors({});
    setError("");
    requestAnimationFrame(() => {
      document.getElementById("fox-conversation")?.focus();
    });
  }

  function goToTable() {
    setTableVisible(true);
    requestAnimationFrame(() => {
      document.querySelector(".working-room")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function orderedFamilyIds() {
    const liveIds = new Set(workspace.conceptFamilies.map((family) => family.id));
    return [
      ...cardOrder.filter((id) => liveIds.has(id)),
      ...workspace.conceptFamilies.map((family) => family.id).filter((id) => !cardOrder.includes(id)),
    ];
  }

  function reorderFamily(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const next = orderedFamilyIds();
    const sourceIndex = next.indexOf(sourceId);
    const targetIndex = next.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, sourceId);
    setCardOrder(next);
    setDraggingFamilyId(null);
  }

  function moveFamily(familyId: string, direction: -1 | 1) {
    const next = orderedFamilyIds();
    const index = next.indexOf(familyId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    setCardOrder(next);
  }

  function focusTableFox() {
    document.getElementById("table-fox-follow-up")?.focus();
  }

  async function approveMap() {
    badgerAbortRef.current?.abort();
    const controller = new AbortController();
    badgerAbortRef.current = controller;
    setMapApproved(true);
    setBadgerLoading(true);
    setBadgerJobStatus("starting");
    setBadgerError("");
    setNotice("The concept map is approved. The badger is preparing an inspectable language draft; no corpus search has run.");
    requestAnimationFrame(() => {
      document.getElementById("badger-room")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try {
      let responseId = "";
      while (!controller.signal.aborted) {
        const response = await fetch(responseId ? "/api/adapt/status" : "/api/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            approved: true,
            question,
            workspace,
            responseId: responseId || undefined,
          }),
        });
        const result = (await response.json()) as
          | (BadgerResponse & { error?: string })
          | (BadgerPendingResponse & { error?: string });
        if (!response.ok && response.status !== 202) {
          throw new Error(result.error || "The badger could not prepare the language folios.");
        }
        if (response.status === 202) {
          const pending = result as BadgerPendingResponse;
          if (!pending.responseId) throw new Error("The badger returned no usable job receipt.");
          responseId = pending.responseId;
          setBadgerJobStatus(pending.status);
          setNotice(pending.notice);
          await new Promise((resolve) => window.setTimeout(resolve, 3000));
          continue;
        }

        const completed = result as BadgerResponse;
        setBadgerPlan(completed.plan);
        setExpandedFolioIds(completed.plan.folios[0] ? [completed.plan.folios[0].id] : []);
        setProposalDraft(null);
        setShelfPreviewLoadingId(null);
        setShelfPreviewErrors({});
        setNotice(completed.notice);
        requestAnimationFrame(() => {
          document.getElementById("badger-room")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        break;
      }
    } catch (caught) {
      if (controller.signal.aborted) return;
      setBadgerError(
        caught instanceof Error ? caught.message : "The badger could not prepare the language folios.",
      );
    } finally {
      if (badgerAbortRef.current === controller) {
        badgerAbortRef.current = null;
        setBadgerLoading(false);
        setBadgerJobStatus("starting");
      }
    }
  }

  function toggleFolio(folioId: string) {
    setExpandedFolioIds((current) =>
      current.includes(folioId)
        ? current.filter((id) => id !== folioId)
        : [...current, folioId],
    );
  }

  function updateBadgerFolio(
    folioId: string,
    updater: (folio: BadgerAdaptationPlan["folios"][number]) => BadgerAdaptationPlan["folios"][number],
  ) {
    setBadgerPlan((current) => {
      if (!current) return current;
      const folios = current.folios.map((folio) => folio.id === folioId ? updater(folio) : folio);
      return {
        ...current,
        folios,
        approvalStatus: folios.every((folio) => folio.status === "approved")
          ? "approved"
          : "draft",
      };
    });
  }

  function toggleProposalPin(folioId: string, proposal: AdaptationProposal) {
    updateBadgerFolio(folioId, (folio) => ({
      ...folio,
      status: "scholar_edited",
      proposals: folio.proposals.map((candidate) =>
        candidate.id === proposal.id ? { ...candidate, pinned: !candidate.pinned } : candidate,
      ),
    }));
  }

  function toggleProposalActive(folioId: string, proposal: AdaptationProposal) {
    updateBadgerFolio(folioId, (folio) => ({
      ...folio,
      status: "scholar_edited",
      proposals: folio.proposals.map((candidate) =>
        candidate.id === proposal.id ? { ...candidate, active: !candidate.active } : candidate,
      ),
    }));
  }

  function beginProposalEdit(proposal: AdaptationProposal) {
    setProposalDraft({
      proposalId: proposal.id,
      sourceLanguageExpression: proposal.sourceLanguageExpression,
      englishSense: proposal.englishSense,
      rationale: proposal.rationale,
      searchForms: proposal.searchForms.join(", "),
    });
  }

  function saveProposalEdit(folioId: string) {
    if (!proposalDraft) return;
    const sourceLanguageExpression = proposalDraft.sourceLanguageExpression.trim();
    const englishSense = proposalDraft.englishSense.trim();
    const rationale = proposalDraft.rationale.trim();
    if (!englishSense || !rationale) return;
    const searchForms = [...new Set(
      proposalDraft.searchForms
        .split(/[,\n]+/)
        .map((form) => form.trim())
        .filter(Boolean),
    )];
    updateBadgerFolio(folioId, (folio) => ({
      ...folio,
      status: "scholar_edited",
      proposals: folio.proposals.map((proposal) =>
        proposal.id === proposalDraft.proposalId
          ? {
              ...proposal,
              sourceLanguageExpression,
              englishSense,
              rationale,
              searchForms,
              shelfPreview: undefined,
              scholarEdited: true,
              pinned: true,
            }
          : proposal,
      ),
    }));
    setProposalDraft(null);
  }

  async function testProposalOnShelf(proposal: AdaptationProposal) {
    if (!proposal.searchForms.length || shelfPreviewLoadingId) return;
    setShelfPreviewLoadingId(proposal.id);
    setShelfPreviewErrors((current) => ({ ...current, [proposal.id]: "" }));
    try {
      const response = await fetch("/api/shelf-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          corpusId: badgerPlan?.corpusId,
          queryForms: proposal.searchForms,
          queryMode: "any",
        }),
      });
      const result = (await response.json()) as ShelfPreviewResponse & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "The installed shelf could not check these forms.");
      }
      setBadgerPlan((current) => current ? attachShelfPreview(current, result) : current);
      setNotice(
        `The shelf checked ${proposal.searchForms.length === 1 ? "one literal form" : `${proposal.searchForms.length} literal forms`}. These are coverage receipts for the forms alone, not results for the full inquiry.`,
      );
    } catch (caught) {
      setShelfPreviewErrors((current) => ({
        ...current,
        [proposal.id]: caught instanceof Error
          ? caught.message
          : "The installed shelf could not check these forms.",
      }));
    } finally {
      setShelfPreviewLoadingId(null);
    }
  }

  function toggleFolioApproval(folioId: string) {
    const approving = badgerPlan?.folios.find((folio) => folio.id === folioId)?.status !== "approved";
    const nextUnapproved = approving
      ? badgerPlan?.folios.find((folio) => folio.id !== folioId && folio.status !== "approved")
      : null;
    updateBadgerFolio(folioId, (folio) => ({
      ...folio,
      status: folio.status === "approved" ? "scholar_edited" : "approved",
    }));
    if (approving) {
      setExpandedFolioIds(nextUnapproved ? [nextUnapproved.id] : []);
      setProposalDraft(null);
    } else {
      setExpandedFolioIds([folioId]);
    }
    requestAnimationFrame(() => {
      document.getElementById(folioId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startNewInquiry() {
    if (owlRuns.length && !window.confirm(
      "Begin a new inquiry? The connected runs in this browser session will be cleared.",
    )) return;
    badgerAbortRef.current?.abort();
    badgerAbortRef.current = null;
    owlAbortRef.current?.abort();
    owlAbortRef.current = null;
    const exampleWorkspace = documentedWorkspace();
    setQuestion("");
    setWorkspace(exampleWorkspace);
    setCardOrder(exampleWorkspace.conceptFamilies.map((family) => family.id));
    setConversation([]);
    setMode("demo");
    setInquiryStarted(false);
    setTableVisible(false);
    setNotice(
      "For live queries, add an OpenAI API key to this local app. You can open the saved demonstration without one.",
    );
    setFocusedFamilyId(null);
    setPile([]);
    setPileOpen(false);
    setReceipt(null);
    setError("");
    setLoadingTarget(null);
    setFollowUp("");
    setMapApproved(false);
    setBadgerPlan(null);
    setBadgerLoading(false);
    setBadgerJobStatus("starting");
    setBadgerError("");
    setExpandedFolioIds([]);
    setProposalDraft(null);
    setShelfPreviewLoadingId(null);
    setShelfPreviewErrors({});
    setTranslationPreference("auto_strong");
    setOwlRuns([]);
    setActiveOwlRunId(null);
    setOwlStage(null);
    setOwlError("");
    setTranslationLoadingId(null);
    setTranslationErrors({});
    setLibrarianPetted(false);
    requestAnimationFrame(() => {
      document.getElementById("fox-room")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function upsertOwlRun(record: OwlRunRecord) {
    setOwlRuns((current) => {
      const existing = current.findIndex((item) => item.retrieval.runId === record.retrieval.runId);
      if (existing < 0) return [...current, record];
      return current.map((item, index) => index === existing ? record : item);
    });
  }

  async function adjudicateRetrievalRun(run: RetrievalRun, controller: AbortController) {
    if (!run.candidates.length) return;
    setOwlStage("starting");
    let responseId = "";
    while (!controller.signal.aborted) {
      const response = await fetch(responseId ? "/api/owl/status" : "/api/owl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ run, responseId: responseId || undefined }),
      });
      const result = (await response.json()) as
        | (OwlResponse & { error?: string })
        | (OwlPendingResponse & { error?: string });
      if (!response.ok && response.status !== 202) {
        throw new Error(result.error || "The owl could not adjudicate this retrieval run.");
      }
      if (response.status === 202) {
        const pending = result as OwlPendingResponse;
        if (!pending.responseId) throw new Error("The owl returned no usable job receipt.");
        responseId = pending.responseId;
        setOwlStage(pending.status);
        setNotice(pending.notice);
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        continue;
      }
      const completed = result as OwlResponse;
      setOwlRuns((current) => current.map((record) =>
        record.retrieval.runId === run.runId
          ? { ...record, adjudication: completed.adjudication }
          : record
      ));
      setNotice(completed.notice);
      setOwlStage(null);
      requestAnimationFrame(() => {
        document.getElementById("owl-room")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
  }

  async function startRetrievalRun() {
    if (!badgerPlan || badgerPlan.approvalStatus !== "approved" || owlStage) return;
    owlAbortRef.current?.abort();
    const controller = new AbortController();
    owlAbortRef.current = controller;
    setOwlStage("retrieving");
    setOwlError("");
    requestAnimationFrame(() => {
      document.getElementById("owl-room")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try {
      const response = await fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          approved: true,
          question,
          workspace,
          plan: badgerPlan,
          translationPreference,
          parentRunId: activeOwlRunId || undefined,
        }),
      });
      const result = (await response.json()) as {
        run?: RetrievalRun;
        notice?: string;
        error?: string;
      };
      if (!response.ok || !result.run) {
        throw new Error(result.error || "The archive could not execute the approved search plan.");
      }
      const record: OwlRunRecord = {
        retrieval: result.run,
        adjudication: null,
        translationAddenda: [],
      };
      upsertOwlRun(record);
      setActiveOwlRunId(result.run.runId);
      setNotice(result.notice || "The archive prepared a retrieval run.");
      if (!result.run.candidates.length) {
        setOwlStage(null);
        return;
      }
      await adjudicateRetrievalRun(result.run, controller);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setOwlError(
        caught instanceof Error ? caught.message : "The owl workflow could not finish safely.",
      );
      setOwlStage(null);
    } finally {
      if (owlAbortRef.current === controller) owlAbortRef.current = null;
    }
  }

  async function retryOwlRun(run: RetrievalRun) {
    if (owlStage) return;
    owlAbortRef.current?.abort();
    const controller = new AbortController();
    owlAbortRef.current = controller;
    setActiveOwlRunId(run.runId);
    setOwlError("");
    try {
      await adjudicateRetrievalRun(run, controller);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setOwlError(caught instanceof Error ? caught.message : "The owl could not resume this run.");
      setOwlStage(null);
    } finally {
      if (owlAbortRef.current === controller) owlAbortRef.current = null;
    }
  }

  async function requestWorkingTranslation(record: OwlRunRecord, candidateId: string) {
    const loadingId = `${record.retrieval.runId}:${candidateId}`;
    if (translationLoadingId) return;
    setTranslationLoadingId(loadingId);
    setTranslationErrors((current) => ({ ...current, [loadingId]: "" }));
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run: record.retrieval, candidateId }),
      });
      const result = (await response.json()) as {
        addendum?: TranslationAddendum;
        notice?: string;
        error?: string;
      };
      if (!response.ok || !result.addendum) {
        throw new Error(result.error || "The working translation could not be prepared.");
      }
      setOwlRuns((current) => current.map((item) =>
        item.retrieval.runId === record.retrieval.runId
          ? { ...item, translationAddenda: [...item.translationAddenda, result.addendum!] }
          : item
      ));
      setNotice(result.notice || "A working translation addendum was attached.");
    } catch (caught) {
      setTranslationErrors((current) => ({
        ...current,
        [loadingId]: caught instanceof Error
          ? caught.message
          : "The working translation could not be prepared.",
      }));
    } finally {
      setTranslationLoadingId(null);
    }
  }

  const tableFamilies = orderedFamilyIds().flatMap((id) => {
    const family = workspace.conceptFamilies.find((item) => item.id === id);
    return family ? [family] : [];
  });
  const activeFamilyTitles = new Set(tableFamilies.map((family) => family.title));
  const visibleRelationships = workspace.relationships.filter(
    (relationship) =>
      activeFamilyTitles.has(relationship.sourceTitle) &&
      activeFamilyTitles.has(relationship.targetTitle),
  );
  const focusFamily = tableFamilies.find((family) => family.inquiryFocus);
  const familyWithFocusedTerm = tableFamilies.find((family) =>
    family.terms.some((term) => term.inquiryFocus),
  );
  const focusTerm = familyWithFocusedTerm?.terms.find((term) => term.inquiryFocus);
  const inquiryFocus = focusFamily
    ? { kind: "family" as const, label: focusFamily.title }
    : focusTerm
      ? { kind: "concept" as const, label: focusTerm.label, familyTitle: familyWithFocusedTerm!.title }
      : null;
  const activeOwlRecord = owlRuns.find((record) => record.retrieval.runId === activeOwlRunId) ?? null;
  const nextFolioForReviewId = badgerPlan?.folios.find((folio) => folio.status !== "approved")?.id ?? null;
  const unresolvedCatalogueBoundaries = [...workspace.scopeChoices, ...workspace.exclusions].filter(
    (card) => card.catalogueConstraint.status === "needs_clarification",
  );

  return (
    <main>
      <header className="site-header" id="top">
        <a className="brand" href="#top" aria-label="The Inhabited Archive home">
          <span className="brand-mark">IA</span>
          <span><strong>The Inhabited Archive</strong><small>A multilingual research instrument</small></span>
        </a>
        <div className="header-meta">
          <span>OpenAI Build Week 2026</span>
          <a href="#method">How it works</a>
        </div>
      </header>

      <section className="archive-wakes" id="archive-wakes" aria-labelledby="archive-wakes-title">
        <div className="archive-panorama" aria-hidden="true">
          <span className="archive-panorama-left" />
          <span className="archive-panorama-right" />
        </div>
        <div className="archive-wakes-copy">
          <p className="eyebrow">A multilingual research instrument</p>
          <h1 id="archive-wakes-title">
            Translate the question.<br />Not the library<span className="hero-knot">.</span>
          </h1>
          <p>
            Ask in the language you know. Specialist librarians adapt your idea to the
            languages of the archive. They return the sources you should read and leave
            the interpretation with you.
          </p>
          <a href="#fox-room">Bring a question to the fox <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="fox-room" id="fox-room" aria-labelledby="fox-room-title">
        <div className="fox-room-art" aria-hidden="true" />
        <div className="fox-room-content">
          <div className="fox-room-heading">
            <div>
              <p className="eyebrow">At the fox&apos;s catalogue</p>
              <h2 id="fox-room-title">Tell me what you&apos;re trying to find.</h2>
            </div>
            <span className={`mode-badge ${mode}`}>
              <span aria-hidden="true" />
              {loadingTarget === "question"
                ? "Live fox answering"
                : mode === "live"
                  ? "Live inquiry"
                  : "Saved example available"}
            </span>
          </div>

          {!inquiryStarted ? (
            <div className="fox-opening" aria-busy={loadingTarget === "question"}>
              <p className="fox-method-note">
                Give me the question as you would explain it to a clever colleague.
                I&apos;ll help you work out what belongs in the search, what should stay
                out, and where the library&apos;s limits may matter. I may ask a few
                questions before we spread everything across the table.
              </p>
              <form className="query-form" onSubmit={beginInquiry}>
                <label htmlFor="research-question">Your question, in the language you know</label>
                <textarea
                  id="research-question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  maxLength={1200}
                  placeholder="I&apos;m trying to understand…"
                />
                <div className="query-actions">
                  <span>{question.length}/1200</span>
                  <button type="submit" disabled={loadingTarget !== null || !question.trim()}>
                    {loadingTarget === "question" ? "The fox is listening…" : "Tell the fox"}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
              <div className="fox-room-note">
                <p>{notice}</p>
                {mode === "demo" ? (
                  <button type="button" onClick={openDocumentedConversation}>
                    Open the saved example
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="fox-conversation" id="fox-conversation" tabIndex={-1} aria-busy={loadingTarget !== null}>
              <div className="fox-transcript" aria-live="polite">
                {conversation.map((turn) => (
                  <article className={`fox-turn ${turn.speaker}`} key={turn.id}>
                    <div className="fox-turn-meta">
                      <strong>{turn.speaker === "fox" ? "The fox" : "You"}</strong>
                      {turn.cardTitle ? <span>Regarding: {turn.cardTitle}</span> : null}
                    </div>
                    {turn.text.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </article>
                ))}
                {loadingTarget === "question"
                  ? <FoxThinkingTurn firstReply />
                  : !tableVisible && loadingTarget === "conversation"
                    ? <FoxThinkingTurn />
                    : null}
              </div>
              <form
                className="fox-follow-up"
                onSubmit={(event) => {
                  event.preventDefault();
                  void continueConversation(followUp, null);
                }}
              >
                <label htmlFor="fox-room-follow-up">Answer or refine the question</label>
                <textarea
                  id="fox-room-follow-up"
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                  placeholder="Clarify, redirect, broaden, or narrow the inquiry…"
                  rows={3}
                />
                <div className="fox-conversation-actions">
                  <button className="table-threshold" type="button" onClick={goToTable}>
                    I&apos;m done — take me to the table
                  </button>
                  <button className="fox-send" type="submit" disabled={!followUp.trim() || loadingTarget !== null}>
                    {loadingTarget === "conversation" ? "Reconsidering…" : "Answer the fox"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {error ? (
            <div className="fox-error" role="alert">
              <p>{error}</p>
              {mode === "demo" ? (
                <button type="button" onClick={openDocumentedConversation}>Open the saved example instead</button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="working-room" aria-labelledby="working-room-title" hidden={!tableVisible} aria-busy={loadingTarget !== null}>
        <div className="worktable-art" aria-hidden="true" />
        <div className="room-heading">
          <p className="eyebrow">The question in your language</p>
          <h2 id="working-room-title">Here&apos;s what I think you mean.</h2>
          <p>{workspace.framing}</p>
        </div>

        {receipt ? (
          <div className="receipt" role="status">
            <span>{receipt.message}</span>
            <div>
              {receipt.viewCardId ? <button type="button" onClick={() => viewCard(receipt.viewCardId!)}>View card</button> : null}
              <button type="button" onClick={undoReceipt}>Undo</button>
              <button type="button" aria-label="Dismiss change receipt" onClick={() => setReceipt(null)}>×</button>
            </div>
          </div>
        ) : null}

        <div className="room-grid">
          <aside className="conversation-pane" aria-label="Conversation with the fox">
            <div className="pane-heading">
              <div><span>The fox&apos;s latest note</span><h3>One shared inquiry</h3></div>
            </div>
            <p className="table-fox-latest">{workspace.nextQuestion}</p>
            {tableVisible && loadingTarget !== null && loadingTarget !== "question"
              ? <FoxLoadingVignette compact />
              : null}
            <details className="table-conversation-history">
              <summary>Read the conversation</summary>
              <div className="conversation-log" aria-live="polite">
                {conversation.map((turn) => (
                  <article className={`turn ${turn.speaker}`} key={turn.id}>
                    <div className="turn-meta">
                      <strong>{turn.speaker === "fox" ? "Fox" : "You"}</strong>
                      {turn.cardTitle ? <button type="button" onClick={() => turn.cardId && viewCard(turn.cardId)}>Regarding: {turn.cardTitle}</button> : null}
                    </div>
                    {turn.text.split("\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </article>
                ))}
              </div>
            </details>
            <form
              className="conversation-form"
              onSubmit={(event) => {
                event.preventDefault();
                void continueConversation(followUp, null);
              }}
            >
              <label htmlFor="table-fox-follow-up">Continue talking to the fox about this table</label>
              <textarea
                id="table-fox-follow-up"
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value)}
                placeholder="Change, question, broaden, or narrow what is laid out…"
                rows={3}
              />
              <button type="submit" disabled={!followUp.trim() || loadingTarget !== null}>
                {loadingTarget === "conversation" ? "Revising…" : "Send"}
              </button>
            </form>
          </aside>

          <section className="worktable-pane" aria-label="Inspectable concept map">
            <div className="pane-heading table-heading">
              <div><span>Search concepts · across the table</span><h3>Concept worktable</h3></div>
              <p>Open a card to inspect its connected ideas. Dragging only rearranges the table.</p>
            </div>

            <div className={`concept-table ${focusedFamilyId ? "has-focus" : ""}`}>
              {tableFamilies.map((family, familyIndex) => {
                const expanded = family.id === focusedFamilyId;
                const outgoingRelationships = visibleRelationships.filter(
                  (relationship) => normalized(relationship.sourceTitle) === normalized(family.title),
                );
                return (
                  <article
                    className={`family-card ${expanded ? "focused" : focusedFamilyId ? "receding" : ""} ${family.inquiryFocus ? "inquiry-focus" : family.terms.some((term) => term.inquiryFocus) ? "contains-inquiry-focus" : ""} ${family.restored ? "restored" : ""} ${draggingFamilyId === family.id ? "dragging" : ""}`}
                    id={family.id}
                    key={family.id}
                    tabIndex={-1}
                    draggable={!expanded}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingFamilyId(family.id);
                    }}
                    onDragEnd={() => setDraggingFamilyId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingFamilyId) reorderFamily(draggingFamilyId, family.id);
                    }}
                  >
                    <div className="family-card-head">
                      <button
                        type="button"
                        className="family-focus"
                        onClick={() => setFocusedFamilyId(expanded ? null : family.id)}
                        aria-expanded={expanded}
                      >
                        <span className="card-kind">{family.inquiryFocus ? "Focus of Inquiry · Concept family" : "Concept family"}</span>
                        <strong>{family.title}</strong>
                        <p>{family.rationale}</p>
                        {!expanded ? (
                          <>
                            <div className="term-preview">
                              {family.terms.slice(0, 3).map((term) => <span key={term.id}>{term.label}</span>)}
                              {family.terms.length > 3 ? <span>+{family.terms.length - 3} more</span> : null}
                            </div>
                            <span className="family-inspect-cue">Open and inspect <b aria-hidden="true">＋</b></span>
                          </>
                        ) : null}
                      </button>
                      <div className="family-card-controls">
                        <div className="card-order-controls" aria-label={`Move ${family.title}`}>
                          <button type="button" onClick={() => moveFamily(family.id, -1)} disabled={familyIndex === 0} aria-label={`Move ${family.title} earlier`}>↑</button>
                          <button type="button" onClick={() => moveFamily(family.id, 1)} disabled={familyIndex === tableFamilies.length - 1} aria-label={`Move ${family.title} later`}>↓</button>
                        </div>
                        <button
                          type="button"
                          className={`inquiry-focus-button ${family.inquiryFocus ? "active" : ""}`}
                          onClick={() => setInquiryFocus(family)}
                          aria-pressed={family.inquiryFocus}
                        >
                          {family.inquiryFocus ? "Focus of Inquiry" : "Make focus"}
                        </button>
                        <button
                          type="button"
                          className={`pin-button ${family.pinned ? "active" : ""}`}
                          onClick={() => toggleFamilyPin(family)}
                          aria-pressed={family.pinned}
                        >
                          {family.pinned ? "Pinned" : "Pin card"}
                        </button>
                      </div>
                    </div>

                    {outgoingRelationships.length ? (
                      <div className="family-relationships" aria-label={`Relationships from ${family.title}`}>
                        {outgoingRelationships.map((relationship) => (
                          <div className="relationship-string" key={relationship.id} title={relationship.rationale}>
                            <span className="thread-rule" aria-hidden="true" />
                            {editingRelationshipId === relationship.id ? (
                              <form
                                className="relationship-edit"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  saveRelationshipEdit(relationship);
                                }}
                              >
                                <input
                                  value={relationshipValue}
                                  onChange={(event) => setRelationshipValue(event.target.value)}
                                  aria-label={`Relationship from ${relationship.sourceTitle} to ${relationship.targetTitle}`}
                                  autoFocus
                                />
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setEditingRelationshipId(null)}>Cancel</button>
                              </form>
                            ) : (
                              <>
                                <span className="relationship-words">{relationship.label}</span>
                                <span className="relationship-target">→ {relationship.targetTitle}</span>
                                <span className="relationship-actions">
                                  <button type="button" onClick={() => { setEditingRelationshipId(relationship.id); setRelationshipValue(relationship.label); }}>Edit</button>
                                  <button type="button" className={relationship.pinned ? "active" : ""} onClick={() => toggleRelationshipPin(relationship)}>{relationship.pinned ? "Pinned" : "Pin"}</button>
                                  <button type="button" onClick={() => deleteRelationship(relationship)}>Remove</button>
                                </span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {expanded ? (
                      <div className="family-detail">
                        <div className="term-list">
                          {family.terms.map((term) => (
                            <div className={`term-row ${term.inquiryFocus ? "inquiry-focus" : ""} ${term.restored ? "restored" : ""}`} key={term.id}>
                              <div className="term-copy">
                                {editingTermId === term.id ? (
                                  <form
                                    className="term-edit"
                                    onSubmit={(event) => {
                                      event.preventDefault();
                                      saveTermEdit(family, term);
                                    }}
                                  >
                                    <input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} autoFocus />
                                    <button type="submit">Save</button>
                                    <button type="button" onClick={() => setEditingTermId(null)}>Cancel</button>
                                  </form>
                                ) : <strong>{term.label}</strong>}
                                {term.inquiryFocus ? <span className="inquiry-focus-label">Focus of Inquiry</span> : null}
                                <p>{term.rationale}</p>
                              </div>
                              <div className="term-actions">
                                <button type="button" onClick={() => { setEditingTermId(term.id); setEditingValue(term.label); }}>Edit</button>
                                <button type="button" className={term.inquiryFocus ? "focus-active" : ""} onClick={() => setInquiryFocus(family, term)} aria-pressed={term.inquiryFocus}>{term.inquiryFocus ? "Focus of Inquiry" : "Make focus"}</button>
                                <button type="button" className={term.pinned ? "active" : ""} onClick={() => toggleTermPin(family, term)}>{term.pinned ? "Pinned" : "Pin"}</button>
                                <button type="button" onClick={() => setAsideTerm(family, term)}>Set aside</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <form
                          className="add-term"
                          onSubmit={(event) => { event.preventDefault(); addTermToFamily(family); }}
                        >
                          <input value={newTerm} onChange={(event) => setNewTerm(event.target.value)} placeholder="Add a concept to this family" aria-label={`Add a concept to ${family.title}`} />
                          <button type="submit">Add and pin</button>
                        </form>
                        <form
                          className="add-relationship"
                          onSubmit={(event) => { event.preventDefault(); addRelationship(family); }}
                        >
                          <label htmlFor={`relationship-label-${family.id}`}>Tie this card to another</label>
                          <select
                            value={newRelationshipTarget}
                            onChange={(event) => setNewRelationshipTarget(event.target.value)}
                            aria-label={`Choose a card to connect with ${family.title}`}
                          >
                            <option value="">Choose another card…</option>
                            {tableFamilies.filter((candidate) => candidate.id !== family.id).map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>{candidate.title}</option>
                            ))}
                          </select>
                          <input
                            id={`relationship-label-${family.id}`}
                            value={newRelationshipLabel}
                            onChange={(event) => setNewRelationshipLabel(event.target.value)}
                            placeholder="develops into, contrasts with…"
                          />
                          <button type="submit" disabled={!newRelationshipTarget || !newRelationshipLabel.trim()}>Add thread</button>
                        </form>
                        <form
                          className="card-conversation"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void continueConversation(cardMessage, family);
                          }}
                        >
                          <label htmlFor={`talk-${family.id}`}>Talk to the fox about this card</label>
                          <div>
                            <textarea
                              id={`talk-${family.id}`}
                              value={cardMessage}
                              onChange={(event) => setCardMessage(event.target.value)}
                              placeholder={`“Keep these two, and set the rest of ${family.title} aside.”`}
                              rows={2}
                            />
                            <button type="submit" disabled={!cardMessage.trim() || loadingTarget !== null}>
                              {loadingTarget === family.id ? "Revising…" : "Send to fox"}
                            </button>
                          </div>
                        </form>
                        <div className="family-footer">
                          <button type="button" onClick={() => setAsideFamily(family)}>Move family to set-aside stack</button>
                          <button type="button" onClick={() => setFocusedFamilyId(null)}>Return to the full table</button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="table-trays" aria-label="Scope, exclusions, and set-aside ideas">
            <section className="boundary-zone scope-zone">
              <div><span>Quieter boundaries</span><h4>Scope</h4></div>
              {workspace.scopeChoices.length ? workspace.scopeChoices.map((card) => (
                <article key={card.id} className={card.restored ? "restored" : ""}>
                  {boundaryDraft?.id === card.id && boundaryDraft.kind === "scope" ? (
                    <form className="boundary-edit" onSubmit={(event) => { event.preventDefault(); saveBoundaryEdit(); }}>
                      <input value={boundaryDraft.label} onChange={(event) => setBoundaryDraft({ ...boundaryDraft, label: event.target.value })} aria-label="Scope label" autoFocus />
                      <textarea value={boundaryDraft.rationale} onChange={(event) => setBoundaryDraft({ ...boundaryDraft, rationale: event.target.value })} aria-label="What this scope choice means" rows={3} />
                      <div><button type="submit">Save</button><button type="button" onClick={() => setBoundaryDraft(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <strong>{card.label}</strong><p>{card.rationale}</p>
                      <div className={`catalogue-constraint ${card.catalogueConstraint.status}`}>
                        <span>{card.catalogueConstraint.status === "resolved"
                          ? "Catalogue rule"
                          : card.catalogueConstraint.status === "needs_clarification"
                            ? "Fox clarification needed"
                            : "Passage-level guidance"}</span>
                        <p>{catalogueConstraintSummary(card)}</p>
                      </div>
                      <div className="boundary-actions">
                        {card.catalogueConstraint.status === "needs_clarification" ? (
                          <button type="button" onClick={() => void continueConversation(
                            `Sharpen the scope card “${card.label}.” Explain any historical ambiguity and translate it into an exact composition-date, genre, or tradition boundary. Do not choose silently if my wording allows multiple boundaries.`,
                            null,
                          )}>Ask fox to sharpen</button>
                        ) : null}
                        <button type="button" onClick={() => setBoundaryDraft({ kind: "scope", id: card.id, label: card.label, rationale: card.rationale })}>Edit</button>
                        <button type="button" className={card.pinned ? "active" : ""} onClick={() => toggleBoundaryPin("scope", card)}>{card.pinned ? "Pinned" : "Pin"}</button>
                        <button type="button" onClick={() => convertBoundary("scope", card)}>Make exclusion</button>
                        <button type="button" onClick={() => setAsideBoundary("scope", card)}>Set aside</button>
                      </div>
                    </>
                  )}
                </article>
              )) : <p className="empty-zone">No scope boundary fixed yet.</p>}
              <form className="add-boundary" onSubmit={(event) => { event.preventDefault(); addBoundary("scope"); }}>
                <input value={newBoundary.scope} onChange={(event) => setNewBoundary((current) => ({ ...current, scope: event.target.value }))} placeholder="Add a scope choice" aria-label="Add a scope choice" />
                <button type="submit" disabled={!newBoundary.scope.trim()}>Add</button>
              </form>
            </section>

            <section className="boundary-zone exclusion-zone">
              <div><span>Active retrieval guidance</span><h4>Keep out</h4></div>
              {workspace.exclusions.length ? workspace.exclusions.map((card) => (
                <article key={card.id} className={card.restored ? "restored" : ""}>
                  {boundaryDraft?.id === card.id && boundaryDraft.kind === "exclusion" ? (
                    <form className="boundary-edit" onSubmit={(event) => { event.preventDefault(); saveBoundaryEdit(); }}>
                      <input value={boundaryDraft.label} onChange={(event) => setBoundaryDraft({ ...boundaryDraft, label: event.target.value })} aria-label="Exclusion label" autoFocus />
                      <textarea value={boundaryDraft.rationale} onChange={(event) => setBoundaryDraft({ ...boundaryDraft, rationale: event.target.value })} aria-label="What this exclusion keeps out" rows={3} />
                      <div><button type="submit">Save</button><button type="button" onClick={() => setBoundaryDraft(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <strong>{card.label}</strong><p>{card.rationale}</p>
                      <div className={`catalogue-constraint ${card.catalogueConstraint.status}`}>
                        <span>{card.catalogueConstraint.status === "resolved"
                          ? "Catalogue rule"
                          : card.catalogueConstraint.status === "needs_clarification"
                            ? "Fox clarification needed"
                            : "Passage-level guidance"}</span>
                        <p>{catalogueConstraintSummary(card)}</p>
                      </div>
                      <div className="boundary-actions">
                        {card.catalogueConstraint.status === "needs_clarification" ? (
                          <button type="button" onClick={() => void continueConversation(
                            `Sharpen the keep-out card “${card.label}.” Explain any historical ambiguity and translate it into an exact composition-date, genre, or tradition boundary. Do not choose silently if my wording allows multiple boundaries.`,
                            null,
                          )}>Ask fox to sharpen</button>
                        ) : null}
                        <button type="button" onClick={() => setBoundaryDraft({ kind: "exclusion", id: card.id, label: card.label, rationale: card.rationale })}>Edit</button>
                        <button type="button" className={card.pinned ? "active" : ""} onClick={() => toggleBoundaryPin("exclusion", card)}>{card.pinned ? "Pinned" : "Pin"}</button>
                        <button type="button" onClick={() => convertBoundary("exclusion", card)}>Make scope</button>
                        <button type="button" onClick={() => setAsideBoundary("exclusion", card)}>Set aside</button>
                      </div>
                    </>
                  )}
                </article>
              )) : <p className="empty-zone">No active exclusion proposed.</p>}
              <form className="add-boundary" onSubmit={(event) => { event.preventDefault(); addBoundary("exclusion"); }}>
                <input value={newBoundary.exclusion} onChange={(event) => setNewBoundary((current) => ({ ...current, exclusion: event.target.value }))} placeholder="Add an exclusion" aria-label="Add an exclusion" />
                <button type="submit" disabled={!newBoundary.exclusion.trim()}>Add</button>
              </form>
            </section>

            <button className="discard-toggle" type="button" onClick={() => setPileOpen(true)}>
              <span>Inquiry memory</span>
              Set-aside stack <strong>{pile.length}</strong>
            </button>

            <aside className={`coverage-note ${workspace.coverageStatus}`}>
              <span>Corpus boundary</span>
              <p>{workspace.coverageNote}</p>
              {workspace.bridgeSuggestions.length ? (
                <ul>{workspace.bridgeSuggestions.map((bridge) => <li key={bridge}>{bridge}</li>)}</ul>
              ) : null}
            </aside>
          </aside>
        </div>

        <div className={`table-approval-bar ${mapApproved ? "approved" : ""}`} aria-live="polite">
          <div>
            <span>{inquiryFocus ? "Focus of Inquiry" : "The fox asks before approval"}</span>
            <p>{mapApproved
              ? "The map is approved. No corpus search has run yet."
              : unresolvedCatalogueBoundaries.length
                ? `${unresolvedCatalogueBoundaries.length} catalogue ${unresolvedCatalogueBoundaries.length === 1 ? "boundary still needs" : "boundaries still need"} the fox's exact interpretation before the shelf can be searched.`
              : inquiryFocus
                ? `“${inquiryFocus.label}” is the Focus of Inquiry. The other ideas remain in play.`
                : "Would you like to focus on one area, or keep the inquiry broad? You may mark one family or concept as the Focus of Inquiry if you wish."}</p>
          </div>
          <button
            className="approve-map"
            type="button"
            onClick={() => void approveMap()}
            disabled={badgerLoading || Boolean(badgerPlan) || Boolean(unresolvedCatalogueBoundaries.length)}
          >
            {badgerLoading
              ? "Walking to the language desk…"
              : badgerPlan
                ? "Map handed to the badger"
                : mapApproved
                  ? "Try the language handoff again"
                  : "Yes—this looks like my question"}
          </button>
          <button className="keep-working" type="button" onClick={focusTableFox}>Keep working with the fox</button>
        </div>
      </section>

      {mapApproved ? (
        <section className={`badger-room ${badgerPlan ? "has-folios" : "badger-waiting-room"}`} id="badger-room" aria-labelledby="badger-room-title" aria-busy={badgerLoading}>
          <div className="badger-room-art" aria-hidden="true" />
          <div className="badger-room-inner">
            <header className="badger-room-heading">
              <div>
                <p className="eyebrow">At the badger&apos;s language desk</p>
                <h2 id="badger-room-title">
                  {badgerPlan ? "Review the badger’s folios." : "Your question is becoming searchable here."}
                </h2>
              </div>
              <p>
                {badgerPlan
                  ? "Each folio belongs to one fox card. The active folio opens for review; approving it closes the work and brings the next one forward."
                  : "The badger is adapting each fox card into historically useful source-language wording, while recording ambiguity, exclusions, and likely false positives."}
              </p>
            </header>

            {badgerLoading ? <BadgerLoadingVignette status={badgerJobStatus} /> : null}

            {badgerError ? (
              <div className="badger-error" role="alert">
                <div><strong>The folios did not arrive.</strong><p>{badgerError}</p></div>
                <button type="button" onClick={() => void approveMap()}>Try the handoff again</button>
              </div>
            ) : null}

            {badgerPlan ? (
              <div className="badger-desk">
                <div className="badger-ledger-note">
                  <span>{badgerPlan.corpusLabel}</span>
                  <p>{badgerPlan.holdingsNote}</p>
                  <strong>Draft proposals · literal shelf checks remain separate from relevance judgment</strong>
                </div>

                <div className="badger-folio-margin" aria-hidden="true" />

                <div className="folio-stack">
                  {badgerPlan.folios.map((folio) => {
                    const expanded = expandedFolioIds.includes(folio.id);
                    const summary = summarizeFolio(folio);
                    const activeCount = folio.proposals.filter((proposal) => proposal.active).length;
                    return (
                      <article
                        className={`badger-folio confidence-${folio.overallConfidence} ${expanded ? "expanded" : ""} ${folio.status} ${folio.id === nextFolioForReviewId ? "review-target" : ""}`}
                        id={folio.id}
                        key={folio.id}
                      >
                        <button
                          className="folio-cover"
                          type="button"
                          onClick={() => toggleFolio(folio.id)}
                          aria-expanded={expanded}
                          aria-controls={`${folio.id}-contents`}
                        >
                          <span className="folio-tab">From the fox: {folio.sourceFamilyTitle}</span>
                          <span className="folio-cover-copy">
                            <strong>{folio.sourceFamilyTitle}</strong>
                            <small>{folio.summary}</small>
                          </span>
                          <span className="folio-metrics" aria-label="Folio summary">
                            <span><b>{summary.directProposalCount}</b> direct</span>
                            <span><b>{summary.exploratoryProposalCount}</b> exploratory</span>
                            <span><b>{summary.warningCount}</b> cautions</span>
                            <span className={`confidence ${folio.overallConfidence}`}>{confidenceLabels[folio.overallConfidence]}</span>
                            <span className={`folio-status ${folio.status}`}>
                              {folio.status === "approved" ? "Approved" : folio.status === "scholar_edited" ? "Edited · review again" : "Ready for review"}
                            </span>
                          </span>
                          <span className="folio-open-label">
                            {expanded
                              ? "Close folio"
                              : folio.status === "approved"
                                ? "Reopen folio"
                                : "Open and inspect"}{" "}
                            <b aria-hidden="true">{expanded ? "−" : "+"}</b>
                          </span>
                        </button>

                        {expanded ? (
                          <div className="folio-contents" id={`${folio.id}-contents`}>
                            <div className="folio-context">
                              <div><span>Scope for this family</span><p>{folio.scopeNote}</p></div>
                              <div><span>Largest anticipated risk</span><p>{folio.highestRisk}</p></div>
                            </div>

                            <div className="proposal-list">
                              {folio.proposals.map((proposal) => {
                                const editing = proposalDraft?.proposalId === proposal.id;
                                const disclosureOnly = proposal.retrievalEffect === "disclose_only";
                                return (
                                  <article
                                    className={`badger-proposal confidence-${proposal.confidence} ${proposal.active ? "active" : "inactive"} category-${proposal.category}`}
                                    key={proposal.id}
                                  >
                                    <header>
                                      <div>
                                        <span>{categoryLabels[proposal.category]} · from “{proposal.sourceConceptLabel}”</span>
                                        <strong>{proposal.sourceLanguageExpression || "No source-language form proposed yet"}</strong>
                                      </div>
                                      <div className="proposal-state">
                                        <span className={`confidence ${proposal.confidence}`}>{confidenceLabels[proposal.confidence]}</span>
                                        <span>{effectLabels[proposal.retrievalEffect]}</span>
                                        {proposal.pinned ? <span className="pinned">Scholar pinned</span> : null}
                                      </div>
                                    </header>

                                    {editing && proposalDraft ? (
                                      <form className="proposal-edit" onSubmit={(event) => { event.preventDefault(); saveProposalEdit(folio.id); }}>
                                        <label>Source-language expression<input value={proposalDraft.sourceLanguageExpression} onChange={(event) => setProposalDraft({ ...proposalDraft, sourceLanguageExpression: event.target.value })} /></label>
                                        <label>Meaning in ordinary English<textarea rows={2} value={proposalDraft.englishSense} onChange={(event) => setProposalDraft({ ...proposalDraft, englishSense: event.target.value })} /></label>
                                        <label>Why it may help<textarea rows={3} value={proposalDraft.rationale} onChange={(event) => setProposalDraft({ ...proposalDraft, rationale: event.target.value })} /></label>
                                        <label>Literal forms, separated by commas<textarea rows={3} value={proposalDraft.searchForms} onChange={(event) => setProposalDraft({ ...proposalDraft, searchForms: event.target.value })} /></label>
                                        <div><button type="submit">Save and pin my version</button><button type="button" onClick={() => setProposalDraft(null)}>Cancel</button></div>
                                      </form>
                                    ) : (
                                      <>
                                        <p className="proposal-sense">{proposal.englishSense}</p>
                                        <p className="proposal-rationale">{proposal.rationale}</p>

                                        {proposal.searchForms.length ? (
                                          <div className="proposal-forms"><span>Literal forms to test</span><div>{proposal.searchForms.map((form) => <code key={form}>{form}</code>)}</div></div>
                                        ) : null}
                                        {proposal.phrases.length || proposal.syntacticFrame ? (
                                          <div className="proposal-pattern"><span>Phrase or relationship pattern</span><p>{[...proposal.phrases, proposal.syntacticFrame].filter(Boolean).join(" · ")}</p></div>
                                        ) : null}
                                        {proposal.periodTags.length || proposal.genreTags.length ? (
                                          <div className="proposal-tags">
                                            {[...proposal.periodTags, ...proposal.genreTags].map((tag) => <span key={tag}>{tag}</span>)}
                                          </div>
                                        ) : null}

                                        {proposal.falsePositiveForecast.length ? (
                                          <details className="proposal-cautions">
                                            <summary>Why this may produce misleading results ({proposal.falsePositiveForecast.length})</summary>
                                            <ul>{proposal.falsePositiveForecast.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                                          </details>
                                        ) : null}
                                        {proposal.uncertaintyNotes.length ? (
                                          <details className="proposal-cautions uncertainty">
                                            <summary>What remains uncertain ({proposal.uncertaintyNotes.length})</summary>
                                            <ul>{proposal.uncertaintyNotes.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                                          </details>
                                        ) : null}

                                        {proposal.shelfPreview ? <ShelfPreviewResult preview={proposal.shelfPreview} languageLabel={badgerPlan.languageLabel} /> : null}
                                        {shelfPreviewErrors[proposal.id] ? (
                                          <p className="shelf-preview-error" role="alert">{shelfPreviewErrors[proposal.id]}</p>
                                        ) : null}
                                        <div className="proposal-actions">
                                          {!disclosureOnly && proposal.searchForms.length ? (
                                            <button
                                              type="button"
                                              className="test-shelf"
                                              onClick={() => void testProposalOnShelf(proposal)}
                                              disabled={Boolean(shelfPreviewLoadingId)}
                                            >
                                              {shelfPreviewLoadingId === proposal.id
                                                ? "Checking the shelf…"
                                                : proposal.shelfPreview
                                                  ? "Check literal coverage again"
                                                  : "Check literal coverage on this shelf"}
                                            </button>
                                          ) : null}
                                          <button type="button" onClick={() => beginProposalEdit(proposal)}>Edit proposal</button>
                                          <button type="button" className={proposal.pinned ? "active" : ""} onClick={() => toggleProposalPin(folio.id, proposal)}>{proposal.pinned ? "Unpin" : "Pin"}</button>
                                          {disclosureOnly ? (
                                            <span>Shown as a caution; it will not become a search term.</span>
                                          ) : (
                                            <button
                                              type="button"
                                              className={!proposal.active ? "restore" : ""}
                                              onClick={() => toggleProposalActive(folio.id, proposal)}
                                              aria-pressed={proposal.active}
                                            >
                                              {proposal.category === "exclusion_rule"
                                                ? proposal.active
                                                  ? "Remove this keep-out rule"
                                                  : "Restore this keep-out rule"
                                                : proposal.active
                                                  ? "Set proposal aside"
                                                  : "Restore proposal"}
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </article>
                                );
                              })}
                            </div>

                            <div className="folio-approval">
                              <div><span>{activeCount} active proposals</span><p>Approving this folio still does not run full retrieval or judge a match&apos;s relevance.</p></div>
                              <button type="button" onClick={() => toggleFolioApproval(folio.id)} disabled={Boolean(proposalDraft)}>
                                {folio.status === "approved" ? "Return this folio to review" : "Approve this folio"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                <div className={`badger-plan-status ${badgerPlan.approvalStatus}`} aria-live="polite">
                  <div>
                    <span>{badgerPlan.approvalStatus === "approved" ? "Search plan approved" : "Scholar review remains open"}</span>
                    <p>{badgerPlan.approvalStatus === "approved"
                      ? owlRuns.length
                        ? "Every folio is approved. Each search freezes a new receipt; earlier retrieval and owl results remain in connected history."
                        : "Every folio is approved. Literal previews may be attached; full multi-term retrieval and owl judgment have not run."
                      : "Open each folio, keep what helps, and set aside what does not. Approval belongs to you."}</p>
                  </div>
                  <strong>{badgerPlan.folios.filter((folio) => folio.status === "approved").length} / {badgerPlan.folios.length} folios approved</strong>
                </div>

                {badgerPlan.approvalStatus === "approved" ? (
                  <div className="retrieval-launch">
                    <div>
                      <span>Reading aid</span>
                      <label htmlFor="translation-preference">Choose how working translations appear in your reading list</label>
                      <p>These are machine-generated orientation aids for original-language passages, never citable scholarly translations.</p>
                      <select
                        id="translation-preference"
                        value={translationPreference}
                        onChange={(event) => setTranslationPreference(event.target.value as TranslationPreference)}
                        disabled={Boolean(owlStage)}
                      >
                        <option value="auto_strong">Translate stronger passage leads automatically</option>
                        <option value="on_demand">Offer translation only when I request it</option>
                        <option value="off">Do not show translation options for this run</option>
                      </select>
                    </div>
                    <div>
                      <p>
                        The approved fox map and folios will be frozen into a new retrieval receipt.
                        {activeOwlRecord
                          ? " This run will link back to the currently viewed run without replacing it."
                          : " Later revisions will become connected runs rather than overwriting this one."}
                      </p>
                      <button type="button" onClick={() => void startRetrievalRun()} disabled={Boolean(owlStage)}>
                        {owlStage
                          ? "The archive is working…"
                          : activeOwlRecord
                            ? "Run this approved revision"
                            : "Search this approved plan"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {owlStage || owlRuns.length ? (
        <section className={`owl-room ${owlStage ? "owl-working" : "owl-delivered"}`} id="owl-room" aria-labelledby="owl-room-title" aria-busy={Boolean(owlStage)}>
          <div className="owl-room-art" aria-hidden="true" />
          <div className="owl-room-inner">
            <header className="owl-room-heading">
              <div>
                <p className="eyebrow">At the owl&apos;s reading desk</p>
                <h2 id="owl-room-title">Which passages deserve your time?</h2>
              </div>
              <p>
                Your question, fox table, and approved language folios travel with every passage.
                The owl ranks what deserves attention and explains uncertainty; interpretation remains yours.
              </p>
            </header>

            {owlStage ? <OwlWaitingVignette stage={owlStage} /> : null}

            {owlError ? (
              <div className="owl-error" role="alert">
                <div><strong>The reading list did not finish.</strong><p>{owlError}</p></div>
                {activeOwlRecord?.retrieval.candidates.length ? (
                  <button type="button" onClick={() => void retryOwlRun(activeOwlRecord.retrieval)} disabled={Boolean(owlStage)}>
                    Try the owl again with this fixed run
                  </button>
                ) : null}
              </div>
            ) : null}

            {owlRuns.length ? (
              <nav className="retrieval-history" aria-label="Connected retrieval runs">
                <div className="retrieval-history-copy">
                  <span>Your connected search runs</span>
                  <p>Each rerun preserves the earlier reading list instead of overwriting it. Choose a run to compare what changed.</p>
                </div>
                <div>
                  {owlRuns.map((record, index) => (
                    <button
                      type="button"
                      className={record.retrieval.runId === activeOwlRunId ? "active" : ""}
                      onClick={() => setActiveOwlRunId(record.retrieval.runId)}
                      key={record.retrieval.runId}
                    >
                      Run {index + 1}{record.retrieval.runId === activeOwlRunId ? " · Current" : ""}
                      <small>
                        {record.retrieval.parentRunId ? "linked revision" : "first retrieval"} · {record.retrieval.candidates.length} passages
                      </small>
                    </button>
                  ))}
                </div>
              </nav>
            ) : null}

            {activeOwlRecord ? (
              <div className="owl-run">
                <div className="owl-run-receipt">
                  <div>
                    <span>What this search did</span>
                    <p>
                      <b>{activeOwlRecord.retrieval.catalogueScope.totalWorkCount}</b> catalogued works
                      <i aria-hidden="true">→</i>
                      <b>{activeOwlRecord.retrieval.catalogueScope.eligibleWorkCount}</b> eligible after scope
                      <i aria-hidden="true">→</i>
                      <b>{activeOwlRecord.retrieval.stats.rawMatchCount.toLocaleString()}</b> literal word matches
                      <i aria-hidden="true">→</i>
                      <b>{activeOwlRecord.retrieval.stats.deduplicatedCandidateCount.toLocaleString()}</b> distinct passage groups
                      <i aria-hidden="true">→</i>
                      <b>{activeOwlRecord.retrieval.stats.returnedCandidateCount.toLocaleString()}</b> highest-ranked passages sent to the owl
                    </p>
                    {activeOwlRecord.retrieval.catalogueScope.appliedConstraints.length ? (
                      <div className="catalogue-receipt-summary">
                        {activeOwlRecord.retrieval.catalogueScope.appliedConstraints.map((boundary) => (
                          <p key={`${boundary.effect}:${boundary.cardId}`}>
                            <strong>{boundary.effect === "exclude" ? "Kept out" : "Searched within"}</strong>
                            {boundary.constraint.interpretation}
                          </p>
                        ))}
                        <p>
                          <strong>{activeOwlRecord.retrieval.catalogueScope.excludedWorkCount} works excluded</strong>
                          {activeOwlRecord.retrieval.catalogueScope.flaggedWorkCount
                            ? ` ${activeOwlRecord.retrieval.catalogueScope.flaggedWorkCount} uncertain-border works were retained and flagged.`
                            : " No uncertain-border works required flagging."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <details>
                    <summary>How this run can be reproduced</summary>
                    <p>Run receipt {activeOwlRecord.retrieval.runId}</p>
                    <p>Inquiry {activeOwlRecord.retrieval.hashes.inquirySha256}</p>
                    <p>Language plan {activeOwlRecord.retrieval.hashes.languagePlanSha256}</p>
                    <p>Candidate packet {activeOwlRecord.retrieval.hashes.candidatePacketSha256}</p>
                    <p>Complete owl packet {activeOwlRecord.retrieval.hashes.executionPacketSha256}</p>
                    <p>Corpus content {activeOwlRecord.retrieval.corpusReceipt.contentSha256}</p>
                    <p>Scope catalogue {activeOwlRecord.retrieval.corpusReceipt.catalogueScopeSha256}</p>
                    {activeOwlRecord.retrieval.catalogueScope.excludedWorks.length ? (
                      <details className="catalogue-work-details">
                        <summary>Which works the catalogue kept out</summary>
                        <ul>{activeOwlRecord.retrieval.catalogueScope.excludedWorks.map((work) => (
                          <li key={work.documentId}>{work.author}, <i>{work.workTitle}</i> ({work.dateLabel}) — {work.reason}</li>
                        ))}</ul>
                      </details>
                    ) : null}
                    <ul>{activeOwlRecord.retrieval.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
                  </details>
                </div>

                {!activeOwlRecord.retrieval.candidates.length ? (
                  <div className="owl-empty">
                    <strong>No literal candidates reached the owl.</strong>
                    <p>This is a preserved zero-result run on the declared selective shelf, not evidence of historical absence.</p>
                  </div>
                ) : !activeOwlRecord.adjudication && !owlStage ? (
                  <div className="owl-ready">
                    <p>The archive preserved this candidate packet, but it has not received an owl judgment yet.</p>
                    <button type="button" onClick={() => void retryOwlRun(activeOwlRecord.retrieval)}>Place this packet on the owl&apos;s desk</button>
                  </div>
                ) : activeOwlRecord.adjudication ? (
                  <div className="owl-results">
                    <div className="owl-results-heading">
                      <div><span>Source-grounded reading order</span><h3>{activeOwlRecord.adjudication.judgments.length} annotated reading leaves</h3></div>
                    </div>

                    {activeOwlRecord.adjudication.judgments.map((judgment, judgmentIndex) => {
                      const candidate = candidateForJudgment(activeOwlRecord.retrieval, judgment);
                      if (!candidate) return null;
                      const translation = translationForCandidate(activeOwlRecord, judgment);
                      const loadingId = `${activeOwlRecord.retrieval.runId}:${candidate.candidateId}`;
                      return (
                        <article className={`owl-result disposition-${judgment.disposition}`} key={judgment.candidateId}>
                          <header>
                            <div>
                              <span>Reading leaf {String(judgmentIndex + 1).padStart(2, "0")} · {judgment.disposition} relationship · {judgment.confidence} confidence</span>
                              <h4>{candidate.author} · {candidate.workTitle}</h4>
                              <p>{candidate.citationLabel}</p>
                              <p className="candidate-catalogue-line">
                                Composed {candidate.compositionDateLabel} · {candidate.genreTags.join(", ").replaceAll("_", " ")}
                              </p>
                            </div>
                            <strong>Priority {judgment.priority}</strong>
                          </header>

                          <div className="owl-orientation">
                            <span>At a glance</span>
                            <p>{judgment.englishOrientation}</p>
                          </div>

                          <div className="owl-key-passage">
                            <span>Crucial original-language passage</span>
                            <blockquote>{judgment.evidenceExcerpt}</blockquote>
                          </div>

                          <div className="owl-judgment">
                            <span>Why the owl ranked it</span>
                            <p className="owl-relationship">{judgment.relationshipSummary}</p>
                            <p>{judgment.reasoning}</p>
                            {judgment.contextNeeded ? (
                              <p className="context-needed"><strong>Read more widely around this passage.</strong> The retrieved window is enough to identify a possible connection, but not enough to judge it securely. {judgment.contextRequest}</p>
                            ) : null}
                            {judgment.warnings.length ? (
                              <details><summary>Owl cautions ({judgment.warnings.length})</summary><ul>{judgment.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>
                            ) : null}
                            <details className="evidence-receipt">
                              <summary>Inspect exact evidence identifiers</summary>
                              <p>{judgment.evidenceSegmentIds.join(" · ")}</p>
                            </details>
                          </div>

                          <div className="owl-source">
                            <span>Passage in context · original {candidate.languageLabel}</span>
                            {candidate.sourceUnits.map((unit) => (
                              <p
                                className={judgment.evidenceSegmentIds.includes(unit.segmentId) ? "evidence" : unit.matched ? "matched" : ""}
                                key={unit.segmentId}
                              >
                                <small>{unit.citationLabel}</small>{unit.text}
                              </p>
                            ))}
                          </div>

                          {translation ? (
                            <div className="working-translation">
                              <span>Machine-generated working translation</span>
                              <p>{translation.workingTranslation}</p>
                              {translation.translationNotes.length ? <ul>{translation.translationNotes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
                              <strong>For discovery and triage only. Do not cite this translation. Consult the original text and a scholarly translation or qualified reader before rigorous use.</strong>
                            </div>
                          ) : judgment.translationStatus === "available_on_demand" ? (
                            <div className="translation-on-demand">
                              <button
                                type="button"
                                onClick={() => void requestWorkingTranslation(activeOwlRecord, candidate.candidateId)}
                                disabled={Boolean(translationLoadingId)}
                              >
                                {translationLoadingId === loadingId ? "Preparing a working translation…" : "Generate a working translation"}
                              </button>
                              <small>This will create a new machine-translation addendum without changing the owl&apos;s judgment.</small>
                              {translationErrors[loadingId] ? <p role="alert">{translationErrors[loadingId]}</p> : null}
                            </div>
                          ) : (
                            <p className="translation-off">Working translation was turned off for this retrieval run.</p>
                          )}

                          <div className="owl-result-footer">
                            <span>{candidate.rightsStatement}</span>
                            <details className="owl-source-record">
                              <summary>Inspect source record</summary>
                              <dl>
                                <div><dt>Exact citation</dt><dd>{candidate.author} · {candidate.workTitle} · {candidate.citationLabel}</dd></div>
                                <div><dt>Corpus document</dt><dd>{candidate.documentId}</dd></div>
                                <div><dt>Source receipt</dt><dd>{candidate.sourceSha256}</dd></div>
                              </dl>
                              {candidate.sourceUrl ? <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Open archival source file ↗ <small>(may be a large XML file)</small></a> : null}
                            </details>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}

                {activeOwlRecord.adjudication ? (
                  <section className="after-owl" id="after-owl" aria-label="Continue your research">
                    <div>
                      <span>The reading desk remains open</span>
                      <h3>Where would you like to go next?</h3>
                      <p>Revise the language folios to create a connected rerun, or begin a separate inquiry from a clean table.</p>
                    </div>
                    <div className="after-owl-actions">
                      <a href="#badger-room">Revise the folios and search again</a>
                      <button type="button" onClick={startNewInquiry}>Begin a new inquiry</button>
                      <a href="#method">Review how this list was made</a>
                    </div>
                    <button className="pet-librarians" type="button" onClick={() => setLibrarianPetted(true)}>
                      {librarianPetted ? "The librarians accept your peer review." : "Pet the librarians"}
                    </button>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {pileOpen ? (
        <div className="drawer-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPileOpen(false)}>
          <aside className="discard-drawer" role="dialog" aria-modal="true" aria-labelledby="discard-title">
            <div className="drawer-heading">
              <div><p className="eyebrow">Inquiry memory</p><h2 id="discard-title">Set-aside stack</h2></div>
              <button type="button" onClick={() => setPileOpen(false)} aria-label="Close set-aside stack">×</button>
            </div>
            <p className="drawer-intro">These ideas are inactive, not deleted. They do not affect retrieval unless you restore them.</p>
            {pile.length ? (
              <div className="discard-list">
                {[...pile].reverse().map((item) => (
                  <article key={item.id}>
                    <span>{item.kind === "term" ? `From ${item.originFamilyTitle}` : item.kind === "family" ? "Concept family" : item.kind === "scope" ? "Scope choice" : "Former active exclusion"}</span>
                    <strong>{setAsideLabel(item)}</strong>
                    <p>{item.kind === "term" ? item.term.rationale : item.kind === "family" ? item.family.rationale : item.card.rationale}</p>
                    <div>
                      {item.kind === "term" ? (
                        <>
                          <button type="button" onClick={() => restoreTerm(item, false)}>Restore to {item.originFamilyTitle}</button>
                          <button type="button" onClick={() => restoreTerm(item, true)}>Make new table card</button>
                        </>
                      ) : <button type="button" onClick={() => restoreOther(item)}>Restore to worktable</button>}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="empty-pile">Nothing has been set aside. The fox is trying not to take that personally.</p>}
          </aside>
        </div>
      ) : null}

      <section className="method" id="method">
        <div><p className="eyebrow">The method</p><h2>The model proposes.<br />The archive proves.<br />The scholar decides.</h2></div>
        <ol>
          <li><span>01</span><p><strong>Shape the inquiry.</strong> The scholar and fox make the question visible, connected, and editable.</p></li>
          <li><span>02</span><p><strong>Adapt it to the shelf.</strong> Language specialists propose source-language leads, cautions, and exclusions; the scholar approves what will be searched.</p></li>
          <li><span>03</span><p><strong>Search and preserve.</strong> The instrument searches indexed texts, deduplicates overlapping passages, and freezes a reproducible receipt for every run.</p></li>
          <li><span>04</span><p><strong>Build a reading path.</strong> The owl ranks bounded passages, explains uncertainty, and offers clearly labeled working translations; the scholar reads and interprets.</p></li>
        </ol>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">IA</span><span><strong>The Inhabited Archive</strong><small>Built by Shay Cranmer + Avery</small></span></div>
        <p>Code: MIT · Project documentation: CC BY 4.0 · Source rights travel with every record.</p>
        <a href="https://github.com/shaycranmer/inhabited-archive" target="_blank" rel="noreferrer">View the method on GitHub ↗</a>
      </footer>
    </main>
  );
}
