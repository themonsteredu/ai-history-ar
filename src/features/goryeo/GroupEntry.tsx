import { useState } from 'react';
import './group-entry.css';

type Props = { busy: boolean; error: string; onJoin: (code: string, group: number) => void };
export default function GroupEntry({ busy, error, onJoin }: Props) {
  const [code, setCode] = useState('');
  const [group, setGroup] = useState<number | null>(null);
  return <main className="oc-page page-width goryeo-entry">
    <section className="goryeo-entry-card">
      <p className="oc-eyebrow">5학년 사회 × AI 검증 · 수업 샘플</p>
      <h1>고려 유물 탐구실</h1>
      <p>수업 코드와 우리 모둠을 선택하고 들어와요. 탐구한 내용을 제출하면 친구들의 의견도 함께 볼 수 있어요.</p>
      <form onSubmit={event => { event.preventDefault(); if (group !== null && code === '12345' && !busy) onJoin(code, group); }}>
        <label className="oc-field">수업 입장 코드
          <input type="text" inputMode="numeric" autoComplete="off" maxLength={5} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="숫자 5자리" aria-describedby="entry-code-help" />
        </label>
        <p id="entry-code-help" className="goryeo-entry-help">샘플 입장 코드: <strong>12345</strong></p>
        <fieldset><legend>우리 모둠 선택</legend><div className="goryeo-entry-groups">{[1,2,3,4,5,6].map(value => <button type="button" key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{value}모둠</button>)}</div></fieldset>
        {error && <p className="goryeo-entry-error" role="alert">{error}</p>}
        <button className="oc-primary goryeo-entry-submit" type="submit" disabled={busy || code !== '12345' || group === null}>{busy ? '수업에 들어가는 중…' : '탐구실 입장하기 →'}</button>
      </form>
      <p className="goryeo-entry-help">같은 코드로 입장한 친구들과 제출한 내용을 함께 봅니다. 이름 등 개인정보는 적지 않아도 돼요.</p>
    </section>
  </main>;
}
