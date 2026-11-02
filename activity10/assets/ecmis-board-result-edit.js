/* ecmis-board-result-edit.js — ผลมติคณะกรรมการ ป.ป.ท. แบบกรอกในหน้า (หน้า 13)
   ในระบบจริงผลมติถูกส่งมาจากกิจกรรมที่ 7 นิติกรเจ้าของสำนวนจึงเห็นค่าที่ใส่มาให้แล้ว (prefill)
   และแก้ไขได้ทันที — ปุ่ม "บันทึก" โผล่เมื่อมีการแก้ไข, แก้ไขแล้วไม่ต้องกดบันทึกก็ได้
   เพราะ ensureSaved() บันทึกให้ก่อนเสนอร่างหนังสือ, ทุกครั้งที่แก้จะต่อประวัติใน case.boardResultEditLog
   เขียนผ่าน ECMIS_ACT7_HELPERS.buildAct7Patch("B1", …, {stage:"outbound"}) จึงได้ patch ชุดเดียวกับป๊อปอัปเดิม
   (ผลมติ + signedExecutiveOrder) โดยไม่เปลี่ยนสถานะ — บทบาทอื่นและหลังเสนอแล้วเห็นแบบอ่านอย่างเดียว */
(function (global) {
  "use strict";

  const OFFICER_ROLES = ["legal_officer", "case_legal_officer"];
  const SAMPLE_DETAIL =
    "ที่ประชุมคณะกรรมการ ป.ป.ท. ได้พิจารณาสำนวนการไต่สวนข้อเท็จจริงแล้ว มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ " +
    "และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาดตามขั้นตอนกฎหมายต่อไป";

  /* kind: select | text | date | area | file */
  const FIELDS = [
    { key: "decision", label: "มติคณะกรรมการ", kind: "select", required: true },
    { key: "other", label: "ระบุมติ (อื่นๆ)", kind: "text" },
    { key: "meetingNo", label: "ครั้งที่ประชุม", kind: "text", required: true },
    { key: "meetingDate", label: "วันที่ประชุม", kind: "date", required: true },
    { key: "agendaNo", label: "วาระที่", kind: "text" },
    { key: "noticeNo", label: "เลขที่หนังสือแจ้งมติ", kind: "text" },
    { key: "noticeDate", label: "วันที่หนังสือ", kind: "date" },
    { key: "detail", label: "รายละเอียดมติ", kind: "area", wide: true },
    { key: "files", label: "ไฟล์มติ", kind: "file", wide: true },
  ];

  const state = { kase: null, host: null, controls: {}, original: {}, bar: null, logHost: null, editable: false, onSaved: null };

  const H = () => global.ECMIS_ACT7_HELPERS;
  const link = () => global.ACT7_LINKS.B1;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function roleId() {
    try {
      return global.ECMIS && ECMIS.currentRoleId ? ECMIS.currentRoleId() : "";
    } catch (e) {
      return "";
    }
  }

  function roleName() {
    try {
      const r = ECMIS.currentRole();
      return (r && (r.name || r.title)) || roleId();
    } catch (e) {
      return roleId();
    }
  }

  const todayISO = () => new Date().toISOString().slice(0, 10);

  /* ค่าตั้งต้นของฟอร์ม: ใช้ผลมติที่ส่งมากับเคส ถ้าไม่มีใช้ค่าตัวอย่าง (ตัวอย่างตรงกับเคสตั้งต้น 14/2569 · 12 ส.ค. 2569) */
  function defaultsFor(kase) {
    const c = kase || {};
    return {
      decision: c.boardResolutionType || "AGREE",
      other: c.boardResolutionOther || "",
      meetingNo: c.boardMeetingNo || "14/2569",
      meetingDate: H().toISODate(c.boardMeetingDate) || "2026-08-12",
      agendaNo: c.boardAgendaNo || "",
      noticeNo: c.boardNoticeDocNo || "",
      noticeDate: H().toISODate(c.boardNoticeDate) || todayISO(),
      detail: c.boardResolutionDetail || SAMPLE_DETAIL,
      files: (c.boardResolutionFiles || []).join(", "),
    };
  }

  function buildControl(f, value) {
    let el;
    if (f.kind === "select") {
      el = document.createElement("select");
      el.innerHTML = link().options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
    } else if (f.kind === "area") {
      el = document.createElement("textarea");
      el.rows = 3;
    } else if (f.kind === "file") {
      el = document.createElement("input");
      el.type = "file";
      el.multiple = true;
    } else {
      el = document.createElement("input");
      el.type = f.kind === "date" ? "date" : "text";
    }
    el.className = "form-control";
    el.id = "br_" + f.key;
    el.setAttribute("aria-label", f.label);
    if (f.kind !== "file") el.value = value;
    el.addEventListener("input", refreshDirty);
    el.addEventListener("change", refreshDirty);
    return el;
  }

  function readValue(f) {
    const el = state.controls[f.key];
    if (!el) return "";
    if (f.kind === "file") {
      const names = el.files ? Array.from(el.files).map((x) => x.name) : [];
      return names.length ? names.join(", ") : state.original.files;
    }
    return el.value.trim();
  }

  function changedFields() {
    return FIELDS.filter((f) => state.controls[f.key] && readValue(f) !== state.original[f.key]);
  }

  function refreshDirty() {
    const other = document.getElementById("br_other");
    if (other) other.closest(".form-group").style.display = state.controls.decision.value === "OTHER" ? "" : "none";
    if (state.bar) state.bar.style.display = changedFields().length ? "flex" : "none";
  }

  function warn(text) {
    if (global.Swal) Swal.fire({ icon: "warning", title: "บันทึกผลมติไม่ได้", text: text, confirmButtonColor: "#1e3a8a" });
  }

  function optionLabel(value) {
    const o = link().options.find((x) => x.value === value);
    return o ? o.label : value;
  }

  /* เขียนผลมติลงเคส — คืน true เมื่อสำเร็จ; ต่อประวัติเฉพาะเมื่อมีค่าที่ต่างจากที่เห็นตอนเปิดหน้า */
  function persist(options) {
    const quiet = !!(options && options.quiet);
    const changed = changedFields();
    const form = {};
    FIELDS.forEach((f) => (form[f.key] = readValue(f)));
    const fileNames = form.files ? form.files.split(", ").filter(Boolean) : [];
    const res = H().buildAct7Patch(
      "B1", state.kase,
      { decision: form.decision, other: form.other, meetingNo: form.meetingNo, meetingDate: form.meetingDate,
        noticeNo: form.noticeNo, noticeDate: form.noticeDate, agendaNo: form.agendaNo, detail: form.detail, fileNames: fileNames },
      roleName(), new Date().toISOString(), { stage: "outbound" },
    );
    if (res.error) {
      warn(res.error);
      return false;
    }
    const patch = Object.assign({}, res.patch);
    if (changed.length) {
      const show = (f, v) => (f.key === "decision" ? optionLabel(v) : v) || "(ว่าง)";
      patch.boardResultEditLog = (state.kase.boardResultEditLog || []).concat([{
        at: new Date().toISOString(), by: roleName(), roleId: roleId(),
        changes: changed.map((f) => ({ key: f.key, label: f.label, from: show(f, state.original[f.key]), to: show(f, form[f.key]) })),
      }]);
    }
    const saved = global.Activity10.updateCase(state.kase.id, patch);
    if (!saved) {
      warn("ไม่พบสำนวนในระบบ");
      return false;
    }
    state.kase = saved;
    snapshotOriginal();
    refreshDirty();
    renderLog();
    if (state.onSaved) state.onSaved(saved);
    if (!quiet && global.Swal) {
      Swal.fire({ icon: "success", title: "บันทึกผลมติแล้ว", text: "แก้ไข " + changed.length + " รายการ", timer: 1400, showConfirmButton: false });
    }
    return true;
  }

  function snapshotOriginal() {
    const d = defaultsFor(state.kase);
    state.original = {};
    FIELDS.forEach((f) => (state.original[f.key] = f.kind === "file" ? d.files : String(d[f.key] || "").trim()));
    FIELDS.forEach((f) => {
      const el = state.controls[f.key];
      if (el && f.kind !== "file") el.value = state.original[f.key];
    });
  }

  function reset() {
    snapshotOriginal();
    if (state.controls.files) state.controls.files.value = "";
    refreshDirty();
  }

  function fmtWhen(iso) {
    try {
      return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return iso;
    }
  }

  function logHtml(kase) {
    const log = (kase && kase.boardResultEditLog) || [];
    if (!log.length) return "";
    const items = log.slice().reverse().map((e) =>
      '<li style="margin-bottom:8px"><div class="fw-bold">' + esc(fmtWhen(e.at)) + " · " + esc(e.by) + '</div><ul style="margin:2px 0 0 18px">' +
      e.changes.map((c) => "<li>" + esc(c.label) + ': <span class="text-secondary">' + esc(c.from) + "</span> → <strong>" + esc(c.to) + "</strong></li>").join("") +
      "</ul></li>").join("");
    return '<details class="mt-3" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px">' +
      '<summary class="fw-bold" style="cursor:pointer"><i class="fa-solid fa-clock-rotate-left me-2 text-secondary"></i>ประวัติการแก้ไขผลมติ (' + log.length + " ครั้ง)</summary>" +
      '<ul style="list-style:none;padding:8px 0 0;margin:0">' + items + "</ul></details>";
  }

  function renderLog() {
    if (state.logHost) state.logHost.innerHTML = logHtml(state.kase);
  }

  function cardShell(badgeHtml, bodyHtml) {
    return '<div class="form-card" id="boardResultCard" style="border: 2px solid #d97706">' +
      '<div class="form-card-header" style="background: rgba(217, 119, 6, 0.06)">' +
      '<span><i class="fa-solid fa-gavel text-primary me-2"></i>ผลมติคณะกรรมการ ป.ป.ท.</span>' + badgeHtml + "</div>" +
      '<div class="form-card-body">' + bodyHtml + "</div></div>";
  }

  function mountReadOnly() {
    state.host.innerHTML = cardShell(
      '<span class="badge" style="background:#dbeafe;color:#1e40af"><i class="fa-solid fa-lock me-1"></i>อ่านอย่างเดียว</span>',
      H().summaryHtml("B1", state.kase) + '<div id="boardResultLog"></div>',
    );
    state.logHost = state.host.querySelector("#boardResultLog");
    renderLog();
  }

  function mountEditable() {
    state.host.innerHTML = cardShell(
      '<span class="badge" style="background:#dcfce7;color:#166534"><i class="fa-solid fa-pen me-1"></i>ส่งมาจากกิจกรรมที่ 7 · นิติกรแก้ไขได้</span>',
      '<div style="font-size:0.88em;color:#64748b;margin-bottom:12px">ผลมติที่ส่งมาจากการประชุมคณะกรรมการ ป.ป.ท. — ตรวจสอบและแก้ไขได้ก่อนจัดทำหนังสือตามมติ</div>' +
      '<div class="form-grid-2" id="boardResultGrid"></div>' +
      '<div id="boardResultBar" class="form-actions" style="display:none;justify-content:flex-end;gap:8px;margin-top:14px;align-items:center">' +
      '<span class="text-warning fw-bold me-auto"><i class="fa-solid fa-circle-exclamation me-1"></i>มีข้อมูลที่ยังไม่ได้บันทึก</span>' +
      '<button type="button" class="btn btn-secondary" id="btnBoardReset">ยกเลิกการแก้ไข</button>' +
      '<button type="button" class="btn btn-primary" id="btnBoardSave"><i class="fa-solid fa-floppy-disk me-1"></i>บันทึก</button></div>' +
      '<div id="boardResultLog"></div>',
    );
    const grid = state.host.querySelector("#boardResultGrid");
    const d = defaultsFor(state.kase);
    FIELDS.forEach((f) => {
      const group = document.createElement("div");
      group.className = "form-group" + (f.wide ? " span-2" : "");
      group.innerHTML = `<label for="br_${f.key}">${esc(f.label)}${f.required ? ' <span style="color:#dc2626">*</span>' : ""}</label>`;
      const ctl = buildControl(f, d[f.key]);
      group.appendChild(ctl);
      if (f.kind === "file" && d.files) group.insertAdjacentHTML("beforeend", `<div style="font-size:0.8em;color:#64748b;margin-top:4px">ไฟล์ที่ได้รับแล้ว: ${esc(d.files)}</div>`);
      grid.appendChild(group);
      state.controls[f.key] = ctl;
    });
    state.bar = state.host.querySelector("#boardResultBar");
    state.logHost = state.host.querySelector("#boardResultLog");
    state.bar.querySelector("#btnBoardSave").addEventListener("click", () => persist());
    state.bar.querySelector("#btnBoardReset").addEventListener("click", reset);
    snapshotOriginal();
    refreshDirty();
    renderLog();
  }

  /* options: {host: element, kase, submitted, onSaved(kase)} */
  function mount(options) {
    const o = options || {};
    if (!o.host || !o.kase || !H()) return;
    state.host = o.host;
    state.kase = o.kase;
    state.onSaved = o.onSaved || null;
    state.controls = {};
    state.editable = OFFICER_ROLES.indexOf(roleId()) >= 0 && !o.submitted;
    if (state.editable) mountEditable();
    else mountReadOnly();
  }

  /* เรียกก่อนเสนอร่างหนังสือ — บันทึกค่าที่เห็น (รวมค่าที่ส่งมาแต่ยังไม่เคยบันทึก) ให้ครบ; false = ตรวจไม่ผ่าน */
  function ensureSaved() {
    if (!state.editable) return true;
    if (!changedFields().length && H().hasSavedResult("B1", state.kase)) return true;
    return persist({ quiet: true });
  }

  global.ECMISBoardResult = { mount: mount, ensureSaved: ensureSaved, logHtml: logHtml };
})(typeof window !== "undefined" ? window : globalThis);
