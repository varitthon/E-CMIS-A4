# QA findings register — activity 10.1

Everything found while implementing the 01/09/2026 meeting changes and QA-ing the four
flows in `../../TO-BE 10.1-User-Flow-split.drawio`.

Three sections: **fixed**, **needs a fix**, **needs a judgement call**. The last one is
the important one — those are decisions only the working group can make, and they are
blocking nothing until someone rules on them.

Related: [`meeting-01092026-changes.md`](meeting-01092026-changes.md) ·
[`qa-guide-4-flows.md`](qa-guide-4-flows.md) ·
[`qa-batch-a-meeting-01092026.md`](qa-batch-a-meeting-01092026.md)

---

# A. Fixed

| # | finding | why it mattered |
|---|---|---|
| A1 | **`getCaseById` silently returned a different case.** It ended `\|\| cases[0]`, so an unknown id loaded the *first* case in the store with no signal. | You could read one case's data believing it was another's. Reported as "no approve button + wrong stepper" on 07; every symptom came from this. Fallback kept (pages default to placeholder ids) but now announced with a banner. |
| A2 | **Returning a case left a stale approval stamp, stranding it.** The RETURN branches never cleared `groupDirectorApprovedDate` / `legalDirectorApprovedDate`. | 07 read the stale date and hid the approve form; the inbox routed on `statusCode` and showed it to nobody. **The case could not be moved by anyone.** Affected 07 and 08. |
| A3 | **Steppers marked the wrong step done and relabelled it.** 06/07/08 stamped the *next* step with the *current* step's label; 09 targeted an id that does not exist. | 07 showed two steps both reading ผอ.กลุ่มงาน ตรวจร่าง. Fixed by removing label-writing entirely (`markStepCompleted` touches only state), so a step can no longer be renamed by accident. |
| A4 | **มติอัยการ vanished on 07/08/09.** Present 03-06, absent 07-09, back 10-22. | ผอ.กลุ่มงาน and ผอ.กอง approved the opinion without seeing what the prosecutor had ordered. Now continuous 03 → 22. |
| A5 | **A hand-created case could never have a ผู้ถูกกล่าวหา.** `f_complainant` / `f_accused` on 02 were readonly, filled only by the ค้นหาสำนวน lookup. | Any case not already in the intake database was saved with both parties blank, showing `-` for the rest of the flow with no way to correct it. Also fixed two hidden faults: `accuser` had no input fallback at all, and the lookup wrote a literal `"-"` that would have been saved as a name. |
| A6 | **17's destination chooser was a dead end.** 18 ignored `dispatchTarget`. | ธุรการ picked a destination and nothing downstream used it. |
| A7 | **Seed data had ป.ป.ท. offices in `source`**, rendered everywhere as หน่วยงานอัยการต้นทาง. 6 occurrences, 2 arrays, 4 cases. | Demo showed a ป.ป.ท. office as the prosecutor. Safe to fix — each case already records it in `accuser`. |
| A8 | **Stepper labels overflowed into neighbouring steps** on every page (`white-space: nowrap` + `max-width`, no overflow handling). | Up to 87px of spill on 17. Thai needs an explicit break opportunity, so `white-space: normal` alone was not enough. |
| A9 | **Shared CSS and JS had no cache-busting** while other assets did. | A cached copy hid **every** yellow review highlight and broke the decision cards — would have produced false QA defects. Bit us twice during development. |
| A10 | **Decision cards rendered wrong on 15 and 17** — `.form-group label { justify-content: space-between }` outranks `.decision-card`, and the cards are `<label>`s. | Introduced by this work; radio and text pushed to opposite edges. |
| A11 | **Broken `@media` block in 02** — dangling selector, no declarations. | Pre-existing; the whole rule was dead so 02 never collapsed to one column. |
| A12 | **03 duplicated ผู้ร้อง / จำเลย** (the issue the meeting raised for 02). | Seed proves they are one person: `petitioner` empty on all 15 cases, the one non-empty `defendant` equals `accused` on the same record. |
| A13 | **ฐานความผิด required fields were unmarked.** | Nothing on screen said they were mandatory until save was rejected. |
| A14 | **The inbox showed a bare `อื่นๆ` badge.** | The one case type that needs explaining was the only one showing no explanation, though the detail was stored all along. |

---

# B. Needs a fix

## B1 — Notification wording is inconsistent with the page it appears on

`01-work-inbox.html:465` was changed to `ครบกำหนดยกร่างความเห็น`, but the same notification
is **generated at runtime** from:

- `assets/ecmis-app.js:2039, 2066, 2073`
- `assets/ecmis-shell.js:37`

which still say `ครบกำหนดยกร่างความเห็นแย้ง`. If the JS overwrites the static markup, the
page shows the old wording. **Four strings.** Left alone earlier only because the shared JS
was out of scope at the time.

## B2 — The รีเซ็ต button destroys created cases with no warning

`01-work-inbox.html` has a **รีเซ็ต** button on the toolbar calling `Activity10.resetData()`,
which restores the 15 seeded cases and **discards everything created through the UI**. Its
confirm dialog does not say that.

It sits next to ordinary controls, and it has already cost one test case during this work.
For the 4-flow QA — where testers build cases up over several steps — this is a live hazard.

**Suggested:** spell out the consequence in the confirm text, and/or move it out of the main
toolbar.

## B3 — `DATA_VERSION` bumps silently discard user-created cases

