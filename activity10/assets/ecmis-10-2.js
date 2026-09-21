/**
 * E-CMIS กิจกรรมที่ 10.2 — คำขอเปิดเผยข้อมูลข่าวสาร (มติคณะอนุกรรมการกลั่นกรอง)
 * Shared runtime for the 10-2-*.html step pages.
 *
 * Covers LAW0037–LAW0047 of the AS-IS swimlane. Everything the step pages have
 * in common lives here instead of being copy-pasted per page the way the 10.1
 * pages do it: the workflow table, signature routing, the signature pad modal
 * and the Thai speech-to-text button.
 *
 * Depends on: ecmis-app.js (ECMIS.ROLES), ecmis-activity10.js (Activity10 store),
 * SweetAlert2, Bootstrap 5 CSS (signature modal layout only).
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ FLOW
     One entry per step. `status`/`statusCode` are what the PREVIOUS page
     writes onto the case, so 01-work-inbox.html can route it to whoever
     acts next. */
  const STEPS = [
    {
      code: "LAW0037",
      seq: 6,
      page: "02-board-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณาสั่งการ",
      statusCode: "L2_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการกองกฎหมาย ลงทะเบียนรับเรื่องและเสนอ ผอ.กองกฎหมาย",
      stepName: "ธุรการ ลงทะเบียนรับเรื่อง",
    },
    {
      code: "LAW0038",
      seq: 7,
      page: "10-2-01-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานความเห็นแย้งตรวจประเด็นกฎหมาย",
      statusCode: "L2_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย พิจารณาสั่งการและมอบหมายงาน",
      stepName: "ผอ.กอง สั่งการ",
    },
    {
      code: "LAW0039",
      seq: 8,
      page: "10-2-02-group-director-assign.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ฝ่ายเลขานุการฯ จัดทำรายงานความเห็น",
      statusCode: "L2_PENDING_SECRETARIAT_OPINION",
      label: "ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบประเด็นกฎหมายและมอบหมาย",
      stepName: "ผอ.กลุ่มงาน มอบหมาย",
    },
    {
      code: "LAW0040",
      seq: 9,
      page: "10-2-03-secretariat-opinion.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กลุ่มงานความเห็นแย้งตรวจความครบถ้วน",
      statusCode: "L2_PENDING_GROUP_VERIFY",
      label: "ฝ่ายเลขานุการฯ จัดทำรายงานความเห็นเสนอคณะอนุกรรมการฯ",
      stepName: "เลขานุการฯ จัดทำความเห็น",
    },
    {
      code: "LAW0041",
      seq: 10,
      page: "10-2-04-group-director-verify.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ฝ่ายเลขานุการฯ บรรจุวาระและนัดหมายประชุม",
      statusCode: "L2_PENDING_AGENDA",
      label: "ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบความครบถ้วนของประเด็นกฎหมาย",
      stepName: "ผอ.กลุ่มงาน ตรวจครบถ้วน",
    },
    {
      code: "LAW0042-0043",
      seq: 11,
      page: "10-2-05-secretariat-agenda.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "คณะอนุกรรมการฯ พิจารณาตามระเบียบวาระ",
      statusCode: "L2_PENDING_SUBCOMMITTEE",
      label: "ฝ่ายเลขานุการฯ บรรจุวาระ นัดหมายและจัดส่งเอกสารประกอบการประชุม",
      stepName: "เลขานุการฯ บรรจุวาระ",
    },
    {
      code: "LAW0044",
      seq: 13,
      page: "10-2-06-subcommittee-resolution.html",
      role: "subcommittee_screen",
      roleTitle: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ธุรการกองกฎหมายรับเรื่อง",
      statusCode: "L2_PENDING_RESOLUTION_DOC",
      label: "คณะอนุกรรมการฯ พิจารณาตามระเบียบวาระและมีมติที่ประชุม",
      stepName: "คณะอนุกรรมการฯ มีมติ",
    },
    /* สองขั้นตอน (ธุรการกองกฎหมาย -> ผอ.กองกฎหมาย) หลังคณะอนุกรรมการฯ มีมติแล้ว
       (10-2-06) ก่อนฝ่ายเลขานุการฯ จะร่างบันทึกข้อความที่ 10-2-07 — ธุรการแค่รับเรื่อง
       (ไม่ลงนาม) ส่วน ผอ.กองมอบหมายฝ่ายเลขานุการฯ ไม่มีการเปลี่ยนแปลงมติ/สถานะคดีใดๆ */
    {
      code: "L2-ADMIN-PRECOMMENT",
      seq: 12,
      page: "10-2-33-legal-admin-comment.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผู้อำนวยการกองกฎหมายมอบหมาย",
      statusCode: "L2_PENDING_DIRLEGAL_PRECOMMENT",
      label: "ธุรการกองกฎหมาย รับเรื่อง (ไม่ลงนาม)",
      stepName: "ธุรการ รับเรื่อง",
    },
    {
      code: "L2-DIRLEGAL-PRECOMMENT",
      seq: 12,
      page: "10-2-34-legal-director-comment.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ฝ่ายเลขานุการฯ ทำบันทึกผลมติเลขา",
      statusCode: "L2_PENDING_SECRETARIAT_DRAFT",
      label: "ผู้อำนวยการกองกฎหมาย มอบหมายฝ่ายเลขานุการฯ",
      stepName: "ผอ.กอง มอบหมาย",
    },
    {
      code: "LAW0045-0046",
      seq: 14,
      page: "10-2-07-secretariat-resolution-doc.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      /* แก้ตามต้นฉบับจริง (มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิก.docx) — ผู้จัดทำ
         บันทึกเป็นผู้ลงนามในฐานะผู้เสนอเรื่องเองที่หน้านี้เลย ("อนุกรรมการและ
         เลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ" ท้ายหน้า 1 ของเอกสาร) ไม่ใช่
         ผอ.กองกฎหมายเซ็นแทนแบบเดิม — ผอ.กองกฎหมายมีหน้าที่แค่ให้ความเห็น ๕
         (ต่อจากนี้ที่ 10-2-08) เท่านั้น */
      status: "ผอ.กองกฎหมายพิจารณาให้ความเห็น (๕)",
      statusCode: "L2_PENDING_DIRLEGAL_OPINION",
      label: "ฝ่ายเลขานุการฯ ทำบันทึกผลมติเลขา (ออกเลขหนังสือส่งภายในและลงนามในฐานะผู้เสนอเรื่อง)",
      stepName: "เลขานุการฯ ทำบันทึกผลมติเลขา",
    },
    {
      code: "LAW0045.1",
      seq: 15,
      page: "10-2-08-legal-director-propose.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      /* เดิมหน้านี้ "ลงนามในฐานะผู้เสนอเรื่อง" ซึ่งผิดจากต้นฉบับจริง — ที่ถูกคือ
         ผอ.กองกฎหมายให้ "๕. ความเห็นผู้อำนวยการกองกฎหมาย" (บล็อกที่ 1 จาก 3
         บล็อกความเห็นในหน้า 2 ของเอกสาร) แล้วลงนามกำกับความเห็นของตัวเอง
         เท่านั้น ไม่ใช่ลงนามแทนผู้เสนอเรื่อง */
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอผู้บริหาร",
      statusCode: "L2_PENDING_DISPATCH",
      label: "ผอ.กองกฎหมาย ให้ความเห็น (๕) และลงนาม",
      stepName: "ผอ.กอง ให้ความเห็น+ลงนาม",
    },
    {
      /* ขั้นตอนนี้ไม่มีรหัส LAW ในผัง AS-IS10.2-swimlane-split.drawio เดิม
         (ผังเดิมข้ามจากผู้เสนอเรื่องไปที่ LAW0047 รองเลขาธิการฯ ลงนามเห็นชอบ
         โดยตรง) เพิ่มขั้นนี้ใหม่ตามคำขอ ให้สอดคล้องกับรูปแบบของกิจกรรม 10.1
         ที่มีขั้นธุรการออกเลขส่งคั่นระหว่างผู้อำนวยการลงนามกับส่งเสนอผู้บริหาร
         (ดู 09-legal-admin-dispatch.html) — ธุรการเลือกได้ว่าจะส่งต่อให้
         รองเลขาธิการ (ปฏิบัติราชการแทนเลขาธิการ, ข้อ ๖) หรือเลขาธิการโดยตรง
         (ข้อ ๗) ตามหลักการมอบอำนาจที่ระบุไว้ใน ROLES ของ secgen — ค่า default
         ของ step นี้คือสาย DEPUTY (auto-reduce ใช้อ้างอิง ROUTES ด้านล่าง) สาย
         SECGEN เป็น route ที่เติมด้วยมือ */
      code: "L2-DISPATCH",
      seq: 16,
      page: "10-2-09-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย พิจารณาให้ความเห็น (๖) และลงนาม",
      statusCode: "L2_PENDING_DEPUTY_SG_OPINION",
      label: "ธุรการกองกฎหมาย ออกเลขส่งและเสนอผู้บริหาร (เลือกรองเลขาธิการหรือเลขาธิการ)",
      stepName: "ธุรการ ออกเลขส่ง",
    },
    {
      /* ๖. ความเห็นรองเลขาธิการคณะกรรมการ ป.ป.ท. — เกิดขึ้นเฉพาะคำร้องที่
         ธุรการเลือกส่งต่อรองเลขาธิการ (ปฏิบัติราชการแทนเลขาธิการ) ที่ 10-2-09
         ลงนามแล้วจบสาย (ไม่ต้องผ่านเลขาธิการอีกในกรณีมอบอำนาจ) */
      code: "L2-DEPUTY-SG-OPINION",
      seq: 17,
      page: "10-2-32-deputy-sg-opinion-sign.html",
      role: "deputy_sg",
      roleTitle: "รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
      statusCode: "L2_DEPUTY_SG_RESOLVED",
      label: "รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย ให้ความเห็น (๖) และลงนาม (ปฏิบัติราชการแทนเลขาธิการ)",
      stepName: "รองเลขาธิการฯ ให้ความเห็น+ลงนาม",
      approvalBranch: ["DEPUTY"],
    },
    {
      /* ๗. ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท. — เกิดขึ้นเฉพาะคำร้องที่ธุรการ
         เลือกส่งต่อเลขาธิการโดยตรง (ไม่ผ่านการมอบอำนาจ) ที่ 10-2-09 อ้างอิง
         นิยามบทบาท secgen ใน assets/ecmis-app.js (โมดูลกิจกรรมที่ 7.1) ที่ระบุ
         ว่า "เลขาธิการฯ เป็นชั้นอนุมัติเดียว ไม่มีสายลำดับชั้นต่อจากนี้" — เป็น
         เพียงบล็อกความเห็น+ลงนามตามต้นฉบับจริงเท่านั้น (ไม่มี UI เลือกมติ/
         สถานะคดี/แนบไฟล์เพิ่มเติม — เอกสารต้นฉบับไม่มีช่องเหล่านี้ มติยังคง
         ยึดตามที่คณะอนุกรรมการฯ บันทึกไว้ที่ 10-2-06 เสมอ ไม่มีการเขียนทับ) */
      code: "L2-SECGEN-OPINION",
      seq: 18,
      page: "10-2-31-secgen-opinion-sign.html",
      role: "secgen",
      roleTitle: "เลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
      statusCode: "L2_SECGEN_RESOLVED",
      label: "เลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย ให้ความเห็น (๗) และลงนาม",
      stepName: "เลขาธิการฯ ให้ความเห็น+ลงนาม",
      approvalBranch: ["SECGEN"],
    },

    /* ---------------------------------------------------------- PART 2
       LAW0049 เป็นต้นไป — รับผลจากสายการเห็นชอบ (๕ ผอ.กองกฎหมาย → ๖ รองเลขาธิการ
       หรือ ๗ เลขาธิการ) แล้วแจ้งผลผู้ยื่นคำขอ ผังแยก 3 เส้นทางตามมติที่คณะ
       อนุกรรมการฯ บันทึกไว้ตั้งแต่ 10-2-06 เสมอ (c.l2ResolutionType — สายการ
       เห็นชอบข้างต้นไม่เขียนทับค่านี้): DISCLOSE/PARTIAL ไปเส้นทางร่วม
       (10-2-11 ถึง 10-2-14, ไฟล์ชื่อมีคำว่า disclose-partial ยกเว้น 10-2-12
       ที่เป็น partial ล้วนเพราะเกิดเฉพาะ PARTIAL), DENY ไปอีกเส้นทางที่มีรอบเสนอคณะกรรมการฯ ซ้อนอยู่
       (10-2-15 ถึง 10-2-20) เพราะไม่เปิดเผยข้อมูลต้องผ่านมติคณะกรรมการเต็มคณะ
       ไม่ใช่แค่เลขาธิการที่ได้รับมอบอำนาจ

       ตาราง ROUTES ด้านล่างสร้างจากลำดับ index ในอาเรย์นี้โดยอัตโนมัติ ซึ่งเดิน
       ตามเส้นทางหลัก (DISCLOSE/PARTIAL) ได้พอดี ส่วนจุดที่แยกสาขา (หลัง
       L2-RECEIVE-OUTCOME และหลัง L2-NOTICE-DRAFT) แต่ละหน้าจะกำหนด statusCode
       จริงตอนบันทึกเอง (ไม่ใช้ค่า default ของ step) แล้วเติม ROUTES ที่ขาดไว้
       ด้วยมือถัดจากตารางนี้ — ดูคอมเมนต์ตรง const ROUTES ด้านล่าง

       includeIf: จำกัดว่าขั้นตอนนี้จะขึ้นในแถบขั้นตอน (stepper) ของคำร้องที่มี
       l2ResolutionType อยู่ในลิสต์นี้เท่านั้น (ไม่ระบุ = ขึ้นทุกคำร้อง) */
    {
      code: "L2-RECEIVE-OUTCOME",
      seq: 18,
      page: "10-2-10-legal-admin-receive-outcome.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติ",
      statusCode: "L2_PENDING_NOTICE_DRAFT",
      label: "ธุรการกองกฎหมาย รับทราบมติเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมายและส่งต่อ",
      stepName: "ธุรการ รับทราบมติ",
    },
    {
      code: "L2-DENY-MEMO",
      seq: 22,
      page: "10-2-15-secretariat-deny-memo.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กองกฎหมายพิจารณาเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_DENY_PROPOSE",
      label: "[ไม่อนุญาต] ฝ่ายเลขานุการฯ จัดทำบันทึกและมติไม่อนุญาตเปิดเผยข้อมูล ลงนาม และออกเลขหนังสือส่งภายใน",
      stepName: "[ไม่อนุญาต] เลขานุการฯ จัดทำบันทึกมติ",
      includeIf: ["DENY"],
    },
    {
      /* เดิม step นี้ทำทั้งลงนามและ "ส่ง" กิจกรรมที่ 7 ในหน้าเดียว — แก้ตามที่
         ตรวจสอบ pattern ของ LAW0045.1/L2-DISPATCH ข้างบนแล้วพบว่าทุกจุดที่ส่ง
         เรื่องออกไปกิจกรรมที่ 7 ธุรการกองกฎหมายจะเป็นผู้กดส่งเสมอ (ผอ.กองกฎหมาย
         ลงนามในฐานะผู้เสนอเรื่องเท่านั้น) จึงแยกเป็น 2 ขั้นเหมือนคู่ 10-2-08/09 */
      code: "L2-DENY-PROPOSE",
      seq: 23,
      page: "10-2-16-legal-director-deny-propose.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_DENY_DISPATCH_COMMITTEE",
      label: "[ไม่อนุญาต] ผอ.กองกฎหมาย ลงนามในฐานะผู้เสนอเรื่อง (มติไม่อนุญาตเปิดเผยข้อมูล)",
      stepName: "[ไม่อนุญาต] ผอ.กอง ลงนามเสนอ",
      includeIf: ["DENY"],
    },
    {
      /* คู่กับ L2-DISPATCH (10-2-09) ข้างบน — ธุรการกองกฎหมายเป็นผู้ออกเลขส่ง
         เดิมขั้นนี้ส่งเรื่องต่อไปกิจกรรมที่ 7 (คณะกรรมการ ป.ป.ท. เต็มคณะ) อีกรอบ
         แต่แก้ให้ตรงกับผังเดิม (drawio หน้า 3, LAW0049–LAW0052) ซึ่งไม่มีรอบเสนอ
         คณะกรรมการซ้ำ — ธุรการกองกฎหมายออกเลขส่งหนังสือแจ้งมติแล้วมอบหมายให้
         กอง/สำนักเจ้าของสำนวนไปดำเนินการแจ้งผู้ยื่นคำขอและแจ้งสิทธิ์อุทธรณ์เอง
         (LAW0052) เป็นขั้นตอนสุดท้ายของ flow นี้ — เดิมมี L2-DENY-RECEIVE/
         L2-DENY-NOTICE-DRAFT/L2-DENY-REDACTION/L2-DENY-DISPATCH ต่อจากนี้อีก 4
         ขั้น (10-2-18 ถึง 21) ซึ่งสร้างขึ้นสำหรับรอบเสนอคณะกรรมการซ้ำที่ตัดออกแล้ว
         จึงลบทั้ง 4 ขั้นและไฟล์ที่เกี่ยวข้องออกจากระบบ */
      code: "L2-DENY-DISPATCH-COMMITTEE",
      seq: 24,
      page: "10-2-17-legal-admin-deny-dispatch-committee.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "สิ้นสุด — มอบหมายกอง/สำนักเจ้าของสำนวนแล้ว",
      statusCode: "L2_CASE_CLOSED_DENY_ASSIGNED",
      label: "[ไม่อนุญาต] ธุรการกองกฎหมาย ออกเลขส่งและมอบหมายกอง/สำนักเจ้าของสำนวนดำเนินการแจ้งผล",
      stepName: "[ไม่อนุญาต] ธุรการ ส่งมอบกอง",
      includeIf: ["DENY"],
    },

    /* ---------------------------------------------------------- FLOW 3
       DISCLOSE/PARTIAL + คดีเสร็จสิ้นแล้ว (l2CaseState === "CLOSED") — เดิมไม่มี
       ไฟล์ของสายนี้เลย (ดู docs/10-2-flow-by-board-resolution.md) ทุกคำร้อง
       DISCLOSE/PARTIAL เดินสาย "อยู่ระหว่างไต่สวน" (L2-NOTICE-DRAFT ฯลฯ ด้านบน)
       เหมือนกันหมด — เพิ่มสายนี้แบบย่อ (จบด้วยมอบหมายกอง/สำนักเจ้าของสำนวน) ตาม
       รูปแบบเดียวกับสาย DENY ด้านบน แทนที่จะสร้างครบ 11 ขั้นของผังเดิม
       (LAW0058–LAW0068) เพราะมีรอบเสนอคณะกรรมการฯ ซ้ำแบบเดียวกับที่สาย DENY
       ตัดออกไปแล้ว */
    {
      code: "L2-CLOSE-MEMO",
      seq: 25,
      page: "10-2-22-secretariat-close-memo.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กองกฎหมายพิจารณาเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_CLOSE_PROPOSE",
      label: "[คดีเสร็จสิ้นแล้ว] ฝ่ายเลขานุการฯ จัดทำบันทึกและมติเปิดเผยข้อมูล ลงนาม และออกเลขหนังสือส่งภายใน",
      stepName: "[คดีเสร็จสิ้นแล้ว] เลขานุการฯ จัดทำบันทึกมติ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["CLOSED"],
    },
    {
      code: "L2-CLOSE-PROPOSE",
      seq: 26,
      page: "10-2-23-legal-director-close-propose.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_CLOSE_DISPATCH_COMMITTEE",
      label: "[คดีเสร็จสิ้นแล้ว] ผอ.กองกฎหมาย ลงนามในฐานะผู้เสนอเรื่อง",
      stepName: "[คดีเสร็จสิ้นแล้ว] ผอ.กอง ลงนามเสนอ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["CLOSED"],
    },
    {
      code: "L2-CLOSE-DISPATCH-COMMITTEE",
      seq: 27,
      page: "10-2-24-legal-admin-close-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "สิ้นสุด — มอบหมายกอง/สำนักเจ้าของสำนวนแล้ว",
      statusCode: "L2_CASE_CLOSED_DISCLOSE_ASSIGNED",
      label: "[คดีเสร็จสิ้นแล้ว] ธุรการกองกฎหมาย ออกเลขส่งและมอบหมายกอง/สำนักเจ้าของสำนวนดำเนินการแจ้งผล",
      stepName: "[คดีเสร็จสิ้นแล้ว] ธุรการ ส่งมอบกอง",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["CLOSED"],
    },

    /* ---------------------------------------------------------- FLOW 2 PART 1
       DISCLOSE/PARTIAL + อยู่ระหว่างไต่สวน (l2CaseState === "INVESTIGATING") —
       เดิม 10-2-10 ส่งตรงไป L2-NOTICE-DRAFT (10-2-11) เลย ตอนนี้เพิ่มรอบเสนอ
       กิจกรรมที่ 7 อีกครั้งก่อน (บันทึกเสนอเลขาธิการ + ผอ.กองกฎหมายให้ความเห็น
       แล้วธุรการกองกฎหมายออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท. ต่อทันที — ตัดขั้นตอน
       รองเลขาธิการฯ/เลขาธิการฯ ให้ความเห็นแยกออกแล้ว ดูเหตุผลที่
       docs/10-2-flow2-part1-committee-referral.md) ตามเอกสารต้นแบบใน
       docs/10.2 mockup/Part 1 - new 2/ และ Part 2 - new 1/ ผ่าน
       L2_READY_FOR_BOARD_ROUND2 (holding, รอผลจริงจากกิจกรรมที่ 7) แล้วจบที่
       L2-RECEIVE-BOARD-ROUND2 (10-2-30) ซึ่งส่งต่อเข้า L2-NOTICE-DRAFT (10-2-11)
       ที่ใช้ร่วมกับทุกสาย DISCLOSE/PARTIAL อยู่แล้ว */
    {
      code: "L2-COMMITTEE-MEMO-DRAFT",
      seq: 28,
      page: "10-2-25-secretariat-committee-memo-draft.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กลุ่มงานความเห็นแย้งพิจารณาอนุมัติ",
      statusCode: "L2_PENDING_COMMITTEE_DIRECTOR_OPINION",
      label: "[อยู่ระหว่างไต่สวน] ฝ่ายเลขานุการฯ จัดทำมติคณะอนุกรรมการกลั่นกรองและบันทึกเสนอเลขาธิการ ลงนามในฐานะผู้เสนอเรื่อง",
      stepName: "[อยู่ระหว่างไต่สวน] เลขานุการฯ จัดทำมติ+บันทึก",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    /* ขั้นตอนใหม่ — ผอ.กลุ่มงานความเห็นแย้งอนุมัติก่อน แล้วจึงส่งต่อ ผอ.กองกฎหมาย
       (10-2-26) statusCode ขาเข้า "L2_PENDING_COMMITTEE_DIRECTOR_OPINION" คือค่า
       เดิมที่ 10-2-25 ส่งออกอยู่แล้ว (ไม่เปลี่ยน) — 10-2-26 เปลี่ยนไปรอ
       "L2_PENDING_COMMITTEE_DIRECTOR_OPINION_APPROVED" แทน (hardcode ทั้งคู่ ไม่ใช้
       auto-derive เพราะ 25/26/29 ใช้ hardcoded lookup ไม่ใช่ prev-lookup ทั่วไป) */
    {
      code: "L2-COMMITTEE-GROUP-APPROVE",
      seq: 29,
      page: "10-2-27-group-director-committee-approve.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ผอ.กองกฎหมายพิจารณาให้ความเห็น",
      statusCode: "L2_PENDING_COMMITTEE_DIRECTOR_OPINION_APPROVED",
      label: "[อยู่ระหว่างไต่สวน] ผอ.กลุ่มงานความเห็นแย้ง พิจารณาอนุมัติ",
      stepName: "[อยู่ระหว่างไต่สวน] ผอ.กลุ่มงาน อนุมัติ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-COMMITTEE-DIRECTOR-OPINION",
      seq: 29,
      page: "10-2-26-legal-director-committee-opinion.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท.",
      statusCode: "L2_PENDING_COMMITTEE_DISPATCH",
      label: "[อยู่ระหว่างไต่สวน] ผอ.กองกฎหมาย พิจารณาและให้ความเห็นในบันทึกเสนอเลขาธิการ",
      stepName: "[อยู่ระหว่างไต่สวน] ผอ.กอง ให้ความเห็น",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-COMMITTEE-DISPATCH",
      seq: 32,
      page: "10-2-29-legal-admin-committee-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "มติบอร์ด ตอบกลับแล้ว",
      statusCode: "L2_READY_FOR_BOARD_ROUND2",
      label: "[อยู่ระหว่างไต่สวน] ธุรการกองกฎหมาย ออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท.",
      stepName: "[อยู่ระหว่างไต่สวน] ธุรการ ส่งกิจกรรมที่7",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      /* Part 2 ของรอบเสนอกิจกรรมที่ 7 ครั้งที่ 2 (เดิมทำเครื่องหมายว่ายังไม่ได้
         สร้าง — ดู docs/10-2-flow2-part1-committee-referral.md) เพิ่มเข้ามาเป็น
         ขั้นสุดท้ายของรอบนี้ ก่อนส่งต่อเข้า L2-NOTICE-DRAFT (10-2-11) ที่ใช้ร่วมกัน
         ทุกสาย DISCLOSE/PARTIAL อยู่แล้ว — mirrors L2-RECEIVE-OUTCOME (10-2-10) แต่
         ตัดการเลือก resolution/case state ออกเพราะค่าล็อกไว้ตั้งแต่ 10-2-06 แล้ว
         ไม่มีการแยกสาขาใหม่ที่ขั้นนี้ */
      code: "L2-RECEIVE-BOARD-ROUND2",
      seq: 33,
      page: "10-2-30-legal-admin-receive-board-round2.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายรับทราบมติคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_DIRLEGAL_BOARD_ACK",
      label: "[อยู่ระหว่างไต่สวน] ธุรการกองกฎหมาย รับมติจากกิจกรรมที่ 7",
      stepName: "[อยู่ระหว่างไต่สวน] ธุรการ รับมติ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    /* สองขั้นตอนใหม่ — ผอ.กองกฎหมาย รับทราบมติคณะกรรมการ ป.ป.ท. ก่อน (ตามที่ธุรการ
       บันทึกไว้ที่ 10-2-30) แล้วจึงส่งต่อ ผอ.กลุ่มงานความเห็นแย้ง รับทราบ ก่อนมอบให้
       ฝ่ายเลขานุการคณะอนุกรรมการฯ จัดทำหนังสือแจ้งมติต่อไปที่ 10-2-11 — statusCode
       ขาออกของขั้นที่สอง ("L2_PENDING_NOTICE_DRAFT") ซ้ำกับของ L2-RECEIVE-OUTCOME
       (10-2-10) โดยตั้งใจ เพราะทั้งคู่ต้องไปที่ 10-2-11 เหมือนกัน — ไม่ต่างจาก
       รูปแบบเดิมก่อนเพิ่ม 2 ขั้นนี้ (10-2-30 เคยใช้ค่าเดียวกันมาก่อนแล้ว) */
    {
      code: "L2-BOARD-DIRLEGAL-ACK",
      seq: 34,
      page: "10-2-35-legal-director-board-ack.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานความเห็นแย้งรับทราบมติคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_GROUPDIR_BOARD_ACK",
      label: "[อยู่ระหว่างไต่สวน] ผอ.กองกฎหมาย รับทราบมติคณะกรรมการ ป.ป.ท. และลงนาม",
      stepName: "[อยู่ระหว่างไต่สวน] ผอ.กอง รับทราบมติบอร์ด",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-BOARD-GROUPDIR-ACK",
      seq: 35,
      page: "10-2-36-group-director-board-ack.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติ",
      statusCode: "L2_PENDING_NOTICE_DRAFT",
      label: "[อยู่ระหว่างไต่สวน] ผอ.กลุ่มงานความเห็นแย้ง รับทราบมติคณะกรรมการ ป.ป.ท. และลงนาม",
      stepName: "[อยู่ระหว่างไต่สวน] ผอ.กลุ่มงาน รับทราบมติบอร์ด",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },

    /* ย้ายมาจากตำแหน่งเดิม (ติดกับ 10-2-10 โดยตรง) มาไว้ท้าย FLOW 2 PART 1
       ด้านบน — ตามลำดับเวลาจริงตอนนี้ INVESTIGATING ต้องผ่านรอบเสนอกิจกรรมที่ 7
       (10-2-25 ถึง 10-2-30) ก่อน แล้วจึงมาถึงหน้าแจ้งมติชุดนี้ทีหลัง การจัดลำดับใน
       STEPS มีผลต่อลำดับที่แสดงในแถบขั้นตอน (renderStepperV2 ใช้ตำแหน่งในอาเรย์
       กำหนดว่าอันไหน "เสร็จแล้ว/กำลังทำ/รอ") จึงต้องย้ายมาไว้ท้ายให้ตรงกับลำดับ
       เวลาจริง แม้ routing (ROUTES) จะยังทำงานถูกต้องอยู่แล้วก็ตาม */
    {
      code: "L2-NOTICE-DRAFT",
      seq: 18,
      page: "10-2-11-secretariat-disclose-partial-notice-draft.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กลุ่มงานความเห็นแย้งให้ความเห็นหนังสือแจ้งมติ",
      statusCode: "L2_PENDING_NOTICE_GROUPDIR_REVIEW",
      label: "[เปิดเผย/บางส่วน] ฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติเสนอผู้ยื่นคำขอ",
      stepName: "[เปิดเผย/บางส่วน] เลขานุการฯ ร่างหนังสือแจ้งมติ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-NOTICE-GROUPDIR-REVIEW",
      seq: 19,
      page: "10-2-37-group-director-notice-review.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ผอ.กองกฎหมายตรวจและลงนามหนังสือแจ้งมติ",
      statusCode: "L2_PENDING_NOTICE_SIGN",
      label: "[เปิดเผย/บางส่วน] ผอ.กลุ่มงานความเห็นแย้ง ให้ความเห็นและลงนามหนังสือแจ้งมติ",
      stepName: "[เปิดเผย/บางส่วน] ผอ.กลุ่มงาน ให้ความเห็น",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-NOTICE-SIGN",
      seq: 20,
      page: "10-2-13-legal-director-disclose-partial-notice-sign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการกองกฎหมายออกเลขส่งและแจ้งผลผู้ยื่นคำขอ",
      statusCode: "L2_PENDING_NOTICE_DISPATCH",
      label: "[เปิดเผย/บางส่วน] ผอ.กองกฎหมาย ตรวจและลงนามหนังสือแจ้งมติผู้ยื่นคำขอ",
      stepName: "[เปิดเผย/บางส่วน] ผอ.กอง ลงนามแจ้งมติ",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },
    {
      code: "L2-NOTICE-DISPATCH",
      seq: 21,
      page: "10-2-14-legal-admin-disclose-partial-notice-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "สิ้นสุด — แจ้งผลผู้ยื่นคำขอแล้ว",
      statusCode: "L2_CASE_CLOSED_NOTICE_SENT",
      label: "[เปิดเผย/บางส่วน] ธุรการกองกฎหมาย ออกเลขส่งและแจ้งผลผู้ยื่นคำขอ",
      stepName: "[เปิดเผย/บางส่วน] ธุรการ ส่งแจ้งผล",
      includeIf: ["DISCLOSE", "PARTIAL"],
      caseState: ["INVESTIGATING"],
    },

    /* ---------------------------------------------------------- FLOW 4
       อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล (Flow 4, drawio หน้า 6 "อุทธรณ์คำสั่ง"
       LAW0069-079) — เริ่มหลังสาย DENY ปิดสำนวนที่ L2-DENY-DISPATCH-COMMITTEE
       (10-2-17, L2_CASE_CLOSED_DENY_ASSIGNED) แล้วผู้ยื่นคำขอใช้สิทธิ์อุทธรณ์
       ดูรายละเอียดแผนเต็มที่ docs/10-2-flow4-appeal-plan.md */
    {
      /* จุดเริ่มต้นทางที่ 1: สาย "ส่วนกลาง" (ผัง TO-BE) — ธุรการกองบริหารคดีรับเรื่อง
         แล้วส่งต่อให้ ผอ.กองบริหารคดี (appeal-02) → ผอ.กลุ่มงานติดตามคดี (appeal-03)
         เลือก/มอบหมายนิติกรตามลำดับ (คนละสายกับ "เขต" ที่ส่งตรงถึงนิติกรได้เลย
         ดู L2-APPEAL-INTAKE-DISTRICT ด้านล่าง) — ทั้งสองสายมาบรรจบที่ precondition
         เดียวกันของ appeal-04 (L2_PENDING_CASE_OWNER_APPEAL_OPINION) */
      code: "L2-APPEAL-INTAKE",
      seq: 40,
      page: "10-2-appeal-01-legal-admin-intake.html",
      role: "case_bureau_admin",
      roleTitle: "ธุรการกองบริหารคดี",
      status: "ผอ.กองบริหารคดีพิจารณาเรื่องอุทธรณ์และมอบหมาย",
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_ASSIGN",
      label: "[อุทธรณ์] ธุรการกองบริหารคดี รับเรื่องอุทธรณ์และบันทึกเข้าสู่ระบบ (สายส่วนกลาง)",
      stepName: "[อุทธรณ์] ธุรการส่วนกลาง รับเรื่อง",
      includeIf: ["DENY"],
      intakeChannel: ["CENTRAL"],
    },
    {
      /* จุดเริ่มต้นทางที่ 2: สาย "เขต" (ผัง TO-BE) — เจ้าหน้าที่เขตรับเรื่องแล้วส่งตรง
         ถึงนิติกรเจ้าของสำนวนได้เลย ไม่ต้องผ่าน ผอ.กองบริหารคดี/ผอ.กลุ่มงานติดตามคดี
         มอบหมายเหมือนสายส่วนกลาง (สั้นกว่า 2 ขั้น) statusCode ชี้ตรงไปที่ precondition
         ของ appeal-04 จุดเดียวกับที่สายส่วนกลางมาบรรจบ */
      code: "L2-APPEAL-INTAKE-DISTRICT",
      seq: 41,
      page: "10-2-appeal-01b-district-intake.html",
      role: "district_admin",
      roleTitle: "เจ้าหน้าที่เขต",
      status: "นิติกรเจ้าของสำนวนแจ้งผู้อุทธรณ์และทำความเห็น",
      statusCode: "L2_PENDING_CASE_OWNER_APPEAL_OPINION",
      label: "[อุทธรณ์] เจ้าหน้าที่เขต รับเรื่องอุทธรณ์และบันทึกเข้าสู่ระบบ (สายเขต)",
      stepName: "[อุทธรณ์] ธุรการเขต รับเรื่อง",
      includeIf: ["DENY"],
      intakeChannel: ["DISTRICT"],
    },
    {
      code: "L2-APPEAL-BUREAU-ASSIGN",
      seq: 42,
      page: "10-2-appeal-02-case-bureau-director-assign.html",
      role: "case_bureau_director",
      roleTitle: "ผู้อำนวยการกองบริหารคดี",
      status: "ผอ.กลุ่มงานบริหารติดตามคดีพิจารณาและมอบหมายนิติกร",
      statusCode: "L2_PENDING_TRACKING_DIRECTOR_ASSIGN",
      label: "[อุทธรณ์] ผู้อำนวยการกองบริหารคดี พิจารณาเรื่องอุทธรณ์และมอบหมาย (สายส่วนกลาง)",
      stepName: "[อุทธรณ์] ผอ.กองบริหารคดี มอบหมาย",
      includeIf: ["DENY"],
      intakeChannel: ["CENTRAL"],
    },
    {
      /* ผลผลิตชี้ไปที่ precondition เดียวกับ L2-APPEAL-INTAKE-DISTRICT ด้านบน —
         ทั้งสองสายบรรจบที่นี่ก่อนเข้า appeal-04 */
      code: "L2-APPEAL-TRACKING-ASSIGN",
      seq: 43,
      page: "10-2-appeal-03-case-tracking-director-assign.html",
      role: "case_tracking_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานบริหารติดตามคดี",
      status: "นิติกรเจ้าของสำนวนแจ้งผู้อุทธรณ์และทำความเห็น",
      statusCode: "L2_PENDING_CASE_OWNER_APPEAL_OPINION",
      label: "[อุทธรณ์] ผู้อำนวยการกลุ่มงานบริหารติดตามคดี พิจารณาและมอบหมายนิติกร (สายส่วนกลาง)",
      stepName: "[อุทธรณ์] ผอ.กลุ่มงานติดตามคดี มอบหมายนิติกร",
      includeIf: ["DENY"],
      intakeChannel: ["CENTRAL"],
    },
    {
      /* เดิมส่งต่อฝ่ายเลขาฯ ให้จัดทำวาระ (appeal-05) ก่อนเข้าคณะอนุกรรมการฯ — สลับ
         ลำดับตามที่ผู้ใช้ขอ ให้คณะอนุกรรมการฯ วินิจฉัยก่อน แล้วฝ่ายเลขาฯ ค่อยบันทึก
         วันที่ประชุม/เลขที่วาระรวมกับการเสนอบันทึกทีเดียวที่ appeal-07 (ดู
         L2-APPEAL-SECRETARIAT-MEMO ด้านล่าง) จึง statusCode ชี้ตรงไปที่ precondition
         ของ appeal-06 (เดิมเป็นผลผลิตของ appeal-05 ที่ถูกรวมเข้า appeal-07 แล้ว) */
      code: "L2-APPEAL-CASE-OWNER-OPINION",
      seq: 43,
      page: "10-2-appeal-04-case-owner-opinion.html",
      role: "original_officer",
      roleTitle: "นิติกร/นักสืบเจ้าของเรื่อง (เจ้าของสำนวนเดิม)",
      status: "คณะอนุกรรมการวินิจฉัยอุทธรณ์พิจารณาและมีคำวินิจฉัย",
      statusCode: "L2_PENDING_APPEAL_RULING",
      label: "[อุทธรณ์] นิติกรเจ้าของสำนวน แจ้งผู้อุทธรณ์และทำความเห็น",
      stepName: "[อุทธรณ์] นิติกร บันทึกความเห็น",
      includeIf: ["DENY"],
    },
    {
      code: "L2-APPEAL-RULING",
      seq: 44,
      page: "10-2-appeal-06-subcommittee-ruling.html",
      role: "appeal_ruling_subcommittee",
      roleTitle: "คณะอนุกรรมการวินิจฉัยอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลหรือข้อเท็จจริง",
      status: "ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์จัดทำบันทึกเสนอคณะกรรมการ ป.ป.ท.",
      statusCode: "L2_PENDING_APPEAL_MEMO",
      label: "[อุทธรณ์] คณะอนุกรรมการวินิจฉัยอุทธรณ์ พิจารณาและมีคำวินิจฉัย",
      stepName: "[อุทธรณ์] คณะอนุกรรมการฯ วินิจฉัย",
      includeIf: ["DENY"],
    },
    {
      /* เดิมส่งต่อ ผอ.กลุ่มงานติดตามคดี (appeal-08) ลงนามรับรอง ก่อนถึง ผอ.กองบริหารคดี
         — ตัดขั้นแทรกนั้นออก (ผู้ใช้ขอ) ส่งตรงถึง ผอ.กองบริหารคดี เลย จึงเปลี่ยน
         statusCode ให้ตรงกับ precondition ของ appeal-09 (เดิมเป็นผลผลิตของ appeal-08)

         รวมขั้น "เลขาฯ จัดทำวาระ" (appeal-05 เดิม) เข้ากับขั้นนี้ด้วย (ผู้ใช้ขอ) —
         ฝ่ายเลขาฯ คนเดียวกัน (appeal_subcommittee_secretariat) กรอกวันที่ประชุม/
         เลขที่วาระ พร้อมกับเสนอบันทึกคำวินิจฉัยในหน้าเดียว/ลายเซ็นเดียว แทนที่จะ
         แยก 2 หน้า 2 ลายเซ็น — role/precondition (L2_PENDING_APPEAL_MEMO จาก
         appeal-06) ไม่เปลี่ยน เพราะเดิม appeal-05 อยู่ *ก่อน* appeal-06 แต่ตอนนี้ค่า
         วันที่ประชุม/เลขที่วาระถูกบันทึก *หลัง* คณะอนุกรรมการฯ วินิจฉัยแล้วแทน */
      code: "L2-APPEAL-SECRETARIAT-MEMO",
      seq: 45,
      page: "10-2-appeal-07-secretariat-memo.html",
      role: "appeal_subcommittee_secretariat",
      roleTitle: "ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์",
      status: "ผอ.กองบริหารคดีพิจารณาและลงนามเสนอกิจกรรมที่ 7",
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE",
      label: "[อุทธรณ์] ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ บันทึกวาระการประชุมและจัดทำบันทึกเสนอคณะกรรมการ ป.ป.ท.",
      stepName: "[อุทธรณ์] เลขาฯ บันทึกวาระ+เสนอบันทึก",
      includeIf: ["DENY"],
    },
    {
      /* เดิมลงนามเสนอ (appeal-09) แล้วส่งต่อธุรการให้ออกเลขส่งแยกหน้า (appeal-10)
         — ตัดขั้นแยกนั้นออก (ผู้ใช้ขอ) รวมการออกเลขส่ง/วันที่ส่งเข้ามาในฟอร์มนี้
         เลย จบที่สถานะรอมติบอร์ดตรง ๆ (เดิมเป็นผลผลิตของ appeal-10) — เป็น
         black-box รอเหตุการณ์ภายนอก [H2] จึงต้องลบ/เติม ROUTES ด้วยมือ (ดูด้านล่าง)
         appeal-11 (ธุรการบันทึกมติบอร์ด) ก็ตัดออกด้วย — [H2] ใส่ค่ามติบอร์ดตรง ๆ ใน
         PATCH แล้ว route เข้า case_tracking_secretary (appeal-12) ทันที */
      code: "L2-APPEAL-BOARD-PROPOSE",
      seq: 48,
      page: "10-2-appeal-09-case-bureau-director-board-propose.html",
      role: "case_bureau_director",
      roleTitle: "ผู้อำนวยการกองบริหารคดี",
      status: "รอมติบอร์ดตอบกลับ",
      statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD",
      label: "[อุทธรณ์] ผู้อำนวยการกองบริหารคดี พิจารณา ลงนามในฐานะผู้เสนอเรื่อง และออกเลขส่งยื่นกิจกรรมที่ 7",
      stepName: "[อุทธรณ์] ผอ.กองบริหารคดี ลงนามเสนอ+ออกเลขส่ง",
      includeIf: ["DENY"],
    },
    {
      /* code ตั้งชื่อ "L2-APPEAL-NOTICE-DRAFT-2" (ไม่ใช่ L2-NOTICE-DRAFT) กันชนกับ
         step ของ Flow 2 (สาย DISCLOSE/PARTIAL หลัก) ที่ใช้ statusCode คนละชุดกัน
         อยู่แล้วแต่ชื่อ code คล้ายกัน — ดู docs/10-2-flow4-appeal-plan.md หัวข้อ 8.5 */
      code: "L2-APPEAL-NOTICE-DRAFT-2",
      seq: 51,
      page: "10-2-appeal-12-tracking-secretary-notice-draft.html",
      role: "case_tracking_secretary",
      roleTitle: "เลขานุการกลุ่มงานบริหารติดตามคดี",
      status: "นิติกรเจ้าของสำนวนแจ้งผลผู้อุทธรณ์",
      statusCode: "L2_PENDING_APPEAL_CASE_OWNER_NOTIFY",
      label: "[อุทธรณ์] เลขานุการกลุ่มงานบริหารติดตามคดี จัดทำหนังสือแจ้งผลมติ",
      stepName: "[อุทธรณ์] เลขาฯติดตามคดี จัดทำหนังสือแจ้งผล",
      includeIf: ["DENY"],
    },
    {
      /* LAW0082 + LAW0083 พับรวม — ผู้อุทธรณ์ (LAW0083) ไม่ใช่ผู้ใช้งานระบบ จึงพับ
         เป็นข้อความ read-only แสดงกำหนดรับทราบผล 5 วัน ในหน้านี้แทน ไม่มีหน้าแยก
         ดู docs/10-2-flow4-appeal-plan.md หัวข้อ 8.4.3 — terminal จริง จบทั้ง
         sheet 6+7 ของ Flow 4 */
      code: "L2-APPEAL-CASE-OWNER-NOTIFY",
      seq: 52,
      page: "10-2-appeal-13-case-owner-notify-appellant.html",
      role: "original_officer",
      roleTitle: "นิติกร/นักสืบเจ้าของเรื่อง (เจ้าของสำนวนเดิม)",
      status: "สิ้นสุด — แจ้งผลผู้อุทธรณ์แล้ว",
      statusCode: "L2_APPEAL_CASE_CLOSED_NOTIFIED",
      label: "[อุทธรณ์] นิติกรเจ้าของสำนวน แจ้งผลคำวินิจฉัยให้ผู้อุทธรณ์ทราบ",
      stepName: "[อุทธรณ์] นิติกร แจ้งผลผู้อุทธรณ์",
      includeIf: ["DENY"],
    },
  ];

  /* pending statusCode -> page that clears it. Built from STEPS so the table
     above stays the single source of truth for the routing. */
  const ROUTES = STEPS.reduce(function (acc, step, i) {
    const prev = STEPS[i - 1];
    if (prev) acc[prev.statusCode] = step.page;
    return acc;
  }, {});

  /* เส้นทางหลังจากรับมติกลับมา (LAW0049+) แยกสาขาตาม c.l2ResolutionType ซึ่ง
     ตาราง STEPS ข้างบน (อาเรย์เรียงเส้นเดียว) แทนไม่ได้ทั้งหมด — auto-reduce
     ด้านบนครอบคลุมเฉพาะเส้นทาง DISCLOSE/PARTIAL (ตำแหน่งอยู่ติดกันในอาเรย์)
     จึงเติมสาขา DENY ที่ไม่ได้อยู่ติดกันด้วยมือ 2 จุดนี้:
       1) L2-RECEIVE-OUTCOME (10-2-10) เมื่อเลือก DENY จะข้ามไป L2-DENY-MEMO
          (10-2-15) แทนที่จะไปตามค่า default (L2-NOTICE-DRAFT, 10-2-11)
       2) L2-NOTICE-DISPATCH (10-2-14) เป็นสถานะปิดคำร้อง (จบสาขา DISCLOSE/
          PARTIAL) auto-reduce จะสร้าง route เข้า L2-DENY-MEMO (10-2-15) โดย
          บังเอิญเพราะอยู่ติดกันในอาเรย์ — ต้องลบทิ้งไม่ให้คำร้องที่ปิดแล้ว
          ขึ้นปุ่ม "ดำเนินการ" ในคิวงานของฝ่ายเลขานุการฯ อีก
     ทุกหน้าที่แยกสาขาเอง (10-2-10, 10-2-11) ต้องส่ง statusCode ที่ตรงกับค่า
     เหล่านี้ตรง ๆ ใน patch ของ Activity102.advance() ไม่ใช้ค่า default ของ step */
  ROUTES["L2_PENDING_DENY_MEMO"] = "10-2-15-secretariat-deny-memo.html";
  delete ROUTES["L2_CASE_CLOSED_NOTICE_SENT"];

  /* สาย DISCLOSE/PARTIAL + คดีเสร็จสิ้นแล้ว (Flow 3) ไม่ได้อยู่ติดกับ Flow 2 ใน
     อาเรย์ (คั่นด้วยสาย DENY ทั้งหมด) จึงต้องเติม route เข้าเองแบบเดียวกับ
     L2_PENDING_DENY_MEMO ด้านบน — และลบ route ที่ auto-reduce สร้างผิดจาก
     ตำแหน่งติดกันบังเอิญระหว่างขั้นสุดท้ายของสาย DENY กับขั้นแรกของสาย CLOSE */
  ROUTES["L2_PENDING_CLOSE_MEMO"] = "10-2-22-secretariat-close-memo.html";
  delete ROUTES["L2_CASE_CLOSED_DENY_ASSIGNED"];

  /* สาย DISCLOSE/PARTIAL + อยู่ระหว่างไต่สวน รอบ 2 (Flow 2 Part 1, ใหม่) ไม่ได้
     อยู่ติดกับสาย CLOSED ใน STEPS (คั่นด้วยสาย DENY/CLOSED ทั้งหมด) เติม route
     เข้าเองแบบเดียวกับด้านบน และลบ route ที่ auto-reduce สร้างผิดจากตำแหน่ง
     ติดกันบังเอิญระหว่างขั้นสุดท้ายของสาย CLOSE กับขั้นแรกของรอบนี้ */
  ROUTES["L2_PENDING_COMMITTEE_MEMO_DRAFT"] = "10-2-25-secretariat-committee-memo-draft.html";
  delete ROUTES["L2_CASE_CLOSED_DISCLOSE_ASSIGNED"];

  /* จุดแยกสาขา ๖/๗ หลัง L2-DISPATCH (10-2-09) — ธุรการเลือกส่งต่อรองเลขาธิการ
     (ปฏิบัติราชการแทน, DEPUTY) หรือเลขาธิการโดยตรง (SECGEN) ตำแหน่งในอาเรย์คือ
     L2-DISPATCH → L2-DEPUTY-SG-OPINION (10-2-32) → L2-SECGEN-OPINION (10-2-31)
     → L2-RECEIVE-OUTCOME (10-2-10) เรียงติดกัน auto-reduce จึงเดินสาย DEPUTY
     (ค่า default ของ L2-DISPATCH) ได้ถูกต้องเอง (L2_PENDING_DEPUTY_SG_OPINION →
     10-2-32) แต่สาย SECGEN กับจุดต่อจาก DEPUTY ต้องเติม/แก้ด้วยมือ 2 จุด:
       1) L2_PENDING_SECGEN_OPINION ไม่ใช่ค่า default ของ step ไหนเลย (10-2-09
          set ค่านี้เองเมื่อธุรการเลือกสาย SECGEN) จึงไม่มี route มาก่อน
       2) L2_DEPUTY_SG_RESOLVED ถูก auto-reduce ชี้ไป 10-2-31 ผิดจากตำแหน่ง
          ติดกันบังเอิญ (L2-DEPUTY-SG-OPINION อยู่ติดกับ L2-SECGEN-OPINION ใน
          อาเรย์) ทั้งที่ควรไปต่อที่ 10-2-10 เหมือนกับสาย SECGEN */
  ROUTES["L2_PENDING_SECGEN_OPINION"] = "10-2-31-secgen-opinion-sign.html";
  ROUTES["L2_DEPUTY_SG_RESOLVED"] = "10-2-10-legal-admin-receive-outcome.html";

  /* L2-NOTICE-DRAFT (10-2-11 ถึง 10-2-14) ย้ายไปอยู่ท้ายอาเรย์ STEPS แล้ว
     (ดูเหตุผลที่คอมเมนต์ตรงนั้น) — ตอนนี้ตำแหน่งจริงในอาเรย์คือต่อจาก
     L2-RECEIVE-BOARD-ROUND2 (10-2-30) พอดี ทำให้ auto-reduce สร้าง route
     "L2_PENDING_NOTICE_DRAFT" → 10-2-11 ให้ถูกต้องเองแล้ว ไม่ต้องเติมด้วยมืออีก
     (เดิมตอนที่ 10-2-30 ยังไม่มี ต้องเติม/ลบ route ตรงนี้ด้วยมือเพราะ 10-2-29 กับ
     10-2-11 อยู่ติดกันในอาเรย์บังเอิญ — ดูประวัติการแก้ไขถ้าต้องย้อนดู) */

  /* L2_BOARD_RESOLVED_ROUND2 — สถานะคั่นกลางแบบเดียวกับที่ L2_BOARD_RESOLVED
     เคยเป็น (ก่อนเลิกใช้ ดูคอมเมนต์ L2-SECGEN-OPINION ด้านบน) แต่จุดนี้ยังคง
     กล่องดำจริง (กิจกรรมที่ 7 รอบ 2 = คณะกรรมการ ป.ป.ท. เต็มคณะ ไม่ใช่แค่
     เลขาธิการฯ ชั้นเดียวแบบรอบแรก) จึงยังไม่มีหน้าของตัวเอง ต้องเติม route
     ด้วยมือเหมือนเดิม: L2_READY_FOR_BOARD_ROUND2
     (L2-COMMITTEE-DISPATCH, 10-2-29 — เพิ่งออกเลขส่งยังไม่รู้ผล) เข้าคิวงานเดียวกัน
     กับ L2_BOARD_RESOLVED_ROUND2 นี้โดยอัตโนมัติอยู่แล้ว (auto-reduce จากตำแหน่ง
     ติดกันในอาเรย์ STEPS ระหว่าง 10-2-29 กับ 10-2-30) ต่างกันแค่ข้อความสถานะ */
  ROUTES["L2_BOARD_RESOLVED_ROUND2"] = "10-2-30-legal-admin-receive-board-round2.html";

  /* Flow 4 (อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล, docs/10-2-flow4-appeal-plan.md) —
     L2-APPEAL-INTAKE (10-2-appeal-01) ต่อท้ายอาเรย์ STEPS หลัง L2-NOTICE-DISPATCH
     (10-2-14) ซึ่งเป็นสถานะปิดสำนวนของ Flow 2 (ROUTES["L2_CASE_CLOSED_NOTICE_SENT"]
     ถูกลบทิ้งแล้วด้านบนตั้งแต่ auto-reduce แรก จึงไม่ชนกัน) — L2_PENDING_APPEAL_INTAKE
     ไม่มี step ไหนใน STEPS ผลิตออกมาโดยอัตโนมัติ (ยังไม่มีปุ่ม "ยื่นอุทธรณ์" จากคำร้อง
     ที่ปิดสายเดิม ตามค่าเริ่มต้นที่เสนอไว้ในแผน) ต้องเติม route เข้าเองตรงนี้ */
  ROUTES["L2_PENDING_APPEAL_INTAKE"] = "10-2-appeal-01-legal-admin-intake.html";
  /* จุดเริ่มต้นทางที่ 2 (สายเขต) — เหตุการณ์ภายนอกแบบเดียวกับ L2_PENDING_APPEAL_INTAKE
     ด้านบน แต่แยกค่าคนละสถานะ ให้ H3 เลือกได้ว่าจะจำลองว่าคำร้องเข้าทางไหน (ดู
     docs/10-2-full-test-flow.md หัวข้อ 7 — [H3] มี variant ส่วนกลาง/เขต) */
  ROUTES["L2_PENDING_APPEAL_INTAKE_DISTRICT"] = "10-2-appeal-01b-district-intake.html";

  /* L2-APPEAL-INTAKE-DISTRICT (10-2-appeal-01b) แทรกต่อท้าย L2-APPEAL-INTAKE
     (10-2-appeal-01) ในอาเรย์พอดี — auto-reduce จึงสร้าง route ผิดโดยบังเอิญ:
     ROUTES["L2_PENDING_BUREAU_DIRECTOR_ASSIGN"] (ผลผลิตของ appeal-01 สายส่วนกลาง)
     ไปชี้ที่ appeal-01b (สายเขต) แทนที่จะเป็น appeal-02 (สายส่วนกลางที่ถูกต้อง) —
     ส่วน ROUTES["L2_PENDING_CASE_OWNER_APPEAL_OPINION"] auto-reduce แก้ให้ถูกเองแล้ว
     เพราะ L2-APPEAL-TRACKING-ASSIGN (appeal-03) ที่อยู่ถัดไปในอาเรย์ก็ผลิตค่าเดียวกัน
     นี้ชี้ไปที่ appeal-04 ซ้อนทับ (ลำดับหลังชนะ) จึงไม่ต้องแก้ */
  ROUTES["L2_PENDING_BUREAU_DIRECTOR_ASSIGN"] = "10-2-appeal-02-case-bureau-director-assign.html";

  /* L2-APPEAL-BOARD-RESOLUTION (10-2-appeal-11) ต่อท้าย L2-APPEAL-BOARD-DISPATCH
     (10-2-appeal-10) ในอาเรย์พอดี — auto-reduce ด้านบนจึงสร้าง route ผิดโดยบังเอิญ:
     ROUTES["L2_APPEAL_SUBMITTED_TO_BOARD"] ไปชี้ที่ appeal-11 ทั้งที่สถานะนี้ต้องเป็น
     black-box รอผลจริง (ไม่มี route) จนกว่าจะมีสถานะคั่นกลาง L2_APPEAL_BOARD_RESOLVED
     ("มติบอร์ดตอบกลับแล้ว") เกิดขึ้นก่อน (ดู APPEAL_STATUS_CODES.push ด้านบน และ
     docs/10-2-flow4-appeal-plan.md หัวข้อ 8.4.1) จึงต้องลบ route ที่ผิดทิ้ง แล้วเติม
     route ที่ถูกต้องเข้าเอง */
  delete ROUTES["L2_APPEAL_SUBMITTED_TO_BOARD"];
  /* appeal-11 (ธุรการบันทึกมติบอร์ด) ถูกตัดออก — [H2] เขียนค่ามติบอร์ดลง case
     ตรง ๆ แล้ว route เข้า L2_PENDING_APPEAL_NOTICE_DRAFT (precondition ของ
     appeal-12) ทันที ไม่มี step ไหนใน STEPS ผลิตสถานะนี้ออกมาเองอีกต่อไป
     (เดิมเป็นผลผลิตของ appeal-11 ที่ถูกลบ) จึงต้องเติม route นี้ด้วยมือ */
  ROUTES["L2_PENDING_APPEAL_NOTICE_DRAFT"] = "10-2-appeal-12-tracking-secretary-notice-draft.html";

  function stepByCode(code) {
    return STEPS.find(function (s) { return s.code === code; }) || null;
  }

  function stepByPage(page) {
    return STEPS.find(function (s) { return s.page === page; }) || null;
  }

  /* คำร้องที่อยู่ในสาย Flow 4 (อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล) — เดินจาก STEPS
     โดยตรง (code ขึ้นต้นด้วย "L2-APPEAL") ไม่ hardcode รายการ statusCode เอง
     เพื่อให้ STEPS ยังเป็น single source of truth เดียว — เพิ่ม step ใหม่ของ
     Flow 4 ใน STEPS (เช่น appeal-11 เป็นต้นไป) แล้วฟังก์ชันนี้จะครอบคลุมเองอัตโนมัติ */
  const APPEAL_STATUS_CODES = STEPS.filter(function (s) {
    return s.code.indexOf("L2-APPEAL") === 0;
  }).map(function (s) { return s.statusCode; });

  /* L2_PENDING_APPEAL_NOTICE_DRAFT ไม่ได้มาจาก step ไหนใน STEPS โดยตรงอีกต่อไป
     (เดิมเป็นผลผลิตของ appeal-11 ที่ถูกลบ, [H2] เขียนค่านี้ตรง ๆ แทน) เติมเข้า
     APPEAL_STATUS_CODES ด้วยมือให้ isAppealCase()/แบดจ์ "อุทธรณ์" ยังครอบคลุม
     คำร้องที่อยู่สถานะนี้ (สถานะคั่นกลาง "มติบอร์ดตอบกลับแล้ว" L2_APPEAL_BOARD_RESOLVED
     เดิมเลิกใช้แล้วพร้อมกับ appeal-11) */
  APPEAL_STATUS_CODES.push("L2_PENDING_APPEAL_NOTICE_DRAFT");

  function isAppealCase(kase) {
    if (!kase) return false;
    return APPEAL_STATUS_CODES.indexOf(kase.statusCode) > -1;
  }

  /* ------------------------------------------------------- RESOLUTION TYPES
     ตัวเลือกมติของคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร (LAW0044) และสถานะคดี — แยกกันคนละช่อง */
  const RESOLUTION_TYPES = [
    { value: "DISCLOSE", label: "อนุญาตเปิดเผย", color: "#16a34a" },
    { value: "PARTIAL", label: "อนุญาตเปิดเผยบางส่วน", color: "#d97706" },
    { value: "DENY", label: "ไม่อนุญาตเปิดเผย", color: "#dc2626" },
    { value: "OTHER", label: "อื่นๆ", color: "#64748b" },
  ];

  const CASE_STATES = [
    { value: "CLOSED", label: "คดีเสร็จสิ้นแล้ว", color: "#1e3a8a" },
    { value: "INVESTIGATING", label: "อยู่ระหว่างไต่สวน", color: "#1e3a8a" },
  ];

  /* มติคณะกรรมการ ป.ป.ท. (กิจกรรมที่ 7) ต่อคำอุทธรณ์ — sheet 7 "แจ้งผลอุทธรณ์"
     (LAW0080) ดู docs/10-2-flow4-appeal-plan.md หัวข้อ 8.2 — แยกจาก
     RESOLUTION_TYPES ด้านบนเพราะเป็นคนละบริบท (RESOLUTION_TYPES มี "อื่นๆ" ซึ่ง
     ไม่เข้ากับมติบอร์ดที่ทางเข้าตามผังเดิมมีแค่ 3 ทางตายตัวเท่านั้น) */
  const BOARD_APPEAL_RESOLUTION_TYPES = [
    { value: "DISCLOSE", label: "ให้เปิดเผยข้อมูลทั้งหมด", color: "#16a34a" },
    { value: "PARTIAL", label: "ให้เปิดเผยข้อมูลบางส่วน", color: "#d97706" },
    { value: "DENY", label: "ไม่เปิดเผยข้อมูล", color: "#dc2626" },
  ];

  /* กริดปุ่มเลือกมติ/สถานะคดี — ใช้ร่วมกันทุกหน้าที่ต้องเลือกค่าเหล่านี้
     (10-2-06, 10-2-31, 10-2-32) แทนที่จะก็อปโค้ดซ้ำ handlerName คือชื่อ
     ฟังก์ชัน global ของหน้านั้นๆ ที่จะถูกเรียกตอนคลิก (เช่น "selectResolution") */
  function choiceGridHtml(list, selected, handlerName) {
    return list
      .map(
        (o) =>
          '<label class="l2-choice' +
          (o.value === selected ? " is-active" : "") +
          '" style="' +
          (o.value === selected && o.color
            ? "border-color:" + o.color + ";"
            : "") +
          ' justify-content: start;" onclick="' +
          handlerName +
          "('" +
          o.value +
          "')\">" +
          '<input type="radio" value="' +
          o.value +
          '"' +
          (o.value === selected ? " checked" : "") +
          (o.color ? ' style="accent-color:' + o.color + '"' : "") +
          " />" +
          '<span class="l2-choice-label"' +
          (o.color ? ' style="color:' + o.color + '"' : "") +
          ">" +
          o.label +
          "</span></label>",
      )
      .join("");
  }

  /* แผ่นสรุปมติ (view-only) ของสายรอบเสนอกิจกรรมที่ 7 ครั้งที่ 2 (10-2-25 ถึง
     30) — คนละชุดฟิลด์กับ ECMIS102.renderResolutionSheet ที่ใช้ในสาย Part 1
     หลัก (l2ResolutionFacts) เพราะรอบนี้ใช้ l2CommitteeSheetFacts/DataOwner
     แยกต่างหาก โครงเดียวกับ renderAttachSheet() ที่ 10-2-25 แต่อ่านค่าที่
     บันทึกแล้วจาก case แทนตัว editor สด */
  function renderCommitteeAttachSheet(kase) {
    const c = kase;
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label">' + label +
      '</span><div class="l2-doc-body">' + (value || "-") + "</div></div>";

    return (
      '<div class="l2-doc-title">คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร</div>' +
      '<div class="l2-doc-subtitle">ของคณะกรรมการ ป.ป.ท.</div>' +
      '<hr class="l2-doc-divider" />' +
      section("๑. เรื่อง", c.title) +
      section("๒. ข้อเท็จจริง", c.l2CommitteeSheetFacts) +
      section("๓. การร้องขอข้อมูลข่าวสาร", c.requestedInfo) +
      row("๔. ในคราวการประชุมครั้งที่", c.l2MeetingNo) +
      row("เมื่อวันที่", formatThaiDate(c.l2MeetingDate)) +
      section("คณะอนุกรรมการพิจารณากลั่นกรองฯ เห็นว่า", c.l2CommitteeOpinion) +
      section("มติที่ประชุม", (c.l2ResolutionTypeName || "") + " " + (c.l2ResolutionDetail || "")) +
      row("๕. ผู้รับผิดชอบข้อมูลข่าวสาร", c.l2CommitteeSheetDataOwner)
    );
  }

  /* บันทึกเสนอเลขาธิการ (view) ของสายรอบเสนอกิจกรรมที่ 7 ครั้งที่ 2 — ใช้ร่วมกัน
     ทุกหน้าตั้งแต่ 10-2-26 (26/27/29) แทนที่จะก็อปแยกแต่ละหน้า เพราะเคยเกิดบั๊ก
     มาแล้วที่ 10-2-29 ก็อปมาแล้วขาดข้อ ๑-๓ ไป — showDirLegalOpinion=true เมื่อ
     ผอ.กองกฎหมายให้ความเห็นและลงนามแล้ว (ใช้ที่ 10-2-29 เท่านั้น เพราะ 26/27 ยัง
     ไม่ถึงจุดนั้น) ตรงกับ docs/10.2 mockup/Part 1 - new 2/
     ตัวอย่างบันทึกเสนอเลขาธิการ เพื่อเข้าคณะ-2.pdf */
  function renderCommitteeMemoDoc(kase, showDirLegalOpinion) {
    const c = kase;
    const sigs = signState(c);
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label">' + label +
      '</span><div class="l2-doc-body">' + (value || "") + "</div></div>";
    const sigSlot = (slot, role) => {
      const s = sigs[slot];
      const img = s && s.image
        ? '<img class="l2-sig-img" src="' + s.image + '" alt="ลายเซ็น" />'
        : '<div class="l2-sig-placeholder">รอลงนาม</div>';
      const when = s && s.signedAt ? '<div class="l2-sign-when">' + s.signedAt + "</div>" : "";
      return '<div class="l2-sig-slot">' + img + '<div class="l2-sig-name">(ชื่อ-สกุล)</div><div class="l2-sig-role">' + role + "</div>" + when + "</div>";
    };

    let html =
      '<div class="l2-doc-title">มติการประชุมคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารฯ ครั้งที่ ' + (c.l2MeetingNo || "......") + "</div>" +
      row("ส่วนราชการ", (c.l2CommitteeMemoDivisionName || "") + (c.l2CommitteeMemoDivisionPhone ? " โทร. " + c.l2CommitteeMemoDivisionPhone : "")) +
      row("ที่ / วันที่", (c.l2CommitteeMemoDocNo || "รอออกเลข") + " / " + (c.l2CommitteeMemoDocDate || "-")) +
      row("เรียน", c.l2CommitteeMemoAddressedTo) +
      section("๑. เรื่องเดิม", c.l2CommitteeMemoBackground) +
      section("๒. ข้อเท็จจริง", "การประชุมครั้งที่ " + (c.l2MeetingNo || "......") + " เมื่อวัน " + (c.l2CommitteeMemoDocDate || "-") +
        " ณ ห้องประชุม " + (c.l2CommitteeMemoMeetingVenue || "") + "<br /><br />" + (c.l2CommitteeMemoResolutionText || "")) +
      section("๓. ข้อกฎหมาย ระเบียบ ประกาศ และคำสั่ง", c.l2CommitteeMemoLegalBasis) +
      section("๔. ข้อพิจารณา", c.l2CommitteeMemoConsiderations) +
      '<div class="l2-doc-signblock">' + sigSlot("committeeMemoProposer", "อนุกรรมการและเลขานุการ") + "</div>";

    if (showDirLegalOpinion) {
      html +=
        section("๕. ความเห็นผู้อำนวยการกองกฎหมาย", c.l2CommitteeDirectorOpinionText) +
        '<div class="l2-doc-signblock">' + sigSlot("committeeDirectorOpinion", "ผู้อำนวยการกองกฎหมาย") + "</div>";
    }
    return html;
  }

  /* มติคณะกรรมการ ป.ป.ท. (view) — ค่าที่ธุรการบันทึกไว้ที่ 10-2-30 หลังได้รับแจ้ง
     กลับจากกิจกรรมที่ 7 จริง ใช้ร่วมกันตั้งแต่ 10-2-35/36 (ผอ.กอง/ผอ.กลุ่มงาน
     รับทราบ) ไปจนถึง 10-2-11 เป็นต้นไป (ถ้ามี — คำร้องที่ไม่ได้เดินสายรอบเสนอ
     กิจกรรมที่ 7 ซ้ำจะไม่มีค่านี้เลย จึง return "" ให้ผู้เรียกซ่อนการ์ดไปเอง) */
  function renderBoardResolutionCard(kase) {
    const c = kase;
    if (!c.l2BoardResolutionRound2Text) return "";
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label">' + label +
      '</span><div class="l2-doc-body">' + (value || "-") + "</div></div>";

    return (
      '<div class="l2-doc-title">มติคณะกรรมการ ป.ป.ท.</div>' +
      row("เลขที่หนังสือ/รหัสอ้างอิง", c.l2BoardApprovalRefRound2) +
      row("วันที่ได้รับแจ้งมติ", formatThaiDate(c.l2BoardApprovalDateRound2)) +
      section("มติคณะกรรมการ ป.ป.ท.", c.l2BoardResolutionRound2Text) +
      (c.l2ReceiveNotesRound2 ? section("หมายเหตุ", c.l2ReceiveNotesRound2) : "")
    );
  }

  /* หนังสือแจ้งมติผู้ยื่นคำขอ (view) — ใช้ร่วมกันตั้งแต่ 10-2-37 (ผอ.กลุ่มงาน
     ให้ความเห็น) ถึง 10-2-13/10-2-14 (ผอ.กองกฎหมายลงนาม/ธุรการออกเลขส่ง) ความเห็น
     และลายเซ็นของ ผอ.กลุ่มงานความเห็นแย้ง (noticeGroupDirReview) ยังคงใช้เดินเรื่อง
     ในระบบตามปกติที่ 10-2-37 แต่ตามต้นฉบับจริงไม่ปรากฏบนเอกสารฉบับพิมพ์ จึงไม่แสดง
     ในฟังก์ชันนี้ — ไม่รวมบล็อกลายเซ็นผู้อำนวยการกองกฎหมาย (noticeApprover) เพราะ
     เป็นลายเซ็นของหน้าตัวเองที่ 10-2-13 จัดการเองอยู่แล้ว */
  function renderNoticeDoc(kase) {
    const c = kase;
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const para = (value) => '<div class="l2-doc-body">' + (value || "") + "</div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label" style="display: block; text-indent: 2.5em">' + label +
      '</span><div class="l2-doc-body">' + (value || "") + "</div></div>";

    return (
      '<div class="l2-doc-title">บันทึกข้อความ</div>' +
      row("ส่วนราชการ", c.l2DivisionName) +
      row("โทร.", c.l2DivisionPhone) +
      row("ที่", c.l2NoticeDocNo) +
      row("วันที่", formatThaiDate(c.l2NoticeDocDate)) +
      row("เรื่อง", "แจ้งมติการประชุมคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารฯ" + (c.l2MeetingNo ? " ครั้งที่ " + c.l2MeetingNo : "")) +
      row("เรียน", c.l2NoticeRecipient) +
      para("ตามที่ " + (c.requesterName || "ผู้ยื่นคำขอ") + " ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง " + (c.title || "") + " นั้น") +
      para(
        "สำนักงาน ป.ป.ท. โดยคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารของคณะกรรมการ ป.ป.ท. พิจารณาแล้วในการประชุมครั้งที่ " +
        (c.l2MeetingNo || "......") + " เมื่อวันที่ " + (formatThaiDate(c.l2MeetingDate) || "...............") +
        " เห็นว่า " + (c.l2CommitteeOpinion || "")) +
      section("มติที่ประชุม",
        "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารของคณะกรรมการ ป.ป.ท. มีมติ" + (c.l2ResolutionTypeName || "") + " ดังนี้<br />" +
        (c.l2NoticeBody || "")) +
      (c.l2ResolutionType === "PARTIAL" && c.l2NoticeAppointmentDate
        ? row("นัดหมายตรวจดู/คัดถ่ายเอกสาร", formatThaiDate(c.l2NoticeAppointmentDate))
        : "") +
      para("ทั้งนี้ ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป") +
      para("จึงเรียนมาเพื่อโปรดทราบและพิจารณาดำเนินการ")
    );
  }

  function labelOf(list, value) {
    const hit = list.find(function (x) { return x.value === value; });
    return hit ? hit.label : "-";
  }

  function colorOf(list, value) {
    const hit = list.find(function (x) { return x.value === value; });
    return (hit && hit.color) || "#64748b";
  }

  /* ------------------------------------------------------------ SIGN CHAIN
     บันทึกเสนอเลขาธิการฯ (Part 1-A) — โครงสร้างตามต้นฉบับจริง
     docs/10.2 mockup/Part 2 - new 1/มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิก.docx:
     หน้า 1 ลงท้ายด้วยลายเซ็นผู้เสนอเรื่อง ("อนุกรรมการและเลขานุการ คณะอนุกรรมการ
     พิจารณากลั่นกรองฯ" — ฝ่ายเลขานุการฯ ผู้จัดทำบันทึกเอง ไม่ใช่ ผอ.กองกฎหมาย)
     หน้า 2 มี 3 บล็อกความเห็น+ลายเซ็นเรียงกัน: ๕.ผอ.กองกฎหมาย → ๖.รองเลขาธิการ
     คณะกรรมการ ป.ป.ท. → ๗.เลขาธิการคณะกรรมการ ป.ป.ท. — แต่ธุรการเลือกได้ว่าจะส่ง
     ต่อให้รองเลขาธิการ (ปฏิบัติราชการแทน) หรือเลขาธิการโดยตรงที่ 10-2-09 (ดู
     l2ApprovalBranch) จึงมีแค่ข้อ ๕ ที่เกิดขึ้นเสมอ ส่วนข้อ ๖/๗ เกิดขึ้นเพียง
     ข้อใดข้อหนึ่งต่อคำร้อง — SIGN_CHAIN นี้ใช้กับหน้า 10-2-07/08/09 เท่านั้น
     (จุดที่ยังไม่ถึงจุดแยกสาขา) ส่วนข้อ ๖/๗ แต่ละหน้าเรนเดอร์เองผ่าน
     renderMemoDocument() ด้านล่าง ไม่ได้อยู่ในอาเรย์นี้ */
  const SIGN_CHAIN = [
    {
      slot: "proposer",
      role: "sub_secretariat",
      title: "ผู้เสนอเรื่อง",
      position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
      certId: "PACC-SUBSEC-2569-102",
    },
    {
      slot: "dirLegalOpinion",
      role: "dir_legal",
      title: "๕. ความเห็นผู้อำนวยการกองกฎหมาย",
      position: "ผู้อำนวยการกองกฎหมาย",
      certId: "PACC-DIRLEGAL-2569-102",
    },
  ];

  function signState(kase) {
    return (kase && kase.l2Signatures) || {};
  }

  function isSigned(kase, slot) {
    const sig = signState(kase)[slot];
    return !!(sig && sig.image);
  }

  /* แถบสถานะสายการลงนาม แสดงบนหัวเอกสารของทุกหน้าที่เกี่ยวกับการลงนาม */
  function renderSignChain(kase, activeSlot) {
    const sigs = signState(kase);
    const items = SIGN_CHAIN.map(function (link) {
      const done = isSigned(kase, link.slot);
      const active = !done && link.slot === activeSlot;
      const icon = done
        ? '<i class="fa-solid fa-circle-check"></i>'
        : active
          ? '<i class="fa-regular fa-clock"></i>'
          : '<i class="fa-regular fa-square"></i>';
      const state = done ? "ลงนามแล้ว" : active ? "รอลงนาม" : "ยังไม่ถึงคิว";
      const color = done ? "#16a34a" : active ? "#d97706" : "#94a3b8";
      const when =
        done && sigs[link.slot].signedAt
          ? '<div class="l2-sign-when">' + sigs[link.slot].signedAt + "</div>"
          : "";
      return (
        '<div class="l2-sign-node" style="border-color:' + color + '">' +
        '<div class="l2-sign-ico" style="color:' + color + '">' + icon + "</div>" +
        '<div class="l2-sign-meta">' +
        '<div class="l2-sign-title">' + link.title + "</div>" +
        '<div class="l2-sign-pos">' + link.position + "</div>" +
        '<div class="l2-sign-state" style="color:' + color + '">' + state + "</div>" +
        when +
        "</div></div>"
      );
    });
    return '<div class="l2-sign-chain">' + items.join("") + "</div>";
  }

  /* ------------------------------------------------------------ MEMO DOCUMENT
     บันทึกเสนอเลขาธิการฯ (Part 1) เต็มรูปแบบ 2 หน้า ตามต้นฉบับจริง docs/10.2
     mockup/Part 2 - new 1/มติการประชุมอนุกรรมการฯ ที่นำเสนอเลขาธิก.docx — ใช้
     ร่วมกันทุกหน้า Part 1 (10-2-07 ถึง 10-2-10, 10-2-31, 10-2-32) แทนที่จะก็อป
     โครงเอกสารซ้ำในแต่ละไฟล์ (เสี่ยงเพี้ยนไปคนละแบบ) ก่อนธุรการเลือกสาย ๖/๗ ที่
     10-2-09 (kase.l2ApprovalBranch ยังไม่มีค่า) แสดงทั้งบล็อก ๖ และ ๗ ว่างไว้ก่อน
     (ตรงกับฟอร์มกระดาษเปล่าที่มีทั้งสองช่องเสมอ) หลังเลือกแล้วแสดงเฉพาะสายที่ถูก
     เลือกจริง */
  function renderMemoDocument(kase) {
    const c = kase;
    const sigs = signState(c);
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label">' + label +
      '</span><div class="l2-doc-body">' + (value || "-") + "</div></div>";
    const sigBlock = (slot, position) => {
      const s = sigs[slot];
      const img = s && s.image
        ? '<img class="l2-sig-img" src="' + s.image + '" alt="ลายเซ็น" />'
        : '<div class="l2-sig-placeholder">รอลงนาม</div>';
      const when = s && s.signedAt ? '<div class="l2-sign-when">' + s.signedAt + "</div>" : "";
      return (
        '<div class="l2-sig-slot">' + img +
        '<div class="l2-sig-name">(ชื่อ-สกุล)</div>' +
        '<div class="l2-sig-role">' + position + "</div>" + when + "</div>"
      );
    };

    let html =
      '<div class="l2-doc-title">บันทึกข้อความ</div>' +
      row("ส่วนราชการ", c.l2DivisionName) +
      row("โทร.", c.l2DivisionPhone) +
      row("ที่", c.l2InternalDocNo) +
      row("วันที่", formatThaiDate(c.l2DocDate)) +
      row("เรื่อง", c.l2Subject) +
      row("เรียน", c.l2AddressedTo) +
      '<hr class="l2-doc-divider" />' +
      section("๑. เรื่องเดิม", c.l2Background) +
      section(
        "๒. ข้อเท็จจริง",
        "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารของคณะกรรมการ ป.ป.ท. ได้ดำเนินการประชุมครั้งที่ " +
          (c.l2MeetingNo || "...") +
          " เมื่อวัน" +
          (formatThaiDate(c.l2MeetingDate) || "...") +
          " ณ ห้องประชุม" +
          (c.l2MeetingVenue || "...") +
          " เรียบร้อยแล้ว จากการประชุมคณะอนุกรรมการพิจารณากลั่นกรองฯ ได้มีมติที่ประชุม ดังนี้<br/>" +
          (c.l2Facts || "-"),
      ) +
      section("๓. ข้อกฎหมาย ระเบียบ ประกาศ และคำสั่ง", c.l2LegalBasis) +
      section("๔. ข้อพิจารณา", c.l2Considerations) +
      '<div class="l2-doc-section"><div class="l2-doc-body">จึงเรียนมาเพื่อโปรดพิจารณา</div></div>' +
      '<div class="l2-doc-signblock">' +
      sigBlock("proposer", "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ") +
      "</div>" +
      '<hr class="l2-doc-divider" />' +
      '<div class="l2-doc-subtitle">-2-</div>' +
      section("๕. ความเห็นผู้อำนวยการกองกฎหมาย", c.l2DirLegalOpinion) +
      '<div class="l2-doc-signblock">' +
      sigBlock("dirLegalOpinion", "ผู้อำนวยการกองกฎหมาย") +
      "</div>";

    const branch = c.l2ApprovalBranch;
    if (!branch || branch === "DEPUTY") {
      html +=
        section("๖. ความเห็นรองเลขาธิการคณะกรรมการ ป.ป.ท.", c.l2DeputySgOpinion) +
        '<div class="l2-doc-signblock">' +
        sigBlock("deputySgOpinion", "รองเลขาธิการคณะกรรมการ ป.ป.ท.") +
        "</div>";
    }
    if (!branch || branch === "SECGEN") {
      html +=
        section("๗. ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท.", c.l2SecgenOpinion) +
        '<div class="l2-doc-signblock">' +
        sigBlock("secgenOpinion", "เลขาธิการคณะกรรมการ ป.ป.ท.") +
        "</div>";
    }
    return html;
  }

  /* ------------------------------------------------------- RESOLUTION SHEET
     แผ่นสรุปมติคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามต้นฉบับจริง docs/10.2 mockup/
     Part 1 - new 2/ตัวอย่างมติคณะอนุกรรมการกลั่นกรอง ที่นำเ.docx (9 ฟิลด์ ไม่มี
     ส่วนหัวราชการ ไม่มีบล็อกลายเซ็น) — ใช้ร่วมกันทุกหน้าที่เคยก็อปโค้ดซ้ำ
     (10-2-07 ถึง 10-2-10) ๒.ข้อเท็จจริง (facts) เป็นคนละฟิลด์กับ "คณะอนุกรรมการฯ
     เห็นว่า" (committee_opinion) — เดิมโค้ดใช้ l2CommitteeOpinion ซ้ำทั้งสองช่อง
     ผิดจากต้นฉบับ จึงเพิ่มฟิลด์ l2ResolutionFacts แยกต่างหาก */
  function renderResolutionSheet(kase) {
    const c = kase;
    const row = (label, value) =>
      '<div class="l2-doc-row"><span class="l2-doc-label">' + label +
      '</span><span class="l2-doc-value">' + (value || "") + "</span></div>";
    const section = (label, value) =>
      '<div class="l2-doc-section"><span class="l2-doc-label">' + label +
      '</span><div class="l2-doc-body">' + (value || "-") + "</div></div>";

    return (
      '<div class="l2-doc-title">คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร</div>' +
      '<div class="l2-doc-subtitle">ของคณะกรรมการ ป.ป.ท.</div>' +
      '<hr class="l2-doc-divider" />' +
      section("๑. เรื่อง", c.title) +
      section("๒. ข้อเท็จจริง", c.l2ResolutionFacts) +
      section("๓. การร้องขอข้อมูลข่าวสาร", c.requestedInfo) +
      row("๔. ในคราวการประชุมครั้งที่", c.l2MeetingNo) +
      row("เมื่อวันที่", formatThaiDate(c.l2MeetingDate)) +
      section("คณะอนุกรรมการพิจารณากลั่นกรองฯ เห็นว่า", c.l2CommitteeOpinion) +
      section(
        "มติที่ประชุม",
        (c.l2ResolutionTypeName || "") + " — " + (c.l2ResolutionDetail || ""),
      ) +
      row(
        "๕. ผู้รับผิดชอบข้อมูลข่าวสาร",
        c.l2DataOwner || "กองกฎหมาย สำนักงาน ป.ป.ท.",
      )
    );
  }

  /* ------------------------------------------------------------ THAI DATES */
  const TH_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  function formatThaiDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "-";
    return dt.getDate() + " " + TH_MONTHS[dt.getMonth()] + " " + (dt.getFullYear() + 543);
  }

  function formatThaiDateTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "-";
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return formatThaiDate(dt) + " เวลา " + hh + ":" + mm + " น.";
  }

  /* --------------------------------------------------------------- STORE */
  const Activity102 = {
    STEPS: STEPS,
    ROUTES: ROUTES,
    RESOLUTION_TYPES: RESOLUTION_TYPES,
    CASE_STATES: CASE_STATES,
    BOARD_APPEAL_RESOLUTION_TYPES: BOARD_APPEAL_RESOLUTION_TYPES,
    isAppealCase: isAppealCase,
    SIGN_CHAIN: SIGN_CHAIN,
    stepByCode: stepByCode,
    stepByPage: stepByPage,
    labelOf: labelOf,
    colorOf: colorOf,
    isSigned: isSigned,
    signState: signState,
    renderSignChain: renderSignChain,

    /* คำร้อง/อุทธรณ์ของกิจกรรม 10.2 (หมวดหมู่ขึ้นต้นด้วย "10.2")
       01-work-inbox.html remaps store rows into its own shape, where the
       category lands on `type` (and the untouched record on `raw`), so accept
       any of the three rather than only the store's own field name. */
    isDisclosureCase: function (kase) {
      if (!kase) return false;
      const cat =
        kase.category || kase.type || (kase.raw && kase.raw.category) || "";
      return String(cat).indexOf("10.2") === 0;
    },

    /* Activity10.getCaseById() falls back to cases[0] when the id is unknown,
       which would silently open a 10.1 case here. Filter to 10.2 first. */
    getCase: function (caseId, fallbackStatusCode) {
      const all = (Activity10.getCases && Activity10.getCases()) || [];
      const pool = all.filter(Activity102.isDisclosureCase);
      const exact = caseId && pool.find(function (c) { return c.id === caseId; });
      if (exact) return exact;
      return (
        pool.find(function (c) { return c.statusCode === fallbackStatusCode; }) ||
        pool[0] ||
        null
      );
    },

    /* เดินงานไปขั้นถัดไปตามตาราง STEPS — ใช้ร่วมกันทุกหน้า */
    advance: function (caseId, stepCode, patch) {
      const step = stepByCode(stepCode);
      if (!step) return null;
      const next = Object.assign(
        {
          status: step.status,
          statusCode: step.statusCode,
          statusBadge: "bg-primary text-white",
          l2Step: step.code,
          l2StepSeq: step.seq,
        },
        patch || {},
      );
      return Activity10.updateCase(caseId, next);
    },

    /* บันทึกลายเซ็นลงช่องของบทบาทที่กำลังลงนามอยู่ */
    sign: function (caseId, slot, imageDataUrl, extra) {
      const kase = Activity10.getCaseById(caseId);
      if (!kase) return null;
      const sigs = Object.assign({}, kase.l2Signatures || {});
      sigs[slot] = Object.assign(
        { image: imageDataUrl, signedAt: formatThaiDateTime(new Date()) },
        extra || {},
      );
      return Activity10.updateCase(caseId, { l2Signatures: sigs });
    },

    /* ล้างลายเซ็นของ slot ที่ระบุ — ใช้ตอน "ส่งกลับ" คำร้องไปขั้นก่อนหน้า เพื่อ
       บังคับให้ขั้นนั้นพิจารณาและลงนามใหม่ ไม่ให้ลายเซ็นเดิมค้างอยู่กับเอกสารที่
       ถูกส่งกลับมาแก้ไขแล้ว */
    unsign: function (caseId, slot) {
      const kase = Activity10.getCaseById(caseId);
      if (!kase) return null;
      const sigs = Object.assign({}, kase.l2Signatures || {});
      delete sigs[slot];
      return Activity10.updateCase(caseId, { l2Signatures: sigs });
    },

    /* ออกเลขหนังสือส่งภายใน (LAW0046) — ไม่มีหน้าแยก ผูกกับปุ่มส่งของหน้า 07 */
    issueInternalDocNo: function (caseId) {
      const kase = Activity10.getCaseById(caseId);
      if (kase && kase.l2InternalDocNo) return kase.l2InternalDocNo;
      const seq = String(4400 + Math.floor(Math.random() * 500)).padStart(4, "0");
      const docNo = "ปป 0002/" + seq;
      Activity10.updateCase(caseId, {
        l2InternalDocNo: docNo,
        l2InternalDocDate: formatThaiDate(new Date()),
      });
      return docNo;
    },

    /* ออกเลขหนังสือส่งภายในของเอกสารฉบับอื่น (LAW0051/055/061/068) — เอกสาร
       Part 2 แต่ละฉบับ (หนังสือแจ้งมติเปิดเผย/บางส่วน, บันทึกมติไม่อนุญาต,
       หนังสือแจ้งมติไม่อนุญาต) เป็นคนละฉบับกับบันทึกเสนอเลขาธิการของ Part 1
       จึงต้องมีเลขที่หนังสือของตัวเอง เก็บคนละฟิลด์ (docField) ทำหน้าที่เดียว
       กับ issueInternalDocNo แต่รับชื่อฟิลด์เป็นพารามิเตอร์แทนที่จะฮาร์ดโค้ด */
    issueDocNo: function (caseId, docField, dateField) {
      const kase = Activity10.getCaseById(caseId);
      if (kase && kase[docField]) return kase[docField];
      const seq = String(4400 + Math.floor(Math.random() * 500)).padStart(4, "0");
      const docNo = "ปป 0002/" + seq;
      const patch = {};
      patch[docField] = docNo;
      patch[dateField] = formatThaiDate(new Date());
      Activity10.updateCase(caseId, patch);
      return docNo;
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

  /* "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)" — ใช้ในกล่องยืนยันและใต้ลายเซ็น */
  function signerLabel(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name + " (" + r.title + ")" : "-";
  }

  /* ------------------------------------------------------- SIGNATURE MODAL
     โครงเดียวกับหน้า 06/07/08/14/15/22 ของกิจกรรม 10.1 แต่เก็บสำเนาเดียว */
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
    const certId = cfg.certId || "PACC-2569-102";

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

  /* --------------------------------------------------------- SPEECH TO TEXT
     ปุ่มไมค์ท้าย label ของทุก textarea — สำเนาเดียวใช้ร่วมกันทุกหน้า 10.2 */
  let activeRecognition = null;
  let isRecording = false;

  function stopRecordingUI(btnEl) {
    if (btnEl) {
      btnEl.classList.remove("recording");
      btnEl.title = "คลิกเพื่อพูด (พิมพ์ด้วยเสียง Speech-to-Text)";
    }
    isRecording = false;
  }

  /* --------------------------------------------------------- RICH TEXT (Tiptap)
     ตัวช่วยแปลง <div> ให้เป็น Tiptap editor แบบขั้นต่ำ (ตัวหนา/ตัวเอียง/บูลเลต/เลข)
     ใช้เฉพาะฟิลด์ที่ป้อนเข้าตัวอย่างเอกสารสดของ 10-2-06 และ 10-2-07 โปรเจกต์นี้ไม่มี
     bundler จึงโหลด Tiptap เป็น ES module จาก CDN ผ่าน dynamic import() (ใช้ได้ใน
     classic script เช่นกัน ไม่ต้องเปลี่ยนหน้าเป็น type="module") แล้ว cache ไว้ครั้งเดียว */
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
    el.classList.add("l2-tiptap");

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

  function toggleSpeechToText(targetId, btnEl) {
    const inputEl = document.getElementById(targetId);
    if (!inputEl) return;

    const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

    if (isRecording) {
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) { /* already stopped */ }
      }
      stopRecordingUI(btnEl);
      return;
    }

    if (!SpeechRecognition) {
      Swal.fire({
        icon: "info",
        title: "พิมพ์ด้วยเสียง",
        text: "เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API โดยตรง กรุณาใช้งานผ่าน Google Chrome หรือ Microsoft Edge",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "th-TH";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = function () {
        isRecording = true;
        activeRecognition = recognition;
        if (btnEl) {
          btnEl.classList.add("recording");
          btnEl.title = "กำลังฟังเสียง... (คลิกอีกครั้งเพื่อหยุด)";
        }
        Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        }).fire({ icon: "info", title: "🎙️ กำลังฟังเสียงภาษาไทย... กรุณาพูดข้อความ" });
      };

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        if (!transcript) return;
        const editor = richEditors.get(targetId);
        if (editor) {
          /* ฟิลด์ที่เป็น Tiptap editor — แทรกคำที่พูดตรงตำแหน่งเคอร์เซอร์ */
          editor.chain().focus().insertContent(transcript + " ").run();
        } else {
          const currentVal = inputEl.value ? inputEl.value.trim() : "";
          inputEl.value = currentVal ? currentVal + " " + transcript : transcript;
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };

      recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        stopRecordingUI(btnEl);
      };

      recognition.onend = function () { stopRecordingUI(btnEl); };

      recognition.start();
    } catch (err) {
      console.error("Recognition start error:", err);
      stopRecordingUI(btnEl);
    }
  }

  /* ---------------------------------------------------------- PAGE HELPERS */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text == null || text === "" ? "-" : text;
  }

  /* เอกสารแนบประกอบคำร้อง — แนบไว้ตั้งแต่ 02-board-intake.html (attachmentFileNames)
     เก็บแค่ชื่อไฟล์ ไม่มีไบต์ไฟล์จริงให้ดาวน์โหลด (mockup ไม่มี backend เก็บไฟล์)
     ใช้ร่วมกันทุกหน้า 10-2-xx ผ่าน populateCommon() */
  function renderAttachments(containerId, fileNames) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const files = fileNames || [];
    if (!files.length) {
      el.innerHTML = '<div class="read-box l2-optional">ไม่มีเอกสาร</div>';
      return;
    }
    el.innerHTML = files
      .map(function (name) {
        const safeName = String(name).replace(/'/g, "\\'");
        return (
          '<div class="l2-attachment-row">' +
          '<div class="l2-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' +
          name +
          "</div>" +
          '<button type="button" class="btn btn-secondary" style="height: 28px; padding: 0 10px; font-size: 0.8em" onclick="ECMIS102.mockOpenFile(\'' +
          safeName +
          "')\">" +
          '<i class="fa-solid fa-download me-1"></i>ดาวน์โหลด</button>' +
          "</div>"
        );
      })
      .join("");
  }

  /* การ์ด "ข้อมูลคำร้องเดิม" (มติชี้มูล/ร่างเสนอบอร์ด/บอร์ดตอบกลับ + มติกิจกรรมที่ 7
     ครั้งอื่น + เอกสารแนบทั้งหมดของสำนวนเดิม) — เดิมมีแค่ appeal-01 ผู้ใช้ขอให้ทุกหน้า
     ในสาย Flow อุทธรณ์เห็นประวัติสำนวนเดิมนี้เหมือนกันหมด จึงย้ายมาเป็นฟังก์ชันร่วม
     ใช้กับ populate() ของทุกหน้า appeal-0X */
  function renderOtherBoardResolutions(containerId, groupId, list) {
    const el = document.getElementById(containerId);
    const group = document.getElementById(groupId);
    if (!el || !group) return;
    if (!list || !list.length) {
      group.classList.add("d-none");
      return;
    }
    group.classList.remove("d-none");
    el.innerHTML = list
      .map(function (r) {
        return (
          '<div class="l2-note l2-note-info" style="margin-bottom: 8px">' +
          "<i class=\"fa-solid fa-gavel\"></i><div>" +
          "<strong>" + (r.activity || "-") + "</strong> — " + (r.date || "-") + "<br />" +
          (r.resolution || "-") +
          (r.detail ? '<div style="margin-top: 4px; opacity: 0.85">' + r.detail + "</div>" : "") +
          "</div></div>"
        );
      })
      .join("");
  }

  /* กรณีคำร้องถูกสร้างเองระหว่างทดสอบ (A1 → DENY → H3) จะไม่มี attachmentFileNames /
     l2OtherBoardResolutions ที่ hardcode ไว้เฉพาะคำร้องตัวอย่าง — สร้างข้อมูลจำลองที่
     สมเหตุสมผลให้ทุกคำร้องแทนที่จะโชว์ "-" เปล่า ๆ */
  function fallbackAttachments() {
    return ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสืออุทธรณ์.pdf"];
  }

  function fallbackOtherBoardResolutions(kase) {
    return [
      {
        activity: "กิจกรรมที่ 7 — พิจารณาสำนวนไต่สวนหลัก",
        date: (kase && kase.l2DenyAssignDate) || new Date().toISOString().split("T")[0],
        resolution: "รับทราบและให้ดำเนินการไต่สวนตามระเบียบต่อไป",
        detail: "คณะกรรมการ ป.ป.ท. มีมติต่อสำนวน " + ((kase && kase.relatedCaseNo) || "-") + " ไว้อ้างอิงประกอบการพิจารณาอุทธรณ์",
      },
    ];
  }

  /* เรนเดอร์ทุกฟิลด์ของการ์ด "ข้อมูลคำร้องเดิม" ในหน้าเดียว — หน้าเรียกต้องมี read-box
     ไอดีตรงกับที่ appeal-01 ใช้: f_relatedCaseNo, f_originalOfficer, f_originalOfficerOrg,
     f_resolutionScreening, f_resolutionBoardDraft, f_resolutionBoardReply,
     f_otherBoardResolutions (+ group id "otherBoardResolutionsGroup"), f_origAttachments */
  function renderOriginalCaseCard(kase) {
    const c = kase;
    const setText = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText("f_relatedCaseNo", c.relatedCaseNo || "-");
    setText("f_originalOfficer", c.l2OriginalCaseOfficer || "-");
    setText("f_originalOfficerOrg", c.l2OriginalCaseOfficerOrg || "-");
    setText(
      "f_resolutionScreening",
      c.l2ResolutionAtScreening ? c.l2ResolutionAtScreening + (c.l2ResolutionAtScreeningDetail ? " — " + c.l2ResolutionAtScreeningDetail : "") : "-",
    );
    setText(
      "f_resolutionBoardDraft",
      c.l2ResolutionAtBoardDraft ? c.l2ResolutionAtBoardDraft + (c.l2ResolutionAtBoardDraftDetail ? " — " + c.l2ResolutionAtBoardDraftDetail : "") : "-",
    );
    setText(
      "f_resolutionBoardReply",
      c.l2ResolutionAtBoardReply ? c.l2ResolutionAtBoardReply + (c.l2ResolutionAtBoardReplyDetail ? " — " + c.l2ResolutionAtBoardReplyDetail : "") : "-",
    );
    renderOtherBoardResolutions("f_otherBoardResolutions", "otherBoardResolutionsGroup", c.l2OtherBoardResolutions || fallbackOtherBoardResolutions(c));
    renderAttachments("f_origAttachments", c.attachmentFileNames && c.attachmentFileNames.length ? c.attachmentFileNames : fallbackAttachments());
  }

  /* แสดงลายเซ็นของขั้นตอนก่อนหน้าทั้งหมด (Flow 4 อุทธรณ์) — slots คือ
     [{slot, title}] เรียงตามลำดับที่ลงนามจริง ใช้ร่วมกันตั้งแต่หน้า
     10-2-appeal-03 เป็นต้นไป (10-2-appeal-01 เป็นแค่ธุรการบันทึกรับเรื่อง
     ไม่มีลายเซ็น จึงยังไม่มีอะไรให้แสดงที่ 10-2-appeal-02) */
  function renderSignatureList(containerId, kase, slots) {
    const el = document.getElementById(containerId);
    if (!el || !slots || !slots.length) return;
    const sigs = signState(kase);
    el.innerHTML = slots
      .map(function (s) {
        const sig = sigs[s.slot];
        const img =
          sig && sig.image
            ? '<img class="l2-sig-img" src="' + sig.image + '" alt="ลายเซ็น" />'
            : '<div class="l2-sig-placeholder">รอลงนาม</div>';
        const when =
          sig && sig.signedAt
            ? '<div class="l2-sign-when">' + sig.signedAt + "</div>"
            : "";
        return (
          '<div class="l2-sig-slot">' +
          img +
          '<div class="l2-sig-role">' +
          s.title +
          "</div>" +
          when +
          "</div>"
        );
      })
      .join("");
  }

  /* เปิด/ดาวน์โหลดไฟล์จริงไม่ได้ในmockup นี้ — แสดง toast แทน (ใช้แบบเดียวกับ
     07-group-director-approval.html ที่มีปุ่ม "ดาวน์โหลดร่าง" อยู่แล้ว) */
  function mockOpenFile(name) {
    Swal.fire({
      icon: "info",
      title: "เปิดไฟล์ " + name + "...",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ------------------------------------------------------ DOC PREVIEW VIEWER
     ตัวช่วยของแถบเครื่องมือ "ตัวอย่างเอกสารสด" (.l2-doc-viewer) บน 10-2-06/07
     — ซูม, สลับปุ่มดูทีละหน้า/ต่อเนื่อง (เอกสารสั้น จึงมีหน้าเดียวเสมอ ปุ่มนี้
     เป็นภาพลักษณ์เท่านั้น), เลื่อนโฟกัสไปฟอร์ม, ส่งออก DOCX จริงฝั่งไคลเอนต์ */
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

  /* เริ่มต้นค่าซูมของแผงเอกสาร (เรียกครั้งเดียวตอน DOMContentLoaded) เพื่อให้
     หน้ากระดาษ A4 พอดีกับคอลัมน์ตัวอย่างที่ค่อนข้างแคบ (300–400px) */
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
    const bar = btnEl.closest(".l2-doc-viewmode");
    if (!bar) return;
    bar.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("is-active", b === btnEl);
    });
  }

  /* คลิก "แก้ไขเอกสาร" ในแผงตัวอย่าง → เลื่อนไปโฟกัสฟิลด์แรกของฟอร์มกรอกข้อมูล
     (ฟอร์มยังเป็นแหล่งข้อมูลจริงหนึ่งเดียว ตัวอย่างเอกสารอ่านอย่างเดียวเสมอ) */
  function focusFirstField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el.matches("input, textarea, select, [contenteditable]")
        ? el
        : el.querySelector("input, textarea, select, [contenteditable], .l2-choice");
    if (focusable && typeof focusable.focus === "function") {
      window.setTimeout(function () { focusable.focus(); }, 300);
    }
  }

  /* ส่งออกตัวอย่างเอกสารสดเป็นไฟล์ .docx จริงฝั่งไคลเอนต์ ผ่าน html-docx-js
     โหลดเป็น UMD <script> ธรรมดาจาก unpkg (ไม่ใช่ dynamic import ESM แบบ Tiptap
     เพราะซอร์สของไลบรารีนี้ใช้ `with` statement ซึ่ง esm.sh/esbuild แปลงเป็น
     ES module แบบ strict mode ไม่ได้ — ทดสอบแล้วได้ 500 จาก esm.sh) */
  let docxScriptPromise = null;
  function loadDocxLib() {
    if (global.htmlDocx) return Promise.resolve(global.htmlDocx);
    if (!docxScriptPromise) {
      docxScriptPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js";
        script.onload = function () { resolve(global.htmlDocx); };
        script.onerror = function () { reject(new Error("โหลดไลบรารี html-docx-js ไม่สำเร็จ")); };
        document.head.appendChild(script);
      });
    }
    return docxScriptPromise;
  }

  function exportDocx(pageId, fileName) {
    const el = document.getElementById(pageId);
    if (!el) return;

    Swal.fire({
      title: "กำลังสร้างไฟล์ DOCX...",
      allowOutsideClick: false,
      didOpen: function () { Swal.showLoading(); },
    });

    loadDocxLib()
      .then(function (lib) {
        const asBlob = lib && lib.asBlob;
        if (typeof asBlob !== "function") throw new Error("html-docx-js ไม่พร้อมใช้งาน");

        const html =
          "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>" +
          el.innerHTML +
          "</body></html>";
        const blob = asBlob(html);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (fileName || "เอกสาร") + ".docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Swal.close();
      })
      .catch(function (err) {
        console.error("exportDocx error:", err);
        Swal.fire({
          icon: "error",
          title: "ส่งออก DOCX ไม่สำเร็จ",
          text: "กรุณาลองใหม่อีกครั้ง หรือใช้ปุ่มพิมพ์แทน",
          confirmButtonColor: "#1e3a8a",
        });
      });
  }

  /* หัวโปรไฟล์มุมขวาบน — ทุกหน้า 10.2 เรียกตอน DOMContentLoaded */
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

  /* เติมตัวเลือกผู้รับมอบหมายจาก ECMIS.ROLES เฉพาะบทบาทที่ระบุ
     ปัจจุบันแต่ละบทบาทมีผู้ใช้คนเดียวจึงขึ้น 1 ตัวเลือก แต่ถ้าเพิ่มคน
     ในบทบาทเดียวกันเข้า registry ตัวเลือกจะเพิ่มตามเองโดยไม่ต้องแก้หน้า

     ทุกตัวเลือกอยู่ในตำแหน่งเดียวกันอยู่แล้ว จึงยกชื่อตำแหน่งไปไว้ที่
     ป้ายกำกับของ select (hintId) และให้ตัวเลือกแสดงแค่ชื่อ-สกุล */
  function fillRoleSelect(selectId, roleId, hintId) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const people = roles.filter(function (r) { return r.id === roleId; });
    const hint = hintId ? document.getElementById(hintId) : null;

    if (!people.length) {
      el.innerHTML = '<option value="">— ไม่พบผู้ใช้ในบทบาทนี้ —</option>';
      el.disabled = true;
      if (hint) hint.textContent = "";
      return;
    }

    el.disabled = false;
    el.innerHTML = people
      .map(function (r) {
        return (
          '<option value="' + r.login + '"' +
          ' data-name="' + r.name + '"' +
          ' data-title="' + r.title + '">' +
          r.name +
          "</option>"
        );
      })
      .join("");

    if (hint) hint.textContent = "(" + people[0].title + ")";
  }

  /* "นางสาวพิมพ์ชนก ธรรมรักษ์ (ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร)" — ชื่อเต็มของ
     ตัวเลือกที่เลือกอยู่ ใช้บันทึกลง officer เพราะ option แสดงแค่ชื่อ */
  function selectedPersonLabel(selectId) {
    const el = document.getElementById(selectId);
    const opt = el && el.selectedOptions && el.selectedOptions[0];
    if (!opt) return "-";
    const name = opt.dataset.name || opt.text;
    const title = opt.dataset.title || "";
    return title ? name + " (" + title + ")" : name;
  }

  /* แถบขั้นตอน — สร้างจากตาราง STEPS จึงไม่ต้องเขียนซ้ำในทุกหน้า
     kase (ไม่บังคับ): เมื่อส่งมา จะกรองขั้นตอนที่มี includeIf ออกถ้า
     kase.l2ResolutionType ไม่อยู่ในลิสต์นั้น — ใช้กับหน้า Part 2 (10-2-10
     เป็นต้นไป) ที่แยกสาขา DISCLOSE/PARTIAL/DENY เพื่อไม่ให้แถบขั้นตอนของ
     คำร้องสาขาหนึ่งไปโชว์ขั้นตอนของอีกสาขาที่คำร้องนั้นไม่มีวันผ่าน
     หน้าเดิม (10-2-01 ถึง 10-2-09) ไม่ส่ง kase มา จึงยังเห็นครบทุกขั้นเหมือนเดิม */
  function renderStepper(containerId, currentCode, kase) {
    const el = document.getElementById(containerId);
    if (!el) return;
    /* หน้า Part 1 (10-2-01 ถึง 10-2-10, ขั้นตอนที่ไม่มี includeIf) ยังไม่ทราบ
       ว่าจะไปเส้นทางไหนของ Part 2 (หรือทราบแล้วจาก l2ResolutionType แต่ยังไม่
       ควรโชว์ล่วงหน้า) จึงตัดขั้นตอน Part 2 ทั้งหมด (มี includeIf) ออกจากแถบ
       เสมอ ไม่ว่าคำร้องจะมีมติแล้วหรือไม่ — โชว์ตามสาขาจริงเฉพาะตอนอยู่ในหน้า
       Part 2 เอง (currentCode มี includeIf) เท่านั้น */
    const curStep = stepByCode(currentCode);
    const onPart1 = !curStep || !curStep.includeIf;
    const branch = kase && kase.l2ResolutionType;
    /* คำร้องเก่าก่อนเพิ่มฟีเจอร์สถานะคดี (100010-100016 เป็นต้น) ไม่มี l2CaseState
       เลย — ให้ถือว่าเป็น "อยู่ระหว่างไต่สวน" (พฤติกรรมเดิมก่อนแยกสาย Flow 3) */
    const caseState = (kase && kase.l2CaseState) || "INVESTIGATING";
    const visible = STEPS.filter(function (s) {
      /* ตัด L2-DEPUTY-SG-OPINION (10-2-32), L2-SECGEN-OPINION (10-2-31) และ
         L2-RECEIVE-OUTCOME (10-2-10, "ธุรการ รับมติ") ออกจากแถบขั้นตอนของหน้า
         Part 1 ทั้งหมดตามที่ขอ — เหลือแถบสิ้นสุดที่ L2-DISPATCH (10-2-09,
         "ธุรการ ออกเลขส่ง") */
      if (
        onPart1 &&
        (s.code === "L2-DEPUTY-SG-OPINION" ||
          s.code === "L2-SECGEN-OPINION" ||
          s.code === "L2-RECEIVE-OUTCOME")
      )
        return false;
      if (!s.includeIf) return true;
      if (onPart1) return false;
      if (s.caseState && s.caseState.indexOf(caseState) === -1) return false;
      return branch && s.includeIf.indexOf(branch) > -1;
    });
    const curIdx = visible.findIndex(function (s) { return s.code === currentCode; });
    el.innerHTML = visible.map(function (step, i) {
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

  /* Part 1 (แถวบน, ส่งเสนอผู้บริหาร — จบที่ L2-DISPATCH 10-2-09) กับ Part 2 (แถวล่าง,
     เริ่มที่ขั้นตอนเลขาพิจารณา L2-DEPUTY-SG-OPINION แล้วแยกสาขาตาม l2ResolutionType)
     — ตัดจาก STEPS ด้วยรหัสขั้นตอน ไม่ใช้ index ตายตัว เพราะเมื่อเพิ่ม/ลบขั้นตอน
     ก่อนจุดแบ่ง (เช่น 10-2-33/34) index จะเลื่อนแล้วแถวล่างเริ่มผิดที่ */
  const PART2_START = STEPS.findIndex(function (s) { return s.code === "L2-DEPUTY-SG-OPINION"; });
  const PART1_STEPS = STEPS.slice(0, PART2_START);
  const PART2_STEPS = STEPS.slice(PART2_START);

  /* แถบขั้นตอนแบบ 2 แถวสำหรับหน้า 10-2-10 ถึง 10-2-17 — แถวบนคงที่ (Part 1
     ส่งเสนอเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมายเสร็จสิ้นเสมอ เพราะถึงหน้านี้ได้
     แปลว่าผ่าน Part 1 มาแล้ว) แถวล่างเริ่มที่ขั้นตอน Part 2 เฉพาะสาขาของคำร้องนี้
     (เริ่มที่ L2-SECGEN-OPINION, 10-2-31 ซึ่งเป็น step จริงใน STEPS แล้ว — เดิม
     เคยเป็น node สังเคราะห์ "บอร์ดมีมติ..." ที่ไม่มีหน้าของตัวเอง ดูประวัติการ
     แก้ไขถ้าต้องย้อนดู) และปิดท้ายด้วยสถานะคดี (l2CaseState) ถ้ามีค่า */
  function renderStepperV2(part1ContainerId, part2ContainerId, currentCode, kase, appealPartId) {
    const el1 = document.getElementById(part1ContainerId);
    const el2 = document.getElementById(part2ContainerId);
    if (!el1 || !el2) return;
    const elAppeal = appealPartId ? document.getElementById(appealPartId) : null;

    el1.innerHTML = PART1_STEPS.map(function (step) {
      return (
        '<div class="step-item completed" title="' + step.label + '">' +
        '<div class="step-circle"><i class="fa-solid fa-check"></i></div>' +
        '<div class="step-label">' + step.stepName + "</div>" +
        "</div>"
      );
    }).join("");

    const branch = kase && kase.l2ResolutionType;
    /* คำร้องเก่าก่อนเพิ่มฟีเจอร์สถานะคดีไม่มี l2CaseState — ถือว่าเป็น
       "อยู่ระหว่างไต่สวน" (พฤติกรรมเดิมก่อนแยกสาย Flow 3) เหมือนกับที่
       renderStepper (แถบเดี่ยวเดิม) ทำไว้ด้านบน */
    const caseState = (kase && kase.l2CaseState) || "INVESTIGATING";
    /* จุดแยกสาขา ๖/๗ (L2-DEPUTY-SG-OPINION/L2-SECGEN-OPINION) มีแค่สายเดียวที่
       เกิดขึ้นจริงต่อคำร้อง เลือกไว้แล้วที่ 10-2-09 (kase.l2ApprovalBranch) —
       ก่อนถึง 10-2-09 ค่านี้ยังไม่มี จึงโชว์ทั้งคู่ไปก่อน (renderStepper แถบเดี่ยว
       ของ Part 1 ตัดทั้งสองออกไปแล้วอยู่ดี ไม่มีผลจนกว่าจะถึง Part 2) */
    const approvalBranch = kase && kase.l2ApprovalBranch;
    /* จุดเริ่มต้นอุทธรณ์ 2 ทาง (ส่วนกลาง/เขต) — คำร้องแต่ละใบเดินแค่สายเดียว
       (l2AppealIntakeChannel ถูกตั้งตอน H3 จำลองการยื่นอุทธรณ์) ยังไม่มีค่านี้
       (คำร้องเก่ายังไม่ผ่านฟีเจอร์นี้) ให้ถือว่าเป็นสายส่วนกลาง (ค่าเริ่มต้นเดิม
       ก่อนแยกสาย) เหมือนที่ caseState default เป็น INVESTIGATING ด้านบน */
    const intakeChannel = (kase && kase.l2AppealIntakeChannel) || "CENTRAL";
    const visible = PART2_STEPS.filter(function (s) {
      if (s.approvalBranch && approvalBranch && s.approvalBranch.indexOf(approvalBranch) === -1) return false;
      if (s.caseState && s.caseState.indexOf(caseState) === -1) return false;
      if (s.intakeChannel && s.intakeChannel.indexOf(intakeChannel) === -1) return false;
      if (!s.includeIf) return true;
      return branch && s.includeIf.indexOf(branch) > -1;
    });
    const curIdx = visible.findIndex(function (s) { return s.code === currentCode; });
    /* คำร้องที่ถูกยื่นอุทธรณ์ (H3) เริ่มกระบวนการใหม่ทั้งหมดตั้งแต่ appeal-01 —
       ไม่ใช่ขั้นตอนต่อเนื่องจากสาย DENY ที่ปิดสำนวนไปแล้ว (10-2-10/15/16/17)
       เดิมคั่นด้วยเส้นแบ่งในแถวเดียวกัน — ถ้าหน้านี้ส่ง appealPartId มา (13 หน้า
       appeal-0X) จะแยกออกเป็นแถวของตัวเองต่างหากแทน (renderStepperAppealSplit) */
    const appealStartIdx = visible.findIndex(function (s) { return s.code.indexOf("L2-APPEAL") === 0; });
    const useSplitAppealRow = elAppeal && appealStartIdx > -1;

    const dividerHtml =
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;' +
      'padding-top:2px;margin:0 4px;position:relative;z-index:2;flex:0 0 auto" title="เริ่มกระบวนการอุทธรณ์ใหม่">' +
      '<div style="width:2px;height:36px;background:repeating-linear-gradient(to bottom,#7c3aed 0,#7c3aed 4px,transparent 4px,transparent 8px);margin-bottom:6px"></div>' +
      '<div style="font-size:0.7em;font-weight:700;color:#7c3aed;white-space:nowrap">▸ เริ่ม Flow อุทธรณ์</div>' +
      "</div>";

    function stepItemHtml(step, i, displayNo) {
      const cls = i < curIdx ? "completed" : i === curIdx ? "active" : "";
      const inner = i < curIdx ? '<i class="fa-solid fa-check"></i>' : String(displayNo);
      /* ตัด prefix "[เปิดเผย/บางส่วน]"/"[ไม่อนุญาต]" ฯลฯ ออกจากป้ายที่แสดงในแถบนี้
         เท่านั้น (แถวนี้แยกสาขาอยู่แล้วด้วย visible ข้างบน จึงไม่จำเป็นต้องย้ำ) —
         ไม่แตะ step.stepName ที่ renderStepper (แถบเดี่ยวเดิม) ยังใช้ค่าดิบอยู่ */
      const shortLabel = step.stepName.replace(/^\[[^\]]*\]\s*/, "");
      return (
        '<div class="step-item ' + cls + '" title="' + step.label + '">' +
        '<div class="step-circle">' + inner + "</div>" +
        '<div class="step-label">' + shortLabel + "</div>" +
        "</div>"
      );
    }

    const endNode = kase && kase.l2CaseState
      ? '<div class="step-item completed" title="สถานะคดีที่เกี่ยวข้อง">' +
        '<div class="step-circle"><i class="fa-solid fa-flag-checkered"></i></div>' +
        '<div class="step-label">สถานะคดี: ' + labelOf(CASE_STATES, kase.l2CaseState) + "</div>" +
        "</div>"
      : "";

    if (useSplitAppealRow) {
      /* หน้า appeal-0X — แยก Flow อุทธรณ์ออกเป็นแถวหลักของตัวเอง (นับเลข 1 ใหม่)
         ส่วนขั้นตอนก่อนอุทธรณ์ (Part 2 เดิม สาย DENY ที่ปิดสำนวนไปแล้ว) เหลือไว้ใน
         el2 ให้หน้าไปห่อด้วย accordion พับเก็บเอง (ดู toggleStepperAccordion) */
      const preAppeal = visible.slice(0, appealStartIdx);
      const appealSteps = visible.slice(appealStartIdx);
      el2.innerHTML = preAppeal.map(function (step, i) { return stepItemHtml(step, i, i + 1); }).join("") + endNode;
      elAppeal.innerHTML = appealSteps
        .map(function (step, i) { return stepItemHtml(step, appealStartIdx + i, i + 1); })
        .join("");
      return;
    }

    const stepsHtml = visible.map(function (step, i) {
      const isAppealStep = step.code.indexOf("L2-APPEAL") === 0;
      const displayNo = appealStartIdx > -1 && isAppealStep ? i - appealStartIdx + 1 : i + 1;
      const prefix = appealStartIdx > -1 && i === appealStartIdx ? dividerHtml : "";
      return prefix + stepItemHtml(step, i, displayNo);
    }).join("");
    el2.innerHTML = stepsHtml + endNode;
  }

  /* พับ/กางแถบขั้นตอนก่อนอุทธรณ์ (accordion body) — ใช้ร่วมกันทุกหน้า appeal-0X */
  function toggleStepperAccordion() {
    const body = document.getElementById("stepperAccordionBody");
    const icon = document.getElementById("stepperAccordionIcon");
    if (!body) return;
    const isHidden = body.classList.toggle("d-none");
    if (icon) icon.className = isHidden ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up";
  }

  /* แบดจ์คู่ "มติ" + "สถานะคดี" — โชว์ให้ชัดว่าคำร้องนี้เป็นสาย/สถานะไหน
     (l2ResolutionType จาก 10-2-06, l2CaseState จาก 10-2-06 เบื้องต้นแล้วยืนยัน/
     แก้ไขจริงที่ 10-2-10 เมื่อรับมติจากกิจกรรมที่ 7) ใช้ร่วมกันทุกหน้า Part 2 */
  function renderStatusBadges(containerId, kase) {
    const el = document.getElementById(containerId);
    if (!el || !kase) return;
    const resValue = kase.l2ResolutionType;
    const caseStateValue = kase.l2CaseState || "INVESTIGATING";
    const resLabel = labelOf(RESOLUTION_TYPES, resValue);
    const resColor = colorOf(RESOLUTION_TYPES, resValue);
    const csLabel = labelOf(CASE_STATES, caseStateValue);
    const csColor = colorOf(CASE_STATES, caseStateValue);
    const chip = (label, color) =>
      '<span class="badge" style="background:' + color + ';color:#fff">' + label + "</span>";
    const appealChip = isAppealCase(kase) ? chip("อุทธรณ์", "#7c3aed") : "";
    el.innerHTML = resValue ? appealChip + chip(resLabel, resColor) + chip(csLabel, csColor) : "";
  }

  /* เมนูข้างซ้ายของงาน 10.2 — แสดงเฉพาะขั้นตอนที่บทบาทนั้นรับผิดชอบ
     ถ้าส่ง kase มา (ทราบ l2ResolutionType ของคำร้องที่กำลังเปิดอยู่แล้ว) จะตัด
     ขั้นตอนของสาขาอื่นออกด้วย เหมือนที่ renderStepper ทำ — กันไม่ให้เมนูโชว์ทั้ง
     เส้นทาง [เปิดเผย/บางส่วน] และ [ไม่อนุญาต] ปนกันสำหรับคำร้องที่มีมติแล้ว */
  function renderSidebarMenu(containerId, activePage, kase) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const roleId = currentRoleId();
    const branch = kase && kase.l2ResolutionType;
    const caseState = (kase && kase.l2CaseState) || "INVESTIGATING";
    const mine = STEPS.filter(function (s) {
      if (s.role !== roleId || s.page.indexOf("10-2-") !== 0) return false;
      if (s.caseState && s.caseState.indexOf(caseState) === -1) return false;
      if (!s.includeIf) return true;
      return !branch || s.includeIf.indexOf(branch) > -1;
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

  /* -------------------------------------------------------------- EXPORTS */
  global.Activity102 = Activity102;
  global.ECMIS102 = {
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    currentRoleId: currentRoleId,
    currentRole: currentRole,
    signerLabel: signerLabel,
    openSignatureModal: openSignatureModal,
    toggleSpeechToText: toggleSpeechToText,
    initUserProfile: initUserProfile,
    guardRole: guardRole,
    setText: setText,
    setHtml: setHtml,
    goInbox: goInbox,
    fillRoleSelect: fillRoleSelect,
    selectedPersonLabel: selectedPersonLabel,
    renderStepper: renderStepper,
    renderStepperV2: renderStepperV2,
    toggleStepperAccordion: toggleStepperAccordion,
    renderStatusBadges: renderStatusBadges,
    renderSidebarMenu: renderSidebarMenu,
    mountEditor: mountEditor,
    getEditorText: getEditorText,
    getEditorHTML: getEditorHTML,
    renderAttachments: renderAttachments,
    renderOriginalCaseCard: renderOriginalCaseCard,
    renderSignatureList: renderSignatureList,
    renderMemoDocument: renderMemoDocument,
    renderResolutionSheet: renderResolutionSheet,
    choiceGridHtml: choiceGridHtml,
    renderCommitteeAttachSheet: renderCommitteeAttachSheet,
    renderCommitteeMemoDoc: renderCommitteeMemoDoc,
    renderBoardResolutionCard: renderBoardResolutionCard,
    renderNoticeDoc: renderNoticeDoc,
    mockOpenFile: mockOpenFile,
    zoomDoc: zoomDoc,
    initDocZoom: initDocZoom,
    setDocViewMode: setDocViewMode,
    focusFirstField: focusFirstField,
    exportDocx: exportDocx,
  };

  /* หน้าเพจเรียกตรง ๆ ผ่าน onclick="toggleSpeechToText(...)" ตามแบบเดิมของ 10.1 */
  global.toggleSpeechToText = toggleSpeechToText;
})(window);
