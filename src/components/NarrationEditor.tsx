import { useEffect, useRef, useState } from 'react';
import { NarrationRecorder } from '../lib/ar/recorder';
import type { Narration } from '../lib/ar/exhibit';

export default function NarrationEditor({ value, onChange, onBusy, disabled = false }: { value?: Narration; onChange: (value?: Narration) => void; onBusy: (busy: boolean) => void; disabled?: boolean }) {
  const [state, setState] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const recorder = useRef<NarrationRecorder | null>(null);
  const player = useRef<HTMLAudioElement>(null);
  const callbacks = useRef({ onChange, onBusy });
  callbacks.current = { onChange, onBusy };
  useEffect(() => () => { recorder.current?.dispose(); callbacks.current.onBusy(false); }, []);
  function start() {
    recorder.current?.dispose(); player.current?.pause(); setError('');
    callbacks.current.onBusy(true);
    recorder.current = new NarrationRecorder({
      onState: (next, elapsed) => { setState(next); setSeconds(elapsed); callbacks.current.onBusy(next !== 'idle'); },
      onSave: audio => callbacks.current.onChange(audio), onError: setError,
    });
    void recorder.current.start();
  }
  return <div className="narration-editor">
    <strong>내 목소리로 설명하기</strong>
    <div className="ar-maker-actions">
      {state === 'recording' ? <button type="button" onClick={() => recorder.current?.stop()}>녹음 끝내기 · {seconds}초</button> : <button type="button" disabled={disabled || state !== 'idle'} onClick={start}>{state === 'requesting' ? '마이크 허용을 기다려요…' : state === 'saving' ? '녹음을 저장해요…' : value ? '다시 녹음하기' : '녹음 시작'}</button>}
      {state === 'requesting' && <button type="button" onClick={() => { recorder.current?.dispose(); setState('idle'); callbacks.current.onBusy(false); }}>취소</button>}
      {value && <button type="button" disabled={disabled || state !== 'idle'} onClick={() => { player.current?.pause(); onChange(undefined); }}>녹음 지우기</button>}
    </div>
    <p className="ar-help">설명을 읽으며 30초 안으로 녹음해요. 새 녹음이 끝나면 이전 녹음을 바꿔요.</p>
    {value && <audio ref={player} src={value.data} controls preload="metadata" aria-label="내 녹음 들어보기" onError={() => setError('이 기기에서 녹음을 재생하지 못했어요. 다른 브라우저에서 열거나 다시 녹음해 주세요.')} />}
    {error && <p role="alert" className="ar-error">{error}</p>}
  </div>;
}
