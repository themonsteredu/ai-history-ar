# National Science Museum: Silla Cheomseongdae

Acquired 2026-09-05 using the museum's publicly offered anonymous download form. No account, phone verification, purchase, viewer extraction, or access-control bypass was used. Files are unchanged provider originals; ZIP contents were only extracted.

## Source and rights

- Official item: https://col.science.go.kr/web/MetaDetail.do?menuIdx=480&metaId=meta_000002989
- Item title: 신라첨성대(新羅瞻星臺), Silla Cheomseongdae.
- Provider/creator: 국립중앙과학관 (National Science Museum). The source credits 정보통신산업진흥원 and 국립중앙과학관; creation date 2015-12-08.
- The item explicitly states KOGL “출처표시+변경금지” (attribution and no derivatives).
- Official KOGL type 3 terms: https://www.kogl.or.kr/info/licenseType3.do
- Those terms expressly allow online/offline sharing and commercial use, require attribution and a source hyperlink where possible, and prohibit modification or derivative works.
- Preserve the source geometry. No decimation, remodeling, texture alterations, or conversion has been performed here.
- Suggested credit: 국립중앙과학관 · 신라첨성대(新羅瞻星臺), 2015 · 공공누리 제3유형(출처표시·변경금지). Link both the item and license.
- This is an officially published heritage model. Do not claim it is a direct scan of the standing monument: that acquisition method was not established by the item metadata.

## Original files

| File | Bytes | Geometry |
| --- | ---: | --- |
| cheomseongdae-original.stl | 178727684 | Binary STL, 3574552 triangles |
| cheomseongdae-original-lowobj.zip | 35658079 | Provider's low-resolution OBJ package |
| cheomseongdae-original-lowobj/LOBJ_2989.OBJ | 44426112 | 299999 vertex records; 599998 triangular faces; 306956 UV records |
| cheomseongdae-original-lowobj/LOBJ_2989.BMP | 50331702 | Original texture |
| cheomseongdae-original-lowobj/LOBJ_2989.mtl | 104 | Original material |

STL SHA-256: `7d3d81c4d44ad8ee22af736a130c0f3348fc481f6941ddfbe0980bab487d139e`

ZIP SHA-256: `48347e2a8e1ec624ff11114b73532d8b5fcbf7415c318eb0631ca164cff2cdcc`

Both formats exceed the app's 12 MB user-upload limit. This verified built-in asset uses a separate loader with expected byte counts. OBJ expands to 1799994 rendered vertices. The original MTL references `LOBJ_2989.bmp`; the loader connects its original BMP texture directly without editing either source.

## Public download form details

POST https://col.science.go.kr/web/MetaFileDown.do

- metaId: meta_000002989
- atchFileId: FILE_000000000002989
- fileSn: 2 for STL, 4 for low-resolution OBJ ZIP
- usePurpsCode: USE_PURPS009 (website)
- usePurpsCn submitted: MOAKIT 학교 역사교육 웹사이트에서 출처를 표시하고 원본 3D 모델을 변경 없이 전시
- Responses: HTTP 200; attachment filename STL_2989.stl and LOBJ_2989.zip respectively.

The public item page identifies the download options and item-specific license.

## Other investigated sources

- Chungnam culture bigdata burner dataset: https://www.bigdata-culture.kr/bigdata/user/data_market/detail.do?id=bc0cc060-4c36-11ec-9c54-b54b4d3d7cd0 — genuine free ZIP_3D dataset includes the Baekje burner, but the download form explicitly requires login. It also says the provider agreement has ended. No download attempted beyond that gate.
- 3DBANK Baekje burner: https://3dbank.xyz/contents/view_contents.jsp?cuid=1000251 — download click handler explicitly requires login. No download attempted beyond that gate.
- The museum source is bundled below. Other heritage items support teacher-supplied GLB/STL files and photo-based AR with the same narration points.

## Website packaging

The app includes the original low-resolution OBJ and BMP as gzip streams in `public/ar/models`. Decompression reproduces the provider originals byte for byte; SHA-256 values are recorded in `cheomseongdae-original-manifest.json`. The small original MTL is included unchanged. Geometry and texture pixels are not simplified, resized, recolored, or remodeled. Display uses the original UV map and a Z-up to Y-up orientation change. This is a published museum model; no claim is made that it is a direct scan of the monument.

The first load transfers about 35.7 MB. The mesh has 599,998 triangles; mobile performance and physical-card tracking still require real-device verification. Students can continue with the photo-and-voice AR when their device cannot load this model.

Choose Cheomseongdae in lesson 9, open the teacher preparation section, and select the official model. Students place two explanation points, record up to 30 seconds per point, and create one visitor question. The exact downloaded recognition photo must be printed without cropping or stretching. Visitors open the saved project in the web app and enable its AR camera. A phone's ordinary camera app does not run the exhibit.

Project exports embed student recordings and uploaded GLB/STL models. The built-in museum model is saved as a stable asset reference and is loaded from the site on each new device; initial access requires internet. Device-local drafts use IndexedDB. Legacy version 1 projects remain readable.

Built-in model credits remain visible and are read-only in the editor. Official license: https://www.kogl.or.kr/info/licenseType3.do
