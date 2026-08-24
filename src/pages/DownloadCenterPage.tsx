import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { getEraFromRoute } from "../content/catalog";
import { NotFoundPage } from "./NotFoundPage";

export function DownloadCenterPage() {
  const { eraSlug } = useParams();
  const era = getEraFromRoute(eraSlug);

  if (!era) return <NotFoundPage />;

  const totalFiles = era.lessons.reduce(
    (total, lesson) => total + lesson.downloads.student.length + lesson.downloads.teacher.length,
    0,
  );

  return (
    <div className="downloads-page">
      <section className="downloads-hero" style={{ "--era-accent": era.accent, "--era-soft": era.accentSoft } as React.CSSProperties}>
        <div className="page-width">
          <Link className="back-link" to="/teacher"><span aria-hidden="true">←</span> 교사용 대시보드</Link>
          <p className="eyebrow">{era.shortName} · 교사용 다운로드 센터</p>
          <h1>10차시 활동지 구성</h1>
          <p>학생용과 교사용 자료를 차시별로 확인합니다. 현재 단계에서는 문서 구성이 확정되었고, PDF 파일 생성은 다음 단계에서 연결됩니다.</p>
          <div className="downloads-hero__stats">
            <span><strong>10</strong>차시</span>
            <span><strong>{totalFiles}</strong>종 자료</span>
            <span><strong>S-Core Dream</strong> 인쇄 기준</span>
          </div>
        </div>
      </section>

      <section className="page-width downloads-content">
        <div className="implementation-note">
          <Icon name="spark" size={22} />
          <div>
            <strong>현재 구현 단계</strong>
            <p>활동지 이름·대상·규격 데이터가 연결되었습니다. 다음 단계에서 A4/A6 렌더러, PDF, 차시 ZIP과 시대 전체 ZIP을 순서대로 구현합니다.</p>
          </div>
        </div>
        <div className="download-table-wrap">
          <table className="download-table">
            <thead>
              <tr>
                <th scope="col">차시</th>
                <th scope="col">학생용 활동지</th>
                <th scope="col">교사용 자료</th>
                <th scope="col">규격</th>
                <th scope="col">운영안</th>
              </tr>
            </thead>
            <tbody>
              {era.lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <th scope="row"><span>{String(lesson.id).padStart(2, "0")}</span>{lesson.title}</th>
                  <td><ul>{lesson.downloads.student.map((item) => <li key={item}>{item}</li>)}</ul></td>
                  <td><ul>{lesson.downloads.teacher.map((item) => <li key={item}>{item}</li>)}</ul></td>
                  <td>{lesson.downloads.specialFormat ?? "A4"}</td>
                  <td>
                    <Link aria-label={`${lesson.id}차시 운영안 보기`} className="table-link" to={`/teacher/${era.id}/lesson/${lesson.id}`}>
                      보기 <Icon name="arrow" size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
