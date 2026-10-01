/* ECMIS 10.1 reports — มุมมองรายงาน/สารบบของหน้าคิวงาน (ตัวกรอง "มุมมอง" #inboxViewSelect ใน 01-work-inbox.html)
   - board-report  รายงานผลตามมติคณะกรรมการ        TOR 10.1.8
   - registry      สารบบคำวินิจฉัย/คำพิพากษา        TOR 10.1.10
                   + รายงานวิเคราะห์คำพิพากษา (เชิงปริมาณ/เชิงคุณภาพ/สรุปคดีชั้นศาล) พิมพ์/Word/Excel/PDF  TOR 10.1.11.2-.5
   การบันทึก/นำเข้าผลวิเคราะห์ (10.1.11.1/.4) อยู่ที่แผงคำพิพากษาของหน้า 18-22 (ecmis-10-1-extras.js)
   ตรรกะข้อมูลอยู่ใน Activity10 (buildBoardResolutionReport / buildJudgmentRegistry …)
   และการส่งออกอยู่ใน ECMISExport — ไฟล์นี้เป็นเพียง UI. ต้องโหลดหลัง ecmis-activity10.js + ecmis-export.js
   ใช้งาน: ECMIS101Reports.register(INBOX_TAB_RENDERERS) แล้วเรียก applyRoleVisibility() */
