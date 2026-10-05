/* หน่วยทดสอบ — เติมข้อมูลตัวอย่าง สำนวน 0005/2569 (assets/ecmis-demo-case.js)
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
  assert.equal(CASE.no, "0005/2569");
  assert.equal(CASE.complainant, "นายสมชาย รักความยุติธรรม");
  assert.equal(CASE.accused, "นายสมศักดิ์ หาผลประโยชน์");
  assert.equal(CASE.section, "18/1 ก");
  assert.match(CASE.subject, /แป๊ะเจี๊ยะ/);
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
  assert.equal(fileNameFor({ id: "in_emsReceiptFile" }), "ใบรับฝากEMS_สำนวน_0005-2569.pdf");
  assert.equal(fileNameFor({ id: "in_denyMemoFile" }), "บันทึกข้อความ_สำนวน_0005-2569.pdf");
  assert.equal(fileNameFor({ id: "" }), "เอกสารประกอบ_สำนวน_0005-2569.pdf");
});

console.log(`\n${passed} passed`);
