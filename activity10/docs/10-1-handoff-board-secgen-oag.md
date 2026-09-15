# กิจกรรม 10.1 — Data Handoff ไป/กลับ "ผู้บริหาร / คณะกรรมการ ป.ป.ท. / อสส."

> Scope: pages `01`–`22` + `assets/ecmis-activity10.js`, `ecmis-shell.js`, `ecmis-app.js` (ไม่รวมไฟล์ `10-2*`, `10-3*`)
> Source: อ่านจากโค้ด mockup ณ 2026-09-15 — อ้างอิงเป็น `file:line` (`js` = `assets/ecmis-activity10.js`, `01` = `01-work-inbox.html`)

---

## 0. TL;DR

- **10.1 ไม่มีคำว่า "กิจกรรมที่ 7" เลย** (มีเฉพาะใน 10.2 / 10.3) — ปลายทาง "ผู้บริหาร/บอร์ด" ของ 10.1 ใช้คำว่า *ผู้บริหาร*, *คกก. ป.ป.ท.*, *เลขาธิการ ป.ป.ท.*, *รองเลขาธิการ ป.ป.ท.*, *ประธาน* ปนกัน
- **ไม่มีหน้า/role/status ของคณะกรรมการ ป.ป.ท. จริง** — รองเลขาธิการฯ (deputy_sg) กดปุ่ม "ลงนาม" ใน work inbox แล้ว engine **สร้างมติบอร์ด default ให้เอง** (`signExecutiveDocRound1`, js:4639-4667)
- Handoff ออกนอกกองกฎหมายมี 5 จุด (+1 ภายใน ป.ป.ท.):

| # | ทิศ | ปลายทาง | หน้า | Status หลังส่ง |
|---|---|---|---|---|
| H1 | ➡ ส่ง (รอบ 1) | รองเลขาธิการ ป.ป.ท. → "เสนอ คกก. ป.ป.ท." | 08 → **09** → inbox sign | `PENDING_DEPUTY_SG` |
| H2 | ⬅ รับ | ผลมติ คกก. ป.ป.ท. (มาจากการลงนามรองเลขาฯ) | **10** → 11 → 12 | `RETURNED_FROM_EXEC` → `PENDING_DIRECTOR_RESOLUTION` |
| H3 | ➡ ส่ง (รอบ 2) | รองเลขาธิการฯ ลงนามหนังสือทางการ (ปฏิบัติราชการแทนเลขาธิการ) | 13–15 → **16** → inbox sign → **17** | `SUBMITTED_TO_EXEC_ROUND2` → `PENDING_ADMIN_SIGNED_RECEIVE` |
| H4 | ➡ ส่งภายนอก | อสส. และ/หรือ อัยการเจ้าของสำนวน | **18** | `DISPATCHED_TO_PROSECUTOR` |
| H5 | ⬅ รับภายนอก | คำวินิจฉัยชี้ขาด อสส. (+ ผลคำพิพากษาจากพนักงานอัยการ) | **19** → 20 → 21 → **22** | `PENDING_DIRECTOR_OAG_VERDICT_REVIEW` … `COMPLETED_OAG_RESOLVED` |
| H6 | ➡ ส่งภายใน ป.ป.ท. | กองบริหารคดี (กบค.) | **22** | `COMPLETED_OAG_RESOLVED` |

---

## 1. ❓ ต้องการให้ Clarify (ไม่ชัดในโค้ด)

| # | ประเด็น | หลักฐาน |
|---|---|---|
| C1 | **ใครเป็นผู้มีมติ?** บอร์ด (คกก. ป.ป.ท.) หรือ เลขาธิการ ป.ป.ท. | 06:798 "(เสนอ**เลขาธิการ ป.ป.ท.** ส่ง อสส. ชี้ขาด)" vs 01:2149 "ลงนามหนังสือเสนอ **คกก. ป.ป.ท.**" vs js:4653 เขียน `boardResolution` "ที่ประชุม**คณะกรรมการ ป.ป.ท.** มีมติ…" |
| C2 | **รองเลขาธิการฯ ลงนาม "เสนอบอร์ด" หรือ "ลงนามผลมติ"?** ปุ่มเดียวทำทั้งสองอย่าง ไม่มีขั้นประชุมบอร์ด | 01:2149-2157 ปุ่ม "ลงนามและส่งผลมติคืนกองกฎหมาย" |
| C3 | Stepper รวมเป็น "9. ผู้บริหารลงนาม / มติ คกก." — ควรแยกเป็น 2 step หรือไม่ | 10:729, 11:715, 12:664 |
| C4 | หน้า 09 แสดง "เลขาธิการ ป.ป.ท. (ผ่าน รองเลขาธิการ ป.ป.ท.)" แต่ dropdown มีแค่ รองเลขาธิการ | 09:874, 09:1002, 08:1098 |
| C5 | **"ประธาน"** ในหน้า 17 = ประธานกรรมการ ป.ป.ท. หรือ รองเลขาฯ? (ชื่อที่แสดงคือ นายสุรพงษ์ รองเลขาฯ) | 17:622, 667, 677, 715; field `signedPresidentName` js:4679 |
| C6 | 13/15/16 ใช้ label "ผลมติคำวินิจฉัยของ**ผู้บริหาร / คณะกรรมการ ป.ป.ท.**" | 13:620, 15:569, 16:557 |
| C7 | ไม่มี input มติบอร์ด (ครั้งที่ประชุม/วันที่/ประเภทมติ) — มติมีค่าเดียว "เห็นชอบให้ทำความเห็นแย้ง…" ไม่มีกรณีบอร์ดไม่เห็นชอบ | js:4653-4661 |
| C8 | หน้า 02 ชื่อ `board-intake` + route `PENDING_BOARD_INTAKE` แต่จริงๆ รับจาก **ฝ่ายสารบรรณกลาง** (หนังสืออัยการ) ไม่ใช่บอร์ด | 02:733, 01:2073 |
| C9 | 11/12 พูดถึง "หนังสือแจ้ง**ผู้ว่าราชการจังหวัด/หน่วยงานที่เกี่ยวข้อง**" แต่ไม่มี field/ผู้รับในหน้า 13–18 | 11:953, 12:940 |
| C10 | หน้า 22 "ผลจาก**พนักงานอัยการ** (คำพิพากษา)" — option เป็นผลของ **ศาล** | 22:342, 365-369 |
| C11 | ใน `ecmis-app.js` มี role `chairman`, `board`, `board_sec` → `08-board-resolution.html` (ของกิจกรรม 7.1) — 10.1 ควร handoff ไปหน้านั้นหรือไม่ | app.js:22-45, 2961 |
| C12 | กรณี **เห็นชอบ** หลังหน้า 18 (`DISPATCHED_TO_PROSECUTOR`) ไม่มีขั้นต่อ/ไม่มี status ปิดงาน | 01:2051-2058, 2118 |

