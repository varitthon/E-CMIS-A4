import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

class LocalStorageMock {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
  clear() { this.#values.clear(); }
}

globalThis.localStorage = new LocalStorageMock();
await import("../assets/activity5-handoff.js");
const bridge = globalThis.ECMISActivity5Handoff;

function dispatchedState(decision, overrides = {}) {
  return {
    caseData: {
      id: overrides.id || `ECMIS-${decision}`,
      received: "3 สิงหาคม 2569 09:10 น.",
      subject: "ร้องเรียนการจัดซื้อ",
      complainant: "นายสมชาย ใจดี",
      agency: "สำนักงานตัวอย่าง",
      region: "เขต 2"
    },
    documentData: {
      decision,
      anonymous: Boolean(overrides.anonymous),
      approvedAt: "2026-08-04T08:00:00+07:00",
      approvedBy: overrides.approvedBy || "ผอ.กบค.",
      actingOrder: overrides.actingOrder || "",
      dispatchConfirmedAt: "2026-08-04T09:00:00+07:00",
      dispatchLetterNo: "ปป 0012/2569",
      dispatchLetterDate: "2026-08-04",
      dispatchSendMethod: "EMS",
      dispatchEms: "ED123456789TH",
      dispatchSentDate: "2026-08-04",
      dispatchDestinationUnit: "เขต 2"
    },
    workflow: { stage: overrides.stage || "activity5-dispatch", complete: overrides.complete ?? true },
    documentVersions: [{ version: 1 }]
  };
}

for (const decision of ["18/1ก", "18/1ข", "18/4"]) {
  const source = dispatchedState(decision);
  const first = bridge.create(localStorage, source, "2026-08-04T09:00:00+07:00", "officer");
  const replay = bridge.create(localStorage, source, "2026-08-04T10:00:00+07:00", "officer");
  assert.equal(first.created, true, `${decision} must create a handoff`);
  assert.equal(replay.created, false, `${decision} replay must be idempotent`);
  assert.equal(replay.handoff.handoffId, first.handoff.handoffId);
  assert.equal(first.handoff.receivedDate, source.caseData.received);
  assert.equal(first.handoff.title, source.caseData.subject);
  assert.equal(first.handoff.complainant, source.caseData.complainant);
  assert.equal(first.handoff.agency, source.caseData.agency);
  assert.equal(first.handoff.unit, source.caseData.region);
  assert.equal(first.handoff.sourceReference, source.caseData.id);
  assert.equal(first.handoff.outgoingLetterNo, source.documentData.dispatchLetterNo);
  assert.equal(first.handoff.emsTrackingNo, source.documentData.dispatchEms);
  assert.equal(first.handoff.destinationUnit, source.documentData.dispatchDestinationUnit);
}

for (const rejected of [
  dispatchedState("58/2"),
  dispatchedState("send-nacc"),
  dispatchedState("not-accept", { anonymous: true }),
  dispatchedState("18/1ก", { id: "NOT-COMPLETE", complete: false }),
  dispatchedState("18/1ก", { id: "APPROVED-ONLY", stage: "officer-dispatch", complete: false })
]) {
  const result = bridge.create(localStorage, rejected, "2026-08-04T09:00:00+07:00", "officer");
  assert.equal(result.eligible, false);
}

const actingState = dispatchedState("18/4", { id: "ACTING", approvedBy: "ผู้รักษาราชการแทนตามคำสั่ง", actingOrder: "คำสั่งที่ 12/2569 ลงวันที่ 4 สิงหาคม 2569" });
const storeWithLegacyHandoff = bridge.read(localStorage);
storeWithLegacyHandoff.records.ACTING = { handoffId: "activity4:ACTING:activity5", activity5CaseId: "A5-ACTING", sourceReference: "ACTING" };
localStorage.setItem(bridge.STORAGE_KEY, JSON.stringify(storeWithLegacyHandoff));
const actingResult = bridge.create(localStorage, actingState, "2026-08-04T09:00:00+07:00", "officer");
assert.equal(actingResult.eligible, true);
assert.equal(actingResult.created, true);
assert.equal(actingResult.handoff.approvedBy, "ผู้รักษาราชการแทนตามคำสั่ง");
assert.equal(actingResult.handoff.appointmentOrder, actingState.documentData.actingOrder);
assert.equal(actingResult.handoff.outgoingLetterNo, actingState.documentData.dispatchLetterNo, "legacy handoff must be upgraded with dispatch evidence");
assert.equal(actingResult.handoff.dispatchedAt, "2026-08-04T09:00:00+07:00");

const bridgeStore = bridge.read(localStorage);
assert.equal(Object.keys(bridgeStore.records).length, 4, "only eligible unique Activity 4 cases must be queued");

const staffHtml = readFileSync(new URL("../staff-workflow.html", import.meta.url), "utf8");
const activity4Source = readFileSync(new URL("../assets/activity4-workspace.js", import.meta.url), "utf8");
const activity5Html = readFileSync(new URL("../activity5/index.html", import.meta.url), "utf8");
assert.ok(staffHtml.indexOf("assets/activity5-handoff.js") < staffHtml.indexOf("assets/activity4-workspace.js"));
assert.match(activity4Source, /ECMISActivity5Handoff\?\.create\(localStorage,state/);
assert.doesNotMatch(activity4Source, /create\(localStorage,state,new Date\(\)\.toISOString\(\),activeRole/);
assert.match(activity4Source, /w\.stage='officer-dispatch';w\.status='อนุมัติแล้ว รอเจ้าหน้าที่รับเรื่อง ศรร\. บันทึกข้อมูลการจัดส่ง';w\.complete=false/);
assert.match(activity4Source, /state\.workflow\.stage!=='activity5-dispatch'\|\|!state\.workflow\.complete/);
assert.match(activity4Source, /state\.workflow\.status=`จัดส่งเรื่องไปยัง \$\{d\.dispatchDestinationUnit\} แล้ว`/);
assert.doesNotMatch(activity4Source, /workflow\.status='ส่งต่อกิจกรรมที่ 5 แล้ว'/);
assert.match(activity4Source, /ยืนยันการจัดส่งเรียบร้อยแล้ว/);
assert.match(activity4Source, /window\.EXMIS&&window\.EXMIS\.showA5\('/);
assert.match(activity5Html, /กลับ Activity 4/);
assert.match(activity5Html, /localStorage ของเบราว์เซอร์ ไม่ใช่ production backend/);

const storeWithUndispatchedLegacy = bridge.read(localStorage);
storeWithUndispatchedLegacy.records.LEGACY = { handoffId: "activity4:LEGACY:activity5", activity5CaseId: "A5-LEGACY", sourceReference: "LEGACY", sourceDecision: "18/1ก" };
localStorage.setItem(bridge.STORAGE_KEY, JSON.stringify(storeWithUndispatchedLegacy));
localStorage.removeItem("activity5-mockup-state-v4");
const stateApi = await import(`../activity5/assets/state.js?handoff=${Date.now()}`);
const imported = stateApi.getState().cases.filter((item) => item.activity4HandoffId);
assert.equal(imported.length, 4);
for (const item of imported) {
  const source = bridgeStore.records[item.sourceReference];
  assert.equal(item.referenceNo, source.sourceReference);
  assert.equal(item.sourceReceivedDate, source.receivedDate);
  assert.equal(item.title, source.title);
  assert.equal(item.complainant, source.complainant);
  assert.equal(item.agency, source.agency);
  assert.equal(item.sourceUnit, source.unit);
  assert.ok(item.report213, "ordinary imported cases must retain the 213 workflow");
  assert.ok(item.report644, "ordinary imported cases must retain the 644 workflow");
}
assert.equal(imported.some((item) => item.sourceDecision === "58/2"), false);
assert.equal(imported.some((item) => item.sourceReference === "LEGACY"), false, "undispatched legacy handoff must not enter Activity 5");

const beforeReload = stateApi.getState().cases.length;
const reloadedApi = await import(`../activity5/assets/state.js?handoff-reload=${Date.now()}`);
assert.equal(reloadedApi.getState().cases.length, beforeReload, "Activity 5 import must not duplicate cases on reload");

console.log("PASS activity5-handoff.test.mjs: eligible branches, preservation and idempotency");
