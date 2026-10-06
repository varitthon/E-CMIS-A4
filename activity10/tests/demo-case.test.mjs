/* หน่วยทดสอบ — เติมข้อมูลตัวอย่าง สำนวน 0001/2569 (assets/ecmis-demo-case.js)
   - ECMIS_DEMO.isOn                 ค่าตั้งต้น OFF
   - valueFor                        ค่ารายช่อง / กฎตาม id / วันที่ / ช่องที่ไม่เติม
   - pickOption                      ข้าม "-- เลือก --" และ อื่นๆ, เลือกศาลปกครองกลางก่อน
   - fileNameFor                     ชื่อไฟล์จำลองตามความหมายของช่อง
   Run: node activity10/tests/demo-case.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-demo-case.js"))(sandbox);
const { ECMIS_DEMO } = sandbox;
const { CASE, NO, TEXT, valueFor, pickOption, fileNameFor, isoDate } = sandbox.ECMIS_DEMO_HELPERS;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};
const TODAY = new Date(2026, 9, 5);
const f = (id, extra) => Object.assign({ id, tag: "input", type: "text", page: "06-officer-opinion.html" }, extra);

console.log("ECMIS_DEMO switch");
t("ไม่มี localStorage → ค่าตั้งต้น OFF", () => {
  assert.equal(ECMIS_DEMO.isOn(), false);
});

console.log("ข้อมูลสำนวน");
t("ตรงกับสำนวนที่กำหนด", () => {
  assert.equal(CASE.no, "0001/2569");
  assert.equal(CASE.complainant, "ตรีรุด หล่อจัง");
  assert.equal(CASE.accused, "ณัฐกานต์ แพนดอร่า");
  assert.equal(CASE.section, "18/1 ก");
  assert.equal(CASE.subject, "สูบบุหรี่ในที่ทำงาน");
  /* สำนวนสาธิตต้องมีอยู่จริงในฐานข้อมูลสำนวนคดีเดิม (หน้า 02 เลือกด้วย id นี้) */
  const seed = {};
  new Function("window", read("../assets/ecmis-activity10.js"))(seed);
  const rec = seed.Activity10.getPaccIntakeDatabase().find((c) => c.id === CASE.id);
  assert.ok(rec, "ไม่พบ " + CASE.id + " ใน PACC_INTAKE_DATABASE");
  assert.equal(rec.accuser, CASE.complainant);
  assert.equal(rec.accused, CASE.accused);
  assert.equal(rec.title, CASE.subject);
});

console.log("valueFor");
t("id ตรงตัว", () => {
  assert.equal(valueFor(f("in_requesterName"), TODAY), CASE.complainant);
  assert.equal(valueFor(f("in_blackCaseNo"), TODAY), NO.adminBlack);
  assert.equal(valueFor(f("in_title", { tag: "textarea" }), TODAY), CASE.subject);
});
t("id มีลำดับท้าย (ฐานความผิด)", () => {
  assert.equal(valueFor(f("in_offenseSection_2"), TODAY), "157");
});
t("หมายเหตุไม่ถูกนับเป็นเลขที่หนังสือ", () => {
  assert.equal(valueFor(f("in_dispatchNotes", { tag: "textarea" }), TODAY), TEXT.note);
  assert.equal(valueFor(f("in_receiveNotes", { tag: "textarea" }), TODAY), TEXT.note);
  assert.equal(valueFor(f("in_dispatchNo"), TODAY), NO.dispatch);
  assert.equal(valueFor(f("in_receiveNo"), TODAY), NO.lawReceive);
});
t("กฎตามคำใน id", () => {
  assert.equal(valueFor(f("in_channelEms"), TODAY), NO.ems);
  assert.equal(valueFor(f("in_externalDocNo"), TODAY), NO.externalDoc);
  assert.equal(valueFor(f("in_directorNotes", { tag: "textarea" }), TODAY), TEXT.order);
  assert.equal(valueFor(f("in_opinion", { tag: "textarea" }), TODAY), TEXT.opinion);
});
t("วันที่ ISO: วันนี้ / กำหนด +30 / อายุความ +15 ปี", () => {
  assert.equal(valueFor(f("in_docDate", { type: "date" }), TODAY), "2026-10-05");
  assert.equal(valueFor(f("in_dueDate", { type: "date" }), TODAY), "2026-11-04");
  assert.equal(valueFor(f("in_crimPrescriptionDate", { type: "date" }), TODAY), "2041-10-05");
  assert.equal(isoDate(TODAY, 27), "2026-11-01");
});
t("เลขคดีแดงเฉพาะหน้าที่ศาลตัดสินแล้ว", () => {
  assert.equal(valueFor(f("in_redCaseNo", { page: "02-board-intake.html" }), TODAY), null);
  assert.equal(valueFor(f("in_redCaseNo", { page: "10-3v-00-legal-admin-verdict-intake.html" }), TODAY), NO.adminRed);
  assert.equal(valueFor(f("in_crimRedNo"), TODAY), NO.crimRed);
});
t("ไม่เติมช่องค้นหา/ตัวกรอง/เข้าสู่ระบบ/checkbox", () => {
  assert.equal(valueFor(f("intakeSearchInput"), TODAY), null);
  assert.equal(valueFor(f("filterOfficer", { tag: "select" }), TODAY), null);
  assert.equal(valueFor(f("loginPassword", { type: "password" }), TODAY), null);
  assert.equal(valueFor(f("in_skipSecgen", { type: "checkbox" }), TODAY), null);
  assert.equal(valueFor(f("p4RegQ", { type: "search" }), TODAY), null);
});

