import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");

// The "นับจำนวนหน้า" section was redesigned from .pack-count-grid to a
// .pack-count-table grid (display:contents rows) — inputs now share the same
// grid column, so they align to the same baseline regardless of label length.
const tableRule = css.match(/\.pack-count-table\{[^}]*\}/);
assert.ok(tableRule, ".pack-count-table rule must exist");
assert.match(tableRule[0], /display:grid/, "pack-count-table must be a grid so every row shares the same columns");
assert.match(tableRule[0], /grid-template-columns:46px minmax\(0,1fr\) 66px/, "columns = ลำดับ | รายการ | หน้า");

assert.match(css, /\.pack-count-row\{display:contents\}/, "rows must be display:contents so cells fall into the shared grid columns");
assert.match(css, /\.pack-count-row>input\{[^}]*text-align:right[^}]*\}/, "page-count inputs must be right-aligned in the shared หน้า column");

// The old class must not be used as the page-count layout anymore
assert.doesNotMatch(js, /class="pack-count-grid"/, "the old pack-count-grid markup must be gone");

console.log("PASS checklist-06-pack-count-align.test.mjs: page-count inputs align to the same column via the pack-count-table grid");
