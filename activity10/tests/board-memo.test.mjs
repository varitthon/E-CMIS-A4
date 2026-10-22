/* หน่วยทดสอบ — บันทึกเสนอเข้าบอร์ดเพื่อมีมติ (เอกสารสด 10-3-04, ref PDF 3) 2026-10-21
   - ค่าตั้งต้นเติมจากข้อมูลคดี (ศาล / เลขคดีดำ / ผู้ฟ้องคดี / วันครบกำหนด / นิติกร)
   - ช่อง/editor ที่หน้า 10-3-04 ใช้ตรงกับรายการที่ส่งออก
   Run: node activity10/tests/board-memo.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = { localStorage: globalThis.localStorage };
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(sandbox, sandbox.Activity10);
new Function("window", read("../assets/ecmis-10-3-docs.js"))(sandbox);
const D = sandbox.ECMIS103Docs;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

const kase = {
  courtName: "ศาลปกครองกลาง",
  blackCaseNo: "บ.71/2569",
  plaintiffs: ["นายสุวิยะ หนูมะเริง"],
  defendants: ["นายก", "นายข", "คณะกรรมการ ป.ป.ท."],
  courtReceivedDate: "2026-05-19",
  courtDeadlineDays: 30,
  l3GroupAssignTarget: "นายณัฐพล บัวทุม (นิติกร กลุ่มงานคดี)",
};

console.log("boardMemoDefaults");
t("ช่องหัวบันทึกเติมจากเคส", () => {
  const { fields } = D.boardMemoDefaults(kase);
  assert.equal(fields.bm_urgency, "ด่วนที่สุด");
  assert.equal(fields.bm_subject, "ศาลปกครองกลาง มีหมายแจ้งคำสั่งเรียกให้ทำคำให้การ คดีหมายเลขดำที่ บ.71/2569");
  assert.equal(fields.bm_to, "ประธานกรรมการ ป.ป.ท. (ผ่านเลขาธิการคณะกรรมการ ป.ป.ท.)");
  assert.equal(fields.bm_proposerName, "นายณัฐพล บัวทุม", "ตัดวงเล็บตำแหน่งออก");
  assert.equal(fields.bm_phone, "1801 (ณัฐพล)");
  assert.match(fields.bm_docDate, /^\d{4}-\d{2}-\d{2}$/);
});
t("๒. ข้อเท็จจริง: ผู้ถูกฟ้องคดีที่ 3, วันรับคำสั่ง และวันครบกำหนด 30 วัน", () => {
  const { editors } = D.boardMemoDefaults(kase);
  assert.match(editors.bm_facts, /ผู้ถูกฟ้องคดีที่ 3/);
  assert.match(editors.bm_facts, /กับพวกรวม 3 คน/);
  assert.match(editors.bm_facts, /๑๙ พฤษภาคม ๒๕๖๙/);
  assert.match(editors.bm_facts, /๑๘ มิถุนายน ๒๕๖๙/);
});
t("๓ ข้อกฎหมาย / ๔ ข้อพิจารณา มีข้อความมาตรฐานตามแบบ", () => {
  const { editors } = D.boardMemoDefaults(kase);
  assert.match(editors.bm_law, /มาตรา 44/);
  assert.match(editors.bm_law, /พ\.ศ\. 2568/);
  assert.match(editors.bm_consider, /4\.1 มีมติมอบอำนาจ/);
  assert.match(editors.bm_consider, /4\.4 มีมติมอบหมายผู้อำนวยการกองกฎหมาย/);
  assert.match(editors.bm_consider, /ศาลปกครองกลาง/);
});
t("เคสไม่มีข้อมูล → ใช้ …… ไม่ error", () => {
  const { fields, editors } = D.boardMemoDefaults({});
  assert.match(fields.bm_subject, /……/);
  assert.match(editors.bm_facts, /……/);
});
t("ข้อความจากเคสถูก escape", () => {
  const { editors } = D.boardMemoDefaults(Object.assign({}, kase, { plaintiffs: ["<b>x</b>"] }));
  assert.ok(!editors.bm_facts.includes("<b>x</b>"));
  assert.match(editors.bm_facts, /&lt;b&gt;x&lt;\/b&gt;/);
});
t("รายการช่อง/editor ครบตามหน้า 10-3-04", () => {
  const { fields, editors } = D.boardMemoDefaults(kase);
  assert.deepEqual(Object.keys(fields).sort(), D.BOARD_MEMO_FIELDS.slice().sort());
  assert.deepEqual(Object.keys(editors).sort(), D.BOARD_MEMO_EDITORS.slice().sort());
  const page = read("../10-3-04-lawyer-review-complaint.html");
  D.BOARD_MEMO_FIELDS.concat(D.BOARD_MEMO_EDITORS).forEach((id) => assert.ok(page.includes(`id="${id}"`), id));
});

console.log(`\n${passed} passed`);
