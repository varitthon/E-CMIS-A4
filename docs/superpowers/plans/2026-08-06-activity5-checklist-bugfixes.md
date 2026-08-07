# Activity 5 QA Checklist Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แก้บั๊กทั้ง 7 รายการที่ QA บันทึกไว้ในชีต `checklist` ของ `กระบวนการไต่สวน.xlsx` (หน้าจอ "สำนวนคดี (กิจกรรมที่ 5)" และหน้าจอ Form 3 ที่ส่งต่อเข้ากิจกรรมที่ 5) ในโค้ด `E-CMIS-A4`

**Architecture:** ทุกบั๊กเป็นปัญหา CSS/HTML layout ในไฟล์ static assets ที่มีอยู่แล้ว (`assets/ecmis-sidebar.css`, `assets/ecmis-workspace.css`, `assets/activity4-workspace.js`) ไม่มีการเพิ่ม dependency หรือ build step ใหม่ ยกเว้น Task 3 ซึ่งต้องกู้คืน markup ที่หายไปจาก working tree ก่อน (ดู Global Constraints)

**Tech Stack:** Vanilla JS (ES modules ไม่มี), CSS ล้วน, ไม่มี framework/bundler — ทดสอบด้วย `node:assert/strict` แบบอ่านซอร์สโค้ดเป็น text แล้ว regex-match ตามธรรมเนียมเดิมของโปรเจกต์ (ดู `tests/activity5-handoff.test.mjs`, `activity5/tests/ui-copy.test.mjs`)

## Global Constraints

- **Regression ที่ต้องรู้ก่อนเริ่ม:** `git status` ใน `E-CMIS-A4/` แสดงว่า `assets/activity4-workspace.js` มีการแก้ไขที่ยังไม่ commit (uncommitted) ซึ่งได้ลบ `<section class="route-planner">…</section>` (กล่องเลือกเส้นทางพิจารณา "เจ้าหน้าที่รับเรื่อง → ผอ.ศรร. → ผอ.กบค.") ออกจาก `editorFor()` ไปทั้งบล็อก เทียบกับ commit ล่าสุด `ccbda8e` — เป็นสาเหตุที่แท้จริงของบั๊ก #2 และ #3 (ตอนนี้กล่องนี้ไม่ render เลย ไม่ใช่แค่ layout เพี้ยน) Task 3 ด้านล่างกู้คืนส่วนนี้ก่อนแก้ layout
- **Test ที่มีอยู่เดิม fail อยู่ก่อนแล้ว:** `node tests/activity5-handoff.test.mjs` ล้มเหลวบน working tree ปัจจุบันด้วยเหตุผลอื่น (ข้อความ/สถานะ workflow เปลี่ยนไปจากที่ test คาดไว้) ซึ่ง**ไม่เกี่ยวกับบั๊ก 7 ข้อในแผนนี้** อย่านำความล้มเหลวนี้มาปนกับผลการทดสอบของแต่ละ Task — รันเฉพาะไฟล์ test ที่ระบุในแต่ละ Task เท่านั้น
- ห้ามใช้ `#staffApp`/`.ws-field`/`.route-flow` แบบ global selector โดยไม่ scope เมื่อ fix ใช้กับ `.pack-count-grid .ws-field` เท่านั้น เพื่อไม่ให้กระทบหน้าจออื่นที่ใช้ class เดียวกัน
- ทุก CSS/JS string ในแผนนี้ใช้ single quote `'…'` และไม่มี semicolon ท้ายบรรทัดสุดท้ายของ arrow function แบบ inline ตามธรรมเนียมโค้ดเดิมในไฟล์
- รันคำสั่งทั้งหมดจาก working directory: `/Users/jetsadasomporn/Downloads/E-CMIS-A4-Production/E-CMIS-A4`

---

## File Structure

ไม่มีไฟล์ใหม่ ยกเว้นไฟล์ test 7 ไฟล์ (หนึ่งไฟล์ต่อ Task) ภายใต้ `tests/`:

- Modify: `assets/ecmis-sidebar.css` — Task 1
- Modify: `assets/ecmis-workspace.css` — Task 2, 3, 4, 5, 6, 7
- Modify: `assets/activity4-workspace.js` — Task 3, 7
- Create: `tests/checklist-01-sidebar-a5-margin.test.mjs` — Task 1
- Create: `tests/checklist-02-smart-inline-nowrap.test.mjs` — Task 2
- Create: `tests/checklist-03-route-planner-restore.test.mjs` — Task 3
- Create: `tests/checklist-04-stage-track-scroll.test.mjs` — Task 4
- Create: `tests/checklist-05-cover-ground-wrap.test.mjs` — Task 5
- Create: `tests/checklist-06-pack-count-align.test.mjs` — Task 6
- Create: `tests/checklist-07-filter-date-be.test.mjs` — Task 7

