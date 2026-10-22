/* ค้นหาสำนวน — แผงค้นหาชุดเดียวที่ใช้ร่วมกันทุกหน้า มี 2 แหล่งข้อมูล (opts.source):
   - "pacc"  สำนวนใน ป.ป.ท. (Activity10.getPaccIntakeDatabase) — เลือกแล้วเติมฟอร์ม/เชื่อมเลขสำนวน (onSelect)
   - "legal" สำนวนในกองกฎหมาย (Activity10.getCases = เคสที่ธุรการรับเข้าระบบแล้ว) — ดูอย่างเดียว ไม่เชื่อมข้อมูล
             ถ้าไม่พบ ธุรการบันทึกรับเรื่องใหม่ในหน้า 02-board-intake.html
   - "legacy" ข้อมูลระบบเดิมกองกฎหมาย (กจ.10, ECMISLegacy.lawSource) — ดูอย่างเดียว
   สำนวน ป.ป.ท. ที่นำเข้าจากระบบเดิม (legacyIms) แสดงแผงประวัติ กจ.5/กจ.6 ท้ายรายละเอียด
   ใช้ใน 02-board-intake.html, หน้านิติกร 10-3-04 / 10-3v-11 / 10-3v-19 และ search-case.html
   ECMISCaseSearch.mountPanel(host, opts) สร้าง markup + ผูกเหตุการณ์ในตัว ⇒ ทุกหน้าหน้าตาเหมือนกัน · ไม่แก้ข้อมูลสำนวน */
