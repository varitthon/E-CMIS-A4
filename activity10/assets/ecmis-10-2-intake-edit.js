/* ecmis-10-2-intake-edit.js — ผู้รับงานคนแรกของ 10.2 แก้ไขข้อมูลที่ธุรการกรอกตอนรับเรื่อง (หน้า 02)
   - profile "request"  : 10-2-03 (เลขานุการฯ) แก้คำขอเปิดเผยข้อมูลข่าวสาร (10.2.1)
   - profile "appeal"   : 10-2-appeal-04 (นิติกรเจ้าของสำนวน) แก้ข้อมูลรับคำอุทธรณ์
   แทนกล่องอ่านอย่างเดียว (f_*) ด้วยช่องกรอก + เพิ่มช่องที่หน้านั้นยังไม่แสดง ปุ่ม "บันทึก" โผล่เมื่อมีการแก้ไข
   ทุกครั้งที่บันทึกต่อประวัติใน case.intakeEditLog (แสดงแบบพับ) เขียนผ่าน Activity10.updateCase — พฤติกรรมเดียวกับ
   ecmis-intake-edit.js ของ 10.1 (หน้า 06) แต่ชุดฟิลด์/บทบาทต่างกัน; ไฟล์แนบแก้ไม่ได้ที่นี่ (เป็นไฟล์จริงของหน้า 02) */
