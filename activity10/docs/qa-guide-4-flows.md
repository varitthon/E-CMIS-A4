# QA guide — walking all 4 flows of 10.1

Covers **everything changed for the 01/09/2026 meeting** (Batch A + Batch B), laid out along
the four flows in `../../TO-BE 10.1-User-Flow-split.drawio`.

For each step you get: **the page**, **what changed**, **why**, and **what to check**.
Steps with no changes are listed too, so you can walk the flow end to end without wondering
whether you skipped something.

- Decisions and rationale: [`meeting-01092026-changes.md`](meeting-01092026-changes.md)
- Batch A detailed test cases: [`qa-batch-a-meeting-01092026.md`](qa-batch-a-meeting-01092026.md)

Commits under test: `e8ebafc` · `31c67a2` · `9dc935f` · `1549719` · `ce5ee29`

> ⚠ **The LAW codes below are my mapping, not the app's.** The 10.1 pages don't carry LAW
> codes in the markup (only the 10.2 series does). I matched them by role and step. Please
> sanity-check the mapping — if one is wrong, the test steps still hold, only the label moves.

---

## 0. Before you start

```
cd activity10
run.bat            →  http://localhost:8811/index.html
```

### 0.1 Reset — do this first, and again between full runs ⚠

Two separate caches will lie to you:

**a) Case data.** `loadCases()` prefers `localStorage` over the seed, so old data hides
seeded changes. `DATA_VERSION` is now `v46_fix_seed_prosecutor_source`; it should reseed
itself, but old keys linger. Clear them all:

> F12 → Console:
> ```js
> Object.keys(localStorage).filter(k => k.startsWith('ecmis_act10_cases_'))
>   .forEach(k => localStorage.removeItem(k));
> location.reload();
> ```

**b) Shared CSS and JS.** These load with a version query — `ecmis-shell.css?v=20260904_1`,
`ecmis-offense-basis.js?v=20260904_2`. A stale copy shows up as:

| symptom | cause |
|---|---|
| **no yellow highlights** anywhere | stale `ecmis-shell.css` |
| decision cards with radio and text pushed to opposite edges | stale `ecmis-shell.css` |
| **no red `*`** on the ฐานความผิด row labels | stale `ecmis-offense-basis.js` |

Hard-reload with **Ctrl+F5**. (This bit us during development, twice — worth checking before
filing any of the above.)

### 0.2 Logins (no password check)

| role | username |
|---|---|
| ธุรการกองกฎหมาย | `Kanda.R` |
| นิติกร | `Nattapol.B` |
| ผอ.กลุ่มงานความเห็นแย้ง | `Arnon.C` |
| ผอ.กองกฎหมาย | `Napas.S` |

### 0.3 Two things that look like bugs but are not

| you will see | why |
|---|---|
| **Yellow highlights** on changed labels | deliberate review markers. Removed at sign-off — see §5 of the Batch A doc |
| Demo cases all show `1. อัยการมีความเห็นสั่งไม่ฟ้อง` | every seeded case is `prosecutorCaseTypeNo: "1"`. **To test the dynamic wording you must create a new case** — see Flow 1 step 1 |

### 0.4 The test case to create

Do this once at the start; several checks below depend on it.

At **02** as `Kanda.R`, หมวดหมู่ = **คดีศาลยุติธรรม (10.1)**:

- กรณีความเห็น/คำสั่งพนักงานอัยการ = **`5. อัยการมีความเห็นสั่งถอนอุทธรณ์`**
- ฐานความผิด: add 2 rows —
  `ประมวลกฎหมายอาญา` / `157` / `เจ้าพนักงานปฏิบัติหรือละเว้นฯ`
  and `อื่นๆ → พ.ร.บ.ศุลกากร` / `243` / `ลักลอบนำเข้า`
- fill the remaining required fields, บันทึก

Call this **the ถอนอุทธรณ์ case**. It proves the wording and ฐานความผิด actually flow.

---

# Flow 1 — รับเรื่องจากอัยการ → เสนอมติบอร์ด

Diagram page 1 · `LAW0001`-`LAW0010`

