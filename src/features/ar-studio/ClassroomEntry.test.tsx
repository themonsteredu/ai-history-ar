import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ClassroomEntry } from './ClassroomEntry';
const noop = () => {};
const props = { inputCode: '', name: '', joinGroup: 1, disabled: false, onInputCode: noop, onName: noop, onJoinGroup: noop, onJoin: noop, onGallery: noop };
it('exposes class entry without opening a disclosure or logging into another service', () => {
  const html = renderToStaticMarkup(<ClassroomEntry {...props} />);
  expect(html).toContain('수업코드로 입장'); expect(html).toContain('수업 입장');
  expect(html).not.toContain('<details'); expect(html).toContain('6모둠');
  expect(html).toContain('https://hub.moakit.ai/app'); expect(html).toContain('수업허브 열기');
});
it('gives joined students a direct all-group gallery action', () => {
  const html = renderToStaticMarkup(<ClassroomEntry {...props} session={{ code: 'test01', group: 2, memberId: 'id', token: 'private-token', name: '테스트' }} />);
  expect(html).toContain('우리 반 작품 보기'); expect(html).toContain('test01 · 2모둠 · 테스트');
  expect(html).not.toContain('private-token'); expect(html).not.toContain('<form');
});
