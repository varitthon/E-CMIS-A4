/* ==========================================================================
   E-CMIS Back-Office — Shared runtime (กิจกรรมที่ 7.1 การไต่สวนเบื้องต้น)
   อ้างอิงผัง: กิจกรรมที่ 7-V2.0.drawio  หน้า "TO-BE ไต่สวนเบื้องต้น" และ
              "TO-BE P2 Core Workflow (Swimlane)"  T1–T14 / G1–G5
   หมายเหตุ: prototype นี้ยังไม่มี RBAC จริง ใช้ current-user switcher สาธิต
   ========================================================================== */
(function (global) {
'use strict';

/* ---------------------------------------------------------------- ROLES
   scope:'UPSTREAM' = อยู่นอกขอบเขตกิจกรรมที่ 7 — เป็นการเสนอตามลำดับชั้น
                      ภายในกอง / สำนักงาน ป.ป.ท. เขต ซึ่งเป็นของกิจกรรมที่ 5
   scope:'IN'       = อยู่ในขอบเขตกิจกรรมที่ 7
   จุดเริ่มต้นของกิจกรรมที่ 7 คือ "เลขาธิการคณะกรรมการ ป.ป.ท."            */
/* ครบ 27 ตำแหน่ง / 11 กลุ่มงาน ตาม Google Sheet tab "กลุ่มผู้ใช้งานระบบ"
   perms = ชุดสิทธิ์ที่ระบบบังคับใช้จริง (ดูตาราง PERM_DEFS ด้านล่าง)          */
/* ครบ 13 ตำแหน่งตาม Google Sheet จัดการ Role ของผู้ใช้งานระบบ (กิจกรรม 10.1, 10.2, 10.3)
   perms = ชุดสิทธิ์ที่ระบบบังคับใช้จริง          */
const ROLES = [
  /* ── 1. คณะกรรมการ ป.ป.ท. ─────────────────────────────────────────── */
  { id:'chairman', login:'Wichai.Y', row:1, group:'คณะกรรมการ ป.ป.ท.', title:'ประธานกรรมการ ป.ป.ท.',
    name:'นายวิชัย ยุติธรรม', org:'คณะกรรมการ ป.ป.ท.', act:'10.1, 10.2, 10.3',
    responsibilities:'รับทราบคำวินิจฉัยอัยการสูงสุด (ในกรณีเห็นแย้ง), ลงนามในมติการเปิดเผยข้อมูล, ลงนามในคำให้การ/คำชี้แจงต่อศาลปกครอง และหนังสือมอบอำนาจ',
    note:'มีอำนาจตัดสินใจระดับบอร์ด หากบอร์ดมีมติเห็นแย้งกับอัยการ ต้องส่งเรื่องให้อัยการสูงสุดชี้ขาด',
    perms:['view.all','download','sign.ruling','vote'] },
  { id:'board', login:'Somboon.T', row:2, group:'คณะกรรมการ ป.ป.ท.', title:'กรรมการ ป.ป.ท.',
    name:'นายสมบูรณ์ ธรรมรัฐ', org:'คณะกรรมการ ป.ป.ท.', act:'10.1, 10.2, 10.3',
    responsibilities:'พิจารณาลงมติ "เห็นชอบ/เห็นแย้ง" กับความเห็นอัยการ, พิจารณาอนุมัติเปิดเผยข้อมูลข่าวสาร และตรวจความถูกต้องของคำให้การคดีปกครอง',
    note:'เป็นผู้พิจารณาลงมติในที่ประชุมบอร์ดชุดใหญ่ (ไม่ใช่ผู้กลั่นกรองก่อนเข้าบอร์ด)',
    perms:['view.all','download','vote'] },

  /* ── 2. คณะอนุกรรมการ ─────────────────────────────────────────────── */
  { id:'subcommittee_screen', login:'Kitti.P', row:3, group:'คณะอนุกรรมการ', title:'คณะอนุกรรมการกลั่นกรองฯ',
    name:'นายกิตติ ปรีชาญาณ', org:'ส่วนกลาง', act:'10.2',
    responsibilities:'พิจารณาและให้ความเห็นเบื้องต้นเกี่ยวกับคำขอเปิดเผยข้อมูลข่าวสาร ก่อนเสนอเข้าที่ประชุมคณะกรรมการ ป.ป.ท.',
    note:'กลั่นกรองเรื่องก่อนเสนอเข้าบอร์ดชุดใหญ่ (เฉพาะกิจกรรม 10.2 เท่านั้น)',
    perms:['view.assigned','download','support.opinion'] },
  { id:'subcommittee_appeal', login:'Sumet.N', row:4, group:'คณะอนุกรรมการ', title:'คณะอนุกรรมการวินิจฉัยอุทธรณ์',
    name:'นายสุเมธ นิติธรรม', org:'ส่วนกลาง', act:'10.2',
    responsibilities:'พิจารณาวินิจฉัยคำอุทธรณ์ ในกรณีที่ ป.ป.ท. มีมติไม่อนุญาตให้เปิดเผยข้อมูล',
    note:'กลั่นกรองและวินิจฉัยก่อนเสนอเข้าบอร์ดชุดใหญ่ (เฉพาะกิจกรรม 10.2 เท่านั้น)',
    perms:['view.assigned','download','screen.vote'] },

  /* ── 3. คณะผู้บริหาร ───────────────────────────────────────────────── */
  { id:'secgen', login:'Apichat.S', row:5, group:'คณะผู้บริหาร', title:'เลขาธิการ ป.ป.ท.',
    name:'นายอภิชาติ สุจริตกุล', org:'สำนักงาน ป.ป.ท.', act:'10.1, 10.2, 10.3',
    responsibilities:'พิจารณากลั่นกรองความเห็นของนิติกรก่อนเสนอบอร์ด และลงนามในหนังสือถึงอัยการ/ศาล',
    note:'สามารถมอบอำนาจให้รองเลขาธิการ ป.ป.ท. "ปฏิบัติราชการแทน" ลงนามแทนในงานคดีอาญาหรือคดีปกครองได้',
    perms:['view.all','download','approve.general','sign.general'] },
  { id:'deputy_sg', login:'Surapong.W', row:6, group:'คณะผู้บริหาร', title:'รองเลขาธิการ ป.ป.ท.',
    name:'นายสุรพงษ์ วัฒนา', org:'สำนักงาน ป.ป.ท.', act:'10.1, 10.2, 10.3',
    responsibilities:'พิจารณากลั่นกรองงาน และลงนามปฏิบัติราชการแทนเลขาธิการในงานที่ได้รับมอบหมาย (เช่น กำกับดูแลกองกฎหมาย)',
    note:'ได้รับมอบอำนาจเฉพาะกองงานที่ตนกำกับดูแลเท่านั้น',
    perms:['view.all','download','approve.general'] },

  /* ── 4. กองบริหารคดี ───────────────────────────────────────────────── */
  { id:'case_management', login:'Siriporn.K', row:7, group:'กองบริหารคดี', title:'เจ้าหน้าที่กองบริหารคดี',
    name:'นางสาวศิริพร กิจการ', org:'กองบริหารคดี', act:'10.1, 10.2, 10.3',
    responsibilities:'จัดทำรายงาน/แจ้งมติให้หน่วยงานเจ้าของสำนวนทราบ และสรุปสถิติ/บันทึกมติคณะกรรมการ ป.ป.ท. ในภาพรวม',
    note:'กระจายหนังสือแจ้งมติไปยังหน่วยงานเจ้าของสำนวน',
    perms:['view.all','download','dispatch.resolution'] },

  /* ── 5. กอง/สำนักเจ้าของเรื่อง ────────────────────────────────────────── */
  { id:'original_officer', login:'Somchai.J', row:8, group:'กอง/สำนักเจ้าของเรื่อง', title:'นิติกร/นักสืบเจ้าของเรื่อง (เจ้าของสำนวนเดิม)',
    name:'นายสมชาย ใจซื่อ', org:'สนง. ป.ป.ท. เขต 1', act:'10.1, 10.2, 10.3',
    responsibilities:'ให้ข้อมูลข้อเท็จจริงประกอบการวิเคราะห์ความเห็นแย้ง, ให้ความเห็นประกอบการพิจารณาเปิดเผยข้อมูล และสนับสนุนข้อมูล/เอกสารในคดีปกครอง',
    note:'เจ้าของสำนวนเดิมมีสิทธิ์เข้าถึงเฉพาะสำนวนที่ตนเองรับผิดชอบ เพื่อเตรียมข้อมูลให้กองกฎหมาย',
    perms:['view.own','download.own'] },

  /* ── 6. กองกฎหมาย ─────────────────────────────────────────────────── */
  { id:'admin_legal', login:'Wilai.T', row:9, group:'กองกฎหมาย (กอท.)', title:'เจ้าหน้าที่ธุรการกองกฎหมาย',
    name:'นางวิไล ธุรการ', org:'กองกฎหมาย (กอท.)', act:'10.1, 10.2, 10.3',
    responsibilities:'รับสำนวน/คำร้อง/เอกสารความเห็นจากอัยการ ศาล หรือประชาชน, ลงทะเบียนออกเลขรับในระบบของกองกฎหมาย และมอบหมายงานต่อ',
    note:'ต้องดูแลระบบทะเบียนคุมเอกสารของกองกฎหมาย',
    perms:['view.all','download','intake.route','assign.work'] },
  { id:'legal_officer', login:'Nattapol.B', row:10, group:'กองกฎหมาย', title:'นิติกร (ผู้รับผิดชอบสำนวน)',
    name:'นายณัฐพล บัวทุม', org:'กองกฎหมาย', act:'10.1, 10.2, 10.3',
    responsibilities:'วิเคราะห์ข้อกฎหมาย/ข้อเท็จจริง, จัดทำบันทึกความเห็น (เห็นชอบ/เห็นแย้ง), ร่างคำให้การ/คำแก้อุทธรณ์คดีปกครอง และติดตามสถานะ/ผลคำพิพากษา',
    note:'หากงานล้นมือ นิติกรกลุ่มงานอื่นอาจถูกมอบหมายให้ช่วยดำเนินการในคดีที่ไม่ซับซ้อนได้',
    perms:['view.all','download','legal.opinion','doc.generate'] },
  { id:'group_director', login:'Arnon.C', row:11, group:'กองกฎหมาย', title:'ผู้อำนวยการกลุ่มงาน',
    name:'นายอานนท์ ชนประชา', org:'กองกฎหมาย', act:'10.1, 10.2, 10.3',
    responsibilities:'กลั่นกรองงานในระดับกลุ่มงาน และให้ความเห็นชอบเบื้องต้นก่อนเสนอผู้อำนวยการกอง',
    note:'กลั่นกรองในระดับกลุ่มงานก่อนเสนอผู้อำนวยการกอง',
    perms:['view.all','download','approve.group'] },
  { id:'dir_legal', login:'Napas.S', row:12, group:'กองกฎหมาย', title:'ผู้อำนวยการกองกฎหมาย',
    name:'นางสาวณพัสตร์ ศรีสมเกียรติ', org:'กองกฎหมาย', act:'10.1, 10.2, 10.3',
    responsibilities:'มอบหมายงานให้นิติกร, ตรวจสอบความถูกต้องของความเห็นทางกฎหมาย และลงนามเห็นชอบตามลำดับขั้น',
    note:'กลั่นกรองในระดับกองก่อนเสนอผู้บริหารระดับสูง',
    perms:['view.all','download','assign.officer','approve.general'] },

  /* ── 7. สำนักงานเลขาธิการ ───────────────────────────────────────────── */
  { id:'registry', login:'Anucha.S', row:13, group:'สำนักงานเลขาธิการ', title:'สารบรรณกลาง',
    name:'นายอนุชา สารบรรณ', org:'สำนักงานเลขาธิการ', act:'10.1, 10.2, 10.3',
    responsibilities:'รับเอกสาร/คำร้อง/หมายเรียกจากภายนอก (อัยการ/ศาล/ประชาชน) ลงทะเบียนรับเรื่อง ออกเลขรับ-ส่ง และส่งต่อให้กองที่เกี่ยวข้อง',
    note:'เป็นจุดรับเอกสารเข้า-ออกของสำนักงาน เพื่อส่งต่อเรื่องให้กองกฎหมายหรือกองบริหารคดี',
    perms:['view.all','download','docnumber.issue'] }
];

/* --------------------------------------------------- DOCUMENT TYPE + SLA
   ผัง P2 โหนด t5 (★ S1) กำหนด SLA ของชั้นเลขาธิการฯ ไว้เป็น 2 ระยะ และ
   แยกค่าตามชนิดรายงานที่เสนอเข้ามา:
     รายงาน 213 — รอลงนาม 5 วัน / ลงนามเสร็จ 3 วัน
     รายงาน 644 — เสนอ 15 วัน   / ลงนาม 15 วัน
   ค่าทั้งหมดตั้งให้ Admin แก้ได้ (TOR 7.2.1.3)                            */
const DOC_TYPES = {
  '213': {
    code:'213', label:'รายงานการไต่สวนเบื้องต้น (แบบ ปปท. ๒-๑๓)', short:'รายงาน 213',
    sla:{ waitSign:5, completeSign:3 }
  },
  '644': {
    code:'644', label:'รายงานการไต่สวนข้อเท็จจริง (แบบ ปปท. ๖-๔๔)', short:'รายงาน 644',
    sla:{ waitSign:15, completeSign:15 }
  }
};
/* ระยะที่สำนวนกำลังอยู่ในชั้นเลขาธิการฯ — ใช้เลือกเพดาน SLA ที่ถูกต้อง */
const SIGN_PHASE = {
  WAIT:     { key:'WAIT',     label:'รอเลขาธิการฯ ลงนาม',       slaKey:'waitSign' },
  COMPLETE: { key:'COMPLETE', label:'ลงนามแล้ว รอส่งต่อให้ครบ', slaKey:'completeSign' }
};

/* เพดาน SLA ของสำนวนในชั้นเลขาธิการฯ — แทนการ hard-code slaLimit ต่อสำนวน */
function secgenSlaLimit(kase){
  const dt = DOC_TYPES[kase.docType] || DOC_TYPES['213'];
  const ph = SIGN_PHASE[kase.signPhase] || SIGN_PHASE.WAIT;
  return dt.sla[ph.slaKey];
}

/* ---- นิยามสิทธิ์ที่ระบบบังคับใช้ (ใช้แสดงในหน้าจอบริหารสิทธิ์) ---- */
const PERM_DEFS = [
  { k:'view.all',      cat:'การเข้าถึง', label:'ดูสำนวนได้ทุกเรื่องในกิจกรรมที่ 7' },
  { k:'view.own',      cat:'การเข้าถึง', label:'ดูได้เฉพาะสำนวนของตนเอง', note:'ชีตแถว 17' },
  { k:'view.assigned', cat:'การเข้าถึง', label:'ดูได้เฉพาะสำนวนที่ได้รับมอบหมายให้คณะของตน' },
  { k:'download',      cat:'การเข้าถึง', label:'ดาวน์โหลดเอกสารได้ทุกเรื่อง' },
  { k:'download.own',  cat:'การเข้าถึง', label:'ดาวน์โหลดได้เฉพาะสำนวนของตนเอง', note:'ชีตแถว 17' },
  { k:'EDIT.MASTER',   cat:'การแก้ไข',  label:'แก้ไขมติ / คำสั่ง / รายงานในระบบ',
    note:'สิทธิพิเศษสูงสุด — ชีตแถว 15 ระบุว่ามีเพียง 7 คนเท่านั้น (เจ้าหน้าที่กลุ่มงานกิจการฯ 6 + ผอ.กบค. 1)', critical:true },
  { k:'record.minutes',cat:'การแก้ไข',  label:'บันทึกมติที่ประชุมเข้าระบบ' },
  { k:'lock.pdf',      cat:'การแก้ไข',  label:'ล็อกไฟล์ PDF มติ' },
  { k:'compile.minutes',cat:'การแก้ไข', label:'Auto-compile รายงานการประชุมรวม' },
  { k:'create.agenda', cat:'การแก้ไข',  label:'จัดทำระเบียบวาระการประชุม' },
  { k:'create.invite', cat:'การแก้ไข',  label:'จัดทำหนังสือเชิญประชุม' },
  { k:'secrecy.set',   cat:'การแก้ไข',  label:'กำหนดชั้นความลับของเอกสาร' },
  { k:'order24.draft', cat:'การแก้ไข',  label:'ร่างคำสั่งแต่งตั้งคณะไต่สวน ม.24' },
  { k:'doc.generate',  cat:'การแก้ไข',  label:'สร้างเอกสารจาก Mail-Merge Template' },
  { k:'sign.report213',cat:'การลงนาม',  label:'ลงนามดิจิทัลรายงาน 213 / 644' },
  { k:'sign.agenda',   cat:'การลงนาม',  label:'ลงนามสั่งบรรจุวาระการประชุม' },
  { k:'sign.order24p1',cat:'การลงนาม',  label:'ลงนามคำสั่ง ม.24 วรรคหนึ่ง (องค์คณะ)' },
  { k:'sign.order24p3',cat:'การลงนาม',  label:'ลงนามคำสั่ง ม.24 วรรคสาม (คณะอนุกรรมการไต่สวน)' },
  { k:'sign.ruling',   cat:'การลงนาม',  label:'ลงนามรายงานวินิจฉัยชี้มูล' },
  { k:'sign.general',  cat:'การลงนาม',  label:'ลงนามหนังสือทั่วไป' },
  { k:'certify.urgent',cat:'จุดควบคุม', label:'รับรองเหตุผลเร่งด่วนบนใบด่วน',
    note:'จุดควบคุม Bypass — ชีตแถว 20', critical:true },
  { k:'bypass.approve',cat:'จุดควบคุม', label:'สั่งบรรจุวาระด่วนข้ามอนุกลั่นกรองฯ', note:'ชีตแถว 1' },
  { k:'assign.subcommittee',cat:'จุดควบคุม', label:'กระจายสำนวนเข้าคณะอนุกลั่นกรองฯ 1-8' },
  { k:'decide.complex',cat:'จุดควบคุม', label:'ตัดสินว่าเป็นเรื่องยุ่งยากซับซ้อน (G1)' },
  { k:'return',        cat:'จุดควบคุม', label:'ส่งคืนสายงานต้นทาง (Return)' },
  { k:'vote',          cat:'การประชุม', label:'ลงมติในที่ประชุมคณะกรรมการ',
    note:'กรรมการที่มีส่วนได้เสียถูกกันสิทธิ์นี้ตาม ม.20 — ชีตแถว 2', critical:true },
  { k:'read.agenda.advance', cat:'การประชุม', label:'อ่านระเบียบวาระล่วงหน้า 3 วัน' },
  { k:'present.board', cat:'การประชุม', label:'ชี้แจงต่อบอร์ดแทนนักสืบ (ชั้นไต่สวนเบื้องต้น)', note:'ชีตแถว 10' },
  { k:'present.board.ruling', cat:'การประชุม', label:'ชี้แจงต่อบอร์ดด้วยตนเอง (ชั้นวินิจฉัยชี้มูล)' },
  { k:'screen.vote',   cat:'การประชุม', label:'ลงมติกลั่นกรองในคณะอนุกลั่นกรองฯ' },
  { k:'screen.minutes',cat:'การประชุม', label:'บันทึกมติคณะอนุกลั่นกรองฯ' },
  { k:'support.opinion',cat:'การประชุม',label:'เสนอความเห็นคณะอนุสนับสนุนฯ' },
  { k:'support.certify',cat:'การประชุม',label:'รับรองมติคณะอนุสนับสนุนฯ' },
  { k:'support.minutes',cat:'การประชุม',label:'บันทึกมติคณะอนุสนับสนุนฯ' },
  { k:'request.moreinfo',cat:'การประชุม',label:'ขอเอกสาร/ข้อมูลเพิ่มเติมจากเจ้าของสำนวน' },
  { k:'ack.resolution',cat:'ปลายน้ำ',   label:'บันทึกรับมติในระบบ' },
  { k:'urgent.request',cat:'ปลายน้ำ',   label:'ยื่นใบด่วนขอบรรจุวาระ' },
  { k:'urgent.endorse',cat:'ปลายน้ำ',   label:'เห็นชอบใบด่วนเบื้องต้นก่อนส่ง ผอ.กบค.' },
  { k:'dispatch.resolution',cat:'ปลายน้ำ',label:'ส่งมติคืนกอง / สนง. ป.ป.ท. เขต' },
  { k:'dispatch.nacc', cat:'ปลายน้ำ',   label:'ทำหนังสือนำส่งสำนวนถึง ป.ป.ช.' },
  { k:'track.discipline',cat:'ปลายน้ำ', label:'ติดตามผลการดำเนินการทางวินัย (เชื่อม กจ.8)' },
  { k:'intake.screen', cat:'ปลายน้ำ',   label:'ลงรับและคัดกรองสำนวนอิเล็กทรอนิกส์' },
  { k:'intake.route',  cat:'ปลายน้ำ',   label:'รับเรื่องจากสารบรรณและส่งเข้าอนุกลั่นกรองฯ' },
  { k:'route.subcommittee',cat:'ปลายน้ำ',label:'ส่งเรื่องเข้าอนุกลั่นกรองฯ ตามคำสั่งประธานฯ' },
  { k:'memo.submit',   cat:'ปลายน้ำ',   label:'จัดทำบันทึกเสนอนำเรียนประธานฯ' },
  { k:'legal.opinion', cat:'ปลายน้ำ',   label:'จัดทำบันทึกความเห็นทางกฎหมาย' },
  { k:'docnumber.issue',cat:'ปลายน้ำ',  label:'ออกเลขหนังสือ / เลขคำสั่ง', note:'นอกขอบเขต E-CMIS' },
  { k:'admin.sla',     cat:'ผู้ดูแลระบบ',label:'ตั้งค่าจำนวนวันแจ้งเตือน SLA' },
  { k:'admin.users',   cat:'ผู้ดูแลระบบ',label:'บริหารผู้ใช้ ประเภทตำแหน่ง และสิทธิ์' },
  { k:'admin.reassign',cat:'ผู้ดูแลระบบ',label:'Re-assign ผู้พิจารณากรณีลา / ตำแหน่งว่าง' },
  { k:'audit.view',    cat:'ผู้ดูแลระบบ',label:'ดู Audit Log' }
];

/* ---- ตรวจสิทธิ์ ---- */
function can(permKey, roleId){
  const r = getRole(roleId || currentRoleId());
  return !!(r.perms && r.perms.includes(permKey));
}
/* ผู้มีสิทธิ์แก้ไขมติ/คำสั่ง/รายงาน — ชีตระบุ 7 คน */
function canEditMaster(roleId){ return can('EDIT.MASTER', roleId); }
/* ขอบเขตการมองเห็นสำนวน */
function canViewCase(kase, roleId){
  const r = getRole(roleId || currentRoleId());
  if(can('view.all', r.id)) return true;
  if(can('view.assigned', r.id)) return !!kase.subCommittee || kase.complex;
  if(can('view.own', r.id)) return kase.owner === r.name || kase.ownerOrg === r.org;
  return false;
}

/* ------------------------------------------------- STATE MACHINE (7.1)
   สถานะที่มี scope:'UPSTREAM' = สำนวนยังไม่เข้ากิจกรรมที่ 7
   ระบบยังแสดงให้ติดตามได้ แต่ไม่มี Action ใดในโมดูลนี้                    */
const STATUS = {
  /* ---- นอกขอบเขต กจ.7 : การเสนอตามลำดับชั้นภายในกอง/เขต (กจ.5) ---- */
  DRAFT:            { label:'ร่างรายงาน 213 (ในกอง/เขต)',   cls:'st-draft',    owner:'owner',        scope:'UPSTREAM' },
  RETURNED:         { label:'ส่งคืน กจ.5 — รอแก้ไข',        cls:'st-returned', owner:'owner',        scope:'UPSTREAM' },
  PENDING_SECTION:  { label:'รอหัวหน้ากลุ่มงาน (ในกอง/เขต)', cls:'st-pending',  owner:'section_head', scope:'UPSTREAM' },
  PENDING_DIRECTOR: { label:'รอ ผอ.กอง / ผอ.เขต',           cls:'st-pending',  owner:'director',     scope:'UPSTREAM' },
  PENDING_DEPUTY:   { label:'รอผู้ช่วย / รองเลขาธิการฯ',     cls:'st-pending',  owner:'deputy',       scope:'UPSTREAM' },

  /* ---- จุดเริ่มกิจกรรมที่ 7 ---- */
  PENDING_SECGEN:   { label:'รอเลขาธิการฯ ลงนาม',         cls:'st-pending',  owner:'secgen' },
  IN_SUPPORT_SUB:   { label:'อยู่คณะอนุสนับสนุนฯ',         cls:'st-review',   owner:'support_sub' },
  PENDING_URGENT:   { label:'รอ ผอ.กบค. รับรองใบด่วน',     cls:'st-urgent',   owner:'dir_case' },
  PENDING_CHAIR_OF: { label:'รอหน้าห้องประธานฯ คัดกรอง',   cls:'st-pending',  owner:'chair_office' },
  PENDING_CHAIRMAN: { label:'รอประธานฯ สั่งการ',           cls:'st-pending',  owner:'chairman' },
  IN_SCREENING:     { label:'อยู่อนุกลั่นกรองฯ',           cls:'st-review',   owner:'subcommittee' },
  AGENDA_SET:       { label:'บรรจุวาระแล้ว',              cls:'st-agenda',   owner:'board_sec' },
  /* ---- ช่วงพิจารณามติ: เดิมกระโดดจาก AGENDA_SET ไป RESOLVED ตรง ๆ ทำให้
     ไม่มีสถานะรองรับ "อยู่ในห้องประชุม" และ "มีมติแล้วแต่ยังไม่ล็อก PDF"
     ซึ่งเป็นสองจุดที่ EX-03 (เลื่อน/ถอนวาระ) และ EX-04 (องค์ประชุม) แตกออก */
  IN_MEETING:       { label:'อยู่ระหว่างประชุมบอร์ด',      cls:'st-review',   owner:'board_sec' },
  DEFERRED:         { label:'เลื่อน/ถอนวาระ — รอเลขวาระใหม่', cls:'st-returned', owner:'affairs' },
  RESOLVED_PENDING: { label:'มีมติแล้ว รอล็อก PDF/ลงนาม',  cls:'st-pending',  owner:'board_sec' },
  RESOLVED:         { label:'มีมติแล้ว',                  cls:'st-done',     owner:'board_sec' },
  DISPATCHING:      { label:'ส่งมติออกแล้ว รอไฟล์ลงนามกลับ', cls:'st-pending',  owner:'owner' },
  CLOSED:           { label:'ปิดสำนวน',                   cls:'st-closed',   owner:null }
};

/* =========================================================================
   STATE MACHINE — ตารางทรานซิชันของกระบวนงานมติไต่สวนเบื้องต้น
   เดิมการเปลี่ยนสถานะถูกเขียนฝังอยู่ใน handler ของแต่ละหน้าจอ จึงไม่มี
   ที่เดียวที่บอกได้ว่า "จาก A ไป B ได้หรือไม่" และทดสอบ Invalid Transition
   ไม่ได้เลย ตารางนี้ทำให้กติกาทั้งหมดอยู่ในที่เดียวและตรวจสอบได้
   guard = เงื่อนไขที่ต้องเป็นจริง (ประเมินจากตัวสำนวน)
   ========================================================================= */
const TRANSITIONS = [
  /* ── S1 · G1 · G3 — ชั้นเลขาธิการฯ ─────────────────────────────────── */
  { from:'PENDING_SECGEN', to:'IN_SUPPORT_SUB', event:'SIGN_COMPLEX', actor:'secgen',
    ref:'S1→G1→T6', guard:k => g1Triggers(k).required,
    note:'G1 = ใช่ (ซับซ้อน หรือความเห็นในสายบังคับบัญชาไม่ตรงกัน)' },
  { from:'PENDING_SECGEN', to:'PENDING_URGENT', event:'SIGN_URGENT', actor:'secgen',
    ref:'S1→G1→G3→T7', guard:k => !g1Triggers(k).required && !!k.urgent,
    note:'G1 = ไม่ใช่ และ G3 = มีใบด่วน' },
  { from:'PENDING_SECGEN', to:'PENDING_CHAIR_OF', event:'SIGN_NORMAL', actor:'secgen',
    ref:'S1→G1→G3→T8', guard:k => !g1Triggers(k).required && !k.urgent,
    note:'G1 = ไม่ใช่ และ G3 = ไม่มีใบด่วน' },
  { from:'PENDING_SECGEN', to:'RETURNED', event:'RETURN_TO_SOURCE', actor:'secgen',
    ref:'EX-01', note:'ส่งคืนออกนอกกิจกรรมที่ 7 กลับสายงานต้นทาง (กจ.5)' },

  /* ── G2 — คณะอนุสนับสนุนฯ ──────────────────────────────────────────── */
  { from:'IN_SUPPORT_SUB', to:'PENDING_CHAIR_OF', event:'SUPPORT_ALIGNED', actor:'support_sub',
    ref:'T6→G2→T8', note:'ความเห็นสอดคล้อง → Bypass ข้ามอนุกลั่นกรองฯ 1-8' },
  { from:'IN_SUPPORT_SUB', to:'PENDING_URGENT', event:'SUPPORT_DIVERGED_URGENT', actor:'support_sub',
    ref:'T6→G2→G3→T7', guard:k => !!k.urgent,
    note:'ไม่สอดคล้อง → กลับเข้าเส้นทางปกติที่ G3 และมีใบด่วน' },
  { from:'IN_SUPPORT_SUB', to:'PENDING_CHAIR_OF', event:'SUPPORT_DIVERGED', actor:'support_sub',
    ref:'T6→G2→G3→T8', guard:k => !k.urgent, note:'ไม่สอดคล้อง และไม่มีใบด่วน' },

  /* ── T7 — ผอ.กบค. รับรองใบด่วน (จุดควบคุม Bypass) ──────────────────── */
  { from:'PENDING_URGENT', to:'PENDING_CHAIR_OF', event:'URGENT_CERTIFY', actor:'dir_case',
    ref:'T7→T8', note:'ผอ.กบค. ลงนามรับรองเหตุผลเร่งด่วน' },
  { from:'PENDING_URGENT', to:'IN_SCREENING', event:'URGENT_REJECT', actor:'dir_case',
    ref:'EX-09 A', note:'ไม่รับรองใบด่วน → ตัดสิทธิ์ Bypass บังคับกลับเส้นทางปกติที่ T9' },

  /* ── T8 · G4 — หน้าห้องประธานฯ และคำสั่งประธานฯ ────────────────────── */
  { from:'PENDING_CHAIR_OF', to:'PENDING_CHAIRMAN', event:'INTAKE_SCREEN', actor:'chair_office',
    ref:'T8→G4' },
  { from:'PENDING_CHAIRMAN', to:'IN_SCREENING', event:'ORDER_SCREENING', actor:'chairman',
    ref:'G4→T9', note:'สั่งส่งกลั่นกรองตามปกติ' },
  { from:'PENDING_CHAIRMAN', to:'AGENDA_SET', event:'ORDER_AGENDA_URGENT', actor:'chairman',
    ref:'G4→T11', guard:k => !!k.urgentCertified,
    note:'สั่งบรรจุวาระด่วน — ต้องมีลายเซ็นรับรองของ ผอ.กบค. ก่อนเท่านั้น' },

  /* ── T10 · T11 · T12 — อนุกลั่นกรองฯ → บรรจุวาระ ───────────────────── */
  { from:'IN_SCREENING', to:'AGENDA_SET', event:'SCREENING_RESOLVED', actor:'subcommittee',
    ref:'T10→T11→T12' },

  /* ── T13 · T14 · G5 — ประชุมและบันทึกมติ ───────────────────────────── */
  { from:'AGENDA_SET', to:'IN_MEETING', event:'OPEN_AGENDA', actor:'board_sec',
    ref:'T13' },
  { from:'IN_MEETING', to:'RESOLVED_PENDING', event:'RECORD_RESOLUTION', actor:'board_sec',
    ref:'T14→G5', guard:k => !!k.quorumOk,
    note:'EX-04 — องค์ประชุมไม่ครบ ระบบต้องบล็อกการบันทึกมติ' },
  { from:'IN_MEETING', to:'DEFERRED', event:'DEFER_AGENDA', actor:'board_sec',
    ref:'EX-03 X3.2', note:'เลื่อน/ถอนวาระ — ต้องปิดเลขวาระเดิม' },
  { from:'DEFERRED', to:'AGENDA_SET', event:'REAGENDA', actor:'affairs',
    ref:'EX-03→T12', guard:k => !!k.newAgendaNo,
    note:'กลับเข้าประชุมต้องได้เลขวาระใหม่เสมอ' },

  /* ── หลังมติ — ล็อกไฟล์และส่งต่อ ───────────────────────────────────── */
  { from:'RESOLVED_PENDING', to:'RESOLVED', event:'LOCK_PDF', actor:'board_sec',
    ref:'T14', guard:k => can('EDIT.MASTER', k.actorRoleId) || !k.actorRoleId,
    note:'ล็อกไฟล์ PDF — แก้ไขได้เฉพาะ 7 คนที่มีสิทธิ์ EDIT.MASTER' },
  { from:'RESOLVED', to:'DISPATCHING', event:'DISPATCH_EXTERNAL', actor:'owner',
    ref:'G5 มติ 3', guard:k => k.resolution === 'FORWARD' && !!k.forwardTo &&
                               (forwardTarget(k.forwardTo) || {}).external === true,
    note:'ปลายทางนอกองค์กรเท่านั้นที่ต้องรอไฟล์สแกนฉบับลงนามกลับ' },
  /* [F-02] ปิดสำนวนที่ส่งออกนอกองค์กรต้องผ่าน 2 เงื่อนไข ไม่ใช่เงื่อนไขเดียว
     1) TOR 7.2.1.5 — อัปโหลดไฟล์สแกนฉบับลงนามกลับเข้าระบบ
     2) ม.18/1 — "คัดสำเนาสำนวนดังกล่าวเก็บรักษาไว้เป็นหลักฐานด้วย"
        บังคับเฉพาะปลายทางที่ตั้ง requireArchiveCopy ไว้ (ปัจจุบันคือ ป.ป.ช.)
        ถ้าปิดสำนวนได้โดยไม่มีสำเนาเก็บไว้ สำนักงานจะไม่มีหลักฐานตามที่กฎหมายบังคับ */
  { from:'DISPATCHING', to:'CLOSED', event:'UPLOAD_SIGNED_SCAN', actor:'owner',
    ref:'TOR 7.2.1.5 · ม.18/1',
    guard:k => !!k.signedScanUploaded &&
               (!(forwardTarget(k.forwardTo) || {}).requireArchiveCopy || !!k.archiveCopyKept),
    note:'ต้องอัปโหลดไฟล์สแกนฉบับลงนาม และ (ถ้าปลายทางบังคับ) ต้องคัดสำเนาสำนวนเก็บไว้เป็นหลักฐานตาม ม.18/1' },
  { from:'RESOLVED', to:'CLOSED', event:'CLOSE_CASE', actor:'owner',
    ref:'G5 มติ 1/2', note:'รับไว้ไต่สวน (ยิงกลับ กจ.5) หรือไม่รับไว้ไต่สวน (ปิดสำนวน)' },
  { from:'RESOLVED', to:'AGENDA_SET', event:'REVISE_RESOLUTION', actor:'affairs',
    ref:'EX-03 X3.3', guard:k => !!k.newAgendaNo,
    note:'ขอแก้ไข/ทบทวนมติ — มติเดิมไม่ถูกลบ ผูกคู่กับมติใหม่' }
];

/* ทรานซิชันที่ตรงกับ from→to (อาจมีหลายรายการต่างกันที่ guard) */
function transitionsBetween(from, to){
  return TRANSITIONS.filter(t => t.from === from && t.to === to);
}

/* ตรวจว่าเปลี่ยนสถานะได้หรือไม่ — คืนเหตุผลเสมอเพื่อให้เทสต์อ่านได้
   kase อาจแนบ actorRoleId เพื่อให้ guard ตรวจสิทธิ์ได้ด้วย                */
function canTransition(from, to, kase){
  if(!STATUS[from]) return { ok:false, reason:'UNKNOWN_FROM_STATE' };
  if(!STATUS[to])   return { ok:false, reason:'UNKNOWN_TO_STATE' };
  const cands = transitionsBetween(from, to);
  if(!cands.length) return { ok:false, reason:'NO_SUCH_TRANSITION' };

  const k = kase || {};
  if(k.actorRoleId){
    const byActor = cands.filter(t => t.actor === k.actorRoleId);
    if(!byActor.length) return { ok:false, reason:'WRONG_ACTOR', expected:cands.map(t => t.actor) };
  }
  const pool = k.actorRoleId ? cands.filter(t => t.actor === k.actorRoleId) : cands;
  const passed = pool.find(t => !t.guard || t.guard(k) === true);
  return passed
    ? { ok:true, transition:passed, event:passed.event, ref:passed.ref }
    : { ok:false, reason:'GUARD_FAILED', guards:pool.map(t => t.note || t.ref) };
}

/* สถานะถัดไปที่เป็นไปได้จากสถานะปัจจุบัน */
function nextStates(from, kase){
  return TRANSITIONS.filter(t => t.from === from)
    .filter(t => !t.guard || !kase || t.guard(kase) === true)
    .map(t => ({ to:t.to, event:t.event, actor:t.actor, ref:t.ref }));
}

/* สายการเสนอตามลำดับชั้น "ภายในกอง/เขต" — นอกขอบเขต กจ.7 แสดงเป็นประวัติอ่านอย่างเดียว */
const UPSTREAM_CHAIN = ['owner','section_head','director','deputy'];

/* ในขอบเขต กจ.7 เลขาธิการฯ เป็นชั้นอนุมัติเดียว ไม่มีสายลำดับชั้นต่อจากนี้ */
const APPROVAL_CHAIN = ['secgen'];

/* Stepper ของกิจกรรมที่ 7.1 — เริ่มที่เลขาธิการฯ */
const FLOW_STEPS = [
  { key:'secgen',    label:'เลขาธิการฯ พิจารณา / ลงนาม', ref:'S1 · G1' },
  { key:'urgent',    label:'ใบด่วน / ผอ.กบค.',           ref:'G3 · S3' },
  { key:'chairman',  label:'ประธานฯ สั่งการ',            ref:'S4 · G4' },
  { key:'screening', label:'อนุกลั่นกรองฯ 1–8',          ref:'S5 · S6' },
  { key:'agenda',    label:'บรรจุวาระ',                 ref:'S7 · S8' },
  { key:'resolution',label:'บอร์ดลงมติ',                ref:'S9 · G5' },
  { key:'order',     label:'ออกคำสั่ง ม.24',             ref:'S11' }
];

const STATUS_STEP = {
  /* สถานะต้นทางยังไม่เข้า stepper ของ กจ.7 — ชี้ไปขั้นแรกเพื่อแสดงว่ากำลังจะเข้า */
  DRAFT:'secgen', RETURNED:'secgen',
  PENDING_SECTION:'secgen', PENDING_DIRECTOR:'secgen', PENDING_DEPUTY:'secgen',
  PENDING_SECGEN:'secgen', IN_SUPPORT_SUB:'secgen',
  PENDING_URGENT:'urgent',
  PENDING_CHAIR_OF:'chairman', PENDING_CHAIRMAN:'chairman',
  IN_SCREENING:'screening',
  AGENDA_SET:'agenda',
  RESOLVED:'resolution', CLOSED:'order'
};

/* ---- ตัวช่วยเรื่องขอบเขต ---- */
function isUpstreamRole(roleId){ const r = getRole(roleId); return r.scope === 'UPSTREAM'; }
function isUpstreamCase(kase){ const s = STATUS[kase.status]; return !!(s && s.scope === 'UPSTREAM'); }

/* ------------------------------------------------- G1 — เงื่อนไขที่ 2
   ผัง P2 โหนด g1 อ่านว่า "เป็นเรื่องยุ่งยากซับซ้อน **หรือความเห็นใน
   สายบังคับบัญชาไม่ตรงกัน**" — เงื่อนไขหลังเป็นข้อเท็จจริงที่ระบบรู้เองได้
   จากความเห็นที่แต่ละชั้นบันทึกไว้ตอนเสนอขึ้นมา จึงคำนวณให้อัตโนมัติ
   แทนที่จะให้เลขาธิการฯ ตอบเอง                                          */
const OPINION_TYPES = {
  ACCEPT:  { code:'ACCEPT',  label:'เห็นควรรับไว้ไต่สวน' },
  REJECT:  { code:'REJECT',  label:'เห็นควรไม่รับไว้ไต่สวน / ยุติเรื่อง' },
  MORE:    { code:'MORE',    label:'เห็นควรแสวงหาข้อเท็จจริงเพิ่มเติม' },
  FORWARD: { code:'FORWARD', label:'เห็นควรส่งเรื่องให้ ป.ป.ช.' }
};

/* คืนผลวิเคราะห์ความเห็นตามลำดับชั้นของสำนวน (ต้นทาง กจ.5 → เลขาธิการฯ) */
function chainDivergence(kase){
  const ops = kase.chainOpinions || [];
  const kinds = [...new Set(ops.map(o => o.type))];
  const diverged = kinds.length > 1;
  let split = null;
  if(diverged){
    /* ชั้นแรกที่ความเห็นเริ่มต่างจากชั้นก่อนหน้า — ใช้ชี้จุดที่ต้องอ่านซ้ำ */
    for(let i = 1; i < ops.length; i++){
      if(ops[i].type !== ops[i-1].type){ split = { from: ops[i-1], to: ops[i] }; break; }
    }
  }
  return { opinions: ops, diverged, kinds, split };
}

/* G1 ต้องเข้าคณะอนุสนับสนุนฯ หรือไม่ — รวมทั้ง 2 เงื่อนไขตามผัง */
function g1Triggers(kase){
  const d = chainDivergence(kase);
  return {
    complex:   !!kase.complex,          /* เงื่อนไข 1 — ดุลพินิจเลขาธิการฯ */
    diverged:  d.diverged,              /* เงื่อนไข 2 — ระบบตรวจให้ */
    divergence: d,
    required:  !!kase.complex || d.diverged
  };
}

/* ------------------------------------------------- องค์ประชุมและการลงมติ
   ม.10 คณะกรรมการทำหน้าที่ต่อไปได้ด้วยกรรมการเท่าที่เหลืออยู่ แต่ต้องไม่
        น้อยกว่า 5 คน — เป็นเงื่อนไข "ก่อน" นับองค์ประชุม
   ม.12 องค์ประชุม = ไม่น้อยกว่ากึ่งหนึ่งของกรรมการทั้งหมดเท่าที่มีอยู่
   ม.15 มติ = เสียงข้างมากของกรรมการทั้งหมดเท่าที่มีอยู่ (ไม่ใช่ของผู้เข้าประชุม)
        คะแนนเท่ากัน ประธานในที่ประชุมออกเสียงชี้ขาดเพิ่มอีกหนึ่งเสียง
   ม.20 ผู้มีส่วนได้เสียถูก "กันออกโดยมติบอร์ด" — ยังนับเป็นกรรมการที่มีอยู่
        แต่ถูกกันสิทธิ์ลงมติในวาระนั้น                                     */
const BOARD_MIN_IN_OFFICE = 5;

function boardQuorum({ inOffice, present, forV = 0, againstV = 0, abstainV = 0, chairBreaksTie = false }){
  const boardValid  = inOffice >= BOARD_MIN_IN_OFFICE;          /* ม.10 */
  const quorumMin   = Math.ceil(inOffice / 2);                  /* ม.12 */
  const quorumOk    = boardValid && present >= quorumMin;
  const majorityMin = Math.floor(inOffice / 2) + 1;             /* ม.15 */
  const tie         = forV === againstV && forV > 0;
  const effectiveFor= tie && chairBreaksTie ? forV + 1 : forV;
  const majorityOk  = effectiveFor >= majorityMin;
  return {
    boardValid, quorumMin, quorumOk, majorityMin, majorityOk, tie,
    effectiveFor, forV, againstV, abstainV, present, inOffice,
    /* บันทึกมติได้ก็ต่อเมื่อผ่านทั้ง ม.10 ม.12 และ ม.15 */
    canRecord: boardValid && quorumOk && majorityOk,
    blockedBy: !boardValid ? 'M10_BOARD_INCOMPLETE'
             : !quorumOk   ? 'M12_NO_QUORUM'
             : !majorityOk ? 'M15_NO_MAJORITY' : null
  };
}

/* ------------------------------------------- องค์ประกอบองค์คณะ ม.24 ว.1
   [F-03] ตัวบท ม.24 วรรคหนึ่ง แห่ง พ.ร.บ. มาตรการของฝ่ายบริหารฯ พ.ศ. 2551
   (แก้ไขถึงฉบับที่ 4 พ.ศ. 2568) วางเงื่อนไของค์ประกอบไว้ 3 ชั้นซ้อนกัน คือ
     1) "องค์คณะละไม่น้อยกว่าสองคนตามที่เลขาธิการแต่งตั้ง"
     2) "ประกอบด้วยพนักงาน ป.ป.ท. อย่างน้อยหนึ่งคน"
     3) "จะแต่งตั้งเจ้าหน้าที่ ป.ป.ท. ไม่เกินสองคนร่วมเป็นองค์คณะด้วยก็ได้
         ในกรณีจำเป็นจะแต่งตั้งเจ้าหน้าที่ ป.ป.ท. เกินสองคนก็ได้ แต่ต้องมี
         พนักงาน ป.ป.ท. ไม่น้อยกว่ากึ่งหนึ่งของจำนวนเจ้าหน้าที่ ป.ป.ท."
   เดิมระบบตรวจแค่จำนวนรวม ≥ 2 ซึ่งปล่อยให้ตั้งองค์คณะที่ไม่มีพนักงาน ป.ป.ท.
   เลย หรือมีเจ้าหน้าที่ ป.ป.ท. ล้นสัดส่วนได้ คำสั่งที่ออกมาจะไม่ชอบด้วยกฎหมาย
   ตั้งแต่ต้น จึงย้ายกติกามาไว้ที่โมเดลกลางให้ตรวจได้ครบทั้ง 3 ข้อและทดสอบได้

   หมายเหตุขอบเขต: ม.24 **วรรคสาม** (คณะอนุกรรมการไต่สวน) เป็นคนละฐานอำนาจ
   และไม่มีถ้อยคำเรื่องสัดส่วนนี้ จึงต้องไม่นำกฎนี้ไปบังคับกับเส้นทาง
   ACCEPT_S24P3                                                            */
const M24P1_MIN_PANEL = 2;   /* "ไม่น้อยกว่าสองคน" */
const M24P1_STAFF_FREE = 2;  /* "เจ้าหน้าที่ ป.ป.ท. ไม่เกินสองคน" = เกณฑ์ปกติ */

function panelComposition({ officers = 0, staff = 0 } = {}){
  const total = officers + staff;
  /* ข้อ 1 — ขนาดองค์คณะ */
  const minSize    = total >= M24P1_MIN_PANEL;
  /* ข้อ 2 — ต้องมีพนักงาน ป.ป.ท. อย่างน้อยหนึ่งคน */
  const hasOfficer = officers >= 1;
  /* ข้อ 3 — เจ้าหน้าที่ ป.ป.ท. ไม่เกิน 2 คน = ผ่านโดยอัตโนมัติ
     ถ้าเกิน 2 (กรณีจำเป็น) ต้องมีพนักงาน ป.ป.ท. ≥ กึ่งหนึ่งของเจ้าหน้าที่ ป.ป.ท. */
  const officerMin = staff <= M24P1_STAFF_FREE ? 0 : Math.ceil(staff / 2);
  const ratioOk    = staff <= M24P1_STAFF_FREE || officers >= officerMin;
  return {
    officers, staff, total, minSize, hasOfficer, ratioOk, officerMin,
    exceptional: staff > M24P1_STAFF_FREE,   /* ใช้ "กรณีจำเป็น" ของวรรคหนึ่งอยู่ */
    /* ข้อ 4 — สรุปผลรวม พร้อมชี้ว่าตกข้อไหนเพื่อให้หน้าจอและเทสอ่านได้ */
    valid: minSize && hasOfficer && ratioOk,
    blockedBy: !minSize    ? 'M24P1_MIN_PANEL'
             : !hasOfficer ? 'M24P1_NO_OFFICER'
             : !ratioOk    ? 'M24P1_OFFICER_RATIO' : null
  };
}

/* ------------------------------------------------------------ ม.28
   เลขาธิการฯ สั่งรับ/ไม่รับเบื้องต้น แล้วต้องรายงานคณะกรรมการ ป.ป.ท.
   ทุก 15 วัน — หากบอร์ดไม่มีมติเป็นอย่างอื่นภายใน 15 วัน ให้ถือว่า
   บอร์ดมีมติตามคำสั่งของเลขาธิการฯ                                      */
const M28 = { cycleDays: 15, boardSilenceDays: 15 };

/* ม.28 ให้เลขาธิการฯ สั่งได้ 3 ทาง — ตัวบทเขียนว่า "รับหรือไม่รับเรื่องไว้
   พิจารณา หรือสั่งจำหน่ายเรื่องเป็นเบื้องต้น" เดิมโมเดลฝั่งเลขาธิการฯ มีเพียง
   2 ทาง ทั้งที่ฝั่งมติบอร์ดแยกครบแล้ว (NOT_ACCEPTED / DISMISS / NO_GROUND)  */
const M28_ORDERS = [
  { code:'ACCEPT',  label:'สั่งรับเรื่องไว้พิจารณา',      lawRef:'ม.28' },
  { code:'REJECT',  label:'สั่งไม่รับเรื่องไว้พิจารณา',   lawRef:'ม.28 ประกอบ ม.25 / ม.26' },
  { code:'DISMISS', label:'สั่งจำหน่ายเรื่อง',            lawRef:'ม.28 ประกอบ ม.26' }
];
function m28Order(code){ return M28_ORDERS.find(o => o.code === code) || null; }

/* สำนวนที่เลขาธิการฯ สั่งการแล้วและต้องเข้ารายงานรอบ ม.28 ถัดไป */
function m28Pending(){
  return CASES.filter(c => c.m28 && c.m28.reported === false);
}

/* --------------------------------------------------- MOCK CASE DATASET */
const CASES = [
  {
    id:'681547',
    subject:'กล่าวหาเจ้าหน้าที่องค์การบริหารส่วนตำบลแห่งหนึ่ง จัดซื้อจัดจ้างโครงการก่อสร้างถนน คสล. โดยมิชอบ',
    legalBase:'ม.18/4', /* ม.18/4 พรบ.มาตรการฯ | ม.62 พรป.ปปช. */
    status:'PENDING_SECGEN',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'นายวิรัตน์ ศรีสุข (ผู้ร้อง)',
    accused:[
      { no:1, name:'นายก้องภพ ทองแท้',   pos:'นายกองค์การบริหารส่วนตำบล',   idcard:'3-1009-0xxxx-xx-x', agency:'อบต.บางแสน' },
      { no:2, name:'นางมาลี เรืองรอง',    pos:'ปลัดองค์การบริหารส่วนตำบล',   idcard:'3-1012-0xxxx-xx-x', agency:'อบต.บางแสน' },
      { no:3, name:'นายชาญชัย ก่อสร้าง',  pos:'ผู้อำนวยการกองช่าง',          idcard:'3-2001-0xxxx-xx-x', agency:'อบต.บางแสน' }
    ],
    allegation:'ร่วมกันกำหนดคุณลักษณะเฉพาะของงานก่อสร้างเพื่อเอื้อประโยชน์ให้ผู้เสนอราคารายหนึ่งเป็นผู้ชนะการเสนอราคา และตรวจรับงานทั้งที่งานไม่แล้วเสร็จตามสัญญา',
    receivedDate:'2568-11-14', deadline60:'2569-01-13', deadline2y:'2570-11-14', prescription:'2571-03-20',
    docRef:'ปป 0020/1028 ลงวันที่ 7 พฤษภาคม 2569',
    urgent:false, complex:false, dupWarning:true,
    docType:'213', signPhase:'WAIT',
    slaDays:3, slaLimit:5, subCommittee:null,
    meetingNo:null, agendaNo:null,
    /* ความเห็นตามลำดับชั้น — ชั้น ผอ.เขต เห็นต่างจากนักสืบและหัวหน้ากลุ่มงาน
       ระบบจึงตรวจพบ G1 เงื่อนไขที่ 2 ให้เองโดยเลขาธิการฯ ไม่ต้องกาเอง     */
    chainOpinions:[
      { roleId:'owner',        type:'ACCEPT', date:'2568-11-28',
        note:'พยานหลักฐานเพียงพอที่จะสนับสนุนข้อกล่าวหาว่ามีมูลความผิด เห็นควรรับไว้ไต่สวน' },
      { roleId:'section_head', type:'ACCEPT', date:'2568-12-02',
        note:'เห็นพ้องกับผู้รับผิดชอบสำนวน' },
      { roleId:'director',     type:'MORE',   date:'2568-12-09',
        note:'ราคากลางที่ใช้เปรียบเทียบยังไม่ได้มาจากหน่วยงานกลาง เห็นควรแสวงหาข้อเท็จจริงเพิ่มเติมก่อน' },
      { roleId:'deputy',       type:'ACCEPT', date:'2568-12-16',
        note:'ข้อบกพร่องที่ ผอ.เขต ตั้งข้อสังเกตสามารถแก้ในชั้นไต่สวนได้ เห็นควรรับไว้ไต่สวน' }
    ]
  },
  {
    id:'681602',
    subject:'กล่าวหาข้าราชการสังกัดกรมหนึ่ง เรียกรับเงินจากผู้ประกอบการเพื่อแลกกับการออกใบอนุญาต',
    legalBase:'ม.62',
    status:'PENDING_URGENT',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'สำนักงาน ป.ป.ช. (ส่งเรื่องมอบหมาย)',
    accused:[ { no:1, name:'นายเอกชัย รุ่งเรือง', pos:'นายช่างโยธาชำนาญงาน', idcard:'3-1005-0xxxx-xx-x', agency:'กรมโยธาธิการฯ' } ],
    allegation:'เรียกรับเงินจำนวน 50,000 บาท จากผู้ประกอบการเพื่อแลกกับการเร่งรัดออกใบอนุญาตก่อสร้าง',
    receivedDate:'2568-12-02', deadline60:'2569-01-31', deadline2y:'2570-12-02', prescription:'2569-09-18',
    docRef:'ปป 0020/1104 ลงวันที่ 20 พฤษภาคม 2569',
    urgent:true, urgentReason:'คดีใกล้ขาดอายุความภายใน 45 วัน และผู้ถูกร้องมีพฤติการณ์จะโอนย้ายหน่วยงาน',
    complex:false, dupWarning:false,
    slaDays:6, slaLimit:5, subCommittee:null,
    meetingNo:null, agendaNo:null
  },
  {
    id:'681588',
    subject:'กล่าวหาเจ้าหน้าที่โรงพยาบาลรัฐแห่งหนึ่ง เบิกจ่ายค่าตอบแทนล่วงเวลาอันเป็นเท็จ',
    legalBase:'ม.18/4',
    status:'IN_SCREENING',
    owner:'นางสาวปรียา ตั้งมั่น', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 2',
    complainant:'บัตรสนเท่ห์ (ความปรากฏต่อสำนักงาน)',
    accused:[
      { no:1, name:'นายสุรชัย พัฒนา', pos:'นักจัดการงานทั่วไปชำนาญการ', idcard:'3-3007-0xxxx-xx-x', agency:'รพ.ศูนย์แห่งหนึ่ง' },
      { no:2, name:'นางวราภรณ์ สุขใจ', pos:'เจ้าพนักงานการเงินและบัญชี',  idcard:'3-3009-0xxxx-xx-x', agency:'รพ.ศูนย์แห่งหนึ่ง' }
    ],
    allegation:'ร่วมกันจัดทำเอกสารเบิกจ่ายค่าตอบแทนการปฏิบัติงานนอกเวลาราชการอันเป็นเท็จ รวม 47 ครั้ง เป็นเงิน 382,400 บาท',
    receivedDate:'2568-11-25', deadline60:'2569-01-24', deadline2y:'2570-11-25', prescription:'2572-01-10',
    docRef:'ปป 0021/0987 ลงวันที่ 2 พฤษภาคม 2569',
    urgent:false, complex:true, dupWarning:false,
    slaDays:9, slaLimit:15, subCommittee:'คณะที่ 3',
    meetingNo:null, agendaNo:null
  },
  {
    id:'681490',
    subject:'กล่าวหาผู้บริหารสถานศึกษาแห่งหนึ่ง จัดซื้อครุภัณฑ์คอมพิวเตอร์ราคาสูงเกินจริง',
    legalBase:'ม.18/4',
    status:'AGENDA_SET',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'นายพิชิต รักชาติ (ผู้ร้อง)',
    accused:[ { no:1, name:'นายบัณฑิต ศึกษาดี', pos:'ผู้อำนวยการสถานศึกษา', idcard:'3-1102-0xxxx-xx-x', agency:'โรงเรียนแห่งหนึ่ง' } ],
    allegation:'อนุมัติจัดซื้อครุภัณฑ์คอมพิวเตอร์จำนวน 40 เครื่อง ในราคาสูงกว่าราคากลางที่กระทรวงดิจิทัลฯ กำหนด รวม 1,240,000 บาท',
    receivedDate:'2568-10-08', deadline60:'2568-12-07', deadline2y:'2570-10-08', prescription:'2570-06-30',
    docRef:'ปป 0020/0912 ลงวันที่ 24 เมษายน 2569',
    urgent:false, complex:false, dupWarning:false,
    slaDays:2, slaLimit:15, subCommittee:'คณะที่ 1',
    meetingNo:'37/2569', agendaNo:'5.9', meetingDate:'2569-05-19'
  },
  {
    id:'681455',
    subject:'กล่าวหาเจ้าหน้าที่สำนักงานที่ดินแห่งหนึ่ง ออกโฉนดที่ดินทับที่สาธารณประโยชน์',
    legalBase:'ม.62',
    status:'RESOLVED',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'องค์การบริหารส่วนตำบลแห่งหนึ่ง',
    accused:[ { no:1, name:'นายมนตรี ที่ดินงาม', pos:'เจ้าพนักงานที่ดินชำนาญการ', idcard:'3-1201-0xxxx-xx-x', agency:'สนง.ที่ดินจังหวัด' } ],
    allegation:'ดำเนินการออกโฉนดที่ดินเลขที่ 12345 เนื้อที่ 8 ไร่ ทับที่สาธารณประโยชน์ โดยมิได้ตรวจสอบระวางแผนที่',
    receivedDate:'2568-09-15', deadline60:'2568-11-14', deadline2y:'2570-09-15', prescription:'2571-08-15',
    docRef:'ปป 0020/0855 ลงวันที่ 10 เมษายน 2569',
    urgent:false, complex:false, dupWarning:false,
    slaDays:1, slaLimit:15, subCommittee:'คณะที่ 2',
    meetingNo:'36/2569', agendaNo:'5.4', meetingDate:'2569-05-05',
    resolution:'ACCEPT_S24P1'
  },
  {
    id:'681610',
    subject:'กล่าวหาพนักงานรัฐวิสาหกิจแห่งหนึ่ง ทุจริตการเบิกจ่ายค่าน้ำมันเชื้อเพลิง',
    legalBase:'ม.18/4',
    status:'DRAFT',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'ความปรากฏต่อสำนักงาน',
    accused:[ { no:1, name:'นายวีระ ขับขี่ดี', pos:'พนักงานขับรถยนต์', idcard:'3-1301-0xxxx-xx-x', agency:'รัฐวิสาหกิจแห่งหนึ่ง' } ],
    allegation:'เบิกจ่ายค่าน้ำมันเชื้อเพลิงโดยใช้ใบเสร็จรับเงินอันเป็นเท็จ',
    receivedDate:'2568-12-20', deadline60:'2569-02-18', deadline2y:'2570-12-20', prescription:'2573-02-01',
    docRef:'—',
    urgent:false, complex:false, dupWarning:false,
    slaDays:0, slaLimit:5, subCommittee:null,
    meetingNo:null, agendaNo:null
  },
  {
    id:'681523',
    subject:'กล่าวหาเจ้าหน้าที่เทศบาลแห่งหนึ่ง เรียกรับผลประโยชน์จากผู้ขออนุญาตประกอบกิจการ',
    legalBase:'ม.18/4',
    status:'RETURNED',
    owner:'นายสมชาย ใจซื่อ', ownerOrg:'สนง. ป.ป.ท. เขต 1',
    complainant:'นางสมหญิง ค้าขาย (ผู้ร้อง)',
    accused:[ { no:1, name:'นายอรรถพล เทศบาล', pos:'หัวหน้าฝ่ายพัฒนารายได้', idcard:'3-1405-0xxxx-xx-x', agency:'เทศบาลแห่งหนึ่ง' } ],
    allegation:'เรียกรับเงินจากผู้ประกอบการเพื่อแลกกับการออกใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ',
    receivedDate:'2568-11-01', deadline60:'2568-12-31', deadline2y:'2570-11-01', prescription:'2570-12-05',
    docRef:'ปป 0020/0978 ลงวันที่ 28 เมษายน 2569',
    urgent:false, complex:false, dupWarning:false,
    slaDays:4, slaLimit:5, subCommittee:null,
    meetingNo:null, agendaNo:null,
    returnedBy:'director', returnedByName:'นายประเสริฐ มั่นคง (ผอ.สนง. ป.ป.ท. เขต 1)',
    returnReason:'DOC_INCOMPLETE',
    returnNote:'เอกสารพยานหลักฐานประกอบข้อ 3 (สำเนาใบอนุญาต) ยังไม่ครบถ้วน และยังไม่ได้แนบบันทึกถ้อยคำผู้ร้อง กรุณาแนบเพิ่มเติมแล้วเสนอกลับ'
  }
];

/* เพิ่มสำนวนตัวอย่างชนิด 644 ที่ความเห็นตลอดสายตรงกัน — ใช้เทียบกับ 681547
   ให้เห็นว่า G1 ไม่ถูกจุดชนวน และเพดาน SLA เปลี่ยนตามชนิดรายงาน            */
CASES.push({
  id:'681615',
  subject:'กล่าวหาเจ้าหน้าที่สำนักงานเขตแห่งหนึ่ง ละเว้นการบังคับใช้กฎหมายควบคุมอาคาร',
  legalBase:'ม.18/4',
  status:'PENDING_SECGEN',
  owner:'นางสาวปรียา ตั้งมั่น', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 2',
  complainant:'นายธีรพงษ์ รักษ์เมือง (ผู้ร้อง)',
  accused:[ { no:1, name:'นายฉัตรชัย ตรวจการ', pos:'นายช่างโยธาอาวุโส', idcard:'3-1502-0xxxx-xx-x', agency:'สำนักงานเขตแห่งหนึ่ง' } ],
  allegation:'ละเว้นไม่ดำเนินการตามอำนาจหน้าที่กับอาคารที่ก่อสร้างผิดแบบแปลนที่ได้รับอนุญาต รวม 6 หลัง ต่อเนื่องกว่า 2 ปี',
  receivedDate:'2568-12-08', deadline60:'2569-02-06', deadline2y:'2570-12-08', prescription:'2572-05-30',
  docRef:'ปป 0021/1131 ลงวันที่ 26 พฤษภาคม 2569',
  urgent:false, complex:false, dupWarning:false,
  docType:'644', signPhase:'WAIT',
  slaDays:11, slaLimit:15, subCommittee:null,
  meetingNo:null, agendaNo:null,
  chainOpinions:[
    { roleId:'owner',        type:'ACCEPT', date:'2568-12-18', note:'พฤติการณ์ละเว้นชัดเจน มีเอกสารตรวจสอบรองรับ เห็นควรรับไว้ไต่สวน' },
    { roleId:'section_head', type:'ACCEPT', date:'2568-12-24', note:'เห็นพ้องตามที่เสนอ' },
    { roleId:'director',     type:'ACCEPT', date:'2569-01-06', note:'เห็นชอบตามลำดับชั้น' },
    { roleId:'deputy',       type:'ACCEPT', date:'2569-01-14', note:'เห็นควรเสนอเลขาธิการฯ ลงนาม' }
  ]
});

/* ค่าเริ่มต้นของฟิลด์ที่เพิ่มภายหลัง — กันหน้าจอพังกับสำนวนที่ยังไม่มีข้อมูลชุดใหม่ */
CASES.forEach(c => {
  if(!c.docType)       c.docType = '213';
  if(!c.signPhase)     c.signPhase = 'WAIT';
  if(!c.chainOpinions) c.chainOpinions = [];
});

/* ---- รอบรายงาน ม.28 ของคำสั่งที่เลขาธิการฯ สั่งไปแล้ว ----
   orderType = คำสั่งเบื้องต้นของเลขาธิการฯ | reported = เข้ารอบรายงานบอร์ดแล้วหรือยัง
   dueDate   = วันครบกำหนดรายงานรอบ 15 วัน                                 */
const M28_LOG = {
  '681602': { orderType:'ACCEPT', orderedDate:'2569-05-22', reported:false, dueDate:'2569-06-06' },
  '681588': { orderType:'ACCEPT', orderedDate:'2569-05-26', reported:false, dueDate:'2569-06-10' },
  '681490': { orderType:'ACCEPT', orderedDate:'2569-04-30', reported:true,  dueDate:'2569-05-15',
                 boardOutcome:'บอร์ดไม่มีมติเป็นอย่างอื่นภายใน 15 วัน — ถือว่ามีมติตามคำสั่งเลขาธิการฯ' },
  '681523': { orderType:'REJECT', orderedDate:'2569-05-28', reported:false, dueDate:'2569-06-12' }
};
CASES.forEach(c => { if(M28_LOG[c.id]) c.m28 = M28_LOG[c.id]; });

/* ---- LOCAL STORAGE / SESSION STORAGE STATE FOR CASES ---- */
if (typeof sessionStorage !== 'undefined') {
  const savedCases = sessionStorage.getItem('ecmis_cases');
  if (savedCases) {
    try {
      const parsed = JSON.parse(savedCases);
      CASES.length = 0;
      parsed.forEach(c => CASES.push(c));
    } catch (e) {
      console.error('Failed to load CASES from sessionStorage:', e);
    }
  }
}
function saveCases() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('ecmis_cases', JSON.stringify(CASES));
  }
}

