# Task List — 10-2-xx Form Field Changes

---

## NEW TASK (added 2026-09-03) — Show attached documents on every 10-2-xx page

**Status: IMPLEMENTED — verified in-browser (2026-09-03).**

**Decisions (confirmed by user):** placement inside the existing case-detail card; read/download = mock toast (same convention as `07-group-director-approval.html`); scope = all 8 pages.

**Implementation note — 2 of the 8 pages needed a different placement:** `10-2-07-secretariat-resolution-doc.html` and `10-2-08-legal-director-propose.html` turned out **not to have** the shared "รายละเอียดคำขอเปิดเผยข้อมูลข่าวสาร" read-only card at all (their `populateCommon()` already calls `setText("f_title", ...)` etc., but those element IDs don't exist in their markup — pre-existing dead code, not something this change introduced). For those two pages only, the attachment list was placed in its own small standalone card ("เอกสารแนบประกอบคำร้อง"), right after the page's intro note and before its first content card, instead of inside a non-existent shared card. The other 6 pages got it inside the existing shared card as originally planned.

**What shipped:**
- `ECMIS102.renderAttachments(containerId, fileNames)` and `ECMIS102.mockOpenFile(name)` added to `activity10/assets/ecmis-10-2.js` — renders a paperclip-icon + filename row per attachment with a "ดาวน์โหลด" button (mock `Swal` toast, no real file bytes exist in this static mockup), plus an "ไม่มีเอกสารแนบ" empty state.
- `.l2-attachment-row` / `.l2-attachment-name` styles added to `activity10/assets/ecmis-10-2.css`.
- All 8 pages (`10-2-01` through `10-2-08`) call `ECMIS102.renderAttachments("f_attachments", c.attachmentFileNames)` inside their existing `populateCommon()`, and each has a `<div id="f_attachments">` in its markup (inside the shared card for 01–06, in a new standalone card for 07–08).

**Verified:** started the local static server, seeded a synthetic case with `attachmentFileNames: ["สำเนาบัตรประชาชน.pdf", "หนังสือมอบอำนาจ.docx"]`, loaded `10-2-01`, confirmed both files render with the paperclip icon and download button, clicked download and confirmed the mock toast ("เปิดไฟล์ สำเนาบัตรประชาชน.pdf...") appears, no console errors. Confirmed via `grep` that all 8 pages have exactly one `renderAttachments` call and one `id="f_attachments"` element each. Test data was reset afterward (`Activity10.resetData()` — browser-local only, no files touched).

**User's request (verbatim):** "for all 10-2-xxxx.html there is attached document files (see in 02-xxxx.html) all page must show it in detail of the page (read download) too"

**Investigation so far:**
- `02-board-intake.html` is where the officer uploads supporting files for a disclosure request (`disclosureAttachedFiles`, an upload-with-preview UI at [02-board-intake.html:1131](../02-board-intake.html) with add/remove, size-limit note, etc.). On save it writes only the **filenames** onto the case: `attachmentFileNames: disclosureAttachedFiles.map(f => f.name)` ([02-board-intake.html:1640](../02-board-intake.html)) — actual file contents/blobs are never persisted (this is a static mockup with no backend/file storage), so only names survive page reloads.
- Confirmed via repo-wide search: **no other page reads `attachmentFileNames`** — none of the 8 `10-2-0*.html` pages display it anywhere today. So once a case moves past intake, nobody in the 10.2 flow can see what was originally attached.
- A visual precedent for a read-only "attached file + download" row already exists elsewhere in this codebase, in `07-group-director-approval.html` (a *different* activity, 10.1) — a bordered row with a paperclip icon + filename + a "ดาวน์โหลดร่าง" button whose `onclick` just shows a `Swal.fire({icon:'info', title:'เปิดไฟล์...'})` toast, since there's nothing real to download. This is the established "mock download" convention in the codebase.
- Separately, several 10-2-xx pages (03, 04, 05, 08) already have their **own** unrelated file-upload fields for that step's own report/draft (e.g. `#in_opinionFile` on 10-2-03) — those are NOT the original intake attachments and are out of scope here; they stay as-is.

**Proposed approach (pending confirmation):**
- Add one new shared helper to `activity10/assets/ecmis-10-2.js`, e.g. `ECMIS102.renderAttachments(containerId, fileNames)`, that renders a read-only list — paperclip icon + filename per row + a "ดาวน์โหลด" button per row (mock toast, same convention as 07's page) — plus an empty state ("ไม่มีเอกสารแนบ") when the array is empty.
- Add one new block + one call (`ECMIS102.renderAttachments("f_attachments", c.attachmentFileNames)`) to the shared `populateCommon()` function that's duplicated across all 8 pages, placed inside the existing "รายละเอียดคำขอเปิดเผยข้อมูลข่าวสาร" read-only card (right after "เลขสำนวนคดีที่เกี่ยวข้อง"), so it appears identically everywhere without hand-building 8 separate layouts.
- Applies to all 8 pages: 10-2-01 through 10-2-08.

**Open questions:**
1. Placement — inside the existing "รายละเอียดคำขอเปิดเผยข้อมูลข่าวสาร" card as one more field, or as its own separate small card ("เอกสารแนบประกอบคำร้อง")?
2. "Read/download" behavior — since no real file bytes are ever stored in this prototype (only names), should both "read" and "download" just show the same kind of mock toast as `07-group-director-approval.html` does, or do you want a mock preview modal (e.g. a fake PDF-viewer-styled popup) instead of a toast?
3. Confirm scope is all 8 pages (10-2-01 through 10-2-08), not just the 6 already touched in this doc.
4. Should the file list also show file type/size, or just the filename (that's genuinely all the data that exists today — size/type were never saved, only names)?


Status: IMPLEMENTED — verified in-browser (2026-09-03). See "Verification" section at the bottom.
Scope: `D:\Mercil\E-CMIS-A4\activity10\*.html` (prefix `10-2-`) + supporting JS in `activity10/assets/`.

---

## 10-2-01 — Change the comment box to optional field

**File:** `activity10/10-2-01-legal-director-assign.html`

| | Current (FROM) | Planned (TO) |
|---|---|---|
| Label | `ข้อสั่งการ / ความเห็นของ ผอ.กองกฎหมาย <span style="color:#dc2626">*</span>` (line 234) | Remove the red `*` required marker |
| Textarea | `#in_orderNotes` (line 237) — no `required` attr, but validated in JS | No change to the field itself |
| Validation (script, ~line 334) | `const notes = requireText("in_orderNotes", "กรุณาระบุข้อสั่งการของ ผอ.กองกฎหมาย"); if (!notes) return;` — blocks submit if empty | Read the value directly (no blocking check); allow submit with empty text |

This is the only textarea/"comment box" on this page, so no ambiguity on which field is meant.

---

## 10-2-02 — Remove the date picker "กำหนดส่งรายงานความเห็น"

**File:** `activity10/10-2-02-group-director-assign.html`

| | Current (FROM) | Planned (TO) |
|---|---|---|
| Markup (lines 556–567) | `form-group` with label `กำหนดส่งรายงานความเห็น *` + `<input type="date" id="in_dueDate">` inside a `form-grid-2` next to `มอบหมายให้` | Remove the whole `form-group` block; `มอบหมายให้` becomes a single full-width field (or `form-grid-2` collapses to 1 column) |
| populate() (line 675) | `document.getElementById("in_dueDate").value = due` | Remove this line |
| submitForm() (line 698) | `l2OpinionDueDate: document.getElementById("in_dueDate").value,` sent to `Activity102.advance(...)` | Remove this line/key entirely |

Checked: `l2OpinionDueDate` is not read/displayed anywhere else in the 10-2 flow, so removing it is self-contained (confirmed via repo-wide grep).

---

## 10-2-03 — Change all fields as optional

**File:** `activity10/10-2-03-secretariat-opinion.html`

This page has exactly one input field (everything else is read-only display boxes):

| | Current (FROM) | Planned (TO) |
|---|---|---|
| Label (line 518) | `ความคิดเห็นคณะอนุกรรมการ<span style="color:#dc2626">*</span>` | Remove red `*` |
| Textarea `#in_opinionNotes` | free text | unchanged |
| File input `#in_opinionFile` | already optional (no validation) | unchanged |
| submitForm() (line 670) | `const notes = requireText("in_opinionNotes", "กรุณาระบุความคิดเห็น"); if (!notes) return;` | Read value directly, no blocking check |

---

## 10-2-04 — Change "ความเห็นประกอบการตรวจสอบ" as optional

**File:** `activity10/10-2-04-group-director-verify.html`

| | Current (FROM) | Planned (TO) |
|---|---|---|
| Label (line 571) | `ความเห็นประกอบการตรวจสอบ <span style="color:#dc2626">*</span>` | Remove red `*` |
| Textarea `#in_verifyNotes` | free text | unchanged |
| Validation (line ~757) | `"กรุณาระบุความเห็นประกอบการตรวจสอบ"` inside a `requireText(...)` call that blocks submit | Read value directly, no blocking check |
| Other field on page: `ผลการตรวจสอบ` choice grid (`#verifyChoices`, also marked `*`) | required choice | **Not in the user's list — left as required unless confirmed otherwise (see open questions)** |

---

## 10-2-06 — Add "อื่นๆ" to มติที่ประชุม choices + add doc preview panel

**File:** `activity10/10-2-06-subcommittee-resolution.html`
**Shared data file:** `activity10/assets/ecmis-10-2.js`

### 6a. Add "อื่นๆ" option

| | Current (FROM) | Planned (TO) |
|---|---|---|
| `RESOLUTION_TYPES` array, `ecmis-10-2.js` line 140 | `[{DISCLOSE},{PARTIAL},{DENY}]` (3 choices, rendered into `#resolutionChoices` via `choiceHtml()`) | Add a 4th entry, e.g. `{ value: "OTHER", label: "อื่นๆ", color: "#64748b" }` |
| Choice grid `#resolutionChoices` | 3 radio-style cards | 4 radio-style cards including "อื่นๆ" |

Because `RESOLUTION_TYPES` is shared, this also changes what 10-2-07's generated document shows for `l2ResolutionTypeName` when "อื่นๆ" is picked (via `labelOf()`).

### 6b. Add document preview panel

Currently **10-2-06 has no document preview at all** — it is a single-column form only (คำขอฯ card → ข้อมูลการประชุม card → มติที่ประชุม card). There is no existing "preview" pattern elsewhere in this codebase to copy verbatim (checked — no `doc-preview`/`split-layout` class exists yet); the closest analog is the collapsible "เอกสารแนบ" toggle block already built in 10-2-07 (`#resolutionSheetWrap`, generated by a `resolutionSheet` builder function).

**Open design question — see clarifying questions below** before drafting FROM/TO markup for this part.

---

## 10-2-07 — Create doc preview panel (left side)

**File:** `activity10/10-2-07-secretariat-resolution-doc.html`

| | Current (FROM) | Planned (TO) |
|---|---|---|
| Layout | Single column. A card titled "เอกสารแนบ — มติคณะอนุกรรมการฯ" (line 439) has a **toggle button** (`toggleResolutionSheet()`) that shows/hides the generated document (`#resolutionSheetWrap`, default `display:none`) above the "บันทึกข้อความ" form card | Restructure into a two-column layout: document preview pinned on the **left**, the "บันทึกข้อความ" input form on the **right**, so both are visible while filling the form (per prior-session note, the note/case-request card and stepper stay full-width above) |
| Toggle button | Needed today because the preview is stacked inline and takes vertical space | Likely removed/repurposed once the preview is always visible in its own column (open question below) |

Reference: `docs/10.2 mockup/Part 2/มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิก.md` + `.jpg` — the scanned original this generated document mirrors.

---

## 10-2-06 & 10-2-07 — Rich text editor (Tiptap) for memo fields feeding the doc preview

Per user request (https://github.com/ueberdosis/tiptap), the textareas that feed the new live document preview become **Tiptap** rich-text editors. Scope is limited to the pages that have the doc preview/demo — **10-2-06 and 10-2-07 only** (01/02/03/04 stay plain `<textarea>`, just made optional per above).

**Fields converted to Tiptap:**
- 10-2-06: `#in_committeeOpinion` (ความเห็นคณะอนุกรรมการฯ), `#in_resolutionDetail` (รายละเอียดมติที่ประชุม)
- 10-2-07: `#in_background` (๑. เรื่องเดิม), `#in_facts` (๒. ข้อเท็จจริง), `#in_legalBasis` (๓. ข้อกฎหมายฯ), `#in_considerations` (๔. ข้อพิจารณา)
- The new "อื่นๆ — โปรดระบุ" field (10-2-06) stays a plain short text `<input>`, not Tiptap.

**Technical notes (project has no bundler — plain `<script src>` throughout, verified: no `package.json` anywhere in the repo):**
- Load Tiptap as ES modules from a CDN via `<script type="module">` (e.g. `esm.sh/@tiptap/core`, `@tiptap/starter-kit`) — new loading pattern for this codebase, isolated to these two pages.
- Toolbar: **minimal** — bold, italic, bullet list, numbered list only.
- Mic (speech-to-text): currently appends transcript to `textarea.value` and fires an `input` event (`ecmis-10-2.js:594-599`). Will be reworked so `toggleSpeechToText` detects a Tiptap-backed field and calls `editor.chain().focus().insertContent(transcript).run()` at the **current cursor position** instead of appending to the end; plain-textarea fields on other pages keep today's append behavior unchanged.
- Validation (`requireText`-equivalent) reads `editor.getText().trim()` for these fields instead of `el.value.trim()`.
- Live preview panel renders `editor.getHTML()` output from each field directly into the document mock.

## Decisions (confirmed by user)

1. **10-2-04 scope** — keep "ผลการตรวจสอบ" choice grid **required**. Only "ความเห็นประกอบการตรวจสอบ" becomes optional, exactly as listed.
2. **"อื่นๆ" follow-up text** — add an inline "โปรดระบุ" text input that appears under the มติที่ประชุม choice grid when "อื่นๆ" is selected (short label, separate from the existing "รายละเอียดมติที่ประชุม" textarea).
3. **10-2-06 & 10-2-07 preview content** — build a **live-updating draft** of the memo document, re-rendered from current form field values as the user types/selects (mirrors the reference `.md`/`.docx` layout), not just a static known-data card.
4. **Layout mechanics** — preview column is **sticky** (stays in view while the form scrolls) on desktop widths; stacks to a single column on narrow/mobile widths.
5. **10-2-07 toggle + print** — **keep both** the "แสดงเอกสาร/ซ่อนเอกสาร" toggle (repurposed to collapse/expand the sticky preview on mobile/narrow widths) and the "พิมพ์" button.
6. **Validation styling (10-2-01/02/03/04)** — remove the red `*` required-marker from the labels of the fields being made optional, in addition to removing the JS blocking check.

## Implementation order

1. 10-2-01 — remove required check + `*` on ข้อสั่งการ/ความเห็น textarea.
2. 10-2-02 — remove กำหนดส่งรายงานความเห็น date picker (markup + populate + submit payload).
3. 10-2-03 — remove required check + `*` on ความคิดเห็นคณะอนุกรรมการ textarea.
4. 10-2-04 — remove required check + `*` on ความเห็นประกอบการตรวจสอบ textarea only (ผลการตรวจสอบ stays required).
5. 10-2-06 — add "อื่นๆ" to `RESOLUTION_TYPES` in `ecmis-10-2.js` + inline specify field + sticky live-preview left column; convert `#in_committeeOpinion`/`#in_resolutionDetail` to Tiptap.
6. 10-2-07 — restructure into sticky left preview / right form two-column layout, keep toggle (repurposed for mobile) + print button; convert `#in_background`/`#in_facts`/`#in_legalBasis`/`#in_considerations` to Tiptap.
7. Rework `toggleSpeechToText` (`ecmis-10-2.js`) to support both plain textareas (unchanged, append-to-end) and Tiptap-backed fields (insert at cursor).

CSS for the new two-column sticky layout will go in `activity10/assets/ecmis-10-2.css` (shared by 10-2-06 and 10-2-07) as a new reusable class rather than page-specific inline styles.

## Verification

Served `activity10/` locally (`python -m http.server 8811`, via `.claude/launch.json`'s `activity10-static` config) and exercised each page in the Browser pane with synthetic in-memory test cases (`Activity10.addCase`, reset afterward with `Activity10.resetData()` — no files touched, browser-local only):

- **10-2-01/03/04**: confirmed the target textarea's red `*` is gone from the label and the page loads with no console errors.
- **10-2-02**: confirmed "กำหนดส่งรายงานความเห็น" no longer appears anywhere on the page (checked via full page-text dump); the remaining `มอบหมายให้` field lays out correctly full-width.
- **10-2-06**: confirmed the `.l2-split` layout renders (live-preview card left, form right); "อื่นๆ" appears as a 4th มติที่ประชุม choice and reveals a "โปรดระบุ" text input when selected; typing in the Tiptap-backed ความเห็นคณะอนุกรรมการฯ / รายละเอียดมติที่ประชุม fields updates the live preview immediately; clicking submit with รายละเอียดมติที่ประชุม still empty correctly blocks with the expected Thai warning (validation still enforced through the new `requireEditorText` helper).
- **10-2-07**: confirmed the existing "เอกสารแนบ" toggle/print card is untouched and still full-width above; the new `.l2-split` wraps only the "บันทึกเสนอเลขาธิการฯ" card; all four memo fields (๑–๔) mounted as Tiptap editors with their initial prefilled content carried over correctly from case data; the new live preview mirrors both the static fields (ส่วนราชการ/ที่/วันที่/เรื่อง) and the four rich-text sections in real time.
- No unexpected console errors on any page — the only console entry seen was the expected `Speech recognition error: not-allowed`, which is the sandboxed browser pane blocking microphone access (pre-existing behavior of the mic feature, unrelated to this change).
