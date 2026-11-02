import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

// Use the project's TypeScript transformer; no browser or cloud account required.
const source = await readFile(new URL('../app/lib/reviews.ts', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(source, 'reviews.ts', { loader: 'ts', format: 'esm' });
const { analyzeResume, isFeedback, parseFeedback, readSavedReview, validateJobContext } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const feedback = () => ({
  overallScore: 85,
  ATS: { score: 90, tips: [{ type: 'good', tip: 'Clear headings' }] },
  ...Object.fromEntries(['toneAndStyle', 'content', 'structure', 'skills'].map((key) => [key, { score: 80, tips: [{ type: 'improve', tip: 'Add evidence', explanation: 'Describe a verified result.' }] }])),
});
const response = () => ({ message: { content: JSON.stringify(feedback()) } });
const fixture = () => {
  const calls = { convert: 0, upload: 0, feedback: 0, records: [], stages: [] };
  const input = { file: { name: 'resume.pdf', size: 100, type: 'application/pdf' }, companyName: ' Northstar ', jobTitle: ' Developer ', jobDescription: ' Build accessible interfaces with React and TypeScript. ', prompt: 'Review this resume' };
  const services = {
    convert: async () => { calls.convert++; return { name: 'resume.png' }; },
    upload: async () => ({ path: `file-${++calls.upload}` }),
    feedback: async () => { calls.feedback++; return response(); },
    save: async (key, value) => { calls.records.push({ key, data: JSON.parse(value) }); return true; },
  };
  const draft = { id: 'review-123' };
  const run = () => analyzeResume(input, draft, services, (stage) => calls.stages.push(stage));
  return { input, services, draft, calls, run };
};

test('saves a complete review only after validated analysis, with trimmed context', async () => {
  const { calls, run, draft } = fixture();
  assert.equal(await run(), 'review-123');
  assert.deepEqual(calls.stages, ['preparing', 'reviewing', 'saving']);
  assert.equal(calls.records.length, 1);
  const record = calls.records[0];
  assert.equal(record.key, 'resume:review-123');
  assert.equal(record.data.companyName, 'Northstar');
  assert.equal(record.data.jobTitle, 'Developer');
  assert.equal(record.data.jobDescription, 'Build accessible interfaces with React and TypeScript.');
  assert.deepEqual(record.data.feedback, feedback());
  assert.equal(readSavedReview(JSON.stringify(record.data)).id, 'review-123');
  assert.equal(draft.saved, true);
});

test('unreadable PDFs fail before any cloud upload or analysis', async () => {
  const { services, calls, run } = fixture();
  services.convert = async () => null;
  await assert.rejects(run(), /couldn’t read this PDF/);
  assert.equal(calls.upload, 0);
  assert.equal(calls.feedback, 0);
  assert.equal(calls.records.length, 0);
});

test('an image-upload retry reuses the PDF and converted image', async () => {
  const { services, calls, run, draft } = fixture();
  const upload = services.upload;
  let fail = true;
  services.upload = async (files) => {
    if (files[0].name === 'resume.png' && fail) { fail = false; throw Error('Network unavailable'); }
    return upload(files);
  };
  await assert.rejects(run(), /Network unavailable/);
  assert.equal(draft.resumePath, 'file-1');
  assert.equal(calls.records.length, 0);
  await run();
  assert.equal(calls.convert, 1);
  assert.equal(calls.upload, 2);
  assert.equal(calls.feedback, 1);
});

test('malformed or incomplete AI feedback is never published', async () => {
  const { services, calls, run } = fixture();
  services.feedback = async () => ({ message: { content: '{invalid' } });
  await assert.rejects(run(), /couldn’t be read/);
  assert.equal(calls.records.length, 0);
  services.feedback = async () => ({ message: { content: JSON.stringify({ overallScore: 85 }) } });
  await assert.rejects(run(), /incomplete/);
  assert.equal(calls.records.length, 0);
  services.feedback = async () => response();
  await run();
  assert.equal(calls.convert, 1);
  assert.equal(calls.upload, 2);
  assert.equal(calls.records.length, 1);
});

test('save retry reuses feedback and the review key instead of calling AI again', async () => {
  const { services, calls, run, draft } = fixture();
  const save = services.save;
  services.save = async () => false;
  await assert.rejects(run(), /without repeating the analysis/);
  assert.ok(draft.feedback);
  assert.notEqual(draft.saved, true);
  calls.stages.length = 0;
  services.save = save;
  await run();
  assert.equal(calls.feedback, 1);
  assert.equal(calls.convert, 1);
  assert.equal(calls.upload, 2);
  assert.deepEqual(calls.stages, ['saving']);
  assert.equal(calls.records[0].key, 'resume:review-123');
});

test('network analysis failures can be retried with the uploaded files', async () => {
  const { services, calls, run } = fixture();
  services.feedback = async () => { throw Error('Connection lost'); };
  await assert.rejects(run(), /Connection lost/);
  assert.equal(calls.records.length, 0);
  services.feedback = async () => response();
  await run();
  assert.equal(calls.convert, 1);
  assert.equal(calls.upload, 2);
  assert.equal(calls.records.length, 1);
});

test('supports fenced JSON and text-block responses', () => {
  assert.deepEqual(parseFeedback({ message: { content: `\u0060\u0060\u0060json\n${JSON.stringify(feedback())}\n\u0060\u0060\u0060` } }), feedback());
  assert.deepEqual(parseFeedback({ message: { content: [{ type: 'text', text: JSON.stringify(feedback()) }] } }), feedback());
  assert.throws(() => parseFeedback(null), /couldn’t be read/);
});

test('rejects invalid scores, missing categories, and malformed tips', () => {
  for (const score of [-1, 101, null, '85']) assert.equal(isFeedback({ ...feedback(), overallScore: score }), false);
  const noSkills = feedback(); delete noSkills.skills;
  assert.equal(isFeedback(noSkills), false);
  const missingExplanation = feedback(); delete missingExplanation.content.tips[0].explanation;
  assert.equal(isFeedback(missingExplanation), false);
  assert.throws(() => readSavedReview(JSON.stringify({ id: 'old-partial', feedback: '' })), /incomplete/);
  assert.throws(() => readSavedReview('{broken'));
});

test('requires a job title and description, including whitespace-only values', () => {
  for (const value of ['', '   ', '\n\t']) {
    assert.ok(validateJobContext({ jobTitle: value, jobDescription: 'Role requirements' }).jobTitle);
    assert.ok(validateJobContext({ jobTitle: 'Developer', jobDescription: value }).jobDescription);
  }
  assert.deepEqual(validateJobContext({ jobTitle: 'Developer', jobDescription: 'Role requirements' }), {});
});

test('missing job context is blocked before conversion, upload, AI, or saving', async () => {
  for (const field of ['jobTitle', 'jobDescription']) {
    const { input, calls, run } = fixture();
    input[field] = '   ';
    await assert.rejects(run(), field === 'jobTitle' ? /Enter the job title/ : /Add the job description/);
    assert.equal(calls.convert, 0);
    assert.equal(calls.upload, 0);
    assert.equal(calls.feedback, 0);
    assert.equal(calls.records.length, 0);
    assert.deepEqual(calls.stages, []);
  }
});

test('company remains optional when the role and requirements are provided', async () => {
  const { input, calls, run } = fixture();
  input.companyName = '';
  await run();
  assert.equal(calls.records[0].data.companyName, '');
  assert.equal(calls.feedback, 1);
});
