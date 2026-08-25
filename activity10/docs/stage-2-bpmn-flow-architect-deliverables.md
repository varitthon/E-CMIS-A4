# 📐 Stage 2 Deliverables: BPMN Process & Flow Architect (Sub-Agent 2)
**Project:** E-CMIS กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)  
**Date:** 6 สิงหาคม 2569  
**Status:** Completed (Quality Gate Passed)

---

## 📌 1. BPMN Breakdown Table (ตารางจำแนกผังกระบวนงาน TO-BE แยกตาม Swimlanes)

> [!NOTE]
> **กฎธุรกิจสำคัญ (Business Rule - Saraban Glang Intake):**  
> สารบรรณกลางเป็น **หน่วยงานภายนอกระบบ** (ออกเลขหนังสือเป็นเอกสารกระดาษฉบับภายนอก) เมื่อหนังสือกระดาษส่งถึงกองกฎหมาย ธุรการกองกฎหมายจะเป็นผู้ลงรับในระบบ E-CMIS โดยระบุ **"เลขที่หนังสือส่ง/เลขรับสารบรรณกลางภายนอก"** พร้อมอัปโหลด **ไฟล์สแกนหนังสือกระดาษ (PDF)** เพื่อออกเลขที่สำนวน ป.ป.ท. และนับกรอบเวลา SLA โดยอัตโนมัติ

### 1.1 กระบวนงาน 10.1: ระบบบริหารจัดการสำนวนคดีชั้นอัยการและชั้นศาล (พิจารณาความเห็นแย้ง)
| Swimlane (ผู้ปฏิบัติ) | ขั้นตอนการทำงาน (BPMN Node) | ข้อมูลนำเข้า (Input) | ผลลัพธ์ (Output) | ระบบ/เครื่องมือ (System Tool) |
| :--- | :--- | :--- | :--- | :--- |
| **ธุรการกองกฎหมาย** | 1. รับคำสั่งไม่ฟ้อง/ฟ้องบางข้อหาจากอัยการ | หนังสือจาก อสส. / e-Service | เลขรับสำนวนอัตโนมัติ | Case Registration (01-case-register.html) |
| **ธุรการกองกฎหมาย** | 2. ลงทะเบียนสำนวนและจ่ายงานให้นิติกร | ข้อมูลสำนวน | ใบจ่ายงานนิติกร | Work Inbox Task Assignment |
| **นิติกรเจ้าของสำนวน** | 3. ตรวจสอบพยานหลักฐานและค้น KM | สำนวนไต่สวน (กจ.7/กจ.5) | แนวคำพิพากษาอ้างอิง | Split-Screen Knowledge Base (03-split-viewer.html) |
| **นิติกรเจ้าของสำนวน** | 4. ยกร่างความเห็นแย้ง / ไม่แย้ง | พยานหลักฐาน | ร่างความเห็นแย้ง (.docx) | Legal Editor (03-split-viewer.html) |
| **ผอ.กองกฎหมาย** | 5. ตรวจพิจารณาและเสนอความเห็น | ร่างความเห็นแย้ง | ความเห็น ผอ.กอง + e-Signature | e-Approval Module (04-approval-review.html) |
| **รองเลขาธิการ ป.ป.ท.** | 6. ตรวจพิจารณาคดีก่อนเสนอเลขาฯ | บันทึกความเห็น | ความเห็นรองเลขาฯ | e-Approval Module |
| **ธุรการกองกฎหมาย** | 8. ตรวจรับหนังสือฉบับลงนามสมบูรณ์และส่งต่อนิติกร (S17) | หนังสือลงนาม + เลขส่งภายนอก | สถานะส่งต่อนิติกร | 17-legal-admin-external-dispatch-receive.html |
| **นิติกรเจ้าของสำนวน** | 9. จัดส่งหนังสือให้อัยการ/อสส. และบันทึกติดตามสถานะ (S18) | หนังสือฉบับสมบูรณ์ + มติ ป.ป.ท. | เลข EMS / เลขรับ อสส. + ปิดงาน | 18-officer-external-dispatch.html |

---

