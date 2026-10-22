/* ผอ.กองกฎหมาย มอบหมาย — เลือกส่งต่อ ผอ.กลุ่มงาน (ค่าเริ่มต้น) หรือมอบหมายนิติกรโดยตรง
   (2026-10-21) ใช้ที่หน้า 04 / 10-3-02 / 10-3v-02 ซึ่งขั้นหลัง ผอ.กลุ่มงานมอบหมายคือนิติกร

   ECMISDirAssign.mount(containerId, opts)
     opts.groupName     ชื่อ ผอ.กลุ่มงาน (แสดงบนการ์ด)
     opts.lawyers       รายชื่อนิติกรที่เลือกได้ [string]
     opts.deadline      ค่าเริ่มต้นช่องกำหนดส่งงาน "YYYY-MM-DD" — ไม่ส่ง = ไม่มีช่องนี้
                        (เหมือนหน้า ผอ.กลุ่มงาน: 10.1 มีกำหนดส่ง, 10.3 ไม่มี)
     opts.groupFieldId  id ของช่องเลือก ผอ.กลุ่มงานในหน้า — ซ่อนเมื่อเลือกนิติกร
     opts.onChange(mode) เรียกเมื่อเปลี่ยนตัวเลือก
   ECMISDirAssign.value() → { mode: "GROUP" | "LAWYER", lawyerName, deadline } */
