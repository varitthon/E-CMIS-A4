/* หน่วยทดสอบ TOR 10 — P8 (10.1.8 ปิดงานรายงานผลตามมติ + 10.1.11 ผลวิเคราะห์เฉพาะสำนวนที่ชี้มูล)
   - Activity10.isChiMoonCase            สำนวนที่ชี้มูล (มีมติคณะกรรมการ)
   - Activity10.parseCaseDateIso         แปลงวันที่ ISO / dd-mm-yyyy / "24 ส.ค. 2569" → ISO
   - Activity10.buildResolutionActions   ไทม์ไลน์การดำเนินการหลังมติ
   - Activity10.buildBoardResolutionReport  วันนับจากมติ / เกินกำหนด 30 วัน / ตัวกรองครั้งที่ประชุม-สถานะ
   - Activity10.groupBoardReportByMeeting / boardReportTableRows  จัดกลุ่มตามการประชุม + ตารางเดียวสำหรับส่งออก

   Run: node activity10/tests/tor10-p8.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
const { Activity10: A } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const TODAY = new Date(2026, 0, 31); /* 31 ม.ค. 2026 */

const base = {
  id: "A-1",
  category: "10.1",
  title: "คดี A",
  status: "รอศาล",
  dateReceived: "2025-10-05",
  boardMeetingNo: "5/2569",
  boardMeetingDate: "2025-12-20",
  boardAgendaNo: "3.1",
  boardResolutionType: "AGREE",
  boardResolution: "เห็นชอบให้ฟ้อง",
  adminDispatchDate: "2025-11-01" /* ก่อนวันประชุม → ต้องไม่แสดง */,
  finalDispatchDate: "2025-12-25",
  dispatchRecipients: [{ key: "oag", name: "อสส.", sentDate: "2025-12-28" }],
  oagVerdictDate: "2026-01-10",
  oagVerdictDecision: "PROSECUTE",
  judgments: [{ level: "FIRST", result: "ลงโทษ", date: "2026-01-20" }],
  internalNotices: [{ subject: "แจ้ง กบค.", units: ["กบค."], date: "2026-01-25" }],
};

console.log("isChiMoonCase");
t("10.1 ที่มีมติ → true", () => assert.equal(A.isChiMoonCase(base), true));
t("มีแค่ประเภทมติ/ข้อความมติ → true", () => {
  assert.equal(A.isChiMoonCase({ category: "10.1", boardResolutionType: "AGREE" }), true);
  assert.equal(A.isChiMoonCase({ boardResolution: "x" }), true);
});
t("ไม่มีมติ / ไม่ใช่ 10.1 / null → false", () => {
  assert.equal(A.isChiMoonCase({ category: "10.1" }), false);
  assert.equal(A.isChiMoonCase({ category: "10.2", boardMeetingNo: "1/1" }), false);
  assert.equal(A.isChiMoonCase(null), false);
});

console.log("\nisLegalViewRole");
t("บทบาทสายกฎหมาย (รวมชื่อ login เดิม) เห็นได้ อื่นไม่ได้", () => {
  assert.equal(A.isLegalViewRole("legal_officer"), true);
  assert.equal(A.isLegalViewRole("Nattapol.B"), true);
  assert.equal(A.isLegalViewRole("Kanda.R"), true);
  assert.equal(A.isLegalViewRole("sub_secretariat"), false);
  assert.equal(A.isLegalViewRole("Pimchanok.T"), false);
  assert.equal(A.isLegalViewRole(""), false);
});

console.log("\nparseCaseDateIso");
t("ISO / พ.ศ. / dd-mm-yyyy / ไทยย่อ", () => {
  assert.equal(A.parseCaseDateIso("2025-11-20"), "2025-11-20");
  assert.equal(A.parseCaseDateIso("2568-11-20"), "2025-11-20");
  assert.equal(A.parseCaseDateIso("20-11-2568"), "2025-11-20");
  assert.equal(A.parseCaseDateIso("5/1/2026"), "2026-01-05");
  assert.equal(A.parseCaseDateIso("24 ส.ค. 2569"), "2026-08-24");
  assert.equal(A.parseCaseDateIso("3 มกราคม 2569"), "2026-01-03");
});
t("ว่าง/ผิดรูปแบบ → ''", () => {
  assert.equal(A.parseCaseDateIso(""), "");
  assert.equal(A.parseCaseDateIso("-"), "");
  assert.equal(A.parseCaseDateIso(null), "");
  assert.equal(A.parseCaseDateIso("ไม่ทราบ"), "");
});

