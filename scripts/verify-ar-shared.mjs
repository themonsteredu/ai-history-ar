// Run only with two operator-provisioned, expiring QA classrooms; never use real class codes.
// node scripts/verify-ar-shared.mjs https://ai-history-ar.vercel.app qa... qa...
import assert from 'node:assert/strict';
const [origin, code, otherCode] = process.argv.slice(2);
assert.equal(origin, 'https://ai-history-ar.vercel.app');
assert.match(code || '', /^qa[a-z0-9]{10}$/); assert.match(otherCode || '', /^qa[a-z0-9]{10}$/);
assert.notEqual(code, otherCode);
async function api(path, token, body, expected = 200) {
  const response = await fetch(`${origin}/api/ar-studio${path}`, {
    method: body === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(30000),
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(response.status, expected, `${path} returned ${response.status}, expected ${expected}`);
  assert.match(response.headers.get('cache-control'), /no-store/);
  return response.json();
}
// Synthetic PCM silence, not a recording of a person.
const wav = Buffer.alloc(1644);
wav.write('RIFF', 0); wav.writeUInt32LE(1636, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(1600, 40);
const audio = `data:audio/wav;base64,${wav.toString('base64')}`;
function project(group) {
  return { version: 1, group, heritageId: 3, modelChecked: false, pointsChecked: false, role: '', reflection: '',
    ar: { question: '', answerId: 'qa-point-1', model: { format: 'obj', asset: 'cheomseongdae-nsm-2015', data: '', name: 'QA 첨성대', credit: '', source: '', rotation: [-90, 0, 0] },
      points: [1, 2, 3].map(n => ({ id: `qa-point-${n}`, title: `QA ${n}번 설명`, text: `QA ${group}모둠 공유 확인`, position: [0, .2 * n, .2], photoPosition: [.5, .2 * n], narration: { data: audio, seconds: .1 } })) },
    questions: [{ id: 'qa-question-1', prompt: 'QA 첨성대의 재료는?', options: ['돌', '나무', '흙'], answer: 0, pointId: 'qa-point-1' }, { id: 'qa-question-2', prompt: '', options: ['', '', ''], answer: 0, pointId: 'qa-point-2' }] };
}
assert.equal((await api('/health')).status, 'ready');
await api(`/rooms/${code}`, undefined, undefined, 401);
const owners = await Promise.all([1, 2, 3, 4, 5, 6].map(group => api('/join', undefined, { code, name: `QA ${group}모둠 대표`, group })));
const viewer = await api('/join', undefined, { code, name: 'QA 별도 관람 태블릿', group: 1 });
const outsider = await api('/join', undefined, { code: otherCode, name: 'QA 다른 수업', group: 1 });
assert.equal(new Set([...owners, viewer, outsider].map(m => m.token)).size, 8);
await Promise.all(owners.map(async owner => {
  const saved = await api(`/rooms/${code}/works/${owner.group}`, owner.token, { project: project(owner.group), expectedVersion: 0 });
  assert.equal(saved.version, 1); assert.equal(saved.shared, true);
}));
const room = await api(`/rooms/${code}`, viewer.token);
assert.equal(room.gallery.length, 6); assert.equal(room.questions.length, 6); assert.equal(room.canEdit, false);
assert.ok(room.questions.every(q => !Object.hasOwn(q, 'answer')));
await Promise.all([1, 2, 3, 4, 5, 6].map(async group => {
  const work = await api(`/rooms/${code}/works/${group}`, viewer.token);
  for (const point of work.ar.points) { assert.equal(point.narration.data, audio); assert.equal(point.text, `QA ${group}모둠 공유 확인`); }
  assert.ok(work.ar.model.credit.length > 0); assert.equal(work.ar.question, '');
}));
await api(`/rooms/${code}/works/1`, viewer.token, { project: project(1), expectedVersion: 1 }, 403);
await api(`/rooms/${code}/works/1`, owners[1].token, { project: project(1), expectedVersion: 1 }, 403);
await api(`/rooms/${code}/works/1?draft=1`, viewer.token, undefined, 403);
await api(`/rooms/${code}/works/1`, owners[0].token, { project: project(1), expectedVersion: 0 }, 409);
await api(`/rooms/${code}`, outsider.token, undefined, 403);
await api(`/rooms/${code}/teacher`, viewer.token, undefined, 403);
const result = await api(`/rooms/${code}/answers`, viewer.token, { answers: Object.fromEntries(room.questions.map(q => [q.id, 0])), role: 'QA 관람', reflection: 'QA 설명 확인', questionVersion: room.questionVersion });
assert.equal(result.score, 6); assert.equal(result.questions.length, 6);
await api(`/rooms/${code}/works/1`, owners[0].token, { project: project(1), expectedVersion: 1 });
await api(`/rooms/${code}/answers`, owners[1].token, { answers: {}, role: 'QA', reflection: 'QA', questionVersion: room.questionVersion }, 409);
assert.deepEqual(await api(`/rooms/${code}/answers`, viewer.token), result);
assert.deepEqual(await api(`/rooms/${code}/answers`, owners[1].token), { submitted: false });
console.log(JSON.stringify({ status: 'passed', independentStudents: 8, sharedGroups: 6, audioReadbacks: 18, writerProtection: true, staleWriteProtection: true, classroomIsolation: true, privateQuizSnapshots: true }));
