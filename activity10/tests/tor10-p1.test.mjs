/* หน่วยทดสอบ TOR 10 — Phase P1 (ดู docs/tor10-change-plan.md)
   - Activity10.fiscalYearOf        ปีงบประมาณ (ต.ค.–ก.ย.) TOR 10.3.1.2
   - Activity10.courtLevelName      ประเภทคดีศาลปกครอง TOR 10.3.1.1(2)
   - Activity10.l3StatusName        ชื่อสถานะ 10.3.3.1 / 10.3.4.1 (+ อื่นๆ)
   - Activity10.CASE_LAWYERS        รายชื่อนิติกรกลุ่มงานคดี TOR 10.3.2
   - Activity103.defaultStatusPatch ค่าสถานะตั้งต้นตามขั้นตอนงาน (auto + override)
   - Activity103.effectiveStatus    สถานะที่แสดงผลของเคสเดิมที่ยังไม่มีฟิลด์
   - Activity103.buildStatusChange  ประวัติการเปลี่ยนสถานะ
   - Activity103.buildSupremeJudgmentPatch ผลคำพิพากษาศาลปกครองสูงสุด TOR 10.3.4.2

   โหลด ecmis-activity10.js และ ecmis-10-3.js จริงเข้ามาทดสอบ
   Run: node activity10/tests/tor10-p1.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(
  sandbox,
  sandbox.Activity10,
);
const { Activity10, Activity103 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\nActivity10.fiscalYearOf");
t("1 ต.ค. 2025 (ค.ศ.) → ปีงบ 2569", () => {
  assert.equal(Activity10.fiscalYearOf("2025-10-01"), "2569");
});
t("30 ก.ย. 2025 (ค.ศ.) → ปีงบ 2568", () => {
  assert.equal(Activity10.fiscalYearOf("2025-09-30"), "2568");
});
t("รับวันที่แบบ พ.ศ. ได้ (2568-10-01 → 2569)", () => {
  assert.equal(Activity10.fiscalYearOf("2568-10-01"), "2569");
});
t("ค่าว่าง/รูปแบบผิด → สตริงว่าง", () => {
  assert.equal(Activity10.fiscalYearOf(""), "");
  assert.equal(Activity10.fiscalYearOf("1/10/2568"), "");
});

console.log("\nActivity10.courtLevelName / l3StatusName");
t("FIRST / SUPREME → ชื่อศาล", () => {
  assert.equal(Activity10.courtLevelName("FIRST"), "ศาลปกครองชั้นต้น");
  assert.equal(Activity10.courtLevelName("SUPREME"), "ศาลปกครองสูงสุด");
  assert.equal(Activity10.courtLevelName("X"), "");
});
t("สถานะ 10.3.3.1 มีครบ 4 ประเภท และ 10.3.4.1 มีครบ 5 ประเภท", () => {
  assert.deepEqual(
    Activity10.L3_OP_STATUS.map((s) => s.code),
    ["BOARD_AUTHORIZE", "IN_PROGRESS", "SENT_TO_PROSECUTOR", "OTHER"],
  );
  assert.deepEqual(
    Activity10.L3_CASE_STATUS.map((s) => s.code),
    ["FIRST_PENDING", "SUPREME_PENDING", "FINAL", "STRUCK_OUT", "OTHER"],
  );
});
t("จำหน่ายคดี มีชื่อแสดงผล", () => {
  assert.equal(
    Activity10.l3StatusName(Activity10.L3_CASE_STATUS, "STRUCK_OUT"),
    "จำหน่ายคดี",
  );
});
t("อื่นๆ แสดงข้อความที่ผู้ใช้ระบุ", () => {
  assert.equal(
    Activity10.l3StatusName(Activity10.L3_OP_STATUS, "OTHER", "รอเอกสารเพิ่ม"),
    "อื่นๆ: รอเอกสารเพิ่ม",
  );
});

console.log("\nActivity10.CASE_LAWYERS");
t("มีนิติกรมากกว่า 1 ราย และคนแรกคือนิติกรเดิมของ demo", () => {
  assert.ok(Activity10.CASE_LAWYERS.length > 1);
  assert.match(Activity10.CASE_LAWYERS[0], /กิตติศักดิ์/);
});

console.log("\nActivity103.defaultStatusPatch");
t("เสนอบอร์ด (L3_READY_FOR_BOARD) → เสนอคณะกรรมการเพื่อพิจารณามอบอำนาจ", () => {
  const p = Activity103.defaultStatusPatch("L3_READY_FOR_BOARD", {});
  assert.equal(p.opStatusType, "BOARD_AUTHORIZE");
});
t("ส่งคำให้การแล้ว (L3_AWAITING_JUDGMENT) → จัดส่งให้พนักงานอัยการ", () => {
  const p = Activity103.defaultStatusPatch("L3_AWAITING_JUDGMENT", {});
  assert.equal(p.opStatusType, "SENT_TO_PROSECUTOR");
});
t("ส่งคำอุทธรณ์แล้ว → ระหว่างพิจารณาของศาลปกครองสูงสุด", () => {
  const p = Activity103.defaultStatusPatch("L10_SENT_TO_PROSECUTOR", {});
  assert.equal(p.caseStatus, "SUPREME_PENDING");
});
t("ปิดสำนวน (L3V_CLOSED) → คดีถึงที่สุด", () => {
  const p = Activity103.defaultStatusPatch("L3V_CLOSED", {});
  assert.equal(p.caseStatus, "FINAL");
});
t("ขั้นที่ไม่ผูกสถานะ ไม่ทับค่าที่ผู้ใช้เลือกไว้ (override)", () => {
  const p = Activity103.defaultStatusPatch("L3_PENDING_GROUP_APPROVE", {
    opStatusType: "OTHER",
    opStatusOther: "รอเอกสาร",
    caseStatus: "STRUCK_OUT",
  });
  assert.equal(p.opStatusType, undefined);
  assert.equal(p.caseStatus, undefined);
});
t("เคสใหม่ที่ยังไม่มีสถานะ ได้ค่าตั้งต้นตามระดับศาล", () => {
  const p = Activity103.defaultStatusPatch("L3_PENDING_GROUP_APPROVE", {
    courtLevel: "SUPREME",
  });
  assert.equal(p.opStatusType, "IN_PROGRESS");
  assert.equal(p.caseStatus, "SUPREME_PENDING");
});

console.log("\nActivity103.effectiveStatus");
t("เคสเดิมไม่มีฟิลด์ → คำนวณจาก statusCode", () => {
  const s = Activity103.effectiveStatus({ statusCode: "L9B_CLOSED" });
  assert.equal(s.caseStatus, "FINAL");
  assert.equal(s.opStatusType, "IN_PROGRESS");
});
t("มีฟิลด์แล้ว → ใช้ค่าที่บันทึก", () => {
  const s = Activity103.effectiveStatus({
    statusCode: "L9B_CLOSED",
    caseStatus: "OTHER",
    caseStatusOther: "ศาลสั่งรวมคดี",
  });
  assert.equal(s.caseStatus, "OTHER");
  assert.equal(s.caseStatusOther, "ศาลสั่งรวมคดี");
});

console.log("\nActivity103.buildStatusChange");
t("บันทึกประวัติเฉพาะฟิลด์ที่เปลี่ยน", () => {
  const patch = Activity103.buildStatusChange(
    { opStatusType: "IN_PROGRESS", caseStatus: "FIRST_PENDING" },
    { opStatusType: "IN_PROGRESS", caseStatus: "STRUCK_OUT" },
    "นิติกร",
    "2026-09-30T10:00:00.000Z",
  );
  assert.equal(patch.caseStatus, "STRUCK_OUT");
  assert.equal(patch.l3StatusHistory.length, 1);
  assert.deepEqual(patch.l3StatusHistory[0], {
    at: "2026-09-30T10:00:00.000Z",
    by: "นิติกร",
    field: "caseStatus",
    from: "FIRST_PENDING",
    to: "STRUCK_OUT",
  });
});
t("ไม่มีอะไรเปลี่ยน → null", () => {
  assert.equal(
    Activity103.buildStatusChange(
      { opStatusType: "IN_PROGRESS" },
      { opStatusType: "IN_PROGRESS" },
      "x",
    ),
    null,
  );
});
t("ต่อท้ายประวัติเดิม ไม่แก้ array เดิม (immutable)", () => {
  const prev = [{ at: "a", by: "b", field: "caseStatus", from: "", to: "FIRST_PENDING" }];
  const kase = { caseStatus: "FIRST_PENDING", l3StatusHistory: prev };
  const patch = Activity103.buildStatusChange(kase, { caseStatus: "FINAL" }, "x", "t");
  assert.equal(patch.l3StatusHistory.length, 2);
  assert.equal(prev.length, 1);
});

console.log("\nActivity103.buildSupremeJudgmentPatch");
t("บันทึกผลศาลปกครองสูงสุด → คดีถึงที่สุด + สถานะปิดของสายงาน", () => {
  const patch = Activity103.buildSupremeJudgmentPatch(
    { statusCode: "L10_SENT_TO_PROSECUTOR", caseStatus: "SUPREME_PENDING" },
    {
      date: "2026-09-01",
      blackNo: "อ. 1/2569",
      redNo: "อ. 9/2570",
      result: "WIN",
      summary: "ศาลพิพากษายืน",
      fileNames: ["คำพิพากษา.pdf"],
    },
    "นิติกร",
    "t",
  );
  assert.equal(patch.statusCode, "L10_SUPREME_JUDGED");
  assert.equal(patch.caseStatus, "FINAL");
  assert.equal(patch.l3SupremeJudgment.result, "WIN");
  assert.equal(patch.l3SupremeJudgment.resultName, "ชนะคดี");
  assert.equal(patch.l3StatusHistory.length, 1);
});
t("สายมติบอร์ด (L9A) ได้สถานะปิดของตัวเอง", () => {
  const patch = Activity103.buildSupremeJudgmentPatch(
    { statusCode: "L9A_SENT_TO_PROSECUTOR" },
    { date: "2026-09-01", result: "LOSE", fileNames: [] },
    "นิติกร",
    "t",
  );
  assert.equal(patch.statusCode, "L9A_SUPREME_JUDGED");
  assert.equal(patch.l3SupremeJudgment.resultName, "แพ้คดี");
});

console.log(`\n${passed} passed\n`);
