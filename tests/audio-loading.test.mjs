import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (await readFile(new URL("../audio.js", import.meta.url), "utf8"))
  .replace('import { askAI2 } from "./ask2.js";',
    "const askAI2 = (...args) => globalThis.searchStub(...args);");
const { common } = await import(`data:text/javascript;base64,${Buffer.from(source + "\nexport { common };\n").toString("base64")}`);

class Element {
  constructor() {
    this.children = [];
    this.attributes = {};
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  set innerHTML(value) {
    assert.equal(value, "");
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
}

function fixture(t, searchStub) {
  const previous = new Map(["window", "document", "searchStub"]
    .map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const ui = new Element();
  const items = Array.from({ length: 10 }, () => new Element());
  globalThis.document = {
    getElementById: (id) => { assert.equal(id, "ui"); return ui; },
    querySelector: (selector) => items[Number(selector.slice(5)) - 1],
    createElement: () => new Element(),
  };
  globalThis.window = {};
  globalThis.searchStub = searchStub;
  return {
    items,
    loading: () => items[0].children.filter((child) => child.className === "search-loading"),
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("search shows an accessible loading indicator until results arrive", async (t) => {
  const pending = deferred();
  const { loading, items } = fixture(t, () => pending.promise);
  const request = common("bankkort");
  assert.equal(loading().length, 1);
  assert.equal(loading()[0].attributes.role, "status");
  assert.equal(loading()[0].textContent, "Tenker...");
  pending.resolve([{ id: "card" }]);
  await request;
  assert.equal(loading().length, 0);
  assert.deepEqual(window.searchResult, [{ id: "card" }]);
  assert.equal(items[0].children.length, 6);
});

test("search removes the indicator when the backend rejects", async (t) => {
  const pending = deferred();
  const { loading } = fixture(t, () => pending.promise);
  const request = common("bankkort");
  assert.equal(loading().length, 1);
  const rejected = assert.rejects(request, /Backend unavailable/);
  pending.reject(new Error("Backend unavailable"));
  await rejected;
  assert.equal(loading().length, 0);
});

test("an empty result shows a status instead of cards and clears on the next search", async (t) => {
  const retry = deferred();
  const { loading, items } = fixture(t, (query) => query === "empty" ? Promise.resolve([]) : retry.promise);
  await common("empty");
  assert.equal(loading().length, 0);
  const emptyStatus = items[0].children.find((child) => child.textContent === "Ingen treff.");
  assert.ok(emptyStatus);
  assert.equal(emptyStatus.attributes.role, "status");
  assert.equal(items[0].children.length, 2);

  const request = common("retry");
  assert.equal(items[0].children.includes(emptyStatus), false);
  assert.equal(loading().length, 1);
  retry.resolve([{ id: "card" }]);
  await request;
  assert.equal(loading().length, 0);
  assert.equal(items[0].children.some((child) => child.textContent === "Ingen treff."), false);
  assert.equal(items[0].children.length, 6);
});

for (const outcome of ["resolve", "reject"]) {
  test(`an older request that ${outcome}s does not remove the active indicator`, async (t) => {
    const first = deferred(), second = deferred();
    const { loading, items } = fixture(t, (query) => query === "first" ? first.promise : second.promise);
    const firstRequest = common("first");
    const secondRequest = common("second");
    assert.equal(loading().length, 1);
    const activeIndicator = loading()[0];
    if (outcome === "resolve") {
      first.resolve([]);
      await firstRequest;
    } else {
      const rejected = assert.rejects(firstRequest, /Old request failed/);
      first.reject(new Error("Old request failed"));
      await rejected;
    }
    assert.deepEqual(loading(), [activeIndicator]);
    assert.equal(items[0].children.some((child) => child.textContent === "Ingen treff."), false);
    second.resolve([]);
    await secondRequest;
    assert.equal(loading().length, 0);
  });
}
