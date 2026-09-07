/* หน่วยทดสอบ buildVerdictAutofill — ข้อความสรุป/ชื่อไฟล์ตัวอย่างที่หน้า 19 เติมให้อัตโนมัติ
   เมื่อธุรการเลือก "กรณีคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)"

   บั๊กที่พบ: ก่อนแก้ ฟังก์ชันเดิม (renderVerdictOutcomeHint) เติมข้อความตาม isProsecute
   (ฟ้อง/ไม่ฟ้อง) แบบตายตัวเพียง 2 แบบ ไม่ว่าจะเลือกตัวเลือกใดใน 9 ข้อ ทำให้เลือก
   "7. อสส. ชี้ขาดให้ฎีกา" แล้วสรุปสาระสำคัญ/ชื่อไฟล์ยังพูดถึง "ฟ้องคดี" อยู่ ซึ่งไม่ตรงกับ
   หัวข้อคำวินิจฉัยล่าสุดที่หน้า 20/21/22 อ่านจาก oagVerdictCaseTypeName (ถูกต้องอยู่แล้ว)
   ทำให้เกิดข้อความไม่ตรงกันระหว่างหัวข้อกับเนื้อหาในหน้าเดียวกัน

   โหลด ecmis-activity10.js จริงเข้ามาทดสอบ ไม่ได้คัดลอกตรรกะมาไว้ในไฟล์นี้
   Run: node activity10/tests/verdict-autofill.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../assets/ecmis-activity10.js", import.meta.url),
  "utf8",
);
const sandbox = {};
new Function("window", src)(sandbox);
const { buildVerdictAutofill } = sandbox.Activity10;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\nbuildVerdictAutofill");

t("ตัวเลือก 7 (ให้ฎีกา) → สรุปและชื่อไฟล์ต้องพูดถึงฎีกา ไม่ใช่ฟ้องคดี", () => {
  const r = buildVerdictAutofill({
    caseTypeNo: "7",
    caseTypeOptionText: "7. อสส. ชี้ขาดให้ฎีกา",
    decision: "PROSECUTE",
  });
  assert.match(r.summary, /ฎีกา/);
  assert.doesNotMatch(r.summary, /ฟ้องคดี/);
  assert.match(r.fileName, /ฎีกา/);
  assert.doesNotMatch(r.fileName, /ฟ้องคดี/);
});

t("ตัวเลือก 5 (ให้อุทธรณ์) → สรุปและชื่อไฟล์ต้องพูดถึงอุทธรณ์ ไม่ใช่ฟ้องคดี", () => {
  const r = buildVerdictAutofill({
    caseTypeNo: "5",
    caseTypeOptionText: "5. อสส. ชี้ขาดให้อุทธรณ์",
    decision: "PROSECUTE",
  });
  assert.match(r.summary, /อุทธรณ์/);
  assert.doesNotMatch(r.summary, /ฟ้องคดี/);
  assert.match(r.fileName, /อุทธรณ์/);
});

t("ตัวเลือก 2 (ยืนตามคำสั่งไม่ฟ้อง) → สรุปพูดถึงยืนตามคำสั่งเดิม ไม่ใช่ข้อความไม่ฟ้องคดีทั่วไป", () => {
  const r = buildVerdictAutofill({
    caseTypeNo: "2",
    caseTypeOptionText: "2. อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง",
    decision: "NON_PROSECUTE",
  });
  assert.match(r.summary, /ยืนตามคำสั่งไม่ฟ้อง/);
  assert.match(r.fileName, /ยืนตามคำสั่งไม่ฟ้อง/);
});

t("ตัวเลือก 9 (อื่นๆ) → ใช้ข้อความที่ธุรการพิมพ์เอง ไม่ใช้ข้อความคงที่", () => {
  const r = buildVerdictAutofill({
    caseTypeNo: "9",
    otherText: "ให้สอบสวนเพิ่มเติม",
    decision: "PROSECUTE",
  });
  assert.match(r.summary, /ให้สอบสวนเพิ่มเติม/);
  assert.match(r.fileName, /อื่นๆ/);
});

t("ไม่มีตัวเลือกที่บันทึกไว้ (สำนวนเก่าก่อน 07/09/2569) → PROSECUTE ยังคงข้อความทั่วไปได้", () => {
  const r = buildVerdictAutofill({ decision: "PROSECUTE" });
  assert.match(r.summary, /ฟ้องคดี/);
  assert.match(r.fileName, /ฟ้องคดี/);
});

t("ไม่มีตัวเลือกที่บันทึกไว้ (สำนวนเก่าก่อน 07/09/2569) → NON_PROSECUTE ยังคงข้อความทั่วไปได้", () => {
  const r = buildVerdictAutofill({ decision: "NON_PROSECUTE" });
  assert.match(r.summary, /ไม่ฟ้อง/);
  assert.match(r.fileName, /ไม่ฟ้องคดี/);
});

t("ตัวเลือกต่างกันต้องได้ชื่อไฟล์ต่างกัน (กันการเขียนทับด้วยข้อความเดิม)", () => {
  const a = buildVerdictAutofill({ caseTypeNo: "5", caseTypeOptionText: "5. อสส. ชี้ขาดให้อุทธรณ์", decision: "PROSECUTE" });
  const b = buildVerdictAutofill({ caseTypeNo: "7", caseTypeOptionText: "7. อสส. ชี้ขาดให้ฎีกา", decision: "PROSECUTE" });
  assert.notEqual(a.fileName, b.fileName);
});

console.log("\n" + passed + " passed\n");