---

## 2. H1 — ส่งเสนอผู้บริหาร / คกก. ป.ป.ท. (รอบ 1)

### 2.1 Chain ก่อนถึงจุดส่ง (ภายในกองกฎหมาย)

```
02 ธุรการรับเรื่อง ──► PENDING_DIRECTOR ──► 04 ผอ.กอง ──► PENDING_GROUP_DIRECTOR ──► 05 ผอ.กลุ่ม
──► DRAFTING_OPINION ──► 06 นิติกร ──► PENDING_GROUP_REVIEW ──► 07 ผอ.กลุ่ม (approve / return→06)
──► PENDING_DIRECTOR_APPROVAL ──► 08 ผอ.กอง (approve / return→06) ──► PENDING_DISPATCH ──► 09
```

### 2.2 หน้า 08 — ผอ.กองกฎหมาย ตรวจพิจารณาและสั่งการ (เลือกปลายทางผู้บริหาร)

| Field (id) | Label | Type | Req | Options / หมายเหตุ |
|---|---|---|---|---|
| `in_directorDecision` | ผลการตรวจพิจารณา / คำสั่งการ | radio | * | `dir_approve` เห็นชอบตามความเห็นที่เสนอ / `dir_return` ไม่เห็นชอบ |
| `in_forwardTarget` | มอบหมายธุรการกองกฎหมายส่งเสนอต่อผู้บริหารตามลำดับชั้น | select | * | option เดียว: **นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)** |
| `in_directorApprovalNotes` | ข้อสั่งการ / บันทึกข้อความถึงธุรการกองกฎหมาย | textarea | – | |
| (modal) | ลายมือชื่อ ผอ.กอง | signature | * | cert `PACC-LEGALDIR-2569-008` |

- **Status:** เข้าได้เมื่อ `PENDING_DIRECTOR_APPROVAL`
  - Approve → `PENDING_DISPATCH` "ธุรการออกเลขส่งและส่งต่อผู้บริหาร" (js:4245-4260)
  - Return → `DRAFTING_OPINION` "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)" (js:4261-4276) ⚠ UI บอกส่งกลับกลุ่มงาน แต่ engine ส่งถึงนิติกร
- **เอกสาร:** ไม่มีแนบในหน้านี้ (ร่างความเห็นจากหน้า 06: `ร่างบันทึกความเห็นแย้ง_สมบูรณ์.docx` / `ร่างบันทึกเห็นชอบ<กรณี>.docx` / `ร่างบันทึกความเห็นอื่นๆ.docx`)

### 2.3 หน้า 09 — ธุรการกองกฎหมาย ออกเลขส่งและส่งต่อผู้บริหาร ⭐ จุดส่ง

**ส่งไปที่:** `in_adminDispatchTarget` = **นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)** (09:1002) — display เดิมแสดง "เลขาธิการ ป.ป.ท. (ผ่าน รองเลขาธิการ ป.ป.ท.)" (09:874)

**Fields ที่กรอก**

| Field (id) | Label | Type | Req | หมายเหตุ |
|---|---|---|---|---|
| `in_adminDispatchNo` | เลขที่หนังสือส่งกองกฎหมาย (เลขส่ง กม.) | text | * | default `2569/0452` (กรอกเอง ไม่ใช่ running) |
| `in_adminDispatchDate` | วันที่ออกหนังสือส่ง | date | * (ไม่ validate) | ⚠ ไม่ถูกส่งเข้า engine — ใช้วันนี้แทน (js:4295) |
| `in_adminDispatchTarget` | ส่งเสนอต่อไปยัง | select | * | option เดียว (รองเลขาธิการ) |
| `in_adminDispatchNotes` | บันทึกข้อความนำส่ง / หมายเหตุเพิ่มเติม | textarea | – | |

