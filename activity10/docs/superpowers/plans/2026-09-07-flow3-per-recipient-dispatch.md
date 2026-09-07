# Flow 3 Per-Recipient Dispatch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive dispatch recipients from the นิติกร's opinion and let each recipient's delivery be recorded independently, so a เห็นแย้ง case notifies both อสส. and อัยการต้นทาง with separate delivery details.

**Architecture:** A pure rule in the shared store decides which recipients a case needs. Page 18 renders one tab per recipient, each with its own delivery record and save. The store upserts records into `dispatchRecipients[]`, completes the case when all are saved, and projects the อสส. record into today's flat fields so page 19 and the work inbox keep working untouched.

**Tech Stack:** Vanilla ES5-compatible browser JS (classic `<script>`, no modules), plain HTML/CSS, `localStorage` persistence, `node:assert/strict` for unit tests.

**Spec:** `activity10/docs/superpowers/specs/2026-09-07-flow3-per-recipient-dispatch-design.md`

## Global Constraints

- **Never use ES modules or `type="module"`.** Pages are opened directly via `file://` as well as over HTTP; module scripts are CORS-blocked on `file://`. Follow the existing classic-script global pattern: `(function (global) { … })(typeof window !== "undefined" ? window : globalThis)`.
- **Bump `?v=` on every page after editing a shared asset**, or the change is invisible behind a warm cache. `ecmis-activity10.js` is currently `?v=20260907_2` on 32 pages. This has cost time three times already.
- **Comments in Thai**, matching surrounding code. Explain *why*, not *what*.
- **Preserve `dispatchScenario` and `dispatchRecipientType` values exactly.** `01-work-inbox.html:1712` and `:1933` route to page 19 on `dispatchRecipientType === "attorney_general" || dispatchScenario === "case_disagreed"`. Flow 4 is out of scope — do not change its inputs.
- **Preserve the flat delivery fields** `dispatchMethod` / `emsTrackingNo` / `oagReceiveDocNo` / `dispatchRecipientName`. `19:578-580` reads them.
- **Commit cadence — read this.** The project owner requires **few big commits, not one per task**. Task-level commits below are **checkpoints to be squashed**. Task 9 squashes them. Never add `Co-Authored-By: Claude` or any Claude attribution; author and committer must both be the user's own git identity.
- **Test command:** `node activity10/tests/dispatch-recipients.test.mjs`
- **Browser verification:** serve with `activity10/run.bat` (→ `http://localhost:8811`) or `python -m http.server`. Never verify over `file://` — `localStorage` there is a separate origin from the served one.

---

## File Structure

| file | responsibility | change |
|---|---|---|
| `activity10/assets/ecmis-activity10.js` | shared store + rules | add `getRequiredRecipients()`; reshape `submitOfficerExternalDispatch()` |
| `activity10/tests/dispatch-recipients.test.mjs` | unit tests for the above | **create** |
| `activity10/17-legal-admin-external-dispatch-receive.html` | ธุรการ verify + forward | recipient picker → read-only derived panel |
| `activity10/18-officer-external-dispatch.html` | นิติกร record deliveries | tabs, per-recipient form, per-tab save, 2-button selector |
| `activity10/01-work-inbox.html` | queue | show `(บันทึกแล้ว n/m)` progress |

`getRequiredRecipients` goes in `ecmis-activity10.js` rather than a new file because that file already loads cleanly in Node with a `window` stub (verified), so it is unit-testable in place, and both 17 and 18 already load it.

---

## Task 1: The recipient rule

**Files:**
- Modify: `activity10/assets/ecmis-activity10.js` (add to the `Activity10` object)
- Test: `activity10/tests/dispatch-recipients.test.mjs` (create)

**Interfaces:**
- Consumes: nothing
- Produces: `Activity10.getRequiredRecipients(caseItem, opinionOverride)` → array of
  `{ key: 'oag'|'prosecutor', name: string }`, in that order for เห็นแย้ง.
  `opinionOverride` is `'AGREED'` | `'DISAGREED'` | `undefined`.

- [ ] **Step 1: Write the failing test**

Create `activity10/tests/dispatch-recipients.test.mjs`:

```js
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

console.log("\n" + passed + " passed\n");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node activity10/tests/dispatch-recipients.test.mjs`
Expected: FAIL — `TypeError: getRequiredRecipients is not a function`

- [ ] **Step 3: Write minimal implementation**

In `activity10/assets/ecmis-activity10.js`, add to the object literal returned as `Activity10` (alongside `formatDisplayDate`, `getCases`, …):

