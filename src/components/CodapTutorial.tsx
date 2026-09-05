import { useState } from 'react';
import { codapTutorial, type CodapTutorialStep } from '../content/three-kingdoms/codapTutorial';
import '../styles/codap-tutorial.css';

export function CodapStep({ step, index, showCheck = true }: { step: CodapTutorialStep; index: number; showCheck?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className="codap-step">
    <header><p>CODAP 따라하기 · {index + 1} / {codapTutorial.length}</p><h3>{step.title}</h3></header>
    <div className="codap-step__body">
      <figure>
        {imageFailed
          ? <div className="codap-step__image-error"><p>화면 그림을 불러오지 못했어요.</p><a href={step.source.href} target="_blank" rel="noreferrer">공식 도움말에서 같은 화면 보기 ↗</a></div>
          : <a className="codap-step__image" href={step.screenshot} target="_blank" rel="noreferrer" aria-label="CODAP 예시 화면 크게 보기"><img src={step.screenshot} alt={`${step.title}: ${step.screenLabel} 위치를 보여 주는 CODAP 공식 도움말 예시 화면`} onError={() => setImageFailed(true)} referrerPolicy="no-referrer" /></a>}
        <figcaption><a href={step.source.href} target="_blank" rel="noreferrer">{step.source.label} ↗</a><span>화면 속 자료는 조작 예시예요. 우리 CSV로 따라 해요.</span></figcaption>
      </figure>
      <div className="codap-step__instructions">
        <p className="codap-step__action">{step.action}</p>
        <strong className="codap-step__target">{step.screenLabel}</strong>
        <p>{step.classroomLabel}</p>
        <div className={`codap-step__check${showCheck ? ' is-visible' : ''}`} aria-hidden={!showCheck}><strong>여기까지 했나요?</strong><p>{step.check}</p></div>
      </div>
    </div>
    <p className="codap-step__help"><strong>막히면 이렇게 해요</strong> {step.help}</p>
  </div>;
}

export function CodapTutorial() {
  const [current, setCurrent] = useState(0);
  return <section className="codap-tutorial" aria-label="CODAP 화면 보며 따라하기">
    <CodapStep key={current} step={codapTutorial[current]} index={current} />
    <nav aria-label="CODAP 따라하기 단계">
      <button type="button" disabled={current === 0} onClick={() => setCurrent(current - 1)}>← 이전 화면</button>
      <label>단계 선택<select value={current} onChange={event => setCurrent(Number(event.target.value))}>{codapTutorial.map((step, index) => <option key={step.id} value={index}>{index + 1}. {step.title}</option>)}</select></label>
      <button type="button" disabled={current === codapTutorial.length - 1} onClick={() => setCurrent(current + 1)}>다음 화면 →</button>
    </nav>
  </section>;
}
