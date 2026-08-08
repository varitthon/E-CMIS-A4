import {
  ACCOUNTS,
  ASSIGNMENT_STATES,
  HANDOFF_STATES,
  INTEGRATION_STATES,
  INVESTIGATOR_DIRECTORY,
  PHASES,
  PLAN_STATES,
  REPORT_STATES,
  ROLES,
  SPECIAL_MATTER_STATES,
  TRANSFER_TARGETS,
  getAllowedTargets,
  getResultOptions
} from "./mock-data.js";
import {
  AppError,
  authenticate,
  can,
  canReadCase,
  canReadSpecialMatter,
  executeCommand,
  getCurrentUser,
  getState,
  logout,
  markNotificationRead,
  recordRouteFailure,
  subscribe,
  updatePreferences
} from "./state.js";

const app = document.querySelector("#app");
const main = document.querySelector("#main-content");
const sidebar = document.querySelector("#sidebar");
const userMenu = document.querySelector("#user-menu");
const modalRoot = document.querySelector("#modal-root");
const toastRegion = document.querySelector("#toast-region");
const contrastToggle = document.querySelector("#contrast-toggle");

const PHASE_ORDER = ["INTAKE", "PRELIMINARY", "WAIT_A7_213", "INQUIRY", "WAIT_A7_644", "POST_DECISION", "CLOSED"];
const TABS = [
  ["overview", "ภาพรวม"],
  ["assignment", "ตรวจรับและมอบหมาย"],
  ["plan", "แผนดำเนินงาน"],
  ["worklog", "การดำเนินงาน"],
  ["evidence", "พยานหลักฐาน"],
  ["report213", "รายงาน 213"],
  ["board", "เสนอคณะกรรมการฯ"],
  ["report644", "รายงาน 644"],
  ["handoff", "ดำเนินการตามมติ"],
  ["relations", "รวมและแยกเรื่อง"],
  ["audit", "ประวัติสำนวน"]
];
const ROLE_TABS = Object.freeze({
  CLERK: ["overview", "assignment", "audit"],
  DIRECTOR: ["overview", "assignment", "audit"],
  PRELIM: ["overview", "assignment", "plan", "worklog", "evidence", "report213", "board", "handoff", "relations", "audit"],
  REVIEW: ["overview", "plan", "evidence", "report213", "report644", "relations", "audit"],
  EXECUTIVE: ["overview", "report213", "report644", "audit"],
  SECRETARY: ["overview", "board", "handoff", "report213", "report644", "relations", "audit"],
  CASE_ADMIN: ["overview", "report213", "report644", "relations", "audit"],
  INQUIRY: ["overview", "assignment", "worklog", "evidence", "report644", "board", "handoff", "relations", "audit"],
  CASE_TRACKING: ["overview", "handoff", "audit"],
  DECISION_AFFAIRS: ["overview", "handoff", "audit"],
  AUDIT: TABS.map(([key]) => key)
});

let modalSubmitHandler = null;
let modalTriggerElement = null;
let activeFilter = { query: "", phase: "ALL" };
let lastFailureKey = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  }).format(date);
}

function dateAfter(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function statusLabel(map, key) {
  return map[key] || "ไม่ทราบสถานะ";
}

function statusTone(key) {
  if (["APPROVED", "ACKNOWLEDGED", "LOCKED", "CLOSED", "DECISION_RECEIVED", "COMPLETED"].includes(key)) return "success";
  if (["RETURNED", "FAILED", "REJECTED", "QUARANTINED", "OVERDUE"].includes(key)) return "danger";
  if (["SUBMITTED", "READY_TO_SEND", "SENT", "ACKED", "PARTIAL", "AWAITING_EXTERNAL", "TRANSFER_PENDING"].includes(key)) return "warning";
  return "neutral";
}

function badge(label, key = "") {
  return `<span class="badge badge-${statusTone(key)}">${escapeHtml(label)}</span>`;
}

function icon(name) {
  const paths = {
    dashboard: '<path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"/>',
    cases: '<path d="M4 5h5l2 2h9v12H4V5Zm0 3h16"/>',
    review: '<path d="m5 12 4 4L19 6"/><path d="M4 4h12v4M4 4v16h16v-8"/>',
    boundary: '<path d="M8 7h10l-3-3m3 3-3 3M16 17H6l3 3m-3-3 3-3"/>',
    registry: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    special: '<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4M8 11l2 2 4-4"/>',
    audit: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z"/><path d="M9 12l2 2 4-4"/>',
    logout: '<path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/>'
  };
  return `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.cases}</svg>`;
}

function renderHeader(user) {
  if (!user) {
    userMenu.innerHTML = "";
    return;
  }
  userMenu.innerHTML = `
    <div class="user-identity">
      <span class="avatar" aria-hidden="true">${escapeHtml(user.name.slice(0, 1))}</span>
      <span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.position || ROLES[user.role])}${user.authority ? ` · ${escapeHtml(user.authority)}` : ""}</small></span>
    </div>
    <button class="button button-ghost button-compact" type="button" data-action="logout" aria-label="ออกจากระบบ">${icon("logout")}<span>ออกจากระบบ</span></button>
  `;
}

function navItems() {
  const role = getCurrentUser()?.role;
  const caseMenuLabel = role === "CLERK"
    ? "เรื่องรอตรวจรับ"
    : role === "DIRECTOR"
      ? "งานรอมอบหมาย"
      : ["PRELIM", "INQUIRY"].includes(role)
        ? "สำนวนของฉัน"
        : "รายการสำนวน";
  return [
    { href: "#/dashboard", label: "หน้าหลัก", icon: "dashboard", show: true },
    { href: "#/cases", label: caseMenuLabel, icon: "cases", show: can("case.read") },
    { href: "#/notifications", label: "การแจ้งเตือน", icon: "review", show: role === "PRELIM" },
    { href: "#/review", label: "งานรอตรวจ", icon: "review", show: can("review.queue") },
    { href: "#/transfer-approvals", label: "อนุมัติเปลี่ยนหน่วยงานรับผิดชอบ", icon: "boundary", show: can("transfer.approve") },
    { href: "#/board-submissions", label: "เรื่องรอเสนอคณะกรรมการฯ", icon: "boundary", show: can("activity7.send") || can("activity7.receive") },
    { href: "#/support-opinions", label: "ส่งเรื่องขอความเห็นเพิ่มเติม", icon: "boundary", show: can("support.dispatch") || can("support.opinion.record") },
    { href: "#/deliveries", label: "งานดำเนินการตามมติ", icon: "registry", show: can("disciplinary.dispatch") || can("disciplinary.copy") },
    { href: "#/special-matters", label: "เรื่องตรวจสอบ ม.58/2–58/3", icon: "special", show: hasSpecialMatterAccess() },
    { href: "#/audit", label: "ประวัติการใช้งาน", icon: "audit", show: can("audit.read") }
  ].filter((item) => item.show);
}

function renderSidebar(path) {
  sidebar.innerHTML = `
    <div class="sidebar-section-label">เมนูงาน</div>
    <nav class="primary-nav">
      ${navItems()
        .map(
          (item) => `
            <a href="${item.href}" class="nav-link ${path.startsWith(item.href.slice(1)) ? "is-active" : ""}">
              ${icon(item.icon)}<span>${item.label}</span>
            </a>`
        )
        .join("")}
    </nav>
    <div class="sidebar-foot"><p><strong>${escapeHtml(getCurrentUser()?.unit || "สำนักงาน ป.ป.ท.")}</strong><span>${escapeHtml(getCurrentUser()?.position || ROLES[getCurrentUser()?.role] || "ผู้ใช้งาน")}${getCurrentUser()?.authority ? ` · ${escapeHtml(getCurrentUser().authority)}` : ""}</span></p></div>
  `;
}

function roleBrief(role) {
  const briefs = {
    CLERK: getCurrentUser()?.delegatedAuthorities?.length
      ? "ตรวจรับ ส่งคืน และเสนอเปลี่ยนหน่วยงานรับผิดชอบตามอำนาจที่ได้รับมอบ"
      : "ตอบรับหรือปฏิเสธการเปลี่ยนหน่วยงานรับผิดชอบในฐานะธุรการคดีปลายทาง",
    DIRECTOR: "มอบหมายหรือเปลี่ยนผู้รับผิดชอบ ตำแหน่ง ผอ. ไม่ทำให้มีสิทธิหัวหน้าพนักงาน ป.ป.ท. โดยอัตโนมัติ",
    PRELIM: "วางแผน 4 ประเด็น รวบรวมหลักฐาน และจัดทำรายงาน 213",
    REVIEW: `${getCurrentUser()?.position || "ผู้อำนวยการหน่วยงานเจ้าของสำนวน"} ผู้ได้รับอำนาจ ${getCurrentUser()?.authority || "หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ"}`,
    EXECUTIVE: "พิจารณาขยายเวลารอบบนตามสายกำกับ",
    SECRETARY: "อนุมัติเปลี่ยนหน่วยงานรับผิดชอบ เสนอเรื่องต่อคณะกรรมการฯ และพิจารณารายงานเหตุล่าช้า",
    CASE_ADMIN: "ส่งเรื่องตามคำสั่งเลขาธิการฯ และบันทึกความเห็นที่ได้รับกลับมา",
    INQUIRY: "ดำเนินการตามคำสั่ง แจ้งข้อกล่าวหา และจัดทำรายงาน 644",
    CASE_TRACKING: "ส่งสำนวนและหนังสือแจ้งหน่วยงานต้นสังกัดเพื่อพิจารณาโทษทางวินัย",
    DECISION_AFFAIRS: "ส่งสำเนามติและหนังสือให้ผู้รับผิดชอบสำนวนเก็บรวบรวม",
    SPECIAL_OFFICER: "ตรวจสอบข้อเท็จจริง จัดทำรายงานเสนอเลขาธิการฯ และแจ้งหน่วยงานตามผลพิจารณา",
    AUDIT: "ตรวจสอบประวัติการดำเนินงานและการเข้าใช้งานย้อนหลัง"
  };
  return briefs[role] || "งานตามสิทธิ์ที่ได้รับ";
}

function pageHeader(eyebrow, title, description, actions = "") {
  return `
    <header class="page-header">
      <div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </header>
  `;
}

function metric(label, value, detail, tone = "navy") {
  return `<article class="metric metric-${tone}"><p>${escapeHtml(label)}</p><strong>${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></article>`;
}

function hasSpecialMatterAccess() {
  return can("audit.read") || ["special.intake.review", "special.assign", "special.read", "special.report.review.director", "special.report.review.executive", "special.report.decide"].some((permission) => can(permission));
}

function allAuditEvents(state) {
  return [
    ...(state.globalAudit || []),
    ...(state.cases || []).flatMap((item) => item.audit || []),
    ...(state.specialMatters || []).flatMap((matter) => matter.audit || [])
  ].sort((left, right) => String(right.time || "").localeCompare(String(left.time || "")));
}

function renderDashboard(state, user) {
  const role = user.role;
  if (role === "AUDIT") return renderAuditDashboard(state, user);
  if (role === "SPECIAL_OFFICER") return renderSpecialDashboard(state, user);
  const roleCases = relevantCasesForRole(state.cases);
  const queueCount = roleCases.filter((item) => item.plan.status === "SUBMITTED" || item.report213.status === "SUBMITTED" || item.report644.status === "SUBMITTED").length;
  const sevenDaysFromNow = dateAfter(state.demoDate, 7);
  const dueCount = roleCases.filter((item) => {
    const deadline = item.phase === "PRELIMINARY" ? item.report213.deadlineAt : item.phase === "INQUIRY" ? item.report644.deadlineAt : "";
    return deadline && deadline <= sevenDaysFromNow;
  }).length;
  const waiting = roleCases.filter((item) => item.phase.startsWith("WAIT_A7")).length;

  return `
    ${pageHeader("ภาพรวมงาน", `งานที่ต้องดำเนินการ`, roleBrief(role), `<a class="button button-primary" href="#/cases">เปิดรายการงาน</a>`)}
    <section class="metrics-grid" aria-label="สรุปงาน">
      ${metric("งานในความรับผิดชอบ", roleCases.length, "รายการที่ต้องติดตาม")}
      ${metric("ใกล้หรือเกินกำหนด", dueCount, "ตรวจตามกำหนดเวลาของสำนวน", dueCount ? "red" : "navy")}
      ${metric("รอผลการพิจารณา", waiting, "รายงาน 213 และรายงาน 644", "gold")}
      ${metric("งานรอตรวจ", queueCount, "แผนและรายงานที่เสนอแล้ว")}
    </section>

    <section class="dashboard-grid">
      <article class="panel live-panel">
        <div class="panel-heading"><div><p class="eyebrow">สถานะล่าสุด</p><h2>ความคืบหน้าสำนวน</h2></div><span class="live-pulse">อัปเดต ${formatDate(state.demoDate)}</span></div>
        <p class="panel-intro">ตรวจดูขั้นตอนปัจจุบันและงานที่ต้องดำเนินการต่อของสำนวน</p>
        ${roleCases[0] ? renderLiveTimeline(roleCases[0], true) : emptyState("ไม่มีสำนวนในความรับผิดชอบ", "เมื่องานถูกส่งถึงบทบาทนี้ สำนวนจะแสดงที่นี่")}
      </article>

      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">ต้องดำเนินการ</p><h2>งานลำดับถัดไป</h2></div></div>
        <div class="task-stack">
          ${roleCases.slice(0, 5).map((item) => dashboardTask(item, role)).join("") || emptyState("ไม่มีงานค้างตามบทบาทนี้", "เปิดรายการสำนวนเพื่ออ่านข้อมูลทั้งหมด")}
        </div>
      </article>
    </section>
    ${renderRoleSpecialMatterQueue(state)}
  `;
}

function renderAuditDashboard(state, user) {
  const events = allAuditEvents(state);
  const conflicts = events.filter((event) => event.outcome === "CONFLICT").length;
  const denied = events.filter((event) => ["FORBIDDEN", "REJECTED"].includes(event.outcome)).length;
  return `
    ${pageHeader("ภาพรวมการตรวจสอบ", "ติดตามประวัติการใช้งานระบบ", roleBrief(user.role), `<a class="button button-primary" href="#/audit">เปิดประวัติการใช้งาน</a>`)}
    <section class="metrics-grid audit-metrics" aria-label="สรุปข้อมูลตรวจสอบ">
      ${metric("สำนวนทั่วไป", state.cases.length, "รายงาน 213 และรายงาน 644")}
      ${metric("เรื่อง ม.58/2–58/3", state.specialMatters.length, "เรื่องตรวจสอบข้อเท็จจริง", "gold")}
      ${metric("เหตุการณ์ทั้งหมด", events.length, "รวมการทำงานและการเข้าถึง")}
      ${metric("ข้อมูลขัดกัน", conflicts, "รายการที่ข้อมูลเปลี่ยนระหว่างทำงาน", conflicts ? "red" : "navy")}
      ${metric("รายการถูกปฏิเสธ", denied, "ไม่มีสิทธิ์หรือข้อมูลไม่ผ่านเงื่อนไข", denied ? "red" : "navy")}
    </section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">เหตุการณ์ล่าสุด</p><h2>การดำเนินงานและการเข้าถึง</h2></div><a class="button button-secondary" href="#/audit">ดูประวัติทั้งหมด</a></div>
      ${events.length ? renderAuditTable(events.slice(0, 8)) : emptyState("ยังไม่มีประวัติการใช้งาน", "เหตุการณ์จะแสดงเมื่อมีการดำเนินงานหรือพยายามเข้าถึงข้อมูล")}
    </section>
  `;
}

function specialMatterTaskLabel(matter) {
  const labels = {
    PENDING_CLERK_REVIEW: "ตรวจข้อมูลและเสนอผู้อำนวยการ",
    PENDING_DIRECTOR_ASSIGNMENT: "มอบหมายเจ้าหน้าที่ตรวจสอบข้อเท็จจริง",
    AWAITING_DIRECTOR_REVIEW: "ตรวจรายงานและเสนอผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับ",
    AWAITING_EXECUTIVE_REVIEW: "ตรวจรายงานและเสนอเลขาธิการฯ",
    AWAITING_SECRETARY: "พิจารณารายงานและกำหนดหน่วยงานปลายทาง"
  };
  return labels[matter.status] || SPECIAL_MATTER_STATES[matter.status] || "เปิดเรื่องตรวจสอบข้อเท็จจริง";
}

function renderRoleSpecialMatterQueue(state) {
  if (!hasSpecialMatterAccess()) return "";
  const matters = relevantSpecialMatters(state.specialMatters);
  return `<section class="panel special-role-panel"><div class="panel-heading"><div><p class="eyebrow">งานตรวจสอบข้อเท็จจริง</p><h2>เรื่องตามมาตรา 58/2 และ 58/3</h2><p class="panel-intro">งานที่รอการดำเนินการตามหน้าที่ของบัญชีนี้</p></div><div class="inline-actions">${badge(`${matters.length} เรื่อง`, matters.length ? "SUBMITTED" : "APPROVED")}<a class="button button-secondary" href="#/special-matters">เปิดรายการทั้งหมด</a></div></div><div class="task-stack">${matters.slice(0, 5).map((matter) => `<a class="task-row" href="#/special-matters/${encodeURIComponent(matter.id)}"><span><strong>${escapeHtml(specialMatterTaskLabel(matter))}</strong><small>${escapeHtml(matter.referenceNo)} · ${escapeHtml(matter.title)}</small></span><span aria-hidden="true">›</span></a>`).join("") || emptyState("ไม่มีเรื่องที่รอดำเนินการ", "เมื่อเรื่องเข้าสู่หน้าที่ของบัญชีนี้ รายการจะแสดงที่นี่")}</div></section>`;
}

function renderSpecialDashboard(state, user) {
  const matters = relevantSpecialMatters(state.specialMatters);
  const factFinding = matters.filter((matter) => ["ASSIGNED", "FACT_FINDING", "REPORT_RETURNED"].includes(matter.status)).length;
  const awaitingChain = matters.filter((matter) => matter.status.startsWith("AWAITING_") && matter.status !== "AWAITING_AGENCY_ACTION").length;
  const notificationWork = matters.filter((matter) => ["READY_TO_NOTIFY", "AWAITING_AGENCY_ACTION", "READY_PUBLIC_NOTICE"].includes(matter.status)).length;
  return `
    ${pageHeader("ภาพรวมงาน", "งานตรวจสอบข้อเท็จจริงของฉัน", roleBrief(user.role), `<a class="button button-primary" href="#/special-matters">เปิดรายการงาน</a>`)}
    <section class="metrics-grid" aria-label="สรุปงาน">
      ${metric("งานในความรับผิดชอบ", matters.length, "เรื่องตามมาตรา 58/2 และ 58/3")}
      ${metric("กำลังตรวจข้อเท็จจริง", factFinding, "รวมรายงานที่ถูกส่งกลับแก้ไข", factFinding ? "gold" : "navy")}
      ${metric("อยู่ระหว่างเสนอ", awaitingChain, "ผู้อำนวยการ → ผู้ช่วย/รองเลขาธิการฯ ที่กำกับ → เลขาธิการฯ")}
      ${metric("งานแจ้งและติดตาม", notificationWork, "แจ้งหน่วยงานหรือประกาศให้ประชาชนทราบ", notificationWork ? "red" : "navy")}
    </section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">ต้องดำเนินการ</p><h2>งานลำดับถัดไป</h2></div><span class="live-pulse">อัปเดต ${formatDate(state.demoDate)}</span></div><div class="task-stack">${matters.slice(0, 6).map((matter) => `<a class="task-row" href="#/special-matters/${encodeURIComponent(matter.id)}"><span><strong>${escapeHtml(SPECIAL_MATTER_STATES[matter.status] || matter.status)}</strong><small>${escapeHtml(matter.referenceNo)} · ${escapeHtml(matter.title)}</small></span><span aria-hidden="true">›</span></a>`).join("") || emptyState("ไม่มีงานค้างในความรับผิดชอบ", "เมื่อได้รับมอบหมาย เรื่องจะแสดงที่นี่")}</div></section>
  `;
}

function renderNotifications(state) {
  const user = getCurrentUser();
  const notifications = (state.notifications || [])
    .filter((entry) => entry.recipientAccount === user.username && entry.status !== "CANCELLED")
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt));
  return `${pageHeader("กำหนดเวลาสำนวน", "การแจ้งเตือนของฉัน", "แจ้งเตือนรายงาน 213 วันที่ 15, 30 และ 45 ของกรอบเริ่มต้นหรือรอบขยายเวลาที่อนุมัติ")}
    <section class="panel"><div class="queue-list">${notifications.length ? notifications.map((entry) => {
      const effectiveStatus = entry.readAt ? "READ" : entry.dueAt <= state.demoDate ? "DUE" : "SCHEDULED";
      const label = effectiveStatus === "READ" ? "อ่านแล้ว" : effectiveStatus === "DUE" ? "ถึงกำหนดแจ้งเตือน" : "รอถึงวันแจ้งเตือน";
      return `<article class="queue-row"><div><p class="eyebrow">รายงาน ${entry.reportType} · ${entry.extensionRound ? `ขยายเวลาครั้งที่ ${entry.extensionRound}` : "กรอบเริ่มต้น"}</p><h3>${escapeHtml(entry.caseId)}</h3><p>วันที่ ${entry.elapsedDays} ของรอบ · แจ้งเตือน ${formatDate(entry.dueAt)}</p></div><div class="inline-actions">${badge(label, effectiveStatus)}${effectiveStatus === "DUE" ? `<button class="button button-secondary" type="button" data-action="read-notification" data-notification-id="${escapeHtml(entry.id)}">ทำเครื่องหมายว่าอ่านแล้ว</button>` : ""}<a class="button button-primary" href="#/cases/${encodeURIComponent(entry.caseId)}/report213">เปิดรายงาน 213</a></div></article>`;
    }).join("") : emptyState("ไม่มีการแจ้งเตือน", "การแจ้งเตือนจะแสดงเฉพาะผู้รับผิดชอบหลักของสำนวน")}</div></section>`;
}

function relevantCasesForRole(cases) {
  const account = getCurrentUser();
  return cases.filter((item) => canReadCase(account, item));
}

function relevantSpecialMatters(matters) {
  const account = getCurrentUser();
  return (matters || []).filter((matter) => canReadSpecialMatter(account, matter));
}

function currentUserOwns(item) {
  const name = getCurrentUser()?.name;
  return Boolean(name && (item.assignment.assignees || []).some((entry) => entry.name === name));
}

function currentUserAcknowledged(item) {
  const name = getCurrentUser()?.name;
  return Boolean(name && (item.assignment.assignees || []).some((entry) => entry.name === name && entry.acknowledgedAt));
}

function currentUserLeadAcknowledged(item) {
  const name = getCurrentUser()?.name;
  return Boolean(name && (item.assignment.assignees || []).some((entry) => entry.name === name && entry.assignmentRole === "LEAD" && entry.acknowledgedAt));
}

function renderAssignees(item) {
  const assignees = item.assignment.assignees || [];
  if (!assignees.length) return "ยังไม่กำหนด";
  return assignees.map((entry) => `${entry.assignmentRole === "LEAD" ? "ผู้รับผิดชอบหลัก" : "ผู้ช่วยสำนวน"}: ${entry.name} (${entry.acknowledgedAt ? "รับงานแล้ว" : "รอยืนยันรับงาน"})`).join(" · ");
}

function currentUserCanRespondTransfer(item) {
  const user = getCurrentUser();
  return Boolean(user?.allowedOwningUnits?.includes(item.assignment.transferTarget));
}

function dashboardTask(item, role) {
  const labels = {
    CLERK: item.assignment.state === "TRANSFER_APPROVAL_PENDING"
      ? "รอเลขาธิการฯ อนุมัติโอน"
      : item.assignment.state === "TRANSFER_PENDING"
        ? currentUserCanRespondTransfer(item) ? "พิจารณารับโอน" : "ติดตามผลการรับโอน"
        : "ตรวจรับสำนวน",
    DIRECTOR: item.assignment.state === "UNASSIGNED" ? "มอบหมายผู้รับผิดชอบ" : "ตรวจสถานะการรับงาน",
    PRELIM: item.phase === "POST_DECISION" ? "ดำเนินการตามมติ" : item.plan.status !== "APPROVED" ? "จัดทำแผน 4 ประเด็น" : "จัดทำรายงาน 213",
    REVIEW: item.handoff.deliveries.some((entry) => entry.status === "AWAITING_SIGNATURE") ? "ตรวจและลงนามหนังสือนำส่ง" : item.plan.status === "SUBMITTED" ? "ตรวจแผน" : item.report213.status === "SUBMITTED" ? "ตรวจรายงาน 213" : "ตรวจรายงาน 644",
    EXECUTIVE: "พิจารณาขยายเวลา",
    SECRETARY: item.assignment.state === "TRANSFER_APPROVAL_PENDING" ? "พิจารณาอนุมัติโอนสำนวน" : item.phase.startsWith("WAIT_A7") ? "รับผลพิจารณา" : "ส่งรายงาน/พิจารณาเหตุล่าช้า",
    INQUIRY: item.phase === "POST_DECISION" ? "ดำเนินการตามมติ" : "ดำเนินการรายงาน 644",
    CASE_TRACKING: "ส่งหนังสือแจ้งหน่วยงานต้นสังกัด",
    DECISION_AFFAIRS: "ส่งสำเนามติให้ผู้รับผิดชอบสำนวน",
    SPECIAL_OFFICER: "ตรวจสอบข้อเท็จจริงและจัดทำรายงาน",
    AUDIT: "ตรวจประวัติคำสั่ง"
  };
  return `<a class="task-row" href="#/cases/${encodeURIComponent(item.id)}/overview"><span><strong>${escapeHtml(labels[role] || "เปิดสำนวน")}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.title)}</small></span><span aria-hidden="true">›</span></a>`;
}