| step | page | changed? |
|---|---|---|
| LAW0001 พนักงานอัยการส่งเอกสาร | *(external)* | — |
| LAW0002/0003 ธุรการรับเอกสาร ออกเลขรับ บันทึกเข้าระบบ | **02** | ✅ **major** |
| — เอกสารความเห็นอัยการ | **03** | ✅ minor |
| LAW0004 ผอ.กอง พิจารณาและมอบหมาย | **04** | ✅ minor |
| LAW0005 ผอ.กลุ่มงาน มอบหมายนิติกร | **05** | ✅ minor |
| LAW0006 นิติกรจัดทำความเห็น | **06** | ✅ **major** |
| LAW0007 ผอ.กลุ่มงาน พิจารณาความเห็น | **07** | ✅ wording |
| LAW0008 ผอ.กอง ตรวจสอบและลงนามผ่านเรื่อง | **08** | ✅ wording |
| LAW0009 ออกเลขส่งหนังสือภายใน | **09** | ✅ knock-on |
| LAW0010 ส่งเข้ามติบอร์ด | *(end of flow)* | — |

## 02 — บันทึกรับเรื่อง `Kanda.R`

**Changed:** ระดับศาล is now derived from the prosecutor's case; two new options; a new
repeatable ฐานความผิด block; validation for both อื่นๆ fields; a dead `@media` rule fixed.

**Why:** the case tells you which court already ruled, so ระดับศาล should follow rather than
be typed independently. ฐานความผิด was requested for the Dashboard ("เจออย่างมาก 6-7 มาตรา").

| check | expect |
|---|---|
| pick each case 1-9, watch ระดับศาล | 1-2 → **ยังไม่มีศาลระบุ** · 3-5 → **ศาลชั้นต้น** · 6-8 → **ศาลอุทธรณ์** · 9 → **อื่นๆ** + free text |
| after auto-set, change ระดับศาล by hand | accepted, does not snap back *(auto-set but editable, by decision)* |
| ระดับศาล dropdown contents | 5 options; **ศาลฎีกา still there** though nothing auto-selects it |
| ระดับศาล = อื่นๆ, leave blank, บันทึก | `กรุณาระบุระดับศาล (อื่นๆ)` |
| กรณีฯ = 9. อื่นๆ, leave blank, บันทึก | `กรุณาระบุกรณีความเห็น/คำสั่งพนักงานอัยการ (อื่นๆ)` |
| ฐานความผิด row labels | **กฎหมาย \* · มาตรา \* · ฐานความผิด \*** — red asterisk next to each label, not flung to the right |
| ฐานความผิด: add 3 rows, type in row 2, add a 4th | **row 2 keeps its text** |
| delete row 2 | remaining rows renumber, other values intact |
| กฎหมาย = อื่นๆ, leave name blank, บันทึก | `กรุณาระบุกฎหมาย (อื่นๆ) ในฐานความผิดรายการที่ N` |
| fill ฐานความผิด but not มาตรา | `กรุณาระบุมาตรา ในฐานความผิดรายการที่ N` |
| fill มาตรา but not ฐานความผิด | `กรุณาระบุฐานความผิด ในฐานความผิดรายการที่ N` |
| leave a row completely blank | **no warning** — blank rows are dropped, so adding a row you don't fill in costs nothing |

> **All three row fields are required once you start filling a row.** ฐานความผิด was made
> mandatory alongside มาตรา — a section number with no offence description is half-useless for
> the Dashboard this block exists to feed. Say so if it should be optional.
| switch หมวดหมู่ to 10.2.1 | ระดับศาล **and** ฐานความผิด both hide |
| narrow the window below 1024px | form collapses to one column *(never worked before)* |

## 03 / 04 / 05 — เอกสารอัยการ · ผอ.กอง · ผอ.กลุ่มงาน

**Changed:** stepper `4. นิติกร จัดทำความเห็น` (was ความเห็นแย้ง); on 03/04 the category
fallback now reads `10.1 ความเห็นอัยการ`; on 05 two field labels
`ข้อสั่งการ / แนวทางการจัดทำความเห็น…`; **on 03, the duplicated ผู้ร้อง / จำเลย columns are gone.**

