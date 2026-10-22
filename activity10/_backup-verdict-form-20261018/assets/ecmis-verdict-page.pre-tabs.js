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
    return { id: q.get("id") || "", level: q.get("level") || "", person: q.get("person") || "" };
  }
  function go(id, level, person) {
    global.location.href =
      "verdict-form.html?id=" + encodeURIComponent(id) + "&level=" + encodeURIComponent(level) + (person ? "&person=" + encodeURIComponent(person) : "");
  }
  /* บุคคลที่แสดง: ?person= → คนแรกที่มีบันทึกในชั้นนี้ → ผู้ถูกกล่าวหาคนแรกของสำนวน */
  function currentPerson(kase, level, asked) {
    return asked || R().personsAt(kase, level)[0] || R().defaultPerson(kase);
  }
  function candidates(kase) {
    return R().personCandidates(kase, R().paccOf(kase, A().getPaccIntakeDatabase()));
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
      options[p.id] = F().esc(p.id + " · " + (p.accused || "-") + " · " + String(p.title || "").slice(0, 60));
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

  /* สถานะรายชั้น: ยังไม่บันทึก / ร่าง / บันทึกแล้ว / "บันทึกแล้ว 1/2 คน" */
  function levelStatus(kase, level) {
    const recs = R().getRecords(kase).filter((r) => r.level === level);
    if (!recs.length) return "ยังไม่บันทึก";
    const done = recs.filter((r) => r.status === "done").length;
    if (recs.length === 1) return done ? "บันทึกแล้ว" : "ร่าง";
    return "บันทึกแล้ว " + done + "/" + recs.length + " คน";
  }

  /* แถวบุคคลของชั้นที่เลือก: ชิปรายคน + เพิ่มบุคคล / คัดลอกจาก / ลบบุคคลนี้ */
  function personBarHtml(kase, level, person, editable) {
    const esc = F().esc;
    const persons = R().personsAt(kase, level);
    const all = persons.indexOf(person) >= 0 ? persons : persons.concat([person]);
    const chips = all
      .map((p) => {
        const rec = R().getRecord(kase, level, p);
        const st = rec ? (rec.status === "done" ? "บันทึกแล้ว" : "ร่าง") : "ยังไม่บันทึก";
        return (
          '<button type="button" class="vr-chip' + (p === person ? " on" : "") + '" data-vr-person="' + esc(p) + '">' +
          '<i class="fa-solid fa-user"></i> ' + esc(p) + ' <span style="opacity:.75">· ' + st + "</span></button>"
        );
      })
      .join("");
    const others = persons.filter((p) => p !== person);
    const actions = editable
      ? '<button type="button" class="vr-chip add" data-vr-act="add-person"><i class="fa-solid fa-user-plus"></i> เพิ่มบุคคล</button>' +
        (others.length ? '<button type="button" class="vr-chip add" data-vr-act="copy-person"><i class="fa-solid fa-copy"></i> คัดลอกผลจาก…</button>' : "") +
        (R().getRecord(kase, level, person) ? '<button type="button" class="vr-chip add" data-vr-act="remove-person" style="color:#b91c1c"><i class="fa-solid fa-user-minus"></i> ลบบุคคลนี้</button>' : "")
      : "";
    return (
      '<div style="margin-top:10px"><div class="vr-sub" style="margin-bottom:6px">ผลคำพิพากษารายบุคคล</div>' +
      '<div class="vr-chips" role="group" aria-label="บุคคล">' + chips + actions + "</div></div>"
    );
  }

  function headerHtml(kase, level, person, editable) {
    const esc = F().esc;
    const chips = global.ECMISVerdictLists.LEVELS.map((l) => {
      const st = levelStatus(kase, l.code);
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
      personBarHtml(kase, level, person, editable) +
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

  function onSave(kase, level, person, status) {
    const res = F().save(kase.id, level, F().collect(doc.getElementById("vr_form"), P), status, person);
    const box = doc.getElementById("vr_errors");
    if (!res.ok) {
      box.innerHTML = res.errors.map((e) => "<div>" + F().esc(e) + "</div>").join("");
      return;
    }
    box.innerHTML = "";
    const reload = () => go(kase.id, level, person);
    if (!global.Swal) return reload();
    global.Swal.fire({ icon: "success", title: status === "done" ? "บันทึกแล้ว" : "บันทึกร่างแล้ว", timer: 1100, showConfirmButton: false }).then(reload);
  }

  /* เพิ่มบุคคล: เลือกจากสำนวนเดิม/จำเลย (ที่ยังไม่มีในชั้นนี้) หรือพิมพ์ชื่อเอง */
  function addPerson(kase, level, person) {
    if (!global.Swal) return;
    const taken = R().personsAt(kase, level).concat([person]);
    const options = {};
    candidates(kase)
      .filter((n) => taken.indexOf(n) < 0)
      .forEach((n) => {
        options[n] = F().esc(n); /* SweetAlert2 แสดงป้ายตัวเลือกแบบ HTML */
      });
    const OTHER = "__other__";
    options[OTHER] = "อื่นๆ (พิมพ์ชื่อ)";
    global.Swal.fire({
      title: "เพิ่มบุคคลในชั้นนี้",
      input: "select",
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: "ถัดไป",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
    }).then((res) => {
      if (!res.isConfirmed) return;
      if (res.value !== OTHER) return go(kase.id, level, res.value);
      global.Swal.fire({
        title: "ชื่อบุคคล",
        input: "text",
        inputPlaceholder: "เช่น นายสมชาย ใจดี",
        showCancelButton: true,
        confirmButtonText: "เพิ่ม",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#1e3a8a",
        inputValidator: (v) => (String(v || "").trim() ? null : "กรุณาพิมพ์ชื่อ"),
      }).then((r2) => {
        if (r2.isConfirmed) go(kase.id, level, String(r2.value).trim());
      });
    });
  }

  /* คัดลอกผลคำพิพากษา/การลงโทษของคนอื่นในชั้นเดียวกันมาใส่ฟอร์ม (ยังไม่บันทึก) */
  function copyFromPerson(kase, level, person) {
    if (!global.Swal) return;
    const options = {};
    R()
      .personsAt(kase, level)
      .filter((p) => p !== person)
      .forEach((p) => {
        options[p] = F().esc(p);
      });
    global.Swal.fire({
      title: "คัดลอกผลจาก",
      input: "select",
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: "คัดลอก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
    }).then((res) => {
      if (!res.isConfirmed) return;
      const state = R().initialState(kase, level, person);
      const src = R().getRecord(kase, level, res.value);
      state.fields = Object.assign(R().emptyFields(), src ? src.fields : {});
      const form = doc.getElementById("vr_form");
      form.innerHTML = F().formHtml(P, state, level);
    });
  }

  function removePerson(kase, level, person) {
    const run = () => {
      A().updateCase(kase.id, R().removePersonPatch(A().findCaseById(kase.id), level, person));
      go(kase.id, level);
    };
    if (!global.Swal) return run();
    global.Swal.fire({
      icon: "warning",
      title: "ลบบุคคลนี้ออกจากชั้นศาล?",
      text: person + " — ผลคำพิพากษาของบุคคลนี้ในชั้นนี้จะถูกลบ",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#b91c1c",
    }).then((r) => {
      if (r.isConfirmed) run();
    });
  }

  function onClick(kase, level, person, e) {
    const chip = e.target.closest("[data-vr-level]");
    if (chip && chip.classList.contains("vr-chip")) return go(kase.id, chip.getAttribute("data-vr-level"));
    const pchip = e.target.closest("[data-vr-person]");
    if (pchip) return go(kase.id, level, pchip.getAttribute("data-vr-person"));
    const act = e.target.closest("[data-vr-act]");
    if (!act) return;
    const a = act.getAttribute("data-vr-act");
    if (a === "link") openLinkDialog(kase, level);
    else if (a === "add-person") addPerson(kase, level, person);
    else if (a === "copy-person") copyFromPerson(kase, level, person);
    else if (a === "remove-person") removePerson(kase, level, person);
    else if (a === "draft" || a === "done") onSave(kase, level, person, a);
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
    const person = currentPerson(kase, level, q.person);
    const editable = F().canEdit();
    host.innerHTML =
      headerHtml(kase, level, person, editable) +
      '<div id="vr_form">' + F().formHtml(P, R().initialState(kase, level, person), level) + "</div>" +
      footerHtml(editable);
    const form = doc.getElementById("vr_form");
    F().bindForm(form, P);
    if (!editable) F().setDisabled(form, true);
    host.addEventListener("click", (e) => onClick(kase, level, person, e));
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", render);
  else render();
})(window);
