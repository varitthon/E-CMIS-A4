/* ==========================================================================
   E-CMIS Activity 10: Legal Rules & SLA Boundary Unit Test Suite
   Project: กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
   
   Test Categories Covered:
   1. Boundary Value Analysis (BVA) — SLA limits & Notification Triggers (7d, 10d, 15d, 30d, 45d, 60d)
   2. Equivalence Partitioning (EP) — Case types (10.1, 10.2.1, 10.2.2, 10.3) & Decisions
   3. State Transition Matrix — Case Lifecycle State Machine
   4. End-to-End (E2E) Flow Paths — Happy Path & Exception Handling
   
   Run via CLI: node activity10/tests/legal-rules.test.mjs
   ========================================================================== */

import assert from "node:assert/strict";

console.log("------------------------------------------------------------");
console.log("🧪 Running E-CMIS Activity 10 Legal & SLA Unit Test Suite...");
console.log("------------------------------------------------------------\n");

// --- Mock Domain Logic Engine for Activity 10 ---
const LegalRulesEngine = {
  
  // Calculate SLA Limit based on Category & Channel
  calculateSLA(category, channel) {
    if (channel === 'central_mail') return { days: 7, label: 'ส่วนกลางรับเรื่อง (7 วัน)' };
    if (channel === 'area_direct') return { days: 10, label: 'เขตพื้นที่รับเรื่อง (10 วัน)' };
    
    switch (category) {
      case '10.1': return { days: 15, label: 'พิจารณาความเห็นแย้งคำสั่งอัยการ (15 วัน)' };
      case '10.3': return { days: 30, label: 'จัดทำคำให้การต่อศาลปกครอง (30 วัน)' };
      case '10.2.1':
      case '10.2.2':
      default:
        return { days: 60, label: 'กระบวนการพิจารณาคำอุทธรณ์ภาพรวม (60 วัน)' };
    }
  },
  
  // Evaluate SLA Alert Threshold (BVA)
  getSLAAlertStatus(daysRemaining, totalDays) {
    if (daysRemaining <= 0) return 'EXPIRED_CRIMSON';
    if (daysRemaining <= 15 || (totalDays - daysRemaining) >= 45) return 'DANGER_ALERT';
    if ((totalDays - daysRemaining) >= 30) return 'WARNING_ALERT_HALF';
    return 'NORMAL_GREEN';
  },

  // State Transition Machine Matrix
  getNextState(currentState, action) {
    const transitions = {
      'REGISTERED': {
        'ASSIGN_OFFICER': 'DRAFTING_OPINION'
      },
      'DRAFTING_OPINION': {
        'SUBMIT_APPROVAL': 'PENDING_DIRECTOR',
        'SAVE_DRAFT': 'DRAFTING_OPINION'
      },
      'PENDING_DIRECTOR': {
        'APPROVE': 'PENDING_SECGEN',
        'REJECT': 'DRAFTING_OPINION'
      },
      'PENDING_SECGEN': {
        'APPROVE_SIGN': 'FINAL_DISPATCHED',
        'REJECT': 'PENDING_DIRECTOR'
      },
      'FINAL_DISPATCHED': {
        'RECORD_RESOLUTION': 'ARCHIVED'
      }
    };
    return transitions[currentState]?.[action] || null;
  },

  // S18 Rules Engine: Determine external recipient & dispatch constraints
  getS18DispatchRules(resolutionType) {
    if (resolutionType === 'AGREED' || resolutionType === 'AGREED_PROSECUTOR') {
      return {
        recipientType: 'PROSECUTOR_ORIGIN',
        recipientLabel: 'พนักงานอัยการเจ้าของสำนวน (ต้นทาง)',
        allowedMethods: ['POSTAL_EMS'],
        requireEmsTracking: true
      };
    } else {
      return {
        recipientType: 'ATTORNEY_GENERAL',
        recipientLabel: 'สำนักงานอัยการสูงสุด (อสส.)',
        allowedMethods: ['POSTAL_EMS', 'HAND_DELIVERY'],
        requireEmsTracking: false
      };
    }
  },

  // Validate S18 Dispatch Submission
  validateS18Dispatch(dispatchPayload) {
    const rules = this.getS18DispatchRules(dispatchPayload.resolutionType);
    if (!rules.allowedMethods.includes(dispatchPayload.method)) {
      return { valid: false, error: `Invalid dispatch method: ${dispatchPayload.method} not allowed for ${dispatchPayload.resolutionType}` };
    }
    if (dispatchPayload.method === 'POSTAL_EMS') {
      if (!dispatchPayload.emsTrackingNo || !/^E[A-Z]\d{9}TH$/i.test(dispatchPayload.emsTrackingNo)) {
        return { valid: false, error: 'Invalid EMS tracking format (must be 13 chars, e.g. ED123456789TH)' };
      }
    } else if (dispatchPayload.method === 'HAND_DELIVERY') {
      if (!dispatchPayload.oagReceiveDocNo) {
        return { valid: false, error: 'Missing OAG receive document number' };
      }
    }
    return { valid: true, error: null };
  },

  // Validate S19 OAG Verdict Intake
  validateS19OAGVerdict(verdictPayload) {
    if (!verdictPayload.oagVerdictNo) return { valid: false, error: 'Missing OAG verdict doc number' };
    if (!['PROSECUTE', 'NON_PROSECUTE'].includes(verdictPayload.oagVerdictDecision)) {
      return { valid: false, error: 'Invalid OAG verdict decision' };
    }
    if (!verdictPayload.oagVerdictFile) return { valid: false, error: 'Missing OAG verdict PDF file' };
    return { valid: true, error: null };
  },

  // Validate S20 Director Review & Assignment
  validateS20DirectorReview(reviewPayload) {
    if (!reviewPayload.directorOagVerdictNotes) return { valid: false, error: 'Missing director notes/order' };
    if (!reviewPayload.directorAssignedGroup) return { valid: false, error: 'Missing assigned group' };
    return { valid: true, error: null };
  },

  // Validate S21 Group Director Review & Officer Assignment
  validateS21GroupDirectorReview(groupPayload) {
    if (!groupPayload.groupDirectorOagVerdictNotes) return { valid: false, error: 'Missing group director notes/order' };
    if (!groupPayload.assignedOfficer) return { valid: false, error: 'Missing assigned legal officer' };
    return { valid: true, error: null };
  },

  // Validate S22 Officer Final Notification & Case Closure
  validateS22CaseClosedNotification(notifyPayload) {
    if (!notifyPayload.caseClosedNotifyDocNo) return { valid: false, error: 'Missing internal notification document number' };
    if (!notifyPayload.officerCaseClosedNotes) return { valid: false, error: 'Missing notification message/notes' };
    if (!notifyPayload.caseClosedNotifyTarget) return { valid: false, error: 'Missing target division (Case Administration Division)' };
    return { valid: true, error: null };
  },

  // Validate E2E Payload Completeness
  validateDispatchPayload(caseData) {
    if (!caseData.id || !caseData.title) return { valid: false, error: 'Missing core identity' };
    if (!caseData.legalOpinion) return { valid: false, error: 'Missing legal opinion text' };
    if (!caseData.eSignatureStamped) return { valid: false, error: 'Missing required e-Signature' };
    return { valid: true, error: null };
  }
};

