/* ECMIS 10.1 บันทึกผลคำพิพากษา — แบบสรุปการวิเคราะห์คดี (Word) ตามแบบฟอร์ม "แบบฟอร์มสรุปคำพิพากษา" (.doc)
   รูปแบบเดียวกับต้นฉบับ: ตราสำนักงานกลางหัวกระดาษ · ตาราง 2 คอลัมน์ (หัวข้อ 34.5% พื้นฟ้า #9CC2E5 ตัวหนา)
   · แถวหัวเรื่องพื้นฟ้า กลาง ตัวหนา และพิมพ์ซ้ำทุกหน้า · TH SarabunPSK 16pt · เลขคดีดำ/แดงอยู่ในช่องหัวข้อของแถวศาล
   · มติคณะกรรมการเขียนเป็นข้อความตามต้นฉบับ · แถวผู้รับผิดชอบสรุปพื้นฟ้ากลาง · หมายเหตุท้ายตาราง
   1 สำนวน = 1 เอกสาร รวมทุกชั้นศาล; ช่องที่ต้นฉบับมีเส้นจุดจะแสดงเส้นจุดเมื่อยังไม่มีข้อมูล ช่องอื่นเว้นว่าง
   buildSummaryHtml(kase, deps) คืน HTML ทั้งหน้า (pure) → ECMISExport.toDocx(html, name, DOCX_OPTIONS) / printHtml
   deps.logoSrc = data URI ของตรา (Word ฝังรูปได้เฉพาะ data URI) หรือ path สำหรับหน้าพิมพ์
   ต้องโหลดหลัง ecmis-verdict-lists.js และ ecmis-verdict-record.js */
