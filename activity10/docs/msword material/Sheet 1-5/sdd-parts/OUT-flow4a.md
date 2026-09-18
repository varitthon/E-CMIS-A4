## LAW0103 — ธุรการกองกฎหมาย รับเรื่องมติจากบอร์ดเพื่อแจ้งผล

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท. |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > ธุรการกองกฎหมาย รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท.<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / ธุรการ รับเรื่องและแจ้งผลมติ |
| Page | activity10/10-3-10-legal-admin-resolution-notice.html |
| Page Code | L3-19 |
| ผู้ดำเนินการ | เจ้าหน้าที่ธุรการกองกฎหมาย (role: admin_legal) |

### Description
หน้าจอนี้ใช้สำหรับเจ้าหน้าที่ธุรการกองกฎหมายรับเรื่องผลการพิจารณาของคณะกรรมการ ป.ป.ท. ในคดีศาลปกครองที่เคยเสนอเรื่องเข้าที่ประชุมไปก่อนหน้านี้ (สืบเนื่องจาก LAW0096 ส่งมติเสนอบอร์ด) และดำเนินการบันทึกผลมติพร้อมแจ้งผลไปยังนิติกรกลุ่มงานคดีที่เกี่ยวข้อง

ผู้ใช้งานต้องตรวจสอบข้อมูลคดีและเรื่องที่เคยเสนอคณะกรรมการ ป.ป.ท. ซึ่งแสดงเป็นข้อมูล Read-only ที่ดึงมาจากขั้นตอนก่อนหน้า จากนั้นกรอกรายละเอียดผลการประชุม (ครั้งที่ประชุม วันที่ประชุม วาระที่ สาระสำคัญของมติ) แนบรายงานสรุปมติ และกรอกรายละเอียดหนังสือแจ้งผล (เลขที่หนังสือ วันที่แจ้งผล) พร้อมเลือกนิติกรกลุ่มงานคดีที่จะแจ้งผลไปถึง

เงื่อนไขสำคัญของขั้นตอนนี้คือฟิลด์ "ผลมติ" เป็นค่าที่ระบบแสดงไว้ล่วงหน้า (ตัวอย่างค่าที่ปรากฏ: "มีมติมอบอำนาจ") ซึ่งผู้ใช้ไม่สามารถแก้ไขได้ และฟิลด์ที่มีเครื่องหมาย * ถือเป็นข้อมูลบังคับกรอกก่อนบันทึกและแจ้งผล เมื่อผู้ใช้กดยืนยัน ระบบจะบันทึก statusCode เป็น `L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN` และส่งรายการต่อไปยัง ผอ.กองกฎหมาย เพื่อพิจารณาผลมติและมอบหมายงาน (LAW0105)

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only) และรายชื่อผู้ฟ้อง/ผู้ถูกฟ้องที่ render ด้วย JavaScript
- การ์ด "เรื่องที่เสนอคณะกรรมการ ป.ป.ท." แสดงข้อมูลหนังสือส่งและบันทึกสรุปความเห็นที่เคยเสนอ (Read-only ทั้งหมด)
- การ์ด "รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท. ธุรการกองกฎหมาย" เป็นส่วนกรอกข้อมูลผลมติและรายละเอียดการแจ้งผล

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo` ดึงจากข้อมูลคดี ไม่สามารถแก้ไข
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype] เป็นบล็อกที่ render รายชื่อผู้ฟ้องด้วย JavaScript
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype] เป็นบล็อกที่ render รายชื่อผู้ถูกฟ้องด้วย JavaScript
- ตัวอย่างค่า: —

**7. เลขที่หนังสือส่งภายใน**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_internalDocNo` ดึงจากเรื่องที่เคยเสนอคณะกรรมการ ป.ป.ท.
- ตัวอย่างค่า: —

**8. วันที่ออกเลขส่ง**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_internalDocDate`
- ตัวอย่างค่า: —

**9. บันทึกสรุปความเห็น**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_opinionText`
- ตัวอย่างค่า: —

**10. ครั้งที่ประชุม \***
- Required Field: True
- Input Type: Textbox
- Read Only: False
- Default: —
- เงื่อนไข: id `in_meetingNo` บังคับกรอกก่อนบันทึกและแจ้งผล
- ตัวอย่างค่า: เช่น 41/2569

**11. วันที่ประชุม \***
- Required Field: True
- Input Type: Date Picker
- Read Only: False
- Default: —
- เงื่อนไข: id `in_meetingDate` บังคับกรอก
- ตัวอย่างค่า: —

**12. วาระที่ \***
- Required Field: True
- Input Type: Textbox
- Read Only: False
- Default: —
- เงื่อนไข: id `in_agendaNo` บังคับกรอก
- ตัวอย่างค่า: เช่น 5.41

**13. ผลมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: มีมติมอบอำนาจ
- เงื่อนไข: id `f_resolutionResult` ค่าที่ระบบแสดงล่วงหน้า ไม่สามารถแก้ไข
- ตัวอย่างค่า: มีมติมอบอำนาจ