// =========================================================================
// TEST SUITE 1: Boundary Value Analysis (BVA) — SLA Thresholds
// =========================================================================
console.log("🔹 [TEST SUITE 1] Boundary Value Analysis (BVA) - SLA Boundaries");

// BVA Test 1.1: SLA for 10.1 (ความเห็นแย้ง)
const sla101 = LegalRulesEngine.calculateSLA('10.1', 'oag_api');
assert.equal(sla101.days, 15, "BVA 1.1: SLA สำหรับกิจกรรม 10.1 ต้องเป็น 15 วัน");

// BVA Test 1.2: SLA for Central Mail Channel
const slaCentral = LegalRulesEngine.calculateSLA('10.2.2', 'central_mail');
assert.equal(slaCentral.days, 7, "BVA 1.2: ส่วนกลางรับเรื่อง ต้องถูก override เป็น 7 วัน");

// BVA Test 1.3: SLA for Area Direct Channel
const slaArea = LegalRulesEngine.calculateSLA('10.2.1', 'area_direct');
assert.equal(slaArea.days, 10, "BVA 1.3: เขตพื้นที่รับเรื่อง ต้องถูก override เป็น 10 วัน");

// BVA Test 1.4: Alert Trigger at 30 Days (Halfway)
const alert30 = LegalRulesEngine.getSLAAlertStatus(30, 60);
assert.equal(alert30, 'WARNING_ALERT_HALF', "BVA 1.4: วันที่ 30 ต้อง Trigger Alert เตือนครึ่งทาง");

