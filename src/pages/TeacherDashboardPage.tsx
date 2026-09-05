import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { LessonCard } from "../components/LessonCard";
import { eras, getEra } from "../content/catalog";
import type { EraId } from "../types/curriculum";

export function TeacherDashboardPage() {
  const [selectedEraId, setSelectedEraId] = useState<EraId>("three-kingdoms");
  const [query, setQuery] = useState("");
  const selectedEra = getEra(selectedEraId) ?? eras[0];
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const visibleLessons = normalizedQuery
    ? selectedEra.lessons.filter((lesson) =>
        `${lesson.id} ${lesson.title} ${lesson.objective} ${lesson.outputs.join(" ")}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery),
      )
    : selectedEra.lessons;
  const worksheetCount = selectedEra.lessons.reduce(
    (total, lesson) => total + lesson.downloads.student.length + lesson.downloads.teacher.length,
    0,
  );

  return (
    <div className="teacher-page">
      <section className="teacher-hero">
        <div className="page-width teacher-hero__grid">
          <div>
            <p className="eyebrow">PIN으로 잠긴 교사 설정</p>
            <h1>지도안과 인쇄 자료를<br />여기에서만 관리합니다</h1>
            <p>공개 수업 화면과 분리된 교사용 공간입니다. 지도안·학생활동지·활동카드·답안을 시대별로 확인합니다.</p>
          </div>
          <div className="teacher-hero__summary">
            <div><span>수업 과정</span><strong>2</strong><small>시대</small></div>
            <div><span>전체 차시</span><strong>{eras.reduce((total, era) => total + era.lessons.length, 0)}</strong><small>차시</small></div>
            <div><span>현재 자료</span><strong>{worksheetCount}</strong><small>종 구성</small></div>
          </div>
        </div>
      </section>

      <section className="page-width dashboard-content">
        <div className="dashboard-toolbar">
          <div aria-label="시대 선택" className="segmented-control" role="group">
            {eras.map((era) => (
              <button
                aria-pressed={era.id === selectedEra.id}
                className={era.id === selectedEra.id ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"}
                key={era.id}
                onClick={() => setSelectedEraId(era.id)}
                type="button"
              >
                {era.shortName} {era.lessons.length}차시
              </button>
            ))}
          </div>
          <label className="search-field">
            <span className="sr-only">차시 또는 산출물 검색</span>
            <Icon name="eye" size={18} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="차시·활동·산출물 검색"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">{selectedEra.verificationLabel} · {selectedEra.verificationSteps.join(" · ")}</p>
            <h2>{selectedEra.shortName} 교사 지도안</h2>
            <p>“{selectedEra.coreQuestion}”</p>
          </div>
          <div className="dashboard-heading__actions">
            <Link className="button button--primary" to={`/teacher/${selectedEra.id}/downloads`}>
              <Icon name="download" size={18} />활동지·카드·답안
            </Link>
          </div>
        </div>

        {visibleLessons.length > 0 ? (
          <div className="lesson-list lesson-list--teacher">
            {visibleLessons.map((lesson) => <LessonCard era={selectedEra} key={lesson.id} lesson={lesson} mode="teacher" />)}
          </div>
        ) : (
          <div className="empty-state">
            <strong>검색 결과가 없습니다.</strong>
            <p>차시 제목이나 활동지 이름을 다른 말로 찾아보세요.</p>
          </div>
        )}
      </section>
    </div>
  );
}
