/* =====================================================================
   E-CMIS 10.3 — บันทึกผลการลงนามจริง (หมึก) ของเอกสารที่ส่งออกนอกสำนักงาน
   (docs/wet-sign/plan.md)
   ผู้บริหารลงนามบนกระดาษ → ธุรการ (หรือนิติกร) บันทึกผล: สแกน + วันที่ลงนาม
   E-sign ในระบบเป็นเพียง "ยืนยันในระบบ" — ไม่ประทับลงบนเอกสารที่ส่งออก

   ข้อมูลบนเคส:
     l3WetSign[docKey] = { version, signerRole, signerName, signedDate,
                           scanFiles:[ชื่อไฟล์], recordedBy, recordedAt, note }
     l3DocLock[docKey] = { version, lockedBy, lockedAt }
   docKey: "answer" | "coverLetter" | "stayObjection"

   ต้องโหลดหลัง ecmis-10-3.js (ใช้ ECMIS103.formatThaiDate / renderAttachments)
   ถ้าหน้ามี ecmis-th-datepicker.js ช่องวันที่จะแสดงเป็น พ.ศ. อัตโนมัติ
   ===================================================================== */
(function (global) {
  "use strict";

  const STYLE_ID = "ecmis-wetsign-style";
  const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg"];
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const BYTES_PER_MB = 1024 * 1024;

  const CSS =
    ".ws-card{border:2px solid #1e3a8a}" +
    ".ws-card>.form-card-header{background:rgba(30,58,138,.05)}" +
    ".ws-badge-ver{background:#e0e7ff;color:#1e3a8a}" +
    ".ws-badge-signed{background:#dcfce7;color:#166534}" +
    ".ws-badge-none{background:#f1f5f9;color:#64748b}" +
    ".ws-badge-draft{background:#fef3c7;color:#92400e}" +
    ".ws-file-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border-color);border-radius:6px;margin-bottom:6px;font-size:.85em}" +
    ".ws-file-row .ws-file-name{flex:1;word-break:break-all}" +
    ".ws-file-size{color:#94a3b8}" +
    ".ws-signed{border:1px solid var(--border-color);border-radius:8px;padding:12px 14px;background:var(--bg-card)}" +
    ".ws-signed+.ws-signed{margin-top:12px}" +
    ".ws-signed-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;font-weight:600;color:var(--text-title)}" +
    ".ws-signed-empty{color:#64748b;font-size:.9em;display:flex;align-items:center;gap:8px}" +
    ".ws-print-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}" +
    /* ฉบับจริงแสดงทีละฉบับเต็มความกว้าง ขนาดจริง A4 (100%) — ปุ่ม −/+ ของตัวแสดงผลย่อ/ขยายได้ 2026-10-22 */
    ".ws-print-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}" +
    ".ws-print-grid .l3-split-preview{position:static;max-height:none;overflow:visible}" +
    ".ws-print-grid .l3-doc-pageframe{min-height:600px;max-height:calc(100vh - 160px);overflow:auto}";

  /* ไฟล์ที่เลือกในแต่ละการ์ด — เก็บแยกตาม container (แทนที่ทั้ง array ทุกครั้ง ไม่แก้ของเดิม) */
  const fileState = new WeakMap();

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveEl(containerEl) {
    return typeof containerEl === "string" ? document.getElementById(containerEl) : containerEl;
  }

  function thaiDate(iso) {
    if (!iso) return "-";
    return global.ECMIS103 && ECMIS103.formatThaiDate ? ECMIS103.formatThaiDate(iso) : iso;
  }

  function thaiNow() {
    return global.ECMIS103 && ECMIS103.formatThaiDateTime
      ? ECMIS103.formatThaiDateTime(new Date())
      : new Date().toISOString();
  }

  function todayIso() {
    return global.Activity103 && Activity103.toISODate
      ? Activity103.toISODate(new Date())
      : new Date().toISOString().slice(0, 10);
  }

  function record(caseObj, docKey) {
    return (caseObj && caseObj.l3WetSign && caseObj.l3WetSign[docKey]) || null;
  }

  function lockOf(caseObj, docKey) {
    return (caseObj && caseObj.l3DocLock && caseObj.l3DocLock[docKey]) || null;
  }

  /* ---------------------------------------------------------- LOCK HELPERS */
  function isLocked(caseObj, key) {
    return !!lockOf(caseObj, key);
  }

  /* คืน patch { l3DocLock } — ฉบับใหม่ = ฉบับล่าสุดที่เคยล็อก + 1
     (l3DocLockHistory เก็บเลขล่าสุดไว้ เพราะ unlockDocs ลบรายการล็อกออก) */
  function lockDocs(caseObj, keys, by) {
    const prevLocks = (caseObj && caseObj.l3DocLock) || {};
    const history = (caseObj && caseObj.l3DocLockHistory) || {};
    const at = thaiNow();
    const added = (keys || []).reduce(function (acc, key) {
      const prevVersion = Math.max(
        (prevLocks[key] && prevLocks[key].version) || 0,
        history[key] || 0,
      );
      acc.locks[key] = { version: prevVersion + 1, lockedBy: by || "-", lockedAt: at };
      acc.history[key] = prevVersion + 1;
      return acc;
    }, { locks: {}, history: {} });
    return {
      l3DocLock: Object.assign({}, prevLocks, added.locks),
      l3DocLockHistory: Object.assign({}, history, added.history),
    };
  }

  /* ปลดล็อก (ส่งกลับแก้ไข) — คืน patch { l3DocLock } ที่ไม่มี key เหล่านั้น */
  function unlockDocs(caseObj, keys) {
    const prevLocks = (caseObj && caseObj.l3DocLock) || {};
    const drop = keys || [];
    const kept = Object.keys(prevLocks)
      .filter(function (k) { return drop.indexOf(k) < 0; })
      .reduce(function (acc, k) {
        acc[k] = prevLocks[k];
        return acc;
      }, {});
    return { l3DocLock: kept };
  }

  function versionFor(caseObj, docKey, explicit) {
    if (explicit) return explicit;
    const lock = lockOf(caseObj, docKey);
    if (lock && lock.version) return lock.version;
    const rec = record(caseObj, docKey);
    return (rec && rec.version) || 1;
  }

  /* --------------------------------------------------------------- RECORDER
     opts = { docKey, docLabel, signerLabel, version, caseObj, noteLabel, notePlaceholder } */
  function renderRecorder(containerEl, opts) {
    const host = resolveEl(containerEl);
    if (!host) return null;
    injectStyles();
    const o = opts || {};
    const key = o.docKey;
    const version = versionFor(o.caseObj, key, o.version);
    /* เติมค่าเดิมเฉพาะเมื่อเป็นฉบับเดียวกัน — ถูกส่งกลับแก้ไขแล้วพิมพ์ฉบับใหม่ต้องบันทึกใหม่ */
    const rec = record(o.caseObj, key);
    const prev = rec && Number(rec.version || 1) === Number(version) ? rec : null;
    const ids = {
      date: "ws_" + key + "_date",
      file: "ws_" + key + "_file",
      list: "ws_" + key + "_files",
      note: "ws_" + key + "_note",
    };

    host.dataset.wsDoc = key;
    host.dataset.wsVersion = String(version);
    host.innerHTML =
      '<div class="form-card ws-card">' +
      '<div class="form-card-header">' +
      '<span><i class="fa-solid fa-file-signature text-primary me-2"></i>บันทึกผลการลงนามจริง — ' + esc(o.docLabel) + "</span>" +
      '<span class="badge ws-badge-ver"><i class="fa-solid fa-lock me-1"></i>พิมพ์จากฉบับล็อกครั้งที่ ' + esc(version) + "</span>" +
      "</div>" +
      '<div class="form-card-body">' +
      '<div class="l3-note l3-note-info" style="margin-bottom:16px"><i class="fa-solid fa-circle-info"></i>' +
      "<div>ผู้ลงนามลงนามด้วยหมึกบนเอกสารฉบับจริง (พิมพ์จากฉบับที่ล็อกไว้ในระบบ) — แนบสแกนฉบับที่ลงนามแล้ว และระบุวันที่ตามที่ลงในเอกสาร</div></div>" +
      '<div class="form-grid-2">' +
      '<div class="form-group"><label>ผู้ลงนาม</label><div class="read-box">' + esc(o.signerLabel || "-") + "</div></div>" +
      '<div class="form-group"><label>วันที่ลงนาม (ตามเอกสาร) <span style="color:#dc2626">*</span></label>' +
      '<input type="date" id="' + ids.date + '" class="form-control" /></div>' +
      "</div>" +
      '<div class="form-group"><label>ไฟล์สแกนฉบับลงนามจริง (PDF / รูปภาพ) <span style="color:#dc2626">*</span></label>' +
      '<div class="l3-upload-box"><input type="file" id="' + ids.file + '" accept=".pdf,.png,.jpg,.jpeg" multiple /></div>' +
      '<div id="' + ids.list + '" style="margin-top:8px"></div></div>' +
      '<div class="form-group"><label>' + esc(o.noteLabel || "ฉบับจริงอยู่ที่ / หมายเหตุ") + "</label>" +
      '<textarea id="' + ids.note + '" class="form-control" rows="2" placeholder="' +
      esc(o.notePlaceholder || "เช่น ฉบับจริงเก็บที่ธุรการกองกฎหมาย (ถ้ามี)") + '"></textarea></div>' +
      "</div></div>";

    const dateEl = document.getElementById(ids.date);
    dateEl.max = todayIso();
    dateEl.value = (prev && prev.signedDateISO) || "";
    document.getElementById(ids.note).value = (prev && prev.note) || "";
    fileState.set(host, ((prev && prev.scanFiles) || []).map(function (n) { return { name: n, size: null }; }));
    renderFileList(host, ids.list);

    document.getElementById(ids.file).addEventListener("change", function (e) {
      addFiles(host, e.target, ids.list);
    });
    if (global.ThaiDatePicker && ThaiDatePicker.enhance) ThaiDatePicker.enhance(dateEl);
    return host;
  }

  function addFiles(host, input, listId) {
    const picked = Array.from(input.files || []);
    const rejected = [];
    const accepted = picked.filter(function (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ALLOWED_EXT.indexOf(ext) < 0) {
        rejected.push('"' + file.name + '" ไม่ใช่ชนิดที่รองรับ (PDF, PNG, JPG, JPEG)');
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push('"' + file.name + '" มีขนาดเกิน 100 MB');
        return false;
      }
      return true;
    });
    const current = fileState.get(host) || [];
    const names = current.map(function (f) { return f.name; });
    const merged = current.concat(
      accepted
        .filter(function (f) { return names.indexOf(f.name) < 0; })
        .map(function (f) { return { name: f.name, size: f.size }; }),
    );
    fileState.set(host, merged);
    input.value = "";
    renderFileList(host, listId);
    if (rejected.length && global.Swal) {
      Swal.fire({ icon: "warning", title: "ไฟล์ไม่ถูกต้อง", html: rejected.map(esc).join("<br />"), confirmButtonColor: "#1e3a8a" });
    }
  }

  function renderFileList(host, listId) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    const files = fileState.get(host) || [];
    listEl.innerHTML = files
      .map(function (f, idx) {
        const size = f.size == null ? "" : ' <span class="ws-file-size">(' + (f.size / BYTES_PER_MB).toFixed(2) + " MB)</span>";
        return (
          '<div class="ws-file-row"><i class="fa-solid fa-paperclip" style="color:#2563eb"></i>' +
          '<span class="ws-file-name">' + esc(f.name) + size + "</span>" +
          '<button type="button" class="btn btn-secondary" style="padding:2px 8px;font-size:.78em" data-ws-remove="' + idx + '" title="ลบไฟล์นี้">' +
          '<i class="fa-solid fa-trash-can"></i></button></div>'
        );
      })
      .join("");
    listEl.querySelectorAll("[data-ws-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const at = Number(btn.dataset.wsRemove);
        fileState.set(host, (fileState.get(host) || []).filter(function (_, i) { return i !== at; }));
        renderFileList(host, listId);
      });
    });
  }

  function fieldsOf(host) {
    const key = host.dataset.wsDoc;
    return {
      key: key,
      dateEl: document.getElementById("ws_" + key + "_date"),
      noteEl: document.getElementById("ws_" + key + "_note"),
      files: fileState.get(host) || [],
    };
  }

  /* คืนข้อความช่องที่ยังขาด (ข้อความแรกที่พบ) หรือ null ถ้าครบ */
  function validate(containerEl) {
    const host = resolveEl(containerEl);
    if (!host || !host.dataset.wsDoc) return "ไม่พบแบบบันทึกผลการลงนามจริง";
    const f = fieldsOf(host);
    const label = host.querySelector(".form-card-header span");
    const docText = label ? label.textContent.replace("บันทึกผลการลงนามจริง — ", "") : "";
    if (!f.files.length) return "กรุณาแนบไฟล์สแกนฉบับลงนามจริง — " + docText;
    const iso = f.dateEl ? f.dateEl.value : "";
    if (!iso) return "กรุณาระบุวันที่ลงนาม (ตามเอกสาร) — " + docText;
    if (iso > todayIso()) return "วันที่ลงนามต้องไม่เป็นวันในอนาคต — " + docText;
    return null;
  }

  /* opts = { docKey, signerRole, signerName, version, recordedBy }
     คืน { [docKey]: {...} } ให้รวมเข้า l3WetSign แบบไม่แก้ของเดิม:
     Object.assign({}, case.l3WetSign, result) */
  function collect(containerEl, opts) {
    const host = resolveEl(containerEl);
    if (!host) return {};
    const o = opts || {};
    const f = fieldsOf(host);
    const key = o.docKey || f.key;
    const iso = f.dateEl ? f.dateEl.value : "";
    const out = {};
    out[key] = {
      version: o.version || Number(host.dataset.wsVersion) || 1,
      signerRole: o.signerRole || "",
      signerName: o.signerName || "",
      signedDate: iso ? thaiDate(iso) : "",
      signedDateISO: iso,
      scanFiles: f.files.map(function (x) { return x.name; }),
      recordedBy: o.recordedBy || "",
      recordedAt: thaiNow(),
      note: f.noteEl ? f.noteEl.value.trim() : "",
    };
    return out;
  }

  /* ------------------------------------------------------------ SIGNED VIEW
     แสดงฉบับลงนามจริง (อ่านอย่างเดียว) — ใช้ในหน้าถัดไป (รวบรวม / ส่งอัยการ) */
  function renderSignedView(containerEl, caseObj, docKey, docLabel) {
    const host = resolveEl(containerEl);
    if (!host) return;
    injectStyles();
    const rec = record(caseObj, docKey);
    const head =
      '<div class="ws-signed-head"><span><i class="fa-solid fa-file-signature text-primary me-2"></i>' + esc(docLabel) + "</span>";
    /* 2026-10-22 ไม่มีขั้นธุรการบันทึกผลลงนาม (10-3-18/19/22) แล้ว — ใช้ฉบับลงนามจริงที่นิติกรแนบที่ 10-3-13 */
    const liveKey = docKey === "coverLetter" ? "letter" : docKey;
    const scan = !rec && caseObj && caseObj.l3LiveDocs && caseObj.l3LiveDocs[liveKey] && caseObj.l3LiveDocs[liveKey].signedFileName;
    if (scan) {
      const scanId = "ws_scan_" + liveKey + "_" + Math.random().toString(36).slice(2, 8);
      host.innerHTML =
        '<div class="ws-signed">' + head +
        '<span class="badge ws-badge-signed"><i class="fa-solid fa-pen-nib me-1"></i>ฉบับลงนามจริง</span></div>' +
        '<div class="form-group"><label>ไฟล์สแกนฉบับลงนามจริง <span style="font-weight:400;color:#64748b">(แนบโดยนิติกรที่ 10-3-13)</span></label>' +
        '<div id="' + scanId + '"></div></div></div>';
      if (global.ECMIS103) ECMIS103.renderAttachments(scanId, [scan]);
      return;
    }
    if (!rec) {
      host.innerHTML =
        '<div class="ws-signed">' + head +
        '<span class="badge ws-badge-none"><i class="fa-solid fa-hourglass-half me-1"></i>รอบันทึกผล</span></div>' +
        '<div class="ws-signed-empty"><i class="fa-solid fa-circle-info"></i>ยังไม่มีฉบับลงนามจริง</div></div>';
      return;
    }
    const listId = "ws_view_" + docKey + "_" + Math.random().toString(36).slice(2, 8);
    host.innerHTML =
      '<div class="ws-signed">' + head +
      '<span class="badge ws-badge-signed"><i class="fa-solid fa-pen-nib me-1"></i>ฉบับลงนามจริง</span></div>' +
      '<div class="form-grid-2">' +
      '<div class="form-group"><label>ผู้ลงนาม</label><div class="read-box">' + esc(rec.signerName || "-") + "</div></div>" +
      '<div class="form-group"><label>วันที่ลงนาม (ตามเอกสาร)</label><div class="read-box">' + esc(rec.signedDate || "-") + "</div></div>" +
      "</div>" +
      '<div class="form-group"><label>ไฟล์สแกนฉบับลงนามจริง <span style="font-weight:400;color:#64748b">(พิมพ์จากฉบับล็อกครั้งที่ ' + esc(rec.version || 1) + ")</span></label>" +
      '<div id="' + listId + '"></div></div>' +
      '<div class="form-grid-2">' +
      '<div class="form-group"><label>ฉบับจริงอยู่ที่ / หมายเหตุ</label><div class="read-box read-box-textarea">' + esc(rec.note || "-") + "</div></div>" +
      '<div class="form-group"><label>บันทึกผลโดย</label><div class="read-box">' + esc((rec.recordedBy || "-") + (rec.recordedAt ? " เมื่อ " + rec.recordedAt : "")) + "</div></div>" +
      "</div></div>";
    if (global.ECMIS103 && ECMIS103.renderAttachments) {
      ECMIS103.renderAttachments(listId, rec.scanFiles);
    }
  }

  /* ------------------------------------------------------- PRINT (ฉบับจริง)
     สร้างคำให้การ / หนังสือนำส่งจากเอกสารสดที่นิติกรเสนอ (case.l3LiveDocs)
     บนแบบฟอร์มทางการเดิม — ช่องลงนามว่างไว้สำหรับลงนามด้วยหมึก
     ไม่ประทับลายเซ็นอิเล็กทรอนิกส์ ไม่มี QR / รหัสอ้างอิง  ต้องโหลด ecmis-10-3-docs.js */
  function roleName(roleId) {
    const roles = (global.ECMIS && ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name : "";
  }

  function firstName(full) {
    return String(full || "").replace(/^(นาย|นางสาว|นาง)/, "").split(" ")[0] || "";
  }

  function liveParts(caseObj, docKey) {
    const saved = (caseObj && caseObj.l3LiveDocs && caseObj.l3LiveDocs[docKey]) || null;
    if (!saved) return null;
    const fields = saved.fields || {};
    const editors = saved.editors || {};
    return {
      val: function (id) { return fields[id] == null ? "" : String(fields[id]); },
      html: function (id) { return editors[id] || ""; },
    };
  }

  function ctrlInitials(caseObj) {
    const sigs = (caseObj && caseObj.l3Signatures) || {};
    const short = function (code) {
      return sigs[code] && sigs[code].signedAt ? String(sigs[code].signedAt).split(" ").slice(0, 3).join(" ") : "";
    };
    const initials = function (code, roleId) { return sigs[code] ? firstName(roleName(roleId)) : ""; };
    return { short: short, initials: initials };
  }

  function buildPrintModels(caseObj) {
    const D = global.ECMIS103Docs;
    if (!D || !caseObj) return null;
    const ci = ctrlInitials(caseObj);
    const out = {};
    const L = liveParts(caseObj, "letter");
    if (L) {
      out.coverLetter = D.letter({
        isCopy: L.val("l_copyMark") === "สำเนา",
        urgency: L.val("l_urgency"),
        docNo: caseObj.l3AnswerExternalDocNo || "ปป 0003/",
        address: L.val("l_address"),
        docDate: D.thaiLongDate(L.val("l_docDate")),
        subject: L.val("l_subject"),
        to: L.val("l_to"),
        ref: L.val("l_ref"),
        enclosures: L.val("l_enclosures").split("\n"),
        html: L.html("l_body"),
        closing: L.val("l_closing"),
        signer: { sig: null, waitText: "", name: L.val("l_signerName"), position: L.val("l_signerPos") },
        footer: L.val("l_footer").split("\n").filter(function (x) { return x.trim(); }),
        ctrl: [
          { key: "ผู้อำนวยการกอง", value: ci.initials("L3-25", "dir_legal"), date: ci.short("L3-25") },
          { key: "ผู้อำนวยการกลุ่ม", value: ci.initials("L3-24", "case_group_director"), date: ci.short("L3-24") },
          { key: "เจ้าหน้าที่", value: ci.initials("L3-22", "case_legal_officer"), date: ci.short("L3-22") },
        ],
      });
    }
    const A = liveParts(caseObj, "answer");
    if (A) {
      const dp = D.dateParts(A.val("a_date"));
      out.answer = D.answer({
        isCopy: A.val("a_copyMark") === "สำเนา",
        subtitle: A.val("a_subtitle"),
        respondentNo: A.val("a_respondentNo"),
        blackNo: A.val("a_blackNo"),
        redNo: A.val("a_redNo") || "/๒๕....",
        court: A.val("a_court"),
        day: dp ? dp.day : "",
        month: dp ? dp.month : "",
        year: dp ? dp.year : "",
        plaintiffs: caseObj.plaintiffs,
        defendants: caseObj.defendants,
        me: {
          name: A.val("a_meName"), role: A.val("a_meRole"), birthDay: A.val("a_birthDay"), birthMonth: A.val("a_birthMonth"),
          birthYear: A.val("a_birthYear"), age: A.val("a_age"), occupation: A.val("a_occupation"), address: A.val("a_address"),
          moo: A.val("a_moo"), road: A.val("a_road"), soi: A.val("a_soi"), subdistrict: A.val("a_subdistrict"),
          district: A.val("a_district"), province: A.val("a_province"), postcode: A.val("a_postcode"), phone: A.val("a_phone"),
        },
        submitType: A.val("a_submitType"),
        html: A.html("a_body"),
        signer: { sig: null, waitText: "", name: A.val("a_signerName"), position: A.val("a_signerPos") },
        ctrl: [
          { key: "รอง ลธ.ป.ป.ท.", value: "", date: "" },
          { key: "ผอ.กกม.", value: ci.initials("L3-25", "dir_legal"), date: ci.short("L3-25") },
          { key: "จนท.", value: ci.initials("L3-22", "case_legal_officer"), date: ci.short("L3-22") },
        ],
      });
    }
    /* สายคัดค้านทุเลา (เคสลูก -B) — เอกสารสดจาก 10-3b-01 เก็บที่ l3LiveDocs.stayObjection */
    const S = liveParts(caseObj, "stayObjection");
    if (S && D.stayObjectionModel) {
      out.stayObjection = D.stayObjectionModel(S.val, S.html, caseObj);
    }
    return out;
  }

  /* พิมพ์หน้ากระดาษที่ตัวแสดงผลสร้างไว้ (ผ่าน iframe ซ่อน ไม่ต้องเปิดหน้าต่างใหม่) */
  function printPages(viewerHost, title) {
    const stack = viewerHost && viewerHost.querySelector(".l3p-stack");
    if (!stack) return;
    const cssHref = new URL("assets/ecmis-10-3-paper.css", global.location.href).href;
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(
      '<!doctype html><html lang="th"><head><meta charset="utf-8" /><base href="' + esc(global.location.href) + '" />' +
      "<title>" + esc(title || "พิมพ์ฉบับจริง") + "</title>" +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" />' +
      '<link rel="stylesheet" href="' + esc(cssHref) + '" />' +
      "<style>@page{size:A4;margin:0}html,body{margin:0;background:#fff}" +
      ".l3p-page{box-shadow:none!important;display:block!important;page-break-after:always;break-after:page}" +
      ".l3p-page:last-child{page-break-after:auto;break-after:auto}</style></head><body>" +
      stack.innerHTML +
      "</body></html>",
    );
    doc.close();
    const fire = function () {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(function () { frame.remove(); }, 1000);
    };
    if (doc.readyState === "complete") setTimeout(fire, 300);
    else frame.onload = function () { setTimeout(fire, 300); };
  }

  /* การ์ด "ฉบับจริงสำหรับลงนาม" — พรีวิวอ่านอย่างเดียว + พิมพ์ / ดาวน์โหลด
     opts = { docs: [{ docKey, label, fileName }] } (ค่าเริ่มต้น: หนังสือนำส่ง + คำให้การ;
     สายคัดค้านทุเลาส่ง docs: [{ docKey: "stayObjection", ... }]) */
  const ACTUAL_SIZE = 1;

  function renderPrintDocs(containerEl, caseObj, opts) {
    const host = resolveEl(containerEl);
    if (!host) return;
    injectStyles();
    const o = opts || {};
    const black = (caseObj && caseObj.blackCaseNo) || "";
    const docs = o.docs || [
      { docKey: "coverLetter", label: "หนังสือขอให้แก้ต่างถึงอธิบดีอัยการ (หนังสือนำส่ง)", fileName: "หนังสือนำส่ง " + black },
      { docKey: "answer", label: "คำให้การ (ค.๓)", fileName: "คำให้การ " + black },
    ];
    const models = buildPrintModels(caseObj);
    const hasAny = models && docs.some(function (d) { return models[d.docKey]; });
    if (!hasAny) {
      host.innerHTML =
        '<div class="l3-note l3-note-warn"><i class="fa-solid fa-triangle-exclamation"></i>' +
        "<div>ไม่พบเอกสารสดที่นิติกรเสนอในสำนวนนี้ (สำนวนเดิมแนบเป็นไฟล์) — กรุณาพิมพ์จากไฟล์ร่างที่แนบไว้</div></div>";
      return;
    }
    /* แท็บต่อฉบับ (แบบเดียวกับแท็บ "เอกสารที่นิติกรเสนอ") — วาดพรีวิวเมื่อเปิดแท็บ เพราะแท็บที่ซ่อนวัดขนาดหน้าไม่ได้ */
    const uid = "ws_print_" + Math.random().toString(36).slice(2, 8);
    const shown = docs.filter(function (d) { return models[d.docKey]; });
    host.innerHTML =
      '<div class="l3-doc-tabs" role="tablist">' +
      shown
        .map(function (d, i) {
          return '<button type="button" class="l3-doc-tab' + (i === 0 ? " is-active" : "") + '" role="tab" data-ws-tab="' + d.docKey + '">' +
            '<i class="fa-solid ' + (d.docKey === "answer" ? "fa-scale-balanced" : "fa-envelope") + '"></i>' + esc(d.label) + "</button>";
        })
        .join("") +
      "</div>" +
      shown
        .map(function (d, i) {
          return '<div class="ws-print-pane" data-ws-pane="' + d.docKey + '"' + (i === 0 ? "" : " hidden") + ">" +
            '<div class="ws-print-actions"><button type="button" class="btn btn-secondary" data-ws-print="' + d.docKey + '">' +
            '<i class="fa-solid fa-print me-1"></i>พิมพ์ฉบับจริง (แบบฟอร์มทางการ) — ' + esc(d.label) + "</button></div>" +
            '<div class="ws-print-grid"><div id="' + uid + "_" + d.docKey + '"></div></div></div>';
        })
        .join("");
    const viewers = {};
    shown.forEach(function (d) {
      const v = ECMIS103Docs.createViewer(uid + "_" + d.docKey, { title: d.label + " (ฉบับจริง)", fileName: d.fileName, zoom: o.zoom || ACTUAL_SIZE });
      if (v) viewers[d.docKey] = v;
    });
    function show(key) {
      host.querySelectorAll("[data-ws-tab]").forEach(function (b) { b.classList.toggle("is-active", b.dataset.wsTab === key); });
      host.querySelectorAll("[data-ws-pane]").forEach(function (p) { p.hidden = p.dataset.wsPane !== key; });
      if (viewers[key]) viewers[key].render(models[key]);
    }
    host.querySelectorAll("[data-ws-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () { show(btn.dataset.wsTab); });
    });
    if (shown.length) show(shown[0].docKey);
    host.querySelectorAll("[data-ws-print]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const v = viewers[btn.dataset.wsPrint];
        const d = docs.find(function (x) { return x.docKey === btn.dataset.wsPrint; });
        if (v) printPages(v.host, d && d.fileName);
      });
    });
  }

  global.ECMISWetSign = {
    renderRecorder: renderRecorder,
    validate: validate,
    collect: collect,
    renderSignedView: renderSignedView,
    lockDocs: lockDocs,
    unlockDocs: unlockDocs,
    isLocked: isLocked,
    buildPrintModels: buildPrintModels,
    renderPrintDocs: renderPrintDocs,
    printPages: printPages,
  };
})(window);
