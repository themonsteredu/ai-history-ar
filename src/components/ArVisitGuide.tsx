import '../styles/ar-exhibit.css';

const routes = [
  { group: 1, stops: [2, 3, 4] }, { group: 2, stops: [3, 4, 5] },
  { group: 3, stops: [4, 5, 6] }, { group: 4, stops: [5, 6, 1] },
  { group: 5, stops: [6, 1, 2] }, { group: 6, stops: [1, 2, 3] },
];

export default function ArVisitGuide() {
  return <details className="ar-visit-guide">
    <summary>6모둠 관람 순서 · 한 곳에서 4분</summary>
    <p>준비 5분 → 첫 관람 12분 → 역할 바꾸기 2분 → 두 번째 관람 12분 → 정리 3분 → 돌아보기 6분</p>
    <p>모둠 안에서 A팀과 B팀을 나눠요. 첫 관람은 A팀이 설명하고 B팀이 구경해요. 역할을 바꾼 뒤에는 A팀도 아래 순서로 구경해요.</p>
    <p>설명하는 팀은 자기 작업 파일을 연 기기와 인식 카드를 책상에 놓아요. 관람팀이 오면 그 기기로 설명점을 눌러 듣게 해요.</p>
    <div className="ar-visit-table"><table>
      <caption>A팀과 B팀이 같은 순서로 세 곳을 둘러봐요.</caption>
      <thead><tr><th scope="col">우리 모둠</th><th scope="col">첫 4분</th><th scope="col">다음 4분</th><th scope="col">마지막 4분</th></tr></thead>
      <tbody>{routes.map(route => <tr key={route.group}><th scope="row">{route.group}모둠</th>{route.stops.map(stop => <td key={stop}>{stop}모둠 전시</td>)}</tr>)}</tbody>
    </table></div>
    <p className="ar-help">한 곳에서: 설명 두 개 듣기 2분 → 관람 문제 풀기 1분 → 근거를 묻고 다음 자리로 이동하기 1분</p>
  </details>;
}
