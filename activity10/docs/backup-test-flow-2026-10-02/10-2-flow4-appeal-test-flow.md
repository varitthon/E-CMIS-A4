# กิจกรรมที่ 10.2 — Flow 4 (อุทธรณ์) ขั้นตอนทดสอบเดโม

> ⚠️ **ล้าสมัย** — ใช้ [10-2-full-test-flow.md](10-2-full-test-flow.md) หัวข้อ 8 แทน (มีวิธีเดินคำร้องเดียวต่อจากสาย DENY จนจบ)

> ใช้คู่กับแผนงานเต็มที่ [`docs/10-2-flow4-appeal-plan.md`](10-2-flow4-appeal-plan.md) — เอกสารนี้เป็น**สคริปต์ทดสอบ**ว่าล็อกอินด้วย user ไหน ที่หน้าไหน ทำอะไร แล้วได้ผลอย่างไร เรียงตามลำดับ Flow 4 ทั้ง 13 หน้า (sheet 6 "อุทธรณ์คำสั่ง" + sheet 7 "แจ้งผลอุทธรณ์")
>
> **วิธีใช้:** ไปที่ [`login.html`](../login.html) แล้วคลิก chip บทบาทตามคอลัมน์ "Login" ของแต่ละขั้น (หรือพิมพ์ username เอง) จากนั้นเข้า [`01-work-inbox.html`](../01-work-inbox.html) เลือกหมวด "ขอเปิดเผยข้อมูลข่าวสาร" แล้วกดดำเนินการที่คำร้องตามคอลัมน์ "คำร้องตัวอย่าง" — หรือเปิดไฟล์หน้านั้นตรง ๆ พร้อม `?id=<เลขคำร้อง>` ก็ได้

## ตารางขั้นตอนทดสอบ

