const assert = require('node:assert/strict');
const test = require('node:test');
const { createHandler } = require('../backend/packages/jsb/search');

const origin = 'https://the-next-level-as.github.io';
const documents = [
  { _id: 'sanity-a', id: 'car-loan', title: 'Billån', content: 'Lån til kjøp av bil.' },
  { _id: 'sanity-b', id: 'mortgage', title: 'Boliglån', content: 'Finansiering av bolig.' },
  { _id: 'drafts.sanity-c', id: 'draft', title: 'Draft content' },
  { _id: 'sanity-d', title: 'Missing ID' },
];

function request(message = 'Jeg trenger penger til ny bil', extra = {}) {
  return { http: { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ message }), ...extra } };
}

function fakeFetch(output = { ids: ['car-loan', 'mortgage'] }, options = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (calls.length === 1) return { ok: true, json: async () => ({ result: documents }) };
    return {
      ok: true,
      json: async () => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) }, ...options }] }),
    };
  };
  return { calls, fetchImpl };
}

test('returns ranked semantic IDs using server credentials and public published content', async () => {
  const { calls, fetchImpl } = fakeFetch();
  const main = createHandler({ fetchImpl, env: { OPENAI_API_KEY: 'server-secret' } });
  const event = request();
  event.OPENAI_API_KEY = 'caller-secret';
  event.http.body = JSON.stringify({ message: 'Jeg trenger penger til ny bil', OPENAI_API_KEY: 'caller-secret' });
  const result = await main(event);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { ids: ['car-loan', 'mortgage'] });
  assert.equal(result.headers['Access-Control-Allow-Origin'], origin);
  assert.match(calls[0].url, /^https:\/\/zq5it0ga\.api\.sanity\.io\//);
  assert.equal(new URL(calls[0].url).searchParams.get('perspective'), 'published');
  assert.equal(calls[0].init.headers, undefined);
  assert.equal(calls[1].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[1].init.headers.Authorization, 'Bearer server-secret');
  const modelRequest = JSON.parse(calls[1].init.body);
  assert.equal(modelRequest.model, 'gpt-4o');
  assert.equal(modelRequest.response_format.json_schema.strict, true);
  assert.deepEqual(JSON.parse(modelRequest.messages[1].content).documents.map(document => document.id), ['car-loan', 'mortgage']);
  assert.ok(calls.every(call => call.init.signal instanceof AbortSignal));
});

test('missing server credential cannot be replaced with a caller-provided key', async () => {
  const main = createHandler({ env: {}, fetchImpl: () => assert.fail('must not contact providers') });
  const event = request();
  event.OPENAI_API_KEY = 'caller-key';
  event.http.body = JSON.stringify({ message: 'Lån', OPENAI_API_KEY: 'caller-key' });
  const result = await main(event);
  assert.equal(result.statusCode, 503);
  assert.doesNotMatch(JSON.stringify(result), /caller-key/);
});

test('preflight works without credentials and denies unlisted origins', async () => {
  const main = createHandler({ env: {}, fetchImpl: () => assert.fail('must not contact providers') });
  const preflight = await main(request('', { method: 'OPTIONS' }));
  assert.equal(preflight.statusCode, 204);
  assert.equal(preflight.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
  assert.equal(preflight.headers['Access-Control-Allow-Headers'], 'Content-Type');
  const denied = await main(request('Lån', { headers: { origin: 'https://other.example', 'content-type': 'application/json' } }));
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
  const local = createHandler({ env: { ALLOWED_ORIGINS: origin + ',http://localhost:8000' } });
  const localResponse = await local(request('', { method: 'OPTIONS', headers: { origin: 'http://localhost:8000' } }));
  assert.equal(localResponse.headers['Access-Control-Allow-Origin'], 'http://localhost:8000');
});

test('the deployment placeholder cannot trigger an OpenAI request', async () => {
  const main = createHandler({ env: { OPENAI_API_KEY: 'UNCONFIGURED' }, fetchImpl: () => assert.fail('must not contact providers') });
  assert.equal((await main(request())).statusCode, 503);
});

test('existing Sanity IDs containing a slash remain searchable', async () => {
  const node = { _id: 'sanity-vipps', id: 'vipps/kredit-card', title: 'Kredittkort + Vipps = Sant', content: 'Bruk kredittkort i Vipps.' };
  let calls = 0;
  const main = createHandler({ env: { OPENAI_API_KEY: 'server-secret' }, fetchImpl: async () => ({ ok: true, json: async () => ++calls === 1 ? { result: [node] } : { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ ids: [node.id] }) } }] } }) });
  assert.deepEqual((await main(request('kredittkort i Vipps'))).body, { ids: [node.id] });
});