function hasPendingExtension(item) {
  return [...item.report213.extensionHistory, ...item.report644.extensionHistory].some((entry) => entry.status === "PENDING");
}

function hasPendingExtensionForTier(item, authorityTier) {
  return [...item.report213.extensionHistory, ...item.report644.extensionHistory].some((entry) => entry.status === "PENDING" && entry.authorityTier === authorityTier);
}

function hasExhaustionStatus(item, status) {
  return [item.report213.exhaustion, item.report644.exhaustion].some((entry) => entry?.status === status);
}

function renderLiveTimeline(item, compact = false) {
  const current = PHASE_ORDER.indexOf(item.phase);
  const steps = PHASE_ORDER.map((phase, index) => {
    const stateClass = index < current ? "is-complete" : index === current ? "is-current" : "is-future";
    const detail = timelineDetail(item, phase);
    return `
      <li class="timeline-step ${stateClass}">
        <span class="timeline-node" aria-hidden="true"></span>
        <div><span class="timeline-label">${escapeHtml(PHASES[phase])}</span>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>
      </li>`;
  }).join("");
  return `<div class="live-timeline ${compact ? "is-compact" : ""}"><div class="timeline-case"><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.title)}</span></div><ol>${steps}</ol></div>`;
}

function timelineDetail(item, phase) {
  if (phase === item.phase) {
    if (phase === "PRELIMINARY") return `รายงาน 213: ${statusLabel(REPORT_STATES, item.report213.status)}`;
    if (phase === "INQUIRY") return `รายงาน 644: ${statusLabel(REPORT_STATES, item.report644.status)}`;
    if (phase.startsWith("WAIT_A7")) return statusLabel(INTEGRATION_STATES, item.integration.status);
    if (phase === "POST_DECISION" || phase === "CLOSED") return statusLabel(HANDOFF_STATES, item.handoff.status);
    return statusLabel(ASSIGNMENT_STATES, item.assignment.state);
  }
  return "";
}

function renderCases(state) {
  const sourceCases = relevantCasesForRole(state.cases);
  const query = activeFilter.query.toLowerCase();
  const cases = sourceCases.filter((item) => {
    const matchesQuery = !query || [item.id, item.title, item.agency, item.owningUnit, item.assignment.investigator].some((value) => String(value).toLowerCase().includes(query));
    return matchesQuery && (activeFilter.phase === "ALL" || item.phase === activeFilter.phase);
  });
  return `
    ${pageHeader("ทะเบียนงาน", navItems().find((item) => item.href === "#/cases")?.label || "รายการสำนวน", "ค้นหาและเปิดสำนวนที่อยู่ในความรับผิดชอบ")}
    <section class="panel filter-panel">
      <form data-form="case-filter" class="filter-form">
        <label class="field field-grow"><span>ค้นหา</span><input name="query" value="${escapeHtml(activeFilter.query)}" placeholder="เลขสำนวน ชื่อเรื่อง หน่วยงาน หรือผู้รับผิดชอบ"></label>
        <label class="field"><span>ระยะงาน</span><select name="phase"><option value="ALL">ทุกระยะงาน</option>${Object.entries(PHASES).map(([value, label]) => `<option value="${value}" ${activeFilter.phase === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select></label>
        <button class="button button-primary" type="submit">ค้นหา</button>
      </form>
    </section>
    <section class="case-list" aria-label="ผลการค้นหา">
      <div class="list-summary">พบ ${cases.length} สำนวน</div>
      ${cases.length ? cases.map(renderCaseCard).join("") : emptyState("ไม่พบสำนวน", "ลองเปลี่ยนคำค้นหาหรือตัวกรองระยะงาน")}
    </section>
  `;
}

function renderCaseCard(item) {
  const deadline = item.phase === "PRELIMINARY" ? item.report213.deadlineAt : item.phase === "INQUIRY" ? item.report644.deadlineAt : "";
  return `
    <article class="case-card">
      <div class="case-card-main">
        <div class="case-ident"><span>${escapeHtml(item.id)}</span>${badge(PHASES[item.phase], item.phase)}</div>
        <h2><a href="#/cases/${encodeURIComponent(item.id)}/overview">${escapeHtml(item.title)}</a></h2>
        <p>${escapeHtml(item.agency)}</p>
      </div>
      <dl class="case-facts">
        <div><dt>การมอบหมาย</dt><dd>${escapeHtml(statusLabel(ASSIGNMENT_STATES, item.assignment.state))}</dd></div>
        <div><dt>ผู้รับผิดชอบ</dt><dd>${escapeHtml(item.assignment.investigator || "ยังไม่กำหนด")}</dd></div>
        <div><dt>กำหนดเวลา</dt><dd>${formatDate(deadline)}</dd></div>
      </dl>
      <details class="case-mini-details">
        <summary>ดูสถานะแบบย่อ</summary>
        ${renderMiniPhaseStepper(item.phase)}
      </details>
      <a class="button button-secondary" href="#/cases/${encodeURIComponent(item.id)}/overview">เปิดสำนวน</a>
    </article>
  `;
}

function renderCaseWorkspace(state, caseId, activeTab) {
  const item = state.cases.find((entry) => entry.id === caseId);
  if (!item) return renderFailure(404, "ไม่พบสำนวน", "ตรวจสอบเลขสำนวนแล้วเลือกจากรายการงานอีกครั้ง");
  if (!canReadCase(getCurrentUser(), item)) return renderFailure(403, "เปิดสำนวนนี้ไม่ได้", "บัญชีนี้ไม่มีสำนวนดังกล่าวอยู่ในรายการงานที่รับผิดชอบ");
  if (!TABS.some(([key]) => key === activeTab)) return renderFailure(404, "ไม่พบหน้าสำนวน", "เลือกหัวข้องานจากแถบเมนูของสำนวน");
  const allowedTabs = ROLE_TABS[getCurrentUser()?.role] || ["overview", "audit"];
  if (!allowedTabs.includes(activeTab)) return renderFailure(403, "เปิดหน้านี้ไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์สำหรับงานส่วนนี้ ให้เลือกงานจากเมนูที่แสดงอยู่");
  const validTab = activeTab;
  const deadline = item.phase === "PRELIMINARY" ? item.report213.deadlineAt : item.phase === "INQUIRY" ? item.report644.deadlineAt : "";
  return `
    <nav class="breadcrumb" aria-label="เส้นทาง"><a href="#/cases">รายการสำนวน</a><span aria-hidden="true">/</span><span>${escapeHtml(item.id)}</span></nav>
    <header class="case-dossier">
      <div class="case-dossier-title"><p>เลขสำนวน</p><h1>${escapeHtml(item.id)}</h1><span>${escapeHtml(item.title)}</span></div>
      <div class="case-dossier-status">${badge(PHASES[item.phase], item.phase)}</div>
      <dl class="case-dossier-facts">
        <div><dt>วันที่รับเรื่อง</dt><dd>${formatDate(item.receivedAt)}</dd></div>
        <div><dt>หน่วยงานเจ้าของสำนวน</dt><dd>${escapeHtml(item.owningUnit)}</dd></div>
        <div><dt>ผู้รับผิดชอบสำนวน</dt><dd>${escapeHtml(item.assignment.investigator || "ยังไม่มอบหมาย")}</dd></div>
        <div><dt>กำหนดเวลา</dt><dd>${deadline ? formatDate(deadline) : "ยังไม่มีกำหนด"}</dd></div>
      </dl>
    </header>
    ${renderPhaseStepper(item.phase)}
    <div class="workspace-shell">
      <nav class="tab-list tab-list-horizontal" aria-label="เมนูสำนวน">
        ${TABS.filter(([key]) => allowedTabs.includes(key)).map(([key, label]) => `<a href="#/cases/${encodeURIComponent(item.id)}/${key}" class="tab-link ${validTab === key ? "is-active" : ""}" ${validTab === key ? 'aria-current="page"' : ""}>${escapeHtml(label)}</a>`).join("")}
      </nav>
      <section class="workspace-content">${renderCaseTab(item, validTab)}</section>
    </div>
  `;
}

function renderPhaseStepper(activePhase) {
  const activeIndex = PHASE_ORDER.indexOf(activePhase);
  return `<ol class="phase-stepper" aria-label="ระยะดำเนินการ">${PHASE_ORDER.map((phase, index) => `<li class="${index < activeIndex ? "is-complete" : index === activeIndex ? "is-current" : ""}" ${index === activeIndex ? 'aria-current="step"' : ""}><span>${index + 1}</span><small>${escapeHtml(PHASES[phase])}</small></li>`).join("")}</ol>`;
}

function renderMiniPhaseStepper(activePhase) {
  const activeIndex = PHASE_ORDER.indexOf(activePhase);
  return `<div class="mini-stagebar">${PHASE_ORDER.map((phase, index) => {
    const status = index < activeIndex ? "is-complete" : index === activeIndex ? "is-current" : "";
    return `${index ? `<span class="mini-stage-line ${index <= activeIndex ? "done" : ""}"></span>` : ""}<span class="mini-stage-dot ${status === "is-complete" ? "done" : status === "is-current" ? "current" : ""}" title="${escapeHtml(PHASES[phase])}"></span>`;
  }).join("")}<span class="mini-stage-label">${escapeHtml(PHASES[activePhase])}</span></div>`;
}

function renderCaseTab(item, tab) {
  const views = {
    overview: renderOverviewTab,
    assignment: renderAssignmentTab,
    plan: renderPlanTab,
    worklog: renderWorklogTab,
    evidence: renderEvidenceTab,
    report213: renderReport213Tab,
    board: renderBoardTab,
    report644: renderReport644Tab,
    handoff: renderHandoffTab,
    relations: renderRelationsTab,
    audit: renderAuditTab
  };
  return views[tab](item);
}

function renderOverviewTab(item) {
  return `
    <div class="content-heading"><div><p class="eyebrow">ข้อมูลสำนวน</p><h2>ภาพรวมสำนวน</h2></div></div>
    <div class="overview-grid">
      <article class="panel inset-panel">
        <h3>ข้อมูลรับเรื่อง</h3>
        <dl class="detail-list">
          <div><dt>เลขสำนวน</dt><dd>${escapeHtml(item.id)}</dd></div>
          <div><dt>วันที่รับ</dt><dd>${formatDate(item.receivedAt)}</dd></div>
          <div><dt>หน่วยงานเจ้าของสำนวน</dt><dd>${escapeHtml(item.owningUnit)}</dd></div>
          <div><dt>หน่วยงานที่เกี่ยวข้อง</dt><dd>${escapeHtml(item.agency)}</dd></div>
          <div><dt>ผู้ร้อง</dt><dd>${escapeHtml(item.complainant)}</dd></div>
          <div><dt>หน่วยงานผู้ส่ง</dt><dd>${escapeHtml(item.sourceBoundary)}</dd></div>
          <div><dt>ความเร่งด่วน</dt><dd>${escapeHtml(item.priority)}</dd></div>
        </dl>
      </article>
      <article class="panel inset-panel">
        <h3>สถานะงาน</h3>
        <dl class="detail-list">
          <div><dt>การมอบหมาย</dt><dd>${escapeHtml(statusLabel(ASSIGNMENT_STATES, item.assignment.state))}</dd></div>
          <div><dt>ชุดปฏิบัติงาน</dt><dd>${escapeHtml(item.assignment.team || "ยังไม่กำหนด")}</dd></div>
          <div><dt>ผู้รับผิดชอบ</dt><dd>${escapeHtml(item.assignment.investigator || "ยังไม่กำหนด")}</dd></div>
          <div><dt>รายงาน 213</dt><dd>${escapeHtml(statusLabel(REPORT_STATES, item.report213.status))}</dd></div>
          <div><dt>รายงาน 644</dt><dd>${escapeHtml(statusLabel(REPORT_STATES, item.report644.status))}</dd></div>
          <div><dt>ส่งต่อ</dt><dd>${escapeHtml(statusLabel(HANDOFF_STATES, item.handoff.status))}</dd></div>
        </dl>
      </article>
    </div>
    <article class="panel live-panel standalone"><div class="panel-heading"><div><p class="eyebrow">ความคืบหน้า</p><h3>ลำดับการดำเนินงาน</h3></div><span class="live-pulse">${escapeHtml(PHASES[item.phase])}</span></div>${renderLiveTimeline(item)}</article>
  `;
}

function actionButton(permission, command, caseId, label, options = {}) {
  if (!can(permission)) return "";
  const variant = options.variant || "secondary";
  const source = getState();
  const itemVersion = source.cases.find((item) => item.id === caseId)?.version
    ?? (source.specialMatters || []).find((item) => item.id === caseId)?.version;
  const data = { "expected-version": itemVersion, ...(options.data || {}) };
  const attrs = Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`).join("");
  return `<button class="button button-${variant}" type="button" data-open-command="${command}" data-case-id="${escapeHtml(caseId)}"${attrs}>${escapeHtml(label)}</button>`;
}

function renderAssignmentTab(item) {
  const intakeActions = item.phase === "INTAKE" && item.intakeDecision !== "ACCEPTED" && !["TRANSFER_APPROVAL_PENDING", "TRANSFER_PENDING"].includes(item.assignment.state) ? [
    actionButton("intake.accept", "ACCEPT_CASE", item.id, "รับเรื่องไว้ดำเนินการ", { variant: "primary" }),
    actionButton("intake.return", "RETURN_CASE", item.id, "ส่งเรื่องคืนศูนย์รับเรื่องร้องเรียน"),
    actionButton("transfer.request", "REQUEST_TRANSFER", item.id, "เสนอเปลี่ยนหน่วยงานรับผิดชอบ")
  ].join("") : "";
  const transferActions = item.assignment.state === "TRANSFER_PENDING" && currentUserCanRespondTransfer(item) ? [
    actionButton("transfer.respond", "RESPOND_TRANSFER", item.id, "รับเรื่องโอน", { variant: "primary", data: { decision: "ACCEPT" } }),
    actionButton("transfer.respond", "RESPOND_TRANSFER", item.id, "ไม่รับเรื่องโอน", { variant: "danger", data: { decision: "REJECT" } })
  ].join("") : "";
  const canAssignCurrentState = item.assignment.state === "UNASSIGNED" && (item.phase !== "INTAKE" || item.intakeDecision === "ACCEPTED");
  const assignActions = canAssignCurrentState
    ? actionButton("assignment.assign", "ASSIGN_INVESTIGATOR", item.id, "มอบหมายผู้รับผิดชอบ", { variant: "primary" })
    : ["ASSIGNED", "ACKNOWLEDGED", "REASSIGN_PENDING"].includes(item.assignment.state)
      ? actionButton("assignment.change", "CHANGE_INVESTIGATOR", item.id, "เปลี่ยนผู้รับผิดชอบ")
      : "";
  const acknowledgeAction = currentUserOwns(item) && !currentUserAcknowledged(item) ? actionButton("assignment.acknowledge", "ACKNOWLEDGE_ASSIGNMENT", item.id, "ยืนยันรับผิดชอบสำนวน", { variant: "primary" }) : "";
  const readiness = [
    ["มีเลขสำนวน", Boolean(item.id)],
    ["มีรายละเอียดเรื่องร้องเรียน", Boolean(item.title)],
    ["มีวันที่รับเรื่อง", Boolean(item.receivedAt)],
    ["มีข้อมูลหน่วยงานที่เกี่ยวข้อง", Boolean(item.agency)],
    ["มีข้อมูลผู้ร้องเรียน", Boolean(item.complainant)]
  ];
  const transferStatus = {
    NOT_REQUIRED: "ไม่มีคำขอเปลี่ยนหน่วยงาน",
    PENDING: "รอพิจารณา",
    APPROVED: "อนุมัติแล้ว",
    REJECTED: "ไม่อนุมัติ"
  }[item.assignment.transferApproval?.status] || "รอตรวจสอบ";
  const hasTransfer = Boolean(item.assignment.transferTarget || item.assignment.transferReason || item.assignment.transferApproval?.status !== "NOT_REQUIRED");
  const hasAssignment = Boolean((item.assignment.assignees || []).length || item.assignment.team);
  const actions = `${intakeActions}${transferActions}${assignActions}${acknowledgeAction}`;
  return `
    <div class="content-heading"><div><p class="eyebrow">งานรับเรื่อง</p><h2>ตรวจสอบหน่วยงานรับผิดชอบ</h2><p>ตรวจข้อมูลเรื่องร้องเรียนก่อนรับไว้ดำเนินการหรือเสนอเปลี่ยนหน่วยงาน</p></div>${badge(statusLabel(ASSIGNMENT_STATES, item.assignment.state), item.assignment.state)}</div>
    <div class="intake-grid">
      <article class="panel intake-information">
        <div class="panel-heading"><div><p class="eyebrow">ข้อมูลที่ได้รับ</p><h3>รายละเอียดเรื่องร้องเรียน</h3></div></div>
        <dl class="detail-list wide">
          <div><dt>เรื่องร้องเรียน</dt><dd>${escapeHtml(item.title)}</dd></div>
          <div><dt>หน่วยงานผู้ส่ง</dt><dd>${escapeHtml(item.sourceBoundary)}</dd></div>
          <div><dt>วันที่รับเรื่อง</dt><dd>${formatDate(item.receivedAt)}</dd></div>
          <div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(item.complainant)}</dd></div>
          <div><dt>หน่วยงานที่เกี่ยวข้อง</dt><dd>${escapeHtml(item.agency)}</dd></div>
          <div><dt>ความเร่งด่วน</dt><dd>${escapeHtml(item.priority)}</dd></div>
        </dl>
      </article>
      <article class="panel readiness-panel">
        <div class="panel-heading"><div><p class="eyebrow">ตรวจความพร้อม</p><h3>รายการข้อมูลประกอบ</h3></div></div>
        <ul class="readiness-list">${readiness.map(([label, ready]) => `<li class="${ready ? "is-ready" : "is-missing"}"><span aria-hidden="true">${ready ? "✓" : "!"}</span><strong>${escapeHtml(label)}</strong><small>${ready ? "พร้อมตรวจสอบ" : "ข้อมูลไม่ครบ"}</small></li>`).join("")}</ul>
      </article>
    </div>
    <div class="assignment-status-grid">
      <article class="panel status-card"><div class="panel-heading"><div><p class="eyebrow">การมอบหมาย</p><h3>${escapeHtml(statusLabel(ASSIGNMENT_STATES, item.assignment.state))}</h3></div></div>${hasAssignment ? `<dl class="detail-list"><div><dt>ผู้รับผิดชอบสำนวน</dt><dd>${escapeHtml(renderAssignees(item))}</dd></div><div><dt>ชุดปฏิบัติงาน</dt><dd>${escapeHtml(item.assignment.team || "ยังไม่กำหนด")}</dd></div></dl>` : `<p class="muted">ยังไม่ได้มอบหมายผู้รับผิดชอบสำนวน</p>`}</article>
      <article class="panel status-card"><div class="panel-heading"><div><p class="eyebrow">การเปลี่ยนหน่วยงาน</p><h3>${escapeHtml(item.assignment.transferResponse === "REJECTED" ? "ปลายทางไม่รับโอน" : item.assignment.transferResponse === "ACCEPTED" ? "ปลายทางรับโอนแล้ว" : transferStatus)}</h3></div></div>${hasTransfer ? `<dl class="detail-list"><div><dt>หน่วยงานต้นทาง</dt><dd>${escapeHtml(item.assignment.sourceOwningUnit || item.owningUnit)}</dd></div><div><dt>หน่วยงานที่เสนอ</dt><dd>${escapeHtml(item.assignment.transferTarget || "ยังไม่ระบุ")}</dd></div><div><dt>เหตุผล</dt><dd>${escapeHtml(item.assignment.transferReason || "ยังไม่ระบุ")}</dd></div>${item.assignment.transferResponseReason ? `<div><dt>ผลตอบรับ</dt><dd>${escapeHtml(item.assignment.transferResponseReason)}</dd></div>` : ""}${item.assignment.transferApproval?.sourceMemoNo ? `<div><dt>บันทึกหน่วยงานต้นทาง</dt><dd>${escapeHtml(item.assignment.transferApproval.sourceMemoNo)}</dd></div>` : ""}${item.assignment.transferApproval?.targetMemoNo ? `<div><dt>บันทึกหน่วยงานปลายทาง</dt><dd>${escapeHtml(item.assignment.transferApproval.targetMemoNo)}</dd></div>` : ""}</dl>` : `<p class="muted">เรื่องอยู่ระหว่างการตรวจสอบของหน่วยงานปัจจุบัน</p>`}</article>
    </div>
    ${actions ? `<section class="decision-panel"><div><p class="eyebrow">การดำเนินการ</p><h3>เลือกคำสั่งสำหรับเรื่องนี้</h3></div><div class="action-bar">${actions}</div></section>` : readOnlyNote("เรื่องนี้ไม่มีคำสั่งที่ต้องดำเนินการในขณะนี้")}
  `;
}

function renderPlanTab(item) {
  const editable = can("plan.edit") && currentUserLeadAcknowledged(item) && item.phase === "PRELIMINARY" && ["DRAFT", "RETURNED"].includes(item.plan.status);
  const missingForSubmission = missingPlanSubmissionRequirements(item);
  const issueFields = item.plan.issues.map((issue, index) => `
    <label class="field issue-field"><span><b>${index + 1}</b>${escapeHtml(issue.title)}</span><textarea name="issue-${index}" rows="3" ${editable ? "" : "readonly"}>${escapeHtml(issue.finding)}</textarea></label>
  `).join("");
  const reviewerActions = item.plan.status === "SUBMITTED" ? `${actionButton("plan.review", "APPROVE_PLAN", item.id, "อนุมัติแผน", { variant: "primary" })}${actionButton("plan.review", "RETURN_PLAN", item.id, "ส่งกลับแก้ไข", { variant: "danger" })}` : "";
  return `
    <div class="content-heading"><div><p class="eyebrow">กรอบการทำงาน</p><h2>แผนแสวงหาข้อเท็จจริง 4 ประเด็น</h2></div>${badge(statusLabel(PLAN_STATES, item.plan.status), item.plan.status)}</div>
    ${item.plan.reviewerNote ? alertBox("บันทึกผู้ตรวจ", item.plan.reviewerNote, item.plan.status === "RETURNED" ? "danger" : "info") : ""}
    <form data-form="plan" data-case-id="${escapeHtml(item.id)}" class="form-stack">
      <input type="hidden" name="expectedVersion" value="${item.version}">
      <label class="field"><span>วัตถุประสงค์</span><textarea name="objective" rows="3" ${editable ? "" : "readonly"}>${escapeHtml(item.plan.objective)}</textarea></label>
      <div class="issues-grid">${issueFields}</div>
      ${editable && can("plan.submit") ? submissionReadinessNotice(missingForSubmission) : ""}
      ${editable ? `<div class="action-bar"><button class="button button-secondary" type="submit">บันทึกแผน</button>${can("plan.submit") && !missingForSubmission.length ? '<button class="button button-primary" type="submit" name="intent" value="submit">บันทึกและส่งตรวจ</button>' : ""}</div>` : ""}
    </form>
    ${reviewerActions ? `<div class="action-bar">${reviewerActions}</div>` : !editable ? readOnlyNote() : ""}
  `;
}

function renderWorklogTab(item) {
  const editable = can("worklog.edit") && currentUserAcknowledged(item) && ((getCurrentUser()?.role === "PRELIM" && item.phase === "PRELIMINARY") || (getCurrentUser()?.role === "INQUIRY" && item.phase === "INQUIRY"));
  return `
    <div class="content-heading"><div><p class="eyebrow">หลักฐานการทำงาน</p><h2>บันทึกการดำเนินงาน</h2></div>${badge(`${item.worklogs.length} รายการ`)}</div>
    ${editable ? `<form data-form="worklog" data-case-id="${escapeHtml(item.id)}" class="panel inset-panel compact-form"><input type="hidden" name="expectedVersion" value="${item.version}"><label class="field"><span>วันที่ดำเนินการ</span><input type="date" name="date" max="${escapeHtml(getState().demoDate)}" value="${escapeHtml(getState().demoDate)}" required></label><label class="field field-grow"><span>รายละเอียด</span><input name="detail" required placeholder="ระบุสิ่งที่ดำเนินการและผลที่ได้"></label><button class="button button-primary" type="submit">เพิ่มบันทึก</button></form>` : readOnlyNote()}
    <div class="record-list">${item.worklogs.length ? item.worklogs.map((entry) => `<article class="record"><time>${formatDate(entry.date)}</time><div><strong>${escapeHtml(entry.detail)}</strong><small>${escapeHtml(entry.actor)}</small></div></article>`).join("") : emptyState("ยังไม่มีบันทึกการดำเนินงาน", "เพิ่มบันทึกเมื่อเริ่มรวบรวมข้อเท็จจริง")}</div>
  `;
}