**ข้อมูลที่ติดไปกับเรื่อง (display / carried fields)**
เลขสารบรรณกลาง, เลขรับกองกฎหมาย, ชื่อเรื่อง, เลขสำนวน, มติอัยการ (`prosecutorCaseTypeName`), ระดับศาล, ผอ.กองผู้อนุมัติ + วันที่ + endorsement + ข้อสั่งการ + ลายมือชื่อ ผอ.กอง, ความเห็นนิติกร (`opinionType`, `legalOpinionDraft`), ความเห็น ผอ.กลุ่ม

**เอกสารแนบ:** ไม่มี file slot

**Status**

| | Code | Thai |
|---|---|---|
| ก่อน | `PENDING_DISPATCH` | ธุรการออกเลขส่งและส่งต่อผู้บริหาร |
| หลังส่ง | `PENDING_DEPUTY_SG` | เสนอผู้บริหารลงนามหนังสือความเห็น (assignedRole `deputy_sg`, step 9) |

### 2.4 Inbox — รองเลขาธิการฯ "ลงนามหนังสือเสนอ คกก. ป.ป.ท." (ไม่มีหน้า)

- ปุ่ม: "ผู้บริหารลงนามเสนอ คกก. ป.ป.ท." (01:2518) → dialog "ลงนามหนังสือเสนอ คกก. ป.ป.ท." → "ลงนามและส่งผลมติคืนกองกฎหมาย" (01:2147-2157)
- Engine `signExecutiveDocRound1` (js:4639-4667) เขียนค่า **hard-code**:

| Field | ค่า |
|---|---|
| `signedBy` | นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.) |
| `signedExecutiveOrder` | เห็นชอบให้ทำความเห็นแย้ง |
| `signedDocFile` | 📄 **หนังสือผลมติ_2569_006.pdf** |
| `boardMeetingNo` | 14/2569 (default) |
| `boardMeetingDate` | วันนี้ |
| `boardResolution` | เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ |
| `boardResolutionDetail` | ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ |

- **Status:** `PENDING_DEPUTY_SG` → `RETURNED_FROM_EXEC` "ธุรการรับผลมติ" (assignedRole `admin_legal`, step 10)

---

## 3. H2 — รับผลมติ คกก. ป.ป.ท. กลับ

### 3.1 หน้า 10 — ธุรการกองกฎหมาย รับผลมติคณะกรรมการ ป.ป.ท. ⭐ จุดรับ

**ข้อมูลมติที่รับ (display only — ไม่มี input)**

| Display | Label | Source field |
|---|---|---|
| `f_meetingNo` | การประชุมครั้งที่ | `boardMeetingNo` |
| `f_boardMeetingDate` | วันที่ประชุมมีมติ | `boardMeetingDate` |
| `f_boardResolution` | ผลมติคณะกรรมการ | `boardResolution` |
| `f_boardResolutionDetail` | รายละเอียดมติการประชุม / ข้อสั่งการ | `boardResolutionDetail` |

**Fields ที่กรอก**

| Field (id) | Label | Type | Req | หมายเหตุ |
|---|---|---|---|---|
| (readonly) | ส่งเสนอต่อไปยัง | text | * | นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย) |
| `in_finalDispatchNotes` | บันทึกการส่งต่อ / หมายเหตุถึง ผอ.กองกฎหมาย | textarea | – | |

**เอกสาร:** ไม่แสดง `หนังสือผลมติ_2569_006.pdf` ในหน้านี้ (เริ่มแสดงที่หน้า 13)

**Status:** `RETURNED_FROM_EXEC` (หรือ `PENDING_FINAL_DISPATCH`) → **`PENDING_DIRECTOR_RESOLUTION`** "เสนอผลมติ ผอ.กองกฎหมาย" (js:4307)

### 3.2 หน้า 11 — ผอ.กองกฎหมาย สั่งการตามผลมติ

| Field (id) | Label | Type | Req | Options |
|---|---|---|---|---|
| `in_directorAction` | คำสั่งการตามผลมติ | text readonly | * | "รับทราบผลมติ และมอบหมายกลุ่มงานความเห็นแย้งจัดทำหนังสือตามมติ" (ไม่ถูกบันทึก) |
| `in_targetOfficer` | มอบหมายส่งต่อไปยัง | select | * | นายอานนท์ ชินประชา (ผอ.กลุ่มงานความเห็นแย้ง) |
| `in_directorNotes` | ข้อสั่งการเพิ่มเติมถึง ผอ.กลุ่มงานความเห็นแย้ง | textarea | – | |

Display: มติบอร์ด 4 fields ข้างบน · **Status:** → `PENDING_GROUP_RESOLUTION` "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ"

### 3.3 หน้า 12 — ผอ.กลุ่มงาน มอบหมายนิติกรตามมติ

| Field (id) | Label | Type | Req | Options |
|---|---|---|---|---|
| `in_groupDirectorAction` | คำสั่งการตามผลมติ | text readonly | * | (ไม่ถูกบันทึก) |
| `in_targetOfficer` | มอบหมายส่งต่อนิติกรเจ้าของสำนวน | select | * | นายณัฐพล บัวทุม / นางสาวนิติพร มีไพฑูรย์ / นายปติคุณ อู่ตะเภา / นายอานนท์ (ตนเอง) |
| `in_groupDirectorNotes` | ข้อสั่งการเพิ่มเติมถึงนิติกรเจ้าของสำนวน | textarea | – | ⚠ บันทึกเป็น `groupDirectorResolutionOrderNotes` แต่หน้า 13 อ่าน `groupDirectorResolutionNotes` → ไม่แสดง |

