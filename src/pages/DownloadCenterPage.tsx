import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { getEraFromRoute } from "../content/catalog";
import { eraBundlePath, lessonDownloadPath } from "../content/downloads";
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
          <h1>10차시 수업자료 다운로드</h1>
          <p>학생 활동지, 교사지도안, 수업용 활동카드를 차시별 PDF와 ZIP으로 바로 내려받을 수 있습니다.</p>
          <div className="downloads-hero__stats">
            <span><strong>10</strong>차시</span>
            <span><strong>20</strong>개 PDF</span>
            <span><strong>{totalFiles}</strong>종 수업자료 수록</span>
          </div>
          <a className="button button--light downloads-hero__download" download href={eraBundlePath(era.id)}>
            <Icon name="download" size={19} />{era.shortName} 10차시 전체 ZIP
          </a>
        </div>
      </section>

      <section className="page-width downloads-content">
        <div className="implementation-note">
          <Icon name="spark" size={22} />
          <div>
            <strong>인쇄용 파일 준비 완료</strong>
            <p>기본은 A4, 7차시 AR 카드는 A6, 10차시 스탬프북은 A5 규격입니다. PDF에는 S-Core Dream 글꼴이 내장되어 있습니다.</p>
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
                <th scope="col">파일 다운로드</th>
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
                    <div className="download-actions">
                      <a className="button button--primary button--small" download href={lessonDownloadPath(era.id, lesson.id, "student")}>
                        학생 PDF
                      </a>
                      <a className="button button--gold button--small" download href={lessonDownloadPath(era.id, lesson.id, "teacher")}>
                        교사 PDF
                      </a>
                      <a className="button button--outline button--small" download href={lessonDownloadPath(era.id, lesson.id, "bundle")}>
                        전체 ZIP
                      </a>
                      <Link aria-label={`${lesson.id}차시 운영안 보기`} className="table-link" to={`/teacher/${era.id}/lesson/${lesson.id}`}>
                        운영안 보기 <Icon name="arrow" size={14} />
                      </Link>
                    </div>
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
