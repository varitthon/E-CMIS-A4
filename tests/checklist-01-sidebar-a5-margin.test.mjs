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