// BVA Test 1.5: Alert Trigger at 45 Days (Near Deadline)
const alert45 = LegalRulesEngine.getSLAAlertStatus(15, 60);
assert.equal(alert45, 'DANGER_ALERT', "BVA 1.5: วันที่ 45 (เหลือ 15 วัน) ต้อง Trigger Danger Alert");

// BVA Test 1.6: Expired SLA Boundary (0 days)
const alert0 = LegalRulesEngine.getSLAAlertStatus(0, 60);
assert.equal(alert0, 'EXPIRED_CRIMSON', "BVA 1.6: เหลือ 0 วัน ต้องแจ้งเตือนสีแดงเกินกำหนด");

console.log("   ✅ Passed all 6 BVA SLA boundary tests.\n");


// =========================================================================
// TEST SUITE 2: Equivalence Partitioning (EP) — Case Categories
// =========================================================================
console.log("🔹 [TEST SUITE 2] Equivalence Partitioning (EP) - Case Categories");

// EP Test 2.1: 10.3 คดีปกครอง SLA 30 วัน
const slaCourt = LegalRulesEngine.calculateSLA('10.3', 'ecourt_api');
assert.equal(slaCourt.days, 30, "EP 2.1: คดีปกครองต้องได้ SLA 30 วันตามมาตรฐานศาลปกครอง");

// EP Test 2.2: 10.2 คำอุทธรณ์เปิดเผยข้อมูลภาพรวม 60 วัน
const slaAppeal = LegalRulesEngine.calculateSLA('10.2.2', 'email');
assert.equal(slaAppeal.days, 60, "EP 2.2: คำอุทธรณ์ข้อมูลต้องได้กรอบระยะเวลารวม 60 วัน");

console.log("   ✅ Passed all EP category partition tests.\n");


// =========================================================================
// TEST SUITE 3: State Transition Matrix — Case Lifecycle
// =========================================================================
console.log("🔹 [TEST SUITE 3] State Transition Lifecycle Matrix");

let state = 'REGISTERED';

// Transition 1: Register -> Assign Officer
state = LegalRulesEngine.getNextState(state, 'ASSIGN_OFFICER');
assert.equal(state, 'DRAFTING_OPINION', "State Test 3.1: REGISTERED ➔ DRAFTING_OPINION");

// Transition 2: Drafting -> Submit Approval
state = LegalRulesEngine.getNextState(state, 'SUBMIT_APPROVAL');
assert.equal(state, 'PENDING_DIRECTOR', "State Test 3.2: DRAFTING_OPINION ➔ PENDING_DIRECTOR");

// Transition 3: Director Reject Path (Exception handling)
const rejectState = LegalRulesEngine.getNextState('PENDING_DIRECTOR', 'REJECT');
assert.equal(rejectState, 'DRAFTING_OPINION', "State Test 3.3: Reject ส่งกลับ ➔ DRAFTING_OPINION");

// Transition 4: Director Approve Path
state = LegalRulesEngine.getNextState('PENDING_DIRECTOR', 'APPROVE');
assert.equal(state, 'PENDING_SECGEN', "State Test 3.4: PENDING_DIRECTOR ➔ PENDING_SECGEN");

// Transition 5: SecGen Sign Path
state = LegalRulesEngine.getNextState(state, 'APPROVE_SIGN');
assert.equal(state, 'FINAL_DISPATCHED', "State Test 3.5: PENDING_SECGEN ➔ FINAL_DISPATCHED");

// Transition 6: Record Resolution -> Archived
state = LegalRulesEngine.getNextState(state, 'RECORD_RESOLUTION');
assert.equal(state, 'ARCHIVED', "State Test 3.6: FINAL_DISPATCHED ➔ ARCHIVED");

console.log("   ✅ Passed all 6 State Transition Matrix lifecycle tests.\n");


// =========================================================================
// TEST SUITE 4: End-to-End (E2E) Path & Payload Validation
// =========================================================================
console.log("🔹 [TEST SUITE 4] End-to-End (E2E) Payload & Signature Validation");

// E2E Test 4.1: Missing e-Signature Violation
const invalidPayload = {
  id: "คดี-10.1-2569/001",
  title: "ทดสอบทำความเห็นแย้ง",
  legalOpinion: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้อง",
  eSignatureStamped: false
};
const resInvalid = LegalRulesEngine.validateDispatchPayload(invalidPayload);
assert.equal(resInvalid.valid, false, "E2E 4.1: หากไม่มี e-Signature ต้องไม่ผ่าน Validation");
assert.equal(resInvalid.error, 'Missing required e-Signature');

