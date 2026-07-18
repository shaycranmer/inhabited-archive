# Number Rants Explorer

The Build Week research interface for the larger Number Rants corpus project.

> Translate the question. Not the library.

The app turns an English research question into an inspectable concept map,
adapts that map for Ancient Greek and Latin search, and returns a short cited
reading list with human adjudication controls. It uses a rights-safe packet of
primary-source excerpts, so the public demo does not expose the local 60 GiB
research library.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

The documented demo works without secrets. To enable live query planning and
candidate judgments, copy `.env.example` to `.env.local` and add an OpenAI API
key:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-sol
```

The key stays server-side. The live endpoint sets `store: false` and requests
strict structured output from the Responses API.

## Verify

```bash
pnpm run lint
pnpm run test
```

## Technical / plain-language architecture

| Technical layer | What it means |
|---|---|
| `lib/passages.ts` | The small public shelf: exact texts, citations, rights, and expected labels |
| `lib/query-plan.ts` | The documented example and the shape of a librarian’s answer |
| `app/api/query/route.ts` | The locked reading-room desk: GPT-5.6 may judge supplied records but cannot add books |
| `app/research-workbench.tsx` | The scholar’s workspace: question, concept map, language plans, sources, and corrections |
| `app/globals.css` | The visual system for the warm paper-and-ink reading room |

## Rights

Code is MIT. Original project documentation is CC BY 4.0. Source-level rights
are shown on every passage and described in the repository’s
`DATA_LICENSES.md`. These licenses do not apply to the excluded research
corpora.