**Why:** at this point nobody has decided whether it will be a dissent, so the label must not
prejudge. `ความเห็นอัยการ` matches the instance you had already changed by hand.

**The 03 person fields** had the same problem the meeting raised for 02
(*"ซ้ายขวาคนเดียวกันลดเหลืออันเดียว"*): ผู้กล่าวหา sat beside an always-empty **ผู้ร้อง**, and
ผู้ถูกกล่าวหา beside an always-empty **จำเลย**. The seed data confirms they are one person —
`petitioner` is empty on all 15 cases, and the single non-empty `defendant` holds the *same
name* as `accused` on the same record.

| check | expect |
|---|---|
| stepper step 4 on 03, 04, 05 | `4. นิติกร จัดทำความเห็น`, highlighted |
| 05 labels | `ข้อสั่งการ / แนวทางการจัดทำความเห็นถึงนิติกร` and `…จัดทำความเห็น` |
| **03 person fields** | one row: **ผู้กล่าวหา (ผู้ร้อง)** and **ผู้ถูกกล่าวหา (จำเลย)** |
| 03 — separate ผู้ร้อง / จำเลย boxes | **gone**, along with the empty `-` they always showed |
| 03 values still populate | ผู้กล่าวหา and ผู้ถูกกล่าวหา show real names |
| compare 03 against 02 | the two pages now read **identically** for these fields |
| **ผอ.กลุ่มงานความเห็นแย้ง** anywhere on these pages | **unchanged** — it is a real org unit |

> These two labels are **not** yellow-highlighted, matching how the same change was already
> written on 02, so the pages look the same.

## 06 — จัดทำบันทึกความเห็น `Nattapol.B` ⭐ the meeting's main item

**Changed:** the hardcoded `ไม่ฟ้อง` now follows the intake case; ฐานความผิด appears here
too, editable; several labels; page title.

**Why:** `ไม่ฟ้อง` was hardcoded in 14 places, so choosing any other case at intake left this
page describing the wrong order. ฐานความผิด is editable here because นิติกร has the legal
expertise to correct what ธุรการ transcribed.

Open **the ถอนอุทธรณ์ case**:

| check | expect |
|---|---|
| decision card 1 | เสนอทำความเห็นแย้ง**คำสั่งถอนอุทธรณ์**ของพนักงานอัยการ |
| decision card 2 | เห็นชอบตาม**คำสั่งถอนอุทธรณ์**ของพนักงานอัยการ |
| มติอัยการ box | `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` |
| pick card 2 | label → `สาระสำคัญ / เหตุผลประกอบการเห็นชอบตามคำสั่งถอนอุทธรณ์` |
| **no `ไม่ฟ้อง`** on the visible form | ✔ |
| ฐานความผิด rows | **pre-filled from 02** — 157 and 243 |
| the row you saved as `อื่นๆ → พ.ร.บ.ศุลกากร` | shows **อื่นๆ** with the name restored and its box open |
| row labels | same **กฎหมาย \* · มาตรา \* · ฐานความผิด \*** as 02 — it is the same shared widget |
| clear a ฐานความผิด and submit | `กรุณาระบุฐานความผิด ในฐานความผิดรายการที่ N` |
| edit a มาตรา, add a row, submit, reopen | edits persisted |
| submit | signature modal appears; both เซ็นมือ and ลายเซ็นดิจิทัล work |

Also try a case with **9. อื่นๆ** + detail: cards read `…คำสั่งของพนักงานอัยการ` (generic) and
the มติอัยการ box shows `9. อื่นๆ (your text)`.

## 07 / 08 — ผอ.กลุ่มงาน / ผอ.กอง พิจารณา

**Changed:** decision-card labels only.

**Why:** meeting asked for `เห็นชอบ / เห็นแย้ง ตามคำร่างที่เสนอ`. **Rename only — the actions
are unchanged**, which is the single most important thing to verify here.

| page | option 1 | option 2 |
|---|---|---|
| **07** | เห็นชอบตามคำร่างที่เสนอ | เห็นแย้งตามคำร่างที่เสนอ |
| **08** | เห็นชอบตามความเห็นที่เสนอ | เห็นแย้งตามความเห็นที่เสนอ |

