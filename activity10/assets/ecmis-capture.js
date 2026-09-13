/**
 * E-CMIS — Floating screen-capture button (all pages).
 *
 * Self-contained: injects its own styles/markup so it works the same on every
 * page regardless of that page's own CSS variables/theme (login.html,
 * index.html, design-system.html, etc. all differ). Only dependency is
 * Font Awesome for the icon, which every page already loads.
 *
 * Uses html2canvas (loaded from CDN on first click, not up front) to render
 * document.body to a PNG and downloads it named after the current page
 * (e.g. "login.png", "10-2-appeal-09-case-bureau-director-board-propose.png").
 */
(function () {
  "use strict";

  var HTML2CANVAS_SRC =
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

  function pageFileName() {
    var path = window.location.pathname;
    var base = path.substring(path.lastIndexOf("/") + 1);
    base = base.replace(/\.html?$/i, "");
    if (!base) base = "index";
    return base + ".png";
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".ecmis-capture-btn{position:fixed;right:24px;bottom:24px;width:48px;height:48px;" +
      "border-radius:50%;background:#1e3a8a;color:#fff;border:none;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;font-size:18px;" +
      "box-shadow:0 4px 14px rgba(0,0,0,0.28);z-index:2147483000;transition:transform .15s,background .15s;}" +
      ".ecmis-capture-btn:hover{background:#1e293b;transform:translateY(-2px);}" +
      ".ecmis-capture-btn:disabled{opacity:.7;cursor:wait;transform:none;}" +
      ".ecmis-capture-btn.is-done{background:#16a34a;}";
    document.head.appendChild(style);
  }

  function loadHtml2Canvas(callback) {
    if (window.html2canvas) {
      callback();
      return;
    }
    var script = document.createElement("script");
    script.src = HTML2CANVAS_SRC;
    script.onload = callback;
    script.onerror = function () {
      window.alert("ไม่สามารถโหลดไลบรารีสำหรับจับภาพหน้าจอได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
    };
    document.head.appendChild(script);
  }

  function downloadCanvasAsPng(canvas, fileName) {
    var link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function captureScreen(btn) {
    var icon = btn.querySelector("i");
    btn.disabled = true;
    icon.className = "fa-solid fa-spinner fa-spin";

    loadHtml2Canvas(function () {
      window
        .html2canvas(document.body, { useCORS: true, backgroundColor: "#ffffff" })
        .then(function (canvas) {
          downloadCanvasAsPng(canvas, pageFileName());
          icon.className = "fa-solid fa-check";
          btn.classList.add("is-done");
          setTimeout(function () {
            icon.className = "fa-solid fa-camera";
            btn.classList.remove("is-done");
            btn.disabled = false;
          }, 1200);
        })
        .catch(function (err) {
          window.alert("จับภาพหน้าจอไม่สำเร็จ: " + (err && err.message ? err.message : err));
          icon.className = "fa-solid fa-camera";
          btn.disabled = false;
        });
    });
  }

  function injectButton() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ecmis-capture-btn";
    btn.title = "บันทึกภาพหน้าจอ (" + pageFileName() + ")";
    btn.innerHTML = '<i class="fa-solid fa-camera"></i>';
    btn.addEventListener("click", function () {
      captureScreen(btn);
    });
    document.body.appendChild(btn);
  }

  function init() {
    injectStyles();
    injectButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
