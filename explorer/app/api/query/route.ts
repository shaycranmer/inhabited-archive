import { NextResponse } from "next/server";
import {
  hydrateWorkspace,
  type ModelWorkspace,
  type QueryWorkspace,
} from "../../../lib/query-plan";
import {
  cleanQuestion,
  extractModelContent,
  protectAiRequest,
  QUERY_MAX_OUTPUT_TOKENS,
} from "../../../lib/server/openai-route";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

const boundarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["label", "rationale"],
  properties: {
    label: { type: "string" },
    rationale: { type: "string" },
  },
} as const;

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "framing",
    "foxReply",
    "nextQuestion",
    "coverageStatus",
    "coverageNote",
    "bridgeSuggestions",
    "conceptFamilies",
    "relationships",
    "scopeChoices",
    "exclusions",
  ],
  properties: {
    framing: { type: "string" },
    foxReply: { type: "string" },
    nextQuestion: { type: "string" },
    coverageStatus: {
      type: "string",
      enum: ["within_planning_scope", "bridge_suggested", "coverage_uncertain"],
    },
    coverageNote: { type: "string" },
    bridgeSuggestions: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: { type: "string" },
    },
    conceptFamilies: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "rationale", "terms"],
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          terms: {
            type: "array",
            minItems: 2,
            maxItems: 10,
            items: boundarySchema,
          },
        },
      },
    },
    relationships: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourceTitle", "targetTitle", "label", "rationale"],
        properties: {
          sourceTitle: { type: "string" },
          targetTitle: { type: "string" },
          label: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
    scopeChoices: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: boundarySchema,
    },
    exclusions: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: boundarySchema,
    },
  },
} as const;

type ConversationTurn = {
  speaker: "fox" | "scholar";
  text: string;
  cardTitle?: string;
};

type RequestBody = {
  action?: "start" | "refine";
  question?: unknown;
  message?: unknown;
  focusCardTitle?: unknown;
  conversation?: unknown;
  workspace?: unknown;
  setAsideLabels?: unknown;
};

function cleanMessage(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 1200) : "";
}

function isWorkspace(value: unknown): value is QueryWorkspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QueryWorkspace>;
  return (
    typeof candidate.framing === "string" &&
    Array.isArray(candidate.conceptFamilies) &&
    Array.isArray(candidate.scopeChoices) &&
    Array.isArray(candidate.exclusions)
  );
}

function cleanConversation(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-10).flatMap((turn) => {
    if (!turn || typeof turn !== "object") return [];
    const candidate = turn as Partial<ConversationTurn>;
    if (
      (candidate.speaker !== "fox" && candidate.speaker !== "scholar") ||
      typeof candidate.text !== "string"
    ) {
      return [];
    }
    return [{
      speaker: candidate.speaker,
      text: candidate.text.slice(0, 1600),
      cardTitle: typeof candidate.cardTitle === "string"
        ? candidate.cardTitle.slice(0, 160)
        : undefined,
    }];
  });
}

