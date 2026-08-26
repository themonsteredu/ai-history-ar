import { useEffect, useState } from "react";

const LESSON_FIVE_CLEANING_KEY = "ai-history:three-kingdoms:lesson-5-cleaning:v1";

export interface CleaningPracticeRow {
  id: number;
  heritage: string;
  kingdom: string;
  era: string;
  exactYear: string;
  region: string;
  fact: string;
  source: string;
}

export const cleaningPracticeRows: readonly CleaningPracticeRow[] = [
  { id: 1, heritage: "무령왕릉", kingdom: "백제", era: "6세기", exactYear: "1971", region: "충청남도 공주", fact: "배수로 공사 중 발견되었다", source: "국가유산청" },
  { id: 2, heritage: "무령왕릉", kingdom: "백제", era: "6세기", exactYear: "1971", region: "충청남도 공주", fact: "배수로 공사 중 발견되었다", source: "국가유산청" },
  { id: 3, heritage: "백제 금동대향로", kingdom: "백제", era: "서기 500년대", exactYear: "1993", region: "충청남도 부여", fact: "능산리 절터에서 출토되었다", source: "국립부여박물관" },
  { id: 4, heritage: "첨성대", kingdom: "신라국", era: "7세기", exactYear: "", region: "경상북도 경주", fact: "선덕여왕 때 세운 것으로 전해진다", source: "국가유산청" },
  { id: 5, heritage: "신라 금관", kingdom: "신라", era: "5~6세기", exactYear: "1921년", region: "경상북도 경주", fact: "금관총에서 처음으로 발견되었다", source: "국립경주박물관" },
  { id: 6, heritage: "신라 금관", kingdom: "신라", era: "5~6세기", exactYear: "1973", region: "경주시", fact: "천마총 발굴에서 출토되었다", source: "국립경주박물관" },
  { id: 7, heritage: "고구려 고분벽화", kingdom: "고구려", era: "4~7세기", exactYear: "357", region: "북한 황해남도 안악", fact: "안악 3호분에는 357년에 쓴 글이 남아 있다", source: "" },
  { id: 8, heritage: "가야 고분군", kingdom: "가야", era: "1~6세기", exactYear: "2023", region: "영남과 호남 동부", fact: "일곱 고분군이 세계유산에 등재되었다", source: "유네스코" },
  { id: 9, heritage: "백제 금동대향로", kingdom: "백제", era: "6세기", exactYear: "", region: "충청남도 부여", fact: "꼭대기에 봉황이 있고 받침은 용 모양이다", source: "국립부여박물관" },
] as const;

export type CleaningColumn = "row" | "era" | "kingdom" | "exactYear" | "region" | "source";

export interface CleaningIssue {
  id: string;
  rowIds: readonly number[];
  column: CleaningColumn;
  title: string;
  hint: string;
  options: readonly string[];
  answer: string;
  explanation: string;
  resultLabel: string;
}