**Status:** → `PENDING_OFFICER_FINAL_DOC` "นิติกรจัดทำหนังสือความเห็นตามมติ"

---

## 4. H3 — ส่งเสนอผู้บริหารลงนามหนังสือทางการ (รอบ 2)

### 4.1 หน้า 13 — นิติกร จัดทำหนังสือความเห็นตามผลมติ (กำหนดผู้รับภายนอก)

| Field (id) | Label | Type | Req | Options |
|---|---|---|---|---|
| `in_opinionOption` | แนวทางจัดทำหนังสือตามมติ | radio | * | **AGREE** ทำหนังสือเห็นชอบตามมติอัยการ (ยุติเรื่อง) → ผู้รับ: พนักงานอัยการเจ้าของสำนวน · **DISSENT** ทำหนังสือความเห็นแย้งมติอัยการ (เสนอ อสส. ชี้ขาด) → ผู้รับ: อัยการสูงสุด ตาม ป.วิ.อ. ม.145/1 · **OTHER** ความเห็นอื่นๆ (ไม่ระบุผู้รับ) |
| `in_opinionOtherSpecify` | ระบุหัวข้อ/ประเภทความเห็นอื่นๆ | text | * ถ้า OTHER | |
| `in_finalDocSubject` | ชื่อเรื่อง | text | * (ไม่ validate) | auto จากชื่อเรื่อง |
| `in_officialDocHeading` | หัวข้อในหนังสือราชการ | text | – | |
| `in_finalDocSummary` | สรุปประเด็นข้อเท็จจริง ข้อกฎหมาย และเหตุผลในหนังสือแจ้งผล | textarea | * (ไม่ validate) | |
| `in_finalDocFile` | แนบไฟล์ร่างหนังสือความเห็นฉบับสมบูรณ์ — ฉบับที่ 1 | file | – | |
| `in_finalDocFile2` | ฉบับที่ 2 (กรณีเห็นแย้งต้องทำ 2 ฉบับ) | file | เฉพาะ DISSENT | ⚠ ไม่ถูกบันทึก |
| (modal) | ลายมือชื่อนิติกร | signature | * | |

**เอกสาร**
- แสดง: 📄 หนังสือผลมติ_2569_006.pdf
- สร้าง: 📄 ร่างหนังสือเห็นชอบคำสั่งไม่ฟ้อง.pdf / 📄 ร่างหนังสือความเห็นแย้ง_เสนออัยการสูงสุด.pdf (+ `_ฉบับที่2.pdf`) / 📄 ร่างหนังสือความเห็นอื่นๆ.pdf

**Status:** → `PENDING_GROUP_FINAL_REVIEW` (ทุก option) · `finalDocNo` default `ปปท. 0014/พิเศษ/2569`

### 4.2 หน้า 14 / 15 — ผอ.กลุ่ม / ผอ.กอง ตรวจหนังสือ

| หน้า | Field | Options | Status หลังส่ง |
|---|---|---|---|
| 14 | `rdReviewOption` ผลการตรวจพิจารณา + `in_reviewNotes` + signature | เห็นชอบร่าง… เสนอ ผอ.กอง / ส่งกลับให้นิติกรแก้ไข | `PENDING_DIRECTOR_FINAL_REVIEW` ⚠ return ก็ไปข้างหน้า |
| 15 | `in_legalDirectorAction` ผลการตรวจสอบหนังสือ + `in_legalDirectorNotes` + signature | เห็นชอบและมอบหมายธุรการออกเลขส่งเสนอผู้บริหาร / ส่งกลับกลุ่มงานทบทวน | `PENDING_FINAL_DISPATCH_ROUND2` ⚠ return ก็ไปข้างหน้า |

### 4.3 หน้า 16 — ธุรการกองกฎหมาย ออกเลขหนังสือส่งเสนอผู้บริหาร ⭐ จุดส่ง

**ส่งไปที่ (readonly):** นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.) — "ส่งเสนอผู้บริหารเพื่อลงนามหนังสือทางการ"

| Field (id) | Label | Type | Req | หมายเหตุ |
|---|---|---|---|---|
| `in_finalDispatchNo` | เลขที่หนังสือส่งภายใน | text | * | default `0088/2569` |
| `in_finalDispatchDate` | วันที่ออกเลขหนังสือส่ง | date | – | ⚠ ว่างเสมอ (engine ใช้วันนี้) |
| `in_finalDispatchNotes` | หมายเหตุ / บันทึกการส่งเสนอผู้บริหาร | textarea | – | |

**Carried:** มติ/ผู้ลงนามรอบ 1, `finalOpinionType`, `finalDocSubject`, `officialDocHeading`, `finalDocSummary`, ความเห็น+ลายมือชื่อ ผอ.กลุ่ม และ ผอ.กอง
**เอกสาร:** ไม่แสดงไฟล์

**Status:** `PENDING_FINAL_DISPATCH_ROUND2` → **`SUBMITTED_TO_EXEC_ROUND2`** "เสนอผู้บริหารลงนามหนังสือความเห็น" (assignedRole `deputy_sg`)

### 4.4 Inbox — รองเลขาธิการฯ "ลงนามหนังสือความเห็นฉบับสมบูรณ์" (ไม่มีหน้า)

