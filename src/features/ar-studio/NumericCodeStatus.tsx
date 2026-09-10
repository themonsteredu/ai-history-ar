import { useEffect, useState } from 'react';
import { studioApi } from './api';

interface SavedCode { code: string; saved: boolean; created: boolean; mode: 'hub' | 'numeric' }
const requests = new Map<string, Promise<SavedCode>>();
function saveNumber(code: string) {
  const previous = requests.get(code); if (previous) return previous;
  if (requests.size > 30) requests.clear();
  const next = studioApi<SavedCode>('/classrooms', undefined, { code }).catch(error => { requests.delete(code); throw error; });
  requests.set(code, next); return next;
}
export function NumericCodeStatus({ code }: { code: string }) {
  const normalized = code.trim();
  const [result, setResult] = useState<{ code: string; message: string }>({ code: '', message: '' });
  useEffect(() => {
    if (!/^[0-9]{4,12}$/.test(normalized)) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setResult({ code: normalized, message: '숫자 수업코드를 저장하고 있어요…' });
      void saveNumber(normalized).then(value => {
        if (!cancelled) setResult({ code: normalized, message: value.saved ? `${normalized} · ${value.created ? '수업코드 저장 완료' : '이미 저장된 수업코드에 연결됨'}. 학생들도 이 번호로 입장하세요.` : '저장을 확인하지 못했어요. 다시 입력해 주세요.' });
      }).catch(error => { if (!cancelled) setResult({ code: normalized, message: error instanceof Error ? error.message : '저장하지 못했어요. 다시 입력해 주세요.' }); });
    }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [normalized]);
  if (!/^[0-9]{4,12}$/.test(normalized)) return null;
  return <p className="maker-entry-help" role="status">{result.code === normalized ? result.message : '입력을 마치면 이 숫자로 자동 저장됩니다.'}</p>;
}
