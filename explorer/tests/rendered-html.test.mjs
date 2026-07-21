import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the research instrument", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>The Inhabited Archive<\/title>/i);
  assert.match(html, /Translate the question/);
  assert.match(html, /Bring a question to the fox/);
  assert.doesNotMatch(html, /Your question enters a larger room/);
  assert.doesNotMatch(html, /query-ornament/);
  assert.match(html, /Tell me what you.*trying to find/i);
  assert.match(html, /Tell the fox/);
  assert.match(html, /Concept worktable/);
  assert.match(html, /Here.*what I think you mean/i);
  assert.doesNotMatch(html, /Relationship threads/);
  assert.match(html, /changes the meaning of/);
  assert.match(html, /Yes—this looks like my question/);
  assert.match(html, /Leaving home/);
  assert.match(html, /Set-aside stack/);
  assert.match(html, /What this demo shelf can cover/);
  assert.match(html, /The model proposes/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /librarian-panorama-v1\.png/);
  assert.match(css, /fox-clarification-room-v1\.png/);
  assert.match(css, /latin-badger-folio-room-v1\.png/);
});

test("locks every demo passage to provenance and rights", async () => {
  const source = await readFile(new URL("../lib/passages.ts", import.meta.url), "utf8");
  const ids = [...source.matchAll(/^\s+id: "([^"]+)"/gm)].map((match) => match[1]);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((source.match(/^    sourceUrl:/gm) ?? []).length, 3);
  assert.equal((source.match(/^    rights:/gm) ?? []).length, 3);
  assert.match(source, /CC BY-SA 4\.0/);
  assert.match(source, /public domain/);
  assert.match(source, /CC0 1\.0/);
});

test("keeps the live query contract topic-general", async () => {
  const route = await readFile(new URL("../app/api/query/route.ts", import.meta.url), "utf8");
  assert.match(route, /arbitrary|scholar's question/i);
  assert.match(route, /conceptFamilies/);
  assert.match(route, /scopeChoices/);
  assert.match(route, /relationships/);
  assert.match(route, /bridge_suggested/);
  assert.match(route, /perceptive, lively research partner/i);
  assert.match(route, /no more than three clarification questions/i);
  assert.match(route, /family title must be unique/i);
  assert.match(route, /Focus of Inquiry/);
  assert.match(route, /immediate scholarly judgment/i);
  assert.match(route, /I’m done — take me to the table/);
  assert.doesNotMatch(route, /candidatePacket|six was perfect|passages\.map/);

  const client = await readFile(new URL("../app/research-workbench.tsx", import.meta.url), "utf8");
  assert.match(client, /Make focus/);
  assert.match(client, /keep the inquiry broad/i);
  assert.match(client, /listening for the shape of the question/i);
  assert.match(client, /prewritten documentation, not a live model response/i);
  assert.match(client, /present map remains safe/i);
  assert.match(client, /describeTablePlacements/);
  assert.match(client, /Probably not what you need/);
  assert.match(client, /highlightedEvidenceText/);
  assert.doesNotMatch(client, /Crucial original-language passage/);
  assert.doesNotMatch(client, /OPENAI_API_KEY|NEXT_PUBLIC_OPENAI|VITE_OPENAI/);

  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(envExample, /^OPENAI_API_KEY=$/m);
  assert.doesNotMatch(envExample, /sk-[A-Za-z0-9_-]{20,}/);
});