---

### Task 1: Sidebar ทับเนื้อหาหน้ากิจกรรมที่ 5 (บั๊ก #1 checklist)

**Root cause:** `assets/ecmis-sidebar.css:15-16` (และ override อีก 2 จุดที่บรรทัด 312-313, 357-358) ชดเชย `margin-left` ให้ sidebar แบบ fixed-position เฉพาะ `#staffApp` กับ `#walkinApp` แต่ `staff-workflow.html` มี container ที่สามคือ `#a5App` (ใช้โดย `assets/activity5-workspace.js` บรรทัด 339, 593, 930 เป็น root render ของหน้า "สำนวนคดี (กิจกรรมที่5)") ซึ่งไม่อยู่ใน selector เลย ทำให้เนื้อหาเริ่มที่ `margin-left:0` ชนกับ sidebar ที่ลอยทับอยู่ (`position:fixed;width:260px`)

**Files:**
- Modify: `assets/ecmis-sidebar.css:15-19`, `:312-315`, `:357-360`
- Test: `tests/checklist-01-sidebar-a5-margin.test.mjs`

**Interfaces:**
- Consumes: ไม่มี (CSS selector เพิ่มเติมล้วนๆ)
- Produces: ไม่มี (ไม่มี Task อื่นพึ่งพาผลลัพธ์นี้)

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-01-sidebar-a5-margin.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-sidebar.css"), "utf8");

const rule = /[ \t]*body\.ecmis-sidebar-enabled #staffApp,\s*\n[ \t]*body\.ecmis-sidebar-enabled #walkinApp,\s*\n[ \t]*body\.ecmis-sidebar-enabled #a5App\b/g;
const matches = [...css.matchAll(rule)];
assert.equal(matches.length, 3, "#a5App must be compensated by the default rule, the mobile override, and the print override — found " + matches.length);

console.log("PASS checklist-01-sidebar-a5-margin.test.mjs: #a5App gets the same margin-left compensation as #staffApp/#walkinApp");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-01-sidebar-a5-margin.test.mjs`
Expected: `AssertionError` เพราะ `matches.length` เท่ากับ `0` (ยังไม่มี `#a5App` ในไฟล์นี้เลย)

- [ ] **Step 3: แก้ CSS**

ใน `assets/ecmis-sidebar.css` บรรทัด 15-16 เปลี่ยนจาก:

```css
body.ecmis-sidebar-enabled #staffApp,
body.ecmis-sidebar-enabled #walkinApp {
  width: auto;
  margin-left: var(--ecmis-sidebar-current-width);
  transition: margin-left .3s cubic-bezier(.23, 1, .32, 1);
}
```

เป็น:

```css
body.ecmis-sidebar-enabled #staffApp,
body.ecmis-sidebar-enabled #walkinApp,
body.ecmis-sidebar-enabled #a5App {
  width: auto;
  margin-left: var(--ecmis-sidebar-current-width);
  transition: margin-left .3s cubic-bezier(.23, 1, .32, 1);
}
```

บรรทัด 312-313 (อยู่ใน `@media (max-width: 900px)`) เปลี่ยนจาก:

```css
  body.ecmis-sidebar-enabled #staffApp,
  body.ecmis-sidebar-enabled #walkinApp {
    margin-left: 0;
  }
```

เป็น:

```css
  body.ecmis-sidebar-enabled #staffApp,
  body.ecmis-sidebar-enabled #walkinApp,
  body.ecmis-sidebar-enabled #a5App {
    margin-left: 0;
  }
```

บรรทัด 357-358 (อยู่ใน `@media print`) เปลี่ยนจาก:

```css
  body.ecmis-sidebar-enabled #staffApp,
  body.ecmis-sidebar-enabled #walkinApp {
    margin-left: 0 !important;
  }
```

เป็น:

```css
  body.ecmis-sidebar-enabled #staffApp,
  body.ecmis-sidebar-enabled #walkinApp,
  body.ecmis-sidebar-enabled #a5App {
    margin-left: 0 !important;
  }
```

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-01-sidebar-a5-margin.test.mjs`
Expected: พิมพ์ `PASS checklist-01-sidebar-a5-margin.test.mjs: ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เปิด `staff-workflow.html?demo=1&role=officer` (ต้อง serve ผ่าน local server เช่น `npx serve .` หรือเทียบเท่า ไม่ใช่เปิดไฟล์ตรงๆ เพราะใช้ ES module/fetch) ไปที่เมนู "สำนวนคดี (กิจกรรมที่ 5)" แล้วยืนยันว่าเนื้อหาไม่ถูก sidebar สีกรมท่าบังอีกต่อไป

- [ ] **Step 6: Commit**

```bash
git add assets/ecmis-sidebar.css tests/checklist-01-sidebar-a5-margin.test.mjs
git commit -m "fix: compensate sidebar margin for #a5App (Activity 5 content was hidden behind sidebar)"
```

