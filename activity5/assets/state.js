import {
  ACCOUNTS,
  INVESTIGATOR_DIRECTORY,
  ROLE_PERMISSIONS,
  TRANSFER_TARGETS,
  createImportedActivity4Case,
  createInitialState,
  getAllowedTargets,
  getResultLabel,
  getResultOptions,
  getTargetLabel
} from "./mock-data.js";

const STORAGE_KEY = "activity5-mockup-state-v4";
const ACTIVITY4_HANDOFF_KEY = "ecmis-a4-a5-handoffs-v1";
const listeners = new Set();
const EXTENSION_RULES = Object.freeze({
  "213": { baseDays: 60, maxApproved: 2, maxDays: 60, directorRounds: 1 },
  "644": { baseDays: 270, maxApproved: 4, maxDays: 60, directorRounds: 2 }
});

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyAllegationProcess() {
  return { evidenceAssessment: "NOT_RECORDED", notices: [], exceptions: [] };
}

function normalizeAllegationProcess(report) {
  const source = report?.allegationProcess || {};
  report.allegationProcess = {
    ...emptyAllegationProcess(),
    ...source,
    notices: Array.isArray(source.notices) ? source.notices : [],
    exceptions: Array.isArray(source.exceptions) ? source.exceptions : []
  };
  return report.allegationProcess;
}

function normalizeSpecialMatter(matter) {
  matter.intake = matter.intake || {};
  if (!matter.intake.decision) {
    matter.intake.decision = matter.status === "PENDING_CLERK_REVIEW"
      ? "PENDING"
      : matter.status === "RETURNED_TO_COMPLAINT_CENTER"
        ? "RETURNED"
        : "FORWARDED";
    if (matter.intake.decision === "FORWARDED" && !matter.intake.checkedAt) {
      matter.intake.checkedAt = matter.assignment?.assignedAt || `${matter.receivedAt}T09:00:00+07:00`;
      matter.intake.checkedBy = matter.intake.checkedBy || "เจ้าหน้าที่ธุรการคดี";
      matter.intake.checkNote = matter.intake.checkNote || "ย้ายผลตรวจรับจากข้อมูลเดิม โปรดตรวจสอบเอกสารต้นทาง";
    }
  }
  return matter;
}

function normalizeCaseTiming(item) {
  const firstAppearanceAt = item.firstAppearanceAt || item.receivedAt;
  if (item.report213 && firstAppearanceAt) {
    item.report213.startedAt = firstAppearanceAt;
    item.report213.deadlineAt = (item.report213.extensionHistory || [])
      .filter((entry) => entry.status === "APPROVED")
      .reduce((deadline, entry) => addDays(deadline, Number(entry.requestedDays)), addDays(firstAppearanceAt, 60));
  }
  const report = item.report644;
  if (!report?.orderNo || !report.orderDate || !["INQUIRY", "WAIT_A7_644", "POST_DECISION", "CLOSED"].includes(item.phase)) return item;
  const subcommittee = String(item.assignment?.team || report.appointmentType).includes("อนุกรรมการ");
  report.appointmentType = subcommittee ? "คณะอนุกรรมการไต่สวน" : "คณะพนักงานไต่สวน";
  report.signatory = subcommittee ? "ประธานกรรมการ ป.ป.ท." : "เลขาธิการคณะกรรมการ ป.ป.ท.";
  if (subcommittee) {
    const meetingDate = report.appointmentMeetingDate && report.appointmentMeetingDate <= report.orderDate
      ? report.appointmentMeetingDate
      : report.startedAt && report.startedAt <= report.orderDate
        ? report.startedAt
        : report.orderDate;
    report.appointmentMeetingDate = meetingDate;
    report.startedAt = meetingDate;
  } else {
    report.appointmentMeetingDate = "";
    report.startedAt = report.orderDate;
  }
  report.deadlineAt = (report.extensionHistory || [])
    .filter((entry) => entry.status === "APPROVED")
    .reduce((deadline, entry) => addDays(deadline, Number(entry.requestedDays)), addDays(report.startedAt, 270));
  return item;
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== 4 || !Array.isArray(parsed.cases)) {
      return createInitialState();
    }
    parsed.cases.forEach((item) => {
      normalizeAllegationProcess(item.report644);
      normalizeCaseTiming(item);
      delete item.factcheck;
    });
    if (!Array.isArray(parsed.specialMatters)) parsed.specialMatters = createInitialState().specialMatters;
    parsed.specialMatters.forEach(normalizeSpecialMatter);
    return parsed;
  } catch {
    return createInitialState();
  }
}

function importActivity4Handoffs(target) {
  let records;
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVITY4_HANDOFF_KEY) || "{}");
    records = parsed.schemaVersion === 1 && parsed.records && typeof parsed.records === "object"
      ? Object.values(parsed.records)
      : [];
  } catch {
    records = [];
  }
  let changed = false;
  for (const handoff of records) {
    if (!["18/1ก", "18/1ข", "18/4"].includes(handoff?.sourceDecision)) continue;
    if (!handoff.outgoingLetterNo || !handoff.outgoingLetterDate || !handoff.destinationUnit || !handoff.dispatchedAt) continue;
    if (target.cases.some((item) => item.sourceReference === handoff.sourceReference || item.activity4HandoffId === handoff.handoffId)) continue;
    target.cases.push(createImportedActivity4Case(handoff));
    changed = true;
  }
  return changed;
}

let state = readState();
if (importActivity4Handoffs(state)) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

function persist(nextState) {
  state = nextState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener(getState()));
}

function demoTime(draft) {
  draft.eventCounter = (draft.eventCounter || 0) + 1;
  const seconds = draft.eventCounter * 73;
  const hour = 8 + Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = seconds % 60;
  return `${draft.demoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+07:00`;
}

function currentAccount(source = state) {
  if (!source.session) return null;
  return ACCOUNTS.find((account) => account.username === source.session.username) || null;
}

function permissionsFor(source = state) {
  const account = currentAccount(source);
  return account ? [...new Set([...(ROLE_PERMISSIONS[account.role] || []), ...(account.delegatedAuthorities || [])])] : [];
}

function hasExhaustionStatus(item, status) {
  return [item.report213?.exhaustion, item.report644?.exhaustion].some((entry) => entry?.status === status);
}

function hasPendingExtensionForTier(item, authorityTier) {
  return [...(item.report213?.extensionHistory || []), ...(item.report644?.extensionHistory || [])]
    .some((entry) => entry.status === "PENDING" && entry.authorityTier === authorityTier);
}

export function canReadCase(account, item) {
  if (!account || !item) return false;
  const unitAllowed = !account.allowedOwningUnits?.length || account.allowedOwningUnits.includes(item.owningUnit);
  const sourceUnit = item.assignment?.sourceOwningUnit || item.owningUnit;
  const sourceUnitAllowed = !account.allowedOwningUnits?.length || account.allowedOwningUnits.includes(sourceUnit);
  const targetUnitAllowed = Boolean(item.assignment?.transferTarget)
    && (!account.allowedOwningUnits?.length || account.allowedOwningUnits.includes(item.assignment.transferTarget));
  const owner = (item.assignment?.assignees || []).some((entry) => entry.name === account.name);
  const roleRules = {
    CLERK: () => (item.phase === "INTAKE" && unitAllowed)
      || (item.assignment?.state === "TRANSFER_APPROVAL_PENDING" && sourceUnitAllowed)
      || (item.assignment?.state === "TRANSFER_PENDING" && (sourceUnitAllowed || targetUnitAllowed)),
    DIRECTOR: () => unitAllowed && !["CLOSED", "MERGED"].includes(item.phase),
    PRELIM: () => owner && ["PRELIMINARY", "WAIT_A7_213", "POST_DECISION", "MERGED"].includes(item.phase),
    REVIEW: () => unitAllowed && (item.plan?.status === "SUBMITTED" || item.report213?.status === "SUBMITTED" || item.report644?.status === "SUBMITTED" || hasPendingExtensionForTier(item, "DIRECTOR_HEAD") || hasExhaustionStatus(item, "AWAITING_CHAIN_OPINION") || item.relations?.splitRequests?.some((request) => request.status === "AWAITING_HEAD") || item.handoff?.deliveries?.some((entry) => entry.status === "AWAITING_SIGNATURE")),
    EXECUTIVE: () => hasPendingExtensionForTier(item, "EXECUTIVE"),
    SECRETARY: () => item.assignment?.state === "TRANSFER_APPROVAL_PENDING"
      || ["AWAITING_SECRETARY", "READY_TO_SEND"].includes(item.report213?.status)
      || ["AWAITING_SECRETARY", "READY_TO_SEND"].includes(item.report644?.status)
      || String(item.phase).startsWith("WAIT_A7")
      || item.relations?.mergeRequest?.status === "PENDING_DECISION"
      || item.relations?.splitRequests?.some((request) => request.status === "AWAITING_BOARD")
      || hasExhaustionStatus(item, "AWAITING_SECRETARY")
      || hasExhaustionStatus(item, "READY_TO_SEND")
      || hasExhaustionStatus(item, "SENT")
      || hasExhaustionStatus(item, "DIRECTIVE_RECEIVED")
      || Boolean(item.integration?.finalizedAt),
    CASE_ADMIN: () => [item.report213?.secretaryReview?.status, item.report644?.secretaryReview?.status]
      .some((status) => ["SUPPORT_ORDERED", "SUPPORT_PENDING"].includes(status))
      || item.relations?.splitRequests?.some((request) => request.status === "AWAITING_CASE_ADMIN"),
    INQUIRY: () => owner && ["INQUIRY", "WAIT_A7_644", "POST_DECISION", "MERGED"].includes(item.phase),
    CASE_TRACKING: () => item.handoff?.deliveries?.some((entry) => entry.target === "PARENT_AGENCY" && entry.status !== "SENT"),
    DECISION_AFFAIRS: () => item.handoff?.deliveries?.some((entry) => entry.target === "PARENT_AGENCY" && !entry.copySentAt),
    AUDIT: () => true
  };
  return Boolean(roleRules[account.role]?.());
}

export function canReadSpecialMatter(account, matter) {
  if (!account || !matter) return false;
  const unitAllowed = !account.allowedOwningUnits?.length || account.allowedOwningUnits.includes(matter.owningUnit);
  const roleRules = {
    CLERK: () => unitAllowed && matter.status === "PENDING_CLERK_REVIEW",
    DIRECTOR: () => unitAllowed && matter.status === "PENDING_DIRECTOR_ASSIGNMENT",
    SPECIAL_OFFICER: () => matter.assignment?.officerAccount === account.username,
    REVIEW: () => unitAllowed && matter.status === "AWAITING_DIRECTOR_REVIEW",
    EXECUTIVE: () => matter.status === "AWAITING_EXECUTIVE_REVIEW",
    SECRETARY: () => matter.status === "AWAITING_SECRETARY",
    AUDIT: () => true
  };
  return Boolean(roleRules[account.role]?.());
}

function normalizedReason(reason, fallback = "ดำเนินการตามขั้นตอนงาน") {
  const value = String(reason || fallback).trim();
  return value || fallback;
}

function appendGlobalAudit(draft, event) {
  draft.globalVersion = (draft.globalVersion || 0) + 1;
  draft.globalAudit = draft.globalAudit || [];
  draft.globalAudit.unshift({
    id: `global-${draft.globalVersion}-${draft.eventCounter}`,
    caseId: event.caseId || "",
    actor: event.actor,
    role: event.role,
    action: event.action,
    reason: normalizedReason(event.reason),
    version: draft.globalVersion,
    outcome: event.outcome || "SUCCESS",
    time: event.time || demoTime(draft)
  });
}

function appendCaseAudit(draft, caseItem, event) {
  caseItem.version += 1;
  caseItem.audit.unshift({
    id: `${caseItem.id}-audit-${caseItem.version}-${draft.eventCounter}`,
    caseId: caseItem.id,
    actor: event.actor,
    role: event.role,
    action: event.action,
    reason: normalizedReason(event.reason),
    version: caseItem.version,
    outcome: event.outcome || "SUCCESS",
    time: event.time || demoTime(draft)
  });
}

function findCase(source, caseId) {
  const caseItem = source.cases.find((item) => item.id === caseId);
  if (!caseItem) throw new AppError("ไม่พบสำนวนที่ร้องขอ", 404);
  return caseItem;
}

function findSpecialMatter(source, matterId) {
  const matter = (source.specialMatters || []).find((entry) => entry.id === matterId);
  if (!matter) throw new AppError("ไม่พบเรื่องตรวจสอบข้อเท็จจริงที่ร้องขอ", 404);
  return matter;
}

function deny(permission, caseId, action, reason) {
  const draft = clone(state);
  const account = currentAccount(draft);
  const event = {
    actor: account?.name || "ผู้ใช้ที่ยังไม่เข้าสู่ระบบ",
    role: account?.role || "ANONYMOUS",
    action: `403_${action}`,
    reason: normalizedReason(reason, "พยายามใช้คำสั่งที่ไม่มีสิทธิ์"),
    outcome: "FORBIDDEN"
  };

  appendGlobalAudit(draft, { ...event, caseId });
  persist(draft);
  throw new AppError("ไม่มีสิทธิ์ดำเนินการคำสั่งนี้", 403);
}

function requirePermission(permission, caseId, action, reason) {
  if (!currentAccount()) deny(permission, caseId, action, "ยังไม่เข้าสู่ระบบ");
  if (!permissionsFor().includes(permission)) deny(permission, caseId, action, reason);
}

function required(value, message) {
  if (!String(value || "").trim()) throw new AppError(message, 422);
}

function requireState(condition, message) {
  if (!condition) throw new AppError(message, 409);
}

