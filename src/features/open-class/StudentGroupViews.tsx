import { useState, type ReactNode } from 'react';
import type { OpenItem } from './api';
import type { GroupCard } from './model';
import { CardGallery } from './CardGallery';

/** Observing another group never changes the entry session or the editing group's drafts. */
export function StudentGroupViews({ cards, group, era, children }: {
  cards: OpenItem<GroupCard>[]; group: number; era: 'joseon' | 'goryeo'; children: ReactNode;
}) {
  const [gallery, setGallery] = useState(false);
  return <>
    <nav className="oc-student-menus" aria-label="모둠 활동 메뉴">
      <button type="button" aria-pressed={!gallery} onClick={() => setGallery(false)}>우리 모둠 활동 · {group}모둠</button>
      <button type="button" aria-pressed={gallery} onClick={() => setGallery(true)}>전체 모둠 AR 카드 보기</button>
    </nav>
    {/* Keep the editor mounted so viewing cards preserves unsaved text and the current step. */}
    <div hidden={gallery}>{children}</div>
    {gallery && <section className="oc-panel" aria-label="전체 모둠 AR 카드 보기">
      <h2>전체 모둠 AR 카드 보기</h2>
      <p>다른 모둠 카드는 보기만 할 수 있어요. 수정과 저장은 입장한 {group}모둠에서만 할 수 있어요.</p>
      <CardGallery era={era} cards={cards} myGroup={group} showAllGroups />
      <button type="button" onClick={() => setGallery(false)}>우리 모둠 활동으로 돌아가기</button>
    </section>}
  </>;
}
