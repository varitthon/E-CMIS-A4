/* แดชบอร์ด 10.3 (คดีปกครอง) ตามบทบาท — ส่วนบนสุดของ dasdbord.html
   ขอบเขต: เฉพาะสำนวน category ขึ้นต้น "10.3" (คดีรับคำฟ้อง, เคสคำพิพากษา l3CaseType="verdict",
   และเคสลูกคำขอทุเลาฯ l3ParentCaseId) จาก Activity10.getCases() (localStorage)

   มุมมอง
   - นิติกร (Activity10.isAssignedOnlyRole: case_legal_officer / legal_officer) = "ภาพรวมของฉัน"
     สำนวน "ของฉัน" = Activity10.isAssignedTo(kase, role, ชื่อผู้ใช้) (เทียบชื่อกับ officer,
     assignedOfficer, l3GroupAssignTarget, assignedLawyers; หรือถึงขั้นบทบาทนี้แต่ยังไม่ระบุชื่อ)
     หรือชื่อผู้ใช้ปรากฏเป็นผู้บันทึก (by) ใน l3StatusHistory
   - บทบาทอื่น (ผอ.กองกฎหมาย ธุรการ ผอ.กลุ่ม ฯลฯ) = "ภาพรวมของกอง" เห็นสำนวน 10.3 ทั้งหมด

   กลุ่มสถานะ (ดู statusGroupOf)
   - เสร็จสิ้น: Activity10.isCaseClosed (statusCode มี COMPLETED/CLOSED เช่น L3V_CLOSED, L9B_CLOSED,
     L3B_CLOSED หรือ isCompleted) หรือ Activity103.effectiveStatus(kase).caseStatus === "FINAL"
     (รวม *_SUPREME_JUDGED)
   - นิติกร: งานเข้าใหม่ = ยังไม่ปิด และสำนวนอยู่ที่บทบาทนิติกร (assignedRole ตรงบทบาทผู้ใช้)
     โดย officer เป็นชื่อผู้ใช้หรือยังไม่ระบุชื่อ; กำลังดำเนินการ = สำนวนของฉันที่ยังไม่ปิดและอยู่ที่ผู้อื่น
   - กอง: งานเข้าใหม่ = ยังไม่ปิด ยังไม่มีร่างเอกสารใดๆ (l3DocDraft ว่าง) และยังอยู่ขั้นแรกของสาย
     (l3StepSeq <= 1); กำลังดำเนินการ = ยังไม่ปิดและเริ่มงานแล้ว (มีร่าง หรือผ่านขั้นแรกแล้ว)

   กราฟมูลเหตุ: นับ 1 สำนวนต่อกลุ่ม (เคสคำพิพากษารวมกับคดีต้นทาง l3OriginCaseId, เคสลูกทุเลาฯ
   รวมกับเคสแม่ l3ParentCaseId) ใช้ l3Causes ของเคสคำพิพากษาก่อน ถ้าไม่มีใช้ของคดีต้นทาง
   มูลเหตุเลือกได้หลายข้อ: กลุ่มที่มีหลายข้อนับ 1 ครั้งในแต่ละแท่ง (ผลรวมแท่งจึงอาจมากกว่าจำนวนสำนวน)
   ไม่มีเลย = "ยังไม่ระบุ" รายการจาก window.ECMISVerdictLists.ADMIN_CAUSES (7 ข้อ) */
