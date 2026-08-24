import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  clearTeacherAccess,
  grantTeacherAccess,
  isValidTeacherPin,
  readTeacherAccess,
} from "../auth/teacherAccess";
import { Icon } from "./Icon";
import { TeacherShell } from "./TeacherShell";

export function TeacherGate() {
  const [isUnlocked, setIsUnlocked] = useState(() => readTeacherAccess(window.sessionStorage));
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidTeacherPin(pin)) {
      setError("PIN 번호가 맞지 않습니다. 다시 확인해 주세요.");
      setPin("");
      return;
    }

    grantTeacherAccess(window.sessionStorage);
    setError("");
    setIsUnlocked(true);
  }

  function handleLock() {
    clearTeacherAccess(window.sessionStorage);
    setPin("");
    setError("");
    setIsUnlocked(false);
  }

  if (isUnlocked) return <TeacherShell onLock={handleLock} />;

  return (
    <main className="teacher-gate">
      <section aria-labelledby="teacher-gate-title" className="teacher-gate__card">
        <div aria-hidden="true" className="teacher-gate__seal"><Icon name="lock" size={28} /></div>
        <p className="teacher-gate__eyebrow">MOA HISTORY AR · TEACHER ONLY</p>
        <h1 id="teacher-gate-title">교사 설정 잠금</h1>
        <p className="teacher-gate__description">지도안·학생활동지·활동카드·답안은 PIN 확인 후에만 열립니다.</p>
        <form className="teacher-gate__form" onSubmit={handleSubmit}>
          <label htmlFor="teacher-pin">교사용 PIN</label>
          <input
            aria-describedby={error ? "teacher-pin-error teacher-pin-help" : "teacher-pin-help"}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            autoFocus
            id="teacher-pin"
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              if (error) setError("");
            }}
            pattern="[0-9]{4}"
            placeholder="PIN 4자리"
            type="password"
            value={pin}
          />
          {error ? <p className="teacher-gate__error" id="teacher-pin-error" role="alert">{error}</p> : null}
          <button className="button button--primary button--full" type="submit">
            설정 열기 <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="teacher-gate__help" id="teacher-pin-help">현재 브라우저 탭을 닫으면 교사 화면이 자동으로 잠깁니다.</p>
        <Link className="teacher-gate__back" to="/">← 학생 화면으로 돌아가기</Link>
      </section>
    </main>
  );
}
