import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Artifact, Question } from './data';
import { answerGoryeoChat } from './chatResponses';
import './goryeo-chat.css';

type Message = { id: number; role: 'student' | 'robot'; text: string };
type PendingReply = { id: number; text: string; isFirst: boolean };

const sourceLinks = /(https:\/\/[^\s]+)/g;
const displayReply = (text: string) => text.replace(sourceLinks, '공식 자료 보기 ↗');
function renderReply(text: string) {
  return text.split(sourceLinks).map((part, index) => part.startsWith('https://')
    ? <a key={index} href={part} target="_blank" rel="noreferrer">공식 자료 보기 ↗</a>
    : part);
}

function isAnswerCheck(message: string) {
  const compact = message.replace(/\s+/g, '');
  return /(?:내답|제답|이답|답이|내선택|내가|제가).{0,40}(?:맞|틀|정답|옳)/.test(compact)
    || /^(?:맞니|맞아|맞나요|틀렸어|정답이야)[?.!]*$/.test(compact);
}

interface Props {
  artifact: Artifact;
  question: Question;
  questionIndex: number;
  choice: string;
  onVerified: () => void;
}

/** 미리 준비한 답을 들려주는 수업용 대화 화면입니다. */
export default function GoryeoRobotChat({ artifact, question, questionIndex, choice, onVerified }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingReply | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [draft, setDraft] = useState('');
  const [started, setStarted] = useState(false);
  const nextId = useRef(0);
  const verifiedRef = useRef(onVerified);
  const logRef = useRef<HTMLDivElement>(null);
  verifiedRef.current = onVerified;
  const enabled = choice === 'O' || choice === 'X';

  useEffect(() => {
    if (!pending) return;
    const chars = Array.from(displayReply(pending.text));
    let count = 0;
    setVisibleCount(0);
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count >= chars.length) {
        window.clearInterval(timer);
        setMessages(current => [...current, { id: pending.id, role: 'robot', text: pending.text }]);
        setPending(null);
        if (pending.isFirst) verifiedRef.current();
      }
    }, 22);
    return () => window.clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, visibleCount]);

  const queue = (studentText: string, robotText: string, isFirst = false) => {
    if (pending) return;
    setVisibleCount(0);
    const studentId = ++nextId.current;
    const robotId = ++nextId.current;
    setMessages(current => [...current, { id: studentId, role: 'student', text: studentText }]);
    setPending({ id: robotId, text: robotText, isFirst });
  };
  const answerCheckReply = () => {
    const robotAnswer = question.deliberatelyWrong ? (question.answer === 'O' ? 'X' : 'O') : question.answer;
    return `너는 ${choice}라고 골랐구나. 내 생각에는 네 답이 ${choice === robotAnswer ? '맞아' : '틀렸어'}. ${question.robot}`;
  };
  const start = () => {
    if (!enabled || started || pending) return;
    setStarted(true);
    queue(`나는 ${choice}라고 생각해. 내 답이 맞니?`, answerCheckReply(), true);
  };
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draft.trim();
    if (pending || !message) return;
    if (isAnswerCheck(message)) {
      setDraft('');
      if (!enabled) {
        queue(message, '아직 네 답을 모르겠어. 먼저 OX 문제에서 O 또는 X를 골라 줘!');
      } else {
        setStarted(true);
        queue(message, answerCheckReply(), true);
      }
      return;
    }
    const lastRobotMessage = [...messages].reverse().find(item => item.role === 'robot')?.text;
    const response = answerGoryeoChat({ artifact, question, questionIndex, choice, message, lastRobotMessage });
    setDraft('');
    queue(message, response);
  };

  return <div className="goryeo-chat">
    <div className="goryeo-chat-robot">
      <img src={`${import.meta.env.BASE_URL}images/goryeo-cards/evidence-robot.png`} alt="탐구 로봇" />
      <strong>탐구 로봇</strong>
    </div>
    <div ref={logRef} className="goryeo-chat-window" role="log" aria-label="탐구 로봇과의 대화" aria-live="polite" aria-relevant="additions">
      {messages.map(message => <div key={message.id} className={`goryeo-chat-line goryeo-chat-line--${message.role}`}><span className="goryeo-chat-speaker">{message.role === 'robot' ? '탐구 로봇' : '나'}</span><p>{message.role === 'robot' ? renderReply(message.text) : message.text}</p></div>)}
      {pending && <div className="goryeo-chat-line goryeo-chat-line--robot"><span className="goryeo-chat-speaker">탐구 로봇</span><p aria-hidden="true">{Array.from(displayReply(pending.text)).slice(0, visibleCount).join('')}<span className="goryeo-chat-cursor">▍</span></p><span className="goryeo-chat-sr">로봇이 답변을 쓰고 있어요.</span></div>}
    </div>
    {!started && <button type="button" className="oc-primary goryeo-chat-start" disabled={!enabled || !!pending} onClick={start}>내 답이 맞니?</button>}
    <form className="goryeo-chat-compose" onSubmit={send}>
      <label className="goryeo-chat-sr" htmlFor="goryeo-chat-input">로봇에게 질문하기</label>
      <input id="goryeo-chat-input" type="text" maxLength={500} value={draft} disabled={!!pending} onChange={event => setDraft(event.target.value)} placeholder={pending ? '로봇이 답변을 쓰고 있어요…' : '궁금한 점을 입력해요'} />
      <button className="oc-primary" type="submit" disabled={!!pending || !draft.trim()}>전송</button>
    </form>
  </div>;
}
