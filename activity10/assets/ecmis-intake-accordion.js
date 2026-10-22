/* ECMIS — ส่วนของแบบฟอร์มหน้า 02-board-intake.html แยกเป็นการ์ดพับได้ (accordion)
   หัวข้อ = องค์ประกอบที่มี data-acc-head; เนื้อหา = พี่น้องถัดไปในพาเรนต์เดียวกันจนถึง
   หัวข้อถัดไป / <hr> / องค์ประกอบที่มี data-acc-stop → ย้ายเข้า <div class="acc-body">
   - หัวข้อธรรมดา: ห่อหัวข้อ+เนื้อหาเป็นการ์ด <section class="acc-section">
   - หัวข้อที่อยู่ในกล่องที่มี data-acc-box (เช่น รายละเอียดสำนวนที่เลือก, กรอกเลขรับ): ใช้กล่องเดิมเป็นการ์ด
   - ส่วนย่อย (class acc-sub หรืออยู่ในเนื้อหาของส่วนอื่น): การ์ดย่อย
   id เดิมไม่เปลี่ยน โค้ดเดิมที่ซ่อน/แสดงบล็อกด้วย style.display / d-none ยังทำงานเหมือนเดิม
   ทุกส่วนกางไว้ตั้งแต่เปิดหน้า; ปุ่ม "ขยายทั้งหมด / ย่อทั้งหมด" อยู่ที่หัวการ์ด
   ECMISIntakeAccordion.reveal(el) กางทุกส่วนที่ครอบ el (ใช้ตอนแจ้งข้อผิดพลาดของช่องที่อยู่ในส่วนที่ย่อไว้) */
