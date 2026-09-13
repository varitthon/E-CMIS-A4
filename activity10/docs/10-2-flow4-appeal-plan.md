# กิจกรรมที่ 10.2 — Flow 4: อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล (แผน + สถานะ implement)

> **สถานะเอกสาร:** กำลัง implement ทีละหน้า — ดูสถานะ ✅/⬜ ต่อหน้าด้านล่าง
> **อ้างอิงผังเดิม:** [`docs/10.2 mockup/TO-BE10.2-swimlane-split.drawio`](10.2%20mockup/TO-BE10.2-swimlane-split.drawio) หน้า 6 "อุทธรณ์คำสั่ง (LAW0069–LAW0079)" **เฉพาะหน้านี้** — หน้า 7 "แจ้งผลอุทธรณ์ (LAW0080–LAW0083)" ยังไม่อยู่ในสโคปรอบนี้
> **จุดเริ่ม:** ต่อจาก Flow 1 (มติเลขาธิการ — ไม่อนุญาตเปิดเผย) ที่จบที่ [10-2-17-legal-admin-deny-dispatch-committee.html](../10-2-17-legal-admin-deny-dispatch-committee.html) (`L2_CASE_CLOSED_DENY_ASSIGNED`) — ผู้ยื่นคำขอที่ได้รับแจ้งว่าไม่อนุญาตเปิดเผยข้อมูล มีสิทธิ์ยื่นอุทธรณ์ต่อ
> **คำร้องเดินต่อในระเบียนเดิม:** ไม่สร้างเลขคำร้องใหม่ — สถานะใหม่ทั้งหมดเขียนทับ/ต่อยอดบนคำร้องเดิม (เช่น `คำร้อง-100019/2569`, `คำร้อง-100020/2569`)

---

## 0. สิ่งที่ต้องระวัง / เช็คก่อนทำต่อ (อ่านก่อนเริ่ม session ถัดไป)

- **✅ ครบทั้ง 10 หน้าแล้ว:** `10-2-appeal-09-case-bureau-director-board-propose.html` (LAW0078, role `case_bureau_director`, เขียน `L2_PENDING_APPEAL_BOARD_DISPATCH`, มี signature slot `appealBureauDirectorBoardPropose`) และ `10-2-appeal-10-legal-admin-board-submit.html` (LAW0079, role `admin_legal`, เขียน `L2_APPEAL_SUBMITTED_TO_BOARD` terminal-for-now, ไม่มี signature เพราะเป็นแค่ธุรการออกเลขส่ง) — Flow 4 (เท่าที่ตกลงกันไว้) เสร็จสมบูรณ์แล้ว ยังเหลือแค่งานเอกสาร (ดูข้อถัดไป)
- **Bug pattern ที่เคยพลาดมาแล้วครั้งหนึ่ง (ต้องระวังซ้ำ):** ทุกหน้าต้องเช็ค precondition ด้วย statusCode ที่ **STEP ก่อนหน้า** เขียนไว้ (`Activity102.getCase(id, "<prev status>")` และเงื่อนไข `if (!currentCase || currentCase.statusCode !== "<prev status>")`) — **ห้ามใช้ค่า `STEP.statusCode` ของหน้าตัวเอง** (นั่นคือค่าที่หน้านี้ผลิตออกไปให้หน้าถัดไป ไม่ใช่ค่าที่ใช้เช็คว่าใครมาถึงหน้านี้ได้) ดู commit ของ appeal-02 เป็นตัวอย่าง bug ที่เคยเกิด
- **กฎการแสดงผลที่ต้องทำทุกหน้า (ยึดตั้งแต่ appeal-03 เป็นต้นไป):**
  1. แสดงข้อมูล**ทั้งหมด**ที่ทุกหน้าก่อนหน้าบันทึกไว้ (การ์ด "ข้อมูลจากขั้นตอนก่อนหน้า") ไม่ใช่แค่บางส่วน
  2. เอกสารแนบทุกจุดต้องเรียก `ECMIS102.renderAttachments(containerId, fileNames)` (มีปุ่มดาวน์โหลดในตัว) ไม่ใช่แสดงชื่อไฟล์เป็นข้อความเฉย ๆ
  3. ทุกหน้าที่มีการลงนามมาก่อนหน้าต้องแสดงลายเซ็นสะสมทั้งหมด (ไม่ใช่แค่ของหน้าก่อนหน้าหน้าเดียว) ผ่าน `ECMIS102.renderSignatureList(containerId, kase, slots)` — `slots` คือ `{slot, title}` ทุกขั้นที่ลงนามมาก่อนหน้าตามลำดับเวลาจริง
  4. ทุกช่อง comment/textarea ที่ไม่บังคับต้องมี default value ("-") ไม่ปล่อยว่าง
  5. ทุกขั้นที่เป็น "การพิจารณา/มอบหมาย/เสนอ" อย่างเป็นทางการ (ไม่ใช่แค่บันทึกข้อมูลธรรมดาแบบ appeal-01) ต้องมี signature modal (`ECMIS102.openSignatureModal` + `Activity102.sign`) ก่อน `Activity102.advance` เสมอ — ผู้ใช้ยืนยันรูปแบบนี้ซ้ำหลายครั้งตลอดทั้ง flow
  6. ฟิลด์ "มอบหมายถึง" ที่เป็น dropdown ต้องแสดง**ชื่อบุคคลจริง** (`ECMIS102.signerLabel(roleId)`) ไม่ใช่แค่ชื่อตำแหน่ง — ตั้งค่า `<option>` text ผ่าน JS ตอน `populate()`
