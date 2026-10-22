/* ECMIS 10.1 — รายการศาลและอัยการ (ฉบับร่าง) ใช้ทั้งหน้า 02 และบันทึกผลคำพิพากษา
   ร่างจากรายชื่อศาลเดิมในหน้า 02 (dl_crimCourts) และข้อมูลสาธารณะ — ยังไม่ใช่รายการทางการ
   เมื่อได้รายการจริง แทนที่ค่าคงที่ในไฟล์นี้ไฟล์เดียว (โครงสร้าง code/name เดิม) หน้าอื่นไม่ต้องแก้
   - PARTS         2 ส่วนของคำพิพากษา: ศาลคดีอาญาทุจริตและประพฤติมิชอบ / ศาลปกครอง
   - COURT_TYPES   ประเภทศาล 4 ประเภท (ทุจริต / แขวง / จังหวัด / ปกครอง) — ใช้ร่วมกับ "ประเภทศาล" ในส่วนคำสั่งอัยการหน้า 02
   - COURTS        ชื่อศาล (รายการตัวอย่าง ไม่มี "อื่นๆ") ตาม ประเภทศาล × ชั้นศาล (FIRST/APPEAL/SUPREME, ADMIN_FIRST/ADMIN_SUPREME)
   - PROSECUTOR_TYPES / PROSECUTOR_OFFICES  ประเภทอัยการ → ชื่อสำนักงานอัยการ
   OTHER = ตัวเลือก "อื่นๆ (โปรดระบุ)" ใช้กับสำนักงานอัยการเท่านั้น; ไฟล์นี้เป็นข้อมูลล้วน ทดสอบใน node ได้ */
