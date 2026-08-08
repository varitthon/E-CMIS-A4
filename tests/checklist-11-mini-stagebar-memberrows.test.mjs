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
