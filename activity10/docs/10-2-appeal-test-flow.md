# 🧪 Test Flow — กิจกรรมที่ 10.2 Flow E (อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล)

**Project:** E-CMIS กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
**อ้างอิงระบบจริง (ใช้เป็นหลักในการทดสอบ):** `STEPS` / `ROUTES` ใน [`assets/ecmis-10-2.js`](../assets/ecmis-10-2.js)
**อ้างอิงแผนงาน:** [`10-2-flow4-appeal-plan.md`](10-2-flow4-appeal-plan.md)
**Date:** 18 กันยายน 2569
**Status:** สคริปต์ทดสอบ — ยังไม่ได้รันยืนยันผล (คอลัมน์ "ผล" เว้นว่างไว้ให้ QA กรอก)

> เอกสารนี้ครอบคลุมเฉพาะ **Flow E (อุทธรณ์)** ของกิจกรรม 10.2 — สำหรับ Flow A–D (รับคำขอจนถึงปิดสำนวน/ส่งกิจกรรมที่ 7 รอบแรก) ดู [10-2-full-test-flow.md](10-2-full-test-flow.md) หัวข้อ 1–6
>
> เอกสารนี้แทนที่ [10-2-flow4-appeal-test-flow.md](10-2-flow4-appeal-test-flow.md) (ล้าสมัย — เขียนไว้ตอนที่ appeal-01 ยังรับหน้าที่เลือกนิติกรเองอยู่ ก่อนจะแยกเป็น 2 จุดเริ่มต้น) และหัวข้อ 7–8 ของ [10-2-full-test-flow.md](10-2-full-test-flow.md) (ยังอ้าง flow แบบเส้นทางเดียวเก่า)
>
> **หลักการ:** ทดสอบตาม "หน้าที่ระบบสร้างจริง" — จุด ⚡ = ไม่มีหน้าในระบบ ต้องจำลองด้วย console snippet

---

## 📌 1. เตรียมการทดสอบ

| ข้อ | รายการ | ค่า |
| :--- | :--- | :--- |
| 1 | เปิดเซิร์ฟเวอร์ | `activity10/run.bat` หรือ `python -m http.server 8811 --directory activity10` |
| 2 | URL ตั้งต้น | `http://localhost:8811/login.html` |
| 3 | รหัสผ่าน | กด chip บทบาทในกล่อง "เลือกบทบาทด่วน" (คลิกแล้วเข้าสู่ระบบทันที ไม่ต้องกดปุ่มซ้ำ) |
| 4 | ล้างข้อมูลก่อนเริ่มรอบใหม่ | หน้า `01-work-inbox.html` → ปุ่ม **รีเซ็ตข้อมูล** (เรียก `Activity10.resetData()`) |
| 5 | เปลี่ยนบทบาท | **ออกจากระบบแล้วเข้าใหม่** ทุกครั้ง (บทบาทเก็บใน `sessionStorage.ecmis_role`) |
| 6 | เข้าหน้าขั้นตอน | `01-work-inbox.html` → หมวด "การขอเปิดเผยข้อมูลข่าวสาร" → กด **ดำเนินการ** ที่แถวคำร้อง (หรือเปิดไฟล์ตรงพร้อม `?id=<เลขคำร้อง>`) |

> ⚠️ คำร้องตัวอย่าง `คำร้อง-100032` ถึง `100049` แต่ละใบถูกวางไว้ที่สถานะ "รอ" ของแต่ละขั้นโดยตรงแล้ว (ดูตารางหัวข้อ 5) — ไม่ต้องเดินตั้งแต่ต้นเสมอไป เลือก id ตามขั้นที่ต้องการทดสอบได้เลย

---

## 📌 2. บทบาทที่ใช้ใน Flow E (8 คน)

