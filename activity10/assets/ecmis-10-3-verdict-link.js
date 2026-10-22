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
      ".vl-info dt{font-weight:400;font-size:.78em;color:#64748b}.vl-info dd{margin:0;font-weight:600;font-size:.88em;word-break:break-word}";
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

  function natureSubs(no) {
    const n = global.ECMISVerdictLists.CASE_NATURES.find(function (x) { return x.no === no; });
    return (n && n.sub) || [];
  }

  function recordCardHTML(f) {
    const L = global.ECMISVerdictLists;
    const natures = L.CASE_NATURES.map(function (n) { return [n.no, n.no + ". " + n.name]; });
    const subs = natureSubs(f.caseNatureNo);
    const needOther = /โปรดระบุ/.test(f.caseNatureSub || "") || f.caseNatureNo === "20";
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
      '<div class="form-grid-2">' +
      '<div class="form-group"><label for="vl_verdictStage">สถานะชั้นคำพิพากษา</label>' +
      '<select id="vl_verdictStage" class="form-control">' + optionList(L.VERDICT_STAGES[LEVEL] || [], f.verdictStage) + "</select></div>" +
      '<div class="form-group"><label for="vl_caseNatureNo">ประเภท/ลักษณะคดี</label>' +
      '<select id="vl_caseNatureNo" class="form-control">' + optionList(natures, f.caseNatureNo) + "</select></div>" +
      "</div>" +
      '<div class="form-grid-2">' +
      '<div class="form-group" id="vl_subGroup"' + (subs.length ? "" : " hidden") + '><label for="vl_caseNatureSub">หัวข้อย่อย</label>' +
      '<select id="vl_caseNatureSub" class="form-control">' + optionList(subs, f.caseNatureSub) + "</select></div>" +
      '<div class="form-group" id="vl_otherGroup"' + (needOther ? "" : " hidden") + '><label for="vl_caseNatureOther">ระบุ (อื่นๆ)</label>' +
      '<input type="text" id="vl_caseNatureOther" class="form-control" value="' + esc(f.caseNatureOther) + '" placeholder="โปรดระบุ" /></div>' +
      "</div>" +
      '<div class="form-group"><label for="vl_resultDetail">รายละเอียดผลคำพิพากษา</label>' +
      '<textarea id="vl_resultDetail" class="form-control" rows="3" placeholder="สรุปผลคำพิพากษา">' + esc(f.resultDetail) + "</textarea></div>" +
      '<div class="form-grid-2">' +
      '<div class="form-group"><div class="l3-checkbox-row"><input type="checkbox" id="vl_isFinal"' + (f.isFinal ? " checked" : "") + " />" +
      '<label for="vl_isFinal">คดีถึงที่สุดแล้ว</label></div></div>' +
      '<div class="form-group" id="vl_finalGroup"' + (f.isFinal ? "" : " hidden") + '><label for="vl_finalLetterNo">เลขหนังสือคดีถึงที่สุด</label>' +
      '<input type="text" id="vl_finalLetterNo" class="form-control font-monospace" value="' + esc(f.finalLetterNo) + '" placeholder="เลขที่หนังสือ" /></div>' +
      "</div></div></div>"
    );
  }

  function wireRecord() {
    const no = $("vl_caseNatureNo");
    const sub = $("vl_caseNatureSub");
    const syncOther = function () {
      $("vl_otherGroup").hidden = !(/โปรดระบุ/.test(sub.value || "") || no.value === "20");
    };
    no.addEventListener("change", function () {
      const subs = natureSubs(no.value);
      sub.innerHTML = optionList(subs, "");
      $("vl_subGroup").hidden = !subs.length;
      syncOther();
    });
    sub.addEventListener("change", syncOther);
    $("vl_isFinal").addEventListener("change", function () { $("vl_finalGroup").hidden = !$("vl_isFinal").checked; });
  }

  function mountRecord(hostId) {
    const host = $(hostId);
    if (!host || !global.ECMISVerdictLists) return;
    host.innerHTML = recordCardHTML({});
    wireRecord();
  }

  function collectRecord() {
    if (!$("vl_verdictStage")) return {};
    const v = function (id) { return $(id) ? $(id).value.trim() : ""; };
    return {
      verdictStage: v("vl_verdictStage"),
      caseNatureNo: v("vl_caseNatureNo"),
      caseNatureSub: $("vl_subGroup").hidden ? "" : v("vl_caseNatureSub"),
      caseNatureOther: $("vl_otherGroup").hidden ? "" : v("vl_caseNatureOther"),
      resultDetail: v("vl_resultDetail"),
      isFinal: $("vl_isFinal").checked,
      finalLetterNo: $("vl_isFinal").checked ? v("vl_finalLetterNo") : "",
    };
  }

  function hasAny(f) {
    return !!(f && (f.verdictStage || f.caseNatureNo || f.resultDetail || f.isFinal));
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
    const patch = R.buildRecordPatch(kase, LEVEL, fields, {
      person: personOf(kase),
      status: fields.verdictStage ? "done" : "draft",
      by: e.by || "",
      court: { type: "ADMIN", name: kase.courtName, blackNo: kase.blackCaseNo, redNo: kase.redCaseNo, date: kase.verdictDate },
      fileNames: kase.attachmentFileNames || [],
    });
    return patch ? A10.updateCase(caseId, patch) : null;
  }

  /* อ่านอย่างเดียว (หน้า v-04 นิติกรวิเคราะห์ผล) */
  function readOnlyHTML(kase) {
    const R = global.ECMISVerdictRecord;
    const L = global.ECMISVerdictLists;
    const rec = R && kase ? R.getRecords(kase).find(function (r) { return r.level === LEVEL; }) : null;
    if (!rec) return '<div class="read-box l3-optional">ธุรการยังไม่ได้บันทึกผลคำพิพากษาลงสารบบคำพิพากษา</div>';
    const f = rec.fields || {};
    const nature = L.CASE_NATURES.find(function (n) { return n.no === f.caseNatureNo; });
    const box = function (label, v, wide) {
      return '<div class="form-group"' + (wide ? ' style="grid-column:1/-1"' : "") + "><label>" + esc(label) + '</label><div class="read-box' + (wide ? " read-box-textarea" : "") + '">' + (esc(clean(v)) || "-") + "</div></div>";
    };
    return (
      '<div class="l3-note l3-note-info" style="margin-bottom:12px"><i class="fa-solid fa-book-bookmark"></i><div>' +
      'ข้อมูลจาก<strong>สารบบคำพิพากษา</strong> ชั้นศาลปกครองชั้นต้น ที่ธุรการบันทึกตอนรับคำพิพากษา (10-3v-00) — ดูทั้งหมดที่ <a href="registry.html">สารบบคำวินิจฉัย/คำพิพากษา</a></div></div>' +
      '<div class="form-grid-2">' +
      box("สถานะชั้นคำพิพากษา", f.verdictStage) +
      box("ประเภท/ลักษณะคดี", nature ? nature.no + ". " + nature.name + (f.caseNatureSub ? " — " + f.caseNatureSub : "") + (f.caseNatureOther ? " (" + f.caseNatureOther + ")" : "") : "") +
      box("รายละเอียดผลคำพิพากษา", f.resultDetail, true) +
      box("คดีถึงที่สุด", f.isFinal ? "ถึงที่สุดแล้ว" + (f.finalLetterNo ? " — เลขหนังสือ " + f.finalLetterNo : "") : "ยังไม่ถึงที่สุด") +
      box("สถานะในสารบบ", (rec.status === "done" ? "บันทึกแล้ว" : "ร่าง") + (rec.updatedBy ? " · " + rec.updatedBy : "")) +
      "</div>"
    );
  }

  global.ECMIS103VerdictLink = {
    LEVEL: LEVEL,
    markAutofill: markAutofill,
    clearAutofill: clearAutofill,
    fillExtra: fillExtra,
    renderOriginInfo: renderOriginInfo,
    mountRecord: mountRecord,
    collectRecord: collectRecord,
    saveRecord: saveRecord,
    readOnlyHTML: readOnlyHTML,
  };
})(window);
