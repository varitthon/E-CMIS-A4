# Expandable mini-stagebar on list rows

## Problem

Users have to open a case's full detail page just to see which step it's currently on. There's no way to glance at status from the list view.

## Goal

Add an expand toggle to each row/card across all three case-list surfaces. Expanding reveals a compact "mini-stagebar" showing: steps already passed, current step, and steps still ahead — without navigating away from the list.

## Scope

Three surfaces, three different data shapes, one shared visual language:

1. `staff-workflow.html` — `#caseRows` (table), rendered by `assets/activity4-workspace.js`
2. `member-dashboard.html` — `#caseList` (button cards), inline `<script>` in the page itself
3. `activity5/index.html` — `.case-list` (`renderCases`/`renderCaseCard`), `activity5/assets/app.js`

## Shared visual: `.mini-stagebar`

A compact peek component, not a scaled-down copy of the existing full stagebar:

- Small dots (circles) connected by a thin horizontal line.
- States: `done` (filled navy), `current` (larger, highlighted/pulsing like the existing `.active` state), `pending` (hollow gray).
- No per-dot text labels — only the current step's name is printed once, as a small text line under/beside the dots.
- Purpose-built CSS per page (each page already keeps its own stylesheet — `ecmis-workspace.css` vs `member-dashboard.html`'s inline `<style>` vs Activity 5's own stylesheet). Class name `.mini-stagebar` stays consistent across all three for a shared mental model, even though the rules are duplicated per page like everything else in this codebase.

## Interaction

- A chevron/expand icon is added to each row/card, separate from any existing click behavior.
- Click toggles a block inserted directly under that row/card containing the `.mini-stagebar`. `aria-expanded` on the toggle, `aria-controls` pointing at the revealed block.
- Existing behaviors are untouched: clicking a `staff-workflow.html` row still opens the full case detail; clicking a `member-dashboard.html` row still opens the big detail panel (`showCase`). The new chevron is an independent toggle.
- Multiple rows may be expanded simultaneously — no exclusivity, no state to reconcile between rows.
- Expand state is not persisted across re-renders (filtering, pagination) — resets closed, consistent with how these lists already behave on re-render.

## Per-page data source

### `staff-workflow.html`

Reuse the exact step data already computed for the detail view — don't re-derive it:

- Activity 4 stage cases: the `JOURNEY` array + `currentIndex` computed inside `stagebar(state)` (`assets/activity4-workspace.js:1086`).
- Activity 5 stage cases: `stages`/`current` from `journeyStages(state)` (`assets/activity5-workspace.js:303`).

New compact renderer(s) consume this data to emit `.mini-stagebar` markup instead of the full `.ws-stagebar.a5` card. The row-list code (`assets/activity4-workspace.js` around `caseRows` rendering, line 2155) needs to call `getState(c.id)` (already does, for other columns) and pick the right step source the same way the detail view already does.

### `activity5/index.html`

Reuse `PHASE_ORDER`, `PHASES`, and the `activeIndex` logic already inside `renderPhaseStepper(activePhase)` (`activity5/assets/app.js:508`). New compact renderer takes the same inputs, emits `.mini-stagebar` markup instead of `.phase-stepper`.

### `member-dashboard.html`

No discrete journey array exists today — `item.timeline` is just a free-text activity log, not a fixed template with future steps. New shared constant:

```js
const PUBLIC_JOURNEY = ['ยื่นเรื่อง', 'ตรวจสอบเบื้องต้น', 'อยู่ระหว่างพิจารณา/ส่งหน่วยงาน', 'รับไว้ดำเนินการ/มีผล'];
```

Mapping from `item.tone` to current index:

| tone | current index | rationale |
|---|---|---|
| `review` | 2 | still being worked, not yet forwarded or accepted |
| `forwarded` | 2 | sent onward but not yet a final outcome — same "in motion" bucket as review |
| `accepted` | 3 | case has a result |

Steps before the current index render as `done`.

## Out of scope

- No changes to the existing full detail views/stagebars.
- No backend/data-model changes — this is presentation-only, built from data that already exists (or, for member-dashboard, a small fixed lookup table).
- No visual browser verification in this session (no browser tool available) — implementation will be reviewed by reading rendered HTML/CSS output and existing regression tests; the user will need to check the deployed pages visually.