| กอง › กลุ่มงาน | Login | บทบาท | Role ID | ใช้ในขั้นตอน |
| :--- | :--- | :--- | :--- | :--- |
| กองบริหารคดี | `Nichada.T` | ธุรการกองบริหารคดี (สายส่วนกลาง) | `case_bureau_admin` | E1-CENTRAL |
| สนง. ป.ป.ท. เขต 4 | `Kittipong.D` | เจ้าหน้าที่เขต (สายเขต) | `district_admin` | E1-DISTRICT |
| กองบริหารคดี | `Pattama.B` | ผู้อำนวยการกองบริหารคดี | `case_bureau_director` | E2, E9 |
| กองบริหารคดี › กลุ่มงานบริหารติดตามคดี | `Wichai.T` | ผู้อำนวยการกลุ่มงานบริหารติดตามคดี | `case_tracking_director` | E3 |
| สนง. ป.ป.ท. เขต 1 | `Somchai.J` | นิติกร/นักสืบเจ้าของเรื่อง | `original_officer` | E4, E13 |
| กองกฎหมาย › คณะอนุกรรมการ | `Sompong.V` | คณะอนุกรรมการวินิจฉัยอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลฯ | `appeal_ruling_subcommittee` | E6 |
| กองบริหารคดี | `Malee.S` | ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ | `appeal_subcommittee_secretariat` | E7 |
| กองบริหารคดี › กลุ่มงานบริหารติดตามคดี | `Suda.K` | เลขานุการกลุ่มงานบริหารติดตามคดี | `case_tracking_secretary` | E12 |

---

## 📌 3. แผนผังเส้นทาง (2 จุดเริ่มต้น บรรจบก่อน E4)

```
เงื่อนไขเริ่มต้น: คำร้องจบสาย DENY แล้ว (L2_CASE_CLOSED_DENY_ASSIGNED) + ผู้ยื่นคำขอใช้สิทธิ์อุทธรณ์

                              ⚡ [H3-CENTRAL]                         ⚡ [H3-DISTRICT]
                                    │                                       │
                                    ▼                                       ▼
                    E1-CENTRAL  appeal-01                        E1-DISTRICT  appeal-01b
                    (Nichada.T, ธุรการกองบริหารคดี)                (Kittipong.D, จนท.เขต)
                    "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ"           "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ"
                    → เลือกนิติกรที่นี่ไม่ได้ ส่งต่อ ผอ.กองฯ           → เลือกนิติกรเจ้าของเรื่องได้ทันที
                                    │                                       │
                                    ▼                                       │
                    E2  appeal-02 (Pattama.B, ผอ.กองบริหารคดี)              │
                        "พิจารณาและมอบหมาย"                                │
                                    │                                       │
                                    ▼                                       │
                    E3  appeal-03 (Wichai.T, ผอ.กลุ่มงานติดตามคดี)          │
                        "พิจารณาและมอบหมายนิติกร" (เลือกนิติกรที่นี่)       │
                                    │                                       │
                                    └───────────────┬───────────────────────┘
                                                     ▼
                                    ทั้ง 2 สายบรรจบที่ precondition เดียวกัน
                                    (L2_PENDING_CASE_OWNER_APPEAL_OPINION)
                                                     │
                E4  appeal-04 (Somchai.J, นิติกรเจ้าของสำนวน) — แจ้งผู้อุทธรณ์ + ทำความเห็น
                E6  appeal-06 (Sompong.V, คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ) — วินิจฉัย
                E7  appeal-07 (Malee.S, ฝ่ายเลขาฯ) — บันทึกวาระ + เสนอบันทึก (รวมหน้า)
                E9  appeal-09 (Pattama.B, ผอ.กองบริหารคดี) — ลงนามเสนอ + ออกเลขส่งยื่นกิจกรรมที่ 7
                                                     │
                                          ⚡ [H2] มติบอร์ดตอบกลับ
                                                     │
                E12 appeal-12 (Suda.K, เลขาฯ กลุ่มงานติดตามคดี) — ส่งหนังสือแจ้งผลมติ
                E13 appeal-13 (Somchai.J, นิติกรเจ้าของสำนวน) — แจ้งผลผู้อุทธรณ์  ■ สิ้นสุด
```

**สายส่วนกลาง (5 ขั้นก่อนบรรจบ):** E1-CENTRAL → E2 → E3 → *(บรรจบ)*
**สายเขต (1 ขั้นก่อนบรรจบ, สั้นกว่า 2 ขั้น):** E1-DISTRICT → *(บรรจบ)* — เลือกนิติกรที่ appeal-01b ได้เลย ไม่ต้องผ่าน ผอ.กองบริหารคดี/ผอ.กลุ่มงานติดตามคดี

---

## 📌 4. Console snippet สำหรับจุดส่งต่อที่ไม่มีหน้า

เปิด `01-work-inbox.html` (บทบาทใดก็ได้) → F12 → Console → วาง snippet โดยแก้ `ID` ตามคำร้องที่จะทดสอบ → Enter (หน้าจะรีโหลดเอง) → ออกจากระบบแล้วเข้าด้วยบทบาทของขั้นถัดไป

