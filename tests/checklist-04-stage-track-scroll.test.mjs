import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");

assert.match(css, /\.ws-stage-track\{position:relative;display:flex;overflow-x:auto;margin:0;padding:1\.25rem 1rem 1\.35rem;list-style:none;background:#f8fbfd\}/, "desktop .ws-stage-track must be a single scrollable row, not a wrapping grid");
assert.doesNotMatch(css, /\.ws-stage-track\{position:relative;display:grid;grid-template-columns:repeat\(auto-fit/, "the old wrapping grid layout must be gone");
assert.match(css, /\.ws-stage-track>\.ws-stage\{flex:1 0 8rem\}/, "each stage node needs a fixed basis so the row scrolls instead of squeezing");
assert.match(css, /\.ws-stage-track\{flex-direction:column;overflow-x:visible;padding:1rem\}/, "mobile override must keep the intentional vertical stack layout");

console.log("PASS checklist-04-stage-track-scroll.test.mjs: stage track no longer wraps into overlapping rows");