- **Role ใหม่ทั้งหมดถูกเพิ่มใน `login.html`'s `ACTIVE_ROLE_IDS` แล้ว:** `case_bureau_director`, `case_tracking_director`, `appeal_subcommittee_secretariat`, `appeal_ruling_subcommittee`, `original_officer` — ไม่ต้องเพิ่มซ้ำ
- **Naming convention ของฟิลด์ข้อมูล:** ทุกฟิลด์ใหม่ของ Flow 4 ขึ้นต้นด้วย `l2Appeal...` (เช่น `l2AppealReceiveNo`, `l2AppealRulingType`) — ตาม pattern เดิมของ `l2...` ที่ใช้ทั้งไฟล์ `ecmis-10-2.js`/`ecmis-activity10.js`
- **Naming convention ของ signature slot:** ตั้งชื่อ slot ตามบทบาทที่ลงนาม+การกระทำ เช่น `appealBureauDirectorAssign`, `appealTrackingDirectorAssign`, `appealCaseOwnerOpinion`, `appealAgenda`, `appealRuling`, `appealSecretariatMemo`, `appealTrackingSign` — หน้าถัดไปต้องต่อ pattern นี้ เช่น appeal-09 ควรใช้ slot `appealBureauDirectorBoardPropose`
- **ข้อมูลตัวอย่าง (sample data):** ครบแล้วทั้ง 10 หน้า — เลขคำร้องล่าสุดที่ใช้คือ `คำร้อง-100042/2569` (ตัวถัดไปหากมีการขยาย flow นี้อีกคือ `100043`) — `100041` ทดสอบหน้า appeal-09 (สถานะ `L2_PENDING_APPEAL_BOARD_DISPATCH`), `100042` ทดสอบสถานะปิดท้าย terminal (`L2_APPEAL_SUBMITTED_TO_BOARD`)
- **⬜ ยังไม่ได้ทำ:** เพิ่มหัวข้อ Flow 4 ใน [`docs/10-2-flow-by-board-resolution.md`](10-2-flow-by-board-resolution.md) (ไฟล์สรุป Flow 1-3 เดิม) เพื่อให้เอกสารภาพรวมครบทุก Flow — นี่คืองานเดียวที่เหลืออยู่ของแผนนี้
- **นอกสโคป (ยืนยันแล้วว่าไม่ทำรอบนี้):** sheet 7 ("แจ้งผลอุทธรณ์", LAW0080-083) — การแจ้งผลหลังบอร์ดมีมติกลับมา ยังไม่มีหน้ารองรับ ปล่อยให้ `L2_APPEAL_SUBMITTED_TO_BOARD` เป็นสถานะปิดท้ายแบบ terminal-for-now

---

## 1. สรุปการเปลี่ยนแปลงจากผังเดิม

