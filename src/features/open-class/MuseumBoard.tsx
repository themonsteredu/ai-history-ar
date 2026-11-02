import { useEffect, useRef } from 'react';
import { artifactById } from './artifacts';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import type { OpenState } from './api';
import { selfItemDone, type Verification } from './model';
import './museum-board.css';

export const PRESENTATION_GOAL = 2;

/** Count only a written draft whose own evidence and judgment are complete. */
export function museumProgress(check?: Verification) {
  if (!check || check.mode !== 'self') return { verified: 0, presentable: 0, rows: [] };
  const rows = (check.selfQuestions || []).map((question, index) => {
    const item = check.items.find(value => value.questionId === question.id);
    const complete = !!question.statement.trim() && !!item && selfItemDone(item);
    return { index: index + 1, complete, presentable: complete && item?.decision !== 'exclude', started: !!question.statement.trim() || !!item };
  });
  return { rows, verified: rows.filter(row => row.complete).length, presentable: rows.filter(row => row.presentable).length };
}

type Props = { code: string; groupCount: number; state: OpenState; updatedAt?: number; error: string; onClose: () => void; onPresent: (group: number) => void };
export function MuseumBoard({ code, groupCount, state, updatedAt, error, onClose, onPresent }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeAction = useRef(onClose);
  closeAction.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') closeAction.current(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const groups = Array.from({ length: groupCount }, (_, i) => {
    const group = i + 1;
    const card = state.cards.find(item => item.data.group === group)?.data;
    const check = state.checks.find(item => item.key === `${group}:${group}`)?.data;
    return { group, card, check, ...museumProgress(check) };
  });
  const verifiedCount = groups.filter(group => group.verified >= PRESENTATION_GOAL).length;
  const presentationCount = groups.filter(group => group.card?.artifactId && group.presentable >= PRESENTATION_GOAL).length;
  const time = updatedAt ? new Date(updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  return <section className="museum-board" role="dialog" aria-modal="true" aria-labelledby="museum-title">
    <div className="museum-board__inner">
      <header className="museum-board__header">
        <div><p className="museum-board__eyebrow">JOSEON HISTORY MUSEUM · CLASSROOM</p><h1 id="museum-title">우리 반 역사 박물관</h1><p>유물에 대한 AI 문제를 살펴보고, 자료를 바탕으로 확인합니다.</p></div>
        <div className="museum-board__top-actions"><span>수업코드 <b>{code}</b></span><button ref={closeRef} type="button" onClick={onClose}>칠판 화면 닫기</button></div>
      </header>
      <div className="museum-board__overview">
        <div><span>오늘의 미션</span><strong>모둠마다 2문제 검증하고 발표하기</strong></div>
        <div className="museum-board__summary"><p><b>{updatedAt ? verifiedCount : '–'}</b><span> / {groupCount}모둠<br />2문제 검증 완료</span></p><p><b>{updatedAt ? presentationCount : '–'}</b><span> / {groupCount}모둠<br />발표 준비 완료</span></p></div>
      </div>
      <div className="museum-board__bar"><div><h2>모둠별 검증 현황</h2><p>검증 후 채택하거나 수정한 문제 2개가 있으면 발표할 수 있어요.</p></div><span className={error ? 'museum-board__connection is-error' : 'museum-board__connection'} role="status">{error ? `연결 확인 필요 · ${time ? `마지막 확인 ${time}` : '아직 불러오지 못함'}` : time ? `마지막 확인 ${time} · 6초마다 새로 확인` : '수업 기록을 불러오는 중'}</span></div>
      {!updatedAt ? <p className="museum-board__loading">{error ? '수업 기록을 불러오지 못했습니다. 연결을 확인해 주세요.' : '모둠의 기록을 불러오고 있습니다.'}</p> : <div className="museum-board__groups">{groups.map(({group,card,rows,verified,presentable}) => {
        const ready = !!card?.artifactId && presentable >= PRESENTATION_GOAL;
        const artifact = artifactById(card?.artifactId || 0);
        const photo = joseonModelFor(card?.artifactId || 0)?.photo;
        return <article className={`museum-group${ready ? ' is-ready' : ''}`} key={group}>
          <div className="museum-group__head"><div><span className="museum-group__label">EXHIBIT {String(group).padStart(2, '0')}</span><h3>{group}모둠</h3></div><span className="museum-group__status">{ready ? '발표 준비 완료' : verified >= PRESENTATION_GOAL ? '검증 완료' : verified > 0 || rows.some(row => row.started) ? '검증 중' : '시작 전'}</span></div>
          <div className="museum-group__body">
            <figure className="museum-group__photo">{photo ? <><img src={`${import.meta.env.BASE_URL}${photo.texture || photo.path}`} alt={`${artifact?.name || '유물'} 사진`} loading="lazy"/><figcaption><a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a><span> · 크기 조정</span></figcaption></> : <div className="museum-group__photo-empty">유물 선택 전</div>}</figure>
            <div className="museum-group__details"><p className="museum-group__artifact">{artifact?.name || '유물 선택 전'}</p><div className="museum-group__progress"><span>자료 검증</span><strong>{verified}<small> / 2문제 이상</small></strong></div>
          <div className="museum-group__markers" aria-label={`문제별 상태: ${rows.map(row => `${row.index}번 ${row.complete ? '검증 완료' : row.started ? '확인 중' : '시작 전'}`).join(', ') || '기록 없음'}`}>
            {(rows.length ? rows : [{index:1, complete:false,started:false},{index:2,complete:false,started:false},{index:3,complete:false,started:false}]).map(row => <span className={row.complete ? 'is-complete' : row.started ? 'is-progress' : ''} key={row.index}>{row.index} <i>{row.complete ? '완료' : row.started ? '확인 중' : '대기'}</i></span>)}
          </div>
          </div></div>
          <div className="museum-group__footer"><span>발표 가능 <b>{presentable}</b>문제</span><button type="button" disabled={!ready} onClick={() => onPresent(group)} aria-label={`${group}모둠 발표 화면 열기`}>발표 화면 <span aria-hidden="true">↗</span></button></div>
        </article>;
      })}</div>}
      <footer className="museum-board__foot"><span>검증 완료에는 제외한 문제도 포함됩니다.</span><span>발표 화면은 검증을 마친 문제 중 채택·수정한 앞의 2문제를 보여 줍니다.</span></footer>
    </div>
  </section>;
}
