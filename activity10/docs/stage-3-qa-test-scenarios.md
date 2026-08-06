# 🧪 Stage 3 Deliverables: QA & Test Scenario Engineer (Sub-Agent 3)
**Project:** E-CMIS กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)  
**Date:** 6 สิงหาคม 2569  
**Status:** Completed (Quality Gate Passed)

---

## 📌 1. Boundary Value Analysis (BVA) — ตารางทดสอบขอบเขตกรอบระยะเวลา (SLA)

| รหัส Test Case | กระบวนงาน | เงื่อนไขการทดสอบ (Boundary Test) | ค่า Input (วัน) | ผลลัพธ์ที่คาดหวัง (Expected Output) |
| :--- | :--- | :--- | :--- | :--- |
| **TC-BVA-101** | ส่วนกลางรับเรื่อง | กรอบรับเรื่องส่วนกลาง 7 วัน (วันแรก) | Day 1 | สถานะปกติ (Normal Green, Remaining = 6 วัน) |
| **TC-BVA-102** | ส่วนกลางรับเรื่อง | วันครบกำหนดกรอบรับเรื่องส่วนกลาง | Day 7 | สถานะเตือนส้ม (Remaining = 0 วัน) |
| **TC-BVA-103** | เขตพื้นที่รับเรื่อง | กรอบรับเรื่องเขตพื้นที่ 10 วัน | Day 10 | สถานะเตือนส้ม (Remaining = 0 วัน) |
| **TC-BVA-104** | 10.1 ความเห็นแย้ง | กรอบพิจารณาความเห็นแย้งอัยการ 15 วัน | Day 15 | สถานะครบกำหนด 15 วัน (ต้องเสนอถึงเลขาฯ) |
| **TC-BVA-105** | 10.3 คดีปกครอง | กรอบยื่นคำให้การศาลปกครอง 30 วัน | Day 30 | สถานะครบกำหนด 30 วัน |
| **TC-BVA-106** | 10.2 คำอุทธรณ์ภาพรวม | จุดเตือนครึ่งทาง (Halfway Alert 30/60) | Day 30 | Trigger Alert 1: **WARNING_HALF (เตือนส้ม 30 วัน)** |
| **TC-BVA-107** | 10.2 คำอุทธรณ์ภาพรวม | จุดเตือนใกล้ครบกำหนด (Near Deadline 45/60) | Day 45 | Trigger Alert 2: **DANGER_ALERT (เตือนแดง 45 วัน)** |
| **TC-BVA-108** | 10.2 คำอุทธรณ์ภาพรวม | จุดครบกำหนดสูงสุด (Deadline 60/60) | Day 60 | Trigger Alert 3: **EXPIRED_CRIMSON (เตือนแดงกระพริบ)** |

---

## 📌 2. Equivalence Partitioning (EP) — ตารางทดสอบการจำแนกชั้นข้อมูลและมติ

| รหัส Test Case | กลุ่มความสัมพันธ์ (Equivalence Class) | Input Data Payload | ผลลัพธ์ที่คาดหวัง (Expected Outcome) |
| :--- | :--- | :--- | :--- |
| **TC-EP-201** | 10.1 คดีชั้นอัยการ (สั่งไม่ฟ้อง) | คำสั่งไม่ฟ้องจากอัยการ | จัดเข้ากลุ่ม 10.1 + ตั้ง SLA 15 วัน |
| **TC-EP-202** | 10.1 คำตัดสินความเห็นแย้ง | มติเห็นควรทำความเห็นแย้ง | ส่งเสนอเลขาธิการ ป.ป.ท. ➔ ส่ง อสส. ชี้ขาด |
| **TC-EP-203** | 10.1 คำตัดสินไม่แย้ง | มติเห็นชอบตามคำสั่งอัยการ | ยุติเรื่องชั้นอัยการ ➔ บันทึกผลคดี |
| **TC-EP-204** | 10.2.1 ขอเปิดเผยข้อมูล | คำร้องขอเปิดเผยข้อมูลข่าวสาร | ส่งกอง/สํานักเจ้าของข้อมูลพิจารณา |
| **TC-EP-205** | 10.2.2 คำอุทธรณ์เปิดเผยข้อมูล | คำอุทธรณ์ภายใน 30 วัน | ส่งคณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ |
| **TC-EP-206** | 10.3 คดีปกครอง | หมายเรียก + สำเนาคำฟ้องศาลปกครอง | ตั้ง SLA 30 วัน ➔ ยกร่างคำให้การ |

