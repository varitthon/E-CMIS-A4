/* หน่วยทดสอบ TOR 10 — P10 (จำลองผลจากกิจกรรมที่ 7: bypass)
   - ECMIS_ACT7.isOn / setOn            สวิตช์ส่วนกลาง (ค่าตั้งต้น ON)
   - ACT7_LINKS                         ตั้งค่า 7 จุดเชื่อม (B1–B7)
   - buildAct7Patch                     ตรวจฟิลด์บังคับ + patch สถานะ/ผู้รับ/ประวัติ act7History
   - act7MismatchWarning                เตือนเมื่อมติไม่ตรงกับผลก่อนหน้า
   - isAct7Waiting / act7WaitInfo       สถานะที่รอกิจกรรมที่ 7
   - Activity103 (B7)                   L7_SENT_TO_PROSECUTOR → บันทึกผลศาลสูงสุด → L7_SUPREME_JUDGED
   Run: node activity10/tests/tor10-p10.test.mjs */
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const sandbox = {};
new Function("window", read("../assets/ecmis-activity10.js"))(sandbox);
new Function("window", read("../assets/ecmis-10-2.js"))(sandbox);
new Function("window", "Activity10", read("../assets/ecmis-10-3.js"))(
  sandbox,
  sandbox.Activity10,
);
new Function("window", read("../assets/ecmis-act7-bypass.js"))(sandbox);
const { Activity10: A, Activity103: A3, ACT7_LINKS, ECMIS_ACT7 } = sandbox;
const {
  buildAct7Patch,
  act7MismatchWarning,
  isAct7Waiting,
  act7WaitInfo,
} = sandbox.ECMIS_ACT7_HELPERS;

let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log("  ✓ " + name);
};
const AT = "2026-10-02T09:00:00.000Z";
const BY = "ธุรการกองกฎหมาย";

console.log("ECMIS_ACT7 switch");
t("ไม่มี localStorage → ค่าตั้งต้น ON", () => {
  assert.equal(ECMIS_ACT7.isOn(), true);
});
t("ไม่มีคีย์ → ON; เก็บ 0 → OFF; เก็บ 1 → ON", () => {
  const store = {};
  sandbox.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
  };
  assert.equal(ECMIS_ACT7.KEY, "ecmis_act7_bypass");
  assert.equal(ECMIS_ACT7.isOn(), true);
  ECMIS_ACT7.setOn(false);
  assert.equal(store.ecmis_act7_bypass, "0");
  assert.equal(ECMIS_ACT7.isOn(), false);
  ECMIS_ACT7.setOn(true);
  assert.equal(ECMIS_ACT7.isOn(), true);
});
t("localStorage พัง (throw) → ยัง ON ไม่ throw", () => {
  sandbox.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(ECMIS_ACT7.isOn(), true);
  assert.doesNotThrow(() => ECMIS_ACT7.setOn(false));
  delete sandbox.localStorage;
});
t("บทบาทที่เห็นสวิตช์ = ธุรการกองกฎหมาย / ธุรการกองบริหารคดี / ธุรการเขต", () => {
  ["admin_legal", "case_bureau_admin", "district_admin"].forEach((r) =>
    assert.equal(ECMIS_ACT7.canSeeSwitch(r), true, r),
  );
  assert.equal(ECMIS_ACT7.canSeeSwitch("Kanda.R"), true);
  ["dir_legal", "case_legal_officer", "secgen"].forEach((r) =>
    assert.equal(ECMIS_ACT7.canSeeSwitch(r), false, r),
  );
});

