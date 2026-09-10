import { readFile } from 'node:fs/promises';

// Explicit live check: invokes the deployed model; excluded from the unit test command.
const cases = JSON.parse(await readFile(new URL('../tests/semantic-cases.json', import.meta.url), 'utf8'));
const endpoint = process.env.SEARCH_ENDPOINT || 'https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-b858f54b-90b1-4e75-b3d7-e729bccfc432/jsb/search';
let failures = 0;
for (const sample of cases) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://the-next-level-as.github.io' },
      body: JSON.stringify({ message: sample.query }),
      signal: AbortSignal.timeout(50000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { ids } = await response.json();
    const passed = Array.isArray(ids) && ids.length <= 5 &&
      ids.every(id => typeof id === 'string') && new Set(ids).size === ids.length &&
      (!sample.empty || ids.length === 0) &&
      (!sample.topIds || sample.topIds.includes(ids[0])) &&
      (sample.includeIds || []).every(id => ids.includes(id)) &&
      (sample.excludeIds || []).every(id => !ids.includes(id));
    if (!passed) failures++;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${sample.name}: ${JSON.stringify(ids)}`);
  } catch (error) {
    failures++;
    console.log(`FAIL ${sample.name}: ${error.message}`);
  }
}
console.log(`${cases.length - failures}/${cases.length} semantic cases passed.`);
if (failures) process.exitCode = 1;
