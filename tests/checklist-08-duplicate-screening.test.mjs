import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const js = readFileSync(resolve(root, "assets/activity4-workspace.js"), "utf8");
const css = readFileSync(resolve(root, "assets/ecmis-workspace.css"), "utf8");
const ecmis = readFileSync(resolve(root, "assets/ecmis.js"), "utf8");

// 1. Officer screening UI (walk-in/1206) — decision radios + confirm
assert.match(js, /กลั่นกรองเรื่องซ้ำ/, "officer editor must render the duplicate screening section");
assert.match(js, /name="screeningDecision" value="new"/, "screening must offer 'เรื่องใหม่' option");
assert.match(js, /name="screeningDecision" value="duplicate"/, "screening must offer 'เรื่องซ้ำ' option");
assert.match(js, /data-action="screening-confirm"/, "screening confirm action must be wired");
assert.match(js, /data-action="screening-undo"/, "screening undo action must exist");
assert.match(js, /data-action="print-duplicate-receipt"/, "print original-number receipt action must exist");
assert.match(js, /screeningLinkedCase/, "officer must pick the original case to merge into");
assert.match(js, /ระบบเป็นเพียงคำแนะนำ/, "the suggest-only rule text must be shown");

// 2. Human-decides rule: officer-send blocked until screening decided (walk-in/1206)
assert.match(js, /ต้องตัดสินใจกลั่นกรอง \(เรื่องใหม่\) ก่อนบันทึกและส่งพิจารณา/, "officer-send must be blocked before screening decision");

// 3. Duplicate closes the case without entering the pipeline
assert.match(js, /duplicate-closed/, "workflow must support the duplicate-closed stage");
assert.match(js, /เรื่องซ้ำ — รวมกับเรื่องเดิม/, "duplicate status text must exist (workflow + list filter)");

// 4. No new number for duplicates: original tracking pulled + printed on receipt
assert.match(js, /duplicateReceiptPaper/, "receipt variant for the original number must exist");
assert.match(js, /receipt-duplicate-note/, "the duplicate receipt must carry a เรื่องซ้ำ note");
assert.match(js, /เลขติดตามของเรื่องเดิมและปิดเรื่องนี้/, "duplicate option must state no-new-number + use original");

// 5. Walk-in defers number allocation until after screening
assert.match(js, /createPendingReference/, "walk-in intake must use deferred (pending) allocation");
assert.match(js, /รอจัดสรรเลขรับบริการหลังกลั่นกรองเรื่องซ้ำ/, "walk-in status must mention screening-first allocation");
assert.match(ecmis, /function createPendingReference/, "ecmis.js must provide createPendingReference");

// 6. Different-complainant-same-subject = warning + score signal (practice: separate)
assert.match(js, /มีผู้ร้องรายอื่นร้องเรียนหน่วยงาน\/เรื่องเดียวกัน — แนวปฏิบัติปกติ: แยกกันดำเนินการ/, "different-complainant signal must be part of the score");
assert.match(js, /ผู้ร้องรายอื่น/, "screening panel must surface the other-complainant warning");

// 7. Report to supervisor path (post-entry duplicates) survives
assert.match(js, /data-action="screening-report"/, "officer must be able to report duplicate to supervisor");
assert.match(js, /data-action="center-merge"/, "center must be able to order merge");
assert.match(js, /data-action="center-separate"/, "center must be able to order separate handling");

// 8. State backfill for stored cases
assert.match(js, /state\.documentData\.screening=\{decision:''/, "getState must backfill the screening state");

// 9. CSS present
assert.match(css, /\.screening-box\{/, "screening box styles must exist");
assert.match(css, /\.screening-options\{/, "screening option grid styles must exist");
assert.match(css, /\.screening-warning\{/, "other-complainant warning styles must exist");
assert.match(css, /\.receipt-duplicate-note\{/, "duplicate receipt note styles must exist");

// 10. Post-review hardening: duplicate-closed hides the review form on the officer editor
assert.match(js, /if\(d\.screening\?\.decision==='duplicate'\)return `\$\{screeningSection\(state\)\}`/, "officer editor must render only the screening summary when duplicate-closed");

// 11. Center merge order must close the case as duplicate-closed (no new dossier/outgoing numbers)
assert.match(js, /w\.stage='duplicate-closed';w\.status='เรื่องซ้ำ — รวมกับสำนวนเดิม \(ตามคำสั่ง ผอ\.ศรร\.\)'/, "center merge order must close the case as duplicate-closed");

// 12. Draft capture persists screening fields (linked case / note / additional info)
assert.match(js, /if\(activeRole==='admin'\|\|activeRole==='officer'\)\{const sc=d\.screening/, "capture() must persist screening draft fields");

// 13. Admin (ธุรการ) must NOT decide duplicates — initial check + opinion only, all channels
assert.match(js, /การตัดสินใจเรื่องใหม่\/เรื่องซ้ำเป็นของเจ้าหน้าที่รับเรื่อง/, "admin block must state the decision belongs to the intake officer");
assert.doesNotMatch(js, /function adminScreeningBlock[\s\S]{0,2500}screeningDecisionForm/, "admin block must not render the screening decision form");
assert.doesNotMatch(js, /function adminScreeningBlock[\s\S]{0,2500}screening-confirm/, "admin block must not render the screening confirm action");

// 14. Officer decides screening for EVERY channel (no channel gating)
assert.doesNotMatch(js, /function screeningSection[\s\S]{0,800}isOfficerScreenedChannel/, "officer screening section must apply to all channels");
assert.doesNotMatch(js, /isOfficerScreenedChannel\(state\.caseData\.channel\)/, "officer-send gate must apply to all channels (not only walk-in/1206)");
assert.match(js, /รอเจ้าหน้าที่กลั่นกรองเรื่องซ้ำ/, "post-assignment status must say the officer screens duplicates first");

console.log("PASS checklist-08-duplicate-screening.test.mjs: duplicate screening (suggest-only, human decides, original-number receipt) is in place");
