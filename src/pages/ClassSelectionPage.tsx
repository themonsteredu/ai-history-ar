import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import './class-selection.css';

export function ClassSelectionPage() {
  return (
    <div className="class-selection page-width">
      <header className="class-selection__intro">
        <p className="eyebrow">초등학교 5학년 · 역사 탐구</p>
        <h1>어떤 수업을 시작할까요?</h1>
        <p>유물을 살펴보고, 자료를 읽으며 AI의 설명을 함께 확인해요.</p>
      </header>
      <div className="class-selection__grid">
        <article className="class-selection__card class-selection__card--goryeo">
          <p className="class-selection__era">고려 시대</p>
          <h2>고려유물수업</h2>
          <p>친구들의 AR 카드를 살펴보고, OX 문제와 로봇의 답을 근거 자료로 확인해요.</p>
          <Link className="class-selection__link" to="/goryeo">고려유물 탐구실 입장 <Icon name="arrow" size={19} /></Link>
        </article>
        <article className="class-selection__card class-selection__card--joseon">
          <p className="class-selection__era">조선 시대</p>
          <h2>조선 수업</h2>
          <p>세종 때 과학 유물을 AR로 살펴보고, AI의 설명을 검증하며 함께 발표해요.</p>
          <Link className="class-selection__link" to="/joseon/open-class">조선 수업 입장 <Icon name="arrow" size={19} /></Link>
        </article>
      </div>
    </div>
  );
}
