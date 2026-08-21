/**
 * E-CMIS Activity 10: Production-Grade Legal System Engine & Data Store
 * Project: กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
 */

(function(global) {
  'use strict';

  // Data Version Key for LocalStorage Sync
  const DATA_VERSION = 'v28_director_resolution_review_status_name';

  function getDateWithOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // Initial Cases in Legal Inbox (ตัวอย่างสำนวนที่ครอบคลุมทุกบทบาทในการทำงาน)
  const INITIAL_CASES = [
    {
      id: "คดี-2569/006",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการก่อสร้างเขื่อนป้องกันตลิ่ง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
      accuser: "สำนักงาน ป.ป.ท.",
      accused: "นายมนตรี ว่องไว (อดีตวิศวกรโยธาชำนาญการ)",
      officer: "นางสาวกานดา รักษาการ (เจ้าหน้าที่ธุรการกองกฎหมาย)",
      assignedRole: "admin_legal",
      status: "ธุรการรับผลมติ",
      statusCode: "RETURNED_FROM_EXEC",
      statusBadge: "bg-success text-white",
      lawReceiveNo: "2569/0019",
      paccCaseNo: "ปปท. 0038/2568",
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
      legalOpinion: "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
      signedBy: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
      signedDate: "21 ส.ค. 2569",
      signedExecutiveOrder: "เห็นชอบ",
      signedDocFile: "หนังสือผลมติ_2569_006.pdf",
      adminDispatchNo: "2569/0410",
      adminDispatchDate: "20 ส.ค. 2569",
      centralSarabanNo: "2569/4502"
    },
    {
      id: "คดี-2569/004",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตเงินอุดหนุนโครงการส่งเสริมอาชีพชุมชน",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สนง. ป.ป.ท. เขต 4",
      accuser: "สำนักงาน ป.ป.ท. เขต 4",
      accused: "นายอำนาจ พิทักษ์ธรรม (อดีตหัวหน้าฝ่ายพัฒนาชุมชน)",
      officer: "นายนภัส สุทธิรักษ์ (ผู้อำนวยการกองกฎหมาย)",
      assignedRole: "dir_legal",
      status: "ผอ.กองกฎหมายพิจารณา",
      statusCode: "PENDING_DIRECTOR",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "2569/0017",
      paccCaseNo: "ปปท. 0049/2568",
      blackNo: "อ. 128/2569",
      redNo: "อ. 360/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ย. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 13,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-2),
      dueDate: getDateWithOffset(13),
      workflowStep: 2,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0033/2569",
      centralSarabanNo: "2569/4480"
    },
    {
      id: "คดี-2569/003",
      title: "พิจารณาความเห็นแย้งคดีจัดซื้อครุภัณฑ์วิทยาศาสตร์ราคาสูงเกินจริง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สนง. ป.ป.ท. เขต 1",
      accuser: "สำนักงาน ป.ป.ท. เขต 1",
      accused: "นายธีระ วัฒนกุล (อดีตเจ้าพนักงานวิทยาศาสตร์)",
      officer: "นายอานนท์ ชนประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)",
      assignedRole: "group_director",
      status: "ผอ.กลุ่มงานความเห็นแย้งพิจารณา",
      statusCode: "PENDING_GROUP_DIRECTOR",
      statusBadge: "bg-info text-dark",
      lawReceiveNo: "2569/0015",
      paccCaseNo: "ปปท. 0040/2568",
      blackNo: "อ. 115/2569",
      redNo: "อ. 330/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 5 ต.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 11,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-4),
      dueDate: getDateWithOffset(11),
      workflowStep: 3,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0021/2569",
      centralSarabanNo: "2569/4450"
    },
    {
      id: "คดี-2569/005",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
      accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)",
      officer: "นายนภัส สุทธิรักษ์ (ผู้อำนวยการกองกฎหมาย)",
      assignedRole: "dir_legal",
      status: "พิจารณาความเห็นของนิติกร",
      statusCode: "PENDING_DIRECTOR_APPROVAL",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "2569/0014",
      paccCaseNo: "ปปท. 0012/2568",
      blackNo: "อ. 104/2569",
      redNo: "อ. 308/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 15,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-8),
      dueDate: getDateWithOffset(15), // เหลือ 15 วัน
      workflowStep: 6,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0014/2569",
      legalOpinion: "ตรวจพิจารณาข้อเท็จจริงและพยานหลักฐานแล้ว เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้อง",
      legalOpinionDraft: "จากการตรวจพิจารณาสำนวนการไต่สวนข้อเท็จจริงของ ป.ป.ท. พบว่าพยานหลักฐานและเส้นทางการเงินมีความเชื่อมโยงชัดเจน ปรากฏพฤติการณ์แสวงหาประโยชน์โดยมิชอบ จึงเห็นควรทำความเห็นแย้งเสนอเลขาธิการ ป.ป.ท. เพื่อส่งอัยการสูงสุดชี้ขาด",
      opinionType: "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
      opinionDraftFile: "ร่างบันทึกความเห็นแย้ง_2569_005.docx",
      officerSubmittedDate: "19 ส.ค. 2569",
      groupDirector: "นายอานนท์ ชนประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)",
      groupDirectorEndorsement: "เห็นชอบร่างความเห็นแย้ง",
      groupDirectorReviewNotes: "ได้ตรวจพิจารณาร่างความเห็นแย้งและข้อเท็จจริงในสำนวนการไต่สวนแล้ว เห็นชอบตามร่างความเห็นแย้งของนิติกรเจ้าของสำนวน จึงกราบเรียนเสนอ ผอ.กองกฎหมาย เพื่อโปรดพิจารณาให้ความเห็นชอบและสั่งการต่อไป",
      groupDirectorApprovedDate: "20 ส.ค. 2569",
      centralSarabanNo: "2569/4410",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดี-2569/002",
      title: "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สนง. ป.ป.ท. เขต 3",
      accuser: "สำนักงาน ป.ป.ท. เขต 3",
      accused: "นายวิชัย การกุศล (เจ้าพนักงานจัดเก็บรายได้)",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer",
      status: "นิติกรจัดทำความเห็น",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "2569/0350",
      paccCaseNo: "ปปท. 0045/2568",
      blackNo: "อ. 118/2569",
      redNo: "อ. 340/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)",
      slaTotalDays: 15,
      slaDaysRemaining: 5,
      slaAlert: "sla-danger",
      dateReceived: getDateWithOffset(-10),
      dueDate: getDateWithOffset(5), // เหลือ 5 วัน (< 7 วัน => สีแดง)
      workflowStep: 4,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0018/2569",
      legalOpinion: "ตรวจพิจารณาข้อเท็จจริงและพยานหลักฐานแล้ว เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้อง",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดี-2569/001",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
      accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)",
      officer: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)",
      assignedRole: "deputy_sg",
      status: "รอ รองเลขาธิการ ป.ป.ท. ตรวจสอบ",
      statusCode: "PENDING_DEPUTY_SG",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "2569/0348",
      paccCaseNo: "ปปท. 0012/2568",
      blackNo: "อ. 104/2569",
      redNo: "อ. 308/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
      slaTotalDays: 15,
      slaDaysRemaining: 3,
      slaAlert: "sla-danger",
      dateReceived: getDateWithOffset(-12),
      dueDate: getDateWithOffset(3), // เหลือ 3 วัน (< 7 วัน => สีแดง)
      workflowStep: 7,
      docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
      docNo: "อส 0012/2568",
      legalOpinion: "ตรวจพิจารณาข้อเท็จจริงและพยานหลักฐานแล้ว เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้อง เสนอ รองเลขาธิการ ป.ป.ท. ตรวจสอบ",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดีปกครอง-2569/002",
      title: "คดีปกครองหมายเลขดำที่ อ.145/2569 ศาลปกครองสูงสุดออกหมายเรียกให้ทำคำให้การเพิ่มเติม",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. คดีศาลปกครอง",
      source: "ศาลปกครองสูงสุด (e-Court System)",
      accuser: "นายเฉลิมพล สุขสวัสดิ์ (ผู้ฟ้องคดี)",
      accused: "เลขาธิการ ป.ป.ท. และคณะกรรมการ ป.ป.ท.",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer",
      status: "นิติกรจัดทำความเห็น",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      lawReceiveNo: "2569/0355",
      paccCaseNo: "ปปท. 0090/2567",
      blackNo: "อ. 145/2569",
      redNo: "-",
      courtOrder: "หมายเรียกและสำเนาคำฟ้องศาลปกครอง",
      statuteLimitation: "30 วัน",
      slaTotalDays: 30,
      slaDaysRemaining: 2,
      slaAlert: "sla-danger",
      dateReceived: getDateWithOffset(-28),
      dueDate: getDateWithOffset(2), // เหลือ 2 วัน (< 7 วัน => สีแดง)
      workflowStep: 4,
      docType: "หมายเรียกศาลปกครอง",
      docNo: "ศป 0145/2569",
      legalOpinion: "อยู่ระหว่างยกร่างคำให้การเพิ่มเติมและรวบรวมพยานหลักฐาน",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คำร้อง-2569/014",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการไต่สวนข้อเท็จจริงคดีบริหารงานผิดพลาด",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      prosecutorCaseTypeNo: "1",
      prosecutorCaseTypeName: "1. คำร้องขอเปิดเผยข้อมูล",
      source: "ศูนย์รับเรื่องร้องเรียน ป.ป.ท. (ยื่น Walk-in)",
      accuser: "นายสมเกียรติ รักธรรม (ผู้ร้องเรียน)",
      accused: "คณะกรรมการไต่สวน ป.ป.ท.",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "group_director",
      status: "พิจารณาความเห็นของนิติกร",
      statusCode: "PENDING_GROUP_REVIEW",
      statusBadge: "bg-primary text-white",
      lawReceiveNo: "2569/0352",
      paccCaseNo: "ปปท. ขบ 0014/2569",
      blackNo: "-",
      redNo: "-",
      courtOrder: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      statuteLimitation: "60 วัน",
      slaTotalDays: 15,
      slaDaysRemaining: 10,
      slaAlert: "sla-normal",
      dateReceived: getDateWithOffset(-5),
      dueDate: getDateWithOffset(10), // เหลือ 10 วัน
      workflowStep: 5,
      docType: "หนังสือคำร้องขอข้อมูลข่าวสาร",
      docNo: "ขบ 0014/2569",
      legalOpinion: "เห็นควรเปิดเผยข้อมูลข่าวสารตาม พ.ร.บ. ข้อมูลข่าวสารของราชการ พ.ศ. 2540",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    }
  ];

  // Load Persisted Cases from LocalStorage
  function loadCases() {
    try {
      const ver = localStorage.getItem("ecmis_activity10_version");
      if (ver !== DATA_VERSION) {
        localStorage.setItem("ecmis_activity10_version", DATA_VERSION);
        saveCases(INITIAL_CASES);
        return INITIAL_CASES;
      }
      const stored = localStorage.getItem("ecmis_activity10_cases");
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(c => {
            if (c.status === "กำลังยกร่างความเห็นแย้ง" || c.status === "กำลังร่างความเห็นแย้ง") {
              c.status = "นิติกรกำลังจัดทำความเห็น";
            }
          });
          return parsed;
        }
      }
    } catch(e) {
      console.warn("Could not load localStorage, using initial seed data");
    }
    saveCases(INITIAL_CASES);
    return INITIAL_CASES;
  }

  function saveCases(cases) {
    try {
      localStorage.setItem("ecmis_activity10_cases", JSON.stringify(cases));
    } catch(e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  // ฐานข้อมูลสำนวนคดีเดิมของ ป.ป.ท. (สำหรับค้นหาและเลือกรับเรื่องเข้าระบบในหน้า 02-board-intake.html)
  const PACC_INTAKE_DATABASE = [
    {
      id: "คดี-2569/001",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
      accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)",
      paccCaseNo: "ปปท. 0012/2568",
      blackNo: "อ. 104/2569",
      redNo: "อ. 308/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)"
    },
    {
      id: "คดี-2569/002",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title: "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
      source: "สนง. ป.ป.ท. เขต 3",
      accuser: "สำนักงาน ป.ป.ท. เขต 3",
      accused: "นายวิชัย การกุศล (เจ้าพนักงานจัดเก็บรายได้)",
      paccCaseNo: "ปปท. 0045/2568",
      blackNo: "อ. 118/2569",
      redNo: "อ. 340/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)"
    },
    {
      id: "คดี-2569/003",
      category: "10.1",
      categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
      title: "ความเห็นแย้งคดีเจ้าหน้าที่เรียกรับผลประโยชน์ในการออกใบอนุญาตสีก่อสร้าง",
      source: "สนง. ป.ป.ท. เขต 1",
      accuser: "สำนักงาน ป.ป.ท. เขต 1",
      accused: "นายศิริโชค มีอำนาจ (หัวหน้าฝ่ายโยธา)",
      paccCaseNo: "ปปท. 0089/2568",
      blackNo: "อ. 132/2569",
      redNo: "อ. 412/2569",
      courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      statuteLimitation: "15 ปี (หมดอายุความ 25 ก.ค. 2584)"
    },
    {
      id: "คำร้อง-2569/014",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการไต่สวนข้อเท็จจริงคดีบริหารงานผิดพลาด",
      source: "ศูนย์รับเรื่องร้องเรียน ป.ป.ท. (ยื่น Walk-in)",
      accuser: "นายสมเกียรติ รักธรรม (ผู้ร้องเรียน)",
      accused: "คณะกรรมการไต่สวน ป.ป.ท.",
      paccCaseNo: "ปปท. ขบ 0014/2569",
      blackNo: "-",
      redNo: "-",
      courtOrder: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      statuteLimitation: "60 วัน"
    },
    {
      id: "คำร้อง-2569/015",
      category: "10.2.1",
      categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการตรวจสอบทรัพย์สินเจ้าหน้าที่ระดับสูง",
      source: "สำนักข่าวอิศรา (ยื่นคำร้องออนไลน์)",
      accuser: "สำนักข่าวอิศรา",
      accused: "สำนักงาน ป.ป.ท.",
      paccCaseNo: "ปปท. ขบ 0015/2569",
      blackNo: "-",
      redNo: "-",
      courtOrder: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      statuteLimitation: "60 วัน"
    },
    {
      id: "อุทธรณ์-2569/005",
      category: "10.2.2",
      categoryName: "การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร",
      title: "คำอุทธรณ์การไม่เปิดเผยข้อมูลข่าวสารเกี่ยวกับการสอบสวนวินัยข้าราชการระดับสูง",
      source: "ระบบรับเรื่องร้องเรียนออนไลน์ (Email)",
      accuser: "นายประเสริฐ ชูเกียรติ (ผู้อุทธรณ์)",
      accused: "สำนักงาน ป.ป.ท.",
      paccCaseNo: "ปปท. อท 0005/2569",
      blackNo: "-",
      redNo: "-",
      courtOrder: "หนังสือคำอุทธรณ์ของผู้ร้อง",
      statuteLimitation: "60 วัน"
    },
    {
      id: "คดีปกครอง-2569/002",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      title: "คดีปกครองหมายเลขดำที่ อ.145/2569 ศาลปกครองสูงสุดออกหมายเรียกให้ทำคำให้การเพิ่มเติม",
      source: "ศาลปกครองสูงสุด (e-Court System)",
      accuser: "นายเฉลิมพล สุขสวัสดิ์ (ผู้ฟ้องคดี)",
      accused: "เลขาธิการ ป.ป.ท. และคณะกรรมการ ป.ป.ท.",
      paccCaseNo: "ปปท. 0090/2567",
      blackNo: "อ. 145/2569",
      redNo: "-",
      courtOrder: "หมายเรียกและสำเนาคำฟ้องศาลปกครอง",
      statuteLimitation: "30 วัน"
    },
    {
      id: "คดีปกครอง-2569/003",
      category: "10.3",
      categoryName: "คดีศาลปกครอง",
      title: "คดีปกครองฟ้องเพิกถอนคำสั่งชี้มูลความผิดทางวินัยอย่างร้ายแรง กรณีทุจริตที่ดิน",
      source: "ศาลปกครองกลาง (e-Court)",
      accuser: "นายสุรศักดิ์ กล้าหาญ",
      accused: "คณะกรรมการ ป.ป.ท.",
      paccCaseNo: "ปปท. 0112/2567",
      blackNo: "188/2569",
      redNo: "-",
      courtOrder: "คำฟ้องศาลปกครองกลาง",
      statuteLimitation: "30 วัน"
    }
  ];

  // Activity 10 Engine API
  const Activity10 = {
    getCases: loadCases,
    getPaccIntakeDatabase() {
      return PACC_INTAKE_DATABASE;
    },
    
    getCaseById(id) {
      const cases = loadCases();
      if (!cases || cases.length === 0) return null;
      return cases.find(c => c.id === id) || cases[0];
    },

    getTorDetails(c) {
      if (!c) return { accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.", accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)", plaintiff: "พนักงานอัยการ / สำนักงาน ป.ป.ท.", defendant: "นายสมชาย ทุจริตมั่น", paccCaseNo: "ปปท. 0012/2568", blackNo: "อ. 104/2569", redNo: "อ. 308/2569", courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ", division: "กองกฎหมาย (กอท.)", statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)" };

      const seed = PACC_INTAKE_DATABASE.find(ic => ic.id === c.id);

      return {
        accuser: c.accuser || (seed ? seed.accuser : "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท."),
        accused: c.accused || (seed ? seed.accused : "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)"),
        plaintiff: c.plaintiff || "พนักงานอัยการ / สำนักงาน ป.ป.ท.",
        defendant: c.defendant || c.accused || (seed ? seed.accused : "นายสมชาย ทุจริตมั่น"),
        paccCaseNo: c.paccCaseNo || (seed && seed.paccCaseNo ? seed.paccCaseNo : "ปปท. 0012/2568"),
        blackNo: c.blackNo || (seed && seed.blackNo ? seed.blackNo : "อ. 104/2569"),
        redNo: c.redNo || (seed && seed.redNo ? seed.redNo : "อ. 308/2569"),
        courtOrder: c.courtOrder || (seed && seed.courtOrder ? seed.courtOrder : "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ"),
        division: c.division || "กองกฎหมาย (กอท.)",
        statuteLimitation: c.statuteLimitation || (seed && seed.statuteLimitation ? seed.statuteLimitation : "15 ปี (หมดอายุความ 28 ก.ค. 2584)")
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
      if (typeof c.slaDaysRemaining === 'number') {
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
      const count = cases.length + 1;
      const category = newCaseData.category || "10.1";
      const casePrefix = category === '10.1' ? 'คดี' : (category.startsWith('10.2') ? (category === '10.2.2' ? 'อุทธรณ์' : 'คำร้อง') : 'คดีปกครอง');
      const caseId = newCaseData.id ? newCaseData.id.replace(/-10\.\d(\.\d)?-/, '-') : `${casePrefix}-2569/${String(count).padStart(3, '0')}`;

      const status = newCaseData.status || "ผอ.กองกฎหมายพิจารณา";
      const statusCode = newCaseData.statusCode || "PENDING_DIRECTOR";
      const statusBadge = newCaseData.statusBadge || "bg-primary text-white";
      const assignedRole = newCaseData.assignedRole || "dir_legal";
      const officer = newCaseData.officer || "นายนภัส สุทธิรักษ์ (ผู้อำนวยการกองกฎหมาย)";

      // Check if existing case matches
      const existingItem = cases.find(c => c.id === caseId || (newCaseData.id && c.id === newCaseData.id) || (newCaseData.paccCaseNo && c.paccCaseNo && c.paccCaseNo === newCaseData.paccCaseNo));

      if (existingItem) {
        if (newCaseData.title) existingItem.title = newCaseData.title;
        existingItem.category = category;
        if (newCaseData.categoryName) existingItem.categoryName = newCaseData.categoryName;
        if (newCaseData.prosecutorCaseTypeNo) existingItem.prosecutorCaseTypeNo = newCaseData.prosecutorCaseTypeNo;
        if (newCaseData.prosecutorCaseTypeName) existingItem.prosecutorCaseTypeName = newCaseData.prosecutorCaseTypeName;
        if (newCaseData.source) existingItem.source = newCaseData.source;
        existingItem.officer = officer;
        existingItem.assignedRole = assignedRole;
        existingItem.status = status;
        existingItem.statusCode = statusCode;
        existingItem.statusBadge = statusBadge;
        if (newCaseData.lawReceiveNo) existingItem.lawReceiveNo = newCaseData.lawReceiveNo;
        if (newCaseData.paccCaseNo) existingItem.paccCaseNo = newCaseData.paccCaseNo;
        if (newCaseData.accuser) existingItem.accuser = newCaseData.accuser;
        if (newCaseData.accused) existingItem.accused = newCaseData.accused;
        if (newCaseData.docNo) existingItem.docNo = newCaseData.docNo;
        if (newCaseData.legalOpinion) existingItem.legalOpinion = newCaseData.legalOpinion;
        if (newCaseData.centralSarabanNo) existingItem.centralSarabanNo = newCaseData.centralSarabanNo;
        if (newCaseData.physicalDocDate) existingItem.physicalDocDate = newCaseData.physicalDocDate;
        existingItem.workflowStep = newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2);
        saveCases(cases);
        return existingItem;
      }

      const createdCase = {
        id: caseId,
        title: newCaseData.title || "สำนวนคดีกฎหมายใหม่",
        category: category,
        categoryName: newCaseData.categoryName || (category === '10.1' ? 'คดีอาญาทุจริตและคดีประพฤติมิชอบ' : category === '10.3' ? 'คดีศาลปกครอง' : (category === '10.2.2' ? 'การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร' : 'การขอเปิดเผยข้อมูลข่าวสาร')),
        prosecutorCaseTypeNo: newCaseData.prosecutorCaseTypeNo || "1",
        prosecutorCaseTypeName: newCaseData.prosecutorCaseTypeName || "1. อัยการมีความเห็นไม่ส่งฟ้อง",
        source: newCaseData.source || "ศูนย์รับเรื่องร้องเรียน",
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
        courtOrder: newCaseData.courtOrder || (category === '10.1' ? "คำสั่งไม่ฟ้องพนักงานอัยการ" : "เอกสารรับเรื่อง"),
        statuteLimitation: newCaseData.statuteLimitation || "15 ปี",
        slaTotalDays: newCaseData.slaTotalDays || 15,
        slaDaysRemaining: newCaseData.slaTotalDays || 15,
        slaAlert: "sla-normal",
        dateReceived: new Date().toISOString().split('T')[0],
        dueDate: newCaseData.dueDate || getDateWithOffset(15),
        workflowStep: newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2),
        docType: newCaseData.docType || "เอกสารแนบสำนวน",
        docNo: newCaseData.docNo || "นร 10/2569",
        legalOpinion: newCaseData.legalOpinion || "อยู่ระหว่างตรวจพิจารณาข้อเท็จจริงและพยานหลักฐาน",
        centralSarabanNo: newCaseData.centralSarabanNo || "",
        physicalDocDate: newCaseData.physicalDocDate || "",
        signatureStamped: false,
        signedBy: "",
        signedDate: ""
      };

      cases.unshift(createdCase);
      saveCases(cases);
      return createdCase;
    },

    updateCaseStatus(id, newStatusCode, newStatusText, newBadgeClass, nextRole) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = newStatusCode;
        item.status = newStatusText;
        item.statusBadge = newBadgeClass || item.statusBadge;
        if (nextRole) item.assignedRole = nextRole;
        saveCases(cases);
      }
      return item;
    },

    bulkUpdateStatus(ids, newStatusCode, newStatusText, newBadgeClass, nextRole) {
      const cases = loadCases();
      let updatedCount = 0;
      cases.forEach(c => {
        if (ids.includes(c.id)) {
          c.statusCode = newStatusCode;
          c.status = newStatusText;
          c.statusBadge = newBadgeClass || c.statusBadge;
          if (nextRole) c.assignedRole = nextRole;
          updatedCount++;
        }
      });
      saveCases(cases);
      return updatedCount;
    },

    bulkAssignOfficer(ids, officerName) {
      const cases = loadCases();
      let updatedCount = 0;
      cases.forEach(c => {
        if (ids.includes(c.id)) {
          c.officer = officerName;
          updatedCount++;
        }
      });
      saveCases(cases);
      return updatedCount;
    },

    saveLegalOpinion(id, opinionText) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.legalOpinion = opinionText;
        saveCases(cases);
      }
      return item;
    },

    stampSignature(id, signerName) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.signatureStamped = true;
        item.signedBy = signerName || "ผู้บังคับบัญชาอนุมัติ";
        item.signedDate = new Date().toLocaleString('th-TH');
        item.statusCode = "FINAL_DISPATCHED";
        item.status = "ลงนามชี้ขาดเรียบร้อย";
        item.statusBadge = "bg-success text-white";
        saveCases(cases);
      }
      return item;
    },

    receiveAndForwardToDirector(id, lawReceiveNo) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.lawReceiveNo = lawReceiveNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
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
      const item = cases.find(c => c.id === id);
      if (item) {
        item.centralSarabanNo = data.centralSarabanNo || item.centralSarabanNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
        item.physicalDocDate = data.physicalDocDate || new Date().toISOString().split('T')[0];
        item.scannedDocFile = data.scannedDocFile || "เอกสารสแกนฉบับจริง_สารบรรณกลาง.pdf";
        item.boardAdminOfficer = data.boardAdminOfficer || "นางสาวกานดา รักษาการ (เจ้าหน้าที่ธุรการกองกฎหมาย)";
        item.scannedStatus = "scanned";
        saveCases(cases);
      }
      return item;
    },

    forwardToGroupDirector(id, targetDirectorName, notes) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_DIRECTOR";
        item.status = "ผอ.กลุ่มงานความเห็นแย้งพิจารณา";
        item.statusBadge = "bg-info text-dark";
        item.assignedRole = "group_director";
        item.workflowStep = 4;
        if (targetDirectorName) item.groupDirector = targetDirectorName;
        if (notes) item.directorNotes = notes;
        item.directorForwardedDate = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    forwardToLegalOfficer(id, officerName, notes, deadlineDate) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "DRAFTING_OPINION";
        item.status = "นิติกรจัดทำความเห็น";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.officer = officerName || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
        item.workflowStep = 5;
        if (notes) item.groupDirectorNotes = notes;
        if (deadlineDate) item.officerDeadline = deadlineDate;
        item.groupDirectorForwardedDate = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    submitOpinionToGroupDirector(id, opinionType, opinionDetails, draftFile) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "PENDING_GROUP_REVIEW";
        item.status = "พิจารณาความเห็นของนิติกร";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "group_director";
        item.workflowStep = 5;
        item.opinionType = opinionType || "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
        if (opinionDetails) item.legalOpinionDraft = opinionDetails;
        if (draftFile) item.opinionDraftFile = draftFile;
        item.officerSubmittedDate = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    forwardToLegalDirectorAfterReview(id, reviewNotes, isApproved = true) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        if (isApproved) {
          item.statusCode = "PENDING_DIRECTOR_APPROVAL";
          item.status = "พิจารณาความเห็นของนิติกร";
          item.statusBadge = "bg-primary text-white";
          item.assignedRole = "dir_legal";
          item.workflowStep = 5;
          item.groupDirectorEndorsement = "เห็นชอบร่างความเห็น";
          if (reviewNotes) item.groupDirectorReviewNotes = reviewNotes;
          item.groupDirectorApprovedDate = new Date().toLocaleString('th-TH');
        } else {
          item.statusCode = "DRAFTING_OPINION";
          item.status = "นิติกรกำลังจัดทำความเห็น (ส่งกลับแก้ไข)";
          item.statusBadge = "bg-warning text-dark";
          item.assignedRole = "legal_officer";
          item.workflowStep = 5;
          if (reviewNotes) item.groupDirectorReviewNotes = reviewNotes;
          item.groupDirectorReturnedDate = new Date().toLocaleString('th-TH');
        }
        saveCases(cases);
      }
      return item;
    },

    approveByLegalDirector(id, directorNotes, forwardTarget) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DISPATCH";
        item.status = "ธุรการออกเลขส่งภายใน";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "admin_legal";
        item.workflowStep = 7;
        item.legalDirectorApprovalNotes = directorNotes || "ได้ตรวจพิจารณาแล้ว เห็นชอบตามร่างความเห็นแย้งของนิติกรและ ผอ.กลุ่มงานความเห็นแย้ง มอบหมายให้ธุรการกองกฎหมายดำเนินการออกเลขหนังสือนำส่งและจัดทำบันทึกเสนอผู้บริหารตามระเบียบต่อไป";
        item.legalDirectorApprovedDate = new Date().toLocaleString('th-TH');
        item.legalDirectorForwardTarget = forwardTarget || "เลขาธิการ ป.ป.ท.";
        item.legalDirectorEndorsement = "เห็นชอบร่างความเห็นแย้ง";
        item.legalDirectorSigned = true;
        saveCases(cases);
      }
      return item;
    },

    returnByLegalDirector(id, returnNotes) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "DRAFTING_OPINION";
        item.status = "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)";
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
        item.workflowStep = 5;
        item.legalDirectorReturnNotes = returnNotes || "โปรดปรับปรุงแก้ไขสาระสำคัญข้อกฎหมายเพิ่มเติม";
        item.legalDirectorReturnedDate = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    dispatchByLegalAdmin(id, dispatchData) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DEPUTY_SG";
        item.status = "รอ รองเลขาธิการ ป.ป.ท. ตรวจสอบ";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "deputy_sg";
        item.officer = "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
        item.workflowStep = 8;
        if (dispatchData) {
          item.adminDispatchNo = dispatchData.dispatchNo || `2569/${String(Math.floor(100 + Math.random() * 900)).padStart(4, '0')}`;
          item.adminDispatchDate = dispatchData.dispatchDate || new Date().toISOString().split('T')[0];
          item.adminDispatchNotes = dispatchData.notes || "";
          item.adminDispatchTarget = dispatchData.target || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
        }
        item.adminDispatchedDate = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    finalDispatchByLegalAdmin(id, finalDispatchData) {
      const cases = loadCases();
      const item = cases.find(c => c.id === id);
      if (item) {
        item.statusCode = "PENDING_DIRECTOR_RESOLUTION";
        item.status = "ผอ.กองกฎหมายพิจารณาผลมติ";
        item.statusBadge = "bg-primary text-white";
        item.assignedRole = "dir_legal";
        item.officer = "นายนภัส สุทธิรักษ์ (ผู้อำนวยการกองกฎหมาย)";
        item.workflowStep = 9;
        if (finalDispatchData) {
          item.adminResolutionNotes = finalDispatchData.notes || "";
          item.finalDispatchNotes = finalDispatchData.notes || "";
        }
        item.adminForwardedToDirectorDate = new Date().toLocaleString('th-TH');
        item.finalDispatchedAt = new Date().toLocaleString('th-TH');
        saveCases(cases);
      }
      return item;
    },

    resetData() {
      saveCases(INITIAL_CASES);
      return INITIAL_CASES;
    }
  };

  global.Activity10 = Activity10;

})(typeof window !== 'undefined' ? window : this);
