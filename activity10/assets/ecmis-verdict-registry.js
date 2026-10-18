/* ECMIS 10.1 — แท็บ "ฐานข้อมูลคำพิพากษา" ในหน้า registry.html (สารบบคำวินิจฉัย/คำพิพากษา)
   1 แถว = 1 สำนวน 10.1 (main row) แสดงสถานะบันทึกรายชั้นศาล คลิกชั้นศาลเพื่อเปิด verdict-form.html
   ส่งออก: Word รายสำนวน (แบบสรุปการวิเคราะห์คดี) · Excel ทุกบันทึก (เค้าโครงชีต "ฐาน")
   ใช้งาน: ECMISVerdictRegistry.mount(hostElement) */
(function (global) {
  "use strict";

  const A = () => global.Activity10;
  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const state = { q: "", filter: "" };
  let hostEl = null;

  const FILTERS = [
    ["", "ทุกสำนวน"],
    ["has", "มีบันทึกผลคำพิพากษา"],
    ["none", "ยังไม่มีบันทึก"],
    ["draft", "มีร่างค้างอยู่"],
  ];

  function cases101() {
    return (A().getCases() || []).filter(A().isCase101);
  }
  function matches(kase) {
    const recs = R().getRecords(kase);
    if (state.filter === "has" && !recs.length) return false;
    if (state.filter === "none" && recs.length) return false;
    if (state.filter === "draft" && !recs.some((r) => r.status !== "done")) return false;
    return !state.q || A().matchesCaseSearch(kase, state.q);
  }

  function levelLinks(kase) {
    const esc = F().esc;
    return global.ECMISVerdictLists.LEVELS.map((l) => {
      const rec = R().getRecord(kase, l.code);
      const cls = rec ? (rec.status === "done" ? "done" : "draft") : "none";
      const st = rec ? (rec.status === "done" ? "บันทึกแล้ว" : "ร่าง") : "ยังไม่บันทึก";
      return (
        '<a class="vr-badge ' + cls + '" style="text-decoration:none" href="verdict-form.html?id=' + encodeURIComponent(kase.id) + "&level=" + l.code + '">' +
        esc(l.name) + " · " + st + "</a>"
      );
    }).join("");
  }

  function rowHtml(kase) {
    const esc = F().esc;
    const hasRec = R().getRecords(kase).length > 0;
    return (
      "<tr><td><strong>" + esc(kase.id) + "</strong>" +
      (kase.paccSourceId ? '<div class="vr-sub">สำนวนเดิม ' + esc(kase.paccSourceId) + "</div>" : "") + "</td>" +
      "<td>ผู้กล่าวหา: " + esc(kase.accuser || "-") + "<br>ผู้ถูกกล่าวหา: " + esc(kase.accused || "-") + "</td>" +
      "<td>" + esc(kase.prosecutorCaseTypeName || "-") + "</td>" +
      "<td>" + levelLinks(kase) + "</td>" +
      '<td style="white-space:nowrap">' +
      '<a class="btn btn-outline" href="verdict-form.html?id=' + encodeURIComponent(kase.id) + '"><i class="fa-solid fa-pen-to-square"></i>' + (F().canEdit() ? "บันทึก" : "ดู") + "</a> " +
      (hasRec ? '<button type="button" class="btn btn-outline" data-vrr-word="' + esc(kase.id) + '"><i class="fa-solid fa-file-word"></i>สรุปคำพิพากษา</button>' : "") +
      "</td></tr>"
    );
  }

  function tableHtml() {
    const list = cases101().filter(matches);
    const body = list.length
      ? list.map(rowHtml).join("")
      : '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:20px">ไม่พบสำนวนตามเงื่อนไข</td></tr>';
    return (
      '<div class="table-responsive"><table><thead><tr><th>เลขสำนวน</th><th>คู่กรณี</th><th>กรณีความเห็น/คำสั่งพนักงานอัยการ</th><th>บันทึกรายชั้นศาล</th><th>ดำเนินการ</th></tr></thead><tbody>' +
      body + "</tbody></table></div>"
    );
  }

  function render(host) {
    hostEl = host || hostEl;
    if (!hostEl || !A()) return;
    F().injectStyle();
    if (!F().canView()) {
      hostEl.innerHTML = '<div style="padding:24px;color:#64748b">เมนูนี้สำหรับผู้ใช้สายงานกฎหมายเท่านั้น</div>';
      return;
    }
    const esc = F().esc;
    const recCount = cases101().reduce((n, c) => n + R().getRecords(c).length, 0);
    hostEl.innerHTML =
      '<div class="table-title-bar"><span>ฐานข้อมูลคำพิพากษา (บันทึกผลคำพิพากษารายชั้นศาล)</span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<select data-vrr-filter="filter" aria-label="ตัวกรอง">' +
      FILTERS.map((f) => '<option value="' + f[0] + '"' + (f[0] === state.filter ? " selected" : "") + ">" + f[1] + "</option>").join("") +
      "</select>" +
      '<input type="search" data-vrr-filter="q" aria-label="ค้นหา" placeholder="ค้นหา เลขสำนวน / ผู้ถูกกล่าวหา / ผู้กล่าวหา" value="' + esc(state.q) + '" style="min-width:240px">' +
      '<button type="button" class="btn btn-outline" data-vrr-excel="1"><i class="fa-solid fa-file-excel"></i>Excel ทั้งหมด (' + recCount + " แถว)</button>" +
      "</span></div>" +
      '<div data-vrr-body="1">' + tableHtml() + "</div>";
  }

  function refreshBody() {
    const body = hostEl && hostEl.querySelector("[data-vrr-body]");
    if (body) body.innerHTML = tableHtml();
  }

  function bind(host) {
    host.addEventListener("input", (e) => {
      if (e.target.getAttribute("data-vrr-filter") !== "q") return;
      state.q = e.target.value;
      refreshBody();
    });
    host.addEventListener("change", (e) => {
      if (e.target.getAttribute("data-vrr-filter") !== "filter") return;
      state.filter = e.target.value;
      refreshBody();
    });
    host.addEventListener("click", (e) => {
      const w = e.target.closest("[data-vrr-word]");
      if (w) return F().downloadWord(w.getAttribute("data-vrr-word"));
      if (e.target.closest("[data-vrr-excel]")) F().downloadExcel(cases101(), "ฐานข้อมูลคำพิพากษา");
    });
  }

  function mount(host) {
    if (!host) return;
    F().ensureSamples();
    bind(host);
    render(host);
  }

  global.ECMISVerdictRegistry = { mount: mount, render: render };
})(window);