**14. สาระสำคัญของมติ \***
- Required Field: True
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_resolutionText` บังคับกรอก
- ตัวอย่างค่า: สรุปข้อมติตามรายงานสรุปมติ เช่น มอบอำนาจให้ผู้อำนวยการกองกฎหมายขอขยายระยะเวลายื่นคำให้การ และมอบหมายพนักงานอัยการเป็นผู้แก้ต่างคดี...

**15. แนบรายงานสรุปมติ \***
- Required Field: True
- Input Type: Upload File
- Read Only: False
- Default: —
- เงื่อนไข: id `in_resolutionReport` บังคับแนบไฟล์
- ตัวอย่างค่า: —

**16. เลขที่หนังสือแจ้งผล \***
- Required Field: True
- Input Type: Textbox
- Read Only: False
- Default: —
- เงื่อนไข: id `in_noticeDocNo` บังคับกรอก
- ตัวอย่างค่า: เช่น ปป 0003/4501

**17. วันที่แจ้งผล \***
- Required Field: True
- Input Type: Date Picker
- Read Only: False
- Default: —
- เงื่อนไข: id `in_noticeDate` บังคับกรอก
- ตัวอย่างค่า: —

**18. แจ้งถึง นิติกร กลุ่มงานคดี \***
- Required Field: True
- Input Type: Dropdown
- Read Only: False
- Default: -- เลือกนิติกร --
- เงื่อนไข: id `in_notifyLawyer` บังคับเลือก
- ตัวอย่างค่า: —

**19. หมายเหตุ**
- Required Field: False
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_noticeNotes`
- ตัวอย่างค่า: ระบุหมายเหตุ (ถ้ามี)...

### Process

1. เจ้าหน้าที่ธุรการกองกฎหมายเข้าสู่หน้าจอ "รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท." (L3-19) จากรายการงานที่ต้องดำเนินการ
2. ตรวจสอบข้อมูลคดีและเรื่องที่เคยเสนอคณะกรรมการ ป.ป.ท. ซึ่งเป็น Read-only
3. กรอกครั้งที่ประชุม วันที่ประชุม วาระที่ และสาระสำคัญของมติ
4. แนบไฟล์รายงานสรุปมติ
5. กรอกเลขที่หนังสือแจ้งผล วันที่แจ้งผล และเลือกนิติกรกลุ่มงานคดีที่จะแจ้งผลไปถึง
6. ระบุหมายเหตุเพิ่มเติม (ถ้ามี)
7. กดปุ่ม "บันทึก และ แจ้งผล" เพื่อยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0096 (ส่งมติเสนอบอร์ด) → **LAW0103 (ธุรการรับเรื่องมติจากบอร์ด)** → LAW0105 (ผอ.กองกฎหมาย มอบหมายงาน)

---

## LAW0104 — ผู้อำนวยการกลุ่มงานคดี พิจารณาและเห็นชอบผลมติ/ข้อสั่งการ

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | พิจารณาและเห็นชอบผลมติคณะกรรมการ ป.ป.ท. |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบผลมติ/ข้อสั่งการ<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบ |
| Page | activity10/10-3-12-group-director-approve-resolution.html |
| Page Code | L3-21 |
| ผู้ดำเนินการ | ผู้อำนวยการกลุ่มงานคดี (role: case_group_director) |

### Description
หน้าจอนี้ใช้สำหรับผู้อำนวยการกลุ่มงานคดีพิจารณาและเห็นชอบผลมติคณะกรรมการ ป.ป.ท. พร้อมทั้งข้อสั่งการของ ผอ.กองกฎหมาย ก่อนส่งต่อให้นิติกรกลุ่มงานคดีดำเนินการ

หมายเหตุสำคัญ: แม้ในผัง User Flow (drawio) เดิมจะระบุลำดับ LAW0104 มาก่อน LAW0105 แต่จาก Prototype จริงพบว่า ผอ.กองกฎหมายพิจารณาผลมติและมอบหมายงานก่อน (LAW0105, STEP_CODE `L3-20`) แล้วจึงส่งต่อมาให้ ผอ.กลุ่มงานคดีพิจารณาเห็นชอบในขั้นตอนนี้ (LAW0104, STEP_CODE `L3-21`) ซึ่งเป็นลำดับที่สลับจากผังเดิม เอกสารฉบับนี้ยึดตามลำดับจริงของ Prototype

ในหน้าจอนี้ ผอ.กลุ่มงานคดีสามารถตรวจสอบข้อมูลคดี ผลมติคณะกรรมการ ป.ป.ท. การแจ้งผลมติจากธุรการกองกฎหมาย และข้อสั่งการของ ผอ.กองกฎหมาย ซึ่งเป็นข้อมูล Read-only ทั้งหมด จากนั้นระบุความเห็นเพิ่มเติม (ถ้ามี) และเลือกนิติกรกลุ่มงานคดีที่จะส่งต่อให้ดำเนินการ เมื่อกดยืนยัน ระบบจะบันทึก statusCode เป็น `L3_PENDING_LAWYER_EXTENSION` และส่งรายการต่อไปยังนิติกรกลุ่มงานคดีเพื่อยื่นคำขอขยายเวลาต่อศาลและร่างคำให้การแก้คำฟ้อง (LAW0106/LAW0107)

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only)
- การ์ด "ผลมติคณะกรรมการ ป.ป.ท." แสดงรายละเอียดผลการประชุมที่ธุรการบันทึกไว้ (Read-only)
- การ์ด "การแจ้งผลมติ (จากธุรการกองกฎหมาย) รับทราบแล้ว" แสดงรายละเอียดหนังสือแจ้งผล
- การ์ด "ข้อสั่งการ ผอ.กองกฎหมาย" แสดงข้อสั่งการที่ ผอ.กองกฎหมายมอบหมายไว้ (มาจาก LAW0105)
- การ์ด "พิจารณาและเห็นชอบ ผอ.กลุ่มงานคดี" เป็นส่วนกรอกความเห็นและเลือกผู้รับมอบหมายต่อ

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo`
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**7. ครั้งที่ประชุม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_meetingNo`
- ตัวอย่างค่า: —

**8. วันที่ประชุม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_meetingDate`
- ตัวอย่างค่า: —

**9. วาระที่**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_agendaNo`
- ตัวอย่างค่า: —

**10. ผลมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionResult`
- ตัวอย่างค่า: —

**11. สาระสำคัญของมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionText`
- ตัวอย่างค่า: —

**12. รายงานสรุปมติ**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype] บล็อกแสดงไฟล์แนบที่ render ด้วย JavaScript
- ตัวอย่างค่า: —

