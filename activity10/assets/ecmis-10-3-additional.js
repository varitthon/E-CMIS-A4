/* ECMIS 10.3 — รับเรื่องเพิ่มเติม (2026-10-22)
   ธุรการ / นิติกร รับเรื่องเพิ่มเติมได้ทุกขั้นของคดีหลักก่อนพิพากษา (สถานะ L3_*) — ไม่กระทบ flow หลัก
   เช่น ศาลสั่งให้ทำคำให้การเพิ่มเติม / คำชี้แจงเพิ่มเติม / อื่น ๆ — นิติกรจัดทำต่อที่ 10-3-add-additional.html
   (บันทึกเสนอ + ร่าง ค.๓ ถ้ามี + หนังสือนำส่งอัยการ → ลงนามจริง → แนบสแกน → ออกเลข → ส่ง) ไม่ผ่าน ผอ. ในระบบ
   ประเภท "คำขอทุเลา" ไม่เก็บเป็นรายการ — สร้างเคสลูก -B ตามสายเดิม (10-3b)
   ข้อมูลอยู่ในเคสหลัก: case.l3AdditionalItems = [{ id, type, typeOther, orderNo, orderDate, dueDate, files[],
     note, recordedBy, recordedRole, recordedAt, status, template, useDraft, docs{}, extraFiles[], send{} }]
   หน้า 10-3-xx โหลดไฟล์นี้แล้วจะมีการ์ด "รับเรื่องเพิ่มเติม" (พับได้) ต่อจากรายละเอียดคดี
   ปุ่มรับเรื่องเปิดหน้า 10-3-add-intake.html?id=&from= (ไม่ใช้ป๊อปอัป — 2026-10-22) */
