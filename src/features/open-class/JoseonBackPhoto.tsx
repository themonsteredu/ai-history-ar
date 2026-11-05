import '../../styles/ar-exhibit.css';

/** The rear of the same 1536 water-clock display, photographed in 2011. */
export function JoseonBackPhoto({ era, artifactId }: { era: 'goryeo' | 'joseon'; artifactId: number }) {
  if (era !== 'joseon' || artifactId !== 2) return null;
  return <details className="joseon-back-photo">
    <summary>자격루 뒤쪽 사진 보기</summary>
    <figure>
      <img src={`${import.meta.env.BASE_URL}images/heritage/joseon-science/jagyeongnu-back.jpg`} alt="광명문에 전시된 자격루를 뒤에서 본 모습. 돌 받침과 큰 물항아리가 보인다." loading="lazy" />
      <figcaption>광명문 전시, 2011년 · 사진: <a href="https://commons.wikimedia.org/wiki/File:KSH_Jeongdong_(24).jpg" target="_blank" rel="noopener noreferrer">KSH1015</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a> · 크기 조정</figcaption>
    </figure>
    <p>뒤에서 본 돌 받침과 큰 항아리예요. 원통형 항아리의 뒷면은 받침에 가려져 있어요. 사진에 보이지 않는 모형의 부분은 추정이에요.</p>
  </details>;
}
