# QA — Batch A (meeting 01/09/2026)

Manual test plan for commit `e8ebafc`. Decisions and rationale:
[`meeting-01092026-changes.md`](meeting-01092026-changes.md).

**Scope:** items 02, 06, 07, 08, 10, 13, 15, 16 + the wording sweep.
**Not in scope:** items 17, 18, 19, 22 (Batch B — not built yet).

---

## 0. Setup — read this first

```
cd activity10
run.bat                     →  http://localhost:8811/index.html
```

### 0.1 Clear old data before you start ⚠

Cases are cached in `localStorage`. A stale cache hides seeded changes and will make
you file false failures.

`DATA_VERSION` was bumped to `v45_meeting_01092026`, so the app **should** reseed by
itself. If anything looks like the old wording, force it:

> DevTools (F12) → Console:
> ```js
> Object.keys(localStorage).filter(k => k.startsWith('ecmis_act10_cases_'))
>   .forEach(k => localStorage.removeItem(k));
> location.reload();
> ```

Do this again any time you want a clean run.

### 0.2 Logins

Password is not checked. Enter the username on `login.html`.

| role | username | pages used below |
|---|---|---|
| ธุรการกองกฎหมาย | `Kanda.R` | 02, 09, 10, 16 |
| นิติกร | `Nattapol.B` | 06, 13 |
| ผอ.กลุ่มงานความเห็นแย้ง | `Arnon.C` | 07, 12, 14 |
| ผอ.กองกฎหมาย | `Napas.S` | 08, 11, 15 |

### 0.3 Known-good baseline (not bugs)

| you will see | why |
|---|---|
| All 15 demo cases show `1. อัยการมีความเห็นสั่งไม่ฟ้อง` | every seeded case is `prosecutorCaseTypeNo: "1"`. **To test the per-case wording you must create a new case** — see TC-06.1 |
| ฐานความผิด is empty on demo cases | seeded cases predate the field; the empty state is correct |
| Yellow highlights on changed labels | deliberate review markers. They are removed at sign-off — see §5 |

---

## 1. Item 02 — บันทึกรับเรื่อง

Login `Kanda.R` → `02-board-intake.html`. หมวดหมู่ = **คดีศาลยุติธรรม (10.1)**.

### TC-02.1 — ระดับศาล follows the prosecutor's case

For each row: change **กรณีความเห็น/คำสั่งพนักงานอัยการ**, then read **ระดับศาล**.

| # | select this case | ระดับศาล must become | pass |
|---|---|---|---|
| a | 1. อัยการมีความเห็นสั่งไม่ฟ้อง | ยังไม่มีศาลระบุ | ☐ |
| b | 2. อัยการมีความเห็นถอนฟ้อง | ยังไม่มีศาลระบุ | ☐ |
| c | 3. อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ) | ศาลชั้นต้น | ☐ |
| d | 4. อัยการมีความเห็นสั่งไม่อุทธรณ์(ยกฟ้อง) | ศาลชั้นต้น | ☐ |
| e | 5. อัยการมีความเห็นสั่งถอนอุทธรณ์ | ศาลชั้นต้น | ☐ |
| f | 6. อัยการมีความเห็นสั่งไม่ฎีกา(ลงโทษ) | ศาลอุทธรณ์ | ☐ |
| g | 7. อัยการมีความเห็นสั่งไม่ฎีกา(ยกฟ้อง) | ศาลอุทธรณ์ | ☐ |
| h | 8. อัยการมีความเห็นสั่งถอนฎีกา | ศาลอุทธรณ์ | ☐ |
| i | 9. อื่นๆ | อื่นๆ + free-text box appears | ☐ |

### TC-02.2 — ระดับศาล stays editable

Pick case 5 (auto → ศาลชั้นต้น), then manually change ระดับศาล to ศาลฎีกา.
**Expected:** it accepts the change and does not snap back. ☐

### TC-02.3 — ศาลฎีกา is still available

Open the ระดับศาล dropdown. **Expected:** 5 options —
ยังไม่มีศาลระบุ / ศาลชั้นต้น / ศาลอุทธรณ์ / ศาลฎีกา / อื่นๆ. ☐

### TC-02.4 — validation, ระดับศาล อื่นๆ

ระดับศาล = อื่นๆ, leave the box empty, fill everything else, press บันทึก.
**Expected:** warning `กรุณาระบุระดับศาล (อื่นๆ)`, focus jumps to the box, form does not submit. ☐
Then type anything → submits. ☐

### TC-02.5 — validation, กรณีฯ อื่นๆ

กรณีความเห็นฯ = `9. อื่นๆ`, leave its box empty, press บันทึก.
**Expected:** `กรุณาระบุกรณีความเห็น/คำสั่งพนักงานอัยการ (อื่นๆ)`. ☐

