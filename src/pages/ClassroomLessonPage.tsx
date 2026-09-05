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

function lessonViewPath(basePath: string, lessonId: number, view: ClassroomView, currentSearch = "") {
  const lessonPath = `${basePath}/${lessonId}`;
  const params = new URLSearchParams(currentSearch);
  params.delete("view");
  if (view !== "start") params.set("view", view);
  const search = params.toString();
  return search ? `${lessonPath}?${search}` : lessonPath;
}

export function ClassroomLessonPage({ era, lesson }: { era: Era; lesson: Lesson }) {
  const [searchParams] = useSearchParams();
  const view = resolveView(searchParams.get("view"));
  // 차시 번호는 연속이 아닙니다(삼국시대는 2·3차시를 합쳐 3차시가 없음). 배열 순서로 이웃을 찾습니다.
  const lessonIndex = era.lessons.findIndex((candidate) => candidate.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? era.lessons[lessonIndex - 1] : undefined;
  const nextLesson = lessonIndex >= 0 ? era.lessons[lessonIndex + 1] : undefined;
  const basePath = `${era.route}/lesson`;
  const activityTab = getLessonActivityModeInfo(lesson, era.id);
  const isVerificationLesson = lesson.id === 2;
  const viewPath = (lessonId: number, nextView: ClassroomView) => lessonViewPath(basePath, lessonId, nextView, searchParams.toString());

  const activityDescription = isVerificationLesson
    ? "모둠별 담당 유산의 AI 문장 6개를 ○×△?로 판단하고 확인한 출처를 적습니다."
    : activityTab.description;

  return (
    <div className="classroom-page" style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
      <header className="classroom-header">
        <div className="page-width classroom-header__inner">
          <Link className="back-link" to={era.route}><span aria-hidden="true">←</span>{era.shortName} {era.lessons.length}차시</Link>
          <div className="classroom-header__title">
            <span>{String(lesson.id).padStart(2, "0")}</span>
            <div><p>{era.grade} · {era.shortName}</p><h1>{lesson.title}</h1></div>
          </div>
          <nav aria-label="수업 화면 선택" className="classroom-tabs classroom-tabs--three">
            <Link
              aria-current={view === "start" ? "page" : undefined}
              className={view === "start" ? "is-active" : ""}
              to={viewPath(lesson.id, "start")}
            >
              <span>00</span><strong>수업 시작</strong><small>PPT와 활동 화면 선택</small>
            </Link>
            <Link
              aria-current={view === "ppt" ? "page" : undefined}
              className={view === "ppt" ? "is-active" : ""}
              to={viewPath(lesson.id, "ppt")}
            >
              <span>01</span><strong>수업 PPT</strong><small>교실 화면으로 설명하기</small>
            </Link>
            <Link
              aria-current={view === "activity" ? "page" : undefined}
              className={view === "activity" ? "is-active" : ""}
              to={viewPath(lesson.id, "activity")}
            >
              <span>02</span><strong>{activityTab.label}</strong><small>{activityTab.shortLabel}</small>
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-width classroom-content">
        {view === "start" ? (
          <section className="classroom-start" aria-labelledby="classroom-start-title">
            <header className="classroom-start__heading">
              <p>{era.shortName} · {lesson.id}차시 수업 홈</p>
              <h2 id="classroom-start-title">PPT로 안내하고, 활동 화면에서 활동합니다</h2>
              <span>{lesson.objective}</span>
            </header>

            <div className="classroom-start__cards">
              <Link className="classroom-start-card classroom-start-card--ppt" to={viewPath(lesson.id, "ppt")}>
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

              <Link className="classroom-start-card classroom-start-card--activity" to={viewPath(lesson.id, "activity")}>
                <div className="classroom-start-card__top">
                  <span className="classroom-start-card__number">02</span>
                  <span className="classroom-start-card__icon"><Icon name="spark" size={28} /></span>
                </div>
                <div>
                  <p>학생 활동 화면</p>
                  <h3>{activityTab.label}</h3>
                  <span>{activityDescription}</span>
                </div>
                <strong>{activityTab.label} 시작 <Icon name="arrow" size={19} /></strong>
              </Link>
            </div>

            <div className="classroom-start__flow" aria-label="권장 수업 순서">
              <div><b>1</b><span><strong>PPT로 미션 안내</strong><small>{lesson.keyQuestion}</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>2</b><span><strong>활동 화면에서 직접 활동</strong><small>{isVerificationLesson ? "유산별 AI 문장 6개 판단" : activityTab.description}</small></span></div>
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
            <Link to={viewPath(previousLesson.id, view)}>
              <span>이전</span><strong>← {previousLesson.id}차시</strong>
            </Link>
          ) : <span />}
          {nextLesson
            ? (
              <Link to={viewPath(nextLesson.id, view)}>
                <span>다음</span><strong>{nextLesson.id}차시 →</strong>
              </Link>
            )
            : <Link to={era.route}><span>수업 완료</span><strong>{era.lessons.length}차시 목록 →</strong></Link>}
        </nav>
      </main>
    </div>
  );
}