/* Reason Code สำหรับการตีกลับ (EX-01 — TOR 7.2.1.2) */
const RETURN_REASONS = [
  { code:'DOC_INCOMPLETE', label:'เอกสาร/พยานหลักฐานไม่ครบถ้วน' },
  { code:'FACT_UNCLEAR',   label:'ข้อเท็จจริงยังไม่ชัดเจน ต้องแสวงหาเพิ่มเติม' },
  { code:'LAW_DISAGREE',   label:'ความเห็นข้อกฎหมายไม่ตรงกัน' },
  { code:'WRONG_FORM',     label:'รูปแบบรายงานไม่ถูกต้องตามแบบที่กำหนด' },
  { code:'WRONG_ROUTE',    label:'เสนอผิดสายงาน / ผิดหน่วยงานรับผิดชอบ' },
  { code:'OTHER',          label:'อื่น ๆ (ระบุเหตุผล)' }
];

/* ผลมติของ 7.1 (G5) — ตรงกับ Template มติการประชุม ไต่สวนเบื้องต้น

   [F-04 — แก้ให้ตรงตัวบท ม.25 / ม.26 / ม.28 / ม.32]
   เดิมมีมติเดียวชื่อ REJECT แล้วผูกกรอบแจ้งผล 15 วันตาม **ม.32** ไว้กับมตินั้น
   ซึ่งผิด เพราะ ม.32 เขียนไว้เฉพาะกรณี "คณะกรรมการ ป.ป.ท. มีมติว่า
   **ข้อกล่าวหาใดไม่มีมูล**" ให้ข้อกล่าวหานั้นเป็นอันตกไป และแจ้งผู้ถูกกล่าวหาทราบ
   ส่วน "ไม่รับเรื่องไว้พิจารณา" เป็นคนละสถานะทางกฎหมาย — ม.25 ห้ามรับไว้พิจารณา
   โดยเด็ดขาด และ ม.26 ให้ใช้ดุลพินิจไม่รับหรือสั่งจำหน่ายเรื่อง ทั้งสองมาตรา
   **ไม่มี**กรอบ 15 วันของ ม.32 การผูกไว้ด้วยกันทำให้ระบบสร้างหนังสือผิดฉบับและ
   นับ SLA ที่ไม่มีฐานกฎหมายรองรับ จึงต้องแยกเป็นคนละมติ
   และเพิ่ม DISMISS เพราะ ม.28 ให้เลขาธิการฯ สั่งได้ 3 ทาง คือ รับ / ไม่รับ /
   สั่งจำหน่ายเรื่อง — บอร์ดจึงต้องมีทางออกครบทั้งสามเช่นกัน                 */
