import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { heritageImageUrl } from '../../content/heritageCatalog';
import { downloadProjectFile } from '../../content/three-kingdoms/project';
import NarrationEditor from '../../components/NarrationEditor';
import { ExhibitionSound } from '../../lib/ar/sound';
import { SampleSpeech } from '../../lib/ar/sampleSpeech';
import { newSampleProject } from './sample';
import { studioPath } from './curriculum';
import './studio.css';

const Viewer = lazy(() => import('../../components/ArExhibitViewer'));

export default function SampleExhibition() {
  const { search } = useLocation();
  const [project, setProject] = useState(newSampleProject);
  const [step, setStep] = useState('view');
  const [recording, setRecording] = useState(false);
  const [recordPoint, setRecordPoint] = useState(project.ar.points[0].id);
  const [message, setMessage] = useState('');
  const [music, setMusic] = useState(false);
  const [effects, setEffects] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [sound] = useState(() => new ExhibitionSound());
  const [speech] = useState(() => new SampleSpeech(active => sound.narration(active), setMessage));
  const point = project.ar.points.find(item => item.id === recordPoint)!;
  useEffect(() => () => { speech.stop(); sound.dispose(); }, [speech, sound]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { speech.stop(); void sound.enable(false); setMusic(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [sound, speech]);
  function changeStep(value: string) { if (recording) return; speech.stop(); setMessage(''); setStep(value); }
  const backQuery = new URLSearchParams(search); backQuery.delete('step'); backQuery.delete('lesson'); backQuery.delete('view');

  return <main className="studio-page studio-sample page-width">
    <header className="studio-header"><Link onClick={event => { if (recording) event.preventDefault(); }} to={`/three-kingdoms${backQuery.size ? `?${backQuery}` : ''}`}>← 삼국시대 수업</Link><span>첨성대 · AR 예제 체험</span></header>
    <header className="studio-sample-intro"><p className="eyebrow">준비된 예제로 바로 시작</p><h1>표·그래프 없이 AR부터 체험해요</h1><p>첨성대 모형·해설 3개·문제 2개를 준비했어요. 수업코드나 작품 제출 없이 열어 볼 수 있어요.</p><p>국립중앙과학관의 공식 3D 원본과 표면 질감을 그대로 사용해요. 화면 보기와 카메라 AR 모두 같은 모형이 나옵니다. 처음에는 약 36MB를 내려받으니 잠시 기다려 주세요.</p></header>
    <nav className="studio-steps" aria-label="예제 체험 순서">{[['view', '모형·카메라 AR'], ['record', '내 목소리 녹음'], ['quiz', '예제 퀴즈']].map(([key, title], index) => <button key={key} disabled={recording} aria-current={step === key ? 'step' : undefined} onClick={() => changeStep(key)}><span>{index + 1}</span>{title}</button>)}</nav>
    <div className="studio-actions studio-sample-sound"><button disabled={recording} aria-pressed={music} onClick={() => { const value = !music; void sound.enable(value).then(() => setMusic(value)).catch(error => setMessage(error.message)); }}>{music ? '배경음 끄기' : '배경음 켜기'}</button><label><input type="checkbox" disabled={recording} checked={effects} onChange={event => { const value = event.target.checked; void sound.setEffects(value).then(() => setEffects(value)).catch(error => setMessage(error.message)); }} />짧은 효과음</label><button disabled={recording} onClick={() => speech.stop()}>예제 글 읽기 멈추기</button></div>
    {message && <p className="studio-notice" role="status">{message}</p>}
    {step === 'view' && <><p>먼저 화면에서 모형을 돌리고 번호를 눌러 보세요. 카메라 AR은 아래 첨성대 카드를 출력해 비추면 됩니다.</p><Suspense fallback={<p role="status">첨성대 예제 모형을 준비해요…</p>}><Viewer value={project.ar} heritage="첨성대" heritageId={3} image={heritageImageUrl('three-kingdoms', 3)} example showQuiz={false} onNarrationActivity={active => sound.narration(active)} onCardFound={() => sound.effect('found')} onReadExample={value => { setMessage(''); speech.speak(value.text); }} onStopNarration={() => speech.stop()} /></Suspense><button className="studio-primary" onClick={() => changeStep('record')}>내 목소리로도 녹음해 보기 →</button></>}
    {step === 'record' && <section className="studio-sample-record"><h2>해설을 직접 녹음해 보세요</h2><label>녹음할 해설<select value={recordPoint} disabled={recording} onChange={event => { speech.stop(); setRecordPoint(event.target.value); }}>{project.ar.points.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title}</option>)}</select></label><h3>{point.title}</h3><p>{point.text}</p><NarrationEditor key={point.id} value={point.narration} onChange={value => setProject(previous => ({ ...previous, ar: { ...previous.ar, points: previous.ar.points.map(item => item.id === recordPoint ? { ...item, narration: value } : item) } }))} onBusy={value => { speech.stop(); sound.recordingActive(value); setRecording(value); }} onPlayback={active => sound.narration(active)} /><p>녹음 후 ‘모형·카메라 AR’에서 같은 번호를 누르면 내 목소리가 나와요. 녹음 중에는 배경음·효과음이 멈춥니다.</p><button className="studio-primary" disabled={recording} onClick={() => changeStep('view')}>AR에서 내 녹음 확인하기</button></section>}
    {step === 'quiz' && <section><h2>예제 문제 2개를 풀어 보세요</h2>{project.questions.map((question, index) => <fieldset key={question.id} className="studio-question-editor"><legend>{index + 1}. {question.prompt}</legend><div className="studio-quiz-options">{question.options.map((option, choice) => <button key={choice} aria-pressed={answers[question.id] === choice} onClick={() => { setChecked(false); setAnswers(previous => ({ ...previous, [question.id]: choice })); }}>{option}</button>)}</div>{checked && <p>{answers[question.id] === question.answer ? '맞았어요.' : `다시 확인해요. 정답은 ‘${question.options[question.answer]}’입니다.`} {project.ar.points.find(item => item.id === question.pointId)?.text}</p>}</fieldset>)}<button className="studio-primary" disabled={project.questions.some(question => !Number.isInteger(answers[question.id]))} onClick={() => { setChecked(true); if (project.questions.every(question => answers[question.id] === question.answer)) sound.effect('correct'); }}>예제 정답 확인</button><p>이 문제는 연습용이며 학생 점수로 제출되지 않아요.</p></section>}
    <footer className="studio-sample-footer"><p>연습 내용은 이 화면에서만 사용합니다. 녹음을 보관하려면 작업 파일을 받아 주세요.</p><div className="studio-actions"><button disabled={recording} onClick={() => downloadProjectFile(JSON.stringify(project), '첨성대_AR_연습.json', 'application/json')}>예제 작업 파일 받기</button><Link onClick={event => { if (recording) event.preventDefault(); }} to={studioPath(search, 'model', false, 4)}>우리 모둠 작품 만들기 →</Link></div><p>이미 만든 표는 그대로 두고, 조사한 문장 3~4개를 ‘설명·녹음’에 옮겨 쓰면 됩니다. 그래프는 전시에 첨부할 때만 필요해요.</p></footer>
  </main>;
}
