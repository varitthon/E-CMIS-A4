import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const html = readFileSync(resolve(root, "staff-workflow.html"), "utf8");

// Bug #7 (native <input type=date> always renders ค.ศ.) is fixed by replacing
// the native picker with the Thai calendar popover (ปฏิทินไทย พ.ศ.).
assert.match(html, /assets\/thai-date-picker\.js/, "the Thai date picker library must be loaded");
assert.match(js, /<label>วันที่ลงรับ<\/label><div class="thai-date-field">/, "the filter date field must use the thai-date-field wrapper, not a native date input");
assert.match(js, /id="filterDateTrigger"/, "the filter needs a Thai calendar trigger button");
assert.match(js, /id="filterDateCalendarPopover"/, "the filter needs the Thai calendar popover");
assert.match(js, /id="filterDateDisplayText"/, "the filter needs a display element that shows the selected พ.ศ. date");
assert.doesNotMatch(js, /<input id="filterDate" type="date">/, "the native ค.ศ. date input must be gone");

// wiring: click on trigger toggles the popover, and selecting a day updates the filter
assert.match(js, /filterDateTrigger'\)\.addEventListener\('click'/, "the trigger must be wired to toggle the popover");

console.log("PASS checklist-07-filter-date-be.test.mjs: date filter uses the Thai Buddhist-era calendar instead of the native ค.ศ. picker");