### TC-02.6 — ฐานความผิด, add / remove

| step | expected | pass |
|---|---|---|
| initial state | `ยังไม่ได้ระบุฐานความผิด — กด "เพิ่มมาตรา" เพื่อเริ่มกรอก` | ☐ |
| press เพิ่มมาตรา ×3 | rows numbered รายการที่ 1, 2, 3 | ☐ |
| type in row 2, then add row 4 | **row 2 keeps what you typed** | ☐ |
| delete row 2 | row 2 goes, remaining renumber 1,2,3, other values intact | ☐ |

### TC-02.7 — ฐานความผิด, กฎหมาย อื่นๆ

Row 1 กฎหมาย = **อื่นๆ** → free-text appears. Type `พ.ร.บ.ศุลกากร`, มาตรา `243`,
ฐานความผิด `ลักลอบนำเข้า`. ☐
Leave the law text **empty** and press บันทึก →
`กรุณาระบุกฎหมาย (อื่นๆ) ในฐานความผิดรายการที่ 1`. ☐

### TC-02.8 — ฐานความผิด, มาตรา required once a row is started

Fill only ฐานความผิด, leave มาตรา empty → `กรุณาระบุมาตรา ในฐานความผิดรายการที่ N`. ☐
A completely blank row must **not** raise any warning. ☐

### TC-02.9 — nothing leaks into 10.2

หมวดหมู่ = **การขอเปิดเผยข้อมูลข่าวสาร (10.2.1)**.
**Expected:** ระดับศาล **and** ฐานความผิด are both hidden; the 10.2 fields show instead. ☐

### TC-02.10 — responsive (regression, pre-existing bug fixed)

Narrow the window below ~1024px.
**Expected:** two-column form rows collapse to one column. ☐
*(This never worked before — the page had a broken `@media` rule.)*

---

## 2. Item 06 — จัดทำบันทึกความเห็น

### TC-06.1 — wording follows intake ⭐ the meeting's main question

1. As `Kanda.R` on 02, create a case with **กรณีฯ = 5. อัยการมีความเห็นสั่งถอนอุทธรณ์**.
   Add ฐานความผิด: ประมวลกฎหมายอาญา / `157` / `เจ้าพนักงานปฏิบัติหรือละเว้นฯ`. Submit.
2. Walk it to 06 (or log in as `Nattapol.B` and open it from คิวงาน).

| check | expected | pass |
|---|---|---|
| decision card 1 | เสนอทำความเห็นแย้ง**คำสั่งถอนอุทธรณ์**ของพนักงานอัยการ | ☐ |
| decision card 2 | เห็นชอบตาม**คำสั่งถอนอุทธรณ์**ของพนักงานอัยการ | ☐ |
| มติอัยการ box | `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` | ☐ |
| pick card 2 | label becomes `สาระสำคัญ / เหตุผลประกอบการเห็นชอบตามคำสั่งถอนอุทธรณ์` | ☐ |
| **no** `ไม่ฟ้อง` anywhere on the visible form | | ☐ |

Repeat with case **2** (ถอนฟ้อง) and case **8** (ถอนฎีกา). ☐

### TC-06.2 — case 9 uses the generic phrase

Create a case with **9. อื่นๆ**, detail `อัยการสั่งสอบสวนเพิ่มเติม`.

| check | expected | pass |
|---|---|---|
| decision card 1 | เสนอทำความเห็นแย้ง**คำสั่ง**ของพนักงานอัยการ *(no case word)* | ☐ |
| มติอัยการ box | `9. อื่นๆ (อัยการสั่งสอบสวนเพิ่มเติม)` — **the typed detail shows** | ☐ |

### TC-06.3 — ฐานความผิด round-trip ⭐

Open the case from TC-06.1 on 06.

| check | expected | pass |
|---|---|---|
| ฐานความผิด rows | pre-filled with what ธุรการ entered at 02 | ☐ |
| a row saved with a custom law | กฎหมาย shows **อื่นๆ** with the typed name restored below | ☐ |
| edit มาตรา, add a row, submit, reopen | edits persisted | ☐ |

### TC-06.4 — signature still required

Submit → confirm → **signature modal appears**; both เซ็นมือ and ลายเซ็นดิจิทัล work. ☐

---

## 3. Items 07 / 08 / 15 — decision wording

### TC-07.1 — `Arnon.C` → `07-group-director-approval.html`

| check | expected | pass |
|---|---|---|
| option 1 | เห็นชอบตามคำร่างที่เสนอ | ☐ |
| option 2 | เห็นแย้งตามคำร่างที่เสนอ | ☐ |
| option 2 sub-line | still says ส่งคืนให้นิติกรเจ้าของสำนวนปรับปรุงเนื้อหา | ☐ |
| **pick option 2 and submit** | case goes **back to นิติกร** — behaviour unchanged | ☐ |