**13. เลขที่หนังสือแจ้งผล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeDocNo`
- ตัวอย่างค่า: —

**14. วันที่แจ้งผล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeDate`
- ตัวอย่างค่า: —

**15. แจ้งถึง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**16. หมายเหตุ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeNotes`
- ตัวอย่างค่า: —

**17. ผู้แจ้งผล**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**18. ผู้รับทราบผลมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_ackInfo`
- ตัวอย่างค่า: —

**19. มอบหมายให้ (ข้อสั่งการ ผอ.กองกฎหมาย)**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_directorAssignTo`
- ตัวอย่างค่า: —

**20. ผู้สั่งการ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_directorName`
- ตัวอย่างค่า: —

**21. ข้อสั่งการ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_directorOrder`
- ตัวอย่างค่า: —

**22. ลายมือชื่อ ผอ.กองกฎหมาย**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**23. ความเห็น ผอ.กลุ่มงานคดี**
- Required Field: False
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_approveNotes`
- ตัวอย่างค่า: ระบุความเห็นเพิ่มเติม (ถ้ามี)...

**24. ส่งต่อให้ (นิติกร กลุ่มงานคดี) \***
- Required Field: True
- Input Type: Dropdown
- Read Only: False
- Default: -- เลือกนิติกร --
- เงื่อนไข: id `in_forwardTo` บังคับเลือก
- ตัวอย่างค่า: —

### Process

1. ผู้อำนวยการกลุ่มงานคดีเข้าสู่หน้าจอ "พิจารณาและเห็นชอบ" (L3-21) หลังได้รับมอบหมายจาก ผอ.กองกฎหมาย (LAW0105)
2. ตรวจสอบข้อมูลคดี ผลมติคณะกรรมการ ป.ป.ท. การแจ้งผลมติ และข้อสั่งการของ ผอ.กองกฎหมาย ซึ่งเป็น Read-only
3. ระบุความเห็นเพิ่มเติม (ถ้ามี)
4. เลือกนิติกรกลุ่มงานคดีที่จะส่งต่อให้ดำเนินการ
5. กดปุ่ม "ลงนาม เห็นชอบ และ ส่งต่อ" เพื่อยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_LAWYER_EXTENSION` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0105 (ผอ.กองกฎหมาย มอบหมายงาน) → **LAW0104 (ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบ)** → LAW0106/LAW0107 (นิติกร ยื่นคำขอขยายเวลาและร่างคำให้การแก้คำฟ้อง)
(หมายเหตุ: ลำดับนี้สลับจากผัง drawio เดิม ซึ่งระบุ LAW0104 มาก่อน LAW0105 — เอกสารนี้ยึดตามลำดับจริงของ Prototype)

---

## LAW0105 — ผู้อำนวยการกองกฎหมาย พิจารณาผลมติและมอบหมายงาน

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | พิจารณาผลมติและมอบหมายงาน |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > ผอ.กองกฎหมาย พิจารณาผลมติและมอบหมายงาน<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / ผอ.กองกฎหมาย พิจารณาผลมติและมอบหมายงาน |
| Page | activity10/10-3-11-legal-director-assign-resolution.html |
| Page Code | L3-20 |
| ผู้ดำเนินการ | ผู้อำนวยการกองกฎหมาย (role: dir_legal) |

### Description
หน้าจอนี้ใช้สำหรับผู้อำนวยการกองกฎหมายพิจารณาผลมติคณะกรรมการ ป.ป.ท. ที่ได้รับแจ้งจากเจ้าหน้าที่ธุรการกองกฎหมาย (LAW0103) และมอบหมายงานต่อให้ผู้อำนวยการกลุ่มงานคดีดำเนินการต่อไป

หมายเหตุสำคัญ: จาก Prototype จริง ขั้นตอนนี้ (LAW0105, STEP_CODE `L3-20`) เกิดขึ้น**ก่อน**ขั้นตอนที่ ผอ.กลุ่มงานคดีพิจารณาเห็นชอบ (LAW0104, STEP_CODE `L3-21`) ซึ่งต่างจากลำดับที่ระบุในผัง User Flow (drawio) เดิมที่วาง LAW0104 มาก่อน LAW0105 เอกสารฉบับนี้ยึดตามลำดับจริงของ Prototype

ในหน้าจอนี้ ผอ.กองกฎหมายสามารถตรวจสอบข้อมูลคดี ผลมติคณะกรรมการ ป.ป.ท. และการแจ้งผลมติจากธุรการกองกฎหมาย ซึ่งเป็นข้อมูล Read-only ทั้งหมด จากนั้นเลือกผู้อำนวยการกลุ่มงานคดีที่จะมอบหมายให้ดำเนินการต่อ พร้อมระบุข้อสั่งการ (ถ้ามี) เมื่อกดยืนยัน ระบบจะบันทึก statusCode เป็น `L3_PENDING_GROUP_RESOLUTION_APPROVE` และส่งรายการต่อไปยัง ผอ.กลุ่มงานคดีเพื่อพิจารณาและเห็นชอบ (LAW0104)

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only)
- การ์ด "ผลมติคณะกรรมการ ป.ป.ท." แสดงรายละเอียดผลการประชุมที่ธุรการบันทึกไว้ (Read-only)
- การ์ด "การแจ้งผลมติ (จากธุรการกองกฎหมาย) รอรับทราบ" แสดงรายละเอียดหนังสือแจ้งผล
- การ์ด "พิจารณาผลมติและมอบหมายงาน ผอ.กองกฎหมาย" เป็นส่วนมอบหมายงานและระบุข้อสั่งการ

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo`
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**7. ครั้งที่ประชุม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_meetingNo`
- ตัวอย่างค่า: —

**8. วันที่ประชุม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_meetingDate`
- ตัวอย่างค่า: —