test('rejects unsupported methods, malformed JSON, wrong content types, and invalid queries before spending tokens', async () => {
  const main = createHandler({ env: { OPENAI_API_KEY: 'key' }, fetchImpl: () => assert.fail('must not contact providers') });
  assert.equal((await main(request('Lån', { method: 'GET' }))).statusCode, 405);
  assert.equal((await main(request('Lån', { headers: { 'content-type': 'text/plain' } }))).statusCode, 415);
  for (const input of ['', '   ', 'x'.repeat(1001), null, 42, {}]) {
    assert.equal((await main(request(input))).statusCode, 400);
  }
  assert.equal((await main(request('Lån', { body: '{invalid' }))).statusCode, 400);
});

test('accepts raw base64 bodies and exact input-length limit', async () => {
  const { fetchImpl } = fakeFetch({ ids: [] });
  const main = createHandler({ env: { OPENAI_API_KEY: 'key' }, fetchImpl });
  const result = await main(request('', { body: Buffer.from(JSON.stringify({ message: 'æ'.repeat(1000) })).toString('base64'), isBase64Encoded: true }));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { ids: [] });
});

test('deduplicates results while preserving relevance order', async () => {
  const { fetchImpl } = fakeFetch({ ids: ['mortgage', 'car-loan', 'mortgage'] });
  const result = await createHandler({ env: { OPENAI_API_KEY: 'key' }, fetchImpl })(request());
  assert.deepEqual(result.body, { ids: ['mortgage', 'car-loan'] });
});

test('rejects fabricated, draft, malformed, or excessive model results', async () => {
  for (const output of [{ ids: ['unknown'] }, { ids: ['draft'] }, { ids: [null] }, { ids: 'car-loan' }, { ids: Array(6).fill('car-loan') }]) {
    const { fetchImpl } = fakeFetch(output);
    const result = await createHandler({ env: { OPENAI_API_KEY: 'key' }, fetchImpl })(request());
    assert.equal(result.statusCode, 502);
  }
  for (const options of [{ finish_reason: 'length' }, { message: { refusal: 'no', content: '{"ids":[]}' } }, { message: { content: 'not-json' } }]) {
    const { fetchImpl } = fakeFetch({ ids: [] }, options);
    assert.equal((await createHandler({ env: { OPENAI_API_KEY: 'key' }, fetchImpl })(request())).statusCode, 502);
  }
});

test('handles upstream HTTP failures, malformed data, and timeouts without leaking details', async () => {
  for (const fetchImpl of [
    async () => ({ ok: false, status: 401 }),
    async () => ({ ok: true, json: async () => ({ result: {} }) }),
    async () => { throw new DOMException('secret provider diagnostics', 'TimeoutError'); },
  ]) {
    const result = await createHandler({ env: { OPENAI_API_KEY: 'server-secret' }, fetchImpl })(request());
    assert.equal(result.statusCode, 502);
    assert.doesNotMatch(JSON.stringify(result), /secret|diagnostics|401/);
    assert.equal(result.headers['Access-Control-Allow-Origin'], origin);
  }
});