console.log("\nisCaseClosed");
t("isCompleted หรือ statusCode COMPLETED/CLOSED", () => {
  assert.equal(A.isCaseClosed({ isCompleted: true }), true);
  assert.equal(A.isCaseClosed({ statusCode: "COMPLETED_OAG_RESOLVED" }), true);
  assert.equal(A.isCaseClosed({ statusCode: "L3B_CLOSED" }), true);
  assert.equal(A.isCaseClosed({ statusCode: "PENDING_DIRECTOR" }), false);
});

console.log("\nbuildResolutionActions");
t("เรียงตามวันที่ และตัดรายการก่อนวันประชุม", () => {
  const acts = A.buildResolutionActions(base);
  assert.deepEqual(acts.map((a) => a.date), ["2025-12-25", "2025-12-28", "2026-01-10", "2026-01-20", "2026-01-25"]);
  assert.ok(acts.every((a) => a.date >= "2025-12-20"));
});
t("ครอบคลุมส่งหนังสือ / อสส. / คำพิพากษา / แจ้งภายใน", () => {
  const kinds = A.buildResolutionActions(base).map((a) => a.kind);
  assert.deepEqual(kinds, ["DISPATCH", "DISPATCH", "OAG", "JUDGMENT", "NOTICE"]);
});
t("สำนวนปิดแล้ว มีรายการปิดเรื่องตามวันที่ปิด", () => {
  const acts = A.buildResolutionActions({ ...base, isCompleted: true, caseClosedDate: "2026-01-28" });
  const last = acts[acts.length - 1];
  assert.equal(last.kind, "CLOSED");
  assert.equal(last.date, "2026-01-28");
});
t("ไม่มีวันที่ประชุม → ไม่ตัด; วันที่อ่านไม่ได้ → ข้าม", () => {
  const acts = A.buildResolutionActions({ ...base, boardMeetingDate: "", adminDispatchDate: "2025-11-01", finalDispatchDate: "x" });
  assert.equal(acts[0].date, "2025-11-01");
  assert.ok(!acts.some((a) => a.date === ""));
});
t("ไม่แก้สำนวนเดิม (immutable)", () => {
  const copy = JSON.stringify(base);
  A.buildResolutionActions(base);
  assert.equal(JSON.stringify(base), copy);
});

console.log("\nbuildBoardResolutionReport — วันนับจากมติ / เกินกำหนด");
const rowsOf = (cs, f) => A.buildBoardResolutionReport(cs, f || {}, TODAY);
t("RESOLUTION_OVERDUE_DAYS = 30", () => assert.equal(A.RESOLUTION_OVERDUE_DAYS, 30));
t("วันนับจากมติ + เกิน 30 วัน และยังไม่ปิด = overdue", () => {
  const r = rowsOf([base])[0];
  assert.equal(r.daysSinceResolution, 42);
  assert.equal(r.isOverdue, true);
  assert.equal(r.statusKey, "overdue");
  assert.equal(r.isClosed, false);
  assert.equal(r.actions.length, 5);
});
t("ภายใน 30 วัน = progress (ไม่ใช่ overdue); พอดี 30 วันไม่เกิน", () => {
  const near = { ...base, id: "N", boardMeetingDate: "2026-01-01" };
  const r30 = rowsOf([near])[0];
  assert.equal(r30.daysSinceResolution, 30);
  assert.equal(r30.isOverdue, false);
  assert.equal(r30.statusKey, "progress");
});
t("ปิดแล้ว ไม่เป็น overdue แม้เกิน 30 วัน", () => {
  const r = rowsOf([{ ...base, isCompleted: true, caseClosedDate: "2026-01-28" }])[0];
  assert.equal(r.statusKey, "closed");
  assert.equal(r.isOverdue, false);
  assert.equal(r.closedDate, "2026-01-28");
});
t("ไม่มีวันที่ประชุม → daysSinceResolution null ไม่ overdue", () => {
  const r = rowsOf([{ ...base, boardMeetingDate: "" }])[0];
  assert.equal(r.daysSinceResolution, null);
  assert.equal(r.isOverdue, false);
});
t("ฟิลด์เดิมยังอยู่ (judgmentCount/noticeCount/latestJudgment/oagVerdictDate)", () => {
  const r = rowsOf([base])[0];
  assert.equal(r.judgmentCount, 1);
  assert.equal(r.noticeCount, 1);
  assert.equal(r.latestJudgment.result, "ลงโทษ");
  assert.equal(r.oagVerdictDate, "2026-01-10");
  assert.equal(r.fiscalYear, "2569");
});

