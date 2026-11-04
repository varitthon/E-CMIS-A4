/* หน่วยทดสอบ — ลงนามจริง (หมึก) เอกสารส่งออกภายนอก 10.3 (2026-10-15)
   ดู docs/wet-sign/plan.md
   - สายคำให้การ: 3-18/3-19 เป็นธุรการบันทึกผล, 3-21 รวมเข้า 3-22
   - สายคัดค้านทุเลา (แบบ B): 3b-01 → 3b-01a ผอ.กลุ่มงาน → 3b-01b ผอ.กอง → 3b-03 นิติกรแนบฉบับลงนามจริง (ตัด 3b-02 ธุรการ 2026-10-22)
   - เคสค้างรอผู้บริหารย้ายเป็นธุรการตอนโหลด
   Run: node activity10/tests/wet-sign.test.mjs */
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
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(
  sandbox,
  sandbox.Activity10,
);
const { Activity10: A, Activity103: A3 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("สายคำให้การ — ธุรการบันทึกผลการลงนามจริง");
t("2026-10-22 ไม่มี 3-18 / 3-19 / 3-22 — 3-17 (ธุรการ) ส่งนิติกรรวบรวมเอกสาร 3-23 ตรง", () => {
  const removed = ["10-3-18-secgen-sign-cover-letter.html", "10-3-19-deputy-sg-sign-cover-letter.html", "10-3-22-legal-admin-collect-originals.html", "10-3-21-chairman-sign-answer.html"];
  removed.forEach((page) => {
    assert.ok(!A3.ANSWER_STEPS.some((s) => s.page === page), page);
    assert.ok(!Object.values(A3.ROUTES).includes(page), page);
  });
  const s = A3.ANSWER_STEPS.find((x) => x.code === "L3-26");
  assert.equal(s.role, "admin_legal");
  assert.equal(s.statusCode, "L3_PENDING_LAWYER_COLLECT_DOCS");
  assert.equal(A3.ROUTES[s.statusCode], "10-3-23-lawyer-collect-documents.html");
});
t("ประธาน/รองเลขาธิการไม่ใช่ผู้ทำงานในระบบของสายคำให้การ/คัดค้านทุเลา (เลขาธิการตรวจที่ 3b-02a ได้ — 2026-11-03 sheet D)", () => {
  const exec = ["chairman", "deputy_sg"];
  A3.ANSWER_STEPS.concat(A3.STAY_STEPS, A3.COURT_ORDER_STEPS).forEach((s) =>
    assert.ok(!exec.includes(s.role), s.code + " " + s.role),
  );
  assert.ok(!A3.ANSWER_STEPS.some((s) => s.role === "secgen"));
  assert.deepEqual(A3.STAY_STEPS.filter((s) => s.role === "secgen").map((s) => s.code), ["LAW0097D"]);
});

console.log("สายคัดค้านทุเลา (แบบ B)");
t("3b-01 → 01a → 01b → 02 (ธุรการออกเลข) → 02a (เลขาธิการ) → 03 (นิติกรแนบฉบับลงนามจริง)", () => {
  const pages = A3.STAY_STEPS.map((s) => s.page);
  assert.deepEqual(pages, [
    "10-3b-01-lawyer-draft-stay-objection.html",
    "10-3b-01a-group-director-review-stay-objection.html",
    "10-3b-01b-legal-director-review-stay-objection.html",
    "10-3b-02-legal-admin-number-stay-objection.html",
    "10-3b-02a-secgen-review-stay-objection.html",
    "10-3b-03-lawyer-dispatch-stay-objection.html",
  ]);
  assert.equal(A3.ROUTES.L3B_PENDING_LAWYER_DRAFT, pages[0]);
  assert.equal(A3.ROUTES.L3B_PENDING_GROUP_REVIEW, pages[1]);
  assert.equal(A3.ROUTES.L3B_PENDING_DIRECTOR_REVIEW, pages[2]);
  assert.equal(A3.ROUTES.L3B_PENDING_ADMIN_NUMBER, pages[3]);
  assert.equal(A3.ROUTES.L3B_PENDING_SECGEN_REVIEW, pages[4]);
  assert.equal(A3.ROUTES.L3B_PENDING_LAWYER_DISPATCH, pages[5]);
  assert.equal(A3.STAY_STEPS[2].nextRole, "admin_legal");
  assert.equal(A3.STAY_STEPS[3].role, "admin_legal");
  assert.equal(A3.STAY_STEPS[3].nextRole, "secgen");
  assert.equal(A3.STAY_STEPS[4].role, "secgen");
  assert.equal(A3.STAY_STEPS[4].nextRole, "case_legal_officer");
  assert.equal(A3.STAY_STEPS[5].statusCode, "L3B_CLOSED");
  assert.ok(!A3.stepByCode("LAW0098"), "ตัด LAW0098 (3b-02 เดิม ธุรการบันทึกผลลงนามจริง) แล้ว");
});
t("ส่งกลับ 1 ขั้น: LAWYER → 3b-01, GROUP → 3b-01a, DIRECTOR → 3b-01b", () => {
  const sb = A3.STAY_SENDBACK;
  assert.equal(A3.ROUTES[sb.LAWYER.statusCode], "10-3b-01-lawyer-draft-stay-objection.html");
  assert.equal(sb.LAWYER.assignedRole, "case_legal_officer");
  assert.equal(A3.ROUTES[sb.GROUP.statusCode], "10-3b-01a-group-director-review-stay-objection.html");
  assert.equal(sb.GROUP.assignedRole, "case_group_director");
  assert.equal(A3.ROUTES[sb.DIRECTOR.statusCode], "10-3b-01b-legal-director-review-stay-objection.html");
  assert.equal(sb.DIRECTOR.assignedRole, "dir_legal");
});
t("อุทธรณ์คำสั่งทุเลา: 3b-04 (ธุรการ) → 05 → 06 → 07 → 08 จบที่ L3B2_APPEAL_FILED", () => {
  const steps = A3.COURT_ORDER_STEPS;
  assert.deepEqual(steps.map((s) => s.page), [
    "10-3b-04-legal-admin-court-order-intake.html",
    "10-3b-05-lawyer-draft-stay-appeal.html",
    "10-3b-06-group-director-review-stay-appeal.html",
    "10-3b-07-legal-director-sign-stay-appeal.html",
    "10-3b-08-lawyer-file-stay-appeal.html",
  ]);
  assert.deepEqual(steps.map((s) => s.role), ["admin_legal", "case_legal_officer", "case_group_director", "dir_legal", "case_legal_officer"]);
  assert.equal(A3.ROUTES.L3B_CLOSED, steps[0].page);
  assert.equal(A3.COURT_ORDER_BRANCHES.GRANTED.statusCode, "L3B2_PENDING_APPEAL_DRAFT");
  assert.equal(A3.COURT_ORDER_BRANCHES.GRANTED.assignedRole, "case_legal_officer");
  assert.equal(A3.COURT_ORDER_BRANCHES.DENIED.statusCode, "L3B2_CLOSED");
  assert.equal(A3.ROUTES.L3B2_PENDING_APPEAL_DRAFT, steps[1].page);
  assert.equal(A3.ROUTES.L3B2_PENDING_GROUP_REVIEW, steps[2].page);
  assert.equal(A3.ROUTES.L3B2_PENDING_DIRECTOR_SIGN, steps[3].page);
  assert.equal(A3.ROUTES.L3B2_PENDING_LAWYER_FILE, steps[4].page);
  assert.equal(A3.ROUTES.L3B2_APPEAL_FILED, undefined);
  assert.equal(A3.ROUTES.L3B2_CLOSED, undefined);
  const sb = A3.COURT_ORDER_SENDBACK;
  assert.equal(A3.ROUTES[sb.LAWYER.statusCode], steps[1].page);
  assert.equal(A3.ROUTES[sb.GROUP.statusCode], steps[2].page);
});

console.log("advance — ไม่ทับชื่อนิติกรเจ้าของสำนวน");
t("3-13 (L3-22) ส่ง ผอ.กลุ่มงานตรวจร่าง แต่ officer ยังเป็นนิติกร", () => {
  const lawyer = "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)";
  const c = A.addCase({ title: "ทดสอบ", category: "10.3", officer: lawyer });
  const after = A3.advance(c.id, "L3-22", {});
  assert.equal(after.officer, lawyer);
});

console.log("ย้ายเคสค้างรอผู้บริหาร");
t("ค้างรอบันทึกผลลงนาม/รวบรวมฉบับจริง (3-18/19/22 เดิม) → นิติกร 3-23, คัดค้านทุเลา → นิติกร 3b-03", () => {
  const { cases, changed } = A.migrateRemovedDirectorSteps([
    { id: "a", statusCode: "L3_PENDING_SECGEN_COVER_SIGN", assignedRole: "secgen", officer: "x" },
    { id: "b", statusCode: "L3_PENDING_CHAIRMAN_ANSWER_SIGN", assignedRole: "chairman" },
    { id: "c", statusCode: "L3B_PENDING_CHAIRMAN_SIGN", assignedRole: "chairman" },
    { id: "d", statusCode: "L3_PENDING_ADMIN_COLLECT_ORIGINALS", assignedRole: "admin_legal" },
    { id: "e", statusCode: "L3_PENDING_DEPUTY_SG_COVER_SIGN", assignedRole: "admin_legal" },
  ]);
  assert.equal(changed, true);
  const by = Object.fromEntries(cases.map((c) => [c.id, c]));
  ["a", "b", "d", "e"].forEach((k) => {
    assert.equal(by[k].statusCode, "L3_PENDING_LAWYER_COLLECT_DOCS", k);
    assert.equal(by[k].assignedRole, "case_legal_officer", k);
  });
  assert.equal(A3.ROUTES.L3_PENDING_LAWYER_COLLECT_DOCS, "10-3-23-lawyer-collect-documents.html");
  assert.equal(by.c.statusCode, "L3B_PENDING_LAWYER_DISPATCH");
  assert.equal(by.c.assignedRole, "case_legal_officer");
  assert.equal(by.a.officer, "x", "คง officer เดิม");
});

console.log(`\n${passed} passed`);
