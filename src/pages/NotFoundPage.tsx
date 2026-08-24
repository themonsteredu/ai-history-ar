import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function NotFoundPage() {
  return (
    <section className="not-found page-width">
      <span>404</span>
      <p className="eyebrow">찾을 수 없는 기록</p>
      <h1>이 페이지는 아직 역사책에 없습니다.</h1>
      <p>주소를 다시 확인하거나 시대 선택 화면으로 돌아가 주세요.</p>
      <Link className="button button--primary" to="/">과정 선택으로 <Icon name="arrow" size={18} /></Link>
    </section>
  );
}
