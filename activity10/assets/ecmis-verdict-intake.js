/* ECMIS 10.1 — การ์ด "บันทึกผลคำพิพากษา" ในหน้า 02-board-intake.html (ไม่บังคับกรอก)
   แสดงทุกหมวด ยกเว้นคดีปกครอง (10.3); ติ๊ก "มีผลคำพิพากษา" จึงแสดงฟอร์มและบันทึก
   - ชั้นศาลตั้งตาม "ระดับศาล" (in_prosecutorLevel) จนกว่าผู้ใช้จะเลือกเอง; ระดับ 0/9 ให้ผู้ใช้เลือก
   - แถบศาล (ใช้ร่วมทุกคน): ประเภทศาลตั้งตาม "ประเภทศาล" ในส่วนคำสั่งอัยการ (in_courtSystem) จนกว่าผู้ใช้จะเลือกเอง
     เลขคดีดำ/แดงใช้ช่องในส่วนคดีอาญาของหน้า 02 จึงซ่อนไว้
   - แท็บรายบุคคล (ECMISVerdictTabs): รายชื่อจากจำเลยในส่วนคดีอาญา + ผู้ถูกกล่าวหาในสำนวนเดิมที่เลือก
     รายชื่ออัปเดตเมื่อติ๊ก/คลิกในการ์ด/หน้า 02 เรียก refresh(); เพิ่มชื่อเองได้
   หน้า 02 เรียก ECMISVerdictIntake.refresh() เมื่อหมวด/กรณีอัยการ/ระดับศาล/ประเภทศาลเปลี่ยน,
   validateBeforeSubmit() ก่อนยืนยัน และ saveFor(newCaseId) หลังสร้างสำนวน
   ปุ่มบันทึก/บันทึกร่างในการ์ดจดสถานะไว้ (ยังไม่มีสำนวน) → saveFor เขียนทุกคนที่กรอกด้วยสถานะนั้น; ไม่มีใครกรอก = ข้าม */
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
  let tabs = null;

  const $ = (id) => doc.getElementById(id);
  const val = (id) => ($(id) ? $(id).value : "");
  const esc = (v) => F().esc(v);

  /* แสดงการ์ดทุกหมวด/ทุกกรณีอัยการ ยกเว้นคดีปกครอง (10.3) ซึ่งมีขั้นตอนคำพิพากษาของตัวเอง (ผู้ใช้ขอ 20/10/2569) */
  /* AG ตั้งต้นจาก "กรณีความเห็น/คำสั่งพนักงานอัยการ" ของหน้า 02 (เฉพาะ 10.1) จนกว่าผู้ใช้จะเลือกเอง */
  let agTouched = false;
  function applyAgDefault() {
    const sel = $(P + "prosecutorStatus");
    const src = $("in_prosecutorCaseType");
    if (!sel || agTouched) return;
    const text = val("in_category") === "10.1" && src && src.selectedIndex >= 0 ? src.options[src.selectedIndex].text : "";
    sel.value = R().defaultProsecutorStatus({ prosecutorCaseTypeName: text });
  }

  function isApplicable() {
    return val("in_category") !== "10.3";
  }

  /* ประเภทศาลที่เลือกในส่วนคำสั่งอัยการ (radio name="in_courtSystem") */
  function courtSystem() {
    const r = doc.querySelector('input[name="in_courtSystem"]:checked');
    return r ? r.value : "";
  }
  /* ชั้นศาลเริ่มต้น: ประเภทศาล = ศาลปกครอง → ศาลปกครองชั้นต้น, อื่นๆ → ตามระดับศาล (in_prosecutorLevel) */
  function defaultLevel() {
    return courtSystem() === "ADMIN" ? "ADMIN_FIRST" : R().levelFromProsecutorLevel(val("in_prosecutorLevel"));
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
  function syncNames() {
    if (tabs) tabs.setOrder(personNames());
  }

  /* ลบแท็บ (ยืนยันก่อน) — คนจากสำนวนเดิม/จำเลยไม่กลับมาเอง เพิ่มกลับได้จาก "+ เพิ่มบุคคล" */
  function confirmRemove(person) {
    if (!global.Swal) return Promise.resolve(true);
    return global.Swal.fire({
      icon: "warning",
      width: 400,
      title: "ลบ " + esc(person) + "?",
      text: "เพิ่มกลับได้จาก + เพิ่มบุคคล",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#b91c1c",
    }).then((r) => !!r.isConfirmed);
  }

  function levelSelectHtml(level) {
    return (
      '<div class="vr-grid" style="margin-bottom:12px">' +
      '<div class="vr-f"><label for="' + P + 'level">ชั้นศาลของคำพิพากษา <span class="vr-req">*</span></label>' +
      '<select id="' + P + 'level"><option value="">-- เลือกชั้นศาล --</option>' +
      /* 2 ส่วน: ศาลคดีอาญาทุจริตและประพฤติมิชอบ / ศาลปกครอง */
      global.ECMISVerdictLists.PARTS.map(
        (part) =>
          '<optgroup label="' + esc(part.name) + '">' +
          global.ECMISVerdictLists.LEVELS.filter((l) => l.part === part.code)
            .map((l) => '<option value="' + l.code + '"' + (l.code === level ? " selected" : "") + ">" + l.name + "</option>")
            .join("") +
          "</optgroup>",
      ).join("") +
      "</select></div>" +
      /* AG สถานะชั้นพนักงานอัยการ (ระดับสำนวน, ไม่บังคับ) */
      F().prosecutorStatusHtml(P, "") +
      "</div>"
    );
  }

  function render() {
    const host = $(HOST_ID);
    if (!host) return;
    F().injectStyle();
    const level = defaultLevel();
    const court = { type: courtSystem(), name: "", blackNo: "", redNo: "", date: "" };
    /* หัวข้อ "บันทึกผลคำพิพากษา" เป็นส่วนพับได้ของหน้า 02 (head_verdictRecord) — ที่นี่เรนเดอร์เฉพาะเนื้อหา */
    host.innerHTML =
      '<label class="vr-f" style="display:flex;gap:8px;align-items:center;font-weight:600;cursor:pointer;margin-bottom:12px">' +
      '<input type="checkbox" id="' + P + 'hasVerdict" style="width:auto;margin:0"> มีผลคำพิพากษา</label>' +
      '<div id="' + P + 'body" class="vr-hide">' +
      levelSelectHtml(level) +
      '<div id="' + P + 'court">' + F().courtStripHtml(P, court, [], level) + "</div>" +
      '<div class="vr-card"><div class="vr-card-h">ผลคำพิพากษารายบุคคล</div><div class="vr-card-b">' +
      '<div id="' + P + 'tabs" class="vr-tabs" aria-label="บุคคล"></div><div id="' + P + 'panel" class="vr-tabpanel"></div></div></div>' +
      '<div id="' + P + 'errors" class="vr-err" role="alert"></div>' +
      '<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<span id="' + P + 'saveState" class="vr-sub" role="status"></span>' +
      '<button type="button" class="btn btn-outline" data-vr02-save="draft">บันทึกร่าง</button>' +
      '<button type="button" class="btn btn-primary" data-vr02-save="done" style="background:#1e3a8a">บันทึก</button>' +
      "</div></div>";

    const courtHost = $(P + "court");
    HIDDEN_KEYS.forEach((k) => {
      const w = courtHost.querySelector('[data-vr-wrap="' + k + '"]');
      if (w) w.classList.add("vr-hide");
    });
    const grid = courtHost.querySelector(".vr-grid");
    if (grid) grid.insertAdjacentHTML("beforeend", '<div class="vr-sub vr-wide" style="margin-top:-6px">เลขคดีดำ/แดงใช้จากส่วนข้อมูลคดีในศาล</div>');
    F().bindForm(courtHost, P);
    courtHost.addEventListener("change", (e) => {
      if (e.target.id === P + "courtType") typeTouched = true;
    });

    tabs = global.ECMISVerdictTabs.create({
      bar: $(P + "tabs"),
      panel: $(P + "panel"),
      prefix: P,
      level: level,
      order: personNames(),
      states: {},
      editable: true,
      showStatus: false,
      emptyHint: "เลือกสำนวนเดิม หรือกรอกจำเลยในส่วนข้อมูลคดีในศาลก่อน",
      canRemove: () => true,
      onAdd: (taken) => global.ECMISVerdictTabs.pickPersons(personNames(), taken),
      onRemove: confirmRemove,
    });

    applyAgDefault();
    $(P + "prosecutorStatus").addEventListener("change", () => {
      agTouched = true;
    });
    $(P + "hasVerdict").addEventListener("change", (e) => {
      $(P + "body").classList.toggle("vr-hide", !e.target.checked);
      if (e.target.checked) syncNames();
    });
    /* รายชื่อจำเลย/สำนวนเดิมอาจเปลี่ยนหลังเรนเดอร์ — อัปเดตแท็บเมื่อผู้ใช้กลับมาที่การ์ด */
    host.addEventListener("focusin", (e) => {
      if (!e.target.closest("#" + P + "panel")) syncNames();
    });
    $(P + "level").addEventListener("change", (e) => {
      levelTouched = true;
      F().setStages(courtHost, P, e.target.value);
      tabs.setLevel(e.target.value);
    });
    const body = $(P + "body");
    body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vr02-save]");
      if (b) onSaveClick(b.getAttribute("data-vr02-save"));
    });
    /* แก้ไขหลังกดบันทึก → แจ้งว่ามีการแก้ไขที่ยังไม่บันทึก */
    body.addEventListener("input", updateSaveState);
    body.addEventListener("change", updateSaveState);
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-vr-tabact],[data-vr-tab]")) global.setTimeout(updateSaveState, 0);
    });
    rendered = true;
    updateSaveState();
  }

  /* ---------- ปุ่มบันทึก / บันทึกร่างของการ์ด ----------
     หน้า 02 ยังไม่มีสำนวนจนกว่าจะกด "ยืนยันรับเรื่อง" — ปุ่มจึงตรวจและจดสถานะของการ์ดไว้ในหน้านี้
     (บันทึก = ทุกคนที่กรอกต้องครบ, บันทึกร่าง = ไม่บังคับ) แล้ว saveFor() เขียนเข้าสำนวนตามสถานะนั้นตอนยืนยัน
     ยังไม่ได้กดบันทึก หรือแก้ไขหลังบันทึก → validateBeforeSubmit() แจ้งให้กดบันทึกก่อน */
  let savedStatus = "";
  let savedSnap = "";
  function snapshot() {
    const c = F().collect($(P + "court"), P);
    return JSON.stringify({
      level: val(P + "level"),
      ag: val(P + "prosecutorStatus"),
      court: c.court,
      files: c.newFileNames,
      entries: tabs.entries(),
    });
  }
  function isSavedCurrent() {
    return !!savedStatus && savedSnap === snapshot();
  }
  function updateSaveState() {
    const el = $(P + "saveState");
    if (!el || !tabs) return;
    const n = tabs.entries().length;
    if (!savedStatus) {
      el.style.color = "";
      el.textContent = n ? "ยังไม่ได้บันทึกส่วนนี้" : "";
      return;
    }
    if (!isSavedCurrent()) {
      el.style.color = "#b45309";
      el.textContent = "มีการแก้ไขที่ยังไม่บันทึก";
      return;
    }
    el.style.color = "#166534";
    el.textContent =
      (savedStatus === "done" ? "บันทึกแล้ว " : "บันทึกร่างแล้ว ") + n + " คน · เข้าสำนวนเมื่อกดยืนยันรับเรื่อง";
  }

  /* ข้อผิดพลาดของการ์ดตามสถานะ (draft | done) → [{ person, errors }] */
  function cardErrors(status) {
    const entries = tabs.entries();
    const level = val(P + "level");
    const court = F().collect($(P + "court"), P).court;
    const list = [];
    if (!entries.length) {
      if (status) list.push({ person: "", errors: ["กรอกผลคำพิพากษาอย่างน้อย 1 คน"] });
      return list;
    }
    if (!R().levelName(level)) list.push({ person: "", errors: ["กรุณาเลือกชั้นศาลของคำพิพากษา"] });
    entries.forEach((e) => {
      const errs = R().validate(level || "FIRST", e.fields, status === "done" ? "done" : "draft");
      if (errs.length) list.push({ person: e.person, errors: errs });
    });
    if (court.name && !court.type) list.push({ person: "", errors: ["กรุณาเลือกประเภทศาล"] });
    return list;
  }

  function onSaveClick(status) {
    const list = cardErrors(status);
    showErrors(list);
    if (list.length) return;
    savedStatus = status;
    savedSnap = snapshot();
    updateSaveState();
    if (global.Swal)
      global.Swal.fire({
        icon: "success",
        width: 400,
        title: status === "done" ? "บันทึกผลคำพิพากษาแล้ว" : "บันทึกร่างผลคำพิพากษาแล้ว",
        text: tabs.entries().length + " คน — บันทึกเข้าสำนวนเมื่อกดยืนยันรับเรื่อง",
        timer: 1600,
        showConfirmButton: false,
      });
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
    syncNames();
    applyAgDefault();
    const courtHost = $(P + "court");
    if (!typeTouched) F().setCourtType(courtHost, P, courtSystem());
    if (levelTouched) return;
    const level = defaultLevel();
    const sel = $(P + "level");
    if (sel && sel.value !== level) {
      sel.value = level;
      F().setStages(courtHost, P, level);
      tabs.setLevel(level);
      /* ตัวเลือกประเภทศาลเปลี่ยนตามส่วนของชั้น (อาญา/ปกครอง) — ตั้งค่าจากหน้า 02 ใหม่อีกครั้ง */
      if (!typeTouched) F().setCourtType(courtHost, P, courtSystem());
    }
  }

  /* ติ๊ก "มีผลคำพิพากษา" เท่านั้นจึงตรวจ/บันทึก — ไม่ติ๊ก = ข้ามทั้งการ์ดแม้จะเคยกรอกไว้ */
  function hasVerdict() {
    return rendered && isApplicable() && !!$(P + "hasVerdict") && $(P + "hasVerdict").checked;
  }

  function showErrors(list) {
    tabs.markErrors(list);
    const box = $(P + "errors");
    if (box) box.innerHTML = list.map((x) => "<div>" + esc((x.person ? x.person + ": " : "") + x.errors.join(" · ")) + "</div>").join("");
    if (list.length && global.ECMISIntakeAccordion) global.ECMISIntakeAccordion.reveal($(HOST_ID));
  }

  /* ตรวจก่อนยืนยันรับเรื่อง — กรอกแล้วต้องกดบันทึก/บันทึกร่างของการ์ดก่อน (และไม่แก้ไขหลังจากนั้น) */
  function validateBeforeSubmit() {
    if (!hasVerdict()) return [];
    const list = cardErrors("draft");
    if (!list.length && tabs.entries().length && !isSavedCurrent()) {
      list.push({
        person: "",
        errors: [savedStatus ? "ผลคำพิพากษามีการแก้ไขหลังบันทึก — กดบันทึก หรือบันทึกร่างอีกครั้ง" : "กดบันทึก หรือบันทึกร่าง ในส่วนผลคำพิพากษาก่อนยืนยัน"],
      });
    }
    showErrors(list);
    return list.map((x) => (x.person ? x.person + ": " : "") + x.errors.join(" · "));
  }

  /* บันทึกเข้าสำนวนหลังสร้าง ตามสถานะที่กดในการ์ด (บันทึก = บันทึกแล้วทุกคน, บันทึกร่าง = ร่างทุกคน) — คืน { saved, count, errors } */
  function saveFor(caseId) {
    if (!hasVerdict() || !savedStatus) return { saved: false };
    const level = val(P + "level");
    const agCase = val(P + "prosecutorStatus");
    /* คนที่ไม่ได้เลือก AG เอง ใช้ค่า AG ของการ์ด (ตั้งต้นจากกรณีอัยการ) */
    const entries = tabs.entries().map((e) =>
      Object.assign(e, {
        status: savedStatus,
        fields: e.fields && !e.fields.prosecutorStatus && agCase ? Object.assign({}, e.fields, { prosecutorStatus: agCase }) : e.fields,
      }),
    );
    if (!entries.length) return { saved: false };
    const kase = global.Activity10.findCaseById(caseId) || {};
    const c = F().collect($(P + "court"), P);
    const courtPart = {
      court: {
        type: c.court.type || kase.courtSystem || "",
        name: c.court.name || kase.courtName || "",
        blackNo: kase.courtBlackNo || "",
        redNo: kase.courtRedNo || "",
        date: c.court.date,
      },
      newFileNames: c.newFileNames,
    };
    const ag = val(P + "prosecutorStatus");
    const res = F().saveLevel(caseId, level, courtPart, entries, ag ? { verdictProsecutorStatus: ag } : null);
    return { saved: res.ok, count: entries.length, errors: res.errors };
  }

  global.ECMISVerdictIntake = { refresh: refresh, saveFor: saveFor, validateBeforeSubmit: validateBeforeSubmit };
  doc.addEventListener("DOMContentLoaded", refresh);
})(window);
