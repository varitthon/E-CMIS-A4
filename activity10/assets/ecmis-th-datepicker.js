/* ช่องวันที่แบบ พ.ศ. (dd/mm/2569) แทนตัวเลือกวันที่ของเบราว์เซอร์ที่แสดงเป็น ค.ศ.
   Chrome ไม่สนใจ lang="th-TH-u-ca-buddhist" จึงต้องทำช่องแสดงผลเอง
   ช่อง input[type=date] เดิมยังอยู่ (ซ่อนไว้) และเก็บค่า ISO yyyy-mm-dd เหมือนเดิม
   โค้ดเดิมที่อ่าน/เขียน .value และ oninput/onchange ของช่องเดิมจึงทำงานได้โดยไม่ต้องแก้
   ใช้: <script src="assets/ecmis-th-datepicker.js"></script> หลังฟอร์ม — แปลงทุก input[type=date]
   ยกเว้นช่องที่มี data-th-date="off" */
(function (global) {
  "use strict";

  var BE_OFFSET = 543;
  var YEARS_BACK = 60;
  var YEARS_AHEAD = 30;
  var MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  var WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  var nativeValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toIso(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function todayIso() {
    var t = new Date();
    return toIso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }

  function parseIso(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }

  function isoToDisplay(iso) {
    var p = parseIso(iso);
    return p ? pad(p.d) + "/" + pad(p.m) + "/" + (p.y + BE_OFFSET) : "";
  }

  /* รับ dd/mm/yyyy — ปีมากกว่า 2400 ถือเป็น พ.ศ. คืน null ถ้าไม่ใช่วันที่จริง (เช่น 31/02) */
  function displayToIso(text) {
    var m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text || "");
    if (!m) return null;
    var d = +m[1];
    var mo = +m[2];
    var y = +m[3];
    if (y > 2400) y -= BE_OFFSET;
    if (y < 1000) return null;
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d)
      return null;
    return toIso(y, mo, d);
  }

  /* พิมพ์ตัวเลขล้วนแล้วเติม / ให้เอง: 14102569 → 14/10/2569 */
  function autoSlash(text) {
    var digits = String(text || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  }

  var STYLE = [
    ".th-date{position:relative;display:block}",
    ".th-date-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;border:0!important;padding:0!important}",
    ".th-date .th-date-display{padding-right:38px}",
    ".th-date-btn{position:absolute;top:50%;right:6px;transform:translateY(-50%);border:0;background:transparent;color:var(--text-muted,#64748b);padding:4px 6px;border-radius:6px;cursor:pointer;line-height:1}",
    ".th-date-btn:hover,.th-date-btn:focus-visible{color:#1e3a8a;background:rgba(30,58,138,.08);outline:none}",
    ".th-date-btn:disabled{cursor:default;opacity:.5}",
    ".th-date-display.th-date-invalid{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.15)!important}",
    ".th-date-pop{position:fixed;z-index:3000;width:290px;background:var(--bg-card,#fff);color:var(--text-title,#1e293b);border:1px solid var(--border-color,#cbd5e1);border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,.18);padding:10px;font-size:.88rem}",
    ".th-date-head{display:flex;align-items:center;gap:6px;margin-bottom:8px}",
    ".th-date-head select{flex:1;min-width:0;padding:4px 6px;border:1px solid var(--border-color,#cbd5e1);border-radius:6px;background:var(--bg-card,#fff);color:inherit;font:inherit}",
    ".th-date-nav{border:1px solid var(--border-color,#cbd5e1);background:transparent;color:inherit;width:30px;height:30px;border-radius:6px;cursor:pointer}",
    ".th-date-nav:hover{background:rgba(30,58,138,.08)}",
    ".th-date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}",
    ".th-date-wd{font-size:.78rem;font-weight:700;color:var(--text-muted,#64748b);padding:4px 0}",
    ".th-date-day{border:1px solid transparent;background:transparent;color:inherit;height:32px;border-radius:6px;cursor:pointer;font:inherit}",
    ".th-date-day:hover{background:rgba(30,58,138,.1)}",
    ".th-date-day.is-other{color:var(--text-muted,#94a3b8);opacity:.6}",
    ".th-date-day.is-today{border-color:#1e3a8a;font-weight:700}",
    ".th-date-day.is-selected{background:#1e3a8a;color:#fff;font-weight:700}",
    ".th-date-foot{display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color,#e2e8f0)}",
    ".th-date-foot button{border:0;background:transparent;color:#1e3a8a;font:inherit;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:6px}",
    ".th-date-foot button:hover{background:rgba(30,58,138,.08)}",
    ".th-date-foot .th-date-clear{color:#64748b}",
  ].join("\n");

  function injectStyle() {
    if (document.getElementById("th-datepicker-style")) return;
    var style = document.createElement("style");
    style.id = "th-datepicker-style";
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  /* ---------- ปฏิทินป๊อปอัป (ใช้ร่วมกันทุกช่อง เปิดได้ทีละช่อง) ---------- */
  var pop = null;
  var active = null; /* { input, display, viewY, viewM, commit } */

  function closePopup(returnFocus) {
    if (!pop || !active) return;
    pop.hidden = true;
    var display = active.display;
    display.setAttribute("aria-expanded", "false");
    active = null;
    if (returnFocus) display.focus();
  }

  function positionPopup() {
    if (!active) return;
    var rect = active.display.getBoundingClientRect();
    var popH = pop.offsetHeight;
    var popW = pop.offsetWidth;
    var top = rect.bottom + 4;
    if (top + popH > window.innerHeight - 8 && rect.top - popH - 4 > 8)
      top = rect.top - popH - 4;
    var left = Math.min(rect.left, window.innerWidth - popW - 8);
    pop.style.top = top + "px";
    pop.style.left = Math.max(8, left) + "px";
  }

  function yearOptions(selectedY) {
    var thisY = new Date().getFullYear();
    var from = Math.min(thisY - YEARS_BACK, selectedY);
    var to = Math.max(thisY + YEARS_AHEAD, selectedY);
    var html = "";
    for (var y = to; y >= from; y--) {
      html +=
        '<option value="' + y + '"' + (y === selectedY ? " selected" : "") + ">" +
        (y + BE_OFFSET) + "</option>";
    }
    return html;
  }

  function renderPopup() {
    var y = active.viewY;
    var m = active.viewM;
    var selected = nativeValue.get.call(active.input);
    var today = todayIso();
    var first = new Date(y, m - 1, 1);
    var start = new Date(y, m - 1, 1 - first.getDay());

    var html =
      '<div class="th-date-head">' +
      '<button type="button" class="th-date-nav" data-nav="-1" aria-label="เดือนก่อนหน้า">‹</button>' +
      '<select class="th-date-month" aria-label="เดือน">' +
      MONTHS.map(function (name, i) {
        return '<option value="' + (i + 1) + '"' + (i + 1 === m ? " selected" : "") + ">" + name + "</option>";
      }).join("") +
      "</select>" +
      '<select class="th-date-year" aria-label="ปี พ.ศ.">' + yearOptions(y) + "</select>" +
      '<button type="button" class="th-date-nav" data-nav="1" aria-label="เดือนถัดไป">›</button>' +
      "</div>" +
      '<div class="th-date-grid">' +
      WEEKDAYS.map(function (w) {
        return '<div class="th-date-wd">' + w + "</div>";
      }).join("");

    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var iso = toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
      var cls = "th-date-day";
      if (d.getMonth() !== m - 1) cls += " is-other";
      if (iso === today) cls += " is-today";
      if (iso === selected) cls += " is-selected";
      html +=
        '<button type="button" class="' + cls + '" data-iso="' + iso + '" aria-label="' +
        d.getDate() + " " + MONTHS[d.getMonth()] + " " + (d.getFullYear() + BE_OFFSET) + '"' +
        (iso === selected ? ' aria-pressed="true"' : "") + ">" + d.getDate() + "</button>";
    }
    html +=
      "</div>" +
      '<div class="th-date-foot">' +
      '<button type="button" class="th-date-today">วันนี้</button>' +
      '<button type="button" class="th-date-clear">ล้างค่า</button>' +
      "</div>";
    pop.innerHTML = html;
    positionPopup();
  }

  function shiftMonth(delta) {
    var d = new Date(active.viewY, active.viewM - 1 + delta, 1);
    active.viewY = d.getFullYear();
    active.viewM = d.getMonth() + 1;
    renderPopup();
  }

  /* ปิดป๊อปอัปแล้วบันทึกค่า (ต้องเก็บ state ไว้ก่อน เพราะ closePopup ล้าง active) */
  function pick(iso) {
    var target = active;
    closePopup(true);
    target.commit(iso);
  }

  function ensurePopup() {
    if (pop) return;
    pop = document.createElement("div");
    pop.className = "th-date-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "เลือกวันที่ (พ.ศ.)");
    pop.hidden = true;
    document.body.appendChild(pop);

    pop.addEventListener("mousedown", function (e) {
      /* กันช่องแสดงผลเสียโฟกัส (blur) ก่อนคลิกวันที่ */
      if (e.target.tagName !== "SELECT") e.preventDefault();
    });
    pop.addEventListener("click", function (e) {
      if (!active) return;
      var t = e.target;
      if (t.dataset.nav) return shiftMonth(+t.dataset.nav);
      if (t.dataset.iso) return pick(t.dataset.iso);
      if (t.classList.contains("th-date-today")) return pick(todayIso());
      if (t.classList.contains("th-date-clear")) return pick("");
    });
    pop.addEventListener("change", function (e) {
      if (!active) return;
      if (e.target.classList.contains("th-date-month")) active.viewM = +e.target.value;
      if (e.target.classList.contains("th-date-year")) active.viewY = +e.target.value;
      renderPopup();
    });
    /* Tab ออกจากช่องเลือกเดือน/ปีไปนอกปฏิทิน (และไม่ใช่ช่องแสดงผลของช่องนั้น) ให้ปิด */
    pop.addEventListener("focusout", function (e) {
      if (!active) return;
      var next = e.relatedTarget;
      if (next && (pop.contains(next) || next === active.display)) return;
      closePopup(false);
    });
    pop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePopup(true);
      }
    });
    document.addEventListener("mousedown", function (e) {
      if (!active) return;
      if (pop.contains(e.target) || active.display.parentNode.contains(e.target)) return;
      closePopup(false);
    });
    window.addEventListener("resize", positionPopup);
    window.addEventListener("scroll", positionPopup, true);
  }

  function openPopup(state) {
    ensurePopup();
    if (active === state) return;
    var p = parseIso(nativeValue.get.call(state.input)) || parseIso(todayIso());
    state.viewY = p.y;
    state.viewM = p.m;
    active = state;
    pop.hidden = false;
    state.display.setAttribute("aria-expanded", "true");
    renderPopup();
  }

  /* ---------- แปลงช่องวันที่ทีละช่อง ---------- */
  function labelTextFor(input) {
    var group = input.closest(".form-group");
    var label = group && group.querySelector("label");
    return label ? label.textContent.replace(/\s+/g, " ").replace("*", "").trim() : "";
  }

  function enhance(input) {
    if (!input || input.dataset.thDate === "on" || input.dataset.thDate === "off") return;
    injectStyle();
    input.dataset.thDate = "on";

    var wrap = document.createElement("span");
    wrap.className = "th-date";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var display = document.createElement("input");
    display.type = "text";
    display.className = (input.className + " th-date-display").trim();
    if (input.id) display.id = input.id + "_th";
    display.placeholder = "วว/ดด/ปปปป (พ.ศ.)";
    display.inputMode = "numeric";
    display.autocomplete = "off";
    display.maxLength = 10;
    display.setAttribute("aria-haspopup", "dialog");
    display.setAttribute("aria-expanded", "false");
    var labelText = labelTextFor(input);
    if (labelText) display.setAttribute("aria-label", labelText + " (วว/ดด/ปปปป พ.ศ.)");
    wrap.insertBefore(display, input);

    input.classList.add("th-date-native");
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "th-date-btn";
    btn.setAttribute("aria-label", "เปิดปฏิทิน" + (labelText ? " " + labelText : ""));
    btn.innerHTML = '<i class="fa-solid fa-calendar-days"></i>';
    wrap.appendChild(btn);

    var typedInvalid = false;

    function sync() {
      typedInvalid = false;
      display.value = isoToDisplay(nativeValue.get.call(input));
      display.classList.remove("th-date-invalid");
      display.removeAttribute("aria-invalid");
      display.removeAttribute("title");
    }

    function syncState() {
      display.disabled = input.disabled;
      display.readOnly = input.readOnly;
      btn.disabled = input.disabled || input.readOnly;
    }

    var state = {
      input: input,
      display: display,
      commit: function (iso) {
        if (iso === nativeValue.get.call(input)) return sync();
        nativeValue.set.call(input, iso);
        sync();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
    };

    /* โค้ดเดิมตั้งค่าด้วย el.value = "yyyy-mm-dd" — ให้ช่องแสดงผลตามทันที */
    Object.defineProperty(input, "value", {
      configurable: true,
      get: function () {
        return nativeValue.get.call(this);
      },
      set: function (v) {
        nativeValue.set.call(this, v);
        sync();
      },
    });

    display.addEventListener("input", function () {
      var formatted = autoSlash(display.value);
      if (formatted !== display.value) display.value = formatted;
      display.classList.remove("th-date-invalid");
    });

    function commitTyped() {
      var text = display.value.trim();
      if (!text) return state.commit("");
      var iso = displayToIso(text);
      if (iso) return state.commit(iso);
      /* วันที่ที่พิมพ์ไม่ถูกต้อง: ล้างค่าจริงเพื่อให้การตรวจช่องบังคับจับได้ แต่คงข้อความไว้ให้แก้ */
      typedInvalid = true;
      if (nativeValue.get.call(input) !== "") {
        nativeValue.set.call(input, "");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      display.classList.add("th-date-invalid");
      display.setAttribute("aria-invalid", "true");
      display.title = "รูปแบบวันที่ไม่ถูกต้อง ใช้ วว/ดด/ปปปป (พ.ศ.) เช่น 14/10/2569";
    }

    display.addEventListener("change", commitTyped);
    /* โค้ดที่เขียนค่าผ่าน setter ของ prototype (เช่นตัวเติมข้อมูลสาธิต) แล้วยิง input/change
       จะข้าม override ด้านล่าง — ฟังที่ช่องจริงแล้ว sync ตาม ยกเว้นตอนล้างค่าเพราะพิมพ์ผิด */
    function syncFromNative() {
      if (typedInvalid && nativeValue.get.call(input) === "") return;
      sync();
    }
    input.addEventListener("input", syncFromNative);
    input.addEventListener("change", syncFromNative);
    /* Tab ออกจากช่องแล้วปิดปฏิทิน — ยกเว้นโฟกัสย้ายเข้าไปในปฏิทินเอง (ช่องเลือกเดือน/ปี) */
    display.addEventListener("blur", function (e) {
      if (active !== state) return;
      if (pop && e.relatedTarget && pop.contains(e.relatedTarget)) return;
      closePopup(false);
    });
    display.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitTyped();
        closePopup(false);
      } else if (e.key === "Escape") {
        closePopup(false);
      } else if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        if (!display.readOnly && !display.disabled) openPopup(state);
      }
    });
    display.addEventListener("click", function () {
      if (!display.readOnly && !display.disabled) openPopup(state);
    });
    btn.addEventListener("click", function () {
      if (active === state) return closePopup(true);
      display.focus();
      openPopup(state);
    });

    new MutationObserver(syncState).observe(input, {
      attributes: true,
      attributeFilter: ["disabled", "readonly"],
    });
    syncState();
    sync();
  }

  function enhanceAll(root) {
    (root || document)
      .querySelectorAll('input[type="date"]')
      .forEach(enhance);
  }

  global.ThaiDatePicker = {
    enhance: enhance,
    enhanceAll: enhanceAll,
    isoToDisplay: isoToDisplay,
    displayToIso: displayToIso,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      enhanceAll();
    });
  } else {
    enhanceAll();
  }
})(window);