export const cleaningIssues: readonly CleaningIssue[] = [
  {
    id: "duplicate",
    rowIds: [1, 2],
    column: "row",
    title: "1·2행이 완전히 똑같습니다",
    hint: "같은 자료가 두 번 들어가면 개수를 셀 때 두 배로 계산됩니다.",
    options: ["한 행만 남기고 지운다", "두 행 모두 남긴다", "두 행 모두 지운다"],
    answer: "한 행만 남기고 지운다",
    explanation: "완전히 같은 행은 하나만 남깁니다. 둘 다 지우면 진짜 자료까지 사라집니다.",
    resultLabel: "중복 행 1건 정리",
  },
  {
    id: "era",
    rowIds: [3],
    column: "era",
    title: "시기 표기가 다른 모둠과 다릅니다",
    hint: "2차시 학급 약속에서 시대 범위의 표준 표기를 정했습니다.",
    options: ["서기 500년대", "6세기", "500s"],
    answer: "6세기",
    explanation: "같은 뜻이라도 표기가 다르면 컴퓨터는 다른 값으로 읽습니다. 학급 약속은 ‘6세기’입니다.",
    resultLabel: "시기 표기 통일",
  },
  {
    id: "kingdom",
    rowIds: [4],
    column: "kingdom",
    title: "나라 이름 표기가 다릅니다",
    hint: "그래프에서 나라별로 묶으려면 모든 행이 같은 이름을 써야 합니다.",
    options: ["신라국", "신라", "Silla"],
    answer: "신라",
    explanation: "‘신라국’과 ‘Silla’는 그래프에서 신라와 다른 막대로 나뉩니다. 학급 약속은 ‘신라’입니다.",
    resultLabel: "나라 표기 통일",
  },
  {
    id: "year",
    rowIds: [5],
    column: "exactYear",
    title: "연도에 글자가 섞여 있습니다",
    hint: "숫자 칸에 글자가 섞이면 순서대로 정렬하거나 계산할 수 없습니다.",
    options: ["1921년", "1921", "약 1900년대"],
    answer: "1921",
    explanation: "연도 칸에는 숫자만 넣어야 그래프의 가로축으로 쓸 수 있습니다.",
    resultLabel: "연도 표기 정리",
  },
  {
    id: "region",
    rowIds: [6],
    column: "region",
    title: "지역 표기가 다른 행과 다릅니다",
    hint: "같은 경주라도 표기가 다르면 지역별 개수가 나뉘어 세어집니다.",
    options: ["경주시", "경주", "경상북도 경주"],
    answer: "경상북도 경주",
    explanation: "학급 약속은 도 이름까지 쓴 ‘경상북도 경주’입니다. 다른 행과 같은 표기로 맞춥니다.",
    resultLabel: "지역 표기 통일",
  },
  {
    id: "missing",
    rowIds: [7],
    column: "source",
    title: "출처 칸이 비어 있습니다",
    hint: "3차시 검증 5단계를 떠올려 보세요. 모르는 값은 어떻게 할까요?",
    options: ["빈칸에 ‘확인 필요’라고 표시한다", "그럴듯한 기관 이름을 추측해 채운다", "행 전체를 지운다"],
    answer: "빈칸에 ‘확인 필요’라고 표시한다",
    explanation: "빈칸은 추측으로 채우지 않습니다. ‘확인 필요’로 남겨 두면 나중에 출처를 찾아 채울 수 있습니다.",
    resultLabel: "빈칸 1건 확인 필요 표시",
  },
] as const;

export function countCorrectCleaningDecisions(decisions: Record<string, string>) {
  return cleaningIssues.filter((issue) => decisions[issue.id] === issue.answer).length;
}

export function isCleaningComplete(decisions: Record<string, string>) {
  return countCorrectCleaningDecisions(decisions) === cleaningIssues.length;
}

function issueForCell(rowId: number, column: CleaningColumn) {
  return cleaningIssues.find((issue) => issue.rowIds.includes(rowId) && issue.column === column);
}

function readCleaningDecisions(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LESSON_FIVE_CLEANING_KEY) ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        cleaningIssues.some((issue) => issue.id === key && typeof value === "string" && issue.options.includes(value)),
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

const tableColumns: ReadonlyArray<{ column: Exclude<CleaningColumn, "row">; label: string; value: (row: CleaningPracticeRow) => string }> = [
  { column: "kingdom", label: "나라", value: (row) => row.kingdom },
  { column: "era", label: "시기", value: (row) => row.era },
  { column: "exactYear", label: "정확한 연도", value: (row) => row.exactYear },
  { column: "region", label: "발견·출토 지역", value: (row) => row.region },
  { column: "source", label: "출처 기관", value: (row) => row.source },
];

