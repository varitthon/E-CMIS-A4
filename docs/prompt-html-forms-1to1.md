# PROMPT: แปลงแบบพิมพ์ราชการ ป.ป.ท. ทั้ง 20 ฉบับเป็น HTML 1:1

## ภารกิจ
สร้าง HTML ที่เหมือนกับแบบพิมพ์ราชการต้นฉบับมากที่สุดเท่าที่จะทำได้ (เป้าหมาย: เทียบข้างกันแล้วแทบแยกไม่ออก ทั้งตำแหน่งหัวข้อ ข้อความ ตาราง เส้นจุดช่องกรอก ขนาด/น้ำหนักตัวอักษร ระยะห่าง) ลงในระบบ E-CMIS กิจกรรมที่ 5 (ระบบกระบวนการไต่สวน ป.ป.ท.)

## แหล่งข้อมูลต้นฉบับ (อ่านทุกฉบับก่อนลงมือ)
โฟลเดอร์: `/Users/jetsadasomporn/Downloads/E-CMIS-แรงงาน/แบบพิมพ์ เอกสารที่กิจกรรมที่ 5 ใช้/`
ไฟล์ 20 ฉบับ (ชื่อตรงเป๊ะ):
1. `1. แบบแผนงานคดี.pdf` → แบบ ปปท. 1
2. `2. แบบขอขยายระยะเวลาไต่สวนเบื้องต้น.pdf` → แบบ ปปท. 2
3. `3. แบบขอขยายระยะเวลาไต่สวน.pdf` → แบบ ปปท. 3
4. `4. แบบรายงานผลการไต่สวนเบื้องต้น.pdf` → แบบ ปปท. 4
5. `5. แบบหนังสือแจ้งให้รับทราบข้อกล่าวหา.pdf` → แบบ ปปท. 5
6. `6. แบบบันทึกการแจ้งข้อกล่าวหา.pdf` → แบบ ปปท. 6
7. `7. แบบรายงานการไต่สวน.pdf` → แบบ ปปท. 7
8. `8 แบบหนังสือแจ้งให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการเพื่อฟ้องคดีต่อศาล.pdf` → แบบ ปปท. 8
9. `9 แบบหนังสือแจ้งผู้บังคับบัญชา กรณียังไม่พบพนักงานอัยการเพื่อฟ้องคดีต่อศาล.pdf` → แบบ ปปท. 9
10. `10 แบบหนังสือแจ้งพนักงานอัยการ.pdf` → แบบ ปปท. 10
11. `11 แบบคำร้องขอหมายจับ.pdf` → แบบ ปปท. 11
12. `12 แบบบันทึกคำเบิกความ.pdf` → แบบ ปปท. 12
13. `13 แบบรายงานกระบวนการพิจารณา.pdf` → แบบ ปปท. 13
14. `14 แบบหมายจับ(กรณีอายุความไม่สะดุดหยุดลง).pdf` → แบบ ปปท. 14
15. `15 แบบหมายจับ (กรณีอายุความสะดุดหยุดลง).pdf` → แบบ ปปท. 15
16. `16 แบบตำหนิรูปพรรณผู้กระทำความผิด.pdf` → แบบ ปปท. 16
17. `17 แบบหนังสือแจ้งผลกการดำเนินการว่าออกหมา.pdf` → แบบ ปปท. 17
18. `18 แบบหนังสือแจ้งผู้บัญชาการตำรวจแห่งชาติ.pdf` → แบบ ปปท. 18
19. `19 แบบบันทึกข้อความส่งหมายจับให้ กอท.pdf` → แบบ ปปท. 19
20. `20 แบบผนึกซองขอหมายจับ.pdf` → แบบ ปปท. 20

วิธีอ่าน: `pdftotext -layout "<ชื่อไฟล์>.pdf" /tmp/form.txt` เพื่อดูโครงสร้างข้อความ/ลำดับหัวข้อ แล้วเปิดภาพจริงดูตำแหน่ง (`pdftoppm -png -r 80 "<ไฟล์>" /tmp/pg`) เพื่อเทียบสัดส่วน หัวกระดาษ ตรา/ชื่อหน่วยงาน ขนาดฟอนต์หัวข้อ vs เนื้อหา ระยะจุดไข่ปลา จำนวนบรรทัดของตาราง