const RESOLUTIONS = [
  { code:'ACCEPT_S24P1', group:'รับไว้ไต่สวน',
    label:'รับไว้ไต่สวน — ดำเนินการเป็นองค์คณะ (ม.24 วรรคหนึ่ง)',
    doc:'คำสั่งแต่งตั้งองค์คณะพนักงาน ป.ป.ท. (ปปท. ๕-๐๑)', signer:'เลขาธิการฯ' },
  { code:'ACCEPT_S24P3', group:'รับไว้ไต่สวน',
    label:'รับไว้ไต่สวน — ดำเนินการเป็นคณะอนุกรรมการไต่สวน (ม.24 วรรคสาม)',
    doc:'คำสั่งแต่งตั้งคณะอนุกรรมการไต่สวน (ปปท. ๕-๐๔)', signer:'ประธานกรรมการ ป.ป.ท.' },
  /* ม.25 (ห้ามรับไว้พิจารณาเด็ดขาด) / ม.26 (ดุลพินิจไม่รับ) — ไม่ใช่กรณี ม.32
     จึงต้องไม่มี noticeDays 15 วันติดมากับมตินี้                             */
  { code:'NOT_ACCEPTED', group:'ไม่รับเรื่องไว้พิจารณา',
    label:'ไม่รับเรื่องไว้พิจารณา (ม.25 ห้ามเด็ดขาด / ม.26 ดุลพินิจ)',
    doc:'หนังสือแจ้งผลการพิจารณา (ระบุมาตราที่อ้าง)', signer:'—',
    needsLawRef:true, legalBasis:'ม.25 / ม.26' },
  /* ม.26 ให้สั่ง "จำหน่ายเรื่อง" ได้ด้วย — ม.28 ยืนยันว่าเป็นคำสั่งคนละอย่างกับ
     การไม่รับเรื่องไว้พิจารณา                                                */
  { code:'DISMISS', group:'ไม่รับเรื่องไว้พิจารณา',
    label:'สั่งจำหน่ายเรื่อง (ม.26)',
    doc:'หนังสือแจ้งคำสั่งจำหน่ายเรื่อง', signer:'—',
    needsLawRef:true, legalBasis:'ม.26 (ประกอบ ม.28)' },
  /* ม.32 — เฉพาะกรณีบอร์ดมีมติว่า "ข้อกล่าวหาไม่มีมูล" ข้อกล่าวหาเป็นอันตกไป
     และต้องแจ้งผู้ถูกกล่าวหาไม่ช้ากว่า 15 วันนับแต่วันที่บอร์ดมีมติ           */
  { code:'NO_GROUND', group:'ข้อกล่าวหาไม่มีมูล',
    label:'ข้อกล่าวหาไม่มีมูล — ข้อกล่าวหาเป็นอันตกไป (ม.32)',
    doc:'หนังสือแจ้งผลผู้ถูกกล่าวหา (ม.32 ไม่ช้ากว่า 15 วัน)', signer:'—',
    noticeDays:15, noticeBasis:'ม.32 — แจ้งผู้ถูกกล่าวหาไม่ช้ากว่า 15 วันนับแต่วันที่บอร์ดมีมติ',
    legalBasis:'ม.32' },
  { code:'MORE_INVESTIGATE', group:'มติอื่น ๆ',
    label:'ให้ผู้รับผิดชอบสำนวนไต่สวนเบื้องต้นเพิ่มเติม',
    doc:'บันทึกแจ้งมติให้ไต่สวนเพิ่มเติม', signer:'—' },
  /* แบบฟอร์ม "มติการประชุม ไต่สวนเบื้องต้น.docx" เขียนบรรทัดนี้เป็นช่องว่าง
     "ส่งเรื่องให้ ________ / คณะอนุกลั่นกรองฯ แล้วแต่กรณี" จึงเป็นมติเดียว
     ที่มีได้หลายปลายทาง ไม่ใช่มติแยกประเภท — ผัง P2 หยิบมาแสดงเฉพาะปลายทาง
     ป.ป.ช. เพราะเป็นเส้นเดียวที่ออกนอกองค์กรและมี SLA เฉพาะ              */
  { code:'FORWARD', group:'มติอื่น ๆ',
    label:'ส่งเรื่องให้หน่วยงาน / คณะอนุกลั่นกรองฯ พิจารณา',
    doc:'หนังสือนำส่งเรื่อง', signer:'—', needsDestination:true }
];

