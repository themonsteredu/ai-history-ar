import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classTableColumns,
  classTableCsv,
  lessonFiveStartCsv,
  dataCardFields,
  emptyDataCard,
  heritageResearchCases,
  judgementMarks,
  lessonTwoStatementSets,
  type ClassDataRow,
  type DataCardFieldId,
  type DataCardValues,
} from "../content/three-kingdoms/webActivities";
import { Icon } from "./Icon";
import { useLocation } from "react-router-dom";
import { lessonTwoStorageKey } from "../lib/careerLogKeys";
import { readResilientStorage, removeResilientStorage, writeResilientStorage } from "../lib/resilientStorage";

const imageRoot = `${import.meta.env.BASE_URL}images/heritage/three-kingdoms`;
const lessonFourStorageKey = "moa-history-ar:three-kingdoms:lesson-4:class-table:v1";
const lessonFourChannel = "moa-history-ar:three-kingdoms:lesson-4";

const officialSourceRanks = [
  "1순위  국가유산청 국가유산포털",
  "2순위  국립중앙박물관·국립부여박물관",
  "3순위  유네스코 세계유산센터·우리역사넷",
] as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function GroupPicker({
  eyebrow,
  title,
  description,
  onSelect,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onSelect: (groupId: number) => void;
}) {
  return (
    <div className="group-picker">
      <div className="group-picker__intro">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="group-picker__grid">
        {lessonTwoStatementSets.map((set) => (
          <button key={set.groupId} onClick={() => onSelect(set.groupId)} type="button">
            <img alt="" aria-hidden="true" src={`${imageRoot}/${heritageResearchCases[set.groupId - 1].image}`} />
            <span>{set.groupId}모둠</span>
            <strong>{set.heritage}</strong>
          </button>
        ))}
      </div>
      <p className="group-picker__note"><Icon name="lock" size={15} />학생 로그인이 없습니다. 우리 모둠만 고르면 바로 시작합니다.</p>
    </div>
  );
}

interface LessonTwoRecord {
  groupId: number;
  marks: Record<string, string>;
  sources: Record<string, string>;
}

/**
 * 2차시 학생 활동 화면.
 * 활동지·PPT와 같은 항목 이름(내 판단 (○×△?) · 확인한 출처)만 사용하고 정답은 표시하지 않습니다.
 */
