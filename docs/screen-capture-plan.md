# Plan — Screen capture activity10 (16:9) + map เข้า playthrough-10x

สถานะ: **แผนเท่านั้น — ยังไม่เขียนโค้ด** (update 2026-11-05)

## Decisions (ยืนยันกับผู้ใช้แล้ว)

| เรื่อง | เลือก |
|---|---|
| Source of truth | **`activity10/playthrough-10x.html` → `ACTS`** (graph nodes `t:"s"/"j"` ที่มี `p`) — 111 หน้า ครบทุกไฟล์ |
| เปิดหน้า | ใช้ **`stepUrl(n)` ของ playthrough** (`prepareCase` → `?id=<case>&role=<n.r>`) = ภาพตรงกับที่คนคลิกจาก playthrough |
| หน่วยภาพ | **ต่อ node** (หน้าเดียวกันหลาย node เช่น `02-board-intake` ใน 10.1+10.2, `01-work-inbox` r1/r2 → ถ่ายแยก) |
| Frame | viewport **1920×1080** เห็น shell — scroll ให้ `.form-card` แรกชิดบน |
| ฟอร์มยาว | แยก `_01`, `_02` … ทุกภาพ 16:9 |
| State | ไม่พิมพ์ข้อมูล (ข้อมูลเคสมาจาก prepareCase) |
| Radio ตัดสินใจ | ถ่าย **ทุก choice** suffix `__<value>` |
| Modal | ไม่ถ่าย |
| Output | PNG + thumb |
| Playthrough UI | **ทั้ง 3**: thumb ในแถว step list · hover node บน mermaid → preview · ปุ่ม «ดูภาพ» |
| ไฟล์ที่แก้ | `playthrough-10x.html` เท่านั้น (ไม่แตะ `playthrough-mismatch.html`) |
| หน้านอก playthrough | ถ่ายแต่ไม่ map: `board-report`, `dasdbord`, `login`, `notices`, `registry`, `search-case`, `verdict-form` |
| ข้าม | `_bootstrap`, `design-system`, `index`, `playthrough-*`, `walkthrough-10-3`, `_backup-*` |

## Architecture

```
playthrough-10x.html ──(expose)──> window.PLAYTHROUGH = { ACTS, stepUrl, nodeKey }
        ▲                                        │
        │ <script src="screenshots/manifest.js"> │ Playwright อ่าน
        │                                        ▼
screenshots/manifest.js  <──writes── video/tools/capture-screens.js ──> screenshots/<act>/*.png
```

- `file://` fetch JSON ไม่ได้ → manifest เป็น **`.js`**: `window.SHOT_MANIFEST = { "<nodeKey>": {...} }`
- เก็บใน **`activity10/screenshots/`** → relative link ใช้ได้ทั้ง local + GitHub Pages (เหมือน stepUrl)

### nodeKey (คงที่ ไม่ขึ้นกับลำดับ graph)
`<act.id>.<graph.key || graphIndex>.<nodeId>` เช่น `103.103verdict.v06`, `101.0.a02`

### manifest entry (ตัวอย่าง synthetic)
```js
"103.103verdict.v06": {
  page: "10-3v-06-legal-director-decide.html", role: "dir_legal", caseId: "DEMO-xxx/2569",
  shots: [
    { branch: null,      part: 1, file: "103/v06_10-3v-06-legal-director-decide_01.png", thumb: "103/v06_10-3v-06-legal-director-decide_01.thumb.jpg" },
    { branch: "dismiss", part: 1, label: "ยกฟ้อง ไม่มีผู้อุทธรณ์", file: "103/v06_..__dismiss_01.png", thumb: "..." },
  ],
  capturedAt: "2026-11-05T10:00:00+07:00", errors: []
}
```

### Naming
`activity10/screenshots/<act.id>/<nodeId>_<page-basename>[__<radio-value>]_<NN>.png` + `.thumb.jpg` (480×270)
หน้านอก playthrough → `activity10/screenshots/other/<page-basename>_<NN>.png`

## Steps

### A. playthrough-10x.html — expose (เล็ก)
1. ท้าย script: `window.PLAYTHROUGH = { ACTS, stepUrl, nodeKey }` + function `nodeKey(act, g, gi, id)`
2. `<script src="screenshots/manifest.js" onerror="window.SHOT_MANIFEST={}">` ก่อน main script — ไม่มีไฟล์ = UI ไม่พัง

