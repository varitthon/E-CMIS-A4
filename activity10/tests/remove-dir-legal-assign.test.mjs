/* หน่วยทดสอบ — ตัดขั้น ผอ.กองกฎหมายมอบหมาย/สั่งการ 11 ขั้น (2026-10-14)
   ดู docs/remove-dir-legal-assign/plan.md
   2026-10-21 นำ 4 ขั้นของเรื่องเข้าใหม่กลับมา (04 / 10-2-01 / 10-3-02 / 10-3v-02)
   — เรื่องเข้าใหม่ผ่าน ผอ.กองกฎหมาย มอบหมายก่อน ส่วนที่รับกลับจากกิจกรรม 7 ยังส่งตรง
   - สถานะที่ขั้นก่อนหน้าเขียน → ไปหน้า ผอ.กลุ่มงาน / ฝ่ายเลขานุการฯ โดยตรง
   - ไม่มีหน้า ผอ.กองที่ตัดออกเหลือใน ROUTES
   - advance() ของ 10.3 กำหนด assignedRole เป็น ผอ.กลุ่มงานคดี
   - เคสที่ค้างอยู่ที่สถานะเดิมถูกย้ายตอนโหลด
   Run: node activity10/tests/remove-dir-legal-assign.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = { localStorage: globalThis.localStorage };
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-10-2.js"))(sandbox);
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(
  sandbox,
  sandbox.Activity10,
);
const { Activity10: A, Activity102: A2, Activity103: A3 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const REMOVED_PAGES = [
  "11-legal-director-resolution.html",
  "10-2-34-legal-director-comment.html",
  "10-3-11-legal-director-assign-resolution.html",
  "10-3v-09-legal-director-assign.html",
  "10-3v-17-legal-director-assign1.html",
  "10-3v-30-legal-director-assign2.html",
  "10-3v-38-legal-director-assign3.html",
];

console.log("ROUTES — ขั้นก่อนหน้าส่งตรงถึงผู้รับงานถัดไป");
t("10.2: ธุรการรับเรื่อง → 10-2-01 ผอ.กองกฎหมาย → 10-2-02 ผอ.กลุ่มงาน", () => {
  assert.equal(A2.stepByCode("LAW0037").statusCode, "L2_PENDING_DIRECTOR_ASSIGN");
  assert.equal(A2.ROUTES.L2_PENDING_DIRECTOR_ASSIGN, "10-2-01-legal-director-assign.html");
  assert.equal(A2.stepByCode("LAW0038").statusCode, "L2_PENDING_GROUP_ASSIGN");
  assert.equal(A2.ROUTES.L2_PENDING_GROUP_ASSIGN, "10-2-02-group-director-assign.html");
});
t("10.2: 10-2-33 ธุรการรับเรื่อง → 10-2-07 ฝ่ายเลขานุการฯ", () => {
  assert.equal(A2.stepByCode("L2-ADMIN-PRECOMMENT").statusCode, "L2_PENDING_SECRETARIAT_DRAFT");
  assert.equal(A2.ROUTES.L2_PENDING_SECRETARIAT_DRAFT, "10-2-07-secretariat-resolution-doc.html");
});
/* เรื่องเข้าใหม่ (ธุรการรับ) → ผอ.กองกฎหมาย มอบหมาย → ผอ.กลุ่มงานคดี */
const COURT_INTAKE = [
  ["LAW0085", "L3_PENDING_DIRECTOR_ASSIGN", "10-3-02-legal-director-assign.html", "LAW0088", "L3_PENDING_GROUP_ASSIGN", "10-3-03-group-director-assign.html"],
  ["LAW0119", "L3V_PENDING_DIRECTOR_ASSIGN", "10-3v-02-legal-director-assign.html", "LAW0121", "L3V_PENDING_GROUP_ASSIGN", "10-3v-03-group-director-assign.html"],
];
COURT_INTAKE.forEach(([code, status, page, dirCode, dirStatus, groupPage]) => {
  t(`10.3: ${code} → ${page} → ${groupPage}`, () => {
    const step = A3.stepByCode(code);
    assert.equal(step.statusCode, status);
    assert.equal(step.nextRole, "dir_legal");
    assert.equal(A3.ROUTES[status], page);
    const dir = A3.stepByCode(dirCode);
    assert.equal(dir.role, "dir_legal");
    assert.equal(dir.statusCode, dirStatus);
    assert.equal(dir.nextRole, "case_group_director");
    assert.equal(A3.ROUTES[dirStatus], groupPage);
  });
});
/* รับกลับจากกิจกรรม 7 / หนังสือศาลระหว่างสาย → ผอ.กลุ่มงานคดี โดยตรง */
const COURT = [
  ["LAW0131", "L7_PENDING_GROUP_ASSIGN", "10-3v-10-group-director-assign.html"],
  ["L9A_INTAKE", "L9A_PENDING_GROUP_APPROVE", "10-3v-31-group-director-assign2.html"],
  ["L9B_INTAKE", "L9B_PENDING_GROUP_ASSIGN1", "10-3v-39-group-director-assign3.html"],
];
COURT.forEach(([code, status, page]) => {
  t(`10.3: ${code} → ${page}`, () => {
    const step = A3.stepByCode(code);
    assert.ok(step, code);
    assert.equal(step.statusCode, status);
    assert.equal(step.nextRole, "case_group_director");
    assert.equal(A3.ROUTES[status], page);
  });
});
t("10.3v แพ้คดี: v06 → 10-3v-18 ตรง (ตัด 10-3v-16) + เคสค้างเก่า L8_PENDING_GROUP_ASSIGN1", () => {
  const b = A3.VERDICT_BRANCHES.APPEAL_CONSIDER;
  assert.equal(b.statusCode, "L3V_TO_APPEAL_CONSIDER");
  assert.equal(b.nextRole, "case_group_director");
  assert.equal(A3.ROUTES.L3V_TO_APPEAL_CONSIDER, "10-3v-18-group-director-assign1.html");
  assert.equal(A3.ROUTES.L8_PENDING_GROUP_ASSIGN1, "10-3v-18-group-director-assign1.html");
  assert.ok(!Object.values(A3.ROUTES).includes("10-3v-16-legal-admin-appeal-consider-intake.html"));
  assert.equal(A3.ROUTES.L8_PENDING_LAWYER_REGISTER, "10-3v-19-lawyer-register.html");
});
t("ส่งกลับ 1 ขั้นในสายคำพิพากษา: LAWYER → 10-3v-04, GROUP → 10-3v-05", () => {
  const sb = A3.VERDICT_SENDBACK;
  assert.equal(A3.ROUTES[sb.LAWYER.statusCode], "10-3v-04-lawyer-verdict-analysis.html");
  assert.equal(sb.LAWYER.assignedRole, "case_legal_officer");
  assert.equal(A3.ROUTES[sb.GROUP.statusCode], "10-3v-05-group-director-approve.html");
  assert.equal(sb.GROUP.assignedRole, "case_group_director");
});
t("ไม่มีหน้า ผอ.กองที่ตัดออกเหลือใน ROUTES ของ 10.2 / 10.3", () => {
  const pages = Object.values(A2.ROUTES).concat(Object.values(A3.ROUTES));
  REMOVED_PAGES.forEach((p) => assert.ok(!pages.includes(p), p));
});

