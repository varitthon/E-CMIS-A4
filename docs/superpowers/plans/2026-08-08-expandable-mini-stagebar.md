# Expandable Mini-Stagebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user glance at a case's progress (done / current / upcoming steps) directly from each list, without opening the full detail page.

**Architecture:** A small "dot + line" mini-stagebar visual, built independently per surface from whatever step data that surface already has (or, for member-dashboard, a new small lookup table). No shared JS module — each of the three pages already keeps its own styling/rendering approach, and this follows that pattern rather than introducing a new shared file for three call sites.

**Tech Stack:** Plain JS (no framework), hand-rolled string templating (matches all three files' existing rendering style), plain CSS per page. Tests are Node's `node:assert/strict` run directly via `node tests/x.test.mjs`, matching this repo's existing convention — static regex assertions against source text, since none of the three target files currently expose a way to execute their render functions from Node without a full DOM (verified: `activity4-workspace.js` and `activity5/assets/app.js` both run top-level DOM-touching code on load; `member-dashboard.html`'s renderer is inline `<script>`, not an importable module).

## Global Constraints

- Do not modify any line currently shown as pending/uncommitted in `git diff` for `assets/activity4-workspace.js`, `assets/ecmis.js`, `complaint-form.html`, `staff-intake.html`, or `staff-workflow.html` — those are another session's in-progress work. Only add new lines; never edit an existing line inside a function that diff already touches.
- `stagebar(state)` in `assets/activity4-workspace.js` now has an early-return branch for `w.stage==='duplicate-closed'` (part of that pending work) — the new mini renderer must handle this case too, computed independently rather than by editing `stagebar()`.
- No browser/jsdom available in this environment — verification is via regex tests against generated markup/CSS text, not a live render. The user will need to visually confirm on the deployed pages.
- Multiple rows/cards may be expanded at once — no exclusivity, no cross-row state to track.
- Expand state resets on re-render (filtering, pagination, search) — this matches how all three lists already behave.

---

## Task 1: `staff-workflow.html` — mini-stagebar on `#caseRows`

**Files:**
- Modify: `assets/activity4-workspace.js` (add `miniStagebar(state)` near `stagebar(state)` at line ~1115; modify the `caseRows` row template at line 2154; modify the `caseListView` table header at line 1716; add a click handler near line 2155)
- Modify: `assets/ecmis-workspace.css` (add `.mini-stagebar` rules)
- Test: `tests/checklist-09-mini-stagebar-caserows.test.mjs`

**Interfaces:**
- Produces: `miniStagebar(state)` — takes the same `state` shape as `stagebar(state)` (`{workflow:{stage,status,complete,owner}, documentData:{decision,anonymous,...}, assignmentHistory:[]}`), returns an HTML string `<div class="mini-stagebar">...</div>`.

- [ ] **Step 1: Write the failing test**

Create `tests/checklist-09-mini-stagebar-caserows.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

// CSS: compact dot/segment visual exists
assert.match(css, /\.mini-stagebar\{/, "must define .mini-stagebar container");
assert.match(css, /\.mini-stage-dot\{/, "must define .mini-stage-dot");
assert.match(css, /\.mini-stage-dot\.done\{/, "must style the done state");
assert.match(css, /\.mini-stage-dot\.current\{/, "must style the current state");
assert.match(css, /\.mini-stage-line\{/, "must define the connector line between dots");
assert.match(css, /\.case-mini-toggle\{/, "must style the row expand toggle button");

// JS: miniStagebar() exists, handles the duplicate-closed branch independently of stagebar()
assert.match(js, /function miniStagebar\(state\)\{/, "must define miniStagebar(state)");
assert.match(js, /function miniStagebar\(state\)\{[\s\S]{0,400}duplicate-closed/, "miniStagebar must handle the duplicate-closed stage itself, not depend on stagebar()'s branch");

// JS: row template has an expand toggle + a sibling mini row, without breaking the existing row-click-opens-detail behavior
assert.match(js, /class="case-mini-toggle"/, "row must render a mini-stagebar toggle button");
assert.match(js, /data-mini-for="\$\{c\.id\}"/, "must render a companion row keyed to the case id");
assert.match(js, /\.case-mini-toggle'\)\.forEach\(btn=>\{[\s\S]{0,150}stopPropagation/, "toggle click must not bubble into the row's own open-detail handler");
assert.match(js, /colspan="9"/, "table now has 9 columns (existing 8 + toggle column) — header/empty-state colspan must be updated");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/checklist-09-mini-stagebar-caserows.test.mjs`
Expected: `AssertionError` — none of the new CSS/JS exists yet.

