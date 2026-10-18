/* ECMIS 10.1 บันทึกผลคำพิพากษา — UI ที่ใช้ร่วม 3 ที่
   - verdict-form.html          หน้าเต็ม ?id=<สำนวน>&level=FIRST|APPEAL|SUPREME
   - 02-board-intake.html       การ์ดพับได้ แสดงเมื่อหมวด 10.1 + กรณีอัยการ 3–9 (ไม่บังคับกรอก)
   - registry.html              แท็บ "ฐานข้อมูลคำพิพากษา" (ecmis-verdict-registry.js)
   ผู้ใช้กรอกเฉพาะ 3 ส่วน (การจัดประเภท · ผลคำพิพากษา · การลงโทษจริง) ช่องอื่นดึงจากสำนวนเดิม/ระบบตอนส่งออก
   ต้องโหลดหลัง ecmis-activity10.js, ecmis-export.js, ecmis-verdict-lists.js, ecmis-verdict-record.js, ecmis-verdict-doc.js */
(function (global) {
  "use strict";

  const A = () => global.Activity10;
  const LS = () => global.ECMISVerdictLists;
  const R = () => global.ECMISVerdictRecord;
  const doc = global.document;
  const ACCEPT = global.ECMIS_DOC_ACCEPT || ".pdf,.doc,.docx,.png,.jpg,.jpeg";
  /* บทบาทที่บันทึก/แก้ไขได้ — สายกฎหมายบทบาทอื่นดูอย่างเดียว */
  const EDIT_ROLES = ["admin_legal", "legal_officer"];

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- บทบาท / ผู้ใช้ ---------- */
  function rawRole() {
    try {
      return global.sessionStorage.getItem("ecmis_role") || "admin_legal";
    } catch (e) {
      return "admin_legal";
    }
  }
  function roleId() {
    const raw = rawRole();
    return (A().ALERT_ROLE_ALIASES || {})[raw] || raw;
  }
  function roleEntry(match) {
    const reg = (global.ECMIS && global.ECMIS.ROLES) || [];
    return reg.find(match) || null;
  }
  function currentActor() {
    const raw = rawRole();
    const id = roleId();
    const r = roleEntry((x) => x.id === raw || x.login === raw || x.id === id);
    return r ? r.name : raw;
  }
  const canEdit = () => EDIT_ROLES.indexOf(roleId()) >= 0;
  const canView = () => A().isLegalViewRole(roleId());

  /* deps ของ ECMISVerdictRecord / ECMISVerdictDoc */
  function deps() {
    return {
      paccDb: A().getPaccIntakeDatabase(),
      act7: LS().ACT7_SAMPLE,
      formatDate: (iso) => (iso ? A().formatDisplayDate(iso) : ""),
      unitOf: (officer) => A().responsibleUnitOf(officer),
      titleOf: (name) => {
        const r = roleEntry((x) => x.name === name);
        return r ? r.title : "";
      },
    };
  }

  /* ---------- สไตล์ (แต่ละหน้ามี .form-card ของตัวเองไม่เหมือนกัน จึงใช้คลาส vr-* แยก) ---------- */
  function injectStyle() {
    if (doc.getElementById("vr-style")) return;
    const s = doc.createElement("style");
    s.id = "vr-style";
    s.textContent =
      ".vr-hide{display:none!important}" +
      ".vr-card{background:var(--bg-card,#fff);border:1px solid var(--border-color,#e2e8f0);border-radius:10px;margin-bottom:14px}" +
      ".vr-card-h{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid var(--border-color,#e2e8f0);font-weight:600;color:var(--text-title,#1e293b)}" +
      ".vr-card-h i{color:#1e3a8a}.vr-card-b{padding:14px 16px}" +
      ".vr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px 14px;margin-bottom:12px}" +
      ".vr-grid .vr-wide{grid-column:1/-1}" +
      ".vr-f label{display:block;font-size:.84em;font-weight:600;color:var(--text-title,#1e293b);margin-bottom:4px}" +
      ".vr-f label .vr-col{font-weight:400;color:#94a3b8;font-size:.9em;margin-left:6px}" +
      ".vr-f input,.vr-f select,.vr-f textarea{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid var(--border-color,#cbd5e1);border-radius:6px;font:inherit;font-size:.92em;background:var(--bg-card,#fff);color:var(--text-main,#0f172a)}" +
      ".vr-f input:focus,.vr-f select:focus,.vr-f textarea:focus{outline:none;border-color:#1e3a8a;box-shadow:0 0 0 3px rgba(30,58,138,.12)}" +
      ".vr-f input:disabled,.vr-f select:disabled,.vr-f textarea:disabled{background:var(--bg-body,#f8fafc);color:#64748b}" +
      ".vr-check{display:flex!important;gap:8px;align-items:center;padding-top:26px}.vr-check input{width:auto!important}" +
      ".vr-sub{font-size:.8em;color:#64748b}.vr-req{color:#dc2626}" +
      ".vr-chips{display:flex;gap:8px;flex-wrap:wrap}" +
      ".vr-chip{border:1px solid var(--border-color,#cbd5e1);background:var(--bg-card,#fff);border-radius:999px;padding:5px 14px;font:inherit;font-size:.85em;cursor:pointer;color:var(--text-title,#1e293b)}" +
      ".vr-chip:hover{border-color:#1e3a8a}.vr-chip.on{background:#1e3a8a;border-color:#1e3a8a;color:#fff}.vr-chip.add{border-style:dashed;color:#64748b}" +
      ".vr-files{font-size:.82em;color:#2563eb;margin-top:4px}" +
      ".vr-badge{display:inline-block;font-size:.78em;padding:2px 10px;border-radius:999px;margin:2px 4px 2px 0}" +
      ".vr-badge.done{background:#dcfce7;color:#166534}.vr-badge.draft{background:#fef3c7;color:#92400e}.vr-badge.none{background:#f1f5f9;color:#64748b}" +
      ".vr-err{color:#dc2626;font-size:.85em;margin-top:6px}";
    doc.head.appendChild(s);
  }

  /* ---------- ฟอร์ม 3 ส่วน ---------- */
  function opt(value, label, current) {
    return '<option value="' + esc(value) + '"' + (String(value) === String(current) ? " selected" : "") + ">" + esc(label) + "</option>";
  }
  function field(p, key, label, col, inner, extraCls) {
    return (
      '<div class="vr-f' + (extraCls ? " " + extraCls : "") + '" data-vr-wrap="' + key + '"><label for="' + p + key + '">' + label +
      (col ? '<span class="vr-col">' + col + "</span>" : "") + "</label>" + inner + "</div>"
    );
  }
  const text = (p, key, val, ph) => '<input id="' + p + key + '" data-vr="' + key + '" type="text" value="' + esc(val) + '" placeholder="' + esc(ph || "") + '">';
  const number = (p, key, val, step) =>
    '<input id="' + p + key + '" data-vr="' + key + '" type="number" min="0" step="' + (step || "1") + '" value="' + esc(val) + '" placeholder="0">';
  function select(p, key, options, val, placeholder) {
    return (
      '<select id="' + p + key + '" data-vr="' + key + '">' + opt("", placeholder || "-- เลือก --", val) +
      options.map((o) => (Array.isArray(o) ? opt(o[0], o[1], val) : opt(o, o, val))).join("") + "</select>"
    );
  }
  function card(icon, title, body) {
    return '<div class="vr-card"><div class="vr-card-h"><i class="fa-solid ' + icon + '"></i>' + title + '</div><div class="vr-card-b">' + body + "</div></div>";
  }

  function natureSubOptions(no) {
    const item = LS().CASE_NATURES.find((n) => n.no === no);
    return item && item.sub ? item.sub : [];
  }
  function needsNatureOther(f) {
    const item = LS().CASE_NATURES.find((n) => n.no === f.caseNatureNo);
    if (!item) return false;
    if (item.sub) return /โปรดระบุ/.test(f.caseNatureSub || "");
    return /โปรดระบุ/.test(item.name);
  }

  function classifySection(p, f, level) {
    const natures = LS().CASE_NATURES.map((n) => [n.no, n.no + ". " + n.name]);
    const subs = natureSubOptions(f.caseNatureNo);
    const stages = LS().VERDICT_STAGES[level] || [];
    return card(
      "fa-tags",
      "1. การจัดประเภท",
      '<div class="vr-grid">' +
        field(p, "statCountAs", "นับสถิติเป็น", "X", text(p, "statCountAs", f.statCountAs, "รอรายการตัวเลือก")) +
        field(p, "trackingGroup", "กลุ่มงานบริหารติดตามรับเรื่อง", "Z", text(p, "trackingGroup", f.trackingGroup, "รอรายการตัวเลือก")) +
        field(p, "verdictType", 'ประเภทคำพิพากษา <span class="vr-req">*</span>', "AA", select(p, "verdictType", LS().VERDICT_TYPES.map((t) => [t.code, t.code + ". " + t.name]), f.verdictType)) +
        field(p, "verdictStage", 'สถานะชั้นคำพิพากษา (fz) <span class="vr-req">*</span>', "AH", select(p, "verdictStage", stages, f.verdictStage)) +
        "</div>" +
        '<div class="vr-grid">' +
        field(p, "caseNatureNo", "ประเภท/ลักษณะคดี", "Y", select(p, "caseNatureNo", natures, f.caseNatureNo), "vr-wide") +
        field(p, "caseNatureSub", "หัวข้อย่อย", "", select(p, "caseNatureSub", subs, f.caseNatureSub), subs.length ? "" : "vr-hide") +
        field(p, "caseNatureOther", "ระบุ (อื่นๆ)", "", text(p, "caseNatureOther", f.caseNatureOther, "โปรดระบุ"), needsNatureOther(f) ? "" : "vr-hide") +
        "</div>",
    );
  }

  function resultSection(p, f, court, fileNames) {
    const files = fileNames.length ? '<div class="vr-files"><i class="fa-solid fa-paperclip"></i> ' + esc(fileNames.join(", ")) + "</div>" : "";
    const date = '<input id="' + p + 'courtDate" data-vr="courtDate" type="date" lang="th-TH-u-ca-buddhist" value="' + esc(court.date) + '">';
    return card(
      "fa-scale-balanced",
      "2. ผลคำพิพากษา",
      '<div class="vr-grid">' +
        field(p, "courtName", "ศาล", "", text(p, "courtName", court.name, "เช่น ศาลอาญาคดีทุจริตและประพฤติมิชอบกลาง")) +
        field(p, "courtBlackNo", "คดีหมายเลขดำที่", "AB", text(p, "courtBlackNo", court.blackNo, "อท.../....")) +
        field(p, "courtRedNo", "คดีหมายเลขแดงที่", "AC", text(p, "courtRedNo", court.redNo, "อท.../....")) +
        field(p, "courtDate", "วันที่ศาลมีคำพิพากษา", "AD", date) +
        '<div class="vr-sub vr-wide" style="margin-top:-6px">ข้อมูลศาลดึงจากสำนวนให้อัตโนมัติ แก้ไขได้เมื่อเป็นชั้นศาลใหม่</div>' +
        field(p, "resultDetail", "รายละเอียด", "AI", '<textarea id="' + p + 'resultDetail" data-vr="resultDetail" rows="3">' + esc(f.resultDetail) + "</textarea>", "vr-wide") +
        field(p, "offenseLaw", "ความผิดตามกฎหมาย/ระเบียบ", "AJ", select(p, "offenseLaw", LS().OFFENSE_LAWS, f.offenseLaw)) +
        field(p, "offenseLawOther", "ระบุ (อื่นๆ)", "", text(p, "offenseLawOther", f.offenseLawOther, "โปรดระบุกฎหมาย/มาตรา"), /^อื่นๆ/.test(f.offenseLaw || "") ? "" : "vr-hide") +
        field(p, "jailYears", "จำคุก (ปี)", "AL", number(p, "jailYears", f.jailYears)) +
        field(p, "jailMonths", "จำคุก (เดือน)", "AK", number(p, "jailMonths", f.jailMonths)) +
        field(p, "fine", "ปรับ (บาท)", "AM", number(p, "fine", f.fine, "0.01")) +
        field(p, "restitutionType", "ชดใช้/คืน (รวมดอกเบี้ย)", "AN", select(p, "restitutionType", LS().RESTITUTION_TYPES, f.restitutionType, "-- ไม่มี --")) +
        field(p, "restitutionAmount", "จำนวนเงิน (บาท)", "AN", number(p, "restitutionAmount", f.restitutionAmount, "0.01")) +
        field(p, "refundUnit", "หน่วยงานที่รับเงินคืน", "AO", text(p, "refundUnit", f.refundUnit)) +
        "</div>" +
        '<div class="vr-grid">' +
        '<div class="vr-f"><label class="vr-check"><input id="' + p + 'isFinal" data-vr="isFinal" type="checkbox"' + (f.isFinal ? " checked" : "") + "> คดีถึงที่สุดแล้ว</label></div>" +
        field(p, "finalLetterNo", "เลขหนังสือคดีถึงที่สุด", "", text(p, "finalLetterNo", f.finalLetterNo, "เลขที่หนังสือ"), f.isFinal ? "" : "vr-hide") +
        field(p, "files", "ไฟล์คำพิพากษา", "", '<input id="' + p + 'files" type="file" multiple accept="' + ACCEPT + '">' + files) +
        "</div>",
    );
  }

  function actualSection(p, f) {
    return card(
      "fa-gavel",
      "3. การลงโทษจริง",
      '<div class="vr-grid">' +
        field(p, "actualJailYears", "จำคุก (ปี)", "AQ", number(p, "actualJailYears", f.actualJailYears)) +
        field(p, "actualJailMonths", "จำคุก (เดือน)", "AP", number(p, "actualJailMonths", f.actualJailMonths)) +
        field(p, "actualFine", "ปรับ (บาท)", "AR", number(p, "actualFine", f.actualFine, "0.01")) +
        field(p, "suspendedYears", "รอลงโทษ (ปี)", "AS", number(p, "suspendedYears", f.suspendedYears)) +
        field(p, "probationYears", "รายงานตัวผู้คุมประพฤติ (ปี)", "AT", number(p, "probationYears", f.probationYears)) +
        field(p, "communityHours", "ทำสาธารณประโยชน์ (ชม.)", "AU", number(p, "communityHours", f.communityHours)) +
        field(p, "damageValue", "มูลค่าความเสียหาย (บาท)", "AW", number(p, "damageValue", f.damageValue, "0.01")) +
        field(p, "actualOther", "อื่นๆ", "AV", text(p, "actualOther", f.actualOther), "vr-wide") +
        "</div>",
    );
  }

  /* HTML ของฟอร์ม; state = ECMISVerdictRecord.initialState(...) */
  function formHtml(p, state, level) {
    return classifySection(p, state.fields, level) + resultSection(p, state.fields, state.court, state.fileNames || []) + actualSection(p, state.fields);
  }

  /* ซ่อน/แสดงช่องที่ขึ้นกับตัวเลือก + เติมหัวข้อย่อยของ Y (ผูกครั้งเดียวต่อ host) */
  function bindForm(host, p) {
    if (host.getAttribute("data-vr-bound") === p) return;
    host.setAttribute("data-vr-bound", p);
    const get = (k) => host.querySelector("#" + p + k);
    const toggle = (k, on) => {
      const w = host.querySelector('[data-vr-wrap="' + k + '"]');
      if (w) w.classList.toggle("vr-hide", !on);
    };
    host.addEventListener("change", (e) => {
      const key = e.target.getAttribute("data-vr");
      if (key === "caseNatureNo") {
        const subs = natureSubOptions(e.target.value);
        get("caseNatureSub").innerHTML = opt("", "-- เลือก --", "") + subs.map((s) => opt(s, s, "")).join("");
        toggle("caseNatureSub", subs.length > 0);
      }
      if (key === "caseNatureNo" || key === "caseNatureSub") {
        toggle("caseNatureOther", needsNatureOther({ caseNatureNo: get("caseNatureNo").value, caseNatureSub: get("caseNatureSub").value }));
      }
      if (key === "offenseLaw") toggle("offenseLawOther", /^อื่นๆ/.test(e.target.value));
      if (key === "isFinal") toggle("finalLetterNo", e.target.checked);
    });
  }

  /* เปลี่ยนชั้นศาล → ตัวเลือกสถานะชั้นคำพิพากษาเปลี่ยนตาม */
  function setStages(host, p, level) {
    const sel = host.querySelector("#" + p + "verdictStage");
    if (!sel) return;
    const cur = sel.value;
    const stages = LS().VERDICT_STAGES[level] || [];
    sel.innerHTML = opt("", "-- เลือก --", "") + stages.map((s) => opt(s, s, cur)).join("");
  }

  function setDisabled(host, disabled) {
    host.querySelectorAll("input,select,textarea").forEach((el) => {
      el.disabled = disabled;
    });
  }

  /* อ่านค่าจากฟอร์ม → { fields, court, newFileNames } */
  function collect(host, p) {
    const input = {};
    host.querySelectorAll("[data-vr]").forEach((el) => {
      const k = el.getAttribute("data-vr");
      input[k] = el.type === "checkbox" ? el.checked : el.value;
    });
    const fileEl = host.querySelector("#" + p + "files");
    return {
      fields: input,
      court: { name: input.courtName, blackNo: input.courtBlackNo, redNo: input.courtRedNo, date: input.courtDate },
      newFileNames: fileEl && fileEl.files ? Array.from(fileEl.files).map((x) => x.name) : [],
    };
  }

  /* มีการกรอกอะไรในส่วนที่ผู้ใช้กรอกหรือไม่ (หน้า 02 ใช้ตัดสินว่าจะบันทึกร่างหรือข้าม) */
  function hasInput(collected) {
    /* ดูค่าดิบ ไม่ใช่ค่าหลัง normalize — ตัวเลขติดลบถูกตัดทิ้งตอน normalize แต่ยังนับว่ากรอก เพื่อให้แจ้ง error ได้ */
    const raw = collected.fields || {};
    return (
      R().INPUT_FIELDS.some((d) => (d.bool ? !!raw[d.key] : String(raw[d.key] == null ? "" : raw[d.key]).trim() !== "")) ||
      String((collected.court && collected.court.date) || "").trim() !== "" ||
      (collected.newFileNames || []).length > 0
    );
  }

  /* บันทึกลงสำนวน — status "draft" | "done"; คืน { ok, errors, kase } */
  function save(caseId, level, collected, status) {
    const kase = A().findCaseById(caseId);
    if (!kase) return { ok: false, errors: ["ไม่พบสำนวน " + caseId] };
    const errors = R().validate(level, collected.fields, status);
    if (errors.length) return { ok: false, errors: errors };
    /* ไฟล์เดิม = ของบันทึกนี้ หรือของคำพิพากษาจาก popup เดิมที่ฟอร์มแสดงอยู่ (initialState) */
    const shown = R().initialState(kase, level).fileNames || [];
    const fileNames = shown.concat(collected.newFileNames || []).filter((n, i, all) => all.indexOf(n) === i);
    const patch = R().buildRecordPatch(kase, level, collected.fields, {
      status: status,
      by: currentActor(),
      court: collected.court,
      fileNames: fileNames,
    });
    if (!patch) return { ok: false, errors: ["บันทึกไม่สำเร็จ"] };
    return { ok: true, errors: [], kase: A().updateCase(caseId, patch) };
  }

  /* ---------- ส่งออก ---------- */
  const safeName = (s) => String(s || "").replace(/[\\/:*?"<>|]/g, "-");
  /* ตราสำนักงานหัวแบบสรุป — Word ฝังรูปได้เฉพาะ data URI จึงแปลงไฟล์ก่อน; โหลดไม่ได้ = ส่งออกโดยไม่มีตรา */
  const LOGO_PATH = "assets/pacc-seal-summary.png";
  let logoDataUri = null;
  function loadLogoDataUri() {
    if (logoDataUri) return Promise.resolve(logoDataUri);
    return global
      .fetch(LOGO_PATH)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("HTTP " + res.status))))
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new global.FileReader();
            reader.onload = () => resolve((logoDataUri = reader.result));
            reader.onerror = () => reject(new Error("อ่านไฟล์ตราไม่สำเร็จ"));
            reader.readAsDataURL(blob);
          }),
      )
      .catch((err) => {
        if (global.console) console.warn("loadLogoDataUri", err);
        return "";
      });
  }
  function downloadWord(caseId) {
    const kase = A().findCaseById(caseId);
    if (!kase) return Promise.resolve(false);
    const Doc = global.ECMISVerdictDoc;
    return loadLogoDataUri().then((logo) => {
      const html = Doc.buildSummaryHtml(kase, Object.assign(deps(), { logoSrc: logo }));
      return global.ECMISExport.toDocx(html, "สรุปการวิเคราะห์คดี_" + safeName(kase.id), Doc.DOCX_OPTIONS);
    });
  }
  function printSummary(caseId) {
    const kase = A().findCaseById(caseId);
    if (!kase) return false;
    /* หน้าต่างพิมพ์เป็น about:blank จึงต้องใช้ URL เต็มของตรา */
    const logo = new global.URL(LOGO_PATH, global.location.href).href;
    const html = global.ECMISVerdictDoc.buildSummaryHtml(kase, Object.assign(deps(), { logoSrc: logo }));
    return global.ECMISExport.printHtml(html, "สรุปการวิเคราะห์คดี " + kase.id);
  }
  function downloadExcel(cases, filename) {
    const head = R().excelHeader();
    const data = R().excelRows(cases, deps());
    return global.ECMISExport.loadScript("xlsx")
      .then((X) => {
        const sheet = X.utils.aoa_to_sheet(head.rows.concat(data));
        sheet["!merges"] = head.merges;
        const book = X.utils.book_new();
        X.utils.book_append_sheet(book, sheet, "ฐาน");
        X.writeFile(book, safeName(filename || "ฐานข้อมูลคำพิพากษา") + ".xlsx");
        return true;
      })
      .catch((err) => {
        if (global.Swal)
          global.Swal.fire({ icon: "error", title: "ส่งออก Excel ไม่สำเร็จ", text: "ไม่สามารถโหลดไลบรารีส่งออก กรุณาลองใหม่", confirmButtonColor: "#1e3a8a" });
        if (global.console) console.error("downloadExcel", err);
        return false;
      });
  }

  /* เติมตัวอย่างบันทึกผลคำพิพากษา (ECMISVerdictLists.SAMPLE_RECORDS) ครั้งเดียวต่อเบราว์เซอร์ */
  /* v2 = เพิ่มตัวอย่างครบทุกส่วน (คดี-100003); สำนวนที่มีบันทึกแล้วจะไม่ถูกเติมซ้ำ */
  const SAMPLE_FLAG = "ecmis_verdict_samples_v2";
  function ensureSamples() {
    try {
      if (global.localStorage.getItem(SAMPLE_FLAG)) return 0;
      const list = R().samplePatches(A().getCases(), LS().SAMPLE_RECORDS);
      list.forEach((x) => A().updateCase(x.caseId, x.patch));
      global.localStorage.setItem(SAMPLE_FLAG, new Date().toISOString());
      return list.length;
    } catch (e) {
      if (global.console) console.warn("ensureSamples", e);
      return 0;
    }
  }

  function statusBadge(rec) {
    if (!rec) return '<span class="vr-badge none">ยังไม่บันทึก</span>';
    return rec.status === "done" ? '<span class="vr-badge done">บันทึกแล้ว</span>' : '<span class="vr-badge draft">ร่าง</span>';
  }

  global.ECMISVerdictForm = {
    EDIT_ROLES: EDIT_ROLES,
    injectStyle: injectStyle,
    formHtml: formHtml,
    bindForm: bindForm,
    setStages: setStages,
    setDisabled: setDisabled,
    collect: collect,
    hasInput: hasInput,
    save: save,
    deps: deps,
    canEdit: canEdit,
    canView: canView,
    currentActor: currentActor,
    downloadWord: downloadWord,
    printSummary: printSummary,
    downloadExcel: downloadExcel,
    statusBadge: statusBadge,
    ensureSamples: ensureSamples,
    esc: esc,
  };
})(window);
