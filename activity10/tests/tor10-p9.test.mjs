/* หน่วยทดสอบ TOR 10 — P9 (ค้นหาครอบคลุม + สิทธิ์เปิดหน้า 10.2 + แจ้งหน่วยงานภายในจาก 10.2)
   - Activity10.caseSearchText / matchesCaseSearch   ข้อความค้นหา (เลขดำ/แดง ผู้ร้องสอด คู่กรณีทั้งหมด …)
   - Activity10.filterJudgmentRegistry               ใช้ข้อความค้นหาของสำนวนด้วย
   - Activity102.pageAccessDecision                  ตัดสินสิทธิ์เปิดหน้า 10.2 (10.2.7.3)
   - Activity102.buildDispatchNoticePatch            ส่งหนังสือให้หน่วยงานภายใน → internalNotices[]
   - Activity10.isLegalViewRole                      มุมมองกฎหมายเห็นเฉพาะสายกฎหมาย
   Run: node activity10/tests/tor10-p9.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
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

console.log("caseSearchText / matchesCaseSearch");
const kase = {
  id: "ACT10-0001",
  courtBlackNo: "ส.12/2569",
  courtRedNo: "ส.99/2569",
  blackCaseNo: "ดำ-777",
  redCaseNo: "แดง-888",
  intervenors: ["บริษัท ร้องสอด จำกัด"],
  plaintiffs: ["นายผู้ฟ้อง หนึ่ง", "นางผู้ฟ้อง สอง"],
  defendants: ["กรมจำเลย"],
  requesterName: "นายผู้ขอ ข้อมูล",
  relatedRequestNo: "REQ-555",
  judgments: [{ blackNo: "อ.1/2570", redNo: "อ.2/2570" }],
};
const has = (q) => A.matchesCaseSearch(kase, q);
t("เลขดำ/แดงของศาล (หลายชื่อฟิลด์) ค้นเจอ", () => {
  ["ส.12/2569", "ส.99/2569", "ดำ-777", "แดง-888"].forEach((q) => assert.equal(has(q), true, q));
});
t("เลขดำ/แดงของคำพิพากษา ค้นเจอ", () => {
  assert.equal(has("อ.1/2570"), true);
  assert.equal(has("อ.2/2570"), true);
});
t("ผู้ร้องสอด + คู่กรณีทุกราย ค้นเจอ", () => {
  ["ร้องสอด", "ผู้ฟ้อง สอง", "ผู้ฟ้อง หนึ่ง", "กรมจำเลย"].forEach((q) => assert.equal(has(q), true, q));
});
t("ผู้ขอข้อมูล + เลขคำขอที่เกี่ยวข้อง ค้นเจอ; ตัวพิมพ์ไม่สำคัญ", () => {
  assert.equal(has("ผู้ขอ"), true);
  assert.equal(has("req-555"), true);
});
t("ไม่ตรง → false; ค่าว่าง → true; null ปลอดภัย", () => {
  assert.equal(has("ไม่มีคำนี้"), false);
  assert.equal(has(""), true);
  assert.equal(A.caseSearchText(null), "");
});
t("ใช้ได้กับแถว inbox ที่เก็บสำนวนใน raw", () => {
  assert.equal(A.matchesCaseSearch({ id: "x", raw: kase }, "ร้องสอด"), true);
});

console.log("\nfilterJudgmentRegistry (สารบบ)");
t("ค้นด้วยผู้ร้องสอด/เลขดำของศาลบนสำนวน 10.1 ได้", () => {
  const c = Object.assign({}, kase, { category: "10.1", judgments: [{ level: "FIRST", blackNo: "อ.1/2570", date: "2026-01-01" }] });
  const reg = A.buildJudgmentRegistry([c]);
  assert.equal(A.filterJudgmentRegistry(reg, { q: "ร้องสอด" }).length, reg.length);
  assert.equal(A.filterJudgmentRegistry(reg, { q: "ส.12/2569" }).length, reg.length);
  assert.equal(A.filterJudgmentRegistry(reg, { q: "zzz" }).length, 0);
});

console.log("\nActivity102.pageAccessDecision (10.2.7.3)");
const dis = { id: "L2-1", category: "10.2", l2StepSeq: 10, assignedRole: "dir_legal", sourceUnit: "หน่วย ก" };
t("ไม่มีสำนวน/ไม่ใช่ 10.2 → อนุญาต", () => {
  assert.equal(A2.pageAccessDecision(null, "district_admin", "").allowed, true);
});
t("บทบาท all เปิดได้", () => {
  assert.equal(A2.pageAccessDecision(dis, "admin_legal", "").allowed, true);
});
t("district_admin หน่วยอื่น → ปฏิเสธ + มี log entry", () => {
  const d = A2.pageAccessDecision(dis, "district_admin", "หน่วย ข", { page: "10-2-09.html", who: "x" });
  assert.equal(d.allowed, false);
  assert.equal(d.logEntry.action, "DENIED_OPEN");
  assert.equal(d.logEntry.roleId, "district_admin");
  assert.equal(d.logEntry.page, "10-2-09.html");
});
t("district_admin หน่วยเดียวกัน → อนุญาต", () => {
  assert.equal(A2.pageAccessDecision(dis, "district_admin", "หน่วย ก").allowed, true);
});

console.log("\nActivity102.buildDispatchNoticePatch (10.2 → หนังสือแจ้งภายใน)");
t("ขั้นไม่อนุญาต: ใช้หน่วยที่เลือก → internalNotices เพิ่ม 1 รายการ", () => {
  const k = { id: "L2-2", title: "คำขอ X", l2DenyMemoDocNo: "ปป 0002/4411", internalNotices: [{ subject: "เดิม", units: ["กบค."] }] };
  const p = A2.buildDispatchNoticePatch(k, "L2-DENY-DISPATCH-COMMITTEE", { l2DenyAssignedDept: "กองปราบปรามการทุจริตภาครัฐ 3", l2DenyAssignDate: "2026-10-02" }, "นายธุรการ");
  assert.equal(p.internalNotices.length, 2);
  const n = p.internalNotices[1];
  assert.deepEqual(n.units, ["กองปราบปรามการทุจริตภาครัฐ 3"]);
  assert.equal(n.docNo, "ปป 0002/4411");
  assert.equal(n.date, "2026-10-02");
  assert.ok(n.subject.indexOf("คำขอ X") >= 0);
});
t("ขั้นปิดเรื่อง: ใช้ฟิลด์ l2Close*", () => {
  const p = A2.buildDispatchNoticePatch({ id: "L2-3", title: "T", l2CloseMemoDocNo: "ปป 1/2" }, "L2-CLOSE-DISPATCH-COMMITTEE", { l2CloseAssignedDept: "กบค.", l2CloseAssignDate: "2026-10-03" });
  assert.deepEqual(p.internalNotices[0].units, ["กบค."]);
});
t("ขั้นอื่น/ไม่มีหน่วย → null", () => {
  assert.equal(A2.buildDispatchNoticePatch({ id: "x" }, "L2-DENY-DISPATCH-COMMITTEE", {}), null);
  assert.equal(A2.buildDispatchNoticePatch({ id: "x" }, "L2-CLOSE-MEMO", { l2CloseAssignedDept: "a" }), null);
});
t("buildAlerts เห็นหนังสือที่เพิ่ม (kind = notice) สำหรับหน่วยปลายทาง", () => {
  const k = { id: "L2-4", category: "10.2", title: "T", status: "สิ้นสุด", assignedRole: "admin_legal" };
  const p = A2.buildDispatchNoticePatch(k, "L2-DENY-DISPATCH-COMMITTEE", { l2DenyAssignedDept: "กองกฎหมาย (กอท.)", l2DenyAssignDate: "2026-10-02" });
  const alerts = A.buildAlerts([Object.assign({}, k, p)], "admin_legal", new Date(2026, 9, 2), { unit: "กองกฎหมาย (กอท.)" });
  assert.ok(alerts.some((a) => a.kind === "notice"));
});

console.log("\nisLegalViewRole (มุมมองตามบทบาท)");
t("บทบาทที่ไม่ใช่สายกฎหมายไม่เห็นมุมมองกฎหมาย; secgen/deputy_sg เห็น", () => {
  ["sub_secretariat", "district_admin", "case_bureau_admin", "subcommittee_screen"].forEach((r) => assert.equal(A.isLegalViewRole(r), false, r));
  ["secgen", "deputy_sg", "admin_legal", "legal_officer"].forEach((r) => assert.equal(A.isLegalViewRole(r), true, r));
});

console.log("\n" + passed + " tests passed");
