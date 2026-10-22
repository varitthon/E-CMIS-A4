/* ECMIS 10.1 — การ์ด "บันทึกผลคำพิพากษา" ในหน้า 02-board-intake.html (ไม่บังคับกรอก)
   แสดงทุกหมวด ยกเว้นคดีปกครอง (10.3); ติ๊ก "มีผลคำพิพากษา" จึงแสดงฟอร์มและบันทึก
   - ชั้นศาลตั้งตาม "ระดับศาล" (in_prosecutorLevel) จนกว่าผู้ใช้จะเลือกเอง; ระดับ 0/9 ให้ผู้ใช้เลือก
   - ประเภทศาลตั้งตาม "ประเภทศาล" ในส่วนคำสั่งอัยการ (in_courtSystem) จนกว่าผู้ใช้จะเลือกเอง; ชื่อศาลกรองตามประเภท+ชั้น
   - บุคคล: เลือกจากจำเลยในส่วนคดีอาญา + ผู้ถูกกล่าวหาในสำนวนเดิมที่เลือก (บันทึก 1 คนที่นี่ คนอื่นเพิ่มที่หน้าบันทึกผลคำพิพากษา)
   - เลขคดีดำ/แดงใช้ช่องในส่วนคดีอาญาของหน้า 02 การ์ดนี้จึงซ่อนไว้
   หน้า 02 เรียก ECMISVerdictIntake.refresh() เมื่อหมวด/กรณีอัยการ/ระดับศาล/ประเภทศาลเปลี่ยน,
   validateBeforeSubmit() ก่อนยืนยัน และ saveFor(newCaseId) หลังสร้างสำนวน
   (ครบ = บันทึก, ไม่ครบ = ร่าง, ไม่ได้กรอก = ข้าม) */
