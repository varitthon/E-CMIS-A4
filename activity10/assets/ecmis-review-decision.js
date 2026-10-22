/* ผลการพิจารณาแบบการ์ดซ้าย/ขวา — เห็นชอบ | ส่งกลับ (2026-10-21)
   แพทเทิร์นเดียวกับ 10-3v-05 / 10-3-07 สำหรับหน้าตรวจ/ลงนามที่เดิมมีแค่ปุ่มผ่านเรื่อง

   ECMISReviewDecision.mount(opts)
     opts.button        selector ปุ่มส่งของหน้า (ค่าเริ่มต้น button[onclick="submitForm()"])
                        แผงตัวเลือกวางไว้เหนือแถวปุ่ม และปุ่มนี้จะเรียก submit() แทน
     opts.approveTitle / opts.approveSub      ข้อความการ์ดเห็นชอบ
     opts.sendBackTitle / opts.sendBackSub    ข้อความการ์ดส่งกลับ (เช่น "ส่งกลับนิติกร")
     opts.hideOnSendBack  [id] ช่องของหน้าที่ใช้เฉพาะตอนเห็นชอบ (ซ่อนทั้ง .form-group)
     opts.hide            [selector] ซ่อนถาวร (ปุ่มส่งกลับแบบเดิม)
     opts.onApprove()     ฟังก์ชันเห็นชอบเดิมของหน้า (เช่น submitForm)
     opts.onSendBack(reason)  บันทึกการส่งกลับ — คืนค่า false ถ้าไม่สำเร็จ
     opts.doneText        ข้อความหลังส่งกลับสำเร็จ */