```js
    /* หน่วยงานผู้รับหนังสือ กำหนดจากผลการพิจารณาของนิติกร ไม่ใช่ให้ธุรการเลือก
       ตามมติที่ประชุม 01/09/2569: เห็นชอบแจ้งอัยการต้นทาง เห็นแย้งแจ้งทั้ง อสส. และอัยการ
       ไม่มีผลการพิจารณา ให้ถือเป็นเห็นแย้งไว้ก่อน เพราะการส่งเกินยังแก้ได้
       แต่การไม่ได้ส่งให้ อสส. ทำให้สำนวนไปไม่ถึงผู้มีอำนาจชี้ขาด
       opinionOverride ใช้เฉพาะปุ่มทดสอบที่หน้า 18 */
    getRequiredRecipients(caseItem, opinionOverride) {
      const item = caseItem || {};
      const prosecutor = {
        key: "prosecutor",
        name: item.source || "สำนักงานอัยการเจ้าของสำนวน",
      };
      const oag = { key: "oag", name: "สำนักงานอัยการสูงสุด (อสส.)" };

      let agreed;
      if (opinionOverride === "AGREED") agreed = true;
      else if (opinionOverride === "DISAGREED") agreed = false;
      else agreed = String(item.finalOpinionType || "").includes("เห็นชอบ");

      return agreed ? [prosecutor] : [oag, prosecutor];
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node activity10/tests/dispatch-recipients.test.mjs`
Expected: PASS — `6 passed`

- [ ] **Step 5: Commit (checkpoint — squashed in Task 9)**

```bash
git add activity10/assets/ecmis-activity10.js activity10/tests/dispatch-recipients.test.mjs
git commit -m "wip: getRequiredRecipients rule + unit tests"
```

---

## Task 2: Per-recipient save, completion, and projection

**Files:**
- Modify: `activity10/assets/ecmis-activity10.js` — `submitOfficerExternalDispatch`
- Test: `activity10/tests/dispatch-recipients.test.mjs` (append)

**Interfaces:**
- Consumes: `Activity10.getRequiredRecipients` from Task 1
- Produces: `Activity10.saveDispatchRecipient(id, recipientKey, record)` → the updated case.
  `record` is `{ name, method, trackingNo?, sentDate?, postOffice?, sentTime?, receiveDocNo?, receiverName?, location? }`.
  Writes `case.dispatchRecipients[]`; each entry gains `savedAt`.
  Also produces `Activity10.getDispatchProgress(caseItem)` → `{ saved, total, complete }`.

- [ ] **Step 1: Write the failing test**

Append to `activity10/tests/dispatch-recipients.test.mjs`, before the final `console.log`:

```js
console.log("\nsaveDispatchRecipient");

/* store อ่าน/เขียนผ่าน localStorage — ใส่ตัวจำลองแบบง่ายให้ทดสอบใน Node ได้ */
const makeStore = (seedCase) => {
  const box = {};
  const win = {
    localStorage: {
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
    },
  };
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

t("สลับ scenario แล้วระเบียนที่บันทึกไว้ต้องไม่ถูกลบ", () => {
  /* ผู้ทดสอบกดสลับเป็นเห็นชอบหลังบันทึก อสส. ไปแล้ว ระเบียนของ อสส. ต้องยังอยู่
     แค่ไม่ถูกนับว่าจำเป็นอีกต่อไป การลบข้อมูลการส่งจริงเพราะปุ่มสาธิตย่อมแย่กว่า */
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "E1" });
  const cases = A.getCases();
  const c = cases.find((x) => x.id === id);
  c.finalOpinionType = AGREE; // เสมือนผู้ทดสอบสลับเป็นเห็นชอบ
  A.saveCases(cases);
  const after = A.saveDispatchRecipient(id, "prosecutor", { name: "อัยการ", method: "postal_ems", trackingNo: "E2" });
  assert.equal(after.dispatchRecipients.length, 2, "ระเบียนของ อสส. ต้องยังอยู่");
  assert.equal(A.getDispatchProgress(after).total, 1, "แต่ต้องนับเฉพาะหน่วยงานที่จำเป็น");
  assert.equal(A.getDispatchProgress(after).complete, true);
});

t("บันทึกซ้ำหน่วยงานเดิมเป็นการทับ ไม่ใช่เพิ่มรายการ", () => {
  const { A, id } = makeStore({ finalOpinionType: DISAGREE });
  A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "OLD" });
  const c = A.saveDispatchRecipient(id, "oag", { name: "อสส.", method: "postal_ems", trackingNo: "NEW" });
  assert.equal(c.dispatchRecipients.filter((r) => r.key === "oag").length, 1);
  assert.equal(c.dispatchRecipients.find((r) => r.key === "oag").trackingNo, "NEW");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node activity10/tests/dispatch-recipients.test.mjs`
Expected: FAIL — `TypeError: A.saveDispatchRecipient is not a function`

- [ ] **Step 3: Write minimal implementation**

**First expose `saveCases`.** It is currently private to the IIFE while `getCases` is public, so the test cannot seed a case. Add `saveCases,` to the returned object alongside `getCases`. Verify with:

```bash
node -e "const fs=require('fs'),s={};new Function('window',fs.readFileSync('activity10/assets/ecmis-activity10.js','utf8'))(s);console.log(Object.keys(s.Activity10).includes('saveCases'))"
```
Expected: `true`

Then add both methods to the `Activity10` object:

```js
    /* ความคืบหน้าการบันทึกข้อมูลจัดส่ง ใช้ทั้งที่หน้า 18 และในคิวงานหน้า 01 */
    getDispatchProgress(caseItem) {
      const required = this.getRequiredRecipients(caseItem);
      const saved = (caseItem.dispatchRecipients || []).filter(
        (r) => r.savedAt && required.some((q) => q.key === r.key),
      ).length;
      return { saved, total: required.length, complete: saved >= required.length };
    },

    /* บันทึกข้อมูลจัดส่งทีละหน่วยงาน นิติกรอาจส่ง อสส. วันนี้ และส่งอัยการวันถัดไป
       สำนวนจะยังอยู่ที่หน้า 18 จนกว่าจะบันทึกครบทุกหน่วยงานที่ต้องแจ้ง */
    saveDispatchRecipient(id, recipientKey, record) {
      const cases = loadCases();
      const item = cases.find((c) => c.id === id);
      if (!item) return null;

      if (!Array.isArray(item.dispatchRecipients)) item.dispatchRecipients = [];
      const entry = Object.assign({}, record, {
        key: recipientKey,
        savedAt: formatDisplayDate(new Date()),
      });
      const at = item.dispatchRecipients.findIndex((r) => r.key === recipientKey);
      if (at >= 0) item.dispatchRecipients[at] = entry;
      else item.dispatchRecipients.push(entry);

      /* ค่าที่ Flow 4 ใช้ตัดสินเส้นทาง ต้องคงรูปเดิมทุกประการ */
      const agreed = String(item.finalOpinionType || "").includes("เห็นชอบ");
      item.dispatchScenario = agreed ? "case_agreed" : "case_disagreed";
      item.dispatchRecipientType = agreed ? "prosecutor_origin" : "attorney_general";

      /* ฉายระเบียนของ อสส. (หรือหน่วยงานเดียวกรณีเห็นชอบ) ลงฟิลด์เดิม
         หน้า 19 บรรทัด 578-580 อ่านฟิลด์ชุดนี้ จึงต้องเขียนต่อไปแม้โครงสร้างจะเปลี่ยน */
      const primary =
        item.dispatchRecipients.find((r) => r.key === "oag") ||
        item.dispatchRecipients[0];
      if (primary) {
        item.dispatchMethod = primary.method || "postal_ems";
        item.emsTrackingNo = primary.trackingNo || "";
        item.dispatchPostOffice = primary.postOffice || "";
        item.dispatchDate = primary.sentDate || item.dispatchDate || "";
        item.dispatchTime = primary.sentTime || "";
        item.dispatchLocation = primary.location || "";
        item.handDeliveryRecipient = primary.receiverName || "";
        item.oagReceiveDocNo = primary.receiveDocNo || "";
        item.dispatchRecipientName = primary.name || "";
      }

      const progress = this.getDispatchProgress(item);
      if (progress.complete) {
        item.statusCode = "DISPATCHED_TO_PROSECUTOR";
        item.status =
          item.dispatchMethod === "postal_ems"
            ? `จัดส่งครบทุกหน่วยงานแล้ว (EMS ${item.emsTrackingNo || "ติดตาม"})`
            : "จัดส่งครบทุกหน่วยงานแล้ว";
        item.statusBadge = "bg-success text-white";
        item.assignedRole = "legal_officer";
        item.workflowStep = 16;
        item.officerDispatchedDate = formatDisplayDate(new Date());
      } else {
        item.statusCode = "PENDING_OFFICER_EXTERNAL_DISPATCH";
        item.status = `นิติกรจัดส่งหนังสือ (บันทึกแล้ว ${progress.saved}/${progress.total})`;
        item.statusBadge = "bg-warning text-dark";
        item.assignedRole = "legal_officer";
      }

      saveCases(cases);
      return item;
    },
```

Leave the old `submitOfficerExternalDispatch` in place for now; Task 4 removes its last caller and Task 9 deletes it.

- [ ] **Step 4: Run test to verify it passes**

Run: `node activity10/tests/dispatch-recipients.test.mjs`
Expected: PASS — `15 passed`

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add activity10/assets/ecmis-activity10.js activity10/tests/dispatch-recipients.test.mjs
git commit -m "wip: per-recipient dispatch save, completion, flat-field projection"
```

---

## Task 3: Page 17 — read-only derived panel

**Files:**
- Modify: `activity10/17-legal-admin-external-dispatch-receive.html`

**Interfaces:**
- Consumes: `Activity10.getRequiredRecipients` (Task 1)
- Produces: nothing consumed by later tasks. Still writes `case.dispatchTarget` as the derived string.

- [ ] **Step 1: Replace the checkbox grid with a derived panel**

Replace the whole `<div class="decision-grid" id="dispatchTargetGrid">…</div>` block **and** the `#dispatchTargetHint` div (added 07/09/2569) with:

```html
                <!-- ธุรการไม่ได้เลือกปลายทางอีกต่อไป ระบบกำหนดจากผลการพิจารณาของนิติกร
                     ตามมติที่ประชุม 01/09/2569 แสดงไว้ให้เห็นก่อนส่งต่อ เพื่อไม่ให้ส่งผิดหน่วยงาน -->
                <div id="dispatchTargetDerived" class="derived-target-box"></div>
```

Add to the page's `<style>`:

```css
      .derived-target-box {
        border: 1px solid var(--border-color);
        border-left: 4px solid #1e3a8a;
        border-radius: 8px;
        padding: 12px 14px;
        background: rgba(30, 58, 138, 0.03);
        font-size: 0.9em;
      }
      .derived-target-box .dt-reason { font-weight: 700; color: #1e3a8a; margin-bottom: 6px; }
      .derived-target-box .dt-item { margin: 3px 0 0 8px; color: var(--text-title); }
      .derived-target-box .dt-note { font-size: 0.82em; color: #64748b; margin-top: 8px; }
```

- [ ] **Step 2: Render it and keep `dispatchTarget` written**

Delete `syncDispatchTargetCards()` and the `getDispatchTargetName()` that reads checkboxes. Replace with:

```js
      /* ปลายทางมาจากกฎเดียวกับหน้า 18 ไม่ใช่ตัวเลือกของธุรการ */
      function renderDerivedTargets() {
        const box = document.getElementById("dispatchTargetDerived");
        if (!box || !currentCase) return;
        const list = Activity10.getRequiredRecipients(currentCase);
        const agreed = list.length === 1;
        const icon = (k) => (k === "oag" ? "fa-scale-balanced" : "fa-user-tie");
        box.innerHTML =
          '<div class="dt-reason"><i class="fa-solid ' +
          (agreed ? "fa-circle-check" : "fa-triangle-exclamation") +
          ' me-1"></i>' +
          (agreed
            ? "นิติกรเห็นชอบตามคำสั่งอัยการ"
            : "นิติกรเห็นแย้งคำสั่งอัยการ") +
          "</div>" +
          list
            .map(
              (r) =>
                '<div class="dt-item"><i class="fa-solid ' +
                icon(r.key) +
                ' me-1"></i>' +
                r.name +
                "</div>",
            )
            .join("") +
          '<div class="dt-note">ระบบกำหนดปลายทางจากผลการพิจารณา ตามมติที่ประชุม 01/09/2569</div>';
      }

      function getDispatchTargetName() {
        if (!currentCase) return "";
        const list = Activity10.getRequiredRecipients(currentCase);
        return list.length === 2
          ? "อัยการสูงสุด (อสส.) และ พนักงานอัยการเจ้าของสำนวน"
          : list[0].name;
      }
```

Call `renderDerivedTargets()` from `DOMContentLoaded`, replacing the `syncDispatchTargetCards()` call added on 07/09/2569.

The both-recipients string stays byte-identical because `18`'s `applyDispatchTargetFromCase()` parses it with `indexOf('อัยการสูงสุด')` / `indexOf('พนักงานอัยการ')`.

- [ ] **Step 3: Verify in the browser**

Serve, then open `17-legal-admin-external-dispatch-receive.html?id=คดี-100007/2569` and run in the console:

```js
// เห็นแย้ง → 2 หน่วยงาน
JSON.stringify({
  items: [...document.querySelectorAll('.dt-item')].map(e => e.innerText.trim()),
  target: getDispatchTargetName(),
  noCheckboxesLeft: document.querySelectorAll('input[name="in_dispatchTarget"]').length
})
```
Expected: 2 items (อสส. then the prosecutor office), target `"อัยการสูงสุด (อสส.) และ พนักงานอัยการเจ้าของสำนวน"`, `noCheckboxesLeft: 0`.

Then set `currentCase.finalOpinionType = 'เห็นชอบตามคำสั่งไม่ฟ้องของพนักงานอัยการ'; renderDerivedTargets();` — expect 1 item and the ✓ reason line.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add activity10/17-legal-admin-external-dispatch-receive.html
git commit -m "wip: page 17 recipient picker becomes derived read-only panel"
```

---

## Task 4: Page 18 — tabs and per-recipient form

**Files:**
- Modify: `activity10/18-officer-external-dispatch.html`

**Interfaces:**
- Consumes: `Activity10.getRequiredRecipients`, `Activity10.saveDispatchRecipient`, `Activity10.getDispatchProgress`
- Produces: page-local `activeRecipientKey`, `getOpinionOverride()` (Task 5 sets it)

- [ ] **Step 1: Add the tab strip markup and styles**

Insert directly above the delivery-method chooser inside `#dispatchFormContainer`:

