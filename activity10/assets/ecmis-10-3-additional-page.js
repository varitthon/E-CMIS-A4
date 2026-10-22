/* ECMIS 10.3 — หน้า "รับเรื่องเพิ่มเติม" (10-3-add-additional.html?id=&item=) 2026-10-22
   นิติกรจัดทำเอกสารสด 2 แบบ (ตามฉบับจริง ref doc 4 / 5) → พิมพ์ → ลงนามจริง → แนบสแกน → ออกเลข → ส่งอัยการ
     แบบ 4: บันทึกเสนอ (๑ ข้อเท็จจริง / ๒ ข้อเสนอ) + หนังสือถึงอัยการพิเศษฯ ลงนาม ผอ.กอง — เลขตั้งต้น ปป 0001/ (เลขกลาง)
     แบบ 5: บันทึกเสนอ (๑ เรื่องเดิม / ๒ ข้อเท็จจริง / ๓ ข้อเสนอ) + หนังสือถึงอธิบดีอัยการ ลงนามเลขาธิการ — ปป 0002/ (เลขกองกฎหมาย)
     ร่าง (ไม่บังคับ): คำให้การ / คำชี้แจงเพิ่มเติม แบบ ค.๓ (ECMIS103Docs.answer)
   ไม่เปลี่ยนสถานะคดีหลัก — บันทึกที่รายการใน case.l3AdditionalItems (ECMIS103Additional) */
