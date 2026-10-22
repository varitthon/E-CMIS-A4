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
    { key: "verdictStage", col: "AH", label: "สถานะชั้นคำพิพากษา" },
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
      /* ประเภทคำพิพากษา (ลงโทษ/ยกฟ้อง) ใช้กับส่วนศาลคดีอาญาเท่านั้น — ศาลปกครองไม่บังคับ */
      if (!n.fields.verdictType && L().levelPart(level) !== "ADMIN") errors.push("กรุณาเลือกประเภทคำพิพากษา");
      if (!n.fields.verdictStage) errors.push("กรุณาเลือกสถานะชั้นคำพิพากษา");
    }
    return errors;
  }

  function levelOrder(code) {
    const i = L().LEVELS.findIndex((l) => l.code === code);
    return i < 0 ? 99 : i;
  }

  /* ---------- บุคคล (ผู้ถูกกล่าวหา/จำเลย) — 1 บันทึก = ชั้นศาล × บุคคล ---------- */
  /* แยกรายชื่อจากข้อความ "นาย ก, นาง ข และ นาย ค" (ตัดวงเล็บตำแหน่งท้ายชื่อ) */
  function splitNames(text) {
    return String(text == null ? "" : text)
      .split(/\s*,\s*|\s+และ\s+/)
      .map((s) => clean(s.replace(/\s*\([^)]*\)\s*$/, "")))
      .filter((s) => s && s !== "-");
  }
  /* รายชื่อให้เลือก: จำเลยที่กรอกในหน้า 02 + ผู้ถูกกล่าวหาในสำนวนเดิม + ผู้ถูกกล่าวหาของสำนวน (ไม่ซ้ำ) */
  function personCandidates(kase, pacc) {
    const k = kase || {};
    const out = [];
    const add = (n) => {
      if (n && out.indexOf(n) < 0) out.push(n);
    };
    (Array.isArray(k.defendants) ? k.defendants : []).forEach((d) => splitNames(d).forEach(add));
    splitNames(pacc && pacc.accused).forEach(add);
    splitNames(k.accused).forEach(add);
    return out;
  }
  /* บันทึกเดิม (ก่อนแยกรายบุคคล) ไม่มี person → ถือเป็นผู้ถูกกล่าวหาคนแรกของสำนวน */
  function defaultPerson(kase) {
    return personCandidates(kase, null)[0] || "ผู้ถูกกล่าวหา";
  }
  function withPerson(kase, rec) {
    return rec.person ? rec : Object.assign({}, rec, { person: defaultPerson(kase) });
  }
  function getRecords(kase) {
    const list = ((kase && kase.verdictRecords) || []).map((r) => withPerson(kase, r));
    const order = list.map((r) => r.person).filter((p, i, all) => all.indexOf(p) === i);
    return list.sort((a, b) => levelOrder(a.level) - levelOrder(b.level) || order.indexOf(a.person) - order.indexOf(b.person));
  }
  /* ไม่ระบุบุคคล = บันทึกแรกของชั้นนั้น */
  function getRecord(kase, level, person) {
    return getRecords(kase).find((r) => r.level === level && (!person || r.person === person)) || null;
  }
  function personsAt(kase, level) {
    return getRecords(kase)
      .filter((r) => r.level === level)
      .map((r) => r.person);
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

  /* ศาลของชั้น (ใช้ร่วมทุกคนในชั้นเดียวกัน): type = ประเภทศาล (ECMISCourtLists.COURT_TYPES) — ไม่ระบุ = เดาจากชื่อศาล */
  function normalizeCourt(c) {
    const x = c || {};
    const CL = global.ECMISCourtLists;
    const name = clean(x.name);
    return {
      /* รหัสเดิม MISCONDUCT → ศาลแขวง/ศาลจังหวัดตามชื่อศาล; ไม่ระบุ = เดาจากชื่อศาล */
      type: CL ? CL.normalizeType(clean(x.type), name) : clean(x.type),
      name: name,
      blackNo: clean(x.blackNo),
      redNo: clean(x.redNo),
      date: clean(x.date),
    };
  }

  /* สรุปผลรายชั้นสำหรับ judgments[] (สารบบ/รายงานเดิม): 1 คน = ผลของคนนั้น, หลายคน = "ชื่อ: ผล / ..." */
  /* หลายคนในชั้นเดียว: ทุกคนสถานะชั้นเดียวกัน → สถานะชั้นครั้งเดียว ตามด้วยประเภทคำพิพากษารายบุคคล
     เช่น "ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย — นาย ก: ลงโทษ / นาย ข: ยกฟ้อง"
     สถานะชั้นต่างกัน → สถานะชั้นรายบุคคล "นาย ก: ...ลงโทษ / นาย ข: ...ยกฟ้อง" */
  function multiPersonResultText(levelRecs) {
    const stages = Array.from(new Set(levelRecs.map((r) => stripNo(r.fields.verdictStage))));
    const shared = stages.length === 1 ? stages[0] : "";
    const perPerson = levelRecs
      .map((r) => {
        const type = L().VERDICT_TYPES.find((t) => t.code === r.fields.verdictType);
        const text = shared ? (type ? type.name : "") : judgmentResultText(r.fields, "");
        return text ? r.person + ": " + text : "";
      })
      .filter(Boolean)
      .join(" / ");
    return [shared, perPerson].filter(Boolean).join(" — ");
  }

  function judgmentForLevel(levelRecs, prev, by, when) {
    const p = prev || {};
    const single = levelRecs.length === 1;
    /* ข้อความเดิมใช้เป็นค่าสำรองได้เฉพาะรายการจาก popup เดิม (ไม่ใช่ข้อความสรุปที่ฟอร์มเขียนไว้) */
    const legacyResult = p.verdictRecordLevel ? "" : p.result;
    const result = single ? judgmentResultText(levelRecs[0].fields, legacyResult) : multiPersonResultText(levelRecs);
    if (!result) return null;
    const court = levelRecs[0].court || {};
    const details = levelRecs.map((r) => (single ? "" : r.person + ": ") + clean(r.fields.resultDetail)).filter((s) => clean(s.replace(/^.*?:\s*/, "")));
    return Object.assign({}, p, {
      level: levelRecs[0].level,
      issuer: court.name || p.issuer || "",
      blackNo: court.blackNo || p.blackNo || "",
      redNo: court.redNo || p.redNo || "",
      date: court.date || p.date || "",
      result: result,
      summary: details.join("\n") || p.summary || "",
      isFinal: levelRecs.every((r) => !!r.fields.isFinal),
      fileNames: levelRecs[0].fileNames && levelRecs[0].fileNames.length ? levelRecs[0].fileNames : p.fileNames || [],
      recordedBy: p.recordedBy || by || "",
      recordedAt: p.recordedAt || when,
      verdictRecordLevel: levelRecs[0].level,
    });
  }

  /* เขียน judgments[] ของชั้นนั้นใหม่จากบันทึกรายบุคคล (ไม่มีบันทึกเหลือ = ลบรายการที่ฟอร์มดูแล) */
  function syncJudgment(kase, records, level, by, when) {
    const judgments = ((kase && kase.judgments) || []).slice();
    const idx = judgmentIndexForLevel(kase, level);
    const levelRecs = records.filter((r) => r.level === level);
    const merged = levelRecs.length ? judgmentForLevel(levelRecs, idx >= 0 ? judgments[idx] : null, by, when) : null;
    if (merged && idx >= 0) judgments[idx] = merged;
    else if (merged) judgments.push(merged);
    else if (idx >= 0 && judgments[idx].verdictRecordLevel === level) judgments.splice(idx, 1);
    return judgments;
  }

  /* ตัวสร้าง patch (pure, immutable) — upsert บันทึกของ (ชั้นศาล, บุคคล), ศาล/ไฟล์ใช้ร่วมทั้งชั้น,
     และสรุป judgments[] ของชั้นนั้น
     opts = { person, status, by, when, court:{type,name,blackNo,redNo,date}, fileNames[] }; ไม่ผ่าน → null */
  function buildRecordPatch(kase, level, input, opts) {
    const o = opts || {};
    const person = clean(o.person) || defaultPerson(kase);
    const prevRec = getRecord(kase, level, person);
    const asked = o.status === "done" ? "done" : "draft";
    if (validate(level, input, asked).length) return null;
    /* บันทึกร่างทับบันทึกที่ "บันทึกแล้ว" และยังกรอกครบ → คงสถานะบันทึกแล้ว ไม่ลดเป็นร่าง */
    const keepDone = asked === "draft" && prevRec && prevRec.status === "done" && !validate(level, input, "done").length;
    const when = o.when || new Date().toISOString();
    const court = normalizeCourt(o.court);
    const fileNames = (o.fileNames || (prevRec && prevRec.fileNames) || []).map(clean).filter(Boolean);
    const record = {
      level: level,
      person: person,
      status: keepDone ? "done" : asked,
      fields: normalizeFields(input).fields,
      court: court,
      fileNames: fileNames,
      createdAt: (prevRec && prevRec.createdAt) || when,
      updatedBy: o.by || "",
      updatedAt: when,
    };
    const others = getRecords(kase)
      .filter((r) => !(r.level === level && r.person === person))
      .map((r) => (r.level === level ? Object.assign({}, r, { court: court, fileNames: fileNames }) : r));
    const records = others.concat([record]);
    return { verdictRecords: records, judgments: syncJudgment(kase, records, level, o.by, when) };
  }

  /* บันทึกหลายคนในชั้นเดียวพร้อมกัน (pure) — entries [{ person, fields, status }] ใช้ศาล/ไฟล์ชุดเดียวกัน (opts.court, opts.fileNames)
     ตรวจทุกคนก่อน: มีคนใดผิด → { patch: null, errors: [{ person, errors }] } ไม่บันทึกใครเลย */
  function buildLevelPatch(kase, level, entries, opts) {
    const list = entries || [];
    const errors = list
      .map((e) => ({ person: e.person, errors: validate(level, e.fields, e.status === "done" ? "done" : "draft") }))
      .filter((x) => x.errors.length);
    if (!list.length) errors.push({ person: "", errors: ["กรุณากรอกผลคำพิพากษาอย่างน้อย 1 คน"] });
    if (errors.length) return { patch: null, errors: errors };
    const when = (opts && opts.when) || new Date().toISOString();
    let work = Object.assign({}, kase);
    list.forEach((e) => {
      const p = buildRecordPatch(work, level, e.fields, Object.assign({}, opts, { person: e.person, status: e.status, when: when }));
      work = Object.assign({}, work, p);
    });
    return { patch: { verdictRecords: work.verdictRecords || [], judgments: work.judgments || [] }, errors: [] };
  }

  /* ---------- แท็บรายบุคคล ---------- */
  /* ลำดับแท็บ: รายชื่อจากสำนวน (จำเลย/สำนวนเดิม) ก่อน แล้วต่อด้วยคนที่มีบันทึก/เพิ่มเองแต่ไม่อยู่ในรายชื่อ */
  function tabOrder(candidates, extra) {
    const out = [];
    (candidates || []).concat(extra || []).forEach((n) => {
      const c = clean(n);
      if (c && out.indexOf(c) < 0) out.push(c);
    });
    return out;
  }
  function previousPerson(order, person) {
    const i = (order || []).indexOf(person);
    return i > 0 ? order[i - 1] : "";
  }
  /* ค่าเริ่มต้นรายแท็บ { person: { fields, status } } — ข้อความจาก popup เดิม (judgments[]) ใส่เฉพาะแท็บแรก ไม่ซ้ำให้ทุกคน */
  function tabStates(kase, level, order) {
    const out = {};
    (order || []).forEach((p, i) => {
      const st = initialState(kase, level, p);
      const own = getRecord(kase, level, p);
      out[p] = { fields: i > 0 && !own ? emptyFields() : st.fields, status: own ? own.status : "" };
    });
    return out;
  }
  /* คนในรายชื่อสำนวนที่ผู้ใช้ลบแท็บออกจากชั้นนี้ (เช่น ยกฟ้องชั้นต้นแล้วไม่มีในชั้นอุทธรณ์) — kase.verdictHiddenPersons[level] */
  function hiddenPersons(kase, level) {
    const map = (kase && kase.verdictHiddenPersons) || {};
    return (map[level] || []).slice();
  }
  /* (pure) ซ่อน/เลิกซ่อนบุคคลในชั้นนี้ → { verdictHiddenPersons } */
  function hiddenPatch(kase, level, names, hide) {
    const list = Array.isArray(names) ? names : [names];
    const cur = hiddenPersons(kase, level);
    const next = hide ? tabOrder(cur, list) : cur.filter((n) => list.indexOf(n) < 0);
    return { verdictHiddenPersons: Object.assign({}, (kase && kase.verdictHiddenPersons) || {}, { [level]: next }) };
  }

  /* คัดลอกผลของอีกคน: ทุกช่องที่ผู้ใช้กรอก (3 ส่วน) — ศาล/ไฟล์ใช้ร่วมกันอยู่แล้วจึงไม่อยู่ในนี้ */
  function copyFields(src) {
    const s = src || {};
    const out = emptyFields();
    INPUT_FIELDS.forEach((d) => {
      if (s[d.key] !== undefined) out[d.key] = s[d.key];
    });
    return out;
  }

  /* ลบบุคคลออกจากชั้นศาล (pure) */
  function removePersonPatch(kase, level, person, when) {
    const records = getRecords(kase).filter((r) => !(r.level === level && r.person === person));
    return { verdictRecords: records, judgments: syncJudgment(kase, records, level, "", when || new Date().toISOString()) };
  }

  const EMPTY_COURT = { type: "", name: "", blackNo: "", redNo: "", date: "" };
  /* ค่าเริ่มต้นของฟอร์ม (ชั้น, บุคคล) — บันทึกเดิม / ศาลของคนอื่นในชั้นเดียวกัน / judgments[] ชั้นเดียวกัน (popup เดิม)
     / เลขคดีและประเภทศาลจากหน้า 02 */
  function initialState(kase, level, person) {
    const k = kase || {};
    const rec = getRecord(k, level, person);
    if (rec)
      return {
        fields: Object.assign(emptyFields(), rec.fields),
        court: Object.assign({}, EMPTY_COURT, normalizeCourt(rec.court)),
        fileNames: rec.fileNames || [],
        status: rec.status,
      };
    const sibling = getRecord(k, level);
    if (sibling)
      return { fields: emptyFields(), court: Object.assign({}, EMPTY_COURT, normalizeCourt(sibling.court)), fileNames: sibling.fileNames || [], status: "" };
    const idx = judgmentIndexForLevel(k, level);
    const j = idx >= 0 ? k.judgments[idx] : null;
    const useCaseCourt = !j && !(k.verdictRecords || []).length;
    const fields = emptyFields();
    if (j) {
      fields.resultDetail = clean(j.summary || j.result);
      fields.isFinal = !!j.isFinal;
    }
    const court = normalizeCourt({
      name: j ? j.issuer : useCaseCourt ? k.courtName : "",
      blackNo: j ? j.blackNo : useCaseCourt ? k.courtBlackNo : "",
      redNo: j ? j.redNo : useCaseCourt ? k.courtRedNo : "",
      date: j ? j.date : "",
    });
    /* ประเภทศาลจากหน้า 02 ใช้เฉพาะเมื่อตรงกับส่วนของชั้นนี้ (ศาลอาญา/ศาลปกครอง) */
    const CLs = global.ECMISCourtLists;
    const sys = CLs ? CLs.normalizeType(clean(k.courtSystem), court.name) : clean(k.courtSystem);
    if (!court.type && sys && (!CLs || CLs.courtTypesForLevel(level).some((t) => t.code === sys))) court.type = sys;
    return { fields: fields, court: court, fileNames: j ? j.fileNames || [] : [], status: "" };
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

  /* รายละเอียดที่ดึงจากสำนวนเดิม + กิจกรรม 7 สำหรับแถวขยายในแท็บฐานข้อมูลคำพิพากษา (รูปแบบเดียวกับการ์ดหน้า 02)
     คืน { paccId, main: { caseNo, blackNo, allegation, owner, resolutionType, unit, accuser, accused },
           rows: [{ label, value }] (ข้อมูลเพิ่มเติม) } — ค่าว่าง = "-" (ยังไม่มีข้อมูลในสำนวนเดิม) */
  function paccDetailRows(kase, deps) {
    const c = buildContext(kase, deps);
    const pacc = paccOf(kase, (deps || {}).paccDb) || {};
    const dash = (v) => clean(v) || "-";
    const outcomes = L()
      .BOARD_OUTCOMES.filter((b, i) => c.boardOutcomes[i])
      .map((b) => b.label)
      .join(", ");
    const board = [
      c.boardMeetingNo ? "ครั้งที่ " + c.boardMeetingNo : "",
      c.boardMeetingDate ? "วันที่ " + c.boardMeetingDate : "",
      c.boardAgendaNo ? "วาระ " + c.boardAgendaNo : "",
    ].filter(Boolean).join(" · ");
    const subcommittee = [
      c.subcommitteeCriminal ? "อาญา: " + c.subcommitteeCriminal : "",
      c.subcommitteeDisciplinary ? "วินัย: " + c.subcommitteeDisciplinary : "",
    ].filter(Boolean).join(" / ");
    const main = {
      caseNo: dash(clean(pacc.paccCaseNo) || String(c.paccId || "").replace(/^.*?-/, "")),
      blackNo: dash(c.paccBlackNo),
      allegation: dash(c.allegation),
      owner: dash(c.officer),
      /* ประเภทมติชี้มูล = ผลมติคณะกรรมการ ป.ป.ท. ที่ติ๊กไว้ (กิจกรรม 7) */
      resolutionType: dash(outcomes || (kase && kase.boardResolutionType)),
      unit: dash(c.unit),
      accuser: dash(c.accuser),
      accused: dash(c.accused),
    };
    const rows = [
      ["ประเภทความผิด", c.offenseType],
      ["ต้นสังกัด", [c.ministry, c.department, c.agency].filter(Boolean).join(" / ")],
      ["ที่เกิดเหตุ", c.place],
      ["คำสั่งไต่สวนข้อเท็จจริง", [c.inquiryOrderNo, c.inquiryOrderDate ? "ลงวันที่ " + c.inquiryOrderDate : ""].filter(Boolean).join(" ")],
      ["มติคณะกรรมการ ป.ป.ท.", board],
      ["ความเห็นคณะอนุกรรมการไต่สวน", subcommittee],
      ["ฐานความผิดที่อัยการส่งฟ้อง", c.prosecutedOffenses],
    ];
    return { paccId: c.paccId, main: main, rows: rows.map((r) => ({ label: r[0], value: dash(r[1]) })) };
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
      /* AG: ค่าที่เลือกจาก dropdown (ชีต DD) ก่อน — ยังไม่เลือก = ใช้กรณีอัยการของสำนวนแทน */
      prosecutorStatus: stripNo(k.verdictProsecutorStatus || k.oagVerdictCaseTypeName || k.prosecutorCaseTypeName || ""),
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
      /* F ผู้ถูกกล่าวหา / AF จำเลย = บุคคลของแถวนี้ (1 แถว = ชั้นศาล × บุคคล) */
      seq, ctx.unit, ctx.officer, ctx.paccBlackNo, ctx.accuser, rec.person || ctx.accused, ctx.allegation, ctx.offenseType,
      ctx.ministry, ctx.department, ctx.agency, ctx.place,
      ctx.boardMeetingNo, ctx.boardMeetingDate, ctx.boardAgendaNo,
    ]
      .concat(ctx.boardOutcomes.map((b) => (b ? "✓" : "")))
      .concat([
        f.statCountAs, caseNatureText(f), f.trackingGroup, verdictTypeText(f),
        court.blackNo || "", court.redNo || "", court.date ? fmt(court.date) : "", ctx.plaintiff, rec.person || ctx.defendant,
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

  /* บันทึกของสำนวนนี้มาจากตัวอย่างรุ่นก่อนทั้งหมด (เลขคดีดำตรงกับตัวอย่าง) → แทนที่ด้วยตัวอย่างรุ่นใหม่ได้ ไม่ทับข้อมูลจริง */
  function isOldSample(kase, s) {
    const recs = (kase && kase.verdictRecords) || [];
    const sampleBlack = s.records.map((r) => clean(r.court && r.court.blackNo)).filter(Boolean);
    return recs.length > 0 && recs.every((r) => sampleBlack.indexOf(clean(r.court && r.court.blackNo)) >= 0);
  }

  /* ตัวอย่างเดโม → [{ caseId, patch }] เฉพาะสำนวน 10.1 ที่มีอยู่ และยังไม่มีบันทึก (หรือมีแต่ตัวอย่างรุ่นก่อน) */
  function samplePatches(cases, samples) {
    const out = [];
    (samples || []).forEach((s) => {
      const kase = (cases || []).find((c) => c.id === s.caseId);
      if (!kase || (kase.category && kase.category !== "10.1")) return;
      if ((kase.verdictRecords || []).length && !isOldSample(kase, s)) return;
      let work = Object.assign({}, kase, {
        verdictRecords: [],
        judgments: (kase.judgments || []).filter((j) => !j.verdictRecordLevel),
      });
      s.records.forEach((r) => {
        const opts = { person: r.person, status: r.status, by: s.by, court: r.court, fileNames: r.fileNames };
        const p = buildRecordPatch(work, r.level, r.fields, opts);
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
      const prevAnalyses = kase.judgmentAnalyses || [];
      const alreadyHas = (a) => prevAnalyses.some((x) => clean(x.recommendation) === clean(a.recommendation));
      if ((s.analyses || []).some((a) => !alreadyHas(a))) {
        const prev = prevAnalyses;
        patch.judgmentAnalyses = prev.concat(
          s.analyses.filter((a) => !alreadyHas(a)).map((a, i) => ({
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

  /* คืนค่าตัวอย่าง (ขั้นที่ 1): ล้างบันทึกผลคำพิพากษาของสำนวนตัวอย่างที่มีอยู่ → แล้วเติมใหม่ด้วย samplePatches()
     คงคำพิพากษาจาก popup เดิม (judgments ที่ไม่ใช่ของฟอร์มนี้) และผลวิเคราะห์ไว้; สำนวนอื่นไม่ถูกแตะ */
  function clearSamplePatches(cases, samples) {
    return (samples || [])
      .map((s) => (cases || []).find((c) => c.id === s.caseId))
      .filter(Boolean)
      .map((kase) => ({
        caseId: kase.id,
        patch: {
          verdictRecords: [],
          judgments: (kase.judgments || []).filter((j) => !j.verdictRecordLevel),
          verdictHiddenPersons: {},
          verdictProsecutorStatus: "",
        },
      }));
  }

  /* สำนวนตัวอย่างที่ต้องสร้างใหม่ (sample.createCase) เมื่อยังไม่มี id นี้ในระบบ
     วันรับ/กำหนดเสร็จนับจาก today (ค่าเริ่มต้น = วันนี้) เหมือนสำนวนตั้งต้นใน ecmis-activity10.js */
  function sampleNewCases(cases, samples, today) {
    const base = today ? new Date(today) : new Date();
    const offset = (days) => {
      const d = new Date(base.getTime());
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };
    const have = new Set((cases || []).map((c) => c.id));
    return (samples || [])
      .filter((s) => s.createCase && !have.has(s.caseId))
      .map((s) =>
        Object.assign(
          { dateReceived: offset(-5), dueDate: offset(10), verdictRecords: [], judgments: [] },
          s.createCase,
          { id: s.caseId },
        ),
      );
  }

  global.ECMISVerdictRecord = {
    samplePatches: samplePatches,
    sampleNewCases: sampleNewCases,
    clearSamplePatches: clearSamplePatches,
    buildLevelPatch: buildLevelPatch,
    tabOrder: tabOrder,
    previousPerson: previousPerson,
    tabStates: tabStates,
    copyFields: copyFields,
    hiddenPersons: hiddenPersons,
    paccDetailRows: paccDetailRows,
    hiddenPatch: hiddenPatch,
    INPUT_FIELDS: INPUT_FIELDS,
    levelName: levelName,
    levelFromProsecutorLevel: levelFromProsecutorLevel,
    appliesToProsecutorType: appliesToProsecutorType,
    emptyFields: emptyFields,
    normalizeFields: normalizeFields,
    validate: validate,
    getRecords: getRecords,
    getRecord: getRecord,
    personsAt: personsAt,
    personCandidates: personCandidates,
    defaultPerson: defaultPerson,
    normalizeCourt: normalizeCourt,
    initialState: initialState,
    buildRecordPatch: buildRecordPatch,
    removePersonPatch: removePersonPatch,
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
