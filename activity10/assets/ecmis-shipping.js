/* ECMIS — กล่อง "หลักฐานการส่งหนังสือภายนอก" ใช้ร่วมทุกกิจกรรม (2026-10-22) + ecmis-shipping.css
   แบบจาก ecmis/person-screening/PersonScreenCaseDetailPage.html (ขั้น 10) เขียนใหม่เป็น HTML + JS ธรรมดา
   กด "ส่ง" = บันทึกหลักฐานลงเคสอย่างเดียว ไม่เปลี่ยนสถานะ (ปุ่มหลักของหน้าเป็นผู้เดินงาน)

   ECMISShipping.mount(hostId, opts)
     opts.get()        คืนข้อมูลที่บันทึกไว้ (หรือ null)
     opts.save(data)   บันทึก { method, evidenceNos[], postReceiptFileName, notes, additionalFiles[], savedAt }
     opts.readOnly     true = แสดงสรุปอย่างเดียว (ไม่มีปุ่มกรอก/แก้ไข)
     opts.method       กำหนดวิธีส่งตายตัว (เช่น "EMS" เมื่อหน้าเลือกวิธีส่งเองแล้ว) — แสดงอ่านอย่างเดียวในกล่อง
   ECMISShipping.link(opts) — แทนช่องเลข EMS เดิมของหน้าที่มีตัวเลือกวิธีส่ง (ดูคำอธิบายที่ฟังก์ชัน)
   ECMISShipping.summaryText(data) — ข้อความสั้นสำหรับไทม์ไลน์ */
