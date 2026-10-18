/* ECMIS 10.1 extras — TOR 10.1 (P3 / B1–B4)
   UI ที่ใช้ร่วมกันของหน้าสายงาน 10.1 (หน้า 03–22) โดยไม่ต้องแก้ทีละหน้า:
   - การ์ด "ข้อมูลสำนวน" (เลขคดีดำ/แดง · ศาล · อายุความ + วันคงเหลือ · หน่วยงานรับผิดชอบ)  10.1.1.2
   - แผง "คำสั่ง/คำพิพากษารายชั้น" + ปุ่มบันทึก (หน้า 18–22)                              10.1.4 / 10.1.10.2–4
   - ผลวิเคราะห์คำพิพากษา รายคำพิพากษา + นำเข้า Excel (เฉพาะสำนวนที่ชี้มูล สายงานกฎหมาย)  10.1.11.1/.4
   - popup แจ้งผลหน่วยงานภายในหลายหน่วย + ร่างหนังสือ                                   10.1.9
   ตรรกะ (patch builder / วันคงเหลือ / ร่างหนังสือ) อยู่ใน ecmis-activity10.js เพื่อให้ทดสอบได้
   ต้องโหลดหลัง ecmis-activity10.js และ ecmis-shell.js; ต้องมี SweetAlert2 สำหรับ popup */
