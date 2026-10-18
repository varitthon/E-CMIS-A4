/* =====================================================================
   E-CMIS 10.3 — เอกสารสด (Live Document)
   แม่แบบเอกสารราชการให้หน้าตาเหมือน PDF ต้นฉบับ (docs/10.3 mockup/ref doc)
     memo(d)   T1 บันทึกข้อความ   — PDF 3, 4-A, 5-A
     letter(d) T2 หนังสือภายนอก   — PDF 4-B, 5-B, 7
     answer(d) T3 คำให้การ (ค.๓)  — PDF 5-C
   + ตัวแสดงผลแบบหน้า A4 (ตัดหน้าอัตโนมัติ / ดูทีละหน้า-ต่อเนื่อง / ซูม / ดาวน์โหลด .docx)
   + บันทึกร่าง (เก็บค่าฟอร์มและ editor ลงเคส ไม่เปลี่ยนสถานะ)
   ต้องโหลดหลัง ecmis-10-3.js และใช้คู่กับ ecmis-10-3-paper.css
   ===================================================================== */
(function (global) {
  "use strict";

  const GARUDA_SRC = "garuda.png";
  const TH_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
  const MM_TO_PX = 96 / 25.4;
  /* ความสูงพื้นที่เนื้อหาต่อหน้า = 297 − ขอบบน 25 − ขอบล่าง 20 มม. */
  const CONTENT_HEIGHT_PX = Math.floor((297 - 25 - 20) * MM_TO_PX);
  const DEFAULT_ZOOM = 0.5;

  /* ----------------------------------------------------------- text helpers */
  function th(value) {
    return String(value == null ? "" : value).replace(/[0-9]/g, function (d) {
      return TH_DIGITS[Number(d)];
    });
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ค่าที่ผู้ใช้กรอก → HTML ปลอดภัย + เลขไทย + ขึ้นบรรทัดใหม่ */
  function txt(value) {
    return th(esc(value)).replace(/\n/g, "<br />");
  }

  /* เปลี่ยนเลขอารบิกเป็นเลขไทยเฉพาะใน text node ของ HTML (ไม่แตะ attribute) */
  function thHTML(html) {
    const box = document.createElement("div");
    box.innerHTML = html || "";
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      node.nodeValue = th(node.nodeValue);
      node = walker.nextNode();
    }
    return box.innerHTML;
  }

  function dot(value, cls) {
    const has = value != null && String(value).trim() !== "";
    return (
      '<span class="l3p-dot' + (cls ? " " + cls : "") + '">' +
      (has ? txt(value) : "&nbsp;") +
      "</span>"
    );
  }

  function line(key, value, opts) {
    const o = opts || {};
    return (
      '<div class="l3p-line">' +
      '<span class="l3p-key' + (o.keyClass ? " " + o.keyClass : "") + '">' + key + "</span>" +
      dot(value) +
      (o.after || "") +
      "</div>"
    );
  }

  function garuda(size) {
    return '<img class="l3p-garuda is-' + size + '" src="' + GARUDA_SRC + '" alt="ตราครุฑ" />';
  }

  /* HTML จาก TipTap → บล็อกย่อหน้าราชการ (ย่อหน้าละบล็อก เพื่อให้ตัดหน้าได้) */
  function editorBlocks(html, opts) {
    const o = opts || {};
    const box = document.createElement("div");
    box.innerHTML = thHTML(html || "");
    const out = [];
    const paraClass = "l3p-para" + (o.underline ? " l3p-uline" : "");
    Array.from(box.children).forEach(function (el) {
      const tag = el.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        Array.from(el.children).forEach(function (li, i) {
          const mark = tag === "ol" ? th(i + 1) + ". " : "• ";
          out.push('<p class="' + paraClass + ' is-list">' + mark + li.innerHTML.replace(/<\/?p>/g, "") + "</p>");
        });
        return;
      }
      if (!el.textContent.trim()) return;
      const html = '<p class="' + paraClass + '">' + el.innerHTML + "</p>";
      /* ย่อหน้าข้อความล้วน (ไม่มีตัวหนา/เอียง) ตัดข้ามหน้าได้ — ดู paginate */
      out.push(el.children.length ? html : { html: html, split: { cls: paraClass, text: el.textContent } });
    });
    if (!out.length && o.placeholder) {
      out.push('<p class="l3p-para l3p-empty">' + o.placeholder + "</p>");
    }
    return out;
  }

  /* บล็อกลงนาม: sig = { image, signedAt } จาก l3Signatures */
  function signBlock(sig, name, position, opts) {
    const o = opts || {};
    const img = sig && sig.image
      ? '<img class="l3p-sign-img" src="' + sig.image + '" alt="ลายมือชื่อ" />'
      : '<div class="l3p-sign-wait">' + (o.waitText || "รอลงนาม") + "</div>";
    const pos = (position || "").split("\n").map(txt).join("<br />");
    return (
      '<div class="l3p-sign"' + (o.style ? ' style="' + o.style + '"' : "") + ">" +
      (o.prefix || "") +
      img +
      (name ? "<div>(" + txt(name) + ")</div>" : "") +
      (pos ? "<div>" + pos + "</div>" : "") +
      (sig && sig.signedAt && o.showDate !== false
        ? '<div class="l3p-sign-date">' + txt(String(sig.signedAt).split(" ").slice(0, 3).join(" ")) + "</div>"
        : "") +
      "</div>"
    );
  }

  function decorFor(d) {
    return function (i, n, nextLead) {
      let html = "";
      if (d.secrecy) {
        html += '<div class="l3p-secret is-top">' + esc(d.secrecy) + "</div>";
        html += '<div class="l3p-secret is-bottom">' + esc(d.secrecy) + "</div>";
      }
      if (i > 0) html += '<div class="l3p-pageno">- ' + th(i + 1) + " -</div>";
      if (i < n - 1 && nextLead) html += '<div class="l3p-cont">' + esc(nextLead) + " ...</div>";
      if (i === 0 && d.slogan) html += '<div class="l3p-slogan">"' + esc(d.slogan) + '"</div>';
      return html;
    };
  }

  /* ---------------------------------------------------------------- T1 MEMO
     d = { urgency, secrecy, slogan, recv:{no,date,time}, division, phone, docNo, docDate,
           subject, to, sections:[{ heading, html }], closing,
           proposer:{ sig, name, position },
           opinions:[{ no, title, text, sig, name, position }],
           chair:{ to, text, forwarder, stamp, sig, name, position } } */
  function memo(d) {
    const blocks = [];
    const recv = d.recv && (d.recv.no || d.recv.date)
      ? '<div class="l3p-recv">' +
        '<div style="text-align:center">สำนักงาน ป.ป.ท.</div>' +
        line("เลขรับ", d.recv.no, { keyClass: "is-plain" }) +
        line("วันที่", d.recv.date, { keyClass: "is-plain" }) +
        line("เวลา", d.recv.time, { keyClass: "is-plain", after: "น." }) +
        "</div>"
      : "";
    blocks.push(
      '<div class="l3p-content">' + recv +
      '<div class="l3p-memo-head">' + garuda("sm") +
      (d.urgency ? '<span class="l3p-stamp l3p-stamp-urgent">' + esc(d.urgency) + "</span>" : "") +
      '<span class="l3p-memo-title">บันทึกข้อความ</span></div>' +
      line("ส่วนราชการ", [d.division, d.phone ? "โทร. " + d.phone : ""].filter(Boolean).join(" "), { keyClass: "is-lg" }) +
      '<div class="l3p-line"><span class="l3p-key is-lg">ที่</span>' + dot(d.docNo) +
      '<span class="l3p-key is-lg">วันที่</span>' + dot(d.docDate) + "</div>" +
      line("เรื่อง", d.subject, { keyClass: "is-lg" }) +
      "</div>",
    );
    blocks.push('<div class="l3p-gap"></div><p class="l3p-para no-indent">เรียน&nbsp;&nbsp;' + txt(d.to) + "</p>");

    (d.sections || []).forEach(function (s) {
      if (s.heading) blocks.push({ html: '<div class="l3p-heading"><u>' + th(esc(s.heading)) + "</u></div>", keep: true });
      editorBlocks(s.html, { placeholder: s.placeholder || "……" }).forEach(function (b) { blocks.push(b); });
    });
    if (d.closing) blocks.push('<p class="l3p-para" style="margin-top:6px">' + txt(d.closing) + "</p>");
    if (d.proposer) blocks.push(signBlock(d.proposer.sig, d.proposer.name, d.proposer.position, { showDate: false }));

    (d.opinions || []).forEach(function (op) {
      const text = op.text ? txt(op.text) : "";
      blocks.push({
        html:
          '<div class="l3p-opinion"><div class="l3p-opinion-title"><u>' + th(esc(op.no + ". " + op.title)) + "</u>" +
          '<span class="l3p-dot l3p-opinion-text">' + (text || "&nbsp;") + "</span></div>" +
          '<div class="l3p-opinion-text">&nbsp;</div></div>',
        keep: true,
      });
      blocks.push(signBlock(op.sig, op.name, op.position, { waitText: op.waitText }));
    });

    if (d.chair) {
      const c = d.chair;
      blocks.push(
        '<div style="margin-top:12px"><p class="l3p-para no-indent">เรียน&nbsp;&nbsp;' + txt(c.to) + "</p>" +
        '<p class="l3p-para">' + txt(c.text) + "</p></div>" +
        '<div class="l3p-chair"><div>' +
        (c.forwarder ? signBlock(c.forwarder.sig, c.forwarder.name, c.forwarder.position) : "") +
        "</div><div>" +
        (c.sig ? '<div class="l3p-chair-stamp">' + txt(c.stamp || "- เห็นชอบ\n- ลงนามแล้ว") + "</div>" : "") +
        signBlock(c.sig, c.name, c.position, { waitText: "รอประธานสั่งการ" }) +
        "</div></div>",
      );
    }

    return { blocks: blocks, decor: decorFor(d) };
  }

  /* -------------------------------------------------------------- T2 LETTER
     d = { isCopy, urgency, secrecy, docNo, address, docDate, subject, to, ref,
           enclosures:[text], html, closing, signer:{ sig, name, position },
           footer:[lines], ctrl:[{ key, value, date }] } */
  function letter(d) {
    const blocks = [];
    blocks.push(
      '<div class="l3p-letter-top">' +
      (d.isCopy ? '<div class="l3p-stamp l3p-stamp-copy">สำเนา</div>' : "") +
      (d.urgency ? '<span class="l3p-stamp l3p-stamp-urgent">' + esc(d.urgency) + "</span>" : "") +
      garuda("lg") + "</div>" +
      '<div class="l3p-letter-meta"><div class="l3p-line" style="flex:1"><span class="l3p-key is-plain">ที่</span>' +
      "<span>" + txt(d.docNo || "") + "</span></div>" +
      '<div class="l3p-letter-addr">' + txt(d.address) + "</div></div>" +
      '<div class="l3p-letter-date">' + txt(d.docDate) + "</div>",
    );
    const hang = function (key, valueHtml) {
      return '<div class="l3p-hang"><span class="l3p-key is-plain">' + key + "</span><div>" + valueHtml + "</div></div>";
    };
    blocks.push(hang("เรื่อง", txt(d.subject)));
    blocks.push(hang("เรียน", txt(d.to)));
    if (d.ref) blocks.push(hang("อ้างถึง", txt(d.ref)));
    const encl = (d.enclosures || []).filter(function (x) { return String(x).trim(); });
    if (encl.length) {
      blocks.push(
        hang(
          "สิ่งที่ส่งมาด้วย",
          encl.map(function (x, i) { return "<div>" + (encl.length > 1 ? th(i + 1) + ". " : "") + txt(x) + "</div>"; }).join(""),
        ),
      );
    }
    blocks.push('<div class="l3p-gap"></div>');
    editorBlocks(d.html, { placeholder: "……" }).forEach(function (b) { blocks.push(b); });
    if (d.closing) blocks.push('<p class="l3p-para" style="margin-top:6px">' + txt(d.closing) + "</p>");
    blocks.push(
      signBlock(d.signer && d.signer.sig, d.signer && d.signer.name, d.signer && d.signer.position, {
        prefix: '<div style="margin-bottom:2px">ขอแสดงความนับถือ</div>',
        showDate: false,
      }),
    );
    let foot = "";
    if (d.footer && d.footer.length) {
      foot += '<div class="l3p-letter-foot">' + d.footer.map(txt).join("<br />") + "</div>";
    }
    if (d.ctrl && d.ctrl.length) foot += ctrlBox(d.ctrl, true);
    if (foot) blocks.push('<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px">' + foot + "</div>");
    return { blocks: blocks, decor: decorFor(d) };
  }

  function ctrlBox(rows, withDateLabel) {
    return (
      '<div class="l3p-ctrlbox" style="position:static;flex-shrink:0">' +
      rows.map(function (r) {
        return '<div class="l3p-line"><span>' + esc(r.key) + "</span>" + dot(r.value) +
          (withDateLabel ? "<span>วันที่</span>" : "") + dot(r.date) + "</div>";
      }).join("") +
      "</div>"
    );
  }

  /* -------------------------------------------------------------- T3 ANSWER
     d = { isCopy, subtitle, formCode, respondentNo, blackNo, redNo, court,
           day, month, year, plaintiffs:[], defendants:[], me:{...}, submitType,
           html, signer:{ sig, name, position }, ctrl:[...] } */
  function answer(d) {
    const blocks = [];
    const me = d.me || {};
    const k = function (label) { return '<span class="l3p-key is-plain">' + label + "</span>"; };
    blocks.push(
      (d.isCopy ? '<div class="l3p-stamp l3p-stamp-copy" style="margin-top:-15mm">สำเนา</div>' : "") +
      (d.subtitle ? '<div class="l3p-answer-sub">' + esc(d.subtitle) + "</div>" : "") +
      '<div class="l3p-answer-top">' +
      '<div class="l3p-left"><span class="l3p-circle"></span><div style="padding-left:0.8cm">คำให้การของ</div><div style="padding-left:0.8cm">ผู้ถูกฟ้องคดีที่ ' + txt(d.respondentNo) + "</div></div>" +
      "<div>" + garuda("lg") + "</div>" +
      '<div class="l3p-right"><div>' + esc(d.formCode || "(ค.๓)") + '</div><div style="height:0.7cm"></div>' +
      '<div class="l3p-line"><span class="l3p-key">คดีหมายเลขดำที่</span>' + dot(d.blackNo) + "</div>" +
      '<div class="l3p-line"><span class="l3p-key">คดีหมายเลขแดงที่</span>' + dot(d.redNo) + "</div></div>" +
      "</div>" +
      '<div class="l3p-court">' + txt(d.court) + "</div>" +
      '<div class="l3p-line" style="margin-left:38%;margin-top:6px"><span class="l3p-key">วันที่</span>' + dot(d.day) +
      '<span class="l3p-key">เดือน</span>' + dot(d.month) + '<span class="l3p-key">พุทธศักราช</span>' + dot(d.year) + "</div>",
    );
    const party = function (list, role) {
      const names = (list || []).filter(Boolean);
      const text = names.length > 1 ? names[0] + " กับพวกรวม " + names.length + " คน" : names[0] || "";
      return '<div class="l3p-line">' + dot(text) + '<span class="l3p-key">' + role + "</span></div>";
    };
    blocks.push(
      '<div class="l3p-between"><span class="l3p-key">ระหว่าง</span><span class="l3p-brace"></span>' +
      '<div class="l3p-party">' + party(d.plaintiffs, "ผู้ฟ้องคดี") + party(d.defendants, "ผู้ถูกฟ้องคดี") + "</div></div>",
    );
    blocks.push(
      '<div class="l3p-gap"></div>' +
      '<div class="l3p-line" style="padding-left:var(--l3p-indent)">' + k("ข้าพเจ้า") + dot(me.name) + k(txt(me.role || "")) + "</div>" +
      '<div class="l3p-line">' + k("เกิดวันที่") + dot(me.birthDay) + k("เดือน") + dot(me.birthMonth) + k("พ.ศ.") + dot(me.birthYear) +
      k("อายุ") + dot(me.age) + k("ปี") + k("อาชีพ") + dot(me.occupation) + "</div>" +
      '<div class="l3p-line">' + k("อยู่ที่") + dot(me.address) + k("หมู่ที่") + dot(me.moo) + "</div>" +
      '<div class="l3p-line">' + k("ถนน") + dot(me.road) + k("ตรอก/ซอย") + dot(me.soi) + k("ตำบล/แขวง") + dot(me.subdistrict) + "</div>" +
      '<div class="l3p-line">' + k("อำเภอ/เขต") + dot(me.district) + k("จังหวัด") + dot(me.province) + k("รหัสไปรษณีย์") + dot(me.postcode) + "</div>" +
      '<div class="l3p-line">' + k("โทรศัพท์") + dot(me.phone) + k("ขอยื่น") + dot(d.submitType) + k("ได้ทราบคำฟ้องตลอดแล้ว") + "</div>" +
      "<div>ขอให้การตามที่จะกล่าวต่อไปนี้</div>",
    );
    blocks.push('<div class="l3p-gap"></div>');
    editorBlocks(d.html, { underline: true, placeholder: "……" }).forEach(function (b) { blocks.push(b); });
    blocks.push('<div class="l3p-center" style="margin-top:8px">ควรมิควรแล้วแต่จะโปรด</div>');
    blocks.push(
      signBlock(d.signer && d.signer.sig, d.signer && d.signer.name, d.signer && d.signer.position, {
        prefix: "<div>ลงชื่อ ................................................ ผู้ถูกฟ้องคดีที่ " + txt(d.respondentNo) + "</div>",
        showDate: false,
        style: "margin-left:30%",
      }),
    );
    if (d.ctrl && d.ctrl.length) {
      blocks.push('<div style="display:flex;justify-content:flex-end;margin-top:12px">' + ctrlBox(d.ctrl, false) + "</div>");
    }
    return {
      blocks: blocks,
      decor: function (i) {
        return i > 0 ? '<div class="l3p-pageno">- ' + th(i + 1) + " -</div>" : "";
      },
    };
  }

  /* -------------------------------------------------------------- PAGINATE */
  let measureEl = null;
  function measurer() {
    if (!measureEl) {
      measureEl = document.createElement("div");
      measureEl.className = "l3p-page l3p-measure";
      document.body.appendChild(measureEl);
    }
    return measureEl;
  }

  /* สระ/วรรณยุกต์ไทยที่ห้ามขึ้นต้นส่วนที่ตัด (จะแยกจากพยัญชนะ) */
  const TH_COMBINING = /[ัิ-ฺ็-๎]/;
  const MIN_SPLIT_PX = 60;

  function blockHeight(m, html) {
    m.innerHTML = '<div class="l3p-blk" style="display:flow-root">' + html + "</div>";
    return m.firstChild.offsetHeight;
  }

  function paraHTML(cls, text, cont) {
    return '<p class="' + cls + (cont ? " no-indent" : "") + '">' + esc(text) + "</p>";
  }

  /* ตัดย่อหน้าให้ส่วนแรกพอดีพื้นที่ที่เหลือ (binary search จำนวนตัวอักษร ถอยไปตัดที่ช่องว่างถ้าใกล้) */
  function splitPara(m, b, room) {
    const s = b.split;
    const text = s.text;
    let lo = 1;
    let hi = text.length - 1;
    let best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (blockHeight(m, paraHTML(s.cls, text.slice(0, mid), s.cont)) <= room) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best < 1) return null;
    const space = text.lastIndexOf(" ", best);
    let cut = space > best - 25 && space > 0 ? space + 1 : best;
    while (cut > 1 && TH_COMBINING.test(text.charAt(cut))) cut--;
    const head = text.slice(0, cut);
    const tail = text.slice(cut);
    if (!head.trim() || !tail.trim()) return null;
    return [
      { html: paraHTML(s.cls, head, s.cont) },
      { html: paraHTML(s.cls, tail, true), split: { cls: s.cls, text: tail, cont: true } },
    ];
  }

  function paginate(model) {
    const m = measurer();
    const queue = model.blocks.map(function (b) {
      return typeof b === "string" ? { html: b } : b;
    });
    const pages = [];
    let cur = [];
    let used = 0;
    let i = 0;
    while (i < queue.length) {
      const b = queue[i];
      const h = blockHeight(m, b.html);
      const nextH = b.keep && i + 1 < queue.length ? blockHeight(m, queue[i + 1].html) : 0;
      if (cur.length && used + h + nextH > CONTENT_HEIGHT_PX) {
        const room = CONTENT_HEIGHT_PX - used;
        const parts = b.split && room >= MIN_SPLIT_PX ? splitPara(m, b, room) : null;
        if (parts) {
          cur.push(parts[0].html);
          queue.splice(i, 1, parts[0], parts[1]);
          i++;
        }
        pages.push(cur);
        cur = [];
        used = 0;
        continue;
      }
      cur.push(b.html);
      used += h;
      i++;
    }
    if (cur.length) pages.push(cur);
    m.innerHTML = "";
    return pages;
  }

  /* คำขึ้นต้นหน้าถัดไป สำหรับ "ต่อหน้า" มุมขวาล่าง (เช่น "ทั้งนี้ ...") */
  function leadWords(html) {
    const box = document.createElement("div");
    box.innerHTML = html;
    const first = box.textContent.trim().split(/\s+/)[0] || "";
    return first.length > 14 ? first.slice(0, 14) : first;
  }

  /* ---------------------------------------------------------------- VIEWER
     host = คอลัมน์ขวาของ .l3-split--doc ; opts = { title, editTarget, fileName, zoom } */
  function createViewer(hostId, opts) {
    const host = document.getElementById(hostId);
    if (!host) return null;
    const o = opts || {};
    host.classList.add("l3-split-preview");
    host.innerHTML =
      '<div class="l3-doc-viewer">' +
      '<div class="l3-doc-toolbar">' +
      '<div class="l3-doc-toolbar-title"><i class="fa-solid fa-file-lines text-primary"></i><span>ตัวอย่างเอกสารสด — ' + esc(o.title) + "</span></div>" +
      '<div class="l3-doc-toolbar-actions">' +
      (o.editTarget ? '<button type="button" class="l3-doc-btn" data-act="edit"><i class="fa-solid fa-pen-to-square"></i>แก้ไขเอกสาร</button>' : "") +
      '<button type="button" class="l3-doc-btn" data-act="download"><i class="fa-solid fa-download"></i>ดาวน์โหลด</button>' +
      '<button type="button" class="l3-doc-btn l3-doc-btn-icon l3-split-toggle" data-act="collapse" title="ย่อ/ขยาย"><i class="fa-solid fa-chevron-down"></i></button>' +
      "</div></div>" +
      '<div class="l3-doc-controlbar">' +
      '<div class="l3-doc-viewmode"><button type="button" class="is-active" data-mode="single">ดูทีละหน้า</button><button type="button" data-mode="all">ดูทุกหน้าต่อเนื่อง</button></div>' +
      '<div class="l3-doc-pagenav">' +
      '<button type="button" data-nav="first" title="หน้าแรก"><i class="fa-solid fa-angles-left"></i></button>' +
      '<button type="button" data-nav="prev" title="ก่อนหน้า"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<span data-ref="cur">1</span> / <span data-ref="total">1</span> หน้า' +
      '<button type="button" data-nav="next" title="ถัดไป"><i class="fa-solid fa-chevron-right"></i></button>' +
      '<button type="button" data-nav="last" title="หน้าสุดท้าย"><i class="fa-solid fa-angles-right"></i></button>' +
      "</div>" +
      '<div class="l3-doc-zoom"><button type="button" data-zoom="-1" title="ย่อ"><i class="fa-solid fa-minus"></i></button>' +
      '<span class="l3-doc-zoom-val" data-ref="zoom">50%</span>' +
      '<button type="button" data-zoom="1" title="ขยาย"><i class="fa-solid fa-plus"></i></button></div>' +
      "</div>" +
      '<div class="l3-doc-pageframe l3-split-preview-body"><div class="l3p-stack is-single" data-ref="stack"></div></div>' +
      "</div>";

    const q = function (sel) { return host.querySelector(sel); };
    const state = { page: 0, mode: "single", zoom: o.zoom || DEFAULT_ZOOM, pagesHTML: [] };
    const stack = q('[data-ref="stack"]');
    const frame = q(".l3-doc-pageframe");

    function applyZoom() {
      stack.style.zoom = String(state.zoom);
      q('[data-ref="zoom"]').textContent = Math.round(state.zoom * 100) + "%";
    }

    function showPage(scroll) {
      const pages = stack.querySelectorAll(".l3p-page");
      state.page = Math.max(0, Math.min(state.page, pages.length - 1));
      pages.forEach(function (p, i) { p.classList.toggle("is-current", i === state.page); });
      q('[data-ref="cur"]').textContent = String(state.page + 1);
      q('[data-ref="total"]').textContent = String(pages.length);
      const atFirst = state.page === 0;
      const atLast = state.page >= pages.length - 1;
      q('[data-nav="first"]').disabled = atFirst;
      q('[data-nav="prev"]').disabled = atFirst;
      q('[data-nav="next"]').disabled = atLast;
      q('[data-nav="last"]').disabled = atLast;
      if (scroll && state.mode === "all" && pages[state.page]) {
        frame.scrollTop = pages[state.page].offsetTop * state.zoom;
      }
    }

    function render(model) {
      const pages = paginate(model);
      state.pagesHTML = pages.map(function (blocksHtml, i) {
        const nextLead = i + 1 < pages.length ? leadWords(pages[i + 1][0]) : "";
        return (
          '<div class="l3p-page">' +
          (model.decor ? model.decor(i, pages.length, nextLead) : "") +
          '<div class="l3p-content">' + blocksHtml.join("") + "</div></div>"
        );
      });
      stack.innerHTML = state.pagesHTML.join("");
      showPage(false);
    }

    host.addEventListener("click", function (e) {
      const btn = e.target.closest("button");
      if (!btn || !host.contains(btn)) return;
      if (btn.dataset.mode) {
        state.mode = btn.dataset.mode;
        host.querySelectorAll("[data-mode]").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        stack.classList.toggle("is-single", state.mode === "single");
        showPage(true);
      } else if (btn.dataset.nav) {
        const total = stack.querySelectorAll(".l3p-page").length;
        state.page = { first: 0, prev: state.page - 1, next: state.page + 1, last: total - 1 }[btn.dataset.nav];
        showPage(true);
      } else if (btn.dataset.zoom) {
        state.zoom = Math.min(1.5, Math.max(0.3, Math.round((state.zoom + Number(btn.dataset.zoom) * 0.1) * 10) / 10));
        applyZoom();
      } else if (btn.dataset.act === "edit") {
        if (global.ECMIS103 && ECMIS103.focusFirstField) ECMIS103.focusFirstField(o.editTarget);
      } else if (btn.dataset.act === "download") {
        exportDocx(state.pagesHTML, o.fileName || o.title);
      } else if (btn.dataset.act === "collapse") {
        const collapsed = host.classList.toggle("is-collapsed");
        const icon = btn.querySelector("i");
        icon.classList.toggle("fa-chevron-down", !collapsed);
        icon.classList.toggle("fa-chevron-up", collapsed);
      }
    });

    applyZoom();
    return { render: render, host: host };
  }

  /* --------------------------------------------------------------- EXPORT
     ใช้ html-docx-js แบบเดียวกับ ECMIS102.exportDocx (โหลด UMD จาก unpkg)
     ฝัง CSS ของกระดาษ + รูปครุฑเป็น data URI เพื่อให้ไฟล์ Word ใกล้เคียงพรีวิว */
  let docxScriptPromise = null;
  function loadDocxLib() {
    if (global.htmlDocx) return Promise.resolve(global.htmlDocx);
    if (!docxScriptPromise) {
      docxScriptPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js";
        script.onload = function () { resolve(global.htmlDocx); };
        script.onerror = function () { reject(new Error("โหลดไลบรารี html-docx-js ไม่สำเร็จ")); };
        document.head.appendChild(script);
      });
    }
    return docxScriptPromise;
  }

  let garudaDataUrlPromise = null;
  function garudaDataUrl() {
    if (!garudaDataUrlPromise) {
      garudaDataUrlPromise = fetch(GARUDA_SRC)
        .then(function (r) { return r.blob(); })
        .then(function (blob) {
          return new Promise(function (resolve) {
            const fr = new FileReader();
            fr.onload = function () { resolve(fr.result); };
            fr.onerror = function () { resolve(GARUDA_SRC); };
            fr.readAsDataURL(blob);
          });
        })
        .catch(function () { return GARUDA_SRC; });
    }
    return garudaDataUrlPromise;
  }

  const EXPORT_CSS =
    "body{font-family:'TH Sarabun New','Sarabun',sans-serif;font-size:16pt;line-height:1.3;color:#111}" +
    ".l3p-stamp-urgent{color:#d61f26;font-weight:bold;font-size:26pt}" +
    ".l3p-stamp-copy,.l3p-answer-sub{color:#2f5bd3;font-weight:bold;text-align:center}" +
    ".l3p-stamp-copy{font-size:28pt}.l3p-secret{color:#d61f26;font-weight:bold;font-size:24pt;text-align:center}" +
    ".l3p-memo-title{font-weight:bold;font-size:29pt}.l3p-key{font-weight:bold}.l3p-key.is-plain{font-weight:normal}" +
    ".l3p-dot{border-bottom:1px dotted #666}.l3p-para{text-indent:2.5cm;text-align:justify;margin:0}" +
    ".l3p-para.no-indent{text-indent:0}.l3p-heading{padding-left:2.5cm;font-weight:bold}" +
    ".l3p-sign{margin-left:45%;text-align:center}.l3p-center,.l3p-court,.l3p-pageno{text-align:center}" +
    ".l3p-letter-date{margin-left:45%}.l3p-uline{text-decoration:underline}" +
    ".l3p-ctrlbox,.l3p-recv{border:1px solid #2f5bd3;color:#2f5bd3;font-size:12pt}" +
    ".l3p-sign-wait,.l3p-cont{display:none}" +
    ".l3p-garuda.is-sm{width:1.5cm;height:1.5cm}.l3p-garuda.is-lg{width:3cm;height:3cm;display:block;margin:0 auto}";

  function exportDocx(pagesHTML, fileName) {
    if (!pagesHTML || !pagesHTML.length) return;
    if (global.Swal) {
      Swal.fire({ title: "กำลังสร้างไฟล์ DOCX...", allowOutsideClick: false, didOpen: function () { Swal.showLoading(); } });
    }
    Promise.all([loadDocxLib(), garudaDataUrl()])
      .then(function (res) {
        const lib = res[0];
        if (!lib || typeof lib.asBlob !== "function") throw new Error("html-docx-js ไม่พร้อมใช้งาน");
        const body = pagesHTML
          .map(function (p, i) {
            return (i ? '<br style="page-break-before:always" clear="all" />' : "") + p;
          })
          .join("")
          .split('src="' + GARUDA_SRC + '"').join('src="' + res[1] + '"');
        const html =
          "<!DOCTYPE html><html><head><meta charset='utf-8'><style>" + EXPORT_CSS + "</style></head><body>" + body + "</body></html>";
        const blob = lib.asBlob(html, { margins: { top: 1417, bottom: 1134, left: 1701, right: 1134 } });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (fileName || "เอกสาร") + ".docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (global.Swal) Swal.close();
      })
      .catch(function (err) {
        console.error("ECMIS103Docs.exportDocx error:", err);
        if (global.Swal) {
          Swal.fire({ icon: "error", title: "ส่งออก DOCX ไม่สำเร็จ", text: "กรุณาลองใหม่อีกครั้ง", confirmButtonColor: "#1e3a8a" });
        }
      });
  }

  /* ----------------------------------------------------------------- DRAFT
     เก็บร่างลงเคส: kase.l3DocDraft[stepCode] = { fields, editors, extra, savedAt, savedBy }
     ไม่เปลี่ยนสถานะ ไม่ออกเลข ไม่ลงนาม */
  function readDraft(kase, stepCode) {
    return (kase && kase.l3DocDraft && kase.l3DocDraft[stepCode]) || null;
  }

  function nowThai() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, "0"); };
    return d.getDate() + " " + TH_MONTHS_SHORT[d.getMonth()] + " " + (d.getFullYear() + 543) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + " น.";
  }

  function saveDraft(caseId, stepCode, payload) {
    const kase = global.Activity10 && Activity10.getCaseById(caseId);
    if (!kase) return null;
    let by = "";
    try {
      const role = global.ECMIS103 && ECMIS103.currentRole ? ECMIS103.currentRole() : null;
      by = role ? role.name : "";
    } catch (e) {
      by = "";
    }
    const drafts = Object.assign({}, kase.l3DocDraft || {});
    drafts[stepCode] = Object.assign({}, payload, { savedAt: nowThai(), savedBy: by });
    Activity10.updateCase(caseId, { l3DocDraft: drafts });
    return drafts[stepCode];
  }

  function clearDraft(caseId, stepCode) {
    const kase = global.Activity10 && Activity10.getCaseById(caseId);
    if (!kase || !kase.l3DocDraft || !kase.l3DocDraft[stepCode]) return;
    const drafts = Object.assign({}, kase.l3DocDraft);
    delete drafts[stepCode];
    Activity10.updateCase(caseId, { l3DocDraft: drafts });
  }

  /* เก็บ/คืนค่าช่องกรอกตามรายการ id */
  function collectFields(ids) {
    const out = {};
    ids.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) out[id] = el.value;
    });
    return out;
  }

  function applyFields(values) {
    Object.keys(values || {}).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = values[id];
    });
  }

  /* เตือนก่อนออกจากหน้าเมื่อยังมีการแก้ไขที่ไม่ได้บันทึก */
  function trackDirty() {
    const state = { dirty: false };
    window.addEventListener("beforeunload", function (e) {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
    return {
      mark: function () { state.dirty = true; },
      clear: function () { state.dirty = false; },
      isDirty: function () { return state.dirty; },
    };
  }

  /* ------------------------------------------------------- THAI DATE PARTS */
  const TH_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  function dateParts(iso) {
    if (!iso) return null;
    const p = String(iso).split("-").map(Number);
    if (p.length !== 3 || !p[0]) return null;
    return { day: p[2], month: TH_MONTHS[p[1] - 1], monthShort: TH_MONTHS_SHORT[p[1] - 1], year: p[0] + 543 };
  }

  function thaiLongDate(iso) {
    const d = dateParts(iso);
    return d ? th(d.day + " " + d.month + " " + d.year) : "";
  }

  global.ECMIS103Docs = {
    th: th,
    esc: esc,
    thHTML: thHTML,
    memo: memo,
    letter: letter,
    answer: answer,
    createViewer: createViewer,
    exportDocx: exportDocx,
    readDraft: readDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    collectFields: collectFields,
    applyFields: applyFields,
    trackDirty: trackDirty,
    dateParts: dateParts,
    thaiLongDate: thaiLongDate,
  };
})(window);