`signExecutiveDocRound2` (js:4670):
- `signedPresidentName` = นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)
- `signedDocFile` = 📄 **หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf** (หรือ หนังสือแจ้งมติเห็นชอบ_…)
- **Status:** → `PENDING_ADMIN_SIGNED_RECEIVE` "ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)"

### 4.5 หน้า 17 — ธุรการตรวจสอบหนังสือลงนาม และส่งต่อนิติกร ⭐ จุดรับกลับจากผู้บริหาร

**รับ (display):** เลขที่หนังสือส่งภายใน/วันที่, **เลขที่หนังสือส่งภายนอก** (hard-code `ที่ ปปท 0014/1245`), ผู้ลงนาม ("ประธานลงนามแล้ว" ⚠ C5), 📄 ไฟล์หนังสือความเห็นแย้งฉบับลงนามสมบูรณ์ (มีตราครุฑ เลขส่งภายนอก และลายเซ็น)

| Field (id) | Label | Type | Req | หมายเหตุ |
|---|---|---|---|---|
| (readonly) | ผู้รับมอบหมาย (นิติกรเจ้าของสำนวน) | text | – | นายณัฐพล บัวทุม |
| `in_verifyDate` | วันที่ตรวจสอบและส่งต่อ | date | – | → `externalDispatchDate` |
| `dispatchTargetDerived` | ส่งหนังสือไปที่ | derived | * | ระบบกำหนด: เห็นชอบ → อัยการต้นทาง · เห็นแย้ง → อสส. และ อัยการต้นทาง ("ตามมติที่ประชุม 01/09/2569") |
| `in_adminVerifyNotes` | หมายเหตุ / บันทึกการส่งต่อนิติกร | textarea | – | |

**Status:** → `PENDING_OFFICER_EXTERNAL_DISPATCH` "นิติกรรับเรื่องหนังสือลงนามแล้ว"

---

## 5. H4 — ส่งหนังสือออกภายนอก (อสส. / อัยการเจ้าของสำนวน)

### หน้า 18 — นิติกรจัดส่งหนังสือให้อัยการ/อสส. ⭐ จุดส่งภายนอก

**ผู้รับ** (`getRequiredRecipients`, js:3608-3622) — 1 tab ต่อผู้รับ บันทึกแยกกัน

| ความเห็น (`finalOpinionType`) | ผู้รับ |
|---|---|
| มีคำว่า "เห็นชอบ" | `prosecutor` = `item.source` (สำนักงานอัยการเจ้าของสำนวน) |
| อื่นๆ (เห็นแย้ง) | `oag` = **สำนักงานอัยการสูงสุด (อสส.)** + `prosecutor` |

> ⚠ Bug: DISSENT จากหน้า 13 สร้างข้อความขึ้นต้น "เห็นชอบให้ทำความเห็นแย้ง…" → rule เข้าใจว่าเป็นเห็นชอบ → ส่งเฉพาะอัยการต้นทาง

**Fields ต่อผู้รับ 1 ราย**

| Field (id) | Label | Type | Req | Method |
|---|---|---|---|---|
| card method | เลือกวิธีการจัดส่งหนังสือ | radio card | * | `postal_ems` 1. ส่งผ่านไปรษณีย์ด่วนพิเศษ (EMS) / `hand_delivery` 2. นิติกรนำไปส่งด้วยตัวเอง |
| `in_emsTrackingNo` | เลขติดตามพัสดุ EMS | text(13) | * (≥10) | EMS |
| `in_emsDate` | วันที่ฝากส่งไปรษณีย์ | date | * | EMS |
| `in_emsPostOffice` | ที่ทำการไปรษณีย์ต้นทาง | text | – | EMS |
| `in_emsRecipientLabel` | หน่วยงานผู้รับระบุบนจ่าหน้า | readonly | – | EMS |
| `in_emsReceiptFile` | แนบไฟล์สลิป EMS / ใบเสร็จรับฝากไปรษณีย์ | file | – | EMS ⚠ ไม่บันทึก |
| `in_handDate` | วันที่นำส่งด้วยตนเอง | date | * | Hand |
| `in_handTime` | เวลานำส่ง | time | * | Hand |
| `in_oagReceiveDocNo` | เลขรับของ{ชื่อผู้รับ} | text | * | Hand |
| `in_handLocation` | สถานที่นำส่งเอกสาร | text | – | Hand |
| `in_handRecipient` | ผู้รับมอบเอกสาร | text | – | Hand |
| `in_handReceiptFile` | แนบไฟล์สแกนใบรับเอกสาร / ตราประทับรับเรื่อง | file | – | Hand ⚠ ไม่บันทึก |
| `in_dispatchNotes` | หมายเหตุ / บันทึกการนำส่งของนิติกร | textarea | – | ทั้งคู่ |

**Data ที่บันทึก:** `dispatchRecipients[] = { key, name, method, trackingNo, sentDate, postOffice, receiveDocNo, sentTime, receiverName, location, notes, savedAt }` + flat fields `dispatchMethod, emsTrackingNo, dispatchDate, oagReceiveDocNo, …`, `dispatchScenario` (`case_agreed`/`case_disagreed`), `dispatchRecipientType` (`prosecutor_origin`/`attorney_general`)

