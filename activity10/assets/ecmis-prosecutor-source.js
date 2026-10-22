/* ECMIS 10.1 — ส่วนคำสั่งอัยการในหน้า 02-board-intake.html
   1) ประเภทศาล (radio name="in_courtSystem"): ศาลคดีทุจริต หรือ ศาลคดีประพฤติมิชอบ — เลือกอย่างใดอย่างหนึ่ง
      ค่าเริ่มต้นของ "ประเภทอัยการ" และ "ประเภทศาล" ในการ์ดบันทึกผลคำพิพากษา (ยังเปลี่ยนได้)
   2) อัยการต้นทาง: ประเภทอัยการ → ชื่อสำนักงานอัยการ (dropdown จาก ECMISCourtLists)
      ช่องข้อความเดิม in_source ยังเป็นค่าที่บันทึก (หน้าอื่นอ่านช่องนี้) — dropdown เขียนค่าลงช่องนี้,
      เลือก "อื่นๆ (โปรดระบุ)" จึงแสดงช่องข้อความให้พิมพ์เอง
   หน้า 02 เรียก ECMISProsecutorSource.syncFromText() หลังเติม in_source จากสำนวนที่ค้นเจอ
   และ values() ตอนบันทึก → { courtSystem, courtSystemName, prosecutorType, prosecutorTypeName } */
(function (global) {
  "use strict";

  const doc = global.document;
  const CL = () => global.ECMISCourtLists;
  const $ = (id) => doc.getElementById(id);
  let typeTouched = false;

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  const opt = (v, label, cur) => '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>";

  function courtSystem() {
    const r = doc.querySelector('input[name="in_courtSystem"]:checked');
    return r ? r.value : "";
  }

  function fillOffices(type, selected) {
    const sel = $("in_prosecutorOffice");
    if (!sel) return;
    const list = CL().officesFor(type);
    const cur = list.indexOf(selected) >= 0 || selected === CL().OTHER ? selected : "";
    sel.innerHTML =
      opt("", type ? "-- เลือกสำนักงานอัยการ --" : "-- เลือกประเภทอัยการก่อน --", cur) +
      list.map((n) => opt(n, n, cur)).join("") +
      (type ? opt(CL().OTHER, CL().OTHER, cur) : "");
  }

  /* dropdown → ช่องข้อความ in_source (ซ่อนช่องข้อความเว้นแต่เลือก "อื่นๆ") */
  function applyToText() {
    const text = $("in_source");
    const office = $("in_prosecutorOffice");
    if (!text || !office) return;
    const isOther = office.value === CL().OTHER;
    text.style.display = isOther ? "" : "none";
    if (!isOther) {
      text.value = office.value;
      if (typeof global.updateLivePreview === "function") global.updateLivePreview();
    }
  }

  /* ช่องข้อความ in_source (ค่าเดิม/จากสำนวนที่ค้นเจอ) → dropdown */
  function syncFromText() {
    const text = $("in_source");
    if (!text || !$("in_prosecutorType")) return;
    const found = CL().findOffice(text.value);
    const type = found.type || $("in_prosecutorType").value || CL().prosecutorTypeForCourt(courtSystem());
    $("in_prosecutorType").value = type;
    fillOffices(type, found.name);
    if (found.name === CL().OTHER) {
      $("in_prosecutorOffice").value = CL().OTHER;
      text.value = found.other;
    }
    text.style.display = $("in_prosecutorOffice").value === CL().OTHER ? "" : "none";
  }

  function mount() {
    const text = $("in_source");
    if (!text || $("in_prosecutorType") || !CL()) return;
    const wrap = doc.createElement("div");
    wrap.className = "form-grid-2";
    wrap.style.marginBottom = "8px";
    wrap.innerHTML =
      '<select id="in_prosecutorType" class="form-control" aria-label="ประเภทอัยการ">' +
      opt("", "-- ประเภทอัยการ --", "") +
      CL().PROSECUTOR_TYPES.map((t) => opt(t.code, t.name, "")).join("") +
      "</select>" +
      '<select id="in_prosecutorOffice" class="form-control" aria-label="ชื่อสำนักงานอัยการ"></select>';
    text.parentNode.insertBefore(wrap, text);
    /* รายการสำนักงานอัยการยังเป็นฉบับร่าง (ecmis-court-prosecutor-lists.js) */
    const note = doc.createElement("div");
    note.className = "prosecutor-list-note";
    note.style.cssText = "font-size:.8em;color:#b45309;margin:-2px 0 8px";
    note.innerHTML =
      '<i class="fa-solid fa-circle-info"></i> รายการตัวอย่าง (ฉบับร่าง) — ไม่พบให้เลือก อื่นๆ';
    text.parentNode.insertBefore(note, text);
    text.setAttribute("placeholder", "ระบุชื่อสำนักงานอัยการ (อื่นๆ)");
    $("in_prosecutorType").addEventListener("change", (e) => {
      typeTouched = true;
      fillOffices(e.target.value, "");
      applyToText();
    });
    $("in_prosecutorOffice").addEventListener("change", applyToText);
    doc.querySelectorAll('input[name="in_courtSystem"]').forEach((r) =>
      r.addEventListener("change", () => {
        /* ประเภทศาล → ค่าเริ่มต้นของประเภทอัยการ (ถ้ายังไม่ได้เลือกเอง) และประเภทศาลในการ์ดคำพิพากษา
           ไม่ทับอัยการต้นทางที่ระบุเอง (อื่นๆ) — สำนักงานจากรายการเดิมต้องเลือกใหม่ (ตรวจตอนบันทึก) */
        const isOther = $("in_prosecutorOffice").value === CL().OTHER && $("in_source").value.trim();
        /* "ไม่มีศาลระบุ" และ ศาลปกครอง ไม่เปลี่ยนประเภทอัยการ; ศาลแขวง/ศาลจังหวัด = อัยการคดีประพฤติมิชอบจังหวัด */
        const ptype = CL().prosecutorTypeForCourt(courtSystem());
        if (ptype && !typeTouched && !isOther && $("in_prosecutorType").value !== ptype) {
          $("in_prosecutorType").value = ptype;
          fillOffices(ptype, "");
          applyToText();
        }
        if (global.ECMISVerdictIntake) global.ECMISVerdictIntake.refresh();
      }),
    );
    syncFromText();
  }

  function values() {
    const sys = courtSystem();
    const ptype = $("in_prosecutorType") ? $("in_prosecutorType").value : "";
    return {
      courtSystem: sys,
      courtSystemName: sys ? CL().courtTypeName(sys) : "",
      prosecutorType: ptype,
      prosecutorTypeName: ptype ? CL().prosecutorTypeName(ptype) : "",
    };
  }

  global.ECMISProsecutorSource = { mount: mount, syncFromText: syncFromText, values: values, courtSystem: courtSystem };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount);
  else mount();
})(window);
