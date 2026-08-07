import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(js, /<section class="route-planner"><header>/, "editorFor() must render the route-planner section again");
assert.match(js, /<input type="radio" name="route" value="center"/, "the normal-order route option must be present");
assert.match(js, /<input type="radio" name="route" value="division"/, "the exceptional route option must be present");
assert.match(js, /id="absenceBox"/, "the absence/exception panel must be present");
assert.match(js, /id="absenceReasonType"/, "the absence reason type select must be present");
assert.match(js, /id="absenceNote"/, "the absence note textarea must be present");

const flowRule = css.match(/\.route-flow\{[^}]*\}/g) || [];
assert.ok(flowRule.some(r => r.includes("flex-wrap:wrap")), ".route-flow must wrap its pills instead of overflowing the route-option box");

console.log("PASS checklist-03-route-planner-restore.test.mjs: route-planner section restored and no longer overflows its frame");
