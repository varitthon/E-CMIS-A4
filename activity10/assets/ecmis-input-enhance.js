/* ECMIS — เสริมช่องกรอกทุกหน้า (2026-10-27) โหลดอัตโนมัติจาก ecmis-shell.js
   1) ช่องข้อความยาว (<textarea>) มีปุ่มไมค์กลมข้างป้ายชื่อช่อง (แบบเดียวกับ .btn-mic เดิมของหน้า 02/06)
      พูดแล้วแปลงเป็นข้อความภาษาไทย (Web Speech API, th-TH); ช่องที่หน้ามีไมค์เดิมอยู่แล้ว (toggleSpeechToText) ข้าม
      เบราว์เซอร์ที่ไม่รองรับ = ปุ่มกดไม่ได้พร้อมคำอธิบาย (Chrome/Edge ต้องเปิดผ่าน http(s) ไม่ใช่ file://)
   2) ทุก <select> ค้นหาได้: คลิกแล้วเปิดกล่องค้นหา + รายการตัวเลือก (รวมหัวข้อกลุ่ม optgroup)
      select เดิมยังอยู่และเป็นตัวเก็บค่า — เลือกแล้วตั้ง value + ส่ง change ให้โค้ดเดิมทำงานตามปกติ
      คีย์บอร์ด (Tab/ลูกศร) ยังใช้ select เดิมได้
   ช่องที่สร้างทีหลัง (เช่น แท็บรายบุคคล) เสริมให้อัตโนมัติด้วย MutationObserver
   ไม่ต้องการให้เสริม: ใส่ data-no-enhance ที่ช่องนั้น */
