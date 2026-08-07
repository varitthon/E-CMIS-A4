import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));

// ===== 1) ecmis-sidebar.js: ปุ่มสลับระบบ + เมนู A5 + ไม่มีคำว่า "(กิจกรรมที่ 5)" =====
const sidebar = readFileSync(root + "assets/ecmis-sidebar.js", "utf8");
assert.match(sidebar, /ecmis-sidebar-switch/, "ต้องมีปุ่มสลับระบบ (sidebar-switch)");
assert.match(sidebar, /รับเรื่องร้องเรียน/, "ปุ่มสลับระบบ 1: รับเรื่องร้องเรียน");
assert.match(sidebar, /กระบวนการไต่สวน/, "ปุ่มสลับระบบ 2: กระบวนการไต่สวน");
assert.doesNotMatch(sidebar, /\(กิจกรรมที่ 5\)/, "R83: ห้ามมีคำว่า (กิจกรรมที่ 5) ในเมนู");
assert.match(sidebar, /เมนูกระบวนการไต่สวน/, "ต้องมี section header เมนูกระบวนการไต่สวน");
for (const label of [
  "รายการสำนวนคดี", "ไต่สวนเบื้องต้น (213)", "ไต่สวนชี้มูล (644)",
  "รอความเห็นตามลำดับชั้น", "เรื่องเสนอ คกก.", "รออนุมัติขยายเวลา",
  "ใกล้ครบกำหนด", "ใบด่วน/เร่งด่วน", "คดีรับจาก ป.ป.ช.", "ตรวจสอบข้อเท็จจริง 58/2",
]) {
  assert.match(sidebar, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `เมนู A5 ต้องมีรายการ: ${label}`);
}
assert.match(sidebar, /a5q: q/, "menuForA5 ต้องสร้างลิงก์ด้วย a5q จากตัวแปร q");
assert.match(sidebar, /view: 'a5', a5q: q/, "ลิงก์ A5 ต้องมีทั้ง view=a5 และ a5q");
assert.match(sidebar, /function menuForA5/, "ต้องมีฟังก์ชัน menuForA5");
assert.match(sidebar, /role === 'anonymous'\) return \[\];/, "anonymous ต้องไม่เห็นเมนู A5");
assert.match(sidebar, /if \(target\.searchParams\.has\('a5q'\)\)/, "isActive ต้องรองรับ a5q");

// ===== 2) activity5-workspace.js: a5qFilter + banner =====
const a5 = readFileSync(root + "assets/activity5-workspace.js", "utf8");
assert.match(a5, /function a5qFilter/, "ต้องมี a5qFilter");
for (const q of ["prelim", "inquiry", "review", "committee", "ext", "due", "fast", "m62", "582"]) {
  assert.match(a5, new RegExp(`case '${q}':`), `a5qFilter ต้องมีกรณี ${q}`);
}
assert.match(a5, /a5q-banner/, "ต้องมี banner แสดงเมนูที่กำลังกรอง");
assert.match(a5, /new URLSearchParams\(location\.search\)\.get\('a5q'\)/, "renderA5 ต้องอ่าน a5q จาก URL");

// ===== 3) Smoke: a5qFilter แยกกลุ่มถูกต้อง =====
globalThis.document = {
  querySelector: () => ({ textContent: "", innerHTML: "", appendChild() {}, addEventListener() {}, dataset: {}, querySelectorAll: () => [] }),
  querySelectorAll: () => [], addEventListener() {}, getElementById: () => null,
  createElement: () => ({ className: "", innerHTML: "", appendChild() {} }), body: { appendChild() {} },
};
globalThis.location = { href: "staff-workflow.html?view=a5", search: "?view=a5", replaceState() {} };
globalThis.history = { replaceState() {} };
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.ThaiDatePicker = { html: () => "<input>", wireAll: () => {} };
const EX = require(root + "assets/activity5-workspace.js");

function mk(stage, over = {}) {
  const s = {
    caseData: { id: "690001", subject: "x", complainant: "สมชาย", agency: "สำนักงานฯ", region: "เขต 2", received: "5 สิงหาคม 2569", decision: "18/4" },
    documentData: { documentSubject: "x" }, workflow: { stage }, decisionHistory: [],
  };
  EX.ensureInquiry(s);
  s.inquiry.intake.investigator = "สมชาย";
  s.inquiry.intake.receivedFirstAt = "2026-08-01";
  s.inquiry.prelim.deadlineAt = "2026-09-30";
  s.inquiry.inquiry644.deadlineAt = "2027-06-28";
  Object.assign(s, over);
  return s;
}

const prelim = mk("a5-prelim");
const inquiry = mk("a5-inquiry");
const committee213 = mk("a7-213");
const committee644 = mk("a7-644");
const review = mk("a5-prelim-review");
const extCase = mk("a5-inquiry"); extCase.inquiry.inquiry644.extensionHistory = [{ status: "PENDING" }];
const fastCase = mk("a5-inquiry"); fastCase.inquiry.inquiry644.fastTrack = true;
const m62Case = mk("a5-intake"); m62Case.inquiry.intake.m62 = { flag: true };
const s58 = mk("a5-outcome"); s58.caseData.decision = "58/2";
const dueCase = mk("a5-inquiry"); dueCase.inquiry.inquiry644.deadlineAt = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);

const cases = [prelim, inquiry, committee213, committee644, review, extCase, fastCase, m62Case, s58, dueCase];
const pick = q => cases.filter(c => EX.a5qFilter(c, q)).map(c => c.workflow.stage + (c.caseData.decision === "58/2" ? ":58" : ""));

assert.deepEqual(pick("prelim"), ["a5-prelim", "a7-213", "a5-prelim-review"], "a5q=prelim ต้องเจอเฟส 213 (prelim + review + คกก.213)");
assert.deepEqual(pick("inquiry").sort(), ["a5-inquiry", "a5-inquiry", "a5-inquiry", "a5-inquiry", "a7-644"].sort(), "a5q=inquiry ต้องเจอเฟส inquiry + คกก.644");
assert.deepEqual(pick("committee"), ["a7-213", "a7-644"], "a5q=committee ต้องเจอเฉพาะ a7");
assert.deepEqual(pick("ext"), ["a5-inquiry"], "a5q=ext ต้องเจอคดีที่มี PENDING");
assert.deepEqual(pick("fast"), ["a5-inquiry"], "a5q=fast ต้องเจอคดีใบด่วน");
assert.deepEqual(pick("m62"), ["a5-intake"], "a5q=m62 ต้องเจอคดี ป.ป.ช. มอบหมาย");
assert.deepEqual(pick("582"), ["a5-outcome:58"], "a5q=582 ต้องเจอคดี 58/2");
assert.deepEqual(pick("due"), ["a5-inquiry"], "a5q=due ต้องเจอคดีใกล้ครบกำหนด");
assert.equal(pick("all").length, cases.length, "a5q=all ต้องได้ทุกคดี");

// renderA5List กับทุก filter ไม่พัง
for (const q of ["all", "prelim", "inquiry", "review", "committee", "ext", "due", "fast", "m62", "582"]) {
  EX.renderA5List("clerk", { a5q: q });
}
console.log("PASS activity5-sidebar-menu.test.mjs: ปุ่มสลับระบบ + เมนู A5 ตามสิทธิ์ + a5qFilter 10 กลุ่ม + R83 ไม่มี (กิจกรรมที่ 5)");