- [ ] **Step 3: Add the CSS**

In `assets/ecmis-workspace.css`, append (matches the file's existing minified single-line-per-rule style):

```css
.mini-stagebar{display:flex;align-items:center;gap:.3rem;padding:.55rem .9rem;background:#f3f6f9;border-top:1px solid var(--ws-line)}.mini-stage-dot{width:9px;height:9px;border-radius:50%;background:#c7d2dc;flex:none}.mini-stage-dot.done{background:#1671c5}.mini-stage-dot.current{width:13px;height:13px;background:#a66321;box-shadow:0 0 0 3px rgba(166,99,33,.22)}.mini-stage-line{flex:1 1 0;height:2px;min-width:.5rem;background:#c7d2dc}.mini-stage-line.done{background:#1671c5}.mini-stage-label{margin-left:.5rem;font-size:.76rem;color:#36536c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.case-mini-toggle{background:none;border:0;cursor:pointer;color:#5f7180;font-size:.85rem;line-height:1;padding:.3rem .5rem;border-radius:6px}.case-mini-toggle:hover{background:#eef3f8;color:#082b50}.case-mini-toggle:focus-visible{outline:3px solid #c9a227;outline-offset:1px}.case-mini-toggle i{display:inline-block;transition:transform .15s ease}.case-mini-toggle[aria-expanded="true"] i{transform:rotate(180deg)}
```

- [ ] **Step 4: Add `miniStagebar(state)` in `assets/activity4-workspace.js`**

Insert immediately after the closing `}` of the existing `stagebar(state)` function (do not edit `stagebar()` itself — this is a new, independent function placed right after it):

```js
  function miniStagebar(state){
    const w=state.workflow,d=state.documentData;
    if(w.stage==='duplicate-closed'){
      const steps=['รับเรื่อง','กลั่นกรองซ้ำ','รวมกับเรื่องเดิม'];
      return `<div class="mini-stagebar">${steps.map((label,i)=>`${i?'<span class="mini-stage-line done"></span>':''}<span class="mini-stage-dot done" title="${escapeHtml(label)}"></span>`).join('')}<span class="mini-stage-label">${escapeHtml(w.status)}</span></div>`;
    }
    const branchLabel=w.stage==='anonymous-box'||(d.decision==='not-accept'&&d.anonymous)
      ?'กล่องบัตรสนเท่ห์'
      :w.stage==='nacc-dispatch'||d.decision==='send-nacc'
        ?'เจ้าหน้าที่จัดส่งสำนักงาน ป.ป.ช.'
        :['officer-dispatch','activity5-dispatch'].includes(w.stage)||['18/1ก','18/1ข','18/4'].includes(d.decision)
          ?'เจ้าหน้าที่จัดส่งไปยังเขต'
          :'ผู้อำนวยการกองบริหารคดี มีคำสั่ง';
    const JOURNEY=['รับเรื่อง','กลั่นกรอง/มอบหมาย','พิจารณา Form 3','อนุมัติ/เลขสำนวน',branchLabel];
    const assigned=state.assignmentHistory.length>0||Boolean(d.assignedOfficer);
    const stageIndex={admin:assigned?1:0,officer:2,center:3,division:4,acting:4,'division-order':4,'anonymous-box':4,'nacc-dispatch':4,'officer-dispatch':4,'activity5-dispatch':4};
    const currentIndex=Math.min(stageIndex[w.stage]??0,JOURNEY.length-1);
    const terminalComplete=w.complete&&currentIndex===JOURNEY.length-1;
    const currentLabel=terminalComplete?'ดำเนินการเสร็จสิ้น':w.status;
    return `<div class="mini-stagebar">${JOURNEY.map((label,i)=>{
      const status=i<currentIndex||(terminalComplete&&i===currentIndex)?'done':i===currentIndex?'current':'';
      return `${i?`<span class="mini-stage-line ${i<=currentIndex?'done':''}"></span>`:''}<span class="mini-stage-dot ${status}" title="${escapeHtml(label)}"></span>`;
    }).join('')}<span class="mini-stage-label">${escapeHtml(currentLabel)}</span></div>`;
  }
```

- [ ] **Step 5: Wire the toggle + companion row into the `caseRows` template**

In `assets/activity4-workspace.js` at line 2154, the row template currently ends with:

```js
...<td><span class="ws-status ${risk?'danger':'success'}">${risk?`ควรตรวจสอบ ${analysis.score}%`:'ยังไม่พบสัญญาณ'}</span></td></tr>`
```

Change it to add a 9th `<td>` for the toggle, plus a sibling `<tr>` right after (still inside the same `.map()` callback, same template literal):

```js
...<td><span class="ws-status ${risk?'danger':'success'}">${risk?`ควรตรวจสอบ ${analysis.score}%`:'ยังไม่พบสัญญาณ'}</span></td><td><button type="button" class="case-mini-toggle" data-case="${c.id}" aria-expanded="false" aria-controls="mini-${c.id}" title="ดูสถานะแบบย่อ"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></td></tr><tr id="mini-${c.id}" class="case-mini-row ws-hidden" data-mini-for="${c.id}"><td colspan="9">${miniStagebar(s)}</td></tr>`
```

Update the empty-state fallback on the same line from `colspan="8"` to `colspan="9"`.

- [ ] **Step 6: Add the header column and the click handler**

In `assets/activity4-workspace.js` at line 1716, in the `<thead><tr>` inside `caseListView`, change:

```html
<th>เรื่องซ้ำ</th></tr></thead>
```

to:

```html
<th>เรื่องซ้ำ</th><th class="mini-toggle-col" aria-label="ขยายดูสถานะ"></th></tr></thead>
```

Immediately after the existing `$$('[data-case]').forEach(...)` block (line ~2155), add:

```js
$$('.case-mini-toggle').forEach(btn=>{
  btn.onclick=e=>{
    e.stopPropagation();
    const row=document.getElementById(`mini-${btn.dataset.case}`);
    if(!row)return;
    const open=row.classList.toggle('ws-hidden')===false;
    btn.setAttribute('aria-expanded',String(open));
  };
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node tests/checklist-09-mini-stagebar-caserows.test.mjs`
Expected: no output before `PASS` line — no `AssertionError` thrown. Add a trailing `console.log("PASS checklist-09-mini-stagebar-caserows.test.mjs")` matching the other checklist tests' convention.

- [ ] **Step 8: Run the full existing test suite to confirm nothing else broke**

Run: `for f in tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done`
Expected: every file prints its own `PASS ...` line, nothing prints `FAIL:`.

- [ ] **Step 9: Commit**

```bash
git add assets/activity4-workspace.js assets/ecmis-workspace.css tests/checklist-09-mini-stagebar-caserows.test.mjs
git commit -m "Add expandable mini-stagebar to staff-workflow.html case list rows"
```

---

## Task 2: `activity5/index.html` — mini-stagebar on `.case-card`

**Files:**
- Modify: `activity5/assets/app.js` (add `renderMiniPhaseStepper(activePhase)` near `renderPhaseStepper` at line ~508; modify `renderCaseCard` at line 458)
- Modify: `activity5/assets/styles.css` (add `.mini-stagebar` rules near the existing `.phase-stepper` block, ~line 1061)
- Test: `tests/checklist-10-mini-stagebar-casecards.test.mjs`

**Interfaces:**
- Produces: `renderMiniPhaseStepper(activePhase)` — same input as `renderPhaseStepper` (a `PHASE_ORDER` member string), returns an HTML string.
- Uses `<details>`/`<summary>` (native disclosure element) instead of hand-wired click JS, since `renderCaseCard`'s `<article class="case-card">` has no existing click-to-open behavior of its own to conflict with (unlike the other two surfaces) — this is the simplest correct fit here, needs zero new event wiring.

- [ ] **Step 1: Write the failing test**

Create `tests/checklist-10-mini-stagebar-casecards.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "activity5/assets/app.js"), "utf8");
const css = readFileSync(resolve(root, "activity5/assets/styles.css"), "utf8");

assert.match(css, /\.mini-stagebar\s*\{/, "styles.css must define .mini-stagebar");
assert.match(css, /\.mini-stage-dot\s*\{/, "styles.css must define .mini-stage-dot");
assert.match(css, /\.mini-stage-dot\.done\s*\{/, "must style the done state");
assert.match(css, /\.mini-stage-dot\.current\s*\{/, "must style the current state");

assert.match(js, /function renderMiniPhaseStepper\(activePhase\)\s*\{/, "must define renderMiniPhaseStepper(activePhase)");
assert.match(js, /PHASE_ORDER\.indexOf\(activePhase\)/, "renderMiniPhaseStepper must reuse PHASE_ORDER/activeIndex, same source of truth as renderPhaseStepper");

assert.match(js, /<details class="case-mini-details">/, "case card must render a native <details> toggle for the mini-stagebar");
assert.match(js, /<summary/, "the details element must have a summary trigger");
assert.match(js, /renderMiniPhaseStepper\(item\.phase\)/, "case card must call renderMiniPhaseStepper with the card's own phase");

console.log("PASS checklist-10-mini-stagebar-casecards.test.mjs");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/checklist-10-mini-stagebar-casecards.test.mjs`
Expected: `AssertionError`.

- [ ] **Step 3: Add `renderMiniPhaseStepper` in `activity5/assets/app.js`**

Insert immediately after the existing `renderPhaseStepper` function (around line 511), as a new, independent function — do not modify `renderPhaseStepper` itself:

```js
function renderMiniPhaseStepper(activePhase) {
  const activeIndex = PHASE_ORDER.indexOf(activePhase);
  return `<div class="mini-stagebar">${PHASE_ORDER.map((phase, index) => {
    const status = index < activeIndex ? "is-complete" : index === activeIndex ? "is-current" : "";
    return `${index ? `<span class="mini-stage-line ${index <= activeIndex ? "done" : ""}"></span>` : ""}<span class="mini-stage-dot ${status === "is-complete" ? "done" : status === "is-current" ? "current" : ""}" title="${escapeHtml(PHASES[phase])}"></span>`;
  }).join("")}<span class="mini-stage-label">${escapeHtml(PHASES[activePhase])}</span></div>`;
}
```

- [ ] **Step 4: Add the `<details>` toggle to `renderCaseCard`**

In `activity5/assets/app.js`, `renderCaseCard` (line 458) currently ends:

```js
      <a class="button button-secondary" href="#/cases/${encodeURIComponent(item.id)}/overview">เปิดสำนวน</a>
    </article>
  `;
}
```

Change to insert a `<details>` block before the closing `</article>`:

```js
      <details class="case-mini-details">
        <summary>ดูสถานะแบบย่อ</summary>
        ${renderMiniPhaseStepper(item.phase)}
      </details>
      <a class="button button-secondary" href="#/cases/${encodeURIComponent(item.id)}/overview">เปิดสำนวน</a>
    </article>
  `;
}
```