## ปลายทางโค้ด
ไฟล์: `/Users/jetsadasomporn/Downloads/E-CMIS-A4-Production/E-CMIS-A4/assets/activity5-workspace.js` (ไฟล์เดียวกับที่ render เอกสาร A5)
แก้/เขียนทับฟังก์ชันต่อไปนี้ (ห้ามเปลี่ยนชื่อฟังก์ชัน/ลายเซ็น — มีโค้ดอื่นเรียกใช้):
- `paperPlan(state)` → แบบ ปปท. 1
- `paperExt(state, reportType)` → แบบ ปปท. 2 ('213') / 3 ('644')
- `paper213(state)` → แบบ ปปท. 4
- `paperNoticeAccusation(state)` → แบบ ปปท. 5
- `paperRecordAccusation(state)` → แบบ ปปท. 6
- `paper644(state)` → แบบ ปปท. 7
- `paperProsecutorLetters(state)` → แบบ ปปท. 8 + 9 + 10 (คั่นด้วย `<div class="a5-pg"></div>`)
- `paperWarrants(state)` → แบบ ปปท. 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 (คั่นด้วย a5-pg)
- `paperMti(state, which)` → แบบมติ คกก. (คงโครงสร้างเดิม ปรับให้ตรงฟอร์ม)
- `paperSpecial58(state)` → แบบตรวจสอบข้อเท็จจริง 58/2 (คงโครงสร้างเดิม ปรับให้ตรงฟอร์ม)

## ข้อกำหนดทางเทคนิค (ห้ามเบี่ยงเบน)
1. **HTML ล้วนเท่านั้น** — ห้ามใช้รูปภาพพื้นหลัง (ห้าม background-image), ห้าม canvas, ห้าม SVG ขนาดใหญ่ ใช้ HTML/CSS ล้วน
2. ฟังก์ชันต้อง `return \`<section class="a5-paper">...</section>\``
3. **Helpers ที่มีให้ใช้แล้ว** (ห้ามสร้างใหม่ซ้ำ):
   - `a5F(v, w)` → ช่องกรอก: `<span class="a5-fill" style="min-width:Npx">value</span>` (w = ความกว้าง px)
   - `a5Hdr(title, code)` → หัวกระดาษราชการ (สำนักงาน ป.ป.ท. + ชื่อแบบ + รหัสแบบ)
   - `a5Sign(name, role)` → กล่องลายเซ็น (มี class a5-lock กันแก้ไข — ห้ามแก้)
   - `escapeHtml(v)`, `a5DateShort(isoDate)`, `a5AccusedLine(state)`, `todayISO()`, `addDays(iso, n)`
   - `A5_FORMS.plan.code` เป็นต้น (รหัสแบบ เช่น 'แบบ ปปท. 1')
   - `MTI_213_RESULTS`, `MTI_644_RESULTS` (อาร์เรย์ตัวเลือกมติ)
4. **CSS classes ที่มีแล้ว** (ใน `assets/ecmis-workspace.css` — ห้ามแก้ CSS เว้นจำเป็นจริง):
   `.a5-paper` (A4 794px, font 13px, padding 58px), `.a5-hdr/.a5-hdr-org/.a5-hdr-title/.a5-hdr-code`, `.a5-line` (แถวข้อความ flex), `.a5-fill`, `.a5-tbl` (ตารางมีเส้นขอบ), `.a5-num`, `.a5-indent/.a5-indent2`, `.a5-sign/.a5-sign-name/.a5-sign-note`, `.a5-lock`, `.a5-pg` (ตัดหน้า), `.a5-box`, `.a5-dots`, `.a5-center`, `.a5-right`
5. **เลขไทย**: ข้อความหัวข้อ/เลขข้อ ใช้เลขไทย (๑๒๓๔๕๖๗๘๙๐) ตามต้นฉบับ (เช่น "ข้อ ๑", "มาตรา ๓๘ วรรคสอง") — แต่ข้อมูลคดี (วันที่/จำนวน) ใช้เลขอารบิกจาก state ตรงๆ
6. **โครงสร้างตามต้นฉบับ 1:1**:
   - หัวกระดาษ: ตรา/ชื่อหน่วยงาน (ถ้าใน PDF มี) → ชื่อแบบ (กลาง, ตัวหนา, ใหญ่กว่าปกติ) → รหัสแบบ
   - เรียงหัวข้อ/ข้อความ/ตาราง/ช่องกรอก ตามลำดับและตำแหน่งเดียวกับ PDF (ใช้ pdftotext -layout เทียบ)
   - จุดไข่ปลาช่องกรอก: ใช้ `a5F()` (มีเส้นใต้จุดอยู่แล้ว)
   - ตาราง: เส้นขอบทุกเซลล์ `.a5-tbl`, หัวตารางพื้นสีจาง `.a5-tbl th`, จำนวนคอลัมน์/แถวตาม PDF
   - หน้าหลายหน้า: คั่นด้วย `<div class="a5-pg"></div>` ให้เนื้อหาตรงหน้าเดียวกับ PDF (เทียบจาก pdftotext ที่มี \f คั่นหน้า)
