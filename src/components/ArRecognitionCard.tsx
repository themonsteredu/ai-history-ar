import type { EraId } from "../types/curriculum";
import '../styles/ar-exhibit.css';

export const allArCardsUrl = (eraId: EraId = "three-kingdoms") => `${import.meta.env.BASE_URL}downloads/${eraId}/ar/ar-cards-all.pdf`;

export default function ArRecognitionCard({ heritageId, heritage, eraId = "three-kingdoms", shared = false, example = false }: { heritageId: number; heritage: string; eraId?: EraId; shared?: boolean; example?: boolean }) {
  const cardUrl = `${import.meta.env.BASE_URL}downloads/${eraId}/ar/ar-card-${String(heritageId).padStart(2, '0')}.pdf`;
  return <aside className="ar-recognition-card" aria-label="전시용 인식 카드 준비">
    <div><strong>전시 책상에 놓을 인식 카드</strong><p>{heritage} 사진을 A4 한 장에 담았어요. 사진 전체가 보이도록 출력해요.</p></div>
    <div className="ar-maker-actions"><a href={cardUrl} download>{heritage} 카드 받기 · A4</a><a href={allArCardsUrl(eraId)} download>유물 6종 한 번에 받기</a></div>
    <p className="ar-help">{example ? '예제 작품이 준비되어 있어요. 이 카드를 출력하고 카메라 AR을 켜서 비춰 주세요.' : shared ? '수업코드로 입장하면 제출된 모둠 작품과 목소리를 불러와요. 출력한 유물 카드를 비춰 주세요.' : '카드는 유물을 찾는 표지예요. 친구 목소리를 들으려면 해당 모둠이 저장한 작업 파일도 관람 기기에서 열어 주세요.'}</p>
  </aside>;
}