export function LessonFiveCleaningLab({ onSaved }: { onSaved: () => void }) {
  const [decisions, setDecisions] = useState<Record<string, string>>(readCleaningDecisions);
  const [saved, setSaved] = useState(() => isCleaningComplete(readCleaningDecisions()));
  const solvedCount = countCorrectCleaningDecisions(decisions);
  const complete = isCleaningComplete(decisions);

  useEffect(() => {
    window.localStorage.setItem(LESSON_FIVE_CLEANING_KEY, JSON.stringify(decisions));
  }, [decisions]);

  function decide(issueId: string, option: string) {
    setDecisions((current) => ({ ...current, [issueId]: option }));
  }

  function resetLab() {
    setDecisions({});
    setSaved(false);
  }

  function saveResult() {
    if (!complete) return;
    setSaved(true);
    onSaved();
  }

  function cellState(rowId: number, column: CleaningColumn) {
    const issue = issueForCell(rowId, column) ?? issueForCell(rowId, "row");
    if (!issue) return "clean";
    return decisions[issue.id] === issue.answer ? "fixed" : "issue";
  }

  function cellText(row: CleaningPracticeRow, column: Exclude<CleaningColumn, "row">, rawValue: string) {
    const issue = issueForCell(row.id, column);
    if (!issue || decisions[issue.id] !== issue.answer) return rawValue === "" ? "(빈칸)" : rawValue;
    if (issue.id === "missing") return "확인 필요";
    return issue.answer;
  }

  const duplicateIssue = cleaningIssues.find((issue) => issue.id === "duplicate");
  const duplicateFixed = Boolean(duplicateIssue) && decisions["duplicate"] === duplicateIssue?.answer;
  const visibleRows = duplicateFixed ? cleaningPracticeRows.filter((row) => row.id !== 2) : cleaningPracticeRows;

  return (
    <div className="cleaning-lab" data-testid="lesson-5-cleaning">
      <section className="core-mission" aria-label="활동 방법">
        <span>웹앱이 하는 일</span>
        <strong>문제가 숨어 있는 표를 직접 정제하며 학급 정제 규칙을 연습합니다.</strong>
        <p>연습을 마친 뒤, 같은 규칙으로 우리 모둠 시트의 실제 데이터를 정리합니다.</p>
      </section>

      <header className="cleaning-lab__progress" aria-live="polite">
        <div><span>정제 연습 진행</span><strong>문제 {cleaningIssues.length}개 중 {solvedCount}개 해결</strong></div>
        <div aria-hidden="true" className="cleaning-lab__progress-track">
          {cleaningIssues.map((issue) => <i className={decisions[issue.id] === issue.answer ? "is-done" : ""} key={issue.id} />)}
        </div>
      </header>

      <section className="cleaning-lab__table-wrap" aria-label="정제할 학급 데이터 표">
        <span>학급 데이터 표 · 색이 칠해진 칸에 문제가 숨어 있습니다</span>
        <div>
          <table>
            <thead>
              <tr><th>행</th><th>유산 이름</th>{tableColumns.map((item) => <th key={item.column}>{item.label}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr data-state={cellState(row.id, "row")} key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.heritage}</td>
                  {tableColumns.map((item) => (
                    <td data-state={cellState(row.id, item.column)} key={item.column}>{cellText(row, item.column, item.value(row))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {duplicateFixed ? <p className="cleaning-lab__table-note" role="status">중복이던 2행을 지워 표가 9행에서 8행이 되었습니다.</p> : null}
      </section>

      <div className="cleaning-lab__issues">
        {cleaningIssues.map((issue, index) => {
          const selected = decisions[issue.id];
          const state = selected ? (selected === issue.answer ? "correct" : "wrong") : "idle";
          return (
            <article data-state={state} data-testid={`cleaning-issue-${issue.id}`} key={issue.id}>
              <div>
                <span>문제 {index + 1} · {issue.rowIds.length > 1 ? `${issue.rowIds.join("·")}행` : `${issue.rowIds[0]}행`}</span>
                <strong>{issue.title}</strong>
                <small>{state === "correct" ? issue.explanation : state === "wrong" ? "다시 생각해 보세요. " + issue.hint : issue.hint}</small>
              </div>
              <div aria-label={`${issue.title} 해결 방법 선택`} role="group">
                {issue.options.map((option) => (
                  <button aria-pressed={selected === option} key={option} onClick={() => decide(issue.id, option)} type="button">{option}</button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <section className={complete ? "cleaning-lab__result is-complete" : "cleaning-lab__result"} aria-live="polite">
        <div><span>오늘 남길 결과</span><h5>우리 모둠 데이터 정제 기록</h5></div>
        {complete ? (
          <div className="cleaning-lab__result-card">
            <span>정제 전 9행 → 정제 후 8행</span>
            <ul>{cleaningIssues.map((issue) => <li key={issue.id}>{issue.resultLabel}</li>)}</ul>
            <p>9행처럼 원래 연도 기록이 없는 칸은 빈칸이 정상입니다. 억지로 채우지 않습니다.</p>
            <div className="cleaning-lab__result-actions">
              {!saved ? <button className="button button--primary" onClick={saveResult} type="button">정제 기록 저장</button> : <strong role="status">저장 완료! 이제 아래에서 모둠 시트 실전 정제를 시작하세요.</strong>}
              <button className="button button--outline" onClick={resetLab} type="button">처음부터 다시</button>
            </div>
          </div>
        ) : (
          <p>여섯 문제를 모두 해결하면 정제 전후 비교 기록이 완성됩니다. 무엇을 왜 고쳤는지는 활동지에 씁니다.</p>
        )}
      </section>
    </div>
  );
}