(function (global) {
  "use strict";

  const OTHER = "อื่นๆ (โปรดระบุ)"; /* คำเดียวกับรายการใน Excel */

  /* 77 จังหวัด (กรุงเทพมหานคร + 76 จังหวัด) */
  const PROVINCES = [
    "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา",
    "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
    "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน",
    "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
    "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต",
    "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
    "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
    "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
    "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี",
    "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี",
  ];
  const UPCOUNTRY = PROVINCES.filter((p) => p !== "กรุงเทพมหานคร");
  const REGIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  /* คำพิพากษามี 2 ส่วน: ศาลคดีอาญาทุจริตและประพฤติมิชอบ (ชั้นต้น/อุทธรณ์/ฎีกา) และ ศาลปกครอง (ชั้นต้น/สูงสุด) */
  const PARTS = [
    { code: "CRIMINAL", name: "ศาลคดีอาญาทุจริตและประพฤติมิชอบ" },
    { code: "ADMIN", name: "ศาลปกครอง" },
  ];
  /* ประเภทศาล — แถวในแบบสรุป Word: CORRUPTION = "ศาลคดีทุจริต ในแต่ละชั้น",
     DISTRICT/PROVINCIAL = "ศาลคดีประพฤติมิชอบ (ศาลแขวง/ศาลจังหวัด)", ADMIN = "ศาลปกครอง" */
  const COURT_TYPES = [
    { code: "CORRUPTION", name: "ศาลคดีทุจริต", part: "CRIMINAL" },
    { code: "DISTRICT", name: "ศาลแขวง", part: "CRIMINAL" },
    { code: "PROVINCIAL", name: "ศาลจังหวัด", part: "CRIMINAL" },
    { code: "ADMIN", name: "ศาลปกครอง", part: "ADMIN" },
  ];
  /* รหัสเดิมก่อนแยกศาลแขวง/ศาลจังหวัด — อ่านได้ แปลงตามชื่อศาลด้วย normalizeType() */
  const LEGACY_TYPES = { MISCONDUCT: "ศาลคดีประพฤติมิชอบ (ศาลแขวง/ศาลจังหวัด)" };

  /* ชื่อศาล (รายการตัวอย่าง — ไม่มีตัวเลือก "อื่นๆ") ตาม ประเภทศาล × ชั้นศาล */
  const CRIMINAL_APPEAL = ["ศาลอุทธรณ์"].concat(REGIONS.map((n) => "ศาลอุทธรณ์ภาค " + n));
  const COURTS = {
    CORRUPTION: {
      FIRST: ["ศาลอาญาคดีทุจริตและประพฤติมิชอบกลาง"].concat(REGIONS.map((n) => "ศาลอาญาคดีทุจริตและประพฤติมิชอบภาค " + n)),
      APPEAL: ["ศาลอุทธรณ์คดีพิเศษ", "ศาลอุทธรณ์คดีทุจริตและประพฤติมิชอบ"],
      SUPREME: ["ศาลฎีกา แผนกคดีทุจริตและประพฤติมิชอบ", "ศาลฎีกา"],
    },
    DISTRICT: {
      FIRST: [
        "ศาลแขวงพระนครเหนือ", "ศาลแขวงพระนครใต้", "ศาลแขวงดุสิต", "ศาลแขวงปทุมวัน", "ศาลแขวงธนบุรี", "ศาลแขวงตลิ่งชัน",
        "ศาลแขวงนนทบุรี", "ศาลแขวงสมุทรปราการ", "ศาลแขวงชลบุรี", "ศาลแขวงพัทยา", "ศาลแขวงระยอง", "ศาลแขวงนครราชสีมา",
        "ศาลแขวงขอนแก่น", "ศาลแขวงอุดรธานี", "ศาลแขวงเชียงใหม่", "ศาลแขวงเชียงราย", "ศาลแขวงพิษณุโลก", "ศาลแขวงนครสวรรค์",
        "ศาลแขวงสงขลา", "ศาลแขวงหาดใหญ่", "ศาลแขวงนครศรีธรรมราช", "ศาลแขวงสุราษฎร์ธานี", "ศาลแขวงภูเก็ต",
      ],
      APPEAL: CRIMINAL_APPEAL,
      SUPREME: ["ศาลฎีกา"],
    },
    PROVINCIAL: {
      FIRST: ["ศาลอาญา", "ศาลอาญากรุงเทพใต้", "ศาลอาญาธนบุรี", "ศาลอาญามีนบุรี", "ศาลอาญาตลิ่งชัน", "ศาลอาญาพระโขนง"].concat(
        UPCOUNTRY.map((p) => "ศาลจังหวัด" + p),
      ),
      APPEAL: CRIMINAL_APPEAL,
      SUPREME: ["ศาลฎีกา"],
    },
    ADMIN: {
      ADMIN_FIRST: ["ศาลปกครองกลาง"].concat(
        ["เชียงใหม่", "สงขลา", "นครราชสีมา", "ขอนแก่น", "พิษณุโลก", "ระยอง", "นครศรีธรรมราช", "อุดรธานี", "อุบลราชธานี",
          "ลพบุรี", "เพชรบุรี", "ภูเก็ต", "นครสวรรค์", "สุพรรณบุรี", "ยะลา"].map((p) => "ศาลปกครอง" + p),
      ),
      ADMIN_SUPREME: ["ศาลปกครองสูงสุด"],
    },
  };

  /* ประเภทอัยการ (อัยการต้นทาง) → สำนักงานอัยการ */
  const PROSECUTOR_TYPES = [
    { code: "CORRUPTION", name: "อัยการคดีทุจริต" },
    { code: "MISCONDUCT", name: "อัยการคดีประพฤติมิชอบจังหวัด" },
  ];
  const PROSECUTOR_OFFICES = {
    CORRUPTION: [1, 2, 3]
      .map((n) => "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต " + n)
      .concat(REGIONS.map((n) => "สำนักงานอัยการคดีปราบปรามการทุจริตภาค " + n)),
    MISCONDUCT: ["สำนักงานอัยการพิเศษฝ่ายคดีอาญา (กรุงเทพมหานคร)"].concat(UPCOUNTRY.map((p) => "สำนักงานอัยการจังหวัด" + p)),
  };

  const norm = (s) =>
    String(s == null ? "" : s)
      .replace(/^สนง\.\s*/, "สำนักงาน")
      .replace(/\s+/g, " ")
      .trim();

  function courtsFor(type, level) {
    return ((COURTS[type] || {})[level] || []).slice();
  }
  function officesFor(type) {
    return (PROSECUTOR_OFFICES[type] || []).slice();
  }
  /* ชื่อศาล → ประเภทศาล (ค้นในรายการก่อน แล้วใช้กฎ: ปกครอง / ทุจริต,คดีพิเศษ / แขวง / จังหวัด,ศาลอาญา) */
  function courtTypeOfName(name) {
    const n = norm(name);
    if (!n) return "";
    for (const type of Object.keys(COURTS)) {
      for (const lv of Object.keys(COURTS[type])) if (COURTS[type][lv].indexOf(n) >= 0) return type;
    }
    if (/ปกครอง/.test(n)) return "ADMIN";
    if (/ทุจริต|คดีพิเศษ/.test(n)) return "CORRUPTION";
    if (/แขวง/.test(n)) return "DISTRICT";
    if (/จังหวัด|^ศาลอาญา/.test(n)) return "PROVINCIAL";
    return "";
  }
  /* รหัสประเภทศาลที่บันทึกไว้ → รหัสปัจจุบัน (MISCONDUCT เดิม = ศาลแขวง/ศาลจังหวัด ตามชื่อศาล) */
  function normalizeType(code, name) {
    if (!code) return courtTypeOfName(name);
    if (code === "MISCONDUCT") {
      const t = courtTypeOfName(name);
      return t === "DISTRICT" || t === "PROVINCIAL" ? t : "";
    }
    return COURT_TYPES.some((t) => t.code === code) ? code : "";
  }
  /* ประเภทศาลที่เลือกได้ในชั้นนั้น (ชั้นศาลอาญา = ทุจริต/แขวง/จังหวัด, ชั้นศาลปกครอง = ศาลปกครอง) */
  function courtTypesForLevel(level) {
    return COURT_TYPES.filter((t) => !level || (COURTS[t.code] && COURTS[t.code][level]));
  }
  /* ประเภทศาล → ประเภทอัยการต้นทาง (ค่าเริ่มต้นในหน้า 02) */
  function prosecutorTypeForCourt(code) {
    if (code === "CORRUPTION") return "CORRUPTION";
    if (code === "DISTRICT" || code === "PROVINCIAL" || code === "MISCONDUCT") return "MISCONDUCT";
    return "";
  }
  /* ข้อความอัยการต้นทางเดิม (เช่น "สนง.อัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1") → { type, name } ; ไม่พบ = OTHER */
  function findOffice(text) {
    const n = norm(text);
    if (!n) return { type: "", name: "" };
    for (const type of Object.keys(PROSECUTOR_OFFICES)) {
      if (PROSECUTOR_OFFICES[type].indexOf(n) >= 0) return { type: type, name: n };
    }
    return { type: "", name: OTHER, other: n };
  }
  const typeName = (list, code) => {
    const t = list.find((x) => x.code === code);
    return t ? t.name : "";
  };

  global.ECMISCourtLists = {
    OTHER: OTHER,
    PROVINCES: PROVINCES,
    PARTS: PARTS,
    COURT_TYPES: COURT_TYPES,
    COURTS: COURTS,
    normalizeType: normalizeType,
    courtTypesForLevel: courtTypesForLevel,
    prosecutorTypeForCourt: prosecutorTypeForCourt,
    partOfType: (code) => {
      const t = COURT_TYPES.find((x) => x.code === code);
      return t ? t.part : "";
    },
    PROSECUTOR_TYPES: PROSECUTOR_TYPES,
    PROSECUTOR_OFFICES: PROSECUTOR_OFFICES,
    courtsFor: courtsFor,
    officesFor: officesFor,
    courtTypeOfName: courtTypeOfName,
    courtTypeName: (code) => typeName(COURT_TYPES, code) || LEGACY_TYPES[code] || "",
    prosecutorTypeName: (code) => typeName(PROSECUTOR_TYPES, code),
    findOffice: findOffice,
  };
})(typeof window !== "undefined" ? window : globalThis);
