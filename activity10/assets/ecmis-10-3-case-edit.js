/* ecmis-10-3-case-edit.js
   แก้ไขรายละเอียดคดีปกครองได้ทันทีในการ์ด "รายละเอียดคดีปกครอง" (ไม่ต้องกดปุ่มแก้ไข / ไม่มี popup)
   - ข้อความแนะนำใต้หัวการ์ดบอกว่าแก้ไขได้ (ช่องกรอกในส่วนการรับเรื่อง/ข้อมูลคดี)
   - แก้แล้วช่องจะถูกไฮไลต์ และแถบ "บันทึก / ยกเลิก" แสดงขึ้น (ซ่อนเมื่อไม่มีการเปลี่ยนแปลง)
   - การ์ดนี้เปิดไว้เสมอ (ไม่พับเป็นขั้นตอนก่อนหน้า) เพราะเป็นช่องกรอกของหน้านั้น
   ใช้กติกาบันทึกเดิม (เคสแม่ + เคสลูกทุเลา + ประวัติสถานะ)
   การใช้งาน: ECMIS103CaseEdit.mount({ getCase: () => currentCase, onSaved: (c) => { currentCase = c; } }); */
(function (global) {
  "use strict";

  var COURT_OPTIONS = [
    "ศาลปกครองสูงสุด", "ศาลปกครองกลาง", "ศาลปกครองเชียงใหม่", "ศาลปกครองสงขลา",
    "ศาลปกครองนครราชสีมา", "ศาลปกครองขอนแก่น", "ศาลปกครองพิษณุโลก", "ศาลปกครองระยอง",
    "ศาลปกครองนครศรีธรรมราช", "ศาลปกครองอุดรธานี", "ศาลปกครองอุบลราชธานี",
    "ศาลปกครองเพชรบุรี", "ศาลปกครองนครสวรรค์", "ศาลปกครองสุพรรณบุรี",
    "ศาลปกครองภูเก็ต", "ศาลปกครองยะลา", "อื่นๆ",
  ];
  var SUMMONS_OPTIONS = ["คำสั่งเรียกให้ทำคำให้การ", "คำสั่งเรียกให้ทำคำชี้แจง"];
  var ORDERED_TO_OPTIONS = [
    "คณะกรรมการ ป.ป.ท.", "เลขาธิการคณะกรรมการ ป.ป.ท.", "สำนักงาน ป.ป.ท.",
  ];
  var FORM_ID = "ceInlineForm";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function selectHtml(id, options, value) {
    var list = options.slice();
    if (value && list.indexOf(value) === -1) list.push(value);
    if (!value) list.unshift("");
    return (
      '<select id="' + id + '" class="form-control">' +
      list.map(function (v) {
        return '<option value="' + esc(v) + '"' + (v === value ? " selected" : "") + ">" + esc(v || "-- เลือก --") + "</option>";
      }).join("") + "</select>"
    );
  }

  function codeSelectHtml(id, list, value) {
    return (
      '<select id="' + id + '" class="form-control">' +
      list.map(function (s) {
        return '<option value="' + esc(s.code) + '"' + (s.code === value ? " selected" : "") + ">" + esc(s.name) + "</option>";
      }).join("") + "</select>"
    );
  }

  function input(id, value, type, extra) {
    return '<input type="' + (type || "text") + '" id="' + id + '" class="form-control" value="' + esc(value) + '" ' + (extra || "") + " />";
  }

  function textarea(id, value, rows) {
    return '<textarea id="' + id + '" class="form-control" rows="' + rows + '">' + esc(value) + "</textarea>";
  }

  /* ช่องแก้ไขได้ */
  function field(label, control, required, wide) {
    return (
      '<div class="form-group ce-field"' + (wide ? ' style="grid-column: 1 / -1"' : "") + "><label>" +
      '<span>' + label + (required ? ' <span style="color:#dc2626">*</span>' : "") + "</span></label>" +
      control + "</div>"
    );
  }

  function readOnlyBlock(label, html) {
    return '<div class="form-group" style="grid-column: 1 / -1"><label>' + label + "</label>" + html + "</div>";
  }

  /* คดีแม่ที่เก็บข้อมูลรับเรื่องครบทุกช่อง (เคสลูก Part 1b คัดลอกมาเพียงบางช่อง) */
  function sourceRecord(cur) {
    if (cur && cur.l3ParentCaseId) {
      var parent = global.Activity10.getCaseById(cur.l3ParentCaseId);
      if (parent) return parent;
    }
    return cur;
  }

  function fileRows(files) {
    return (files || []).map(function (f) {
      var name = typeof f === "string" ? f : f.name;
      var href = typeof f === "string" ? "" : f.href;
      return (
        '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2" aria-hidden="true"></i>' +
        esc(name) + "</div>" +
        (href
          ? '<button type="button" class="btn btn-secondary" style="height: 28px; padding: 0 10px; font-size: 0.8em" data-href="' +
            esc(href) + '" onclick="window.open(encodeURI(this.dataset.href), \'_blank\', \'noopener\')"><i class="fa-solid fa-eye me-1" aria-hidden="true"></i>เปิดดู</button>'
          : "") +
        "</div>"
      );
    }).join("") || '<div class="read-box l3-optional">-</div>';
  }

  function section(title, inner) {
    return '<div class="l3-case-extra-title">' + title + '</div><div class="form-grid-2">' + inner + "</div>";
  }

  function buildForm(c, cur) {
    var st = global.Activity103.effectiveStatus(cur);
    var fiscalValue = c.fiscalYear || global.Activity10.fiscalYearOf(c.courtReceivedDate) || "";
    var lines = function (a) { return (a || []).join("\n"); };
    var intake = section("การรับเรื่อง",
      field("เลขสารบรรณ", input("ce_centralSarabanNo", c.centralSarabanNo)) +
      field("วันที่รับเอกสาร", input("ce_physicalDocDate", c.physicalDocDate, "date")) +
      field("วันที่สารบรรณรับเรื่อง", input("ce_courtReceivedDate", c.courtReceivedDate, "date"), true) +
      field("เลขรับ (สารบรรณ)", input("ce_courtSarabanNo", c.courtSarabanNo)) +
      field("วันที่ประธานกรรมการ ป.ป.ท. รับเรื่อง", input("ce_chairReceivedDate", c.chairReceivedDate, "date")) +
      field("เลขรับ (ประธานกรรมการ ป.ป.ท.)", input("ce_chairReceiveNo", c.chairReceiveNo)) +
      field("ปีงบประมาณที่รับเรื่อง", input("ce_fiscalYear", fiscalValue, "number", 'min="2500" max="2700" step="1"')) +
      field("หน่วยงานที่รับเรื่อง", input("ce_receivingUnit", c.receivingUnit)) +
      field("เลขรับกองกฎหมาย", input("ce_lawReceiveNo", c.lawReceiveNo)) +
      readOnlyBlock("เลขสำนวนเรื่องที่ (จากค้นหาสำนวน)", '<div class="read-box">' + esc(c.paccCaseNo || "-") + "</div>")
    );
    var detail = section("ข้อมูลคดี",
      field("ชื่อหมาย", selectHtml("ce_summonsName", SUMMONS_OPTIONS, c.summonsName), true) +
      field("ศาล", selectHtml("ce_courtName", COURT_OPTIONS, c.courtName), true) +
      field("สั่งถึง", selectHtml("ce_orderedTo", ORDERED_TO_OPTIONS, c.orderedTo), true) +
      field("หมายเลขคดีดำ", input("ce_blackCaseNo", c.blackCaseNo), true) +
      field("หมายเลขคดีแดง", input("ce_redCaseNo", c.redCaseNo)) +
      field("ศาลให้ทำภายใน .... วัน (เวลาที่ศาลสั่ง)", input("ce_courtDeadlineDays", c.courtDeadlineDays, "number", 'min="1" step="1"'), true) +
      field("ผู้ฟ้องคดี (บรรทัดละ 1 ราย)", textarea("ce_plaintiffs", lines(c.plaintiffs), 3), true) +
      field("ผู้ถูกฟ้องคดี (บรรทัดละ 1 ราย)", textarea("ce_defendants", lines(c.defendants), 3), true) +
      field("ผู้ร้องสอด (บรรทัดละ 1 ราย)", textarea("ce_intervenors", lines(c.intervenors), 2), false, true) +
      field("มูลเหตุแห่งการฟ้องคดี", textarea("ce_causeOfSuit", c.causeOfSuit, 3), false, true) +
      field("ประเภทการดำเนินการ (สถานะ)", codeSelectHtml("ce_opStatusType", global.Activity10.L3_OP_STATUS, st.opStatusType) +
        input("ce_opStatusOther", st.opStatusOther, "text", 'placeholder="ระบุ (กรณีเลือกอื่นๆ)" style="margin-top:6px"')) +
      field("สถานะทางคดี", codeSelectHtml("ce_caseStatus", global.Activity10.L3_CASE_STATUS, st.caseStatus) +
        input("ce_caseStatusOther", st.caseStatusOther, "text", 'placeholder="ระบุ (กรณีเลือกอื่นๆ)" style="margin-top:6px"')) +
      field("หมายเหตุ", textarea("ce_courtRemark", c.courtRemark, 2), false, true)
    );
    var docs = section("เอกสาร (ดูอย่างเดียว)",
      readOnlyBlock("เอกสารแนบ", fileRows(c.attachmentFileNames)) +
      (c.l3HasStayObjectionSummons
        ? readOnlyBlock("หมายศาลแจ้งให้ทำคำคัดค้านคำขอทุเลา", fileRows(c.stayObjectionFileNames))
        : "") +
      readOnlyBlock("เอกสารจากสำนวนเดิม (ค้นหาสำนวน)", fileRows(c.paccFiles))
    );
    return (
      '<div class="ce-hint" role="note"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>' +
      "<span><b>แก้ไขได้:</b> ช่องในส่วน การรับเรื่อง และ ข้อมูลคดี แก้ไขได้ทันที เมื่อแก้ไขแล้วกด <b>บันทึก</b> ด้านล่าง</span></div>" +
      intake + detail + docs +
      '<div class="ce-actions" id="ceActions" hidden>' +
      '<span class="ce-actions-note"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> มีการแก้ไขที่ยังไม่บันทึก</span>' +
      '<button type="button" class="btn btn-secondary" id="ceCancelBtn"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ยกเลิก</button>' +
      '<button type="button" class="btn btn-primary" id="ceSaveBtn"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> บันทึก</button>' +
      "</div>"
    );
  }

  function readForm() {
    var v = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };
    var lines = function (id) {
      return v(id).split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    };
    return {
      centralSarabanNo: v("ce_centralSarabanNo"),
      physicalDocDate: v("ce_physicalDocDate"),
      courtReceivedDate: v("ce_courtReceivedDate"),
      courtSarabanNo: v("ce_courtSarabanNo"),
      chairReceivedDate: v("ce_chairReceivedDate"),
      chairReceiveNo: v("ce_chairReceiveNo"),
      fiscalYear: v("ce_fiscalYear"),
      receivingUnit: v("ce_receivingUnit"),
      lawReceiveNo: v("ce_lawReceiveNo"),
      summonsName: v("ce_summonsName"),
      courtName: v("ce_courtName"),
      orderedTo: v("ce_orderedTo"),
      blackCaseNo: v("ce_blackCaseNo"),
      redCaseNo: v("ce_redCaseNo"),
      courtDeadlineDays: v("ce_courtDeadlineDays"),
      plaintiffs: lines("ce_plaintiffs"),
      defendants: lines("ce_defendants"),
      intervenors: lines("ce_intervenors"),
      causeOfSuit: v("ce_causeOfSuit"),
      courtRemark: v("ce_courtRemark"),
      courtLevel: v("ce_courtName") === "ศาลปกครองสูงสุด" ? "SUPREME" : "FIRST",
      opStatusType: v("ce_opStatusType"),
      opStatusOther: v("ce_opStatusType") === "OTHER" ? v("ce_opStatusOther") : "",
      caseStatus: v("ce_caseStatus"),
      caseStatusOther: v("ce_caseStatus") === "OTHER" ? v("ce_caseStatusOther") : "",
    };
  }

  /* คืน [ข้อความ, id ช่อง] ของข้อแรกที่ไม่ผ่าน */
  function validate(d) {
    var checks = [
      [d.courtReceivedDate, "กรุณาระบุวันที่สารบรรณรับเรื่อง", "ce_courtReceivedDate"],
      [d.summonsName, "กรุณาเลือกชื่อหมาย", "ce_summonsName"],
      [d.courtName, "กรุณาเลือกศาล", "ce_courtName"],
      [d.orderedTo, "กรุณาเลือกสั่งถึง", "ce_orderedTo"],
      [d.blackCaseNo, "กรุณาระบุหมายเลขคดีดำ", "ce_blackCaseNo"],
      [d.courtDeadlineDays, "กรุณาระบุจำนวนวันที่ศาลให้ทำ", "ce_courtDeadlineDays"],
      [d.plaintiffs.length ? "1" : "", "กรุณาระบุชื่อผู้ฟ้องคดีอย่างน้อย 1 ราย", "ce_plaintiffs"],
      [d.defendants.length ? "1" : "", "กรุณาระบุผู้ถูกฟ้องคดีอย่างน้อย 1 ราย", "ce_defendants"],
      [d.opStatusType !== "OTHER" || d.opStatusOther ? "1" : "", "กรุณาระบุการดำเนินการ (อื่นๆ)", "ce_opStatusOther"],
      [d.caseStatus !== "OTHER" || d.caseStatusOther ? "1" : "", "กรุณาระบุสถานะทางคดี (อื่นๆ)", "ce_caseStatusOther"],
    ];
    for (var i = 0; i < checks.length; i++) {
      if (!checks[i][0]) return [checks[i][1], checks[i][2]];
    }
    return null;
  }

  /* บันทึกทั้งเคสแม่และเคสลูกทุเลา (ถ้ามี) เพื่อไม่ให้ข้อมูลสองฝั่งไม่ตรงกัน */
  function save(cur, d) {
    var A = global.Activity10;
    var rec = sourceRecord(cur);
    var joined = function (a) { return a.join(", ") || "-"; };
    var statusChange = global.Activity103.buildStatusChange(cur, {
      opStatusType: d.opStatusType,
      opStatusOther: d.opStatusOther,
      caseStatus: d.caseStatus,
      caseStatusOther: d.caseStatusOther,
    }, global.ECMIS103.signerLabel(global.ECMIS103.currentRoleId()));
    if (statusChange) A.updateCase(cur.id, statusChange);
    A.updateCase(rec.id, {
      centralSarabanNo: d.centralSarabanNo,
      physicalDocDate: d.physicalDocDate,
      courtReceivedDate: d.courtReceivedDate,
      courtSarabanNo: d.courtSarabanNo,
      chairReceivedDate: d.chairReceivedDate,
      chairReceiveNo: d.chairReceiveNo,
      fiscalYear: d.fiscalYear,
      receivingUnit: d.receivingUnit,
      lawReceiveNo: d.lawReceiveNo,
      summonsName: d.summonsName,
      courtName: d.courtName,
      orderedTo: d.orderedTo,
      blackCaseNo: d.blackCaseNo,
      redCaseNo: d.redCaseNo,
      courtDeadlineDays: d.courtDeadlineDays,
      courtRemark: d.courtRemark,
      courtLevel: d.courtLevel,
      courtLevelName: A.courtLevelName(d.courtLevel),
      intervenors: d.intervenors,
      causeOfSuit: d.causeOfSuit,
      plaintiffs: d.plaintiffs,
      defendants: d.defendants,
      accuser: joined(d.plaintiffs),
      accused: joined(d.defendants),
      title: joined(d.plaintiffs) + " (ผู้ฟ้องคดี) ยื่นฟ้อง " + joined(d.defendants) + " (ผู้ถูกฟ้องคดี)",
      l3DetailEditedAt: new Date().toISOString(),
    });
    var childId = rec.id.replace(/\/(\d{4})$/, "-B/$1");
    var child = childId !== rec.id ? A.getCaseById(childId) : null;
    if (child) {
      A.updateCase(child.id, {
        courtName: d.courtName,
        blackCaseNo: d.blackCaseNo,
        redCaseNo: d.redCaseNo,
        orderedTo: d.orderedTo,
        plaintiffs: d.plaintiffs,
        defendants: d.defendants,
        title: "คำขอทุเลาการบังคับคดี — " + d.courtName + " (เกี่ยวข้องกับ " + d.blackCaseNo + ")",
      });
    }
    return A.getCaseById(cur.id);
  }

  /* อัปเดตช่องอ่านอย่างเดียวที่หน้านั้นใช้ (ซ่อนไว้ แต่โค้ดของหน้าอาจอ่านค่า) และแผงสถานะ */
  function refreshReadOnly(c) {
    var E = global.ECMIS103;
    ["summonsName", "courtName", "orderedTo", "blackCaseNo", "redCaseNo", "courtDeadlineDays",
      "courtReceivedDate", "courtSarabanNo", "courtRemark"].forEach(function (k) {
      if (document.getElementById("f_" + k)) E.setText("f_" + k, c[k]);
    });
    if (document.getElementById("l3StatusPanel")) E.renderStatusPanel("l3StatusPanel", c.id, {});
  }

  /* การ์ดนี้เป็นช่องกรอกของหน้า ⇒ เอาออกจากกล่องพับ "ขั้นตอนก่อนหน้า" และไม่ให้ถูกห่ออีก */
  function keepCardOpen(card) {
    card.removeAttribute("data-prev-step");
    var body = card.parentNode;
    if (body && body.classList && body.classList.contains("prev-step-body")) {
      var box = body.parentNode;
      box.parentNode.insertBefore(card, box);
      box.remove();
    }
  }

  function syncOtherInputs() {
    [["ce_opStatusType", "ce_opStatusOther"], ["ce_caseStatus", "ce_caseStatusOther"]].forEach(function (p) {
      var sel = document.getElementById(p[0]);
      var other = document.getElementById(p[1]);
      if (sel && other) other.style.display = sel.value === "OTHER" ? "" : "none";
    });
  }

  function mount(opts) {
    /* โหมดดูอย่างเดียว (ECMIS103.applyViewMode) — คงช่องอ่านอย่างเดียวเดิมไว้ ไม่สร้างฟอร์มแก้ไข */
    var pageBody = document.getElementById("pageBody");
    if (pageBody && pageBody.dataset.viewMode === "1") return;
    var badgeText = document.getElementById("f_caseNo");
    var card = badgeText && badgeText.closest(".form-card");
    if (!card || document.getElementById(FORM_ID)) return;
    var cur = opts.getCase();
    if (!cur) return;
    keepCardOpen(card);

    var body = card.querySelector(".form-card-body") || card;
    /* ช่องอ่านอย่างเดียวเดิมยังอยู่ (ซ่อน) เพราะโค้ดของหน้าเติม/อ่าน f_* อยู่ */
    var original = document.createElement("div");
    original.className = "ce-original";
    original.hidden = true;
    while (body.firstChild) original.appendChild(body.firstChild);
    body.appendChild(original);

    var form = document.createElement("div");
    form.id = FORM_ID;
    body.appendChild(form);

    var snapshot = "";

    function valueOf(group) {
      var el = group.querySelector("input:not(.th-date-display), select, textarea");
      return el ? el.value : "";
    }

    function render() {
      var c = sourceRecord(opts.getCase());
      form.innerHTML = buildForm(c, opts.getCase());
      if (global.ThaiDatePicker) {
        form.querySelectorAll('input[type="date"]').forEach(function (el) { global.ThaiDatePicker.enhance(el); });
      }
      syncOtherInputs();
      snapshot = JSON.stringify(readForm());
      form.querySelectorAll(".ce-field").forEach(function (g) { g.dataset.initial = valueOf(g); });
      document.getElementById("ceActions").hidden = true;
    }

    function onChange(e) {
      if (e.target.id === "ce_courtReceivedDate") {
        var fy = global.Activity10.fiscalYearOf(e.target.value);
        if (fy) document.getElementById("ce_fiscalYear").value = fy;
      }
      syncOtherInputs();
      form.querySelectorAll(".ce-field").forEach(function (g) {
        g.classList.toggle("ce-changed", valueOf(g) !== g.dataset.initial);
      });
      document.getElementById("ceActions").hidden = JSON.stringify(readForm()) === snapshot;
    }

    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    form.addEventListener("click", function (e) {
      if (e.target.closest("#ceCancelBtn")) {
        render();
        return;
      }
      if (!e.target.closest("#ceSaveBtn")) return;
      var d = readForm();
      var err = validate(d);
      if (err) {
        global.Swal.fire({ icon: "warning", title: "ข้อมูลไม่ครบถ้วน", text: err[0], confirmButtonColor: "#1e3a8a" });
        var target = document.getElementById(err[1] + "_th") || document.getElementById(err[1]);
        if (target) target.focus();
        return;
      }
      var updated = save(opts.getCase(), d);
      if (opts.onSaved) opts.onSaved(updated);
      refreshReadOnly(updated);
      render();
      global.Swal.fire({
        icon: "success",
        title: "บันทึกการแก้ไขแล้ว",
        text: "อัปเดตรายละเอียดคดีปกครองเรียบร้อย",
        timer: 1600,
        showConfirmButton: false,
      });
    });

    render();
  }

  global.ECMIS103CaseEdit = { mount: mount };
})(window);