(function (global) {
  "use strict";

  const COLORS = { NEW: "#2563eb", ACTIVE: "#d97706", DONE: "#16a34a" };
  const NATURE_COLOR = "#4f46e5";
  const UNSET_COLOR = "#94a3b8";
  const UNSET_KEY = "_unset";
  const SHORT_LABEL_MAX = 48;
  const GROUP_LABELS = { NEW: "งานเข้าใหม่", ACTIVE: "กำลังดำเนินการ", DONE: "เสร็จสิ้น" };

  const state = { activeGroup: null, doughnut: null, natureChart: null, groups: null };

  function A10() {
    return global.Activity10 || null;
  }
  function A103() {
    return global.Activity103 || null;
  }

  function escText(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function currentRoleId() {
    try {
      if (global.ECMIS && typeof global.ECMIS.currentRoleId === "function") {
        return global.ECMIS.currentRoleId();
      }
      return sessionStorage.getItem("ecmis_role") || "admin_legal";
    } catch (e) {
      return "admin_legal";
    }
  }

  function normalizedRole(roleId) {
    const aliases = (A10() && A10().ALERT_ROLE_ALIASES) || {};
    return aliases[roleId] || roleId;
  }

  function currentUserName(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find((x) => x.id === roleId || x.login === roleId);
    return r ? r.name : "";
  }

  function isLawyerView(roleId) {
    const a = A10();
    return !!(a && a.isAssignedOnlyRole && a.isAssignedOnlyRole(roleId));
  }

  function isCourtCase(c) {
    if (A103() && A103().isCourtCase) return A103().isCourtCase(c);
    return String((c && c.category) || "").indexOf("10.3") === 0;
  }

  function isClosed(c) {
    const a = A10();
    if (a && a.isCaseClosed && a.isCaseClosed(c)) return true;
    if (/COMPLETED|CLOSED|SUPREME_JUDGED/.test(String((c && c.statusCode) || ""))) return true;
    const a3 = A103();
    return !!(a3 && a3.effectiveStatus && a3.effectiveStatus(c).caseStatus === "FINAL");
  }

  function nameIn(text, userName) {
    return !!userName && String(text || "").indexOf(userName) >= 0;
  }

  function isMine(c, roleId, userName) {
    const a = A10();
    if (a && a.isAssignedTo && a.isAssignedTo(c, roleId, userName)) return true;
    const history = Array.isArray(c.l3StatusHistory) ? c.l3StatusHistory : [];
    return history.some((h) => h && nameIn(h.by, userName));
  }

  function hasAnyDraft(c) {
    const d = c && c.l3DocDraft;
    return !!d && typeof d === "object" && Object.keys(d).some((k) => !!d[k]);
  }

  function statusGroupOf(c, ctx) {
    if (isClosed(c)) return "DONE";
    if (ctx.lawyer) {
      const atMyRole = normalizedRole(c.assignedRole) === ctx.role;
      const officerIsMe = !c.officer || nameIn(c.officer, ctx.userName);
      return atMyRole && officerIsMe ? "NEW" : "ACTIVE";
    }
    const firstStep = (Number(c.l3StepSeq) || 0) <= 1;
    return firstStep && !hasAnyDraft(c) ? "NEW" : "ACTIVE";
  }

  function buildContext() {
    const rawRole = currentRoleId();
    const role = normalizedRole(rawRole);
    const lawyer = isLawyerView(rawRole);
    return { role: role, rawRole: rawRole, lawyer: lawyer, userName: currentUserName(rawRole) };
  }

  function allCourtCases() {
    const a = A10();
    const list = (a && a.getCases && a.getCases()) || [];
    return list.filter(isCourtCase);
  }

  function scopedCases(all, ctx) {
    if (!ctx.lawyer) return all.slice();
    return all.filter((c) => isMine(c, ctx.rawRole, ctx.userName));
  }

  /* ---------------------------------------------------------------- INBOX KPI */
  function groupCases(cases, ctx) {
    const out = { NEW: [], ACTIVE: [], DONE: [] };
    cases.forEach((c) => out[statusGroupOf(c, ctx)].push(c));
    return out;
  }

  function caseUrl(c) {
    const enc = encodeURIComponent(c.id);
    const a3 = A103();
    if (a3 && a3.viewPageFor) {
      const step = (a3.STEPS || []).find((s) => s.code === c.l3Step);
      const page = a3.viewPageFor(c, currentRoleId()) || (step && step.page);
      if (page) return page + "?id=" + enc + "&view=1";
    }
    return "01-work-inbox.html?alert=" + enc;
  }

  function renderKpis(groups) {
    Object.keys(GROUP_LABELS).forEach((key) => {
      const el = document.getElementById("d103Count" + key);
      if (el) el.textContent = String(groups[key].length);
      const card = document.getElementById("d103Card" + key);
      if (card) {
        card.classList.toggle("is-active", state.activeGroup === key);
        card.setAttribute("aria-pressed", state.activeGroup === key ? "true" : "false");
      }
    });
  }

  function renderList(groups) {
    const box = document.getElementById("d103CaseList");
    if (!box) return;
    if (!state.activeGroup) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const rows = groups[state.activeGroup];
    const head =
      '<div class="d103-list-head"><b>' +
      escText(GROUP_LABELS[state.activeGroup]) +
      "</b> <span class=\"ds-badge ds-badge-neutral\">" +
      rows.length +
      " สำนวน</span></div>";
    const body = rows.length
      ? '<table class="ds-table d103-table"><thead><tr><th style="width:190px">เลขสำนวน</th>' +
        "<th>เรื่อง</th><th style=\"width:240px\">สถานะ</th></tr></thead><tbody>" +
        rows
          .map(
            (c) =>
              '<tr><td><a href="' +
              escText(caseUrl(c)) +
              '">' +
              escText(c.id) +
              "</a>" +
              (c.l3CaseType === "verdict" ? ' <span class="ds-badge ds-badge-info">คำพิพากษา</span>' : "") +
              "</td><td>" +
              escText(c.title || "-") +
              "</td><td>" +
              escText(c.status || c.statusCode || "-") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table>"
      : '<div class="d103-empty">ไม่มีสำนวนในกลุ่มนี้</div>';
    box.innerHTML = head + '<div class="dash-table-wrap">' + body + "</div>";
    box.hidden = false;
  }

  function renderDoughnut(groups) {
    const canvas = document.getElementById("d103StatusChart");
    if (!canvas || typeof global.Chart === "undefined") return;
    const data = [groups.NEW.length, groups.ACTIVE.length, groups.DONE.length];
    if (state.doughnut) {
      state.doughnut.data.datasets[0].data = data;
      state.doughnut.update();
      return;
    }
    state.doughnut = new global.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: [GROUP_LABELS.NEW, GROUP_LABELS.ACTIVE, GROUP_LABELS.DONE],
        datasets: [
          {
            data: data,
            backgroundColor: [COLORS.NEW, COLORS.ACTIVE, COLORS.DONE],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: { legend: { position: "bottom", labels: { font: { family: "Sarabun" } } } },
        onClick: (evt, els) => {
          if (!els || !els.length) return;
          toggleGroup(["NEW", "ACTIVE", "DONE"][els[0].index]);
        },
      },
    });
  }

  function toggleGroup(key) {
    state.activeGroup = state.activeGroup === key ? null : key;
    if (!state.groups) return;
    renderKpis(state.groups);
    renderList(state.groups);
  }

  /* --------------------------------------------------------------- มูลเหตุ */
  function natureList() {
    return (global.ECMISVerdictLists && global.ECMISVerdictLists.ADMIN_CAUSES) || [];
  }

  function shortName(name) {
    const s = String(name || "").trim();
    return s.length > SHORT_LABEL_MAX ? s.slice(0, SHORT_LABEL_MAX) + "..." : s;
  }

  /* รหัสมูลเหตุของเคส (เฉพาะที่อยู่ในรายการ) จาก l3Causes { codes, other } */
  function causeCodes(c) {
    const v = c && c.l3Causes;
    if (!v || !Array.isArray(v.codes)) return [];
    const valid = natureList().map((n) => n.code);
    return v.codes.map(String).filter((code, i, a) => valid.indexOf(code) >= 0 && a.indexOf(code) === i);
  }

  function rootIdOf(c) {
    return c.l3OriginCaseId || c.l3ParentCaseId || c.id;
  }

  /* กลุ่มสำนวน: { root, members[] } — root คือคดีต้นทาง (ถ้ามีในระบบ) */
  function buildCaseGroups(all) {
    const byId = new Map(all.map((c) => [c.id, c]));
    const groups = new Map();
    all.forEach((c) => {
      const rid = rootIdOf(c);
      if (!groups.has(rid)) groups.set(rid, { root: byId.get(rid) || null, members: [] });
      groups.get(rid).members.push(c);
    });
    return Array.from(groups.values());
  }

  /* รหัสมูลเหตุของกลุ่ม (array, ว่าง = ยังไม่ระบุ) */
  function groupCauses(g) {
    const verdict = g.members.find((c) => c.l3CaseType === "verdict" && causeCodes(c).length);
    if (verdict) return causeCodes(verdict);
    if (g.root && causeCodes(g.root).length) return causeCodes(g.root);
    const other = g.members.find((c) => causeCodes(c).length);
    return other ? causeCodes(other) : [];
  }

  function groupFiscalYear(g) {
    const a = A10();
    const src = g.root || g.members[0];
    const iso = a && a.parseCaseDateIso ? a.parseCaseDateIso(src.dateReceived) : src.dateReceived;
    return a && a.fiscalYearOf ? a.fiscalYearOf(iso) : "";
  }

  function natureGroupsInScope(all, scopeIds) {
    return buildCaseGroups(all).filter((g) => g.members.some((c) => scopeIds.has(c.id)));
  }

  function fillYearSelect(groups) {
    const sel = document.getElementById("d103NatureYear");
    if (!sel) return;
    const prev = sel.value || "ALL";
    const years = Array.from(new Set(groups.map(groupFiscalYear).filter(Boolean))).sort().reverse();
    sel.innerHTML =
      '<option value="ALL">ทั้งหมด</option>' +
      years.map((y) => '<option value="' + escText(y) + '">ปีงบประมาณ พ.ศ. ' + escText(y) + "</option>").join("");
    sel.value = years.indexOf(prev) >= 0 ? prev : "ALL";
  }

  function renderNatureChart(groups) {
    const canvas = document.getElementById("d103NatureChart");
    if (!canvas || typeof global.Chart === "undefined") return;
    const sel = document.getElementById("d103NatureYear");
    const year = sel ? sel.value : "ALL";
    const picked = groups.filter((g) => year === "ALL" || groupFiscalYear(g) === year);
    const counts = {};
    picked.forEach((g) => {
      const codes = groupCauses(g);
      (codes.length ? codes : [UNSET_KEY]).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const items = natureList().map((n) => ({
      label: n.code + ". " + shortName(n.name),
      full: n.code + ". " + n.name,
      value: counts[n.code] || 0,
      color: NATURE_COLOR,
    }));
    items.push({ label: "ยังไม่ระบุ", full: "ยังไม่ระบุมูลเหตุ", value: counts[UNSET_KEY] || 0, color: UNSET_COLOR });

    const total = document.getElementById("d103NatureTotal");
    if (total) total.textContent = "รวม " + picked.length + " สำนวน";

    const cfgData = {
      labels: items.map((i) => i.label),
      datasets: [
        {
          label: "จำนวนสำนวน",
          data: items.map((i) => i.value),
          backgroundColor: items.map((i) => i.color),
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    };
    if (state.natureChart) {
      state.natureChart.$fullNames = items.map((i) => i.full);
      state.natureChart.data = cfgData;
      state.natureChart.update();
      return;
    }
    state.natureChart = new global.Chart(canvas, {
      type: "bar",
      data: cfgData,
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (ctx) => {
                const names = (state.natureChart && state.natureChart.$fullNames) || [];
                return ctx.length ? names[ctx[0].dataIndex] || ctx[0].label : "";
              },
              label: (ctx) => ctx.parsed.x + " สำนวน",
            },
          },
        },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } },
          y: { ticks: { autoSkip: false, font: { family: "Sarabun", size: 11 } } },
        },
      },
    });
    state.natureChart.$fullNames = items.map((i) => i.full);
  }

  /* ------------------------------------------------------------------ RENDER */
  function renderHeader(ctx) {
    const title = document.querySelector("#d103Title span");
    if (title) title.textContent = ctx.lawyer ? "ภาพรวมของฉัน" : "ภาพรวมของกอง";
    const sub = document.getElementById("d103Subtitle");
    if (sub) {
      sub.textContent = ctx.lawyer
        ? "สำนวนคดีปกครอง (10.3) ที่มอบหมายให้ " + (ctx.userName || "นิติกร")
        : "สำนวนคดีปกครอง (10.3) ทั้งหมดของกองกฎหมาย";
    }
  }

  let natureGroupsCache = [];

  function render() {
    if (!document.getElementById("d103Section") || !A10()) return;
    const ctx = buildContext();
    const all = allCourtCases();
    const scope = scopedCases(all, ctx);
    renderHeader(ctx);

    state.groups = groupCases(scope, ctx);
    renderKpis(state.groups);
    renderList(state.groups);
    renderDoughnut(state.groups);

    const scopeIds = new Set(scope.map((c) => c.id));
    natureGroupsCache = natureGroupsInScope(all, scopeIds);
    fillYearSelect(natureGroupsCache);
    renderNatureChart(natureGroupsCache);
  }

  function bind() {
    Object.keys(GROUP_LABELS).forEach((key) => {
      const card = document.getElementById("d103Card" + key);
      if (!card) return;
      card.addEventListener("click", () => toggleGroup(key));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleGroup(key);
        }
      });
    });
    const sel = document.getElementById("d103NatureYear");
    if (sel) sel.addEventListener("change", () => renderNatureChart(natureGroupsCache));
  }

  function init() {
    try {
      bind();
      render();
    } catch (e) {
      console.error("แดชบอร์ด 10.3 แสดงผลไม่สำเร็จ", e);
    }
  }

  global.ECMISDash103 = {
    render: render,
    statusGroupOf: statusGroupOf,
    isMine: isMine,
    groupCauses: groupCauses,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
