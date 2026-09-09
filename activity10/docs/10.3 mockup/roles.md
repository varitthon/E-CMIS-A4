# 10.3 AS-IS Swimlane — Roles (Lanes) List

Source: `AS-IS10.3-swimlane-split.drawio` (11 pages / activities)

## Unique Roles (6)

| # | Lane ID | Role (Thai, as in diagram) | English |
|---|---------|------------------------------|---------|
| 1 | `lane_court` | ศาลปกครอง (ชั้นต้น / สูงสุด) | Administrative Court (Court of First Instance / Supreme Administrative Court) |
| 2 | `lane_ag` | สำนักงานคดีปกครอง (อัยการ) | Office of Administrative Litigation (Public Prosecutor) |
| 3 | `lane_chair` | ธุรการกองกฎหมาย (ผ่านระบบ E-CMIS) | Legal Division Admin/Clerk (via E-CMIS System) |
| 4 | `lane_law_dir` | ผอ.กองกฎหมาย | Director, Legal Division |
| 5 | `lane_case_dir` | ผอ.กลุ่มงานคดี | Director, Litigation Section |
| 6 | `lane_lawyer` | นิติกร กลุ่มงานคดี | Legal Officer, Litigation Section |

## Per-Page Breakdown

Which roles appear (have a lane) on each of the 11 pages:

| # | Page (Activity) | ศาลปกครอง | สนง.คดีปกครอง (อัยการ) | ธุรการกองกฎหมาย (ระบบ E-CMIS) | ผอ.กองกฎหมาย | ผอ.กลุ่มงานคดี | นิติกร กลุ่มงานคดี |
|---|------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | รับคำฟ้อง - สรุปความเห็นเสนอบอร์ด (LAW0084-0096) | ✓ | | ✓ | ✓ | ✓ | ✓ |
| 2 | คำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี (LAW0097-0099) | | | ✓ | | | ✓ |
| 3 | คำสั่งศาลเรื่องทุเลาการบังคับคดี (LAW0100-0102) | ✓ | | | | | ✓ |
| 4 | จัดทำคำให้การแก้คำฟ้อง (LAW0103-0115) | | | ✓ | ✓ | ✓ | ✓ |
| 5 | รับคำพิพากษาศาลปกครองชั้นต้น (LAW0116-0123) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | วิเคราะห์ผลคำพิพากษา - กำหนดแนวทาง (LAW0124-0128) | ✓ | ✓ | | ✓ | ✓ | ✓ |
| 7 | จัดทำคำแก้อุทธรณ์ (LAW0129-0141) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | พิจารณาความเห็นควรอุทธรณ์ (LAW0142-0148) | | ✓ | ✓ | ✓ | ✓ | ✓ |
| 9 | เสนอมติอุทธรณ์ต่อบอร์ด (LAW0149-0152) | | | ✓ | ✓ | ✓ | ✓ |
| 10 | ดำเนินการอุทธรณ์ต่อศาลปกครองสูงสุด (LAW0153, LAW0156-0163) | ✓ | ✓ | | ✓ | ✓ | ✓ |
| 11 | แจ้งความประสงค์ไม่อุทธรณ์ (LAW0164-0171, LAW0163) | | | | ✓ | ✓ | ✓ |

## Notes

- `นิติกร กลุ่มงานคดี` (Legal Officer, Litigation Section) and `ผอ.กลุ่มงานคดี` / `ผอ.กองกฎหมาย` appear on nearly every page — they are the core process owners.
- The `lane_chair` lane (drawn/labeled "ระบบ E-CMIS" in the diagram) is not a system-only/automated lane — the actual actor performing those steps is `ธุรการกองกฎหมาย` (Legal Division Admin/Clerk), who registers, numbers, and routes documents through the E-CMIS system on behalf of the process.
- `ศาลปกครอง` and `สำนักงานคดีปกครอง (อัยการ)` are external parties (court and prosecutor's office), appearing only on pages involving court filings/judgments.
