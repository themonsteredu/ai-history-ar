# QR Code encoder

Project Nayuki, QR Code generator library, TypeScript version.

- Source: https://github.com/nayuki/QR-Code-generator/blob/8329a7108fc22be3e1eec0a9f9318978579e3621/typescript-javascript/qrcodegen.ts
- Upstream file revision: `8329a7108fc22be3e1eec0a9f9318978579e3621`
- Retrieved: 2026-09-10
- License: MIT; full notice retained at the top of `nayuki.ts`.
- Local changes: trailing whitespace stripped; an ESM export appended. No algorithm changes.

Only the QR panel lazy-loads this encoder. QR payloads contain the fixed public production AR-maker URL and a normalized existing Hub participation code. They never contain a student name, group, saved recording or authentication token. QR creation and SVG download use local browser computation, with no third-party QR service.
