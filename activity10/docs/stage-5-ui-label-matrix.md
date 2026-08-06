# ✍️ Stage 5 Deliverables: Content Cleansing & Text Humanizer Specialist (Sub-Agent 5)
**Project:** E-CMIS กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)  
**Date:** 6 สิงหาคม 2569  
**Status:** Completed (Quality Gate Passed)

---

## 📌 1. หลักการขัดเกลาภาษาราชการและภาษากฎหมาย (Production-ready Thai Copy Rules)
1. **ความถูกต้องตามพจนานุกรมกฎหมาย:** ใช้ศัพท์ทางกฎหมายของ ป.ป.ท., ศาลปกครอง และสำนักงานอัยการสูงสุดที่ถูกต้อง เช่น "ความเห็นแย้ง", "คำให้การ", "คำอุทธรณ์การไม่เปิดเผยข้อมูลข่าวสาร", "การชี้ขาด"
2. **ขัดเกลาข้อความให้เป็นธรรมชาติ (Humanized Copy):** ลบร่องรอยคำแปลแปลกๆ หรือภาษา AI ให้เป็นภาษาราชการระดับทางการ 100%
3. **การแจ้งเตือนที่ชัดเจน สุภาพ และถูกต้อง:** ข้อความ Validation Messages และ Alerts แจ้งเตือนกระชับ ตรงประเด็น สื่อความหมายชัดเจน

---

## 📌 2. UI Label Matrix (ตารางคำศัพท์บนหน้าจอ TH / EN Dictionary)

| หมวดหมู่ (Category) | ข้อความภาษาไทย (Thai Official Wording) | ข้อความภาษาอังกฤษ (English UI String) | ตำแหน่งที่ใช้งาน (UI Context / Tooltip) |
| :--- | :--- | :--- | :--- |
| **Header / Brand** | ระบบบริหารจัดการกระบวนการด้านกฎหมายในทางคดี | Legal & Case Management System | ชื่อระบบหลักบน Top Navigation Bar |
| **Activity 10.1** | คดีชั้นอัยการและชั้นศาล (พิจารณาความเห็นแย้ง) | Prosecutorial & Court Case Management | ป้าย Badge และเมนูกิจกรรม 10.1 |
| **Activity 10.2.1**| คำร้องขอเปิดเผยข้อมูลข่าวสาร | Information Disclosure Request | ป้าย Badge และเมนูกิจกรรม 10.2.1 |
| **Activity 10.2.2**| คำอุทธรณ์การไม่เปิดเผยข้อมูลข่าวสาร | Information Disclosure Appeal | ป้าย Badge และเมนูกิจกรรม 10.2.2 |
| **Activity 10.3** | คดีปกครอง (ศาลปกครอง) | Administrative Court Case Management | ป้าย Badge และเมนูกิจกรรม 10.3 |
| **Button / Action** | ลงทะเบียนรับสำนวนคดี | Register New Case Intake | ปุ่มหลักหน้า 02-case-register.html |
| **Button / Action** | ยกร่างความเห็น (Split-Screen) | Draft Opinion (Split Viewer) | ปุ่มตาราง Work Inbox (01-work-inbox) |
| **Button / Action** | เสนอพิจารณาอนุมัติ (e-Approval) | Submit for Approval | ปุ่มส่งเสนอความเห็นผู้บังคับบัญชา |
| **Button / Action** | ประทับลายมือชื่อดิจิทัล (e-Signature) | Stamp Digital Signature | ปุ่มลงนามอิเล็กทรอนิกส์ |
| **Button / Action** | ดาวน์โหลดมติฉบับสมบูรณ์ (PDF) | Download Resolution (PDF) | ปุ่มดาวน์โหลดมติในหน้า 06-board-resolution |
| **SLA Badge** | เหลือระยะเวลา {N} วัน | {N} Days Remaining | ป้ายแสดงกรอบเวลา SLA คดี |
| **SLA Alert** | เตือนครึ่งทาง (30 วัน) | Halfway SLA Alert (30 Days) | ข้อความแจ้งเตือนสีส้ม |
| **SLA Alert** | เตือนใกล้ครบกำหนด (45-60 วัน) | Near Deadline Alert (45-60 Days) | ข้อความแจ้งเตือนสีแดง |
| **Validation** | กรุณากรอกพฤติการณ์และข้อกฎหมายประกอบ | Please enter legal facts and opinion | แจ้งเตือนกรณีลืมกรอกความเห็นนิติกร |
| **Validation** | ต้องประทับ e-Signature ก่อนส่งอนุมัติ | e-Signature is required before dispatch | แจ้งเตือนกรณีลืมลงนามดิจิทัล |

---

## 📌 3. ตัวอย่างข้อความแจ้งเตือนในระบบ (System Alert Messages)

```json
{
  "SUCCESS_CASE_REGISTER": "ลงทะเบียนสำนวนคดีเรียบร้อยแล้ว ระบบได้ออกเลขที่สำนวนและจัดส่งเข้า Work Inbox ของนิติกรเจ้าของสำนวนแล้ว",
  "SUCCESS_E_SIGNATURE": "อนุมัติและประทับ e-Signature สำเร็จ! สำนวนถูกลงนามและจัดส่งตามลำดับชั้นเรียบร้อยแล้ว",
  "REJECT_BACK_NOTICE": "ส่งกลับสำนวนให้นิติกรแก้ไขเรียบร้อยแล้ว ระบบได้ส่งการแจ้งเตือนไปยังนิติกรเจ้าของสำนวนแล้ว",
  "SLA_EXPIRED_WARNING": "คำเตือน: สำนวนนี้เกินกำหนดกรอบระยะเวลา SLA แล้ว กรุณาเร่งรัดการเสนอความเห็นทันที"
}
```
