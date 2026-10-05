/* ECMIS — เติมข้อมูลตัวอย่าง "สำนวน 0005/2569" ทุกหน้า (โหมดสาธิต)

   สวิตช์ในเมนูโปรไฟล์ (ทุกบทบาท) แบบเดียวกับ "จำลองผลจากกิจกรรมที่ 7"
   เก็บใน localStorage คีย์ ecmis_demo_case ("1" = เปิด; ไม่มีคีย์ = ปิด)

   เมื่อเปิด: เติมเฉพาะช่องที่ "มองเห็นและยังว่าง" — ไม่ทับค่าที่ผู้ใช้กรอก
     · ช่องในหน้า, ฟอร์มที่สร้างด้วย JS และป๊อปอัป (เฝ้าด้วย MutationObserver)
     · dropdown ที่ยังไม่เลือก → ตัวเลือกจริงตัวแรก (ข้าม "-- เลือก --" / อื่นๆ)
     · ช่องแนบไฟล์ → ไฟล์ PDF จำลอง เพื่อให้ผ่านการตรวจไฟล์บังคับ
     · หน้า 02 รับเรื่อง → ค้นหาและเลือกสำนวน 0005/2569 ให้อัตโนมัติ
   ปิดสวิตช์ = หยุดเติม (ค่าที่เติมไปแล้วคงอยู่)

   ข้อมูลที่เกี่ยวข้อง (สมมติ เพื่อสาธิตเท่านั้น):
     10.1   สำนวน 0005/2569 ผ่านอัยการ → ความเห็นแย้ง
     10.2   นายสมชาย ขอเปิดเผยรายงานผลการตรวจสอบข้อเท็จจริงของสำนวน แล้วอุทธรณ์
     10.3   นายสมศักดิ์ ฟ้อง สำนักงาน ป.ป.ท. ต่อศาลปกครองกลาง ขอเพิกถอนมติในสำนวน

   ตัวช่วยล้วน (ไม่แตะ DOM) ส่งออกที่ ECMIS_DEMO_HELPERS เพื่อทดสอบ:
     tests/demo-case.test.mjs
   DB: ไม่เปลี่ยนสคีมา / ไม่แก้ข้อมูลสำนวนเดิม */
