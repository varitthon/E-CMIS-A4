# 10-2-xx Task Checklist

Status snapshot as of 2026-09-03. Full FROM/TO detail and verification notes live in [task-10-2-form-changes.md](task-10-2-form-changes.md).

## Optional-field changes

- [x] **10-2-01** — ข้อสั่งการ / ความเห็นของ ผอ.กองกฎหมาย is now optional (red `*` removed, submit no longer blocks on empty)
- [x] **10-2-02** — กำหนดส่งรายงานความเห็น date picker removed entirely (markup + populate + submit payload)
- [x] **10-2-03** — ความคิดเห็นคณะอนุกรรมการ is now optional (red `*` removed, submit no longer blocks on empty)
- [x] **10-2-04** — ความเห็นประกอบการตรวจสอบ is now optional (ผลการตรวจสอบ choice grid intentionally stays required)

## 10-2-06 — มติที่ประชุม + live preview

- [x] Added "อื่นๆ" as a 4th มติที่ประชุม choice (shared `RESOLUTION_TYPES` in `ecmis-10-2.js`)
- [x] Inline "โปรดระบุ" text field appears when "อื่นๆ" is selected
- [x] ความเห็นคณะอนุกรรมการฯ / รายละเอียดมติที่ประชุม converted to Tiptap rich-text editors (minimal toolbar: bold/italic/bullet/numbered list)
- [x] New sticky live-preview column (left) renders a document-styled draft that updates as choices/text change
- [x] Required-field validation still enforced on the two Tiptap fields (`requireEditorText`)

## 10-2-07 — sticky preview/form layout

- [x] Restructured "บันทึกเสนอเลขาธิการฯ" card into sticky left-preview / right-form layout
- [x] Existing "เอกสารแนบ" toggle + พิมพ์ card left untouched, still full-width above
- [x] ๑.เรื่องเดิม / ๒.ข้อเท็จจริง / ๓.ข้อกฎหมายฯ / ๔.ข้อพิจารณา converted to Tiptap editors, prefilled from case data
- [x] Live preview mirrors both plain fields (ส่วนราชการ/ที่/วันที่/เรื่อง/เรียน) and the four rich-text sections in real time

## Shared infrastructure

- [x] `ECMIS102.mountEditor` / `getEditorText` / `getEditorHTML` added to `ecmis-10-2.js` (Tiptap loaded via dynamic `import()` from esm.sh — no bundler needed)
- [x] Speech-to-text (mic button) reworked to insert at cursor for Tiptap fields, unchanged append-to-end behavior for plain textareas elsewhere
- [x] New `.l2-split`, `.l2-tiptap*`, `.l2-choice-other-detail` styles added to `ecmis-10-2.css`

## Attached documents (all 8 pages)

- [x] `ECMIS102.renderAttachments` / `mockOpenFile` helpers added to `ecmis-10-2.js`
- [x] `10-2-01` through `10-2-06` — attachment list added inside the existing shared case-detail card
- [x] `10-2-07`, `10-2-08` — attachment list added in its own new card (these two pages don't have the shared case-detail card at all — pre-existing gap, not introduced by this change)
- [x] Download action shows a mock toast (no real file storage exists in this static mockup)
- [x] `.l2-attachment-row` / `.l2-attachment-name` styles added to `ecmis-10-2.css`

## Verification performed

- [x] Served `activity10/` locally and exercised 10-2-01, 10-2-06, 10-2-07 in-browser with synthetic test cases
- [x] Confirmed no unexpected console errors (only the expected sandboxed-mic `not-allowed` message)
- [x] Confirmed live preview updates on typing/choice changes, validation still blocks on required Tiptap fields, attachment download shows the mock toast
- [x] Test data reset afterward (`Activity10.resetData()`, browser-local only — no project files touched)

## Correction (2026-09-03)

- [x] **Re-applied 10-2-01/02/03/04 optional-field edits** — the user reported the `*` was still showing on 10-2-01's ข้อสั่งการ field; investigation found all four pages' optional-field edits (and 10-2-02's date-picker removal) had reverted to their original state at some point after being applied and verified earlier in this session, while later edits to those same files (the attachments feature) had stuck. Cause wasn't confirmed with certainty, but is suspected to be an interaction with this session's edit-approval hook on the earlier retried edits. Re-applied all five edits and confirmed via `grep` immediately after (not just the tool's success message) that the `*`/`requireText`/date-picker markup is gone and only the intentionally-still-required fields (`มอบหมายให้`, `วันที่สั่งการ`, `ผลการตรวจสอบ`) remain marked with `*`.
- [ ] **Recommended follow-up:** reload/hard-refresh each of 10-2-01–04 in your browser to confirm the fields now display without `*` on your end, since the earlier report came from a live screenshot.

## Default value "-" for optional fields (2026-09-03)

- [x] **10-2-03** — ความคิดเห็นคณะอนุกรรมการ textarea now pre-fills with "-" on load (editable, normal textfield — typing replaces it); submit falls back to "-" if cleared to blank
- [x] **10-2-04** — ความเห็นประกอบการตรวจสอบ textarea now pre-fills with "-" on load; submit falls back to "-" if cleared to blank
- [x] **10-2-01** — ข้อสั่งการ/ความเห็น: submit now falls back to "-" if cleared to blank. **Not** pre-filled with "-" on load, because this field already ships with a real suggested default (a pre-written order instruction baked into the textarea) — replacing that with "-" would remove existing useful content, so the existing default was left as-is and only the "never save truly blank" safety net was added.
- [x] Searched all 8 pages for any other optional "ความเห็น"-type field — none found beyond these three, so no other pages needed this change.

## Rebuild after unexplained revert (2026-09-03)

- [x] **Confirmed via grep:** 10-2-06 and 10-2-07's entire split-layout/Tiptap/live-preview work had reverted to pre-edit state at some point, with zero trace left, while the attachments feature (all 8 pages) and the most recent "-" default edits survived. Root cause not identified — suspect an external process periodically restoring `D:\Mercil\E-CMIS-A4`. **Recommend checking for OneDrive/Dropbox sync, backup software, or git operations on this folder, and backing up/committing this work immediately** so it isn't lost again.
- [x] **10-2-02** — ประเด็นกฎหมายที่ต้องพิจารณา marked optional (`*` removed, submit no longer blocks, prefills with "-")
- [x] **10-2-06** — rebuilt: split layout, live preview, Tiptap editors, "อื่นๆ" specify box (all re-verified present via grep)
- [x] **10-2-06** — มติที่ประชุม radio buttons now colored to match each choice's own border color (`accent-color` set from each option's `color`, applies to all 4 choices including "อื่นๆ")
- [x] **10-2-06** — สถานะคดีที่เกี่ยวข้อง (`CASE_STATES` in `ecmis-10-2.js`) given `color: "#1e3a8a"` (primary blue) on both choices, so its active border and radio now show blue instead of the previous neutral/no-color state
- [x] **10-2-07** — rebuilt: split layout, live preview, Tiptap editors for all four memo fields (all re-verified present via grep)

## Not yet requested / out of scope

- [ ] 10-2-05, 10-2-08 optional-field or layout changes (not requested)
- [ ] Real file upload/storage backend for attachments (this is a static mockup; only filenames are ever saved)
