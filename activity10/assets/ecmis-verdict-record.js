/* ECMIS 10.1 บันทึกผลคำพิพากษา — ตรรกะข้อมูล (pure, ทดสอบใน node ได้)
   1 สำนวน (case) มี verdictRecords[] = บันทึกรายชั้นศาล (FIRST / APPEAL / SUPREME) = 1 แถวใน Excel
   ผู้ใช้กรอกเฉพาะ 3 ส่วน: การจัดประเภท (X Y Z AA AH) · ผลคำพิพากษา (AI–AO + คดีถึงที่สุด + ไฟล์)
   · การลงโทษจริง (AP–AW); ช่องอื่นของ Excel/Word ดึงจากสำนวนเดิม (PACC) / กิจกรรม 7 / ข้อมูลในระบบ
   บันทึกแล้วจะ upsert judgments[] ชั้นเดียวกันด้วย เพื่อให้แผงคำพิพากษา สารบบ และรายงานเดิมใช้ข้อมูลชุดเดียวกัน
   ต้องโหลดหลัง ecmis-verdict-lists.js; ฟังก์ชันที่ต้องใช้ข้อมูลภายนอกรับผ่าน deps
   deps = { paccDb, act7, formatDate(iso), unitOf(officer), titleOf(name) } */
(function (global) {
  "use strict";

  const L = () => global.ECMISVerdictLists;
  const clean = (v) => String(v == null ? "" : v).trim();

  /* ช่องที่ผู้ใช้กรอก (key → คอลัมน์ Excel) */
  const INPUT_FIELDS = [
    { key: "statCountAs", col: "X", label: "นับสถิติเป็น" },
    { key: "caseNatureNo", col: "Y", label: "ประเภท/ลักษณะคดี" },
    { key: "caseNatureSub", col: "Y", label: "หัวข้อย่อย" },
    { key: "caseNatureOther", col: "Y", label: "ระบุ (อื่นๆ)" },
    { key: "trackingGroup", col: "Z", label: "กลุ่มงานบริหารติดตามรับเรื่อง" },
    { key: "verdictType", col: "AA", label: "ประเภทคำพิพากษา" },
    { key: "verdictStage", col: "AH", label: "สถานะชั้นคำพิพากษา (fz)" },
    { key: "resultDetail", col: "AI", label: "รายละเอียด" },
    { key: "offenseLaw", col: "AJ", label: "ความผิดตามกฎหมาย/ระเบียบ" },
    { key: "offenseLawOther", col: "AJ", label: "ระบุ (อื่นๆ)" },
    { key: "jailMonths", col: "AK", label: "จำคุก (เดือน)", num: true },
    { key: "jailYears", col: "AL", label: "จำคุก (ปี)", num: true },
    { key: "fine", col: "AM", label: "ปรับ (บาท)", num: true },
    { key: "restitutionType", col: "AN", label: "ชดใช้/คืน" },
    { key: "restitutionAmount", col: "AN", label: "จำนวนเงิน (บาท)", num: true },
    { key: "refundUnit", col: "AO", label: "หน่วยงานที่รับเงินคืน" },
    { key: "isFinal", col: "", label: "คดีถึงที่สุด", bool: true },
    { key: "finalLetterNo", col: "", label: "เลขหนังสือคดีถึงที่สุด" },
    { key: "actualJailMonths", col: "AP", label: "จำคุกจริง (เดือน)", num: true },
    { key: "actualJailYears", col: "AQ", label: "จำคุกจริง (ปี)", num: true },
    { key: "actualFine", col: "AR", label: "ปรับจริง (บาท)", num: true },
    { key: "suspendedYears", col: "AS", label: "รอลงโทษ (ปี)", num: true },
    { key: "probationYears", col: "AT", label: "รายงานตัวผู้คุมประพฤติ (ปี)", num: true },
    { key: "communityHours", col: "AU", label: "ทำสาธารณประโยชน์ (ชม.)", num: true },
    { key: "actualOther", col: "AV", label: "อื่นๆ" },
    { key: "damageValue", col: "AW", label: "มูลค่าความเสียหาย (บาท)", num: true },
  ];

  /* ---------- helpers ---------- */
  function levelName(code) {
    const lv = L().LEVELS.find((l) => l.code === code);
    return lv ? lv.name : "";
  }
  /* in_prosecutorLevel ของหน้า 02: 1 ชั้นต้น / 2 อุทธรณ์ / 3 ฎีกา / 0, 9 = ให้ผู้ใช้เลือก */
  function levelFromProsecutorLevel(v) {
    return { 1: "FIRST", 2: "APPEAL", 3: "SUPREME" }[String(v)] || "";
  }
  /* แสดงฟอร์มเมื่อกรณีความเห็น/คำสั่งพนักงานอัยการ = 3–9 (ไม่รวม 1 ไม่ฟ้อง / 2 ถอนฟ้อง) */
  function appliesToProsecutorType(no) {
    const n = Number(no);
    return n >= 3 && n <= 9;
  }
  function toNumber(v) {
    const s = clean(v).replace(/,/g, "");
    if (s === "") return "";
    const n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function money(v) {
    if (v === "" || v == null || isNaN(v)) return "";
    return Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function stripNo(text) {
    return clean(text).replace(/^\d+(\.\d+)*\.?\s*/, "");
  }

  function emptyFields() {
    const out = {};
    INPUT_FIELDS.forEach((f) => {
      out[f.key] = f.bool ? false : "";
    });
    return out;
  }

  /* ทำความสะอาดค่าที่กรอก — คืน { fields, errors[] }; ตัวเลขติดลบ/ไม่ใช่ตัวเลข = error */
  function normalizeFields(input) {
    const src = input || {};
    const fields = emptyFields();
    const errors = [];
    INPUT_FIELDS.forEach((f) => {
      if (f.bool) {
        fields[f.key] = !!src[f.key];
        return;
      }
      if (!f.num) {
        fields[f.key] = clean(src[f.key]);
        return;
      }
      const n = toNumber(src[f.key]);
      if (n === "") return;
      if (isNaN(n) || n < 0) errors.push(f.label + " ต้องเป็นตัวเลขไม่ติดลบ");
      else fields[f.key] = n;
    });
    if (!fields.isFinal) fields.finalLetterNo = "";
    return { fields: fields, errors: errors };
  }

  /* status "done" ต้องมีประเภทคำพิพากษาและสถานะชั้นคำพิพากษา; "draft" ไม่บังคับ */
  function validate(level, input, status) {
    const errors = [];
    if (!levelName(level)) errors.push("กรุณาเลือกชั้นศาล");
    const n = normalizeFields(input);
    errors.push.apply(errors, n.errors);
    if (status === "done") {
      if (!n.fields.verdictType) errors.push("กรุณาเลือกประเภทคำพิพากษา");
      if (!n.fields.verdictStage) errors.push("กรุณาเลือกสถานะชั้นคำพิพากษา");
    }
    return errors;
  }

  function levelOrder(code) {
    const i = L().LEVELS.findIndex((l) => l.code === code);
    return i < 0 ? 99 : i;
  }
  function getRecords(kase) {
    return ((kase && kase.verdictRecords) || []).slice().sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
  }
  function getRecord(kase, level) {
    return getRecords(kase).find((r) => r.level === level) || null;
  }
  /* judgment ที่ฟอร์มนี้ดูแลของชั้นนั้น: รายการที่ฟอร์มเคยเขียน (verdictRecordLevel) ก่อน
     ถ้ายังไม่มี และชั้นนั้นมีรายการจาก popup เดิมเพียงรายการเดียว → รับรายการนั้นมาดูแลต่อ
     มีหลายรายการ → -1 (เพิ่มรายการใหม่ ไม่เขียนทับรายการเดิมที่ไม่รู้ว่าเป็นรายการไหน) */
  function judgmentIndexForLevel(kase, level) {
    const list = (kase && kase.judgments) || [];
    const owned = list.findIndex((j) => j.verdictRecordLevel === level);
    if (owned >= 0) return owned;
    const legacy = list.map((j, i) => (j.level === level && !j.verdictRecordLevel ? i : -1)).filter((i) => i >= 0);
    return legacy.length === 1 ? legacy[0] : -1;
  }

  /* ข้อความผลสำหรับ judgments[].result (สารบบ/รายงานเดิมใช้ช่องนี้) — ไม่มีประเภท/สถานะ = คงข้อความเดิม */
  function judgmentResultText(fields, prevResult) {
    const type = L().VERDICT_TYPES.find((t) => t.code === fields.verdictType);
    return stripNo(fields.verdictStage) || (type ? type.name : "") || clean(prevResult);
  }

  /* ตัวสร้าง patch (pure, immutable) — upsert verdictRecords[level] และ judgments[] ชั้นเดียวกัน
     opts = { status, by, when, court:{name,blackNo,redNo,date}, fileNames[] }; ไม่ผ่าน → null */
  function buildRecordPatch(kase, level, input, opts) {
    const o = opts || {};
    const prevRec = getRecord(kase, level);
    const asked = o.status === "done" ? "done" : "draft";
    if (validate(level, input, asked).length) return null;
    /* บันทึกร่างทับบันทึกที่ "บันทึกแล้ว" และยังกรอกครบ → คงสถานะบันทึกแล้ว ไม่ลดเป็นร่าง */
    const keepDone = asked === "draft" && prevRec && prevRec.status === "done" && !validate(level, input, "done").length;
    const status = keepDone ? "done" : asked;
    const fields = normalizeFields(input).fields;
    const when = o.when || new Date().toISOString();
    const c = o.court || {};
    const court = { name: clean(c.name), blackNo: clean(c.blackNo), redNo: clean(c.redNo), date: clean(c.date) };
    const fileNames = (o.fileNames || (prevRec && prevRec.fileNames) || []).map(clean).filter(Boolean);
    const record = {
      level: level,
      status: status,
      fields: fields,
      court: court,
      fileNames: fileNames,
      createdAt: (prevRec && prevRec.createdAt) || when,
      updatedBy: o.by || "",
      updatedAt: when,
    };
    const records = ((kase && kase.verdictRecords) || []).filter((r) => r.level !== level).concat([record]);

    const judgments = ((kase && kase.judgments) || []).slice();
    const idx = judgmentIndexForLevel(kase, level);
    const prev = idx >= 0 ? judgments[idx] : {};
    const result = judgmentResultText(fields, prev.result);
    if (result) {
      const merged = Object.assign({}, prev, {
        level: level,
        issuer: court.name || prev.issuer || "",
        blackNo: court.blackNo || prev.blackNo || "",
        redNo: court.redNo || prev.redNo || "",
        date: court.date || prev.date || "",
        result: result,
        summary: fields.resultDetail || prev.summary || "",
        isFinal: fields.isFinal,
        fileNames: fileNames.length ? fileNames : prev.fileNames || [],
        recordedBy: prev.recordedBy || o.by || "",
        recordedAt: prev.recordedAt || when,
        verdictRecordLevel: level,
      });
      if (idx >= 0) judgments[idx] = merged;
      else judgments.push(merged);
    }
    return { verdictRecords: records, judgments: judgments };
  }

  /* ค่าเริ่มต้นของฟอร์ม — บันทึกเดิม หรือ judgments[] ชั้นเดียวกัน (popup เดิม) หรือเลขคดีจากหน้า 02 */
  function initialState(kase, level) {
    const rec = getRecord(kase, level);
    if (rec)
      return {
        fields: Object.assign(emptyFields(), rec.fields),
        court: Object.assign({ name: "", blackNo: "", redNo: "", date: "" }, rec.court),
        fileNames: rec.fileNames || [],
        status: rec.status,
      };
    const k = kase || {};
    const idx = judgmentIndexForLevel(k, level);
    const j = idx >= 0 ? k.judgments[idx] : null;
    const useCaseCourt = !j && !(k.verdictRecords || []).length;
    const fields = emptyFields();
    if (j) {
      fields.resultDetail = clean(j.summary || j.result);
      fields.isFinal = !!j.isFinal;
    }
    return {
      fields: fields,
      court: {
        name: clean(j ? j.issuer : useCaseCourt ? k.courtName : ""),
        blackNo: clean(j ? j.blackNo : useCaseCourt ? k.courtBlackNo : ""),
        redNo: clean(j ? j.redNo : useCaseCourt ? k.courtRedNo : ""),
        date: clean(j ? j.date : ""),
      },
      fileNames: j ? j.fileNames || [] : [],
      status: "",
    };
  }

  /* ---------- ข้อมูลที่ไม่ได้กรอก (สำนวนเดิม / กิจกรรม 7 / ระบบ) ---------- */
  /* สำนวนเดิม: ผูกไว้ (paccSourceId) มาก่อน แล้วค่อยจับคู่จากเลขสำนวน (legacyId) ของเคสเดโมเดิม */
  function paccOf(kase, db) {
    if (!kase) return null;
    const list = db || [];
    return (
      (kase.paccSourceId && list.find((p) => p.id === kase.paccSourceId)) ||
      list.find((p) => p.id === kase.id || p.legacyId === kase.id) ||
      null
    );
  }
  function joinList(list) {
    return (Array.isArray(list) ? list : []).map(clean).filter(Boolean).join(", ");
  }
  function offenseBasesText(kase) {
    return ((kase && kase.offenseBases) || [])
      .map((b) => [b.law === "OTHER" ? b.lawOther : b.law, b.section ? "มาตรา " + b.section : ""].map(clean).filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");
  }
  function latestRecommendation(kase) {
    const list = ((kase && kase.judgmentAnalyses) || []).filter((a) => clean(a.recommendation));
    return list.length ? list[list.length - 1].recommendation : "";
  }

  function buildContext(kase, deps) {
    const d = deps || {};
    const fmt = d.formatDate || ((x) => x || "");
    const k = kase || {};
    const pacc = paccOf(k, d.paccDb) || {};
    const act7 = (d.act7 || {})[pacc.id] || {};
    const ci = pacc.complaintIntake || {};
    const outcomes = act7.boardOutcomes || {};
    return {
      paccId: pacc.id || "",
      unit: clean(pacc.responsibleUnit) || (d.unitOf ? d.unitOf(k.officer) : ""),
      officer: clean(pacc.responsibleOfficer || ci.mainOfficer),
      paccBlackNo: clean(pacc.blackNo) === "-" ? "" : clean(pacc.blackNo),
      accuser: clean(k.accuser) || clean(pacc.accuser),
      accused: clean(k.accused) || clean(pacc.accused),
      allegation: clean(ci.allegation) || clean(pacc.title) || clean(k.title),
      offenseType: clean(act7.offenseType),
      ministry: clean(act7.ministry),
      department: clean(act7.department),
      agency: clean(act7.agency),
      place: [clean(ci.incidentPlace), clean(ci.province)].filter(Boolean).join(" "),
      boardMeetingNo: clean(act7.boardMeetingNo),
      boardMeetingDate: act7.boardMeetingDate ? fmt(act7.boardMeetingDate) : "",
      boardAgendaNo: clean(act7.boardAgendaNo),
      boardOutcomes: L().BOARD_OUTCOMES.map((b) => !!outcomes[b.key]),
      plaintiff: joinList(k.plaintiffs) || clean(pacc.plaintiff),
      defendant: joinList(k.defendants) || clean(pacc.defendant) || clean(k.accused),
      prosecutorStatus: stripNo(k.oagVerdictCaseTypeName || k.prosecutorCaseTypeName || ""),
      inquiryOrderNo: clean(act7.inquiryOrderNo),
      inquiryOrderDate: act7.inquiryOrderDate ? fmt(act7.inquiryOrderDate) : "",
      subcommitteeCriminal: clean(act7.subcommitteeCriminal),
      subcommitteeDisciplinary: clean(act7.subcommitteeDisciplinary),
      prosecutedOffenses: clean(act7.prosecutedOffenses) || offenseBasesText(k),
      recommendation: clean(latestRecommendation(k)),
    };
  }

  /* ---------- ค่าที่แสดงของช่องกรอก ---------- */
  function caseNatureText(f) {
    const item = L().CASE_NATURES.find((n) => n.no === f.caseNatureNo);
    if (!item) return "";
    const noOther = (s) => s.replace(/\s*\(โปรดระบุ\)$/, "");
    const parts = [item.no + ". " + noOther(item.name)];
    if (f.caseNatureSub) parts.push(noOther(f.caseNatureSub));
    if (f.caseNatureOther) parts.push(f.caseNatureOther);
    return parts.join(" - ");
  }
  function offenseLawText(f) {
    return /^อื่นๆ/.test(f.offenseLaw || "") ? f.offenseLawOther : f.offenseLaw;
  }
  function verdictTypeText(f) {
    const t = L().VERDICT_TYPES.find((x) => x.code === f.verdictType);
    return t ? t.name : "";
  }
  function restitutionText(f) {
    if (!f.restitutionType && (f.restitutionAmount === "" || f.restitutionAmount == null)) return "";
    return [f.restitutionType, money(f.restitutionAmount)].filter(Boolean).join(" ");
  }

  /* ---------- Excel (เค้าโครงชีต "ฐาน" หัวตาราง 3 แถว 49 คอลัมน์ A–AW) ---------- */
  const HEADER_SPEC = [
    ["ลำดับ"], ["หน่วยงานที่รับผิดชอบ"], ["เลขาฯ อนุไต่/ผู้รับผิดชอบ"], ["เลขดำ"], ["ผู้กล่าวหา"], ["ผู้ถูกกล่าวหา"],
    ["เรื่องที่กล่าวหา (พฤติการณ์ที่ถูกกล่าวหา)"], ["ประเภทความผิด"],
    { group: "ต้นสังกัดของผู้ถูกร้องเรียน", subs: ["กระทรวง", "กรม", "สังกัด"] },
    ["ที่เกิดเหตุ"],
    {
      group: "มติคณะกรรมการ ป.ป.ท.",
      subs: ["ครั้งที่", "วันที่", "วาระ", "ผิดอาญา", "ผิดวินัย", "ยุติเรื่อง", "ส่ง ป.ป.ช.", "ส่งพนักงานสอบสวน", "ส่งหน่วยงานที่เกี่ยวข้อง", "ไต่เพิ่ม", "ข้อกล่าวหาเป็นอันตกไป"],
    },
    ["นับสถิติ เป็น"], ["ประเภท/ลักษณะคดี"], ["กลุ่มงานบริหารติดตามรับเรื่อง"], ["ประเภทคำพิพากษา"],
    ["คดีหมายเลขดำที่"], ["คดีหมายเลขแดงที่"], ["วันที่ศาลมีคำพิพากษา"], ["โจทก์"], ["จำเลย (ศาลสั่งฟ้อง)"],
    ["สถานะชั้นพนักงานอัยการ (dg)"], ["สถานะชั้นคำพิพากษา (fz)"],
    {
      group: "ผลคำพิพากษา",
      subs: ["รายละเอียด", "ความผิดตามกฎหมาย/ระเบียบ", { name: "จำคุก", subs: ["เดือน", "ปี"] }, "ปรับ (บาท)", "ชดใช้/คืน (รวมดอกเบี้ย)", "หน่วยงานที่รับเงินคืน"],
    },
    {
      group: "การลงโทษจริง",
      subs: [{ name: "จำคุก (เดือน/ปี)", subs: ["เดือน", "ปี"] }, "ปรับ (บาท)", "รอลงโทษ (ปี)", "รายงานตัวผู้คุมประพฤติ (ปี)", "ทำสาธารณะประโยชน์ (ชม.)", "อื่นๆ"],
    },
    ["มูลค่าความเสียหาย"],
  ];

  /* คืน { rows: [r1,r2,r3], merges: [{s:{r,c},e:{r,c}}], width } */
  function excelHeader() {
    const rows = [[], [], []];
    const merges = [];
    const span = (r1, c1, r2, c2) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
    let c = 0;
    HEADER_SPEC.forEach((spec) => {
      if (Array.isArray(spec)) {
        rows[0][c] = spec[0];
        span(0, c, 2, c);
        c++;
        return;
      }
      const start = c;
      spec.subs.forEach((sub) => {
        if (typeof sub === "string") {
          rows[1][c] = sub;
          span(1, c, 2, c);
          c++;
          return;
        }
        rows[1][c] = sub.name;
        span(1, c, 1, c + sub.subs.length - 1);
        sub.subs.forEach((s) => {
          rows[2][c] = s;
          c++;
        });
      });
      rows[0][start] = spec.group;
      span(0, start, 0, c - 1);
    });
    rows.forEach((r) => {
      for (let i = 0; i < c; i++) if (r[i] == null) r[i] = "";
    });
    return { rows: rows, merges: merges, width: c };
  }

  function excelRow(seq, rec, ctx, fmt) {
    const f = Object.assign(emptyFields(), rec.fields);
    const court = rec.court || {};
    return [
      seq, ctx.unit, ctx.officer, ctx.paccBlackNo, ctx.accuser, ctx.accused, ctx.allegation, ctx.offenseType,
      ctx.ministry, ctx.department, ctx.agency, ctx.place,
      ctx.boardMeetingNo, ctx.boardMeetingDate, ctx.boardAgendaNo,
    ]
      .concat(ctx.boardOutcomes.map((b) => (b ? "✓" : "")))
      .concat([
        f.statCountAs, caseNatureText(f), f.trackingGroup, verdictTypeText(f),
        court.blackNo || "", court.redNo || "", court.date ? fmt(court.date) : "", ctx.plaintiff, ctx.defendant,
        ctx.prosecutorStatus, stripNo(f.verdictStage),
        f.resultDetail, offenseLawText(f), f.jailMonths, f.jailYears, f.fine, restitutionText(f), f.refundUnit,
        f.actualJailMonths, f.actualJailYears, f.actualFine, f.suspendedYears, f.probationYears, f.communityHours, f.actualOther,
        f.damageValue,
      ]);
  }

  /* cases → แถวข้อมูล Excel (1 แถวต่อบันทึกรายชั้น เฉพาะสำนวนที่มีบันทึก) */
  function excelRows(cases, deps) {
    const fmt = (deps && deps.formatDate) || ((x) => x || "");
    const out = [];
    (cases || []).forEach((kase) => {
      const recs = getRecords(kase);
      if (!recs.length) return;
      const ctx = buildContext(kase, deps);
      recs.forEach((rec) => out.push(excelRow(out.length + 1, rec, ctx, fmt)));
    });
    return out;
  }

  /* ตัวอย่างเดโม → [{ caseId, patch }] เฉพาะสำนวนที่มีอยู่ เป็น 10.1 และยังไม่มีบันทึกผลคำพิพากษา (ไม่ทับข้อมูลจริง) */
  function samplePatches(cases, samples) {
    const out = [];
    (samples || []).forEach((s) => {
      const kase = (cases || []).find((c) => c.id === s.caseId);
      if (!kase || (kase.category && kase.category !== "10.1") || (kase.verdictRecords || []).length) return;
      let work = Object.assign({}, kase);
      s.records.forEach((r) => {
        const p = buildRecordPatch(work, r.level, r.fields, { status: r.status, by: s.by, court: r.court, fileNames: r.fileNames });
        if (p) work = Object.assign(work, p);
      });
      const patch = { verdictRecords: work.verdictRecords || [], judgments: work.judgments || [] };
      if (s.paccSourceId && !kase.paccSourceId) patch.paccSourceId = s.paccSourceId;
      /* ช่องของสำนวน (เช่น โจทก์/จำเลย) เติมเฉพาะที่ยังว่าง */
      Object.keys(s.caseFields || {}).forEach((key) => {
        const cur = kase[key];
        if (cur == null || cur === "" || (Array.isArray(cur) && !cur.length)) patch[key] = s.caseFields[key];
      });
      /* ผลวิเคราะห์คำพิพากษา (ข้อเสนอแนะทางคดีในแบบสรุป) — ต่อท้ายรูปแบบเดียวกับ Activity10.buildJudgmentAnalysisPatch */
      if ((s.analyses || []).length) {
        const prev = kase.judgmentAnalyses || [];
        patch.judgmentAnalyses = prev.concat(
          s.analyses.map((a, i) => ({
            id: "JA-" + String(prev.length + i + 1).padStart(3, "0"),
            judgmentRef: "",
            issue: clean(a.issue),
            summary: clean(a.summary),
            analysis: clean(a.analysis),
            recommendation: clean(a.recommendation),
            analyst: s.by || "",
            date: clean(a.date),
            inputMethod: "FORM",
            fileNames: [],
            createdAt: clean(a.date),
          })),
        );
      }
      out.push({ caseId: kase.id, patch: patch });
    });
    return out;
  }

  global.ECMISVerdictRecord = {
    samplePatches: samplePatches,
    INPUT_FIELDS: INPUT_FIELDS,
    levelName: levelName,
    levelFromProsecutorLevel: levelFromProsecutorLevel,
    appliesToProsecutorType: appliesToProsecutorType,
    emptyFields: emptyFields,
    normalizeFields: normalizeFields,
    validate: validate,
    getRecords: getRecords,
    getRecord: getRecord,
    initialState: initialState,
    buildRecordPatch: buildRecordPatch,
    paccOf: paccOf,
    buildContext: buildContext,
    caseNatureText: caseNatureText,
    offenseLawText: offenseLawText,
    verdictTypeText: verdictTypeText,
    restitutionText: restitutionText,
    stripNo: stripNo,
    money: money,
    excelHeader: excelHeader,
    excelRows: excelRows,
  };
})(typeof window !== "undefined" ? window : globalThis);
