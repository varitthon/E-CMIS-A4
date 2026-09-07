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

> ⚠ **Option 2 was superseded on 07/09/2026** — see
> [Part 1D](#part-1d--follow-ups-07092026). The `เห็นแย้งตาม…` wording recorded below
> was self-contradictory and has been replaced by `ไม่เห็นชอบตาม…`. **This reverses half
> of a meeting decision and needs a ruling.** Option 1 is unchanged.

Decision: **rename only — no routing change.** Option 2 still sends the case back for revision.

| page | option 1 | option 2 (as decided — now superseded) |
|---|---|---|
| `07-group-director-approval.html` | `เห็นชอบตามคำร่างที่เสนอ` | ~~`เห็นแย้งตามคำร่างที่เสนอ`~~ |
| `08-legal-director-approval.html` | `เห็นชอบตามความเห็นที่เสนอ` | ~~`เห็นแย้งตามความเห็นที่เสนอ`~~ |

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

# Part 1B — Batch B (items 13, 17, 18, 19, 22)

Reference for the intended flow: `../../TO-BE 10.1-User-Flow-split.drawio`, especially
**page 3 "ส่งหนังสือ - แยกตามผลมติบอร์ด"**, which is what several of these items are about.

The TO-BE flow branches the dispatch on the board's resolution:

```
ผลมติจากบอร์ด (LAW0019)
├── เห็นชอบ  → LAW0023  ส่งสำนวนทางไปรษณีย์ให้ อัยการ
└── เห็นแย้ง  → เร่งด่วน?
               ├── ไม่เร่งด่วน → LAW0024  ส่งสำนวนทางไปรษณีย์ให้ อัยการสูงสุด
               └── เร่งด่วน    → LAW0025  ส่งสำนวนให้อัยการสูงสุด ด้วยตนเอง
```

Two things follow from that diagram and shaped the work below:

1. **The destination is a real branch**, not a constant — which is why 17 hardcoding
   "(ส่งถึงอัยการสูงสุด)" was wrong and the meeting asked for a chooser.
2. **เร่งด่วน / ไม่เร่งด่วน maps onto page 18's existing two methods** (ไปรษณีย์ EMS vs
   นำส่งด้วยตนเอง), so no new control was needed there.

> ⚠ **Where the meeting departs from the TO-BE diagram.** The diagram shows the dispatch as
> *either* อัยการ *or* อสส., never both. The meeting asked for
> *"แจ้งทั้ง อสส และ อัยการ (จากเดิมที่กรอกเฉพาะกรณีไปยัง อสส)"*. The build follows the
> meeting, so **the diagram is now out of date on this point** and should be updated, or the
> requirement re-confirmed.

## Item 13 — นิติกรต้องแนบเอกสาร, เห็นแย้งต้องทำ 2 ฉบับ

Decision: **upload on 13, destination on 17** (split, per the working group).

- The single file input became a copy-aware block: **ฉบับที่ 1 + ฉบับที่ 2** when the result
  is **ทำความเห็นแย้ง**, collapsing to one unlabeled slot for **เห็นชอบ** and **ความเห็นอื่นๆ**.
- Driven by the existing `selectOpinionOption()`; also called once on load, because the page
  defaults to DISSENT and the second slot has to be visible immediately.
- Saves `file`, `fileCopy2` and `requiredCopies` (2 for เห็นแย้ง, otherwise 1).
- **Validation is deliberately partial:** it warns only when *one* of the two copies is
  attached. Attaching nothing still auto-generates the draft, because the page already
  promises that (`* ระบบจะสร้างไฟล์ร่างหนังสือความเห็นให้อัตโนมัติหากไม่ได้แนบไฟล์`) and
  hard-blocking would break the demo walkthrough.

## Item 17 — เอาที่ mark ออก + เลือกว่าจะส่งไปไหน

| change | before | after |
|---|---|---|
| card header | ตรวจสอบความถูกต้องของหนังสือ**ความเห็นแย้งฉบับลงนามสมบูรณ์** | ตรวจสอบความถูกต้องของ**หนังสือฉบับลงนามสมบูรณ์** |
| verify item 1 | เลขที่หนังสือส่งภายนอก **(ส่งถึงอัยการสูงสุด)** | เลขที่หนังสือส่งภายนอก |
| destination | *did not exist* | chooser: อัยการสูงสุด (อสส.) · พนักงานอัยการเจ้าของสำนวน · + ส่งทั้งสองหน่วยงาน |

Saved as `dispatchTarget` on the case so page 18 can pick up the recipient. Submitting
without a destination is blocked.

The remaining `ความเห็นแย้ง` strings on 17 are file names and references to the actual
อสส-bound document — kept, per the อสส rule in Part 2.

## Item 18 — ให้แก้ไข form ได้ + แจ้งทั้งสองหน่วยงาน

**The form was never disabled.** `renderAlreadyDispatchedView()` destroys the form and
replaces it with a read-only summary once `statusCode === 'DISPATCHED_TO_PROSECUTOR'` or
`officerDispatchedDate` is set. So "มันปิดอยู่?" was about re-entry, not disabled inputs.

