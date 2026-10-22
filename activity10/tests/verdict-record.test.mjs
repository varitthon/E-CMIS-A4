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
for (const f of ["ecmis-court-prosecutor-lists.js", "ecmis-verdict-lists.js", "ecmis-verdict-record.js", "ecmis-verdict-doc.js"]) {
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

console.log("\nรายการศาล/อัยการ (ฉบับร่าง)");
const CL = sandbox.ECMISCourtLists;

t("77 จังหวัด; อัยการประพฤติมิชอบ 77 สำนักงาน; ศาลกรองตามประเภท × ชั้น", () => {
  assert.equal(CL.PROVINCES.length, 77);
  assert.equal(new Set(CL.PROVINCES).size, 77);
  assert.equal(CL.officesFor("MISCONDUCT").length, 77);
  assert.ok(CL.courtsFor("CORRUPTION", "FIRST").includes("ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 9"));
  /* ศาลแขวง / ศาลจังหวัด แยกกัน — ศาลจังหวัดไม่มีศาลแขวงปน และกลับกัน */
  assert.ok(CL.courtsFor("PROVINCIAL", "FIRST").includes("ศาลจังหวัดชลบุรี"));
  assert.ok(!CL.courtsFor("PROVINCIAL", "FIRST").includes("ศาลจังหวัดกรุงเทพมหานคร"));
  assert.ok(!CL.courtsFor("PROVINCIAL", "FIRST").some((n) => /แขวง/.test(n)));
  assert.ok(CL.courtsFor("DISTRICT", "FIRST").every((n) => /^ศาลแขวง/.test(n)));
  assert.deepEqual(CL.courtsFor("PROVINCIAL", "SUPREME"), ["ศาลฎีกา"]);
  assert.deepEqual(CL.courtsFor("", "FIRST"), []);
  /* ไม่มีตัวเลือก "อื่นๆ" ในรายชื่อศาล */
  Object.keys(CL.COURTS).forEach((t) =>
    Object.keys(CL.COURTS[t]).forEach((lv) => assert.ok(!CL.COURTS[t][lv].includes(CL.OTHER), t + "/" + lv)),
  );
});

t("2 ส่วน: ชั้นศาลอาญา = ทุจริต/แขวง/จังหวัด, ชั้นศาลปกครอง = ศาลปกครอง; รหัสเดิม MISCONDUCT แปลงตามชื่อศาล", () => {
  assert.deepEqual(CL.courtTypesForLevel("APPEAL").map((x) => x.code), ["CORRUPTION", "DISTRICT", "PROVINCIAL"]);
  assert.deepEqual(CL.courtTypesForLevel("ADMIN_FIRST").map((x) => x.code), ["ADMIN"]);
  assert.deepEqual(CL.courtsFor("ADMIN", "ADMIN_SUPREME"), ["ศาลปกครองสูงสุด"]);
  assert.ok(CL.courtsFor("ADMIN", "ADMIN_FIRST").includes("ศาลปกครองกลาง"));
  assert.equal(CL.normalizeType("MISCONDUCT", "ศาลแขวงดุสิต"), "DISTRICT");
  assert.equal(CL.normalizeType("MISCONDUCT", "ศาลจังหวัดเลย"), "PROVINCIAL");
  assert.equal(CL.normalizeType("MISCONDUCT", ""), "");
  assert.equal(CL.prosecutorTypeForCourt("DISTRICT"), "MISCONDUCT");
  assert.equal(CL.prosecutorTypeForCourt("ADMIN"), "");
  assert.equal(LISTS.levelPart("ADMIN_SUPREME"), "ADMIN");
  assert.equal(LISTS.VERDICT_STAGES.ADMIN_FIRST.length, 4);
  /* ศาลปกครองไม่บังคับประเภทคำพิพากษา (ลงโทษ/ยกฟ้อง) */
  assert.deepEqual(R.validate("ADMIN_FIRST", { verdictStage: LISTS.VERDICT_STAGES.ADMIN_FIRST[0] }, "done"), []);
  assert.ok(R.validate("FIRST", { verdictStage: LISTS.VERDICT_STAGES.FIRST[0] }, "done").length > 0);
});

t("ข้อความอัยการต้นทางเดิม (สนง.) จับคู่ประเภท/สำนักงานได้; ไม่พบ = อื่นๆ", () => {
  assert.deepEqual(CL.findOffice("สนง.อัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1"), {
    type: "CORRUPTION",
    name: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
  });
  assert.equal(CL.findOffice("สำนักงานอัยการจังหวัดเลย").type, "MISCONDUCT");
  const other = CL.findOffice("สำนักงาน ป.ป.ท.");
  assert.equal(other.name, CL.OTHER);
  assert.equal(other.other, "สำนักงาน ป.ป.ท.");
  assert.equal(CL.courtTypeOfName("ศาลจังหวัดสระบุรี"), "PROVINCIAL");
  assert.equal(CL.courtTypeOfName("ศาลปกครองเชียงใหม่"), "ADMIN");
  assert.equal(CL.courtTypeOfName("ศาลอุทธรณ์คดีพิเศษ"), "CORRUPTION");
});

console.log("\nแยกรายบุคคล (ชั้นศาล × บุคคล)");

t("2 คนในชั้นเดียวกัน = 2 บันทึก; ศาลใช้ร่วมทั้งชั้น; judgments สรุปรายชื่อ; คดีถึงที่สุดเมื่อครบทุกคน", () => {
  let kase = withPatch(baseCase(), "FIRST", fullInput, {
    person: "นาย ก",
    status: "done",
    court: { type: "CORRUPTION", name: "ศาลเดิม", blackNo: "อท. 1/2568" },
  });
  kase = withPatch(kase, "FIRST", { verdictType: "2", verdictStage: "1.2 ศาลชั้นต้นพิพากษายกฟ้อง", isFinal: false }, {
    person: "นาย ข",
    status: "done",
    court: { type: "CORRUPTION", name: "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 1", blackNo: "อท. 1/2568" },
  });
  const recs = R.getRecords(kase).filter((r) => r.level === "FIRST");
  assert.deepEqual(recs.map((r) => r.person), ["นาย ก", "นาย ข"]);
  assert.ok(recs.every((r) => r.court.name === "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 1"), "ศาลล่าสุดใช้ร่วมทุกคน");
  assert.equal(kase.judgments.length, 1);
  assert.match(kase.judgments[0].result, /นาย ก: .*\/ นาย ข: ศาลชั้นต้นพิพากษายกฟ้อง/);
  assert.equal(kase.judgments[0].isFinal, false);
  assert.deepEqual(R.personsAt(kase, "FIRST"), ["นาย ก", "นาย ข"]);
});

t("ลบบุคคล: เหลือคนเดียว judgments กลับเป็นผลของคนนั้น; ลบหมด = ลบรายการที่ฟอร์มดูแล", () => {
  let kase = withPatch(baseCase(), "FIRST", fullInput, { person: "นาย ก", status: "done" });
  kase = withPatch(kase, "FIRST", { verdictType: "2" }, { person: "นาย ข", status: "draft" });
  kase = Object.assign(kase, R.removePersonPatch(kase, "FIRST", "นาย ก"));
  assert.deepEqual(R.personsAt(kase, "FIRST"), ["นาย ข"]);
  assert.equal(kase.judgments[0].result, "ยกฟ้อง");
  kase = Object.assign(kase, R.removePersonPatch(kase, "FIRST", "นาย ข"));
  assert.equal(kase.verdictRecords.length, 0);
  assert.equal(kase.judgments.length, 0);
});

t("บันทึกรุ่นเดิมไม่มี person = ผู้ถูกกล่าวหาคนแรกของสำนวน; รายชื่อให้เลือกรวมจำเลย+สำนวนเดิมไม่ซ้ำ", () => {
  const kase = Object.assign(baseCase(), { verdictRecords: [{ level: "FIRST", status: "draft", fields: {}, court: {} }] });
  assert.equal(R.getRecords(kase)[0].person, "ณัฐกานต์ แพนดอร่า");
  const names = R.personCandidates(
    { defendants: ["นาย ก", "นาย ข (อดีตนายก อบต.)"], accused: "นาย ก" },
    { accused: "นาย ค, นาย ข และ นาย ง" },
  );
  assert.deepEqual(names, ["นาย ก", "นาย ข", "นาย ค", "นาย ง"]);
});

t("ค่าเริ่มต้นคนใหม่ในชั้นที่มีคนอื่นแล้ว = ศาลเดิมของชั้น ผลว่าง; สำนวนใหม่ = ประเภทศาลจากหน้า 02", () => {
  const kase = withPatch(baseCase(), "APPEAL", fullInput, { person: "นาย ก", court: { type: "CORRUPTION", name: "ศาลอุทธรณ์คดีพิเศษ" } });
  const s = R.initialState(kase, "APPEAL", "นาย ข");
  assert.equal(s.court.name, "ศาลอุทธรณ์คดีพิเศษ");
  assert.equal(s.fields.verdictType, "");
  assert.equal(R.initialState(Object.assign(baseCase(), { courtSystem: "PROVINCIAL", courtName: "" }), "FIRST").court.type, "PROVINCIAL");
  /* รหัสเดิมไม่มีชื่อศาล = ไม่รู้ว่าแขวงหรือจังหวัด → ว่าง; ประเภทศาลอาญาไม่ใช้กับชั้นศาลปกครอง */
  assert.equal(R.initialState(Object.assign(baseCase(), { courtSystem: "MISCONDUCT", courtName: "" }), "FIRST").court.type, "");
  assert.equal(R.initialState(Object.assign(baseCase(), { courtSystem: "CORRUPTION", courtName: "" }), "ADMIN_FIRST").court.type, "");
});

t("ตัวอย่างรุ่นก่อน (เลขคดีดำตรงตัวอย่าง) ถูกแทนด้วยรุ่นใหม่; บันทึกจริงไม่ถูกแทน", () => {
  const s = LISTS.SAMPLE_RECORDS.find((x) => x.caseId === "คดี-100004/2569");
  const old = { id: s.caseId, category: "10.1", verdictRecords: [{ level: "FIRST", court: { blackNo: "อ. 230/2568" }, fields: {} }] };
  const [hit] = R.samplePatches([old], [s]);
  assert.deepEqual(hit.patch.verdictRecords.map((r) => r.person), ["นายสมชาย ทุจริตมั่น", "นายประเสริฐ ร่วมคิด"]);
  const real = { id: s.caseId, category: "10.1", verdictRecords: [{ level: "FIRST", court: { blackNo: "อ. 999/2569" }, fields: {} }] };
  assert.equal(R.samplePatches([real], [s]).length, 0);
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

t("แยกรายบุคคล: 1 แถวต่อชั้น×บุคคล คอลัมน์ F และ AF เป็นชื่อบุคคลของแถว", () => {
  let kase = withPatch(baseCase(), "FIRST", fullInput, { person: "นาย ก", status: "done" });
  kase = withPatch(kase, "FIRST", fullInput, { person: "นาย ข", status: "done" });
  const rows = R.excelRows([kase], DEPS);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => [r[col("F")], r[col("AF")]]), [["นาย ก", "นาย ก"], ["นาย ข", "นาย ข"]]);
});

console.log("\nWord (แบบสรุปการวิเคราะห์คดี)");

t("Word: หลายคนในชั้น → ป้าย 'ศาลชั้นต้น › ชื่อ'; ประเภทศาลที่เลือกกำหนดแถวศาล", () => {
  let kase = withPatch(baseCase(), "FIRST", fullInput, {
    person: "นาย ก",
    status: "done",
    court: { type: "MISCONDUCT", name: "ศาลอาญา", blackNo: "อ. 5/2568" },
  });
  kase = withPatch(kase, "FIRST", { verdictType: "2" }, { person: "นาย ข", status: "draft", court: kase.verdictRecords[0].court });
  const html = D.buildSummaryHtml(kase, DEPS);
  assert.ok(html.includes("ศาลชั้นต้น › นาย ก"));
  assert.ok(html.includes("ศาลชั้นต้น › นาย ข พิพากษายกฟ้อง"));
  assert.ok(html.includes("– นาย ข: พิพากษายกฟ้อง"));
  const misconductRow = html.split("คำพิพากษาศาลคดีประพฤติมิชอบ")[1].split("คำพิพากษาศาลคดีทุจริต")[0];
  assert.ok(misconductRow.includes("อ. 5/2568"), "ศาลอาญา (ไม่มีคำว่าจังหวัด) อยู่แถวประพฤติมิชอบเพราะเลือกประเภทไว้");
});

t("Word: ส่วนศาลปกครองเพิ่มแถว 'คำพิพากษาศาลปกครอง' เฉพาะเมื่อมีบันทึก; ศาลแขวงอยู่แถวประพฤติมิชอบ", () => {
  const stage = LISTS.VERDICT_STAGES.ADMIN_FIRST[0];
  let kase = withPatch(baseCase(), "FIRST", fullInput, { person: "นาย ก", status: "done", court: { type: "DISTRICT", name: "ศาลแขวงดุสิต", blackNo: "อ. 9/2568" } });
  assert.ok(!D.buildSummaryHtml(kase, DEPS).includes("คำพิพากษาศาลปกครอง"));
  const misconductRow = D.buildSummaryHtml(kase, DEPS).split("คำพิพากษาศาลคดีประพฤติมิชอบ")[1].split("คำพิพากษาศาลคดีทุจริต")[0];
  assert.ok(misconductRow.includes("อ. 9/2568"));
  kase = withPatch(kase, "ADMIN_FIRST", { verdictStage: stage }, { person: "นาย ก", status: "done", court: { type: "ADMIN", name: "ศาลปกครองกลาง", blackNo: "ฟ. 77/2568" } });
  const html = D.buildSummaryHtml(kase, DEPS);
  const start = html.indexOf("คำพิพากษาศาลปกครอง<br>");
  assert.ok(start > 0);
  const adminRow = html.slice(start, html.indexOf("ศาลพิพากษาลงโทษ", start));
  assert.ok(adminRow.includes("ฟ. 77/2568"));
  assert.ok(adminRow.includes("ศาลปกครองกลาง"));
});

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

t("ตัวอย่างหลายผู้ถูกกล่าวหา: สร้างสำนวนใหม่ครั้งเดียว แล้วเติมผลรายบุคคล", () => {
  const ID = "คดี-100090/2569";
  const created = R.sampleNewCases([], LISTS.SAMPLE_RECORDS, "2026-10-20");
  const kase = created.find((c) => c.id === ID);
  assert.ok(kase);
  assert.equal(kase.category, "10.1");
  assert.equal(kase.paccSourceId, "สำนวน-0090/2569");
  assert.deepEqual(kase.defendants, ["นายประยุทธ ทองดี", "นางสาวมาลี ศรีงาม", "นายวีระ ใจกล้า"]);
  assert.equal(kase.dateReceived, "2026-10-15");
  assert.equal(kase.dueDate, "2026-10-30");
  /* มีอยู่แล้ว → ไม่สร้างซ้ำ */
  assert.equal(R.sampleNewCases([{ id: ID }], LISTS.SAMPLE_RECORDS).filter((c) => c.id === ID).length, 0);

  const patch = R.samplePatches([kase], LISTS.SAMPLE_RECORDS).find((x) => x.caseId === ID).patch;
  const merged = Object.assign({}, kase, patch);
  assert.deepEqual(R.personsAt(merged, "FIRST").sort(), [...kase.defendants].sort());
  assert.equal(R.personsAt(merged, "APPEAL").length, 2);
  assert.equal(R.getRecord(merged, "FIRST", "นายวีระ ใจกล้า").fields.verdictType, "2");
  assert.equal(R.getRecord(merged, "APPEAL", "นางสาวมาลี ศรีงาม").status, "draft");
  assert.equal(R.excelRows([merged], {}).length, 5);
  const first = merged.judgments.find((j) => j.verdictRecordLevel === "FIRST");
  assert.equal(
    first.result,
    "ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย — นายประยุทธ ทองดี: ลงโทษ / นางสาวมาลี ศรีงาม: ลงโทษ / นายวีระ ใจกล้า: ยกฟ้อง",
  );
  assert.ok(LISTS.ACT7_SAMPLE["สำนวน-0090/2569"]);
});

t("รายชื่อบุคคลจากสำนวนเดิมที่มีผู้ถูกกล่าวหา 3 คน", () => {
  const names = R.personCandidates(
    { id: "x", category: "10.1" },
    { accused: "นายประยุทธ ทองดี, นางสาวมาลี ศรีงาม และ นายวีระ ใจกล้า" },
  );
  for (const n of ["นายประยุทธ ทองดี", "นางสาวมาลี ศรีงาม", "นายวีระ ใจกล้า"]) assert.ok(names.includes(n), n);
});

console.log("\nแท็บรายบุคคล");

t("ลำดับแท็บ: รายชื่อสำนวนก่อน แล้วต่อคนที่มีบันทึกแต่ไม่อยู่ในรายชื่อ (ไม่ซ้ำ)", () => {
  assert.deepEqual(R.tabOrder(["ก", "ข"], ["ข", "ค", " ", "ก"]), ["ก", "ข", "ค"]);
  assert.equal(R.previousPerson(["ก", "ข", "ค"], "ค"), "ข");
  assert.equal(R.previousPerson(["ก", "ข"], "ก"), "");
  assert.equal(R.previousPerson(["ก"], "ไม่มี"), "");
});

t("คัดลอกผล: ทุกช่องของ 3 ส่วน ไม่รวมศาล และไม่แก้ต้นฉบับ", () => {
  const src = { verdictType: "1", jailYears: 2, isFinal: true, courtName: "ศาล X" };
  const out = R.copyFields(src);
  assert.equal(out.verdictType, "1");
  assert.equal(out.jailYears, 2);
  assert.equal(out.isFinal, true);
  assert.equal(out.courtName, undefined);
  assert.equal(out.resultDetail, "");
  out.verdictType = "2";
  assert.equal(src.verdictType, "1");
});

t("ค่าเริ่มต้นรายแท็บ: ข้อความ popup เดิมอยู่แท็บแรกเท่านั้น; คนที่มีบันทึกได้ผลของตัวเอง", () => {
  const legacy = { id: "x", accused: "ก, ข", judgments: [{ level: "FIRST", issuer: "ศาล", result: "ลงโทษ", summary: "สรุปเดิม" }] };
  const st = R.tabStates(legacy, "FIRST", ["ก", "ข"]);
  assert.equal(st["ก"].fields.resultDetail, "สรุปเดิม");
  assert.equal(st["ข"].fields.resultDetail, "");
  const kase = Object.assign({}, legacy, R.buildRecordPatch(legacy, "FIRST", { verdictType: "2" }, { person: "ข", status: "draft" }));
  const st2 = R.tabStates(kase, "FIRST", ["ก", "ข"]);
  assert.equal(st2["ข"].fields.verdictType, "2");
  assert.equal(st2["ข"].status, "draft");
  assert.equal(st2["ก"].status, "");
});

t("บันทึกหลายคนพร้อมกัน: ศาลเดียวกันทุกคน; มีคนผิด = ไม่บันทึกใครเลย", () => {
  const kase = { id: "x", accused: "ก, ข" };
  const court = { type: "CORRUPTION", name: "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 4", blackNo: "อท. 1/2569" };
  const ok = R.buildLevelPatch(kase, "FIRST", [
    { person: "ก", status: "done", fields: { verdictType: "1", verdictStage: "1.1 ศาลชั้นต้นพิพากษาลงโทษทุกราย" } },
    { person: "ข", status: "draft", fields: { verdictType: "2" } },
  ], { court: court, fileNames: ["a.pdf"], by: "ผู้ทดสอบ" });
  assert.deepEqual(ok.errors, []);
  const merged = Object.assign({}, kase, ok.patch);
  assert.deepEqual(R.personsAt(merged, "FIRST"), ["ก", "ข"]);
  assert.equal(R.getRecord(merged, "FIRST", "ข").court.name, court.name);
  assert.deepEqual(R.getRecord(merged, "FIRST", "ก").fileNames, ["a.pdf"]);
  assert.equal(R.getRecord(merged, "FIRST", "ข").status, "draft");
  assert.equal(merged.judgments.length, 1);

  const bad = R.buildLevelPatch(kase, "FIRST", [
    { person: "ก", status: "done", fields: { verdictType: "1" } },
    { person: "ข", status: "draft", fields: { jailYears: -1 } },
  ], { court: court });
  assert.equal(bad.patch, null);
  assert.deepEqual(bad.errors.map((e) => e.person), ["ก", "ข"]);
  assert.equal(R.buildLevelPatch(kase, "FIRST", [], {}).patch, null);
});

t("ซ่อน/เลิกซ่อนบุคคลรายชั้น: ไม่ซ้ำ ไม่กระทบชั้นอื่น และไม่แก้สำนวนเดิม", () => {
  const kase = { id: "x", verdictHiddenPersons: { APPEAL: ["ค"] } };
  const p1 = R.hiddenPatch(kase, "APPEAL", "ข", true);
  assert.deepEqual(p1.verdictHiddenPersons.APPEAL, ["ค", "ข"]);
  assert.deepEqual(kase.verdictHiddenPersons.APPEAL, ["ค"]);
  const k2 = Object.assign({}, kase, p1);
  assert.deepEqual(R.hiddenPatch(k2, "APPEAL", ["ข"], true).verdictHiddenPersons.APPEAL, ["ค", "ข"]);
  assert.deepEqual(R.hiddenPatch(k2, "APPEAL", ["ค", "ข"], false).verdictHiddenPersons.APPEAL, []);
  assert.deepEqual(R.hiddenPersons(k2, "FIRST"), []);
  assert.deepEqual(R.hiddenPatch({ id: "y" }, "FIRST", "ก", true).verdictHiddenPersons, { FIRST: ["ก"] });
});

t("AG: รายการจากชีต DD (ลบ 3.1 เดิม, เพิ่มฟ้องทุกราย/บางราย) และค่าที่เลือกลงคอลัมน์ AG ก่อนกรณีอัยการ", () => {
  const flat = LISTS.PROSECUTOR_STATUSES.flatMap((x) => (typeof x === "string" ? [x] : x.items));
  assert.equal(flat.length, 11);
  assert.ok(flat.includes("3.1 พนักงานอัยการแจ้งคำสั่งฟ้องทุกราย"));
  assert.ok(flat.includes("3.2 พนักงานอัยการแจ้งคำสั่งฟ้องบางราย"));
  assert.ok(!flat.some((s) => /แจ้งคำสั่งฟ้อง$/.test(s)));
  const base = { id: "x", accused: "ก", prosecutorCaseTypeName: "3. อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)" };
  const kase = Object.assign({}, base, R.buildRecordPatch(base, "FIRST", { verdictType: "1" }, { person: "ก", status: "draft" }));
  assert.equal(R.excelRows([kase], {})[0][col("AG")], "อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)");
  kase.verdictProsecutorStatus = "3.2 พนักงานอัยการแจ้งคำสั่งฟ้องบางราย";
  assert.equal(R.excelRows([kase], {})[0][col("AG")], "พนักงานอัยการแจ้งคำสั่งฟ้องบางราย");
});

t("รายละเอียดสำนวนเดิมในแถวขยาย: ดึงจากสำนวนเดิม + กิจกรรม 7; ไม่ได้ผูก = ไม่มีเลขสำนวนเดิม ค่าเป็น -", () => {
  const deps = { paccDb: PACC_DB, act7: { "สำนวน-0001/2569": { ministry: "กระทรวงมหาดไทย", boardMeetingNo: "3/2568", boardOutcomes: { criminal: true } } } };
  const d = R.paccDetailRows({ id: "x", paccSourceId: "สำนวน-0001/2569" }, deps);
  const get = (label) => d.rows.find((r) => r.label === label).value;
  assert.equal(d.paccId, "สำนวน-0001/2569");
  /* 5 ช่องหลักที่ผู้ใช้ขอ: เลขสำนวน พฤติการณ์ เจ้าของสำนวน ประเภทมติชี้มูล หน่วยงาน */
  assert.equal(d.main.caseNo, "0001/2569");
  assert.equal(d.main.allegation, "เรียกรับเงิน");
  assert.equal(d.main.owner, "นายสมชาย ใจดี");
  assert.equal(d.main.resolutionType, "ผิดอาญา");
  assert.equal(d.main.unit, "กองกฎหมาย (กอท.)");
  assert.equal(get("ต้นสังกัด"), "กระทรวงมหาดไทย");
  assert.equal(get("มติคณะกรรมการ ป.ป.ท."), "ครั้งที่ 3/2568");
  assert.equal(get("ประเภทความผิด"), "-");
  const none = R.paccDetailRows({ id: "y" }, deps);
  assert.equal(none.paccId, "");
  assert.equal(none.main.caseNo, "-");
  assert.equal(none.rows.length, 7);
});

t("คืนค่าตัวอย่าง: ล้างแล้วเติมใหม่ได้ผลเดิม; คง judgments จาก popup เดิม; ไม่แตะสำนวนอื่น", () => {
  const ID = "คดี-100090/2569";
  const start = R.sampleNewCases([], LISTS.SAMPLE_RECORDS, "2026-10-20").find((c) => c.id === ID);
  const seeded = Object.assign({}, start, R.samplePatches([start], LISTS.SAMPLE_RECORDS)[0].patch);
  const original = JSON.stringify(seeded.verdictRecords.map((r) => [r.level, r.person, r.status, r.fields.verdictType]));
  /* ผู้ใช้แก้ไข: ลบคน ซ่อนคน ใส่ AG และมี judgment จาก popup เดิม */
  const edited = Object.assign({}, seeded, R.removePersonPatch(seeded, "FIRST", "นายวีระ ใจกล้า"), {
    verdictHiddenPersons: { APPEAL: ["นายวีระ ใจกล้า"] },
    verdictProsecutorStatus: "3.1 พนักงานอัยการแจ้งคำสั่งฟ้องทุกราย",
  });
  edited.judgments = edited.judgments.concat([{ level: "PROSECUTOR", result: "คำสั่งเดิม" }]);
  const other = { id: "คดี-อื่น/2569", category: "10.1", verdictRecords: [{ level: "FIRST", person: "x", fields: {} }] };
  const clear = R.clearSamplePatches([edited, other], LISTS.SAMPLE_RECORDS);
  assert.deepEqual(clear.map((x) => x.caseId), [ID]);
  const cleared = Object.assign({}, edited, clear[0].patch);
  assert.deepEqual(cleared.verdictRecords, []);
  assert.deepEqual(cleared.judgments.map((j) => j.result), ["คำสั่งเดิม"]);
  const restored = Object.assign({}, cleared, R.samplePatches([cleared], LISTS.SAMPLE_RECORDS)[0].patch);
  assert.equal(JSON.stringify(restored.verdictRecords.map((r) => [r.level, r.person, r.status, r.fields.verdictType])), original);
  assert.deepEqual(restored.verdictHiddenPersons, {});
  assert.equal(restored.verdictProsecutorStatus, "");
  assert.ok(restored.judgments.some((j) => j.result === "คำสั่งเดิม"));
});

console.log("\n" + passed + " passed");