/* ปลายทางของมติ FORWARD — เฉพาะ ป.ป.ช. เท่านั้นที่ออกนอกองค์กร จึงมีข้อบังคับ
   อัปโหลดไฟล์สแกนฉบับลงนามกลับตาม TOR 7.2.1.5

   [F-02 — แก้ให้ตรงตัวบท ม.18/1 และแยก "นาฬิกาสองเรือน" ออกจากกัน]
   เดิมตารางนี้มี slaDays ค่าเดียวคือ 30 วัน ความผิดพลาดไม่ได้อยู่ที่ตัวเลข
   เพียงอย่างเดียว แต่อยู่ที่การเอากรอบเวลาคนละชนิดมายุบรวมเป็นค่าเดียว
   ทำให้ระบบเตือนผิดเรือนและมองไม่เห็นเส้นตายที่กฎหมายบังคับ จึงแยกเป็น 2 ฟิลด์

   เรือนที่ 1 — statutorySlaDays = 15 วัน (กำหนดส่งตามกฎหมาย)
     ม.18/1 แห่ง พ.ร.บ. มาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต
     พ.ศ. 2551 (แก้ไขถึงฉบับที่ 4 พ.ศ. 2568) กำหนดไว้ 15 วันทั้งสามกรณี คือ
       (ก)(3) ป.ป.ช. มีมติจะดำเนินการเอง — นับแต่วันที่ได้รับแจ้งมติ ป.ป.ช.
       (ข)(1) เรื่องอยู่ในหน้าที่และอำนาจของ ป.ป.ช. — นับแต่วันที่ได้รับเรื่อง
       (ข)(3) พ้นกำหนดเวลา / เหลืออายุความไม่ถึงหกเดือน — นับแต่วันที่ได้รับเรื่อง
     ใช้เฉพาะเส้นทางที่เกี่ยวกับการรับมอบหมายจาก ป.ป.ช. เท่านั้น และเป็น
     **กำหนดตายตัวตามกฎหมาย ขยายไม่ได้** ระบบจึงต้องถือเป็นเส้นตาย (deadline)
     ตัวบทเดียวกันยังบังคับให้ "คัดสำเนาสำนวนดังกล่าวเก็บรักษาไว้เป็นหลักฐานด้วย"
     → ฟิลด์ requireArchiveCopy ใช้เป็นเงื่อนไขปิดสำนวน (ดู guard DISPATCHING → CLOSED)

   เรือนที่ 2 — trackingSlaDays = 30 วัน (กรอบกำกับติดตาม)
     เล่ม 6 กิจกรรมที่ 8 · Use Case CHK011 "กรณีที่ 4 มีมติส่งเรื่องให้ ป.ป.ช.
     ดำเนินการ กำหนดระยะเวลากำกับติดตาม 30 วัน นับแต่วันที่ได้รับมติ"
     เป็นกรอบที่กิจกรรมที่ 8 ใช้ **ติดตามผล** หลังบอร์ดมีมติ
     **มิใช่** กำหนดส่งมอบสำนวน จึงห้ามนำมาแทนที่ 15 วันของ ม.18/1

   ปลายทางภายในองค์กรไม่อยู่ใต้ ม.18/1 จึง **ไม่มี** statutorySlaDays เลย
   (กฎหมายไม่ได้กำหนด) มีเพียงกรอบกำกับติดตามเชิงบริหารเท่านั้น            */