function renderEvidenceTab(item) {
  const user = getCurrentUser();
  const editable = can("evidence.edit") && currentUserAcknowledged(item) && ((user?.role === "PRELIM" && item.phase === "PRELIMINARY") || (user?.role === "INQUIRY" && item.phase === "INQUIRY"));
  const supportActions = can("support.request") && currentUserLeadAcknowledged(item) && ((user?.role === "PRELIM" && item.phase === "PRELIMINARY") || (user?.role === "INQUIRY" && item.phase === "INQUIRY"))
    ? [
        ["WITNESS_PROTECTION", "ส่งคำขอคุ้มครองพยาน"],
        ["SEARCH_WARRANT", "จัดทำคำร้องขอหมายค้น"],
        ["LEGAL_OPINION", "ขอความเห็นด้านกฎหมาย"]
      ].map(([requestType, label]) => actionButton("support.request", "CREATE_SUPPORT_REQUEST", item.id, label, { data: { "request-type": requestType } })).join("")
    : "";
  return `
    <div class="content-heading"><div><p class="eyebrow">บัญชีพยานหลักฐาน</p><h2>เอกสาร วัตถุ และถ้อยคำ</h2></div>${badge(`${item.evidence.length} รายการ`)}</div>
    ${alertBox("งานสนับสนุนสำนวน", "ผู้รับผิดชอบสำนวนเลือกส่งคำขอที่จำเป็นตามข้อเท็จจริงและพยานหลักฐาน", "info")}
    ${supportActions ? `<section class="decision-panel"><div><p class="eyebrow">คำขอที่เกี่ยวข้อง</p><h3>เลือกการดำเนินการที่จำเป็น</h3></div><div class="action-bar">${supportActions}</div></section>` : ""}
    ${editable ? `<form data-form="evidence" data-case-id="${escapeHtml(item.id)}" class="panel inset-panel evidence-form"><input type="hidden" name="expectedVersion" value="${item.version}"><label class="field"><span>ชื่อพยานหลักฐาน</span><input name="title" required></label><label class="field"><span>ประเภท</span><select name="type"><option>เอกสาร</option><option>พยานบุคคล</option><option>วัตถุ</option><option>ข้อมูลดิจิทัล</option></select></label><label class="field"><span>แหล่งที่มา</span><input name="source" required></label><label class="field"><span>สถานะความครบถ้วน</span><select name="integrity"><option>รอตรวจรับ</option><option>ตรวจรับแล้ว</option><option>ต้องขอเพิ่ม</option></select></label><button class="button button-primary" type="submit">เพิ่มพยานหลักฐาน</button></form>` : ""}
    <div class="table-wrap"><table><thead><tr><th>รายการ</th><th>ประเภท</th><th>แหล่งที่มา</th><th>สถานะ</th></tr></thead><tbody>${item.evidence.length ? item.evidence.map((entry) => `<tr><td><strong>${escapeHtml(entry.title)}</strong></td><td>${escapeHtml(entry.type)}</td><td>${escapeHtml(entry.source)}</td><td>${escapeHtml(entry.integrity)}</td></tr>`).join("") : '<tr><td colspan="4">ยังไม่มีพยานหลักฐาน</td></tr>'}</tbody></table></div>
    ${renderSupportRequestHistory(item)}
  `;
}

function renderSupportRequestHistory(item, requestType = "") {
  const requests = (item.supportRequests || []).filter((entry) => !requestType || entry.type === requestType);
  return `<section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">รายการคำขอ</p><h3>ประวัติงานสนับสนุนสำนวน</h3></div>${badge(`${requests.length} รายการ`)}</div>${requests.length ? `<div class="record-list">${requests.map((entry) => `<article class="record"><time>${formatDateTime(entry.requestedAt)}</time><div><strong>${escapeHtml(entry.label)}</strong><small>${escapeHtml(entry.actor)} · ${escapeHtml(entry.status)}</small>${entry.subject ? `<dl class="detail-list compact"><div><dt>เรื่องที่ขอ</dt><dd>${escapeHtml(entry.subject)}</dd></div><div><dt>เป้าหมาย</dt><dd>${escapeHtml(entry.target)}</dd></div><div><dt>เอกสารอ้างอิง</dt><dd>${escapeHtml(entry.documentReference)}</dd></div><div><dt>ข้อเท็จจริงสนับสนุน</dt><dd>${escapeHtml(entry.evidenceBasis)}</dd></div>${entry.contactAddress ? `<div><dt>ข้อมูลติดต่อ/ที่อยู่</dt><dd>${escapeHtml(entry.contactAddress)}</dd></div>` : ""}</dl>` : ""}<p>${escapeHtml(entry.reason)}</p></div></article>`).join("")}</div>` : `<p class="muted">ยังไม่มีคำขอที่ส่งจากสำนวนนี้</p>`}</section>`;
}

function reportCompleteness213(item) {
  const checks = [...item.plan.issues.map((issue) => issue.finding), item.report213.summary, item.report213.recommendation];
  return { complete: checks.filter((value) => String(value).trim()).length, total: checks.length };
}

function reportCompleteness644(item) {
  const fields = ["orderNo", "orderDate", "planSummary", "evidenceSummary", "summary", "recommendation"];
  const process = item.report644.allegationProcess || { notices: [], exceptions: [] };
  const noticesComplete = (process.notices || []).every((notice) => ["SERVED_IN_PERSON", "SERVED_POSTAL", "SERVED_BY_POSTING"].includes(notice.service?.status) && (notice.responses || []).length > 0);
  const processComplete = ((process.notices || []).length > 0 || (process.exceptions || []).length > 0) && noticesComplete;
  return { complete: fields.filter((field) => String(item.report644[field] || "").trim()).length + Number(processComplete), total: fields.length + 1 };
}

function missingPlanSubmissionRequirements(item) {
  const missing = [];
  if (!String(item.plan.objective || "").trim()) missing.push("วัตถุประสงค์");
  if (item.plan.issues.length !== 4 || item.plan.issues.some((issue) => !String(issue.finding || "").trim())) missing.push("วิธีดำเนินการทั้ง 4 ประเด็น");
  return missing;
}

function missingReport213SubmissionRequirements(item) {
  const missing = [];
  if (item.plan.status !== "APPROVED") missing.push("แผนแสวงหาข้อเท็จจริงที่ผ่านการอนุมัติ");
  if (item.plan.issues.length !== 4 || item.plan.issues.some((issue) => !String(issue.finding || "").trim())) missing.push("ข้อมูลทั้ง 4 ประเด็น");
  if (!String(item.report213.summary || "").trim()) missing.push("สรุปข้อเท็จจริง");
  if (!String(item.report213.recommendation || "").trim()) missing.push("ความเห็นเสนอ");
  return missing;
}

function missingReport644SubmissionRequirements(item) {
  const report = item.report644;
  const missing = [];
  if (!String(report.orderNo || "").trim() || !String(report.orderDate || "").trim()) missing.push("เลขและวันที่คำสั่งแต่งตั้งคณะไต่สวน");
  if (!String(report.planSummary || "").trim()) missing.push("แผนการไต่สวน");
  if (!String(report.evidenceSummary || "").trim()) missing.push("สรุปพยานหลักฐาน");
  if (!String(report.summary || "").trim()) missing.push("สรุปรายงาน");
  if (!String(report.recommendation || "").trim()) missing.push("ความเห็นเสนอ");
  const process = report.allegationProcess || { notices: [], exceptions: [] };
  const noticesComplete = (process.notices || []).every((notice) => ["SERVED_IN_PERSON", "SERVED_POSTAL", "SERVED_BY_POSTING"].includes(notice.service?.status) && (notice.responses || []).length > 0);
  if (!((process.notices || []).length > 0 || (process.exceptions || []).length > 0) || !noticesComplete) missing.push("การแจ้งข้อกล่าวหาและผลการชี้แจง หรือเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา");
  const supplemental = report.supplementalInquiry;
  if (supplemental?.status && supplemental.status !== "NOT_REQUIRED") {
    if (supplemental.status !== "ACTIVE") missing.push("ผลอนุมัติการไต่สวนเพิ่มเติม");
    else if (getState().demoDate > supplemental.deadlineAt) missing.push("การขยายเวลาการไต่สวนเพิ่มเติมจากคณะกรรมการ ป.ป.ท.");
  }
  return missing;
}

function submissionReadinessNotice(missing) {
  return missing.length
    ? alertBox("ยังเสนอผู้ตรวจไม่ได้", `กรุณาบันทึกให้ครบ: ${missing.join("; ")}`, "danger")
    : alertBox("พร้อมเสนอผู้ตรวจ", "ข้อมูลที่ต้องใช้ในขั้นเสนอผู้ตรวจครบแล้ว", "success");
}

function completenessBlock(data) {
  const percent = Math.round((data.complete / data.total) * 100);
  return `<div class="completeness"><div><span>ความครบถ้วน</span><strong>${data.complete}/${data.total} รายการ</strong></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div></div>`;
}

function deadlineBlock(label, report, baseDays) {
  return `<article class="deadline-card"><span>${escapeHtml(label)}</span><strong>${formatDate(report.deadlineAt)}</strong><small>กรอบเริ่มต้น ${baseDays} วัน · ขยายเวลา ${report.extensionHistory.filter((entry) => entry.status === "APPROVED").reduce((sum, entry) => sum + Number(entry.requestedDays), 0)} วัน</small></article>`;
}

function overallDeadlineBlock(item) {
  const deadline = item.overallDeadline || {};
  return `<article class="panel inset-panel"><h3>กรอบเวลารวมตามมาตรา 23</h3><dl class="detail-list wide"><div><dt>กรอบปกติ 2 ปี</dt><dd>${formatDate(deadline.normalAt)}</dd></div><div><dt>ขยายเมื่อจำเป็น รวมไม่เกิน 3 ปี</dt><dd>${formatDate(deadline.necessaryAt)}</dd></div><div><dt>ต่างประเทศตามเงื่อนไข รวมไม่เกิน 5 ปี</dt><dd>${formatDate(deadline.foreignEvidenceAt)}</dd></div></dl><p class="rule-note">คำนวณจากวันที่รับเรื่องหรือความปรากฏครั้งแรก ${formatDate(deadline.startAt)}; หน้านี้ไม่วินิจฉัยกฎนับวันรวม/ไม่รวม และไม่เปิดขยาย 3/5 ปีโดยอัตโนมัติ</p></article>`;
}

function renderRevisionHistory(report, reportType) {
  const revisions = report.revisions || [];
  const revisionActionLabels = {
    SAVE: "บันทึกแก้ไข",
    SUBMIT: "เสนอผู้ตรวจ",
    APPROVE: "ผู้ตรวจเห็นชอบ",
    RETURN: "ส่งกลับแก้ไข",
    RETURN_FROM_ACTIVITY7: "ให้ดำเนินการเพิ่มเติม"
  };
  return `<section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">ประวัติรายงาน</p><h3>ประวัติการแก้ไขรายงาน ${reportType}</h3></div>${badge(`${revisions.length} ฉบับ`)}</div>${revisions.length ? `<div class="record-list">${[...revisions].reverse().map((revision) => `<article class="record"><time>ฉบับที่ ${revision.revision}</time><div><strong>${escapeHtml(revisionActionLabels[revision.action] || "ปรับปรุงรายงาน")} · ${escapeHtml(statusLabel(REPORT_STATES, revision.status))}</strong><small>${escapeHtml(revision.actor)} · ${formatDateTime(revision.at)}</small><p>${escapeHtml(revision.content.summary || "ไม่มีข้อความสรุป")}</p></div></article>`).join("")}</div>` : `<p class="muted">ยังไม่มีประวัติการแก้ไขรายงาน</p>`}</section>`;
}

function renderExtensionHistory(item, reportType) {
  const report = reportType === "213" ? item.report213 : item.report644;
  const maxRounds = reportType === "213" ? 2 : 4;
  const directorRounds = reportType === "213" ? "รอบ 1" : "รอบ 1–2";
  const executiveRounds = reportType === "213" ? "รอบ 2" : "รอบ 3–4";
  const pendingActions = (entry) => {
    if (entry.status !== "PENDING") return "";
    const permission = entry.authorityTier === "DIRECTOR_HEAD" ? "extension.review.director" : "extension.review.executive";
    return `<span class="inline-actions">${actionButton(permission, "DECIDE_EXTENSION", item.id, "อนุมัติ", { data: { "report-type": reportType, "extension-id": entry.id, decision: "APPROVED" }, variant: "primary" })}${actionButton(permission, "DECIDE_EXTENSION", item.id, "ไม่อนุมัติ", { data: { "report-type": reportType, "extension-id": entry.id, decision: "REJECTED" }, variant: "danger" })}</span>`;
  };
  return `<div class="extension-history"><h3>ประวัติขยายเวลา</h3><p class="rule-note">รายงาน ${reportType}: ครั้งละไม่เกิน 60 วัน สูงสุด ${maxRounds} ครั้ง · ${directorRounds} พิจารณาโดยหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ · ${executiveRounds} พิจารณาโดยผู้ช่วยเลขาธิการฯ หรือรองเลขาธิการฯ ที่กำกับ · ยื่นล่วงหน้าอย่างน้อย 15 วัน</p>${report.extensionHistory.length ? report.extensionHistory.map((entry) => `<article><div><strong>ครั้งที่ ${escapeHtml(entry.sequence || "ไม่ระบุ")} · ${entry.requestedDays} วัน</strong>${badge(entry.status === "PENDING" ? "รอพิจารณา" : entry.status === "APPROVED" ? "อนุมัติ" : entry.status === "WITHDRAWN" ? "ยุติคำขอเมื่อเสนอรายงาน" : "ไม่อนุมัติ", entry.status)}<p>${escapeHtml(entry.reason)}</p><small>ผู้พิจารณา: ${entry.authorityTier === "DIRECTOR_HEAD" ? "หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ" : "ผู้ช่วยเลขาธิการฯ หรือรองเลขาธิการฯ ที่กำกับ"} · ยื่นเมื่อ ${formatDateTime(entry.requestedAt)}${entry.decidedBy ? ` · พิจารณาโดย ${escapeHtml(entry.decidedBy)}` : ""}${entry.withdrawnBy ? ` · ยุติคำขอโดย ${escapeHtml(entry.withdrawnBy)}` : ""}</small>${entry.checkpoints?.length ? `<p>กำหนดติดตามทุก 15 วัน: ${entry.checkpoints.map((checkpoint) => formatDate(checkpoint.dueAt)).join(" · ")}</p>` : ""}</div>${pendingActions(entry)}</article>`).join("") : `<p class="muted">ยังไม่มีประวัติขยายเวลา</p>`}</div>`;
}

function renderExhaustionWizard(item, reportType) {
  const report = reportType === "213" ? item.report213 : item.report644;
  const exhaustion = report.exhaustion || { status: "NOT_REQUIRED" };
  const approvedCount = report.extensionHistory.filter((entry) => entry.status === "APPROVED").length;
  const maxRounds = reportType === "213" ? 2 : 4;
  if (approvedCount < maxRounds && exhaustion.status === "NOT_REQUIRED") return "";
  const actions = [];
  if (["NOT_REQUIRED", "AVAILABLE"].includes(exhaustion.status) && currentUserLeadAcknowledged(item) && getState().demoDate > report.deadlineAt) actions.push(actionButton("extension.exhaustion.create", "CREATE_EXHAUSTION_REPORT", item.id, "จัดทำรายงานเหตุล่าช้า", { variant: "primary", data: { "report-type": reportType } }));
  if (exhaustion.status === "AWAITING_CHAIN_OPINION") actions.push(actionButton("extension.chain.opinion", "ADD_CHAIN_OPINION", item.id, "ให้ความเห็นในฐานะหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ", { variant: "primary", data: { "report-type": reportType } }));
  if (exhaustion.status === "AWAITING_SECRETARY") actions.push(actionButton("extension.escalation.finalize", "SECRETARY_FINALIZE_ESCALATION", item.id, "เลขาธิการฯ ให้ความเห็นและแนวทาง", { variant: "primary", data: { "report-type": reportType } }));
  if (exhaustion.status === "READY_TO_SEND") actions.push(actionButton("extension.escalation.send", "SEND_TIME_ESCALATION_TO_A7", item.id, "เสนอคณะกรรมการ ป.ป.ท.", { variant: "primary", data: { "report-type": reportType } }));
  if (exhaustion.status === "SENT") actions.push(actionButton("activity7.receive", "RECEIVE_TIME_ESCALATION_DIRECTIVE", item.id, "บันทึกผลพิจารณาและข้อสั่งการ", { variant: "primary", data: { "report-type": reportType } }));
  const exhaustionLabels = {
    NOT_REQUIRED: "ยังไม่ถึงขั้นตอน",
    AVAILABLE: "พร้อมจัดทำรายงาน",
    AWAITING_CHAIN_OPINION: "รอความเห็นหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ",
    AWAITING_SECRETARY: "รอเลขาธิการฯ พิจารณา",
    READY_TO_SEND: "พร้อมเสนอคณะกรรมการฯ",
    SENT: "เสนอคณะกรรมการฯ แล้ว รอข้อสั่งการ",
    DIRECTIVE_RECEIVED: "ได้รับผลพิจารณาและข้อสั่งการแล้ว"
  };
  const directiveDetails = exhaustion.directive
    ? `<div><dt>ผลพิจารณาและข้อสั่งการ</dt><dd>${escapeHtml(exhaustion.directive)}</dd></div><div><dt>ครั้งที่ประชุม</dt><dd>${escapeHtml(exhaustion.meetingNo)} · ${formatDate(exhaustion.meetingDate)}</dd></div><div><dt>วันที่รับผล</dt><dd>${formatDateTime(exhaustion.receivedAt)}</dd></div>`
    : "";
  return `<section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">ครบสิทธิขยายเวลา</p><h3>รายงานเหตุผลและความจำเป็น</h3></div>${badge(exhaustionLabels[exhaustion.status] || "รอตรวจสอบ")}</div><ol><li>ผู้รับผิดชอบหลักจัดทำเหตุผล งานที่ทำ งานคงเหลือ อุปสรรค และวันที่คาดว่าจะเสร็จ</li><li>หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการให้ความเห็น</li><li>เลขาธิการฯ ให้ความเห็นพร้อมแนวทางแก้ไข</li><li>เสนอคณะกรรมการ ป.ป.ท. และรับข้อสั่งการกลับมาดำเนินการ</li></ol>${exhaustion.reasonAndNecessity ? `<dl class="detail-list wide"><div><dt>เหตุผลและความจำเป็น</dt><dd>${escapeHtml(exhaustion.reasonAndNecessity)}</dd></div><div><dt>สิ่งที่ทำแล้ว</dt><dd>${escapeHtml(exhaustion.pastActions)}</dd></div><div><dt>งานคงเหลือ</dt><dd>${escapeHtml(exhaustion.remainingActions)}</dd></div><div><dt>อุปสรรค</dt><dd>${escapeHtml(exhaustion.obstacles)}</dd></div><div><dt>คาดว่าเสร็จ</dt><dd>${formatDate(exhaustion.expectedCompletionAt)}</dd></div><div><dt>ความเห็นหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ</dt><dd>${escapeHtml(exhaustion.chainOpinion || "รอดำเนินการ")}</dd></div><div><dt>ความเห็นเลขาธิการฯ</dt><dd>${escapeHtml(exhaustion.secretaryOpinion || "รอดำเนินการ")}</dd></div><div><dt>แนวทางแก้ไข</dt><dd>${escapeHtml(exhaustion.remedy || "รอดำเนินการ")}</dd></div>${directiveDetails}</dl>` : ""}${exhaustion.directiveWarning ? alertBox("พบข้อสั่งการตอบกลับที่ขัดกัน", exhaustion.directiveWarning, "danger") : ""}${actions.filter(Boolean).length ? `<div class="action-bar">${actions.join("")}</div>` : ""}</section>`;
}

function renderSupplementalInquiry(item) {
  const supplemental = item.report644.supplementalInquiry;
  if (!supplemental || supplemental.status === "NOT_REQUIRED") return "";
  const requestAction = supplemental.status === "ACTIVE" && getState().demoDate > supplemental.deadlineAt && currentUserLeadAcknowledged(item)
    ? actionButton("extension.request", "REQUEST_SUPPLEMENTAL_INQUIRY_EXTENSION", item.id, "เสนอขอขยายเวลาต่อคณะกรรมการ ป.ป.ท.", { variant: "primary" })
    : "";
  const decisionActions = supplemental.status === "PENDING_BOARD"
    ? `${actionButton("activity7.receive", "DECIDE_SUPPLEMENTAL_INQUIRY_EXTENSION", item.id, "บันทึกมติอนุมัติ", { variant: "primary", data: { decision: "APPROVED" } })}${actionButton("activity7.receive", "DECIDE_SUPPLEMENTAL_INQUIRY_EXTENSION", item.id, "บันทึกมติไม่อนุมัติ", { variant: "danger", data: { decision: "REJECTED" } })}`
    : "";
  const statusLabels = {
    ACTIVE: "อยู่ระหว่างไต่สวนเพิ่มเติม",
    PENDING_BOARD: "รอผลพิจารณาคำขอขยายเวลา",
    REJECTED: "ไม่อนุมัติขยายเวลา",
    COMPLETED: "ดำเนินการเพิ่มเติมแล้วเสร็จ"
  };
  return `<section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">คำสั่งให้ไต่สวนเพิ่มเติม</p><h3>กรอบดำเนินการ 30 วัน</h3></div>${badge(statusLabels[supplemental.status] || supplemental.status, supplemental.status)}</div><dl class="detail-list"><div><dt>เหตุที่ส่งกลับ</dt><dd>${escapeHtml(supplemental.reason || "—")}</dd></div><div><dt>วันเริ่ม</dt><dd>${formatDate(supplemental.startedAt)}</dd></div><div><dt>วันครบกำหนด</dt><dd>${formatDate(supplemental.deadlineAt)}</dd></div>${supplemental.extensionReason ? `<div><dt>เหตุผลขอขยาย</dt><dd>${escapeHtml(supplemental.extensionReason)}</dd></div>` : ""}${supplemental.extensionDecisionReason ? `<div><dt>ผลพิจารณา</dt><dd>${escapeHtml(supplemental.extensionDecisionReason)}</dd></div>` : ""}</dl>${requestAction || decisionActions ? `<div class="action-bar">${requestAction}${decisionActions}</div>` : ""}</section>`;
}

function renderSecretaryReview(item, reportType) {
  const report = reportType === "213" ? item.report213 : item.report644;
  const review = report.secretaryReview || {};
  if (review.status === "NOT_REQUIRED") return "";
  const secretaryActions = report.status === "AWAITING_SECRETARY" && ["PENDING", "SUPPORT_OPINION_RECEIVED"].includes(review.status)
    ? `${actionButton("report.secretary.review", "SECRETARY_REVIEW_REPORT", item.id, "รับรองว่าพร้อมเสนอ", { variant: "primary", data: { "report-type": reportType, decision: "READY" } })}${actionButton("report.secretary.review", "SECRETARY_REVIEW_REPORT", item.id, "ส่งกลับดำเนินการเพิ่มเติม", { variant: "danger", data: { "report-type": reportType, decision: "RETURN" } })}${review.status === "PENDING" ? actionButton("report.secretary.review", "SECRETARY_REVIEW_REPORT", item.id, "สั่งขอความเห็นเพิ่มเติม", { data: { "report-type": reportType, decision: "REFER_SUPPORT" } }) : ""}`
    : "";
  const caseAdminActions = review.status === "SUPPORT_ORDERED"
    ? actionButton("support.dispatch", "DISPATCH_SUPPORT_SUBCOMMITTEE", item.id, "ส่งเรื่องให้คณะอนุกรรมการสนับสนุนเลขาธิการฯ", { variant: "primary", data: { "report-type": reportType } })
    : review.status === "SUPPORT_PENDING"
      ? actionButton("support.opinion.record", "RECORD_SUPPORT_SUBCOMMITTEE_OPINION", item.id, "บันทึกความเห็นที่ได้รับ", { variant: "primary", data: { "report-type": reportType } })
      : "";
  const statusLabels = {
    PENDING: "รอเลขาธิการฯ พิจารณา",
    SUPPORT_ORDERED: "เลขาธิการฯ สั่งขอความเห็นเพิ่มเติม",
    SUPPORT_PENDING: "รอความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ",
    SUPPORT_OPINION_RECEIVED: "ได้รับความเห็นแล้ว รอเลขาธิการฯ พิจารณา",
    RETURNED: "ส่งกลับดำเนินการเพิ่มเติม",
    READY: "พร้อมเสนอคณะกรรมการฯ"
  };
  return `<section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">การพิจารณาของเลขาธิการฯ</p><h3>${escapeHtml(statusLabels[review.status] || review.status)}</h3></div></div><dl class="detail-list">${review.disputedIssue ? `<div><dt>ข้อเท็จจริงหรือข้อกฎหมายที่ต้องการความเห็น</dt><dd>${escapeHtml(review.disputedIssue)}</dd></div>` : ""}${review.outboundNote ? `<div><dt>รายละเอียดการส่งเรื่อง</dt><dd>${escapeHtml(review.outboundNote)}</dd></div>` : ""}${review.supportOpinion ? `<div><dt>ความเห็นที่ได้รับ</dt><dd>${escapeHtml(review.supportOpinion)}</dd></div>` : ""}${review.returnedReason ? `<div><dt>เหตุผลที่ส่งกลับ</dt><dd>${escapeHtml(review.returnedReason)}</dd></div>` : ""}</dl>${secretaryActions || caseAdminActions ? `<div class="action-bar">${secretaryActions}${caseAdminActions}</div>` : ""}</section>`;
}

