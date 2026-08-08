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

console.log("PASS checklist-09-mini-stagebar-caserows.test.mjs: expandable mini-stagebar toggle on staff-workflow case rows (CSS dots/line, miniStagebar(state), 9-column header/colspan, stopPropagation on toggle)");
