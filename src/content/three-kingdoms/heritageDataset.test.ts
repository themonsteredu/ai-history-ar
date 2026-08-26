import { describe, expect, it } from "vitest";
import starterCsv from "../../../public/data/three-kingdoms/heritage-data-starter.csv?raw";
import fullCsv from "../../../public/data/three-kingdoms/heritage-data-full.csv?raw";
import messyCsv from "../../../public/data/three-kingdoms/heritage-data-messy.csv?raw";

const expectedHeader = "모둠코드,유산이름,국가·정치체,자료종류,시기,정확한연도,발견·출토지역,소장·관리기관,확인된사실,자료상태,출처기관,출처URL,확인날짜";
const heritages = ["무령왕릉", "백제 금동대향로", "첨성대", "신라 금관", "고구려 고분벽화", "가야 고분군"];

function parseCsv(content: string) {
  const lines = content.trim().split("\n");
  return { header: lines[0], rows: lines.slice(1).map((line) => line.split(",")) };
}

const datasets = {
  "heritage-data-starter.csv": parseCsv(starterCsv),
  "heritage-data-full.csv": parseCsv(fullCsv),
  "heritage-data-messy.csv": parseCsv(messyCsv),
};

describe("three kingdoms classroom datasets", () => {
  it("keeps the shared class schema in every dataset", () => {
    for (const [fileName, { header, rows }] of Object.entries(datasets)) {
      expect(header, fileName).toBe(expectedHeader);
      for (const row of rows) {
        expect(row, `${fileName}: ${row.join(",")}`).toHaveLength(13);
      }
    }
  });

  it("provides at least ten rows per heritage in the full dataset", () => {
    const { rows } = datasets["heritage-data-full.csv"];
    expect(rows.length).toBeGreaterThanOrEqual(60);
    for (const heritage of heritages) {
      expect(rows.filter((row) => row[1] === heritage).length, heritage).toBeGreaterThanOrEqual(10);
    }
  });

  it("keeps exact years numeric and chartable in the full dataset", () => {
    const { rows } = datasets["heritage-data-full.csv"];
    const years = rows.map((row) => row[5]).filter((value) => value !== "");
    expect(years.length).toBeGreaterThanOrEqual(15);
    for (const year of years) {
      expect(year).toMatch(/^\d{3,4}$/);
    }
  });

  it("seeds the messy dataset with the cleaning problems the lab teaches", () => {
    const { rows } = datasets["heritage-data-messy.csv"];
    const rendered = rows.map((row) => row.join(","));
    expect(new Set(rendered).size, "중복 행").toBe(rows.length - 1);
    expect(rows.some((row) => row[4] === "서기 500년대"), "시기 표기 차이").toBe(true);
    expect(rows.some((row) => row[2] === "신라국" || row[2] === "Silla"), "나라 표기 차이").toBe(true);
    expect(rows.some((row) => /\d년$/.test(row[5])), "연도에 섞인 글자").toBe(true);
    expect(rows.some((row) => row[7] === ""), "빈칸").toBe(true);
  });
});
