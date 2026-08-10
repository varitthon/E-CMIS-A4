/**
 * E-CMIS Activity 10: Production-Grade Legal System Engine & Data Store
 * Project: กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
 */

(function(global) {
  'use strict';

  // Seed Data for Activity 10 Cases
  const INITIAL_CASES = [
    {
      id: "คดี-10.1-2569/001",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
      category: "10.1",
      categoryName: "คดีชั้นอัยการ (ความเห็นแย้ง)",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer", // legal_officer, dir_legal, sec_gen, admin_legal
      status: "กำลังร่างความเห็นแย้ง",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      slaTotalDays: 15,
      slaDaysRemaining: 3,
      slaAlert: "sla-warning",
      dateReceived: "2026-07-28",
      dueDate: "2026-08-12",
      workflowStep: 2,
      docType: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      docNo: "อส 0014/2569",
      legalOpinion: "จากการตรวจพิจารณาสำนวนการไต่สวนข้อเท็จจริง พยานเอกสารและพยานบุคคลที่ ป.ป.ท. ได้รวบรวมไว้ ปรากฏพยานหลักฐานชัดเจนว่าผู้ถูกกล่าวหามีเจตนาละเว้นการปฏิบัติหน้าที่ตามระเบียบการจัดซื้อจัดจ้างฯ จึงเห็นควรเสนอทำความเห็นแย้งคำสั่งไม่ฟ้องส่งอัยการสูงสุดชี้ขาด",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คำร้อง-10.2-2569/014",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการไต่สวนข้อเท็จจริงคดีบริหารงานผิดพลาด",
      category: "10.2.1",
      categoryName: "ขอเปิดเผยข้อมูลข่าวสาร",
      source: "ศูนย์รับเรื่องร้องเรียน ป.ป.ท. (ยื่น Walk-in)",
      officer: "นางสาวนิติพร มีไพฑูรย์ (นิติกรชำนาญการ)",
      assignedRole: "admin_legal",
      status: "รออนุกรรมการฯ พิจารณา",
      statusCode: "PENDING_SUBCOMMITTEE",
      statusBadge: "bg-info text-white",
      slaTotalDays: 60,
      slaDaysRemaining: 22,
      slaAlert: "sla-normal",
      dateReceived: "2026-07-15",
      dueDate: "2026-09-13",
      workflowStep: 3,
      docType: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      docNo: "คร 102/2569",
      legalOpinion: "เห็นควรเสนอคณะอนุกรรมการวินิจฉัยอุทธรณ์ฯ พิจารณาเปิดเผยข้อมูลบางส่วนโดยปกปิดข้อมูลส่วนบุคคล",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "อุทธรณ์-10.2-2569/005",
      title: "คำอุทธรณ์การไม่เปิดเผยข้อมูลข่าวสารเกี่ยวกับการสอบสวนวินัยข้าราชการระดับสูง",
      category: "10.2.2",
      categoryName: "อุทธรณ์การไม่เปิดเผยข้อมูล",
      source: "ระบบรับเรื่องร้องเรียนออนไลน์ (Email)",
      officer: "นายปติคุณ อู่ตะเภา (นิติกรชำนาญการ)",
      assignedRole: "dir_legal",
      status: "เสนอ ผอ.กองกฎหมาย",
      statusCode: "PENDING_DIRECTOR",
      statusBadge: "bg-primary text-white",
      slaTotalDays: 60,
      slaDaysRemaining: 8,
      slaAlert: "sla-danger",
      dateReceived: "2026-06-20",
      dueDate: "2026-08-19",
      workflowStep: 3,
      docType: "หนังสือคำอุทธรณ์ของผู้ร้อง",
      docNo: "อท 55/2569",
      legalOpinion: "เห็นควรเสนอคณะอนุกรรมการฯ มีมติยกคำอุทธรณ์ เนื่องจากเป็นเอกสารลับทางราชการตามมาตรา 15 (2)",
      signatureStamped: true,
      signedBy: "นางสาวณพัสตร์ ศรีสมเกียรติ (ผอ.กองกฎหมาย)",
      signedDate: "2026-08-05 14:30 น."
    },
    {
      id: "คดีปกครอง-10.3-2569/002",
      title: "คดีปกครองหมายเลขดำที่ อ.145/2569 ศาลปกครองสูงสุดออกหมายเรียกให้ทำคำให้การเพิ่มเติม",
      category: "10.3",
      categoryName: "คดีปกครอง (ศาลปกครอง)",
      source: "ศาลปกครองสูงสุด (e-Court System)",
      officer: "นายอานนท์ ชนประชา (นิติกรชำนาญการพิเศษ)",
      assignedRole: "sec_gen",
      status: "รอลงนามอนุมัติร่างคำให้การ",
      statusCode: "PENDING_SECGEN",
      statusBadge: "bg-success text-white",
      slaTotalDays: 30,
      slaDaysRemaining: 5,
      slaAlert: "sla-danger",
      dateReceived: "2026-07-20",
      dueDate: "2026-08-19",
      workflowStep: 4,
      docType: "หมายเรียกและสำเนาคำฟ้องศาลปกครอง",
      docNo: "ศป 145/2569",
      legalOpinion: "ยกร่างคำให้การเพิ่มเติมเสนอศาลปกครองสูงสุด ยืนยันว่าการออกคำสั่ง ป.ป.ท. เป็นไปโดยชอบด้วยกฎหมาย",
      signatureStamped: true,
      signedBy: "นายอภิชาติ สุจริตกุล (เลขาธิการ ป.ป.ท.)",
      signedDate: "2026-08-06 09:15 น."
    },
    {
      id: "คดี-10.1-2569/002",
      title: "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
      category: "10.1",
      categoryName: "คดีชั้นอัยการ (ความเห็นแย้ง)",
      source: "สนง. ป.ป.ท. เขต 3",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer",
      status: "กำลังร่างความเห็นแย้ง",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      slaTotalDays: 15,
      slaDaysRemaining: 12,
      slaAlert: "sla-normal",
      dateReceived: "2026-08-01",
      dueDate: "2026-08-16",
      workflowStep: 2,
      docType: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      docNo: "อส 0022/2569",
      legalOpinion: "อยู่ระหว่างรวบรวมพยานหลักฐานและยกร่างบันทึกความเห็นแย้งเสนอ ผอ.กลุ่มงาน",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คำร้อง-10.2-2569/015",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการตรวจสอบทรัพย์สินเจ้าหน้าที่ระดับสูง",
      category: "10.2.1",
      categoryName: "ขอเปิดเผยข้อมูลข่าวสาร",
      source: "สำนักข่าวอิศรา (ยื่นคำร้องออนไลน์)",
      officer: "นางสาวนิติพร มีไพฑูรย์ (นิติกรชำนาญการ)",
      assignedRole: "admin_legal",
      status: "รับเรื่อง/ตรวจสอบเอกสาร",
      statusCode: "PENDING_INTAKE",
      statusBadge: "bg-secondary text-white",
      slaTotalDays: 60,
      slaDaysRemaining: 45,
      slaAlert: "sla-normal",
      dateReceived: "2026-08-02",
      dueDate: "2026-10-01",
      workflowStep: 1,
      docType: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      docNo: "คร 103/2569",
      legalOpinion: "รับเรื่องเข้าสู่ระบบ ตรวจสอบความครบถ้วนของเอกสารก่อนเสนอผู้บริหาร",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดีปกครอง-10.3-2569/003",
      title: "คดีปกครองฟ้องเพิกถอนคำสั่งชี้มูลความผิดทางวินัยอย่างร้ายแรง กรณีทุจริตที่ดิน",
      category: "10.3",
      categoryName: "คดีปกครอง (ศาลปกครอง)",
      source: "ศาลปกครองกลาง (e-Court)",
      officer: "นายอานนท์ ชนประชา (นิติกรชำนาญการพิเศษ)",
      assignedRole: "dir_legal",
      status: "เสนอ ผอ.กองกฎหมาย",
      statusCode: "PENDING_DIRECTOR",
      statusBadge: "bg-primary text-white",
      slaTotalDays: 30,
      slaDaysRemaining: 18,
      slaAlert: "sla-normal",
      dateReceived: "2026-07-28",
      dueDate: "2026-08-27",
      workflowStep: 3,
      docType: "คำฟ้องศาลปกครองกลาง",
      docNo: "ศป 188/2569",
      legalOpinion: "จัดทำร่างคำให้การเสร็จสิ้น เสนอ ผอ.กองกฎหมาย เพื่อให้ความเห็นชอบก่อนเสนอเลขาธิการฯ",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดี-10.1-2569/003",
      title: "ความเห็นแย้งคดีเจ้าหน้าที่เรียกรับผลประโยชน์ในการออกใบอนุญาตสีก่อสร้าง",
      category: "10.1",
      categoryName: "คดีชั้นอัยการ (ความเห็นแย้ง)",
      source: "สนง. ป.ป.ท. เขต 1",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "sec_gen",
      status: "อนุมัติเสนอ อสส. แล้ว",
      statusCode: "APPROVED",
      statusBadge: "bg-success text-white",
      slaTotalDays: 15,
      slaDaysRemaining: 1,
      slaAlert: "sla-danger",
      dateReceived: "2026-07-25",
      dueDate: "2026-08-09",
      workflowStep: 4,
      docType: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      docNo: "อส 0055/2569",
      legalOpinion: "เลขาธิการ ป.ป.ท. อนุมัติความเห็นแย้ง และส่งเรื่องให้อัยการสูงสุดชี้ขาดแล้ว",
      signatureStamped: true,
      signedBy: "นายอภิชาติ สุจริตกุล (เลขาธิการ ป.ป.ท.)",
      signedDate: "2026-08-08 11:00 น."
    },
    {
      id: "อุทธรณ์-10.2-2569/006",
      title: "คำอุทธรณ์กรณี ป.ป.ท. ปฏิเสธการเปิดเผยรายชื่อผู้ร้องเรียนโครงการก่อสร้างถนน",
      category: "10.2.2",
      categoryName: "อุทธรณ์การไม่เปิดเผยข้อมูล",
      source: "ไปรษณีย์ตอบรับ (EMS)",
      officer: "นายปติคุณ อู่ตะเภา (นิติกรชำนาญการ)",
      assignedRole: "admin_legal",
      status: "กำลังยกร่างคำชี้แจง",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      slaTotalDays: 60,
      slaDaysRemaining: 2,
      slaAlert: "sla-danger",
      dateReceived: "2026-06-12",
      dueDate: "2026-08-11",
      workflowStep: 2,
      docType: "หนังสือคำอุทธรณ์",
      docNo: "อท 58/2569",
      legalOpinion: "ยกร่างความเห็นคุ้มครองสิทธิ์และคุ้มครองพยาน ไม่เปิดเผยรายชื่อผู้คุ้มครอง",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดีปกครอง-10.3-2569/004",
      title: "คดีปกครองหมายเลขดำที่ 890/2569 ขอให้ศาลสั่งคุ้มครองชั่วคราวก่อนการพิพากษา",
      category: "10.3",
      categoryName: "คดีปกครอง (ศาลปกครอง)",
      source: "ศาลปกครองระยอง (e-Court)",
      officer: "นายอานนท์ ชนประชา (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer",
      status: "กำลังร่างคำคัดค้าน",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      slaTotalDays: 30,
      slaDaysRemaining: 4,
      slaAlert: "sla-danger",
      dateReceived: "2026-07-16",
      dueDate: "2026-08-15",
      workflowStep: 2,
      docType: "คำขอไต่สวนฉุกเฉินคุ้มครองชั่วคราว",
      docNo: "ศป 890/2569",
      legalOpinion: "เร่งจัดทำคำคัดค้านการคุ้มครองชั่วคราว เสนอ ผอ.กองกฎหมาย",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คำร้อง-10.2-2569/016",
      title: "คำร้องขอคัดสำเนาบันทึกคำให้การในชั้นไต่สวนเบื้องต้น",
      category: "10.2.1",
      categoryName: "ขอเปิดเผยข้อมูลข่าวสาร",
      source: "ศูนย์บริการประชาชน ป.ป.ท.",
      officer: "นางสาวนิติพร มีไพฑูรย์ (นิติกรชำนาญการ)",
      assignedRole: "dir_legal",
      status: "เสนอ ผอ.กองกฎหมาย",
      statusCode: "PENDING_DIRECTOR",
      statusBadge: "bg-primary text-white",
      slaTotalDays: 60,
      slaDaysRemaining: 30,
      slaAlert: "sla-normal",
      dateReceived: "2026-07-10",
      dueDate: "2026-09-08",
      workflowStep: 3,
      docType: "คำร้องขอคัดสำเนา",
      docNo: "คร 110/2569",
      legalOpinion: "อนุญาตให้คัดสำเนาได้เฉพาะส่วนที่เป็นคำให้การของผู้ร้องเอง",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    },
    {
      id: "คดี-10.1-2569/004",
      title: "พิจารณาความเห็นแย้งคดีเจ้าหน้าที่รัฐทุจริตยักยอกเงินของหลวงในสำนักงานเขต",
      category: "10.1",
      categoryName: "คดีชั้นอัยการ (ความเห็นแย้ง)",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
      assignedRole: "legal_officer",
      status: "กำลังร่างความเห็นแย้ง",
      statusCode: "DRAFTING_OPINION",
      statusBadge: "bg-warning text-dark",
      slaTotalDays: 15,
      slaDaysRemaining: 9,
      slaAlert: "sla-normal",
      dateReceived: "2026-08-04",
      dueDate: "2026-08-19",
      workflowStep: 2,
      docType: "คำสั่งไม่ฟ้องพนักงานอัยการ",
      docNo: "อส 0089/2569",
      legalOpinion: "พยานหลักฐานการรับเงินและสลิปโอนเงินมัดแน่น เห็นควรทำความเห็นแย้ง",
      signatureStamped: false,
      signedBy: "",
      signedDate: ""
    }
  ];

  // Load Persisted Cases from LocalStorage
  function loadCases() {
    try {
      const stored = localStorage.getItem("ecmis_activity10_cases");
      if (stored) return JSON.parse(stored);
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

  // Activity 10 Engine API
  const Activity10 = {
    getCases: loadCases,
    
    getCaseById(id) {
      const cases = loadCases();
      return cases.find(c => c.id === id) || cases[0];
    },

    addCase(newCaseData) {
      const cases = loadCases();
      const count = cases.length + 1;
      const category = newCaseData.category || "10.1";
      const caseId = `คดี-${category}-2569/00${count}`;

      const createdCase = {
        id: caseId,
        title: newCaseData.title || "สำนวนคดีกฎหมายใหม่",
        category: category,
        categoryName: newCaseData.categoryName || (category === '10.1' ? 'คดีชั้นอัยการ (ความเห็นแย้ง)' : category === '10.3' ? 'คดีปกครอง (ศาลปกครอง)' : 'ขอเปิดเผยข้อมูลข่าวสาร'),
        source: newCaseData.source || "ศูนย์รับเรื่องร้องเรียน",
        officer: newCaseData.officer || "นายณัฐพล บัวทุม (นิติกรเจ้าของสำนวน)",
        assignedRole: "legal_officer",
        status: "กำลังร่างความเห็น",
        statusCode: "DRAFTING_OPINION",
        statusBadge: "bg-warning text-dark",
        slaTotalDays: newCaseData.slaTotalDays || 15,
        slaDaysRemaining: newCaseData.slaTotalDays || 15,
        slaAlert: "sla-normal",
        dateReceived: new Date().toISOString().split('T')[0],
        dueDate: newCaseData.dueDate || "2026-08-25",
        workflowStep: 2,
        docType: newCaseData.docType || "เอกสารแนบสำนวน",
        docNo: newCaseData.docNo || "นร 10/2569",
        legalOpinion: newCaseData.legalOpinion || "อยู่ระหว่างตรวจพิจารณาข้อเท็จจริงและพยานหลักฐาน",
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
        item.lawReceiveNo = lawReceiveNo || `รับ-กม. 2569/${Math.floor(1000 + Math.random() * 9000)}`;
        item.statusCode = "PENDING_DIRECTOR";
        item.status = "เสนอ ผอ.กองกฎหมาย";
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
        item.centralSarabanNo = data.centralSarabanNo || item.centralSarabanNo || `รับ-สบร. 2569/${Math.floor(1000 + Math.random() * 9000)}`;
        item.physicalDocDate = data.physicalDocDate || new Date().toISOString().split('T')[0];
        item.scannedDocFile = data.scannedDocFile || "เอกสารสแกนฉบับจริง_สารบรรณกลาง.pdf";
        item.boardAdminOfficer = data.boardAdminOfficer || "นางสาวศิริพร ขวัญเมือง (เจ้าหน้าที่กองบริหารคดี)";
        item.scannedStatus = "scanned";
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