export function LessonTwoJudgementTool() {
  const location = useLocation();
  const storageKey = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return lessonTwoStorageKey(params.get("hub_code") || "", params.get("student_id") || "");
  }, [location.search]);
  const [record, setRecord] = useState<LessonTwoRecord | null>(() => {
    const raw = readResilientStorage(storageKey);
    try { return raw ? JSON.parse(raw) as LessonTwoRecord : null; } catch { return null; }
  });

  useEffect(() => {
    const raw = readResilientStorage(storageKey);
    try { setRecord(raw ? JSON.parse(raw) as LessonTwoRecord : null); } catch { setRecord(null); }
  }, [storageKey]);

  const save = useCallback((next: LessonTwoRecord) => {
    setRecord(next);
    writeResilientStorage(storageKey, JSON.stringify(next));
  }, [storageKey]);

  if (!record) {
    return (
      <GroupPicker
        description="우리 모둠 유산에 대해 AI가 한 말 6문장이 활동지와 같은 번호로 나옵니다."
        eyebrow="2차시 · 우리 모둠 고르기"
        onSelect={(groupId) => save({ groupId, marks: {}, sources: {} })}
        title="어느 모둠인가요?"
      />
    );
  }

  const set = lessonTwoStatementSets[record.groupId - 1];
  const decided = set.statements.filter((statement) => record.marks[statement.id]).length;

  return (
    <div className="web-tool judgement-tool" data-testid="lesson-2-judgement">
      <header className="judgement-tool__header">
        <div>
          <span>{record.groupId}모둠 · {set.heritage}</span>
          <h3>{set.aiQuestion}</h3>
        </div>
        <div className="judgement-tool__progress">
          <strong>{decided} / {set.statements.length}</strong>
          <span>판단함</span>
        </div>
      </header>

      <ol className="judgement-tool__list">
        {set.statements.map((statement, index) => (
          <li key={statement.id}>
            <div className="judgement-tool__statement">
              <span>{index + 1}</span>
              <p>{statement.text}</p>
            </div>
            <div className="judgement-tool__answer">
              <fieldset>
                <legend>내 판단 (○×△?)</legend>
                <div role="group">
                  {judgementMarks.map((mark) => (
                    <button
                      aria-label={`${index + 1}번 ${mark.symbol} ${mark.meaning}`}
                      aria-pressed={record.marks[statement.id] === mark.symbol}
                      className={record.marks[statement.id] === mark.symbol ? "is-selected" : ""}
                      key={mark.symbol}
                      onClick={() => save({ ...record, marks: { ...record.marks, [statement.id]: mark.symbol } })}
                      type="button"
                    >
                      <strong>{mark.symbol}</strong>
                      <small>{mark.meaning}</small>
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                <span>확인한 출처</span>
                <input
                  onChange={(event) => save({ ...record, sources: { ...record.sources, [statement.id]: event.target.value } })}
                  placeholder="확인한 기관 이름"
                  type="text"
                  value={record.sources[statement.id] ?? ""}
                />
              </label>
            </div>
          </li>
        ))}
      </ol>

      <footer className="judgement-tool__footer">
        <p><Icon name="lock" size={16} />정답과 점수는 이 화면에 나오지 않습니다. 선생님이 모둠 발표 뒤에 공개합니다.</p>
        <div>
          <span>확인한 출처가 없으면 ?로 남깁니다.</span>
          <button className="button button--outline" onClick={() => save({ groupId: record.groupId, marks: {}, sources: {} })} type="button">
            처음부터 다시
          </button>
          <button className="button button--quiet" onClick={() => { removeResilientStorage(storageKey); setRecord(null); }} type="button">
            모둠 다시 고르기
          </button>
        </div>
      </footer>
    </div>
  );
}

function readClassTable(): ClassDataRow[] {
  const rows = readJson<ClassDataRow[]>(lessonFourStorageKey, []);
  return Array.isArray(rows) ? rows : [];
}

function mergeRow(rows: readonly ClassDataRow[], row: ClassDataRow) {
  const others = rows.filter((item) => item.groupId !== row.groupId);
  return [...others, row].sort((left, right) => left.groupId - right.groupId);
}

/**
 * 4차시 학생 활동 화면.
 * 모든 모둠이 같은 일곱 항목을 채우면 우리 모둠 카드가 학급 데이터 표의 한 줄이 됩니다.
 * 정답·모범 답안은 표시하지 않고, 교사만 완성된 표를 5차시 시작 CSV로 내보냅니다.
 */
export function LessonFourDataBuilder() {
  const [groupId, setGroupId] = useState<number | null>(null);
  const [values, setValues] = useState<DataCardValues>(emptyDataCard);
  const [rows, setRows] = useState<ClassDataRow[]>(readClassTable);
  const [status, setStatus] = useState("");
  const [pastedCode, setPastedCode] = useState("");

  // 같은 브라우저의 다른 탭·창에서 저장한 모둠 카드를 학급 표에 실시간으로 반영합니다.
  useEffect(() => {
    const refresh = () => setRows(readClassTable());
    window.addEventListener("storage", refresh);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(lessonFourChannel) : null;
    channel?.addEventListener("message", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      channel?.close();
    };
  }, []);

  const publish = useCallback((nextRows: ClassDataRow[]) => {
    setRows(nextRows);
    window.localStorage.setItem(lessonFourStorageKey, JSON.stringify(nextRows));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(lessonFourChannel);
      channel.postMessage("updated");
      channel.close();
    }
  }, []);

  const csvHref = useMemo(() => `data:text/csv;charset=utf-8,﻿${encodeURIComponent(classTableCsv(rows))}`, [rows]);
  // 5차시 시작 파일에는 2차시 AI 답변 줄과 두 번 올라온 줄이 함께 들어간다.
  // 정제할 거리(표기 흔들림·중복·빈 출처)가 있어야 5차시 수업이 성립한다.
  const startFileHref = useMemo(() => `data:text/csv;charset=utf-8,﻿${encodeURIComponent(lessonFiveStartCsv(rows))}`, [rows]);

  function startGroup(nextGroupId: number) {
    const saved = readClassTable().find((row) => row.groupId === nextGroupId);
    setGroupId(nextGroupId);
    setValues(saved ? saved.values : emptyDataCard());
    setStatus("");
  }

  function saveCard() {
    if (groupId === null) return;
    const row: ClassDataRow = {
      groupId,
      heritage: lessonTwoStatementSets[groupId - 1].heritage,
      values,
      updatedAt: new Date().toISOString(),
    };
    publish(mergeRow(readClassTable(), row));
    setStatus("우리 모둠 카드를 학급 표에 올렸습니다.");
  }

  async function copyGroupCode() {
    if (groupId === null) return;
    const code = btoa(encodeURIComponent(JSON.stringify({ groupId, heritage: lessonTwoStatementSets[groupId - 1].heritage, values })));
    try {
      await navigator.clipboard.writeText(code);
      setStatus("모둠 카드 코드를 복사했습니다. 선생님 화면에 붙여 넣으세요.");
    } catch {
      setStatus(`복사하지 못했습니다. 이 코드를 그대로 알려 주세요: ${code}`);
    }
  }

  function mergeGroupCode() {
    try {
      const parsed = JSON.parse(decodeURIComponent(atob(pastedCode.trim()))) as { groupId: number; heritage: string; values: DataCardValues };
      if (!parsed.groupId || !parsed.values) throw new Error("invalid");
      publish(mergeRow(readClassTable(), { ...parsed, updatedAt: new Date().toISOString() }));
      setPastedCode("");
      setStatus(`${parsed.groupId}모둠 카드를 학급 표에 합쳤습니다.`);
    } catch {
      setStatus("코드를 읽을 수 없습니다. 모둠 화면에서 다시 복사해 주세요.");
    }
  }

  const filled = dataCardFields.filter((field) => values[field.id].trim()).length;
  const sources = groupId === null ? [] : heritageResearchCases[groupId - 1].sources;

  return (
    <div className="web-tool data-builder" data-testid="lesson-4-data-builder">
      <section className="core-mission" aria-label="오늘의 미션">
        <span>4차시 · 데이터 만들기</span>
        <strong>여섯 모둠이 똑같은 일곱 항목을 채우면 학급 데이터 표가 완성됩니다.</strong>
        <p>자유롭게 조사하면 서로 비교할 수 없습니다. 같은 항목으로 모아야 표가 됩니다.</p>
      </section>

      {groupId === null ? (
        <GroupPicker
          description="우리 모둠 카드가 학급 데이터 표의 한 줄이 됩니다."
          eyebrow="4차시 · 우리 모둠 고르기"
          onSelect={startGroup}
          title="어느 모둠인가요?"
        />
      ) : (
        <>
          <header className="data-builder__header">
            <div>
              <span>{groupId}모둠 · {lessonTwoStatementSets[groupId - 1].heritage}</span>
              <h3>우리 모둠 조사 카드</h3>
            </div>
            <div className="data-builder__progress">
              <strong>{filled} / {dataCardFields.length}</strong>
              <span>항목 채움</span>
            </div>
            <button className="button button--quiet" onClick={() => setGroupId(null)} type="button">모둠 다시 고르기</button>
          </header>

          <section className="data-builder__sources" aria-labelledby="data-builder-sources-title">
            <div>
              <span>공식 자료부터 순서대로</span>
              <h4 id="data-builder-sources-title">어디에서 확인할까?</h4>
              <ol>{officialSourceRanks.map((rank) => <li key={rank}>{rank}</li>)}</ol>
            </div>
            <div className="data-builder__links">
              {/* 기관과 읽기 임무만 보여 줍니다. 자료가 내린 결론(정답)은 학생 화면에 싣지 않습니다. */}
              {sources.map((source) => (
                <a href={source.href} key={source.id} rel="noreferrer" target="_blank">
                  <span>{source.label}</span>
                  <strong>{source.institution}</strong>
                  <small>{source.readGuide}</small>
                </a>
              ))}
            </div>
          </section>

          <div className="data-builder__fields">
            {dataCardFields.map((field) => (
              <label key={field.id}>
                <span>{field.label}</span>
                <small>{field.hint}</small>
                <input
                  onChange={(event) => setValues((current) => ({ ...current, [field.id as DataCardFieldId]: event.target.value }))}
                  placeholder="핵심 낱말만 적기"
                  type="text"
                  value={values[field.id]}
                />
              </label>
            ))}
          </div>

          <div className="data-builder__submit">
            <p>확인하지 못한 항목은 비워 두거나 ‘아직 모름’이라고 적습니다. 추측으로 채우지 않습니다.</p>
            <div>
              <button className="button button--outline" onClick={copyGroupCode} type="button">모둠 카드 코드 복사</button>
              <button className="button button--primary" onClick={saveCard} type="button">학급 표에 올리기</button>
            </div>
          </div>
        </>
      )}

      <section className="data-builder__table" aria-labelledby="class-table-title">
        <header>
          <div>
            <span>학급 데이터 표 · 실시간</span>
            <h3 id="class-table-title">여섯 모둠 가운데 {rows.length}모둠이 올렸습니다</h3>
          </div>
          <div className="data-builder__exports">
            <a className="button button--outline" download="three-kingdoms-class-data.csv" href={csvHref}>
              <Icon name="download" size={17} />학급 데이터 표 CSV
            </a>
            <a className="button button--gold" download="three-kingdoms-lesson5-start.csv" href={startFileHref}>
              <Icon name="download" size={17} />교사용 · 5차시 시작 파일
            </a>
          </div>
        </header>
        <div className="data-builder__table-scroll">
          <table>
            <thead>
              <tr>{classTableColumns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={classTableColumns.length}>아직 올라온 모둠 카드가 없습니다.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.groupId}>
                  <th scope="row">{row.groupId}모둠</th>
                  <td>{row.heritage}</td>
                  {dataCardFields.map((field) => <td key={field.id}>{row.values[field.id] || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-builder__merge">
          <label>
            <span>다른 기기의 모둠 카드 코드 합치기</span>
            <input onChange={(event) => setPastedCode(event.target.value)} placeholder="모둠 화면에서 복사한 코드를 붙여 넣으세요" type="text" value={pastedCode} />
          </label>
          <button className="button button--outline" disabled={!pastedCode.trim()} onClick={mergeGroupCode} type="button">표에 합치기</button>
        </div>
        <p aria-live="polite" className="data-builder__status" role="status">{status}</p>
        <p className="data-builder__note">
          학급 표는 이 기기에 저장되며, 같은 브라우저의 다른 탭에는 바로 반영됩니다. 다른 기기의 모둠은 카드 코드를 복사해 교사 화면에서 합칩니다.
          5차시 시작 파일에는 2차시 AI 답변으로 만든 줄과 두 번 올라온 줄이 함께 들어갑니다.
        </p>
      </section>
    </div>
  );
}
