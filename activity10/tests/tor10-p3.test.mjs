/* หน่วยทดสอบ TOR 10 — Phase P3 (10.1 ข้อมูลสำนวน) ดู docs/tor10-change-plan.md
   - Activity10.prescriptionDaysLeft      วันคงเหลือของอายุความ        (10.1.1.2(7))
   - Activity10.responsibleUnitOf         หน่วยงานรับผิดชอบจากนิติกร   (10.1.1.2(6))
   - Activity10.getTorDetails             ใช้ฟิลด์จริงจาก intake        (10.1.1.2)
   - Activity10.buildJudgmentPatch        คำสั่ง/คำพิพากษารายชั้น        (10.1.4, 10.1.10.2-4)
   - Activity10.buildBoardResolutionPatch มติคณะกรรมการ                (10.1.5)
   - Activity10.buildInternalNoticePatch  แจ้งผลหน่วยงานภายใน          (10.1.9)
   - Activity10.buildInternalNoticeMemo   ร่างหนังสือแจ้งจากคำพิพากษาล่าสุด

   โหลด ecmis-activity10.js จริงเข้ามาทดสอบ
   Run: node activity10/tests/tor10-p3.test.mjs */
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

console.log("\nprescriptionDaysLeft");
t("วันที่อนาคต → จำนวนวันที่เหลือ", () => {
  assert.equal(Activity10.prescriptionDaysLeft("2026-10-11", new Date(2026, 9, 1)), 10);
});
t("วันที่ผ่านแล้ว → ค่าติดลบ", () => {
  assert.equal(Activity10.prescriptionDaysLeft("2026-09-29", new Date(2026, 9, 1)), -2);
});
t("ปี พ.ศ. ถูกแปลงเป็น ค.ศ.", () => {
  assert.equal(Activity10.prescriptionDaysLeft("2569-10-11", new Date(2026, 9, 1)), 10);
});
t("ค่าว่าง/ผิดรูปแบบ → null", () => {
  assert.equal(Activity10.prescriptionDaysLeft("", new Date()), null);
  assert.equal(Activity10.prescriptionDaysLeft("x", new Date()), null);
});

console.log("\nresponsibleUnitOf");
t("นิติกรกลุ่มงานคดี → กลุ่มงานคดี กองกฎหมาย", () => {
  assert.equal(
    Activity10.responsibleUnitOf("นางสาวพิมพ์ชนก ศรีสุข (นิติกร กลุ่มงานคดี)"),
    "กลุ่มงานคดี กองกฎหมาย (กอท.)",
  );
});
t("ไม่มีข้อมูล → fallback กองกฎหมาย (กอท.)", () => {
  assert.equal(Activity10.responsibleUnitOf(""), "กองกฎหมาย (กอท.)");
  assert.equal(
    Activity10.responsibleUnitOf("นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)"),
    "กองกฎหมาย (กอท.)",
  );
});

console.log("\ngetTorDetails (ฟิลด์จริงจาก intake)");
t("ใช้ plaintiffs/defendants/courtBlackNo/courtRedNo/courtName/prescription ก่อน", () => {
  const d = Activity10.getTorDetails({
    id: "x",
    plaintiffs: ["นาย ก", "นาย ข"],
    defendants: ["นาย ค"],
    courtBlackNo: "อ. 1/2569",
    courtRedNo: "อ. 2/2569",
    courtName: "ศาลอาญาคดีทุจริตฯ",
    prescriptionDate: "2030-01-01",
    statuteLimitation: "10 ปี",
    officer: "นางสาวพิมพ์ชนก ศรีสุข (นิติกร กลุ่มงานคดี)",
  });
  assert.equal(d.plaintiff, "นาย ก, นาย ข");
  assert.equal(d.defendant, "นาย ค");
  assert.equal(d.blackNo, "อ. 1/2569");
  assert.equal(d.redNo, "อ. 2/2569");
  assert.equal(d.courtName, "ศาลอาญาคดีทุจริตฯ");
  assert.equal(d.prescriptionDate, "2030-01-01");
  assert.equal(d.statuteLimitation, "10 ปี");
  assert.equal(d.division, "กลุ่มงานคดี กองกฎหมาย (กอท.)");
});
t("เคสเก่าที่ไม่มีฟิลด์ใหม่ → พฤติกรรมเดิม (fallback เดิม)", () => {
  const d = Activity10.getTorDetails({ id: "x", blackNo: "อ. 9/2569" });
  assert.equal(d.blackNo, "อ. 9/2569");
  assert.equal(d.division, "กองกฎหมาย (กอท.)");
  assert.equal(d.courtName, "");
});

