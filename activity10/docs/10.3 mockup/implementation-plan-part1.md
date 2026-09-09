# กิจกรรมที่ 10.3 — Part 1 Implementation Plan

**Scope:** [flow-page-01.md](flow-page-01.md) — รับคำฟ้อง - สรุปความเห็นเสนอบอร์ด (LAW0084-0096 + เพิ่มเติมสายบังคับบัญชา)
**Status:** วางแผนเท่านั้น ยังไม่ implement — รอคำสั่ง "implement" จากผู้ใช้ก่อนสร้าง/แก้ไฟล์จริง
**Naming convention:** `10-3-NN-role-action.html` (ตามแบบ `10-2-NN-role-action.html`)

## ทำไมต้องเป็น "10-3" ไม่ใช่ activity ใหม่

`activity10/` มีอยู่แล้ว 2 ชุด: flow หลัก (`01-...html` ถึง `22-...html`) และ 10-2-xx (คำขอเปิดเผยข้อมูลข่าวสาร) — 10.3 (คดีปกครอง) เป็นชุดที่ 3 ในไดเรกทอรีเดียวกัน ตามแบบที่ 10-2 วางไว้

## Confirmed decisions

| # | คำถาม | คำตอบ |
|---|---|---|
| 1 | "คดีปกครอง" ในหน้า inbox | เพิ่มเป็น work-type filter ใหม่ใน `01-work-inbox.html` ที่มีอยู่แล้ว (ใช้ inbox ร่วมกับ 10.1/10.2) |
| 2 | หน้าสำหรับขั้น "เสนอ" (ผอ.กลุ่มงานคดี, ระหว่าง LAW0087→LAW0088) | **ไม่สร้างหน้าแยก** — auto-transition (ไม่มี queue/การตัดสินใจจริงให้ทำที่จุดนี้) |
| 3 | รูปแบบเลขคดีตัวอย่าง | Placeholder แบบ 10.2 — `คดี-100XXX/2569` |
| 4 | หน้าเสนอบอร์ด ("กิจกรรมที่ 7") | ยังไม่มีหน้าจริงในระบบ — Part 1 จบที่สถานะ `L3_READY_FOR_BOARD` เป็น black box ไปก่อน |
| 5 | **หน้ารับเรื่อง (LAW0085, LAW0086)** | **ไม่สร้างไฟล์ใหม่ — ต่อขยาย `02-board-intake.html` ที่มีอยู่แล้ว** เพราะเป็นหน้ารับเรื่องกลางที่ใช้ร่วมกันทุกหมวดงาน (`in_category` dropdown มี option `"10.3" → "คดีศาลปกครอง"` อยู่แล้ว แต่ยังไม่มี field group เฉพาะ เหมือนที่ `div_disclosureRequest` มีไว้สำหรับ 10.2.1) — ต้องเพิ่ม `div_courtCase` block ที่โผล่มาเมื่อเลือกหมวด 10.3 |
| 6 | **สายมอบหมายหลังจากรับเรื่อง (ผอ.กองกฎหมาย → ผอ.กลุ่มงานคดี → นิติกร)** | **ต้องเป็นหน้าแยกครบทุกขั้น ห้าม auto-skip ข้ามระดับ** — ตรงกับ stepper 4 ขั้นที่ `02-board-intake.html` มีอยู่แล้ว (ธุรการ → ผอ.กองกฎหมาย → ผอ.กลุ่มงาน → นิติกร) คนละจุดกับ "เสนอ" ในข้อ 2 (ข้อ 2 คือขาขึ้นนิติกร→กอง ก่อนจะรับเรื่อง ส่วนข้อนี้คือขาลงหลังรับเรื่องแล้ว) |

### สมมติฐานที่ตั้งไว้ (โปรดยืนยัน)

