/* ECMIS 10.1 บันทึกผลคำพิพากษา — แท็บรายบุคคล (ผู้ถูกกล่าวหา/จำเลย) ใช้ทั้งหน้า verdict-form.html และการ์ดในหน้า 02
   - 1 แท็บ = 1 คน ในชั้นศาลที่เลือก; ศาล/เลขคดี/วันที่/ไฟล์อยู่ในแถบศาลด้านบน (ใช้ร่วมทุกคน) ไม่อยู่ในแท็บ
   - สลับแท็บแล้วค่าที่กรอกยังอยู่ (เก็บในหน่วยความจำ) — หน้าเรียก entries() ตอนบันทึก เพื่อบันทึกทุกคนพร้อมกัน
   - ปุ่ม "คัดลอกจาก <คนก่อนหน้า>" คัดลอกทุกช่องของแท็บก่อนหน้า (รวมที่ยังไม่บันทึก) มาแทนแท็บปัจจุบัน
   - จุดสถานะ: เขียว บันทึกแล้ว / เหลือง ร่าง / เทา ยังไม่กรอก / แดง มีข้อผิดพลาด ; "แก้ไข" = มีค่าที่ยังไม่บันทึก
   ECMISVerdictTabs.create({ bar, panel, prefix, level, order, states, active, editable, showStatus, emptyHint,
                             canRemove(person), onAdd(order) → Promise<ชื่อ|ชื่อ[]>, onRemove(person) → Promise<boolean>, onChange() })
   ECMISVerdictTabs.pickPersons(names, taken) — หน้าต่างเพิ่มบุคคล (ติ๊กจากสำนวนเดิมได้หลายคน + ชื่ออื่น) */
