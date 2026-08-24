import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDirectory = process.cwd();
const targetDirectory = path.join(rootDirectory, "tmp", "pdfs");
const sourceDirectory = path.join(rootDirectory, "src", "content");

function defineLesson(lesson) {
  const phase = lesson.id <= 3 ? "의심하기" : lesson.id <= 7 ? "확인하고 만들기" : "해설사 되기";
  return { ...lesson, phase, slug: String(lesson.id).padStart(2, "0") };
}

async function readExportedArray(relativePath, exportName) {
  const source = await readFile(path.join(sourceDirectory, relativePath), "utf8");
  const executable = source
    .replace(/^import[^;]+;\s*$/gm, "")
    .replace(`export const ${exportName}`, `const ${exportName}`)
    .replace(/\s+as const satisfies readonly [A-Za-z]+\[\];?\s*$/m, ";");
  return Function("defineLesson", `${executable}\nreturn ${exportName};`)(defineLesson);
}

const [threeKingdomsLessons, threeKingdomsGroups, joseonLessons, joseonGroups] = await Promise.all([
  readExportedArray(path.join("three-kingdoms", "lessons.ts"), "threeKingdomsLessons"),
  readExportedArray(path.join("three-kingdoms", "groups.ts"), "threeKingdomsGroups"),
  readExportedArray(path.join("joseon", "lessons.ts"), "joseonLessons"),
  readExportedArray(path.join("joseon", "groups.ts"), "joseonGroups"),
]);

const eras = [
  {
    id: "three-kingdoms",
    shortName: "삼국시대",
    title: "삼국시대 문화유산 AI 해설사",
    coreQuestion: "1500년 전 이야기, AI는 어떻게 알고 있을까?",
    verificationLabel: "검증 5단계",
    verificationSteps: ["출처", "시기", "교차", "원본", "보류"],
    lessons: threeKingdomsLessons,
    groups: threeKingdomsGroups,
  },
  {
    id: "joseon",
    shortName: "조선시대",
    title: "조선시대 문화유산 AI 해설사",
    coreQuestion: "우리가 아는 조선, 정말 그랬을까?",
    verificationLabel: "검증 4단계",
    verificationSteps: ["출처", "시기", "교차", "원본"],
    lessons: joseonLessons,
    groups: joseonGroups,
  },
];

await mkdir(targetDirectory, { recursive: true });
await writeFile(
  path.join(targetDirectory, "curriculum.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), eras }, null, 2),
  "utf8",
);

console.log(`Exported ${eras.length} eras and ${eras.reduce((sum, era) => sum + era.lessons.length, 0)} lessons.`);