**เอกสารที่ส่ง:** 📄 หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1288.pdf / 📄 หนังสือแจ้งมติเห็นชอบ_ฉบับลงนามสมบูรณ์_ปปท0014_1290.pdf (⚠ เลขไม่ตรงกับหน้า 17 = 1245) · สลิป EMS / ใบรับเอกสาร (optional)

**Status**

| กรณี | Code | Thai |
|---|---|---|
| บันทึกยังไม่ครบ | `PENDING_OFFICER_EXTERNAL_DISPATCH` | นิติกรจัดส่งหนังสือ (บันทึกแล้ว x/y) |
| ครบทุกผู้รับ | **`DISPATCHED_TO_PROSECUTOR`** | จัดส่งครบทุกหน่วยงานแล้ว (EMS …) / (n หน่วยงาน) |
| → เห็นแย้ง | ไปหน้า 19 (routing เท่านั้น) | |
| → เห็นชอบ | ❓ ไม่มีขั้นต่อ (C12) | |

---

## 6. H5 — รับคำวินิจฉัยชี้ขาด อสส.

### 6.1 หน้า 19 — ธุรการรับผลคำวินิจฉัยชี้ขาดของอัยการสูงสุด ⭐ จุดรับภายนอก

| Field (id) | Label | Type | Req | Options |
|---|---|---|---|---|
| `in_oagVerdictNo` | เลขที่หนังสือคำวินิจฉัยของ อสส. | text | * | default `อส 0001/6789` ⚠ ถูกทับด้วย `docNo` เดิม |
| `in_oagVerdictDate` | วันที่ลงในหนังสือ อสส. | date | * | |
| `in_oagVerdictReceiveDate` | วันที่กองกฎหมายลงรับเรื่อง | date | * | |
| `in_oagVerdictCaseType` | กรณีคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.) | select | * | ดูตารางล่าง |
| `in_oagVerdictOtherText` | ระบุกรณีคำวินิจฉัยชี้ขาด (อื่นๆ) | text | * ถ้า 9 | |
| `in_oagVerdictOtherOutcome` | ผลต่อการดำเนินคดี | select | * ถ้า 9 | `PROSECUTE` อสส. ชี้ขาดให้ฟ้องคดี / `NON_PROSECUTE` อสส. ชี้ขาดไม่ฟ้อง/ยุติคดี |
| `in_oagVerdictSummary` | สรุปสาระสำคัญคำวินิจฉัยชี้ขาดของ อสส. | textarea | – | auto-fill |
| `in_oagVerdictFile` | แนบไฟล์หนังสือคำวินิจฉัยชี้ขาดฉบับเต็มของ อสส. (PDF) | file | * (ไม่ validate/ไม่บันทึก) | |
| `in_adminVerdictNotes` | หมายเหตุธุรการ / ข้อสังเกตในการรับเรื่อง | textarea | – | |

| # | กรณีคำวินิจฉัย | Outcome |
|---|---|---|
| 1 | อสส. ชี้ขาดให้ฟ้องคดี | PROSECUTE |
| 2 | อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง | NON_PROSECUTE |
| 3 | อสส. ชี้ขาดไม่ให้ถอนฟ้อง (ให้ดำเนินคดีต่อ) | PROSECUTE |
| 4 | อสส. ชี้ขาดยืนตามการถอนฟ้อง | NON_PROSECUTE |
| 5 | อสส. ชี้ขาดให้อุทธรณ์ | PROSECUTE |
| 6 | อสส. ชี้ขาดยืนตามคำสั่งไม่อุทธรณ์/ถอนอุทธรณ์ | NON_PROSECUTE |
| 7 | อสส. ชี้ขาดให้ฎีกา | PROSECUTE |
| 8 | อสส. ชี้ขาดยืนตามคำสั่งไม่ฎีกา/ถอนฎีกา | NON_PROSECUTE |
| 9 | อื่นๆ | เลือกเอง |

**เอกสาร:** 📄 หนังสือคำวินิจฉัยชี้ขาดฉบับเต็มของ อสส. (auto-name `หนังสือคำวินิจฉัยชี้ขาด_อสส_<tag>_อส0001_6789.pdf`)

**Status:** `DISPATCHED_TO_PROSECUTOR` (เห็นแย้ง) / `PENDING_ADMIN_OAG_VERDICT_INTAKE` (mock เท่านั้น) → **`PENDING_DIRECTOR_OAG_VERDICT_REVIEW`** "เสนอ ผอ.กอง ตรวจสอบคำวินิจฉัย อสส." (ทั้ง 2 outcome ไปทางเดียวกัน)

### 6.2 หน้า 20 / 21 — ผอ.กอง / ผอ.กลุ่ม ตรวจคำวินิจฉัย

Display: คำวินิจฉัย อสส. + ข้อมูลเดิม "**มติคณะกรรมการ ป.ป.ท. ที่เสนอ อสส.**" (`boardResolution`, `boardResolutionDetail`) + หลักฐานการจัดส่งถึง อสส. + บรรทัดเปรียบเทียบ ("ต่างจากมติอัยการเดิม — เห็นพ้องตามความเห็นแย้งของ ป.ป.ท." / "ยืนตามมติอัยการเดิม…")