`02-board-intake.html` จบด้วยการส่งตรงไปหา **ผอ.กองกฎหมาย** เสมอ (ไม่มีขั้น "นิติกรลงทะเบียนคดี" แยกต่างหากในหน้านี้ หรือใน stepper 4 ขั้นของ flow หลัก) — จึงตีความว่า **LAW0087 (นิติกรลงทะเบียนคดีปกครองเข้าสู่ระบบ E-CMIS)** ถูกครอบคลุมไปแล้วโดยการที่ธุรการสร้างสำนวนในระบบตั้งแต่ `02-board-intake.html` (การ "ลงทะเบียน" ของนิติกรในผังเดิมหมายถึงสำนวนมีอยู่ในระบบแล้วตอนถึงมือนิติกร ไม่ใช่การกดปุ่มลงทะเบียนซ้ำอีกครั้ง) — **ถ้าไม่ตรงกับที่ต้องการ ให้แจ้งกลับเพื่อเพิ่มหน้าแยกสำหรับ LAW0087**

## File plan — แก้ไข 1 ไฟล์เดิม + สร้างใหม่ 8 ไฟล์

| # | ไฟล์ | สถานะไฟล์ | บทบาท | ครอบคลุม LAW# | ทำอะไร | สถานะ (`statusCode`) ก่อนหน้านี้ | หมายเหตุ |
|---|---|---|---|---|---|---|---|
| 1 | `02-board-intake.html` | **แก้ไขไฟล์เดิม** | ธุรการกองกฎหมาย (E-CMIS) | LAW0085, LAW0086 (+ครอบคลุม LAW0087) | เพิ่ม `div_courtCase` field group (เลขคดีปกครอง, ศาลที่รับคำฟ้อง, วันที่รับหมายเรียก, แนบสำเนาคำฟ้อง) ที่แสดงเมื่อเลือก "คดีศาลปกครอง" — ส่งต่อผอ.กองกฎหมายเหมือนหมวดอื่น | `L3_PENDING_ADMIN_RECEIVE` | ใช้ `submitReceiveAndForward()` เดิม เพิ่มแค่ field group และปรับ payload ให้มี `l3*` fields |
| 2 | `10-3-02-legal-director-assign.html` | ใหม่ | ผอ.กองกฎหมาย | LAW0088 | ลงนามมอบหมาย (เข้าสู่กลุ่มงานคดี) | `L3_PENDING_DIRECTOR_ASSIGN` | ใช้ sign modal จาก 08-legal-director-approval.html |
| 3 | `10-3-03-group-director-assign.html` | ใหม่ | ผอ.กลุ่มงานคดี | LAW0089 | มอบหมายนิติกรผู้รับผิดชอบ | `L3_PENDING_GROUP_ASSIGN` | |
| 4 | `10-3-04-lawyer-review-complaint.html` | ใหม่ | นิติกร กลุ่มงานคดี | LAW0090 + decision | ตรวจสอบคำฟ้องหามูลเหตุคดี + checkbox "มีคำขอทุเลาการบังคับคดีมาด้วยหรือไม่" | `L3_PENDING_LAWYER_REVIEW` | ถ้าติ๊ก → สร้างงานคู่ขนานสถานะ `L3_STAY_REQUEST_PENDING` ไปหา Part 2 (นอก scope แผนนี้) |
| 5 | `10-3-05-legal-admin-coordinate-investigator.html` | ใหม่ | ธุรการกองกฎหมาย (E-CMIS) | LAW0091 | ประสานนักสืบเจ้าของสำนวนขอสำเนาสำนวนไต่สวน | `L3_PENDING_ADMIN_COORDINATE` | |
| 6 | `10-3-06-lawyer-draft-opinion.html` | ใหม่ | นิติกร กลุ่มงานคดี | LAW0092 | ทำบันทึกสรุปความเห็น | `L3_PENDING_LAWYER_OPINION` | |
| 7 | `10-3-07-group-director-approve.html` | ใหม่ | ผอ.กลุ่มงานคดี | LAW0093 | พิจารณาและเห็นชอบบันทึกความเห็น | `L3_PENDING_GROUP_APPROVE` | |
| 8 | `10-3-08-legal-director-sign.html` | ใหม่ | ผอ.กองกฎหมาย | LAW0094 | ตรวจสอบความถูกต้องครบถ้วน และลงนามผ่านเรื่อง | `L3_PENDING_DIRECTOR_SIGN` | ใช้ sign modal จาก 08-legal-director-approval.html |
| 9 | `10-3-09-legal-admin-dispatch.html` | ใหม่ | ธุรการกองกฎหมาย (E-CMIS) | LAW0095, LAW0096 | ออกเลขส่งภายใน + ส่งมติเสนอบอร์ด | `L3_PENDING_ADMIN_DISPATCH` | จบ Part 1 → `L3_READY_FOR_BOARD` (black box จนกว่าจะ implement หน้าเสนอบอร์ดจริง) |

