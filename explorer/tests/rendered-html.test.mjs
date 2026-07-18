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
  assert.match(html, /<title>Number Rants Explorer<\/title>/i);
  assert.match(html, /Translate the question/);
  assert.match(html, /Build my reading list/);
  assert.match(html, /Nicomachus of Gerasa/);
  assert.match(html, /Augustine of Hippo/);
  assert.match(html, /Marcus has six donkeys/);
  assert.match(html, /The model proposes/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
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