| จุด | ผังเดิม (drawio หน้า 6) | สิ่งที่ implement จริง | เหตุผล |
| --- | --- | --- | --- |
| LAW0069–071 (ผู้อุทธรณ์ยื่น + เจ้าหน้าที่ส่วนกลาง/เขตลงรับ + ระบบ E-CMIS บันทึกเข้าสู่ระบบ) | 3 เลนแยกกัน (เลนสุดท้ายเป็นขั้นอัตโนมัติของ "ระบบ E-CMIS") | **รวมเป็นหน้าเดียว** — ธุรการกองกฎหมายรับหนังสืออุทธรณ์และคีย์ข้อมูลเข้าระบบในหน้าเดียวกัน | เดิมแยกเป็น 2 หน้า (รับเรื่อง / คีย์เข้าระบบ) ตามคำขอแรก แต่ภายหลังผู้ใช้ขอให้รวมกลับเป็นหน้าเดียวเพื่อลดจำนวนคลิก โดยธุรการยังกรอกครบทุกฟิลด์ของทั้งสองขั้นในฟอร์มเดียว |
| LAW0072 (กองบริหารคดี พิจารณาและมอบหมาย) | ไม่ระบุระดับตำแหน่งชัดเจน | **ผอ.กองบริหารคดี** (role ใหม่ `case_bureau_director`) | ให้ตรงกับรูปแบบ "ผอ.มอบหมายงาน" ที่ใช้ทั้งระบบ (เทียบ 10-2-01) |
| LAW0073 (กลุ่มงานบริหารติดตามคดี พิจารณาและมอบหมาย) | ไม่ระบุระดับตำแหน่งชัดเจน | **ผอ.กลุ่มงานบริหารติดตามคดี** (role ใหม่ `case_tracking_director`) | เช่นเดียวกับข้างบน |
| LAW0074 (เจ้าของสำนวน แจ้งผู้อุทธรณ์ 3 วัน / ทำความเห็น 10 วัน) | ไม่ระบุ UI | **นิติกรเจ้าของสำนวน** (ใช้ role `original_officer` เดิม) UI เรียบง่าย: **ช่องข้อความ (optional) + แนบไฟล์ (optional)** เท่านั้น | ลดความซับซ้อนของฟอร์ม ไม่ต้องมีฟิลด์บังคับ |
| LAW0075 (กลุ่มงานบริหารติดตามคดี ในฐานะฝ่ายเลขาฯ จัดทำวาระ) | ไม่ระบุระดับตำแหน่งชัดเจน | **ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์** (role ใหม่ `appeal_subcommittee_secretariat`) | บทบาทนี้ทำหน้าที่เลขานุการของคณะอนุกรรมการวินิจฉัยอุทธรณ์โดยเฉพาะ ไม่ใช่สายบังคับบัญชาของกลุ่มงานติดตามคดี |
| LAW0076 (คณะอนุกรรมการวินิจฉัยอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลหรือข้อเท็จจริง พิจารณาและมีคำวินิจฉัย) | มี role `subcommittee_appeal` อยู่แล้วใน `ecmis-app.js` (ชื่อสั้น "คณะอนุกรรมการวินิจฉัยอุทธรณ์") | role ใหม่ `appeal_ruling_subcommittee` (ชื่อเต็มตามผังเดิม) — แยกจาก `subcommittee_appeal` เดิม ตามที่ผู้ใช้ยืนยัน | ยืนยันแล้วว่าต้องการ role ใหม่แยก ไม่ใช้ role เดิม |
| LAW0077 (ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ จัดทำบันทึกเสนอ) | — | ใช้ role เดียวกับ LAW0075 | สอดคล้องกัน — บทบาทเดียวกันทำทั้งจัดวาระและจัดทำบันทึกเสนอ |
| *(แทรกใหม่ ไม่มีใน LAW เดิม)* | ไม่มี | **เพิ่มขั้นตอนใหม่ก่อน LAW0078**: ผอ.กลุ่มงานบริหารติดตามคดี ลงนามส่งต่อให้ ผอ.กองบริหารคดี | ผู้ใช้ระบุให้เพิ่มการลงนามส่งต่อระหว่างสองระดับผู้อำนวยการ ก่อนนำเรื่องเข้ากิจกรรมที่ 7 |
| LAW0078 (ผอ.กองบริหารคดี พิจารณาและนำเรื่องเข้ากิจกรรมที่ 7) | เป็นกล่องเดียวที่ทำทั้งพิจารณาและส่ง | ใช้ role เดียวกับ LAW0072 (ผอ.กองบริหารคดี) | สอดคล้องกับรูปแบบเดิม |
| LAW0079 (ระบบ E-CMIS ยื่นมติบอร์ด) | เป็นขั้นอัตโนมัติ | **ธุรการกองกฎหมาย** ออกเลขส่ง/ยื่นเรื่องจริง (ไม่ใช่ระบบอัตโนมัติ) — เป็นจุด**จบสโคปรอบนี้** | ตามรูปแบบคู่ "ผอ.ลงนามเสนอ → ธุรการออกเลขส่ง" ที่ใช้ซ้ำทั้งระบบ (เช่น 10-2-08/09, 10-2-16/17) |
| LAW0080–083 (หน้า 7 แจ้งผลอุทธรณ์) | มติบอร์ดกลับมา → แจ้งผู้อุทธรณ์ | **ไม่ implement รอบนี้** — เพิ่มคำร้องตัวอย่างที่แสดงสถานะ "ผ่านกิจกรรมที่ 7 มีมติแล้ว รอขั้นตอนแจ้งผล (ยังไม่มีหน้า)" เพื่อเตรียมข้อมูลไว้สำหรับ sheet 7 ในอนาคต | ยืนยันสโคปนี้แล้ว |

