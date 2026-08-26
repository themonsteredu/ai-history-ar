import fullCsv from "../../../public/data/three-kingdoms/heritage-data-full.csv?raw";

export interface HeritageDatasetRow {
  group: string;
  heritage: string;
  kingdom: string;
  sourceType: string;
  era: string;
  exactYear: number | null;
  region: string;
  institution: string;
  fact: string;
  status: string;
  sourceOrg: string;
}

function parseRows(content: string): readonly HeritageDatasetRow[] {
  return content
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const cells = line.split(",");
      return {
        group: cells[0],
        heritage: cells[1],
        kingdom: cells[2],
        sourceType: cells[3],
        era: cells[4],
        exactYear: cells[5] === "" ? null : Number(cells[5]),
        region: cells[6],
        institution: cells[7],
        fact: cells[8],
        status: cells[9],
        sourceOrg: cells[10],
      };
    });
}

export const heritageDatasetRows = parseRows(fullCsv);

export function regionGroup(region: string) {
  if (region.startsWith("북한과 중국")) return "북한·중국 동북 지역";
  if (region.startsWith("영남")) return "영남·호남 여러 지역";
  if (region.startsWith("충청남도")) return "충청남도";
  if (region.startsWith("경상북도")) return "경상북도";
  if (region.startsWith("경상남도")) return "경상남도";
  if (region.startsWith("전북")) return "전북";
  if (region.startsWith("북한")) return "북한";
  if (region.startsWith("중국")) return "중국";
  return region;
}

export interface ChartDatum {
  label: string;
  value: number;
}

export function countRowsBy(pick: (row: HeritageDatasetRow) => string): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const row of heritageDatasetRows) {
    const label = pick(row);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "ko"));
}

export function foldSmallCategories(data: ChartDatum[], keep: number, restLabel: string): ChartDatum[] {
  if (data.length <= keep + 1) return data;
  const kept = data.slice(0, keep);
  const rest = data.slice(keep).reduce((sum, item) => sum + item.value, 0);
  return [...kept, { label: restLabel, value: rest }];
}