| หน้า | Fields | Status หลังส่ง |
|---|---|---|
| 20 | `in_targetDirector` (นายอานนท์) *, `in_directorReviewDate` *, `in_directorNotes` * | `PENDING_GROUP_OAG_VERDICT_REVIEW` "เสนอ ผอ.กลุ่มงาน มอบหมายนิติกรบันทึกผล" |
| 21 | `in_targetOfficer` (นายณัฐพล) *, `in_groupDirectorReviewDate` *, `in_groupDirectorNotes` * | `PENDING_OFFICER_FINAL_NOTIFICATION` "รอนิติกรบันทึกผล และ แจ้งกองบริหารคดี" |

### 6.3 หน้า 22 — นิติกรบันทึกผลคำวินิจฉัย อสส. และแจ้งกองบริหารคดี (ปิด 10.1)

**รับ (optional) — ผลจากพนักงานอัยการ (คำพิพากษา)** ⚠ engine ไม่บันทึก field กลุ่มนี้

| Field (id) | Label | Type | Options |
|---|---|---|---|
| `in_prosecutorResultNo` | เลขที่หนังสือของพนักงานอัยการ | text | |
| `in_prosecutorResultDate` | วันที่ลงในหนังสือ | date | |
| `in_prosecutorResultReceiveDate` | วันที่กองกฎหมายลงรับ | date | |
| `in_prosecutorResultType` | ผลคำพิพากษา / ผลการดำเนินคดีของพนักงานอัยการ | select | ฟ้องคดีต่อศาลแล้ว / ศาลพิพากษาลงโทษ / ศาลพิพากษายกฟ้อง / ยุติการดำเนินคดี / อื่นๆ |
| `in_prosecutorResultOtherText` | ระบุผลคำพิพากษา (อื่นๆ) | text | |
| `in_prosecutorResultSummary` | สรุปสาระสำคัญคำพิพากษา / ผลคดี | textarea | |
| `in_prosecutorResultFile` | แนบไฟล์หนังสือ / คำพิพากษาจากพนักงานอัยการ (PDF) | file | |

**ส่ง (H6) — แจ้งกองบริหารคดี (กบค.)**

| Field (id) | Label | Type | Req |
|---|---|---|---|
| `in_notifyTarget` | หน่วยงานผู้รับหนังสือแจ้ง = กองบริหารคดี (กบค.) | readonly | * |
| `in_notifyDocNo` | เลขที่หนังสือแจ้งภายใน (default `ที่ ปปท 0014/น.1420`) | text | * |
| `in_notifyDate` | วันที่จัดทำหนังสือ | date | * |
| `in_notifySubject` | เรื่องหนังสือแจ้ง (⚠ ไม่บันทึก) | text | – |
| `in_officerNotes` | สาระสำคัญและข้อความในหนังสือแจ้งกองบริหารคดี | textarea | * |
| (modal) | ลงนามบันทึกแจ้งผลและปิดกระบวนงาน 10.1 | signature | * |

**เอกสาร:** 📄 หนังสือแจ้งผลคำวินิจฉัยชี้ขาด_ถึงกองบริหารคดี_ปปท0014_น1420.pdf · 📄 คำพิพากษาจากพนักงานอัยการ (optional)

**Status:** → **`COMPLETED_OAG_RESOLVED`** "เสร็จสิ้นกระบวนงาน (คำวินิจฉัย อสส. ชี้ขาด)" (`isCompleted=true`, assignedRole = null)

---

## 7. Status catalogue (10.1 ทั้งหมด ตามลำดับ)

| # | Code | Thai | Role | หน้า |
|---|---|---|---|---|
| 1 | `PENDING_DIRECTOR` | ผอ.กองกฎหมายพิจารณา | dir_legal | 04 |
| 2 | `PENDING_GROUP_DIRECTOR` | ผอ.กลุ่มงานความเห็นแย้งพิจารณา | group_director | 05 |
| 3 | `DRAFTING_OPINION` | นิติกรจัดทำความเห็น | legal_officer | 06 |
| 4 | `PENDING_GROUP_REVIEW` | เสนอ ผอ.กลุ่มงานตรวจร่างความเห็น | group_director | 07 |
| 5 | `PENDING_DIRECTOR_APPROVAL` | เสนอ ผอ.กองกฎหมายพิจารณาความเห็น | dir_legal | 08 |
| 6 | `PENDING_DISPATCH` | ธุรการออกเลขส่งและส่งต่อผู้บริหาร | admin_legal | 09 |
| 7 | **`PENDING_DEPUTY_SG`** | เสนอผู้บริหารลงนามหนังสือความเห็น | deputy_sg | inbox (H1) |
| 8 | **`RETURNED_FROM_EXEC`** | ธุรการรับผลมติ | admin_legal | 10 (H2) |
| 9 | `PENDING_DIRECTOR_RESOLUTION` | เสนอผลมติ ผอ.กองกฎหมาย | dir_legal | 11 |
| 10 | `PENDING_GROUP_RESOLUTION` | ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ | group_director | 12 |
| 11 | `PENDING_OFFICER_FINAL_DOC` | นิติกรจัดทำหนังสือความเห็นตามมติ | legal_officer | 13 |
| 12 | `PENDING_GROUP_FINAL_REVIEW` | ผอ.กลุ่มงานตรวจหนังสือความเห็น | group_director | 14 |
| 13 | `PENDING_DIRECTOR_FINAL_REVIEW` | ผอ.กองตรวจหนังสือความเห็น | dir_legal | 15 |
| 14 | `PENDING_FINAL_DISPATCH_ROUND2` | ธุรการออกเลขส่งเสนอผู้บริหาร | admin_legal | 16 |
| 15 | **`SUBMITTED_TO_EXEC_ROUND2`** | เสนอผู้บริหารลงนามหนังสือความเห็น | deputy_sg | inbox (H3) |
| 16 | **`PENDING_ADMIN_SIGNED_RECEIVE`** | ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ) | admin_legal | 17 |
| 17 | `PENDING_OFFICER_EXTERNAL_DISPATCH` | นิติกรรับเรื่องหนังสือลงนามแล้ว / นิติกรจัดส่งหนังสือ (บันทึกแล้ว x/y) | legal_officer | 18 |
| 18 | **`DISPATCHED_TO_PROSECUTOR`** | จัดส่งครบทุกหน่วยงานแล้ว | legal_officer | 18 → 19 (H4) |
| 19 | `PENDING_ADMIN_OAG_VERDICT_INTAKE` | รอธุรการรับผลคำวินิจฉัย อสส. (mock only) | admin_legal | 19 |
| 20 | **`PENDING_DIRECTOR_OAG_VERDICT_REVIEW`** | เสนอ ผอ.กอง ตรวจสอบคำวินิจฉัย อสส. | dir_legal | 20 (H5) |
| 21 | `PENDING_GROUP_OAG_VERDICT_REVIEW` | เสนอ ผอ.กลุ่มงาน มอบหมายนิติกรบันทึกผล | group_director | 21 |
| 22 | `PENDING_OFFICER_FINAL_NOTIFICATION` | รอนิติกรบันทึกผล และ แจ้งกองบริหารคดี | legal_officer | 22 |
| 23 | **`COMPLETED_OAG_RESOLVED`** | เสร็จสิ้นกระบวนงาน (คำวินิจฉัย อสส. ชี้ขาด) | – | – (H6) |

