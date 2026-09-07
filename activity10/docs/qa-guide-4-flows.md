# QA guide — walking all 4 flows of 10.1

Covers **everything changed for the 01/09/2026 meeting** (Batch A + Batch B), laid out along
the four flows in `../../TO-BE 10.1-User-Flow-split.drawio`.

For each step you get: **the page**, **what changed**, **why**, and **what to check**.
Steps with no changes are listed too, so you can walk the flow end to end without wondering
whether you skipped something.

- Decisions and rationale: [`meeting-01092026-changes.md`](meeting-01092026-changes.md)
- Batch A detailed test cases: [`qa-batch-a-meeting-01092026.md`](qa-batch-a-meeting-01092026.md)
- Later work on `07`/`08`/`15` (signature blocks + a wording defect, 07/09/2026):
  [`session-07092026-attestation-and-labels.md`](session-07092026-attestation-and-labels.md)
  — **not yet covered by the steps below**, and it carries 2 items needing a ruling

Commits under test (7, on top of `bd2882a`):
`0e4b14f` Batch A · `dc1bc6b` Batch B + docs · `8ce2847` three workflow defects ·
`49e635d` อื่นๆ badge · `086e4aa` Flow 1 gaps · `be9845c` findings register ·
`d078afd` section-B fixes

**Findings we did NOT act on** are in
[`qa-findings-register.md`](qa-findings-register.md) section C — read that before handover;
they are decisions for the working group, not defects.

> ⚠ **The LAW codes below are my mapping, not the app's.** The 10.1 pages don't carry LAW
> codes in the markup (only the 10.2 series does). I matched them by role and step. Please
> sanity-check the mapping — if one is wrong, the test steps still hold, only the label moves.

---

## 0. Before you start

```
cd activity10
run.bat            →  http://localhost:8811/index.html
```

### 0.1 Start clean ⚠

**Hard-reload first: Ctrl+F5.** Shared assets carry version queries
(`ecmis-shell.css?v=20260907_1`, `ecmis-offense-basis.js?v=20260904_2`,
`ecmis-activity10.js?v=20260907_1`). A stale copy shows up as:

| symptom | cause |
|---|---|
| **no yellow highlights** anywhere | stale `ecmis-shell.css` |
| decision cards with radio and text pushed to opposite edges | stale `ecmis-shell.css` |
| **no red `*`** on the ฐานความผิด row labels | stale `ecmis-offense-basis.js` |
| a stranded case that cannot be approved by anyone | stale `ecmis-activity10.js` |

This bit us twice during development — check it before filing any of the above.

**Case data.** `DATA_VERSION` is `v46_fix_seed_prosecutor_source`. You should not normally
need to clear storage any more:

- a version bump now **carries your created cases across** instead of dropping them, and
  removes the old keys, so orphaned keys no longer pile up
- to force a full reseed, use the **รีเซ็ต** button on the inbox — it now warns, in red,
  that self-created cases are permanently deleted

If you do want a hard wipe from the console:

> F12 → Console:
> ```js
> Object.keys(localStorage).filter(k => k.startsWith('ecmis_act10_cases_'))
>   .forEach(k => localStorage.removeItem(k));
> location.reload();
> ```

### 0.2 Logins (no password check)

| role | username |
|---|---|
| ธุรการกองกฎหมาย | `Kanda.R` |
| นิติกร | `Nattapol.B` |
| ผอ.กลุ่มงานความเห็นแย้ง | `Arnon.C` |
| ผอ.กองกฎหมาย | `Napas.S` |
| **รองเลขาธิการ ป.ป.ท.** | **`Surapong.W`** |

⚠ **`Surapong.W` is not optional.** The executive signs twice, and both times the case is
parked with that role until it does — nobody else can move it on. Miss it and the flow looks
stuck with no button anywhere:

| after | case waits at | until `Surapong.W` presses |
|---|---|---|
| **09** (เสนอผู้บริหาร, round 1) | `PENDING_DEPUTY_SG` | **ลงนาม** → back to ธุรการ at **10** |
| **16** (เสนอผู้บริหาร, round 2) | `SUBMITTED_TO_EXEC_ROUND2` | **ลงนาม** → back to ธุรการ at **17** — [entry to Flow 3](#-how-to-get-into-flow-3-from-the-ธุรการ-ui) |

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
| **ผู้กล่าวหา (ผู้ร้อง) and ผู้ถูกกล่าวหา (จำเลย)** | **you can type in both** — they used to be readonly and fillable only via ค้นหาสำนวน |
| type both, save, open 03 | the names you typed appear — previously a hand-created case lost them forever |
| use **🔍 ค้นหาสำนวน**, then edit a name by hand, save | **your edit is kept**, not overwritten by the looked-up value |
| pick a lookup record with a missing name | the field is **blank with a placeholder**, never a literal `-` |
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
| **03 shows the names you typed at 02** | not `-` — this was previously impossible for a hand-created case |
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

## 07 / 08 / 09 — มติอัยการ, and the stranded-case bug ⭐ re-test these

**Changed after the first QA pass.** มติอัยการ used to be missing on exactly these three
pages — present 03-06, gone 07-09, back 10-22 — so the two approvers decided without seeing
what the prosecutor had ordered.

| check | expect |
|---|---|
| **มติอัยการ on 07, 08 and 09** | present, above ระดับศาล, matching the case (not `1. …ไม่ฟ้อง`) |
| the field across 03 → 22 | **never disappears** on any page |

**The stranded-case round trip** — this used to make a case unmovable by anyone:

| step | expect |
|---|---|
| on 07, approve a case | it moves to ผอ.กอง; log in as `Napas.S` and it **is in the inbox** |
| now send that same case **back** from 07 (or 08) | routing returns to นิติกร |
| reopen 07 | **the approve form and button are back**, step 5 active again |
| the case in each role's inbox | exactly one role sees it at a time — never nobody |

**Stepper sanity on 06-09** (these were mislabelled):

| check | expect |
|---|---|
| all four pages | **7 steps, numbered 1-7**, no duplicate labels |
| the step for each page's own work | marked complete once done, next step active |
| 07's last step | `7. ธุรการ ออกเลขส่ง` — **not 8** |

**Wrong / stale case id** (used to silently show a different case):

| check | expect |
|---|---|
| open any page with a made-up id, e.g. `?id=คดี-999999/2569` | a **yellow banner** naming both the requested and the shown case |
| open a page with a valid id, or with no `?id` at all | **no banner** |

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

## 🚪 How to get into Flow 3 from the ธุรการ UI

Flow 3 opens at **17**, which needs a case at `PENDING_ADMIN_SIGNED_RECEIVE`. There are two
ways in. **Take route A unless you are specifically testing the hand-off.**

### Route A — the seeded case (one click)

The demo data ships with a case already parked at 17.

1. Log in as **`Kanda.R`** → **01 work inbox**
2. Find the row whose status is **`ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)`**
   — it is **`0022/2569`** (`คดี-100007/2569`), on page 1 of the table
3. Press **ดำเนินการ** → lands on **17**

Two more cases are seeded one step further, at **18**, one per branch of the diagram —
useful for testing 18 without walking 17 first:

| doc no. | case | branch |
|---|---|---|
| `0024/2569` | `คดี-100008/2569` | → **อสส.** |
| `0025/2569` | `คดี-100009/2569` | → **อัยการต้นทาง (ไปรษณีย์ EMS)** |

> The table's first column is the **document number**, not the case id. Search by the status
> text, not by `คดี-1000xx`.

### Route B — walk a case in from Flow 2

⚠ **This is where people get stuck.** Submitting **16** does *not* send the case to 17 —
it sends it to **รองเลขาธิการ ป.ป.ท. to sign**, and ธุรการ cannot do that step.

1. As `Kanda.R`, take a case through **16** and submit
   → status becomes `SUBMITTED_TO_EXEC_ROUND2`, assigned to `deputy_sg`
2. **The case stays visible in ธุรการ's inbox but the button becomes a view-only 👁 icon.**
   That is correct, not a bug — it is parked with the executive
3. **Log out and back in as `Surapong.W`** (รองเลขาธิการ — *see the note under §0.2*)
4. Find the case (status `เสนอผู้บริหารลงนามหนังสือความเห็น`) → press the green **ลงนาม**
   → confirm **ลงนามสมบูรณ์และส่งคืนกองกฎหมาย**
   → status becomes `PENDING_ADMIN_SIGNED_RECEIVE`, back to `admin_legal`, step 17
5. **Back to `Kanda.R`** → the row now shows **ดำเนินการ** → **17**

```
16 ธุรการ ──submit──▶ SUBMITTED_TO_EXEC_ROUND2 ──╮
                                                 │  ⚠ role switch required
                     Surapong.W ──ลงนาม──────────╯
                          │
                          ▼
        PENDING_ADMIN_SIGNED_RECEIVE ──▶ 17 ธุรการ  ← Flow 3 starts
```

### If the inbox looks wrong

Press **รีเซ็ต** (top right of **01**) → *ลบสำนวนที่สร้างเอง และรีเซ็ต*. This restores the
seeded statuses above, including the case at 17. **It permanently deletes any case you created
yourself**, including the ถอนอุทธรณ์ case from §0.4 — recreate it afterwards if you still
need it.

### Which axis actually needs testing here

**Not มติอัยการ.** `17` and `18` only *display* it — neither branches on it, and neither uses
`PROSECUTOR_ORDER_PHRASE`. One spot-check with a non-`1` case is enough to confirm the value
carries through; nine runs tell you nothing extra.

**Test เห็นชอบ vs เห็นแย้ง instead** — that is what `18:823` branches on, and what the meeting
note (*เห็นชอบก็ต้องแจ้ง, เห็นแย้งก็แจ้งทั้ง อสส และ อัยการ*) is about. One seeded case each:

| doc no. | case | `finalOpinionType` | branch |
|---|---|---|---|
| `0024/2569` | `คดี-100008/2569` | เห็นควรทำความเห็นแย้ง… | เห็นแย้ง → อสส. |
| `0025/2569` | `คดี-100009/2569` | เห็นชอบตามคำสั่งไม่ฟ้อง… | เห็นชอบ → อัยการต้นทาง |

⚠ The branch falls back to `title.includes('เห็นชอบ')` when `finalOpinionType` is missing, so a
case whose **title** contains เห็นชอบ takes the agreed branch whatever its real opinion.
Pre-existing — worth knowing if a case behaves unexpectedly.

## 17 — ธุรการตรวจรับหนังสือลงนาม `Kanda.R`

**Changed:** two marked phrases removed; **destination chooser added**; stepper labels reflow.

**Why:** the diagram shows the destination is a **real branch**, so hardcoding
"(ส่งถึงอัยการสูงสุด)" was wrong. The meeting asked to choose it here.

| check | expect |
|---|---|
| card header | `ตรวจสอบความถูกต้องของหนังสือฉบับลงนามสมบูรณ์` — **no** ความเห็นแย้ง |
| verify item 1 | `เลขที่หนังสือส่งภายนอก` — **no** `(ส่งถึงอัยการสูงสุด)` |
| ส่งหนังสือไปที่ | **derived, read-only panel** (`#dispatchTargetDerived`) — **no checkboxes, no picker of any kind.** ธุรการ cannot choose or override this |
| open a เห็นชอบ case | panel shows one line: `✓ นิติกรเห็นชอบตามคำสั่งอัยการ` + one recipient row (พนักงานอัยการเจ้าของสำนวน) |
| open a เห็นแย้ง case | panel shows `⚠ นิติกรเห็นแย้งคำสั่งอัยการ` + **two** recipient rows (อสส. and พนักงานอัยการเจ้าของสำนวน) |
| either case | footer note reads `ระบบกำหนดปลายทางจากผลการพิจารณา ตามมติที่ประชุม 01/09/2569` |
| submit | no destination-related blocking message — there is nothing left to choose, so nothing to validate |
| stepper labels | wrap onto two lines, **never overlap** — try a narrow window too |

⚠ **The diagram shows either/or, never both.** Sending to both comes from the meeting
(*"แจ้งทั้ง อสส และ อัยการ"*). As of 07/09/2569 (later the same day) this is no longer a UI
choice at all — the recipient set is **derived** from the นิติกร's เห็นชอบ/เห็นแย้ง opinion via
`Activity10.getRequiredRecipients()`, the same function `18` uses. See
[`meeting-01092026-changes.md` Part 1D §7](meeting-01092026-changes.md#7-recipients-reworked-again--per-recipient-dispatch-derived-not-picked).

## 18 — นิติกรจัดส่งหนังสือ `Nattapol.B`

**Changed (07/09/2569, later rework):** the single delivery form is gone. Recipients are
**derived** the same way as `17` (เห็นชอบ → อัยการต้นทางเท่านั้น; เห็นแย้ง → อสส. **and**
อัยการต้นทาง), each recipient gets its **own tab** with its **own** delivery record
(`dispatchRecipients[]`), and each tab picks EMS or hand-delivery **independently**.

**Why:** a นิติกร may send to อสส. today and to the origin prosecutor tomorrow — one flat form
per case couldn't represent that, and forced both recipients onto the same method.

| check | expect |
|---|---|
| open a เห็นชอบ case | **one tab**, no tab strip needed (or a single, non-interactive tab) — no ผู้รับที่ 2 concept exists any more |
| open a เห็นแย้ง case | **two tabs**, one per recipient (`role="tab"`, `aria-selected`) |
| each tab's badge | `⚠ ยังไม่ได้กรอก` until saved, then `✅ บันทึกแล้ว <วันที่>` |
| click a tab | switches the active recipient's form; **no cross-contamination** — notes/fields typed for one recipient must not appear when switching to the other and back |
| keyboard: focus a tab, press ←/→ | moves focus and activates the adjacent tab (`handleRecipientTabKeydown`) — mouse is not required |
| save recipient 1 only | work-inbox status shows **`บันทึกแล้ว 1/2 หน่วยงาน — กรุณากรอกหน่วยงานที่เหลือ`**, case stays at `18` |
| save recipient 2 too | case status flips to dispatched; if **both** recipients chose EMS, text names the tracking number; if **any** recipient used hand-delivery, text says `จัดส่งครบทุกหน่วยงานแล้ว (n หน่วยงาน)` instead of claiming EMS |
| เห็นชอบ case, method selector | **never hidden or forced to EMS** — a เห็นชอบ recipient can be hand-delivered too (reverses the old "เห็นชอบ = EMS-only" rule) |
| tick หน่วยงานผู้รับ blank on hand-delivery, submit | still blocked: `กรุณาระบุหน่วยงานอัยการผู้รับ…` |
| ไปรษณีย์ EMS vs นำส่งด้วยตนเอง | matches ไม่เร่งด่วน / เร่งด่วน in the diagram, per recipient |
| **open an already-dispatched case** | read-only summary + **แก้ไขข้อมูลการจัดส่ง** button |
| press แก้ไข | tabs return **pre-filled per recipient** from `dispatchRecipients[]` (not from the old flat fields), with a banner warning it will overwrite |
| save again | overwrites cleanly, banner gone next time |
| flat fields for `19`/Flow 4 | `dispatchMethod`/`emsTrackingNo`/`oagReceiveDocNo`/`dispatchRecipientName` still get written — projected from the อสส. recipient's record (or the sole recipient's, for เห็นชอบ) |

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

# 01 — the work inbox

Not a flow step, but every flow starts and ends here.

| check | expect |
|---|---|
| a case whose กรณี is **9. อื่นๆ** | badge reads **`อื่นๆ *`** with the typed detail beneath it in small grey text |
| hover that badge | tooltip shows the full `9. อื่นๆ (รายละเอียด)` |
| rows for the other eight cases | **unchanged** — no extra line, no asterisk |
| notification bell / SLA warnings | say `ครบกำหนดยกร่างความเห็น` — **no** `ความเห็นแย้ง` |
| press **รีเซ็ต** | the confirm says in **red** that self-created cases are permanently deleted, and the button reads `ลบสำนวนที่สร้างเอง และรีเซ็ต` |
| cancel that dialog | nothing is lost |
| each role sees only their own queue | log in as each of the four users in §0.2 |

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

# Known — do NOT file these

These are already recorded in
[`qa-findings-register.md`](qa-findings-register.md) **section C**. They are open decisions
for the working group, not defects, and they go across at handover.

| you will notice | why it is not a defect |
|---|---|
| **Stepper models differ between flows** — 4, 5, 7, 6 steps; numbering restarts at 1 four times; runs 7-13 / 8-13 / 9-14 elsewhere; 13-14 unnumbered. "Step 5" means different things on 03-05 vs 06-09 | needs one canonical set of step names agreed first. **C1** |
| A page shows its own step as active even for a case that has not reached it | pages guard "already done" but not "not yet arrived". **C2** |
| **ผู้ถูกกล่าวหา** appears on only 8 of 20 pages | scattered, so possibly deliberate — unlike มติอัยการ which was a clean range with a hole. **C3** |
| **19** shows both a 9-choice dropdown *and* ผลต่อการดำเนินคดี | 20/21/22 branch on the outcome, and none of intake's 9 expresses ฟ้อง vs ไม่ฟ้อง. **C4** |
| **17/18** allow sending to both อสส and อัยการ, but the TO-BE diagram shows either/or | build follows the meeting; the diagram is out of date. **C5** |
| `กลุ่มงานความเห็นแย้ง`, board-resolution values, อสส-bound file names still say ความเห็นแย้ง | deliberately kept — org unit, choice values, real document. **C6** |
| **ฐานความผิด** is mandatory once a row is started | our call, reversible. **C7** |
| **13** lets you submit with no attachment | our call — the page promises the system generates the draft. **C7** |

---

# Handover checklist

- [ ] Final manual pass of this guide complete, defects below logged
- [x] Yellow review highlights removed at sign-off (07/09/2569) — the `REVIEW MARKER` block was deleted from `assets/ecmis-shell.css` and all 46 `<mark class="wording-changed">` tags across 22 pages unwrapped, text preserved
- [ ] [`qa-findings-register.md`](qa-findings-register.md) **section C** walked through with the working group
- [ ] **C1 (stepper models)** given an owner — it blocks any further stepper work
- [ ] TO-BE diagram updated or the dispatch requirement re-confirmed (**C5**)
- [ ] 🚨 **`19`'s 9 อสส-ruling labels signed off by a lawyer (C4)** — implementer-authored, and
      they now decide whether `20`/`21`/`22` treat the case as proceeding or closed. **Check
      options 3 and 4 (the `ถอนฟ้อง` pair) first.** Highest-priority item in section C.

---

# Defect log

| # | flow | page | what happened | expected | severity |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