(function (global) {
  "use strict";
  const doc = global.document;
  const Speech = global.SpeechRecognition || global.webkitSpeechRecognition;
  const DONE = "data-ecmis-enhanced";

  function injectStyle() {
    if (doc.getElementById("ecmis-enhance-style")) return;
    const s = doc.createElement("style");
    s.id = "ecmis-enhance-style";
    s.textContent =
      /* หน้าตาเดียวกับ .btn-mic เดิม (ปุ่มกลม 26px ข้างป้ายชื่อช่อง) */
      ".ecmis-mic{background:var(--bg-card,#fff);border:1px solid var(--border-color,#cbd5e1);border-radius:50%;width:26px;height:26px;display:inline-flex;" +
      "align-items:center;justify-content:center;cursor:pointer;color:#2563eb;font-size:12px;vertical-align:middle;margin-left:8px;padding:0;" +
      "transition:all .2s ease;box-shadow:0 1px 2px rgba(15,23,42,.08)}" +
      ".ecmis-mic:hover{background:#2563eb;color:#fff;border-color:#2563eb;transform:scale(1.08)}.ecmis-mic:disabled{opacity:.45;cursor:not-allowed;transform:none}" +
      ".ecmis-mic.recording{background:#dc2626!important;color:#fff!important;border-color:#b91c1c!important;animation:ecmis-mic-pulse 1.2s infinite ease-in-out}" +
      "@keyframes ecmis-mic-pulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.6);transform:scale(1)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0);transform:scale(1.1)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0);transform:scale(1)}}" +
      "@media (prefers-reduced-motion:reduce){.ecmis-mic.recording{animation:none}}" +
      ".ecmis-mic-row{display:flex;justify-content:flex-end;margin-top:4px}" +
      ".ecmis-ss{position:absolute;z-index:3000;min-width:220px;max-width:min(560px,94vw);background:var(--bg-card,#fff);color:var(--text-title,#1e293b);" +
      "border:1px solid var(--border-color,#cbd5e1);border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.18);padding:8px}" +
      ".ecmis-ss input{width:100%;box-sizing:border-box;padding:6px 10px;border:1px solid var(--border-color,#cbd5e1);border-radius:8px;margin-bottom:6px;background:var(--bg-body,#fff);color:inherit}" +
      ".ecmis-ss ul{list-style:none;margin:0;padding:0;max-height:280px;overflow:auto}" +
      ".ecmis-ss li{padding:6px 10px;border-radius:6px;cursor:pointer;font-size:.92em}" +
      ".ecmis-ss li.grp{cursor:default;font-weight:700;font-size:.8em;color:#64748b;padding-top:8px}" +
      ".ecmis-ss li.opt.active,.ecmis-ss li.opt:hover{background:rgba(30,58,138,.1)}" +
      ".ecmis-ss li.opt.sel{font-weight:700;color:#1e3a8a}.ecmis-ss li.opt.dis{opacity:.45;cursor:not-allowed}" +
      ".ecmis-ss .empty{padding:8px 10px;color:#64748b;font-size:.88em}";
    doc.head.appendChild(s);
  }

  /* ---------- 1) ไมค์สำหรับ textarea ---------- */
  let activeRec = null;
  /* ป้ายชื่อของช่อง: label[for=id] → label ในกล่องช่องเดียวกัน (.vr-f / .form-group / .mb-3 / .col) */
  function labelOf(area) {
    if (area.id) {
      const byFor = doc.querySelector('label[for="' + area.id + '"]');
      if (byFor) return byFor;
    }
    const wrap = area.closest(".vr-f, .form-group, .mb-3, .mb-2, [class*='col-']");
    const lbl = wrap && wrap.querySelector("label");
    return lbl && !lbl.contains(area) && !lbl.querySelector("input,select,textarea") ? lbl : null;
  }
  /* หน้ามีไมค์เดิมของช่องนี้อยู่แล้ว (onclick="toggleSpeechToText('id', this)") → ไม่เพิ่มซ้ำ */
  function hasOldMic(area) {
    if (!area.id) return false;
    return Array.from(doc.querySelectorAll("[onclick*='toggleSpeechToText']")).some(
      (el) => el.getAttribute("onclick").indexOf(area.id) >= 0,
    );
  }

  function addMic(area) {
    if (hasOldMic(area)) return;
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "ecmis-mic";
    btn.setAttribute("aria-label", "พูดเพื่อพิมพ์");
    btn.innerHTML = '<i class="fa-solid fa-microphone" aria-hidden="true"></i>';
    if (!Speech) {
      btn.disabled = true;
      btn.title = "เบราว์เซอร์นี้ไม่รองรับการพูดเป็นข้อความ (ใช้ Chrome หรือ Edge ผ่าน http/https)";
    } else {
      btn.title = "คลิกเพื่อพูด (พิมพ์ด้วยเสียง Speech-to-Text)";
      btn.addEventListener("click", () => toggleMic(area, btn));
    }
    const label = labelOf(area);
    if (label) {
      /* คลิกปุ่มในป้าย label[for] ต้องไม่ไปโฟกัสช่อง/สลับ checkbox */
      btn.addEventListener("click", (e) => e.preventDefault());
      label.appendChild(btn);
    } else {
      const row = doc.createElement("div");
      row.className = "ecmis-mic-row";
      row.appendChild(btn);
      area.insertAdjacentElement("afterend", row);
    }
    /* ช่องถูกปิด (ดูอย่างเดียว) → ปิดปุ่มด้วย */
    const sync = () => {
      if (Speech) btn.disabled = area.disabled || area.readOnly;
    };
    sync();
    new MutationObserver(sync).observe(area, { attributes: true, attributeFilter: ["disabled", "readonly"] });
  }

  function setMicState(btn, on) {
    btn.classList.toggle("recording", on);
    btn.title = on ? "กำลังฟังเสียง... (คลิกอีกครั้งเพื่อหยุด)" : "คลิกเพื่อพูด (พิมพ์ด้วยเสียง Speech-to-Text)";
  }

  function toggleMic(area, btn) {
    if (activeRec) {
      const same = activeRec.btn === btn;
      activeRec.rec.stop();
      if (same) return;
    }
    const rec = new Speech();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      text = text.trim();
      if (!text) return;
      area.value = area.value && !/\s$/.test(area.value) ? area.value + " " + text : area.value + text;
      area.dispatchEvent(new Event("input", { bubbles: true }));
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        btn.title = "ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน — อนุญาตไมโครโฟนในเบราว์เซอร์แล้วลองใหม่";
      }
    };
    rec.onend = () => {
      setMicState(btn, false);
      if (activeRec && activeRec.rec === rec) activeRec = null;
    };
    activeRec = { rec: rec, btn: btn };
    setMicState(btn, true);
    rec.start();
  }

  /* ---------- 2) select ค้นหาได้ ---------- */
  let panel = null;
  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
    doc.removeEventListener("mousedown", onOutside, true);
  }
  function onOutside(e) {
    if (panel && !panel.contains(e.target) && e.target !== panel.forSelect) closePanel();
  }

  function itemsOf(sel) {
    const out = [];
    Array.from(sel.children).forEach((node) => {
      if (node.tagName === "OPTGROUP") {
        out.push({ group: node.label });
        Array.from(node.children).forEach((o) => out.push({ opt: o, grouped: node.label }));
      } else if (node.tagName === "OPTION") {
        out.push({ opt: node });
      }
    });
    return out;
  }

  function openPanel(sel) {
    closePanel();
    const box = doc.createElement("div");
    box.className = "ecmis-ss";
    box.forSelect = sel;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "ค้นหาตัวเลือก");
    const input = doc.createElement("input");
    input.type = "search";
    input.placeholder = "พิมพ์เพื่อค้นหา…";
    input.setAttribute("aria-label", "ค้นหาตัวเลือก");
    const list = doc.createElement("ul");
    list.setAttribute("role", "listbox");
    box.appendChild(input);
    box.appendChild(list);
    const items = itemsOf(sel);
    let active = -1;

    const choose = (opt) => {
      if (opt.disabled) return;
      const changed = sel.value !== opt.value;
      sel.value = opt.value;
      closePanel();
      sel.focus();
      if (changed) sel.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const shown = items.filter(
        (it) => it.group || it.opt.text.toLowerCase().indexOf(q) >= 0 || (it.grouped || "").toLowerCase().indexOf(q) >= 0,
      );
      /* ซ่อนหัวข้อกลุ่มที่ไม่มีตัวเลือกเหลือ */
      const visible = shown.filter((it, i) => !it.group || (shown[i + 1] && !shown[i + 1].group));
      list.innerHTML = "";
      active = -1;
      visible.forEach((it) => {
        const li = doc.createElement("li");
        if (it.group) {
          li.className = "grp";
          li.textContent = it.group;
        } else {
          li.className = "opt" + (it.opt.selected ? " sel" : "") + (it.opt.disabled ? " dis" : "");
          li.setAttribute("role", "option");
          li.textContent = it.opt.text || "—";
          li.optRef = it.opt;
          li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            choose(it.opt);
          });
        }
        list.appendChild(li);
      });
      if (!list.querySelector("li.opt")) list.innerHTML = '<div class="empty">ไม่พบตัวเลือก</div>';
    };
    const opts = () => Array.from(list.querySelectorAll("li.opt:not(.dis)"));
    const highlight = (i) => {
      const all = opts();
      if (!all.length) return;
      active = (i + all.length) % all.length;
      all.forEach((li, j) => li.classList.toggle("active", j === active));
      all[active].scrollIntoView({ block: "nearest" });
    };
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlight(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlight(active - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const li = opts()[active >= 0 ? active : 0];
        if (li) choose(li.optRef);
      } else if (e.key === "Escape") {
        closePanel();
        sel.focus();
      }
    });
    render();

    const r = sel.getBoundingClientRect();
    box.style.left = Math.max(8, r.left + global.scrollX) + "px";
    box.style.top = r.bottom + global.scrollY + 4 + "px";
    box.style.width = Math.max(r.width, 220) + "px";
    doc.body.appendChild(box);
    panel = box;
    doc.addEventListener("mousedown", onOutside, true);
    input.focus();
  }

  function makeSearchable(sel) {
    sel.addEventListener("mousedown", (e) => {
      if (sel.disabled || e.button !== 0) return;
      e.preventDefault();
      if (panel && panel.forSelect === sel) return closePanel();
      openPanel(sel);
    });
  }

  /* ---------- เสริมทั้งหน้า + ช่องที่เพิ่มทีหลัง ---------- */
  function enhance(root) {
    const scope = root && root.querySelectorAll ? root : doc;
    scope.querySelectorAll("textarea:not([" + DONE + "]):not([data-no-enhance])").forEach((t) => {
      t.setAttribute(DONE, "1");
      addMic(t);
    });
    scope.querySelectorAll("select:not([multiple]):not([" + DONE + "]):not([data-no-enhance])").forEach((s) => {
      s.setAttribute(DONE, "1");
      makeSearchable(s);
    });
  }

  function start() {
    injectStyle();
    enhance(doc);
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      global.requestAnimationFrame(() => {
        queued = false;
        enhance(doc);
      });
    }).observe(doc.body, { childList: true, subtree: true });
    global.addEventListener("resize", closePanel);
  }

  global.ECMISInputEnhance = { enhance: enhance };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