`loadCases()` keys storage on `DATA_VERSION`. Bumping it (necessary whenever seeded values
change) starts a fresh store, so any case a tester created is gone. This happened twice
during this work.

Not wrong in itself, but nothing warns anyone. **Suggested:** note it in the QA docs as a
release step, or migrate non-seeded cases across a bump.

---

# C. Needs a judgement call

Nothing here is broken. Each needs someone to decide what "correct" is.

## C1 — Seven different stepper models ⚠ the big one

The same case walks through steppers that disagree on how many steps exist, what they are
called, and where the numbering starts:

| pages | steps | numbering |
|---|---|---|
| 02 | 4 | 1-4 |
| 03-05 | 5 | 1-5 |
| 06-09 | 7 | 1-7 |
| 10 | 7 | **7-13** |
| 11 | 6 | **8-13** |
| 12 | 6 | **9-14** |
| 13-14 | 7 | **unnumbered** |
| 15-16 | 5 | **restarts at 1** |
| 17-18 | 5 | **restarts at 1** |
| 19-22 | 4 | **restarts at 1** |

The numbering restarts at 1 four separate times, and "step 5" means
`เสนอผู้บริหารลงนามชี้ขาด` on 03-05 but `ผอ.กลุ่มงาน ตรวจร่าง` on 06-09. The same actor is
worded differently too (`จัดทำความเห็น` vs `ยกร่างความเห็น`, `ตรวจสั่งการ และ มอบหมาย` vs
`มอบหมาย`).

**Decision needed:** one canonical set of step names for the whole 10.1 process, or an
explicit rule that each flow restarts its own numbering. Until that is settled, nobody
should edit 21 steppers.

## C2 — Pages do not check the case has reached them

Opening 05 for a case still with ผอ.กอง at step 3 shows *"3. ผอ.กลุ่มงาน มอบหมายนิติกร
[active]"*. The stepper reports the **page's** position, not the **case's**, so a case looks
further along than it is. Most pages guard the "already done" direction (`workflowStep > N`)
but nothing guards "not yet arrived".

**Decision needed:** should a page refuse / warn when the case has not reached it? Making
steppers data-driven depends on C1 being settled first.

## C3 — ผู้ถูกกล่าวหา appears on only 8 of 20 pages

```
03 Y  04 .  05 .  06 .  07 .  08 Y  09 .  10 .  11 Y  12 Y
13 .  14 .  15 .  16 .  17 .  18 .  19 Y  20 Y  21 Y  22 Y
```

Unlike มติอัยการ (a clean range with a hole, so clearly a gap), this is scattered — it may
well be deliberate, with some pages carrying a fuller detail card. **Decision needed:**
is the accused's name part of the standard case-detail block or not?

## C4 — Item 19: intake's 9 options, or อสส-worded ones?

19 now uses **intake's 9 verbatim** (the working group's choice), and the two verdict cards
were **kept** as `ผลต่อการดำเนินคดี` because 20, 21 and 22 all branch on
`oagVerdictDecision`, and none of intake's 9 expresses ฟ้อง vs ไม่ฟ้อง — they describe the
prosecutor's *original* order.

**Decision needed:** if this page should have its own **อสส-worded** nine
(`อสส. ชี้ขาดให้ฟ้อง`, `อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง`, …), the extra outcome field can be
dropped. That wording has to come from the working group.

## C5 — The diagram and the meeting disagree on the dispatch

Page 3 of the TO-BE diagram shows the dispatch as **either** อัยการ **or** อสส., never both.
The meeting asked for *"แจ้งทั้ง อสส และ อัยการ"*, and the build follows the meeting.

**Decision needed:** update the diagram, or re-confirm the requirement.

## C6 — Wording kept on purpose, worth confirming

| item | current | note |
|---|---|---|
| `10.1 ความเห็นแย้ง (…)` on `14:353` | kept | user's explicit call; `03`/`04` were changed to `10.1 ความเห็นอัยการ` |
| Seeded case titles `พิจารณาความเห็นแย้ง…` (~16) | kept | demo data, not UI labels |
| Status strings in shared JS containing ความเห็นแย้ง | kept | some are compared with `===`; changing them breaks page logic |
| `ผอ.กลุ่มงาน` in steppers | kept | abbreviation of the org unit, pre-existing |

## C7 — Two calls I made that you may want to reverse

| decision | rationale | to reverse |
|---|---|---|
| **ฐานความผิด is mandatory** once a row is started | a มาตรา with no offence description is half-useless for the Dashboard the block exists to feed | drop the check in `validateOffenseBasisRows` |
| **13 allows submitting with no attachment** | the page already promises the system generates the draft; blocking would break the demo walkthrough | tighten the check in `submitOfficerFinalDocForm` |

---

# D. Verified working

Walked a real case (กรณี 5 ถอนอุทธรณ์ + ฐานความผิด) through **02 → 22** across all four flows.

- ระดับศาล auto-maps from the case and carries unchanged to every page
- 06 wording follows intake — no stray "ไม่ฟ้อง" anywhere
- ฐานความผิด round-trips 02 → 06, including a custom law mapping back to `อื่นๆ`
- มติอัยการ now continuous 03 → 22
- 07/08 renamed labels propagate to 08/09 without splitting
- Steppers within 06-09 correct: right step active, no duplicate labels
- Data reaches flows 2-4 intact; remaining `-` values are stages not yet reached
- **Zero console errors** across all 21 pages
- `node --check` passes on all pages and all 5 JS files
