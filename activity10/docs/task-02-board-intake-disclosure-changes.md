# Task List — 02-board-intake.html (การขอเปิดเผยข้อมูลข่าวสาร block)

Status: IMPLEMENTED — all 8 items coded and verified via a local static server + JS/console checks (no bundler in this repo, so file:// alone doesn't execute JS; served over http://localhost for testing).
File: `activity10/02-board-intake.html` — all changes inside `#div_disclosureRequest` (shown when หมวดหมู่งานกฎหมาย = `10.2.1`), plus the page's inline `<script>` (submit/validation logic).

| # | Item | Field(s) | Current (FROM) | Planned (TO) | Status |
|---|------|----------|-----------------|---------------|--------|
| 1 | ประเภทผู้ยื่นคำขอ — add "อื่นๆ" | `#in_requesterType` (select) | 3 options: `CITIZEN` ประชาชน, `JURISTIC` นิติบุคคล, `AGENCY` หน่วยงานของรัฐ | Add 4th option `OTHER` อื่นๆ. Same pattern as existing `in_prosecutorCaseType` → `div_prosecutorOther`: selecting "อื่นๆ" reveals an inline text input (`#in_requesterTypeOtherText`) to specify, required only when shown. New toggle function `toggleRequesterTypeOtherInput()` wired to `onchange`. | ☑ Done |
| 2 | ช่องทางการยื่นคำขอ — merge ศรร. into ส่วนกลาง | `#in_requestChannel` (select) | `CENTRAL` "ยื่นที่ส่วนกลาง", `SRR` "ยื่นที่ ศรร." (separate options) | Remove `SRR` option; rename `CENTRAL` label to **"ยื่นที่ส่วนกลาง/ศรร."** | ☑ Done |
| 3 | ช่องทางการยื่นคำขอ — เขต sub-select | `#in_requestChannel` = `REGION` | Single option "ยื่นที่สำนักงาน ป.ป.ท. เขต", no sub-detail | When `REGION` selected, reveal inline `<select id="in_requestChannelRegion">` listing **เขต 1–เขต 9** (matches `index.html` เขต 1-9 reference). New toggle function `toggleRequestChannelRegionInput()`. | ☑ Done |
| 4 | ช่องทางการยื่นคำขอ — new channels | `#in_requestChannel` | 3 options total (after #2/#3) | Add `POST` "ไปรษณีย์" and `ELECTRONIC` "อิเล็กทรอนิกส์" (no inline field). Add `OTHER` "อื่นๆ" **with inline text field** (`#in_requestChannelOtherText`, same reveal-on-select pattern as #1/#3), required when shown. | ☑ Done |
| 5 | ชื่อเรื่อง — add microphone | `#in_disclosureTitle` (text input) | Plain input, no mic | Add `.btn-mic` button next to label, wired to existing `toggleSpeechToText('in_disclosureTitle', this)` (already defined inline in this page's `<script>`, same as `in_title`/`in_summary`/`in_legalOpinion`) | ☑ Done |
| 6 | ข้อมูลข่าวสารที่ขอเปิดเผย — add microphone | `#in_requestedInfo` (textarea) | Plain textarea, no mic | Add `.btn-mic` button next to label, wired to `toggleSpeechToText('in_requestedInfo', this)` | ☑ Done |
| 7 | New field: วันที่สำนักงาน ป.ป.ท. ได้รับคำขอ | new `#in_requestReceivedDate` (date input) | Does not exist | Add to the same row as "เลขสำนวนคดีที่เกี่ยวข้อง" + "ช่องทางการยื่นคำขอ" (that `form-grid-2` becomes a 3-column grid). **Required** (red `*`) — add to `validateDisclosureFields()` checks and to `collectDisclosureFields()` / submit payload. Default to today's date on load (same as `in_physicalDocDate`). | ☑ Done |
| 8 | New: เอกสารเพิ่มเติม (multiple file attach) | new `#in_disclosureAttachments` (file input, `multiple`) | Does not exist (existing `grp_scannedFile` upload box is hidden for the disclosure category) | New upload box inside `div_disclosureRequest`, `multiple` attribute, same allowed types/size limit as `grp_scannedFile` (PDF/DOC/DOCX/XLS/XLSX/PNG/JPG/JPEG, ≤100MB/file). Render a list of attached files with individual remove buttons (reuse validation logic from `validateUploadedFile`, adapted to loop over `input.files`). | ☑ Done |

## Supporting JS changes (inline `<script>` in 02-board-intake.html)

- `collectDisclosureFields()` — add `requesterTypeOther`, `requestChannelRegion`, `requestChannelOther`, `requestReceivedDate`, and attachment file name(s) to the returned object.
- `validateDisclosureFields()` — add required checks for: ประเภทผู้ยื่นคำขอ "อื่นๆ" text (when selected), ช่องทางการยื่นคำขอ "อื่นๆ" text (when selected), เขต sub-select (when REGION selected), and `in_requestReceivedDate`.
- New toggle functions: `toggleRequesterTypeOtherInput()`, `toggleRequestChannelDetail()` (handles both เขต sub-select and "อื่นๆ" inline field depending on selected channel).
- `DOMContentLoaded` — set default value of `in_requestReceivedDate` to today, same as `in_physicalDocDate`.
- New file-list rendering + remove handlers for `in_disclosureAttachments` (multiple files), mirroring `updateCustomFileLabel`/`validateUploadedFile`/`removeScannedFile` but supporting an array of files.

## Decisions (confirmed by user)

1. "อื่นๆ" for ประเภทผู้ยื่นคำขอ → same pattern as existing `in_prosecutorCaseType` "อื่นๆ" (inline text field).
2. เขต sub-select uses เขต 1–เขต 9 (from `index.html` เขต 1-9 reference).
3. ช่องทางการยื่นคำขอ "อื่นๆ" (new) → has its own inline text field; ไปรษณีย์ and อิเล็กทรอนิกส์ do not.
4. Mic button added to **both** ชื่อเรื่อง (`in_disclosureTitle`) and ข้อมูลข่าวสารที่ขอเปิดเผย (`in_requestedInfo`).
5. วันที่สำนักงาน ป.ป.ท. ได้รับคำขอ → same row as เลขสำนวนคดีที่เกี่ยวข้อง + ช่องทางการยื่นคำขอ (3-column grid); **required**.
6. เอกสารเพิ่มเติม → same file type/size rules as the existing `grp_scannedFile` upload box.

## Verification

Tested by serving `activity10/` over a local static HTTP server (file:// doesn't execute JS in the browser tool used) and driving the page via JS:
- Selecting หมวดหมู่งานกฎหมาย = การขอเปิดเผยข้อมูลข่าวสาร reveals `#div_disclosureRequest` with all new fields present (accessibility-tree dump confirmed all option labels and mic buttons).
- `in_requesterType` = "อื่นๆ" reveals `#div_requesterTypeOther`.
- `in_requestChannel` = "ยื่นที่สำนักงาน ป.ป.ท. เขต" reveals the เขต 1–9 sub-select; = "อื่นๆ" reveals its inline text field instead.
- `in_requestReceivedDate` defaults to today's date on load.
- `collectDisclosureFields()` returns correct composed labels, e.g. `requesterTypeName: "อื่นๆ (ทนายความผู้รับมอบอำนาจ)"`, `requestChannelName: "อื่นๆ (ผ่านตัวแทน)"`.
- `validateDisclosureFields()` correctly blocks submit when the "อื่นๆ" inline fields are required-but-empty, and passes once filled.
- `handleDisclosureAttachmentsChange` / `renderDisclosureAttachmentsList` / `removeDisclosureAttachment` tested with mock `File` objects — list renders both file names, remove correctly drops one and keeps the other.
- No console errors during any of the above.