**Status ที่ขับเคลื่อน Part 1:** `L3_PENDING_ADMIN_RECEIVE` → `L3_PENDING_DIRECTOR_ASSIGN` → `L3_PENDING_GROUP_ASSIGN` → `L3_PENDING_LAWYER_REVIEW` → `L3_PENDING_ADMIN_COORDINATE` → `L3_PENDING_LAWYER_OPINION` → `L3_PENDING_GROUP_APPROVE` → `L3_PENDING_DIRECTOR_SIGN` → `L3_PENDING_ADMIN_DISPATCH` → `L3_READY_FOR_BOARD`

## `div_courtCase` field spec (สำหรับ `02-board-intake.html` เมื่อเลือกหมวด "คดีศาลปกครอง")

| # | Field | Element ID | Type | Required | หมายเหตุ |
|---|---|---|---|---|---|
| 1 | ชื่อศาล | `in_courtName` | select: ศาลปกครองกลาง / ศาลปกครองสูงสุด / ศาลปกครองจังหวัด (+ ช่องระบุจังหวัดถ้าเลือกจังหวัด) | ✓ | |
| 2 | หมายเลขคดีดำ | `in_blackCaseNo` | text (font-monospace ตามแบบฟิลด์เลขอื่นๆ) | ✓ | |
| 3 | หมายเลขคดีแดง | `in_redCaseNo` | text (font-monospace) | optional | มีค่าเมื่อศาลตัดสินแล้วเท่านั้น |
| 4 | สั่งถึง | `in_orderedTo` | text | ✓ | ผู้รับคำสั่ง/หมายเรียกตามที่ระบุในเอกสารศาล |
| 5 | ชื่อผู้ฟ้อง | `courtPlaintiffList` | repeatable list (ปุ่ม "เพิ่มผู้ฟ้อง" เหมือน pattern `addOffenseBasisRow()`) | ✓ (อย่างน้อย 1) | เพิ่มได้หลายรายการ |
| 6 | ผู้ถูกฟ้อง | `courtDefendantList` | repeatable list (เหมือนข้อ 5) | ✓ (อย่างน้อย 1) | เพิ่มได้หลายรายการ |
| 7 | เลขสารบัญ | `in_courtSarabanNo` | text (font-monospace) | ✓ | คนละช่องกับ "เลขสารบรรณกลาง" ที่มีอยู่แล้วในฟอร์ม (ใช้ร่วมทุกหมวด) |
| 8 | หมายเหตุ | `in_courtRemark` | textarea | optional | |
| 9 | แนบเอกสาร | `in_courtAttachments` | file upload, multiple | optional | ใช้ pattern เดียวกับ `in_disclosureAttachments` ของ 10.2.1 |
| 10 | เลขรับกองกฎหมาย | *(ใช้ `f_lawReceiveNo` เดิม)* | — | ✓ | **ใช้ช่องที่มีอยู่แล้วร่วมกับหมวดอื่น ไม่สร้างซ้ำ** — ดูคำถามเปิดด้านล่าง |
| 11 | วันที่รับเรื่อง | *(ใช้ `in_physicalDocDate` เดิม)* | — | ✓ | **ใช้ช่องที่มีอยู่แล้วร่วมกับหมวดอื่น ไม่สร้างซ้ำ** — ดูคำถามเปิดด้านล่าง |
| 12 | หน่วยงานที่รับเรื่อง | `in_receivingUnit` | text หรือ select, ค่าเริ่มต้น "กองกฎหมาย" | ✓ | ฟิลด์ใหม่ ไม่มีในฟอร์มเดิม |