console.log("\nbuildJudgmentPatch (10.1.4)");
const base = { id: "k1", judgments: [{ level: "FIRST", result: "เดิม" }] };
t("ต่อท้ายรายการเดิมแบบ immutable", () => {
  const patch = Activity10.buildJudgmentPatch(
    base,
    {
      level: "APPEAL",
      issuer: "ศาลอุทธรณ์",
      blackNo: "อ. 5/2570",
      redNo: "อ. 6/2570",
      date: "2026-10-01",
      result: "ยกฟ้อง",
      summary: " สรุป ",
      isFinal: false,
      fileNames: ["a.pdf", "", "b.docx"],
    },
    "นิติกร",
    "2026-10-01T00:00:00.000Z",
  );
  assert.equal(patch.judgments.length, 2);
  assert.equal(base.judgments.length, 1, "ต้องไม่แก้ array เดิม");
  assert.deepEqual(patch.judgments[1], {
    level: "APPEAL",
    issuer: "ศาลอุทธรณ์",
    blackNo: "อ. 5/2570",
    redNo: "อ. 6/2570",
    date: "2026-10-01",
    result: "ยกฟ้อง",
    summary: "สรุป",
    isFinal: false,
    fileNames: ["a.pdf", "b.docx"],
    recordedBy: "นิติกร",
    recordedAt: "2026-10-01T00:00:00.000Z",
  });
});
t("ชั้นไม่รู้จัก หรือไม่มีผล → null", () => {
  assert.equal(Activity10.buildJudgmentPatch(base, { level: "X", result: "a" }), null);
  assert.equal(Activity10.buildJudgmentPatch(base, { level: "FIRST", result: "  " }), null);
});
t("เคสที่ยังไม่มี judgments → เริ่ม array ใหม่", () => {
  const p = Activity10.buildJudgmentPatch({ id: "k" }, { level: "SUPREME", result: "ถึงที่สุด", isFinal: true });
  assert.equal(p.judgments.length, 1);
  assert.equal(p.judgments[0].isFinal, true);
});
t("JUDGMENT_LEVELS มี 4 ชั้น", () => {
  assert.deepEqual(
    Activity10.JUDGMENT_LEVELS.map((l) => l.code),
    ["PROSECUTOR", "FIRST", "APPEAL", "SUPREME"],
  );
});

