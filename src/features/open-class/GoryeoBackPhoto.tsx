import '../../styles/ar-exhibit.css';

/** A photograph of the same museum object; shown separately from its reconstructed 3D model. */
export function GoryeoBackPhoto({ era, artifactId }: { era: 'goryeo' | 'joseon'; artifactId: number }) {
  if (era !== 'goryeo' || artifactId !== 2) return null;
  return <details className="goryeo-back-photo">
    <summary>금속활자 실제 뒷면 사진 보기</summary>
    <figure><img src={`${import.meta.env.BASE_URL}images/goryeo-photos/type-back.jpg`} alt="오목하게 패인 고려 금속활자의 실제 뒷면" loading="lazy" />
      <figcaption>국립중앙박물관 · 덕수 4462 · 공공누리 제1유형 · 사진 크기 조정 · <a href="https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1348&schM=view" target="_blank" rel="noopener noreferrer">원본과 설명 보기</a></figcaption></figure>
    <p>박물관은 뒷면이 타원형으로 오목하게 패여 있다고 설명합니다. 입체 모형은 사진을 참고한 재현입니다.</p>
  </details>;
}
