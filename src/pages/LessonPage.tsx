import { Link, useParams } from "react-router-dom";
import { DownloadPanel } from "../components/DownloadPanel";
import { Icon } from "../components/Icon";
import { PhaseBadge } from "../components/PhaseBadge";
import { getEra, getEraFromRoute, getLesson } from "../content/catalog";
import { getLessonMinutes } from "../content/lesson-helpers";
import type { EraId } from "../types/curriculum";
import { NotFoundPage } from "./NotFoundPage";

interface LessonPageProps {
  eraId?: EraId;
  mode: "student" | "teacher";
}

export function LessonPage({ eraId, mode }: LessonPageProps) {
  const { eraSlug, lessonId } = useParams();
  const era = eraId ? getEra(eraId) : getEraFromRoute(eraSlug);
  const lesson = era ? getLesson(era, lessonId) : undefined;

  if (!era || !lesson) return <NotFoundPage />;

  const previousLesson = era.lessons.find((candidate) => candidate.id === lesson.id - 1);
  const nextLesson = era.lessons.find((candidate) => candidate.id === lesson.id + 1);
  const basePath = mode === "teacher" ? `/teacher/${era.id}/lesson` : `${era.route}/lesson`;

  return (
    <div className={`lesson-page lesson-page--${mode}`}>
      <section className="lesson-hero" style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
        <div className="page-width">
          <Link className="back-link" to={mode === "teacher" ? "/teacher" : era.route}>
            <span aria-hidden="true">←</span> {mode === "teacher" ? "교사용 대시보드" : `${era.shortName} 10차시`}
          </Link>
          <div className="lesson-hero__title-row">
            <div className="lesson-hero__number">{String(lesson.id).padStart(2, "0")}</div>
            <div>
              <PhaseBadge phase={lesson.phase} />
              <p className="lesson-hero__era">{era.shortName} · {lesson.id}차시</p>
              <h1>{lesson.title}</h1>
              <p>{lesson.role}</p>
            </div>
          </div>
          <div className="lesson-hero__facts">
            <span><Icon name="clock" size={18} />총 {getLessonMinutes(lesson)}분</span>
            <span><Icon name="folder" size={18} />산출물 {lesson.outputs.length}종</span>
            <span><Icon name="check" size={18} />{lesson.assessment.method}</span>
          </div>
        </div>
      </section>

      <div className={`page-width lesson-layout${mode === "student" ? " lesson-layout--student" : ""}`}>
        <article className="lesson-main">
          <section className="question-card">
            <p className="eyebrow">이 차시의 핵심 질문</p>
            <h2>“{lesson.keyQuestion}”</h2>
            <div>
              <span>학습 목표</span>
              <p>{lesson.objective}</p>
            </div>
          </section>

          <section className="lesson-section" aria-labelledby="timeline-title">
            <div className="lesson-section__heading">
              <span>01</span>
              <div><p>40분 수업 흐름</p><h2 id="timeline-title">도입부터 정리까지</h2></div>
            </div>
            <div className="activity-timeline">
              {lesson.activities.map((activity) => (
                <article className="activity-row" key={activity.stage}>
                  <div className="activity-row__time">
                    <strong>{activity.minutes}</strong><span>분</span>
                  </div>
                  <div className="activity-row__stage">{activity.stage}</div>
                  <div className="activity-row__body">
                    <h3>{activity.title}</h3>
                    <ul>
                      {activity.details.map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                    <div className="material-chips" aria-label="준비 자료">
                      {activity.materials.map((material) => <span key={material}>{material}</span>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="lesson-section" aria-labelledby="output-title">
            <div className="lesson-section__heading">
              <span>02</span>
              <div><p>남겨야 할 증거</p><h2 id="output-title">산출물과 평가</h2></div>
            </div>
            <div className="output-grid">
              <div className="output-card">
                <h3>이번 차시 산출물</h3>
                <ul className="check-list">
                  {lesson.outputs.map((output) => <li key={output}><Icon name="check" size={17} />{output}</li>)}
                </ul>
              </div>
              <div className="assessment-card">
                <span>{lesson.assessment.method}</span>
                <h3>평가 기준</h3>
                <p>{lesson.assessment.criterion}</p>
                <dl><dt>평가 자료</dt><dd>{lesson.assessment.evidence}</dd></dl>
              </div>
            </div>
          </section>

          {mode === "teacher" ? (
            <section className="lesson-section" aria-labelledby="prep-title">
              <div className="lesson-section__heading">
                <span>03</span>
                <div><p>교사 사전 준비</p><h2 id="prep-title">수업 전에 확인하세요</h2></div>
              </div>
              <div className="prep-grid">
                <div className="prep-card">
                  <h3>준비할 일</h3>
                  <ol>
                    {lesson.teacherPrep.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </div>
                <div className="caution-card">
                  <h3>놓치기 쉬운 점</h3>
                  <ul>
                    {lesson.cautions.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="next-prep"><strong>다음 차시 준비</strong><p>{lesson.nextLessonPrep}</p></div>
            </section>
          ) : null}

          <nav aria-label="이전·다음 차시" className="lesson-pagination">
            {previousLesson ? (
              <Link to={`${basePath}/${previousLesson.id}`}><span>이전 차시</span><strong>← {previousLesson.title}</strong></Link>
            ) : <span />}
            {nextLesson ? (
              <Link className="lesson-pagination__next" to={`${basePath}/${nextLesson.id}`}><span>다음 차시</span><strong>{nextLesson.title} →</strong></Link>
            ) : <Link className="lesson-pagination__next" to={mode === "teacher" ? "/teacher" : era.route}><span>과정 완료</span><strong>10차시 목록으로 →</strong></Link>}
          </nav>
        </article>
        {mode === "teacher" ? <DownloadPanel era={era} lesson={lesson} /> : null}
      </div>
    </div>
  );
}
