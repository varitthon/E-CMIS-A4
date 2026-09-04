# Meeting 01/09/2026 — changes and decisions

Source: `01092026 10.1 meeting.pdf`. This file records **what was changed, what was
deliberately left alone, and why** for every item raised in that meeting.

- [Part 1 — decisions register](#part-1--decisions-register) · every decision and who made it
- [Part 2 — wording sweep](#part-2--wording-sweep-ความเห็นแย้ง--ความเห็น) · the ความเห็นแย้ง → ความเห็น change, file by file
- [Part 3 — open items](#-open-items) · what still needs a ruling

---

# Part 1 — decisions register

## Item 02 — `02-board-intake.html`

| # | from the notes | decision | status |
|---|---|---|---|
| 1 | ซ้ายขวาคนเดียวกัน ลดเหลืออันเดียว | merge ผู้กล่าวหา\|ผู้ร้อง and ผู้ถูกกล่าวหา\|จำเลย into one field each | ✅ (was already in the working tree) |
| 2 | แก้คำ ศาลอุธรณ์ | → `ศาลอุทธรณ์` (2 places: the `<option>` and the JS ternary) | ✅ |
| 3 | เพิ่ม อื่นๆ ติดค้างไว้ + 1-2 / 3-4-5 / 6-7-8 | see below | ✅ |

**ระดับศาล.** The prosecutor's case (1-9) tells you which court already ruled, so
ระดับศาล is now derived from it.

| กรณีความเห็น/คำสั่งพนักงานอัยการ | ระดับศาล |
|---|---|
| 1 ไม่ฟ้อง · 2 ถอนฟ้อง | `ยังไม่มีศาลระบุ` ← new option |
| 3 ไม่อุทธรณ์(ลงโทษ) · 4 ไม่อุทธรณ์(ยกฟ้อง) · 5 ถอนอุทธรณ์ | ศาลชั้นต้น |
| 6 ไม่ฎีกา(ลงโทษ) · 7 ไม่ฎีกา(ยกฟ้อง) · 8 ถอนฎีกา | ศาลอุทธรณ์ |
| 9 อื่นๆ | `อื่นๆ` ← new option, with a free-text box |
| — | ศาลฎีกา kept, never auto-selected |

- **Auto-set but still editable** (user's decision) — the map is
  `PROSECUTOR_LEVEL_BY_CASE`, applied by `syncProsecutorLevel()`.
- The `อื่นๆ` free-text follows the page's three existing อื่นๆ blocks exactly:
  id `in_prosecutorLevelOtherText`, label `ระบุระดับศาล (อื่นๆ) *`, placeholder
  `โปรดระบุระดับศาล...`.
- **UX note raised at the time:** free text fragments Dashboard grouping (ten people will
  type ศาลอุทธรณ์ ten ways). Accepted because อื่นๆ should be rare for court levels.

**Validation added for both อื่นๆ fields** (`validateProsecutorFields()`). Previously only
the 10.2 disclosure path validated its อื่นๆ inputs, even though the 10.1 fields were
already marked `*`. The two paths are now symmetric.

## Item 06 — `06-officer-opinion.html`

| from the notes | decision | status |
|---|---|---|
| recheck wording ไม่ฟ้อง ว่าเปลี่ยนตามที่ธุรการออกมั้ย | **It did not.** `ไม่ฟ้อง` was hardcoded in 14 places. Now driven by a 9-entry lookup table. | ✅ |
| wording ความเห็นแย้ง → ความเห็น | see Part 2 | ✅ |
| ปกติมี e-sign ใช้ sign เดิมตาม pattern ได้เลย | informational — reused for item 13 | ✅ |
| ลง Detail อื่นๆ ใส่ใน field ตอนกรอกรับเรื่อง | **already worked** — no code written | ✅ |
| เพิ่มส่วนที่ใช้กรอก มาตรา → ฐานความผิด | repeatable block, see below | ✅ |

**Per-case wording.** `PROSECUTOR_ORDER_PHRASE` maps the case no. to its คำสั่ง phrase, and
`getProsecutorOrderPhrase()` feeds both decision cards, the AGREE label and placeholder, the
stored `opinionType`, the summary, and the generated file name.

| case | phrase | example decision-card title |
|---|---|---|
| 1 | คำสั่งไม่ฟ้อง | เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ |
| 2 | คำสั่งถอนฟ้อง | … |
| 3 / 4 | คำสั่งไม่อุทธรณ์(ลงโทษ) / (ยกฟ้อง) | … |
| 5 | คำสั่งถอนอุทธรณ์ | เสนอทำความเห็นแย้งคำสั่งถอนอุทธรณ์ของพนักงานอัยการ |
| 6 / 7 | คำสั่งไม่ฎีกา(ลงโทษ) / (ยกฟ้อง) | … |
| 8 | คำสั่งถอนฎีกา | … |
| 9 | คำสั่ง *(generic)* | เสนอทำความเห็นแย้งคำสั่งของพนักงานอัยการ |

Falls back to case 1 when the case carries no `prosecutorCaseTypeNo`.

**"ลง Detail อื่นๆ" needed no work.** `02` already stores `9. อื่นๆ (รายละเอียด)` into
`prosecutorCaseTypeName` (`02-board-intake.html`, in the submit handler) and `06` already
renders that string into the read-only `f_prosecutorCaseTypeName` box. Verified rather than
rebuilt.

## ฐานความผิด (มาตรา) — `02` + `06`

Decision: **entered at 02, editable at 06**; row = **กฎหมาย + มาตรา + ฐานความผิด**.

Implemented once in **`assets/ecmis-offense-basis.js`** and loaded by both pages, rather
than pasting ~150 lines twice — 02 writes the data and 06 edits the same structure, so two
copies would drift.

- `OFFENSE_LAWS` dropdown: ประมวลกฎหมายอาญา · พ.ร.บ.ว่าด้วยความผิดเกี่ยวกับการเสนอราคาฯ
  พ.ศ. 2542 · พ.ร.ป.ว่าด้วยการป้องกันและปราบปรามการทุจริต · **อื่นๆ** → free text
- Saved on the case as `offenseBases: [{law, section, basis}]` — Dashboard-ready
- Round-trip: a custom law saved as plain text is recognised on reload and re-selects `อื่นๆ`
- Validation: `อื่นๆ` requires a law name; a started row requires a มาตรา; blank rows are
  dropped silently instead of erroring
- User input is HTML-escaped (`escAttr`) — `"` and `<b>` in a ฐานความผิด cannot break the markup

## Items 07 / 08 — decision-card wording

Decision: **rename only — no routing change.** Option 2 still sends the case back for revision.

| page | option 1 | option 2 |
|---|---|---|
| `07-group-director-approval.html` | `เห็นชอบตามคำร่างที่เสนอ` | `เห็นแย้งตามคำร่างที่เสนอ` |
| `08-legal-director-approval.html` | `เห็นชอบตามความเห็นที่เสนอ` | `เห็นแย้งตามความเห็นที่เสนอ` |

The explanatory sub-lines (`ส่งคืนให้นิติกรเจ้าของสำนวนปรับปรุงเนื้อหา`,
`ส่งสำนวนกลับไปยังกลุ่มงานความเห็นแย้งเพื่อทบทวน`) were kept, so it stays clear what
เห็นแย้ง actually does.

**Followed downstream** so the wording cannot split: the stored
`groupDirectorEndorsement` / `legalDirectorEndorsement` values in `ecmis-activity10.js`,
their fallbacks, and the places where `08` and `09` display each other's result. Narrative
notes beginning `ได้ตรวจพิจารณา…` were left alone — those are document prose, not the label.

## Item 10 — มติอัยการ on every later page

Decision: **pages 10 through 22** (the 10.1 flow; not the `10-2-xx` series).

`มติอัยการ` (`f_prosecutorCaseTypeName`, from `currentCase.prosecutorCaseTypeName`) now sits
directly above ระดับศาล in the case-detail card on all 13 pages. Previously it appeared only
on 03/04/05/06, so from 10 onward you could not see what the prosecutor had actually ordered.

Applied by script, matching each file's own quote style (`"` on 5 pages, `'` on 8).

## Items 13 / 15 / 16

| item | decision | note |
|---|---|---|
| **13** เพิ่ม sign ตอน Submit | signature pad added, submit routes through `openSignatureModal()` | copied 06's implementation (the comment there calls it the shared pattern across 06/07/08/14/15/22 — now 13 too); cert id `PACC-LEGALOFFICER-2569-013`; 13's CRLF endings and 1-space script indent preserved |
| **15** ทำให้เหมือน 08 | `<select>` → two decision cards | **both option values kept byte-identical**, so anything comparing that string still works; `.decision-grid`/`.decision-card` moved into `ecmis-shell.css` instead of a 4th page-local copy (pages 06/07/08 keep their own and still override) |
| **16** ลายเซ็นมาไม่ครบ | render the ผอ.กลุ่มงาน signature page 14/15 already stores | a **rendering gap, not missing data** — `groupDirectorFinalReviewSignature` was already written by `ecmis-activity10.js` and shown on 15, just never on 16 |

## Bug found and fixed along the way

`02-board-intake.html` had a broken `@media (max-width: 1024px)` block — a dangling
`.form-grid-2,` selector with no declarations. Invalid CSS, so the whole rule was dead and
the page never collapsed to one column on narrow screens. Present in `0e272dc`, so it
predates this work. Completed to match the shared rule.

## Verification performed

- `node --check` on the extracted inline script of **all 33 HTML pages** and all 5 JS files — 0 failures
- `<div>` balance of the 13 edited pages compared against `HEAD` — 0 unbalanced
- ฐานความผิด widget: 9 unit checks incl. HTML-escaping, value survival across re-render,
  02→06 round-trip, and all 3 validation branches
- 06 wording: all 9 cases plus the no-data fallback

---

# Part 2 — wording sweep (ความเห็นแย้ง → ความเห็น)

> senior: *"แก้หมด (เช็คดีๆ ระวังทับอันที่เป็น choice ของมันอยู่แล้ว) — พวก label แก้หมดเลย"*

## Rules applied

| category | action | reason |
|---|---|---|
| **LABEL** — sidebar, stepper, page title, headings, field labels | **CHANGE** → `ความเห็น` | the label is written before the user decides; นิติกร may still pick เห็นชอบ, so it must not prejudge |
| **ORG** — anything containing `กลุ่มงาน` (`กลุ่มงานความเห็นแย้ง`, `ผอ.กลุ่มงานความเห็นแย้ง`) | **KEEP** | real ป.ป.ท. organisational unit name |
| **CHOICE** — the เห็นชอบ / เห็นแย้ง decision options and their stored values | **KEEP** | this is the "choice ของมันอยู่แล้ว" the senior warned about; changing it destroys the เห็นชอบ-vs-เห็นแย้ง distinction |
| **อสส-BOUND** — the document actually sent to อัยการสูงสุด, its file names, and narrative referring to it | **KEEP** | after the board's มติ the document genuinely *is* a ความเห็นแย้ง |

## Review highlighting

Every changed label is wrapped in `<mark class="wording-changed">`, styled yellow in
`assets/ecmis-shell.css` (all 31 pages link it).

**To finalise:** delete the `REVIEW MARKER` block at the end of `assets/ecmis-shell.css`
and unwrap the `<mark class="wording-changed">` tags.

---

## 06-officer-opinion.html

22 occurrences → **6 changed, 16 kept.**

## CHANGED (6)

| line | kind | before | after |
|---|---|---|---|
| 6 | page title | `นิติกร จัดทำบันทึกความเห็นแย้ง \| E-CMIS…` | `นิติกร จัดทำบันทึกความเห็น \| E-CMIS…` ⚠ not highlighted — `<title>` cannot contain markup |
| 358 | **sidebar nav** | `ยกร่างความเห็นแย้ง` | `ยกร่างความเห็น` |
| 402 | page heading | `จัดทำบันทึกความเห็นแย้ง` | `จัดทำบันทึกความเห็น` |
| 867 | field label | `…ข้อกฎหมายประกอบความเห็นแย้ง` | `…ข้อกฎหมายประกอบความเห็น` ← the label in the meeting screenshot |
| 893 | field label | `แนบไฟล์ร่างบันทึกความเห็นแย้งฉบับสมบูรณ์` | `แนบไฟล์ร่างบันทึกความเห็นฉบับสมบูรณ์` |
| 1221 | label (read-only view) | `สาระสำคัญ / เหตุผลความเห็นแย้ง` | `สาระสำคัญ / เหตุผลความเห็น` |

## KEPT (16)

### ORG — `กลุ่มงาน` (6)
| line | text |
|---|---|
| 468 | `กลุ่มงานความเห็นแย้ง · สำนักงาน ป.ป.ท.` |
| 688 | `ผอ.กลุ่มงานความเห็นแย้ง (นายอานนท์ ชินประชา):` |
| 940 | `ผอ.กลุ่มงานความเห็นแย้ง` |
| 1300 | `นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)` |
| 1322 | `ส่งเรื่องเสนอ ผอ.กลุ่มงานความเห็นแย้ง เรียบร้อยแล้ว` |
| 1452 | `ลงนามเสนอความเห็นทางกฎหมายต่อ ผอ.กลุ่มงานความเห็นแย้ง` |

### CHOICE — the เห็นแย้ง decision and its values (5)
| line | text | note |
|---|---|---|
| 760 | `เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ` | decision card 1, paired against `เห็นชอบตามคำสั่งไม่ฟ้อง…` at :789 |
| 1053 | `สาระสำคัญ / ข้อเท็จจริงและข้อกฎหมายประกอบความเห็นแย้ง` | **judgment call** — a label, but it is only written into the DOM *after* the user picks DISSENT, so here the word is accurate. The static default at :867 is the one that prejudged. |
| 1213 | `${currentCase.opinionType \|\| "เสนอทำความเห็นแย้ง…"}` | fallback for the stored choice |
| 1244 | `"เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ (Dissenting Opinion)"` | the stored `opinionType` value |
| 1246 | `summaryHtml` — `เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ` | renders the chosen value |

### CONTENT / อสส-bound (5)
| line | text | note |
|---|---|---|
| 887 | draft body: `…จึงเห็นควรทำความเห็นแย้งเสนอเลขาธิการ ป.ป.ท. เพื่อส่งอัยการสูงสุดชี้ขาด…` | document prose, and explicitly อสส-bound |
| 1146 | fallback narrative for `f_opinion` | document prose |
| 1151 | `โปรดมอบหมายนิติกร…ยกร่างความเห็นแย้งตามขั้นตอนกฎหมาย` | ผอ.กอง's directive text (seeded data) |
| 1156 | `โปรดตรวจสอบพยานหลักฐาน…ยกร่างบันทึกความเห็นแย้งคำสั่งไม่ฟ้อง…` | ผอ.กลุ่ม's directive text (seeded data) |
| 1245 | `ร่างบันทึกความเห็นแย้ง_สมบูรณ์.docx` | file name of the อสส-bound document |

---

## Other files — 11 more changes

| file | line | kind | before → after |
|---|---|---|---|
| `01-work-inbox.html` | 465 | alert text | `ครบกำหนดยกร่างความเห็นแย้ง` → `…ยกร่างความเห็น` |
| `01-work-inbox.html` | 1421 | **sidebar** | `ยกร่างความเห็นแย้ง` → `ยกร่างความเห็น` |
| `01-work-inbox.html` | 1993 | tooltip attr | `title="จัดทำความเห็นแย้ง"` → `title="จัดทำความเห็น"` ⚠ not highlighted (attribute) |
| `03-prosecutor-doc.html` | 373 | **stepper** | `4. นิติกร จัดทำความเห็นแย้ง` → `…จัดทำความเห็น` |
| `04-legal-director-review.html` | 394 | **stepper** | same |
| `05-group-director-review.html` | 396 | **stepper** | same |
| `05-group-director-review.html` | 642 | field label | `แนวทางการจัดทำความเห็นแย้งถึงนิติกร` → `…จัดทำความเห็นถึงนิติกร` |
| `05-group-director-review.html` | 854 | field label | `แนวทางการจัดทำความเห็นแย้ง` → `…จัดทำความเห็น` |
| `12-group-director-resolution.html` | 177 | **sidebar** | `ตรวจร่างความเห็นแย้ง` → `ตรวจร่างความเห็น` |
| `22-officer-case-closed-notify.html` | 114 | **sidebar** | `ยกร่างความเห็นแย้ง` → `ยกร่างความเห็น` |
| `design-system.html` | 834 | sample label | `บันทึกความเห็นแย้ง` → `บันทึกความเห็น` |

**Total: 17 changed, 15 highlighted** (2 cannot be — a `<title>` and a `title=""` attribute).

## Files needing NO change

`02` · `09` · `10` · `11` · `13` · `15` · `16` · `17` · `18` · `19` · `20` · `21` ·
`10-2-01/02/03/04`

These sit **after the board's มติ**, so every occurrence is one of: the org name, the
board-resolution value (`เห็นชอบให้ทำความเห็นแย้ง`), the นิติกร's choice
(`เห็นควรทำความเห็นแย้ง`), or a reference to the actual อสส-bound document and its file
names. All correctly keep the word.

---

# ⚠ Open items

> Everything below is **not done** and needs a ruling before it is.

## 1. Notification text lives in JS, not HTML

`01-work-inbox.html:465` was changed, but the same notification is **generated at runtime**
from `assets/ecmis-app.js:2039, 2066, 2073` and `assets/ecmis-shell.js:37`
(`สำนวน … ครบกำหนดยกร่างความเห็นแย้ง`). If the JS overwrites the static markup, the page
will still show the old wording. **Decide whether to change those 4 JS strings too.**

## 2. Process-name occurrences — RESOLVED

The category label follows the instance the user had already changed by hand at
`05-group-director-review.html:774` → **`"10.1 ความเห็นอัยการ"`** (the
`(คำสั่งไม่ฟ้อง/ฟ้องไม่หมด)` parenthetical is dropped as well).

| file:line | before → after | highlighted |
|---|---|---|
| `03-prosecutor-doc.html:691` | `10.1 ความเห็นแย้ง (คำสั่งไม่ฟ้อง/ฟ้องไม่หมด)` → `10.1 ความเห็นอัยการ` | no — `setElText` writes `textContent`, which cannot hold markup |
| `04-legal-director-review.html:703` | same | no — same reason |
| `14-group-director-final-review.html:353` | `กิจกรรมที่ 10.1 · สำนวนความเห็นแย้ง` | **KEPT** — user's decision |

**Note:** all three sites read `currentCase.categoryName || (…ternary…)`, and the seeded
data sets `categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ…"` on every case
(`assets/ecmis-activity10.js:26, 70, 115, …`). The ternary is therefore a fallback that
only renders when `categoryName` is empty — correct, but not visible with the current
demo data.

## 3. Seeded case titles — not changed

`พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริต…` (~16 occurrences, in `01` and
`assets/ecmis-activity10.js`) are demo **case subject lines**, i.e. data rather than UI
labels. Left as-is; flip if you want demo data reworded too.

## 4. Shared JS not swept

`assets/ecmis-activity10.js` (69), `ecmis-app.js` (8), `ecmis-shell.js` (6),
`ecmis-10-2.js` (6). Mostly seeded records, board-resolution values and org names — but
some are **status strings compared with `===`** (e.g.
`currentCase.status === "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ"` at
`05-group-director-review.html:745`). Changing those silently breaks page logic, so
nothing there was touched.

## 5. `07` / `08` — RESOLVED

Decided as **rename only**; see [Items 07 / 08](#items-07--08--decision-card-wording) in
Part 1. Two related strings remain untouched on purpose: `14-group-director-final-review.html`
(`เห็นชอบร่างหนังสือความเห็นแย้ง และเสนอ ผอ.กองกฎหมาย`) and `08:926` — both refer to the
อสส-bound document rather than being the result label, so the อสส rule keeps them.


---

## Original per-file counts (for reference)

`14`(25) · `07`(23) · `13`(20) · `12`(19) · `08`(17) · `05`(16) · `11`(14) · `15`(14) ·
`index`(13) · `22`(13) · `18`(12) · `21`(12) · `04`(9) · `16`(9) · `01`(8) · `17`(8) ·
`20`(8) · `10`(7) · `09`(6) · `19`(6) · `02`(3) · `03`(3) · `10-2-01/02/04`(2 each) ·
`10-2-03`(1) · `design-system`(1) · `assets/ecmis-activity10.js`(69) ·
`assets/ecmis-app.js`(8) · `assets/ecmis-shell.js`(6) · `assets/ecmis-10-2.js`(6)

*(Counts are from before the sweep; they include ORG, CHOICE and อสส-bound occurrences,
most of which were correctly kept.)*