const FORWARD_TARGETS = [
  { code:'NACC',      label:'สำนักงาน ป.ป.ช. (นอกอำนาจ ป.ป.ท.)',
    external:true,  requireSignedScan:true, requireArchiveCopy:true,
    statutorySlaDays:15,
    statutoryBasis:'ม.18/1 (ก)(3) / (ข)(1) / (ข)(3) — ส่งสำนวนภายใน 15 วัน · กำหนดตายตัวตามกฎหมาย ขยายไม่ได้',
    trackingSlaDays:30,
    trackingBasis:'เล่ม 6 กิจกรรมที่ 8 · CHK011 — กรอบกำกับติดตาม 30 วันนับแต่วันที่ได้รับมติ (มิใช่กำหนดส่ง)',
    archiveBasis:'ม.18/1 — ต้องคัดสำเนาสำนวนเก็บรักษาไว้เป็นหลักฐาน',
    doc:'หนังสือนำส่งสำนวนถึงสำนักงาน ป.ป.ช.' },
  { code:'SCREENING', label:'คณะอนุกรรมการกลั่นกรองเรื่องไต่สวนข้อเท็จจริง',
    external:false, requireSignedScan:false, requireArchiveCopy:false,
    trackingSlaDays:15,
    trackingBasis:'กรอบกำกับติดตามเชิงบริหารภายในสำนักงาน — กฎหมายไม่ได้กำหนดเส้นตายไว้',
    doc:'บันทึกส่งเรื่องเข้าคณะอนุกลั่นกรองฯ' },
  { code:'LEGAL',     label:'กองกฎหมาย (กกม.)',
    external:false, requireSignedScan:false, requireArchiveCopy:false,
    trackingSlaDays:15,
    trackingBasis:'กรอบกำกับติดตามเชิงบริหารภายในสำนักงาน — กฎหมายไม่ได้กำหนดเส้นตายไว้',
    doc:'บันทึกขอความเห็นทางกฎหมาย' }
];
function forwardTarget(code){ return FORWARD_TARGETS.find(t => t.code === code) || null; }

/* =========================================================================
   DESIGN DECISIONS — คำตอบ Q1–Q5 ที่นำมาบังคับใช้ในต้นแบบ
   ทุกค่าในนี้เป็น "ข้อสันนิษฐานเชิงออกแบบ" ที่ตั้งให้ Admin แก้ได้
   ยังต้องให้ ป.ป.ท. ยืนยันก่อน Go-Live
   ========================================================================= */
const CONFIG = {
  /* Q1 — ทุกชั้นที่ถือคิวตีกลับได้ แต่แยก "ระดับการตีกลับ" 2 แบบ */
  returnAllLevels: true,
  /* Q2 — ระบบเสนอ "เร่งด่วน" อัตโนมัติเมื่อเหลือเวลาตาม ม.23 น้อยกว่าค่านี้ */
  urgentAutoDays: 90,
  /* Q3 — องค์ประชุมคณะอนุกลั่นกรองฯ: ใช้กึ่งหนึ่งโดยอนุโลมจาก ม.12 (ตั้งค่าได้) */
  subQuorumRatio: 0.5,
  subMemberCount: 7,
  /* Q5 — โหมดบันทึกมติ: 'AFTER' อยู่ในขอบเขต TOR | 'LIVE' ต้องออก Change Request */
  eMeetingMode: 'AFTER'
};

/* Q1 — ระดับการส่งคืนของเลขาธิการฯ
   เนื่องจากกิจกรรมที่ 7 เริ่มที่เลขาธิการฯ การส่งคืนทุกกรณีคือการ
   "ส่งเรื่องออกนอกกิจกรรมที่ 7" กลับไปยังสายงานต้นทาง (กิจกรรมที่ 5)
   ต่างกันเพียงว่าให้กลับไปตกที่ชั้นใดของกอง/เขต                        */
const RETURN_SCOPES = [
  { code:'TO_DIRECTOR', label:'ส่งคืน ผอ.กอง / ผอ.สนง. ป.ป.ท. เขต',
    note:'ใช้กรณีข้อบกพร่องอยู่ที่การกลั่นกรองของหน่วยงาน เช่น ความเห็นตามลำดับชั้นไม่ครบ' },
  { code:'TO_OWNER', label:'ส่งคืนเจ้าของสำนวนโดยตรง',
    note:'ใช้กรณีข้อบกพร่องอยู่ที่ตัวรายงาน 213 หรือพยานหลักฐานต้นทาง' }
];

/* Q1 — ฟิลด์ "สาระสำคัญ" ถ้าถูกแก้ ต้องเสนอใหม่ตามลำดับชั้นทั้งสาย
   เพราะความเห็นของผู้พิจารณาเดิมตั้งอยู่บนเนื้อหาที่เปลี่ยนไปแล้ว */
const MATERIAL_FIELDS = [
  { id:'f_allegation', label:'ข้อกล่าวหา' },
  { id:'f_finding',    label:'ผลการแสวงหาข้อเท็จจริงและพยานหลักฐาน' },
  { id:'f_opinionType',label:'ความเห็นของผู้รับผิดชอบสำนวน' }
];

/* ------------------------------------------------------------ HELPERS */
/* จำนวนวันคงเหลือถึงวันครบกำหนด (รับ ISO 'พ.ศ.-MM-DD' แปลงเป็น ค.ศ. ก่อน) */
function daysUntil(thaiIso){
  const p = String(thaiIso).split('-');
  if(p.length !== 3) return null;
  const target = new Date(+p[0] - 543, +p[1] - 1, +p[2]);
  const today  = new Date(2026, 7, 4);          /* ตรึงวันที่อ้างอิงของต้นแบบ */
  return Math.round((target - today) / 86400000);
}
const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function thaiDate(iso){
  if(!iso || iso === '—') return '—';
  const p = String(iso).split('-');
  if(p.length !== 3) return iso;
  return `${parseInt(p[2],10)} ${THAI_MONTHS[parseInt(p[1],10)-1]} ${p[0]}`;
}
function slaClass(used, limit){
  if(used > limit) return 'sla-late';
  if(used >= limit - 2) return 'sla-warn';
  return 'sla-ok';
}
function slaLabel(used, limit){
  if(used > limit) return `เกินกำหนด ${used - limit} วัน`;
  return `ใช้ไป ${used}/${limit} วัน`;
}
function getCase(id){ return CASES.find(c => c.id === id) || CASES[0]; }
function getRole(id){ return ROLES.find(r => r.id === id) || ROLES[0]; }
/* จับคู่ username ที่กรอกในหน้า login.html (จำลอง — ยังไม่มี auth จริง) กับบทบาท
   เพื่อให้เข้าสู่ระบบด้วยชื่อผู้ใช้ของแต่ละคนแล้วเห็นเมนู/คิวงานของบทบาทนั้นทันที */
function roleIdForLogin(username){
  const u = String(username || '').trim().toLowerCase();
  if(!u) return null;
  const r = ROLES.find(r => r.login && r.login.toLowerCase() === u);
  return r ? r.id : null;
}

/* current role — เก็บใน sessionStorage เพื่อให้สลับข้ามหน้าได้ */
function currentRoleId(){ return sessionStorage.getItem('ecmis_role') || 'legal_officer'; }
function setRole(id){ sessionStorage.setItem('ecmis_role', id); location.reload(); }
function currentRole(){ return getRole(currentRoleId()); }

/* งานที่ค้างอยู่ที่บทบาทนี้ (Work Inbox count) */
function inboxFor(roleId){
  return CASES.filter(c => STATUS[c.status] && STATUS[c.status].owner === roleId);
}

/* สิทธิ์: บทบาทปัจจุบันเป็น "เจ้าของคิว" ของสำนวนนี้หรือไม่ */
function canAct(kase, roleId){
  const st = STATUS[kase.status];
  if(!st) return false;
  return st.owner === roleId;
}

function canRecall(kase, roleId){
  if(roleId !== 'legal_officer') return false;
  return ['PENDING_DIRECTOR','PENDING_SECGEN'].includes(kase.status);
}

/* -------------------------------------------------------- SHELL RENDER
   เมนู sidebar กรองตามสิทธิ์จริงของแต่ละบทบาท (13 บทบาท ตาม Google Sheet) */
const NAV = [
  { section:'ระบบบริหารจัดการกระบวนการด้านกฎหมายในทางคดี' },
  { href:'01-work-inbox.html', icon:'fa-inbox', label:'คิวงานหลักที่รอดำเนินการ', badge:true, visible: role => true }
];

/* คืนเฉพาะรายการเมนูที่บทบาทนี้เห็น พร้อมตัด section header ที่ไม่มีรายการ
   ใต้ตัวเองเหลืออยู่ (orphan header) ออกไปด้วย */
function visibleNavFor(role){
  const filtered = NAV.filter(n => !n.visible || n.visible(role));
  return filtered.filter((n, i) => {
    if(!n.section) return true;
    const next = filtered[i + 1];
    return !!next && !next.section;
  });
}

