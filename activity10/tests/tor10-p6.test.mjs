/* หน่วยทดสอบ TOR 10 — Phase P6 การแจ้งเตือน (10.1.6, 10.2.4, 10.1.9/10.2.6)
   - Activity10.buildAlerts  ระดับ/เรียงลำดับ/อายุความ/เกินกำหนด/หนังสือแจ้งภายใน/กรองตามบทบาท
   - Activity10.unitMatches  จับคู่ชื่อหน่วยงาน
   Run: node activity10/tests/tor10-p6.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
const { Activity10 } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const TODAY = new Date(2026, 9, 1); // 1 ต.ค. 2569 (ค.ศ. 2026)
const iso = (n) => {
  const d = new Date(2026, 9, 1 + n);
  const p = (x) => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
};
const kase = (o) => Object.assign({ id: "C1", assignedRole: "legal_officer", statusCode: "DRAFTING_OPINION" }, o);
const alerts = (cases, role, opts) => Activity10.buildAlerts(cases, role, TODAY, opts);

console.log("\nSLA");
t("เหลือ 5 วัน → danger, 12 วัน → warning, 30 วัน → ไม่แจ้ง", () => {
  const r = alerts([kase({ id: "A", dueDate: iso(5) }), kase({ id: "B", dueDate: iso(12) }), kase({ id: "C", dueDate: iso(30) })], "legal_officer");
  assert.deepEqual(r.map((x) => [x.caseId, x.level, x.daysLeft]), [["A", "danger", 5], ["B", "warning", 12]]);
});
t("เกินกำหนด → danger daysLeft ติดลบ; officerDeadline มาก่อน dueDate", () => {
  const r = alerts([kase({ dueDate: iso(-3) }), kase({ id: "D", dueDate: iso(40), officerDeadline: iso(2) })], "legal_officer");
  assert.equal(r[0].level, "danger");
  assert.equal(r[0].daysLeft, -3);
  assert.equal(r[1].daysLeft, 2);
});
t("สำนวนที่ปิดแล้วไม่แจ้งเตือน", () => {
  assert.equal(alerts([kase({ dueDate: iso(-3), statusCode: "COMPLETED" })], "legal_officer").length, 0);
});

console.log("\nอายุความ");
t("30 วัน → danger, 90 วัน → warning, 91 วัน → ไม่แจ้ง, หมดอายุ → danger", () => {
  const mk = (id, n) => kase({ id, prescriptionDate: iso(n) });
  const r = alerts([mk("P30", 30), mk("P90", 90), mk("P91", 91), mk("PX", -2)], "legal_officer").filter((x) => x.kind === "prescription");
  const by = Object.fromEntries(r.map((x) => [x.caseId, x.level]));
  assert.deepEqual(by, { PX: "danger", P30: "danger", P90: "warning" });
  assert.match(r.find((x) => x.caseId === "PX").title, /สิ้นสุดแล้ว/);
});

console.log("\nเรียงลำดับ");
t("danger ก่อน warning ก่อน info แล้วเรียงตามวันที่เหลือ", () => {
  const r = alerts(
    [
      kase({ id: "W", dueDate: iso(10) }),
      kase({ id: "D2", dueDate: iso(6) }),
      kase({ id: "D1", dueDate: iso(-1) }),
      kase({ id: "N", internalNotices: [{ units: ["กองกฎหมาย (กอท.)"], subject: "s" }] }),
    ],
    "legal_officer",
    { unit: "กองกฎหมาย" },
  );
  assert.deepEqual(r.map((x) => x.caseId), ["D1", "D2", "W", "N"]);
});

console.log("\nหนังสือแจ้งภายใน");
t("ส่งถึงหน่วยของผู้ใช้เท่านั้น (kind notice, info) และไม่ผูกกับสิทธิ์เห็นสำนวน", () => {
  const c = kase({ assignedRole: "dir_legal", internalNotices: [{ units: ["สำนักงาน ป.ป.ท. เขต 1"], docNo: "ปท 1/2", subject: "แจ้งผล" }] });
  const mine = alerts([c], "original_officer", { unit: "สนง. ป.ป.ท. เขต 1" });
  assert.equal(mine.length, 1);
  assert.equal(mine[0].kind, "notice");
  assert.equal(mine[0].level, "info");
  assert.equal(alerts([c], "original_officer", { unit: "สนง. ป.ป.ท. เขต 2" }).length, 0);
});
t("unitMatches: ตัดวงเล็บ/สนง.", () => {
  assert.ok(Activity10.unitMatches("กองกฎหมาย (กอท.)", "กองกฎหมาย"));
  assert.ok(Activity10.unitMatches("สำนักงาน ป.ป.ท. เขต 1", "สนง. ป.ป.ท. เขต 1"));
  assert.ok(!Activity10.unitMatches("กองบริหารคดี (กบค.)", "กองกฎหมาย"));
  assert.ok(!Activity10.unitMatches("", "กองกฎหมาย"));
});

console.log("\nกรองตามบทบาท");
t("บทบาททั่วไปเห็นเฉพาะที่ได้รับมอบหมาย; ธุรการ/ผอ.กองกฎหมายเห็นทุกสำนวน", () => {
  const cs = [kase({ id: "M", dueDate: iso(3) }), kase({ id: "O", dueDate: iso(3), assignedRole: "group_director" })];
  assert.deepEqual(alerts(cs, "legal_officer").map((x) => x.caseId), ["M"]);
  assert.equal(alerts(cs, "Nattapol.B").length, 1);
  assert.equal(alerts(cs, "admin_legal").length, 2);
  assert.equal(alerts(cs, "dir_legal").length, 2);
});

console.log("\nอุทธรณ์ 10.2");
t("appeal notify +3 / opinion +10 days from receive date", () => {
  const sc = "L2_PENDING_CASE_OWNER_APPEAL_OPINION";
  const pick = (recvOffset) =>
    Object.fromEntries(
      alerts([kase({ id: "L", statusCode: sc, l2AppealReceiveDate: iso(recvOffset) })], "legal_officer")
        .filter((x) => x.kind === "appeal")
        .map((x) => [x.id.split(":")[2], [x.level, x.daysLeft]]),
    );
  assert.deepEqual(pick(-2), { notify: ["danger", 1] });
  assert.deepEqual(pick(-5), { notify: ["danger", -2], opinion: ["warning", 5] });
});

console.log("\nรูปแบบข้อมูล");
t("id ไม่ซ้ำ และมี href ไปหน้าคิวงานพร้อม ?alert=", () => {
  const r = alerts([kase({ dueDate: iso(2), prescriptionDate: iso(10) })], "legal_officer");
  assert.equal(new Set(r.map((x) => x.id)).size, r.length);
  assert.ok(r.every((x) => /^01-work-inbox\.html\?(alert|tab)=/.test(x.href)));
  assert.deepEqual(Object.keys(r[0]).sort(), ["caseId", "daysLeft", "detail", "href", "id", "kind", "level", "title"]);
});
t("ไม่มีสำนวน/ค่าว่าง → []", () => {
  assert.deepEqual(alerts([], "legal_officer"), []);
  assert.deepEqual(alerts(null, "legal_officer"), []);
});

console.log("\n" + passed + " passed");