(function (global) {
  "use strict";

  const PAGE = "10-3-add-additional.html";
  const HOST_ID = "additionalPanel";
  const ADD_ROLES = ["admin_legal", "case_legal_officer"];
  const WORK_ROLE = "case_legal_officer";
  const ALLOWED = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];
  const TYPES = [
    { value: "ANSWER_MORE", label: "ให้ทำคำให้การเพิ่มเติม", draft: "คำให้การเพิ่มเติม" },
    { value: "EXPLAIN_MORE", label: "ให้ทำคำชี้แจงเพิ่มเติม", draft: "คำชี้แจงเพิ่มเติม" },
    { value: "OTHER", label: "อื่น ๆ (ตามคำสั่งศาล)", draft: "คำชี้แจง" },
    { value: "STAY", label: "คำขอทุเลาการบังคับคดี (แยกเป็นเคสลูก -B ตามสายเดิม)", draft: "" },
  ];
  const STATUS = {
    RECEIVED: { label: "รับเรื่องแล้ว — รอนิติกรจัดทำ", cls: "bg-warning text-dark" },
    DRAFTING: { label: "นิติกรกำลังจัดทำ", cls: "bg-primary text-white" },
    SENT: { label: "ส่งอัยการแล้ว", cls: "bg-success text-white" },
  };

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function roleId() {
    try {
      return sessionStorage.getItem("ecmis_role") || "";
    } catch (e) {
      return "";
    }
  }

  function findCase(id) {
    return global.Activity10 ? global.Activity10.getCases().find(function (k) { return k.id === id; }) || null : null;
  }

  function typeOf(value) {
    return TYPES.find(function (t) { return t.value === value; }) || TYPES[2];
  }

  function typeLabel(item) {
    return item.type === "OTHER" && item.typeOther ? "อื่น ๆ — " + item.typeOther : typeOf(item.type).label;
  }

  function itemsOf(c) {
    return (c && c.l3AdditionalItems) || [];
  }

  function getItem(c, itemId) {
    return itemsOf(c).find(function (i) { return i.id === itemId; }) || null;
  }

  /* แทนที่รายการเดียว (ไม่แก้ object เดิม) แล้วบันทึกลงเคส */
  function saveItem(caseId, item) {
    const c = findCase(caseId);
    if (!c) return null;
    const list = itemsOf(c).slice();
    const i = list.findIndex(function (x) { return x.id === item.id; });
    if (i >= 0) list[i] = item;
    else list.push(item);
    global.Activity10.updateCase(caseId, { l3AdditionalItems: list });
    return item;
  }

  function thaiDate(iso) {
    return iso && global.ECMIS103 ? global.ECMIS103.formatThaiDate(String(iso).slice(0, 10)) : iso || "-";
  }

  function nowThai() {
    return global.ECMIS103 ? global.ECMIS103.formatThaiDateTime(new Date()) : new Date().toISOString();
  }

  function signerLabel(role) {
    return global.ECMIS103 ? global.ECMIS103.signerLabel(role) : role;
  }

  /* ก่อนพิพากษา = เคสหลักที่สถานะยังเป็น L3_* (ไม่ใช่เคสลูกทุเลา / เคสคำพิพากษา) */
  function eligible(c) {
    const A3 = global.Activity103;
    if (!c || !A3) return false;
    if (A3.isStayObjectionCase(c) || A3.isVerdictCase(c)) return false;
    return /^L3_/.test(c.statusCode || "");
  }

  function pageUrl(c, item, view) {
    return PAGE + "?id=" + encodeURIComponent(c.id) + "&item=" + encodeURIComponent(item.id) + (view ? "&view=1" : "");
  }

  /* ---------------------------------------------------------------- ฟอร์มรับเรื่องเพิ่มเติม (หน้า 10-3-add-intake) */
  function formHTML() {
    const opts = TYPES.map(function (t) { return '<option value="' + t.value + '">' + esc(t.label) + "</option>"; }).join("");
    return (
      '<div style="text-align:left">' +
      '<div class="form-group"><label for="ad_type">ประเภทเรื่อง <span style="color:#dc2626">*</span></label>' +
      '<select id="ad_type" class="form-control">' + opts + "</select></div>" +
      '<div class="form-group" id="ad_otherGroup" hidden><label for="ad_typeOther">ระบุ <span style="color:#dc2626">*</span></label>' +
      '<input type="text" id="ad_typeOther" class="form-control" placeholder="เช่น ให้ส่งพยานหลักฐานเพิ่มเติม" /></div>' +
      '<div class="form-grid-2">' +
      '<div class="form-group"><label for="ad_orderNo">เลขที่หนังสือ / คำสั่งศาล <span style="color:#dc2626">*</span></label>' +
      '<input type="text" id="ad_orderNo" class="form-control" placeholder="เช่น อส 0047.1/1010" /></div>' +
      '<div class="form-group"><label for="ad_orderDate">ลงวันที่</label>' +
      '<input type="date" id="ad_orderDate" class="form-control" lang="th-TH-u-ca-buddhist" /></div>' +
      "</div>" +
      '<div class="form-group"><label for="ad_dueDate">ครบกำหนดส่ง <span style="color:#dc2626">*</span></label>' +
      '<input type="date" id="ad_dueDate" class="form-control" lang="th-TH-u-ca-buddhist" /></div>' +
      '<div class="form-group"><label for="ad_files">แนบหนังสือ / คำสั่งศาล <span style="color:#dc2626">*</span></label>' +
      '<input type="file" id="ad_files" class="form-control" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />' +
      '<div id="ad_fileList" style="margin-top:6px"></div></div>' +
      '<div class="form-group"><label for="ad_note">หมายเหตุ</label>' +
      '<textarea id="ad_note" class="form-control" rows="2"></textarea></div>' +
      /* ช่องข้อมูลที่ผู้ใช้เพิ่มเอง (ไม่บังคับ) — ชื่อช่อง | ข้อมูล */
      '<div class="form-group" style="margin-bottom:0"><label>ช่องข้อมูลเพิ่มเติม <span class="l3-optional">(ถ้ามี)</span></label>' +
      '<div id="ad_extraFields"></div>' +
      '<button type="button" class="btn btn-secondary" id="ad_addField" style="margin-top:6px"><i class="fa-solid fa-plus me-1"></i>เพิ่มช่องข้อมูล</button></div>' +
      "</div>"
    );
  }

  function extraFieldRow() {
    return (
      '<div class="ad-xf-row" style="display:flex;gap:8px;margin-bottom:6px">' +
      '<input type="text" class="form-control ad-xf-label" style="flex:0 0 38%" placeholder="ชื่อช่อง เช่น เลขรับ" aria-label="ชื่อช่องข้อมูล" />' +
      '<input type="text" class="form-control ad-xf-value" style="flex:1" placeholder="ข้อมูล" aria-label="ข้อมูล" />' +
      '<button type="button" class="btn btn-secondary ad-xf-rm" style="height:38px;padding:0 10px" aria-label="ลบช่องนี้"><i class="fa-solid fa-trash-can"></i></button>' +
      "</div>"
    );
  }

  /* แสดงช่องที่ผู้ใช้เพิ่มเอง (อ่านอย่างเดียว) */
  function extraFieldsHTML(list) {
    const rows = (list || []).filter(function (f) { return f && (f.label || f.value); });
    if (!rows.length) return '<div class="read-box l3-optional">-</div>';
    return '<div class="form-grid-2">' + rows.map(function (f) {
      return '<div class="form-group"><label>' + esc(f.label) + '</label><div class="read-box">' + (esc(f.value) || "-") + "</div></div>";
    }).join("") + "</div>";
  }

  /* ผูกช่องในฟอร์ม (หน้า 10-3-add-intake) — files = อาร์เรย์ชื่อไฟล์ที่แก้ตามที่ผู้ใช้แนบ/ลบ */
  function wireForm(files) {
    const drawFiles = function () {
      document.getElementById("ad_fileList").innerHTML = files
        .map(function (n, i) {
          return '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' + esc(n) +
            '</div><button type="button" class="btn btn-secondary" style="height:26px;padding:0 8px;font-size:0.8em" data-rm="' + i + '" aria-label="ลบไฟล์ ' + esc(n) + '"><i class="fa-solid fa-trash-can"></i></button></div>';
        })
        .join("");
    };
    const type = document.getElementById("ad_type");
    type.addEventListener("change", function () {
      document.getElementById("ad_otherGroup").hidden = type.value !== "OTHER";
    });
    const input = document.getElementById("ad_files");
    input.addEventListener("change", function () {
      Array.from(input.files || []).forEach(function (f) {
        const ext = f.name.split(".").pop().toLowerCase();
        if (ALLOWED.indexOf(ext) >= 0 && files.indexOf(f.name) < 0) files.push(f.name);
      });
      input.value = "";
      drawFiles();
    });
    document.getElementById("ad_fileList").addEventListener("click", function (e) {
      const b = e.target.closest("[data-rm]");
      if (!b) return;
      files.splice(+b.getAttribute("data-rm"), 1);
      drawFiles();
    });
    const extra = document.getElementById("ad_extraFields");
    document.getElementById("ad_addField").addEventListener("click", function () {
      extra.insertAdjacentHTML("beforeend", extraFieldRow());
      const rows = extra.querySelectorAll(".ad-xf-label");
      rows[rows.length - 1].focus();
    });
    extra.addEventListener("click", function (e) {
      const b = e.target.closest(".ad-xf-rm");
      if (b) b.closest(".ad-xf-row").remove();
    });
  }

  function readExtraFields() {
    return Array.from(document.querySelectorAll("#ad_extraFields .ad-xf-row"))
      .map(function (r) {
        return { label: r.querySelector(".ad-xf-label").value.trim(), value: r.querySelector(".ad-xf-value").value.trim() };
      })
      .filter(function (f) { return f.label || f.value; });
  }

  /* คืน { msg } เมื่อข้อมูลไม่ครบ หรือ { value } */
  function readForm(files) {
    const v = function (id) { return document.getElementById(id).value.trim(); };
    const type = v("ad_type");
    let msg = "";
    if (type === "OTHER" && !v("ad_typeOther")) msg = "กรุณาระบุประเภทเรื่อง (อื่น ๆ)";
    else if (!v("ad_orderNo")) msg = "กรุณาระบุเลขที่หนังสือ / คำสั่งศาล";
    else if (!v("ad_dueDate")) msg = "กรุณาระบุวันครบกำหนดส่ง";
    else if (!files.length) msg = "กรุณาแนบหนังสือ / คำสั่งศาลอย่างน้อย 1 ไฟล์";
    const extraFields = readExtraFields();
    if (!msg && extraFields.some(function (f) { return !f.label; })) msg = "กรุณาระบุชื่อช่องของข้อมูลเพิ่มเติม";
    if (msg) return { msg: msg };
    return {
      value: {
        type: type,
        typeOther: v("ad_typeOther"),
        orderNo: v("ad_orderNo"),
        orderDate: v("ad_orderDate"),
        dueDate: v("ad_dueDate"),
        note: v("ad_note"),
        files: files.slice(),
        extraFields: extraFields,
      },
    };
  }

  function commitNew(c, value) {
    if (value.type === "STAY") return addStay(c, value);
    {
      const item = Object.assign({}, value, {
        id: "ADD-" + Date.now(),
        recordedBy: signerLabel(roleId()),
        recordedRole: roleId(),
        recordedAt: nowThai(),
        status: "RECEIVED",
        template: "4",
        useDraft: true,
        docs: {},
        extraFiles: [],
        send: null,
      });
      saveItem(c.id, item);
      global.Swal.fire({
        icon: "success",
        title: "รับเรื่องเพิ่มเติมแล้ว",
        text: "ส่งนิติกรเจ้าของสำนวนจัดทำต่อ — คดีหลักดำเนินต่อที่ขั้นตอนเดิม",
        timer: 1800,
        showConfirmButton: false,
      }).then(function () { location.reload(); });
    }
  }

  /* ประเภททุเลา: บันทึกหมายศาลลงเคสหลักแล้วสร้างเคสลูก -B (สายเดิม 10-3b) */
  function addStay(c, v) {
    const A10 = global.Activity10;
    A10.updateCase(c.id, {
      l3HasStayRequest: true,
      l3HasStayObjectionSummons: true,
      stayObjectionFileNames: (c.stayObjectionFileNames || []).concat(v.files),
      l3StayDueDate: v.dueDate,
    });
    const kid = global.Activity103.spawnStayObjectionCase(findCase(c.id));
    if (kid) A10.updateCase(kid.id, { l3StayDueDate: v.dueDate });
    global.Swal.fire({
      icon: "success",
      title: "สร้างเรื่องคำชี้แจงคัดค้านแล้ว",
      text: "เคสลูก " + (kid ? kid.id : "-") + " — ส่งนิติกรจัดทำคำชี้แจงคัดค้าน (สายคำขอทุเลาเดิม)",
      timer: 2000,
      showConfirmButton: false,
    }).then(function () { location.reload(); });
  }

  /* ---------------------------------------------------------------- การ์ดบนหน้า 10-3-xx */
  function rowHTML(c, item) {
    const st = STATUS[item.status] || STATUS.RECEIVED;
    const canWork = roleId() === WORK_ROLE;
    const open = canWork && item.status !== "SENT"
      ? '<a class="btn btn-primary" style="height:30px;font-size:0.82em" href="' + pageUrl(c, item, false) + '"><i class="fa-solid fa-pen-to-square me-1"></i>จัดทำ</a>'
      : '<a class="btn btn-secondary" style="height:30px;font-size:0.82em" href="' + pageUrl(c, item, true) + '"><i class="fa-solid fa-eye me-1"></i>ดู</a>';
    return (
      '<div class="l3-attachment-row" style="align-items:center;gap:10px">' +
      '<div style="flex:1;min-width:0"><div style="font-weight:600">' + esc(typeLabel(item)) + "</div>" +
      '<div style="font-size:0.82em;color:#64748b">เลขที่ ' + esc(item.orderNo) + " · ครบกำหนด " + esc(thaiDate(item.dueDate)) +
      " · รับเมื่อ " + esc(item.recordedAt) + "</div></div>" +
      '<span class="badge ' + st.cls + '">' + esc(st.label) + "</span>" + open + "</div>"
    );
  }

  function panelHTML(c) {
    const items = itemsOf(c);
    const canAdd = ADD_ROLES.indexOf(roleId()) >= 0 && !isReadOnly();
    return (
      '<div class="form-card-body">' +
      '<div class="l3-note l3-note-info" style="margin-bottom:12px"><i class="fa-solid fa-circle-info"></i><div>' +
      "รับเรื่องเพิ่มเติมได้ทุกขั้นตอนก่อนพิพากษา (เช่น ศาลให้ทำคำให้การ / คำชี้แจงเพิ่มเติม) — นิติกรจัดทำต่อ " +
      "ไม่ต้องผ่าน ผอ.กอง/กลุ่มในระบบ และไม่กระทบขั้นตอนของคดีหลัก</div></div>" +
      (items.length
        ? items.map(function (i) { return rowHTML(c, i); }).join("")
        : '<div class="read-box">ยังไม่มีเรื่องเพิ่มเติม</div>') +
      /* รับเรื่องใหม่ที่หน้า 10-3-add-intake (ไม่ใช้ป๊อปอัป) — from = หน้าเดิม ใช้กับปุ่ม "กลับ" */
      (canAdd
        ? '<div style="display:flex;justify-content:flex-end;margin-top:12px"><a class="btn btn-primary" id="btnAddAdditional" href="' +
          intakeUrl(c, location.pathname.split("/").pop()) + '"><i class="fa-solid fa-plus me-1"></i>รับเรื่องเพิ่มเติม</a></div>'
        : "") +
      "</div>"
    );
  }

  function isReadOnly() {
    let flag = false;
    try {
      flag = typeof viewOnly !== "undefined" && !!viewOnly;
    } catch (e) {
      flag = false;
    }
    return new URLSearchParams(location.search).get("view") === "1" || flag;
  }

  function pageCase() {
    let c = null;
    try {
      c = typeof currentCase !== "undefined" ? currentCase : null;
    } catch (e) {
      c = null;
    }
    return c ? findCase(c.id) : null;
  }

  function anchor() {
    const stay = document.getElementById("stayEditPanel");
    if (stay) return { el: stay.closest("details.prev-step") || stay, where: "afterend" };
    const court = document.getElementById("f_courtName");
    const card = court && court.closest(".form-card");
    if (card) return { el: card.closest("details.prev-step") || card, where: "afterend" };
    const cur = document.querySelector("[data-prev-step-current]");
    if (cur) return { el: cur.closest("details.prev-step") || cur, where: "beforebegin" };
    return null;
  }

  function mount() {
    if (document.getElementById(HOST_ID) || location.pathname.indexOf(PAGE) >= 0) return;
    const c = pageCase();
    if (!eligible(c)) return;
    const at = anchor();
    if (!at) return;
    const items = itemsOf(c);
    const open = items.filter(function (i) { return i.status !== "SENT"; }).length;
    const card = document.createElement("div");
    card.className = "form-card";
    card.id = HOST_ID;
    card.setAttribute("data-prev-step", "รับเรื่องเพิ่มเติม");
    card.setAttribute("data-prev-step-hide-head", "");
    card.setAttribute("data-prev-step-hint", items.length ? items.length + " เรื่อง" + (open ? " · ค้าง " + open : "") : "เพิ่มได้ทุกขั้นตอน");
    card.innerHTML = panelHTML(c);
    at.el.insertAdjacentElement(at.where, card);
  }

  function intakeUrl(c, from) {
    return INTAKE_PAGE + "?id=" + encodeURIComponent(c.id) + (from ? "&from=" + encodeURIComponent(from) : "");
  }

  /* ---------------------------------------------------------------- กล่องงาน (01-work-inbox)
     สถานะ "ส่งคำให้การแล้ว รอศาลปกครองมีคำพิพากษา" ไม่มีหน้า 10-3 เปิดให้ — ใช้ปุ่มในแถวกล่องงาน
     เปิดหน้า 10-3-add-intake.html (รายการเรื่องเพิ่มเติม + ฟอร์มรับเรื่อง ธุรการ / นิติกร) */
  const WAIT_STATUS = "L3_AWAITING_JUDGMENT";
  const INTAKE_PAGE = "10-3-add-intake.html";

  function inboxButton(row, role) {
    if (!row || row.statusCode !== WAIT_STATUS || ADD_ROLES.indexOf(role) < 0) return "";
    const c = findCase(row.id || row.caseNo);
    if (!eligible(c)) return "";
    const n = itemsOf(c).length;
    return (
      '<a class="btn-action-primary" style="margin:0;background:#fff;color:#1e3a8a;border:1px solid #1e3a8a;text-decoration:none;' +
      'display:inline-flex;align-items:center;gap:4px;vertical-align:middle" ' +
      'href="' + intakeUrl(c, "01-work-inbox.html") + '" title="รับเรื่องเพิ่มเติม (ไม่กระทบสถานะคดี)">' +
      '<i class="fa-solid fa-folder-plus me-1"></i>รับเรื่องเพิ่มเติม' + (n ? " (" + n + ")" : "") + "</a>"
    );
  }

  /* ---------------------------------------------------------------- หน้า 10-3-add-intake.html */
  function intakeListHTML(c) {
    const items = itemsOf(c);
    return items.length
      ? items.map(function (i) { return rowHTML(c, i); }).join("")
      : '<div class="read-box">ยังไม่มีเรื่องเพิ่มเติม</div>';
  }

  function mountIntakePage() {
    const E = global.ECMIS103;
    E.initUserProfile();
    E.renderSidebarMenu("sidebarMenu", INTAKE_PAGE);
    const q = new URLSearchParams(location.search);
    const c = findCase(q.get("id") || "");
    /* ปุ่มกลับ: หน้าเดิมที่เปิดมา (ชื่อไฟล์ .html ในโฟลเดอร์เดียวกันเท่านั้น) — ไม่มีก็กลับกล่องงาน */
    const from = q.get("from") || "";
    const back = document.getElementById("btnIntakeBack");
    if (back && /^[\w.-]+\.html$/.test(from)) {
      back.href = from === "01-work-inbox.html" ? from : from + "?id=" + encodeURIComponent(q.get("id") || "");
      back.textContent = from === "01-work-inbox.html" ? "กลับกล่องงาน" : "กลับหน้าคดี";
    }
    if (!c || !eligible(c)) {
      document.getElementById("noCaseNotice").classList.remove("d-none");
      document.getElementById("pageBody").classList.add("d-none");
      return;
    }
    E.setText("f_caseNo", c.id);
    E.setText("f_courtName", c.courtName);
    E.setText("f_blackCaseNo", c.blackCaseNo);
    E.renderPartyList("f_plaintiffs", c.plaintiffs);
    E.renderPartyList("f_defendants", c.defendants);
    E.setText("f_mainStatus", c.status);
    E.setText("f_officer", c.l3GroupAssignTarget || c.officer);
    E.setText("f_headCase", c.id);
    E.setText("f_headCount", itemsOf(c).length + " เรื่อง");
    document.getElementById("itemList").innerHTML = intakeListHTML(c);
    const canAdd = ADD_ROLES.indexOf(roleId()) >= 0;
    document.getElementById("addCard").classList.toggle("d-none", !canAdd);
    document.getElementById("btnSaveIntake").classList.toggle("d-none", !canAdd);
    if (!canAdd) return;
    document.getElementById("intakeForm").innerHTML = formHTML();
    const files = [];
    wireForm(files);
    document.getElementById("btnSaveIntake").addEventListener("click", function () {
      const r = readForm(files);
      if (r.msg) return global.Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบถ้วน", text: r.msg, confirmButtonColor: "#1e3a8a" });
      commitNew(findCase(c.id), r.value);
    });
  }

  /* รอ stay-edit วางการ์ดก่อน (เรียงต่อกัน) — หน้า 10-3 โหลดเคสใน DOMContentLoaded */
  const start = function () {
    if (location.pathname.indexOf(INTAKE_PAGE) >= 0) mountIntakePage();
    else setTimeout(mount, 30);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  global.ECMIS103Additional = {
    PAGE: PAGE,
    TYPES: TYPES,
    STATUS: STATUS,
    typeOf: typeOf,
    typeLabel: typeLabel,
    itemsOf: itemsOf,
    getItem: getItem,
    saveItem: saveItem,
    eligible: eligible,
    findCase: findCase,
    extraFieldsHTML: extraFieldsHTML,
    mount: mount,
    inboxButton: inboxButton,
  };
})(window);
