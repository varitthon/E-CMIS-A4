/* ECMIS 10.1 บันทึกผลคำพิพากษา — รายการตัวเลือก (dropdown) และข้อมูลตัวอย่างจากสำนวนเดิม
   ที่มา: แบบฟอร์มฐานข้อมูลคำพิพากษา (Excel) ชีต "ประเภท ลักษณะของคดี" และ "DD"
   - ใช้รายการตามที่ Excel ระบุ "เพิ่ม" และตัดรายการที่ระบุ "ลบออก"
   - X (นับสถิติเป็น) และ Z (กลุ่มงานบริหารติดตามรับเรื่อง) ยังไม่มีรายการ → ช่องข้อความไปก่อน
   ACT7_SAMPLE = ข้อมูลที่จะมาจากสำนวนเดิม/กิจกรรม 7 (มติชี้มูล ต้นสังกัด คำสั่งไต่สวน ความเห็นอนุฯ)
   ระบบจริงยังไม่มีข้อมูลชุดนี้ จึงใส่ค่าตัวอย่างไว้ตามเลขสำนวน ป.ป.ท. เพื่อให้ส่งออก Word/Excel ได้ครบ
   ไฟล์นี้เป็นข้อมูลล้วน ทดสอบได้ใน node (ไม่แตะ DOM) */