---

### Task 2: badge "N ข้อเสนอ" ไม่อยู่บรรทัดเดียวกับ "คำแนะนำการเขียน" (บั๊ก #2 checklist)

**Root cause:** `assets/ecmis-workspace.css:46` — selector `.smart-inline-trigger` (ปุ่มคำแนะนำการเขียนแบบ inline ที่ `assets/activity4-workspace.js` แทรกด้วย `attachIntelligentSuggestion()`) เป็น `display:inline-flex` แต่ไม่มี `white-space:nowrap` กำกับ ทำให้ label `<span>คำแนะนำการเขียน</span>` และ badge `<small>N ข้อเสนอ</small>` (อัปเดตข้อความที่บรรทัด ~21061 ในฟังก์ชันเดียวกัน) แตกบรรทัดกันเมื่อพื้นที่แคบ (เช่น ตอนที่ field แคบลงจากบั๊ก sidebar ใน Task 1)

**Files:**
- Modify: `assets/ecmis-workspace.css:46`
- Test: `tests/checklist-02-smart-inline-nowrap.test.mjs`

**Interfaces:**
- Consumes: ไม่มี
- Produces: ไม่มี

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-02-smart-inline-nowrap.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

const rule = /\.smart-inline-trigger\{[^}]*\}/;
const match = css.match(rule);
assert.ok(match, ".smart-inline-trigger rule must exist");
assert.match(match[0], /white-space:nowrap/, ".smart-inline-trigger must force its label and badge onto one line");

