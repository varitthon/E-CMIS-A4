(() => {
  const screens = ["home", "service", "form", "review", "success"];
  const form = document.getElementById("complaintForm");
  const backButton = document.querySelector("[data-back]");
  const confirmButton = document.querySelector("[data-confirm]");
  const navigationHistory = [];
  let currentScreen = "home";
  let submitting = false;
  let receipt = null;

  function showScreen(name, { push = true } = {}) {
    if (!screens.includes(name)) return;
    if (push && currentScreen !== name) navigationHistory.push(currentScreen);
    currentScreen = name;
    document.querySelectorAll("[data-screen]").forEach((screen) => {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });
    backButton.hidden = name === "home" || name === "success";
    window.history.replaceState({}, "", `#${name}`);
    scrollTo({ top: 0, behavior: "instant" });
  }

  function getValue(name) {
    return String(form.elements[name]?.value || "").trim();
  }

  function validateForm() {
    const requiredFields = ["subject", "agency", "detail", "location"];
    let firstInvalid = null;
    requiredFields.forEach((name) => {
      const field = form.elements[name];
      const invalid = !getValue(name);
      field.setAttribute("aria-invalid", String(invalid));
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    const consent = form.elements.consent;
    const consentInvalid = !consent.checked;
    consent.setAttribute("aria-invalid", String(consentInvalid));
    if (consentInvalid && !firstInvalid) firstInvalid = consent;
    const error = document.querySelector("[data-form-error]");
    error.textContent = firstInvalid ? "กรอกข้อมูลที่มีเครื่องหมาย * และยืนยันเงื่อนไขให้ครบ" : "";
    firstInvalid?.focus();
    return !firstInvalid;
  }

  function fillReview() {
    document.querySelector("[data-review-confidential]").textContent = form.elements.confidential.checked
      ? "ขอปกปิดข้อมูลผู้ร้อง"
      : "ไม่ขอปกปิดข้อมูลผู้ร้อง";
    const rows = [
      ["ชื่อเรื่องร้องเรียน", getValue("subject")],
      ["หน่วยงานที่ถูกร้อง", getValue("agency")],
      ["บุคคลที่ถูกร้อง", getValue("accused") || "ไม่ระบุ"],
      ["รายละเอียด", getValue("detail")],
      ["สถานที่เกิดเหตุ", getValue("location")],
      ["เอกสารประกอบ", document.querySelector("[data-file-name]").textContent],
    ];
    document.querySelector("[data-review-details]").innerHTML = rows
      .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
      .join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function thaiDateTime(date = new Date()) {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "long", timeStyle: "short" }).format(date);
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function createReference() {
    const timestamp = Date.now().toString().slice(-6);
    return `TR-${new Date().getFullYear() + 543}-${timestamp}`;
  }

  function ensureDemoSequenceFloor() {
    const buddhistYear = new Date().getFullYear() + 543;
    const key = `ecmis-public-sequence-${String(buddhistYear).slice(-2)}`;
    const current = Number.parseInt(localStorage.getItem(key) || "0", 10);
    if (!Number.isFinite(current) || current < 5) localStorage.setItem(key, "5");
  }

  function persistEcmisCase(pair, reference) {
    const serviceNumber = pair.yearSequence;
    const buddhistYear = new Date().getFullYear() + 543;
    const sequence = serviceNumber.slice(-4).padStart(6, "0");
    const caseId = `ECMIS-${buddhistYear}-${sequence}`;
    const submittedAt = new Date().toISOString();
    const metadata = {
      yearSequence: serviceNumber,
      pin: pair.pin,
      identityLast4: "1234",
      id4: "1234",
      phone: "0812345678",
      pendingReference: "",
      allocationStatus: "allocated",
      trackingNumber: serviceNumber,
      subject: getValue("subject"),
      attachmentCount: 1,
      anonymousDetected: false,
      confidentialityRequested: form.elements.confidential.checked,
      identityFieldsProvided: 4,
      channel: "ทางรัฐ",
      sourceReference: reference,
      submittedAt,
      internalStatus: "รอตรวจสอบความซ้ำซ้อน",
      publicStatus: "รับข้อมูลแล้ว",
    };
    const records = readJson("ecmis-demo-cases", []);
    const nextRecords = (Array.isArray(records) ? records : [])
      .filter((record) => record.trackingNumber !== serviceNumber)
      .slice(-19);
    nextRecords.push(metadata);
    localStorage.setItem("ecmis-demo-cases", JSON.stringify(nextRecords));

    const caseData = {
      id: caseId,
      trackingYear: serviceNumber,
      trackingCode: pair.pin,
      citizenId: "1-1001-00123-45-6",
      identityLast4: "1234",
      id4: "1234",
      phone: "0812345678",
      anonymousDetected: false,
      confidentialityRequested: form.elements.confidential.checked,
      complainant: "นางสาวตัวอย่าง ทดสอบระบบ",
      subject: getValue("subject"),
      agency: getValue("agency"),
      channel: "ทางรัฐ",
      province: "นนทบุรี",
      region: "ส่วนกลาง",
      received: thaiDateTime(),
      type: "เรียกรับผลประโยชน์",
      place: getValue("location"),
      detail: getValue("detail"),
      damage: "อาจเกิดความเสียหายต่อประชาชนและกระบวนการอนุมัติของรัฐ",
      request: "ขอให้ตรวจสอบข้อเท็จจริงและดำเนินการตามอำนาจหน้าที่",
      attachments: [document.querySelector("[data-file-name]").textContent],
      sourceReference: reference,
    };
    const workspace = readJson("ecmis-a4-workspace-v3", {});
    workspace[caseId] = {
      caseData,
      documentData: {
        decision: "18/1ก", reasons: [], naccOtherChecked: false, naccOtherReason: "", anonymous: false,
        documentSubject: caseData.subject, officerOpinion: "", proposedRegion: "ส่วนกลาง", reviewRoute: "center",
        centerDecision: "", centerOpinion: "", centerAdditionalDetail: "", divisionOpinion: "", divisionAdditionalDetail: "",
        internalLetterNo: "", internalLetterDate: "", caseNumber: "", publicStatus: "", approvedAt: "", approvedBy: "",
        actingOfficer: "", actingOrder: "", assignedOfficer: "", backupOfficer: "", previousOfficer: "", previousBackupOfficer: "",
        adminNote: "", absenceReasonType: "", absenceNote: "", notAcceptReason: "", notAcceptOtherChecked: false,
        notAcceptOtherReason: "", naccLetterNo: "", naccLetterDate: "", naccSendMethod: "EMS", naccEms: "",
        naccSentDate: "", naccBoardNo: "", naccBoardDate: "", naccBoardNote: "", naccProofName: "", naccNotified: true,
      },
      workflow: { owner: "admin", stage: "admin", status: "รอลงรับและมอบหมาย", complete: false },
      assignmentHistory: [], decisionHistory: [], anonymousHistory: [], documentVersions: [],
    };
    localStorage.setItem("ecmis-a4-workspace-v3", JSON.stringify(workspace));
    return { serviceNumber, caseId };
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    fillReview();
    showScreen("review");
  });

  form.addEventListener("input", (event) => {
    if (event.target.matches("input,textarea")) event.target.removeAttribute("aria-invalid");
  });

  form.elements.attachment.addEventListener("change", () => {
    document.querySelector("[data-file-name]").textContent = form.elements.attachment.files[0]?.name || "หลักฐานตัวอย่าง.pdf";
  });

  confirmButton.addEventListener("click", async () => {
    if (submitting || receipt) return;
    submitting = true;
    confirmButton.disabled = true;
    confirmButton.textContent = "กำลังส่งข้อมูล...";
    document.querySelector("[data-submit-error]").textContent = "";
    try {
      ensureDemoSequenceFloor();
      const pair = window.ECMIS?.createTrackingNumber?.();
      if (!pair || pair.allocationStatus !== "allocated" || !pair.yearSequence || !pair.pin) {
        throw new Error(pair?.capacityMessage || "ไม่สามารถออกเลขรับบริการได้");
      }
      const reference = createReference();
      receipt = { ...persistEcmisCase(pair, reference), pin: pair.pin, reference };
      document.querySelector("[data-service-number]").textContent = receipt.serviceNumber;
      document.querySelector("[data-tracking-pin]").textContent = receipt.pin;
      document.querySelector("[data-tangrat-reference]").textContent = receipt.reference;
      document.querySelector("[data-track-link]").href = `tracking.html?serviceNumber=${encodeURIComponent(receipt.serviceNumber)}`;
      showScreen("success");
    } catch (error) {
      document.querySelector("[data-submit-error]").textContent = error.message || "ส่งข้อมูลไม่สำเร็จ โปรดลองอีกครั้ง";
    } finally {
      submitting = false;
      if (!receipt) {
        confirmButton.disabled = false;
        confirmButton.textContent = "ยืนยันและส่งเรื่อง";
      }
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-go]");
    if (!target) return;
    showScreen(target.dataset.go);
  });

  backButton.addEventListener("click", () => {
    showScreen(navigationHistory.pop() || "home", { push: false });
  });

  document.querySelector("[data-service-search]").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelector("[data-pacc-service]").hidden = Boolean(query) && !"ร้องเรียน แจ้งเบาะแส ทุจริต ป.ป.ท.".includes(query);
  });

  const initial = location.hash.slice(1);
  showScreen(screens.includes(initial) ? initial : "home", { push: false });
})();