console.log("advance() 10.3 — ผู้รับงานถัดไป");
t("ตัด 10-3-10/10-3-12 (2026-10-21): ไม่มีขั้น L3-19/L3-21 และไม่มีหน้าใน ROUTES", () => {
  assert.ok(!A3.stepByCode("L3-19"));
  assert.ok(!A3.stepByCode("L3-21"));
  const pages = Object.values(A3.ROUTES);
  assert.ok(!pages.includes("10-3-10-legal-admin-resolution-notice.html"));
  assert.ok(!pages.includes("10-3-12-group-director-approve-resolution.html"));
  assert.equal(A3.ANSWER_STEPS[0].code, "L3-22");
});
t("เคสค้างที่ขั้นที่ตัด → นิติกร 10-3-13 คง officer เดิม", () => {
  const { cases } = A.migrateRemovedDirectorSteps([
    { id: "g", statusCode: "L3_PENDING_GROUP_RESOLUTION_APPROVE", assignedRole: "case_group_director", officer: "นิติกร ก" },
  ]);
  assert.equal(cases[0].statusCode, "L3_PENDING_LAWYER_EXTENSION");
  assert.equal(cases[0].assignedRole, "case_legal_officer");
  assert.equal(cases[0].officer, "นิติกร ก");
  assert.equal("keepOfficer" in cases[0], false);
});
t("addCase ค่าเริ่มต้น (10.1) เข้า ผอ.กองกฎหมายก่อน", () => {
  const c = A.addCase({ title: "ทดสอบ 10.1" });
  assert.equal(c.statusCode, "PENDING_DIRECTOR");
  assert.equal(c.assignedRole, "dir_legal");
});
t("forwardToGroupDirector (หน้า 04) → PENDING_GROUP_DIRECTOR", () => {
  const c = A.addCase({ title: "ทดสอบ 04" });
  const after = A.forwardToGroupDirector(c.id, null, "ข้อสั่งการ");
  assert.equal(after.statusCode, "PENDING_GROUP_DIRECTOR");
  assert.equal(after.assignedRole, "group_director");
  assert.equal(after.directorNotes, "ข้อสั่งการ");
});
t("submitLegalAdminResolutionIntake (10.1) → PENDING_GROUP_RESOLUTION", () => {
  const c = A.addCase({ title: "ทดสอบมติ" });
  const after = A.submitLegalAdminResolutionIntake(c.id, "หมายเหตุ");
  assert.equal(after.statusCode, "PENDING_GROUP_RESOLUTION");
  assert.equal(after.assignedRole, "group_director");
});

