/* หน่วยทดสอบ TOR 10 — Phase P5 (10.2 คำขอเปิดเผยข้อมูลข่าวสาร) ดู docs/tor10-change-plan.md
   - Activity102.computeDueDate        ครบกำหนดจากวันที่รับ (10.2.1.2(3)(4))
   - Activity102.sourceUnitLabel       ป้ายหน่วยงานที่เสนอ (10.2.1.2(2))
   - Activity102.buildIntakeSourcePatch ฟิลด์ต้นทาง/วันที่รับ/ครบกำหนด
   - Activity102.canFileAppeal / buildAppealIntakePatch  ยื่นอุทธรณ์ (10.2.1.1(2))
   - Activity102.canView102            สิทธิ์เห็นเรื่อง/เอกสารตามกติกา (10.2.7.3)
   - Activity102.buildAccessLogPatch   บันทึกการเปิดดู
   - Activity102.buildDecisionPatch    ประเภทมติ + ข้อความ (10.2.5)
   โหลด ecmis-activity10.js และ ecmis-10-2.js จริงเข้ามาทดสอบ
   Run: node activity10/tests/tor10-p5.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-10-2.js"))(sandbox);
const { Activity102 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\ncomputeDueDate");
t("คำขอ = วันที่รับ + 15 วัน", () => {
  assert.equal(Activity102.computeDueDate("2026-10-01", "10.2.1"), "2026-10-16");
});
t("อุทธรณ์ 10.2.2 = วันที่รับ + 30 วัน (ข้ามเดือน)", () => {
  assert.equal(Activity102.computeDueDate("2026-10-15", "10.2.2"), "2026-11-14");
});
t("ปี พ.ศ. ถูกแปลงเป็น ค.ศ.", () => {
  assert.equal(Activity102.computeDueDate("2569-10-01", "10.2.1"), "2026-10-16");
});
t("ค่าว่าง/ผิดรูปแบบ → ว่าง", () => {
  assert.equal(Activity102.computeDueDate("", "10.2.1"), "");
  assert.equal(Activity102.computeDueDate("x", "10.2.1"), "");
});

console.log("\nsourceUnitLabel");
t("ส่วนกลาง + หน่วยที่เลือก", () => {
  assert.equal(
    Activity102.sourceUnitLabel({ zone: "CENTRAL", unit: "กองกฎหมาย (กอท.)" }),
    "ส่วนกลาง: กองกฎหมาย (กอท.)",
  );
});
t("ส่วนกลาง + อื่นๆ ใช้ข้อความอิสระ", () => {
  assert.equal(
    Activity102.sourceUnitLabel({ zone: "CENTRAL", unit: "OTHER", unitOther: "กลุ่มตรวจสอบภายใน" }),
    "ส่วนกลาง: กลุ่มตรวจสอบภายใน",
  );
});
t("เขต → สำนักงาน ป.ป.ท. เขต n", () => {
  assert.equal(Activity102.sourceUnitLabel({ zone: "R3" }), "สำนักงาน ป.ป.ท. เขต 3");
  assert.equal(Activity102.sourceUnitLabel({ zone: "R9" }), "สำนักงาน ป.ป.ท. เขต 9");
});
t("ไม่ระบุ → ว่าง", () => {
  assert.equal(Activity102.sourceUnitLabel({}), "");
});

console.log("\nbuildIntakeSourcePatch");
t("ใช้วันที่รับที่กรอก ไม่ใช่วันนี้ และเขตเก็บเป็น sourceUnit", () => {
  const p = Activity102.buildIntakeSourcePatch({
    category: "10.2.1", zone: "R2", receivedDate: "2026-09-20",
  });
  assert.equal(p.dateReceived, "2026-09-20");
  assert.equal(p.requestReceivedDate, "2026-09-20");
  assert.equal(p.dueDate, "2026-10-05");
  assert.equal(p.sourceZone, "R2");
  assert.equal(p.sourceUnit, "สำนักงาน ป.ป.ท. เขต 2");
  assert.equal(p.source, "สำนักงาน ป.ป.ท. เขต 2");
});
t("ครบกำหนดที่แก้เองมีผลเหนือค่าคำนวณ", () => {
  const p = Activity102.buildIntakeSourcePatch({
    category: "10.2.1", zone: "CENTRAL", unit: "กองกฎหมาย (กอท.)",
    receivedDate: "2026-09-20", dueDate: "2026-10-30",
  });
  assert.equal(p.dueDate, "2026-10-30");
  assert.equal(p.sourceUnit, "กองกฎหมาย (กอท.)");
  assert.equal(p.source, "ส่วนกลาง: กองกฎหมาย (กอท.)");
});
t("อุทธรณ์ 10.2.2 → 30 วัน", () => {
  const p = Activity102.buildIntakeSourcePatch({ category: "10.2.2", zone: "CENTRAL", unit: "กองกฎหมาย (กอท.)", receivedDate: "2026-09-01" });
  assert.equal(p.dueDate, "2026-10-01");
});

console.log("\ncanFileAppeal / buildAppealIntakePatch");
const denied = { id: "คำร้อง-1", category: "10.2.1", l2ResolutionType: "DENY", statusCode: "L2_CASE_CLOSED_NOTICE_SENT", requesterName: "นายก" };
t("DENY ที่ปิดแล้วยื่นอุทธรณ์ได้", () => assert.equal(Activity102.canFileAppeal(denied), true));
t("PARTIAL ยื่นอุทธรณ์ได้", () =>
  assert.equal(Activity102.canFileAppeal({ ...denied, l2ResolutionType: "PARTIAL" }), true));
t("DISCLOSE ยื่นอุทธรณ์ไม่ได้", () =>
  assert.equal(Activity102.canFileAppeal({ ...denied, l2ResolutionType: "DISCLOSE" }), false));
t("อยู่ในขั้นอุทธรณ์อยู่แล้ว ยื่นซ้ำไม่ได้", () =>
  assert.equal(Activity102.canFileAppeal({ ...denied, statusCode: "L2_PENDING_APPEAL_INTAKE" }), false));
t("patch ย้ายเข้า L2_PENDING_APPEAL_INTAKE และเก็บผู้อุทธรณ์ (แก้ได้)", () => {
  const p = Activity102.buildAppealIntakePatch(denied, { appellantName: "นายข" }, "ธุรการ", "2026-10-01T00:00:00Z");
  assert.equal(p.statusCode, "L2_PENDING_APPEAL_INTAKE");
  assert.equal(p.assignedRole, "case_bureau_admin");
  assert.equal(p.l2AppellantName, "นายข");
  assert.equal(p.l2AppealFiledBy, "ธุรการ");
});
t("ไม่ระบุชื่อผู้อุทธรณ์ → ใช้ชื่อผู้ยื่นคำขอเดิม", () => {
  const p = Activity102.buildAppealIntakePatch(denied, {}, "x", "2026-10-01T00:00:00Z");
  assert.equal(p.l2AppellantName, "นายก");
});
t("เรื่องที่ยื่นไม่ได้ → null", () => {
  assert.equal(Activity102.buildAppealIntakePatch({ ...denied, l2ResolutionType: "DISCLOSE" }, {}, "x"), null);
});

console.log("\ncanView102");
const caseA = { category: "10.2.1", sourceUnit: "กองกฎหมาย (กอท.)", assignedRole: "dir_legal" };
t("บทบาทกฎหมายเห็นทุกเรื่อง", () => {
  for (const r of ["admin_legal", "dir_legal", "group_director"])
    assert.equal(Activity102.canView102(caseA, r, "หน่วยอื่น"), true);
});
t("เลขาฯ/อนุกรรมการ: เห็นเมื่อมอบหมายถึง", () => {
  assert.equal(Activity102.canView102({ ...caseA, assignedRole: "sub_secretariat" }, "sub_secretariat", ""), true);
});
t("เลขาฯ: เห็นเมื่อเรื่องผ่านขั้นของตนแล้ว (l2StepSeq >= ขั้นแรกของบทบาท)", () => {
  assert.equal(Activity102.canView102({ ...caseA, l2StepSeq: 12 }, "sub_secretariat", ""), true);
});
t("เลขาฯ: เรื่องที่ยังไม่ถึงขั้นและไม่ได้มอบหมาย → ไม่เห็น", () => {
  assert.equal(Activity102.canView102({ ...caseA, l2StepSeq: 6 }, "sub_secretariat", ""), false);
});
t("หน่วยงานที่ถูกจำกัดตามหน่วย: เห็นเฉพาะเรื่องของหน่วยตน", () => {
  assert.equal(Activity102.canView102(caseA, "district_admin", "สำนักงาน ป.ป.ท. เขต 1"), false);
  assert.equal(
    Activity102.canView102({ ...caseA, sourceUnit: "สำนักงาน ป.ป.ท. เขต 1" }, "district_admin", "สำนักงาน ป.ป.ท. เขต 1"),
    true,
  );
});
t("เรื่องเก่าที่ไม่มี sourceUnit ยังเห็นได้ (คงพฤติกรรมเดิมของ demo)", () => {
  assert.equal(Activity102.canView102({ category: "10.2.1" }, "district_admin", "เขต 1"), true);
});
t("บทบาทที่ไม่อยู่ในกติกา คงพฤติกรรมเดิม (เห็นได้)", () => {
  assert.equal(Activity102.canView102(caseA, "case_bureau_director", ""), true);
});
t("เรื่องที่ไม่ใช่ 10.2 → เห็นได้เสมอ (ไม่ใช่ขอบเขตกติกานี้)", () => {
  assert.equal(Activity102.canView102({ category: "10.1" }, "district_admin", "x"), true);
});

console.log("\ncanOpenFile102");
t("ไฟล์ลับ เปิดได้เฉพาะบทบาทกฎหมาย", () => {
  const k = { ...caseA, l2StepSeq: 12, l2ConfidentialFiles: ["ลับ.pdf"] };
  assert.equal(Activity102.canOpenFile102(k, "ลับ.pdf", "dir_legal", ""), true);
  assert.equal(Activity102.canOpenFile102(k, "ลับ.pdf", "sub_secretariat", ""), false);
  assert.equal(Activity102.canOpenFile102(k, "ทั่วไป.pdf", "sub_secretariat", ""), true);
});

console.log("\nbuildAccessLogPatch");
t("ต่อท้าย l2AccessLog ไม่แก้ของเดิม", () => {
  const k = { l2AccessLog: [{ who: "a" }] };
  const p = Activity102.buildAccessLogPatch(k, { who: "b", roleId: "dir_legal", action: "VIEW" }, "2026-10-01T00:00:00Z");
  assert.equal(p.l2AccessLog.length, 2);
  assert.equal(k.l2AccessLog.length, 1);
  assert.equal(p.l2AccessLog[1].at, "2026-10-01T00:00:00Z");
});

console.log("\nbuildDecisionPatch");
t("ประเภทมติ + ข้อความ → ชื่อประเภทและรายละเอียด", () => {
  const p = Activity102.buildDecisionPatch({ type: "PARTIAL", text: "เปิดเผยบางส่วน" });
  assert.equal(p.type, "PARTIAL");
  assert.equal(p.typeName, "อนุญาตเปิดเผยบางส่วน");
  assert.equal(p.text, "เปิดเผยบางส่วน");
});
t("ประเภทไม่รู้จัก → null", () => assert.equal(Activity102.buildDecisionPatch({ type: "ZZZ", text: "x" }), null));
t("ไม่มีประเภท → null", () => assert.equal(Activity102.buildDecisionPatch({ text: "x" }), null));

console.log("\n" + passed + " passed");
