/* ECMIS 10.3 — ส่วน "ข้อมูลขั้นตอนก่อนหน้า" แบบพับ ใช้ร่วมหลายหน้า (2026-10-22)
   ECMIS103Prev.render(hostId, caseObj, ["review", "dispatch", "resolution"])
     review     ผลตรวจคำฟ้องและบันทึกเสนอบอร์ด (10-3-04 → 10-3-08) + พรีวิวบันทึกเสนอบอร์ด
     dispatch   ออกเลขส่งและเสนอบอร์ด (10-3-09)
     resolution มติคณะกรรมการ ป.ป.ท. และหนังสือแจ้งมติ (ป๊อปอัป B3)
   การ์ดใส่ data-prev-step — ecmis-shell พับให้อัตโนมัติ (MutationObserver) */
(function (global) {
  "use strict";

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function clean(v) {
    const t = String(v == null ? "" : v).trim();
    return t && t !== "-" ? t : "";
  }

  function box(label, value, extraClass) {
    return '<div class="form-group"><label>' + esc(label) + '</label><div class="read-box' + (extraClass ? " " + extraClass : "") + '">' +
      (clean(value) ? esc(value) : "-") + "</div></div>";
  }

  function slot(label, id) {
    return '<div class="form-group"><label>' + esc(label) + '</label><div id="' + id + '"></div></div>';
  }

  function card(title, body) {
    return '<div class="form-card" data-prev-step="' + esc(title) + '" data-prev-step-hide-head><div class="form-card-body">' + body + "</div></div>";
  }

  function thaiDate(iso) {
    return iso && global.ECMIS103 ? ECMIS103.formatThaiDate(iso) : iso || "";
  }

  const SECTIONS = {
    review: function (c) {
      return card(
        "ผลตรวจคำฟ้องและบันทึกเสนอบอร์ด (10-3-04 → 10-3-08)",
        box("บันทึกสรุปความเห็น (นิติกร)", c.l3OpinionText, "read-box-textarea") +
          '<div class="form-grid-2">' +
          box("ความเห็นเพิ่มเติมของ ผอ.กลุ่มงานคดี", c.l3GroupApproveNotes, "read-box-textarea") +
          box("ความเห็นเพิ่มเติมของ ผอ.กองกฎหมาย", c.l3DirectorSignNotes, "read-box-textarea") +
          "</div>" +
          slot("บันทึกเสนอบอร์ดฉบับลงนามจริง", "pv_boardMemoSigned") +
          (c.l3BoardMemo ? '<div class="l3-split--doc"><div id="pv_boardMemo"></div></div>' : ""),
      );
    },
    dispatch: function (c) {
      const propose = c.l3ProposeTo ? (c.l3ProposeToLabel || "") + " — " + ECMIS103.signerLabel(c.l3ProposeTo) : "";
      return card(
        "ออกเลขส่งและเสนอบอร์ด (10-3-09)",
        '<div class="form-grid-2">' +
          box("เลขที่หนังสือส่งภายใน", c.l3InternalDocNo, "font-monospace") +
          box("วันที่ออกเลขส่ง", c.l3InternalDocDate) +
          box("เสนอต่อ", propose) +
          box("หมายเหตุ", c.l3DispatchNotes) +
          "</div>",
      );
    },
    resolution: function (c) {
      const r = c.l3BoardResolution || {};
      const n = c.l3ResolutionNotice || {};
      const ref = r.meetingNo ? "ครั้งที่ " + r.meetingNo + " วันที่ " + thaiDate(r.meetingDate) + " วาระที่ " + (r.agendaNo || "-") : "";
      const notice = n.docNo ? "เลขที่ " + n.docNo + (n.docDate ? " ลงวันที่ " + thaiDate(n.docDate) : "") : "";
      return card(
        "มติคณะกรรมการ ป.ป.ท. และหนังสือแจ้งมติ",
        '<div class="form-grid-2">' + box("ผลมติ", r.result) + box("การประชุม", ref) + "</div>" +
          box("สาระสำคัญของมติ", r.text, "read-box-textarea") +
          '<div class="form-grid-2">' + box("หนังสือแจ้งมติ", notice) + slot("ไฟล์มติ", "pv_resolutionFiles") + "</div>",
      );
    },
  };

  /* ---- สายคัดค้านคำขอทุเลา (เคสลูก -B) 2026-10-22 ---- */
  function reviewLine(r) {
    if (!r) return "";
    return (r.decision === "RETURN" ? "ส่งกลับ" : "เห็นชอบ") + " — " + (clean(r.notes) || "-") +
      "\n" + (r.reviewedBy || "-") + " เมื่อ " + (r.reviewedAt || "-");
  }

  Object.assign(SECTIONS, {
    /* ใช้กับเคสแม่ — สถานะคดีหลัก ณ ปัจจุบัน + ข้อมูลที่นิติกรกรอกที่ 10-3-04 */
    stayParent: function (p) {
      return card(
        "คดีหลักและผลตรวจคำฟ้องของนิติกร (10-3-04)",
        '<div class="form-grid-2">' +
          box("คดีหลัก", p.id, "font-monospace") +
          box("สถานะคดีหลักปัจจุบัน", p.status) +
          box("นิติกรเจ้าของสำนวน", p.officer) +
          box("สำนวนคดีที่เกี่ยวข้อง", p.l3RelatedCaseNo) +
          "</div>" +
          box("ผลการตรวจสอบคำฟ้อง (นิติกร)", p.l3ReviewNotes, "read-box-textarea") +
          '<div class="form-grid-2">' + slot("เอกสารประกอบความเห็น", "pv_opinionFiles") + slot("หมายศาลแจ้งให้ทำคำคัดค้านคำขอทุเลา", "pv_staySummons") + "</div>",
      );
    },
    stayDraft: function (c) {
      return card(
        "ร่างคำชี้แจงคัดค้านที่นิติกรเสนอ (10-3b-01)",
        '<div class="form-grid-2">' +
          box("ร่างครั้งที่", c.l3StayObjectionVersion || 1) +
          box("นิติกรผู้เสนอ", c.officer) +
          slot("บันทึกข้อความเสนอร่างคำชี้แจง", "pv_stayMemo") +
          slot("เอกสารประกอบ", "pv_staySupporting") +
          "</div>",
      );
    },
    stayReviews: function (c) {
      return card(
        "ผลการตรวจร่างตามลำดับชั้น (10-3b-01a / 10-3b-01b)",
        '<div class="form-grid-2">' +
          box("ผอ.กลุ่มงานคดี", reviewLine(c.l3StayGroupReview), "read-box-textarea") +
          box("ผอ.กองกฎหมาย", reviewLine(c.l3StayDirectorReview), "read-box-textarea") +
          "</div>",
      );
    },
    staySigned: function () {
      return card("คำชี้แจงคัดค้าน — ฉบับลงนามจริง (ประธานกรรมการ ป.ป.ท.)", '<div id="pv_staySigned"></div>');
    },
    stayDispatch: function (c) {
      const hand = c.l3StayDispatchMethod === "hand";
      return card(
        "ส่งคำชี้แจงคัดค้านต่อศาลปกครอง (10-3b-03)",
        '<div class="form-grid-2">' +
          box("วิธีการจัดส่ง", hand ? "ส่งด้วยตนเอง" : c.l3StayDispatchMethod === "post" ? "ไปรษณีย์" : "") +
          (hand
            ? box("วันที่ / สถานที่นำส่ง", thaiDate(c.l3StayHandDeliveryDate) + " — " + (c.l3StayHandDeliveryLocation || "-"))
            : box("วันที่ส่ง / เลขพัสดุ EMS", thaiDate(c.l3StayDispatchDate) + " — " + (c.l3StayDispatchEmsTracking || "-"))) +
          slot("สำเนาหนังสือนำส่งศาล", "pv_stayDocCopies") +
          box("บันทึกปิดสำนวน", c.l3StayCloseNotes, "read-box-textarea") +
          "</div>",
      );
    },
  });

  function stayFiles(id, list) {
    if (document.getElementById(id)) ECMIS103.renderAttachments(id, (list || []).filter(Boolean));
  }

  function fillParent(p) {
    stayFiles("pv_opinionFiles", p.l3OpinionAttachments);
    stayFiles("pv_staySummons", p.stayObjectionFileNames);
  }

  function fillStay(c) {
    const files = stayFiles;
    files("pv_stayMemo", c.l3StayObjectionMemoAttachments);
    files("pv_staySupporting", c.l3StayObjectionSupportingAttachments);
    files("pv_stayDocCopies", c.l3StayDispatchDocCopies);
    const signed = document.getElementById("pv_staySigned");
    if (signed && global.ECMISWetSign && c.l3WetSign && c.l3WetSign.stayObjection) {
      ECMISWetSign.renderSignedView("pv_staySigned", c, "stayObjection", "คำชี้แจงคัดค้านคำขอทุเลาการบังคับ");
    } else if (signed && c.l3StayObjectionSignedAttachments) {
      files("pv_staySigned", c.l3StayObjectionSignedAttachments);
    }
  }

  /* เคสลูก (-B) → เคสแม่ (ค้นแบบตรงตัว — getCaseById คืน cases[0] เมื่อไม่พบ) */
  function parentOf(child) {
    if (!child || !child.l3ParentCaseId || !global.Activity10) return null;
    return global.Activity10.getCases().find(function (k) { return k.id === child.l3ParentCaseId; }) || null;
  }

  /* หน้าสาย 10-3b: ข้อมูลคดีหลัก (เคสแม่) ตามด้วยขั้นก่อนหน้าของเคสลูกเอง */
  function renderStay(hostId, child, childKeys) {
    const host = document.getElementById(hostId);
    if (!host || !child) return;
    const parent = parentOf(child);
    host.innerHTML =
      (parent ? SECTIONS.stayParent(parent) + SECTIONS.review(parent) : "") +
      (childKeys || []).filter(function (k) { return SECTIONS[k]; }).map(function (k) { return SECTIONS[k](child); }).join("");
    if (!global.ECMIS103) return;
    if (parent) {
      fillParent(parent);
      if (document.getElementById("pv_boardMemoSigned")) {
        ECMIS103.renderAttachments("pv_boardMemoSigned", parent.l3BoardMemoSignedFile ? [parent.l3BoardMemoSignedFile] : []);
      }
      if (document.getElementById("pv_boardMemo") && global.ECMIS103Docs) {
        const sigs = parent.l3Signatures || {};
        ECMIS103Docs.createViewer("pv_boardMemo", {
          title: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ",
          fileName: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ " + (parent.blackCaseNo || ""),
        }).render(ECMIS103Docs.boardMemoFromCase(parent, { groupSig: sigs.LAW0093, directorSig: sigs.LAW0094 }));
      }
    }
    fillStay(child);
  }

  function render(hostId, caseObj, keys) {
    const host = document.getElementById(hostId);
    if (!host || !caseObj) return;
    host.innerHTML = keys.filter(function (k) { return SECTIONS[k]; }).map(function (k) { return SECTIONS[k](caseObj); }).join("");
    if (global.ECMIS103) {
      if (document.getElementById("pv_boardMemoSigned")) {
        ECMIS103.renderAttachments("pv_boardMemoSigned", caseObj.l3BoardMemoSignedFile ? [caseObj.l3BoardMemoSignedFile] : []);
      }
      if (document.getElementById("pv_resolutionFiles")) {
        ECMIS103.renderAttachments("pv_resolutionFiles", ((caseObj.l3BoardResolution || {}).reportFileNames) || []);
      }
    }
    if (document.getElementById("pv_boardMemo") && global.ECMIS103Docs) {
      const sigs = caseObj.l3Signatures || {};
      ECMIS103Docs.createViewer("pv_boardMemo", {
        title: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ",
        fileName: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ " + (caseObj.blackCaseNo || ""),
      }).render(ECMIS103Docs.boardMemoFromCase(caseObj, { groupSig: sigs.LAW0093, directorSig: sigs.LAW0094 }));
    }
  }

  global.ECMIS103Prev = { render: render, renderStay: renderStay };
})(window);