### TC-08.1 — `Napas.S` → `08-legal-director-approval.html`

| check | expected | pass |
|---|---|---|
| option 1 | เห็นชอบตามความเห็นที่เสนอ | ☐ |
| option 2 | เห็นแย้งตามความเห็นที่เสนอ | ☐ |
| pick option 2 and submit | case goes back for revision | ☐ |

### TC-15.1 — `Napas.S` → `15-legal-director-final-review.html`

| check | expected | pass |
|---|---|---|
| ผลการตรวจสอบหนังสือ | **two cards**, not a dropdown | ☐ |
| labels | เห็นชอบตามความเห็นที่เสนอ / เห็นแย้งตามความเห็นที่เสนอ | ☐ |
| clicking a card | it highlights and the other clears | ☐ |
| submit each option | routes exactly as before the change | ☐ |

### TC-09.1 — wording is consistent downstream

After approving on 07 and 08, open `09` and `16`.
**Expected:** the displayed result matches the new wording — no page still shows
`เห็นชอบตามร่างความเห็นแย้ง` for that decision. ☐

---

## 4. Items 10 / 13 / 16

### TC-10.1 — มติอัยการ visible on every later page

Open each and confirm **มติอัยการ** appears in the detail card just above ระดับศาล,
showing the case chosen at intake:

`10` ☐ `11` ☐ `12` ☐ `13` ☐ `14` ☐ `15` ☐ `16` ☐ `17` ☐ `18` ☐ `19` ☐ `20` ☐ `21` ☐ `22` ☐

*(Use the TC-06.1 case so the value is not "1" — that proves it reads real data.)*

### TC-13.1 — signature on submit

`Nattapol.B` → `13-officer-final-doc.html` → บันทึก และ เสนอ ผอ.กลุ่มงาน.

| check | expected | pass |
|---|---|---|
| after confirm | signature modal opens | ☐ |
| เซ็นมือ | can draw, ล้างลายเซ็น clears | ☐ |
| ลายเซ็นดิจิทัล | shows a certificate stamp | ☐ |
| cancel the modal | case is **not** submitted | ☐ |
| complete it | submits and returns to คิวงาน | ☐ |

### TC-16.1 — both signatures render

`Kanda.R` → `16-legal-admin-final-dispatch.html`, on a case already reviewed by both.

| check | expected | pass |
|---|---|---|
| ผอ.กลุ่มงาน box | **shows ลายมือชื่ออิเล็กทรอนิกส์** (this was missing) | ☐ |
| ผอ.กองกฎหมาย box | still shows its signature | ☐ |
| a case not yet signed by ผอ.กลุ่มงาน | box stays hidden, no broken image | ☐ |

---

## 5. Wording sweep

### TC-W.1 — labels changed

| where | expected | pass |
|---|---|---|
| sidebar on `01`, `12`, `22` | ยกร่างความเห็น / ตรวจร่างความเห็น (no แย้ง) | ☐ |
| stepper on `03`, `04`, `05` | `4. นิติกร จัดทำความเห็น` | ☐ |
| `05` field labels | ข้อสั่งการ / แนวทางการจัดทำความเห็น… | ☐ |
| `06` heading + tab title | จัดทำบันทึกความเห็น | ☐ |

### TC-W.2 — these must NOT have changed ⚠

| where | must still say | pass |
|---|---|---|
| any ผอ.กลุ่มงาน reference | **กลุ่มงานความเห็นแย้ง** (real org unit) | ☐ |
| `06` decision card 1 | เสนอทำ**ความเห็นแย้ง**… (the choice) | ☐ |
| board มติ on `10`/`11`/`12` | เห็นชอบให้ทำ**ความเห็นแย้ง** | ☐ |
| `17`/`18` document + file names | หนังสือ**ความเห็นแย้ง**…(อสส-bound) | ☐ |

### TC-W.3 — removing the review highlights (at sign-off)

Yellow markers are intentional. To remove:
1. delete the `REVIEW MARKER` block at the end of `assets/ecmis-shell.css`
2. unwrap every `<mark class="wording-changed">…</mark>`

**Expected:** text identical, no yellow. ☐

---

## 6. Regression sweep

| check | pass |
|---|---|
| DevTools Console shows **no red errors** on 01-22 | ☐ |
| A case can be driven 02 → 06 → 07 → 08 → 09 → …→ 16 without breaking | ☐ |
| Dark mode still renders (including the new ฐานความผิด rows and yellow marks) | ☐ |
| Below 1024px, 02 and 06 collapse to one column | ☐ |

---

## 7. Defect log

| # | TC | what happened | expected | page | sev |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