7. **ฟอนต์**: ขนาดตัวอักษรหัวข้อ ≈ 16-17px ตัวหนา, เนื้อหา 13px, เชิงอรรถ/หมายเหตุ 11px — ไล่ระดับตามต้นฉบับ
8. **ห้ามคำว่า "กิจกรรม"** ในข้อความ UI ทั้งหมด (เช่น ห้าม "กิจกรรมที่ 5") — ใช้ "ระบบกระบวนการไต่สวน" แทน
9. ข้อมูลทุกอย่างที่มาจากคดีต้องอยู่ใน `a5F()` (ผู้ใช้แก้ไขได้) — ข้อความตายตัว (หัวข้อ/คำอธิบาย) เป็น plain text
10. ถ้าข้อมูล field ไหนว่าง ให้ `a5F('')` (เว้นช่องว่าง) ไม่ใช่ตัดทิ้ง

## โครงสร้างข้อมูล state (field ที่ใช้ได้ — อ่านจากตัวแปรที่ destructure ในฟังก์ชันเดิม)
```
state.caseData: { id, subject, complainant, agency, region, received, decision, trackingYear, trackingCode }
state.documentData: { documentSubject, dispatchLetterNo, dispatchSendMethod, dispatchEms }
state.workflow: { stage, status, owner }
state.inquiry.intake: { unit, director, investigator, team[], orderNo, orderDate, receivedFirstAt, m62: {flag, sourceLetter, sourceMtiDate, ageCheck} }
state.inquiry.prelim: { plan, workLog, issues: {status, statusDocs, statusTodo, authority, authorityDocs, authorityTodo, action, actionDocs, actionTodo, damage, damageDocs, damageTodo}, witnesses[], report, place, deadlineAt, submittedAt, limitation: {shortSection, shortYears, shortExpiry, longSection, longYears, longExpiry}, reviewChain[], extensionHistory[], lateReport }
state.inquiry.inquiry644: { accused[], allegations, witnesses[], statements, summary, investigator, submittedAt, reviewChain[], extensionHistory[], lateReport }
state.inquiry.committee213: { orderNo, orderDate, result, mtiNo, mtiDate, note, decidedBy }
state.inquiry.committee644: { result, mtiNo, mtiDate, note, decidedBy }
state.inquiry.outcome: { letters, prosecutor, disciplineAgency, followup, warrant: {court, warrantNo, status, note} }
```
ตัวช่วย: `a5DateShort('2026-08-01')` → '1 ส.ค. 2569'; `a5AccusedLine(state)` → 'นางประภา ใจดี'; `addDays(date, 60)`

## วิธีเปิดดูผลงาน (ต้องทำได้จริงก่อนส่งงาน)
- รันเซิร์ฟเวอร์: `cd /Users/jetsadasomporn/Downloads/E-CMIS-A4-Production/E-CMIS-A4 && python3 -m http.server 8765` (รันพื้นหลัง)
- เปิดในเบราว์เซอร์: `http://localhost:8765/staff-workflow.html?view=a5&role=investigator` — เลือกคดีในรายการ → หน้า detail → แถบเอกสารขวา (แผนงานคดี / รายงาน 213 / 644 / หมายจับ ฯลฯ) — เอกสารแต่ละแบบจะโผล่ในแท็บตาม stage ของคดี
- **บังคับ**: หลังแก้ `assets/activity5-workspace.js` หรือ `assets/ecmis-workspace.css` ต้อง bump cache-buster ในไฟล์ HTML ทั้งหมด: แทนที่ `v=20260808g` → `v=20260808h` ใน `staff-workflow.html`, `staff-intake.html`, `complaint-form.html` (หา/แทนทุกจุด) — ไม่งั้นเบราว์เซอร์ cache ตัวเก่า ผู้ใช้จะไม่เห็นการแก้
- ตรวจผลด้วยตา: เปิดคดี → สลับแท็บเอกสาร → เทียบกับ PDF ต้นฉบับ (เปิด PDF ข้างๆ)

## เส้นทางการแสดงผล (ทำความเข้าใจก่อนแก้)
`docTabsA5(state)` สร้างปุ่มแท็บ → คลิกแท็บ → `paperForTab(state, tab)` เลือกฟังก์ชันตาม tab:
- tab `plan` → paperPlan (แบบ 1) · `ext213` → paperExt(state,'213') · `ext644` → paperExt(state,'644') · `213` → paper213 · `644` → paper644 · `notice` → paperNoticeAccusation · `record` → paperRecordAccusation · `letters` → paperProsecutorLetters (แบบ 8+9+10) · `warrants` → paperWarrants (แบบ 11-20) · `mti` → paperMti · `letter` → หนังสือส่งสำนวน · `special` (decision=58/2) → paperSpecial58
ผลลัพธ์ไปใส่ที่ `#a5PaperStage` ในแผงเอกสารขวา — ห้ามแก้ `paperForTab`/`docTabsA5` เว้นจำเป็นจริง (แล้วบอกไว้ใน comment)