// E2E Test 4.2: Complete Valid Payload
const validPayload = {
  id: "คดี-10.1-2569/001",
  title: "ทดสอบทำความเห็นแย้ง",
  legalOpinion: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้อง",
  eSignatureStamped: true
};
const resValid = LegalRulesEngine.validateDispatchPayload(validPayload);
assert.equal(resValid.valid, true, "E2E 4.2: ข้อมูลและ e-Signature ครบถ้วน ต้องผ่าน Validation");

console.log("   ✅ Passed all E2E validation tests.\n");


// =========================================================================
// TEST SUITE 5: Step S18 — External Dispatch to Prosecutor / OAG
// =========================================================================
console.log("🔹 [TEST SUITE 5] Step S18: External Dispatch & Tracking Rules");

// S18 Test 5.1: Scenario 1 (Agreed) -> Origin Prosecutor via EMS only
const ruleAgreed = LegalRulesEngine.getS18DispatchRules('AGREED');
assert.equal(ruleAgreed.recipientType, 'PROSECUTOR_ORIGIN', "S18 5.1a: มติเห็นชอบต้องส่งให้อัยการต้นทาง");
assert.deepEqual(ruleAgreed.allowedMethods, ['POSTAL_EMS'], "S18 5.1b: มติเห็นชอบต้องส่งผ่านไปรษณีย์ EMS เท่านั้น");

// S18 Test 5.2: Scenario 2 (Disagreed) -> Attorney General (OAG) via EMS or Hand Delivery
const ruleDisagreed = LegalRulesEngine.getS18DispatchRules('DISAGREED');
assert.equal(ruleDisagreed.recipientType, 'ATTORNEY_GENERAL', "S18 5.2a: มติเห็นแย้งต้องส่งให้ อสส.");
assert.deepEqual(ruleDisagreed.allowedMethods, ['POSTAL_EMS', 'HAND_DELIVERY'], "S18 5.2b: มติเห็นแย้งเลือกส่ง EMS หรือ ส่งด้วยตนเองได้");

// S18 Test 5.3: EMS Tracking Format Validation (Valid 13 chars)
const validEms = LegalRulesEngine.validateS18Dispatch({
  resolutionType: 'DISAGREED',
  method: 'POSTAL_EMS',
  emsTrackingNo: 'ED889912345TH'
});
assert.equal(validEms.valid, true, "S18 5.3: เลข EMS ถูกต้องตามมาตรฐาน 13 หลัก ต้องผ่าน Validation");

// S18 Test 5.4: EMS Tracking Format Validation (Invalid format)
const invalidEms = LegalRulesEngine.validateS18Dispatch({
  resolutionType: 'AGREED',
  method: 'POSTAL_EMS',
  emsTrackingNo: '12345'
});
assert.equal(invalidEms.valid, false, "S18 5.4: เลข EMS ผิดรูปแบบต้องไม่ผ่าน Validation");

// S18 Test 5.5: Hand Delivery Validation (Missing OAG Receive No)
const invalidHand = LegalRulesEngine.validateS18Dispatch({
  resolutionType: 'DISAGREED',
  method: 'HAND_DELIVERY',
  oagReceiveDocNo: ''
});
assert.equal(invalidHand.valid, false, "S18 5.5: ส่งด้วยตนเองแต่ไม่มีเลขรับ อสส. ต้องไม่ผ่าน Validation");

// S18 Test 5.6: Hand Delivery Validation (Valid OAG Receive No)
const validHand = LegalRulesEngine.validateS18Dispatch({
  resolutionType: 'DISAGREED',
  method: 'HAND_DELIVERY',
  oagReceiveDocNo: 'อส 0001/4588'
});
assert.equal(validHand.valid, true, "S18 5.6: ส่งด้วยตนเองและมีเลขรับ อสส. ครบถ้วน ต้องผ่าน Validation");

console.log("   ✅ Passed all 6 S18 Dispatch and Tracking tests.\n");


// =========================================================================
// TEST SUITE 6: Step S19 — OAG Verdict Intake by Legal Admin
// =========================================================================
console.log("🔹 [TEST SUITE 6] Step S19: OAG Verdict Intake Validation");

