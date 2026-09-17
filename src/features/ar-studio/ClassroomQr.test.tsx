import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import ClassroomQr from './ClassroomQr';

it('creates an accessible local QR and SVG download without requiring a student login', () => {
  const html = renderToStaticMarkup(<ClassroomQr code="class26" onCode={() => {}} />);
  expect(html).toContain('학생 입장 QR 생성'); expect(html).toContain('수업코드 class26 학생 입장 QR');
  expect(html).toContain('data:image/svg+xml'); expect(html).toContain('AR_수업입장_관람_class26.svg');
  expect(html).toContain('hub_code=class26'); expect(html).toContain('자동 저장');
  expect(html).not.toContain('<img'); // No external QR rendering request.
});
it('offers the visiting screen first so a visiting-day QR never opens the making tools', () => {
  const html = renderToStaticMarkup(<ClassroomQr code="class26" onCode={() => {}} />);
  expect(html).toContain('ar-visit?hub_code=class26');
  expect(html).not.toContain('ar-maker');
  expect(html).toContain('관람·퀴즈 화면'); expect(html).toContain('작품 만들기 화면');
});
it('does not display a misleading QR for invalid or missing codes', () => {
  const html = renderToStaticMarkup(<ClassroomQr code="" onCode={() => {}} />);
  expect(html).toContain('4~12자리'); expect(html).not.toContain('<svg');
});
it('keeps the compact QR to the toggle, the code and two actions', () => {
  const html = renderToStaticMarkup(<ClassroomQr code="class26" compact onCode={() => {}} />);
  expect(html).toContain('<svg'); expect(html).toContain('링크 복사'); expect(html).toContain('이미지 받기');
  expect(html).not.toContain('<input'); expect(html).not.toContain('자동 저장');
});