### B. capture script `video/tools/capture-screens.js`
1. Playwright (มีใน `video/` แล้ว) viewport 1920×1080, เปิด `file://…/activity10/playthrough-10x.html`
2. **Reset data** ก่อนเริ่ม: `Activity10.resetData()` (prepareCase สร้างเคส `DEMO-*` ทิ้งไว้)
3. วน ACTS → graphs → nodes ที่มี `p`: `url = PLAYTHROUGH.stepUrl(n)` (รันใน context playthrough → prepareCase เขียน localStorage origin เดียวกัน)
4. `goto(url)` → รอ load + font → หา `.form-card` แรก → scroll ชิดบน (offset header) → ถ่าย `_01`; ถ้าเกิน: scroll ทีละ (1080 − header − 80) จนถึง `.form-actions`
5. Radio: แต่ละ radio group ในฟอร์มหลัก × แต่ละ option → click → ถ้า modal เด้ง Esc → ถ่ายชุดใหม่ `__<value>` · label จาก `<label>` เก็บใน manifest
6. Thumb: เปิด PNG ใน page ว่าง `<img width=480>` → screenshot jpg q70
7. Error/console error ต่อ node → `errors[]` ใน manifest (ไม่หยุดทั้งรอบ)
8. เขียน `manifest.js` + `screenshots/index.md` (act · node · page · role · branch · จำนวนภาพ)
9. ถ่าย 7 หน้านอก playthrough → `other/` (role default)
10. CLI: `node tools/capture-screens.js [act] [nodeId]` — ถ่ายซ่อมรายตัวได้ (merge manifest); เพิ่ม script `capture` ใน `video/package.json`

### C. playthrough-10x.html — UI
1. **Step list row** (`listHtml`): ถ้ามี `SHOT_MANIFEST[key]` → thumb 16:9 (120×68, `loading="lazy"`) ซ้ายปุ่ม «เปิดหน้า» + ปุ่ม **«ดูภาพ (N)»**
2. **Lightbox** (overlay เดียวทั้งหน้า): ภาพเต็ม, tab branch (ค่าเริ่ม/แต่ละ choice), ←/→ ทีละ part, Esc ปิด, ลิงก์ «เปิด PNG เต็ม» (new tab), caption = `n.l` + role + page
3. **Hover node mermaid**: ต่อยอด `bindHover()` เดิม → floating card thumb ภาพแรก (delay ~250ms), click node ยังเปิดหน้าเหมือนเดิม
4. Node ไม่มีภาพ → ไม่แสดง thumb/ปุ่ม
5. ใช้สี/token เดิมของไฟล์ · keyboard ได้ (lightbox `role="dialog"`, focus trap)

### D. Verify
- manifest key = จำนวน node ที่มี `p` ใน ACTS; ทุก PNG 1920×1080
- เปิด playthrough ใน browser pane: thumb ขึ้น, hover node ขึ้น preview, lightbox เปลี่ยน branch/part ได้, console ไม่มี error
- ลบ manifest.js → playthrough ยังใช้ได้ปกติ

## Risks
- `prepareCase` return null → หน้าเปล่า → flag ใน `errors[]`
- Radio ซ้อน radio → จำนวนภาพระเบิด
- Hover preview ชน highlight เดิมของ `bindHover()` → อ่านโค้ดก่อนต่อ
- ขนาด: ~111 node × (1 + branch) × parts × ~300KB → 50–150MB → ถ้า push GitHub Pages อาจต้อง jpg ภาพเต็ม
- font ไทย Google Fonts → ต้องมี internet ตอนรัน

## Answered
- **Commit ภาพเข้า git** (PNG + thumb + manifest.js) — ถ้ารวมเกิน ~100MB ถามก่อนเปลี่ยนภาพเต็มเป็น JPG
- **Index ทั้ง `.md` และ `.xlsx`**: `activity10/screenshots/index.md` + `activity10/screenshots/index.xlsx`
  - xlsx columns: act · graph · nodeKey · step label · page · role · caseId · branch · branch label · part · file (hyperlink) · thumb · errors
  - 1 แถว = 1 ภาพ · sheet `summary` (ต่อ node: จำนวนภาพ, errors) · freeze header + autofilter
  - สร้างด้วย `exceljs` (devDependency ใหม่ใน `video/`) จากข้อมูลเดียวกับ manifest

- **Radio ซ้อนชั้น: 1 ชั้น** — ทุก choice ของ group ชั้นบนสุด, group ชั้นในใช้ค่า default/แรก

สถานะ: **เริ่ม build แล้ว** (2026-11-05)