---

## 2. Role ใหม่ใน `assets/ecmis-app.js` (✅ implement แล้ว)

| id | title | group | act | ใช้ในขั้น |
| --- | --- | --- | --- | --- |
| `case_bureau_director` | ผู้อำนวยการกองบริหารคดี | กองบริหารคดี | `10.2` | LAW0072, LAW0078 |
| `case_tracking_director` | ผู้อำนวยการกลุ่มงานบริหารติดตามคดี | กองบริหารคดี | `10.2` | LAW0073, ขั้นแทรกใหม่ |
| `appeal_subcommittee_secretariat` | ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ | คณะอนุกรรมการ | `10.2` | LAW0075, LAW0077 |
| `appeal_ruling_subcommittee` | คณะอนุกรรมการวินิจฉัยอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลหรือข้อเท็จจริง | คณะอนุกรรมการ | `10.2` | LAW0076 |

`admin_legal` และ `original_officer` ใช้ role เดิมที่มีอยู่แล้ว

---

## 3. รายละเอียดแต่ละหน้า (10 หน้า, `10-2-appeal-01` ถึง `10-2-appeal-10`)

> **การตั้งชื่อไฟล์:** ใช้ prefix เฉพาะของ flow นี้คือ `10-2-appeal-NN-...` (ตามรูปแบบเดียวกับ `10-3-NN-...`/`10-3b-NN-...` ที่มีอยู่แล้ว)

โครงหน้าทุกหน้ายึด layout เดิม (sidebar + topbar + stepper 2 แถว + form-card + form-actions) ตาม pattern ของหน้าที่มีอยู่แล้ว — ใช้ `ECMIS102.openSignatureModal` สำหรับขั้นที่ต้องลงนาม, `Activity102.advance()` สำหรับเปลี่ยนสถานะคำร้อง, และ `ECMIS102.renderStepperV2` สำหรับแถบขั้นตอน

> **กฎการแสดงผล (ยึดทุกหน้าตั้งแต่ appeal-03 เป็นต้นไป):** ทุกหน้าต้องแสดงข้อมูล**ทั้งหมด**ที่หน้าก่อนหน้าบันทึกไว้ (ไม่ใช่แค่บางส่วน) ในการ์ด read-only แยกต่างหาก ("ข้อมูลจากขั้นตอนก่อนหน้า") ก่อนที่ผู้ใช้จะพิจารณา/ลงนามในขั้นของตัวเอง — ผู้ใช้ยืนยันหลักการนี้ไว้ตอนแก้ appeal-02 และต้องระวัง bug แบบเดียวกับที่เคยพลาดใน appeal-02: precondition statusCode ที่ใช้เช็คว่าใครมาถึงหน้านี้ได้ต้องเป็นค่าที่ **STEP ก่อนหน้า** เขียนไว้ (`STEPS[i-1].statusCode`) ไม่ใช่ค่าที่ STEP ของหน้าตัวเองผลิตออกไป
>
> **เพิ่มเติม (ยืนยันแล้ว):** เอกสารแนบทุกจุดต้องเรียก `ECMIS102.renderAttachments(containerId, fileNames)` (มีปุ่มดาวน์โหลดในตัว) แทนการแสดงชื่อไฟล์เป็นข้อความเฉย ๆ และทุกหน้าที่มีการลงนามมาก่อนหน้าต้องแสดงลายเซ็นสะสมทั้งหมดผ่าน `ECMIS102.renderSignatureList(containerId, kase, slots)` (ใหม่ ใน ecmis-10-2.js) โดย `slots` คือรายการ `{slot, title}` ของทุกขั้นที่ลงนามมาก่อนหน้าหน้านี้ตามลำดับจริง — ทั้งสองอย่างนี้ implement แล้วใน appeal-02/03/04, ต้องทำต่อในหน้า appeal-05 ขึ้นไปด้วย