(function (global) {
  "use strict";

  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const doc = global.document;
  const P = "vr02_";
  const HOST_ID = "div_verdictRecord";
  const HIDDEN_KEYS = ["courtBlackNo", "courtRedNo"];
  let rendered = false;
  let levelTouched = false;
  let typeTouched = false;

  const $ = (id) => doc.getElementById(id);
  const val = (id) => ($(id) ? $(id).value : "");
  const esc = (v) => F().esc(v);

  /* แสดงการ์ดทุกหมวด/ทุกกรณีอัยการ ยกเว้นคดีปกครอง (10.3) ซึ่งมีขั้นตอนคำพิพากษาของตัวเอง (ผู้ใช้ขอ 20/10/2569) */
  function isApplicable() {
    return val("in_category") !== "10.3";
  }

  /* ประเภทศาลที่เลือกในส่วนคำสั่งอัยการ (radio name="in_courtSystem") */
  function courtSystem() {
    const r = doc.querySelector('input[name="in_courtSystem"]:checked');
    return r ? r.value : "";
  }

  /* รายชื่อบุคคล: จำเลยในส่วนคดีอาญา (crimDefendants) + ผู้ถูกกล่าวหาที่กรอก + ผู้ถูกกล่าวหาในสำนวนเดิมที่เลือก */
  function personNames() {
    let defendants = [];
    let pacc = null;
    try {
      if (typeof collectCriminalCaseFields === "function") defendants = collectCriminalCaseFields().defendants || []; // eslint-disable-line no-undef
      if (typeof selectedIntakeCaseData !== "undefined") pacc = selectedIntakeCaseData; // eslint-disable-line no-undef
    } catch (e) {
      /* หน้า 02 ยังไม่พร้อม — ใช้เฉพาะช่องผู้ถูกกล่าวหา */
    }
    const accusedEl = $("in_accused") || $("f_accused");
    return R().personCandidates({ defendants: defendants, accused: accusedEl ? accusedEl.value : "" }, pacc);
  }
  function personOptionsHtml(current) {
    const names = personNames();
    const list = current && names.indexOf(current) < 0 ? names.concat([current]) : names;
    return (
      '<option value="">' + (list.length ? "-- เลือกบุคคล --" : "-- ยังไม่มีรายชื่อ (เลือกสำนวน/กรอกจำเลยก่อน) --") + "</option>" +
      list.map((n) => '<option value="' + esc(n) + '"' + (n === current ? " selected" : "") + ">" + esc(n) + "</option>").join("")
    );
  }
  function refreshPersons() {
    const sel = $(P + "person");
    if (sel) sel.innerHTML = personOptionsHtml(sel.value);
  }

  function headerFieldsHtml(level) {
    return (
      '<div class="vr-grid" style="margin-bottom:12px">' +
      '<div class="vr-f"><label for="' + P + 'level">ชั้นศาลของคำพิพากษา <span class="vr-req">*</span></label>' +
      '<select id="' + P + 'level"><option value="">-- เลือกชั้นศาล --</option>' +
      global.ECMISVerdictLists.LEVELS.map((l) => '<option value="' + l.code + '"' + (l.code === level ? " selected" : "") + ">" + l.name + "</option>").join("") +
      "</select></div>" +
      '<div class="vr-f"><label for="' + P + 'person">บุคคล (จำเลย/ผู้ถูกกล่าวหา) <span class="vr-req">*</span></label>' +
      '<select id="' + P + 'person">' + personOptionsHtml("") + "</select>" +
      '<div class="vr-sub" style="margin-top:3px">เพิ่มคนอื่นได้ที่หน้าบันทึกผลคำพิพากษา</div></div>' +
      "</div>"
    );
  }

  function render() {
    const host = $(HOST_ID);
    if (!host) return;
    F().injectStyle();
    const level = R().levelFromProsecutorLevel(val("in_prosecutorLevel"));
    const state = { fields: R().emptyFields(), court: { type: courtSystem(), name: "", blackNo: "", redNo: "", date: "" }, fileNames: [] };
    /* หัวข้อ "บันทึกผลคำพิพากษา" เป็นส่วนพับได้ของหน้า 02 (head_verdictRecord) — ที่นี่เรนเดอร์เฉพาะเนื้อหา */
    host.innerHTML =
      '<label class="vr-f" style="display:flex;gap:8px;align-items:center;font-weight:600;cursor:pointer;margin-bottom:12px">' +
      '<input type="checkbox" id="' + P + 'hasVerdict" style="width:auto;margin:0"> มีผลคำพิพากษา</label>' +
      '<div id="' + P + 'body" class="vr-hide">' +
      headerFieldsHtml(level) + '<div id="' + P + 'form">' + F().formHtml(P, state, level) + "</div>" +
      '<div id="' + P + 'errors" class="vr-err" role="alert"></div></div>';
    $(P + "hasVerdict").addEventListener("change", (e) => {
      $(P + "body").classList.toggle("vr-hide", !e.target.checked);
      if (e.target.checked) refreshPersons();
    });
    $(P + "person").addEventListener("focus", refreshPersons);
    const form = $(P + "form");
    HIDDEN_KEYS.forEach((k) => {
      const w = form.querySelector('[data-vr-wrap="' + k + '"]');
      if (w) w.classList.add("vr-hide");
    });
    const hint = form.querySelector(".vr-sub.vr-wide");
    if (hint) hint.textContent = "เลขคดีดำ/แดงใช้จากส่วนข้อมูลคดีในศาล";
    F().bindForm(form, P);
    form.addEventListener("change", (e) => {
      if (e.target.id === P + "courtType") typeTouched = true;
    });
    $(P + "level").addEventListener("change", (e) => {
      levelTouched = true;
      F().setStages(form, P, e.target.value);
    });
    rendered = true;
  }

  /* เรียกเมื่อหมวด/กรณีอัยการ/ระดับศาล/ประเภทศาลเปลี่ยน */
  function refresh() {
    const host = $(HOST_ID);
    if (!host || !F() || !R()) return;
    const show = isApplicable();
    /* ซ่อนทั้งส่วน (หัวข้อ + เนื้อหา) เมื่อไม่เกี่ยว — ส่วนพับได้สร้างโดย ecmis-intake-accordion.js */
    const section = host.closest(".acc-section") || host;
    section.style.display = show ? "" : "none";
    if (!show) return;
    if (!rendered) return render();
    const form = $(P + "form");
    if (!typeTouched) F().setCourtType(form, P, courtSystem());
    if (levelTouched) return;
    const level = R().levelFromProsecutorLevel(val("in_prosecutorLevel"));
    const sel = $(P + "level");
    if (sel && sel.value !== level) {
      sel.value = level;
      F().setStages(form, P, level);
    }
  }

  /* ติ๊ก "มีผลคำพิพากษา" เท่านั้นจึงตรวจ/บันทึก — ไม่ติ๊ก = ข้ามทั้งการ์ดแม้จะเคยกรอกไว้ */
  function hasVerdict() {
    return rendered && isApplicable() && !!$(P + "hasVerdict") && $(P + "hasVerdict").checked;
  }

  function collected() {
    return F().collect($(P + "form"), P);
  }

  /* ตรวจก่อนยืนยัน — กรอกแล้วแต่ไม่เลือกชั้นศาล/บุคคล หรือตัวเลขผิด → คืนรายการข้อผิดพลาด */
  function validateBeforeSubmit() {
    if (!hasVerdict()) return [];
    const c = collected();
    const errors = F().hasInput(c) ? R().validate(val(P + "level"), c.fields, "draft") : [];
    if (F().hasInput(c) && !val(P + "person")) errors.push("กรุณาเลือกบุคคล (จำเลย/ผู้ถูกกล่าวหา)");
    if (F().hasInput(c) && c.court.name && !c.court.type) errors.push("กรุณาเลือกประเภทศาล");
    const box = $(P + "errors");
    if (box) box.innerHTML = errors.map((e) => "<div>" + esc(e) + "</div>").join("");
    if (errors.length && global.ECMISIntakeAccordion) global.ECMISIntakeAccordion.reveal($(HOST_ID));
    return errors;
  }

  /* บันทึกหลังสร้างสำนวน — คืน { saved, status, errors } */
  function saveFor(caseId) {
    if (!hasVerdict()) return { saved: false };
    const c = collected();
    if (!F().hasInput(c)) return { saved: false };
    const level = val(P + "level");
    const kase = global.Activity10.findCaseById(caseId) || {};
    c.court = {
      type: c.court.type || kase.courtSystem || "",
      name: c.court.name || kase.courtName || "",
      blackNo: kase.courtBlackNo || "",
      redNo: kase.courtRedNo || "",
      date: c.court.date,
    };
    const status = R().validate(level, c.fields, "done").length ? "draft" : "done";
    const res = F().save(caseId, level, c, status, val(P + "person"));
    return { saved: res.ok, status: status, errors: res.errors };
  }

  global.ECMISVerdictIntake = { refresh: refresh, saveFor: saveFor, validateBeforeSubmit: validateBeforeSubmit };
  doc.addEventListener("DOMContentLoaded", refresh);
})(window);
