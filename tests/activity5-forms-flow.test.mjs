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

// 2) เนื้อหาตรงแบบพิมพ์จริง — HTML ล้วน 1:1 ตาม PDF ต้นฉบับ (ไม่มีภาพหน้ากระดาษ/overlay)
const htmlDoc = (tab, kw) => { const h = EX.paperForTab(mk(), tab); return h.includes('class="a5-paper"') && !h.includes('a5r-page') && h.includes('a5-hdr') && h.includes(kw) && (h.match(/a5-fill/g) || []).length >= 5; };
const ext213 = EX.paperForTab(mk(), "ext213");
assert.ok(htmlDoc('ext213', 'การขอขยายระยะเวลาการไต่สวนเบื้องต้น'), "แบบ 2 ต้องเป็น HTML (บันทึกข้อความขอขยาย 213)");
assert.ok(ext213.includes("บันทึกข้อความ") && ext213.includes("ส่วนราชการ"), "แบบ 2 ต้องเป็นรูปแบบบันทึกข้อความตามต้นฉบับ");
assert.ok(ext213.includes(">1<") && ext213.includes("สิงหาคม") && ext213.includes("2569"), "แบบ 2 ต้องมีวันที่รับเรื่อง (วัน/เดือน/พ.ศ. แยกช่องตามต้นฉบับ)");
const ext644 = EX.paperForTab(mk(), "ext644");
assert.ok(htmlDoc('ext644', 'การขอขยายระยะเวลาการไต่สวน'), "แบบ 3 ต้องเป็น HTML");
assert.ok(ext644.includes("ข้อ ๖๔"), "แบบ 3 ต้องอ้างระเบียบข้อ ๖๔ (ต่างจากแบบ 2 ที่ใช้ข้อ ๓๘)");
const plan = EX.paperForTab(mk(), "plan");
assert.ok(htmlDoc('plan', 'แผนงานคดี (ไต่สวนเบื้องต้น/ไต่สวน)'), "แบบ 1 ต้องเป็น HTML (แผนงานคดี)");
assert.ok(plan.includes("690001"), "แบบ 1 ต้องมีข้อมูลคดี (เลขเรื่อง)");
assert.ok(plan.includes("ผู้กล่าวหา") && plan.includes("ผู้ถูกกล่าวหา"), "แบบ 1 ต้องมีหัวข้อตามฟอร์มจริง");
assert.ok(plan.includes("ครบกำหนด ๖๐ วัน") && plan.includes("แผนการไต่สวน") && plan.includes("สิ่งที่ต้องดำเนินการ"), "แบบ 1 ต้องมีหัวข้อ/ตารางประเด็นตามต้นฉบับ");
const notice = EX.paperForTab(mk(), "notice");
assert.ok(htmlDoc('notice', 'แจ้งข้อกล่าวหาและสิทธิคัดค้านคณะพนักงานไต่สวน'), "แบบ 5 ต้องเป็น HTML");
assert.ok(notice.includes("ขอแสดงความนับถือ") && notice.includes("อาคารซอฟต์แวร์ปาร์ค"), "แบบ 5 ต้องเป็นรูปแบบหนังสือออกตามต้นฉบับ");
const warrants = EX.paperForTab(mk("a5-outcome"), "warrants");
assert.ok(warrants.includes('class="a5-paper"') && !warrants.includes('a5r-page'), "ชุดหมายจับต้องเป็น HTML");
assert.ok(warrants.includes("( คำร้อง )") && warrants.includes("ขอหมายจับ") && warrants.includes("ตำหนิรูปพรรณผู้กระทำความผิด"), "แบบ 11/16 ครบ");
assert.ok(warrants.includes("ในพระปรมาภิไธยพระมหากษัตริย์") && warrants.includes("กรณีเหตุเกิดก่อน ๓๐ เม.ย. ๕๙"), "แบบ 14 (อายุความไม่สะดุดหยุดลง) ครบ");
assert.ok(warrants.includes("เหตุเกิด ๓๐ เม.ย. ๕๙ เป็นต้นไป") && warrants.includes("มาตรา ๖๑/๑"), "แบบ 15 (อายุความสะดุดหยุดลง) ครบ");
assert.ok(warrants.includes("แจ้งผลการดำเนินการเพื่อให้ได้ตัวผู้ถูกกล่าวหา") && warrants.includes("ขอให้ดำเนินการจับกุมผู้ถูกกล่าวหาตามหมายจับ") && warrants.includes("กอท."), "แบบ 17/18/19 ครบ");
assert.ok(warrants.includes("อธิบดีผู้พิพากษาศาล") && warrants.includes("จำนวน ๑ หมาย"), "แบบ 20 (ผนึกซอง) ครบ");
assert.ok(warrants.includes("บันทึกคำเบิกความ") && warrants.includes("กระบวนการ") && warrants.includes("ผู้พิพากษา"), "แบบ 12/13 ครบ");
assert.ok(htmlDoc('213', 'รายงานการไต่สวนเบื้องต้น'), "แบบ 4 (รายงาน 213) ต้องเป็น HTML");
assert.ok(htmlDoc('644', 'รายงานการไต่สวน'), "แบบ 7 (รายงาน 644) ต้องเป็น HTML");
assert.ok(htmlDoc('record', 'บันทึกการแจ้งข้อกล่าวหาและสิทธิคัดค้าน'), "แบบ 6 ต้องเป็น HTML");
assert.ok(EX.paperForTab(mk(), "record").includes("ส่วนที่ ๓ การรับทราบข้อกล่าวหา"), "แบบ 6 ต้องครบ 3 ส่วนตามต้นฉบับ");
assert.ok(htmlDoc('letters', 'หนังสือแจ้งให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการ'), "แบบ 8/9/10 ต้องเป็น HTML");

// 2ก) กติกาแบบพิมพ์: HTML ล้วน · ช่องกรอกเป็น a5-fill · ลายเซ็นเป็น a5-lock · ไม่มีคำว่า "กิจกรรม"
for (const tab of ["plan", "213", "ext213", "644", "ext644", "notice", "record", "letters", "warrants"]) {
  const h = EX.paperForTab(mk(tab === "letters" || tab === "warrants" ? "a5-outcome" : undefined), tab);
  assert.ok(!/background-image|<canvas/i.test(h), `${tab} ต้องไม่ใช้ภาพพื้นหลัง/canvas`);
  assert.ok(!h.includes("กิจกรรม"), `${tab} ต้องไม่มีคำว่า "กิจกรรม" ใน UI`);
  assert.ok(h.includes("a5-lock"), `${tab} ลายเซ็นต้องมี a5-lock`);
  assert.ok(!h.includes("undefined") && !h.includes("[object Object]"), `${tab} ต้องไม่มีค่าที่ render ผิด`);
  assert.equal((h.match(/<section/g) || []).length, 1, `${tab} ต้องคืน section เดียว`);
  assert.equal((h.match(/class="a5-form-code"/g) || []).length, 1, `${tab} ต้องมีรหัสแบบท้ายเอกสารครั้งเดียว (ไม่ซ้อนทับกัน)`);
}

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