(function (global) {
  "use strict";

  const SWITCH_KEY = "ecmis_demo_case";
  const INTAKE_PAGE = "02-board-intake.html";

  /* ------------------------------------------------------------ CASE DATA */
  const CASE = {
    id: "สำนวน-0005/2569",
    no: "0005/2569",
    complainant: "นายสมชาย รักความยุติธรรม",
    accused: "นายสมศักดิ์ หาผลประโยชน์",
    accusedPosition: "ผู้อำนวยการสถานศึกษา",
    subject:
      "เรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครองโดยไม่ออกใบเสร็จ และนำเงินเข้ากองทุนส่วนตัว เพื่อแลกกับสิทธิ์ในการรับนักเรียนเข้าศึกษาต่อ",
    section: "18/1 ก",
    prosecutorUnit: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
    crimCourt: "ศาลอาญาคดีทุจริตและประพฤติมิชอบกลาง",
    adminCourt: "ศาลปกครองกลาง",
    email: "somchai.r@example.com",
    phone: "0 2142 3584",
  };

  const NO = {
    lawReceive: "0021/2569",
    centralSaraban: "2569/4521",
    saraban: "สบ.0035/2569",
    prosecutorDoc: "อส 0019.1/0458",
    dispatch: "2569/0475",
    internalDoc: "กกม. 0475/2569",
    externalDoc: "ปท 0012/1458",
    ems: "EM123456785TH",
    crimBlack: "อท. 112/2569",
    crimRed: "อท. 309/2569",
    adminBlack: "บ. 145/2569",
    adminRed: "บ. 211/2570",
    caseReg: "ทบ.ปค. 0123/2569",
    courtOrder: "คส. 45/2569",
    meeting: "9/2569",
    agenda: "4.2",
  };

  const TEXT = {
    shortSubject: "กรณีเรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครอง (สำนวน 0005/2569)",
    summary:
      "นายสมชาย รักความยุติธรรม ร้องเรียนว่า นายสมศักดิ์ หาผลประโยชน์ เรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครองนักเรียนโดยไม่ออกใบเสร็จรับเงิน และนำเงินเข้ากองทุนส่วนตัว เพื่อแลกกับสิทธิ์ในการรับนักเรียนเข้าศึกษาต่อ (มาตรา 18/1 ก)",
    opinion:
      "พิจารณาแล้ว กรณีนายสมศักดิ์ หาผลประโยชน์ เรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครองโดยไม่ออกใบเสร็จ (สำนวน 0005/2569 มาตรา 18/1 ก) ข้อเท็จจริงและพยานหลักฐานรับฟังได้ เห็นควรดำเนินการตามที่เสนอ",
    order:
      "มอบหมายดำเนินการสำนวน 0005/2569 ตรวจสอบพยานหลักฐานให้ครบถ้วน และรายงานผลภายในกำหนด",
    note: "สำนวน 0005/2569 — เอกสารครบถ้วน ดำเนินการตามขั้นตอนต่อไป",
    disclosure:
      "ขอเปิดเผยรายงานผลการตรวจสอบข้อเท็จจริง สำนวน 0005/2569 กรณีเรียกรับเงิน “แป๊ะเจี๊ยะ”",
    requestedInfo:
      "สำเนารายงานผลการตรวจสอบข้อเท็จจริงและมติที่เกี่ยวข้องกับสำนวน 0005/2569 (เฉพาะส่วนที่ไม่กระทบสิทธิบุคคลอื่น)",
    suit:
      "นายสมศักดิ์ หาผลประโยชน์ ฟ้องสำนักงาน ป.ป.ท. ขอให้เพิกถอนมติคณะกรรมการ ป.ป.ท. ในสำนวน 0005/2569",
    verdict:
      "ศาลพิพากษายกฟ้อง เนื่องจากมติคณะกรรมการ ป.ป.ท. ในสำนวน 0005/2569 ชอบด้วยกฎหมาย",
    offenseBasis:
      "เจ้าพนักงานปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยมิชอบ เรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครอง",
    address:
      "สำนักงานคดีปกครองกลาง ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210",
    venue: "ห้องประชุม 1 ชั้น 28 สำนักงาน ป.ป.ท.",
    division: "กองกฎหมาย สำนักงาน ป.ป.ท.",
    officer: "นายณัฐพล บัวทุม",
    postOffice: "ไปรษณีย์หลักสี่",
  };

  /* ------------------------------------------------------------ HELPERS */
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /* วันที่ ISO (เวลาท้องถิ่น) บวกวัน/ปี จาก today — ช่อง type=date เก็บ ISO เสมอ */
  function isoDate(today, addDays, addYears) {
    const d = new Date(today.getFullYear() + (addYears || 0), today.getMonth(), today.getDate() + (addDays || 0));
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  /* id แบบมีลำดับท้าย (in_offenseLaw_0, in_offenseLaw_2) → ฐานเดียวกัน */
  function baseId(id) {
    return String(id || "").replace(/_\d+$/, "_");
  }

  const EXCLUDE_ID =
    /search|filter|login|password|otp|cmdpalette|quicktrack|viewselect|regq|originblackno|^swal-/i;
  const SKIP_TYPES = /^(hidden|checkbox|radio|submit|button|reset|range|color|image)$/;

  /* field = { id, name, tag, type, label, page } — คืน true ถ้าห้ามเติม */
  function isExcluded(field) {
    const key = field.id || field.name || "";
    if (EXCLUDE_ID.test(key)) return true;
    if (field.tag === "input" && SKIP_TYPES.test(field.type || "text")) return true;
    if (field.type === "search") return true;
    return false;
  }

  /* ค่าตายตัวรายช่อง (id ตรงตัว หรือฐาน id ที่ลงท้าย "_") */
  const EXACT = {
    /* 10.1 รับเรื่อง (หน้า 02) */
    f_caseId: CASE.no,
    f_blackNo: "-",
    f_subject: CASE.subject,
    f_complainant: CASE.complainant,
    f_accused: CASE.accused,
    f_lawReceiveNo: NO.lawReceive,
    in_title: CASE.subject,
    in_source: CASE.prosecutorUnit,
    in_docNo: "2569/0458", /* หน้า 02 จัดรูปแบบ ปี/เลข อัตโนมัติ (autoFormatYearSlashNo) */
    in_summary: TEXT.summary,
    in_legalOpinion: TEXT.opinion,
    in_fiscalYear: "2569",
    in_relatedCaseNo: CASE.no,
    in_relatedRequestNo: CASE.no,
    in_crimBlackNo: NO.crimBlack,
    in_crimRedNo: NO.crimRed,
    in_crimCourtName: CASE.crimCourt,
    in_crimStatuteLimitation: "15 ปี นับแต่วันกระทำความผิด",
    in_receivingUnit: TEXT.division,
    in_appellantAgency: "-",
    in_causeOfSuit: TEXT.suit,
    /* 10.2 คำขอเปิดเผยข้อมูล / อุทธรณ์ */
    in_disclosureTitle: TEXT.disclosure,
    in_requestedInfo: TEXT.requestedInfo,
    in_requesterName: CASE.complainant,
    in_appellantName: CASE.complainant,
    in_noticeRecipient: CASE.complainant,
    in_addressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
    in_dataOwner: "สำนักบริหารคดี (เจ้าของสำนวน 0005/2569)",
    in_background: TEXT.summary,
    in_legalBasis:
      "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบที่เกี่ยวข้อง",
    in_considerations: TEXT.opinion,
    in_resolutionFacts: TEXT.summary,
    in_resolutionDetail:
      "ที่ประชุมมีมติให้เปิดเผยรายงานผลการตรวจสอบข้อเท็จจริง สำนวน 0005/2569 บางส่วน โดยปกปิดข้อมูลส่วนบุคคลของพยาน",
    in_resolutionOther: "เปิดเผยบางส่วน",
    in_committeeOpinion: TEXT.opinion,
    in_reason:
      "ข้อมูลบางส่วนเป็นข้อมูลส่วนบุคคลของพยาน ซึ่งหากเปิดเผยอาจกระทบสิทธิบุคคลอื่น",
    in_meetingNo: NO.meeting,
    in_agendaNo: NO.agenda,
    in_meetingVenue: TEXT.venue,
    in_divisionName: TEXT.division,
    in_divisionPhone: CASE.phone,
    in_subject: TEXT.disclosure,
    in_appealBoardReplyDocNo: "ปป 0002/5312",
    /* 10.3 คดีปกครอง */
    in_blackCaseNo: NO.adminBlack,
    e_blackCaseNo: NO.adminBlack,
    in_courtSarabanNo: NO.saraban,
    e_courtSarabanNo: NO.saraban,
    in_centralSarabanNo: NO.centralSaraban,
    in_lawReceiveNo: NO.lawReceive,
    in_caseRegNo: NO.caseReg,
    in_verdictRegNo: NO.caseReg,
    in_verdictNoticeNo: "อส 0027.3/1234",
    in_orderNo: NO.courtOrder,
    in_courtDeadlineDays: "30",
    e_courtDeadlineDays: "30",
    e_plaintiffs: CASE.accused,
    e_defendants: "สำนักงาน ป.ป.ท.",
    in_handLocation: CASE.adminCourt,
    in_destination: "สำนักงานคดีปกครองกลาง",
    in_postAddress: TEXT.address,
    in_postOffice: TEXT.postOffice,
    in_emsPostOffice: TEXT.postOffice,
    in_postFee: "65",
    in_receiverName: "นางสาวพรทิพย์ ใจดี",
    in_handRecipient: "นางสาวพรทิพย์ ใจดี (เจ้าหน้าที่สารบรรณ สำนักงานอัยการสูงสุด)",
    in_emsRecipientLabel: "สำนักงานอัยการสูงสุด",
    in_prosecutorAckNo: "อส 0027(ชม)/1234",
    in_verdictSummary: TEXT.verdict,
    in_verdictIssues: TEXT.suit,
    in_closeAction: "ไม่มีการชดใช้ค่าเสียหาย",
    /* 10.1 ความเห็นแย้ง → ผลคดี */
    in_finalDocSubject: "ความเห็นแย้ง " + TEXT.shortSubject,
    in_officialDocHeading: "ความเห็นแย้ง " + TEXT.shortSubject,
    in_finalDocSummary: TEXT.opinion,
    in_legalOpinionDraft: TEXT.opinion,
    in_oagReceiveDocNo: "อส 0001/4588",
    in_oagVerdictNo: "อส 0001/6789",
    in_oagVerdictSummary:
      "อัยการสูงสุดชี้ขาดให้ฟ้องนายสมศักดิ์ หาผลประโยชน์ ตามความเห็นแย้งของสำนักงาน ป.ป.ท.",
    in_notifySubject: "แจ้งผลคดี " + TEXT.shortSubject,
    in_notifyTarget: "กองบริหารคดี สำนักงาน ป.ป.ท.",
    in_prosecutorResultNo: "อส 0025/1290",
    in_prosecutorResultSummary:
      "ศาลพิพากษาลงโทษนายสมศักดิ์ หาผลประโยชน์ ฐานเรียกรับเงิน “แป๊ะเจี๊ยะ” จากผู้ปกครอง",
    in_directorAction: "รับทราบผลมติ และมอบหมายดำเนินการต่อ",
    in_groupDirectorAction: "รับทราบผลมติ และมอบหมายนิติกรดำเนินการต่อ",
    in_opinionOtherSpecify: "ขอเอกสารพยานหลักฐานเพิ่มเติม",
    /* ฐานความผิด (ecmis-offense-basis.js) */
    in_offenseSection_: "157",
    in_offenseBasis_: TEXT.offenseBasis,
    /* ป๊อปอัปบันทึกผลแทนกิจกรรมที่ 7 — หนังสือแจ้งมติออกโดย ป.ป.ท. */
    act7_noticeNo: NO.externalDoc,
    /* ป๊อปอัปผลศาลสูงสุด (10.3) / วิเคราะห์คำพิพากษา (10.1) */
    l3sr_black: "อ. 12/2570",
    l3sr_red: "อ. 45/2570",
    l3sr_summary: TEXT.verdict,
    ja_issue: TEXT.suit,
    jd_summary: TEXT.verdict,
  };

  /* กฎตามคำใน id (เรียงจากเจาะจง → กว้าง) สำหรับช่องที่ไม่มีใน EXACT */
  /* กฎเลขที่ต่าง ๆ ยึดท้าย id ("No$") — ไม่ให้ in_dispatchNotes / in_receiveNotes ถูกนับเป็นเลขที่ */
  const TEXT_RULES = [
    [/^in_ems|ems(trackingno)?$|tracking/i, NO.ems],
    [/phone|tel$/i, CASE.phone],
    [/email/i, CASE.email],
    [/externaldocno$/i, NO.externalDoc],
    [/(internaldocno|notifydocno|finaldispatchno)$/i, NO.internalDoc],
    [/dispatchno$/i, NO.dispatch],
    [/receiveno$/i, NO.lawReceive],
    [/saraban/i, NO.saraban],
    [/(docno|ackno|resultno|verdictno|noticeno)$/i, NO.prosecutorDoc],
    [/(blackno|blackcaseno)$/i, NO.adminBlack],
    [/regno$/i, NO.caseReg],
    [/orderno$/i, NO.courtOrder],
    [/meetingno$/i, NO.meeting],
    [/agendano$/i, NO.agenda],
    [/venue|location/i, TEXT.venue],
    [/address/i, TEXT.address],
    [/postoffice/i, TEXT.postOffice],
    [/appellant|requester|complainant|accuser|recipient|addressedto/i, CASE.complainant],
    [/accused|plaintiff/i, CASE.accused],
    [/defendant/i, "สำนักงาน ป.ป.ท."],
    [/subject|title|heading/i, TEXT.shortSubject],
    [/summary|facts|background|cause/i, TEXT.summary],
    [/opinion|comment|verify|consideration|legalbasis|legalissues|reason|issues/i, TEXT.opinion],
    [/order|assign|action|director|instruction|chairman/i, TEXT.order],
    [/court/i, CASE.adminCourt],
    [/officer|proposer|name/i, TEXT.officer],
    [/section/i, CASE.section],
    [/notes?$|remark|text|detail|other/i, TEXT.note],
  ];

  function hasExact(id) {
    return !!id && (EXACT[id] !== undefined || EXACT[baseId(id)] !== undefined);
  }

  /* ค่า "หมายเลขคดีแดง" มีเฉพาะหน้าที่ศาลตัดสินแล้ว (10.3v / ผลคำพิพากษา) */
  function isVerdictPage(page) {
    return /10-3v-|verdict|judg/i.test(page || "");
  }

  function dateValueFor(key, today) {
    if (/prescription/i.test(key)) return isoDate(today, 0, 15);
    if (/due|deadline/i.test(key)) return isoDate(today, 30);
    if (/appointment/i.test(key)) return isoDate(today, 7);
    return isoDate(today, 0);
  }

  function numberValueFor(key) {
    if (/fiscalyear/i.test(key)) return "2569";
    if (/days/i.test(key)) return "30";
    if (/fee/i.test(key)) return "65";
    return "1";
  }

  /* field = { id, name, tag, type, label, page } → ค่า (string) หรือ null = ไม่เติม */
  function valueFor(field, today) {
    if (isExcluded(field)) return null;
    const key = field.id || field.name || "";
    const type = field.tag === "textarea" ? "textarea" : field.type || "text";
    if (type === "date") return dateValueFor(key, today || new Date());
    if (type === "time") return "10:30";
    if (type === "number") return numberValueFor(key);
    if (type === "email") return CASE.email;
    if (type === "tel") return CASE.phone;

    if (/(redno|redcaseno)$/i.test(key)) {
      if (/crim/i.test(key)) return NO.crimRed;
      return isVerdictPage(field.page) ? NO.adminRed : null;
    }
    if (hasExact(key)) return EXACT[key] !== undefined ? EXACT[key] : EXACT[baseId(key)];
    for (let i = 0; i < TEXT_RULES.length; i++) {
      if (TEXT_RULES[i][0].test(key)) return TEXT_RULES[i][1];
    }
    return type === "textarea" ? TEXT.note : CASE.no;
  }

  /* options = [{ value, text, disabled }] → value ของตัวเลือกจริงตัวแรก หรือ null
     prefer = ข้อความที่อยากได้ก่อน (เช่น ศาลปกครองกลาง) */
  const SELECT_PREFER = {
    in_courtName: CASE.adminCourt,
    e_courtName: CASE.adminCourt,
    in_courtNameForm: CASE.adminCourt,
  };
  function pickOption(options, id) {
    const real = (options || []).filter(function (o) {
      const text = String(o.text || "").trim();
      return !o.disabled && String(o.value) !== "" && !/^-+|^(อื่น|other)/i.test(text);
    });
    const prefer = SELECT_PREFER[id];
    const hit = prefer && real.find(function (o) { return String(o.text).indexOf(prefer) >= 0; });
    if (hit) return hit.value;
    return real.length ? real[0].value : null;
  }

  /* ชื่อไฟล์จำลองตามความหมายของช่องแนบไฟล์ */
  const FILE_RULES = [
    [/ems|receipt/i, "ใบรับฝากEMS"],
    [/memo/i, "บันทึกข้อความ"],
    [/notice|notify/i, "หนังสือแจ้ง"],
    [/opinion|answer/i, "ความเห็น"],
    [/verdict|ruling|result/i, "คำวินิจฉัย"],
    [/letter|urgent/i, "หนังสือนำส่ง"],
    [/appeal/i, "คำอุทธรณ์"],
    [/evidence/i, "พยานหลักฐาน"],
    [/draft/i, "ร่างเอกสาร"],
  ];
  function fileNameFor(field) {
    const key = (field.id || field.name || "") + " " + (field.label || "");
    for (let i = 0; i < FILE_RULES.length; i++) {
      if (FILE_RULES[i][0].test(key)) return FILE_RULES[i][1] + "_สำนวน_0005-2569.pdf";
    }
    return "เอกสารประกอบ_สำนวน_0005-2569.pdf";
  }

  global.ECMIS_DEMO_HELPERS = {
    CASE: CASE,
    NO: NO,
    TEXT: TEXT,
    isoDate: isoDate,
    isExcluded: isExcluded,
    hasExact: hasExact,
    valueFor: valueFor,
    pickOption: pickOption,
    fileNameFor: fileNameFor,
  };

  /* ------------------------------------------------------------ SWITCH */
  const ECMIS_DEMO = {
    KEY: SWITCH_KEY,
    isOn: function () {
      try {
        return global.localStorage.getItem(SWITCH_KEY) === "1";
      } catch (e) {
        return false; /* private mode / ถูกบล็อก → ค่าตั้งต้น OFF */
      }
    },
    setOn: function (on) {
      try {
        global.localStorage.setItem(SWITCH_KEY, on ? "1" : "0");
      } catch (e) { /* จำค่าไม่ได้ ใช้ค่าตั้งต้นต่อไป */ }
      try {
        global.document.dispatchEvent(new global.CustomEvent("ecmis-demo-change", { detail: { on: !!on } }));
      } catch (e) { /* ไม่มี DOM */ }
    },
  };
  global.ECMIS_DEMO = ECMIS_DEMO;

  /* ไม่มี DOM (เช่นรันใน node test) → ส่งออกเฉพาะตัวช่วย */
  if (!global.document || typeof global.MutationObserver !== "function") return;
  const document = global.document;

  /* ------------------------------------------------------------ DOM FILL */
  function currentPage() {
    const path = String(global.location && global.location.pathname || "");
    return decodeURIComponent(path.split("/").pop() || "");
  }

  function isVisible(el) {
    return !!el && el.getClientRects().length > 0;
  }

  function labelText(el) {
    if (el.id) {
      const lab = document.querySelector('label[for="' + el.id + '"]');
      if (lab) return lab.textContent.trim();
    }
    const group = el.closest(".form-group, .mb-3, .col, [class*='col-']");
    const lab = group && group.querySelector("label");
    return lab ? lab.textContent.trim() : "";
  }

  function describe(el) {
    return {
      id: el.id || "",
      name: el.getAttribute("name") || "",
      tag: el.tagName.toLowerCase(),
      type: (el.getAttribute("type") || "").toLowerCase(),
      label: labelText(el),
      page: currentPage(),
    };
  }

  /* ตั้งค่าผ่าน native setter แล้วยิง input+change ให้ oninput/onchange เดิมของหน้าทำงาน */
  function setValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const PDF_BYTES = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
  /* ช่องไฟล์ที่เติมแล้วในหน้านี้ — กันวนซ้ำเมื่อ handler ล้าง input หรือวาดใหม่หลังรับไฟล์ */
  const filledFileKeys = new Set();

  function fillFile(el) {
    if (el.disabled || (el.files && el.files.length)) return;
    if (!isVisible(el) && !isVisible(el.parentElement)) return;
    const field = describe(el);
    const key = field.id || field.name || field.label || "file";
    if (filledFileKeys.has(key)) return;
    filledFileKeys.add(key);
    try {
      const dt = new DataTransfer();
      dt.items.add(new File([PDF_BYTES], fileNameFor(field), { type: "application/pdf" }));
      el.files = dt.files;
      el.dataset.demoFilled = "1";
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (e) { /* เบราว์เซอร์ไม่รองรับ DataTransfer → ข้ามช่องนี้ */ }
  }

  function fillSelect(el) {
    if (el.value !== "") return;
    const value = pickOption(
      Array.from(el.options).map(function (o) {
        return { value: o.value, text: o.textContent, disabled: o.disabled };
      }),
      el.id,
    );
    if (value === null) return;
    el.dataset.demoFilled = "1";
    setValue(el, value);
  }

  /* ค่าตัวอย่างที่ฝังมากับ HTML (value="..." ยังไม่ถูกแก้) ไม่ใช่ของสำนวนนี้ → แทนได้เฉพาะช่องที่มีค่าเจาะจงใน EXACT
     ค่าที่ผู้ใช้พิมพ์หรือหน้าโหลดจากสำนวน (value ≠ defaultValue) ไม่ถูกแตะ */
  function isPristineSample(el) {
    return el.defaultValue !== "" && el.value === el.defaultValue && hasExact(el.id);
  }

  function fillText(el) {
    if (String(el.value || "").trim() !== "" && !isPristineSample(el)) return;
    const value = valueFor(describe(el), new Date());
    if (value === null || value === undefined) return;
    el.dataset.demoFilled = "1";
    setValue(el, value);
  }

  const SKIP_AREA = ".topbar, .sidebar, #profileDropdown, #notifDropdown, [data-demo-skip]";

  function fillableFields() {
    return Array.from(document.querySelectorAll("input, textarea, select")).filter(function (el) {
      if (el.dataset.demoFilled || el.disabled || el.readOnly) return false;
      if (el.closest(SKIP_AREA)) return false;
      if (el.type === "file") return true;
      return isVisible(el) && !isExcluded(describe(el));
    });
  }

  /* เติม select ก่อน (อาจเปิดส่วนฟอร์มใหม่) แล้วจึงข้อความ/วันที่/ไฟล์ */
  function fillAll() {
    const fields = fillableFields();
    fields.filter(function (el) { return el.tagName === "SELECT"; }).forEach(fillSelect);
    fields.forEach(function (el) {
      if (el.tagName === "SELECT") return;
      if (el.type === "file") fillFile(el);
      else fillText(el);
    });
  }

  /* หน้า 02: ค้นหาและเลือกสำนวน 0005/2569 ครั้งเดียวต่อการเปิดหน้า */
  let intakePrepared = false;
  function prepareIntake() {
    if (intakePrepared || currentPage() !== INTAKE_PAGE) return;
    if (typeof global.selectIntakeCase !== "function") return;
    intakePrepared = true;
    const search = document.getElementById("intakeSearchInput");
    if (search && !search.value) search.value = CASE.no;
    if (typeof global.executeIntakeSearch === "function") {
      try { global.executeIntakeSearch(); } catch (e) { /* แสดงผลค้นหาไม่ได้ก็เลือกสำนวนต่อ */ }
    }
    global.selectIntakeCase(CASE.id);
    /* selectIntakeCase ใส่ "สำนักงาน ป.ป.ท." เมื่อสำนวนไม่มีต้นทาง → ใช้สำนักงานอัยการแทน */
    const source = document.getElementById("in_source");
    if (source && source.value === "สำนักงาน ป.ป.ท.") setValue(source, CASE.prosecutorUnit);
  }

  let filling = false;
  let timer = null;
  function run() {
    if (!ECMIS_DEMO.isOn() || filling) return;
    filling = true;
    try {
      prepareIntake();
      fillAll();
    } catch (e) {
      if (global.console) global.console.warn("[ECMIS demo] เติมข้อมูลตัวอย่างไม่สำเร็จ", e);
    } finally {
      filling = false;
    }
  }
  function schedule() {
    if (!ECMIS_DEMO.isOn()) return;
    clearTimeout(timer);
    timer = setTimeout(run, 200);
  }

  /* ------------------------------------------------------------ SWITCH UI */
  function renderDemoSwitch() {
    const body = document.querySelector("#profileDropdown .profile-dropdown-body");
    if (!body) return;
    let box = document.getElementById("demoCaseSwitchBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "demoCaseSwitchBox";
      box.style.cssText = "margin-top:10px;padding:8px 10px;border:1px dashed #94a3b8;border-radius:8px;font-size:0.85em";
      box.innerHTML = '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-weight:600">'
        + '<input type="checkbox" id="demoCaseSwitchInput" style="width:auto;margin:0" />'
        + "<span>เติมข้อมูลตัวอย่าง (สำนวน 0005/2569)</span></label>"
        + '<div style="margin-top:4px;color:#64748b;font-size:0.9em">เปิด = กรอกช่องที่ว่างในทุกหน้าด้วยข้อมูลสำนวนตัวอย่าง (ไม่ทับค่าที่กรอกแล้ว)</div>';
      const note = body.querySelector(".profile-note");
      body.insertBefore(box, note || null);
      box.querySelector("input").addEventListener("change", function (e) {
        ECMIS_DEMO.setOn(e.target.checked);
      });
    }
    box.querySelector("input").checked = ECMIS_DEMO.isOn();
  }
  global.renderDemoSwitch = renderDemoSwitch;

  document.addEventListener("ecmis-demo-change", function (e) {
    renderDemoSwitch();
    if (e.detail && e.detail.on) run();
  });

  function start() {
    renderDemoSwitch();
    new global.MutationObserver(function () {
      if (!filling) schedule();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });
    /* รอให้สคริปต์ของหน้าเติมค่าจากสำนวนก่อน แล้วจึงเติมช่องที่ยังว่าง */
    setTimeout(run, 400);
  }

  if (document.readyState === "complete") start();
  else global.addEventListener("load", start);
})(window);
