/* ECMIS 10.3 — รับคำพิพากษา (10-3v-00): เชื่อมคดีรับคำฟ้องเดิม + บันทึกผลคำพิพากษา (2026-10-22)
   1) ช่องที่เติมจากคดีเดิม มีป้าย "เติมจากสำนวนเดิม" (แบบเดียวกับ "เชื่อมโยงสำนวนเดิม" หน้า 02)
      แก้ช่องเองแล้วป้ายหาย · เติมเฉพาะช่องที่ยังว่าง (ยกเว้นศาล/เลขดำ/คู่ความที่หน้าเดิมเติมอยู่แล้ว)
   2) กล่อง "ข้อมูลจากคดีรับคำฟ้องเดิม" (อ่านอย่างเดียว) — นิติกรเดิม เลขรับเดิม การส่งคำให้การ เรื่องเพิ่มเติม ทุเลา
   3) "บันทึกผลคำพิพากษา (ศาลปกครองชั้นต้น)" — ส่วนหนึ่งของสารบบคำพิพากษา (ฐานข้อมูลคำพิพากษา, registry.html)
      ใช้ ECMISVerdictRecord ชั้น ADMIN_FIRST (ช่องชุดเดียวกับบันทึกผลคำพิพากษา 10.1 เฉพาะที่ใช้กับศาลปกครอง)
   ต้องโหลดหลัง ecmis-verdict-lists.js / ecmis-verdict-record.js */