**Code ที่อ้างถึงแต่ engine ไม่เคย set:** `PENDING_BOARD` "อยู่ระหว่างคณะกรรมการ ป.ป.ท. พิจารณา" (01:1048 mock), `PENDING_BOARD_INTAKE`, `PENDING_SECGEN`, `PENDING_RESOLUTION_INTAKE`, `PENDING_DIRECTOR_RESOLUTION_ORDER`, `PENDING_GROUP_DIRECTOR_RESOLUTION_ORDER`, `PENDING_FINAL_DISPATCH`, `PENDING_OFFICER_FINAL_ACTION`, `FINAL_DISPATCHED`

---

## 8. Roles

| Role key | ชื่อ | ตำแหน่ง | ใช้ใน 10.1 |
|---|---|---|---|
| `admin_legal` | นางกานดา รักษ์ธรรม | เจ้าหน้าที่ธุรการกองกฎหมาย | ✅ |
| `dir_legal` | นายนภัส สอนดี | ผู้อำนวยการกองกฎหมาย | ✅ |
| `group_director` | นายอานนท์ ชินประชา | ผู้อำนวยการกลุ่มงานความเห็นแย้ง | ✅ |
| `legal_officer` | นายณัฐพล บัวทุม | นิติกรชำนาญการพิเศษ | ✅ |
| `deputy_sg` | นายสุรพงษ์ วัฒนา | รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย | ✅ (ลงนามใน inbox เท่านั้น) |
| `secgen` | นายอภิชาติ สุจริตกุล | เลขาธิการ คณะกรรมการ ป.ป.ท. | ❌ defined แต่ไม่ถูก route |
| `chairman` | – | ประธานกรรมการ ป.ป.ท. (app.js) | ❌ |
| `board` | – | กรรมการ ป.ป.ท. (app.js) | ❌ |
| `case_management` | – | เจ้าหน้าที่กองบริหารคดี (ผู้รับหนังสือหน้า 22) | ❌ ไม่มีหน้า |

---

## 9. Bugs / Gaps ที่พบระหว่างอ่าน (เพื่อทราบ)

1. หน้า 14, 15 ตัวเลือก "ส่งกลับ" ไม่ทำงาน — engine ส่งไปข้างหน้าเสมอ
2. หน้า 08 Return: UI บอกกลับกลุ่มงาน แต่ engine ส่งถึงนิติกรตรง
3. หน้า 13–16 label `${signedExecutiveOrder}ให้ทำความเห็นแย้ง` → แสดงซ้ำ "…ให้ทำความเห็นแย้งให้ทำความเห็นแย้ง"
4. DISSENT ที่หน้า 13 มีคำว่า "เห็นชอบ" นำหน้า → `getRequiredRecipients` ไม่ใส่ อสส.
5. หน้า 12 notes บันทึกผิดชื่อ field → หน้า 13 ไม่แสดง
6. หน้า 09 / 16 วันที่ที่กรอกไม่ถูกบันทึก
7. หน้า 13 ฉบับที่ 2, หน้า 18 สลิป/ใบรับ, หน้า 19 ไฟล์คำวินิจฉัย, หน้า 22 ผลคำพิพากษา + เรื่องหนังสือแจ้ง — ไม่ถูกบันทึก
8. หน้า 19 `in_oagVerdictNo` ถูกทับด้วยเลขหนังสืออัยการเดิม
9. เลขหนังสือส่งภายนอกไม่ตรงกัน: 17 = `0014/1245`, 18 = `0014/1288` / `1290`
10. `workflowStep` ไม่ต่อเนื่อง (13 → 11, 17 → 15)
