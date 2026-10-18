/* ==========================================================================
   ฐานความผิด (มาตรา) — วิดเจ็ตกรอกได้หลายรายการ
   ใช้ร่วมกันระหว่าง 02-board-intake (ธุรการกรอกตอนรับเรื่อง) และ
   06-officer-opinion (นิติกรแก้ไข/เพิ่มเติม) เก็บไว้ใช้ทำ Dashboard
   พบมากสุดประมาณ 6-7 มาตราต่อสำนวน

   วิธีใช้ในแต่ละหน้า
     1) วาง <div id="offenseBasisList"></div> และปุ่ม onclick="addOffenseBasisRow()"
     2) ตอนโหลดหน้า เรียก setOffenseBasisRows(currentCase.offenseBases) แล้ว
        renderOffenseBasisList()
     3) ตอนบันทึก เรียก validateOffenseBasisRows() แล้ว collectOffenseBases()
   ========================================================================== */

const OFFENSE_LAWS = [
  "ประมวลกฎหมายอาญา",
  "พ.ร.บ.ว่าด้วยความผิดเกี่ยวกับการเสนอราคาต่อหน่วยงานของรัฐ พ.ศ. 2542",
  "พ.ร.ป.ว่าด้วยการป้องกันและปราบปรามการทุจริต",
];

let offenseBasisRows = [];
let offenseBasisSeq = 0;