**9. วาระที่**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_agendaNo`
- ตัวอย่างค่า: —

**10. ผลมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionResult`
- ตัวอย่างค่า: —

**11. สาระสำคัญของมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionText`
- ตัวอย่างค่า: —

**12. รายงานสรุปมติ**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**13. เลขที่หนังสือแจ้งผล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeDocNo`
- ตัวอย่างค่า: —

**14. วันที่แจ้งผล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeDate`
- ตัวอย่างค่า: —

**15. แจ้งถึง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**16. หมายเหตุ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_noticeNotes`
- ตัวอย่างค่า: —

**17. ผู้แจ้งผล**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**18. ข้อความรับทราบผลมติ (ไม่มี label)**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: รับทราบผลมติคณะกรรมการ ป.ป.ท. ตามหนังสือ
- เงื่อนไข: ไม่มี label กำกับ แสดงข้อความยืนยันการรับทราบ
- ตัวอย่างค่า: รับทราบผลมติคณะกรรมการ ป.ป.ท. ตามหนังสือ

**19. มอบหมายให้ (ผอ.กลุ่มงานคดี) \***
- Required Field: True
- Input Type: Dropdown
- Read Only: False
- Default: -- เลือก ผอ.กลุ่มงานคดี --
- เงื่อนไข: id `in_assignTo` บังคับเลือก
- ตัวอย่างค่า: —

**20. ข้อสั่งการ**
- Required Field: False
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_orderNotes`
- ตัวอย่างค่า: ระบุข้อสั่งการ (ถ้ามี)...

### Process

1. ผู้อำนวยการกองกฎหมายเข้าสู่หน้าจอ "พิจารณาผลมติและมอบหมายงาน" (L3-20) หลังได้รับแจ้งผลมติจากเจ้าหน้าที่ธุรการกองกฎหมาย (LAW0103)
2. ตรวจสอบข้อมูลคดี ผลมติคณะกรรมการ ป.ป.ท. และการแจ้งผลมติ ซึ่งเป็น Read-only
3. เลือกผู้อำนวยการกลุ่มงานคดีที่จะมอบหมายให้ดำเนินการต่อ
4. ระบุข้อสั่งการ (ถ้ามี)
5. กดปุ่ม "ลงนาม มอบหมายงาน" เพื่อยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_GROUP_RESOLUTION_APPROVE` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0103 (ธุรการรับเรื่องมติจากบอร์ด) → **LAW0105 (ผอ.กองกฎหมาย มอบหมายงาน)** → LAW0104 (ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบ)
(หมายเหตุ: ลำดับนี้สลับจากผัง drawio เดิม ซึ่งระบุ LAW0104 มาก่อน LAW0105 — เอกสารนี้ยึดตามลำดับจริงของ Prototype)

---

## LAW0106 — นิติกรกลุ่มงานคดี ยื่นคำขอขยายเวลาต่อศาล

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | ยื่นคำขอขยายเวลาต่อศาล |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > นิติกร ยื่นคำขอขยายเวลาต่อศาลและร่างคำให้การแก้คำฟ้อง<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / นิติกร ยื่นคำขอขยายเวลาและร่างคำให้การแก้คำฟ้อง |
| Page | activity10/10-3-13-lawyer-request-extension.html |
| Page Code | L3-22 |
| ผู้ดำเนินการ | นิติกร กลุ่มงานคดี (role: case_legal_officer) |

### Description
หน้าจอนี้เป็นหน้าจอเดียวกับ LAW0107 (Page Code L3-22) ซึ่งรวมสองกิจกรรมของนิติกรกลุ่มงานคดีไว้ในฟอร์มเดียวกัน คือการยื่นคำขอขยายเวลาต่อศาล (LAW0106) และการร่างคำให้การแก้คำฟ้อง (LAW0107) หัวข้อนี้ครอบคลุมเฉพาะส่วนของการยื่นคำขอขยายเวลาต่อศาล

นิติกรกลุ่มงานคดีได้รับมอบหมายงานต่อจาก ผอ.กลุ่มงานคดี (LAW0104) เพื่อดำเนินการตามกำหนดเวลายื่นคำให้การของคดี โดยหน้าจอนี้แสดงข้อมูลกำหนดเวลายื่นคำให้การ (วันที่สำนักงาน ป.ป.ท. รับเรื่อง ศาลให้ทำภายในกี่วัน ครบกำหนดเดิม ศาลอนุญาตให้ขยายรวม และครบกำหนดปัจจุบัน) รวมถึงคำสั่งที่ได้รับจากมติคณะกรรมการ ป.ป.ท. และข้อสั่งการ/ความเห็นของผู้บังคับบัญชา ซึ่งเป็นข้อมูล Read-only ทั้งหมด

ในส่วนการยื่นคำขอขยายเวลา หน้าจอมีปุ่ม "เพิ่มคำขอขยายเวลา" สำหรับบันทึกการยื่นคำขอขยายเวลาต่อศาลแต่ละครั้ง [ต้องยืนยันรูปแบบการดำเนินการจาก Prototype] เนื่องจากตารางฟิลด์ที่ปรากฏใน Prototype ไม่ได้ระบุรายละเอียดฟอร์มย่อยของการเพิ่มคำขอขยายเวลาแต่ละรายการ ระบุเพียงปุ่มดำเนินการ (onclick=addExtensionRow()) เท่านั้น business rule ที่ยืนยันแล้วคือ "ขอขยายเวลาได้ตามดุลพินิจศาล"

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only)
- การ์ด "กำหนดเวลายื่นคำให้การ" แสดงกำหนดเวลาที่เกี่ยวข้องกับการยื่นคำให้การและการขอขยายเวลา
- การ์ด "คำสั่งที่ได้รับ" แสดงมติคณะกรรมการ ป.ป.ท. และข้อสั่งการ/ความเห็นของผู้บังคับบัญชาที่ผ่านมา
- ปุ่ม "เพิ่มคำขอขยายเวลา" ใช้บันทึกรายการคำขอขยายเวลาต่อศาล [ต้องยืนยันรูปแบบการดำเนินการจาก Prototype]

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo`
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**7. วันที่สำนักงาน ป.ป.ท. รับเรื่อง**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtReceivedDate`
- ตัวอย่างค่า: —

