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
