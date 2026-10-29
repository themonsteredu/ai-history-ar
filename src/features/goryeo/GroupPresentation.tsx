import './group-presentation.css';

export type GroupSubmission = {
  group: number;
  submittedAt: string;
  reflection?: string;
  entries: Array<{
    artifactId: string;
    artifactName: string;
    questionIndex: number;
    statement: string;
    choice: string;
    robotAnswer: string;
    judgment: string;
    evidence: string;
    correction: string;
  }>;
};

type GroupPresentationProps = {
  submissions: GroupSubmission[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export default function GroupPresentation({ submissions, loading, error, onRefresh }: GroupPresentationProps) {
  return (
    <section className="oc-panel group-presentation" aria-labelledby="group-presentation-title">
      <div className="group-presentation-heading">
        <div>
          <p className="oc-eyebrow">다섯 번째 활동</p>
          <h2 id="group-presentation-title">모둠별 발표와 정리</h2>
          <p>각 모둠이 제출한 생각을 함께 읽고, 근거 자료를 보며 로봇의 답을 확인해요.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? '불러오는 중…' : '제출 내용 새로고침'}
        </button>
      </div>
      <div role="status" aria-live="polite" className="group-presentation-status">
        {error ? `제출 내용을 불러오지 못했어요. ${error}` : loading ? '모둠의 제출 내용을 불러오고 있어요.' : `${new Set(submissions.filter(item => item.group >= 1 && item.group <= 6).map(item => item.group)).size}개 모둠이 제출했어요.`}
      </div>
      <div className="group-presentation-grid">
        {Array.from({ length: 6 }, (_, index) => {
          const group = index + 1;
          const submission = submissions.find(item => item.group === group);
          const submittedAt = submission ? displayTime(submission.submittedAt) : '';
          return (
            <article key={group} className="group-presentation-card">
              <header className="group-presentation-card-header">
                <h3>{group}모둠</h3>
                <span className={submission ? 'group-presentation-badge submitted' : 'group-presentation-badge'}>
                  {submission ? '제출 완료' : error ? '확인 불가' : loading ? '확인 중' : '미제출'}
                </span>
              </header>
              {submission ? (
                <>
                  {submittedAt && <p className="group-presentation-time">제출 시간 {submittedAt}</p>}
                  {submission.entries.length === 0 ? <p>제출된 문항이 없어요.</p> : submission.entries.map((entry, entryIndex) => (
                    <section className="group-presentation-entry" key={`${entry.artifactId}-${entry.questionIndex}-${entryIndex}`}>
                      <h4>{entry.artifactName} · {entry.questionIndex + 1}번</h4>
                      <p className="group-presentation-statement">{entry.statement}</p>
                      <dl>
                        <div><dt>우리 모둠의 OX</dt><dd>{entry.choice || '선택하지 않음'}</dd></div>
                        <div><dt>로봇의 답</dt><dd>{entry.robotAnswer || '기록 없음'}</dd></div>
                        <div><dt>자료와 비교한 판단</dt><dd>{entry.judgment || '기록 없음'}</dd></div>
                        <div><dt>자료에서 찾은 근거</dt><dd>{entry.evidence || '기록 없음'}</dd></div>
                        <div><dt>바르게 고친 내용</dt><dd>{entry.correction || '기록 없음'}</dd></div>
                      </dl>
                    </section>
                  ))}
                  {submission.reflection && <section className="group-presentation-entry group-presentation-reflection"><h4>오늘 알게 된 점</h4><p>{submission.reflection}</p></section>}
                </>
              ) : <p className="group-presentation-empty">{error ? '제출 여부를 확인하지 못했어요.' : loading ? '제출 여부를 확인하고 있어요.' : '아직 제출하지 않았어요.'}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
