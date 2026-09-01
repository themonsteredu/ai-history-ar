import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LessonSlides } from "../components/LessonSlides";
import { LessonWebActivity } from "../components/LessonWebActivity";
import { SimpleLessonSlides } from "../components/SimpleLessonSlides";
import { getLessonActivityModeInfo } from "../content/lesson-helpers";
import type { Era, Lesson } from "../types/curriculum";

type ClassroomView = "start" | "ppt" | "activity";

function resolveView(value: string | null): ClassroomView {
  if (value === "ppt" || value === "activity") return value;
  return "start";
}

function lessonViewPath(basePath: string, lessonId: number, view: ClassroomView) {
  const lessonPath = `${basePath}/${lessonId}`;
  return view === "start" ? lessonPath : `${lessonPath}?view=${view}`;
}

export function ClassroomLessonPage({ era, lesson }: { era: Era; lesson: Lesson }) {
  const [searchParams] = useSearchParams();
  const view = resolveView(searchParams.get("view"));
  const previousLesson = era.lessons.find((candidate) => candidate.id === lesson.id - 1);
  const nextLesson = era.lessons.find((candidate) => candidate.id === lesson.id + 1);
  const basePath = `${era.route}/lesson`;
  const activityTab = getLessonActivityModeInfo(lesson, era.id);
  const isVerificationLesson = lesson.id === 2;

  const activityDescription = isVerificationLesson
    ? "모둠별 담당 유산의 AI 문장을 읽고, 사실·오류·근거 부족을 직접 판단합니다."
    : activityTab.description;

  return (
    <div className="classroom-page" style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
      <header className="classroom-header">
        <div className="page-width classroom-header__inner">
          <Link className="back-link" to={era.route}><span aria-hidden="true">←</span>{era.shortName} 10차시</Link>
          <div className="classroom-header__title">
            <span>{String(lesson.id).padStart(2, "0")}</span>
            <div><p>{era.grade} · {era.shortName}</p><h1>{lesson.title}</h1></div>
          </div>
          <nav aria-label="수업 화면 선택" className="classroom-tabs classroom-tabs--three">
            <Link
              aria-current={view === "start" ? "page" : undefined}
              className={view === "start" ? "is-active" : ""}
              to={`${basePath}/${lesson.id}`}
            >
              <span>00</span><strong>수업 시작</strong><small>PPT와 웹앱 선택</small>
            </Link>
            <Link
              aria-current={view === "ppt" ? "page" : undefined}
              className={view === "ppt" ? "is-active" : ""}
              to={`${basePath}/${lesson.id}?view=ppt`}
            >
              <span>01</span><strong>수업 PPT</strong><small>교실 화면으로 설명하기</small>
            </Link>
            <Link
              aria-current={view === "activity" ? "page" : undefined}
              className={view === "activity" ? "is-active" : ""}
              to={`${basePath}/${lesson.id}?view=activity`}
            >
              <span>02</span><strong>학생 웹앱</strong><small>{activityTab.shortLabel}</small>
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-width classroom-content">
        {view === "start" ? (
          <section className="classroom-start" aria-labelledby="classroom-start-title">
            <header className="classroom-start__heading">
              <p>{era.shortName} · {lesson.id}차시 수업 홈</p>
              <h2 id="classroom-start-title">PPT로 안내하고, 웹앱으로 활동합니다</h2>
              <span>{lesson.objective}</span>
            </header>

            <div className="classroom-start__cards">
              <Link className="classroom-start-card classroom-start-card--ppt" to={`${basePath}/${lesson.id}?view=ppt`}>
                <div className="classroom-start-card__top">
                  <span className="classroom-start-card__number">01</span>
                  <span className="classroom-start-card__icon"><Icon name="book" size={28} /></span>
                </div>
                <div>
                  <p>교사용 큰 화면</p>
                  <h3>수업 PPT</h3>
                  <span>도입 질문, 활동 방법, 시간 안내와 함께 답 확인까지 진행합니다.</span>
                </div>
                <strong>수업 PPT 열기 <Icon name="arrow" size={19} /></strong>
              </Link>

              <Link className="classroom-start-card classroom-start-card--activity" to={`${basePath}/${lesson.id}?view=activity`}>
                <div className="classroom-start-card__top">
                  <span className="classroom-start-card__number">02</span>
                  <span className="classroom-start-card__icon"><Icon name="spark" size={28} /></span>
                </div>
                <div>
                  <p>{activityTab.label}</p>
                  <h3>학생 웹앱</h3>
                  <span>{activityDescription}</span>
                </div>
                <strong>학생 웹앱 시작 <Icon name="arrow" size={19} /></strong>
              </Link>
            </div>

            <div className="classroom-start__flow" aria-label="권장 수업 순서">
              <div><b>1</b><span><strong>PPT로 미션 안내</strong><small>{isVerificationLesson ? "AI는 모르는 게 없을까?" : lesson.keyQuestion}</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>2</b><span><strong>웹앱으로 직접 활동</strong><small>{isVerificationLesson ? "유산별 AI 문장 6개 판정" : activityTab.description}</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>3</b><span><strong>활동지에 생각 기록</strong><small>{isVerificationLesson ? "모둠별 A4 한 장에 근거 남기기" : "이번 차시 산출물 완성하기"}</small></span></div>
            </div>
          </section>
        ) : view === "ppt" ? (
          era.id === "three-kingdoms"
            ? <LessonSlides key={lesson.id} lessonId={lesson.id} />
            : <SimpleLessonSlides era={era} key={lesson.id} lesson={lesson} />
        ) : <LessonWebActivity era={era} lesson={lesson} />}

        <nav aria-label="이전·다음 차시" className="classroom-pagination">
          {previousLesson ? (
            <Link to={lessonViewPath(basePath, previousLesson.id, view)}>
              <span>이전</span><strong>← {previousLesson.id}차시</strong>
            </Link>
          ) : <span />}
          {nextLesson
            ? (
              <Link to={lessonViewPath(basePath, nextLesson.id, view)}>
                <span>다음</span><strong>{nextLesson.id}차시 →</strong>
              </Link>
            )
            : <Link to={era.route}><span>수업 완료</span><strong>10차시 목록 →</strong></Link>}
        </nav>
      </main>
    </div>
  );
}
