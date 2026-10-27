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
        "ผลตรวจคำฟ้องและบันทึกเสนอบอร์ด",
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
        "ออกเลขส่งและเสนอบอร์ด",
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
        "คดีหลักและผลตรวจคำฟ้องของนิติกร",
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
        "ร่างคำชี้แจงคัดค้านที่นิติกรเสนอ",
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
        "ผลการตรวจร่างตามลำดับชั้น",
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
        "ส่งคำชี้แจงคัดค้านต่อศาลปกครอง",
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

  /* ---- ขั้นตอนคดีรับคำฟ้องเดิม (ก่อนคำพิพากษา) สำหรับหน้า 10-3v 2026-10-22 ---- */
  function answerReviewLine(r) {
    if (!r) return "";
    return (r.decisionAnswer === "RETURN" ? "ส่งกลับ" : "เห็นชอบ") + " — " + (clean(r.notes) || "-") +
      "\n" + (r.reviewedBy || "-") + " เมื่อ " + (r.reviewedAt || "-");
  }
  const EXT_RESULT = { PENDING: "รอผลคำสั่งศาล", GRANTED: "ศาลอนุญาต", DENIED: "ศาลไม่อนุญาต" };
  const ADD_STATUS = { RECEIVED: "รับเรื่องแล้ว", DRAFTING: "กำลังจัดทำ", SENT: "ส่งอัยการแล้ว" };

  Object.assign(SECTIONS, {
    oIntake: function (p) {
      return card(
        "คดีเดิม · รับคำฟ้อง (ธุรการ)",
        '<div class="form-grid-2">' +
          box("คดีรับคำฟ้องเดิม", p.id, "font-monospace") +
          box("เลขรับกองกฎหมาย", p.lawReceiveNo, "font-monospace") +
          box("ชื่อหมาย", p.summonsName) +
          box("วันที่รับคำฟ้อง", thaiDate(p.courtReceivedDate)) +
          box("ศาลให้ทำภายใน (วัน)", p.courtDeadlineDays) +
          box("เลขสำนวน ป.ป.ท.", p.paccCaseNo) +
          "</div>" +
          box("มูลเหตุแห่งการฟ้องคดี", p.causeOfSuit, "read-box-textarea") +
          '<div class="form-grid-2">' + slot("เอกสารคำฟ้อง / หมายศาล", "pvo_attach") + slot("หมายศาลคำขอทุเลา", "pvo_staySummons") + "</div>",
      );
    },
    oAnswer: function (p) {
      const ext = (p.l3ExtensionRequests || []).map(function (r, i) {
        return "ครั้งที่ " + (i + 1) + ": ยื่น " + thaiDate(r.filedDate) + " ขอ " + (r.requestedDays || "-") + " วัน — " +
          (EXT_RESULT[r.result] || r.result || "-") + (r.grantedDays ? " (อนุญาต " + r.grantedDays + " วัน)" : "");
      }).join("\n");
      return card(
        "คดีเดิม · ขอขยายเวลาและร่างคำให้การ",
        '<div class="form-grid-2">' +
          box("ครบกำหนดยื่นคำให้การ (เดิม)", thaiDate(p.l3AnswerOriginalDueDate)) +
          box("ครบกำหนดยื่นคำให้การ (ล่าสุด)", thaiDate(p.l3AnswerDueDate || p.dueDate)) +
          "</div>" +
          box("คำขอขยายเวลา", ext, "read-box-textarea") +
          '<div class="form-grid-2">' + slot("คำให้การ (ฉบับลงนามจริง)", "pvo_answer") + slot("บันทึกเสนอ / หนังสือนำส่ง (ฉบับลงนามจริง)", "pvo_letters") + "</div>" +
          '<div class="form-grid-2">' + slot("พยานหลักฐาน", "pvo_evidence") + slot("ไฟล์เพิ่มเติม", "pvo_extra") + "</div>",
      );
    },
    oAnswerReview: function (p) {
      return card(
        "คดีเดิม · ตรวจร่างคำให้การ",
        '<div class="form-grid-2">' +
          box("ผอ.กลุ่มงานคดี", answerReviewLine(p.l3AnswerGroupReview), "read-box-textarea") +
          box("ผอ.กองกฎหมาย", answerReviewLine(p.l3AnswerDirectorReview), "read-box-textarea") +
          "</div>",
      );
    },
    oAnswerNo: function (p) {
      return card(
        "คดีเดิม · ออกเลขหนังสือคำให้การ (ธุรการ)",
        '<div class="form-grid-2">' +
          box("เลขหนังสือส่งภายใน", [p.l3AnswerInternalDocNo, thaiDate(p.l3AnswerInternalDocDate)].filter(clean).join(" ลงวันที่ "), "font-monospace") +
          box("เลขหนังสือส่งออก (ถึงอัยการ)", [p.l3AnswerExternalDocNo, thaiDate(p.l3AnswerExternalDocDate)].filter(clean).join(" ลงวันที่ "), "font-monospace") +
          box("ผู้ลงนามหนังสือนำส่ง", p.l3CoverLetterSignerName) +
          box("หมายเหตุ", p.l3AnswerDispatchNotes) +
          "</div>",
      );
    },
    oSend: function (p) {
      const s = p.l3AnswerShipping || {};
      const nos = (s.evidenceNos || []).filter(Boolean).join(", ");
      return card(
        "คดีเดิม · ส่งเอกสารถึงอัยการ (นิติกร)",
        '<div class="form-grid-2">' +
          box("วิธีส่ง / เลข EMS", [String(s.method || "").toUpperCase(), nos].filter(clean).join(" ")) +
          box("บันทึกหลักฐานเมื่อ", thaiDate(s.savedAt)) +
          box("ปิดขั้นตอนส่งคำให้การเมื่อ", (p.l3AnswerSentSet || {}).confirmedAt) +
          slot("ชุดเอกสารที่ส่ง (สแกน)", "pvo_setScans") +
          "</div>",
      );
    },
    oAdditional: function (p) {
      const items = p.l3AdditionalItems || [];
      const rows = items.map(function (i) {
        return (i.orderNo || "-") + " · ครบกำหนด " + (thaiDate(i.dueDate) || "-") + " · " + (ADD_STATUS[i.status] || i.status || "-") +
          (i.memoDocNo ? " · บันทึก " + i.memoDocNo : "") + (i.letterDocNo ? " · หนังสือ " + i.letterDocNo : "");
      }).join("\n");
      return card("คดีเดิม · รับเรื่องเพิ่มเติม (" + items.length + " เรื่อง)", box("รายการ", rows, "read-box-textarea"));
    },
    oStay: function (p) {
      const childId = String(p.id).replace(/\/(\d{4})$/, "-B/$1");
      const k = global.Activity10 ? global.Activity10.getCases().find(function (x) { return x.id === childId; }) : null;
      if (!k) return "";
      return card(
        "คดีเดิม · คำชี้แจงคัดค้านคำขอทุเลา (เคสลูก -B)",
        '<div class="form-grid-2">' +
          box("เคสลูก", k.id, "font-monospace") +
          box("สถานะ", k.status) +
          box("ส่งต่อศาล", k.l3StayDispatchMethod ? (k.l3StayDispatchMethod === "hand" ? "ส่งด้วยตนเอง " + thaiDate(k.l3StayHandDeliveryDate) : "ไปรษณีย์ " + thaiDate(k.l3StayDispatchDate)) : "") +
          box("คำสั่งศาลเรื่องทุเลา", k.statusCode === "L3B2_APPEAL_FILED" ? "ศาลให้ทุเลา — ทำคำอุทธรณ์แล้ว" : k.statusCode === "L3B2_CLOSED" ? "ศาลยกคำขอ" : "") +
          "</div>",
      );
    },
  });

  /* ทุกขั้นของคดีรับคำฟ้องเดิมเรียงตามลำดับ — ข้ามขั้นที่ยังไม่มีข้อมูล (รับเรื่องเพิ่มเติม / ทุเลา) */
  function renderOrigin(hostId, p) {
    const host = document.getElementById(hostId);
    if (!host) return;
    if (!p) {
      host.innerHTML = "";
      return;
    }
    const keys = ["oIntake", "review", "dispatch", "resolution", "oAnswer", "oAnswerReview", "oAnswerNo", "oSend"];
    if ((p.l3AdditionalItems || []).length) keys.push("oAdditional");
    keys.push("oStay");
    host.innerHTML =
      '<div class="l3-note l3-note-info" style="margin-bottom:12px"><i class="fa-solid fa-clock-rotate-left"></i><div>' +
      "<strong>ขั้นตอนของคดีรับคำฟ้องเดิม (ก่อนคำพิพากษา)</strong> — " + esc(p.id) + " · กางแต่ละหัวข้อเพื่อดู (อ่านอย่างเดียว)</div></div>" +
      keys.map(function (k) { return SECTIONS[k](p); }).join("");
    /* หัวข้อที่ใช้ร่วมกับหน้า 10-3 (ผลตรวจ / ออกเลข / มติ) — เติม "คดีเดิม ·" ให้เหมือนหัวข้ออื่น (ก่อนกล่องพับห่อ) */
    host.querySelectorAll("[data-prev-step]").forEach(function (el) {
      const t = el.getAttribute("data-prev-step");
      if (t.indexOf("คดีเดิม") !== 0) el.setAttribute("data-prev-step", "คดีเดิม · " + t);
    });
    if (!global.ECMIS103) return;
    const files = function (id, list) {
      if (document.getElementById(id)) ECMIS103.renderAttachments(id, (list || []).filter(Boolean));
    };
    const d = p.l3AnswerDocs || {};
    files("pvo_attach", p.attachmentFileNames);
    files("pvo_staySummons", p.stayObjectionFileNames);
    files("pvo_answer", d.answerFileNames);
    files("pvo_letters", d.letterFileNames);
    files("pvo_evidence", d.evidenceNames);
    files("pvo_extra", d.extraNames);
    files("pvo_setScans", (p.l3AnswerSentSet || {}).scanFileNames);
    files("pv_boardMemoSigned", p.l3BoardMemoSignedFile ? [p.l3BoardMemoSignedFile] : []);
    files("pv_resolutionFiles", (p.l3BoardResolution || {}).reportFileNames);
    const memo = document.getElementById("pv_boardMemo");
    if (memo && global.ECMIS103Docs) {
      const sigs = p.l3Signatures || {};
      ECMIS103Docs.createViewer("pv_boardMemo", { title: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ", fileName: "บันทึกเสนอเข้าบอร์ดเพื่อมีมติ " + (p.blackCaseNo || "") })
        .render(ECMIS103Docs.boardMemoFromCase(p, { groupSig: sigs.LAW0093, directorSig: sigs.LAW0094 }));
    } else if (memo) {
      memo.parentNode.remove();
    }
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

  global.ECMIS103Prev = { render: render, renderStay: renderStay, renderOrigin: renderOrigin, mountOriginGroup: mountOriginGroup };

  /* หน้า 10-3v (สายคำพิพากษา) — วางขั้นตอนคดีรับคำฟ้องเดิมต่อจากการ์ดแรกของหน้าอัตโนมัติ
     เคสคำพิพากษาผูกคดีเดิมที่ l3OriginCaseId · 10-3v-00 (ยังไม่มีเคส) เรียก renderOrigin เองตอนเลือกคดีเดิม */
  /* กลุ่มพับเดียวบนสุดของ #pageBody ห่อทุกขั้นของคดีเดิม (พับไว้ก่อน) — p = null เอากลุ่มออก */
  const GROUP_ID = "originStepsGroup";
  function mountOriginGroup(p) {
    const old = document.getElementById(GROUP_ID);
    if (old) (old.closest("details.prev-step") || old).remove();
    const body = document.getElementById("pageBody");
    if (!p || !body) return;
    const group = document.createElement("div");
    group.className = "form-card";
    group.id = GROUP_ID;
    group.setAttribute("data-prev-step", "ขั้นตอนคดีรับคำฟ้องเดิม (ก่อนคำพิพากษา) · " + p.id);
    group.setAttribute("data-prev-step-hide-head", "");
    group.setAttribute("data-prev-step-hint", "กางเพื่อดูทุกขั้นตอน");
    group.innerHTML = '<div class="form-card-body"><div id="originStepsHost"></div></div>';
    body.insertAdjacentElement("afterbegin", group);
    renderOrigin("originStepsHost", p);
  }

  function autoMountOrigin() {
    if (!/\/10-3v-[^/]*\.html$/.test(location.pathname) || /10-3v-00-/.test(location.pathname)) return;
    if (document.getElementById(GROUP_ID)) return;
    let c = null;
    try {
      c = typeof currentCase !== "undefined" ? currentCase : null;
    } catch (e) {
      c = null;
    }
    const A10 = global.Activity10;
    const p = c && c.l3OriginCaseId && A10 ? A10.getCases().find(function (x) { return x.id === c.l3OriginCaseId; }) : null;
    if (p) mountOriginGroup(p);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(autoMountOrigin, 60); });
  else setTimeout(autoMountOrigin, 60);
})(window);
