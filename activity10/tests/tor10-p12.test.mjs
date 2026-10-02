/* หน่วยทดสอบ TOR 10 — P12 (ป๊อปอัปผลจากกิจกรรมที่ 7 หลังขั้นตอนขาออก)
   - shouldPromptAfterOutbound(linkId)  เปิดป๊อปอัปเฉพาะ B1–B5 เมื่อสวิตช์ ON (B6/B7 ไม่เปิด)
   - buildAct7Patch(..., {stage:"outbound"}) B1 บันทึกผลมติแต่คงสถานะ RETURNED_FROM_EXEC
   - สถานะขาออก → ขาเข้า รายจุดเชื่อม (บันทึกผลทันที vs ภายหลัง)
   - Activity10.signExecutiveDocRound1 ไม่เขียนผลมติตายตัวอีกต่อไป
   Run: node activity10/tests/tor10-p12.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = { localStorage: globalThis.localStorage };
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-10-2.js"))(sandbox);
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(
  sandbox,
  sandbox.Activity10,
);
new Function("window", read("../assets/ecmis-act7-bypass.js"))(sandbox);
const { Activity10: A, Activity102: A2, Activity103: A3, ECMIS_ACT7 } = sandbox;
const { buildAct7Patch, shouldPromptAfterOutbound, act7OutboundStages } =
  sandbox.ECMIS_ACT7_HELPERS;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};
const AT = "2026-10-02T09:00:00.000Z";
const SENDER = "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";

console.log("shouldPromptAfterOutbound");
t("สวิตช์ ON: B1–B5 เปิดป๊อปอัป", () => {
  ECMIS_ACT7.setOn(true);
  ["B1", "B2", "B3", "B4", "B5"].forEach((id) =>
    assert.equal(shouldPromptAfterOutbound(id), true, id),
  );
});
t("B6/B7 (ศาล) และจุดเชื่อมที่ไม่มีอยู่ ไม่เปิดป๊อปอัปแม้สวิตช์ ON", () => {
  ECMIS_ACT7.setOn(true);
  ["B6", "B7", "B9", "", undefined].forEach((id) =>
    assert.equal(shouldPromptAfterOutbound(id), false, String(id)),
  );
});
t("สวิตช์ OFF: ไม่มีป๊อปอัปเลย", () => {
  ECMIS_ACT7.setOn(false);
  ["B1", "B2", "B3", "B4", "B5", "B6", "B7"].forEach((id) =>
    assert.equal(shouldPromptAfterOutbound(id), false, id),
  );
  ECMIS_ACT7.setOn(true);
});

console.log("สถานะขาออก → ขาเข้า รายจุดเชื่อม");
t("act7OutboundStages: สถานะที่ค้างรอ (ภายหลัง) ตรงกับ waitingStatuses ของจุดเชื่อม", () => {
  assert.equal(act7OutboundStages("B1").later, "RETURNED_FROM_EXEC");
  assert.equal(act7OutboundStages("B2").later, "L2_READY_FOR_BOARD_ROUND2");
  assert.equal(act7OutboundStages("B3").later, "L3_READY_FOR_BOARD");
  assert.equal(act7OutboundStages("B4").later, "L2_APPEAL_SUBMITTED_TO_BOARD");
  assert.equal(act7OutboundStages("B5").later, "L9_PROPOSED_TO_BOARD");
  assert.equal(act7OutboundStages("B6"), null);
});
t("B1 บันทึกผลทันที: คงสถานะ RETURNED_FROM_EXEC (ธุรการยังรับที่หน้า 10) แต่เติมผลมติ", () => {
  const r = buildAct7Patch(
    "B1",
    { id: "k1", statusCode: "RETURNED_FROM_EXEC" },
    {
      decision: "AGREE", meetingNo: "14/2569", meetingDate: "2026-08-12",
      agendaNo: "5.2", detail: "เห็นชอบ", fileNames: ["m.pdf"],
    },
    SENDER, AT, { stage: "outbound" },
  );
  assert.ok(r.patch, r.error);
  const p = r.patch;
  assert.equal(p.boardResolutionType, "AGREE");
  assert.equal(p.boardMeetingNo, "14/2569");
  assert.equal(p.signedExecutiveOrder, "เห็นชอบให้ทำความเห็นแย้ง");
  assert.equal("statusCode" in p, false, "ไม่เปลี่ยนสถานะ");
  assert.equal("assignedRole" in p, false, "ไม่เปลี่ยนผู้รับ");
  assert.equal(r.submit, null, "ไม่ส่งต่อ ผอ. เอง — ธุรการส่งต่อที่หน้า 10");
  assert.equal(p.act7History[0].by, SENDER, "ประวัติเก็บชื่อผู้ส่ง");
  assert.equal(p.act7History[0].bypass, true);
});
t("B1 ขาเข้า (ไม่ระบุ stage) ยังเปลี่ยนเป็น PENDING_DIRECTOR_RESOLUTION เหมือนเดิม", () => {
  const r = buildAct7Patch(
    "B1", {},
    { decision: "AGREE", meetingNo: "1/2569", meetingDate: "2026-08-12" },
    SENDER, AT,
  );
  assert.equal(r.patch.statusCode, "PENDING_DIRECTOR_RESOLUTION");
  assert.equal(r.submit, "submitLegalAdminResolutionIntake");
});
t("B2 บันทึกผลทันที: advance L2-RECEIVE-BOARD-ROUND2 → L2_PENDING_DIRLEGAL_BOARD_ACK", () => {
  const r = buildAct7Patch(
    "B2", {},
    { decision: "DENY", noticeNo: "ปป 1/2", noticeDate: "2026-10-01" },
    SENDER, AT, { stage: "outbound" },
  );
  assert.deepEqual(r.advance, { module: "Activity102", stepCode: "L2-RECEIVE-BOARD-ROUND2" });
  assert.equal(A2.stepByCode("L2-RECEIVE-BOARD-ROUND2").statusCode, "L2_PENDING_DIRLEGAL_BOARD_ACK");
  assert.equal(act7OutboundStages("B2").now, "L2_PENDING_DIRLEGAL_BOARD_ACK");
});
t("B3 บันทึกผลทันที: advance L3-19 → L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN, ไม่บังคับลายเซ็น", () => {
  const r = buildAct7Patch(
    "B3", {},
    {
      decision: "AUTHORIZE", meetingNo: "41/2569", meetingDate: "2026-09-30", agendaNo: "5.41",
      detail: "มอบอำนาจ", fileNames: ["r.pdf"], noticeNo: "ปป 0003/4501",
      noticeDate: "2026-10-02", lawyer: "นายก",
    },
    SENDER, AT, { stage: "outbound" },
  );
  assert.deepEqual(r.advance, { module: "Activity103", stepCode: "L3-19" });
  assert.equal(r.skipSignature, true, "outbound: ข้ามลายเซ็นธุรการ (ลงนามที่ 10-3-10 ได้ภายหลัง)");
  assert.equal(A3.stepByCode("L3-19").statusCode, "L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN");
  assert.equal(act7OutboundStages("B3").now, "L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN");
});
t("B3 ขาเข้า (ไม่ระบุ stage) ไม่ข้ามลายเซ็น", () => {
  const r = buildAct7Patch(
    "B3", {},
    {
      decision: "AUTHORIZE", meetingNo: "1", meetingDate: "2026-09-30", agendaNo: "1",
      detail: "x", fileNames: ["r.pdf"], noticeNo: "n", noticeDate: "2026-10-02", lawyer: "นายก",
    },
    SENDER, AT,
  );
  assert.equal(!!r.skipSignature, false);
});
t("B4 บันทึกผลทันที → L2_PENDING_APPEAL_NOTICE_DRAFT", () => {
  const r = buildAct7Patch(
    "B4", {},
    { decision: "DENY", noticeNo: "ปป 2/5", noticeDate: "2026-10-01" },
    SENDER, AT, { stage: "outbound" },
  );
  assert.equal(r.patch.statusCode, "L2_PENDING_APPEAL_NOTICE_DRAFT");
  assert.equal(act7OutboundStages("B4").now, "L2_PENDING_APPEAL_NOTICE_DRAFT");
});
t("B5 บันทึกผลทันที → L9_BOARD_APPROVED_APPEAL / _NO_APPEAL", () => {
  const a = buildAct7Patch(
    "B5", {}, { decision: "APPEAL", meetingNo: "1/2569", meetingDate: "2026-09-25" },
    SENDER, AT, { stage: "outbound" },
  ).patch;
  const n = buildAct7Patch(
    "B5", {}, { decision: "NO_APPEAL", meetingNo: "2/2569", meetingDate: "2026-09-25" },
    SENDER, AT, { stage: "outbound" },
  ).patch;
  assert.equal(a.statusCode, "L9_BOARD_APPROVED_APPEAL");
  assert.equal(n.statusCode, "L9_BOARD_APPROVED_NO_APPEAL");
  assert.equal(act7OutboundStages("B5").now, "L9_BOARD_APPROVED_APPEAL");
});

console.log("Activity10.signExecutiveDocRound1 (B1 ขาออก)");
t("ไม่เขียนผลมติตายตัว (14/2569 / เห็นชอบ / หนังสือผลมติ) อีกต่อไป", () => {
  const seed = A.getCases().find(
    (c) => !c.boardResolution && !c.boardMeetingNo && !c.signedExecutiveOrder && !c.signedDocFile,
  );
  assert.ok(seed, "ต้องมีเคสตัวอย่างที่ยังไม่มีมติ");
  const out = A.signExecutiveDocRound1(seed.id);
  assert.equal(out.statusCode, "RETURNED_FROM_EXEC");
  assert.equal(out.assignedRole, "admin_legal");
  assert.ok(out.signedBy && out.signedDate, "เก็บผู้ลงนามและวันที่");
  ["boardResolution", "boardResolutionDetail", "boardMeetingNo", "boardMeetingDate",
    "signedExecutiveOrder", "signedDocFile"].forEach((k) =>
    assert.ok(!out[k], k + " ต้องว่าง"),
  );
  assert.equal(A.isChiMoonCase(A.findCaseById(seed.id)), false, "ยังไม่ใช่สำนวนชี้มูลจนกว่าจะบันทึกมติ");
});
t("เคสที่มีมติเดิม (seed/บันทึกแล้ว) ยังคงค่าเดิมหลังลงนาม", () => {
  const seed = A.getCases().find((c) => c.boardMeetingNo && c.boardResolution);
  assert.ok(seed);
  const before = { no: seed.boardMeetingNo, res: seed.boardResolution };
  const out = A.signExecutiveDocRound1(seed.id);
  assert.equal(out.boardMeetingNo, before.no);
  assert.equal(out.boardResolution, before.res);
});

console.log("\n" + passed + " passed");