| check | expect |
|---|---|
| option 2 sub-line | still says ส่งคืน/ส่งกลับ — so the action stays obvious |
| **pick option 2 and submit** | case goes **back for revision**, exactly as before |
| radio and text position in the cards | together on the **left** — not pushed to opposite edges |

## 09 — ธุรการออกเลขส่งเสนอผู้บริหาร

**Changed:** displays the ผอ.กอง result with the new wording.

**Why:** 07/08 store the decision; 09 renders it. Without this the same decision would show
two different wordings on different pages.

| check | expect |
|---|---|
| ผลการพิจารณา shown | `เห็นชอบตามความเห็นที่เสนอ …` — **not** `เห็นชอบตามร่างความเห็นแย้ง` |

---

# Flow 2 — มติบอร์ด → แจ้งผลเห็นชอบ

Diagram page 2 · `LAW0011`-`LAW0019`

| step | page | changed? |
|---|---|---|
| LAW0011 กองบริหารคดีทำรายงานสรุปมติ | *(external)* | — |
| LAW0012 ธุรการรับเรื่องเพื่อแจ้งผล | **10** | ✅ new field |
| LAW0013 ผอ.กอง พิจารณาและมอบหมาย | **11** | ✅ new field |
| LAW0014 ผอ.กลุ่มงาน มอบหมายนิติกร | **12** | ✅ new field + sidebar |
| LAW0015 นิติกรทำหนังสือแจ้งมติ | **13** | ✅ **major** |
| LAW0016 ผอ.กลุ่มงาน ตรวจสอบ | **14** | ✅ new field |
| LAW0017 ผอ.กอง ตรวจสอบและผ่านเรื่อง | **15** | ✅ **major** |
| LAW0018 ออกเลขส่งหนังสือภายใน | **16** | ✅ signature |
| LAW0019 เสนอลงนาม | *(end of flow)* | — |

## 10 → 16 — the new มติอัยการ field (all pages)

**Changed:** `มติอัยการ` added to the case-detail card, just above ระดับศาล, on **every page
10-22**.

**Why:** it was only visible on 03-06. From 10 onward nobody could see what the prosecutor
had actually ordered, even though the whole case turns on it.

| check | expect |
|---|---|
| open 10, 11, 12, 13, 14, 15, 16 with the ถอนอุทธรณ์ case | each shows `มติอัยการ` = `5. อัยการมีความเห็นสั่งถอนอุทธรณ์` |
| the value | reads from the case — **not** a hardcoded `1. …ไม่ฟ้อง` |

## 13 — นิติกรจัดทำหนังสือตามมติ `Nattapol.B`

**Changed:** electronic signature on submit; upload became **2 copies** for เห็นแย้ง.

**Why:** the meeting asked for a signature here, and said the earlier นิติกร must attach the
documents — with **2 ฉบับ** when it is a dissent.

| check | expect |
|---|---|
| on load (default = ทำความเห็นแย้ง) | **ฉบับที่ 1 and ฉบับที่ 2** both visible |
| switch to เห็นชอบ | collapses to **one** unlabeled slot |
| switch to ความเห็นอื่นๆ | one slot |
| back to เห็นแย้ง | two slots again |
| attach **only** ฉบับที่ 1, submit | `เอกสารไม่ครบ 2 ฉบับ` |
| attach **neither**, submit | **allowed** — the page auto-generates the draft, as it always promised |
| submit | **signature modal appears** (new); cancelling it does **not** submit |

## 14 / 15 — ผอ.กลุ่มงาน / ผอ.กอง ตรวจสอบร่างหนังสือ

**Changed (15):** the `<select>` became **two decision cards**, matching 08.

**Why:** consistency with 08 — the meeting said "ทำให้เหมือน 08".

| check | expect |
|---|---|
| 15 ผลการตรวจสอบหนังสือ | **two cards**, not a dropdown |
| labels | เห็นชอบตามความเห็นที่เสนอ / เห็นแย้งตามความเห็นที่เสนอ |
| click each | it highlights, the other clears |
| submit each option | routes **exactly as before** — the stored values are unchanged |
| card layout | radio + text together on the left |