### 3.1 `10-2-appeal-01-legal-admin-intake.html` — ✅ implemented
- **LAW:** 0069–071 (พับรวมทั้งการรับเรื่องและการคีย์เข้าระบบเป็นหน้าเดียว ตามที่ผู้ใช้ขอให้รวม)
- **Role:** `admin_legal` (เจ้าหน้าที่ธุรการกองกฎหมาย)
- **เข้าเงื่อนไข:** คำร้องอยู่ที่ `L2_PENDING_APPEAL_INTAKE` — seed ตรง ๆ ในข้อมูลตัวอย่าง (ไม่มีปุ่ม "ยื่นอุทธรณ์" บนคำร้องปิดสำนวนเดิม) เข้าหน้านี้ได้ทั้งแบบมี `?id=` (จากปุ่ม "ดำเนินการ" รายแถว) และไม่มี (จากปุ่ม "รับเรื่องอุทธรณ์" เหนือตาราง — จะมีช่องให้เลือกคำร้องเมื่อมีมากกว่า 1 รายการรอ)
- **ฟอร์ม:** เลขที่หนังสือรับ (auto-suggest), วันที่ลงรับ (date, default วันนี้), ช่องทางยื่น (ส่วนกลาง/เขต + ระบุเขต), หมายเหตุ (optional), เอกสารแนบ (file, optional, หลายไฟล์), เลขที่คำอุทธรณ์ในระบบ (auto-suggest จากเลขคำร้องเดิม), สรุปประเด็นอุทธรณ์ (textarea, บังคับ)
- **สถานะที่เขียน:** `L2_PENDING_BUREAU_DIRECTOR_ASSIGN`
- **ปุ่ม:** "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ"

### 3.2 `10-2-appeal-02-case-bureau-director-assign.html` — ✅ implemented
- **LAW:** 0072
- **Role:** `case_bureau_director` (ผอ.กองบริหารคดี)
- **สิ่งที่ทำ:** พิจารณาเรื่องอุทธรณ์และมอบหมายให้กลุ่มงานบริหารติดตามคดีดำเนินการ
- **ฟอร์ม:** ความเห็นเบื้องต้น (textarea, optional), มอบหมายถึง (fixed: ผอ.กลุ่มงานบริหารติดตามคดี — auto)
- **สถานะที่เขียน:** `L2_PENDING_TRACKING_DIRECTOR_ASSIGN`
- **ปุ่ม:** "พิจารณาและมอบหมาย"

### 3.3 `10-2-appeal-03-case-tracking-director-assign.html` — ✅ implemented
- **LAW:** 0073
- **Role:** `case_tracking_director` (ผอ.กลุ่มงานบริหารติดตามคดี)
- **สิ่งที่ทำ:** มอบหมายนิติกรเจ้าของสำนวนให้ดำเนินการแจ้งผู้อุทธรณ์และทำความเห็น
- **ฟอร์ม:** มอบหมายถึง (เลือกนิติกร หรือ fixed เป็น `original_officer`), กำหนดวันครบกำหนด 3 วัน/10 วัน (read-only)
- **สถานะที่เขียน:** `L2_PENDING_CASE_OWNER_APPEAL_OPINION`
- **ปุ่ม:** "มอบหมายนิติกร"

### 3.4 `10-2-appeal-04-case-owner-opinion.html` — ✅ implemented
- **LAW:** 0074
- **Role:** `original_officer` (นิติกรเจ้าของสำนวนเดิม)
- **สิ่งที่ทำ:** แจ้งผู้อุทธรณ์ภายใน 3 วัน และทำความเห็นภายใน 10 วัน — UI แบบง่ายที่สุด
- **ฟอร์ม:** ช่องข้อความความเห็น (textarea, optional), แนบไฟล์ประกอบ (file, optional, หลายไฟล์) — ไม่มีฟิลด์บังคับอื่น ไม่มี signature block
- **สถานะที่เขียน:** `L2_PENDING_APPEAL_AGENDA`
- **ปุ่ม:** "บันทึกและส่งต่อ"

