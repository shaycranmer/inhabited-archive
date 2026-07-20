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

The key stays server-side. The live endpoint sets `store: false` and requests
strict structured output from the Responses API. Monitor test usage in the
OpenAI dashboard and rotate or revoke the temporary key after the event if it
is no longer needed.

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
| `app/research-workbench.tsx` | One shared room: continuous fox conversation, concept worktable, pins, set-aside memory, and restoration |
| `app/globals.css` | The visual system for the warm paper-and-ink reading room |

Dynamic micro-corpus retrieval and language-specialist adaptation remain the
next implementation layer. The three-passage Number Rants packet is retained
for regression and negative-control testing only.

## Rights

Code is MIT. Original project documentation is CC BY 4.0. Source-level rights
are shown on every passage and described in the repository’s
`DATA_LICENSES.md`. These licenses do not apply to the excluded research
corpora.
