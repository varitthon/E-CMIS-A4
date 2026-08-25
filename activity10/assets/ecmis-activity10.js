/**
 * E-CMIS Activity 10: Production-Grade Legal System Engine & Data Store
 * Project: กิจกรรมที่ 10 (ระบบกฎหมายในทางคดี)
 */

(function(global) {
 'use strict';

 // Data Version Key for LocalStorage Sync (v39: ปรับปรุง Flow S18-S22 และชื่อมาตรฐานสมบูรณ์)
 const DATA_VERSION = 'v42_remove_case_0045';
 const STORAGE_KEY = 'ecmis_act10_cases_' + DATA_VERSION;

 function getDateWithOffset(daysOffset) {
 const d = new Date();
 d.setDate(d.getDate() + daysOffset);
 return d.toISOString().split('T')[0];
 }

 // Initial Cases in Legal Inbox (ตัวอย่างสำนวนที่ครอบคลุมทุกบทบาทในการทำงาน)
 const INITIAL_CASES = [
 {
 id: "คดี-100010/2569",
 title: "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตจัดซื้ออุปกรณ์ระบบสารสนเทศและกล้องวงจรปิด",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายพิชัย เทคโนโลยี (อดีตผู้อำนวยการสำนักสารสนเทศ)",
 officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
 assignedRole: "admin_legal",
 status: "รอธุรการรับผลคำวินิจฉัย อสส.",
 statusCode: "PENDING_ADMIN_OAG_VERDICT_INTAKE",
 statusBadge: "bg-danger text-white",
 lawReceiveNo: "0028/2569",
 paccCaseNo: "0065/2568",
 blackNo: "อ. 150/2569",
 redNo: "อ. 420/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 12 มี.ค. 2585)",
 slaTotalDays: 15,
 slaDaysRemaining: 15,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(0),
 dueDate: getDateWithOffset(15),
 workflowStep: 19,
 docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
 docNo: "อส 0001/6789",
 centralSarabanNo: "2569/5102",
 finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
 externalDispatchNo: "ที่ ปปท 0014/1150",
 dispatchMethod: "postal_ems",
 emsTrackingNo: "ED887711223TH",
 signedPresidentName: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
 signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1150.pdf"
 },
 {
 id: "คดี-100011/2569",
 title: "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตโครงการก่อสร้างระบบระบายน้ำชุมชน",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายเกรียงศักดิ์ โยธาการ (อดีตวิศวกรควบคุมงาน)",
 officer: "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)",
 assignedRole: "dir_legal",
 status: "ผอ.กอง ตรวจสอบคำวินิจฉัย อสส. & สั่งการ",
 statusCode: "PENDING_DIRECTOR_OAG_VERDICT_REVIEW",
 statusBadge: "bg-warning text-dark",
 lawReceiveNo: "0029/2569",
 paccCaseNo: "0068/2568",
 blackNo: "อ. 155/2569",
 redNo: "อ. 428/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 18 เม.ย. 2585)",
 slaTotalDays: 15,
 slaDaysRemaining: 15,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(0),
 dueDate: getDateWithOffset(15),
 workflowStep: 20,
 docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
 docNo: "อส 0001/6801",
 centralSarabanNo: "2569/5115",
 externalDispatchNo: "ที่ ปปท 0014/1180",
 oagVerdictNo: "อส 0001/6801",
 oagVerdictDate: getDateWithOffset(0),
 oagVerdictReceiveDate: getDateWithOffset(0),
 oagVerdictDecision: "PROSECUTE",
 oagVerdictSummary: "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดให้ฟ้องคดีผู้ถูกกล่าวหาตามความเห็นแย้งของคณะกรรมการ ป.ป.ท.",
 oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6801.pdf"
 },
 {
 id: "คดี-100012/2569",
 title: "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตเงินอุดหนุนโครงการฝึกอาชีพเยาวชน",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นางสุมาลี ส่งเสริม (อดีตหัวหน้าฝ่ายพัฒนาชุมชน)",
 officer: "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)",
 assignedRole: "group_director",
 status: "ผอ.กลุ่มงาน ตรวจสอบคำวินิจฉัย อสส. & มอบหมายนิติกร",
 statusCode: "PENDING_GROUP_OAG_VERDICT_REVIEW",
 statusBadge: "bg-info text-dark",
 lawReceiveNo: "0030/2569",
 paccCaseNo: "0070/2568",
 blackNo: "อ. 160/2569",
 redNo: "อ. 435/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 2 พ.ค. 2585)",
 slaTotalDays: 15,
 slaDaysRemaining: 14,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-1),
 dueDate: getDateWithOffset(14),
 workflowStep: 21,
 docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
 docNo: "อส 0001/6810",
 centralSarabanNo: "2569/5120",
 externalDispatchNo: "ที่ ปปท 0014/1195",
 oagVerdictNo: "อส 0001/6810",
 oagVerdictDate: getDateWithOffset(-1),
 oagVerdictReceiveDate: getDateWithOffset(-1),
 oagVerdictDecision: "NON_PROSECUTE",
 oagVerdictSummary: "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของพนักงานอัยการ",
 oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6810.pdf",
 directorOagVerdictNotes: "รับทราบคำวินิจฉัยชี้ขาดของอัยการสูงสุด มอบหมาย ผอ.กลุ่มงานความเห็นแย้ง มอบหมายนิติกรสรุปผลและแจ้งกองบริหารคดีต่อไป"
 },
 {
 id: "คดี-100013/2569",
 title: "พิจารณาคำวินิจฉัยชี้ขาดของอัยการสูงสุด คดีทุจริตจัดซื้อครุภัณฑ์ยานพาหนะและขนส่ง",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายสุรชัย ขนส่งยนต์ (อดีตนายช่างเครื่องกล)",
 officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
 assignedRole: "legal_officer",
 status: "นิติกรบันทึกผล & แจ้งกองบริหารคดี",
 statusCode: "PENDING_OFFICER_FINAL_NOTIFICATION",
 statusBadge: "bg-primary text-white",
 lawReceiveNo: "0031/2569",
 paccCaseNo: "0072/2568",
 blackNo: "อ. 165/2569",
 redNo: "อ. 440/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ค. 2585)",
 slaTotalDays: 15,
 slaDaysRemaining: 14,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-1),
 dueDate: getDateWithOffset(14),
 workflowStep: 22,
 docType: "คำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.)",
 docNo: "อส 0001/6822",
 centralSarabanNo: "2569/5135",
 externalDispatchNo: "ที่ ปปท 0014/1210",
 oagVerdictNo: "อส 0001/6822",
 oagVerdictDate: getDateWithOffset(-1),
 oagVerdictReceiveDate: getDateWithOffset(-1),
 oagVerdictDecision: "PROSECUTE",
 oagVerdictSummary: "อัยการสูงสุดมีคำวินิจฉัยชี้ขาดให้ฟ้องคดีผู้ถูกกล่าวหาตามความเห็นแย้งของคณะกรรมการ ป.ป.ท.",
 oagVerdictFile: "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6822.pdf",
 directorOagVerdictNotes: "รับทราบคำวินิจฉัยชี้ขาดของอัยการสูงสุด มอบหมาย ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการต่อ",
 groupDirectorOagVerdictNotes: "มอบหมายนิติกรเจ้าของสำนวน สรุปผลคำวินิจฉัยชี้ขาดของ อสส. และจัดทำหนังสือแจ้งกองบริหารคดีดำเนินการต่อไป"
 },
 {
 id: "คดี-100008/2569",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อครุภัณฑ์การศึกษาและสื่อการเรียนการสอน",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายอำนาจ การศึกษา (อดีตผู้อำนวยการกองการศึกษา)",
 officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
 assignedRole: "legal_officer",
 status: "นิติกรเตรียมจัดส่งหนังสือให้อัยการสูงสุด (อสส.)",
 statusCode: "PENDING_OFFICER_EXTERNAL_DISPATCH",
 statusBadge: "bg-primary text-white",
 lawReceiveNo: "0024/2569",
 paccCaseNo: "0058/2568",
 blackNo: "อ. 142/2569",
 redNo: "อ. 405/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 20 ธ.ค. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 14,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-1),
 dueDate: getDateWithOffset(14),
 workflowStep: 15,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0038/2569",
 centralSarabanNo: "2569/4530",
 finalOpinionType: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
 finalDispatchRound2No: "0095/2569",
 finalDispatchRound2Date: getDateWithOffset(-1),
 externalDispatchNo: "ที่ ปปท 0014/1288",
 signedPresidentName: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
 signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1288.pdf",
 adminVerifiedDate: getDateWithOffset(0),
 adminVerificationNotes: "ตรวจสอบหนังสือความเห็นแย้งฉบับลงนามสมบูรณ์และเลขส่งภายนอกเรียบร้อยแล้ว มอบนิติกรเจ้าของสำนวนจัดส่งให้อัยการสูงสุด (อสส.) ต่อไป"
 },
 {
 id: "คดี-100009/2569",
 title: "พิจารณาคำสั่งไม่ฟ้องคดีจัดจ้างปรับปรุงภูมิทัศน์สวนสาธารณะเฉลิมพระเกียรติ (เห็นชอบตามอัยการ)",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายสมเกียรติ พัฒนาเมือง (อดีตนายกเทศมนตรี)",
 officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
 assignedRole: "legal_officer",
 status: "นิติกรเตรียมจัดส่งหนังสือให้อัยการต้นทาง (ไปรษณีย์ EMS)",
 statusCode: "PENDING_OFFICER_EXTERNAL_DISPATCH",
 statusBadge: "bg-info text-dark",
 lawReceiveNo: "0025/2569",
 paccCaseNo: "0060/2568",
 blackNo: "อ. 145/2569",
 redNo: "อ. 412/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 15 ม.ค. 2585)",
 slaTotalDays: 15,
 slaDaysRemaining: 13,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-2),
 dueDate: getDateWithOffset(13),
 workflowStep: 15,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0042/2569",
 centralSarabanNo: "2569/4535",
 finalOpinionType: "เห็นชอบตามคำสั่งไม่ฟ้องของพนักงานอัยการ",
 finalDispatchRound2No: "0096/2569",
 finalDispatchRound2Date: getDateWithOffset(-1),
 externalDispatchNo: "ที่ ปปท 0014/1290",
 signedPresidentName: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
 signedDocFile: "หนังสือแจ้งมติเห็นชอบ_ฉบับลงนามสมบูรณ์_ปปท0014_1290.pdf",
 adminVerifiedDate: getDateWithOffset(0),
 adminVerificationNotes: "ตรวจสอบหนังสือแจ้งมติเห็นชอบฉบับลงนามสมบูรณ์และเลขส่งภายนอกเรียบร้อยแล้ว มอบนิติกรเจ้าของสำนวนจัดส่งให้อัยการต้นทางทางไปรษณีย์ EMS ต่อไป"
 },
 {
 id: "คดี-100007/2569",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการก่อสร้างอาคารเอนกประสงค์เทศบาล",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 3",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายเชาวลิต ช่างก่อ (อดีตนายช่างโยธาอาวุโส)",
 officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)",
 assignedRole: "admin_legal",
 status: "ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)",
 statusCode: "PENDING_ADMIN_SIGNED_RECEIVE",
 statusBadge: "bg-warning text-dark",
 lawReceiveNo: "0022/2569",
 paccCaseNo: "0052/2568",
 blackNo: "อ. 135/2569",
 redNo: "อ. 390/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 18 พ.ย. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 12,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-3),
 dueDate: getDateWithOffset(12),
 workflowStep: 17,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0031/2569",
 centralSarabanNo: "2569/4520",
 finalDispatchRound2No: "0088/2569",
 finalDispatchRound2Date: getDateWithOffset(-1),
 externalDispatchNo: "ที่ ปปท 0014/1245",
 signedPresidentName: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
 signedDocFile: "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf",
 signedExecutiveDate: getDateWithOffset(0),
 executiveSignNotesRound2: "ผู้บริหารลงนามหนังสือความเห็นแย้งฉบับสมบูรณ์เรียบร้อยแล้ว ส่งคืนธุรการกองกฎหมายเพื่อตรวจรับและออกเลขส่งภายนอก"
 },
 {
 id: "คดี-100005/2569",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตโครงการก่อสร้างเขื่อนป้องกันตลิ่ง",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 2",
 accuser: "สำนักงาน ป.ป.ท.",
 accused: "นายมนตรี ว่องไว (อดีตวิศวกรโยธาชำนาญการ)",
 officer: "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)",
 assignedRole: "admin_legal",
 status: "ธุรการรับผลมติ",
 statusCode: "RETURNED_FROM_EXEC",
 statusBadge: "bg-success text-white",
 lawReceiveNo: "0019/2569",
 paccCaseNo: "0038/2568",
 blackNo: "อ. 120/2569",
 redNo: "อ. 355/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 12 ก.ย. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 7,
 slaAlert: "sla-warning",
 dateReceived: getDateWithOffset(-8),
 dueDate: getDateWithOffset(7),
 workflowStep: 8,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0025/2569",
 legalOpinion: "ผู้บริหารลงนามชี้ขาดเห็นแย้งคำสั่งไม่ฟ้องแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด",
 signedBy: "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)",
 signedDate: "21 ส.ค. 2569",
 signedExecutiveOrder: "เห็นชอบ",
 signedDocFile: "หนังสือผลมติ_2569_006.pdf",
 adminDispatchNo: "2569/0410",
 adminDispatchDate: "20 ส.ค. 2569",
 centralSarabanNo: "2569/4502",
 boardMeetingNo: "14/2569",
 boardMeetingDate: "21 ส.ค. 2569",
 boardResolution: "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
 boardResolutionDetail: "ที่ประชุมคณะกรรมการ ป.ป.ท. ได้พิจารณาสำนวนการไต่สวนข้อเท็จจริงประกอบบันทึกความเห็นของกองกฎหมายแล้ว มีมติเป็นเอกฉันท์เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ และมอบหมายให้เลขาธิการ ป.ป.ท. ทำความเห็นแย้งส่งอัยการสูงสุดชี้ขาดตามขั้นตอนกฎหมายต่อไป"
 },
 {
 id: "คดี-100003/2569",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตเงินอุดหนุนโครงการส่งเสริมอาชีพชุมชน",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สนง. ป.ป.ท. เขต 4",
 accuser: "สำนักงาน ป.ป.ท. เขต 4",
 accused: "นายอำนาจ พิทักษ์ธรรม (อดีตหัวหน้าฝ่ายพัฒนาชุมชน)",
 officer: "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)",
 assignedRole: "dir_legal",
 status: "ผอ.กองกฎหมายพิจารณา",
 statusCode: "PENDING_DIRECTOR",
 statusBadge: "bg-primary text-white",
 lawReceiveNo: "0017/2569",
 paccCaseNo: "0049/2568",
 blackNo: "อ. 115/2569",
 redNo: "อ. 340/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 15 พ.ย. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 13,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-2),
 dueDate: getDateWithOffset(13),
 workflowStep: 2,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0019/2569",
 centralSarabanNo: "2569/4501"
 },
 {
 id: "คดี-100002/2569",
 title: "พิจารณาความเห็นแย้งคดีจัดซื้อครุภัณฑ์วิทยาศาสตร์ราคาสูงเกินจริง",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สนง. ป.ป.ท. เขต 1",
 accuser: "สำนักงาน ป.ป.ท. เขต 1",
 accused: "นายธีระ วัฒนกุล (อดีตเจ้าพนักงานวิทยาศาสตร์)",
 officer: "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)",
 assignedRole: "group_director",
 status: "ผอ.กลุ่มงานความเห็นแย้งพิจารณา",
 statusCode: "PENDING_GROUP_DIRECTOR",
 statusBadge: "bg-info text-dark",
 lawReceiveNo: "0015/2569",
 paccCaseNo: "0040/2568",
 blackNo: "อ. 108/2569",
 redNo: "อ. 312/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 5 ต.ค. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 11,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-4),
 dueDate: getDateWithOffset(11),
 workflowStep: 3,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0015/2569",
 directorNotes: "มอบกลุ่มงานความเห็นแย้ง มอบหมายนิติกรเจ้าของสำนวนจัดทำความเห็นโดยด่วน",
 centralSarabanNo: "2569/4488"
 },
 {
 id: "คดี-100004/2569",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
 accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
 accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)",
 officer: "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)",
 assignedRole: "dir_legal",
 status: "พิจารณาความเห็นของนิติกร",
 statusCode: "PENDING_DIRECTOR_APPROVAL",
 statusBadge: "bg-primary text-white",
 lawReceiveNo: "0014/2569",
 paccCaseNo: "0012/2568",
 blackNo: "อ. 104/2569",
 redNo: "อ. 308/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
 statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
 slaTotalDays: 15,
 slaDaysRemaining: 15,
 slaAlert: "sla-normal",
 dateReceived: getDateWithOffset(-8),
 dueDate: getDateWithOffset(15),
 workflowStep: 6,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0012/2569",
 legalOpinion: "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ เนื่องจากพยานหลักฐานจากการไต่สวนของคณะกรรมการ ป.ป.ท. มีน้ำหนักรับฟังได้มั่นคงว่าผู้ถูกกล่าวหามีเจตนาเอื้อประโยชน์ให้แก่ผู้เสนอราคา",
 opinionType: "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ",
 groupDirectorEndorsement: "เห็นชอบร่างความเห็นแย้งของนิติกร เสนอ ผอ.กองกฎหมายเพื่อโปรดพิจารณา",
 groupDirectorApprovedDate: "18 ส.ค. 2569",
 centralSarabanNo: "2569/4470"
 },
 {
 id: "คดี-100001/2569",
 title: "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 prosecutorCaseTypeNo: "1",
 prosecutorCaseTypeName: "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: "สนง. ป.ป.ท. เขต 3",
 accuser: "สำนักงาน ป.ป.ท. เขต 3",
 accused: "นายวิชัย การกุศล (เจ้าพนักงานจัดเก็บรายได้)",
 officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)",
 assignedRole: "legal_officer",
 status: "นิติกรจัดทำความเห็น",
 statusCode: "DRAFTING_OPINION",
 statusBadge: "bg-warning text-dark",
 lawReceiveNo: "0012/2569",
 paccCaseNo: "0031/2568",
 blackNo: "อ. 98/2569",
 redNo: "อ. 290/2569",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)",
 slaTotalDays: 15,
 slaDaysRemaining: 5,
 slaAlert: "sla-danger",
 dateReceived: getDateWithOffset(-10),
 dueDate: getDateWithOffset(5),
 workflowStep: 4,
 docType: "คำสั่งไม่ฟ้องของพนักงานอัยการ",
 docNo: "อส 0009/2569",
 groupDirectorNotes: "มอบนิติกรณัฐพล จัดทำบันทึกความเห็นแย้งด่วนที่สุด",
 centralSarabanNo: "2569/4412"
 }
 ];

 // ฐานข้อมูลสำนวน ป.ป.ท. สำหรับการลงรับเรื่อง (Intake Database)
 const PACC_INTAKE_DATABASE = [
 {
 id: "คดี-100000/2569",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคารส่วนกลาง",
 source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต 1",
 accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
 accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ",
 statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)",
 dateReceived: getDateWithOffset(-2),
 dueDate: getDateWithOffset(13),
 paccCaseNo: "0012/2568",
 blackNo: "อ. 104/2569",
 redNo: "อ. 308/2569",
 centralSarabanNo: "2569/4401"
 },
 {
 id: "คดี-100001/2569",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 title: "พิจารณาความเห็นแย้งคดีเบิกจ่ายเงินงบประมาณอุดหนุนโครงการฝึกอบรมเท็จ",
 source: "สนง. ป.ป.ท. เขต 3",
 accuser: "สำนักงาน ป.ป.ท. เขต 3",
 accused: "นายวิชัย การกุศล (เจ้าพนักงานจัดเก็บรายได้)",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "10 ปี (หมดอายุความ 15 ส.ค. 2579)",
 dateReceived: getDateWithOffset(-5),
 dueDate: getDateWithOffset(10),
 paccCaseNo: "0031/2568",
 blackNo: "อ. 98/2569",
 redNo: "อ. 290/2569",
 centralSarabanNo: "2569/4412"
 },
 {
 id: "คดี-100002/2569",
 category: "10.1",
 categoryName: "คดีอาญาทุจริตและคดีประพฤติมิชอบ",
 title: "ความเห็นแย้งคดีเจ้าหน้าที่เรียกรับผลประโยชน์ในการออกใบอนุญาตสีก่อสร้าง",
 source: "สนง. ป.ป.ท. เขต 1",
 accuser: "สำนักงาน ป.ป.ท. เขต 1",
 accused: "นายศิริโชค มีอำนาจ (หัวหน้าฝ่ายโยธา)",
 courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการ",
 statuteLimitation: "15 ปี (หมดอายุความ 10 ต.ค. 2584)",
 dateReceived: getDateWithOffset(-3),
 dueDate: getDateWithOffset(12),
 paccCaseNo: "0045/2568",
 blackNo: "อ. 112/2569",
 redNo: "อ. 319/2569",
 centralSarabanNo: "2569/4420"
 },
 {
 id: "คำร้อง-100007/2569",
 category: "10.2.1",
 categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
 title: "คำร้องขอเปิดเผยรายงานผลการตรวจสอบข้อเท็จจริงโครงการจัดซื้อกล้อง CCTV",
 source: "สมาคมพิทักษ์สิทธิประชาชนและสื่อมวลชน",
 accuser: "นายกานต์ สิทธิธรรม (ผู้ร้องเรียน)",
 accused: "สำนักงาน ป.ป.ท. (กองตรวจราชการ)",
 courtOrder: "คำร้องขอข้อมูลข่าวสารตาม พ.ร.บ. ข้อมูลข่าวสารฯ",
 statuteLimitation: "SLA 15 วันทำการ",
 dateReceived: getDateWithOffset(-1),
 dueDate: getDateWithOffset(14),
 paccCaseNo: "ขส. 0005/2569",
 blackNo: "-",
 redNo: "-",
 centralSarabanNo: "2569/4435"
 },
 {
 id: "คำร้อง-100008/2569",
 category: "10.2.1",
 categoryName: "การขอเปิดเผยข้อมูลข่าวสาร",
 title: "คำร้องขอคัดสำเนาเอกสารรายงานผลการดำเนินคดีทางวินัยเจ้าหน้าที่รัฐ",
 source: "สำนักข่าวร่วมพัฒนา",
 accuser: "นางสาวศิริพร บุญช่วย (ผู้แทนสำนักข่าว)",
 accused: "สำนักงาน ป.ป.ท. (กองกฎหมาย)",
 courtOrder: "คำร้องขอข้อมูลข่าวสารตาม พ.ร.บ. ข้อมูลข่าวสารฯ",
 statuteLimitation: "SLA 15 วันทำการ",
 dateReceived: getDateWithOffset(-4),
 dueDate: getDateWithOffset(11),
 paccCaseNo: "ขส. 0008/2569",
 blackNo: "-",
 redNo: "-",
 centralSarabanNo: "2569/4442"
 },
 {
 id: "อุทธรณ์-100009/2569",
 category: "10.2.2",
 categoryName: "การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร",
 title: "คำอุทธรณ์คำสั่งปฏิเสธไม่เปิดเผยข้อมูลข่าวสารลับเกี่ยวกับแผนปฏิบัติการสืบสวน",
 source: "คณะกรรมการวินิจฉัยการเปิดเผยข้อมูลข่าวสาร",
 accuser: "นายสมเกียรติ ยุติธรรม (ผู้อุทธรณ์)",
 accused: "สำนักงาน ป.ป.ท.",
 courtOrder: "คำอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลข่าวสาร",
 statuteLimitation: "SLA 30 วัน",
 dateReceived: getDateWithOffset(-6),
 dueDate: getDateWithOffset(24),
 paccCaseNo: "อธ. 0002/2569",
 blackNo: "-",
 redNo: "-",
 centralSarabanNo: "2569/4450"
 },
 {
 id: "คดีปกครอง-100006/2569",
 category: "10.3",
 categoryName: "คดีศาลปกครอง",
 title: "หมายเรียกและสำเนาคำฟ้องคดีพิพาทเกี่ยวกับการกระทำละเมิดของหน่วยงานทางปกครอง (เพิกถอนคำสั่งทางปกครอง)",
 source: "ศาลปกครองกลาง (แผนกคดีบริหารงานบุคคล)",
 accuser: "นายอนุชา ภักดีชน (ผู้ฟ้องคดี)",
 accused: "เลขาธิการ ป.ป.ท. และสำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
 courtOrder: "หมายเรียกให้จัดทำคำให้การต่อศาลปกครอง",
 statuteLimitation: "30 วัน (นับแต่วันที่ได้รับหมายเรียก)",
 dateReceived: getDateWithOffset(-7),
 dueDate: getDateWithOffset(23),
 paccCaseNo: "ปค. 0004/2569",
 blackNo: "บ. 45/2569",
 redNo: "-",
 centralSarabanNo: "2569/4462"
 },
 {
 id: "คดีปกครอง-100010/2569",
 category: "10.3",
 categoryName: "คดีศาลปกครอง",
 title: "หมายเรียกและสำเนาคำฟ้องคดีจัดซื้อจัดจ้างระบบเทคโนโลยีสารสนเทศ",
 source: "ศาลปกครองกลาง",
 accuser: "บริษัท ดิจิทัล โซลูชั่นส์ จำกัด (ผู้ฟ้องคดี)",
 accused: "สำนักงาน ป.ป.ท. (ผู้ถูกฟ้องคดี)",
 courtOrder: "หมายเรียกให้ยื่นคำให้การ",
 statuteLimitation: "30 วัน",
 dateReceived: getDateWithOffset(-2),
 dueDate: getDateWithOffset(28),
 paccCaseNo: "ปค. 0008/2569",
 blackNo: "บ. 78/2569",
 redNo: "-",
 centralSarabanNo: "2569/4475"
 }
 ];

 function loadCases() {
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 if (raw) {
 const parsed = JSON.parse(raw);
 if (Array.isArray(parsed) && parsed.length > 0) return parsed;
 }
 } catch (e) {
 console.warn('Failed to parse cases from localStorage', e);
 }
 saveCases(INITIAL_CASES);
 return INITIAL_CASES;
 }

 function saveCases(cases) {
 try {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
 } catch (e) {
 console.warn('Failed to save cases to localStorage', e);
 }
 }

 // Activity 10 Engine API
 const Activity10 = {
 getCases: loadCases,
 getPaccIntakeDatabase() {
 return PACC_INTAKE_DATABASE;
 },

 getCaseById(id) {
 const cases = loadCases();
 if (!cases || cases.length === 0) return null;
 return cases.find(c => c.id === id) || cases[0];
 },

 getTorDetails(c) {
 if (!c) return { accuser: "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.", accused: "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)", plaintiff: "พนักงานอัยการ / สำนักงาน ป.ป.ท.", defendant: "นายสมชาย ทุจริตมั่น", paccCaseNo: "0012/2568", blackNo: "อ. 104/2569", redNo: "อ. 308/2569", courtOrder: "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ", division: "กองกฎหมาย (กอท.)", statuteLimitation: "15 ปี (หมดอายุความ 28 ก.ค. 2584)" };
 
 const seed = PACC_INTAKE_DATABASE.find(ic => ic.id === c.id);
 
 return {
 accuser: c.accuser || (seed ? seed.accuser : "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท."),
 accused: c.accused || (seed ? seed.accused : "นายสมชาย ทุจริตมั่น (อดีตผู้อำนวยการส่วนจัดซื้อจัดจ้าง)"),
 plaintiff: c.accuser || "พนักงานอัยการ / สำนักงาน ป.ป.ท.",
 defendant: c.accused || "นายสมชาย ทุจริตมั่น",
 paccCaseNo: c.paccCaseNo || (seed && seed.paccCaseNo ? seed.paccCaseNo : "0012/2568"),
 blackNo: c.blackNo || (seed && seed.blackNo ? seed.blackNo : "อ. 104/2569"),
 redNo: c.redNo || (seed && seed.redNo ? seed.redNo : "อ. 308/2569"),
 courtOrder: c.courtOrder || (seed && seed.courtOrder ? seed.courtOrder : "คำสั่งไม่ฟ้องพนักงานอัยการพิเศษฯ"),
 division: "กองกฎหมาย (กอท.)",
 statuteLimitation: c.statuteLimitation || (seed && seed.statuteLimitation ? seed.statuteLimitation : "15 ปี (หมดอายุความ 28 ก.ค. 2584)")
 };
 },

 calculateDaysRemaining(c) {
 if (!c) return 15;
 const targetDateStr = c.officerDeadline || c.dueDate;
 if (targetDateStr) {
 const today = new Date();
 today.setHours(0,0,0,0);
 const m = String(targetDateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if (m) {
 let year = parseInt(m[1], 10);
 if (year > 2500) year -= 543;
 const month = parseInt(m[2], 10) - 1;
 const day = parseInt(m[3], 10);
 const targetDate = new Date(year, month, day);
 if (!isNaN(targetDate.getTime())) {
 const diffTime = targetDate.getTime() - today.getTime();
 return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 }
 }
 }
 if (typeof c.slaDaysRemaining === 'number') {
 return c.slaDaysRemaining;
 }
 return 15;
 },

 renderSlaBadgeHtml(c) {
 const days = Activity10.calculateDaysRemaining(c);
 if (days <= 0) {
 return `<span class="text-danger fw-bold small"><i class="fa-solid fa-triangle-exclamation text-danger me-1"></i>เกินกำหนด ${Math.abs(days)} วัน</span>`;
 } else if (days <= 7) {
 return `<span class="text-danger fw-bold small"><i class="fa-solid fa-clock text-danger me-1"></i>เหลือ ${days} วัน</span>`;
 } else if (days <= 15) {
 return `<span class="text-warning-emphasis fw-semibold small"><i class="fa-solid fa-clock text-warning me-1"></i>เหลือ ${days} วัน</span>`;
 } else {
 return `<span class="text-secondary small"><i class="fa-solid fa-clock me-1"></i>เหลือ ${days} วัน</span>`;
 }
 },

 addCase(newCaseData) {
 const cases = loadCases();
 const category = newCaseData.category || "10.1";
 const casePrefix = category === '10.1' ? 'คดี' : (category.startsWith('10.2') ? (category === '10.2.2' ? 'อุทธรณ์' : 'คำร้อง') : 'คดีปกครอง');
 let nextNum = 100000;
 if (cases && cases.length > 0) {
 let maxNum = 99999;
 cases.forEach(c => {
 const m = (c.id || '').match(/(\d{6})\/\d{4}/);
 if (m) {
 const num = parseInt(m[1], 10);
 if (num > maxNum) maxNum = num;
 }
 });
 nextNum = maxNum >= 100000 ? maxNum + 1 : 100000 + cases.length;
 }
 const caseId = newCaseData.id ? newCaseData.id.replace(/-10\.\d(\.\d)?-/, '-') : `${casePrefix}-${nextNum}/2569`;
 const status = newCaseData.status || "ผอ.กองกฎหมายพิจารณา";
 const statusCode = newCaseData.statusCode || "PENDING_DIRECTOR";
 const statusBadge = newCaseData.statusBadge || "bg-primary text-white";
 const assignedRole = newCaseData.assignedRole || "dir_legal";
 const officer = newCaseData.officer || "นายนภัส สอนดี (ผู้อำนวยการกองกฎหมาย)";

 const existingItem = cases.find(c => c.id === caseId || (newCaseData.id && c.id === newCaseData.id) || (newCaseData.paccCaseNo && c.paccCaseNo && c.paccCaseNo === newCaseData.paccCaseNo));
 if (existingItem) {
 Object.assign(existingItem, newCaseData);
 existingItem.category = category;
 existingItem.categoryName = newCaseData.categoryName || (category === '10.1' ? 'คดีอาญาทุจริตและคดีประพฤติมิชอบ' : category === '10.3' ? 'คดีศาลปกครอง' : (category === '10.2.2' ? 'การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร' : 'การขอเปิดเผยข้อมูลข่าวสาร'));
 existingItem.officer = officer;
 existingItem.assignedRole = assignedRole;
 existingItem.status = status;
 existingItem.statusCode = statusCode;
 existingItem.statusBadge = statusBadge;
 existingItem.workflowStep = newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2);
 saveCases(cases);
 return existingItem;
 }

 const createdCase = {
 id: caseId,
 title: newCaseData.title || 'สำนวนคดีใหม่',
 category: category,
 categoryName: newCaseData.categoryName || (category === '10.1' ? 'คดีอาญาทุจริตและคดีประพฤติมิชอบ' : category === '10.3' ? 'คดีศาลปกครอง' : (category === '10.2.2' ? 'การขออุทธรณ์ในการเปิดเผยข้อมูลข่าวสาร' : 'การขอเปิดเผยข้อมูลข่าวสาร')),
 prosecutorCaseTypeNo: newCaseData.prosecutorCaseTypeNo || "1",
 prosecutorCaseTypeName: newCaseData.prosecutorCaseTypeName || "1. อัยการมีความเห็นไม่ส่งฟ้อง",
 source: newCaseData.source || "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต",
 accuser: newCaseData.accuser || "คณะกรรมการ ป.ป.ท. / สำนักงาน ป.ป.ท.",
 accused: newCaseData.accused || "",
 officer: officer,
 assignedRole: assignedRole,
 status: status,
 statusCode: statusCode,
 statusBadge: statusBadge,
 lawReceiveNo: newCaseData.lawReceiveNo || "",
 paccCaseNo: newCaseData.paccCaseNo || "",
 blackNo: newCaseData.blackNo || "-",
 redNo: newCaseData.redNo || "-",
 courtOrder: newCaseData.courtOrder || (category === '10.1' ? "คำสั่งไม่ฟ้องพนักงานอัยการ" : "เอกสารรับเรื่อง"),
 statuteLimitation: newCaseData.statuteLimitation || "15 ปี",
 slaTotalDays: newCaseData.slaTotalDays || 15,
 slaDaysRemaining: newCaseData.slaTotalDays || 15,
 slaAlert: "sla-normal",
 dateReceived: new Date().toISOString().split('T')[0],
 dueDate: newCaseData.dueDate || getDateWithOffset(15),
 workflowStep: newCaseData.workflowStep || (newCaseData.lawReceiveNo ? 3 : 2),
 docType: newCaseData.docType || "เอกสารแนบสำนวน",
 docNo: newCaseData.docNo || "นร 10/2569",
 legalOpinion: newCaseData.legalOpinion || "อยู่ระหว่างตรวจพิจารณาข้อเท็จจริงและพยานหลักฐาน",
 centralSarabanNo: newCaseData.centralSarabanNo || "",
 signedBy: "",
 signedDate: ""
 };

 cases.unshift(createdCase);
 saveCases(cases);
 return createdCase;
 },

 updateCaseStatus(id, newStatusCode, newStatusText, newBadgeClass, nextRole) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = newStatusCode;
 item.status = newStatusText;
 item.statusBadge = newBadgeClass || item.statusBadge;
 if (nextRole) item.assignedRole = nextRole;
 saveCases(cases);
 }
 return item;
 },

 bulkUpdateStatus(ids, newStatusCode, newStatusText, newBadgeClass, nextRole) {
 const cases = loadCases();
 cases.forEach(c => {
 if (ids.includes(c.id)) {
 c.statusCode = newStatusCode;
 c.status = newStatusText;
 c.statusBadge = newBadgeClass || c.statusBadge;
 if (nextRole) c.assignedRole = nextRole;
 }
 });
 saveCases(cases);
 return cases;
 },

 bulkAssignOfficer(ids, officerName) {
 const cases = loadCases();
 cases.forEach(c => {
 if (ids.includes(c.id)) {
 c.officer = officerName;
 }
 });
 saveCases(cases);
 return cases;
 },

 saveLegalOpinion(id, opinionText) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.legalOpinion = opinionText;
 saveCases(cases);
 }
 return item;
 },

 stampSignature(id, signerName) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.signatureStamped = true;
 item.signedBy = signerName || "ผู้บังคับบัญชาอนุมัติ";
 item.signedDate = new Date().toLocaleString('th-TH');
 item.statusCode = "FINAL_DISPATCHED";
 item.status = "ลงนามชี้ขาดเรียบร้อย";
 item.statusBadge = "bg-success text-white";
 saveCases(cases);
 }
 return item;
 },

 receiveAndForwardToDirector(id, lawReceiveNo) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.lawReceiveNo = lawReceiveNo || `${String(Math.floor(10 + Math.random() * 90)).padStart(4, '0')}/2569`;
 item.statusCode = "PENDING_DIRECTOR";
 item.status = "ผอ.กองกฎหมายพิจารณา";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 3;
 saveCases(cases);
 }
 return item;
 },

 savePhysicalDocIntake(id, data) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.centralSarabanNo = data.centralSarabanNo || item.centralSarabanNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
 item.physicalDocDate = data.physicalDocDate || new Date().toISOString().split('T')[0];
 item.scannedDocFile = data.scannedDocFile || "เอกสารสแกนฉบับจริง_สารบรรณกลาง.pdf";
 item.boardAdminOfficer = data.boardAdminOfficer || "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
 item.scannedStatus = "scanned";
 saveCases(cases);
 }
 return item;
 },

 forwardToGroupDirector(id, targetDirectorName, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 const isFromResolution = (item.statusCode === 'PENDING_DIRECTOR_RESOLUTION' || item.status === 'ผอ.กองกฎหมายพิจารณาผลมติ' || item.status === 'เสนอผลมติ ผอ.กองกฎหมาย');
 item.statusCode = "PENDING_GROUP_DIRECTOR";
 item.status = isFromResolution ? "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ" : "ผอ.กลุ่มงานความเห็นแย้งพิจารณา";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "group_director";
 item.workflowStep = 4;
 item.targetDirectorName = targetDirectorName || "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
 item.directorNotes = notes || "";
 item.directorForwardedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 forwardToLegalOfficer(id, officerName, notes, deadlineDate) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "DRAFTING_OPINION";
 item.status = "นิติกรจัดทำความเห็น";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.officer = officerName || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
 item.workflowStep = 5;
 item.groupDirectorNotes = notes || "";
 item.officerDeadline = deadlineDate || item.dueDate;
 item.groupDirectorForwardedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 submitOpinionToGroupDirector(id, opinionType, opinionDetails, draftFile) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_GROUP_REVIEW";
 item.status = "เสนอ ผอ.กลุ่มงานตรวจร่างความเห็น";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "group_director";
 item.workflowStep = 5;
 item.opinionType = opinionType || "เสนอทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
 item.legalOpinion = opinionDetails || item.legalOpinion;
 item.draftOpinionFile = draftFile || "ร่างความเห็นแย้ง_อสส.docx";
 item.officerSubmittedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 
 submitGroupDirectorApproval(id, reviewDecision, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 if (reviewDecision === 'APPROVE' || reviewDecision === true) {
 item.statusCode = "PENDING_DIRECTOR_APPROVAL";
 item.status = "เสนอ ผอ.กองกฎหมายพิจารณาความเห็น";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 7;
 item.groupDirectorEndorsement = "เห็นชอบตามร่างความเห็นแย้ง และเสนอ ผอ.กองกฎหมาย";
 item.groupDirectorNotes = notes || "";
 item.groupDirectorApprovedDate = new Date().toLocaleString('th-TH');
 } else {
 item.statusCode = "DRAFTING_OPINION";
 item.status = "นิติกรกำลังจัดทำความเห็น (ส่งกลับแก้ไข)";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 5;
 item.groupDirectorReturnNotes = notes || "ขอให้ตรวจสอบข้อเท็จจริงเพิ่มเติม";
 item.groupDirectorReturnedDate = new Date().toLocaleString('th-TH');
 }
 saveCases(cases);
 }
 return item;
 },

 submitDirectorApproval(id, decision, notes, forwardTarget) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 if (decision === 'APPROVE' || decision === true) {
 item.statusCode = "PENDING_DISPATCH";
 item.status = "ธุรการออกเลขส่งและส่งต่อผู้บริหาร";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "admin_legal";
 item.workflowStep = 8;
 item.legalDirectorEndorsement = "เห็นชอบตามร่างความเห็นแย้ง และมอบหมายธุรการส่งเสนอผู้บริหาร";
 item.legalDirectorApprovalNotes = notes || "ได้ตรวจพิจารณาแล้ว เห็นชอบตามร่างความเห็นแย้ง";
 item.legalDirectorForwardTarget = forwardTarget || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
 item.legalDirectorApprovedDate = new Date().toLocaleString('th-TH');
 item.directorFinalOpinion = notes || item.legalDirectorApprovalNotes;
 item.directorApprovedDate = item.legalDirectorApprovedDate;
 item.forwardTarget = forwardTarget || "deputy_sg";
 } else {
 item.statusCode = "DRAFTING_OPINION";
 item.status = "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 5;
 item.directorReturnNotes = notes || "แก้ไขข้อกฎหมายเพิ่มเติม";
 item.directorReturnedDate = new Date().toLocaleString('th-TH');
 }
 saveCases(cases);
 }
 return item;
 },

 submitLegalAdminDispatch(id, dispatchNo, target, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DEPUTY_SG";
 item.status = "เสนอผู้บริหารลงนามหนังสือความเห็น";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "deputy_sg";
 item.workflowStep = 9;
 item.adminDispatchNo = dispatchNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
 item.adminDispatchDate = new Date().toLocaleDateString('th-TH');
 item.adminDispatchOfficer = "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
 item.adminDispatchTarget = target || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท.)";
 item.adminDispatchNotes = notes || "";
 item.adminDispatchedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 submitLegalAdminResolutionIntake(id, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DIRECTOR_RESOLUTION";
 item.status = "เสนอผลมติ ผอ.กองกฎหมาย";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 10;
 item.adminResolutionIntakeNotes = notes || "";
 item.adminResolutionIntakeDate = new Date().toLocaleString('th-TH');
 item.finalDispatchNotes = notes || "";
 item.adminResolutionNotes = notes || "";
 item.adminForwardedToDirectorDate = new Date().toLocaleString('th-TH');
 item.finalDispatchedAt = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 submitDirectorResolutionOrder(id, target, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_GROUP_RESOLUTION";
 item.status = "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "group_director";
 item.workflowStep = 11;
 item.directorResolutionTarget = target || "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
 item.directorResolutionOrderNotes = notes || "";
 item.directorResolutionOrder = "มอบ ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการตามมติ";
 item.directorResolutionOrderedDate = new Date().toLocaleString('th-TH');
 item.directorResolutionOrderDate = item.directorResolutionOrderedDate;
 saveCases(cases);
 }
 return item;
 },

 submitGroupDirectorResolutionOrder(id, target, notes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_OFFICER_FINAL_DOC";
 item.status = "นิติกรจัดทำหนังสือความเห็นตามมติ";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 12;
 item.groupDirectorResolutionTarget = target || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
 item.groupDirectorResolutionOfficer = item.groupDirectorResolutionTarget;
 item.groupDirectorResolutionOrderNotes = notes || "";
 item.groupDirectorResolutionOrder = "มอบหมายนิติกรจัดทำหนังสือแจ้งความเห็นตามผลมติ";
 item.groupDirectorResolutionOrderedDate = new Date().toLocaleString('th-TH');
 item.groupDirectorResolutionOrderDate = item.groupDirectorResolutionOrderedDate;
 saveCases(cases);
 }
 return item;
 },

 forwardToLegalDirectorAfterReview(id, reviewNotes, isApproved = true) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 if (isApproved) {
 item.statusCode = "PENDING_DIRECTOR_APPROVAL";
 item.status = "เสนอ ผอ.กองกฎหมายพิจารณาความเห็น";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 5;
 item.groupDirectorEndorsement = "เห็นชอบร่างความเห็น";
 item.groupDirectorReviewNotes = reviewNotes || "";
 item.groupDirectorApprovedDate = new Date().toLocaleString('th-TH');
 } else {
 item.statusCode = "DRAFTING_OPINION";
 item.status = "นิติกรกำลังจัดทำความเห็น (ส่งกลับแก้ไข)";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 5;
 item.groupDirectorReturnNotes = reviewNotes || "ขอให้ตรวจสอบข้อเท็จจริงเพิ่มเติม";
 item.groupDirectorReturnedDate = new Date().toLocaleString('th-TH');
 }
 saveCases(cases);
 }
 return item;
 },

 approveByLegalDirector(id, directorNotes, forwardTarget) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DISPATCH";
 item.status = "ธุรการออกเลขส่งภายใน";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "admin_legal";
 item.workflowStep = 7;
 item.directorFinalOpinion = directorNotes || "เห็นชอบตามที่กลุ่มงานเสนอ";
 item.directorApprovedDate = new Date().toLocaleString('th-TH');
 item.forwardTarget = forwardTarget || "deputy_sg";
 saveCases(cases);
 }
 return item;
 },

 returnByLegalDirector(id, returnNotes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "DRAFTING_OPINION";
 item.status = "นิติกรกำลังจัดทำความเห็น (ผอ.กอง ส่งกลับแก้ไข)";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 5;
 item.directorReturnNotes = returnNotes || "แก้ไขข้อกฎหมายเพิ่มเติม";
 item.directorReturnedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 dispatchByLegalAdmin(id, dispatchData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DEPUTY_SG";
 item.status = "รอ รองเลขาธิการ ป.ป.ท. ตรวจสอบ";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "deputy_sg";
 item.workflowStep = 7;
 if (dispatchData) {
 item.adminDispatchNo = dispatchData.dispatchNo || `2569/${Math.floor(1000 + Math.random() * 9000)}`;
 item.adminDispatchDate = dispatchData.dispatchDate || new Date().toISOString().split('T')[0];
 item.adminDispatchOfficer = dispatchData.officer || "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
 item.adminDispatchNotes = dispatchData.notes || "";
 }
 saveCases(cases);
 }
 return item;
 },

 finalDispatchByLegalAdmin(id, finalDispatchData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DIRECTOR_RESOLUTION";
 item.status = "เสนอผลมติ ผอ.กองกฎหมาย";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 8;
 if (finalDispatchData) {
 item.finalDispatchNo = finalDispatchData.dispatchNo || `อส 0025/${Math.floor(1000 + Math.random() * 9000)}`;
 item.finalDispatchDate = finalDispatchData.dispatchDate || new Date().toISOString().split('T')[0];
 item.finalDispatchOfficer = finalDispatchData.officer || "นางกานดา รักษ์ธรรม (เจ้าหน้าที่ธุรการชำนาญงาน)";
 item.finalDispatchNotes = finalDispatchData.notes || "";
 item.adminResolutionNotes = finalDispatchData.notes || "";
 }
 item.adminForwardedToDirectorDate = new Date().toLocaleString('th-TH');
 item.finalDispatchedAt = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 orderResolutionByLegalDirector(id, orderData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_GROUP_RESOLUTION";
 item.status = "ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "group_director";
 item.workflowStep = 8;
 if (orderData) {
 item.directorResolutionOrder = orderData.orderText || "มอบ ผอ.กลุ่มงานความเห็นแย้ง ดำเนินการตามมติ";
 item.directorResolutionTarget = orderData.targetGroup || "กลุ่มงานความเห็นแย้ง";
 item.directorResolutionNotes = orderData.notes || "";
 }
 item.directorResolutionOrderedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 orderResolutionByGroupDirector(id, orderData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_OFFICER_FINAL_DOC";
 item.status = "นิติกรจัดทำหนังสือความเห็นตามมติ";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "legal_officer";
 item.workflowStep = 10;
 if (orderData) {
 item.groupDirectorResolutionOrder = orderData.action || orderData.orderText || "มอบหมายนิติกรจัดทำหนังสือแจ้งความเห็นตามผลมติ";
 item.groupDirectorResolutionOfficer = orderData.target || orderData.officerName || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
 item.groupDirectorResolutionNotes = orderData.notes || "";
 }
 item.groupDirectorResolutionOrderedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S11: นิติกรจัดทำหนังสือความเห็น (เห็นชอบ/เห็นแย้ง) เสนอ ผอ.กลุ่มงาน
 submitOfficerFinalDoc(id, docData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_GROUP_FINAL_REVIEW";
 item.status = "ผอ.กลุ่มงานตรวจหนังสือความเห็น";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "group_director";
 item.workflowStep = 11;
 if (docData) {
 item.finalOpinionType = docData.opinionType || "เห็นควรทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
 item.finalDocNo = docData.docNo || "ปปท. 0014/พิเศษ/2569";
 item.finalDocSubject = docData.subject || item.title;
 item.finalDocSummary = docData.summary || "";
 item.finalDocFile = docData.file || "ร่างหนังสือความเห็นแย้ง_เสนออัยการสูงสุด.pdf";
 item.finalDocNotes = docData.notes || "";
 }
 item.finalDocSubmittedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S12: ผอ.กลุ่มงานความเห็นแย้ง ตรวจหนังสือความเห็น เสนอ ผอ.กองกฎหมาย
 submitGroupDirectorFinalReview(id, reviewData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DIRECTOR_FINAL_REVIEW";
 item.status = "ผอ.กองตรวจหนังสือความเห็น";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "dir_legal";
 item.workflowStep = 12;
 if (reviewData) {
 item.groupDirectorFinalReviewAction = reviewData.action || "เห็นชอบร่างหนังสือ";
 item.groupDirectorFinalReviewNotes = reviewData.notes || "";
 }
 item.groupDirectorFinalReviewedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S13: ผอ.กองกฎหมาย ตรวจสอบหนังสือ มอบหมาย ธุรการกองกฎหมายออกเลขส่งรอบ 2
 submitLegalDirectorFinalReview(id, reviewData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_FINAL_DISPATCH_ROUND2";
 item.status = "ธุรการออกเลขส่งเสนอผู้บริหาร";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "admin_legal";
 item.workflowStep = 13;
 if (reviewData) {
 item.legalDirectorFinalReviewAction = reviewData.action || "เห็นชอบและมอบหมายธุรการออกเลขส่ง";
 item.legalDirectorFinalReviewNotes = reviewData.notes || "";
 }
 item.legalDirectorFinalReviewedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S14: ธุรการกองกฎหมาย ออกเลขหนังสือส่งภายใน เสนอผู้บริหารลงนาม
 submitLegalAdminFinalDispatch(id, dispatchData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "SUBMITTED_TO_EXEC_ROUND2";
 item.status = "เสนอผู้บริหารลงนามหนังสือความเห็น";
 item.statusBadge = "bg-success text-white";
 item.assignedRole = "deputy_sg";
 item.workflowStep = 14;
 if (dispatchData) {
 item.finalDispatchRound2No = dispatchData.dispatchNo || "0812/2569";
 item.finalDispatchRound2Date = dispatchData.dispatchDate || new Date().toISOString().split('T')[0];
 item.finalDispatchRound2Notes = dispatchData.notes || "";
 }
 item.finalDispatchRound2SubmittedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S15: ธุรการกองกฎหมาย ตรวจสอบเลขหนังสือส่งภายนอก & ลายมือชื่อประธาน และส่งต่อนิติกร
 
 signExecutiveDocRound1(id, signedNotes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "RETURNED_FROM_EXEC";
 item.status = "ธุรการรับผลมติ";
 item.statusBadge = "bg-success text-white";
 item.assignedRole = "admin_legal";
 item.workflowStep = 10;
 item.signedBy = "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
 item.signedDate = new Date().toLocaleDateString('th-TH');
 item.signedExecutiveOrder = "เห็นชอบให้ทำความเห็นแย้ง";
 item.signedDocFile = "หนังสือผลมติ_2569_006.pdf";
 item.boardResolution = item.boardResolution || "เห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
 item.boardResolutionDetail = item.boardResolutionDetail || "ที่ประชุมคณะกรรมการ ป.ป.ท. มีมติเห็นชอบให้ทำความเห็นแย้งคำสั่งไม่ฟ้องของพนักงานอัยการ";
 item.boardMeetingNo = item.boardMeetingNo || "14/2569";
 item.boardMeetingDate = item.boardMeetingDate || new Date().toLocaleDateString('th-TH');
 item.executiveSignNotesRound1 = signedNotes || "ลงนามเรียบร้อยแล้ว ส่งคืนกองกฎหมายเพื่อดำเนินการตามมติ";
 saveCases(cases);
 }
 return item;
 },

 signExecutiveDocRound2(id, signedNotes) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_ADMIN_SIGNED_RECEIVE";
 item.status = "ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "admin_legal";
 item.workflowStep = 17;
 item.signedPresidentName = "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
 item.signedExecutiveDate = new Date().toLocaleString('th-TH');
 item.signedDocFile = "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf";
 item.executiveSignNotesRound2 = signedNotes || "ลงนามเรียบร้อยแล้ว ส่งคืนกองกฎหมายเพื่อออกเลขส่งภายนอกและดำเนินการต่อไป";
 saveCases(cases);
 }
 return item;
 },

 submitLegalAdminSignedDocReceive(id, verifyData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_OFFICER_EXTERNAL_DISPATCH";
 item.status = "นิติกรรับเรื่องหนังสือลงนามแล้ว";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "legal_officer";
 item.workflowStep = 15;
 if (verifyData) {
 item.externalDispatchNo = verifyData.externalDispatchNo || "ที่ ปปท 0014/1245";
 item.externalDispatchDate = verifyData.externalDispatchDate || new Date().toISOString().split('T')[0];
 item.signedPresidentName = verifyData.signedPresidentName || "นายสุรพงษ์ วัฒนา (รองเลขาธิการ ป.ป.ท. ปฏิบัติราชการแทนเลขาธิการ ป.ป.ท.)";
 item.signedDocFile = verifyData.signedDocFile || "หนังสือความเห็นแย้ง_ฉบับลงนามสมบูรณ์_ปปท0014_1245.pdf";
 item.adminVerificationNotes = verifyData.notes || "";
 }
 item.adminVerifiedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S18: นิติกรจัดส่งหนังสือให้อัยการ/อสส. (ทางไปรษณีย์ EMS หรือนำส่งด้วยตนเอง)
 submitOfficerExternalDispatch(id, dispatchData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 const isPostal = dispatchData && dispatchData.dispatchMethod === 'postal_ems';
 item.statusCode = "DISPATCHED_TO_PROSECUTOR";
 item.status = isPostal
 ? `จัดส่งทางไปรษณีย์ EMS แล้ว (${dispatchData.emsTrackingNo || 'ติดตาม EMS'})`
 : "นำส่งให้อัยการสูงสุดด้วยตนเองเรียบร้อยแล้ว";
 item.statusBadge = "bg-success text-white";
 item.assignedRole = "legal_officer";
 item.workflowStep = 16;
 if (dispatchData) {
 item.dispatchScenario = dispatchData.dispatchScenario || (item.finalOpinionType && item.finalOpinionType.includes('เห็นชอบ') ? 'case_agreed' : 'case_disagreed');
 item.dispatchMethod = dispatchData.dispatchMethod || 'postal_ems'; // 'postal_ems' | 'hand_delivery'
 item.dispatchRecipientType = dispatchData.dispatchRecipientType || (item.dispatchScenario === 'case_agreed' ? 'prosecutor_origin' : 'attorney_general');
 item.dispatchRecipientName = dispatchData.dispatchRecipientName || (item.dispatchScenario === 'case_agreed' ? (item.source || 'สำนักงานอัยการเจ้าของสำนวน') : 'สำนักงานอัยการสูงสุด (อสส.)');
 item.emsTrackingNo = dispatchData.emsTrackingNo || '';
 item.dispatchPostOffice = dispatchData.dispatchPostOffice || '';
 item.dispatchDate = dispatchData.dispatchDate || new Date().toISOString().split('T')[0];
 item.dispatchTime = dispatchData.dispatchTime || '';
 item.dispatchLocation = dispatchData.dispatchLocation || '';
 item.handDeliveryRecipient = dispatchData.handDeliveryRecipient || '';
 item.handDeliveryRecipientPosition = dispatchData.handDeliveryRecipientPosition || '';
 item.oagReceiveDocNo = dispatchData.oagReceiveDocNo || '';
 item.dispatchReceiptFile = dispatchData.dispatchReceiptFile || '';
 item.dispatchNotes = dispatchData.dispatchNotes || '';
 }
 item.officerDispatchedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S19: ธุรการกองกฎหมาย รับผลคำวินิจฉัยชี้ขาดของอัยการสูงสุด (อสส.) และส่งต่อ ผอ.กองกฎหมาย
 submitLegalAdminOAGVerdictIntake(id, verdictData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_DIRECTOR_OAG_VERDICT_REVIEW";
 item.status = "เสนอ ผอ.กอง ตรวจสอบคำวินิจฉัย อสส.";
 item.statusBadge = "bg-warning text-dark";
 item.assignedRole = "dir_legal";
 item.workflowStep = 20;
 if (verdictData) {
 item.oagVerdictNo = verdictData.oagVerdictNo || "อส 0001/6789";
 item.oagVerdictDate = verdictData.oagVerdictDate || new Date().toISOString().split('T')[0];
 item.oagVerdictReceiveDate = verdictData.oagVerdictReceiveDate || new Date().toISOString().split('T')[0];
 item.oagVerdictDecision = verdictData.oagVerdictDecision || "PROSECUTE"; // 'PROSECUTE' | 'NON_PROSECUTE'
 item.oagVerdictDecisionText = verdictData.oagVerdictDecisionText || (item.oagVerdictDecision === 'PROSECUTE' ? "อสส. ชี้ขาดให้ฟ้องคดีตามความเห็นแย้งของ ป.ป.ท." : "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของอัยการ");
 item.oagVerdictSummary = verdictData.oagVerdictSummary || "";
 item.oagVerdictFile = verdictData.oagVerdictFile || "หนังสือคำวินิจฉัยชี้ขาด_อสส_อส0001_6789.pdf";
 item.adminVerdictNotes = verdictData.adminVerdictNotes || "";
 }
 item.adminOagVerdictReceivedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S20: ผอ.กองกฎหมาย ตรวจสอบคำวินิจฉัยชี้ขาด อสส. และมอบหมาย ผอ.กลุ่มงาน
 submitLegalDirectorOAGVerdictReview(id, reviewData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_GROUP_OAG_VERDICT_REVIEW";
 item.status = "เสนอ ผอ.กลุ่มงาน มอบหมายนิติกรบันทึกผล";
 item.statusBadge = "bg-info text-dark";
 item.assignedRole = "group_director";
 item.workflowStep = 21;
 if (reviewData) {
 item.directorOagVerdictNotes = reviewData.directorOagVerdictNotes || "";
 item.directorOagVerdictReviewDate = reviewData.directorOagVerdictReviewDate || new Date().toISOString().split('T')[0];
 item.directorAssignedGroup = reviewData.directorAssignedGroup || "กลุ่มงานความเห็นแย้ง";
 item.directorAssignedLeader = reviewData.directorAssignedLeader || "นายอานนท์ ชินประชา (ผู้อำนวยการกลุ่มงานความเห็นแย้ง)";
 }
 item.directorOagVerdictReviewedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S21: ผอ.กลุ่มงานความเห็นแย้ง ตรวจสอบคำวินิจฉัยชี้ขาด อสส. และมอบหมายนิติกรเจ้าของสำนวน
 submitGroupDirectorOAGVerdictReview(id, groupData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "PENDING_OFFICER_FINAL_NOTIFICATION";
 item.status = "รอนิติกรบันทึกผล & แจ้งกองบริหารคดี";
 item.statusBadge = "bg-primary text-white";
 item.assignedRole = "legal_officer";
 item.workflowStep = 22;
 if (groupData) {
 item.groupDirectorOagVerdictNotes = groupData.groupDirectorOagVerdictNotes || "";
 item.groupDirectorOagVerdictReviewDate = groupData.groupDirectorOagVerdictReviewDate || new Date().toISOString().split('T')[0];
 item.assignedOfficer = groupData.assignedOfficer || "นายณัฐพล บัวทุม (นิติกรชำนาญการพิเศษ)";
 }
 item.groupDirectorOagVerdictReviewedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 // S22: นิติกร บันทึกผลคำวินิจฉัยชี้ขาด อสส. และทำหนังสือแจ้งกองบริหารคดี (ปิดกระบวนงาน 10.1)
 submitOfficerFinalCaseClosedNotification(id, notifyData) {
 const cases = loadCases();
 const item = cases.find(c => c.id === id);
 if (item) {
 item.statusCode = "COMPLETED_OAG_RESOLVED";
 item.status = "เสร็จสิ้นกระบวนงาน (คำวินิจฉัย อสส. ชี้ขาด)";
 item.statusBadge = "bg-success text-white";
 item.assignedRole = null;
 item.workflowStep = 23;
 item.isCompleted = true;
 if (notifyData) {
 item.officerCaseClosedNotes = notifyData.officerCaseClosedNotes || "";
 item.caseClosedNotifyDocNo = notifyData.caseClosedNotifyDocNo || "ที่ ปปท 0014/น.1420";
 item.caseClosedNotifyDate = notifyData.caseClosedNotifyDate || new Date().toISOString().split('T')[0];
 item.caseClosedNotifyTarget = notifyData.caseClosedNotifyTarget || "กองบริหารคดี (กบค.)";
 item.caseClosedNotifyFile = notifyData.caseClosedNotifyFile || "หนังสือแจ้งผลคำวินิจฉัยชี้ขาด_ถึงกองบริหารคดี.pdf";
 item.finalCaseResolutionSummary = notifyData.finalCaseResolutionSummary || (item.oagVerdictDecision === 'PROSECUTE' ? "อสส. ชี้ขาดให้ฟ้องคดีตามความเห็นแย้งของ ป.ป.ท." : "อสส. ชี้ขาดไม่ฟ้อง/ยุติคดีตามคำสั่งเดิมของอัยการ");
 }
 item.caseClosedDate = new Date().toLocaleString('th-TH');
 saveCases(cases);
 }
 return item;
 },

 resetData() {
 saveCases(INITIAL_CASES);
 return INITIAL_CASES;
 }
 };

 global.Activity10 = Activity10;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