function renderShell(activeHref){
  const role = currentRole();
  const inboxCount = inboxFor(role.id).length;

  /* ---- notification center ---- */
  const notifications = [
    { title:'เสนอเรื่องใหม่', body:'สำนวน คดี-10.1-2569/001 รอลงนามความเห็นแย้ง', time:'10 นาทีที่แล้ว', icon:'fa-user-check', cls:'bg-primary text-white' },
    { title:'คำร้องขอเปิดเผยข้อมูล', body:'คำร้อง-10.2-2569/014 เข้าสู่ระบบแล้ว', time:'1 ชม. ที่แล้ว', icon:'fa-envelope-open-text', cls:'bg-success text-white' },
    { title:'เตือน SLA คดีปกครอง', body:'คดีปกครอง-10.3-2569/002 เหลือเวลา 5 วัน', time:'2 ชม. ที่แล้ว', icon:'fa-clock', cls:'bg-warning text-dark' }
  ];
  const notifItems = notifications.map(n => `
    <li class="p-2 border-bottom" style="font-size:0.78rem">
      <div class="d-flex gap-2">
        <span class="rounded-circle d-flex align-items-center justify-content-center ${n.cls}" style="width:28px;height:28px;flex:0 0 auto">
          <i class="fa-solid ${n.icon}" style="font-size:0.75rem"></i>
        </span>
        <div>
          <strong class="d-block text-dark dark-text-light" style="font-size:0.8rem">${n.title}</strong>
          <span class="text-muted d-block" style="font-size:0.74rem">${n.body}</span>
          <small class="text-muted" style="font-size:0.66rem">${n.time}</small>
        </div>
      </div>
    </li>`).join('');

  /* ---- topbar ---- */
  const groups = [];
  ROLES.forEach(r => {
    let g = groups.find(x => x.name === r.group);
    if(!g){ g = { name:r.group, items:[] }; groups.push(g); }
    g.items.push(r);
  });
  const roleItems = groups.map(g => `
    <li><h6 class="dropdown-header text-uppercase" style="font-size:.66rem;letter-spacing:.4px">${g.name}</h6></li>` +
    g.items.map(r => {
      const up = r.scope === 'UPSTREAM';
      const edit = r.perms.includes('EDIT.MASTER')
        ? '<span class="st st-urgent ms-1" style="font-size:.6rem">แก้ไขได้</span>' : '';
      return `<li><a class="dropdown-item ${r.id===role.id?'active':''}" href="#" data-role="${r.id}" ${up?'style="opacity:.72"':''}>
        <strong>${r.row}. ${r.title}</strong>${edit}
        ${up?'<span class="st st-draft ms-1" style="font-size:.6rem">นอกขอบเขต กจ.10</span>':''}
        <small>${r.name} · ${r.org} · กิจกรรม ${r.act}</small>
      </a></li>`;
    }).join('')).join('<li><hr class="dropdown-divider"></li>');

  const topbar = `
  <header class="app-topbar no-print">
    <button class="btn btn-sm text-white d-lg-none border-0" id="sbToggle" aria-label="เปิด/ปิดเมนู">
      <i class="fa-solid fa-bars"></i>
    </button>
    <button class="btn btn-sm text-white d-none d-lg-inline-flex border-0" id="sbCollapseToggle" aria-label="ย่อ/ขยายเมนูด้านข้าง" title="ย่อ/ขยายเมนูด้านข้าง">
      <i class="fa-solid fa-bars"></i>
    </button>

    <button class="btn btn-sm text-white border-0" onclick="document.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}))" title="ค้นหาด่วน (Ctrl+K)">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>

    <div class="ms-auto d-flex align-items-center gap-2">
      <!-- Accessibility Toolbar controls -->
      <button class="btn btn-sm text-white border-0" onclick="ECMIS.changeFont(-1)" title="อักษรเล็กลง" style="font-size: 0.8rem">A-</button>
      <button class="btn btn-sm text-white border-0" onclick="ECMIS.changeFont(1)" title="อักษรใหญ่ขึ้น" style="font-size: 0.8rem">A+</button>
      <button class="btn btn-sm text-white border-0" onclick="ECMIS.toggleDarkMode()" title="สลับโหมดมืด"><i class="fa-regular fa-moon"></i></button>
      <button class="btn btn-sm text-white border-0" onclick="ECMIS.toggleHighContrast()" title="ปรับสีคอนทราสต์สูง"><i class="fa-solid fa-circle-half-stroke"></i></button>
      
      <!-- Notification bell dropdown -->
      <div class="dropdown">
        <button class="btn btn-sm text-white position-relative border-0" data-bs-toggle="dropdown" aria-expanded="false" title="การแจ้งเตือน">
          <i class="fa-regular fa-bell"></i>
          <span class="position-absolute top-50 start-100 translate-middle-y badge rounded-pill bg-danger" style="font-size:.58rem; transform: translate(-30%, -85%) !important">3</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end p-0" style="width:290px; max-height:360px; overflow-y:auto">
          <li><h6 class="dropdown-header border-bottom p-2 text-dark dark-text-light" style="font-size: 0.82rem">การแจ้งเตือนล่าสุด</h6></li>
          ${notifItems}
          <li class="text-center p-2"><a href="#" style="font-size:0.75rem; text-decoration:none; color:var(--ecmis-navy)">ดูการแจ้งเตือนทั้งหมด</a></li>
        </ul>
      </div>

      <div class="dropdown role-switcher">
        <button class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fa-regular fa-user me-1"></i>${role.name}
          <span class="d-none d-md-inline"> — ${role.title}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end p-2" style="min-width:250px;">
          <li><h6 class="dropdown-header text-uppercase p-1 mb-1" style="font-size:.72rem;letter-spacing:.4px;">ข้อมูลผู้เข้าใช้ระบบ</h6></li>
          <li class="px-2 py-2 bg-light rounded mb-2">
            <strong class="d-block text-dark" style="font-size:.88rem;">${role.name}</strong>
            <span class="text-navy d-block fw-semibold" style="font-size:.8rem;">${role.title}</span>
            <small class="text-muted d-block" style="font-size:.74rem;">${role.org} (${role.group})</small>
          </li>
          <li><hr class="dropdown-divider my-1"></li>
          <li class="px-2 py-1"><small class="text-muted d-block text-wrap" style="font-size:.72rem;"><i class="fa-solid fa-circle-info me-1"></i>หากต้องการเปลี่ยนบทบาท กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่</small></li>
          <li><hr class="dropdown-divider my-1"></li>
          <li><a class="dropdown-item text-danger rounded fw-semibold py-2" href="login.html"><i class="fa-solid fa-right-from-bracket me-2"></i>ออกจากระบบ</a></li>
        </ul>
      </div>
    </div>
  </header>`;

  /* ---- sidebar ---- */
  const navHtml = visibleNavFor(role).map(n => {
    if(n.section) return `<div class="nav-section">${n.section}</div>`;
    const active = n.href === activeHref;
    const badge = n.badge && inboxCount ? `<span class="badge bg-danger rounded-pill">${inboxCount}</span>` : '';
    const step  = n.step ? `<span class="step-no">${n.step}</span>` : `<i class="fa-solid ${n.icon}"></i>`;
    return `<a class="nav-link ${active?'active':''}" href="${n.href}" title="${n.label}" ${n.muted?'style="opacity:.7"':''}>
      ${step}<span>${n.label}</span>${badge}
    </a>`;
  }).join('');

  /* Sidebar-bottom user chip */
  const userChip = `
  <div class="dropdown sidebar-user-chip">
    <button class="sidebar-user-chip-btn" data-bs-toggle="dropdown" aria-expanded="false" title="${role.name} — ${role.title}">
      <span class="sidebar-user-chip-avatar">${role.name.charAt(0)}</span>
      <span class="sidebar-user-chip-text">
        <strong>${role.name}</strong>
        <small>${role.title}</small>
      </span>
    </button>
    <ul class="dropdown-menu p-2" style="min-width:240px;">
      <li><h6 class="dropdown-header text-uppercase p-1 mb-1" style="font-size:.72rem;">ข้อมูลผู้ใช้</h6></li>
      <li class="px-2 py-2 bg-light rounded mb-2">
        <strong class="d-block text-dark" style="font-size:.88rem;">${role.name}</strong>
        <span class="text-navy d-block fw-semibold" style="font-size:.8rem;">${role.title}</span>
        <small class="text-muted d-block" style="font-size:.74rem;">${role.org}</small>
      </li>
      <li><hr class="dropdown-divider my-1"></li>
      <li><small class="text-muted px-2 py-1 d-block text-wrap" style="font-size:.72rem;"><i class="fa-solid fa-circle-info me-1"></i>เปลี่ยนบทบาทได้ในหน้าเข้าสู่ระบบ</small></li>
      <li><hr class="dropdown-divider my-1"></li>
      <li><a class="dropdown-item text-danger rounded fw-semibold py-2" href="login.html"><i class="fa-solid fa-right-from-bracket me-2"></i>ออกจากระบบ</a></li>
    </ul>
  </div>`;

  const sidebar = `
  <nav class="app-sidebar no-print" id="appSidebar">
    <a class="brand text-decoration-none" href="01-work-inbox.html">
      <img src="pacc_logo.png" alt="ตราสำนักงาน ป.ป.ท.">
      <span>E-CMIS
        <small>ระบบกฎหมายในทางคดี</small>
      </span>
    </a>
    <div class="sidebar-nav-scroll">${navHtml}</div>
    ${userChip}
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', topbar + sidebar);

  document.querySelectorAll('[data-role]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); setRole(el.dataset.role); });
  });
  const tog = document.getElementById('sbToggle');
  if(tog) tog.addEventListener('click', () => document.getElementById('appSidebar').classList.toggle('open'));
  const collapseTog = document.getElementById('sbCollapseToggle');
  if(collapseTog) collapseTog.addEventListener('click', () => toggleSidebarCollapse());

  // Initialize features
  initA11yAndPref();
  initCommandPalette();
  initVoiceInput();
  initCharCounterAndCopy();
  initDocPaneToggle();

  // Auto-wire Real-time Validation on every form
  document.querySelectorAll('form[id], main form').forEach(f => {
    if (f.id) initRealTimeValidation(f);
  });

  // Auto-wire AutoSave on forms with data-autosave attribute
  document.querySelectorAll('form[data-autosave]').forEach(f => {
    const key = f.dataset.autosave || ('draft_' + f.id);
    initAutoSave(f.id, key, 'คุณยังมีข้อมูลที่ไม่ได้บันทึก — ออกจากหน้านี้?');
  });

  // Skeleton loading: replace empty tables with shimmer, then resolve when JS fills them
  document.querySelectorAll('table tbody:empty, table tbody').forEach(tbody => {
    if (!tbody.children.length) {
      const cols = tbody.closest('table')?.querySelectorAll('thead th').length || 4;
      tbody.innerHTML = Array.from({length:3}, () =>
        `<tr class="skeleton-row">${Array.from({length:cols}, () =>
          `<td><div class="skeleton-box" style="height:14px;border-radius:4px;background:#e2e8f0;width:${60+Math.random()*30|0}%"></div></td>`
        ).join('')}</tr>`
      ).join('');
    }
  });

  // Empty State: show friendly message when no data after load
  setTimeout(() => {
    document.querySelectorAll('table tbody').forEach(tbody => {
      const rows = tbody.querySelectorAll('tr:not(.skeleton-row)');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="99" class="ecmis-empty-state">
          <div style="text-align:center;padding:32px 16px;color:var(--ecmis-muted)">
            <i class="fa-solid fa-inbox fa-2x mb-3" style="opacity:.4"></i>
            <div style="font-size:.92rem;font-weight:600">ไม่พบข้อมูล</div>
            <div style="font-size:.8rem;margin-top:4px">ไม่มีรายการที่ตรงกับเงื่อนไข หรือยังไม่มีข้อมูลในระบบ</div>
          </div>
        </td></tr>`;
      }
    });
  }, 800);


  // Add Breadcrumb Trail
  const activeNav = NAV.find(n => n.href === activeHref);
  if (activeNav) {
    let parentSection = 'ภาพรวม';
    for (let i = 0; i < NAV.length; i++) {
      if (NAV[i].section) parentSection = NAV[i].section;
      if (NAV[i].href === activeHref) break;
    }
    const breadcrumbHtml = `
      <nav aria-label="breadcrumb" class="no-print mb-2">
        <ol class="breadcrumb" style="font-size:0.75rem; margin:0 0 12px 0; padding:0; list-style:none; display:flex; gap:6px">
          <li class="breadcrumb-item"><a href="01-work-inbox.html" style="text-decoration:none; color:var(--ecmis-navy)"><i class="fa-solid fa-house me-1"></i>Home</a></li>
          <li class="breadcrumb-item text-muted" style="display:flex; gap:6px"><span style="margin:0 4px">/</span>${parentSection}</li>
          <li class="breadcrumb-item active" style="display:flex; gap:6px" aria-current="page"><span style="margin:0 4px">/</span>${activeNav.label}</li>
        </ol>
      </nav>`;
    const appMain = document.querySelector('.app-main');
    if (appMain) {
      appMain.insertAdjacentHTML('afterbegin', breadcrumbHtml);
    }
  }
}

/* -------------------------------------------------------- UI BUILDERS */
function stepperHtml(statusKey){
  const cur = STATUS_STEP[statusKey] || 'report';
  const idx = FLOW_STEPS.findIndex(s => s.key === cur);
  return `<div class="flow-stepper">` + FLOW_STEPS.map((s,i) => {
    const cls = i < idx ? 'done' : (i === idx ? 'active' : '');
    const mark = i < idx ? '<i class="fa-solid fa-check"></i>' : (i+1);
    return `<div class="fstep ${cls}">
      <div class="dot">${mark}</div>
      <div class="lbl">${s.label}</div>
    </div>`;
  }).join('') + `</div>`;
}

function statusBadge(statusKey){
  const s = STATUS[statusKey];
  return s ? `<span class="st ${s.cls}"><i class="fa-solid fa-circle-dot me-1" style="font-size: 0.65rem"></i>${s.label}</span>` : '';
}

/* เพดาน SLA ที่ใช้จริงกับสำนวน — ชั้นเลขาธิการฯ ใช้ตารางตามชนิดรายงาน/ระยะ
   (ผัง P2 โหนด t5) ส่วนชั้นอื่นยังใช้ค่าที่ติดมากับสำนวน                  */
function effectiveSlaLimit(kase){
  return kase.status === 'PENDING_SECGEN' ? secgenSlaLimit(kase) : kase.slaLimit;
}

function slaBadge(kase){
  const lim = effectiveSlaLimit(kase);
  return `<span class="sla ${slaClass(kase.slaDays, lim)}">
    <i class="fa-regular fa-clock me-1"></i>${slaLabel(kase.slaDays, lim)}</span>`;
}

/* Action bar — ปุ่มเปลี่ยนตามบทบาท (ข้อกำหนดหลักของ Step 3) */
function actionBar(kase, roleId, buttons){
  const role = getRole(roleId);
  const allowed = canAct(kase, roleId);
  let inner;

  if(isUpstreamCase(kase)){
    /* สำนวนยังไม่เข้ากิจกรรมที่ 7 — ไม่มี Action ใดในโมดูลนี้ */
    const ownerRole = STATUS[kase.status] ? getRole(STATUS[kase.status].owner) : null;
    inner = `<div class="no-permission" style="border-color:#d79b00;background:#fff8ec">
      <i class="fa-solid fa-arrow-right-to-bracket me-1"></i>
      <strong>สำนวนนี้ยังไม่เข้าสู่กิจกรรมที่ 7</strong> — อยู่ระหว่างการเสนอตามลำดับชั้น
      ภายในกอง / สำนักงาน ป.ป.ท. เขต ซึ่งเป็นกระบวนงานของ <strong>กิจกรรมที่ 5</strong>
      ${ownerRole ? `<br>ขณะนี้เรื่องอยู่ที่ <strong>${ownerRole.title}</strong>` : ''}
      <br><small>กิจกรรมที่ 7 เริ่มนับเมื่อรายงานมาถึง <strong>เลขาธิการคณะกรรมการ ป.ป.ท.</strong></small>
    </div>`;
  } else if(allowed && buttons.length){
    inner = buttons.map(b =>
      `<button type="button" class="btn ${b.cls} btn-sm" data-act="${b.act}">
        <i class="fa-solid ${b.icon} me-1"></i>${b.label}</button>`).join('');
  } else {
    const ownerRole = STATUS[kase.status] ? getRole(STATUS[kase.status].owner) : null;
    inner = `<div class="no-permission">
      <i class="fa-solid fa-lock me-1"></i>
      บทบาท <strong>${role.title}</strong> ไม่มีสิทธิ์ดำเนินการกับสำนวนนี้ในสถานะปัจจุบัน
      ${ownerRole ? ` — ขณะนี้เรื่องอยู่ที่ <strong>${ownerRole.title}</strong>` : ''}
      <br><small>สลับบทบาทที่มุมขวาบนเพื่อทดสอบสิทธิ์ของผู้ใช้รายอื่น</small>
    </div>`;
  }

  const scopeTag = role.scope === 'UPSTREAM'
    ? `<span class="st st-draft ms-1">นอกขอบเขต กจ.7</span>`
    : '';
  const editTag = canEditMaster(roleId)
    ? `<span class="st st-done ms-1" title="ชีตแถว 15 — มีเพียง 7 คนที่แก้ไขมติ/คำสั่ง/รายงานได้">
         <i class="fa-solid fa-pen-to-square"></i> แก้ไขมติได้</span>`
    : `<span class="st st-closed ms-1" title="ชีตแถว 15/17 — บทบาทนี้แก้ไขมติ/คำสั่ง/รายงานไม่ได้">
         <i class="fa-solid fa-lock"></i> แก้ไขมติไม่ได้</span>`;

  return `<div class="action-bar" id="caseActionBar">
    <div class="role-hint">
      <i class="fa-regular fa-user me-1"></i>กำลังดำเนินการในบทบาท:
      <strong>${role.title}</strong> ${scopeTag} ${editTag}
    </div>${inner}
  </div>`;
}

/* เลขไทย — เอกสารราชการที่พิมพ์ออกใช้เลขไทย ต่างจากฟิลด์กรอกข้อมูลในฟอร์ม
   ซึ่งยังคงเป็นเลขอารบิกเพื่อความสะดวกในการพิมพ์/ค้นหา                    */
const THAI_DIGITS = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
function toThaiDigits(input){
  if(input === undefined || input === null) return input;
  return String(input).replace(/[0-9]/g, d => THAI_DIGITS[d]);
}

/* -------------------------------------------- MAIL-MERGE (Document) */
/* แทนค่าฟิลด์ลงเทมเพลต — จำลอง Mail-Merge Template Engine (TOR 7.1.3.6)
   ทุกค่าที่ผ่านฟังก์ชันนี้ถือว่ากำลังลงเอกสารจริง จึงแปลงเป็นเลขไทยเสมอ    */
function mergeField(value, placeholder){
  if(value === undefined || value === null || String(value).trim() === ''){
    return `<span class="mergefield empty" title="ยังไม่มีข้อมูล — ต้องกรอกในฟอร์มด้านซ้าย">${placeholder||'……………'}</span>`;
  }
  return `<span class="mergefield filled" title="Auto-fill จากฟอร์ม/ฐานข้อมูลกลาง E-CMIS">${toThaiDigits(value)}</span>`;
}

/* ---------------------------------------------------------- DIALOGS */
function confirmAction(opts){
  return Swal.fire({
    title: opts.title,
    html: opts.html || '',
    icon: opts.icon || 'question',
    showCancelButton: true,
    confirmButtonText: opts.confirmText || 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: opts.danger ? '#a5322a' : '#0a2647',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    customClass: { popup:'text-start' }
  });
}
function toastOk(msg){
  Swal.fire({ toast:true, position:'top-end', icon:'success', title:msg,
    showConfirmButton:false, timer:2600, timerProgressBar:true });
}
function toastWarn(msg){
  Swal.fire({ toast:true, position:'top-end', icon:'warning', title:msg,
    showConfirmButton:false, timer:3200, timerProgressBar:true });
}