function renderReport213Tab(item) {
  const report = item.report213;
  const editable = can("report213.edit") && currentUserLeadAcknowledged(item) && item.phase === "PRELIMINARY" && ["DRAFT", "RETURNED"].includes(report.status);
  const missingForSubmission = missingReport213SubmissionRequirements(item);
  const reviewActions = report.status === "SUBMITTED" ? `${actionButton("report213.review", "APPROVE_REPORT", item.id, "เห็นชอบรายงาน 213", { variant: "primary", data: { "report-type": "213" } })}${actionButton("report213.review", "RETURN_REPORT", item.id, "ส่งกลับแก้ไข", { variant: "danger", data: { "report-type": "213" } })}` : "";
  const sendAction = report.status === "READY_TO_SEND" ? actionButton("activity7.send", "SEND_ACTIVITY7", item.id, "เสนอรายงาน 213 เพื่อพิจารณารับไว้ไต่สวน", { variant: "primary", data: { "report-type": "213" } }) : "";
  const extensionOpen = !report.extensionHistory.some((entry) => ["PENDING", "REJECTED"].includes(entry.status)) && report.extensionHistory.filter((entry) => entry.status === "APPROVED").length < 2;
  const extensionAction = extensionOpen && ["DRAFT", "RETURNED"].includes(report.status) && can("extension.request") && currentUserLeadAcknowledged(item) && getCurrentUser()?.role === "PRELIM" && item.phase === "PRELIMINARY" ? actionButton("extension.request", "REQUEST_EXTENSION", item.id, "ขอขยายเวลา", { data: { "report-type": "213" } }) : "";
  return `
    <div class="content-heading"><div><p class="eyebrow">ผลการแสวงหาข้อเท็จจริงเบื้องต้น</p><h2>รายงาน 213</h2></div>${badge(statusLabel(REPORT_STATES, report.status), report.status)}</div>
    <div class="report-summary-grid">${completenessBlock(reportCompleteness213(item))}${deadlineBlock("ครบกำหนด 60 วัน", report, 60)}</div>
    ${report.reviewerNote ? alertBox("บันทึกผู้ตรวจ", report.reviewerNote, report.status === "RETURNED" ? "danger" : "info") : ""}
    ${overallDeadlineBlock(item)}
    <form data-form="report213" data-case-id="${escapeHtml(item.id)}" class="form-stack">
      <input type="hidden" name="expectedVersion" value="${item.version}">
      <label class="field"><span>สรุปข้อเท็จจริง</span><textarea name="summary" rows="7" ${editable ? "" : "readonly"}>${escapeHtml(report.summary)}</textarea></label>
      <label class="field"><span>ความเห็นเสนอ</span><textarea name="recommendation" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(report.recommendation)}</textarea></label>
      ${editable && can("report213.submit") ? submissionReadinessNotice(missingForSubmission) : ""}
      ${editable ? `<div class="action-bar"><button class="button button-secondary" type="submit">บันทึกรายงาน</button>${can("report213.submit") && !missingForSubmission.length ? '<button class="button button-primary" type="submit" name="intent" value="submit">บันทึกและเสนอผู้ตรวจ</button>' : ""}${extensionAction}</div>` : ""}
    </form>
    ${reviewActions || sendAction ? `<div class="action-bar">${reviewActions}${sendAction}</div>` : ""}
    ${renderSecretaryReview(item, "213")}
    ${renderExtensionHistory(item, "213")}
    ${renderExhaustionWizard(item, "213")}
    ${renderRevisionHistory(report, "213")}
  `;
}

function renderBoardTab(item) {
  const sendableType = item.report213.status === "READY_TO_SEND" ? "213" : item.report644.status === "READY_TO_SEND" ? "644" : "";
  const sendAction = sendableType ? actionButton("activity7.send", "SEND_ACTIVITY7", item.id, sendableType === "213" ? "เสนอรายงาน 213 เพื่อพิจารณารับไว้ไต่สวน" : "เสนอรายงาน 644 เพื่อพิจารณาวินิจฉัย", { variant: "primary", data: { "report-type": sendableType } }) : "";
  const retryAction = item.integration.status === "FAILED" ? actionButton("activity7.send", "RETRY_ACTIVITY7_SEND", item.id, "ส่งเสนออีกครั้ง", { variant: "primary", data: { "report-type": item.integration.reportType } }) : "";
  const receiveAction = item.phase.startsWith("WAIT_A7") && item.integration.status !== "FAILED" && !item.integration.finalizedAt ? actionButton("activity7.receive", "RECEIVE_ACTIVITY7", item.id, "บันทึกผลการพิจารณา", { variant: "primary" }) : "";
  const unknownResult = item.integration.status === "QUARANTINED";
  return `
    <div class="content-heading"><div><p class="eyebrow">การเสนอเรื่อง</p><h2>เสนอคณะกรรมการ ป.ป.ท.</h2><p>ตรวจรายงานก่อนเสนอ และบันทึกผลการพิจารณาเมื่อได้รับแจ้ง</p></div>${badge(statusLabel(INTEGRATION_STATES, item.integration.status), item.integration.status)}</div>
    ${unknownResult ? alertBox("ผลการพิจารณาอื่นที่ต้องตรวจสอบ", item.integration.lastError || "ตรวจรายละเอียดผลการพิจารณาก่อนดำเนินการต่อ", "danger") : ""}
    ${item.integration.callbackWarning ? alertBox("พบผลตอบกลับภายหลังที่ขัดกับผลหลัก", `${item.integration.callbackWarning} ระบบเก็บไว้ตรวจสอบโดยไม่เปลี่ยนมติหลักและขั้นตอนปัจจุบัน`, "danger") : ""}
    <div class="board-summary-grid">
      <article class="panel board-status-card"><p class="eyebrow">เรื่องที่เสนอ</p><h3>${item.integration.reportType ? `รายงาน ${escapeHtml(item.integration.reportType)}` : "ยังไม่มีรายงานพร้อมเสนอ"}</h3><p>${escapeHtml(item.title)}</p><span>${escapeHtml(statusLabel(INTEGRATION_STATES, item.integration.status))}</span></article>
      <article class="panel board-status-card"><p class="eyebrow">ผลการพิจารณา</p><h3>${escapeHtml(item.integration.decisionLabel || "ยังไม่ได้รับผลการพิจารณา")}</h3>${item.integration.meetingDate ? `<p>ประชุมเมื่อ ${formatDate(item.integration.meetingDate)}</p>` : ""}${item.integration.meetingNo ? `<span>ครั้งที่ประชุม ${escapeHtml(item.integration.meetingNo)}</span>` : ""}${item.integration.meetingNote ? `<p>${escapeHtml(item.integration.meetingNote)}</p>` : ""}</article>
    </div>
    ${sendAction || retryAction || receiveAction ? `<div class="action-bar">${sendAction}${retryAction}${receiveAction}</div>` : readOnlyNote("ยังไม่มีรายการที่ต้องดำเนินการ")}
  `;
}

function renderAllegationProcess(item, editable) {
  const process = item.report644.allegationProcess || { evidenceAssessment: "NOT_RECORDED", notices: [], exceptions: [] };
  const serviceLabels = {
    PENDING_APPOINTMENT: "รอวันนัดหมาย",
    POSTAL_SENT: "ส่งทางไปรษณีย์แล้ว รอผลนำส่ง",
    POSTAL_FAILED: "ไปรษณีย์นำส่งไม่ได้ รอปิดบันทึก",
    SERVED_IN_PERSON: "มารับทราบข้อกล่าวหาแล้ว",
    SERVED_POSTAL: "แจ้งข้อกล่าวหาทางไปรษณีย์สำเร็จ",
    SERVED_BY_POSTING: "ปิดบันทึกแจ้งข้อกล่าวหาแล้ว"
  };
  const methodLabels = {
    IN_PERSON: "มารับทราบด้วยตนเอง",
    POSTAL: "ไปรษณีย์",
    POSTED_DOMICILE: "ปิด ณ ภูมิลำเนา",
    POSTED_WORKPLACE: "ปิด ณ สำนักทำงาน"
  };
  const responseLabels = {
    EXPLANATION_RECEIVED: "ได้รับคำชี้แจงและพยานหลักฐาน",
    NO_EXPLANATION_WITHIN_NOTICE: "ไม่ยื่นคำชี้แจงภายในเวลาที่ระบุในหนังสือแจ้ง"
  };
  const exceptionLabels = {
    INSUFFICIENT_EVIDENCE: "พยานหลักฐานไม่เพียงพอสนับสนุนข้อกล่าวหา",
    OUTSIDE_PACC_AUTHORITY: "สำนวนไม่อยู่ในอำนาจ ป.ป.ท.",
    ACCUSED_DECEASED: "ผู้ถูกกล่าวหาเสียชีวิต"
  };
  const noticeCards = (process.notices || []).map((notice) => {
    const status = notice.service?.status || "PENDING_APPOINTMENT";
    const appointmentOverdue = status === "PENDING_APPOINTMENT" && Boolean(notice.appointmentDate) && getState().demoDate > notice.appointmentDate;
    const visibleStatus = appointmentOverdue ? "เลยวันนัดหมาย — รอบันทึกผล" : serviceLabels[status] || "รอตรวจสอบ";
    const actions = [];
    if (editable && status === "PENDING_APPOINTMENT") {
      actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_APPEARANCE", item.id, "บันทึกการมารับทราบ", { variant: "primary", data: { "notice-id": notice.id } }));
      actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_POSTAL", item.id, "ไม่มาตามนัด — ส่งทางไปรษณีย์", { data: { "notice-id": notice.id } }));
    }
    if (editable && status === "POSTAL_SENT") {
      actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_POSTAL_RESULT", item.id, "ไปรษณีย์นำส่งสำเร็จ", { variant: "primary", data: { "notice-id": notice.id, decision: "DELIVERED" } }));
      actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_POSTAL_RESULT", item.id, "ไปรษณีย์นำส่งไม่ได้", { variant: "danger", data: { "notice-id": notice.id, decision: "FAILED" } }));
    }
    if (editable && status === "POSTAL_FAILED") actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_POSTING", item.id, "บันทึกการปิดหนังสือ", { variant: "primary", data: { "notice-id": notice.id } }));
    if (editable && ["SERVED_IN_PERSON", "SERVED_POSTAL", "SERVED_BY_POSTING"].includes(status)) actions.push(actionButton("report644.edit", "RECORD_ALLEGATION_RESPONSE", item.id, (notice.responses || []).length ? "เพิ่มบันทึกคำชี้แจง" : "บันทึกผลการชี้แจง", { variant: (notice.responses || []).length ? "secondary" : "primary", data: { "notice-id": notice.id } }));
    const serviceReference = notice.service?.resultReference || notice.service?.reference;
    return `<article class="panel inset-panel allegation-card"><div class="panel-heading"><div><p class="eyebrow">ผู้ถูกกล่าวหา</p><h4>${escapeHtml(notice.accusedName)}</h4></div>${badge(visibleStatus, appointmentOverdue ? "OVERDUE" : status)}</div><dl class="detail-list wide"><div><dt>เลขหนังสือแจ้ง</dt><dd>${escapeHtml(notice.letterNo)}</dd></div><div><dt>วันที่หนังสือ</dt><dd>${formatDate(notice.noticeDate)}</dd></div><div><dt>วันนัดหมาย</dt><dd>${formatDate(notice.appointmentDate)}</dd></div><div><dt>พยานหลักฐานที่สนับสนุนข้อกล่าวหา</dt><dd>${escapeHtml(notice.evidenceBasis)}</dd></div>${notice.service?.method ? `<div><dt>วิธีแจ้ง</dt><dd>${escapeHtml(methodLabels[notice.service.method] || notice.service.method)}</dd></div>` : ""}${notice.service?.date ? `<div><dt>วันที่ดำเนินการแจ้ง</dt><dd>${formatDate(notice.service.date)}</dd></div>` : ""}${serviceReference ? `<div><dt>หลักฐานการแจ้ง</dt><dd>${escapeHtml(serviceReference)}</dd></div>` : ""}${notice.service?.location ? `<div><dt>สถานที่ปิดบันทึก</dt><dd>${escapeHtml(notice.service.location)}</dd></div>` : ""}</dl>${(notice.responses || []).length ? `<div class="record-list">${notice.responses.map((response) => `<article class="record"><time>${formatDate(response.date)}</time><div><strong>${escapeHtml(responseLabels[response.outcome] || response.outcome)}</strong><small>${escapeHtml(response.evidenceReference)} · ${escapeHtml(response.recordedBy)}</small><p>${escapeHtml(response.explanation)}</p></div></article>`).join("")}</div>` : alertBox("ยังไม่จบขั้นรับฟังคำชี้แจง", "เมื่อแจ้งข้อกล่าวหาสำเร็จแล้ว ต้องบันทึกคำชี้แจงและพยานฝ่ายผู้ถูกกล่าวหา หรือบันทึกว่าไม่ยื่นภายในเวลาที่ระบุในหนังสือแจ้ง", "info")}${actions.filter(Boolean).length ? `<div class="action-bar">${actions.join("")}</div>` : ""}</article>`;
  }).join("");
  const exceptionCards = (process.exceptions || []).map((entry) => `<article class="record"><time>${formatDateTime(entry.recordedAt)}</time><div><strong>${escapeHtml(exceptionLabels[entry.type] || entry.type)}${entry.accusedName ? ` · ${escapeHtml(entry.accusedName)}` : ""}</strong><small>${escapeHtml(entry.evidenceReference)} · ${escapeHtml(entry.recordedBy)}</small><p>${escapeHtml(entry.note)}</p></div></article>`).join("");
  const entryActions = editable
    ? `${actionButton("report644.edit", "PREPARE_ALLEGATION_NOTICE", item.id, "จัดทำหนังสือแจ้งข้อกล่าวหา", { variant: "primary" })}${actionButton("report644.edit", "RECORD_ALLEGATION_EXCEPTION", item.id, "บันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา")}`
    : "";
  return `<section class="allegation-process"><div class="content-heading compact-heading"><div><p class="eyebrow">ก่อนเสนอรายงาน 644</p><h3>การแจ้งข้อกล่าวหาและรับฟังคำชี้แจง</h3><p>เริ่มเมื่อพยานหลักฐานเพียงพอสนับสนุนข้อกล่าวหา ระบบไม่กำหนดจำนวนวันตอบคำชี้แจงแทนหนังสือแจ้ง</p></div>${badge(`${(process.notices || []).length} หนังสือ · ${(process.exceptions || []).length} เหตุยกเว้น`)}</div>${entryActions ? `<div class="action-bar">${entryActions}</div>` : ""}${exceptionCards ? `<section class="panel inset-panel"><h4>เหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา</h4><div class="record-list">${exceptionCards}</div></section>` : ""}${noticeCards || emptyState("ยังไม่มีรายการแจ้งข้อกล่าวหา", "จัดทำหนังสือเมื่อพยานหลักฐานเพียงพอ หรือบันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา")}</section>`;
}

function renderReport644Tab(item) {
  const report = item.report644;
  const editable = can("report644.edit") && currentUserLeadAcknowledged(item) && item.phase === "INQUIRY" && ["DRAFT", "RETURNED"].includes(report.status);
  const missingForSubmission = missingReport644SubmissionRequirements(item);
  const fields = [
    ["planSummary", "แผนการไต่สวน", "textarea"],
    ["evidenceSummary", "สรุปพยานหลักฐาน", "textarea"],
    ["summary", "สรุปรายงาน", "textarea"],
    ["recommendation", "ความเห็นเสนอ", "textarea"]
  ];
  const controls = fields.map(([name, label, type]) => `<label class="field"><span>${label}</span>${type === "textarea" ? `<textarea name="${name}" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(report[name])}</textarea>` : `<input type="${type === "date" ? "date" : "text"}" name="${name}" value="${escapeHtml(report[name])}" ${editable ? "" : "readonly"}>`}</label>`).join("");
  const reviewActions = report.status === "SUBMITTED" ? `${actionButton("report644.review", "APPROVE_REPORT", item.id, "เห็นชอบรายงาน 644", { variant: "primary", data: { "report-type": "644" } })}${actionButton("report644.review", "RETURN_REPORT", item.id, "ส่งกลับแก้ไข", { variant: "danger", data: { "report-type": "644" } })}` : "";
  const sendAction = report.status === "READY_TO_SEND" ? actionButton("activity7.send", "SEND_ACTIVITY7", item.id, "เสนอรายงาน 644 เพื่อพิจารณาวินิจฉัย", { variant: "primary", data: { "report-type": "644" } }) : "";
  const extensionOpen = !report.extensionHistory.some((entry) => ["PENDING", "REJECTED"].includes(entry.status)) && report.extensionHistory.filter((entry) => entry.status === "APPROVED").length < 4;
  const extensionAction = extensionOpen && ["DRAFT", "RETURNED"].includes(report.status) && can("extension.request") && currentUserLeadAcknowledged(item) && getCurrentUser()?.role === "INQUIRY" && item.phase === "INQUIRY" ? actionButton("extension.request", "REQUEST_EXTENSION", item.id, "ขอขยายเวลา", { data: { "report-type": "644" } }) : "";
  return `
    <div class="content-heading"><div><p class="eyebrow">ผลการไต่สวนข้อเท็จจริง</p><h2>รายงาน 644</h2></div>${badge(statusLabel(REPORT_STATES, report.status), report.status)}</div>
    <div class="report-summary-grid">${completenessBlock(reportCompleteness644(item))}${deadlineBlock("ครบกำหนด 270 วัน", report, 270)}</div>
    <dl class="detail-list panel inset-panel"><div><dt>ประเภทคณะไต่สวน</dt><dd>${escapeHtml(report.appointmentType || "ยังไม่มีคำสั่งแต่งตั้ง")}</dd></div><div><dt>ผู้ลงนามคำสั่ง</dt><dd>${escapeHtml(report.signatory || "—")}</dd></div><div><dt>เลขคำสั่ง</dt><dd>${escapeHtml(report.orderNo || "—")}</dd></div><div><dt>วันที่ลงนามคำสั่ง</dt><dd>${formatDate(report.orderDate)}</dd></div><div><dt>วันเริ่มกรอบ 270 วัน</dt><dd>${formatDate(report.startedAt)}</dd></div><div><dt>วันครบกำหนด</dt><dd>${formatDate(report.deadlineAt)}</dd></div></dl>
    ${overallDeadlineBlock(item)}
    ${report.reviewerNote ? alertBox("บันทึกผู้ตรวจ", report.reviewerNote, report.status === "RETURNED" ? "danger" : "info") : ""}
    ${renderAllegationProcess(item, editable)}
    <form data-form="report644" data-case-id="${escapeHtml(item.id)}" class="form-stack report644-form"><input type="hidden" name="expectedVersion" value="${item.version}">${controls}${editable && can("report644.submit") ? submissionReadinessNotice(missingForSubmission) : ""}${editable ? `<div class="action-bar"><button class="button button-secondary" type="submit">บันทึกรายงาน</button>${can("report644.submit") && !missingForSubmission.length ? '<button class="button button-primary" type="submit" name="intent" value="submit">บันทึกและเสนอผู้ตรวจ</button>' : ""}${extensionAction}</div>` : ""}</form>
    ${reviewActions || sendAction ? `<div class="action-bar">${reviewActions}${sendAction}</div>` : ""}
    ${renderSecretaryReview(item, "644")}
    ${renderExtensionHistory(item, "644")}
    ${renderSupplementalInquiry(item)}
    ${renderExhaustionWizard(item, "644")}
    ${renderRevisionHistory(report, "644")}
  `;
}

function renderHandoffTab(item) {
  const inquiryAction = item.phase === "WAIT_A7_213" && ["ACCEPT_EMPLOYEE_PANEL", "ACCEPT_SUBCOMMITTEE"].includes(item.integration.decision) ? actionButton("handoff.inquiry", "HANDOFF_INQUIRY", item.id, "ส่งมอบสู่งานไต่สวน", { variant: "primary" }) : "";
  const postAction = item.phase === "POST_DECISION" && currentUserLeadAcknowledged(item) && !item.handoff.deliveries.length ? actionButton("handoff.postDecision", "POST_DECISION_HANDOFF", item.id, "จัดเตรียมการดำเนินการตามมติ", { variant: "primary" }) : "";
  const prosecutorDelivery = item.handoff.deliveries.find((entry) => entry.target === "PROSECUTOR");
  const arrestAction = item.phase === "POST_DECISION" && currentUserLeadAcknowledged(item) && item.report644.status === "LOCKED" && prosecutorDelivery && ["SENT", "ACKNOWLEDGED"].includes(prosecutorDelivery.status)
    ? actionButton("support.request", "CREATE_SUPPORT_REQUEST", item.id, "จัดทำคำร้องขอหมายจับ", { data: { "request-type": "ARREST_WARRANT" } })
    : "";
  const deliveryLabels = {
    PENDING: "รอจัดเตรียมเอกสาร",
    AWAITING_SIGNATURE: "รอหัวหน้าพนักงาน ป.ป.ท. ลงนาม",
    SIGNED: "ลงนามแล้ว รอนำส่ง",
    READY_TO_DISPATCH: "ได้รับสำเนาแล้ว รอ กบต. นำส่ง",
    AWAITING_COPY: "กบต. นำส่งแล้ว รอสำเนาจากกลุ่มคำวินิจฉัย/กลุ่มกิจการ",
    SENT: "นำส่งครบถ้วนแล้ว",
    FAILED: "นำส่งไม่สำเร็จ",
    ACKNOWLEDGED: "ปลายทางรับแล้ว"
  };
  const renderDelivery = (entry) => {
    let actions = "";
    if (entry.target === "PARENT_AGENCY") {
      if (!entry.copySentAt) actions += actionButton("disciplinary.copy", "SEND_DISCIPLINARY_COPY", item.id, "ส่งสำเนาให้ผู้รับผิดชอบสำนวน", { data: { target: entry.target } });
      if ((entry.dispatchStatus || "PENDING") === "PENDING") actions += actionButton("disciplinary.dispatch", "DISPATCH_DISCIPLINARY_DELIVERY", item.id, "ส่งหนังสือแจ้งต้นสังกัด", { variant: "primary", data: { target: entry.target } });
      if (entry.dispatchStatus === "FAILED") actions += actionButton("disciplinary.retry", "RETRY_DISCIPLINARY_DELIVERY", item.id, "นำส่งหนังสือแจ้งต้นสังกัดอีกครั้ง", { variant: "primary", data: { target: entry.target } });
    } else {
      if (entry.status === "PENDING") actions += actionButton("postdecision.prepare", "PREPARE_OUTGOING_PACKAGE", item.id, "จัดเตรียมสำนวนและหนังสือนำส่ง", { variant: "primary", data: { target: entry.target } });
      if (entry.status === "AWAITING_SIGNATURE") actions += actionButton("postdecision.sign", "SIGN_OUTGOING_LETTER", item.id, "ตรวจและลงนามหนังสือนำส่ง", { variant: "primary", data: { target: entry.target } });
      if (entry.status === "SIGNED") actions += actionButton("postdecision.dispatch", "DISPATCH_SIGNED_DELIVERY", item.id, "บันทึกผลการนำส่ง", { variant: "primary", data: { target: entry.target } });
      if (entry.status === "FAILED") actions += actionButton("postdecision.retry", "RETRY_OUTGOING_DELIVERY", item.id, "นำส่งอีกครั้ง", { variant: "primary", data: { target: entry.target } });
    }
    const destination = entry.prosecutorOffice || entry.label;
    const references = [entry.outgoingLetterNo, entry.copyReference].filter(Boolean).join(" · ") || "ยังไม่มีเลขอ้างอิง";
    return `<article><span><strong>${escapeHtml(destination)}</strong><small>${escapeHtml(references)}${entry.jurisdiction ? ` · ${escapeHtml(entry.jurisdiction)}` : ""}${entry.otherAgency ? ` · ${escapeHtml(entry.otherAgency.address)} · ${escapeHtml(entry.otherAgency.contact)}` : ""}</small>${entry.preparedBy ? `<small>จัดทำโดย ${escapeHtml(entry.preparedBy)}${entry.signedBy ? ` · ลงนามโดย ${escapeHtml(entry.signedBy)}` : ""}${entry.dispatchedBy ? ` · นำส่งโดย ${escapeHtml(entry.dispatchedBy)}` : ""}</small>` : entry.copySentBy || entry.dispatchedBy ? `<small>${entry.copySentBy ? `ส่งสำเนาโดย ${escapeHtml(entry.copySentBy)}` : ""}${entry.dispatchedBy ? ` · นำส่งโดย ${escapeHtml(entry.dispatchedBy)}` : ""}</small>` : ""}</span><span class="inline-actions">${badge(deliveryLabels[entry.status] || "รอดำเนินการ", entry.status)}${actions}</span></article>`;
  };
  return `
    <div class="content-heading"><div><p class="eyebrow">หลังได้รับผลการพิจารณา</p><h2>ดำเนินการตามมติ</h2></div>${badge(statusLabel(HANDOFF_STATES, item.handoff.status), item.handoff.status)}</div>
    <dl class="detail-list panel inset-panel"><div><dt>ปลายทางตามมติ</dt><dd>${escapeHtml(item.handoff.target || "ยังไม่กำหนด")}</dd></div><div><dt>บันทึก</dt><dd>${escapeHtml(item.handoff.note || "—")}</dd></div></dl>
    <div class="delivery-list">${item.handoff.deliveries.length ? item.handoff.deliveries.map(renderDelivery).join("") : emptyState("ยังไม่มีรายการดำเนินการ", "รายการจะปรากฏหลังรับผลพิจารณาและกำหนดปลายทาง")}</div>
    ${inquiryAction || postAction || arrestAction ? `<div class="action-bar">${inquiryAction}${postAction}${arrestAction}</div>` : !item.handoff.deliveries.length ? readOnlyNote() : ""}
    ${(item.supportRequests || []).some((entry) => entry.type === "ARREST_WARRANT") ? renderSupportRequestHistory(item, "ARREST_WARRANT") : ""}
  `;
}

