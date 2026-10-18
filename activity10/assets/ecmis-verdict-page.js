/* ECMIS 10.1 บันทึกผลคำพิพากษา — ตัวควบคุมหน้า verdict-form.html
   ?id=<สำนวน>&level=FIRST|APPEAL|SUPREME (ไม่ระบุชั้น = ชั้นล่าสุดที่มีบันทึก หรือศาลชั้นต้น)
   ปุ่มชั้นศาลด้านบนสลับบันทึกรายชั้น; บันทึกร่างไม่บังคับช่อง, บันทึกต้องมีประเภท + สถานะชั้นคำพิพากษา
   บทบาทที่ไม่อยู่ใน ECMISVerdictForm.EDIT_ROLES ดูได้อย่างเดียว; บทบาทนอกสายกฎหมายเห็นข้อความแจ้ง */
(function (global) {
  "use strict";

  const A = () => global.Activity10;
  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const doc = global.document;
  const P = "vr_";
  const BACK = "registry.html?tab=verdict-db";

  function params() {
    const q = new URLSearchParams(global.location.search);
    return { id: q.get("id") || "", level: q.get("level") || "" };
  }
  function go(id, level) {
    global.location.href = "verdict-form.html?id=" + encodeURIComponent(id) + "&level=" + encodeURIComponent(level);
  }
  function defaultLevel(kase) {
    const recs = R().getRecords(kase);
    return recs.length ? recs[recs.length - 1].level : "FIRST";
  }
  function message(host, html) {
    host.innerHTML = '<div class="table-card" style="padding:24px;color:#64748b">' + html + "</div>";
  }

  /* สำนวนเดิมที่ผูกอยู่ (paccSourceId) หรือจับคู่อัตโนมัติจากเลขสำนวนเดโมเดิม */
  function linkInfoHtml(kase, editable) {
    const esc = F().esc;
    const pacc = R().paccOf(kase, A().getPaccIntakeDatabase());
    const how = !pacc ? "" : kase.paccSourceId === pacc.id ? "" : ' <span class="vr-sub">(จับคู่อัตโนมัติจากเลขสำนวน)</span>';
    const text = pacc
      ? "<strong>" + esc(pacc.id) + "</strong> · " + esc(pacc.accused || "-") + " · " + esc(pacc.title || "") + how
      : '<span style="color:#b45309">ยังไม่ได้ผูกสำนวนเดิม — ข้อมูลสำนวน/มติ/ต้นสังกัดในการส่งออกจะว่าง</span>';
    return (
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;font-size:.88em">' +
      '<span><i class="fa-solid fa-link" style="color:#1e3a8a"></i> สำนวนเดิม: ' + text + "</span>" +
      (editable ? '<button type="button" class="btn btn-outline" style="height:30px;padding:4px 12px" data-vr-act="link">' +
        '<i class="fa-solid fa-pen"></i>' + (pacc ? "เปลี่ยนสำนวนเดิม" : "ผูกสำนวนเดิม") + "</button>" : "") +
      "</div>"
    );
  }

  /* เลือกสำนวน ป.ป.ท. เดิม (หมวด 10.1) → บันทึกแบบเดียวกับหน้า 02 (paccSourceId / paccCaseNo / paccFiles) */
  function openLinkDialog(kase, level) {
    const db = (A().getPaccIntakeDatabase() || []).filter((p) => (p.category || "10.1") === "10.1");
    const options = { "": "— ไม่ผูกสำนวนเดิม —" };
    db.forEach((p) => {
      options[p.id] = p.id + " · " + (p.accused || "-") + " · " + String(p.title || "").slice(0, 60);
    });
    const current = R().paccOf(kase, A().getPaccIntakeDatabase());
    const apply = (id) => {
      const p = db.find((x) => x.id === id);
      A().updateCase(kase.id, {
        paccSourceId: p ? p.id : "",
        paccCaseNo: p ? p.paccCaseNo || "" : "",
        paccFiles: p ? (p.files || []).map((f) => ({ name: f.name, href: f.href })) : [],
      });
      go(kase.id, level);
    };
    if (!global.Swal) return;
    global.Swal.fire({
      title: "ผูกสำนวนเดิม (สำนวน ป.ป.ท.)",
      input: "select",
      inputOptions: options,
      inputValue: current ? current.id : "",
      width: 720,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
    }).then((res) => {
      if (res.isConfirmed) apply(res.value);
    });
  }

  function headerHtml(kase, level, editable) {
    const esc = F().esc;
    const chips = global.ECMISVerdictLists.LEVELS.map((l) => {
      const rec = R().getRecord(kase, l.code);
      const st = rec ? (rec.status === "done" ? "บันทึกแล้ว" : "ร่าง") : "ยังไม่บันทึก";
      return (
        '<button type="button" class="vr-chip' + (l.code === level ? " on" : "") + '" data-vr-level="' + l.code + '">' +
        esc(l.name) + ' <span style="opacity:.75">· ' + st + "</span></button>"
      );
    }).join("");
    return (
      '<div class="vr-card"><div class="vr-card-b">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">' +
      '<div><div style="font-weight:700;font-size:1.05em;color:var(--text-title)">' + esc(kase.id) + "</div>" +
      '<div class="vr-sub" style="font-size:.88em">ผู้ถูกกล่าวหา: ' + esc(kase.accused || "-") +
      (kase.prosecutorCaseTypeName ? " · อัยการ: " + esc(kase.prosecutorCaseTypeName) : "") + "</div></div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-outline" data-vr-act="word"><i class="fa-solid fa-file-word"></i>สรุปคำพิพากษา (Word)</button>' +
      '<button type="button" class="btn btn-outline" data-vr-act="print"><i class="fa-solid fa-print"></i>พิมพ์</button>' +
      '<button type="button" class="btn btn-outline" data-vr-act="excel"><i class="fa-solid fa-file-excel"></i>Excel</button>' +
      "</div></div>" +
      linkInfoHtml(kase, editable) +
      '<div class="vr-chips" style="margin-top:12px" role="group" aria-label="ชั้นศาล">' + chips + "</div>" +
      (editable ? "" : '<div class="vr-sub" style="margin-top:10px"><i class="fa-solid fa-eye"></i> ดูได้อย่างเดียว — ผู้บันทึกได้คือธุรการกองกฎหมายและนิติกร</div>') +
      "</div></div>"
    );
  }

  function footerHtml(editable) {
    const back = '<a class="btn btn-outline" href="' + BACK + '">กลับ</a>';
    if (!editable) return '<div style="display:flex;justify-content:flex-end">' + back + "</div>";
    return (
      '<div id="vr_errors" class="vr-err" role="alert"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">' + back +
      '<button type="button" class="btn btn-outline" data-vr-act="draft"><i class="fa-solid fa-floppy-disk"></i>บันทึกร่าง</button>' +
      '<button type="button" class="btn btn-primary" data-vr-act="done" style="background:#1e3a8a"><i class="fa-solid fa-check"></i>บันทึก</button>' +
      "</div>"
    );
  }

  function onSave(kase, level, status) {
    const res = F().save(kase.id, level, F().collect(doc.getElementById("vr_form"), P), status);
    const box = doc.getElementById("vr_errors");
    if (!res.ok) {
      box.innerHTML = res.errors.map((e) => "<div>" + F().esc(e) + "</div>").join("");
      return;
    }
    box.innerHTML = "";
    const reload = () => go(kase.id, level);
    if (!global.Swal) return reload();
    global.Swal.fire({ icon: "success", title: status === "done" ? "บันทึกแล้ว" : "บันทึกร่างแล้ว", timer: 1100, showConfirmButton: false }).then(reload);
  }

  function onClick(kase, level, e) {
    const chip = e.target.closest("[data-vr-level]");
    if (chip) return go(kase.id, chip.getAttribute("data-vr-level"));
    const act = e.target.closest("[data-vr-act]");
    if (!act) return;
    const a = act.getAttribute("data-vr-act");
    if (a === "link") openLinkDialog(kase, level);
    else if (a === "draft" || a === "done") onSave(kase, level, a);
    else if (a === "word") F().downloadWord(kase.id);
    else if (a === "print") F().printSummary(kase.id);
    else if (a === "excel") F().downloadExcel([A().findCaseById(kase.id)], "ฐานข้อมูลคำพิพากษา_" + kase.id);
  }

  function render() {
    const host = doc.getElementById("verdictPage");
    if (!host || !A()) return;
    F().injectStyle();
    if (!F().canView()) return message(host, "เมนูนี้สำหรับผู้ใช้สายงานกฎหมายเท่านั้น");
    F().ensureSamples();
    const q = params();
    const kase = q.id ? A().findCaseById(q.id) : null;
    if (!kase || !A().isCase101(kase)) {
      return message(host, 'ไม่พบสำนวน 10.1 ที่ระบุ — เลือกสำนวนจาก <a href="' + BACK + '">ฐานข้อมูลคำพิพากษา</a>');
    }
    const level = R().levelName(q.level) ? q.level : defaultLevel(kase);
    const editable = F().canEdit();
    host.innerHTML =
      headerHtml(kase, level, editable) +
      '<div id="vr_form">' + F().formHtml(P, R().initialState(kase, level), level) + "</div>" +
      footerHtml(editable);
    const form = doc.getElementById("vr_form");
    F().bindForm(form, P);
    if (!editable) F().setDisabled(form, true);
    host.addEventListener("click", (e) => onClick(kase, level, e));
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", render);
  else render();
})(window);