## 16 — ธุรการออกเลขส่งเสนอผู้บริหาร `Kanda.R`

**Changed:** ผอ.กลุ่มงาน's signature now renders.

**Why:** "ลายเซ็นมาไม่ครบ (มีแค่ของ ผอ กอง)". The signature was already captured upstream and
stored on the case — this page simply never displayed it. A rendering gap, not missing data.

| check | expect |
|---|---|
| ผอ.กลุ่มงาน box | **shows ลายมือชื่ออิเล็กทรอนิกส์** |
| ผอ.กองกฎหมาย box | still shows its signature |
| a case ผอ.กลุ่มงาน has not signed | box stays hidden, **no broken image icon** |

---

# Flow 3 — ส่งหนังสือ แยกตามผลมติบอร์ด

Diagram page 3 · `LAW0020`-`LAW0025`. **This is the flow Batch B changed most.**

```
ผลมติจากบอร์ด (LAW0019)
├── เห็นชอบ → LAW0023  ไปรษณีย์ → อัยการ
└── เห็นแย้ง → เร่งด่วน?
             ├── ไม่เร่งด่วน → LAW0024  ไปรษณีย์ → อสส.
             └── เร่งด่วน    → LAW0025  ด้วยตนเอง → อสส.
```

## 17 — ธุรการตรวจรับหนังสือลงนาม `Kanda.R`

**Changed:** two marked phrases removed; **destination chooser added**; stepper labels reflow.

**Why:** the diagram shows the destination is a **real branch**, so hardcoding
"(ส่งถึงอัยการสูงสุด)" was wrong. The meeting asked to choose it here.

| check | expect |
|---|---|
| card header | `ตรวจสอบความถูกต้องของหนังสือฉบับลงนามสมบูรณ์` — **no** ความเห็นแย้ง |
| verify item 1 | `เลขที่หนังสือส่งภายนอก` — **no** `(ส่งถึงอัยการสูงสุด)` |
| ส่งหนังสือไปที่ | two cards + a **ส่งทั้งสองหน่วยงาน** checkbox |
| submit with no destination | blocked: `กรุณาเลือกปลายทางที่จะส่งหนังสือ` |
| stepper labels | wrap onto two lines, **never overlap** — try a narrow window too |

⚠ **The diagram shows either/or, never both.** The `ส่งทั้งสองหน่วยงาน` option comes from the
meeting (*"แจ้งทั้ง อสส และ อัยการ"*), so **the diagram is out of date here** — confirm which
is authoritative.

## 18 — นิติกรจัดส่งหนังสือ `Nattapol.B`

**Changed:** re-editing enabled; **ผู้รับที่ 2 (พนักงานอัยการ)** added; now **reflects 17's
destination**.

**Why:** the form was never actually disabled — `renderAlreadyDispatchedView()` replaces it
once dispatched, so "มันปิดอยู่?" was about re-entry. The second recipient implements
*"แจ้งทั้ง อสส และ อัยการ"*.

| check | expect |
|---|---|
| open a case where 17 chose **both** | banner **ปลายทางที่ธุรการเลือกไว้ (หน้า 17)** shows the choice |
| same case | **ผู้รับที่ 2 auto-checked and expanded**, หน่วยงานผู้รับ pre-filled |
| 17 chose **พนักงานอัยการ only** | primary recipient and the badge switch away from อสส |
| tick ผู้รับที่ 2, leave หน่วยงานผู้รับ blank, submit | `กรุณาระบุหน่วยงานอัยการผู้รับ…` |
| ไปรษณีย์ EMS vs นำส่งด้วยตนเอง | matches ไม่เร่งด่วน / เร่งด่วน in the diagram |
| **open an already-dispatched case** | read-only summary + **แก้ไขข้อมูลการจัดส่ง** button |
| press แก้ไข | form returns **pre-filled**, with a banner warning it will overwrite |
| save again | overwrites cleanly, banner gone next time |

---

# Flow 4 — อัยการสูงสุดวินิจฉัยชี้ขาด

Diagram page 4 · `LAW0026`-`LAW0032`