- Added **แก้ไขข้อมูลการจัดส่ง** to the read-only view. It sets a `sessionStorage` flag and
  reloads into the normal form, **pre-filled from the saved case**, with a banner warning
  that saving overwrites. The flag clears on submit.
- Added **ผู้รับที่ 2: พนักงานอัยการเจ้าของสำนวน** behind a checkbox — its own
  หน่วยงานผู้รับ (defaults to the case's `source`), วันที่, ช่องทาง and เลขติดตาม. Saved as
  `notifyProsecutor`, `prosecutorRecipientName`, `prosecutorDispatchDate`,
  `prosecutorDispatchMethod`, `prosecutorTrackingNo`.

## Item 19 — dropdown 9 choice + ⚠ judgement call

Built the dropdown with **intake's 9 options verbatim** (the working group's choice),
`9. อื่นๆ` + free text + validation, saved as `oagVerdictCaseTypeNo` / `oagVerdictCaseTypeName`.

**But the two verdict cards were kept, relabelled `ผลต่อการดำเนินคดี`.** Reason:

- They were the only thing writing `oagVerdictDecision` (`PROSECUTE` / `NON_PROSECUTE`).
- That value is read by `20:460`, `21:472`, `22:515` and `22:605`
  (`finalCaseResolutionSummary`), plus `ecmis-activity10.js:1922-26, 2020`.
- **None of intake's 9 options expresses ฟ้อง vs ไม่ฟ้อง** — they all describe the
  prosecutor's *original* order, which is already captured at 02 and now shown as
  `มติอัยการ` on every page 10-22.

Removing the cards would have deleted the only record of what อสส actually decided,
duplicated data already on the page, and left three downstream pages with nothing to
branch on. So the page now records **which case** (the 9) *and* **what it means for the
case** (the outcome).

