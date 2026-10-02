/* ECMIS — จำลองผลจากกิจกรรมที่ 7 (คณะกรรมการ ป.ป.ท.) แบบ bypass (TOR 10 — P10)

   กิจกรรมที่ 7 ยังไม่อยู่ในขอบเขตของโปรโตไทป์ ผู้ใช้ (ธุรการ) จึงบันทึก "ผลพิจารณา"
   แทนกิจกรรมที่ 7 ผ่านป๊อปอัปเดียวกันทุกจุดเชื่อม (B1–B7)
     B1 10.1 มติบอร์ด              B2 10.2 มติบอร์ดรอบ 2      B3 10.3 มติมอบอำนาจ
     B4 10.2 มติบอร์ดต่ออุทธรณ์    B5 10.3 มติบอร์ดอุทธรณ์/ไม่อุทธรณ์
     B6 10.3 รอคำพิพากษา (เปิด 10-3v-00)   B7 10.3 ผลศาลสูงสุด (ใช้การ์ดผลเดิมที่ 10-3v-15)
   B1–B3 และ B7 ใช้ได้เสมอ; B4–B6 ใช้ได้เมื่อสวิตช์ "จำลองผลจากกิจกรรมที่ 7" เปิด
   (ค่าตั้งต้น ON เก็บใน localStorage คีย์ ecmis_act7_bypass)

   ตัวช่วยล้วน (ไม่แตะ DOM) ส่งออกที่ ECMIS_ACT7_HELPERS เพื่อทดสอบ:
     tests/tor10-p10.test.mjs
   DB: ไม่เปลี่ยนสคีมา — ดู docs/tor10-p1-db-flow-changes.md §7.6 (P10) */
