/* ข้อมูลนำเข้าจากระบบเดิม (Data Migration) — อ่านอย่างเดียว ไม่แก้ข้อมูลสำนวน
   - กจ.5 (4.6 กระบวนการเรื่องร้องเรียนกล่าวหา, IMS) + กจ.6 (4.7 คุ้มครองพยาน, File Storage)
     ⇒ สำนวน ป.ป.ท. ที่นำเข้า (paccCases) + แผง "ข้อมูลจากระบบเดิม" (renderImsPanel)
     แสดงในรายละเอียดสำนวนเดิมทั้งผลค้นหา (ecmis-case-search.js) และการ์ดสำนวนที่เลือกในหน้า 02
   - กจ.10 (4.11 กระบวนการด้านกฎหมายในทางคดี, IMS) ⇒ แหล่งค้นหา "ข้อมูลระบบเดิม (กองกฎหมาย)" (lawSource)
     แท็บที่ 3 ในหน้า search-case.html
   ค่าตัวอย่างตามไฟล์ Data_Migration_กจ.5 / กจ.6 / กจ.10_v2 (ข้อมูลสมมติ) */
(function (global) {
  "use strict";

  const PLACEHOLDER = "assets/placeholder-document.pdf";
  const RUN_ID = "RUN-2026-001";

  /* ------------------------------------------------------------ กจ.5 + กจ.6 (IMS)
     key = เลขสำนวนคดี ป.ป.ท. · ฟิลด์ตามชีต Data Migration (ตาราง/ฟิลด์ต้นทาง) */
  const IMS_CASES = {
    "9125/2567": {
      imsId: "90125",
      caseNo: "9125/2567",
      receiveNo: "9512/2567",
      trackingNo: "",
      trackingNote: "เรื่องจากสายด่วน 1206 — ไม่มีเลขติดตาม",
      subject: "ทุจริตการจัดซื้อจัดจ้าง โครงการจัดซื้อครุภัณฑ์คอมพิวเตอร์",
      detail:
        "กล่าวหาว่านักวิชาการพัสดุชำนาญการ กรมสุขภาพจิต เรียกรับเงินจากผู้รับจ้างและกำหนดคุณลักษณะเฉพาะเพื่อเอื้อประโยชน์แก่ผู้เสนอราคารายหนึ่ง",
      status: { code: "700", label: "ชี้มูลแล้ว" },
      inquirySub: "6. จัดส่งมติเรียบร้อยแล้ว/ลงข้อมูลในสารบบคุมแล้ว",
      investigationSub:
        "12. จัดส่งรายงานวินิจฉัยชี้มูลและหนังสือแจ้งให้ดำเนินการทางวินัยแล้ว/ลงข้อมูลในสารบบคุมแล้ว",
      zone: "ปปท. เขต 4",
      offence: "ม.157 ปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยมิชอบ",
      shortestOffence: "ม.157 (อายุความตัวการ 15 ปี)",
      incidentStart: "2023-06-15",
      incidentEnd: "2023-09-30",
      incidentNote: "ช่วงการเสนอราคาและตรวจรับงาน",
      receivedDate: "2024-03-08",
      openDate: "2024-03-12",
      expireDate: "2043-06-14",
      place: "สำนักงานในสังกัดกรมสุขภาพจิต ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น 40000",
      nature: "ทุจริตการจัดซื้อจัดจ้าง",
      damage: 450000,
      accuser: "นางสาวกนกวรรณ ใจซื่อ",
      accused: "นายสมชาย ทำงานดี",
      accusedOrg: "กองคลัง กรมสุขภาพจิต กระทรวงสาธารณสุข",
      officer: "วีระพงษ์ ขยันยิ่ง",
      assignedBy: "ผู้อำนวยการ ปปท. เขต 4",
      assignedDate: "2024-03-15",
      assignNote: "มอบไต่สวนเบื้องต้น",
      history: [
        ["2024-03-12", "รับเรื่องร้องเรียน", "ปวีณา บันทึกไว"],
        ["2024-09-10", "บันทึกความก้าวหน้า ชั้นแสวง", "ปวีณา บันทึกไว"],
        ["2024-10-15", "บันทึกมติ รับ/ไม่รับ ไว้ไต่สวน โดยมีผลมติคือ รับไว้ไต่สวน", "ปวีณา บันทึกไว"],
        ["2025-07-30", "บันทึกความก้าวหน้า ชั้นไต่สวน", "ปวีณา บันทึกไว"],
        ["2025-08-15", "ส่งรายงานการไต่สวนข้อเท็จจริง", "ปวีณา บันทึกไว"],
        ["2025-08-26", "บันทึกมติชี้มูล โดยมีผลมติคือ ผิดอาญาและวินัย", "ปวีณา บันทึกไว"],
        ["2025-09-05", "อัพเดทสถานะย่อยชั้นไต่สวน 12. จัดส่งรายงานวินิจฉัยชี้มูลและหนังสือแจ้งให้ดำเนินการทางวินัยแล้ว", "ปวีณา บันทึกไว"],
        ["2025-09-10", "บันทึก หนังสือนำส่งมติและหนังสือนำส่งรายงานวินิจฉัยชี้มูล", "ปวีณา บันทึกไว"],
      ],
      orders: [
        {
          type: "มอบหมายพนักงาน ป.ป.ท.ไต่สวนข้อเท็จจริงเบื้องต้น",
          no: "9141/2567", signDate: "2024-04-01",
          letterNo: "ปป 0013/9152", letterDate: "2024-04-03",
          officer: "วีระพงษ์ ขยันยิ่ง", members: [], remark: "ส่งด้วยตนเอง",
        },
        {
          type: "แต่งตั้งอนุกรรมการไต่สวนข้อเท็จจริง",
          no: "9468/2567", signDate: "2024-11-20",
          letterNo: "ปป 0013/9301", letterDate: "2024-11-22",
          officer: "วีระพงษ์ ขยันยิ่ง",
          members: [
            ["นายประเสริฐ ตรงไปตรงมา", "ประธานอนุกรรมการ"],
            ["นางสาวมาลัย รอบคอบ", "อนุกรรมการ"],
            ["นายวีระพงษ์ ขยันยิ่ง", "อนุกรรมการและเลขานุการ"],
          ],
          remark: "EMS ET000000011TH",
        },
      ],
      resolutions: [
        {
          kind: "มติรับไว้ไต่สวน", meeting: "41/2567", agenda: "5.3", date: "2024-10-15",
          result: "รับไว้ไต่สวน — แต่งตั้งอนุกรรมการไต่สวนข้อเท็จจริง",
          detail: "พฤติการณ์มีมูลเพียงพอ ให้แต่งตั้งอนุกรรมการไต่สวน",
          letterNo: "ปป 0004/9411", letterDate: "2024-10-25", remark: "ส่งทาง EMS",
        },
        {
          kind: "มติชี้มูล", meeting: "35/2568", agenda: "5.7", date: "2025-08-26",
          result: "ผิดอาญาและวินัย",
          detail: "ให้ส่งรายงานและสำนวนไปยังอัยการสูงสุดเพื่อยื่นฟ้องคดีต่อศาล",
          criminal: "การกระทำของผู้ถูกกล่าวหามีมูลเป็นความผิดตาม ม.151 และ ม.157 ประมวลกฎหมายอาญา",
          discipline: "การกระทำของผู้ถูกกล่าวหามีมูลเป็นความผิดวินัยอย่างร้ายแรง",
          sendTo: "ส่งพนักงานอัยการและหน่วยงานต้นสังกัด",
          letterNo: "ปป 0004/9620", letterDate: "2025-09-05", remark: "ส่งกลุ่มงานกิจการคณะกรรมการ",
        },
      ],
      dispatches: [
        {
          type: "หนังสือนำส่งอัยการ", no: "ปป 0004/9655", set: "1", date: "2025-09-10",
          to: "อัยการสูงสุด", ems: "EX 0000 0002 9 TH", remark: "ส่งรายงานการไต่สวนและสำนวนพร้อมเอกสาร",
        },
      ],
      progress: [
        ["2024-09-10", "ชั้นแสวง (ไต่สวนเบื้องต้น)", "รายงานการไต่สวนเบื้องต้น", "รวบรวมพยานเอกสารสัญญาซื้อขาย และสอบปากคำผู้เสนอราคา 3 ราย", "วีระพงษ์ ขยันยิ่ง"],
        ["2025-03-18", "ชั้นไต่สวน", "รวบรวมพยานหลักฐานชั้นไต่สวน", "สอบพยานบุคคล 5 ปาก พยานผู้ร้องขอคุ้มครองตามแบบ คบ.1", "ประเสริฐ ตรงไปตรงมา"],
        ["2025-07-30", "ชั้นไต่สวน", "เสนอรายงานไต่สวน 644", "คณะอนุกรรมการไต่สวนสรุปพยานหลักฐาน เห็นว่ามีมูลความผิดอาญา ม.151 ม.157 และวินัยอย่างร้ายแรง", "ประเสริฐ ตรงไปตรงมา"],
        ["2025-09-12", "ชั้นไต่สวน", "ส่งรายงานและสำนวนให้อัยการสูงสุด", "ส่งสำนวนตามหนังสือ ปป 0004/9655 ลงวันที่ 10 ก.ย. 2568", "ประเสริฐ ตรงไปตรงมา"],
      ],
      /* tbl_mg_file_transfer_log — code = doc_category ต้นทาง, type = ประเภทเอกสารปลายทาง (VM-06) */
      files: [
        { id: "F-0001", code: "B04", type: "รายงาน 213", name: "รายงาน213_9125-2567.pdf", size: 1245800, mtime: "2024-09-10 09:30", src: "\\\\NAS\\ปปท_เขต4\\09125-2567\\B04_รายงาน 213\\รายงาน213_9125-2567.pdf" },
        { id: "F-0002", code: "C10", type: "รายงานไต่สวน (644)", name: "รายงาน644_9125-2567.pdf", size: 2350112, mtime: "2025-08-27 10:00", src: "\\\\NAS\\ปปท_เขต4\\09125-2567\\C10_รายงานไต่สวน (644)\\9125-2567.pdf" },
      ],
      /* กจ.6 — คุ้มครองพยาน (tbl_wit_*) */
      witness: {
        unit: "ปปท. เขต 4",
        receivedAt: "2025-01-20 14:30",
        files: [
          { id: "F-0101", code: "KB01", type: "คบ.1 คำร้องขอให้คุ้มครองพยาน", name: "คบ1_คำร้องขอคุ้มครองพยาน.pdf", version: "v1", src: "\\\\NAS\\กจ06_คุ้มครองพยาน\\ปปท.4\\9125-2567\\คบ.1\\คบ1_คำร้องขอคุ้มครองพยาน.pdf" },
        ],
      },
    },
  };

  /* ------------------------------------------------------------ กจ.10 (IMS → tbl_law_*)
     หนึ่งรายการต่อหนังสือนำส่ง · paccCaseNo ตรงกับ IMS_CASES ⇒ รายละเอียดแสดงประวัติสำนวนเดิมด้วย */
  const LAW_RECORDS = [
    {
      id: "IMS-97001", dispatchId: "97001", imsCaseId: "90125", paccCaseNo: "9125/2567",
      title: "ทุจริตการจัดซื้อจัดจ้าง โครงการจัดซื้อครุภัณฑ์คอมพิวเตอร์",
      accuser: "นางสาวกนกวรรณ ใจซื่อ",
      accused: [{ name: "นายสมชาย ทำงานดี", role: "ตัวการ", finding: "ผิดอาญาและวินัย", unit: "กองคลัง", dept: "กรมสุขภาพจิต", ministry: "กระทรวงสาธารณสุข" }],
      dispatchNo: "ปป 0004/9655", dispatchSet: "1", dispatchDate: "2025-09-10", recordedAt: "2025-09-10 11:00",
      to: "อัยการสูงสุด", letterType: "หนังสือนำส่งอัยการ", ems: "EX 0000 0002 9 TH",
      remark: "ส่งรายงานการไต่สวนและสำนวนพร้อมเอกสาร", recordedBy: "ปวีณา บันทึกไว",
      files: [
        { id: "F-0401", code: "C12", type: "หนังสือส่งอัยการ", name: "นำส่งอัยการ_9125-2567.pdf", size: 210500, mtime: "2025-10-01 09:00" },
        { id: "F-0402", code: "รวม", type: "สำนวนคดีไฟล์รวม (ทั้งสำนวนที่ส่งอัยการ)", name: "สำนวนคดีไฟล์รวม_9125-2567_ส่งอัยการ.pdf", size: 486250310, mtime: "2025-09-08 16:40",
          note: "รายงาน 213 (B04) → มติรับไว้ไต่สวน (B05) → คำสั่งแต่งตั้งอนุกรรมการ (C01) → บันทึกแจ้งข้อกล่าวหา (C05) → คำให้การพยานและเอกสารหลักฐาน → รายงานไต่สวน 644 (C10) → มติชี้มูล (C11) → หนังสือส่งอัยการ (C12)" },
      ],
    },
    {
      id: "IMS-96412", dispatchId: "96412", imsCaseId: "88402", paccCaseNo: "8840/2566",
      title: "เรียกรับเงินเพื่อออกใบอนุญาตก่อสร้างอาคาร เทศบาลตำบลบ้านไร่",
      accuser: "นายอำนาจ ซื่อตรง",
      accused: [
        { name: "นายธนพล มั่งมี", role: "ตัวการ", finding: "ผิดอาญาและวินัย", unit: "กองช่าง", dept: "เทศบาลตำบลบ้านไร่", ministry: "กระทรวงมหาดไทย" },
        { name: "นางสาวรัตนา คล้อยตาม", role: "ผู้สนับสนุน", finding: "ผิดวินัย", unit: "กองช่าง", dept: "เทศบาลตำบลบ้านไร่", ministry: "กระทรวงมหาดไทย" },
      ],
      dispatchNo: "ปป 0004/8120", dispatchSet: "1", dispatchDate: "2024-06-21", recordedAt: "2024-06-21 14:20",
      to: "สำนักงานอัยการคดีปราบปรามการทุจริตภาค 6", letterType: "หนังสือนำส่งอัยการ", ems: "EX 0000 0001 4 TH",
      remark: "ส่งรายงานการไต่สวนพร้อมสำนวน", recordedBy: "ปวีณา บันทึกไว",
      files: [{ id: "F-0377", code: "C12", type: "หนังสือส่งอัยการ", name: "นำส่งอัยการ_8840-2566.pdf", size: 198400, mtime: "2024-06-21 15:00" }],
    },
    {
      id: "IMS-95230", dispatchId: "95230", imsCaseId: "77120", paccCaseNo: "7712/2565",
      title: "เบิกจ่ายค่าตอบแทนนอกเวลาราชการเป็นเท็จ โรงพยาบาลชุมชน",
      accuser: "ศูนย์รับเรื่องร้องเรียน (สายด่วน 1206)",
      accused: [{ name: "นายวิทยา ขาดลา", role: "ตัวการ", finding: "ผิดวินัย", unit: "ฝ่ายบริหารทั่วไป", dept: "สำนักงานสาธารณสุขจังหวัดสกลนคร", ministry: "กระทรวงสาธารณสุข" }],
      dispatchNo: "ปป 0004/7391", dispatchSet: "1", dispatchDate: "2023-11-03", recordedAt: "2023-11-03 10:05",
      to: "ปลัดกระทรวงสาธารณสุข", letterType: "หนังสือแจ้งผู้บังคับบัญชาดำเนินการทางวินัย", ems: "",
      remark: "แจ้งผลการชี้มูลทางวินัย", recordedBy: "สุภาพร จดจำ",
      files: [{ id: "F-0311", code: "C13", type: "หนังสือแจ้งดำเนินการทางวินัย", name: "แจ้งวินัย_7712-2565.pdf", size: 154300, mtime: "2023-11-03 10:30" }],
    },
  ];

  /* ------------------------------------------------------------ helpers */
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }

  /* "2024-03-12" | "2024-03-12 09:15" → "12/03/2567" (+ เวลา) */
  function thDate(v) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(v || "");
    if (!m) return v || "-";
    return m[3] + "/" + m[2] + "/" + (Number(m[1]) + 543) + (m[4] ? " " + m[4] : "");
  }

  function fileSize(bytes) {
    if (!bytes) return "";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(bytes >= 104857600 ? 0 : 1) + " MB";
    return Math.round(bytes / 1024) + " KB";
  }

  function baht(n) {
    return Number(n || 0).toLocaleString("th-TH") + " บาท";
  }

  function imsFor(paccCaseNo) {
    return IMS_CASES[paccCaseNo] || null;
  }

  function dl(rows) {
    return '<dl class="lg-grid">' + rows
      .filter(([, v]) => v != null && String(v).trim() !== "")
      .map(([k, v, wide]) => `<div${wide ? ' class="is-wide"' : ""}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join("") + "</dl>";
  }

  function section(icon, title, count, body, open) {
    return `<details class="lg-sec"${open ? " open" : ""}><summary><i class="fa-solid ${icon}" aria-hidden="true"></i>` +
      `<span>${esc(title)}</span>${count != null ? `<span class="lg-count">${count}</span>` : ""}` +
      `<i class="fa-solid fa-chevron-down lg-chev" aria-hidden="true"></i></summary><div class="lg-sec-body">${body}</div></details>`;
  }

  /* รายการไฟล์ที่ย้ายมา — รหัสกลุ่มเอกสาร · ขนาด · ตรวจ checksum ตรงกับต้นทาง */
  function fileRows(files) {
    return files.map((f) => `
 <div class="lg-file">
 <span class="lg-code">${esc(f.code)}</span>
 <div class="lg-file-main">
 <div class="lg-file-name"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i>${esc(f.name)}</div>
 <div class="lg-file-meta">${esc(f.type)}${f.size ? " · " + esc(fileSize(f.size)) : ""}${f.mtime ? " · แก้ไขล่าสุดที่ต้นทาง " + esc(thDate(f.mtime)) : ""}${f.version ? " · เวอร์ชัน " + esc(f.version) : ""}</div>
 ${f.note ? `<div class="lg-file-note">${esc(f.note)}</div>` : ""}
 ${f.src ? `<div class="lg-file-src" title="ที่อยู่ไฟล์ต้นทาง">${esc(f.src)}</div>` : ""}
 </div>
 <span class="lg-ok" title="ค่า SHA-256 ตรงกับไฟล์ต้นทาง"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>ตรวจแล้ว</span>
 <button type="button" class="btn btn-secondary" data-href="${PLACEHOLDER}" onclick="ECMISCaseSearch.openFile(this.dataset.href)"><i class="fa-solid fa-eye me-1" aria-hidden="true"></i>เปิดดู</button>
 </div>`).join("");
  }

  /* ------------------------------------------------------------ แผงข้อมูลจากระบบเดิม (กจ.5 + กจ.6) */
  function renderImsPanel(paccCaseNo) {
    const d = imsFor(paccCaseNo);
    if (!d) return "";
    const stats = [
      ["สถานะในระบบเดิม", d.status.label, "is-done"],
      ["ฐานความผิดหลัก", d.offence.split(" ")[0]],
      ["ครบอายุความ", thDate(d.expireDate)],
      ["เขตที่รับผิดชอบ", d.zone],
      ["มูลค่าความเสียหาย", baht(d.damage)],
    ].map(([k, v, cls]) => `<div class="lg-stat${cls ? " " + cls : ""}"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("");

    const summary = dl([
      ["เลขสำนวนคดี", d.caseNo], ["เลขที่รับ ป.ป.ท.", d.receiveNo], ["เลขติดตาม", d.trackingNo || d.trackingNote],
      ["วันที่รับเรื่อง", thDate(d.receivedDate)], ["วันที่ออกเลขสำนวน", thDate(d.openDate)],
      ["ช่วงเวลาเกิดเหตุ", thDate(d.incidentStart) + " – " + thDate(d.incidentEnd) + " (" + d.incidentNote + ")"],
      ["สถานที่เกิดเหตุ", d.place, true], ["ข้อร้องเรียนกล่าวหา", d.detail, true],
      ["ลักษณะการกระทำความผิด", d.nature], ["ฐานความผิดที่อายุความสั้นสุด", d.shortestOffence],
      ["ผู้ถูกกล่าวหา / สังกัด", d.accused + " — " + d.accusedOrg, true],
      ["สถานะย่อยชั้นแสวง", d.inquirySub, true], ["สถานะย่อยชั้นไต่สวน", d.investigationSub, true],
      ["ผู้รับผิดชอบ (แสวง/ไต่สวน)", d.officer], ["มอบหมายโดย", d.assignedBy + " · " + thDate(d.assignedDate) + " · " + d.assignNote],
    ]);

    const timeline = '<ol class="lg-timeline">' + d.history.map(([date, ev, by]) =>
      `<li><time>${esc(thDate(date))}</time><div><div class="lg-tl-ev">${esc(ev)}</div><div class="lg-tl-by">${esc(by)}</div></div></li>`).join("") + "</ol>";

    const resolutions = d.resolutions.map((r) => `
 <div class="lg-card">
 <div class="lg-card-head"><span class="lg-pill">${esc(r.kind)}</span><strong>${esc(r.result)}</strong></div>
 ${dl([["ประชุมครั้งที่ / วาระ", r.meeting + " วาระ " + r.agenda], ["วันที่มีมติ", thDate(r.date)],
    ["รายละเอียดมติ", r.detail, true], ["ผิดอาญา", r.criminal, true], ["ผิดวินัย", r.discipline, true],
    ["ส่งหน่วยงานที่เกี่ยวข้อง", r.sendTo], ["หนังสือแจ้งผล", r.letterNo + " ลงวันที่ " + thDate(r.letterDate)], ["หมายเหตุ", r.remark]])}
 </div>`).join("");

    const orders = d.orders.map((o) => `
 <div class="lg-card">
 <div class="lg-card-head"><span class="lg-pill">คำสั่ง ${esc(o.no)}</span><strong>${esc(o.type)}</strong></div>
 ${dl([["ลงนามคำสั่ง", thDate(o.signDate)], ["หนังสือนำส่ง", o.letterNo + " ลงวันที่ " + thDate(o.letterDate)],
    ["ผู้รับผิดชอบตามคำสั่ง", o.officer], ["หมายเหตุ", o.remark]])}
 ${o.members.length ? '<ul class="lg-members">' + o.members.map(([n, p]) => `<li><span>${esc(n)}</span><em>${esc(p)}</em></li>`).join("") + "</ul>" : ""}
 </div>`).join("");

    const dispatches = d.dispatches.map((x) => dl([
      ["ประเภทหนังสือ", x.type], ["เลขที่ / ชุดที่", x.no + " / ชุดที่ " + x.set], ["วันที่ออกหนังสือ", thDate(x.date)],
      ["ส่งถึง", x.to], ["EMS", x.ems], ["หมายเหตุ", x.remark, true]])).join("");

    const progress = '<div class="lg-table-wrap"><table class="lg-table"><thead><tr><th>วันที่</th><th>ชั้น</th><th>หัวข้อ / รายละเอียด</th><th>ผู้บันทึก</th></tr></thead><tbody>' +
      d.progress.map(([date, stage, title, detail, by]) =>
        `<tr><td class="lg-nowrap">${esc(thDate(date))}</td><td>${esc(stage)}</td><td><strong>${esc(title)}</strong><div class="lg-muted">${esc(detail)}</div></td><td>${esc(by)}</td></tr>`).join("") +
      "</tbody></table></div>";

    const witness = d.witness
      ? dl([["หน่วยงานที่รับผิดชอบ", d.witness.unit], ["วันที่รับคำร้อง", thDate(d.witness.receivedAt)]]) + fileRows(d.witness.files)
      : "";

    return `
 <section class="lg-panel" aria-label="ข้อมูลนำเข้าจากระบบเดิม">
 <header class="lg-head">
 <div class="lg-head-title"><i class="fa-solid fa-database" aria-hidden="true"></i>ข้อมูลจากระบบเดิม (IMS)</div>
 <div class="lg-head-tags"><span class="lg-tag">Data Migration · ${RUN_ID}</span><span class="lg-tag is-ro"><i class="fa-solid fa-lock" aria-hidden="true"></i>อ่านอย่างเดียว</span></div>
 </header>
 <div class="lg-stats">${stats}</div>
 ${section("fa-file-lines", "ข้อมูลเรื่องร้องเรียน", null, summary)}
 ${section("fa-timeline", "ลำดับเหตุการณ์ของสำนวน", d.history.length, timeline, true)}
 ${section("fa-gavel", "มติคณะกรรมการ ป.ป.ท.", d.resolutions.length, resolutions)}
 ${section("fa-file-signature", "คำสั่งไต่สวน", d.orders.length, orders)}
 ${section("fa-list-check", "บันทึกความก้าวหน้า", d.progress.length, progress)}
 ${section("fa-paper-plane", "หนังสือนำส่ง", d.dispatches.length, dispatches)}
 ${section("fa-folder-tree", "เอกสารสำนวน (ย้ายจากที่เก็บไฟล์เดิม)", d.files.length, fileRows(d.files) +
   '<div class="lg-note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>บางสำนวนอาจมาเป็น "สำนวนคดีไฟล์รวม" (ไฟล์เดียวทั้งชุด ไม่แยกประเภทเอกสาร) จะแสดงเป็นรายการเดียว</div>')}
 ${witness ? section("fa-user-shield", "การคุ้มครองพยาน (กจ.6)", d.witness.files.length, witness) : ""}
 </section>`;
  }

  /* ------------------------------------------------------------ สำนวน ป.ป.ท. ที่นำเข้า (รูปแบบเดียวกับ PACC_INTAKE_DATABASE) */
  function paccCases() {
    return Object.keys(IMS_CASES).map((no) => {
      const d = IMS_CASES[no];
      const files = d.files.concat(d.witness ? d.witness.files : []).map((f) => ({
        name: "[" + f.code + "] " + f.type + " — " + f.name,
        href: PLACEHOLDER,
      }));
      return {
        id: "สำนวน-" + no,
        category: "10.1",
        categoryName: "คดีอาญาทุจริต",
        title: d.subject,
        source: "ระบบเดิม (IMS) — " + d.zone,
        accuser: d.accuser,
        accused: d.accused,
        accusedPosition: "",
        section: d.offence.split(" ")[0],
        courtOrder: "-",
        statuteLimitation: "ครบอายุความ " + thDate(d.expireDate),
        dateReceived: d.receivedDate,
        paccCaseNo: no,
        blackNo: "-",
        redNo: "-",
        centralSarabanNo: d.receiveNo,
        courtName: "-",
        courtBlackNo: "-",
        plaintiff: "-",
        defendant: d.accused,
        responsibleUnit: d.zone,
        responsibleOfficer: d.officer,
        legacyIms: no,
        files: files,
      };
    });
  }

  /* ------------------------------------------------------------ แหล่งค้นหา กจ.10 (รูปแบบ SOURCES ใน ecmis-case-search.js) */
  const names = (r) => r.accused.map((a) => a.name).join(", ");
  const orgs = (r) => r.accused.map((a) => [a.unit, a.dept, a.ministry].join(" ")).join(" ");

  const LAW_SOURCE = {
    title: "ค้นหาข้อมูลระบบเดิม (กองกฎหมาย)",
    notFound: "ไม่พบข้อมูลในระบบเดิม",
    cases: () => LAW_RECORDS,
    caseNo: (r) => r.paccCaseNo,
    query: (r) => [r.paccCaseNo, r.imsCaseId, r.dispatchNo, r.title, r.accuser, names(r), orgs(r), r.to, r.letterType, r.ems],
    filters: {
      CaseNo: ["เลขสำนวนคดี ป.ป.ท.", (r) => r.paccCaseNo, "เช่น 9125/2567", true],
      DispatchNo: ["เลขหนังสือนำส่ง", (r) => r.dispatchNo, "เช่น ปป 0004/9655", true],
      LetterType: ["ประเภทหนังสือ", (r) => r.letterType, "เช่น หนังสือนำส่งอัยการ"],
      Accuser: ["ชื่อผู้กล่าวหา", (r) => r.accuser, "ชื่อผู้กล่าวหา..."],
      Accused: ["ชื่อผู้ถูกกล่าวหา", names, "ชื่อผู้ถูกกล่าวหา..."],
      AccusedOrg: ["สังกัดผู้ถูกกล่าวหา", orgs, "หน่วยงาน / กรม / กระทรวง..."],
      To: ["ส่งถึง", (r) => r.to, "เช่น อัยการสูงสุด"],
      Subject: ["เรื่อง", (r) => r.title, "เรื่องที่ร้องเรียน..."],
    },
    rows: [["CaseNo", "DispatchNo", "LetterType"], ["Accuser", "Accused", "AccusedOrg"], ["To", "Subject"]],
    columns: [
      ["เรื่อง", (r) => [r.title]],
      ["ผู้ถูกกล่าวหา / สังกัด", (r) => [names(r), r.accused[0].dept]],
      ["หนังสือนำส่ง", (r) => [r.dispatchNo, thDate(r.dispatchDate)]],
      ["ส่งถึง", (r) => [r.to, r.letterType]],
    ],
    detailRows: (r) => [
      ["เลขสำนวนคดี ป.ป.ท.", r.paccCaseNo],
      ["รหัสเรื่องในระบบเดิม", r.imsCaseId],
      ["เรื่องที่ร้องเรียน", r.title, true],
      ["ผู้กล่าวหา", r.accuser],
      ["เลขหนังสือนำส่ง / ชุดที่", r.dispatchNo + " / ชุดที่ " + r.dispatchSet],
      ["วันที่ออกหนังสือ", thDate(r.dispatchDate)],
      ["ประเภทหนังสือ", r.letterType],
      ["ส่งถึง", r.to],
      ["EMS", r.ems],
      ["หมายเหตุ", r.remark, true],
      ["ผู้บันทึก", r.recordedBy + " · " + thDate(r.recordedAt)],
    ],
    /* ไฟล์แสดงแบบมีรหัสกลุ่มเอกสารใน extraHtml แทนรายการไฟล์ทั่วไป */
    files: () => null,
    /* ส่วนเพิ่มท้ายรายละเอียด: ผู้ถูกกล่าวหารายบุคคล + ไฟล์ + ประวัติสำนวนเดิม (ถ้ามีข้อมูล กจ.5) */
    extraHtml: (r) =>
      '<div class="intake-files-title"><i class="fa-solid fa-users me-1" aria-hidden="true"></i>ผู้ถูกกล่าวหา (' + r.accused.length + ")</div>" +
      '<div class="lg-table-wrap"><table class="lg-table"><thead><tr><th>ชื่อ</th><th>สถานะ</th><th>ผลชี้มูล</th><th>สังกัด</th></tr></thead><tbody>' +
      r.accused.map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.role)}</td><td>${esc(a.finding)}</td><td>${esc([a.unit, a.dept, a.ministry].join(" · "))}</td></tr>`).join("") +
      "</tbody></table></div>" +
      '<div class="intake-files-title"><i class="fa-solid fa-paperclip me-1" aria-hidden="true"></i>เอกสาร (' + r.files.length + ")</div>" +
      fileRows(r.files) +
      renderImsPanel(r.paccCaseNo),
    /* มีสำนวนในระบบใหม่ที่เชื่อมเลขเดียวกัน ⇒ ลิงก์ไปดู; ไม่มี ⇒ แจ้งว่ายังไม่มี */
    action: (r) => {
      const A10 = global.Activity10;
      const linked = A10 && A10.getCases ? (A10.getCases() || []).find((c) => c.paccCaseNo === r.paccCaseNo) : null;
      return linked
        ? `<a class="btn btn-primary" href="01-work-inbox.html?alert=${encodeURIComponent(linked.id)}"><i class="fa-solid fa-up-right-from-square me-1" aria-hidden="true"></i>เปิดสำนวนในระบบใหม่ (${esc(linked.id)})</a>`
        : `<span class="lg-muted"><i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>ยังไม่มีสำนวนนี้ในระบบใหม่</span>`;
    },
  };

  /* ------------------------------------------------------------ การ์ด "ข้อมูลจากฐานข้อมูลเดิม" ในทุกหน้าของ flow
     เคส (?id=) ที่ผูกสำนวนเดิมไว้ตอนรับเรื่อง (paccCaseNo) และมีข้อมูล IMS ⇒ แทรกการ์ดพื้นเทา อ่านอย่างเดียว
     ไว้ก่อน .form-card ใบแรก · หน้า 02 แสดงในการ์ดสำนวนที่เลือกอยู่แล้ว จึงข้าม */
  function legacyCardHtml(kase) {
    return `
 <details class="form-card lg-db-card" id="legacyDbCard">
 <summary class="lg-db-head">
 <i class="fa-solid fa-box-archive" aria-hidden="true"></i>
 <span>ข้อมูลจากฐานข้อมูลเดิม</span>
 <span class="lg-db-sub">สำนวนเดิม ${esc(kase.paccCaseNo)}</span>
 <span class="lg-tag is-ro"><i class="fa-solid fa-lock" aria-hidden="true"></i>อ่านอย่างเดียว</span>
 <i class="fa-solid fa-chevron-down lg-chev" aria-hidden="true"></i>
 </summary>
 <div class="lg-db-body">${renderImsPanel(kase.paccCaseNo)}</div>
 </details>`;
  }

  function mountFlowCard() {
    if (document.getElementById("legacyDbCard") || document.getElementById("selectedCaseLegacyBox")) return;
    const id = new URLSearchParams(global.location.search).get("id");
    const A10 = global.Activity10;
    const kase = id && A10 && A10.getCaseById ? A10.getCaseById(id) : null;
    if (!kase || !kase.paccCaseNo || !imsFor(kase.paccCaseNo)) return;
    /* แทรกระดับบนสุดของ .content (ไม่ให้ไปอยู่ในส่วนพับ "ข้อมูลขั้นตอนก่อนหน้า") */
    const content = document.querySelector(".content");
    const first = content && content.querySelector(".prev-step, .form-card");
    if (!first) return;
    let anchor = first;
    while (anchor.parentElement && anchor.parentElement !== content) anchor = anchor.parentElement;
    anchor.insertAdjacentHTML("beforebegin", legacyCardHtml(kase));
  }

  /* รอสคริปต์ของหน้าเรนเดอร์เสร็จก่อน (load) */
  if (document.readyState === "complete") mountFlowCard();
  else global.addEventListener("load", mountFlowCard);

  global.ECMISLegacy = {
    paccCases: paccCases,
    lawSource: LAW_SOURCE,
    hasIms: (paccCaseNo) => !!imsFor(paccCaseNo),
    renderImsPanel: renderImsPanel,
    mountFlowCard: mountFlowCard,
  };
})(window);