(function (global) {
  "use strict";

  const MODE_GROUP = "GROUP";
  const MODE_LAWYER = "LAWYER";
  const STYLE_ID = "ecmis-dir-assign-style";
  const STYLE = [
    ".dir-assign-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px}",
    "@media (max-width:640px){.dir-assign-grid{grid-template-columns:1fr}}",
    /* ตัวเลือกเป็น <label> ใน .form-group — หน้า 10.3 กำหนด .form-group label เป็น flex
       space-between จึงต้องระบุให้เจาะจงกว่า */
    ".dir-assign-grid label.dir-assign-card{display:flex;align-items:flex-start;justify-content:flex-start;gap:10px;margin:0;padding:12px 14px;font-size:1em;font-weight:400;border:1.5px solid var(--border-color,#e2e8f0);border-radius:10px;cursor:pointer;background:var(--bg-card,#fff);transition:border-color .15s,box-shadow .15s}",
    ".dir-assign-lawyer{margin-bottom:16px;gap:16px}",
    ".dir-assign-lawyer .form-group{margin-bottom:0}",
    ".dir-assign-grid label.dir-assign-card:hover{border-color:#93c5fd}",
    ".dir-assign-card:focus-within{outline:2px solid #2563eb;outline-offset:2px}",
    ".dir-assign-grid label.dir-assign-card.is-active{border-color:#1e3a8a;box-shadow:0 0 0 3px rgba(30,58,138,.12);background:rgba(30,58,138,.04)}",
    ".dir-assign-card input{accent-color:#1e3a8a;width:18px;height:18px;margin-top:2px;flex-shrink:0}",
    ".dir-assign-title{font-weight:700;color:var(--text-title,#1e293b);font-size:.92em}",
    ".dir-assign-title i{margin-right:6px}",
    ".dir-assign-sub{font-size:.78em;color:#64748b;margin-top:2px}",
    ".dir-assign-lawyer[hidden]{display:none}",
  ].join("");

  let state = { mode: MODE_GROUP, root: null, opts: {} };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function injectStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const el = doc.createElement("style");
    el.id = STYLE_ID;
    el.textContent = STYLE;
    doc.head.appendChild(el);
  }

  function card(mode, icon, title, sub, checked) {
    return (
      '<label class="dir-assign-card' + (checked ? " is-active" : "") + '" data-mode="' + mode + '">' +
      '<input type="radio" name="dir_assign_mode" value="' + mode + '"' + (checked ? " checked" : "") + " />" +
      "<div>" +
      '<div class="dir-assign-title"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + esc(title) + "</div>" +
      '<div class="dir-assign-sub">' + esc(sub) + "</div>" +
      "</div></label>"
    );
  }

  function lawyerBlock(opts) {
    const options = (opts.lawyers || [])
      .map(function (name) { return "<option>" + esc(name) + "</option>"; })
      .join("");
    const hasDeadline = typeof opts.deadline === "string";
    const deadline = hasDeadline
      ? '<div class="form-group"><label for="dir_assign_deadline">กำหนดส่งมอบงาน <span style="color:#dc2626">*</span></label>' +
        '<input type="date" id="dir_assign_deadline" class="form-control font-monospace" style="font-weight:600;color:#2563eb" value="' + esc(opts.deadline) + '" /></div>'
      : "";
    return (
      '<div class="dir-assign-lawyer' + (hasDeadline ? " form-grid-2" : "") + '" hidden>' +
      '<div class="form-group"><label for="dir_assign_lawyer">มอบหมายนิติกรผู้รับผิดชอบสำนวน <span style="color:#dc2626">*</span></label>' +
      '<select id="dir_assign_lawyer" class="form-control" style="font-weight:600;color:#1e3a8a">' + options + "</select></div>" +
      deadline +
      "</div>"
    );
  }

  function setMode(mode) {
    const root = state.root;
    if (!root) return;
    state.mode = mode === MODE_LAWYER ? MODE_LAWYER : MODE_GROUP;
    root.querySelectorAll(".dir-assign-card").forEach(function (el) {
      const on = el.getAttribute("data-mode") === state.mode;
      el.classList.toggle("is-active", on);
      el.querySelector("input").checked = on;
    });
    root.querySelector(".dir-assign-lawyer").hidden = state.mode !== MODE_LAWYER;
    const groupField = state.opts.groupFieldId && document.getElementById(state.opts.groupFieldId);
    const groupWrap = groupField && (groupField.closest(".form-group") || groupField);
    /* style.display (ไม่ใช่ hidden) — .form-group ของหน้ากำหนด display ทับ attribute hidden */
    if (groupWrap) groupWrap.style.display = state.mode === MODE_LAWYER ? "none" : "";
    if (typeof state.opts.onChange === "function") state.opts.onChange(state.mode);
  }

  function mount(containerId, opts) {
    const root = document.getElementById(containerId);
    if (!root) return;
    injectStyle(document);
    state = { mode: MODE_GROUP, root: root, opts: opts || {} };
    const groupName = state.opts.groupName || "ผอ.กลุ่มงาน";
    root.innerHTML =
      '<div class="form-group"><label>รูปแบบการมอบหมาย <span style="color:#dc2626">*</span></label>' +
      '<div class="dir-assign-grid" role="radiogroup" aria-label="รูปแบบการมอบหมาย">' +
      card(MODE_GROUP, "fa-users", "ส่งต่อ ผอ.กลุ่มงาน", groupName + " มอบหมายนิติกรต่อ", true) +
      card(MODE_LAWYER, "fa-user-pen", "มอบหมายนิติกรโดยตรง", "ข้ามขั้น ผอ.กลุ่มงานมอบหมาย — ผอ.กลุ่มงานตรวจร่างตามเดิม", false) +
      "</div></div>" +
      lawyerBlock(state.opts);
    root.querySelectorAll('input[name="dir_assign_mode"]').forEach(function (input) {
      input.addEventListener("change", function () { setMode(input.value); });
    });
    setMode(MODE_GROUP);
  }

  function value() {
    const lawyer = document.getElementById("dir_assign_lawyer");
    const deadline = document.getElementById("dir_assign_deadline");
    return {
      mode: state.mode,
      lawyerName: lawyer && lawyer.selectedIndex >= 0 ? lawyer.options[lawyer.selectedIndex].text.trim() : "",
      deadline: deadline ? deadline.value : "",
    };
  }

  global.ECMISDirAssign = {
    MODE_GROUP: MODE_GROUP,
    MODE_LAWYER: MODE_LAWYER,
    mount: mount,
    value: value,
    setMode: setMode,
  };
})(typeof window !== "undefined" ? window : this);