| # | LAW | หน้า (ไฟล์) | บทบาทที่ต้องล็อกอิน | Login | ชื่อ (ตำแหน่ง) | ทำอะไร (กดปุ่ม) | คำร้องตัวอย่าง | สถานะหลังกด |
|---|---|---|---|---|---|---|---|---|
| 1 | 0069-071 | [10-2-appeal-01-legal-admin-intake.html](../10-2-appeal-01-legal-admin-intake.html) | `case_bureau_admin` | **Nichada.T** | นางนิชาดา ธุรการกิจ (ธุรการกองบริหารคดี) | "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ" | `คำร้อง-100032/2569` | `L2_PENDING_BUREAU_DIRECTOR_ASSIGN` |
| 2 | 0072 | [10-2-appeal-02-case-bureau-director-assign.html](../10-2-appeal-02-case-bureau-director-assign.html) | `case_bureau_director` | **Pattama.B** | นางปัทมา บริหารกิจ (ผู้อำนวยการกองบริหารคดี) | "ลงนามและมอบหมาย" | `คำร้อง-100033/2569` | `L2_PENDING_TRACKING_DIRECTOR_ASSIGN` |
| 3 | 0073 | [10-2-appeal-03-case-tracking-director-assign.html](../10-2-appeal-03-case-tracking-director-assign.html) | `case_tracking_director` | **Wichai.T** | นายวิชัย ติดตามกิจ (ผู้อำนวยการกลุ่มงานบริหารติดตามคดี) | "ลงนามและมอบหมายนิติกร" | `คำร้อง-100034/2569` | `L2_PENDING_CASE_OWNER_APPEAL_OPINION` |
| 4 | 0074 | [10-2-appeal-04-case-owner-opinion.html](../10-2-appeal-04-case-owner-opinion.html) | `original_officer` | **Somchai.J** | นายสมชาย ใจซื่อ (นิติกร/นักสืบเจ้าของเรื่อง) | "ลงนามและส่งต่อ" | `คำร้อง-100035/2569` | `L2_PENDING_APPEAL_AGENDA` |
| 5 | 0075 | [10-2-appeal-05-secretariat-agenda.html](../10-2-appeal-05-secretariat-agenda.html) | `appeal_subcommittee_secretariat` | **Malee.S** | นางสาวมาลี เสรีกิจ (ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์) | "ลงนามและบรรจุวาระ" | `คำร้อง-100036/2569` | `L2_PENDING_APPEAL_RULING` |
| 6 | 0076 | [10-2-appeal-06-subcommittee-ruling.html](../10-2-appeal-06-subcommittee-ruling.html) | `appeal_ruling_subcommittee` | **Sompong.V** | นายสมพงษ์ วินิจฉัยกุล (คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ) | "ลงนามและบันทึกคำวินิจฉัย" | `คำร้อง-100037/2569` | `L2_PENDING_APPEAL_MEMO` |
| 7 | 0077 | [10-2-appeal-07-secretariat-memo.html](../10-2-appeal-07-secretariat-memo.html) | `appeal_subcommittee_secretariat` | **Malee.S** | นางสาวมาลี เสรีกิจ (ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์) | "ลงนามและเสนอ" | `คำร้อง-100038/2569` | `L2_PENDING_TRACKING_DIRECTOR_SIGN` |
| 8 | *(แทรกใหม่)* | [10-2-appeal-08-case-tracking-director-sign.html](../10-2-appeal-08-case-tracking-director-sign.html) | `case_tracking_director` | **Wichai.T** | นายวิชัย ติดตามกิจ (ผู้อำนวยการกลุ่มงานบริหารติดตามคดี) | "ลงนามส่งต่อ ผอ.กองบริหารคดี" | `คำร้อง-100039/2569` | `L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE` |
| 9 | 0078 | [10-2-appeal-09-case-bureau-director-board-propose.html](../10-2-appeal-09-case-bureau-director-board-propose.html) | `case_bureau_director` | **Pattama.B** | นางปัทมา บริหารกิจ (ผู้อำนวยการกองบริหารคดี) | "ลงนามเสนอกิจกรรมที่ 7" | `คำร้อง-100040/2569` | `L2_PENDING_APPEAL_BOARD_DISPATCH` |
| 10 | 0079 | [10-2-appeal-10-legal-admin-board-submit.html](../10-2-appeal-10-legal-admin-board-submit.html) | `case_bureau_admin` | **Nichada.T** | นางนิชาดา ธุรการกิจ (ธุรการกองบริหารคดี) | "ออกเลขส่งและยื่นมติบอร์ด" | `คำร้อง-100041/2569` | `L2_APPEAL_SUBMITTED_TO_BOARD` *(รอผลจริงจากกิจกรรมที่ 7 — ไม่มีหน้าถัดไปจนกว่าจะ "ได้รับมติ")* |
| — | *(เหตุการณ์ภายนอก)* | *ไม่มีหน้า — จำลองด้วยสถานะ* | — | — | — | บอร์ด (กิจกรรมที่ 7) ตอบกลับมติแล้ว | `คำร้อง-100042/2569` = ยังรอ (`L2_APPEAL_SUBMITTED_TO_BOARD`) / `คำร้อง-100043-045/2569` = ตอบกลับแล้ว (`L2_APPEAL_BOARD_RESOLVED`) | — |
| 11 | 0080 | [10-2-appeal-11-legal-admin-board-resolution.html](../10-2-appeal-11-legal-admin-board-resolution.html) | `case_bureau_admin` | **Nichada.T** | นางนิชาดา ธุรการกิจ (ธุรการกองบริหารคดี) | "ลงนามและบันทึกมติคณะกรรมการ" — เลือกมติได้ 3 แบบ | `คำร้อง-100043/2569` (DISCLOSE) / `100044` (PARTIAL) / `100045` (DENY) | `L2_PENDING_APPEAL_NOTICE_DRAFT` |
| 12 | 0081 | [10-2-appeal-12-tracking-secretary-notice-draft.html](../10-2-appeal-12-tracking-secretary-notice-draft.html) | `case_tracking_secretary` | **Suda.K** | นางสาวสุดา คดีเที่ยง (เลขานุการกลุ่มงานบริหารติดตามคดี) | "ลงนามและส่งหนังสือแจ้งผลมติ" | `คำร้อง-100046/2569` | `L2_PENDING_APPEAL_CASE_OWNER_NOTIFY` |
| 13 | 0082+0083 | [10-2-appeal-13-case-owner-notify-appellant.html](../10-2-appeal-13-case-owner-notify-appellant.html) | `original_officer` | **Somchai.J** | นายสมชาย ใจซื่อ (นิติกร/นักสืบเจ้าของเรื่อง) | "ลงนามและแจ้งผลผู้อุทธรณ์" | `คำร้อง-100047/2569` | `L2_APPEAL_CASE_CLOSED_NOTIFIED` **(สิ้นสุด Flow 4 ทั้งหมด)** |