(function (global) {
  "use strict";

  const R = () => global.ECMISVerdictRecord;
  const FILL = "#9CC2E5";
  const FONT = "'TH SarabunPSK','TH Sarabun New','Sarabun',sans-serif";
  const DOTS = "........................................";
  /* ขอบกระดาษตามต้นฉบับ (twip): บน 1 ซม. ขวา 2.5 ซม. ซ้าย 3 ซม. (ล่างต้นฉบับ 0 — ใช้ 1.27 ซม. ให้พิมพ์ได้) */
  const DOCX_OPTIONS = { margins: { top: 568, right: 1418, bottom: 720, left: 1701, header: 720, footer: 680 } };

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  const has = (v) => String(v == null ? "" : v).trim() !== "";
  const orDots = (v, dots) => (has(v) ? esc(v) : dots || DOTS);
  const lines = (list) => list.filter(Boolean).join("<br>");
  const hasNum = (v) => v !== "" && v != null && Number(v) > 0;
  const b = (s) => "<b>" + s + "</b>";

  /* ศาลแขวง/ศาลจังหวัด (ไม่ใช่ศาลคดีทุจริต) = แถว "ศาลคดีประพฤติมิชอบ" ตามแบบฟอร์ม */
  function isMisconductCourt(name) {
    const n = String(name || "");
    return /แขวง|จังหวัด/.test(n) && !/ทุจริต/.test(n);
  }

  function jailText(years, months) {
    const parts = [];
    if (hasNum(years)) parts.push(years + " ปี");
    if (hasNum(months)) parts.push(months + " เดือน");
    return parts.length ? "จำคุก " + parts.join(" ") : "";
  }
  const levelName = (rec) => R().levelName(rec.level);

  /* "ศาลพิพากษาลงโทษ" — ต้นฉบับ: พิพากษาลงโทษ / พิพากษายกฟ้อง */
  function verdictWord(f) {
    if (f.verdictType === "1") return "พิพากษาลงโทษ";
    if (f.verdictType === "2") return "พิพากษายกฟ้อง";
    return R().verdictTypeText(f) || "-";
  }

  /* ---------- ส่วนของแถว ---------- */
  /* ป้ายบรรทัด: "ศาลชั้นต้น" หรือ "ศาลชั้นต้น › ชื่อบุคคล" เมื่อชั้นนั้นมีหลายคน (rec.tag ตั้งใน bodyRows) */
  const tagOf = (rec) => b(esc(rec.tag || levelName(rec)));
  const verdictOf = (f) => {
    const law = R().offenseLawText(f);
    return esc(verdictWord(f)) + (law ? " ตาม" + esc(law) : "");
  };

  /* firstOfLevels = บันทึกแรกของแต่ละชั้น (ศาลใช้ร่วมทั้งชั้น) */
  function courtNumbersLabel(firstOfLevels, dotsBlack, dotsRed) {
    const many = firstOfLevels.length > 1;
    const join = (key) =>
      firstOfLevels
        .map((r) => (r.court && has(r.court[key]) ? esc(r.court[key]) + (many ? " (" + esc(levelName(r)) + ")" : "") : ""))
        .filter(Boolean)
        .join(", ");
    return "คดีหมายเลขดำที่ " + (join("blackNo") || dotsBlack) + "<br>คดีหมายเลขแดงที่ " + (join("redNo") || dotsRed);
  }

  /* 1 ชั้น: "คำพิพากษาศาลชั้นต้น <ศาล> ลงวันที่ … พิพากษาลงโทษ ตาม…" — หลายคน: ผลแยกบรรทัดละคน */
  function courtVerdictLines(levelRecs, fmt) {
    const c = levelRecs[0].court || {};
    const head =
      b("คำพิพากษา" + esc(levelName(levelRecs[0]))) + (has(c.name) ? " " + esc(c.name) : "") + (has(c.date) ? " ลงวันที่ " + esc(fmt(c.date)) : "");
    if (levelRecs.length === 1) return head + " " + verdictOf(levelRecs[0].fields || {});
    return head + levelRecs.map((r) => "<br>– " + esc(r.person) + ": " + verdictOf(r.fields || {})).join("");
  }

  function resultLine(rec) {
    const f = rec.fields || {};
    const law = R().offenseLawText(f);
    const rest = R().restitutionText(f);
    const bits = [
      has(f.resultDetail) ? esc(f.resultDetail) : "",
      law ? "ความผิดตาม" + esc(law) : "",
      esc(jailText(f.jailYears, f.jailMonths)),
      hasNum(f.fine) ? "ปรับ " + esc(R().money(f.fine)) + " บาท" : "",
      rest ? esc(rest) + " บาท (รวมดอกเบี้ย)" : "",
      has(f.refundUnit) ? "หน่วยงานที่รับเงินคืน " + esc(f.refundUnit) : "",
    ].filter(Boolean);
    return bits.length ? tagOf(rec) + " " + bits.join(" / ") : "";
  }

  function actualLine(rec) {
    const f = rec.fields || {};
    const bits = [
      esc(jailText(f.actualJailYears, f.actualJailMonths)),
      hasNum(f.actualFine) ? "ปรับ " + esc(R().money(f.actualFine)) + " บาท" : "",
      hasNum(f.suspendedYears) ? "รอการลงโทษ " + esc(f.suspendedYears) + " ปี" : "",
      hasNum(f.probationYears) ? "รายงานตัวต่อพนักงานคุมประพฤติ " + esc(f.probationYears) + " ปี" : "",
      hasNum(f.communityHours) ? "ทำงานบริการสาธารณะ " + esc(f.communityHours) + " ชั่วโมง" : "",
      has(f.actualOther) ? esc(f.actualOther) : "",
    ].filter(Boolean);
    return bits.length ? tagOf(rec) + " " + bits.join(" / ") : "";
  }

  function finalLine(rec) {
    const f = rec.fields || {};
    if (!f.isFinal) return "";
    return tagOf(rec) + " คดีถึงที่สุด" + (has(f.finalLetterNo) ? " ตามหนังสือเลขที่ " + esc(f.finalLetterNo) : "");
  }

  /* ผลมติ: อาญา+วินัย → "ชี้มูลความผิดทางอาญาและทางวินัย" ตามต้นฉบับ; ผลมติอื่นต่อท้ายด้วยชื่อ */
  function boardOutcomeText(ctx) {
    const lists = global.ECMISVerdictLists.BOARD_OUTCOMES;
    const on = lists.filter((x, i) => ctx.boardOutcomes[i]).map((x) => x.key);
    const crim = on.indexOf("criminal") >= 0;
    const disc = on.indexOf("disciplinary") >= 0;
    const parts = [];
    if (crim && disc) parts.push("ชี้มูลความผิดทางอาญาและทางวินัย");
    else if (crim) parts.push("ชี้มูลความผิดทางอาญา");
    else if (disc) parts.push("ชี้มูลความผิดทางวินัย");
    lists.forEach((x) => {
      if (x.key !== "criminal" && x.key !== "disciplinary" && on.indexOf(x.key) >= 0) parts.push(x.label);
    });
    return parts.join(" และ ");
  }

  function boardText(ctx) {
    return (
      b(
        "คณะกรรมการ ป.ป.ท. ได้พิจารณาสำนวนการไต่สวนข้อเท็จจริง<br>ในคราวประชุม ครั้งที่ " + orDots(ctx.boardMeetingNo, "......../............") +
        " เมื่อวันที่ " + orDots(ctx.boardMeetingDate, ".................................") +
        "<br>วาระ " + orDots(ctx.boardAgendaNo, ".................") + " แล้วมีมติว่า",
      ) +
      " " + esc(boardOutcomeText(ctx)) +
      "<br>" + b("มีความผิดดังนี้") +
      "<br>" + b("๑. ความผิดอาญาตามประมวลกฎหมายอาญา") + " " + esc(ctx.subcommitteeCriminal) +
      "<br>" + b("๒. ความผิดวินัยอย่างร้ายแรง") + " " + esc(ctx.subcommitteeDisciplinary)
    );
  }

  /* ผู้สรุป = ผู้บันทึกล่าสุด */
  function latestRecord(recs) {
    return recs.reduce((best, r) => (!best || String(r.updatedAt || "") > String(best.updatedAt || "") ? r : best), null);
  }

  /* ---------- เค้าโครงตาราง ----------
     อักษรไทยเป็น complex script ใน Word: ต้องกำหนด mso-bidi-font-family/size ด้วย ไม่งั้น Word ใช้ฟอนต์สำรอง
     เนื้อหาในเซลล์ห่อด้วย <p margin:0> เพื่อตัดระยะหลังย่อหน้าเริ่มต้นของ Word (บรรทัดว่างท้ายเซลล์) */
  const FONT_PT = (pt) => "font-size:" + pt + "pt;mso-bidi-font-size:" + pt + "pt;";
  const FONT_CSS = "font-family:" + FONT + ";mso-ascii-font-family:'TH SarabunPSK';mso-hansi-font-family:'TH SarabunPSK';mso-bidi-font-family:'TH SarabunPSK';";
  const BOLD = "font-weight:bold;mso-bidi-font-weight:bold;";
  const CELL = "border:1px solid #000;padding:2pt 5pt;vertical-align:top;" + FONT_CSS + FONT_PT(16);
  const para = (html, extra) => '<p style="margin:0;line-height:1.15;' + FONT_CSS + (extra || FONT_PT(16)) + '">' + html + "</p>";
  function row(label, value) {
    return (
      "<tr>" +
      '<td width="34%" style="' + CELL + "width:34.5%;background:" + FILL + ";" + BOLD + '">' + para(b(label)) + "</td>" +
      '<td width="66%" style="' + CELL + 'width:65.5%">' + para(value || "&nbsp;") + "</td>" +
      "</tr>"
    );
  }
  const TITLE_ROW =
    '<tr><td colspan="2" style="' + CELL + "background:" + FILL + ";text-align:center;" + BOLD + '">' +
    para(b("สรุปการวิเคราะห์คดีที่คณะกรรมการ ป.ป.ท.<br>ได้มีการวินิจฉัยชี้มูลทางอาญาและวินัยและศาลได้มีคำพิพากษา"), "text-align:center;" + FONT_PT(20)) +
    "</td></tr>";
  const SAME_LABEL = "<br>(รายละเอียด /จำคุก เดือน ปี/ปรับ<br>(บาท)/ชดใช้/คืน (รวมดอกเบี้ย)/<br>หน่วยงานที่รับเงินคืน";

  /* แถวศาลในแบบสรุป: "MISCONDUCT" = ศาลแขวง/ศาลจังหวัด, "ADMIN" = ศาลปกครอง, "CORRUPTION" = ศาลคดีทุจริต
     ส่วนศาลปกครอง (ชั้น ADMIN_*) และประเภทศาลที่เลือกไว้ (court.type) มาก่อน ไม่มีค่อยเดาจากชื่อศาล */
  function courtRowOf(r) {
    const LS = global.ECMISVerdictLists;
    if (LS && LS.levelPart && LS.levelPart(r.level) === "ADMIN") return "ADMIN";
    const c = r.court || {};
    const CL = global.ECMISCourtLists;
    const type = CL ? CL.normalizeType(c.type, c.name) : c.type;
    if (type === "ADMIN") return "ADMIN";
    if (type === "DISTRICT" || type === "PROVINCIAL" || type === "MISCONDUCT") return "MISCONDUCT";
    if (type) return "CORRUPTION";
    return isMisconductCourt(c.name) ? "MISCONDUCT" : "CORRUPTION";
  }

  function bodyRows(k, ctx, rawRecs, d) {
    const fmt = d.formatDate || ((x) => x || "");
    const countAt = (lv) => rawRecs.filter((r) => r.level === lv).length;
    const recs = rawRecs.map((r) => Object.assign({}, r, { tag: levelName(r) + (countAt(r.level) > 1 ? " › " + r.person : "") }));
    const levels = recs.map((r) => r.level).filter((lv, i, all) => all.indexOf(lv) === i);
    const byLevel = levels.map((lv) => recs.filter((r) => r.level === lv));
    const misconduct = byLevel.filter((g) => courtRowOf(g[0]) === "MISCONDUCT");
    const corruption = byLevel.filter((g) => courtRowOf(g[0]) === "CORRUPTION");
    const admin = byLevel.filter((g) => courtRowOf(g[0]) === "ADMIN");
    const damage = recs.map((r) => r.fields && r.fields.damageValue).filter((v) => v !== "" && v != null);
    const persons = recs.map((r) => r.person).filter((p, i, all) => p && all.indexOf(p) === i);
    const accusedText = persons.length > 1 ? persons.join(", ") : ctx.accused;
    const agencyLine = [ctx.ministry, ctx.department, ctx.agency].filter(Boolean).join(" / ");
    const caseNo = [k.id, ctx.paccId ? "(สำนวนเดิม " + ctx.paccId + ")" : ""].filter(Boolean).join(" ");
    return (
      row("คดีเลขที่", esc(caseNo)) +
      row("คำสั่งไต่สวนข้อเท็จจริงฯ", orDots(ctx.inquiryOrderNo, "............./..............") + " ลงวันที่ " + orDots(ctx.inquiryOrderDate, "........................")) +
      row("ผู้รับผิดชอบสำนวนคดี", esc(ctx.officer)) +
      row("ชื่อผู้กล่าวหา", esc(ctx.accuser)) +
      row("ชื่อผู้ถูกกล่าวหา", esc(accusedText)) +
      row("หน่วยงานต้นสังกัดผู้ถูกกล่าวหา", esc(agencyLine)) +
      row("พฤติการณ์", esc(ctx.allegation)) +
      row(
        "ความเห็นคณะอนุกรรมการ<br>ไต่สวนข้อเท็จจริง",
        b("ความผิดทางอาญา") + " " + esc(ctx.subcommitteeCriminal) + "<br><br>" + b("ความผิดทางวินัย") + " " + esc(ctx.subcommitteeDisciplinary),
      ) +
      row("มติคณะกรรมการ ป.ป.ท.<br>วินิจฉัยชี้มูลไต่สวนข้อเท็จจริง", boardText(ctx)) +
      row("ฐานความผิดที่พนักงานอัยการส่ง<br>ฟ้อง", b("ฐานความผิดที่พนักงานอัยการส่งฟ้อง") + " " + esc(ctx.prosecutedOffenses)) +
      row(
        "คำพิพากษาศาลคดีประพฤติมิชอบ<br>(ศาลแขวง/ศาลจังหวัด)<br>" +
          courtNumbersLabel(misconduct.map((g) => g[0]), "อท....../.....", "อท...../...."),
        lines(misconduct.map((g) => courtVerdictLines(g, fmt))),
      ) +
      row(
        "คำพิพากษาศาลคดีทุจริต ในแต่ละ<br>ชั้น<br>(ศาลชั้นต้น/ศาลอุทธรณ์/ศาลฎีกา)<br>" +
          courtNumbersLabel(corruption.map((g) => g[0]), "อท....../.....", "อท...../...."),
        lines(corruption.map((g) => courtVerdictLines(g, fmt))),
      ) +
      /* ส่วนศาลปกครอง — แถวเพิ่มจากแบบฟอร์มเดิม แสดงเมื่อมีบันทึก */
      (admin.length
        ? row(
            "คำพิพากษาศาลปกครอง<br>(ศาลปกครองชั้นต้น/ศาลปกครองสูงสุด)<br>" +
              courtNumbersLabel(admin.map((g) => g[0]), "......./.....", "......./....."),
            lines(admin.map((g) => courtVerdictLines(g, fmt))),
          )
        : "") +
      row("ศาลพิพากษาลงโทษ", lines(recs.map((r) => b(esc(r.tag) + " " + esc(verdictWord(r.fields || {})))))) +
      row("ผลของคำพิพากษา" + SAME_LABEL, lines(recs.map(resultLine))) +
      row("การลงโทษจริง" + SAME_LABEL, lines(recs.map(actualLine))) +
      row("มูลค่าความเสียหาย", damage.length ? esc(R().money(damage[damage.length - 1])) + " บาท" : "") +
      row("ข้อมูลเกี่ยวกับคดีถึงที่สุด", lines(recs.map(finalLine))) +
      row("ข้อเสนอแนะทางคดี<br>ทั้งที่ประสบความสำเร็จและข้อพึง<br>ระวัง", esc(ctx.recommendation))
    );
  }

  function signatureRow(recs, d) {
    const last = latestRecord(recs);
    const summarizer = last ? last.updatedBy : "";
    const position = summarizer && d.titleOf ? d.titleOf(summarizer) : "";
    const blank = "..............................";
    const text =
      "ผู้รับผิดชอบสรุปการวิเคราะห์คดีที่คณะกรรมการ ป.ป.ท. ได้มีการวินิจฉัยชี้มูลและศาลได้มีคำพิพากษาแล้ว<br>" +
      "<u>" + orDots(summarizer, blank) + "</u> ตำแหน่ง <u>" + orDots(position, blank) + "</u>";
    return (
      '<tr><td colspan="2" style="' + CELL + "background:" + FILL + ";text-align:center;" + BOLD + 'padding:10pt 5pt">' +
      para(b(text), "text-align:center;" + FONT_PT(14)) +
      "</td></tr>"
    );
  }

  function buildSummaryHtml(kase, deps) {
    const d = deps || {};
    const k = kase || {};
    const ctx = R().buildContext(k, d);
    const recs = R().getRecords(k);
    const logo = d.logoSrc
      ? '<p style="text-align:center;margin:0 0 6pt"><img src="' + esc(d.logoSrc) + '" width="95" height="95" alt="ตราสำนักงาน ป.ป.ท."></p>'
      : "";
    return (
      '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>สรุปการวิเคราะห์คดี ' + esc(k.id || "") + "</title>" +
      "<style>@page{size:A4;margin:1cm 2.5cm 1.27cm 3cm}" +
      "body{" + FONT_CSS + FONT_PT(16) + "color:#000;margin:0}p{margin:0}" +
      "table.vd{width:100%;border-collapse:collapse}thead{display:table-header-group}tr{page-break-inside:avoid}" +
      "</style></head><body>" +
      logo +
      '<table class="vd" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">' +
      "<thead>" + TITLE_ROW + "</thead><tbody>" + bodyRows(k, ctx, recs, d) + signatureRow(recs, d) + "</tbody></table>" +
      '<p style="margin:4pt 0 0 14pt;' + FONT_CSS + FONT_PT(16) + BOLD + '">' +
      b("หมายเหตุ : กรุณาแนบไฟล์คำพิพากษาที่ใช้ในการสรุป ส่งไปยังอีเมล์<br>pacc.general@pacc.go.th") + "</p>" +
      "</body></html>"
    );
  }

  global.ECMISVerdictDoc = { buildSummaryHtml: buildSummaryHtml, isMisconductCourt: isMisconductCourt, DOCX_OPTIONS: DOCX_OPTIONS };
})(typeof window !== "undefined" ? window : globalThis);