console.log("PASS checklist-02-smart-inline-nowrap.test.mjs: smart-inline-trigger keeps label + suggestion-count badge on one line");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-02-smart-inline-nowrap.test.mjs`
Expected: `AssertionError` เพราะยังไม่มี `white-space:nowrap` ใน rule นี้

- [ ] **Step 3: แก้ CSS**

ใน `assets/ecmis-workspace.css` บรรทัด 46 หา:

```css
.smart-inline-trigger{display:inline-flex;align-items:center;gap:.38rem;padding:.18rem .35rem;border:0;border-radius:5px;color:#637487;background:transparent;font:500 .67rem 'Prompt',sans-serif;cursor:pointer}
```

เปลี่ยนเป็น:

```css
.smart-inline-trigger{display:inline-flex;align-items:center;gap:.38rem;padding:.18rem .35rem;border:0;border-radius:5px;color:#637487;background:transparent;font:500 .67rem 'Prompt',sans-serif;cursor:pointer;white-space:nowrap}
```

(เพิ่มแค่ `white-space:nowrap` ต่อท้าย ก่อน `}` ปิด rule — property อื่นในบรรทัดเดียวกันห้ามแก้)

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-02-smart-inline-nowrap.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: Commit**

```bash
git add assets/ecmis-workspace.css tests/checklist-02-smart-inline-nowrap.test.mjs
git commit -m "fix: keep smart-inline suggestion label and count badge on one line"
```

---

### Task 3: กล่อง "กำหนดผู้รับพิจารณาลำดับถัดไป" หายไปและหลุดกรอบ (บั๊ก #3 checklist)

**Root cause (2 ชั้น):**
1. `<section class="route-planner">…</section>` ทั้งบล็อกถูกลบออกจาก `editorFor()` ใน `assets/activity4-workspace.js` โดยการแก้ไขที่ยังไม่ commit (เทียบ `git show ccbda8e:assets/activity4-workspace.js` ยังมีอยู่) ทำให้ตอนนี้หน้าจอไม่ render กล่องนี้เลย แต่ `enhanceReviewRoute()` (เรียกที่บรรทัด 1245, นิยามที่ 1265) และ `capture()`/`wireDetail()` ยังอ่าน `.route-planner`/`input[name="route"]` อยู่ครบ — แค่ markup หาย ต้องกู้คืนก่อน
2. เมื่อกู้คืนแล้ว ตัว CSS เดิมเองก็มีบั๊ก: `assets/ecmis-workspace.css:25` — `.route-flow span{white-space:nowrap}` แต่ `.route-flow{display:flex;align-items:center;gap:.35rem;min-height:34px}` ไม่มี `flex-wrap` (default เป็น `nowrap`) เมื่อกล่องแคบ (2 คอลัมน์ `.route-options{grid-template-columns:repeat(2,minmax(0,1fr))}`) ป้ายชื่อ "เจ้าหน้าที่รับเรื่อง → ผอ.ศรร. → ผอ.กบค." ที่ห้ามตัดคำจะดันล้นกรอบ `.route-option` ออกไป

**Files:**
- Modify: `assets/activity4-workspace.js` (ฟังก์ชัน `editorFor`, ส่วน officer branch)
- Modify: `assets/ecmis-workspace.css:25`
- Test: `tests/checklist-03-route-planner-restore.test.mjs`

**Interfaces:**
- Consumes: ไม่มี Task ก่อนหน้า
- Produces: markup `<section class="route-planner">` กลับมาอยู่ใน DOM ให้ `enhanceReviewRoute()` (ของเดิมในไฟล์เดียวกัน) ทำงานต่อได้โดยไม่ต้องแก้ฟังก์ชันนั้น

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-03-route-planner-restore.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(js, /<section class="route-planner"><header>/, "editorFor() must render the route-planner section again");
assert.match(js, /<input type="radio" name="route" value="center" checked>/, "the normal-order route option must be present");
assert.match(js, /<input type="radio" name="route" value="division">/, "the exceptional route option must be present");

const flowRule = css.match(/\.route-flow\{[^}]*\}/);
assert.ok(flowRule, ".route-flow rule must exist");
assert.match(flowRule[0], /flex-wrap:wrap/, ".route-flow must wrap its pills instead of overflowing the route-option box");

console.log("PASS checklist-03-route-planner-restore.test.mjs: route-planner section restored and no longer overflows its frame");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-03-route-planner-restore.test.mjs`
Expected: `AssertionError` ที่ assertion แรก (`<section class="route-planner"><header>` ไม่พบในไฟล์)

- [ ] **Step 3a: กู้คืน markup ใน `activity4-workspace.js`**

ใน `editorFor()` หา (ยังอยู่ใน officer branch ที่สอง — ไม่ใช่ branch แรกที่เป็น read-only view):

```
...<label>ความเห็นเจ้าหน้าที่รับเรื่อง</label><textarea id="officerOpinion">${escapeHtml(d.officerOpinion)}</textarea></div>${signatureCard(state,'officer',activeRole)}${documentPackPanel(state)}</div>`}
```

เปลี่ยนเป็น (แทรก `<section class="route-planner">…</section>` คั่นระหว่าง `</div>` ที่ปิด officerOpinion field กับ `${signatureCard(...)}`):

```
...<label>ความเห็นเจ้าหน้าที่รับเรื่อง</label><textarea id="officerOpinion">${escapeHtml(d.officerOpinion)}</textarea></div><section class="route-planner"><header><div><span>เส้นทางการพิจารณา</span><h3>กำหนดผู้รับพิจารณาลำดับถัดไป</h3></div><small>ใช้ลำดับปกติเป็นค่าเริ่มต้น</small></header><div class="route-options"><label class="route-option standard"><input type="radio" name="route" value="center" checked><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span>ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>ดำเนินการตามลำดับปกติ</strong><small>ส่งให้ ผอ.ศรร. พิจารณาก่อนเสนอ ผอ.กบค.</small></label><label class="route-option exceptional"><input type="radio" name="route" value="division"><div class="route-flow"><span>เจ้าหน้าที่รับเรื่อง</span><i>→</i><span class="route-skipped">ผอ.ศรร.</span><i>→</i><span>ผอ.กบค.</span></div><strong>เสนอข้ามขั้นตอนเป็นกรณีพิเศษ</strong><small>ใช้เมื่อ ผอ.ศรร. ไม่สามารถปฏิบัติหน้าที่ และต้องบันทึกเหตุผล</small></label></div><div class="route-exception-panel ws-hidden" id="absenceBox"><div class="route-exception-head"><span>กรณีพิเศษ</span><strong>บันทึกเหตุผลประกอบการส่งตรงถึง ผอ.กบค.</strong></div><div class="ws-grid-2"><div class="ws-field"><label>ประเภทเหตุผล *</label><select id="absenceReasonType"><option value="">เลือกประเภทเหตุผล</option>${['ลาราชการ','ติดภารกิจราชการ','ไม่สามารถปฏิบัติหน้าที่','มีคำสั่งให้เสนอโดยตรง','อื่น ๆ'].map(reason=>`<option value="${reason}" ${d.absenceReasonType===reason?'selected':''}>${reason}</option>`).join('')}</select></div><div class="ws-field ws-field-full"><label>รายละเอียดและช่วงเวลาที่ไม่อยู่ *</label><textarea id="absenceNote" placeholder="ระบุเหตุผล วันที่หรือช่วงเวลา และข้อมูลอ้างอิงที่เกี่ยวข้อง">${escapeHtml(d.absenceNote)}</textarea></div></div><div class="route-impact"><strong>ผลของเส้นทางนี้</strong><span>เรื่องจะส่งตรงถึง ผอ.กบค. พร้อมบันทึก Log โดย ผอ.กบค. สามารถอนุมัติให้ ผอ.ศรร. กลับมาให้ความเห็นเพิ่มเติมภายหลังได้</span></div></div></section>${signatureCard(state,'officer',activeRole)}${documentPackPanel(state)}</div>`}
```

