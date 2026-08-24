from __future__ import annotations

import json
import shutil
from pathlib import Path
from zipfile import ZipFile

import pypdfium2 as pdfium
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
FINAL_DIR = ROOT / "output" / "pdf"
PUBLIC_DIR = ROOT / "public" / "downloads"
RENDER_DIR = ROOT / "work" / "pdf-check"

A4 = (595, 842)
A4_LANDSCAPE = (842, 595)
A6 = (298, 420)
A5 = (420, 595)


def page_size(page) -> tuple[int, int]:
    return round(float(page.mediabox.width)), round(float(page.mediabox.height))


def page_uses_score_dream(page) -> bool:
    resources = page.get("/Resources")
    if not resources or "/Font" not in resources:
        return False
    fonts = resources["/Font"].get_object()
    for reference in fonts.values():
        base_font = str(reference.get_object().get("/BaseFont", ""))
        if "S-CoreDream" in base_font:
            return True
    return False


def assert_pdf(path: Path, expected_size: tuple[int, int]) -> dict[str, int]:
    if path.stat().st_size < 10_000 or path.read_bytes()[:4] != b"%PDF":
        raise AssertionError(f"PDF signature or size is invalid: {path}")

    reader = PdfReader(path)
    if not reader.pages:
        raise AssertionError(f"PDF has no pages: {path}")

    for index, page in enumerate(reader.pages, start=1):
        if page_size(page) != expected_size:
            raise AssertionError(f"Unexpected page size in {path}, page {index}: {page_size(page)}")
        if not page_uses_score_dream(page):
            raise AssertionError(f"S-Core Dream is not embedded in {path}, page {index}")
        if len(page.extract_text() or "") < 20:
            raise AssertionError(f"Page appears blank in {path}, page {index}")

    public_path = PUBLIC_DIR / path.relative_to(FINAL_DIR)
    if public_path.read_bytes() != path.read_bytes():
        raise AssertionError(f"Public copy differs from final artifact: {path}")

    return {"pages": len(reader.pages), "bytes": path.stat().st_size}


def render_page(pdf_path: Path, page_index: int, output_name: str) -> None:
    document = pdfium.PdfDocument(pdf_path)
    page = document[page_index]
    image = page.render(scale=1.65).to_pil()
    image.save(RENDER_DIR / output_name, optimize=True)
    page.close()
    document.close()


def main() -> None:
    manifest = json.loads((FINAL_DIR / "manifest.json").read_text(encoding="utf-8"))
    pdf_paths = sorted(FINAL_DIR.glob("*/*.pdf"))
    lesson_zips = sorted(FINAL_DIR.glob("*/lesson-*-all.zip"))
    era_zips = sorted(FINAL_DIR.glob("*/*-all-materials.zip"))

    if len(pdf_paths) != 60 or len(lesson_zips) != 20 or len(era_zips) != 2:
        raise AssertionError(
            f"Unexpected artifact counts: PDFs={len(pdf_paths)}, lesson ZIPs={len(lesson_zips)}, era ZIPs={len(era_zips)}"
        )

    results = {}
    for path in pdf_paths:
        lesson_id = int(path.name.split("-")[1])
        is_student = path.name.endswith("-student.pdf")
        expected_size = A4_LANDSCAPE if is_student and lesson_id in (7, 10) else A4
        results[str(path.relative_to(FINAL_DIR))] = assert_pdf(path, expected_size)
        if is_student and results[str(path.relative_to(FINAL_DIR))]["pages"] != 1:
            raise AssertionError(f"Student lesson must be exactly one page: {path}")

    for path in lesson_zips:
        with ZipFile(path) as archive:
            names = archive.namelist()
            if len(names) != 3 or not any(name.endswith("student.pdf") for name in names) or not any(name.endswith("teacher.pdf") for name in names) or not any(name.endswith("answer.pdf") for name in names):
                raise AssertionError(f"Lesson ZIP contents are invalid: {path}")

    for path in era_zips:
        with ZipFile(path) as archive:
            if len(archive.namelist()) != 30:
                raise AssertionError(f"Era ZIP must contain 30 PDFs: {path}")

    if set(manifest.get("eras", {})) != {"three-kingdoms", "joseon"}:
        raise AssertionError("Manifest is missing an era")

    if RENDER_DIR.exists():
        shutil.rmtree(RENDER_DIR)
    RENDER_DIR.mkdir(parents=True)
    for era_id in ("three-kingdoms", "joseon"):
        for lesson_id in range(1, 11):
            render_page(
                FINAL_DIR / era_id / f"lesson-{lesson_id:02d}-student.pdf",
                0,
                f"{era_id}-lesson-{lesson_id:02d}-student.png",
            )
    render_page(FINAL_DIR / "three-kingdoms" / "lesson-01-teacher.pdf", 0, "three-kingdoms-lesson-01-teacher.png")
    render_page(FINAL_DIR / "three-kingdoms" / "lesson-06-teacher.pdf", 8, "three-kingdoms-lesson-06-answers.png")
    render_page(FINAL_DIR / "three-kingdoms" / "lesson-01-answer.pdf", 0, "three-kingdoms-lesson-01-answer.png")
    render_page(FINAL_DIR / "joseon" / "lesson-04-answer.pdf", 0, "joseon-lesson-04-answer.png")

    total_pages = sum(item["pages"] for item in results.values())
    total_bytes = sum(item["bytes"] for item in results.values())
    print(json.dumps({
        "ok": True,
        "pdfs": len(pdf_paths),
        "lessonZips": len(lesson_zips),
        "eraZips": len(era_zips),
        "pages": total_pages,
        "pdfBytes": total_bytes,
        "renders": len(list(RENDER_DIR.glob("*.png"))),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