(function (global) {
  "use strict";

  /* หน้า 10.1 = 03–09, 10-legal-*, 11–22 (ไม่รวม 10-2-* / 10-3*) */
  const PAGE_RE = /^(0[3-9]|1[1-9]|2[0-2])-|^10-legal/;
  /* หน้าที่แสดงแผงคำพิพากษา = หลังส่งอัยการ/อสส. */
  const JUDGMENT_PAGE_RE = /^(18|19|2[0-2])-/;
  const PANEL_ID = "ecmis101-extras";
  const ACCEPT = global.ECMIS_DOC_ACCEPT || ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
  const DEFAULT_UNITS = ["กองบริหารคดี (กบค.)"];

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pageFile() {
    return decodeURIComponent((global.location.pathname || "").split("/").pop() || "");
  }

  function findCase(caseId) {
    return global.Activity10 ? global.Activity10.findCaseById(caseId) : null;
  }

  function resolveCase() {
    const A = global.Activity10;
    if (!A) return null;
    const id = new URLSearchParams(global.location.search).get("id");
    const found = id ? A.findCaseById(id) : null;
    if (found) return found;
    return (A.getCases() || []).find((c) => (c.category || "10.1") === "10.1") || null;
  }

  /* ชื่อผู้บันทึก — ใช้ชื่อบทบาทปัจจุบันจากทะเบียน ECMIS.ROLES ถ้ามี */
  function currentActor() {
    try {
      const id = typeof global.getCurrentRole === "function" ? global.getCurrentRole() : "";
      const reg = (global.ECMIS && global.ECMIS.ROLES) || [];
      const r = reg.find((x) => x.id === id || x.login === id);
      return r ? r.name : id;
    } catch (e) {
      return "";
    }
  }

  function filesOf(input) {
    return input && input.files ? Array.from(input.files).map((f) => f.name) : [];
  }

  function fmtDate(iso) {
    const A = global.Activity10;
    return iso && A && A.formatDisplayDate ? A.formatDisplayDate(iso) : iso || "-";
  }

  /* ---------- การ์ดข้อมูลสำนวน (10.1.1.2) ---------- */
  function daysLeftBadge(days) {
    if (days == null) return "";
    if (days < 0)
      return ' <span class="badge" style="background:#fee2e2;color:#991b1b">เลยกำหนด ' + Math.abs(days) + " วัน</span>";
    const warn = days <= 90;
    return (
      ' <span class="badge" style="background:' + (warn ? "#fef3c7" : "#dcfce7") +
      ";color:" + (warn ? "#92400e" : "#166534") + '">เหลือ ' + days + " วัน</span>"
    );
  }

  function caseInfoCard(kase) {
    const tor = global.Activity10.getTorDetails(kase);
    const row = (label, valueHtml) =>
      '<div style="min-width:220px;flex:1 1 220px"><div style="font-size:.78em;color:#64748b">' +
      label + '</div><div style="font-weight:600">' + valueHtml + "</div></div>";
    const presc = tor.prescriptionDate
      ? esc(fmtDate(tor.prescriptionDate)) + daysLeftBadge(tor.prescriptionDaysLeft)
      : "-";
    return (
      '<div class="form-card" style="border:1px solid var(--border-color)">' +
      '<div class="form-card-header"><span><i class="fa-solid fa-gavel text-primary me-2"></i>ข้อมูลสำนวน (เลขคดี · ศาล · อายุความ)</span></div>' +
      '<div class="form-card-body"><div style="display:flex;flex-wrap:wrap;gap:14px 24px">' +
      row("โจทก์", esc(tor.plaintiff)) +
      row("จำเลย", esc(tor.defendant)) +
      row("เลขคดีดำ", esc(tor.blackNo)) +
      row("เลขคดีแดง", esc(tor.redNo)) +
      row("ศาลที่มีคำสั่ง/คำพิพากษา", esc(tor.courtName || "-")) +
      row("วันที่หมดอายุความ", presc) +
      row("รายละเอียดอายุความ", esc(tor.statuteLimitation || "-")) +
      row("หน่วยงานรับผิดชอบ", esc(tor.division)) +
      "</div></div></div>"
    );
  }

  /* ---------- ผลวิเคราะห์คำพิพากษา (10.1.11.1/.4) ----------
     เห็น/บันทึกได้เฉพาะสายงานกฎหมาย และเฉพาะสำนวนที่ชี้มูล (Activity10.isChiMoonCase)
     DB: tbl_law_criminal_judgment_analysis — ดู docs/tor10-p1-db-flow-changes.md §7.6 */
  function isLegalRole() {
    const A = global.Activity10;
    try {
      const raw = global.sessionStorage.getItem("ecmis_role") || "admin_legal";
      return !!A && A.isLegalViewRole(raw);
    } catch (e) {
      return !!A;
    }
  }

  function analysisItemHtml(a) {
    const row = (label, v) =>
      v ? "<div><strong>" + label + ":</strong> " + esc(v).replace(/\n/g, "<br>") + "</div>" : "";
    return (
      '<div style="border-left:3px solid #93c5fd;background:#f8fafc;margin-top:6px;padding:6px 10px;font-size:.85em">' +
      row("ประเด็นแห่งคดี", a.issue) + row("สรุปคำพิพากษา", a.summary) +
      row("ผลการวิเคราะห์", a.analysis) + row("ข้อเสนอแนะ", a.recommendation) +
      ((a.fileNames || []).length ? '<div style="color:#2563eb"><i class="fa-solid fa-paperclip"></i> ' + esc(a.fileNames.join(", ")) + "</div>" : "") +
      '<div style="font-size:.8em;color:#94a3b8">' + esc(a.id || "") + " · บันทึกโดย " + esc(a.analyst || "-") +
      (a.date ? " · " + esc(fmtDate(a.date)) : "") + (a.inputMethod === "IMPORT" ? " · นำเข้าจาก Excel" : "") + "</div></div>"
    );
  }

  /* ผลวิเคราะห์ใต้คำพิพากษาแต่ละรายการ (ref = ดัชนีใน judgments[]) + ปุ่มบันทึกผลวิเคราะห์ */
  function analysisBlock(kase, canAnalyze, ref, idx) {
    if (!canAnalyze) return "";
    const mine = (kase.judgmentAnalyses || []).filter(function (a) { return String(a.judgmentRef) === ref; });
    return (
      '<div style="margin-top:8px">' + mine.map(analysisItemHtml).join("") +
      '<button type="button" class="btn btn-outline" style="margin-top:8px" onclick="openAnalysisDialog(\'' + esc(kase.id) + "'," + idx + ')">' +
      '<i class="fa-solid fa-pen-to-square me-1"></i>บันทึกผลวิเคราะห์</button></div>'
    );
  }

  /* ผลวิเคราะห์ที่ไม่ได้ผูกกับคำพิพากษาใด (เช่น นำเข้า Excel โดยไม่ระบุชั้น) */
  function unlinkedAnalyses(kase, canAnalyze) {
    if (!canAnalyze) return "";
    const list = (kase.judgmentAnalyses || []).filter(function (a) {
      return a.judgmentRef === "" || a.judgmentRef == null || !(kase.judgments || [])[Number(a.judgmentRef)];
    });
    return list.length
      ? '<div style="margin-top:12px;font-weight:600;font-size:.9em">ผลวิเคราะห์ที่ไม่ระบุคำพิพากษา</div>' + list.map(analysisItemHtml).join("")
      : "";
  }

  /* ---------- แผงคำพิพากษารายชั้น (10.1.4 / 10.1.10) + แจ้งภายใน (10.1.9) ---------- */
  function judgmentPanel(kase) {
    const A = global.Activity10;
    const list = kase.judgments || [];
    const legal = isLegalRole();
    const chiMoon = A.isChiMoonCase(kase);
    const canAnalyze = legal && chiMoon;
    const items = list.length
      ? list
          .map(function (j, idx) {
            const files = (j.fileNames || []).length
              ? '<div style="font-size:.8em;color:#2563eb"><i class="fa-solid fa-paperclip"></i> ' + esc(j.fileNames.join(", ")) + "</div>"
              : "";
            return (
              '<div style="border:1px solid var(--border-color);border-radius:8px;padding:10px 14px;margin-bottom:8px">' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
              '<span class="badge" style="background:#dbeafe;color:#1e3a8a">' + esc(A.judgmentLevelName(j.level)) + "</span>" +
              "<strong>" + esc(j.result) + "</strong>" +
              (j.isFinal ? '<span class="badge" style="background:#dcfce7;color:#166534">คดีถึงที่สุด</span>' : "") +
              '<span style="color:#64748b;font-size:.82em">' + esc(fmtDate(j.date)) + "</span></div>" +
              '<div style="font-size:.85em;color:#475569">' +
              (j.issuer ? "ผู้มีคำสั่ง/ศาล: " + esc(j.issuer) + " · " : "") +
              "เลขดำ " + esc(j.blackNo || "-") + " · เลขแดง " + esc(j.redNo || "-") + "</div>" +
              (j.summary ? '<div style="font-size:.85em;margin-top:4px;white-space:pre-line">' + esc(j.summary) + "</div>" : "") +
              files +
              '<div style="font-size:.74em;color:#94a3b8">บันทึกโดย ' + esc(j.recordedBy || "-") + "</div>" +
              analysisBlock(kase, canAnalyze, String(idx), idx) + "</div>"
            );
          })
          .join("")
      : '<div style="color:#94a3b8;font-size:.88em">ยังไม่มีการบันทึกคำสั่ง/คำพิพากษา</div>';

    const notices = (kase.internalNotices || [])
      .map(function (n) {
        return (
          '<div style="border:1px dashed var(--border-color);border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:.85em">' +
          "<strong>" + esc(n.subject) + "</strong>" +
          (n.docNo ? ' <span class="font-monospace">(' + esc(n.docNo) + ")</span>" : "") +
          '<div style="color:#475569">แจ้งถึง: ' + esc(n.units.join(", ")) + " · " + esc(fmtDate(n.date)) + "</div></div>"
        );
      })
      .join("");

    return (
      '<div class="form-card" style="border:1px solid var(--border-color)">' +
      '<div class="form-card-header"><span><i class="fa-solid fa-scale-balanced text-primary me-2"></i>คำสั่ง/คำพิพากษารายชั้น</span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap">' +
      (pageFile().indexOf("22-") === 0 ? "" :
      '<button type="button" class="btn btn-primary" onclick="openJudgmentDialog(\'' + esc(kase.id) + "')\">" +
      '<i class="fa-solid fa-plus me-1"></i>บันทึกคำสั่ง/คำพิพากษา</button>' +
      '<button type="button" class="btn btn-secondary" onclick="openInternalNoticeDialog(\'' + esc(kase.id) + "')\">" +
      '<i class="fa-solid fa-bell me-1"></i>แจ้งผลหน่วยงานภายใน</button>') +
      (canAnalyze
        ? '<button type="button" class="btn btn-outline" onclick="downloadAnalysisTemplate()">' +
          '<i class="fa-solid fa-download me-1"></i>ดาวน์โหลดแม่แบบ</button>' +
          '<button type="button" class="btn btn-outline" onclick="openAnalysisImport(\'' + esc(kase.id) + "')\">" +
          '<i class="fa-solid fa-file-excel me-1"></i>นำเข้าผลวิเคราะห์ (Excel)</button>'
        : "") +
      '</span></div>' +
      '<div class="form-card-body">' + items + unlinkedAnalyses(kase, canAnalyze) +
      (legal && !chiMoon
        ? '<div style="margin-top:10px;font-size:.85em;color:#64748b"><i class="fa-solid fa-circle-info me-1"></i>ผลวิเคราะห์คำพิพากษาบันทึกได้เฉพาะสำนวนที่ชี้มูล (มีมติคณะกรรมการ)</div>'
        : "") +
      (notices ? '<div style="margin-top:12px;font-weight:600;font-size:.9em">แจ้งผลหน่วยงานภายในแล้ว</div>' + notices : "") +
      "</div></div>"
    );
  }

  function render() {
    const host = document.getElementById(PANEL_ID);
    const kase = resolveCase();
    if (!host || !kase) return;
    host.innerHTML = caseInfoCard(kase) + (JUDGMENT_PAGE_RE.test(pageFile()) ? judgmentPanel(kase) : "");
  }

  function mount() {
    if (!global.Activity10 || !PAGE_RE.test(pageFile())) return;
    const kase = resolveCase();
    if (!kase || (kase.category && kase.category !== "10.1")) return;
    const content = document.querySelector(".content");
    if (!content || document.getElementById(PANEL_ID)) return;
    const host = document.createElement("div");
    host.id = PANEL_ID;
    const stepper = content.querySelector(".stepper-card");
    if (stepper && stepper.nextSibling) content.insertBefore(host, stepper.nextSibling);
    else content.insertBefore(host, content.firstChild);
    render();
  }

  /* ---------- popup: บันทึกคำสั่ง/คำพิพากษา (10.1.4) ---------- */
  function openJudgmentDialog(caseId) {
    const A = global.Activity10;
    const kase = findCase(caseId);
    if (!kase || !global.Swal) return;
    const tor = A.getTorDetails(kase);
    const levels = A.JUDGMENT_LEVELS.map((l) => '<option value="' + l.code + '">' + esc(l.name) + "</option>").join("");
    const field = (label, inner) => '<div style="text-align:left;margin-bottom:10px"><label style="font-size:.85em;font-weight:600;display:block;margin-bottom:3px">' + label + "</label>" + inner + "</div>";
    const inp = (id, ph, type, val) => '<input id="' + id + '" type="' + (type || "text") + '" class="swal2-input" style="margin:0;width:100%" placeholder="' + (ph || "") + '" value="' + esc(val || "") + '">';
    global.Swal.fire({
      title: "บันทึกคำสั่ง/คำพิพากษา",
      width: 640,
      html:
        '<div style="max-height:62vh;overflow:auto;padding:2px 6px">' +
        field("ชั้น *", '<select id="jd_level" class="swal2-select" style="margin:0;width:100%">' + levels + "</select>") +
        field("ผู้มีคำสั่ง / ศาล", inp("jd_issuer", "เช่น ศาลอาญาคดีทุจริตและประพฤติมิชอบกลาง", "text", tor.courtName)) +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        field("เลขคดีดำ", inp("jd_black", "", "text", kase.courtBlackNo || "")) +
        field("เลขคดีแดง", inp("jd_red", "", "text", kase.courtRedNo || "")) +
        "</div>" +
        field("วันที่คำสั่ง/คำพิพากษา", inp("jd_date", "", "date", "")) +
        field("ผลคำสั่ง/คำพิพากษา *", inp("jd_result", "เช่น ยกฟ้อง / ลงโทษจำคุก / อัยการสั่งไม่ฟ้อง")) +
        field("สรุปสาระสำคัญ", '<textarea id="jd_summary" class="swal2-textarea" style="margin:0;width:100%" rows="3"></textarea>') +
        '<label style="display:flex;gap:8px;align-items:center;margin-bottom:10px;text-align:left"><input id="jd_final" type="checkbox"> คดีถึงที่สุดแล้ว</label>' +
        field("แนบไฟล์ (PDF, Word, Excel, รูปภาพ)", '<input id="jd_files" type="file" multiple accept="' + ACCEPT + '" class="swal2-file" style="margin:0;width:100%">') +
        "</div>",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      preConfirm: function () {
        const q = (id) => global.Swal.getPopup().querySelector("#" + id);
        const j = {
          level: q("jd_level").value,
          issuer: q("jd_issuer").value,
          blackNo: q("jd_black").value,
          redNo: q("jd_red").value,
          date: q("jd_date").value,
          result: q("jd_result").value,
          summary: q("jd_summary").value,
          isFinal: q("jd_final").checked,
          fileNames: filesOf(q("jd_files")),
        };
        if (!String(j.result).trim()) {
          global.Swal.showValidationMessage("กรุณาระบุผลคำสั่ง/คำพิพากษา");
          return false;
        }
        return j;
      },
    }).then(function (res) {
      if (!res.isConfirmed) return;
      A.addJudgment(caseId, res.value, currentActor());
      render();
      global.Swal.fire({ icon: "success", title: "บันทึกแล้ว", timer: 1200, showConfirmButton: false });
    });
  }

  /* ---------- popup: แจ้งผลหน่วยงานภายใน (10.1.9) ---------- */
  function openInternalNoticeDialog(caseId) {
    const A = global.Activity10;
    const kase = findCase(caseId);
    if (!kase || !global.Swal) return;
    const memo = A.buildInternalNoticeMemo(kase);
    const units = A.INTERNAL_UNITS.map(function (u) {
      const checked = DEFAULT_UNITS.indexOf(u) >= 0 ? " checked" : "";
      return '<label style="display:flex;gap:6px;align-items:center;font-size:.85em;text-align:left"><input type="checkbox" class="in_unit" value="' + esc(u) + '"' + checked + "> " + esc(u) + "</label>";
    }).join("");
    const field = (label, inner) => '<div style="text-align:left;margin-bottom:10px"><label style="font-size:.85em;font-weight:600;display:block;margin-bottom:3px">' + label + "</label>" + inner + "</div>";
    global.Swal.fire({
      title: "แจ้งผลหน่วยงานภายใน",
      width: 680,
      html:
        '<div style="max-height:64vh;overflow:auto;padding:2px 6px">' +
        field("หน่วยงานที่แจ้ง * (เลือกได้หลายหน่วย)", '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;border:1px solid #e2e8f0;border-radius:6px;padding:8px">' + units + "</div>") +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        field("เลขที่หนังสือ", '<input id="in_docNo" class="swal2-input" style="margin:0;width:100%" placeholder="เช่น ปปท 0001/2569">') +
        field("วันที่", '<input id="in_date" type="date" class="swal2-input" style="margin:0;width:100%">') +
        "</div>" +
        field("เรื่อง", '<input id="in_subject" class="swal2-input" style="margin:0;width:100%" value="' + esc(memo.subject) + '">') +
        field("ข้อความ", '<textarea id="in_detail" class="swal2-textarea" style="margin:0;width:100%" rows="6">' + esc(memo.detail) + "</textarea>") +
        field("แนบไฟล์หนังสือแจ้ง (PDF, Word, Excel, รูปภาพ)", '<input id="in_files" type="file" multiple accept="' + ACCEPT + '" class="swal2-file" style="margin:0;width:100%">') +
        "</div>",
      showCancelButton: true,
      confirmButtonText: "บันทึกการแจ้ง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      preConfirm: function () {
        const pop = global.Swal.getPopup();
        const q = (id) => pop.querySelector("#" + id);
        const n = {
          units: Array.from(pop.querySelectorAll(".in_unit:checked")).map((el) => el.value),
          docNo: q("in_docNo").value,
          date: q("in_date").value,
          subject: q("in_subject").value,
          detail: q("in_detail").value,
          fileNames: filesOf(q("in_files")),
        };
        if (!n.units.length) {
          global.Swal.showValidationMessage("กรุณาเลือกหน่วยงานอย่างน้อย 1 หน่วย");
          return false;
        }
        return n;
      },
    }).then(function (res) {
      if (!res.isConfirmed) return;
      A.addInternalNotice(caseId, res.value, currentActor());
      render();
      global.Swal.fire({ icon: "success", title: "บันทึกการแจ้งแล้ว", timer: 1200, showConfirmButton: false });
    });
  }

  /* ---------- popup: บันทึกผลวิเคราะห์คำพิพากษา (10.1.11.1 / .4) ---------- */
  function guardAnalysis(kase) {
    if (!kase || !global.Swal) return false;
    if (global.Activity10.isChiMoonCase(kase) && isLegalRole()) return true;
    global.Swal.fire({ icon: "info", title: "บันทึกผลวิเคราะห์ได้เฉพาะสำนวนที่ชี้มูล", text: "สำนวนนี้ยังไม่มีมติคณะกรรมการ", confirmButtonColor: "#1e3a8a" });
    return false;
  }

  function openAnalysisDialog(caseId, judgmentIndex) {
    const A = global.Activity10;
    const kase = findCase(caseId);
    if (!guardAnalysis(kase)) return;
    const judgments = kase.judgments || [];
    const picked = judgments[judgmentIndex];
    const opts = judgments
      .map(function (j, i) {
        const label = A.judgmentLevelName(j.level) + " · " + (j.result || "-") + (j.date ? " · " + fmtDate(j.date) : "");
        return '<option value="' + i + '"' + (i === judgmentIndex ? " selected" : "") + ">" + esc(label) + "</option>";
      })
      .join("");
    const field = (label, inner) => '<div style="text-align:left;margin-bottom:10px"><label style="font-size:.85em;font-weight:600;display:block;margin-bottom:3px">' + label + "</label>" + inner + "</div>";
    const area = (id, rows, val) => '<textarea id="' + id + '" class="swal2-textarea" style="margin:0;width:100%" rows="' + rows + '">' + esc(val || "") + "</textarea>";
    global.Swal.fire({
      title: "บันทึกผลวิเคราะห์คำพิพากษา",
      width: 680,
      html:
        '<div style="max-height:64vh;overflow:auto;padding:2px 6px">' +
        field("คำพิพากษา/คำสั่งที่วิเคราะห์ *", '<select id="ja_ref" class="swal2-select" style="margin:0;width:100%">' + opts + "</select>") +
        field("ประเด็นแห่งคดี (ถ้ามี)", '<input id="ja_issue" class="swal2-input" style="margin:0;width:100%">') +
        field("สรุปคำพิพากษา", area("ja_summary", 3, picked && picked.summary)) +
        field("ผลการวิเคราะห์ *", area("ja_analysis", 5, "")) +
        field("ข้อเสนอแนะ", area("ja_reco", 3, "")) +
        field("วันที่วิเคราะห์", '<input id="ja_date" type="date" class="swal2-input" style="margin:0;width:100%" value="' + new Date().toISOString().slice(0, 10) + '">') +
        field("แนบไฟล์ (PDF, Word, Excel, รูปภาพ)", '<input id="ja_files" type="file" multiple accept="' + ACCEPT + '" class="swal2-file" style="margin:0;width:100%">') +
        "</div>",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      preConfirm: function () {
        const q = (id) => global.Swal.getPopup().querySelector("#" + id);
        const input = {
          judgmentRef: q("ja_ref").value,
          issue: q("ja_issue").value,
          summary: q("ja_summary").value,
          analysis: q("ja_analysis").value,
          recommendation: q("ja_reco").value,
          date: q("ja_date").value,
          fileNames: filesOf(q("ja_files")),
          inputMethod: "FORM",
        };
        if (!String(input.analysis).trim()) {
          global.Swal.showValidationMessage("กรุณาระบุผลการวิเคราะห์");
          return false;
        }
        return input;
      },
    }).then(function (res) {
      if (!res.isConfirmed) return;
      A.addJudgmentAnalysis(caseId, res.value, currentActor());
      render();
      global.Swal.fire({ icon: "success", title: "บันทึกผลวิเคราะห์แล้ว", timer: 1200, showConfirmButton: false });
    });
  }

  function exportLib() {
    if (global.ECMISExport) return global.ECMISExport;
    if (global.Swal) global.Swal.fire({ icon: "error", title: "ไม่พบตัวช่วยส่งออก/นำเข้า Excel", confirmButtonColor: "#1e3a8a" });
    return null;
  }

  function downloadAnalysisTemplate() {
    const A = global.Activity10;
    const X = exportLib();
    if (!X) return;
    const first = A.JUDGMENT_LEVELS.find((l) => l.code === "FIRST");
    X.downloadTemplate(
      A.ANALYSIS_TEMPLATE_HEADERS,
      ["ประเด็นตัวอย่าง", "สรุปคำพิพากษา", "ผลการวิเคราะห์ (จำเป็น)", "ข้อเสนอแนะ", first ? first.name : "", "", new Date().toISOString().slice(0, 10)],
      "แม่แบบนำเข้าผลวิเคราะห์คำพิพากษา",
    );
  }

  function openAnalysisImport(caseId) {
    const A = global.Activity10;
    const kase = findCase(caseId);
    const X = exportLib();
    if (!X || !guardAnalysis(kase)) return;
    const picker = global.document.createElement("input");
    picker.type = "file";
    picker.accept = ".xlsx,.xls";
    picker.addEventListener("change", function () {
      const file = picker.files && picker.files[0];
      if (!file) return;
      X.readXlsxRows(file)
        .then(function (rows) {
          const mapped = A.mapAnalysisImportRows(rows, kase);
          if (!mapped.items.length) {
            global.Swal.fire({ icon: "warning", title: "ไม่พบแถวที่นำเข้าได้", html: errorsHtml(mapped.errors), confirmButtonColor: "#1e3a8a" });
            return null;
          }
          return global.Swal.fire({
            icon: mapped.errors.length ? "warning" : "question",
            title: "นำเข้าผลวิเคราะห์ " + mapped.items.length + " รายการ?",
            html: errorsHtml(mapped.errors),
            showCancelButton: true,
            confirmButtonText: "นำเข้า",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#1e3a8a",
          }).then(function (res) {
            if (!res.isConfirmed) return;
            A.addJudgmentAnalysis(caseId, mapped.items, currentActor());
            render();
            global.Swal.fire({ icon: "success", title: "นำเข้าแล้ว", timer: 1200, showConfirmButton: false });
          });
        })
        .catch(function (err) {
          global.Swal.fire({ icon: "error", title: "อ่านไฟล์ Excel ไม่สำเร็จ", text: String((err && err.message) || err), confirmButtonColor: "#1e3a8a" });
        });
    });
    picker.click();
  }

  function errorsHtml(errors) {
    if (!errors.length) return "";
    return (
      '<div style="text-align:left;font-size:.9em">ข้ามแถวที่ไม่ถูกต้อง ' + errors.length + " แถว:<br>" +
      errors.slice(0, 5).map((e) => "แถว " + e.row + ": " + esc(e.message)).join("<br>") +
      (errors.length > 5 ? "<br>…" : "") + "</div>"
    );
  }

  global.openAnalysisDialog = openAnalysisDialog;
  global.openAnalysisImport = openAnalysisImport;
  global.downloadAnalysisTemplate = downloadAnalysisTemplate;
  global.openJudgmentDialog = openJudgmentDialog;
  global.openInternalNoticeDialog = openInternalNoticeDialog;
  global.ECMIS101 = { render: render, mount: mount, caseInfoCard: caseInfoCard };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