(function (global) {
  "use strict";

  const APPROVE = "APPROVE";
  const SENDBACK = "SENDBACK";
  const INBOX = "01-work-inbox.html";
  const STYLE_ID = "ecmis-review-decision-style";
  const STYLE = [
    ".rd-panel{margin:0 0 16px;padding:16px 18px;border:1px solid var(--border-color,#e2e8f0);border-radius:10px;background:var(--bg-card,#fff)}",
    ".rd-label{display:block;font-size:.88em;font-weight:600;color:var(--text-title,#1e293b);margin:0 0 8px}",
    ".rd-req{color:#dc2626}",
    ".rd-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}",
    "@media (max-width:640px){.rd-grid{grid-template-columns:1fr}}",
    ".rd-grid label.rd-card{display:flex;align-items:center;justify-content:flex-start;gap:12px;margin:0;padding:14px 16px;border:2px solid var(--border-color,#e2e8f0);border-radius:8px;background:var(--bg-card,#fff);cursor:pointer;font-size:1em;font-weight:400;transition:border-color .2s,background .2s}",
    ".rd-grid label.rd-card:hover{border-color:#93c5fd}",
    ".rd-grid label.rd-card:focus-within{outline:2px solid #2563eb;outline-offset:2px}",
    ".rd-grid label.rd-card.is-approve{border-color:#16a34a;background:rgba(22,163,74,.05)}",
    ".rd-grid label.rd-card.is-sendback{border-color:#dc2626;background:rgba(220,38,38,.05)}",
    ".rd-card input{width:18px;height:18px;flex-shrink:0;margin:0}",
    ".rd-title{font-weight:700;font-size:.92em}",
    ".rd-title i{margin-right:6px}",
    ".rd-sub{font-size:.78em;color:#64748b;margin-top:2px}",
    ".rd-reason{margin-top:14px;padding:14px 16px;border:1px solid #fca5a5;border-radius:8px;background:rgba(220,38,38,.05)}",
    ".rd-reason[hidden]{display:none}",
    ".rd-reason textarea{width:100%;box-sizing:border-box}",
  ].join("");

  let state = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function card(value, color, icon, title, sub) {
    return (
      '<label class="rd-card" data-value="' + value + '">' +
      '<input type="radio" name="rd_decision" value="' + value + '" style="accent-color:' + color + '" />' +
      "<div>" +
      '<div class="rd-title" style="color:' + color + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' + esc(title) + "</div>" +
      (sub ? '<div class="rd-sub">' + esc(sub) + "</div>" : "") +
      "</div></label>"
    );
  }

  function panelHtml(o) {
    return (
      '<label class="rd-label">ผลการพิจารณา <span class="rd-req">*</span></label>' +
      '<div class="rd-grid" role="radiogroup" aria-label="ผลการพิจารณา">' +
      card(APPROVE, "#16a34a", "fa-check", o.approveTitle || "เห็นชอบ", o.approveSub) +
      card(SENDBACK, "#dc2626", "fa-rotate-left", o.sendBackTitle || "ส่งกลับ", o.sendBackSub) +
      "</div>" +
      '<div class="rd-reason" hidden>' +
      '<label class="rd-label" for="rd_reason">เหตุผลที่ส่งกลับ <span class="rd-req">*</span></label>' +
      '<textarea id="rd_reason" class="form-control" rows="3" placeholder="ระบุประเด็นที่ต้องแก้ไข..."></textarea>' +
      "</div>"
    );
  }

  function wrapOf(id) {
    const el = document.getElementById(id);
    return el ? el.closest(".form-group") || el : null;
  }

  function setDecision(value) {
    state.decision = value;
    const isSendBack = value === SENDBACK;
    state.panel.querySelectorAll(".rd-card").forEach(function (el) {
      const on = el.getAttribute("data-value") === value;
      el.classList.toggle("is-approve", on && value === APPROVE);
      el.classList.toggle("is-sendback", on && isSendBack);
      el.querySelector("input").checked = on;
    });
    state.panel.querySelector(".rd-reason").hidden = !isSendBack;
    (state.opts.hideOnSendBack || []).forEach(function (id) {
      const w = wrapOf(id);
      if (w) w.style.display = isSendBack ? "none" : "";
    });
    state.button.innerHTML = isSendBack
      ? '<i class="fa-solid fa-rotate-left me-1"></i>' + esc(state.opts.sendBackTitle || "ส่งกลับ")
      : state.approveHtml;
    /* สีแดงเมื่อส่งกลับ — inline !important เพราะ stylesheet กลางกำหนด .btn-primary แบบ !important */
    ["background", "border-color"].forEach(function (prop) {
      if (isSendBack) state.button.style.setProperty(prop, "#dc2626", "important");
      else state.button.style.removeProperty(prop);
    });
  }

  function warn(text) {
    return Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบถ้วน", text: text, confirmButtonColor: "#1e3a8a" });
  }

  function submitSendBack() {
    const reasonEl = document.getElementById("rd_reason");
    const reason = reasonEl.value.trim();
    if (!reason) {
      warn("กรุณาระบุเหตุผลที่ส่งกลับ");
      reasonEl.focus();
      return;
    }
    const o = state.opts;
    Swal.fire({
      icon: "question",
      title: "ยืนยัน" + (o.sendBackTitle || "ส่งกลับ"),
      text: "เหตุผล: " + reason,
      showCancelButton: true,
      confirmButtonText: "ยืนยันส่งกลับ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    }).then(function (res) {
      if (!res.isConfirmed) return;
      if (o.onSendBack(reason) === false) return;
      Swal.fire({
        icon: "success",
        title: "ส่งกลับเรียบร้อย",
        text: o.doneText || "ส่งเรื่องกลับให้แก้ไขเรียบร้อยแล้ว",
        timer: 1900,
        showConfirmButton: false,
      }).then(function () {
        global.location.href = INBOX;
      });
    });
  }

  function submit() {
    if (!state.decision) {
      warn("กรุณาเลือกผลการพิจารณา");
      return;
    }
    if (state.decision === SENDBACK) {
      submitSendBack();
      return;
    }
    state.opts.onApprove();
  }

  function mount(opts) {
    const o = opts || {};
    const button = document.querySelector(o.button || 'button[onclick="submitForm()"]');
    if (!button || typeof o.onApprove !== "function" || typeof o.onSendBack !== "function") return false;
    injectStyle();
    (o.hide || []).forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { el.style.display = "none"; });
    });
    const actions = button.closest(".form-actions") || button.parentElement;
    const panel = document.createElement("div");
    panel.className = "rd-panel";
    panel.innerHTML = panelHtml(o);
    actions.parentNode.insertBefore(panel, actions);
    button.removeAttribute("onclick");
    button.addEventListener("click", submit);
    state = { opts: o, panel: panel, button: button, approveHtml: button.innerHTML, decision: "" };
    panel.querySelectorAll('input[name="rd_decision"]').forEach(function (input) {
      input.addEventListener("change", function () { setDecision(input.value); });
    });
    return true;
  }

  global.ECMISReviewDecision = {
    APPROVE: APPROVE,
    SENDBACK: SENDBACK,
    mount: mount,
    submit: function () { if (state) submit(); },
  };
})(typeof window !== "undefined" ? window : this);
