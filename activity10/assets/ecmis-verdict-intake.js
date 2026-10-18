/* ECMIS 10.1 — การ์ด "บันทึกผลคำพิพากษา" ในหน้า 02-board-intake.html (ไม่บังคับกรอก)
   แสดงเสมอทุกหมวด/ทุกกรณีอัยการ และกางไว้ตั้งแต่เปิดหน้า
   ชั้นศาลตั้งตาม "ระดับศาล" (in_prosecutorLevel) จนกว่าผู้ใช้จะเลือกเอง; ระดับ 0/9 ให้ผู้ใช้เลือก
   เลขคดี/ชื่อศาลใช้ช่องในส่วนคดีอาญาของหน้า 02 อยู่แล้ว การ์ดนี้จึงซ่อนช่องเหล่านั้นไว้ (เหลือวันที่พิพากษา)
   หน้า 02 เรียก ECMISVerdictIntake.refresh() เมื่อหมวด/กรณีอัยการ/ระดับศาลเปลี่ยน,
   validateBeforeSubmit() ก่อนยืนยัน และ saveFor(newCaseId) หลังสร้างสำนวน
   (ครบ = บันทึก, ไม่ครบ = ร่าง, ไม่ได้กรอก = ข้าม) */
(function (global) {
  "use strict";

  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const doc = global.document;
  const P = "vr02_";
  const HOST_ID = "div_verdictRecord";
  const COURT_KEYS = ["courtName", "courtBlackNo", "courtRedNo"];
  let rendered = false;
  let levelTouched = false;

  const $ = (id) => doc.getElementById(id);
  const val = (id) => ($(id) ? $(id).value : "");

  /* แสดงการ์ดเสมอทุกหมวด/ทุกกรณีอัยการ (ตามที่ผู้ใช้ขอ 18/10/2569) — ไม่กรอก = ไม่บันทึก */
  function isApplicable() {
    return true;
  }

  function levelSelectHtml(level) {
    return (
      '<div class="vr-f" style="max-width:280px;margin-bottom:12px"><label for="' + P + 'level">ชั้นศาลของคำพิพากษา <span class="vr-req">*</span></label>' +
      '<select id="' + P + 'level"><option value="">-- เลือกชั้นศาล --</option>' +
      global.ECMISVerdictLists.LEVELS.map((l) => '<option value="' + l.code + '"' + (l.code === level ? " selected" : "") + ">" + l.name + "</option>").join("") +
      "</select></div>"
    );
  }

  function render() {
    const host = $(HOST_ID);
    if (!host) return;
    F().injectStyle();
    const level = R().levelFromProsecutorLevel(val("in_prosecutorLevel"));
    const state = { fields: R().emptyFields(), court: { name: "", blackNo: "", redNo: "", date: "" }, fileNames: [] };
    host.innerHTML =
      '<details class="vr-card" id="' + P + 'details" style="margin-top:4px" open>' +
      '<summary class="vr-card-h" style="cursor:pointer">' +
      '<i class="fa-solid fa-scale-balanced"></i>บันทึกผลคำพิพากษา <span class="vr-sub" style="font-weight:400">(ไม่บังคับ — กรอกภายหลังได้ที่เมนูสารบบคำวินิจฉัย/คำพิพากษา)</span></summary>' +
      '<div class="vr-card-b">' +
      '<label class="vr-f" style="display:flex;gap:8px;align-items:center;font-weight:600;cursor:pointer;margin-bottom:12px">' +
      '<input type="checkbox" id="' + P + 'hasVerdict" style="width:auto;margin:0"> มีผลคำพิพากษา</label>' +
      '<div id="' + P + 'body" class="vr-hide">' +
      levelSelectHtml(level) + '<div id="' + P + 'form">' + F().formHtml(P, state, level) + "</div>" +
      '<div id="' + P + 'errors" class="vr-err" role="alert"></div></div></div></details>';
    $(P + "hasVerdict").addEventListener("change", (e) => $(P + "body").classList.toggle("vr-hide", !e.target.checked));
    const form = $(P + "form");
    COURT_KEYS.forEach((k) => {
      const w = form.querySelector('[data-vr-wrap="' + k + '"]');
      if (w) w.classList.add("vr-hide");
    });
    const hint = form.querySelector(".vr-sub.vr-wide");
    if (hint) hint.textContent = "เลขคดีดำ/แดงและชื่อศาลใช้ค่าจากส่วนข้อมูลคดีด้านบน";
    F().bindForm(form, P);
    $(P + "level").addEventListener("change", (e) => {
      levelTouched = true;
      F().setStages(form, P, e.target.value);
    });
    rendered = true;
  }

  /* เรียกเมื่อหมวด/กรณีอัยการ/ระดับศาลเปลี่ยน */
  function refresh() {
    const host = $(HOST_ID);
    if (!host || !F() || !R()) return;
    const show = isApplicable();
    host.style.display = show ? "" : "none";
    if (!show) return;
    if (!rendered) return render();
    if (levelTouched) return;
    const level = R().levelFromProsecutorLevel(val("in_prosecutorLevel"));
    const sel = $(P + "level");
    if (sel && sel.value !== level) {
      sel.value = level;
      F().setStages($(P + "form"), P, level);
    }
  }

  /* ติ๊ก "มีผลคำพิพากษา" เท่านั้นจึงตรวจ/บันทึก — ไม่ติ๊ก = ข้ามทั้งการ์ดแม้จะเคยกรอกไว้ */
  function hasVerdict() {
    return rendered && !!$(P + "hasVerdict") && $(P + "hasVerdict").checked;
  }

  function collected() {
    return F().collect($(P + "form"), P);
  }

  /* ตรวจก่อนยืนยัน — มีการกรอกแต่ไม่เลือกชั้นศาล หรือตัวเลขผิด → คืนรายการข้อผิดพลาด */
  function validateBeforeSubmit() {
    if (!hasVerdict()) return [];
    const c = collected();
    const errors = F().hasInput(c) ? R().validate(val(P + "level"), c.fields, "draft") : [];
    const box = $(P + "errors");
    if (box) box.innerHTML = errors.map((e) => "<div>" + F().esc(e) + "</div>").join("");
    if (errors.length && $(P + "details")) $(P + "details").open = true;
    return errors;
  }

  /* บันทึกหลังสร้างสำนวน — คืน { saved, status, errors } */
  function saveFor(caseId) {
    if (!hasVerdict()) return { saved: false };
    const c = collected();
    if (!F().hasInput(c)) return { saved: false };
    const level = val(P + "level");
    const kase = global.Activity10.findCaseById(caseId) || {};
    c.court = { name: kase.courtName || "", blackNo: kase.courtBlackNo || "", redNo: kase.courtRedNo || "", date: c.court.date };
    const status = R().validate(level, c.fields, "done").length ? "draft" : "done";
    const res = F().save(caseId, level, c, status);
    return { saved: res.ok, status: status, errors: res.errors };
  }

  global.ECMISVerdictIntake = { refresh: refresh, saveFor: saveFor, validateBeforeSubmit: validateBeforeSubmit };
  doc.addEventListener("DOMContentLoaded", refresh);
})(window);