(function (global) {
  "use strict";

  const WORK_ROLE = "case_legal_officer";
  const SIGNED_ALLOWED = ["pdf", "png", "jpg", "jpeg"];
  const FILE_ALLOWED = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];
  const PREFIXES = ["ปป 0001/", "ปป 0002/"];
  const NL = String.fromCharCode(10);

  const TEMPLATES = {
    "4": {
      prefix: "ปป 0001/",
      heads: ["๑. ข้อเท็จจริง", "๒. ข้อเสนอ", ""],
      opinions: [
        { role: "dir_legal", title: "ความเห็นผู้อำนวยการกองกฎหมาย", pos: "ผู้อำนวยการกองกฎหมาย" },
        { role: "deputy_sg", title: "ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท.", pos: "รองเลขาธิการ ปฏิบัติราชการแทน" + NL + "เลขาธิการคณะกรรมการ ป.ป.ท." },
      ],
      letterTo: "อัยการพิเศษฝ่ายคดีปกครอง",
      signer: { role: "dir_legal", pos: "ผู้อำนวยการกองกฎหมาย" },
      ctrl: ["ร่าง", "พิมพ์/ทาน", "ตรวจ"],
      closing: "จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ",
    },
    "5": {
      prefix: "ปป 0002/",
      heads: ["๑. เรื่องเดิม", "๒. ข้อเท็จจริง", "๓. ข้อเสนอ"],
      opinions: [
        { role: "case_group_director", title: "ความเห็นของผู้บังคับบัญชาชั้นต้น", pos: "ผู้อำนวยการกลุ่มงานคดี" },
        { role: "dir_legal", title: "ความเห็นผู้อำนวยการกองกฎหมาย", pos: "ผู้อำนวยการกองกฎหมาย" },
        { role: "deputy_sg", title: "ความเห็นเลขาธิการคณะกรรมการ ป.ป.ท.", pos: "รองเลขาธิการ ปฏิบัติราชการแทน" + NL + "เลขาธิการคณะกรรมการ ป.ป.ท." },
      ],
      letterTo: "อธิบดีอัยการ สำนักงานคดีปกครอง",
      signer: { role: "deputy_sg", pos: "รองเลขาธิการ ปฏิบัติราชการแทน" + NL + "เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ" },
      ctrl: ["ผู้อำนวยการกอง", "ผู้อำนวยการกลุ่ม", "เจ้าหน้าที่"],
      closing: "จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการต่อไป",
    },
  };

  /* ช่องกรอกของแต่ละเอกสาร: [id, label, type, extra] — แถวละ 1–2 ช่อง */
  const URGENCY = ["ด่วนที่สุด", "ด่วนมาก", "ด่วน", ""];
  const SECRECY = ["", "ลับ", "ลับมาก", "ลับที่สุด"];
  const COPY = ["สำเนา", ""];
  const SPEC = {
    memo: [
      [["m_urgency", "เอกสารเร่งด่วน", "select", URGENCY], ["m_secrecy", "ชั้นความลับ", "select", SECRECY]],
      [["m_division", "ส่วนราชการ", "text", { req: true }], ["m_phone", "โทร. (ผู้รับผิดชอบ)", "text"]],
      [["m_prefix", "เลขหนังสือ (ส่วนหน้า)", "prefix"], ["m_docNo", "ที่ (ออกเลข)", "docno", { req: true, date: "m_docDate" }]],
      [["m_docDate", "วันที่", "date", { req: true }]],
      [["m_subject", "เรื่อง", "text", { req: true }]],
      [["m_to", "เรียน", "text", { req: true }]],
      [["m_h1", "หัวข้อ 1", "text"]], [["m_s1", "", "editor"]],
      [["m_h2", "หัวข้อ 2", "text"]], [["m_s2", "", "editor"]],
      [["m_h3", "หัวข้อ 3 (เว้นว่าง = ไม่ใช้)", "text"]], [["m_s3", "", "editor"]],
      [["m_closing", "คำลงท้าย", "text"]],
      [["m_proposerName", "ผู้เสนอ (ชื่อในวงเล็บ)", "text"], ["m_proposerPos", "ตำแหน่งผู้เสนอ", "text"]],
      [["m_chairText", "ข้อความเสนอประธานกรรมการ ป.ป.ท.", "text"]],
    ],
    answer: [
      [["a_copyMark", "ประทับคำว่า", "select", ["", "สำเนา"]], ["a_subtitle", "ชื่อเอกสารกำกับ (ถ้ามี)", "text"]],
      [["a_respondentNo", "ผู้ถูกฟ้องคดีที่", "text", { req: true }], ["a_court", "ศาล", "text", { req: true }]],
      [["a_blackNo", "คดีหมายเลขดำที่", "text", { req: true }], ["a_redNo", "คดีหมายเลขแดงที่", "text"]],
      [["a_date", "วันที่", "date", { req: true }], ["a_submitType", "ขอยื่น", "text", { req: true }]],
      [["a_meName", "ข้าพเจ้า", "text", { req: true }], ["a_meRole", "ฐานะ", "text"]],
      [["a_address", "อยู่ที่", "text"], ["a_road", "ถนน", "text"]],
      [["a_subdistrict", "ตำบล/แขวง", "text"], ["a_district", "อำเภอ/เขต", "text"]],
      [["a_province", "จังหวัด", "text"], ["a_postcode", "รหัสไปรษณีย์", "text"]],
      [["a_phone", "โทรศัพท์", "text"]],
      [["a_body", "เนื้อความ (ข้อ ๑ … ข้อสุดท้าย)", "editor"]],
      [["a_signerName", "ผู้ลงนาม (ชื่อในวงเล็บ)", "text"], ["a_signerPos", "ตำแหน่งผู้ลงนาม", "text"]],
    ],
    letter: [
      [["l_copyMark", "ประทับคำว่า", "select", COPY], ["l_urgency", "เอกสารเร่งด่วน", "select", URGENCY]],
      [["l_prefix", "เลขหนังสือ (ส่วนหน้า)", "prefix"], ["l_docNo", "ที่ (ออกเลข)", "docno", { req: true, date: "l_docDate" }]],
      [["l_docDate", "วันที่", "date", { req: true }], ["l_address", "ส่วนราชการเจ้าของหนังสือ (ที่อยู่)", "textarea"]],
      [["l_subject", "เรื่อง", "text", { req: true }]],
      [["l_to", "เรียน", "text", { req: true }]],
      [["l_ref", "อ้างถึง", "text"]],
      [["l_enclosures", "สิ่งที่ส่งมาด้วย (บรรทัดละ 1 รายการ)", "textarea"]],
      [["l_body", "เนื้อความ", "editor"]],
      [["l_closing", "คำลงท้าย", "text"]],
      [["l_signerName", "ผู้ลงนาม (ชื่อในวงเล็บ)", "text"], ["l_signerPos", "ตำแหน่งผู้ลงนาม", "textarea"]],
      [["l_footer", "ท้ายหนังสือ (หน่วยงาน / โทร. / โทรสาร)", "textarea"]],
    ],
  };
  const DOC_KEYS = ["memo", "answer", "letter"];
  const LABELS = { memo: "บันทึกเสนอ", answer: "ร่าง (ค.๓)", letter: "หนังสือนำส่งอัยการ" };

  const st = {
    caseId: "", itemId: "", c: null, item: null, viewOnly: false, tpl: "4", active: "memo",
    editors: {}, initialHTML: {}, viewers: {}, signed: { memo: "", answer: "", letter: "" },
    extra: [], copies: [], timer: null,
  };

  /* ---------------------------------------------------------------- helpers */
  function $(id) { return document.getElementById(id); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function val(id) { const el = $(id); return el ? el.value : ""; }
  function setVal(id, v) { const el = $(id); if (el) el.value = v == null ? "" : v; }
  function editorHTML(id) { return st.editors[id] ? st.editors[id].getHTML() : st.initialHTML[id] || ""; }
  function editorText(id) {
    if (st.editors[id]) return st.editors[id].getText().trim();
    const box = document.createElement("div");
    box.innerHTML = st.initialHTML[id] || "";
    return box.textContent.trim();
  }
  function roleName(roleId) {
    const roles = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = roles.find(function (x) { return x.id === roleId; });
    return r ? r.name : "";
  }
  function plainName(full) { return String(full || "").replace(/\s*\(.*\)\s*$/, "").trim(); }
  function warn(title, text) {
    global.Swal.fire({ icon: "warning", title: title, text: text, confirmButtonColor: "#1e3a8a" });
  }
  function roleId() {
    try { return sessionStorage.getItem("ecmis_role") || ""; } catch (e) { return ""; }
  }
  function fieldIds(key) {
    const out = [];
    SPEC[key].forEach(function (row) { row.forEach(function (f) { if (f[2] !== "editor") out.push(f[0]); }); });
    return out;
  }
  function editorIds(key) {
    const out = [];
    SPEC[key].forEach(function (row) { row.forEach(function (f) { if (f[2] === "editor") out.push(f[0]); }); });
    return out;
  }

  /* ---------------------------------------------------------------- form markup */
  function controlHTML(f) {
    const id = f[0];
    const type = f[2];
    const x = f[3] || {};
    if (type === "select") return '<select id="' + id + '" class="form-control">' + x.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o || "ไม่มี / ปกติ") + "</option>"; }).join("") + "</select>";
    if (type === "prefix") return '<select id="' + id + '" class="form-control font-monospace">' + PREFIXES.map(function (p) { return '<option value="' + p + '">' + p + (p === "ปป 0001/" ? " — เลขกลาง" : " — เลขกองกฎหมาย") + "</option>"; }).join("") + "</select>";
    if (type === "docno") return '<input type="text" id="' + id + '" class="form-control font-monospace" data-doc-no="ปป 0001/" data-doc-no-date="' + x.date + '" />';
    if (type === "date") return '<input type="date" id="' + id + '" class="form-control" lang="th-TH-u-ca-buddhist" />';
    if (type === "textarea") return '<textarea id="' + id + '" class="form-control" rows="3"></textarea>';
    if (type === "editor") {
      return '<div class="l3-tiptap-wrap"><div class="l3-tiptap-toolbar" id="tb_' + id + '">' +
        '<button type="button" data-cmd="bold" title="ตัวหนา"><i class="fa-solid fa-bold"></i></button>' +
        '<button type="button" data-cmd="italic" title="ตัวเอียง"><i class="fa-solid fa-italic"></i></button>' +
        '<button type="button" data-cmd="bulletList" title="รายการหัวข้อ"><i class="fa-solid fa-list-ul"></i></button>' +
        '<button type="button" data-cmd="orderedList" title="รายการลำดับเลข"><i class="fa-solid fa-list-ol"></i></button>' +
        '</div><div id="' + id + '"></div></div>';
    }
    return '<input type="text" id="' + id + '" class="form-control" />';
  }

  function fieldHTML(f) {
    const x = f[3] || {};
    const label = f[1] ? '<label for="' + f[0] + '">' + esc(f[1]) + (x.req ? ' <span style="color:#dc2626">*</span>' : "") + "</label>" : "";
    return '<div class="form-group">' + label + controlHTML(f) + "</div>";
  }

  function paneHTML(key) {
    const rows = SPEC[key].map(function (row) {
      return row.length > 1 ? '<div class="form-grid-2">' + row.map(fieldHTML).join("") + "</div>" : fieldHTML(row[0]);
    }).join("");
    return (
      '<div class="l3-doc-pane" id="pane_' + key + '" data-doc="' + key + '"' + (key === "memo" ? "" : " hidden") + ">" +
      '<div class="l3-split l3-split--doc"><div class="l3-split-form l3-doc-form">' + rows + "</div>" +
      '<div id="preview_' + key + '"></div></div>' +
      '<div class="l3-signed-upload"><div class="l3-signed-upload-head"><i class="fa-solid fa-file-signature text-primary"></i>' +
      "<strong>ฉบับลงนามจริง — " + esc(LABELS[key]) + '</strong> <span style="color:#dc2626">*</span></div>' +
      '<div class="l3-signed-upload-hint">ดาวน์โหลด/พิมพ์ร่างด้านบน → ลงนามด้วยหมึก → สแกนแล้วแนบไฟล์ที่นี่ (PDF / รูปภาพ)</div>' +
      '<div class="l3-upload-box" id="signedBox_' + key + '"><input type="file" accept=".pdf,.png,.jpg,.jpeg" data-signed="' + key + '" /></div>' +
      '<div id="signedFile_' + key + '"></div></div></div>'
    );
  }

  /* ---------------------------------------------------------------- defaults */
  function defaults() {
    const c = st.c;
    const it = st.item;
    const D = global.ECMIS103Docs;
    const kind = global.ECMIS103Additional.typeOf(it.type);
    const draftName = it.type === "OTHER" && it.typeOther ? it.typeOther : kind.draft;
    const df = (c.defendants || []).filter(Boolean);
    const idx = df.findIndex(function (n) { return /ป\.ป\.ท|ป้องกันและปราบปรามการทุจริตในภาครัฐ/.test(n); });
    const respNo = String(idx >= 0 ? idx + 1 : 3);
    const court = c.courtName || "ศาลปกครอง……";
    const black = c.blackCaseNo || "……";
    const pl = (c.plaintiffs || []).filter(Boolean)[0] || "……";
    const parties = "ระหว่าง " + pl + " (ผู้ฟ้องคดี) กับ คณะกรรมการ ป.ป.ท. (ผู้ถูกฟ้องคดีที่ " + respNo + ") กับพวกรวม " + (df.length || "……") + " คน";
    const orderDate = D.thaiLongDate(it.orderDate) || "……";
    const due = D.thaiLongDate(it.dueDate) || "……";
    const officer = plainName(c.l3GroupAssignTarget || c.officer) || roleName(WORK_ROLE);
    const today = global.Activity103.toISODate(new Date());
    const p = function (t) { return "<p>" + esc(t) + "</p>"; };
    const order = court + " ได้มีหนังสือ/คำสั่ง ที่ " + it.orderNo + " ลงวันที่ " + orderDate + " ในคดีหมายเลขดำที่ " + black + " " + parties +
      " ให้คณะกรรมการ ป.ป.ท. ในฐานะผู้ถูกฟ้องคดีที่ " + respNo + " จัดทำ" + draftName + " ยื่นต่อศาล โดยต้องจัดส่งถึงพนักงานอัยการภายในวันที่ " + due;
    return {
      fields: {
        m_urgency: "ด่วนที่สุด", m_secrecy: "", m_division: "กกม. สำนักงาน ป.ป.ท.", m_phone: "1801 (" + officer.replace(/^(นาย|นางสาว|นาง)/, "").split(/\s+/)[0] + ")",
        m_prefix: TEMPLATES[st.tpl].prefix, m_docNo: "", m_docDate: today,
        m_subject: court + " มีคำสั่งให้ทำ" + draftName + " คดีหมายเลขดำที่ " + black,
        m_to: "ประธานกรรมการ ป.ป.ท. (ผ่านเลขาธิการคณะกรรมการ ป.ป.ท.)",
        m_closing: "จึงเรียนมาเพื่อโปรดพิจารณา", m_proposerName: officer, m_proposerPos: "นิติกรชำนาญการ",
        m_chairText: "เพื่อโปรดพิจารณาลงนามใน" + draftName + " ตามที่ กกม. เสนอ",
        a_copyMark: "", a_subtitle: "", a_respondentNo: respNo, a_court: court, a_blackNo: black, a_redNo: c.redCaseNo || "",
        a_date: today, a_submitType: draftName, a_meName: "คณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ", a_meRole: "ผู้ถูกฟ้องคดีที่ " + respNo,
        a_address: "สำนักงาน ป.ป.ท. อาคารซอฟต์แวร์ปาร์ค", a_road: "แจ้งวัฒนะ", a_subdistrict: "คลองเกลือ", a_district: "ปากเกร็ด",
        a_province: "นนทบุรี", a_postcode: "11120", a_phone: "0 2502 6585",
        a_signerName: plainName(roleName("chairman")), a_signerPos: "ประธานกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ",
        l_copyMark: "สำเนา", l_urgency: "ด่วนที่สุด", l_prefix: TEMPLATES[st.tpl].prefix, l_docNo: "", l_docDate: today,
        l_address: "สำนักงาน ป.ป.ท." + NL + "อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ" + NL + "อำเภอปากเกร็ด จังหวัดนนทบุรี 11120",
        l_subject: "ขอส่ง" + draftName + " คดีหมายเลขดำที่ " + black,
        l_ref: "หนังสือ/คำสั่ง ที่ " + it.orderNo + " ลงวันที่ " + orderDate,
        l_enclosures: draftName + " พร้อมเอกสารประกอบ จำนวน 3 ชุด",
        l_footer: "กลุ่มงานคดี กองกฎหมาย สำนักงาน ป.ป.ท." + NL + "โทร. 0 2502 6585" + NL + "โทรสาร 0 2502 6592 (" + officer + " นิติกรชำนาญการ)",
      },
      editors: {
        m_s1: p((st.tpl === "5" ? "" : "๑.๑ ") + order) + (st.tpl === "5" ? "" : p("๑.๒ กกม. ได้จัดทำ" + draftName + " ในคดีหมายเลขดำที่ " + black + " เรียบร้อยแล้ว")),
        m_s2: st.tpl === "5"
          ? p("กกม. ได้ดำเนินการจัดทำ" + draftName + " พร้อมด้วยพยานหลักฐานและเอกสารที่เกี่ยวข้อง ในคดีหมายเลขดำที่ " + black + " เสร็จเรียบร้อยแล้ว")
          : p("กกม. พิจารณาแล้ว เห็นควรเสนอประธานกรรมการ ป.ป.ท. เพื่อโปรดพิจารณาลงนามใน" + draftName + " และเสนอผู้อำนวยการกองกฎหมายลงนามในหนังสือถึงพนักงานอัยการ แนบท้ายบันทึกฉบับนี้"),
        m_s3: st.tpl === "5"
          ? p("เนื่องจาก กกม. ได้จัดทำ" + draftName + " เสร็จเรียบร้อยแล้ว จึงเห็นควรดำเนินการ ดังนี้") + p("๓.๑ เสนอประธานกรรมการ ป.ป.ท. ลงนามใน" + draftName) + p("๓.๒ เสนอเลขาธิการคณะกรรมการ ป.ป.ท. ลงนามในหนังสือถึงอธิบดีอัยการ สำนักงานคดีปกครอง แนบท้ายบันทึกฉบับนี้")
          : "",
        a_body: p("ข้อ ๑. ……"),
        l_body: p("ตามหนังสือที่อ้างถึง ท่านได้แจ้งว่า " + court + " มีคำสั่งให้คณะกรรมการ ป.ป.ท. ผู้ถูกฟ้องคดีที่ " + respNo + " จัดทำ" + draftName + " ในคดีหมายเลขดำที่ " + black + " ความละเอียดแจ้งแล้ว นั้น") +
          p("สำนักงาน ป.ป.ท. ในฐานะผู้ประสานคดีกับพนักงานอัยการ ขอส่ง" + draftName + " พร้อมเอกสารประกอบ มาเพื่อโปรดพิจารณาดำเนินการต่อไป รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย"),
      },
    };
  }

  /* ค่าที่ขึ้นกับแบบ (หัวข้อบันทึก / ผู้รับ / ผู้ลงนาม / เลขส่วนหน้า) — เปลี่ยนแบบแล้วตั้งใหม่ ไม่แตะเนื้อความ */
  function templateFields(t) {
    const T = TEMPLATES[t];
    return {
      m_h1: T.heads[0], m_h2: T.heads[1], m_h3: T.heads[2], m_prefix: T.prefix, l_prefix: T.prefix,
      l_to: T.letterTo, l_signerName: plainName(roleName(T.signer.role)), l_signerPos: T.signer.pos, l_closing: T.closing,
    };
  }

  /* ---------------------------------------------------------------- models */
  function blank(name, position) { return { sig: null, waitText: "", name: name, position: position }; }

  function buildModel(key) {
    const D = global.ECMIS103Docs;
    const T = TEMPLATES[st.tpl];
    if (key === "memo") {
      const sections = [1, 2, 3]
        .map(function (n) { return { heading: val("m_h" + n), html: editorHTML("m_s" + n) }; })
        .filter(function (s) { return s.heading.trim(); });
      const first = sections.length + 1;
      return D.memo({
        urgency: val("m_urgency"), secrecy: val("m_secrecy"), division: val("m_division"), phone: val("m_phone"),
        docNo: val("m_docNo") || val("m_prefix") + " — รอออกเลข", docDate: D.thaiLongDate(val("m_docDate")),
        subject: val("m_subject"), to: val("m_to"), sections: sections, closing: val("m_closing"),
        proposer: blank(val("m_proposerName"), val("m_proposerPos")),
        opinions: T.opinions.map(function (o, i) {
          return Object.assign({ no: String(first + i), title: o.title, text: "" }, blank(plainName(roleName(o.role)), o.pos));
        }),
        chair: {
          to: "ประธานกรรมการ ป.ป.ท.", text: val("m_chairText"),
          forwarder: blank(plainName(roleName("deputy_sg")), "รองเลขาธิการ ปฏิบัติราชการแทน" + NL + "เลขาธิการคณะกรรมการ ป.ป.ท."),
          sig: null, waitText: "", name: plainName(roleName("chairman")), position: "ประธานกรรมการ ป.ป.ท.",
        },
      });
    }
    if (key === "letter") {
      return D.letter({
        isCopy: val("l_copyMark") === "สำเนา", urgency: val("l_urgency"),
        docNo: val("l_docNo") || val("l_prefix") + " — รอออกเลข", address: val("l_address"),
        docDate: D.thaiLongDate(val("l_docDate")), subject: val("l_subject"), to: val("l_to"), ref: val("l_ref"),
        enclosures: val("l_enclosures").split(NL), html: editorHTML("l_body"), closing: val("l_closing"),
        signer: blank(val("l_signerName"), val("l_signerPos")),
        footer: val("l_footer").split(NL).filter(function (x) { return x.trim(); }),
        ctrl: T.ctrl.map(function (k) { return { key: k, value: "", date: "" }; }),
      });
    }
    const dp = D.dateParts(val("a_date"));
    return D.answer({
      isCopy: val("a_copyMark") === "สำเนา", subtitle: val("a_subtitle"), respondentNo: val("a_respondentNo"),
      blackNo: val("a_blackNo"), redNo: val("a_redNo") || "/๒๕....", court: val("a_court"),
      day: dp ? dp.day : "", month: dp ? dp.month : "", year: dp ? dp.year : "",
      plaintiffs: st.c.plaintiffs, defendants: st.c.defendants,
      me: {
        name: val("a_meName"), role: val("a_meRole"), address: val("a_address"), road: val("a_road"),
        subdistrict: val("a_subdistrict"), district: val("a_district"), province: val("a_province"),
        postcode: val("a_postcode"), phone: val("a_phone"),
      },
      submitType: val("a_submitType"), html: editorHTML("a_body"),
      signer: blank(val("a_signerName"), val("a_signerPos")),
      ctrl: [],
    });
  }

  function renderPreview() {
    const v = st.viewers[st.active];
    if (v) v.render(buildModel(st.active));
  }
  function scheduleRender() {
    clearTimeout(st.timer);
    st.timer = setTimeout(renderPreview, 150);
  }

  /* ---------------------------------------------------------------- tabs / template */
  function showDocTab(key) {
    if (key === "answer" && !$("in_useDraft").checked) return;
    st.active = key;
    document.querySelectorAll(".l3-doc-tab").forEach(function (b) { b.classList.toggle("is-active", b.dataset.tab === key); });
    DOC_KEYS.forEach(function (k) { $("pane_" + k).hidden = k !== key; });
    renderPreview();
  }

  function toggleDraftDoc() {
    const on = $("in_useDraft").checked;
    $("tabBtn_answer").hidden = !on;
    if (!on && st.active === "answer") showDocTab("memo");
  }

  function applyPrefix(key) {
    const input = $(key + "_docNo");
    const prefix = val(key + "_prefix");
    input.dataset.docNo = prefix;
    if (input.value) input.value = input.value.replace(/^ปป \d{4}\//, prefix);
  }

  function setTemplate(t, fromUser) {
    st.tpl = t;
    ["4", "5"].forEach(function (k) {
      const card = $("tplCard_" + k);
      card.classList.toggle("active-approve", k === t);
      card.querySelector("input").checked = k === t;
    });
    if (fromUser) {
      global.ECMIS103Docs.applyFields(templateFields(t));
      applyPrefix("m");
      applyPrefix("l");
      renderPreview();
    }
  }

  /* ---------------------------------------------------------------- files */
  function fileRow(name, onRemove) {
    return '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-paperclip me-2"></i>' + esc(name) + "</div>" +
      (st.viewOnly ? "" : '<button type="button" class="btn btn-secondary" style="height:28px;padding:0 10px;font-size:0.8em" data-rm="' + onRemove + '" aria-label="ลบไฟล์ ' + esc(name) + '"><i class="fa-solid fa-trash-can"></i></button>') +
      "</div>";
  }
  function pushFiles(list, input, allowed) {
    Array.from(input.files || []).forEach(function (f) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (allowed.indexOf(ext) < 0) return warn("ชนิดไฟล์ไม่ถูกต้อง", f.name);
      if (list.indexOf(f.name) < 0) list.push(f.name);
    });
    input.value = "";
  }
  function renderLists() {
    $("extraList").innerHTML = st.extra.map(function (n, i) { return fileRow(n, "extra:" + i); }).join("");
    $("copyList").innerHTML = st.copies.map(function (n, i) { return fileRow(n, "copy:" + i); }).join("");
  }
  function addExtraFiles(input) { pushFiles(st.extra, input, FILE_ALLOWED); renderLists(); }
  function addCopyFiles(input) { pushFiles(st.copies, input, SIGNED_ALLOWED); renderLists(); }

  function renderSigned(key) {
    const name = st.signed[key];
    $("signedFile_" + key).innerHTML = name
      ? '<div class="l3-attachment-row"><div class="l3-attachment-name"><i class="fa-solid fa-file-signature me-2"></i>' + esc(name) + "</div>" +
        (st.viewOnly ? "" : '<button type="button" class="btn btn-secondary" style="height:28px;padding:0 10px;font-size:0.8em" data-rm="signed:' + key + '" aria-label="ลบไฟล์ลงนามจริง"><i class="fa-solid fa-trash-can"></i></button>') + "</div>"
      : st.viewOnly ? '<div class="read-box l3-optional">ไม่มีเอกสารแนบ</div>' : "";
    $("signedBox_" + key).classList.toggle("d-none", !!name || st.viewOnly);
    const s = $("tabState_" + key);
    s.classList.toggle("is-done", !!name);
    s.innerHTML = name ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    s.title = name ? "แนบฉบับลงนามจริงแล้ว" : "ยังไม่แนบฉบับลงนามจริง";
  }

  function onClick(e) {
    const b = e.target.closest("[data-rm]");
    if (!b || st.viewOnly) return;
    const parts = b.getAttribute("data-rm").split(":");
    if (parts[0] === "extra") st.extra.splice(+parts[1], 1);
    if (parts[0] === "copy") st.copies.splice(+parts[1], 1);
    if (parts[0] === "signed") { st.signed[parts[1]] = ""; renderSigned(parts[1]); }
    renderLists();
  }

  function onSignedChange(e) {
    const input = e.target;
    const key = input.dataset && input.dataset.signed;
    if (!key) return;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (SIGNED_ALLOWED.indexOf(ext) < 0) return warn("ชนิดไฟล์ไม่ถูกต้อง", "ฉบับลงนามจริงรองรับ " + SIGNED_ALLOWED.join(", ").toUpperCase());
    st.signed[key] = file.name;
    renderSigned(key);
  }

  /* ---------------------------------------------------------------- send method */
  function toggleSendMethod() {
    const m = val("in_sendMethod");
    $("grp_post").classList.toggle("d-none", m !== "post");
    $("grp_hand").classList.toggle("d-none", m !== "hand");
  }

  /* ---------------------------------------------------------------- collect / save */
  function collectDocs() {
    const D = global.ECMIS103Docs;
    const out = {};
    DOC_KEYS.forEach(function (k) {
      const eds = {};
      editorIds(k).forEach(function (id) { eds[id] = editorHTML(id); });
      out[k] = { label: LABELS[k], fields: D.collectFields(fieldIds(k)), editors: eds, signedFileName: st.signed[k] };
    });
    return out;
  }

  function sendInfo() {
    return {
      method: val("in_sendMethod"), sentDate: val("in_sentDate"), emsTracking: val("in_emsTracking"),
      handDate: val("in_handDate"), handLocation: val("in_handLocation"), copyFiles: st.copies.slice(), notes: val("in_sendNotes"),
    };
  }

  function nextItem(patch) {
    return Object.assign({}, st.item, {
      template: st.tpl,
      useDraft: $("in_useDraft").checked,
      docs: collectDocs(),
      extraFiles: st.extra.slice(),
      sendDraft: sendInfo(),
    }, patch || {});
  }

  function saveDraftAll() {
    if (st.viewOnly) return;
    const now = global.ECMIS103.formatThaiDateTime(new Date());
    st.item = global.ECMIS103Additional.saveItem(st.caseId, nextItem({
      status: st.item.status === "RECEIVED" ? "DRAFTING" : st.item.status,
      draftSavedAt: now,
    }));
    $("f_draftMeta").textContent = "บันทึกร่างล่าสุด " + now;
    renderHeader();
    global.Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกร่างแล้ว " + now, showConfirmButton: false, timer: 2200 });
  }

  function validate() {
    const useDraft = $("in_useDraft").checked;
    const req = [
      ["m_division", "ส่วนราชการ (บันทึกเสนอ)"], ["m_docNo", "ที่ — ออกเลข (บันทึกเสนอ)"], ["m_docDate", "วันที่ (บันทึกเสนอ)"],
      ["m_subject", "เรื่อง (บันทึกเสนอ)"], ["m_to", "เรียน (บันทึกเสนอ)"],
      ["l_docNo", "ที่ — ออกเลข (หนังสือนำส่ง)"], ["l_docDate", "วันที่ (หนังสือนำส่ง)"], ["l_subject", "เรื่อง (หนังสือนำส่ง)"], ["l_to", "เรียน (หนังสือนำส่ง)"],
    ].concat(useDraft ? [["a_respondentNo", "ผู้ถูกฟ้องคดีที่ (ร่าง)"], ["a_court", "ศาล (ร่าง)"], ["a_blackNo", "คดีหมายเลขดำ (ร่าง)"], ["a_date", "วันที่ (ร่าง)"], ["a_meName", "ข้าพเจ้า (ร่าง)"], ["a_submitType", "ขอยื่น (ร่าง)"]] : []);
    for (let i = 0; i < req.length; i++) if (!val(req[i][0]).trim()) return req[i][1];
    if (!editorText("m_s1")) return "เนื้อความหัวข้อ 1 (บันทึกเสนอ)";
    if (!editorText("l_body")) return "เนื้อความ (หนังสือนำส่ง)";
    if (useDraft && !editorText("a_body")) return "เนื้อความ (ร่าง)";
    const need = useDraft ? DOC_KEYS : ["memo", "letter"];
    for (let i = 0; i < need.length; i++) if (!st.signed[need[i]]) return "แนบฉบับลงนามจริง — " + LABELS[need[i]];
    const m = val("in_sendMethod");
    if (!m) return "วิธีการจัดส่ง";
    if (m === "post" && !val("in_sentDate")) return "วันที่ส่ง";
    if (m === "hand" && (!val("in_handDate") || !val("in_handLocation").trim())) return "วันที่และสถานที่นำส่ง";
    if (!st.copies.length) return "สำเนาหนังสือนำส่ง (ฉบับที่ส่งแล้ว)";
    return "";
  }

  function submitSend() {
    if (st.viewOnly) return;
    const missing = validate();
    if (missing) return warn("ข้อมูลไม่ครบถ้วน", "กรุณากรอก/แนบ: " + missing);
    const s = sendInfo();
    global.Swal.fire({
      icon: "question",
      title: "ยืนยันส่งพนักงานอัยการ?",
      html: '<div class="emd-summary">' +
        "<p><strong>เรื่อง:</strong> " + esc(global.ECMIS103Additional.typeLabel(st.item)) + " (" + esc(st.item.orderNo) + ")</p>" +
        "<p><strong>บันทึกเสนอ:</strong> " + esc(val("m_docNo")) + " · <strong>หนังสือนำส่ง:</strong> " + esc(val("l_docNo")) + "</p>" +
        "<p><strong>วิธีจัดส่ง:</strong> " + (s.method === "post" ? "ไปรษณีย์ " + esc(s.emsTracking || "") : "ส่งด้วยตนเอง — " + esc(s.handLocation)) + "</p>" +
        '<p class="emd-strong-ok"><strong>สถานะ:</strong> ปิดเรื่องเพิ่มเติม — คดีหลักไม่เปลี่ยนสถานะ</p></div>',
      showCancelButton: true,
      confirmButtonText: "ยืนยันส่ง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#64748b",
    }).then(function (res) {
      if (!res.isConfirmed) return;
      global.ECMIS103.openSignatureModal(
        { title: "ลงนามยืนยันส่งเอกสารเพิ่มเติมถึงพนักงานอัยการ", signer: global.ECMIS103.signerLabel(WORK_ROLE), certId: "PACC-CASELEGAL-2569-103A" },
        function (image) {
          global.ECMIS103Additional.saveItem(st.caseId, nextItem({
            status: "SENT",
            send: Object.assign({}, s, { sentAt: global.ECMIS103.formatThaiDateTime(new Date()), sentBy: global.ECMIS103.signerLabel(WORK_ROLE), signImage: image }),
            memoDocNo: val("m_docNo"),
            letterDocNo: val("l_docNo"),
          }));
          global.Swal.fire({ icon: "success", title: "ส่งพนักงานอัยการแล้ว", text: "ปิดเรื่องเพิ่มเติมเรียบร้อย — คดีหลักดำเนินต่อตามเดิม", timer: 2000, showConfirmButton: false })
            .then(function () { location.href = backUrl(); });
        },
      );
    });
  }

  function backUrl() {
    const page = global.Activity103.ROUTES[st.c.statusCode];
    return page ? page + "?id=" + encodeURIComponent(st.c.id) : "01-work-inbox.html";
  }

  /* ---------------------------------------------------------------- populate */
  function renderHeader() {
    const S = global.ECMIS103Additional.STATUS[st.item.status] || global.ECMIS103Additional.STATUS.RECEIVED;
    $("f_headCase").textContent = st.c.id;
    $("f_headStatus").className = "badge " + S.cls;
    $("f_headStatus").textContent = S.label;
    $("f_headDue").textContent = global.ECMIS103.formatThaiDate(st.item.dueDate) || "-";
  }

  function populateInfo() {
    const E = global.ECMIS103;
    const c = st.c;
    const it = st.item;
    E.setText("f_caseNo", c.id);
    E.setText("f_courtName", c.courtName);
    E.setText("f_blackCaseNo", c.blackCaseNo);
    E.renderPartyList("f_plaintiffs", c.plaintiffs);
    E.renderPartyList("f_defendants", c.defendants);
    E.setText("f_mainStatus", c.status);
    E.setText("f_officer", c.l3GroupAssignTarget || c.officer);
    E.setText("f_itemType", global.ECMIS103Additional.typeLabel(it));
    E.setText("f_itemOrderNo", it.orderNo);
    E.setText("f_itemOrderDate", it.orderDate ? E.formatThaiDate(it.orderDate) : "-");
    E.setText("f_itemDue", it.dueDate ? E.formatThaiDate(it.dueDate) : "-");
    E.setText("f_itemBy", (it.recordedBy || "-") + " เมื่อ " + (it.recordedAt || "-"));
    E.setText("f_itemNote", it.note || "-");
    E.renderAttachments("f_itemFiles", it.files);
    $("f_itemExtra").innerHTML = global.ECMIS103Additional.extraFieldsHTML(it.extraFields);
    renderHeader();
    $("btnBack").href = backUrl();
  }

  function restoreSend() {
    const s = st.item.send || st.item.sendDraft || {};
    setVal("in_sendMethod", s.method || "");
    setVal("in_sentDate", s.sentDate || global.Activity103.toISODate(new Date()));
    setVal("in_emsTracking", s.emsTracking || "");
    setVal("in_handDate", s.handDate || global.Activity103.toISODate(new Date()));
    setVal("in_handLocation", s.handLocation || "");
    setVal("in_sendNotes", s.notes || "");
    st.copies = (s.copyFiles || []).slice();
    toggleSendMethod();
  }

  function initDocs() {
    const D = global.ECMIS103Docs;
    $("docPanes").innerHTML = DOC_KEYS.map(paneHTML).join("");
    const base = defaults();
    const fields = Object.assign({}, base.fields, templateFields(st.tpl));
    const eds = Object.assign({}, base.editors);
    const saved = st.item.docs || {};
    DOC_KEYS.forEach(function (k) {
      if (!saved[k]) return;
      Object.assign(fields, saved[k].fields || {});
      Object.assign(eds, saved[k].editors || {});
      st.signed[k] = saved[k].signedFileName || "";
    });
    st.initialHTML = eds;
    D.applyFields(fields);
    applyPrefix("m");
    applyPrefix("l");
    if (global.ECMISDocNo) global.ECMISDocNo.attachAll($("docPanes"));
    ["m", "l"].forEach(function (k) { $(k + "_prefix").addEventListener("change", function () { applyPrefix(k); scheduleRender(); }); });

    const black = st.c.blackCaseNo || "";
    DOC_KEYS.forEach(function (k) {
      st.viewers[k] = D.createViewer("preview_" + k, { title: LABELS[k], editTarget: SPEC[k][0][0][0], fileName: LABELS[k] + " " + black });
      renderSigned(k);
    });
    $("docPanes").addEventListener("input", scheduleRender);
    $("docPanes").addEventListener("change", function (e) {
      if (e.target.dataset && e.target.dataset.signed) return onSignedChange(e);
      scheduleRender();
    });
    if (st.viewOnly) document.querySelectorAll("#docPanes input, #docPanes select, #docPanes textarea").forEach(function (el) { el.disabled = true; });

    const ids = [];
    DOC_KEYS.forEach(function (k) { editorIds(k).forEach(function (id) { ids.push(id); }); });
    Promise.all(ids.map(function (id) {
      return global.ECMIS103.mountEditor(id, {
        toolbarId: "tb_" + id, initialHTML: eds[id] || "", placeholder: "พิมพ์ข้อความ...", onUpdate: scheduleRender,
      }).then(function (ed) {
        st.editors[id] = ed;
        if (ed && st.viewOnly) ed.setEditable(false);
      });
    })).then(renderPreview);
    renderPreview();
  }

  function applyViewMode() {
    if (!st.viewOnly) return;
    const it = st.item;
    $("viewModeNotice").classList.remove("d-none");
    $("f_viewText").innerHTML = it.status === "SENT"
      ? "<strong>ส่งพนักงานอัยการแล้ว (ดูอย่างเดียว)</strong><br />โดย " + esc((it.send || {}).sentBy || "-") + " เมื่อ " + esc((it.send || {}).sentAt || "-")
      : "<strong>ดูอย่างเดียว</strong> — นิติกรเจ้าของสำนวนเป็นผู้จัดทำเรื่องเพิ่มเติม";
    document.querySelectorAll("#tplGrid input, #in_useDraft, #sendCard input, #sendCard select, #sendCard textarea").forEach(function (el) { el.disabled = true; });
    ["extraBox", "copyBox"].forEach(function (id) { $(id).classList.add("d-none"); });
    document.querySelectorAll("#actionBar .btn-primary, #actionBar .btn-secondary:not(#btnBack)").forEach(function (b) { b.classList.add("d-none"); });
  }

  function init() {
    const E = global.ECMIS103;
    const q = new URLSearchParams(location.search);
    st.caseId = q.get("id") || "";
    st.itemId = q.get("item") || "";
    E.initUserProfile();
    E.renderSidebarMenu("sidebarMenu", "10-3-add-additional.html");
    st.c = global.ECMIS103Additional.findCase(st.caseId);
    st.item = st.c ? global.ECMIS103Additional.getItem(st.c, st.itemId) : null;
    if (!st.c || !st.item) {
      $("noCaseNotice").classList.remove("d-none");
      $("pageBody").classList.add("d-none");
      return;
    }
    st.viewOnly = q.get("view") === "1" || roleId() !== WORK_ROLE || st.item.status === "SENT";
    st.tpl = st.item.template || "4";
    st.extra = (st.item.extraFiles || []).slice();
    setTemplate(st.tpl, false);
    $("in_useDraft").checked = st.item.useDraft !== false;
    populateInfo();
    restoreSend();
    initDocs();
    toggleDraftDoc();
    renderLists();
    if (st.item.draftSavedAt) $("f_draftMeta").textContent = "บันทึกร่างล่าสุด " + st.item.draftSavedAt;
    document.getElementById("pageBody").addEventListener("click", onClick);
    if (global.ECMISShipping) {
      global.ECMISShipping.link({
        field: "in_emsTracking",
        key: "add-" + st.itemId,
        getCase: function () { return global.ECMIS103Additional.findCase(st.caseId); },
        active: function () { return val("in_sendMethod") === "post"; },
        submit: "#btnSend",
        readOnly: st.viewOnly,
      });
    }
    applyViewMode();
  }

  document.addEventListener("DOMContentLoaded", init);

  Object.assign(global, {
    showDocTab: showDocTab,
    toggleDraftDoc: toggleDraftDoc,
    setTemplate: setTemplate,
    addExtraFiles: addExtraFiles,
    addCopyFiles: addCopyFiles,
    toggleSendMethod: toggleSendMethod,
    saveDraftAll: saveDraftAll,
    submitSend: submitSend,
  });
})(window);