(function (global) {
  "use strict";

  const REQUESTER_TYPES = { CITIZEN: "ประชาชน", JURISTIC: "นิติบุคคล", AGENCY: "หน่วยงานของรัฐ", OTHER: "อื่นๆ" };
  const REQUEST_CHANNELS = {
    CENTRAL: "ยื่นที่ส่วนกลาง/ศรร.", REGION: "ยื่นที่สำนักงาน ป.ป.ท. เขต", POST: "ไปรษณีย์", ELECTRONIC: "อิเล็กทรอนิกส์", OTHER: "อื่นๆ",
  };

  /* kind: text | area | date | select; dom = id ของกล่องอ่านอย่างเดียวที่จะถูกแทน (ไม่มี = เพิ่มในส่วนเพิ่มเติม)
     also = คีย์อื่นที่ต้องได้ค่าเดียวกันด้วย; names = ตารางชื่อของ select (derive คู่กับ nameKey) */
  const PROFILES = {
    request: {
      roles: ["sub_secretariat"],
      extraAfter: "f_attachments",
      fields: [
        { key: "lawReceiveNo", label: "เลขรับกองกฎหมาย", kind: "text", dom: "f_lawReceiveNo", required: true },
        { key: "title", label: "ชื่อเรื่อง", kind: "text", dom: "f_title", required: true },
        { key: "requesterName", label: "ผู้ยื่นคำขอ", kind: "text", dom: "f_requesterName", required: true },
        { key: "requesterType", label: "ประเภทผู้ยื่นคำขอ", kind: "select", dom: "f_requesterType", names: REQUESTER_TYPES, nameKey: "requesterTypeName" },
        { key: "requestedInfo", label: "ข้อมูลข่าวสารที่ขอเปิดเผย", kind: "area", dom: "f_requestedInfo", required: true },
        { key: "relatedCaseNo", label: "เลขสำนวนคดีที่เกี่ยวข้อง", kind: "text", dom: "f_relatedCaseNo" },
        { key: "requestChannel", label: "ช่องทางการยื่นคำขอ", kind: "select", dom: "f_requestChannel", names: REQUEST_CHANNELS, nameKey: "requestChannelName" },
        { key: "centralSarabanNo", label: "เลขรับสารบรรณกลาง", kind: "text" },
        { key: "physicalDocDate", label: "วันที่รับเอกสาร", kind: "date" },
        { key: "requestReceivedDate", label: "วันที่รับคำขอ", kind: "date", also: ["dateReceived"] },
        { key: "dueDate", label: "ครบกำหนดดำเนินการ", kind: "date" },
        { key: "source", label: "หน่วยงานที่เสนอ", kind: "text" },
      ],
    },
    appeal: {
      roles: ["original_officer"],
      extraAfter: null,
      fields: [
        { key: "title", label: "ชื่อเรื่อง", kind: "text", dom: "f_title", required: true },
        { key: "requesterName", label: "ชื่อผู้อุทธรณ์", kind: "text", dom: "f_requesterName", required: true, also: ["l2AppellantName"] },
        { key: "l2AppealReceiveNo", label: "เลขรับคำอุทธรณ์", kind: "text", dom: "f_receiveNo" },
        { key: "l2AppealReceiveDate", label: "วันที่รับคำอุทธรณ์", kind: "text", dom: "f_receiveDate" },
        { key: "l2AppealChannel", label: "ช่องทางรับคำอุทธรณ์", kind: "text", dom: "f_channel" },
        { key: "l2AppealReceiveNotes", label: "หมายเหตุการรับเรื่อง", kind: "area", dom: "f_receiveNotes" },
      ],
    },
  };

  const state = { profile: null, fields: [], kase: null, controls: {}, original: {}, bar: null, logHost: null, onSaved: null };

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

  const valueOf = (f, kase) => (kase[f.key] == null ? "" : String(kase[f.key]));

  function buildControl(f, kase) {
    let el;
    if (f.kind === "select") {
      el = document.createElement("select");
      const cur = valueOf(f, kase);
      const entries = Object.entries(f.names);
      const known = entries.some((e) => e[0] === cur);
      const all = !known && cur ? entries.concat([[cur, cur]]) : entries;
      el.innerHTML = (cur ? "" : '<option value="">- ไม่ระบุ -</option>') + all.map((e) => `<option value="${esc(e[0])}">${esc(e[1])}</option>`).join("");
    } else if (f.kind === "area") {
      el = document.createElement("textarea");
      el.rows = 3;
    } else {
      el = document.createElement("input");
      el.type = f.kind === "date" ? "date" : "text";
    }
    el.className = "form-control";
    el.id = "ie2_" + f.key;
    el.setAttribute("aria-label", f.label);
    el.value = valueOf(f, kase);
    el.addEventListener("input", refreshDirty);
    el.addEventListener("change", refreshDirty);
    return el;
  }

  function mountFields() {
    const profile = PROFILES[state.profile];
    state.fields.filter((f) => f.dom).forEach((f) => {
      const box = document.getElementById(f.dom);
      if (!box) return;
      const ctl = buildControl(f, state.kase);
      box.style.display = "none";
      box.insertAdjacentElement("afterend", ctl);
      state.controls[f.key] = ctl;
    });
    /* การ์ดข้อมูลรับเรื่องถูกพับเป็น "ขั้นตอนก่อนหน้า" (details.prev-step) — เปิดไว้ เพราะตอนนี้เป็นช่องแก้ไขของหน้านี้ */
    const first = Object.values(state.controls)[0];
    const box = first && first.closest("details");
    if (box) box.open = true;
    const extras = state.fields.filter((f) => !f.dom);
    const anchor = profile.extraAfter && document.getElementById(profile.extraAfter);
    const host = anchor && anchor.closest(".form-group");
    if (!extras.length || !host) return;
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="fw-bold text-dark" style="margin:14px 0 8px"><i class="fa-solid fa-pen-to-square text-primary me-2"></i>ข้อมูลรับเรื่องเพิ่มเติม (บันทึกจากหน้า 02)</div><div class="form-grid-2" id="intake102Grid"></div>';
    host.insertAdjacentElement("afterend", wrap);
    const grid = wrap.querySelector("#intake102Grid");
    extras.forEach((f) => {
      const group = document.createElement("div");
      group.className = "form-group";
      group.innerHTML = `<label for="ie2_${f.key}">${esc(f.label)}</label>`;
      const ctl = buildControl(f, state.kase);
      group.appendChild(ctl);
      grid.appendChild(group);
      state.controls[f.key] = ctl;
    });
  }

  function cardBody() {
    const anchor = document.getElementById(state.fields.find((f) => f.dom).dom);
    const card = anchor && anchor.closest(".form-card");
    return card && card.querySelector(".form-card-body");
  }

  function mountBarAndLog() {
    const body = cardBody();
    if (!body) return;
    state.logHost = document.createElement("div");
    state.logHost.id = "intake102Log";
    body.appendChild(state.logHost);
    const bar = document.createElement("div");
    bar.className = "form-actions";
    bar.style.cssText = "display:none;justify-content:flex-end;gap:8px;margin-top:14px;align-items:center";
    bar.innerHTML =
      '<span class="text-warning fw-bold me-auto"><i class="fa-solid fa-circle-exclamation me-1"></i>มีข้อมูลที่ยังไม่ได้บันทึก</span>' +
      '<button type="button" class="btn btn-secondary" id="btnIntake102Reset">ยกเลิกการแก้ไข</button>' +
      '<button type="button" class="btn btn-primary" id="btnIntake102Save"><i class="fa-solid fa-floppy-disk me-1"></i>บันทึก</button>';
    body.insertBefore(bar, state.logHost);
    bar.querySelector("#btnIntake102Save").addEventListener("click", save);
    bar.querySelector("#btnIntake102Reset").addEventListener("click", reset);
    state.bar = bar;
  }

  const changedFields = () => state.fields.filter((f) => state.controls[f.key] && state.controls[f.key].value.trim() !== state.original[f.key]);

  function refreshDirty() {
    if (state.bar) state.bar.style.display = changedFields().length ? "flex" : "none";
  }

  function snapshotOriginal() {
    state.original = {};
    state.fields.forEach((f) => (state.original[f.key] = valueOf(f, state.kase).trim()));
  }

  function reset() {
    state.fields.forEach((f) => {
      if (state.controls[f.key]) state.controls[f.key].value = valueOf(f, state.kase);
    });
    refreshDirty();
  }

  function warn(text) {
    if (global.Swal) Swal.fire({ icon: "warning", title: "บันทึกไม่ได้", text: text, confirmButtonColor: "#1e3a8a" });
  }

  const shown = (f, v) => (f.names && v ? f.names[v] || v : v) || "(ว่าง)";

  function save() {
    const changed = changedFields();
    if (!changed.length) return;
    const empty = changed.find((f) => f.required && !state.controls[f.key].value.trim());
    if (empty) return warn('กรุณากรอก "' + empty.label + '"');

    const patch = {};
    const changes = changed.map((f) => {
      const next = state.controls[f.key].value.trim();
      patch[f.key] = next;
      (f.also || []).forEach((k) => (patch[k] = next));
      if (f.nameKey) patch[f.nameKey] = f.names[next] || next;
      return { key: f.key, label: f.label, from: shown(f, state.original[f.key]), to: shown(f, next) };
    });
    patch.intakeEditLog = (state.kase.intakeEditLog || []).concat([{ at: new Date().toISOString(), by: roleName(), roleId: roleId(), changes: changes }]);

    const saved = global.Activity10.updateCase(state.kase.id, patch);
    if (!saved) return warn("ไม่พบสำนวนในระบบ");
    state.kase = saved;
    snapshotOriginal();
    refreshDirty();
    renderLog();
    if (state.onSaved) state.onSaved(saved);
    if (global.Swal) Swal.fire({ icon: "success", title: "บันทึกข้อมูลรับเรื่องแล้ว", text: "แก้ไข " + changes.length + " รายการ", timer: 1500, showConfirmButton: false });
  }

  function fmtWhen(iso) {
    try {
      return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return iso;
    }
  }

  function logHtml(kase) {
    const log = (kase && kase.intakeEditLog) || [];
    if (!log.length) return "";
    const items = log.slice().reverse().map((e) =>
      '<li style="margin-bottom:8px"><div class="fw-bold">' + esc(fmtWhen(e.at)) + " · " + esc(e.by) + '</div><ul style="margin:2px 0 0 18px">' +
      e.changes.map((c) => "<li>" + esc(c.label) + ': <span class="text-secondary">' + esc(c.from) + "</span> → <strong>" + esc(c.to) + "</strong></li>").join("") +
      "</ul></li>").join("");
    return '<details class="mt-3" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px">' +
      '<summary class="fw-bold" style="cursor:pointer"><i class="fa-solid fa-clock-rotate-left me-2 text-secondary"></i>ประวัติการแก้ไขข้อมูลรับเรื่อง (' + log.length + " ครั้ง)</summary>" +
      '<ul style="list-style:none;padding:8px 0 0;margin:0">' + items + "</ul></details>";
  }

  function renderLog() {
    if (state.logHost) state.logHost.innerHTML = logHtml(state.kase);
  }

  /* options: {profile: "request"|"appeal", kase, onSaved(kase)} — ผู้ใช้ที่ไม่ใช่บทบาทแก้ไข เห็นเฉพาะประวัติ */
  function mount(options) {
    const o = options || {};
    const profile = PROFILES[o.profile];
    if (!profile || !o.kase) return;
    state.profile = o.profile;
    state.fields = profile.fields;
    state.kase = o.kase;
    state.onSaved = o.onSaved || null;
    state.controls = {};
    const editable = profile.roles.indexOf(roleId()) >= 0;
    if (editable) mountFields();
    mountBarAndLog();
    renderLog();
    if (editable) snapshotOriginal();
  }

  global.ECMISIntake102Edit = { mount: mount, logHtml: logHtml, PROFILES: PROFILES };
})(typeof window !== "undefined" ? window : globalThis);
