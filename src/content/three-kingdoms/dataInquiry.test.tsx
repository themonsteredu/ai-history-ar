/// <reference types="node" />

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DataInquiryOverview } from '../../components/DataInquiryOverview';
import { DataInquiryLessonPage } from '../../pages/DataInquiryLessonPage';
import { dataInquiryFiles, dataInquiryPath, dataInquirySessions, dataInquirySlideImage, dataInquirySlides, dataInquiryWorksheet, getDataInquirySession } from './dataInquiry';

describe('Three Kingdoms revised data inquiry integration', () => {
  it('has exactly three sessions and all reviewed slides and downloads', () => {
    expect(dataInquirySessions.map(session => session.id)).toEqual([1, 2, 3]);
    expect(dataInquirySessions.flatMap(session => dataInquirySlides(session.id).map(slide => slide.number))).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
    const assets = [...Object.values(dataInquiryFiles), ...dataInquirySessions.map(session => dataInquiryWorksheet(session.id)), ...Array.from({ length: 28 }, (_, i) => dataInquirySlideImage(i + 1))];
    for (const asset of assets) expect(existsSync(resolve('public', asset.replace(/^\//, ''))), asset).toBe(true);
  });
  it('rejects invalid session IDs and preserves classroom context', () => {
    expect(getDataInquirySession('3abc')).toBeUndefined();
    expect(getDataInquirySession('4')).toBeUndefined();
    expect(dataInquiryPath(2, 'ppt', 'hub_code=CLASS&student_id=student&view=activity')).toBe('/three-kingdoms/data/2?hub_code=CLASS&student_id=student&view=ppt');
  });
  it('makes the new pack visible in the existing teacher flow', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/teacher?hub_code=CLASS']}><DataInquiryOverview teacher /></MemoryRouter>);
    expect(html).toContain('/teacher/three-kingdoms/data/1?hub_code=CLASS');
    expect(html).toContain('/teacher/three-kingdoms/data/3?hub_code=CLASS');
    expect(html).toContain('teaching.pptx');
    expect(html).toContain('student-2.pdf');
  });
  it('shows shared-class CODAP instructions and preserves context on completion', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/three-kingdoms/data/3?view=activity&hub_code=CLASS&student_id=student']}><Routes><Route path="/three-kingdoms/data/:sessionId" element={<DataInquiryLessonPage />} /></Routes></MemoryRouter>);
    expect(html).toContain('모둠별 그래프 대신, 학급 그래프 하나');
    expect(html).toContain('Local File');
    expect(html).toContain('href="/three-kingdoms?hub_code=CLASS&amp;student_id=student"');
    expect(html).toContain('student-3.pdf');
  });
  it('opens the relevant classroom PPT inside the lesson', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/three-kingdoms/data/2?view=ppt']}><Routes><Route path="/three-kingdoms/data/:sessionId" element={<DataInquiryLessonPage />} /></Routes></MemoryRouter>);
    expect(html).toContain('/slide-10.png');
    expect(html).toContain('2차시 수업 PPT');
    expect(html).toContain('전체 화면');
  });
});
