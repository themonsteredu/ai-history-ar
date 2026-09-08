import type { CellValue } from 'exceljs';
import type { ResearchRecord } from '../content/three-kingdoms/project';

const categories: Record<string, ResearchRecord['category']> = {
  '언제·어디': '시기·발견', '재료·만드는 방법': '재료·구조', '생김새': '모양·장면', '쓰임·생활': '사용·생활',
  '시기·발견': '시기·발견', '재료·구조': '재료·구조', '모양·장면': '모양·장면', '사용·생활': '사용·생활',
};
function text(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (typeof value === 'object' && 'richText' in value) return value.richText.map(part => part.text).join('').trim();
  throw new Error('표에는 수식이나 그림 대신 낱말이나 짧은 문장을 직접 써 주세요.');
}
export async function readExcelTable(buffer: ArrayBuffer): Promise<ResearchRecord[]> {
  if (buffer.byteLength > 2_000_000) throw new Error('2MB 이하의 Excel 활동 파일을 골라 주세요.');
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); } catch { throw new Error('Excel 통합 문서(.xlsx) 파일을 열 수 없어요. 저장한 파일을 다시 골라 주세요.'); }
  const sheet = workbook.getWorksheet('우리 표') || workbook.worksheets[0];
  if (!sheet) throw new Error('표가 있는 시트를 찾지 못했어요.');
  let header = 0, contentColumn = 0, categoryColumn = 0;
  for (let row = 1; row <= Math.min(sheet.rowCount, 20); row++) {
    const cells = Array.from({ length: 20 }, (_, col) => {
      const value = sheet.getCell(row, col + 1).value;
      return typeof value === 'string' ? value.trim() : '';
    });
    const content = cells.indexOf('내가 정리한 내용'), category = cells.indexOf('어떤 이야기?');
    if (content >= 0 && category >= 0) { header = row; contentColumn = content + 1; categoryColumn = category + 1; break; }
  }
  if (!header) throw new Error('첫 줄에 ‘내가 정리한 내용’과 ‘어떤 이야기?’가 있는 표를 골라 주세요.');
  if (sheet.rowCount > 1000) throw new Error('활동에 쓴 표만 담긴 파일을 골라 주세요. 내용은 60줄까지 가져올 수 있어요.');
  const records: ResearchRecord[] = [];
  for (let row = header + 1; row <= sheet.rowCount; row++) {
    const content = text(sheet.getCell(row, contentColumn).value);
    const categoryText = text(sheet.getCell(row, categoryColumn).value);
    if (!content && !categoryText) continue;
    if (!content) throw new Error(`${row}행의 ‘내가 정리한 내용’을 써 주세요.`);
    const category = Object.entries(categories).find(([label]) => label.replace(/\s/g, '') === categoryText.replace(/\s/g, ''))?.[1];
    if (!category) throw new Error(`${row}행의 ‘어떤 이야기?’에서 네 가지 종류 중 하나를 골라 주세요.`);
    if (content.length > 1000) throw new Error(`${row}행의 내용을 1,000자 안으로 줄여 주세요.`);
    records.push({ id: `excel-${row}`, text: content, category, status: '확인됨', source: '선생님 자료', url: '', providedByTeacher: true });
  }
  if (!records.length) throw new Error('아직 빈 표예요. Excel에서 내용을 쓰고 저장한 뒤 가져와 주세요.');
  if (records.length > 60) throw new Error('내용은 60줄까지 가져올 수 있어요.');
  return records;
}
