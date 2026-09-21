/* ecmis-10-3-case-edit.js
   ให้นิติกรแก้ไขรายละเอียดคดีศาลปกครองได้จากหน้าที่แสดงข้อมูลคดีแบบอ่านอย่างเดียว
   ใช้ฟอร์มและกติกาเดียวกับโหมดแก้ไขของ 10-3-02-legal-director-assign.html
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

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function selectHtml(id, options, value) {
    var list = options.slice();
    if (value && list.indexOf(value) === -1) list.push(value);
    return (
      '<select id="' + id + '" class="form-control">' +
      list.map(function (v) {
        return '<option value="' + esc(v) + '"' + (v === value ? " selected" : "") + ">" + esc(v) + "</option>";
      }).join("") + "</select>"
    );
  }

  function field(label, control, required) {
    return (
      '<div style="text-align:left;margin-bottom:10px"><label style="display:block;font-weight:600;font-size:.88em;margin-bottom:4px">' +
      label + (required ? ' <span style="color:#dc2626">*</span>' : "") + "</label>" + control + "</div>"
    );
  }

  function input(id, value, type, extra) {
    return '<input type="' + (type || "text") + '" id="' + id + '" class="form-control" value="' + esc(value) + '" ' + (extra || "") + " />";
  }

  function textarea(id, value, rows) {
    return '<textarea id="' + id + '" class="form-control" rows="' + rows + '">' + esc(value) + "</textarea>";
  }

  /* คดีแม่ที่เก็บข้อมูลรับเรื่องครบทุกช่อง (เคสลูก Part 1b คัดลอกมาเพียงบางช่อง) */
  function sourceRecord(cur) {
    if (cur && cur.l3ParentCaseId) {
      var parent = global.Activity10.getCaseById(cur.l3ParentCaseId);
      if (parent) return parent;
    }
    return cur;
  }

  function buildForm(c) {
    return (
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 14px">' +
      field("ชื่อหมาย", selectHtml("ce_summonsName", SUMMONS_OPTIONS, c.summonsName), true) +
      field("ศาล", selectHtml("ce_courtName", COURT_OPTIONS, c.courtName), true) +
      field("สั่งถึง", selectHtml("ce_orderedTo", ORDERED_TO_OPTIONS, c.orderedTo), true) +
      field("หมายเลขคดีดำ", input("ce_blackCaseNo", c.blackCaseNo), true) +
      field("หมายเลขคดีแดง", input("ce_redCaseNo", c.redCaseNo), false) +
      field("ศาลให้ทำภายใน .... วัน (เวลาที่ศาลสั่ง)", input("ce_courtDeadlineDays", c.courtDeadlineDays, "number", 'min="1" step="1"'), true) +
      field("วันที่สำนักงาน ป.ป.ท. รับเรื่อง", input("ce_courtReceivedDate", c.courtReceivedDate, "date"), true) +
      field("เลขสารบัญ", input("ce_courtSarabanNo", c.courtSarabanNo), true) +
      field("ผู้ฟ้อง (บรรทัดละ 1 ราย)", textarea("ce_plaintiffs", (c.plaintiffs || []).join("\n"), 3), true) +
      field("ผู้ถูกฟ้อง (บรรทัดละ 1 ราย)", textarea("ce_defendants", (c.defendants || []).join("\n"), 3), true) +
      "</div>" +
      field("หมายเหตุ", textarea("ce_courtRemark", c.courtRemark, 2), false)
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
      summonsName: v("ce_summonsName"),
      courtName: v("ce_courtName"),
      orderedTo: v("ce_orderedTo"),
      blackCaseNo: v("ce_blackCaseNo"),
      redCaseNo: v("ce_redCaseNo"),
      courtDeadlineDays: v("ce_courtDeadlineDays"),
      courtReceivedDate: v("ce_courtReceivedDate"),
      courtSarabanNo: v("ce_courtSarabanNo"),
      plaintiffs: lines("ce_plaintiffs"),
      defendants: lines("ce_defendants"),
      courtRemark: v("ce_courtRemark"),
    };
  }

  function validate(d) {
    var checks = [
      [d.summonsName, "กรุณาเลือกชื่อหมาย"],
      [d.courtName, "กรุณาเลือกศาล"],
      [d.orderedTo, "กรุณาเลือกสั่งถึง"],
      [d.blackCaseNo, "กรุณาระบุหมายเลขคดีดำ"],
      [d.courtDeadlineDays, "กรุณาระบุจำนวนวันที่ศาลให้ทำ"],
      [d.courtReceivedDate, "กรุณาระบุวันที่สำนักงาน ป.ป.ท. รับเรื่อง"],
      [d.courtSarabanNo, "กรุณาระบุเลขสารบัญ"],
      [d.plaintiffs.length ? "1" : "", "กรุณาระบุชื่อผู้ฟ้องอย่างน้อย 1 ราย"],
      [d.defendants.length ? "1" : "", "กรุณาระบุผู้ถูกฟ้องอย่างน้อย 1 ราย"],
    ];
    for (var i = 0; i < checks.length; i++) {
      if (!checks[i][0]) return checks[i][1];
    }
    return "";
  }

  /* บันทึกทั้งเคสแม่และเคสลูกทุเลา (ถ้ามี) เพื่อไม่ให้ข้อมูลสองฝั่งไม่ตรงกัน */
  function save(cur, d) {
    var A = global.Activity10;
    var rec = sourceRecord(cur);
    var joined = function (a) { return a.join(", ") || "-"; };
    A.updateCase(rec.id, {
      summonsName: d.summonsName,
      courtName: d.courtName,
      orderedTo: d.orderedTo,
      blackCaseNo: d.blackCaseNo,
      redCaseNo: d.redCaseNo,
      courtDeadlineDays: d.courtDeadlineDays,
      courtReceivedDate: d.courtReceivedDate,
      courtSarabanNo: d.courtSarabanNo,
      courtRemark: d.courtRemark,
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

  /* อัปเดตช่องอ่านอย่างเดียวที่มีอยู่ในหน้านั้น (แต่ละหน้าแสดงไม่ครบทุกช่อง) */
  function refreshReadOnly(c) {
    var E = global.ECMIS103;
    var map = {
      f_summonsName: c.summonsName,
      f_courtName: c.courtName,
      f_orderedTo: c.orderedTo,
      f_blackCaseNo: c.blackCaseNo,
      f_redCaseNo: c.redCaseNo,
      f_courtDeadlineDays: c.courtDeadlineDays,
      f_courtReceivedDate: c.courtReceivedDate,
      f_courtSarabanNo: c.courtSarabanNo,
      f_courtRemark: c.courtRemark,
    };
    Object.keys(map).forEach(function (id) {
      if (document.getElementById(id)) E.setText(id, map[id]);
    });
    if (document.getElementById("f_plaintiffs")) E.renderPartyList("f_plaintiffs", c.plaintiffs);
    if (document.getElementById("f_defendants")) E.renderPartyList("f_defendants", c.defendants);
  }

  function openEditor(opts) {
    var cur = opts.getCase();
    if (!cur) return;
    var rec = sourceRecord(cur);
    global.Swal.fire({
      title: "แก้ไขรายละเอียดคดีศาลปกครอง",
      html: buildForm(rec),
      width: 760,
      showCancelButton: true,
      confirmButtonText: "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      focusConfirm: false,
      preConfirm: function () {
        var d = readForm();
        var err = validate(d);
        if (err) {
          global.Swal.showValidationMessage(err);
          return false;
        }
        return d;
      },
    }).then(function (res) {
      if (!res.isConfirmed || !res.value) return;
      var updated = save(cur, res.value);
      if (opts.onSaved) opts.onSaved(updated);
      refreshReadOnly(updated);
      global.Swal.fire({
        icon: "success",
        title: "บันทึกการแก้ไขแล้ว",
        text: "อัปเดตรายละเอียดคดีศาลปกครองเรียบร้อย",
        timer: 1600,
        showConfirmButton: false,
      });
    });
  }

  function mount(opts) {
    var badgeText = document.getElementById("f_caseNo");
    if (!badgeText || document.getElementById("btnEditCaseDetail")) return;
    var badge = badgeText.closest(".badge") || badgeText.parentElement;
    var host = badge.parentElement;
    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;align-items:center;gap:10px";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnEditCaseDetail";
    btn.className = "btn btn-secondary";
    btn.style.cssText = "padding:4px 12px;font-size:.82em";
    btn.innerHTML = '<i class="fa-solid fa-pen-to-square me-1"></i>แก้ไขข้อมูลคดี';
    btn.addEventListener("click", function () { openEditor(opts); });
    host.insertBefore(wrap, badge);
    wrap.appendChild(btn);
    wrap.appendChild(badge);
  }

  global.ECMIS103CaseEdit = { mount: mount };
})(window);