t("hasExact: ค่าเจาะจงเท่านั้นที่แทนค่าตัวอย่างใน HTML ได้", () => {
  assert.equal(sandbox.ECMIS_DEMO_HELPERS.hasExact("in_summary"), true);
  assert.equal(sandbox.ECMIS_DEMO_HELPERS.hasExact("in_offenseBasis_3"), true);
  assert.equal(sandbox.ECMIS_DEMO_HELPERS.hasExact("in_notes"), false);
});

console.log("pickOption");
t("ข้ามตัวเลือกว่าง / -- เลือก -- / อื่นๆ / disabled", () => {
  const opts = [
    { value: "", text: "-- เลือก --" },
    { value: "x", text: "-- กรุณาเลือก --" },
    { value: "d", text: "ปิดใช้", disabled: true },
    { value: "other", text: "อื่นๆ" },
    { value: "n1", text: "นายณัฐพล บัวทุม" },
  ];
  assert.equal(pickOption(opts, "in_forwardTo"), "n1");
  assert.equal(pickOption([{ value: "", text: "-- เลือก --" }], "x"), null);
});
t("ศาล → ศาลปกครองกลางก่อน", () => {
  const opts = [{ value: "a", text: "ศาลปกครองเชียงใหม่" }, { value: "b", text: "ศาลปกครองกลาง" }];
  assert.equal(pickOption(opts, "in_courtName"), "b");
});

console.log("fileNameFor");
t("ชื่อไฟล์ตามความหมาย", () => {
  assert.equal(fileNameFor({ id: "in_emsReceiptFile" }), "ใบรับฝากEMS_สำนวน_0001-2569.pdf");
  assert.equal(fileNameFor({ id: "in_denyMemoFile" }), "บันทึกข้อความ_สำนวน_0001-2569.pdf");
  assert.equal(fileNameFor({ id: "" }), "เอกสารประกอบ_สำนวน_0001-2569.pdf");
});