```js
(() => {
  const ID = "คำร้อง-1000XX/2569";
  const FROM = "L2_CASE_CLOSED_DENY_ASSIGNED";
  const TO = "L2_PENDING_APPEAL_INTAKE"; // หรือ L2_PENDING_APPEAL_INTAKE_DISTRICT
  const PATCH = { status: "รอรับเรื่องอุทธรณ์", assignedRole: "case_bureau_admin" }; // หรือ district_admin

  const cases = Activity10.getCases();
  const c = cases.find((x) => x.id === ID);
  if (!c) return console.error("ไม่พบคำร้อง", ID);
  if (c.statusCode !== FROM) return console.error("สถานะปัจจุบันคือ", c.statusCode, "ไม่ใช่", FROM);
  Activity10.saveCases(cases.map((x) => (x.id === ID ? { ...x, ...PATCH, statusCode: TO } : x)));
  location.reload();
})();
```

| จุด | เหตุการณ์จริง | `FROM` | `TO` | `PATCH` | ขั้นถัดไป |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H3-CENTRAL** | ผู้ยื่นคำขอยื่นอุทธรณ์ทางส่วนกลาง | `L2_CASE_CLOSED_DENY_ASSIGNED` | `L2_PENDING_APPEAL_INTAKE` | `{ status: "รอรับเรื่องอุทธรณ์", assignedRole: "case_bureau_admin" }` | E1-CENTRAL `Nichada.T` |
| **H3-DISTRICT** | ผู้ยื่นคำขอยื่นอุทธรณ์ตรงที่เขต | `L2_CASE_CLOSED_DENY_ASSIGNED` | `L2_PENDING_APPEAL_INTAKE_DISTRICT` | `{ status: "รอรับเรื่องอุทธรณ์ (สายเขต)", assignedRole: "district_admin" }` | E1-DISTRICT `Kittipong.D` |
| **H2** | คณะกรรมการ ป.ป.ท. มีมติต่อคำอุทธรณ์ | `L2_APPEAL_SUBMITTED_TO_BOARD` | `L2_PENDING_APPEAL_NOTICE_DRAFT` | `{ status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ", assignedRole: "case_tracking_secretary", l2AppealBoardResolutionType: "DISCLOSE", l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลทั้งหมด", l2AppealBoardReplyDocNo: "ปป 0002/5301", l2AppealBoardReplyDate: "2569-09-18", l2AppealBoardResolutionNotes: "-" }` | E12 `Suda.K` |

> ถ้า snippet แจ้ง "สถานะปัจจุบันคือ ..." แปลว่ายังเดินขั้นก่อนหน้าไม่ครบ — ห้ามแก้ `FROM` เพื่อบังคับข้าม

---

## 📌 5. ตารางขั้นตอนทดสอบ (พร้อมคำร้องตัวอย่าง)