function escAttr(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* หน้า 02 มี live preview ส่วนหน้าอื่นไม่มี จึงเรียกแบบมีเงื่อนไข */
function offenseBasisNotifyChange() {
  if (typeof updateLivePreview === "function") updateLivePreview();
}

/* อ่านค่าที่ผู้ใช้พิมพ์กลับเข้า array ก่อน re-render เพื่อไม่ให้ค่าหาย */
function syncOffenseBasisFromDom() {
  offenseBasisRows = offenseBasisRows.map(function (row) {
    const law = document.getElementById("in_offenseLaw_" + row.uid);
    const lawOther = document.getElementById("in_offenseLawOther_" + row.uid);
    const section = document.getElementById("in_offenseSection_" + row.uid);
    const basis = document.getElementById("in_offenseBasis_" + row.uid);
    return {
      uid: row.uid,
      law: law ? law.value : row.law,
      lawOther: lawOther ? lawOther.value : row.lawOther,
      section: section ? section.value : row.section,
      basis: basis ? basis.value : row.basis,
    };
  });
}

/* โหลดข้อมูลที่บันทึกไว้จากหน้าก่อนหน้ากลับเข้าฟอร์ม
   กฎหมายที่ไม่อยู่ใน OFFENSE_LAWS ถือเป็น "อื่นๆ" */
function setOffenseBasisRows(list) {
  offenseBasisRows = (list || []).map(function (item) {
    const isKnownLaw = OFFENSE_LAWS.indexOf(item.law) !== -1;
    return {
      uid: ++offenseBasisSeq,
      law: isKnownLaw ? item.law : "อื่นๆ",
      lawOther: isKnownLaw ? "" : item.law || "",
      section: item.section || "",
      basis: item.basis || "",
    };
  });
}

function addOffenseBasisRow() {
  syncOffenseBasisFromDom();
  offenseBasisRows.push({
    uid: ++offenseBasisSeq,
    law: OFFENSE_LAWS[0],
    lawOther: "",
    section: "",
    basis: "",
  });
  renderOffenseBasisList();
}

function removeOffenseBasisRow(uid) {
  syncOffenseBasisFromDom();
  offenseBasisRows = offenseBasisRows.filter(function (r) {
    return r.uid !== uid;
  });
  renderOffenseBasisList();
}

function toggleOffenseLawOther(uid) {
  const law = document.getElementById("in_offenseLaw_" + uid);
  const wrap = document.getElementById("div_offenseLawOther_" + uid);
  if (law && wrap) {
    wrap.style.display = law.value === "อื่นๆ" ? "block" : "none";
  }
  offenseBasisNotifyChange();
}

function renderOffenseBasisList() {
  const listEl = document.getElementById("offenseBasisList");
  if (!listEl) return;
  /* อ่านค่าล่าสุดจาก DOM ก่อนวาดใหม่เสมอ กันค่าที่ผู้ใช้พิมพ์หาย */
  syncOffenseBasisFromDom();
  if (!offenseBasisRows.length) {
    listEl.innerHTML =
      '<div style="font-size:0.85em; color:#94a3b8; padding:6px 0;">ยังไม่ได้ระบุฐานความผิด — กด "เพิ่มมาตรา" เพื่อเริ่มกรอก</div>';
    return;
  }
  listEl.innerHTML = offenseBasisRows
    .map(function (row, idx) {
      const opts = OFFENSE_LAWS.concat(["อื่นๆ"])
        .map(function (l) {
          return (
            '<option value="' +
            escAttr(l) +
            '"' +
            (row.law === l ? " selected" : "") +
            ">" +
            l +
            "</option>"
          );
        })
        .join("");
      return (
        '<div style="border:1px solid var(--border-color); border-radius:6px; padding:10px 12px; margin-bottom:8px;">' +
        '<div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">' +
        '<span style="font-size:0.82em; font-weight:600; color:var(--text-title);">รายการที่ ' +
        (idx + 1) +
        "</span>" +
        '<span style="flex:1;"></span>' +
        '<button type="button" class="btn btn-secondary" style="padding:2px 8px; font-size:0.78em;" onclick="removeOffenseBasisRow(' +
        row.uid +
        ')" title="ลบรายการนี้"><i class="fa-solid fa-trash-can"></i></button>' +
        "</div>" +
        '<div class="form-grid-2">' +
        '<div class="form-group" style="margin-bottom:0;">' +
        '<label style="font-size:0.82em; justify-content:flex-start; gap:4px;">กฎหมาย <span style="color:#dc2626;">*</span></label>' +
        '<select id="in_offenseLaw_' +
        row.uid +
        '" class="form-control" onchange="toggleOffenseLawOther(' +
        row.uid +
        ')">' +
        opts +
        "</select>" +
        '<div id="div_offenseLawOther_' +
        row.uid +
        '" style="display:' +
        (row.law === "อื่นๆ" ? "block" : "none") +
        '; margin-top:6px;">' +
        '<input type="text" id="in_offenseLawOther_' +
        row.uid +
        '" class="form-control" placeholder="โปรดระบุกฎหมาย..." value="' +
        escAttr(row.lawOther) +
        '" oninput="offenseBasisNotifyChange()" />' +
        "</div></div>" +
        '<div class="form-group" style="margin-bottom:0;">' +
        '<label style="font-size:0.82em; justify-content:flex-start; gap:4px;">มาตรา <span style="color:#dc2626;">*</span></label>' +
        '<input type="text" id="in_offenseSection_' +
        row.uid +
        '" class="form-control" placeholder="เช่น 157" value="' +
        escAttr(row.section) +
        '" oninput="offenseBasisNotifyChange()" />' +
        "</div></div>" +
        '<div class="form-group" style="margin-top:8px; margin-bottom:0;">' +
        '<label style="font-size:0.82em; justify-content:flex-start; gap:4px;">ฐานความผิด <span style="color:#dc2626;">*</span></label>' +
        '<input type="text" id="in_offenseBasis_' +
        row.uid +
        '" class="form-control" placeholder="เช่น เจ้าพนักงานปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยมิชอบ" value="' +
        escAttr(row.basis) +
        '" oninput="offenseBasisNotifyChange()" />' +
        "</div></div>"
      );
    })
    .join("");
}

/* คืนค่าเฉพาะแถวที่กรอกมาตราหรือฐานความผิดไว้จริง */
function collectOffenseBases() {
  syncOffenseBasisFromDom();
  return offenseBasisRows
    .filter(function (r) {
      return (r.section || "").trim() || (r.basis || "").trim();
    })
    .map(function (r) {
      return {
        law: r.law === "อื่นๆ" ? (r.lawOther || "").trim() : r.law || "",
        section: (r.section || "").trim(),
        basis: (r.basis || "").trim(),
      };
    });
}

/* ถ้าเลือกกฎหมาย "อื่นๆ" ต้องระบุชื่อกฎหมาย
   และแถวที่เริ่มกรอกแล้วต้องมีมาตรากำกับด้วย */
function validateOffenseBasisRows() {
  syncOffenseBasisFromDom();
  for (let i = 0; i < offenseBasisRows.length; i++) {
    const row = offenseBasisRows[i];
    const filled =
      (row.section || "").trim() ||
      (row.basis || "").trim() ||
      (row.lawOther || "").trim();
    if (!filled) continue;
    if (row.law === "อื่นๆ" && !(row.lawOther || "").trim()) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุกฎหมาย (อื่นๆ) ในฐานความผิดรายการที่ " + (i + 1),
        confirmButtonColor: "#1e3a8a",
      });
      const el = document.getElementById("in_offenseLawOther_" + row.uid);
      if (el) el.focus();
      return false;
    }
    if (!(row.section || "").trim()) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุมาตรา ในฐานความผิดรายการที่ " + (i + 1),
        confirmButtonColor: "#1e3a8a",
      });
      const el = document.getElementById("in_offenseSection_" + row.uid);
      if (el) el.focus();
      return false;
    }
    if (!(row.basis || "").trim()) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุฐานความผิด ในฐานความผิดรายการที่ " + (i + 1),
        confirmButtonColor: "#1e3a8a",
      });
      const el = document.getElementById("in_offenseBasis_" + row.uid);
      if (el) el.focus();
      return false;
    }
  }
  return true;
}