console.log("\nตัวกรองครั้งที่ประชุม / สถานะ");
const set = [
  base,
  { ...base, id: "B", boardMeetingNo: "6/2569", boardMeetingDate: "2026-01-20", status: "x" },
  { ...base, id: "C", isCompleted: true, caseClosedDate: "2026-01-28" },
  { id: "D", category: "10.1", title: "ไม่มีมติ" },
];
t("meetingNo", () => assert.deepEqual(rowsOf(set, { meetingNo: "6/2569" }).map((r) => r.caseId), ["B"]));
t("status progress = ยังไม่ปิด (รวมเกินกำหนด)", () =>
  assert.deepEqual(rowsOf(set, { status: "progress" }).map((r) => r.caseId), ["A-1", "B"]));
t("status closed", () => assert.deepEqual(rowsOf(set, { status: "closed" }).map((r) => r.caseId), ["C"]));
t("status overdue", () => assert.deepEqual(rowsOf(set, { status: "overdue" }).map((r) => r.caseId), ["A-1"]));
t("ตัวกรองรวมกับ fiscalYear/type เดิม", () => {
  assert.equal(rowsOf(set, { fiscalYear: "2569", type: "AGREE", status: "closed" }).length, 1);
  assert.equal(rowsOf(set, { type: "OTHER_TYPE" }).length, 0);
});

console.log("\ngroupBoardReportByMeeting");
t("จัดกลุ่มตามครั้งที่+วันที่ประชุม เรียงใหม่→เก่า พร้อมนับ", () => {
  const g = A.groupBoardReportByMeeting(rowsOf(set));
  assert.deepEqual(g.map((x) => x.meetingNo), ["6/2569", "5/2569"]);
  const g5 = g[1];
  assert.equal(g5.total, 2);
  assert.equal(g5.closed, 1);
  assert.equal(g5.inProgress, 1);
  assert.equal(g5.overdue, 1);
  assert.deepEqual(g5.agendaNos, ["3.1"]);
  assert.equal(g5.rows.length, 2);
});
t("ว่าง → []", () => assert.deepEqual(A.groupBoardReportByMeeting([]), []));

console.log("\nboardReportTableRows (ตารางเดียว)");
t("หัวตาราง + แถวหัวกลุ่มประชุม + แถวสำนวน; คอลัมน์เท่ากันทุกแถว", () => {
  const rows = A.boardReportTableRows(A.groupBoardReportByMeeting(rowsOf(set)));
  const width = rows[0].length;
  assert.ok(rows.every((r) => r.length === width));
  assert.equal(rows.length, 1 + 2 + 3);
  assert.ok(rows[1][0].includes("6/2569"));
  assert.ok(rows[1][0].includes("ทั้งหมด 1"));
  const caseRow = rows.find((r) => r[2].includes("A-1"));
  assert.ok(caseRow.join("|").includes("เกินกำหนด"));
  assert.ok(caseRow[width - 1].includes("แจ้ง กบค."));
});
t("ไม่มีข้อมูล → มีเฉพาะหัวตาราง", () => {
  const rows = A.boardReportTableRows([]);
  assert.equal(rows.length, 1);
});

console.log("\nbuildJudgmentAnalysisPatch — ประเด็นแห่งคดีไม่บังคับ");
t("ไม่ระบุประเด็นแต่มีผลวิเคราะห์ → บันทึกได้; ไม่มีผลวิเคราะห์ → null", () => {
  const p = A.buildJudgmentAnalysisPatch({}, { issue: "", analysis: "ผลวิเคราะห์" }, "u");
  assert.equal(p.judgmentAnalyses.length, 1);
  assert.equal(p.judgmentAnalyses[0].issue, "");
  assert.equal(A.buildJudgmentAnalysisPatch({}, { issue: "x", analysis: " " }, "u"), null);
});

console.log("\n" + passed + " passed");
