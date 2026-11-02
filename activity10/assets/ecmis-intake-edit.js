/* ecmis-intake-edit.js — นิติกรแก้ไขข้อมูลรับเรื่อง (จากหน้า 02) ในหน้า 06
   - แทนกล่องอ่านอย่างเดียว (f_*) ด้วยช่องกรอก และเพิ่มช่องของหน้า 02 ที่ 06 ยังไม่แสดง
   - ปุ่ม "บันทึก" โผล่เมื่อมีค่าที่เปลี่ยนจริง ๆ เท่านั้น
   - ทุกครั้งที่บันทึกจะต่อประวัติไว้ที่ case.intakeEditLog (แสดงแบบพับ กดดูได้)
   - เฉพาะบทบาทนิติกร และก่อนเสนอความเห็น; บทบาทอื่นเห็นประวัติอย่างเดียว
   ข้อมูลเขียนผ่าน Activity10.updateCase จึงไหลไปหน้า 07–09 และ 10.2 เอง */
(function (global) {
  "use strict";

  const OFFICER_ROLES = ["legal_officer", "case_legal_officer"];
  const CARD_SELECTOR =
    '.form-card[data-prev-step="รายละเอียดสำนวนคดีและข้อสั่งการจากผู้บังคับบัญชา"]';

  const LEVELS = {
    0: "ยังไม่มีศาลระบุ",
    1: "ศาลชั้นต้น",
    2: "ศาลอุทธรณ์",
    3: "ศาลฎีกา",
  };
  const CASE_TYPES = {
    1: "1. อัยการมีความเห็นสั่งไม่ฟ้อง",
    2: "2. อัยการมีความเห็นถอนฟ้อง",
    3: "3. อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)",
    4: "4. อัยการมีความเห็นสั่งไม่อุทธรณ์(ยกฟ้อง)",
    5: "5. อัยการมีความเห็นสั่งถอนอุทธรณ์",
    6: "6. อัยการมีความเห็นสั่งไม่ฎีกา(ลงโทษ)",
    7: "7. อัยการมีความเห็นสั่งไม่ฎีกา(ยกฟ้อง)",
    8: "8. อัยการมีความเห็นสั่งถอนฎีกา",
    9: "9. อื่นๆ",
  };

  /* kind: text | area | select | list(หนึ่งบรรทัดต่อหนึ่งรายการ)
     dom: id ของกล่องอ่านอย่างเดียวที่จะถูกแทน; ไม่มี dom = เพิ่มในส่วนเพิ่มเติม */
  const FIELDS = [
    { key: "centralSarabanNo", label: "เลขรับสารบรรณกลาง", kind: "text", dom: "f_centralSarabanNo", required: true },
    { key: "lawReceiveNo", label: "เลขรับกองกฎหมาย", kind: "text", dom: "f_lawReceiveNo", required: true },
    { key: "title", label: "ชื่อเรื่องกล่าวหา", kind: "area", dom: "f_title", required: true },
    { key: "source", label: "หน่วยงานอัยการต้นทาง", kind: "text", dom: "f_source" },
    { key: "prosecutorLevel", label: "ระดับศาล", kind: "select", dom: "f_level" },
    { key: "docNo", label: "เลขที่หนังสืออัยการ", kind: "text", dom: "f_docNo", required: true },
    { key: "summary", label: "สรุปสาระสำคัญ", kind: "area", dom: "f_summary" },
    { key: "prosecutorCaseTypeNo", label: "มติอัยการ", kind: "select", dom: "f_prosecutorCaseTypeName" },
    { key: "legalOpinion", label: "ความเห็นของอัยการ", kind: "area", dom: "f_opinion" },
    { key: "accuser", label: "ผู้กล่าวหา", kind: "text" },
    { key: "accused", label: "ผู้ถูกกล่าวหา", kind: "text" },
    { key: "physicalDocDate", label: "วันที่ในเอกสารฉบับจริง", kind: "text" },
    { key: "courtSystem", label: "ประเภทศาล", kind: "select" },
    { key: "prosecutorType", label: "ประเภทอัยการต้นทาง", kind: "select" },
    { key: "courtName", label: "ชื่อศาล", kind: "text" },
    { key: "courtBlackNo", label: "เลขคดีดำ", kind: "text" },
    { key: "courtRedNo", label: "เลขคดีแดง", kind: "text" },
    { key: "plaintiffs", label: "โจทก์ (หนึ่งบรรทัดต่อหนึ่งราย)", kind: "list" },
    { key: "defendants", label: "จำเลย (หนึ่งบรรทัดต่อหนึ่งราย)", kind: "list" },
    { key: "prescriptionDate", label: "วันที่คดีขาดอายุความ", kind: "text" },
    { key: "statuteLimitation", label: "อายุความ", kind: "text" },
  ];

  /* ชื่อที่ derive จากรหัส — เขียนคู่กันเสมอ ไม่ให้รหัสกับชื่อไม่ตรงกัน */
  const DERIVED = {
    prosecutorLevel: (v, cur) =>
      v === "9" ? {} : { prosecutorLevelName: LEVELS[v] || cur.prosecutorLevelName || "" },
    prosecutorCaseTypeNo: (v, cur) =>
      CASE_TYPES[v] ? { prosecutorCaseTypeName: CASE_TYPES[v] } : { prosecutorCaseTypeName: cur.prosecutorCaseTypeName || "" },
    courtSystem: (v) => ({ courtSystemName: lists() ? lists().courtTypeName(v) : "" }),
    prosecutorType: (v) => ({ prosecutorTypeName: lists() ? lists().prosecutorTypeName(v) : "" }),
  };

  const state = { kase: null, controls: {}, original: {}, bar: null, logHost: null, editable: false, onSaved: null };

  function lists() {
    return global.ECMISCourtLists || null;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function currentRoleId() {
    try {
      return global.ECMIS && ECMIS.currentRoleId ? ECMIS.currentRoleId() : "";
    } catch (e) {
      return "";
    }
  }

  function roleName() {
    try {
      const r = ECMIS.currentRole();
      return (r && (r.name || r.title)) || currentRoleId();
    } catch (e) {
      return currentRoleId();
    }
  }

  function optionsFor(key, kase) {
    if (key === "prosecutorLevel") {
      const base = Object.entries(LEVELS);
      const cur = String(kase.prosecutorLevel == null ? "" : kase.prosecutorLevel);
      return cur === "9" ? base.concat([["9", kase.prosecutorLevelName || "อื่นๆ"]]) : base;
    }
    if (key === "prosecutorCaseTypeNo") {
      const base = Object.entries(CASE_TYPES);
      const cur = String(kase.prosecutorCaseTypeNo || "");
      return cur === "11" ? base.concat([["11", kase.prosecutorCaseTypeName || "อื่นๆ"]]) : base;
    }
    if (key === "courtSystem") return lists() ? lists().COURT_TYPES.map((t) => [t.code, t.name]) : [];
    if (key === "prosecutorType") return lists() ? lists().PROSECUTOR_TYPES.map((t) => [t.code, t.name]) : [];
    return [];
  }

  /* ค่าในเคส → ข้อความในช่อง */
  function toControlValue(f, kase) {
    const v = kase[f.key];
    if (f.kind === "list") return Array.isArray(v) ? v.join("\n") : "";
    return v == null ? "" : String(v);
  }

  /* ข้อความในช่อง → ค่าที่เก็บในเคส */
  function fromControlValue(f, text) {
    if (f.kind === "list") return text.split("\n").map((x) => x.trim()).filter(Boolean);
    return f.kind === "select" ? text : text.trim();
  }

  function sameValue(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function displayValue(f, value, kase) {
    if (f.kind === "list") return (value || []).join(", ") || "(ว่าง)";
    if (f.kind === "select") {
      const hit = optionsFor(f.key, kase).find((o) => String(o[0]) === String(value));
      return hit ? hit[1] : value || "(ว่าง)";
    }
    return value === "" || value == null ? "(ว่าง)" : String(value);
  }

  function buildControl(f, kase) {
    let el;
    if (f.kind === "select") {
      el = document.createElement("select");
      const cur = toControlValue(f, kase);
      const opts = optionsFor(f.key, kase);
      const known = opts.some((o) => String(o[0]) === cur);
      const all = !known && cur ? opts.concat([[cur, cur]]) : opts;
      el.innerHTML =
        (cur ? "" : '<option value="">- ไม่ระบุ -</option>') +
        all.map((o) => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("");
    } else if (f.kind === "area" || f.kind === "list") {
      el = document.createElement("textarea");
      el.rows = f.kind === "list" ? 3 : f.key === "title" ? 2 : 4;
    } else {
      el = document.createElement("input");
      el.type = "text";
    }
    el.className = "form-control";
    el.id = "ie_" + f.key;
    el.setAttribute("aria-label", f.label);
    el.value = toControlValue(f, kase);
    el.addEventListener("input", refreshDirty);
    el.addEventListener("change", refreshDirty);
    return el;
  }

  function mountFields(kase) {
    state.controls = {};
    FIELDS.filter((f) => f.dom).forEach((f) => {
      const box = document.getElementById(f.dom);
      if (!box) return;
      const ctl = buildControl(f, kase);
      box.style.display = "none";
      box.insertAdjacentElement("afterend", ctl);
      state.controls[f.key] = ctl;
    });

    const anchor = document.getElementById("f_opinion");
    const host = anchor && anchor.closest(".form-group");
    if (!host) return;
    const extra = document.createElement("div");
    extra.id = "intakeEditExtra";
    extra.innerHTML =
      '<div class="fw-bold text-dark" style="margin:14px 0 8px"><i class="fa-solid fa-pen-to-square text-primary me-2"></i>ข้อมูลรับเรื่องเพิ่มเติม (บันทึกจากหน้า 02)</div><div class="form-grid-2" id="intakeEditExtraGrid"></div>';
    host.insertAdjacentElement("afterend", extra);
    const grid = extra.querySelector("#intakeEditExtraGrid");
    FIELDS.filter((f) => !f.dom).forEach((f) => {
      const group = document.createElement("div");
      group.className = "form-group" + (f.kind === "list" ? " span-2" : "");
      group.innerHTML = `<label for="ie_${f.key}">${esc(f.label)}</label>`;
      const ctl = buildControl(f, kase);
      group.appendChild(ctl);
      grid.appendChild(group);
      state.controls[f.key] = ctl;
    });
  }

  function mountBar() {
    const card = document.querySelector(CARD_SELECTOR);
    const body = card && card.querySelector(".form-card-body");
    if (!body) return;
    const bar = document.createElement("div");
    bar.id = "intakeEditBar";
    bar.className = "form-actions";
    bar.style.cssText = "display:none;justify-content:flex-end;gap:8px;margin-top:14px;align-items:center";
    bar.innerHTML =
      '<span class="text-warning fw-bold me-auto"><i class="fa-solid fa-circle-exclamation me-1"></i>มีข้อมูลที่ยังไม่ได้บันทึก</span>' +
      '<button type="button" class="btn btn-secondary" id="btnIntakeReset">ยกเลิกการแก้ไข</button>' +
      '<button type="button" class="btn btn-primary" id="btnIntakeSave"><i class="fa-solid fa-floppy-disk me-1"></i>บันทึก</button>';
    body.insertBefore(bar, state.logHost);
    bar.querySelector("#btnIntakeSave").addEventListener("click", save);
    bar.querySelector("#btnIntakeReset").addEventListener("click", reset);
    state.bar = bar;

    const badge = card.querySelector(".form-card-header .badge");
    if (badge) {
      badge.style.background = "#dcfce7";
      badge.style.color = "#166534";
      badge.innerHTML = '<i class="fa-solid fa-pen me-1"></i>นิติกรแก้ไขได้';
    }
  }

  function changedFields() {
    return FIELDS.filter((f) => {
      const ctl = state.controls[f.key];
      return ctl && !sameValue(fromControlValue(f, ctl.value), state.original[f.key]);
    });
  }

  function refreshDirty() {
    if (state.bar) state.bar.style.display = changedFields().length ? "flex" : "none";
  }

  function snapshotOriginal(kase) {
    state.original = {};
    FIELDS.forEach((f) => {
      state.original[f.key] = fromControlValue(f, toControlValue(f, kase));
    });
  }

  function reset() {
    FIELDS.forEach((f) => {
      const ctl = state.controls[f.key];
      if (ctl) ctl.value = toControlValue(f, state.kase);
    });
    refreshDirty();
  }

  function warn(text) {
    if (global.Swal) Swal.fire({ icon: "warning", title: "บันทึกไม่ได้", text: text, confirmButtonColor: "#1e3a8a" });
  }

  function save() {
    const changed = changedFields();
    if (!changed.length) return;
    const emptyRequired = changed.find((f) => f.required && !fromControlValue(f, state.controls[f.key].value));
    if (emptyRequired) return warn('กรุณากรอก "' + emptyRequired.label + '"');

    const kase = state.kase;
    const patch = {};
    const changes = changed.map((f) => {
      const next = fromControlValue(f, state.controls[f.key].value);
      patch[f.key] = next;
      if (DERIVED[f.key]) Object.assign(patch, DERIVED[f.key](next, kase));
      return { key: f.key, label: f.label, from: displayValue(f, state.original[f.key], kase), to: displayValue(f, next, kase) };
    });
    const entry = { at: new Date().toISOString(), by: roleName(), roleId: currentRoleId(), changes: changes };
    if (patch.title) patch.titlePending = false;
    patch.intakeEditLog = (kase.intakeEditLog || []).concat([entry]);

    const saved = Activity10.updateCase(kase.id, patch);
    if (!saved) return warn("ไม่พบสำนวนในระบบ");
    state.kase = saved;
    snapshotOriginal(saved);
    refreshDirty();
    renderLog();
    if (state.onSaved) state.onSaved(saved);
    if (global.Swal)
      Swal.fire({ icon: "success", title: "บันทึกข้อมูลรับเรื่องแล้ว", text: "แก้ไข " + changes.length + " รายการ", timer: 1500, showConfirmButton: false });
  }

  function fmtWhen(iso) {
    try {
      return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return iso;
    }
  }

  /* ประวัติแบบพับ — ไม่มีรายการเลยก็ไม่แสดงอะไร */
  function logHtml(kase) {
    const log = (kase && kase.intakeEditLog) || [];
    if (!log.length) return "";
    const items = log
      .slice()
      .reverse()
      .map(
        (e) =>
          '<li style="margin-bottom:8px"><div class="fw-bold">' + esc(fmtWhen(e.at)) + " · " + esc(e.by) + '</div><ul style="margin:2px 0 0 18px">' +
          e.changes
            .map((c) => "<li>" + esc(c.label) + ': <span class="text-secondary">' + esc(c.from) + "</span> → <strong>" + esc(c.to) + "</strong></li>")
            .join("") +
          "</ul></li>",
      )
      .join("");
    return (
      '<details class="mt-3" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px">' +
      '<summary class="fw-bold" style="cursor:pointer"><i class="fa-solid fa-clock-rotate-left me-2 text-secondary"></i>ประวัติการแก้ไขข้อมูลรับเรื่อง (' + log.length + " ครั้ง)</summary>" +
      '<ul style="list-style:none;padding:8px 0 0;margin:0">' + items + "</ul></details>"
    );
  }

  function renderLog() {
    if (state.logHost) state.logHost.innerHTML = logHtml(state.kase);
  }

  function mountLogHost() {
    const card = document.querySelector(CARD_SELECTOR);
    const body = card && card.querySelector(".form-card-body");
    if (!body) return;
    state.logHost = document.createElement("div");
    state.logHost.id = "intakeEditLog";
    body.appendChild(state.logHost);
  }

  /* options.kase: สำนวนปัจจุบัน; options.submitted: เสนอความเห็นแล้ว (ล็อก); options.onSaved: callback */
  function mount(options) {
    const kase = options && options.kase;
    if (!kase) return;
    state.kase = kase;
    state.onSaved = options.onSaved || null;
    state.editable = OFFICER_ROLES.indexOf(currentRoleId()) >= 0 && !options.submitted;
    mountLogHost();
    renderLog();
    if (!state.editable) return;
    mountFields(kase);
    snapshotOriginal(kase);
    mountBar();
    markTitlePending(kase);
  }

  /* ธุรการไม่ได้กรอกชื่อเรื่องที่หน้า 02 — เน้นช่องให้นิติกรกรอกชื่อจริงก่อนเสนอความเห็น */
  function markTitlePending(kase) {
    const ctl = state.controls.title;
    if (!kase.titlePending || !ctl) return;
    ctl.style.borderColor = "#dc2626";
    const hint = document.createElement("div");
    hint.className = "text-danger";
    hint.style.cssText = "font-size:0.85em;margin-top:4px";
    hint.textContent = "ธุรการยังไม่ได้ระบุชื่อเรื่อง — กรุณากรอกชื่อเรื่องกล่าวหาแล้วกดบันทึก ก่อนเสนอความเห็น";
    ctl.insertAdjacentElement("afterend", hint);
    ctl.addEventListener("input", () => {
      if (ctl.value.trim()) {
        ctl.style.borderColor = "";
        hint.style.display = "none";
      }
    });
  }

  /* ตรวจก่อนเสนอความเห็น: ชื่อเรื่องยังเป็นของชั่วคราวอยู่หรือไม่ (เปิดการ์ดและโฟกัสช่องให้) */
  function requireTitle() {
    const kase = state.kase;
    const ctl = state.controls.title;
    if (!kase || !kase.titlePending) return true;
    if (ctl) {
      /* การ์ดขั้นก่อนหน้าถูกพับอยู่ใน details.prev-step — เปิดก่อนจึงโฟกัสได้ */
      const box = ctl.closest("details");
      if (box) box.open = true;
      ctl.scrollIntoView({ block: "center" });
      ctl.focus();
    }
    warn("กรุณากรอกชื่อเรื่องกล่าวหา แล้วกดบันทึก ก่อนเสนอความเห็น");
    return false;
  }

  global.ECMISIntakeEdit = { mount: mount, logHtml: logHtml, requireTitle: requireTitle, FIELDS: FIELDS };
})(typeof window !== "undefined" ? window : globalThis);
