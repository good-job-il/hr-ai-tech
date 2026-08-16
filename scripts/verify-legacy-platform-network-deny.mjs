import assert from 'node:assert/strict';

for (const url of ['https://app.base44.com', 'https://media.base44.com/file']) {
  await assert.rejects(fetch(url), error => error?.code === 'EBASE44DENIED');
}
const local = await fetch('data:text/plain,allowed');
assert.equal(await local.text(), 'allowed');
console.log('PASS Base44 domains are denied while non-Base44 fetch remains available');
