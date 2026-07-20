"use client";

import { useEffect, useState } from "react";
import {
  documentedQuestion,
  documentedWorkspace,
  type BoundaryCard,
  type ConceptFamily,
  type ConceptRelationship,
  type ConceptTerm,
  type ExplorerResponse,
  type QueryWorkspace,
} from "../lib/query-plan";

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

const initialWorkspace = documentedWorkspace();

const firstMapLoadingNotes = [
  "One moment—the fox is inspecting his card catalogue.",
  "He’s separating what to seek from where to seek it.",
  "A few cards are arguing about where they belong.",
  "He’s laying the first map on the table now.",
];

const revisionLoadingNotes = [
  "The fox is reconsidering the table. Nothing will move until his revision is ready.",
  "He’s checking which cards your change touches—and which it should leave alone.",
  "A little reshuffling. The present map remains safe until the new one is ready.",
];

function FoxLoadingVignette({ kind, compact = false }: { kind: "first-map" | "revision"; compact?: boolean }) {
  const notes = kind === "first-map" ? firstMapLoadingNotes : revisionLoadingNotes;
  const [noteIndex, setNoteIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNoteIndex((current) => (current + 1) % notes.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [kind, notes.length]);

  return (
    <div className={`fox-loading-vignette ${compact ? "compact" : ""}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="catalogue-motion" aria-hidden="true">
        <span className="catalogue-drawer" />
        <span className="catalogue-card card-one" />
        <span className="catalogue-card card-two" />
        <span className="catalogue-thread" />
      </div>
      <div>
        <span>{kind === "first-map" ? "The catalogue stirs" : "The table stays put"}</span>
        <p key={noteIndex}>{notes[noteIndex]}</p>
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
    "A documented, editable workspace is loaded. Add an API key to begin a different inquiry live.",
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

  function commit(
    nextWorkspace: QueryWorkspace,
    nextPile: SetAsideItem[],
    message: string,
    viewCardId?: string,
  ) {
    setReceipt({
      message,
      viewCardId,
      previousWorkspace: workspace,
      previousPile: pile,
    });
    setWorkspace(nextWorkspace);
    setPile(nextPile);
    setMapApproved(false);
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
    setLoadingTarget("question");
    setError("");
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", question }),
      });
      const result = (await response.json()) as ExplorerResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "The fox could not begin the inquiry.");
      setWorkspace(result.workspace);
      setCardOrder(result.workspace.conceptFamilies.map((family) => family.id));
      setConversation([
        { id: makeId("turn"), speaker: "scholar", text: question.trim() },
        { id: makeId("turn"), speaker: "fox", text: describeFox(result.workspace) },
      ]);
      setMode("live");
      setInquiryStarted(true);
      setNotice(result.notice);
      setPile([]);
      setReceipt(null);
      setFocusedFamilyId(null);
      setMapApproved(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fox could not begin the inquiry.");
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
    setInquiryStarted(true);
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

  function approveMap() {
    setMapApproved(true);
    setNotice(
      "The concept map is approved. Language-specialist adaptation is the next build boundary; no corpus search has run yet.",
    );
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
              {mode === "live" ? "Live inquiry" : "Documented example"}
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
              {loadingTarget === "question" ? <FoxLoadingVignette kind="first-map" /> : null}
              <div className="fox-room-note">
                <p>{notice}</p>
                {mode === "demo" ? (
                  <button type="button" onClick={openDocumentedConversation}>
                    Open the documented conversation
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
              </div>
              {!tableVisible && loadingTarget !== null && loadingTarget !== "question"
                ? <FoxLoadingVignette kind="revision" />
                : null}
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
                    Take me to the table
                  </button>
                  <button className="fox-send" type="submit" disabled={!followUp.trim() || loadingTarget !== null}>
                    {loadingTarget === "conversation" ? "Reconsidering…" : "Answer the fox"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {error ? <p className="fox-error" role="alert">{error}</p> : null}
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
              ? <FoxLoadingVignette kind="revision" compact />
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
              <label htmlFor="table-fox-follow-up">Talk to the fox about this table</label>
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
              <p>Drag to rearrange. Position never changes retrieval.</p>
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
                          <div className="term-preview">
                            {family.terms.slice(0, 3).map((term) => <span key={term.id}>{term.label}</span>)}
                            {family.terms.length > 3 ? <span>+{family.terms.length - 3} more</span> : null}
                          </div>
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
                          <button type="button" onClick={() => setAsideFamily(family)}>Set aside this family</button>
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
                      <div className="boundary-actions">
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
                      <div className="boundary-actions">
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
              : inquiryFocus
                ? `“${inquiryFocus.label}” is the Focus of Inquiry. The other ideas remain in play.`
                : "Would you like to focus on one area, or keep the inquiry broad? You may mark one family or concept as the Focus of Inquiry if you wish."}</p>
          </div>
          <button className="approve-map" type="button" onClick={approveMap} disabled={mapApproved}>
            {mapApproved ? "Map approved" : "Yes—this looks like my question"}
          </button>
          <button className="keep-working" type="button" onClick={focusTableFox}>Keep working with the fox</button>
        </div>
      </section>

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
          <li><span>01</span><p><strong>Clarify the question</strong> until the visible map represents what the scholar wants to investigate.</p></li>
          <li><span>02</span><p><strong>Adapt concepts historically</strong> through only the language and corpus specialists relevant to the inquiry.</p></li>
          <li><span>03</span><p><strong>Search real indexed texts</strong> while stable source IDs, locations, context, and rights remain attached.</p></li>
          <li><span>04</span><p><strong>Return evidence to read.</strong> Confidence, reasons, and disagreement stay visible; interpretation remains human.</p></li>
        </ol>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">IA</span><span><strong>The Inhabited Archive</strong><small>Built by Shay Cranmer + Avery</small></span></div>
        <p>Code: MIT · Project documentation: CC BY 4.0 · Source rights travel with every record.</p>
        <a href="https://github.com/shaycranmer/number-rants-explorer" target="_blank" rel="noreferrer">View the method on GitHub ↗</a>
      </footer>
    </main>
  );
}