(function (global) {
  "use strict";

  const METHODS = [
    { value: "EMS", label: "ส่งด้วย EMS" },
    { value: "EMAIL", label: "ส่งด้วย E-mail" },
    { value: "HAND", label: "รับเอง / หนังสือนำส่ง" },
  ];

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function methodLabel(value) {
    const m = METHODS.find(function (x) { return x.value === value; });
    return m ? m.label : "-";
  }

  function numbersOf(data) {
    return ((data && data.evidenceNos) || []).filter(function (n) { return String(n).trim(); });
  }

  function summaryText(data) {
    if (!data) return "";
    const nos = numbersOf(data);
    return "ส่งแล้ว" + (nos.length ? " · เลข EMS: " + nos.join(", ") : "") + " · ใบส่งไปรษณีย์: " + (data.postReceiptFileName || "-");
  }

  /* ---------------------------------------------------------------- summary */
  function renderHost(host, opts) {
    const data = opts.get();
    if (!data) {
      host.innerHTML =
        '<span class="l3ship-pill is-pending">ส่งหนังสือหน่วยงานภายนอก (รอดำเนินการ)</span>' +
        (opts.readOnly ? "" :
          '<button type="button" class="l3ship-trigger" data-ship="open"><i class="fa-solid fa-truck"></i>กรอกข้อมูลจัดส่ง &amp; บันทึกส่งหนังสือหน่วยงานภายนอก</button>');
    } else {
      const nos = numbersOf(data);
      host.innerHTML =
        '<span class="l3ship-pill is-done"><i class="fa-solid fa-circle-check"></i>ส่งหนังสือแจ้งผลให้หน่วยงานภายนอกเรียบร้อยแล้ว</span>' +
        '<div class="l3ship-summary">' +
        '<strong class="l3ship-summary-title"><i class="fa-solid fa-truck"></i>รายละเอียดการจัดส่งหน่วยงานภายนอก</strong>' +
        '<div class="l3ship-summary-grid">' +
        '<div><span class="l3ship-k">วิธีส่ง:</span><strong class="l3ship-v">' + esc(methodLabel(data.method)) + "</strong></div>" +
        '<div><span class="l3ship-k">เลข EMS / หลักฐาน:</span><strong class="l3ship-v">' + esc(nos.join(", ") || "-") + "</strong></div>" +
        "</div>" +
        '<div><span class="l3ship-k is-block">ใบส่งไปรษณีย์เข้า:</span><span class="l3ship-file-ok"><i class="fa-solid fa-file-circle-check"></i>' + esc(data.postReceiptFileName) + "</span></div>" +
        (String(data.notes || "").trim()
          ? '<div><span class="l3ship-k is-block">หมายเหตุ / รายละเอียดเพิ่มเติม:</span><p class="l3ship-notes">' + esc(data.notes) + "</p></div>"
          : "") +
        ((data.additionalFiles || []).length
          ? '<div><span class="l3ship-k is-block">ไฟล์แนบเพิ่มเติม:</span>' +
            data.additionalFiles.map(function (f) { return '<div class="l3ship-file-row"><span><i class="fa-solid fa-file-lines"></i>' + esc(f) + "</span></div>"; }).join("") +
            "</div>"
          : "") +
        '<div class="l3ship-timeline"><i class="fa-solid fa-clock-rotate-left"></i>' + esc(summaryText(data)) + "</div>" +
        (opts.readOnly ? "" : '<button type="button" class="btn btn-secondary l3ship-edit" data-ship="open"><i class="fa-solid fa-pen-to-square me-1"></i>แก้ไขข้อมูลจัดส่ง</button>') +
        "</div>";
    }
    const trigger = host.querySelector('[data-ship="open"]');
    if (trigger) trigger.addEventListener("click", function () { open(host, opts, trigger); });
  }

  /* ------------------------------------------------------------------ modal */
  function open(host, opts, trigger) {
    const saved = opts.get();
    const st = {
      method: opts.method || (saved && saved.method) || "EMS",
      evidenceNos: saved && saved.evidenceNos && saved.evidenceNos.length ? saved.evidenceNos.slice() : [""],
      postReceiptFileName: (saved && saved.postReceiptFileName) || "",
      notes: (saved && saved.notes) || "",
      additionalFiles: ((saved && saved.additionalFiles) || []).slice(),
    };

    const backdrop = document.createElement("div");
    backdrop.className = "l3ship-backdrop";
    backdrop.innerHTML =
      '<div class="l3ship-card" role="dialog" aria-modal="true" aria-labelledby="shipping-title">' +
      '<div class="l3ship-head"><div><h2 id="shipping-title">หลักฐานการส่งหนังสือภายนอก</h2>' +
      "<p>ระบุวิธีจัดส่ง หมายเลข และไฟล์หลักฐานการส่ง</p></div>" +
      '<button type="button" class="l3ship-close" data-act="close" aria-label="ปิด">×</button></div>' +
      '<div class="l3ship-body">' +
      (opts.method
        ? '<div class="l3ship-field"><span class="l3ship-label" id="l3ship_method_label">วิธีส่ง</span>' +
          '<div class="l3ship-fixed-method" aria-labelledby="l3ship_method_label">' + esc(methodLabel(opts.method)) + "</div></div>"
        : '<label class="l3ship-field" for="l3ship_method"><span class="l3ship-label">วิธีส่ง</span>' +
          '<select id="l3ship_method" class="l3ship-input">' +
          METHODS.map(function (m) { return '<option value="' + m.value + '">' + m.label + "</option>"; }).join("") +
          "</select></label>") +
      '<div class="l3ship-field"><span class="l3ship-label" id="l3ship_nos_label">เลข EMS / เลขหลักฐานการส่ง</span>' +
      '<div class="l3ship-nos" data-ref="nos" role="group" aria-labelledby="l3ship_nos_label"></div>' +
      '<button type="button" class="l3ship-add" data-act="add"><i class="fa-solid fa-circle-plus"></i>เพิ่มเลข EMS</button></div>' +
      '<div class="l3ship-section"><span class="l3ship-label"><i class="fa-solid fa-paperclip"></i>แนบไฟล์ใบส่งไปรษณีย์เข้า <span class="l3ship-req">*</span></span>' +
      '<label class="l3ship-upload" for="l3ship_receipt"><i class="fa-solid fa-upload"></i>เลือกไฟล์ใบส่งไปรษณีย์' +
      '<input type="file" id="l3ship_receipt" accept=".pdf,.png,.jpg,.jpeg" /></label>' +
      '<div data-ref="receipt"></div></div>' +
      '<div class="l3ship-section"><span class="l3ship-label"><i class="fa-solid fa-file-circle-plus"></i>รายละเอียดเพิ่มเติมและไฟล์แนบเสริม (ไม่บังคับ)</span>' +
      '<label class="l3ship-field" for="l3ship_notes"><span class="l3ship-sublabel">หมายเหตุ / รายละเอียดการจัดส่งเพิ่มเติม:</span>' +
      '<textarea id="l3ship_notes" class="l3ship-textarea" placeholder="กรอกรายละเอียดเพิ่มเติม..."></textarea></label>' +
      '<div class="l3ship-field"><span class="l3ship-sublabel">แนบไฟล์เพิ่มเติม:</span>' +
      '<label class="l3ship-upload is-grey" for="l3ship_extra"><i class="fa-solid fa-upload"></i>เลือกไฟล์แนบเพิ่มเติม' +
      '<input type="file" id="l3ship_extra" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" /></label>' +
      '<div class="l3ship-files" data-ref="extra"></div></div></div>' +
      "</div>" +
      '<div class="l3ship-actions"><button type="button" class="l3ship-btn-light" data-act="close">ยกเลิก</button>' +
      '<button type="button" class="l3ship-btn-send" data-act="send">ส่ง</button></div>' +
      "</div>";
    document.body.appendChild(backdrop);
    const q = function (sel) { return backdrop.querySelector(sel); };

    if (q("#l3ship_method")) q("#l3ship_method").value = st.method;
    q("#l3ship_notes").value = st.notes;

    function drawNos() {
      q('[data-ref="nos"]').innerHTML = st.evidenceNos
        .map(function (n, i) {
          return '<div class="l3ship-no-row"><input class="l3ship-input" data-i="' + i + '" value="' + esc(n) + '" placeholder="เช่น EMS123456789TH" aria-label="เลข EMS แถวที่ ' + (i + 1) + '" />' +
            (st.evidenceNos.length > 1 ? '<button type="button" class="l3ship-del" data-act="del-no" data-i="' + i + '" aria-label="ลบเลขแถวที่ ' + (i + 1) + '"><i class="fa-solid fa-trash"></i></button>' : "") +
            "</div>";
        })
        .join("");
    }
    function drawReceipt() {
      q('[data-ref="receipt"]').innerHTML = st.postReceiptFileName
        ? '<div class="l3ship-file-ok-row"><span><i class="fa-solid fa-file-circle-check"></i>' + esc(st.postReceiptFileName) + "</span>" +
          '<button type="button" class="l3ship-del" data-act="del-receipt" aria-label="ลบไฟล์ใบส่งไปรษณีย์"><i class="fa-solid fa-trash"></i></button></div>'
        : "";
      const send = q('[data-act="send"]');
      const ok = !!st.postReceiptFileName;
      send.disabled = !ok;
      send.title = ok ? "" : "กรุณาแนบไฟล์ใบส่งไปรษณีย์";
    }
    function drawExtra() {
      q('[data-ref="extra"]').innerHTML = st.additionalFiles
        .map(function (f, i) {
          return '<div class="l3ship-file-row"><span><i class="fa-solid fa-file-lines"></i>' + esc(f) + "</span>" +
            '<button type="button" class="l3ship-del" data-act="del-extra" data-i="' + i + '" aria-label="ลบไฟล์ ' + esc(f) + '"><i class="fa-solid fa-trash"></i></button></div>';
        })
        .join("");
    }
    drawNos();
    drawReceipt();
    drawExtra();

    function close() {
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      if (trigger && document.body.contains(trigger)) trigger.focus();
      else {
        const again = host.querySelector('[data-ship="open"]');
        if (again) again.focus();
      }
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);

    backdrop.addEventListener("input", function (e) {
      if (e.target.matches('[data-ref="nos"] input')) st.evidenceNos[+e.target.dataset.i] = e.target.value;
    });
    q("#l3ship_receipt").addEventListener("change", function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) st.postReceiptFileName = f.name;
      e.target.value = "";
      drawReceipt();
    });
    q("#l3ship_extra").addEventListener("change", function (e) {
      Array.from(e.target.files || []).forEach(function (f) { st.additionalFiles.push(f.name); });
      e.target.value = "";
      drawExtra();
    });
    backdrop.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "close") return close();
      if (act === "add") {
        st.evidenceNos.push("");
        drawNos();
        const inputs = backdrop.querySelectorAll('[data-ref="nos"] input');
        inputs[inputs.length - 1].focus();
      }
      if (act === "del-no") { st.evidenceNos.splice(+btn.dataset.i, 1); drawNos(); }
      if (act === "del-receipt") { st.postReceiptFileName = ""; drawReceipt(); }
      if (act === "del-extra") { st.additionalFiles.splice(+btn.dataset.i, 1); drawExtra(); }
      if (act === "send" && st.postReceiptFileName) {
        opts.save({
          method: opts.method || q("#l3ship_method").value,
          evidenceNos: st.evidenceNos.map(function (n) { return String(n).trim(); }).filter(Boolean),
          postReceiptFileName: st.postReceiptFileName,
          notes: q("#l3ship_notes").value,
          additionalFiles: st.additionalFiles.slice(),
          savedAt: new Date().toISOString(),
        });
        renderHost(host, opts);
        close();
      }
    });
    (q("#l3ship_method") || q('[data-act="add"]')).focus();
  }

  function mount(hostId, opts) {
    const host = document.getElementById(hostId);
    if (!host) return;
    renderHost(host, opts || {});
  }

  /* ------------------------------------------------------------------ link
     ใช้กับหน้าที่มีตัวเลือกวิธีส่งของตัวเองอยู่แล้ว (ไปรษณีย์ / ส่งด้วยตนเอง ...) — เลือกไปรษณีย์ (EMS) แล้วใช้กล่องนี้
     opts.field     id ช่องเลข EMS เดิม — ซ่อนทั้ง .form-group แล้ววางปุ่ม/สรุปแทนที่ตำแหน่งเดิม
                    เลขแรกในกล่องถูกเขียนกลับลงช่องนี้ โค้ดเดิมของหน้า (ตรวจ/บันทึก/หน้าถัดไป) จึงใช้ต่อได้
     opts.key       ชื่อหลักฐานในเคส → case.shippingEvidence[key]
     opts.getCase() เคสปัจจุบันของหน้า
     opts.active()  true เมื่อหน้าเลือกวิธีส่งทางไปรษณีย์อยู่
     opts.label     หัวข้อ (ค่าเริ่มต้น "หลักฐานการส่ง (ไปรษณีย์ EMS)")
     opts.submit    selector ปุ่มหลักของหน้า — กันกดต่อเมื่อเลือกไปรษณีย์แต่ยังไม่บันทึกหลักฐาน
     opts.optional  true = ไม่บังคับ (ไม่ติด * และไม่กันปุ่มหลัก) — หน้าที่ไม่มีตัวเลือกวิธีส่ง
     opts.readOnly  โหมดดูอย่างเดียว */
  function link(opts) {
    const field = document.getElementById(opts.field);
    if (!field || !global.Activity10 || !opts.getCase()) return null;
    const c0 = global.Activity10.getCaseById(opts.getCase().id) || opts.getCase();
    /* ดูอย่างเดียว + เคสเดิมที่บันทึกก่อนมีกล่องนี้ → คงช่องเลข EMS เดิมไว้ */
    if (opts.readOnly && !(c0.shippingEvidence && c0.shippingEvidence[opts.key])) return null;
    const group = field.closest(".form-group") || field;
    const wrap = document.createElement("div");
    wrap.className = "form-group l3ship-linked";
    const hostId = "l3shipHost_" + opts.key;
    const mark = opts.optional ? ' <span style="font-weight:400;color:#64748b">(ถ้ามี)</span>' : ' <span style="color:#dc2626">*</span>';
    wrap.innerHTML = "<label>" + esc(opts.label || "หลักฐานการส่ง (ไปรษณีย์ EMS)") + mark + '</label><div id="' + hostId + '"></div>';
    group.parentNode.insertBefore(wrap, group.nextSibling);
    group.style.display = "none";

    const read = function () {
      const c = opts.getCase();
      const k = c && global.Activity10.getCaseById(c.id);
      return (k && k.shippingEvidence && k.shippingEvidence[opts.key]) || null;
    };
    const syncField = function (data) {
      const nos = numbersOf(data);
      field.value = data ? nos[0] || "(ดูหลักฐานการส่ง)" : "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };
    mount(hostId, {
      method: "EMS",
      readOnly: opts.readOnly,
      get: read,
      save: function (data) {
        const c = opts.getCase();
        const k = global.Activity10.getCaseById(c.id) || c;
        const all = Object.assign({}, k.shippingEvidence || {});
        all[opts.key] = data;
        global.Activity10.updateCase(c.id, { shippingEvidence: all });
        syncField(data);
      },
    });
    if (read()) syncField(read());

    const sync = function () { wrap.style.display = opts.active() ? "" : "none"; };
    sync();
    document.addEventListener("change", sync, true);

    if (opts.submit && !opts.readOnly && !opts.optional) {
      document.addEventListener("click", function (e) {
        const btn = e.target.closest && e.target.closest(opts.submit);
        if (!btn || !opts.active() || read()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (global.Swal) {
          global.Swal.fire({ icon: "warning", title: "กรุณากรอกหลักฐานการส่ง", text: 'กด "กรอกข้อมูลจัดส่ง" แล้วแนบใบส่งไปรษณีย์ก่อน', confirmButtonColor: "#1e3a8a" });
        }
      }, true);
    }
    return { read: read };
  }

  global.ECMISShipping = { mount: mount, link: link, summaryText: summaryText, methodLabel: methodLabel };
  /* ชื่อเดิม (10-3-23) */
  global.ECMIS103Shipping = global.ECMISShipping;
})(window);