```html
                <!-- หนึ่งแท็บต่อหนึ่งหน่วยงานผู้รับ แต่ละหน่วยงานกรอกและบันทึกแยกกันได้
                     เพราะการส่งจริงเกิดคนละวัน แล้วค่อยมาบันทึกย้อนหลัง -->
                <div id="recipientTabs" class="recipient-tabs"></div>
```

Styles:

```css
 .recipient-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
 .recipient-tab {
   display: flex; align-items: center; gap: 8px; cursor: pointer;
   border: 2px solid var(--border-color); border-radius: 8px;
   padding: 10px 14px; background: var(--bg-card); font-size: 0.9em;
 }
 .recipient-tab.active { border-color: #1e3a8a; background: rgba(30,58,138,0.04); }
 .recipient-tab .rt-chip { font-size: 0.78em; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
 .recipient-tab .rt-chip.saved { background: #dcfce7; color: #166534; }
 .recipient-tab .rt-chip.pending { background: #fef3c7; color: #92400e; }
```

- [ ] **Step 2: Render tabs and switch between them**

```js
      let activeRecipientKey = null;

      /* วาดแท็บจากหน่วยงานที่สำนวนนี้ต้องแจ้ง สถานะมาจาก savedAt ของแต่ละระเบียน
         จึงไม่มีทางที่ป้ายสถานะกับข้อมูลจะไม่ตรงกัน */
      function renderRecipientTabs() {
        const host = document.getElementById("recipientTabs");
        if (!host || !currentCase) return;
        const required = Activity10.getRequiredRecipients(currentCase, getOpinionOverride());
        const saved = currentCase.dispatchRecipients || [];
        if (!required.some((r) => r.key === activeRecipientKey)) {
          activeRecipientKey = required[0].key;
        }
        host.innerHTML = required
          .map((r) => {
            const rec = saved.find((x) => x.key === r.key);
            const done = Boolean(rec && rec.savedAt);
            return (
              '<div class="recipient-tab' +
              (r.key === activeRecipientKey ? " active" : "") +
              '" onclick="selectRecipientTab(\'' + r.key + '\')">' +
              '<i class="fa-solid ' + (r.key === "oag" ? "fa-scale-balanced" : "fa-user-tie") + '"></i>' +
              "<span>" + r.name + "</span>" +
              '<span class="rt-chip ' + (done ? "saved" : "pending") + '">' +
              (done ? "✅ บันทึกแล้ว " + rec.savedAt : "⚠ ยังไม่ได้กรอก") +
              "</span></div>"
            );
          })
          .join("");
      }

      function selectRecipientTab(key) {
        activeRecipientKey = key;
        renderRecipientTabs();
        prefillActiveRecipientForm();
      }

      /* เติมฟอร์มด้วยระเบียนของหน่วยงานที่เลือก หรือล้างฟอร์มถ้ายังไม่เคยบันทึก */
      function prefillActiveRecipientForm() {
        const rec = (currentCase.dispatchRecipients || []).find(
          (r) => r.key === activeRecipientKey,
        );
        const required = Activity10.getRequiredRecipients(currentCase, getOpinionOverride());
        const meta = required.find((r) => r.key === activeRecipientKey);
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };

        selectDispatchMethod(rec ? rec.method : "postal_ems");
        set("in_emsRecipientLabel", meta ? meta.name : "");
        set("in_emsTrackingNo", rec ? rec.trackingNo : "");
        set("in_emsDate", rec ? rec.sentDate : "");
        set("in_emsPostOffice", rec ? rec.postOffice : "");
        set("in_handDate", rec ? rec.sentDate : "");
        set("in_handTime", rec ? rec.sentTime : "");
        set("in_oagReceiveDocNo", rec ? rec.receiveDocNo : "");
        set("in_handRecipient", rec ? rec.receiverName : "");
        set("in_handLocation", rec ? rec.location : "");

        const lbl = document.getElementById("lblReceiveDocNo");
        if (lbl && meta) lbl.textContent = "เลขรับของ" + meta.name;
      }
```

Relabel the hand-delivery receipt field so it is not hardcoded to อสส. — change its `<label>` to carry `id="lblReceiveDocNo"`.

- [ ] **Step 3: Save only the active tab**

Replace the body of `submitOfficerExternalDispatchForm()` with:

```js
      function submitOfficerExternalDispatchForm() {
        if (!currentCase || !activeRecipientKey) return;
        const required = Activity10.getRequiredRecipients(currentCase, getOpinionOverride());
        const meta = required.find((r) => r.key === activeRecipientKey);
        const val = (id) => (document.getElementById(id) || {}).value || "";
        const warn = (title, text, focusId) => {
          Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#1e3a8a" });
          const el = document.getElementById(focusId);
          if (el) el.focus();
        };

        const record = { name: meta.name, method: currentDispatchMethod };
        if (currentDispatchMethod === "postal_ems") {
          const t = val("in_emsTrackingNo").trim();
          if (!t || t.length < 10) {
            return warn("กรุณากรอกเลขติดตาม EMS",
              "กรุณากรอกเลขติดตามพัสดุไปรษณีย์ EMS 13 หลักที่ได้จากไปรษณีย์ไทย", "in_emsTrackingNo");
          }
          record.trackingNo = t;
          record.sentDate = val("in_emsDate");
          record.postOffice = val("in_emsPostOffice").trim();
        } else {
          const d = val("in_oagReceiveDocNo").trim();
          if (!d) {
            return warn("กรุณาระบุเลขรับเอกสาร",
              "กรุณากรอกเลขรับเอกสารที่ได้รับจาก" + meta.name, "in_oagReceiveDocNo");
          }
          record.receiveDocNo = d;
          record.sentDate = val("in_handDate");
          record.sentTime = val("in_handTime");
          record.receiverName = val("in_handRecipient").trim();
          record.location = val("in_handLocation").trim();
        }
        record.notes = val("in_dispatchNotes").trim();

        const updated = Activity10.saveDispatchRecipient(currentCase.id, activeRecipientKey, record);
        currentCase = updated;
        const p = Activity10.getDispatchProgress(updated);

        Swal.fire({
          icon: "success",
          title: p.complete ? "บันทึกครบทุกหน่วยงานแล้ว!" : "บันทึกหน่วยงานนี้แล้ว",
          text: p.complete
            ? "จัดส่งหนังสือครบตามที่กำหนด สิ้นสุดขั้นตอนการจัดส่ง"
            : `บันทึกแล้ว ${p.saved}/${p.total} หน่วยงาน — กรุณากรอกหน่วยงานที่เหลือ`,
          timer: 1800,
          showConfirmButton: false,
        }).then(() => {
          if (p.complete) window.location.href = "01-work-inbox.html";
          else { renderRecipientTabs(); prefillActiveRecipientForm(); }
        });
      }
```

Rename the submit button's label to `บันทึกการจัดส่งหน่วยงานนี้`.

**The `แนบไฟล์สลิป EMS` input stays as-is and stays unpersisted.** It is not in today's
payload and this rework does not add it — see the spec's *Attachments stay UI-only*. Do not
add it to `record`; storing a real file would mean base64 in the case record, which is a
separate decision.

- [ ] **Step 4: Delete the second-recipient block**

Remove the `แจ้งผลให้พนักงานอัยการเจ้าของสำนวนด้วย` checkbox (`in_notifyProsecutorToo`), its container, `toggleProsecutorNotify()`, and the `in_prosecutorRecipientLabel` / `in_prosecutorDispatchDate` / `in_prosecutorDispatchMethod` / `in_prosecutorTrackingNo` fields. In `applyDispatchTargetFromCase()`, delete the block that auto-checked it. Verify with:

```bash
grep -c "notifyProsecutorToo\|in_prosecutorTrackingNo\|toggleProsecutorNotify" activity10/18-officer-external-dispatch.html
```
Expected: `0`

- [ ] **Step 5: Verify in the browser**

Open `18-officer-external-dispatch.html?id=คดี-100008/2569` (เห็นแย้ง) and run:

```js
JSON.stringify({
  tabs: [...document.querySelectorAll('.recipient-tab')].map(t => t.innerText.replace(/\s+/g,' ').trim()),
  active: activeRecipientKey
})
```
Expected: 2 tabs, both `⚠ ยังไม่ได้กรอก`, active `"oag"`.

Fill EMS and save; expect tab 1 green, `1/2` toast, case still at 18. Switch to tab 2, choose นำส่งด้วยตนเอง, fill the receipt number, save; expect the completion toast and redirect.

Then `?id=คดี-100009/2569` (เห็นชอบ): expect exactly 1 tab, and saving it completes immediately.

- [ ] **Step 6: Commit (checkpoint)**

```bash
git add activity10/18-officer-external-dispatch.html
git commit -m "wip: page 18 per-recipient tabs with independent delivery records"
```

---

## Task 5: Page 18 — two-button scenario selector

**Files:**
- Modify: `activity10/18-officer-external-dispatch.html`

**Interfaces:**
- Consumes: `renderRecipientTabs`, `prefillActiveRecipientForm` (Task 4)
- Produces: `getOpinionOverride()` → `'AGREED' | 'DISAGREED' | undefined` — already called by Task 4's code

- [ ] **Step 1: Replace the three buttons with two**