/* --------------------------------- Digital Signature simulation dialog */
function signDialog(docName, signerName){
  return Swal.fire({
    title:'ลงลายมือชื่อดิจิทัล (e-Signature)',
    html:`<div class="text-start" style="font-size:.9rem">
      <p class="mb-2">เอกสาร: <strong>${docName}</strong></p>
      <p class="mb-2">ผู้ลงนาม: <strong>${signerName}</strong></p>
      
      <!-- Canvas Signature Pad -->
      <label class="form-label mt-2">วาดลายมือชื่อด้วยเมาส์หรือสัมผัส (Digital Signature Pad)</label>
      <div class="sig-canvas-wrapper mb-2">
        <canvas id="swal-sig-canvas" class="sig-canvas" width="500" height="150"></canvas>
      </div>
      <div class="text-end mb-2">
        <button type="button" class="btn btn-xs btn-outline-secondary py-1 px-2" style="font-size:0.75rem" id="swal-sig-clear">ล้างรูปวาด</button>
      </div>
      <input type="hidden" id="swal-sig-input">
      
      <div class="mb-2" style="background:#fdf7e8;border-left:4px solid #c9a227;padding:.6rem .8rem;border-radius:0 6px 6px 0">
        ระบบจะแปลงเอกสารเป็น PDF และผนึกลายมือชื่ออิเล็กทรอนิกส์
        ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ฯ (TOR 14.6)
      </div>
      <label class="form-label mt-2">รหัส OTP ที่ส่งไปยังโทรศัพท์ที่ลงทะเบียน</label>
      <input id="swal-otp" class="form-control" maxlength="6" inputmode="numeric" placeholder="กรอก 6 หลัก (ทดสอบ: 123456)">
      <div class="mt-2" style="font-size:.75rem;color:#6b7280">
        <i class="fa-solid fa-circle-info me-1"></i>ผู้ให้บริการ CA (ThaiD Sign / CA หน่วยงาน) ยังรอ ป.ป.ท. ยืนยัน
      </div>
    </div>`,
    showCancelButton:true, confirmButtonText:'ยืนยันลงนาม', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#0a2647', cancelButtonColor:'#6b7280', reverseButtons:true,
    didOpen() {
      initSignaturePad('swal-sig-canvas', 'swal-sig-clear', 'swal-sig-input');
    },
    preConfirm(){
      const v = document.getElementById('swal-otp').value.trim();
      const sigData = document.getElementById('swal-sig-input').value;
      if(v.length !== 6){ Swal.showValidationMessage('กรุณากรอก OTP ให้ครบ 6 หลัก'); return false; }
      return { otp: v, sig: sigData };
    }
  });
}

/* ------------------------------------------- Sequential e-signature */
function sequentialSignDialog(docName, signers){
  const cur = signers[0];
  const rest = signers.slice(1);
  const stepList = signers.map((s,i) => `
    <div class="d-flex align-items-start gap-2 mb-2" style="font-size:.82rem">
      <span class="st ${i===0?'st-pending':'st-draft'}" style="min-width:26px;text-align:center">${i+1}</span>
      <div>
        <strong>${s.name}</strong> — ${s.title}
        ${i===0
          ? '<div class="text-muted" style="font-size:.74rem"><i class="fa-solid fa-signature me-1"></i>ลงนามในขั้นตอนนี้</div>'
          : `<div class="text-muted" style="font-size:.74rem"><i class="fa-regular fa-clock me-1"></i>${s.note || 'รอดำเนินการในขั้นตอนถัดไปของผัง'}</div>`}
      </div>
    </div>`).join('');

  return Swal.fire({
    title:'ลงลายมือชื่อดิจิทัลตามลำดับ (Sequential e-Signature)',
    html:`<div class="text-start" style="font-size:.9rem">
      <p class="mb-2">เอกสาร: <strong>${docName}</strong></p>
      <div class="mb-3" style="background:#f4f8f4;border:1px solid #cfe3d4;border-radius:8px;padding:10px 12px">
        <div class="mb-1" style="font-size:.72rem;font-weight:600;color:var(--ecmis-muted,#6b7280)">
          ลำดับผู้ลงนามของเอกสารนี้ (${signers.length} ลำดับ)</div>
        ${stepList}
      </div>
      
      <!-- Canvas Signature Pad -->
      <label class="form-label mt-2">วาดลายมือชื่อด้วยเมาส์หรือสัมผัส (Digital Signature Pad)</label>
      <div class="sig-canvas-wrapper mb-2">
        <canvas id="swal-sig-canvas" class="sig-canvas" width="500" height="150"></canvas>
      </div>
      <div class="text-end mb-2">
        <button type="button" class="btn btn-xs btn-outline-secondary py-1 px-2" style="font-size:0.75rem" id="swal-sig-clear">ล้างรูปวาด</button>
      </div>
      <input type="hidden" id="swal-sig-input">

      <div class="mb-2" style="background:#fdf7e8;border-left:4px solid #c9a227;padding:.6rem .8rem;border-radius:0 6px 6px 0">
        กำลังลงนามในฐานะ <strong>${cur.name}</strong> — ระบบจะแปลงเอกสารเป็น PDF และผนึก
        ลายมือชื่ออิเล็กทรอนิกส์ตาม พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ฯ (TOR 14.6)
        ${rest.length ? `<br><small>เมื่อลงนามลำดับนี้แล้ว เอกสารจะส่งต่อให้ <strong>${rest[0].name}</strong>
          ลงนามลำดับถัดไปในขั้นตอนของผัง — ไม่ใช่ลงนามแทนกันในหน้าจอเดียว</small>` : ''}
      </div>
      <label class="form-label mt-2">รหัส OTP ที่ส่งไปยังโทรศัพท์ที่ลงทะเบียนของ ${cur.name}</label>
      <input id="swal-otp" class="form-control" maxlength="6" inputmode="numeric" placeholder="กรอก 6 หลัก (ทดสอบ: 123456)">
      <div class="mt-2" style="font-size:.75rem;color:#6b7280">
        <i class="fa-solid fa-circle-info me-1"></i>ผู้ให้บริการ CA (ThaiD Sign / CA หน่วยงาน) ยังรอ ป.ป.ท. ยืนยัน
      </div>
    </div>`,
    showCancelButton:true, confirmButtonText:'ยืนยันลงนามลำดับนี้', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#0a2647', cancelButtonColor:'#6b7280', reverseButtons:true, width:560,
    didOpen() {
      initSignaturePad('swal-sig-canvas', 'swal-sig-clear', 'swal-sig-input');
    },
    preConfirm(){
      const v = document.getElementById('swal-otp').value.trim();
      const sigData = document.getElementById('swal-sig-input').value;
      if(v.length !== 6){ Swal.showValidationMessage('กรุณากรอก OTP ให้ครบ 6 หลัก'); return false; }
      return { otp:v, signer:cur, next:rest[0] || null, sig: sigData };
    }
  });
}

/* ==========================================================================
   UI/UX ENHANCEMENT HANDLERS (Step 2 Implementation)
   ========================================================================== */

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('ecmis_dark_mode', isDark);
  toastOk(isDark ? 'เปิดโหมดมืด (Dark Mode)' : 'ปิดโหมดมืด (Light Mode)');
}

function toggleHighContrast() {
  const isHC = document.body.classList.toggle('high-contrast');
  localStorage.setItem('ecmis_high_contrast', isHC);
  toastOk(isHC ? 'เปิดโหมดสีคอนทราสต์สูง' : 'ปิดโหมดสีคอนทราสต์สูง');
}

/* Desktop sidebar collapse (Master Screen Layout Desktop.pdf: 260px <-> 68px).
   Separate from #sbToggle, which stays mobile-only slide-open/close. */
function toggleSidebarCollapse() {
  const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
  localStorage.setItem('ecmis_sidebar_collapsed', isCollapsed);
}

let fontStep = 0;
function changeFont(dir) {
  if (dir === 0) fontStep = 0;
  else fontStep = Math.max(-2, Math.min(3, fontStep + dir));
  const baseSize = 14.5 + fontStep * 2;
  document.documentElement.style.fontSize = baseSize + 'px';
  localStorage.setItem('ecmis_font_step', fontStep);
  toastOk(`ปรับขนาดตัวอักษรเป็น: ${dir > 0 ? 'ใหญ่ขึ้น' : dir < 0 ? 'เล็กลง' : 'ปกติ'}`);
}

function initA11yAndPref() {
  if (typeof document === 'undefined') return;

  const fontStepVal = parseInt(localStorage.getItem('ecmis_font_step') || '0', 10);
  const baseSize = 14.5 + fontStepVal * 2;
  document.documentElement.style.fontSize = baseSize + 'px';

  let isDark = localStorage.getItem('ecmis_dark_mode');
  if (isDark === null) {
    isDark = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'true' : 'false';
  }
  if (isDark === 'true') {
    document.body.classList.add('dark-mode');
  }

  const isHC = localStorage.getItem('ecmis_high_contrast') === 'true';
  if (isHC) {
    document.body.classList.add('high-contrast');
  }

  const isCollapsed = localStorage.getItem('ecmis_sidebar_collapsed') === 'true';
  if (isCollapsed) {
    document.body.classList.add('sidebar-collapsed');
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduced-motion');
  }
}

function initCommandPalette() {
  if (typeof document === 'undefined') return;

  const html = `
  <div class="cmd-palette-backdrop no-print" id="cmdPalette">
    <div class="cmd-palette-box">
      <div class="cmd-palette-search-wrapper">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" class="cmd-palette-input" id="cmdPaletteInput" placeholder="พิมพ์ชื่อเมนู หรือ เลขสำนวนคดี (เช่น 681547)..." autocomplete="off">
      </div>
      <div class="cmd-palette-results" id="cmdPaletteResults"></div>
      <div class="cmd-palette-hint">
        <span><kbd>↑↓</kbd> เลือก &nbsp; <kbd>Enter</kbd> เปิดหน้าจอ &nbsp; <kbd>Esc</kbd> ปิด</span>
        <span>Command Palette <kbd>Ctrl + K</kbd></span>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const backdrop = document.getElementById('cmdPalette');
  const input = document.getElementById('cmdPaletteInput');
  const results = document.getElementById('cmdPaletteResults');

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      backdrop.classList.toggle('show');
      if (backdrop.classList.contains('show')) {
        input.value = '';
        renderResults('');
        setTimeout(() => input.focus(), 100);
      }
    }
    if (e.key === 'Escape' && backdrop.classList.contains('show')) {
      backdrop.classList.remove('show');
    }
  });

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.remove('show');
  });

  input.addEventListener('input', e => {
    renderResults(e.target.value);
  });

  input.addEventListener('keydown', e => {
    const items = results.querySelectorAll('.cmd-palette-item');
    if (!items.length) return;
    let activeIdx = Array.from(items).findIndex(el => el.classList.contains('active'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIdx !== -1) items[activeIdx].classList.remove('active');
      activeIdx = (activeIdx + 1) % items.length;
      items[activeIdx].classList.add('active');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIdx !== -1) items[activeIdx].classList.remove('active');
      activeIdx = (activeIdx - 1 + items.length) % items.length;
      items[activeIdx].classList.add('active');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx !== -1) {
        items[activeIdx].click();
      } else {
        items[0].click();
      }
    }
  });

  function renderResults(q) {
    results.innerHTML = '';
    const query = q.toLowerCase().trim();

    /* ใช้เมนูชุดเดียวกับ sidebar (กรองตามสิทธิ์บทบาทปัจจุบันแล้ว) แทนรายการ
       ตายตัว เพื่อไม่ให้ Command Palette พาไปหน้าที่เมนูข้าง ๆ ซ่อนไว้ */
    const menus = visibleNavFor(currentRole())
      .filter(n => n.href)
      .map(n => ({ label: n.step ? `${n.label} (ขั้นตอน ${n.step})` : n.label, href: n.href, icon: n.icon, cat: 'Menu' }));

    const matchedMenus = menus.filter(m => m.label.toLowerCase().includes(query));
    const matchedCases = CASES.filter(c => 
      c.id.toLowerCase().includes(query) || 
      c.subject.toLowerCase().includes(query)
    );

    let html = '';

    if (matchedMenus.length) {
      html += `<div style="font-size:0.75rem;font-weight:600;color:var(--ecmis-muted);padding:6px 12px">เมนูการนำทาง</div>`;
      matchedMenus.forEach((m, idx) => {
        html += `
        <a class="cmd-palette-item ${idx===0&&!query?'active':''}" href="${m.href}">
          <i class="fa-solid ${m.icon}"></i>
          <span>${m.label}</span>
          <span class="cmd-palette-item-meta">${m.cat}</span>
        </a>`;
      });
    }

    if (matchedCases.length) {
      html += `<div style="font-size:0.75rem;font-weight:600;color:var(--ecmis-muted);padding:12px 12px 6px">สำนวนคดี</div>`;
      matchedCases.forEach((c, idx) => {
        const activeClass = !matchedMenus.length && idx === 0 ? 'active' : '';
        const roleId = currentRoleId();
        const PAGE_FOR = {
          owner:'03-report-213.html', section_head:'03-report-213.html',
          director:'03-report-213.html', deputy:'03-report-213.html',
          secgen:'04-approval-review.html', support_sub:'04-approval-review.html',
          chair_office:'06-chairman-agenda.html',
          chairman:'06-chairman-agenda.html', subcommittee:'07-subcommittee-screening.html',
          board_sec:'08-board-resolution.html', board:'08-board-resolution.html'
        };
        const targetPage = PAGE_FOR[roleId] || '02-case-register.html';
        html += `
        <a class="cmd-palette-item ${activeClass}" href="${targetPage}?case=${encodeURIComponent(c.id)}">
          <i class="fa-solid fa-folder-closed"></i>
          <span><strong>เลขสำนวน: ${c.id}</strong> — ${c.subject.substring(0, 50)}...</span>
          <span class="cmd-palette-item-meta">สถานะ: ${STATUS[c.status]?.label || c.status}</span>
        </a>`;
      });
    }

    if (!matchedMenus.length && !matchedCases.length) {
      html = `<div style="padding:20px;text-align:center;color:var(--ecmis-muted);font-size:0.9rem">
        <i class="fa-solid fa-circle-question fa-lg mb-2"></i><br>ไม่พบรายการที่ตรงกับคำค้นหา
      </div>`;
    }

    results.innerHTML = html;
  }
}



function initSmartCombobox(selectEl) {
  if (!selectEl || selectEl.nextElementSibling?.classList.contains('smart-combo-container')) return;

  const options = Array.from(selectEl.options);
  const container = document.createElement('div');
  container.className = 'smart-combo-container';

  const toggleBtn = document.createElement('div');
  toggleBtn.className = 'form-select';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.textContent = selectEl.options[selectEl.selectedIndex]?.text || '— เลือกรายการ —';

  const dropdown = document.createElement('div');
  dropdown.className = 'smart-combo-dropdown';

  const searchBox = document.createElement('div');
  searchBox.className = 'smart-combo-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'form-control form-control-sm';
  searchInput.placeholder = 'ค้นหารายการ...';
  searchBox.appendChild(searchInput);

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'smart-combo-items';

  function renderItems(filterText) {
    itemsContainer.innerHTML = '';
    const q = filterText.toLowerCase();
    const filtered = options.filter(o => o.text.toLowerCase().includes(q) && o.value !== "");

    if (!filtered.length) {
      itemsContainer.innerHTML = `<div class="text-muted text-center py-2" style="font-size:0.8rem">ไม่พบรายการ</div>`;
      return;
    }

    filtered.forEach(o => {
      const item = document.createElement('div');
      item.className = 'smart-combo-item';
      if (selectEl.value === o.value) item.classList.add('active');
      item.textContent = o.text;
      item.addEventListener('click', () => {
        selectEl.value = o.value;
        toggleBtn.textContent = o.text;
        dropdown.style.display = 'none';
        selectEl.dispatchEvent(new Event('change'));
      });
      itemsContainer.appendChild(item);
    });
  }

  dropdown.appendChild(searchBox);
  dropdown.appendChild(itemsContainer);
  container.appendChild(toggleBtn);
  container.appendChild(dropdown);

  selectEl.style.display = 'none';
  selectEl.parentNode.insertBefore(container, selectEl.nextSibling);

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.style.display === 'flex';
    document.querySelectorAll('.smart-combo-dropdown').forEach(d => d.style.display = 'none');
    dropdown.style.display = open ? 'none' : 'flex';
    if (!open) {
      searchInput.value = '';
      renderItems('');
      setTimeout(() => searchInput.focus(), 100);
    }
  });

  searchInput.addEventListener('input', (e) => {
    renderItems(e.target.value);
  });
  searchInput.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('click', () => {
    dropdown.style.display = 'none';
  });
}

function initRealTimeValidation(formEl) {
  if (!formEl) return;
  const inputs = formEl.querySelectorAll('input, select, textarea');
  inputs.forEach(el => {
    el.addEventListener('input', () => validateField(el));
    el.addEventListener('change', () => validateField(el));
  });

  function validateField(el) {
    if (el.hasAttribute('required') && !el.value.trim()) {
      el.classList.add('is-invalid-ecmis');
      el.classList.remove('is-valid-ecmis');
      const err = el.parentNode.querySelector('.val-msg');
      if (err) {
        err.classList.add('show');
        err.classList.add('val-err');
        err.textContent = 'กรุณากรอกข้อมูลในช่องนี้';
      }
    } else {
      el.classList.remove('is-invalid-ecmis');
      el.classList.add('is-valid-ecmis');
      const err = el.parentNode.querySelector('.val-msg');
      if (err) {
        err.classList.remove('show');
      }
    }
  }
}

let speechRecognitions = {};

function toggleVoiceRecognition(textareaId) {
  if (typeof window === 'undefined') return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toastWarn('เบราว์เซอร์ของคุณไม่รองรับการพิมพ์ด้วยเสียง (Speech Recognition)');
    return;
  }

  const ta = document.getElementById(textareaId);
  const btn = document.getElementById('voiceBtn-' + textareaId);
  const indicator = document.getElementById('voiceIndicator-' + textareaId);
  if (!ta) return;

  if (ta.disabled || ta.readOnly || ta.hasAttribute('disabled') || ta.hasAttribute('readonly') || ta.hasAttribute('data-no-voice')) {
    toastWarn('ช่องนี้ไม่สามารถกรอกข้อมูลหรือพิมพ์ด้วยเสียงได้');
    return;
  }

  if (speechRecognitions[textareaId]) {
    speechRecognitions[textareaId].stop();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'th-TH';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    speechRecognitions[textareaId] = recognition;
    if (btn) {
      btn.classList.add('btn-danger', 'pulse');
      btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    }
    if (indicator) indicator.style.display = 'inline-flex';
    toastOk('เริ่มต้นพิมพ์ด้วยเสียง... พูดได้เลยครับ/ค่ะ');
  };

  recognition.onerror = (e) => {
    console.error('Speech recognition error:', e.error);
    toastWarn('การพิมพ์ด้วยเสียงขัดข้อง: ' + e.error);
    cleanupVoice(textareaId);
  };

  recognition.onend = () => {
    cleanupVoice(textareaId);
  };

  recognition.onresult = (event) => {
    if (ta.disabled || ta.readOnly || ta.hasAttribute('disabled') || ta.hasAttribute('readonly')) return;
    const text = event.results[0][0].transcript;
    if (text) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const currentText = ta.value;
      ta.value = currentText.substring(0, start) + text + currentText.substring(end);
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.dispatchEvent(new Event('input'));
      ta.dispatchEvent(new Event('change'));
      toastOk('เพิ่มข้อความจากการพูดแล้ว');
    }
  };

  recognition.start();
}

function cleanupVoice(textareaId) {
  const btn = document.getElementById('voiceBtn-' + textareaId);
  const indicator = document.getElementById('voiceIndicator-' + textareaId);
  if (btn) {
    btn.classList.remove('btn-danger', 'pulse');
    btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  }
  if (indicator) indicator.style.display = 'none';
  delete speechRecognitions[textareaId];
}

function initVoiceInput() {
  if (typeof document === 'undefined') return;
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(ta => {
    if (ta.hasAttribute('data-no-voice')) return;
    if (ta.id && !document.getElementById('voiceBtn-' + ta.id)) {
      const buttonHtml = `
        <button type="button" class="btn btn-sm btn-outline-secondary voice-btn ms-2" id="voiceBtn-${ta.id}" title="พิมพ์ด้วยเสียง" style="border-radius: 50%; width: 28px; height: 28px; padding:0; display: inline-flex; align-items: center; justify-content: center;">
          <i class="fa-solid fa-microphone"></i>
        </button>
        <span class="voice-indicator ms-2" id="voiceIndicator-${ta.id}" style="font-size:0.75rem; color: var(--ecmis-red); display:none;">
          <span class="voice-dot"></span>กำลังฟัง...
        </span>`;

      const counter = document.getElementById(ta.id + 'Counter');
      if (counter) {
        counter.parentNode.insertBefore(document.createRange().createContextualFragment(buttonHtml), counter);
      } else {
        const label = ta.previousElementSibling;
        if (label && label.classList.contains('form-label')) {
          label.appendChild(document.createRange().createContextualFragment(buttonHtml));
        }
      }

      const btn = document.getElementById('voiceBtn-' + ta.id);
      const indicator = document.getElementById('voiceIndicator-' + ta.id);
      if (btn) {
        btn.addEventListener('click', () => { toggleVoiceRecognition(ta.id); });
      }

      function syncVoiceBtnState() {
        const isOff = ta.disabled || ta.readOnly || ta.hasAttribute('disabled') || ta.hasAttribute('readonly') || ta.hasAttribute('data-no-voice');
        if (btn) {
          btn.disabled = isOff;
          btn.style.display = isOff ? 'none' : 'inline-flex';
          if (indicator && isOff) indicator.style.display = 'none';
          if (isOff && speechRecognitions[ta.id]) {
            speechRecognitions[ta.id].stop();
            cleanupVoice(ta.id);
          }
        }
      }

      syncVoiceBtnState();
      ta.addEventListener('change', syncVoiceBtnState);
      ta.addEventListener('input', syncVoiceBtnState);
      setInterval(syncVoiceBtnState, 300);
    }
  });
}

function initSignaturePad(canvasId, clearBtnId, inputId) {
  const canvas = document.getElementById(canvasId);
  const clearBtn = document.getElementById(clearBtnId);
  const input = document.getElementById(inputId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#0a2647';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function startDraw(e) {
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
    saveSig();
  }

  function stopDraw() { drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDraw);

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (input) input.value = '';
  });

  function saveSig() {
    if (input) input.value = canvas.toDataURL();
  }
}

function initAutoSave(formId, draftKey, warningText) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Restore draft if exists
  const draft = sessionStorage.getItem(draftKey);
  if (draft) {
    try {
      const data = JSON.parse(draft);
      Object.keys(data).forEach(key => {
        const el = form.querySelector(`[name="${key}"], #${key}`);
        if (el) {
          if (el.type === 'checkbox') el.checked = data[key];
          else if (el.type === 'radio') {
            const rad = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
            if (rad) rad.checked = true;
          }
          else el.value = data[key];
          el.dispatchEvent(new Event('input'));
        }
      });
      toastOk('ดึงร่างข้อมูลที่บันทึกไว้อัตโนมัติแล้ว');
    } catch(e){}
  }

  // Periodic Auto-save
  let modified = false;
  form.addEventListener('input', () => { modified = true; });
  form.addEventListener('change', () => { modified = true; });

  setInterval(() => {
    if (!modified) return;
    const data = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      const name = el.name || el.id;
      if (name) {
        if (el.type === 'checkbox') data[name] = el.checked;
        else if (el.type === 'radio') {
          if (el.checked) data[name] = el.value;
        }
        else data[name] = el.value;
      }
    });
    sessionStorage.setItem(draftKey, JSON.stringify(data));
    modified = false;
    const time = new Date().toLocaleTimeString('th-TH');
    toastOk(`บันทึกร่างข้อมูลอัตโนมัติแล้วเมื่อ ${time}`);
  }, 10000);

  // Unsaved Warning before navigating away
  window.addEventListener('beforeunload', (e) => {
    if (modified) {
      e.preventDefault();
      e.returnValue = warningText || 'คุณยังมีข้อมูลที่ไม่ได้บันทึก';
      return e.returnValue;
    }
  });

  // Attach submit clear
  form.addEventListener('submit', () => {
    modified = false;
    sessionStorage.removeItem(draftKey);
  });
}

