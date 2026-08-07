import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));

// ---- DOM stubs (no browser required) ----
globalThis.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  getElementById: () => null,
  createElement: () => ({ className: "", innerHTML: "", appendChild() {} }),
  body: { appendChild() {} },
};
globalThis.location = { href: "", search: "", replaceState() {} };
globalThis.history = { replaceState() {} };
globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.ThaiDatePicker = { html: (id, o) => `<input id="${id}">`, wireAll: () => {} };

const EX = require(root + "assets/activity5-workspace.js");

function mk(stage) {
  const s = {
    caseData: { id: "690001", subject: "ร้องเรียนการจัดซื้อ", complainant: "นายสมชาย", agency: "สำนักงานฯ", region: "เขต 2", received: "5 สิงหาคม 2569", decision: "18/4" },
    documentData: { documentSubject: "ร้องเรียนการจัดซื้อ" },
    workflow: { stage: stage || "a5-prelim" },
    decisionHistory: [],
  };
  EX.ensureInquiry(s);
  s.inquiry.intake.receivedFirstAt = "2026-08-01";
  s.inquiry.intake.director = "ผอ.เขต 2";
  s.inquiry.intake.investigator = "พนักงาน ป.ป.ท. สมชาย";
  s.inquiry.intake.team = ["พนักงาน ป.ป.ท. วิภา"];
  s.inquiry.prelim.plan = "1. ตรวจสถานที่\n2. ขอเอกสาร";
  s.inquiry.prelim.planStatus = "approved";
  s.inquiry.prelim.report = "เห็นควรรับไว้ไต่สวน";
  s.inquiry.prelim.workLog = "รวบรวมเอกสารแล้ว";
  s.inquiry.prelim.issues = { status: "ข้าราชการ", authority: "ผอ.ฝ่ายพัสดุ", action: "สั่งซื้อไม่ผ่านการสอบราคา", damage: "~200,000 บาท" };
  s.inquiry.inquiry644.accused = ["นางสาวประภา ศรีสุข"];
  s.inquiry.inquiry644.allegations = "ทุจริตต่อหน้าที่";
  s.inquiry.inquiry644.report = "ชี้มูลความผิดอาญาและวินัย";
  s.inquiry.inquiry644.witnesses = ["นายวิทยา"];
  s.inquiry.committee213.orderType = "24v1";
  s.inquiry.committee213.orderNo = "คำสั่งที่ 50/2569";
  s.inquiry.committee213.orderDate = "2026-10-01";
  s.inquiry.committee213.investigator644 = "พนักงาน ป.ป.ท. สมชาย";
  return s;
}

// 1) เอกสารทุกแท็บ render โดยไม่ error และมีโครงสร้าง a5-paper + แบบพิมพ์จริง
const papers = ["plan", "213", "ext213", "644", "ext644", "notice", "record", "letters", "warrants", "mti"];
for (const tab of papers) {
  const html = EX.paperForTab(mk(), tab);
  assert.ok(typeof html === "string" && html.includes("a5-paper"), `${tab} must render an a5-paper`);
}

// 2) เนื้อหาตรงแบบพิมพ์จริง — ฟอร์มหลักเป็นหน้าจริงจาก PDF (a5r-page + ภาพ + overlay ข้อมูล)
const ext213 = EX.paperForTab(mk(), "ext213");
assert.ok(ext213.includes("a5r-page") && ext213.includes("ext213-1.png"), "แบบ 2 ต้องเป็นหน้ารูปจริง (ext213-1..3.png)");
assert.ok(ext213.includes("1 ส.ค. 2569"), "แบบ 2 ต้องมี overlay วันที่รับเรื่องลงบนฟอร์ม");
const ext644 = EX.paperForTab(mk(), "ext644");
assert.ok(ext644.includes("a5r-page") && ext644.includes("ext644-1.png"), "แบบ 3 ต้องเป็นหน้ารูปจริง (ext644-1..3.png)");
const plan = EX.paperForTab(mk(), "plan");
assert.ok(plan.includes("a5r-page") && plan.includes("plan-1.png"), "แบบ 1 ต้องเป็นหน้ารูปจริง (a5r-page + ภาพ PDF ต้นฉบับ)");
assert.ok(plan.includes("a5r-slot"), "แบบ 1 ต้องมีช่อง overlay ข้อมูลบนฟอร์มจริง");
assert.ok(plan.includes("690001"), "แบบ 1 ต้องมีข้อมูลคดี (เลขเรื่อง) ลงบนฟอร์ม");
const notice = EX.paperForTab(mk(), "notice");
assert.ok(notice.includes("a5r-page") && notice.includes("notice-1.png"), "แบบ 5 ต้องเป็นหน้ารูปจริง (notice-1..2.png)");
const warrants = EX.paperForTab(mk(), "warrants");
assert.ok(warrants.includes("p14-1.png") && warrants.includes("p20-1.png"), "แบบ 14/20 ต้องเป็นหน้ารูปจริง");
assert.ok(warrants.includes("p15-1.png") && warrants.includes("p11-1.png") && warrants.includes("p16-1.png"), "แบบ 11/15/16 ต้องเป็นหน้ารูปจริง");
assert.ok(warrants.includes("p17-1.png") && warrants.includes("p18-1.png") && warrants.includes("p19-1.png"), "แบบ 17/18/19 ต้องเป็นหน้ารูปจริง");
assert.ok(warrants.includes("p12-1.png") && warrants.includes("p13-1.png"), "แบบ 12/13 ต้องเป็นหน้ารูปจริง");
const paper213 = EX.paperForTab(mk(), "213");
assert.ok(paper213.includes("rep213-1.png") && paper213.includes("a5r-page"), "แบบ 4 (รายงาน 213) ต้องเป็นหน้ารูปจริง 6 หน้า");
const paper644 = EX.paperForTab(mk(), "644");
assert.ok(paper644.includes("rep644-1.png") && paper644.includes("a5r-page"), "แบบ 7 (รายงาน 644) ต้องเป็นหน้ารูปจริง 3 หน้า");
const record = EX.paperForTab(mk(), "record");
assert.ok(record.includes("record-1.png") && record.includes("a5r-page"), "แบบ 6 ต้องเป็นหน้ารูปจริง 3 หน้า");
const letters = EX.paperForTab(mk(), "letters");
assert.ok(letters.includes("p8-1.png") && letters.includes("p10-1.png") && letters.includes("p9-1.png"), "แบบ 8/9/10 ต้องเป็นหน้ารูปจริง");

