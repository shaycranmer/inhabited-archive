# Install The Inhabited Archive

For a zero-install tour, open the public no-key demonstration:
<https://inhabited-archive.shaytaki.chatgpt.site>. It exposes the saved journey
and the complete hosted Latin shelf without a project-owned model key. Asking a
new live question requires a local installation and your own OpenAI API key.

This guide separates three things that are easy to blur together:

1. **The librarians:** the fox, badger, owl, interface, and reproducibility contracts in `explorer/`.
2. **The model connection:** a server-side OpenAI API key and selected OpenAI model.
3. **The library shelf:** a corpus transformed into the catalogue and passage schema the librarians can inspect.

The shipped demonstration uses a reviewed thirty-work Perseus Latin shelf. A
new library does not become compatible merely by being cloned beside the app;
it needs a source adapter that preserves its texts, citations, rights, stable
identifiers, and catalogue metadata in the shared schema.

## 1. Requirements

- Node.js 22.13 or later
- pnpm
- Python 3 for rebuilding or exporting the demonstration shelf
- An OpenAI API key only for live fox, badger, owl, and working-translation calls

The saved demonstration can be opened without an API key. Live original
questions require one.

The submission was verified on macOS. Its ordinary Node and Cloudflare tooling
should also run on Linux; Windows users should prefer WSL. Native Windows has
not been independently verified for this release.

## 2. Install the application

From the repository root:

```bash
cd explorer
pnpm install
cp .env.example .env.local
```

Put the key only in `explorer/.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6
```

Never put a real key in browser-visible variables, screenshots, source code, a
chat transcript, or Git. In particular, do not rename it with a
`NEXT_PUBLIC_` or `VITE_` prefix. Restart the server after changing the file.

This implementation uses OpenAI's Responses API. An Anthropic/Claude key is
not interchangeable; another provider needs an explicit adapter and its own
evaluation pass.

## 3. Prepare the demonstration shelf

The public repository does not place a generated database in Git history.
Choose the small release download for the fastest setup, or rebuild it from the
pinned Perseus source to verify the complete provenance chain.

### Route A: use the separately downloaded serving shelf

Download
[`inhabited-archive-latin-demo-shelf-v1.sql.gz`](https://github.com/shaycranmer/inhabited-archive/releases/download/v0.1.0-build-week/inhabited-archive-latin-demo-shelf-v1.sql.gz)
from the Build Week release. Its compressed SHA-256 is:

```text
3187930941d58ba1fba2220e5b5fe4c3355c8ab12b0767eb56b49ed9bde7ec01
```

Decompress it and place the SQL file at:

```text
derived/demo_latin/perseus_latin_demo_v1.d1.sql
```

Then, from `explorer/`, load it into the local D1 database:

```bash
pnpm run shelf:import-local
```

The import contains 30 works and 61,651 provenance-locked passages. The app
checks its internal corpus receipt before using it; a file at the right path
without the right receipt is rejected.

### Route B: rebuild from the pinned Perseus source

Clone `PerseusDL/canonical-latinLit` into
`sources/raw/perseus-latin`, check out the exact commit recorded in
`sources/indexes/demo_latin_30.csv`, and keep that checkout clean. From the
repository root:

```bash
python3 tools/build_demo_latin_corpus.py
```

That creates the canonical SQLite shelf and its build receipt. Then create the
D1 serving projection and import it:

```bash
cd explorer
pnpm run shelf:export
pnpm run shelf:import-local
```

The builder verifies the pinned source commit. The export carries source and
content hashes. Import refuses to turn an unreceipted pile of text into an
apparently trustworthy library.

## 4. Run and verify

```bash
pnpm run dev
```

Open `http://localhost:3000`. Then, before demonstrating or modifying the
library contract:

```bash
pnpm run test
```

Expected verification for this release: a successful production build and 43
passing application tests. The broader research-infrastructure tests can also
be run from the repository root with:

```bash
python3 -m unittest discover -s tests -v
```

## What each mode can do

| Mode | API key | Latin shelf | What it demonstrates |
|---|---:|---:|---|
| Public hosted tour | No | Included | Saved scholar journey, interface, sources, receipts, and method |
| Local interface only | No | Optional | No-key documentation and direct interface inspection |
| Local full shelf | No | Yes | Deterministic Latin retrieval and corpus receipts |
| Local live inquiry | Yes | Yes | Complete fox → badger → retrieval → owl journey for a new question |

The key pays only for model reasoning. Shelf search, scope enforcement,
deduplication, and receipt generation are deterministic application work.

## 5. Connect another library

Keep the original corpus immutable. Build a source-specific adapter that emits:

- one stable document record per work or edition;
- bounded passage/segment records with exact citation labels;
- source URLs or addresses, source hashes, and rights statements;
- composition-date ranges and certainty;
- normalized genre and tradition tags;
- a corpus receipt identifying the source snapshot and generated content.

Load those records into the tables defined in `explorer/db/schema.ts`. The
Latin reference implementation is documented in
`../schema/PERSEUS_LATIN_DEMO_ADAPTER_V1.md`; its reviewed work-level metadata
is in `../sources/indexes/demo_latin_catalogue_scope.csv`.

Technical translation: the adapter makes a different corpus satisfy the same
database and provenance contract.

Plain-English translation: Codex or Claude Code may help relabel a scholar's
messy library, but it must make a dependable card catalogue—not merely dump
files into a folder. Once that catalogue exists, the librarians can stand at
the front of the new library without rewriting its books.

## 6. Ratify before trusting it

For every added language or corpus:

- inspect sample citations against the source;
- verify rights and redistribution boundaries;
- test date, genre, and tradition exclusions;
- test known positive passages and seductive false positives;
- record missing authors, periods, and genres as coverage limits;
- run the fox-to-owl journey and confirm every leaf points back to exact source text.

Absence from one installed shelf is never evidence of historical absence.

## 7. Public deployment safety

Local keys remain local. A public deployment needs a project-owned server-side
key, same-origin protection, spending limits, and an external request-rate
limit before live AI routes are enabled. Follow
`PUBLIC_AI_DEPLOYMENT_GATE.md`; setting
`AI_RATE_LIMIT_CONFIGURED=true` acknowledges protection that already exists—it
does not create that protection.