(function (global) {
  "use strict";

  const doc = global.document;

  function injectStyle() {
    if (doc.getElementById("acc-style")) return;
    const s = doc.createElement("style");
    s.id = "acc-style";
    s.textContent =
      ".form-card-body > hr{display:none}" +
      ".acc-section{border:1px solid var(--border-color,#e2e8f0);border-radius:10px;background:var(--bg-card,#fff);margin:0 0 18px!important;padding:0!important;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}" +
      ".acc-section > [data-acc-head]{margin:0!important;padding:12px 44px 12px 16px!important;background:rgba(30,58,138,.06);border-bottom:1px solid var(--border-color,#e2e8f0);" +
      "font-weight:700;color:var(--text-title,#1e293b);display:flex!important;align-items:center;gap:8px;justify-content:flex-start!important;cursor:pointer;user-select:none;position:relative}" +
      ".acc-section > [data-acc-head][aria-expanded=false]{border-bottom-color:transparent}" +
      ".acc-section > [data-acc-head]:hover{background:rgba(30,58,138,.11)}" +
      ".acc-section > [data-acc-head]:focus-visible{outline:2px solid #1e3a8a;outline-offset:-2px}" +
      ".acc-section > [data-acc-head] .badge{margin-left:auto}" +
      ".acc-section > .acc-body{padding:16px}" +
      ".acc-section > .acc-body.acc-collapsed{display:none!important}" +
      ".acc-section--sub{margin:4px 0 14px!important;border-left:3px solid #1e3a8a;box-shadow:none}" +
      ".acc-section--sub > [data-acc-head]{padding:9px 40px 9px 12px!important;font-size:.95em;background:rgba(30,58,138,.035)}" +
      ".acc-section--sub > .acc-body{padding:12px}" +
      ".acc-chev{position:absolute;right:16px;top:50%;transform:translateY(-50%);transition:transform .2s;color:#64748b;font-size:.85em}" +
      "[data-acc-head][aria-expanded=false] .acc-chev{transform:translateY(-50%) rotate(-90deg)}" +
      ".acc-tools{margin-left:auto;display:flex;gap:6px}" +
      ".acc-tools button{font:inherit;font-size:.8em;font-weight:500;border:1px solid var(--border-color,#cbd5e1);background:var(--bg-card,#fff);color:var(--text-title,#1e293b);border-radius:6px;padding:3px 10px;cursor:pointer}" +
      ".acc-tools button:hover{border-color:#1e3a8a;color:#1e3a8a}" +
      "@media (prefers-reduced-motion: reduce){.acc-chev{transition:none}}";
    doc.head.appendChild(s);
  }

  const isBoundary = (el) => el.tagName === "HR" || el.hasAttribute("data-acc-head") || el.hasAttribute("data-acc-stop");

  function setOpen(head, open) {
    head.setAttribute("aria-expanded", open ? "true" : "false");
    const body = head.nextElementSibling;
    if (body && body.classList.contains("acc-body")) body.classList.toggle("acc-collapsed", !open);
  }

  function build(head, index) {
    const parent = head.parentNode;
    const isSub = head.classList.contains("acc-sub") || !!parent.closest(".acc-body");
    const body = doc.createElement("div");
    body.className = "acc-body";
    body.id = "acc-body-" + index;
    let next = head.nextElementSibling;
    while (next && !isBoundary(next)) {
      const move = next;
      next = next.nextElementSibling;
      body.appendChild(move);
    }
    /* กล่องเดิม (data-acc-box) เป็นการ์ดเอง; หัวข้อธรรมดาห่อด้วย <section> ใหม่ */
    let section = parent.hasAttribute("data-acc-box") ? parent : null;
    if (!section) {
      section = doc.createElement("section");
      parent.insertBefore(section, head);
      section.appendChild(head);
    }
    section.classList.add("acc-section");
    if (isSub) section.classList.add("acc-section--sub");
    head.parentNode.insertBefore(body, head.nextSibling);

    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    head.setAttribute("aria-controls", body.id);
    const chev = doc.createElement("i");
    chev.className = "fa-solid fa-chevron-down acc-chev";
    chev.setAttribute("aria-hidden", "true");
    head.appendChild(chev);
    setOpen(head, true);
    const toggle = (e) => {
      if (e.target.closest("button, a, input, select, textarea")) return;
      setOpen(head, head.getAttribute("aria-expanded") !== "true");
    };
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(e);
      }
    });
  }

  function heads() {
    return Array.from(doc.querySelectorAll("[data-acc-head]"));
  }

  function addTools() {
    const header = doc.querySelector(".form-card > .form-card-header");
    if (!header || header.querySelector(".acc-tools")) return;
    const tools = doc.createElement("span");
    tools.className = "acc-tools";
    tools.innerHTML =
      '<button type="button" data-acc-all="1">ขยายทั้งหมด</button>' + '<button type="button" data-acc-all="0">ย่อทั้งหมด</button>';
    tools.addEventListener("click", (e) => {
      const b = e.target.closest("[data-acc-all]");
      if (b) heads().forEach((h) => setOpen(h, b.getAttribute("data-acc-all") === "1"));
    });
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.appendChild(tools);
  }

  /* กางทุกส่วนที่ครอบองค์ประกอบนี้ */
  function reveal(el) {
    let node = el;
    while (node && node !== doc.body) {
      if (node.classList && node.classList.contains("acc-body")) {
        const head = node.previousElementSibling;
        if (head && head.hasAttribute("data-acc-head")) setOpen(head, true);
      }
      node = node.parentNode;
    }
  }

  /* ไม่แสดงไอคอนในปุ่มที่มีข้อความ และในหัวข้อส่วนย่อย (หัวข้อส่วนหลักยังมีไอคอน)
     ปุ่มที่มีแต่ไอคอน (ปฏิทิน / ไมค์ / ลบไฟล์) คงไว้ เพราะไม่มีข้อความอื่นให้กด; ลูกศรพับ/กางคงไว้
     ใช้ textContent (ไม่ใช่ innerText) เพราะปุ่มในส่วนที่พับอยู่มี innerText ว่าง */
  const ICON_TARGETS =
    "button, a.btn, .vr-chip, summary, .acc-section--sub > [data-acc-head], .vr-card-h, .case-search-filter-title";
  const KEEP_ICON = /chevron|caret|acc-chev/;
  function stripIcons(root) {
    const scope = root && root.querySelectorAll ? root : null;
    if (!scope) return;
    const targets = Array.from(scope.querySelectorAll(ICON_TARGETS));
    if (scope.matches && scope.matches(ICON_TARGETS)) targets.push(scope);
    targets.forEach((el) => {
      if (!el.closest(".form-card") || !el.textContent.trim()) return;
      el.querySelectorAll("i").forEach((icon) => {
        if (!KEEP_ICON.test(icon.className)) icon.remove();
      });
    });
  }
  /* เนื้อหาที่เรนเดอร์ภายหลัง (การ์ดคำพิพากษา, แผงค้นหาสำนวน) */
  function watchIcons() {
    const card = doc.querySelector(".form-card");
    if (!card || !global.MutationObserver) return;
    let queued = false;
    new global.MutationObserver(() => {
      if (queued) return;
      queued = true;
      /* setTimeout ไม่ใช่ requestAnimationFrame — rAF ไม่ทำงานเมื่อแท็บอยู่เบื้องหลัง */
      global.setTimeout(() => {
        queued = false;
        stripIcons(card);
      }, 0);
    }).observe(card, { childList: true, subtree: true });
  }

  function mount() {
    if (doc.querySelector(".acc-body")) return;
    injectStyle();
    heads().forEach(build);
    addTools();
    stripIcons(doc.querySelector(".form-card"));
    watchIcons();
  }

  global.ECMISIntakeAccordion = { mount: mount, reveal: reveal };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount);
  else mount();
})(window);