(function (global) {
  "use strict";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function lower(v) {
    return String(v == null ? "" : v).toLowerCase();
  }

  function joinList(v) {
    return Array.isArray(v) ? v.filter(Boolean).join(", ") : v || "";
  }

  function formatDate(iso) {
    const picker = global.ThaiDatePicker;
    if (picker && iso) return picker.isoToDisplay(iso) || iso;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + (Number(m[1]) + 543) : iso;
  }

  function accusedName(c) {
    const A10 = global.Activity10;
    return A10 && A10.fullName ? A10.fullName(c.accused, c.accusedPosition) : c.accused;
  }

  /* ---------------------------------------------------------------- แหล่งข้อมูล
     filters: key → [ป้าย, getter(c), placeholder, monospace]
     rows: แถวของตัวกรอง · columns: [หัวคอลัมน์, getter(c) → [บรรทัดหลัก, บรรทัดรอง?]] */
  const SOURCES = {
    pacc: {
      title: "ค้นหาสำนวนใน ป.ป.ท.",
      notFound: "ไม่พบข้อมูลสำนวนใน ป.ป.ท.",
      cases: function () {
        const A10 = global.Activity10;
        return A10 && A10.getPaccIntakeDatabase ? A10.getPaccIntakeDatabase() : [];
      },
      caseNo: function (c) {
        return c.paccCaseNo || String(c.id || "").replace(/^.*?-/, "");
      },
      query: function (c) {
        const A10 = global.Activity10;
        return [c.id, c.paccCaseNo, c.blackNo, c.redNo, c.accuser, c.accused, c.section, c.title]
          .concat(A10 && A10.paccIntakeSearchText ? [A10.paccIntakeSearchText(c)] : []);
      },
      filters: {
        CaseNo: ["เลขสำนวนเรื่องที่", (c) => [c.id, c.paccCaseNo].join(" "), "เช่น 0074/2569", true],
        CourtName: ["ชื่อศาล", (c) => c.courtName, "เช่น ศาลปกครองกลาง"],
        CourtBlackNo: ["หมายเลขดำศาล", (c) => c.courtBlackNo, "เช่น บ. 45/2569"],
        Plaintiff: ["ชื่อผู้ฟ้อง", (c) => c.plaintiff, "ชื่อผู้ฟ้องคดี / โจทก์..."],
        Defendant: ["ชื่อผู้ถูกฟ้อง", (c) => c.defendant, "ชื่อผู้ถูกฟ้องคดี / จำเลย..."],
        ResponsibleUnit: ["หน่วยงานที่รับผิดชอบ", (c) => c.responsibleUnit, "เช่น กองกฎหมาย"],
        ResponsibleOfficer: ["ผู้รับผิดชอบ", (c) => c.responsibleOfficer, "ชื่อผู้รับผิดชอบสำนวน..."],
        Source: ["จาก", (c) => c.source, "หน่วยงานต้นทาง..."],
        Subject: ["เรื่อง", (c) => c.title, "ชื่อเรื่อง / ข้อกล่าวหา..."],
      },
      rows: [["CaseNo", "CourtName", "CourtBlackNo"], ["Plaintiff", "Defendant"], ["ResponsibleUnit", "ResponsibleOfficer"], ["Source", "Subject"]],
      columns: [
        ["ชื่อผู้กล่าวหา", (c) => [c.accuser]],
        ["ชื่อผู้ถูกกล่าวหา", (c) => [accusedName(c)]],
        ["เรื่องสำนวน", (c) => [c.title]],
        ["หน่วยงาน / ผู้รับผิดชอบ", (c) => [c.responsibleUnit, c.responsibleOfficer]],
        ["มาตรา", (c) => [c.section]],
      ],
      detailRows: function (c) {
        return [
          ["เลขสำนวนเรื่องที่", this.caseNo(c)],
          ["หมวดหมู่งาน", c.categoryName],
          ["เรื่อง", c.title, true],
          ["จาก", c.source],
          ["ผู้กล่าวหา", c.accuser],
          ["ผู้ถูกกล่าวหา", accusedName(c)],
          ["มาตรา", c.section],
          ["ชื่อศาล", c.courtName],
          ["หมายเลขดำศาล", c.courtBlackNo],
          ["หมายเลขแดงศาล", c.redNo],
          ["ผู้ฟ้อง", c.plaintiff],
          ["ผู้ถูกฟ้อง", c.defendant],
          ["หน่วยงานที่รับผิดชอบ", c.responsibleUnit],
          ["ผู้รับผิดชอบ", c.responsibleOfficer],
          ["คำสั่ง / หมาย", c.courtOrder],
          ["อายุความ / กำหนดเวลา", c.statuteLimitation],
          ["เลขสารบรรณ", c.centralSarabanNo],
          ["วันที่รับเรื่อง", formatDate(c.dateReceived)],
        ];
      },
      files: (c) => c.files || [],
    },

    legal: {
      title: "ค้นหาสำนวนในกองกฎหมาย",
      notFound: "ไม่พบสำนวนในกองกฎหมาย",
      cases: function () {
        const A10 = global.Activity10;
        return A10 && A10.getCases ? A10.getCases() || [] : [];
      },
      caseNo: (c) => c.id,
      query: (c) => [c.id, c.lawReceiveNo, c.paccCaseNo, c.title, c.accuser, c.accused,
        joinList(c.plaintiffs), joinList(c.defendants), c.courtBlackNo, c.blackCaseNo, c.centralSarabanNo],
      filters: {
        LawCaseNo: ["เลขสำนวน (กองกฎหมาย)", (c) => c.id, "เช่น คดีปกครอง-100097/2569", true],
        LawReceiveNo: ["เลขรับกองกฎหมาย", (c) => c.lawReceiveNo, "เช่น 0014/2569", true],
        Category: ["หมวดหมู่งาน", (c) => c.categoryName, "เช่น คดีปกครอง"],
        CourtName: ["ชื่อศาล", (c) => c.courtName, "เช่น ศาลปกครองกลาง"],
        CourtBlackNo: ["หมายเลขดำศาล", (c) => [c.courtBlackNo, c.blackCaseNo, c.blackNo].join(" "), "เช่น อ. 210/2569"],
        Status: ["สถานะ", (c) => c.status, "เช่น นิติกร"],
        Plaintiff: ["ชื่อผู้ฟ้อง", (c) => joinList(c.plaintiffs) || c.accuser, "ชื่อผู้ฟ้องคดี / ผู้กล่าวหา..."],
        Defendant: ["ชื่อผู้ถูกฟ้อง", (c) => joinList(c.defendants) || c.accused, "ชื่อผู้ถูกฟ้องคดี / ผู้ถูกกล่าวหา..."],
        Officer: ["ผู้รับผิดชอบ", (c) => c.officer, "ชื่อผู้รับผิดชอบปัจจุบัน..."],
        Subject: ["เรื่อง", (c) => c.title, "ชื่อเรื่อง..."],
      },
      rows: [["LawCaseNo", "LawReceiveNo", "Category"], ["CourtName", "CourtBlackNo", "Status"], ["Plaintiff", "Defendant"], ["Officer", "Subject"]],
      columns: [
        ["เลขรับกองกฎหมาย", (c) => [c.lawReceiveNo]],
        ["หมวดหมู่งาน", (c) => [c.categoryName]],
        ["เรื่อง", (c) => [c.title]],
        ["สถานะ / ผู้รับผิดชอบ", (c) => [c.status, c.officer]],
      ],
      detailRows: function (c) {
        return [
          ["เลขสำนวน (กองกฎหมาย)", c.id],
          ["เลขรับกองกฎหมาย", c.lawReceiveNo],
          ["หมวดหมู่งาน", c.categoryName],
          ["เรื่อง", c.title, true],
          ["สถานะปัจจุบัน", c.status, true],
          ["ผู้รับผิดชอบปัจจุบัน", c.officer],
          ["ผู้กล่าวหา / ผู้ฟ้องคดี", joinList(c.plaintiffs) || c.accuser],
          ["ผู้ถูกกล่าวหา / ผู้ถูกฟ้องคดี", joinList(c.defendants) || c.accused],
          ["ชื่อศาล", c.courtName],
          ["หมายเลขคดีดำ", c.courtBlackNo || c.blackCaseNo],
          ["หมายเลขคดีแดง", c.courtRedNo || c.redCaseNo],
          ["จาก", c.source],
          ["เลขสารบรรณ", c.centralSarabanNo],
          ["วันที่รับเรื่อง", formatDate(c.courtReceivedDate || c.physicalDocDate || c.dateReceived)],
          ["เลขสำนวน ป.ป.ท. ที่เชื่อมโยง", c.paccCaseNo],
        ];
      },
      files: (c) => (c.attachmentFileNames || []).map((n) => ({ name: n })).concat(c.paccFiles || []),
      /* เปิดดูสำนวน: คดีปกครองไปหน้าขั้นตอนปัจจุบันแบบดูอย่างเดียว อื่นๆ ไปกล่องงานและไฮไลต์เคส */
      viewUrl: function (c) {
        const A3 = global.Activity103;
        const enc = encodeURIComponent(c.id);
        if (A3 && A3.isCourtCase && A3.isCourtCase(c) && A3.viewPageFor) {
          const role = typeof global.getCurrentRole === "function" ? global.getCurrentRole() : "";
          const step = (A3.STEPS || []).find((s) => s.code === c.l3Step);
          const page = A3.viewPageFor(c, role) || (step && step.page);
          if (page) return page + "?id=" + enc + "&view=1";
        }
        return "01-work-inbox.html?alert=" + enc;
      },
    },
  };

  /* "legacy" ข้อมูลระบบเดิมของกองกฎหมาย (กจ.10) — มาจาก assets/ecmis-legacy-data.js ถ้าหน้าโหลดไว้ */
  function sourceOf(name) {
    if (name === "legacy" && global.ECMISLegacy) return global.ECMISLegacy.lawSource;
    return SOURCES[name] || SOURCES.pacc;
  }

  /* แผงประวัติสำนวนเดิมจากระบบเดิม (กจ.5/กจ.6) ของสำนวน ป.ป.ท. ที่นำเข้า */
  function legacyImsHtml(c) {
    const L = global.ECMISLegacy;
    return L && c && c.legacyIms ? L.renderImsPanel(c.legacyIms) : "";
  }

  function present(v) {
    return v != null && String(v).trim() !== "" && String(v).trim() !== "-";
  }

  /* criteria = { query, filters: { key: term } } → { hasCriteria, results } */
  function searchIn(src, criteria) {
    const q = lower((criteria && criteria.query) || "").trim();
    const filters = Object.entries((criteria && criteria.filters) || {})
      .map(([key, term]) => ({ get: (src.filters[key] || [])[1], term: lower(term).trim() }))
      .filter((f) => f.term && f.get);
    const hasCriteria = !!q || filters.length > 0;
    if (!hasCriteria) return { hasCriteria: false, results: [] };
    const results = src.cases().filter(
      (c) =>
        (!q || src.query(c).some((v) => lower(v).includes(q))) &&
        filters.every(({ get, term }) => lower(get(c)).includes(term)),
    );
    return { hasCriteria: true, results: results };
  }

  function findIn(src, caseId) {
    return src.cases().find((c) => c.id === caseId) || null;
  }

  function renderDetailList(rows) {
    return rows
      .filter(([, v]) => present(v))
      .map(
        ([label, value, wide]) =>
          `<div${wide ? ' class="is-wide"' : ""}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
      )
      .join("");
  }

  /* รายการเอกสาร [{ name, href? }] — มี href ⇒ ปุ่ม "เปิดดู" เปิดไฟล์ในแท็บใหม่ */
  function renderFileList(files) {
    return (files || [])
      .map(
        (f) => `
 <div class="intake-file-row">
 <i class="fa-solid fa-file-pdf" style="color:#dc2626;" aria-hidden="true"></i>
 <span class="intake-file-name">${escapeHtml(f.name)}</span>
 ${f.href ? `<button type="button" class="btn btn-secondary" data-href="${escapeHtml(f.href)}" onclick="ECMISCaseSearch.openFile(this.dataset.href)"><i class="fa-solid fa-eye me-1" aria-hidden="true"></i>เปิดดู</button>` : ""}
 </div>`,
      )
      .join("");
  }

  function openFile(href) {
    if (!href) return;
    global.open(encodeURI(href), "_blank", "noopener");
  }

  function renderDetailFor(src, c) {
    const A10 = global.Activity10;
    const groups = src === SOURCES.pacc && A10 && A10.complaintIntakeGroups ? A10.complaintIntakeGroups(c) : [];
    const complaintHtml = groups
      .map(
        (g) =>
          `<div class="complaint-intake-group">${escapeHtml(g.title)}</div>` +
          `<dl class="intake-preview-grid">${renderDetailList(g.rows)}</dl>`,
      )
      .join("");
    /* files() คืน null ⇒ แหล่งนั้นแสดงไฟล์เองใน extraHtml */
    const files = src.files(c);
    const filesHtml = !files
      ? ""
      : `<div class="intake-files-title"><i class="fa-solid fa-paperclip me-1" aria-hidden="true"></i>เอกสารในสำนวน (${files.length})</div>
 ${files.length ? renderFileList(files) : '<div style="font-size:0.85em; color:#64748b;">ไม่มีเอกสารในสำนวน</div>'}`;
    return `
 <div class="intake-preview-head">
 <i class="fa-solid fa-folder-open" style="color:#2563eb;" aria-hidden="true"></i>
 <span>รายละเอียดสำนวน <span class="intake-preview-no">${escapeHtml(src.caseNo(c))}</span></span>
 </div>
 <dl class="intake-preview-grid">${renderDetailList(src.detailRows(c))}</dl>
 ${complaintHtml}
 ${filesHtml}
 ${src.extraHtml ? src.extraHtml(c) : legacyImsHtml(c)}`;
  }

  function cellHtml(parts) {
    const vals = parts.filter(present);
    if (!vals.length) return "-";
    return escapeHtml(vals[0]) + (vals[1] ? `<div style="font-size:0.82em; color:#64748b;">${escapeHtml(vals[1])}</div>` : "");
  }

  /* ตารางผลค้นหา + แผงรายละเอียด (ว่างไว้) — การคลิกผูกด้วย delegation ใน mountPanel */
  function renderResults(src, cases, q, ids, hint, notFound) {
    if (!cases.length) {
      return `
 <div style="padding: 16px; background: var(--bg-body); border-radius: 6px; text-align: center; color: #64748b; border: 1px solid var(--border-color);">
 <i class="fa-solid fa-inbox me-1" aria-hidden="true"></i>${escapeHtml(notFound)}${q ? ` จากข้อความ "${escapeHtml(q)}"` : ""}
 </div>`;
    }
    const head = ["เลขสำนวน"].concat(src.columns.map((col) => col[0]));
    const rows = cases
      .map(
        (c) => `
 <tr data-case-id="${escapeHtml(c.id)}" tabindex="0" title="คลิกเพื่อดูรายละเอียดสำนวน">
 <td><strong class="font-monospace" style="color:var(--text-title);">${escapeHtml(src.caseNo(c))}</strong></td>
 ${src.columns.map((col) => `<td>${cellHtml(col[1](c))}</td>`).join("")}
 </tr>`,
      )
      .join("");
    return `
 <div style="padding: 12px; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color);">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
 <div style="font-weight: 700; color: var(--text-title); font-size: 0.9em;"><i class="fa-solid fa-list-check me-1" aria-hidden="true"></i>พบข้อมูลสำนวนที่ตรงกัน (${cases.length} รายการ):</div>
 <button type="button" class="ctrl-btn" style="padding: 2px 8px; font-size: 0.75rem;" data-cs-action="hide-results" title="ปิดแถบผลการค้นหา"><i class="fa-solid fa-xmark me-1" aria-hidden="true"></i>ปิด</button>
 </div>
 <div style="overflow-x: auto;">
 <table class="search-results-table">
 <thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
 <tbody>${rows}
 </tbody>
 </table>
 </div>
 <div style="font-size: 0.8em; color: #64748b; margin-top: 6px;"><i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>${escapeHtml(hint)}</div>
 <div id="${ids.preview}" class="intake-preview d-none" aria-live="polite"></div>
 </div>`;
  }

  /* ทำเครื่องหมายแถวที่กำลังดู (is-previewing) หรือที่เลือกแล้ว (table-primary) */
  function markRow(resultsId, caseId, className) {
    document.querySelectorAll("#" + resultsId + " tbody tr").forEach((r) => {
      r.classList.toggle(className, r.dataset.caseId === caseId);
    });
  }

  function filterField(src, prefix, key) {
    const f = src.filters[key];
    const id = prefix + "Filter" + key;
    return `
 <div class="form-group" style="margin-bottom: 0">
 <label for="${id}">${escapeHtml(f[0])}</label>
 <input type="text" id="${id}" class="form-control${f[3] ? " font-monospace" : ""}" placeholder="${escapeHtml(f[2])}" data-cs-enter="search" />
 </div>`;
  }

  function panelMarkup(src, prefix, opts) {
    const rows = src.rows
      .map(
        (row, i) =>
          `<div class="form-grid-${row.length}" style="margin-bottom: ${i === src.rows.length - 1 ? 0 : 12}px">` +
          row.map((k) => filterField(src, prefix, k)).join("") +
          "</div>",
      )
      .join("");
    const inner = `
 <div class="form-grid-3">
 <div class="form-group" style="margin-bottom: 0; grid-column: span 2 / span 3">
 <label for="${prefix}SearchInput">คำค้นหา</label>
 <input type="text" id="${prefix}SearchInput" class="form-control" style="width: 100%"
 placeholder="${escapeHtml(opts.placeholder)}" data-cs-enter="search" />
 </div>
 <div>
 <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 20px" data-cs-action="search">
 <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> ค้นหาสำนวน
 </button>
 </div>
 </div>
 <div class="case-search-filter-box">
 <div class="case-search-filter-title"><i class="fa-solid fa-filter me-1" aria-hidden="true"></i>ตัวกรองเพิ่มเติม</div>
 ${rows}
 <div class="case-search-filter-actions">
 <button type="button" class="btn btn-secondary" data-cs-action="clear"><i class="fa-solid fa-eraser" aria-hidden="true"></i> ล้างเงื่อนไข</button>
 </div>
 </div>
 <div class="helper-text case-search-helper">${opts.helper}</div>
 <div id="${prefix}SearchResults" class="d-none" style="margin-bottom: 12px"></div>`;
    if (!opts.collapsible) return `<div class="case-search-panel" id="${prefix}SearchPanel">${inner}</div>`;
    return `
 <details id="${prefix}SearchAccordion" class="intake-search-acc"${opts.open ? " open" : ""}>
 <summary>
 <i class="fa-solid ${opts.icon}" style="color: #1e3a8a" aria-hidden="true"></i>
 <span>${escapeHtml(opts.title)}</span>
 <span class="intake-search-optional">(ไม่บังคับ)</span>
 <i class="fa-solid fa-chevron-down acc-chevron" aria-hidden="true"></i>
 </summary>
 <div class="intake-search-acc-body">${inner}</div>
 </details>`;
  }

  /* สร้างแผงค้นหาใน host
     opts = { source ("pacc" | "legal"), prefix, collapsible (true), open (false), title, hint, notFound,
              onSelect(caseRecord) — เฉพาะ pacc ⇒ มีปุ่ม "เลือกสำนวนนี้"; legal ดูอย่างเดียว + ลิงก์เปิดดูสำนวน }
     คืน { search, clear, preview, closePreview, findCase } */
  function mountPanel(host, options) {
    const src = sourceOf((options && options.source) || "pacc");
    const isLegacy = !!src.action; /* แหล่งข้อมูลระบบเดิม (กจ.10) — ดูอย่างเดียว ปุ่มท้ายรายละเอียดจาก src.action */
    const isLegal = src === SOURCES.legal || isLegacy;
    const opts = Object.assign(
      {
        prefix: isLegacy ? "legacy" : isLegal ? "lawcase" : "intake",
        collapsible: true,
        open: false,
        title: src.title,
        notFound: src.notFound,
        icon: isLegacy ? "fa-database" : isLegal ? "fa-scale-balanced" : "fa-magnifying-glass",
        selectLabel: "เลือกสำนวนนี้",
        placeholder: isLegacy
          ? "พิมพ์เลขสำนวน ป.ป.ท. / เลขหนังสือนำส่ง / ชื่อเรื่อง / ชื่อผู้ถูกกล่าวหา / หน่วยงาน..."
          : isLegal
            ? "พิมพ์เลขสำนวน / เลขรับกองกฎหมาย / ชื่อเรื่อง / ชื่อคู่กรณี..."
            : "พิมพ์เลขสำนวน / เลขสำนวนไต่สวน (ป.ป.ท.) / ชื่อผู้กล่าวหา / ชื่อผู้ถูกกล่าวหา...",
        helper: isLegacy
          ? "* ค้นหาข้อมูลที่ย้ายมาจากระบบเดิม (IMS) ของกองกฎหมาย — ดูอย่างเดียว · สำนวนที่มีข้อมูลเรื่องร้องเรียนในระบบเดิมจะแสดงลำดับเหตุการณ์ มติ และเอกสารครบชุด"
          : isLegal
            ? "* ค้นหาสำนวนที่รับเข้าระบบกองกฎหมายแล้ว (ดูอย่างเดียว ไม่เชื่อมข้อมูล) — ถ้าไม่พบ ธุรการบันทึกรับเรื่องใหม่ได้ในหน้าบันทึกรับเรื่อง"
            : "* ค้นหาได้จาก: <strong>เลขสำนวน</strong>, <strong>เลขสำนวนไต่สวน ป.ป.ท.</strong>, <strong>ชื่อผู้กล่าวหา</strong> หรือ <strong>ชื่อผู้ถูกกล่าวหา</strong> / กรอกตัวกรองเพิ่มเติมเพื่อกรองผลให้แคบลง",
      },
      options || {},
    );
    if (isLegal) opts.onSelect = null;
    const p = opts.prefix;
    const ids = { results: p + "SearchResults", preview: p + "CasePreview" };
    const hint =
      opts.hint ||
      (opts.onSelect
        ? 'คลิกแถวเพื่อดูรายละเอียด แล้วกด "' + opts.selectLabel + '"'
        : "คลิกแถวเพื่อดูรายละเอียดและเอกสารในสำนวน");
    host.innerHTML = panelMarkup(src, p, opts);

    const el = (id) => document.getElementById(id);
    const value = (id) => (el(id) ? el(id).value.trim() : "");

    function runSearch() {
      const q = value(p + "SearchInput");
      const filters = {};
      Object.keys(src.filters).forEach((k) => { filters[k] = value(p + "Filter" + k); });
      const res = searchIn(src, { query: q, filters: filters });
      const box = el(ids.results);
      if (!res.hasCriteria) {
        if (global.Swal) {
          global.Swal.fire({
            icon: "info",
            title: "กรุณากรอกคำค้นหา",
            text: "พิมพ์คำค้นหา หรือกรอกตัวกรองเพิ่มเติมอย่างน้อย 1 ช่อง",
            timer: 1500,
            showConfirmButton: false,
          });
        }
        box.classList.add("d-none");
        return;
      }
      box.classList.remove("d-none");
      box.innerHTML = renderResults(src, res.results, q, ids, hint, opts.notFound);
    }

    function clearAll() {
      host.querySelectorAll("input[type=text]").forEach((i) => { i.value = ""; });
      const box = el(ids.results);
      box.classList.add("d-none");
      box.innerHTML = "";
    }

    function closePreview() {
      const panel = el(ids.preview);
      if (panel) {
        panel.classList.add("d-none");
        panel.dataset.caseId = "";
      }
      markRow(ids.results, "", "is-previewing");
    }

    /* ขั้นที่ 1: กดแถว → แสดงรายละเอียดใต้ตาราง กดแถวเดิมซ้ำเพื่อปิด
       ขั้นที่ 2: pacc กดปุ่มเลือก (ถ้ามี onSelect) · legal กดเปิดดูสำนวน */
    function preview(caseId) {
      const panel = el(ids.preview);
      if (!panel) return;
      if (panel.dataset.caseId === caseId && !panel.classList.contains("d-none")) {
        closePreview();
        return;
      }
      const target = findIn(src, caseId);
      if (!target) return;
      markRow(ids.results, caseId, "is-previewing");
      panel.dataset.caseId = caseId;
      const action = isLegacy
        ? src.action(target)
        : isLegal
        ? `<a class="btn btn-primary" href="${escapeHtml(src.viewUrl(target))}"><i class="fa-solid fa-up-right-from-square me-1" aria-hidden="true"></i>เปิดดูสำนวน</a>`
        : opts.onSelect
          ? `<button type="button" class="btn btn-primary" id="${p}SelectCaseBtn" data-cs-action="select"><i class="fa-solid fa-check me-1" aria-hidden="true"></i>${escapeHtml(opts.selectLabel)}</button>`
          : "";
      panel.innerHTML =
        renderDetailFor(src, target) +
        `
 <div class="intake-preview-actions">
 <button type="button" class="btn btn-secondary" data-cs-action="close-preview"><i class="fa-solid fa-xmark me-1" aria-hidden="true"></i>ปิด</button>
 ${action}
 </div>`;
      panel.classList.remove("d-none");
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    host.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-cs-action]");
      if (btn) {
        const a = btn.getAttribute("data-cs-action");
        if (a === "search") runSearch();
        else if (a === "clear") clearAll();
        else if (a === "hide-results") el(ids.results).classList.add("d-none");
        else if (a === "close-preview") closePreview();
        else if (a === "select" && opts.onSelect) {
          const c = findIn(src, el(ids.preview).dataset.caseId);
          if (c) {
            markRow(ids.results, c.id, "table-primary");
            opts.onSelect(c);
          }
        }
        return;
      }
      const row = e.target.closest("tbody tr[data-case-id]");
      if (row && host.contains(row)) preview(row.dataset.caseId);
    });
    host.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.matches("[data-cs-enter]")) {
        e.preventDefault();
        runSearch();
        return;
      }
      const row = e.target.closest ? e.target.closest("tbody tr[data-case-id]") : null;
      if (row && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        preview(row.dataset.caseId);
      }
    });

    const api = { search: runSearch, clear: clearAll, preview: preview, closePreview: closePreview, findCase: (id) => findIn(src, id) };
    host._caseSearch = api;
    return api;
  }

  global.ECMISCaseSearch = {
    mountPanel: mountPanel,
    /* ค่าเดิมสำหรับสำนวนใน ป.ป.ท. */
    search: (criteria) => searchIn(SOURCES.pacc, criteria),
    findCase: (id) => findIn(SOURCES.pacc, id),
    caseNo: (c) => SOURCES.pacc.caseNo(c),
    renderDetail: (c) => renderDetailFor(SOURCES.pacc, c),
    legacyImsHtml: legacyImsHtml,
    renderFileList: renderFileList,
    openFile: openFile,
    markRow: markRow,
    escapeHtml: escapeHtml,
  };
})(window);
