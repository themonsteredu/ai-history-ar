import '../styles/worksheet-template.css';
export function WorksheetHeader({ subject, lesson = '', objective }: { subject: string; lesson?: string; objective?: string }) {
  return <div className="leap-heading">
    <div className="leap-top"><b>2026. AI연구학교</b><b>보성초등학교 (5학년)</b></div>
    <div className="leap-logo"><img src={`${import.meta.env.BASE_URL}images/leap-original-logo.png`} alt="AI-L.E.A.P. 활동지 · Boseong Elementary School" /></div>
    <table className="leap-meta"><tbody><tr><th>단 원</th><td>AI와 함께하는 역사 탐구</td><td>{lesson}</td></tr><tr><th>주 제</th><td>{subject}</td><td>이름:</td></tr></tbody></table>
    {objective && <><h3>◎ 학습목표</h3><p>{objective}</p></>}
  </div>;
}
