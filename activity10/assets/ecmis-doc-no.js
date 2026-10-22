/* ECMIS — ปุ่มออกเลขข้างช่องเลขที่หนังสือ (2026-10-22)
   รูปแบบเดียวกับ 10-3-09: ช่องกรอกเองได้ + ปุ่ม "# ออกเลขส่ง" / "# ออกเลขรับ" ที่เติมเลขให้

   ใช้แบบประกาศบน <input>:
     data-doc-no="ปป 0003/"      รูปแบบเลข — {BE} = ปี พ.ศ., {N} = เลขลำดับ 4 หลัก (ไม่มี {N} = ต่อท้าย)
     data-doc-no-kind="receive"  ปุ่ม "ออกเลขรับ" (ค่าตั้งต้น = "ออกเลขส่ง")
     data-doc-no-date="in_x"     ช่องวันที่ที่เติมวันนี้ให้เมื่อยังว่าง (input date หรือ read-box)

   ECMISDocNo.commit(inputId, caseId, docField, dateField) — ก่อนเรียก issueDocNo ของหน้า
   ถ้าผู้ใช้กรอก/กดออกเลขไว้ จะบันทึกเลขนั้นลงเคส ให้ issueDocNo คืนเลขเดิมแทนการสุ่มใหม่ */
(function (global) {
  "use strict";

  const SEQ_BASE = 4400;
  const SEQ_SPAN = 500;
  const BE_OFFSET = 543;
  const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  function pad(n, len) {
    return String(n).padStart(len, "0");
  }

  function generate(pattern) {
    const seq = pad(SEQ_BASE + Math.floor(Math.random() * SEQ_SPAN), 4);
    const be = String(new Date().getFullYear() + BE_OFFSET);
    const withYear = String(pattern || "").replace(/\{BE\}/g, be);
    return withYear.indexOf("{N}") >= 0 ? withYear.replace(/\{N\}/g, seq) : withYear + seq;
  }

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
  }

  function todayThai() {
    const d = new Date();
    return d.getDate() + " " + TH_MONTHS[d.getMonth()] + " " + (d.getFullYear() + BE_OFFSET);
  }

  function fire(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillDate(dateId) {
    const el = dateId && document.getElementById(dateId);
    if (!el) return;
    if (el.tagName === "INPUT") {
      if (el.value) return;
      el.value = todayIso();
      fire(el);
      return;
    }
    const cur = el.textContent.trim();
    if (!cur || cur === "-") el.textContent = todayThai();
  }

  function issueInto(input) {
    input.value = generate(input.dataset.docNo);
    fire(input);
    fillDate(input.dataset.docNoDate);
    if (global.Swal) {
      global.Swal.fire({
        icon: "success",
        title: input.dataset.docNoKind === "receive" ? "ออกเลขรับเรียบร้อยแล้ว" : "ออกเลขส่งเรียบร้อยแล้ว",
        text: "เลขที่ " + input.value,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  function attach(input) {
    if (!input || input.dataset.docNoReady) return;
    input.dataset.docNoReady = "1";
    const isReceive = input.dataset.docNoKind === "receive";
    const label = isReceive ? "ออกเลขรับ" : "ออกเลขส่ง";
    if (!input.placeholder) input.placeholder = "กรอกเองหรือกด" + label;
    else if (input.placeholder.indexOf("กด" + label) < 0) input.placeholder += " (กรอกเองหรือกด" + label + ")";
    input.style.borderRadius = "";

    const row = document.createElement("div");
    row.className = "ecmis-doc-no-row";
    row.style.cssText = "display: flex; gap: 8px; width: 100%";
    input.parentNode.insertBefore(row, input);
    row.appendChild(input);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-secondary";
    btn.style.whiteSpace = "nowrap";
    btn.innerHTML = '<i class="fa-solid fa-hashtag me-1"></i>' + label;
    btn.addEventListener("click", function () {
      issueInto(input);
    });
    row.appendChild(btn);

    /* ช่องปิดแก้ไข (โหมดดูอย่างเดียว) — ซ่อนปุ่มด้วย */
    const sync = function () {
      btn.style.display = input.disabled || input.readOnly ? "none" : "";
    };
    sync();
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
  }

  function attachAll(root) {
    (root || document).querySelectorAll("input[data-doc-no]").forEach(attach);
  }

  function commit(inputId, caseId, docField, dateField) {
    const el = document.getElementById(inputId);
    const typed = el && el.value ? el.value.trim() : "";
    if (!typed || !global.Activity10) return;
    const kase = global.Activity10.getCaseById(caseId);
    if (!kase || kase[docField] === typed) return;
    const patch = {};
    patch[docField] = typed;
    if (dateField && !kase[dateField]) patch[dateField] = todayThai();
    global.Activity10.updateCase(caseId, patch);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { attachAll(); });
    else attachAll();
  }

  global.ECMISDocNo = { attach: attach, attachAll: attachAll, generate: generate, commit: commit };
})(typeof window !== "undefined" ? window : globalThis);
