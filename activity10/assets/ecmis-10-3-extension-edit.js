/* ECMIS 10.3 — เพิ่ม/แก้ไขคำขอขยายเวลายื่นคำให้การภายหลัง (2026-10-22)
   10-3-13 ไม่บังคับกรอกคำขอขยายเวลา — นิติกรมาเพิ่ม/แก้ได้ทุกเมื่อจากหน้าถัดไปของคดี
   ทำงานเองบนหน้าที่มี #f_extensionSummary เมื่อผู้ใช้ปัจจุบันคือนิติกร (case_legal_officer):
   วางปุ่มใต้สรุป → ป๊อปอัปแก้รายการ → บันทึก l3ExtensionRequests และวันครบกำหนดใหม่ลงเคส */
(function (global) {
  "use strict";

  const ROLE = "case_legal_officer";
  const RESULTS = [
    { value: "PENDING", label: "รอผลคำสั่งศาล" },
    { value: "GRANTED", label: "ศาลอนุญาต" },
    { value: "DENIED", label: "ศาลไม่อนุญาต" },
  ];
  const ALLOWED = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];
  let rows = [];

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function currentRoleId() {
    try {
      return sessionStorage.getItem("ecmis_role") || "";
    } catch (e) {
      return "";
    }
  }

  function pageCase() {
    /* หน้า 10-3 ประกาศ currentCase เป็น let ระดับสคริปต์ — อ่านผ่านชื่อได้ (global lexical scope) */
    let c = null;
    try {
      c = typeof currentCase !== "undefined" ? currentCase : null;
    } catch (e) {
      c = null;
    }
    if (!c) {
      const id = new URLSearchParams(location.search).get("id");
      c = id && global.Activity10 ? global.Activity10.getCaseById(id) : null;
    }
    return c && global.Activity10 ? global.Activity10.getCaseById(c.id) || c : c;
  }

  function rowHTML(r, i) {
    const opts = RESULTS.map((o) => '<option value="' + o.value + '"' + (o.value === r.result ? " selected" : "") + ">" + o.label + "</option>").join("");
    const files = (r.fileNames || [])
      .map((n, f) => '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' + esc(n) +
        '</div><button type="button" class="btn btn-secondary" style="height:26px;padding:0 8px;font-size:0.8em" data-act="rmfile" data-i="' + i + '" data-f="' + f + '"><i class="fa-solid fa-trash-can"></i></button></div>')
      .join("");
    return (
      '<div class="l3-ext-row" style="text-align:left">' +
      '<div class="l3-ext-row-head"><span><i class="fa-solid fa-file-circle-plus text-primary me-2"></i>คำขอขยายเวลา ครั้งที่ ' + (i + 1) + "</span>" +
      '<button type="button" class="btn btn-secondary" style="height:28px;padding:0 10px;font-size:0.8em" data-act="rm" data-i="' + i + '"><i class="fa-solid fa-trash-can me-1"></i>ลบ</button></div>' +
      '<div class="l3-form-grid-3">' +
      '<div class="form-group"><label>วันที่ยื่นคำร้อง <span style="color:#dc2626">*</span></label><input type="date" class="form-control" data-f="filedDate" data-i="' + i + '" value="' + esc(r.filedDate) + '"></div>' +
      '<div class="form-group"><label>จำนวนวันที่ขอ <span style="color:#dc2626">*</span></label><input type="number" min="1" class="form-control" data-f="requestedDays" data-i="' + i + '" value="' + esc(r.requestedDays) + '"></div>' +
      '<div class="form-group"><label>ผลคำสั่งศาล</label><select class="form-control" data-f="result" data-i="' + i + '">' + opts + "</select></div>" +
      "</div>" +
      (r.result !== "PENDING"
        ? '<div class="l3-form-grid-3"><div class="form-group"><label>วันที่ศาลมีคำสั่ง</label><input type="date" class="form-control" data-f="orderDate" data-i="' + i + '" value="' + esc(r.orderDate) + '"></div>' +
          (r.result === "GRANTED"
            ? '<div class="form-group"><label>จำนวนวันที่ศาลอนุญาต <span style="color:#dc2626">*</span></label><input type="number" min="1" class="form-control" data-f="grantedDays" data-i="' + i + '" value="' + esc(r.grantedDays) + '"></div>'
            : "") +
          "</div>"
        : "") +
      '<div class="form-group" style="margin-bottom:0"><label>แนบคำร้อง / คำสั่งศาล</label>' +
      '<input type="file" class="form-control" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" data-act="files" data-i="' + i + '">' +
      '<div style="margin-top:6px">' + files + "</div></div></div>"
    );
  }

  function draw(host) {
    host.innerHTML = rows.length
      ? rows.map(rowHTML).join("")
      : '<div class="read-box" style="text-align:left">ยังไม่มีคำขอขยายเวลา — กด "เพิ่มคำขอขยายเวลา"</div>';
  }

  function validate() {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const no = "ครั้งที่ " + (i + 1);
      if (!r.filedDate) return "คำขอขยายเวลา" + no + " ยังไม่มีวันที่ยื่นคำร้อง";
      if (!(parseInt(r.requestedDays, 10) > 0)) return "คำขอขยายเวลา" + no + " ต้องระบุจำนวนวันที่ขอ";
      if (r.result === "GRANTED" && !(parseInt(r.grantedDays, 10) > 0)) return "คำขอขยายเวลา" + no + " ศาลอนุญาตแล้ว ต้องระบุจำนวนวันที่ได้รับอนุญาต";
    }
    return "";
  }

  function save(kase) {
    const A3 = global.Activity103;
    const list = rows.map((r, i) => ({
      no: i + 1,
      filedDate: r.filedDate,
      requestedDays: r.requestedDays,
      result: r.result,
      grantedDays: r.result === "GRANTED" ? r.grantedDays : "",
      orderDate: r.result === "PENDING" ? "" : r.orderDate,
      fileNames: (r.fileNames || []).slice(),
    }));
    const d = A3.computeAnswerDeadline(kase, list);
    global.Activity10.updateCase(kase.id, {
      l3ExtensionRequests: list,
      l3AnswerOriginalDueDate: d ? A3.toISODate(d.originalDue) : kase.l3AnswerOriginalDueDate || "",
      l3AnswerDueDate: d ? A3.toISODate(d.currentDue) : kase.l3AnswerDueDate || "",
    });
    return d;
  }

  function open() {
    const kase = pageCase();
    if (!kase || !global.Swal) return;
    rows = (kase.l3ExtensionRequests || []).map((r) => Object.assign({ fileNames: [] }, r, { fileNames: (r.fileNames || []).slice() }));
    global.Swal.fire({
      title: "เพิ่ม/แก้ไขคำขอขยายเวลา",
      width: 860,
      html:
        '<div id="extEditHost" style="max-height:60vh;overflow-y:auto"></div>' +
        '<button type="button" class="btn btn-secondary" id="extEditAdd" style="margin-top:10px"><i class="fa-solid fa-plus me-1"></i>เพิ่มคำขอขยายเวลา</button>',
      showCancelButton: true,
      confirmButtonText: "บันทึกคำขอขยายเวลา",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      cancelButtonColor: "#64748b",
      didOpen: function () {
        const host = document.getElementById("extEditHost");
        draw(host);
        document.getElementById("extEditAdd").addEventListener("click", function () {
          rows.push({ filedDate: global.Activity103.toISODate(new Date()), requestedDays: "30", result: "PENDING", grantedDays: "", orderDate: "", fileNames: [] });
          draw(host);
        });
        host.addEventListener("input", function (e) {
          const f = e.target.dataset.f;
          if (!f || e.target.tagName === "SELECT") return;
          rows[+e.target.dataset.i][f] = e.target.value;
        });
        host.addEventListener("change", function (e) {
          const i = +e.target.dataset.i;
          if (e.target.dataset.f === "result") {
            rows[i].result = e.target.value;
            if (e.target.value !== "GRANTED") rows[i].grantedDays = "";
            if (e.target.value === "PENDING") rows[i].orderDate = "";
            draw(host);
          } else if (e.target.dataset.act === "files") {
            Array.from(e.target.files || []).forEach(function (file) {
              const ext = file.name.split(".").pop().toLowerCase();
              if (ALLOWED.indexOf(ext) >= 0) rows[i].fileNames.push(file.name);
            });
            draw(host);
          }
        });
        host.addEventListener("click", function (e) {
          const btn = e.target.closest("button[data-act]");
          if (!btn) return;
          const i = +btn.dataset.i;
          if (btn.dataset.act === "rm") rows.splice(i, 1);
          if (btn.dataset.act === "rmfile") rows[i].fileNames.splice(+btn.dataset.f, 1);
          draw(host);
        });
      },
      preConfirm: function () {
        const msg = validate();
        if (msg) global.Swal.showValidationMessage(msg);
        return !msg;
      },
    }).then(function (res) {
      if (!res.isConfirmed) return;
      save(kase);
      global.Swal.fire({ icon: "success", title: "บันทึกคำขอขยายเวลาแล้ว", text: "คำนวณวันครบกำหนดยื่นคำให้การใหม่เรียบร้อย", timer: 1600, showConfirmButton: false })
        .then(function () { location.reload(); });
    });
  }

  function mount() {
    const summary = document.getElementById("f_extensionSummary");
    if (!summary || currentRoleId() !== ROLE || !pageCase()) return;
    if (document.getElementById("btnExtEdit")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnExtEdit";
    btn.className = "btn btn-secondary";
    btn.style.marginTop = "8px";
    btn.innerHTML = '<i class="fa-solid fa-pen-to-square me-1"></i>เพิ่ม/แก้ไขคำขอขยายเวลา';
    btn.addEventListener("click", open);
    summary.insertAdjacentElement("afterend", btn);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(mount, 0); });
  else setTimeout(mount, 0);

  global.ECMIS103ExtEdit = { open: open, mount: mount };
})(window);
