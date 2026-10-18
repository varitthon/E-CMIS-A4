/* หน่วยทดสอบ — ลงนามจริง (หมึก) เอกสารส่งออกภายนอก 10.3 (2026-10-15)
   ดู docs/wet-sign/plan.md
   - สายคำให้การ: 3-18/3-19 เป็นธุรการบันทึกผล, 3-21 รวมเข้า 3-22
   - สายคัดค้านทุเลา (แบบ B): 3b-01 → 3b-01a ผอ.กลุ่มงาน → 3b-01b ผอ.กอง → 3b-02 ธุรการ
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
t("3-18 / 3-19 เป็นธุรการ และไปหน้ารวม 3-22 ตรง (ไม่มี 3-21)", () => {
  ["L3-27A", "L3-27B"].forEach((code) => {
    const s = A3.ANSWER_STEPS.find((x) => x.code === code);
    assert.equal(s.role, "admin_legal", code);
    assert.equal(A3.ROUTES[s.statusCode], "10-3-22-legal-admin-collect-originals.html", code);
  });
  assert.ok(!A3.ANSWER_STEPS.some((s) => s.page === "10-3-21-chairman-sign-answer.html"));
  assert.ok(!Object.values(A3.ROUTES).includes("10-3-21-chairman-sign-answer.html"));
});
t("ผู้บริหารไม่ใช่ผู้ทำงานในระบบของสายคำให้การ/คัดค้านทุเลาอีกต่อไป", () => {
  const exec = ["chairman", "secgen", "deputy_sg"];
  A3.ANSWER_STEPS.concat(A3.STAY_STEPS).forEach((s) =>
    assert.ok(!exec.includes(s.role), s.code + " " + s.role),
  );
});

console.log("สายคัดค้านทุเลา (แบบ B)");
t("3b-01 → 3b-01a → 3b-01b → 3b-02 (ธุรการ) → 3b-03", () => {
  const pages = A3.STAY_STEPS.map((s) => s.page);
  assert.deepEqual(pages, [
    "10-3b-01-lawyer-draft-stay-objection.html",
    "10-3b-01a-group-director-review-stay-objection.html",
    "10-3b-01b-legal-director-review-stay-objection.html",
    "10-3b-02-chairman-sign-stay-objection.html",
    "10-3b-03-lawyer-dispatch-stay-objection.html",
  ]);
  assert.equal(A3.ROUTES.L3B_PENDING_LAWYER_DRAFT, pages[0]);
  assert.equal(A3.ROUTES.L3B_PENDING_GROUP_REVIEW, pages[1]);
  assert.equal(A3.ROUTES.L3B_PENDING_DIRECTOR_REVIEW, pages[2]);
  assert.equal(A3.ROUTES.L3B_PENDING_CHAIRMAN_SIGN, pages[3]);
  assert.equal(A3.STAY_STEPS[3].role, "admin_legal");
});
t("ส่งกลับ 1 ขั้น: LAWYER → 3b-01, GROUP → 3b-01a", () => {
  const sb = A3.STAY_SENDBACK;
  assert.equal(A3.ROUTES[sb.LAWYER.statusCode], "10-3b-01-lawyer-draft-stay-objection.html");
  assert.equal(sb.LAWYER.assignedRole, "case_legal_officer");
  assert.equal(A3.ROUTES[sb.GROUP.statusCode], "10-3b-01a-group-director-review-stay-objection.html");
  assert.equal(sb.GROUP.assignedRole, "case_group_director");
});

console.log("advance — ไม่ทับชื่อนิติกรเจ้าของสำนวน");
t("3-10 (L3-19) เปลี่ยนผู้รับงานเป็น ผอ.กลุ่มงาน แต่ officer ยังเป็นนิติกร", () => {
  const lawyer = "นายกิตติศักดิ์ แสงทอง (นิติกร กลุ่มงานคดี)";
  const c = A.addCase({ title: "ทดสอบ", category: "10.3", officer: lawyer });
  const after = A3.advance(c.id, "L3-19", {});
  assert.equal(after.assignedRole, "case_group_director");
  assert.equal(after.officer, lawyer);
});

console.log("ย้ายเคสค้างรอผู้บริหาร");
t("รอผู้บริหารลงนาม → ธุรการ, รวบรวมฉบับจริงเดิม → หน้ารวม", () => {
  const { cases, changed } = A.migrateRemovedDirectorSteps([
    { id: "a", statusCode: "L3_PENDING_SECGEN_COVER_SIGN", assignedRole: "secgen", officer: "x" },
    { id: "b", statusCode: "L3_PENDING_CHAIRMAN_ANSWER_SIGN", assignedRole: "chairman" },
    { id: "c", statusCode: "L3B_PENDING_CHAIRMAN_SIGN", assignedRole: "chairman" },
    { id: "d", statusCode: "L3_PENDING_ADMIN_COLLECT_ORIGINALS", assignedRole: "admin_legal" },
    { id: "e", statusCode: "L3_PENDING_DEPUTY_SG_COVER_SIGN", assignedRole: "admin_legal" },
  ]);
  assert.equal(changed, true);
  const by = Object.fromEntries(cases.map((c) => [c.id, c]));
  ["a", "b", "c", "d", "e"].forEach((k) => assert.equal(by[k].assignedRole, "admin_legal", k));
  assert.equal(by.a.officer, "x", "คง officer เดิม");
  assert.equal(by.d.statusCode, "L3_PENDING_CHAIRMAN_ANSWER_SIGN");
  assert.equal(A3.ROUTES[by.d.statusCode], "10-3-22-legal-admin-collect-originals.html");
});

console.log(`\n${passed} passed`);