## ข้อกำหนด Word Engine (เอกสารต้องแก้ไขได้)
- ช่องข้อมูล = `a5F()` → class `a5-fill` — ระบบจะทำให้แก้ไขได้เองในโหมดแก้ไข (ปุ่ม ✏️) + บันทึกเข้าคดี — ห้ามเปลี่ยน class/โครงสร้างของ a5-fill
- ลายเซ็น = `a5Sign()` → class `a5-lock` — ระบบกันแก้ไขอัตโนมัติ — ห้ามลบ a5-lock
- format bar (ฟอนต์/ขนาด/สี/จัดตำแหน่ง) ทำงานอัตโนมัติบนเอกสาร HTML — ไม่ต้องเขียนโค้ดเพิ่ม

## กติกา git และขอบเขต (ห้ามเกิน)
- งานนี้อยู่ใน repo: `/Users/jetsadasomporn/Downloads/E-CMIS-A4-Production/E-CMIS-A4` (branch `Mock-up-2`)
- **ห้าม commit** — ห้าม `git commit`/`git add`/`git merge`/`git checkout`/`git reset` ทุกกรณี — ทำแค่แก้ไฟล์แล้วทิ้งงานไว้ (uncommitted) ให้เจ้าของ repo เป็นคน commit เอง — งานของคนอื่นในโฟลเดอร์ก็ห้าม commit ด้วย
- **ห้ามแตะ/แก้** (มีงานค้างของคนอื่น): ไฟล์ HTML 3 ตัวนอกจาก cache-buster, assets/activity4-workspace.js, assets/ecmis-sidebar.js, assets/ecmis-sidebar.css, โค้ดส่วน state engine/editors/actions/EXTENSION_RULES/journeyStages/A5_MENU/search/Word Engine binder ใน activity5-workspace.js, A5_REAL_IMAGES/paperReal (เก็บไว้เฉยๆ ไม่ใช้)

## ขั้นตอนการทำงาน
1. อ่าน PDF ทุกฉบับ (pdftotext -layout) + ดูภาพเทียบสัดส่วน — จดโครงสร้างแต่ละฉบับ (หน้า/หัวข้อ/ตาราง/ช่อง)
2. เปิดไฟล์ `assets/activity5-workspace.js` ดูฟังก์ชันเดิม + helpers ที่มี (a5F/a5Hdr/a5Sign) — เขียนตาม pattern เดิม
3. เขียน HTML ทีละฉบับ ตรวจเทียบกับ pdftotext ว่าหัวข้อครบ/ลำดับถูก/ข้อความตรง
4. ตรวจ: `node --check assets/activity5-workspace.js`
5. Smoke: render ครบทุกแท็บ ผ่าน node (DOM stub แบบเดียวกับ tests/activity5-forms-flow.test.mjs) — ดูตัวอย่าง test ที่มีอยู่แล้วก่อน
6. รัน test เดิมทั้งหมด: `node tests/activity5-forms-flow.test.mjs`, `node tests/activity5-sidebar-menu.test.mjs`, `node activity5/tests/state.test.mjs`, `node activity5/tests/ui-copy.test.mjs`, `node tests/checklist-0*.test.mjs` — ต้องผ่านหมด (ถ้า test เก่า assert ของเก่า ให้อัปเดตให้ตรง HTML ใหม่)
7. ตรวจซ้ำ 2 รอบ: ไล่ทุกแบบว่าหัวข้อ/ตาราง/ช่องกรอกครบ เทียบ PDF

## เกณฑ์คุณภาพ (ผ่านเมื่อครบ)
- ทุกฟังก์ชันคืน HTML ล้วน ไม่มี a5r-page/a5r-slot/ภาพ
- หัวข้อ/ข้อความ/ตาราง เรียงตรงตาม PDF ทุกฉบับ (เทียบ pdftotext -layout)
- ข้อมูลคดีลงช่องถูกต้อง (เลข/ชื่อ/วันที่/ความเห็น/มติ)
- ช่องกรอกทุกช่องเป็น a5-fill แก้ไขได้; ลายเซ็นเป็น a5-lock
- เลขไทยในข้อความตายตัว, เลขอารบิกในข้อมูล
- node --check ผ่าน + test ทั้งหมดผ่าน
- ไม่มีคำว่า "กิจกรรม" ใน UI
