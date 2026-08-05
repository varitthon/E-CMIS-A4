(() => {
  const themes = {
    "01": "สารบบรับเรื่อง",
    "02": "สัญญาณ 1206",
    "03": "แผนที่เขต",
    "04": "ตรารับดิจิทัล",
    "05": "กระดาษความมั่นคง",
    "06": "ห้องสำนวน",
  };
  const themeNotes = {
    "01": "ทางการ น้ำเงิน–ทอง",
    "02": "ประชาสัมพันธ์สายด่วน",
    "03": "มุมมองพื้นที่และเขต",
    "04": "บริการดิจิทัลร่วมสมัย",
    "05": "เอกสารราชการโทนอุ่น",
    "06": "งานสำนวนโทนเข้ม",
  };
  const params = new URLSearchParams(location.search);
  let requested = params.get("theme");
  if (requested && themes[requested])
    localStorage.setItem("ecmis-theme", requested);
  const saved = localStorage.getItem("ecmis-theme");
  const current = themes[requested] ? requested : themes[saved] ? saved : "01";
  document.documentElement.dataset.theme = current;
  document.documentElement.classList.add("theme-" + current);
  function setTheme(id) {
    if (!themes[id]) return;
    localStorage.setItem("ecmis-theme", id);
    document.documentElement.dataset.theme = id;
    [...document.documentElement.classList]
      .filter((name) => name.startsWith("theme-"))
      .forEach((name) => document.documentElement.classList.remove(name));
    document.documentElement.classList.add("theme-" + id);
    renderChoices();
  }
  function renderChoices() {
    document.querySelectorAll("[data-theme-choice]").forEach((b) => {
      const active =
        b.dataset.themeChoice === document.documentElement.dataset.theme;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  function openLab() {
    const d = document.getElementById("themeLab");
    if (d) {
      renderChoices();
      d.showModal();
    }
  }
  function ensureThemeControls() {
    if (!document.getElementById("themeLab")) {
      const dialog = document.createElement("dialog");
      dialog.id = "themeLab";
      dialog.className = "ecmis-theme-lab";
      dialog.setAttribute("aria-labelledby", "themeTitle");
      dialog.innerHTML = `
        <div class="ecmis-theme-lab__body">
          <h2 id="themeTitle">เลือก Theme สำหรับนำเสนอ</h2>
          <p class="ecmis-theme-lab__hint">การเลือกจะถูกจำไว้เฉพาะเบราว์เซอร์นี้</p>
          <div class="ecmis-theme-grid">
            ${Object.entries(themes)
              .map(
                ([id, name]) => `<button type="button" class="ecmis-theme-choice" data-theme-choice="${id}">
                  <strong>${id} ${name}</strong><small>${themeNotes[id]}</small>
                </button>`,
              )
              .join("")}
          </div>
          <div class="ecmis-theme-lab__actions">
            <button type="button" class="ecmis-theme-lab__close" data-close-theme>ปิด</button>
          </div>
        </div>`;
      document.body.appendChild(dialog);
    }
    if (!document.querySelector("[data-version]")) {
      const footer = document.querySelector("footer");
      if (footer) {
        const version = document.createElement("button");
        version.type = "button";
        version.className = "ecmis-version-switch";
        version.dataset.version = "";
        version.textContent = "E-CMIS Public Service";
        version.setAttribute(
          "aria-label",
          "ข้อมูลเวอร์ชัน กดห้าครั้งเพื่อเปิดตัวเลือก Theme",
        );
        (footer.querySelector(".container") || footer).appendChild(version);
      }
    }
  }
  addEventListener("DOMContentLoaded", () => {
    ensureThemeControls();
    document.querySelector("[data-menu]")?.addEventListener("click", (e) => {
      const n = document.querySelector("[data-nav]");
      const open = n.classList.toggle("open");
      e.currentTarget.setAttribute("aria-expanded", String(open));
    });
    document
      .querySelectorAll("[data-theme-choice]")
      .forEach((b) =>
        b.addEventListener("click", () => setTheme(b.dataset.themeChoice)),
      );
    document
      .querySelector("[data-close-theme]")
      ?.addEventListener("click", () =>
        document.getElementById("themeLab")?.close(),
      );
    let taps = 0,
      timer;
    document.querySelector("[data-version]")?.addEventListener("click", () => {
      clearTimeout(timer);
      taps++;
      if (taps >= 5) {
        taps = 0;
        openLab();
      }
      timer = setTimeout(() => (taps = 0), 1800);
    });
    document.querySelectorAll("[data-track-form]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = f.querySelector("input").value.trim().toUpperCase();
        const match = v.match(/^(\d{2}\s?\d{4})[\s·-]+([A-Z0-9]{4})$/);
        if (match) {
          location.href = `tracking.html?yearSequence=${encodeURIComponent(match[1])}&verificationCode=${encodeURIComponent(match[2])}`;
        }
      }),
    );
  });
  addEventListener("keydown", (e) => {
    if (
      ((e.ctrlKey && e.altKey) || (e.metaKey && e.altKey)) &&
      e.key.toLowerCase() === "v"
    ) {
      e.preventDefault();
      openLab();
    }
  });
  function createTrackingNumber() {
    const buddhistYear = new Date().getFullYear() + 543;
    const year = String(buddhistYear).slice(-2);
    const sequenceKey = `ecmis-public-sequence-${year}`;
    const previous = Number.parseInt(localStorage.getItem(sequenceKey) || "0", 10);
    const normalizedPrevious = Number.isFinite(previous) ? Math.max(0, previous) : 0;
    if (normalizedPrevious >= 9999) {
      const pendingKey = `ecmis-public-pending-sequence-${year}`;
      const pendingSequence = Number.parseInt(localStorage.getItem(pendingKey) || "0", 10) + 1;
      localStorage.setItem(pendingKey, String(pendingSequence));
      const randomPart = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(-8).toUpperCase();
      return {
        yearSequence: "",
        verificationCode: "",
        pendingReference: `PENDING-${year}-${String(pendingSequence).padStart(6, "0")}-${randomPart}`,
        allocationStatus: "pending",
        capacityLevel: "exhausted",
        capacityMessage: "เลขรับบริการของปีนี้ครบ 9999 แล้ว ระบบบันทึกเรื่องไว้ในสถานะรอจัดสรรเลขรับบริการ",
      };
    }
    const sequence = normalizedPrevious + 1;
    localStorage.setItem(sequenceKey, String(sequence));
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(4);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    const verificationCode = [...bytes]
      .map((value) => alphabet[value % alphabet.length])
      .join("");
    const yearSequence = `${year}${String(sequence).padStart(4, "0")}`;
    const capacityLevel = sequence >= 9900 ? "emergency" : sequence >= 9000 ? "critical" : sequence >= 8000 ? "warning" : "normal";
    const capacityMessage = capacityLevel === "emergency"
      ? `เลขรับบริการปี ${year} เหลือ ${9999 - sequence} หมายเลข ต้องเตรียมกระบวนการจัดสรรเลขฉุกเฉินทันที`
      : capacityLevel === "critical"
        ? `เลขรับบริการปี ${year} ใช้ถึง ${String(sequence).padStart(4, "0")} แล้ว อยู่ในระดับวิกฤต`
        : capacityLevel === "warning"
          ? `เลขรับบริการปี ${year} ใช้ถึง ${String(sequence).padStart(4, "0")} แล้ว โปรดติดตามจำนวนเลขคงเหลือ`
          : "";
    return { yearSequence, verificationCode, allocationStatus: "allocated", capacityLevel, capacityMessage };
  }
  function parseTrackingPair(yearSequence, verificationCode) {
    const compactSequence = String(yearSequence || "").replace(/\s/g, "");
    const code = String(verificationCode || "").trim().toUpperCase();
    if (!/^\d{6}$/.test(compactSequence) || !/^[A-Z0-9]{4}$/.test(code)) {
      return null;
    }
    return {
      yearSequence: compactSequence,
      verificationCode: code,
      display: `${compactSequence} · ${code}`,
    };
  }
  function saveCaseMetadata(metadata) {
    const pending = metadata.allocationStatus === "pending" || !metadata.yearSequence;
    const safeRecord = {
      yearSequence: String(metadata.yearSequence || ""),
      verificationCode: String(metadata.verificationCode || ""),
      pendingReference: String(metadata.pendingReference || ""),
      allocationStatus: pending ? "pending" : "allocated",
      trackingNumber: `${metadata.yearSequence || ""} ${metadata.verificationCode || ""}`.trim(),
      subject: String(metadata.subject || ""),
      attachmentCount: Number(metadata.attachmentCount || 0),
      channel: "Website",
      submittedAt: new Date().toISOString(),
      internalStatus: pending ? "รอจัดสรรเลขรับบริการ" : "รอตรวจสอบความซ้ำซ้อน",
      publicStatus: pending ? "รอจัดสรรเลขรับบริการ" : "รับข้อมูลแล้ว",
    };
    const key = "ecmis-demo-cases";
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(records)) records = [];
    } catch {
      records = [];
    }
    records = records
      .filter((record) => pending ? record.pendingReference !== safeRecord.pendingReference : record.trackingNumber !== safeRecord.trackingNumber)
      .slice(-19);
    records.push(safeRecord);
    localStorage.setItem(key, JSON.stringify(records));
    return safeRecord;
  }
  function createDemoSession(authMethod) {
    const session = {
      authMethod,
      displayName: "เจ้าหน้าที่สาธิต",
      roles: ["admin", "officer", "director-center", "director-division"],
      activeRole: "admin",
      signedInAt: new Date().toISOString(),
    };
    sessionStorage.setItem("ecmis-demo-session", JSON.stringify(session));
    return session;
  }
  window.ECMIS = {
    themes,
    setTheme,
    openLab,
    createTrackingNumber,
    parseTrackingPair,
    saveCaseMetadata,
    createDemoSession,
  };
})();
