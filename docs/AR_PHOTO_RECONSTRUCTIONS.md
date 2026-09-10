# Photo-reference reconstructions — 2026-09-10

These five built-in models are newly authored photo-reference teaching reconstructions, **not scans, museum originals, or measured archaeological reconstructions**. Hidden surfaces, chamber layout, relative proportions, ornaments and landscape arrangements are inferred. Do not use the models to count original details or make measurements. Cheomseongdae continues to use the unchanged National Science Museum original documented in AR_MODEL_SOURCES.md.

| Model | What changed | Existing reference photograph |
| --- | --- | --- |
| Muryeong tomb | Worn brick surfaces, cut-away barrel vault, patterned bands, recess and blank inscription stones | [Bernard Gagnon, CC0](https://commons.wikimedia.org/wiki/File:King_Muryeong_Tomb_01.jpg) — a reproduction chamber, not a survey photograph of the sealed tomb |
| Baekje incense burner | Curved mountain ridges, overlapping lotus petals, indicative relief figures, coiled dragon and feathered phoenix | [Gary Todd, CC0](https://commons.wikimedia.org/wiki/File:Baekje_Gilt_Bronze_Incense_Burner,_6th-7th_Cent._(30165906226).jpg) |
| Silla crown | Thin gold plates, punched accents, jade ornaments, hanging discs and chain pendants | [Ismoon, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Royal_Crown_of_Silla._National_Museum_of_Korea.jpg) |
| Goguryeo mural | Existing mural image on a subdivided, slightly uneven plaster surface inside a cut-away room | [Unknown historical artist, public domain](https://commons.wikimedia.org/wiki/File:Goguryeo_tomb_mural.jpg) |
| Gaya tumuli | Uneven earth mounds, grass-covered terrain and footpath | [Visviva, public domain](https://commons.wikimedia.org/wiki/File:Changnyeong_tombs_below.jpg) |

The crown photograph's source and share-alike terms were checked on 2026-09-10. The new rendered crown reconstruction and its photo-mapped surface adaptation are offered under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with photo attribution to Ismoon and reconstruction credit to the ai-history-ar project. This statement concerns the crown reconstruction, not the unrelated application or the separately licensed museum model. The other photo credits match the existing lesson-slide catalogue.

## Implementation and preservation

- `src/lib/ar/photoReconstruction.ts` builds actual three-dimensional geometry. It is not a flat image billboard. The original JPEG files are reused unchanged; UV selections map artifact surface patches onto meshes. The mural uses its full existing image.
- The metal models use locally generated room-light reflections, not an external HDRI or another model service. No new sign-up, API key or paid model service is required.
- Fewer than 60,000 triangles and at most 12 material draw calls per reconstructed artifact are enforced by tests. Only the selected reference photo is loaded, once per mesh load. Geometry-only annotation picking does not request textures.
- Missing texture loads visibly fall back to shape-only mode. The fallback is never described as a successful realistic texture load.
- Existing preset IDs remain valid for saved classroom projects and exports. `reconstruction: photo-reference-v2` marks an upgraded draft. The maker upgrades old supplied presets once, remaps photo-based positions, and retains point IDs, text, recordings, questions, group and other student fields. Custom student-built models are not automatically replaced.
- Students should check migrated point locations and share again from the original group-owner tablet to update previously shared work. No stored database rows are bulk rewritten.
- The maker, individual preview/camera and whole-class camera share the same model loader. The whole-class camera now loads registered presets and the official Cheomseongdae, not only primitive parts. Model geometries, textures, reflection targets and camera resources are released when closed.
- No recognition photographs, compiled targets or printable cards were changed. Existing printed cards remain usable.

## Verification boundary

Unit tests cover all five textured mesh paths, geometry/UV bounds and budgets, offline picking, failed texture loads, and one-time annotation/audio-preserving migrations. Production build and TypeScript must pass before publication. The cloud browser does not provide hardware WebGL/camera verification; real tablet rendering and printed-card tracking still need a device check.
