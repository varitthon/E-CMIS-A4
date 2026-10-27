/* ECMIS 10.1 — แท็บ "ฐานข้อมูลคำพิพากษา" ในหน้า registry.html (สารบบคำวินิจฉัย/คำพิพากษา)
   1 แถว = 1 สำนวน 10.1 (main row) แสดงสถานะบันทึกรายชั้นศาล คลิกชั้นศาลเพื่อเปิด verdict-form.html
   ปุ่ม ▸ หน้าเลขสำนวน กางแถวรายละเอียดที่ดึงจากสำนวนเดิม + กิจกรรม 7 (ECMISVerdictRecord.paccDetailRows)
   ส่งออก: Word รายสำนวน (แบบสรุปการวิเคราะห์คดี) · Excel ทุกบันทึก (เค้าโครงชีต "ฐาน")
   ใช้งาน: ECMISVerdictRegistry.mount(hostElement) */
(function (global) {
  "use strict";

  const A = () => global.Activity10;
  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const state = { q: "", filter: "", open: new Set() }; /* open = สำนวนที่กางแถวรายละเอียดสำนวนเดิม */
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
  /* 10.3 คดีปกครอง — เคสรับคำพิพากษา (10-3v-00 บันทึกชั้นศาลปกครองชั้นต้นลงสารบบ) 2026-10-22
     หน้า verdict-form.html รับเฉพาะ 10.1 → แถว 10.3 ดูอย่างเดียว (กางรายละเอียดในตาราง) */
  function cases103() {
    return (A().getCases() || []).filter((c) => c.l3CaseType === "verdict");
  }
  function casesAll() {
    return cases101().concat(cases103());
  }
  function is103(kase) {
    return !!kase && kase.l3CaseType === "verdict";
  }
  function matches(kase) {
    const recs = R().getRecords(kase);
    if (state.filter === "has" && !recs.length) return false;
    if (state.filter === "none" && recs.length) return false;
    if (state.filter === "draft" && !recs.some((r) => r.status !== "done")) return false;
    return !state.q || A().matchesCaseSearch(kase, state.q);
  }

  /* 2 ส่วน: ศาลคดีอาญาทุจริตและประพฤติมิชอบ (ชั้นต้น/อุทธรณ์/ฎีกา) และ ศาลปกครอง (ชั้นต้น/สูงสุด) แยกบรรทัด */
  function levelLinks(kase) {
    const LS = global.ECMISVerdictLists;
    return LS.PARTS.filter((part) => !is103(kase) || part.code === "ADMIN").map(
      (part) =>
        '<div style="margin:2px 0"><span class="vr-sub" style="display:inline-block;min-width:64px">' +
        (part.code === "ADMIN" ? "ปกครอง" : "อาญา") + "</span>" +
        levelBadges(kase, LS.LEVELS.filter((l) => l.part === part.code)) + "</div>",
    ).join("");
  }
  function levelBadges(kase, levels) {
    const esc = F().esc;
    return levels.map((l) => {
      /* หลายคนในชั้นเดียวกัน → "บันทึกแล้ว 1/2 คน"; ครบทุกคน = เขียว, บางคน/ร่าง = เหลือง */
      const recs = R().getRecords(kase).filter((r) => r.level === l.code);
      const done = recs.filter((r) => r.status === "done").length;
      const cls = !recs.length ? "none" : done === recs.length ? "done" : "draft";
      const st = !recs.length ? "ยังไม่บันทึก" : recs.length > 1 ? "บันทึกแล้ว " + done + "/" + recs.length + " คน" : done ? "บันทึกแล้ว" : "ร่าง";
      if (is103(kase)) return '<span class="vr-badge ' + cls + '">' + esc(l.name) + " · " + st + "</span>";
      return (
        '<a class="vr-badge ' + cls + '" style="text-decoration:none" href="verdict-form.html?id=' + encodeURIComponent(kase.id) + "&level=" + l.code + '">' +
        esc(l.name) + " · " + st + "</a>"
      );
    }).join("");
  }

  /* สไตล์การ์ดเดียวกับ "รายละเอียดข้อมูลสำนวนคดีที่เลือก" ในหน้า 02 (case-detail-container / complaint-intake-box) */
  function injectDetailStyle() {
    if (document.getElementById("vrr-pacc-style")) return;
    const s = document.createElement("style");
    s.id = "vrr-pacc-style";
    s.textContent =
      ".vrr-pacc{background:var(--bg-body,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:8px;padding:16px;white-space:normal}" +
      ".vrr-pacc-title{font-weight:700;color:var(--text-title,#1e293b);margin-bottom:12px;display:flex;align-items:center;gap:6px}" +
      ".vrr-pacc-title i{color:#1e3a8a}" +
      ".vrr-pacc .vrr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;margin-bottom:12px}" +
      ".vrr-pacc .vrr-wide{grid-column:1/-1}" +
      ".vrr-pacc label{display:block;font-size:.88em;font-weight:600;color:var(--text-title,#1e293b);margin-bottom:6px}" +
      ".vrr-pacc .vrr-val{background:var(--bg-card,#fff);border:1px solid var(--border-color,#cbd5e1);border-radius:6px;padding:8px 12px;min-height:38px;font-size:.92em;color:var(--text-title,#1e293b);box-sizing:border-box}" +
      ".vrr-pacc .vrr-val.no{font-weight:700;color:#1e3a8a;font-family:ui-monospace,Consolas,monospace}" +
      ".vrr-pacc .vrr-val.empty{color:#94a3b8}" +
      ".vrr-pacc details{border:1px solid var(--border-color,#e2e8f0);border-radius:8px;background:var(--bg-card,#fff);margin-top:4px}" +
      ".vrr-pacc summary{cursor:pointer;padding:10px 14px;font-weight:700;color:#1e3a8a;font-size:.92em}" +
      ".vrr-pacc summary:hover{background:var(--bg-body,#f8fafc)}" +
      ".vrr-pacc summary span{font-weight:400;color:#64748b;font-size:.85em;margin-left:6px}" +
      ".vrr-pacc dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px 16px;margin:0;padding:4px 14px 14px}" +
      ".vrr-pacc dt{font-weight:400;font-size:.78em;color:#64748b}" +
      ".vrr-pacc dd{margin:0;font-weight:600;font-size:.88em;color:var(--text-title,#1e293b);word-break:break-word}" +
      "@media (max-width:720px){.vrr-pacc .vrr-grid{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  /* แถวขยาย: รายละเอียดที่ดึงจากสำนวนเดิม + กิจกรรม 7 (ข้อมูลชุดเดียวกับที่ลง Excel/Word)
     ช่องหลัก: เลขสำนวน · พฤติการณ์ · เจ้าของสำนวน · ประเภทมติชี้มูล · หน่วยงาน (+ เลขดำ ผู้กล่าวหา ผู้ถูกกล่าวหา) */
  function thaiDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(iso || ""))) return iso || "";
    return new Date(String(iso).slice(0, 10) + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }

  /* มูลเหตุ 10.3 (ECMISVerdictLists.ADMIN_CAUSES) เช่น "1. ...; 7. อื่นๆ (ข้อความ)" */
  function causesText103(v) {
    const list = (global.ECMISVerdictLists || {}).ADMIN_CAUSES || [];
    if (!v || !Array.isArray(v.codes)) return "";
    return list
      .filter((c) => v.codes.indexOf(c.code) >= 0)
      .map((c) => c.code + ". " + c.name + (c.needsOther && v.other ? " (" + v.other + ")" : ""))
      .join("; ");
  }
  /* มูลเหตุของเคส: l3Causes ของเคส ถ้าไม่มีใช้ของคดีรับคำฟ้องเดิม */
  function caseCauses103(kase) {
    if (kase.l3Causes && (kase.l3Causes.codes || []).length) return kase.l3Causes;
    const A10 = global.Activity10;
    const origin = kase.l3OriginCaseId && A10 ? A10.getCases().find((c) => c.id === kase.l3OriginCaseId) : null;
    return origin ? origin.l3Causes || null : null;
  }

  /* แถวขยายของ 10.3: ผลที่บันทึกรายชั้นศาลปกครอง (อ่านอย่างเดียว) */
  function detail103Html(kase) {
    const esc = F().esc;
    const recs = R().getRecords(kase);
    const caseCauses = caseCauses103(kase);
    const val = (label, v, wide) =>
      '<div class="' + (wide ? "vrr-wide" : "") + '"><label>' + esc(label) + '</label><div class="vrr-val' + (v ? "" : " empty") + '">' + esc(v || "-") + "</div></div>";
    const body = recs.length
      ? recs.map((r) => {
          const f = r.fields || {};
          const c = r.court || {};
          return '<div class="vrr-grid">' +
            val("ชั้นศาล", R().levelName ? R().levelName(r.level) : r.level) +
            val("ผู้ถูกฟ้องคดี", r.person) +
            val("ศาล / วันที่พิพากษา", [c.name, thaiDate(c.date)].filter(Boolean).join(" · ")) +
            val("คดีหมายเลขดำ / แดง", [c.blackNo, c.redNo].filter(Boolean).join(" / ")) +
            val("สถานะชั้นคำพิพากษา", f.verdictStage) +
            val("มูลเหตุ", causesText103(f.causes || caseCauses), true) +
            val("รายละเอียดผลคำพิพากษา", f.resultDetail, true) +
            val("คดีถึงที่สุด", f.isFinal ? "ถึงที่สุดแล้ว" + (f.finalLetterNo ? " — " + f.finalLetterNo : "") : "ยังไม่ถึงที่สุด") +
            val("สถานะบันทึก", (r.status === "done" ? "บันทึกแล้ว" : "ร่าง") + (r.updatedBy ? " · " + r.updatedBy : "")) +
            "</div>";
        }).join("")
      : '<div style="color:#b45309">ยังไม่มีบันทึกผลคำพิพากษา — บันทึกได้ตอนธุรการรับคำพิพากษา</div>';
    return (
      '<tr class="vrr-detail"><td colspan="5" style="padding:10px 12px 14px">' +
      '<div class="vrr-pacc"><div class="vrr-pacc-title"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i>ผลคำพิพากษาศาลปกครอง' +
      (kase.l3OriginCaseId ? ' <span style="font-weight:400;color:#64748b">· คดีรับคำฟ้องเดิม ' + esc(kase.l3OriginCaseId) + "</span>" : "") + "</div>" + body + "</div></td></tr>"
    );
  }

  function detailHtml(kase) {
    if (is103(kase)) return detail103Html(kase);
    const esc = F().esc;
    const d = R().paccDetailRows(kase, F().deps());
    const m = d.main;
    const val = (label, v, cls, wide) =>
      '<div class="' + (wide ? "vrr-wide" : "") + '"><label>' + esc(label) + "</label>" +
      '<div class="vrr-val' + (cls ? " " + cls : "") + (v === "-" ? " empty" : "") + '">' + esc(v) + "</div></div>";
    const body = d.paccId
      ? '<div class="vrr-grid">' +
        val("เลขสำนวน", m.caseNo, "no") +
        val("เลขดำ ป.ป.ท.", m.blackNo, "no") +
        val("พฤติการณ์", m.allegation, "", true) +
        val("เจ้าของสำนวน", m.owner) +
        val("หน่วยงาน", m.unit) +
        val("ประเภทมติชี้มูล", m.resolutionType, "", true) +
        val("ผู้กล่าวหา (ผู้ร้อง)", m.accuser) +
        val("ผู้ถูกกล่าวหา (จำเลย)", m.accused) +
        "</div>" +
        "<details><summary>ข้อมูลเพิ่มเติมจากสำนวนเดิม / มติบอร์ด<span>กดเพื่อแสดง/ซ่อน</span></summary><dl>" +
        d.rows.map((r) => "<div><dt>" + esc(r.label) + "</dt><dd>" + esc(r.value) + "</dd></div>").join("") +
        "</dl></details>"
      : '<div style="color:#b45309">ยังไม่ได้ผูกสำนวนเดิม — ผูกได้ที่หน้าบันทึกผลคำพิพากษา</div>';
    return (
      '<tr class="vrr-detail"><td colspan="5" style="padding:10px 12px 14px">' +
      '<div class="vrr-pacc"><div class="vrr-pacc-title"><i class="fa-solid fa-folder-open" aria-hidden="true"></i>รายละเอียดข้อมูลสำนวนเดิม' +
      (d.paccId ? ' <span style="font-weight:400;color:#64748b">· ' + esc(d.paccId) + "</span>" : "") + "</div>" + body + "</div></td></tr>"
    );
  }

  function rowHtml(kase) {
    const esc = F().esc;
    const hasRec = R().getRecords(kase).length > 0;
    const open = state.open.has(kase.id);
    const toggle =
      '<button type="button" class="vrr-toggle" data-vrr-toggle="' + esc(kase.id) + '" aria-expanded="' + open + '" title="รายละเอียดจากสำนวนเดิม"' +
      ' style="border:none;background:none;cursor:pointer;padding:0 6px 0 0;color:#1e3a8a;font-size:1em">' + (open ? "▾" : "▸") + "</button>";
    return (
      '<tr><td style="white-space:nowrap">' + toggle + "<strong>" + esc(kase.id) + "</strong>" +
      (kase.paccSourceId ? '<div class="vr-sub">สำนวนเดิม ' + esc(kase.paccSourceId) + "</div>" : "") + "</td>" +
      (is103(kase)
        ? "<td>ผู้ฟ้องคดี: " + esc((kase.plaintiffs || []).join(", ") || "-") + "<br>ผู้ถูกฟ้องคดี: " + esc((kase.defendants || []).join(", ") || "-") + "</td>" +
          '<td>คดีปกครอง (10.3)<div class="vr-sub">บันทึกตอนธุรการรับคำพิพากษา</div></td>' +
          "<td>" + levelLinks(kase) + "</td>" +
          '<td style="white-space:nowrap"><button type="button" class="btn btn-outline" data-vrr-toggle="' + esc(kase.id) + '"><i class="fa-solid fa-eye"></i>ดูผล</button></td></tr>'
        : "<td>ผู้กล่าวหา: " + esc(kase.accuser || "-") + "<br>ผู้ถูกกล่าวหา: " + esc(kase.accused || "-") + "</td>" +
          "<td>" + esc(kase.prosecutorCaseTypeName || "-") + "</td>" +
          "<td>" + levelLinks(kase) + F().latestVerdictHtml(kase) + "</td>" +
          '<td style="white-space:nowrap">' +
          '<a class="btn btn-outline" href="verdict-form.html?id=' + encodeURIComponent(kase.id) + '"><i class="fa-solid fa-pen-to-square"></i>' + (F().canEdit() ? "บันทึก" : "ดู") + "</a> " +
          (hasRec ? '<button type="button" class="btn btn-outline" data-vrr-word="' + esc(kase.id) + '"><i class="fa-solid fa-file-word"></i>สรุปคำพิพากษา</button>' : "") +
          "</td></tr>") +
      (open ? detailHtml(kase) : "")
    );
  }

  function tableHtml() {
    const list = casesAll().filter(matches);
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
    injectDetailStyle();
    if (!F().canView()) {
      hostEl.innerHTML = '<div style="padding:24px;color:#64748b">เมนูนี้สำหรับผู้ใช้สายงานกฎหมายเท่านั้น</div>';
      return;
    }
    const esc = F().esc;
    const recCount = casesAll().reduce((n, c) => n + R().getRecords(c).length, 0);
    hostEl.innerHTML =
      '<div class="table-title-bar"><span>ฐานข้อมูลคำพิพากษา (บันทึกผลคำพิพากษารายชั้นศาล · 10.1 คดีอาญา + 10.3 คดีปกครอง)</span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<select data-vrr-filter="filter" aria-label="ตัวกรอง">' +
      FILTERS.map((f) => '<option value="' + f[0] + '"' + (f[0] === state.filter ? " selected" : "") + ">" + f[1] + "</option>").join("") +
      "</select>" +
      '<input type="search" data-vrr-filter="q" aria-label="ค้นหา" placeholder="ค้นหา เลขสำนวน / ผู้ถูกกล่าวหา / ผู้กล่าวหา" value="' + esc(state.q) + '" style="min-width:240px">' +
      '<button type="button" class="btn btn-outline" data-vrr-excel="1"><i class="fa-solid fa-file-excel"></i>Excel ทั้งหมด (' + recCount + " แถว)</button>" +
      /* รีเฟรช = คืนข้อมูลตัวอย่างทั้งระบบ แบบเดียวกับปุ่ม "รีเฟรช" ในหน้ารายการงาน (Activity10.resetData) */
      '<button type="button" class="btn btn-outline" data-vrr-refresh="1" title="รีเซ็ตข้อมูลตัวอย่าง"><i class="fa-solid fa-rotate"></i>รีเฟรช</button>' +
      (F().canEdit()
        ? '<button type="button" class="btn btn-outline" data-vrr-reset="1" title="คืนสำนวนตัวอย่างกลับเป็นข้อมูลตั้งต้น">' +
          '<i class="fa-solid fa-rotate-left"></i>คืนค่าตัวอย่างคำพิพากษา</button>'
        : "") +
      "</span></div>" +
      '<div data-vrr-body="1">' + tableHtml() + "</div>";
  }

  function refreshBody() {
    const body = hostEl && hostEl.querySelector("[data-vrr-body]");
    if (body) body.innerHTML = tableHtml();
  }

  /* รีเฟรช — คืนข้อมูลคดีทั้งหมดเป็นค่าเริ่มต้น (ข้อความยืนยันเดียวกับหน้ารายการงาน resetDemoData) */
  function confirmRefreshAll() {
    const done = () => {
      if (A().resetData) A().resetData();
      F().ensureSamples();
      state.open.clear();
      render(hostEl);
    };
    if (!global.Swal) {
      done();
      return;
    }
    global.Swal.fire({
      title: "ยืนยันการรีเซ็ตข้อมูล?",
      html: "ระบบจะคืนข้อมูลคดีและสำนวนกลับสู่ค่าเริ่มต้นสำหรับการสาธิต<br><b style='color:#b91c1c'>สำนวนที่สร้างหรือแก้ไขเองทั้งหมดจะถูกลบถาวร</b> และไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบสำนวนที่สร้างเอง และรีเซ็ต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    }).then((res) => {
      if (!res.isConfirmed) return;
      done();
      global.Swal.fire({ icon: "success", title: "รีเซ็ตสำเร็จ", timer: 1000, showConfirmButton: false });
    });
  }

  /* คืนค่าตัวอย่าง (ยืนยันก่อน) — เฉพาะสำนวนตัวอย่าง สำนวนอื่นไม่เปลี่ยน */
  function confirmReset() {
    const ids = global.ECMISVerdictLists.SAMPLE_RECORDS.map((s) => s.caseId);
    const run = () => {
      const res = F().resetSamples();
      state.open.clear();
      render();
      if (!global.Swal) return;
      global.Swal.fire(
        res.ok
          ? { icon: "success", width: 420, title: "คืนค่าตัวอย่างแล้ว", text: res.count + " สำนวน", timer: 1400, showConfirmButton: false }
          : { icon: "error", width: 420, title: "คืนค่าไม่สำเร็จ", text: "ลองโหลดหน้าใหม่แล้วกดอีกครั้ง", confirmButtonColor: "#1e3a8a" },
      );
    };
    if (!global.Swal) return run();
    global.Swal.fire({
      icon: "warning",
      width: 460,
      title: "คืนค่าตัวอย่างคำพิพากษา?",
      html:
        '<div style="text-align:left;font-size:.92em">ผลคำพิพากษา บุคคล รายละเอียดศาล และสถานะชั้นพนักงานอัยการของสำนวนตัวอย่างจะกลับเป็นข้อมูลตั้งต้น ' +
        "(สิ่งที่แก้ไขในสำนวนเหล่านี้จะหายไป)<br><br>" + ids.map((id) => "• " + F().esc(id)).join("<br>") +
        '<br><br><span style="color:#64748b">สำนวนอื่นไม่เปลี่ยน</span></div>',
      showCancelButton: true,
      confirmButtonText: "คืนค่า",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#b91c1c",
    }).then((r) => {
      if (r.isConfirmed) run();
    });
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
      const t = e.target.closest("[data-vrr-toggle]");
      if (t) {
        const id = t.getAttribute("data-vrr-toggle");
        if (state.open.has(id)) state.open.delete(id);
        else state.open.add(id);
        refreshBody();
        const again = hostEl.querySelector('[data-vrr-toggle="' + CSS.escape(id) + '"]');
        if (again) again.focus();
        return;
      }
      const w = e.target.closest("[data-vrr-word]");
      if (w) return F().downloadWord(w.getAttribute("data-vrr-word"));
      if (e.target.closest("[data-vrr-excel]")) F().downloadExcel(cases101(), "ฐานข้อมูลคำพิพากษา");
      if (e.target.closest("[data-vrr-reset]")) confirmReset();
      if (e.target.closest("[data-vrr-refresh]")) confirmRefreshAll();
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