**8. ศาลให้ทำภายใน**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtDeadlineDays`
- ตัวอย่างค่า: —

**9. ครบกำหนดเดิม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_originalDue`
- ตัวอย่างค่า: —

**10. ศาลอนุญาตให้ขยายรวม**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_grantedTotal`
- ตัวอย่างค่า: —

**11. ครบกำหนดยื่นคำให้การ (ปัจจุบัน)**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype] บล็อกคำนวณ/แสดงกำหนดวันที่ปัจจุบันที่ render ด้วย JavaScript
- ตัวอย่างค่า: —

**12. มติคณะกรรมการ ป.ป.ท.**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionRef`
- ตัวอย่างค่า: —

**13. สาระสำคัญของมติ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_resolutionText`
- ตัวอย่างค่า: —

**14. ข้อสั่งการ ผอ.กองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_directorOrder`
- ตัวอย่างค่า: —

**15. ความเห็น ผอ.กลุ่มงานคดี**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_groupNotes`
- ตัวอย่างค่า: —

**16. หมายเหตุ**
- Required Field: False
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_extensionNotes` (ฟิลด์นี้ใช้ร่วมกันระหว่างส่วนขอขยายเวลาและส่วนร่างคำให้การในหน้าจอเดียวกัน)
- ตัวอย่างค่า: ระบุหมายเหตุ (ถ้ามี)...

### Process

1. นิติกรกลุ่มงานคดีเข้าสู่หน้าจอ "นิติกร ขอขยายเวลาและร่างคำให้การ" (L3-22) หลังได้รับมอบหมายจาก ผอ.กลุ่มงานคดี (LAW0104)
2. ตรวจสอบข้อมูลคดี กำหนดเวลายื่นคำให้การ และคำสั่งที่ได้รับ ซึ่งเป็น Read-only
3. กดปุ่ม "เพิ่มคำขอขยายเวลา" เพื่อบันทึกรายการยื่นคำขอขยายเวลาต่อศาลตามดุลพินิจศาล [ต้องยืนยันรูปแบบการดำเนินการจาก Prototype]
4. ระบุหมายเหตุ (ถ้ามี)
5. ดำเนินการต่อในส่วนร่างคำให้การแก้คำฟ้อง (ดู LAW0107) ก่อนกดยืนยันส่งทั้งฟอร์มร่วมกัน

**Flow ต่อเนื่อง:**
LAW0104 (ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบ) → **LAW0106 (นิติกร ยื่นคำขอขยายเวลาต่อศาล)** → LAW0107 (นิติกร ร่างคำให้การแก้คำฟ้อง — หน้าจอเดียวกัน)

---

## LAW0107 — นิติกรกลุ่มงานคดี ร่างคำให้การแก้คำฟ้อง

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | ร่างคำให้การแก้คำฟ้อง |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > นิติกร ยื่นคำขอขยายเวลาต่อศาลและร่างคำให้การแก้คำฟ้อง<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / นิติกร ยื่นคำขอขยายเวลาและร่างคำให้การแก้คำฟ้อง |
| Page | activity10/10-3-13-lawyer-request-extension.html |
| Page Code | L3-22 |
| ผู้ดำเนินการ | นิติกร กลุ่มงานคดี (role: case_legal_officer) |

### Description
หน้าจอนี้เป็นหน้าจอเดียวกับ LAW0106 (Page Code L3-22) ซึ่งรวมสองกิจกรรมของนิติกรกลุ่มงานคดีไว้ในฟอร์มเดียวกัน หัวข้อนี้ครอบคลุมเฉพาะส่วนของการร่างคำให้การแก้คำฟ้องและเอกสารประกอบที่แนบในฟอร์มเดียวกัน

หลังจากดำเนินการยื่นคำขอขยายเวลาต่อศาล (LAW0106) ในการ์ดเดียวกันนี้ นิติกรกลุ่มงานคดีต้องจัดเตรียมและแนบไฟล์ร่างคำให้การแก้คำฟ้อง ร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (อัยการ) และพยานหลักฐาน/เอกสารประกอบ (ถ้ามี) โดยฟิลด์แนบไฟล์ร่างคำให้การและร่างหนังสือนำส่งเป็นข้อมูลบังคับก่อนดำเนินการต่อ

เมื่อกรอกและแนบเอกสารครบถ้วนแล้ว นิติกรกดปุ่ม "ลงนาม และ เสนอ ผอ.กลุ่มงานคดี" เพื่อยืนยันและส่งต่อร่างที่จัดทำให้ ผอ.กลุ่มงานคดีตรวจสอบ ระบบบันทึก statusCode เป็น `L3_PENDING_GROUP_ANSWER_REVIEW`

### Condition

**เงื่อนไขการแสดง Object**

- ข้อมูลคดี กำหนดเวลายื่นคำให้การ และคำสั่งที่ได้รับ ใช้ร่วมกับส่วนของ LAW0106 (ดูรายละเอียดในหัวข้อ LAW0106)
- การ์ด "ยื่นคำขอขยายเวลาและร่างคำให้การแก้คำฟ้อง นิติกร กลุ่มงานคดี" เป็นส่วนแนบไฟล์ร่างเอกสารที่ใช้เฉพาะในหัวข้อนี้

