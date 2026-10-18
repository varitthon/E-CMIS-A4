/* หน่วยทดสอบ TOR 10 — Phase P4 (10.1.8 / 10.1.10 / 10.1.11) ดู docs/tor10-change-plan.md
   - Activity10.buildBoardResolutionReport  รายงานผลตามมติคณะกรรมการ        (10.1.8)
   - Activity10.buildJudgmentRegistry       สารบบคำวินิจฉัย/คำพิพากษา        (10.1.10)
   - Activity10.filterJudgmentRegistry      กรองสารบบ (ประเภท/คำค้น)        (10.1.10.8)
   - Activity10.buildJudgmentAnalysisPatch  บันทึกผลวิเคราะห์คำพิพากษา        (10.1.11.1)
   - Activity10.mapAnalysisImportRows       แม่แบบ Excel → ผลวิเคราะห์        (10.1.11.1)
   - Activity10.buildJudgmentStats          รายงานเชิงปริมาณ                 (10.1.11.2)
   - Activity10.buildCourtCaseSummaryRows   สรุปคดีชั้นศาล                   (10.1.11.3)
   - ECMISExport.buildReportHtml            เค้าโครง A4 สำหรับพิมพ์/ส่งออก    (10.1.11.3-.5)

   Run: node activity10/tests/tor10-p4.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-export.js"))(sandbox);
const { Activity10, ECMISExport } = sandbox;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const cases = [
  {
    id: "A-1",
    category: "10.1",
    title: "คดี A",
    status: "รอศาล",
    accuser: "สำนักงาน ป.ป.ท.",
    accused: "นายก",
    dateReceived: "2025-10-05",
    boardMeetingNo: "5/2569",
    boardMeetingDate: "2025-11-20",
    boardAgendaNo: "3.1",
    boardResolutionType: "AGREE",
    boardResolution: "เห็นชอบให้ฟ้อง",
    boardResolutionFiles: ["มติ.pdf"],
    oagVerdictNo: "อส 1/6801",
    oagVerdictDate: "2025-12-01",
    oagVerdictDecision: "PROSECUTE",
    oagVerdictSummary: "ให้ฟ้อง",
    oagVerdictFile: "oag.pdf",
    courtBlackNo: "อ.1/69",
    courtRedNo: "อ.9/69",
    courtName: "ศาลอาญา",
    judgments: [
      { level: "FIRST", issuer: "ศาลอาญา", blackNo: "อ.1/69", redNo: "อ.9/69", date: "2026-01-10", result: "ลงโทษจำคุก 2 ปี", summary: "ผิดจริง", isFinal: false, fileNames: ["j1.pdf"] },
      { level: "APPEAL", issuer: "ศาลอุทธรณ์", blackNo: "", redNo: "", date: "2026-06-10", result: "ยกฟ้อง", summary: "", isFinal: true, fileNames: [] },
    ],
    internalNotices: [{ subject: "แจ้ง กบค.", units: ["กองบริหารคดี (กบค.)"], date: "2026-02-01" }],
  },
  {
    id: "B-2",
    category: "10.1",
    title: "คดี B",
    status: "ปิดคดี",
    accuser: "ป.ป.ท.",
    accused: "นายข",
    dateReceived: "2026-03-01",
    boardMeetingNo: "2/2569",
    boardMeetingDate: "2026-04-01",
    boardResolutionType: "DISAGREE",
    boardResolution: "ไม่เห็นชอบ",
    judgments: [{ level: "PROSECUTOR", issuer: "อัยการ", date: "2026-05-01", result: "สั่งไม่ฟ้อง", fileNames: [] }],
  },
  { id: "C-3", category: "10.2", title: "10.2", boardMeetingNo: "9/1", judgments: [{ level: "FIRST", date: "2026-01-01", result: "ลงโทษ" }] },
  { id: "D-4", title: "ไม่มี category = 10.1", accused: "นายง", dateReceived: "2026-08-01" },
];

console.log("\nbuildBoardResolutionReport (10.1.8)");
t("เฉพาะ 10.1 ที่มีมติ + นับการดำเนินการหลังมติ", () => {
  const rows = Activity10.buildBoardResolutionReport(cases, {});
  assert.deepEqual(rows.map((r) => r.caseId), ["A-1", "B-2"]);
  const a = rows[0];
  assert.equal(a.meetingNo, "5/2569");
  assert.equal(a.resolutionTypeName, "เห็นชอบ");
  assert.equal(a.judgmentCount, 2);
  assert.equal(a.latestJudgment.result, "ยกฟ้อง");
  assert.equal(a.latestJudgment.levelName, "ศาลอุทธรณ์");
  assert.equal(a.noticeCount, 1);
  assert.equal(a.status, "รอศาล");
});
t("ปีงบประมาณจากวันประชุม (พ.ย. 2025 → 2569)", () => {
  const rows = Activity10.buildBoardResolutionReport(cases, {});
  assert.equal(rows[0].fiscalYear, "2569");
});
t("fallback ใช้ dateReceived เมื่อไม่มีวันประชุม", () => {
  const rows = Activity10.buildBoardResolutionReport(
    [{ id: "X", boardResolutionType: "AGREE", dateReceived: "2025-01-05" }],
    {},
  );
  assert.equal(rows[0].fiscalYear, "2568");
});
t("กรองตามปีงบประมาณและประเภทมติ", () => {
  assert.deepEqual(Activity10.buildBoardResolutionReport(cases, { fiscalYear: "2569" }).map((r) => r.caseId), ["A-1", "B-2"]);
  assert.deepEqual(Activity10.buildBoardResolutionReport(cases, { fiscalYear: "2570" }).map((r) => r.caseId), []);
  assert.deepEqual(Activity10.buildBoardResolutionReport(cases, { type: "DISAGREE" }).map((r) => r.caseId), ["B-2"]);
});
t("ค่าว่าง/null → []", () => {
  assert.deepEqual(Activity10.buildBoardResolutionReport(null, {}), []);
});

console.log("\nbuildJudgmentRegistry (10.1.10)");
t("รวม อสส. + คำพิพากษารายชั้น + มติ ของ 10.1 เท่านั้น", () => {
  const reg = Activity10.buildJudgmentRegistry(cases);
  const kinds = reg.map((r) => r.kind).sort();
  assert.deepEqual(kinds, ["APPEAL", "BOARD", "BOARD", "FIRST", "OAG", "PROSECUTOR"]);
  assert.ok(reg.every((r) => r.caseId !== "C-3"));
});
t("แต่ละแถวมีคู่ความ เลขดำ/แดง ผล ไฟล์", () => {
  const reg = Activity10.buildJudgmentRegistry(cases);
  const first = reg.find((r) => r.kind === "FIRST");
  assert.equal(first.caseId, "A-1");
  assert.equal(first.accuser, "สำนักงาน ป.ป.ท.");
  assert.equal(first.accused, "นายก");
  assert.equal(first.blackNo, "อ.1/69");
  assert.equal(first.result, "ลงโทษจำคุก 2 ปี");
  assert.deepEqual(first.fileNames, ["j1.pdf"]);
  assert.equal(first.kindName, "ศาลชั้นต้น");
  const oag = reg.find((r) => r.kind === "OAG");
  assert.equal(oag.blackNo, "อส 1/6801");
  assert.deepEqual(oag.fileNames, ["oag.pdf"]);
  const board = reg.find((r) => r.kind === "BOARD" && r.caseId === "A-1");
  assert.deepEqual(board.fileNames, ["มติ.pdf"]);
  assert.equal(board.kindName, "มติคณะกรรมการ ป.ป.ท.");
});
t("เรียงวันที่ล่าสุดก่อน วันที่ว่างอยู่ท้าย", () => {
  const reg = Activity10.buildJudgmentRegistry(cases);
  const dates = reg.map((r) => r.date).filter(Boolean);
  assert.deepEqual(dates, dates.slice().sort().reverse());
});
t("ไม่ชนิด mutate ข้อมูลเดิม", () => {
  const before = JSON.stringify(cases);
  Activity10.buildJudgmentRegistry(cases);
  assert.equal(JSON.stringify(cases), before);
});
t("filterJudgmentRegistry: ประเภท + คำค้นเลขสำนวน/ผู้ถูกกล่าวหา/ผู้กล่าวหา", () => {
  const reg = Activity10.buildJudgmentRegistry(cases);
  assert.deepEqual(Activity10.filterJudgmentRegistry(reg, { kind: "FIRST" }).map((r) => r.caseId), ["A-1"]);
  assert.ok(Activity10.filterJudgmentRegistry(reg, { q: "นายข" }).every((r) => r.caseId === "B-2"));
  assert.ok(Activity10.filterJudgmentRegistry(reg, { q: "a-1" }).every((r) => r.caseId === "A-1"));
  assert.ok(Activity10.filterJudgmentRegistry(reg, { q: "ป.ป.ท." }).length >= 2);
  assert.equal(Activity10.filterJudgmentRegistry(reg, { q: "ไม่มีจริง" }).length, 0);
  assert.equal(Activity10.filterJudgmentRegistry(reg, {}).length, reg.length);
});

console.log("\nbuildJudgmentAnalysisPatch (10.1.11.1)");
const when = "2026-10-01T00:00:00.000Z";
t("ต่อท้าย judgmentAnalyses[] แบบ immutable", () => {
  const prev = { judgmentAnalyses: [{ id: "JA-001" }] };
  const patch = Activity10.buildJudgmentAnalysisPatch(
    prev,
    { judgmentRef: "0", issue: "ประเด็น", summary: "สรุป", analysis: "วิเคราะห์", recommendation: "เสนอ", analyst: "นิติกร", date: "2026-09-30", fileNames: ["a.pdf", " "] },
    "ผู้บันทึก",
    when,
  );
  assert.equal(patch.judgmentAnalyses.length, 2);
  assert.equal(prev.judgmentAnalyses.length, 1);
  const n = patch.judgmentAnalyses[1];
  assert.equal(n.id, "JA-002");
  assert.equal(n.inputMethod, "FORM");
  assert.deepEqual(n.fileNames, ["a.pdf"]);
  assert.equal(n.judgmentRef, "0");
  assert.equal(n.createdAt, when);
  assert.equal(n.analyst, "นิติกร");
});
t("ขาดประเด็นหรือผลวิเคราะห์ → null", () => {
  assert.equal(Activity10.buildJudgmentAnalysisPatch({}, { issue: "x", analysis: "" }), null);
  assert.equal(Activity10.buildJudgmentAnalysisPatch({}, { issue: "x", analysis: " " }), null);
  assert.equal(Activity10.buildJudgmentAnalysisPatch({}, null), null);
});
t("รับ array (นำเข้า Excel) และเก็บ inputMethod=IMPORT", () => {
  const patch = Activity10.buildJudgmentAnalysisPatch(
    {},
    [
      { issue: "a", analysis: "b", inputMethod: "IMPORT" },
      { issue: "ผิด", analysis: "" },
      { issue: "c", analysis: "d", inputMethod: "IMPORT" },
    ],
    "u",
    when,
  );
  assert.equal(patch.judgmentAnalyses.length, 2);
  assert.deepEqual(patch.judgmentAnalyses.map((x) => x.id), ["JA-001", "JA-002"]);
  assert.ok(patch.judgmentAnalyses.every((x) => x.inputMethod === "IMPORT"));
});

console.log("\nmapAnalysisImportRows (แม่แบบ Excel)");
const H = Activity10.ANALYSIS_TEMPLATE_HEADERS;
t("หัวคอลัมน์แม่แบบมี 7 ช่อง", () => {
  assert.equal(H.length, 7);
  assert.equal(H[0], "ประเด็นแห่งคดี");
});
t("แปลงแถว → ผลวิเคราะห์ ผูกคำพิพากษาตามชั้นล่าสุด", () => {
  const rows = [
    { [H[0]]: "ประเด็น 1", [H[1]]: "สรุป", [H[2]]: "วิเคราะห์", [H[3]]: "เสนอ", [H[4]]: "ศาลอุทธรณ์", [H[5]]: "นิติกร", [H[6]]: "2026-09-01" },
  ];
  const r = Activity10.mapAnalysisImportRows(rows, cases[0]);
  assert.equal(r.errors.length, 0);
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].judgmentRef, "1");
  assert.equal(r.items[0].inputMethod, "IMPORT");
  assert.equal(r.items[0].date, "2026-09-01");
});
t("แถวว่างข้าม แถวขาดข้อมูลรายงาน error พร้อมเลขแถว", () => {
  const rows = [
    { [H[0]]: "", [H[2]]: "" },
    { [H[0]]: "มีแต่ประเด็น" },
    { [H[0]]: "ok", [H[2]]: "ok", [H[4]]: "ไม่มีชั้นนี้" },
  ];
  const r = Activity10.mapAnalysisImportRows(rows, cases[0]);
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].judgmentRef, "");
  assert.deepEqual(r.errors.map((e) => e.row), [3]);
});
t("วันที่แบบเลข serial ของ Excel → ISO", () => {
  const r = Activity10.mapAnalysisImportRows([{ [H[0]]: "a", [H[2]]: "b", [H[6]]: 46000 }], cases[0]);
  assert.equal(r.items[0].date, "2025-12-09");
});
t("ไม่มีแถว/ไม่ใช่ array → ว่าง", () => {
  assert.deepEqual(Activity10.mapAnalysisImportRows(null, {}), { items: [], errors: [] });
});

console.log("\nbuildJudgmentStats (10.1.11.2)");
t("นับตามชั้นและผลลัพธ์ (10.1 เท่านั้น)", () => {
  const s = Activity10.buildJudgmentStats(cases, {});
  assert.equal(s.totalJudgments, 3);
  assert.equal(s.totalCases, 2);
  assert.equal(s.finalCount, 1);
  const first = s.levels.find((l) => l.code === "FIRST");
  assert.equal(first.total, 1);
  assert.equal(first.outcomes.CONVICT, 1);
  assert.equal(s.levels.find((l) => l.code === "APPEAL").outcomes.ACQUIT, 1);
  assert.equal(s.levels.find((l) => l.code === "PROSECUTOR").outcomes.NON_PROSECUTE, 1);
  assert.equal(s.outcomes.CONVICT, 1);
  assert.deepEqual(s.byFiscalYear, [{ fiscalYear: "2569", total: 3 }]);
});
t("กรองตามปีงบประมาณ", () => {
  assert.equal(Activity10.buildJudgmentStats(cases, { fiscalYear: "2570" }).totalJudgments, 0);
  assert.equal(Activity10.buildJudgmentStats(cases, { fiscalYear: "2569" }).totalJudgments, 3);
});
t("นับจำนวนผลวิเคราะห์ที่บันทึก", () => {
  const c = [{ id: "Z", judgments: [], judgmentAnalyses: [{ id: "1" }, { id: "2" }] }];
  assert.equal(Activity10.buildJudgmentStats(c, {}).analysisCount, 2);
});
t("judgmentOutcomeOf จัดกลุ่มข้อความผล", () => {
  const o = Activity10.judgmentOutcomeOf;
  assert.equal(o("ศาลยกฟ้อง"), "ACQUIT");
  assert.equal(o("พิพากษาว่าไม่มีความผิด"), "ACQUIT");
  assert.equal(o("อัยการสั่งไม่ฟ้อง"), "NON_PROSECUTE");
  assert.equal(o("ลงโทษจำคุก"), "CONVICT");
  assert.equal(o("อัยการสั่งฟ้อง"), "PROSECUTE");
  assert.equal(o("ยืนตามศาลชั้นต้น"), "OTHER");
  assert.equal(o(""), "OTHER");
});

console.log("\nbuildCourtCaseSummaryRows (10.1.11.3)");
t("หนึ่งแถวต่อสำนวนที่มีคำพิพากษา แสดงชั้นล่าสุด", () => {
  const rows = Activity10.buildCourtCaseSummaryRows(cases);
  assert.deepEqual(rows.map((r) => r.caseId), ["A-1", "B-2"]);
  assert.equal(rows[0].latestLevelName, "ศาลอุทธรณ์");
  assert.equal(rows[0].latestResult, "ยกฟ้อง");
  assert.equal(rows[0].isFinal, true);
  assert.equal(rows[0].judgmentCount, 2);
  assert.equal(rows[0].blackNo, "อ.1/69");
});

console.log("\nbuildAnalysisReportRows (เชิงคุณภาพ)");
t("แตกผลวิเคราะห์ต่อสำนวนเป็นแถว พร้อมชั้นของคำพิพากษาที่อ้าง", () => {
  const c = [
    { id: "Q", category: "10.1", title: "คดี Q", judgments: [{ level: "FIRST", result: "ลงโทษ", summary: "ส" }], judgmentAnalyses: [{ id: "JA-001", judgmentRef: "0", issue: "i", summary: "s", analysis: "a", recommendation: "r", analyst: "n", date: "2026-09-01", inputMethod: "FORM", fileNames: [] }] },
    { id: "R", category: "10.1", judgments: [] },
  ];
  const rows = Activity10.buildAnalysisReportRows(c, {});
  assert.equal(rows.length, 1);
  assert.equal(rows[0].caseId, "Q");
  assert.equal(rows[0].levelName, "ศาลชั้นต้น");
  assert.equal(rows[0].issue, "i");
  assert.equal(Activity10.buildAnalysisReportRows(c, { fiscalYear: "2500" }).length, 0);
});

console.log("\nECMISExport.buildReportHtml (พิมพ์/ส่งออก A4)");
t("มีหัวสำนักงาน ชื่อรายงาน วันที่ และช่องลงนาม", () => {
  const html = ECMISExport.buildReportHtml({ title: "รายงาน <ทดสอบ>", bodyHtml: "<table></table>", dateText: "1 ต.ค. 2569" });
  assert.ok(html.includes("สำนักงาน ป.ป.ท."));
  assert.ok(html.includes("รายงาน &lt;ทดสอบ&gt;"));
  assert.ok(html.includes("1 ต.ค. 2569"));
  assert.ok(html.includes("ลงชื่อ"));
  assert.ok(html.includes("@page"));
  assert.ok(html.includes("<table></table>"));
});
t("rowsToHtmlTable escape ค่าและใส่หัวตาราง", () => {
  const h = ECMISExport.rowsToHtmlTable([["ก", "ข"], ["<b>", "2"]]);
  assert.ok(h.includes("<th>ก</th>"));
  assert.ok(h.includes("&lt;b&gt;"));
});

t("import: issue optional, analysis only -> accepted", () => {
  const r = Activity10.mapAnalysisImportRows([{ [H[2]]: "analysis only" }], {});
  assert.equal(r.errors.length, 0);
  assert.equal(r.items.length, 1);
});

console.log("\n" + passed + " passed");
