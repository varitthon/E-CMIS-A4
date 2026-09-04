/**
 * E-CMIS กิจกรรมที่ 10.2 — คำขอเปิดเผยข้อมูลข่าวสาร (มติคณะอนุกรรมการกลั่นกรอง)
 * Shared runtime for the 10-2-*.html step pages.
 *
 * Covers LAW0037–LAW0047 of the AS-IS swimlane. Everything the step pages have
 * in common lives here instead of being copy-pasted per page the way the 10.1
 * pages do it: the workflow table, signature routing, the signature pad modal
 * and the Thai speech-to-text button.
 *
 * Depends on: ecmis-app.js (ECMIS.ROLES), ecmis-activity10.js (Activity10 store),
 * SweetAlert2, Bootstrap 5 CSS (signature modal layout only).
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ FLOW
     One entry per step. `status`/`statusCode` are what the PREVIOUS page
     writes onto the case, so 01-work-inbox.html can route it to whoever
     acts next. */
  const STEPS = [
    {
      code: "LAW0037",
      seq: 6,
      page: "02-board-intake.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "ผอ.กองกฎหมายพิจารณาสั่งการ",
      statusCode: "L2_PENDING_DIRECTOR_ASSIGN",
      label: "ธุรการกองกฎหมาย ลงทะเบียนรับเรื่องและเสนอ ผอ.กองกฎหมาย",
      stepName: "ธุรการ ลงทะเบียนรับเรื่อง",
    },
    {
      code: "LAW0038",
      seq: 7,
      page: "10-2-01-legal-director-assign.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      status: "ผอ.กลุ่มงานความเห็นแย้งตรวจประเด็นกฎหมาย",
      statusCode: "L2_PENDING_GROUP_ASSIGN",
      label: "ผอ.กองกฎหมาย พิจารณาสั่งการและมอบหมายงาน",
      stepName: "ผอ.กอง สั่งการ",
    },
    {
      code: "LAW0039",
      seq: 8,
      page: "10-2-02-group-director-assign.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ฝ่ายเลขานุการฯ จัดทำรายงานความเห็น",
      statusCode: "L2_PENDING_SECRETARIAT_OPINION",
      label: "ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบประเด็นกฎหมายและมอบหมาย",
      stepName: "ผอ.กลุ่มงาน มอบหมาย",
    },
    {
      code: "LAW0040",
      seq: 9,
      page: "10-2-03-secretariat-opinion.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กลุ่มงานความเห็นแย้งตรวจความครบถ้วน",
      statusCode: "L2_PENDING_GROUP_VERIFY",
      label: "ฝ่ายเลขานุการฯ จัดทำรายงานความเห็นเสนอคณะอนุกรรมการฯ",
      stepName: "เลขานุการฯ จัดทำความเห็น",
    },
    {
      code: "LAW0041",
      seq: 10,
      page: "10-2-04-group-director-verify.html",
      role: "group_director",
      roleTitle: "ผู้อำนวยการกลุ่มงานความเห็นแย้ง",
      status: "ฝ่ายเลขานุการฯ บรรจุวาระและนัดหมายประชุม",
      statusCode: "L2_PENDING_AGENDA",
      label: "ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบความครบถ้วนของประเด็นกฎหมาย",
      stepName: "ผอ.กลุ่มงาน ตรวจครบถ้วน",
    },
    {
      code: "LAW0042-0043",
      seq: 11,
      page: "10-2-05-secretariat-agenda.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "คณะอนุกรรมการฯ พิจารณาตามระเบียบวาระ",
      statusCode: "L2_PENDING_SUBCOMMITTEE",
      label: "ฝ่ายเลขานุการฯ บรรจุวาระ นัดหมายและจัดส่งเอกสารประกอบการประชุม",
      stepName: "เลขานุการฯ บรรจุวาระ",
    },
    {
      code: "LAW0044",
      seq: 13,
      page: "10-2-06-subcommittee-resolution.html",
      role: "subcommittee_screen",
      roleTitle: "คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ฝ่ายเลขานุการฯ จัดทำผลมติ",
      statusCode: "L2_PENDING_RESOLUTION_DOC",
      label: "คณะอนุกรรมการฯ พิจารณาตามระเบียบวาระและมีมติที่ประชุม",
      stepName: "คณะอนุกรรมการฯ มีมติ",
    },
    {
      code: "LAW0045-0046",
      seq: 14,
      page: "10-2-07-secretariat-resolution-doc.html",
      role: "sub_secretariat",
      roleTitle: "ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร",
      status: "ผอ.กองกฎหมายลงนามในฐานะผู้เสนอ",
      statusCode: "L2_WAIT_SIGN_PROPOSER",
      label: "ฝ่ายเลขานุการฯ จัดทำผลมติและออกเลขหนังสือส่งภายใน",
      stepName: "เลขานุการฯ ออกเลขหนังสือ",
    },
    {
      code: "LAW0045.1",
      seq: 15,
      page: "10-2-08-legal-director-propose.html",
      role: "dir_legal",
      roleTitle: "ผู้อำนวยการกองกฎหมาย",
      /* เดิมขั้นนี้เป็นขั้นสุดท้าย (L2_READY_FOR_BOARD) แต่หลังเพิ่มขั้นธุรการ
         ออกเลขส่งด้านล่าง สถานะที่เกิดขึ้นหลังลงนามในหน้านี้จึงต้องเป็นสถานะ
         รอธุรการดำเนินการต่อแทน */
      status: "ธุรการกองกฎหมายออกเลขส่งเสนอผู้บริหาร",
      statusCode: "L2_PENDING_DISPATCH",
      label: "ผอ.กองกฎหมาย ลงนามในฐานะผู้เสนอเรื่อง",
      stepName: "ผอ.กอง ลงนามเสนอ",
    },
    {
      /* ขั้นตอนนี้ไม่มีรหัส LAW ในผัง AS-IS10.2-swimlane-split.drawio เดิม
         (ผังเดิมข้ามจากผู้เสนอเรื่องไปที่ LAW0047 รองเลขาธิการฯ ลงนามเห็นชอบ
         โดยตรง) เพิ่มขั้นนี้ใหม่ตามคำขอ ให้สอดคล้องกับรูปแบบของกิจกรรม 10.1
         ที่มีขั้นธุรการออกเลขส่งคั่นระหว่างผู้อำนวยการลงนามกับส่งเสนอผู้บริหาร
         (ดู 09-legal-admin-dispatch.html) — ยังไม่รวมขั้นรองเลขาธิการฯ ลงนาม */
      code: "L2-DISPATCH",
      seq: 16,
      page: "10-2-09-legal-admin-dispatch.html",
      role: "admin_legal",
      roleTitle: "เจ้าหน้าที่ธุรการกองกฎหมาย",
      status: "รอเสนอมติบอร์ด (กิจกรรมที่ 7)",
      statusCode: "L2_READY_FOR_BOARD",
      label: "ธุรการกองกฎหมาย ออกเลขส่งและเสนอผู้บริหาร",
      stepName: "ธุรการ ออกเลขส่ง",
    },
  ];

  /* pending statusCode -> page that clears it. Built from STEPS so the table
     above stays the single source of truth for the routing. */
  const ROUTES = STEPS.reduce(function (acc, step, i) {
    const prev = STEPS[i - 1];
    if (prev) acc[prev.statusCode] = step.page;
    return acc;
  }, {});

  function stepByCode(code) {
    return STEPS.find(function (s) { return s.code === code; }) || null;
  }

  function stepByPage(page) {
    return STEPS.find(function (s) { return s.page === page; }) || null;
  }

  /* ------------------------------------------------------- RESOLUTION TYPES
     ตัวเลือกมติของคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร (LAW0044) และสถานะคดี — แยกกันคนละช่อง */
  const RESOLUTION_TYPES = [
    { value: "DISCLOSE", label: "อนุญาตเปิดเผย", color: "#16a34a" },
    { value: "PARTIAL", label: "อนุญาตเปิดเผยบางส่วน", color: "#d97706" },
    { value: "DENY", label: "ไม่อนุญาตเปิดเผย", color: "#dc2626" },
    { value: "OTHER", label: "อื่นๆ", color: "#64748b" },
  ];

  const CASE_STATES = [
    { value: "CLOSED", label: "คดีเสร็จสิ้นแล้ว", color: "#1e3a8a" },
    { value: "INVESTIGATING", label: "อยู่ระหว่างไต่สวน", color: "#1e3a8a" },
  ];

  function labelOf(list, value) {
    const hit = list.find(function (x) { return x.value === value; });
    return hit ? hit.label : "-";
  }

  function colorOf(list, value) {
    const hit = list.find(function (x) { return x.value === value; });
    return (hit && hit.color) || "#64748b";
  }

  /* ------------------------------------------------------------ SIGN CHAIN
     บันทึกเสนอเลขาธิการฯ (Part 1-A) มีช่องลงนาม 2 บล็อก ผู้ลงนามแต่ละคนเซ็น
     บนหน้าจอของตัวเองเท่านั้น ไม่มีหน้าไหนเซ็นแทนบทบาทอื่นได้ */
  const SIGN_CHAIN = [
    {
      slot: "proposer",
      role: "dir_legal",
      title: "ผู้เสนอเรื่อง",
      position: "ผู้อำนวยการกองกฎหมาย",
      certId: "PACC-DIRLEGAL-2569-102",
    },
  ];

  function signState(kase) {
    return (kase && kase.l2Signatures) || {};
  }

  function isSigned(kase, slot) {
    const sig = signState(kase)[slot];
    return !!(sig && sig.image);
  }

  /* แถบสถานะสายการลงนาม แสดงบนหัวเอกสารของทุกหน้าที่เกี่ยวกับการลงนาม */
  function renderSignChain(kase, activeSlot) {
    const sigs = signState(kase);
    const items = SIGN_CHAIN.map(function (link) {
      const done = isSigned(kase, link.slot);
      const active = !done && link.slot === activeSlot;
      const icon = done
        ? '<i class="fa-solid fa-circle-check"></i>'
        : active
          ? '<i class="fa-regular fa-clock"></i>'
          : '<i class="fa-regular fa-square"></i>';
      const state = done ? "ลงนามแล้ว" : active ? "รอลงนาม" : "ยังไม่ถึงคิว";
      const color = done ? "#16a34a" : active ? "#d97706" : "#94a3b8";
      const when =
        done && sigs[link.slot].signedAt
          ? '<div class="l2-sign-when">' + sigs[link.slot].signedAt + "</div>"
          : "";
      return (
        '<div class="l2-sign-node" style="border-color:' + color + '">' +
        '<div class="l2-sign-ico" style="color:' + color + '">' + icon + "</div>" +
        '<div class="l2-sign-meta">' +
        '<div class="l2-sign-title">' + link.title + "</div>" +
        '<div class="l2-sign-pos">' + link.position + "</div>" +
        '<div class="l2-sign-state" style="color:' + color + '">' + state + "</div>" +
        when +
        "</div></div>"
      );
    });
    return '<div class="l2-sign-chain">' + items.join("") + "</div>";
  }

  /* ------------------------------------------------------------ THAI DATES */
  const TH_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  function formatThaiDate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "-";
    return dt.getDate() + " " + TH_MONTHS[dt.getMonth()] + " " + (dt.getFullYear() + 543);
  }

  function formatThaiDateTime(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "-";
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");
    return formatThaiDate(dt) + " เวลา " + hh + ":" + mm + " น.";
  }

  /* --------------------------------------------------------------- STORE */
  const Activity102 = {
    STEPS: STEPS,
    ROUTES: ROUTES,
    RESOLUTION_TYPES: RESOLUTION_TYPES,
    CASE_STATES: CASE_STATES,
    SIGN_CHAIN: SIGN_CHAIN,
    stepByCode: stepByCode,
    stepByPage: stepByPage,
    labelOf: labelOf,
    colorOf: colorOf,
    isSigned: isSigned,
    signState: signState,
    renderSignChain: renderSignChain,

    /* คำร้อง/อุทธรณ์ของกิจกรรม 10.2 (หมวดหมู่ขึ้นต้นด้วย "10.2")
       01-work-inbox.html remaps store rows into its own shape, where the
       category lands on `type` (and the untouched record on `raw`), so accept
       any of the three rather than only the store's own field name. */
    isDisclosureCase: function (kase) {
      if (!kase) return false;
      const cat =
        kase.category || kase.type || (kase.raw && kase.raw.category) || "";
      return String(cat).indexOf("10.2") === 0;
    },

    /* Activity10.getCaseById() falls back to cases[0] when the id is unknown,
       which would silently open a 10.1 case here. Filter to 10.2 first. */
    getCase: function (caseId, fallbackStatusCode) {
      const all = (Activity10.getCases && Activity10.getCases()) || [];
      const pool = all.filter(Activity102.isDisclosureCase);
      const exact = caseId && pool.find(function (c) { return c.id === caseId; });
      if (exact) return exact;
      return (
        pool.find(function (c) { return c.statusCode === fallbackStatusCode; }) ||
        pool[0] ||
        null
      );
    },

    /* เดินงานไปขั้นถัดไปตามตาราง STEPS — ใช้ร่วมกันทุกหน้า */
    advance: function (caseId, stepCode, patch) {
      const step = stepByCode(stepCode);
      if (!step) return null;
      const next = Object.assign(
        {
          status: step.status,
          statusCode: step.statusCode,
          statusBadge: "bg-primary text-white",
          l2Step: step.code,
          l2StepSeq: step.seq,
        },
        patch || {},
      );
      return Activity10.updateCase(caseId, next);
    },

    /* บันทึกลายเซ็นลงช่องของบทบาทที่กำลังลงนามอยู่ */
    sign: function (caseId, slot, imageDataUrl, extra) {
      const kase = Activity10.getCaseById(caseId);
      if (!kase) return null;
      const sigs = Object.assign({}, kase.l2Signatures || {});
      sigs[slot] = Object.assign(
        { image: imageDataUrl, signedAt: formatThaiDateTime(new Date()) },
        extra || {},
      );
      return Activity10.updateCase(caseId, { l2Signatures: sigs });
    },

    /* ออกเลขหนังสือส่งภายใน (LAW0046) — ไม่มีหน้าแยก ผูกกับปุ่มส่งของหน้า 07 */
    issueInternalDocNo: function (caseId) {
      const kase = Activity10.getCaseById(caseId);
      if (kase && kase.l2InternalDocNo) return kase.l2InternalDocNo;
      const seq = String(4400 + Math.floor(Math.random() * 500)).padStart(4, "0");
      const docNo = "ปป 0002/" + seq;
      Activity10.updateCase(caseId, {
        l2InternalDocNo: docNo,
        l2InternalDocDate: formatThaiDate(new Date()),
      });
      return docNo;
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

  /* "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)" — ใช้ในกล่องยืนยันและใต้ลายเซ็น */
  function signerLabel(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name + " (" + r.title + ")" : "-";
  }

  /* ------------------------------------------------------- SIGNATURE MODAL
     โครงเดียวกับหน้า 06/07/08/14/15/22 ของกิจกรรม 10.1 แต่เก็บสำเนาเดียว */
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
    const certId = cfg.certId || "PACC-2569-102";

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

  /* --------------------------------------------------------- SPEECH TO TEXT
     ปุ่มไมค์ท้าย label ของทุก textarea — สำเนาเดียวใช้ร่วมกันทุกหน้า 10.2 */
  let activeRecognition = null;
  let isRecording = false;

  function stopRecordingUI(btnEl) {
    if (btnEl) {
      btnEl.classList.remove("recording");
      btnEl.title = "คลิกเพื่อพูด (พิมพ์ด้วยเสียง Speech-to-Text)";
    }
    isRecording = false;
  }

  /* --------------------------------------------------------- RICH TEXT (Tiptap)
     ตัวช่วยแปลง <div> ให้เป็น Tiptap editor แบบขั้นต่ำ (ตัวหนา/ตัวเอียง/บูลเลต/เลข)
     ใช้เฉพาะฟิลด์ที่ป้อนเข้าตัวอย่างเอกสารสดของ 10-2-06 และ 10-2-07 โปรเจกต์นี้ไม่มี
     bundler จึงโหลด Tiptap เป็น ES module จาก CDN ผ่าน dynamic import() (ใช้ได้ใน
     classic script เช่นกัน ไม่ต้องเปลี่ยนหน้าเป็น type="module") แล้ว cache ไว้ครั้งเดียว */
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
    el.classList.add("l2-tiptap");

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

  function toggleSpeechToText(targetId, btnEl) {
    const inputEl = document.getElementById(targetId);
    if (!inputEl) return;

    const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

    if (isRecording) {
      if (activeRecognition) {
        try { activeRecognition.stop(); } catch (e) { /* already stopped */ }
      }
      stopRecordingUI(btnEl);
      return;
    }

    if (!SpeechRecognition) {
      Swal.fire({
        icon: "info",
        title: "พิมพ์ด้วยเสียง",
        text: "เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API โดยตรง กรุณาใช้งานผ่าน Google Chrome หรือ Microsoft Edge",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "th-TH";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = function () {
        isRecording = true;
        activeRecognition = recognition;
        if (btnEl) {
          btnEl.classList.add("recording");
          btnEl.title = "กำลังฟังเสียง... (คลิกอีกครั้งเพื่อหยุด)";
        }
        Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        }).fire({ icon: "info", title: "🎙️ กำลังฟังเสียงภาษาไทย... กรุณาพูดข้อความ" });
      };

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        if (!transcript) return;
        const editor = richEditors.get(targetId);
        if (editor) {
          /* ฟิลด์ที่เป็น Tiptap editor — แทรกคำที่พูดตรงตำแหน่งเคอร์เซอร์ */
          editor.chain().focus().insertContent(transcript + " ").run();
        } else {
          const currentVal = inputEl.value ? inputEl.value.trim() : "";
          inputEl.value = currentVal ? currentVal + " " + transcript : transcript;
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
      };

      recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        stopRecordingUI(btnEl);
      };

      recognition.onend = function () { stopRecordingUI(btnEl); };

      recognition.start();
    } catch (err) {
      console.error("Recognition start error:", err);
      stopRecordingUI(btnEl);
    }
  }

  /* ---------------------------------------------------------- PAGE HELPERS */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text == null || text === "" ? "-" : text;
  }

  /* เอกสารแนบประกอบคำร้อง — แนบไว้ตั้งแต่ 02-board-intake.html (attachmentFileNames)
     เก็บแค่ชื่อไฟล์ ไม่มีไบต์ไฟล์จริงให้ดาวน์โหลด (mockup ไม่มี backend เก็บไฟล์)
     ใช้ร่วมกันทุกหน้า 10-2-xx ผ่าน populateCommon() */
  function renderAttachments(containerId, fileNames) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const files = fileNames || [];
    if (!files.length) {
      el.innerHTML = '<div class="read-box l2-optional">ไม่มีเอกสารแนบ</div>';
      return;
    }
    el.innerHTML = files
      .map(function (name) {
        const safeName = String(name).replace(/'/g, "\\'");
        return (
          '<div class="l2-attachment-row">' +
          '<div class="l2-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' +
          name +
          "</div>" +
          '<button type="button" class="btn btn-secondary" style="height: 28px; padding: 0 10px; font-size: 0.8em" onclick="ECMIS102.mockOpenFile(\'' +
          safeName +
          "')\">" +
          '<i class="fa-solid fa-download me-1"></i>ดาวน์โหลด</button>' +
          "</div>"
        );
      })
      .join("");
  }

  /* เปิด/ดาวน์โหลดไฟล์จริงไม่ได้ในmockup นี้ — แสดง toast แทน (ใช้แบบเดียวกับ
     07-group-director-approval.html ที่มีปุ่ม "ดาวน์โหลดร่าง" อยู่แล้ว) */
  function mockOpenFile(name) {
    Swal.fire({
      icon: "info",
      title: "เปิดไฟล์ " + name + "...",
      timer: 1200,
      showConfirmButton: false,
    });
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ------------------------------------------------------ DOC PREVIEW VIEWER
     ตัวช่วยของแถบเครื่องมือ "ตัวอย่างเอกสารสด" (.l2-doc-viewer) บน 10-2-06/07
     — ซูม, สลับปุ่มดูทีละหน้า/ต่อเนื่อง (เอกสารสั้น จึงมีหน้าเดียวเสมอ ปุ่มนี้
     เป็นภาพลักษณ์เท่านั้น), เลื่อนโฟกัสไปฟอร์ม, ส่งออก DOCX จริงฝั่งไคลเอนต์ */
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

  /* เริ่มต้นค่าซูมของแผงเอกสาร (เรียกครั้งเดียวตอน DOMContentLoaded) เพื่อให้
     หน้ากระดาษ A4 พอดีกับคอลัมน์ตัวอย่างที่ค่อนข้างแคบ (300–400px) */
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
    const bar = btnEl.closest(".l2-doc-viewmode");
    if (!bar) return;
    bar.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("is-active", b === btnEl);
    });
  }

  /* คลิก "แก้ไขเอกสาร" ในแผงตัวอย่าง → เลื่อนไปโฟกัสฟิลด์แรกของฟอร์มกรอกข้อมูล
     (ฟอร์มยังเป็นแหล่งข้อมูลจริงหนึ่งเดียว ตัวอย่างเอกสารอ่านอย่างเดียวเสมอ) */
  function focusFirstField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el.matches("input, textarea, select, [contenteditable]")
        ? el
        : el.querySelector("input, textarea, select, [contenteditable], .l2-choice");
    if (focusable && typeof focusable.focus === "function") {
      window.setTimeout(function () { focusable.focus(); }, 300);
    }
  }

  /* ส่งออกตัวอย่างเอกสารสดเป็นไฟล์ .docx จริงฝั่งไคลเอนต์ ผ่าน html-docx-js
     โหลดเป็น UMD <script> ธรรมดาจาก unpkg (ไม่ใช่ dynamic import ESM แบบ Tiptap
     เพราะซอร์สของไลบรารีนี้ใช้ `with` statement ซึ่ง esm.sh/esbuild แปลงเป็น
     ES module แบบ strict mode ไม่ได้ — ทดสอบแล้วได้ 500 จาก esm.sh) */
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

  function exportDocx(pageId, fileName) {
    const el = document.getElementById(pageId);
    if (!el) return;

    Swal.fire({
      title: "กำลังสร้างไฟล์ DOCX...",
      allowOutsideClick: false,
      didOpen: function () { Swal.showLoading(); },
    });

    loadDocxLib()
      .then(function (lib) {
        const asBlob = lib && lib.asBlob;
        if (typeof asBlob !== "function") throw new Error("html-docx-js ไม่พร้อมใช้งาน");

        const html =
          "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>" +
          el.innerHTML +
          "</body></html>";
        const blob = asBlob(html);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (fileName || "เอกสาร") + ".docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Swal.close();
      })
      .catch(function (err) {
        console.error("exportDocx error:", err);
        Swal.fire({
          icon: "error",
          title: "ส่งออก DOCX ไม่สำเร็จ",
          text: "กรุณาลองใหม่อีกครั้ง หรือใช้ปุ่มพิมพ์แทน",
          confirmButtonColor: "#1e3a8a",
        });
      });
  }

  /* หัวโปรไฟล์มุมขวาบน — ทุกหน้า 10.2 เรียกตอน DOMContentLoaded */
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

  /* เติมตัวเลือกผู้รับมอบหมายจาก ECMIS.ROLES เฉพาะบทบาทที่ระบุ
     ปัจจุบันแต่ละบทบาทมีผู้ใช้คนเดียวจึงขึ้น 1 ตัวเลือก แต่ถ้าเพิ่มคน
     ในบทบาทเดียวกันเข้า registry ตัวเลือกจะเพิ่มตามเองโดยไม่ต้องแก้หน้า

     ทุกตัวเลือกอยู่ในตำแหน่งเดียวกันอยู่แล้ว จึงยกชื่อตำแหน่งไปไว้ที่
     ป้ายกำกับของ select (hintId) และให้ตัวเลือกแสดงแค่ชื่อ-สกุล */
  function fillRoleSelect(selectId, roleId, hintId) {
    const el = document.getElementById(selectId);
    if (!el) return;
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const people = roles.filter(function (r) { return r.id === roleId; });
    const hint = hintId ? document.getElementById(hintId) : null;

    if (!people.length) {
      el.innerHTML = '<option value="">— ไม่พบผู้ใช้ในบทบาทนี้ —</option>';
      el.disabled = true;
      if (hint) hint.textContent = "";
      return;
    }

    el.disabled = false;
    el.innerHTML = people
      .map(function (r) {
        return (
          '<option value="' + r.login + '"' +
          ' data-name="' + r.name + '"' +
          ' data-title="' + r.title + '">' +
          r.name +
          "</option>"
        );
      })
      .join("");

    if (hint) hint.textContent = "(" + people[0].title + ")";
  }

  /* "นางสาวพิมพ์ชนก ธรรมรักษ์ (ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร)" — ชื่อเต็มของ
     ตัวเลือกที่เลือกอยู่ ใช้บันทึกลง officer เพราะ option แสดงแค่ชื่อ */
  function selectedPersonLabel(selectId) {
    const el = document.getElementById(selectId);
    const opt = el && el.selectedOptions && el.selectedOptions[0];
    if (!opt) return "-";
    const name = opt.dataset.name || opt.text;
    const title = opt.dataset.title || "";
    return title ? name + " (" + title + ")" : name;
  }

  /* แถบขั้นตอน — สร้างจากตาราง STEPS จึงไม่ต้องเขียนซ้ำในทุกหน้า */
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

  /* เมนูข้างซ้ายของงาน 10.2 — แสดงเฉพาะขั้นตอนที่บทบาทนั้นรับผิดชอบ */
  function renderSidebarMenu(containerId, activePage) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const roleId = currentRoleId();
    const mine = STEPS.filter(function (s) {
      return s.role === roleId && s.page.indexOf("10-2-") === 0;
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

  /* -------------------------------------------------------------- EXPORTS */
  global.Activity102 = Activity102;
  global.ECMIS102 = {
    formatThaiDate: formatThaiDate,
    formatThaiDateTime: formatThaiDateTime,
    currentRoleId: currentRoleId,
    currentRole: currentRole,
    signerLabel: signerLabel,
    openSignatureModal: openSignatureModal,
    toggleSpeechToText: toggleSpeechToText,
    initUserProfile: initUserProfile,
    guardRole: guardRole,
    setText: setText,
    setHtml: setHtml,
    goInbox: goInbox,
    fillRoleSelect: fillRoleSelect,
    selectedPersonLabel: selectedPersonLabel,
    renderStepper: renderStepper,
    renderSidebarMenu: renderSidebarMenu,
    mountEditor: mountEditor,
    getEditorText: getEditorText,
    getEditorHTML: getEditorHTML,
    renderAttachments: renderAttachments,
    mockOpenFile: mockOpenFile,
    zoomDoc: zoomDoc,
    initDocZoom: initDocZoom,
    setDocViewMode: setDocViewMode,
    focusFirstField: focusFirstField,
    exportDocx: exportDocx,
  };

  /* หน้าเพจเรียกตรง ๆ ผ่าน onclick="toggleSpeechToText(...)" ตามแบบเดิมของ 10.1 */
  global.toggleSpeechToText = toggleSpeechToText;
})(window);