**คำถามเปิด:** ข้อ 10-11 (เลขรับกองกฎหมาย, วันที่รับเรื่อง) มีช่องอยู่แล้วในฟอร์มส่วนกลาง (`f_lawReceiveNo`, `in_physicalDocDate`) ที่ใช้ร่วมกับหมวด 10.1/10.2 — แผนนี้สมมติว่าให้ **ใช้ช่องเดิมร่วมกัน** ไม่ต้องสร้างช่องใหม่ซ้ำเฉพาะหมวด 10.3 ถ้าต้องการให้เป็นคนละช่อง (เช่น ความหมายไม่ตรงกัน) โปรดแจ้ง

## Data/infra changes needed

- **`02-board-intake.html`:** เพิ่ม `div_courtCase` block (รายละเอียดฟิลด์ด้านบน) + `toggleCourtCaseDiv()` ผูกกับ `onchange` ของ `in_category`
- **New shared files:** `assets/ecmis-10-3.js` (STEPS/ROUTES ตามแบบ `ecmis-10-2.js`), `assets/ecmis-10-3.css` ถ้าจำเป็น
- **New case type ใน 01-work-inbox.html:** เพิ่ม "คดีปกครอง" เป็น work-type filter/badge ใหม่
- **New fields บนเคส:** เลขคดีปกครอง (`คดี-100XXX/2569`), ศาลที่รับคำฟ้อง (ชั้นต้น), `l3HasStayRequest` (boolean, จากไฟล์ 4), วันที่รับหมายเรียก
- **Sample seed cases:** อย่างน้อย 1 เคสต่อ `statusCode` ใน `assets/ecmis-activity10.js` (`INITIAL_CASES`)
- **Sign modal:** คัดลอก `openSignatureModal()` จาก `08-legal-director-approval.html` มาใช้ในไฟล์ 2 และ 8

## บทบาท → ไฟล์ที่แต่ละ role เข้าถึงได้ (sidebar menu)

| บทบาท | ไฟล์ |
|---|---|
| ธุรการกองกฎหมาย (E-CMIS) | `02-board-intake.html` (แก้ไข), 5, 9 |
| นิติกร กลุ่มงานคดี | 4, 6 |
| ผอ.กลุ่มงานคดี | 3, 7 |
| ผอ.กองกฎหมาย | 2, 8 |

## Verification plan (หลัง implement)

1. Serve `activity10/` ผ่าน preview, ทดสอบเลือก "คดีศาลปกครอง" ใน `02-board-intake.html` แล้วไล่ทดสอบไฟล์ 2→9 ด้วยเคสตัวอย่าง
2. ทดสอบ branch คำขอทุเลาฯ ในไฟล์ 4 (ติ๊ก checkbox แล้วเช็คว่าสร้างสถานะคู่ขนานถูกต้อง)
3. ทดสอบ sign modal ในไฟล์ 2, 8 (ทั้งโหมดเซ็นมือและลายเซ็นดิจิทัล)
4. เช็ค console error, เช็คแบดจ์สถานะและ filter "คดีปกครอง" ใน `01-work-inbox.html` ถูกต้องทุก step
5. เช็คว่าหมวดเดิม (10.1, 10.2.1) ใน `02-board-intake.html` ยังทำงานปกติหลังเพิ่ม field group ใหม่ (ไม่ regression)
6. Reset ข้อมูลทดสอบหลังตรวจ (`Activity10.resetData()`)
