/* หน่วยทดสอบ — ตัดขั้น ผอ.กองกฎหมายมอบหมาย/สั่งการ 11 ขั้น (2026-10-14)
   ดู docs/remove-dir-legal-assign/plan.md
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
  "04-legal-director-review.html",
  "11-legal-director-resolution.html",
  "10-2-01-legal-director-assign.html",
  "10-2-34-legal-director-comment.html",
  "10-3-02-legal-director-assign.html",
  "10-3-11-legal-director-assign-resolution.html",
  "10-3v-02-legal-director-assign.html",
  "10-3v-09-legal-director-assign.html",
  "10-3v-17-legal-director-assign1.html",
  "10-3v-30-legal-director-assign2.html",
  "10-3v-38-legal-director-assign3.html",
];

console.log("ROUTES — ขั้นก่อนหน้าส่งตรงถึงผู้รับงานถัดไป");
t("10.2: ธุรการรับเรื่อง → 10-2-02 ผอ.กลุ่มงาน", () => {
  assert.equal(A2.stepByCode("LAW0037").statusCode, "L2_PENDING_GROUP_ASSIGN");
  assert.equal(A2.ROUTES.L2_PENDING_GROUP_ASSIGN, "10-2-02-group-director-assign.html");
});
t("10.2: 10-2-33 ธุรการรับเรื่อง → 10-2-07 ฝ่ายเลขานุการฯ", () => {
  assert.equal(A2.stepByCode("L2-ADMIN-PRECOMMENT").statusCode, "L2_PENDING_SECRETARIAT_DRAFT");
  assert.equal(A2.ROUTES.L2_PENDING_SECRETARIAT_DRAFT, "10-2-07-secretariat-resolution-doc.html");
});
const COURT = [
  ["LAW0085", "L3_PENDING_GROUP_ASSIGN", "10-3-03-group-director-assign.html"],
  ["L3-19", "L3_PENDING_GROUP_RESOLUTION_APPROVE", "10-3-12-group-director-approve-resolution.html"],
  ["LAW0119", "L3V_PENDING_GROUP_ASSIGN", "10-3v-03-group-director-assign.html"],
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
t("advance(L3-19) ตั้ง assignedRole = case_group_director", () => {
  const c = A.addCase({ title: "ทดสอบ", category: "10.3", statusCode: "L3_PENDING_RESOLUTION_NOTICE" });
  const after = A3.advance(c.id, "L3-19", { l3ResolutionNoticeDocNo: "x" });
  assert.equal(after.statusCode, "L3_PENDING_GROUP_RESOLUTION_APPROVE");
  assert.equal(after.assignedRole, "case_group_director");
});
t("addCase ค่าเริ่มต้น (10.1) เข้า ผอ.กลุ่มงานตรง", () => {
  const c = A.addCase({ title: "ทดสอบ 10.1" });
  assert.equal(c.statusCode, "PENDING_GROUP_DIRECTOR");
  assert.equal(c.assignedRole, "group_director");
});
t("submitLegalAdminResolutionIntake (10.1) → PENDING_GROUP_RESOLUTION", () => {
  const c = A.addCase({ title: "ทดสอบมติ" });
  const after = A.submitLegalAdminResolutionIntake(c.id, "หมายเหตุ");
  assert.equal(after.statusCode, "PENDING_GROUP_RESOLUTION");
  assert.equal(after.assignedRole, "group_director");
});

console.log("migrateRemovedDirectorSteps — เคสค้างที่สถานะเดิม");
t("ย้ายทุกสถานะเดิมไปสถานะใหม่ ไม่แก้ object เดิม", () => {
  const input = [
    { id: "a", statusCode: "PENDING_DIRECTOR", assignedRole: "dir_legal" },
    { id: "b", statusCode: "PENDING_DIRECTOR_RESOLUTION", assignedRole: "dir_legal" },
    { id: "c", statusCode: "L2_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
    { id: "d", statusCode: "L2_PENDING_DIRLEGAL_PRECOMMENT", assignedRole: "dir_legal" },
    { id: "e", statusCode: "L7_PENDING_DIRECTOR_ASSIGN", assignedRole: "dir_legal" },
    { id: "f", statusCode: "PENDING_DIRECTOR_APPROVAL", assignedRole: "dir_legal" },
  ];
  const { cases, changed } = A.migrateRemovedDirectorSteps(input);
  assert.equal(changed, true);
  const by = Object.fromEntries(cases.map((c) => [c.id, c]));
  assert.equal(by.a.statusCode, "PENDING_GROUP_DIRECTOR");
  assert.equal(by.a.assignedRole, "group_director");
  assert.equal(by.b.statusCode, "PENDING_GROUP_RESOLUTION");
  assert.equal(by.c.statusCode, "L2_PENDING_GROUP_ASSIGN");
  assert.equal(by.d.statusCode, "L2_PENDING_SECRETARIAT_DRAFT");
  assert.equal(by.d.assignedRole, "sub_secretariat");
  assert.equal(by.e.statusCode, "L7_PENDING_GROUP_ASSIGN");
  assert.equal(by.e.assignedRole, "case_group_director");
  assert.equal(by.f.statusCode, "PENDING_DIRECTOR_APPROVAL", "ขั้น ผอ.กองตรวจ/ลงนามยังอยู่");
  assert.equal(input[0].statusCode, "PENDING_DIRECTOR", "ไม่แก้ object เดิม");
});
t("ข้อมูลตั้งต้นไม่มีเคสค้างที่สถานะของขั้นที่ตัดออก", () => {
  const OLD = /^(PENDING_DIRECTOR|PENDING_DIRECTOR_RESOLUTION(_ORDER)?|L2_PENDING_DIRECTOR_ASSIGN|L2_PENDING_DIRLEGAL_PRECOMMENT|L3V?_PENDING_DIRECTOR(_RESOLUTION)?_ASSIGN|L7_PENDING_DIRECTOR_ASSIGN|L8_PENDING_DIRECTOR_ASSIGN1|L9A_PENDING_DIRECTOR_ASSIGN|L9B_PENDING_DIRECTOR_ASSIGN1)$/;
  A.getCases().forEach((c) => assert.ok(!OLD.test(c.statusCode), c.id + " " + c.statusCode));
});

console.log(`\n${passed} passed`);