### 1.2 กระบวนงาน 10.2: ระบบงานพิจารณาคำร้องและคำอุทธรณ์การเปิดเผยข้อมูลข่าวสาร
| Swimlane (ผู้ปฏิบัติ) | ขั้นตอนการทำงาน (BPMN Node) | ข้อมูลนำเข้า (Input) | ผลลัพธ์ (Output) | ระบบ/เครื่องมือ (System Tool) |
| :--- | :--- | :--- | :--- | :--- |
| **ศูนย์รับเรื่อง/ธุรการ** | 1. รับคำร้อง/คำอุทธรณ์ (3 ช่องทาง) | Walk-in / Mail / Email | เลขที่รับคำอุทธรณ์ | Case Intake Register (SLA 60 วัน) |
| **หน่วยงานเจ้าของข้อมูล** | 2. ทำรายงานความเห็นการเปิดเผยข้อมูล | คำร้องขอเปิดเผยข้อมูล | รายงานความเห็นหน่วยงาน | Online Opinion Form |
| **ฝ่ายเลขาฯ อนุกรรมการฯ** | 3. รวบรวมเสนออนุกรรมการวินิจฉัยฯ | รายงานความเห็นหน่วยงาน | ระเบียบวาระการประชุม | Agenda Manager |
| **คณะอนุกรรมการวินิจฉัยฯ** | 4. พิจารณาวินิจฉัยคำอุทธรณ์ | วาระประชุม | มติคณะอนุกรรมการฯ | Subcommittee Voting System |
| **คณะกรรมการ ป.ป.ท.** | 5. พิจารณาอนุมัติมติอุทธรณ์ | ร่างมติคำวินิจฉัย | มติคณะกรรมการ ป.ป.ท. (PDF) | Board Resolution (06-board-resolution.html) |
| **นิติกรเจ้าของสำนวน** | 6. แจ้งผลอุทธรณ์ให้ประชาชน (SLA 5 วัน) | มติ ป.ป.ท. PDF | หนังสือแจ้งผลอุทธรณ์ / Email | Dispatch System (06-board-resolution.html) |

---

### 1.3 กระบวนงาน 10.3: ระบบการจัดการและควบคุมงานคดีปกครอง
| Swimlane (ผู้ปฏิบัติ) | ขั้นตอนการทำงาน (BPMN Node) | ข้อมูลนำเข้า (Input) | ผลลัพธ์ (Output) | ระบบ/เครื่องมือ (System Tool) |
| :--- | :--- | :--- | :--- | :--- |
| **ธุรการกองกฎหมาย** | 1. รับหมายเรียกและสำเนาคำฟ้องศาลปกครอง | หมายเรียกศาลปกครอง | เลขสำนวนคดีปกครอง (SLA 30 วัน) | e-Court Integration |
| **นิติกรเจ้าของสำนวน** | 2. ยกร่างคำให้การ / คำแก้อุทธรณ์ | คำฟ้อง + ฐานข้อมูล KM | ร่างคำให้การต่อศาลปกครอง | Split-Screen Editor (03-split-viewer.html) |
| **ผอ.กองกฎหมาย / เลขาฯ** | 3. ตรวจอนุมัติและลงนามคำให้การ | ร่างคำให้การ | คำให้การอนุมัติ + e-Signature | e-Approval & Signature (05-digital-signature.html) |
| **ธุรการ / อัยการ** | 4. ยื่นคำให้การต่อศาลปกครอง | คำให้การฉบับสมบูรณ์ | ใบรับคำให้การศาลปกครอง | e-Court System Link |

---

## 🛠️ 2. Draw.io XML Patch Code Structure
*(ใช้สำหรับอัปเดตไฟล์ `10.1_10.2_10.3 20260805 ล่าสุด.drawio`)*

```xml
<mxGraphModel dx="1422" dy="798" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <!-- Activity 10 Swimlane Process Nodes -->
    <mxCell id="lane_legal_admin" value="ธุรการกองกฎหมาย" style="swimlane;startSize=20;horizontal=0;html=1;whiteSpace=wrap;collapsible=0;backgroundOutline=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="80" width="1080" height="140" as="geometry" />
    </mxCell>
    <mxCell id="node_intake" value="รับและลงทะเบียนสำนวน (Auto-SLA)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;" vertex="1" parent="lane_legal_admin">
      <mxGeometry x="60" y="40" width="140" height="60" as="geometry" />
    </mxCell>
    <mxCell id="lane_legal_officer" value="นิติกรเจ้าของสำนวน" style="swimlane;startSize=20;horizontal=0;html=1;whiteSpace=wrap;collapsible=0;backgroundOutline=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="220" width="1080" height="160" as="geometry" />
    </mxCell>
    <mxCell id="node_split_draft" value="Split-Screen Viewer &amp; ยกร่างความเห็น" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fef3c7;strokeColor=#d97706;" vertex="1" parent="lane_legal_officer">
      <mxGeometry x="240" y="50" width="160" height="60" as="geometry" />
    </mxCell>
    <mxCell id="lane_legal_dir" value="ผอ.กองกฎหมาย / เลขาธิการ ป.ป.ท." style="swimlane;startSize=20;horizontal=0;html=1;whiteSpace=wrap;collapsible=0;backgroundOutline=1;" vertex="1" parent="1">
      <mxGeometry x="40" y="380" width="1080" height="160" as="geometry" />
    </mxCell>
    <mxCell id="node_approval_sig" value="e-Approval &amp; e-Signature Stamping" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d1fae5;strokeColor=#059669;" vertex="1" parent="lane_legal_dir">
      <mxGeometry x="460" y="50" width="180" height="60" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>
```