**1. ร่างคำให้การแก้คำฟ้อง \***
- Required Field: True
- Input Type: Upload File
- Read Only: False
- Default: —
- เงื่อนไข: id `in_answerFiles` บังคับแนบไฟล์ก่อนเสนอ ผอ.กลุ่มงานคดี
- ตัวอย่างค่า: —

**2. ร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (อัยการ) \***
- Required Field: True
- Input Type: Upload File
- Read Only: False
- Default: —
- เงื่อนไข: id `in_letterFiles` บังคับแนบไฟล์ก่อนเสนอ ผอ.กลุ่มงานคดี
- ตัวอย่างค่า: —

**3. พยานหลักฐานและเอกสารประกอบ (ถ้ามี)**
- Required Field: False
- Input Type: Upload File
- Read Only: False
- Default: —
- เงื่อนไข: id `in_evidenceFiles`
- ตัวอย่างค่า: —

### Process

1. นิติกรกลุ่มงานคดีจัดทำร่างคำให้การแก้คำฟ้องและร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (อัยการ) ในหน้าจอเดียวกับ LAW0106 (L3-22)
2. แนบไฟล์ร่างคำให้การแก้คำฟ้อง (บังคับ)
3. แนบไฟล์ร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (บังคับ)
4. แนบพยานหลักฐานและเอกสารประกอบ (ถ้ามี)
5. กดปุ่ม "ลงนาม และ เสนอ ผอ.กลุ่มงานคดี" เพื่อยืนยันและส่งต่อ ระบบบันทึก statusCode เป็น `L3_PENDING_GROUP_ANSWER_REVIEW` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0106 (นิติกร ยื่นคำขอขยายเวลาต่อศาล — หน้าจอเดียวกัน) → **LAW0107 (นิติกร ร่างคำให้การแก้คำฟ้อง)** → LAW0108 (ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ)

---

## LAW0108 — ผู้อำนวยการกลุ่มงานคดี ตรวจสอบร่างคำให้การ

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | ตรวจสอบร่างคำให้การแก้คำฟ้อง |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ |
| Page | activity10/10-3-15-group-director-review-answer.html |
| Page Code | L3-24 |
| ผู้ดำเนินการ | ผู้อำนวยการกลุ่มงานคดี (role: case_group_director) |

### Description
หน้าจอนี้ใช้สำหรับผู้อำนวยการกลุ่มงานคดีตรวจสอบร่างคำให้การแก้คำฟ้องและร่างหนังสือนำส่งที่นิติกรกลุ่มงานคดีจัดทำขึ้น (LAW0107) ก่อนเสนอต่อไปยังผู้อำนวยการกองกฎหมายเพื่อตรวจสอบในลำดับถัดไป

หมายเหตุการเรียงลำดับหน้าจอ: ในระบบไม่มีหน้าจอหมายเลข 10-3-14 ซึ่งเป็นเรื่องปกติของการวางเลขหน้าจอในโครงการนี้ ไม่ใช่หน้าจอที่ขาดหายไปจาก flow ผู้ใช้จะเข้าสู่หน้านี้ต่อจาก L3-22 โดยตรง

ผู้อำนวยการกลุ่มงานคดีตรวจสอบข้อมูลคดี กำหนดเวลายื่นคำให้การ และร่างเอกสารที่นิติกรเสนอ (ร่างคำให้การ ร่างหนังสือนำส่ง พยานหลักฐาน) ซึ่งเป็น Read-only จากนั้นระบุผลการตรวจแยกเป็น 2 รายการ คือผลการตรวจร่างคำให้การแก้คำฟ้อง และผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง โดยแต่ละรายการเลือกได้ระหว่าง "เห็นชอบ" (เสนอ ผอ.กองกฎหมายตรวจสอบต่อ) หรือ "ไม่เห็นชอบ" (ส่งกลับนิติกรแก้ไขร่าง) พร้อมระบุความเห็นประกอบ (บังคับกรอก) เมื่อกดยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_DIRECTOR_ANSWER_REVIEW`

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only)
- การ์ด "กำหนดเวลายื่นคำให้การ" แสดงกำหนดเวลาปัจจุบันและสรุปคำขอขยายเวลาที่ยื่นแล้ว
- การ์ด "ร่างเอกสารที่นิติกรเสนอ" แสดงร่างเอกสารและผู้เสนอร่างจาก LAW0107
- การ์ด "ตรวจสอบร่างคำให้การ ผอ.กลุ่มงานคดี" เป็นส่วนบันทึกผลการตรวจและความเห็น มี state พิเศษ 'return-to-lawyer' ที่ผูกกับ element `#card_answer_return` เมื่อเลือก "ไม่เห็นชอบ"

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo`
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**7. ครบกำหนดยื่นคำให้การ (ปัจจุบัน)**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**8. คำขอขยายเวลาที่ยื่นแล้ว**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_extensionSummary`
- ตัวอย่างค่า: —

**9. ร่างคำให้การแก้คำฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype] แสดงไฟล์ที่นิติกรแนบใน LAW0107
- ตัวอย่างค่า: —