console.log("ป๊อปอัปกิจกรรมที่ 7 (ตรง Excel กจ10 เส้นทาง)");
const { act7LinkFromText, ACT7 } = sandbox.ECMIS_DEMO_HELPERS;
const bypassSrc = read("../assets/ecmis-act7-bypass.js");
const a7 = (id, link, extra) => f(id, Object.assign({ act7: link, page: "01-work-inbox.html" }, extra));
t("ระบุจุดเชื่อมจากชื่อมติในป๊อปอัป (ชื่อยังตรงกับ ecmis-act7-bypass.js)", () => {
  const titles = {
    B1: "มติคณะกรรมการ ป.ป.ท. (ความเห็นแย้ง)",
    B2: "มติคณะกรรมการ ป.ป.ท. (รอบ 2)",
    B3: "มติคณะกรรมการ ป.ป.ท. (มอบอำนาจ)",
    B4: "มติคณะกรรมการ ป.ป.ท. ต่อคำอุทธรณ์",
    B5: "มติคณะกรรมการ ป.ป.ท. (อุทธรณ์/ไม่อุทธรณ์)",
  };
  Object.entries(titles).forEach(([link, title]) => {
    assert.ok(bypassSrc.includes('title: "' + title + '"'), "ชื่อมติเปลี่ยน: " + title);
    assert.equal(act7LinkFromText("ผลพิจารณาจากกิจกรรมที่ 7 " + title + " — สำนวน คดี-100001/2569"), link);
  });
  assert.equal(act7LinkFromText("หน้าอื่น ไม่มีป๊อปอัป"), null);
});
t("ค่าต่อจุดเชื่อม: ครั้งที่ / วาระ / เลขหนังสือแจ้งมติ / มติ", () => {
  assert.equal(valueFor(a7("act7_meetingNo", "B1"), TODAY), "6/2570");
  assert.equal(valueFor(a7("act7_agendaNo", "B1"), TODAY), "3.2");
  assert.equal(valueFor(a7("act7_noticeNo", "B1"), TODAY), "ปปท 0004/0110");
  assert.equal(valueFor(a7("act7_noticeNo", "B2"), TODAY), "ปปท 0004/0104");
  assert.equal(valueFor(a7("act7_noticeNo", "B4"), TODAY), "ปปท 0004/0111");
  assert.equal(valueFor(a7("act7_meetingNo", "B3"), TODAY), "10/2570");
  assert.equal(valueFor(a7("act7_agendaNo", "B3"), TODAY), "4.12");
  assert.equal(valueFor(a7("act7_noticeNo", "B3"), TODAY), "ปปท 0004/0112");
  assert.equal(valueFor(a7("act7_meetingNo", "B5"), TODAY), "ม.20-4.5/2570");
  assert.equal(ACT7.B2.decision, "DENY");
  assert.equal(ACT7.B4.decision, "DENY");
  assert.equal(ACT7.B5.decision, "APPEAL");
});
t("รายละเอียดมติ = ความเห็นที่ประชุม (ข้อความอิสระ) · วันที่ = วันที่ทดสอบ", () => {
  assert.match(valueFor(a7("act7_detail", "B1", { tag: "textarea" }), TODAY), /เห็นชอบให้ทำความเห็นแย้ง/);
  assert.match(valueFor(a7("act7_detail", "B2", { tag: "textarea" }), TODAY), /ไม่อนุญาตให้เปิดเผย/);
  assert.match(valueFor(a7("act7_detail", "B5", { tag: "textarea" }), TODAY), /ให้ยื่นอุทธรณ์/);
  assert.equal(valueFor(a7("act7_meetingDate", "B1", { type: "date" }), TODAY), "2026-10-05");
});
t("นอกป๊อปอัปที่ระบุจุดไม่ได้ → ใช้กฎเดิม", () => {
  assert.equal(valueFor(f("act7_noticeNo"), TODAY), NO.externalDoc);
});
t("ไฟล์มติต่อจุดเชื่อม", () => {
  assert.equal(fileNameFor({ id: "act7_files", act7: "B3" }), "มติ_ครั้งที่10-2570_วาระ4.12.pdf");
});
t("ค่าทุกจุดผ่านการตรวจของป๊อปอัปจริง (buildAct7Patch)", () => {
  const box = {};
  new Function("window", read("../assets/ecmis-activity10.js"))(box);
  new Function("window", bypassSrc)(box);
  const { buildAct7Patch } = box.ECMIS_ACT7_HELPERS;
  ["B1", "B2", "B3", "B4", "B5"].forEach((link) => {
    const v = ACT7[link];
    const form = Object.assign({ meetingDate: "2026-10-05", noticeDate: "2026-10-05" }, v,
      { fileNames: v.file ? [v.file] : [] });
    const res = buildAct7Patch(link, {}, form, "ทดสอบ", "2026-10-05");
    assert.equal(res.error, undefined, link + ": " + res.error);
  });
});
t("10.3 คำพิพากษาชั้นต้น = ป.ป.ท. แพ้ (ไปจุด B5) · ศาลสูงสุด = ชนะ", () => {
  assert.match(valueFor(f("in_verdictSummary", { tag: "textarea" }), TODAY), /แพ้คดี/);
  assert.match(valueFor(f("l3sr_summary", { tag: "textarea" }), TODAY), /ศาลปกครองสูงสุด.*ยกฟ้อง/);
});

console.log(`\n${passed} passed`);
