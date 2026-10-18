/* หน่วยทดสอบ TOR 10 — P11 (แก้ผลรีวิว C1–C8)
   - Activity10.unitsEqual / normalizeUnit  เทียบหน่วยงานแบบ สนง. = สำนักงาน (C6)
   - Activity102.canView102                  district_admin ตรงหน่วยแม้เขียนต่างรูป (C6)
   - Activity102.stepSeqOfCase               หาลำดับขั้นจาก statusCode เมื่อไม่มี l2StepSeq (C7)
   - seed คดีปกครอง-100311/100312 มี l8VerdictIssues (C2)
   Run: node activity10/tests/tor10-p11.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  key: (i) => Object.keys(store)[i] || null,
  get length() { return Object.keys(store).length; },
};
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-10-2.js"))(sandbox);
const { Activity10: A, Activity102: A2 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\nunit matching (C6)");
t("สนง. = สำนักงาน", () => {
  assert.equal(A.unitsEqual("สนง. ป.ป.ท. เขต 4", "สำนักงาน ป.ป.ท. เขต 4"), true);
});
t("ไม่สนใจเว้นวรรค/วงเล็บ", () => {
  assert.equal(A.unitsEqual("สำนักงาน ป.ป.ท.เขต4 (ขอนแก่น)", "สนง. ป.ป.ท. เขต 4"), true);
});
t("เขต 4 ไม่เท่ากับ เขต 41", () => {
  assert.equal(A.unitsEqual("สนง. ป.ป.ท. เขต 4", "สำนักงาน ป.ป.ท. เขต 41"), false);
});
t("ค่าว่างไม่เท่ากัน", () => {
  assert.equal(A.unitsEqual("", ""), false);
});
t("canView102: district_admin org แบบย่อ เห็นสำนวนที่ sourceUnit แบบเต็ม", () => {
  const k = { category: "10.2.1", sourceUnit: "สำนักงาน ป.ป.ท. เขต 4", assignedRole: "dir_legal", l2StepSeq: 10 };
  assert.equal(A2.canView102(k, "district_admin", "สนง. ป.ป.ท. เขต 4"), true);
  assert.equal(A2.canView102(k, "district_admin", "สนง. ป.ป.ท. เขต 5"), false);
});

console.log("\nActivity102.stepSeqOfCase (C7)");
const firstOf = (role) => Math.min(...A2.STEPS.filter((s) => s.role === role).map((s) => s.seq));
t("มี l2StepSeq อยู่แล้ว → ใช้ค่านั้น", () => {
  assert.equal(A2.stepSeqOfCase({ l2StepSeq: 17, statusCode: "L2_PENDING_SECGEN_OPINION" }), 17);
});
t("ไม่มี l2StepSeq → หาจาก statusCode (ขั้นที่ผลิต/ขั้นที่ค้างตาม ROUTES)", () => {
  const secgen = A2.STEPS.find((s) => s.role === "secgen");
  assert.equal(A2.stepSeqOfCase({ statusCode: "L2_PENDING_SECGEN_OPINION" }), secgen.seq);
  const deputy = A2.STEPS.find((s) => s.role === "deputy_sg");
  assert.equal(A2.stepSeqOfCase({ statusCode: "L2_PENDING_DEPUTY_SG_OPINION" }), deputy.seq);
});
t("statusCode ไม่รู้จัก → null", () => {
  assert.equal(A2.stepSeqOfCase({ statusCode: "NOPE" }), null);
});
t("deputy_sg เห็นสำนวนที่รอความเห็นรองเลขาธิการ", () => {
  assert.equal(A2.canView102({ category: "10.2.1", statusCode: "L2_PENDING_DEPUTY_SG_OPINION" }, "deputy_sg", ""), true);
});
t("secgen เห็นสำนวน seed (ไม่มี l2StepSeq) ที่เดินถึงขั้นตน", () => {
  const k = { category: "10.2.1", statusCode: "L2_PENDING_SECGEN_OPINION" };
  assert.ok(A2.stepSeqOfCase(k) >= firstOf("secgen"));
  assert.equal(A2.canView102(k, "secgen", ""), true);
});
t("secgen ไม่เห็นสำนวน seed ที่ยังไม่ถึงขั้นตน", () => {
  const k = { category: "10.2.1", statusCode: "L2_PENDING_DIRECTOR_ASSIGN" };
  assert.equal(A2.canView102(k, "secgen", ""), false);
});
t("seed 10.2 ที่ไม่มีทั้ง l2StepSeq และ assignedRole หา seq ได้ (หรือเป็นสายอื่นที่ไม่ใช่ STEPS)", () => {
  const rows = A.getCases();
  const bad = rows.filter(
    (c) => String(c.category || "").indexOf("10.2") === 0 && typeof c.l2StepSeq !== "number" && !c.assignedRole && A2.stepSeqOfCase(c) === null,
  );
  assert.deepEqual(bad.map((c) => c.id), []);
});

console.log("\nseed l8VerdictIssues (C2)");
t("คดีปกครอง-100311/100312 มี l8VerdictIssues = l3VerdictIssues", () => {
  const all = A.getCases();
  for (const id of ["คดีปกครอง-100311/2569", "คดีปกครอง-100312/2569"]) {
    const c = all.find((x) => x.id === id);
    assert.ok(c, id + " missing");
    assert.ok(c.l3VerdictIssues);
    assert.equal(c.l8VerdictIssues, c.l3VerdictIssues);
  }
});

console.log("\n" + passed + " passed");
