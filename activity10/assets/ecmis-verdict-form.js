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
  /* บทบาทที่บันทึก/แก้ไขได้ (Activity10.VERDICT_EDIT_ROLES) — สายกฎหมายบทบาทอื่นดูอย่างเดียว */
  const EDIT_ROLES = (global.Activity10 && global.Activity10.VERDICT_EDIT_ROLES) || [
    "admin_legal",
    "legal_officer",
  ];

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
  const canView = () => A().isLegalViewRole(roleId()) || canEdit();

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
      /* ไฮไลต์ผลคำพิพากษา (2026-10-27): ลงโทษ แดง · รอการลงโทษ ส้ม · ยกฟ้อง เขียว · จำหน่ายคดี เทา · ถึงที่สุด น้ำเงินเข้ม */
      ".vr-hl{display:inline-flex;align-items:center;gap:4px;font-size:.8em;font-weight:600;padding:2px 10px;border-radius:999px;margin:2px 4px 2px 0;border:1px solid transparent;white-space:nowrap}" +
      ".vr-hl.punish{background:#fee2e2;color:#991b1b;border-color:#fca5a5}.vr-hl.suspend{background:#ffedd5;color:#9a3412;border-color:#fdba74}" +
      ".vr-hl.dismiss{background:#dcfce7;color:#166534;border-color:#86efac}.vr-hl.dispose{background:#e2e8f0;color:#334155;border-color:#cbd5e1}" +
      ".vr-hl.final{background:#1e3a8a;color:#fff}.vr-latest{margin-top:6px;font-size:.92em}" +
      ".vr-suggest{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.vr-suggest-btn{font-size:.78em;padding:3px 10px;border-radius:999px;border:1px dashed #93c5fd;background:#eff6ff;color:#1e3a8a;cursor:pointer}" +
      ".vr-suggest-btn:hover{background:#dbeafe}.vr-suggest-btn:disabled{opacity:.5;cursor:default}" +
      ".vr-err{color:#dc2626;font-size:.85em;margin-top:6px}" +
      /* แท็บรายบุคคล */
      ".vr-tabs{display:flex;gap:2px;align-items:flex-end;border-bottom:1px solid var(--border-color,#cbd5e1);overflow-x:auto;scrollbar-width:thin}" +
      ".vr-tab{display:flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;background:none;padding:8px 14px;font:inherit;font-size:.9em;color:#64748b;cursor:pointer;margin-bottom:-1px}" +
      ".vr-tab:hover{color:#1e3a8a;background:rgba(30,58,138,.05)}" +
      ".vr-tab:focus-visible{outline:2px solid #1e3a8a;outline-offset:-2px}" +
      ".vr-tab[aria-selected=true]{background:var(--bg-card,#fff);border-color:var(--border-color,#cbd5e1);color:var(--text-title,#1e293b);font-weight:600}" +
      ".vr-tab .vr-no{font-size:.8em;min-width:20px;height:20px;border-radius:999px;background:#e2e8f0;color:#334155;display:inline-flex;align-items:center;justify-content:center}" +
      ".vr-tab[aria-selected=true] .vr-no{background:#1e3a8a;color:#fff}" +
      ".vr-dot{width:8px;height:8px;border-radius:50%;background:#cbd5e1;flex:none}" +
      ".vr-dot.done{background:#16a34a}.vr-dot.draft{background:#f59e0b}.vr-dot.err{background:#dc2626}" +
      ".vr-tab .vr-dirty{color:#b45309;font-size:.8em}" +
      ".vr-tab.add{color:#1e3a8a;border-style:dashed;border-color:transparent}" +
      ".vr-tabpanel{border:1px solid var(--border-color,#cbd5e1);border-top:none;border-radius:0 0 10px 10px;padding:14px;background:var(--bg-body,#f8fafc)}" +
      ".vr-tabbar-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}" +
      ".vr-tabbar-tools .btn,.vr-tabbar-tools button{height:32px;padding:4px 12px;font-size:.85em}" +
      ".vr-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:.78em;color:#64748b;margin-top:8px}.vr-legend span{display:inline-flex;align-items:center;gap:5px}";
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
  /* ประเภทคำพิพากษา: ข้อที่มี group อยู่ใน <optgroup> เดียวกัน (ลงโทษ 1.1–1.3)
     รหัสเดิมที่ไม่มีให้เลือกแล้ว (เช่น "1" ลงโทษ) คงไว้ให้เห็น ไม่หายตอนบันทึก */
  function verdictTypeSelect(p, val) {
    const types = LS().VERDICT_TYPES;
    const legacy = val && !types.some((t) => t.code === val) ? LS().verdictType(val) : null;
    let html = opt("", "-- เลือก --", val) + (legacy ? opt(legacy.code, legacy.name + " (ข้อมูลเดิม)", val) : "");
    let group = "";
    types.forEach((t) => {
      if ((t.group || "") !== group) {
        if (group) html += "</optgroup>";
        group = t.group || "";
        if (group) html += '<optgroup label="' + esc(group) + '">';
      }
      html += opt(t.code, t.name, val);
    });
    if (group) html += "</optgroup>";
    return '<select id="' + p + 'verdictType" data-vr="verdictType">' + html + "</select>";
  }
  const needsTypeReason = (code) => {
    const t = LS().verdictType(code);
    return !!(t && t.needsReason);
  };

  /* ช่องข้อความหลายบรรทัด + ปุ่มแนะนำ (กดแล้วต่อท้ายข้อความเป็นบรรทัดใหม่ ไม่ซ้ำบรรทัดเดิม) */
  function suggestArea(p, key, val, list, ph) {
    const chips = (list || [])
      .map((s) => '<button type="button" class="vr-suggest-btn" data-vr-suggest="' + key + '" data-vr-text="' + esc(s) + '">+ ' + esc(s) + "</button>")
      .join("");
    return (
      '<textarea id="' + p + key + '" data-vr="' + key + '" rows="3" placeholder="' + esc(ph || "") + '">' + esc(val) + "</textarea>" +
      (chips ? '<div class="vr-suggest" aria-label="ข้อความแนะนำ">' + chips + "</div>" : "")
    );
  }
  /* ฐานความผิดที่แนะนำ = ฐานความผิดของสำนวน (offenseBases จากหน้ารับเรื่อง) + รายการทั่วไป — หน้าบันทึกตั้งผ่าน setCaseContext */
  let caseOffenseBases = [];
  function setCaseContext(kase) {
    caseOffenseBases = ((kase && kase.offenseBases) || [])
      .map((b) => [b.law, b.section ? "มาตรา " + b.section : "", b.basis ? "(" + b.basis + ")" : ""].filter(Boolean).join(" "))
      .filter(Boolean);
  }
  const offenseBasisSuggestions = () =>
    caseOffenseBases.concat(LS().OFFENSE_BASIS_SUGGESTIONS || []).filter((s, i, all) => all.indexOf(s) === i);

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

  const isAdmin = (level) => LS().levelPart(level) === "ADMIN";

  function classifySection(p, f, level) {
    const natures = LS().CASE_NATURES.map((n) => [n.no, n.no + ". " + n.name]);
    const subs = natureSubOptions(f.caseNatureNo);
    const stages = LS().VERDICT_STAGES[level] || [];
    return card(
      "fa-tags",
      "การจัดประเภท",
      '<div class="vr-grid">' +
        field(p, "statCountAs", "นับสถิติเป็น", "X", text(p, "statCountAs", f.statCountAs, "รอรายการตัวเลือก")) +
        field(p, "trackingGroup", "กลุ่มงานบริหารติดตามรับเรื่อง", "Z", text(p, "trackingGroup", f.trackingGroup, "รอรายการตัวเลือก")) +
        field(p, "verdictType", "ประเภทคำพิพากษา" + (isAdmin(level) ? "" : ' <span class="vr-req">*</span>'), "AA", verdictTypeSelect(p, f.verdictType)) +
        field(p, "verdictTypeOther", 'สาเหตุจำหน่ายคดี <span class="vr-req">*</span>', "", text(p, "verdictTypeOther", f.verdictTypeOther, "โปรดระบุสาเหตุ เช่น จำเลยถึงแก่ความตาย, ขาดอายุความ"), needsTypeReason(f.verdictType) ? "" : "vr-hide") +
        field(p, "verdictStage", 'สถานะชั้นคำพิพากษา <span class="vr-req">*</span>', "AH", select(p, "verdictStage", stages, f.verdictStage)) +
        "</div>" +
        '<div class="vr-grid">' +
        field(p, "caseNatureNo", "ประเภท/ลักษณะคดี", "Y", select(p, "caseNatureNo", natures, f.caseNatureNo), "vr-wide") +
        field(p, "caseNatureSub", "หัวข้อย่อย", "", select(p, "caseNatureSub", subs, f.caseNatureSub), subs.length ? "" : "vr-hide") +
        field(p, "caseNatureOther", "ระบุ (อื่นๆ)", "", text(p, "caseNatureOther", f.caseNatureOther, "โปรดระบุ"), needsNatureOther(f) ? "" : "vr-hide") +
        "</div>",
    );
  }

  /* ---------- ศาล: ประเภทศาล → (ชั้นศาล) → ชื่อศาล (รายการจาก ECMISCourtLists) ---------- */
  const CL = () => global.ECMISCourtLists;
  /* รายชื่อศาลเป็นรายการตัวอย่าง ไม่มี "อื่นๆ" — ชื่อเดิมที่ไม่อยู่ในรายการ (ข้อมูลเก่า) คงไว้เป็นตัวเลือกให้เห็น ไม่หายตอนบันทึก */
  function courtNameOptions(type, level, selected) {
    const list = CL().courtsFor(type, level);
    const head = type ? "-- เลือกชื่อศาล --" : "-- เลือกประเภทศาลก่อน --";
    const legacy = selected && list.indexOf(selected) < 0 ? opt(selected, selected, selected) : "";
    return opt("", head, selected) + list.map((n) => opt(n, n, selected)).join("") + legacy;
  }
  /* ประเภทศาลที่เลือกได้ในชั้นนี้: ชั้นศาลอาญา = ทุจริต/แขวง/จังหวัด, ชั้นศาลปกครอง = ศาลปกครอง (เลือกให้อัตโนมัติ) */
  function courtTypeOptions(level, selected) {
    const types = CL().courtTypesForLevel(level);
    const cur = types.length === 1 ? types[0].code : types.some((t) => t.code === selected) ? selected : "";
    return { html: opt("", "-- เลือก --", cur) + types.map((t) => opt(t.code, t.name, cur)).join(""), value: cur };
  }
  function courtFieldsHtml(p, court, level) {
    const t = courtTypeOptions(level, court.type);
    return (
      field(p, "courtType", "ประเภทศาล", "", '<select id="' + p + 'courtType" data-vr="courtType" data-vr-level="' + esc(level) + '">' + t.html + "</select>") +
      field(
        p,
        "courtName",
        "ชื่อศาล",
        "",
        '<select id="' + p + 'courtName" data-vr="courtName">' + courtNameOptions(t.value, level, court.name) + "</select>" +
          '<div class="vr-sub" style="margin-top:3px">รายการตัวอย่าง (ฉบับร่าง)</div>',
      )
    );
  }
  /* ประเภทศาล/ชั้นศาลเปลี่ยน → ตัวเลือกประเภทศาลและรายชื่อศาลใหม่ (คงค่าเดิมถ้ายังใช้ได้) */
  function refreshCourtNames(host, p, level) {
    const typeSel = host.querySelector("#" + p + "courtType");
    const nameSel = host.querySelector("#" + p + "courtName");
    if (!typeSel || !nameSel) return;
    /* setStages ส่งชั้นมาเสมอ (รวมค่าว่าง = ยังไม่เลือกชั้น) → สร้างตัวเลือกประเภทศาลใหม่ */
    if (level !== undefined) {
      typeSel.setAttribute("data-vr-level", level);
      const t = courtTypeOptions(level, typeSel.value);
      typeSel.innerHTML = t.html;
      typeSel.value = t.value;
    }
    const lv = typeSel.getAttribute("data-vr-level");
    const keep = CL().courtsFor(typeSel.value, lv).indexOf(nameSel.value) >= 0 ? nameSel.value : "";
    nameSel.innerHTML = courtNameOptions(typeSel.value, lv, keep);
  }

  /* ศาลของชั้น (ใช้ร่วมทุกคนในชั้นเดียวกัน): ประเภท/ชื่อศาล เลขคดี วันที่ ไฟล์ — อยู่เหนือแท็บรายบุคคล */
  function courtStripHtml(p, court, fileNames, level) {
    const names = fileNames || [];
    const files = names.length ? '<div class="vr-files"><i class="fa-solid fa-paperclip"></i> ' + esc(names.join(", ")) + "</div>" : "";
    const date = '<input id="' + p + 'courtDate" data-vr="courtDate" type="date" lang="th-TH-u-ca-buddhist" value="' + esc(court.date) + '">';
    return card(
      "fa-building-columns",
      "รายละเอียดศาล <span class=\"vr-sub\" style=\"font-weight:400\">ใช้ร่วมทุกคน</span>",
      '<div class="vr-grid">' +
        courtFieldsHtml(p, court, level) +
        field(p, "courtBlackNo", "คดีหมายเลขดำที่", "AB", text(p, "courtBlackNo", court.blackNo, "อท.../....")) +
        field(p, "courtRedNo", "คดีหมายเลขแดงที่", "AC", text(p, "courtRedNo", court.redNo, "อท.../....")) +
        field(p, "courtDate", "วันที่ศาลมีคำพิพากษา", "AD", date) +
        field(p, "files", "ไฟล์คำพิพากษา", "", '<input id="' + p + 'files" type="file" multiple accept="' + ACCEPT + '">' + files) +
        "</div>",
    );
  }

  function resultSection(p, f, level) {
    return card(
      "fa-scale-balanced",
      "ผลคำพิพากษา",
      '<div class="vr-grid">' +
        /* AG รายบุคคล (2026-10-27) — แต่ละคนต่างกันได้ */
        prosecutorStatusHtml(p, f.prosecutorStatus, true) +
        field(p, "resultDetail", "หมายเหตุ", "AI", '<textarea id="' + p + 'resultDetail" data-vr="resultDetail" rows="3">' + esc(f.resultDetail) + "</textarea>", "vr-wide") +
        /* ประเด็นอุทธรณ์ — เฉพาะชั้นศาลอุทธรณ์ */
        (level === "APPEAL"
          ? field(p, "appealIssue", "ประเด็นอุทธรณ์", "", suggestArea(p, "appealIssue", f.appealIssue, LS().APPEAL_ISSUE_SUGGESTIONS, "กดปุ่มแนะนำด้านล่าง หรือพิมพ์เอง"), "vr-wide")
          : "") +
        field(p, "offenseBasis", "ฐานความผิด", "", suggestArea(p, "offenseBasis", f.offenseBasis, offenseBasisSuggestions(), "กดปุ่มแนะนำด้านล่าง หรือพิมพ์เอง"), "vr-wide") +
        field(p, "offenseLaw", "ความผิดตามกฎหมาย/ระเบียบ", "AJ", select(p, "offenseLaw", LS().OFFENSE_LAWS, f.offenseLaw)) +
        field(p, "offenseLawOther", "ระบุ (อื่นๆ)", "", text(p, "offenseLawOther", f.offenseLawOther, "โปรดระบุกฎหมาย/มาตรา"), /^อื่นๆ/.test(f.offenseLaw || "") ? "" : "vr-hide") +
        field(p, "jailYears", "จำคุก (ปี)", "AL", number(p, "jailYears", f.jailYears)) +
        field(p, "jailMonths", "จำคุก (เดือน)", "AK", number(p, "jailMonths", f.jailMonths)) +
        field(p, "fine", "ปรับ (บาท)", "AM", number(p, "fine", f.fine, "0.01")) +
        field(p, "restitutionType", "ชดใช้/คืน (รวมดอกเบี้ย)", "AN", select(p, "restitutionType", LS().RESTITUTION_TYPES, f.restitutionType, "-- ไม่มี --")) +
        field(p, "restitutionOther", "ระบุ (ชดใช้/คืน อื่นๆ)", "", text(p, "restitutionOther", f.restitutionOther, "โปรดระบุ"), f.restitutionType === "อื่นๆ" ? "" : "vr-hide") +
        field(p, "restitutionAmount", "จำนวนเงิน (บาท)", "AN", number(p, "restitutionAmount", f.restitutionAmount, "0.01")) +
        field(p, "refundUnit", "หน่วยงานที่รับเงินคืน", "AO", text(p, "refundUnit", f.refundUnit)) +
        "</div>" +
        '<div class="vr-grid">' +
        '<div class="vr-f"><label class="vr-check"><input id="' + p + 'isFinal" data-vr="isFinal" type="checkbox"' + (f.isFinal ? " checked" : "") + "> คดีถึงที่สุดแล้ว</label></div>" +
        field(p, "finalLetterNo", "เลขหนังสือคดีถึงที่สุด", "", text(p, "finalLetterNo", f.finalLetterNo, "เลขที่หนังสือ"), f.isFinal ? "" : "vr-hide") +
        "</div>",
    );
  }

  function actualSection(p, f) {
    return card(
      "fa-gavel",
      "การลงโทษจริง",
      '<div class="vr-grid">' +
        field(p, "actualJailYears", "จำคุก (ปี)", "AQ", number(p, "actualJailYears", f.actualJailYears)) +
        field(p, "actualJailMonths", "จำคุก (เดือน)", "AP", number(p, "actualJailMonths", f.actualJailMonths)) +
        field(p, "actualFine", "ปรับ (บาท)", "AR", number(p, "actualFine", f.actualFine, "0.01")) +
        field(p, "suspendedYears", "รอลงโทษ (ปี)", "AS", number(p, "suspendedYears", f.suspendedYears)) +
        field(p, "probationYears", "รายงานตัวผู้คุมประพฤติ (ปี)", "AT", number(p, "probationYears", f.probationYears)) +
        field(p, "communityHours", "ทำสาธารณประโยชน์ (ชม.)", "AU", number(p, "communityHours", f.communityHours)) +
        field(p, "damageValue", "มูลค่าความเสียหาย (บาท)", "AW", number(p, "damageValue", f.damageValue, "0.01")) +
        field(p, "actualOther", "รายละเอียดการลงโทษ", "AV", suggestArea(p, "actualOther", f.actualOther, LS().PUNISH_DETAIL_SUGGESTIONS, "กดปุ่มแนะนำด้านล่าง หรือพิมพ์เอง"), "vr-wide") +
        "</div>",
    );
  }

  /* ฟอร์มของบุคคลหนึ่งคน (3 ส่วน) — แสดงในแท็บรายบุคคล; ศาลปกครองไม่มี "การลงโทษจริง" */
  function personFormHtml(p, fields, level) {
    return classifySection(p, fields, level) + resultSection(p, fields, level) + (isAdmin(level) ? "" : actualSection(p, fields));
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
    /* ปุ่มแนะนำ: ต่อท้ายข้อความ แล้วส่ง input event ให้แท็บรู้ว่ามีการแก้ (ทำเครื่องหมายยังไม่บันทึก) */
    host.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-vr-suggest]");
      if (!btn || btn.disabled) return;
      const area = get(btn.getAttribute("data-vr-suggest"));
      if (!area || area.disabled) return;
      const add = btn.getAttribute("data-vr-text");
      const lines = area.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.indexOf(add) < 0) area.value = lines.concat(add).join(String.fromCharCode(10));
      area.dispatchEvent(new Event("input", { bubbles: true }));
      area.focus();
    });
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
      if (key === "verdictType") toggle("verdictTypeOther", needsTypeReason(e.target.value));
      if (key === "restitutionType") toggle("restitutionOther", e.target.value === "อื่นๆ");
      if (key === "isFinal") toggle("finalLetterNo", e.target.checked);
      if (key === "courtType") refreshCourtNames(host, p);
    });
  }

  /* ตั้งประเภทศาล (ค่าเริ่มต้นจากส่วนคำสั่งอัยการหน้า 02) แล้วเติมรายชื่อศาล */
  function setCourtType(host, p, type) {
    const sel = host.querySelector("#" + p + "courtType");
    if (!sel || sel.value === type) return;
    sel.value = type || "";
    refreshCourtNames(host, p);
  }

  /* เปลี่ยนชั้นศาล → ตัวเลือกสถานะชั้นคำพิพากษาและรายชื่อศาลเปลี่ยนตาม */
  function setStages(host, p, level) {
    refreshCourtNames(host, p, level);
    const sel = host.querySelector("#" + p + "verdictStage");
    if (!sel) return;
    const cur = sel.value;
    const stages = LS().VERDICT_STAGES[level] || [];
    sel.innerHTML = opt("", "-- เลือก --", "") + stages.map((s) => opt(s, s, cur)).join("");
  }

  function setDisabled(host, disabled) {
    host.querySelectorAll("input,select,textarea,.vr-suggest-btn").forEach((el) => {
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
      court: {
        type: input.courtType || "",
        name: input.courtName || "",
        blackNo: input.courtBlackNo,
        redNo: input.courtRedNo,
        date: input.courtDate,
      },
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

  /* AG สถานะชั้นพนักงานอัยการ — select มีหัวข้อกลุ่ม 3. / 4. เป็น optgroup
     perPerson = ช่องในฟอร์มรายบุคคล (มี data-vr ให้ collect เก็บลง fields); หน้ารับเรื่องใช้แบบระดับสำนวน */
  function prosecutorStatusHtml(p, value, perPerson) {
    const list = LS().PROSECUTOR_STATUSES || [];
    const known = [];
    const body = list
      .map((x) => {
        if (typeof x === "string") {
          known.push(x);
          return opt(x, x, value);
        }
        x.items.forEach((i) => known.push(i));
        return '<optgroup label="' + esc(x.group) + '">' + x.items.map((i) => opt(i, i, value)).join("") + "</optgroup>";
      })
      .join("");
    /* ค่าเดิมที่ไม่อยู่ในรายการ (รายการเปลี่ยนภายหลัง) คงไว้ให้เห็น */
    const extra = value && known.indexOf(value) < 0 ? opt(value, value, value) : "";
    return field(
      p,
      "prosecutorStatus",
      "สถานะชั้นพนักงานอัยการ",
      "AG",
      '<select id="' + p + 'prosecutorStatus"' + (perPerson ? ' data-vr="prosecutorStatus"' : "") + ">" + opt("", "-- เลือก --", value) + body + extra + "</select>",
    );
  }

  /* บันทึกทุกคนในชั้นเดียวพร้อมกัน — courtPart = collect(แถบศาล), entries = [{ person, fields, status }]
     caseFields = ช่องระดับสำนวนที่บันทึกพร้อมกัน (เช่น { verdictProsecutorStatus })
     คืน { ok, errors: [{ person, errors }], kase } ; มีคนใดผิด = ไม่บันทึกใครเลย */
  function saveLevel(caseId, level, courtPart, entries, caseFields) {
    const kase = A().findCaseById(caseId);
    if (!kase) return { ok: false, errors: [{ person: "", errors: ["ไม่พบสำนวน " + caseId] }] };
    const court = (courtPart && courtPart.court) || {};
    if (court.name && !court.type) return { ok: false, errors: [{ person: "", errors: ["กรุณาเลือกประเภทศาล"] }] };
    /* ไฟล์เดิมของชั้นนี้ (หรือของคำพิพากษาจาก popup เดิม) + ไฟล์ที่เลือกใหม่ */
    const first = entries && entries[0] ? entries[0].person : "";
    const shown = R().initialState(kase, level, first).fileNames || [];
    const fileNames = shown.concat((courtPart && courtPart.newFileNames) || []).filter((n, i, all) => all.indexOf(n) === i);
    const res = R().buildLevelPatch(kase, level, entries, { by: currentActor(), court: court, fileNames: fileNames });
    if (!res.patch) return { ok: false, errors: res.errors };
    return { ok: true, errors: [], kase: A().updateCase(caseId, Object.assign({}, caseFields || {}, res.patch)) };
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
  /* v3 = แยกรายบุคคล + ประเภทศาล (คดี-100004 มี 2 คน); สำนวนที่มีบันทึกจริงไม่ถูกทับ — แทนเฉพาะตัวอย่างรุ่นก่อน */
  const SAMPLE_FLAG = "ecmis_verdict_samples_v4";
  function ensureSamples() {
    try {
      if (global.localStorage.getItem(SAMPLE_FLAG)) return 0;
      const cases = A().getCases();
      const created = R().sampleNewCases(cases, LS().SAMPLE_RECORDS);
      if (created.length) A().saveCases(cases.concat(created));
      const list = R().samplePatches(A().getCases(), LS().SAMPLE_RECORDS);
      list.forEach((x) => A().updateCase(x.caseId, x.patch));
      global.localStorage.setItem(SAMPLE_FLAG, new Date().toISOString());
      return list.length;
    } catch (e) {
      if (global.console) console.warn("ensureSamples", e);
      return 0;
    }
  }

  /* ปุ่ม "คืนค่าตัวอย่างคำพิพากษา" (registry): คืนสำนวนตัวอย่างใน SAMPLE_RECORDS กลับเป็นข้อมูลตั้งต้น
     สร้างสำนวนตัวอย่างที่ถูกลบกลับมา → ล้างบันทึกของสำนวนตัวอย่าง → เติมตัวอย่างใหม่; สำนวนอื่นไม่ถูกแตะ
     คืน { ok, count, error } */
  function resetSamples() {
    try {
      const samples = LS().SAMPLE_RECORDS;
      const cases = A().getCases();
      const created = R().sampleNewCases(cases, samples);
      if (created.length) A().saveCases(cases.concat(created));
      R().clearSamplePatches(A().getCases(), samples).forEach((x) => A().updateCase(x.caseId, x.patch));
      const list = R().samplePatches(A().getCases(), samples);
      list.forEach((x) => A().updateCase(x.caseId, x.patch));
      global.localStorage.setItem(SAMPLE_FLAG, new Date().toISOString());
      return { ok: true, count: list.length };
    } catch (e) {
      if (global.console) console.error("resetSamples", e);
      return { ok: false, count: 0, error: String((e && e.message) || e) };
    }
  }

  function statusBadge(rec) {
    if (!rec) return '<span class="vr-badge none">ยังไม่บันทึก</span>';
    return rec.status === "done" ? '<span class="vr-badge done">บันทึกแล้ว</span>' : '<span class="vr-badge draft">ร่าง</span>';
  }

  /* ไฮไลต์สถานะสำคัญของคำพิพากษา (ใช้ในหน้าบันทึกและสารบบ): ประเภทคำพิพากษา + คดีถึงที่สุด */
  function verdictTone(code) {
    if (/^1(\.|$)/.test(code || "")) return "punish";
    if (code === "5") return "suspend";
    if (code === "2") return "dismiss";
    return "dispose";
  }
  function verdictHighlight(f) {
    const x = f || {};
    const text = R().verdictTypeText(x);
    return (
      (text ? '<span class="vr-hl ' + verdictTone(x.verdictType) + '">' + esc(text) + "</span>" : "") +
      (x.isFinal ? '<span class="vr-hl final"><i class="fa-solid fa-gavel"></i>ถึงที่สุด</span>' : "")
    );
  }
  /* ผลล่าสุด = ชั้นศาลสูงสุดที่มีบันทึก (ลำดับ ECMISVerdictLists.LEVELS) — 1 คน = ป้ายเดียว, หลายคน = "ชื่อ: ป้าย" */
  function latestVerdictHtml(kase) {
    const recs = R().getRecords(kase).filter((r) => verdictHighlight(r.fields));
    if (!recs.length) return "";
    const order = LS().LEVELS.map((l) => l.code);
    const top = recs.reduce((a, r) => (order.indexOf(r.level) > order.indexOf(a) ? r.level : a), recs[0].level);
    const rows = recs.filter((r) => r.level === top);
    const items = rows
      .map((r) => (rows.length > 1 ? '<span class="vr-sub">' + esc(r.person) + ":</span> " : "") + verdictHighlight(r.fields))
      .join(" ");
    return '<div class="vr-latest"><span class="vr-sub">ผลล่าสุด (' + esc(R().levelName(top)) + "):</span> " + items + "</div>";
  }

  global.ECMISVerdictForm = {
    verdictHighlight: verdictHighlight,
    setCaseContext: setCaseContext,
    latestVerdictHtml: latestVerdictHtml,
    EDIT_ROLES: EDIT_ROLES,
    injectStyle: injectStyle,
    courtStripHtml: courtStripHtml,
    personFormHtml: personFormHtml,
    prosecutorStatusHtml: prosecutorStatusHtml,
    bindForm: bindForm,
    setStages: setStages,
    setCourtType: setCourtType,
    setDisabled: setDisabled,
    collect: collect,
    hasInput: hasInput,
    saveLevel: saveLevel,
    deps: deps,
    canEdit: canEdit,
    canView: canView,
    currentActor: currentActor,
    downloadWord: downloadWord,
    printSummary: printSummary,
    downloadExcel: downloadExcel,
    statusBadge: statusBadge,
    ensureSamples: ensureSamples,
    resetSamples: resetSamples,
    esc: esc,
  };
})(window);
