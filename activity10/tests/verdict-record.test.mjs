/* หน่วยทดสอบ บันทึกผลคำพิพากษา (ecmis-verdict-lists/record/doc.js)
   - เงื่อนไขแสดงการ์ดในหน้า 02 (กรณีอัยการ 3–9) และชั้นศาลจากระดับศาล
   - การตรวจค่า ร่าง/บันทึก และตัวเลขติดลบ
   - patch แบบ immutable: บันทึกรายชั้น + upsert judgments[] ชั้นเดียวกัน (รวมกับ popup เดิม)
   - Excel: หัวตาราง 3 แถว 49 คอลัมน์ตามชีต "ฐาน" และค่าลงคอลัมน์ถูกตำแหน่ง
   - Word: แบบสรุปการวิเคราะห์คดีมีหัวข้อครบและ escape ข้อความ
   โหลดไฟล์จริงเข้ามาทดสอบ ไม่ได้คัดลอกตรรกะมาไว้ในไฟล์นี้
   Run: node activity10/tests/verdict-record.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const sandbox = {};
for (const f of ["ecmis-verdict-lists.js", "ecmis-verdict-record.js", "ecmis-verdict-doc.js"]) {
  const src = fs.readFileSync(new URL("../assets/" + f, import.meta.url), "utf8");
  new Function("window", src)(sandbox);
}
const R = sandbox.ECMISVerdictRecord;
const D = sandbox.ECMISVerdictDoc;
const LISTS = sandbox.ECMISVerdictLists;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

/* คอลัมน์ Excel → index */
const col = (letters) => [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

const PACC_DB = [
  {
    id: "สำนวน-0001/2569",
    responsibleUnit: "กองกฎหมาย (กอท.)",
    responsibleOfficer: "นายสมชาย ใจดี",
    blackNo: "-",
    accuser: "คณะกรรมการ ป.ป.ท.",
    accused: "ณัฐกานต์ แพนดอร่า",
    title: "เรื่องทดสอบ",
    complaintIntake: { allegation: "เรียกรับเงิน", incidentPlace: "อบต.บางแสน", province: "ชลบุรี" },
  },
];
const DEPS = {
  paccDb: PACC_DB,
  act7: LISTS.ACT7_SAMPLE,
  formatDate: (iso) => "D(" + iso + ")",
  unitOf: () => "หน่วยสำรอง",
  titleOf: (name) => (name === "นางกานดา รักษ์ธรรม" ? "เจ้าหน้าที่ธุรการชำนาญงาน" : ""),
};
const baseCase = () => ({
  id: "คดี-200001/2569",
  category: "10.1",
  paccSourceId: "สำนวน-0001/2569",
  accused: "ณัฐกานต์ แพนดอร่า",
  courtName: "ศาลอาญาคดีทุจริตและประพฤติมิชอบกลาง",
  courtBlackNo: "อท. 12/2568",
  courtRedNo: "อท. 45/2569",
  plaintiffs: ["พนักงานอัยการ"],
  defendants: ["ณัฐกานต์ แพนดอร่า"],
  prosecutorCaseTypeName: "3. อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)",
  judgments: [],
});
const fullInput = {
  verdictType: "1",
  verdictStage: "1.1 ศาลชั้นต้นพิพากษาลงโทษทุกราย",
  caseNatureNo: "14",
  resultDetail: "พิพากษาว่าจำเลยมีความผิด",
  offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
  jailYears: "2",
  jailMonths: "6",
  fine: "10,000",
  restitutionType: "คืนเงิน",
  restitutionAmount: "50000",
  isFinal: true,
  finalLetterNo: "ปท 0001/123",
  suspendedYears: "2",
  damageValue: "125000.5",
};
const withPatch = (kase, level, input, opts) => Object.assign(kase, R.buildRecordPatch(kase, level, input, opts));

console.log("\nเงื่อนไขการ์ดหน้า 02 และชั้นศาล");

t("กรณีอัยการ 1 (ไม่ฟ้อง) และ 2 (ถอนฟ้อง) ไม่แสดงฟอร์ม; 3–9 แสดง", () => {
  assert.equal(R.appliesToProsecutorType("1"), false);
  assert.equal(R.appliesToProsecutorType("2"), false);
  for (const n of ["3", "4", "5", "6", "7", "8", "9"]) assert.equal(R.appliesToProsecutorType(n), true, n);
  assert.equal(R.appliesToProsecutorType(""), false);
});

t("ระดับศาลหน้า 02 → ชั้นศาล (0/9 ให้ผู้ใช้เลือก)", () => {
  assert.equal(R.levelFromProsecutorLevel("1"), "FIRST");
  assert.equal(R.levelFromProsecutorLevel("2"), "APPEAL");
  assert.equal(R.levelFromProsecutorLevel("3"), "SUPREME");
  assert.equal(R.levelFromProsecutorLevel("0"), "");
  assert.equal(R.levelFromProsecutorLevel("9"), "");
});

t("สถานะชั้นคำพิพากษา 3 ตัวเลือกต่อชั้น (ตัดรายการที่ Excel ให้ลบออก)", () => {
  for (const lv of ["FIRST", "APPEAL", "SUPREME"]) assert.equal(LISTS.VERDICT_STAGES[lv].length, 3, lv);
  const all = Object.values(LISTS.VERDICT_STAGES).flat();
  assert.ok(all.every((s) => !/พิพากษาลงโทษบางราย$/.test(s)));
});

console.log("\nการตรวจค่า");

t("ร่างไม่บังคับช่อง แต่ต้องมีชั้นศาล", () => {
  assert.deepEqual(R.validate("FIRST", {}, "draft"), []);
  assert.match(R.validate("", {}, "draft").join(), /ชั้นศาล/);
});

t("บันทึก (done) ต้องมีประเภทคำพิพากษาและสถานะชั้นคำพิพากษา", () => {
  assert.equal(R.validate("FIRST", {}, "done").length, 2);
  assert.deepEqual(R.validate("FIRST", fullInput, "done"), []);
});

t("ตัวเลขติดลบหรือไม่ใช่ตัวเลข = error; คอมมาในจำนวนเงินอ่านได้", () => {
  assert.match(R.validate("FIRST", { fine: "-5" }, "draft").join(), /ปรับ/);
  assert.match(R.validate("FIRST", { jailYears: "abc" }, "draft").join(), /จำคุก/);
  assert.equal(R.normalizeFields({ fine: "10,000" }).fields.fine, 10000);
  assert.equal(R.buildRecordPatch(baseCase(), "FIRST", { fine: "-1" }, {}), null);
});

t("ไม่ติ๊กคดีถึงที่สุด → ล้างเลขหนังสือ", () => {
  assert.equal(R.normalizeFields({ isFinal: false, finalLetterNo: "x" }).fields.finalLetterNo, "");
});

console.log("\nบันทึกรายชั้น + judgments[]");

t("สร้างบันทึกใหม่และ judgment ชั้นเดียวกัน โดยไม่แก้วัตถุเดิม", () => {
  const kase = baseCase();
  const snapshot = JSON.stringify(kase);
  const patch = R.buildRecordPatch(kase, "FIRST", fullInput, {
    status: "done",
    by: "นางกานดา รักษ์ธรรม",
    when: "2026-10-18T09:00:00.000Z",
    court: { name: kase.courtName, blackNo: "อท. 12/2568", redNo: "อท. 45/2569", date: "2026-02-12" },
  });
  assert.equal(JSON.stringify(kase), snapshot);
  assert.equal(patch.verdictRecords.length, 1);
  assert.equal(patch.verdictRecords[0].status, "done");
  assert.equal(patch.verdictRecords[0].fields.jailYears, 2);
  assert.equal(patch.judgments.length, 1);
  assert.equal(patch.judgments[0].level, "FIRST");
  assert.equal(patch.judgments[0].result, "ศาลชั้นต้นพิพากษาลงโทษทุกราย");
  assert.equal(patch.judgments[0].isFinal, true);
});

t("บันทึกชั้นเดิมซ้ำ = แทนที่ (ไม่เพิ่มแถว) และคง createdAt เดิม", () => {
  const k1 = withPatch(baseCase(), "FIRST", fullInput, { status: "draft", when: "2026-01-01T00:00:00Z" });
  const p2 = R.buildRecordPatch(k1, "FIRST", Object.assign({}, fullInput, { fine: "1" }), { status: "done", when: "2026-02-01T00:00:00Z" });
  assert.equal(p2.verdictRecords.length, 1);
  assert.equal(p2.verdictRecords[0].fields.fine, 1);
  assert.equal(p2.verdictRecords[0].createdAt, "2026-01-01T00:00:00Z");
  assert.equal(p2.judgments.length, 1);
});

t("มี judgment ชั้นเดียวกันจาก popup เดิม → รวมเข้ารายการเดิม คงเลขคดีถ้าฟอร์มว่าง", () => {
  const kase = baseCase();
  kase.judgments = [
    { level: "PROSECUTOR", result: "สั่งฟ้อง" },
    { level: "FIRST", issuer: "ศาลเดิม", blackNo: "อท. 1/2568", redNo: "", result: "ลงโทษ", summary: "สรุปเดิม", fileNames: ["a.pdf"] },
  ];
  const patch = R.buildRecordPatch(kase, "FIRST", fullInput, { status: "done", court: {} });
  assert.equal(patch.judgments.length, 2);
  assert.equal(patch.judgments[0].level, "PROSECUTOR");
  assert.equal(patch.judgments[1].issuer, "ศาลเดิม");
  assert.equal(patch.judgments[1].blackNo, "อท. 1/2568");
  assert.deepEqual(patch.judgments[1].fileNames, ["a.pdf"]);
});

t("ร่างที่ยังไม่เลือกประเภท/สถานะ → คงข้อความผลเดิมของ popup ไม่เอารายละเอียดไปทับ", () => {
  const kase = baseCase();
  kase.judgments = [{ level: "FIRST", result: "ยกฟ้อง", summary: "สรุปยาวมาก" }];
  const patch = R.buildRecordPatch(kase, "FIRST", { resultDetail: "สรุปยาวมาก" }, { status: "draft" });
  assert.equal(patch.judgments[0].result, "ยกฟ้อง");
});

t("ชั้นเดียวกันมี judgment เดิมหลายรายการ → เพิ่มรายการใหม่ ไม่เขียนทับ; บันทึกครั้งถัดไปแก้รายการของฟอร์มเอง", () => {
  const kase = baseCase();
  kase.judgments = [
    { level: "FIRST", result: "ลงโทษ", recordedBy: "ก" },
    { level: "FIRST", result: "คำสั่งศาล", recordedBy: "ข" },
  ];
  const k1 = withPatch(kase, "FIRST", fullInput, { status: "done", by: "ค" });
  assert.equal(k1.judgments.length, 3);
  assert.equal(k1.judgments[1].result, "คำสั่งศาล");
  const k2 = withPatch(k1, "FIRST", Object.assign({}, fullInput, { verdictType: "2", verdictStage: "" }), { status: "draft", by: "ง" });
  assert.equal(k2.judgments.length, 3);
  assert.equal(k2.judgments[2].result, "ยกฟ้อง");
  assert.equal(k2.judgments[2].recordedBy, "ค", "คงผู้บันทึกคนแรก");
});

t("บันทึกร่างทับรายการที่บันทึกแล้วและยังกรอกครบ → คงสถานะบันทึกแล้ว", () => {
  const k1 = withPatch(baseCase(), "FIRST", fullInput, { status: "done" });
  const p = R.buildRecordPatch(k1, "FIRST", fullInput, { status: "draft" });
  assert.equal(p.verdictRecords[0].status, "done");
  const p2 = R.buildRecordPatch(k1, "FIRST", Object.assign({}, fullInput, { verdictStage: "" }), { status: "draft" });
  assert.equal(p2.verdictRecords[0].status, "draft");
});

t("ค่าเริ่มต้นฟอร์มดึงจาก judgment เดิม; ไม่มีบันทึกใดเลย → ใช้เลขคดีจากหน้า 02", () => {
  const kase = baseCase();
  kase.judgments = [{ level: "APPEAL", issuer: "ศาลอุทธรณ์", blackNo: "x", redNo: "y", date: "2026-05-01", summary: "ยืน", isFinal: true }];
  const s = R.initialState(kase, "APPEAL");
  assert.equal(s.court.name, "ศาลอุทธรณ์");
  assert.equal(s.fields.resultDetail, "ยืน");
  assert.equal(s.fields.isFinal, true);
  assert.equal(R.initialState(baseCase(), "FIRST").court.blackNo, "อท. 12/2568");
});

t("ตัวอย่างเดโม: เติมเฉพาะสำนวน 10.1 ที่มีอยู่และยังไม่มีบันทึก ทุกบันทึกผ่านการตรวจ", () => {
  const samples = LISTS.SAMPLE_RECORDS;
  const cases = samples.map((s) => ({ id: s.caseId, category: "10.1", judgments: [] }));
  cases[1].verdictRecords = [{ level: "FIRST" }];
  cases.push({ id: "คดีอื่น", category: "10.3" });
  const out = R.samplePatches(cases, samples);
  assert.deepEqual(out.map((x) => x.caseId), samples.filter((s, i) => i !== 1).map((s) => s.caseId));
  out.forEach((x) => {
    const s = samples.find((y) => y.caseId === x.caseId);
    assert.equal(x.patch.verdictRecords.length, s.records.length, "ทุกบันทึกตัวอย่างผ่าน validate: " + s.caseId);
    if (s.paccSourceId) assert.equal(x.patch.paccSourceId, s.paccSourceId);
  });
});

t("ตัวอย่างครบทุกส่วน (คดี-100003): แบบสรุป Word ไม่มีช่องว่าง (เส้นจุด) และมีครบ 3 ชั้นศาล", () => {
  const PACC_0001 = {
    id: "สำนวน-0001/2569", responsibleOfficer: "นายสมชาย ใจดี", accuser: "นาย ก", accused: "นาย ข",
    complaintIntake: { allegation: "เรียกรับเงิน", incidentPlace: "อบต.บางแสน", province: "ชลบุรี" },
  };
  const s = LISTS.SAMPLE_RECORDS.find((x) => x.caseId === "คดี-100003/2569");
  const [{ patch }] = R.samplePatches([{ id: s.caseId, category: "10.1", accuser: "ป.ป.ท.", accused: "นายอำนาจ" }], [s]);
  const kase = Object.assign({ id: s.caseId, category: "10.1", accuser: "ป.ป.ท.", accused: "นายอำนาจ" }, patch);
  const html = D.buildSummaryHtml(kase, Object.assign({}, DEPS, { paccDb: [PACC_0001], titleOf: () => "นิติกร" }));
  assert.ok(!html.includes("........"), "ทุกช่องมีข้อมูล");
  for (const lv of ["ศาลชั้นต้น", "ศาลอุทธรณ์", "ศาลฎีกา"]) assert.ok(html.includes(lv), lv);
  assert.ok(html.includes("ศาลจังหวัดชลบุรี") && html.includes("ศาลฎีกา แผนกคดีทุจริต"));
  assert.ok(html.includes("ข้อพึงระวัง"));
  assert.equal(R.excelRows([kase], DEPS).length, 3);
});

t("สำนวนเดิม: ผูกไว้ (paccSourceId) มาก่อนการจับคู่จากเลขสำนวนเดโม", () => {
  const db = [{ id: "A", legacyId: "คดี-1" }, { id: "B" }];
  assert.equal(R.paccOf({ id: "คดี-1", paccSourceId: "B" }, db).id, "B");
  assert.equal(R.paccOf({ id: "คดี-1" }, db).id, "A");
  assert.equal(R.paccOf({ id: "คดี-2", paccSourceId: "" }, db), null);
});

console.log("\nExcel (ชีต ฐาน)");

t("หัวตาราง 3 แถว 49 คอลัมน์ A–AW และรวมเซลล์กลุ่ม", () => {
  const h = R.excelHeader();
  assert.equal(h.width, 49);
  assert.equal(h.rows[0][col("I")], "ต้นสังกัดของผู้ถูกร้องเรียน");
  assert.equal(h.rows[1][col("J")], "กรม");
  assert.equal(h.rows[0][col("M")], "มติคณะกรรมการ ป.ป.ท.");
  assert.equal(h.rows[1][col("W")], "ข้อกล่าวหาเป็นอันตกไป");
  assert.equal(h.rows[0][col("X")], "นับสถิติ เป็น");
  assert.equal(h.rows[0][col("AI")], "ผลคำพิพากษา");
  assert.equal(h.rows[2][col("AK")], "เดือน");
  assert.equal(h.rows[2][col("AL")], "ปี");
  assert.equal(h.rows[0][col("AP")], "การลงโทษจริง");
  assert.equal(h.rows[0][col("AW")], "มูลค่าความเสียหาย");
  const groupI = h.merges.find((m) => m.s.r === 0 && m.s.c === col("I"));
  assert.deepEqual(groupI.e, { r: 0, c: col("K") });
});

t("แถวข้อมูล 49 ช่อง ค่าลงคอลัมน์ถูกตำแหน่ง และดึงสำนวนเดิม/กิจกรรม 7", () => {
  const kase = withPatch(baseCase(), "FIRST", fullInput, {
    status: "done",
    court: { name: "ศาลอาญาคดีทุจริตฯ", blackNo: "อท. 12/2568", redNo: "อท. 45/2569", date: "2026-02-12" },
  });
  const rows = R.excelRows([kase, baseCase()], DEPS);
  assert.equal(rows.length, 1, "สำนวนที่ไม่มีบันทึกไม่ออกแถว");
  const r = rows[0];
  assert.equal(r.length, 49);
  assert.equal(r[col("A")], 1);
  assert.equal(r[col("B")], "กองกฎหมาย (กอท.)");
  assert.equal(r[col("D")], "", "เลขดำ '-' ในสำนวนเดิม = ว่าง");
  assert.equal(r[col("G")], "เรียกรับเงิน");
  assert.equal(r[col("I")], "กระทรวงมหาดไทย");
  assert.equal(r[col("L")], "อบต.บางแสน ชลบุรี");
  assert.equal(r[col("M")], "9/2569");
  assert.equal(r[col("N")], "D(2026-03-12)");
  assert.equal(r[col("P")], "✓");
  assert.equal(r[col("R")], "");
  assert.match(r[col("Y")], /^14\. /);
  assert.equal(r[col("AA")], "ลงโทษ");
  assert.equal(r[col("AB")], "อท. 12/2568");
  assert.equal(r[col("AD")], "D(2026-02-12)");
  assert.equal(r[col("AG")], "อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)");
  assert.equal(r[col("AH")], "ศาลชั้นต้นพิพากษาลงโทษทุกราย");
  assert.equal(r[col("AK")], 6);
  assert.equal(r[col("AL")], 2);
  assert.equal(r[col("AN")], "คืนเงิน 50,000.00");
  assert.equal(r[col("AS")], 2);
  assert.equal(r[col("AW")], 125000.5);
});

t("หลายชั้นศาล = หลายแถว เรียงชั้นต้น → อุทธรณ์ → ฎีกา", () => {
  let kase = withPatch(baseCase(), "SUPREME", fullInput, { status: "draft" });
  kase = withPatch(kase, "FIRST", fullInput, { status: "done" });
  assert.equal(R.excelRows([kase], DEPS).length, 2);
  assert.deepEqual(R.getRecords(kase).map((x) => x.level), ["FIRST", "SUPREME"]);
});

console.log("\nWord (แบบสรุปการวิเคราะห์คดี)");

t("มีหัวข้อครบตามแบบฟอร์ม ผู้สรุป+ตำแหน่ง และแยกศาลประพฤติมิชอบ/ทุจริต", () => {
  const kase = withPatch(baseCase(), "FIRST", fullInput, {
    status: "done",
    by: "นางกานดา รักษ์ธรรม",
    court: { name: "ศาลจังหวัดชลบุรี", blackNo: "อ. 1/2568", redNo: "อ. 2/2569" },
  });
  const html = D.buildSummaryHtml(kase, DEPS);
  for (const label of [
    "คดีเลขที่", "คำสั่งไต่สวนข้อเท็จจริงฯ", "ผู้รับผิดชอบสำนวนคดี", "หน่วยงานต้นสังกัดผู้ถูกกล่าวหา", "พฤติการณ์",
    "ความเห็นคณะอนุกรรมการ", "วินิจฉัยชี้มูลไต่สวนข้อเท็จจริง", "ฐานความผิดที่พนักงานอัยการส่งฟ้อง", "ศาลพิพากษาลงโทษ",
    "ชี้มูลความผิดทางอาญาและทางวินัย", "#9CC2E5", "TH SarabunPSK",
    "ผลของคำพิพากษา", "การลงโทษจริง", "มูลค่าความเสียหาย", "ข้อมูลเกี่ยวกับคดีถึงที่สุด", "ข้อเสนอแนะทางคดี", "pacc.general@pacc.go.th",
  ]) assert.ok(html.includes(label), label);
  assert.ok(html.includes("เจ้าหน้าที่ธุรการชำนาญงาน"));
  assert.ok(html.includes("จำคุก 2 ปี 6 เดือน"));
  assert.ok(html.includes("ตามหนังสือเลขที่ ปท 0001/123"));
  assert.equal(D.isMisconductCourt("ศาลจังหวัดชลบุรี"), true);
  assert.equal(D.isMisconductCourt("ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 2"), false);
});

t("ข้อความผู้ใช้ถูก escape", () => {
  const kase = baseCase();
  kase.accused = "<script>x</script>";
  withPatch(kase, "FIRST", { resultDetail: "<b>bad</b>" }, { status: "draft" });
  const html = D.buildSummaryHtml(kase, DEPS);
  assert.ok(!html.includes("<script>x"));
  assert.ok(html.includes("&lt;b&gt;bad"));
});

console.log("\n" + passed + " passed");
