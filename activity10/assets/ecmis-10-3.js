/**
 * E-CMIS กิจกรรมที่ 10.3 — คดีศาลปกครอง (Part 1: รับคำฟ้อง - สรุปความเห็นเสนอบอร์ด)
 * Shared runtime for the 10-3-*.html step pages, mirroring the pattern used by
 * ecmis-10-2.js (STEPS table, signature modal, stepper/sidebar helpers) instead
 * of copy-pasting per page the way the 10.1 pages do it.
 *
 * Covers LAW0085-LAW0096 of the AS-IS swimlane (see
 * docs/10.3 mockup/flow-page-01.md and
 * docs/10.3 mockup/implementation-plan-part1.md). Case intake for 10.3 happens
 * on the shared 02-board-intake.html (category "10.3"), which writes the first
 * L3_PENDING_DIRECTOR_ASSIGN status — everything after that lives here.
 *
 * Depends on: ecmis-app.js (ECMIS.ROLES), ecmis-activity10.js (Activity10 store),
 * SweetAlert2, Bootstrap 5 CSS (signature modal layout only).
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ FLOW
     One entry per step. `status`/`statusCode` are what THIS step writes onto
     the case once its page submits — so 01-work-inbox.html and the next
     page's Activity103.getCase() know who acts on it next. */
  const STEPS = [
    {
      code: "LAW0085",
      seq: 1,
      page: "02-board-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย",
      statusCode: "L3_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการกองกฎหมาย รับเรื่องและเสนอ ผอ.กองกฎหมาย",
      stepName: "ธุรการ รับเรื่อง",
    },
    {
      code: "LAW0088",
      seq: 2,
      page: "10-3-02-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกร",
      statusCode: "L3_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย ลงนามมอบหมาย",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      code: "LAW0089",
      seq: 3,
      page: "10-3-03-group-director-assign.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรตรวจสอบคำฟ้อง",
      statusCode: "L3_PENDING_LAWYER_REVIEW",
      label: "ผอ.กลุ่มงาน มอบหมายนิติกรผู้รับผิดชอบ",
      stepName: "ผอ.กลุ่มงาน มอบหมายนิติกร",
    },
    {
      /* รวม LAW0090 (ตรวจสอบคำฟ้อง) + LAW0092 (จัดทำบันทึกความเห็น) เป็นหน้าเดียว —
         ตัดขั้น LAW0091 (ธุรการประสานนักสืบ) ออก เพราะนิติกรค้นหาสำนวนไต่สวนเดิม
         จากระบบได้เองโดยตรง ไม่ต้องรอธุรการประสานให้ */
      code: "LAW0090",
      seq: 4,
      page: "10-3-04-lawyer-review-complaint.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ",
      statusCode: "L3_PENDING_GROUP_APPROVE",
      label: "นิติกร ตรวจสอบคำฟ้องและจัดทำบันทึกความเห็น",
      stepName: "นิติกร ตรวจสอบ/จัดทำความเห็น",
    },
    {
      code: "LAW0093",
      seq: 5,
      page: "10-3-07-group-director-approve.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายลงนามผ่านเรื่อง",
      statusCode: "L3_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงาน พิจารณาและเห็นชอบ",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ",
    },
    {
      code: "LAW0094",
      seq: 6,
      page: "10-3-08-legal-director-sign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการออกเลขส่งและเสนอบอร์ด",
      statusCode: "L3_PENDING_ADMIN_DISPATCH",
      label: "ผอ.กองกฎหมาย ตรวจสอบและลงนามผ่านเรื่อง",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0095",
      seq: 7,
      page: "10-3-09-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "รอเสนอบอร์ด",
      statusCode: "L3_READY_FOR_BOARD",
      label: "ธุรการ ออกเลขส่งภายในและส่งมติเสนอบอร์ด",
      stepName: "ธุรการ ออกเลขส่ง/เสนอบอร์ด",
    },
  ];

  /* ------------------------------------------------------------- PART 1B
     สาขาคู่ขนาน (ไม่ตัดสายหลัก) — เกิดจากติ๊ก checkbox "มีคำขอทุเลาการบังคับคดี"
     ที่ 10-3-04 แล้วสร้างเคสลูกแยกต่างหาก (ดู docs/10.3 mockup/implementation-plan-part1b.md)
     ใช้ statusCode เป็นของตัวเอง (คำนำหน้า L3B_) เพื่อไม่ให้ชนกับสถานะของเคสแม่ */
  const STAY_STEPS = [
    {
      code: "LAW0097",
      seq: 1,
      page: "10-3b-01-lawyer-draft-stay-objection.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ธุรการลงนามคำชี้แจงคัดค้าน",
      statusCode: "L3B_PENDING_ADMIN_SIGN",
      label: "นิติกร จัดทำคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี",
      stepName: "นิติกร จัดทำคำชี้แจงคัดค้าน",
    },
    {
      code: "LAW0098",
      seq: 2,
      page: "10-3b-02-legal-admin-sign-stay-objection.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรส่งคำชี้แจงต่อศาล",
      statusCode: "L3B_PENDING_LAWYER_DISPATCH",
      label: "ธุรการ ลงนามคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี",
      stepName: "ธุรการ ลงนาม",
    },
    {
      code: "LAW0099",
      seq: 3,
      page: "10-3b-03-lawyer-dispatch-stay-objection.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ส่งคำชี้แจงคัดค้านต่อศาลแล้ว",
      statusCode: "L3B_CLOSED",
      label: "นิติกร ส่งคำชี้แจงคัดค้านต่อศาลปกครอง",
      stepName: "นิติกร ส่งคำชี้แจง",
    },
  ];

  /* ---------------------------------------------------------- PART 5–6
     รับคำพิพากษาศาลปกครองชั้นต้น → วิเคราะห์ผล/กำหนดแนวทาง (LAW0119–LAW0128)
     เป็นเคสใหม่แยกจากเคสรับคำฟ้อง (l3CaseType = "verdict") เดินสถานะ L3V_* ของตัวเอง
     เริ่มที่ 10-3v-00 (LAW0119+LAW0120 รวมหน้าเดียว) ดู
     docs/10.3 mockup/implementation-plan-part5-6.md
     ขั้นที่ยังไม่มีหน้าจริง (10-3v-02 เป็นต้นไป) route ชี้ไปหน้าที่ยังไม่สร้าง */
  const VERDICT_STEPS = [
    {
      /* รวม LAW0119 (รับหนังสือแจ้งผลคำพิพากษา) + LAW0120 (ลงทะเบียนคดีปกครอง)
         เป็นหน้าเดียว — ธุรการกองกฎหมายทำทั้งสองขั้นในการ์ดเดียวแล้วส่งตรงถึง
         ผอ.กองกฎหมาย ไม่ต้องมีสถานะ "รอลงทะเบียน" คั่นกลาง (เหมือนที่ Part 1
         รวม LAW0090+LAW0092 เป็น 10-3-04) สร้างเคสใหม่ตรง ๆ ด้วย Activity10.addCase()
         เป็นจุดเริ่มของสาย L3V_* (ไม่มี route ชี้เข้ามาหาไฟล์นี้เอง เหมือน
         LAW0085/02-board-intake.html) */
      code: "LAW0119",
      seq: 0,
      page: "10-3v-00-legal-admin-verdict-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย (คำพิพากษา)",
      statusCode: "L3V_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการ รับหนังสือแจ้งผลคำพิพากษาและลงทะเบียนคดีปกครอง",
      stepName: "ธุรการ รับเรื่อง/ลงทะเบียน",
    },
    {
      code: "LAW0121",
      seq: 1,
      page: "10-3v-02-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกร (คำพิพากษา)",
      statusCode: "L3V_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำพิพากษา)",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      code: "LAW0122",
      seq: 2,
      page: "10-3v-03-group-director-assign.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรวิเคราะห์ผลคำพิพากษา",
      statusCode: "L3V_PENDING_LAWYER_ANALYSIS",
      label: "ผอ.กลุ่มงาน มอบหมายนิติกร (คำพิพากษา)",
      stepName: "ผอ.กลุ่มงาน มอบหมายนิติกร",
    },
    {
      code: "LAW0123",
      seq: 3,
      page: "10-3v-04-lawyer-verdict-analysis.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ (คำพิพากษา)",
      statusCode: "L3V_PENDING_GROUP_APPROVE",
      label: "นิติกร ตรวจ/วิเคราะห์ผลคำพิพากษา",
      stepName: "นิติกร วิเคราะห์ผลคำพิพากษา",
    },
    {
      code: "LAW0126",
      seq: 4,
      page: "10-3v-05-group-director-approve.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายกำหนดแนวทาง (คำพิพากษา)",
      statusCode: "L3V_PENDING_DIRECTOR_DECIDE",
      label: "ผอ.กลุ่มงาน พิจารณาและเห็นชอบ (คำพิพากษา)",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ",
    },
    {
      /* สถานะที่เขียนจริงมาจาก VERDICT_BRANCHES ตามทางที่ ผอ.กองเลือก — ค่านี้เป็นแค่ค่าตั้งต้น */
      code: "LAW0127",
      seq: 5,
      page: "10-3v-06-legal-director-decide.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "กำหนดแนวทางดำเนินการแล้ว",
      statusCode: "L3V_DECIDED",
      label: "ผอ.กองกฎหมาย กำหนดแนวทางดำเนินการ (คำพิพากษา)",
      stepName: "ผอ.กองกฎหมาย กำหนดแนวทาง",
    },
    {
      /* ทางเข้าจาก Part 6c เท่านั้น (ชนะคดี ผู้ฟ้องคดีไม่ยื่นอุทธรณ์) — entry status
         คือ L3V_TO_CLOSE ที่เขียนโดย VERDICT_BRANCHES.CLOSE ไม่ใช่ statusCode ของ
         ขั้นก่อนหน้าใน array นี้ จึงต้องเพิ่ม ROUTES["L3V_TO_CLOSE"] ด้วยมือด้านล่าง
         (reduce อัตโนมัติจะไม่สร้าง route เข้าขั้นนี้ให้) เป็น terminal ไม่มีขั้นต่อ */
      code: "LAW0163",
      seq: 6,
      page: "10-3v-07-lawyer-close-case.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ปิดสำนวนคดีแล้ว",
      statusCode: "L3V_CLOSED",
      label: "นิติกร ดำเนินการตามคำพิพากษา/ปิดสำนวน",
      stepName: "นิติกร ปิดสำนวน",
    },
  ];

  /* LAW0128 — 3 ทางหลัง ผอ.กองกฎหมายกำหนดแนวทาง (ทุกทางเป็น black box ไปกิจกรรมอื่น) */
  const VERDICT_BRANCHES = {
    APPEAL_REPLY: {
      label: "ชนะคดี (ผู้ฟ้องคดียื่นอุทธรณ์)",
      resultLabel: "ชนะคดี",
      appealNote: "ผู้ฟ้องคดียื่นอุทธรณ์",
      proposal: "จัดทำคำแก้อุทธรณ์",
      status: "รอจัดทำคำแก้อุทธรณ์",
      statusCode: "L3V_TO_APPEAL_REPLY",
    },
    APPEAL_CONSIDER: {
      label: "แพ้คดี",
      resultLabel: "แพ้คดี",
      appealNote: null,
      proposal: "พิจารณาความเห็นควรอุทธรณ์",
      status: "รอพิจารณาความเห็นควรอุทธรณ์",
      statusCode: "L3V_TO_APPEAL_CONSIDER",
    },
    CLOSE: {
      label: "ชนะคดี (ผู้ฟ้องคดีไม่ยื่นอุทธรณ์)",
      resultLabel: "ชนะคดี",
      appealNote: "ผู้ฟ้องคดีไม่ยื่นอุทธรณ์",
      proposal: "ยุติ/ปิดสำนวน",
      status: "รอปิดสำนวน (LAW0163)",
      statusCode: "L3V_TO_CLOSE",
    },
  };

  /* ---------------------------------------------------------------- PART 7
     จัดทำคำแก้อุทธรณ์ (LAW0129–0141) — เดินต่อบนเคสคำพิพากษาเดิม (ไม่สร้างเคส
     ใหม่) เข้าที่ L3V_TO_APPEAL_REPLY จาก 10-3v-06 (ชนะคดี ผู้ฟ้องคดียื่นอุทธรณ์)
     ใช้คำนำหน้า L7_ แยกจาก L3V_ ดู docs/10.3 mockup/implementation-plan-part7.md
     รวม assign loop ที่ซ้ำในผัง AS-IS เหลือรอบเดียว + ย้าย LAW0133 (ลงทะเบียนคดี)
     เข้าไปอยู่ในหน้านิติกร — ตอนนี้ implement เฉพาะ LAW0131+0132 (10-3v-08) ก่อน */
  const APPEAL_STEPS = [
    {
      code: "LAW0131",
      seq: 0,
      page: "10-3v-08-legal-admin-appeal-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย (คำแก้อุทธรณ์)",
      statusCode: "L7_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการ รับหนังสือแจ้งคำสั่งศาลให้ทำคำแก้อุทธรณ์",
      stepName: "ธุรการ รับหนังสือ",
    },
    {
      code: "LAW0135",
      seq: 1,
      page: "10-3v-09-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกร (คำแก้อุทธรณ์)",
      statusCode: "L7_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำแก้อุทธรณ์)",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      /* (เพิ่ม) ในผัง AS-IS — ไม่มีเลข LAW ของตัวเอง ใช้รหัสภายใน "L7ASSIGN" */
      code: "L7ASSIGN",
      seq: 2,
      page: "10-3v-10-group-director-assign.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรร่างคำแก้อุทธรณ์",
      statusCode: "L7_PENDING_LAWYER_DRAFT",
      label: "ผอ.กลุ่มงาน มอบหมายนิติกร (คำแก้อุทธรณ์)",
      stepName: "ผอ.กลุ่มงาน มอบหมายนิติกร",
    },
    {
      code: "LAW0133",
      seq: 3,
      page: "10-3v-11-lawyer-draft-appeal-reply.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานตรวจร่างคำแก้อุทธรณ์",
      statusCode: "L7_PENDING_GROUP_APPROVE",
      label: "นิติกร ลงทะเบียนคดี/ตรวจสอบ/ร่างคำแก้อุทธรณ์",
      stepName: "นิติกร ร่างคำแก้อุทธรณ์",
    },
    {
      /* รวม LAW0134 (ตรวจร่าง) + LAW0138 (เห็นชอบ) เป็นหน้าเดียว — ยืนยันแบบ
         confirm ธรรมดา (ไม่มีลายเซ็น) เหมือน 10-3v-05/10-3-07 */
      code: "LAW0134",
      seq: 4,
      page: "10-3v-12-group-director-approve.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายพิจารณาและลงนาม (คำแก้อุทธรณ์)",
      statusCode: "L7_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงาน ตรวจร่างคำแก้อุทธรณ์และเห็นชอบ",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ",
    },
    {
      code: "LAW0139",
      seq: 5,
      page: "10-3v-13-legal-director-sign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการออกเลขส่งคำแก้อุทธรณ์",
      statusCode: "L7_PENDING_ADMIN_DISPATCH",
      label: "ผอ.กองกฎหมาย พิจารณาและลงนามในคำแก้อุทธรณ์",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0140",
      seq: 6,
      page: "10-3v-14-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรส่งคำแก้อุทธรณ์ไปสำนักงานคดีปกครอง",
      statusCode: "L7_PENDING_LAWYER_SEND",
      label: "ธุรการ ออกเลขหนังสือส่งภายนอก",
      stepName: "ธุรการ ออกเลขส่ง",
    },
    {
      /* ทางออกเป็น black box ไปกิจกรรมอื่น (Page 10/LAW0161) — เป็น terminal
         ไม่มี route ต่อจากสถานะนี้ ดู implementation-plan-part7.md (open item #4) */
      code: "LAW0141",
      seq: 7,
      page: "10-3v-15-lawyer-send-appeal-reply.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ส่งคำแก้อุทธรณ์ไปสำนักงานคดีปกครองแล้ว",
      statusCode: "L7_SENT_TO_PROSECUTOR",
      label: "นิติกร ส่งหนังสือและคำแก้อุทธรณ์ไปสำนักงานคดีปกครอง",
      stepName: "นิติกร ส่งหนังสือ",
    },
  ];

  /* ------------------------------------------------------------- PART 8
     พิจารณาความเห็นควรอุทธรณ์ (LAW0142–0148) — เดินต่อบนเคสคำพิพากษาเดิม
     (ไม่สร้างเคสใหม่) เข้าที่ L3V_TO_APPEAL_CONSIDER จาก 10-3v-06 (แพ้คดี)
     ใช้คำนำหน้า L8_ แยกจาก L3V_/L7_ ดู
     docs/10.3 mockup/implementation-plan-part8.md — เก็บ assign loop ตามผัง
     AS-IS ตรงๆ (ไม่ตัดรอบซ้ำเหมือน Part 7) ตอนนี้ implement เฉพาะ
     LAW0143+0144 (10-3v-16) และรอบมอบหมายที่ 1 ฝั่ง ผอ.กองกฎหมาย (10-3v-17) ก่อน */
  const APPEAL_CONSIDER_STEPS = [
    {
      code: "LAW0143",
      seq: 0,
      page: "10-3v-16-legal-admin-appeal-consider-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย (ความเห็นควรอุทธรณ์)",
      statusCode: "L8_PENDING_DIRECTOR_ASSIGN1",
      label: "ธุรการ รับหนังสือแจ้งผลคำพิพากษาเพื่อพิจารณาอุทธรณ์",
      stepName: "ธุรการ รับหนังสือ",
    },
    {
      /* (เพิ่ม) ในผัง AS-IS — ไม่มีเลข LAW ของตัวเอง ใช้รหัสภายใน "L8ASSIGN1" */
      code: "L8ASSIGN1",
      seq: 1,
      page: "10-3v-17-legal-director-assign1.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกรลงทะเบียน",
      statusCode: "L8_PENDING_GROUP_ASSIGN1",
      label: "ผอ.กองกฎหมาย มอบหมาย ผอ.กลุ่มงานคดี (ลงทะเบียนคดี)",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      /* (เพิ่ม) ในผัง AS-IS — ไม่มีเลข LAW ของตัวเอง ใช้รหัสภายใน "L8GROUPASSIGN1" */
      code: "L8GROUPASSIGN1",
      seq: 2,
      page: "10-3v-18-group-director-assign1.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรลงทะเบียนคดีปกครอง",
      statusCode: "L8_PENDING_LAWYER_REGISTER",
      label: "ผอ.กลุ่มงาน มอบหมายนิติกร (ลงทะเบียนคดี)",
      stepName: "ผอ.กลุ่มงาน มอบหมาย",
    },
    {
      /* รวม LAW0145 (ลงทะเบียน) + LAW0148 (ตรวจสอบคำพิพากษา) + decision
         (เห็นควรอุทธรณ์หรือไม่) เป็นหน้าเดียว — ผู้ใช้ยืนยันให้ตัดรอบมอบหมายที่ 2
         ออก (ไม่ต้องมอบหมายซ้ำเพื่อไปตรวจสอบคำพิพากษาอีกรอบ) เหมือนที่ Part 7
         รวม LAW0133+0136+0137 เข้าหน้าเดียวกัน */
      code: "LAW0145",
      seq: 3,
      page: "10-3v-19-lawyer-register.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบการลงทะเบียน",
      statusCode: "L8_PENDING_GROUP_APPROVE1",
      label: "นิติกร ลงทะเบียนคดี/ตรวจสอบคำพิพากษา/เสนอความเห็นควรอุทธรณ์",
      stepName: "นิติกร ลงทะเบียน/เสนอความเห็น",
    },
    {
      /* สถานะที่เขียนจริงมาจาก APPEAL_CONSIDER_BRANCHES ตามที่ ผอ.กลุ่มงานเลือก —
         ค่านี้เป็นแค่ค่าตั้งต้น (เหมือน VERDICT_STEPS LAW0127/10-3v-06) */
      code: "LAW0146",
      seq: 4,
      page: "10-3v-20-group-director-approve1.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "พิจารณาความเห็นควรอุทธรณ์แล้ว",
      statusCode: "L8_DECIDED",
      label: "ผอ.กลุ่มงาน พิจารณาและยืนยันความเห็นควรอุทธรณ์",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ/ยืนยัน",
    },
  ];

  /* LAW0148 (decision) — 2 ทางหลัง ผอ.กลุ่มงานยืนยันความเห็น (ทั้งคู่เป็น
     black box ไปกิจกรรมอื่น — กิจกรรมที่ 9/10 ยังไม่ implement) */
  const APPEAL_CONSIDER_BRANCHES = {
    APPEAL: {
      label: "นิติกรเห็นควรอุทธรณ์",
      proposal: "จัดทำคำอุทธรณ์",
      status: "รอจัดทำคำอุทธรณ์",
      statusCode: "L8_TO_APPEAL_DRAFT",
    },
    BOARD: {
      label: "นิติกรเห็นควรไม่อุทธรณ์",
      proposal: "เสนอมติต่อบอร์ด",
      status: "รอเสนอมติอุทธรณ์ต่อบอร์ด",
      statusCode: "L8_TO_BOARD_PROPOSE",
    },
  };

  /* --------------------------------------------------------- PART 10a
     ดำเนินการอุทธรณ์ (LAW0157-0160) — เดินต่อบนเคสคำพิพากษาเดิม เข้าที่
     L8_TO_APPEAL_DRAFT จาก 10-3v-20 (ผอ.กลุ่มงานยืนยัน "เห็นควรอุทธรณ์")
     ใช้คำนำหน้า L10_ แยกจาก L8_/L7_/L3V_ — ผังจริงมี LAW0161-0163 ต่อ (ยื่นศาล/
     พิพากษา/ปิดสำนวน) ที่ยังไม่ implement (เป็นฝั่งอัยการ/ศาล ไม่ใช่ขั้นตอน
     ภายในกองกฎหมาย) ดู flow-page-10.md

     LAW0156 (นิติกร ร่างคำอุทธรณ์) "ตัด" ออกจากที่นี่แล้ว — ไม่ใช่เพราะยังไม่
     implement แต่เพราะซ้ำกับ 10-3v-19 (LAW0145) ที่ให้นิติกรแนบร่างคำอุทธรณ์
     ไปพร้อมกับตอนสรุปความเห็นควรอุทธรณ์อยู่แล้ว (ช่อง "แนบคำอุทธรณ์" เปลี่ยน
     label ตามสาขาที่เลือกไว้ที่ 10-3v-19) จึงให้ L8_TO_APPEAL_DRAFT ข้ามตรงไป
     LAW0157 (10-3v-22) เลย ไม่ผ่านหน้าร่างซ้ำอีกรอบ */
  const APPEAL_DRAFT_STEPS = [
    {
      code: "LAW0157",
      seq: 0,
      page: "10-3v-22-group-director-review-appeal.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายพิจารณาและลงนามคำอุทธรณ์",
      statusCode: "L10_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์",
      stepName: "ผอ.กลุ่มงาน ตรวจร่าง",
    },
    {
      code: "LAW0158",
      seq: 1,
      page: "10-3v-23-legal-director-sign-appeal.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขหนังสือส่งภายนอก",
      statusCode: "L10_PENDING_DOC_NO",
      label: "ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0159",
      seq: 2,
      page: "10-3v-24-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรจัดส่งหนังสือและคำอุทธรณ์ทางไปรษณีย์",
      statusCode: "L10_PENDING_LAWYER_SEND",
      label: "ธุรการ ออกเลขหนังสือส่งภายนอก",
      stepName: "ธุรการ ออกเลขส่ง",
    },
    {
      code: "LAW0160",
      seq: 3,
      page: "10-3v-25-lawyer-send-appeal.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "จัดส่งคำอุทธรณ์ไปยังสำนักงานคดีปกครองแล้ว (รอยื่นต่อศาลปกครองสูงสุด)",
      statusCode: "L10_SENT_TO_PROSECUTOR",
      label: "นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง",
      stepName: "นิติกร ส่งคำอุทธรณ์",
    },
  ];

  /* --------------------------------------------------- PART 10 (Branch A)
     ดำเนินการอุทธรณ์ — ทางเข้าจากมติบอร์ด "เห็นชอบให้อุทธรณ์" (LAW0153-0160)
     เดินต่อบนเคสคำพิพากษาเดิม เข้าที่ L9_BOARD_APPROVED_APPEAL จาก Part 9
     (ยังไม่มีหน้าบันทึกมติบอร์ดจริง — ตอนนี้เข้าด้วย seed case ที่วางไว้ล่วงหน้า
     ที่สถานะนี้แล้ว ดู ecmis-activity10.js คดีปกครอง-100311/2569)

     ต่างจาก Part 8a→10a (L8_TO_APPEAL_DRAFT) ตรงที่เคสสายนี้ไม่มีร่างคำอุทธรณ์
     มาก่อนเลย (มีแต่ "บันทึกเสนอบอร์ด" จาก 10-3v-19) จึงต้องเดินเต็มสาย
     บังคับบัญชา ธุรการ→ผอ.กองกฎหมาย→ผอ.กลุ่มงาน→นิติกร ตามที่ตกลง (เพิ่ม
     ธุรการรับเรื่องนำหน้า แม้ผัง AS-IS เดิมของหน้านี้จะเริ่มที่นิติกรตรงๆ
     เพราะไม่ถือเป็นเอกสารนอกเข้าใหม่ — แต่ที่ตกลงกันคือให้เดินสายบังคับบัญชา
     ให้ครบเหมือน Part อื่นๆ) แล้วจบด้วยรีวิว/ลงนาม/ออกเลข/ส่ง เป็น "สาย
     คู่ขนาน" แยกจาก APPEAL_DRAFT_STEPS ด้านบน (ใช้ statusCode คนละชุด L9A_
     และ code คนละชุด เพื่อไม่ให้ชนกับ LAW0157-0160 ของสาย Part 8a) ตามที่
     เลือกไว้ (แยกสาย ไม่ใช้หน้าร่วมกับ 10-3v-22-25)

     ทุกขั้นตอน "เซ็น" ยกเว้นธุรการ (ตามที่ตกลง) นิติกรต้องแนบไฟล์ทั้งตอนร่าง
     (10-3v-32) และตอนส่ง (10-3v-36) */
  const BOARD_APPROVED_APPEAL_STEPS = [
    {
      code: "L9A_INTAKE",
      seq: 0,
      page: "10-3v-29-legal-admin-board-appeal-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณาและมอบหมายงาน (ดำเนินการอุทธรณ์)",
      statusCode: "L9A_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์",
      stepName: "ธุรการ รับเรื่อง",
    },
    {
      code: "LAW0155",
      seq: 1,
      page: "10-3v-30-legal-director-assign2.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานคดีพิจารณาและเห็นชอบ (ดำเนินการอุทธรณ์)",
      statusCode: "L9A_PENDING_GROUP_APPROVE",
      label: "ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      code: "LAW0154",
      seq: 2,
      page: "10-3v-31-group-director-assign2.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรรับเรื่องเพื่อดำเนินการแจ้งผลและร่างคำอุทธรณ์",
      statusCode: "L9A_PENDING_LAWYER_DRAFT",
      label: "ผอ.กลุ่มงานคดี พิจารณาเห็นชอบและมอบหมายนิติกรดำเนินการ",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ/มอบหมาย",
    },
    {
      code: "LAW0153_0156",
      seq: 3,
      page: "10-3v-32-lawyer-draft-appeal2.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานคดีตรวจร่างคำอุทธรณ์",
      statusCode: "L9A_PENDING_GROUP_REVIEW",
      label: "นิติกร รับเรื่องเพื่อดำเนินการแจ้งผล และร่างคำอุทธรณ์",
      stepName: "นิติกร รับเรื่อง/ร่าง",
    },
    {
      code: "LAW0157B",
      seq: 4,
      page: "10-3v-33-group-director-review-appeal2.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายพิจารณาและลงนามคำอุทธรณ์",
      statusCode: "L9A_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์",
      stepName: "ผอ.กลุ่มงาน ตรวจร่าง",
    },
    {
      code: "LAW0158B",
      seq: 5,
      page: "10-3v-34-legal-director-sign-appeal2.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขหนังสือส่งภายนอก (สายมติบอร์ด)",
      statusCode: "L9A_PENDING_DOC_NO",
      label: "ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0159B",
      seq: 6,
      page: "10-3v-35-legal-admin-dispatch2.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรจัดส่งหนังสือและคำอุทธรณ์ทางไปรษณีย์ (สายมติบอร์ด)",
      statusCode: "L9A_PENDING_LAWYER_SEND",
      label: "ธุรการ ออกเลขหนังสือส่งภายนอก",
      stepName: "ธุรการ ออกเลขส่ง",
    },
    {
      code: "LAW0160B",
      seq: 7,
      page: "10-3v-36-lawyer-send-appeal2.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "จัดส่งคำอุทธรณ์ไปยังสำนักงานคดีปกครองแล้ว (รอยื่นต่อศาลปกครองสูงสุด)",
      statusCode: "L9A_SENT_TO_PROSECUTOR",
      label: "นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง",
      stepName: "นิติกร ส่งคำอุทธรณ์",
    },
  ];

  /* --------------------------------------------------- PART 11 (Branch B)
     แจ้งความประสงค์ไม่อุทธรณ์ — ทางเข้าจากมติบอร์ด "เห็นชอบไม่อุทธรณ์"
     (LAW0164-0171, LAW0163) เดินต่อบนเคสคำพิพากษาเดิม เข้าที่
     L9_BOARD_APPROVED_NO_APPEAL จาก Part 9 (ยังไม่มีหน้าบันทึกมติบอร์ดจริง —
     เข้าด้วย seed case ที่วางไว้ล่วงหน้า ดู ecmis-activity10.js
     คดีปกครอง-100312/2569) ดู docs/10.3 mockup/flow-page-11.md

     ผัง AS-IS ของหน้านี้เริ่มที่นิติกรตรง (LAW0164) แต่ตามที่ตกลง (เหมือน
     Branch A) ให้เดินสายบังคับบัญชา ธุรการ→ผอ.กองกฎหมาย→ผอ.กลุ่มงาน→นิติกร
     นำหน้าก่อนเสมอเมื่อเป็นทางเข้าจากเอกสาร/มติภายนอกใหม่ — ขั้นตอนนำหน้า 3
     ขั้นนี้ (L9B_INTAKE/L9B_DIRECTOR_ASSIGN1/L9B_GROUP_ASSIGN1) ไม่มีเลข LAW
     กำกับ (ไม่ได้อยู่ในผังเดิม)

     ตามที่ตกลง (ตัด LAW0165/0166/(เพิ่ม) ออก และรวม LAW0164+0167 เป็นหน้า
     เดียว) — รอบมอบหมาย/เห็นชอบซ้ำสองรอบก่อนถึงขั้นจัดทำหนังสือถูกตัดออกเพราะ
     ซ้ำกับรอบมอบหมายเริ่มต้น (ธุรการ→ผอ.กอง→ผอ.กลุ่ม) ที่ทำไปแล้ว นิติกรจึง
     รับเรื่องและจัดทำหนังสือในหน้าเดียวกันทันที (LAW0164_0167) แล้วเข้าสู่
     รอบตรวจ/ลงนาม/ออกเลข/ส่ง (LAW0168-171/0163) ตามผังเดิม รวม LAW0171
     (ส่งหนังสือ) + LAW0163 (ปิดสำนวน) เป็นหน้าเดียว (คนละก้อนแต่บทบาทเดียวกัน
     ติดกัน — เหมือนที่รวม LAW0153+0156 ใน Branch A)

     ทุกขั้นตอน "เซ็น" ยกเว้นธุรการ (เหมือน Branch A) นิติกรแนบไฟล์ทุกขั้น
     ของตัวเอง (LAW0164_0167 รับเรื่อง/จัดทำหนังสือ / LAW0171+0163 ส่ง) ใช้
     คำนำหน้าฟิลด์ l9b* และ statusCode คนละชุด L9B_ แยกจาก l9a* / L9A_ ของ
     Branch A เพื่อไม่ให้ชนกัน */
  const BOARD_NO_APPEAL_STEPS = [
    {
      code: "L9B_INTAKE",
      seq: 0,
      page: "10-3v-37-legal-admin-no-appeal-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณาและมอบหมายงาน (แจ้งไม่อุทธรณ์)",
      statusCode: "L9B_PENDING_DIRECTOR_ASSIGN1",
      label: "ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์",
      stepName: "ธุรการ รับเรื่อง",
    },
    {
      code: "L9B_DIRECTOR_ASSIGN1",
      seq: 1,
      page: "10-3v-38-legal-director-assign3.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานคดีพิจารณาและมอบหมายนิติกร (แจ้งไม่อุทธรณ์)",
      statusCode: "L9B_PENDING_GROUP_ASSIGN1",
      label: "ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      code: "L9B_GROUP_ASSIGN1",
      seq: 2,
      page: "10-3v-39-group-director-assign3.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรรับเรื่องเพื่อดำเนินการแจ้งผลไม่อุทธรณ์",
      statusCode: "L9B_PENDING_LAWYER_INTAKE",
      label: "ผอ.กลุ่มงานคดี พิจารณาและมอบหมายนิติกรดำเนินการ",
      stepName: "ผอ.กลุ่มงาน มอบหมาย",
    },
    {
      code: "LAW0164_0167",
      seq: 3,
      page: "10-3v-40-lawyer-no-appeal-intake.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานคดีตรวจสอบหนังสือ",
      statusCode: "L9B_PENDING_GROUP_REVIEW",
      label: "นิติกร รับเรื่องและจัดทำหนังสือส่งภายนอกถึงอัยการ",
      stepName: "นิติกร รับเรื่อง/จัดทำหนังสือ",
    },
    {
      code: "LAW0168",
      seq: 4,
      page: "10-3v-45-group-director-review3.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายลงนามในหนังสือที่ส่งถึงอัยการ",
      statusCode: "L9B_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงานคดี ตรวจสอบหนังสือ",
      stepName: "ผอ.กลุ่มงาน ตรวจหนังสือ",
    },
    {
      code: "LAW0169",
      seq: 5,
      page: "10-3v-46-legal-director-sign3.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขหนังสือ (แจ้งไม่อุทธรณ์)",
      statusCode: "L9B_PENDING_DOC_NO",
      label: "ผอ.กองกฎหมาย ลงนามในหนังสือที่ส่งถึงอัยการ",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0170",
      seq: 6,
      page: "10-3v-47-legal-admin-dispatch3.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรจัดส่งหนังสือแจ้งไม่อุทธรณ์ทางไปรษณีย์",
      statusCode: "L9B_PENDING_LAWYER_SEND",
      label: "ธุรการ ออกเลขหนังสือ",
      stepName: "ธุรการ ออกเลขส่ง",
    },
    {
      code: "LAW0171_0163",
      seq: 7,
      page: "10-3v-48-lawyer-send-close.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "จัดส่งหนังสือแจ้งไม่อุทธรณ์แล้ว และปิดสำนวนคดี",
      statusCode: "L9B_CLOSED",
      label: "นิติกร ส่งหนังสือแจ้งความประสงค์ไม่อุทธรณ์ และปิดสำนวน",
      stepName: "นิติกร ส่ง/ปิดสำนวน",
    },
  ];

  /* --------------------------------------------------------- PART 9
     เสนอมติอุทธรณ์ต่อบอร์ด (LAW0150-0152) — เดินต่อบนเคสคำพิพากษาเดิม เข้าที่
     L8_TO_BOARD_PROPOSE จาก 10-3v-20 (ผอ.กลุ่มงานยืนยัน "เห็นควรไม่อุทธรณ์")
     ใช้คำนำหน้า L9_ แยกจาก L10_/L8_/L7_/L3V_ — ผังจริงมี LAW0153/0164 ต่อ
     (บอร์ดเห็นชอบอุทธรณ์ → กิจกรรมที่ 10 / บอร์ดเห็นชอบไม่อุทธรณ์ → กิจกรรมที่ 11)
     ที่ยังไม่ implement (เป็นมติบอร์ดจริง ไม่ใช่ขั้นตอนภายในกองกฎหมาย) ดู
     flow-page-09.md

     LAW0149 (นิติกรทำบันทึกสรุปความเห็น) "ตัด" ออกจากที่นี่แล้ว — ซ้ำกับ
     10-3v-19 (LAW0145) ที่ให้นิติกรแนบบันทึกเสนอบอร์ดไปพร้อมกับตอนสรุป
     ความเห็นควรอุทธรณ์อยู่แล้ว (ช่อง "แนบบันทึกเสนอบอร์ด" เปลี่ยน label ตาม
     สาขาที่เลือกไว้ที่ 10-3v-19 เหมือนที่ทำกับ LAW0156 ใน Part 10a) จึงให้
     L8_TO_BOARD_PROPOSE ข้ามตรงไป LAW0150 (10-3v-26) เลย */
  const APPEAL_BOARD_STEPS = [
    {
      code: "LAW0150",
      seq: 0,
      page: "10-3v-26-group-director-board-approve.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายพิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)",
      statusCode: "L9_PENDING_DIRECTOR_APPROVE",
      label: "ผอ.กลุ่มงาน พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ",
    },
    {
      code: "LAW0151",
      seq: 1,
      page: "10-3v-27-legal-director-board-approve.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายส่งมติเสนอบอร์ด",
      statusCode: "L9_PENDING_DOC_SEND",
      label: "ผอ.กองกฎหมาย พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)",
      stepName: "ผอ.กองกฎหมาย เห็นชอบ",
    },
    {
      code: "LAW0152",
      seq: 2,
      page: "10-3v-28-legal-admin-board-propose.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "เสนอมติอุทธรณ์ต่อบอร์ดแล้ว (รอบอร์ดพิจารณา)",
      statusCode: "L9_PROPOSED_TO_BOARD",
      label: "ธุรการ ส่งมติเสนอบอร์ด",
      stepName: "ธุรการ ส่งมติบอร์ด",
    },
  ];

  const ALL_STEPS = STEPS.concat(
    STAY_STEPS,
    VERDICT_STEPS,
    APPEAL_STEPS,
    APPEAL_CONSIDER_STEPS,
    APPEAL_DRAFT_STEPS,
    BOARD_APPROVED_APPEAL_STEPS,
    APPEAL_BOARD_STEPS,
    BOARD_NO_APPEAL_STEPS,
  );

  function stepByCode(code) {
    return ALL_STEPS.find(function (s) { return s.code === code; }) || null;
  }
  function stepByPage(page) {
    return ALL_STEPS.find(function (s) { return s.page === page; }) || null;
  }

  /* สถานะที่ขั้นตอน i เขียนไว้ -> หน้าของขั้นตอนถัดไปที่ต้องดำเนินการ
     (ขั้นตอนสุดท้าย L3_READY_FOR_BOARD ไม่มี route ต่อ — เป็น black box
     รอหน้าเสนอบอร์ดจริงที่ยังไม่ implement ตามแผน) */
  const ROUTES = STEPS.reduce(function (acc, step, i) {
    const next = STEPS[i + 1];
    if (next) acc[step.statusCode] = next.page;
    return acc;
  }, {});

  /* L3B_PENDING_LAWYER_DRAFT คือสถานะตั้งต้นที่ spawnStayObjectionCase() เขียนไว้
     ตอนสร้างเคสลูก — ไม่มีขั้นก่อนหน้าใน STAY_STEPS ให้ reduce ไล่ต่อได้ (ต้องระบุ
     เส้นทางแรกเข้า 10-3b-01 ด้วยมือ) ส่วนที่เหลือไล่ต่อแบบเดียวกับ ROUTES ข้างบน */
  ROUTES["L3B_PENDING_LAWYER_DRAFT"] = STAY_STEPS[0].page;
  STAY_STEPS.reduce(function (acc, step, i) {
    const next = STAY_STEPS[i + 1];
    if (next) acc[step.statusCode] = next.page;
    return acc;
  }, ROUTES);

  /* หน้าที่สร้างแล้วจริง — สถานะที่ชี้ไปหน้าที่ยังไม่สร้างจะไม่มี route (inbox แสดงเป็น
     "ขั้นตอนถัดไปยังไม่ implement" แทนการพาไปหน้า 404) เพิ่มชื่อไฟล์ที่นี่เมื่อสร้างหน้าใหม่
     (10-3v-00 ไม่ต้องอยู่ในนี้ เพราะเป็นจุดเริ่มที่เข้าด้วยปุ่ม ไม่ใช่ปลายทางของ ROUTES) */
  const VERDICT_BUILT_PAGES = [
    "10-3v-02-legal-director-assign.html",
    "10-3v-03-group-director-assign.html",
    "10-3v-04-lawyer-verdict-analysis.html",
    "10-3v-05-group-director-approve.html",
    "10-3v-06-legal-director-decide.html",
    "10-3v-07-lawyer-close-case.html",
  ];
  /* VERDICT_STEPS[0] (LAW0119/10-3v-00, รวม LAW0119+LAW0120) เขียนสถานะเดียวกับที่มัน
     สังกัด (entry point เหมือน LAW0085/02-board-intake.html) — reduce ด้านล่างไล่
     ROUTES ต่อจากตรงนี้เอง */
  VERDICT_STEPS.reduce(function (acc, step, i) {
    const next = VERDICT_STEPS[i + 1];
    if (next && VERDICT_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L3V_TO_CLOSE (ชนะคดี ผู้ฟ้องคดีไม่ยื่นอุทธรณ์, Part 6c) เข้าตรงที่ LAW0163
     (10-3v-07) — ไม่ได้อยู่ในลำดับ VERDICT_STEPS ปกติเพราะเขียนโดย
     VERDICT_BRANCHES.CLOSE ไม่ใช่ statusCode ของขั้นก่อนหน้า จึงต่อ route ด้วยมือ
     (L3V_TO_APPEAL_REPLY/L3V_TO_APPEAL_CONSIDER ยังไม่มี route — รอ Part 7/8) */
  if (VERDICT_BUILT_PAGES.indexOf("10-3v-07-lawyer-close-case.html") !== -1) {
    ROUTES["L3V_TO_CLOSE"] = "10-3v-07-lawyer-close-case.html";
  }

  /* หน้า Part 7 ที่สร้างแล้วจริง (เพิ่มชื่อไฟล์ที่นี่เมื่อสร้างหน้าใหม่ต่อไป) */
  const APPEAL_BUILT_PAGES = [
    "10-3v-08-legal-admin-appeal-intake.html",
    "10-3v-09-legal-director-assign.html",
    "10-3v-10-group-director-assign.html",
    "10-3v-11-lawyer-draft-appeal-reply.html",
    "10-3v-12-group-director-approve.html",
    "10-3v-13-legal-director-sign.html",
    "10-3v-14-legal-admin-dispatch.html",
    "10-3v-15-lawyer-send-appeal-reply.html",
  ];
  APPEAL_STEPS.reduce(function (acc, step, i) {
    const next = APPEAL_STEPS[i + 1];
    if (next && APPEAL_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L3V_TO_APPEAL_REPLY (ชนะคดี ผู้ฟ้องคดียื่นอุทธรณ์, Part 6a) เข้าตรงที่ LAW0131
     (10-3v-08) — เขียนโดย VERDICT_BRANCHES.APPEAL_REPLY ไม่ใช่ statusCode ของขั้น
     ก่อนหน้าใน APPEAL_STEPS จึงต่อ route ด้วยมือแบบเดียวกับ L3V_TO_CLOSE */
  if (
    APPEAL_BUILT_PAGES.indexOf("10-3v-08-legal-admin-appeal-intake.html") !==
    -1
  ) {
    ROUTES["L3V_TO_APPEAL_REPLY"] = "10-3v-08-legal-admin-appeal-intake.html";
  }

  /* หน้า Part 8 ที่สร้างแล้วจริง (เพิ่มชื่อไฟล์ที่นี่เมื่อสร้างหน้าใหม่ต่อไป) */
  const APPEAL_CONSIDER_BUILT_PAGES = [
    "10-3v-16-legal-admin-appeal-consider-intake.html",
    "10-3v-17-legal-director-assign1.html",
    "10-3v-18-group-director-assign1.html",
    "10-3v-19-lawyer-register.html",
    "10-3v-20-group-director-approve1.html",
  ];
  APPEAL_CONSIDER_STEPS.reduce(function (acc, step, i) {
    const next = APPEAL_CONSIDER_STEPS[i + 1];
    if (next && APPEAL_CONSIDER_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L3V_TO_APPEAL_CONSIDER (แพ้คดี, Part 6b) เข้าตรงที่ LAW0143 (10-3v-16) —
     เขียนโดย VERDICT_BRANCHES.APPEAL_CONSIDER ไม่ใช่ statusCode ของขั้นก่อนหน้า
     จึงต่อ route ด้วยมือแบบเดียวกับ L3V_TO_APPEAL_REPLY */
  if (
    APPEAL_CONSIDER_BUILT_PAGES.indexOf(
      "10-3v-16-legal-admin-appeal-consider-intake.html",
    ) !== -1
  ) {
    ROUTES["L3V_TO_APPEAL_CONSIDER"] =
      "10-3v-16-legal-admin-appeal-consider-intake.html";
  }

  /* หน้า Part 10a ที่สร้างแล้วจริง (เพิ่มชื่อไฟล์ที่นี่เมื่อสร้างหน้าใหม่ต่อไป) */
  const APPEAL_DRAFT_BUILT_PAGES = [
    "10-3v-22-group-director-review-appeal.html",
    "10-3v-23-legal-director-sign-appeal.html",
    "10-3v-24-legal-admin-dispatch.html",
    "10-3v-25-lawyer-send-appeal.html",
  ];
  APPEAL_DRAFT_STEPS.reduce(function (acc, step, i) {
    const next = APPEAL_DRAFT_STEPS[i + 1];
    if (next && APPEAL_DRAFT_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L8_TO_APPEAL_DRAFT (เห็นควรอุทธรณ์, Part 8) เข้าตรงที่ LAW0157 (10-3v-22) —
     ข้าม LAW0156 (หน้าร่างแยก) ไปเลยเพราะซ้ำกับการแนบคำอุทธรณ์ที่ 10-3v-19
     อยู่แล้ว (ดูหมายเหตุที่ APPEAL_DRAFT_STEPS ด้านบน) เขียนโดย
     APPEAL_CONSIDER_BRANCHES.APPEAL ไม่ใช่ statusCode ของขั้นก่อนหน้า จึงต่อ
     route ด้วยมือแบบเดียวกับ L3V_TO_APPEAL_CONSIDER */
  if (
    APPEAL_DRAFT_BUILT_PAGES.indexOf(
      "10-3v-22-group-director-review-appeal.html",
    ) !== -1
  ) {
    ROUTES["L8_TO_APPEAL_DRAFT"] =
      "10-3v-22-group-director-review-appeal.html";
  }

  /* หน้าสาย Branch A (มติบอร์ดเห็นชอบให้อุทธรณ์) ที่สร้างแล้วจริง */
  const BOARD_APPROVED_APPEAL_BUILT_PAGES = [
    "10-3v-29-legal-admin-board-appeal-intake.html",
    "10-3v-30-legal-director-assign2.html",
    "10-3v-31-group-director-assign2.html",
    "10-3v-32-lawyer-draft-appeal2.html",
    "10-3v-33-group-director-review-appeal2.html",
    "10-3v-34-legal-director-sign-appeal2.html",
    "10-3v-35-legal-admin-dispatch2.html",
    "10-3v-36-lawyer-send-appeal2.html",
  ];
  BOARD_APPROVED_APPEAL_STEPS.reduce(function (acc, step, i) {
    const next = BOARD_APPROVED_APPEAL_STEPS[i + 1];
    if (next && BOARD_APPROVED_APPEAL_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L9_BOARD_APPROVED_APPEAL เข้าตรงที่ L9A_INTAKE (10-3v-29) — เขียนโดย
     seed case ล่วงหน้า (ยังไม่มีหน้าบันทึกมติบอร์ดจริง) จึงต่อ route ด้วยมือ
     แบบเดียวกับ L8_TO_APPEAL_DRAFT/L8_TO_BOARD_PROPOSE */
  if (
    BOARD_APPROVED_APPEAL_BUILT_PAGES.indexOf(
      "10-3v-29-legal-admin-board-appeal-intake.html",
    ) !== -1
  ) {
    ROUTES["L9_BOARD_APPROVED_APPEAL"] =
      "10-3v-29-legal-admin-board-appeal-intake.html";
  }

  /* หน้า Part 9 ที่สร้างแล้วจริง (เพิ่มชื่อไฟล์ที่นี่เมื่อสร้างหน้าใหม่ต่อไป) */
  const APPEAL_BOARD_BUILT_PAGES = [
    "10-3v-26-group-director-board-approve.html",
    "10-3v-27-legal-director-board-approve.html",
    "10-3v-28-legal-admin-board-propose.html",
  ];
  APPEAL_BOARD_STEPS.reduce(function (acc, step, i) {
    const next = APPEAL_BOARD_STEPS[i + 1];
    if (next && APPEAL_BOARD_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L8_TO_BOARD_PROPOSE (เห็นควรไม่อุทธรณ์, Part 8) เข้าตรงที่ LAW0150
     (10-3v-26) — ข้าม LAW0149 (หน้าทำบันทึกแยก) ไปเลยเพราะซ้ำกับการแนบบันทึก
     เสนอบอร์ดที่ 10-3v-19 อยู่แล้ว (ดูหมายเหตุที่ APPEAL_BOARD_STEPS ด้านบน)
     เขียนโดย APPEAL_CONSIDER_BRANCHES.BOARD ไม่ใช่ statusCode ของขั้นก่อนหน้า
     จึงต่อ route ด้วยมือแบบเดียวกับ L8_TO_APPEAL_DRAFT */
  if (
    APPEAL_BOARD_BUILT_PAGES.indexOf(
      "10-3v-26-group-director-board-approve.html",
    ) !== -1
  ) {
    ROUTES["L8_TO_BOARD_PROPOSE"] =
      "10-3v-26-group-director-board-approve.html";
  }

  /* หน้าสาย Branch B (มติบอร์ดเห็นชอบไม่อุทธรณ์) ที่สร้างแล้วจริง */
  const BOARD_NO_APPEAL_BUILT_PAGES = [
    "10-3v-37-legal-admin-no-appeal-intake.html",
    "10-3v-38-legal-director-assign3.html",
    "10-3v-39-group-director-assign3.html",
    "10-3v-40-lawyer-no-appeal-intake.html",
    "10-3v-45-group-director-review3.html",
    "10-3v-46-legal-director-sign3.html",
    "10-3v-47-legal-admin-dispatch3.html",
    "10-3v-48-lawyer-send-close.html",
  ];
  BOARD_NO_APPEAL_STEPS.reduce(function (acc, step, i) {
    const next = BOARD_NO_APPEAL_STEPS[i + 1];
    if (next && BOARD_NO_APPEAL_BUILT_PAGES.indexOf(next.page) !== -1) {
      acc[step.statusCode] = next.page;
    }
    return acc;
  }, ROUTES);

  /* L9_BOARD_APPROVED_NO_APPEAL เข้าตรงที่ L9B_INTAKE (10-3v-37) — เขียนโดย
     seed case ล่วงหน้า (ยังไม่มีหน้าบันทึกมติบอร์ดจริง) จึงต่อ route ด้วยมือ
     แบบเดียวกับ L9_BOARD_APPROVED_APPEAL */
  if (
    BOARD_NO_APPEAL_BUILT_PAGES.indexOf(
      "10-3v-37-legal-admin-no-appeal-intake.html",
    ) !== -1
  ) {
    ROUTES["L9_BOARD_APPROVED_NO_APPEAL"] =
      "10-3v-37-legal-admin-no-appeal-intake.html";
  }

  /* ขั้นตอนของสายงานที่ขั้นนั้นสังกัด (Part 1 / 1b / 5–6 / 7 / 8 / 9 / 10a / 10b / 11) — ใช้กับแถบขั้นตอน */
  function flowOf(code) {
    return [
      STEPS,
      STAY_STEPS,
      VERDICT_STEPS,
      APPEAL_STEPS,
      APPEAL_CONSIDER_STEPS,
      APPEAL_DRAFT_STEPS,
      BOARD_APPROVED_APPEAL_STEPS,
      APPEAL_BOARD_STEPS,
      BOARD_NO_APPEAL_STEPS,
    ].find(function (flow) {
      return flow.some(function (s) { return s.code === code; });
    }) || STEPS;
  }

  const TH_MONTHS = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  function formatThaiDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.getDate() + " " + TH_MONTHS[dt.getMonth()] + " " + (dt.getFullYear() + 543);
  }
  function formatThaiDateTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return formatThaiDate(dt) + " " + hh + ":" + mm + " น.";
  }

  const Activity103 = {
    STEPS: STEPS,
    VERDICT_STEPS: VERDICT_STEPS,
    APPEAL_STEPS: APPEAL_STEPS,
    APPEAL_CONSIDER_STEPS: APPEAL_CONSIDER_STEPS,
    APPEAL_CONSIDER_BRANCHES: APPEAL_CONSIDER_BRANCHES,
    APPEAL_DRAFT_STEPS: APPEAL_DRAFT_STEPS,
    APPEAL_BOARD_STEPS: APPEAL_BOARD_STEPS,
    BOARD_APPROVED_APPEAL_STEPS: BOARD_APPROVED_APPEAL_STEPS,
    BOARD_NO_APPEAL_STEPS: BOARD_NO_APPEAL_STEPS,
    VERDICT_BRANCHES: VERDICT_BRANCHES,
    ROUTES: ROUTES,
    stepByCode: stepByCode,
    stepByPage: stepByPage,

    /* คดีของกิจกรรม 10.3 (คดีศาลปกครอง) — เช็คจาก category ที่ 02-board-intake.html เขียนไว้ */
    isCourtCase: function (kase) {
      if (!kase) return false;
      const cat = kase.category || kase.type || (kase.raw && kase.raw.category) || "";
      return String(cat).indexOf("10.3") === 0;
    },

    /* Activity10.getCaseById() ตกไปที่ cases[0] เมื่อไม่รู้จัก id — กรองเฉพาะ 10.3 ก่อน */
    getCase: function (caseId, fallbackStatusCode) {
      const all = (Activity10.getCases && Activity10.getCases()) || [];
      const pool = all.filter(Activity103.isCourtCase);
      const exact = caseId && pool.find(function (c) { return c.id === caseId; });
      if (exact) return exact;
      const byLawReceiveNo =
        caseId &&
        pool.find(function (c) {
          return c.lawReceiveNo && String(c.lawReceiveNo) === String(caseId);
        });
      if (byLawReceiveNo) return byLawReceiveNo;
      return (
        pool.find(function (c) { return c.statusCode === fallbackStatusCode; }) ||
        pool[0] ||
        null
      );
    },

    /* เดินงานไปขั้นถัดไปตามตาราง STEPS — ใช้ร่วมกันทุกหน้า 10-3-xx */
    advance: function (caseId, stepCode, patch) {
      const step = stepByCode(stepCode);
      if (!step) return null;
      const next = Object.assign(
        {
          status: step.status,
          statusCode: step.statusCode,
          statusBadge: "bg-primary text-white",
          l3Step: step.code,
          l3StepSeq: step.seq,
        },
        patch || {},
      );
      return Activity10.updateCase(caseId, next);
    },

    /* บันทึกลายเซ็นลงช่องของบทบาทที่กำลังลงนามอยู่ */
    sign: function (caseId, slot, imageDataUrl, extra) {
      const kase = Activity10.getCaseById(caseId);
      if (!kase) return null;
      const sigs = Object.assign({}, kase.l3Signatures || {});
      sigs[slot] = Object.assign(
        { image: imageDataUrl, signedAt: formatThaiDateTime(new Date()) },
        extra || {},
      );
      return Activity10.updateCase(caseId, { l3Signatures: sigs });
    },

    /* ออกเลขหนังสือส่ง — ผูกกับปุ่มของหน้าที่ต้องออกเลข (LAW0091/LAW0095) */
    issueDocNo: function (caseId, docField, dateField) {
      const kase = Activity10.getCaseById(caseId);
      if (kase && kase[docField]) return kase[docField];
      const seq = String(4400 + Math.floor(Math.random() * 500)).padStart(4, "0");
      const docNo = "ปป 0003/" + seq;
      const patch = {};
      patch[docField] = docNo;
      patch[dateField] = formatThaiDate(new Date());
      Activity10.updateCase(caseId, patch);
      return docNo;
    },

    /* คดีของกิจกรรมนี้ที่มี l3ParentCaseId คือเคสลูกของสาขาคำขอทุเลาฯ (Part 1b) */
    isStayObjectionCase: function (kase) {
      return !!(kase && kase.l3ParentCaseId);
    },

    /* เคสรับผลคำพิพากษา (Part 5–6) — ลิงก์กลับคดีรับคำฟ้องเดิมเก็บใน l3OriginCaseId
       (ไม่ใช้ l3ParentCaseId เพราะจะถูก isStayObjectionCase นับเป็นเคสลูก Part 1b) */
    isVerdictCase: function (kase) {
      return !!(kase && kase.l3CaseType === "verdict");
    },

    /* สร้างเคสลูกแยกต่างหากเมื่อ 10-3-04 ติ๊ก "มีคำขอทุเลาการบังคับคดี" — เดินสถานะ
       ของตัวเอง (L3B_*) เป็นอิสระจากเคสแม่ ไม่ชนกัน (ดู implementation-plan-part1b.md) */
    spawnStayObjectionCase: function (parentCase) {
      if (!parentCase) return null;
      const childId = parentCase.id.replace(/\/(\d{4})$/, "-B/$1");
      const existing = Activity10.getCaseById(childId);
      if (existing) return existing;
      return Activity10.addCase({
        id: childId,
        category: parentCase.category,
        categoryName: parentCase.categoryName,
        l3ParentCaseId: parentCase.id,
        title:
          "คำขอทุเลาการบังคับคดี — " + (parentCase.courtName || "") +
          " (เกี่ยวข้องกับ " + (parentCase.blackCaseNo || "") + ")",
        courtName: parentCase.courtName,
        blackCaseNo: parentCase.blackCaseNo,
        redCaseNo: parentCase.redCaseNo,
        orderedTo: parentCase.orderedTo,
        plaintiffs: parentCase.plaintiffs,
        defendants: parentCase.defendants,
        assignedRole: "case_legal_officer",
        officer: parentCase.officer,
        status: "นิติกรจัดทำคำชี้แจงคัดค้าน",
        statusCode: "L3B_PENDING_LAWYER_DRAFT",
        statusBadge: "bg-primary text-white",
        l3Step: null,
        l3StepSeq: 0,
      });
    },
  };

  /* ---------------------------------------------------------- USER PROFILE */
  function currentRoleId() {
    return sessionStorage.getItem("ecmis_role") || "admin_legal";
  }
  function currentRole() {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const id = currentRoleId();
    return roles.find(function (r) { return r.id === id || r.login === id; }) || null;
  }
  function signerLabel(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name + " (" + r.title + ")" : "-";
  }

  /* ------------------------------------------------------- SIGNATURE MODAL
     สำเนาเดียวกับที่ใช้ใน 08-legal-director-approval.html / ecmis-10-2.js */
  let sigPadCtx = null;
  let sigPadDrawing = false;
  let sigPadHasDrawing = false;
  let sigMode = "hand";

  function getSigPadPos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function selectSignatureMode(mode) {
    sigMode = mode;
    const cardHand = document.getElementById("swal-card-hand");
    const cardCert = document.getElementById("swal-card-cert");
    const badge = document.getElementById("swal-sig-mode-badge");
    const boxCanvas = document.getElementById("swal-box-canvas");
    const boxCert = document.getElementById("swal-box-cert");
    if (cardHand) cardHand.classList.toggle("is-active", mode === "hand");
    if (cardCert) cardCert.classList.toggle("is-active", mode === "cert");
    if (badge) {
      badge.innerHTML =
        mode === "hand"
          ? '<i class="fa-solid fa-check me-1"></i> เซ็นมือ'
          : '<i class="fa-solid fa-check me-1"></i> ลายเซ็นดิจิทัล';
    }
    if (boxCanvas) boxCanvas.classList.toggle("is-visible", mode === "hand");
    if (boxCert) boxCert.classList.toggle("is-visible", mode === "cert");
  }

  function clearSignaturePad() {
    const canvas = document.getElementById("swal-sig-canvas");
    if (!canvas || !sigPadCtx) return;
    sigPadCtx.clearRect(0, 0, canvas.width, canvas.height);
    sigPadHasDrawing = false;
  }

  function bindSignaturePad() {
    const canvas = document.getElementById("swal-sig-canvas");
    if (!canvas) return;
    sigPadCtx = canvas.getContext("2d");
    sigPadCtx.lineWidth = 2.4;
    sigPadCtx.lineCap = "round";
    sigPadCtx.strokeStyle = "#0F172A";
    sigPadHasDrawing = false;
    sigPadDrawing = false;
    sigMode = "hand";

    const startDraw = function (evt) {
      evt.preventDefault();
      sigPadDrawing = true;
      const pos = getSigPadPos(canvas, evt);
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(pos.x, pos.y);
    };
    const moveDraw = function (evt) {
      if (!sigPadDrawing) return;
      evt.preventDefault();
      const pos = getSigPadPos(canvas, evt);
      sigPadCtx.lineTo(pos.x, pos.y);
      sigPadCtx.stroke();
      sigPadHasDrawing = true;
    };
    const endDraw = function () { sigPadDrawing = false; };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw);

    const clearBtn = document.getElementById("swal-sig-clear");
    if (clearBtn) clearBtn.addEventListener("click", clearSignaturePad);
    const cardHand = document.getElementById("swal-card-hand");
    const cardCert = document.getElementById("swal-card-cert");
    if (cardHand) cardHand.addEventListener("click", function () { selectSignatureMode("hand"); });
    if (cardCert) cardCert.addEventListener("click", function () { selectSignatureMode("cert"); });
  }

  function generateCertificateStampImage(signerFull, certId) {
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ECFDF5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.fillStyle = "#065F46";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("ลงนามด้วยใบรับรองอิเล็กทรอนิกส์", 20, 40);
    ctx.font = "13px sans-serif";
    ctx.fillText("Certificate: " + certId, 20, 68);
    const parenIdx = signerFull.indexOf("(");
    const namePart = parenIdx > -1 ? signerFull.slice(0, parenIdx).trim() : signerFull;
    const rolePart = parenIdx > -1 ? signerFull.slice(parenIdx).trim() : "";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(namePart, 20, 100);
    ctx.font = "12px sans-serif";
    ctx.fillText(rolePart, 20, 122);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#16A34A";
    ctx.fillText(new Date().toLocaleString("th-TH"), 20, 150);
    return canvas.toDataURL("image/png");
  }

  function openSignatureModal(opts, onConfirm) {
    const cfg = opts || {};
    const title = cfg.title || "ยืนยันการลงนามอิเล็กทรอนิกส์";
    const signerFull = cfg.signer || signerLabel(currentRoleId());
    const certId = cfg.certId || "PACC-2569-103";

    Swal.fire({
      width: "720px",
      html:
        '<div class="text-start emd-body">' +
        '<div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">' +
        '<i class="fa-solid fa-pen-nib text-primary fa-lg"></i>' +
        '<h5 class="m-0 fw-bold emd-sig-title">' + title + "</h5>" +
        "</div>" +
        '<div class="p-3 mb-3 rounded-3 d-flex align-items-center gap-2 emd-sig-signer">' +
        '<i class="fa-solid fa-user me-1"></i>' +
        "<span>ผู้ลงนามคือ <strong>" + signerFull + "</strong></span>" +
        "</div>" +
        '<div class="d-flex align-items-center justify-content-between mb-2">' +
        "<div>" +
        '<div class="fw-bold emd-sig-label">เลือกวิธีลงนาม <span class="text-danger">*</span></div>' +
        '<div class="text-muted emd-fs-sm">เลือกได้เพียง 1 วิธีต่อการลงนามหนึ่งครั้ง</div>' +
        "</div>" +
        '<div id="swal-sig-mode-badge" class="badge rounded-pill bg-light text-primary border px-2 py-1 emd-fs-sm">' +
        '<i class="fa-solid fa-check me-1"></i> เซ็นมือ</div>' +
        "</div>" +
        '<div class="row g-3 mb-3">' +
        '<div class="col-6">' +
        '<div id="swal-card-hand" class="p-3 rounded-3 border d-flex gap-3 align-items-start h-100 emd-sig-card is-active">' +
        '<div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 emd-sig-ico is-primary">' +
        '<i class="fa-solid fa-pen fa-lg"></i></div>' +
        '<div><div class="fw-bold text-dark emd-sig-card-title">1. เซ็นมือ</div>' +
        '<div class="text-muted emd-sig-card-desc">ใช้เมาส์หรือทัชแพดลากลายเซ็น</div></div>' +
        "</div></div>" +
        '<div class="col-6">' +
        '<div id="swal-card-cert" class="p-3 rounded-3 border d-flex gap-3 align-items-start h-100 emd-sig-card">' +
        '<div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 emd-sig-ico">' +
        '<i class="fa-solid fa-shield-halved fa-lg"></i></div>' +
        '<div><div class="fw-bold text-dark emd-sig-card-title">2. ลายเซ็นดิจิทัล</div>' +
        '<div class="text-muted emd-sig-card-desc">ประทับลายเซ็นอัตโนมัติด้วยใบรับรองอิเล็กทรอนิกส์ที่มีอยู่</div></div>' +
        "</div></div>" +
        "</div>" +
        '<div id="swal-box-canvas" class="border rounded-3 p-3 mb-3 bg-white emd-sig-panel is-visible">' +
        '<div class="d-flex align-items-center justify-content-between mb-2">' +
        "<div>" +
        '<div class="fw-bold emd-sig-label">เซ็นชื่อในกรอบด้านล่าง</div>' +
        '<div class="text-muted emd-fs-sm">กดเมาส์ค้างแล้วลาก หรือใช้นิ้วบนอุปกรณ์ระบบสัมผัส</div>' +
        "</div>" +
        '<button type="button" class="btn btn-sm btn-outline-secondary border px-2 py-1 rounded-2 emd-fs-sm" id="swal-sig-clear">' +
        '<i class="fa-solid fa-eraser me-1"></i> ล้างลายเซ็น</button>' +
        "</div>" +
        '<div class="sig-canvas-wrapper emd-sig-pad">' +
        '<canvas id="swal-sig-canvas" width="640" height="170" class="emd-sig-canvas"></canvas>' +
        "</div></div>" +
        '<div id="swal-box-cert" class="p-3 rounded-3 emd-sig-panel emd-sig-cert">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
        '<i class="fa-solid fa-circle-check text-success fa-lg"></i>' +
        "<strong>Certificate: " + certId + "</strong></div>" +
        "<div>ผู้ถือใบรับรอง: <strong>" + signerFull + "</strong></div>" +
        '<div class="mt-1 text-success emd-fs-sm">ระบบจะประทับลายเซ็นอิเล็กทรอนิกส์ลงในเอกสารโดยอัตโนมัติ</div>' +
        "</div></div>",
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-pen me-1"></i> ลงนาม',
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16A34A",
      cancelButtonColor: "#7C8CA3",
      allowOutsideClick: false,
      didOpen: bindSignaturePad,
      preConfirm: function () {
        if (sigMode === "hand") {
          if (!sigPadHasDrawing) {
            Swal.showValidationMessage("กรุณาลงลายมือชื่อในกรอบก่อนยืนยันการลงนาม");
            return false;
          }
          return document.getElementById("swal-sig-canvas").toDataURL("image/png");
        }
        return generateCertificateStampImage(signerFull, certId);
      },
    }).then(function (result) {
      if (result.isConfirmed && typeof onConfirm === "function") {
        onConfirm(result.value, sigMode);
      }
    });
  }

  /* ---------------------------------------------------------- PAGE HELPERS */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text == null || text === "" ? "-" : text;
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* เอกสารแนบประกอบคำฟ้อง — แนบไว้ตั้งแต่ 02-board-intake.html (attachmentFileNames)
     เก็บแค่ชื่อไฟล์ ไม่มีไบต์ไฟล์จริงให้ดาวน์โหลด (mockup ไม่มี backend เก็บไฟล์) */
  function renderAttachments(containerId, fileNames) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const files = fileNames || [];
    if (!files.length) {
      el.innerHTML = '<div class="read-box l3-optional">ไม่มีเอกสารแนบ</div>';
      return;
    }
    el.innerHTML = files
      .map(function (name) {
        const safeName = String(name).replace(/'/g, "\\'");
        return (
          '<div class="l3-attachment-row">' +
          '<div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' +
          name +
          "</div>" +
          '<button type="button" class="btn btn-secondary" style="height: 28px; padding: 0 10px; font-size: 0.8em" onclick="ECMIS103.mockOpenFile(\'' +
          safeName +
          "')\">" +
          '<i class="fa-solid fa-download me-1"></i>ดาวน์โหลด</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function mockOpenFile(name) {
    Swal.fire({
      icon: "info",
      title: "เปิดไฟล์ " + name + "...",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  /* รายชื่อผู้ฟ้อง/ผู้ถูกฟ้อง (อ่านอย่างเดียว) — เก็บเป็น array บนเคสตั้งแต่ 02-board-intake.html */
  function renderPartyList(containerId, names) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const list = (names || []).filter(Boolean);
    el.innerHTML = list.length
      ? list.map(function (n) { return '<div class="read-box" style="margin-bottom:6px;">' + n + "</div>"; }).join("")
      : '<div class="read-box l3-optional">-</div>';
  }

  /* หัวโปรไฟล์มุมขวาบน — ทุกหน้า 10.3 เรียกตอน DOMContentLoaded */
  function initUserProfile() {
    const role = currentRole();
    if (!role) return;
    const shortName = String(role.name || "")
      .replace(/^(นางสาว|นาง|นาย|พ\.ต\.ท\.)/, "")
      .trim();
    setText("userAvatar", shortName.charAt(0) || "?");
    setText("userName", role.name);
    setText("userRoleTitle", role.title);
    setText("profileCardName", role.name);
    setText("profileCardTitle", role.title);
    setText("profileCardOrg", (role.org || role.group) + " · สำนักงาน ป.ป.ท.");
  }

  /* เตือนเมื่อเปิดหน้าด้วยบทบาทที่ไม่ใช่เจ้าของขั้นตอนนั้น (ดูได้ แต่เซ็นแทนไม่ได้) */
  function guardRole(expectedRoleId, roleTitle) {
    if (currentRoleId() === expectedRoleId) return true;
    const cur = currentRole();
    Swal.fire({
      icon: "warning",
      title: "บทบาทไม่ตรงกับขั้นตอนนี้",
      html:
        '<div class="emd-summary">' +
        "<p>ขั้นตอนนี้เป็นของ <strong>" + roleTitle + "</strong></p>" +
        "<p>ขณะนี้เข้าสู่ระบบด้วยบทบาท <strong>" + (cur ? cur.title : "-") + "</strong></p>" +
        "<p>ระบบเปิดให้ดูเอกสารได้ แต่ไม่สามารถลงนามแทนบทบาทอื่นได้</p>" +
        "</div>",
      confirmButtonColor: "#1e3a8a",
      confirmButtonText: "รับทราบ",
    });
    return false;
  }

  function goInbox() {
    window.location.href = "01-work-inbox.html";
  }

  /* โหมดดูอย่างเดียว — inbox ลิงก์ eye icon มาที่หน้าขั้นตอนปัจจุบันของเคสพร้อม
     ?view=1 เมื่อไม่ใช่คิวของบทบาทตัวเอง (แทนที่จะพาไปหน้าอื่นที่ไม่เกี่ยวข้อง)
     ปิดช่องกรอกทั้งหมดใน #pageBody + ปุ่มเซ็น/ยืนยัน ไม่ต้อง guardRole ซ้ำ
     คืนค่า true ถ้าอยู่ในโหมดนี้ (ให้หน้าเรียกข้าม guardRole ได้) */
  function applyViewOnlyMode() {
    const isView = new URLSearchParams(window.location.search).get("view") === "1";
    if (!isView) return false;

    const pageBody = document.getElementById("pageBody");
    if (!pageBody || !pageBody.parentNode) return true;

    const banner = document.createElement("div");
    banner.className = "view-only-banner";
    banner.innerHTML =
      '<i class="fa-solid fa-eye"></i><span>โหมดดูอย่างเดียว — ไม่สามารถลงนามหรือบันทึกได้ในหน้านี้</span>';
    pageBody.parentNode.insertBefore(banner, pageBody);

    pageBody.querySelectorAll("input, textarea, select").forEach(function (el) {
      el.disabled = true;
    });
    pageBody.querySelectorAll(".btn-primary").forEach(function (btn) {
      btn.disabled = true;
      btn.classList.add("btn-disabled-view");
    });
    pageBody.querySelectorAll(".decision-card").forEach(function (card) {
      card.classList.add("btn-disabled-view");
    });

    return true;
  }

  /* แถบขั้นตอน — แต่ละสายงาน (Part 1 / 1b / 5–6) เป็นเส้นตรง แสดงเฉพาะสายที่ขั้นนั้นสังกัด */
  function renderStepper(containerId, currentCode, endCode) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let flow = flowOf(currentCode);
    const curIdx = flow.findIndex(function (s) { return s.code === currentCode; });
    if (endCode) {
      const endIdx = flow.findIndex(function (s) { return s.code === endCode; });
      if (endIdx >= 0) flow = flow.slice(0, endIdx + 1);
    }
    el.innerHTML = flow.map(function (step, i) {
      const cls = i < curIdx ? "completed" : i === curIdx ? "active" : "";
      const inner = i < curIdx ? '<i class="fa-solid fa-check"></i>' : String(i + 1);
      return (
        '<div class="step-item ' + cls + '" title="' + step.label + '">' +
        '<div class="step-circle">' + inner + "</div>" +
        '<div class="step-label">' + step.stepName + "</div>" +
        "</div>"
      );
    }).join("");
  }

  /* สร้าง HTML ของบรรทัด "ขั้นตอนถัดไป" ใต้ stepper-card — รับ statusCode ที่ขั้น
     ปัจจุบันจะเขียนไว้ (หรือ statusCode ของสาขาที่ตัดสินใจแล้ว) แล้วไล่หา
     ขั้นถัดไปจาก ROUTES ถ้ายังไม่มีหน้าที่ build (ROUTES ไม่มี entry) จะ fallback
     ไปใช้ opts.fallbackLabel ที่ผู้เรียกระบุเอง (บอกว่าขั้นถัดไปคืออะไรตามผัง
     แม้ยังไม่ implement) opts.prefix ใส่ป้ายกำกับ เช่น ชื่อสาขาที่เลือกไว้ */
  function nextStepNoteHtml(statusCode, opts) {
    const cfg = opts || {};
    const prefixHtml = cfg.prefix ? " (" + cfg.prefix + ")" : "";
    const page = ROUTES[statusCode];
    if (page) {
      const step = stepByPage(page);
      if (step) {
        return (
          "ขั้นตอนถัดไป" + prefixHtml + ": <strong>" + step.roleTitle +
          "</strong> — " + step.label
        );
      }
    }
    if (cfg.fallbackLabel) {
      return (
        "ขั้นตอนถัดไป" + prefixHtml + ": " + cfg.fallbackLabel +
        " <em>(ยังไม่ implement ในระบบ)</em>"
      );
    }
    return "";
  }

  /* เมนูข้างซ้าย — แสดงเฉพาะขั้นตอน 10-3-xx ที่บทบาทนั้นรับผิดชอบ (ไม่รวม
     02-board-intake.html เพราะเป็นหน้ารับเรื่องกลางที่ใช้ร่วมกับหมวดอื่น) */
  function renderSidebarMenu(containerId, activePage) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const roleId = currentRoleId();
    const mine = ALL_STEPS.filter(function (s) {
      return s.role === roleId && s.page.indexOf("10-3") === 0;
    });
    const items = [
      '<li' + (activePage === "01-work-inbox.html" ? ' class="active"' : "") +
        '><a href="01-work-inbox.html"><i class="fa-solid fa-scale-balanced"></i> ' +
        "<span>งานกฎหมายในทางคดี</span></a></li>",
    ].concat(
      mine.map(function (s) {
        return (
          "<li" + (s.page === activePage ? ' class="active"' : "") +
          '><a href="' + s.page + '"><i class="fa-solid fa-file-pen"></i> ' +
          "<span>" + s.label + "</span></a></li>"
        );
      }),
    );
    el.innerHTML = items.join("");
  }

  /* --------------------------------------------------------- RICH EDITOR
     Tiptap แบบขั้นต่ำ (ตัวหนา/ตัวเอียง/บูลเลต/เลข) + แผงตัวอย่างเอกสารสด —
     คัดลอกจาก ecmis-10-2.js (loadEditorModules/mountEditor/...) มาไว้ที่นี่
     เพื่อให้ 10-3 self-contained เหมือนที่ทำกับ STEPS/สัญญาณลายเซ็นข้างต้น
     ใช้ที่ 10-3b-01-lawyer-draft-stay-objection.html (LAW0097) */
  let editorModulesPromise = null;
  function loadEditorModules() {
    if (!editorModulesPromise) {
      editorModulesPromise = Promise.all([
        import("https://esm.sh/@tiptap/core@2.9.1"),
        import("https://esm.sh/@tiptap/starter-kit@2.9.1"),
        import("https://esm.sh/@tiptap/extension-placeholder@2.9.1"),
      ]);
    }
    return editorModulesPromise;
  }

  const richEditors = new Map();

  /* opts: { placeholder, initialHTML, toolbarId, onUpdate(editor) } */
  function mountEditor(containerId, opts) {
    const cfg = opts || {};
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve(null);
    el.classList.add("l3-tiptap");

    return loadEditorModules().then(function (mods) {
      const Core = mods[0];
      const StarterKit = mods[1].default || mods[1].StarterKit;
      const Placeholder = mods[2].default || mods[2].Placeholder;

      const editor = new Core.Editor({
        element: el,
        extensions: [
          StarterKit.configure({
            heading: false,
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
          }),
          Placeholder.configure({ placeholder: cfg.placeholder || "" }),
        ],
        content: cfg.initialHTML || "",
        onUpdate: function () {
          if (cfg.onUpdate) cfg.onUpdate(editor);
        },
      });

      richEditors.set(containerId, editor);
      if (cfg.toolbarId) bindEditorToolbar(cfg.toolbarId, editor);
      return editor;
    });
  }

  function bindEditorToolbar(toolbarId, editor) {
    const bar = document.getElementById(toolbarId);
    if (!bar) return;
    const buttons = bar.querySelectorAll("[data-cmd]");
    const refresh = function () {
      buttons.forEach(function (btn) {
        btn.classList.toggle("is-active", editor.isActive(btn.getAttribute("data-cmd")));
      });
    };
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cmd = btn.getAttribute("data-cmd");
        const chain = editor.chain().focus();
        if (cmd === "bold") chain.toggleBold().run();
        else if (cmd === "italic") chain.toggleItalic().run();
        else if (cmd === "bulletList") chain.toggleBulletList().run();
        else if (cmd === "orderedList") chain.toggleOrderedList().run();
        refresh();
      });
    });
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    refresh();
  }

  function getEditorText(containerId) {
    const editor = richEditors.get(containerId);
    return editor ? editor.getText().trim() : "";
  }

  function getEditorHTML(containerId) {
    const editor = richEditors.get(containerId);
    return editor ? editor.getHTML() : "";
  }

  /* ------------------------------------------------------ DOC PREVIEW VIEWER
     ตัวช่วยของแถบเครื่องมือ "ตัวอย่างเอกสารสด" (.l3-doc-viewer) — ซูมและเลื่อน
     โฟกัสไปฟอร์ม (ฟอร์มยังเป็นแหล่งข้อมูลจริงหนึ่งเดียว ตัวอย่างเป็น read-only เสมอ) */
  const docZoomLevels = new Map();

  function zoomDoc(pageId, direction) {
    const el = document.getElementById(pageId);
    if (!el) return;
    const current = docZoomLevels.get(pageId) || 0.5;
    const next = Math.min(1.5, Math.max(0.3, current + direction * 0.1));
    docZoomLevels.set(pageId, next);
    el.style.zoom = String(next);
    const label = document.getElementById(pageId + "ZoomVal");
    if (label) label.textContent = Math.round(next * 100) + "%";
  }

  function initDocZoom(pageId, startZoom) {
    const el = document.getElementById(pageId);
    if (!el) return;
    const z = startZoom || 0.5;
    docZoomLevels.set(pageId, z);
    el.style.zoom = String(z);
    const label = document.getElementById(pageId + "ZoomVal");
    if (label) label.textContent = Math.round(z * 100) + "%";
  }

  function setDocViewMode(btnEl) {
    const bar = btnEl.closest(".l3-doc-viewmode");
    if (!bar) return;
    bar.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("is-active", b === btnEl);
    });
  }

  function focusFirstField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el.matches("input, textarea, select, [contenteditable]")
        ? el
        : el.querySelector("input, textarea, select, [contenteditable]");
    if (focusable && typeof focusable.focus === "function") {
      window.setTimeout(function () { focusable.focus(); }, 300);
    }
  }

  /* -------------------------------------------------------------- EXPORTS */
  global.Activity103 = Activity103;
  global.ECMIS103 = {
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    currentRoleId: currentRoleId,
    currentRole: currentRole,
    signerLabel: signerLabel,
    openSignatureModal: openSignatureModal,
    initUserProfile: initUserProfile,
    guardRole: guardRole,
    applyViewOnlyMode: applyViewOnlyMode,
    setText: setText,
    setHtml: setHtml,
    goInbox: goInbox,
    renderStepper: renderStepper,
    nextStepNoteHtml: nextStepNoteHtml,
    renderSidebarMenu: renderSidebarMenu,
    renderAttachments: renderAttachments,
    renderPartyList: renderPartyList,
    mockOpenFile: mockOpenFile,
    mountEditor: mountEditor,
    getEditorText: getEditorText,
    getEditorHTML: getEditorHTML,
    zoomDoc: zoomDoc,
    initDocZoom: initDocZoom,
    setDocViewMode: setDocViewMode,
    focusFirstField: focusFirstField,
  };
})(window);