หมายเหตุ: ข้อความและ id ทั้งหมดคัดลอกจาก `git show ccbda8e:assets/activity4-workspace.js` ตรงตัว ไม่ต้องเปลี่ยนชื่อ field ใดๆ เพราะ `enhanceReviewRoute()`, `capture()`, `wireDetail()` ที่เหลือในไฟล์เดียวกันยังอ้างอิง id เดิมเหล่านี้อยู่แล้ว (`#absenceBox`, `#absenceReasonType`, `#absenceNote`, `input[name="route"]`)

- [ ] **Step 3b: แก้ CSS overflow**

ใน `assets/ecmis-workspace.css` บรรทัด 25 หา:

```css
.route-flow{display:flex;align-items:center;gap:.35rem;min-height:34px}
```

เปลี่ยนเป็น:

```css
.route-flow{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;min-height:34px}
```

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-03-route-planner-restore.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เข้าหน้า Form 3 ในฐานะ `role=officer` ย่อหน้าต่าง browser ให้แคบ (หรือลด `A+`/`A-` เพิ่มขนาดตัวอักษรตามที่ QA ใช้ตอนเจอบั๊ก) แล้วยืนยันว่ากล่อง "เส้นทางการพิจารณา" render และ pill ของแต่ละ flow ตัดขึ้นบรรทัดใหม่แทนที่จะล้นกรอบ

- [ ] **Step 6: Commit**

```bash
git add assets/activity4-workspace.js assets/ecmis-workspace.css tests/checklist-03-route-planner-restore.test.mjs
git commit -m "fix: restore missing route-planner section and wrap route-flow pills instead of overflowing"
```

---

### Task 4: ไอคอนลำดับขั้นตอนสำนวนคดีวางซ้อนกัน (บั๊ก #4 checklist ส่วนที่เหลือ)

**Root cause:** ส่วนที่ sidebar ทับเนื้อหาแก้แล้วใน Task 1 ส่วนที่เหลือคือ `assets/ecmis-workspace.css:22` — `.ws-stage-track{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr))}` ห่อ (wrap) รายการขั้นตอนไปแถวที่สองเมื่อพื้นที่ไม่พอ แต่เส้นเชื่อม `.ws-stage-track::before` เป็น absolute-positioned เส้นเดียวคำนวณตำแหน่งสำหรับแถวเดียวเท่านั้น (`top:2.1rem;left:calc(10% + 1rem);right:calc(10% + 1rem)`) ทำให้ไอคอนแถวที่ล้นไปแถว 2 (เช่น "อัยการ/ติดตาม", "ปิดสำนวน") ลอยเหลื่อมทับกับแถวแรกแทนที่จะเรียงต่อกัน แก้โดยเปลี่ยนจาก grid-wrap เป็น scroll แนวนอนแถวเดียว (รูปแบบเดียวกับที่ไฟล์นี้ใช้อยู่แล้วกับ `.ws-actions` ที่บรรทัด 52)

**Files:**
- Modify: `assets/ecmis-workspace.css:22` (desktop rule) และ `:52` (mobile `@media(max-width:720px)` override)
- Test: `tests/checklist-04-stage-track-scroll.test.mjs`

