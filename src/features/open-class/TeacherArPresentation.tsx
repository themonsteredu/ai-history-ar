import { useEffect, useRef, useState } from 'react';
import type { GroupCard } from './model';
import { artifactById } from './artifacts';
import { goryeoArtifact, goryeoPhoto } from '../goryeo/readyCards';
import { joseonModelFor } from '../../lib/ar/joseon/catalog';
import { MuseumCardStage } from './MuseumCardStage';
import { usePresentationDialog } from './usePresentationDialog';
import './teacher-ar-presentation.css';

type Props = {
  era: 'goryeo' | 'joseon'; code: string; groupCount: number; cards: GroupCard[];
  updatedAt?: number; error: string; initialGroup?: number; onClose: () => void;
};

const artifactFor = (era: Props['era'], id: number) => era === 'goryeo' ? goryeoArtifact(id) : artifactById(id);

/** This presentation only receives cards, so quiz answers cannot appear on the projector. */
export function TeacherArPresentation(props: Props) {
  const [group, setGroup] = useState(props.initialGroup);
  const opener = useRef(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => () => { if (opener.current?.isConnected) opener.current.focus(); }, []);
  const available = props.cards.filter(card => card.group >= 1 && card.group <= props.groupCount && artifactFor(props.era, card.artifactId))
    .sort((a, b) => a.group - b.group);
  const card = available.find(item => item.group === group);
  if (!card) return <ArGroupPicker {...props} onSelect={setGroup} />;
  const index = available.findIndex(item => item.group === group);
  const groups = Array.from({ length: props.groupCount }, (_, i) => i + 1);
  return <MuseumCardStage key={`${card.group}:${card.artifactId}`} card={card} era={props.era} onClose={props.onClose}
    closeLabel="← 이전 화면" onBack={() => setGroup(undefined)}
    navigation={<div className="teacher-ar-navigation">
      <nav className="teacher-ar-navigation__groups" aria-label="AR 발표 모둠 선택">
        {groups.map(value => <button type="button" key={value} aria-pressed={value === group}
          disabled={!available.some(item => item.group === value)} onClick={() => setGroup(value)}>{value}모둠</button>)}
      </nav>
      <div className="teacher-ar-navigation__steps">
        <button type="button" disabled={index <= 0} onClick={() => setGroup(available[index - 1]?.group)}>이전 모둠</button>
        <button type="button" disabled={index >= available.length - 1} onClick={() => setGroup(available[index + 1]?.group)}>다음 모둠 →</button>
      </div>
      {props.error && <p className="teacher-ar-navigation__error" role="status">새 기록을 불러오지 못했어요. 마지막으로 불러온 카드입니다.</p>}
    </div>} />;
}

function ArGroupPicker({ era, code, groupCount, cards, updatedAt, error, onClose, onSelect }: Props & { onSelect: (group: number) => void }) {
  const root = usePresentationDialog(onClose);
  return <section ref={root} className="teacher-ar-picker" role="dialog" aria-modal="true" aria-labelledby="teacher-ar-title">
    <header className="teacher-ar-picker__header">
      <div><p>{era === 'goryeo' ? '고려' : '조선'} 유물 전시실 · 수업코드 {code}</p><h1 id="teacher-ar-title">AR 카드 발표</h1></div>
      <button type="button" data-autofocus onClick={onClose}>← 이전 화면</button>
    </header>
    <div className="teacher-ar-picker__body">
      <h2>발표할 모둠을 선택하세요</h2>
      {error && <p className="teacher-ar-picker__notice" role="status">{updatedAt ? '새 기록을 불러오지 못했어요. 마지막으로 불러온 카드를 보여줍니다.' : '수업 기록을 불러오지 못했어요. 연결을 확인해 주세요.'}</p>}
      {!updatedAt && !error && <p role="status">모둠의 AR 카드를 불러오는 중…</p>}
      <div className="teacher-ar-picker__grid">
        {Array.from({ length: groupCount }, (_, index) => index + 1).map(group => {
          const card = cards.find(item => item.group === group);
          const artifact = artifactFor(era, card?.artifactId || 0);
          const photo = card && (era === 'goryeo' ? goryeoPhoto(card.artifactId) : joseonModelFor(card.artifactId)?.photo);
          const path = photo ? ('texture' in photo ? photo.texture || photo.path : photo.path) : '';
          return <button type="button" className="teacher-ar-picker__group" key={group} disabled={!card || !artifact}
            onClick={() => onSelect(group)} aria-label={`${group}모둠 ${artifact?.name || '카드 저장 전'} AR 카드 발표`}>
            <span className="teacher-ar-picker__photo">{path ? <img src={`${import.meta.env.BASE_URL}${path}`} alt="" /> : <span>{String(group).padStart(2, '0')}</span>}</span>
            <span className="teacher-ar-picker__group-info"><span>{group}모둠</span><strong>{artifact?.name || '카드 저장 전'}</strong>
              <small>{card && artifact ? `설명 ${card.points.length}개 · 발표 열기 →` : updatedAt ? '학생들이 카드를 저장하면 열 수 있어요' : '불러오는 중'}</small></span>
          </button>;
        })}
      </div>
    </div>
  </section>;
}
