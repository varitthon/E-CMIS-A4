/* หน่วยทดสอบกฎการเลือกหน่วยงานผู้รับของ Flow 3
   โหลด ecmis-activity10.js จริงเข้ามาทดสอบ ไม่ได้คัดลอกตรรกะมาไว้ในไฟล์นี้
   Run: node activity10/tests/dispatch-recipients.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../assets/ecmis-activity10.js", import.meta.url),
  "utf8",
);
const sandbox = {};
new Function("window", src)(sandbox);
const { getRequiredRecipients } = sandbox.Activity10;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};

console.log("\ngetRequiredRecipients");

t("เห็นชอบ → อัยการต้นทาง เท่านั้น", () => {
  const r = getRequiredRecipients({
    finalOpinionType: "เห็นชอบตามคำสั่งไม่ฟ้องของพนักงานอัยการ",
  });
  assert.deepEqual(r.map((x) => x.key), ["prosecutor"]);
});

t("เห็นแย้ง → อสส. และ อัยการต้นทาง", () => {
  const r = getRequiredRecipients({
    finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
  });
  assert.deepEqual(r.map((x) => x.key), ["oag", "prosecutor"]);
});

t("ไม่มี finalOpinionType → ถือเป็นเห็นแย้ง (ค่าปลอดภัย)", () => {
  const r = getRequiredRecipients({});
  assert.deepEqual(r.map((x) => x.key), ["oag", "prosecutor"]);
});

t("ชื่อเรื่องมีคำว่าเห็นชอบ แต่ผลจริงเป็นเห็นแย้ง → ต้องไม่หลงเชื่อชื่อเรื่อง", () => {
  const r = getRequiredRecipients({
    title: "พิจารณาคำสั่งไม่ฟ้อง (เห็นชอบตามอัยการ)",
    finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
  });
  assert.deepEqual(r.map((x) => x.key), ["oag", "prosecutor"]);
});

t("override = AGREED บังคับให้เหลือหน่วยงานเดียว", () => {
  const r = getRequiredRecipients(
    { finalOpinionType: "เห็นควรทำความเห็นแย้ง..." },
    "AGREED",
  );
  assert.deepEqual(r.map((x) => x.key), ["prosecutor"]);
});

t("ชื่อหน่วยงานอัยการต้นทางมาจาก source ของสำนวน", () => {
  const r = getRequiredRecipients({
    finalOpinionType: "เห็นชอบ...",
    source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
  });
  assert.equal(r[0].name, "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3");
});

console.log("\nsaveDispatchRecipient");

/* store อ่าน/เขียนผ่าน localStorage — ใส่ตัวจำลองแบบง่ายให้ทดสอบใน Node ได้
   loadCases/saveCases ในซอร์สอ้างถึง localStorage แบบ bare (ไม่ใช่ window.localStorage)
   เพราะเป็นโค้ดที่ตั้งใจรันในเบราว์เซอร์จริงซึ่ง localStorage เป็นตัวแปร global อยู่แล้ว
   ถ้าตั้ง mock ไว้แค่บน win.localStorage ตัวแปร bare จะหา localStorage ไม่เจอ โยน
   ReferenceError ซึ่งถูก try/catch ในซอร์สกลืนเงียบ ๆ ทุกครั้ง (persistence จะไม่ทำงานจริง
   แต่ assertion ยังผ่านเพราะ catch-path คืน array ที่ห่อ object เดิมไว้) จึงต้องตั้งบน
   globalThis ด้วยให้ตัวแปร bare หาเจอ และตั้งใหม่ทุกครั้งที่เรียกเพื่อแยก store ระหว่างเทสต์ */
const makeStore = (seedCase) => {
  const box = {};
  const mockLocalStorage = {
    getItem: (k) => (k in box ? box[k] : null),
    setItem: (k, v) => {
      box[k] = String(v);
    },
    removeItem: (k) => {
      delete box[k];
    },
    key: (i) => Object.keys(box)[i],
    get length() {
      return Object.keys(box).length;
    },
  };
  globalThis.localStorage = mockLocalStorage;
  const win = { localStorage: mockLocalStorage };
  new Function("window", src)(win);
  const A = win.Activity10;
  const cases = A.getCases();
  Object.assign(cases[0], seedCase);
  A.saveCases(cases); // ต้อง expose saveCases ก่อน (ดู Step 3) เดิมมีแต่ getCases
  return { A, id: cases[0].id };
};

