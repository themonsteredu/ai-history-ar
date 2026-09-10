import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import ClassroomQr from './ClassroomQr';

it('creates an accessible local QR and SVG download without requiring a student login', () => {
  const html = renderToStaticMarkup(<ClassroomQr initialCode="class26" />);
  expect(html).toContain('학생 입장 QR 생성'); expect(html).toContain('수업코드 class26 학생 입장 QR');
  expect(html).toContain('data:image/svg+xml'); expect(html).toContain('AR_수업입장_class26.svg');
  expect(html).toContain('hub_code=class26'); expect(html).toContain('숫자 수업코드를 입력하면 자동 저장');
  expect(html).not.toContain('<img'); // No external QR rendering request.
});
it('does not display a misleading QR for invalid or missing codes', () => {
  const html = renderToStaticMarkup(<ClassroomQr initialCode="" />);
  expect(html).toContain('4~12자리'); expect(html).not.toContain('<svg');
});
