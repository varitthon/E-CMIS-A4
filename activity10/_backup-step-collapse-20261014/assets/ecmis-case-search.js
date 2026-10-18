/* ค้นหาสำนวน — ส่วนที่ใช้ร่วมกันระหว่างหน้า 02-board-intake.html (ส่วน "ค้นหาสำนวน")
   และหน้า search-case.html (เมนู "ค้นหาสำนวน" ในแถบด้านข้าง)
   อ่านจาก Activity10.getPaccIntakeDatabase() — โหลดหลัง ecmis-activity10.js
   ทุกฟังก์ชันคืนค่าใหม่ ไม่แก้ข้อมูลสำนวน */
(function (global) {
  "use strict";

  /* ช่องกรอง → ฟิลด์ของสำนวนที่ใช้เทียบ (ข้อความบางส่วน ไม่สนตัวพิมพ์)
     เลขสำนวนเรื่องที่ เทียบทั้ง id (สำนวน-NNNN/2569) และ paccCaseNo (NNNN/2569) */
  const FILTER_FIELDS = {
    caseNo: ["id", "paccCaseNo"],
    courtName: ["courtName"],
    courtBlackNo: ["courtBlackNo"],
    plaintiff: ["plaintiff"],
    defendant: ["defendant"],
    source: ["source"],
    subject: ["title"],
  };

  /* คำค้นหาทั่วไป เทียบกับฟิลด์เหล่านี้ */
  const QUERY_FIELDS = [
    "id",
    "paccCaseNo",
    "blackNo",
    "redNo",
    "accuser",
    "accused",
    "section",
    "title",
  ];

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

  function allCases() {
    const A10 = global.Activity10;
    return A10 && A10.getPaccIntakeDatabase ? A10.getPaccIntakeDatabase() : [];
  }

  function findCase(caseId) {
    return allCases().find((c) => c.id === caseId) || null;
  }

  /* เลขสำนวนเรื่องที่ = เลขที่บันทึกลงเคสใหม่ (paccCaseNo) ถ้าไม่มีใช้เลขจาก id */
  function caseNo(c) {
    return c.paccCaseNo || String(c.id || "").replace(/^.*?-/, "");
  }

  function matchesQuery(c, q) {
    if (!q) return true;
    const A10 = global.Activity10;
    if (QUERY_FIELDS.some((f) => lower(c[f]).includes(q))) return true;
    /* สำนวนจากการรับเรื่องร้องเรียน: ค้นด้วยเลขรับ/เลขติดตาม/PIN/เลขสารบรรณได้ด้วย */
    return !!(A10 && A10.paccIntakeSearchText && A10.paccIntakeSearchText(c).includes(q));
  }

  /* criteria = { query, filters: { caseNo, courtName, ... } } → { hasCriteria, results } */
  function search(criteria) {
    const q = lower((criteria && criteria.query) || "").trim();
    const filters = Object.entries((criteria && criteria.filters) || {})
      .map(([key, term]) => ({ fields: FILTER_FIELDS[key] || [], term: lower(term).trim() }))
      .filter((f) => f.term && f.fields.length);
    const hasCriteria = !!q || filters.length > 0;
    if (!hasCriteria) return { hasCriteria: false, results: [] };
    const results = allCases().filter(
      (c) =>
        matchesQuery(c, q) &&
        filters.every(({ fields, term }) => fields.some((f) => lower(c[f]).includes(term))),
    );
    return { hasCriteria: true, results: results };
  }

  function formatDate(iso) {
    const picker = global.ThaiDatePicker;
    if (picker && iso) return picker.isoToDisplay(iso) || iso;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + (Number(m[1]) + 543) : iso;
  }

  /* รายการข้อมูลในแผงรายละเอียด [ป้าย, ค่า, เต็มแถว] — ข้ามช่องว่าง / "-" */
  function detailRows(c) {
    const A10 = global.Activity10;
    const accused = A10 && A10.fullName ? A10.fullName(c.accused, c.accusedPosition) : c.accused;
    return [
      ["เลขสำนวนเรื่องที่", caseNo(c)],
      ["หมวดหมู่งาน", c.categoryName],
      ["เรื่อง", c.title, true],
      ["จาก", c.source],
      ["ผู้กล่าวหา", c.accuser],
      ["ผู้ถูกกล่าวหา", accused],
      ["มาตรา", c.section],
      ["ชื่อศาล", c.courtName],
      ["หมายเลขดำศาล", c.courtBlackNo],
      ["หมายเลขแดงศาล", c.redNo],
      ["ผู้ฟ้อง", c.plaintiff],
      ["ผู้ถูกฟ้อง", c.defendant],
      ["คำสั่ง / หมาย", c.courtOrder],
      ["อายุความ / กำหนดเวลา", c.statuteLimitation],
      ["เลขสารบรรณ", c.centralSarabanNo],
      ["วันที่รับเรื่อง", formatDate(c.dateReceived)],
    ].filter(([, v]) => v && String(v).trim() && String(v).trim() !== "-");
  }

  function renderDetailList(rows) {
    return rows
      .map(
        ([label, value, wide]) =>
          `<div${wide ? ' class="is-wide"' : ""}><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
      )
      .join("");
  }

  /* รายการเอกสาร [{ name, href }] — ปุ่ม "เปิดดู" เปิดไฟล์ในแท็บใหม่ */
  function renderFileList(files) {
    return (files || [])
      .map(
        (f) => `
 <div class="intake-file-row">
 <i class="fa-solid fa-file-pdf" style="color:#dc2626;"></i>
 <span class="intake-file-name">${escapeHtml(f.name)}</span>
 <button type="button" class="btn btn-secondary" data-href="${escapeHtml(f.href)}" onclick="ECMISCaseSearch.openFile(this.dataset.href)"><i class="fa-solid fa-eye me-1"></i>เปิดดู</button>
 </div>`,
      )
      .join("");
  }

  function openFile(href) {
    if (!href) return;
    global.open(encodeURI(href), "_blank", "noopener");
  }

  /* เนื้อหาแผงรายละเอียดสำนวน (หัว · ข้อมูล · ข้อมูลรับเรื่องร้องเรียน · เอกสาร) ไม่รวมปุ่มของแต่ละหน้า */
  function renderDetail(c) {
    const A10 = global.Activity10;
    const groups = A10 && A10.complaintIntakeGroups ? A10.complaintIntakeGroups(c) : [];
    const complaintHtml = groups
      .map(
        (g) =>
          `<div class="complaint-intake-group">${escapeHtml(g.title)}</div>` +
          `<dl class="intake-preview-grid">${renderDetailList(g.rows)}</dl>`,
      )
      .join("");
    const files = c.files || [];
    return `
 <div class="intake-preview-head">
 <i class="fa-solid fa-folder-open" style="color:#2563eb;"></i>
 <span>รายละเอียดสำนวน <span class="intake-preview-no">${escapeHtml(caseNo(c))}</span></span>
 </div>
 <dl class="intake-preview-grid">${renderDetailList(detailRows(c))}</dl>
 ${complaintHtml}
 <div class="intake-files-title"><i class="fa-solid fa-paperclip me-1"></i>เอกสารในสำนวน (${files.length})</div>
 ${files.length ? renderFileList(files) : '<div style="font-size:0.85em; color:#64748b;">ไม่มีเอกสารในสำนวน</div>'}`;
  }

  /* ตารางผลค้นหา + แผงรายละเอียด (ว่างไว้)
     opts = { onRowClick: ชื่อฟังก์ชัน global ที่รับ caseId, previewId, hint, resultsId } */
  function renderResults(cases, q, opts) {
    const o = opts || {};
    if (!cases.length) {
      return `
 <div style="padding: 16px; background: var(--bg-body); border-radius: 6px; text-align: center; color: #64748b; border: 1px solid var(--border-color);">
 <i class="fa-solid fa-inbox me-1"></i>${q ? `ไม่พบข้อมูลสำนวนที่ค้นหาจากข้อความ "${escapeHtml(q)}"` : "ไม่พบข้อมูลสำนวนที่ตรงกับเงื่อนไขที่กรอง"}
 </div>`;
    }
    const A10 = global.Activity10;
    const rows = cases
      .map((c) => {
        const accused =
          (A10 && A10.fullName ? A10.fullName(c.accused, c.accusedPosition) : c.accused) || "-";
        return `
 <tr data-case-id="${escapeHtml(c.id)}" tabindex="0" onclick="${o.onRowClick}(this.dataset.caseId)" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.click(); }" title="คลิกเพื่อดูรายละเอียดสำนวน">
 <td><strong class="font-monospace" style="color:var(--text-title);">${escapeHtml(caseNo(c))}</strong></td>
 <td>${escapeHtml(c.accuser || "-")}</td>
 <td style="font-weight:600;">${escapeHtml(accused)}</td>
 <td>${escapeHtml(c.title)}</td>
 <td style="white-space:nowrap;">${escapeHtml(c.section || "-")}</td>
 </tr>`;
      })
      .join("");
    return `
 <div style="padding: 12px; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-color);">
 <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
 <div style="font-weight: 700; color: var(--text-title); font-size: 0.9em;"><i class="fa-solid fa-list-check me-1"></i>พบข้อมูลสำนวนที่ตรงกัน (${cases.length} รายการ):</div>
 <button type="button" class="ctrl-btn" style="padding: 2px 8px; font-size: 0.75rem;" onclick="document.getElementById('${o.resultsId}').classList.add('d-none')" title="ปิดแถบผลการค้นหา"><i class="fa-solid fa-xmark me-1"></i>ปิด</button>
 </div>
 <div style="overflow-x: auto;">
 <table class="search-results-table">
 <thead>
 <tr>
 <th>เลขสำนวนเรื่องที่</th>
 <th>ชื่อผู้กล่าวหา</th>
 <th>ชื่อผู้ถูกกล่าวหา</th>
 <th>เรื่องสำนวน</th>
 <th>มาตรา</th>
 </tr>
 </thead>
 <tbody>${rows}
 </tbody>
 </table>
 </div>
 <div style="font-size: 0.8em; color: #64748b; margin-top: 6px;"><i class="fa-solid fa-circle-info me-1"></i>${escapeHtml(o.hint || "คลิกแถวเพื่อดูรายละเอียดสำนวน")}</div>
 <div id="${o.previewId}" class="intake-preview d-none" aria-live="polite"></div>
 </div>`;
  }

  /* ทำเครื่องหมายแถวที่กำลังดู (is-previewing) หรือที่เลือกแล้ว (table-primary) */
  function markRow(resultsId, caseId, className) {
    document.querySelectorAll("#" + resultsId + " tbody tr").forEach((r) => {
      r.classList.toggle(className, r.dataset.caseId === caseId);
    });
  }

  global.ECMISCaseSearch = {
    renderResults: renderResults,
    markRow: markRow,
    search: search,
    findCase: findCase,
    caseNo: caseNo,
    detailRows: detailRows,
    renderDetail: renderDetail,
    renderFileList: renderFileList,
    openFile: openFile,
    escapeHtml: escapeHtml,
  };
})(window);
