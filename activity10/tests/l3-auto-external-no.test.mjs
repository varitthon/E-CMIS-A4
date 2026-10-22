/* หน่วยทดสอบ 10.3 — ตัดขั้นสารบรรณกลาง (L3-28 / 10-3-20) ออก และออกเลขหนังสือส่งออกอัตโนมัติ
   - ANSWER_STEPS ไม่มี L3-28 / บทบาท registry อีกต่อไป
   - 2026-10-22 ไม่มีขั้นบันทึกผลลงนาม (L3-27A/B, L3-30) — ธุรการ 10-3-17 (L3-26) ออกเลขส่งออกแล้วส่งนิติกร 10-3-23
   - ระบบออกเลขที่หนังสือส่งออก "ปป 0003/NNNN" + ลงวันที่ + ชั้นความเร็ว "ด่วนที่สุด" ให้เอง
   - สำนวนที่มีเลขส่งออกอยู่แล้ว → ไม่ออกเลขใหม่ทับ
   Run: node activity10/tests/l3-auto-external-no.test.mjs */
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
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(sandbox, sandbox.Activity10);
const { Activity10: A, Activity103: A3 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};
const courtCase = () => A.getCases().find((c) => A3.isCourtCase(c));

console.log("ขั้นตอนคำให้การ (ANSWER_STEPS)");
t("ไม่มีขั้นสารบรรณกลาง L3-28 / บทบาท registry / หน้า 10-3-20", () => {
  const steps = A3.ANSWER_STEPS;
  assert.equal(steps.some((s) => s.code === "L3-28"), false);
  assert.equal(steps.some((s) => s.role === "registry"), false);
  assert.equal(steps.some((s) => /10-3-20/.test(s.page || "")), false);
});
t("ไม่มีขั้นบันทึกผลลงนาม L3-27A / L3-27B / L3-30 — L3-26 ส่งนิติกรรวบรวมเอกสาร", () => {
  ["L3-27A", "L3-27B", "L3-30"].forEach((code) => assert.ok(!A3.ANSWER_STEPS.some((x) => x.code === code), code));
  const s = A3.ANSWER_STEPS.find((x) => x.code === "L3-26");
  assert.equal(s.statusCode, "L3_PENDING_LAWYER_COLLECT_DOCS");
  assert.equal(s.role, "admin_legal");
});

console.log("ออกเลขหนังสือส่งออกอัตโนมัติ");
["L3-26"].forEach((code) => {
  t(code + ": ไม่ได้กรอกเลขส่งออก → ระบบออก ปป 0003/NNNN + ลงวันที่ + ด่วนที่สุด แล้วไปนิติกร", () => {
    const c = courtCase();
    A.updateCase(c.id, { l3AnswerExternalDocNo: "", l3AnswerExternalDocDate: "", l3AnswerUrgency: "" });
    const out = A3.advance(c.id, code, {});
    assert.equal(out.statusCode, "L3_PENDING_LAWYER_COLLECT_DOCS");
    assert.match(out.l3AnswerExternalDocNo, /^ปป 0003\/\d{4}$/);
    assert.ok(out.l3AnswerExternalDocDate && out.l3AnswerExternalDocDate !== "-");
    assert.equal(out.l3AnswerUrgency, "ด่วนที่สุด");
  });
});
t("มีเลขส่งออกอยู่แล้ว → คงเลขเดิม ไม่ออกใหม่", () => {
  const c = courtCase();
  A.updateCase(c.id, { l3AnswerExternalDocNo: "ปป 0003/1234", l3AnswerExternalDocDate: "1 ต.ค. 2569", l3AnswerUrgency: "ด่วน" });
  const out = A3.advance(c.id, "L3-26", {});
  assert.equal(out.l3AnswerExternalDocNo, "ปป 0003/1234");
  assert.equal(out.l3AnswerExternalDocDate, "1 ต.ค. 2569");
  assert.equal(out.l3AnswerUrgency, "ด่วน");
});
t("ส่งกลับนิติกรแก้ไข (statusCode อื่น) → ไม่ออกเลขส่งออก", () => {
  const c = courtCase();
  A.updateCase(c.id, { l3AnswerExternalDocNo: "", l3AnswerExternalDocDate: "", l3AnswerUrgency: "" });
  const out = A3.advance(c.id, "L3-26", { statusCode: "L3_PENDING_LAWYER_EXTENSION", assignedRole: "case_legal_officer" });
  assert.equal(out.statusCode, "L3_PENDING_LAWYER_EXTENSION");
  assert.equal(out.l3AnswerExternalDocNo, "");
});
t("ขั้นอื่นไม่ออกเลขส่งออก", () => {
  const c = courtCase();
  A.updateCase(c.id, { l3AnswerExternalDocNo: "" });
  const out = A3.advance(c.id, "L3-24", {});
  assert.equal(out.l3AnswerExternalDocNo, "");
});

console.log(`\n${passed} passed`);