| # | Login | หน้า | การกระทำ | ลงนาม | สถานะหลังกด | คำร้องตัวอย่าง (วางไว้รอที่ขั้นนี้) |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| H3-CENTRAL | *(console)* | — | snippet **[H3-CENTRAL]** | ➖ | `L2_PENDING_APPEAL_INTAKE` | — |
| H3-DISTRICT | *(console)* | — | snippet **[H3-DISTRICT]** | ➖ | `L2_PENDING_APPEAL_INTAKE_DISTRICT` | — |
| E1-CENTRAL | `Nichada.T` | [10-2-appeal-01-legal-admin-intake.html](../10-2-appeal-01-legal-admin-intake.html) | เลือกคำร้อง → เลขที่หนังสือรับ/วันที่ลงรับ/ช่องทาง (เขต/walk-in/ไปรษณีย์/อิเล็กทรอนิกส์) → **บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ** | ➖ | `L2_PENDING_BUREAU_DIRECTOR_ASSIGN` | `คำร้อง-100032/2569` |
| E1-DISTRICT | `Kittipong.D` | [10-2-appeal-01b-district-intake.html](../10-2-appeal-01b-district-intake.html) | เลือกคำร้อง → เลขที่หนังสือรับ/วันที่ลงรับ/ช่องทาง → เลือกนิติกรเจ้าของเรื่อง (default = เจ้าของสำนวนเดิม) → **บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ** | ➖ | `L2_PENDING_CASE_OWNER_APPEAL_OPINION` | `คำร้อง-100049/2569` |
| E2 | `Pattama.B` | [10-2-appeal-02-case-bureau-director-assign.html](../10-2-appeal-02-case-bureau-director-assign.html) | ทบทวนข้อมูล → **พิจารณาและมอบหมาย** | ➖ | `L2_PENDING_TRACKING_DIRECTOR_ASSIGN` | `คำร้อง-100033/2569` |
| E3 | `Wichai.T` | [10-2-appeal-03-case-tracking-director-assign.html](../10-2-appeal-03-case-tracking-director-assign.html) | ทบทวนข้อมูล → เลือกนิติกรเจ้าของเรื่อง (default = เจ้าของสำนวนเดิม) → **พิจารณาและมอบหมายนิติกร** | ➖ | `L2_PENDING_CASE_OWNER_APPEAL_OPINION` | `คำร้อง-100034/2569` |
| E4 | `Somchai.J` | [10-2-appeal-04-case-owner-opinion.html](../10-2-appeal-04-case-owner-opinion.html) | แจ้งผู้อุทธรณ์ (3 วัน) + ทำความเห็น (10 วัน) → **ลงนามและส่งต่อ** | ✅ | `L2_PENDING_APPEAL_RULING` | `คำร้อง-100035/2569` |
| E6 | `Sompong.V` | [10-2-appeal-06-subcommittee-ruling.html](../10-2-appeal-06-subcommittee-ruling.html) | เลือกคำวินิจฉัย (ไม่เปิดเผย / กลับทั้งหมด / กลับบางส่วน — เลือกจากการ์ด) + เหตุผล → **ลงนามและบันทึกคำวินิจฉัย** | ✅ | `L2_PENDING_APPEAL_MEMO` | `คำร้อง-100037/2569` |
| E7 | `Malee.S` | [10-2-appeal-07-secretariat-memo.html](../10-2-appeal-07-secretariat-memo.html) | วันที่ประชุม + เลขที่วาระ + ตรวจบันทึก → **ลงนามบันทึกวาระและเสนอ** | ✅ | `L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE` | `คำร้อง-100038/2569` |
| E9 | `Pattama.B` | [10-2-appeal-09-case-bureau-director-board-propose.html](../10-2-appeal-09-case-bureau-director-board-propose.html) | หมายเหตุ + เลขที่หนังสือส่ง/วันที่ส่ง → **ลงนามเสนอ + ออกเลขส่งยื่นกิจกรรมที่ 7** | ✅ | `L2_APPEAL_SUBMITTED_TO_BOARD` *(รอบอร์ด)* | `คำร้อง-100036/2569` |
| ⚡ H2 | *(console)* | — | snippet **[H2]** — เขียนมติบอร์ดตรงเข้า case | ➖ | `L2_PENDING_APPEAL_NOTICE_DRAFT` | `คำร้อง-100042/2569` |
| E12 | `Suda.K` | [10-2-appeal-12-tracking-secretary-notice-draft.html](../10-2-appeal-12-tracking-secretary-notice-draft.html) | เลขที่ + วันที่หนังสือแจ้งผลมติ → **ลงนามและส่งหนังสือแจ้งผลมติ** | ✅ | `L2_PENDING_APPEAL_CASE_OWNER_NOTIFY` | `คำร้อง-100043/044/045/046/2569` |
| E13 | `Somchai.J` | [10-2-appeal-13-case-owner-notify-appellant.html](../10-2-appeal-13-case-owner-notify-appellant.html) | วันที่แจ้ง + ช่องทาง → **ลงนามและแจ้งผลผู้อุทธรณ์** | ✅ | `L2_APPEAL_CASE_CLOSED_NOTIFIED` **■ สิ้นสุดทั้ง Flow 10.2** | `คำร้อง-100047/2569` |
| — | — | — | *(ปิดเคสสมบูรณ์แล้ว ไว้ดูผลลัพธ์)* | — | `L2_APPEAL_CASE_CLOSED_NOTIFIED` | `คำร้อง-100048/2569` |

> คำร้องตัวอย่างทั้งหมด (`คำร้อง-100032/2569` ถึง `100049/2569`) อยู่ใน [`assets/ecmis-activity10.js`](../assets/ecmis-activity10.js)

---

## 📌 6. รอบทดสอบ (Test Runs)

