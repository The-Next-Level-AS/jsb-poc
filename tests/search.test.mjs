import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

let content = [];
const queries = [];
globalThis.__searchTestClient = { fetch: async (query) => { queries.push(query); return content; } };
const source = (await readFile(new URL("../ask2.js", import.meta.url), "utf8"))
  .replace('import { createClient } from "https://esm.sh/@sanity/client";', 'const createClient = () => globalThis.__searchTestClient;');
const { askAI2 } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const node = (id) => ({ id, title: id, content_short_2_2: "Summary" });

test("reconnects the existing search to the semantic backend and preserves ranked content", async (t) => {
  content = [node("bankid"), node("bank-card-block"), node("vipps/kredit-card")];
  const fetch = t.mock.method(globalThis, "fetch", async () => ({
    ok: true, json: async () => ({ ids: ["bank-card-block", "vipps/kredit-card", "bankid"] }),
  }));
  assert.deepEqual(await askAI2("jeg har mistet lommeboken"), [content[1], content[2], content[0]]);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.match(url, /\/search$/);
  assert.equal(options.method, "POST");
  assert.deepEqual(options.headers, { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(options.body), { message: "jeg har mistet lommeboken" });
  for (let e = 0; e < 4; e++) {
    for (let a = 0; a < 4; a++) assert.ok(queries.at(-1).includes(`content_short_${e}_${a}`));
  }
});

test("empty or stale result IDs never become undefined cards", async (t) => {
  content = [node("bankid")];
  for (const ids of [[], ["removed-node"]]) {
    t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => ({ ids }) }));
    assert.deepEqual(await askAI2("Et spørsmål"), []);
    t.mock.restoreAll();
  }
});

test("failed or invalid backend responses reject without returning fabricated results", async (t) => {
  for (const response of [
    { ok: false },
    { ok: true, json: async () => ({}) },
    { ok: true, json: async () => ({ ids: "bankid" }) },
  ]) {
    t.mock.method(globalThis, "fetch", async () => response);
    await assert.rejects(askAI2("Et spørsmål"), /search/i);
    t.mock.restoreAll();
  }
});