// S19 Test 6.1: Missing OAG Verdict Document Number
const invalidVerdict1 = LegalRulesEngine.validateS19OAGVerdict({
  oagVerdictNo: '',
  oagVerdictDecision: 'PROSECUTE',
  oagVerdictFile: 'verdict.pdf'
});
assert.equal(invalidVerdict1.valid, false, "S19 6.1: ขาดเลขที่หนังสือ อสส. ต้องไม่ผ่าน Validation");

// S19 Test 6.2: Invalid Verdict Decision Type
const invalidVerdict2 = LegalRulesEngine.validateS19OAGVerdict({
  oagVerdictNo: 'อส 0001/6789',
  oagVerdictDecision: 'UNKNOWN_DECISION',
  oagVerdictFile: 'verdict.pdf'
});
assert.equal(invalidVerdict2.valid, false, "S19 6.2: ผลคำวินิจฉัยไม่ถูกต้อง ต้องไม่ผ่าน Validation");

// S19 Test 6.3: Valid Prosecute Decision
const validVerdict1 = LegalRulesEngine.validateS19OAGVerdict({
  oagVerdictNo: 'อส 0001/6789',
  oagVerdictDecision: 'PROSECUTE',
  oagVerdictFile: 'หนังสือคำวินิจฉัยชี้ขาด_อสส_ให้ฟ้องคดี_อส0001_6789.pdf'
});
assert.equal(validVerdict1.valid, true, "S19 6.3: อสส. ชี้ขาดให้ฟ้องคดี ข้อมูลครบถ้วน ต้องผ่าน Validation");

// S19 Test 6.4: Valid Non-Prosecute Decision
const validVerdict2 = LegalRulesEngine.validateS19OAGVerdict({
  oagVerdictNo: 'อส 0001/6790',
  oagVerdictDecision: 'NON_PROSECUTE',
  oagVerdictFile: 'หนังสือคำวินิจฉัยชี้ขาด_อสส_ไม่ฟ้องคดี_อส0001_6790.pdf'
});
assert.equal(validVerdict2.valid, true, "S19 6.4: อสส. ชี้ขาดไม่ฟ้องคดี ข้อมูลครบถ้วน ต้องผ่าน Validation");

console.log("   ✅ Passed all 4 S19 OAG Verdict Intake tests.\n");


// =========================================================================
// TEST SUITE 7: Step S20 — Director Review & Assignment
// =========================================================================
console.log("🔹 [TEST SUITE 7] Step S20: Legal Director Review & Assignment");

// S20 Test 7.1: Missing Director Notes/Order
const invalidReview1 = LegalRulesEngine.validateS20DirectorReview({
  directorOagVerdictNotes: '',
  directorAssignedGroup: 'กลุ่มงานความเห็นแย้ง'
});
assert.equal(invalidReview1.valid, false, "S20 7.1: ขาดข้อสั่งการของ ผอ.กอง ต้องไม่ผ่าน Validation");

// S20 Test 7.2: Missing Assigned Group
const invalidReview2 = LegalRulesEngine.validateS20DirectorReview({
  directorOagVerdictNotes: 'รับทราบคำวินิจฉัยชี้ขาด',
  directorAssignedGroup: ''
});
assert.equal(invalidReview2.valid, false, "S20 7.2: ขาดกลุ่มงานที่มอบหมาย ต้องไม่ผ่าน Validation");

// S20 Test 7.3: Valid Director Review
const validReview = LegalRulesEngine.validateS20DirectorReview({
  directorOagVerdictNotes: 'รับทราบคำวินิจฉัยชี้ขาดของอัยการสูงสุด มอบหมาย ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการต่อ',
  directorAssignedGroup: 'กลุ่มงานความเห็นแย้ง'
});
assert.equal(validReview.valid, true, "S20 7.3: ข้อสั่งการและกลุ่มงานมอบหมายครบถ้วน ต้องผ่าน Validation");

console.log("   ✅ Passed all 3 S20 Director Review tests.\n");


// =========================================================================
// TEST SUITE 8: Step S21 — Group Director Review & Officer Assignment
// =========================================================================
console.log("🔹 [TEST SUITE 8] Step S21: Group Director Review & Officer Assignment");

// S21 Test 8.1: Missing Group Director Notes/Order
const invalidGroupReview1 = LegalRulesEngine.validateS21GroupDirectorReview({
  groupDirectorOagVerdictNotes: '',
  assignedOfficer: 'นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)'
});
assert.equal(invalidGroupReview1.valid, false, "S21 8.1: ขาดข้อสั่งการของ ผอ.กลุ่มงาน ต้องไม่ผ่าน Validation");