### 3.5 `10-2-appeal-05-secretariat-agenda.html` — ✅ implemented
- **LAW:** 0075
- **Role:** `appeal_subcommittee_secretariat`
- **สิ่งที่ทำ:** รวบรวมคำอุทธรณ์และความเห็นของนิติกรเจ้าของสำนวน จัดทำวาระเสนอคณะอนุกรรมการวินิจฉัยอุทธรณ์
- **ฟอร์ม:** วันที่ประชุม (date), เลขที่วาระ (text/auto), สรุปเรื่องเสนอที่ประชุม (textarea, read-only จากความเห็นนิติกร)
- **สถานะที่เขียน:** `L2_PENDING_APPEAL_RULING`
- **ปุ่ม:** "บรรจุวาระ"

### 3.6 `10-2-appeal-06-subcommittee-ruling.html` — ✅ implemented
- **LAW:** 0076
- **Role:** `appeal_ruling_subcommittee`
- **สิ่งที่ทำ:** พิจารณาและมีคำวินิจฉัยอุทธรณ์ (**จุดแยกผลจริงของ Flow 4**)
- **ฟอร์ม:** ผลคำวินิจฉัย (เห็นด้วยกับคำสั่งเดิม / กลับคำสั่งเดิม / กลับคำสั่งบางส่วน), เหตุผลประกอบคำวินิจฉัย (textarea)
- **สถานะที่เขียน:** `L2_PENDING_APPEAL_MEMO`
- **ฟิลด์ข้อมูลใหม่:** `l2AppealRulingType` (`UPHOLD` | `REVERSE_FULL` | `REVERSE_PARTIAL`)
- **ปุ่ม:** "บันทึกคำวินิจฉัย"

### 3.7 `10-2-appeal-07-secretariat-memo.html` — ✅ implemented
- **LAW:** 0077
- **Role:** `appeal_subcommittee_secretariat`
- **สิ่งที่ทำ:** จัดทำบันทึกคำวินิจฉัยและเสนอเรื่องเข้าที่ประชุมคณะกรรมการ ป.ป.ท. เต็มคณะ
- **ฟอร์ม:** เอกสารบันทึกคำวินิจฉัย (read-only), ลงนามฝ่ายเลขาฯ (signature modal)
- **สถานะที่เขียน:** `L2_PENDING_TRACKING_DIRECTOR_SIGN`
- **ปุ่ม:** "ลงนามและเสนอ"

### 3.8 `10-2-appeal-08-case-tracking-director-sign.html` — ✅ implemented *(ขั้นตอนแทรกใหม่ ไม่มีเลข LAW)*
- **Role:** `case_tracking_director`
- **สิ่งที่ทำ:** ผอ.กลุ่มงานบริหารติดตามคดีลงนามรับรอง ก่อนส่งต่อให้ ผอ.กองบริหารคดี
- **ฟอร์ม:** แสดงบันทึกจาก 3.7 (read-only) + signature modal
- **สถานะที่เขียน:** `L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE`
- **ปุ่ม:** "ลงนามส่งต่อ ผอ.กองบริหารคดี"

### 3.9 `10-2-appeal-09-case-bureau-director-board-propose.html` — ✅ implemented
- **LAW:** 0078
- **Role:** `case_bureau_director`
- **สิ่งที่ทำ:** พิจารณาเรื่องและลงนามในฐานะผู้เสนอเรื่อง ก่อนนำเข้ากิจกรรมที่ 7
- **ฟอร์ม:** แสดงบันทึกจาก 3.7/3.8 (read-only) + signature modal
- **สถานะที่เขียน:** `L2_PENDING_APPEAL_BOARD_DISPATCH`
- **ปุ่ม:** "ลงนามเสนอกิจกรรมที่ 7"

### 3.10 `10-2-appeal-10-legal-admin-board-submit.html` — ✅ implemented
- **LAW:** 0079
- **Role:** `admin_legal`
- **สิ่งที่ทำ:** ออกเลขหนังสือส่งและยื่นเรื่องเข้ากิจกรรมที่ 7 อย่างเป็นทางการ — **จบสโคปของ Flow 4 รอบนี้**
- **ฟอร์ม:** เลขที่หนังสือส่ง (auto), วันที่ส่ง (auto)
- **สถานะที่เขียน:** `L2_APPEAL_SUBMITTED_TO_BOARD` (terminal-for-now)
- **ปุ่ม:** "ออกเลขส่งและยื่นมติบอร์ด"