console.log("ACT7_LINKS config");
t("มี B1–B7 ครบ", () => {
  assert.deepEqual(Object.keys(ACT7_LINKS), ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]);
});
t("B1: ตัวเลือก AGREE/DISAGREE/OTHER, ฟิลด์บังคับ, ผู้ส่ง admin_legal, ไม่ผูกสวิตช์", () => {
  const l = ACT7_LINKS.B1;
  assert.deepEqual(l.options.map((o) => o.value), ["AGREE", "DISAGREE", "OTHER"]);
  assert.deepEqual(l.required, ["decision", "meetingNo", "meetingDate"]);
  assert.deepEqual(l.waitingStatuses, ["RETURNED_FROM_EXEC", "PENDING_FINAL_DISPATCH"]);
  assert.deepEqual(l.senderRoles, ["admin_legal"]);
  assert.equal(l.requiresSwitch, false);
});
t("B2: ตัวเลือกตาม RESOLUTION_TYPES, บังคับ เลขที่/วันที่หนังสือตอบ", () => {
  const l = ACT7_LINKS.B2;
  assert.deepEqual(l.options.map((o) => o.value), ["DISCLOSE", "PARTIAL", "DENY", "OTHER"]);
  assert.deepEqual(l.required, ["decision", "noticeNo", "noticeDate"]);
  assert.equal(l.requiresSwitch, false);
});
t("B3: ตัวเลือกเดียว 'มีมติมอบอำนาจ' + ฟิลด์บังคับครบ", () => {
  const l = ACT7_LINKS.B3;
  assert.deepEqual(l.options.map((o) => o.label), ["มีมติมอบอำนาจ"]);
  assert.deepEqual(l.required, [
    "decision", "meetingNo", "meetingDate", "agendaNo", "detail", "files",
    "noticeNo", "noticeDate", "lawyer",
  ]);
  assert.equal(l.requiresSwitch, false);
});
t("B4: ตัวเลือก DISCLOSE/PARTIAL/DENY, รอ L2_APPEAL_SUBMITTED_TO_BOARD, ผู้ส่ง 2 บทบาท, ผูกสวิตช์", () => {
  const l = ACT7_LINKS.B4;
  assert.deepEqual(l.options.map((o) => o.value), ["DISCLOSE", "PARTIAL", "DENY"]);
  assert.deepEqual(l.waitingStatuses, ["L2_APPEAL_SUBMITTED_TO_BOARD"]);
  assert.deepEqual(l.senderRoles, ["case_bureau_admin", "admin_legal"]);
  assert.deepEqual(l.required, ["decision", "noticeNo", "noticeDate"]);
  assert.equal(l.requiresSwitch, true);
});
t("B5: APPEAL/NO_APPEAL, รอ L9_PROPOSED_TO_BOARD, ผูกสวิตช์", () => {
  const l = ACT7_LINKS.B5;
  assert.deepEqual(l.options.map((o) => o.value), ["APPEAL", "NO_APPEAL"]);
  assert.deepEqual(l.waitingStatuses, ["L9_PROPOSED_TO_BOARD"]);
  assert.deepEqual(l.required, ["decision", "meetingNo", "meetingDate"]);
  assert.deepEqual(l.senderRoles, ["admin_legal"]);
  assert.equal(l.requiresSwitch, true);
});
t("B6: รอ L3_AWAITING_JUDGMENT, admin_legal, ผูกสวิตช์, ไม่ใช้ป๊อปอัป", () => {
  const l = ACT7_LINKS.B6;
  assert.deepEqual(l.waitingStatuses, ["L3_AWAITING_JUDGMENT"]);
  assert.deepEqual(l.senderRoles, ["admin_legal"]);
  assert.equal(l.requiresSwitch, true);
  assert.equal(l.popup, false);
});
t("B7: รอ L7_SENT_TO_PROSECUTOR, case_legal_officer, ไม่ผูกสวิตช์, ไม่ใช้ป๊อปอัป", () => {
  const l = ACT7_LINKS.B7;
  assert.deepEqual(l.waitingStatuses, ["L7_SENT_TO_PROSECUTOR"]);
  assert.deepEqual(l.senderRoles, ["case_legal_officer"]);
  assert.equal(l.requiresSwitch, false);
  assert.equal(l.popup, false);
});