function renderRelationsTab(item) {
  const merge = item.relations.mergeRequest;
  const ownerActions = currentUserLeadAcknowledged(item) && ["PRELIMINARY", "INQUIRY"].includes(item.phase)
    ? `${merge.status === "NOT_REQUESTED" || ["REJECTED", "RETURNED"].includes(merge.status) ? actionButton("relations.request", "REQUEST_MERGE_CASES", item.id, "เสนอรวมสำนวน") : ""}${actionButton("relations.request", "REQUEST_SPLIT_CASE", item.id, "เสนอแยกเรื่อง")}`
    : "";
  const mergeDecision = merge.status === "PENDING_DECISION"
    ? `${actionButton("relations.decide", "DECIDE_MERGE_CASES", item.id, "บันทึกผลอนุมัติรวมสำนวน", { variant: "primary", data: { decision: "APPROVED" } })}${actionButton("relations.decide", "DECIDE_MERGE_CASES", item.id, "บันทึกผลไม่อนุมัติ", { variant: "danger", data: { decision: "REJECTED" } })}`
    : "";
  const splitRows = item.relations.splitRequests.map((request) => {
    const headActions = request.status === "AWAITING_HEAD" ? `${actionButton("relations.review", "REVIEW_SPLIT_CASE", item.id, "เสนอส่งต่อ", { variant: "primary", data: { "request-id": request.id, decision: "FORWARD" } })}${actionButton("relations.review", "REVIEW_SPLIT_CASE", item.id, "ส่งกลับ", { variant: "danger", data: { "request-id": request.id, decision: "RETURN" } })}` : "";
    const completeAction = ["AWAITING_CASE_ADMIN", "AWAITING_BOARD"].includes(request.status) ? actionButton(request.stage === "PRELIMINARY" ? "relations.forward" : "relations.decide", "COMPLETE_SPLIT_CASE", item.id, request.stage === "PRELIMINARY" ? "บันทึกเลขสำนวนใหม่จากศูนย์รับเรื่องร้องเรียน" : "บันทึกผลคณะกรรมการ ป.ป.ท. และเลขสำนวนใหม่", { variant: "primary", data: { "request-id": request.id } }) : "";
    return `<article class="record"><div><strong>${escapeHtml(request.reason)}</strong><small>${escapeHtml(request.route)} · ${escapeHtml(request.newCaseId || request.pendingNewCaseNumber || request.status)}</small></div><div class="inline-actions">${headActions}${completeAction}</div></article>`;
  }).join("");
  return `<div class="content-heading"><div><p class="eyebrow">ความสัมพันธ์ของสำนวน</p><h2>รวมและแยกเรื่อง</h2><p>เก็บเลขสำนวนเดิม ประวัติ และที่มาของข้อมูลไว้ตรวจสอบ</p></div></div>
    ${item.relations.mergedInto ? alertBox("สำนวนนี้รวมเข้าสำนวนหลักแล้ว", `เปิดสำนวนหลัก ${item.relations.mergedInto} เพื่อดำเนินการต่อ สำนวนนี้อ่านได้อย่างเดียว`, "info") : ""}
    <section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">การรวมสำนวน</p><h3>${merge.status === "NOT_REQUESTED" ? "ยังไม่มีคำขอ" : escapeHtml(merge.status)}</h3></div></div>${merge.candidateId ? `<dl class="detail-list"><div><dt>สำนวนที่เกี่ยวข้อง</dt><dd>${escapeHtml(merge.candidateId)}</dd></div><div><dt>สำนวนหลักที่เสนอ</dt><dd>${escapeHtml(merge.proposedMasterId)}</dd></div><div><dt>ข้อเท็จจริงที่เกี่ยวเนื่อง</dt><dd>${escapeHtml(merge.factsOverlap)}</dd></div><div><dt>ผู้ถูกร้องหรือผู้ถูกกล่าวหาที่เกี่ยวข้อง</dt><dd>${escapeHtml(merge.accusedOverlap)}</dd></div><div><dt>ผลพิจารณา</dt><dd>${escapeHtml(merge.decisionReason || "รอพิจารณา")}</dd></div></dl>` : `<p class="muted">ยังไม่มีการเสนอรวมสำนวน</p>`}${mergeDecision ? `<div class="action-bar">${mergeDecision}</div>` : ""}</section>
    <section class="panel inset-panel"><div class="panel-heading"><div><p class="eyebrow">การแยกเรื่อง</p><h3>${item.relations.splitRequests.length} คำขอ</h3></div></div><div class="record-list">${splitRows || emptyState("ยังไม่มีคำขอแยกเรื่อง", "ผู้รับผิดชอบหลักเสนอได้ตามระยะงานของสำนวน")}</div></section>
    ${ownerActions ? `<div class="action-bar">${ownerActions}</div>` : ""}`;
}

function renderAuditTab(item) {
  return `<div class="content-heading"><div><p class="eyebrow">ตรวจสอบย้อนหลัง</p><h2>ประวัติคำสั่งสำนวน</h2></div>${badge(`${item.audit.length} เหตุการณ์`)}</div>${renderAuditTable(item.audit)}`;
}

function renderReviewQueue(state) {
  const entries = relevantCasesForRole(state.cases).flatMap((item) => {
    const result = [];
    if (item.plan.status === "SUBMITTED") result.push({ item, type: "PLAN", label: "แผน 4 ประเด็น" });
    if (item.report213.status === "SUBMITTED") result.push({ item, type: "213", label: "รายงาน 213" });
    if (item.report644.status === "SUBMITTED") result.push({ item, type: "644", label: "รายงาน 644" });
    return result;
  });
  return `
    ${pageHeader("การกลั่นกรอง", "งานรอตรวจ", "แสดงแผนและรายงานที่ผู้รับผิดชอบเสนอให้พิจารณา")}
    <section class="review-grid">${entries.length ? entries.map(({ item, type, label }) => `<article class="review-card"><div><p class="eyebrow">${escapeHtml(label)}</p><h2>${escapeHtml(item.id)}</h2><p>${escapeHtml(item.title)}</p></div><a class="button button-primary" href="#/cases/${encodeURIComponent(item.id)}/${type === "PLAN" ? "plan" : `report${type}`}">เปิดตรวจ</a></article>`).join("") : emptyState("ไม่มีรายการรอตรวจ", "รายการใหม่จะปรากฏเมื่อผู้รับผิดชอบส่งแผนหรือรายงาน")}</section>
  `;
}

function renderTransferApprovals(state) {
  const cases = relevantCasesForRole(state.cases).filter((item) => item.assignment.state === "TRANSFER_APPROVAL_PENDING");
  return `
    ${pageHeader("อำนาจพิจารณา", "อนุมัติเปลี่ยนหน่วยงานรับผิดชอบ", "เลขาธิการคณะกรรมการ ป.ป.ท. พิจารณาก่อนส่งให้หน่วยงานปลายทางตอบรับ")}
    <section class="review-grid">${cases.length ? cases.map((item) => `<article class="review-card"><div><p class="eyebrow">${escapeHtml(item.assignment.transferTarget)}</p><h2>${escapeHtml(item.id)}</h2><p>${escapeHtml(item.assignment.transferReason)}</p><small>วันที่รับเรื่อง ${formatDate(item.receivedAt)} · กำหนดเวลาเดิมยังคงเดิม</small></div><div class="inline-actions">${actionButton("transfer.approve", "DECIDE_TRANSFER_APPROVAL", item.id, "อนุมัติ", { variant: "primary", data: { decision: "APPROVED" } })}${actionButton("transfer.approve", "DECIDE_TRANSFER_APPROVAL", item.id, "ไม่อนุมัติ", { variant: "danger", data: { decision: "REJECTED" } })}</div></article>`).join("") : emptyState("ไม่มีเรื่องรออนุมัติ", "รายการจะปรากฏเมื่อมีการเสนอเปลี่ยนหน่วยงานรับผิดชอบ")}</section>`;
}

function renderBoardQueue(state) {
  const roleCases = relevantCasesForRole(state.cases);
  const submissions = roleCases.filter((item) => item.report213.status === "READY_TO_SEND" || item.report644.status === "READY_TO_SEND" || ["SENT", "ACKED", "FAILED"].includes(item.integration.status));
  const results = roleCases.filter((item) => item.phase.startsWith("WAIT_A7") || ["DECISION_RECEIVED", "QUARANTINED"].includes(item.integration.status));
  return `
    ${pageHeader("งานเสนอเรื่อง", "เสนอคณะกรรมการ ป.ป.ท.", "ติดตามรายงานที่พร้อมเสนอและบันทึกผลการพิจารณาที่ได้รับ")}
    <div class="two-column">
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">รอดำเนินการ</p><h2>เรื่องรอเสนอคณะกรรมการ ป.ป.ท.</h2></div>${badge(`${submissions.length} รายการ`)}</div><div class="queue-list">${submissions.length ? submissions.map((item) => queueRow(item, "submission")).join("") : emptyState("ไม่มีเรื่องรอเสนอ", "รายงานที่ผ่านการตรวจจะปรากฏที่นี่")}</div></section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">ผลการประชุม</p><h2>ผลการพิจารณาที่ได้รับ</h2></div>${badge(`${results.length} รายการ`)}</div><div class="queue-list">${results.length ? results.map((item) => queueRow(item, "result")).join("") : emptyState("ยังไม่มีผลการพิจารณา", "เรื่องที่อยู่ระหว่างรอผลจะปรากฏที่นี่")}</div></section>
    </div>
  `;
}

function renderSupportOpinionQueue(state) {
  const entries = relevantCasesForRole(state.cases).flatMap((item) => [
    { item, reportType: "213", review: item.report213.secretaryReview },
    { item, reportType: "644", review: item.report644.secretaryReview }
  ]).filter(({ review }) => ["SUPPORT_ORDERED", "SUPPORT_PENDING"].includes(review?.status));
  return `${pageHeader("งานกองบริหารคดี", "ส่งเรื่องขอความเห็นเพิ่มเติม", "ดำเนินการตามคำสั่งเลขาธิการฯ และบันทึกความเห็นที่ได้รับกลับมา")}
    <section class="review-grid">${entries.length ? entries.map(({ item, reportType, review }) => `<article class="review-card"><div><p class="eyebrow">รายงาน ${reportType}</p><h2>${escapeHtml(item.id)}</h2><p>${escapeHtml(review.disputedIssue || item.title)}</p><small>${review.status === "SUPPORT_ORDERED" ? "รอส่งเรื่อง" : "ส่งแล้ว รอความเห็นตอบกลับ"}</small></div><a class="button button-primary" href="#/cases/${encodeURIComponent(item.id)}/report${reportType}">เปิดรายการ</a></article>`).join("") : emptyState("ไม่มีรายการที่ต้องดำเนินการ", "รายการจะปรากฏเมื่อเลขาธิการฯ สั่งให้ขอความเห็นเพิ่มเติม")}</section>`;
}

function queueRow(item, mode) {
  const reportType = item.integration.reportType || (item.report213.status === "READY_TO_SEND" || item.phase === "WAIT_A7_213" ? "213" : "644");
  const action = mode === "submission" && (item[`report${reportType}`]?.status === "READY_TO_SEND")
    ? actionButton("activity7.send", "SEND_ACTIVITY7", item.id, "เสนอเรื่อง", { variant: "primary", data: { "report-type": reportType } })
    : mode === "submission" && item.integration.status === "FAILED"
      ? actionButton("activity7.send", "RETRY_ACTIVITY7_SEND", item.id, "ส่งเสนออีกครั้ง", { variant: "primary", data: { "report-type": reportType } })
    : mode === "result" && item.phase.startsWith("WAIT_A7") && !item.integration.finalizedAt
      ? actionButton("activity7.receive", "RECEIVE_ACTIVITY7", item.id, "บันทึกผลการพิจารณา", { variant: "primary" })
      : `<a class="button button-secondary" href="#/cases/${encodeURIComponent(item.id)}/board">ดูรายละเอียด</a>`;
  return `<article class="queue-row"><div><strong>${escapeHtml(item.id)} · รายงาน ${reportType}</strong><small>${escapeHtml(item.title)}</small><span>${escapeHtml(statusLabel(INTEGRATION_STATES, item.integration.status))}</span></div>${action}</article>`;
}

function renderPostDecisionDeliveries(state) {
  const cases = relevantCasesForRole(state.cases);
  return `${pageHeader("ดำเนินการตามมติ", "งานแจ้งหน่วยงานต้นสังกัด", "แยกหน้าที่ส่งสำเนามติให้ผู้รับผิดชอบสำนวนออกจากหน้าที่ของ กบต. ที่นำส่งหนังสือและสำนวน")}
    <section class="registry-list">${cases.map((item) => {
      const delivery = item.handoff.deliveries.find((entry) => entry.target === "PARENT_AGENCY");
      return `<article class="case-card"><div class="case-card-main"><div class="case-ident"><span>${escapeHtml(item.id)}</span>${badge(statusLabel(HANDOFF_STATES, item.handoff.status), item.handoff.status)}</div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(delivery?.label || "หน่วยงานต้นสังกัด")}</p></div><dl class="case-facts"><div><dt>สำเนาที่ส่งให้ผู้รับผิดชอบ</dt><dd>${escapeHtml(delivery?.copyReference || "—")}</dd></div><div><dt>เลขหนังสือแจ้งต้นสังกัด</dt><dd>${escapeHtml(delivery?.outgoingLetterNo || "—")}</dd></div></dl><a class="button button-secondary" href="#/cases/${encodeURIComponent(item.id)}/handoff">เปิดงานดำเนินการตามมติ</a></article>`;
    }).join("") || emptyState("ไม่มีรายการรอดำเนินการ", "รายการจะปรากฏเมื่อมติกำหนดให้แจ้งหน่วยงานต้นสังกัด")}</section>`;
}

const SPECIAL_TYPE_LABELS = Object.freeze({
  ARTICLE_58_2: "เรื่องความเดือดร้อนตามมาตรา 58/2",
  ARTICLE_58_3: "เรื่องวงเงินหรือความคุ้มค่าโครงการตามมาตรา 58/3"
});

function renderSpecialMatterList(state) {
  const matters = relevantSpecialMatters(state.specialMatters);
  return `${pageHeader("งานตรวจสอบข้อเท็จจริง", "เรื่องตามมาตรา 58/2 และ 58/3", "แยกจากสำนวนรายงาน 213 และ 644 โดยดำเนินการตามประเภทเรื่องและปลายทางที่กฎหมายกำหนด")}
    <section class="case-list" aria-label="รายการเรื่องตรวจสอบข้อเท็จจริง"><div class="list-summary">พบ ${matters.length} เรื่อง</div>${matters.map((matter) => `<article class="case-card"><div class="case-card-main"><div class="case-ident"><span>${escapeHtml(matter.referenceNo)}</span>${badge(SPECIAL_MATTER_STATES[matter.status] || "รอตรวจสอบ", matter.status)}</div><h2><a href="#/special-matters/${encodeURIComponent(matter.id)}">${escapeHtml(matter.title)}</a></h2><p>${escapeHtml(SPECIAL_TYPE_LABELS[matter.type])}</p></div><dl class="case-facts"><div><dt>วันที่รับเรื่อง</dt><dd>${formatDate(matter.receivedAt)}</dd></div><div><dt>หน่วยงานที่เกี่ยวข้อง</dt><dd>${escapeHtml(matter.affectedAgency)}</dd></div><div><dt>ผู้รับผิดชอบ</dt><dd>${escapeHtml(matter.assignment.officerName || "ยังไม่มอบหมาย")}</dd></div></dl><a class="button button-secondary" href="#/special-matters/${encodeURIComponent(matter.id)}">เปิดเรื่อง</a></article>`).join("") || emptyState("ไม่มีเรื่องที่ต้องดำเนินการ", "รายการจะแสดงเมื่อเรื่องอยู่ในหน้าที่ของบัญชีนี้")}</section>`;
}

function renderSpecialMatterWorkspace(state, matterId) {
  const matter = (state.specialMatters || []).find((entry) => entry.id === matterId);
  if (!matter) return renderFailure(404, "ไม่พบเรื่องตรวจสอบข้อเท็จจริง", "ตรวจสอบรายการแล้วเปิดจากเมนูเรื่องตามมาตรา 58/2 และ 58/3");
  if (!canReadSpecialMatter(getCurrentUser(), matter)) return renderFailure(403, "เปิดเรื่องนี้ไม่ได้", "บัญชีนี้ไม่ได้รับมอบหมายหรือไม่ได้อยู่ในลำดับผู้พิจารณา");
  const editable = can("special.report.edit") && matter.assignment.officerAccount === getCurrentUser()?.username && ["FACT_FINDING", "REPORT_RETURNED"].includes(matter.status);
  const actions = [];
  if (matter.status === "PENDING_CLERK_REVIEW") {
    actions.push(actionButton("special.intake.review", "SPECIAL_REVIEW_INTAKE", matter.id, "ตรวจข้อมูลครบและเสนอ ผอ.", { variant: "primary", data: { decision: "FORWARD" } }));
    actions.push(actionButton("special.intake.review", "SPECIAL_REVIEW_INTAKE", matter.id, "ส่งคืนศูนย์รับเรื่องร้องเรียน", { variant: "danger", data: { decision: "RETURN" } }));
  }
  if (matter.status === "PENDING_DIRECTOR_ASSIGNMENT") actions.push(actionButton("special.assign", "SPECIAL_ASSIGN_OFFICER", matter.id, "มอบหมายเจ้าหน้าที่", { variant: "primary" }));
  if (matter.status === "ASSIGNED") actions.push(actionButton("special.acknowledge", "SPECIAL_ACKNOWLEDGE_ASSIGNMENT", matter.id, "รับมอบหมายเรื่อง", { variant: "primary" }));
  if (matter.status === "AWAITING_DIRECTOR_REVIEW") {
    actions.push(actionButton("special.report.review.director", "SPECIAL_REVIEW_REPORT_DIRECTOR", matter.id, "เสนอผู้ช่วย/รองเลขาธิการฯ ที่กำกับ", { variant: "primary", data: { decision: "FORWARD" } }));
    actions.push(actionButton("special.report.review.director", "SPECIAL_REVIEW_REPORT_DIRECTOR", matter.id, "ส่งกลับแก้ไข", { variant: "danger", data: { decision: "RETURN" } }));
  }
  if (matter.status === "AWAITING_EXECUTIVE_REVIEW") {
    actions.push(actionButton("special.report.review.executive", "SPECIAL_REVIEW_REPORT_EXECUTIVE", matter.id, "เสนอเลขาธิการฯ", { variant: "primary", data: { decision: "FORWARD" } }));
    actions.push(actionButton("special.report.review.executive", "SPECIAL_REVIEW_REPORT_EXECUTIVE", matter.id, "ส่งกลับแก้ไข", { variant: "danger", data: { decision: "RETURN" } }));
  }
  if (matter.status === "AWAITING_SECRETARY") {
    const normalOutcome = matter.type === "ARTICLE_58_2" ? "NOTIFY_STATE_AGENCY" : "NOTIFY_SAO";
    actions.push(actionButton("special.report.decide", "SPECIAL_SECRETARY_DECIDE", matter.id, matter.type === "ARTICLE_58_2" ? "แจ้งหัวหน้าหน่วยงานของรัฐให้แก้ไข" : "แจ้งสำนักงานการตรวจเงินแผ่นดิน", { variant: "primary", data: { decision: normalOutcome } }));
    actions.push(actionButton("special.report.decide", "SPECIAL_SECRETARY_DECIDE", matter.id, "พบพฤติการณ์ทุจริต — ส่ง ป.ป.ช.", { data: { decision: "REFER_NACC" } }));
    actions.push(actionButton("special.report.decide", "SPECIAL_SECRETARY_DECIDE", matter.id, "ส่งกลับตรวจสอบเพิ่มเติม", { variant: "danger", data: { decision: "RETURN" } }));
  }
  if (matter.status === "READY_TO_NOTIFY") actions.push(actionButton("special.notify", "SPECIAL_SEND_NOTIFICATION", matter.id, `จัดทำและส่งหนังสือถึง ${matter.notification.targetName}`, { variant: "primary" }));
  if (matter.status === "AWAITING_AGENCY_ACTION") {
    actions.push(actionButton("special.notify", "SPECIAL_RECORD_AGENCY_RESPONSE", matter.id, "หน่วยงานดำเนินการแก้ไขแล้ว", { variant: "primary", data: { decision: "CORRECTED" } }));
    actions.push(actionButton("special.notify", "SPECIAL_RECORD_AGENCY_RESPONSE", matter.id, "หน่วยงานไม่ดำเนินการ", { variant: "danger", data: { decision: "NOT_ACTED" } }));
  }
  if (matter.status === "READY_PUBLIC_NOTICE") actions.push(actionButton("special.notify", "SPECIAL_RECORD_PUBLIC_NOTICE", matter.id, "บันทึกการประกาศให้ประชาชนทราบ", { variant: "primary" }));
  const typeSpecificField = matter.type === "ARTICLE_58_2"
    ? `<label class="field"><span>ความเดือดร้อนหรือความเสียหายที่ตรวจพบ</span><textarea name="hardshipImpact" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(matter.report.hardshipImpact)}</textarea></label><input type="hidden" name="projectValueIssue" value="">`
    : `<label class="field"><span>ประเด็นวงเงินสูงเกินจริงหรือความไม่คุ้มค่า</span><textarea name="projectValueIssue" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(matter.report.projectValueIssue)}</textarea></label><input type="hidden" name="hardshipImpact" value="">`;
  const targetLabels = { STATE_AGENCY_HEAD: "หัวหน้าหน่วยงานของรัฐ", SAO: "สำนักงานการตรวจเงินแผ่นดิน (สตง.)", NACC: "สำนักงาน ป.ป.ช." };
  return `<nav class="breadcrumb" aria-label="เส้นทาง"><a href="#/special-matters">เรื่องตามมาตรา 58/2 และ 58/3</a><span aria-hidden="true">/</span><span>${escapeHtml(matter.referenceNo)}</span></nav>
    <header class="case-dossier"><div class="case-dossier-title"><p>${escapeHtml(SPECIAL_TYPE_LABELS[matter.type])}</p><h1>${escapeHtml(matter.referenceNo)}</h1><span>${escapeHtml(matter.title)}</span></div><div class="case-dossier-status">${badge(SPECIAL_MATTER_STATES[matter.status] || "รอตรวจสอบ", matter.status)}</div><dl class="case-dossier-facts"><div><dt>วันที่รับเรื่อง</dt><dd>${formatDate(matter.receivedAt)}</dd></div><div><dt>หน่วยงานเจ้าของเรื่อง</dt><dd>${escapeHtml(matter.owningUnit)}</dd></div><div><dt>หน่วยงานที่เกี่ยวข้อง</dt><dd>${escapeHtml(matter.affectedAgency)}</dd></div><div><dt>ผู้รับผิดชอบ</dt><dd>${escapeHtml(matter.assignment.officerName || "ยังไม่มอบหมาย")}</dd></div></dl></header>
    ${matter.type === "ARTICLE_58_2" ? alertBox("เส้นทางมาตรา 58/2", "เจ้าหน้าที่ตรวจข้อเท็จจริงและทำรายงาน → ผู้บังคับบัญชาระดับผู้อำนวยการตรวจ → ผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับตรวจ → เลขาธิการฯ พิจารณา → แจ้งหัวหน้าหน่วยงานของรัฐให้แก้ไข; หากไม่ดำเนินการจึงประกาศให้ประชาชนทราบ", "info") : alertBox("เส้นทางมาตรา 58/3", "เจ้าหน้าที่ตรวจข้อเท็จจริงและทำรายงาน → ผู้บังคับบัญชาระดับผู้อำนวยการตรวจ → ผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับตรวจ → เลขาธิการฯ พิจารณา → แจ้งสำนักงานการตรวจเงินแผ่นดิน", "info")}
    ${actions.filter(Boolean).length ? `<div class="action-bar standalone-actions">${actions.join("")}</div>` : ""}
    <div class="workspace-content special-workspace">
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">การรับและมอบหมาย</p><h2>ข้อมูลการตรวจรับเรื่อง</h2></div></div><dl class="detail-list wide"><div><dt>ผู้ร้องเรียน</dt><dd>${escapeHtml(matter.complainant)}</dd></div><div><dt>ผลตรวจข้อมูล</dt><dd>${escapeHtml(matter.intake.checkNote || "รอดำเนินการ")}</dd></div>${matter.intake.returnReason ? `<div><dt>เหตุผลส่งคืน</dt><dd>${escapeHtml(matter.intake.returnReason)}</dd></div>` : ""}<div><dt>ผู้มอบหมาย</dt><dd>${escapeHtml(matter.assignment.assignedBy || "รอดำเนินการ")}</dd></div><div><dt>วันที่รับมอบหมาย</dt><dd>${formatDateTime(matter.assignment.acknowledgedAt)}</dd></div></dl></section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">ผลการตรวจสอบ</p><h2>รายงานเสนอเลขาธิการฯ</h2></div>${badge(matter.report.status === "DRAFT" ? "ฉบับร่าง" : matter.report.status === "RETURNED" ? "ส่งกลับแก้ไข" : "ส่งผ่าน ผอ. → ผู้ช่วย/รองฯ → เลขาธิการฯ แล้ว", matter.report.status)}</div><form data-form="special-report" data-case-id="${escapeHtml(matter.id)}" class="form-stack"><input type="hidden" name="expectedVersion" value="${matter.version}"><label class="field"><span>สรุปข้อเท็จจริง</span><textarea name="factSummary" rows="5" ${editable ? "" : "readonly"}>${escapeHtml(matter.report.factSummary)}</textarea></label><label class="field"><span>พยานหลักฐานหรือเอกสารอ้างอิง</span><textarea name="evidenceReferences" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(matter.report.evidenceReferences)}</textarea></label>${typeSpecificField}<label class="field"><span>ความเห็นเสนอ</span><textarea name="recommendedAction" rows="4" ${editable ? "" : "readonly"}>${escapeHtml(matter.report.recommendedAction)}</textarea></label>${editable ? `<div class="action-bar"><button class="button button-secondary" type="submit">บันทึกรายงาน</button><button class="button button-primary" type="submit" name="intent" value="submit">บันทึกและเสนอผู้บังคับบัญชาระดับผู้อำนวยการ</button></div>` : ""}</form></section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">ลำดับการพิจารณา</p><h2>ความเห็นและข้อสั่งการ</h2></div></div><dl class="detail-list wide"><div><dt>ผู้บังคับบัญชาระดับผู้อำนวยการ</dt><dd>${escapeHtml(matter.report.directorOpinion || "รอดำเนินการ")}</dd></div><div><dt>ผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับ</dt><dd>${escapeHtml(matter.report.executiveOpinion || "รอดำเนินการ")}</dd></div><div><dt>เลขาธิการฯ</dt><dd>${escapeHtml(matter.report.secretaryOpinion || "รอดำเนินการ")}</dd></div></dl></section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">การแจ้งผล</p><h2>หน่วยงานปลายทางและการติดตาม</h2></div></div><dl class="detail-list wide"><div><dt>ปลายทาง</dt><dd>${escapeHtml(matter.notification.targetName || targetLabels[matter.notification.targetType] || "รอผลพิจารณา")}</dd></div><div><dt>เลขหนังสือ</dt><dd>${escapeHtml(matter.notification.letterNo || "—")}</dd></div><div><dt>วันที่ส่ง</dt><dd>${formatDate(matter.notification.sentAt)}</dd></div><div><dt>หลักฐานการส่ง</dt><dd>${escapeHtml(matter.notification.deliveryReference || "—")}</dd></div>${matter.notification.agencyResponse ? `<div><dt>ผลการติดตามหน่วยงาน</dt><dd>${matter.notification.agencyResponse === "CORRECTED" ? "ดำเนินการแก้ไขแล้ว" : "ไม่ดำเนินการ"}</dd></div><div><dt>หลักฐานการติดตาม</dt><dd>${escapeHtml(matter.notification.agencyResponseReference)}</dd></div>` : ""}${matter.notification.publicNoticeReference ? `<div><dt>หลักฐานประกาศให้ประชาชนทราบ</dt><dd>${escapeHtml(matter.notification.publicNoticeReference)} · ${formatDate(matter.notification.publicNoticeDate)}</dd></div>` : ""}</dl></section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">ประวัติรายการ</p><h2>ผู้ดำเนินการและเหตุผล</h2></div></div>${renderAuditTable(matter.audit)}</section>
    </div>`;
}