---

## 4. การเปลี่ยนแปลงใน `assets/ecmis-10-2.js`

- ✅ เพิ่ม STEPS entry `L2-APPEAL-INTAKE` (หน้า `10-2-appeal-01`) ต่อท้ายอาเรย์ — เขียน `L2_PENDING_BUREAU_DIRECTOR_ASSIGN` ตรง (รวม 2 ขั้นเดิมเป็นขั้นเดียวแล้ว)
- ✅ เติม `ROUTES["L2_PENDING_APPEAL_INTAKE"]` ด้วยมือ (ไม่มี step ไหนผลิตสถานะนี้ให้อัตโนมัติ เพราะเป็นจุดเริ่ม flow)
- ✅ เพิ่ม STEPS entry `L2-APPEAL-BUREAU-ASSIGN` (หน้า `10-2-appeal-02`) ต่อท้าย `L2-APPEAL-INTAKE` — `ROUTES["L2_PENDING_BUREAU_DIRECTOR_ASSIGN"]` ต่อกันอัตโนมัติเพราะอยู่ติดกันในอาเรย์
- ✅ เพิ่ม STEPS entry `L2-APPEAL-TRACKING-ASSIGN` (หน้า `10-2-appeal-03`) ต่อท้าย `L2-APPEAL-BUREAU-ASSIGN` — `ROUTES["L2_PENDING_TRACKING_DIRECTOR_ASSIGN"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-CASE-OWNER-OPINION` (หน้า `10-2-appeal-04`) ต่อท้าย `L2-APPEAL-TRACKING-ASSIGN` — `ROUTES["L2_PENDING_CASE_OWNER_APPEAL_OPINION"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-AGENDA` (หน้า `10-2-appeal-05`) ต่อท้าย `L2-APPEAL-CASE-OWNER-OPINION` — `ROUTES["L2_PENDING_APPEAL_AGENDA"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-RULING` (หน้า `10-2-appeal-06`) ต่อท้าย `L2-APPEAL-AGENDA` — `ROUTES["L2_PENDING_APPEAL_RULING"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-SECRETARIAT-MEMO` (หน้า `10-2-appeal-07`) ต่อท้าย `L2-APPEAL-RULING` — `ROUTES["L2_PENDING_APPEAL_MEMO"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-TRACKING-SIGN` (หน้า `10-2-appeal-08`, ขั้นตอนแทรกใหม่ไม่มีเลข LAW) ต่อท้าย `L2-APPEAL-SECRETARIAT-MEMO` — `ROUTES["L2_PENDING_TRACKING_DIRECTOR_SIGN"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม `ECMIS102.renderSignatureList()` helper ใหม่ (ใช้ตั้งแต่ appeal-03 เป็นต้นไป)
- ✅ เพิ่ม STEPS entry `L2-APPEAL-BOARD-PROPOSE` (หน้า `10-2-appeal-09`) ต่อท้าย `L2-APPEAL-TRACKING-SIGN` — `ROUTES["L2_PENDING_APPEAL_BOARD_DISPATCH"]` ต่อกันอัตโนมัติ
- ✅ เพิ่ม STEPS entry `L2-APPEAL-BOARD-DISPATCH` (หน้า `10-2-appeal-10`, terminal-for-now) ต่อท้าย `L2-APPEAL-BOARD-PROPOSE` — `ROUTES["L2_APPEAL_SUBMITTED_TO_BOARD"]` ไม่มีหน้าถัดไปในสโคปนี้ จึงไม่มี route ออกจากสถานะนี้ (ตั้งใจ — terminal)

## 5. การเปลี่ยนแปลงใน `assets/ecmis-activity10.js` (ข้อมูลตัวอย่าง)

- ✅ `คำร้อง-100032/2569` — สถานะ `L2_PENDING_APPEAL_INTAKE` (ทดสอบหน้า appeal-01)
- ✅ `คำร้อง-100033/2569` — สถานะ `L2_PENDING_BUREAU_DIRECTOR_ASSIGN` (ทดสอบหน้า appeal-02)
- ✅ `คำร้อง-100034/2569` — สถานะ `L2_PENDING_TRACKING_DIRECTOR_ASSIGN` (ทดสอบหน้า appeal-03)
- ✅ `คำร้อง-100035/2569` — สถานะ `L2_PENDING_CASE_OWNER_APPEAL_OPINION` (ทดสอบหน้า appeal-04)
- ✅ `คำร้อง-100036/2569` — สถานะ `L2_PENDING_APPEAL_AGENDA` (ทดสอบหน้า appeal-05)
- ✅ `คำร้อง-100037/2569` — สถานะ `L2_PENDING_APPEAL_RULING` (ทดสอบหน้า appeal-06)
- ✅ `คำร้อง-100038/2569` — สถานะ `L2_PENDING_APPEAL_MEMO` (ทดสอบหน้า appeal-07, มติ REVERSE_FULL)
- ✅ `คำร้อง-100039/2569` — สถานะ `L2_PENDING_TRACKING_DIRECTOR_SIGN` (ทดสอบหน้า appeal-08, มติ REVERSE_PARTIAL)
- ✅ `คำร้อง-100040/2569` — สถานะ `L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE` (จำลองว่าผ่าน appeal-08 มาแล้ว รอหน้า appeal-09 ที่ยังไม่สร้าง, มติ REVERSE_FULL)
- ✅ `คำร้อง-100041/2569` — สถานะ `L2_PENDING_APPEAL_BOARD_DISPATCH` (ทดสอบหน้า appeal-09, มติ REVERSE_PARTIAL)
- ✅ `คำร้อง-100042/2569` — สถานะ `L2_APPEAL_SUBMITTED_TO_BOARD` (terminal-for-now, จำลองว่าผ่าน appeal-10 มาแล้ว, มติ REVERSE_FULL) — ไม่มีหน้ารองรับต่อ เตรียมไว้สำหรับ sheet 7 ถ้าทำในอนาคต

## 6. UI เสริมที่เพิ่มแล้ว

- ✅ ปุ่ม "รับเรื่องอุทธรณ์" เหนือตารางใน `01-work-inbox.html` — แสดงเฉพาะเมื่อเลือกหมวดหมู่ "ขอเปิดเผยข้อมูลข่าวสาร" (10.2) เท่านั้น พาไปหน้า `10-2-appeal-01` แบบทั่วไป (ไม่ผูก id)
- ✅ ช่องเลือกคำร้อง ("เลือกคำร้อง") ในหน้า `10-2-appeal-01` — แสดงเมื่อเปิดหน้าโดยไม่มี `?id=` (เข้าจากปุ่มด้านบนตาราง) ให้เลือกได้เองเมื่อมีมากกว่า 1 คำร้องรออยู่พร้อมกัน

---

## 7. รายการไฟล์ที่จะถูกสร้าง/แก้ไข (สรุป)

**ไฟล์ใหม่ (10 หน้า):**
- ✅ `10-2-appeal-01-legal-admin-intake.html`
- ✅ `10-2-appeal-02-case-bureau-director-assign.html`
- ✅ `10-2-appeal-03-case-tracking-director-assign.html`
- ✅ `10-2-appeal-04-case-owner-opinion.html`
- ✅ `10-2-appeal-05-secretariat-agenda.html`
- ✅ `10-2-appeal-06-subcommittee-ruling.html`
- ✅ `10-2-appeal-07-secretariat-memo.html`
- ✅ `10-2-appeal-08-case-tracking-director-sign.html`
- ✅ `10-2-appeal-09-case-bureau-director-board-propose.html`
- ✅ `10-2-appeal-10-legal-admin-board-submit.html`

**ไฟล์ที่แก้ไข:**
- ✅ `assets/ecmis-app.js` — เพิ่ม 4 role ใหม่
- ✅ `assets/ecmis-10-2.js` — เพิ่ม STEPS entry appeal-01 ถึง appeal-04
- ✅ `assets/ecmis-activity10.js` — เพิ่มคำร้องตัวอย่าง 5 รายการ (`100032`–`100036`)
- ✅ `01-work-inbox.html` — เพิ่มปุ่ม "รับเรื่องอุทธรณ์" (แสดงเฉพาะหมวด 10.2)
- ✅ `login.html` — เพิ่ม 4 role ใหม่ของ Flow 4 เข้า `ACTIVE_ROLE_IDS` (แสดงใน autocomplete หน้า login)
- ⬜ `docs/10-2-flow-by-board-resolution.md` — เพิ่มหัวข้อ Flow 4 อ้างอิงเอกสารนี้ (หลัง implement ครบทุกหน้า)