console.log("buildAct7Patch — ฟิลด์บังคับ");
const missing = (id, kase, form, word) => {
  const r = buildAct7Patch(id, kase, form, BY, AT);
  assert.ok(r.error, id + " ควรมี error");
  assert.equal(r.patch, undefined);
  if (word) assert.ok(r.error.includes(word), r.error);
};
t("ลิงก์ที่ไม่รู้จัก → error", () => {
  assert.ok(buildAct7Patch("B9", {}, {}, BY, AT).error);
  assert.ok(buildAct7Patch("B6", {}, {}, BY, AT).error);
});
t("B1 ขาดมติ / ครั้งที่ประชุม / วันที่ประชุม / อื่นๆ ไม่ระบุ", () => {
  missing("B1", {}, { meetingNo: "1/2569", meetingDate: "2026-10-01" }, "มติ");
  missing("B1", {}, { decision: "AGREE", meetingDate: "2026-10-01" }, "ครั้งที่");
  missing("B1", {}, { decision: "AGREE", meetingNo: "1/2569" }, "วันที่ประชุม");
  missing("B1", {}, { decision: "OTHER", meetingNo: "1/2569", meetingDate: "2026-10-01" }, "อื่นๆ");
});
t("B2 ขาดเลขที่/วันที่หนังสือตอบ; มติไม่อยู่ในรายการ", () => {
  missing("B2", {}, { decision: "DENY", noticeDate: "2026-10-01" }, "เลขที่หนังสือ");
  missing("B2", {}, { decision: "DENY", noticeNo: "ปป 1/2" }, "วันที่หนังสือ");
  missing("B2", {}, { decision: "ZZZ", noticeNo: "ปป 1/2", noticeDate: "2026-10-01" }, "มติ");
});
t("B3 ขาดแต่ละฟิลด์บังคับ (รวมไฟล์ ≥ 1 และนิติกร)", () => {
  const ok = {
    decision: "AUTHORIZE", meetingNo: "41/2569", meetingDate: "2026-09-30",
    agendaNo: "5.41", detail: "มอบอำนาจ", fileNames: ["a.pdf"],
    noticeNo: "ปป 0003/4501", noticeDate: "2026-10-02", lawyer: "นายก",
  };
  assert.ok(buildAct7Patch("B3", {}, ok, BY, AT).patch);
  missing("B3", {}, { ...ok, agendaNo: "" }, "วาระ");
  missing("B3", {}, { ...ok, detail: "" }, "สาระสำคัญ");
  missing("B3", {}, { ...ok, fileNames: [] }, "ไฟล์");
  missing("B3", {}, { ...ok, lawyer: "" }, "นิติกร");
  missing("B3", {}, { ...ok, noticeNo: "" }, "เลขที่หนังสือ");
});
t("B4 ขาดเลขที่/วันที่หนังสือตอบ", () => {
  missing("B4", {}, { decision: "DENY", noticeDate: "2026-10-01" }, "เลขที่หนังสือ");
  missing("B4", {}, { decision: "DENY", noticeNo: "ปป 1/2" }, "วันที่หนังสือ");
});
t("B5 ขาดเลขที่มติ / วันที่ประชุม", () => {
  missing("B5", {}, { decision: "APPEAL", meetingDate: "2026-10-01" }, "เลขที่มติ");
  missing("B5", {}, { decision: "APPEAL", meetingNo: "12/2569" }, "วันที่ประชุม");
});
t("วันที่ที่กรอกแต่อ่านไม่ออก → error", () => {
  missing("B5", {}, { decision: "APPEAL", meetingNo: "1/2569", meetingDate: "ไม่ใช่วันที่" }, "วันที่");
});

