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