| step | page | changed? |
|---|---|---|
| LAW0026/0027 อสส วินิจฉัย, ป.ป.ท. รับเรื่อง | *(external)* | — |
| LAW0028/0029 ลงทะเบียนรับ, ธุรการรับเรื่อง | **19** | ✅ **major** |
| LAW0030 ผอ.กอง รับเรื่องและมอบหมาย | **20** | ✅ new field |
| LAW0031 ผอ.กลุ่มงาน รับเรื่องและมอบหมาย | **21** | ✅ new field |
| LAW0032 นิติกรแจ้งกองบริหารคดี บันทึกผล | **22** | ✅ **major** |

## 19 — ธุรการรับคำวินิจฉัยชี้ขาด `Kanda.R`

**Changed:** the two big verdict cards became a **9-choice dropdown**; the outcome choice was
**kept** below it as `ผลต่อการดำเนินคดี`.

**Why:** the meeting wanted a dropdown ("ง่ายกว่าซ้ายขวา"). **The outcome was kept** because
pages 20, 21 and 22 all branch on it, and none of intake's 9 options says ฟ้อง or ไม่ฟ้อง —
they describe the prosecutor's *original* order. See the judgement call in the changes doc.

| check | expect |
|---|---|
| กรณีคำวินิจฉัยชี้ขาด | dropdown, **9 options**, same list as intake |
| pick `9. อื่นๆ` | free-text box appears |
| leave it blank, บันทึก | `กรุณาระบุกรณีคำวินิจฉัยชี้ขาด (อื่นๆ)` |
| ผลต่อการดำเนินคดี | still two cards — ให้ฟ้องคดี / ไม่ฟ้อง-ยุติคดี |
| **switch it and check 20, 21, 22** | their badges and summary follow it — this is what the extra field protects |

**Feedback wanted:** should this page use **อสส-worded** options
(`อสส. ชี้ขาดให้ฟ้อง`, `อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง`…) instead of intake's list? If so the
outcome field could be dropped. Needs wording from the working group.

## 20 / 21 — ผอ.กอง / ผอ.กลุ่มงาน รับผลวินิจฉัย

**Changed:** `มติอัยการ` field only.

| check | expect |
|---|---|
| detail card | `มติอัยการ` present and correct |
| verdict badge | matches what 19 recorded |

## 22 — นิติกรบันทึกผลและแจ้งกองบริหารคดี `Nattapol.B`

**Changed:** new **ผลจากพนักงานอัยการ (คำพิพากษา)** section beside the existing อสส one.

**Why:** *"ต้องมีของทั้ง อสส และ อัยการ (ส่งไป 2 ที่) · ชี้ขาด = อสส · พิพากษา = อัยการ"*. The
case goes to both, so both results come back.

| check | expect |
|---|---|
| อสส section | unchanged — เลขที่หนังสือ, วันที่, สรุป, ไฟล์ |
| **new** ผลจากพนักงานอัยการ (คำพิพากษา) | เลขที่หนังสือ · 2 dates · ผลคำพิพากษา · สรุป · แนบไฟล์ |
| choose a ผลคำพิพากษา | the badge updates live |
| choose `อื่นๆ` | free-text box appears |
| leave the whole section empty and submit | **allowed** — the อัยการ result may not have arrived yet |
| fill it and submit | saved; reopen and confirm it persisted |
| submit | signature modal still appears |

---

# Cross-cutting checks

| check | expect |
|---|---|
| Console (F12) on every page 01-22 | **no red errors** |
| Drive one case 02 → 06 → 07 → 08 → 09 → 10 → … → 22 | no dead ends, no lost data |
| Dark mode | ฐานความผิด rows, decision cards and yellow marks all readable |
| Below 1024px | steppers wrap, forms collapse to one column |
| Any page | **ผอ.กลุ่มงานความเห็นแย้ง** still says ความเห็นแย้ง — org unit, must not change |
| 17 / 18 / 19 file names | still `หนังสือความเห็นแย้ง_…` — the อสส-bound document, must not change |
| Board มติ on 10 / 11 / 12 | still `เห็นชอบให้ทำความเห็นแย้ง` — a real resolution, must not change |

---

# Defect log

| # | flow | page | what happened | expected | severity |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