console.log("ผอ.กองมอบหมายนิติกรโดยตรง (ข้ามขั้น ผอ.กลุ่มงานมอบหมาย) — 2026-10-21");
t("10.1 assignLegalOfficerByDirector → DRAFTING_OPINION ที่นิติกร (ข้ามหน้า 05)", () => {
  const c = A.addCase({ title: "ทดสอบมอบตรง 10.1" });
  const after = A.assignLegalOfficerByDirector(c.id, "นิติกร ก", "ข้อสั่งการ ผอ.กอง", "2026-11-30");
  assert.equal(after.statusCode, "DRAFTING_OPINION");
  assert.equal(after.assignedRole, "legal_officer");
  assert.equal(after.officer, "นิติกร ก");
  assert.equal(after.directAssignedByDirector, true);
  assert.equal(after.directorNotes, "ข้อสั่งการ ผอ.กอง");
  assert.equal(after.officerDeadline, "2026-11-30");
  assert.equal(after.groupDirectorNotes, undefined, "ไม่มีข้อสั่งการ ผอ.กลุ่มงาน");
});
[
  ["10.3", "L3_PENDING_DIRECTOR_ASSIGN", "LAW0088", "LAW0089", "L3_PENDING_LAWYER_REVIEW", "10-3-04-lawyer-review-complaint.html", {}],
  ["10.3v", "L3V_PENDING_DIRECTOR_ASSIGN", "LAW0121", "LAW0122", "L3V_PENDING_LAWYER_ANALYSIS", "10-3v-04-lawyer-verdict-analysis.html", { l3CaseType: "verdict" }],
].forEach(([flow, start, dirCode, groupCode, lawyerStatus, lawyerPage, extra]) => {
  t(`${flow} assignLawyerDirect → ${lawyerPage} และจดขั้น ${groupCode} ที่ข้าม`, () => {
    const c = A.addCase(Object.assign({ title: "ทดสอบมอบตรง " + flow, category: "10.3", statusCode: start }, extra));
    const after = A3.assignLawyerDirect(
      c.id, dirCode, groupCode,
      { l3DirectorOrderNotes: "สั่งการ", l3DirectorAssignTarget: "นิติกร ข" },
      { name: "นิติกร ข", date: "2026-10-21" },
    );
    assert.equal(after.statusCode, lawyerStatus);
    assert.equal(A3.ROUTES[after.statusCode], lawyerPage);
    assert.equal(after.assignedRole, "case_legal_officer");
    assert.equal(after.officer, "นิติกร ข");
    assert.equal(after.l3GroupAssignTarget, "นิติกร ข", "ขั้นหลังอ่านชื่อนิติกรจากช่องนี้");
    assert.equal(after.l3DirectorOrderNotes, "สั่งการ");
    assert.deepEqual(after.l3SkippedSteps, [groupCode]);
    assert.equal(after.l3DirectAssignLawyer, true);
  });
});
t("assignLawyerDirect ไม่มีชื่อนิติกร → ไม่เปลี่ยนเคส", () => {
  const c = A.addCase({ title: "ทดสอบไม่มีชื่อ", category: "10.3", statusCode: "L3_PENDING_DIRECTOR_ASSIGN" });
  assert.equal(A3.assignLawyerDirect(c.id, "LAW0088", "LAW0089", {}, { name: "" }), null);
  assert.equal(A.getCaseById(c.id).statusCode, "L3_PENDING_DIRECTOR_ASSIGN");
});