function initCharCounterAndCopy() {
  if (typeof document === 'undefined') return;
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(ta => {
    if (ta.hasAttribute('readonly') || ta.hasAttribute('disabled')) return;
    if (ta.nextElementSibling?.classList.contains('textarea-helper-bar')) return;
    
    const bar = document.createElement('div');
    bar.className = 'textarea-helper-bar d-flex justify-content-between align-items-center mt-1 px-1';
    bar.style.fontSize = '0.72rem';
    bar.style.color = 'var(--ecmis-muted)';
    
    const counterSpan = document.createElement('span');
    counterSpan.className = 'char-counter';
    const maxLength = ta.getAttribute('maxlength') || '500';
    counterSpan.textContent = `ตัวอักษร: ${ta.value.length}/${maxLength}`;
    
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-xs btn-outline-secondary py-0 px-2';
    copyBtn.style.fontSize = '0.7rem';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy me-1"></i>คัดลอก';
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(ta.value).then(() => {
        toastOk('คัดลอกข้อความลงคลิปบอร์ดแล้ว');
      });
    });
    
    bar.appendChild(counterSpan);
    bar.appendChild(copyBtn);
    
    ta.parentNode.insertBefore(bar, ta.nextSibling);
    
    ta.addEventListener('input', () => {
      counterSpan.textContent = `ตัวอักษร: ${ta.value.length}/${maxLength}`;
    });
  });
}

/* ------------------------------------------------------------ EXPORT */
/* ---- 5.7 Audit Trail & Activity History ---- */
function initAuditTrail(containerId, events) {
  /* events = [{ actor, role, action, detail, date }] */
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!events || !events.length) {
    el.innerHTML = `<div class="text-muted text-center py-3" style="font-size:.82rem">
      <i class="fa-solid fa-clock-rotate-left me-1"></i>ยังไม่มีประวัติการดำเนินการ</div>`;
    return;
  }
  el.innerHTML = `<ul class="list-unstyled mb-0">` + events.map((e, i) => `
    <li class="d-flex gap-3 py-2 ${i < events.length-1 ? 'border-bottom' : ''}">
      <div style="flex:0 0 32px;height:32px;border-radius:50%;background:var(--ecmis-navy);
           color:#fff;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;margin-top:2px">
        ${(e.actor||'?')[0]}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:.85rem"><strong>${e.actor||'ระบบ'}</strong>
          <span class="text-muted" style="font-size:.75rem"> · ${e.role||''}</span>
        </div>
        <div style="font-size:.82rem;margin:.1rem 0">${e.action||''}</div>
        ${e.detail ? `<div style="font-size:.76rem;color:var(--ecmis-muted)">${e.detail}</div>` : ''}
        <div style="font-size:.72rem;color:var(--ecmis-muted);margin-top:.15rem">
          <i class="fa-regular fa-clock me-1"></i>${e.date||''}
        </div>
      </div>
    </li>`).join('') + `</ul>`;
}

/* ---- 5.4 Checklist with Gatekeeper ---- */
function initChecklistGatekeeper(checklistId, nextBtnId) {
  const checklist = document.getElementById(checklistId);
  const nextBtn   = document.getElementById(nextBtnId);
  if (!checklist || !nextBtn) return;

  function updateGate() {
    const boxes  = checklist.querySelectorAll('input[type="checkbox"]');
    const allDone = Array.from(boxes).every(cb => cb.checked);
    nextBtn.disabled = !allDone;
    nextBtn.title = allDone ? '' : 'กรุณาติ๊กรายการตรวจสอบให้ครบก่อน';
    if (allDone) nextBtn.classList.add('btn-save-pulse');
    else nextBtn.classList.remove('btn-save-pulse');
  }

  checklist.addEventListener('change', updateGate);
  updateGate();
}

/* ---- 3.3 Bulk Actions ---- */
function initBulkActions(tableId, toolbarId, onAction) {
  const table   = document.getElementById(tableId);
  const toolbar = document.getElementById(toolbarId);
  if (!table || !toolbar) return;

  function getChecked() {
    return Array.from(table.querySelectorAll('tbody input[type="checkbox"]:checked'));
  }
  function refreshToolbar() {
    const checked = getChecked();
    toolbar.classList.toggle('show', checked.length > 0);
    const countEl = toolbar.querySelector('.bulk-count');
    if (countEl) countEl.textContent = `เลือก ${checked.length} รายการ`;
  }

  table.addEventListener('change', e => {
    if (e.target.type === 'checkbox') refreshToolbar();
  });
  const selectAll = table.querySelector('thead input[type="checkbox"]');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      table.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
        cb.checked = selectAll.checked;
      });
      refreshToolbar();
    });
  }
  toolbar.querySelectorAll('[data-bulk-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.bulkAction;
      const rows   = getChecked().map(cb => cb.closest('tr'));
      if (typeof onAction === 'function') onAction(action, rows);
    });
  });
}

/* ---- 4.1 Drag & Drop Upload ---- */
function initDragDropUpload(zoneId, fileListId, allowedTypes, maxMB) {
  const zone     = document.getElementById(zoneId);
  const fileList = document.getElementById(fileListId);
  if (!zone || !fileList) return;
  const MB = (maxMB || 10) * 1024 * 1024;

  function renderFile(file) {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center gap-2 p-2 border rounded mb-2';
    row.style.fontSize = '0.82rem';
    row.innerHTML = `
      <i class="fa-regular fa-file-lines text-muted"></i>
      <span class="flex-grow-1">${file.name} <span class="text-muted">(${(file.size/1024).toFixed(0)} KB)</span></span>
      <div class="upload-progress-bar flex-grow-1" style="max-width:120px">
        <div class="upload-progress-fill" style="width:0%"></div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 remove-file-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    fileList.appendChild(row);
    row.querySelector('.remove-file-btn').addEventListener('click', () => row.remove());
    /* Simulate progress */
    const fill = row.querySelector('.upload-progress-fill');
    let pct = 0;
    const iv = setInterval(() => {
      pct = Math.min(pct + 10 + Math.random() * 15, 100);
      fill.style.width = pct + '%';
      if (pct >= 100) { clearInterval(iv); fill.style.background = 'var(--ecmis-ok)'; }
    }, 120);
  }

  function handleFiles(files) {
    Array.from(files).forEach(f => {
      if (f.size > MB) { toastWarn(`ไฟล์ "${f.name}" มีขนาดเกิน ${maxMB || 10} MB`); return; }
      if (allowedTypes && !allowedTypes.some(t => f.name.toLowerCase().endsWith(t))) {
        toastWarn(`ไฟล์ "${f.name}" ไม่ใช่ประเภทที่รองรับ`); return;
      }
      renderFile(f);
    });
    toastOk(`เพิ่มไฟล์ ${files.length} รายการแล้ว`);
  }

  zone.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.onchange = () => handleFiles(inp.files);
    inp.click();
  });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
}

/* ---- Doc Pane Layout Toggle (Show/Hide Document Split View) ---- */
function initDocPaneToggle() {
  if (typeof document === 'undefined') return;

  const runToggleInit = () => {
    const docPane = document.querySelector('.doc-pane');
    if (!docPane) return;

    const docCol = docPane.closest('[class*="col-xl-"], [class*="col-lg-"], [class*="col-md-"]');
    if (!docCol) return;

    const formCol = docCol.previousElementSibling;
    if (!formCol) return;

    if (formCol.dataset.toggleInited === '1') return;
    formCol.dataset.toggleInited = '1';

    const origClass = formCol.className;
    formCol.dataset.origClass = origClass;

    let isHidden = false;

    function setDocVisibility(hide) {
      isHidden = hide;
      if (isHidden) {
        docCol.classList.add('d-none');
        formCol.className = origClass.replace(/col-(xl|lg|md)-\d+/g, 'col-12 col-xl-12 col-lg-12');
      } else {
        docCol.classList.remove('d-none');
        formCol.className = origClass;
      }
      updateButtons();
    }

    function updateButtons() {
      document.querySelectorAll('.btn-doc-toggle').forEach(btn => {
        if (isHidden) {
          btn.innerHTML = '<i class="fa-solid fa-eye me-1"></i>แสดงเอกสาร';
          btn.classList.remove('btn-outline-secondary', 'btn-light');
          btn.classList.add('btn-navy');
        } else {
          btn.innerHTML = '<i class="fa-solid fa-eye-slash me-1"></i>ซ่อนเอกสาร';
          btn.classList.remove('btn-navy');
          if (btn.classList.contains('btn-doc-toggle-toolbar')) {
            btn.classList.add('btn-light');
          } else {
            btn.classList.add('btn-outline-secondary');
          }
        }
      });
    }

    // Inject button into page-head only
    const pageHeadTarget = document.querySelector('.page-head .ms-auto') || document.querySelector('.page-head');
    if (pageHeadTarget && !document.querySelector('.btn-doc-toggle-header')) {
      const headBtn = document.createElement('button');
      headBtn.type = 'button';
      headBtn.className = 'btn btn-sm btn-outline-secondary btn-doc-toggle btn-doc-toggle-header ms-2 no-print';
      headBtn.title = 'ซ่อน/แสดง เลย์เอาต์เอกสารฝั่งขวา';
      headBtn.innerHTML = '<i class="fa-solid fa-eye-slash me-1"></i>ซ่อนเอกสาร';
      headBtn.addEventListener('click', () => setDocVisibility(!isHidden));
      pageHeadTarget.appendChild(headBtn);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runToggleInit);
  } else {
    runToggleInit();
  }
  setTimeout(runToggleInit, 100);
}

global.ECMIS = {
  ROLES, STATUS, STATUS_STEP, FLOW_STEPS, APPROVAL_CHAIN,
  CASES, RETURN_REASONS, RESOLUTIONS,
  DOC_TYPES, SIGN_PHASE, secgenSlaLimit, FORWARD_TARGETS, forwardTarget,
  OPINION_TYPES, chainDivergence, g1Triggers, M28, M28_ORDERS, m28Order, m28Pending,
  TRANSITIONS, canTransition, nextStates, transitionsBetween,
  BOARD_MIN_IN_OFFICE, boardQuorum,
  M24P1_MIN_PANEL, M24P1_STAFF_FREE, panelComposition,
  CONFIG, RETURN_SCOPES, MATERIAL_FIELDS, daysUntil,
  UPSTREAM_CHAIN, isUpstreamRole, isUpstreamCase,
  PERM_DEFS, can, canEditMaster, canViewCase,
  thaiDate, toThaiDigits, slaClass, slaLabel, effectiveSlaLimit, getCase, getRole, roleIdForLogin,
  currentRoleId, currentRole, setRole, inboxFor, canAct, canRecall,
  renderShell, stepperHtml, statusBadge, slaBadge, actionBar,
  mergeField, confirmAction, toastOk, toastWarn, signDialog, sequentialSignDialog,

  // Custom helpers
  saveCases, toggleDarkMode, toggleHighContrast, toggleSidebarCollapse, changeFont,
  initSmartCombobox, initRealTimeValidation, initVoiceInput, initSignaturePad,
  initAutoSave, initCharCounterAndCopy,

  // New UX helpers
  initAuditTrail, initChecklistGatekeeper, initBulkActions, initDragDropUpload,
  initDocPaneToggle
};

})(window);


