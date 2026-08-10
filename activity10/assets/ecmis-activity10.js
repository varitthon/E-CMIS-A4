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

    resetData() {
      saveCases(INITIAL_CASES);
      return INITIAL_CASES;
    }
  };

  global.Activity10 = Activity10;

})(typeof window !== 'undefined' ? window : this);
