import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usePuterStore } from '../app/lib/puter.ts';
import { parseFeedback } from '../app/lib/reviews.ts';

const feedback = () => ({
  overallScore: 85,
  ATS: { score: 90, tips: [{ type: 'good', tip: 'Clear headings' }] },
  ...Object.fromEntries(['toneAndStyle', 'content', 'structure', 'skills'].map((key) => [key, { score: 80, tips: [{ type: 'good', tip: 'Clear evidence', explanation: 'Relevant examples.' }] }])),
});

function puter(t, chat) {
  const previous = globalThis.window;
  globalThis.window = { puter: { ai: { chat } } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
}

test('PDF analysis uses the current documented Sonnet model and normalized feedback contract', async (t) => {
  const calls = [];
  const result = { message: { content: JSON.stringify(feedback()) } };
  puter(t, async (...args) => { calls.push(args); return result; });
  const response = await usePuterStore.getState().ai.feedback('/user/resume.pdf', 'Analyze this resume for the target role.');
  assert.equal(calls.length, 1);
  const [messages, options] = calls[0];
  assert.equal(options.model, 'claude-sonnet-4-6');
  assert.equal(options.normalize, true);
  assert.deepEqual(messages[0].content, [
    { type: 'file', puter_path: '/user/resume.pdf' },
    { type: 'text', text: 'Analyze this resume for the target role.' },
  ]);
  assert.deepEqual(parseFeedback(response), feedback());
});

test('provider failures reach the existing retry flow without making extra analysis calls', async (t) => {
  let calls = 0;
  const failure = { code: 'insufficient_funds', message: 'Usage limit reached' };
  puter(t, async () => { calls++; throw failure; });
  await assert.rejects(usePuterStore.getState().ai.feedback('/user/resume.pdf', 'Review'), (error) => error === failure);
  assert.equal(calls, 1);
});
