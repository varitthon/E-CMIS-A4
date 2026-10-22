/* ECMIS 10.3 — คำขอทุเลาการบังคับคดี เพิ่ม/แก้ไขได้ทุกขั้นของคดีหลัก (2026-10-22)
   ก่อนหน้านี้สร้างเคสลูก (-B) ได้เฉพาะตอนติ๊กที่ 10-3-04 — ตอนนี้ทุกหน้าคดีหลัก 10-3-xx (ก่อนเข้าคำพิพากษา 10-3v)
   มีการ์ด "คำขอทุเลาการบังคับคดี": ติ๊ก + แนบหมายศาล + วันครบกำหนด → สร้างเคสลูกทันที (สายคู่ขนาน ไม่กระทบคดีหลัก)
   สร้างแล้วยังแก้ไฟล์หมายศาล/วันครบกำหนดได้ และแสดงสถานะปัจจุบันของเคสลูก
   ทำงานเองเมื่อโหลดหน้า — ข้ามหน้า 10-3-04 (มีช่องติ๊กของตัวเอง), เคสลูก, เคสคำพิพากษา และโหมดดูอย่างเดียว */
(function (global) {
  "use strict";

  const HOST_ID = "stayEditPanel";
  const ALLOWED = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];
  let files = [];

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function pageCase() {
    /* หน้า 10-3 ประกาศ currentCase เป็น let ระดับสคริปต์ — อ่านผ่านชื่อได้ (global lexical scope) */
    let c = null;
    try {
      c = typeof currentCase !== "undefined" ? currentCase : null;
    } catch (e) {
      c = null;
    }
    return c && global.Activity10 ? global.Activity10.getCases().find(function (k) { return k.id === c.id; }) || null : null;
  }

  function childOf(parent) {
    const childId = parent.id.replace(/\/(\d{4})$/, "-B/$1");
    return global.Activity10.getCases().find(function (k) { return k.id === childId; }) || null;
  }

  function isReadOnly() {
    const q = new URLSearchParams(location.search);
    let viewOnlyFlag = false;
    try {
      viewOnlyFlag = typeof viewOnly !== "undefined" && !!viewOnly;
    } catch (e) {
      viewOnlyFlag = false;
    }
    return q.get("view") === "1" || viewOnlyFlag;
  }

  function eligible(c) {
    const A3 = global.Activity103;
    if (!c || !A3) return false;
    if (A3.isStayObjectionCase(c) || A3.isVerdictCase(c)) return false;
    return /^L3_/.test(c.statusCode || "");
  }

  function fileRowsHTML(editable) {
    if (!files.length) return '<div class="read-box">-</div>';
    return files
      .map(function (n, i) {
        return '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' + esc(n) + "</div>" +
          (editable
            ? '<button type="button" class="btn btn-secondary" style="height:28px;padding:0 10px;font-size:0.8em" data-stay-rm="' + i + '" aria-label="ลบไฟล์ ' + esc(n) + '"><i class="fa-solid fa-trash-can"></i></button>'
            : "") +
          "</div>";
      })
      .join("");
  }

  function childStatusHTML(child) {
    if (!child) return "";
    return '<div class="l3-note l3-note-info" style="margin-bottom:12px"><i class="fa-solid fa-code-branch"></i><div>' +
      "<strong>สร้างเรื่องคำชี้แจงคัดค้านแล้ว</strong> — เคสลูก <span class=\"font-monospace\">" + esc(child.id) + "</span><br />" +
      "สถานะปัจจุบัน: " + esc(child.status || "-") + "</div></div>";
  }

  function bodyHTML(parent, child, editable) {
    const checked = !!(child || parent.l3HasStayRequest || parent.l3HasStayObjectionSummons);
    const due = (child && child.l3StayDueDate) || parent.l3StayDueDate || "";
    return (
      childStatusHTML(child) +
      '<div class="form-group"><div class="l3-checkbox-row">' +
      '<input type="checkbox" id="stay_has"' + (checked ? " checked" : "") + (child || !editable ? " disabled" : "") + " />" +
      '<label for="stay_has">ผู้ฟ้องคดียื่นคำขอทุเลาการบังคับคดี (ต้องจัดทำคำชี้แจงคัดค้าน)</label></div></div>' +
      '<div id="stay_fields"' + (checked ? "" : " hidden") + ">" +
      '<div class="form-grid-2">' +
      '<div class="form-group"><label for="stay_due">ครบกำหนดยื่นคำชี้แจงคัดค้าน</label>' +
      '<input type="date" id="stay_due" class="form-control font-monospace" lang="th-TH-u-ca-buddhist" value="' + esc(due) + '"' + (editable ? "" : " disabled") + " /></div>" +
      '<div class="form-group"><label for="stay_files">หมายศาล / คำขอทุเลาการบังคับคดี</label>' +
      (editable
        ? '<input type="file" id="stay_files" class="form-control" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />'
        : "") +
      '<div id="stay_fileList" style="margin-top:6px">' + fileRowsHTML(editable) + "</div></div>" +
      "</div>" +
      (editable
        ? '<div style="display:flex;justify-content:flex-end"><button type="button" class="btn btn-primary" id="stay_save">' +
          (child
            ? '<i class="fa-solid fa-floppy-disk me-1"></i>บันทึกข้อมูลคำขอทุเลา'
            : '<i class="fa-solid fa-code-branch me-1"></i>บันทึก และ สร้างเรื่องคำชี้แจงคัดค้าน (เคสลูก -B)') +
          "</button></div>"
        : "") +
      "</div>"
    );
  }

  function save(parent, child) {
    const due = document.getElementById("stay_due").value;
    const A10 = global.Activity10;
    A10.updateCase(parent.id, {
      l3HasStayRequest: true,
      l3HasStayObjectionSummons: files.length > 0 || !!parent.l3HasStayObjectionSummons,
      stayObjectionFileNames: files.slice(),
      l3StayDueDate: due || null,
    });
    const fresh = A10.getCases().find(function (k) { return k.id === parent.id; });
    const kid = child || global.Activity103.spawnStayObjectionCase(fresh);
    if (kid) A10.updateCase(kid.id, { l3StayDueDate: due || null });
    global.Swal.fire({
      icon: "success",
      title: child ? "บันทึกข้อมูลคำขอทุเลาแล้ว" : "สร้างเรื่องคำชี้แจงคัดค้านแล้ว",
      text: child
        ? "อัปเดตหมายศาลและวันครบกำหนดเรียบร้อย"
        : "ส่งนิติกรจัดทำคำชี้แจงคัดค้าน (" + (kid ? kid.id : "-") + ") — คดีหลักดำเนินต่อตามปกติ",
      timer: 1800,
      showConfirmButton: false,
    }).then(function () { location.reload(); });
  }

  function confirmSave(parent, child) {
    if (child) return save(parent, child);
    global.Swal.fire({
      icon: "question",
      title: "สร้างเรื่องคำชี้แจงคัดค้านคำขอทุเลา?",
      html: '<div class="emd-summary"><p>ระบบจะสร้างเคสลูก (-B) ส่งนิติกรเจ้าของสำนวนจัดทำคำชี้แจงคัดค้าน</p>' +
        "<p>คดีหลัก <strong>" + esc(parent.id) + "</strong> ดำเนินต่อที่ขั้นตอนเดิม ไม่เปลี่ยนสถานะ</p></div>",
      showCancelButton: true,
      confirmButtonText: "ยืนยันสร้างเรื่อง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      cancelButtonColor: "#64748b",
    }).then(function (res) {
      if (res.isConfirmed) save(parent, child);
    });
  }

  function wire(host, parent, child) {
    const cb = document.getElementById("stay_has");
    const fields = document.getElementById("stay_fields");
    if (cb) cb.addEventListener("change", function () { fields.hidden = !cb.checked; });
    const input = document.getElementById("stay_files");
    if (input) {
      input.addEventListener("change", function () {
        Array.from(input.files || []).forEach(function (f) {
          const ext = f.name.split(".").pop().toLowerCase();
          if (ALLOWED.indexOf(ext) >= 0 && files.indexOf(f.name) < 0) files.push(f.name);
        });
        input.value = "";
        document.getElementById("stay_fileList").innerHTML = fileRowsHTML(true);
      });
    }
    host.addEventListener("click", function (e) {
      const rm = e.target.closest("[data-stay-rm]");
      if (rm) {
        files.splice(+rm.getAttribute("data-stay-rm"), 1);
        document.getElementById("stay_fileList").innerHTML = fileRowsHTML(true);
        return;
      }
      if (e.target.closest("#stay_save")) confirmSave(parent, child);
    });
  }

  function anchor() {
    const court = document.getElementById("f_courtName");
    const card = court && court.closest(".form-card");
    /* การ์ดที่ถูกพับอยู่ใน <details class="prev-step"> — วางต่อจากกล่องพับ ไม่ใช่ในกล่อง */
    if (card) return { el: card.closest("details.prev-step") || card, where: "afterend" };
    const cur = document.querySelector("[data-prev-step-current]");
    if (cur) return { el: cur.closest("details.prev-step") || cur, where: "beforebegin" };
    const body = document.getElementById("pageBody");
    return body ? { el: body, where: "afterbegin" } : null;
  }

  function mount() {
    if (document.getElementById(HOST_ID) || document.getElementById("in_hasStayRequest")) return;
    const parent = pageCase();
    if (!eligible(parent)) return;
    const at = anchor();
    if (!at) return;
    const child = childOf(parent);
    const editable = !isReadOnly();
    files = (parent.stayObjectionFileNames || []).filter(Boolean).slice();
    const card = document.createElement("div");
    card.className = "form-card";
    card.id = HOST_ID;
    card.setAttribute("data-prev-step", "คำขอทุเลาการบังคับคดี");
    card.setAttribute("data-prev-step-hide-head", "");
    card.setAttribute("data-prev-step-hint", child ? "สร้างเคสลูกแล้ว · แก้ไขได้" : editable ? "เพิ่มได้ทุกขั้นตอน" : "ดูอย่างเดียว");
    card.innerHTML = '<div class="form-card-body">' + bodyHTML(parent, child, editable) + "</div>";
    at.el.insertAdjacentElement(at.where, card);
    if (editable) wire(card, parent, child);
  }

  /* รอให้หน้าโหลด currentCase เสร็จก่อน (หน้า 10-3 โหลดเคสใน DOMContentLoaded) */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(mount, 0); });
  else setTimeout(mount, 0);

  global.ECMIS103StayEdit = { mount: mount };
})(window);