| รอบ | เป้าหมาย | เดินจาก | เส้นทางที่เดิน | จบที่ | ผล |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **R-CENTRAL** | สายส่วนกลาง ยาวสุด (ผ่าน ผอ.กองฯ + ผอ.กลุ่มติดตามคดี ก่อนถึงนิติกร) | `คำร้อง-100032/2569` | H3-CENTRAL → E1-CENTRAL → E2 → E3 → E4 → E6 → E7 → E9 → H2 → E12 → E13 | `L2_APPEAL_CASE_CLOSED_NOTIFIED` | |
| **R-DISTRICT** | สายเขต สั้นสุด (ถึงนิติกรโดยตรง) | `คำร้อง-100049/2569` | H3-DISTRICT → E1-DISTRICT → E4 → E6 → E7 → E9 → H2 → E12 → E13 | `L2_APPEAL_CASE_CLOSED_NOTIFIED` | |
| **R-MID** | เข้าตรงกลาง Flow — ไม่ต้องเดินตั้งแต่ H3 | เลือกคำร้องตามขั้นที่ต้องการทดสอบจากตารางหัวข้อ 5 | เดินต่อจากขั้นนั้นจนจบ | `L2_APPEAL_CASE_CLOSED_NOTIFIED` | |

---

## 📌 7. Test Cases เฉพาะจุดที่แยก 2 สาย

| รหัส | จุดตรวจ | ขั้นตอน | ผลลัพธ์ที่คาดหวัง | ผล |
| :--- | :--- | :--- | :--- | :---: |
| TC-APL-001 | Stepper "Flow อุทธรณ์" นับขั้นถูก | เปิดคำร้องสายส่วนกลาง (เช่น `100033`) ที่ขั้นใดก็ได้ | แถบ stepper แสดง **9 ขั้น** (E1-CENTRAL, E2, E3, E4, E6, E7, E9, E12, E13) | |
| TC-APL-002 | Stepper "Flow อุทธรณ์" นับขั้นถูก | เปิดคำร้องสายเขต (เช่น `100049` หลังผ่าน E1-DISTRICT) | แถบ stepper แสดง **7 ขั้น** (ไม่มี E2/E3) | |
| TC-APL-003 | บทบาทไม่ตรงถูกกันสิทธิ์ | ล็อกอิน `Nichada.T` (case_bureau_admin) แล้วเปิด `10-2-appeal-01b-district-intake.html?id=100049` | ขึ้นเตือนบทบาทไม่ตรงกับขั้นตอน (guardRole) | |
| TC-APL-004 | appeal-01 ไม่มีช่องเลือกนิติกรอีกต่อไป | เปิด `10-2-appeal-01-legal-admin-intake.html` ด้วย `Nichada.T` | ไม่มี field "นิติกรเจ้าของเรื่อง" — ส่งต่อ ผอ.กองบริหารคดีเสมอ | |
| TC-APL-005 | appeal-01b มีช่องเลือกนิติกร | เปิด `10-2-appeal-01b-district-intake.html` ด้วย `Kittipong.D` | มี field "นิติกรเจ้าของเรื่อง" default = เจ้าของสำนวนเดิม | |
| TC-APL-006 | 2 สายบรรจบถูกจุด | เดิน R-CENTRAL และ R-DISTRICT แยกกันจนถึง E4 | ทั้งคู่ขึ้นที่ `10-2-appeal-04-case-owner-opinion.html` ด้วย statusCode `L2_PENDING_CASE_OWNER_APPEAL_OPINION` เหมือนกัน | |
| TC-APL-007 | inbox ไม่มีคำร้องรอ | `Nichada.T` กด **รับเรื่องอุทธรณ์** ใน inbox ตอนไม่มีคำร้องสายส่วนกลางรอ | ขึ้น "ยังไม่มีคำร้องในขั้นตอนนี้" | |

---

## 📌 8. หมายเหตุ

- ทุกหน้ามี**แถบสถานะ**ด้านบน (badge สีม่วง "อุทธรณ์" + มติ/สถานะคดี) และ**การ์ด "ข้อมูลจากขั้นตอนก่อนหน้า"**ที่โชว์ข้อมูล+ลายเซ็นสะสมของทุกขั้นก่อนหน้าเสมอ
- E1-CENTRAL, E1-DISTRICT, E2, E3 ไม่มีลายเซ็น (งานธุรการ/มอบหมายงานภายใน) — เริ่มลงนามจริงที่ E4 เป็นต้นไป
- สโคปนี้จบที่ E13 (`L2_APPEAL_CASE_CLOSED_NOTIFIED`) — ไม่มีหน้าถัดจากนี้ (ผู้อุทธรณ์ไม่ใช่ผู้ใช้งานระบบ)
- คำร้องตัวอย่างที่ "วางไว้รอ" แต่ละขั้น (หัวข้อ 5) ใช้เลขคำร้องไม่ซ้ำกันภายในสโคป Flow E นี้ — ถ้าใช้ปนกับคำร้องตัวอย่างของ Flow A–D อาจมีเลขซ้ำ (ดู [10-2-full-test-flow.md](10-2-full-test-flow.md) หัวข้อ 12)