console.log("buildAct7Patch — ผลลัพธ์รายจุดเชื่อม");
const historyOf = (patch) => patch.act7History[patch.act7History.length - 1];
t("B1 AGREE → PENDING_DIRECTOR_RESOLUTION/dir_legal, signedExecutiveOrder 'เห็นชอบให้ทำความเห็นแย้ง'", () => {
  const r = buildAct7Patch(
    "B1",
    { id: "คดี-1" },
    {
      decision: "AGREE", meetingNo: "14/2569", meetingDate: "12/08/2569",
      agendaNo: "5.2", detail: "เห็นชอบ", fileNames: ["m.pdf"],
      noticeNo: "ปป 0001/9", noticeDate: "2026-08-13",
    },
    BY, AT,
  );
  assert.ok(r.patch, r.error);
  const p = r.patch;
  assert.equal(p.boardResolutionType, "AGREE");
  assert.equal(p.boardMeetingNo, "14/2569");
  assert.equal(p.boardMeetingDate, "2026-08-12", "พ.ศ. dd/mm/yyyy → ISO ค.ศ.");
  assert.equal(p.boardAgendaNo, "5.2");
  assert.deepEqual(p.boardResolutionFiles, ["m.pdf"]);
  assert.equal(p.signedExecutiveOrder, "เห็นชอบให้ทำความเห็นแย้ง");
  assert.equal(p.boardNoticeDocNo, "ปป 0001/9");
  assert.equal(p.boardNoticeDate, "2026-08-13");
  assert.equal(p.statusCode, "PENDING_DIRECTOR_RESOLUTION");
  assert.equal(p.assignedRole, "dir_legal");
  assert.equal(r.advance, null);
  assert.equal(r.submit, "submitLegalAdminResolutionIntake");
});
t("B1 DISAGREE → 'ไม่เห็นชอบ'; OTHER → ข้อความที่ระบุ", () => {
  const base = { meetingNo: "1/2569", meetingDate: "2026-10-01" };
  const d = buildAct7Patch("B1", {}, { ...base, decision: "DISAGREE" }, BY, AT).patch;
  assert.equal(d.signedExecutiveOrder, "ไม่เห็นชอบ");
  const o = buildAct7Patch("B1", {}, { ...base, decision: "OTHER", other: "ให้พิจารณาใหม่" }, BY, AT).patch;
  assert.equal(o.signedExecutiveOrder, "ให้พิจารณาใหม่");
  assert.equal(o.boardResolutionOther, "ให้พิจารณาใหม่");
});
t("B2 → ฟิลด์ l2 รอบ 2 + advance L2-RECEIVE-BOARD-ROUND2 → dir_legal", () => {
  const r = buildAct7Patch(
    "B2",
    { id: "REQ-1", l2ResolutionType: "DENY" },
    {
      decision: "DENY", noticeNo: "ปป 0001/ว.145", noticeDate: "2026-10-01",
      detail: "", fileNames: ["x.pdf", "y.pdf"], notes: "หมายเหตุ",
    },
    BY, AT,
  );
  assert.ok(r.patch, r.error);
  const p = r.patch;
  assert.equal(p.l2BoardApprovalRefRound2, "ปป 0001/ว.145");
  assert.equal(p.l2BoardApprovalDateRound2, "2026-10-01");
  assert.equal(p.l2BoardResolutionRound2Type, "DENY");
  assert.equal(p.l2BoardResolutionRound2TypeName, "ไม่อนุญาตเปิดเผย");
  assert.equal(p.l2BoardResolutionRound2Text, "ไม่อนุญาตเปิดเผย", "ไม่กรอกรายละเอียด → ใช้ชื่อมติ");
  assert.deepEqual(p.l2BoardRound2Files, ["x.pdf", "y.pdf"]);
  assert.equal(p.l2ReceiveNotesRound2, "หมายเหตุ");
  assert.equal(p.assignedRole, "dir_legal");
  assert.deepEqual(r.advance, { module: "Activity102", stepCode: "L2-RECEIVE-BOARD-ROUND2" });
  const withText = buildAct7Patch("B2", {}, { decision: "OTHER", noticeNo: "a", noticeDate: "2026-10-01", detail: "รายละเอียด" }, BY, AT).patch;
  assert.equal(withText.l2BoardResolutionRound2Text, "รายละเอียด");
});
t("B3 → l3BoardResolution + l3ResolutionNotice + docNo, advance L3-19 → dir_legal", () => {
  const r = buildAct7Patch(
    "B3",
    { id: "คดี-3" },
    {
      decision: "AUTHORIZE", meetingNo: "41/2569", meetingDate: "2026-09-30",
      agendaNo: "5.41", detail: "มอบอำนาจ ผอ.กอง", fileNames: ["r.pdf"],
      noticeNo: "ปป 0003/4501", noticeDate: "2026-10-02", lawyer: "นายก (นิติกร)", notes: "",
    },
    BY, AT,
  );
  assert.ok(r.patch, r.error);
  const p = r.patch;
  assert.deepEqual(p.l3BoardResolution, {
    meetingNo: "41/2569", meetingDate: "2026-09-30", agendaNo: "5.41",
    result: "มีมติมอบอำนาจ", text: "มอบอำนาจ ผอ.กอง", reportFileNames: ["r.pdf"],
  });
  assert.equal(p.l3ResolutionNotice.docNo, "ปป 0003/4501");
  assert.equal(p.l3ResolutionNotice.docDate, "2026-10-02");
  assert.deepEqual(p.l3ResolutionNotice.recipients, [
    { role: "case_legal_officer", label: "นิติกร กลุ่มงานคดี", name: "นายก (นิติกร)" },
  ]);
  assert.equal(p.l3ResolutionNotice.notifiedBy, BY);
  assert.equal(p.l3ResolutionNotice.notes, "-");
  assert.equal(p.l3ResolutionNotice.acknowledgedBy, null);
  assert.equal(p.l3ResolutionNoticeDocNo, "ปป 0003/4501");
  assert.equal(p.assignedRole, "dir_legal");
  assert.deepEqual(r.advance, { module: "Activity103", stepCode: "L3-19" });
});
t("B4 → มติอุทธรณ์ + L2_PENDING_APPEAL_NOTICE_DRAFT/case_tracking_secretary", () => {
  const r = buildAct7Patch(
    "B4",
    { id: "REQ-9", l2AppealRulingType: "UPHOLD" },
    { decision: "DENY", noticeNo: "ปป 0002/5312", noticeDate: "10/02/2026", detail: "", fileNames: ["b.pdf"] },
    BY, AT,
  );
  assert.ok(r.patch, r.error);
  const p = r.patch;
  assert.equal(p.l2AppealBoardResolutionType, "DENY");
  assert.equal(p.l2AppealBoardResolutionTypeName, "ไม่เปิดเผยข้อมูล");
  assert.equal(p.l2AppealBoardReplyDocNo, "ปป 0002/5312");
  assert.equal(p.l2AppealBoardReplyDate, "2026-02-10", "dd/mm/yyyy ค.ศ. → ISO");
  assert.equal(p.l2AppealBoardResolutionNotes, "-");
  assert.equal(p.statusCode, "L2_PENDING_APPEAL_NOTICE_DRAFT");
  assert.equal(p.status, "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ");
  assert.equal(p.assignedRole, "case_tracking_secretary");
  assert.equal(r.advance, null);
});
t("B5 APPEAL → L9_BOARD_APPROVED_APPEAL; NO_APPEAL → L9_BOARD_APPROVED_NO_APPEAL (admin_legal)", () => {
  const a = buildAct7Patch(
    "B5", { id: "คดี-5" },
    { decision: "APPEAL", meetingNo: "มติที่ 12/2569", meetingDate: "2026-09-25", detail: "เห็นชอบอุทธรณ์" },
    BY, AT,
  ).patch;
  assert.equal(a.l9BoardDecision, "APPEAL");
  assert.equal(a.l9BoardResolutionNo, "มติที่ 12/2569");
  assert.equal(a.l9BoardMeetingDate, "2026-09-25");
  assert.equal(a.l9BoardNotes, "เห็นชอบอุทธรณ์");
  assert.equal(a.statusCode, "L9_BOARD_APPROVED_APPEAL");
  assert.equal(a.status, "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์");
  assert.equal(a.assignedRole, "admin_legal");
  const n = buildAct7Patch(
    "B5", {},
    { decision: "NO_APPEAL", meetingNo: "13/2569", meetingDate: "2026-09-26" },
    BY, AT,
  ).patch;
  assert.equal(n.statusCode, "L9_BOARD_APPROVED_NO_APPEAL");
  assert.equal(n.status, "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์");
  assert.equal(n.l9BoardNotes, "-");
});
t("ทุกจุดเชื่อมต่อท้าย act7History {at,by,linkId,decision,bypass:true} ไม่แก้ array เดิม", () => {
  const prev = [{ at: "x", by: "y", linkId: "B5", decision: "APPEAL", bypass: true }];
  const kase = { id: "k", act7History: prev };
  const p = buildAct7Patch(
    "B5", kase,
    { decision: "NO_APPEAL", meetingNo: "1/1", meetingDate: "2026-10-01" },
    BY, AT,
  ).patch;
  assert.equal(p.act7History.length, 2);
  assert.equal(prev.length, 1, "array เดิมไม่ถูกแก้");
  assert.deepEqual(historyOf(p), {
    at: AT, by: BY, linkId: "B5", decision: "NO_APPEAL", bypass: true,
  });
});
t("วันที่ทุกชนิดถูกเก็บเป็น ISO (ว่าง → สตริงว่าง)", () => {
  const p = buildAct7Patch(
    "B5", {},
    { decision: "APPEAL", meetingNo: "1/1", meetingDate: "25/09/2569" },
    BY, AT,
  ).patch;
  assert.equal(p.l9BoardMeetingDate, "2026-09-25");
  const q = buildAct7Patch("B1", {}, { decision: "AGREE", meetingNo: "1/1", meetingDate: "2026-10-01", noticeDate: "" }, BY, AT).patch;
  assert.equal(q.boardNoticeDate, "");
});

