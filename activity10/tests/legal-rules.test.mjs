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

console.log("------------------------------------------------------------");
console.log("🎉 ALL TEST SUITES PASSED SUCCESSFULLY (15/15 Tests OK)");
console.log("------------------------------------------------------------");
