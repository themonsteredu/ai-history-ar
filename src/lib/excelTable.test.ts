/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { readExcelTable } from './excelTable';
import { newProject, parseProject, summarizeRecords, updateRecords } from '../content/three-kingdoms/project';

async function template() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(await readFile('public/downloads/lesson-04-excel.xlsx')).buffer);
  return workbook;
}
describe('real Excel table import', () => {
  it('reads typed cells from the actual activity file, skips blank rows and instructions, and persists graph counts', async () => {
    const workbook = await template(), sheet = workbook.getWorksheet('우리 표')!;
    sheet.getCell('B2').value = '벽돌'; sheet.getCell('C2').value = '재료·만드는 방법';
    sheet.getCell('B4').value = '금동신발'; sheet.getCell('C4').value = '쓰임·생활';
    sheet.addTable({ name: 'StudentTable', ref: 'A1', headerRow: true, columns: [{ name: '번호' }, { name: '내가 정리한 내용' }, { name: '어떤 이야기?' }], rows: [[1,'벽돌','재료·만드는 방법'],[2,'금동신발','쓰임·생활']] });
    sheet.getCell('B4').value = null; sheet.getCell('C4').value = null;
    const records = await readExcelTable(await workbook.xlsx.writeBuffer());
    expect(records.map(row => row.text)).toEqual(['벽돌','금동신발']);
    const project = parseProject(JSON.stringify(updateRecords(newProject(), records)));
    expect(summarizeRecords(project).map(row => row.count)).toEqual([0,1,0,1]);
  });
  it('rejects an empty template, partial rows and formulas instead of silently losing work', async () => {
    const workbook = await template(), sheet = workbook.getWorksheet('우리 표')!;
    await expect(readExcelTable(await workbook.xlsx.writeBuffer())).rejects.toThrow('빈 표');
    sheet.getCell('B2').value = '벽돌';
    await expect(readExcelTable(await workbook.xlsx.writeBuffer())).rejects.toThrow('2행');
    sheet.getCell('C2').value = '생김새'; sheet.getCell('B2').value = { formula: '1+1', result: 2 };
    await expect(readExcelTable(await workbook.xlsx.writeBuffer())).rejects.toThrow('수식');
  });
  it('rejects damaged or oversized files', async () => {
    await expect(readExcelTable(new ArrayBuffer(5))).rejects.toThrow('열 수 없어요');
    await expect(readExcelTable(new ArrayBuffer(2_000_001))).rejects.toThrow('2MB');
  });
});