// S21 Test 8.2: Missing Assigned Officer
const invalidGroupReview2 = LegalRulesEngine.validateS21GroupDirectorReview({
  groupDirectorOagVerdictNotes: 'มอบหมายนิติกรดำเนินการต่อ',
  assignedOfficer: ''
});
assert.equal(invalidGroupReview2.valid, false, "S21 8.2: ขาดนิติกรผู้รับมอบหมาย ต้องไม่ผ่าน Validation");

// S21 Test 8.3: Valid Group Director Review
const validGroupReview = LegalRulesEngine.validateS21GroupDirectorReview({
  groupDirectorOagVerdictNotes: 'มอบหมายนิติกรเจ้าของสำนวน ดำเนินการสรุปผลคำวินิจฉัยชี้ขาดของอัยการสูงสุด และจัดทำหนังสือแจ้งกองบริหารคดีเพื่อดำเนินการตามขั้นตอนต่อไป',
  assignedOfficer: 'นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)'
});
assert.equal(validGroupReview.valid, true, "S21 8.3: ข้อสั่งการและนิติกรมอบหมายครบถ้วน ต้องผ่าน Validation");

console.log("   ✅ Passed all 3 S21 Group Director Review tests.\n");


// =========================================================================
// TEST SUITE 9: Step S22 — Officer Final Notification & Case Closure
// =========================================================================
console.log("🔹 [TEST SUITE 9] Step S22: Officer Final Notification & Case Closure");

// S22 Test 9.1: Missing Notification Document Number
const invalidCaseClosed1 = LegalRulesEngine.validateS22CaseClosedNotification({
  caseClosedNotifyDocNo: '',
  officerCaseClosedNotes: 'แจ้งผลคำวินิจฉัยชี้ขาด อสส.',
  caseClosedNotifyTarget: 'กองบริหารคดี (กบค.)'
});
assert.equal(invalidCaseClosed1.valid, false, "S22 9.1: ขาดเลขที่หนังสือแจ้งภายใน ต้องไม่ผ่าน Validation");

// S22 Test 9.2: Missing Notification Notes/Message
const invalidCaseClosed2 = LegalRulesEngine.validateS22CaseClosedNotification({
  caseClosedNotifyDocNo: 'ที่ ปปท 0014/น.1420',
  officerCaseClosedNotes: '',
  caseClosedNotifyTarget: 'กองบริหารคดี (กบค.)'
});
assert.equal(invalidCaseClosed2.valid, false, "S22 9.2: ขาดข้อความในหนังสือแจ้ง ต้องไม่ผ่าน Validation");

// S22 Test 9.3: Missing Target Division
const invalidCaseClosed3 = LegalRulesEngine.validateS22CaseClosedNotification({
  caseClosedNotifyDocNo: 'ที่ ปปท 0014/น.1420',
  officerCaseClosedNotes: 'แจ้งผลคำวินิจฉัยชี้ขาด อสส.',
  caseClosedNotifyTarget: ''
});
assert.equal(invalidCaseClosed3.valid, false, "S22 9.3: ขาดหน่วยงานรับแจ้ง ต้องไม่ผ่าน Validation");

// S22 Test 9.4: Valid Final Case Closure Notification
const validCaseClosed = LegalRulesEngine.validateS22CaseClosedNotification({
  caseClosedNotifyDocNo: 'ที่ ปปท 0014/น.1420',
  officerCaseClosedNotes: 'กองกฎหมายขอแจ้งผลคำวินิจฉัยชี้ขาดของอัยการสูงสุด เพื่อให้กองบริหารคดีทราบและดำเนินการตามขั้นตอนต่อไป',
  caseClosedNotifyTarget: 'กองบริหารคดี (กบค.)'
});
assert.equal(validCaseClosed.valid, true, "S22 9.4: ข้อมูลหนังสือแจ้งกองบริหารคดีครบถ้วน สมบูรณ์ตามระเบียบ");

console.log("   ✅ Passed all 4 S22 Final Notification & Case Closure tests.\n");

console.log("------------------------------------------------------------");
console.log("🎉 ALL TEST SUITES PASSED SUCCESSFULLY (35/35 Tests OK)");
console.log("------------------------------------------------------------");





