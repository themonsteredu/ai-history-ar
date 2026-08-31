import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { getEraFromRoute } from "../content/catalog";
import {
  eraBundlePath,
  lessonDownloadPath,
  lessonGroupDownloadPath,
  lessonPptDownloadPath,
} from "../content/downloads";
import { NotFoundPage } from "./NotFoundPage";

function printableFormat(specialFormat: string | undefined, lessonId: number) {
  if (lessonId === 2) return "모둠별 A4 1쪽";
  if (specialFormat === "A6 카드") return "A4 1장 · A6 앞뒤면";
  if (specialFormat === "A5 접지") return "A4 1장 · A5 접지";
  return "A4 1장";
}

const lessonTwoSlugs: Record<string, readonly string[]> = {
  "three-kingdoms": [
    "muryeongwangneung",
    "baekje-incense-burner",
    "cheomseongdae",
    "silla-gold-crown",
    "goguryeo-murals",
    "gaya-tumuli",
  ],
  joseon: [
    "hunminjeongeum",
    "annals",
    "hwaseong",
    "jagyeongnu-angbuilgu",
    "jongmyo",
    "nanjung-ilgi",
  ],
};

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
          <Link className="back-link" to="/teacher"><span aria-hidden="true">←</span> 교사 설정</Link>
          <p className="eyebrow">{era.grade} · {era.shortName} · 교사용 다운로드 센터</p>
          <h1>활동지·활동카드·답안</h1>
          <p>학생 공개 화면에는 나오지 않는 교사용 인쇄 자료입니다. 차시별 PDF·PPT와 ZIP으로 내려받을 수 있습니다.</p>
          <div className="downloads-hero__stats">
            <span><strong>10</strong>차시</span>
            <span><strong>6</strong>모둠별 2차시 활동지</span>
            <span><strong>{totalFiles}</strong>종 기본 수업자료</span>
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
            <strong>2차시는 모둠별 A4 한 장으로 제공합니다</strong>
            <p>학교 양식의 초록·민트·베이지 디자인과 S-Core Dream을 적용했습니다. 통합 학생 PDF는 모둠별 한 장씩 총 6쪽입니다.</p>
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
                  <td>
                    <ul>{lesson.downloads.student.map((item) => <li key={item}>{item}</li>)}</ul>
                    {lesson.id === 2 ? <p style={{ marginTop: "0.55rem", fontWeight: 700 }}>각 모둠 PDF는 A4 세로 1쪽</p> : null}
                  </td>
                  <td><ul>{lesson.downloads.teacher.map((item) => <li key={item}>{item}</li>)}</ul></td>
                  <td>{printableFormat(lesson.downloads.specialFormat, lesson.id)}</td>
                  <td>
                    <div className="download-actions">
                      {lesson.id === 2 ? (
                        <a className="button button--primary button--small" download href={lessonPptDownloadPath(era.id, lesson.id)}>
                          수업 PPT
                        </a>
                      ) : null}
                      <a className="button button--primary button--small" download href={lessonDownloadPath(era.id, lesson.id, "student")}>
                        학생 PDF
                      </a>
                      <a className="button button--gold button--small" download href={lessonDownloadPath(era.id, lesson.id, "teacher")}>
                        교사 PDF
                      </a>
                      <a className="button button--quiet button--small" download href={lessonDownloadPath(era.id, lesson.id, "answer")}>
                        답안 PDF
                      </a>
                      <a className="button button--outline button--small" download href={lessonDownloadPath(era.id, lesson.id, "bundle")}>
                        전체 ZIP
                      </a>
                      <Link aria-label={`${lesson.id}차시 운영안 보기`} className="table-link" to={`/teacher/${era.id}/lesson/${lesson.id}`}>
                        운영안 보기 <Icon name="arrow" size={14} />
                      </Link>
                    </div>
                    {lesson.id === 2 ? (
                      <div
                        aria-label="2차시 모둠별 활동지"
                        style={{
                          display: "grid",
                          gap: "0.45rem",
                          marginTop: "0.85rem",
                          padding: "0.8rem",
                          border: `1px solid ${era.accent}33`,
                          borderRadius: "0.85rem",
                          background: era.accentSoft,
                        }}
                      >
                        <strong style={{ color: era.accent }}>모둠별 A4 한 장 PDF</strong>
                        {era.groups.map((group, index) => (
                          <a
                            key={group.id}
                            className="table-link"
                            download
                            href={lessonGroupDownloadPath(
                              era.id,
                              lesson.id,
                              group.id,
                              lessonTwoSlugs[era.id][index],
                            )}
                          >
                            {group.id}모둠 · {group.heritage} <Icon name="download" size={14} />
                          </a>
                        ))}
                      </div>
                    ) : null}
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