(function (global) {
  "use strict";

  const SWITCH_KEY = "ecmis_act7_bypass";
  const SWITCH_ROLES = ["admin_legal", "case_bureau_admin", "district_admin"];
  const ROLE_ALIASES = { "Kanda.R": "admin_legal" };
  const DEFAULT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
  const INBOX_PAGE = "01-work-inbox.html";

  const BOARD_APPEAL_STATUS = {
    APPEAL: {
      statusCode: "L9_BOARD_APPROVED_APPEAL",
      status: "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์",
    },
    NO_APPEAL: {
      statusCode: "L9_BOARD_APPROVED_NO_APPEAL",
      status: "รอธุรการรับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์",
    },
  };
  /* ผลวินิจฉัยอุทธรณ์ของคณะอนุกรรมการ (10-2-appeal-06) → มติบอร์ดที่สอดคล้อง */
  const RULING_TO_BOARD = {
    UPHOLD: "DENY",
    REVERSE_FULL: "DISCLOSE",
    REVERSE_PARTIAL: "PARTIAL",
  };

  const opt = (value, label) => ({ value: value, label: label });

  /* ------------------------------------------------------------ ACT7_LINKS
     required   ฟิลด์บังคับ (ลำดับ = ลำดับตรวจ)
     show       ฟิลด์ที่แสดงแบบไม่บังคับ — ฟิลด์ที่ไม่อยู่ใน required/show = ซ่อน
     labels     ป้ายเฉพาะจุดเชื่อม (ทับป้ายมาตรฐาน)
     popup:false = ไม่ผ่านป๊อปอัป (B6 เปิด 10-3v-00, B7 ใช้การ์ดผลศาลสูงสุด) */
  const ACT7_LINKS = {
    B1: {
      id: "B1",
      flow: "10.1",
      title: "มติคณะกรรมการ ป.ป.ท. (ความเห็นแย้ง)",
      options: [
        opt("AGREE", "เห็นชอบ"),
        opt("DISAGREE", "ไม่เห็นชอบ"),
        opt("OTHER", "อื่นๆ"),
      ],
      required: ["decision", "meetingNo", "meetingDate"],
      show: ["noticeNo", "noticeDate", "agendaNo", "detail", "files", "notes"],
      labels: { meetingNo: "ครั้งที่ประชุม", agendaNo: "วาระที่" },
      waitingStatuses: ["RETURNED_FROM_EXEC", "PENDING_FINAL_DISPATCH"],
      senderRoles: ["admin_legal"],
      requiresSwitch: false,
      popup: true,
      promptAfterOutbound: true,
      page: "10-legal-admin-resolution.html",
    },
    B2: {
      id: "B2",
      flow: "10.2",
      title: "มติคณะกรรมการ ป.ป.ท. (รอบ 2)",
      options: [
        opt("DISCLOSE", "อนุญาตเปิดเผย"),
        opt("PARTIAL", "อนุญาตเปิดเผยบางส่วน"),
        opt("DENY", "ไม่อนุญาตเปิดเผย"),
        opt("OTHER", "อื่นๆ"),
      ],
      required: ["decision", "noticeNo", "noticeDate"],
      show: ["detail", "files", "notes"],
      labels: {},
      waitingStatuses: ["L2_READY_FOR_BOARD_ROUND2", "L2_BOARD_RESOLVED_ROUND2"],
      senderRoles: ["admin_legal"],
      requiresSwitch: false,
      popup: true,
      promptAfterOutbound: true,
      page: "10-2-30-legal-admin-receive-board-round2.html",
    },
    B3: {
      id: "B3",
      flow: "10.3",
      title: "มติคณะกรรมการ ป.ป.ท. (มอบอำนาจ)",
      options: [opt("AUTHORIZE", "มีมติมอบอำนาจ")],
      required: [
        "decision", "meetingNo", "meetingDate", "agendaNo", "detail", "files",
        "noticeNo", "noticeDate", "lawyer",
      ],
      show: ["notes"],
      labels: { detail: "สาระสำคัญของมติ" },
      waitingStatuses: ["L3_READY_FOR_BOARD"],
      senderRoles: ["admin_legal"],
      requiresSwitch: false,
      popup: true,
      promptAfterOutbound: true,
      page: "10-3-10-legal-admin-resolution-notice.html",
    },
    B4: {
      id: "B4",
      flow: "10.2 อุทธรณ์",
      title: "มติคณะกรรมการ ป.ป.ท. ต่อคำอุทธรณ์",
      options: [
        opt("DISCLOSE", "ให้เปิดเผยข้อมูลทั้งหมด"),
        opt("PARTIAL", "ให้เปิดเผยข้อมูลบางส่วน"),
        opt("DENY", "ไม่เปิดเผยข้อมูล"),
      ],
      required: ["decision", "noticeNo", "noticeDate"],
      show: ["detail"],
      labels: { detail: "ความเห็นเพิ่มเติม / รายละเอียดมติ" },
      waitingStatuses: ["L2_APPEAL_SUBMITTED_TO_BOARD"],
      senderRoles: ["case_bureau_admin", "admin_legal"],
      requiresSwitch: true,
      popup: true,
      promptAfterOutbound: true,
      showWaiting: true,
      waitBadge: "ระหว่างรอกิจกรรมที่ 7",
      page: "10-2-appeal-12-tracking-secretary-notice-draft.html",
    },
    B5: {
      id: "B5",
      flow: "10.3 คำพิพากษา",
      title: "มติคณะกรรมการ ป.ป.ท. (อุทธรณ์/ไม่อุทธรณ์)",
      options: [opt("APPEAL", "ให้อุทธรณ์"), opt("NO_APPEAL", "ไม่อุทธรณ์")],
      required: ["decision", "meetingNo", "meetingDate"],
      show: ["detail"],
      labels: { meetingNo: "เลขที่มติ", detail: "รายละเอียดมติ / หมายเหตุ" },
      waitingStatuses: ["L9_PROPOSED_TO_BOARD"],
      senderRoles: ["admin_legal"],
      requiresSwitch: true,
      popup: true,
      promptAfterOutbound: true,
      showWaiting: true,
      waitBadge: "ระหว่างรอกิจกรรมที่ 7",
      page: "10-3v-28-legal-admin-board-propose.html",
    },
    B6: {
      id: "B6",
      flow: "10.3 คำพิพากษา",
      title: "รับหนังสือแจ้งผลคำพิพากษาศาลปกครองชั้นต้น",
      options: [],
      required: [],
      show: [],
      labels: {},
      waitingStatuses: ["L3_AWAITING_JUDGMENT"],
      senderRoles: ["admin_legal"],
      requiresSwitch: true,
      popup: false,
      showWaiting: true,
      waitBadge: "รอศาลมีคำพิพากษา",
      page: "10-3v-00-legal-admin-verdict-intake.html",
    },
    B7: {
      id: "B7",
      flow: "10.3 ศาลสูงสุด",
      title: "ผลคำพิพากษาศาลปกครองสูงสุด",
      options: [],
      required: [],
      show: [],
      labels: {},
      waitingStatuses: ["L7_SENT_TO_PROSECUTOR"],
      senderRoles: ["case_legal_officer"],
      requiresSwitch: false,
      popup: false,
      page: "10-3v-15-lawyer-send-appeal-reply.html",
    },
  };

  const FIELD_LABELS = {
    decision: "มติคณะกรรมการ",
    other: "มติ (อื่นๆ)",
    meetingNo: "ครั้งที่ประชุม/เลขที่มติ",
    meetingDate: "วันที่ประชุม",
    noticeNo: "เลขที่หนังสือแจ้งมติ",
    noticeDate: "วันที่หนังสือ",
    agendaNo: "วาระที่",
    detail: "รายละเอียดมติ",
    files: "แนบไฟล์มติ",
    lawyer: "นิติกรที่แจ้งผล",
    notes: "หมายเหตุ",
  };
  const DATE_FIELDS = ["meetingDate", "noticeDate"];

  function labelOf(link, field) {
    return (link.labels && link.labels[field]) || FIELD_LABELS[field];
  }

  /* ------------------------------------------------------------ SWITCH
     ค่าเดียวกับที่ ecmis-shell.js สร้างไว้ (ถ้ามี) — ไม่ทับของเดิม */
  function normalizeRole(roleId) {
    return ROLE_ALIASES[roleId] || roleId || "";
  }

  function makeSwitch() {
    return {
      KEY: SWITCH_KEY,
      roles: SWITCH_ROLES.slice(),
      isOn: function () {
        try {
          const v = global.localStorage.getItem(SWITCH_KEY);
          return v === null || v === undefined ? true : v !== "0";
        } catch (e) {
          return true; /* private mode / ถูกบล็อก → ค่าตั้งต้น ON */
        }
      },
      setOn: function (on) {
        try {
          global.localStorage.setItem(SWITCH_KEY, on ? "1" : "0");
        } catch (e) { /* จำค่าไม่ได้ ใช้ค่าตั้งต้นต่อไป */ }
        try {
          if (typeof global.CustomEvent === "function" && global.document) {
            global.document.dispatchEvent(new global.CustomEvent("ecmis-act7-change", { detail: { on: !!on } }));
          }
        } catch (e) { /* ไม่มี DOM */ }
      },
      canSeeSwitch: function (roleId) {
        return SWITCH_ROLES.indexOf(normalizeRole(roleId)) >= 0;
      },
    };
  }
  const ECMIS_ACT7 = global.ECMIS_ACT7 || makeSwitch();
  global.ECMIS_ACT7 = ECMIS_ACT7;

  /* ------------------------------------------------------------ HELPERS */
  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /* วันที่ → ISO "YYYY-MM-DD" (รับ ISO / dd/mm/yyyy ทั้ง ค.ศ.-พ.ศ.)
     คืน "" ถ้าว่าง, null ถ้าอ่านไม่ออก */
  function toISODate(value) {
    const s = clean(value);
    if (!s) return "";
    let y;
    let m;
    let d;
    let hit = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (hit) {
      y = +hit[1]; m = +hit[2]; d = +hit[3];
    } else {
      hit = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
      if (!hit) return null;
      d = +hit[1]; m = +hit[2]; y = +hit[3];
    }
    if (y > 2400) y -= 543;
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
      return null;
    }
    return y + "-" + pad2(m) + "-" + pad2(d);
  }

  function optionOf(link, value) {
    return link.options.find((o) => o.value === value) || null;
  }

  function normalizeForm(form) {
    const f = form || {};
    return {
      decision: clean(f.decision),
      other: clean(f.other),
      meetingNo: clean(f.meetingNo),
      meetingDate: clean(f.meetingDate),
      noticeNo: clean(f.noticeNo),
      noticeDate: clean(f.noticeDate),
      agendaNo: clean(f.agendaNo),
      detail: clean(f.detail),
      fileNames: (f.fileNames || []).map(clean).filter(Boolean),
      lawyer: clean(f.lawyer),
      notes: clean(f.notes),
    };
  }

  /* ตรวจฟิลด์บังคับ + วันที่ — คืน {error} หรือ {form (วันที่เป็น ISO แล้ว)} */
  function validateForm(link, form) {
    const f = normalizeForm(form);
    const errors = [];
    const has = (field) =>
      field === "files" ? f.fileNames.length > 0 : !!f[field];
    link.required.forEach(function (field) {
      if (has(field)) return;
      if (field === "decision") errors.push("กรุณาเลือก" + labelOf(link, "decision"));
      else if (field === "files") errors.push("กรุณาแนบไฟล์มติอย่างน้อย 1 ไฟล์");
      else if (field === "lawyer") errors.push("กรุณาเลือกนิติกรที่ต้องการแจ้งผลมติ");
      else errors.push("กรุณาระบุ" + labelOf(link, field));
    });
    /* มติที่ส่งมาต้องอยู่ในตัวเลือกของจุดเชื่อมนั้น (ไม่ซ้ำข้อความ "ยังไม่เลือก" ด้านบน) */
    const decisionMsg = "กรุณาเลือก" + labelOf(link, "decision");
    if (f.decision && !optionOf(link, f.decision) && errors.indexOf(decisionMsg) < 0) {
      errors.push(decisionMsg);
    }
    /* "อื่นๆ" ที่ระบุข้อความเองมีเฉพาะ B1 (B2 ใช้ช่องรายละเอียดมติแทน) */
    if (link.id === "B1" && f.decision === "OTHER" && !f.other) errors.push("กรุณาระบุมติ (อื่นๆ)");
    DATE_FIELDS.forEach(function (field) {
      if (!f[field]) return;
      const iso = toISODate(f[field]);
      if (iso === null) errors.push(labelOf(link, field) + " ไม่ถูกต้อง");
      else f[field] = iso;
    });
    return errors.length ? { error: errors.join(" · ") } : { form: f };
  }

  function appendHistory(kase, linkId, decision, by, at) {
    const prev = (kase && kase.act7History) || [];
    return prev.concat([
      { at: at, by: by, linkId: linkId, decision: decision, bypass: true },
    ]);
  }

  /* ------------------------------------------- patch ของแต่ละจุดเชื่อม
     คืน {patch, advance, submit} — advance = {module, stepCode} ให้ผู้เรียก
     เดินขั้นด้วย Activity102/103.advance(patch); submit = ชื่อเมธอดของ Activity10
     ที่ต้องเรียกต่อจาก updateCase */
  const PATCH_BUILDERS = {
    B1: function (link, kase, f, by, outbound) {
      const A = global.Activity10;
      if (!A || typeof A.buildBoardResolutionPatch !== "function") {
        return { error: "ไม่พบตัวสร้างมติคณะกรรมการ (Activity10)" };
      }
      const res = A.buildBoardResolutionPatch({
        meetingNo: f.meetingNo,
        meetingDate: f.meetingDate,
        agendaNo: f.agendaNo,
        type: f.decision,
        other: f.other,
        text: f.detail,
        fileNames: f.fileNames,
      });
      if (!res.ok) return { error: res.errors.join(" · ") };
      const type = optionOf(link, f.decision);
      /* C3: signedExecutiveOrder ต้องสอดคล้องกับประเภทมติ — หน้า 13–16 ต่อท้าย
         "ให้ทำความเห็นแย้ง" เฉพาะเมื่อข้อความยังไม่มีคำว่า "ความเห็นแย้ง" */
      const signed =
        f.decision === "AGREE"
          ? "เห็นชอบให้ทำความเห็นแย้ง"
          : f.decision === "DISAGREE"
            ? "ไม่เห็นชอบ"
            : f.other || type.label;
      const resultFields = Object.assign({}, res.patch, {
        signedExecutiveOrder: signed,
        boardNoticeDocNo: f.noticeNo,
        boardNoticeDate: f.noticeDate,
      });
      /* P12 ขาออก (รองเลขาธิการเสนอ คกก.แล้วบันทึกผลทันที): เติมผลมติอย่างเดียว คงสถานะ
         RETURNED_FROM_EXEC/admin_legal — ธุรการรับที่หน้า 10 (เติมผลไว้แล้ว) และส่งต่อ ผอ.เอง */
      const patch = outbound
        ? resultFields
        : Object.assign({}, resultFields, {
            statusCode: "PENDING_DIRECTOR_RESOLUTION",
            status: "เสนอผลมติ ผอ.กองกฎหมาย",
            statusBadge: "bg-primary text-white",
            assignedRole: "dir_legal",
          });
      if (!patch.boardResolutionFiles.length && kase && kase.boardResolutionFiles) {
        patch.boardResolutionFiles = kase.boardResolutionFiles;
      }
      return {
        patch: patch,
        advance: null,
        submit: outbound ? null : "submitLegalAdminResolutionIntake",
      };
    },

    B2: function (link, kase, f) {
      const type = optionOf(link, f.decision);
      return {
        patch: {
          l2BoardApprovalRefRound2: f.noticeNo,
          l2BoardApprovalDateRound2: f.noticeDate,
          l2BoardResolutionRound2Text: f.detail || type.label,
          l2BoardResolutionRound2Type: type.value,
          l2BoardResolutionRound2TypeName: type.label,
          l2BoardRound2Files: f.fileNames,
          l2ReceiveNotesRound2: f.notes,
          assignedRole: "dir_legal",
        },
        advance: { module: "Activity102", stepCode: "L2-RECEIVE-BOARD-ROUND2" },
        submit: null,
      };
    },

    B3: function (link, kase, f, by, outbound) {
      return {
        patch: {
          l3BoardResolution: {
            meetingNo: f.meetingNo,
            meetingDate: f.meetingDate,
            agendaNo: f.agendaNo,
            result: optionOf(link, f.decision).label,
            text: f.detail,
            reportFileNames: f.fileNames,
          },
          l3ResolutionNotice: {
            docNo: f.noticeNo,
            docDate: f.noticeDate,
            recipients: [
              { role: "case_legal_officer", label: "นิติกร กลุ่มงานคดี", name: f.lawyer },
            ],
            notifiedBy: by,
            notifiedAt: "",
            notes: f.notes || "-",
            acknowledgedBy: null,
            acknowledgedAt: null,
          },
          l3ResolutionNoticeDocNo: f.noticeNo,
          assignedRole: "dir_legal",
        },
        advance: { module: "Activity103", stepCode: "L3-19" },
        submit: null,
        /* P12 ขาออก: ข้ามลายเซ็นธุรการ (เป็นผลจำลองจากกิจกรรมที่ 7 ตอนส่ง) —
           หน้า 10-3-11/12 รองรับกรณีไม่มีลายเซ็น L3-19 */
        skipSignature: !!outbound,
      };
    },

    B4: function (link, kase, f) {
      const type = optionOf(link, f.decision);
      return {
        patch: {
          l2AppealBoardResolutionType: type.value,
          l2AppealBoardResolutionTypeName: type.label,
          l2AppealBoardReplyDocNo: f.noticeNo,
          l2AppealBoardReplyDate: f.noticeDate,
          l2AppealBoardResolutionNotes: f.detail || "-",
          statusCode: "L2_PENDING_APPEAL_NOTICE_DRAFT",
          status: "เลขานุการกลุ่มงานบริหารติดตามคดีจัดทำหนังสือแจ้งผลมติ",
          statusBadge: "bg-primary text-white",
          assignedRole: "case_tracking_secretary",
        },
        advance: null,
        submit: null,
      };
    },

    B5: function (link, kase, f) {
      const next = BOARD_APPEAL_STATUS[f.decision];
      return {
        patch: {
          l9BoardNotes: f.detail || "-",
          l9BoardDecision: f.decision,
          l9BoardResolutionNo: f.meetingNo,
          l9BoardMeetingDate: f.meetingDate,
          statusCode: next.statusCode,
          status: next.status,
          statusBadge: "bg-primary text-white",
          assignedRole: "admin_legal",
        },
        advance: null,
        submit: null,
      };
    },
  };

  /* ตรวจฟอร์ม → คืน {error} หรือ {patch, advance, submit}
     patch รวมสถานะ/ผู้รับงานถัดไป และต่อท้าย act7History */
  function buildAct7Patch(linkId, kase, form, by, at, options) {
    const link = ACT7_LINKS[linkId];
    const builder = PATCH_BUILDERS[linkId];
    if (!link || !link.popup || !builder) {
      return { error: "จุดเชื่อมกิจกรรมที่ 7 ไม่รองรับการบันทึกผ่านป๊อปอัป: " + linkId };
    }
    const checked = validateForm(link, form);
    if (checked.error) return { error: checked.error };
    const when = at || new Date().toISOString();
    const outbound = !!(options && options.stage === "outbound");
    const built = builder(link, kase || {}, checked.form, by || "-", outbound);
    if (built.error) return { error: built.error };
    built.patch.act7History = appendHistory(kase, linkId, checked.form.decision, by || "-", when);
    return built;
  }

  /* เตือน (ไม่บล็อก) เมื่อมติที่บันทึกไม่สอดคล้องกับผลก่อนหน้าของเรื่องเดียวกัน */
  function act7MismatchWarning(linkId, kase, decision) {
    const link = ACT7_LINKS[linkId];
    const c = kase || {};
    if (!link || !decision) return "";
    const name = (value) => {
      const o = optionOf(link, value);
      return o ? o.label : value;
    };
    if (linkId === "B2" && c.l2ResolutionType && c.l2ResolutionType !== decision) {
      return (
        "มติที่บันทึก (" + name(decision) + ") ไม่ตรงกับผลการพิจารณาของคณะอนุกรรมการฯ (" +
        name(c.l2ResolutionType) + ")"
      );
    }
    if (linkId === "B4") {
      const expected = RULING_TO_BOARD[c.l2AppealRulingType];
      if (expected && expected !== decision) {
        return (
          "มติที่บันทึก (" + name(decision) + ") ไม่สอดคล้องกับผลวินิจฉัยอุทธรณ์ของคณะอนุกรรมการฯ (" +
          name(expected) + ")"
        );
      }
    }
    return "";
  }

  /* ---- สถานะที่รอกิจกรรมที่ 7 / ปุ่มใน inbox ---- */
  function act7WaitInfo(kase) {
    const code = kase && kase.statusCode;
    if (!code) return null;
    const id = Object.keys(ACT7_LINKS).find(function (k) {
      const l = ACT7_LINKS[k];
      return l.showWaiting && l.waitingStatuses.indexOf(code) >= 0;
    });
    if (!id) return null;
    const l = ACT7_LINKS[id];
    return { linkId: id, badge: l.waitBadge, senderRoles: l.senderRoles, requiresSwitch: l.requiresSwitch };
  }

  function isAct7Waiting(kase) {
    return !!act7WaitInfo(kase);
  }

  function act7CanAct(linkId, roleId, switchOn) {
    const l = ACT7_LINKS[linkId];
    if (!l) return false;
    if (l.senderRoles.indexOf(normalizeRole(roleId)) < 0) return false;
    return !l.requiresSwitch || !!switchOn;
  }

  /* ปุ่ม "ดำเนินการ" ของ inbox ที่แถวรอกิจกรรมที่ 7: {linkId, kind:"popup"|"page"} หรือ null */
  function act7InboxAction(kase, roleId, switchOn) {
    const info = act7WaitInfo(kase);
    if (!info || !act7CanAct(info.linkId, roleId, switchOn)) return null;
    return { linkId: info.linkId, kind: ACT7_LINKS[info.linkId].popup ? "popup" : "page" };
  }

  /* ---- สรุปผลที่บันทึกแล้ว (อ่านอย่างเดียว) ---- */
  function summaryRows(linkId, kase) {
    const c = kase || {};
    const date = (v) => (v ? String(v) : "-");
    if (linkId === "B1") {
      const t = ACT7_LINKS.B1.options.find((o) => o.value === c.boardResolutionType);
      return [
        ["ประเภทมติ", t ? (c.boardResolutionOther ? t.label + ": " + c.boardResolutionOther : t.label) : c.boardResolution],
        ["ครั้งที่ประชุม", c.boardMeetingNo],
        ["วันที่ประชุม", date(c.boardMeetingDate)],
        ["วาระที่", c.boardAgendaNo],
        ["เลขที่หนังสือแจ้งมติ", c.boardNoticeDocNo],
        ["วันที่หนังสือ", date(c.boardNoticeDate)],
        ["รายละเอียดมติ", c.boardResolutionDetail],
        ["ไฟล์มติ", (c.boardResolutionFiles || []).join(", ")],
      ];
    }
    if (linkId === "B3") {
      const r = c.l3BoardResolution || {};
      const n = c.l3ResolutionNotice || {};
      const lawyer = (n.recipients || []).find((x) => x.role === "case_legal_officer");
      return [
        ["ผลมติ", r.result],
        ["ครั้งที่ประชุม", r.meetingNo],
        ["วันที่ประชุม", date(r.meetingDate)],
        ["วาระที่", r.agendaNo],
        ["สาระสำคัญของมติ", r.text],
        ["ไฟล์มติ", (r.reportFileNames || []).join(", ")],
        ["เลขที่หนังสือแจ้งผล", n.docNo],
        ["วันที่หนังสือ", date(n.docDate)],
        ["แจ้งถึงนิติกร", lawyer ? lawyer.name : ""],
      ];
    }
    if (linkId === "B5") {
      const t = ACT7_LINKS.B5.options.find((o) => o.value === c.l9BoardDecision);
      return [
        ["มติคณะกรรมการ", t ? t.label : ""],
        ["เลขที่มติ", c.l9BoardResolutionNo],
        ["วันที่ประชุม", date(c.l9BoardMeetingDate)],
        ["รายละเอียดมติ", c.l9BoardNotes],
      ];
    }
    return [];
  }

  function escHtml(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function hasSavedResult(linkId, kase) {
    const c = kase || {};
    if (linkId === "B1") return !!(c.boardResolutionType && c.boardMeetingNo);
    if (linkId === "B3") return !!c.l3BoardResolution;
    if (linkId === "B5") return !!c.l9BoardDecision;
    return false;
  }

  function summaryHtml(linkId, kase) {
    if (!hasSavedResult(linkId, kase)) {
      return '<div class="read-box" style="color:#b45309">ยังไม่ได้บันทึกผลพิจารณาจากกิจกรรมที่ 7</div>';
    }
    return summaryRows(linkId, kase)
      .map(function (row) {
        return (
          '<div class="form-group" style="margin-bottom:10px"><label>' + escHtml(row[0]) +
          '</label><div class="read-box">' + escHtml(row[1] || "-") + "</div></div>"
        );
      })
      .join("");
  }

  /* ---- P12: ป๊อปอัปหลังขั้นตอนขาออกที่ส่งเรื่องเข้ากิจกรรมที่ 7 ----
     เปิดเฉพาะจุดเชื่อมที่ตั้ง promptAfterOutbound (B1–B5) และสวิตช์ ON; B6/B7 (ศาล) ไม่เปิด */
  function shouldPromptAfterOutbound(linkId) {
    const l = ACT7_LINKS[linkId];
    return !!(l && l.popup && l.promptAfterOutbound && ECMIS_ACT7.isOn());
  }

  /* สถานะหลังขาออก: later = ค้างรอกิจกรรมที่ 7 (waitingStatuses[0]), now = สถานะขาเข้าหลังบันทึกผลทันที
     (B1 คงสถานะเดิมแต่ธุรการรับที่หน้า 10 พร้อมผลที่เติมแล้ว) */
  const OUTBOUND_NOW_STATUS = {
    B1: "RETURNED_FROM_EXEC",
    B2: "L2_PENDING_DIRLEGAL_BOARD_ACK",
    B3: "L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN",
    B4: "L2_PENDING_APPEAL_NOTICE_DRAFT",
    B5: BOARD_APPEAL_STATUS.APPEAL.statusCode,
  };
  function act7OutboundStages(linkId) {
    const l = ACT7_LINKS[linkId];
    if (!l || !l.promptAfterOutbound) return null;
    return { later: l.waitingStatuses[0], now: OUTBOUND_NOW_STATUS[linkId] };
  }

  global.ACT7_LINKS = ACT7_LINKS;
  global.ECMIS_ACT7_HELPERS = {
    toISODate: toISODate,
    buildAct7Patch: buildAct7Patch,
    act7MismatchWarning: act7MismatchWarning,
    isAct7Waiting: isAct7Waiting,
    act7WaitInfo: act7WaitInfo,
    act7CanAct: act7CanAct,
    act7InboxAction: act7InboxAction,
    summaryRows: summaryRows,
    summaryHtml: summaryHtml,
    hasSavedResult: hasSavedResult,
    shouldPromptAfterOutbound: shouldPromptAfterOutbound,
    act7OutboundStages: act7OutboundStages,
  };

  /* ====================================================================
     ส่วนหน้าจอ (ป๊อปอัป Swal) — ต้องมี document + Swal; ไม่ถูกทดสอบด้วย node
     ==================================================================== */
  if (!global.document) return;

  function currentRoleId() {
    try {
      return normalizeRole(global.sessionStorage.getItem("ecmis_role") || "admin_legal");
    } catch (e) {
      return "admin_legal";
    }
  }

  function signerOf(roleId) {
    const m = global.ECMIS103 || global.ECMIS102;
    return m && typeof m.signerLabel === "function" ? m.signerLabel(roleId) : roleId;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function findCase(caseId) {
    const A = global.Activity10;
    if (!A) return null;
    return typeof A.findCaseById === "function"
      ? A.findCaseById(caseId)
      : (A.getCases() || []).find(function (c) { return c.id === caseId; }) || null;
  }

  function defaultsFor(linkId, kase, opts) {
    const c = kase || {};
    const d = { noticeDate: todayISO() };
    if (linkId === "B1") {
      d.decision = c.boardResolutionType || "AGREE";
      d.other = c.boardResolutionOther || "";
      d.meetingNo = c.boardMeetingNo || "";
      d.meetingDate = toISODate(c.boardMeetingDate) || "";
      d.agendaNo = c.boardAgendaNo || "";
      d.detail = c.boardResolutionDetail || "";
      d.noticeNo = c.boardNoticeDocNo || "";
      d.notes =
        "ได้รับผลมติการประชุมคณะกรรมการ ป.ป.ท. เรียบร้อยแล้ว จึงกราบเรียนเสนอ ผอ.กองกฎหมาย " +
        "เพื่อโปรดพิจารณาและมีคำสั่งการมอบหมายกลุ่มงานความเห็นแย้งดำเนินการตามมติต่อไป";
    } else if (linkId === "B2") {
      d.decision = c.l2ResolutionType || "";
    } else if (linkId === "B3") {
      const r = c.l3IncomingBoardReport || {};
      d.decision = "AUTHORIZE";
      d.meetingNo = r.meetingNo || "";
      d.meetingDate = toISODate(r.meetingDate) || "";
      d.agendaNo = r.agendaNo || "";
      d.detail = r.text || "";
      d.noticeNo = c.l3ResolutionNoticeDocNo || "";
      d.lawyer = c.officer || "";
      d.presetFiles = (r.reportFileNames || []).slice();
    } else if (linkId === "B4") {
      d.decision = RULING_TO_BOARD[c.l2AppealRulingType] || "";
    }
    return Object.assign(d, (opts && opts.defaults) || {});
  }

  function fieldRow(label, required, control) {
    return (
      '<div class="act7-row"><label>' + escHtml(label) +
      (required ? ' <span style="color:#dc2626">*</span>' : "") + "</label>" + control + "</div>"
    );
  }

  const INPUT_STYLE =
    "width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font:inherit;box-sizing:border-box";

  function popupHtml(link, d, opts) {
    const isReq = (f) => link.required.indexOf(f) >= 0;
    const isShown = (f) => isReq(f) || link.show.indexOf(f) >= 0;
    const input = (id, type, value, extra) =>
      '<input id="act7_' + id + '" type="' + type + '" value="' + escHtml(value || "") + '" style="' +
      INPUT_STYLE + '" ' + (extra || "") + " />";
    const textarea = (id, value, rows) =>
      '<textarea id="act7_' + id + '" rows="' + rows + '" style="' + INPUT_STYLE + '">' +
      escHtml(value || "") + "</textarea>";
    const rows = [];

    rows.push(
      fieldRow(
        labelOf(link, "decision"), true,
        '<select id="act7_decision" style="' + INPUT_STYLE + '"><option value="">-- เลือก --</option>' +
        link.options.map(function (o) {
          return '<option value="' + o.value + '"' + (o.value === d.decision ? " selected" : "") + ">" +
            escHtml(o.label) + "</option>";
        }).join("") + "</select>" +
        (link.id === "B1"
          ? '<div id="act7_otherWrap" style="display:' + (d.decision === "OTHER" ? "block" : "none") +
            ';margin-top:6px">' + input("other", "text", d.other, 'placeholder="ระบุมติ (อื่นๆ)..."') + "</div>"
          : "") +
        '<div id="act7_warn" style="display:none;margin-top:6px;padding:6px 10px;border-radius:6px;' +
        'background:#fef3c7;color:#92400e;font-size:0.85em"></div>',
      ),
    );
    const simple = [
      ["meetingNo", "text", ""], ["meetingDate", "date", ""],
      ["noticeNo", "text", ""], ["noticeDate", "date", ""], ["agendaNo", "text", ""],
    ];
    simple.forEach(function (s) {
      if (isShown(s[0])) {
        rows.push(fieldRow(labelOf(link, s[0]), isReq(s[0]), input(s[0], s[1], d[s[0]])));
      }
    });
    if (isShown("detail")) {
      rows.push(fieldRow(labelOf(link, "detail"), isReq("detail"), textarea("detail", d.detail, 3)));
    }
    if (isShown("files")) {
      const preset = (d.presetFiles || []).length
        ? '<div style="font-size:0.8em;color:#64748b;margin-top:4px">ไฟล์ที่ได้รับแล้ว: ' +
          escHtml(d.presetFiles.join(", ")) + "</div>"
        : "";
      rows.push(
        fieldRow(
          labelOf(link, "files"), isReq("files"),
          '<input id="act7_files" type="file" multiple accept="' + (global.ECMIS_DOC_ACCEPT || DEFAULT_ACCEPT) +
          '" style="' + INPUT_STYLE + '" />' + preset,
        ),
      );
    }
    if (isShown("lawyer")) {
      const A = global.Activity10;
      const names = ((opts && opts.lawyers) || (A && A.CASE_LAWYERS) || []).filter(function (n, i, arr) {
        return n && arr.indexOf(n) === i;
      });
      if (d.lawyer && names.indexOf(d.lawyer) < 0) names.unshift(d.lawyer);
      rows.push(
        fieldRow(
          labelOf(link, "lawyer"), isReq("lawyer"),
          '<select id="act7_lawyer" style="' + INPUT_STYLE + '"><option value="">-- เลือกนิติกร --</option>' +
          names.map(function (n) {
            return '<option value="' + escHtml(n) + '"' + (n === d.lawyer ? " selected" : "") + ">" +
              escHtml(n) + "</option>";
          }).join("") + "</select>",
        ),
      );
    }
    if (isShown("notes")) {
      rows.push(fieldRow(labelOf(link, "notes"), isReq("notes"), textarea("notes", d.notes, 2)));
    }
    return '<div class="act7-form" style="text-align:left;font-size:0.92em">' + rows.join("") + "</div>";
  }

  function ensureStyle() {
    if (document.getElementById("act7-style")) return;
    const st = document.createElement("style");
    st.id = "act7-style";
    st.textContent =
      ".act7-row{margin-bottom:10px}.act7-row label{display:block;font-weight:600;margin-bottom:4px;color:#334155}" +
      ".act7-tag{display:inline-block;margin-left:8px;padding:2px 10px;border-radius:999px;background:#e2e8f0;" +
      "color:#475569;font-size:0.5em;font-weight:600;vertical-align:middle}";
    document.head.appendChild(st);
  }

  function readForm(link) {
    const v = (id) => {
      const el = document.getElementById("act7_" + id);
      return el ? el.value : "";
    };
    const filesEl = document.getElementById("act7_files");
    const names = filesEl && filesEl.files ? Array.from(filesEl.files).map(function (f) { return f.name; }) : [];
    return {
      decision: v("decision"), other: v("other"), meetingNo: v("meetingNo"), meetingDate: v("meetingDate"),
      noticeNo: v("noticeNo"), noticeDate: v("noticeDate"), agendaNo: v("agendaNo"), detail: v("detail"),
      lawyer: v("lawyer"), notes: v("notes"), fileNames: names,
    };
  }

  /* เขียนผลลง case: เดินขั้นด้วย advance (B2/B3) หรืออัปเดตตรง (B1/B4/B5) */
  function applyResult(caseId, linkId, res, form, opts) {
    const A = global.Activity10;
    const link = ACT7_LINKS[linkId];
    const write = function () {
      let updated;
      if (res.advance) {
        const mod = global[res.advance.module];
        const extra = {};
        if (linkId === "B2" && global.ECMIS102) extra.officer = global.ECMIS102.signerLabel("dir_legal");
        if (linkId === "B3" && global.ECMIS103) {
          extra.l3ResolutionNotice = Object.assign({}, res.patch.l3ResolutionNotice, {
            notifiedAt: global.ECMIS103.formatThaiDateTime(new Date()),
          });
        }
        updated = mod.advance(caseId, res.advance.stepCode, Object.assign({}, res.patch, extra));
      } else {
        updated = A.updateCase(caseId, res.patch);
        if (res.submit && typeof A[res.submit] === "function") {
          updated = A[res.submit](caseId, form.notes || "") || updated;
        }
      }
      const saved = opts.afterSave || opts.onSaved;
      if (typeof saved === "function") return saved(updated, link);
      global.Swal.fire({
        icon: "success", title: "บันทึกผลพิจารณาจากกิจกรรมที่ 7 แล้ว", timer: 1600, showConfirmButton: false,
      }).then(function () { global.location.href = INBOX_PAGE; });
      return updated;
    };
    const sig =
      linkId === "B3" && !res.skipSignature && global.ECMIS103 && global.ECMIS103.openSignatureModal;
    if (sig) {
      global.ECMIS103.openSignatureModal(
        {
          title: "ลงนามบันทึกรับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท.",
          signer: global.ECMIS103.signerLabel("admin_legal"),
          certId: "PACC-ADMINLEGAL-2569-103",
        },
        function (image) {
          global.Activity103.sign(caseId, res.advance.stepCode, image);
          write();
        },
      );
      return;
    }
    write();
  }

  /* เปิดป๊อปอัปผลพิจารณาจากกิจกรรมที่ 7
     opts: {onSaved|afterSave(updated, link), lawyers, defaults}
           P12 หลังขั้นตอนขาออก: allowLater:true → ปุ่ม [บันทึกผลทันที] / [ภายหลัง (ค้างรอกิจกรรมที่ 7)]
           (ไม่มีปุ่มยกเลิก) afterLater() เรียกเมื่อเลือกภายหลัง; stage:"outbound" = patch ขาออก */
  function openAct7DecisionPopup(caseId, linkId, options) {
    const opts = options || {};
    const later = !!opts.allowLater;
    const outboundOpts = opts.stage === "outbound" ? { stage: "outbound" } : undefined;
    const link = ACT7_LINKS[linkId];
    const Swal = global.Swal;
    if (!link || !link.popup || !Swal) return null;
    const kase = findCase(caseId);
    if (!kase) {
      Swal.fire({ icon: "warning", title: "ไม่พบสำนวน", text: String(caseId || "") });
      return null;
    }
    ensureStyle();
    const d = defaultsFor(linkId, kase, opts);
    const by = signerOf(currentRoleId());

    return Swal.fire({
      title: 'ผลพิจารณาจากกิจกรรมที่ 7 (คณะกรรมการ ป.ป.ท.)<span class="act7-tag">บันทึกแทนกิจกรรมที่ 7</span>',
      html:
        '<div style="text-align:left;margin-bottom:10px;font-size:0.85em;color:#64748b">' +
        escHtml(link.title) + " — สำนวน " + escHtml(kase.id) + "</div>" +
        (later
          ? '<div style="text-align:left;margin-bottom:10px;padding:8px 10px;border-radius:6px;background:#eff6ff;' +
            'color:#1e3a8a;font-size:0.85em">ส่งเรื่องเข้ากิจกรรมที่ 7 แล้ว — จำลองผลพิจารณาของคณะกรรมการ ป.ป.ท. ' +
            "ตอบกลับทันที หรือเลือก “ภายหลัง” ให้สำนวนค้างรอกิจกรรมที่ 7</div>"
          : "") +
        popupHtml(link, d, opts),
      width: 640,
      showCancelButton: !later,
      showDenyButton: later,
      allowOutsideClick: !later,
      allowEscapeKey: !later,
      confirmButtonText: later ? "บันทึกผลทันที" : "บันทึกผล",
      denyButtonText: "ภายหลัง (ค้างรอกิจกรรมที่ 7)",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1e3a8a",
      denyButtonColor: "#64748b",
      cancelButtonColor: "#64748b",
      focusConfirm: false,
      didOpen: function () {
        const sel = document.getElementById("act7_decision");
        const warn = document.getElementById("act7_warn");
        const refresh = function () {
          const other = document.getElementById("act7_otherWrap");
          if (other) other.style.display = linkId === "B1" && sel.value === "OTHER" ? "block" : "none";
          const msg = act7MismatchWarning(linkId, kase, sel.value);
          warn.style.display = msg ? "block" : "none";
          warn.textContent = msg ? "⚠ " + msg : "";
        };
        sel.addEventListener("change", refresh);
        refresh();
      },
      preConfirm: function () {
        const form = readForm(link);
        const files = form.fileNames.length ? form.fileNames : d.presetFiles || [];
        const res = buildAct7Patch(
          linkId, kase, Object.assign({}, form, { fileNames: files }), by, new Date().toISOString(), outboundOpts,
        );
        if (res.error) {
          Swal.showValidationMessage(res.error);
          return false;
        }
        return { form: form, res: res };
      },
    }).then(function (r) {
      if (later && r.isDenied) return typeof opts.afterLater === "function" ? opts.afterLater() : goInboxLater();
      if (!r.isConfirmed || !r.value) return null;
      const warning = act7MismatchWarning(linkId, kase, r.value.form.decision);
      const proceed = function () { return applyResult(caseId, linkId, r.value.res, r.value.form, opts); };
      if (!warning) return proceed();
      return Swal.fire({
        icon: "warning",
        title: "มติไม่สอดคล้องกับผลก่อนหน้า",
        text: warning + " — ยืนยันบันทึกต่อหรือไม่",
        showCancelButton: true,
        confirmButtonText: "ยืนยันบันทึก",
        cancelButtonText: "กลับไปแก้ไข",
        confirmButtonColor: "#d97706",
      }).then(function (c) {
        if (c.isConfirmed) return proceed();
        /* โหมดขาออกไม่มีปุ่มยกเลิก → กลับไปแก้ไขในป๊อปอัปเดิม (คงค่าที่กรอกไว้) */
        if (!later) return null;
        const keep = Object.assign({}, r.value.form, { presetFiles: r.value.form.fileNames });
        return openAct7DecisionPopup(caseId, linkId, Object.assign({}, opts, { defaults: keep }));
      });
    });
  }

  function goInboxLater() {
    return global.Swal.fire({
      icon: "info", title: "ค้างรอกิจกรรมที่ 7", text: "สำนวนอยู่ระหว่างรอผลพิจารณาจากกิจกรรมที่ 7",
      timer: 1600, showConfirmButton: false,
    }).then(function () { global.location.href = INBOX_PAGE; });
  }

  /* P12: เรียกหลังขั้นตอนขาออกที่ส่งเรื่องเข้ากิจกรรมที่ 7 — เปิดป๊อปอัปเมื่อสวิตช์ ON
     คืน true = ป๊อปอัปรับช่วงต่อ (บันทึกทันที → ข้อความสำเร็จ + คิวงาน; ภายหลัง → onLater);
     false = ไม่เปิด (สวิตช์ OFF/ไม่รองรับ) ผู้เรียกทำขั้นตอนเดิมต่อ */
  function promptAfterOutbound(caseId, linkId, onLater, extra) {
    if (!shouldPromptAfterOutbound(linkId) || !global.Swal) return false;
    const later = typeof onLater === "function" ? onLater : goInboxLater;
    const shown = openAct7DecisionPopup(
      caseId, linkId,
      Object.assign({ allowLater: true, stage: "outbound", afterLater: later }, extra || {}),
    );
    if (!shown) later();
    return true;
  }

  global.openAct7DecisionPopup = openAct7DecisionPopup;
  global.promptAct7AfterOutbound = promptAfterOutbound;
})(window);