(function (global) {
  "use strict";

  const F = () => global.ECMISVerdictForm;
  const R = () => global.ECMISVerdictRecord;
  const esc = (v) => F().esc(v);
  const STATUS_TEXT = { done: "บันทึกแล้ว", draft: "ร่าง", "": "ยังไม่บันทึก" };

  function confirmBox(text, confirmText) {
    if (!global.Swal) return Promise.resolve(global.confirm(text));
    return global.Swal.fire({
      icon: "question",
      text: text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
    }).then((r) => !!r.isConfirmed);
  }
  function infoBox(text) {
    if (global.Swal) global.Swal.fire({ icon: "info", text: text, confirmButtonColor: "#1e3a8a" });
  }

  /* หน้าต่างเพิ่มบุคคล (ขนาดเล็ก): ติ๊กรายชื่อจากสำนวนเดิม/จำเลยที่ยังไม่มีแท็บ ได้หลายคน + พิมพ์ชื่ออื่น
     names = รายชื่อให้ติ๊ก, taken = แท็บที่มีอยู่แล้ว → Promise<string[]> (ยกเลิก = []) */
  function pickPersons(names, taken) {
    if (!global.Swal) return Promise.resolve([]);
    const list = (names || []).filter((n) => (taken || []).indexOf(n) < 0);
    const rows = list.length
      ? list
          .map(
            (n, i) =>
              '<label style="display:flex;gap:8px;align-items:center;padding:6px 2px;cursor:pointer;font-size:.95rem">' +
              '<input type="checkbox" data-vr-pick="' + i + '" style="width:16px;height:16px;margin:0"> ' + esc(n) + "</label>",
          )
          .join("")
      : '<div style="color:#64748b;font-size:.85rem;padding:4px 0">รายชื่อจากสำนวนเดิมมีแท็บครบแล้ว</div>';
    return global.Swal.fire({
      width: 400,
      padding: "1rem",
      html:
        '<div style="text-align:left">' +
        '<div style="font-weight:600;font-size:1.05rem;color:#1e293b;margin-bottom:8px">เพิ่มบุคคล</div>' +
        '<div style="font-size:.8rem;color:#64748b;margin-bottom:2px">จากสำนวนเดิม / จำเลย</div>' +
        '<div style="max-height:220px;overflow:auto">' + rows + "</div>" +
        '<div style="font-size:.8rem;color:#64748b;margin:10px 0 4px">ชื่ออื่น (ถ้ามี)</div>' +
        '<input id="vrPickOther" type="text" placeholder="เช่น นายสมชาย ใจดี" style="width:100%;box-sizing:border-box;height:36px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font:inherit;font-size:.95rem">' +
        "</div>",
      showCancelButton: true,
      confirmButtonText: "เพิ่ม",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      focusConfirm: false,
      preConfirm: () => {
        const box = global.Swal.getPopup();
        const picked = Array.from(box.querySelectorAll("[data-vr-pick]:checked")).map((el) => list[+el.getAttribute("data-vr-pick")]);
        const other = String(box.querySelector("#vrPickOther").value || "").trim();
        if (other && (taken || []).indexOf(other) >= 0) {
          global.Swal.showValidationMessage("มีแท็บของ " + other + " แล้ว");
          return false;
        }
        const out = R().tabOrder(picked, other ? [other] : []);
        if (!out.length) {
          global.Swal.showValidationMessage("เลือกรายชื่อ หรือพิมพ์ชื่ออื่น");
          return false;
        }
        return out;
      },
    }).then((r) => (r.isConfirmed ? r.value : []));
  }

  function create(o) {
    const P = o.prefix;
    const editable = o.editable !== false;
    let level = o.level;
    let order = (o.order || []).slice();
    let active = "";
    const store = {};
    const added = new Set(); /* คนที่เพิ่มเองในหน้านี้ — คงแท็บไว้แม้ไม่อยู่ในรายชื่อสำนวน */
    const removed = new Set(); /* คนที่ลบแท็บออก — setOrder ไม่เติมกลับ จนกว่าจะเพิ่มใหม่ */
    let errorsFor = {};

    /* เทียบค่าหลัง normalize (ตัวเลขจากฟอร์มเป็นข้อความ "2" แต่ค่าที่บันทึกเป็นตัวเลข 2) */
    const snap = (fields) => JSON.stringify(R().normalizeFields(fields).fields);
    function ensure(p, st) {
      if (store[p]) return;
      const fields = R().copyFields(st ? st.fields : null);
      store[p] = { fields: fields, status: (st && st.status) || "", base: snap(fields) };
    }
    order.forEach((p) => ensure(p, o.states && o.states[p]));
    active = o.active && order.indexOf(o.active) >= 0 ? o.active : order[0] || "";

    const formHost = () => o.panel.querySelector("[data-vr-person-form]");
    function stash() {
      const h = formHost();
      if (active && h && store[active]) store[active].fields = R().copyFields(F().collect(h, P).fields);
    }
    const hasInput = (p) => !!store[p] && F().hasInput({ fields: store[p].fields });
    const isDirty = (p) => !!store[p] && snap(store[p].fields) !== store[p].base;
    function dotClass(p) {
      if (errorsFor[p]) return "err";
      return store[p].status || (hasInput(p) ? "draft" : "");
    }

    function renderBar() {
      const add = editable
        ? '<button type="button" class="vr-tab add" data-vr-tabact="add">+ เพิ่มบุคคล</button>'
        : "";
      const tabs = order
        .map((p, i) => {
          const on = p === active;
          return (
            '<button type="button" class="vr-tab" role="tab" id="' + P + "tab" + i + '" aria-selected="' + on + '" tabindex="' + (on ? "0" : "-1") +
            '" data-vr-tab="' + esc(p) + '"><span class="vr-no">' + (i + 1) + '</span><span class="vr-dot ' + dotClass(p) + '"></span>' + esc(p) +
            (isDirty(p) ? '<span class="vr-dirty" title="มีการแก้ไขที่ยังไม่บันทึก">แก้ไข</span>' : "") + "</button>"
          );
        })
        .join("");
      o.bar.innerHTML = tabs || '<span class="vr-sub" style="padding:8px 4px">' + esc(o.emptyHint || "ยังไม่มีรายชื่อ") + "</span>";
      if (add) o.bar.insertAdjacentHTML("beforeend", add);
    }

    function toolsHtml() {
      const prev = R().previousPerson(order, active);
      const st = o.showStatus ? ' <span class="vr-sub" style="font-weight:400">· ' + STATUS_TEXT[store[active].status || ""] + "</span>" : "";
      const copy = editable && prev
        ? '<button type="button" class="btn btn-outline" data-vr-tabact="copy">คัดลอกจาก ' + esc(prev) + "</button>"
        : "";
      const remove = editable && o.canRemove && o.canRemove(active)
        ? '<button type="button" class="btn btn-outline" data-vr-tabact="remove" style="color:#b91c1c">ลบบุคคลนี้</button>'
        : "";
      const errs = errorsFor[active]
        ? '<div class="vr-err" role="alert" style="margin:0 0 10px">' + errorsFor[active].map((e) => "<div>" + esc(e) + "</div>").join("") + "</div>"
        : "";
      return (
        '<div class="vr-tabbar-tools"><div style="font-weight:600;color:var(--text-title,#1e293b)">' + esc(active) + st + "</div>" +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' + copy + remove + "</div></div>" + errs
      );
    }

    function renderPanel() {
      if (!active) {
        o.panel.innerHTML = '<div class="vr-sub">' + esc(o.emptyHint || "ยังไม่มีรายชื่อ") + "</div>";
        return;
      }
      o.panel.setAttribute("aria-labelledby", P + "tab" + order.indexOf(active));
      o.panel.innerHTML = toolsHtml() + '<div data-vr-person-form="1">' + F().personFormHtml(P, store[active].fields, level) + "</div>";
      const h = formHost();
      F().bindForm(h, P);
      if (!editable) F().setDisabled(h, true);
    }

    function render() {
      renderBar();
      renderPanel();
      if (o.onChange) o.onChange();
    }

    function switchTo(p) {
      if (!store[p] || p === active) return;
      stash();
      active = p;
      render();
      const btn = o.bar.querySelector('[aria-selected="true"]');
      if (btn) btn.focus();
    }

    /* ชื่อเดียวหรือหลายชื่อ — เปิดแท็บของคนแรกที่เพิ่ม */
    function addPerson(names) {
      const list = (Array.isArray(names) ? names : [names]).map((n) => String(n || "").trim()).filter(Boolean);
      if (!list.length) return;
      stash();
      list.forEach((n) => {
        added.add(n);
        removed.delete(n);
        if (order.indexOf(n) < 0) order.push(n);
        ensure(n, null);
      });
      active = list[0];
      render();
    }

    function drop(p) {
      delete store[p];
      delete errorsFor[p];
      added.delete(p);
      removed.add(p);
      order = order.filter((x) => x !== p);
      if (active === p) active = order[0] || "";
      render();
    }

    /* คัดลอกผลจากแท็บก่อนหน้า (ค่าในหน่วยความจำ รวมที่ยังไม่บันทึก) */
    function copyPrevious() {
      const prev = R().previousPerson(order, active);
      if (!prev) return;
      stash();
      if (!hasInput(prev)) return infoBox("ยังไม่มีผลคำพิพากษาของ " + prev + " ให้คัดลอก");
      const target = active;
      const run = () => {
        store[target].fields = R().copyFields(store[prev].fields);
        delete errorsFor[target];
        render();
      };
      if (!hasInput(target)) return run();
      confirmBox("แทนที่ผลคำพิพากษาของ " + target + " ด้วยผลของ " + prev + "?", "คัดลอก").then((ok) => {
        if (ok) run();
      });
    }

    o.bar.setAttribute("role", "tablist");
    o.panel.setAttribute("role", "tabpanel");
    o.bar.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-vr-tab]");
      if (tab) return switchTo(tab.getAttribute("data-vr-tab"));
      if (e.target.closest('[data-vr-tabact="add"]') && o.onAdd) {
        stash();
        o.onAdd(order.slice()).then(addPerson);
      }
    });
    o.bar.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const i = order.indexOf(active) + (e.key === "ArrowRight" ? 1 : -1);
      if (i >= 0 && i < order.length) {
        e.preventDefault();
        switchTo(order[i]);
      }
    });
    o.panel.addEventListener("click", (e) => {
      const act = e.target.closest("[data-vr-tabact]");
      if (!act) return;
      const a = act.getAttribute("data-vr-tabact");
      if (a === "copy") copyPrevious();
      if (a === "remove" && o.onRemove) {
        const p = active;
        o.onRemove(p).then((ok) => {
          if (ok) drop(p);
        });
      }
    });
    /* แก้ไขค่า → อัปเดตจุดสถานะ/ป้าย "แก้ไข" บนแท็บ */
    const onEdit = (e) => {
      if (!e.target.closest("[data-vr-person-form]")) return;
      stash();
      renderBar();
    };
    o.panel.addEventListener("change", onEdit);
    o.panel.addEventListener("input", onEdit);

    render();

    return {
      active: () => active,
      order: () => order.slice(),
      switchTo: switchTo,
      add: addPerson,
      /* คนที่กรอกแล้ว [{ person, fields }] ตามลำดับแท็บ */
      entries: () => {
        stash();
        return order.filter(hasInput).map((p) => ({ person: p, fields: R().copyFields(store[p].fields) }));
      },
      anyDirty: () => {
        stash();
        return order.some(isDirty);
      },
      /* errors = [{ person, errors }] — แสดงในแท็บของคนนั้น และเปิดแท็บแรกที่ผิด */
      markErrors: (list) => {
        stash();
        errorsFor = {};
        (list || []).forEach((x) => {
          if (x.person && store[x.person]) errorsFor[x.person] = x.errors;
        });
        const first = (list || []).find((x) => errorsFor[x.person]);
        if (first) active = first.person;
        render();
      },
      /* หน้า 02: รายชื่อเปลี่ยน (เลือกสำนวนเดิม/แก้จำเลย) — คงแท็บที่กรอกแล้ว/เพิ่มเองไว้ */
      setOrder: (names) => {
        stash();
        const keep = order.filter((p) => hasInput(p) || store[p].status || added.has(p));
        const next = R().tabOrder((names || []).filter((n) => !removed.has(n)), keep);
        if (next.join("\n") === order.join("\n")) return;
        order = next;
        order.forEach((p) => ensure(p, null));
        if (order.indexOf(active) < 0) active = order[0] || "";
        render();
      },
      /* เปลี่ยนชั้นศาล → ตัวเลือกสถานะชั้นคำพิพากษาเปลี่ยนตาม */
      setLevel: (lv) => {
        stash();
        level = lv;
        renderPanel();
      },
    };
  }

  global.ECMISVerdictTabs = { create: create, pickPersons: pickPersons };
})(window);