## บทบาทที่ใช้ทั้งหมดใน Flow 4 (7 คน)

| Role id | Login | ชื่อ | ตำแหน่ง | ใช้ในขั้นตอน |
|---|---|---|---|---|
| `case_bureau_admin` | Nichada.T | นางนิชาดา ธุรการกิจ | ธุรการกองบริหารคดี | 1, 10, 11 |
| `case_bureau_director` | Pattama.B | นางปัทมา บริหารกิจ | ผู้อำนวยการกองบริหารคดี | 2, 9 |
| `case_tracking_director` | Wichai.T | นายวิชัย ติดตามกิจ | ผู้อำนวยการกลุ่มงานบริหารติดตามคดี | 3, 8 |
| `original_officer` | Somchai.J | นายสมชาย ใจซื่อ | นิติกร/นักสืบเจ้าของเรื่อง | 4, 13 |
| `appeal_subcommittee_secretariat` | Malee.S | นางสาวมาลี เสรีกิจ | ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ | 5, 7 |
| `appeal_ruling_subcommittee` | Sompong.V | นายสมพงษ์ วินิจฉัยกุล | คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ | 6 |
| `case_tracking_secretary` | Suda.K | นางสาวสุดา คดีเที่ยง | เลขานุการกลุ่มงานบริหารติดตามคดี | 12 |

## คำร้องตัวอย่างสำหรับทดสอบแบบ "เข้าตรงกลาง Flow"

ไม่ต้องเดินตั้งแต่ขั้น 1 เสมอไป — คำร้องตัวอย่างแต่ละใบถูกวางไว้ที่สถานะ "รอ" ของแต่ละหน้าโดยตรงแล้ว เลือก id ตามขั้นที่ต้องการทดสอบจากตารางด้านบนได้เลย รายการทั้งหมด (`คำร้อง-100032/2569` ถึง `100048/2569`) อยู่ใน [`assets/ecmis-activity10.js`](../assets/ecmis-activity10.js) — `100042/2569` และ `100048/2569` เป็น 2 สถานะปลายทาง (รอบอร์ดตอบ / ปิดเคสสมบูรณ์) ไว้ดูผลลัพธ์เฉย ๆ ไม่มีหน้าให้กดต่อ

## หมายเหตุ

- ทุกหน้ามี**แถบสถานะ**ด้านบน (badge สีม่วง "อุทธรณ์" + มติ/สถานะคดี) และ**การ์ด "ข้อมูลจากขั้นตอนก่อนหน้า"**ที่โชว์ข้อมูล+ลายเซ็นสะสมของทุกขั้นก่อนหน้าเสมอ — ใช้ตรวจสอบว่าข้อมูลเดินทางถูกต้องระหว่างหน้า
- ขั้นที่ 8 (`10-2-appeal-08`) เป็นขั้นตอนแทรกใหม่ ไม่มีเลข LAW เดิม (ผู้ใช้ขอเพิ่มให้ ผอ.กลุ่มงานบริหารติดตามคดี ลงนามส่งต่อ ผอ.กองบริหารคดี ก่อนเข้ากิจกรรมที่ 7)
- ทุกปุ่ม "ลงนามและ..." จะเปิด modal ลายเซ็นก่อนบันทึกเสมอ (ยกเว้นขั้นที่ 1 และ 10 ซึ่งเป็นงานธุรการบันทึกข้อมูล ไม่ใช่การพิจารณา/ลงนามอย่างเป็นทางการ)
- สโคปนี้จบที่ขั้น 13 (`L2_APPEAL_CASE_CLOSED_NOTIFIED`) — ไม่มีหน้าถัดจากนี้ (ผู้อุทธรณ์ไม่ใช่ผู้ใช้งานระบบ)
