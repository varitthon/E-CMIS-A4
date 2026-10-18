/* หน่วยทดสอบ describeVerdictComparison — บรรทัดเปรียบเทียบ "เดิม vs ล่าสุด" บนหน้า 20/21/22
   โหลด ecmis-activity10.js จริงเข้ามาทดสอบ ไม่ได้คัดลอกตรรกะมาไว้ในไฟล์นี้
   Run: node activity10/tests/verdict-comparison.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../assets/ecmis-activity10.js", import.meta.url),
  "utf8",
);
const sandbox = {};
new Function("window", src)(sandbox);
const { describeVerdictComparison } = sandbox.Activity10;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\ndescribeVerdictComparison");

t("อสส. ชี้ขาดให้ฟ้องคดี → ต่างจากมติอัยการเดิม (DIFFERS)", () => {
  const r = describeVerdictComparison({
    oagVerdictDecision: "PROSECUTE",
    prosecutorCaseTypeNo: "1",
  });
  assert.equal(r.relation, "DIFFERS");
  assert.equal(r.tone, "differs");
  assert.match(r.headline, /ต่างจากมติอัยการเดิม/);
  assert.match(r.headline, /เห็นพ้องตามความเห็นแย้งของ ป\.ป\.ท\./);
});

t("อสส. ชี้ขาดไม่ฟ้อง/ยุติคดี → ยืนตามมติอัยการเดิม (UPHOLDS)", () => {
  const r = describeVerdictComparison({
    oagVerdictDecision: "NON_PROSECUTE",
    prosecutorCaseTypeNo: "1",
  });
  assert.equal(r.relation, "UPHOLDS");
  assert.equal(r.tone, "upholds");
  assert.match(r.headline, /ยืนตามมติอัยการเดิม/);
});

t("มติอัยการเดิมเป็น 9. อื่นๆ → อนุมานความสัมพันธ์ไม่ได้ (UNKNOWN)", () => {
  const r = describeVerdictComparison({
    oagVerdictDecision: "PROSECUTE",
    prosecutorCaseTypeNo: "9",
  });
  assert.equal(r.relation, "UNKNOWN");
  assert.equal(r.tone, "unknown");
});

t("ไม่มี oagVerdictDecision → UNKNOWN แบบปลอดภัย ไม่ฟันธง", () => {
  const r = describeVerdictComparison({ prosecutorCaseTypeNo: "1" });
  assert.equal(r.relation, "UNKNOWN");
  assert.equal(r.tone, "unknown");
});

t("ไม่มี caseItem เลย → ไม่ throw และคืน UNKNOWN", () => {
  const r = describeVerdictComparison();
  assert.equal(r.relation, "UNKNOWN");
  assert.equal(r.tone, "unknown");
});

for (const prosecutorCaseTypeNo of [undefined, "", "invalid", "0", "10", 9]) {
  t(`unknown original type ${prosecutorCaseTypeNo} stays neutral`, () => {
    assert.equal(describeVerdictComparison({ prosecutorCaseTypeNo, oagVerdictDecision: "PROSECUTE" }).relation, "UNKNOWN");
  });
}

for (let type = 1; type <= 8; type++) {
  t(`original type ${type} supports both outcomes`, () => {
    assert.equal(describeVerdictComparison({ prosecutorCaseTypeNo: String(type), oagVerdictDecision: "PROSECUTE" }).relation, "DIFFERS");
    assert.equal(describeVerdictComparison({ prosecutorCaseTypeNo: type, oagVerdictDecision: "NON_PROSECUTE" }).relation, "UPHOLDS");
  });
}

t("latest label preserves the selected appeal ruling", () => {
  assert.equal(describeVerdictComparison({ prosecutorCaseTypeNo: "4", oagVerdictDecision: "PROSECUTE", oagVerdictCaseTypeName: "4. อสส. ชี้ขาดให้อุทธรณ์" }).verdictLabel, "อสส. ชี้ขาดให้อุทธรณ์");
});
t("legacy ruling uses its saved outcome, missing outcome stays neutral", () => {
  assert.equal(describeVerdictComparison({ oagVerdictDecision: "NON_PROSECUTE" }).verdictLabel, "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดี");
  assert.equal(describeVerdictComparison({}).verdictLabel, "ยังไม่มีข้อมูลผลการชี้ขาดล่าสุด");
});
t("other ruling preserves free text", () => {
  assert.equal(describeVerdictComparison({ oagVerdictCaseTypeName: "9. อื่นๆ (ให้สอบสวนเพิ่มเติม)" }).verdictLabel, "อื่นๆ (ให้สอบสวนเพิ่มเติม)");
});

console.log("\n" + passed + " passed\n");
