# The Inhabited Archive

The Build Week research instrument growing from the larger Number Rants corpus
project. Number Rants remains the proving ground and demonstration inquiry;
The Inhabited Archive is the topic-general public interface.

> Translate the question. Not the library.

The app turns an arbitrary scholarly question into an inspectable concept map,
then prepares that map for historically responsible language adaptation and
local corpus search. Number Rants is the proving ground, not a hardcoded query
type. The honest boundary is the coverage of the installed, publication-safe
micro-corpus and its supported language librarians.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

The documented workspace works without secrets and supports direct card
editing, pinning, set-aside, and restoration. To let the fox construct and
revise a map for a new question, copy `.env.example` to `.env.local` and add an
OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6
```

Create and paste the key only in the local `.env.local` file—not in the site,
a chat, a screenshot, source code, or a Git commit. Keep the variable name
exactly `OPENAI_API_KEY`; prefixes such as `NEXT_PUBLIC_` or `VITE_` can expose
values to browser code. The repository ignores `.env.local`, while the empty
`.env.example` remains safe to publish. Restart the local development server
after adding the key.

The key stays server-side. All live model routes set `store: false` and request
strict structured output from the Responses API. The long-running badger route
uses background mode and short polling requests so a several-minute folio build
does not depend on one browser connection surviving. OpenAI temporarily retains
that background response for roughly ten minutes so polling can work; it is not
ordinary stored response history. See the official
[background-mode guide](https://developers.openai.com/api/docs/guides/background).
Monitor test usage in the OpenAI dashboard and rotate or revoke the temporary
key after the event if it is no longer needed.

## Load the local Latin shelf

The repository does not track the 97 MB derived SQLite database or its 48 MB
D1 import file. After the verified Latin database has been built, create the
serving import and load it into the project-local D1 emulator:

```bash
pnpm run shelf:export
pnpm run shelf:import-local
```

The export refuses to overwrite an existing artifact. Its import contains only
the thirty-work demonstration shelf's serving projection and carries the pinned
source commit plus canonical content hash. The app checks that receipt before
running any preview. This is a reproducible local proof; a public D1 instance
must be loaded and its receipt checked separately before deployment.

Public live-AI deployment is fail-closed. Every spending route requires exact
same-origin requests; the fox, badger, owl, and translation calls have explicit
output ceilings; and a
production runtime refuses AI calls until an external Cloudflare rate limit or
equivalent protection has been installed and acknowledged with
`AI_RATE_LIMIT_CONFIGURED=true`. The flag is an interlock, not the protection
itself. Follow `../docs/PUBLIC_AI_DEPLOYMENT_GATE.md` before enabling it. A public
deployment without a project-owned API key does not need to enable the gate.

## Verify

```bash
pnpm run lint
pnpm run test
```

## Technical / plain-language architecture

| Technical layer | What it means |
|---|---|
| `lib/passages.ts` | The regression packet: exact texts, citations, rights, and expected labels; not the live search shelf |
| `lib/query-plan.ts` | The topic-general concept-family, scope, exclusion, and workspace contract |
| `app/api/query/route.ts` | The fox’s desk: GPT-5.6 builds and revises the English-level map without pretending a corpus search has run |
| `lib/adaptation-plan.ts` | The badger folio contract, source-card reconciliation, and evidence-status boundary |
| `app/api/adapt/route.ts` | Starts the Latin badger's GPT-5.6 adaptation of an approved fox table under Rowan's method packet and a strict schema |
| `app/api/adapt/status/route.ts` | Checks the badger's background-job receipt without starting another paid generation |
| `app/api/shelf-preview/route.ts` | Runs a literal, read-only diagnostic against the D1 Latin shelf and returns counts, basket distribution, distinct-work examples, and source receipts |
| `lib/retrieval-run.ts` | Defines immutable linked retrieval receipts, bounded literal-plan compilation, overlap deduplication, deterministic ranking, and reproducibility hashes |
| `app/api/retrieve/route.ts` | Executes an approved multi-folio plan against D1 without a model and preserves zero-result runs |
| `app/api/owl/route.ts` | Starts one source-grounded background adjudication of the complete fox, badger, and candidate packet |
| `app/api/owl/status/route.ts` | Polls that owl receipt without purchasing another generation |
| `app/api/translate/route.ts` | Creates a separate machine working-translation addendum for one supplied candidate when the run permits it |
| `db/schema.ts` | The intentionally small D1 serving schema; the full canonical SQLite builder remains authoritative |
| `app/research-workbench.tsx` | The continuous fox room and concept table, expandable language folios, immutable linked run history, and the owl's source-grounded reading room |
| `app/globals.css` | The visual system for the warm paper-and-ink reading room |

The live Latin adaptation route, visual folio room, D1 diagnostic preview,
approved-plan retrieval, overlap-aware candidate construction, owl
adjudication, selective automatic translation, and on-demand translation
addenda are implemented. A July 20 live run turned 126 literal matches into 121
deduplicated units, sent 18 bounded candidates to the owl, and received 18
source-grounded judgments. Four strong results translated automatically, and
one liminal result received a separate on-demand addendum. The three-passage
Number Rants packet remains a
regression and negative-control fixture only.

Each rerun is appended with a `parentRunId`; editing and reapproving folios does
not overwrite earlier candidate lists or owl judgments. V1 run history is held
for the current browser session. Durable project storage/export remains open.

With the local server running, the versioned topic-general adaptation trials
can be repeated with `pnpm run eval:badger`. Pass one fixture name—such as
`pnpm run eval:badger friendship-and-betrayal`—to run a single case. These are
live API evaluations and therefore use the configured key; their compact
terminal output never prints the key.

## Rights

Code is MIT. Original project documentation is CC BY 4.0. Source-level rights
are shown on every passage and described in the repository’s
`DATA_LICENSES.md`. These licenses do not apply to the excluded research
corpora.