export async function POST(request: Request) {
  const protection = protectAiRequest(request);
  if (!protection.allowed) {
    return NextResponse.json(
      { error: protection.error, code: protection.code },
      { status: protection.status },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "The request was unreadable." }, { status: 400 });
  }

  const question = cleanQuestion(body.question);
  const message = cleanMessage(body.message);
  const action = body.action === "refine" ? "refine" : "start";
  const workspace = isWorkspace(body.workspace) ? body.workspace : null;
  const conversation = cleanConversation(body.conversation);
  const focusCardTitle = typeof body.focusCardTitle === "string"
    ? body.focusCardTitle.slice(0, 160)
    : "";
  const setAsideLabels = Array.isArray(body.setAsideLabels)
    ? body.setAsideLabels.filter((item): item is string => typeof item === "string").slice(0, 80)
    : [];

  if (!question) {
    return NextResponse.json({ error: "Begin with a research question." }, { status: 400 });
  }
  if (action === "refine" && (!message || !workspace)) {
    return NextResponse.json(
      { error: "A follow-up needs the current worktable and a message." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Live fox conversation needs an OpenAI API key. The documented workspace remains fully editable.",
        code: "api_key_required",
      },
      { status: 503 },
    );
  }

  const instructions = `You are the fox: a warm, intellectually serious query architect helping a humanities scholar prepare an inspectable historical corpus search.

VOICE AND PRESENCE:
- Sound like a perceptive, lively research partner, not a methods section or a customer-support bot.
- Begin by saying plainly what you heard in the scholar's question. Notice when two or three questions are tucked inside one another.
- Prefer ordinary language first. Use scholarly terminology only when it clarifies something, and briefly explain it when it may be unfamiliar.
- Be warm, curious, and concise. Light dry humor is welcome when it arises naturally, but never force a whimsical line into every reply.
- Ask one clear question at a time. Usually ask no more than three clarification questions across the conversation before saying that the map has enough shape to inspect at the table.
- Do not use pet names, flirting, romantic language, or gestures of physical affection. This is a public scholarly instrument.
- Do not flatter the scholar or praise the question automatically. Engage with what is actually interesting, difficult, or ambiguous in it.
- Write for immediate scholarly judgment, not merely eventual comprehension. A card should let the scholar feel "yes," "no," or "change this" without first translating compressed prose. Prefer direct, concrete labels such as "Search across multiple regions and traditions" over abstract noun clusters such as "Comparative premodern breadth." In rationales, say first what the choice makes the search include, emphasize, or keep out; add methodological nuance only after that is clear.

Translate the scholar's question into a concept map that WOULD be searched if the corpus could be searched intelligently in the scholar's language. Do not answer the historical question. Do not produce Greek, Latin, or other language terms yet; language specialists enter only after map approval.

Organize the dominant search ideas into two to six concept families. Every family title must be unique, and every child label within a family must be unique. Each family should contain a manageable set of child concepts rather than exploding synonyms into dozens of top-level cards. Keep contextual scope separate from active exclusions. An exclusion means the retriever should reject or deprioritize that pattern. Do not treat an idea omitted from present focus as an exclusion.

On a continuing inquiry, the current worktable may mark exactly one concept family or child concept with inquiryFocus true. This is the scholar's Focus of Inquiry: let it lead later clarification and retrieval planning while keeping the other table ideas available as context, comparison, or complication. Do not silently remove it. It is distinct from a pin: focus expresses intellectual priority, while pinning protects scholar-controlled wording. A focusCardTitle in the request only means that the scholar opened that card for conversation; it is not automatically the Focus of Inquiry.

When a relationship between two concept families materially changes what retrieval should look for, express it explicitly in relationships using the exact family titles and a short readable label such as "compared with," "made memorable through," or "tests continuity in." Do not infer meaning from card position, and do not invent a relationship merely to connect every card.

Ask exactly one useful next clarification question at a time. Do not ask for information already supplied. If the recent conversation has already resolved the important ambiguities, use nextQuestion to say that the map has enough shape and invite the scholar to inspect it at the table instead of inventing another question. In foxReply, briefly explain what you changed or noticed in plain, living scholarly language.

Do not claim that a source or tradition exists in the installed corpus: its publication-safe manifest has not yet been attached to this planning call. Use coverage_uncertain by default. Use bridge_suggested when the question is substantially later or outside a premodern text corpus; offer historically responsible conceptual bridges (for example, radios toward acoustics, sound, signaling, or communication) without replacing the scholar's question or claiming those materials are held.

Treat modern psychological, medical, or diagnostic labels as research hypotheses requiring historical evidence, never as automatic descriptions of people in the corpus. Return strict JSON matching the schema.`;

  const input = action === "start"
    ? `Begin a new inquiry.\n\nScholar's question:\n${question}`
    : `Continue the same inquiry and revise the worktable in response to the scholar. Preserve pinned material unless the scholar explicitly asks about it. Do not reintroduce set-aside material automatically. If a card focus is supplied, treat the message as referring to that card while keeping one continuous conversation.\n\nOriginal question:\n${question}\n\nFocused card:\n${focusCardTitle || "none"}\n\nLatest scholar message:\n${message}\n\nRecent conversation:\n${JSON.stringify(conversation)}\n\nCurrent worktable:\n${JSON.stringify(workspace)}\n\nSet-aside labels:\n${JSON.stringify(setAsideLabels)}`;

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        max_output_tokens: QUERY_MAX_OUTPUT_TOKENS,
        instructions,
        input,
        text: {
          format: {
            type: "json_schema",
            name: "historical_query_workspace",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The live fox returned ${apiResponse.status}. Your current table is unchanged.` },
        { status: 502 },
      );
    }

    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const content = extractModelContent(raw);
    if (content.refusal) {
      return NextResponse.json({ error: content.refusal }, { status: 422 });
    }
    if (!content.text) {
      return NextResponse.json(
        { error: "The live fox returned no readable workspace. Your current table is unchanged." },
        { status: 502 },
      );
    }

    const modelWorkspace = JSON.parse(content.text) as ModelWorkspace;
    return NextResponse.json({
      question,
      mode: "live",
      model: MODEL,
      responseId: typeof raw.id === "string" ? raw.id : null,
      notice:
        "The fox built this planning map from your question. No corpus search has run yet.",
      workspace: hydrateWorkspace(modelWorkspace),
    });
  } catch {
    return NextResponse.json(
      { error: "The live fox could not be reached. Your current table is unchanged." },
      { status: 502 },
    );
  }
}