~~**Open:**~~ **RESOLVED 07/09/2569 — the meeting did intend the 9 to replace the outcome.**
Senior: *"both the selector is the same thing, but the pre-existing one only have 2 options,
we need the 9 options."* The cards are gone and the dropdown now carries อสส-worded options,
exactly as this note predicted would be necessary. See
[Part 1D §4](#4-19--one-selector-9-options-outcome-derived).

⚠ **The wording of those 9 options was written by the implementer, not the working group,
and still needs a lawyer's sign-off** — see the ⚠ box in Part 1D §4.

## Item 22 — ต้องมีของทั้ง อสส และ อัยการ

Decision: **two sections, one per authority.** ชี้ขาด = อสส (existing), พิพากษา = อัยการ (new).

New **ผลจากพนักงานอัยการ (คำพิพากษา)** block: เลขที่หนังสือ · วันที่ลงในหนังสือ ·
วันที่กองกฎหมายลงรับ · ผลคำพิพากษา (ฟ้องคดีต่อศาลแล้ว / ศาลพิพากษาลงโทษ / ศาลพิพากษายกฟ้อง /
ยุติการดำเนินคดี / อื่นๆ + free text) · สรุปสาระสำคัญ · แนบไฟล์. A badge mirrors the selection
live. Saved under `prosecutorResult*`, and only when a result type is chosen, so the section
can be left empty while waiting.

## Fixes found while building Batch B

**1. Decision cards rendered wrong on 15 and 17 — introduced by this work.** Those pages set
`.form-group label { justify-content: space-between }` (specificity 0,1,1), which outranks
the shared `.decision-card` (0,1,0); since the cards are `<label>` elements, the radio and
text were pushed to opposite edges. Page 08 was unaffected because it has its own card CSS.
Fixed with `.form-group label.decision-card { justify-content: flex-start }` in
`ecmis-shell.css`.

**2. Shared CSS had no cache-busting — this would have broken QA.** `ecmis-shell.css` and
`ecmis-modal.css` were linked with no `?v=`, while the JS uses `?v=20260902_2`. Any tester
with a cached copy would have seen **no yellow review highlights at all** and broken
decision cards, and reported both as defects. Both links now carry `?v=20260904_1` on all
33 pages.

## Browser QA of Batch B (04/09/2026)

Run against a reseeded store (`v45_meeting_01092026`, 15 cases) in Chrome at 1500×950.

**Integration test.** A case was set to `prosecutorCaseTypeNo: "5"` with two ฐานความผิด
(one using a law outside the dropdown) and `dispatchTarget` = both authorities, then the
flow was walked:

| check | result |
|---|---|
| 06 decision cards follow the case | ✅ both read **คำสั่งถอนอุทธรณ์**, not ไม่ฟ้อง |
| 06 มติอัยการ box | ✅ `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` |
| ฐานความผิด 02 → 06 round-trip | ✅ 2 rows restored, มาตรา 157 / 243 |
| custom law round-trip | ✅ `พ.ร.บ.ศุลกากร` mapped back to **อื่นๆ** with its free-text box open |
| มติอัยการ on 10 / 13 / 17 / 22 | ✅ renders on all |
| `undefined` / `NaN` / `[object Object]` in read-boxes | ✅ none |
| console errors across 02, 06, 13, 15, 17, 18, 19, 22 | ✅ none |

### 🐞 Found and fixed — 17's chooser was a dead end

The destination picked on 17 was written to `dispatchTarget` but **page 18 ignored it
completely**: it still showed the hardcoded อสส recipient and left ผู้รับที่ 2 unchecked,
even when ธุรการ had explicitly chosen "ส่งทั้งสองหน่วยงาน". 18's recipient is driven by its
demo `switchScenario()`, which knows nothing about the case field.

Added `applyDispatchTargetFromCase()` on 18 (called after `loadCaseData()`, since the
scenario overwrites the recipient): it shows what ธุรการ chose, auto-checks and expands
ผู้รับที่ 2 when the target includes พนักงานอัยการ, and re-points the primary recipient when
the target is พนักงานอัยการ only.

### 🐞 Found and fixed — seed data had ป.ป.ท. offices as the prosecutor's office

4 of the 15 seeded cases carried a **ป.ป.ท. regional office** in `source`, which every page
displays as **หน่วยงานอัยการต้นทาง** (the originating *prosecutor's* office). Pre-existing
demo-data error, but it also fed 18's new ผู้รับที่ 2 prefill, so demoing one of those cases
showed ป.ป.ท. as the prosecutor being notified.

**Safe to correct**, because each case already records the ป.ป.ท. office separately in
`accuser` — nothing was lost:

| case | `source` before | `source` after | `accuser` (unchanged) |
|---|---|---|---|
| คดี-100001/2569 | สนง. ป.ป.ท. เขต 3 | สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต**ภาค 3** | สำนักงาน ป.ป.ท. เขต 3 |
| คดี-100002/2569 | สนง. ป.ป.ท. เขต 1 | …**ภาค 1** | สำนักงาน ป.ป.ท. เขต 1 |
| คดี-100003/2569 | สนง. ป.ป.ท. เขต 4 | …**ภาค 4** | สำนักงาน ป.ป.ท. เขต 4 |
| คดี-100016/2569 | สนง. ป.ป.ท. เขต 5 | …**ภาค 5** | สำนักงาน ป.ป.ท. เขต 5 |

Regional cases use the **ภาค N** form of the office, matching the ป.ป.ท. เขต they came from;
the other 11 cases keep the central form (`…ปราบปรามการทุจริต N`).

**6 occurrences across 2 arrays** were corrected — `INITIAL_CASES` *and*
`PACC_INTAKE_DATABASE` (the lookup 02 autofills from). Cases `100001` and `100002` appear in
both arrays by design, which is why the file had 6 lines for 4 cases.

`DATA_VERSION` bumped to **`v46_fix_seed_prosecutor_source`**, because seeded values changed
and `loadCases()` prefers `localStorage` — without the bump nobody would see the correction.
Verified: the app auto-reseeded, all 4 cases now show the prosecutor office, `accuser` intact,
and 18's ผู้รับที่ 2 prefills correctly.

> Note for testers: bumping the version leaves the **old key orphaned** in `localStorage`
> (e.g. `…_v45_…` alongside `…_v46_…`). Harmless, but clear *all* `ecmis_act10_cases_*` keys
> when starting a clean run, not just one.

### Note on the QA plan

`qa-batch-a-meeting-01092026.md` §0.1 tells the tester to clear `localStorage`. That is
necessary but was **not sufficient** until the CSS cache-busting fix above — a cached
`ecmis-shell.css` would have hidden every yellow highlight regardless of storage state.

---

# Part 1C — follow-ups after the Batch B review

## ฐานความผิด — required fields now marked, ฐานความผิด enforced (`1549719`)

The block's fields were validated but never marked, so nothing on screen told ธุรการ they
were mandatory until the form was rejected on save.

- **กฎหมาย, มาตรา and ฐานความผิด** all carry the red `*`.
- **ฐานความผิด is now enforced** alongside มาตรา — a row with a section number but no offence
  description is half-useless for the Dashboard this block exists to feed.
- Completely blank rows are still dropped silently, so adding a row you don't fill costs nothing.
- Applies to **02 and 06** automatically — it is the shared widget.

Two things this surfaced:

- `.form-group label` sets `justify-content: space-between`, which flung the asterisk to the
  far right of each column. Fine for a full-width field, wrong for compact repeated rows where
  it reads as belonging to the next column. These row labels are pinned to `flex-start`.
- **The first attempt appeared to do nothing.** `ecmis-offense-basis.js` is loaded with `?v=`,
  and editing the file without bumping it served a cached copy — the same trap as the
  unversioned CSS. Bumped to `?v=20260904_2`. **Any edit to a `?v=`-tagged asset needs the
  version bumped, or nobody sees it.**

## 03 — duplicated ผู้ร้อง / จำเลย collapsed (`ce5ee29`)

The issue the meeting raised for 02 (*"ซ้ายขวาคนเดียวกันลดเหลืออันเดียว"*) was still present
on **03**: ผู้กล่าวหา sat beside an always-empty **ผู้ร้อง**, and ผู้ถูกกล่าวหา beside an
always-empty **จำเลย**.

The seed data settles it: `petitioner` is `""` on all 15 cases, and the single non-empty
`defendant` in `PACC_INTAKE_DATABASE` holds the **same name** as `accused` on the same record
(`นายสมชาย ทุจริตมั่น`). One person — the second column could never carry anything new.

03 now matches 02: **ผู้กล่าวหา (ผู้ร้อง)** and **ผู้ถูกกล่าวหา (จำเลย)** in a single row, with
the dead read-boxes and their `setElText` calls removed. Labels left unhighlighted, matching
how 02 was already written, so the two pages read identically.

Also removed 6 lines of dead code in **02** that still wrote to `f_petitioner` / `f_defendant`
after those elements were deleted — guarded, so harmless, but misleading to the next reader.

**Scope checked:** no other page carries these ids or labels. 02 and 03 were the only two.

---

# Part 1D — follow-ups 07/09/2026

Triggered by a review of `08-legal-director-approval.html`: the นิติกร had signed the
opinion but `08` never showed it. Fixing that exposed three further inconsistencies on
the same card, and then a wording defect that traces back to Items 07/08 above.

Full write-up: [`session-07092026-attestation-and-labels.md`](session-07092026-attestation-and-labels.md).

## 1. ⚠ `เห็นแย้งตาม…` → `ไม่เห็นชอบตาม…` — NEEDS A RULING

**This reverses half of the [Items 07 / 08](#items-07--08--decision-card-wording) decision.**
Recorded here because the meeting chose that wording; it should be confirmed or overturned
by whoever set it, not left to the implementer.

The rename produced a self-contradictory label. `ตาม` means *in accordance with*;
`เห็นแย้ง` means *to dissent* — so `เห็นแย้งตามความเห็นที่เสนอ` reads "dissent in
accordance with the proposed opinion". Option 1 works precisely because `เห็นชอบ` and
`ตาม` point the same way; option 2 inherited the frame and inverted only half of it.

Worse, `ความเห็นแย้ง` is the term of art for the document being approved on these screens,
so the label is readable as **"file the dissent as proposed"** — the opposite of what the
option does. Both radio options could then be read as "proceed", and it was the rework
path that was ambiguous.

The label was also the *only* thing on that path saying it. Everything else already said
"send back":

| | `08` said |
|---|---|
| caption | `(ส่งสำนวนกลับไปยังกลุ่มงานความเห็นแย้งเพื่อทบทวน)` |
| radio value | `RETURN` |
| confirm dialog | `ยืนยันการส่งกลับแก้ไข` / `ส่งเรื่องกลับให้กลุ่มงานความเห็นแย้งแก้ไข` |
| store branch | `statusCode = "DRAFTING_OPINION"`, back to `legal_officer` |

| page | before | after |
|---|---|---|
| `07-group-director-approval.html` (card label + confirm-dialog summary, 2 places) | `เห็นแย้งตามคำร่างที่เสนอ` | `ไม่เห็นชอบตามคำร่างที่เสนอ` |
| `08-legal-director-approval.html` | `เห็นแย้งตามความเห็นที่เสนอ` | `ไม่เห็นชอบตามความเห็นที่เสนอ` |
| `15-legal-director-final-review.html` | `เห็นแย้งตามความเห็นที่เสนอ` | `ไม่เห็นชอบตามความเห็นที่เสนอ` |

`ไม่เห็นชอบตาม…` is the direct antonym of option 1, structurally parallel, and avoids the
`เห็นแย้ง` term-of-art collision. **No routing, values or captions changed** — the meeting's
"rename only, no routing change" constraint still holds.

`15` was carrying the same broken label **unmarked** — `0e4b14f` rewrote its `<select>` into
two decision cards and introduced both labels without wrapping either in
`<mark class="wording-changed">`, so a reviewer scanning for yellow would have walked past
both. Both are now marked.

**Left alone (correct Thai, different construction):** `ยกร่างความเห็นแย้งตามขั้นตอนกฎหมาย`
/ `…ตามกรอบเวลา` / `ชี้ขาดความเห็นแย้งตามกฎหมาย` on `04`, `05`, `06`, `18` — there
`ความเห็นแย้ง` is the noun and `ตาม` attaches to what follows.

## 2. Wording sweep continued on `08` (3 labels)

Same CHANGE rule as Part 2 — headings and field labels written before the reader decides.
Logged here rather than in the Part 2 tally, which is scoped to the 01/09 sweep.

| `08-legal-director-approval.html` | before | after |
|---|---|---|
| card header | `บันทึกความเห็นแย้ง (นิติกร) และผลการกลั่นกรอง (ผอ.กลุ่มงาน)` | `บันทึกความเห็น (นิติกร) และ…` |
| block title | `ความเห็นแย้งที่นิติกรเจ้าของสำนวนจัดทำ:` | `ความเห็นที่นิติกรเจ้าของสำนวนจัดทำ:` |
| field label | `สาระสำคัญ / เหตุผลข้อเท็จจริงและข้อกฎหมายที่เห็นแย้ง` | `…ข้อกฎหมายที่เห็น` |

⚠ **The third one dangles.** `ที่เห็นแย้ง` is the verb *to dissent*, so removing only
`แย้ง` leaves "…that [one] sees". The literal removal was applied as instructed;
`สาระสำคัญ / เหตุผลข้อเท็จจริงและข้อกฎหมาย` is the cleaner cut if the intent was a label
that reads naturally. **Open — one-token change either way.**

`07` still says `…ที่เห็นแย้ง` on the same field. The two pages now differ; left as-is
because the instruction scoped the removal to `08`.

## 3. `06` / `13` — เห็นชอบ moved first, and is now the default

**Behaviour change, approved 07/09/2026.** Not a meeting item, but it changes which option
a นิติกร submits by doing nothing, so it belongs in this register.

`06` and `13` are the two นิติกร authoring screens. Both carried the same three options in
the same order, with the same ids, and both **defaulted to the escalating one**:

```
เสนอทำความเห็นแย้ง… (checked)  |  เห็นชอบตาม…  |  ความเห็นอื่นๆ
```

The default was doubled — the submit handler *also* fell through to dissent:

```js
let opinionCode = "DISSENT";              // ← fall-through
if (isAgree) { … } else if (isOther) { … }
```

So a นิติกร who never touched the radio filed a **ความเห็นแย้ง**, which routes to
เลขาธิการ ป.ป.ท. and on to อสส. — the most consequential path in the flow, reached by
inaction.

**Now, on both pages:**

| | before | after |
|---|---|---|
| order | เห็นแย้ง · เห็นชอบ · อื่นๆ | **เห็นชอบ · เห็นแย้ง · อื่นๆ** |
| `checked` | `op_dissent` | **`op_agree`** |
| initial card highlight | `active-dissent` | **`active-agree`** |
| submit fall-through | `DISSENT` | **`AGREE`**, with an explicit `if (isDissent)` branch |

`อื่นๆ` stays last — catch-all last is right either way. The grid is `repeat(3, 1fr)`, so
เห็นแย้ง sits in the middle, not on the right.

This also aligns `06`/`13` with `07`, `08`, `14`, `15`, which all put เห็นชอบ first **and**
default to it. The rule now holds across every decision screen: **the checked default is the
first option, and it is the non-escalating one.**

### Audit of the other `decision-card` screens

| page | verdict |
|---|---|
| `07`, `08`, `14`, `15` | already approve-first and approve-checked — **no change** |
| `10-2-04-group-director-verify` | options rendered from data (`o.value === verifyResult`), not a fixed agree/reject pair — **N/A** |
| `17-legal-admin-external-dispatch-receive` | `target_oag` / `target_prosecutor` is a routing choice, not agree/reject — **N/A** |
| `design-system` | sample markup only |

### 🐞 Found and fixed — `13` had a derived `isDissent` that the new default would have broken

`13` computed, ~50 lines below the branch:

```js
const isDissent = !isAgree && !isOther;   // gates the "ความเห็นแย้ง needs 2 files" rule
```

That was only ever correct **because dissent was the fall-through default**. It now reads
the radio directly (`op_dissent.checked`), which is what the guard and `requiredCopies`
actually mean.

Caught because the first edit produced `SyntaxError: Identifier 'isDissent' has already
been declared` — the whole page's script failed to parse and every button was dead. Worth
noting: `13`'s form is hidden unless the case is at `PENDING_OFFICER_FINAL_DOC`, so a
casual look at the page would not have shown the breakage.

## 4. `19` — one selector, 9 options, outcome derived

Closes the **Open** question on [Item 19](#item-19--dropdown-9-choice---judgement-call).
Senior's ruling: the two selectors are the same question, and the 9-option version wins.

`ผลต่อการดำเนินคดี` (the 2 cards) is gone. `กรณีคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)` is now
the only control, and `oagVerdictDecision` is **derived** from it via a single table,
`OAG_VERDICT_OUTCOME`, declared directly above the logic in `19`.

| # | option | → |
|---|---|---|
| 1 | อสส. ชี้ขาดให้ฟ้องคดี | `PROSECUTE` |
| 2 | อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง | `NON_PROSECUTE` |
| 3 | อสส. ชี้ขาดไม่ให้ถอนฟ้อง (ให้ดำเนินคดีต่อ) | `PROSECUTE` |
| 4 | อสส. ชี้ขาดยืนตามการถอนฟ้อง | `NON_PROSECUTE` |
| 5 | อสส. ชี้ขาดให้อุทธรณ์ | `PROSECUTE` |
| 6 | อสส. ชี้ขาดยืนตามคำสั่งไม่อุทธรณ์/ถอนอุทธรณ์ | `NON_PROSECUTE` |
| 7 | อสส. ชี้ขาดให้ฎีกา | `PROSECUTE` |
| 8 | อสส. ชี้ขาดยืนตามคำสั่งไม่ฎีกา/ถอนฎีกา | `NON_PROSECUTE` |
| 9 | อื่นๆ | **cannot be derived — ธุรการ picks the outcome in a sub-field** |

A coloured strip under the dropdown shows which way the system read the choice, so the
derivation is never invisible. Submitting is blocked if `9` is chosen without both the free
text and an explicit outcome, and again by a final guard if the outcome is unresolved for
any reason — `20`/`21`/`22` must never receive a blank.

### ⚠⚠ THE 9 LABELS ARE NOT AUTHORITATIVE — a lawyer must sign them off

**These are the implementer's words, not the working group's, and not from any source
document.** Nothing in the repo, the meeting PDF or the mockups contains an อสส-worded list;
it was written from the shape of intake's 1–9. It is a *plausible* pairing, not a verified one.

**Why this is not cosmetic.** The label is no longer just text on a screen — it now decides
`oagVerdictDecision`, which is the branch `20`, `21` and `22` use to say whether the case
proceeds or is closed. **A wrong label is a wrong routing decision on a criminal case file.**

**The two to check first — 3 and 4, the ถอนฟ้อง pair.** These are the least certain:

- Withdrawal (`ถอนฟ้อง`) happens *after* charges are already filed, unlike the other eight,
  which are all decisions not to start or not to escalate. So "the case proceeds" here means
  *an existing prosecution continues*, not that a new one begins.
- `3. ชี้ขาดไม่ให้ถอนฟ้อง` is therefore mapped `PROSECUTE` on the reading "case proceeds."
  If ป.ป.ท. reads `PROSECUTE` strictly as "อสส. orders charges to be filed," **this mapping
  is wrong** and 3 belongs somewhere else entirely.
- Whether อสส can even refuse a withdrawal in this posture is a question of ป.วิ.อ. practice
  that the implementer is not qualified to answer. **If it cannot, option 3 should not exist.**

**Also worth a lawyer's eye:** 5 and 7 fold `ไม่อุทธรณ์` together with `ถอนอุทธรณ์` (and
`ไม่ฎีกา` with `ถอนฎีกา`) into single "ยืนตาม" options, collapsing intake's separate 3/4/5
and 6/7/8. That was done to keep the list at nine. If the distinction matters legally, the
list needs to be longer.

**To change the wording:** edit the `<option>` labels in `19` and the matching key in
`OAG_VERDICT_OUTCOME` in the same file. Two edits, one file, nothing else depends on the text.

### 🐞 Found and fixed — the store was silently discarding the 9-option choice

`submitLegalAdminOAGVerdictIntake` (`assets/ecmis-activity10.js`) **never copied
`oagVerdictCaseTypeNo` / `oagVerdictCaseTypeName` out of the payload.** `19` has been
building both since Batch B and throwing them away ever since; nobody noticed because the
cards carried the outcome separately. With the cards removed this would have discarded the
entire field. Both are now persisted.

### 🐞 Found and fixed — `20`/`21`/`22` hardcoded "ให้ฟ้องคดี" for every `PROSECUTE`

All three printed a fixed badge, `อสส. ชี้ขาดให้ฟ้องคดี`, whenever the decision was not
`NON_PROSECUTE`. That was accurate while the only two choices were ฟ้อง / ไม่ฟ้อง. **Widening
the list to nine broke it**: choosing `5. ชี้ขาดให้อุทธรณ์` displayed *"ให้ฟ้องคดี"* on all
three downstream pages — describing the ruling as something it was not.

The badge text now comes from `oagVerdictCaseTypeName` (the option actually chosen), while
colour and icon still come from `oagVerdictDecision`, which is what genuinely means
"proceeds vs closed". `oagVerdictDecisionText` and `22`'s `finalCaseResolutionSummary` follow
the same rule. Cases saved before 07/09/2569 have no `oagVerdictCaseTypeName`, so all four
sites fall back to the old binary wording.

### Other cleanup on `19`

- The two orphaned `</div>` left by commenting the cards out had been closing the card early
  — everything from สรุปสาระสำคัญ down had fallen outside it. Repaired.
- `selectedDecision` no longer initialises to `'PROSECUTE'`; it starts `null` and is always
  derived. The old initialiser was the value the cards used to overwrite.
- `switchScenario` deleted — dead since its scenario-bar buttons were removed earlier, and it
  was the last other writer of `selectedDecision`.
- Dead `.verdict-card` / `.verdict-selector-grid` / `.verdict-icon` CSS removed. ⚠ While doing
  this the neighbouring `.form-actions`, `.btn*`, `.badge`, `.font-monospace`, `.d-none` and
  `.btn-mic` rules were deleted by accident and had to be restored — they shared the block.

## 5. `17` — recipients are checkboxes now, not radio + a "both" box

> ⚠ **SUPERSEDED 07/09/2026.** The checkbox pair described in this section is gone. `17`'s
> recipient UI is now a **derived, read-only panel** — the นิติกร's opinion at `06`/`13`
> (เห็นชอบ/เห็นแย้ง) decides the recipient set by itself, with no manual picker at all. See
> [§7 below](#7-recipients-reworked-again--per-recipient-dispatch-derived-not-picked) for the
> rework and why the checkbox model (still correct in isolation) turned out to be the wrong
> layer entirely.

Reported as *"the ui is visually bad… when the radio only ticked for อสส but both is bordered."*
Correct, and it was a real defect.

### 🐞 The bug

`selectDispatchTarget('BOTH')` had a ternary that returned the same value on both branches:

```js
if (oagCard) oagCard.className = on ? "decision-card active-approve"
                                    : "decision-card active-approve";   // ← identical
```

So the อสส card **stayed highlighted even after unticking "both"**. And ticking it added a
highlight to both cards without touching the radios — so อสส's radio stayed filled and
พนักงานอัยการ's stayed empty. Two bordered cards, one filled radio.

### The fix — the model was wrong, not just the CSS

The meeting requires *เห็นแย้งก็แจ้งทั้ง อสส และ อัยการ*, so **sending to both is a normal
outcome, not an exception.** Radios say "pick exactly one", which is false here; the separate
`ส่งทั้งสองหน่วยงาน` checkbox existed only to work around that, and created a second source of
truth that could disagree with the radios.

Both recipients are now **checkboxes**, and the standalone "both" box is gone — ticking both
*is* both. Each card's highlight is driven by its own checkbox, so the contradictory state is
now unrepresentable. A hint line under the pair reports what is selected, including a warning
when nothing is.

**Nothing downstream changed.** `18` parses the saved string by substring
(`indexOf('อัยการสูงสุด')` / `indexOf('พนักงานอัยการ')`), and `getDispatchTargetName()` still
emits `อัยการสูงสุด (อสส.) และ พนักงานอัยการเจ้าของสำนวน` byte-for-byte for the both case.

Verified: all four states (neither / อสส only / อัยการ only / both) keep card, checkbox and
saved string in agreement; submit is blocked when neither is ticked; `17` → `18` still
auto-opens ผู้รับที่ 2 and still switches the primary recipient for the อัยการ-only branch.

## 6. Flow 3 does **not** branch on มติอัยการ

Asked whether Flow 3 needs testing across the nine มติอัยการ values. **It does not** — and the
distinction matters for how the QA time is spent.

| axis | does Flow 3 branch on it? |
|---|---|
| **มติอัยการ (1–9)** — the prosecutor's original order | **No.** `17`/`18` only *display* `prosecutorCaseTypeName`. Neither file references `PROSECUTOR_ORDER_PHRASE` or `prosecutorCaseTypeNo`; the only `ไม่ฟ้อง` strings are fallbacks for a missing value |
| **เห็นชอบ vs เห็นแย้ง** — the นิติกร's opinion | **Yes** — `18:823`, and this is what the meeting note is actually about |

Verified by forcing a case to `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` and walking it through `18`:
the value displayed correctly and no hardcoded ไม่ฟ้อง leaked. **One spot-check with a non-`1`
case is sufficient; nine runs add nothing.**

Both เห็นชอบ/เห็นแย้ง branches are already seeded, one case each — see the QA guide's Flow 3
entry section.

⚠ **Fragility noted, not fixed:** the branch falls back to `title.includes('เห็นชอบ')` when
`finalOpinionType` is absent, so a case whose *title* happens to contain เห็นชอบ takes the
agreed branch regardless of its real opinion. Pre-existing.

## 7. Recipients reworked again — per-recipient dispatch, derived not picked

Later the same day (07/09/2026), §5's checkbox pair was replaced outright. The checkboxes fixed
the *representation* bug (contradictory card/radio state) but kept the wrong *model*: a นิติกร
picking recipients by hand, when the recipients are never actually a free choice — they are
fully determined by the opinion already recorded at `06`/`13`.

`17`'s recipient UI is now a **derived, read-only panel**: เห็นชอบ shows อัยการต้นทางเท่านั้น;
เห็นแย้ง shows both อสส. **and** อัยการต้นทาง. Nothing to tick, nothing to get wrong. `18` then
gives each derived recipient its **own tab** with its own delivery record
(`dispatchRecipients[]`), and each tab picks EMS or hand-delivery **independently** — one
recipient can go by EMS while the other is hand-delivered on a different day.

Knock-on changes worth recording here:

- The delivery **method is chosen freely per recipient.** เห็นชอบ is no longer EMS-only, and the
  method selector is never hidden — this reverses the earlier behaviour (§3/§4 era) where a
  เห็นชอบ case was forced onto EMS.
- The work-inbox status text now carries progress (`บันทึกแล้ว n/m`) while a recipient's tab is
  still unsaved, and the completion text names the number of agencies notified — claiming
  "ส่งทาง EMS" only when **every** recipient actually went by EMS, not just the first one saved.
- The recipient tabs are keyboard-navigable (`role="tab"` / `aria-selected`, arrow keys). The
  §5 checkboxes/cards were `<div onclick>` with no keyboard access at all.
- The flat fields (`dispatchMethod`, `emsTrackingNo`, `oagReceiveDocNo`, `dispatchRecipientName`,
  `dispatchScenario`, `dispatchRecipientType`) that `19` and Flow 4 read are preserved
  byte-for-byte — they are now a **projection** of the อสส. recipient's record (or the sole
  recipient's, for เห็นชอบ), written by `saveDispatchRecipient()` each time a tab is saved.

The nine อสส-ruling labels' lawyer sign-off item in `qa-findings-register.md` **C4** is
unaffected by this rework and remains open — see that file.

## 8. Presentation clean-up at sign-off (07/09/2569)

Three small changes made once the wording was settled. None of them alters data or logic.

**Yellow review highlights removed — the sweep is signed off.** All 46
`<mark class="wording-changed">` wrappers across 22 pages were unwrapped and the
`REVIEW MARKER` block deleted from `assets/ecmis-shell.css`. The text inside every marker
was preserved exactly; this was verified mechanically by stripping all tags from each file
before and after and comparing the result. Eleven of the tags were prettier-wrapped across
two lines (`<mark class="wording-changed"` with the `>` on the next line), so a line-based
`sed` would have corrupted them — the unwrap was done with a multi-line-aware pass.
Part 2's "To finalise" instruction below is now **done**, not pending.

**Tab status chips use Font Awesome, not emoji** (`18-officer-external-dispatch.html`).
The chips read `✅ บันทึกแล้ว` / `⚠ ยังไม่ได้กรอก`. Three problems: the two emoji were written
inconsistently — the warning in the chip had no variation selector while the one in the
missing-opinion strip had `U+FE0F` — so they rendered as different glyph styles on the same
page; emoji carry fixed colours that fight the chip's own green/amber palette; and screen
readers announce the emoji name before the Thai label. Both now use the icons the opinion
badges on the same page already use, `fa-circle-check` and `fa-triangle-exclamation`, which
inherit `currentColor`. There are now no emoji in any `activity10/*.html`.

> Font Awesome loads from `cdnjs.cloudflare.com`, so **every icon in the mockup is blank
> when a page is opened over `file://` with no internet.** That predates this change and is
> not made worse by it, but it matters for any offline demo. Fixing it means inlining the
> SVGs — a whole-mockup migration, not a swap, and deliberately not attempted here.

**`19`'s historical card carries a read-only marker, not a redundant one.** Its header pill
read `เคยส่ง อสส. ชี้ขาดแล้ว` — which restated the card's own title (`…ถึง อสส. (เดิม)`) and the
field inside it (`ช่องทางและหลักฐานการจัดส่งให้ อสส. (เดิม)`), three statements of one fact. The
wording was also off: `เคย…แล้ว` stacks two completion markers, and `ส่ง อสส. ชี้ขาด` is missing
`ให้`, so it parses as sending อสส. rather than sending *to* อสส. Replaced with
`ข้อมูลเดิม (อ่านอย่างเดียว)` in muted grey, which says what the title does not — that this card,
unlike the form below it, cannot be edited.

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

> ✅ **Removed 07/09/2569 at sign-off.** This section describes how the sweep was reviewed;
> the highlighting itself no longer exists. See [Part 1D §8](#8-presentation-clean-up-at-sign-off-07092569).

While under review, every changed label was wrapped in `<mark class="wording-changed">`, styled
yellow in `assets/ecmis-shell.css` (all 32 pages link it).

⚠ **`ecmis-shell.css` and `ecmis-activity10.js` are both `?v=`-pinned. Bump the version on
every page after editing either, or the change is invisible behind a warm cache** — this
has now cost time three separate times (see Part 1C and Part 1D).

**Finalised 07/09/2569:** the `REVIEW MARKER` block was deleted from `assets/ecmis-shell.css`
and all 46 `<mark class="wording-changed">` tags across 22 pages were unwrapped, text
preserved. Nothing in the repo references `wording-changed` any more.

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

> Counts above are the 01/09 sweep only. `08` gained **3 more** changed labels on 07/09/2026
> — see [Part 1D](#part-1d--follow-ups-07092026).

## Files needing NO change

`02` · `09` · `10` · `11` · `13` · `15` · `16` · `17` · `18` · `19` · `20` · `21` ·
`10-2-01/02/03/04`

> **`15` carried `wording-changed` marks anyway.** Not from this sweep — `0e4b14f`
> introduced both of its decision-card labels unmarked, and 07/09/2026 marked them while
> fixing the `เห็นแย้งตาม…` defect. See [Part 1D](#part-1d--follow-ups-07092026). Those marks
> were unwrapped with all the others at sign-off; the label text itself is unchanged.

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

## 5. `07` / `08` — RESOLVED, then partly REOPENED

Decided as **rename only**; see [Items 07 / 08](#items-07--08--decision-card-wording) in
Part 1. Two related strings remain untouched on purpose: `14-group-director-final-review.html`
(`เห็นชอบร่างหนังสือความเห็นแย้ง และเสนอ ผอ.กองกฎหมาย`) and `08:926` — both refer to the
อสส-bound document rather than being the result label, so the อสส rule keeps them.

⚠ **Reopened 07/09/2026:** the option-2 label the rename produced (`เห็นแย้งตาม…`) was
self-contradictory and has been replaced by `ไม่เห็นชอบตาม…` on `07`, `08` and `15`.
That reverses half of this decision, so it **needs a ruling** — see
[Part 1D](#part-1d--follow-ups-07092026).


---

## Original per-file counts (for reference)

`14`(25) · `07`(23) · `13`(20) · `12`(19) · `08`(17) · `05`(16) · `11`(14) · `15`(14) ·
`index`(13) · `22`(13) · `18`(12) · `21`(12) · `04`(9) · `16`(9) · `01`(8) · `17`(8) ·
`20`(8) · `10`(7) · `09`(6) · `19`(6) · `02`(3) · `03`(3) · `10-2-01/02/04`(2 each) ·
`10-2-03`(1) · `design-system`(1) · `assets/ecmis-activity10.js`(69) ·
`assets/ecmis-app.js`(8) · `assets/ecmis-shell.js`(6) · `assets/ecmis-10-2.js`(6)

*(Counts are from before the sweep; they include ORG, CHOICE and อสส-bound occurrences,
most of which were correctly kept.)*