(function (global) {
  "use strict";

  /* มุมมองเหล่านี้เห็นเฉพาะบทบาทสายกฎหมาย/ผู้บริหาร (รวมชื่อ login เดิมผ่าน ALERT_ROLE_ALIASES) */
  const TAB_PANELS = { "board-report": "boardReportPanel", registry: "registryPanel" };

  const state = {
    board: { fy: "", type: "", meetingNo: "", status: "" },
    registry: { kind: "", q: "" },
    report: { type: "quant", fy: "" },
  };

  const A = () => global.Activity10;
  const X = () => global.ECMISExport;
  const esc = (v) => X().esc(v);
  const $ = (id) => global.document.getElementById(id);

  function roleId() {
    try {
      const raw = global.sessionStorage.getItem("ecmis_role") || "admin_legal";
      return (A().ALERT_ROLE_ALIASES || {})[raw] || raw;
    } catch (e) {
      return "admin_legal";
    }
  }
  function canSee() {
    return A().isLegalViewRole(roleId());
  }
  function actor() {
    try {
      const id = typeof global.getCurrentRole === "function" ? global.getCurrentRole() : roleId();
      const reg = (global.ECMIS && global.ECMIS.ROLES) || [];
      const r = reg.find((x) => x.id === id || x.login === id);
      return r ? r.name : id;
    } catch (e) {
      return "";
    }
  }
  const fmt = (iso) => (iso && A().formatDisplayDate ? A().formatDisplayDate(iso) : iso || "-");
  const cases = () => A().getCases() || [];
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const dateText = () => "วันที่พิมพ์ " + fmt(todayIso());

  function applyRoleVisibility() {
    const ok = canSee();
    Object.keys(TAB_PANELS).forEach((tab) => {
      const opt = global.document.querySelector('#inboxViewSelect option[value="' + tab + '"]');
      if (!opt) return;
      opt.hidden = !ok;
      opt.disabled = !ok;
    });
  }

  const sel = (id, attr, options, current) =>
    '<select id="' + id + '" ' + attr + ' style="min-width:150px">' +
    options
      .map((o) => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(current) ? " selected" : "") + ">" + esc(o[1]) + "</option>")
      .join("") +
    "</select>";
  const btn = (action, label, icon, cls) =>
    '<button type="button" class="btn ' + (cls || "btn-outline") + '" data-p4-action="' + action + '">' +
    (icon ? '<i class="fa-solid ' + icon + ' me-1"></i>' : "") + label + "</button>";
  const empty = (cols, msg) => '<tr><td colspan="' + cols + '" style="text-align:center;color:#64748b;padding:20px">' + msg + "</td></tr>";
  const bar = (title, right) =>
    '<div class="table-title-bar"><span>' + title + "</span><span style=\"display:flex;gap:8px;flex-wrap:wrap;align-items:center\">" + (right || "") + "</span></div>";
  const wrapTable = (head, body) =>
    '<div class="table-responsive"><table><thead><tr>' + head.map((h) => "<th>" + h + "</th>").join("") + "</tr></thead><tbody>" + body + "</tbody></table></div>";

  function guard(panelId) {
    if (canSee()) return true;
    $(panelId).innerHTML = '<div style="padding:24px;color:#64748b">เมนูนี้สำหรับผู้ใช้สายงานกฎหมายเท่านั้น</div>';
    return false;
  }

  /* ---------- B5: รายงานผลตามมติ (10.1.8) ---------- */
  const OVERDUE_STYLE = "color:#b91c1c;font-weight:700";
  const STATUS_OPTIONS = [
    ["", "ทุกสถานะ"],
    ["progress", "อยู่ระหว่างดำเนินการ (รวมเกินกำหนด)"],
    ["closed", "ปิดเรื่องแล้ว"],
    ["overdue", "เกินกำหนด (> " + 30 + " วันนับจากมติ)"],
  ];

  function boardRows() {
    return A().buildBoardResolutionReport(cases(), state.board);
  }
  function boardGroups() {
    return A().groupBoardReportByMeeting(boardRows());
  }
  function daysCell(r) {
    if (r.daysSinceResolution == null) return "-";
    if (r.isClosed) return esc(r.daysSinceResolution) + " วัน";
    return r.isOverdue
      ? '<span style="' + OVERDUE_STYLE + '">' + esc(r.daysSinceResolution) + " วัน · เกินกำหนด</span>"
      : esc(r.daysSinceResolution) + " วัน";
  }
  function actionsCell(r) {
    if (!r.actions.length) return '<span style="color:#94a3b8">ยังไม่มีการดำเนินการหลังมติ</span>';
    const last = r.actions[r.actions.length - 1];
    return (
      "<details><summary>" + r.actions.length + " รายการ · ล่าสุด " + esc(fmt(last.date)) + "</summary>" +
      '<ol style="margin:6px 0 0 18px;padding:0;font-size:.88em">' +
      r.actions.map((a) => "<li><strong>" + esc(fmt(a.date)) + "</strong> " + esc(a.label) + "</li>").join("") +
      "</ol></details>"
    );
  }
  function stateBadge(r) {
    if (r.isClosed) return '<span class="badge" style="background:#dcfce7;color:#166534">ปิดเรื่องแล้ว</span>';
    return r.isOverdue
      ? '<span class="badge" style="background:#fee2e2;color:#991b1b">เกินกำหนด</span>'
      : '<span class="badge" style="background:#dbeafe;color:#1e3a8a">อยู่ระหว่างดำเนินการ</span>';
  }
  function boardGroupHtml(g) {
    const head =
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;background:#f1f5f9;padding:8px 12px;border-radius:6px;margin:12px 0 4px">' +
      "<strong>ประชุมครั้งที่ " + esc(g.meetingNo || "-") + "</strong>" +
      "<span>วันที่ " + esc(fmt(g.meetingDateIso || g.meetingDate)) + "</span>" +
      "<span>วาระ " + esc(g.agendaNos.join(", ") || "-") + "</span>" +
      '<span class="badge" style="background:#e2e8f0;color:#334155">ทั้งหมด ' + g.total + "</span>" +
      '<span class="badge" style="background:#dcfce7;color:#166534">ปิดแล้ว ' + g.closed + "</span>" +
      '<span class="badge" style="background:#dbeafe;color:#1e3a8a">อยู่ระหว่างดำเนินการ ' + g.inProgress + "</span>" +
      (g.overdue ? '<span class="badge" style="background:#fee2e2;color:#991b1b">เกินกำหนด ' + g.overdue + "</span>" : "") +
      "</div>";
    const body = g.rows
      .map(
        (r) =>
          "<tr><td>" + esc(r.caseId) + '<div style="font-size:.8em;color:#64748b">' + esc(r.title) + "</div></td>" +
          "<td>" + esc(r.agendaNo || "-") + "</td>" +
          "<td><strong>" + esc(r.resolutionTypeName || "-") + "</strong><div>" + esc(r.resolutionText) + "</div></td>" +
          "<td>" + esc(r.fiscalYear || "-") + "</td>" +
          "<td>" + stateBadge(r) + (r.status ? '<div style="font-size:.8em;color:#64748b">' + esc(r.status) + "</div>" : "") + "</td>" +
          "<td>" + daysCell(r) + "</td>" +
          "<td>" + actionsCell(r) + "</td></tr>",
      )
      .join("");
    return head + wrapTable(["เลขสำนวน", "วาระ", "มติ", "ปีงบประมาณ", "สถานะ", "วันนับจากมติ", "การดำเนินการหลังมติ"], body);
  }
  function boardBodyHtml(groups) {
    return groups.length
      ? groups.map(boardGroupHtml).join("")
      : '<div style="text-align:center;color:#64748b;padding:20px">ไม่พบสำนวนที่มีมติคณะกรรมการตามเงื่อนไข</div>';
  }
  function boardTitle() {
    return "รายงานผลตามมติคณะกรรมการ ป.ป.ท." + (state.board.fy ? " ปีงบประมาณ " + state.board.fy : "");
  }
  function boardExportRows() {
    return A().boardReportTableRows(boardGroups());
  }
  function renderBoard() {
    if (!guard("boardReportPanel")) return;
    const all = A().buildBoardResolutionReport(cases(), {});
    const fys = Array.from(new Set(all.map((r) => r.fiscalYear).filter(Boolean))).sort().reverse();
    const meetings = Array.from(new Set(all.map((r) => r.meetingNo).filter(Boolean))).sort();
    const types = [["", "ทุกประเภทมติ"]].concat(A().BOARD_RESOLUTION_TYPES.map((t) => [t.code, t.name]));
    $("boardReportPanel").innerHTML =
      bar(
        "รายงานผลตามมติคณะกรรมการ ป.ป.ท. (10.1.8)",
        sel("p4BoardFy", 'data-p4-filter="board.fy"', [["", "ทุกปีงบประมาณ"]].concat(fys.map((y) => [y, "ปีงบประมาณ " + y])), state.board.fy) +
          sel("p4BoardType", 'data-p4-filter="board.type"', types, state.board.type) +
          sel("p4BoardMeeting", 'data-p4-filter="board.meetingNo"', [["", "ทุกครั้งที่ประชุม"]].concat(meetings.map((m) => [m, "ครั้งที่ " + m])), state.board.meetingNo) +
          sel("p4BoardStatus", 'data-p4-filter="board.status"', STATUS_OPTIONS, state.board.status) +
          btn("board-print", "พิมพ์", "fa-print", "btn-primary") +
          btn("board-word", "Word", "fa-file-word") +
          btn("board-excel", "Excel", "fa-file-excel"),
      ) + '<div id="p4BoardBody" style="padding:0 12px 12px"></div>';
    refreshBoard();
  }
  function refreshBoard() {
    $("p4BoardBody").innerHTML = boardBodyHtml(boardGroups());
  }
  function boardReportHtml() {
    return X().buildReportHtml({
      title: boardTitle(),
      bodyHtml: X().rowsToHtmlTable(boardExportRows()),
      dateText: dateText(),
      signer: actor(),
    });
  }

  /* ---------- B6: สารบบคำวินิจฉัย/คำพิพากษา (10.1.10) ---------- */
  function registryRows() {
    return A().filterJudgmentRegistry(A().buildJudgmentRegistry(cases()), state.registry);
  }
  function registryTableHtml(rows) {
    const body = rows.length
      ? rows
          .map((r) => {
            const files = r.fileNames.length
              ? r.fileNames.map((f) => '<a href="#" data-p4-file="' + esc(f) + '"><i class="fa-solid fa-paperclip"></i> ' + esc(f) + "</a>").join("<br>")
              : "-";
            return (
              '<tr><td><div class="badge-row"><span class="badge" style="background:#dbeafe;color:#1e3a8a">' + esc(r.kindName) + "</span>" +
              (r.isFinal ? '<span class="badge" style="background:#dcfce7;color:#166534">คดีถึงที่สุด</span>' : "") + "</div></td>" +
              "<td>" + esc(r.caseId) + "</td>" +
              "<td>ผู้กล่าวหา: " + esc(r.accuser || "-") + "<br>ผู้ถูกกล่าวหา: " + esc(r.accused || "-") + "</td>" +
              "<td>" + esc(r.refNo || "-") + (r.redNo ? "<br>แดง " + esc(r.redNo) : "") + "</td>" +
              "<td>" + esc(fmt(r.date)) + "</td>" +
              "<td><strong>" + esc(r.result || "-") + "</strong>" +
              (r.summary ? '<div style="font-size:.85em;color:#475569">' + esc(r.summary) + "</div>" : "") + "</td>" +
              "<td>" + files + "</td></tr>"
            );
          })
          .join("")
      : empty(7, "ไม่พบรายการตามเงื่อนไข");
    return wrapTable(["ประเภท", "เลขสำนวน", "คู่กรณี", "เลขดำ/เลขที่", "วันที่", "ผล/สรุป", "ไฟล์แนบ"], body);
  }

  /* ---------- รายงานวิเคราะห์คำพิพากษา (10.1.11.2/.3/.5) ---------- */
  const REPORT_TYPES = [
    ["quant", "เชิงปริมาณ (สถิติ)"],
    ["qual", "เชิงคุณภาพ (ผลวิเคราะห์รายสำนวน)"],
    ["court", "รายงานสรุปสำนวนคดีในชั้นศาล"],
  ];
  const REPORT_TITLES = {
    quant: "รายงานวิเคราะห์คำพิพากษา (เชิงปริมาณ)",
    qual: "รายงานวิเคราะห์คำพิพากษา (เชิงคุณภาพ)",
    court: "รายงานสรุปสำนวนคดีในชั้นศาล",
  };

  function reportFiscalYears() {
    const set = {};
    cases().forEach((c) => {
      (c.judgments || []).forEach((j) => {
        const fy = A().firstFiscalYear([j.date, c.dateReceived]);
        if (fy) set[fy] = 1;
      });
      (c.judgmentAnalyses || []).forEach((a) => {
        const fy = A().firstFiscalYear([a.date, c.dateReceived]);
        if (fy) set[fy] = 1;
      });
    });
    return Object.keys(set).sort().reverse();
  }

  /* แต่ละส่วน: {title, rows (แถวแรก = หัวตาราง), cardsHtml? (ใช้แทนตารางตอนพิมพ์/แสดงผล)} */
  function quantSections(fy) {
    const st = A().buildJudgmentStats(cases(), { fiscalYear: fy });
    const oc = A().JUDGMENT_OUTCOMES;
    return [
      {
        title: "ภาพรวม" + (fy ? " ปีงบประมาณ " + fy : ""),
        rows: [
          ["รายการ", "จำนวน"],
          ["สำนวนที่มีคำสั่ง/คำพิพากษา", st.totalCases],
          ["คำสั่ง/คำพิพากษาทั้งหมด", st.totalJudgments],
          ["คดีถึงที่สุด", st.finalCount],
          ["ผลวิเคราะห์ที่บันทึก", st.analysisCount],
        ],
      },
      {
        title: "จำแนกตามชั้น",
        rows: [["ชั้น", "รวม"].concat(oc.map((o) => o.name))].concat(
          st.levels.map((l) => [l.name, l.total].concat(oc.map((o) => l.outcomes[o.code]))),
        ),
      },
      {
        title: "จำแนกตามผลคำสั่ง/คำพิพากษา",
        rows: [["ผล", "จำนวน"]].concat(oc.map((o) => [o.name, st.outcomes[o.code]])),
      },
      {
        title: "จำแนกตามปีงบประมาณ",
        rows: [["ปีงบประมาณ", "จำนวน"]].concat(st.byFiscalYear.map((y) => [y.fiscalYear, y.total])),
      },
    ];
  }
  function qualSections(fy) {
    const rows = A().buildAnalysisReportRows(cases(), { fiscalYear: fy });
    const field = (label, v) =>
      v ? '<div><strong>' + esc(label) + ":</strong> " + esc(v).replace(/\n/g, "<br>") + "</div>" : "";
    const cards = rows.length
      ? rows
          .map(
            (r) =>
              '<div class="rpt-card" style="border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;margin:8px 0">' +
              "<div><strong>" + esc(r.caseId) + "</strong> " + esc(r.title) + "</div>" +
              field("คำพิพากษา", [r.levelName, r.judgmentResult].filter(Boolean).join(" · ")) +
              field("ประเด็นแห่งคดี", r.issue) + field("สรุปคำพิพากษา", r.summary) +
              field("ผลการวิเคราะห์", r.analysis) + field("ข้อเสนอแนะ", r.recommendation) +
              field("บันทึกโดย", r.analyst) + field("วันที่วิเคราะห์", r.date ? fmt(r.date) : "") +
              field("ไฟล์แนบ", r.fileNames.join(", ")) +
              "</div>",
          )
          .join("")
      : '<div style="text-align:center;color:#64748b;padding:16px">ยังไม่มีผลวิเคราะห์คำพิพากษาตามเงื่อนไข</div>';
    return [
      {
        title: "ผลวิเคราะห์คำพิพากษารายสำนวน" + (fy ? " ปีงบประมาณ " + fy : ""),
        cardsHtml: cards,
        rows: [["เลขสำนวน", "เรื่อง", "ชั้น", "ผลคำพิพากษา", "ประเด็นแห่งคดี", "สรุปคำพิพากษา", "ผลการวิเคราะห์", "ข้อเสนอแนะ", "บันทึกโดย", "วันที่วิเคราะห์", "ไฟล์แนบ"]].concat(
          rows.map((r) => [r.caseId, r.title, r.levelName, r.judgmentResult, r.issue, r.summary, r.analysis, r.recommendation, r.analyst, r.date ? fmt(r.date) : "", r.fileNames.join(", ")]),
        ),
      },
    ];
  }
  function courtSections(fy) {
    const rows = A()
      .buildCourtCaseSummaryRows(cases())
      .filter((r) => !fy || A().firstFiscalYear([r.latestDate]) === String(fy));
    return [
      {
        title: "สรุปสำนวนคดีในชั้นศาล" + (fy ? " ปีงบประมาณ " + fy : ""),
        rows: [["เลขสำนวน", "เรื่อง", "โจทก์", "จำเลย", "ศาล", "เลขคดีดำ", "เลขคดีแดง", "จำนวนคำสั่ง/คำพิพากษา", "ชั้นล่าสุด", "ผลล่าสุด", "วันที่", "คดีถึงที่สุด"]].concat(
          rows.map((r) => [r.caseId, r.title, r.plaintiff, r.defendant, r.courtName, r.blackNo, r.redNo, r.judgmentCount, r.latestLevelName, r.latestResult, r.latestDate ? fmt(r.latestDate) : "", r.isFinal ? "ถึงที่สุด" : "ยัง"]),
        ),
      },
    ];
  }
  function reportSections() {
    const fy = state.report.fy;
    if (state.report.type === "qual") return qualSections(fy);
    if (state.report.type === "court") return courtSections(fy);
    return quantSections(fy);
  }
  const cell = (v) => esc(v == null ? "" : v);
  function screenTable(rows) {
    return wrapTable(rows[0].map(cell), rows.length > 1 ? rows.slice(1).map((r) => "<tr>" + r.map((c) => "<td>" + cell(c) + "</td>").join("") + "</tr>").join("") : empty(rows[0].length, "ไม่มีข้อมูลตามเงื่อนไข"));
  }
  function sectionsScreenHtml(sections) {
    return sections
      .map((s) => '<h4 style="margin:14px 0 6px">' + esc(s.title) + "</h4>" + (s.cardsHtml || screenTable(s.rows)))
      .join("");
  }
  function sectionsPrintHtml(sections) {
    return sections
      .map((s) => "<h3>" + esc(s.title) + "</h3>" + (s.cardsHtml || X().rowsToHtmlTable(s.rows)))
      .join("");
  }
  /* Excel แผ่นเดียว: ชื่อส่วน → ตาราง → แถวว่างคั่น */
  function sectionsXlsxRows(sections) {
    const out = [];
    sections.forEach((s, i) => {
      if (i) out.push([]);
      if (sections.length > 1 || !s.cardsHtml) out.push([s.title]);
      s.rows.forEach((r) => out.push(r));
    });
    return out;
  }
  function reportTitle() {
    return REPORT_TITLES[state.report.type] + (state.report.fy ? " ปีงบประมาณ " + state.report.fy : "");
  }
  function reportHtml() {
    return X().buildReportHtml({
      title: reportTitle(),
      bodyHtml: sectionsPrintHtml(reportSections()),
      dateText: dateText(),
      signer: actor(),
    });
  }
  function reportBarHtml() {
    const fys = reportFiscalYears();
    return (
      bar(
        "รายงานวิเคราะห์คำพิพากษา (10.1.11)",
        sel("p4RptType", 'data-p4-filter="report.type"', REPORT_TYPES, state.report.type) +
          sel("p4RptFy", 'data-p4-filter="report.fy"', [["", "ทุกปีงบประมาณ"]].concat(fys.map((y) => [y, "ปีงบประมาณ " + y])), state.report.fy) +
          btn("rpt-print", "พิมพ์", "fa-print", "btn-primary") +
          btn("rpt-word", "Word", "fa-file-word") +
          btn("rpt-excel", "Excel", "fa-file-excel") +
          btn("rpt-pdf", "PDF", "fa-file-pdf"),
      ) + '<div id="p4RptBody" style="padding:0 12px 12px"></div>'
    );
  }
  function refreshReport() {
    $("p4RptBody").innerHTML = sectionsScreenHtml(reportSections());
  }

  function renderRegistry() {
    if (!guard("registryPanel")) return;
    const kinds = [["", "ทุกประเภท"]].concat(A().REGISTRY_KINDS.map((k) => [k.code, k.name]));
    $("registryPanel").innerHTML =
      bar(
        "สารบบคำวินิจฉัย/คำพิพากษา (10.1.10)",
        sel("p4RegKind", 'data-p4-filter="registry.kind"', kinds, state.registry.kind) +
          '<input id="p4RegQ" data-p4-filter="registry.q" type="search" placeholder="ค้นหา เลขสำนวน / ผู้ถูกกล่าวหา / ผู้กล่าวหา" value="' + esc(state.registry.q) + '" style="min-width:260px">',
      ) + '<div id="p4RegBody"></div>' + reportBarHtml();
    refreshRegistry();
    refreshReport();
  }
  function refreshRegistry() {
    $("p4RegBody").innerHTML = registryTableHtml(registryRows());
  }

  /* ---------- events (delegated) ---------- */
  function setFilter(path, value) {
    const p = path.split(".");
    state[p[0]][p[1]] = value;
  }
  function onFilter(e) {
    const el = e.target.closest("[data-p4-filter]");
    if (!el) return;
    const path = el.getAttribute("data-p4-filter");
    setFilter(path, el.value);
    if (path.indexOf("board.") === 0) refreshBoard();
    else if (path.indexOf("registry.") === 0) refreshRegistry();
    else if (path.indexOf("report.") === 0) refreshReport();
  }
  function pdfHint(html, title) {
    const go = () => X().printHtml(html, title);
    if (!global.Swal) return go();
    global.Swal.fire({
      icon: "info",
      title: "บันทึกเป็น PDF",
      text: 'ในหน้าต่างพิมพ์ ให้เลือกเครื่องพิมพ์เป็น "บันทึกเป็น PDF" (Save as PDF) แล้วกดบันทึก',
      confirmButtonText: "เปิดหน้าต่างพิมพ์",
      confirmButtonColor: "#1e3a8a",
    }).then((r) => {
      if (r.isConfirmed) go();
    });
  }
  const ACTIONS = {
    "board-print": () => X().printHtml(boardReportHtml(), "รายงานผลตามมติคณะกรรมการ"),
    "board-word": () => X().toDocx(boardReportHtml(), "รายงานผลตามมติคณะกรรมการ"),
    "board-excel": () => X().toXlsx(boardExportRows(), "ผลตามมติ", "รายงานผลตามมติคณะกรรมการ"),
    "rpt-print": () => X().printHtml(reportHtml(), reportTitle()),
    "rpt-pdf": () => pdfHint(reportHtml(), reportTitle()),
    "rpt-word": () => X().toDocx(reportHtml(), reportTitle()),
    "rpt-excel": () => X().toXlsx(sectionsXlsxRows(reportSections()), "รายงาน", reportTitle()),
  };
  function onClick(e) {
    const t = e.target;
    const file = t.closest("[data-p4-file]");
    if (file) {
      e.preventDefault();
      if (global.Swal) global.Swal.fire({ icon: "info", title: "เปิดไฟล์ " + file.getAttribute("data-p4-file") + "...", timer: 1200, showConfirmButton: false });
      return;
    }
    const act = t.closest("[data-p4-action]");
    if (!act) return;
    const fn = ACTIONS[act.getAttribute("data-p4-action")];
    if (fn) fn();
  }

  function register(renderers) {
    renderers["board-report"] = renderBoard;
    renderers.registry = renderRegistry;
    Object.keys(TAB_PANELS).forEach((tab) => {
      const panel = $(TAB_PANELS[tab]);
      if (!panel) return;
      panel.addEventListener("click", onClick);
      panel.addEventListener("change", onFilter);
      panel.addEventListener("input", (e) => {
        if (e.target.type === "search") onFilter(e);
      });
    });
    applyRoleVisibility();
  }

  global.ECMIS101Reports = { register: register, applyRoleVisibility: applyRoleVisibility, canSee: canSee };
})(window);