function requireIsoDate(value, label) {
  const normalized = String(value || "").trim();
  required(normalized, `ต้องระบุ${label}`);
  const date = new Date(`${normalized}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new AppError(`${label}ไม่ถูกต้อง`, 422);
  }
  return normalized;
}

function requireSpecialIntakeForwarded(matter) {
  requireState(
    matter.intake?.decision === "FORWARDED" && Boolean(matter.intake.checkedAt) && Boolean(matter.intake.checkedBy) && Boolean(matter.intake.checkNote),
    "ธุรการคดีต้องตรวจข้อมูลและบันทึกผลเสนอผู้อำนวยการก่อนมอบหมายหรือดำเนินการตรวจสอบข้อเท็จจริง"
  );
}

function requireAssignedOwner(item, account) {
  const assignees = item.assignment.assignees || [];
  requireState(
    assignees.some((entry) => entry.name === account.name),
    `สำนวนนี้มอบหมายให้ ${assignees.map((entry) => entry.name).join(", ") || "ผู้รับผิดชอบคนอื่น"}`
  );
}

function requireAcknowledgedMember(item, account) {
  requireAssignedOwner(item, account);
  const member = item.assignment.assignees.find((entry) => entry.name === account.name);
  requireState(Boolean(member?.acknowledgedAt), "ต้องยืนยันรับผิดชอบสำนวนก่อนดำเนินงาน");
}

function requireAcknowledgedOwner(item, account) {
  requireAcknowledgedMember(item, account);
  const member = item.assignment.assignees.find((entry) => entry.name === account.name);
  requireState(member?.assignmentRole === "LEAD", "คำสั่งนี้เป็นอำนาจของผู้รับผิดชอบหลัก ผู้ช่วยสำนวนบันทึกได้เฉพาะการดำเนินงานและพยานหลักฐาน");
}

function eligibleInvestigator(item, investigator, workType) {
  return INVESTIGATOR_DIRECTORY.some((entry) => entry.name === investigator
    && entry.workType === workType
    && entry.units.includes(item.owningUnit));
}

function requestedAssignment(payload) {
  const legacy = Array.isArray(payload.investigators) ? payload.investigators : [];
  const lead = String(payload.leadInvestigator || payload.investigator || legacy[0] || "").trim();
  const rawAssistants = Array.isArray(payload.assistantInvestigators)
    ? payload.assistantInvestigators
    : legacy.slice(1);
  const assistants = rawAssistants.map((name) => String(name).trim()).filter(Boolean);
  return { lead, assistants, names: [lead, ...assistants].filter(Boolean) };
}

function buildAssignees(item, assignment, workType, existing = []) {
  return assignment.names.map((name) => {
    const directoryEntry = INVESTIGATOR_DIRECTORY.find((entry) => entry.name === name);
    const retained = existing.find((entry) => entry.name === name);
    return {
      name,
      account: directoryEntry.account,
      workType,
      assignmentRole: name === assignment.lead ? "LEAD" : "ASSISTANT",
      acknowledgedAt: retained?.acknowledgedAt || ""
    };
  });
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + Number(days));
  return result.toISOString().slice(0, 10);
}

function daysUntil(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function extensionRule(reportType) {
  const rule = EXTENSION_RULES[reportType];
  if (!rule) throw new AppError("ประเภทกำหนดเวลาไม่ถูกต้อง", 422);
  return rule;
}

function reportFor(item, reportType) {
  extensionRule(reportType);
  return reportType === "213" ? item.report213 : item.report644;
}

function editableReport644(item) {
  return item.phase === "INQUIRY" && ["DRAFT", "RETURNED"].includes(item.report644.status);
}

function noticeServiceComplete(notice) {
  return ["SERVED_IN_PERSON", "SERVED_POSTAL", "SERVED_BY_POSTING"].includes(notice?.service?.status);
}

function allegationProcessComplete(report) {
  const process = normalizeAllegationProcess(report);
  const hasRecordedPath = process.notices.length > 0 || process.exceptions.length > 0;
  const noticesComplete = process.notices.every((notice) => noticeServiceComplete(notice) && (notice.responses || []).length > 0);
  return hasRecordedPath && noticesComplete;
}

function refreshAllegationSummaries(report) {
  const process = normalizeAllegationProcess(report);
  const served = process.notices.filter(noticeServiceComplete).length;
  const answered = process.notices.filter((notice) => (notice.responses || []).length > 0).length;
  report.allegationNotice = process.notices.length
    ? `จัดทำหนังสือแจ้ง ${process.notices.length} ราย ดำเนินการแจ้งสำเร็จ ${served} ราย`
    : process.exceptions.length
      ? `บันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา ${process.exceptions.length} รายการ`
      : "";
  report.response = process.notices.length
    ? `บันทึกผลการชี้แจงหรือไม่ยื่นคำชี้แจงแล้ว ${answered} จาก ${process.notices.length} ราย`
    : process.exceptions.length
      ? "ไม่เข้าสู่ขั้นรับฟังคำชี้แจงตามเหตุที่บันทึกไว้"
      : "";
}

function findAllegationNotice(item, noticeId) {
  const process = normalizeAllegationProcess(item.report644);
  const notice = process.notices.find((entry) => entry.id === noticeId);
  if (!notice) throw new AppError("ไม่พบรายการแจ้งข้อกล่าวหาที่ร้องขอ", 404);
  notice.service = notice.service || { status: "PENDING_APPOINTMENT", method: "", date: "", reference: "", location: "" };
  notice.responses = Array.isArray(notice.responses) ? notice.responses : [];
  return notice;
}

function approvedExtensions(report) {
  return report.extensionHistory.filter((entry) => entry.status === "APPROVED");
}

function authorityForRound(reportType, sequence) {
  return sequence <= extensionRule(reportType).directorRounds ? "DIRECTOR_HEAD" : "EXECUTIVE";
}

function snapshotReport(item, reportType, draft, account, action) {
  const report = reportFor(item, reportType);
  report.revisions = report.revisions || [];
  const fields = reportType === "213"
    ? ["summary", "recommendation", "reviewerNote"]
    : ["appointmentType", "signatory", "orderNo", "orderDate", "planSummary", "evidenceSummary", "allegationNotice", "response", "summary", "recommendation", "reviewerNote"];
  const content = Object.fromEntries(fields.map((field) => [field, String(report[field] || "")]));
  if (reportType === "644") content.allegationProcess = clone(normalizeAllegationProcess(report));
  report.revisions.push({
    revision: report.revisions.length + 1,
    caseVersion: item.version + 1,
    action,
    status: report.status,
    actor: account.name,
    role: account.role,
    at: demoTime(draft),
    content
  });
}

function createCheckpoints(reportType, periodStartedAt, requestedDays) {
  if (reportType !== "213") return [];
  return [15, 30, 45]
    .filter((elapsed) => elapsed <= Number(requestedDays))
    .map((elapsed, index) => ({ sequence: index + 1, elapsedDays: elapsed, dueAt: addDays(periodStartedAt, elapsed), status: "PENDING" }));
}

function addDeadlineNotifications(draft, item, extension) {
  if (extension.reportType !== "213") return;
  const lead = item.assignment.assignees?.find((entry) => entry.assignmentRole === "LEAD");
  if (!lead?.account) return;
  draft.notifications = draft.notifications || [];
  extension.checkpoints.forEach((checkpoint) => {
    const id = `notice-${item.id}-213-${extension.sequence}-${checkpoint.elapsedDays}`;
    if (draft.notifications.some((entry) => entry.id === id)) return;
    draft.notifications.push({
      id,
      caseId: item.id,
      reportType: "213",
      extensionRound: extension.sequence,
      elapsedDays: checkpoint.elapsedDays,
      dueAt: checkpoint.dueAt,
      recipientAccount: lead.account,
      recipientName: lead.name,
      status: checkpoint.dueAt <= draft.demoDate ? "DUE" : "SCHEDULED",
      readAt: ""
    });
  });
}

function retargetUnreadNotifications(draft, item, lead = null) {
  (draft.notifications || []).filter((entry) => entry.caseId === item.id && !entry.readAt).forEach((entry) => {
    entry.recipientAccount = lead?.account || "";
    entry.recipientName = lead?.name || "รอมอบหมายผู้รับผิดชอบหลัก";
  });
}

function cancelDeadlineNotifications(draft, item, reportType) {
  (draft.notifications || [])
    .filter((entry) => entry.caseId === item.id && entry.reportType === reportType && !entry.readAt && entry.status !== "CANCELLED")
    .forEach((entry) => {
      entry.status = "CANCELLED";
      entry.cancelledAt = draft.demoDate;
    });
}

function reactivateDeadlineNotifications(draft, item, reportType) {
  const lead = item.assignment.assignees?.find((entry) => entry.assignmentRole === "LEAD");
  (draft.notifications || [])
    .filter((entry) => entry.caseId === item.id && entry.reportType === reportType && !entry.readAt && entry.status === "CANCELLED")
    .forEach((entry) => {
      entry.status = entry.dueAt <= draft.demoDate ? "DUE" : "SCHEDULED";
      entry.cancelledAt = "";
      entry.recipientAccount = lead?.account || "";
      entry.recipientName = lead?.name || "รอมอบหมายผู้รับผิดชอบหลัก";
    });
}

function withdrawPendingExtensions(report, draft, account) {
  report.extensionHistory
    .filter((entry) => entry.status === "PENDING")
    .forEach((entry) => {
      entry.status = "WITHDRAWN";
      entry.withdrawnAt = draft.demoDate;
      entry.withdrawnBy = account.name;
      entry.withdrawalReason = "รายงานแล้วเสร็จและเสนอผู้ตรวจแล้ว";
    });
}

function mergeRequestParticipants(caseItem) {
  const request = caseItem.relations?.mergeRequest;
  if (request?.status !== "PENDING_DECISION") return [];
  return [...new Set([
    caseItem.id,
    request.candidateId,
    request.proposedMasterId,
    request.proposedSourceId
  ].filter(Boolean))];
}

function activeMergeOwners(draft, caseId, excludedOwnerId = "") {
  return draft.cases.filter((entry) => entry.id !== excludedOwnerId && mergeRequestParticipants(entry).includes(caseId));
}

function normalizeDirectives(value) {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(entries.map((entry) => String(entry).trim()).filter(Boolean))].sort();
}

function sameCallback(left, right) {
  const fields = ["result", "correlationId", "meetingDate", "meetingNo", "meetingNote"];
  return fields.every((field) => String(left[field] || "") === String(right[field] || ""))
    && JSON.stringify(normalizeDirectives(left.directives)) === JSON.stringify(normalizeDirectives(right.directives));
}

function boardDirectives(reportType, result, submittedDirectives) {
  if (reportType === "213") {
    return {
      NOT_ACCEPT_TRANSFER_NACC: ["NACC"],
      NOT_ACCEPT_TERMINATE: [],
      NOT_ACCEPT_OTHER_AGENCY: ["OTHER"]
    }[result] || [];
  }
  if (["SUBSTANTIATE_CORRUPTION", "SUBSTANTIATE_MISCONDUCT"].includes(result)) {
    const selected = normalizeDirectives(submittedDirectives);
    requireState(selected.length > 0, "มติชี้มูลต้องระบุให้ส่งพนักงานอัยการ หน่วยงานต้นสังกัด หรือทั้งสองแห่ง");
    requireState(selected.every((target) => ["PROSECUTOR", "PARENT_AGENCY"].includes(target)), "ปลายทางตามมติไม่ถูกต้อง");
    return selected;
  }
  return {
    SUBSTANTIATE_SERIOUS_DISCIPLINE: ["PARENT_AGENCY"],
    ALLEGATION_UNFOUNDED: ["ACCUSED"]
  }[result] || [];
}

function callbackDirectives(reportType, result, submittedDirectives) {
  if (["SUBSTANTIATE_CORRUPTION", "SUBSTANTIATE_MISCONDUCT"].includes(result)) {
    return normalizeDirectives(submittedDirectives);
  }
  return boardDirectives(reportType, result, submittedDirectives);
}

function postDecisionRoute(target) {
  if (target === "PROSECUTOR") return "PROSECUTOR";
  if (target === "PARENT_AGENCY") return "DISCIPLINARY";
  if (target === "NACC") return "NACC";
  if (target === "ACCUSED") return "NOTICE";
  return "OTHER_AGENCY";
}

function createPostDecisionDelivery(target, label, otherAgency = null) {
  return {
    target,
    label,
    route: postDecisionRoute(target),
    status: "PENDING",
    reference: "",
    otherAgency,
    preparedAt: "",
    preparedBy: "",
    caseFileReference: "",
    resolutionReference: "",
    inquiryReportReference: "",
    outgoingLetterNo: "",
    accusedCategory: "",
    jurisdiction: "",
    prosecutorOffice: "",
    signedAt: "",
    signedBy: "",
    dispatchedAt: "",
    dispatchedBy: "",
    dispatchStatus: "PENDING",
    attempts: [],
    lastError: "",
    copyReference: "",
    copySentAt: "",
    copySentBy: ""
  };
}

function refreshDisciplinaryDelivery(delivery) {
  if (delivery.dispatchStatus === "FAILED") delivery.status = "FAILED";
  else if (delivery.dispatchStatus === "SENT" && delivery.copySentAt) delivery.status = "SENT";
  else if (delivery.dispatchStatus === "SENT") delivery.status = "AWAITING_COPY";
  else if (delivery.copySentAt) delivery.status = "READY_TO_DISPATCH";
  else delivery.status = "PENDING";
}

function refreshPostDecisionHandoff(item) {
  const deliveries = item.handoff.deliveries || [];
  if (!deliveries.length) return;
  const completed = deliveries.filter((entry) => ["SENT", "ACKNOWLEDGED"].includes(entry.status)).length;
  const failed = deliveries.filter((entry) => entry.status === "FAILED").length;
  if (completed === deliveries.length) item.handoff.status = "CLOSED";
  else if (failed === deliveries.length) item.handoff.status = "FAILED";
  else if (completed || failed || deliveries.some((entry) => entry.status !== "PENDING")) item.handoff.status = "PARTIAL";
  else item.handoff.status = "PENDING";
}

function recordRejectedCommand(error, caseId, action, reason) {
  if (!(error instanceof AppError) || error.status === 403) return;
  const draft = clone(state);
  const account = currentAccount(draft);
  appendGlobalAudit(draft, {
    caseId,
    actor: account?.name || "ผู้ใช้ที่ยังไม่เข้าสู่ระบบ",
    role: account?.role || "ANONYMOUS",
    action: `${error.status}_${action}`,
    reason: `${normalizedReason(reason)}: ${error.message}`,
    outcome: error.status === 409 ? "CONFLICT" : "REJECTED"
  });
  persist(draft);
}

function caseCommand({ permission, caseId, action, reason, payload, validate, mutate, idempotencyBeforeVersion = false }) {
  requirePermission(permission, caseId, action, reason);
  const draft = clone(state);
  const account = currentAccount(draft);
  const caseItem = findCase(draft, caseId);
  if (!canReadCase(account, caseItem)) deny(permission, caseId, action, "บัญชีนี้ไม่ได้รับสิทธิ์เข้าถึงสำนวน");
  if (idempotencyBeforeVersion) {
    const earlyValidation = validate?.(caseItem, draft, account);
    if (earlyValidation?.idempotent) return clone(caseItem);
  }
  if (payload?.expectedVersion !== undefined && payload?.expectedVersion !== "") {
    requireState(Number(payload.expectedVersion) === caseItem.version, "สำนวนนี้มีข้อมูลใหม่ กรุณาโหลดหน้าอีกครั้งก่อนบันทึก");
  }
  const validation = idempotencyBeforeVersion ? undefined : validate?.(caseItem, draft, account);
  if (validation?.idempotent) return clone(caseItem);
  mutate(caseItem, draft, account);
  appendCaseAudit(draft, caseItem, {
    actor: account.name,
    role: account.role,
    action,
    reason
  });
  persist(draft);
  return clone(caseItem);
}

function specialMatterCommand({ permission, matterId, action, reason, payload, validate, mutate }) {
  requirePermission(permission, matterId, action, reason);
  const draft = clone(state);
  const account = currentAccount(draft);
  const matter = findSpecialMatter(draft, matterId);
  if (!canReadSpecialMatter(account, matter)) deny(permission, matterId, action, "บัญชีนี้ไม่ได้รับสิทธิ์เข้าถึงเรื่องตรวจสอบข้อเท็จจริงนี้");
  if (payload?.expectedVersion !== undefined && payload?.expectedVersion !== "") {
    requireState(Number(payload.expectedVersion) === matter.version, "เรื่องนี้มีข้อมูลใหม่ กรุณาโหลดหน้าอีกครั้งก่อนบันทึก");
  }
  validate?.(matter, draft, account, payload);
  mutate(matter, draft, account, payload);
  appendCaseAudit(draft, matter, {
    actor: account.name,
    role: account.role,
    action,
    reason
  });
  persist(draft);
  return clone(matter);
}

const definitions = {
  SPECIAL_REVIEW_INTAKE: {
    scope: "SPECIAL",
    permission: "special.intake.review",
    action: "SPECIAL_INTAKE_REVIEWED",
    validate: (matter, _draft, _account, payload) => {
      requireState(matter.status === "PENDING_CLERK_REVIEW", "เรื่องนี้พ้นขั้นตรวจข้อมูลของธุรการคดีแล้ว");
      requireState(["FORWARD", "RETURN"].includes(payload.decision), "ผลการตรวจข้อมูลไม่ถูกต้อง");
      if (payload.decision === "RETURN") required(payload.reason, "ต้องระบุเหตุผลการส่งคืนศูนย์รับเรื่องร้องเรียน");
      if (payload.decision === "FORWARD") required(payload.checkNote, "ต้องบันทึกผลการตรวจข้อมูล");
    },
    mutate: (matter, draft, account, payload) => {
      matter.intake.decision = payload.decision === "FORWARD" ? "FORWARDED" : "RETURNED";
      matter.intake.checkedAt = demoTime(draft);
      matter.intake.checkedBy = account.name;
      matter.intake.checkNote = String(payload.checkNote || "").trim();
      matter.intake.returnReason = payload.decision === "RETURN" ? payload.reason.trim() : "";
      matter.status = payload.decision === "FORWARD" ? "PENDING_DIRECTOR_ASSIGNMENT" : "RETURNED_TO_COMPLAINT_CENTER";
    }
  },
  SPECIAL_ASSIGN_OFFICER: {
    scope: "SPECIAL",
    permission: "special.assign",
    action: "SPECIAL_OFFICER_ASSIGNED",
    validate: (matter, _draft, _account, payload) => {
      requireState(matter.status === "PENDING_DIRECTOR_ASSIGNMENT", "เรื่องนี้ไม่อยู่ระหว่างรอมอบหมาย");
      requireSpecialIntakeForwarded(matter);
      const officer = ACCOUNTS.find((entry) => entry.username === payload.officerAccount && entry.role === "SPECIAL_OFFICER");
      requireState(Boolean(officer), "ไม่พบเจ้าหน้าที่ผู้ตรวจสอบข้อเท็จจริงที่เลือก");
      requireState(officer.unit === matter.owningUnit, "เจ้าหน้าที่ที่เลือกไม่ได้อยู่ในหน่วยงานเจ้าของเรื่อง");
      required(payload.reason, "ต้องระบุคำสั่งหรือเหตุผลการมอบหมาย");
    },
    mutate: (matter, draft, account, payload) => {
      const officer = ACCOUNTS.find((entry) => entry.username === payload.officerAccount);
      matter.assignment = {
        officerName: officer.name,
        officerAccount: officer.username,
        assignedAt: demoTime(draft),
        assignedBy: account.name,
        acknowledgedAt: ""
      };
      matter.status = "ASSIGNED";
    }
  },
  SPECIAL_ACKNOWLEDGE_ASSIGNMENT: {
    scope: "SPECIAL",
    permission: "special.acknowledge",
    action: "SPECIAL_ASSIGNMENT_ACKNOWLEDGED",
    validate: (matter, _draft, account) => {
      requireState(matter.status === "ASSIGNED", "เรื่องนี้ไม่ได้อยู่ระหว่างรอรับมอบหมาย");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username, "เรื่องนี้มอบหมายให้เจ้าหน้าที่คนอื่น");
    },
    mutate: (matter, draft) => {
      matter.assignment.acknowledgedAt = demoTime(draft);
      matter.status = "FACT_FINDING";
    }
  },
  SPECIAL_SAVE_REPORT: {
    scope: "SPECIAL",
    permission: "special.report.edit",
    action: "SPECIAL_REPORT_SAVED",
    validate: (matter, _draft, account) => {
      requireState(["FACT_FINDING", "REPORT_RETURNED"].includes(matter.status), "รายงานนี้ถูกส่งให้ผู้บังคับบัญชาระดับผู้อำนวยการ ผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับ หรือเลขาธิการฯ แล้ว หรือดำเนินการเสร็จแล้ว");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username && Boolean(matter.assignment.acknowledgedAt), "ต้องเป็นผู้รับผิดชอบที่รับมอบหมายแล้ว");
    },
    mutate: (matter, _draft, _account, payload) => {
      ["factSummary", "evidenceReferences", "hardshipImpact", "projectValueIssue", "recommendedAction"].forEach((field) => {
        matter.report[field] = String(payload[field] || "").trim();
      });
      matter.report.status = "DRAFT";
    }
  },
  SPECIAL_SUBMIT_REPORT: {
    scope: "SPECIAL",
    permission: "special.report.submit",
    action: "SPECIAL_REPORT_SUBMITTED",
    validate: (matter, _draft, account) => {
      requireState(["FACT_FINDING", "REPORT_RETURNED"].includes(matter.status), "สถานะรายงานไม่พร้อมเสนอผู้บังคับบัญชา");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username && Boolean(matter.assignment.acknowledgedAt), "ต้องเป็นผู้รับผิดชอบที่รับมอบหมายแล้ว");
      required(matter.report.factSummary, "ต้องสรุปข้อเท็จจริงที่ตรวจพบ");
      required(matter.report.evidenceReferences, "ต้องระบุพยานหลักฐานหรือเอกสารอ้างอิง");
      required(matter.type === "ARTICLE_58_2" ? matter.report.hardshipImpact : matter.report.projectValueIssue, matter.type === "ARTICLE_58_2" ? "ต้องระบุความเดือดร้อนหรือความเสียหาย" : "ต้องระบุประเด็นวงเงินหรือความคุ้มค่าของโครงการ");
      required(matter.report.recommendedAction, "ต้องระบุความเห็นเสนอ");
    },
    mutate: (matter, draft, account) => {
      matter.report.status = "SUBMITTED";
      matter.report.submittedAt = demoTime(draft);
      matter.report.submittedBy = account.name;
      matter.status = "AWAITING_DIRECTOR_REVIEW";
    }
  },
  SPECIAL_REVIEW_REPORT_DIRECTOR: {
    scope: "SPECIAL",
    permission: "special.report.review.director",
    action: "SPECIAL_REPORT_DIRECTOR_REVIEWED",
    validate: (matter, _draft, _account, payload) => {
      requireState(matter.status === "AWAITING_DIRECTOR_REVIEW", "รายงานนี้ไม่ได้รอผู้บังคับบัญชาระดับผู้อำนวยการตรวจ");
      requireSpecialIntakeForwarded(matter);
      requireState(["FORWARD", "RETURN"].includes(payload.decision), "ผลการตรวจรายงานไม่ถูกต้อง");
      required(payload.opinion, "ต้องระบุความเห็นของผู้ตรวจ");
    },
    mutate: (matter, draft, account, payload) => {
      matter.report.directorOpinion = payload.opinion.trim();
      matter.report.directorReviewedAt = demoTime(draft);
      matter.report.directorReviewedBy = account.name;
      matter.report.status = payload.decision === "FORWARD" ? "AWAITING_EXECUTIVE_REVIEW" : "RETURNED";
      matter.status = payload.decision === "FORWARD" ? "AWAITING_EXECUTIVE_REVIEW" : "REPORT_RETURNED";
    }
  },
  SPECIAL_REVIEW_REPORT_EXECUTIVE: {
    scope: "SPECIAL",
    permission: "special.report.review.executive",
    action: "SPECIAL_REPORT_EXECUTIVE_REVIEWED",
    validate: (matter, _draft, _account, payload) => {
      requireState(matter.status === "AWAITING_EXECUTIVE_REVIEW", "รายงานนี้ไม่ได้รอผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับตรวจ");
      requireSpecialIntakeForwarded(matter);
      requireState(["FORWARD", "RETURN"].includes(payload.decision), "ผลการตรวจรายงานไม่ถูกต้อง");
      required(payload.opinion, "ต้องระบุความเห็นของผู้ตรวจ");
    },
    mutate: (matter, draft, account, payload) => {
      matter.report.executiveOpinion = payload.opinion.trim();
      matter.report.executiveReviewedAt = demoTime(draft);
      matter.report.executiveReviewedBy = account.name;
      matter.report.status = payload.decision === "FORWARD" ? "AWAITING_SECRETARY" : "RETURNED";
      matter.status = payload.decision === "FORWARD" ? "AWAITING_SECRETARY" : "REPORT_RETURNED";
    }
  },
  SPECIAL_SECRETARY_DECIDE: {
    scope: "SPECIAL",
    permission: "special.report.decide",
    action: "SPECIAL_REPORT_SECRETARY_DECIDED",
    validate: (matter, _draft, _account, payload) => {
      requireState(matter.status === "AWAITING_SECRETARY", "รายงานนี้ไม่ได้รอเลขาธิการฯ พิจารณา");
      requireSpecialIntakeForwarded(matter);
      const normalOutcome = matter.type === "ARTICLE_58_2" ? "NOTIFY_STATE_AGENCY" : "NOTIFY_SAO";
      requireState([normalOutcome, "REFER_NACC", "RETURN"].includes(payload.outcome), "ผลพิจารณาไม่ตรงกับประเภทเรื่อง");
      required(payload.opinion, "ต้องระบุความเห็นหรือข้อสั่งการของเลขาธิการฯ");
    },
    mutate: (matter, draft, account, payload) => {
      matter.report.secretaryOutcome = payload.outcome;
      matter.report.secretaryOpinion = payload.opinion.trim();
      matter.report.secretaryDecidedAt = demoTime(draft);
      matter.report.secretaryDecidedBy = account.name;
      if (payload.outcome === "RETURN") {
        matter.report.status = "RETURNED";
        matter.status = "REPORT_RETURNED";
        return;
      }
      matter.report.status = "SECRETARY_DECIDED";
      matter.status = "READY_TO_NOTIFY";
      const target = payload.outcome === "REFER_NACC"
        ? { targetType: "NACC", targetName: "สำนักงาน ป.ป.ช." }
        : payload.outcome === "NOTIFY_SAO"
          ? { targetType: "SAO", targetName: "สำนักงานการตรวจเงินแผ่นดิน (สตง.)" }
          : { targetType: "STATE_AGENCY_HEAD", targetName: `หัวหน้า${matter.affectedAgency}` };
      matter.notification = { ...matter.notification, ...target };
    }
  },
  SPECIAL_SEND_NOTIFICATION: {
    scope: "SPECIAL",
    permission: "special.notify",
    action: "SPECIAL_NOTIFICATION_SENT",
    validate: (matter, draft, account, payload) => {
      requireState(matter.status === "READY_TO_NOTIFY", "เรื่องนี้ไม่ได้อยู่ระหว่างรอแจ้งหน่วยงานตามผลพิจารณา");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username, "ต้องเป็นผู้รับผิดชอบเรื่องนี้");
      required(payload.letterNo, "ต้องระบุเลขหนังสือแจ้ง");
      const sentAt = requireIsoDate(payload.sentAt, "วันที่ส่งหนังสือ");
      requireState(sentAt <= draft.demoDate, "วันที่ส่งหนังสือต้องไม่เป็นวันที่ในอนาคต");
      required(payload.deliveryReference, "ต้องระบุหลักฐานหรือเลขอ้างอิงการส่ง");
      if (matter.notification.targetType === "STATE_AGENCY_HEAD") required(payload.targetName, "ต้องระบุหัวหน้าหน่วยงานของรัฐที่รับหนังสือ");
    },
    mutate: (matter, _draft, account, payload) => {
      if (matter.notification.targetType === "STATE_AGENCY_HEAD") matter.notification.targetName = payload.targetName.trim();
      matter.notification.letterNo = payload.letterNo.trim();
      matter.notification.sentAt = payload.sentAt;
      matter.notification.sentBy = account.name;
      matter.notification.deliveryReference = payload.deliveryReference.trim();
      matter.status = matter.notification.targetType === "STATE_AGENCY_HEAD" ? "AWAITING_AGENCY_ACTION" : "COMPLETED";
    }
  },
  SPECIAL_RECORD_AGENCY_RESPONSE: {
    scope: "SPECIAL",
    permission: "special.notify",
    action: "SPECIAL_AGENCY_RESPONSE_RECORDED",
    validate: (matter, draft, account, payload) => {
      requireState(matter.status === "AWAITING_AGENCY_ACTION", "เรื่องนี้ไม่ได้อยู่ระหว่างติดตามการแก้ไขของหน่วยงานรัฐ");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username, "ต้องเป็นผู้รับผิดชอบเรื่องนี้");
      requireState(["CORRECTED", "NOT_ACTED"].includes(payload.response), "ผลการติดตามไม่ถูกต้อง");
      const responseDate = requireIsoDate(payload.responseDate, "วันที่ตรวจสอบผลการแก้ไข");
      requireState(responseDate <= draft.demoDate && responseDate >= matter.notification.sentAt, "วันที่ตรวจสอบผลต้องอยู่หลังวันที่ส่งหนังสือและไม่เป็นวันที่ในอนาคต");
      required(payload.responseReference, "ต้องระบุหนังสือตอบกลับหรือหลักฐานการติดตาม");
      required(payload.note, "ต้องบันทึกผลการแก้ไขหรือการไม่ดำเนินการ");
    },
    mutate: (matter, _draft, _account, payload) => {
      matter.notification.agencyResponse = payload.response;
      matter.notification.agencyResponseDate = payload.responseDate;
      matter.notification.agencyResponseReference = payload.responseReference.trim();
      matter.notification.agencyResponseNote = payload.note.trim();
      matter.status = payload.response === "CORRECTED" ? "COMPLETED" : "READY_PUBLIC_NOTICE";
    }
  },
  SPECIAL_RECORD_PUBLIC_NOTICE: {
    scope: "SPECIAL",
    permission: "special.notify",
    action: "SPECIAL_PUBLIC_NOTICE_RECORDED",
    validate: (matter, draft, account, payload) => {
      requireState(matter.status === "READY_PUBLIC_NOTICE", "เรื่องนี้ยังไม่ถึงขั้นประกาศให้ประชาชนทราบ");
      requireSpecialIntakeForwarded(matter);
      requireState(matter.assignment.officerAccount === account.username, "ต้องเป็นผู้รับผิดชอบเรื่องนี้");
      const publicationDate = requireIsoDate(payload.publicationDate, "วันที่ประกาศ");
      requireState(publicationDate <= draft.demoDate && publicationDate >= matter.notification.agencyResponseDate, "วันที่ประกาศต้องอยู่หลังวันที่ตรวจสอบผลและไม่เป็นวันที่ในอนาคต");
      required(payload.publicationReference, "ต้องระบุเลขหรือหลักฐานอ้างอิงประกาศ");
    },
    mutate: (matter, _draft, _account, payload) => {
      matter.notification.publicNoticeDate = payload.publicationDate;
      matter.notification.publicNoticeReference = payload.publicationReference.trim();
      matter.status = "COMPLETED";
    }
  },
  ACCEPT_CASE: {
    permission: "intake.accept",
    action: "INTAKE_ACCEPTED",
    validate: (item) => {
      requireState(item.phase === "INTAKE", "รับเรื่องได้เฉพาะสำนวนรอตรวจรับ");
      requireState(item.intakeDecision !== "ACCEPTED", "เรื่องนี้รับไว้ดำเนินการแล้ว กรุณามอบหมายผู้รับผิดชอบ");
      requireState(!["TRANSFER_APPROVAL_PENDING", "TRANSFER_PENDING"].includes(item.assignment.state), "ต้องรอกระบวนการโอนให้สิ้นสุดก่อนรับเรื่อง");
    },
    mutate: (item) => {
      item.intakeDecision = "ACCEPTED";
      item.assignment.state = "UNASSIGNED";
      item.handoff.status = "PENDING";
      item.handoff.note = "ตรวจรับเรื่องไว้ดำเนินการแล้ว";
    }
  },
  RETURN_CASE: {
    permission: "intake.return",
    action: "INTAKE_RETURNED_TO_ACTIVITY4",
    validate: (item, _draft, _account, payload) => {
      requireState(item.phase === "INTAKE", "ส่งคืนได้เฉพาะสำนวนรอตรวจรับ");
      requireState(!["TRANSFER_APPROVAL_PENDING", "TRANSFER_PENDING"].includes(item.assignment.state), "ต้องรอกระบวนการโอนให้สิ้นสุดก่อนส่งคืน");
      required(payload.reason, "ต้องระบุเหตุผลการส่งคืน");
    },
    mutate: (item) => {
      item.intakeDecision = "RETURNED";
      item.phase = "CLOSED";
      item.handoff = {
        status: "CLOSED",
        target: "ศูนย์รับเรื่องร้องเรียน",
        note: "ส่งคืนต้นทางตามเหตุผลที่บันทึก",
        deliveries: []
      };
    }
  },
  REQUEST_TRANSFER: {
    permission: "transfer.request",
    action: "TRANSFER_REQUESTED",
    validate: (item, _draft, _account, payload) => {
      requireState(["INTAKE", "PRELIMINARY"].includes(item.phase), "ระยะงานนี้ขอโอนสำนวนไม่ได้");
      requireState(!["TRANSFER_APPROVAL_PENDING", "TRANSFER_PENDING"].includes(item.assignment.state), "สำนวนนี้มีคำขอโอนที่กำลังดำเนินการอยู่แล้ว");
      required(payload.target, "ต้องระบุหน่วยรับโอน");
      requireState(TRANSFER_TARGETS.some((entry) => entry.value === payload.target), "หน่วยรับโอนไม่อยู่ในทะเบียนหน่วยงานที่เปิดใช้งาน");
      requireState(payload.target !== item.owningUnit, "หน่วยรับโอนต้องไม่ใช่หน่วยงานเจ้าของสำนวนปัจจุบัน");
      required(payload.reason, "ต้องระบุเหตุผลการโอน");
    },
    mutate: (item, draft, account, payload) => {
      item.assignment.beforeTransferState = item.assignment.state;
      item.assignment.sourceOwningUnit = item.owningUnit;
      item.assignment.state = "TRANSFER_APPROVAL_PENDING";
      item.assignment.transferTarget = payload.target.trim();
      item.assignment.transferReason = payload.reason.trim();
      item.assignment.transferApproval = {
        status: "PENDING",
        requestedAt: demoTime(draft),
        requestedBy: account.name,
        decidedAt: "",
        decidedBy: "",
        decisionReason: "",
        sourceMemoNo: "",
        targetMemoNo: ""
      };
      item.assignment.transferResponse = "PENDING";
      item.assignment.transferResponseReason = "";
    }
  },
  DECIDE_TRANSFER_APPROVAL: {
    permission: "transfer.approve",
    action: "TRANSFER_APPROVAL_DECIDED",
    validate: (item, _draft, _account, payload) => {
      requireState(item.assignment.state === "TRANSFER_APPROVAL_PENDING", "ไม่มีคำขอโอนที่รอเลขาธิการฯ พิจารณา");
      requireState(["APPROVED", "REJECTED"].includes(payload.decision), "ผลพิจารณาคำขอโอนไม่ถูกต้อง");
      required(payload.reason, "ต้องระบุความเห็นประกอบการพิจารณา");
    },
    mutate: (item, draft, account, payload) => {
      item.assignment.transferApproval.status = payload.decision;
      item.assignment.transferApproval.decidedAt = demoTime(draft);
      item.assignment.transferApproval.decidedBy = account.name;
      item.assignment.transferApproval.decisionReason = payload.reason.trim();
      item.assignment.state = payload.decision === "APPROVED"
        ? "TRANSFER_PENDING"
        : item.assignment.beforeTransferState || "UNASSIGNED";
    }
  },
  RESPOND_TRANSFER: {
    permission: "transfer.respond",
    action: "TRANSFER_RESPONDED",
    validate: (item, _draft, account, payload) => {
      requireState(item.assignment.state === "TRANSFER_PENDING", "ไม่มีคำขอโอนที่รอตอบรับ");
      if (!account.allowedOwningUnits?.includes(item.assignment.transferTarget)) {
        deny("transfer.respond", item.id, "TRANSFER_RESPONDED", "เฉพาะธุรการคดีของหน่วยงานปลายทางเท่านั้นที่ตอบรับการโอนได้");
      }
      requireState(["ACCEPT", "REJECT"].includes(payload.decision), "ผลตอบรับคำขอโอนไม่ถูกต้อง");
      if (payload.decision === "ACCEPT") {
        required(payload.sourceMemoNo, "ต้องระบุเลขบันทึกข้อความของหน่วยต้นทาง");
        required(payload.targetMemoNo, "ต้องระบุเลขบันทึกข้อความของหน่วยปลายทาง");
      }
      if (payload.decision === "REJECT") required(payload.reason, "ต้องระบุเหตุผลการปฏิเสธรับโอน");
    },
    mutate: (item, draft, _account, payload) => {
      item.assignment.transferDecision = payload.decision;
      item.assignment.transferDecisionNote = normalizedReason(payload.reason, "รับโอนสำนวน");
      item.assignment.transferResponse = payload.decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";
      item.assignment.transferResponseReason = normalizedReason(payload.reason, payload.decision === "ACCEPT" ? "รับโอนสำนวน" : "ปฏิเสธรับโอน");
      item.assignment.transferApproval.sourceMemoNo = String(payload.sourceMemoNo || "").trim();
      item.assignment.transferApproval.targetMemoNo = String(payload.targetMemoNo || "").trim();
      item.assignment.state = payload.decision === "ACCEPT" ? "UNASSIGNED" : item.assignment.beforeTransferState || "UNASSIGNED";
      if (payload.decision === "ACCEPT") {
        item.owningUnit = item.assignment.transferTarget;
        item.intakeDecision = "ACCEPTED";
        item.assignment.team = "";
        item.assignment.investigator = "";
        item.assignment.assignees = [];
        retargetUnreadNotifications(draft, item);
      } else {
        item.owningUnit = item.assignment.sourceOwningUnit || item.owningUnit;
      }
    }
  },
  ASSIGN_INVESTIGATOR: {
    permission: "assignment.assign",
    action: "INVESTIGATOR_ASSIGNED",
    validate: (item, _draft, _account, payload) => {
      requireState(!["CLOSED", "MERGED", "POST_DECISION"].includes(item.phase), "สำนวนระยะนี้มอบหมายผู้รับผิดชอบไม่ได้");
      requireState(item.assignment.state === "UNASSIGNED", "สำนวนนี้ไม่ได้อยู่ในสถานะรอมอบหมาย");
      requireState(item.assignment.state !== "TRANSFER_PENDING", "ต้องรอผลตอบรับการโอนก่อนมอบหมาย");
      if (item.phase === "INTAKE") requireState(item.intakeDecision === "ACCEPTED", "ต้องตรวจรับเรื่องไว้ดำเนินการก่อนมอบหมายผู้รับผิดชอบ");
      const assignment = requestedAssignment(payload);
      const names = assignment.names;
      required(assignment.lead, "ต้องเลือกผู้รับผิดชอบหลัก 1 คน");
      requireState(names.length > 0, "ต้องเลือกผู้รับผิดชอบอย่างน้อย 1 คน");
      requireState(new Set(names).size === names.length, "พบรายชื่อผู้รับผิดชอบซ้ำกัน");
      required(payload.team, "ต้องระบุชุดปฏิบัติงาน");
      const workType = item.phase === "INQUIRY" ? "INQUIRY" : "PRELIM";
      requireState(names.every((name) => eligibleInvestigator(item, name, workType)), "ผู้รับผิดชอบที่เลือกไม่อยู่ในหน่วยงานหรือประเภทงานของสำนวน");
    },
    mutate: (item, draft, _account, payload) => {
      const startsPreliminaryWork = item.phase === "INTAKE";
      item.assignment.state = "ASSIGNED";
      const workType = item.phase === "INQUIRY" ? "INQUIRY" : "PRELIM";
      const assignment = requestedAssignment(payload);
      item.assignment.assignees = buildAssignees(item, assignment, workType);
      item.assignment.investigator = item.assignment.assignees.map((entry) => entry.name).join(", ");
      item.assignment.team = payload.team.trim();
      if (startsPreliminaryWork) {
        item.phase = "PRELIMINARY";
      }
      if (item.phase === "PRELIMINARY") {
        addDeadlineNotifications(draft, item, {
          reportType: "213",
          sequence: 0,
          checkpoints: createCheckpoints("213", item.report213.startedAt, 60)
        });
      }
      retargetUnreadNotifications(draft, item, item.assignment.assignees.find((entry) => entry.assignmentRole === "LEAD"));
    }
  },
  CHANGE_INVESTIGATOR: {
    permission: "assignment.change",
    action: "INVESTIGATOR_CHANGED",
    validate: (item, _draft, _account, payload) => {
      requireState(["ASSIGNED", "ACKNOWLEDGED", "REASSIGN_PENDING"].includes(item.assignment.state), "สำนวนยังไม่มีผู้รับผิดชอบให้เปลี่ยน");
      const assignment = requestedAssignment(payload);
      const names = assignment.names;
      required(assignment.lead, "ต้องเลือกผู้รับผิดชอบหลัก 1 คน");
      requireState(names.length > 0, "ต้องเลือกผู้รับผิดชอบอย่างน้อย 1 คน");
      requireState(new Set(names).size === names.length, "พบรายชื่อผู้รับผิดชอบซ้ำกัน");
      required(payload.reason, "ต้องระบุเหตุผลการเปลี่ยนผู้รับผิดชอบ");
      const workType = item.phase === "INQUIRY" ? "INQUIRY" : "PRELIM";
      requireState(names.every((name) => eligibleInvestigator(item, name, workType)), "ผู้รับผิดชอบที่เลือกไม่อยู่ในหน่วยงานหรือประเภทงานของสำนวน");
    },
    mutate: (item, draft, _account, payload) => {
      item.assignment.previousInvestigator = item.assignment.investigator;
      const workType = item.phase === "INQUIRY" ? "INQUIRY" : "PRELIM";
      const assignment = requestedAssignment(payload);
      item.assignment.assignees = buildAssignees(item, assignment, workType, item.assignment.assignees || []);
      item.assignment.investigator = item.assignment.assignees.map((entry) => entry.name).join(", ");
      item.assignment.team = payload.team?.trim() || item.assignment.team;
      item.assignment.state = item.assignment.assignees.every((entry) => entry.acknowledgedAt) ? "ACKNOWLEDGED" : "ASSIGNED";
      const lead = item.assignment.assignees.find((entry) => entry.assignmentRole === "LEAD");
      retargetUnreadNotifications(draft, item, lead);
    }
  },
  ACKNOWLEDGE_ASSIGNMENT: {
    permission: "assignment.acknowledge",
    action: "ASSIGNMENT_ACKNOWLEDGED",
    validate: (item, _draft, account) => {
      requireAssignedOwner(item, account);
      const member = item.assignment.assignees.find((entry) => entry.name === account.name);
      requireState(!member.acknowledgedAt, "บัญชีนี้ยืนยันรับผิดชอบสำนวนแล้ว");
      if (account.role === "PRELIM") requireState(item.phase === "PRELIMINARY", "บัญชีนี้รับได้เฉพาะงานแสวงหาข้อเท็จจริงเบื้องต้น");
      if (account.role === "INQUIRY") requireState(item.phase === "INQUIRY", "บัญชีนี้รับได้เฉพาะงานไต่สวนข้อเท็จจริง");
    },
    mutate: (item, draft, account) => {
      const member = item.assignment.assignees.find((entry) => entry.name === account.name);
      member.acknowledgedAt = demoTime(draft);
      item.assignment.state = item.assignment.assignees.every((entry) => entry.acknowledgedAt) ? "ACKNOWLEDGED" : "ASSIGNED";
    }
  },
  SAVE_PLAN: {
    permission: "plan.edit",
    action: "PLAN_SAVED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "PRELIMINARY", "แก้แผนได้เฉพาะระยะแสวงหาข้อเท็จจริงเบื้องต้น");
      requireState(["DRAFT", "RETURNED"].includes(item.plan.status), "แผนที่ส่งตรวจหรืออนุมัติแล้วแก้ไขไม่ได้");
      requireState(Array.isArray(payload.issues) && payload.issues.length === 4, "แผนต้องมี 4 ประเด็นตรวจสอบ");
    },
    mutate: (item, _draft, _account, payload) => {
      item.plan.objective = String(payload.objective || "").trim();
      item.plan.issues = item.plan.issues.map((issue, index) => ({
        ...issue,
        finding: String(payload.issues[index] || "").trim()
      }));
      item.plan.status = "DRAFT";
    }
  },
  SUBMIT_PLAN: {
    permission: "plan.submit",
    action: "PLAN_SUBMITTED",
    validate: (item, _draft, account) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "PRELIMINARY", "เสนอแผนได้เฉพาะสำนวนที่อยู่ระหว่างแสวงหาข้อเท็จจริงเบื้องต้น");
      requireState(["DRAFT", "RETURNED"].includes(item.plan.status), "สถานะแผนไม่พร้อมส่งตรวจ");
      required(item.plan.objective, "ต้องระบุวัตถุประสงค์ของแผน");
      requireState(item.plan.issues.length === 4 && item.plan.issues.every((issue) => issue.finding.trim()), "ต้องกรอกวิธีดำเนินการครบทั้ง 4 ประเด็น");
    },
    mutate: (item) => {
      item.plan.status = "SUBMITTED";
    }
  },
  APPROVE_PLAN: {
    permission: "plan.review",
    action: "PLAN_APPROVED",
    validate: (item) => requireState(item.plan.status === "SUBMITTED", "แผนนี้ไม่ได้รอตรวจ"),
    mutate: (item, _draft, _account, payload) => {
      item.plan.status = "APPROVED";
      item.plan.reviewerNote = String(payload.note || "").trim();
    }
  },
  RETURN_PLAN: {
    permission: "plan.review",
    action: "PLAN_RETURNED",
    validate: (item, _draft, _account, payload) => {
      requireState(item.plan.status === "SUBMITTED", "แผนนี้ไม่ได้รอตรวจ");
      required(payload.reason, "ต้องระบุเหตุผลที่ส่งแผนกลับแก้ไข");
    },
    mutate: (item, _draft, _account, payload) => {
      item.plan.status = "RETURNED";
      item.plan.reviewerNote = payload.reason.trim();
    }
  },
  ADD_WORKLOG: {
    permission: "worklog.edit",
    action: "WORKLOG_ADDED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedMember(item, account);
      requireState(["PRELIMINARY", "INQUIRY"].includes(item.phase), "ระยะงานนี้บันทึกการดำเนินงานไม่ได้");
      if (account.role === "PRELIM") requireState(item.phase === "PRELIMINARY", "บัญชีนี้บันทึกได้เฉพาะงานเบื้องต้น");
      if (account.role === "INQUIRY") requireState(item.phase === "INQUIRY", "บัญชีนี้บันทึกได้เฉพาะงานไต่สวน");
      required(payload.date, "ต้องระบุวันที่ดำเนินการ");
      required(payload.detail, "ต้องระบุรายละเอียดการดำเนินการ");
    },
    mutate: (item, draft, account, payload) => {
      item.worklogs.unshift({
        id: `wl-${draft.eventCounter + 1}`,
        date: payload.date,
        detail: payload.detail.trim(),
        actor: account.name
      });
    }
  },
  ADD_EVIDENCE: {
    permission: "evidence.edit",
    action: "EVIDENCE_ADDED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedMember(item, account);
      requireState(["PRELIMINARY", "INQUIRY"].includes(item.phase), "ระยะงานนี้เพิ่มพยานหลักฐานไม่ได้");
      if (account.role === "PRELIM") requireState(item.phase === "PRELIMINARY", "บัญชีนี้เพิ่มได้เฉพาะหลักฐานงานเบื้องต้น");
      if (account.role === "INQUIRY") requireState(item.phase === "INQUIRY", "บัญชีนี้เพิ่มได้เฉพาะหลักฐานงานไต่สวน");
      required(payload.title, "ต้องระบุชื่อพยานหลักฐาน");
      required(payload.type, "ต้องระบุประเภทพยานหลักฐาน");
      required(payload.source, "ต้องระบุแหล่งที่มา");
    },
    mutate: (item, draft, _account, payload) => {
      item.evidence.unshift({
        id: `ev-${draft.eventCounter + 1}`,
        title: payload.title.trim(),
        type: payload.type.trim(),
        source: payload.source.trim(),
        integrity: payload.integrity?.trim() || "รอตรวจรับ"
      });
    }
  },
  UPDATE_REPORT_213: {
    permission: "report213.edit",
    action: "REPORT_213_SAVED",
    validate: (item, _draft, account) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "PRELIMINARY", "แก้รายงาน 213 ได้เฉพาะระยะแสวงหาข้อเท็จจริงเบื้องต้น");
      requireState(["DRAFT", "RETURNED"].includes(item.report213.status), "รายงานที่ส่งตรวจหรือล็อกแล้วแก้ไขไม่ได้");
    },
    mutate: (item, draft, account, payload) => {
      item.report213.summary = String(payload.summary || "").trim();
      item.report213.recommendation = String(payload.recommendation || "").trim();
      item.report213.status = "DRAFT";
      snapshotReport(item, "213", draft, account, "SAVE");
    }
  },
  SUBMIT_REPORT_213: {
    permission: "report213.submit",
    action: "REPORT_213_SUBMITTED",
    validate: (item, _draft, account) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "PRELIMINARY", "เสนอรายงาน 213 ได้เฉพาะสำนวนที่อยู่ระหว่างแสวงหาข้อเท็จจริงเบื้องต้น");
      requireState(["DRAFT", "RETURNED"].includes(item.report213.status), "สถานะรายงาน 213 ไม่พร้อมส่งตรวจ");
      requireState(item.plan.status === "APPROVED", "แผนต้องได้รับอนุมัติก่อนส่งรายงาน 213");
      requireState(item.plan.issues.length === 4 && item.plan.issues.every((issue) => issue.finding.trim()), "ข้อมูล 4 ประเด็นยังไม่ครบ");
      required(item.report213.summary, "ต้องกรอกสรุปข้อเท็จจริง");
      required(item.report213.recommendation, "ต้องกรอกความเห็นเสนอ");
    },
    mutate: (item, draft, account) => {
      item.report213.status = "SUBMITTED";
      withdrawPendingExtensions(item.report213, draft, account);
      cancelDeadlineNotifications(draft, item, "213");
      snapshotReport(item, "213", draft, account, "SUBMIT");
    }
  },
  REQUEST_EXTENSION: {
    permission: "extension.request",
    action: "EXTENSION_REQUESTED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      const rule = extensionRule(payload.reportType);
      required(payload.reason, "ต้องระบุเหตุผลการขยายเวลา");
      requireState(Number.isInteger(Number(payload.days)) && Number(payload.days) > 0, "จำนวนวันต้องเป็นจำนวนเต็มมากกว่า 0");
      requireState(Number(payload.days) <= rule.maxDays, `ขยายเวลาได้ครั้งละไม่เกิน ${rule.maxDays} วัน`);
      if (payload.reportType === "213") {
        requireState(account.role === "PRELIM" && item.phase === "PRELIMINARY", "ขอขยายเวลา 213 ได้เฉพาะผู้รับผิดชอบในระยะเบื้องต้น");
      } else {
        requireState(account.role === "INQUIRY" && item.phase === "INQUIRY", "ขอขยายเวลา 644 ได้เฉพาะผู้รับผิดชอบในระยะไต่สวน");
      }
      const report = reportFor(item, payload.reportType);
      requireState(["DRAFT", "RETURNED"].includes(report.status), `ขอขยายเวลาไม่ได้เมื่อรายงาน ${payload.reportType} ส่งตรวจหรือเสร็จสิ้นแล้ว`);
      requireState(!report.extensionHistory.some((extension) => extension.status === "PENDING"), "มีคำขอขยายเวลารอตัดสินอยู่แล้ว");
      requireState(!report.extensionHistory.some((extension) => extension.status === "REJECTED"), "คำขอเดิมไม่อนุมัติ และเอกสารที่ใช้จัดทำระบบไม่ได้กำหนดวิธียื่นคำขอใหม่");
      requireState(approvedExtensions(report).length < rule.maxApproved, `อนุมัติขยายเวลาครบ ${rule.maxApproved} ครั้งแล้ว ต้องจัดทำรายงานเหตุล่าช้า`);
      requireState(daysUntil(_draft.demoDate, report.deadlineAt) >= 15, "เหลือเวลาน้อยกว่า 15 วันก่อนครบกำหนด และเอกสารที่ใช้จัดทำระบบไม่ได้กำหนดวิธีดำเนินการกรณียื่นล่าช้า");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      const sequence = approvedExtensions(report).length + 1;
      report.extensionHistory.push({
        id: `ext-${item.id}-${draft.eventCounter + 1}`,
        reportType: payload.reportType,
        sequence,
        authorityTier: authorityForRound(payload.reportType, sequence),
        requestedDays: Number(payload.days),
        reason: payload.reason.trim(),
        status: "PENDING",
        requestedAt: demoTime(draft),
        requestedBy: account.name,
        decidedAt: "",
        decidedBy: "",
        checkpoints: []
      });
    }
  },
  DECIDE_EXTENSION: {
    permission: null,
    action: "EXTENSION_DECIDED",
    validate: (item, _draft, _account, payload) => {
      extensionRule(payload.reportType);
      requireState(["APPROVED", "REJECTED"].includes(payload.decision), "ผลพิจารณาคำขอไม่ถูกต้อง");
      if (payload.decision === "REJECTED") required(payload.reason, "ต้องระบุเหตุผลที่ไม่อนุมัติ");
      const report = reportFor(item, payload.reportType);
      requireState(report.extensionHistory.some((extension) => extension.id === payload.extensionId && extension.status === "PENDING"), "ไม่พบคำขอที่รอพิจารณา");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      const extension = report.extensionHistory.find((entry) => entry.id === payload.extensionId);
      extension.status = payload.decision;
      extension.decisionReason = normalizedReason(payload.reason, "อนุมัติตามคำขอ");
      extension.decidedAt = demoTime(draft);
      extension.decidedBy = account.name;
      if (payload.decision === "APPROVED") {
        const periodStartedAt = report.deadlineAt;
        extension.periodStartedAt = periodStartedAt;
        report.deadlineAt = addDays(report.deadlineAt, extension.requestedDays);
        extension.checkpoints = createCheckpoints(payload.reportType, periodStartedAt, extension.requestedDays);
        addDeadlineNotifications(draft, item, extension);
        if (approvedExtensions(report).length >= extensionRule(payload.reportType).maxApproved) {
          report.exhaustion.status = "AVAILABLE";
        }
      }
    }
  },
  CREATE_EXHAUSTION_REPORT: {
    permission: "extension.exhaustion.create",
    action: "TIME_EXHAUSTION_REPORT_CREATED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      const report = reportFor(item, payload.reportType);
      requireState(approvedExtensions(report).length >= extensionRule(payload.reportType).maxApproved, "ยังใช้รอบขยายเวลาที่อนุมัติไม่ครบ");
      requireState(_draft.demoDate > report.deadlineAt, "จัดทำรายงานเหตุล่าช้าได้เมื่อพ้นกำหนดเวลาหลังขยายครบทุกครั้งแล้ว");
      requireState(!["SUBMITTED", "READY_TO_SEND", "LOCKED"].includes(report.status), "รายงานฉบับนี้เสร็จและส่งเข้าสู่ขั้นตอนตรวจแล้ว");
      requireState(["NOT_REQUIRED", "AVAILABLE"].includes(report.exhaustion.status), "รายงานเหตุล่าช้าถูกจัดทำแล้ว");
      ["reasonAndNecessity", "pastActions", "remainingActions", "obstacles", "expectedCompletionAt"].forEach((field) => required(payload[field], `ต้องระบุ ${field}`));
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.exhaustion, {
        status: "AWAITING_CHAIN_OPINION",
        reasonAndNecessity: payload.reasonAndNecessity.trim(),
        pastActions: payload.pastActions.trim(),
        remainingActions: payload.remainingActions.trim(),
        obstacles: payload.obstacles.trim(),
        expectedCompletionAt: payload.expectedCompletionAt,
        createdAt: demoTime(draft),
        createdBy: account.name
      });
    }
  },
  ADD_CHAIN_OPINION: {
    permission: "extension.chain.opinion",
    action: "TIME_EXHAUSTION_CHAIN_OPINION_ADDED",
    validate: (item, _draft, _account, payload) => {
      const report = reportFor(item, payload.reportType);
      requireState(report.exhaustion.status === "AWAITING_CHAIN_OPINION", "รายงานนี้ไม่ได้รอความเห็นหัวหน้าพนักงาน ป.ป.ท.");
      required(payload.opinion, "ต้องระบุความเห็นประกอบรายงาน");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.exhaustion, {
        status: "AWAITING_SECRETARY",
        chainOpinion: payload.opinion.trim(),
        chainOpinionAt: demoTime(draft),
        chainOpinionBy: account.name
      });
    }
  },
  SECRETARY_FINALIZE_ESCALATION: {
    permission: "extension.escalation.finalize",
    action: "TIME_EXHAUSTION_SECRETARY_FINALIZED",
    validate: (item, _draft, _account, payload) => {
      const report = reportFor(item, payload.reportType);
      requireState(report.exhaustion.status === "AWAITING_SECRETARY", "รายงานนี้ไม่ได้รอเลขาธิการฯ พิจารณา");
      required(payload.opinion, "ต้องระบุความเห็นของเลขาธิการฯ");
      required(payload.remedy, "ต้องระบุแนวทางแก้ไขให้สำนวนแล้วเสร็จ");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.exhaustion, {
        status: "READY_TO_SEND",
        secretaryOpinion: payload.opinion.trim(),
        remedy: payload.remedy.trim(),
        finalizedAt: demoTime(draft),
        finalizedBy: account.name
      });
    }
  },
  SEND_TIME_ESCALATION_TO_A7: {
    permission: "extension.escalation.send",
    action: "TIME_EXHAUSTION_SENT_TO_ACTIVITY7",
    validate: (item, _draft, _account, payload) => {
      const report = reportFor(item, payload.reportType);
      requireState(report.exhaustion.status === "READY_TO_SEND", "รายงานเหตุล่าช้ายังไม่พร้อมส่ง หรือเคยส่งแล้ว");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.exhaustion, {
        status: "SENT",
        sentAt: demoTime(draft),
        sentBy: account.name,
        messageId: `TIME-${payload.reportType}-${draft.demoDate.replaceAll("-", "")}-${draft.eventCounter + 1}`
      });
    }
  },
  RECEIVE_TIME_ESCALATION_DIRECTIVE: {
    permission: "activity7.receive",
    action: "TIME_EXHAUSTION_DIRECTIVE_RECEIVED",
    idempotencyBeforeVersion: true,
    validate: (item, _draft, _account, payload) => {
      const report = reportFor(item, payload.reportType);
      const exhaustion = report.exhaustion;
      requireState(["SENT", "DIRECTIVE_RECEIVED"].includes(exhaustion.status), "รายงานเหตุล่าช้ายังไม่ได้เสนอ หรือยังไม่พร้อมรับข้อสั่งการ");
      required(payload.messageId, "ต้องระบุรหัสข้อความผลพิจารณา");
      required(payload.correlationId, "ต้องระบุรหัสอ้างอิงรายการที่เสนอ");
      requireState(payload.correlationId === exhaustion.messageId, "รหัสอ้างอิงไม่ตรงกับรายงานเหตุล่าช้าที่เสนอ");
      required(payload.directive, "ต้องระบุผลพิจารณาหรือข้อสั่งการ");
      requireIsoDate(payload.meetingDate, "วันที่ประชุม");
      required(payload.meetingNo, "ต้องระบุครั้งที่ประชุม");
      requireState(payload.meetingDate >= String(exhaustion.sentAt || "").slice(0, 10), "วันที่ประชุมต้องไม่ก่อนวันที่เสนอรายงานเหตุล่าช้า");
      requireState(payload.meetingDate <= _draft.demoDate, "วันที่ประชุมต้องไม่เป็นวันที่ในอนาคต");
      const prior = (exhaustion.inboundMessages || []).find((entry) => entry.messageId === payload.messageId);
      if (prior) {
        const same = prior.correlationId === payload.correlationId
          && prior.directive === payload.directive.trim()
          && prior.meetingDate === payload.meetingDate
          && prior.meetingNo === payload.meetingNo.trim();
        if (same) return { idempotent: true };
        payload._directiveConflict = true;
        return;
      }
      if (exhaustion.status === "DIRECTIVE_RECEIVED") payload._directiveConflict = true;
    },
    mutate: (item, draft, account, payload) => {
      const exhaustion = reportFor(item, payload.reportType).exhaustion;
      const inbound = {
        messageId: payload.messageId.trim(),
        correlationId: payload.correlationId.trim(),
        directive: payload.directive.trim(),
        meetingDate: payload.meetingDate,
        meetingNo: payload.meetingNo.trim(),
        receivedAt: demoTime(draft)
      };
      if (payload._directiveConflict) {
        exhaustion.quarantinedInbound = [...(exhaustion.quarantinedInbound || []), inbound];
        exhaustion.directiveWarning = "ได้รับข้อสั่งการซ้ำที่ขัดกับข้อสั่งการหลัก ระบบเก็บไว้ตรวจสอบโดยไม่ทับผลเดิม";
        return;
      }
      exhaustion.status = "DIRECTIVE_RECEIVED";
      exhaustion.inboundMessageId = inbound.messageId;
      exhaustion.correlationId = inbound.correlationId;
      exhaustion.directive = inbound.directive;
      exhaustion.meetingDate = inbound.meetingDate;
      exhaustion.meetingNo = inbound.meetingNo;
      exhaustion.receivedAt = inbound.receivedAt;
      exhaustion.receivedBy = account.name;
      exhaustion.inboundMessages = [...(exhaustion.inboundMessages || []), inbound];
      exhaustion.directiveWarning = "";
    }
  },
  APPROVE_REPORT: {
    permission: null,
    action: "REPORT_APPROVED",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      requireState(report.status === "SUBMITTED", `รายงาน ${payload.reportType} ไม่ได้รอตรวจ`);
      required(payload.reason, "ต้องระบุเหตุผลการเห็นชอบรายงาน");
    },
    mutate: (item, draft, account, payload) => {
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      report.status = "AWAITING_SECRETARY";
      report.reviewerNote = String(payload.note || "").trim();
      report.secretaryReview = {
        ...report.secretaryReview,
        status: "PENDING",
        complexityDecision: "",
        outboundAt: "",
        outboundBy: "",
        supportOpinion: "",
        supportOpinionAt: "",
        returnedReason: "",
        finalizedAt: "",
        finalizedBy: ""
      };
      snapshotReport(item, payload.reportType, draft, account, "APPROVE");
    }
  },
  SECRETARY_REVIEW_REPORT: {
    permission: "report.secretary.review",
    action: "REPORT_SECRETARY_REVIEWED",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const report = reportFor(item, payload.reportType);
      requireState(report.status === "AWAITING_SECRETARY", `รายงาน ${payload.reportType} ไม่ได้รอเลขาธิการฯ พิจารณา`);
      requireState(["PENDING", "SUPPORT_OPINION_RECEIVED"].includes(report.secretaryReview?.status), "รายงานอยู่ระหว่างรอความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ");
      requireState(["READY", "RETURN", "REFER_SUPPORT"].includes(payload.decision), "ผลพิจารณารายงานไม่ถูกต้อง");
      required(payload.reason, "ต้องระบุความเห็นประกอบการพิจารณา");
      if (payload.decision === "REFER_SUPPORT") {
        requireState(report.secretaryReview.status === "PENDING", "ส่งขอความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ ซ้ำไม่ได้");
      }
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      if (payload.decision === "REFER_SUPPORT") {
        Object.assign(report.secretaryReview, {
          status: "SUPPORT_ORDERED",
          complexityDecision: "NEEDS_ADDITIONAL_OPINION",
          disputedIssue: payload.reason.trim(),
          orderedAt: demoTime(draft),
          orderedBy: account.name
        });
        return;
      }
      if (payload.decision === "RETURN") {
        report.status = "RETURNED";
        report.reviewerNote = payload.reason.trim();
        Object.assign(report.secretaryReview, {
          status: "RETURNED",
          returnedReason: payload.reason.trim(),
          finalizedAt: demoTime(draft),
          finalizedBy: account.name
        });
        snapshotReport(item, payload.reportType, draft, account, "SECRETARY_RETURN");
        return;
      }
      report.status = "READY_TO_SEND";
      report.reviewerNote = payload.reason.trim();
      Object.assign(report.secretaryReview, {
        status: "READY",
        complexityDecision: report.secretaryReview.complexityDecision || "NOT_COMPLEX",
        finalizedAt: demoTime(draft),
        finalizedBy: account.name
      });
      snapshotReport(item, payload.reportType, draft, account, "SECRETARY_READY");
    }
  },
  DISPATCH_SUPPORT_SUBCOMMITTEE: {
    permission: "support.dispatch",
    action: "SUPPORT_SUBCOMMITTEE_DISPATCHED",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const report = reportFor(item, payload.reportType);
      requireState(report.status === "AWAITING_SECRETARY" && report.secretaryReview?.status === "SUPPORT_ORDERED", "เลขาธิการฯ ยังไม่ได้สั่งให้ส่งเรื่องขอความเห็น หรือส่งแล้ว");
      required(payload.dispatchNote, "ต้องระบุรายละเอียดหนังสือหรือการส่งเรื่อง");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.secretaryReview, {
        status: "SUPPORT_PENDING",
        outboundAt: demoTime(draft),
        outboundBy: account.name,
        outboundNote: payload.dispatchNote.trim()
      });
    }
  },
  RECORD_SUPPORT_SUBCOMMITTEE_OPINION: {
    permission: "support.opinion.record",
    action: "SUPPORT_SUBCOMMITTEE_OPINION_RECORDED",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const report = reportFor(item, payload.reportType);
      requireState(report.status === "AWAITING_SECRETARY" && report.secretaryReview?.status === "SUPPORT_PENDING", "รายงานนี้ไม่ได้รอความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ");
      required(payload.opinion, "ต้องระบุความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ");
    },
    mutate: (item, draft, account, payload) => {
      const report = reportFor(item, payload.reportType);
      Object.assign(report.secretaryReview, {
        status: "SUPPORT_OPINION_RECEIVED",
        supportOpinion: payload.opinion.trim(),
        supportOpinionAt: demoTime(draft),
        supportOpinionRecordedBy: account.name
      });
    }
  },
  RETURN_REPORT: {
    permission: null,
    action: "REPORT_RETURNED",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      requireState(report.status === "SUBMITTED", `รายงาน ${payload.reportType} ไม่ได้รอตรวจ`);
      required(payload.reason, "ต้องระบุเหตุผลที่ส่งรายงานกลับแก้ไข");
    },
    mutate: (item, draft, account, payload) => {
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      report.status = "RETURNED";
      report.reviewerNote = payload.reason.trim();
      if (payload.reportType === "213") reactivateDeadlineNotifications(draft, item, "213");
      snapshotReport(item, payload.reportType, draft, account, "RETURN");
    }
  },
  REQUEST_SUPPLEMENTAL_INQUIRY_EXTENSION: {
    permission: "extension.request",
    action: "SUPPLEMENTAL_INQUIRY_EXTENSION_REQUESTED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      const supplemental = item.report644.supplementalInquiry;
      requireState(item.phase === "INQUIRY" && item.report644.status === "RETURNED", "สำนวนนี้ไม่ได้อยู่ระหว่างไต่สวนเพิ่มเติมตามคำสั่งส่งกลับ");
      requireState(supplemental?.status === "ACTIVE", "ไม่มีกรอบไต่สวนเพิ่มเติม 30 วันที่เปิดให้ขอขยาย");
      requireState(_draft.demoDate > supplemental.deadlineAt, "ยังไม่พ้นกรอบไต่สวนเพิ่มเติม 30 วัน");
      required(payload.reason, "ต้องระบุเหตุผลและความจำเป็นที่ต้องเสนอคณะกรรมการ ป.ป.ท.");
    },
    mutate: (item, draft, account, payload) => {
      Object.assign(item.report644.supplementalInquiry, {
        status: "PENDING_BOARD",
        extensionReason: payload.reason.trim(),
        requestedAt: demoTime(draft),
        requestedBy: account.name
      });
    }
  },
  DECIDE_SUPPLEMENTAL_INQUIRY_EXTENSION: {
    permission: "activity7.receive",
    action: "SUPPLEMENTAL_INQUIRY_EXTENSION_DECIDED",
    validate: (item, _draft, _account, payload) => {
      const supplemental = item.report644.supplementalInquiry;
      requireState(supplemental?.status === "PENDING_BOARD", "ไม่มีคำขอขยายการไต่สวนเพิ่มเติมที่รอผลพิจารณา");
      requireState(["APPROVED", "REJECTED"].includes(payload.decision), "ผลพิจารณาไม่ถูกต้อง");
      required(payload.reason, "ต้องระบุผลหรือเหตุผลจากคณะกรรมการ ป.ป.ท.");
      if (payload.decision === "APPROVED") {
        requireState(Number.isInteger(Number(payload.days)) && Number(payload.days) > 0, "ต้องระบุจำนวนวันที่คณะกรรมการ ป.ป.ท. อนุมัติ");
      }
    },
    mutate: (item, draft, account, payload) => {
      const supplemental = item.report644.supplementalInquiry;
      supplemental.status = payload.decision === "APPROVED" ? "ACTIVE" : "REJECTED";
      supplemental.extensionDecision = payload.decision;
      supplemental.extensionDecisionReason = payload.reason.trim();
      supplemental.extensionDays = payload.decision === "APPROVED" ? Number(payload.days) : 0;
      if (payload.decision === "APPROVED") supplemental.deadlineAt = addDays(supplemental.deadlineAt, Number(payload.days));
      supplemental.decidedAt = demoTime(draft);
      supplemental.decidedBy = account.name;
    }
  },
  SEND_ACTIVITY7: {
    permission: "activity7.send",
    action: "ACTIVITY7_SENT",
    validate: (item, _draft, _account, payload) => {
      requireState(["213", "644"].includes(payload.reportType), "ประเภทรายงานไม่ถูกต้อง");
      const activeOutbound = ["SENT", "ACKED", "FAILED", "QUARANTINED"].includes(item.integration.status)
        || (item.integration.status === "DECISION_RECEIVED" && String(item.phase).startsWith("WAIT_A7"));
      requireState(
        !(item.integration.reportType === payload.reportType && activeOutbound),
        `รายงาน ${payload.reportType} ถูกสร้างรายการส่งแล้ว ห้ามส่งซ้ำ`
      );
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      requireState(report.status === "READY_TO_SEND", `รายงาน ${payload.reportType} ยังไม่พร้อมส่ง`);
    },
    mutate: (item, draft, _account, payload) => {
      const report = payload.reportType === "213" ? item.report213 : item.report644;
      report.status = "LOCKED";
      item.phase = payload.reportType === "213" ? "WAIT_A7_213" : "WAIT_A7_644";
      const messageId = `OUT-${payload.reportType}-${draft.demoDate.replaceAll("-", "")}-${draft.eventCounter + 1}`;
      item.integration = {
        ...item.integration,
        status: payload.simulateFailure ? "FAILED" : "SENT",
        reportType: payload.reportType,
        messageId,
        decision: "",
        decisionLabel: "",
        inboundMessageId: "",
        correlationId: "",
        finalizedAt: "",
        meetingDate: "",
        meetingNo: "",
        meetingNote: "",
        lastError: payload.simulateFailure ? "การส่งออกไม่สำเร็จ สามารถสั่งลองส่งใหม่ได้" : "",
        attempts: [...(item.integration.attempts || []), { sequence: (item.integration.attempts || []).length + 1, at: demoTime(draft), status: payload.simulateFailure ? "FAILED" : "SENT" }]
      };
      item.handoff.status = "AWAITING_EXTERNAL";
      item.handoff.target = "คณะกรรมการ ป.ป.ท.";
      item.handoff.note = `ส่งรายงาน ${payload.reportType} แล้ว`;
    }
  },
  RETRY_ACTIVITY7_SEND: {
    permission: "activity7.send",
    action: "ACTIVITY7_SEND_RETRIED",
    validate: (item, _draft, _account, payload) => {
      requireState(item.integration.status === "FAILED", "ลองส่งใหม่ได้เฉพาะรายการที่ส่งไม่สำเร็จ");
      requireState(item.integration.reportType === payload.reportType, "ประเภทรายงานไม่ตรงกับรายการส่งเดิม");
    },
    mutate: (item, draft, _account, payload) => {
      const sequence = (item.integration.attempts || []).length + 1;
      item.integration.status = payload.simulateFailure ? "FAILED" : "SENT";
      item.integration.lastError = payload.simulateFailure ? "การลองส่งครั้งล่าสุดไม่สำเร็จ" : "";
      item.integration.attempts = [...(item.integration.attempts || []), {
        sequence,
        at: demoTime(draft),
        status: item.integration.status
      }];
    }
  },
  RECEIVE_ACTIVITY7: {
    permission: "activity7.receive",
    action: "ACTIVITY7_RESULT_RECEIVED",
    idempotencyBeforeVersion: true,
    validate: (item, _draft, _account, payload) => {
      required(payload.result, "ต้องเลือกผลการพิจารณา");
      requireIsoDate(payload.meetingDate, "วันที่ประชุม");
      required(payload.meetingNo, "ต้องระบุครั้งที่ประชุม");
      required(payload.meetingNote, "ต้องระบุบันทึกผลการพิจารณา");
      required(payload.messageId, "ไม่สามารถบันทึกผลได้ กรุณาปิดหน้าต่างแล้วเปิดใหม่");
      required(payload.correlationId, "ไม่พบรายการเสนอเดิม กรุณาตรวจสอบสถานะสำนวน");
      const outboundAt = (item.integration.attempts || []).filter((entry) => entry.status === "SENT").at(-1)?.at
        || item.integration.attempts?.at(-1)?.at
        || "";
      requireState(payload.meetingDate >= String(outboundAt).slice(0, 10), "วันที่ประชุมต้องไม่ก่อนวันที่เสนอรายงาน");
      requireState(payload.meetingDate <= _draft.demoDate, "วันที่ประชุมต้องไม่เป็นวันที่ในอนาคต");
      const reportType = item.integration.reportType || (item.phase === "WAIT_A7_213" ? "213" : item.phase === "WAIT_A7_644" ? "644" : "");
      const callback = {
        result: payload.result,
        correlationId: payload.correlationId,
        meetingDate: payload.meetingDate,
        meetingNo: payload.meetingNo,
        meetingNote: payload.meetingNote,
        directives: callbackDirectives(reportType, payload.result, payload.directives)
      };
      const prior = (item.integration.inboundMessages || []).find((message) => message.messageId === payload.messageId);
      if (prior) {
        if (sameCallback(prior, callback)) return { idempotent: true };
        payload._receiveMode = "QUARANTINE_DUPLICATE";
        payload._preservePrimary = Boolean(item.integration.finalizedAt);
        return;
      }
      if (item.integration.finalizedAt) {
        payload._receiveMode = "QUARANTINE_FINALIZED";
        payload._preservePrimary = true;
        return;
      }
      if (payload.correlationId !== item.integration.messageId) {
        payload._receiveMode = "QUARANTINE_CORRELATION";
        return;
      }
      if (!getResultOptions(reportType).some((option) => option.value === payload.result)) {
        payload._receiveMode = "QUARANTINE_UNKNOWN";
        return;
      }
      requireState(["WAIT_A7_213", "WAIT_A7_644"].includes(item.phase), "สำนวนนี้ไม่ได้อยู่ระหว่างรอผลการพิจารณา");
      requireState(["SENT", "ACKED", "QUARANTINED"].includes(item.integration.status), "รายการส่งออกยังไม่พร้อมรับผล");
      payload._directives = boardDirectives(reportType, payload.result, payload.directives);
    },
    mutate: (item, draft, _account, payload) => {
      const reportType = item.integration.reportType || (item.phase === "WAIT_A7_213" ? "213" : "644");
      const received = {
        messageId: payload.messageId.trim(),
        correlationId: payload.correlationId.trim(),
        result: payload.result,
        receivedAt: demoTime(draft),
        meetingDate: payload.meetingDate,
        meetingNo: payload.meetingNo.trim(),
        meetingNote: payload.meetingNote.trim(),
        directives: normalizeDirectives(payload._directives || payload.directives)
      };
      if (payload._receiveMode) {
        const errors = {
          QUARANTINE_DUPLICATE: "พบผลรายการเดิมที่มีรายละเอียดไม่ตรงกัน",
          QUARANTINE_FINALIZED: "ได้รับผลใหม่หลังบันทึกผลการพิจารณาเสร็จสิ้นแล้ว",
          QUARANTINE_CORRELATION: "รหัสอ้างอิงไม่ตรงกับข้อความขาออก",
          QUARANTINE_UNKNOWN: "ผลการพิจารณาที่ได้รับไม่อยู่ในรายการที่กำหนด"
        };
        const callbackError = errors[payload._receiveMode];
        item.integration.quarantinedCallbacks = [...(item.integration.quarantinedCallbacks || []), {
          ...received,
          reason: callbackError
        }];
        if (payload._preservePrimary) {
          item.integration.callbackWarning = callbackError;
          return;
        }
        item.integration.status = "QUARANTINED";
        item.integration.lastError = callbackError;
        if (payload._receiveMode === "QUARANTINE_UNKNOWN") {
          item.integration.inboundMessages = [...(item.integration.inboundMessages || []), received];
        }
        return;
      }
      item.integration.reportType = reportType;
      item.integration.decision = payload.result;
      item.integration.decisionLabel = getResultLabel(payload.result, reportType);
      item.integration.directives = normalizeDirectives(payload._directives);
      item.integration.inboundMessageId = payload.messageId.trim();
      item.integration.correlationId = payload.correlationId.trim();
      item.integration.inboundMessages = [...(item.integration.inboundMessages || []), received];
      item.integration.status = "DECISION_RECEIVED";
      item.integration.lastError = "";
      item.integration.callbackWarning = "";
      item.integration.finalizedAt = received.receivedAt;
      item.integration.meetingDate = payload.meetingDate;
      item.integration.meetingNo = payload.meetingNo.trim();
      item.integration.meetingNote = payload.meetingNote.trim();
      if (reportType === "213") {
        if (["ACCEPT_EMPLOYEE_PANEL", "ACCEPT_SUBCOMMITTEE"].includes(payload.result)) {
          item.handoff.status = "PENDING";
          item.handoff.target = "งานไต่สวนข้อเท็จจริง";
          item.handoff.note = "รอส่งมอบสำนวนให้ผู้รับผิดชอบงานไต่สวน";
        } else if (payload.result === "MORE_PRELIMINARY") {
          item.phase = "PRELIMINARY";
          item.report213.status = "RETURNED";
          item.report213.reviewerNote = "ผลพิจารณาให้แสวงหาข้อเท็จจริงเพิ่มเติม";
          reactivateDeadlineNotifications(draft, item, "213");
          snapshotReport(item, "213", draft, _account, "RETURN_FROM_ACTIVITY7");
          item.handoff.status = "REOPENED";
          item.handoff.target = "กลุ่มแสวงหาข้อเท็จจริง";
        } else {
          item.phase = "POST_DECISION";
          item.handoff.status = "PENDING";
          item.handoff.target = "รอกำหนดปลายทางตามผลพิจารณา";
        }
      } else if (payload.result === "MORE_INQUIRY") {
        item.phase = "INQUIRY";
        item.report644.status = "RETURNED";
        item.report644.reviewerNote = "ผลพิจารณาให้ไต่สวนเพิ่มเติม";
        item.report644.supplementalInquiry = {
          ...item.report644.supplementalInquiry,
          status: "ACTIVE",
          startedAt: draft.demoDate,
          deadlineAt: addDays(draft.demoDate, 30),
          reason: payload.meetingNote.trim(),
          extensionReason: "",
          extensionDecision: "",
          extensionDays: 0,
          requestedAt: "",
          decidedAt: "",
          decidedBy: ""
        };
        snapshotReport(item, "644", draft, _account, "RETURN_FROM_ACTIVITY7");
        item.handoff.status = "REOPENED";
      } else {
        item.phase = "POST_DECISION";
        item.handoff.status = "PENDING";
        item.handoff.target = "รอดำเนินการหลังมีมติ";
      }
    }
  },
  HANDOFF_INQUIRY: {
    permission: "handoff.inquiry",
    action: "INQUIRY_HANDOFF_COMPLETED",
    validate: (item, _draft, _account, payload) => {
      requireState(item.phase === "WAIT_A7_213" && item.integration.status === "DECISION_RECEIVED", "ยังไม่มีผลพิจารณารับไว้ไต่สวน");
      requireState(["ACCEPT_EMPLOYEE_PANEL", "ACCEPT_SUBCOMMITTEE"].includes(item.integration.decision), "ผลพิจารณานี้ส่งมอบงานไต่สวนไม่ได้");
      const expectedType = item.integration.decision === "ACCEPT_EMPLOYEE_PANEL" ? "EMPLOYEE_PANEL" : "SUBCOMMITTEE";
      const expectedSignatory = expectedType === "EMPLOYEE_PANEL" ? "SECRETARY" : "CHAIR";
      requireState(payload.appointmentType === expectedType, "ประเภทคณะไต่สวนไม่ตรงกับมติคณะกรรมการฯ");
      requireState(payload.signatory === expectedSignatory, "ผู้ลงนามคำสั่งไม่ตรงกับประเภทคณะไต่สวน");
      required(payload.orderNo, "ต้องระบุเลขคำสั่งไต่สวน");
      requireIsoDate(payload.orderDate, "วันที่ลงนามคำสั่งไต่สวน");
      requireState(payload.orderDate >= item.integration.meetingDate, "วันที่ลงนามคำสั่งต้องไม่ก่อนวันที่คณะกรรมการฯ มีมติ");
      requireState(payload.orderDate <= _draft.demoDate, "วันที่ลงนามคำสั่งต้องไม่เป็นวันที่ในอนาคต");
      if (expectedType === "SUBCOMMITTEE") required(item.integration.meetingDate, "ไม่พบวันที่ประชุมที่มีมติแต่งตั้งคณะอนุกรรมการไต่สวน");
      const assignment = requestedAssignment(payload);
      const names = assignment.names;
      required(assignment.lead, "ต้องระบุผู้รับผิดชอบหลักงานไต่สวน 1 คน");
      requireState(names.length > 0, "ต้องระบุผู้รับผิดชอบงานไต่สวนอย่างน้อย 1 คน");
      requireState(new Set(names).size === names.length, "พบรายชื่อผู้รับผิดชอบซ้ำกัน");
      requireState(names.every((name) => eligibleInvestigator(item, name, "INQUIRY")), "ผู้รับผิดชอบที่เลือกไม่อยู่ในหน่วยงานหรือประเภทงานไต่สวนของสำนวน");
    },
    mutate: (item, _draft, _account, payload) => {
      const isEmployeePanel = payload.appointmentType === "EMPLOYEE_PANEL";
      const teamLabel = isEmployeePanel ? "คณะพนักงานไต่สวน" : "คณะอนุกรรมการไต่สวน";
      const signatoryLabel = isEmployeePanel ? "เลขาธิการคณะกรรมการ ป.ป.ท." : "ประธานกรรมการ ป.ป.ท.";
      const startedAt = isEmployeePanel ? payload.orderDate : item.integration.meetingDate;
      item.phase = "INQUIRY";
      item.assignment = {
        ...item.assignment,
        state: "ASSIGNED",
        team: teamLabel,
        assignees: buildAssignees(item, requestedAssignment(payload), "INQUIRY"),
        investigator: requestedAssignment(payload).names.join(", ")
      };
      item.report644 = {
        ...item.report644,
        status: "DRAFT",
        appointmentType: teamLabel,
        signatory: signatoryLabel,
        orderNo: payload.orderNo.trim(),
        orderDate: payload.orderDate,
        appointmentMeetingDate: isEmployeePanel ? "" : item.integration.meetingDate,
        startedAt,
        deadlineAt: addDays(startedAt, 270)
      };
      item.handoff.status = "ACKNOWLEDGED";
      item.handoff.target = item.assignment.team;
      item.handoff.note = "ส่งมอบข้อมูลสำนวนและบัญชีเอกสารแล้ว";
    }
  },
  PREPARE_ALLEGATION_NOTICE: {
    permission: "report644.edit",
    action: "ALLEGATION_NOTICE_PREPARED",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "จัดทำหนังสือแจ้งข้อกล่าวหาได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      required(payload.accusedName, "ต้องระบุชื่อผู้ถูกกล่าวหา");
      required(payload.letterNo, "ต้องระบุเลขหนังสือแจ้งข้อกล่าวหา");
      required(payload.evidenceBasis, "ต้องระบุพยานหลักฐานที่สนับสนุนข้อกล่าวหา");
      const noticeDate = requireIsoDate(payload.noticeDate, "วันที่หนังสือแจ้งข้อกล่าวหา");
      const appointmentDate = requireIsoDate(payload.appointmentDate, "วันนัดหมาย");
      requireState(noticeDate <= draft.demoDate, "วันที่หนังสือแจ้งข้อกล่าวหาต้องไม่เป็นวันที่ในอนาคต");
      requireState(appointmentDate >= noticeDate, "วันนัดหมายต้องไม่ก่อนวันที่หนังสือแจ้งข้อกล่าวหา");
      const process = normalizeAllegationProcess(item.report644);
      requireState(!process.notices.some((entry) => entry.letterNo === payload.letterNo.trim()), "เลขหนังสือแจ้งข้อกล่าวหานี้ถูกบันทึกแล้ว");
    },
    mutate: (item, draft, account, payload) => {
      const process = normalizeAllegationProcess(item.report644);
      process.evidenceAssessment = process.exceptions.length ? "MIXED" : "SUFFICIENT";
      process.notices.push({
        id: `${item.id}-notice-${process.notices.length + 1}`,
        accusedName: payload.accusedName.trim(),
        letterNo: payload.letterNo.trim(),
        noticeDate: payload.noticeDate,
        appointmentDate: payload.appointmentDate,
        evidenceBasis: payload.evidenceBasis.trim(),
        createdAt: demoTime(draft),
        createdBy: account.name,
        service: { status: "PENDING_APPOINTMENT", method: "", date: "", reference: "", location: "" },
        responses: []
      });
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_APPEARANCE: {
    permission: "report644.edit",
    action: "ALLEGATION_ACKNOWLEDGED_IN_PERSON",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกการรับทราบข้อกล่าวหาได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      const notice = findAllegationNotice(item, payload.noticeId);
      requireState(notice.service.status === "PENDING_APPOINTMENT", "รายการนี้บันทึกผลการแจ้งข้อกล่าวหาแล้ว");
      const serviceDate = requireIsoDate(payload.serviceDate, "วันที่รับทราบข้อกล่าวหา");
      requireState(serviceDate >= notice.noticeDate, "วันที่รับทราบข้อกล่าวหาต้องไม่ก่อนวันที่หนังสือแจ้ง");
      requireState(serviceDate <= draft.demoDate, "วันที่รับทราบข้อกล่าวหาต้องไม่เป็นวันที่ในอนาคต");
      required(payload.serviceReference, "ต้องระบุเลขอ้างอิงบันทึกการรับทราบข้อกล่าวหา");
    },
    mutate: (item, _draft, _account, payload) => {
      const notice = findAllegationNotice(item, payload.noticeId);
      notice.service = {
        status: "SERVED_IN_PERSON",
        method: "IN_PERSON",
        date: payload.serviceDate,
        reference: payload.serviceReference.trim(),
        location: ""
      };
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_POSTAL: {
    permission: "report644.edit",
    action: "ALLEGATION_NOTICE_SENT_BY_POST",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกการส่งไปรษณีย์ได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      const notice = findAllegationNotice(item, payload.noticeId);
      requireState(notice.service.status === "PENDING_APPOINTMENT", "รายการนี้พ้นขั้นตอนบันทึกการไม่มาตามนัดแล้ว");
      const serviceDate = requireIsoDate(payload.serviceDate, "วันที่ส่งไปรษณีย์");
      requireState(serviceDate >= notice.appointmentDate, "วันที่ส่งไปรษณีย์ต้องไม่ก่อนวันนัดหมาย");
      requireState(serviceDate <= draft.demoDate, "วันที่ส่งไปรษณีย์ต้องไม่เป็นวันที่ในอนาคต");
      required(payload.serviceReference, "ต้องระบุเลขสิ่งส่งหรือหลักฐานการส่งไปรษณีย์");
      required(payload.noShowNote, "ต้องบันทึกเหตุที่ผู้ถูกกล่าวหาไม่มารับทราบข้อกล่าวหา");
    },
    mutate: (item, _draft, _account, payload) => {
      const notice = findAllegationNotice(item, payload.noticeId);
      notice.service = {
        status: "POSTAL_SENT",
        method: "POSTAL",
        date: payload.serviceDate,
        reference: payload.serviceReference.trim(),
        location: "",
        noShowNote: payload.noShowNote.trim()
      };
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_POSTAL_RESULT: {
    permission: "report644.edit",
    action: "ALLEGATION_POSTAL_RESULT_RECORDED",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกผลไปรษณีย์ได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      const notice = findAllegationNotice(item, payload.noticeId);
      requireState(notice.service.status === "POSTAL_SENT", "รายการนี้ไม่ได้อยู่ระหว่างรอผลไปรษณีย์");
      requireState(["DELIVERED", "FAILED"].includes(payload.deliveryResult), "ผลการนำส่งไปรษณีย์ไม่ถูกต้อง");
      const resultDate = requireIsoDate(payload.resultDate, "วันที่ทราบผลไปรษณีย์");
      requireState(resultDate >= notice.service.date, "วันที่ทราบผลต้องไม่ก่อนวันที่ส่งไปรษณีย์");
      requireState(resultDate <= draft.demoDate, "วันที่ทราบผลไปรษณีย์ต้องไม่เป็นวันที่ในอนาคต");
      required(payload.resultReference, "ต้องระบุหลักฐานผลการนำส่งไปรษณีย์");
    },
    mutate: (item, _draft, _account, payload) => {
      const notice = findAllegationNotice(item, payload.noticeId);
      notice.service.status = payload.deliveryResult === "DELIVERED" ? "SERVED_POSTAL" : "POSTAL_FAILED";
      notice.service.resultDate = payload.resultDate;
      notice.service.resultReference = payload.resultReference.trim();
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_POSTING: {
    permission: "report644.edit",
    action: "ALLEGATION_NOTICE_POSTED",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกการปิดหนังสือได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      const notice = findAllegationNotice(item, payload.noticeId);
      requireState(notice.service.status === "POSTAL_FAILED", "ต้องบันทึกว่าส่งไปรษณีย์ไม่ได้ก่อนปิดบันทึกแจ้งข้อกล่าวหา");
      requireState(["DOMICILE", "WORKPLACE"].includes(payload.postingPlace), "สถานที่ปิดบันทึกไม่ถูกต้อง");
      const serviceDate = requireIsoDate(payload.serviceDate, "วันที่ปิดบันทึก");
      requireState(serviceDate >= notice.service.resultDate, "วันที่ปิดบันทึกต้องไม่ก่อนวันที่ทราบผลไปรษณีย์");
      requireState(serviceDate <= draft.demoDate, "วันที่ปิดบันทึกต้องไม่เป็นวันที่ในอนาคต");
      required(payload.serviceReference, "ต้องระบุหลักฐานการปิดบันทึก");
      required(payload.locationDetail, "ต้องระบุภูมิลำเนาหรือสำนักทำงานที่ปิดบันทึก");
    },
    mutate: (item, _draft, _account, payload) => {
      const notice = findAllegationNotice(item, payload.noticeId);
      notice.service.status = "SERVED_BY_POSTING";
      notice.service.method = payload.postingPlace === "DOMICILE" ? "POSTED_DOMICILE" : "POSTED_WORKPLACE";
      notice.service.date = payload.serviceDate;
      notice.service.reference = payload.serviceReference.trim();
      notice.service.location = payload.locationDetail.trim();
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_RESPONSE: {
    permission: "report644.edit",
    action: "ALLEGATION_RESPONSE_RECORDED",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกคำชี้แจงได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      const notice = findAllegationNotice(item, payload.noticeId);
      requireState(noticeServiceComplete(notice), "ต้องดำเนินการแจ้งข้อกล่าวหาให้สำเร็จก่อนบันทึกผลการชี้แจง");
      requireState(["EXPLANATION_RECEIVED", "NO_EXPLANATION_WITHIN_NOTICE"].includes(payload.responseOutcome), "ผลการชี้แจงไม่ถูกต้อง");
      const responseDate = requireIsoDate(payload.responseDate, "วันที่บันทึกผลการชี้แจง");
      const serviceCompletedAt = notice.service.status === "SERVED_POSTAL" ? notice.service.resultDate : notice.service.date;
      if (notice.service.status === "SERVED_POSTAL") required(serviceCompletedAt, "ต้องมีวันที่ไปรษณีย์นำส่งสำเร็จก่อนบันทึกผลการชี้แจง");
      requireState(responseDate >= serviceCompletedAt, "วันที่บันทึกผลการชี้แจงต้องไม่ก่อนวันที่แจ้งข้อกล่าวหาสำเร็จ");
      requireState(responseDate <= draft.demoDate, "วันที่บันทึกผลการชี้แจงต้องไม่เป็นวันที่ในอนาคต");
      required(payload.explanation, payload.responseOutcome === "EXPLANATION_RECEIVED" ? "ต้องบันทึกสาระคำชี้แจง" : "ต้องบันทึกว่าไม่ยื่นคำชี้แจงภายในเวลาที่ระบุในหนังสือแจ้ง");
      required(payload.evidenceReference, "ต้องระบุเลขอ้างอิงคำชี้แจง พยานหลักฐาน หรือบันทึกว่าไม่มีการยื่น");
    },
    mutate: (item, draft, account, payload) => {
      const notice = findAllegationNotice(item, payload.noticeId);
      notice.responses.push({
        id: `${notice.id}-response-${notice.responses.length + 1}`,
        outcome: payload.responseOutcome,
        date: payload.responseDate,
        explanation: payload.explanation.trim(),
        evidenceReference: payload.evidenceReference.trim(),
        recordedAt: demoTime(draft),
        recordedBy: account.name
      });
      refreshAllegationSummaries(item.report644);
    }
  },
  RECORD_ALLEGATION_EXCEPTION: {
    permission: "report644.edit",
    action: "ALLEGATION_NOTICE_EXCEPTION_RECORDED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(editableReport644(item), "บันทึกเหตุยกเว้นได้ระหว่างจัดทำหรือแก้ไขรายงาน 644");
      requireState(["INSUFFICIENT_EVIDENCE", "OUTSIDE_PACC_AUTHORITY", "ACCUSED_DECEASED"].includes(payload.exceptionType), "เหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหาไม่ถูกต้อง");
      if (payload.exceptionType === "ACCUSED_DECEASED") required(payload.accusedName, "ต้องระบุชื่อผู้ถูกกล่าวหาที่เสียชีวิต");
      required(payload.note, "ต้องระบุข้อเท็จจริงและเหตุผลประกอบ");
      required(payload.evidenceReference, "ต้องระบุเอกสารหรือพยานหลักฐานอ้างอิง");
    },
    mutate: (item, draft, account, payload) => {
      const process = normalizeAllegationProcess(item.report644);
      process.evidenceAssessment = process.notices.length ? "MIXED" : payload.exceptionType;
      process.exceptions.push({
        id: `${item.id}-notice-exception-${process.exceptions.length + 1}`,
        type: payload.exceptionType,
        accusedName: String(payload.accusedName || "").trim(),
        note: payload.note.trim(),
        evidenceReference: payload.evidenceReference.trim(),
        recordedAt: demoTime(draft),
        recordedBy: account.name
      });
      refreshAllegationSummaries(item.report644);
    }
  },
  UPDATE_REPORT_644: {
    permission: "report644.edit",
    action: "REPORT_644_SAVED",
    validate: (item, _draft, account) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "INQUIRY", "แก้รายงาน 644 ได้เฉพาะระยะไต่สวนข้อเท็จจริง");
      requireState(["DRAFT", "RETURNED"].includes(item.report644.status), "รายงานที่ส่งตรวจหรือล็อกแล้วแก้ไขไม่ได้");
    },
    mutate: (item, draft, account, payload) => {
      ["planSummary", "evidenceSummary", "summary", "recommendation"].forEach((field) => {
        item.report644[field] = String(payload[field] || "").trim();
      });
      item.report644.status = "DRAFT";
      snapshotReport(item, "644", draft, account, "SAVE");
    }
  },
  SUBMIT_REPORT_644: {
    permission: "report644.submit",
    action: "REPORT_644_SUBMITTED",
    validate: (item, _draft, account) => {
      requireAcknowledgedOwner(item, account);
      requireState(item.phase === "INQUIRY", "เสนอรายงาน 644 ได้เฉพาะสำนวนที่อยู่ระหว่างไต่สวนข้อเท็จจริง");
      requireState(["DRAFT", "RETURNED"].includes(item.report644.status), "สถานะรายงาน 644 ไม่พร้อมส่งตรวจ");
      const supplemental = item.report644.supplementalInquiry;
      if (supplemental?.status && supplemental.status !== "NOT_REQUIRED") {
        requireState(supplemental.status === "ACTIVE", "ยังไม่มีผลอนุมัติขยายเวลาการไต่สวนเพิ่มเติม หรือคำขอไม่อนุมัติ");
        requireState(_draft.demoDate <= supplemental.deadlineAt, "พ้นกรอบไต่สวนเพิ่มเติม ต้องเสนอขอขยายเวลาต่อคณะกรรมการ ป.ป.ท. ก่อนส่งรายงาน");
      }
      const requiredFields = ["orderNo", "orderDate", "planSummary", "evidenceSummary", "summary", "recommendation"];
      requireState(requiredFields.every((field) => String(item.report644[field] || "").trim()), "ข้อมูลคำสั่ง แผน พยานหลักฐาน สรุปรายงาน และความเห็นเสนอต้องครบ");
      requireState(allegationProcessComplete(item.report644), "ต้องดำเนินการแจ้งข้อกล่าวหาและบันทึกผลการชี้แจงให้ครบ หรือบันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหาพร้อมหลักฐานอ้างอิง");
    },
    mutate: (item, draft, account) => {
      item.report644.status = "SUBMITTED";
      withdrawPendingExtensions(item.report644, draft, account);
      if (item.report644.supplementalInquiry?.status === "ACTIVE") item.report644.supplementalInquiry.status = "COMPLETED";
      snapshotReport(item, "644", draft, account, "SUBMIT");
    }
  },
  CREATE_SUPPORT_REQUEST: {
    permission: "support.request",
    action: "SUPPORT_REQUEST_SENT",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(
        ["WITNESS_PROTECTION", "SEARCH_WARRANT", "LEGAL_OPINION", "ARREST_WARRANT"].includes(payload.requestType),
        "ประเภทคำขอไม่ถูกต้อง"
      );
      required(payload.reason, "ต้องระบุเหตุผลและความจำเป็น");
      required(payload.subject, "ต้องระบุเรื่องที่ขอให้ดำเนินการ");
      required(payload.target, "ต้องระบุบุคคล สถานที่ หรือประเด็นเป้าหมาย");
      required(payload.documentReference, "ต้องระบุเอกสารหรือเลขอ้างอิงประกอบคำขอ");
      required(payload.evidenceBasis, "ต้องระบุพยานหลักฐานหรือข้อเท็จจริงสนับสนุนคำขอ");
      if (payload.requestType !== "LEGAL_OPINION") required(payload.contactAddress, "ต้องระบุข้อมูลติดต่อหรือที่อยู่ที่เกี่ยวข้อง");
      if (payload.requestType === "ARREST_WARRANT") {
        requireState(account.role === "INQUIRY", "คำขอหมายจับต้องจัดทำโดยผู้รับผิดชอบสำนวนไต่สวน");
        requireState(item.phase === "POST_DECISION", "จัดทำคำขอหมายจับได้หลังมีมติและอยู่ระหว่างดำเนินการตามมติ");
        requireState(item.report644.status === "LOCKED", "รายงาน 644 ต้องเป็นฉบับที่เสนอและล็อกแล้ว");
        const prosecutorDelivery = item.handoff.deliveries.find((entry) => entry.target === "PROSECUTOR");
        requireState(
          Boolean(prosecutorDelivery) && ["SENT", "ACKNOWLEDGED"].includes(prosecutorDelivery.status),
          "ต้องบันทึกผลการส่งสำนวนให้พนักงานอัยการสำเร็จก่อนจัดทำคำขอหมายจับ"
        );
        return;
      }
      const rolePhaseAllowed = (account.role === "PRELIM" && item.phase === "PRELIMINARY")
        || (account.role === "INQUIRY" && item.phase === "INQUIRY");
      requireState(rolePhaseAllowed, "คำขอนี้จัดทำได้ระหว่างแสวงหาหรือไต่สวนโดยผู้รับผิดชอบสำนวน");
    },
    mutate: (item, draft, account, payload) => {
      const labels = {
        WITNESS_PROTECTION: "ขอคุ้มครองพยาน",
        SEARCH_WARRANT: "ขอหมายค้น",
        LEGAL_OPINION: "ขอความเห็นด้านกฎหมาย",
        ARREST_WARRANT: "ขอหมายจับ"
      };
      item.supportRequests = item.supportRequests || [];
      item.supportRequests.unshift({
        id: `${item.id}-support-${item.supportRequests.length + 1}`,
        type: payload.requestType,
        label: labels[payload.requestType],
        subject: payload.subject.trim(),
        target: payload.target.trim(),
        documentReference: payload.documentReference.trim(),
        evidenceBasis: payload.evidenceBasis.trim(),
        contactAddress: String(payload.contactAddress || "").trim(),
        reason: payload.reason.trim(),
        requestedAt: demoTime(draft),
        actor: account.name,
        status: "ส่งคำขอแล้ว"
      });
    }
  },
  POST_DECISION_HANDOFF: {
    permission: "handoff.postDecision",
    action: "POST_DECISION_HANDOFF_SENT",
    validate: (item, _draft, account, payload) => {
      requireState(item.phase === "POST_DECISION", "สำนวนยังไม่อยู่ในระยะดำเนินการหลังมีมติ");
      requireAcknowledgedOwner(item, account);
      requireState(item.handoff.deliveries.length === 0, "กำหนดรายการปลายทางแล้ว ห้ามส่งคำสั่งซ้ำ");
      const reportType = item.integration.reportType;
      requireState(["213", "644"].includes(reportType), "ไม่พบประเภทรายงานที่คณะกรรมการฯ พิจารณา");
      requireState(
        (account.role === "PRELIM" && reportType === "213") || (account.role === "INQUIRY" && reportType === "644"),
        "ผู้รับผิดชอบสำนวนไม่ตรงกับชั้นรายงานตามมติ"
      );
      const targets = Array.isArray(payload.targets) ? payload.targets : [];
      const authoritativeTargets = normalizeDirectives(item.integration.directives);
      const isTermination = reportType === "213" && item.integration.decision === "NOT_ACCEPT_TERMINATE";
      if (isTermination) {
        requireState(targets.length === 0, "กรณียุติเรื่องไม่ต้องกำหนดหน่วยงานปลายทาง");
      } else {
        requireState(authoritativeTargets.length > 0, "ผลการพิจารณานี้ไม่มีคำสั่งปลายทางที่บันทึกไว้");
        requireState(new Set(targets).size === targets.length, "พบปลายทางซ้ำกัน");
        requireState(
          JSON.stringify(normalizeDirectives(targets)) === JSON.stringify(authoritativeTargets),
          "ต้องดำเนินการครบทุกปลายทางตามมติ โดยเพิ่ม ลด หรือเลือกเพียงบางปลายทางไม่ได้"
        );
      }
      if (reportType === "213" && item.integration.decision === "NOT_ACCEPT_OTHER_AGENCY") {
        required(payload.otherAgencyName, "ต้องระบุชื่อหน่วยงานอื่นตามมติ");
        requireState(String(payload.otherAgencyName).trim() !== "หน่วยงานอื่น", "ต้องระบุชื่อหน่วยงานจริง ห้ามใช้คำทั่วไปว่า หน่วยงานอื่น");
        required(payload.otherAgencyAddress, "ต้องระบุที่อยู่หรือรายละเอียดการนำส่งหน่วยงานอื่น");
        required(payload.otherAgencyContact, "ต้องระบุข้อมูลติดต่อหรือเลขอ้างอิงการนำส่งหน่วยงานอื่น");
        required(payload.jurisdictionReason, "ต้องระบุเหตุผลด้านอำนาจหน้าที่ของหน่วยงานปลายทาง");
      }
      required(payload.reason, "ต้องระบุเหตุผลหรือคำสั่งที่ใช้ส่งต่อ");
    },
    mutate: (item, _draft, _account, payload) => {
      const isTermination = item.integration.reportType === "213" && item.integration.decision === "NOT_ACCEPT_TERMINATE";
      if (isTermination) {
        item.phase = "CLOSED";
        item.handoff.status = "CLOSED";
        item.handoff.target = "ยุติเรื่องตามมติ";
        item.handoff.note = payload.reason.trim();
        item.handoff.deliveries = [];
        return;
      }
      item.handoff.deliveries = payload.targets.map((target) => {
        const otherAgency = target === "OTHER" ? {
          agencyName: payload.otherAgencyName.trim(),
          address: payload.otherAgencyAddress.trim(),
          contact: payload.otherAgencyContact.trim(),
          jurisdictionReason: payload.jurisdictionReason.trim()
        } : null;
        return createPostDecisionDelivery(target, otherAgency?.agencyName || getTargetLabel(target), otherAgency);
      });
      item.handoff.status = "PENDING";
      item.handoff.target = item.handoff.deliveries.map((entry) => entry.label).join(", ");
      item.handoff.note = payload.reason.trim();
    }
  },
  PREPARE_OUTGOING_PACKAGE: {
    permission: "postdecision.prepare",
    action: "OUTGOING_PACKAGE_PREPARED",
    validate: (item, _draft, account, payload) => {
      requireState(item.phase === "POST_DECISION", "จัดเตรียมหนังสือได้เฉพาะสำนวนหลังมีมติ");
      requireAcknowledgedOwner(item, account);
      required(payload.target, "ต้องระบุปลายทาง");
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      requireState(Boolean(delivery) && delivery.target !== "PARENT_AGENCY", "รายการนี้ไม่ได้ใช้เส้นทางผู้รับผิดชอบสำนวนจัดทำหนังสือ");
      requireState(delivery.status === "PENDING", "รายการนี้จัดเตรียมหนังสือแล้วหรืออยู่ระหว่างดำเนินการ");
      required(payload.caseFileReference, "ต้องระบุรายการหรือเลขอ้างอิงสำนวน");
      required(payload.resolutionReference, "ต้องระบุเลขอ้างอิงมติคณะกรรมการ ป.ป.ท.");
      required(payload.inquiryReportReference, "ต้องระบุรายการรายงานที่คณะกรรมการฯ พิจารณา");
      required(payload.outgoingLetterNo, "ต้องระบุเลขหนังสือนำส่ง");
      if (delivery.target === "PROSECUTOR") {
        requireState(["CIVILIAN", "MILITARY"].includes(payload.accusedCategory), "ต้องระบุว่าผู้ถูกกล่าวหาเป็นบุคคลทั่วไป/ข้าราชการพลเรือน หรือทหาร");
        required(payload.jurisdiction, "ต้องระบุเขตอำนาจศาล");
      }
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      Object.assign(delivery, {
        status: "AWAITING_SIGNATURE",
        preparedAt: demoTime(draft),
        preparedBy: account.name,
        caseFileReference: payload.caseFileReference.trim(),
        resolutionReference: payload.resolutionReference.trim(),
        inquiryReportReference: payload.inquiryReportReference.trim(),
        outgoingLetterNo: payload.outgoingLetterNo.trim(),
        accusedCategory: String(payload.accusedCategory || "").trim(),
        jurisdiction: String(payload.jurisdiction || "").trim(),
        prosecutorOffice: delivery.target === "PROSECUTOR"
          ? payload.accusedCategory === "MILITARY" ? "พนักงานอัยการทหารตามเขตอำนาจศาลทหาร" : "สำนักงานคดีปราบปรามการทุจริตตามเขตอำนาจศาล"
          : delivery.label
      });
      refreshPostDecisionHandoff(item);
    }
  },
  SIGN_OUTGOING_LETTER: {
    permission: "postdecision.sign",
    action: "OUTGOING_LETTER_SIGNED",
    validate: (item, _draft, _account, payload) => {
      required(payload.target, "ต้องระบุปลายทาง");
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      requireState(Boolean(delivery) && delivery.status === "AWAITING_SIGNATURE", "ไม่มีหนังสือนำส่งที่รอหัวหน้าพนักงาน ป.ป.ท. ลงนาม");
      required(payload.reason, "ต้องระบุผลการตรวจและลงนาม");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      delivery.status = "SIGNED";
      delivery.signedAt = demoTime(draft);
      delivery.signedBy = account.name;
      refreshPostDecisionHandoff(item);
    }
  },
  DISPATCH_SIGNED_DELIVERY: {
    permission: "postdecision.dispatch",
    action: "SIGNED_DELIVERY_DISPATCH_RECORDED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      required(payload.target, "ต้องระบุปลายทาง");
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      requireState(Boolean(delivery) && delivery.target !== "PARENT_AGENCY" && delivery.status === "SIGNED", "หนังสือยังไม่ได้ลงนามหรือไม่อยู่ในสถานะพร้อมนำส่ง");
      requireState(["SUCCESS", "FAILED"].includes(payload.deliveryResult), "ต้องบันทึกผลการนำส่ง");
      required(payload.deliveryNote, "ต้องระบุผลหรือหลักฐานการนำส่ง");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      const status = payload.deliveryResult === "SUCCESS" ? "SENT" : "FAILED";
      delivery.attempts = [...(delivery.attempts || []), { sequence: (delivery.attempts || []).length + 1, at: demoTime(draft), status, note: payload.deliveryNote.trim() }];
      delivery.status = status;
      delivery.reference = delivery.outgoingLetterNo;
      delivery.dispatchedAt = status === "SENT" ? draft.demoDate : "";
      delivery.dispatchedBy = account.name;
      delivery.lastError = status === "FAILED" ? payload.deliveryNote.trim() : "";
      refreshPostDecisionHandoff(item);
    }
  },
  RETRY_OUTGOING_DELIVERY: {
    permission: "postdecision.retry",
    action: "OUTGOING_DELIVERY_RETRIED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      required(payload.target, "ต้องระบุปลายทาง");
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      requireState(Boolean(delivery) && delivery.target !== "PARENT_AGENCY" && delivery.status === "FAILED", "ลองนำส่งซ้ำได้เฉพาะหนังสือที่นำส่งไม่สำเร็จ");
      requireState(["SUCCESS", "FAILED"].includes(payload.deliveryResult), "ต้องบันทึกผลการนำส่งซ้ำ");
      required(payload.deliveryNote, "ต้องระบุผลหรือหลักฐานการนำส่งซ้ำ");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === payload.target);
      const status = payload.deliveryResult === "SUCCESS" ? "SENT" : "FAILED";
      delivery.attempts = [...(delivery.attempts || []), { sequence: (delivery.attempts || []).length + 1, at: demoTime(draft), status, note: payload.deliveryNote.trim() }];
      delivery.status = status;
      delivery.dispatchedAt = status === "SENT" ? draft.demoDate : "";
      delivery.dispatchedBy = account.name;
      delivery.lastError = status === "FAILED" ? payload.deliveryNote.trim() : "";
      refreshPostDecisionHandoff(item);
    }
  },
  SEND_DISCIPLINARY_COPY: {
    permission: "disciplinary.copy",
    action: "DISCIPLINARY_COPY_SENT_TO_OWNER",
    validate: (item, _draft, _account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      requireState(Boolean(delivery), "มตินี้ไม่มีรายการแจ้งหน่วยงานต้นสังกัด");
      requireState(!delivery.copySentAt, "ส่งสำเนาให้ผู้รับผิดชอบสำนวนแล้ว");
      required(payload.copyReference, "ต้องระบุเลขหรือรายการสำเนาหนังสือที่ส่งให้ผู้รับผิดชอบสำนวน");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      delivery.copyReference = payload.copyReference.trim();
      delivery.copySentAt = demoTime(draft);
      delivery.copySentBy = account.name;
      refreshDisciplinaryDelivery(delivery);
      refreshPostDecisionHandoff(item);
    }
  },
  DISPATCH_DISCIPLINARY_DELIVERY: {
    permission: "disciplinary.dispatch",
    action: "DISCIPLINARY_DELIVERY_DISPATCH_RECORDED",
    validate: (item, _draft, _account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      requireState(Boolean(delivery) && delivery.dispatchStatus === "PENDING", "รายการแจ้งหน่วยงานต้นสังกัดถูกบันทึกผลการนำส่งแล้ว");
      required(payload.parentAgencyName, "ต้องระบุชื่อหน่วยงานต้นสังกัด");
      required(payload.outgoingLetterNo, "ต้องระบุเลขหนังสือแจ้งหน่วยงานต้นสังกัด");
      requireState(["SUCCESS", "FAILED"].includes(payload.deliveryResult), "ต้องบันทึกผลการนำส่ง");
      required(payload.deliveryNote, "ต้องระบุผลหรือหลักฐานการนำส่ง");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      const status = payload.deliveryResult === "SUCCESS" ? "SENT" : "FAILED";
      delivery.label = payload.parentAgencyName.trim();
      delivery.outgoingLetterNo = payload.outgoingLetterNo.trim();
      delivery.reference = delivery.outgoingLetterNo;
      delivery.dispatchStatus = status;
      delivery.dispatchedAt = status === "SENT" ? draft.demoDate : "";
      delivery.dispatchedBy = account.name;
      delivery.lastError = status === "FAILED" ? payload.deliveryNote.trim() : "";
      delivery.attempts = [...(delivery.attempts || []), { sequence: (delivery.attempts || []).length + 1, at: demoTime(draft), status, note: payload.deliveryNote.trim() }];
      refreshDisciplinaryDelivery(delivery);
      refreshPostDecisionHandoff(item);
    }
  },
  RETRY_DISCIPLINARY_DELIVERY: {
    permission: "disciplinary.retry",
    action: "DISCIPLINARY_DELIVERY_RETRIED",
    validate: (item, _draft, _account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      requireState(Boolean(delivery) && delivery.dispatchStatus === "FAILED", "ลองนำส่งซ้ำได้เฉพาะหนังสือแจ้งต้นสังกัดที่นำส่งไม่สำเร็จ");
      requireState(["SUCCESS", "FAILED"].includes(payload.deliveryResult), "ต้องบันทึกผลการนำส่งซ้ำ");
      required(payload.deliveryNote, "ต้องระบุผลหรือหลักฐานการนำส่งซ้ำ");
    },
    mutate: (item, draft, account, payload) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      const status = payload.deliveryResult === "SUCCESS" ? "SENT" : "FAILED";
      delivery.dispatchStatus = status;
      delivery.dispatchedAt = status === "SENT" ? draft.demoDate : "";
      delivery.dispatchedBy = account.name;
      delivery.lastError = status === "FAILED" ? payload.deliveryNote.trim() : "";
      delivery.attempts = [...(delivery.attempts || []), { sequence: (delivery.attempts || []).length + 1, at: demoTime(draft), status, note: payload.deliveryNote.trim() }];
      refreshDisciplinaryDelivery(delivery);
      refreshPostDecisionHandoff(item);
    }
  },
  REQUEST_MERGE_CASES: {
    permission: "relations.request",
    action: "CASE_MERGE_REQUESTED",
    validate: (item, draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(["PRELIMINARY", "INQUIRY"].includes(item.phase), "เสนอรวมสำนวนได้เฉพาะระยะแสวงหาหรือไต่สวน");
      required(payload.candidateId, "ต้องเลือกสำนวนที่เสนอรวม");
      const candidate = findCase(draft, payload.candidateId);
      requireState(candidate.id !== item.id, "เลือกสำนวนปัจจุบันเป็นสำนวนที่จะรวมไม่ได้");
      requireState(canReadCase(account, candidate), "ผู้รับผิดชอบหลักต้องมีสิทธิ์อ่านสำนวนที่เสนอรวม");
      requireState(["PRELIMINARY", "INQUIRY"].includes(candidate.phase), "สำนวนที่เสนอรวมไม่ได้อยู่ในระยะที่ดำเนินการได้");
      requireState(item.relations.mergeRequest.status === "NOT_REQUESTED" || ["REJECTED", "RETURNED"].includes(item.relations.mergeRequest.status), "มีคำขอรวมสำนวนที่กำลังดำเนินการอยู่แล้ว");
      requireState(activeMergeOwners(draft, item.id).length === 0, "สำนวนปัจจุบันอยู่ในคำขอรวมสำนวนอื่นที่กำลังรอพิจารณา");
      requireState(activeMergeOwners(draft, candidate.id).length === 0, "สำนวนที่เลือกอยู่ในคำขอรวมสำนวนอื่นที่กำลังรอพิจารณา");
      required(payload.factsOverlap, "ต้องระบุข้อเท็จจริงที่เกี่ยวเนื่องกัน");
      required(payload.accusedOverlap, "ต้องระบุความเกี่ยวข้องของผู้ถูกร้องหรือผู้ถูกกล่าวหา");
    },
    mutate: (item, draft, account, payload) => {
      const candidate = findCase(draft, payload.candidateId);
      const ordered = [item, candidate].sort((left, right) => left.receivedAt.localeCompare(right.receivedAt) || left.id.localeCompare(right.id));
      item.relations.mergeRequest = {
        status: "PENDING_DECISION",
        candidateId: candidate.id,
        proposedMasterId: ordered[0].id,
        proposedSourceId: ordered[1].id,
        caseVersions: {
          [item.id]: item.version + 1,
          [candidate.id]: candidate.version
        },
        factsOverlap: payload.factsOverlap.trim(),
        accusedOverlap: payload.accusedOverlap.trim(),
        requestedAt: demoTime(draft),
        requestedBy: account.name,
        decision: "",
        decisionReason: "",
        decidedAt: "",
        decidedBy: ""
      };
    }
  },
  DECIDE_MERGE_CASES: {
    permission: "relations.decide",
    action: "CASE_MERGE_DECIDED",
    validate: (item, draft, _account, payload) => {
      requireState(item.relations.mergeRequest.status === "PENDING_DECISION", "ไม่มีคำขอรวมสำนวนที่รอพิจารณา");
      requireState(["APPROVED", "REJECTED"].includes(payload.decision), "ผลพิจารณาคำขอรวมสำนวนไม่ถูกต้อง");
      required(payload.reason, "ต้องระบุผลหรือเหตุผลการพิจารณา");
      if (payload.decision === "APPROVED") {
        const request = item.relations.mergeRequest;
        const master = findCase(draft, request.proposedMasterId);
        const source = findCase(draft, request.proposedSourceId);
        requireState(["PRELIMINARY", "INQUIRY"].includes(master.phase) && ["PRELIMINARY", "INQUIRY"].includes(source.phase), "สำนวนใดสำนวนหนึ่งเปลี่ยนระยะงานแล้ว กรุณาตรวจสอบคำขอรวมสำนวนใหม่");
        requireState(!master.relations.mergedInto && !source.relations.mergedInto, "สำนวนใดสำนวนหนึ่งถูกรวมเข้าสำนวนอื่นแล้ว");
        requireState(master.version === request.caseVersions?.[master.id] && source.version === request.caseVersions?.[source.id], "สำนวนที่เสนอรวมมีข้อมูลเปลี่ยนแปลง กรุณาตรวจสอบและเสนอใหม่");
        requireState(activeMergeOwners(draft, master.id, item.id).length === 0 && activeMergeOwners(draft, source.id, item.id).length === 0, "พบคำขอรวมสำนวนอื่นที่ทับซ้อนกัน");
        requireState(!(master.relations.mergedFrom || []).includes(source.id) && !(source.relations.mergedFrom || []).includes(master.id), "สำนวนคู่นี้รวมกันแล้ว");
      }
    },
    mutate: (item, draft, account, payload) => {
      const request = item.relations.mergeRequest;
      request.status = payload.decision === "APPROVED" ? "APPROVED" : "REJECTED";
      request.decision = payload.decision;
      request.decisionReason = payload.reason.trim();
      request.decidedAt = demoTime(draft);
      request.decidedBy = account.name;
      if (payload.decision !== "APPROVED") return;
      const master = findCase(draft, request.proposedMasterId);
      const source = findCase(draft, request.proposedSourceId);
      master.relations.mergedFrom = [...new Set([...(master.relations.mergedFrom || []), source.id])];
      master.report213.mergedCaseProvenance = [...(master.report213.mergedCaseProvenance || []), {
        caseId: source.id,
        receivedAt: source.receivedAt,
        reportSummary: source.report213.summary,
        evidenceIds: source.evidence.map((entry) => entry.id),
        worklogIds: source.worklogs.map((entry) => entry.id)
      }];
      if (master.report644.orderNo && source.report644.orderNo && master.report644.orderNo !== source.report644.orderNo) {
        master.relations.inquiryDeadlineNote = "เอกสารไม่ระบุการปรับกรอบ 270 วันเมื่อคำสั่งไต่สวนของสำนวนที่รวมกันต่างกัน";
      }
      source.phase = "MERGED";
      source.relations.mergedInto = master.id;
      source.handoff.status = "CLOSED";
      source.handoff.target = master.id;
      source.handoff.note = "รวมเข้าสำนวนหลักโดยเก็บเลขสำนวนและประวัติเดิมไว้ตรวจสอบ";
      [master, source].filter((entry) => entry.id !== item.id).forEach((entry) => appendCaseAudit(draft, entry, {
        actor: account.name,
        role: account.role,
        action: "CASE_MERGE_APPLIED",
        reason: payload.reason
      }));
    }
  },
  REQUEST_SPLIT_CASE: {
    permission: "relations.request",
    action: "CASE_SPLIT_REQUESTED",
    validate: (item, _draft, account, payload) => {
      requireAcknowledgedOwner(item, account);
      requireState(["PRELIMINARY", "INQUIRY"].includes(item.phase), "เสนอแยกเรื่องได้เฉพาะระยะแสวงหาหรือไต่สวน");
      required(payload.reason, "ต้องระบุเหตุผลและขอบเขตเรื่องที่ขอแยก");
    },
    mutate: (item, draft, account, payload) => {
      const stage = item.phase === "PRELIMINARY" ? "PRELIMINARY" : "INQUIRY";
      item.relations.splitRequests.push({
        id: `split-${item.id}-${draft.eventCounter + 1}`,
        status: "AWAITING_HEAD",
        stage,
        reason: payload.reason.trim(),
        requestedAt: demoTime(draft),
        requestedBy: account.name,
        route: stage === "PRELIMINARY" ? "หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ → ผอ.กองบริหารคดี → ศูนย์รับเรื่องร้องเรียน" : "หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ → คณะกรรมการ ป.ป.ท.",
        pendingNewCaseNumber: "รอหน่วยงานปลายทางออกเลขสำนวนใหม่",
        newCaseId: "",
        decisionReason: ""
      });
    }
  },
  REVIEW_SPLIT_CASE: {
    permission: "relations.review",
    action: "CASE_SPLIT_REVIEWED",
    validate: (item, _draft, _account, payload) => {
      const request = item.relations.splitRequests.find((entry) => entry.id === payload.requestId);
      requireState(request?.status === "AWAITING_HEAD", "ไม่พบคำขอแยกเรื่องที่รอหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการพิจารณา");
      requireState(["FORWARD", "RETURN"].includes(payload.decision), "ผลพิจารณาคำขอแยกเรื่องไม่ถูกต้อง");
      required(payload.reason, "ต้องระบุความเห็นประกอบ");
    },
    mutate: (item, _draft, _account, payload) => {
      const request = item.relations.splitRequests.find((entry) => entry.id === payload.requestId);
      request.status = payload.decision === "RETURN" ? "RETURNED" : request.stage === "PRELIMINARY" ? "AWAITING_CASE_ADMIN" : "AWAITING_BOARD";
      request.decisionReason = payload.reason.trim();
    }
  },
  COMPLETE_SPLIT_CASE: {
    permission: null,
    action: "CASE_SPLIT_BOUNDARY_COMPLETED",
    validate: (item, draft, _account, payload) => {
      const request = item.relations.splitRequests.find((entry) => entry.id === payload.requestId);
      requireState(Boolean(request), "ไม่พบคำขอแยกเรื่อง");
      const expectedStatus = request.stage === "PRELIMINARY" ? "AWAITING_CASE_ADMIN" : "AWAITING_BOARD";
      requireState(request.status === expectedStatus, "คำขอแยกเรื่องยังไม่ถึงขั้นตอนบันทึกผลจากหน่วยงานปลายทาง");
      required(payload.newCaseId, "ต้องระบุเลขสำนวนใหม่ที่หน่วยงานปลายทางออกให้");
      const newCaseId = payload.newCaseId.trim();
      requireState(newCaseId !== item.id, "เลขสำนวนใหม่ต้องไม่ซ้ำกับสำนวนต้นทาง");
      requireState(!draft.cases.some((entry) => entry.id === newCaseId), "เลขสำนวนใหม่ซ้ำกับสำนวนที่มีอยู่ในระบบ");
      requireState(!draft.cases.some((entry) => entry.relations?.splitRequests?.some((split) => split.status === "COMPLETED" && split.newCaseId === newCaseId)), "เลขสำนวนใหม่นี้ถูกใช้กับคำขอแยกเรื่องอื่นแล้ว");
      required(payload.reason, "ต้องระบุรายละเอียดผลการดำเนินการ");
    },
    mutate: (item, draft, account, payload) => {
      const request = item.relations.splitRequests.find((entry) => entry.id === payload.requestId);
      request.status = "COMPLETED";
      request.newCaseId = payload.newCaseId.trim();
      request.pendingNewCaseNumber = "";
      request.completedAt = demoTime(draft);
      request.completedBy = account.name;
      request.completionNote = payload.reason.trim();
    }
  }
};

export function getState() {
  return clone(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCurrentUser() {
  const account = currentAccount();
  if (!account) return null;
  const { password: _password, ...safeAccount } = account;
  return clone(safeAccount);
}

export function can(permission) {
  return permissionsFor().includes(permission);
}

export function authenticate(username, password) {
  const account = ACCOUNTS.find((item) => item.username === String(username || "").trim() && item.password === String(password || ""));
  if (!account) throw new AppError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", 401);
  const draft = clone(state);
  draft.session = { username: account.username, authenticatedAt: demoTime(draft) };
  appendGlobalAudit(draft, {
    actor: account.name,
    role: account.role,
    action: "LOGIN",
    reason: "เข้าสู่ระบบ"
  });
  persist(draft);
  return getCurrentUser();
}

export function logout() {
  const draft = clone(state);
  const account = currentAccount(draft);
  if (account) {
    appendGlobalAudit(draft, {
      actor: account.name,
      role: account.role,
      action: "LOGOUT",
      reason: "ออกจากระบบ"
    });
  }
  draft.session = null;
  persist(draft);
}

export function updatePreferences(preferences) {
  const draft = clone(state);
  draft.preferences = { ...draft.preferences, ...preferences };
  persist(draft);
}

export function markNotificationRead(notificationId) {
  const draft = clone(state);
  const account = currentAccount(draft);
  if (!account) throw new AppError("กรุณาเข้าสู่ระบบ", 401);
  const notification = (draft.notifications || []).find((entry) => entry.id === notificationId);
  if (!notification || notification.recipientAccount !== account.username) {
    appendGlobalAudit(draft, {
      caseId: notification?.caseId || "",
      actor: account.name,
      role: account.role,
      action: "403_NOTIFICATION_READ",
      reason: "พยายามเปิดการแจ้งเตือนของบัญชีอื่น",
      outcome: "FORBIDDEN"
    });
    persist(draft);
    throw new AppError("ไม่มีสิทธิ์เปิดการแจ้งเตือนนี้", 403);
  }
  if (notification.readAt) return clone(notification);
  if (notification.status === "CANCELLED") {
    throw new AppError("การแจ้งเตือนนี้ถูกยกเลิกแล้วเนื่องจากรายงานถูกเสนอผู้ตรวจ", 409);
  }
  if (notification.dueAt > draft.demoDate) {
    throw new AppError("การแจ้งเตือนนี้ยังไม่ถึงกำหนด", 409);
  }
  notification.readAt = demoTime(draft);
  notification.status = "READ";
  appendGlobalAudit(draft, {
    caseId: notification.caseId,
    actor: account.name,
    role: account.role,
    action: "NOTIFICATION_READ",
    reason: `อ่านการแจ้งเตือนรายงาน ${notification.reportType} รอบ ${notification.extensionRound}`
  });
  persist(draft);
  return clone(notification);
}

export function resetDemo() {
  const account = currentAccount();
  const draft = createInitialState();
  importActivity4Handoffs(draft);
  draft.session = account ? { username: account.username, authenticatedAt: demoTime(draft) } : null;
  appendGlobalAudit(draft, {
    actor: account?.name || "ผู้ใช้งาน",
    role: account?.role || "ANONYMOUS",
    action: "DEMO_RESET",
    reason: "คืนข้อมูลเป็นค่าเริ่มต้น"
  });
  persist(draft);
}

export function executeCommand(commandName, caseId, payload = {}) {
  const definition = definitions[commandName];
  if (!definition) throw new AppError("ไม่รู้จักคำสั่งที่ร้องขอ", 400);

  let permission = definition.permission;
  if (commandName === "APPROVE_REPORT" || commandName === "RETURN_REPORT") {
    permission = payload.reportType === "644" ? "report644.review" : "report213.review";
  }
  if (commandName === "DECIDE_EXTENSION") {
    const item = findCase(state, caseId);
    const extension = reportFor(item, payload.reportType).extensionHistory.find((entry) => entry.id === payload.extensionId);
    if (!extension) throw new AppError("ไม่พบคำขอที่รอพิจารณา", 409);
    permission = extension.authorityTier === "DIRECTOR_HEAD" ? "extension.review.director" : "extension.review.executive";
  }
  if (commandName === "COMPLETE_SPLIT_CASE") {
    const item = findCase(state, caseId);
    const request = item.relations.splitRequests.find((entry) => entry.id === payload.requestId);
    if (!request) throw new AppError("ไม่พบคำขอแยกเรื่อง", 409);
    permission = request.stage === "PRELIMINARY" ? "relations.forward" : "relations.decide";
  }

  const reason = normalizedReason(
    payload.reason
      || payload.dispatchNote
      || payload.reasonAndNecessity
      || payload.opinion
      || payload.remedy
      || payload.note,
    "บันทึกการดำเนินงานตามหน้าที่"
  );
  try {
    if (definition.scope === "SPECIAL") {
      return specialMatterCommand({
        permission,
        matterId: caseId,
        action: definition.action,
        reason,
        payload,
        validate: definition.validate,
        mutate: definition.mutate
      });
    }
    return caseCommand({
      permission,
      caseId,
      action: definition.action,
      reason,
      payload,
      idempotencyBeforeVersion: Boolean(definition.idempotencyBeforeVersion),
      validate: (item, draft, account) => definition.validate?.(item, draft, account, payload),
      mutate: (item, draft, account) => definition.mutate(item, draft, account, payload)
    });
  } catch (error) {
    recordRejectedCommand(error, caseId, definition.action, reason);
    throw error;
  }
}

export function recordRouteFailure(status, path) {
  if (![403, 404].includes(status)) return;
  const draft = clone(state);
  const account = currentAccount(draft);
  appendGlobalAudit(draft, {
    actor: account?.name || "ผู้ใช้ที่ยังไม่เข้าสู่ระบบ",
    role: account?.role || "ANONYMOUS",
    action: `${status}_ROUTE`,
    reason: status === 403 ? "พยายามเปิดหน้าที่ไม่ได้รับสิทธิ์" : "เปิดหน้าที่ไม่มีอยู่ในระบบ",
    outcome: status === 403 ? "FORBIDDEN" : "NOT_FOUND"
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  state = draft;
}
