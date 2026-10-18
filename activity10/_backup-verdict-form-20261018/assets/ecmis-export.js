/* ECMIS export helpers — TOR 10.1.11.3–.5 (พิมพ์ / Word / Excel / PDF)
   - buildReportHtml / rowsToHtmlTable   เค้าโครง A4 (pure — ทดสอบได้)
   - printHtml(html, title)              พิมพ์เฉพาะรายงาน; PDF = เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์
                                          (jsPDF ไม่มีฟอนต์ไทยฝังในตัว จึงใช้ print dialog แทนเพื่อให้ตัวอักษรไทยถูกต้อง)
   - toDocx(html, filename)              html-docx-js (โหลดตอนใช้งาน)
   - toXlsx(rows, sheetName, filename)   SheetJS (โหลดตอนใช้งาน)
   - readXlsxRows(file)                  อ่าน .xlsx/.xls → แถวแบบ object ตามหัวคอลัมน์
   - downloadTemplate(headers, sample, filename)  สร้างแม่แบบ Excel
   ไลบรารีภายนอกโหลดแบบ lazy ผ่าน loadScript; ออฟไลน์/โหลดไม่ได้ → Swal แจ้งข้อผิดพลาด */
(function (global) {
  "use strict";

  const LIBS = {
    xlsx: { url: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js", test: () => global.XLSX },
    docx: { url: "https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js", test: () => global.htmlDocx },
  };
  const loading = {};

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* โหลด <script> ครั้งเดียวต่อไลบรารี */
  function loadScript(key) {
    const lib = LIBS[key];
    if (!lib) return Promise.reject(new Error("ไม่รู้จักไลบรารี " + key));
    if (lib.test()) return Promise.resolve(lib.test());
    if (!loading[key]) {
      loading[key] = new Promise(function (resolve, reject) {
        const s = global.document.createElement("script");
        s.src = lib.url;
        s.onload = function () {
          lib.test() ? resolve(lib.test()) : reject(new Error("ไลบรารี " + key + " ไม่พร้อมใช้งาน"));
        };
        s.onerror = function () {
          loading[key] = null;
          reject(new Error("โหลดไลบรารี " + key + " ไม่สำเร็จ"));
        };
        global.document.head.appendChild(s);
      });
    }
    return loading[key];
  }

  function showError(title, err) {
    if (global.console) console.error(title, err);
    if (global.Swal) {
      global.Swal.fire({
        icon: "error",
        title: title,
        text: "ไม่สามารถโหลดไลบรารีส่งออก (อาจไม่ได้เชื่อมต่ออินเทอร์เน็ต) กรุณาลองใหม่ หรือใช้ปุ่มพิมพ์แทน",
        confirmButtonColor: "#1e3a8a",
      });
    }
  }

  /* ---------- เค้าโครง A4 (pure) ---------- */
  function rowsToHtmlTable(rows) {
    const list = rows || [];
    if (!list.length) return "";
    const head = "<tr>" + list[0].map((c) => "<th>" + esc(c) + "</th>").join("") + "</tr>";
    const body = list
      .slice(1)
      .map((r) => "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>")
      .join("");
    return "<table><thead>" + head + "</thead><tbody>" + body + "</tbody></table>";
  }

  /* opts: {title, bodyHtml, dateText, signer} — bodyHtml เป็น HTML ที่ผู้เรียกสร้างและ escape เองแล้ว */
  function buildReportHtml(opts) {
    const o = opts || {};
    return (
      '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>' + esc(o.title) + "</title>" +
      "<style>@page{size:A4;margin:18mm 15mm}" +
      "body{font-family:'TH SarabunPSK','Sarabun','Tahoma',sans-serif;font-size:14pt;color:#000}" +
      ".rpt-head{text-align:center;margin-bottom:10px}.rpt-org{font-size:16pt;font-weight:bold}" +
      ".rpt-title{font-size:15pt;font-weight:bold;margin-top:4px}.rpt-date{font-size:12pt;margin-top:2px}" +
      "table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12pt}" +
      "th,td{border:1px solid #000;padding:3px 6px;vertical-align:top;text-align:left}th{background:#e5e7eb}" +
      "h3{font-size:14pt;margin:12px 0 4px}.rpt-card{border:1px solid #000;padding:6px 8px;margin:6px 0;page-break-inside:avoid}" +
      ".rpt-sign{margin-top:36px;text-align:right;page-break-inside:avoid}.rpt-sign div{margin:2px 0}" +
      "</style></head><body>" +
      '<div class="rpt-head"><div class="rpt-org">สำนักงาน ป.ป.ท.</div>' +
      '<div class="rpt-title">' + esc(o.title) + "</div>" +
      '<div class="rpt-date">' + esc(o.dateText || "") + "</div></div>" +
      (o.bodyHtml || "") +
      '<div class="rpt-sign"><div>ลงชื่อ ........................................................ ผู้จัดทำรายงาน</div>' +
      "<div>(" + esc(o.signer || "........................................................") + ")</div>" +
      "<div>ตำแหน่ง ........................................................</div></div>" +
      "</body></html>"
    );
  }

  /* ---------- พิมพ์ / PDF ---------- */
  function printHtml(html, title) {
    const w = global.open("", "_blank", "width=900,height=700");
    if (!w) {
      if (global.Swal)
        global.Swal.fire({ icon: "warning", title: "เบราว์เซอร์บล็อกหน้าต่างพิมพ์", text: "กรุณาอนุญาต pop-up แล้วลองใหม่", confirmButtonColor: "#1e3a8a" });
      return false;
    }
    w.document.open();
    w.document.write(html);
    w.document.title = title || "รายงาน";
    w.document.close();
    w.focus();
    setTimeout(function () {
      w.print();
    }, 300);
    return true;
  }

  function download(blob, filename) {
    const url = global.URL.createObjectURL(blob);
    const a = global.document.createElement("a");
    a.href = url;
    a.download = filename;
    global.document.body.appendChild(a);
    a.click();
    global.document.body.removeChild(a);
    global.URL.revokeObjectURL(url);
  }

  /* ---------- Word ---------- */
  function toDocx(html, filename) {
    return loadScript("docx")
      .then(function (lib) {
        if (typeof lib.asBlob !== "function") throw new Error("html-docx-js ไม่พร้อมใช้งาน");
        download(lib.asBlob(html), (filename || "รายงาน") + ".docx");
        return true;
      })
      .catch(function (err) {
        showError("ส่งออก Word ไม่สำเร็จ", err);
        return false;
      });
  }

  /* ---------- Excel ---------- */
  /* rows = array ของ array (แถวแรกเป็นหัวตาราง) หรือ array ของ object */
  function toXlsx(rows, sheetName, filename) {
    return loadScript("xlsx")
      .then(function (X) {
        const list = rows || [];
        const sheet = Array.isArray(list[0]) ? X.utils.aoa_to_sheet(list) : X.utils.json_to_sheet(list);
        const book = X.utils.book_new();
        X.utils.book_append_sheet(book, sheet, String(sheetName || "Sheet1").slice(0, 31));
        X.writeFile(book, (filename || "รายงาน") + ".xlsx");
        return true;
      })
      .catch(function (err) {
        showError("ส่งออก Excel ไม่สำเร็จ", err);
        return false;
      });
  }

  function downloadTemplate(headers, sampleRow, filename) {
    return toXlsx([headers].concat(sampleRow ? [sampleRow] : []), "แม่แบบ", filename || "แม่แบบนำเข้า");
  }

  /* อ่านไฟล์ Excel แผ่นแรก → [{หัวคอลัมน์: ค่า}] (cellDates ให้วันที่เป็น Date) */
  function readXlsxRows(file) {
    return loadScript("xlsx").then(function (X) {
      return new Promise(function (resolve, reject) {
        const reader = new global.FileReader();
        reader.onerror = function () {
          reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
        };
        reader.onload = function () {
          try {
            const book = X.read(reader.result, { type: "array", cellDates: true });
            const sheet = book.Sheets[book.SheetNames[0]];
            resolve(X.utils.sheet_to_json(sheet, { defval: "", raw: true }));
          } catch (e) {
            reject(e);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    });
  }

  global.ECMISExport = {
    loadScript: loadScript,
    buildReportHtml: buildReportHtml,
    rowsToHtmlTable: rowsToHtmlTable,
    printHtml: printHtml,
    toDocx: toDocx,
    toXlsx: toXlsx,
    downloadTemplate: downloadTemplate,
    readXlsxRows: readXlsxRows,
    esc: esc,
  };
})(window);
