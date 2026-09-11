/**
 * E-CMIS กิจกรรมที่ 10.3 — คดีศาลปกครอง (Part 1: รับคำฟ้อง - สรุปความเห็นเสนอบอร์ด)
 * Shared runtime for the 10-3-*.html step pages, mirroring the pattern used by
 * ecmis-10-2.js (STEPS table, signature modal, stepper/sidebar helpers) instead
 * of copy-pasting per page the way the 10.1 pages do it.
 *
 * Covers LAW0085-LAW0096 of the AS-IS swimlane (see
 * docs/10.3 mockup/flow-page-01.md and
 * docs/10.3 mockup/implementation-plan-part1.md). Case intake for 10.3 happens
 * on the shared 02-board-intake.html (category "10.3"), which writes the first
 * L3_PENDING_DIRECTOR_ASSIGN status — everything after that lives here.
 *
 * Depends on: ecmis-app.js (ECMIS.ROLES), ecmis-activity10.js (Activity10 store),
 * SweetAlert2, Bootstrap 5 CSS (signature modal layout only).
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ FLOW
     One entry per step. `status`/`statusCode` are what THIS step writes onto
     the case once its page submits — so 01-work-inbox.html and the next
     page's Activity103.getCase() know who acts on it next. */
  const STEPS = [
    {
      code: "LAW0085",
      seq: 1,
      page: "02-board-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณามอบหมาย",
      statusCode: "L3_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการกองกฎหมาย รับเรื่องและเสนอ ผอ.กองกฎหมาย",
      stepName: "ธุรการ รับเรื่อง",
    },
    {
      code: "LAW0088",
      seq: 2,
      page: "10-3-02-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานพิจารณามอบหมายนิติกร",
      statusCode: "L3_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย ลงนามมอบหมาย",
      stepName: "ผอ.กองกฎหมาย มอบหมาย",
    },
    {
      code: "LAW0089",
      seq: 3,
      page: "10-3-03-group-director-assign.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "นิติกรตรวจสอบคำฟ้อง",
      statusCode: "L3_PENDING_LAWYER_REVIEW",
      label: "ผอ.กลุ่มงาน มอบหมายนิติกรผู้รับผิดชอบ",
      stepName: "ผอ.กลุ่มงาน มอบหมายนิติกร",
    },
    {
      /* รวม LAW0090 (ตรวจสอบคำฟ้อง) + LAW0092 (จัดทำบันทึกความเห็น) เป็นหน้าเดียว —
         ตัดขั้น LAW0091 (ธุรการประสานนักสืบ) ออก เพราะนิติกรค้นหาสำนวนไต่สวนเดิม
         จากระบบได้เองโดยตรง ไม่ต้องรอธุรการประสานให้ */
      code: "LAW0090",
      seq: 4,
      page: "10-3-04-lawyer-review-complaint.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ผอ.กลุ่มงานพิจารณาเห็นชอบ",
      statusCode: "L3_PENDING_GROUP_APPROVE",
      label: "นิติกร ตรวจสอบคำฟ้องและจัดทำบันทึกความเห็น",
      stepName: "นิติกร ตรวจสอบ/จัดทำความเห็น",
    },
    {
      code: "LAW0093",
      seq: 5,
      page: "10-3-07-group-director-approve.html",
      role: "case_group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานคดี",
      status: "ผอ.กองกฎหมายลงนามผ่านเรื่อง",
      statusCode: "L3_PENDING_DIRECTOR_SIGN",
      label: "ผอ.กลุ่มงาน พิจารณาและเห็นชอบ",
      stepName: "ผอ.กลุ่มงาน เห็นชอบ",
    },
    {
      code: "LAW0094",
      seq: 6,
      page: "10-3-08-legal-director-sign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ธุรการออกเลขส่งและเสนอบอร์ด",
      statusCode: "L3_PENDING_ADMIN_DISPATCH",
      label: "ผอ.กองกฎหมาย ตรวจสอบและลงนามผ่านเรื่อง",
      stepName: "ผอ.กองกฎหมาย ลงนาม",
    },
    {
      code: "LAW0095",
      seq: 7,
      page: "10-3-09-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "รอเสนอบอร์ด (กิจกรรมที่ 7)",
      statusCode: "L3_READY_FOR_BOARD",
      label: "ธุรการ ออกเลขส่งภายในและส่งมติเสนอบอร์ด",
      stepName: "ธุรการ ออกเลขส่ง/เสนอบอร์ด",
    },
  ];

  /* ------------------------------------------------------------- PART 1B
     สาขาคู่ขนาน (ไม่ตัดสายหลัก) — เกิดจากติ๊ก checkbox "มีคำขอทุเลาการบังคับคดี"
     ที่ 10-3-04 แล้วสร้างเคสลูกแยกต่างหาก (ดู docs/10.3 mockup/implementation-plan-part1b.md)
     ใช้ statusCode เป็นของตัวเอง (คำนำหน้า L3B_) เพื่อไม่ให้ชนกับสถานะของเคสแม่ */
  const STAY_STEPS = [
    {
      code: "LAW0097",
      seq: 1,
      page: "10-3b-01-lawyer-draft-stay-objection.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ธุรการลงนามคำชี้แจงคัดค้าน",
      statusCode: "L3B_PENDING_ADMIN_SIGN",
      label: "นิติกร จัดทำคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี",
      stepName: "นิติกร จัดทำคำชี้แจงคัดค้าน",
    },
    {
      code: "LAW0098",
      seq: 2,
      page: "10-3b-02-legal-admin-sign-stay-objection.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "นิติกรส่งคำชี้แจงต่อศาล",
      statusCode: "L3B_PENDING_LAWYER_DISPATCH",
      label: "ธุรการ ลงนามคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี",
      stepName: "ธุรการ ลงนาม",
    },
    {
      code: "LAW0099",
      seq: 3,
      page: "10-3b-03-lawyer-dispatch-stay-objection.html",
      role: "case_legal_officer",
      roleTitle: "นิติกร กลุ่มงานคดี",
      status: "ส่งคำชี้แจงคัดค้านต่อศาลแล้ว",
      statusCode: "L3B_CLOSED",
      label: "นิติกร ส่งคำชี้แจงคัดค้านต่อศาลปกครอง",
      stepName: "นิติกร ส่งคำชี้แจง",
    },
  ];

  const ALL_STEPS = STEPS.concat(STAY_STEPS);

  function stepByCode(code) {
    return ALL_STEPS.find(function (s) { return s.code === code; }) || null;
  }
  function stepByPage(page) {
    return ALL_STEPS.find(function (s) { return s.page === page; }) || null;
  }

  /* สถานะที่ขั้นตอน i เขียนไว้ -> หน้าของขั้นตอนถัดไปที่ต้องดำเนินการ
     (ขั้นตอนสุดท้าย L3_READY_FOR_BOARD ไม่มี route ต่อ — เป็น black box
     รอหน้าเสนอบอร์ดจริงที่ยังไม่ implement ตามแผน) */
  const ROUTES = STEPS.reduce(function (acc, step, i) {
    const next = STEPS[i + 1];
    if (next) acc[step.statusCode] = next.page;
    return acc;
  }, {});

  /* L3B_PENDING_LAWYER_DRAFT คือสถานะตั้งต้นที่ spawnStayObjectionCase() เขียนไว้
     ตอนสร้างเคสลูก — ไม่มีขั้นก่อนหน้าใน STAY_STEPS ให้ reduce ไล่ต่อได้ (ต้องระบุ
     เส้นทางแรกเข้า 10-3b-01 ด้วยมือ) ส่วนที่เหลือไล่ต่อแบบเดียวกับ ROUTES ข้างบน */
  ROUTES["L3B_PENDING_LAWYER_DRAFT"] = STAY_STEPS[0].page;
  STAY_STEPS.reduce(function (acc, step, i) {
    const next = STAY_STEPS[i + 1];
    if (next) acc[step.statusCode] = next.page;
    return acc;
  }, ROUTES);

  const TH_MONTHS = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  function formatThaiDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.getDate() + " " + TH_MONTHS[dt.getMonth()] + " " + (dt.getFullYear() + 543);
  }
  function formatThaiDateTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return formatThaiDate(dt) + " " + hh + ":" + mm + " น.";
  }

  const Activity103 = {
    STEPS: STEPS,
    ROUTES: ROUTES,
    stepByCode: stepByCode,
    stepByPage: stepByPage,

    /* คดีของกิจกรรม 10.3 (คดีศาลปกครอง) — เช็คจาก category ที่ 02-board-intake.html เขียนไว้ */
    isCourtCase: function (kase) {
      if (!kase) return false;
      const cat = kase.category || kase.type || (kase.raw && kase.raw.category) || "";
      return String(cat).indexOf("10.3") === 0;
    },

    /* Activity10.getCaseById() ตกไปที่ cases[0] เมื่อไม่รู้จัก id — กรองเฉพาะ 10.3 ก่อน */
    getCase: function (caseId, fallbackStatusCode) {
      const all = (Activity10.getCases && Activity10.getCases()) || [];
      const pool = all.filter(Activity103.isCourtCase);
      const exact = caseId && pool.find(function (c) { return c.id === caseId; });
      if (exact) return exact;
      return (
        pool.find(function (c) { return c.statusCode === fallbackStatusCode; }) ||
        pool[0] ||
        null
      );
    },

    /* เดินงานไปขั้นถัดไปตามตาราง STEPS — ใช้ร่วมกันทุกหน้า 10-3-xx */
    advance: function (caseId, stepCode, patch) {
      const step = stepByCode(stepCode);
      if (!step) return null;
      const next = Object.assign(
        {
          status: step.status,
          statusCode: step.statusCode,
          statusBadge: "bg-primary text-white",
          l3Step: step.code,
          l3StepSeq: step.seq,
        },
        patch || {},
      );
      return Activity10.updateCase(caseId, next);
    },

    /* บันทึกลายเซ็นลงช่องของบทบาทที่กำลังลงนามอยู่ */
    sign: function (caseId, slot, imageDataUrl, extra) {
      const kase = Activity10.getCaseById(caseId);
      if (!kase) return null;
      const sigs = Object.assign({}, kase.l3Signatures || {});
      sigs[slot] = Object.assign(
        { image: imageDataUrl, signedAt: formatThaiDateTime(new Date()) },
        extra || {},
      );
      return Activity10.updateCase(caseId, { l3Signatures: sigs });
    },

    /* ออกเลขหนังสือส่ง — ผูกกับปุ่มของหน้าที่ต้องออกเลข (LAW0091/LAW0095) */
    issueDocNo: function (caseId, docField, dateField) {
      const kase = Activity10.getCaseById(caseId);
      if (kase && kase[docField]) return kase[docField];
      const seq = String(4400 + Math.floor(Math.random() * 500)).padStart(4, "0");
      const docNo = "ปป 0003/" + seq;
      const patch = {};
      patch[docField] = docNo;
      patch[dateField] = formatThaiDate(new Date());
      Activity10.updateCase(caseId, patch);
      return docNo;
    },

    /* คดีของกิจกรรมนี้ที่มี l3ParentCaseId คือเคสลูกของสาขาคำขอทุเลาฯ (Part 1b) */
    isStayObjectionCase: function (kase) {
      return !!(kase && kase.l3ParentCaseId);
    },

    /* สร้างเคสลูกแยกต่างหากเมื่อ 10-3-04 ติ๊ก "มีคำขอทุเลาการบังคับคดี" — เดินสถานะ
       ของตัวเอง (L3B_*) เป็นอิสระจากเคสแม่ ไม่ชนกัน (ดู implementation-plan-part1b.md) */
    spawnStayObjectionCase: function (parentCase) {
      if (!parentCase) return null;
      const childId = parentCase.id.replace(/\/(\d{4})$/, "-B/$1");
      const existing = Activity10.getCaseById(childId);
      if (existing) return existing;
      return Activity10.addCase({
        id: childId,
        category: parentCase.category,
        categoryName: parentCase.categoryName,
        l3ParentCaseId: parentCase.id,
        title:
          "คำขอทุเลาการบังคับคดี — " + (parentCase.courtName || "") +
          " (เกี่ยวข้องกับ " + (parentCase.blackCaseNo || "") + ")",
        courtName: parentCase.courtName,
        blackCaseNo: parentCase.blackCaseNo,
        redCaseNo: parentCase.redCaseNo,
        orderedTo: parentCase.orderedTo,
        plaintiffs: parentCase.plaintiffs,
        defendants: parentCase.defendants,
        assignedRole: "case_legal_officer",
        officer: parentCase.officer,
        status: "นิติกรจัดทำคำชี้แจงคัดค้าน",
        statusCode: "L3B_PENDING_LAWYER_DRAFT",
        statusBadge: "bg-primary text-white",
        l3Step: null,
        l3StepSeq: 0,
      });
    },
  };

  /* ---------------------------------------------------------- USER PROFILE */
  function currentRoleId() {
    return sessionStorage.getItem("ecmis_role") || "admin_legal";
  }
  function currentRole() {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const id = currentRoleId();
    return roles.find(function (r) { return r.id === id || r.login === id; }) || null;
  }
  function signerLabel(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name + " (" + r.title + ")" : "-";
  }

  /* ------------------------------------------------------- SIGNATURE MODAL
     สำเนาเดียวกับที่ใช้ใน 08-legal-director-approval.html / ecmis-10-2.js */
  let sigPadCtx = null;
  let sigPadDrawing = false;
  let sigPadHasDrawing = false;
  let sigMode = "hand";

  function getSigPadPos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function selectSignatureMode(mode) {
    sigMode = mode;
    const cardHand = document.getElementById("swal-card-hand");
    const cardCert = document.getElementById("swal-card-cert");
    const badge = document.getElementById("swal-sig-mode-badge");
    const boxCanvas = document.getElementById("swal-box-canvas");
    const boxCert = document.getElementById("swal-box-cert");
    if (cardHand) cardHand.classList.toggle("is-active", mode === "hand");
    if (cardCert) cardCert.classList.toggle("is-active", mode === "cert");
    if (badge) {
      badge.innerHTML =
        mode === "hand"
          ? '<i class="fa-solid fa-check me-1"></i> เซ็นมือ'
          : '<i class="fa-solid fa-check me-1"></i> ลายเซ็นดิจิทัล';
    }
    if (boxCanvas) boxCanvas.classList.toggle("is-visible", mode === "hand");
    if (boxCert) boxCert.classList.toggle("is-visible", mode === "cert");
  }

  function clearSignaturePad() {
    const canvas = document.getElementById("swal-sig-canvas");
    if (!canvas || !sigPadCtx) return;
    sigPadCtx.clearRect(0, 0, canvas.width, canvas.height);
    sigPadHasDrawing = false;
  }

  function bindSignaturePad() {
    const canvas = document.getElementById("swal-sig-canvas");
    if (!canvas) return;
    sigPadCtx = canvas.getContext("2d");
    sigPadCtx.lineWidth = 2.4;
    sigPadCtx.lineCap = "round";
    sigPadCtx.strokeStyle = "#0F172A";
    sigPadHasDrawing = false;
    sigPadDrawing = false;
    sigMode = "hand";

    const startDraw = function (evt) {
      evt.preventDefault();
      sigPadDrawing = true;
      const pos = getSigPadPos(canvas, evt);
      sigPadCtx.beginPath();
      sigPadCtx.moveTo(pos.x, pos.y);
    };
    const moveDraw = function (evt) {
      if (!sigPadDrawing) return;
      evt.preventDefault();
      const pos = getSigPadPos(canvas, evt);
      sigPadCtx.lineTo(pos.x, pos.y);
      sigPadCtx.stroke();
      sigPadHasDrawing = true;
    };
    const endDraw = function () { sigPadDrawing = false; };

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw);

    const clearBtn = document.getElementById("swal-sig-clear");
    if (clearBtn) clearBtn.addEventListener("click", clearSignaturePad);
    const cardHand = document.getElementById("swal-card-hand");
    const cardCert = document.getElementById("swal-card-cert");
    if (cardHand) cardHand.addEventListener("click", function () { selectSignatureMode("hand"); });
    if (cardCert) cardCert.addEventListener("click", function () { selectSignatureMode("cert"); });
  }

  function generateCertificateStampImage(signerFull, certId) {
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ECFDF5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#A7F3D0";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    ctx.fillStyle = "#065F46";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("ลงนามด้วยใบรับรองอิเล็กทรอนิกส์", 20, 40);
    ctx.font = "13px sans-serif";
    ctx.fillText("Certificate: " + certId, 20, 68);
    const parenIdx = signerFull.indexOf("(");
    const namePart = parenIdx > -1 ? signerFull.slice(0, parenIdx).trim() : signerFull;
    const rolePart = parenIdx > -1 ? signerFull.slice(parenIdx).trim() : "";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(namePart, 20, 100);
    ctx.font = "12px sans-serif";
    ctx.fillText(rolePart, 20, 122);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#16A34A";
    ctx.fillText(new Date().toLocaleString("th-TH"), 20, 150);
    return canvas.toDataURL("image/png");
  }

  function openSignatureModal(opts, onConfirm) {
    const cfg = opts || {};
    const title = cfg.title || "ยืนยันการลงนามอิเล็กทรอนิกส์";
    const signerFull = cfg.signer || signerLabel(currentRoleId());
    const certId = cfg.certId || "PACC-2569-103";

    Swal.fire({
      width: "720px",
      html:
        '<div class="text-start emd-body">' +
        '<div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">' +
        '<i class="fa-solid fa-pen-nib text-primary fa-lg"></i>' +
        '<h5 class="m-0 fw-bold emd-sig-title">' + title + "</h5>" +
        "</div>" +
        '<div class="p-3 mb-3 rounded-3 d-flex align-items-center gap-2 emd-sig-signer">' +
        '<i class="fa-solid fa-user me-1"></i>' +
        "<span>ผู้ลงนามคือ <strong>" + signerFull + "</strong></span>" +
        "</div>" +
        '<div class="d-flex align-items-center justify-content-between mb-2">' +
        "<div>" +
        '<div class="fw-bold emd-sig-label">เลือกวิธีลงนาม <span class="text-danger">*</span></div>' +
        '<div class="text-muted emd-fs-sm">เลือกได้เพียง 1 วิธีต่อการลงนามหนึ่งครั้ง</div>' +
        "</div>" +
        '<div id="swal-sig-mode-badge" class="badge rounded-pill bg-light text-primary border px-2 py-1 emd-fs-sm">' +
        '<i class="fa-solid fa-check me-1"></i> เซ็นมือ</div>' +
        "</div>" +
        '<div class="row g-3 mb-3">' +
        '<div class="col-6">' +
        '<div id="swal-card-hand" class="p-3 rounded-3 border d-flex gap-3 align-items-start h-100 emd-sig-card is-active">' +
        '<div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 emd-sig-ico is-primary">' +
        '<i class="fa-solid fa-pen fa-lg"></i></div>' +
        '<div><div class="fw-bold text-dark emd-sig-card-title">1. เซ็นมือ</div>' +
        '<div class="text-muted emd-sig-card-desc">ใช้เมาส์หรือทัชแพดลากลายเซ็น</div></div>' +
        "</div></div>" +
        '<div class="col-6">' +
        '<div id="swal-card-cert" class="p-3 rounded-3 border d-flex gap-3 align-items-start h-100 emd-sig-card">' +
        '<div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 emd-sig-ico">' +
        '<i class="fa-solid fa-shield-halved fa-lg"></i></div>' +
        '<div><div class="fw-bold text-dark emd-sig-card-title">2. ลายเซ็นดิจิทัล</div>' +
        '<div class="text-muted emd-sig-card-desc">ประทับลายเซ็นอัตโนมัติด้วยใบรับรองอิเล็กทรอนิกส์ที่มีอยู่</div></div>' +
        "</div></div>" +
        "</div>" +
        '<div id="swal-box-canvas" class="border rounded-3 p-3 mb-3 bg-white emd-sig-panel is-visible">' +
        '<div class="d-flex align-items-center justify-content-between mb-2">' +
        "<div>" +
        '<div class="fw-bold emd-sig-label">เซ็นชื่อในกรอบด้านล่าง</div>' +
        '<div class="text-muted emd-fs-sm">กดเมาส์ค้างแล้วลาก หรือใช้นิ้วบนอุปกรณ์ระบบสัมผัส</div>' +
        "</div>" +
        '<button type="button" class="btn btn-sm btn-outline-secondary border px-2 py-1 rounded-2 emd-fs-sm" id="swal-sig-clear">' +
        '<i class="fa-solid fa-eraser me-1"></i> ล้างลายเซ็น</button>' +
        "</div>" +
        '<div class="sig-canvas-wrapper emd-sig-pad">' +
        '<canvas id="swal-sig-canvas" width="640" height="170" class="emd-sig-canvas"></canvas>' +
        "</div></div>" +
        '<div id="swal-box-cert" class="p-3 rounded-3 emd-sig-panel emd-sig-cert">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
        '<i class="fa-solid fa-circle-check text-success fa-lg"></i>' +
        "<strong>Certificate: " + certId + "</strong></div>" +
        "<div>ผู้ถือใบรับรอง: <strong>" + signerFull + "</strong></div>" +
        '<div class="mt-1 text-success emd-fs-sm">ระบบจะประทับลายเซ็นอิเล็กทรอนิกส์ลงในเอกสารโดยอัตโนมัติ</div>' +
        "</div></div>",
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-pen me-1"></i> ลงนาม',
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16A34A",
      cancelButtonColor: "#7C8CA3",
      allowOutsideClick: false,
      didOpen: bindSignaturePad,
      preConfirm: function () {
        if (sigMode === "hand") {
          if (!sigPadHasDrawing) {
            Swal.showValidationMessage("กรุณาลงลายมือชื่อในกรอบก่อนยืนยันการลงนาม");
            return false;
          }
          return document.getElementById("swal-sig-canvas").toDataURL("image/png");
        }
        return generateCertificateStampImage(signerFull, certId);
      },
    }).then(function (result) {
      if (result.isConfirmed && typeof onConfirm === "function") {
        onConfirm(result.value, sigMode);
      }
    });
  }

  /* ---------------------------------------------------------- PAGE HELPERS */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text == null || text === "" ? "-" : text;
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* เอกสารแนบประกอบคำฟ้อง — แนบไว้ตั้งแต่ 02-board-intake.html (attachmentFileNames)
     เก็บแค่ชื่อไฟล์ ไม่มีไบต์ไฟล์จริงให้ดาวน์โหลด (mockup ไม่มี backend เก็บไฟล์) */
  function renderAttachments(containerId, fileNames) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const files = fileNames || [];
    if (!files.length) {
      el.innerHTML = '<div class="read-box l3-optional">ไม่มีเอกสารแนบ</div>';
      return;
    }
    el.innerHTML = files
      .map(function (name) {
        const safeName = String(name).replace(/'/g, "\\'");
        return (
          '<div class="l3-attachment-row">' +
          '<div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' +
          name +
          "</div>" +
          '<button type="button" class="btn btn-secondary" style="height: 28px; padding: 0 10px; font-size: 0.8em" onclick="ECMIS103.mockOpenFile(\'' +
          safeName +
          "')\">" +
          '<i class="fa-solid fa-download me-1"></i>ดาวน์โหลด</button>' +
          "</div>"
        );
      })
      .join("");
  }

  function mockOpenFile(name) {
    Swal.fire({
      icon: "info",
      title: "เปิดไฟล์ " + name + "...",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  /* รายชื่อผู้ฟ้อง/ผู้ถูกฟ้อง (อ่านอย่างเดียว) — เก็บเป็น array บนเคสตั้งแต่ 02-board-intake.html */
  function renderPartyList(containerId, names) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const list = (names || []).filter(Boolean);
    el.innerHTML = list.length
      ? list.map(function (n) { return '<div class="read-box" style="margin-bottom:6px;">' + n + "</div>"; }).join("")
      : '<div class="read-box l3-optional">-</div>';
  }

  /* หัวโปรไฟล์มุมขวาบน — ทุกหน้า 10.3 เรียกตอน DOMContentLoaded */
  function initUserProfile() {
    const role = currentRole();
    if (!role) return;
    const shortName = String(role.name || "")
      .replace(/^(นางสาว|นาง|นาย|พ\.ต\.ท\.)/, "")
      .trim();
    setText("userAvatar", shortName.charAt(0) || "?");
    setText("userName", role.name);
    setText("userRoleTitle", role.title);
    setText("profileCardName", role.name);
    setText("profileCardTitle", role.title);
    setText("profileCardOrg", (role.org || role.group) + " · สำนักงาน ป.ป.ท.");
  }

  /* เตือนเมื่อเปิดหน้าด้วยบทบาทที่ไม่ใช่เจ้าของขั้นตอนนั้น (ดูได้ แต่เซ็นแทนไม่ได้) */
  function guardRole(expectedRoleId, roleTitle) {
    if (currentRoleId() === expectedRoleId) return true;
    const cur = currentRole();
    Swal.fire({
      icon: "warning",
      title: "บทบาทไม่ตรงกับขั้นตอนนี้",
      html:
        '<div class="emd-summary">' +
        "<p>ขั้นตอนนี้เป็นของ <strong>" + roleTitle + "</strong></p>" +
        "<p>ขณะนี้เข้าสู่ระบบด้วยบทบาท <strong>" + (cur ? cur.title : "-") + "</strong></p>" +
        "<p>ระบบเปิดให้ดูเอกสารได้ แต่ไม่สามารถลงนามแทนบทบาทอื่นได้</p>" +
        "</div>",
      confirmButtonColor: "#1e3a8a",
      confirmButtonText: "รับทราบ",
    });
    return false;
  }

  function goInbox() {
    window.location.href = "01-work-inbox.html";
  }

  /* แถบขั้นตอน — Part 1 เป็นเส้นตรงไม่มีสาขา จึงไม่ต้องกรองตามผลมติเหมือน 10.2 */
  function renderStepper(containerId, currentCode) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const curIdx = STEPS.findIndex(function (s) { return s.code === currentCode; });
    el.innerHTML = STEPS.map(function (step, i) {
      const cls = i < curIdx ? "completed" : i === curIdx ? "active" : "";
      const inner = i < curIdx ? '<i class="fa-solid fa-check"></i>' : String(i + 1);
      return (
        '<div class="step-item ' + cls + '" title="' + step.code + " — " + step.label + '">' +
        '<div class="step-circle">' + inner + "</div>" +
        '<div class="step-label">' + step.stepName + "</div>" +
        "</div>"
      );
    }).join("");
  }

  /* เมนูข้างซ้าย — แสดงเฉพาะขั้นตอน 10-3-xx ที่บทบาทนั้นรับผิดชอบ (ไม่รวม
     02-board-intake.html เพราะเป็นหน้ารับเรื่องกลางที่ใช้ร่วมกับหมวดอื่น) */
  function renderSidebarMenu(containerId, activePage) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const roleId = currentRoleId();
    const mine = ALL_STEPS.filter(function (s) {
      return s.role === roleId && s.page.indexOf("10-3") === 0;
    });
    const items = [
      '<li' + (activePage === "01-work-inbox.html" ? ' class="active"' : "") +
        '><a href="01-work-inbox.html"><i class="fa-solid fa-scale-balanced"></i> ' +
        "<span>งานกฎหมายในทางคดี</span></a></li>",
    ].concat(
      mine.map(function (s) {
        return (
          "<li" + (s.page === activePage ? ' class="active"' : "") +
          '><a href="' + s.page + '"><i class="fa-solid fa-file-pen"></i> ' +
          "<span>" + s.label + "</span></a></li>"
        );
      }),
    );
    el.innerHTML = items.join("");
  }

  /* --------------------------------------------------------- RICH EDITOR
     Tiptap แบบขั้นต่ำ (ตัวหนา/ตัวเอียง/บูลเลต/เลข) + แผงตัวอย่างเอกสารสด —
     คัดลอกจาก ecmis-10-2.js (loadEditorModules/mountEditor/...) มาไว้ที่นี่
     เพื่อให้ 10-3 self-contained เหมือนที่ทำกับ STEPS/สัญญาณลายเซ็นข้างต้น
     ใช้ที่ 10-3b-01-lawyer-draft-stay-objection.html (LAW0097) */
  let editorModulesPromise = null;
  function loadEditorModules() {
    if (!editorModulesPromise) {
      editorModulesPromise = Promise.all([
        import("https://esm.sh/@tiptap/core@2.9.1"),
        import("https://esm.sh/@tiptap/starter-kit@2.9.1"),
        import("https://esm.sh/@tiptap/extension-placeholder@2.9.1"),
      ]);
    }
    return editorModulesPromise;
  }

  const richEditors = new Map();

  /* opts: { placeholder, initialHTML, toolbarId, onUpdate(editor) } */
  function mountEditor(containerId, opts) {
    const cfg = opts || {};
    const el = document.getElementById(containerId);
    if (!el) return Promise.resolve(null);
    el.classList.add("l3-tiptap");

    return loadEditorModules().then(function (mods) {
      const Core = mods[0];
      const StarterKit = mods[1].default || mods[1].StarterKit;
      const Placeholder = mods[2].default || mods[2].Placeholder;

      const editor = new Core.Editor({
        element: el,
        extensions: [
          StarterKit.configure({
            heading: false,
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
          }),
          Placeholder.configure({ placeholder: cfg.placeholder || "" }),
        ],
        content: cfg.initialHTML || "",
        onUpdate: function () {
          if (cfg.onUpdate) cfg.onUpdate(editor);
        },
      });

      richEditors.set(containerId, editor);
      if (cfg.toolbarId) bindEditorToolbar(cfg.toolbarId, editor);
      return editor;
    });
  }

  function bindEditorToolbar(toolbarId, editor) {
    const bar = document.getElementById(toolbarId);
    if (!bar) return;
    const buttons = bar.querySelectorAll("[data-cmd]");
    const refresh = function () {
      buttons.forEach(function (btn) {
        btn.classList.toggle("is-active", editor.isActive(btn.getAttribute("data-cmd")));
      });
    };
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cmd = btn.getAttribute("data-cmd");
        const chain = editor.chain().focus();
        if (cmd === "bold") chain.toggleBold().run();
        else if (cmd === "italic") chain.toggleItalic().run();
        else if (cmd === "bulletList") chain.toggleBulletList().run();
        else if (cmd === "orderedList") chain.toggleOrderedList().run();
        refresh();
      });
    });
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    refresh();
  }

  function getEditorText(containerId) {
    const editor = richEditors.get(containerId);
    return editor ? editor.getText().trim() : "";
  }

  function getEditorHTML(containerId) {
    const editor = richEditors.get(containerId);
    return editor ? editor.getHTML() : "";
  }

  /* ------------------------------------------------------ DOC PREVIEW VIEWER
     ตัวช่วยของแถบเครื่องมือ "ตัวอย่างเอกสารสด" (.l3-doc-viewer) — ซูมและเลื่อน
     โฟกัสไปฟอร์ม (ฟอร์มยังเป็นแหล่งข้อมูลจริงหนึ่งเดียว ตัวอย่างเป็น read-only เสมอ) */
  const docZoomLevels = new Map();

  function zoomDoc(pageId, direction) {
    const el = document.getElementById(pageId);
    if (!el) return;
    const current = docZoomLevels.get(pageId) || 0.5;
    const next = Math.min(1.5, Math.max(0.3, current + direction * 0.1));
    docZoomLevels.set(pageId, next);
    el.style.zoom = String(next);
    const label = document.getElementById(pageId + "ZoomVal");
    if (label) label.textContent = Math.round(next * 100) + "%";
  }

  function initDocZoom(pageId, startZoom) {
    const el = document.getElementById(pageId);
    if (!el) return;
    const z = startZoom || 0.5;
    docZoomLevels.set(pageId, z);
    el.style.zoom = String(z);
    const label = document.getElementById(pageId + "ZoomVal");
    if (label) label.textContent = Math.round(z * 100) + "%";
  }

  function setDocViewMode(btnEl) {
    const bar = btnEl.closest(".l3-doc-viewmode");
    if (!bar) return;
    bar.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("is-active", b === btnEl);
    });
  }

  function focusFirstField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el.matches("input, textarea, select, [contenteditable]")
        ? el
        : el.querySelector("input, textarea, select, [contenteditable]");
    if (focusable && typeof focusable.focus === "function") {
      window.setTimeout(function () { focusable.focus(); }, 300);
    }
  }

  /* -------------------------------------------------------------- EXPORTS */
  global.Activity103 = Activity103;
  global.ECMIS103 = {
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    currentRoleId: currentRoleId,
    currentRole: currentRole,
    signerLabel: signerLabel,
    openSignatureModal: openSignatureModal,
    initUserProfile: initUserProfile,
    guardRole: guardRole,
    setText: setText,
    setHtml: setHtml,
    goInbox: goInbox,
    renderStepper: renderStepper,
    renderSidebarMenu: renderSidebarMenu,
    renderAttachments: renderAttachments,
    renderPartyList: renderPartyList,
    mockOpenFile: mockOpenFile,
    mountEditor: mountEditor,
    getEditorText: getEditorText,
    getEditorHTML: getEditorHTML,
    zoomDoc: zoomDoc,
    initDocZoom: initDocZoom,
    setDocViewMode: setDocViewMode,
    focusFirstField: focusFirstField,
  };
})(window);
