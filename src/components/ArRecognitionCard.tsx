import type { EraId } from "../types/curriculum";
import '../styles/ar-exhibit.css';

export const allArCardsUrl = (eraId: EraId = "three-kingdoms") => `${import.meta.env.BASE_URL}downloads/${eraId}/ar/ar-cards-all.pdf`;

export default function ArRecognitionCard({ heritageId, heritage, eraId = "three-kingdoms" }: { heritageId: number; heritage: string; eraId?: EraId }) {
  const cardUrl = `${import.meta.env.BASE_URL}downloads/${eraId}/ar/ar-card-${String(heritageId).padStart(2, '0')}.pdf`;
  return <aside className="ar-recognition-card" aria-label="전시용 인식 카드 준비">
    <div><strong>전시 책상에 놓을 인식 카드</strong><p>{heritage} 사진을 A4 한 장에 담았어요. 사진 전체가 보이도록 출력해요.</p></div>
    <div className="ar-maker-actions"><a href={cardUrl} download>{heritage} 카드 받기 · A4</a><a href={allArCardsUrl(eraId)} download>유물 6종 한 번에 받기</a></div>
    <p className="ar-help">카드는 유물을 찾는 표지예요. 친구 목소리를 들으려면 해당 모둠이 저장한 작업 파일도 관람 기기에서 열어 주세요.</p>
  </aside>;
}
