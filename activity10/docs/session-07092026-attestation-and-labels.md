# 07/09/2026 — signature blocks, a wording defect, and a safer default

Meeting decisions this touches: [`meeting-01092026-changes.md`](meeting-01092026-changes.md)
— Part 1D records the two items there that **need a ruling**.

**Started as:** *"we should include the นิติกร signature on `08` as well — decide where it
should go."* Fixing that exposed three more inconsistencies on the same card, then a wording
defect traceable to the meeting's Items 07/08, then two caching bugs that were hiding all of
it. A separate question about option ordering on `06` then turned up a third defect.

| | |
|---|---|
| **Files changed** | 38 — `06`, `07`, `08`, `13`, `15`, `19`, `20`, `21`, `22`, `assets/ecmis-shell.css`, `assets/ecmis-activity10.js`, 2 docs, + the rest touched only for a `?v=` bump |
| 🚨 **BLOCKING** | **The 9 อสส-ruling labels on `19` were written by the implementer, not the working group. They now decide case routing. A lawyer must sign them off — [§7](#7-19--one-selector-9-options-outcome-derived).** |
| **Needs a ruling** | `เห็นแย้งตาม…` → `ไม่เห็นชอบตาม…` (reverses half a meeting decision); the dangling `…ที่เห็น` label |
| **Behaviour changed** | `06`/`13` now default to **เห็นชอบ** instead of ความเห็นแย้ง — approved in-session |
| **Verified** | every page driven in-browser; `07` → store → `08` handoff exercised through the real call site; submit branches exercised with `Swal` stubbed; no console errors |

---

## 1. The problem on `08`

`submitOfficerOpinion` has always stored `officerOpinionSignature`
(`assets/ecmis-activity10.js:1486`) and `07` has always rendered it. `08` — the ผอ.กองกฎหมาย
screen, whose entire job is *who vouched for this* — never read it. The card showed the
ผอ.กลุ่มงาน signature and nothing from the นิติกร.

Three further mismatches on the same card, all pre-existing:

| | นิติกร half | ผอ.กลุ่มงาน half |
|---|---|---|
| owner | labelled field with the name | **nothing** |
| decision | labelled field, red + ⚠ | **unlabelled green badge in the header** |
| narrative | labelled `สาระสำคัญ / เหตุผล…` | **no label at all** |

The ผอ.กลุ่มงาน had a signature with no printed name beside it. The name existed — `07`
hardcodes `นายอานนท์ ชินประชา` in its reviewer field — but was never persisted, so `08`
could not show it. On a chain-of-custody screen that is the weaker half of the pair, and it
matters because there are several กลุ่มงาน.

## 2. What was built — two peer attestation blocks

Both halves now share one structure: **owner | decision → narrative → signature + date.**

```
┌ .attest-block ─ slate ────────── ความเห็นที่นิติกรเจ้าของสำนวนจัดทำ: ┐
│ นิติกรเจ้าของสำนวน            │ ผลการตรวจพิจารณาที่นิติกรเสนอ         │
│ สาระสำคัญ / เหตุผล…                                                  │
│ ลายมือชื่ออิเล็กทรอนิกส์ (นิติกรเจ้าของสำนวน):  [✍]  ลงนามเมื่อ …      │
└──────────────────────────────────────────────────────────────────────┘
┌ .attest-block--screening ─ blue ─ ผลการกลั่นกรองของ ผอ.กลุ่มงาน…: ────┐
│ ผอ.กลุ่มงานความเห็นแย้ง       │ ผลการกลั่นกรอง                        │
│ บันทึกการกลั่นกรอง                                                    │
│ ลายมือชื่ออิเล็กทรอนิกส์ (ผอ.กลุ่มงานความเห็นแย้ง):  [✍]  ลงนามเมื่อ … │
└──────────────────────────────────────────────────────────────────────┘
```

Reads top-to-bottom as the approval chain: *who drafted → their signature → who screened →
their signature.*

### Why these choices

**A signature sits under the statement it attests to,** not beside the name field. The name
row is facts; the signature certifies the opinion. This is also what `07` already did.

**Colour carries the role,** so you know whose block you are in before reading: slate =
drafter, blue = screener. Blue was already the screening colour on `07`/`08`/`15`/`16`; a
second blue panel would have flattened that meaning.

**The green badge became a labelled field.** It had no label — `เห็นชอบตามคำร่างที่เสนอ และ
เสนอ ผอ.กองกฎหมาย` only read as a screening result from position. Both decision strings are
long, and badges wrap badly. It was also redundant: the card header already carries
**ผ่านการกลั่นกรองแล้ว** as the at-a-glance signal. The semantic colour survived the move —
green text + ✓, mirroring the นิติกร decision's red + ⚠.

**`07` gets the same block** for the นิติกร half only. There is no completed ผอ.กลุ่มงาน
attestation to show there — that is the form the user is filling in.

### Where the CSS lives

`.attest-block` / `.sign-strip` went into **`assets/ecmis-shell.css`**, not a second
page-local copy — same call as `.decision-grid` in item 15. `08`'s inline copy was removed.

Two details worth keeping:

- `.attest-block .read-box { background-color: #fff }` — `.read-box` defaults to
  `var(--bg-body)`, a light grey that goes muddy on the tint and loses its edges.
- The `ลงนามเมื่อ` date sits in `.sign-strip-row` *below* the label, not beside it. In one
  flex row the label is wider than the signature image and pushes the date far from it.

## 3. `groupDirectorName` now persists

`submitGroupDirectorApproval` takes a 5th `reviewerName` argument and writes
`item.groupDirectorName`. `07` passes its reviewer field, which was given the id
`in_groupDirectorName`.

`08` reads `currentCase.groupDirectorName` with the hardcoded name as fallback — matching how
`f_officerName` already works there — so cases approved before this change still render.

## 4. Bug found: stale `groupDirectorReturnNotes`

`submitGroupDirectorApproval` clears `groupDirectorApprovedDate` and
`groupDirectorEndorsement` when a case is returned, but **never clears
`groupDirectorReturnNotes` on a later approval** (`assets/ecmis-activity10.js:1521`). A case
returned once and then approved carries both markers.

Colouring the new decision field off `returnNotes` alone would have shown a genuinely
approved case as "returned" forever. The check is `returnNotes && !approvedDate`. Both paths
were exercised:

| case | result |
|---|---|
| returned, never approved | amber ↺ `ส่งกลับให้นิติกรเจ้าของสำนวนแก้ไข` |
| returned once, then approved | green ✓ `เห็นชอบตามคำร่างที่เสนอ` — stale `returnNotes` ignored |

The store was left as-is; this is a display-side guard. **Clearing `returnNotes` on approve
would be the deeper fix** — not done, because other pages may read it.

## 5. Wording — see Part 1D

Two items, both needing a ruling, both recorded in
[`meeting-01092026-changes.md` Part 1D](meeting-01092026-changes.md#part-1d--follow-ups-07092026):

1. `เห็นแย้งตาม…` → `ไม่เห็นชอบตาม…` on `07`, `08`, `15` — reverses half of Items 07/08.
2. `…ข้อกฎหมายที่เห็นแย้ง` → `…ที่เห็น` on `08` — the literal removal dangles; `07` still
   differs.

## 6. `06` / `13` — เห็นชอบ first, and now the default

Asked separately: *"the reject option should come after agree, right?"* — yes, but the order
turned out to be coupled to the default, which mattered more.

`06` (draft the opinion) and `13` (draft the letter after the board's มติ) are the two
นิติกร authoring screens. Identical three-option pattern, identical ids
(`op_dissent` / `op_agree` / `op_other`), and both **defaulted to the escalating option** —
doubled, because the submit handler also fell through to it:

```js
let opinionCode = "DISSENT";              // ← fall-through
if (isAgree) { … } else if (isOther) { … }
```

A นิติกร who never touched the radio filed a ความเห็นแย้ง → เลขาธิการ ป.ป.ท. → อสส.

Both pages now: **เห็นชอบ (checked, `active-agree`) · เห็นแย้ง · อื่นๆ**, with the
fall-through flipped to `AGREE` and an explicit `if (isDissent)` branch. `อื่นๆ` stays last.
The grid is `repeat(3, 1fr)`, so เห็นแย้ง lands in the middle.

Full rationale and the audit of the other `decision-card` screens:
[`meeting-01092026-changes.md` Part 1D §3](meeting-01092026-changes.md#3-06--13--เห็นชอบ-moved-first-and-is-now-the-default).
Short version: `07`/`08`/`14`/`15` were already approve-first-and-checked; `10-2-04` renders
options from data; `17` is a routing choice, not agree/reject.

**Reordering was safe** — every reference on both pages is by `id`
(`op_agree`, `label_op_dissent`, `lbl_op_agree_title`, …). Nothing reads the radios by index
or DOM position, so the `<label>` blocks move freely.

### 🐞 `13` had a derived `isDissent` the new default would have broken

Fifty lines below the branch, gating the "ความเห็นแย้ง needs 2 attachments" rule and
`requiredCopies`:

```js
const isDissent = !isAgree && !isOther;
```

Correct only *because* dissent was the fall-through default. Now reads `op_dissent.checked`
directly.

It surfaced as `SyntaxError: Identifier 'isDissent' has already been declared` — the entire
script failed to parse and every button on the page was dead. **`13`'s form only renders
when the case is at `PENDING_OFFICER_FINAL_DOC`**, so eyeballing the page would not have
shown it; the case had to be staged to that step to test at all.

## 7. `19` — one selector, 9 options, outcome derived

Senior's ruling: *"both the selector is the same thing, but the pre-existing one only have 2
options, we need the 9 options."* So `ผลต่อการดำเนินคดี` (the 2 cards) is gone, and
`กรณีคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)` is the only control. `oagVerdictDecision` is now
**derived** from it through one table, `OAG_VERDICT_OUTCOME`.

Odd-numbered options → `PROSECUTE`, even → `NON_PROSECUTE`, `9. อื่นๆ` → ธุรการ picks
explicitly. A coloured strip under the dropdown shows how the system read the choice, and
submitting is blocked if the outcome is unresolved.

Full mapping table and rationale:
[`meeting-01092026-changes.md` Part 1D §4](meeting-01092026-changes.md#4-19--one-selector-9-options-outcome-derived).

### 🚨 The 9 labels need a lawyer. This is the one thing to action from this session.

**I wrote them. The working group did not.** No source document in this repo — not the
meeting PDF, not the mockups — contains an อสส-worded list. I derived them from the shape of
intake's 1–9. They are plausible, not verified.

**Why that matters more than normal wording review:** the label is no longer decoration. It
*is* the input to `oagVerdictDecision`, the flag `20`/`21`/`22` use to decide whether a case
proceeds or closes. A wrong label is a wrong routing decision on a criminal file.

**Check options 3 and 4 first** — the `ถอนฟ้อง` pair:

- Withdrawal happens *after* charges are filed. The other eight are all decisions not to
  start or not to escalate. So "proceeds" here means an existing prosecution continues, not
  that a new one begins.
- I mapped `3. ชี้ขาดไม่ให้ถอนฟ้อง` to `PROSECUTE` on a "case proceeds" reading. If ป.ป.ท.
  reads `PROSECUTE` strictly as "อสส. orders charges filed", **that mapping is wrong**.
- Whether อสส can refuse a withdrawal in this posture at all is a ป.วิ.อ. question I am not
  qualified to answer. **If it cannot, option 3 should not exist.**

**Also:** options 6 and 8 each fold `ไม่อุทธรณ์`+`ถอนอุทธรณ์` (and `ไม่ฎีกา`+`ถอนฎีกา`) into
one "ยืนตาม" entry, collapsing intake's separate 3/4/5 and 6/7/8, purely to keep the list at
nine. If that distinction is legally material the list must grow.

**Changing it is cheap:** the `<option>` labels in `19` and the matching key in
`OAG_VERDICT_OUTCOME` in the same file. Two edits, one file.

### 🐞 Two downstream bugs this exposed

**The store was discarding the choice.** `submitLegalAdminOAGVerdictIntake` never copied
`oagVerdictCaseTypeNo`/`Name` out of the payload — `19` had been building and binning them
since Batch B, unnoticed because the cards carried the outcome. Now persisted.

**`20`/`21`/`22` hardcoded "อสส. ชี้ขาดให้ฟ้องคดี"** for any `PROSECUTE`. Fine with two
choices; wrong with nine — picking `ชี้ขาดให้อุทธรณ์` displayed *"ให้ฟ้องคดี"* on all three.
Badge text now comes from the chosen option; colour and icon still come from the binary flag.
Pre-07/09 cases fall back to the old wording.

### Also on `19`

The two orphaned `</div>` from commenting out the cards had been closing the card early —
everything below the dropdown had fallen outside it. `selectedDecision` no longer hardcodes
`'PROSECUTE'`. Dead `switchScenario` removed. ⚠ Deleting the dead `.verdict-card` CSS also
took `.form-actions`, `.btn*`, `.badge`, `.font-monospace`, `.d-none` and `.btn-mic` with it
— they shared the block, and had to be restored.

## 8. `17` — recipients became checkboxes

Reported: *"the ui is visually bad… when the radio only ticked for อสส but both is bordered."*

**The bug was real.** `selectDispatchTarget('BOTH')` had a ternary returning the same value on
both branches, so the อสส card stayed highlighted after unticking "both"; and ticking it
highlighted both cards without touching the radios, leaving one filled radio under two
bordered cards.

**The model was wrong, not the CSS.** The meeting requires *เห็นแย้งก็แจ้งทั้ง อสส และ อัยการ*,
so both-recipients is a normal outcome. Radios claim "exactly one"; the separate
`ส่งทั้งสองหน่วยงาน` checkbox existed only to defeat that, creating a second source of truth.

Both recipients are now **checkboxes**, the standalone "both" box is gone, and each card's
highlight is driven by its own checkbox — the contradictory state is unrepresentable. A hint
line reports the selection and warns when nothing is ticked.

`18` is untouched: it parses the saved string by substring, and the both-case string is
byte-identical to before.

Detail: [`meeting-01092026-changes.md` Part 1D §5](meeting-01092026-changes.md#5-17--recipients-are-checkboxes-now-not-radio--a-both-box).

## 9. Flow 3 does not branch on มติอัยการ

Asked whether Flow 3 needs a run per มติอัยการ value. **No.** `17`/`18` only display it —
neither references `PROSECUTOR_ORDER_PHRASE` or `prosecutorCaseTypeNo`. Verified by forcing a
case to `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` and walking `18`: displayed correctly, no leaked
ไม่ฟ้อง.

What Flow 3 *does* branch on is **เห็นชอบ vs เห็นแย้ง** (`18:823`) — which is what the meeting
note is about. Both branches are seeded, one case each. ⚠ That check falls back to
`title.includes('เห็นชอบ')`, so a case whose title contains เห็นชอบ takes the agreed branch
regardless of its real opinion — pre-existing, not fixed.

## 10. ⚠ Two caching bugs — both hid this work

**Both shared assets are `?v=`-pinned, and both were edited.** Neither change was visible
until the version was bumped.

| asset | was | now | how it showed up |
|---|---|---|---|
| `ecmis-shell.css` | `?v=20260904_1` (23 pages) | `?v=20260907_1` | the new block rendered **completely unstyled** — transparent, no left border, grey read-boxes |
| `ecmis-activity10.js` | `?v=20260904_6` (31 pages) | `?v=20260907_1` | worse — **silent**. The store call ran against the cached 4-arg version, returned success, and `groupDirectorName` simply never appeared |

The JS one is the dangerous pattern: a cached older function signature accepts the call, drops
the extra argument, and reports success. Nothing errors.

This is the **third** time this trap has cost time — Part 1C hit it on
`ecmis-offense-basis.js`. Treat a `?v=` bump as part of editing a shared asset, not a
follow-up.

### Also found: `10-2-09` was two revisions behind

`10-2-09-legal-admin-dispatch.html` pinned `ecmis-activity10.js?v=20260902_2` while the other
31 pages were on `20260904_6` — it had been running stale JS. Pre-existing and unrelated;
now on `20260907_1` with everything else.

## 11. Verification

Served over `http://localhost` (`file://` origin has its own separate `localStorage`, so the
real data was never touched) with signatures seeded.

- Both blocks render from the shared CSS on `07` and `08`; slate/blue tints and left borders
  correct; read-boxes white inside the blocks.
- Signature strips show image + `ลงนามเมื่อ`, and **hide as a unit** when the signature is
  absent — no orphan `ลายมือชื่ออิเล็กทรอนิกส์:` heading, no broken `<img>`.
- `07` → store → `08` exercised through the **real call-site expression**, not a stub:
  `submitGroupDirectorApproval(id, 'APPROVE', notes, sig, document.getElementById('in_groupDirectorName').value.trim())`.
  `08` then showed the stored name rather than its fallback.
- Both `groupDirectorReturnNotes` paths above.
- Decision labels, captions, radio values and marks asserted from the DOM on all three pages.
- No console errors on any page.

**Not verified:** the signature-pad modal itself was not driven — the store call was made
directly with the same expression the callback uses. The pad is unchanged by this work.

## 12. Still open

| # | item | |
|---|---|---|
| **0** | **The 9 อสส-ruling labels on `19`** | 🚨 **BLOCKING — implementer-authored, now drives case routing. Lawyer sign-off required; check options 3/4 first. [§7](#7-19--one-selector-9-options-outcome-derived)** |
| 1 | `เห็นแย้งตาม…` → `ไม่เห็นชอบตาม…` | ⚠ needs a ruling — reverses a meeting decision |
| 2 | `…ที่เห็น` dangles on `08`; `07` still says `…ที่เห็นแย้ง` | ⚠ needs a ruling — one token either way |
| 3 | `groupDirectorReturnNotes` never cleared on approve | display-side guard only; store untouched |
| 4 | `07` block has no ผอ.กลุ่มงาน half | correct today — but if `07` ever shows a completed screening, it should reuse `.attest-block--screening` |
| 5 | `06`/`13` default flipped to เห็นชอบ | approved in-session, but it changes what inaction submits — worth confirming with the working group |
| 6 | `13`'s 2-attachment rule for ความเห็นแย้ง not exercised | file inputs can't be set programmatically; the `isDissent` gate was verified, the attach path was not |
| 7 | `19`'s `9. อื่นๆ` free text is not validated for content | only presence is checked, same as page `02`'s อื่นๆ |
| 8 | `18` falls back to `title.includes('เห็นชอบ')` | a title containing เห็นชอบ forces the agreed branch regardless of `finalOpinionType`. Pre-existing |
