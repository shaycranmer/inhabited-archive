# Public AI Deployment Gate

Status: blocking before any public deployment carries a live `OPENAI_API_KEY`

## Why this gate exists

`POST /api/query` and `POST /api/adapt` start work that spends project-owned
OpenAI tokens. `POST /api/adapt/status` only checks the receipt for an already
started badger job. `POST /api/shelf-preview` does not invoke a model, but it
does consume database reads and should receive its own moderate public limit. A
public URL without an abuse control is an open wallet even when the key itself
never reaches the browser.

All three routes now:

- reject requests without an exact same-origin `Origin` header;
- cap model output (`8,000` tokens for the fox and `16,000` for the badger);
- fail closed in production unless `AI_RATE_LIMIT_CONFIGURED=true`.

Same-origin enforcement prevents ordinary cross-site browser calls. It is not
authentication and a script can forge that header. The production flag is a
deployment interlock, not the rate limiter itself.

**Shay translation:** the public app refuses to spend money until we have
checked a separate Cloudflare lock and deliberately turned the key.

## Satisfying the gate

Before setting `AI_RATE_LIMIT_CONFIGURED=true`, choose and verify one of these:

1. Create Cloudflare WAF rate-limiting rules for exact-path `POST` requests.
   Apply the strict spending limit to `/api/query` and `/api/adapt`: for a
   single-presenter demonstration, a conservative starting point is eight
   requests per ten minutes per client, followed by a managed challenge or
   block. Give `/api/adapt/status` a separate, substantially higher allowance
   because the browser checks it about once every three seconds while a folio
   is building; those checks do not start new model generations. A starting
   allowance of 240 status checks per ten minutes per client supports one
   continuous job with headroom while still bounding abuse. Shared conference
   networks can make IP-only limits unfair, so inspect the actual plan and
   audience before freezing either number. A starting allowance of 60 shelf
   previews per ten minutes per client is ample for deliberate folio inspection
   while bounding scripted database reads.
2. Add Cloudflare Turnstile to the inquiry flow and validate every token on the
   server. Client-side display without the Siteverify call does not satisfy the
   gate.
3. Deploy without `OPENAI_API_KEY`. The documented no-key tour remains safe;
   developers can run live inquiry locally with their own key.

Official references:

- <https://developers.cloudflare.com/waf/rate-limiting-rules/>
- <https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/>
- <https://developers.cloudflare.com/turnstile/get-started/server-side-validation/>

## Verification receipt required before enabling

Record the protected hostname, exact paths and methods, counting key, request
budget, period, mitigation action, test timestamp, and one observed blocked or
challenged request. Record the spending and status-check rules separately.
Only then set the runtime flag to `true` and repeat one legitimate fox call
plus one legitimate badger call through completion.
