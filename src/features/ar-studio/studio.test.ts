/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleStudio } from '../../../sites-worker/arStudio';
import { arLessons } from './curriculum';
import { newStudioProject, newPoint, newQuestion, isStudioProject, submissionProblems } from './project';
import { isArExhibit, newArExhibit } from '../../lib/ar/exhibit';

function completeProject(group = 1, heritageId = 1) {
  const p = newStudioProject(group, heritageId); p.modelChecked = p.pointsChecked = true;
  p.ar.points.push(newPoint(3));
  p.ar.points.forEach((point, i) => { point.title = `설명 ${i + 1}`; point.text = '자료에서 확인한 해설'; point.narration = { data: 'data:audio/wav;base64,UklGRg==', seconds: 2 }; });
  p.questions.forEach((q, i) => { q.prompt = `무엇을 사용했나요? ${i + 1}`; q.options = ['벽돌', '나무', '철']; q.answer = i; }); return p;
}
function environment() {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys=ON'); for (const file of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(`drizzle/${file}`, 'utf8'));
  const files = new Map<string, string>();
  const DB = { prepare(query: string) { let args: unknown[] = []; const stmt = { bind(...values: unknown[]) { args = values; return stmt; }, async first() { return sql.prepare(query).get(...args as never[]) || null; }, async all() { return { results: sql.prepare(query).all(...args as never[]) }; }, async run() { const r = sql.prepare(query).run(...args as never[]); return { meta: { changes: Number(r.changes) } }; } }; return stmt; } };
  const BUCKET = { async put(key: string, value: string) { files.set(key, value); }, async get(key: string) { const value = files.get(key); return value === undefined ? null : { async text() { return value; } }; }, async delete(key: string) { files.delete(key); } };
  async function call(path: string, data?: unknown, token?: string, teacher?: string) {
    const r = await handleStudio(new Request(`https://class.example/api/ar-studio${path}`, { method: data === undefined ? 'GET' : 'POST', headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'https://class.example' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(teacher ? { 'oai-authenticated-user-id': teacher } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) }), { DB: DB as never, BUCKET });
    return { status: r.status, data: await r.json() as any };
  }
  return { sql, files, call };
}
describe('six-lesson AR studio', () => {
  it('allocates 40 minutes per AR lesson, validates 3–4 recordings and preserves old two-point files', () => {
    expect(arLessons.map(l => [l.id, l.segments.reduce((n, s) => n + s.minutes, 0)])).toEqual([[4, 40], [5, 40], [6, 40]]);
    expect(isArExhibit(newArExhibit())).toBe(true);
    const p = completeProject(); expect(isStudioProject(p)).toBe(true); expect(submissionProblems(p)).toEqual([]);
    p.ar.points[0].position[0] = Infinity; expect(isStudioProject(p)).toBe(false);
    const bad = completeProject(); bad.ar.model!.parts![0].scale[0] = 0; expect(isStudioProject(bad)).toBe(false);
    const absent = completeProject(); delete absent.ar.points[1].narration; expect(submissionProblems(absent).length).toBe(1);
  });
  it('runs independent group authoring, frozen exhibition and individually graded quiz without leaking answers', async () => {
    const { call, sql } = environment();
    expect((await call('/rooms', { code: 'class1' })).status).toBe(401);
    expect((await call('/rooms', { code: 'class1' }, undefined, 'teacher-1')).status).toBe(200);
    expect((await call('/rooms', { code: 'class1' }, undefined, 'teacher-2')).status).toBe(403);
    const s1 = (await call('/join', { code: 'class1', name: '가', group: 1 })).data;
    const s2 = (await call('/join', { code: 'class1', name: '나', group: 2 })).data;
    expect((await call('/rooms/class1/phase', { phase: 'visiting' }, s1.token)).status).toBe(401);
    const one = completeProject(1, 3), two = completeProject(2, 2);
    expect((await call('/rooms/class1/works/1', { project: one, expectedVersion: 0 }, s1.token)).status).toBe(403);
    await call('/rooms/class1/editor', { memberId: s1.memberId }, undefined, 'teacher-1');
    await call('/rooms/class1/editor', { memberId: s2.memberId }, undefined, 'teacher-1');
    expect((await call('/rooms/class1/works/2', { project: two, expectedVersion: 0 }, s1.token)).status).toBe(403);
    expect((await call('/rooms/class1/works/1', { project: one, expectedVersion: 0 }, s1.token)).data.version).toBe(1);
    expect((await call('/rooms/class1/works/1', { project: one, expectedVersion: 0 }, s1.token)).status).toBe(409);
    expect((await call('/rooms/class1/works/1?draft=1', undefined, s2.token)).status).toBe(403);
    expect((await call('/rooms/class1/works/2', { project: two, expectedVersion: 0 }, s2.token)).status).toBe(200);
    expect((await call('/rooms/class1', undefined, s1.token)).data.questions).toBeUndefined();
    expect((await call('/rooms/class1/phase', { phase: 'visiting' }, undefined, 'teacher-1')).status).toBe(200);
    const publicWork = await call('/rooms/class1/works/1', undefined, s2.token);
    expect(publicWork.status).toBe(200); expect(publicWork.data.ar.points).toHaveLength(4); expect(publicWork.data.questions).toBeUndefined();
    expect((await call('/rooms/class1/works/1?draft=1', undefined, s1.token)).status).toBe(403);
    expect((await call('/rooms/class1/works/1', { project: one, expectedVersion: 1 }, s1.token)).status).toBe(409);
    expect((await call('/rooms/class1/phase', { phase: 'quiz' }, undefined, 'teacher-1')).status).toBe(200);
    const quiz = (await call('/rooms/class1', undefined, s2.token)).data.questions;
    expect(quiz).toHaveLength(4); expect(quiz.every((q: any) => !('answer' in q))).toBe(true);
    const response = Object.fromEntries(quiz.map((q: any) => [q.id, 0]));
    expect((await call('/rooms/class1/answers', { answers: response, role: '녹음', reflection: '자료를 확인했다.', student_id: s1.memberId }, s2.token)).data).toEqual({ submitted: true });
    expect(sql.prepare('SELECT member_id FROM ar_answers').get()?.member_id).toBe(s2.memberId);
    await call('/rooms/class1/answers', { answers: Object.fromEntries(quiz.map((q: any) => [q.id, 2])), role: '변경', reflection: '변경' }, s2.token);
    expect(sql.prepare('SELECT count(*) AS count FROM ar_answers').get()?.count).toBe(1);
    expect((await call('/rooms/class1/answers', undefined, s2.token)).data.score).toBeUndefined();
    await call('/rooms/class1/phase', { phase: 'review' }, undefined, 'teacher-1');
    const result = (await call('/rooms/class1/answers', undefined, s2.token)).data;
    expect(result.score).toBe(2); expect(result.total).toBe(4); expect(result.details).toHaveLength(4);
    expect((await call('/rooms/class1/teacher', undefined, s1.token)).status).toBe(401);
    expect((await call('/rooms/class1/teacher', undefined, undefined, 'teacher-1')).data.reports[0].name).toBe('나');
    sql.close();
  });
  it('rejects other-class tokens and keeps storage failures distinct from success', async () => {
    const { call, sql } = environment();
    await call('/rooms', { code: 'class1' }, undefined, 'teacher-1'); await call('/rooms', { code: 'class2' }, undefined, 'teacher-2');
    const student = (await call('/join', { code: 'class1', name: '학생', group: 1 })).data;
    expect((await call('/rooms/class2', undefined, student.token)).status).toBe(403);
    expect((await call('/rooms/class1/phase', { phase: 'quiz' }, undefined, 'teacher-2')).status).toBe(403);
    expect((await handleStudio(new Request('https://class.example/api/ar-studio/join', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' }), {})).status).toBe(403);
    expect((await handleStudio(new Request('https://class.example/api/ar-studio/rooms/class1'), {})).status).toBe(503);
    sql.close();
  });
  it('resumes unfinished models, transfers group edit rights and excludes drafts from exhibition', async () => {
    const { call, sql, files } = environment();
    await call('/rooms', { code: 'class3' }, undefined, 'teacher-1');
    const first = (await call('/join', { code: 'class3', name: '첫 담당', group: 1 })).data;
    const next = (await call('/join', { code: 'class3', name: '다음 담당', group: 1 })).data;
    await call('/rooms/class3/editor', { memberId: first.memberId }, undefined, 'teacher-1');
    const project = newStudioProject(1, 2);
    expect((await call('/rooms/class3/works/1', { project, expectedVersion: 0, submit: true }, first.token)).status).toBe(400);
    expect((await call('/rooms/class3/works/1', { project, expectedVersion: 0, submit: false }, first.token)).data.version).toBe(1);
    expect((await call('/rooms/class3/works/1?draft=1', undefined, first.token)).data.project).toEqual(project);
    expect((await call('/rooms/class3/teacher', undefined, undefined, 'teacher-1')).data.gallery).toHaveLength(0);
    expect((await call('/rooms/class3/phase', { phase: 'visiting' }, undefined, 'teacher-1')).status).toBe(409);
    await call('/rooms/class3/editor', { memberId: next.memberId }, undefined, 'teacher-1');
    expect((await call('/rooms/class3/works/1?draft=1', undefined, first.token)).status).toBe(403);
    expect((await call('/rooms/class3/works/1', { project, expectedVersion: 1, submit: false }, first.token)).status).toBe(403);
    expect((await call('/rooms/class3/works/1?draft=1', undefined, next.token)).data.version).toBe(1);
    expect((await call('/rooms/class3/works/1', { project: completeProject(1, 2), expectedVersion: 1 }, next.token)).data.version).toBe(2);
    const size = files.size;
    expect((await call('/rooms/class3/works/1', { project, expectedVersion: 1, submit: false }, next.token)).status).toBe(409);
    expect(files.size).toBe(size);
    expect((await call('/rooms/class3/phase', { phase: 'visiting' }, undefined, 'teacher-1')).status).toBe(200);
    sql.close();
  });
  it('combines all six groups into eighteen questions with distinct identities', async () => {
    const { call, sql } = environment();
    await call('/rooms', { code: 'class6' }, undefined, 'teacher-1');
    let viewer = '';
    for (let group = 1; group <= 6; group++) {
      const member = (await call('/join', { code: 'class6', name: `${group}모둠`, group })).data; viewer = member.token;
      await call('/rooms/class6/editor', { memberId: member.memberId }, undefined, 'teacher-1');
      const project = completeProject(group, group);
      project.questions.push({ ...newQuestion(project.ar.points[0].id), prompt: '이 유물의 재료는?', options: ['돌', '나무', '철'], answer: 0 });
      expect((await call(`/rooms/class6/works/${group}`, { project, expectedVersion: 0 }, member.token)).status).toBe(200);
    }
    await call('/rooms/class6/phase', { phase: 'visiting' }, undefined, 'teacher-1');
    await call('/rooms/class6/phase', { phase: 'quiz' }, undefined, 'teacher-1');
    const room = (await call('/rooms/class6', undefined, viewer)).data;
    expect(room.gallery).toHaveLength(6); expect(room.questions).toHaveLength(18);
    expect(new Set(room.questions.map((q: { id: string }) => q.id)).size).toBe(18);
    expect(room.questions.every((q: Record<string, unknown>) => !('answer' in q))).toBe(true);
    sql.close();
  });
});
