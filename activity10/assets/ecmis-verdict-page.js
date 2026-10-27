/* ECMIS 10.1 บันทึกผลคำพิพากษา — ตัวควบคุมหน้า verdict-form.html
   ?id=<สำนวน>&level=FIRST|APPEAL|SUPREME[&person=<แท็บที่เปิด>] (ไม่ระบุชั้น = ชั้นล่าสุดที่มีบันทึก หรือศาลชั้นต้น)
   ปุ่มชั้นศาลด้านบนสลับบันทึกรายชั้น; ในชั้นเดียว: แถบศาล (ใช้ร่วม) + แท็บรายบุคคล (ECMISVerdictTabs)
   ปุ่มบันทึก/บันทึกร่างบันทึกทุกคนที่กรอกพร้อมกัน; บันทึกร่างไม่บังคับช่อง, บันทึกต้องมีประเภท + สถานะชั้นคำพิพากษาทุกคน
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

  function headerHtml(kase, level, editable) {
    const esc = F().esc;
    /* 2 ส่วน: ศาลคดีอาญาทุจริตและประพฤติมิชอบ / ศาลปกครอง — แถวละส่วน */
    const LS = global.ECMISVerdictLists;
    const chips = LS.PARTS.map((part) => {
      const btns = LS.LEVELS.filter((l) => l.part === part.code)
        .map((l) => {
          const st = levelStatus(kase, l.code);
          return (
            '<button type="button" class="vr-chip' + (l.code === level ? " on" : "") + '" data-vr-level="' + l.code + '">' +
            esc(l.name) + ' <span style="opacity:.75">· ' + st + "</span></button>"
          );
        })
        .join("");
      return (
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:8px">' +
        '<span class="vr-sub" style="min-width:230px;font-weight:600">' + esc(part.name) + "</span>" +
        '<div class="vr-chips" role="group" aria-label="' + esc(part.name) + '">' + btns + "</div></div>"
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
      F().latestVerdictHtml(kase) +
      '<div style="margin-top:6px">' + chips + "</div>" +
      (editable ? "" : '<div class="vr-sub" style="margin-top:10px"><i class="fa-solid fa-eye"></i> ดูได้อย่างเดียว — ผู้บันทึกได้คือธุรการกองกฎหมาย นิติกร และนักสืบ</div>') +
      "</div></div>"
    );
  }

  /* สถานะในศาลชั้นอื่นๆ (2026-10-27) — สรุปเฉพาะข้อมูลสำคัญของคำพิพากษาชั้นอื่นที่บันทึกไว้แล้ว
     วางก่อนรายละเอียดศาลของชั้นที่กำลังบันทึก; กด "เปิดชั้นนี้" เพื่อไปแก้ชั้นนั้น */
  function otherLevelsHtml(kase, level) {
    const esc = F().esc;
    const LS = global.ECMISVerdictLists;
    const A10 = global.Activity10;
    const dash = (v) => esc(v || "-");
    const fmtDate = (d) => (d && A10 && A10.formatDisplayDate ? A10.formatDisplayDate(new Date(d)) : d || "");
    const recs = R().getRecords(kase).filter((r) => r.level !== level);
    const levels = LS.LEVELS.filter((l) => recs.some((r) => r.level === l.code));
    const body = levels.length
      ? levels
          .map((l) => {
            const rows = recs.filter((r) => r.level === l.code);
            const court = rows[0].court || {};
            const courtLine = [court.name, court.blackNo && "คดีดำ " + court.blackNo, court.redNo && "คดีแดง " + court.redNo, fmtDate(court.date)]
              .filter(Boolean)
              .join(" · ");
            const tr = rows
              .map((r) => {
                const f = r.fields || {};
                return (
                  "<tr><td>" + dash(r.person) + "</td><td>" + (F().verdictHighlight({ verdictType: f.verdictType, verdictTypeOther: f.verdictTypeOther }) || "-") +
                  "</td><td>" + dash(R().stripNo(f.verdictStage)) +
                  "</td><td>" + dash(R().stripNo(f.prosecutorStatus)) + "</td><td>" + (f.isFinal ? F().verdictHighlight({ isFinal: true }) : "-") +
                  '</td><td><span class="vr-sub">' + (r.status === "done" ? "บันทึกแล้ว" : "ร่าง") + "</span></td></tr>"
                );
              })
              .join("");
            return (
              '<div style="margin-bottom:12px">' +
              '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px">' +
              '<div><strong>' + esc(l.name) + '</strong> <span class="vr-sub">' + esc(courtLine) + "</span></div>" +
              '<button type="button" class="btn btn-outline" style="height:30px;padding:2px 10px;font-size:.85em" data-vr-open-level="' + l.code + '">เปิดชั้นนี้</button></div>' +
              '<div style="overflow-x:auto"><table class="table table-sm" style="font-size:.88em;margin:0"><thead><tr>' +
              "<th>บุคคล</th><th>ประเภทคำพิพากษา</th><th>สถานะชั้นคำพิพากษา</th><th>สถานะชั้นพนักงานอัยการ</th><th>คดีถึงที่สุด</th><th>บันทึก</th>" +
              "</tr></thead><tbody>" + tr + "</tbody></table></div></div>"
            );
          })
          .join("")
      : '<div class="vr-sub">ยังไม่มีบันทึกคำพิพากษาในศาลชั้นอื่น</div>';
    return '<div class="vr-card"><div class="vr-card-h"><i class="fa-solid fa-layer-group"></i>สถานะในศาลชั้นอื่นๆ</div><div class="vr-card-b">' + body + "</div></div>";
  }

  function footerHtml(editable) {
    const back = '<a class="btn btn-outline" href="' + BACK + '">กลับ</a>';
    if (!editable) return '<div style="display:flex;justify-content:flex-end">' + back + "</div>";
    return (
      '<div id="vr_errors" class="vr-err" role="alert"></div>' +
      '<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">' +
      '<span class="vr-sub">บันทึกทุกคนที่กรอกในชั้นนี้พร้อมกัน</span>' + back +
      '<button type="button" class="btn btn-outline" data-vr-act="draft">บันทึกร่าง</button>' +
      '<button type="button" class="btn btn-primary" data-vr-act="done" style="background:#1e3a8a">บันทึก</button>' +
      "</div>"
    );
  }

  const LEGEND =
    '<div class="vr-legend"><span><span class="vr-dot done"></span>บันทึกแล้ว</span><span><span class="vr-dot draft"></span>ร่าง</span>' +
    '<span><span class="vr-dot"></span>ยังไม่กรอก</span><span><span class="vr-dot err"></span>มีข้อผิดพลาด</span>' +
    '<span><span class="vr-dirty" style="color:#b45309">แก้ไข</span> ยังไม่บันทึก</span></div>';

  /* เพิ่มบุคคล: ติ๊กจากสำนวนเดิม/จำเลยที่ยังไม่มีแท็บ (รวมคนที่เคยลบออกจากชั้นนี้) หรือพิมพ์ชื่ออื่น
     → เลิกซ่อนคนที่เลือกในชั้นนี้ (บันทึกทันที) แล้วเปิดแท็บ */
  function addPersons(kase, level, taken) {
    return global.ECMISVerdictTabs.pickPersons(candidates(kase), taken).then((names) => {
      const fresh = A().findCaseById(kase.id);
      if (names.some((n) => R().hiddenPersons(fresh, level).indexOf(n) >= 0)) {
        A().updateCase(kase.id, R().hiddenPatch(fresh, level, names, false));
      }
      return names;
    });
  }

  /* ลบบุคคลออกจากชั้นนี้ (ยืนยันก่อน): ลบผลที่บันทึกไว้ (ถ้ามี) และซ่อนชื่อจากสำนวนเดิมในชั้นนี้ ไม่ให้กลับมาเมื่อเปิดหน้าใหม่
     เพิ่มกลับได้จาก "+ เพิ่มบุคคล" — แท็บอื่นที่ยังไม่บันทึกยังอยู่ */
  function removePerson(kase, level, person) {
    const fresh = A().findCaseById(kase.id);
    const hasRecord = !!R().getRecord(fresh, level, person);
    const run = () => {
      let k = A().findCaseById(kase.id);
      if (hasRecord) k = A().updateCase(kase.id, R().removePersonPatch(k, level, person)) || A().findCaseById(kase.id);
      if (candidates(k).indexOf(person) >= 0) A().updateCase(kase.id, R().hiddenPatch(k, level, person, true));
      return true;
    };
    if (!global.Swal) return Promise.resolve(run());
    return global.Swal.fire({
      icon: "warning",
      width: 400,
      title: "ลบ " + F().esc(person) + " ออกจากชั้นนี้?",
      text: hasRecord ? "ผลคำพิพากษาของบุคคลนี้ในชั้นนี้จะถูกลบ" : "เพิ่มกลับได้จาก + เพิ่มบุคคล",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#b91c1c",
    }).then((r) => (r.isConfirmed ? run() : false));
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
    const hidden = R().hiddenPersons(kase, level);
    const names = candidates(kase).filter((n) => hidden.indexOf(n) < 0);
    const order = R().tabOrder(names, R().personsAt(kase, level).concat(q.person ? [q.person] : []));
    const shared = R().initialState(kase, level, order[0] || "");
    F().setCaseContext(kase); /* ฐานความผิดที่แนะนำของสำนวนนี้ */
    host.innerHTML =
      headerHtml(kase, level, editable) +
      otherLevelsHtml(kase, level) +
      '<div id="vr_court">' + F().courtStripHtml(P, shared.court, shared.fileNames, level) + "</div>" +
      '<div class="vr-card"><div class="vr-card-h"><i class="fa-solid fa-users"></i>ผลคำพิพากษารายบุคคล</div><div class="vr-card-b">' +
      '<div id="vr_tabs" class="vr-tabs" aria-label="บุคคล"></div><div id="vr_panel" class="vr-tabpanel"></div>' + LEGEND +
      "</div></div>" +
      footerHtml(editable);

    const courtHost = doc.getElementById("vr_court");
    F().bindForm(courtHost, P);
    if (!editable) F().setDisabled(courtHost, true);
    const courtSnap = () => {
      const c = F().collect(courtHost, P);
      return JSON.stringify(c.court) + "|" + c.newFileNames.length;
    };
    /* AG รายบุคคล (2026-10-27) — คนที่ยังไม่เคยบันทึก AG ตั้งต้นตาม R().defaultProsecutorStatus (สำนวน → อสส. → หน้า 02) */
    const states = R().tabStates(kase, level, order);
    Object.keys(states).forEach((name) => {
      const f = states[name].fields;
      if (f && !f.prosecutorStatus) f.prosecutorStatus = R().defaultProsecutorStatus(kase);
    });
    const courtBase = courtSnap();

    const tabs = global.ECMISVerdictTabs.create({
      bar: doc.getElementById("vr_tabs"),
      panel: doc.getElementById("vr_panel"),
      prefix: P,
      level: level,
      order: order,
      states: states,
      active: q.person,
      editable: editable,
      showStatus: true,
      emptyHint: "ยังไม่มีรายชื่อผู้ถูกกล่าวหา — กดเพิ่มบุคคล หรือผูกสำนวนเดิม",
      canRemove: () => true,
      onAdd: (taken) => addPersons(kase, level, taken),
      onRemove: (p) => removePerson(kase, level, p),
    });

    let leaving = false;
    const dirty = () => editable && (tabs.anyDirty() || courtSnap() !== courtBase);
    const leave = (fn) => {
      if (!dirty() || !global.Swal) {
        leaving = true;
        return fn();
      }
      global.Swal.fire({
        icon: "warning",
        text: "มีผลคำพิพากษาที่ยังไม่บันทึก ออกจากหน้านี้โดยไม่บันทึก?",
        showCancelButton: true,
        confirmButtonText: "ออกโดยไม่บันทึก",
        cancelButtonText: "อยู่ต่อ",
        confirmButtonColor: "#b91c1c",
      }).then((r) => {
        if (!r.isConfirmed) return;
        leaving = true;
        fn();
      });
    };
    global.addEventListener("beforeunload", (e) => {
      if (leaving || !dirty()) return;
      e.preventDefault();
      e.returnValue = "";
    });

    function onSave(status) {
      const entries = tabs.entries().map((x) => Object.assign(x, { status: status }));
      const res = F().saveLevel(kase.id, level, F().collect(courtHost, P), entries, {
        verdictProsecutorStatus: kase.verdictProsecutorStatus || "",
      });
      const box = doc.getElementById("vr_errors");
      if (!res.ok) {
        tabs.markErrors(res.errors);
        box.innerHTML = res.errors
          .map((x) => "<div>" + F().esc((x.person ? x.person + ": " : "") + x.errors.join(" · ")) + "</div>")
          .join("");
        return;
      }
      box.innerHTML = "";
      leaving = true;
      const reload = () => go(kase.id, level, tabs.active());
      if (!global.Swal) return reload();
      global.Swal.fire({
        icon: "success",
        title: (status === "done" ? "บันทึกแล้ว " : "บันทึกร่างแล้ว ") + entries.length + " คน",
        timer: 1100,
        showConfirmButton: false,
      }).then(reload);
    }

    host.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-vr-level]");
      if (chip && chip.classList.contains("vr-chip")) return leave(() => go(kase.id, chip.getAttribute("data-vr-level")));
      const openLevel = e.target.closest("[data-vr-open-level]");
      if (openLevel) return leave(() => go(kase.id, openLevel.getAttribute("data-vr-open-level")));
      const act = e.target.closest("[data-vr-act]");
      if (!act) return;
      const a = act.getAttribute("data-vr-act");
      if (a === "link") leave(() => openLinkDialog(kase, level));
      else if (a === "draft" || a === "done") onSave(a);
      else if (a === "word") F().downloadWord(kase.id);
      else if (a === "print") F().printSummary(kase.id);
      else if (a === "excel") F().downloadExcel([A().findCaseById(kase.id)], "ฐานข้อมูลคำพิพากษา_" + kase.id);
    });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", render);
  else render();
})(window);