---

## 📌 3. State Transition Matrix — ตารางจำลอง Lifecycle สถานะคดี

```
 [REGISTERED] ──(Assign)──> [DRAFTING_OPINION] ──(Submit)──> [PENDING_DIRECTOR]
                                    ▲                                 │
                                    │ (Reject)                        ▼ (Approve)
                             [REJECTED_BACK] <──(Reject)── [PENDING_SECGEN]
                                                                      │
                                                                      ▼ (Approve & e-Sign)
                                                             [FINAL_DISPATCHED]
                                                                      │
                                                                      ▼ (Record Resolution)
                                                                 [ARCHIVED]
```

| Current State | Event / Trigger | Target State | Logic / System Behavior |
| :--- | :--- | :--- | :--- |
| `REGISTERED` | Assign Officer | `DRAFTING_OPINION` | สร้างรายการงานใน Work Inbox ของนิติกร |
| `DRAFTING_OPINION` | Submit Approval | `PENDING_DIRECTOR` | ส่งเข้าคิวงาน ผอ.กองกฎหมาย |
| `PENDING_DIRECTOR` | Approve | `PENDING_SECGEN` | ส่งเข้าคิวงาน รองเลขาฯ / เลขาธิการ ป.ป.ท. |
| `PENDING_DIRECTOR` | Reject | `DRAFTING_OPINION` | ส่งกลับให้นิติกรแก้ไข พร้อมบันทึกเหตุผล |
| `PENDING_SECGEN` | Approve & e-Sign | `FINAL_DISPATCHED` | ประทับ e-Signature + ล็อคไฟล์ PDF |
| `FINAL_DISPATCHED` | Record Resolution | `ARCHIVED` | บันทึกมติเสร็จสมบูรณ์ + ปิดสำนวนคดี |

---

## 📌 4. End-to-End (E2E) Test Scenarios

### 4.1 Happy Path: กระบวนการไหลผ่านฉลุย (คดีความเห็นแย้ง 10.1)
1. ธุรการลงทะเบียนคำสั่งไม่ฟ้องจากอัยการ (`REGISTERED`)
2. นิติกรยกร่างความเห็นแย้งผ่าน Split-Screen Viewer และกดส่งเสนออนุมัติ (`DRAFTING_OPINION`)
3. ผอ.กองกฎหมาย ตรวจพิจารณาและกดอนุมัติ (`PENDING_DIRECTOR`)
4. เลขาธิการ ป.ป.ท. พิจารณาชี้ขาด ลงนาม e-Signature และกดอนุมัติส่งเรื่อง (`PENDING_SECGEN`)
5. ระบบส่งหนังสือความเห็นแย้งให้อัยการสูงสุด (OAG) และอัปเดตสถานะเป็น `FINAL_DISPATCHED`

### 4.2 Alternative Path: การขอขยายระยะเวลาคำให้การต่อศาลปกครอง (10.3)
1. นิติกรทำบันทึกขอขยายระยะเวลาคำให้การต่อศาลปกครองออกไปอีก 30 วัน
2. เสนอ ผอ.กองกฎหมาย อนุมัติยื่นคำร้องขอขยายเวลาต่อศาลปกครอง
3. ระบบอัปเดต SLA Due Date ใหม่โดยอัตโนมัติ

### 4.3 Exception Path: การส่งกลับแก้ไขเนื่องจากพยานหลักฐานไม่ครบถ้วน
1. ผอ.กองกฎหมาย ตรวจร่างความเห็นแย้งแล้วพบว่าพยานหลักฐานยังไม่ครบถ้วน
2. กดปุ่ม **"ส่งกลับให้นิติกรแก้ไข (Reject)"** พร้อมกรอกเหตุผล
3. ระบบเปลี่ยนสถานะเป็น `DRAFTING_OPINION` และส่งแจ้งเตือน In-App Bell ให้นิติกรเจ้าของสำนวน