const DISAGREE = "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
const AGREE = "เห็นชอบตามคำสั่งไม่ฟ้องของพนักงานอัยการ";

t("บันทึกหน่วยงานแรกแล้วสำนวนยังไม่เสร็จ", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  const c = A.saveDispatchRecipient(id, "oag", {
    name: "สำนักงานอัยการสูงสุด (อสส.)",
    method: "postal_ems",
    trackingNo: "ED887711223TH",
    sentDate: "2026-09-06",
    postOffice: "ปณ.หลักสี่",
  });
  const p = A.getDispatchProgress(c);
  assert.equal(p.saved, 1);
  assert.equal(p.total, 2);
  assert.equal(p.complete, false);
  assert.notEqual(c.statusCode, "DISPATCHED_TO_PROSECUTOR");
});

t("บันทึกครบทุกหน่วยงานแล้วสำนวนเสร็จ", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", {
    name: "สำนักงานอัยการสูงสุด (อสส.)",
    method: "postal_ems",
    trackingNo: "ED887711223TH",
  });
  const c = A.saveDispatchRecipient(id, "prosecutor", {
    name: "สำนักงานอัยการพิเศษฯ 3",
    method: "hand_delivery",
    receiveDocNo: "อส 0042/2569",
  });
  assert.equal(A.getDispatchProgress(c).complete, true);
  assert.equal(c.statusCode, "DISPATCHED_TO_PROSECUTOR");
});

t("เห็นชอบมีหน่วยงานเดียว บันทึกครั้งเดียวก็เสร็จ", () => {
  const { A, id } = makeStore({ finalOpinionType: AGREE });
  const c = A.saveDispatchRecipient(id, "prosecutor", {
    name: "สำนักงานอัยการพิเศษฯ 3",
    method: "postal_ems",
    trackingNo: "ED111111111TH",
  });
  assert.equal(A.getDispatchProgress(c).complete, true);
  assert.equal(c.statusCode, "DISPATCHED_TO_PROSECUTOR");
});

t("ฉายค่าของ อสส. ลงฟิลด์เดิมให้หน้า 19 อ่านได้", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "prosecutor", {
    name: "สำนักงานอัยการพิเศษฯ 3",
    method: "hand_delivery",
    receiveDocNo: "ไม่ใช่ของ อสส.",
  });
  const c = A.saveDispatchRecipient(id, "oag", {
    name: "สำนักงานอัยการสูงสุด (อสส.)",
    method: "postal_ems",
    trackingNo: "ED887711223TH",
  });
  assert.equal(c.dispatchMethod, "postal_ems");
  assert.equal(c.emsTrackingNo, "ED887711223TH");
  assert.equal(c.dispatchRecipientName, "สำนักงานอัยการสูงสุด (อสส.)");
});

t("เห็นชอบ: ฉายค่าจากหน่วยงานเดียวที่มี", () => {
  const { A, id } = makeStore({ finalOpinionType: AGREE });
  const c = A.saveDispatchRecipient(id, "prosecutor", {
    name: "สำนักงานอัยการพิเศษฯ 3",
    method: "hand_delivery",
    receiveDocNo: "อส 0042/2569",
  });
  assert.equal(c.dispatchMethod, "hand_delivery");
  assert.equal(c.oagReceiveDocNo, "อส 0042/2569");
});

t("ค่าที่ Flow 4 ใช้ยังคงเดิม", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "E1" });
  const c = A.saveDispatchRecipient(id, "prosecutor", { name: "อัยการ", method: "postal_ems", trackingNo: "E2" });
  assert.equal(c.dispatchScenario, "case_disagreed");
  assert.equal(c.dispatchRecipientType, "attorney_general");
});

t("เห็นชอบต้องไม่ถูกส่งเข้า Flow 4", () => {
  const { A, id } = makeStore({ finalOpinionType: AGREE });
  const c = A.saveDispatchRecipient(id, "prosecutor", { name: "อัยการ", method: "postal_ems", trackingNo: "E1" });
  assert.equal(c.dispatchScenario, "case_agreed");
  assert.equal(c.dispatchRecipientType, "prosecutor_origin");
});

