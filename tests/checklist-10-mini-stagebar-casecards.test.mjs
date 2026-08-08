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