console.log("ส่งกลับจากการ์ดผลการพิจารณา (ecmis-review-decision.js) — 2026-10-21");
t("sendBackPatch เก็บผู้ส่งกลับ เหตุผล และสถานะปลายทาง", () => {
  const p = A.sendBackPatch("ผอ.กองกฎหมาย", "แก้ย่อหน้า 2", "L2_PENDING_DENY_MEMO");
  assert.equal(p.lastSendBack.by, "ผอ.กองกฎหมาย");
  assert.equal(p.lastSendBack.reason, "แก้ย่อหน้า 2");
  assert.equal(p.lastSendBack.toStatusCode, "L2_PENDING_DENY_MEMO");
  assert.ok(p.lastSendBack.at);
});
[
  [A2, "L2_PENDING_SECRETARIAT_DRAFT", "10-2-07-secretariat-resolution-doc.html"],
  [A2, "L2_PENDING_NOTICE_GROUPDIR_REVIEW", "10-2-37-group-director-notice-review.html"],
  [A2, "L2_PENDING_DENY_MEMO", "10-2-15-secretariat-deny-memo.html"],
  [A2, "L2_PENDING_CLOSE_MEMO", "10-2-22-secretariat-close-memo.html"],
  [A2, "L2_PENDING_NOTICE_DRAFT", "10-2-11-secretariat-disclose-partial-notice-draft.html"],
  [A3, "L3_PENDING_GROUP_APPROVE", "10-3-07-group-director-approve.html"],
  [A3, "L8_PENDING_LAWYER_REGISTER", "10-3v-19-lawyer-register.html"],
].forEach(([api, code, page]) => {
  t(`ส่งกลับ → ${code} เปิดหน้า ${page}`, () => assert.equal(api.ROUTES[code], page));
});

console.log("migrateRemovedDirectorSteps — เคสค้างที่สถานะเดิม");
t("ย้ายทุกสถานะเดิมไปสถานะใหม่ ไม่แก้ object เดิม", () => {
  const input = [
    { id: "a", statusCode: "PENDING_DIRECTOR_RESOLUTION_ORDER", assignedRole: "dir_legal" },
    { id: "b", statusCode: "PENDING_DIRECTOR_RESOLUTION", assignedRole: "dir_legal" },
    { id: "c", statusCode: "L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN", assignedRole: "dir_legal" },
    { id: "d", statusCode: "L2_PENDING_DIRLEGAL_PRECOMMENT", assignedRole: "dir_legal" },
    { id: "e", statusCode: "L7_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
    { id: "f", statusCode: "PENDING_DIRECTOR_APPROVAL", assignedRole: "dir_legal" },
    { id: "g", statusCode: "PENDING_DIRECTOR", assignedRole: "dir_legal" },
    { id: "h", statusCode: "L2_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
    { id: "i", statusCode: "L3_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
    { id: "j", statusCode: "L3V_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
  ];
  const { cases, changed } = A.migrateRemovedDirectorSteps(input);
  assert.equal(changed, true);
  const by = Object.fromEntries(cases.map((c) => [c.id, c]));
  assert.equal(by.a.statusCode, "PENDING_GROUP_RESOLUTION");
  assert.equal(by.a.assignedRole, "group_director");
  assert.equal(by.b.statusCode, "PENDING_GROUP_RESOLUTION");
  assert.equal(by.c.statusCode, "L3_PENDING_LAWYER_EXTENSION");
  assert.equal(by.d.statusCode, "L2_PENDING_SECRETARIAT_DRAFT");
  assert.equal(by.d.assignedRole, "sub_secretariat");
  assert.equal(by.e.statusCode, "L7_PENDING_GROUP_ASSIGN");
  assert.equal(by.e.assignedRole, "case_group_director");
  assert.equal(by.f.statusCode, "PENDING_DIRECTOR_APPROVAL", "ขั้น ผอ.กองตรวจ/ลงนามยังอยู่");
  ["g", "h", "i", "j"].forEach((id) =>
    assert.equal(by[id].statusCode, input.find((c) => c.id === id).statusCode, "ขั้นเรื่องเข้าใหม่ที่นำกลับมาไม่ถูกย้าย " + id),
  );
  assert.equal(input[0].statusCode, "PENDING_DIRECTOR_RESOLUTION_ORDER", "ไม่แก้ object เดิม");
});
t("ข้อมูลตั้งต้นไม่มีเคสค้างที่สถานะของขั้นที่ตัดออก", () => {
  const OLD = /^(PENDING_DIRECTOR_RESOLUTION(_ORDER)?|L2_PENDING_DIRLEGAL_PRECOMMENT|L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN|L7_PENDING_DIRECTOR_ASSIGN|L8_PENDING_DIRECTOR_ASSIGN1|L9A_PENDING_DIRECTOR_ASSIGN|L9B_PENDING_DIRECTOR_ASSIGN1)$/;
  A.getCases().forEach((c) => assert.ok(!OLD.test(c.statusCode), c.id + " " + c.statusCode));
});

console.log(`\n${passed} passed`);