(function (global) {
  "use strict";

  /* ชั้นศาลของบันทึก 1 รายการ = 1 แถวใน Excel; code ตรงกับ Activity10.JUDGMENT_LEVELS */
  /* 2 ส่วน: ศาลคดีอาญาทุจริตและประพฤติมิชอบ (FIRST/APPEAL/SUPREME) และ ศาลปกครอง (ADMIN_FIRST/ADMIN_SUPREME) */
  const LEVELS = [
    { code: "FIRST", name: "ศาลชั้นต้น", part: "CRIMINAL" },
    { code: "APPEAL", name: "ศาลอุทธรณ์", part: "CRIMINAL" },
    { code: "SUPREME", name: "ศาลฎีกา", part: "CRIMINAL" },
    { code: "ADMIN_FIRST", name: "ศาลปกครองชั้นต้น", part: "ADMIN" },
    { code: "ADMIN_SUPREME", name: "ศาลปกครองสูงสุด", part: "ADMIN" },
  ];
  const PARTS = [
    { code: "CRIMINAL", name: "ศาลคดีอาญาทุจริตและประพฤติมิชอบ" },
    { code: "ADMIN", name: "ศาลปกครอง" },
  ];

  /* Y ประเภท/ลักษณะของคดี — ข้อที่มี sub ต้องเลือกหัวข้อย่อย; "(โปรดระบุ)" เปิดช่องข้อความ */
  const CASE_NATURES = [
    { no: "1", name: "คดีที่เกี่ยวข้องกับการจัดซื้อจัดจ้าง การตรวจการจ้าง เบิกจ่ายเงิน เรียกรับผลประโยชน์ และการเสนอราคาต่อหน่วยงานของรัฐ" },
    { no: "2", name: "คดีที่เกี่ยวข้องกับการเสนอ อนุมัติ จัดสรร เบิกจ่าย และการใช้จ่ายเงินงบประมาณ" },
    { no: "3", name: "คดีที่เกี่ยวข้องกับการเบียดบังทรัพย์ และการใช้ทรัพยากรของทางราชการ" },
    { no: "4", name: "คดีที่เกี่ยวข้องกับการจัดเก็บรายได้ ค่าธรรมเนียม ค่าปรับ และภาษีอากร" },
    { no: "5", name: "คดีที่เกี่ยวข้องกับการเรียก รับ หรือยอมจะรับทรัพย์สิน หรือประโยชน์อื่นใด" },
    { no: "6", name: "คดีที่เกี่ยวข้องกับการช่วยเหลือผู้กระทำความผิด" },
    { no: "7", name: "คดีที่เกี่ยวข้องกับทะเบียนราษฎรและบัตรประชาชน" },
    { no: "8", name: "คดีที่เกี่ยวข้องกับที่ดิน การออกเอกสารสิทธิ และการรุกล้ำที่ดิน" },
    { no: "9", name: "คดีที่เกี่ยวข้องกับการรับจดทะเบียน รับจดแจ้ง ออกใบอนุญาต และต่อใบอนุญาตต่างๆ" },
    { no: "10", name: "คดีที่เกี่ยวข้องกับการพิจารณาหรือดำเนินการขัดต่อระเบียบกฎหมาย ผลประโยชน์ของทางราชการและประชาชน" },
    { no: "11", name: "คดีที่เกี่ยวข้องกับการปลอมเอกสาร" },
    { no: "12", name: "คดีที่เกี่ยวข้องกับทำเอกสารอันเป็นเท็จ (การจัดทำโครงการเท็จ/เบิกค่าเช่าเท็จ)" },
    { no: "13", name: "คดีที่เกี่ยวข้องกับการสรรหา คัดเลือก แต่งตั้ง โยกย้าย และการบริหารงานบุคคลภาครัฐ" },
    { no: "14", name: "คดีที่เกี่ยวข้องกับการปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยมิชอบ หรือปฏิบัติหรือละเว้นการปฏิบัติหน้าที่โดยทุจริต" },
    { no: "15", name: "คดีที่เกี่ยวข้องกับการขัดกันระหว่างประโยชน์ส่วนบุคคลกับประโยชน์ส่วนรวม" },
    { no: "16", name: "คดีที่เกี่ยวข้องกับคดีอาญาทั่วไป" },
    {
      no: "17",
      name: "คดีที่เกี่ยวข้องกับกระบวนการยุติธรรม",
      sub: ["การแจ้งความร้องทุกข์", "การสอบสวน", "คดีอื่นๆ (โปรดระบุ)"],
    },
    {
      no: "18",
      name: "คดีที่เกี่ยวข้องกับกฎหมายเฉพาะ",
      sub: ["ยาเสพติด", "การพนัน", "ค้ามนุษย์", "สถานบันเทิง", "แรงงาน/แรงงานต่างด้าว", "ค้าไม้ผิดกฎหมาย", "ผู้มีอิทธิพล", "อาชญากรรมข้ามชาติ", "คดีอื่นๆ (โปรดระบุ)"],
    },
    {
      no: "19",
      name: "คดีที่เกี่ยวข้องกับโครงการของรัฐบาล",
      sub: [
        "คดีที่เกี่ยวข้องกับการเก็บรักษาข้าวในคลังสินค้า (โครงการจำนำข้าว)",
        "คดีที่เกี่ยวข้องกับการใช้จ่ายเงินงบประมาณเพื่อช่วยเหลือผู้ประสบภัยพิบัติ (ภัยแล้ง/น้ำท่วม/พายุ/อื่นๆ)",
        "คดีที่เกี่ยวข้องกับการใช้จ่ายเงินงบประมาณประเภทเงินอุดหนุนเงินสงเคราะห์ครอบครัวผู้มีรายได้น้อยและผู้ไร้ที่พึ่ง",
        "คดีที่เกี่ยวข้องกับการใช้จ่ายเงินงบประมาณเงินอุดหนุนรายหัวโรงเรียน",
        "คดีที่เกี่ยวข้องกับอาหารกลางวัน/นมโรงเรียน",
        "คดีที่เกี่ยวข้องกับก่อสร้างสนามฟุตซอล/สนามเด็กเล่น",
        "คดีที่เกี่ยวข้องกับโครงการจัดซื้อจัดจ้างเสาไฟฟ้า",
        "คดีที่เกี่ยวข้องกับขุดลอกคูคลอง/บ่อน้ำ",
        "คดีที่เกี่ยวข้องกับการขุดเจาะบ่อน้ำบาดาล",
        "คดีที่เกี่ยวข้องกับเงินทอนวัด",
        "คดีอื่นๆ (โปรดระบุ)",
      ],
    },
    { no: "20", name: "คดีอื่นๆ (โปรดระบุ)" },
    { no: "21", name: "คดีที่ยังไม่สามารถระบุประเภท/ลักษณะของคดีได้อย่างชัดเจน" },
  ];

  /* AA ประเภทคำพิพากษา (ชีต "ประเภท ลักษณะของคดี" หัวข้อ "คำพิพากษาใน Script") */
  const VERDICT_TYPES = [
    { code: "1", name: "ลงโทษ" },
    { code: "2", name: "ยกฟ้อง" },
    { code: "3", name: "อัยการสั่งไม่ฟ้อง" },
    { code: "4", name: "อื่นๆ - ศาลสั่งยุติ (ตาย, ขาดอายุความ)" },
  ];

  /* AH สถานะชั้นคำพิพากษา (fz) แยกตามชั้นศาล — ตัด "ลงโทษบางราย" / "ยกฟ้องบางราย" ที่ Excel ให้ลบออก
     และใช้ "ลงโทษบางรายและยกฟ้องบางราย" ที่ Excel เพิ่มแทน */
  const VERDICT_STAGES = {
    FIRST: [
      "1.1 ศาลชั้นต้นพิพากษาลงโทษทุกราย",
      "1.2 ศาลชั้นต้นพิพากษายกฟ้อง",
      "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
    ],
    APPEAL: [
      "2.1 ศาลอุทธรณ์พิพากษาลงโทษทุกราย",
      "2.2 ศาลอุทธรณ์พิพากษายกฟ้อง",
      "2.3 ศาลอุทธรณ์พิพากษาลงโทษบางรายและยกฟ้องบางราย",
    ],
    SUPREME: [
      "3.1 ศาลฎีกาพิพากษาลงโทษทุกราย",
      "3.2 ศาลฎีกาพิพากษายกฟ้อง",
      "3.3 ศาลฎีกาพิพากษาลงโทษบางรายและยกฟ้องบางราย",
    ],
    /* ศาลปกครอง — ชีต DD ไม่มีรายการ จึงเป็นรายการตัวอย่าง (ฉบับร่าง) รอรายการจริง */
    ADMIN_FIRST: [
      "4.1 ศาลปกครองชั้นต้นพิพากษายกฟ้อง",
      "4.2 ศาลปกครองชั้นต้นพิพากษาตามคำขอ (เพิกถอนคำสั่ง)",
      "4.3 ศาลปกครองชั้นต้นพิพากษาตามคำขอบางส่วน",
      "4.4 ศาลปกครองชั้นต้นมีคำสั่งไม่รับคำฟ้อง/จำหน่ายคดี",
    ],
    ADMIN_SUPREME: [
      "5.1 ศาลปกครองสูงสุดพิพากษายืน",
      "5.2 ศาลปกครองสูงสุดพิพากษากลับ",
      "5.3 ศาลปกครองสูงสุดพิพากษาแก้",
      "5.4 ศาลปกครองสูงสุดมีคำสั่งไม่รับอุทธรณ์/จำหน่ายคดี",
    ],
  };

  /* AJ ความผิดตามกฎหมาย/ระเบียบ (ชีต DD "ผิดตามมาตรา") — "อื่นๆ" เปิดช่องข้อความ */
  const OFFENSE_LAWS = [
    "ประมวลกฎหมายอาญา มาตรา 148 (เดิม)",
    "พระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. 2542 มาตรา 123/1",
    "ประมวลกฎหมายอาญา มาตรา 157",
    "อื่นๆ (โปรดระบุ)",
  ];

  /* AN ประเภทการชดใช้ทางแพ่ง */
  const RESTITUTION_TYPES = ["ชดใช้เงิน", "คืนเงิน"];

  /* AG สถานะชั้นพนักงานอัยการ — ชีต DD "สถานะคดีผลการพิจารณาของพนักงานอัยการ" หลังแก้ตาม เพิ่ม/ลบออก
     (ลบออกเฉพาะ 3.1 เดิม "แจ้งคำสั่งฟ้อง" → แทนด้วย ฟ้องทุกราย/ฟ้องบางราย; 3.2–3.4 เดิมเลื่อนเป็น 3.3–3.5)
     สตริง = ตัวเลือก, { group, items } = หัวข้อกลุ่ม (เลือกไม่ได้) — บันทึกระดับสำนวน (verdictProsecutorStatus) */
  const PROSECUTOR_STATUSES = [
    "1. พนักงานอัยการแจ้งข้อไม่สมบูรณ์",
    "2. พนักงานอัยการส่งคืนสำนวน",
    {
      group: "3. พนักงานอัยการแจ้งคำสั่งฯแล้ว",
      items: [
        "3.1 พนักงานอัยการแจ้งคำสั่งฟ้องทุกราย",
        "3.2 พนักงานอัยการแจ้งคำสั่งฟ้องบางราย",
        "3.3 พนักงานอัยการแจ้งคำสั่งไม่ฟ้อง/หรือขาดอายุความในคดีอาญา",
        "3.4 พนักงานอัยการขอให้นำตัวผู้ถูกกล่าวหามาฟ้อง",
        "3.5 อยู่ระหว่างออกหมายจับ/ยังไม่สามารถจับตัวผู้ถูกกล่าวหา",
      ],
    },
    {
      group: "4. คำวินิจฉัยของอัยการสูงสุด",
      items: [
        "4.1 อัยการสูงสุดมีคำวินิจฉัยให้สั่งฟ้อง",
        "4.2 อัยการสูงสุดมีคำวินิจฉัยชี้ขาดสั่งไม่ฟ้อง",
        "4.3 อัยการสูงสุดมีคำวินิจฉัยชี้ขาดสั่งไม่ฟ้องบางราย",
        "4.4 อัยการสูงสุดสั่งไม่อุทธรณ์-ไม่มีเหตุสมควรอุทธรณ์ยกฟ้องจำเลย",
      ],
    },
  ];

  /* ผลมติคณะกรรมการ ป.ป.ท. (Excel P–W) — ลำดับตรงคอลัมน์ */
  const BOARD_OUTCOMES = [
    { key: "criminal", label: "ผิดอาญา" },
    { key: "disciplinary", label: "ผิดวินัย" },
    { key: "terminated", label: "ยุติเรื่อง" },
    { key: "toNacc", label: "ส่ง ป.ป.ช." },
    { key: "toInvestigator", label: "ส่งพนักงานสอบสวน" },
    { key: "toAgency", label: "ส่งหน่วยงานที่เกี่ยวข้อง" },
    { key: "moreInquiry", label: "ไต่เพิ่ม" },
    { key: "allegationLapsed", label: "ข้อกล่าวหาเป็นอันตกไป" },
  ];

  /* ข้อมูลตัวอย่างที่จะได้จากสำนวนเดิม/กิจกรรม 7 — คีย์ = id ของสำนวน ป.ป.ท. (PACC_INTAKE_DATABASE) */
  const ACT7_SAMPLE = {
    "สำนวน-0001/2569": {
      offenseType: "ทุจริตต่อหน้าที่",
      ministry: "กระทรวงมหาดไทย",
      department: "กรมส่งเสริมการปกครองท้องถิ่น",
      agency: "องค์การบริหารส่วนตำบลบางแสน จ.ชลบุรี",
      boardMeetingNo: "9/2569",
      boardMeetingDate: "2026-03-12",
      boardAgendaNo: "4.2",
      boardOutcomes: { criminal: true, disciplinary: true },
      inquiryOrderNo: "112/2567",
      inquiryOrderDate: "2024-05-20",
      subcommitteeCriminal: "เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 157",
      subcommitteeDisciplinary: "เป็นความผิดวินัยอย่างร้ายแรง ฐานปฏิบัติหน้าที่โดยทุจริต",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 157",
    },
    "สำนวน-0005/2569": {
      offenseType: "เรียกรับผลประโยชน์",
      ministry: "กระทรวงคมนาคม",
      department: "กรมการขนส่งทางบก",
      agency: "สำนักงานขนส่งจังหวัดนครปฐม",
      boardMeetingNo: "11/2569",
      boardMeetingDate: "2026-04-09",
      boardAgendaNo: "4.5",
      boardOutcomes: { criminal: true, disciplinary: true },
      inquiryOrderNo: "87/2567",
      inquiryOrderDate: "2024-04-02",
      subcommitteeCriminal: "เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 149 และมาตรา 157",
      subcommitteeDisciplinary: "เป็นความผิดวินัยอย่างร้ายแรง",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 149, 157",
    },
    "สำนวน-0012/2569": {
      offenseType: "จัดซื้อจัดจ้าง",
      ministry: "กระทรวงสาธารณสุข",
      department: "สำนักงานปลัดกระทรวงสาธารณสุข",
      agency: "สำนักงานสาธารณสุขจังหวัดสระบุรี",
      boardMeetingNo: "5/2568",
      boardMeetingDate: "2025-02-13",
      boardAgendaNo: "4.1",
      boardOutcomes: { criminal: true, disciplinary: true },
      inquiryOrderNo: "45/2566",
      inquiryOrderDate: "2023-06-15",
      subcommitteeCriminal: "เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 151 และมาตรา 157",
      subcommitteeDisciplinary: "เป็นความผิดวินัยอย่างร้ายแรง ฐานทุจริตต่อหน้าที่ราชการ",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 151, 157",
    },
    "สำนวน-0031/2569": {
      offenseType: "เบียดบังทรัพย์",
      ministry: "กระทรวงศึกษาธิการ",
      department: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน",
      agency: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาลพบุรี เขต 1",
      boardMeetingNo: "14/2568",
      boardMeetingDate: "2025-07-10",
      boardAgendaNo: "4.3",
      boardOutcomes: { criminal: true },
      inquiryOrderNo: "201/2566",
      inquiryOrderDate: "2023-11-01",
      subcommitteeCriminal: "เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 147",
      subcommitteeDisciplinary: "",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 147",
    },
    "สำนวน-0045/2569": {
      offenseType: "ใช้จ่ายเงินงบประมาณ",
      ministry: "กระทรวงมหาดไทย",
      department: "กรมส่งเสริมการปกครองท้องถิ่น",
      agency: "เทศบาลตำบลหนองหิน จ.เลย",
      boardMeetingNo: "2/2569",
      boardMeetingDate: "2026-01-15",
      boardAgendaNo: "4.4",
      boardOutcomes: { criminal: true, disciplinary: true },
      inquiryOrderNo: "16/2568",
      inquiryOrderDate: "2025-01-22",
      subcommitteeCriminal: "เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 157",
      subcommitteeDisciplinary: "เป็นความผิดวินัยอย่างร้ายแรง",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 157",
    },
    /* สำนวนเดิมที่มีผู้ถูกกล่าวหา 3 คน (PACC_INTAKE_DATABASE ใน ecmis-activity10.js) */
    "สำนวน-0090/2569": {
      offenseType: "จัดซื้อจัดจ้าง",
      ministry: "กระทรวงมหาดไทย",
      department: "กรมส่งเสริมการปกครองท้องถิ่น",
      agency: "องค์การบริหารส่วนตำบลหนองบัว จ.อุดรธานี",
      boardMeetingNo: "6/2568",
      boardMeetingDate: "2025-03-20",
      boardAgendaNo: "4.6",
      boardOutcomes: { criminal: true, disciplinary: true },
      inquiryOrderNo: "64/2567",
      inquiryOrderDate: "2024-03-11",
      subcommitteeCriminal: "ผู้ถูกกล่าวหาที่ 1 และที่ 2 เป็นความผิดตามประมวลกฎหมายอาญา มาตรา 151 และมาตรา 157 ผู้ถูกกล่าวหาที่ 3 เป็นผู้สนับสนุน",
      subcommitteeDisciplinary: "ผู้ถูกกล่าวหาที่ 1 และที่ 2 เป็นความผิดวินัยอย่างร้ายแรง",
      prosecutedOffenses: "ประมวลกฎหมายอาญา มาตรา 151, 157 และ 86",
    },
  };

  /* ตัวอย่างบันทึกผลคำพิพากษา (เดโม) — เติมครั้งเดียวต่อเบราว์เซอร์ให้สำนวน 10.1 ที่ยังไม่มีบันทึก
     ดู ECMISVerdictForm.ensureSamples(); paccSourceId ใส่เฉพาะเมื่อสำนวนยังไม่ได้ผูกสำนวนเดิม
     createCase = สร้างสำนวนนั้นก่อนถ้ายังไม่มีในระบบ */
  const MULTI_P1 = "นายประยุทธ ทองดี";
  const MULTI_P2 = "นางสาวมาลี ศรีงาม";
  const MULTI_P3 = "นายวีระ ใจกล้า";
  const MULTI_FIRST_COURT = {
    type: "CORRUPTION", name: "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 4", blackNo: "อท. 133/2569", redNo: "อท. 402/2569", date: "2026-06-18",
  };
  const MULTI_APPEAL_COURT = { type: "CORRUPTION", name: "ศาลอุทธรณ์คดีพิเศษ", blackNo: "อท. 211/2569", redNo: "อท. 37/2570", date: "2026-10-02" };
  const SAMPLE_RECORDS = [
    /* ผู้ถูกกล่าวหาหลายคน: สร้างคดี-100090/2569 (ผูกสำนวน-0090/2569)
       ชั้นต้น 3 คนผลต่างกัน (ลงโทษ / ลงโทษรอการลงโทษ / ยกฟ้อง) · ชั้นอุทธรณ์ 2 คน (บันทึกแล้ว 1 / ร่าง 1) */
    {
      caseId: "คดี-100090/2569",
      by: "นายณัฐพล บัวทุม",
      createCase: {
        title: "พิจารณาคำสั่งไม่อุทธรณ์คดีร่วมกันทุจริตจัดซื้อครุภัณฑ์การแพทย์ราคาสูงเกินจริง รพ.สต.หนองบัว",
        category: "10.1",
        categoryName: "คดีอาญาทุจริต",
        prosecutorCaseTypeNo: "3",
        prosecutorCaseTypeName: "3. อัยการมีความเห็นสั่งไม่อุทธรณ์(ลงโทษ)",
        prosecutorLevel: "1",
        prosecutorLevelName: "ศาลชั้นต้น",
        courtSystem: "CORRUPTION",
        courtSystemName: "ศาลคดีทุจริต",
        prosecutorType: "CORRUPTION",
        prosecutorTypeName: "อัยการคดีทุจริต",
        source: "สำนักงานอัยการคดีปราบปรามการทุจริตภาค 4",
        accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
        accused: MULTI_P1 + ", " + MULTI_P2 + " และ " + MULTI_P3,
        accusedPosition: "นายกองค์การบริหารส่วนตำบล / เจ้าพนักงานพัสดุ / ผู้รับจ้าง",
        plaintiffs: ["พนักงานอัยการ สำนักงานอัยการคดีปราบปรามการทุจริตภาค 4"],
        defendants: [MULTI_P1, MULTI_P2, MULTI_P3],
        courtName: MULTI_FIRST_COURT.name,
        courtBlackNo: MULTI_FIRST_COURT.blackNo,
        courtRedNo: MULTI_FIRST_COURT.redNo,
        officer: "นายณัฐพล บัวทุม",
        assignedRole: "legal_officer",
        status: "นิติกรจัดทำความเห็น",
        statusCode: "DRAFTING_OPINION",
        statusBadge: "bg-primary text-white",
        lawReceiveNo: "0090/2569",
        centralSarabanNo: "2569/4520",
        paccCaseNo: "0090/2569",
        paccSourceId: "สำนวน-0090/2569",
        docNo: "อส 0090/2569",
        docType: "คำสั่งไม่อุทธรณ์ของพนักงานอัยการ",
        workflowStep: 5,
        slaTotalDays: 15,
        slaDaysRemaining: 10,
        slaAlert: "sla-normal",
        statuteLimitation: "20 ปี (หมดอายุความ 14 ก.พ. 2588)",
      },
      analyses: [
        {
          issue: "การแยกความรับผิดของผู้ร่วมกระทำความผิดแต่ละคน",
          summary: "ศาลแยกพิจารณาบทบาทผู้ถูกกล่าวหาแต่ละคน พยานหลักฐานไม่พอฟังว่าผู้รับจ้างร่วมทุจริต",
          analysis: "สำนวนที่มีผู้ถูกกล่าวหาหลายคนต้องแยกพยานหลักฐานรายบุคคลให้ชัดตั้งแต่ชั้นไต่สวน",
          recommendation:
            "ประสบความสำเร็จ: แยกบทบาทผู้สั่งการและเจ้าพนักงานพัสดุได้ชัดเจน / ข้อพึงระวัง: พยานหลักฐานเชื่อมโยงผู้รับจ้างกับการกำหนดราคายังอ่อน ควรรวบรวมหลักฐานการติดต่อระหว่างผู้รับจ้างกับเจ้าหน้าที่",
          date: "2026-10-10",
        },
      ],
      records: [
        {
          level: "FIRST", person: MULTI_P1, status: "done", court: MULTI_FIRST_COURT,
          fields: {
            caseNatureNo: "1", verdictType: "1", verdictStage: "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
            resultDetail: "จำเลยที่ 1 มีความผิดตามประมวลกฎหมายอาญา มาตรา 151 จำคุก 3 ปี ปรับ 60,000 บาท และให้ชดใช้เงิน 480,000 บาท",
            offenseLaw: "อื่นๆ (โปรดระบุ)", offenseLawOther: "ประมวลกฎหมายอาญา มาตรา 151",
            jailYears: 3, fine: 60000, restitutionType: "ชดใช้เงิน", restitutionAmount: 480000,
            refundUnit: "องค์การบริหารส่วนตำบลหนองบัว", actualJailYears: 3, actualFine: 60000, damageValue: 480000,
          },
          fileNames: ["คำพิพากษาศาลชั้นต้น_อท.402-2569.pdf"],
        },
        {
          level: "FIRST", person: MULTI_P2, status: "done", court: MULTI_FIRST_COURT,
          fields: {
            caseNatureNo: "1", verdictType: "1", verdictStage: "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
            resultDetail: "จำเลยที่ 2 มีความผิดตามประมวลกฎหมายอาญา มาตรา 157 จำคุก 2 ปี ปรับ 20,000 บาท โทษจำคุกให้รอการลงโทษไว้ 2 ปี",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 2, fine: 20000, actualFine: 20000, suspendedYears: 2, probationYears: 1, communityHours: 36, damageValue: 480000,
          },
          fileNames: ["คำพิพากษาศาลชั้นต้น_อท.402-2569.pdf"],
        },
        {
          level: "FIRST", person: MULTI_P3, status: "done", court: MULTI_FIRST_COURT,
          fields: {
            caseNatureNo: "1", verdictType: "2", verdictStage: "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
            resultDetail: "พยานหลักฐานโจทก์ไม่พอฟังว่าจำเลยที่ 3 ร่วมกระทำความผิด พิพากษายกฟ้องจำเลยที่ 3",
            offenseLaw: "อื่นๆ (โปรดระบุ)", offenseLawOther: "ประมวลกฎหมายอาญา มาตรา 86",
            damageValue: 480000,
          },
          fileNames: ["คำพิพากษาศาลชั้นต้น_อท.402-2569.pdf"],
        },
        {
          level: "APPEAL", person: MULTI_P1, status: "done", court: MULTI_APPEAL_COURT,
          fields: {
            caseNatureNo: "1", verdictType: "1", verdictStage: "2.1 ศาลอุทธรณ์พิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษาแก้เป็นจำคุก 2 ปี 6 เดือน นอกจากที่แก้ให้เป็นไปตามคำพิพากษาศาลชั้นต้น",
            offenseLaw: "อื่นๆ (โปรดระบุ)", offenseLawOther: "ประมวลกฎหมายอาญา มาตรา 151",
            jailYears: 2, jailMonths: 6, fine: 60000, restitutionType: "ชดใช้เงิน", restitutionAmount: 480000,
            refundUnit: "องค์การบริหารส่วนตำบลหนองบัว", isFinal: true, finalLetterNo: "ศาลอุทธรณ์คดีพิเศษ ที่ ศอพ 0090/2570",
            actualJailYears: 2, actualJailMonths: 6, actualFine: 60000, damageValue: 480000,
          },
          fileNames: ["คำพิพากษาศาลอุทธรณ์_อท.37-2570.pdf"],
        },
        {
          level: "APPEAL", person: MULTI_P2, status: "draft", court: MULTI_APPEAL_COURT,
          fields: {
            caseNatureNo: "1", verdictType: "1", verdictStage: "2.1 ศาลอุทธรณ์พิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษายืนตามคำพิพากษาศาลชั้นต้น (อยู่ระหว่างตรวจสอบรายละเอียด)",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 2, fine: 20000, damageValue: 480000,
          },
          fileNames: ["คำพิพากษาศาลอุทธรณ์_อท.37-2570.pdf"],
        },
      ],
    },
    /* ตัวอย่างครบทุกส่วนของแบบสรุป (Word): สำนวนเดิม + กิจกรรม 7 ครบ, ศาลประพฤติมิชอบ (ชั้นต้น) และศาลคดีทุจริต
       (อุทธรณ์/ฎีกา), ผลคำพิพากษา, การลงโทษจริง, คดีถึงที่สุด, ข้อเสนอแนะทางคดี, ผู้สรุป+ตำแหน่ง */
    {
      caseId: "คดี-100003/2569",
      paccSourceId: "สำนวน-0001/2569",
      by: "นายณัฐพล บัวทุม",
      caseFields: {
        plaintiffs: ["พนักงานอัยการ สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1"],
        defendants: ["นายอำนาจ พิทักษ์ธรรม"],
      },
      analyses: [
        {
          issue: "การพิสูจน์เจตนาทุจริตในการเรียกรับเงิน",
          summary: "ศาลรับฟังพยานเอกสารการโอนเงินและคำเบิกความผู้เสียหายสอดคล้องกัน",
          analysis: "พยานหลักฐานทางการเงินเป็นหัวใจของคดี การรวบรวมรายการเดินบัญชีตั้งแต่ชั้นไต่สวนทำให้ศาลทุกชั้นพิพากษาลงโทษ",
          recommendation:
            "ประสบความสำเร็จ: รวบรวมรายการเดินบัญชีและหลักฐานการโอนเงินครบถ้วนตั้งแต่ชั้นไต่สวน / ข้อพึงระวัง: ควรบันทึกถ้อยคำพยานผู้เสียหายโดยละเอียดและยืนยันตัวพยานให้พร้อมเบิกความ เพื่อป้องกันพยานกลับคำในชั้นศาล",
          date: "2026-10-05",
        },
      ],
      records: [
        {
          level: "FIRST",
          person: "นายอำนาจ พิทักษ์ธรรม",
          status: "done",
          court: { type: "PROVINCIAL", name: "ศาลจังหวัดชลบุรี", blackNo: "อ. 1185/2567", redNo: "อ. 2210/2568", date: "2025-11-20" },
          fields: {
            statCountAs: "คดีชี้มูลที่ศาลพิพากษาลงโทษ", trackingGroup: "กลุ่มงานติดตามผลคดี",
            caseNatureNo: "5", verdictType: "1", verdictStage: "1.1 ศาลชั้นต้นพิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษาว่าจำเลยมีความผิดฐานเป็นเจ้าพนักงานเรียกรับทรัพย์สินโดยมิชอบและปฏิบัติหน้าที่โดยมิชอบ",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 4, jailMonths: 6, fine: 60000,
            restitutionType: "คืนเงิน", restitutionAmount: 320000, refundUnit: "องค์การบริหารส่วนตำบลบางแสน",
            actualJailYears: 3, actualFine: 40000, damageValue: 320000,
          },
          fileNames: ["คำพิพากษาศาลจังหวัดชลบุรี_อ.2210-2568.pdf"],
        },
        {
          level: "APPEAL",
          person: "นายอำนาจ พิทักษ์ธรรม",
          status: "done",
          court: { type: "CORRUPTION", name: "ศาลอุทธรณ์คดีพิเศษ", blackNo: "อท. 310/2568", redNo: "อท. 88/2569", date: "2026-04-22" },
          fields: {
            statCountAs: "คดีชี้มูลที่ศาลพิพากษาลงโทษ", trackingGroup: "กลุ่มงานติดตามผลคดี",
            caseNatureNo: "5", verdictType: "1", verdictStage: "2.1 ศาลอุทธรณ์พิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษาแก้เป็นจำคุก 3 ปี ปรับ 40,000 บาท นอกจากที่แก้ให้เป็นไปตามคำพิพากษาศาลชั้นต้น",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 3, fine: 40000,
            restitutionType: "คืนเงิน", restitutionAmount: 320000, refundUnit: "องค์การบริหารส่วนตำบลบางแสน",
            actualJailYears: 3, actualFine: 40000, damageValue: 320000,
          },
          fileNames: ["คำพิพากษาศาลอุทธรณ์_อท.88-2569.pdf"],
        },
        {
          level: "SUPREME",
          person: "นายอำนาจ พิทักษ์ธรรม",
          status: "done",
          court: { type: "CORRUPTION", name: "ศาลฎีกา แผนกคดีทุจริตและประพฤติมิชอบ", blackNo: "ฎท. 45/2569", redNo: "ฎท. 102/2569", date: "2026-09-30" },
          fields: {
            statCountAs: "คดีชี้มูลที่ศาลพิพากษาลงโทษ", trackingGroup: "กลุ่มงานติดตามผลคดี",
            caseNatureNo: "5", verdictType: "1", verdictStage: "3.1 ศาลฎีกาพิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษายืนตามคำพิพากษาศาลอุทธรณ์",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 3, fine: 40000,
            restitutionType: "คืนเงิน", restitutionAmount: 320000, refundUnit: "องค์การบริหารส่วนตำบลบางแสน",
            isFinal: true, finalLetterNo: "ศาลฎีกา ที่ ศฎ 0012/4521 ลงวันที่ 15 ต.ค. 2569",
            actualJailYears: 2, actualJailMonths: 8, actualFine: 40000,
            suspendedYears: 0, probationYears: 1, communityHours: 48,
            actualOther: "ได้รับการลดวันต้องโทษตามพระราชกฤษฎีกาพระราชทานอภัยโทษ",
            damageValue: 320000,
          },
          fileNames: ["คำพิพากษาศาลฎีกา_ฎท.102-2569.pdf"],
        },
      ],
    },
    {
      caseId: "คดี-100001/2569",
      by: "นายณัฐพล บัวทุม",
      records: [
        {
          level: "FIRST",
          person: "นายวิชัย การกุศล",
          status: "done",
          court: { type: "CORRUPTION", name: "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 1", blackNo: "อท. 58/2568", redNo: "อท. 112/2569", date: "2026-03-18" },
          fields: {
            caseNatureNo: "3", verdictType: "1", verdictStage: "1.1 ศาลชั้นต้นพิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษาว่าจำเลยมีความผิดฐานเป็นเจ้าพนักงานเบียดบังทรัพย์ จำคุก 3 ปี และให้คืนเงิน 85,000 บาท",
            offenseLaw: "อื่นๆ (โปรดระบุ)", offenseLawOther: "ประมวลกฎหมายอาญา มาตรา 147",
            jailYears: 3, restitutionType: "คืนเงิน", restitutionAmount: 85000,
            refundUnit: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาลพบุรี เขต 1", damageValue: 85000,
          },
          fileNames: ["คำพิพากษาศาลชั้นต้น_อท.112-2569.pdf"],
        },
        {
          level: "APPEAL",
          person: "นายวิชัย การกุศล",
          status: "done",
          court: { type: "CORRUPTION", name: "ศาลอุทธรณ์คดีพิเศษ", blackNo: "อท. 21/2569", redNo: "อท. 64/2569", date: "2026-08-27" },
          fields: {
            caseNatureNo: "3", verdictType: "1", verdictStage: "2.1 ศาลอุทธรณ์พิพากษาลงโทษทุกราย",
            resultDetail: "พิพากษาแก้เป็นจำคุก 2 ปี นอกจากที่แก้ให้เป็นไปตามคำพิพากษาศาลชั้นต้น",
            offenseLaw: "อื่นๆ (โปรดระบุ)", offenseLawOther: "ประมวลกฎหมายอาญา มาตรา 147",
            jailYears: 2, restitutionType: "คืนเงิน", restitutionAmount: 85000,
            refundUnit: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาลพบุรี เขต 1",
            isFinal: true, finalLetterNo: "ปท 0012/2569",
            actualJailYears: 2, damageValue: 85000,
          },
          fileNames: ["คำพิพากษาศาลอุทธรณ์_อท.64-2569.pdf"],
        },
      ],
    },
    {
      caseId: "คดี-100002/2569",
      by: "นายณัฐพล บัวทุม",
      records: [
        {
          level: "FIRST",
          person: "นายธีระ วัฒนกุล",
          status: "done",
          court: { type: "CORRUPTION", name: "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 4", blackNo: "อท. 77/2569", redNo: "อท. 140/2569", date: "2026-07-09" },
          fields: {
            caseNatureNo: "2", verdictType: "2", verdictStage: "1.2 ศาลชั้นต้นพิพากษายกฟ้อง",
            resultDetail: "พยานหลักฐานโจทก์ยังไม่พอฟังว่าจำเลยกระทำความผิด พิพากษายกฟ้อง",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157", damageValue: 420000,
          },
          fileNames: ["คำพิพากษาศาลชั้นต้น_อท.140-2569.pdf"],
        },
      ],
    },
    {
      caseId: "คดี-100004/2569",
      paccSourceId: "สำนวน-0012/2569",
      by: "นางกานดา รักษ์ธรรม",
      /* ตัวอย่างหลายบุคคลในชั้นเดียวกัน: จำเลยที่ 1 ลงโทษ (บันทึกแล้ว) / จำเลยที่ 2 ยกฟ้อง (ร่าง) */
      caseFields: { defendants: ["นายสมชาย ทุจริตมั่น", "นายประเสริฐ ร่วมคิด"] },
      records: [
        {
          level: "FIRST",
          person: "นายสมชาย ทุจริตมั่น",
          status: "done",
          court: { type: "PROVINCIAL", name: "ศาลจังหวัดสระบุรี", blackNo: "อ. 230/2568", redNo: "อ. 512/2569", date: "2026-09-15" },
          fields: {
            caseNatureNo: "1", verdictType: "1", verdictStage: "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
            resultDetail: "จำเลยที่ 1 มีความผิด จำคุก 1 ปี 6 เดือน ปรับ 30,000 บาท โทษจำคุกให้รอการลงโทษไว้ 2 ปี",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            jailYears: 1, jailMonths: 6, fine: 30000,
            actualFine: 30000, suspendedYears: 2, probationYears: 1, communityHours: 24,
            damageValue: 1250000,
          },
          fileNames: [],
        },
        {
          level: "FIRST",
          person: "นายประเสริฐ ร่วมคิด",
          status: "draft",
          court: { type: "PROVINCIAL", name: "ศาลจังหวัดสระบุรี", blackNo: "อ. 230/2568", redNo: "อ. 512/2569", date: "2026-09-15" },
          fields: {
            caseNatureNo: "1", verdictType: "2", verdictStage: "1.3 ศาลชั้นต้นพิพากษาลงโทษบางรายและยกฟ้องบางราย",
            resultDetail: "พยานหลักฐานโจทก์ไม่พอฟังว่าจำเลยที่ 2 ร่วมกระทำความผิด พิพากษายกฟ้องจำเลยที่ 2",
            offenseLaw: "ประมวลกฎหมายอาญา มาตรา 157",
            damageValue: 1250000,
          },
          fileNames: [],
        },
      ],
    },
  ];

  global.ECMISVerdictLists = {
    SAMPLE_RECORDS: SAMPLE_RECORDS,
    LEVELS: LEVELS,
    PARTS: PARTS,
    levelPart: (code) => (LEVELS.find((l) => l.code === code) || {}).part || "",
    CASE_NATURES: CASE_NATURES,
    VERDICT_TYPES: VERDICT_TYPES,
    VERDICT_STAGES: VERDICT_STAGES,
    OFFENSE_LAWS: OFFENSE_LAWS,
    RESTITUTION_TYPES: RESTITUTION_TYPES,
    PROSECUTOR_STATUSES: PROSECUTOR_STATUSES,
    BOARD_OUTCOMES: BOARD_OUTCOMES,
    ACT7_SAMPLE: ACT7_SAMPLE,
  };
})(typeof window !== "undefined" ? window : globalThis);