t("สลับ scenario ผ่าน opinionOverride แล้วระเบียนที่บันทึกไว้ต้องไม่ถูกลบ แต่ไม่ถูกนับ", () => {
  /* ผู้ทดสอบกด "เห็นชอบ" (opinionOverride) หลังบันทึก อสส. ไปแล้ว ระเบียนของ อสส. ต้องยังอยู่
     แค่ไม่ถูกนับว่าจำเป็นอีกต่อไป การลบข้อมูลการส่งจริงเพราะปุ่มสาธิตย่อมแย่กว่า
     ขับเคลื่อนผ่าน opinionOverride ซึ่งเป็นกลไกจริงที่หน้า 18 ใช้ (หลัง F2) แทนการยัด
     finalOpinionType ลง object ตรง ๆ อย่างเดิม — เดิมเทสต์นี้ assert แค่ length/total/complete
     โดยไม่แตะ saved เลย ทำให้ตัวกรองหน่วยงานที่ไม่จำเป็นออกจาก saved (getDispatchProgress)
     ลบได้โดยไม่มีเทสต์ไหนจับ */
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "E1" });
  const after = A.saveDispatchRecipient(
    id,
    "prosecutor",
    { name: "อัยการ", method: "postal_ems", trackingNo: "E2" },
    "AGREED",
  );
  assert.equal(after.dispatchRecipients.length, 2, "ระเบียนของ อสส. ต้องยังอยู่ (ไม่ถูกลบ)");
  const progress = A.getDispatchProgress(after, "AGREED");
  assert.equal(progress.total, 1, "นับเฉพาะหน่วยงานที่จำเป็นภายใต้ override");
  assert.equal(
    progress.saved,
    1,
    "saved ต้องนับเฉพาะระเบียนที่ยังจำเป็น ไม่รวมของ อสส. ที่กลายเป็นหน่วยงานส่วนเกิน",
  );
  assert.equal(progress.complete, true);
  assert.equal(
    after.dispatchScenario,
    "case_disagreed",
    "Flow4 ต้องยังอิงผลการพิจารณาจริง ไม่ใช่ override",
  );
});

t("F2: opinionOverride ทำให้สำนวนเห็นแย้งเหลือหน่วยงานเดียวและเสร็จได้ โดย dispatchScenario ยังอิงผลจริง", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  const caseItem = A.getCases().find((c) => c.id === id);
  assert.equal(A.getDispatchProgress(caseItem, "AGREED").total, 1);
  const c = A.saveDispatchRecipient(
    id,
    "prosecutor",
    { name: "อัยการ", method: "postal_ems", trackingNo: "E1" },
    "AGREED",
  );
  assert.equal(A.getDispatchProgress(c, "AGREED").complete, true);
  assert.equal(c.dispatchScenario, "case_disagreed");
});

t("บันทึกซ้ำหน่วยงานเดิมเป็นการทับ ไม่ใช่เพิ่มรายการ", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "OLD" });
  const c = A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "NEW" });
  assert.equal(c.dispatchRecipients.filter((r) => r.key === "oag").length, 1);
  assert.equal(c.dispatchRecipients.find((r) => r.key === "oag").trackingNo, "NEW");
});

t("บันทึกแล้วอ่านใหม่ผ่าน getCases สด ๆ ต้องเจอข้อมูลจริง (พิสูจน์ว่า persist ผ่าน localStorage จริง ไม่ใช่แค่ reference เดิม)", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", {
    name: "สำนักงานอัยการสูงสุด (อสส.)",
    method: "postal_ems",
    trackingNo: "ED887711223TH",
  });
  const reread = A.getCases().find((c) => c.id === id); // อ่านใหม่ทั้งชุด ไม่ใช้ object ที่ฟังก์ชันคืนมาโดยตรง
  const rec = reread.dispatchRecipients.find((r) => r.key === "oag");
  assert.equal(rec.trackingNo, "ED887711223TH");
  assert.equal(reread.status, "นิติกรจัดส่งหนังสือ (บันทึกแล้ว 1/2)");
});

console.log("\n" + passed + " passed\n");