**Interfaces:**
- Consumes: ไม่มี
- Produces: ไม่มี

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-04-stage-track-scroll.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(css, /\.ws-stage-track\{position:relative;display:flex;overflow-x:auto;margin:0;padding:1\.25rem 1rem 1\.35rem;list-style:none;background:#f8fbfd\}/, "desktop .ws-stage-track must be a single scrollable row, not a wrapping grid");
assert.doesNotMatch(css, /\.ws-stage-track\{position:relative;display:grid;grid-template-columns:repeat\(auto-fit/, "the old wrapping grid layout must be gone");
assert.match(css, /\.ws-stage-track>\.ws-stage\{flex:1 0 8rem\}/, "each stage node needs a fixed basis so the row scrolls instead of squeezing");
assert.match(css, /\.ws-stage-track\{flex-direction:column;overflow-x:visible;padding:1rem\}/, "mobile override must keep the intentional vertical stack layout");

console.log("PASS checklist-04-stage-track-scroll.test.mjs: stage track no longer wraps into overlapping rows");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-04-stage-track-scroll.test.mjs`
Expected: `AssertionError` ที่ assertion แรก (ยังเป็น `display:grid;grid-template-columns:repeat(auto-fit...` อยู่)

- [ ] **Step 3: แก้ CSS**

ใน `assets/ecmis-workspace.css` บรรทัด 22 หา (ส่วนต้นของบรรทัดยาวนี้):

```css
.ws-stage-track{position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));margin:0;padding:1.25rem 1rem 1.35rem;list-style:none;background:#f8fbfd}
```

เปลี่ยนเป็น:

```css
.ws-stage-track{position:relative;display:flex;overflow-x:auto;margin:0;padding:1.25rem 1rem 1.35rem;list-style:none;background:#f8fbfd}.ws-stage-track>.ws-stage{flex:1 0 8rem}
```

(ไม่ต้องแตะ `.ws-stage-track::before` ที่ตามมาต่อท้าย — ยังใช้ได้เหมือนเดิมเพราะตอนนี้มีแถวเดียวเสมอ)

ใน `assets/ecmis-workspace.css` บรรทัด 52 (ภายใน `@media(max-width:720px){...}`) หา:

```css
.ws-stage-track{grid-template-columns:1fr;padding:1rem}
```

เปลี่ยนเป็น:

```css
.ws-stage-track{flex-direction:column;overflow-x:visible;padding:1rem}
```

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-04-stage-track-scroll.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เปิดหน้า "สำนวนคดี (กิจกรรมที่ 5)" ที่ browser width ปกติ (ไม่แคบ) ยืนยันว่าไอคอนขั้นตอนเรียงแถวเดียวไม่ซ้อนกัน แล้วลดขนาดหน้าต่างลงมาต่ำกว่า 720px ยืนยันว่ายังคงเรียงเป็นแนวตั้งแบบเดิม (ไม่ regress ของ mobile layout)

- [ ] **Step 6: Commit**

```bash
git add assets/ecmis-workspace.css tests/checklist-04-stage-track-scroll.test.mjs
git commit -m "fix: stage-track stays a single scrollable row instead of wrapping into overlapping rows"
```

---

### Task 5: เอกสารปกฟ้า 1-01 (สำนวนไต่สวน) เนื้อหาหลุดกรอบ (บั๊ก #5 checklist)

**Root cause:** `assets/ecmis-workspace.css:594` — `.official-blue-cover .cover-ground label{white-space:nowrap}` บังคับไม่ให้ label ของ checkbox (เช่น "ทุจริตต่อหน้าที่", "ประพฤติมิชอบ", "อื่น ๆ ....................") ตัดคำ ทำให้ label ที่ยาว (โดยเฉพาะ "อื่น ๆ" ที่มีเส้นประยาวสำหรับกรอกเพิ่มเติม) ดันล้นออกนอก padding ของหน้ากระดาษ (`.official-blue-cover{padding:58px 64px 62px}`) ทั้งที่ grid แม่ (`.cover-ground-options{grid-template-columns:repeat(2,minmax(0,1fr))}`) รองรับการหดตัวได้อยู่แล้ว

**Files:**
- Modify: `assets/ecmis-workspace.css:594`
- Test: `tests/checklist-05-cover-ground-wrap.test.mjs`

**Interfaces:**
- Consumes: ไม่มี
- Produces: ไม่มี

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-05-cover-ground-wrap.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

const rule = css.match(/\.official-blue-cover \.cover-ground label\{[^}]*\}/);
assert.ok(rule, ".cover-ground label rule must exist");
assert.doesNotMatch(rule[0], /white-space:nowrap/, "checkbox labels on the ปกฟ้า 1-01 cover must be allowed to wrap so long labels stay inside the page padding");

console.log("PASS checklist-05-cover-ground-wrap.test.mjs: cover-ground checkbox labels wrap instead of overflowing the page");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-05-cover-ground-wrap.test.mjs`
Expected: `AssertionError` เพราะยังมี `white-space:nowrap` อยู่ใน rule

- [ ] **Step 3: แก้ CSS**

ใน `assets/ecmis-workspace.css` บรรทัด 594 หา:

```css
.official-blue-cover .cover-ground label{display:flex;align-items:center;gap:5px;margin:0;white-space:nowrap}
```

เปลี่ยนเป็น:

```css
.official-blue-cover .cover-ground label{display:flex;align-items:flex-start;gap:5px;margin:0}
```

(เอา `white-space:nowrap` ออก และเปลี่ยน `align-items:center`→`flex-start` เพื่อให้ checkbox ชิดขอบบนสวยงามเมื่อ label ตัดขึ้น 2 บรรทัด)

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-05-cover-ground-wrap.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เปิดเอกสาร "ปกฟ้า 1-01" จากแท็บเอกสารในหน้า officer ยืนยันว่า label "อื่น ๆ ..................." ตัดขึ้นบรรทัดใหม่แทนที่จะล้นออกนอกหน้ากระดาษ

- [ ] **Step 6: Commit**

```bash
git add assets/ecmis-workspace.css tests/checklist-05-cover-ground-wrap.test.mjs
git commit -m "fix: allow long checkbox labels on the 1-01 blue cover to wrap instead of overflowing the page"
```

---

### Task 6: ช่อง "นับจำนวนหน้า" สองช่องไม่อยู่ตำแหน่งเดียวกัน (บั๊ก #6 checklist)

**Root cause:** `assets/ecmis-workspace.css:565` — `.pack-count-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.6rem}` ไม่ได้กำหนด layout ภายในแต่ละ `.ws-field` (มาจาก `documentPackPanel()` ที่ `assets/activity4-workspace.js:388`) เมื่อ label ของช่องหนึ่งยาวกว่าอีกช่อง (เช่น "ข้อมูลเรื่องร้องเรียน แบบ 1-02 และเอกสารแนบ" ยาวกว่า label ของ `countInputs` ตัวถัดไป) `<input>` ของแต่ละช่องจะอยู่คนละความสูงเพราะ content ไหลจากบนลงล่างตามปกติ

**Files:**
- Modify: `assets/ecmis-workspace.css:565`
- Test: `tests/checklist-06-pack-count-align.test.mjs`

**Interfaces:**
- Consumes: ไม่มี
- Produces: ไม่มี

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-06-pack-count-align.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(css, /\.pack-count-grid \.ws-field\{display:flex;flex-direction:column\}/, "pack-count-grid fields must be flex columns so inputs can align to the bottom regardless of label height");
assert.match(css, /\.pack-count-grid \.ws-field input\{margin-top:auto\}/, "the page-count input must be pinned to the bottom of its field");

console.log("PASS checklist-06-pack-count-align.test.mjs: page-count inputs align to the same baseline");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-06-pack-count-align.test.mjs`
Expected: `AssertionError` (ยังไม่มี rule `.pack-count-grid .ws-field`)

- [ ] **Step 3: แก้ CSS**

ใน `assets/ecmis-workspace.css` บรรทัด 565 หา:

```css
.pack-count-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.6rem}
```

เปลี่ยนเป็น (เพิ่ม rule ใหม่ต่อท้าย ไม่แก้ของเดิม):

```css
.pack-count-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.6rem}.pack-count-grid .ws-field{display:flex;flex-direction:column}.pack-count-grid .ws-field input{margin-top:auto}
```

(scope ด้วย `.pack-count-grid .ws-field` โดยเฉพาะ — ห้ามแก้ `.ws-field` เฉยๆ เพราะใช้ทั่วทั้งแอป)

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-06-pack-count-align.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เปิด "จัดทำและเรียงชุดเอกสาร" ในหน้า officer เลื่อนไปที่ "นับจำนวนหน้า" ยืนยันว่าช่อง input ทั้งสองอยู่บรรทัดเดียวกันแม้ label จะยาวไม่เท่ากัน

- [ ] **Step 6: Commit**

```bash
git add assets/ecmis-workspace.css tests/checklist-06-pack-count-align.test.mjs
git commit -m "fix: align page-count inputs to the same baseline regardless of label length"
```

---

### Task 7: ตัวกรอง "วันที่ลงรับ" แสดงปี ค.ศ. แทน พ.ศ. (บั๊ก #7 checklist)

**Root cause:** `assets/activity4-workspace.js` (ราว offset 149563, ใน `renderList`'s template ของ `#caseListView`) ใช้ `<input id="filterDate" type="date">` แบบเปล่าๆ — input ประเภทนี้ browser เป็นผู้ควบคุมการแสดงผลปีเองตาม locale ของ OS/browser (ไม่ใช่ตาม `lang="th"` ของหน้าเว็บ) จึงโชว์ ค.ศ. เสมอ ไม่มีทางบังคับผ่าน CSS/HTML ได้ ต้องเพิ่มป้ายกำกับ พ.ศ. คู่กันแทน โดยใช้วิธีบวก `+543` แบบเดียวกับที่ไฟล์นี้ใช้อยู่แล้วหลายจุด (บรรทัด 80, 254, 397, 1658)

**Files:**
- Modify: `assets/activity4-workspace.js` (markup ของ `#filterDate`, และจุด wiring event listener ของ filter ทั้งหมด)
- Modify: `assets/ecmis-workspace.css` (เพิ่ม rule ใหม่ `.filter-date-be`)
- Test: `tests/checklist-07-filter-date-be.test.mjs`

**Interfaces:**
- Consumes: ไม่มี
- Produces: ไม่มี

- [ ] **Step 1: เขียน test ที่ต้อง fail ก่อน**

สร้างไฟล์ `tests/checklist-07-filter-date-be.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(js, /<input id="filterDate" type="date"><small id="filterDateBuddhist" class="filter-date-be"><\/small>/, "filterDate field must carry a Buddhist-era badge next to the native picker");
assert.match(js, /\$\('#filterDate'\)\?\.addEventListener\('change',\(\)=>\{const el=\$\('#filterDateBuddhist'\),v=\$\('#filterDate'\)\.value;if\(!el\)return;if\(!v\)return el\.textContent='';const\[y,m,dd\]=v\.split\('-'\);el\.textContent=`\$\{dd\}\/\$\{m\}\/\$\{Number\(y\)\+543\} \(พ\.ศ\.\)`\}\)/, "changing the date filter must recompute the Buddhist-era label");
assert.match(css, /\.filter-date-be\{display:block;margin-top:\.3rem;color:#5c6b7a;font-size:\.7rem\}/, "the Buddhist-era badge needs its style rule");

console.log("PASS checklist-07-filter-date-be.test.mjs: date filter shows a พ.ศ. badge next to the native ค.ศ. picker");
```

- [ ] **Step 2: รัน test เพื่อยืนยันว่า fail**

Run: `node tests/checklist-07-filter-date-be.test.mjs`
Expected: `AssertionError` ที่ assertion แรก (ยังไม่มี `<small id="filterDateBuddhist">`)

- [ ] **Step 3a: แก้ markup**

ใน `assets/activity4-workspace.js` หา:

```
<div class="ws-field"><label>วันที่ลงรับ</label><input id="filterDate" type="date"></div>
```

เปลี่ยนเป็น:

```
<div class="ws-field"><label>วันที่ลงรับ</label><input id="filterDate" type="date"><small id="filterDateBuddhist" class="filter-date-be"></small></div>
```

- [ ] **Step 3b: เพิ่ม event listener**

ใน `assets/activity4-workspace.js` หา (บรรทัดเดียวกับที่ wire filter ทั้งหมดด้วย `forEach`):

```
['Search','Channel','Region','Province','Type','Status','Duplicate','Date'].forEach(x=>{$(`#filter${x}`).addEventListener(x==='Search'?'input':'change',renderList)});
```

เพิ่มบรรทัดใหม่ต่อท้ายทันที (ก่อน `function allCases(){`):

```
$('#filterDate')?.addEventListener('change',()=>{const el=$('#filterDateBuddhist'),v=$('#filterDate').value;if(!el)return;if(!v)return el.textContent='';const[y,m,dd]=v.split('-');el.textContent=`${dd}/${m}/${Number(y)+543} (พ.ศ.)`});
```

- [ ] **Step 3c: เพิ่ม CSS**

ใน `assets/ecmis-workspace.css` เพิ่ม rule ใหม่ต่อท้ายบรรทัด 565 (หลัง `.pack-count-grid` rule ที่แก้ใน Task 6 หรือที่ใดก็ได้ในไฟล์ — ไม่กระทบ selector อื่น):

```css
.filter-date-be{display:block;margin-top:.3rem;color:#5c6b7a;font-size:.7rem}
```

- [ ] **Step 4: รัน test เพื่อยืนยันว่าผ่าน**

Run: `node tests/checklist-07-filter-date-be.test.mjs`
Expected: พิมพ์ `PASS ...` และ exit code 0

- [ ] **Step 5: ตรวจด้วยตาจริงใน browser**

เปิดหน้า "รายการเรื่องร้องเรียน" เลือกวันที่ในตัวกรอง "วันที่ลงรับ" ยืนยันว่ามีข้อความ พ.ศ. ปรากฏใต้ช่อง input ทันทีที่เปลี่ยนวันที่ (เช่น เลือก `2026-08-06` ต้องขึ้น `06/08/2569 (พ.ศ.)`)

- [ ] **Step 6: Commit**

```bash
git add assets/activity4-workspace.js assets/ecmis-workspace.css tests/checklist-07-filter-date-be.test.mjs
git commit -m "feat: show a Buddhist-era badge next to the native ค.ศ. date filter"
```

---

## หมายเหตุปิดท้าย

- ทำตามลำดับ Task 1 → 7 เพราะ Task 3 (กู้คืน route-planner) ควรทำหลัง Task 1 (แก้ sidebar) เพื่อให้เห็นผลลัพธ์ที่ตรงกับสภาพแวดล้อมกว้างปกติตอนตรวจด้วยตา แต่ในทางเทคนิคทั้ง 7 Task เป็นอิสระต่อกัน ไม่มี Task ไหนต้อง merge ก่อนอีก Task หนึ่งจึงจะรันได้
- หลังทำครบทุก Task ให้กลับไปอัปเดตสถานะในชีต `checklist` ของ `กระบวนการไต่สวน.xlsx` จาก "ยังไม่ดำเนินการ" เป็นเสร็จสิ้น สำหรับ 7 ข้อนี้ (ไฟล์ xlsx ไม่ได้อยู่ใน git repo นี้ ต้องแก้ในตัว Excel เอง)
- อย่ารัน `node tests/activity5-handoff.test.mjs` เป็นตัวชี้วัดว่า Task เหล่านี้ผ่านหรือไม่ — ไฟล์นั้น fail อยู่ก่อนแล้วด้วยเหตุผลอื่นตามที่ระบุใน Global Constraints