// 3) docTabsA5 เป็นไปตาม stage
const prelimTabs = EX.docTabsA5(mk("a5-prelim"));
assert.ok(prelimTabs.includes("data-a5-doc=\"plan\"") && prelimTabs.includes("data-a5-doc=\"213\""), "prelim ต้องมีแผนงานคดี + รายงาน 213");
const inquiryTabs = EX.docTabsA5(mk("a5-inquiry"));
assert.ok(inquiryTabs.includes("data-a5-doc=\"644\"") && inquiryTabs.includes("data-a5-doc=\"notice\""), "inquiry ต้องมี 644 + แจ้งข้อกล่าวหา");
const outcomeTabs = EX.docTabsA5(mk("a5-outcome"));
assert.ok(outcomeTabs.includes("letters") && outcomeTabs.includes("warrants"), "outcome ต้องมีหนังสืออัยการ + หมายจับ");

// 4) extension engine: 213 = 4 รอบ (ผอ.→เลขาฯ→คกก.→คกก.), 644 = 6 รอบ (ผอ.×2→เลขาฯ×2→คกก.→คกก.), ครบแล้ว block
for (const [rt, rounds] of [["213", 4], ["644", 6]]) {
  const s = mk();
  for (let i = 0; i < rounds; i++) {
    const r = EX.requestExtension(s, rt, "เหตุผล", 30, "investigator");
    assert.ok(r.ok, `${rt} round ${i + 1} request must succeed`);
    const a = EX.applyExtension(s, rt, "อนุมัติ", r.next.role, 30);
    assert.ok(a.ok, `${rt} round ${i + 1} approve must succeed`);
  }
  const blocked = EX.requestExtension(s, rt, "อีก", 30, "investigator");
  assert.equal(blocked.ok, false, `${rt} must block after ${rounds} rounds`);
}

// 5) รอบ คกก. (ครั้งที่ 3/5): lateReport -> actionsForA5 แสดงปุ่มอนุมัติ/ไม่อนุมัติ
const late213 = mk("a7-213");
late213.inquiry.prelim.lateReport = "รอเอกสารจากต้นสังกัด";
const a213 = EX.actionsForA5(late213, "committee");
assert.ok(a213.includes("ext-committee-approve") && a213.includes("ext-committee-deny"), "late 213 ต้องมีปุ่มอนุมัติ/ไม่อนุมัติขยาย");
assert.ok(!a213.includes("mti213-decide"), "late 213 ต้องไม่แสดงปุ่มมติ 213 ปกติ");
const late644 = mk("a7-644");
late644.inquiry.inquiry644.lateReport = "รอผลตรวจ";
const a644 = EX.actionsForA5(late644, "committee");
assert.ok(a644.includes("ext-committee-approve"), "late 644 ต้องมีปุ่มอนุมัติขยาย");

// 6) progress report: field progressReports ต้องถูกใช้ (ไม่มี UI-level test ได้ แต่ตรวจ editor มี section)
const prelim = EX.editorForA5(mk("a5-prelim"), "investigator");
assert.ok(prelim.includes("รายงานความคืบหน้า"), "prelim editor ต้องมี section รายงานความคืบหน้า 15 วัน");

// 7) editor ทุก stage × ทุกบทบาท render ไม่ error
const stages = ["a5-intake", "a5-prelim", "a5-prelim-review", "a7-213", "a5-inquiry", "a5-inquiry-review", "a7-644", "a5-outcome", "a5-prosecutor", "closed"];
const roles = ["clerk", "investigator", "group-director", "director", "secretary", "committee"];
for (const st of stages) {
  for (const r of roles) {
    const html = EX.editorForA5(mk(st), r);
    assert.ok(typeof html === "string" && html.length > 50, `editor ${st}/${r} must render`);
  }
}

// 8) 58/2 special path
const s58 = mk();
s58.caseData.decision = "58/2";
assert.ok(EX.paperForTab(s58, "plan").includes("ตรวจสอบข้อเท็จจริง"), "58/2 paper ต้องเป็นบันทึกตรวจสอบข้อเท็จจริง");

console.log("PASS activity5-forms-flow.test.mjs: ฟอร์มจริง 20 แบบ, extension 213x4/644x6, รอบ คกก., progress report, editor ทุก stage x role");