function renderSystemAudit(state) {
  const events = allAuditEvents(state);
  return `${pageHeader("การกำกับดูแล", "ประวัติการใช้งาน", "ตรวจสอบผู้ดำเนินการ เวลา รายการที่ทำ เหตุผล และผลการดำเนินการ")}${renderAuditTable(events)}`;
}

function renderAuditTable(events) {
  const actionLabels = {
    CASE_CREATED: "รับเรื่องเข้าสู่ทะเบียน",
    INTAKE_ACCEPTED: "รับเรื่องไว้ดำเนินการ",
    INTAKE_RETURNED_TO_ACTIVITY4: "ส่งเรื่องคืนศูนย์รับเรื่องร้องเรียน",
    TRANSFER_REQUESTED: "เสนอเปลี่ยนหน่วยงานรับผิดชอบ",
    TRANSFER_APPROVAL_DECIDED: "พิจารณาเปลี่ยนหน่วยงานรับผิดชอบ",
    TRANSFER_RESPONDED: "ตอบรับการเปลี่ยนหน่วยงาน",
    INVESTIGATOR_ASSIGNED: "มอบหมายผู้รับผิดชอบสำนวน",
    INVESTIGATOR_CHANGED: "เปลี่ยนผู้รับผิดชอบสำนวน",
    ASSIGNMENT_ACKNOWLEDGED: "ยืนยันรับผิดชอบสำนวน",
    PLAN_SAVED: "บันทึกแผนดำเนินงาน",
    PLAN_SUBMITTED: "เสนอแผนให้ผู้ตรวจ",
    PLAN_APPROVED: "อนุมัติแผนดำเนินงาน",
    PLAN_RETURNED: "ส่งแผนกลับแก้ไข",
    WORKLOG_ADDED: "เพิ่มบันทึกการดำเนินงาน",
    EVIDENCE_ADDED: "เพิ่มพยานหลักฐาน",
    REPORT_213_SAVED: "บันทึกรายงาน 213",
    REPORT_213_SUBMITTED: "เสนอรายงาน 213 ให้ผู้ตรวจ",
    REPORT_644_SAVED: "บันทึกรายงาน 644",
    REPORT_644_SUBMITTED: "เสนอรายงาน 644 ให้ผู้ตรวจ",
    ALLEGATION_NOTICE_PREPARED: "จัดทำหนังสือแจ้งข้อกล่าวหา",
    ALLEGATION_ACKNOWLEDGED_IN_PERSON: "บันทึกการมารับทราบข้อกล่าวหา",
    ALLEGATION_NOTICE_SENT_BY_POST: "ส่งแจ้งข้อกล่าวหาทางไปรษณีย์",
    ALLEGATION_POSTAL_RESULT_RECORDED: "บันทึกผลการนำส่งไปรษณีย์",
    ALLEGATION_NOTICE_POSTED: "ปิดบันทึกแจ้งข้อกล่าวหา",
    ALLEGATION_RESPONSE_RECORDED: "บันทึกผลการชี้แจงของผู้ถูกกล่าวหา",
    ALLEGATION_NOTICE_EXCEPTION_RECORDED: "บันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา",
    REPORT_APPROVED: "เห็นชอบรายงาน",
    REPORT_RETURNED: "ส่งรายงานกลับแก้ไข",
    REPORT_SECRETARY_REVIEWED: "บันทึกผลพิจารณารายงานของเลขาธิการฯ",
    EXTENSION_REQUESTED: "ยื่นคำขอขยายเวลา",
    EXTENSION_DECIDED: "พิจารณาคำขอขยายเวลา",
    SUPPLEMENTAL_INQUIRY_EXTENSION_REQUESTED: "เสนอขอขยายเวลาการไต่สวนเพิ่มเติม",
    SUPPLEMENTAL_INQUIRY_EXTENSION_DECIDED: "บันทึกผลพิจารณาขยายเวลาการไต่สวนเพิ่มเติม",
    TIME_EXHAUSTION_REPORT_CREATED: "จัดทำรายงานเหตุล่าช้า",
    TIME_EXHAUSTION_CHAIN_OPINION_ADDED: "บันทึกความเห็นหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ",
    TIME_EXHAUSTION_SECRETARY_FINALIZED: "เลขาธิการฯ ให้ความเห็นและแนวทาง",
    TIME_EXHAUSTION_SENT_TO_ACTIVITY7: "เสนอรายงานเหตุล่าช้าต่อคณะกรรมการฯ",
    TIME_EXHAUSTION_DIRECTIVE_RECEIVED: "บันทึกผลพิจารณาและข้อสั่งการรายงานเหตุล่าช้า",
    ACTIVITY7_SENT: "เสนอรายงานต่อคณะกรรมการฯ",
    ACTIVITY7_SEND_RETRIED: "ส่งเสนอรายงานอีกครั้ง",
    ACTIVITY7_RESULT_RECEIVED: "บันทึกผลการพิจารณา",
    INQUIRY_HANDOFF_COMPLETED: "ส่งมอบงานไต่สวน",
    POST_DECISION_HANDOFF_SENT: "กำหนดการดำเนินการตามมติ",
    SUPPORT_REQUEST_SENT: "ส่งคำของานสนับสนุนสำนวน",
    SUPPORT_SUBCOMMITTEE_DISPATCHED: "ส่งเรื่องให้คณะอนุกรรมการสนับสนุนเลขาธิการฯ",
    SUPPORT_SUBCOMMITTEE_OPINION_RECORDED: "บันทึกความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ",
    OUTGOING_PACKAGE_PREPARED: "จัดเตรียมสำนวนและหนังสือนำส่ง",
    OUTGOING_LETTER_SIGNED: "ตรวจและลงนามหนังสือนำส่ง",
    SIGNED_DELIVERY_DISPATCH_RECORDED: "บันทึกผลการนำส่งสำนวน",
    OUTGOING_DELIVERY_RETRIED: "บันทึกผลการนำส่งสำนวนอีกครั้ง",
    DISCIPLINARY_COPY_SENT_TO_OWNER: "ส่งสำเนาหนังสือให้ผู้รับผิดชอบสำนวน",
    DISCIPLINARY_DELIVERY_DISPATCH_RECORDED: "บันทึกผลการแจ้งหน่วยงานต้นสังกัด",
    DISCIPLINARY_DELIVERY_RETRIED: "บันทึกผลการนำส่งหนังสือแจ้งต้นสังกัดอีกครั้ง",
    CASE_MERGE_REQUESTED: "เสนอรวมสำนวน",
    CASE_MERGE_DECIDED: "บันทึกผลพิจารณารวมสำนวน",
    CASE_MERGE_APPLIED: "รวมข้อมูลเข้าสำนวนหลัก",
    CASE_SPLIT_REQUESTED: "เสนอแยกเรื่องออกจากสำนวน",
    CASE_SPLIT_REVIEWED: "บันทึกความเห็นคำขอแยกเรื่อง",
    CASE_SPLIT_BOUNDARY_COMPLETED: "บันทึกเลขสำนวนใหม่จากการแยกเรื่อง",
    SPECIAL_MATTER_RECEIVED: "รับเรื่องตรวจสอบข้อเท็จจริง",
    SPECIAL_INTAKE_REVIEWED: "ตรวจข้อมูลเรื่องร้องเรียน",
    SPECIAL_OFFICER_ASSIGNED: "มอบหมายเจ้าหน้าที่ตรวจสอบข้อเท็จจริง",
    SPECIAL_ASSIGNMENT_ACKNOWLEDGED: "รับมอบหมายเรื่องตรวจสอบข้อเท็จจริง",
    SPECIAL_REPORT_SAVED: "บันทึกรายงานผลการตรวจสอบข้อเท็จจริง",
    SPECIAL_REPORT_SUBMITTED: "เสนอรายงานให้ผู้บังคับบัญชาระดับผู้อำนวยการตรวจ",
    SPECIAL_REPORT_DIRECTOR_REVIEWED: "ผู้บังคับบัญชาระดับผู้อำนวยการตรวจรายงาน",
    SPECIAL_REPORT_EXECUTIVE_REVIEWED: "ผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับตรวจรายงาน",
    SPECIAL_REPORT_SECRETARY_DECIDED: "เลขาธิการฯ พิจารณารายงาน",
    SPECIAL_NOTIFICATION_SENT: "ส่งหนังสือถึงหน่วยงานตามผลพิจารณา",
    SPECIAL_AGENCY_RESPONSE_RECORDED: "บันทึกผลการแก้ไขของหน่วยงานรัฐ",
    SPECIAL_PUBLIC_NOTICE_RECORDED: "บันทึกการประกาศให้ประชาชนทราบ",
    NOTIFICATION_READ: "อ่านการแจ้งเตือนกำหนดเวลา",
    "403_NOTIFICATION_READ": "พยายามอ่านการแจ้งเตือนของบัญชีอื่น",
    LOGIN: "เข้าสู่ระบบ",
    LOGOUT: "ออกจากระบบ",
    DEMO_RESET: "คืนข้อมูลเป็นค่าเริ่มต้น",
    "403_ROUTE": "พยายามเปิดหน้าที่ไม่ได้รับสิทธิ์",
    "404_ROUTE": "เปิดหน้าที่ไม่มีอยู่ในระบบ"
  };
  const actionLabel = (action) => {
    const raw = String(action);
    if (raw.startsWith("403_") && !actionLabels[raw]) return "พยายามดำเนินการโดยไม่มีสิทธิ์";
    const baseAction = raw.replace(/^(403|404|409|422)_/, "");
    return actionLabels[raw] || actionLabels[baseAction] || "รายการดำเนินงานที่ต้องตรวจสอบ";
  };
  const outcomeLabels = { SUCCESS: "สำเร็จ", FORBIDDEN: "ไม่ได้รับอนุญาต", NOT_FOUND: "ไม่พบรายการ", REJECTED: "ไม่สำเร็จ", CONFLICT: "ข้อมูลเปลี่ยนแปลงระหว่างทำงาน" };
  return `<div class="table-wrap audit-table"><table><thead><tr><th>วันและเวลา</th><th>ผู้ดำเนินการ</th><th>รายการ</th><th>เหตุผล</th><th>ผล</th></tr></thead><tbody>${events.map((event) => `<tr><td>${formatDateTime(event.time)}</td><td><strong>${escapeHtml(event.actor)}</strong><small>${escapeHtml(ROLES[event.role] || "ระบบ")}</small></td><td>${escapeHtml(actionLabel(event.action))}</td><td>${escapeHtml(event.reason)}</td><td>${badge(outcomeLabels[event.outcome] || "รอตรวจสอบ", event.outcome === "SUCCESS" ? "APPROVED" : "FAILED")}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderLogin() {
  return `
    <section class="login-page">
      <div class="login-intro">
        <p class="eyebrow">สำนักงาน ป.ป.ท.</p>
        <h1>ระบบบริหาร<br><em>สำนวนคดี</em></h1>
        <p>งานแสวงหาข้อเท็จจริงและไต่สวน สำหรับเจ้าหน้าที่ตามหน้าที่และสิทธิ์ที่ได้รับ</p>
      </div>
      <div class="login-card">
        <div><p class="eyebrow">เข้าสู่ระบบ</p><h2>สำหรับเจ้าหน้าที่</h2><p>กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเปิดพื้นที่ทำงาน</p></div>
        <form data-form="login" class="login-form">
          <label class="field"><span>ชื่อผู้ใช้</span><input name="username" autocomplete="username" required autofocus></label>
          <label class="field"><span>รหัสผ่าน</span><input type="password" name="password" autocomplete="current-password" required></label>
          <button class="button button-primary button-wide" type="submit">เข้าสู่ระบบ</button>
        </form>
        <p class="login-help">หากไม่สามารถเข้าสู่ระบบได้ โปรดติดต่อผู้ดูแลระบบของหน่วยงาน</p>
      </div>
    </section>
  `;
}

function renderFailure(status, title, detail) {
  const path = location.hash.slice(1) || "/";
  const key = `${status}:${path}`;
  if (lastFailureKey !== key) {
    recordRouteFailure(status, path);
    lastFailureKey = key;
  }
  return `<section class="failure-page"><p class="eyebrow">${status === 403 ? "การเข้าถึง" : "หน้าที่ร้องขอ"}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><div class="action-bar"><a class="button button-primary" href="#/dashboard">กลับหน้าหลัก</a><a class="button button-secondary" href="#/cases">เปิดรายการงาน</a></div></section>`;
}

function emptyState(title, detail) {
  return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>`;
}

function alertBox(title, detail, tone = "info") {
  return `<aside class="alert alert-${tone}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></aside>`;
}

function readOnlyNote(text = "บัญชีนี้อ่านข้อมูลได้ แต่ไม่มีคำสั่งสำหรับส่วนนี้") {
  return `<p class="read-only-note">${escapeHtml(text)}</p>`;
}

function route() {
  const raw = location.hash.slice(1) || "/dashboard";
  const path = raw.split("?")[0];
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  return { raw, path, parts };
}

function routeRequires(permission) {
  return permission && !can(permission);
}

function render() {
  const state = getState();
  const user = getCurrentUser();
  const current = route();
  applyPreferences(state.preferences);
  app.dataset.authenticated = String(Boolean(user));
  renderHeader(user);

  if (!user) {
    sidebar.innerHTML = "";
    main.innerHTML = renderLogin();
    document.title = "เข้าสู่ระบบ | งานแสวงหาข้อเท็จจริง";
    return;
  }

  if (current.parts[0] === "login") {
    location.hash = "#/dashboard";
    return;
  }

  renderSidebar(current.path);
  let content = "";
  const [section, id, tab] = current.parts;
  if (!section || section === "dashboard") content = renderDashboard(state, user);
  else if (section === "cases") content = id ? renderCaseWorkspace(state, id, tab || "overview") : renderCases(state);
  else if (section === "notifications") content = user.role !== "PRELIM" ? renderFailure(403, "เปิดการแจ้งเตือนไม่ได้", "บัญชีนี้ไม่มีการแจ้งเตือนกำหนดเวลารายงาน 213") : renderNotifications(state);
  else if (section === "review") content = routeRequires("review.queue") ? renderFailure(403, "เปิดงานรอตรวจไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์กลั่นกรองแผนหรือรายงาน") : renderReviewQueue(state);
  else if (section === "transfer-approvals") content = routeRequires("transfer.approve") ? renderFailure(403, "เปิดงานอนุมัติไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์พิจารณาเปลี่ยนหน่วยงานรับผิดชอบ") : renderTransferApprovals(state);
  else if (section === "board-submissions") content = !(can("activity7.send") || can("activity7.receive")) ? renderFailure(403, "เปิดงานเสนอคณะกรรมการฯ ไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์จัดการเรื่องเสนอคณะกรรมการฯ") : renderBoardQueue(state);
  else if (section === "support-opinions") content = !(can("support.dispatch") || can("support.opinion.record")) ? renderFailure(403, "เปิดรายการขอความเห็นไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์ส่งเรื่องหรือบันทึกความเห็น") : renderSupportOpinionQueue(state);
  else if (section === "deliveries") content = !(can("disciplinary.dispatch") || can("disciplinary.copy")) ? renderFailure(403, "เปิดงานดำเนินการตามมติไม่ได้", "บทบาทนี้ไม่ได้รับหน้าที่ส่งสำเนาหรือส่งหนังสือแจ้งหน่วยงานต้นสังกัด") : renderPostDecisionDeliveries(state);
  else if (section === "special-matters") {
    const hasSpecialAccess = hasSpecialMatterAccess();
    content = !hasSpecialAccess
      ? renderFailure(403, "เปิดงานตรวจสอบข้อเท็จจริงไม่ได้", "บัญชีนี้ไม่ได้อยู่ในขั้นตรวจรับ มอบหมาย ตรวจสอบ หรือพิจารณารายงาน")
      : id ? renderSpecialMatterWorkspace(state, id) : renderSpecialMatterList(state);
  }
  else if (section === "audit") content = routeRequires("audit.read") ? renderFailure(403, "เปิดประวัติทั้งระบบไม่ได้", "บทบาทนี้ไม่มีสิทธิ์ตรวจสอบข้อมูลทั้งระบบ") : renderSystemAudit(state);
  else if (section === "access-denied") content = renderFailure(403, "เปิดหน้านี้ไม่ได้", "บัญชีนี้ไม่ได้รับสิทธิ์สำหรับงานส่วนนี้ ให้เลือกงานจากเมนูที่แสดงอยู่");
  else content = renderFailure(404, "ไม่พบหน้าที่ร้องขอ", "เลือกหน้าที่ต้องการจากเมนูหลักหรือกลับไปหน้าหลัก");

  main.innerHTML = content;
  document.title = `${current.parts[0] === "cases" && id ? id : "งานแสวงหาข้อเท็จจริงและไต่สวน"} | ระบบบริหารสำนวนคดี ป.ป.ท.`;
}

function applyPreferences(preferences) {
  document.documentElement.dataset.fontScale = String(preferences.fontScale || 0);
  document.documentElement.dataset.contrast = preferences.highContrast ? "high" : "normal";
  document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
  contrastToggle?.setAttribute("aria-pressed", String(Boolean(preferences.highContrast)));
}

function showToast(message, tone = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  toastRegion.replaceChildren(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function closeModal() {
  const dialog = modalRoot.querySelector("dialog");
  const focusTarget = modalTriggerElement;
  if (dialog?.open) dialog.close();
  modalRoot.innerHTML = "";
  modalSubmitHandler = null;
  modalTriggerElement = null;
  queueMicrotask(() => (focusTarget?.isConnected ? focusTarget : main)?.focus({ preventScroll: true }));
}

function openModal({ title, description = "", body = "", submitLabel = "ยืนยัน", danger = false, onSubmit }) {
  modalTriggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modalSubmitHandler = onSubmit;
  modalRoot.innerHTML = `
    <dialog class="modal" aria-labelledby="modal-title">
      <form method="dialog" class="modal-card" data-form="modal-command">
        <header><div><p class="eyebrow">ยืนยันคำสั่ง</p><h2 id="modal-title">${escapeHtml(title)}</h2>${description ? `<p>${escapeHtml(description)}</p>` : ""}</div><button type="button" class="modal-close" data-action="close-modal" aria-label="ปิดหน้าต่าง">×</button></header>
        <div class="modal-body">${body}</div>
        <footer><button class="button button-secondary" type="button" data-action="close-modal">ยกเลิก</button><button class="button button-${danger ? "danger" : "primary"}" type="submit">${escapeHtml(submitLabel)}</button></footer>
      </form>
    </dialog>`;
  const dialog = modalRoot.querySelector("dialog");
  dialog.showModal();
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  dialog.querySelector("input, select, textarea, button")?.focus();
}

function inputField(name, label, options = {}) {
  const type = options.type || "text";
  const requiredAttr = options.required === false ? "" : " required";
  if (type === "textarea") return `<label class="field"><span>${escapeHtml(label)}</span><textarea name="${name}" rows="4"${requiredAttr}>${escapeHtml(options.value || "")}</textarea></label>`;
  if (options.options) {
    const selectedValues = new Set(options.multiple ? (options.values || []) : [options.value]);
    return `<label class="field"><span>${escapeHtml(label)}</span><select name="${name}"${options.multiple ? ' multiple size="5"' : ""}${requiredAttr}>${options.options.map((entry) => `<option value="${escapeHtml(entry.value)}" ${selectedValues.has(entry.value) ? "selected" : ""}>${escapeHtml(entry.label)}</option>`).join("")}</select>${options.help ? `<small>${escapeHtml(options.help)}</small>` : ""}</label>`;
  }
  return `<label class="field"><span>${escapeHtml(label)}</span><input type="${type}" name="${name}" value="${escapeHtml(options.value || "")}"${requiredAttr}${options.min ? ` min="${options.min}"` : ""}${options.max ? ` max="${options.max}"` : ""}></label>`;
}

function openCommandModal(button) {
  const command = button.dataset.openCommand;
  const caseId = button.dataset.caseId;
  const reportType = button.dataset.reportType;
  const decision = button.dataset.decision;
  const config = commandModalConfig(command, { caseId, reportType, decision, extensionId: button.dataset.extensionId, requestType: button.dataset.requestType, target: button.dataset.target, requestId: button.dataset.requestId, noticeId: button.dataset.noticeId });
  if (!config) return;
  openModal({
    ...config,
    onSubmit: (formData) => {
      const payload = Object.fromEntries(formData.entries());
      if (["ASSIGN_INVESTIGATOR", "CHANGE_INVESTIGATOR", "HANDOFF_INQUIRY"].includes(command)) payload.assistantInvestigators = formData.getAll("assistantInvestigators");
      if (command === "POST_DECISION_HANDOFF") payload.targets = formData.getAll("targets");
      if (command === "RECEIVE_ACTIVITY7") payload.directives = formData.getAll("directives");
      payload.reportType = payload.reportType || reportType;
      payload.decision = payload.decision || decision;
      payload.extensionId = payload.extensionId || button.dataset.extensionId;
      payload.requestType = payload.requestType || button.dataset.requestType;
      payload.target = payload.target || button.dataset.target;
      payload.requestId = payload.requestId || button.dataset.requestId;
      payload.noticeId = payload.noticeId || button.dataset.noticeId;
      payload.expectedVersion = payload.expectedVersion || button.dataset.expectedVersion;
      runCommand(command, caseId, payload, config.successMessage);
    }
  });
}

function commandModalConfig(command, context) {
  const { reportType, decision, extensionId, requestType, target, requestId, noticeId } = context;
  const commandItem = getState().cases.find((entry) => entry.id === context.caseId);
  const specialMatter = (getState().specialMatters || []).find((entry) => entry.id === context.caseId);
  const specialOfficerOptions = ACCOUNTS.filter((entry) => entry.role === "SPECIAL_OFFICER" && entry.unit === specialMatter?.owningUnit).map((entry) => ({ value: entry.username, label: entry.name }));
  const assignmentWorkType = command === "HANDOFF_INQUIRY" || commandItem?.phase === "INQUIRY" ? "INQUIRY" : "PRELIM";
  const investigatorOptions = INVESTIGATOR_DIRECTORY
    .filter((entry) => entry.workType === assignmentWorkType && entry.units.includes(commandItem?.owningUnit))
    .map((entry) => ({ value: entry.name, label: entry.name }));
  const transferOptions = TRANSFER_TARGETS.filter((entry) => entry.value !== commandItem?.owningUnit);
  const existingLead = commandItem?.assignment.assignees?.find((entry) => entry.assignmentRole === "LEAD")?.name || "";
  const existingAssistants = commandItem?.assignment.assignees?.filter((entry) => entry.assignmentRole === "ASSISTANT").map((entry) => entry.name) || [];
  const assignmentFields = inputField("leadInvestigator", "ผู้รับผิดชอบหลัก", { options: investigatorOptions, value: existingLead })
    + inputField("assistantInvestigators", "ผู้ช่วยสำนวน", { options: investigatorOptions, multiple: true, values: existingAssistants, required: false, help: "เลือกได้มากกว่า 1 คน และห้ามเลือกซ้ำกับผู้รับผิดชอบหลัก" });
  const configs = {
    SPECIAL_REVIEW_INTAKE: decision === "RETURN"
      ? { title: "ส่งเรื่องคืนศูนย์รับเรื่องร้องเรียน", body: `<input type="hidden" name="decision" value="RETURN">${inputField("reason", "เหตุผลที่ข้อมูลไม่ถูกต้องหรือไม่อยู่ในขอบเขตของหน่วยงาน", { type: "textarea" })}`, danger: true, successMessage: "ส่งเรื่องคืนศูนย์รับเรื่องร้องเรียนแล้ว" }
      : { title: "ตรวจข้อมูลและเสนอผู้อำนวยการมอบหมาย", body: `<input type="hidden" name="decision" value="FORWARD">${inputField("checkNote", "ผลการตรวจข้อมูลเรื่องร้องเรียน", { type: "textarea" })}${inputField("reason", "บันทึกการเสนอ", { type: "textarea", value: "ตรวจข้อมูลครบถ้วนและเสนอผู้อำนวยการมอบหมายผู้รับผิดชอบ" })}`, successMessage: "เสนอเรื่องให้ผู้อำนวยการแล้ว" },
    SPECIAL_ASSIGN_OFFICER: { title: "มอบหมายเจ้าหน้าที่ตรวจสอบข้อเท็จจริง", body: `${inputField("officerAccount", "เจ้าหน้าที่ผู้รับผิดชอบ", { options: specialOfficerOptions })}${inputField("reason", "คำสั่งหรือเหตุผลการมอบหมาย", { type: "textarea", value: "มอบหมายให้ตรวจสอบข้อเท็จจริงและจัดทำรายงานเสนอ" })}`, successMessage: "มอบหมายเจ้าหน้าที่แล้ว" },
    SPECIAL_ACKNOWLEDGE_ASSIGNMENT: { title: "รับมอบหมายเรื่องตรวจสอบข้อเท็จจริง", body: inputField("reason", "บันทึกการรับมอบหมาย", { type: "textarea", value: "ตรวจข้อมูลเรื่องร้องเรียนและเอกสารที่ได้รับแล้ว" }), successMessage: "รับมอบหมายเรื่องแล้ว" },
    SPECIAL_REVIEW_REPORT_DIRECTOR: { title: decision === "FORWARD" ? "ตรวจรายงานและเสนอผู้ช่วย/รองเลขาธิการฯ ที่กำกับ" : "ส่งรายงานกลับแก้ไข", body: `<input type="hidden" name="decision" value="${escapeHtml(decision || "")}">${inputField("opinion", "ความเห็นของผู้บังคับบัญชาระดับผู้อำนวยการ", { type: "textarea" })}${inputField("reason", "บันทึกการพิจารณา", { type: "textarea", value: decision === "FORWARD" ? "ตรวจรายงานและพยานหลักฐานแล้ว เห็นควรเสนอผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับ" : "ส่งกลับให้เจ้าหน้าที่ผู้รับผิดชอบตรวจสอบหรือแก้ไขรายงานเพิ่มเติม" })}`, danger: decision === "RETURN", successMessage: decision === "FORWARD" ? "เสนอรายงานให้ผู้ช่วย/รองเลขาธิการฯ ที่กำกับแล้ว" : "ส่งรายงานกลับเจ้าหน้าที่ผู้รับผิดชอบแล้ว" },
    SPECIAL_REVIEW_REPORT_EXECUTIVE: { title: decision === "FORWARD" ? "ตรวจรายงานและเสนอเลขาธิการฯ" : "ส่งรายงานกลับแก้ไข", body: `<input type="hidden" name="decision" value="${escapeHtml(decision || "")}">${inputField("opinion", "ความเห็นของผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับ", { type: "textarea" })}${inputField("reason", "บันทึกการพิจารณา", { type: "textarea", value: decision === "FORWARD" ? "ตรวจรายงานแล้ว เห็นควรเสนอเลขาธิการฯ พิจารณา" : "ส่งกลับให้ตรวจสอบหรือแก้ไขรายงานเพิ่มเติม" })}`, danger: decision === "RETURN", successMessage: decision === "FORWARD" ? "เสนอรายงานให้เลขาธิการฯ แล้ว" : "ส่งรายงานกลับแก้ไขแล้ว" },
    SPECIAL_SECRETARY_DECIDE: (() => {
      const labels = { NOTIFY_STATE_AGENCY: "แจ้งหัวหน้าหน่วยงานของรัฐให้แก้ไข", NOTIFY_SAO: "แจ้งสำนักงานการตรวจเงินแผ่นดิน", REFER_NACC: "ส่งเรื่องให้สำนักงาน ป.ป.ช.", RETURN: "ส่งกลับตรวจสอบเพิ่มเติม" };
      return { title: labels[decision] || "บันทึกผลพิจารณาของเลขาธิการฯ", body: `<input type="hidden" name="outcome" value="${escapeHtml(decision || "")}">${inputField("opinion", "ความเห็นหรือข้อสั่งการของเลขาธิการฯ", { type: "textarea" })}${inputField("reason", "บันทึกการพิจารณา", { type: "textarea", value: labels[decision] || "บันทึกผลพิจารณา" })}`, danger: decision === "RETURN", successMessage: "บันทึกผลพิจารณาของเลขาธิการฯ แล้ว" };
    })(),
    SPECIAL_SEND_NOTIFICATION: (() => {
      const stateAgencyTarget = specialMatter?.notification.targetType === "STATE_AGENCY_HEAD";
      return { title: `จัดทำและส่งหนังสือถึง ${specialMatter?.notification.targetName || "หน่วยงานตามผลพิจารณา"}`, description: specialMatter?.notification.targetType === "NACC" ? "ใช้เมื่อระหว่างตรวจสอบพบภายหลังว่าเป็นเรื่องทุจริต" : "บันทึกเฉพาะข้อมูลการจัดทำและส่งหนังสือจากเรื่องนี้", body: `${stateAgencyTarget ? inputField("targetName", "หัวหน้าหน่วยงานของรัฐ", { value: specialMatter.notification.targetName }) : `<input type="hidden" name="targetName" value="${escapeHtml(specialMatter?.notification.targetName || "")}">`}${inputField("letterNo", "เลขหนังสือแจ้ง")}${inputField("sentAt", "วันที่ส่งหนังสือ", { type: "date", value: getState().demoDate })}${inputField("deliveryReference", "หลักฐานหรือเลขอ้างอิงการส่ง")}${inputField("reason", "บันทึกการนำส่ง", { type: "textarea", value: "ตรวจรายงานและผลพิจารณาแล้ว จัดทำและส่งหนังสือถึงหน่วยงานที่กำหนด" })}`, successMessage: "บันทึกการส่งหนังสือแล้ว" };
    })(),
    SPECIAL_RECORD_AGENCY_RESPONSE: { title: decision === "CORRECTED" ? "บันทึกผลว่าหน่วยงานดำเนินการแก้ไขแล้ว" : "บันทึกผลว่าหน่วยงานไม่ดำเนินการ", body: `<input type="hidden" name="response" value="${escapeHtml(decision || "")}">${inputField("responseDate", "วันที่ตรวจสอบผล", { type: "date", value: getState().demoDate })}${inputField("responseReference", "หนังสือตอบกลับหรือหลักฐานการติดตาม")}${inputField("note", "รายละเอียดผลการแก้ไขหรือการไม่ดำเนินการ", { type: "textarea" })}${inputField("reason", "บันทึกการติดตาม", { type: "textarea", value: "ตรวจสอบผลการดำเนินการของหน่วยงานแล้ว" })}`, danger: decision === "NOT_ACTED", successMessage: "บันทึกผลการติดตามหน่วยงานแล้ว" },
    SPECIAL_RECORD_PUBLIC_NOTICE: { title: "บันทึกการประกาศให้ประชาชนทราบ", description: "ใช้เมื่อมีผลตรวจสอบว่าหัวหน้าหน่วยงานของรัฐไม่ดำเนินการแก้ไข", body: `${inputField("publicationDate", "วันที่ประกาศ", { type: "date", value: getState().demoDate })}${inputField("publicationReference", "เลขหรือหลักฐานอ้างอิงประกาศ")}${inputField("reason", "บันทึกการประกาศ", { type: "textarea", value: "บันทึกหลักฐานการประกาศให้ประชาชนทราบเป็นการทั่วไป" })}`, successMessage: "บันทึกการประกาศแล้ว" },
    ACCEPT_CASE: { title: "รับเรื่องไว้ดำเนินการ", description: "เรื่องจะเข้าสู่ขั้นตอนมอบหมายผู้รับผิดชอบสำนวน", body: inputField("reason", "บันทึกการตรวจรับ", { type: "textarea", value: "ตรวจข้อมูลเรื่องร้องเรียนครบถ้วน" }), successMessage: "รับเรื่องไว้ดำเนินการแล้ว" },
    RETURN_CASE: { title: "ส่งเรื่องคืนศูนย์รับเรื่องร้องเรียน", body: inputField("reason", "เหตุผลการส่งคืน", { type: "textarea" }), submitLabel: "ยืนยันส่งคืน", danger: true, successMessage: "ส่งเรื่องคืนแล้ว" },
    REQUEST_TRANSFER: { title: "เสนอเปลี่ยนหน่วยงานรับผิดชอบ", body: inputField("target", "หน่วยงานที่เสนอให้รับผิดชอบ", { options: transferOptions }) + inputField("reason", "เหตุผลที่เสนอเปลี่ยนหน่วยงาน", { type: "textarea" }), successMessage: "เสนอเปลี่ยนหน่วยงานรับผิดชอบแล้ว" },
    DECIDE_TRANSFER_APPROVAL: { title: decision === "APPROVED" ? "อนุมัติเปลี่ยนหน่วยงานรับผิดชอบ" : "ไม่อนุมัติเปลี่ยนหน่วยงานรับผิดชอบ", body: `<input type="hidden" name="decision" value="${escapeHtml(decision)}">${inputField("reason", "ความเห็นประกอบการพิจารณา", { type: "textarea" })}`, danger: decision === "REJECTED", successMessage: "บันทึกผลพิจารณาแล้ว" },
    RESPOND_TRANSFER: { title: decision === "REJECT" ? "ไม่รับเรื่องโอน" : "รับเรื่องโอน", body: `<input type="hidden" name="decision" value="${escapeHtml(decision)}">${decision === "ACCEPT" ? inputField("sourceMemoNo", "เลขบันทึกข้อความหน่วยงานต้นทาง") + inputField("targetMemoNo", "เลขบันทึกข้อความหน่วยงานปลายทาง") : ""}${inputField("reason", decision === "REJECT" ? "เหตุผลที่ไม่รับเรื่องโอน" : "บันทึกการรับเรื่องโอน", { type: "textarea", required: decision === "REJECT", value: decision === "ACCEPT" ? "ตรวจบันทึกข้อความของทั้งสองหน่วยงานแล้ว" : "" })}`, danger: decision === "REJECT", successMessage: "บันทึกผลการรับเรื่องโอนแล้ว" },
    ASSIGN_INVESTIGATOR: { title: "มอบหมายผู้รับผิดชอบ", body: assignmentFields + inputField("team", "ชุดปฏิบัติงาน", { value: assignmentWorkType === "INQUIRY" ? "คณะพนักงานไต่สวน" : "ชุดแสวงหาข้อเท็จจริง 1" }) + inputField("reason", "เหตุผลหรือคำสั่ง", { type: "textarea", value: "มอบหมายตามเขตอำนาจและภาระงาน" }), successMessage: "มอบหมายผู้รับผิดชอบแล้ว" },
    CHANGE_INVESTIGATOR: { title: "เปลี่ยนผู้รับผิดชอบ", body: assignmentFields + inputField("team", "ชุดปฏิบัติงาน", { required: false, value: commandItem?.assignment.team || "" }) + inputField("reason", "เหตุผลการเปลี่ยน", { type: "textarea" }), successMessage: "เปลี่ยนผู้รับผิดชอบแล้ว" },
    ACKNOWLEDGE_ASSIGNMENT: { title: "ยืนยันรับผิดชอบสำนวน", body: inputField("reason", "บันทึกการรับผิดชอบ", { type: "textarea", value: "ตรวจสำนวนและบัญชีเอกสารแล้ว" }), successMessage: "ยืนยันรับผิดชอบสำนวนแล้ว" },
    APPROVE_PLAN: { title: "อนุมัติแผน 4 ประเด็น", body: inputField("note", "บันทึกผู้ตรวจ", { type: "textarea", required: false }) + inputField("reason", "เหตุผลการอนุมัติ", { type: "textarea", value: "แผนครบ 4 ประเด็นและดำเนินการได้" }), successMessage: "อนุมัติแผนแล้ว" },
    RETURN_PLAN: { title: "ส่งแผนกลับแก้ไข", body: inputField("reason", "ประเด็นที่ต้องแก้ไข", { type: "textarea" }), danger: true, successMessage: "ส่งแผนกลับแก้ไขแล้ว" },
    REQUEST_EXTENSION: { title: `ขอขยายเวลารายงาน ${reportType}`, description: "ครั้งละไม่เกิน 60 วัน และต้องยื่นล่วงหน้าอย่างน้อย 15 วัน", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("days", "จำนวนวัน", { type: "number", min: 1, max: 60, value: 60 })}${inputField("reason", "เหตุผลและความจำเป็น", { type: "textarea" })}`, successMessage: "ส่งคำขอขยายเวลาแล้ว" },
    DECIDE_EXTENSION: { title: decision === "APPROVED" ? "อนุมัติขยายเวลา" : "ไม่อนุมัติขยายเวลา", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}"><input type="hidden" name="extensionId" value="${escapeHtml(extensionId)}"><input type="hidden" name="decision" value="${escapeHtml(decision)}">${inputField("reason", "เหตุผลการพิจารณา", { type: "textarea", required: decision === "REJECTED", value: decision === "APPROVED" ? "อนุมัติตามเหตุผลและความจำเป็น" : "" })}`, danger: decision === "REJECTED", successMessage: "บันทึกผลพิจารณาขยายเวลาแล้ว" },
    APPROVE_REPORT: { title: `เห็นชอบรายงาน ${reportType}`, body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("note", "บันทึกผู้ตรวจ", { type: "textarea", required: false })}${inputField("reason", "เหตุผลการเห็นชอบ", { type: "textarea", value: "รายงานและพยานหลักฐานครบถ้วน" })}`, successMessage: `เห็นชอบรายงาน ${reportType} แล้ว` },
    RETURN_REPORT: { title: `ส่งรายงาน ${reportType} กลับแก้ไข`, body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("reason", "ประเด็นที่ต้องแก้ไข", { type: "textarea" })}`, danger: true, successMessage: `ส่งรายงาน ${reportType} กลับแก้ไขแล้ว` },
    SECRETARY_REVIEW_REPORT: { title: decision === "READY" ? `รับรองรายงาน ${reportType} ว่าพร้อมเสนอ` : decision === "RETURN" ? `ส่งรายงาน ${reportType} กลับดำเนินการเพิ่มเติม` : `สั่งขอความเห็นเพิ่มเติมสำหรับรายงาน ${reportType}`, body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}"><input type="hidden" name="decision" value="${escapeHtml(decision)}">${inputField("reason", decision === "REFER_SUPPORT" ? "ข้อเท็จจริงหรือข้อกฎหมายที่ยังมีข้อสงสัยเรื่องความเพียงพอ" : "ความเห็นและเหตุผล", { type: "textarea" })}`, danger: decision === "RETURN", successMessage: decision === "REFER_SUPPORT" ? "บันทึกคำสั่งขอความเห็นเพิ่มเติมแล้ว" : "บันทึกผลพิจารณารายงานแล้ว" },
    DISPATCH_SUPPORT_SUBCOMMITTEE: { title: "ส่งเรื่องให้คณะอนุกรรมการสนับสนุนเลขาธิการฯ", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("dispatchNote", "เลขหนังสือหรือรายละเอียดการส่งเรื่อง", { type: "textarea" })}`, successMessage: "บันทึกการส่งเรื่องแล้ว" },
    RECORD_SUPPORT_SUBCOMMITTEE_OPINION: { title: "บันทึกความเห็นคณะอนุกรรมการสนับสนุนเลขาธิการฯ", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("opinion", "ความเห็นที่ได้รับ", { type: "textarea" })}${inputField("reason", "บันทึกการรับเรื่องกลับ", { type: "textarea", value: "ตรวจเอกสารความเห็นที่ได้รับกลับมาแล้ว" })}`, successMessage: "บันทึกความเห็นที่ได้รับแล้ว" },
    CREATE_EXHAUSTION_REPORT: { title: `รายงานเหตุล่าช้าหลังครบสิทธิขยาย ${reportType}`, body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("reasonAndNecessity", "เหตุผลและความจำเป็น", { type: "textarea" })}${inputField("pastActions", "การดำเนินการที่ผ่านมา", { type: "textarea" })}${inputField("remainingActions", "การดำเนินการคงเหลือ", { type: "textarea" })}${inputField("obstacles", "ปัญหาและอุปสรรค", { type: "textarea" })}${inputField("expectedCompletionAt", "วันที่คาดว่าจะแล้วเสร็จ", { type: "date" })}`, successMessage: "จัดทำรายงานเหตุล่าช้าแล้ว" },
    REQUEST_SUPPLEMENTAL_INQUIRY_EXTENSION: { title: "เสนอขอขยายเวลาการไต่สวนเพิ่มเติม", description: "คำขอนี้ส่งเพื่อให้คณะกรรมการ ป.ป.ท. พิจารณา ระบบไม่กำหนดจำนวนวันแทนมติ", body: inputField("reason", "เหตุผลและความจำเป็น", { type: "textarea" }), successMessage: "บันทึกคำขอและส่งรอผลพิจารณาแล้ว" },
    DECIDE_SUPPLEMENTAL_INQUIRY_EXTENSION: { title: decision === "APPROVED" ? "บันทึกมติอนุมัติขยายเวลา" : "บันทึกมติไม่อนุมัติขยายเวลา", body: `<input type="hidden" name="decision" value="${escapeHtml(decision)}">${decision === "APPROVED" ? inputField("days", "จำนวนวันที่อนุมัติ", { type: "number", min: 1 }) : ""}${inputField("reason", "รายละเอียดมติหรือเหตุผล", { type: "textarea" })}`, danger: decision === "REJECTED", successMessage: "บันทึกผลพิจารณาแล้ว" },
    ADD_CHAIN_OPINION: { title: "ให้ความเห็นในฐานะหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("opinion", "ความเห็นประกอบรายงาน", { type: "textarea" })}`, successMessage: "บันทึกความเห็นแล้ว" },
    SECRETARY_FINALIZE_ESCALATION: { title: "เลขาธิการฯ พิจารณารายงานเหตุล่าช้า", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("opinion", "ความเห็นของเลขาธิการฯ", { type: "textarea" })}${inputField("remedy", "แนวทางแก้ไขให้สำนวนแล้วเสร็จ", { type: "textarea" })}`, successMessage: "บันทึกความเห็นและแนวทางแก้ไขแล้ว" },
    SEND_TIME_ESCALATION_TO_A7: { title: "เสนอรายงานเหตุล่าช้าต่อคณะกรรมการ ป.ป.ท.", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("reason", "บันทึกการเสนอ", { type: "textarea", value: "ตรวจรายงาน ความเห็น และแนวทางแก้ไขครบถ้วน" })}`, successMessage: "เสนอรายงานเหตุล่าช้าแล้ว" },
    RECEIVE_TIME_ESCALATION_DIRECTIVE: (() => { const exhaustion = reportType === "213" ? commandItem?.report213.exhaustion : commandItem?.report644.exhaustion; return { title: "บันทึกผลพิจารณาและข้อสั่งการ", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}"><input type="hidden" name="messageId" value="TIME-IN-${escapeHtml(String(context.caseId).replaceAll("-", ""))}-${(commandItem?.version || 0) + 1}"><input type="hidden" name="correlationId" value="${escapeHtml(exhaustion?.messageId || "")}">${inputField("meetingDate", "วันที่ประชุม", { type: "date", value: getState().demoDate })}${inputField("meetingNo", "ครั้งที่ประชุม")}${inputField("directive", "ผลพิจารณาและข้อสั่งการ", { type: "textarea" })}${inputField("reason", "บันทึกการรับผล", { type: "textarea", value: "ตรวจรหัสอ้างอิงและบันทึกข้อสั่งการที่ได้รับ" })}`, successMessage: "บันทึกผลพิจารณาและข้อสั่งการแล้ว" }; })(),
    SEND_ACTIVITY7: { title: reportType === "213" ? "เสนอรายงาน 213 เพื่อพิจารณารับไว้ไต่สวน" : "เสนอรายงาน 644 เพื่อพิจารณาวินิจฉัย", description: "เมื่อยืนยันแล้ว รายงานฉบับนี้จะถูกล็อกเพื่อรอผลการพิจารณา", body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("reason", "บันทึกการเสนอ", { type: "textarea", value: "ตรวจรายงานและบัญชีเอกสารพร้อมเสนอ" })}`, successMessage: `เสนอรายงาน ${reportType} แล้ว` },
    RETRY_ACTIVITY7_SEND: { title: `ส่งเสนอรายงาน ${reportType} อีกครั้ง`, body: `<input type="hidden" name="reportType" value="${escapeHtml(reportType)}">${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ตรวจความพร้อมแล้วและส่งเสนออีกครั้ง" })}`, successMessage: "ส่งเสนออีกครั้งแล้ว" },
    RECEIVE_ACTIVITY7: (() => { const item = getState().cases.find((entry) => entry.id === context.caseId); const decisionReportType = item?.integration.reportType || (item?.phase === "WAIT_A7_644" ? "644" : "213"); const directiveField = decisionReportType === "644" ? inputField("directives", "ปลายทางตามมติสำหรับกรณีทุจริตต่อหน้าที่หรือประพฤติมิชอบ", { options: [{ value: "PROSECUTOR", label: "พนักงานอัยการ" }, { value: "PARENT_AGENCY", label: "หน่วยงานต้นสังกัด" }], multiple: true, required: false, help: "เลือกอย่างน้อย 1 แห่งเมื่อมติเป็นกรณีทุจริตต่อหน้าที่หรือประพฤติมิชอบ ส่วนผลอื่นระบบกำหนดปลายทางตามมติให้" }) : ""; return { title: "บันทึกผลการพิจารณา", body: `<input type="hidden" name="messageId" value="IN-${escapeHtml(String(context.caseId).replaceAll("-", ""))}-${(item?.version || 0) + 1}"><input type="hidden" name="correlationId" value="${escapeHtml(item?.integration.messageId || "")}"><input type="hidden" name="reason" value="บันทึกผลการพิจารณา">${inputField("result", "ผลการพิจารณา", { options: getResultOptions(decisionReportType) })}${directiveField}${inputField("meetingDate", "วันที่ประชุม", { type: "date", value: getState().demoDate })}${inputField("meetingNo", "ครั้งที่ประชุม")}${inputField("meetingNote", "บันทึกผลการพิจารณา", { type: "textarea" })}`, successMessage: "บันทึกผลการพิจารณาแล้ว" }; })(),
    HANDOFF_INQUIRY: (() => {
      const employeePanel = commandItem?.integration.decision === "ACCEPT_EMPLOYEE_PANEL";
      const appointmentType = employeePanel ? "EMPLOYEE_PANEL" : "SUBCOMMITTEE";
      const signatory = employeePanel ? "SECRETARY" : "CHAIR";
      const signatoryLabel = employeePanel ? "เลขาธิการคณะกรรมการ ป.ป.ท." : "ประธานกรรมการ ป.ป.ท.";
      return {
        title: "บันทึกคำสั่งแต่งตั้งและส่งมอบงานไต่สวน",
        description: employeePanel ? "กรอบ 270 วันเริ่มจากวันที่ลงนามคำสั่ง" : "กรอบ 270 วันเริ่มจากวันที่ประชุมที่มีมติแต่งตั้ง",
        body: `<input type="hidden" name="appointmentType" value="${appointmentType}"><input type="hidden" name="signatory" value="${signatory}">${alertBox("ผู้ลงนามคำสั่ง", signatoryLabel, "info")}${inputField("orderNo", "เลขคำสั่งไต่สวน")}${inputField("orderDate", "วันที่ลงนามคำสั่ง", { type: "date", value: getState().demoDate })}${assignmentFields}${inputField("reason", "บันทึกส่งมอบ", { type: "textarea", value: "ตรวจคำสั่ง บัญชีสำนวน และเอกสารครบถ้วน" })}`,
        successMessage: "บันทึกคำสั่งและส่งมอบงานไต่สวนแล้ว"
      };
    })(),
    PREPARE_ALLEGATION_NOTICE: {
      title: "จัดทำหนังสือแจ้งให้มารับทราบข้อกล่าวหา",
      description: "ใช้เมื่อพยานหลักฐานเพียงพอสนับสนุนข้อกล่าวหา",
      body: `${inputField("accusedName", "ชื่อผู้ถูกกล่าวหา")}${inputField("letterNo", "เลขหนังสือแจ้งข้อกล่าวหา")}${inputField("noticeDate", "วันที่หนังสือแจ้ง", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("appointmentDate", "วันนัดหมาย", { type: "date" })}${inputField("evidenceBasis", "พยานหลักฐานที่สนับสนุนข้อกล่าวหา", { type: "textarea" })}${inputField("reason", "บันทึกการจัดทำหนังสือ", { type: "textarea", value: "ตรวจพยานหลักฐานแล้วเห็นว่าเพียงพอสนับสนุนข้อกล่าวหา" })}`,
      successMessage: "บันทึกหนังสือแจ้งข้อกล่าวหาแล้ว"
    },
    RECORD_ALLEGATION_APPEARANCE: {
      title: "บันทึกการมารับทราบข้อกล่าวหา",
      body: `<input type="hidden" name="noticeId" value="${escapeHtml(noticeId || "")}">${inputField("serviceDate", "วันที่มารับทราบข้อกล่าวหา", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("serviceReference", "เลขอ้างอิงบันทึกการรับทราบ")}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ผู้ถูกกล่าวหามารับทราบข้อกล่าวหาและได้รับแจ้งสิทธิแล้ว" })}`,
      successMessage: "บันทึกการรับทราบข้อกล่าวหาแล้ว"
    },
    RECORD_ALLEGATION_POSTAL: {
      title: "บันทึกการส่งแจ้งข้อกล่าวหาทางไปรษณีย์",
      description: "ใช้เมื่อผู้ถูกกล่าวหาไม่มารับทราบข้อกล่าวหาตามนัด",
      body: `<input type="hidden" name="noticeId" value="${escapeHtml(noticeId || "")}">${inputField("serviceDate", "วันที่ส่งไปรษณีย์", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("serviceReference", "เลขสิ่งส่งหรือหลักฐานการส่ง")}${inputField("noShowNote", "บันทึกการไม่มาตามนัด", { type: "textarea" })}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ส่งบันทึกแจ้งข้อกล่าวหา คำสั่ง และบันทึกการแจ้งสิทธิทางไปรษณีย์" })}`,
      successMessage: "บันทึกการส่งทางไปรษณีย์แล้ว"
    },
    RECORD_ALLEGATION_POSTAL_RESULT: {
      title: decision === "DELIVERED" ? "บันทึกผลไปรษณีย์นำส่งสำเร็จ" : "บันทึกผลไปรษณีย์นำส่งไม่ได้",
      body: `<input type="hidden" name="noticeId" value="${escapeHtml(noticeId || "")}"><input type="hidden" name="deliveryResult" value="${escapeHtml(decision || "")}">${inputField("resultDate", "วันที่ทราบผล", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("resultReference", "เลขหรือหลักฐานผลการนำส่ง")}${inputField("reason", "บันทึกผลการนำส่ง", { type: "textarea" })}`,
      danger: decision === "FAILED",
      successMessage: "บันทึกผลการนำส่งไปรษณีย์แล้ว"
    },
    RECORD_ALLEGATION_POSTING: {
      title: "บันทึกการปิดบันทึกแจ้งข้อกล่าวหา",
      description: "ใช้หลังมีหลักฐานว่าส่งไปรษณีย์ไม่ได้",
      body: `<input type="hidden" name="noticeId" value="${escapeHtml(noticeId || "")}">${inputField("postingPlace", "สถานที่ปิดบันทึก", { options: [{ value: "DOMICILE", label: "ภูมิลำเนาของผู้ถูกกล่าวหา" }, { value: "WORKPLACE", label: "สำนักทำงานของผู้ถูกกล่าวหา" }] })}${inputField("serviceDate", "วันที่ปิดบันทึก", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("locationDetail", "รายละเอียดสถานที่")}${inputField("serviceReference", "เลขหรือหลักฐานการปิดบันทึก")}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ปิดบันทึกแจ้งข้อกล่าวหาและบันทึกการแจ้งสิทธิหลังส่งไปรษณีย์ไม่ได้" })}`,
      successMessage: "บันทึกการปิดหนังสือแล้ว"
    },
    RECORD_ALLEGATION_RESPONSE: {
      title: "บันทึกคำชี้แจงและพยานฝ่ายผู้ถูกกล่าวหา",
      description: "ระบบไม่กำหนดจำนวนวันตอบแทนข้อความที่ระบุไว้ในหนังสือแจ้ง",
      body: `<input type="hidden" name="noticeId" value="${escapeHtml(noticeId || "")}">${inputField("responseOutcome", "ผลการชี้แจง", { options: [{ value: "EXPLANATION_RECEIVED", label: "ได้รับคำชี้แจงและพยานหลักฐาน" }, { value: "NO_EXPLANATION_WITHIN_NOTICE", label: "ไม่ยื่นคำชี้แจงภายในเวลาที่ระบุในหนังสือแจ้ง" }] })}${inputField("responseDate", "วันที่บันทึกผล", { type: "date", value: getState().demoDate, max: getState().demoDate })}${inputField("explanation", "สาระคำชี้แจงหรือบันทึกการไม่ยื่น", { type: "textarea" })}${inputField("evidenceReference", "เลขอ้างอิงคำชี้แจง พยานหลักฐาน หรือบันทึกว่าไม่มีการยื่น")}${inputField("reason", "บันทึกการรับฟัง", { type: "textarea", value: "บันทึกผลการเปิดโอกาสให้ผู้ถูกกล่าวหาชี้แจงและนำพยานหลักฐานมาแก้ข้อกล่าวหา" })}`,
      successMessage: "บันทึกผลการชี้แจงแล้ว"
    },
    RECORD_ALLEGATION_EXCEPTION: {
      title: "บันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา",
      description: "เลือกได้เฉพาะเหตุที่ระบุไว้สำหรับขั้นแจ้งข้อกล่าวหา",
      body: `${inputField("exceptionType", "เหตุที่ไม่แจ้งข้อกล่าวหา", { options: [{ value: "INSUFFICIENT_EVIDENCE", label: "พยานหลักฐานไม่เพียงพอสนับสนุนข้อกล่าวหา" }, { value: "OUTSIDE_PACC_AUTHORITY", label: "สำนวนไม่อยู่ในอำนาจ ป.ป.ท." }, { value: "ACCUSED_DECEASED", label: "ผู้ถูกกล่าวหาเสียชีวิต" }] })}${inputField("accusedName", "ชื่อผู้ถูกกล่าวหา (ต้องระบุกรณีเสียชีวิต)", { required: false })}${inputField("note", "ข้อเท็จจริงและเหตุผล", { type: "textarea" })}${inputField("evidenceReference", "เอกสารหรือพยานหลักฐานอ้างอิง")}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ตรวจข้อเท็จจริงและบันทึกเหตุที่ไม่เข้าสู่ขั้นแจ้งข้อกล่าวหา" })}`,
      successMessage: "บันทึกเหตุที่ไม่แจ้งข้อกล่าวหาแล้ว"
    },
    CREATE_SUPPORT_REQUEST: (() => {
      const labels = {
        WITNESS_PROTECTION: "ส่งคำขอคุ้มครองพยาน",
        SEARCH_WARRANT: "จัดทำคำร้องขอหมายค้น",
        LEGAL_OPINION: "ขอความเห็นด้านกฎหมาย",
        ARREST_WARRANT: "จัดทำคำร้องขอหมายจับ"
      };
      const reasonLabel = requestType === "ARREST_WARRANT" ? "เหตุไม่มาพบตามนัดหรือมีพฤติการณ์หลบหนี" : "เหตุผลและความจำเป็น";
      const targetLabels = {
        WITNESS_PROTECTION: "ผู้ขอรับความคุ้มครอง",
        SEARCH_WARRANT: "สถานที่เป้าหมาย",
        LEGAL_OPINION: "ประเด็นข้อกฎหมาย",
        ARREST_WARRANT: "บุคคลเป้าหมาย"
      };
      const contactLabel = requestType === "SEARCH_WARRANT" ? "ที่อยู่สถานที่เป้าหมาย" : requestType === "ARREST_WARRANT" ? "ที่อยู่หรือข้อมูลติดตามบุคคลเป้าหมาย" : "ข้อมูลติดต่อหรือที่อยู่ที่เกี่ยวข้อง";
      return { title: labels[requestType] || "ส่งคำของานสนับสนุนสำนวน", body: `<input type="hidden" name="requestType" value="${escapeHtml(requestType || "")}">${inputField("subject", "เรื่องที่ขอให้ดำเนินการ")}${inputField("target", targetLabels[requestType] || "บุคคล สถานที่ หรือประเด็นเป้าหมาย")}${inputField("documentReference", "เอกสารหรือเลขอ้างอิงประกอบคำขอ")}${inputField("evidenceBasis", "พยานหลักฐานหรือข้อเท็จจริงสนับสนุนคำขอ", { type: "textarea" })}${inputField("contactAddress", contactLabel, { type: "textarea", required: requestType !== "LEGAL_OPINION" })}${inputField("reason", reasonLabel, { type: "textarea" })}`, successMessage: "ส่งคำขอแล้ว" };
    })(),
    POST_DECISION_HANDOFF: (() => {
      const item = getState().cases.find((entry) => entry.id === context.caseId);
      const reportTypeFromDecision = item?.integration.reportType || "";
      const authoritativeTargets = item?.integration.directives || getAllowedTargets(reportTypeFromDecision, item?.integration.decision).map((target) => target.value);
      const isTermination = reportTypeFromDecision === "213" && item?.integration.decision === "NOT_ACCEPT_TERMINATE";
      const isOtherAgency = reportTypeFromDecision === "213" && item?.integration.decision === "NOT_ACCEPT_OTHER_AGENCY";
      const targetFields = isTermination
        ? alertBox("ยุติเรื่องตามมติ", "เมื่อยืนยัน สำนวนจะถูกปิดและไม่มีการสร้างรายการหนังสือส่ง", "danger")
        : `${alertBox("ปลายทางตามมติ", authoritativeTargets.map((target) => getAllowedTargets(reportTypeFromDecision, item?.integration.decision).find((entry) => entry.value === target)?.label || ({ PROSECUTOR: "พนักงานอัยการ", PARENT_AGENCY: "หน่วยงานต้นสังกัด", NACC: "ป.ป.ช.", OTHER: "หน่วยงานอื่น", ACCUSED: "ผู้ถูกกล่าวหา" }[target] || target)).join(" และ "), "info")}${authoritativeTargets.map((target) => `<input type="hidden" name="targets" value="${escapeHtml(target)}">`).join("")}`;
      const otherFields = isOtherAgency ? `${inputField("otherAgencyName", "ชื่อหน่วยงานปลายทาง")}${inputField("otherAgencyAddress", "ที่อยู่หรือรายละเอียดการนำส่ง", { type: "textarea" })}${inputField("otherAgencyContact", "ข้อมูลติดต่อหรือเลขอ้างอิงการนำส่ง")}${inputField("jurisdictionReason", "เหตุผลด้านอำนาจหน้าที่ของหน่วยงานปลายทาง", { type: "textarea" })}` : "";
      return { title: isTermination ? "ยืนยันยุติเรื่องตามมติ" : "จัดเตรียมการดำเนินการตามมติ", description: "ปลายทางเป็นไปตามผลพิจารณาที่บันทึกไว้ ผู้รับผิดชอบสำนวนเพิ่ม ลด หรือเลือกเพียงบางแห่งไม่ได้", body: `${targetFields}${otherFields}${inputField("reason", isTermination ? "เหตุผลและรายละเอียดการยุติเรื่อง" : "รายละเอียดการดำเนินการ", { type: "textarea" })}`, submitLabel: isTermination ? "ยืนยันยุติเรื่อง" : "จัดเตรียมหนังสือส่ง", danger: isTermination, successMessage: isTermination ? "ยุติเรื่องตามมติแล้ว" : "บันทึกการดำเนินการตามมติแล้ว" };
    })(),
    PREPARE_OUTGOING_PACKAGE: (() => {
      const delivery = commandItem?.handoff.deliveries.find((entry) => entry.target === target);
      const prosecutorFields = target === "PROSECUTOR"
        ? `${inputField("accusedCategory", "ประเภทผู้ถูกกล่าวหา", { options: [{ value: "CIVILIAN", label: "บุคคลทั่วไป/ข้าราชการพลเรือน" }, { value: "MILITARY", label: "ทหาร" }] })}${inputField("jurisdiction", "เขตอำนาจศาล")}`
        : "";
      return { title: `จัดเตรียมสำนวนและหนังสือนำส่ง ${delivery?.label || "ปลายทางตามมติ"}`, description: target === "PROSECUTOR" ? "บุคคลทั่วไปหรือข้าราชการพลเรือนส่งสำนักงานคดีปราบปรามการทุจริต ส่วนทหารส่งพนักงานอัยการทหารตามเขตอำนาจศาลทหาร" : "ผู้รับผิดชอบสำนวนจัดเตรียมเอกสารและเสนอหัวหน้าพนักงาน ป.ป.ท. ลงนาม", body: `<input type="hidden" name="target" value="${escapeHtml(target || "")}">${prosecutorFields}${inputField("caseFileReference", "รายการหรือเลขอ้างอิงสำนวน")}${inputField("resolutionReference", "เลขอ้างอิงมติคณะกรรมการ ป.ป.ท.")}${inputField("inquiryReportReference", "รายการรายงานที่คณะกรรมการฯ พิจารณา")}${inputField("outgoingLetterNo", "เลขหนังสือนำส่ง")}${inputField("reason", "บันทึกการจัดเตรียม", { type: "textarea", value: "ตรวจมติ รายงาน และเอกสารสำนวนครบถ้วน" })}`, successMessage: "จัดเตรียมสำนวนและเสนอหนังสือลงนามแล้ว" };
    })(),
    SIGN_OUTGOING_LETTER: { title: "ตรวจและลงนามหนังสือนำส่ง", body: `<input type="hidden" name="target" value="${escapeHtml(target || "")}">${inputField("reason", "ผลการตรวจและลงนาม", { type: "textarea", value: "ตรวจเอกสารสำนวนและลงนามหนังสือนำส่งแล้ว" })}`, successMessage: "บันทึกการลงนามแล้ว" },
    DISPATCH_SIGNED_DELIVERY: { title: "บันทึกผลการนำส่งสำนวน", body: `<input type="hidden" name="target" value="${escapeHtml(target || "")}">${inputField("deliveryResult", "ผลการนำส่ง", { options: [{ value: "SUCCESS", label: "นำส่งสำเร็จ" }, { value: "FAILED", label: "นำส่งไม่สำเร็จ" }] })}${inputField("deliveryNote", "ผลหรือหลักฐานการนำส่ง", { type: "textarea" })}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "บันทึกผลการจัดส่งสำนวนตามหนังสือที่ลงนามแล้ว" })}`, successMessage: "บันทึกผลการนำส่งแล้ว" },
    RETRY_OUTGOING_DELIVERY: { title: "บันทึกผลการนำส่งสำนวนอีกครั้ง", body: `<input type="hidden" name="target" value="${escapeHtml(target || "")}">${inputField("deliveryResult", "ผลการนำส่งซ้ำ", { options: [{ value: "SUCCESS", label: "นำส่งสำเร็จ" }, { value: "FAILED", label: "ยังนำส่งไม่สำเร็จ" }] })}${inputField("deliveryNote", "ผลหรือหลักฐานการนำส่งซ้ำ", { type: "textarea" })}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ตรวจสาเหตุและนำส่งด้วยหนังสือฉบับเดิมอีกครั้ง" })}`, successMessage: "บันทึกผลการนำส่งซ้ำแล้ว" },
    SEND_DISCIPLINARY_COPY: { title: "ส่งสำเนาให้ผู้รับผิดชอบสำนวน", description: "กลุ่มคำวินิจฉัย/กลุ่มกิจการส่งสำเนาหนังสือให้ผู้รับผิดชอบสำนวนเก็บรวบรวม", body: `${inputField("copyReference", "เลขหรือรายการสำเนาหนังสือ")}${inputField("reason", "บันทึกการส่งสำเนา", { type: "textarea", value: "ส่งสำเนามติและหนังสือให้ผู้รับผิดชอบสำนวนเก็บรวมในสำนวน" })}`, successMessage: "บันทึกการส่งสำเนาแล้ว" },
    DISPATCH_DISCIPLINARY_DELIVERY: { title: "ส่งหนังสือแจ้งหน่วยงานต้นสังกัด", description: "กลุ่มงานบริหารติดตามคดี (กบต.) เป็นผู้ส่งสำนวนและหนังสือแจ้งเพื่อพิจารณาโทษทางวินัย", body: `${inputField("parentAgencyName", "ชื่อหน่วยงานต้นสังกัด")}${inputField("outgoingLetterNo", "เลขหนังสือแจ้งหน่วยงานต้นสังกัด")}${inputField("deliveryResult", "ผลการนำส่ง", { options: [{ value: "SUCCESS", label: "นำส่งสำเร็จ" }, { value: "FAILED", label: "นำส่งไม่สำเร็จ" }] })}${inputField("deliveryNote", "ผลหรือหลักฐานการนำส่ง", { type: "textarea" })}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ส่งสำนวนและหนังสือแจ้งหน่วยงานต้นสังกัดเพื่อพิจารณาโทษทางวินัย" })}`, successMessage: "บันทึกผลการแจ้งหน่วยงานต้นสังกัดแล้ว" },
    RETRY_DISCIPLINARY_DELIVERY: { title: "นำส่งหนังสือแจ้งต้นสังกัดอีกครั้ง", body: `${inputField("deliveryResult", "ผลการนำส่งซ้ำ", { options: [{ value: "SUCCESS", label: "นำส่งสำเร็จ" }, { value: "FAILED", label: "ยังนำส่งไม่สำเร็จ" }] })}${inputField("deliveryNote", "ผลหรือหลักฐานการนำส่งซ้ำ", { type: "textarea" })}${inputField("reason", "บันทึกการดำเนินการ", { type: "textarea", value: "ตรวจสาเหตุและนำส่งหนังสือแจ้งหน่วยงานต้นสังกัดอีกครั้ง" })}`, successMessage: "บันทึกผลการนำส่งซ้ำแล้ว" },
    REQUEST_MERGE_CASES: (() => { const candidates = getState().cases.filter((entry) => entry.id !== commandItem?.id && canReadCase(getCurrentUser(), entry) && ["PRELIMINARY", "INQUIRY"].includes(entry.phase)).map((entry) => ({ value: entry.id, label: `${entry.id} — ${entry.title}` })); return { title: "เสนอรวมสำนวน", description: "ระบบเสนอให้สำนวนที่รับก่อนเป็นสำนวนหลัก โดยยังเก็บเลขและประวัติของทุกสำนวน", body: `${inputField("candidateId", "สำนวนที่เกี่ยวข้อง", { options: candidates })}${inputField("factsOverlap", "ข้อเท็จจริงที่เกี่ยวเนื่องกัน", { type: "textarea" })}${inputField("accusedOverlap", "ความเกี่ยวข้องของผู้ถูกร้องหรือผู้ถูกกล่าวหา", { type: "textarea" })}${inputField("reason", "บันทึกการเสนอ", { type: "textarea", value: "ตรวจข้อมูลทั้งสองสำนวนและเสนอรวมตามข้อเท็จจริงที่เกี่ยวเนื่อง" })}`, successMessage: "เสนอรวมสำนวนแล้ว" }; })(),
    DECIDE_MERGE_CASES: { title: decision === "APPROVED" ? "บันทึกผลอนุมัติรวมสำนวน" : "บันทึกผลไม่อนุมัติรวมสำนวน", body: `<input type="hidden" name="decision" value="${escapeHtml(decision)}">${inputField("reason", "ผลหรือเหตุผลการพิจารณา", { type: "textarea" })}`, danger: decision === "REJECTED", successMessage: "บันทึกผลพิจารณารวมสำนวนแล้ว" },
    REQUEST_SPLIT_CASE: { title: "เสนอแยกเรื่อง", description: commandItem?.phase === "PRELIMINARY" ? "คำขอจะผ่านหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการ กองบริหารคดี และศูนย์รับเรื่องร้องเรียน" : "คำขอจะผ่านหัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการและคณะกรรมการ ป.ป.ท.", body: inputField("reason", "เหตุผลและขอบเขตเรื่องที่ขอแยก", { type: "textarea" }), successMessage: "เสนอแยกเรื่องแล้ว" },
    REVIEW_SPLIT_CASE: { title: decision === "FORWARD" ? "เสนอส่งต่อคำขอแยกเรื่อง" : "ส่งคำขอแยกเรื่องกลับ", body: `<input type="hidden" name="requestId" value="${escapeHtml(requestId || "")}"><input type="hidden" name="decision" value="${escapeHtml(decision)}">${inputField("reason", "ความเห็นประกอบ", { type: "textarea" })}`, danger: decision === "RETURN", successMessage: "บันทึกความเห็นคำขอแยกเรื่องแล้ว" },
    COMPLETE_SPLIT_CASE: { title: "บันทึกผลการแยกเรื่อง", body: `<input type="hidden" name="requestId" value="${escapeHtml(requestId || "")}">${inputField("newCaseId", "เลขสำนวนใหม่ที่ได้รับ")}${inputField("reason", "รายละเอียดผลการดำเนินการ", { type: "textarea" })}`, successMessage: "บันทึกเลขสำนวนใหม่แล้ว" }
  };

  return configs[command];
}

function runCommand(command, caseId, payload, successMessage) {
  try {
    const updated = executeCommand(command, caseId, payload);
    closeModal();
    showToast(successMessage || "บันทึกคำสั่งแล้ว");
    if (command.startsWith("SPECIAL_")) {
      if (!canReadSpecialMatter(getCurrentUser(), updated)) location.hash = "#/special-matters";
      return;
    }
    if (!canReadCase(getCurrentUser(), updated)) location.hash = "#/cases";
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  const appError = error instanceof AppError ? error : new AppError("เกิดข้อผิดพลาดที่ไม่คาดคิด", 500);
  showToast(appError.message, "danger");
  if (appError.status === 403) {
    closeModal();
    location.hash = "#/access-denied";
  }
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function handleInlineForm(form, submitter) {
  const type = form.dataset.form;
  const caseId = form.dataset.caseId;
  const payload = formPayload(form);
  try {
    if (type === "login") {
      authenticate(payload.username, payload.password);
      location.hash = "#/dashboard";
      showToast("เข้าสู่ระบบแล้ว");
      return;
    }
    if (type === "case-filter") {
      activeFilter = { query: payload.query.trim(), phase: payload.phase };
      render();
      return;
    }
    if (type === "plan") {
      payload.issues = [0, 1, 2, 3].map((index) => payload[`issue-${index}`]);
      payload.reason = submitter?.value === "submit" ? "บันทึกแผน 4 ประเด็นและส่งตรวจ" : "บันทึกแผน 4 ประเด็น";
      const updated = executeCommand("SAVE_PLAN", caseId, payload);
      if (submitter?.value === "submit") executeCommand("SUBMIT_PLAN", caseId, { expectedVersion: updated.version, reason: "ส่งแผนให้หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการตรวจ" });
      showToast(submitter?.value === "submit" ? "บันทึกและส่งแผนตรวจแล้ว" : "บันทึกแผนแล้ว");
      return;
    }
    if (type === "worklog") runCommand("ADD_WORKLOG", caseId, { ...payload, reason: "เพิ่มบันทึกการดำเนินงาน" }, "เพิ่มบันทึกงานแล้ว");
    if (type === "evidence") runCommand("ADD_EVIDENCE", caseId, { ...payload, reason: "เพิ่มรายการพยานหลักฐาน" }, "เพิ่มพยานหลักฐานแล้ว");
    if (type === "report213") {
      const updated = executeCommand("UPDATE_REPORT_213", caseId, { ...payload, reason: "บันทึกรายงาน 213" });
      if (submitter?.value === "submit") executeCommand("SUBMIT_REPORT_213", caseId, { expectedVersion: updated.version, reason: "ส่งรายงาน 213 ให้หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการตรวจ" });
      showToast(submitter?.value === "submit" ? "บันทึกและส่งรายงาน 213 แล้ว" : "บันทึกรายงาน 213 แล้ว");
    }
    if (type === "report644") {
      const updated = executeCommand("UPDATE_REPORT_644", caseId, { ...payload, reason: "บันทึกรายงาน 644" });
      if (submitter?.value === "submit") executeCommand("SUBMIT_REPORT_644", caseId, { expectedVersion: updated.version, reason: "ส่งรายงาน 644 ให้หัวหน้าพนักงาน ป.ป.ท. ระดับผู้อำนวยการตรวจ" });
      showToast(submitter?.value === "submit" ? "บันทึกและส่งรายงาน 644 แล้ว" : "บันทึกรายงาน 644 แล้ว");
    }
    if (type === "special-report") {
      const updated = executeCommand("SPECIAL_SAVE_REPORT", caseId, { ...payload, reason: "บันทึกรายงานผลการตรวจสอบข้อเท็จจริง" });
      if (submitter?.value === "submit") executeCommand("SPECIAL_SUBMIT_REPORT", caseId, { expectedVersion: updated.version, reason: "เสนอรายงานให้ผู้บังคับบัญชาระดับผู้อำนวยการตรวจ ก่อนส่งผู้ช่วยหรือรองเลขาธิการฯ ที่กำกับและเลขาธิการฯ" });
      showToast(submitter?.value === "submit" ? "บันทึกและเสนอรายงานแล้ว" : "บันทึกรายงานแล้ว");
    }
  } catch (error) {
    handleError(error);
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.form === "modal-command") {
    if (!modalSubmitHandler) return;
    try {
      modalSubmitHandler(new FormData(form));
    } catch (error) {
      handleError(error);
    }
    return;
  }
  handleInlineForm(form, event.submitter);
});

document.addEventListener("click", (event) => {
  const commandButton = event.target.closest("[data-open-command]");
  if (commandButton) {
    openCommandModal(commandButton);
    return;
  }

  const actionButtonElement = event.target.closest("[data-action]");
  if (!actionButtonElement) return;
  const action = actionButtonElement.dataset.action;
  if (action === "close-modal") closeModal();
  if (action === "read-notification") {
    try {
      markNotificationRead(actionButtonElement.dataset.notificationId);
      showToast("ทำเครื่องหมายว่าอ่านแล้ว");
    } catch (error) {
      handleError(error);
    }
  }
  if (action === "logout") {
    logout();
    location.hash = "#/login";
    showToast("ออกจากระบบแล้ว", "info");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !modalRoot.querySelector("dialog[open]")) return;
  event.preventDefault();
  closeModal();
});

document.querySelectorAll("[data-font]").forEach((button) => {
  button.addEventListener("click", () => {
    const fontScale = Number(button.dataset.font);
    updatePreferences({ fontScale });
    showToast(fontScale < 0 ? "ลดขนาดตัวอักษรแล้ว" : fontScale > 0 ? "เพิ่มขนาดตัวอักษรแล้ว" : "ใช้ขนาดตัวอักษรปกติ", "info");
  });
});

contrastToggle.addEventListener("click", () => {
  const current = getState().preferences.highContrast;
  updatePreferences({ highContrast: !current });
  showToast(!current ? "เปิดโหมดคอนทราสต์สูงแล้ว" : "ปิดโหมดคอนทราสต์สูงแล้ว", "info");
});

window.addEventListener("hashchange", () => {
  closeModal();
  lastFailureKey = "";
  render();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
});

subscribe(render);
render();