console.log("act7MismatchWarning");
t("B2: มติไม่ตรง l2ResolutionType → เตือน; ตรง/ไม่มีค่าเดิม → ไม่เตือน", () => {
  assert.ok(act7MismatchWarning("B2", { l2ResolutionType: "DENY" }, "DISCLOSE"));
  assert.equal(act7MismatchWarning("B2", { l2ResolutionType: "DENY" }, "DENY"), "");
  assert.equal(act7MismatchWarning("B2", {}, "DENY"), "");
});
t("B4: ผลวินิจฉัยอุทธรณ์ UPHOLD↔DENY, REVERSE_FULL↔DISCLOSE, REVERSE_PARTIAL↔PARTIAL", () => {
  assert.equal(act7MismatchWarning("B4", { l2AppealRulingType: "UPHOLD" }, "DENY"), "");
  assert.ok(act7MismatchWarning("B4", { l2AppealRulingType: "UPHOLD" }, "DISCLOSE"));
  assert.equal(act7MismatchWarning("B4", { l2AppealRulingType: "REVERSE_FULL" }, "DISCLOSE"), "");
  assert.ok(act7MismatchWarning("B4", { l2AppealRulingType: "REVERSE_FULL" }, "PARTIAL"));
  assert.equal(act7MismatchWarning("B4", { l2AppealRulingType: "REVERSE_PARTIAL" }, "PARTIAL"), "");
  assert.equal(act7MismatchWarning("B4", {}, "DENY"), "");
});
t("จุดเชื่อมอื่น/ไม่ระบุมติ → ไม่เตือน", () => {
  assert.equal(act7MismatchWarning("B1", {}, "AGREE"), "");
  assert.equal(act7MismatchWarning("B5", {}, "APPEAL"), "");
  assert.equal(act7MismatchWarning("B2", { l2ResolutionType: "DENY" }, ""), "");
});