- [ ] **Step 5: Add the CSS in `activity5/assets/styles.css`**

Insert near the existing `.phase-stepper` block (after line ~1136, matching this file's multi-line convention):

```css
.mini-stagebar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0;
}
.mini-stage-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #c7d2dc;
  flex: none;
}
.mini-stage-dot.done {
  background: #1671c5;
}
.mini-stage-dot.current {
  width: 13px;
  height: 13px;
  background: #a66321;
  box-shadow: 0 0 0 3px rgba(166, 99, 33, 0.22);
}
.mini-stage-line {
  flex: 1 1 0;
  height: 2px;
  min-width: 0.5rem;
  background: #c7d2dc;
}
.mini-stage-line.done {
  background: #1671c5;
}
.mini-stage-label {
  margin-left: 0.5rem;
  font-size: 0.76rem;
  color: #36536c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.case-mini-details {
  margin-top: 0.5rem;
}
.case-mini-details summary {
  cursor: pointer;
  font-size: 0.78rem;
  color: #5f7180;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node tests/checklist-10-mini-stagebar-casecards.test.mjs`
Expected: prints `PASS checklist-10-mini-stagebar-casecards.test.mjs`, no `AssertionError`.

- [ ] **Step 7: Run the full existing test suite**

Run: `for f in tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done`
Expected: no `FAIL:` lines.

- [ ] **Step 8: Commit**

```bash
git add activity5/assets/app.js activity5/assets/styles.css tests/checklist-10-mini-stagebar-casecards.test.mjs
git commit -m "Add expandable mini-stagebar to activity5 case registry cards"
```

---

## Task 3: `member-dashboard.html` — mini-stagebar on `.case-row`

**Files:**
- Modify: `member-dashboard.html` (add a `PUBLIC_JOURNEY` constant + `publicJourneyIndex(item)` helper and CSS in the `<style>` block; modify the `renderList()` row template)
- Test: `tests/checklist-11-mini-stagebar-memberrows.test.mjs`

**Design note (constraint discovered during this task):** `.case-row` is currently rendered as a `<button>` (`renderList()`, line 153). HTML forbids interactive content (another `<button>`, `<details>`, etc.) nested inside a `<button>`. Restructuring `.case-row` into a wrapper `<div>` + inner `<button>` to add a *second*, independent toggle would require re-verifying the existing grid/hover/active CSS across three rule locations (lines 63, 89, and the `max-width:800px` block at line 11) without a browser to confirm nothing shifted visually — not safe to do blind. Given that, the mini-stagebar on this page renders **always visible** inside the existing row (no separate expand toggle) rather than restructuring already-working markup. This still delivers the ask (glance at status without opening the full detail) — it just doesn't have a click-to-reveal step on this one surface. Flag to the user after implementation in case they'd rather have the restructure done as a follow-up.

**Interfaces:**
- Produces: `publicJourneyIndex(item)` — takes a `cases[]` entry (has `.tone`), returns a 0-based index into `PUBLIC_JOURNEY`.
- Produces: `PUBLIC_JOURNEY` — `string[]` of 4 labels.

- [ ] **Step 1: Write the failing test**

Create `tests/checklist-11-mini-stagebar-memberrows.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "member-dashboard.html"), "utf8");

assert.match(html, /\.mini-stagebar\s*\{/, "must define .mini-stagebar in the page's <style> block");
assert.match(html, /\.mini-stage-dot\s*\{/, "must define .mini-stage-dot");
assert.match(html, /\.mini-stage-dot\.done\s*\{/, "must style the done state");
assert.match(html, /\.mini-stage-dot\.current\s*\{/, "must style the current state");

assert.match(html, /const PUBLIC_JOURNEY\s*=\s*\[/, "must define the 4-step public journey constant");
assert.match(html, /'ยื่นเรื่อง'/, "journey must start with ยื่นเรื่อง");
assert.match(html, /'รับไว้ดำเนินการ\/มีผล'/, "journey must end with the accepted/outcome step");

assert.match(html, /function publicJourneyIndex\(item\)\s*\{/, "must define publicJourneyIndex(item)");
assert.match(html, /publicJourneyIndex\(item\)[\s\S]{0,300}review[\s\S]{0,50}2/, "review tone must map to index 2");
assert.match(html, /publicJourneyIndex\(item\)[\s\S]{0,300}forwarded[\s\S]{0,50}2/, "forwarded tone must map to index 2");
assert.match(html, /publicJourneyIndex\(item\)[\s\S]{0,300}accepted[\s\S]{0,50}3/, "accepted tone must map to index 3");

assert.match(html, /class="mini-stagebar"/, "case-row template must render the mini-stagebar markup");

console.log("PASS checklist-11-mini-stagebar-memberrows.test.mjs");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/checklist-11-mini-stagebar-memberrows.test.mjs`
Expected: `AssertionError`.

- [ ] **Step 3: Add the CSS**

In `member-dashboard.html`, inside the existing `<style>` block, near `.case-row` (after line 75), add (matches this block's multi-line convention):

```css
.mini-stagebar{display:flex;align-items:center;gap:.3rem;margin-top:.6rem}
.mini-stage-dot{width:9px;height:9px;border-radius:50%;background:#dfe4ea;flex:none}
.mini-stage-dot.done{background:var(--blue)}
.mini-stage-dot.current{width:13px;height:13px;background:var(--gold);box-shadow:0 0 0 3px rgba(201,162,39,.22)}
.mini-stage-line{flex:1 1 0;height:2px;min-width:.5rem;background:#dfe4ea}
.mini-stage-line.done{background:var(--blue)}
.mini-stage-label{margin-left:.5rem;font-size:.76rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
```

- [ ] **Step 4: Add `PUBLIC_JOURNEY` + `publicJourneyIndex` + a mini renderer**

In the `<script>` block, after the `cases` array and its enrichment logic (after line 145, before `const list=document.getElementById(...)`), add:

```js
const PUBLIC_JOURNEY=['ยื่นเรื่อง','ตรวจสอบเบื้องต้น','อยู่ระหว่างพิจารณา/ส่งหน่วยงาน','รับไว้ดำเนินการ/มีผล'];
function publicJourneyIndex(item){
  if(item.tone==='accepted')return 3;
  if(item.tone==='forwarded')return 2;
  if(item.tone==='review')return 2;
  return 0;
}
function miniStagebar(item){
  const current=publicJourneyIndex(item);
  return `<div class="mini-stagebar">${PUBLIC_JOURNEY.map((label,i)=>{
    const status=i<current?'done':i===current?'current':'';
    return `${i?`<span class="mini-stage-line ${i<=current?'done':''}"></span>`:''}<span class="mini-stage-dot ${status}" title="${escapeHtml(label)}"></span>`;
  }).join('')}<span class="mini-stage-label">${escapeHtml(PUBLIC_JOURNEY[current])}</span></div>`;
}
```

- [ ] **Step 5: Render it inside `renderList()`'s row template**

In `renderList()` (line 153), the row template currently ends:

```js
...<div class="case-stream complainant"><span>กิจกรรมของผู้ร้อง</span><strong>${escapeHtml(item.complainantActivity.at(-1)?.[0]||'ยังไม่มีกิจกรรม')}</strong><small>ล่าสุด ${escapeHtml(item.complainantUpdated)}</small></div></div><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>`
```

Insert the mini-stagebar between the closing `</div>` of `.case-streams` and the chevron `<i>`:

```js
...<div class="case-stream complainant"><span>กิจกรรมของผู้ร้อง</span><strong>${escapeHtml(item.complainantActivity.at(-1)?.[0]||'ยังไม่มีกิจกรรม')}</strong><small>ล่าสุด ${escapeHtml(item.complainantUpdated)}</small></div></div>${miniStagebar(item)}<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>`
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node tests/checklist-11-mini-stagebar-memberrows.test.mjs`
Expected: prints `PASS checklist-11-mini-stagebar-memberrows.test.mjs`.

- [ ] **Step 7: Run the full existing test suite**

Run: `for f in tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done`
Expected: no `FAIL:` lines.

- [ ] **Step 8: Commit**

```bash
git add member-dashboard.html tests/checklist-11-mini-stagebar-memberrows.test.mjs
git commit -m "Show mini-stagebar on member-dashboard complaint rows"
```

---

## Final check across all three tasks

- [ ] **Run the entire test suite one more time**

Run: `for f in tests/*.test.mjs; do node "$f" || echo "FAIL: $f"; done`
Expected: 14 `PASS` lines (11 pre-existing + 3 new), zero `FAIL:`.

- [ ] **Confirm no pending-work files were touched**

Run: `git diff --stat -- assets/ecmis.js complaint-form.html staff-intake.html`
Expected: empty output (these files are untouched by this plan; only `assets/activity4-workspace.js` should show new diff lines on top of the pre-existing pending diff, never a removed line that was part of that pending diff).
