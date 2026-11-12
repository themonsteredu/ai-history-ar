import { useState } from 'react';
import { TEACHER_PIN } from '../../auth/teacherAccess';
import { goryeoCode, GORYEO_TAG } from '../goryeo/readyCards';
import { artifacts as goryeoArtifacts } from '../goryeo/data';
import { ARTIFACTS } from './artifacts';
import { assignGroupArtifact, type OpenItem } from './api';
import type { GroupCard } from './model';

/** Existing card assignments are immutable here: only unassigned groups can receive an artifact. */
export function TeacherArtifactAssignments({ era, code, groupCount, cards, sessionToken, loaded, onRefresh }: {
  era: 'goryeo' | 'joseon'; code: string; groupCount: number; cards: OpenItem<GroupCard>[];
  sessionToken?: string; loaded: boolean; onRefresh: () => Promise<unknown>;
}) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState<number>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const catalog = era === 'goryeo'
    ? goryeoArtifacts.map((artifact, index) => ({ id: index + 1, name: artifact.short }))
    : ARTIFACTS;
  async function assign(group: number) {
    const current = cards.find(item => item.data.group === group);
    const artifactId = choices[group];
    if (!loaded || !sessionToken || saving !== undefined || current?.data.artifactId || !catalog.some(item => item.id === artifactId)) return;
    setSaving(group); setError(''); setMessage('');
    try {
      await assignGroupArtifact(era === 'goryeo' ? goryeoCode(code) : code, sessionToken, group, artifactId, current?.version || 0, TEACHER_PIN, era === 'goryeo' ? GORYEO_TAG : undefined);
      setMessage(`${group}모둠 유물을 배정했어요.`);
      await onRefresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '유물을 배정하지 못했어요. 다시 확인해 주세요.');
      // A peer teacher may have assigned the group while this screen was open.
      try { await onRefresh(); } catch { /* Keep the original assignment error visible. */ }
    } finally { setSaving(undefined); }
  }
  return <details className="oc-panel" aria-label="모둠별 유물 배정">
    <summary>모둠별 유물 배정</summary>
    <p>학생이 입장하기 전에 유물을 배정해 주세요. 이미 저장된 모둠은 현재 유물과 작성 내용을 그대로 유지합니다.</p>
    {!loaded ? <p role="status">기존 모둠 기록을 확인하는 중…</p> : <div className="teacher-workspace__table-wrap"><table className="teacher-workspace__table">
      <thead><tr><th scope="col">모둠</th><th scope="col">유물</th><th scope="col">배정</th></tr></thead>
      <tbody>{Array.from({ length: groupCount }, (_, index) => index + 1).map(group => {
        const card = cards.find(item => item.data.group === group)?.data;
        const fixed = !!card?.artifactId;
        const name = catalog.find(item => item.id === card?.artifactId)?.name;
        return <tr key={group}>
          <th scope="row">{group}모둠</th>
          <td>{fixed ? <strong>{name || '기존 배정 유물'}</strong> : <select aria-label={`${group}모둠 배정할 유물`} value={choices[group] || ''} disabled={saving !== undefined || !sessionToken} onChange={event => { setChoices(value => ({ ...value, [group]: Number(event.target.value) })); setError(''); setMessage(''); }}>
            <option value="">유물을 선택하세요</option>{catalog.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>}</td>
          <td>{fixed ? <span>배정 유지 · 변경 불가</span> : <button type="button" disabled={!sessionToken || !choices[group] || saving !== undefined} onClick={() => void assign(group)}>{saving === group ? '배정 중…' : `${group}모둠 배정 저장`}</button>}</td>
        </tr>;
      })}</tbody>
    </table></div>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </details>;
}