console.log("isAct7Waiting / act7WaitInfo");
t("B4/B5/B6 ที่รอ → true; ป้ายตามจุดเชื่อม", () => {
  assert.equal(isAct7Waiting({ statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD" }), true);
  assert.equal(isAct7Waiting({ statusCode: "L9_PROPOSED_TO_BOARD" }), true);
  assert.equal(isAct7Waiting({ statusCode: "L3_AWAITING_JUDGMENT" }), true);
  assert.equal(act7WaitInfo({ statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD" }).linkId, "B4");
  assert.equal(act7WaitInfo({ statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD" }).badge, "ระหว่างรอกิจกรรมที่ 7");
  assert.equal(act7WaitInfo({ statusCode: "L9_PROPOSED_TO_BOARD" }).badge, "ระหว่างรอกิจกรรมที่ 7");
  assert.equal(act7WaitInfo({ statusCode: "L3_AWAITING_JUDGMENT" }).linkId, "B6");
  assert.equal(act7WaitInfo({ statusCode: "L3_AWAITING_JUDGMENT" }).badge, "รอศาลมีคำพิพากษา");
});
t("สถานะอื่น (รวม B1–B3, B7) / null → false", () => {
  ["RETURNED_FROM_EXEC", "L2_READY_FOR_BOARD_ROUND2", "L3_READY_FOR_BOARD", "L7_SENT_TO_PROSECUTOR", ""].forEach((s) => {
    assert.equal(isAct7Waiting({ statusCode: s }), false, s);
    assert.equal(act7WaitInfo({ statusCode: s }), null, s);
  });
  assert.equal(isAct7Waiting(null), false);
});

console.log("Activity10.signedOrderDisplay (หน้า 13–16: ต่อ 'ให้ทำความเห็นแย้ง' เฉพาะ AGREE)");
t("เคสเดิม 'เห็นชอบ' (ไม่มี boardResolutionType) / AGREE → ต่อท้าย", () => {
  assert.equal(A.signedOrderDisplay({ signedExecutiveOrder: "เห็นชอบ" }), "เห็นชอบให้ทำความเห็นแย้ง");
  assert.equal(
    A.signedOrderDisplay({ signedExecutiveOrder: "เห็นชอบ", boardResolutionType: "AGREE" }),
    "เห็นชอบให้ทำความเห็นแย้ง",
  );
});
t("ข้อความมี 'ความเห็นแย้ง' แล้ว → ไม่ต่อซ้ำ", () => {
  assert.equal(
    A.signedOrderDisplay({ signedExecutiveOrder: "เห็นชอบให้ทำความเห็นแย้ง", boardResolutionType: "AGREE" }),
    "เห็นชอบให้ทำความเห็นแย้ง",
  );
});
t("DISAGREE / OTHER → แสดงข้อความจริง ไม่ต่อท้าย; ว่าง → สตริงว่าง", () => {
  assert.equal(A.signedOrderDisplay({ signedExecutiveOrder: "ไม่เห็นชอบ", boardResolutionType: "DISAGREE" }), "ไม่เห็นชอบ");
  assert.equal(A.signedOrderDisplay({ signedExecutiveOrder: "ให้พิจารณาใหม่", boardResolutionType: "OTHER" }), "ให้พิจารณาใหม่");
  assert.equal(A.signedOrderDisplay({}), "");
  assert.equal(A.signedOrderDisplay(null), "");
});
t("suffix กำหนดเองได้ (หน้า 13 ท่อนความเห็นสุดท้าย)", () => {
  assert.equal(
    A.signedOrderDisplay({ signedExecutiveOrder: "เห็นชอบ" }, "ให้ทำความเห็นแย้งคำสั่งไม่ฟ้อง"),
    "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้อง",
  );
});

console.log("act7CanAct / act7InboxAction (ปุ่มใน inbox)");
const { act7CanAct, act7InboxAction } = sandbox.ECMIS_ACT7_HELPERS;
t("B4–B6 ต้องเปิดสวิตช์ + เป็นบทบาทผู้ส่ง; B1–B3, B7 ไม่ขึ้นกับสวิตช์", () => {
  assert.equal(act7CanAct("B4", "case_bureau_admin", true), true);
  assert.equal(act7CanAct("B4", "admin_legal", true), true);
  assert.equal(act7CanAct("B4", "admin_legal", false), false);
  assert.equal(act7CanAct("B4", "dir_legal", true), false);
  assert.equal(act7CanAct("B5", "Kanda.R", true), true);
  assert.equal(act7CanAct("B6", "case_bureau_admin", true), false);
  assert.equal(act7CanAct("B1", "admin_legal", false), true);
  assert.equal(act7CanAct("B7", "case_legal_officer", false), true);
});
t("แถวรอกิจกรรมที่ 7: สวิตช์ ON + ผู้ส่ง → popup (B4/B5) / page (B6); OFF → null", () => {
  assert.deepEqual(
    act7InboxAction({ statusCode: "L2_APPEAL_SUBMITTED_TO_BOARD" }, "case_bureau_admin", true),
    { linkId: "B4", kind: "popup" },
  );
  assert.deepEqual(
    act7InboxAction({ statusCode: "L9_PROPOSED_TO_BOARD" }, "admin_legal", true),
    { linkId: "B5", kind: "popup" },
  );
  assert.deepEqual(
    act7InboxAction({ statusCode: "L3_AWAITING_JUDGMENT" }, "admin_legal", true),
    { linkId: "B6", kind: "page" },
  );
  assert.equal(act7InboxAction({ statusCode: "L9_PROPOSED_TO_BOARD" }, "admin_legal", false), null);
  assert.equal(act7InboxAction({ statusCode: "L9_PROPOSED_TO_BOARD" }, "dir_legal", true), null);
  assert.equal(act7InboxAction({ statusCode: "RETURNED_FROM_EXEC" }, "admin_legal", true), null);
});

console.log("B7 — ผลศาลปกครองสูงสุดหลัง Part 7 (L7_SENT_TO_PROSECUTOR)");
t("ROUTES: L7_SENT_TO_PROSECUTOR → 10-3v-15", () => {
  assert.equal(A3.ROUTES.L7_SENT_TO_PROSECUTOR, "10-3v-15-lawyer-send-appeal-reply.html");
});
t("buildSupremeJudgmentPatch: L7_SENT_TO_PROSECUTOR → L7_SUPREME_JUDGED + FINAL", () => {
  const p = A3.buildSupremeJudgmentPatch(
    { statusCode: "L7_SENT_TO_PROSECUTOR", caseStatus: "SUPREME_PENDING" },
    { date: "2026-10-01", blackNo: "อ.1/2570", redNo: "อ.2/2570", result: "WIN", summary: "ชนะ", fileNames: ["j.pdf"] },
    BY, AT,
  );
  assert.equal(p.statusCode, "L7_SUPREME_JUDGED");
  assert.equal(p.caseStatus, "FINAL");
  assert.equal(p.l3SupremeJudgment.resultName, "ชนะคดี");
});
t("defaultStatusPatch(L7_SUPREME_JUDGED) → FINAL; VIEW_ROUTES มีรายการ", () => {
  assert.equal(A3.defaultStatusPatch("L7_SUPREME_JUDGED", {}).caseStatus, "FINAL");
  assert.equal(A3.VIEW_ROUTES.L7_SUPREME_JUDGED, "10-3v-15-lawyer-send-appeal-reply.html");
});
t("ขั้นตอนตัวเดิม (L10/L9A) ไม่เปลี่ยน", () => {
  assert.equal(
    A3.buildSupremeJudgmentPatch({ statusCode: "L10_SENT_TO_PROSECUTOR" }, { result: "WIN" }, BY, AT).statusCode,
    "L10_SUPREME_JUDGED",
  );
  assert.equal(
    A3.buildSupremeJudgmentPatch({ statusCode: "L9A_SENT_TO_PROSECUTOR" }, { result: "WIN" }, BY, AT).statusCode,
    "L9A_SUPREME_JUDGED",
  );
});

console.log("\n" + passed + " passed");