```html
 <button type="button" class="scenario-btn" id="btnScenarioAgreed" onclick="switchScenario('AGREED')">
 <i class="fa-solid fa-check-double me-1"></i>เห็นชอบ ➔ แจ้งอัยการต้นทาง
 </button>
 <button type="button" class="scenario-btn active" id="btnScenarioDisagreed" onclick="switchScenario('DISAGREED')">
 <i class="fa-solid fa-triangle-exclamation me-1"></i>เห็นแย้ง ➔ แจ้ง อสส. และอัยการต้นทาง
 </button>
```

- [ ] **Step 2: Make the selector override the rule, not just the view**

```js
      /* ปุ่มทดสอบนี้ทับผลการพิจารณาไว้ทั้งรอบการใช้งาน ไม่ใช่แค่เปลี่ยนหน้าตา
         มิฉะนั้นผู้ทดสอบอาจสลับไปเห็นชอบ กรอกแท็บเดียว แล้วบันทึกลงสำนวน
         ที่จริงต้องแจ้งสองหน่วยงาน */
      let opinionOverride = null;
      function getOpinionOverride() { return opinionOverride || undefined; }

      function switchScenario(which) {
        opinionOverride = which;
        const a = document.getElementById("btnScenarioAgreed");
        const d = document.getElementById("btnScenarioDisagreed");
        if (a) a.classList.toggle("active", which === "AGREED");
        if (d) d.classList.toggle("active", which === "DISAGREED");
        renderRecipientTabs();
        prefillActiveRecipientForm();
      }
```

Delete the old `switchScenario(key, triggerPopulate)` and `currentScenario`. In the page-load path, replace `switchScenario('agreed_ems'|'disagreed_ems', false)` with setting the button state from the case's own opinion, leaving `opinionOverride` null so the real value is used until a tester presses a button.

⚠ **Keep the `if (!hasOpinion) showMissingOpinionWarning();` line** that sits in that same load path (added 07/09/2569). It is the only signal that a case arrived with no `finalOpinionType` and was defaulted to เห็นแย้ง. Losing it re-creates the silent-wrong-answer bug this rework depends on having fixed. Verify after editing:

```bash
grep -c "showMissingOpinionWarning" activity10/18-officer-external-dispatch.html
```
Expected: `2` (definition + call)

- [ ] **Step 3: Verify in the browser**

On `?id=คดี-100008/2569` (เห็นแย้ง) run `switchScenario('AGREED')`:

```js
JSON.stringify({ tabs: document.querySelectorAll('.recipient-tab').length, override: getOpinionOverride() })
```
Expected: `{tabs: 1, override: "AGREED"}`. Press เห็นแย้ง → back to 2 tabs.

- [ ] **Step 4: Commit (checkpoint)**

```bash
git add activity10/18-officer-external-dispatch.html
git commit -m "wip: two-button scenario selector overriding the recipient rule"
```

---

## Task 6: Page 18 — already-dispatched view

**Files:**
- Modify: `activity10/18-officer-external-dispatch.html` — `renderAlreadyDispatchedView()`

**Interfaces:**
- Consumes: `case.dispatchRecipients`, `Activity10.getDispatchProgress`

- [ ] **Step 1: List every recipient's record**

Replace the single-delivery summary body with a loop over `currentCase.dispatchRecipients`, each showing name, method, and that method's fields:

```js
        const rows = (currentCase.dispatchRecipients || [])
          .map((r) => {
            const detail =
              r.method === "postal_ems"
                ? "ไปรษณีย์ EMS " + (r.trackingNo || "-") +
                  (r.postOffice ? " · " + r.postOffice : "")
                : "นำส่งด้วยตนเอง · เลขรับ " + (r.receiveDocNo || "-") +
                  (r.receiverName ? " · ผู้รับ " + r.receiverName : "");
            return (
              '<div style="padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px;">' +
              '<div style="font-weight:700;">' + r.name + "</div>" +
              '<div style="font-size:0.85em; color:#64748b;">' + detail +
              " · บันทึกเมื่อ " + (r.savedAt || "-") + "</div></div>"
            );
          })
          .join("");
```

Keep the existing `แก้ไขข้อมูลการจัดส่ง` button and its edit-mode flag; on re-entry the tabs render and `prefillActiveRecipientForm()` fills the active one.

- [ ] **Step 2: Verify in the browser**

Complete both tabs on `คดี-100008/2569`, reopen page 18 for it:

```js
JSON.stringify({ recipientsShown: currentCase.dispatchRecipients.length,
  hasEditBtn: !!document.body.innerText.match(/แก้ไขข้อมูลการจัดส่ง/) })
```
Expected: `{recipientsShown: 2, hasEditBtn: true}`. Press แก้ไข → two tabs, both green, fields prefilled.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add activity10/18-officer-external-dispatch.html
git commit -m "wip: already-dispatched view lists every recipient record"
```

---

## Task 7: Work inbox progress

**Files:**
- Modify: `activity10/01-work-inbox.html`

- [ ] **Step 1: Nothing to add if the status string carries it**

Task 2 already writes `status` as `นิติกรจัดส่งหนังสือ (บันทึกแล้ว 1/2)`, and the inbox renders `item.status` directly. Run:

```bash
grep -n "PENDING_OFFICER_EXTERNAL_DISPATCH" activity10/01-work-inbox.html
```

Read every hit. Each one that produces **display text** must render `item.status` rather than
a literal string — otherwise the progress count never reaches the screen. Hits that only
*route* (the `handleCaseAction` branch and the action-button branch) are correct as-is and
must not be touched: they decide which page the ดำเนินการ button opens.

- [ ] **Step 2: Verify in the browser**

Save one of two tabs, open `01-work-inbox.html` as `Nattapol.B`:

```js
[...document.querySelectorAll('table tbody tr')]
  .map(r => r.innerText).filter(t => t.includes('บันทึกแล้ว'))
```
Expected: one row containing `บันทึกแล้ว 1/2`.

- [ ] **Step 3: Commit (checkpoint)**

```bash
git add activity10/01-work-inbox.html
git commit -m "wip: inbox shows partial dispatch progress"
```

---

## Task 8: Cache-bust, dead code, and docs

**Files:**
- Modify: all `activity10/*.html` (`?v=` bump), `activity10/assets/ecmis-activity10.js`, `activity10/docs/*.md`

- [ ] **Step 1: Delete the superseded store method**

Remove `submitOfficerExternalDispatch` — Task 4 removed its last caller. Confirm:

```bash
grep -rn "submitOfficerExternalDispatch" activity10/ | grep -v docs/
```
Expected: no results.

- [ ] **Step 2: Bump the shared asset version**

```bash
cd activity10 && sed -i 's/ecmis-activity10\.js?v=20260907_2/ecmis-activity10.js?v=20260908_1/g' *.html
grep -ho 'ecmis-activity10\.js[^"]*' *.html | sort | uniq -c
```
Expected: a single line, count 32.

- [ ] **Step 3: Run the full unit suite and re-verify both flows**

```bash
node activity10/tests/dispatch-recipients.test.mjs
node activity10/tests/legal-rules.test.mjs
```
Expected: both pass.

Then in the browser confirm page 19 still describes the อสส. delivery correctly for a completed เห็นแย้ง case, and that a completed เห็นชอบ case does **not** appear at 19.

- [ ] **Step 4: Update the docs**

In `docs/meeting-01092026-changes.md` Part 1D, add a section recording the rework and marking Part 1D §5 (the checkbox pair) superseded. In `docs/qa-guide-4-flows.md`, replace the Flow 3 §17 recipient checks with the derived-panel checks and add per-tab checks for §18. In `docs/session-07092026-attestation-and-labels.md`, note that §8's checkbox work was superseded the same day.

- [ ] **Step 5: Commit (checkpoint)**

```bash
git add -A activity10
git commit -m "wip: cache bump, remove dead store method, update docs"
```

---

## Task 9: Squash

**The project owner reviews at the commit level and requires few big commits.** The checkpoints above are scaffolding.

- [ ] **Step 1: Back up before rewriting**

```bash
git branch backup/pre-squash-flow3-20260907 HEAD
```

- [ ] **Step 2: Confirm the base**

```bash
git merge-base HEAD Mock-up-10
```

- [ ] **Step 3: Squash to one commit**

```bash
git reset --soft $(git merge-base HEAD Mock-up-10)
git commit -m "feat(activity10): derive Flow 3 recipients and record each delivery separately"
```

Write a real body explaining *why*: the meeting rule, that ธุรการ no longer picks recipients, that deliveries happen on different days, and that Flow 4's inputs are preserved by projection.

- [ ] **Step 4: Prove nothing was lost**

```bash
git diff backup/pre-squash-flow3-20260907 HEAD    # must be empty
git log --format='%an <%ae> | %cn <%ce>' -1        # must be the user's identity, twice
git log -1 --format='%B' | grep -i 'co-authored\|claude'   # must find nothing
```

- [ ] **Step 5: Do not force-push.** Ask the owner first.

---

## Notes for the implementer

- **Verify over HTTP, never `file://`.** They are different `localStorage` origins; testing on one while the user browses the other produces confusing results.
- **`Activity10.resetData()` in the console** restores the seeded cases. Use it between scenarios — half-saved cases from an earlier run will otherwise skew what you see.
- **Seeded cases for this flow:** `คดี-100008/2569` is เห็นแย้ง, `คดี-100009/2569` is เห็นชอบ. Both start at `PENDING_OFFICER_EXTERNAL_DISPATCH`.
- **`.info-box` has no CSS anywhere.** Do not rely on it; style explicitly.
- **Do not touch** page 19's ruling options, Flow 4 routing, or the seeded case titles.