**10. ร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (อัยการ)**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**11. พยานหลักฐานและเอกสารประกอบ**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**12. นิติกรผู้เสนอร่าง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**13. ผลการตรวจร่างคำให้การแก้คำฟ้อง \***
- Required Field: True
- Input Type: Radio
- Read Only: False
- Default: checked (มีค่าที่เลือกไว้ล่วงหน้า)
- เงื่อนไข: id `in_answer_approve` ตัวเลือก: "เห็นชอบ (ร่างถูกต้อง เสนอ ผอ.กองกฎหมายตรวจสอบต่อ)" / "ไม่เห็นชอบ (ส่งกลับนิติกรแก้ไขร่างคำให้การ)" การเลือก "ไม่เห็นชอบ" จะแสดง state 'return-to-lawyer' (element #card_answer_return)
- ตัวอย่างค่า: —

**14. ผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง \***
- Required Field: True
- Input Type: Radio
- Read Only: False
- Default: checked
- เงื่อนไข: id `in_letter_approve` ตัวเลือก: "เห็นชอบ (ร่างถูกต้อง เสนอ ผอ.กองกฎหมายตรวจสอบต่อ)" / "ไม่เห็นชอบ (ส่งกลับนิติกรแก้ไขร่างหนังสือนำส่ง)"
- ตัวอย่างค่า: —

**15. ความเห็น ผอ.กลุ่มงานคดี \***
- Required Field: True
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_reviewNotes` บังคับกรอก
- ตัวอย่างค่า: ระบุความเห็นหรือข้อสังเกตต่อร่าง (ถ้ามี)...

**16. ส่งต่อให้**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_forwardTo`
- ตัวอย่างค่า: —

### Process

1. ผู้อำนวยการกลุ่มงานคดีเข้าสู่หน้าจอ "ผอ.กลุ่มงานคดี ตรวจร่างคำให้การ" (L3-24) หลังนิติกรกลุ่มงานคดีเสนอร่าง (LAW0107)
2. ตรวจสอบข้อมูลคดี กำหนดเวลายื่นคำให้การ และร่างเอกสารที่นิติกรเสนอ ซึ่งเป็น Read-only
3. เลือกผลการตรวจร่างคำให้การแก้คำฟ้อง ("เห็นชอบ" หรือ "ไม่เห็นชอบ")
4. เลือกผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง ("เห็นชอบ" หรือ "ไม่เห็นชอบ")
5. กรอกความเห็น ผอ.กลุ่มงานคดี (บังคับ)
6. กดปุ่ม "ลงนาม ตรวจสอบ และ เสนอ ผอ.กองกฎหมาย" เพื่อยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_DIRECTOR_ANSWER_REVIEW` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0107 (นิติกร ร่างคำให้การแก้คำฟ้อง) → **LAW0108 (ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ)** → LAW0109 (ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง)

**Branch (กรณีไม่เห็นชอบ):**
LAW0108 (ผอ.กลุ่มงานคดี เลือก "ไม่เห็นชอบ" ในรายการใดรายการหนึ่ง) → ส่งกลับให้นิติกรกลุ่มงานคดีแก้ไขร่าง (ย้อนกลับไปยัง LAW0107) [ต้องยืนยันรูปแบบการดำเนินการจาก Prototype ว่าการส่งกลับเป็นการย้อนสถานะไปหน้าจอ L3-22 โดยตรงหรือไม่]

---

## LAW0109 — ผู้อำนวยการกองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง

| หัวข้อ | รายละเอียด |
|---|---|
| Function Name | ตรวจสอบร่างคำให้การแก้คำฟ้อง |
| Menu Name | เมนูข้าง: งานกฎหมายในทางคดี > ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง<br>Breadcrumb: หน้าแรก / คดีศาลปกครอง / ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง |
| Page | activity10/10-3-16-legal-director-review-answer.html |
| Page Code | L3-25 |
| ผู้ดำเนินการ | ผู้อำนวยการกองกฎหมาย (role: dir_legal) |

### Description
หน้าจอนี้ใช้สำหรับผู้อำนวยการกองกฎหมายตรวจสอบร่างคำให้การแก้คำฟ้องและร่างหนังสือนำส่งในลำดับถัดจากที่ผู้อำนวยการกลุ่มงานคดีตรวจสอบและเสนอมาแล้ว (LAW0108) ถือเป็นการตรวจสอบระดับที่สองก่อนส่งต่อให้ธุรการกองกฎหมายออกเลขหนังสือส่งภายใน

ผู้อำนวยการกองกฎหมายตรวจสอบข้อมูลคดี กำหนดเวลายื่นคำให้การ ร่างเอกสารที่นิติกรเสนอ และผลการตรวจของ ผอ.กลุ่มงานคดี (รายการที่ตรวจ ความเห็น ผู้ตรวจสอบ) ซึ่งเป็น Read-only ทั้งหมด จากนั้นระบุผลการตรวจแยกเป็น 2 รายการเช่นเดียวกับ LAW0108 คือผลการตรวจร่างคำให้การแก้คำฟ้อง และผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง โดยเลือกได้ระหว่าง "เห็นชอบ" (ส่งธุรการออกเลขหนังสือส่งภายใน) หรือ "ไม่เห็นชอบ" (ส่งกลับนิติกรแก้ไขร่าง) พร้อมกรอกความเห็นและเลือกเจ้าหน้าที่ธุรการกองกฎหมายที่จะส่งต่อ

เมื่อกดยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_ADMIN_ANSWER_INTERNAL_NO` และส่งรายการต่อไปยังเจ้าหน้าที่ธุรการกองกฎหมายเพื่อออกเลขหนังสือส่งภายใน (LAW0110 — อยู่ในความรับผิดชอบของ Sub-Agent 4)

### Condition

**เงื่อนไขการแสดง Object**

- การ์ด "รายละเอียดคดีศาลปกครอง" แสดงข้อมูลอ้างอิงคดี (Read-only)
- การ์ด "กำหนดเวลายื่นคำให้การ" แสดงกำหนดเวลาปัจจุบันและสรุปคำขอขยายเวลาที่ยื่นแล้ว
- การ์ด "ร่างเอกสารที่นิติกรเสนอ" แสดงร่างเอกสารและผู้เสนอร่างจาก LAW0107
- การ์ด "ผลการตรวจของ ผอ.กลุ่มงานคดี ตรวจสอบแล้ว" แสดงผลการตรวจของ ผอ.กลุ่มงานคดีจาก LAW0108
- การ์ด "ตรวจสอบร่างคำให้การแก้คำฟ้อง ผอ.กองกฎหมาย" เป็นส่วนบันทึกผลการตรวจและส่งต่อ มี state พิเศษ 'return-to-group-director' ที่ผูกกับ element `#card_answer_return` เมื่อเลือก "ไม่เห็นชอบ"

**1. เลขรับกองกฎหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_lawReceiveNo`
- ตัวอย่างค่า: —

**2. ชื่อหมาย**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_summonsName`
- ตัวอย่างค่า: —

**3. ศาล**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_courtName`
- ตัวอย่างค่า: —

**4. หมายเลขคดีดำ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_blackCaseNo`
- ตัวอย่างค่า: —

**5. ผู้ฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**6. ผู้ถูกฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**7. ครบกำหนดยื่นคำให้การ (ปัจจุบัน)**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**8. คำขอขยายเวลาที่ยื่นแล้ว**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_extensionSummary`
- ตัวอย่างค่า: —

**9. ร่างคำให้การแก้คำฟ้อง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**10. ร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง (อัยการ)**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**11. พยานหลักฐานและเอกสารประกอบ**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**12. นิติกรผู้เสนอร่าง**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**13. รายการที่ตรวจ**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_groupChecks` สรุปผลตรวจของ ผอ.กลุ่มงานคดีจาก LAW0108
- ตัวอย่างค่า: —

**14. ความเห็น ผอ.กลุ่มงานคดี**
- Required Field: False
- Input Type: Read-only
- Read Only: True
- Default: —
- เงื่อนไข: id `f_groupNotes`
- ตัวอย่างค่า: —

**15. ผู้ตรวจสอบ**
- Required Field: False
- Input Type: List
- Read Only: False
- Default: —
- เงื่อนไข: [ต้องยืนยันจาก Prototype]
- ตัวอย่างค่า: —

**16. ผลการตรวจร่างคำให้การแก้คำฟ้อง \***
- Required Field: True
- Input Type: Radio
- Read Only: False
- Default: checked
- เงื่อนไข: id `in_answer_approve` ตัวเลือก: "เห็นชอบ (ร่างถูกต้อง ส่งธุรการออกเลขหนังสือส่งภายใน)" / "ไม่เห็นชอบ (ส่งกลับนิติกรแก้ไขร่างคำให้การ)" การเลือก "ไม่เห็นชอบ" จะแสดง state 'return-to-group-director' (element #card_answer_return)
- ตัวอย่างค่า: —

**17. ผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง \***
- Required Field: True
- Input Type: Radio
- Read Only: False
- Default: checked
- เงื่อนไข: id `in_letter_approve` ตัวเลือก: "เห็นชอบ (ร่างถูกต้อง ส่งธุรการออกเลขหนังสือส่งภายใน)" / "ไม่เห็นชอบ (ส่งกลับนิติกรแก้ไขร่างหนังสือนำส่ง)"
- ตัวอย่างค่า: —

**18. ความเห็น ผอ.กองกฎหมาย \***
- Required Field: True
- Input Type: Textarea
- Read Only: False
- Default: —
- เงื่อนไข: id `in_reviewNotes` บังคับกรอก
- ตัวอย่างค่า: ระบุความเห็นหรือข้อสังเกตต่อร่าง (ถ้ามี)...

**19. ส่งต่อให้ (ธุรการกองกฎหมาย) \***
- Required Field: True
- Input Type: Dropdown
- Read Only: False
- Default: -- เลือกเจ้าหน้าที่ธุรการ --
- เงื่อนไข: id `in_forwardTo` บังคับเลือก
- ตัวอย่างค่า: —

### Process

1. ผู้อำนวยการกองกฎหมายเข้าสู่หน้าจอ "ผอ.กองกฎหมาย ตรวจร่างคำให้การ" (L3-25) หลังผู้อำนวยการกลุ่มงานคดีเสนอผลการตรวจ (LAW0108)
2. ตรวจสอบข้อมูลคดี กำหนดเวลายื่นคำให้การ ร่างเอกสารที่นิติกรเสนอ และผลการตรวจของ ผอ.กลุ่มงานคดี ซึ่งเป็น Read-only
3. เลือกผลการตรวจร่างคำให้การแก้คำฟ้อง ("เห็นชอบ" หรือ "ไม่เห็นชอบ")
4. เลือกผลการตรวจร่างหนังสือนำส่งถึงสำนักงานคดีปกครอง ("เห็นชอบ" หรือ "ไม่เห็นชอบ")
5. กรอกความเห็น ผอ.กองกฎหมาย (บังคับ)
6. เลือกเจ้าหน้าที่ธุรการกองกฎหมายที่จะส่งต่อ (บังคับ)
7. กดปุ่ม "ลงนาม ตรวจสอบ และ ส่งธุรการออกเลขส่งภายใน" เพื่อยืนยัน ระบบบันทึก statusCode เป็น `L3_PENDING_ADMIN_ANSWER_INTERNAL_NO` หรือกดปุ่ม "ยกเลิก" เพื่อยกเลิกการทำรายการ

**Flow ต่อเนื่อง:**
LAW0108 (ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ) → **LAW0109 (ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง)** → LAW0110 (ธุรการออกเลขหนังสือส่งภายใน — อยู่ในความรับผิดชอบของ Sub-Agent 4)

**Branch (กรณีไม่เห็นชอบ):**
LAW0109 (ผอ.กองกฎหมาย เลือก "ไม่เห็นชอบ" ในรายการใดรายการหนึ่ง) → ส่งกลับให้นิติกรกลุ่มงานคดีแก้ไขร่าง (ย้อนกลับไปยัง LAW0107) [ต้องยืนยันรูปแบบการดำเนินการจาก Prototype ว่าการส่งกลับเป็นการย้อนสถานะไปหน้าจอ L3-22 โดยตรงหรือผ่านการตรวจของ ผอ.กลุ่มงานคดีอีกครั้งหรือไม่]

---
