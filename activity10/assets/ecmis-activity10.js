/**
 * E-CMIS Activity 10: Production-Grade Legal System Engine & Data Store
 * Project: กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
 */

(function (global) {
  "use strict";

  // Data Version Key for LocalStorage Sync (v61: แก้ sample case คำร้อง-100041/2569
  // และ 100043-045/2569 ที่ statusCode ค้างอยู่ (L2_PENDING_APPEAL_BOARD_DISPATCH,
  // L2_APPEAL_BOARD_RESOLVED) กลายเป็นสถานะกำพร้าไม่มี route หลังตัด appeal-10/11
  // ออกจาก flow — ย้ายไปสถานะที่ยังใช้งานได้จริง (L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE,
  // L2_PENDING_APPEAL_NOTICE_DRAFT) พร้อมเติม l2AppealMemoInternalDocNo/
  // BoardReplyDocNo-Date/ResolutionNotes ให้ครบทุกเคสสาย appeal — ต้องขึ้นเวอร์ชัน
  // ให้ browser ที่มี localStorage เก่าอยู่แล้วโหลดข้อมูลชุดใหม่)
  const DATA_VERSION = "v63_fix_orphaned_appeal_agenda_status";
  const STORAGE_KEY = "ecmis_act10_cases_" + DATA_VERSION;

  function getDateWithOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
  }

  // Initial Cases in Legal Inbox (ตัวอย่างสำนวนที่ครอบคลุมทุกบทบาทในการทำงาน)
  const INITIAL_CASES = [
    {
      id: "คดี-100010/2569",
      title:
        "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตจัดซื้ออุปกรณ์ระบบสารสนเทศและกล้องวงจรปิด",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายพิชัย เทคโนโลยี",
      accusedPosition: "อดีตผู้อำนวยการสำนักสารสนเทศ",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายณัฐพล บัวทุม",
      officerPosition: "นิติกรชำนาญการพิเศษ",
      assignedRole: "admin_legal",
      status: "รอธุรการรับผลคำวินิจฉัย อสส.",
      statusCode: "PENDING_ADMIN_OAG_VERDICT_INTAKE",
      statusBadge: "bg-danger text-white",
      lawReceiveNo: "0028/2569",
      paccCaseNo: "0065/2568",
      blackNo: "อ. 150/2569",
      redNo: "อ. 420/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 12 มี.ค. 2585)",
      slaTotalDays: 15,
      slaDaysRemaining: 15,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(0),
      dueDate: getDateWithOffset(15),
      workflowStep: 19,
      docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
      docNo: "อส 0001/6789",
      centralSarabanNo: "2569/5102",
      finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      externalDispatchNo: "ที่ ปปท 0014/1150",
      dispatchMethod: "postal_ems",
      emsTrackingNo: "ED887711223TH",
      signedPresidentName:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1150.pdf",
    },
    {
      id: "คดี-100011/2569",
      title:
        "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตโครงการก่อสร้างระบบระบายน้ำชุมชน",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายเกรียงศักดิ์ โยธาการ",
      accusedPosition: "อดีตวิศวกรควบคุมงาน",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายนภัส สอนดี",
      officerPosition: "ผู้อำนวยการกองกฎหมาย",
      assignedRole: "dir_legal",
      status: "ผอ.กอง ตรวจสอบคำวินิจฉัย อสส. และ สั่งการ",
      statusCode: "PENDING_DIRECTOR_OAG_VERDICT_REVIEW",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "0029/2569",
      paccCaseNo: "0068/2568",
      blackNo: "อ. 155/2569",
      redNo: "อ. 428/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 18 เม.ย. 2585)",
      slaTotalDays: 15,
      slaDaysRemaining: 15,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(0),
      dueDate: getDateWithOffset(15),
      workflowStep: 20,
      docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
      docNo: "อส 0001/6801",
      centralSarabanNo: "2569/5115",
      externalDispatchNo: "ที่ ปปท 0014/1180",
      oagVerdictNo: "อส 0001/6801",
      oagVerdictDate: getDateWithOffset(0),
      oagVerdictReceiveDate: getDateWithOffset(0),
      oagVerdictDecision: "PROSECUTE",
      oagVerdictSummary:
        "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดให้ฟ้องคดีผู้ถูกกล่าวหาตามความเห็นแย้งของคณะกรรมการ ป.ป.ท.",
      oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6801.pdf",
    },
    {
      id: "คดี-100012/2569",
      title:
        "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตเงินอุดหนุนโครงการฝึกอาชีพเยาวชน",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นางสุมาลี ส่งเสริม",
      accusedPosition: "อดีตหัวหน้าฝ่ายพัฒนาชุมชน",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายอานนท์ ชินประชา",
      officerPosition: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      assignedRole: "group_director",
      status: "ผอ.กลุ่มงาน ตรวจสอบคำวินิจฉัย อสส. และ มอบหมายนิติกร",
      statusCode: "PENDING_GROUP_OAG_VERDICT_REVIEW",
      statusBadge: "bg-info text-dark",
      lawReceiveNo: "0030/2569",
      paccCaseNo: "0070/2568",
      blackNo: "อ. 160/2569",
      redNo: "อ. 435/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 2 พ.ค. 2585)",
      slaTotalDays: 15,
      slaDaysRemaining: 14,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-1),
      dueDate: getDateWithOffset(14),
      workflowStep: 21,
      docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
      docNo: "อส 0001/6810",
      centralSarabanNo: "2569/5120",
      externalDispatchNo: "ที่ ปปท 0014/1195",
      oagVerdictNo: "อส 0001/6810",
      oagVerdictDate: getDateWithOffset(-1),
      oagVerdictReceiveDate: getDateWithOffset(-1),
      oagVerdictDecision: "NON_PROSECUTE",
      oagVerdictSummary:
        "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของพนักงานอัยการ",
      oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6810.pdf",
      directorOagVerdictNotes:
        "รับทราบคำวินิจฉัยชี้ขาดของอัยการสูงสุด มอบหมาย ผอ.กลุ่มงานความเห็นแย้ง มอบหมายนิติกรสรุปผลและแจ้งกองบริหารคดีต่อไป",
    },
    {
      id: "คดี-100013/2569",
      title:
        "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตจัดซื้อครุภัณฑ์ยานพาหนะและขนส่ง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายสุรชัย ขนส่งยนต์",
      accusedPosition: "อดีตนายช่างเครื่องกล",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายณัฐพล บัวทุม",
      officerPosition: "นิติกรชำนาญการพิเศษ",
      assignedRole: "legal_officer",
      status: "นิติกรบันทึกผล และ แจ้งกองบริหารคดี",
      statusCode: "PENDING_OFFICER_FINAL_NOTIFICATION",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "0031/2569",
      paccCaseNo: "0072/2568",
      blackNo: "อ. 165/2569",
      redNo: "อ. 440/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ค. 2585)",
      slaTotalDays: 15,
      slaDaysRemaining: 14,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-1),
      dueDate: getDateWithOffset(14),
      workflowStep: 22,
      docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
      docNo: "อส 0001/6822",
      centralSarabanNo: "2569/5135",
      externalDispatchNo: "ที่ ปปท 0014/1210",
      oagVerdictNo: "อส 0001/6822",
      oagVerdictDate: getDateWithOffset(-1),
      oagVerdictReceiveDate: getDateWithOffset(-1),
      oagVerdictDecision: "PROSECUTE",
      oagVerdictSummary:
        "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดให้ฟ้องคดีผู้ถูกกล่าวหาตามความเห็นแย้งของคณะกรรมการ ป.ป.ท.",
      oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6822.pdf",
      directorOagVerdictNotes:
        "รับทราบคำวินิจฉัยชี้ขาดของอัยการสูงสุด มอบหมาย ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการต่อ",
      groupDirectorOagVerdictNotes:
        "มอบหมายนิติกรเจ้าของสำนวน สรุปผลคำวินิจฉัยชี้ขาดของ อสส. และจัดทำหนังสือแจ้งกองบริหารคดีดำเนินการต่อไป",
    },
    {
      id: "คดี-100008/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อครุภัณฑ์การศึกษาและสื่อการเรียนการสอน",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายอำนาจ การศึกษา",
      accusedPosition: "อดีตผู้อำนวยการกองการศึกษา",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายณัฐพล บัวทุม",
      officerPosition: "นิติกรชำนาญการพิเศษ",
      assignedRole: "legal_officer",
      /* เห็นแย้ง ต้องแจ้งทั้ง อสส. และอัยการต้นทาง (2 หน่วยงาน) ยังไม่มีใครบันทึกจัดส่งเลย
         ข้อความและสีต้องตรงกับที่ saveDispatchRecipient() เขียนจริงตอน 0/2 เพื่อให้สำนวนที่ยังไม่แตะ
         กับสำนวนที่บันทึกไปแล้วบางส่วนอ่านบนสเกลเดียวกัน */
      status: "นิติกรจัดส่งหนังสือ (บันทึกแล้ว 0/2)",
      statusCode: "PENDING_OFFICER_EXTERNAL_DISPATCH",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "0024/2569",
      paccCaseNo: "0058/2568",
      blackNo: "อ. 142/2569",
      redNo: "อ. 405/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 20 ธ.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 14,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-1),
      dueDate: getDateWithOffset(14),
      workflowStep: 15,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0038/2569",
      centralSarabanNo: "2569/4530",
      finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      finalDispatchRound2No: "0095/2569",
      finalDispatchRound2Date: getDateWithOffset(-1),
      externalDispatchNo: "ที่ ปปท 0014/1288",
      signedPresidentName:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1288.pdf",
      adminVerifiedDate: getDateWithOffset(0),
      adminVerificationNotes:
        "ตรวจสอบหนังสือความเห็นแย้งฉบับลงนามสมบูรณ์และเลขส่งภายนอกเรียบร้อยแล้ว มอบนิติกรเจ้าของสำนวนจัดส่งให้อัยการสูงสุด (อสส.) ต่อไป",
    },
    {
      id: "คดี-100009/2569",
      title:
        "พิจารณาคำสั่งไม่ฟ้องคดีจัดจ้างปรับปรุงภูมิทัศน์สวนสาธารณะเฉลิมพระเกียรติ (เห็นชอบตามอัยการ)",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายสมเกียรติ พัฒนาเมือง",
      accusedPosition: "อดีตนายกเทศมนตรี",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายณัฐพล บัวทุม",
      officerPosition: "นิติกรชำนาญการพิเศษ",
      assignedRole: "legal_officer",
      /* เห็นชอบ ต้องแจ้งอัยการต้นทางหน่วยงานเดียว (1 หน่วยงาน) วิธีจัดส่งเลือกได้อิสระตอนบันทึกจริง
         จึงห้ามฝัง EMS มาก่อนในสถานะที่ยังไม่มีใครบันทึกอะไรเลย */
      status: "นิติกรจัดส่งหนังสือ (บันทึกแล้ว 0/1)",
      statusCode: "PENDING_OFFICER_EXTERNAL_DISPATCH",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "0025/2569",
      paccCaseNo: "0060/2568",
      blackNo: "อ. 145/2569",
      redNo: "อ. 412/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 15 ม.ค. 2585)",
      slaTotalDays: 15,
      slaDaysRemaining: 13,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(13),
      workflowStep: 15,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0042/2569",
      centralSarabanNo: "2569/4535",
      finalOpinionType: "เห็นชอบตามคำสั่งไม่ฟ้องของพนักงานอัยการ",
      finalDispatchRound2No: "0096/2569",
      finalDispatchRound2Date: getDateWithOffset(-1),
      externalDispatchNo: "ที่ ปปท 0014/1290",
      signedPresidentName:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDocFile: "หนังสือแจ้งมติเห็นชอบ_ฉบับลงนามสมบูรณ์_ปปท0014_1290.pdf",
      adminVerifiedDate: getDateWithOffset(0),
      adminVerificationNotes:
        "ตรวจสอบหนังสือแจ้งมติเห็นชอบฉบับลงนามสมบูรณ์และเลขส่งภายนอกเรียบร้อยแล้ว มอบนิติกรเจ้าของสำนวนจัดส่งให้อัยการต้นทางทางไปรษณีย์ EMS ต่อไป",
    },
    {
      id: "คดี-100007/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการก่อสร้างอาคารเอนกประสงค์เทศบาล",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายเชาวลิต ช่างก่อ",
      accusedPosition: "อดีตนายช่างโยธาอาวุโส",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นางกานดา รักษ์ธรรม",
      officerPosition: "เจ้าหน้าที่ธุรการชำนาญงาน",
      assignedRole: "admin_legal",
      status: "ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)",
      statusCode: "PENDING_ADMIN_SIGNED_RECEIVE",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "0022/2569",
      paccCaseNo: "0052/2568",
      blackNo: "อ. 135/2569",
      redNo: "อ. 390/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 18 พ.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 12,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-3),
      dueDate: getDateWithOffset(12),
      workflowStep: 17,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0031/2569",
      centralSarabanNo: "2569/4520",
      finalDispatchRound2No: "0088/2569",
      finalDispatchRound2Date: getDateWithOffset(-1),
      externalDispatchNo: "ที่ ปปท 0014/1245",
      signedPresidentName:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf",
      signedExecutiveDate: getDateWithOffset(0),
      executiveSignNotesRound2:
        "ผู้บริหารลงนามหนังสือความเห็นแย้งฉบับสมบูรณ์เรียบร้อยแล้ว ส่งคืนธุรการกองกฎหมายเพื่อตรวจรับและออกเลขส่งภายนอก",
    },
    {
      id: "คดี-100005/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการก่อสร้างเขื่อนป้องกันตลิ่ง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายมนตรี ว่องไว",
      accusedPosition: "อดีตวิศวกรโยธาชำนาญการ",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นางกานดา รักษ์ธรรม",
      officerPosition: "เจ้าหน้าที่ธุรการชำนาญงาน",
      assignedRole: "admin_legal",
      status: "ธุรการรับผลมติ",
      statusCode: "RETURNED_FROM_EXEC",
      statusBadge: "bg-success text-white",
      lawReceiveNo: "0019/2569",
      paccCaseNo: "0038/2568",
      blackNo: "อ. 120/2569",
      redNo: "อ. 355/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 12 ก.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 7,
      slaAlert: "sla-warning",
      dateReceived: getDateWithOffset(-8),
      dueDate: getDateWithOffset(7),
      workflowStep: 8,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0025/2569",
      legalOpinion:
        "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
      signedBy:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDate: "21 ส.ค. 2569",
      signedExecutiveOrder: "เห็นชอบ",
      signedDocFile: "หนังสือผลมติ_2569_006.pdf",
      adminDispatchNo: "2569/0410",
      adminDispatchDate: "20 ส.ค. 2569",
      centralSarabanNo: "2569/4502",
      boardMeetingNo: "14/2569",
      boardMeetingDate: "21 ส.ค. 2569",
      boardResolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      boardResolutionDetail:
        "ที่ประชุมคณะกรรมการ ป.ป.ท. ได้พิจารณาสำนวนการไต่สวนข้อเท็จจริงประกอบบันทึกความเห็นของกองกฎหมายแล้ว มีมติเป็นเอกฉันท์เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาดตามขั้นตอนกฎหมายต่อไป",
    },
    {
      id: "คดี-100014/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อครุภัณฑ์ระบบสารสนเทศและกล้อง CCTV",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายสุทธิพงษ์ มั่นเพียร",
      accusedPosition: "อดีตผู้อำนวยการกองช่าง",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นางกานดา รักษ์ธรรม",
      officerPosition: "เจ้าหน้าที่ธุรการชำนาญงาน",
      assignedRole: "admin_legal",
      status: "ธุรการรับผลมติ",
      statusCode: "RETURNED_FROM_EXEC",
      statusBadge: "bg-success text-white",
      lawReceiveNo: "0020/2569",
      paccCaseNo: "0039/2568",
      blackNo: "อ. 122/2569",
      redNo: "อ. 358/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 24 ก.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 2,
      slaAlert: "sla-danger",
      dateReceived: getDateWithOffset(-13),
      dueDate: getDateWithOffset(2),
      workflowStep: 8,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0028/2569",
      legalOpinion:
        "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
      signedBy:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDate: "23 ส.ค. 2569",
      signedExecutiveOrder: "เห็นชอบ",
      signedDocFile: "หนังสือผลมติ_2569_007.pdf",
      adminDispatchNo: "2569/0415",
      adminDispatchDate: "22 ส.ค. 2569",
      centralSarabanNo: "2569/4508",
      boardMeetingNo: "15/2569",
      boardMeetingDate: "23 ส.ค. 2569",
      boardResolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      boardResolutionDetail:
        "ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาด",
    },
    {
      id: "คดี-100015/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตเบิกจ่ายเงินงบประมาณโครงการฝึกอบรมสัมมนาเท็จ",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นางสาวพิมพา สมบูรณ์ทรัพย์",
      accusedPosition: "อดีตหัวหน้าฝ่ายการเงินและบัญชี",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นางกานดา รักษ์ธรรม",
      officerPosition: "เจ้าหน้าที่ธุรการชำนาญงาน",
      assignedRole: "admin_legal",
      status: "ธุรการรับผลมติ",
      statusCode: "RETURNED_FROM_EXEC",
      statusBadge: "bg-success text-white",
      lawReceiveNo: "0021/2569",
      paccCaseNo: "0040/2568",
      blackNo: "อ. 125/2569",
      redNo: "อ. 362/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 5 ต.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 4,
      slaAlert: "sla-warning",
      dateReceived: getDateWithOffset(-11),
      dueDate: getDateWithOffset(4),
      workflowStep: 8,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0030/2569",
      legalOpinion:
        "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
      signedBy:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDate: "24 ส.ค. 2569",
      signedExecutiveOrder: "เห็นชอบ",
      signedDocFile: "หนังสือผลมติ_2569_008.pdf",
      adminDispatchNo: "2569/0420",
      adminDispatchDate: "23 ส.ค. 2569",
      centralSarabanNo: "2569/4515",
      boardMeetingNo: "15/2569",
      boardMeetingDate: "24 ส.ค. 2569",
      boardResolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      boardResolutionDetail:
        "ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาด",
    },
    {
      id: "คดี-100016/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการขุดลอกคลองส่งน้ำและแก้มลิงเพื่อการเกษตร",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 5",
      accuser: "สำนักงาน ป.ป.ท. เขต 5",
      accused: "นายเกียรติศักดิ์ ชัยชนะ",
      accusedPosition: "อดีตนายช่างโยธาอาวุโส",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นางกานดา รักษ์ธรรม",
      officerPosition: "เจ้าหน้าที่ธุรการชำนาญงาน",
      assignedRole: "admin_legal",
      status: "ธุรการรับผลมติ",
      statusCode: "RETURNED_FROM_EXEC",
      statusBadge: "bg-success text-white",
      lawReceiveNo: "0022/2569",
      paccCaseNo: "0041/2568",
      blackNo: "อ. 128/2569",
      redNo: "อ. 370/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 8,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-7),
      dueDate: getDateWithOffset(8),
      workflowStep: 8,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0033/2569",
      legalOpinion:
        "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
      signedBy:
        "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDate: "25 ส.ค. 2569",
      signedExecutiveOrder: "เห็นชอบ",
      signedDocFile: "หนังสือผลมติ_2569_009.pdf",
      adminDispatchNo: "2569/0425",
      adminDispatchDate: "24 ส.ค. 2569",
      centralSarabanNo: "2569/4522",
      boardMeetingNo: "16/2569",
      boardMeetingDate: "25 ส.ค. 2569",
      boardResolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      boardResolutionDetail:
        "ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาด",
    },
    {
      id: "คดี-100003/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตเงินอุดหนุนโครงการส่งเสริมอาชีพชุมชน",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 4",
      accuser: "สำนักงาน ป.ป.ท. เขต 4",
      accused: "นายอำนาจ พิทักษ์ธรรม",
      accusedPosition: "อดีตหัวหน้าฝ่ายพัฒนาชุมชน",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายนภัส สอนดี",
      officerPosition: "ผู้อำนวยการกองกฎหมาย",
      assignedRole: "dir_legal",
      status: "ผอ.กองกฎหมายพิจารณา",
      statusCode: "PENDING_DIRECTOR",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "0017/2569",
      paccCaseNo: "0049/2568",
      blackNo: "อ. 115/2569",
      redNo: "อ. 340/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 13,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(13),
      workflowStep: 2,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0019/2569",
      centralSarabanNo: "2569/4501",
    },
    {
      id: "คดี-100002/2569",
      title: "พิจารณาความเห็นแย้งคดีจัดซื้อครุภัณฑ์วิทยาศาสตร์ราคาสูงเกินจริง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 1",
      accuser: "สำนักงาน ป.ป.ท. เขต 1",
      accused: "นายธีระ วัฒนกุล",
      accusedPosition: "อดีตเจ้าพนักงานวิทยาศาสตร์",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายอานนท์ ชินประชา",
      officerPosition: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      assignedRole: "group_director",
      status: "ผอ.กลุ่มงานความเห็นแย้งพิจารณา",
      statusCode: "PENDING_GROUP_DIRECTOR",
      statusBadge: "bg-info text-dark",
      lawReceiveNo: "0015/2569",
      paccCaseNo: "0040/2568",
      blackNo: "อ. 108/2569",
      redNo: "อ. 312/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 5 ต.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 11,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-4),
      dueDate: getDateWithOffset(11),
      workflowStep: 3,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0015/2569",
      directorNotes:
        "มอบกลุ่มงานความเห็นแย้ง มอบหมายนิติกรเจ้าของสำนวนจัดทำความเห็นโดยด่วน",
      centralSarabanNo: "2569/4488",
    },
    {
      id: "คดี-100004/2569",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
      accused: "นายสมชาย ทุจริตมั่น",
      accusedPosition: "อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายนภัส สอนดี",
      officerPosition: "ผู้อำนวยการกองกฎหมาย",
      assignedRole: "dir_legal",
      status: "พิจารณาความเห็นของนิติกร",
      statusCode: "PENDING_DIRECTOR_APPROVAL",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "0014/2569",
      paccCaseNo: "0012/2568",
      blackNo: "อ. 104/2569",
      redNo: "อ. 308/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 15,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-8),
      dueDate: getDateWithOffset(15),
      workflowStep: 6,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0012/2569",
      legalOpinion:
        "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ เนื่องจากพยานหลักฐานจากการไต่สวนของคณะกรรมการ ป.ป.ท. มีน้ำหนักรับฟังได้มั่นคงว่าผู้ถูกกล่าวหามีเจตนาเอื้อประโยชน์ให้แก่ผู้เสนอราคา",
      opinionType: "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      groupDirectorEndorsement:
        "เห็นชอบร่างความเห็นแย้งของนิติกร เสนอ ผอ.กองกฎหมายเพื่อโปรดพิจารณา",
      groupDirectorApprovedDate: "18 ส.ค. 2569",
      centralSarabanNo: "2569/4470",
    },
    {
      id: "คดี-100001/2569",
      title:
        "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 3",
      accuser: "สำนักงาน ป.ป.ท. เขต 3",
      accused: "นายวิชัย การกุศล",
      accusedPosition: "เจ้าพนักงานจัดเก็บรายได้",
      petitioner: "",
      defendant: "",
      officialDocHeading: "",
      officer: "นายณัฐพล บัวทุม",
      officerPosition: "นิติกรชำนาญการพิเศษ",
      assignedRole: "legal_officer",
      status: "นิติกรจัดทำความเห็น",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "0012/2569",
      paccCaseNo: "0031/2568",
      blackNo: "อ. 98/2569",
      redNo: "อ. 290/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)",
      slaTotalDays: 15,
      slaDaysRemaining: 5,
      slaAlert: "sla-danger",
      dateReceived: getDateWithOffset(-10),
      dueDate: getDateWithOffset(5),
      workflowStep: 4,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0009/2569",
      groupDirectorNotes: "มอบนิติกรณัฐพล จัดทำบันทึกความเห็นแย้งด่วนที่สุด",
      centralSarabanNo: "2569/4412",
    },
    /* ---- มติจากกิจกรรมที่ 7 (10.2 Part 2 mock data) ----------------------
       ทั้ง 3 คำร้องนี้จำลองสถานะ "รอเสนอมติบอร์ด (กิจกรรมที่ 7)" — จุดที่
       10-2-09-legal-admin-dispatch.html ส่งไม้ต่อให้ 10-2-10 เป็นต้นไป
       เพื่อให้ทดสอบทั้ง 3 สาขา (DISCLOSE/PARTIAL/DENY) ได้ทันทีโดยไม่ต้อง
       เดินผ่านขั้นตอน LAW0037-LAW0046 ทั้งหมดก่อน l2Signatures.proposer
       ใส่ไว้แล้วเพราะ ผอ.กองกฎหมายต้องลงนามผ่านหน้า 10-2-08 มาก่อนถึงจะมาถึง
       จุดนี้ได้จริง — ย้ายมาจาก PACC_INTAKE_DATABASE เพราะเดิมอยู่ผิดอาเรย์
       ทำให้ไม่เคยขึ้นเป็นแถวในคิวงานของธุรการกองกฎหมายเลย (getCases() อ่าน
       จาก INITIAL_CASES เท่านั้น ไม่ได้อ่าน PACC_INTAKE_DATABASE) */
    {
      id: "คำร้อง-100010/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานผลการตรวจสอบข้อเท็จจริงโครงการก่อสร้างถนน",
      requesterName: "นายประเสริฐ ใจซื่อ",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "รายงานผลการตรวจสอบข้อเท็จจริงโครงการก่อสร้างถนนสายบ้านโนนสูง",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอเปิดเผยเป็นข้อมูลข่าวสารทั่วไป ไม่กระทบต่อความมั่นคงหรือประโยชน์สาธารณะ",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4501",
      l2ApprovalBranch: "SECGEN",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_PENDING_SECGEN_OPINION",
      status: "เลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย พิจารณาให้ความเห็นและลงนาม",
    },
    {
      id: "คำร้อง-100011/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยสำนวนการสอบข้อเท็จจริงเจ้าหน้าที่ทุจริตจัดซื้อจัดจ้าง",
      requesterName: "นางสาวอรทัย เที่ยงธรรม",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo:
        "สำนวนการสอบข้อเท็จจริงกรณีเจ้าหน้าที่ถูกกล่าวหาทุจริตจัดซื้อจัดจ้างวัสดุครุภัณฑ์",
      relatedCaseNo: "คดี-100012/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะส่วนสรุปผลการสอบข้อเท็จจริง โดยให้ปกปิดชื่อและข้อมูลระบุตัวพยานเนื่องจากอยู่ระหว่างกระบวนการทางวินัย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลบางส่วนเป็นข้อมูลส่วนบุคคลของพยานที่ยังอยู่ระหว่างการคุ้มครอง จึงเปิดเผยได้เพียงบางส่วน",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4502",
      l2ApprovalBranch: "DEPUTY",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_PENDING_DEPUTY_SG_OPINION",
      status: "รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย พิจารณาให้ความเห็น (๖) และลงนาม",
    },
    {
      id: "คำร้อง-100012/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยแผนปฏิบัติการสืบสวนกรณีทุจริตจัดซื้อยาและเวชภัณฑ์",
      requesterName: "นายวิชัย ตรงประเด็น",
      requesterTypeName: "ผู้เสียหาย",
      requestedInfo:
        "แผนปฏิบัติการสืบสวนและรายชื่อเจ้าหน้าที่ผู้เกี่ยวข้องในคดีทุจริตจัดซื้อยาและเวชภัณฑ์",
      relatedCaseNo: "คดี-100013/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอเป็นแผนปฏิบัติการสืบสวนที่ยังดำเนินการอยู่ หากเปิดเผยจะก่อให้เกิดความเสียหายต่อการบังคับใช้กฎหมายตามมาตรา 15(2) จึงไม่อนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าการเปิดเผยแผนปฏิบัติการสืบสวนที่ยังไม่เสร็จสิ้นจะกระทบต่อการสืบสวนสอบสวนคดีทุจริตที่เกี่ยวข้อง",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4503",
      l2ApprovalBranch: "SECGEN",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_PENDING_SECGEN_OPINION",
      status: "เลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย พิจารณาให้ความเห็นและลงนาม",
    },
    /* ---- L2_SECGEN_RESOLVED x 4 — มติ DISCLOSE/PARTIAL ที่เลขาธิการ ป.ป.ท.
       ผู้ดูแลกองกฎหมายลงนามชี้ขาดแล้วที่ 10-2-31 (มติ+สถานะคดี/l2CaseState
       เป็นค่าจริงที่เลขาธิการฯ ยืนยัน ไม่ใช่แค่ค่าที่คณะอนุกรรมการฯ เดาไว้ที่
       10-2-06 อีกต่อไป) ต่างจาก 100010/100011 ด้านบนที่ยังค้างอยู่ก่อน
       10-2-31 (L2_PENDING_SECGEN_OPINION) — ชุดนี้มี l2Signatures.secgenOpinion
       ด้วย ทำให้เปิด 10-2-10 (อ่านอย่างเดียวแล้ว) เห็นมติ/สถานะคดี/ลายเซ็น
       เลขาธิการฯ ครบทั้ง 4 ช่อง (เปิดเผย/เปิดเผยบางส่วน x คดีเสร็จสิ้นแล้ว/
       อยู่ระหว่างไต่สวน) พร้อมให้ธุรการกดรับทราบและส่งต่อ */
    {
      id: "คำร้อง-100025/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานความคืบหน้าการไต่สวนโครงการก่อสร้างสะพานข้ามคลอง",
      requesterName: "นายอนุชา มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานความคืบหน้าการไต่สวนโครงการก่อสร้างสะพานข้ามคลอง",
      relatedCaseNo: "คดี-100025/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องยังอยู่ระหว่างการไต่สวน แต่ข้อมูลที่ขอไม่กระทบต่อการไต่สวนดังกล่าว",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2InternalDocNo: "ปป 0002/4520",
      l2ApprovalBranch: "DEPUTY",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
        deputySgOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-1),
          position: "รองเลขาธิการคณะกรรมการ ป.ป.ท.",
        },
      },
      statusCode: "L2_DEPUTY_SG_RESOLVED",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
    },
    {
      id: "คำร้อง-100026/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการไต่สวนโครงการจัดซื้อครุภัณฑ์การแพทย์ที่ยุติแล้ว",
      requesterName: "นางสาวธัญญา ค้ำจุน",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "รายงานผลการไต่สวนโครงการจัดซื้อครุภัณฑ์การแพทย์ที่คดียุติแล้ว",
      relatedCaseNo: "คดี-100026/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว การเปิดเผยข้อมูลจึงไม่กระทบต่อการไต่สวนอีกต่อไป",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2InternalDocNo: "ปป 0002/4521",
      l2ApprovalBranch: "SECGEN",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
        secgenOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-1),
          position: "เลขาธิการคณะกรรมการ ป.ป.ท.",
        },
      },
      statusCode: "L2_SECGEN_RESOLVED",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
    },
    {
      id: "คำร้อง-100027/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตเบิกจ่ายค่าล่วงเวลา",
      requesterName: "นายพิชิต แน่วแน่",
      requesterTypeName: "ทนายความ",
      requestedInfo: "เอกสารการไต่สวนกรณีทุจริตเบิกจ่ายค่าล่วงเวลาเจ้าหน้าที่",
      relatedCaseNo: "คดี-100027/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสือมอบอำนาจ.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะบางส่วน โดยปกปิดข้อมูลส่วนบุคคลที่อ่อนไหว เนื่องจากอยู่ระหว่างการไต่สวน",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องยังอยู่ระหว่างการไต่สวน ข้อมูลบางส่วนต้องปกปิดเพื่อไม่ให้กระทบการไต่สวน",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2InternalDocNo: "ปป 0002/4522",
      l2ApprovalBranch: "DEPUTY",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
        deputySgOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-1),
          position: "รองเลขาธิการคณะกรรมการ ป.ป.ท.",
        },
      },
      statusCode: "L2_DEPUTY_SG_RESOLVED",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
    },
    {
      id: "คำร้อง-100028/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการไต่สวนคดีทุจริตเบิกจ่ายเงินสวัสดิการที่สิ้นสุดแล้ว",
      requesterName: "นางสมศรี เอื้อเฟื้อ",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "รายงานผลการไต่สวนคดีทุจริตเบิกจ่ายเงินสวัสดิการที่คดียุติแล้ว",
      relatedCaseNo: "คดี-100028/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะบางส่วน โดยปกปิดข้อมูลส่วนบุคคลของบุคคลที่สาม แม้คดีจะเสร็จสิ้นแล้ว",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว แต่ยังต้องปกปิดข้อมูลส่วนบุคคลของบุคคลที่สาม",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2InternalDocNo: "ปป 0002/4523",
      l2ApprovalBranch: "SECGEN",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
        secgenOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-1),
          position: "เลขาธิการคณะกรรมการ ป.ป.ท.",
        },
      },
      statusCode: "L2_SECGEN_RESOLVED",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
    },
    /* ---- L2_SECGEN_RESOLVED เพิ่มเติม — เติมช่องที่ยังขาดของชุด 4 ช่อง
       (เปิดเผย/เปิดเผยบางส่วน/ไม่เปิดเผย x คดีเสร็จสิ้นแล้ว) ด้านบน: มีแค่
       DISCLOSE+CLOSED (100026) กับ PARTIAL+CLOSED (100028) อยู่แล้ว ขาดแค่
       DENY+CLOSED จึงเติมคำร้องนี้ให้ครบทั้ง 3 มติ x คดีเสร็จสิ้นแล้ว */
    {
      id: "คำร้อง-100031/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการไต่สวนคดีทุจริตเบิกจ่ายค่าตอบแทนที่สิ้นสุดแล้ว",
      requesterName: "นายสมบัติ ยืนยง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "รายงานผลการไต่สวนคดีทุจริตเบิกจ่ายค่าตอบแทนที่คดียุติแล้ว",
      relatedCaseNo: "คดี-100031/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอเป็นข้อมูลส่วนบุคคลของพยานและเจ้าหน้าที่ที่เกี่ยวข้อง แม้คดีจะเสร็จสิ้นแล้วก็ยังไม่อนุญาตให้เปิดเผยตามมาตรา 15",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าแม้คดีจะเสร็จสิ้นแล้ว แต่ข้อมูลยังกระทบต่อสิทธิส่วนบุคคลของผู้เกี่ยวข้อง จึงไม่อนุญาตให้เปิดเผย",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2InternalDocNo: "ปป 0002/4524",
      l2ApprovalBranch: "SECGEN",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
        secgenOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-1),
          position: "เลขาธิการคณะกรรมการ ป.ป.ท.",
        },
      },
      statusCode: "L2_SECGEN_RESOLVED",
      status: "เลขาธิการ ป.ป.ท. ตอบกลับแล้ว",
    },
    /* ---- คำร้องระหว่างทาง Part 2 (10-2-11 ถึง 10-2-21) --------------------
       ทุกสถานะที่เหลือของ Part 2 ยังไม่มีคำร้องทดสอบเลยแม้แต่รายการเดียว —
       ธุรการ (10-2-10) มีคำร้อง 3 รายการข้างบนให้ทดสอบอยู่แล้ว แต่เลขานุการฯ
       และ ผอ.กองกฎหมาย ไม่เคยมีงาน Part 2 ให้กดดำเนินการเลย ชุดนี้เติมคำร้อง
       ให้ครบทุกสถานะที่เหลือ (1 คำร้อง/1 สถานะ) เพื่อให้เดินหน้าทดสอบทั้งสาย
       เปิดเผย/บางส่วน (10-2-11 ถึง 14) และสายไม่อนุญาต (10-2-15 ถึง 21) ได้
       ทันทีจากคิวงานของแต่ละบทบาท โดยไม่ต้องไล่เดินคำร้องเดิมทีละขั้น */
    {
      id: "คำร้อง-100013/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการตรวจสอบโครงการปรับปรุงไฟฟ้าส่องสว่างสาธารณะ",
      requesterName: "นายสมพงษ์ รักชาติ",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานผลการตรวจสอบโครงการปรับปรุงไฟฟ้าส่องสว่างสาธารณะ",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอเป็นข้อมูลข่าวสารทั่วไป ไม่กระทบต่อประโยชน์สาธารณะ",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4504",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.130",
      l2BoardApprovalDate: getDateWithOffset(-3),
      l2ReceiveNotes: "",
      statusCode: "L2_PENDING_NOTICE_DRAFT",
      status: "ฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติเสนอผู้ยื่นคำขอ",
      assignedRole: "sub_secretariat",
      officer: "น.ส.พิมพ์ชนก ทองดี",
    },
    {
      id: "คำร้อง-100014/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยสำนวนการสอบข้อเท็จจริงกรณีร้องเรียนเจ้าหน้าที่รับสินบน",
      requesterName: "นางสาวชุติมา แจ่มใส",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "สำนวนการสอบข้อเท็จจริงกรณีร้องเรียนเจ้าหน้าที่รับสินบน",
      relatedCaseNo: "คดี-100014/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะส่วนสรุปผล โดยปกปิดชื่อพยานเนื่องจากอยู่ระหว่างกระบวนการทางวินัย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลบางส่วนเป็นข้อมูลส่วนบุคคลของพยานที่ยังอยู่ระหว่างการคุ้มครอง",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4505",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.131",
      l2BoardApprovalDate: getDateWithOffset(-4),
      l2ReceiveNotes: "",
      l2NoticeRecipient: "นางสาวชุติมา แจ่มใส",
      l2NoticeBody:
        "ตามที่ท่านได้ยื่นคำร้องขอเปิดเผยข้อมูลข่าวสารนั้น คณะกรรมการ ป.ป.ท. ได้พิจารณาแล้วมีมติอนุญาตเปิดเผยบางส่วน",
      l2NoticeAppointmentDate: getDateWithOffset(7),
      statusCode: "L2_PENDING_NOTICE_SIGN",
      status: "ผอ.กองกฎหมายตรวจและลงนามหนังสือแจ้งมติ",
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี",
    },
    {
      id: "คำร้อง-100015/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการจัดซื้อจัดจ้างวัสดุครุภัณฑ์สำนักงาน",
      requesterName: "นายอนุชา พากเพียร",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการจัดซื้อจัดจ้างวัสดุครุภัณฑ์สำนักงานประจำปี 2568",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะเอกสารสรุปผลการจัดซื้อจัดจ้าง โดยปกปิดข้อมูลราคากลางบางส่วน",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลราคากลางบางส่วนอาจกระทบต่อการแข่งขันที่เป็นธรรมในการจัดซื้อจัดจ้างครั้งต่อไป",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4506",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.132",
      l2BoardApprovalDate: getDateWithOffset(-5),
      l2ReceiveNotes: "",
      l2NoticeRecipient: "นายอนุชา พากเพียร",
      l2NoticeBody:
        "ตามที่ท่านได้ยื่นคำร้องขอเปิดเผยข้อมูลข่าวสารนั้น คณะกรรมการ ป.ป.ท. ได้พิจารณาแล้วมีมติอนุญาตเปิดเผยบางส่วน",
      l2NoticeAppointmentDate: getDateWithOffset(5),
      l2RedactionNotes: "ปกปิดข้อมูลราคากลางในเอกสารแนบหน้า 3-4 เรียบร้อยแล้ว",
      l2RedactionDone: true,
      statusCode: "L2_PENDING_NOTICE_SIGN",
      status: "ผอ.กองกฎหมายตรวจและลงนามหนังสือแจ้งมติ",
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี",
    },
    {
      id: "คำร้อง-100016/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานการประชุมคณะกรรมการตรวจสอบข้อเท็จจริงเบื้องต้น",
      requesterName: "นายธีรพล ยุติธรรม",
      requesterTypeName: "ทนายความ",
      requestedInfo: "รายงานการประชุมคณะกรรมการตรวจสอบข้อเท็จจริงเบื้องต้น",
      relatedCaseNo: "คดี-100015/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสือมอบอำนาจ.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอเป็นข้อมูลข่าวสารทั่วไป ไม่กระทบต่อประโยชน์สาธารณะ",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4507",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.133",
      l2BoardApprovalDate: getDateWithOffset(-6),
      l2ReceiveNotes: "",
      l2NoticeRecipient: "นายธีรพล ยุติธรรม",
      l2NoticeBody:
        "ตามที่ท่านได้ยื่นคำร้องขอเปิดเผยข้อมูลข่าวสารนั้น คณะกรรมการ ป.ป.ท. ได้พิจารณาแล้วมีมติอนุญาตเปิดเผย",
      statusCode: "L2_PENDING_NOTICE_DISPATCH",
      status: "ธุรการกองกฎหมายออกเลขส่งและแจ้งผลผู้ยื่นคำขอ",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    {
      id: "คำร้อง-100017/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยข้อมูลบัญชีทรัพย์สินเจ้าหน้าที่รัฐระหว่างการไต่สวน",
      requesterName: "นายกิตติศักดิ์ ค้นหา",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "ข้อมูลบัญชีทรัพย์สินและหนี้สินของเจ้าหน้าที่รัฐที่อยู่ระหว่างการไต่สวน",
      relatedCaseNo: "คดี-100016/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลบัญชีทรัพย์สินที่อยู่ระหว่างการไต่สวนเป็นข้อมูลที่ต้องรักษาความลับ หากเปิดเผยจะกระทบต่อการไต่สวน จึงไม่อนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าการเปิดเผยข้อมูลระหว่างการไต่สวนอาจก่อให้เกิดการยักย้ายถ่ายเททรัพย์สิน",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4508",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.134",
      l2BoardApprovalDate: getDateWithOffset(-3),
      l2ReceiveNotes: "",
      statusCode: "L2_PENDING_DENY_MEMO",
      status: "ฝ่ายเลขานุการฯ จัดทำบันทึกและมติไม่อนุญาตเปิดเผยข้อมูล",
      assignedRole: "sub_secretariat",
      officer: "น.ส.พิมพ์ชนก ทองดี",
    },
    {
      id: "คำร้อง-100018/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยแผนที่ตำแหน่งพยานผู้ให้เบาะแสในคดีทุจริตจัดซื้อยา",
      requesterName: "นายประยุทธ ไม่ย่อท้อ",
      requesterTypeName: "ผู้เสียหาย",
      requestedInfo:
        "ข้อมูลตำแหน่งและรายชื่อพยานผู้ให้เบาะแสในคดีทุจริตจัดซื้อยา",
      relatedCaseNo: "คดี-100017/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลตำแหน่งพยานเป็นข้อมูลที่หากเปิดเผยจะเป็นอันตรายต่อความปลอดภัยของพยาน จึงไม่อนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าการเปิดเผยข้อมูลพยานจะกระทบต่อความปลอดภัยของบุคคลและกระบวนการยุติธรรม",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4509",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.135",
      l2BoardApprovalDate: getDateWithOffset(-7),
      l2ReceiveNotes: "",
      l2DenyMemoText:
        "ด้วยคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้พิจารณาคำร้องแล้วเห็นว่าข้อมูลตำแหน่งพยานเป็นข้อมูลที่หากเปิดเผยจะเป็นอันตรายต่อความปลอดภัยของพยาน จึงเรียนมาเพื่อโปรดพิจารณาเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      statusCode: "L2_PENDING_DENY_PROPOSE",
      status: "ผอ.กองกฎหมายพิจารณาเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี",
    },
    {
      id: "คำร้อง-100019/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยที่ยังไม่ถึงที่สุดต้องได้รับการคุ้มครองตามหลักการพิจารณาที่เป็นธรรม",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4510",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.136",
      l2BoardApprovalDate: getDateWithOffset(-9),
      l2ReceiveNotes: "",
      l2DenyMemoText:
        "ด้วยคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้พิจารณาคำร้องแล้วเห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด จึงเรียนมาเพื่อโปรดพิจารณาเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2DenyCommitteeDispatchDate: getDateWithOffset(-6),
      l2DenyCommitteeDispatchNotes: "",
      statusCode: "L2_PENDING_DENY_DISPATCH_COMMITTEE",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    {
      id: "คำร้อง-100020/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยเอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      requesterName: "นายวรพล มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "เอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเป็นส่วนหนึ่งของสำนวนที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4511",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.137",
      l2BoardApprovalDate: getDateWithOffset(-11),
      l2ReceiveNotes: "",
      l2DenyMemoText:
        "ด้วยคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้พิจารณาคำร้องแล้วเห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงเรียนมาเพื่อโปรดพิจารณาเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-8),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      statusCode: "L2_CASE_CLOSED_DENY_ASSIGNED",
      status: "สิ้นสุด — มอบหมายกอง/สำนักเจ้าของสำนวนแล้ว",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },

    /* ----------------------------------------------- FLOW 4 (ตัวอย่าง)
       อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล — ทดสอบหน้า 10-2-appeal-01 ที่เพิ่มใหม่
       (ดู docs/10-2-flow4-appeal-plan.md) ต่อยอดจากคำร้องสาย DENY ที่ปิด
       สำนวนแล้ว (เทียบ คำร้อง-100020/2569 ด้านบน) — ผู้ยื่นคำขอใช้สิทธิ์
       อุทธรณ์ตามที่ได้รับแจ้งไว้ที่ LAW0052 */
    {
      id: "คำร้อง-100032/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
        "หนังสืออุทธรณ์คำสั่งไม่เปิดเผยข้อมูล.pdf",
        "รายงานการสอบสวนวินัย (ฉบับย่อ) แนบประกอบ.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-20),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      /* เจ้าของสำนวนไต่สวนเดิม (relatedCaseNo) — คนละคนกับผู้จัดการคำขอเปิดเผยข้อมูลนี้ */
      l2OriginalCaseOfficer: "นายประดิษฐ์ ไต่สวนเก่ง",
      l2OriginalCaseOfficerOrg: "กองปราบปรามการทุจริตในภาครัฐ 2",
      /* มติ 3 ช่วง — ปัจจุบันระบบเก็บ l2ResolutionType เป็นค่าเดียวที่ถูกเขียนทับ
         ทุกขั้น (10-2-06 → 32 → 31) ฟิลด์ด้านล่างนี้เป็น snapshot จำลองไว้ให้เห็น
         ว่าแต่ละช่วงเคยให้ความเห็นว่าอย่างไรบ้างก่อนจะสรุปเป็น l2ResolutionType — ตั้งใจ
         เขียนเนื้อหาให้ต่างกันชัดเจนแต่ละช่วง ไม่ใช่ก็อปข้อความเดียวกันซ้ำ */
      l2ResolutionAtScreening: "ไม่อนุญาตเปิดเผย",
      l2ResolutionAtScreeningDetail:
        "คณะอนุกรรมการพิจารณากลั่นกรองฯ ชี้มูลเบื้องต้นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยอาจกระทบกระบวนการทางวินัยที่ยังไม่สิ้นสุด",
      l2ResolutionAtBoardDraft: "ไม่อนุญาตเปิดเผย (ยืนตามชี้มูล)",
      l2ResolutionAtBoardDraftDetail:
        "รองเลขาธิการ ป.ป.ท. ตรวจร่างและให้ความเห็นยืนยันมติชี้มูลเดิม ก่อนเสนอเลขาธิการ ป.ป.ท. ลงนามส่งกิจกรรมที่ 7",
      l2ResolutionAtBoardReply: "ไม่อนุญาตเปิดเผย",
      l2ResolutionAtBoardReplyDetail:
        "คณะกรรมการ ป.ป.ท. (กิจกรรมที่ 7) มีมติยืนตามร่างที่เสนอ ไม่อนุญาตเปิดเผยข้อมูล พร้อมมอบหมายกองปราบปรามการทุจริตในภาครัฐ 2 เป็นเจ้าของสำนวนต่อ",
      /* มติกิจกรรมที่ 7 ครั้งอื่นบนสำนวนเดียวกัน (คดี-100018/2569) — ไว้ดูประกอบ
         เฉย ๆ ไม่ใช่มติของคำร้องขอเปิดเผยข้อมูลนี้ */
      l2OtherBoardResolutions: [
        {
          activity: "กิจกรรมที่ 7 (รอบที่ 1) — ความเห็นแย้งคำสั่งไม่ฟ้อง",
          date: getDateWithOffset(-90),
          resolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
          detail: "คณะกรรมการ ป.ป.ท. เห็นชอบให้ทำความเห็นแย้งในสำนวนคดี-100018/2569",
        },
        {
          activity: "กิจกรรมที่ 7 (รอบที่ 2) — พิจารณาสำนวนไต่สวนหลัก",
          date: getDateWithOffset(-45),
          resolution: "มีมติให้ดำเนินการไต่สวนต่อ และให้ตั้งคณะอนุกรรมการไต่สวนเพิ่มเติม",
          detail: "คณะกรรมการ ป.ป.ท. เห็นว่าพยานหลักฐานยังไม่เพียงพอ ให้ขยายผลการไต่สวนในสำนวนคดี-100018/2569 ต่อไปอีก 60 วัน",
        },
      ],
      statusCode: "L2_PENDING_APPEAL_INTAKE",
      status: "ธุรการกองบริหารคดีรับเรื่องอุทธรณ์และลงทะเบียนรับ",
      assignedRole: "case_bureau_admin",
      officer: "นางนิชาดา ธุรการกิจ",
    },
    {
      /* ตัวอย่างสายเขต (จุดเริ่มต้นทางที่ 2) — ยื่นตรงที่เขต รอเจ้าหน้าที่เขต
         รับเรื่องที่ 10-2-appeal-01b-district-intake.html แทนธุรการกองบริหารคดี */
      id: "คำร้อง-100049/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการจัดซื้อจัดจ้างครุภัณฑ์คอมพิวเตอร์ประจำปี",
      requesterName: "นายอนุชา ทวีทรัพย์",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการจัดซื้อจัดจ้างครุภัณฑ์คอมพิวเตอร์ประจำปี",
      relatedCaseNo: "คดี-100022/2569",
      requestChannelName: "ยื่นที่เขต",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสืออุทธรณ์คำสั่งไม่เปิดเผยข้อมูล.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับกระบวนการจัดซื้อจัดจ้างที่อยู่ระหว่างการตรวจสอบ จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 4",
      l2DenyAssignDate: getDateWithOffset(-18),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2OriginalCaseOfficer: "นายประดิษฐ์ ไต่สวนเก่ง",
      l2OriginalCaseOfficerOrg: "กองปราบปรามการทุจริตในภาครัฐ 4",
      statusCode: "L2_PENDING_APPEAL_INTAKE_DISTRICT",
      status: "เจ้าหน้าที่เขตรับเรื่องอุทธรณ์และลงทะเบียนรับ",
      assignedRole: "district_admin",
      officer: "นายกิตติพงษ์ ดูแลเขต",
    },
    {
      id: "คำร้อง-100033/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      requesterName: "นายวรพล มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-22),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5123",
      l2AppealReceiveDate: getDateWithOffset(-2),
      l2AppealChannel: "เขต (เขต 3)",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100033/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าเอกสารการเบิกจ่ายงบประมาณดังกล่าวไม่ได้เกี่ยวข้องโดยตรงกับสำนวนที่อยู่ระหว่างไต่สวนของหน่วยงานอื่น จึงขอให้ทบทวนมติไม่อนุญาตเปิดเผยข้อมูล",
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_ASSIGN",
      status: "ผอ.กองบริหารคดีพิจารณาเรื่องอุทธรณ์และมอบหมาย",
      assignedRole: "case_bureau_director",
      officer: "นางปัทมา บริหารกิจ",
    },
    {
      id: "คำร้อง-100034/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-25),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5109",
      l2AppealReceiveDate: getDateWithOffset(-5),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100034/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบสวนวินัยดังกล่าวมีผลถึงที่สุดแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      statusCode: "L2_PENDING_TRACKING_DIRECTOR_ASSIGN",
      status: "ผอ.กลุ่มงานบริหารติดตามคดีพิจารณาและมอบหมายนิติกร",
      assignedRole: "case_tracking_director",
      officer: "นายวิชัย ติดตามกิจ",
    },
    {
      id: "คำร้อง-100035/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      requesterName: "นายวรพล มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-28),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5115",
      l2AppealReceiveDate: getDateWithOffset(-8),
      l2AppealChannel: "เขต (เขต 5)",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100035/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าเอกสารการเบิกจ่ายงบประมาณดังกล่าวไม่ได้เกี่ยวข้องโดยตรงกับสำนวนที่อยู่ระหว่างไต่สวนของหน่วยงานอื่น จึงขอให้ทบทวนมติไม่อนุญาตเปิดเผยข้อมูล",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-5),
      l2AppealDeadlineOpinion: getDateWithOffset(2),
      l2AppealTrackingDirectorNotes: "-",
      statusCode: "L2_PENDING_CASE_OWNER_APPEAL_OPINION",
      status: "นิติกรเจ้าของสำนวนแจ้งผู้อุทธรณ์และทำความเห็น",
      assignedRole: "original_officer",
      officer: "นายสมชาย ใจซื่อ",
    },
    {
      id: "คำร้อง-100036/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-30),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5101",
      l2AppealReceiveDate: getDateWithOffset(-12),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100036/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบสวนวินัยดังกล่าวมีผลถึงที่สุดแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-9),
      l2AppealDeadlineOpinion: getDateWithOffset(-2),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการสอบสวนวินัยดังกล่าวได้ข้อยุติแล้วในทางปฏิบัติ ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE",
      status: "ผอ.กองบริหารคดีพิจารณาและลงนามเสนอกิจกรรมที่ 7",
      assignedRole: "case_bureau_director",
      officer: "นางปัทมา บริหารกิจ",
    },
    {
      id: "คำร้อง-100037/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      requesterName: "นายวรพล มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-32),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5108",
      l2AppealReceiveDate: getDateWithOffset(-15),
      l2AppealChannel: "เขต (เขต 2)",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100037/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าเอกสารการเบิกจ่ายงบประมาณดังกล่าวไม่ได้เกี่ยวข้องโดยตรงกับสำนวนที่อยู่ระหว่างไต่สวนของหน่วยงานอื่น จึงขอให้ทบทวนมติไม่อนุญาตเปิดเผยข้อมูล",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-12),
      l2AppealDeadlineOpinion: getDateWithOffset(-5),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าเอกสารดังกล่าวไม่กระทบต่อการไต่สวนของหน่วยงานอื่นแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(3),
      l2AppealAgendaNo: "2/2569",
      statusCode: "L2_PENDING_APPEAL_RULING",
      status: "คณะอนุกรรมการวินิจฉัยอุทธรณ์พิจารณาและมีคำวินิจฉัย",
      assignedRole: "appeal_ruling_subcommittee",
      officer: "นายสมพงษ์ วินิจฉัยกุล",
    },
    {
      id: "คำร้อง-100038/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-35),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5090",
      l2AppealReceiveDate: getDateWithOffset(-18),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100038/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบสวนวินัยดังกล่าวมีผลถึงที่สุดแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-15),
      l2AppealDeadlineOpinion: getDateWithOffset(-8),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการสอบสวนวินัยดังกล่าวได้ข้อยุติแล้วในทางปฏิบัติ ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-1),
      l2AppealAgendaNo: "1/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการสอบสวนวินัยดังกล่าวยุติแล้วในทางปฏิบัติ ข้อมูลที่ขอจึงไม่เข้าข้อยกเว้นตามกฎหมายว่าด้วยข้อมูลข่าวสารของราชการอีกต่อไป จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      statusCode: "L2_PENDING_APPEAL_MEMO",
      status: "ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์จัดทำบันทึกเสนอคณะกรรมการ ป.ป.ท.",
      assignedRole: "appeal_subcommittee_secretariat",
      officer: "นางสาวมาลี เสรีกิจ",
    },
    {
      id: "คำร้อง-100039/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      requesterName: "นายวรพล มั่นคง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการเบิกจ่ายงบประมาณโครงการฝึกอบรมเยาวชนต่อต้านทุจริต",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าเอกสารดังกล่าวเกี่ยวข้องกับคดีที่อยู่ระหว่างการไต่สวนของหน่วยงานอื่น จึงไม่อนุญาตให้เปิดเผยในชั้นนี้",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-38),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5085",
      l2AppealReceiveDate: getDateWithOffset(-21),
      l2AppealChannel: "เขต (เขต 7)",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100039/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าเอกสารการเบิกจ่ายงบประมาณดังกล่าวไม่ได้เกี่ยวข้องโดยตรงกับสำนวนที่อยู่ระหว่างไต่สวนของหน่วยงานอื่น จึงขอให้ทบทวนมติไม่อนุญาตเปิดเผยข้อมูล",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-18),
      l2AppealDeadlineOpinion: getDateWithOffset(-11),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าเอกสารดังกล่าวไม่กระทบต่อการไต่สวนของหน่วยงานอื่นแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-4),
      l2AppealAgendaNo: "1/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_PARTIAL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าเอกสารบางส่วนไม่กระทบต่อการไต่สวนของหน่วยงานอื่นแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมบางส่วนและเปิดเผยข้อมูลบางส่วน",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      statusCode: "L2_PENDING_TRACKING_DIRECTOR_SIGN",
      status: "ผอ.กลุ่มงานบริหารติดตามคดีลงนามรับรอง",
      assignedRole: "case_tracking_director",
      officer: "นายวิชัย ติดตามกิจ",
    },
    {
      id: "คำร้อง-100040/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยร้ายแรงเจ้าหน้าที่ระดับสูง",
      requesterName: "นางสาวรัตนา ตรวจสอบ",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยร้ายแรงของเจ้าหน้าที่ระดับสูง",
      relatedCaseNo: "คดี-100018/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-40),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5080",
      l2AppealReceiveDate: getDateWithOffset(-24),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100040/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบสวนวินัยดังกล่าวมีผลถึงที่สุดแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-20),
      l2AppealDeadlineOpinion: getDateWithOffset(-13),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการสอบสวนวินัยดังกล่าวได้ข้อยุติแล้วในทางปฏิบัติ ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-6),
      l2AppealAgendaNo: "1/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการสอบสวนวินัยดังกล่าวยุติแล้วในทางปฏิบัติ จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5511",
      l2AppealBoardDispatchDocNo: "ปป 0002/5255",
      l2AppealBoardDispatchDate: getDateWithOffset(-5),
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE",
      status: "ผอ.กองบริหารคดีพิจารณาและลงนามเสนอกิจกรรมที่ 7",
      assignedRole: "case_bureau_director",
      officer: "นางปัทมา บริหารกิจ",
    },
    {
      id: "คำร้อง-100041/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยผลการตรวจสอบทรัพย์สินและหนี้สินของเจ้าหน้าที่รัฐ",
      requesterName: "นายสมบูรณ์ เรียกร้องสิทธิ์",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "ผลการตรวจสอบทรัพย์สินและหนี้สินของเจ้าหน้าที่รัฐระดับสูง",
      relatedCaseNo: "คดี-100022/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าข้อมูลดังกล่าวอยู่ระหว่างการตรวจสอบ หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 1",
      l2DenyAssignDate: getDateWithOffset(-45),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5091",
      l2AppealReceiveDate: getDateWithOffset(-30),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100041/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าข้อมูลที่ขอเป็นข้อมูลสาธารณะตามกฎหมายว่าด้วยการตรวจสอบทรัพย์สิน จึงขอให้ทบทวนมติไม่อนุญาตเปิดเผย",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-26),
      l2AppealDeadlineOpinion: getDateWithOffset(-19),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าข้อมูลดังกล่าวเข้าข้อยกเว้นบางส่วนเท่านั้น ควรพิจารณาเปิดเผยบางส่วนตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-12),
      l2AppealAgendaNo: "2/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_PARTIAL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าข้อมูลบางส่วนเข้าข้อยกเว้นตามกฎหมาย จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมบางส่วนและเปิดเผยข้อมูลเฉพาะส่วนที่ไม่กระทบกระบวนการตรวจสอบ",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      /* เดิม statusCode นี้คือ L2_PENDING_APPEAL_BOARD_DISPATCH (รอ appeal-10
         ออกเลขส่งแยกหน้า) — appeal-10 ถูกตัดออกจาก flow แล้ว (รวมเข้า appeal-07)
         จึงไม่มีสถานะนี้อีกต่อไป ปรับให้สอดคล้องกับ flow ใหม่: appeal-07 ออกเลขส่ง
         ให้แล้ว เหลือรอ ผอ.กองบริหารคดี ลงนามเสนอที่ appeal-09 เท่านั้น (เหมือน
         คำร้อง-100040/2569 ด้านบน) */
      l2AppealMemoInternalDocNo: "ปป 0002/5498",
      l2AppealBoardDispatchDocNo: "ปป 0002/5228",
      l2AppealBoardDispatchDate: getDateWithOffset(-11),
      statusCode: "L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE",
      status: "ผอ.กองบริหารคดีพิจารณาและลงนามเสนอกิจกรรมที่ 7",
      assignedRole: "case_bureau_director",
      officer: "นางปัทมา บริหารกิจ",
    },
    {
      id: "คำร้อง-100042/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการจัดซื้อจัดจ้างโครงการก่อสร้าง",
      requesterName: "นายประเสริฐ ยื่นคำร้อง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการจัดซื้อจัดจ้างโครงการก่อสร้างของหน่วยงานรัฐ",
      relatedCaseNo: "คดี-100025/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการตรวจสอบยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-60),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5075",
      l2AppealReceiveDate: getDateWithOffset(-45),
      l2AppealChannel: "เขต",
      l2AppealChannelDetail: "เขต 3",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100042/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าโครงการก่อสร้างดังกล่าวแล้วเสร็จและตรวจรับแล้ว จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-41),
      l2AppealDeadlineOpinion: getDateWithOffset(-34),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าโครงการดังกล่าวตรวจรับงานเสร็จสิ้นแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-27),
      l2AppealAgendaNo: "3/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าโครงการตรวจรับงานเสร็จสิ้นแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5487",
      l2AppealBoardDispatchDocNo: "ปป 0002/5241",
      l2AppealBoardDispatchDate: getDateWithOffset(-14),
      statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD",
      status: "รอมติบอร์ดตอบกลับ",
      assignedRole: "case_bureau_admin",
      officer: "นางนิชาดา ธุรการกิจ",
    },
    {
      id: "คำร้อง-100043/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบข้อเท็จจริงกรณีร้องเรียนเจ้าหน้าที่รับสินบน",
      requesterName: "นายทวีศักดิ์ อุทธรณ์ดี",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานผลการสอบข้อเท็จจริงกรณีร้องเรียนเจ้าหน้าที่รัฐรับสินบน",
      relatedCaseNo: "คดี-100028/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบข้อเท็จจริงยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการสอบสวน จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 2",
      l2DenyAssignDate: getDateWithOffset(-70),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5062",
      l2AppealReceiveDate: getDateWithOffset(-55),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100043/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบข้อเท็จจริงดังกล่าวยุติแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-51),
      l2AppealDeadlineOpinion: getDateWithOffset(-44),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการสอบข้อเท็จจริงดังกล่าวได้ข้อยุติแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-37),
      l2AppealAgendaNo: "4/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการสอบข้อเท็จจริงดังกล่าวยุติแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5476",
      l2AppealBoardDispatchDocNo: "ปป 0002/5219",
      l2AppealBoardDispatchDate: getDateWithOffset(-24),
      /* มติบอร์ดที่ทราบผลแล้ว (จำลองไว้ล่วงหน้าเพื่อความหลากหลายของข้อมูลทดสอบ) —
         เดิม statusCode นี้คือ L2_APPEAL_BOARD_RESOLVED (สถานะคั่นกลาง รอ appeal-11
         ธุรการบันทึกมติบอร์ดแยกหน้า) — appeal-11 ถูกตัดออกจาก flow แล้ว ตอนนี้
         [H2] เขียนค่ามติบอร์ดตรงเข้า case แล้ว route เข้า case_tracking_secretary
         (appeal-12) ทันที จึงปรับสถานะและผู้รับผิดชอบให้ตรงกับ flow ใหม่ พร้อม
         เติมฟิลด์ที่ [H2] จะเขียน (BoardReplyDocNo/Date, ResolutionNotes) สอดคล้อง
         กับมติของคณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ ที่ appeal-06 (REVERSE_FULL) */
      l2AppealBoardResolutionType: "DISCLOSE",
      l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลทั้งหมด",
      l2AppealBoardReplyDocNo: "ปป 0002/5312",
      l2AppealBoardReplyDate: getDateWithOffset(-10),
      l2AppealBoardResolutionNotes: "-",
      statusCode: "L2_PENDING_APPEAL_NOTICE_DRAFT",
      status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ",
      assignedRole: "case_tracking_secretary",
      officer: "นางสาวสุดา คดีเที่ยง",
    },
    {
      id: "คำร้อง-100044/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการเบิกจ่ายค่าล่วงเวลาเจ้าหน้าที่",
      requesterName: "นางสาวเพ็ญศรี ขอความเป็นธรรม",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการเบิกจ่ายค่าล่วงเวลาของเจ้าหน้าที่หน่วยงานรัฐ",
      relatedCaseNo: "คดี-100030/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการตรวจสอบยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 1",
      l2DenyAssignDate: getDateWithOffset(-75),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5054",
      l2AppealReceiveDate: getDateWithOffset(-60),
      l2AppealChannel: "เขต",
      l2AppealChannelDetail: "เขต 5",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100044/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าข้อมูลที่ขอเข้าข้อยกเว้นบางส่วนเท่านั้น จึงขอให้ทบทวนและเปิดเผยข้อมูลบางส่วน",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-56),
      l2AppealDeadlineOpinion: getDateWithOffset(-49),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าข้อมูลบางส่วนเข้าข้อยกเว้นตามกฎหมาย ควรพิจารณาเปิดเผยเฉพาะส่วนที่ไม่กระทบกระบวนการตรวจสอบ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-42),
      l2AppealAgendaNo: "5/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_PARTIAL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าข้อมูลบางส่วนเข้าข้อยกเว้นตามกฎหมาย จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมบางส่วนและเปิดเผยข้อมูลเฉพาะส่วนที่ไม่กระทบกระบวนการตรวจสอบ",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5463",
      l2AppealBoardDispatchDocNo: "ปป 0002/5203",
      l2AppealBoardDispatchDate: getDateWithOffset(-19),
      /* มติบอร์ด — สอดคล้องกับมติของคณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ ที่ appeal-06
         (REVERSE_PARTIAL) — สถานะปรับตามหมายเหตุที่ 100043 ด้านบน (appeal-11 ถูกตัด
         ออกจาก flow แล้ว) */
      l2AppealBoardResolutionType: "PARTIAL",
      l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลบางส่วน",
      l2AppealBoardReplyDocNo: "ปป 0002/5296",
      l2AppealBoardReplyDate: getDateWithOffset(-15),
      l2AppealBoardResolutionNotes: "-",
      statusCode: "L2_PENDING_APPEAL_NOTICE_DRAFT",
      status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ",
      assignedRole: "case_tracking_secretary",
      officer: "นางสาวสุดา คดีเที่ยง",
    },
    {
      id: "คำร้อง-100045/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการสอบสวนวินัยกรณีทุจริตการจัดซื้อยา",
      requesterName: "นายอนันต์ ตรวจสอบยุติธรรม",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานผลการสอบสวนวินัยกรณีทุจริตการจัดซื้อยาของโรงพยาบาลรัฐ",
      relatedCaseNo: "คดี-100031/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการสอบสวนวินัยยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อสิทธิของผู้ถูกกล่าวหาและกระบวนการทางวินัย จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 4",
      l2DenyAssignDate: getDateWithOffset(-80),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5041",
      l2AppealReceiveDate: getDateWithOffset(-65),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100045/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการสอบสวนวินัยดังกล่าวมีผลถึงที่สุดแล้วในทางปฏิบัติ จึงขอให้ทบทวนมติดังกล่าว",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-61),
      l2AppealDeadlineOpinion: getDateWithOffset(-54),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการสอบสวนวินัยดังกล่าวยังไม่ถึงที่สุด เห็นควรยืนตามมติเดิม",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-47),
      l2AppealAgendaNo: "6/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "UPHOLD",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการสอบสวนวินัยดังกล่าวยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการทางวินัย จึงมีคำวินิจฉัยให้ยืนตามคำสั่งเดิม (ไม่เปิดเผยข้อมูล)",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5450",
      l2AppealBoardDispatchDocNo: "ปป 0002/5187",
      l2AppealBoardDispatchDate: getDateWithOffset(-15),
      /* มติบอร์ด — สอดคล้องกับมติของคณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ ที่ appeal-06
         (UPHOLD) — สถานะปรับตามหมายเหตุที่ 100043 ด้านบน (appeal-11 ถูกตัดออกจาก
         flow แล้ว) */
      l2AppealBoardResolutionType: "DENY",
      l2AppealBoardResolutionTypeName: "ไม่เปิดเผยข้อมูล",
      l2AppealBoardReplyDocNo: "ปป 0002/5280",
      l2AppealBoardReplyDate: getDateWithOffset(-20),
      l2AppealBoardResolutionNotes: "-",
      statusCode: "L2_PENDING_APPEAL_NOTICE_DRAFT",
      status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ",
      assignedRole: "case_tracking_secretary",
      officer: "นางสาวสุดา คดีเที่ยง",
    },
    {
      id: "คำร้อง-100046/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการเบิกจ่ายเงินสวัสดิการ",
      requesterName: "นางวิไล ขอความจริง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการเบิกจ่ายเงินสวัสดิการของหน่วยงานรัฐ",
      relatedCaseNo: "คดี-100033/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการตรวจสอบยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 5",
      l2DenyAssignDate: getDateWithOffset(-85),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5028",
      l2AppealReceiveDate: getDateWithOffset(-70),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100046/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการตรวจสอบดังกล่าวยุติแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-66),
      l2AppealDeadlineOpinion: getDateWithOffset(-59),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการตรวจสอบดังกล่าวได้ข้อยุติแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-52),
      l2AppealAgendaNo: "7/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการตรวจสอบดังกล่าวยุติแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5437",
      l2AppealBoardDispatchDocNo: "ปป 0002/5165",
      l2AppealBoardDispatchDate: getDateWithOffset(-29),
      l2AppealBoardResolutionType: "DISCLOSE",
      l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลทั้งหมด",
      l2AppealBoardReplyDocNo: "ปป 0002/5329",
      l2AppealBoardReplyDate: getDateWithOffset(-9),
      l2AppealBoardResolutionNotes: "-",
      statusCode: "L2_PENDING_APPEAL_NOTICE_DRAFT",
      status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ",
      assignedRole: "case_tracking_secretary",
      officer: "นางสาวสุดา คดีเที่ยง",
    },
    {
      id: "คำร้อง-100047/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการใช้รถราชการ",
      requesterName: "นายสมหวัง ตรวจสอบดี",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการใช้รถราชการของหน่วยงานรัฐ",
      relatedCaseNo: "คดี-100036/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการตรวจสอบยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 3",
      l2DenyAssignDate: getDateWithOffset(-90),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5017",
      l2AppealReceiveDate: getDateWithOffset(-75),
      l2AppealChannel: "ส่วนกลาง",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100047/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการตรวจสอบดังกล่าวยุติแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-71),
      l2AppealDeadlineOpinion: getDateWithOffset(-64),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการตรวจสอบดังกล่าวได้ข้อยุติแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-57),
      l2AppealAgendaNo: "8/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการตรวจสอบดังกล่าวยุติแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5424",
      l2AppealBoardDispatchDocNo: "ปป 0002/5152",
      l2AppealBoardDispatchDate: getDateWithOffset(-34),
      l2AppealBoardResolutionType: "DISCLOSE",
      l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลทั้งหมด",
      l2AppealBoardReplyDocNo: "ปป 0002/5301",
      l2AppealBoardReplyDate: getDateWithOffset(-14),
      l2AppealBoardResolutionNotes: "-",
      l2AppealNoticeDraftDocNo: "ปป 0002/5412",
      l2AppealNoticeDraftDate: getDateWithOffset(-4),
      l2AppealNoticeDraftNotes: "-",
      l2AppealNoticeDraftAttachmentFileNames: [],
      statusCode: "L2_PENDING_APPEAL_CASE_OWNER_NOTIFY",
      status: "นิติกรเจ้าของสำนวนแจ้งผลผู้อุทธรณ์",
      assignedRole: "original_officer",
      officer: "นายสมชาย ใจซื่อ",
    },
    {
      id: "คำร้อง-100048/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการเบิกจ่ายค่าเช่าอาคารสำนักงาน",
      requesterName: "นางสาวพรทิพย์ ยืนยันสิทธิ์",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการเบิกจ่ายค่าเช่าอาคารสำนักงานของหน่วยงานรัฐ",
      relatedCaseNo: "คดี-100038/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าการตรวจสอบยังไม่ถึงที่สุด หากเปิดเผยจะกระทบต่อกระบวนการตรวจสอบ จึงไม่อนุญาตให้เปิดเผย",
      l2DenyAssignedDept: "กองปราบปรามการทุจริตในภาครัฐ 4",
      l2DenyAssignDate: getDateWithOffset(-95),
      l2DenyAssignNotes:
        "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอส่งคืนต้นฉบับเอกสารมาพร้อมหนังสือฉบับนี้ เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป",
      l2AppealReceiveNo: "ปป 0002/5006",
      l2AppealReceiveDate: getDateWithOffset(-80),
      l2AppealChannel: "เขต",
      l2AppealChannelDetail: "เขต 2",
      l2AppealReceiveNotes: "-",
      l2AppealAttachmentFileNames: ["หนังสืออุทธรณ์.pdf"],
      l2AppealSystemNo: "อธ-100048/2569",
      l2AppealSummary:
        "ผู้อุทธรณ์เห็นว่าการตรวจสอบดังกล่าวยุติแล้วในทางปฏิบัติ จึงไม่มีเหตุผลที่จะระงับการเปิดเผยข้อมูลอีกต่อไป",
      l2AppealBureauDirectorNotes: "-",
      l2AppealDeadlineNotify: getDateWithOffset(-76),
      l2AppealDeadlineOpinion: getDateWithOffset(-69),
      l2AppealTrackingDirectorNotes: "-",
      l2AppealCaseOwnerOpinion:
        "นิติกรเจ้าของสำนวนเห็นว่าการตรวจสอบดังกล่าวได้ข้อยุติแล้ว ไม่ขัดข้องหากจะเปิดเผยข้อมูลตามที่ผู้อุทธรณ์ร้องขอ",
      l2AppealCaseOwnerAttachmentFileNames: [],
      l2AppealMeetingDate: getDateWithOffset(-62),
      l2AppealAgendaNo: "9/2569",
      l2AppealAgendaNotes: "-",
      l2AppealRulingType: "REVERSE_FULL",
      l2AppealRulingReason:
        "คณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาแล้วเห็นว่าการตรวจสอบดังกล่าวยุติแล้ว จึงมีคำวินิจฉัยให้กลับคำสั่งเดิมและเปิดเผยข้อมูลทั้งหมด",
      l2AppealRulingAttachmentFileNames: [],
      l2AppealMemoNotes: "-",
      l2AppealMemoAttachmentFileNames: [],
      l2AppealTrackingSignNotes: "-",
      l2AppealTrackingSignAttachmentFileNames: [],
      l2AppealBoardProposeNotes: "-",
      l2AppealBoardProposeAttachmentFileNames: [],
      l2AppealMemoInternalDocNo: "ปป 0002/5411",
      l2AppealBoardDispatchDocNo: "ปป 0002/5138",
      l2AppealBoardDispatchDate: getDateWithOffset(-39),
      l2AppealBoardResolutionType: "DISCLOSE",
      l2AppealBoardResolutionTypeName: "ให้เปิดเผยข้อมูลทั้งหมด",
      l2AppealBoardReplyDocNo: "ปป 0002/5288",
      l2AppealBoardReplyDate: getDateWithOffset(-19),
      l2AppealBoardResolutionNotes: "-",
      l2AppealNoticeDraftDocNo: "ปป 0002/5389",
      l2AppealNoticeDraftDate: getDateWithOffset(-9),
      l2AppealNoticeDraftNotes: "-",
      l2AppealNoticeDraftAttachmentFileNames: [],
      l2AppealNotifyDate: getDateWithOffset(-3),
      l2AppealNotifyChannel: "ส่วนกลาง",
      l2AppealNotifyChannelDetail: "-",
      l2AppealNotifyNotes: "-",
      l2AppealExpectedReceiptDate: getDateWithOffset(2),
      statusCode: "L2_APPEAL_CASE_CLOSED_NOTIFIED",
      status: "สิ้นสุด — แจ้งผลผู้อุทธรณ์แล้ว",
      statusBadge: "bg-success text-white",
      assignedRole: "original_officer",
      officer: "นายสมชาย ใจซื่อ",
    },

    /* --------------------------------------------------- FLOW 3 (ตัวอย่าง)
       DISCLOSE/PARTIAL + คดีเสร็จสิ้นแล้ว (l2CaseState: "CLOSED") — ทดสอบหน้า
       10-2-22 ถึง 10-2-24 ที่เพิ่มใหม่ (statusCode/status ของแต่ละคำร้องคือคู่ที่
       STEPS "ก่อนหน้า" เขียนไว้ ตามรูปแบบเดียวกับตัวอย่างสาย DENY ด้านบน) */
    {
      id: "คำร้อง-100021/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการตรวจสอบการจัดซื้อวัสดุครุภัณฑ์สำนักงาน",
      requesterName: "นางสาวอรวรรณ ใจตรง",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานการตรวจสอบการจัดซื้อวัสดุครุภัณฑ์สำนักงาน",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าคดีนี้เสร็จสิ้นแล้ว และข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว การเปิดเผยข้อมูลจึงไม่กระทบต่อการไต่สวนอีกต่อไป",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-9),
      l2BoardApprovalRef: "ปป 0001/ว.138",
      l2BoardApprovalDate: getDateWithOffset(-4),
      l2ReceiveNotes: "",
      statusCode: "L2_PENDING_CLOSE_MEMO",
      status: "ฝ่ายเลขานุการฯ จัดทำบันทึกและมติ (คดีเสร็จสิ้นแล้ว)",
      assignedRole: "sub_secretariat",
      officer: "นางสาวพิมพ์ชนก ธรรมรักษ์",
    },
    {
      id: "คำร้อง-100022/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารสรุปผลการไต่สวนข้อเท็จจริงเบื้องต้น",
      requesterName: "นายสุเมธ พากเพียร",
      requesterTypeName: "ทนายความ",
      requestedInfo: "เอกสารสรุปผลการไต่สวนข้อเท็จจริงเบื้องต้น",
      relatedCaseNo: "คดี-100022/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสือมอบอำนาจ.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าคดีนี้เสร็จสิ้นแล้ว จึงเห็นควรอนุญาตให้เปิดเผยบางส่วน โดยปกปิดข้อมูลส่วนบุคคลที่อ่อนไหว",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว แต่ยังต้องปกปิดข้อมูลส่วนบุคคลของบุคคลที่สาม",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-9),
      l2InternalDocNo: "ปป 0002/4512",
      l2CloseMemoText:
        "ตามที่ นายสุเมธ พากเพียร ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยเอกสารสรุปผลการไต่สวนข้อเท็จจริงเบื้องต้น นั้น คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยบางส่วน และคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว จึงเรียนมาเพื่อโปรดพิจารณาเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2Signatures: {
        closeMemoProposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ",
        },
      },
      l2CloseMemoDocNo: "ปป 0002/4512",
      statusCode: "L2_PENDING_CLOSE_PROPOSE",
      status: "ผอ.กองกฎหมายพิจารณาเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี",
    },
    {
      id: "คำร้อง-100023/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานการประชุมคณะกรรมการตรวจรับพัสดุ",
      requesterName: "นางวิไลลักษณ์ ศรีสุข",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "รายงานการประชุมคณะกรรมการตรวจรับพัสดุ",
      relatedCaseNo: "-",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: [
        "คำร้องขอเปิดเผยข้อมูล.pdf",
        "หนังสือรับรองสื่อมวลชน.pdf",
      ],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าคดีนี้เสร็จสิ้นแล้ว และข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยทั้งหมด",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว และเป็นข้อมูลข่าวสารทั่วไป",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "7/2569",
      l2MeetingDate: getDateWithOffset(-16),
      l2InternalDocNo: "ปป 0002/4508",
      l2CloseMemoText:
        "ตามที่ นางวิไลลักษณ์ ศรีสุข ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยรายงานการประชุมคณะกรรมการตรวจรับพัสดุ นั้น คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยข้อมูล และคดีที่เกี่ยวข้องเสร็จสิ้นแล้ว จึงเรียนมาเพื่อโปรดพิจารณาเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2Signatures: {
        closeMemoProposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-10),
          position: "อนุกรรมการและเลขานุการ",
        },
        closePropose: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-9),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2CloseMemoDocNo: "ปป 0002/4508",
      statusCode: "L2_PENDING_CLOSE_DISPATCH_COMMITTEE",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    /* ---- เติมคำร้องเดียวที่ยังขาดในตาราง 3 มติ x 2 สถานะคดี ------------------
       DENY ไม่มีขั้นตอนที่แยกตาม l2CaseState เลย (สาย DENY เดินหน้าเดียวกันหมด
       ไม่ว่าสถานะคดีจะเป็นอะไร — ดู STEPS ใน ecmis-10-2.js) แต่ 01-work-inbox.html
       ยังอ่าน l2CaseState มาขึ้นแบดจ์คู่กับมติบอร์ดเสมอ (fallback เป็น
       "อยู่ระหว่างไต่สวน" ถ้าไม่ระบุ) คำร้อง 100012/100017-100020 ทั้งหมดไม่มี
       l2CaseState เลยขึ้นแบดจ์ INVESTIGATING โดย fallback อยู่แล้ว ส่วนคำร้องนี้
       ระบุ CLOSED ตรงๆ เพื่อให้เห็นครบทั้ง 6 ช่องของตาราง (DISCLOSE/PARTIAL/DENY
       x INVESTIGATING/CLOSED) ในคิวงาน */
    {
      id: "คำร้อง-100024/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการไต่สวนคดีทุจริตจัดซื้อจัดจ้างที่สิ้นสุดแล้ว",
      requesterName: "นางสาวกมลชนก ยืนหยัด",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo:
        "รายงานผลการไต่สวนคดีทุจริตจัดซื้อจัดจ้างที่คณะกรรมการ ป.ป.ท. มีมติชี้มูลแล้ว",
      relatedCaseNo: "คดี-100024/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DENY",
      l2ResolutionTypeName: "ไม่อนุญาตเปิดเผย",
      l2ResolutionDetail:
        "คณะอนุกรรมการฯ เห็นว่าแม้คดีจะเสร็จสิ้นแล้ว แต่รายงานผลการไต่สวนมีข้อมูลส่วนบุคคลและพยานหลักฐานที่อ่อนไหวเข้าข้อยกเว้นตามมาตรา 15 จึงไม่อนุญาตให้เปิดเผย",
      l2CommitteeOpinion:
        "คณะอนุกรรมการฯ เห็นว่าการเปิดเผยรายงานผลการไต่สวนแม้คดีจะยุติแล้วก็อาจกระทบสิทธิของบุคคลที่เกี่ยวข้อง",
      l2CaseState: "CLOSED",
      l2CaseStateName: "คดีเสร็จสิ้นแล้ว",
      l2MeetingNo: "8/2569",
      l2MeetingDate: getDateWithOffset(-10),
      l2InternalDocNo: "ปป 0002/4515",
      l2Signatures: {
        proposer: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "อนุกรรมการและเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ",
        },
        dirLegalOpinion: {
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      l2BoardApprovalRef: "ปป 0001/ว.140",
      l2BoardApprovalDate: getDateWithOffset(-3),
      l2ReceiveNotes: "",
      statusCode: "L2_PENDING_DENY_MEMO",
      status: "ฝ่ายเลขานุการฯ จัดทำบันทึกและมติไม่อนุญาตเปิดเผยข้อมูล",
      assignedRole: "sub_secretariat",
      officer: "น.ส.พิมพ์ชนก ทองดี",
    },
    /* ---- Flow 2 Part 1 (ใหม่) — รอบเสนอกิจกรรมที่ 7 ครั้งที่ 2 สำหรับ
       DISCLOSE/PARTIAL + อยู่ระหว่างไต่สวน (10-2-25 ถึง 10-2-29) — คำร้อง 1
       รายการต่อ 1 สถานะ เรียงลำดับความคืบหน้าจากน้อยไปมาก เพื่อให้ทดสอบทุกหน้า
       ได้ทันทีโดยไม่ต้องไล่เดินคำร้องเดิมทีละขั้น ดูแผนเต็มที่
       docs/10-2-flow2-part1-committee-referral.md */
    {
      id: "คำร้อง-100029/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานความคืบหน้าการตรวจสอบโครงการก่อสร้างอาคารสำนักงาน",
      requesterName: "นายวรวุฒิ ยุติธรรม",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "รายงานความคืบหน้าการตรวจสอบโครงการก่อสร้างอาคารสำนักงานที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100029/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail: "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอไม่กระทบต่อการไต่สวนที่ยังดำเนินอยู่",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2BoardApprovalRef: "ปป 0001/ว.141",
      l2BoardApprovalDate: getDateWithOffset(-3),
      l2ReceiveNotes: "",
      l2Signatures: {
        proposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-2),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_PENDING_COMMITTEE_MEMO_DRAFT",
      status: "ฝ่ายเลขานุการฯ จัดทำมติคณะอนุกรรมการฯ และบันทึกเสนอเลขาธิการ",
      assignedRole: "sub_secretariat",
      officer: "น.ส.พิมพ์ชนก ทองดี",
    },
    {
      id: "คำร้อง-100030/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตจัดซื้อวัสดุก่อสร้าง",
      requesterName: "นางสาวปิยะดา ซื่อตรง",
      requesterTypeName: "ทนายความ",
      requestedInfo: "เอกสารการไต่สวนกรณีทุจริตจัดซื้อวัสดุก่อสร้างที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100030/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสือมอบอำนาจ.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail: "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะบางส่วน โดยปกปิดข้อมูลส่วนบุคคลที่อ่อนไหว เนื่องจากอยู่ระหว่างการไต่สวน",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลบางส่วนต้องปกปิดเพื่อไม่ให้กระทบการไต่สวนที่ยังดำเนินอยู่",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2CommitteeSheetFacts: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้ตรวจสอบคำร้องและเอกสารประกอบแล้ว เห็นว่าข้อเท็จจริงตามคำร้องเป็นไปตามที่ผู้ยื่นคำขอระบุ ไม่มีข้อโต้แย้งเพิ่มเติม",
      l2CommitteeSheetDataOwner: "กองกฎหมาย สำนักงาน ป.ป.ท.",
      l2CommitteeMemoDivisionName: "กกม. (ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ)",
      l2CommitteeMemoDivisionPhone: "1801",
      l2CommitteeMemoAddressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท. (ผ่าน ผอ.กกม.)",
      l2CommitteeMemoMeetingVenue: "ห้องประชุมกองกฎหมาย ชั้น 4 สำนักงาน ป.ป.ท.",
      l2CommitteeMemoBackground: "ด้วย นางสาวปิยะดา ซื่อตรง ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตจัดซื้อวัสดุก่อสร้าง ต่อสำนักงาน ป.ป.ท.",
      l2CommitteeMemoLegalBasis: "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544",
      l2CommitteeMemoConsiderations: "เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบมติของคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามที่เสนอ",
      l2CommitteeMemoResolutionText: "ในการประชุมครั้งที่ 9/2569 คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยบางส่วน ตามคำร้องของนางสาวปิยะดา ซื่อตรง จึงเรียนมาเพื่อโปรดพิจารณา",
      l2CommitteeMemoDocNo: "ปป 0002/4530",
      l2CommitteeMemoDocDate: "3 กันยายน 2569",
      l2Signatures: {
        committeeMemoProposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-4),
          position: "อนุกรรมการและเลขานุการ",
        },
      },
      statusCode: "L2_PENDING_COMMITTEE_DIRECTOR_OPINION",
      status: "ผอ.กองกฎหมายพิจารณาให้ความเห็น",
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี",
    },
    {
      id: "คำร้อง-100033/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยรายงานความคืบหน้าการไต่สวนกรณีทุจริตจัดจ้างที่ปรึกษา",
      requesterName: "นางสาวรุ่งนภา แจ่มใส",
      requesterTypeName: "ทนายความ",
      requestedInfo: "รายงานความคืบหน้าการไต่สวนกรณีทุจริตจัดจ้างที่ปรึกษาที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100033/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf", "หนังสือมอบอำนาจ.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail: "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอไม่กระทบต่อการไต่สวนที่ยังดำเนินอยู่",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2CommitteeSheetFacts: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้ตรวจสอบคำร้องและเอกสารประกอบแล้ว เห็นว่าข้อเท็จจริงตามคำร้องเป็นไปตามที่ผู้ยื่นคำขอระบุ ไม่มีข้อโต้แย้งเพิ่มเติม",
      l2CommitteeSheetDataOwner: "กองกฎหมาย สำนักงาน ป.ป.ท.",
      l2CommitteeMemoDivisionName: "กกม. (ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ)",
      l2CommitteeMemoDivisionPhone: "1801",
      l2CommitteeMemoAddressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท. (ผ่าน ผอ.กกม.)",
      l2CommitteeMemoMeetingVenue: "ห้องประชุมกองกฎหมาย ชั้น 4 สำนักงาน ป.ป.ท.",
      l2CommitteeMemoBackground: "ด้วย นางสาวรุ่งนภา แจ่มใส ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยรายงานความคืบหน้าการไต่สวนกรณีทุจริตจัดจ้างที่ปรึกษา ต่อสำนักงาน ป.ป.ท.",
      l2CommitteeMemoLegalBasis: "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544",
      l2CommitteeMemoConsiderations: "เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบมติของคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามที่เสนอ",
      l2CommitteeMemoResolutionText: "ในการประชุมครั้งที่ 9/2569 คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยข้อมูล ตามคำร้องของนางสาวรุ่งนภา แจ่มใส จึงเรียนมาเพื่อโปรดพิจารณา",
      l2CommitteeMemoDocNo: "ปป 0002/4533",
      l2CommitteeMemoDocDate: "31 สิงหาคม 2569",
      l2CommitteeDirectorOpinionText: "เห็นชอบตามที่ฝ่ายเลขานุการฯ เสนอ เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2Signatures: {
        committeeMemoProposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-7),
          position: "อนุกรรมการและเลขานุการ",
        },
        committeeDirectorOpinion: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-6),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_PENDING_COMMITTEE_DISPATCH",
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท.",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    {
      id: "คำร้อง-100034/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตเบิกจ่ายค่าเช่ารถยนต์ราชการ",
      requesterName: "นายชัยวัฒน์ ก้าวหน้า",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการไต่สวนกรณีทุจริตเบิกจ่ายค่าเช่ารถยนต์ราชการที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100034/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "PARTIAL",
      l2ResolutionTypeName: "อนุญาตเปิดเผยบางส่วน",
      l2ResolutionDetail: "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยเฉพาะบางส่วน โดยปกปิดข้อมูลส่วนบุคคลที่อ่อนไหว เนื่องจากอยู่ระหว่างการไต่สวน",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลบางส่วนต้องปกปิดเพื่อไม่ให้กระทบการไต่สวนที่ยังดำเนินอยู่",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2CommitteeSheetFacts: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้ตรวจสอบคำร้องและเอกสารประกอบแล้ว เห็นว่าข้อเท็จจริงตามคำร้องเป็นไปตามที่ผู้ยื่นคำขอระบุ ไม่มีข้อโต้แย้งเพิ่มเติม",
      l2CommitteeSheetDataOwner: "กองกฎหมาย สำนักงาน ป.ป.ท.",
      l2CommitteeMemoDivisionName: "กกม. (ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ)",
      l2CommitteeMemoDivisionPhone: "1801",
      l2CommitteeMemoAddressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท. (ผ่าน ผอ.กกม.)",
      l2CommitteeMemoMeetingVenue: "ห้องประชุมกองกฎหมาย ชั้น 4 สำนักงาน ป.ป.ท.",
      l2CommitteeMemoBackground: "ด้วย นายชัยวัฒน์ ก้าวหน้า ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตเบิกจ่ายค่าเช่ารถยนต์ราชการ ต่อสำนักงาน ป.ป.ท.",
      l2CommitteeMemoLegalBasis: "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544",
      l2CommitteeMemoConsiderations: "เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบมติของคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามที่เสนอ",
      l2CommitteeMemoResolutionText: "ในการประชุมครั้งที่ 9/2569 คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยบางส่วน ตามคำร้องของนายชัยวัฒน์ ก้าวหน้า จึงเรียนมาเพื่อโปรดพิจารณา",
      l2CommitteeMemoDocNo: "ปป 0002/4534",
      l2CommitteeMemoDocDate: "30 สิงหาคม 2569",
      l2CommitteeDirectorOpinionText: "เห็นชอบตามที่ฝ่ายเลขานุการฯ เสนอ เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2CommitteeDispatchDocNo: "ปป 0002/4535",
      l2CommitteeDispatchDocDate: getDateWithOffset(-1),
      l2CommitteeDispatchDate: getDateWithOffset(-1),
      l2CommitteeDispatchNotes: "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอนำเสนอรองเลขาธิการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบตามมติของคณะอนุกรรมการฯ ที่เสนอ",
      l2Signatures: {
        committeeMemoProposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-8),
          position: "อนุกรรมการและเลขานุการ",
        },
        committeeDirectorOpinion: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-7),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_READY_FOR_BOARD_ROUND2",
      status: "มติบอร์ด ตอบกลับแล้ว",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    {
      id: "คำร้อง-100038/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารสัญญาจัดซื้อจัดจ้างที่อยู่ระหว่างไต่สวนทุจริต",
      requesterName: "นางสาวปิยะดา แสงทอง",
      requesterTypeName: "สื่อมวลชน",
      requestedInfo: "เอกสารสัญญาจัดซื้อจัดจ้างและบันทึกการไต่สวนกรณีทุจริตจัดซื้อจัดจ้างที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100038/2569",
      requestChannelName: "ยื่นทางไปรษณีย์",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail: "คณะอนุกรรมการฯ เห็นควรอนุญาตเปิดเผยข้อมูลตามคำร้อง เนื่องจากไม่กระทบต่อการไต่สวนที่ดำเนินอยู่",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลตามคำร้องไม่มีส่วนที่กระทบต่อการไต่สวนหรือสิทธิของบุคคลที่สาม",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2CommitteeSheetFacts: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้ตรวจสอบคำร้องและเอกสารประกอบแล้ว เห็นว่าข้อเท็จจริงตามคำร้องเป็นไปตามที่ผู้ยื่นคำขอระบุ ไม่มีข้อโต้แย้งเพิ่มเติม",
      l2CommitteeSheetDataOwner: "กองกฎหมาย สำนักงาน ป.ป.ท.",
      l2CommitteeMemoDivisionName: "กกม. (ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ)",
      l2CommitteeMemoDivisionPhone: "1801",
      l2CommitteeMemoAddressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท. (ผ่าน ผอ.กกม.)",
      l2CommitteeMemoMeetingVenue: "ห้องประชุมกองกฎหมาย ชั้น 4 สำนักงาน ป.ป.ท.",
      l2CommitteeMemoBackground: "ด้วย นางสาวปิยะดา แสงทอง ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยเอกสารสัญญาจัดซื้อจัดจ้างที่อยู่ระหว่างไต่สวนทุจริต ต่อสำนักงาน ป.ป.ท.",
      l2CommitteeMemoLegalBasis: "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544",
      l2CommitteeMemoConsiderations: "เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบมติของคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามที่เสนอ",
      l2CommitteeMemoResolutionText: "ในการประชุมครั้งที่ 9/2569 คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผย ตามคำร้องของนางสาวปิยะดา แสงทอง จึงเรียนมาเพื่อโปรดพิจารณา",
      l2CommitteeMemoDocNo: "ปป 0002/4780",
      l2CommitteeMemoDocDate: "5 กันยายน 2569",
      l2CommitteeDirectorOpinionText: "เห็นชอบตามที่ฝ่ายเลขานุการฯ เสนอ เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2CommitteeDispatchDocNo: "ปป 0002/4781",
      l2CommitteeDispatchDocDate: getDateWithOffset(-2),
      l2CommitteeDispatchDate: getDateWithOffset(-2),
      l2CommitteeDispatchNotes: "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอนำเสนอรองเลขาธิการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบตามมติของคณะอนุกรรมการฯ ที่เสนอ",
      l2Signatures: {
        committeeMemoProposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-4),
          position: "อนุกรรมการและเลขานุการ",
        },
        committeeDirectorOpinion: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-3),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_READY_FOR_BOARD_ROUND2",
      status: "มติบอร์ด ตอบกลับแล้ว",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    {
      id: "คำร้อง-100035/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตจัดซื้อครุภัณฑ์สำนักงาน",
      requesterName: "นายธีรพงษ์ แน่วแน่",
      requesterTypeName: "ประชาชนทั่วไป",
      requestedInfo: "เอกสารการไต่สวนกรณีทุจริตจัดซื้อครุภัณฑ์สำนักงานที่อยู่ระหว่างไต่สวน",
      relatedCaseNo: "คดี-100035/2569",
      requestChannelName: "ยื่นด้วยตนเอง",
      attachmentFileNames: ["คำร้องขอเปิดเผยข้อมูล.pdf"],
      l2ResolutionType: "DISCLOSE",
      l2ResolutionTypeName: "อนุญาตเปิดเผย",
      l2ResolutionDetail: "คณะอนุกรรมการฯ พิจารณาแล้วเห็นว่าข้อมูลที่ขอไม่เข้าข้อยกเว้นตามมาตรา 15 จึงเห็นควรอนุญาตให้เปิดเผยข้อมูลทั้งหมดตามคำร้อง",
      l2CommitteeOpinion: "คณะอนุกรรมการฯ เห็นว่าข้อมูลที่ขอไม่กระทบต่อการไต่สวนที่ยังดำเนินอยู่",
      l2CaseState: "INVESTIGATING",
      l2CaseStateName: "อยู่ระหว่างไต่สวน",
      l2MeetingNo: "9/2569",
      l2MeetingDate: getDateWithOffset(-6),
      l2CommitteeSheetFacts: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารได้ตรวจสอบคำร้องและเอกสารประกอบแล้ว เห็นว่าข้อเท็จจริงตามคำร้องเป็นไปตามที่ผู้ยื่นคำขอระบุ ไม่มีข้อโต้แย้งเพิ่มเติม",
      l2CommitteeSheetDataOwner: "กองกฎหมาย สำนักงาน ป.ป.ท.",
      l2CommitteeMemoDivisionName: "กกม. (ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ)",
      l2CommitteeMemoDivisionPhone: "1801",
      l2CommitteeMemoAddressedTo: "เลขาธิการคณะกรรมการ ป.ป.ท. (ผ่าน ผอ.กกม.)",
      l2CommitteeMemoMeetingVenue: "ห้องประชุมกองกฎหมาย ชั้น 4 สำนักงาน ป.ป.ท.",
      l2CommitteeMemoBackground: "ด้วย นายธีรพงษ์ แน่วแน่ ได้ยื่นคำขอเปิดเผยข้อมูลข่าวสาร เรื่อง คำร้องขอเปิดเผยเอกสารการไต่สวนกรณีทุจริตจัดซื้อครุภัณฑ์สำนักงาน ต่อสำนักงาน ป.ป.ท.",
      l2CommitteeMemoLegalBasis: "พระราชบัญญัติข้อมูลข่าวสารของราชการ พ.ศ. 2540 มาตรา 15 และระเบียบว่าด้วยการรักษาความลับของทางราชการ พ.ศ. 2544",
      l2CommitteeMemoConsiderations: "เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบมติของคณะอนุกรรมการพิจารณากลั่นกรองฯ ตามที่เสนอ",
      l2CommitteeMemoResolutionText: "ในการประชุมครั้งที่ 9/2569 คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสารมีมติอนุญาตเปิดเผยข้อมูล ตามคำร้องของนายธีรพงษ์ แน่วแน่ จึงเรียนมาเพื่อโปรดพิจารณา",
      l2CommitteeMemoDocNo: "ปป 0002/4536",
      l2CommitteeMemoDocDate: "29 สิงหาคม 2569",
      l2CommitteeDirectorOpinionText: "เห็นชอบตามที่ฝ่ายเลขานุการฯ เสนอ เห็นควรนำเสนอที่ประชุมคณะกรรมการ ป.ป.ท. ต่อไป",
      l2CommitteeDispatchDocNo: "ปป 0002/4537",
      l2CommitteeDispatchDocDate: getDateWithOffset(-4),
      l2CommitteeDispatchDate: getDateWithOffset(-4),
      l2CommitteeDispatchNotes: "ฝ่ายเลขานุการ คณะอนุกรรมการพิจารณากลั่นกรองฯ ขอนำเสนอรองเลขาธิการ ป.ป.ท. เพื่อพิจารณาให้ความเห็นชอบตามมติของคณะอนุกรรมการฯ ที่เสนอ",
      l2Signatures: {
        committeeMemoProposer: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-9),
          position: "อนุกรรมการและเลขานุการ",
        },
        committeeDirectorOpinion: {
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          signedAt: getDateWithOffset(-8),
          position: "ผู้อำนวยการกองกฎหมาย",
        },
      },
      statusCode: "L2_BOARD_RESOLVED_ROUND2",
      status: "รอธุรการบันทึกรับมติ (กิจกรรมที่ 7)",
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม",
    },
    /* ---------------------------------------------------------------- 10.3
       ตัวอย่างคดีศาลปกครอง — เคสแม่เดินมาถึง LAW0090 แล้ว (ติ๊กมีคำขอทุเลาฯ
       ไว้ตอนนั้น) กำลังรอ ผอ.กลุ่มงานคดีเห็นชอบที่ 10-3-07, พร้อมเคสลูกสาขา
       Part 1b ที่ spawnStayObjectionCase() จะสร้างให้เอง — ใส่ไว้ล่วงหน้าเพื่อ
       ให้ล็อกอินเป็นนิติกรกลุ่มงานคดี (Kittisak.S) แล้วเข้า 10-3b-01 ได้ทันที
       โดยไม่ต้องไล่คลิกทั้งสาย 02-board-intake → 10-3-02 → 03 → 04 ใหม่ */
    {
      id: "คดีปกครอง-100097/2569",
      title:
        "นายวีระชัย ต่อสู้ธรรม (ผู้ฟ้องคดี) ยื่นฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 210/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายวีระชัย ต่อสู้ธรรม"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายวีระชัย ต่อสู้ธรรม",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      courtSarabanNo: "สบ.0099/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายเรียกศาลปกครอง_คดี100097.pdf",
        "สำเนาคำฟ้อง_100097.pdf",
      ],
      lawReceiveNo: "0099/2569",
      centralSarabanNo: "2569/4501",
      paccCaseNo: "ปค. 0012/2569",
      blackNo: "อ. 210/2569",
      redNo: "-",
      dateReceived: getDateWithOffset(-5),
      dueDate: getDateWithOffset(25),
      workflowStep: 3,
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      assignedRole: "case_group_director",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ",
      statusCode: "L3_PENDING_GROUP_APPROVE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0090",
      l3StepSeq: 4,
      l3ReviewNotes:
        "ตรวจสอบคำฟ้องแล้วพบว่าคำสั่งไล่ออกทางวินัยดำเนินการตามขั้นตอนที่กฎหมายกำหนดโดยชอบ",
      l3HasStayRequest: true,
      l3RelatedCaseNo: "",
      l3OpinionText:
        "เห็นควรจัดทำคำให้การคัดค้านคำฟ้อง โดยยืนยันว่าคำสั่งไล่ออกทางวินัยเป็นไปตามขั้นตอนที่ ก.พ.ค. กำหนดครบถ้วนทุกประการ",
      l3OpinionAttachments: [],
    },
    {
      id: "คดีปกครอง-100097-B/2569",
      title:
        "คำขอทุเลาการบังคับคดี — ศาลปกครองกลาง (เกี่ยวข้องกับ อ. 210/2569)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3ParentCaseId: "คดีปกครอง-100097/2569",
      paccCaseNo: "ปค. 0012/2569-ท",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 210/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายวีระชัย ต่อสู้ธรรม"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายวีระชัย ต่อสู้ธรรม",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      dateReceived: getDateWithOffset(-1),
      dueDate: getDateWithOffset(14),
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "case_legal_officer",
      status: "นิติกรจัดทำคำชี้แจงคัดค้าน",
      statusCode: "L3B_PENDING_LAWYER_DRAFT",
      statusBadge: "bg-primary text-white",
      l3Step: null,
      l3StepSeq: 0,
    },

    /* ตัวอย่างเคสแม่-ลูกคำขอทุเลาฯ เพิ่มอีก 2 คู่ (นอกเหนือจาก 100097/100097-B
       ด้านบน) เพื่อให้การจัดกลุ่มแบบ indent ใน 01-work-inbox.html (ดูฟังก์ชัน
       groupParentChildCases103) มีตัวอย่างให้ทดสอบหลายคู่ วางไว้คนละขั้นของ
       Part 1 (LAW0093/LAW0095) เพื่อให้เห็นว่าใช้ได้ไม่ว่าจะ login เป็นบทบาทไหน */
    {
      id: "คดีปกครอง-100098/2569",
      title:
        "นายสมบูรณ์ ยุติธรรม (ผู้ฟ้องคดี) ยื่นฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 211/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายสมบูรณ์ ยุติธรรม"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายสมบูรณ์ ยุติธรรม",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      courtSarabanNo: "สบ.0100/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายเรียกศาลปกครอง_คดี100098.pdf",
        "สำเนาคำฟ้อง_100098.pdf",
      ],
      lawReceiveNo: "0100/2569",
      centralSarabanNo: "2569/4502",
      paccCaseNo: "ปค. 0013/2569",
      blackNo: "อ. 211/2569",
      redNo: "-",
      dateReceived: getDateWithOffset(-7),
      dueDate: getDateWithOffset(23),
      workflowStep: 5,
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      assignedRole: "dir_legal",
      status: "ผอ.กองกฎหมายลงนามผ่านเรื่อง",
      statusCode: "L3_PENDING_DIRECTOR_SIGN",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0093",
      l3StepSeq: 5,
      l3ReviewNotes:
        "ตรวจสอบคำฟ้องแล้วพบว่าคำสั่งพักราชการดำเนินการตามขั้นตอนที่กฎหมายกำหนดโดยชอบ",
      l3HasStayRequest: true,
      l3RelatedCaseNo: "",
      l3OpinionText:
        "เห็นควรจัดทำคำให้การคัดค้านคำฟ้อง โดยยืนยันว่าคำสั่งพักราชการเป็นไปตามขั้นตอนที่กำหนดครบถ้วนทุกประการ",
      l3OpinionAttachments: [],
    },
    {
      id: "คดีปกครอง-100098-B/2569",
      title:
        "คำขอทุเลาการบังคับคดี — ศาลปกครองกลาง (เกี่ยวข้องกับ อ. 211/2569)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3ParentCaseId: "คดีปกครอง-100098/2569",
      paccCaseNo: "ปค. 0013/2569-ท",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 211/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายสมบูรณ์ ยุติธรรม"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายสมบูรณ์ ยุติธรรม",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(13),
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "case_legal_officer",
      status: "นิติกรจัดทำคำชี้แจงคัดค้าน",
      statusCode: "L3B_PENDING_LAWYER_DRAFT",
      statusBadge: "bg-primary text-white",
      l3Step: null,
      l3StepSeq: 0,
    },
    {
      id: "คดีปกครอง-100099/2569",
      title:
        "นางสาวพรทิพย์ มั่นคง (ผู้ฟ้องคดี) ยื่นฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 212/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นางสาวพรทิพย์ มั่นคง"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นางสาวพรทิพย์ มั่นคง",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      courtSarabanNo: "สบ.0101/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายเรียกศาลปกครอง_คดี100099.pdf",
        "สำเนาคำฟ้อง_100099.pdf",
      ],
      lawReceiveNo: "0101/2569",
      centralSarabanNo: "2569/4503",
      paccCaseNo: "ปค. 0014/2569",
      blackNo: "อ. 212/2569",
      redNo: "-",
      dateReceived: getDateWithOffset(-9),
      dueDate: getDateWithOffset(21),
      workflowStep: 7,
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      assignedRole: "admin_legal",
      status: "รอเสนอบอร์ด",
      statusCode: "L3_READY_FOR_BOARD",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0095",
      l3StepSeq: 7,
      l3ReviewNotes:
        "ตรวจสอบคำฟ้องแล้วพบว่าคำสั่งลงโทษทางวินัยดำเนินการตามขั้นตอนที่กฎหมายกำหนดโดยชอบ",
      l3HasStayRequest: true,
      l3RelatedCaseNo: "",
      l3OpinionText:
        "เห็นควรจัดทำคำให้การคัดค้านคำฟ้อง โดยยืนยันว่าคำสั่งลงโทษทางวินัยเป็นไปตามขั้นตอนที่กำหนดครบถ้วนทุกประการ",
      l3OpinionAttachments: [],
    },
    {
      id: "คดีปกครอง-100099-B/2569",
      title:
        "คำขอทุเลาการบังคับคดี — ศาลปกครองกลาง (เกี่ยวข้องกับ อ. 212/2569)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3ParentCaseId: "คดีปกครอง-100099/2569",
      paccCaseNo: "ปค. 0014/2569-ท",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 212/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นางสาวพรทิพย์ มั่นคง"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นางสาวพรทิพย์ มั่นคง",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      dateReceived: getDateWithOffset(-3),
      dueDate: getDateWithOffset(12),
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "case_legal_officer",
      status: "นิติกรจัดทำคำชี้แจงคัดค้าน",
      statusCode: "L3B_PENDING_LAWYER_DRAFT",
      statusBadge: "bg-primary text-white",
      l3Step: null,
      l3StepSeq: 0,
    },

    /* เคสแม่-ลูกคำขอทุเลาฯ อีก 1 คู่ — ต่างจาก 3 คู่ด้านบนตรงที่เคสลูกเดินสาย
       Part 1b (LAW0097-0099) จบครบแล้ว (L3B_CLOSED) พร้อมข้อมูลที่แต่ละขั้น
       ใน 10-3b-01/02/03 จะบันทึกไว้ (เอกสารแนบ/ลายเซ็น/บันทึกปิดสำนวน) แล้ว
       ใส่ฟิลด์ l3CourtStayOrder* เพิ่มไว้ล่วงหน้าเพื่อจำลองว่าศาลปกครองได้
       วินิจฉัย/มีคำสั่งทุเลาฯ แล้ว — เตรียมไว้ให้ Part 3 (LAW0100-0102, ธุรการ
       รับคำสั่งศาล → นิติกรจำแนก 2 ทาง) ใช้ทดสอบเมื่อ implement ต่อ ยังไม่มี
       หน้ารองรับฟิลด์นี้ (statusCode คงเป็น L3B_CLOSED เป็น black box ต่อไป
       เหมือนเดิม ไม่ได้เดินสถานะใหม่เพราะยังไม่มี statusCode ของ Part 3) */
    {
      id: "คดีปกครอง-100100/2569",
      title:
        "นายประเสริฐ สัตย์ซื่อ (ผู้ฟ้องคดี) ยื่นฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 213/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายประเสริฐ สัตย์ซื่อ"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายประเสริฐ สัตย์ซื่อ",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      courtSarabanNo: "สบ.0102/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายเรียกศาลปกครอง_คดี100100.pdf",
        "สำเนาคำฟ้อง_100100.pdf",
      ],
      lawReceiveNo: "0102/2569",
      centralSarabanNo: "2569/4504",
      paccCaseNo: "ปค. 0015/2569",
      blackNo: "อ. 213/2569",
      redNo: "-",
      dateReceived: getDateWithOffset(-30),
      dueDate: getDateWithOffset(0),
      workflowStep: 4,
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      assignedRole: "case_group_director",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ",
      statusCode: "L3_PENDING_GROUP_APPROVE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0090",
      l3StepSeq: 4,
      l3ReviewNotes:
        "ตรวจสอบคำฟ้องแล้วพบว่าคำสั่งเพิกถอนใบอนุญาตดำเนินการตามขั้นตอนที่กฎหมายกำหนดโดยชอบ",
      l3HasStayRequest: true,
      l3RelatedCaseNo: "",
      l3OpinionText:
        "เห็นควรจัดทำคำให้การคัดค้านคำฟ้อง โดยยืนยันว่าคำสั่งเพิกถอนใบอนุญาตเป็นไปตามขั้นตอนที่กำหนดครบถ้วนทุกประการ",
      l3OpinionAttachments: [],
    },
    {
      id: "คดีปกครอง-100100-B/2569",
      title:
        "คำขอทุเลาการบังคับคดี — ศาลปกครองกลาง (เกี่ยวข้องกับ อ. 213/2569)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3ParentCaseId: "คดีปกครอง-100100/2569",
      paccCaseNo: "ปค. 0015/2569-ท",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 213/2569",
      redCaseNo: "-",
      orderedTo: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      plaintiffs: ["นายประเสริฐ สัตย์ซื่อ"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท."],
      accuser: "นายประเสริฐ สัตย์ซื่อ",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท., สำนักงาน ป.ป.ท.",
      dateReceived: getDateWithOffset(-26),
      dueDate: getDateWithOffset(-5),
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "case_legal_officer",
      status: "ส่งคำชี้แจงคัดค้านต่อศาลแล้ว",
      statusCode: "L3B_CLOSED",
      statusBadge: "bg-secondary text-white",
      l3Step: "LAW0099",
      l3StepSeq: 3,
      /* ---- LAW0097 (10-3b-01) — นิติกร แนบคำชี้แจงคัดค้าน ---- */
      l3StayObjectionAttachments: ["คำชี้แจงคัดค้าน_100100-B.pdf"],
      l3StayObjectionSupportingAttachments: [
        "พยานหลักฐานประกอบคำชี้แจง_100100-B.pdf",
      ],
      /* ---- LAW0098 (10-3b-02) — ประธานกรรมการ ป.ป.ท. ลงนาม ---- */
      l3StayObjectionChairmanNotes: "เห็นชอบตามที่นิติกรเสนอ ลงนามคัดค้านได้",
      /* ---- LAW0099 (10-3b-03) — นิติกร ส่งศาล/ปิดสำนวน ---- */
      l3StayDispatchMethod: "post",
      l3StayDispatchDate: getDateWithOffset(-20),
      l3StayDispatchEmsTracking: "EG100100569TH",
      l3StayHandDeliveryDate: null,
      l3StayHandDeliveryLocation: null,
      l3StayDispatchDocCopies: ["สำเนาหนังสือนำส่งศาล_100100-B.pdf"],
      l3StayCloseNotes:
        "ส่งคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดีต่อศาลปกครองเรียบร้อยแล้ว บันทึกปิดสำนวนของสาขาคำขอทุเลาฯ",
      l3Signatures: {
        LAW0098: {
          image: "",
          signedAt: getDateWithOffset(-22),
        },
        LAW0099: {
          image: "",
          signedAt: getDateWithOffset(-20),
        },
      },
      /* ---- Part 3 (LAW0100-0102, ยังไม่ implement) — ข้อมูลจำลองว่าศาล
         ปกครองวินิจฉัย/มีคำสั่งแล้ว เตรียมไว้ให้หน้าธุรการรับคำสั่งศาล +
         นิติกรจำแนกทางใช้ทดสอบเมื่อ implement — ไม่มีหน้าอ่านฟิลด์นี้ตอนนี้ */
      l3CourtStayOrderReceivedDate: getDateWithOffset(-2),
      l3CourtStayOrderNo: "คส. 45/2569",
      l3CourtStayOrderDate: getDateWithOffset(-4),
      l3CourtStayResult: "GRANTED",
      l3CourtStayOrderFileNames: [
        "คำสั่งศาลเรื่องทุเลาการบังคับคดี_100100.pdf",
      ],
    },

    /* ------------------------------------------------------------ 10.3v
       ตัวอย่างเคสรับผลคำพิพากษา (Part 5–6, l3CaseType: "verdict") — ใส่ไว้
       ล่วงหน้า 1 เคสต่อขั้นตอนที่ implement แล้ว (10-3v-00 ถึง 10-3v-07)
       เพื่อให้ล็อกอินเป็นแต่ละบทบาทแล้วเห็นงานรอทันที ไม่ต้องไล่คลิกทั้งสาย
       ใหม่ทุกครั้ง — ดู docs/10.3 mockup/implementation-plan-part5-6.md */
    {
      id: "คดีปกครอง-100301/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 301/2569 หมายเลขแดงที่ อ. 355/2569 (นางสาวปิยะดา แสนสุข ฟ้อง อธิบดีกรมบัญชีกลาง)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 301/2569",
      redCaseNo: "อ. 355/2569",
      plaintiffs: ["นางสาวปิยะดา แสนสุข"],
      defendants: ["อธิบดีกรมบัญชีกลาง"],
      accuser: "นางสาวปิยะดา แสนสุข",
      accused: "อธิบดีกรมบัญชีกลาง",
      courtReceivedDate: getDateWithOffset(-3),
      verdictDate: getDateWithOffset(-5),
      verdictNoticeNo: "อส 0027.3/1301",
      verdictNoticeDate: getDateWithOffset(-3),
      courtSarabanNo: "สบ.0031/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100301.pdf"],
      lawReceiveNo: "0031/2569",
      centralSarabanNo: "2569/4501",
      physicalDocDate: getDateWithOffset(-3),
      l3VerdictRegNo: "ทบ.ปค. 0031/2569",
      l3VerdictRegDate: getDateWithOffset(-2),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-3),
      dueDate: getDateWithOffset(27),
      workflowStep: 3,
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย (คำพิพากษา)",
      statusCode: "L3V_PENDING_DIRECTOR_ASSIGN",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0119",
      l3StepSeq: 0,
    },
    {
      id: "คดีปกครอง-100302/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 302/2569 หมายเลขแดงที่ อ. 356/2569 (นายสุริยา ถิ่นเจริญ ฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท.)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 302/2569",
      redCaseNo: "อ. 356/2569",
      plaintiffs: ["นายสุริยา ถิ่นเจริญ"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท."],
      accuser: "นายสุริยา ถิ่นเจริญ",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      courtReceivedDate: getDateWithOffset(-6),
      verdictDate: getDateWithOffset(-8),
      verdictNoticeNo: "อส 0027.3/1302",
      verdictNoticeDate: getDateWithOffset(-6),
      courtSarabanNo: "สบ.0032/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100302.pdf"],
      lawReceiveNo: "0032/2569",
      centralSarabanNo: "2569/4502",
      physicalDocDate: getDateWithOffset(-6),
      l3VerdictRegNo: "ทบ.ปค. 0032/2569",
      l3VerdictRegDate: getDateWithOffset(-5),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-6),
      dueDate: getDateWithOffset(24),
      workflowStep: 3,
      assignedRole: "case_group_director",
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกร (คำพิพากษา)",
      statusCode: "L3V_PENDING_GROUP_ASSIGN",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0121",
      l3StepSeq: 1,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-5),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
    },
    {
      id: "คดีปกครอง-100303/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 303/2569 หมายเลขแดงที่ อ. 357/2569 (ห้างหุ้นส่วนจำกัด รุ่งเรืองก่อสร้าง ฟ้อง สำนักงาน ป.ป.ท.)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 303/2569",
      redCaseNo: "อ. 357/2569",
      plaintiffs: ["ห้างหุ้นส่วนจำกัด รุ่งเรืองก่อสร้าง"],
      defendants: ["สำนักงาน ป.ป.ท."],
      accuser: "ห้างหุ้นส่วนจำกัด รุ่งเรืองก่อสร้าง",
      accused: "สำนักงาน ป.ป.ท.",
      courtReceivedDate: getDateWithOffset(-9),
      verdictDate: getDateWithOffset(-11),
      verdictNoticeNo: "อส 0027.3/1303",
      verdictNoticeDate: getDateWithOffset(-9),
      courtSarabanNo: "สบ.0033/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100303.pdf"],
      lawReceiveNo: "0033/2569",
      centralSarabanNo: "2569/4503",
      physicalDocDate: getDateWithOffset(-9),
      l3VerdictRegNo: "ทบ.ปค. 0033/2569",
      l3VerdictRegDate: getDateWithOffset(-8),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-9),
      dueDate: getDateWithOffset(21),
      workflowStep: 3,
      assignedRole: "case_legal_officer",
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      status: "นิติกรวิเคราะห์ผลคำพิพากษา",
      statusCode: "L3V_PENDING_LAWYER_ANALYSIS",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0122",
      l3StepSeq: 2,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-8),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-7),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
    },
    {
      id: "คดีปกครอง-100304/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 304/2569 หมายเลขแดงที่ อ. 358/2569 (นายอมร ยิ่งยงยุทธ ฟ้อง ผู้อำนวยการสำนักงาน ป.ป.ท. เขต 4)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองนครราชสีมา",
      blackCaseNo: "อ. 304/2569",
      redCaseNo: "อ. 358/2569",
      plaintiffs: ["นายอมร ยิ่งยงยุทธ"],
      defendants: ["ผู้อำนวยการสำนักงาน ป.ป.ท. เขต 4"],
      accuser: "นายอมร ยิ่งยงยุทธ",
      accused: "ผู้อำนวยการสำนักงาน ป.ป.ท. เขต 4",
      courtReceivedDate: getDateWithOffset(-14),
      verdictDate: getDateWithOffset(-16),
      verdictNoticeNo: "อส 0027.3/1304",
      verdictNoticeDate: getDateWithOffset(-14),
      courtSarabanNo: "สบ.0034/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100304.pdf"],
      lawReceiveNo: "0034/2569",
      centralSarabanNo: "2569/4504",
      physicalDocDate: getDateWithOffset(-14),
      l3VerdictRegNo: "ทบ.ปค. 0034/2569",
      l3VerdictRegDate: getDateWithOffset(-13),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-14),
      dueDate: getDateWithOffset(16),
      workflowStep: 3,
      assignedRole: "case_group_director",
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ (คำพิพากษา)",
      statusCode: "L3V_PENDING_GROUP_APPROVE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0123",
      l3StepSeq: 3,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-13),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-12),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues:
        "ประเด็นข้อพิพาทเรื่องความชอบด้วยกฎหมายของคำสั่งย้ายโดยไม่ได้รับความยินยอม",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษาว่าคำสั่งย้ายไม่ชอบด้วยกฎหมาย เนื่องจากไม่ได้ดำเนินการตามขั้นตอนที่กฎหมายกำหนด",
      l3VerdictReadDate: getDateWithOffset(-11),
      l3AppealDeadline: getDateWithOffset(19),
      l3AppealByPlaintiff: null,
      l3VerdictOpinionText:
        "เห็นควรเสนอ ผอ.กองกฎหมายพิจารณาว่าควรอุทธรณ์คำพิพากษาต่อศาลปกครองสูงสุดหรือไม่ เนื่องจากคำสั่งย้ายดังกล่าวมีเหตุผลด้านความจำเป็นของราชการรองรับ",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "APPEAL_CONSIDER",
    },
    {
      id: "คดีปกครอง-100305/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 305/2569 หมายเลขแดงที่ อ. 359/2569 (นางสาวเบญจมาศ ศรีสุวรรณ ฟ้อง เลขาธิการคณะกรรมการ ป.ป.ท.)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 305/2569",
      redCaseNo: "อ. 359/2569",
      plaintiffs: ["นางสาวเบญจมาศ ศรีสุวรรณ"],
      defendants: ["เลขาธิการคณะกรรมการ ป.ป.ท."],
      accuser: "นางสาวเบญจมาศ ศรีสุวรรณ",
      accused: "เลขาธิการคณะกรรมการ ป.ป.ท.",
      courtReceivedDate: getDateWithOffset(-18),
      verdictDate: getDateWithOffset(-20),
      verdictNoticeNo: "อส 0027.3/1305",
      verdictNoticeDate: getDateWithOffset(-18),
      courtSarabanNo: "สบ.0035/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100305.pdf"],
      lawReceiveNo: "0035/2569",
      centralSarabanNo: "2569/4505",
      physicalDocDate: getDateWithOffset(-18),
      l3VerdictRegNo: "ทบ.ปค. 0035/2569",
      l3VerdictRegDate: getDateWithOffset(-17),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-18),
      dueDate: getDateWithOffset(12),
      workflowStep: 3,
      assignedRole: "dir_legal",
      officer: "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)",
      status: "ผอ.กองกฎหมายกำหนดแนวทาง (คำพิพากษา)",
      statusCode: "L3V_PENDING_DIRECTOR_DECIDE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0126",
      l3StepSeq: 4,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-17),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-16),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งไม่เลื่อนขั้นเงินเดือน",
      l3VerdictResult: "ชนะ",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งไม่เลื่อนขั้นเงินเดือนดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-15),
      l3AppealDeadline: getDateWithOffset(15),
      l3AppealByPlaintiff: "ยื่น",
      l3VerdictOpinionText:
        "ผู้ฟ้องคดียื่นอุทธรณ์คำพิพากษาแล้ว เห็นควรจัดทำคำแก้อุทธรณ์เพื่อยืนยันคำพิพากษาศาลชั้นต้น",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "APPEAL_REPLY",
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
    },
    {
      id: "คดีปกครอง-100306/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 306/2569 หมายเลขแดงที่ อ. 360/2569 (นายไพโรจน์ วัฒนกุล ฟ้อง อธิบดีกรมการปกครอง)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 306/2569",
      redCaseNo: "อ. 360/2569",
      plaintiffs: ["นายไพโรจน์ วัฒนกุล"],
      defendants: ["อธิบดีกรมการปกครอง"],
      accuser: "นายไพโรจน์ วัฒนกุล",
      accused: "อธิบดีกรมการปกครอง",
      courtReceivedDate: getDateWithOffset(-22),
      verdictDate: getDateWithOffset(-24),
      verdictNoticeNo: "อส 0027.3/1306",
      verdictNoticeDate: getDateWithOffset(-22),
      courtSarabanNo: "สบ.0036/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100306.pdf"],
      lawReceiveNo: "0036/2569",
      centralSarabanNo: "2569/4506",
      physicalDocDate: getDateWithOffset(-22),
      l3VerdictRegNo: "ทบ.ปค. 0036/2569",
      l3VerdictRegDate: getDateWithOffset(-21),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-22),
      dueDate: getDateWithOffset(8),
      workflowStep: 3,
      assignedRole: "case_legal_officer",
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      status: "รอปิดสำนวน (LAW0163)",
      statusCode: "L3V_TO_CLOSE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-21),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-20),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งเพิกถอนใบอนุญาต",
      l3VerdictResult: "ชนะ",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งเพิกถอนใบอนุญาตดำเนินการตามอำนาจหน้าที่โดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-19),
      l3AppealDeadline: getDateWithOffset(11),
      l3AppealByPlaintiff: "ไม่ยื่น",
      l3VerdictOpinionText:
        "พ้นกำหนดระยะเวลายื่นอุทธรณ์แล้ว ผู้ฟ้องคดีไม่ยื่นอุทธรณ์ เห็นควรยุติเรื่องและปิดสำนวน",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "CLOSE",
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l3DirectorDecision: "CLOSE",
      l3DirectorBranchReason: "-",
      l3DirectorDecideNotes: "เห็นชอบให้ปิดสำนวนตามที่เสนอ",
    },
    {
      /* ผอ.กองกฎหมายลงนามกำหนดแนวทางที่ 10-3v-06 แล้ว (ชนะคดี ผู้ฟ้องยื่นอุทธรณ์)
         ใส่ไว้ที่สถานะ L3V_TO_APPEAL_REPLY ให้ทันทีเพื่อรอทดสอบ Part 7
         (10-3v-08 เป็นต้นไป) — ดู docs/10.3 mockup/implementation-plan-part7.md
         ยังไม่มีหน้ารองรับ (Part 7 ยังไม่ implement) จึงเป็น black box ไปก่อน */
      id: "คดีปกครอง-100307/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 307/2569 หมายเลขแดงที่ อ. 361/2569 (นางสาวรัตนา ทองสุข ฟ้อง อธิบดีกรมที่ดิน)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 307/2569",
      redCaseNo: "อ. 361/2569",
      plaintiffs: ["นางสาวรัตนา ทองสุข"],
      defendants: ["อธิบดีกรมที่ดิน"],
      accuser: "นางสาวรัตนา ทองสุข",
      accused: "อธิบดีกรมที่ดิน",
      courtReceivedDate: getDateWithOffset(-26),
      verdictDate: getDateWithOffset(-28),
      verdictNoticeNo: "อส 0027.3/1307",
      verdictNoticeDate: getDateWithOffset(-26),
      courtSarabanNo: "สบ.0037/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100307.pdf"],
      lawReceiveNo: "0037/2569",
      centralSarabanNo: "2569/4507",
      physicalDocDate: getDateWithOffset(-26),
      l3VerdictRegNo: "ทบ.ปค. 0037/2569",
      l3VerdictRegDate: getDateWithOffset(-25),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-26),
      dueDate: getDateWithOffset(4),
      workflowStep: 3,
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      status: "รอจัดทำคำแก้อุทธรณ์ (กิจกรรมที่ 7)",
      statusCode: "L3V_TO_APPEAL_REPLY",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-25),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-24),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งไม่ออกโฉนดที่ดิน",
      l3VerdictResult: "ชนะ",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งไม่ออกโฉนดที่ดินดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-23),
      l3AppealDeadline: getDateWithOffset(7),
      l3AppealByPlaintiff: "ยื่น",
      l3VerdictOpinionText:
        "ผู้ฟ้องคดียื่นอุทธรณ์คำพิพากษาแล้ว เห็นควรจัดทำคำแก้อุทธรณ์เพื่อยืนยันคำพิพากษาศาลชั้นต้น",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "APPEAL_REPLY",
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l3DirectorDecision: "APPEAL_REPLY",
      l3DirectorBranchReason: "-",
      l3DirectorDecideNotes: "เห็นชอบให้จัดทำคำแก้อุทธรณ์ตามที่เสนอ",
    },
    {
      /* ผอ.กองกฎหมายลงนามกำหนดแนวทางที่ 10-3v-06 แล้ว (ชนะคดี ผู้ฟ้องยื่นอุทธรณ์)
         ใส่ไว้ที่สถานะ L3V_TO_APPEAL_REPLY ให้ทันทีเพื่อรอทดสอบ Part 7
         (10-3v-08 เป็นต้นไป) — ดู docs/10.3 mockup/implementation-plan-part7.md
         ยังไม่มีหน้ารองรับ (Part 7 ยังไม่ implement) จึงเป็น black box ไปก่อน */
      id: "คดีปกครอง-100307/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 307/2569 หมายเลขแดงที่ อ. 361/2569 (นางสาวรัตนา ทองสุข ฟ้อง อธิบดีกรมที่ดิน)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 307/2569",
      redCaseNo: "อ. 361/2569",
      plaintiffs: ["นางสาวรัตนา ทองสุข"],
      defendants: ["อธิบดีกรมที่ดิน"],
      accuser: "นางสาวรัตนา ทองสุข",
      accused: "อธิบดีกรมที่ดิน",
      courtReceivedDate: getDateWithOffset(-26),
      verdictDate: getDateWithOffset(-28),
      verdictNoticeNo: "อส 0027.3/1307",
      verdictNoticeDate: getDateWithOffset(-26),
      courtSarabanNo: "สบ.0037/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100307.pdf"],
      lawReceiveNo: "0037/2569",
      centralSarabanNo: "2569/4507",
      physicalDocDate: getDateWithOffset(-26),
      l3VerdictRegNo: "ทบ.ปค. 0037/2569",
      l3VerdictRegDate: getDateWithOffset(-25),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-26),
      dueDate: getDateWithOffset(4),
      workflowStep: 3,
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      status: "รอจัดทำคำแก้อุทธรณ์",
      statusCode: "L3V_TO_APPEAL_REPLY",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-25),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-24),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งไม่ออกโฉนดที่ดิน",
      l3VerdictResult: "ชนะ",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งไม่ออกโฉนดที่ดินดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-23),
      l3AppealDeadline: getDateWithOffset(7),
      l3AppealByPlaintiff: "ยื่น",
      l3VerdictOpinionText:
        "ผู้ฟ้องคดียื่นอุทธรณ์คำพิพากษาแล้ว เห็นควรจัดทำคำแก้อุทธรณ์เพื่อยืนยันคำพิพากษาศาลชั้นต้น",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "APPEAL_REPLY",
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l3DirectorDecision: "APPEAL_REPLY",
      l3DirectorBranchReason: "-",
      l3DirectorDecideNotes: "เห็นชอบให้จัดทำคำแก้อุทธรณ์ตามที่เสนอ",
    },
    {
      /* ผอ.กองกฎหมายลงนามกำหนดแนวทางที่ 10-3v-06 แล้ว (แพ้คดี) ใส่ไว้ที่สถานะ
         L3V_TO_APPEAL_CONSIDER ให้ทันทีเพื่อรอทดสอบ Part 8 (10-3v-16 เป็นต้นไป)
         ดู docs/10.3 mockup/implementation-plan-part8.md */
      id: "คดีปกครอง-100308/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 308/2569 หมายเลขแดงที่ อ. 362/2569 (นายวีระพล จันทร์เพ็ญ ฟ้อง อธิบดีกรมสรรพากร)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 308/2569",
      redCaseNo: "อ. 362/2569",
      plaintiffs: ["นายวีระพล จันทร์เพ็ญ"],
      defendants: ["อธิบดีกรมสรรพากร"],
      accuser: "นายวีระพล จันทร์เพ็ญ",
      accused: "อธิบดีกรมสรรพากร",
      courtReceivedDate: getDateWithOffset(-22),
      verdictDate: getDateWithOffset(-24),
      verdictNoticeNo: "อส 0027.3/1308",
      verdictNoticeDate: getDateWithOffset(-22),
      courtSarabanNo: "สบ.0038/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100308.pdf"],
      lawReceiveNo: "0038/2569",
      centralSarabanNo: "2569/4508",
      physicalDocDate: getDateWithOffset(-22),
      l3VerdictRegNo: "ทบ.ปค. 0038/2569",
      l3VerdictRegDate: getDateWithOffset(-21),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-22),
      dueDate: getDateWithOffset(4),
      workflowStep: 3,
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      status: "รอพิจารณาความเห็นควรอุทธรณ์",
      statusCode: "L3V_TO_APPEAL_CONSIDER",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l3DirectorOrderDate: getDateWithOffset(-21),
      l3DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l3GroupAssignNotes: "มอบหมายให้นิติกรตรวจสอบและวิเคราะห์ผลคำพิพากษา",
      l3GroupAssignDate: getDateWithOffset(-20),
      l3GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของการประเมินภาษีเงินได้",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษาเพิกถอนคำสั่งประเมินภาษี เนื่องจากเจ้าพนักงานประเมินไม่ปฏิบัติตามขั้นตอนที่กฎหมายกำหนด",
      l3VerdictReadDate: getDateWithOffset(-19),
      l3AppealDeadline: getDateWithOffset(11),
      l3AppealByPlaintiff: "-",
      l3VerdictOpinionText:
        "แพ้คดี เห็นควรส่งเรื่องให้พิจารณาว่าจะยื่นอุทธรณ์หรือไม่ต่อไป",
      l3VerdictOpinionAttachments: [],
      l3ProposedBranch: "APPEAL_CONSIDER",
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l3DirectorDecision: "APPEAL_CONSIDER",
      l3DirectorBranchReason: "-",
      l3DirectorDecideNotes: "เห็นชอบให้ส่งพิจารณาความเห็นควรอุทธรณ์ตามที่เสนอ",
    },
    {
      /* เดินผ่าน Part 8 ครบแล้ว (นิติกรเสนอ "เห็นควรอุทธรณ์" ที่ 10-3v-19,
         ผอ.กลุ่มงานยืนยันที่ 10-3v-20) วางไว้ที่สถานะ L8_TO_APPEAL_DRAFT ให้
         ทันทีเพื่อรอทดสอบ Part 10a (10-3v-22 เป็นต้นไป) โดยไม่ต้องไล่คลิกทั้งสาย
         ดู docs/10.3 mockup/test-flow.md */
      id: "คดีปกครอง-100309/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 309/2569 หมายเลขแดงที่ อ. 363/2569 (นางสาวปิยะดา ศรีสุข ฟ้อง อธิบดีกรมที่ดิน)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 309/2569",
      redCaseNo: "อ. 363/2569",
      plaintiffs: ["นางสาวปิยะดา ศรีสุข"],
      defendants: ["อธิบดีกรมที่ดิน"],
      accuser: "นางสาวปิยะดา ศรีสุข",
      accused: "อธิบดีกรมที่ดิน",
      courtReceivedDate: getDateWithOffset(-20),
      verdictDate: getDateWithOffset(-22),
      verdictNoticeNo: "อส 0027.3/1309",
      verdictNoticeDate: getDateWithOffset(-20),
      courtSarabanNo: "สบ.0039/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100309.pdf"],
      lawReceiveNo: "0039/2569",
      centralSarabanNo: "2569/4509",
      physicalDocDate: getDateWithOffset(-20),
      l3VerdictRegNo: "ทบ.ปค. 0039/2569",
      l3VerdictRegDate: getDateWithOffset(-19),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-20),
      dueDate: getDateWithOffset(6),
      workflowStep: 3,
      assignedRole: "case_group_director",
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      status: "รอจัดทำคำอุทธรณ์",
      statusCode: "L8_TO_APPEAL_DRAFT",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งไม่ออกโฉนดที่ดิน",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งไม่ออกโฉนดที่ดินดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-17),
      l3AppealDeadline: getDateWithOffset(13),
      l3AppealByPlaintiff: "-",
      l3ProposedBranch: "APPEAL_CONSIDER",
      l8CentralSarabanNo: "2569/4509",
      l8PhysicalDocDate: getDateWithOffset(-20),
      l8LawReceiveNo: "0039/2569",
      l8NoticeDate: getDateWithOffset(-20),
      l8NoticeAttachments: ["หนังสือแจ้งผลคำพิพากษา_100309.pdf"],
      l8CaseRegNo: "ทบ.อธ. 0039/2569",
      l8CaseRegDate: getDateWithOffset(-16),
      l8RegNotes: "-",
      l8DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l8DirectorOrderDate: getDateWithOffset(-15),
      l8DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l8GroupAssignNotes: "มอบหมายให้นิติกรลงทะเบียนและตรวจสอบคำพิพากษา",
      l8GroupAssignDate: getDateWithOffset(-14),
      l8GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l8RelatedCaseNo: "-",
      l8OpinionAttachments: ["ร่างคำอุทธรณ์_คดี100309.pdf"],
      l8ProposedBranch: "APPEAL",
      l8GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
    },
    {
      /* เดินผ่าน Part 8 ครบแล้ว (นิติกรเสนอ "เห็นควรไม่อุทธรณ์" ที่ 10-3v-19,
         ผอ.กลุ่มงานยืนยันที่ 10-3v-20) วางไว้ที่สถานะ L8_TO_BOARD_PROPOSE ให้
         ทันทีเพื่อรอทดสอบ Part 9 (10-3v-26 เป็นต้นไป) โดยไม่ต้องไล่คลิกทั้งสาย
         ดู docs/10.3 mockup/test-flow.md */
      id: "คดีปกครอง-100310/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 310/2569 หมายเลขแดงที่ อ. 364/2569 (นายประเสริฐ วงศ์ทอง ฟ้อง เลขาธิการ ก.พ.)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 310/2569",
      redCaseNo: "อ. 364/2569",
      plaintiffs: ["นายประเสริฐ วงศ์ทอง"],
      defendants: ["เลขาธิการ ก.พ."],
      accuser: "นายประเสริฐ วงศ์ทอง",
      accused: "เลขาธิการ ก.พ.",
      courtReceivedDate: getDateWithOffset(-18),
      verdictDate: getDateWithOffset(-20),
      verdictNoticeNo: "อส 0027.3/1310",
      verdictNoticeDate: getDateWithOffset(-18),
      courtSarabanNo: "สบ.0040/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100310.pdf"],
      lawReceiveNo: "0040/2569",
      centralSarabanNo: "2569/4510",
      physicalDocDate: getDateWithOffset(-18),
      l3VerdictRegNo: "ทบ.ปค. 0040/2569",
      l3VerdictRegDate: getDateWithOffset(-17),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-18),
      dueDate: getDateWithOffset(8),
      workflowStep: 3,
      assignedRole: "case_group_director",
      officer: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      status: "รอเสนอมติอุทธรณ์ต่อบอร์ด",
      statusCode: "L8_TO_BOARD_PROPOSE",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งลงโทษทางวินัย",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งลงโทษทางวินัยดำเนินการตามขั้นตอนที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-15),
      l3AppealDeadline: getDateWithOffset(15),
      l3AppealByPlaintiff: "-",
      l3ProposedBranch: "APPEAL_CONSIDER",
      l8CentralSarabanNo: "2569/4510",
      l8PhysicalDocDate: getDateWithOffset(-18),
      l8LawReceiveNo: "0040/2569",
      l8NoticeDate: getDateWithOffset(-18),
      l8NoticeAttachments: ["หนังสือแจ้งผลคำพิพากษา_100310.pdf"],
      l8CaseRegNo: "ทบ.อธ. 0040/2569",
      l8CaseRegDate: getDateWithOffset(-14),
      l8RegNotes: "-",
      l8DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l8DirectorOrderDate: getDateWithOffset(-13),
      l8DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l8GroupAssignNotes: "มอบหมายให้นิติกรลงทะเบียนและตรวจสอบคำพิพากษา",
      l8GroupAssignDate: getDateWithOffset(-12),
      l8GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l8RelatedCaseNo: "-",
      l8OpinionAttachments: ["บันทึกเสนอบอร์ด_คดี100310.pdf"],
      l8ProposedBranch: "BOARD",
      l8GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
    },
    {
      /* เดินผ่าน Part 9 ครบแล้ว (ธุรการส่งมติที่ 10-3v-28) จำลองว่าบอร์ดมีมติ
         "เห็นชอบให้อุทธรณ์" กลับมาแล้ว วางไว้ที่ statusCode
         L9_BOARD_APPROVED_APPEAL ล่วงหน้าเพื่อรอทดสอบ Branch A (รับเรื่อง →
         LAW0153 เป็นต้นไป) ที่ยังไม่ implement — ตอนนี้ inbox จะแสดงเป็นแถว
         ดูอย่างเดียว (ไม่มี route ต่อจนกว่าจะสร้างหน้า 10-3v-29 เป็นต้นไป)
         ดู "plan the flow after 10-3v-28" ในบทสนทนา / flow-page-09.md,
         flow-page-10.md */
      id: "คดีปกครอง-100311/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 311/2569 หมายเลขแดงที่ อ. 365/2569 (นายอนุชา ทองประเสริฐ ฟ้อง ผู้ว่าราชการจังหวัดนนทบุรี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 311/2569",
      redCaseNo: "อ. 365/2569",
      plaintiffs: ["นายอนุชา ทองประเสริฐ"],
      defendants: ["ผู้ว่าราชการจังหวัดนนทบุรี"],
      accuser: "นายอนุชา ทองประเสริฐ",
      accused: "ผู้ว่าราชการจังหวัดนนทบุรี",
      courtReceivedDate: getDateWithOffset(-30),
      verdictDate: getDateWithOffset(-32),
      verdictNoticeNo: "อส 0027.3/1311",
      verdictNoticeDate: getDateWithOffset(-30),
      courtSarabanNo: "สบ.0041/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100311.pdf"],
      lawReceiveNo: "0041/2569",
      centralSarabanNo: "2569/4511",
      physicalDocDate: getDateWithOffset(-30),
      l3VerdictRegNo: "ทบ.ปค. 0041/2569",
      l3VerdictRegDate: getDateWithOffset(-29),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-30),
      dueDate: getDateWithOffset(-2),
      workflowStep: 3,
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      status: "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์",
      statusCode: "L9_BOARD_APPROVED_APPEAL",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งเพิกถอนใบอนุญาตก่อสร้าง",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งเพิกถอนใบอนุญาตก่อสร้างดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-27),
      l3AppealDeadline: getDateWithOffset(-8),
      l3AppealByPlaintiff: "-",
      l3ProposedBranch: "APPEAL_CONSIDER",
      l8CentralSarabanNo: "2569/4511",
      l8PhysicalDocDate: getDateWithOffset(-30),
      l8LawReceiveNo: "0041/2569",
      l8NoticeDate: getDateWithOffset(-30),
      l8NoticeAttachments: ["หนังสือแจ้งผลคำพิพากษา_100311.pdf"],
      l8CaseRegNo: "ทบ.อธ. 0041/2569",
      l8CaseRegDate: getDateWithOffset(-26),
      l8RegNotes: "-",
      l8DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l8DirectorOrderDate: getDateWithOffset(-25),
      l8DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l8GroupAssignNotes: "มอบหมายให้นิติกรลงทะเบียนและตรวจสอบคำพิพากษา",
      l8GroupAssignDate: getDateWithOffset(-24),
      l8GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l8RelatedCaseNo: "-",
      l8OpinionAttachments: ["บันทึกเสนอบอร์ด_คดี100311.pdf"],
      l8ProposedBranch: "BOARD",
      l8GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l9GroupApproveNotes: "เห็นชอบตามบันทึกที่นิติกรเสนอ",
      l9DirectorApproveNotes: "เห็นชอบและให้ส่งมติเสนอบอร์ด",
      l9InternalDocNo: "ทบ.มต. 0041/2569",
      l9SentDate: getDateWithOffset(-18),
      l9SendNotes: "-",
      l9BoardMeetingDate: getDateWithOffset(-5),
      l9BoardResolutionNo: "มติที่ 12/2569",
      l9BoardDecision: "APPEAL",
      l9BoardNotes: "บอร์ดเห็นชอบให้อุทธรณ์คำพิพากษาต่อศาลปกครองสูงสุด",
    },
    {
      /* เดินผ่าน Part 9 ครบแล้ว (ธุรการส่งมติที่ 10-3v-28) จำลองว่าบอร์ดมีมติ
         "เห็นชอบไม่อุทธรณ์" กลับมาแล้ว วางไว้ที่ statusCode
         L9_BOARD_APPROVED_NO_APPEAL ล่วงหน้าเพื่อรอทดสอบ Branch B (รับเรื่อง →
         LAW0164 เป็นต้นไป, Part 11) ที่ยังไม่ implement — ตอนนี้ inbox จะแสดง
         เป็นแถวดูอย่างเดียว (ไม่มี route ต่อจนกว่าจะสร้างหน้าใหม่) ดู "plan the
         flow after 10-3v-28" ในบทสนทนา / flow-page-09.md, flow-page-11.md */
      id: "คดีปกครอง-100312/2569",
      title:
        "ผลคำพิพากษาศาลปกครองชั้นต้น คดีหมายเลขดำที่ อ. 312/2569 หมายเลขแดงที่ อ. 366/2569 (นางสมศรี บุญมาก ฟ้อง อธิบดีกรมพัฒนาสังคมและสวัสดิการ)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      l3CaseType: "verdict",
      courtName: "ศาลปกครองกลาง",
      blackCaseNo: "อ. 312/2569",
      redCaseNo: "อ. 366/2569",
      plaintiffs: ["นางสมศรี บุญมาก"],
      defendants: ["อธิบดีกรมพัฒนาสังคมและสวัสดิการ"],
      accuser: "นางสมศรี บุญมาก",
      accused: "อธิบดีกรมพัฒนาสังคมและสวัสดิการ",
      courtReceivedDate: getDateWithOffset(-28),
      verdictDate: getDateWithOffset(-30),
      verdictNoticeNo: "อส 0027.3/1312",
      verdictNoticeDate: getDateWithOffset(-28),
      courtSarabanNo: "สบ.0042/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: ["คำพิพากษา_คดี100312.pdf"],
      lawReceiveNo: "0042/2569",
      centralSarabanNo: "2569/4512",
      physicalDocDate: getDateWithOffset(-28),
      l3VerdictRegNo: "ทบ.ปค. 0042/2569",
      l3VerdictRegDate: getDateWithOffset(-27),
      l3VerdictRegNotes: "-",
      dateReceived: getDateWithOffset(-28),
      dueDate: getDateWithOffset(0),
      workflowStep: 3,
      assignedRole: "admin_legal",
      officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      status: "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์",
      statusCode: "L9_BOARD_APPROVED_NO_APPEAL",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0127",
      l3StepSeq: 5,
      l3VerdictIssues: "ประเด็นความชอบด้วยกฎหมายของคำสั่งยุติการให้สวัสดิการ",
      l3VerdictResult: "แพ้",
      l3VerdictSummary:
        "ศาลพิพากษายกฟ้อง เนื่องจากคำสั่งยุติการให้สวัสดิการดำเนินการตามหลักเกณฑ์ที่กฎหมายกำหนดโดยชอบ",
      l3VerdictReadDate: getDateWithOffset(-25),
      l3AppealDeadline: getDateWithOffset(-6),
      l3AppealByPlaintiff: "-",
      l3ProposedBranch: "APPEAL_CONSIDER",
      l8CentralSarabanNo: "2569/4512",
      l8PhysicalDocDate: getDateWithOffset(-28),
      l8LawReceiveNo: "0042/2569",
      l8NoticeDate: getDateWithOffset(-28),
      l8NoticeAttachments: ["หนังสือแจ้งผลคำพิพากษา_100312.pdf"],
      l8CaseRegNo: "ทบ.อธ. 0042/2569",
      l8CaseRegDate: getDateWithOffset(-24),
      l8RegNotes: "-",
      l8DirectorOrderNotes: "มอบหมายให้ ผอ.กลุ่มงานคดีพิจารณาต่อ",
      l8DirectorOrderDate: getDateWithOffset(-23),
      l8DirectorAssignTarget: "นายพิชัย เรืองศรี (ผู้อำนวยการกลุ่มงานคดี)",
      l8GroupAssignNotes: "มอบหมายให้นิติกรลงทะเบียนและตรวจสอบคำพิพากษา",
      l8GroupAssignDate: getDateWithOffset(-22),
      l8GroupAssignTarget: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      l8RelatedCaseNo: "-",
      l8OpinionAttachments: ["บันทึกเสนอบอร์ด_คดี100312.pdf"],
      l8ProposedBranch: "BOARD",
      l8GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l9GroupApproveNotes: "เห็นชอบตามบันทึกที่นิติกรเสนอ",
      l9DirectorApproveNotes: "เห็นชอบและให้ส่งมติเสนอบอร์ด",
      l9InternalDocNo: "ทบ.มต. 0042/2569",
      l9SentDate: getDateWithOffset(-16),
      l9SendNotes: "-",
      l9BoardMeetingDate: getDateWithOffset(-5),
      l9BoardResolutionNo: "มติที่ 12/2569",
      l9BoardDecision: "NO_APPEAL",
      l9BoardNotes: "บอร์ดเห็นชอบไม่อุทธรณ์ตามที่นิติกรเสนอ",
    },
    {
      id: "คดีปกครอง-100401/2569",
      title:
        "นายสุวิทย์ ตัวอย่างดี (ผู้ฟ้องคดี) ยื่นฟ้อง นายกเทศมนตรีตำบลบางตัวอย่าง, คณะกรรมการ ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      summonsName: "คำสั่งเรียกให้ทำคำให้การ",
      courtName: "ศาลปกครองกลาง",
      orderedTo: "คณะกรรมการ ป.ป.ท.",
      blackCaseNo: "บ. 132/2569",
      redCaseNo: "",
      courtDeadlineDays: "30",
      courtReceivedDate: "2026-08-24",
      plaintiffs: ["นายสุวิทย์ ตัวอย่างดี"],
      defendants: ["นายกเทศมนตรีตำบลบางตัวอย่าง", "คณะกรรมการ ป.ป.ท."],
      accuser: "นายสุวิทย์ ตัวอย่างดี",
      accused: "นายกเทศมนตรีตำบลบางตัวอย่าง, คณะกรรมการ ป.ป.ท.",
      courtSarabanNo: "สบ.0401/2569",
      courtRemark: "-",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายเรียกศาลปกครองกลาง_บ132-2569.pdf",
        "สำเนาคำฟ้อง_บ132-2569.pdf",
      ],
      l3HasStayObjectionSummons: false,
      stayObjectionFileNames: [],
      lawReceiveNo: "0401/2569",
      centralSarabanNo: "2569/5401",
      paccCaseNo: "ปค. 0401/2569",
      blackNo: "บ. 132/2569",
      redNo: "-",
      dateReceived: "2026-08-24",
      dueDate: "2026-09-23",
      workflowStep: 3,
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "admin_legal",
      status: "รอเสนอบอร์ด (กิจกรรมที่ 7)",
      statusCode: "L3_READY_FOR_BOARD",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0095",
      l3StepSeq: 7,
      l3ReviewNotes:
        "ผู้ฟ้องคดีขอให้เพิกถอนมติคณะกรรมการ ป.ป.ท. ที่ชี้มูลความผิดทางวินัย ตรวจแล้วมติดำเนินการตามขั้นตอนของกฎหมาย",
      l3HasStayRequest: false,
      l3RelatedCaseNo: "0065/2568",
      l3OpinionText:
        "เห็นควรเสนอคณะกรรมการ ป.ป.ท. มีมติมอบอำนาจให้ผู้อำนวยการกองกฎหมายขอขยายระยะเวลายื่นคำให้การ และมอบหมายพนักงานอัยการ สำนักงานคดีปกครอง เป็นผู้แก้ต่างคดี",
      l3OpinionAttachments: [],
      l3GroupApproveNotes: "เห็นชอบตามที่นิติกรเสนอ",
      l3InternalDocNo: "ปป 0003/4512",
      l3InternalDocDate: "1 ก.ย. 2569",
      l3DispatchNotes: "เสนอคณะกรรมการ ป.ป.ท. พิจารณา",
      l3IncomingBoardReport: {
        meetingNo: "45/2569",
        meetingDate: "2026-09-08",
        agendaNo: "4.12",
        result: "มีมติมอบอำนาจ",
        text:
          "(1) มอบอำนาจให้ผู้อำนวยการกองกฎหมาย ขอขยายระยะเวลายื่นคำให้การต่อศาลปกครองกลาง และดำเนินการในกระบวนพิจารณาคดีแทนคณะกรรมการ ป.ป.ท.\n(2) มอบหมายพนักงานอัยการ สำนักงานคดีปกครอง เป็นผู้แก้ต่างคดี\n(3) มอบหมายประธานกรรมการ ป.ป.ท. เป็นผู้ลงนามในหนังสือมอบอำนาจแทนคณะกรรมการ ป.ป.ท.",
        reportFileNames: ["รายงานสรุปมติ_ครั้งที่45-2569_วาระ4.12.pdf"],
        reportedBy: "กองบริหารคดี (กลุ่มวินิจฉัยและมติคณะกรรมการ)",
        reportDate: "2026-09-10",
      },
    },
    {
      id: "คดีปกครอง-100402/2569",
      title:
        "บริษัท ก่อสร้างตัวอย่าง จำกัด (ผู้ฟ้องคดี) ยื่นฟ้อง สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      summonsName: "คำสั่งเรียกให้ทำคำชี้แจง",
      courtName: "ศาลปกครองเชียงใหม่",
      orderedTo: "สำนักงาน ป.ป.ท.",
      blackCaseNo: "บ. 57/2569",
      redCaseNo: "",
      courtDeadlineDays: "15",
      courtReceivedDate: "2026-08-28",
      plaintiffs: ["บริษัท ก่อสร้างตัวอย่าง จำกัด"],
      defendants: ["สำนักงาน ป.ป.ท."],
      accuser: "บริษัท ก่อสร้างตัวอย่าง จำกัด",
      accused: "สำนักงาน ป.ป.ท.",
      courtSarabanNo: "สบ.0402/2569",
      courtRemark: "ศาลสั่งให้ชี้แจงข้อเท็จจริงเกี่ยวกับการตรวจสอบสัญญาจ้างก่อสร้าง",
      receivingUnit: "กองกฎหมาย",
      attachmentFileNames: [
        "หมายศาลปกครองเชียงใหม่_บ57-2569.pdf",
        "สำเนาคำฟ้อง_บ57-2569.pdf",
      ],
      l3HasStayObjectionSummons: false,
      stayObjectionFileNames: [],
      lawReceiveNo: "0402/2569",
      centralSarabanNo: "2569/5402",
      paccCaseNo: "ปค. 0402/2569",
      blackNo: "บ. 57/2569",
      redNo: "-",
      dateReceived: "2026-08-28",
      dueDate: "2026-09-12",
      workflowStep: 3,
      officer: "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)",
      assignedRole: "admin_legal",
      status: "รอเสนอบอร์ด (กิจกรรมที่ 7)",
      statusCode: "L3_READY_FOR_BOARD",
      statusBadge: "bg-primary text-white",
      l3Step: "LAW0095",
      l3StepSeq: 7,
      l3ReviewNotes:
        "ผู้ฟ้องคดีโต้แย้งผลการตรวจสอบสัญญาจ้างก่อสร้าง ศาลสั่งให้ผู้ถูกฟ้องคดีชี้แจงข้อเท็จจริง",
      l3HasStayRequest: false,
      l3RelatedCaseNo: "0068/2568",
      l3OpinionText:
        "เห็นควรเสนอคณะกรรมการ ป.ป.ท. มีมติมอบอำนาจให้ผู้อำนวยการกองกฎหมายจัดทำและยื่นคำชี้แจงต่อศาลปกครองเชียงใหม่ภายในกำหนด",
      l3OpinionAttachments: [],
      l3GroupApproveNotes: "เห็นชอบ ให้เร่งดำเนินการเนื่องจากศาลกำหนด 15 วัน",
      l3InternalDocNo: "ปป 0003/4538",
      l3InternalDocDate: "2 ก.ย. 2569",
      l3DispatchNotes: "เรื่องเร่งด่วน เสนอคณะกรรมการ ป.ป.ท. พิจารณา",
      l3IncomingBoardReport: {
        meetingNo: "46/2569",
        meetingDate: "2026-09-11",
        agendaNo: "3.7",
        result: "มีมติมอบอำนาจ",
        text:
          "(1) มอบอำนาจให้ผู้อำนวยการกองกฎหมาย จัดทำและยื่นคำชี้แจงต่อศาลปกครองเชียงใหม่แทนสำนักงาน ป.ป.ท.\n(2) มอบหมายผู้อำนวยการกองกฎหมาย ประสานพนักงานอัยการ สำนักงานคดีปกครองเชียงใหม่ ในการดำเนินคดี",
        reportFileNames: ["รายงานสรุปมติ_ครั้งที่46-2569_วาระ3.7.pdf"],
        reportedBy: "กองบริหารคดี (กลุ่มวินิจฉัยและมติคณะกรรมการ)",
        reportDate: "2026-09-12",
      },
    },
  ];

  // ฐานข้อมูลสำนวน ป.ป.ท. สำหรับการลงรับเรื่อง (Intake Database)
  const PACC_INTAKE_DATABASE = [
    {
      id: "คดี-100000/2569",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title:
        "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
      accused: "นายสมชาย ทุจริตมั่น",
      accusedPosition: "อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ",
      statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(13),
      paccCaseNo: "0012/2568",
      blackNo: "อ. 104/2569",
      redNo: "อ. 308/2569",
      centralSarabanNo: "2569/4401",
    },
    {
      id: "คดี-100001/2569",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title:
        "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 3",
      accuser: "สำนักงาน ป.ป.ท. เขต 3",
      accused: "นายวิชัย การกุศล",
      accusedPosition: "เจ้าพนักงานจัดเก็บรายได้",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)",
      dateReceived: getDateWithOffset(-5),
      dueDate: getDateWithOffset(10),
      paccCaseNo: "0031/2568",
      blackNo: "อ. 98/2569",
      redNo: "อ. 290/2569",
      centralSarabanNo: "2569/4412",
    },
    {
      id: "คดี-100002/2569",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title:
        "ความเห็นแย้งคดีเจ้าหน้าที่เรียกรับผลประโยชน์ในการออกใบอนุญาตสีก่อสร้าง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริตภาค 1",
      accuser: "สำนักงาน ป.ป.ท. เขต 1",
      accused: "นายศิริโชค มีอำนาจ",
      accusedPosition: "หัวหน้าฝ่ายโยธา",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 10 ต.ค. 2584)",
      dateReceived: getDateWithOffset(-3),
      dueDate: getDateWithOffset(12),
      paccCaseNo: "0045/2568",
      blackNo: "อ. 112/2569",
      redNo: "อ. 319/2569",
      centralSarabanNo: "2569/4420",
    },
    {
      id: "คำร้อง-100007/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำร้องขอเปิดเผยรายงานผลการตรวจสอบข้อเท็จจริงโครงการจัดซื้อกล้อง CCTV",
      source: "สมาคมพิทักษ์สิทธิประชาชนและสื่อมวลชน",
      accuser: "นายกานต์ สิทธิธรรม (ผู้ร้องเรียน)",
      accused: "สำนักงาน ป.ป.ท.",
      accusedPosition: "กองตรวจราชการ",
      courtOrder: "คำร้องขอข้อมูลข่าวสารตาม พ.ร.บ. ข้อมูลข่าวสารฯ",
      statuteLimitation: "SLA 15 วันทำการ",
      dateReceived: getDateWithOffset(-1),
      dueDate: getDateWithOffset(14),
      paccCaseNo: "ขส. 0005/2569",
      blackNo: "-",
      redNo: "-",
      centralSarabanNo: "2569/4435",
    },
    {
      id: "คำร้อง-100008/2569",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอคัดสำเนาเอกสารรายงานผลการดำเนินคดีทางวินัยเจ้าหน้าที่รัฐ",
      source: "สำนักข่าวร่วมพัฒนา",
      accuser: "นางสาวศิริพร บุญช่วย (ผู้แทนสำนักข่าว)",
      accused: "สำนักงาน ป.ป.ท.",
      accusedPosition: "กองกฎหมาย",
      courtOrder: "คำร้องขอข้อมูลข่าวสารตาม พ.ร.บ. ข้อมูลข่าวสารฯ",
      statuteLimitation: "SLA 15 วันทำการ",
      dateReceived: getDateWithOffset(-4),
      dueDate: getDateWithOffset(11),
      paccCaseNo: "ขส. 0008/2569",
      blackNo: "-",
      redNo: "-",
      centralSarabanNo: "2569/4442",
    },
    {
      id: "อุทธรณ์-100009/2569",
      category: "10.2.2",
      categoryName: "การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร",
      title:
        "คำอุทธรณ์คำสั่งปฏิเสธไม่เปิดเผยข้อมูลข่าวสารลับเกี่ยวกับแผนปฏิบัติการสืบสวน",
      source: "คณะกรรมการวินิจฉัยการเปิดเผยข้อมูลข่าวสาร",
      accuser: "นายสมเกียรติ ยุติธรรม (ผู้อุทธรณ์)",
      accused: "สำนักงาน ป.ป.ท.",
      accusedPosition: "",
      courtOrder: "คำอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลข่าวสาร",
      statuteLimitation: "SLA 30 วัน",
      dateReceived: getDateWithOffset(-6),
      dueDate: getDateWithOffset(24),
      paccCaseNo: "อธ. 0002/2569",
      blackNo: "-",
      redNo: "-",
      centralSarabanNo: "2569/4450",
    },
    {
      id: "คดีปกครอง-100006/2569",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      title:
        "หมายเรียกและสำเนาคำฟ้องคดีพิพาทเกี่ยวกับการกระทำละเมิดของหน่วยงานทางปกครอง (เพิกถอนคำสั่งทางปกครอง)",
      source: "ศาลปกครองกลาง (แผนกคดีบริหารงานบุคคล)",
      accuser: "นายอนุชา ภักดีชน (ผู้ฟ้องคดี)",
      accused: "เลขาธิการ ป.ป.ท. และสำนักงาน ป.ป.ท.",
      accusedPosition: "ผู้ถูกฟ้องคดี",
      courtOrder: "หมายเรียกให้จัดทำคำให้การต่อศาลปกครอง",
      statuteLimitation: "30 วัน (นับแต่วันที่ได้รับหมายเรียก)",
      dateReceived: getDateWithOffset(-7),
      dueDate: getDateWithOffset(23),
      paccCaseNo: "ปค. 0004/2569",
      blackNo: "บ. 45/2569",
      redNo: "-",
      centralSarabanNo: "2569/4462",
    },
    {
      id: "คดีปกครอง-100010/2569",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      title: "หมายเรียกและสำเนาคำฟ้องคดีจัดซื้อจัดจ้างระบบเทคโนโลยีสารสนเทศ",
      source: "ศาลปกครองกลาง",
      accuser: "บริษัท ดิจิทัล โซลูชั่นส์ จำกัด (ผู้ฟ้องคดี)",
      accused: "สำนักงาน ป.ป.ท.",
      accusedPosition: "ผู้ถูกฟ้องคดี",
      courtOrder: "หมายเรียกให้ยื่นคำให้การ",
      statuteLimitation: "30 วัน",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(28),
      paccCaseNo: "ปค. 0008/2569",
      blackNo: "บ. 78/2569",
      redNo: "-",
      centralSarabanNo: "2569/4475",
    },
  ];

  /* Recompose a split name + position back into "Name (Position)".
     Used by list views that render the combined string; the workflow
     display forms render the two fields separately. */
  function fullName(name, position) {
    if (!name) return "-";
    return position ? name + " (" + position + ")" : name;
  }

  /* Render any stored date as dd-mm-yyyy with a Buddhist (พ.ศ.) year.
     Storage stays ISO yyyy-mm-dd so <input type="date"> keeps working;
     this is a display-only formatter. Idempotent. */
  function formatDisplayDate(value) {
    if (!value) return "-";
    let d;
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      d = new Date(value);
    } else if (value instanceof Date) {
      d = value;
    } else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(String(value))) {
      const parts = String(value).split(/[-/]/);
      const year =
        Number(parts[2]) > 2400 ? Number(parts[2]) - 543 : Number(parts[2]);
      d = new Date(year, Number(parts[1]) - 1, Number(parts[0]));
    } else {
      return value;
    }
    if (isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return dd + "-" + mm + "-" + (d.getFullYear() + 543);
  }

  /* แถบเตือนเมื่อระบบสลับไปแสดงสำนวนอื่นแทนสำนวนที่ร้องขอ
     แจ้งเฉพาะกรณีที่ระบุ ?id มาใน URL จริง ๆ เพราะค่า default ของแต่ละหน้า
     เป็นค่าสมมติที่ไม่มีอยู่จริงอยู่แล้ว ถ้าเตือนทุกครั้งจะกลายเป็นเสียงรบกวน */
  function notifyCaseFallback(requestedId, shownCase) {
    try {
      const requestedFromUrl = new URLSearchParams(window.location.search).get(
        "id",
      );
      if (!requestedFromUrl || requestedFromUrl !== requestedId) return;
      if (window.__ecmisCaseFallbackWarned) return;
      window.__ecmisCaseFallbackWarned = true;

      console.warn(
        "[E-CMIS] ไม่พบสำนวน " +
          requestedId +
          " จึงแสดงสำนวน " +
          (shownCase && shownCase.id) +
          " แทน",
      );

      const render = function () {
        /* body ของทุกหน้าเป็น flex row (sidebar + main) การแทรกที่ body โดยตรง
           จะกลายเป็นคอลัมน์ที่สามและดันทั้งหน้าไปด้านข้าง จึงแทรกไว้ใน .main
           ซึ่งเป็น flex column แทน และถอยไปใช้ position:fixed ถ้าไม่มี .main */
        const host = document.querySelector(".main");
        if (!host && !document.body) return;

        const bar = document.createElement("div");
        bar.id = "ecmisCaseFallbackBar";
        bar.style.cssText =
          "background:#fef3c7; color:#92400e; border-bottom:2px solid #f59e0b;" +
          "padding:10px 16px; font-size:0.88em; font-weight:600;" +
          "display:flex; align-items:center; gap:10px; flex-shrink:0;" +
          (host ? "" : "position:fixed; top:0; left:0; right:0; z-index:3000;");
        bar.innerHTML =
          '<span style="font-size:1.1em">⚠️</span><span>ไม่พบสำนวน <b>' +
          requestedId +
          "</b> ในระบบ — กำลังแสดงสำนวน <b>" +
          (shownCase && shownCase.id) +
          "</b> แทน ข้อมูลและขั้นตอนที่เห็นจึงไม่ใช่ของสำนวนที่ร้องขอ</span>";

        if (host) host.insertBefore(bar, host.firstChild);
        else document.body.insertBefore(bar, document.body.firstChild);
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
      } else {
        render();
      }
    } catch (e) {
      /* ไม่ให้การแจ้งเตือนไปทำให้หน้าพัง */
    }
  }

  /* ย้ายสำนวนที่ผู้ใช้สร้างเองข้ามการเปลี่ยน DATA_VERSION
     คีย์ของ localStorage ผูกกับ DATA_VERSION ทุกครั้งที่ขึ้นเวอร์ชัน (ซึ่งจำเป็น
     เมื่อแก้ข้อมูลตัวอย่าง) ระบบจะเริ่มคลังใหม่ทั้งหมด สำนวนที่ทดสอบไว้จึงหายเงียบ ๆ
     จึงเก็บเฉพาะสำนวนที่ไม่ได้มาจากข้อมูลตัวอย่างติดมาด้วย แล้วลบคีย์เก่าทิ้ง
     เพื่อไม่ให้คีย์ค้างสะสมไปเรื่อย ๆ */
  function migrateUserCasesFromOlderVersions(seed) {
    const seededIds = new Set(seed.map((c) => c.id));
    const carried = [];
    const oldKeys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || key === STORAGE_KEY) continue;
        if (key.indexOf("ecmis_act10_cases_") !== 0) continue;
        oldKeys.push(key);
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(parsed)) continue;
        parsed.forEach((c) => {
          if (c && c.id && !seededIds.has(c.id)) {
            seededIds.add(c.id);
            carried.push(c);
          }
        });
      }
      oldKeys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Failed to migrate cases from an older store", e);
    }
    if (carried.length) {
      console.info(
        "[E-CMIS] ย้ายสำนวนที่สร้างเอง " +
          carried.length +
          " รายการ มายังข้อมูลชุดใหม่",
      );
    }
    return seed.concat(carried);
  }

  function loadCases() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse cases from localStorage", e);
    }
    const seeded = migrateUserCasesFromOlderVersions(INITIAL_CASES);
    saveCases(seeded);
    return seeded;
  }

  function saveCases(cases) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    } catch (e) {
      console.warn("Failed to save cases to localStorage", e);
    }
  }

  // Activity 10 Engine API
  const Activity10 = {
    fullName,
    formatDisplayDate,
    getCases: loadCases,
    saveCases,
    getPaccIntakeDatabase() {
      return PACC_INTAKE_DATABASE;
    },

    /* หน่วยงานผู้รับหนังสือ กำหนดจากผลการพิจารณาของนิติกร ไม่ใช่ให้ธุรการเลือก
       ตามมติที่ประชุม 01/09/2569: เห็นชอบแจ้งอัยการต้นทาง เห็นแย้งแจ้งทั้ง อสส. และอัยการ
       ไม่มีผลการพิจารณา ให้ถือเป็นเห็นแย้งไว้ก่อน เพราะการส่งเกินยังแก้ได้
       แต่การไม่ได้ส่งให้ อสส. ทำให้สำนวนไปไม่ถึงผู้มีอำนาจชี้ขาด
       opinionOverride ใช้เฉพาะปุ่มทดสอบที่หน้า 18 */
    getRequiredRecipients(caseItem, opinionOverride) {
      const item = caseItem || {};
      const prosecutor = {
        key: "prosecutor",
        name: item.source || "สำนักงานอัยการเจ้าของสำนวน",
      };
      const oag = { key: "oag", name: "สำนักงานอัยการสูงสุด (อสส.)" };

      let agreed;
      if (opinionOverride === "AGREED") agreed = true;
      else if (opinionOverride === "DISAGREED") agreed = false;
      else agreed = String(item.finalOpinionType || "").includes("เห็นชอบ");

      return agreed ? [prosecutor] : [oag, prosecutor];
    },

    /* หน้า 20/21/22: บรรทัดเปรียบเทียบ "มติอัยการเดิม" (การ์ดพับ) กับ "ผลการชี้ขาดล่าสุด
       ของ อสส." อ่านจาก oagVerdictDecision อย่างเดียว ซึ่งเป็นค่าเดียวกับที่ทั้งสามหน้า
       ใช้ตัดสิน badge/สีอยู่แล้ว จึงไม่เพิ่มการอนุมานทางกฎหมายใหม่
       มติอัยการเดิมทั้ง 8 ข้อ (ไม่นับ 9. อื่นๆ) ล้วนเป็น "ไม่ดำเนินคดีต่อ" อยู่แล้ว
       (เป็นเงื่อนไขที่ทำให้ Flow 10.1 เกิดขึ้น) ดังนั้น PROSECUTE จึงแปลว่าต่างจากเดิมเสมอ
       และ NON_PROSECUTE แปลว่ายืนตามเดิมเสมอ — ยกเว้นมติอัยการเดิมเป็น 9. อื่นๆ ซึ่งไม่ทราบ
       ทิศทางเดิม จึงอนุมานความสัมพันธ์ไม่ได้ */
    describeVerdictComparison(caseItem) {
      const item = caseItem || {};
      const hasKnownProsecutorType = /^[1-8]$/.test(
        String(item.prosecutorCaseTypeNo),
      );
      const decision = item.oagVerdictDecision;
      const verdictLabel =
        String(item.oagVerdictCaseTypeName || "")
          .replace(/^\d+\.\s*/, "")
          .trim() ||
        (decision === "PROSECUTE"
          ? "อสส. ชี้ขาดให้ฟ้องคดี"
          : decision === "NON_PROSECUTE"
            ? "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดี"
            : "ยังไม่มีข้อมูลผลการชี้ขาดล่าสุด");

      if (
        !hasKnownProsecutorType ||
        (decision !== "PROSECUTE" && decision !== "NON_PROSECUTE")
      ) {
        return {
          verdictLabel,
          relation: "UNKNOWN",
          tone: "unknown",
          headline:
            'เทียบกับมติอัยการเดิมไม่ได้ — โปรดเปิดดู "ข้อมูลเดิม" เพื่อเปรียบเทียบเอง',
        };
      }

      if (decision === "PROSECUTE") {
        return {
          verdictLabel,
          relation: "DIFFERS",
          tone: "differs",
          headline: "ต่างจากมติอัยการเดิม — เห็นพ้องตามความเห็นแย้งของ ป.ป.ท.",
        };
      }

      return {
        relation: "UPHOLDS",
        verdictLabel,
        tone: "upholds",
        headline: "ยืนตามมติอัยการเดิม — ไม่เป็นไปตามความเห็นแย้งของ ป.ป.ท.",
      };
    },

    /* หน้า 19: ข้อความสรุปสาระสำคัญ + ชื่อไฟล์ตัวอย่างที่เติมให้อัตโนมัติเมื่อธุรการเลือก
       "กรณีคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)" เดิมเติมข้อความคงที่ตาม isProsecute
       (ฟ้อง/ไม่ฟ้อง) เพียง 2 แบบ ไม่ว่าจะเลือกข้อใดใน 9 ตัวเลือก ทำให้เลือก "7. ให้ฎีกา"
       แล้วสรุป/ชื่อไฟล์ยังพูดถึง "ฟ้องคดี" อยู่ ไม่ตรงกับหัวข้อคำวินิจฉัยล่าสุดที่หน้า 20/21/22
       อ่านจาก oagVerdictCaseTypeName (ถูกต้องอยู่แล้ว) จึงต้องอ่านตัวเลือกที่เลือกจริงด้วยเช่นกัน
       ไม่มีตัวเลือกที่บันทึกไว้ (สำนวนเก่าก่อน 07/09/2569) → ใช้ข้อความทั่วไปตาม decision เดิม */
    buildVerdictAutofill({
      caseTypeNo,
      caseTypeOptionText,
      otherText,
      decision,
    }) {
      const isProsecute = decision === "PROSECUTE";
      const isOther = String(caseTypeNo) === "9";

      const actionPhrase = isOther
        ? `ตามที่ระบุ (อื่นๆ): "${(otherText || "").trim() || "ไม่ได้ระบุรายละเอียด"}"`
        : String(caseTypeOptionText || "")
            .replace(/^\d+\.\s*อสส\.\s*ชี้ขาด/, "")
            .trim();

      const hasSpecificOption = !!actionPhrase;
      const effectivePhrase = hasSpecificOption
        ? actionPhrase
        : isProsecute
          ? "ให้ฟ้องคดี"
          : "ไม่ฟ้อง/ยุติคดี";

      const summary = isProsecute
        ? `อัยการสูงสุดได้พิจารณาข้อเท็จจริง พยานหลักฐาน และเหตุผลในหนังสือความเห็นแย้งของคณะกรรมการ ป.ป.ท. แล้ว มีคำวินิจฉัยชี้ขาด${effectivePhrase} ผู้ถูกกล่าวหา ตามความเห็นแย้งของคณะกรรมการ ป.ป.ท.`
        : `อัยการสูงสุดได้พิจารณาพยานหลักฐานในสำนวนคดีแล้ว มีคำวินิจฉัยชี้ขาด${effectivePhrase} และให้ยุติการดำเนินคดีอาญากับผู้ถูกกล่าวหาตามคำสั่งเดิมของพนักงานอัยการ`;

      const fileTag = isOther
        ? "อื่นๆ"
        : hasSpecificOption
          ? actionPhrase.replace(/[\s()\/"]+/g, "").slice(0, 24)
          : isProsecute
            ? "ให้ฟ้องคดี"
            : "ไม่ฟ้องคดี";

      const fileName = `หนังสือคำวินิจฉัยชี้ขาด_อสส_${fileTag}_อส0001_${isProsecute ? "6789" : "6790"}.pdf`;

      return { summary, fileName };
    },

    /* หมายเหตุ: ถ้าหาสำนวนตาม id ไม่เจอ จะ fallback เป็นสำนวนแรกในระบบ
       เพราะทุกหน้าตั้ง id เริ่มต้นเป็นค่าสมมติไว้ ทำให้เปิดหน้าตรง ๆ แล้วยังมีข้อมูลให้ดู
       แต่เดิม fallback นี้เงียบสนิท ผู้ใช้จึงเห็นสำนวนอื่นโดยไม่รู้ตัว
       (เช่นเปิดหน้า 07 ด้วยสำนวนที่ถูกลบไปแล้ว จะได้สำนวนที่เดินไปถึงขั้นตอน 19
        ซึ่งไม่มีปุ่มให้อนุมัติ และ stepper ก็ไม่ตรงกับสำนวนที่แสดง)
       จึงแจ้งเตือนให้เห็นชัดเมื่อเกิดการสลับสำนวน */
    getCaseById(id) {
      const cases = loadCases();
      if (!cases || cases.length === 0) return null;
      const found = cases.find((c) => c.id === id);
      if (found) return found;
      notifyCaseFallback(id, cases[0]);
      return cases[0];
    },

    /* ทำเครื่องหมายว่าขั้นตอนนั้นเสร็จแล้ว โดย "ไม่แตะป้ายชื่อขั้นตอน"
       เดิมแต่ละหน้าเขียนทับ innerHTML ทั้งก้อน จึงต้องพิมพ์ชื่อขั้นตอนซ้ำลงไปเอง
       และพิมพ์ผิดกันหลายหน้า (หน้า 07 เอาชื่อของขั้นตอน ผอ.กลุ่มงาน ไปทับขั้นตอน ผอ.กอง
       หน้า 08 เอาชื่อ ผอ.กอง ไปทับขั้นตอนธุรการ หน้า 06 เปลี่ยนเลขขั้นตอนจาก 4 เป็น 5)
       การแก้เฉพาะข้อความจะพลาดซ้ำได้อีก จึงเปลี่ยนมาแตะเฉพาะสถานะกับวงกลมแทน */
    markStepCompleted(stepId) {
      const el =
        typeof stepId === "string" ? document.getElementById(stepId) : stepId;
      if (!el) return false;
      el.classList.remove("active");
      el.classList.add("completed");
      const circle = el.querySelector(".step-circle");
      if (circle) circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      return true;
    },

    /* ทำให้ขั้นตอนถัดไปเป็นขั้นที่กำลังดำเนินการ */
    markStepActive(stepId) {
      const el =
        typeof stepId === "string" ? document.getElementById(stepId) : stepId;
      if (!el) return false;
      el.classList.remove("completed");
      el.classList.add("active");
      return true;
    },

    /* ค้นแบบเข้มงวด — ไม่เจอคือ null ใช้เมื่อผู้เรียกต้องการตรวจเองว่ามีสำนวนหรือไม่ */
    findCaseById(id) {
      const cases = loadCases();
      if (!cases || !cases.length) return null;
      return cases.find((c) => c.id === id) || null;
    },

    /* Generic patch helper. Activity 10.2 has one workflow step per page and
       each step only ever writes its own fields, so a single merge-and-save
       replaces the long tail of step-specific submit* methods above. */
    updateCase(id, patch) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (!item) return null;
      Object.assign(item, patch || {});
      saveCases(cases);
      return item;
    },

    getTorDetails(c) {
      if (!c)
        return {
          accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
          accused: "นายสมชาย ทุจริตมั่น",
          accusedPosition: "อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง",
          plaintiff: "พนักงานอัยการ / สำนักงาน ป.ป.ท.",
          defendant: "นายสมชาย ทุจริตมั่น",
          paccCaseNo: "0012/2568",
          blackNo: "อ. 104/2569",
          redNo: "อ. 308/2569",
          courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ",
          division: "กองกฎหมาย (กอท.)",
          statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
        };

      const seed = PACC_INTAKE_DATABASE.find((ic) => ic.id === c.id);

      return {
        accuser:
          c.accuser ||
          (seed ? seed.accuser : "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท."),
        accused:
          c.accused ||
          (seed
            ? seed.accused
            : "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)"),
        plaintiff: c.accuser || "พนักงานอัยการ / สำนักงาน ป.ป.ท.",
        defendant: c.accused || "นายสมชาย ทุจริตมั่น",
        paccCaseNo:
          c.paccCaseNo ||
          (seed && seed.paccCaseNo ? seed.paccCaseNo : "0012/2568"),
        blackNo:
          c.blackNo || (seed && seed.blackNo ? seed.blackNo : "อ. 104/2569"),
        redNo: c.redNo || (seed && seed.redNo ? seed.redNo : "อ. 308/2569"),
        courtOrder:
          c.courtOrder ||
          (seed && seed.courtOrder
            ? seed.courtOrder
            : "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ"),
        division: "กองกฎหมาย (กอท.)",
        statuteLimitation:
          c.statuteLimitation ||
          (seed && seed.statuteLimitation
            ? seed.statuteLimitation
            : "15 ปี (หมดอายุความ 28 ก.ค. 2584)"),
      };
    },

    calculateDaysRemaining(c) {
      if (!c) return 15;
      const targetDateStr = c.officerDeadline || c.dueDate;
      if (targetDateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const m = String(targetDateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) {
          let year = parseInt(m[1], 10);
          if (year > 2500) year -= 543;
          const month = parseInt(m[2], 10) - 1;
          const day = parseInt(m[3], 10);
          const targetDate = new Date(year, month, day);
          if (!isNaN(targetDate.getTime())) {
            const diffTime = targetDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }
      if (typeof c.slaDaysRemaining === "number") {
        return c.slaDaysRemaining;
      }
      return 15;
    },

    renderSlaBadgeHtml(c) {
      const days = Activity10.calculateDaysRemaining(c);
      if (days <= 0) {
        return `<span class="text-danger fw-bold small"><i class="fa-solid fa-triangle-exclamation text-danger me-1"></i>เกินกำหนด ${Math.abs(days)} วัน</span>`;
      } else if (days <= 7) {
        return `<span class="text-danger fw-bold small"><i class="fa-solid fa-clock text-danger me-1"></i>เหลือ ${days} วัน</span>`;
      } else if (days <= 15) {
        return `<span class="text-warning-emphasis fw-semibold small"><i class="fa-solid fa-clock text-warning me-1"></i>เหลือ ${days} วัน</span>`;
      } else {
        return `<span class="text-secondary small"><i class="fa-solid fa-clock me-1"></i>เหลือ ${days} วัน</span>`;
      }
    },

    addCase(newCaseData) {
      const cases = loadCases();
      const category = newCaseData.category || "10.1";
      const casePrefix =
        category === "10.1"
          ? "คดี"
          : category.startsWith("10.2")
            ? category === "10.2.2"
              ? "อุทธรณ์"
              : "คำร้อง"
            : "คดีปกครอง";
      let nextNum = 100000;
      if (cases && cases.length > 0) {
        let maxNum = 99999;
        cases.forEach((c) => {
          const m = (c.id || "").match(/(\d{6})\/\d{4}/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
        nextNum = maxNum >= 100000 ? maxNum + 1 : 100000 + cases.length;
      }
      const caseId = newCaseData.id
        ? newCaseData.id.replace(/-10\.\d(\.\d)?-/, "-")
        : `${casePrefix}-${nextNum}/2569`;
      const status = newCaseData.status || "ผอ.กองกฎหมายพิจารณา";
      const statusCode = newCaseData.statusCode || "PENDING_DIRECTOR";
      const statusBadge = newCaseData.statusBadge || "bg-primary text-white";
      const assignedRole = newCaseData.assignedRole || "dir_legal";
      const officer =
        newCaseData.officer || "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)";

      const existingItem = cases.find(
        (c) =>
          c.id === caseId ||
          (newCaseData.id && c.id === newCaseData.id) ||
          (newCaseData.paccCaseNo &&
            c.paccCaseNo &&
            c.paccCaseNo === newCaseData.paccCaseNo),
      );
      if (existingItem) {
        Object.assign(existingItem, newCaseData);
        existingItem.category = category;
        existingItem.categoryName =
          newCaseData.categoryName ||
          (category === "10.1"
            ? "คดีอาญาทุจริตและคดีประพฤติมิชอบ"
            : category === "10.3"
              ? "คดีศาลปกครอง"
              : category === "10.2.2"
                ? "การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร"
                : "การขอเปิดเผยข้อมูลข่าวสาร");
        existingItem.officer = officer;
        existingItem.assignedRole = assignedRole;
        existingItem.status = status;
        existingItem.statusCode = statusCode;
        existingItem.statusBadge = statusBadge;
        existingItem.workflowStep =
          newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2);
        saveCases(cases);
        return existingItem;
      }

      const createdCase = {
        id: caseId,
        title: newCaseData.title || "สำนวนคดีใหม่",
        category: category,
        categoryName:
          newCaseData.categoryName ||
          (category === "10.1"
            ? "คดีอาญาทุจริตและคดีประพฤติมิชอบ"
            : category === "10.3"
              ? "คดีศาลปกครอง"
              : category === "10.2.2"
                ? "การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร"
                : "การขอเปิดเผยข้อมูลข่าวสาร"),
        prosecutorCaseTypeNo: newCaseData.prosecutorCaseTypeNo || "1",
        prosecutorCaseTypeName:
          newCaseData.prosecutorCaseTypeName ||
          "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
        prosecutorLevel: newCaseData.prosecutorLevel || "1",
        prosecutorLevelName: newCaseData.prosecutorLevelName || "ศาลชั้นต้น",
        source:
          newCaseData.source || "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต",
        accuser: newCaseData.accuser || "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
        accused: newCaseData.accused || "",
        officer: officer,
        assignedRole: assignedRole,
        status: status,
        statusCode: statusCode,
        statusBadge: statusBadge,
        lawReceiveNo: newCaseData.lawReceiveNo || "",
        paccCaseNo: newCaseData.paccCaseNo || "",
        blackNo: newCaseData.blackNo || "-",
        redNo: newCaseData.redNo || "-",
        courtOrder:
          newCaseData.courtOrder ||
          (category === "10.1"
            ? "คำสั่งไม่ฟ้องพนักงานอัยการ"
            : "เอกสารรับเรื่อง"),
        statuteLimitation: newCaseData.statuteLimitation || "15 ปี",
        slaTotalDays: newCaseData.slaTotalDays || 15,
        slaDaysRemaining: newCaseData.slaTotalDays || 15,
        slaAlert: "sla-normal",
        dateReceived: new Date().toISOString().split("T")[0],
        dueDate: newCaseData.dueDate || getDateWithOffset(15),
        workflowStep:
          newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2),
        docType: newCaseData.docType || "เอกสารแนบสำนวน",
        docNo: newCaseData.docNo || "นร 10/2569",
        /* ข้อความตั้งต้นสองช่องนี้เป็นสำนวนของงานอัยการ (10.1) เท่านั้น
           หมวด 10.2 ซ่อนช่องเหล่านี้ไว้ จึงต้องไม่เติมข้อความอัยการให้ */
        summary:
          newCaseData.summary ||
          (category === "10.1"
            ? "คณะกรรมการ ป.ป.ท. ได้พิจารณาสำนวนการไต่สวนข้อเท็จจริงแล้วมีมติชี้มูลความผิดผู้ถูกกล่าวหา และส่งสำนวนให้พนักงานอัยการดำเนินคดี"
            : ""),
        legalOpinion:
          newCaseData.legalOpinion ||
          (category === "10.1"
            ? "จากการตรวจพิจารณาสำนวนการไต่สวนข้อเท็จจริง พนักงานอัยการมีคำสั่งเด็ดขาดไม่ฟ้องผู้ถูกกล่าวหา เสนอเรื่องให้สำนักงาน ป.ป.ท. พิจารณาทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาด"
            : ""),
        centralSarabanNo: newCaseData.centralSarabanNo || "",
        signedBy: "",
        signedDate: "",
      };

      /* createdCase is an explicit whitelist of the 10.1 fields. Activity 10.2
         carries its own set (requester details, l2* workflow fields), so pass
         through anything the whitelist did not already claim. */
      Object.keys(newCaseData).forEach((key) => {
        if (!(key in createdCase) && newCaseData[key] !== undefined) {
          createdCase[key] = newCaseData[key];
        }
      });

      cases.unshift(createdCase);
      saveCases(cases);
      return createdCase;
    },

    updateCaseStatus(
      id,
      newStatusCode,
      newStatusText,
      newBadgeClass,
      nextRole,
    ) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = newStatusCode;
        item.status = newStatusText;
        item.statusBadge = newBadgeClass || item.statusBadge;
        if (nextRole) item.assignedRole = nextRole;
        saveCases(cases);
      }
      return item;
    },

    bulkUpdateStatus(
      ids,
      newStatusCode,
      newStatusText,
      newBadgeClass,
      nextRole,
    ) {
      const cases = loadCases();
      cases.forEach((c) => {
        if (ids.includes(c.id)) {
          c.statusCode = newStatusCode;
          c.status = newStatusText;
          c.statusBadge = newBadgeClass || c.statusBadge;
          if (nextRole) c.assignedRole = nextRole;
        }
      });
      saveCases(cases);
      return cases;
    },

    bulkAssignOfficer(ids, officerName) {
      const cases = loadCases();
      cases.forEach((c) => {
        if (ids.includes(c.id)) {
          c.officer = officerName;
        }
      });
      saveCases(cases);
      return cases;
    },

    saveLegalOpinion(id, opinionText) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.legalOpinion = opinionText;
        saveCases(cases);
      }
      return item;
    },

    stampSignature(id, signerName) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.signatureStamped = true;
        item.signedBy = signerName || "ผู้บังคับบัญชาอนุมัติ";
        item.signedDate = formatDisplayDate(new Date());
        item.statusCode = "FINAL_DISPATCHED";
        item.status = "ลงนามชี้ขาดเรียบร้อย";
        item.statusBadge = "bg-success text-white";
        saveCases(cases);
      }
      return item;
    },

    receiveAndForwardToDirector(id, lawReceiveNo) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.lawReceiveNo =
          lawReceiveNo ||
          `${String(Math.floor(10 + Math.random() * 90)).padStart(4, "0")}/2569`;
        item.statusCode = "PENDING_DIRECTOR";
        item.status = "ผอ.กองกฎหมายพิจารณา";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "dir_legal";
        item.workflowStep = 3;
        saveCases(cases);
      }
      return item;
    },

    savePhysicalDocIntake(id, data) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.centralSarabanNo =
          data.centralSarabanNo ||
          item.centralSarabanNo ||
          `2569/${Math.floor(1000 + Math.random() * 9000)}`;
        item.physicalDocDate =
          data.physicalDocDate || new Date().toISOString().split("T")[0];
        item.scannedDocFile =
          data.scannedDocFile || "เอกสารสแกนฉบับจริง_สารบรรณกลาง.pdf";
        item.boardAdminOfficer =
          data.boardAdminOfficer ||
          "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
        item.scannedStatus = "scanned";
        saveCases(cases);
      }
      return item;
    },

    forwardToGroupDirector(id, targetDirectorName, notes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        const isFromResolution =
          item.statusCode === "PENDING_DIRECTOR_RESOLUTION" ||
          item.status === "ผอ.กองกฎหมายพิจารณาผลมติ" ||
          item.status === "เสนอผลมติ ผอ.กองกฎหมาย";
        item.statusCode = "PENDING_GROUP_DIRECTOR";
        item.status = isFromResolution
          ? "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ"
          : "ผอ.กลุ่มงานความเห็นแย้งพิจารณา";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 4;
        item.targetDirectorName =
          targetDirectorName ||
          "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
        item.directorNotes = notes || "";
        item.directorForwardedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    forwardToLegalOfficer(id, officerName, notes, deadlineDate) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "DRAFTING_OPINION";
        item.status = "นิติกรจัดทำความเห็น";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.officer = officerName || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
        item.workflowStep = 5;
        item.groupDirectorNotes = notes || "";
        item.officerDeadline = deadlineDate || item.dueDate;
        item.groupDirectorForwardedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    submitOpinionToGroupDirector(
      id,
      opinionType,
      opinionDetails,
      draftFile,
      signature,
    ) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_REVIEW";
        item.status = "เสนอ ผอ.กลุ่มงานตรวจร่างความเห็น";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "group_director";
        item.workflowStep = 5;
        item.opinionType =
          opinionType || "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
        item.legalOpinion = opinionDetails || item.legalOpinion;
        item.legalOpinionDraft =
          opinionDetails || item.legalOpinionDraft || item.legalOpinion;
        item.draftOpinionFile = draftFile || "ร่างความเห็นแย้ง_อสส.docx";
        item.opinionDraftFile =
          draftFile || item.draftOpinionFile || "ร่างความเห็นแย้ง_อสส.docx";
        item.officerSubmittedDate = formatDisplayDate(new Date());
        item.officerOpinionSignature = signature || null;
        saveCases(cases);
      }
      return item;
    },

    submitGroupDirectorApproval(
      id,
      reviewDecision,
      notes,
      signature,
      reviewerName,
    ) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        if (reviewDecision === "APPROVE" || reviewDecision === true) {
          item.statusCode = "PENDING_DIRECTOR_APPROVAL";
          item.status = "เสนอ ผอ.กองกฎหมายพิจารณาความเห็น";
          item.statusBadge = "bg-primary text-white";
          item.assignedRole = "dir_legal";
          item.workflowStep = 7;
          item.groupDirectorEndorsement =
            "เห็นชอบตามคำร่างที่เสนอ และเสนอ ผอ.กองกฎหมาย";
          item.groupDirectorNotes = notes || "";
          item.groupDirectorApprovedDate = formatDisplayDate(new Date());
        } else {
          item.statusCode = "DRAFTING_OPINION";
          item.status = "นิติกรกำลังจัดทำความเห็น (ส่งกลับแก้ไข)";
          item.statusBadge = "bg-warning text-dark";
          item.assignedRole = "legal_officer";
          item.workflowStep = 5;
          item.groupDirectorReturnNotes =
            notes || "ขอให้ตรวจสอบข้อเท็จจริงเพิ่มเติม";
          item.groupDirectorReturnedDate = formatDisplayDate(new Date());
          /* ล้างร่องรอยการเห็นชอบครั้งก่อน มิฉะนั้นสำนวนจะค้าง: หน้าอนุมัติจะถือว่า
             "อนุมัติไปแล้ว" จากวันที่ที่ยังค้างอยู่ จึงซ่อนปุ่มอนุมัติ ขณะที่การจ่ายงาน
             ถูกส่งกลับไปที่นิติกรแล้ว ผู้อนุมัติขั้นถัดไปจึงไม่เห็นสำนวนเช่นกัน */
          item.groupDirectorApprovedDate = null;
          item.groupDirectorEndorsement = null;
        }
        item.groupDirectorApprovalSignature = signature || null;
        /* เก็บชื่อผู้กลั่นกรองไว้คู่กับลายมือชื่อ หน้าถัดไปจะได้แสดงว่าใครเป็นผู้ลงนาม
           ไม่ใช่แสดงแต่ภาพลายเซ็นลอย ๆ โดยไม่รู้ว่าเป็นของ ผอ.กลุ่มงานท่านใด */
        if (reviewerName) item.groupDirectorName = reviewerName;
        saveCases(cases);
      }
      return item;
    },

    submitDirectorApproval(id, decision, notes, forwardTarget, signature) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        if (decision === "APPROVE" || decision === true) {
          item.statusCode = "PENDING_DISPATCH";
          item.status = "ธุรการออกเลขส่งและส่งต่อผู้บริหาร";
          item.statusBadge = "bg-primary text-white";
          item.assignedRole = "admin_legal";
          item.workflowStep = 8;
          item.legalDirectorEndorsement =
            "เห็นชอบตามความเห็นที่เสนอ และมอบหมายธุรการส่งเสนอผู้บริหาร";
          item.legalDirectorApprovalNotes =
            notes || "ได้ตรวจพิจารณาแล้ว เห็นชอบตามร่างความเห็นแย้ง";
          item.legalDirectorForwardTarget =
            forwardTarget || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
          item.legalDirectorApprovedDate = formatDisplayDate(new Date());
          item.directorFinalOpinion = notes || item.legalDirectorApprovalNotes;
          item.directorApprovedDate = item.legalDirectorApprovedDate;
          item.forwardTarget = forwardTarget || "deputy_sg";
        } else {
          item.statusCode = "DRAFTING_OPINION";
          item.status = "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)";
          item.statusBadge = "bg-warning text-dark";
          item.assignedRole = "legal_officer";
          item.workflowStep = 5;
          item.directorReturnNotes = notes || "แก้ไขข้อกฎหมายเพิ่มเติม";
          item.directorReturnedDate = formatDisplayDate(new Date());
          /* ล้างร่องรอยการเห็นชอบครั้งก่อน มิฉะนั้นสำนวนจะค้าง: หน้าอนุมัติจะถือว่า
             "อนุมัติไปแล้ว" จากวันที่ที่ยังค้างอยู่ จึงซ่อนปุ่มอนุมัติ ขณะที่การจ่ายงาน
             ถูกส่งกลับไปที่นิติกรแล้ว ผู้อนุมัติขั้นถัดไปจึงไม่เห็นสำนวนเช่นกัน */
          item.legalDirectorApprovedDate = null;
          item.directorApprovedDate = null;
          item.legalDirectorEndorsement = null;
          item.groupDirectorApprovedDate = null;
          item.groupDirectorEndorsement = null;
        }
        item.legalDirectorApprovalSignature = signature || null;
        saveCases(cases);
      }
      return item;
    },

    submitLegalAdminDispatch(id, dispatchNo, target, notes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DEPUTY_SG";
        item.status = "เสนอผู้บริหารลงนามหนังสือความเห็น";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "deputy_sg";
        item.workflowStep = 9;
        item.adminDispatchNo =
          dispatchNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
        item.adminDispatchDate = formatDisplayDate(new Date());
        item.adminDispatchOfficer =
          "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
        item.adminDispatchTarget =
          target || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
        item.adminDispatchNotes = notes || "";
        item.adminDispatchedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    submitLegalAdminResolutionIntake(id, notes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DIRECTOR_RESOLUTION";
        item.status = "เสนอผลมติ ผอ.กองกฎหมาย";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "dir_legal";
        item.workflowStep = 10;
        item.adminResolutionIntakeNotes = notes || "";
        item.adminResolutionIntakeDate = formatDisplayDate(new Date());
        item.finalDispatchNotes = notes || "";
        item.adminResolutionNotes = notes || "";
        item.adminForwardedToDirectorDate = formatDisplayDate(new Date());
        item.finalDispatchedAt = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    submitDirectorResolutionOrder(id, target, notes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_RESOLUTION";
        item.status = "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 11;
        item.directorResolutionTarget =
          target || "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
        item.directorResolutionOrderNotes = notes || "";
        item.directorResolutionOrder =
          "มอบ ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการตามมติ";
        item.directorResolutionOrderedDate = formatDisplayDate(new Date());
        item.directorResolutionOrderDate = item.directorResolutionOrderedDate;
        saveCases(cases);
      }
      return item;
    },

    submitGroupDirectorResolutionOrder(id, target, notes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_OFFICER_FINAL_DOC";
        item.status = "นิติกรจัดทำหนังสือความเห็นตามมติ";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.workflowStep = 12;
        item.groupDirectorResolutionTarget =
          target || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
        item.groupDirectorResolutionOfficer =
          item.groupDirectorResolutionTarget;
        item.groupDirectorResolutionOrderNotes = notes || "";
        item.groupDirectorResolutionOrder =
          "มอบหมายนิติกรจัดทำหนังสือแจ้งความเห็นตามผลมติ";
        item.groupDirectorResolutionOrderedDate = formatDisplayDate(new Date());
        item.groupDirectorResolutionOrderDate =
          item.groupDirectorResolutionOrderedDate;
        saveCases(cases);
      }
      return item;
    },

    forwardToLegalDirectorAfterReview(id, reviewNotes, isApproved = true) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        if (isApproved) {
          item.statusCode = "PENDING_DIRECTOR_APPROVAL";
          item.status = "เสนอ ผอ.กองกฎหมายพิจารณาความเห็น";
          item.statusBadge = "bg-primary text-white";
          item.assignedRole = "dir_legal";
          item.workflowStep = 5;
          item.groupDirectorEndorsement = "เห็นชอบร่างความเห็น";
          item.groupDirectorReviewNotes = reviewNotes || "";
          item.groupDirectorApprovedDate = formatDisplayDate(new Date());
        } else {
          item.statusCode = "DRAFTING_OPINION";
          item.status = "นิติกรกำลังจัดทำความเห็น (ส่งกลับแก้ไข)";
          item.statusBadge = "bg-warning text-dark";
          item.assignedRole = "legal_officer";
          item.workflowStep = 5;
          item.groupDirectorReturnNotes =
            reviewNotes || "ขอให้ตรวจสอบข้อเท็จจริงเพิ่มเติม";
          item.groupDirectorReturnedDate = formatDisplayDate(new Date());
          /* ล้างร่องรอยการเห็นชอบครั้งก่อน มิฉะนั้นสำนวนจะค้าง: หน้าอนุมัติจะถือว่า
             "อนุมัติไปแล้ว" จากวันที่ที่ยังค้างอยู่ จึงซ่อนปุ่มอนุมัติ ขณะที่การจ่ายงาน
             ถูกส่งกลับไปที่นิติกรแล้ว ผู้อนุมัติขั้นถัดไปจึงไม่เห็นสำนวนเช่นกัน */
          item.groupDirectorApprovedDate = null;
          item.groupDirectorEndorsement = null;
        }
        saveCases(cases);
      }
      return item;
    },

    approveByLegalDirector(id, directorNotes, forwardTarget) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DISPATCH";
        item.status = "ธุรการออกเลขส่งภายใน";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "admin_legal";
        item.workflowStep = 7;
        item.directorFinalOpinion =
          directorNotes || "เห็นชอบตามที่กลุ่มงานเสนอ";
        item.directorApprovedDate = formatDisplayDate(new Date());
        item.forwardTarget = forwardTarget || "deputy_sg";
        saveCases(cases);
      }
      return item;
    },

    returnByLegalDirector(id, returnNotes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "DRAFTING_OPINION";
        item.status = "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.workflowStep = 5;
        item.directorReturnNotes = returnNotes || "แก้ไขข้อกฎหมายเพิ่มเติม";
        item.directorReturnedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    dispatchByLegalAdmin(id, dispatchData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DEPUTY_SG";
        item.status = "รอ รองเลขาธิการ ป.ป.ท. ตรวจสอบ";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "deputy_sg";
        item.workflowStep = 7;
        if (dispatchData) {
          item.adminDispatchNo =
            dispatchData.dispatchNo ||
            `2569/${Math.floor(1000 + Math.random() * 9000)}`;
          item.adminDispatchDate =
            dispatchData.dispatchDate || new Date().toISOString().split("T")[0];
          item.adminDispatchOfficer =
            dispatchData.officer ||
            "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
          item.adminDispatchNotes = dispatchData.notes || "";
        }
        saveCases(cases);
      }
      return item;
    },

    finalDispatchByLegalAdmin(id, finalDispatchData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DIRECTOR_RESOLUTION";
        item.status = "เสนอผลมติ ผอ.กองกฎหมาย";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "dir_legal";
        item.workflowStep = 8;
        if (finalDispatchData) {
          item.finalDispatchNo =
            finalDispatchData.dispatchNo ||
            `อส 0025/${Math.floor(1000 + Math.random() * 9000)}`;
          item.finalDispatchDate =
            finalDispatchData.dispatchDate ||
            new Date().toISOString().split("T")[0];
          item.finalDispatchOfficer =
            finalDispatchData.officer ||
            "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
          item.finalDispatchNotes = finalDispatchData.notes || "";
          item.adminResolutionNotes = finalDispatchData.notes || "";
        }
        item.adminForwardedToDirectorDate = formatDisplayDate(new Date());
        item.finalDispatchedAt = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    orderResolutionByLegalDirector(id, orderData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_RESOLUTION";
        item.status = "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 8;
        if (orderData) {
          item.directorResolutionOrder =
            orderData.orderText ||
            "มอบ ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการตามมติ";
          item.directorResolutionTarget =
            orderData.targetGroup || "กลุ่มงานความเห็นแย้ง";
          item.directorResolutionNotes = orderData.notes || "";
        }
        item.directorResolutionOrderedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    orderResolutionByGroupDirector(id, orderData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_OFFICER_FINAL_DOC";
        item.status = "นิติกรจัดทำหนังสือความเห็นตามมติ";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.workflowStep = 10;
        if (orderData) {
          item.groupDirectorResolutionOrder =
            orderData.action ||
            orderData.orderText ||
            "มอบหมายนิติกรจัดทำหนังสือแจ้งความเห็นตามผลมติ";
          item.groupDirectorResolutionOfficer =
            orderData.target ||
            orderData.officerName ||
            "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
          item.groupDirectorResolutionNotes = orderData.notes || "";
        }
        item.groupDirectorResolutionOrderedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S11: นิติกรจัดทำหนังสือความเห็น (เห็นชอบ/เห็นแย้ง) เสนอ ผอ.กลุ่มงาน
    submitOfficerFinalDoc(id, docData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_FINAL_REVIEW";
        item.status = "ผอ.กลุ่มงานตรวจหนังสือความเห็น";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 11;
        if (docData) {
          item.finalOpinionType =
            docData.opinionType ||
            "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
          item.finalDocNo = docData.docNo || "ปปท. 0014/พิเศษ/2569";
          item.finalDocSubject = docData.subject || item.title;
          item.officialDocHeading =
            docData.officialDocHeading || item.officialDocHeading || "";
          item.finalDocSummary = docData.summary || "";
          item.finalDocFile =
            docData.file || "ร่างหนังสือความเห็นแย้ง_เสนออัยการสูงสุด.pdf";
          item.finalDocNotes = docData.notes || "";
        }
        item.finalDocSubmittedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S12: ผอ.กลุ่มงานความเห็นแย้ง ตรวจหนังสือความเห็น เสนอ ผอ.กองกฎหมาย
    submitGroupDirectorFinalReview(id, reviewData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DIRECTOR_FINAL_REVIEW";
        item.status = "ผอ.กองตรวจหนังสือความเห็น";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "dir_legal";
        item.workflowStep = 12;
        if (reviewData) {
          item.groupDirectorFinalReviewAction =
            reviewData.action || "เห็นชอบร่างหนังสือ";
          item.groupDirectorFinalReviewNotes = reviewData.notes || "";
          item.groupDirectorFinalReviewSignature = reviewData.signature || null;
        }
        item.groupDirectorFinalReviewedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S13: ผอ.กองกฎหมาย ตรวจสอบหนังสือ มอบหมาย ธุรการกองกฎหมายออกเลขส่งรอบ 2
    submitLegalDirectorFinalReview(id, reviewData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_FINAL_DISPATCH_ROUND2";
        item.status = "ธุรการออกเลขส่งเสนอผู้บริหาร";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "admin_legal";
        item.workflowStep = 13;
        if (reviewData) {
          item.legalDirectorFinalReviewAction =
            reviewData.action || "เห็นชอบและมอบหมายธุรการออกเลขส่ง";
          item.legalDirectorFinalReviewNotes = reviewData.notes || "";
          item.legalDirectorFinalReviewSignature = reviewData.signature || null;
        }
        item.legalDirectorFinalReviewedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S14: ธุรการกองกฎหมาย ออกเลขหนังสือส่งภายใน เสนอผู้บริหารลงนาม
    submitLegalAdminFinalDispatch(id, dispatchData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "SUBMITTED_TO_EXEC_ROUND2";
        item.status = "เสนอผู้บริหารลงนามหนังสือความเห็น";
        item.statusBadge = "bg-success text-white";
        item.assignedRole = "deputy_sg";
        item.workflowStep = 14;
        if (dispatchData) {
          item.finalDispatchRound2No = dispatchData.dispatchNo || "0812/2569";
          item.finalDispatchRound2Date =
            dispatchData.dispatchDate || new Date().toISOString().split("T")[0];
          item.finalDispatchRound2Notes = dispatchData.notes || "";
        }
        item.finalDispatchRound2SubmittedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S15: ธุรการกองกฎหมาย ตรวจสอบเลขหนังสือส่งภายนอก & ลายมือชื่อประธาน และส่งต่อนิติกร

    signExecutiveDocRound1(id, signedNotes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "RETURNED_FROM_EXEC";
        item.status = "ธุรการรับผลมติ";
        item.statusBadge = "bg-success text-white";
        item.assignedRole = "admin_legal";
        item.workflowStep = 10;
        item.signedBy =
          "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
        item.signedDate = formatDisplayDate(new Date());
        item.signedExecutiveOrder = "เห็นชอบให้ทำความเห็นแย้ง";
        item.signedDocFile = "หนังสือผลมติ_2569_006.pdf";
        item.boardResolution =
          item.boardResolution ||
          "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
        item.boardResolutionDetail =
          item.boardResolutionDetail ||
          "ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
        item.boardMeetingNo = item.boardMeetingNo || "14/2569";
        item.boardMeetingDate =
          item.boardMeetingDate || formatDisplayDate(new Date());
        item.executiveSignNotesRound1 =
          signedNotes ||
          "ลงนามเรียบร้อยแล้ว ส่งคืนกองกฎหมายเพื่อดำเนินการตามมติ";
        saveCases(cases);
      }
      return item;
    },

    signExecutiveDocRound2(id, signedNotes) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_ADMIN_SIGNED_RECEIVE";
        item.status = "ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "admin_legal";
        item.workflowStep = 17;
        item.signedPresidentName =
          "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
        item.signedExecutiveDate = formatDisplayDate(new Date());
        item.signedDocFile =
          "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf";
        item.executiveSignNotesRound2 =
          signedNotes ||
          "ลงนามเรียบร้อยแล้ว ส่งคืนกองกฎหมายเพื่อออกเลขส่งภายนอกและดำเนินการต่อไป";
        saveCases(cases);
      }
      return item;
    },

    submitLegalAdminSignedDocReceive(id, verifyData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_OFFICER_EXTERNAL_DISPATCH";
        item.status = "นิติกรรับเรื่องหนังสือลงนามแล้ว";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "legal_officer";
        item.workflowStep = 15;
        if (verifyData) {
          item.externalDispatchNo =
            verifyData.externalDispatchNo || "ที่ ปปท 0014/1245";
          item.externalDispatchDate =
            verifyData.externalDispatchDate ||
            new Date().toISOString().split("T")[0];
          item.signedPresidentName =
            verifyData.signedPresidentName ||
            "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
          item.signedDocFile =
            verifyData.signedDocFile ||
            "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf";
          item.adminVerificationNotes = verifyData.notes || "";
        }
        item.adminVerifiedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    /* ความคืบหน้าการบันทึกข้อมูลจัดส่ง ใช้ทั้งที่หน้า 18 และในคิวงานหน้า 01
       opinionOverride เป็นพารามิเตอร์เสริม ไม่ใส่ก็ได้ (undefined) เพื่อให้ผู้เรียกเดิมทำงาน
       เหมือนเดิมทุกจุด — ใส่เมื่อต้องให้ตัวเลือกจำลองความเห็น (หน้า 18) กำหนดจำนวนหน่วยงานที่ต้องส่ง */
    getDispatchProgress(caseItem, opinionOverride) {
      const required = this.getRequiredRecipients(caseItem, opinionOverride);
      const saved = (caseItem.dispatchRecipients || []).filter(
        (r) => r.savedAt && required.some((q) => q.key === r.key),
      ).length;
      return {
        saved,
        total: required.length,
        complete: saved >= required.length,
      };
    },

    /* บันทึกข้อมูลจัดส่งทีละหน่วยงาน นิติกรอาจส่ง อสส. วันนี้ และส่งอัยการวันถัดไป
       สำนวนจะยังอยู่ที่หน้า 18 จนกว่าจะบันทึกครบทุกหน่วยงานที่ต้องแจ้ง
       opinionOverride เป็นพารามิเตอร์เสริมเช่นเดียวกับ getDispatchProgress ด้านบน */
    saveDispatchRecipient(id, recipientKey, record, opinionOverride) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (!item) return null;

      if (!Array.isArray(item.dispatchRecipients)) item.dispatchRecipients = [];
      const entry = Object.assign({}, record, {
        key: recipientKey,
        savedAt: formatDisplayDate(new Date()),
      });
      const at = item.dispatchRecipients.findIndex(
        (r) => r.key === recipientKey,
      );
      if (at >= 0) item.dispatchRecipients[at] = entry;
      else item.dispatchRecipients.push(entry);

      /* ค่าที่ Flow 4 ใช้ตัดสินเส้นทาง ต้องคงรูปเดิมทุกประการ */
      const agreed = String(item.finalOpinionType || "").includes("เห็นชอบ");
      item.dispatchScenario = agreed ? "case_agreed" : "case_disagreed";
      item.dispatchRecipientType = agreed
        ? "prosecutor_origin"
        : "attorney_general";

      /* ฉายระเบียนของ อสส. (หรือหน่วยงานเดียวกรณีเห็นชอบ) ลงฟิลด์เดิม
         หน้า 19 บรรทัด 578-580 อ่านฟิลด์ชุดนี้ จึงต้องเขียนต่อไปแม้โครงสร้างจะเปลี่ยน */
      const primary =
        item.dispatchRecipients.find((r) => r.key === "oag") ||
        item.dispatchRecipients[0];
      if (primary) {
        item.dispatchMethod = primary.method || "postal_ems";
        item.emsTrackingNo = primary.trackingNo || "";
        item.dispatchPostOffice = primary.postOffice || "";
        item.dispatchDate = primary.sentDate || item.dispatchDate || "";
        item.dispatchTime = primary.sentTime || "";
        item.dispatchLocation = primary.location || "";
        item.handDeliveryRecipient = primary.receiverName || "";
        item.oagReceiveDocNo = primary.receiveDocNo || "";
        item.dispatchRecipientName = primary.name || "";
      }

      const progress = this.getDispatchProgress(item, opinionOverride);
      if (progress.complete) {
        item.statusCode = "DISPATCHED_TO_PROSECUTOR";
        /* ข้อความสรุปต้องดูจากทุกหน่วยงาน ไม่ใช่แค่หน่วยงานหลักที่ฉายลงฟิลด์แบน
           เพราะแต่ละหน่วยงานเลือกวิธีส่งได้อิสระ ส่ง EMS หน่วยหนึ่งและนำส่งเองอีกหน่วยหนึ่งได้
           การอ่านจาก dispatchMethod เดี่ยวๆ จะรายงานว่าเป็น EMS ทั้งหมดซึ่งไม่จริง */
        const savedMethods = (item.dispatchRecipients || [])
          .filter((r) => r.savedAt)
          .map((r) => r.method);
        const allEms =
          savedMethods.length > 0 &&
          savedMethods.every((m) => m === "postal_ems");
        item.status =
          allEms && item.emsTrackingNo
            ? `จัดส่งครบทุกหน่วยงานแล้ว (EMS ${item.emsTrackingNo})`
            : `จัดส่งครบทุกหน่วยงานแล้ว (${progress.total} หน่วยงาน)`;
        item.statusBadge = "bg-success text-white";
        item.assignedRole = "legal_officer";
        item.workflowStep = 16;
        item.officerDispatchedDate = formatDisplayDate(new Date());
      } else {
        item.statusCode = "PENDING_OFFICER_EXTERNAL_DISPATCH";
        item.status = `นิติกรจัดส่งหนังสือ (บันทึกแล้ว ${progress.saved}/${progress.total})`;
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
      }

      saveCases(cases);
      return item;
    },

    // S19: ธุรการกองกฎหมาย รับผลคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.) และส่งต่อ ผอ.กองกฎหมาย
    submitLegalAdminOAGVerdictIntake(id, verdictData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DIRECTOR_OAG_VERDICT_REVIEW";
        item.status = "เสนอ ผอ.กอง ตรวจสอบคำวินิจฉัย อสส.";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "dir_legal";
        item.workflowStep = 20;
        if (verdictData) {
          item.oagVerdictNo = verdictData.oagVerdictNo || "อส 0001/6789";
          item.oagVerdictDate =
            verdictData.oagVerdictDate ||
            new Date().toISOString().split("T")[0];
          item.oagVerdictReceiveDate =
            verdictData.oagVerdictReceiveDate ||
            new Date().toISOString().split("T")[0];
          /* กรณีคำวินิจฉัยชี้ขาด 9 ตัวเลือกของหน้า 19 เดิมถูกส่งมาใน payload
             แต่ไม่เคยถูกบันทึก ทำให้ตัวเลือกที่ธุรการเลือกหายไปทั้งหมด
             ตั้งแต่ 07/09/2569 รายการนี้เป็นตัวเลือกเดียวของหน้าและเป็นที่มาของ
             oagVerdictDecision จึงต้องเก็บไว้ */
          item.oagVerdictCaseTypeNo = verdictData.oagVerdictCaseTypeNo || "";
          item.oagVerdictCaseTypeName =
            verdictData.oagVerdictCaseTypeName || "";
          item.oagVerdictDecision =
            verdictData.oagVerdictDecision || "PROSECUTE"; // 'PROSECUTE' | 'NON_PROSECUTE'
          item.oagVerdictDecisionText =
            verdictData.oagVerdictDecisionText ||
            (item.oagVerdictDecision === "PROSECUTE"
              ? "อสส. ชี้ขาดให้ฟ้องคดีตามความเห็นแย้งของ ป.ป.ท."
              : "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของอัยการ");
          item.oagVerdictSummary = verdictData.oagVerdictSummary || "";
          item.oagVerdictFile =
            verdictData.oagVerdictFile ||
            "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6789.pdf";
          item.adminVerdictNotes = verdictData.adminVerdictNotes || "";
        }
        item.adminOagVerdictReceivedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S20: ผอ.กองกฎหมาย ตรวจสอบคำวินิจฉัยชี้ขาด อสส. และมอบหมาย ผอ.กลุ่มงาน
    submitLegalDirectorOAGVerdictReview(id, reviewData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_OAG_VERDICT_REVIEW";
        item.status = "เสนอ ผอ.กลุ่มงาน มอบหมายนิติกรบันทึกผล";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 21;
        if (reviewData) {
          item.directorOagVerdictNotes =
            reviewData.directorOagVerdictNotes || "";
          item.directorOagVerdictReviewDate =
            reviewData.directorOagVerdictReviewDate ||
            new Date().toISOString().split("T")[0];
          item.directorAssignedGroup =
            reviewData.directorAssignedGroup || "กลุ่มงานความเห็นแย้ง";
          item.directorAssignedLeader =
            reviewData.directorAssignedLeader ||
            "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
        }
        item.directorOagVerdictReviewedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    // S21: ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบคำวินิจฉัยชี้ขาด อสส. และมอบหมายนิติกรเจ้าของสำนวน
    submitGroupDirectorOAGVerdictReview(id, groupData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "PENDING_OFFICER_FINAL_NOTIFICATION";
        item.status = "รอนิติกรบันทึกผล และ แจ้งกองบริหารคดี";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "legal_officer";
        item.workflowStep = 22;
        if (groupData) {
          item.groupDirectorOagVerdictNotes =
            groupData.groupDirectorOagVerdictNotes || "";
          item.groupDirectorOagVerdictReviewDate =
            groupData.groupDirectorOagVerdictReviewDate ||
            new Date().toISOString().split("T")[0];
          item.assignedOfficer =
            groupData.assignedOfficer ||
            "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
        }
        item.groupDirectorOagVerdictReviewedDate = formatDisplayDate(
          new Date(),
        );
        saveCases(cases);
      }
      return item;
    },

    // S22: นิติกร บันทึกผลคำวินิจฉัยชี้ขาด อสส. และทำหนังสือแจ้งกองบริหารคดี (ปิดกระบวนงาน 10.1)
    submitOfficerFinalCaseClosedNotification(id, notifyData) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (item) {
        item.statusCode = "COMPLETED_OAG_RESOLVED";
        item.status = "เสร็จสิ้นกระบวนงาน (คำวินิจฉัย อสส. ชี้ขาด)";
        item.statusBadge = "bg-success text-white";
        item.assignedRole = null;
        item.workflowStep = 23;
        item.isCompleted = true;
        if (notifyData) {
          item.officerCaseClosedNotes = notifyData.officerCaseClosedNotes || "";
          item.caseClosedNotifyDocNo =
            notifyData.caseClosedNotifyDocNo || "ที่ ปปท 0014/น.1420";
          item.caseClosedNotifyDate =
            notifyData.caseClosedNotifyDate ||
            new Date().toISOString().split("T")[0];
          item.caseClosedNotifyTarget =
            notifyData.caseClosedNotifyTarget || "กองบริหารคดี (กบค.)";
          item.caseClosedNotifyFile =
            notifyData.caseClosedNotifyFile ||
            "หนังสือแจ้งผลคำวินิจฉัยชี้ขาด_ถึงกองบริหารคดี.pdf";
          item.finalCaseResolutionSummary =
            notifyData.finalCaseResolutionSummary ||
            (item.oagVerdictDecision === "PROSECUTE"
              ? "อสส. ชี้ขาดให้ฟ้องคดีตามความเห็นแย้งของ ป.ป.ท."
              : "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของอัยการ");
          item.officerCaseClosedSignature = notifyData.signature || null;
        }
        item.caseClosedDate = formatDisplayDate(new Date());
        saveCases(cases);
      }
      return item;
    },

    resetData() {
      saveCases(INITIAL_CASES);
      return INITIAL_CASES;
    },
  };

  global.Activity10 = Activity10;
})(
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : this,
);
