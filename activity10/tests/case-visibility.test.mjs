/* หน่วยทดสอบ — ขอบเขตการมองเห็นสำนวนในรายการงาน (2026-10-19)
   ดู docs/E-CMIS_Activity10_Menu_Role_Matrix_v1_0.xlsx
   - ผอ.กอง / ผอ.กลุ่ม เห็นงานทุกสำนวน
   - นิติกร เห็นเฉพาะสำนวนที่ได้รับมอบหมายให้ตน (คงเห็นต่อหลังส่งงานออกจากมือแล้ว)
   Run: node activity10/tests/case-visibility.test.mjs */
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
const { Activity10: A, Activity102: A2 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const NATTAPOL = "นายณัฐพล บัวทุม";
const KITTISAK = "นายกิตติศักดิ์ แสงทอง";
const SOMCHAI = "นายสมชาย ใจซื่อ";

const mine = { id: "V1", officer: NATTAPOL + " (นิติกรชำนาญการพิเศษ)", assignedRole: "legal_officer", statusCode: "DRAFTING_OPINION" };
const others = { id: "V2", officer: "นายกฤษดา ทดสอบ", assignedRole: "legal_officer", statusCode: "DRAFTING_OPINION" };
const notYetAssigned = { id: "V3", officer: "นายอานนท์ ชินประชา", assignedRole: "group_director", statusCode: "PENDING_GROUP_DIRECTOR" };
const movedOn = { id: "V4", officer: "นายนภัส สอนดี", assignedRole: "dir_legal", statusCode: "PENDING_DIRECTOR_APPROVAL", assignedLawyers: [NATTAPOL] };
const court = { id: "V5", officer: "นางกานดา รักษ์ธรรม", assignedRole: "admin_legal", l3GroupAssignTarget: KITTISAK + " (นิติกร กลุ่มงานคดี)" };
const appeal = { id: "V6", officer: "นายสมศักดิ์ ไต่สวน", l2OriginalCaseOfficer: "นายสมศักดิ์ ไต่สวน", assignedRole: "original_officer" };
const appealOther = { id: "V7", officer: SOMCHAI, assignedRole: "original_officer" };
const unnamedAtStep = { id: "V8", assignedRole: "legal_officer", statusCode: "DRAFTING_OPINION" };
const ALL = [mine, others, notYetAssigned, movedOn, court, appeal, appealOther, unnamedAtStep];
const ids = (rows) => rows.map((c) => c.id).sort();

t("ผอ.กอง / ผอ.กลุ่ม ทุกสายงานเห็นงานทุกสำนวน", () => {
  for (const role of ["dir_legal", "group_director", "case_group_director", "case_bureau_director", "Napas.S", "Arnon.C"]) {
    assert.equal(A.seesAllCases(role), true, role);
    assert.deepEqual(ids(A.visibleCasesFor(ALL, role, "")), ids(ALL), role);
  }
});

t("นิติกรไม่ได้อยู่ในกลุ่มเห็นทุกสำนวน", () => {
  for (const role of ["legal_officer", "case_legal_officer", "original_officer", "Nattapol.B"]) {
    assert.equal(A.seesAllCases(role), false, role);
    assert.equal(A.isAssignedOnlyRole(role), true, role);
  }
});

t("นิติกรกลุ่มงานความเห็นแย้ง เห็นเฉพาะสำนวนที่มอบหมายให้ตน", () => {
  assert.deepEqual(ids(A.visibleCasesFor(ALL, "legal_officer", NATTAPOL)), ["V1", "V4", "V8"]);
  assert.deepEqual(ids(A.visibleCasesFor(ALL, "Nattapol.B", NATTAPOL)), ["V1", "V4", "V8"]);
});

t("นิติกรกลุ่มงานคดี เห็นสำนวนคดีปกครองที่ ผอ.กลุ่มงานคดีมอบหมาย", () => {
  assert.deepEqual(ids(A.visibleCasesFor(ALL, "case_legal_officer", KITTISAK)), ["V5"]);
});

t("นิติกรเจ้าของสำนวนเดิม เห็นเรื่องอุทธรณ์ที่มอบหมายให้ตน/เจ้าของสำนวนเดิม", () => {
  assert.deepEqual(ids(A.visibleCasesFor(ALL, "original_officer", SOMCHAI)), ["V6", "V7"]);
});

t("บทบาทอื่นคืน null ให้หน้ารายการงานใช้ตรรกะเดิม", () => {
  assert.equal(A.visibleCasesFor(ALL, "deputy_sg", ""), null);
  assert.equal(A.visibleCasesFor(ALL, "sub_secretariat", ""), null);
});

t("saveCases จำชื่อนิติกรที่ได้รับมอบหมายไว้ (assignedLawyers) แม้สำนวนเดินต่อแล้ว", () => {
  const c = { id: "S1", officer: NATTAPOL, assignedRole: "legal_officer", statusCode: "DRAFTING_OPINION" };
  A.saveCases([c]);
  let saved = A.getCases().find((x) => x.id === "S1");
  assert.deepEqual(saved.assignedLawyers, [NATTAPOL]);
  A.saveCases([{ ...saved, officer: "นายนภัส สอนดี", assignedRole: "dir_legal", statusCode: "PENDING_DIRECTOR_APPROVAL" }]);
  saved = A.getCases().find((x) => x.id === "S1");
  assert.deepEqual(saved.assignedLawyers, [NATTAPOL]);
  assert.deepEqual(ids(A.visibleCasesFor([saved], "legal_officer", NATTAPOL)), ["S1"]);
  for (const k of Object.keys(store)) delete store[k];
});

t("ข้อมูลตัวอย่าง: ผอ.กลุ่มเห็นทุกสำนวน นิติกรเห็นบางส่วน (มากกว่า 0)", () => {
  const seeds = A.getCases();
  const all = A.visibleCasesFor(seeds, "group_director", "");
  const lawyer = A.visibleCasesFor(seeds, "legal_officer", NATTAPOL);
  assert.equal(all.length, seeds.length);
  assert.ok(lawyer.length > 0, "นิติกรต้องเห็นอย่างน้อย 1 สำนวน");
  assert.ok(lawyer.length < seeds.length, "นิติกรต้องไม่เห็นทุกสำนวน");
});

t("10.2: ผอ.กลุ่มงานคดีและ ผอ.สายกองบริหารคดีเห็นคำร้องเปิดเผยข้อมูลทุกเรื่อง", () => {
  const disclosure = A.getCases().find((c) => A2.isDisclosureCase(c));
  assert.ok(disclosure, "ต้องมีคำร้อง 10.2 ในข้อมูลตัวอย่าง");
  for (const role of ["case_group_director", "case_bureau_director"]) {
    assert.ok(A2.VISIBILITY_RULES.all.includes(role), role);
    assert.equal(A2.canView102({ ...disclosure, assignedRole: "secgen" }, role, ""), true, role);
  }
});

t("กลุ่มเมนูรายงานเห็นได้โดย ผอ.กลุ่มงานคดี", () => {
  assert.equal(A.isLegalViewRole("case_group_director"), true);
});

console.log(`\n${passed} passed`);