console.log("\nbuildBoardResolutionPatch (10.1.5)");
t("เห็นชอบ + ครบถ้วน → patch ฟิลด์ board*", () => {
  const r = Activity10.buildBoardResolutionPatch({
    meetingNo: "7/2569",
    meetingDate: "2026-09-30",
    agendaNo: "5.2",
    type: "AGREE",
    text: "ที่ประชุมเห็นชอบ",
    fileNames: ["มติ.pdf"],
  });
  assert.equal(r.ok, true);
  assert.equal(r.patch.boardMeetingNo, "7/2569");
  assert.equal(r.patch.boardMeetingDate, "2026-09-30");
  assert.equal(r.patch.boardAgendaNo, "5.2");
  assert.equal(r.patch.boardResolutionType, "AGREE");
  assert.equal(r.patch.boardResolution, "ที่ประชุมเห็นชอบ");
  assert.deepEqual(r.patch.boardResolutionFiles, ["มติ.pdf"]);
});
t("อื่นๆ ต้องระบุข้อความ", () => {
  const r = Activity10.buildBoardResolutionPatch({
    meetingNo: "7/2569",
    type: "OTHER",
    other: "",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length > 0);
});
t("ไม่มีครั้งที่ประชุม/ประเภทมติ → ไม่ผ่าน", () => {
  assert.equal(Activity10.buildBoardResolutionPatch({}).ok, false);
});
t("ไม่กรอกข้อความมติ → ใช้ชื่อประเภทมติเป็นหัวข้อ", () => {
  const r = Activity10.buildBoardResolutionPatch({ meetingNo: "1/2569", type: "DISAGREE" });
  assert.equal(r.ok, true);
  assert.equal(r.patch.boardResolution, "ไม่เห็นชอบ");
  assert.match(r.patch.boardResolutionDetail, /ครั้งที่ 1\/2569 มีมติไม่เห็นชอบ/);
});

console.log("\nbuildInternalNoticePatch (10.1.9)");
t("บันทึกหลายหน่วยงาน ตัดซ้ำ ต่อท้ายแบบ immutable", () => {
  const k = { id: "k", internalNotices: [] };
  const p = Activity10.buildInternalNoticePatch(
    k,
    {
      units: ["กองกฎหมาย", "กองกฎหมาย", "สำนักงาน ป.ป.ท. เขต 1"],
      docNo: "ปปท 0001/2569",
      date: "2026-10-01",
      subject: "แจ้งผล",
      detail: "รายละเอียด",
      fileNames: ["x.pdf"],
    },
    "นิติกร",
    "2026-10-01T00:00:00.000Z",
  );
  assert.deepEqual(p.internalNotices[0].units, ["กองกฎหมาย", "สำนักงาน ป.ป.ท. เขต 1"]);
  assert.equal(p.internalNotices[0].createdBy, "นิติกร");
  assert.equal(p.internalNotices[0].createdAt, "2026-10-01T00:00:00.000Z");
  assert.equal(k.internalNotices.length, 0);
});
t("ไม่เลือกหน่วยงาน หรือไม่มีเรื่อง → null", () => {
  assert.equal(Activity10.buildInternalNoticePatch({}, { units: [], subject: "x" }), null);
  assert.equal(Activity10.buildInternalNoticePatch({}, { units: ["กองกฎหมาย"], subject: " " }), null);
});
t("INTERNAL_UNITS มีหน่วยหลักครบ (กบค., กองกฎหมาย, ศปท., เขต 1-9, ปปช.ภาครัฐ 1-6)", () => {
  const u = Activity10.INTERNAL_UNITS;
  assert.ok(u.includes("กองบริหารคดี (กบค.)"));
  assert.ok(u.includes("กองกฎหมาย (กอท.)"));
  assert.ok(u.includes("ศูนย์ปฏิบัติการต่อต้านการทุจริต (ศปท.)"));
  assert.ok(u.includes("สำนักงาน ป.ป.ท. เขต 9"));
  assert.ok(u.includes("กองปราบปรามการทุจริตภาครัฐ 6"));
  assert.equal(new Set(u).size, u.length);
});

console.log("\nbuildInternalNoticeMemo");
t("สร้างหัวเรื่อง/ข้อความจากคำพิพากษาล่าสุด", () => {
  const m = Activity10.buildInternalNoticeMemo({
    title: "คดีทดสอบ",
    judgments: [
      { level: "FIRST", result: "ลงโทษ", date: "2026-01-01", blackNo: "อ.1/69", redNo: "อ.2/69" },
      { level: "APPEAL", issuer: "ศาลอุทธรณ์", result: "ยกฟ้อง", date: "2026-09-01", blackNo: "อ.3/70", redNo: "อ.4/70", summary: "เหตุผล" },
    ],
  });
  assert.match(m.subject, /แจ้งผลคำพิพากษา/);
  assert.match(m.subject, /ศาลอุทธรณ์/);
  assert.match(m.detail, /ยกฟ้อง/);
  assert.match(m.detail, /อ\.3\/70/);
  assert.match(m.detail, /เหตุผล/);
});
t("ไม่มีคำพิพากษา → ข้อความตั้งต้นจากชื่อสำนวน", () => {
  const m = Activity10.buildInternalNoticeMemo({ title: "คดีทดสอบ" });
  assert.match(m.subject, /คดีทดสอบ/);
});

t("meeting no. optional: type only -> ok, detail omits meeting no.", () => {
  const r = Activity10.buildBoardResolutionPatch({ type: "AGREE" });
  assert.equal(r.ok, true);
  assert.equal(r.patch.boardMeetingNo, "");
  assert.doesNotMatch(r.patch.boardResolutionDetail, /ครั้งที่/);
});

console.log("\n" + passed + " passed");