(function (global) {
  "use strict";

  const LEVEL = "ADMIN_FIRST";
  const TAG_CLASS = "vl-autofill-tag";
  const FIELD_CLASS = "vl-autofilled";

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function $(id) { return document.getElementById(id); }
  function clean(v) {
    const t = String(v == null ? "" : v).trim();
    return t === "-" ? "" : t;
  }
  function thaiDate(iso) {
    return iso && global.ECMIS103 ? global.ECMIS103.formatThaiDate(String(iso).slice(0, 10)) : iso || "";
  }

  function injectStyle() {
    if ($("vl-style")) return;
    const s = document.createElement("style");
    s.id = "vl-style";
    s.textContent =
      "." + FIELD_CLASS + "{border-color:#2563eb !important;background-color:rgba(37,99,235,.08) !important;box-shadow:0 0 0 3px rgba(37,99,235,.12)}" +
      /* label เป็น flex space-between — ให้ * ชิดข้อความ ป้ายชิดขวา */
      "label.vl-has-tag{justify-content:flex-start !important}" +
      "." + TAG_CLASS + "{display:inline-flex;align-items:center;gap:4px;margin-left:auto;padding:1px 8px;border-radius:999px;background:#dbeafe;color:#1e3a8a;font-size:.72em;font-weight:600;vertical-align:middle}" +
      ".vl-info{border:1px solid #bfdbfe;background:rgba(37,99,235,.04);border-radius:8px;margin-bottom:16px}" +
      ".vl-info summary{cursor:pointer;padding:10px 14px;font-weight:700;color:#1e3a8a}" +
      ".vl-info dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px 16px;margin:0;padding:2px 14px 14px}" +
      ".vl-info dt{font-weight:400;font-size:.78em;color:#64748b}.vl-info dd{margin:0;font-weight:600;font-size:.88em;word-break:break-word}" +
      /* มูลเหตุ (checkbox หลายข้อ) 2 คอลัมน์ · จอแคบ 1 คอลัมน์ */
      ".vl-cause-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;padding:10px 12px;border:1px solid rgba(100,116,139,.35);border-radius:8px}" +
      "@media (max-width:640px){.vl-cause-grid{grid-template-columns:1fr}}" +
      ".vl-causes label.vl-cause-item{display:flex !important;align-items:flex-start;justify-content:flex-start !important;gap:8px;margin:0;font-weight:400;cursor:pointer;line-height:1.4}" +
      ".vl-causes label.vl-cause-item input{margin-top:3px;flex:0 0 auto;width:16px;height:16px;cursor:pointer}" +
      ".vl-cause-other{margin-top:10px}" +
      ".vl-causes > label.vl-causes-label{justify-content:flex-start !important;gap:4px;flex-wrap:wrap}.vl-causes-hint{margin-left:auto}";
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- 1) ป้ายเติมจากสำนวนเดิม */
  function labelOf(el) {
    const group = el.closest(".form-group");
    return group ? group.querySelector("label") : null;
  }

  /* targets = [id ช่องกรอก หรือ id กล่องรายการ (ผู้ฟ้อง/ผู้ถูกฟ้อง)] */
  function markAutofill(targets) {
    injectStyle();
    targets.forEach(function (id) {
      const el = $(id);
      if (!el) return;
      const label = labelOf(el);
      if (label && !label.querySelector("." + TAG_CLASS)) {
        label.classList.add("vl-has-tag");
        label.insertAdjacentHTML("beforeend", ' <span class="' + TAG_CLASS + '"><i class="fa-solid fa-link"></i>เติมจากสำนวนเดิม</span>');
      }
      const controls = el.matches("input, select, textarea") ? [el] : Array.from(el.querySelectorAll("input"));
      controls.forEach(function (c) { c.classList.add(FIELD_CLASS); });
      /* ผู้ใช้แก้เอง → ไม่ใช่ค่าจากสำนวนเดิมแล้ว */
      const drop = function () {
        Array.from(el.matches("input, select, textarea") ? [el] : el.querySelectorAll("input")).forEach(function (c) { c.classList.remove(FIELD_CLASS); });
        const tag = label && label.querySelector("." + TAG_CLASS);
        if (tag) tag.remove();
      };
      if (!el.dataset.vlBound) {
        el.dataset.vlBound = "1";
        el.addEventListener("input", function (e) { if (e.isTrusted) drop(); });
        el.addEventListener("change", function (e) { if (e.isTrusted) drop(); });
      }
    });
  }

  function clearAutofill() {
    document.querySelectorAll("." + TAG_CLASS).forEach(function (t) { t.remove(); });
    document.querySelectorAll("." + FIELD_CLASS).forEach(function (c) { c.classList.remove(FIELD_CLASS); });
    renderOriginInfo(null);
  }

  /* เติมช่องเพิ่มจากคดีเดิม (เฉพาะที่ยังว่าง/ยังเป็นค่าตั้งต้นของหน้า) — คืน id ที่เติม */
  function fillExtra(c, defaults) {
    const filled = [];
    const fill = function (id, v) {
      const el = $(id);
      const value = clean(v);
      if (!el || !value) return;
      const cur = clean(el.value);
      if (cur && cur !== clean((defaults || {})[id])) return;
      el.value = value;
      filled.push(id);
    };
    fill("in_redCaseNo", c.redCaseNo);
    fill("in_receivingUnit", c.receivingUnit);
    fill("in_courtRemark", c.courtRemark);
    return filled;
  }

  /* ---------------------------------------------------------------- 2) ข้อมูลจากคดีรับคำฟ้องเดิม */
  function originRows(c) {
    const A10 = global.Activity10;
    const ship = c.l3AnswerShipping || {};
    const nos = (ship.evidenceNos || []).filter(Boolean);
    const methodText = ship.method ? String(ship.method).toUpperCase() + (nos.length ? " " + nos.join(", ") : "") : "";
    const items = c.l3AdditionalItems || [];
    const sent = items.filter(function (i) { return i.status === "SENT"; }).length;
    const childId = String(c.id).replace(/\/(\d{4})$/, "-B/$1");
    const child = A10 ? A10.getCases().find(function (k) { return k.id === childId; }) : null;
    return [
      ["คดีรับคำฟ้องเดิม", c.id],
      ["เลขสำนวน ป.ป.ท.", c.paccCaseNo],
      ["นิติกรเจ้าของสำนวนเดิม", c.l3GroupAssignTarget || c.officer],
      ["เลขรับกองกฎหมาย (เดิม)", c.lawReceiveNo],
      ["วันที่รับคำฟ้อง", thaiDate(c.courtReceivedDate)],
      ["ชื่อหมาย", c.summonsName],
      ["หนังสือส่งคำให้การถึงอัยการ", c.l3AnswerExternalDocNo],
      ["ส่งคำให้การ", [methodText, ship.savedAt ? "เมื่อ " + thaiDate(ship.savedAt) : ""].filter(Boolean).join(" ")],
      ["เรื่องเพิ่มเติม", items.length ? items.length + " เรื่อง (ส่งแล้ว " + sent + ")" : ""],
      ["คำขอทุเลา (เคสลูก -B)", child ? child.id + " — " + (child.status || "-") : ""],
      ["สถานะคดีเดิม", c.status],
    ];
  }

  function renderOriginInfo(c) {
    /* ขั้นตอนทั้งหมดของคดีเดิม — กลุ่มพับบนสุดของหน้า (ECMIS103Prev.mountOriginGroup ใน ecmis-10-3-prev.js) */
    if (global.ECMIS103Prev) global.ECMIS103Prev.mountOriginGroup(c);
    const host = $("originInfo");
    if (!host) return;
    if (!c) {
      host.innerHTML = "";
      return;
    }
    injectStyle();
    host.innerHTML =
      '<details class="vl-info"><summary><i class="fa-solid fa-folder-open me-1"></i>ข้อมูลจากคดีรับคำฟ้องเดิม (อ่านอย่างเดียว)</summary><dl>' +
      originRows(c).map(function (r) {
        return "<div><dt>" + esc(r[0]) + "</dt><dd>" + (esc(clean(r[1])) || '<span style="color:#94a3b8">-</span>') + "</dd></div>";
      }).join("") +
      "</dl></details>";
  }

  /* ---------------------------------------------------------------- 3) บันทึกผลคำพิพากษา (สารบบคำพิพากษา) */
  function optionList(list, cur, placeholder) {
    return '<option value="">' + esc(placeholder || "-- ไม่ระบุ --") + "</option>" +
      list.map(function (o) {
        const v = Array.isArray(o) ? o[0] : o;
        const t = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("");
  }

  /* p = prefix ของ id ช่อง (ค่าเริ่ม "vl_") — 10-3v-00 ใช้หลายชุดต่อหน้า (1 ชุดต่อคำพิพากษา)
     f.causes = มูลเหตุที่เติมไว้ล่วงหน้า (จาก l3Causes ของเคส) แก้ไขได้ */
  function recordFieldsHTML(f, p) {
    p = p || "vl_";
    const L = global.ECMISVerdictLists;
    return (
      '<div class="form-group"><label for="' + p + 'verdictStage">สถานะชั้นคำพิพากษา</label>' +
      '<select id="' + p + 'verdictStage" class="form-control">' + optionList(L.VERDICT_STAGES[LEVEL] || [], f.verdictStage) + "</select></div>" +
      causesFieldHTML(p, f.causes, { required: false }) +
      '<div class="form-group"><label for="' + p + 'resultDetail">รายละเอียดผลคำพิพากษา</label>' +
      '<textarea id="' + p + 'resultDetail" class="form-control" rows="3" placeholder="สรุปผลคำพิพากษา">' + esc(f.resultDetail) + "</textarea></div>" +
      '<div class="form-grid-2">' +
      '<div class="form-group"><div class="l3-checkbox-row"><input type="checkbox" id="' + p + 'isFinal"' + (f.isFinal ? " checked" : "") + " />" +
      '<label for="' + p + 'isFinal">คดีถึงที่สุดแล้ว</label></div></div>' +
      '<div class="form-group" id="' + p + 'finalGroup"' + (f.isFinal ? "" : " hidden") + '><label for="' + p + 'finalLetterNo">เลขหนังสือคดีถึงที่สุด</label>' +
      '<input type="text" id="' + p + 'finalLetterNo" class="form-control font-monospace" value="' + esc(f.finalLetterNo) + '" placeholder="เลขที่หนังสือ" /></div>' +
      "</div>"
    );
  }

  function recordCardHTML(f) {
    return (
      '<div class="form-card" id="verdictRecordCard"><div class="form-card-header">' +
      '<span><i class="fa-solid fa-book-bookmark text-primary me-2"></i>บันทึกผลคำพิพากษา (ศาลปกครองชั้นต้น)</span>' +
      '<span class="badge" style="background:#e0e7ff;color:#1e3a8a">สารบบคำพิพากษา</span></div>' +
      '<div class="form-card-body">' +
      '<div class="l3-note l3-note-info" style="margin-bottom:16px"><i class="fa-solid fa-circle-info"></i><div>' +
      "ข้อมูลส่วนนี้บันทึกลง <strong>สารบบคำพิพากษา (ฐานข้อมูลคำพิพากษา)</strong> ชั้น “ศาลปกครองชั้นต้น” ของคดีนี้ — " +
      "ใช้ช่องชุดเดียวกับบันทึกผลคำพิพากษา (เฉพาะที่ใช้กับศาลปกครอง) ดูภายหลังได้ที่เมนู " +
      '<a href="registry.html">สารบบคำวินิจฉัย/คำพิพากษา</a> · ไม่บังคับกรอก ' +
      "(ศาล / เลขคดีดำ-แดง / วันที่พิพากษา / ไฟล์ ใช้จากช่องด้านบน)</div></div>" +
      recordFieldsHTML(f, "vl_") +
      "</div></div>"
    );
  }

  function wireRecord(p) {
    p = p || "vl_";
    wireCauses(p);
    $(p + "isFinal").addEventListener("change", function () { $(p + "finalGroup").hidden = !$(p + "isFinal").checked; });
  }

  function mountRecord(hostId) {
    const host = $(hostId);
    if (!host || !global.ECMISVerdictLists) return;
    host.innerHTML = recordCardHTML({});
    wireRecord("vl_");
  }

  /* fields.causes = { codes, other } หรือ null (ไม่ได้เลือก) */
  function collectRecord(p) {
    p = p || "vl_";
    if (!$(p + "verdictStage")) return {};
    const v = function (id) { return $(p + id) ? $(p + id).value.trim() : ""; };
    return {
      verdictStage: v("verdictStage"),
      causes: collectCauses(p),
      resultDetail: v("resultDetail"),
      isFinal: $(p + "isFinal").checked,
      finalLetterNo: $(p + "isFinal").checked ? v("finalLetterNo") : "",
    };
  }

  /* มูลเหตุอย่างเดียวไม่นับ (เติมล่วงหน้าจากเคส) จึงไม่สร้างบันทึกสารบบเปล่า ๆ แต่หน้า 10-3v-00 ยังเขียนกลับ l3Causes ของเคส */
  function hasAny(f) {
    return !!(f && (f.verdictStage || f.resultDetail || f.isFinal));
  }

  /* ผู้ถูกฟ้องฝั่ง ป.ป.ท. เป็น "บุคคล" ของบันทึก (สารบบแยกรายบุคคล) */
  function personOf(kase) {
    const list = (kase.defendants || []).filter(Boolean);
    return list.find(function (n) { return /ป\.ป\.ท|ป้องกันและปราบปรามการทุจริตในภาครัฐ/.test(n); }) || list[0] || "คณะกรรมการ ป.ป.ท.";
  }

  /* บันทึกลงสารบบ หลังสร้างเคสคำพิพากษาแล้ว — ไม่กรอกอะไรเลย = ข้าม */
  function saveRecord(caseId, fields, extra) {
    const R = global.ECMISVerdictRecord;
    const A10 = global.Activity10;
    if (!R || !hasAny(fields)) return null;
    const kase = A10.findCaseById(caseId);
    if (!kase) return null;
    const e = extra || {};
    /* extra.person / extra.court / extra.fileNames — แทนค่าจากเคส (10-3v-00: 1 บันทึกต่อผู้ถูกฟ้อง ต่อคำพิพากษา) */
    const patch = R.buildRecordPatch(kase, LEVEL, fields, {
      person: e.person || personOf(kase),
      status: fields.verdictStage ? "done" : "draft",
      by: e.by || "",
      court: Object.assign(
        { type: "ADMIN", name: kase.courtName, blackNo: kase.blackCaseNo, redNo: kase.redCaseNo, date: kase.verdictDate },
        e.court || {}
      ),
      fileNames: e.fileNames || kase.attachmentFileNames || [],
    });
    return patch ? A10.updateCase(caseId, patch) : null;
  }

  /* อ่านอย่างเดียว (หน้า v-04 นิติกรวิเคราะห์ผล) */
  function readOnlyHTML(kase) {
    const R = global.ECMISVerdictRecord;
    const rec = R && kase ? R.getRecords(kase).find(function (r) { return r.level === LEVEL; }) : null;
    if (!rec) return '<div class="read-box l3-optional">ธุรการยังไม่ได้บันทึกผลคำพิพากษาลงสารบบคำพิพากษา</div>';
    const f = rec.fields || {};
    const box = function (label, v, wide) {
      return '<div class="form-group"' + (wide ? ' style="grid-column:1/-1"' : "") + "><label>" + esc(label) + '</label><div class="read-box' + (wide ? " read-box-textarea" : "") + '">' + (esc(clean(v)) || "-") + "</div></div>";
    };
    return (
      '<div class="l3-note l3-note-info" style="margin-bottom:12px"><i class="fa-solid fa-book-bookmark"></i><div>' +
      'ข้อมูลจาก<strong>สารบบคำพิพากษา</strong> ชั้นศาลปกครองชั้นต้น ที่ธุรการบันทึกตอนรับคำพิพากษา — ดูทั้งหมดที่ <a href="registry.html">สารบบคำวินิจฉัย/คำพิพากษา</a></div></div>' +
      '<div class="form-grid-2">' +
      box("สถานะชั้นคำพิพากษา", f.verdictStage) +
      box(CAUSES_LABEL, causesText(f.causes || kase.l3Causes)) +
      box("รายละเอียดผลคำพิพากษา", f.resultDetail, true) +
      box("คดีถึงที่สุด", f.isFinal ? "ถึงที่สุดแล้ว" + (f.finalLetterNo ? " — เลขหนังสือ " + f.finalLetterNo : "") : "ยังไม่ถึงที่สุด") +
      box("สถานะในสารบบ", (rec.status === "done" ? "บันทึกแล้ว" : "ร่าง") + (rec.updatedBy ? " · " + rec.updatedBy : "")) +
      "</div>"
    );
  }

  /* ---------------------------------------------------------------- 4) มูลเหตุ (เลือกได้หลายข้อ, 2026-10-27)
     รายการ ECMISVerdictLists.ADMIN_CAUSES (รหัส "1".."7", ข้อ 7 อื่นๆ ต้องระบุ)
     ค่าเดียวของเคส: l3Causes = { codes: ["1","3"], other: "<ข้อความเมื่อเลือก 7>" } หรือ null
     ใช้ที่หน้านิติกร 10-3-04 / 10-3v-04 และสารบบ 10.3 (10-3v-00, แผงศาลปกครองสูงสุด 15/25/36)
     id: p+"causesGroup", checkbox p+"cause_<code>" (name p+"causes"), p+"causeOtherGroup", p+"causeOther" */
  const CAUSES_LABEL = "มูลเหตุ";
  const OTHER_CODE = "7";

  function causeList() {
    const L = global.ECMISVerdictLists;
    return (L && L.ADMIN_CAUSES) || [];
  }

  /* ทำความสะอาด: เฉพาะรหัสที่อยู่ในรายการ เรียงตามรายการ · ไม่มีข้อที่เลือก = null */
  function normalizeCauses(v) {
    if (!v || !Array.isArray(v.codes)) return null;
    const picked = v.codes.map(function (c) { return String(c).trim(); });
    const codes = causeList().map(function (c) { return c.code; }).filter(function (c) { return picked.indexOf(c) >= 0; });
    if (!codes.length) return null;
    return { codes: codes, other: codes.indexOf(OTHER_CODE) >= 0 ? clean(v.other) : "" };
  }

  /* รวมหลายชุด (union) ข้อความอื่นๆ ที่ต่างกันต่อด้วย ", " · คืน null ถ้าไม่มีข้อที่เลือกเลย */
  function mergeCauses(list) {
    const codes = [];
    const others = [];
    (list || []).forEach(function (v) {
      const n = normalizeCauses(v);
      if (!n) return;
      n.codes.forEach(function (c) { if (codes.indexOf(c) < 0) codes.push(c); });
      if (n.other && others.indexOf(n.other) < 0) others.push(n.other);
    });
    return normalizeCauses({ codes: codes, other: others.join(", ") });
  }

  /* opts.required (ค่าเริ่ม true) = แสดง * สีแดง */
  function causesFieldHTML(p, value, opts) {
    p = p || "cs_";
    injectStyle();
    const v = normalizeCauses(value) || { codes: [], other: "" };
    const required = !(opts && opts.required === false);
    const star = ' <span style="color: #dc2626">*</span>';
    const hasOther = v.codes.indexOf(OTHER_CODE) >= 0;
    return (
      '<div class="form-group vl-causes" id="' + p + 'causesGroup">' +
      '<label class="vl-causes-label" id="' + p + 'causesLabel">' + esc(CAUSES_LABEL) + (required ? star : "") +
      ' <span class="vl-causes-hint" style="font-weight:400;color:#64748b;font-size:.85em">(เลือกได้มากกว่า 1 ข้อ)</span></label>' +
      '<div class="vl-cause-grid" role="group" aria-labelledby="' + p + 'causesLabel">' +
      causeList().map(function (c) {
        const id = p + "cause_" + c.code;
        return '<label class="vl-cause-item" for="' + id + '"><input type="checkbox" id="' + id + '" name="' + p + 'causes" value="' + esc(c.code) + '"' +
          (v.codes.indexOf(c.code) >= 0 ? " checked" : "") + " /><span>" + esc(c.code + ". " + c.name) + "</span></label>";
      }).join("") +
      "</div>" +
      '<div class="vl-cause-other" id="' + p + 'causeOtherGroup"' + (hasOther ? "" : " hidden") + ">" +
      '<label for="' + p + 'causeOther">ระบุมูลเหตุอื่นๆ' + star + "</label>" +
      '<input type="text" id="' + p + 'causeOther" class="form-control" maxlength="500" value="' + esc(v.other) + '" placeholder="ระบุมูลเหตุอื่นๆ" /></div>' +
      "</div>"
    );
  }

  /* ใส่ช่องลงใน host แล้วผูก event คืน true ถ้าสำเร็จ */
  function mountCauses(hostId, p, value, opts) {
    const host = $(hostId);
    if (!host || !global.ECMISVerdictLists) return false;
    host.innerHTML = causesFieldHTML(p, value, opts);
    wireCauses(p);
    return true;
  }

  function syncCauseOther(p) {
    const box = $(p + "cause_" + OTHER_CODE);
    const group = $(p + "causeOtherGroup");
    if (box && group) group.hidden = !box.checked;
  }

  function wireCauses(p) {
    p = p || "cs_";
    const box = $(p + "cause_" + OTHER_CODE);
    if (!box || box.dataset.vlCauseBound) return;
    box.dataset.vlCauseBound = "1";
    box.addEventListener("change", function () {
      syncCauseOther(p);
      if (box.checked && $(p + "causeOther")) $(p + "causeOther").focus();
    });
  }

  /* ตั้งค่าใหม่ให้ชุดช่องที่ mount แล้ว (เช่น เติมจากคดีเดิมหลังเลือกคดี) */
  function setCauses(p, value) {
    p = p || "cs_";
    const v = normalizeCauses(value) || { codes: [], other: "" };
    causeList().forEach(function (c) {
      const box = $(p + "cause_" + c.code);
      if (box) box.checked = v.codes.indexOf(c.code) >= 0;
    });
    if ($(p + "causeOther")) $(p + "causeOther").value = v.other;
    syncCauseOther(p);
  }

  /* คืน { codes, other } หรือ null ถ้ายังไม่เลือก */
  function collectCauses(p) {
    p = p || "cs_";
    const codes = causeList().map(function (c) { return c.code; }).filter(function (code) {
      const box = $(p + "cause_" + code);
      return !!(box && box.checked);
    });
    if (!codes.length) return null;
    const other = $(p + "causeOther");
    return { codes: codes, other: codes.indexOf(OTHER_CODE) >= 0 && other ? other.value.trim() : "" };
  }

  /* ตรวจตอนส่ง คืนข้อความเตือน หรือ "" ถ้าครบ */
  function validateCauses(v) {
    if (!v || !Array.isArray(v.codes) || !v.codes.length) return "กรุณาเลือกมูลเหตุอย่างน้อย 1 ข้อ";
    if (v.codes.indexOf(OTHER_CODE) >= 0 && !clean(v.other)) return "กรุณาระบุมูลเหตุอื่นๆ";
    return "";
  }

  /* ข้อความอ่านอย่างเดียว เช่น "1. คณะกรรมการ ป.ป.ท. มีมติชี้มูลความผิด; 7. อื่นๆ (ข้อความ)" */
  function causesText(v) {
    const n = normalizeCauses(v);
    if (!n) return "";
    return n.codes.map(function (code) {
      const item = causeList().find(function (c) { return c.code === code; });
      const name = item ? item.code + ". " + item.name : code;
      return code === OTHER_CODE && n.other ? name + " (" + n.other + ")" : name;
    }).join("; ");
  }

  global.ECMIS103VerdictLink = {
    LEVEL: LEVEL,
    CAUSES_LABEL: CAUSES_LABEL,
    causeList: causeList,
    normalizeCauses: normalizeCauses,
    mergeCauses: mergeCauses,
    causesFieldHTML: causesFieldHTML,
    mountCauses: mountCauses,
    wireCauses: wireCauses,
    setCauses: setCauses,
    collectCauses: collectCauses,
    validateCauses: validateCauses,
    causesText: causesText,
    markAutofill: markAutofill,
    clearAutofill: clearAutofill,
    fillExtra: fillExtra,
    renderOriginInfo: renderOriginInfo,
    mountRecord: mountRecord,
    recordFieldsHTML: recordFieldsHTML,
    wireRecord: wireRecord,
    collectRecord: collectRecord,
    saveRecord: saveRecord,
    readOnlyHTML: readOnlyHTML,
  };
})(window);
