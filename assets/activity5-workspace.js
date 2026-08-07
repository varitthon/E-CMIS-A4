/* E-CMIS กิจกรรมที่ 5 — ระบบกระบวนการดำเนินงานเรื่องร้องเรียนกล่าวหา
 * แนวทางเดียวกับ activity4-workspace.js (IIFE เดียว, render-string, SweetAlert,
 * localStorage ร่วมกับกิจกรรมที่ 4 — สำนวนเดียวต่อเนื่อง ไม่มีรอยต่อ)
 *
 * ครอบคลุม 17 กระบวนงานตามกระบวนการไต่สวน.xlsx (sheet6):
 *  1 รับเรื่อง/ตรวจ/มอบหมาย (+โอนก่อนมอบหมาย สถานะรอปลายทางรับโอน)  2 ไต่สวนเบื้องต้น 213
 *  3 กิจกรรมแทรก (คุ้มครองพยาน A6 / หมายค้น A9)                     4 ขยายเวลา 213 (ยื่น/อนุมัติ/ปฏิเสธ)
 *  5 213 ไม่เสร็จ 180 วัน → คกก. (ครั้งที่ 4)                         6 ตรวจ/เสนอ 213 ตามลำดับชั้น 4 ชั้น
 *  7 ผลมติ 213 (+ตั้งชุดไต่สวน 24ว.1/24ว.3, หนังสือส่งมอบ 213→644)    8 ไต่สวนชี้มูล 644
 *  9 ขยายเวลา 644 (+ครั้งที่ 5-6, 2 ปี/3 ปี/5 ปี)                      10 ตรวจ/เสนอ 644 ตามลำดับชั้น
 * 11 ผลมติ 644 (7 ทาง, ไต่เพิ่ม 30+30)                               12 อัยการสั่งการ/ตีกลับ
 * 13 โอน/รวม/แยก/เปลี่ยนผู้รับผิดชอบ/ปรับองค์คณะ                     14 คดี ม.62 (ป.ป.ช. มอบหมาย + ม.65)
 * 15 ตรวจสอบข้อเท็จจริง 58/2                                        16 ตรวจสอบข้อเท็จจริง 58/3
 * 17 (สถิติ/รายงาน — view รายการ)
 */
(() => {
  const STORAGE_KEY = 'ecmis-a4-workspace-v3';
  const LEGACY_A5_KEY = 'activity5-mockup-state-v4';
  const LEGACY_HANDOFF_KEY = 'ecmis-a4-a5-handoffs-v1';
  const MIGRATED_KEY = 'ecmis-a5-migrated-v1';
  const ROLE_KEY = 'ecmis-a4-role';
  const A5_ROLE_KEY = 'ecmis-a5-role';

  const ROLE_LABELS = {
    clerk: 'ธุรการคดี',
    investigator: 'ผู้รับผิดชอบสำนวน (นักสืบ)',
    'group-director': 'ผอ.กลุ่มงาน (สายตรวจ)',
    director: 'ผอ.เขต/กอง/สำนัก (หัวหน้าพนักงาน ป.ป.ท.)',
    secretary: 'ผู้ช่วย/รอง/เลขาธิการ ป.ป.ท.',
    committee: 'คณะกรรมการ ป.ป.ท.',
    anonymous: 'กล่องบัตรสนเท่ห์'
  };
  const ROLE_ORDER = ['clerk', 'investigator', 'group-director', 'director', 'secretary', 'committee', 'anonymous'];
  const UNITS = ['ส่วนกลาง', 'เขต 1', 'เขต 2', 'เขต 3', 'เขต 4', 'เขต 5', 'เขต 6', 'เขต 7', 'เขต 8', 'เขต 9',
    'กปท.1', 'กปท.2', 'กปท.3', 'กปท.4', 'กปท.5', 'กอท.'];
  const INVESTIGATORS = ['พนักงาน ป.ป.ท. สมชาย', 'พนักงาน ป.ป.ท. วิภา', 'พนักงาน ป.ป.ท. ธเนศ', 'พนักงาน ป.ป.ท. จินตนา', 'พนักงาน ป.ป.ท. อนุชา'];
  const EXTENSION_RULES = Object.freeze({
    '213': { baseDays: 60, rounds: ['director', 'secretary', 'committee', 'committee'], label: 'ไต่สวนเบื้องต้น (213)' },
    '644': { baseDays: 270, rounds: ['director', 'director', 'secretary', 'secretary', 'committee', 'committee'], label: 'ไต่สวนชี้มูล (644)' }
  });
  const EXTENSION_DAYS = 60;
  const A5_FORMS = Object.freeze({
    plan: { code: 'แบบ ปปท. 1', name: 'แผนงานคดี (ไต่สวนเบื้องต้น/ไต่สวน)' },
    '213': { code: 'แบบ ปปท. 4', name: 'รายงานผลการไต่สวนเบื้องต้น' },
    ext213: { code: 'แบบ ปปท. 2', name: 'บันทึกขอขยายระยะเวลาไต่สวนเบื้องต้น' },
    '644': { code: 'แบบ ปปท. 7', name: 'รายงานการไต่สวน' },
    ext644: { code: 'แบบ ปปท. 3', name: 'บันทึกขอขยายระยะเวลาไต่สวน' },
    notice: { code: 'แบบ ปปท. 5', name: 'หนังสือแจ้งให้รับทราบข้อกล่าวหาและสิทธิคัดค้าน' },
    record: { code: 'แบบ ปปท. 6', name: 'บันทึกการแจ้งข้อกล่าวหาและสิทธิคัดค้าน' },
    mti: { code: 'แบบมติ คกก.', name: 'มติคณะกรรมการ ป.ป.ท.' },
    letter: { code: 'หนังสือส่ง', name: 'หนังสือส่งสำนวนคดี' },
    p8: { code: 'แบบ ปปท. 8', name: 'หนังสือแจ้งผู้ถูกกล่าวหาไปพบพนักงานอัยการ' },
    p9: { code: 'แบบ ปปท. 9', name: 'หนังสือแจ้งผู้บังคับบัญชา (ยังไม่พบอัยการ)' },
    p10: { code: 'แบบ ปปท. 10', name: 'หนังสือแจ้งพนักงานอัยการ' },
    p11: { code: 'แบบ ปปท. 11', name: 'คำร้องขอหมายจับ' },
    p12: { code: 'แบบ ปปท. 12', name: 'บันทึกคำเบิกความ' },
    p13: { code: 'แบบ ปปท. 13', name: 'รายงานกระบวนการพิจารณา' },
    p14: { code: 'แบบ ปปท. 14', name: 'หมายจับ (อายุความไม่สะดุดหยุดลง)' },
    p15: { code: 'แบบ ปปท. 15', name: 'หมายจับ (อายุความสะดุดหยุดลง)' },
    p16: { code: 'แบบ ปปท. 16', name: 'ตำหนิรูปพรรณผู้กระทำความผิด' },
    p17: { code: 'แบบ ปปท. 17', name: 'หนังสือแจ้งผลการดำเนินการว่าออกหมายแล้ว' },
    p18: { code: 'แบบ ปปท. 18', name: 'หนังสือแจ้งผู้บัญชาการตำรวจแห่งชาติ' },
    p19: { code: 'แบบ ปปท. 19', name: 'บันทึกข้อความส่งหมายจับให้ กอท.' },
    p20: { code: 'แบบ ปปท. 20', name: 'ผนึกซองขอหมายจับ' }
  });
  const A5_LETTER_HEAD = (state, topic) => {
    const c = state.caseData || {}, q = state.inquiry?.inquiry644 || {};
    return `<p class="a5-letter-ref"><strong>ที่ ปป ..........</strong></p><p class="a5-letter-addr">สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐</p><p class="a5-letter-date">${a5Date(todayISO())}</p><p class="a5-letter-topic"><strong>เรื่อง</strong> ${topic}</p><p class="a5-letter-to"><strong>เรียน</strong> ${a5Fill('')}</p>`;
  };
  const a5AccusedLine = (state) => {
    const q = state.inquiry?.inquiry644 || {};
    return (q.accused && q.accused.length) ? q.accused.join(', ') : '...............................';
  };
  const REVIEW_CHAIN = Object.freeze({
    '213': [
      { level: 1, role: 'group-director', label: 'ผอ.กลุ่มงาน (เฉพาะสายจริง)', optional: true },
      { level: 2, role: 'director', label: 'ผอ.เขต/กอง/สำนัก (หัวหน้าพนักงาน)' },
      { level: 3, role: 'secretary', label: 'ผู้ช่วย/รองเลขาธิการ ป.ป.ท.' },
      { level: 4, role: 'secretary', label: 'เลขาธิการ ป.ป.ท.' }
    ],
    '644': [
      { level: 1, role: 'group-director', label: 'ผอ.กลุ่มงาน (เฉพาะสายจริง)', optional: true },
      { level: 2, role: 'director', label: 'ผอ.เขต/กอง/สำนัก (หัวหน้าพนักงาน)' },
      { level: 3, role: 'secretary', label: 'ผู้ช่วย/รองเลขาธิการ ป.ป.ท.' },
      { level: 4, role: 'secretary', label: 'เลขาธิการ ป.ป.ท.' }
    ]
  });
  const MTI_213_RESULTS = ['รับไว้ไต่สวน', 'ไม่รับไว้ไต่สวน', 'ให้ไต่สวนเบื้องต้นเพิ่มเติม', 'ส่งสำนักงาน ป.ป.ช.'];
  const MTI_644_RESULTS = ['ชี้มูลความผิดอาญาและวินัย', 'ชี้มูลความผิดวินัย', 'ชี้มูลคดีประพฤติมิชอบ ม.18/4', 'ข้อกล่าวหาไม่มีมูล/สิทธิฟ้องระงับ', 'ส่งสำนักงาน ป.ป.ช.', 'ส่งพนักงานสอบสวน', 'ให้ไต่สวนชี้มูลเพิ่มเติม'];
  const PROSECUTOR_ORDERS = ['เพิ่มผู้ถูกกล่าวหา', 'แจ้งข้อกล่าวหาเพิ่มเติม', 'แยกสำนวน / แยกรายงาน 644', 'ไต่สวนข้อเท็จจริงเพิ่มเติม'];
  const THAI_MONTHS = { มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12, 'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };

  const $ = (s, root = document) => root?.querySelector(s);
  const $$ = (s, root = document) => [...(root?.querySelectorAll(s) || [])];
  const escapeHtml = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, days) => { const [y, m, d] = String(iso || '').slice(0, 10).split('-').map(Number); if (!y || !m || !d) return ''; const dt = new Date(y, m - 1, d + days); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };
  const daysLeft = (deadlineIso) => { if (!deadlineIso) return null; const ms = new Date(deadlineIso + 'T23:59:59') - Date.now(); return Math.ceil(ms / 864e5); };
  const parseThaiDate = (value) => { const m = String(value || '').match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/); if (!m) return ''; const mo = THAI_MONTHS[m[2]]; if (!mo) return ''; return `${Number(m[3]) - 543}-${String(mo).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`; };

  function readStore() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function writeStore(store) { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  function readLegacy(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
  function getState(id) {
    const store = readStore();
    const s = store[id] || null;
    if (s && normalizeIncomingCase(s)) writeStore(store);
    return s;
  }
  function saveState(id, state) { const store = readStore(); store[id] = state; writeStore(store); }
  function issueOrderNo213() {
    const buddhistYear = new Date().getFullYear() + 543;
    const key = `ecmis-a5-order213-sequence-${buddhistYear}`;
    const next = Math.max(1, Number(localStorage.getItem(key) || 0) + 1);
    localStorage.setItem(key, String(next));
    return `คำสั่งที่ ${next}/${buddhistYear}`;
  }
  function notify(icon, title, text) { if (window.Swal) return Swal.fire({ icon, title, text, confirmButtonText: 'ปิด', confirmButtonColor: '#082b50' }); alert(`${title}\n${text}`); }
  function confirmDo(title, text, confirmButtonText = 'ยืนยัน') { if (!window.Swal) return Promise.resolve({ isConfirmed: confirm(`${title}\n${text}`) }); return Swal.fire({ icon: 'question', title, text, showCancelButton: true, confirmButtonText, cancelButtonText: 'ยกเลิก', confirmButtonColor: '#082b50', cancelButtonColor: '#687789' }); }
  function swalForm(title, html, confirmText = 'ยืนยัน') { if (!window.Swal) return Promise.resolve({ isConfirmed: true, value: {} }); return Swal.fire({ title, html, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: 'ยกเลิก', confirmButtonColor: '#082b50', cancelButtonColor: '#687789', preConfirm: () => { const out = {}; $$('#swalForm [data-sf]').forEach(el => out[el.dataset.sf] = el.type === 'checkbox' ? el.checked : el.value.trim()); return out; } }); }

  /* ---------- โครงสร้างข้อมูลเฟสไต่สวน ---------- */
  function defaultInquiry(state) {
    const c = state?.caseData || {};
    return {
      status: 'intake',
      intake: {
        unit: c.region || '', director: '', investigator: '', team: [], orderNo: '', orderDate: '', assignedAt: '', acceptedAt: '', handoffRef: c.id || '',
        receivedFirstAt: parseThaiDate(c.received) || todayISO(),
        transfer: { status: '', target: '', note: '', by: '', at: '' },
        transferPost: { status: '', target: '', letterSource: '', letterTarget: '', by: '', approvedBy: '', at: '' },
        m62: { flag: Boolean(c.decision === '62'), sourceLetter: '', sourceMtiDate: '', ageCheck: '', report65Letter: '', report65Date: '', recalled: false }
      },
      prelim: {
        plan: '', planStatus: 'รอจัดทำแผนคดี', planApprovedBy: '', planApprovedAt: '', workLog: '', evidence: '', searchWarrant: '',
        issues: { status: '', authority: '', action: '', damage: '' },
        startedAt: '', deadlineAt: '', submittedAt: '', report: '', status: 'รอจัดทำแผนคดี',
        extensionHistory: [], progressReports: [], reviewChain: [], supportOpinion: '', supportBy: '', supportPending: false, fastTrack: false,
        additionalDeadlineAt: '', additionalExtendedOnce: false, additionalExtensionPending: null, lateReport: ''
      },
      committee213: { result: '', mtiNo: '', mtiDate: '', orderType: '', orderNo: '', orderDate: '', decidedAt: '', decidedBy: '', note: '', investigator644: '', handoverDoc: { flag: false, letterNo: '', date: '' } },
      inquiry644: {
        investigator: '', team: [], plan: '', planStatus: 'รอคำสั่งแต่งตั้ง', planApprovedBy: '', planApprovedAt: '',
        accused: [], witnesses: [], noticeSentAt: '', statements: '', allegations: '', witnessProtection: '', searchWarrant: '',
        startedAt: '', deadlineAt: '', submittedAt: '', report: '', status: 'รอคำสั่งแต่งตั้ง',
        extensionHistory: [], progressReports: [], reviewChain: [], supportOpinion: '', supportBy: '', supportPending: false, fastTrack: false,
        additionalDeadlineAt: '', additionalExtendedOnce: false, additionalExtensionPending: null, lateReport: '', orders: []
      },
      committee644: { result: '', mtiNo: '', mtiDate: '', decidedAt: '', decidedBy: '', note: '' },
      prosecutor: { orderType: '', orderDetail: '', orderedAt: '', executedAt: '', returnedAt: '', letters: '', reportA7: false },
      outcome: { type: '', letters: '', prosecutor: '', disciplineAgency: '', disciplineSentAt: '', followup: '', closedAt: '', closedBy: '' },
      special: { type: '', agency: '', assignee: '', reportedAt: '', result: '', secretaryAt: '', publicNotice: false, switched: false, note: '' },
      publicUpdates: []
    };
  }
  function ensureInquiry(state) { if (!state.inquiry) state.inquiry = defaultInquiry(state); return state.inquiry; }
  /* คดีที่ส่งมาจากกิจกรรมที่ 4 (activity5-dispatch, complete) ยังไม่ได้แปลงเป็นสำนวนกิจกรรมที่ 5 —
   * normalize-on-read ทุกครั้งที่โหลด (ไม่ใช่ one-shot migration) เพื่อไม่ให้ค้างที่ debug fallback */
  function normalizeIncomingCase(state) {
    if (state?.workflow?.stage === 'activity5-dispatch' && state.workflow?.complete) {
      ensureInquiry(state);
      state.workflow.stage = 'a5-intake';
      state.workflow.status = 'ส่งถึงเขตผู้รับผิดชอบแล้ว — รอธุรการคดีรับสำนวน';
      state.workflow.owner = 'clerk';
      state.workflow.complete = false;
      return true;
    }
    return false;
  }
  function reportOf(reportType, inquiry) { return reportType === '213' ? inquiry.prelim : inquiry.inquiry644; }
  /* กลุ่มเฟส 213 (a5-prelim, a5-prelim-review, a7-213) เทียบกับกลุ่มเฟส 644 (a5-inquiry, a5-inquiry-review, a7-644)
   * ตามการจัดกลุ่มเฟสใน editorForA5 — ใช้แทนที่ ternary ที่กระจายอยู่หลายจุด */
  function reportTypeForStage(stage) {
    return ['a5-prelim', 'a5-prelim-review', 'a7-213'].includes(stage) ? '213' : '644';
  }

  /* ---------- กลไกขยายเวลา (218/2568) ---------- */
  function extensionRound(reportType, inquiry) {
    const history = reportOf(reportType, inquiry).extensionHistory || [];
    const rules = EXTENSION_RULES[reportType];
    if (!rules) return null;
    const round = history.filter(h => h.status === 'APPROVED').length;
    if (round >= rules.rounds.length) return null;
    return { round: round + 1, role: rules.rounds[round], maxDays: EXTENSION_DAYS };
  }
  function pendingExtension(reportType, inquiry) {
    const history = reportOf(reportType, inquiry).extensionHistory || [];
    return [...history].reverse().find(h => h.status === 'PENDING') || null;
  }
  function canApproveExtension(reportType, inquiry, role) {
    const next = extensionRound(reportType, inquiry);
    const pending = pendingExtension(reportType, inquiry);
    if (pending) return pending.role === role;
    return next && next.role === role;
  }
  function requestExtension(state, reportType, reason, requestedDays, byRole) {
    const inquiry = ensureInquiry(state);
    const rep = reportOf(reportType, inquiry);
    const next = extensionRound(reportType, inquiry);
    if (!next) return { ok: false, message: `ขยาย ${reportType} ครบทุกครั้งแล้ว ต้องเสนอคณะกรรมการ (รายงานเหตุล่าช้า)` };
    const left = daysLeft(rep.deadlineAt);
    if (left !== null && left < 15) return { ok: false, message: `ต้องยื่นคำขอล่วงหน้าไม่น้อยกว่า 15 วันก่อนครบกำหนด (เหลือ ${left} วัน) — กรณีเร่งด่วนให้เสนอรายงานเหตุล่าช้าต่อคณะกรรมการ` };
    const days = Math.min(Math.max(20, Number(requestedDays) || 60), next.maxDays);
    rep.extensionHistory.push({ round: next.round, role: next.role, requestedDays: days, reason, requestedBy: byRole, requestedAt: now(), status: 'PENDING' });
    rep.status = `รออนุมัติขยายครั้งที่ ${next.round} (${ROLE_LABELS[next.role]})`;
    state.decisionHistory = state.decisionHistory || [];
    state.decisionHistory.push({ text: `${ROLE_LABELS[byRole]} ยื่นคำขอขยาย${reportType === '213' ? 'ไต่สวนเบื้องต้น' : 'ไต่สวนชี้มูล'}ครั้งที่ ${next.round} (${days} วัน) — ${reason}`, time: now() });
    return { ok: true, next };
  }
  function applyExtension(state, reportType, reason, byRole, requestedDays = EXTENSION_DAYS) {
    const inquiry = ensureInquiry(state);
    const rep = reportOf(reportType, inquiry);
    const next = extensionRound(reportType, inquiry);
    if (!next) return { ok: false, message: `ขยาย ${reportType} ครบทุกครั้งแล้ว ต้องเสนอคณะกรรมการพิจารณา` };
    const pending = pendingExtension(reportType, inquiry);
    const role = pending ? pending.role : next.role;
    if (role !== byRole) return { ok: false, message: `รอบนี้ ${ROLE_LABELS[role]} เป็นผู้อนุมัติ` };
    const days = Math.min(Math.max(20, Number(requestedDays) || (pending ? pending.requestedDays : EXTENSION_DAYS)), next.maxDays);
    const entry = pending || { round: next.round, requestedDays: days, reason, requestedBy: byRole, requestedAt: now() };
    entry.status = 'APPROVED'; entry.approvedBy = byRole; entry.approvedAt = now(); entry.reason = reason || entry.reason; entry.requestedDays = days;
    if (!pending) rep.extensionHistory.push(entry);
    rep.deadlineAt = addDays(rep.deadlineAt, days);
    rep.status = `ขยายครั้งที่ ${entry.round} แล้ว (${days} วัน) — ครบ ${rep.deadlineAt}`;
    state.decisionHistory.push({ text: `${ROLE_LABELS[byRole]} อนุมัติขยาย${reportType === '213' ? 'ไต่สวนเบื้องต้น' : 'ไต่สวนชี้มูล'}ครั้งที่ ${entry.round} (${days} วัน) เหตุผล: ${entry.reason}`, time: now() });
    return { ok: true, next, deadline: rep.deadlineAt };
  }
  function denyExtension(state, reportType, byRole, note) {
    const inquiry = ensureInquiry(state);
    const rep = reportOf(reportType, inquiry);
    const pending = pendingExtension(reportType, inquiry);
    if (!pending) return { ok: false, message: 'ไม่มีคำขอที่รอการพิจารณา' };
    if (pending.role !== byRole) return { ok: false, message: `${ROLE_LABELS[pending.role]} เป็นผู้พิจารณา` };
    pending.status = 'DENIED'; pending.deniedBy = byRole; pending.deniedAt = now(); pending.denyNote = note || '';
    rep.status = `คำขอขยายครั้งที่ ${pending.round} ไม่ผ่าน — ดำเนินการต่อภายในเวลาที่เหลือ (ครบ ${rep.deadlineAt})`;
    state.decisionHistory.push({ text: `${ROLE_LABELS[byRole]} ไม่อนุมัติขยายครั้งที่ ${pending.round}${note ? ` — ${note}` : ''}`, time: now() });
    return { ok: true };
  }
  function deadlineTone(deadlineIso) {
    const left = daysLeft(deadlineIso);
    if (left === null) return { tone: 'muted', label: 'ยังไม่เริ่มนับ' };
    if (left <= 15) return { tone: 'crit', label: `ครบ ${deadlineIso} — เหลือ ${left} วัน (ต้องขยาย!)` };
    if (left <= 30) return { tone: 'warn', label: `ครบ ${deadlineIso} — เหลือ ${left} วัน` };
    if (left <= 45) return { tone: 'soft', label: `ครบ ${deadlineIso} — เหลือ ${left} วัน` };
    return { tone: 'ok', label: `ครบ ${deadlineIso} — เหลือ ${left} วัน` };
  }
  function caseAgeTone(inquiry) {
    const start = inquiry?.intake?.receivedFirstAt;
    if (!start) return null;
    const years = (Date.now() - new Date(start + 'T00:00:00')) / 315576e5;
    if (years >= 2) return { tone: 'crit', label: `ครบ 2 ปีแล้ว (นับจากรับเรื่องครั้งแรก) — ต้องรายงานเป็นรายกรณี ปกติไม่เกิน 3 ปี ต่างประเทศไม่เกิน 5 ปี` };
    if (years >= 1.5) return { tone: 'warn', label: `ใกล้ครบ 2 ปี (${Math.floor(years)} ปี) — เตรียมรายงานเป็นรายกรณี` };
    return null;
  }

  /* ---------- ลำดับชั้นการตรวจ ---------- */
  function chainState(reportType, inquiry) {
    const rep = reportOf(reportType, inquiry);
    const steps = REVIEW_CHAIN[reportType];
    const done = rep.reviewChain || [];
    const required = steps.filter(s => !s.optional);
    const doneRequired = done.filter(d => !d.skip).map(d => d.level);
    const complete = required.every(s => doneRequired.includes(s.level));
    let current = null;
    for (const s of steps) { if (!done.some(d => d.level === s.level)) { current = s; break; } }
    return { rep, steps, done, current, complete };
  }
  function chainApprove(state, reportType, role, opinion) {
    const inquiry = ensureInquiry(state);
    const cs = chainState(reportType, inquiry);
    if (cs.complete && !cs.current) return { ok: false, message: 'ตรวจครบทุกชั้นแล้ว' };
    if (!cs.current || cs.current.role !== role) return { ok: false, message: `ชั้นนี้ ${ROLE_LABELS[cs.current ? cs.current.role : 'group-director']} เป็นผู้ตรวจ` };
    const step = cs.current;
    cs.rep.reviewChain.push({ level: step.level, role, label: step.label, opinion, by: step.label, at: now() });
    const after = chainState(reportType, inquiry);
    state.decisionHistory.push({ text: `${ROLE_LABELS[role]} ตรวจรายงาน ${reportType} (ชั้น ${step.label}): ${opinion}`, time: now() });
    return { ok: true, complete: after.complete, current: after.current };
  }
  function chainSkipGroup(state, reportType, role, opinion) {
    const inquiry = ensureInquiry(state);
    const cs = chainState(reportType, inquiry);
    if (cs.done.some(d => d.level === 1 && !d.skip) || cs.done.some(d => d.level === 1 && d.skip)) return { ok: false, message: 'ชั้น ผอ.กลุ่มงาน ผ่านไปแล้ว' };
    cs.rep.reviewChain.push({ level: 1, role, label: 'ผอ.กลุ่มงาน', skip: true, opinion: opinion || 'ไม่อยู่ในสายงานของสำนวนนี้', by: ROLE_LABELS[role], at: now() });
    state.decisionHistory.push({ text: `${ROLE_LABELS[role]} ข้ามชั้น ผอ.กลุ่มงาน (ไม่อยู่ในสายงาน)`, time: now() });
    return { ok: true };
  }

  /* ---------- บันทึกสถานะสาธารณะ ---------- */
  function publish(state, text) {
    const inquiry = ensureInquiry(state);
    inquiry.publicUpdates.push({ text, at: now() });
    state.caseData.publicStatus = text;
    try {
      const demo = JSON.parse(localStorage.getItem('ecmis-demo-cases') || '[]');
      if (Array.isArray(demo)) {
        const rec = demo.find(r => r.trackingNumber === state.caseData.trackingYear);
        if (rec) { rec.publicStatus = text; rec.internalStatus = text; localStorage.setItem('ecmis-demo-cases', JSON.stringify(demo)); }
      }
    } catch { /* ignore */ }
  }

  /* ---------- stagebar ---------- */
  function journeyStages(state) {
    const w = state.workflow || {};
    const a5 = ['a5-intake', 'a5-prelim', 'a5-prelim-review', 'a7-213', 'a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'];
    const isA5 = a5.includes(w.stage);
    // "กลั่นกรอง/มอบหมาย" here is Activity 4's own initial-complaint screening step
    // (w.stage values admin/officer), not the investigation-report review gate below —
    // the two share a Thai name but are different steps in different activities.
    // เฉพาะขั้นของระบบไต่สวน (ขั้น 6-15 ตามเส้นทางรวม 15 ขั้น — ขั้น 1-5 อยู่ในระบบรับเรื่อง)
    const LATER = ['a5-prelim', 'a5-prelim-review', 'a7-213', 'a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'];
    const stages = [
      { key: 'a5-intake', label: 'รับสำนวน/มอบหมาย', state: ['a5-intake'].includes(w.stage) || LATER.includes(w.stage) },
      { key: 'prelim', label: 'ไต่สวนเบื้องต้น 213', state: ['a5-prelim'].includes(w.stage) || ['a5-prelim-review', 'a7-213', 'a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'prelim-review', label: 'กลั่นกรองรายงาน 213', state: ['a5-prelim-review'].includes(w.stage) || ['a7-213', 'a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'mti213', label: 'คกก. มติรับไต่สวน', state: ['a7-213'].includes(w.stage) || ['a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'inquiry', label: 'ไต่สวนชี้มูล 644', state: ['a5-inquiry'].includes(w.stage) || ['a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'inquiry-review', label: 'กลั่นกรองรายงาน 644', state: ['a5-inquiry-review'].includes(w.stage) || ['a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'mti644', label: 'คกก. ชี้มูล', state: ['a7-644'].includes(w.stage) || ['a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'outcome', label: 'ดำเนินการตามมติ', state: ['a5-outcome'].includes(w.stage) || ['a5-prosecutor', 'closed'].includes(w.stage) },
      { key: 'prosecutor', label: 'ส่งอัยการ/หน่วยงานต้นสังกัด', state: ['a5-prosecutor'].includes(w.stage) },
      { key: 'closed', label: 'ปิดสำนวน', state: w.stage === 'closed' }
    ];
    // current = the LAST stage whose condition matches, not the first — every stage's
    // condition also matches every later real stage.stage (by design, so "done" stages
    // stay lit once passed), so findIndex (first match) always returned 0 and the
    // stepper never advanced past step 1 regardless of actual progress.
    let current = 0;
    stages.forEach((s, idx) => { if (s.state) current = idx; });
    return { stages, current };
  }
  function stagebarA5(state) {
    const { stages, current } = journeyStages(state);
    return `<nav class="ws-card ws-stagebar a5" aria-label="เส้นทางสำนวนคดี"><div class="ws-stage-track">${stages.map((s, idx) => {
      const done = idx < current;
      const active = idx === current;
      return `<span class="ws-stage-node ${done ? 'done' : ''} ${active ? 'active' : ''}" title="${escapeHtml(s.label)}"><b>${idx + 1}</b><small>${escapeHtml(s.label)}</small></span>`;
    }).join('')}</div><p class="ws-stage-caption">รับเรื่อง → อนุมัติ → จัดส่งเขต → รับสำนวน → ไต่สวน 213 → กลั่นกรอง → มติรับไต่สวน → ไต่สวน 644 → กลั่นกรอง → มติชี้มูล → ดำเนินการตามมติ → ส่งอัยการ/ต้นสังกัด → ปิด — หนึ่งสำนวนต่อเนื่อง</p></nav>`;
  }

  /* ---------- เอกสาร ---------- */
  function crest() { return `<div class="ws-paper-crest" aria-hidden="true"><svg viewBox="0 0 60 60" width="52" height="52"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M30 8l5 10 11-2-6 10 10 5-10 6 2 11-10-5-10 5 2-11-10-6 10-5-6-10 11 2z" fill="currentColor" opacity=".85"/><text x="30" y="34" text-anchor="middle" font-size="9" fill="#fff">ป.ป.ท.</text></svg></div>`; }
  const A5_GARUDA_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADKBAMAAAAFnIJvAAAABGdBTUEAALGIlZj0pgAAADBQTFRFAAAAgAAAAIAAgIAAAACAgACAAICAgICAwMDA/wAAAP8A//8AAAD//wD/AP//////ex+xxAAAAAlwSFlzAAAOQAAADkUBMpLx3wAADBBJREFUeJzVnAuC5LYKRdkB+98lO+CVBZePLNmuT78klWSmuyzrCIEQYDmkf/2h/yZBiFcE+h1Mal/xI/2Q0IaLn15YXjf+6FPm6f9H+O0kVU1QfPNjAkOIJPxyklQ4Rux/068JJJ1QvvjRh0S4EfjnBKa/JsSiG38J/dJnoN8/J2Ca/ozAWgnHrw8JT42aWFy1RpCnBHljJH9NIMhL47a/kEGkEPggPJrgp4TXDIl2gnxFOI1Phh4mAk1Nln29hnYeydF2vp2PPoPwmjOeCHbTmbEieFu2nkMoKrN0ELT7c6I1YkUYzXyE4e4omjrhtcgFNzA2pDNBNjKwqwLalCFBkYEOGVLAaH4S4SAs1BNCUBDYZiYJ1Ahityx0yusoUax97MWvKWmzNHY4yQ2VDbDq6RBt8b2hCcN+dfiiuWM6E9g0vLT7PcHmqRG0EPiQkEEYsi7MXq339RVTtuN9gU0Edb6a4a6dw54whGDv7lgMQy2dQK6nMf51N07YauK42ayKc1czwhCQQdCtFsj+2QlhNx/qsDUXhPELmyROWM/1bqWnEOjO1FAJY5rsXtb9XN8Sjgn2SVoQzJ2OSV7O9OEHxmfDh/CvBjZVE4EqYa1nwlh2l9VcY/aXBLfQw2AvCAyvsZ4mC4xsb5sI4oT0f7tpGIRh9YsWNr9Dzz7o4pegCDjsxf3kywamsiEoCJGSgGDThG9XhOOi7xpre4IMqYZcWkYYElwQ+ueSYJPUCKYb3LoyRynrYa8HcXOWmSDkg5QtgaoYw4GcCDaFYjMhneAG5mIsdjexFZSERQQ3tq7Xf9Y3UdM0ljQ+SwKNXWvrOsRW/EFwaZotFSNZE9gn8Ypgl4790xXSCB6Q7AmxSfr1k+vCzezGj0EEgaqtnFQ9NmgSiBohY1NDnYJOiF/30xR6jnjz3KTeLCtC18Tp9jbGMMUipbfg7KllivM0zffbsAnjWRAgHdbziuBWblY96+HYs2yVYRhTAw/JzCVZMF8IYAr+QGiVHdjWhXmIyGjWwrgbZqWdwNTnes44dMQYIfK0C9XlSl3KJMg1QbLTh4ReOUn14OqEYOXWSycIdQqXJC0CbrcFieHPhD6CvslBqclfERBsRJbR+3C/E1tVtQTJXjgAC4IbfKqodhJwiT9OIoRBbQmYaenX/GcKQZm0WTN+Dg3LmRDOpllBXxNS97gWlUVfYwBmdhsCuY/n6VbrXy0YEcsNkkApwrgCB3KapQxEqN6j9UdWSwFbkxTB8pDhW3MIFA0x/CqE1J6ijFBcawGYgpxOmcYEIbxvncOU4jUoQep3DDVXQIzVfhxuSUoak7M1+pZJiOhiBK0wlgMGCVpLsoXT1kvIOOJu8si83Wc++wgGop5irpWmCXW/T9MY8QNDFX2aSp/Fo6Xd1klCGOUamQm5VqqCI4iLMCRXVF87pdbSt5eqU3TukXiRIRDsmatJ1kXAypDueQsBu6fklmzbp93POWILHZEUxvgI+xPvCAIhi/gWI6Fm4P2M4o6t8UpQT0J7AlM0MuJBSA+EJ9niK9o+jFo/ZOh+TYXXhMNeJPaAWLWWJ1dvPUI+nxEvIfg6gaktZ8mWSrgs/M1OYM7GrCh1OmEYeYaS4M4E0cgibPVbDcIInn/CWrNrheakBNhaP4XgtfCUt+hyqKOmTnZVpOdGUBktCUiDYbjm3fyJkYXjGQ564UVIM1a25eAiLwm5NZXN7vByuJoWAGsck0VBgC9u8WAjsMVlUgyWQCBB6MypylGnLSucLE3lDcEliMWJ5M0usuS1cAtSAhfQ5+RlJjSVkRnJuD8yLNvtO8H9gRB8yYYQ/rF/cE3TvVrLogJJdzxX6SZCrLbIlDAgWwU+YFNmy0TSjes1Ab4ChLJViIdMKFaO5cEhIzqcH0/OIXT41JQCvljMdXESfFfX9Ftedt0S0qLDm5dAVsh9h2QYN6IcLERzXnPpqf+KsjULKiCNoF4dKwSq1tEUsibgXp5MNm6qQXdJSWERfBZhSWCEwcgvGyHbcvGSsYmcU/HpV/fcfHg8igjjHAZDBnO35DqaE4sFAUsiqoLScrK5KWeE0W6/ILTsBZHwnmB/l5tXj7pO9xXjKZHXmUCRmo/tUWllqguCCsGUYIK5cCcRQhCJWOqkhQWhVGvICy2qZ/1B0OoZT8v5HyPkdumbTcsT0m/5phffo/E9oberyo462SLlO914RdDuJY5Yq3DyxxYaLpfCloBJGYVTBNnnT3ru+OIpoW5dWkus5icaxtvwFNreEco8RYRh0Ax0ULymiKfWgA2hevzpB4w8484qzRuE8GuZHvYJr6rZWNE1QcVTGevymiAfEWBRpdPiFOewag+4IaRaI+c8pcHt8luEMkI+dyEUsYJcC7E3AUL4ZEvgTIgzHjuPdE1wRctwGfN5EbUIIbze3mXsCfBxYiWjUw82Sa3tThUbAgXBApQgYGKIOCNJOg/hjoBq4CudIU/Qsfo0CiyUjfnivN7yazu8Mh7SGsEzPN/W2EXohO10rEWwO8yQvD+sLEy7zaIRWXPSHsoQ7oa84j2nRpyrIN37Y0LdOb3c0J4oTv3h940iloSsGvrpjIigUhT7Psazn6a1DKYGIS8rZZnSFziJEcb+wHZ2aBmObQhWwrBnTjrqGpCBfRdF7G/llvH0/y0ZUNIzixyZp3km7KIczlBaFPqcEHOtFCd2zNWZeVWzkaqbx4R6W4kUzYDGejaopp5xZugpQSmUW+ogueWU7whl+shRnxLGFFF5WD894XAhxomeUS/YHUnaEaxeJGVc4gE2vKpYue/4HinjG7aEXNr9GWbdCOMkndqKCEsq9d4nBE/zwzkwzk1Z6ujpVJTvzSDeIdjjjoiHIZj1J173zIoWix/aeYMQmhOcr4H/lPEQOcjmLoygvbx3S/Bd5aiqeWCN+GkUsjzmZ/Gzh8Po3iCU2lorIpuO4zEB9Q8vJ2mfP1RlI1C1+loU2ymefoxDju/tcdhCzW1ADBslSQByF9H39ulRDBtLjiV6UZU8iRfDxylQ2R0N2xHYqrvFFR2lc4UMdZ+Fs13reRsvoVe4v+qOwkGx5CVaO9YtoUYXReHSCf2zAVzErapRIo4x60SwXXV1BOWWYAHqcQZkHADEUQ4jxLMDcgNeVMYeEFqO6+7Zs2cUuYvFbnu5ImhRqFaC+qxkLn+RY10TomjrNFh8nuy7np8nBOz+7iJQJJE4WXoPeELwNZy9SRTcf0TQXIG+sWaC8j1Bqgjtw/6M6wcEPe8ENmMU178h+NawyB58/X1kS12nVkVdCEGTEETrlXf+roY+VYQTJR7lALCuYp0IsYFxDBC73ayIKIsr8uwV4lSvwH4eKwDr+ixCebrR6ro3hFK79dGxZ6VnQl92kqQrQhmQOSI7jn98OdvT9HygRYjXMrTTR0J4EaBvzgTHlEPjVPsNQdXPUOBGjC9PbzYL0ibHLWFOZEolvZ+FwNTLqvW1DPFOTdSMQaBqPG04IfAjwly6q4R0Ut661BWr1d4RyngxzLmugVJ0HfIbhP5sgKynZqxsWYNGfhHt72dJM5NJUcSPPcVGJHYcNW2Ud739k4R0sObhuATEGudyCDkYFuIT3xqnZzL1MUz6b7bXNKrSJvO4kQG9DJwBSPM4nqc8EUbNvvjJLOV3yKQUbxr6G0dUJG11mqezVAAIIOONBp5EoPoS1TNCZkuCp1W+AHgcyKYQwdrcRlyX18TjU3+5xQmea/t6pN37QfeEEsOgwON1y3hZ2T3IxwR/jOKCeELrsV6+VETbLPQBoYQo5NUkZSovsHqd6fJzTSiPbk3vXhEoRirfyBC1QX9RmZwAV+7b3OeaRvVxJAviZSfliBUow6lPCXYziqz+mmyN/5Ru8tA7gh2QHv+KouzMEZ3Zq27f5nHWvQUZY8rtoYeks/g2fxD2U5SjcOuhsPqbk97gO4Kn/bYn4JVr9lNSi1d2PiB49OonAyNeUt6/tvouQW2DswDZt1V/LPFLgtlPvK3qvvt3BIsr4B4kCU8AzwjxOjI1wrPPo4bYqo2Aze8+WX9OiMcL42yls54K8bSd1eqD8EzJbxE8AmYk0Y8Bzwlo/sboPyK8NfoPCe+K8O8jPP5/tXxBeBfwwR3vfv4HpAT+CEwM+dUAAAAASUVORK5CYII=';
  const A5_THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  const a5Num = (n) => String(n).split('').map(ch => A5_THAI_DIGITS[ch] ?? ch).join('');
  const A5_THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const A5_THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const a5Date = (iso) => { const m = String(iso || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return ''; const mi = Number(m[2]) - 1; if (mi < 0 || mi > 11) return ''; return `${Number(m[3])} ${A5_THAI_MONTHS[mi]} พ.ศ. ${Number(m[1]) + 543}`; };
  const a5DateShort = (iso) => { const m = String(iso || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return ''; const mi = Number(m[2]) - 1; if (mi < 0 || mi > 11) return ''; return `${Number(m[3])} ${A5_THAI_MONTHS_SHORT[mi]} ${Number(m[1]) + 543}`; };
  const a5Fill = (value, hint = '.......................................') => { const v = String(value ?? '').trim(); return v ? `<span class="a5-fill">${escapeHtml(v)}</span>` : `<span class="a5-fill a5-blank">${escapeHtml(hint)}</span>`; };
  const a5DateFill = (iso) => a5Fill(a5Date(iso));
  const a5Block = (value, hint = 'ยังไม่มีข้อมูล — โปรดกรอกเพิ่มเติม') => { const v = String(value ?? '').trim(); return v ? `<p>${escapeHtml(v)}</p>` : `<p class="a5-fill-block">${escapeHtml(hint)}</p>`; };
  const a5Sub = (num, label, contentHtml) => `<div class="a5-sub"><b>${escapeHtml(num)}</b> ${escapeHtml(label)} ${contentHtml}</div>`;
  const a5Check = (checked, label) => `<div class="a5-check${checked ? ' checked' : ''}"><span>${escapeHtml(label)}</span></div>`;
  const a5SignBlock = (roleLabel, name, note = '') => `<div class="a5-sign-block"><p class="a5-sign-line">(ลงชื่อ) .......................................</p><p>(${name ? escapeHtml(name) : '.......................................'})</p><p>${escapeHtml(roleLabel || '')}</p>${note ? `<p class="a5-sign-note">${escapeHtml(note)}</p>` : ''}</div>`;

  function paperShell(a, b, c, d) {
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      const { formCode = '', headerHtml = '', bodyHtml = '', signHtml = '' } = a;
      return `<section class="a5-paper">${headerHtml}<div class="a5-body">${bodyHtml}</div>${signHtml}${formCode ? `<p class="a5-form-code">${escapeHtml(formCode)}</p>` : ''}</section>`;
    }
    const title = a, meta = b || [], body = c || '', signers = d || [];
    return `<section class="ws-paper"><header class="ws-paper-head">${crest()}<div><h2>${escapeHtml(title)}</h2><p>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.)</p></div></header><dl class="ws-paper-meta">${meta.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v || '')}</dd></div>`).join('')}</dl><div class="ws-paper-body">${body}</div><footer class="ws-paper-sign">${signers.map(s => `<div><p>${escapeHtml(s.role || '')}</p><strong>${escapeHtml(s.name || '')}</strong><p>${escapeHtml(s.date || '')}</p></div>`).join('')}</footer></section>`;
  }

  function paperMti(state, which) {
    const c = state.caseData, i = state.inquiry, m = which === '213' ? i?.committee213 : i?.committee644;
    const result = m?.result || 'ยังไม่มีมติ';
    const is213 = which === '213';
    const options213 = MTI_213_RESULTS;
    const options644 = MTI_644_RESULTS;
    const checks = (is213 ? options213 : options644).map(o => a5Check(result === o, o)).join('');
    return paperShell({
      formCode: A5_FORMS.mti.code,
      headerHtml: `<header class="a5-crest-head"><img src="${A5_GARUDA_IMG}" alt="ตราครุฑ" width="56" height="56"></header><h2 class="a5-memo-title">มติคณะกรรมการ ป.ป.ท.${is213 ? ' (ไต่สวนเบื้องต้น)' : ' (วินิจฉัยชี้มูล)'}</h2><div class="a5-memo-meta"><p><strong>เรื่องที่</strong> ${a5Fill(c?.id)} <strong>มติที่</strong> ${a5Fill(m?.mtiNo)} <strong>วันที่</strong> ${a5DateFill(m?.mtiDate)}</p></div>`,
      bodyHtml: `<div class="a5-section"><h3>ผลมติ</h3><div class="a5-checklist">${checks}</div>${m?.note ? `<p>${escapeHtml(m.note)}</p>` : ''}</div>${is213 && m?.result === 'รับไว้ไต่สวน' ? `<div class="a5-section"><p><strong>การดำเนินการ</strong> แต่งตั้ง${m?.orderType === '24v3' ? 'คณะอนุกรรมการไต่สวน (มาตรา ๒๔ วรรคสาม)' : 'คณะพนักงานไต่สวน (มาตรา ๒๔ วรรคหนึ่ง)'} ${a5Fill(m?.orderNo)} ลงวันที่ ${a5DateFill(m?.orderDate)} ผู้รับผิดชอบชั้น 644: ${a5Fill(m?.investigator644)}${m?.handoverDoc?.letterNo ? ` · หนังสือส่งมอบ ${a5Fill(m?.handoverDoc?.letterNo)}` : ''}</p></div>` : ''}`,
      /* ลายเซ็นใช้ a5Sign (ผ่าน a5SignCol) เพื่อให้มี a5-lock — Word Engine กันแก้ไขลายเซ็น */
      signHtml: `<div class="a5-sign a5-sign-center">${a5SignCol(m?.decidedBy || '', 'ประธานกรรมการ ป.ป.ท.')}${a5SignCol('', 'กรรมการ')}</div>`
    });
  }

  /* ---------- ฟอร์มราชการ A5 (HTML ล้วน — แก้ไขได้ทุกช่อง) ----------
   * แปลง 1:1 จากแบบพิมพ์ราชการ ป.ป.ท. ๒๐ ฉบับ (ลำดับหัวข้อ/ข้อความ/ตาราง/ช่องกรอก ตาม PDF ต้นฉบับ)
   * a5F  = ช่องกรอก (แก้ไขได้ผ่าน Word Engine) · a5Sign = ลายเซ็น (a5-lock กันแก้ไข)
   * a5Hdr คงไว้สำหรับแบบที่มีหัวกระดาษชื่อหน่วยงานจริง — แบบอื่นใช้หัวกระดาษตามชนิดเอกสาร
   * (บันทึกข้อความ / หนังสือออก / แบบศาล) ตามข้อ ๖ "ตรา/ชื่อหน่วยงาน (ถ้าใน PDF มี)" */
  const a5F = (v, w) => `<span class="a5-fill" style="${w ? `min-width:${w}px` : ''}">${escapeHtml(v ?? '')}</span>`;
  const a5Hdr = (title, code) => `<header class="a5-hdr"><p class="a5-hdr-org">สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p><p class="a5-hdr-sub">(สำนักงาน ป.ป.ท.)</p><h2 class="a5-hdr-title">${escapeHtml(title)}</h2><p class="a5-hdr-code">${escapeHtml(code)}</p></header>`;
  const a5Sign = (name, role) => `<div><p class="a5-sign-name a5-lock">${escapeHtml(name || '')}</p><p class="a5-sign-note">${escapeHtml(role)}</p></div>`;

  /* --- ตัวช่วยจัดหน้าแบบพิมพ์ (ประกอบจาก helper เดิม ไม่สร้าง a5F/a5Hdr/a5Sign ซ้ำ) --- */
  const A5_PG = '<div class="a5-pg"></div>';
  const A5_OFFICE_ADDR = 'สำนักงาน ป.ป.ท.<br>อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ<br>อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐';
  const A5_COURT = 'อาญาคดีทุจริตและประพฤติมิชอบ';
  /* ช่องติ๊ก ☐/☑ ตามต้นฉบับ (วาดด้วย CSS ไม่ใช่รูปภาพ) */
  const a5Cb = (on, label = '') => `<span class="a5-cb${on ? ' on' : ''}"></span>${label ? `<span>${escapeHtml(label)}</span>` : ''}`;
  /* ช่องกรอกเส้นทึบ — แบบพิมพ์ของศาล (แบบ ๑๑–๑๖) ใช้เส้นใต้ทึบแทนจุดไข่ปลา */
  const a5Us = (v, w) => `<span class="a5-solid">${a5F(v, w)}</span>`;
  const a5PgNo = (n) => `<p class="a5-pgno">-${a5Num(n)}-</p>`;
  /* ตราประจำแบบพิมพ์มุมล่างซ้ายของทุกหน้า ("ปปท. ....." ในต้นฉบับ) */
  const a5Foot = () => `<p class="a5-pgfoot">ปปท. ${a5F('', 70)}</p>`;
  /* บล็อกลายเซ็น: (ลงชื่อ) ......... / (ชื่อ) / ตำแหน่ง — ตรงตามต้นฉบับทุกฉบับ */
  const a5SignCol = (name, role, label = '(ลงชื่อ)', sub = '') =>
    `<div class="a5-sign-col"><p class="a5-sign-rule">${label ? `${escapeHtml(label)} ` : ''}<span class="a5-sign-dots"></span></p>${a5Sign(name, role)}${sub ? `<p class="a5-sign-note">${escapeHtml(sub)}</p>` : ''}</div>`;
  /* แยกวันที่เป็น วันที่ / เดือน / พ.ศ. ตามช่องกรอกในต้นฉบับ */
  const a5DMY = (iso) => {
    const m = String(iso || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { d: '', mo: '', y: '' };
    return { d: String(Number(m[3])), mo: A5_THAI_MONTHS[Number(m[2]) - 1] || '', y: String(Number(m[1]) + 543) };
  };
  const a5DateParts = (iso, wd = 55, wm = 120, wy = 65) => {
    const p = a5DMY(iso);
    return `วันที่ ${a5F(p.d, wd)} เดือน ${a5F(p.mo, wm)} พ.ศ. ${a5F(p.y, wy)}`;
  };
  /* หัวกระดาษ "บันทึกข้อความ" (แบบ ๒/๓/๔/๑๙) — ตราครุฑ + ชื่อแบบ ตามต้นฉบับ */
  const a5MemoHdr = () => `<header class="a5-hdr a5-hdr-memo"><img class="a5-garuda" src="${A5_GARUDA_IMG}" alt="ตราครุฑ" width="50" height="54"><h2 class="a5-hdr-title">บันทึกข้อความ</h2></header>`;
  const a5MemoMeta = (unit, refNo, dateISO) => `
      <div class="a5-line a5-memo-row"><b>ส่วนราชการ</b>${a5F(unit || 'กอง/สำนัก', 300)}<b>โทร.</b>${a5F('', 130)}</div>
      <div class="a5-line a5-memo-row"><b>ที่</b> ปป ๐๐../${a5F(refNo || '', 200)}<b>วันที่</b>${a5F(a5DateShort(dateISO), 170)}</div>`;
  /* หัวกระดาษหนังสือออก (แบบ ๕/๘/๙/๑๐/๑๗/๑๘) — ที่ ปป ซ้าย, ที่อยู่สำนักงานขวา, วันที่กลาง */
  const a5LetterHdr = (note, refNo, dateISO) => `<header class="a5-hdr a5-hdr-letter">
      ${note ? `<p class="a5-letter-note">${escapeHtml(note)}</p>` : ''}
      <div class="a5-letter-top">
        <p class="a5-letter-ref">ที่ ปป ${a5F(refNo || '', 110)}/${a5F('', 70)}</p>
        <p class="a5-letter-org">${A5_OFFICE_ADDR}</p>
      </div>
      <p class="a5-letter-date">${a5DateParts(dateISO)}</p>
    </header>`;
  /* ท้ายหนังสือออก — กอง/สำนัก โทร โทรสาร ผู้รับผิดชอบ */
  /* who = คำเรียกผู้รับผิดชอบท้ายหนังสือ — แบบ ๕ ใช้ "เจ้าของสำนวน", แบบ ๘/๙/๑๐/๑๗/๑๘ ใช้ "ผู้รับผิดชอบ" */
  const a5LetterFoot = (unit, owner, who = 'ผู้รับผิดชอบ') => `<div class="a5-letter-foot">
      <p>กอง/สำนัก ${a5F(unit || '', 200)}</p>
      <p>โทร. ${a5F('', 200)}</p>
      <p>โทรสาร ${a5F('', 200)}</p>
      ${who === 'ผู้รับผิดชอบ' ? `<p>(นาย/นาง/นางสาว ${a5F(owner || '', 200)} ผู้รับผิดชอบ)</p>` : ''}
      <p class="a5-hint">(ระบุชื่อ${escapeHtml(who)}และหมายเลขโทรศัพท์ที่สามารถติดต่อได้สะดวก)</p>
    </div>`;
  /* ===== แบบ ปปท. ๑ — แผนงานคดี (ไต่สวนเบื้องต้น/ไต่สวน) · ๒ หน้า ===== */
  function paperPlan(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, p = i.prelim || {}, intake = i.intake || {}, q = i.inquiry644 || {}, m62 = intake.m62 || {};
    if (c.decision === '58/2') return paperSpecial58(state);
    const fromNacc = Boolean(m62.flag) || String(c.decision || '').includes('62');
    const fromMisconduct = String(c.decision || '').includes('18/4');
    const deadline60 = p.deadlineAt || addDays(intake.receivedFirstAt, 60);
    const deadline2Y = addDays(intake.receivedFirstAt, 730);
    const accused = (q.accused && q.accused.length) ? q.accused : [];
    const subject = state.documentData?.documentSubject || c.subject || '';
    const issues = p.issues || {}, lim = p.limitation || {};
    const planLines = String(p.plan || '').split('\n').filter(Boolean);
    const workLog = String(p.workLog || '').split('\n').filter(Boolean);
    const witnesses = (p.witnesses || []).filter(Boolean);
    return `<section class="a5-paper">
      <header class="a5-hdr a5-hdr-bare"><h2 class="a5-hdr-title">แผนงานคดี (ไต่สวนเบื้องต้น/ไต่สวน)</h2></header>
      <div class="a5-line a5-plan-top"><b>เรื่องที่</b>${a5F(c.id || '', 220)}<label>${a5Cb(fromNacc, 'คดีรับจาก ป.ป.ช.')}</label><label>${a5Cb(fromMisconduct, 'คดีประพฤติมิชอบ')}</label></div>
      <div class="a5-line">สำนักงาน ป.ป.ท. รับเรื่องเมื่อวันที่${a5F(a5DateShort(intake.receivedFirstAt), 190)}ครบกำหนด ๖๐ วัน วันที่${a5F(a5DateShort(deadline60), 170)}</div>
      <div class="a5-line">ครบกำหนด ๒ ปี วันที่${a5F(a5DateShort(deadline2Y), 190)}</div>
      <div class="a5-line"><b>ผู้กล่าวหา</b>${a5F(c.complainant || '', 560)}</div>
      <div class="a5-line"><b>ผู้ถูกกล่าวหา</b> ๑.${a5F(accused[0] || '', 520)}</div>
      <div class="a5-line a5-indent2">๒.${a5F(accused[1] || '', 520)}</div>
      <div class="a5-line"><b>ข้อกล่าวหา (ประเด็นแห่งคดี)</b>${a5F(q.allegations || subject, 440)}</div>
      <div class="a5-line"><b>วันเวลาสถานที่เกิดเหตุ</b>${a5F(p.place || '', 480)}</div>
      <div class="a5-line"><b>อายุความสั้น/ยาวสุด</b> มาตรา${a5F(lim.shortSection || '', 70)} อายุความ${a5F(lim.shortYears || '', 60)} ปี ขาดอายุความวันที่${a5F(a5DateShort(lim.shortExpiry) || lim.shortExpiry || '', 190)}</div>
      <div class="a5-line a5-indent2">มาตรา${a5F(lim.longSection || '', 70)} อายุความ${a5F(lim.longYears || '', 60)} ปี ขาดอายุความวันที่${a5F(a5DateShort(lim.longExpiry) || lim.longExpiry || '', 190)}</div>
      <p class="a5-plan-accused">ผู้ถูกกล่าวหา ${a5F('', 90)}</p>
      <table class="a5-tbl a5-plan-tbl"><thead><tr>
        <th style="width:22%">ประเด็น</th><th style="width:38%">ข้อมูลที่ต้องใช้<br>(แล้วแต่กรณี)</th><th style="width:40%">สิ่งที่ต้องดำเนินการ</th>
      </tr></thead><tbody>
        <tr>
          <td>สถานะ<br>${a5F(issues.status || '', 110)}</td>
          <td class="a5-cbcell">
            <div>${a5Cb(false, 'กพ.7/สัญญาจ้าง')}</div>
            <div>${a5Cb(false, 'เลขบัตรประชาชน/ทะเบียนราษฎร์')}</div>
            <div>${a5Cb(false, 'ระเบียบข้อบังคับ/ประกาศเกี่ยวกับวินัย')}</div>
            <div>${a5Cb(false, 'คำสั่งไล่ออก/ให้ออก/ลาออก/เกษียณอายุราชการ/ใบมรณบัตร')}</div>
          </td>
          <td>${a5F(issues.statusTodo || '', 180)}</td>
        </tr>
        <tr>
          <td>อำนาจหน้าที่<br>${a5F(issues.authority || '', 110)}</td>
          <td class="a5-cbcell">
            <div>${a5Cb(false, 'คำสั่งแต่งตั้ง/มอบหมาย')}</div>
            <div>${a5Cb(false, 'หลักฐานการมอบหมายให้ทำหน้าที่จากผู้บังคับบัญชา')}</div>
            <div>${a5Cb(false, 'มาตรฐานกำหนดตำแหน่ง (Job Description)')}</div>
          </td>
          <td>${a5F(issues.authorityTodo || '', 180)}</td>
        </tr>
        <tr>
          <td>การกระทำความผิด<br>${a5F(issues.action || '', 110)}</td>
          <td class="a5-cbcell">
            <div>${a5Cb(false, 'พยานหลักฐานยืนยันการกระทำความผิด')}</div>
            <div>${a5Cb(false, 'รายงาน คกก.สอบข้อเท็จจริง/วินัย/ละเมิดของต้นสังกัด')}</div>
          </td>
          <td>${a5F(issues.actionTodo || '', 180)}</td>
        </tr>
        <tr>
          <td>ความเสียหาย<br>${a5F(issues.damage || '', 110)}</td>
          <td class="a5-cbcell">${a5F(issues.damageDocs || '', 240)}</td>
          <td>${a5F(issues.damageTodo || '', 180)}</td>
        </tr>
      </tbody></table>
      ${a5Foot()}
      ${A5_PG}
      ${a5PgNo(2)}
      <p class="a5-plan-h">สรุปที่ต้องดำเนินการ</p>
      ${(workLog.length ? workLog : ['']).map(w => `<div class="a5-line">${a5F(w, 640)}</div>`).join('')}
      <p class="a5-plan-h">พยานบุคคลที่ต้องบันทึกถ้อยคำ/เกี่ยวข้องอย่างไร/สอบประเด็นใด</p>
      <div class="a5-line a5-indent">๑. ผู้กล่าวหา ${a5F(c.complainant || '', 500)}</div>
      <div class="a5-line a5-indent">๒. พยาน ${a5F(witnesses[0] || '', 520)}</div>
      <div class="a5-line a5-indent">๓. พยาน ${a5F(witnesses[1] || '', 520)}</div>
      <p class="a5-plan-h">พยานเอกสารที่ต้องขอเพิ่มเติมมีอะไรบ้าง/ ขอจากหน่วยงานใด</p>
      <div class="a5-line a5-indent">๑. ${a5F('', 580)}</div>
      <div class="a5-line a5-indent">๒. ${a5F('', 580)}</div>
      <div class="a5-line a5-indent">๓. ${a5F('', 580)}</div>
      <p class="a5-plan-h">การดำเนินการอื่น ๆ</p>
      <div class="a5-line a5-indent">๑. ตรวจสอบสถานที่เกิดเหตุ ${a5F('', 440)}</div>
      <div class="a5-line a5-indent">๒. จัดทำแผนที่เกิดเหตุ ${a5F('', 460)}</div>
      <div class="a5-line a5-indent">๓. ${a5F('', 580)}</div>
      <p class="a5-plan-h">แผนการไต่สวน</p>
      <table class="a5-tbl"><thead><tr><th style="width:28%">วัน/เดือน/ปี</th><th>การดำเนินการ</th></tr></thead><tbody>
        ${(planLines.length ? planLines : ['', '', '']).map(l => `<tr><td>${a5F('', 120)}</td><td>${a5F(l, 400)}</td></tr>`).join('')}
      </tbody></table>
      <div class="a5-sign a5-sign-stack">
        ${a5SignCol(intake.investigator, 'พนักงาน ป.ป.ท. เจ้าของสำนวน', '')}
        ${a5SignCol((intake.team || [])[0], 'เจ้าหน้าที่ ป.ป.ท. ผู้ช่วยเจ้าของสำนวน', '')}
        ${a5SignCol(intake.director, 'หัวหน้าพนักงาน ป.ป.ท.', '')}
      </div>
      <p class="a5-form-code">${escapeHtml(A5_FORMS.plan.code)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๒ (๒๑๓) / ๓ (๖๔๔) — บันทึกข้อความขอขยายระยะเวลาการไต่สวน · ๓ หน้า ===== */
  function paperExt(state, reportType) {
    const c = state.caseData || {}, i = state.inquiry || {}, rep = reportOf(reportType, i) || {}, intake = i.intake || {};
    const is213 = reportType === '213';
    const formCode = A5_FORMS[is213 ? 'ext213' : 'ext644'].code;
    const history = rep.extensionHistory || [];
    const approved = history.filter(h => h.status === 'APPROVED');
    const pending = history.find(h => h.status === 'PENDING');
    const roundNo = approved.length + 1;
    const priorDays = approved.reduce((sum, h) => sum + Number(h.days || h.requestedDays || 0), 0);
    const days = pending?.requestedDays || EXTENSION_DAYS;
    const deadline = rep.deadlineAt || addDays(intake.receivedFirstAt, is213 ? 60 : 730);
    const nextDeadline = addDays(deadline, days);
    const deadline2Y = addDays(intake.receivedFirstAt, 730);
    const dirs = approved.filter(h => h.role === 'director');
    const secs = approved.filter(h => h.role === 'secretary');
    const pendDir = pending?.role === 'director' ? pending : null;
    const pendSec = pending?.role === 'secretary' ? pending : null;
    const opText = e => !e ? '' : e.status === 'APPROVED' ? (e.reason || 'ตามเสนอ') : e.status === 'DENIED' ? `ไม่อนุมัติ — ${e.denyNote || ''}` : 'รอพิจารณา';
    const steps = [dirs[0] || pendDir, dirs[1] || (dirs.length ? pendDir : null), secs[0] || pendSec, secs[1] || (secs.length ? pendSec : null)];
    const opinions = steps.map(opText);
    const signs = steps.map(s => s?.approvedBy || '');
    const chosen = steps.map(s => s?.status === 'APPROVED');
    const subject = state.documentData?.documentSubject || c.subject || '';
    const fromNacc = Boolean(intake.m62?.flag) || String(c.decision || '').includes('62');
    const fromMisconduct = String(c.decision || '').includes('18/4');
    const recv = a5DMY(intake.receivedFirstAt);
    const nx = a5DMY(nextDeadline);
    const st = a5DMY(deadline);
    /* ข้อ ๕–๘ ความเห็นตามลำดับชั้น — โครงเดียวกันทั้งสี่ชั้น ตามต้นฉบับ */
    const opinionBlock = (no, title, meta, idx, role) => `
      <p class="a5-num-h"><b>${no}. ${title}</b>${meta}</p>
      <div class="a5-indent">
        <div class="a5-cbline">${a5Cb(chosen[idx], 'เห็นควรอนุมัติให้ขยายระยะเวลาตามเสนอ')}</div>
        <div class="a5-cbline">${a5Cb(false, 'เห็นควรอนุมัติให้ขยายระยะเวลาจำนวน')}${a5F('', 60)} วัน เนื่องจาก ${a5F(opinions[idx], 300)}</div>
        <div class="a5-cbline">${a5Cb(false, 'อื่น ๆ')} ${a5F('', 430)}</div>
      </div>
      <div class="a5-sign">${a5SignCol(signs[idx], role, '')}</div>`;
    return `<section class="a5-paper">
      ${a5MemoHdr()}
      ${a5MemoMeta(intake.unit, c.id, todayISO())}
      <div class="a5-line a5-memo-row"><b>เรื่อง</b> การขอขยายระยะเวลาการไต่สวน${is213 ? 'เบื้องต้น' : ''} เรื่องที่${a5F(c.id || '', 150)} ครั้งที่ ${a5F(String(roundNo), 60)}</div>
      <div class="a5-line"><b>เรียน</b> ประธานกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</div>
      <p class="a5-indent">(ผ่านเลขาธิการคณะกรรมการ/ผู้อำนวยการกอง/สำนัก ${a5F(intake.unit || '', 330)})</p>

      <p class="a5-num-h a5-indent"><b>๑. เรื่องเดิม</b></p>
      <p class="a5-indent2">๑.๑ สำนักงาน ป.ป.ท. ได้รับเรื่องกล่าวหา${is213 ? '' : 'จาก'}</p>
      <div class="a5-indent3 a5-cbline">${a5Cb(fromNacc, 'ตามมาตรา ๑๘/๑ (รับมอบจากคณะกรรมการ ป.ป.ช.)')}</div>
      <div class="a5-indent3 a5-cbline">${a5Cb(fromMisconduct, 'ตามมาตรา ๑๘/๔ (คดีประพฤติมิชอบ)')}</div>
      <p>เมื่อวันที่ ${a5F(recv.d, 55)} เดือน ${a5F(recv.mo, 120)} พ.ศ. ${a5F(recv.y, 65)} คดีระหว่าง${a5F(c.complainant || '', 250)} (ผู้กล่าวหา)
        กับ${a5F(a5AccusedLine(state), 230)} (ผู้ถูกกล่าวหา) ตำแหน่ง${a5F('', 160)} สังกัด${a5F(c.agency || '', 250)}
        กรณี (ระบุพฤติการณ์การกระทำผิดพอสังเขป) ${a5F(subject, 330)}</p>
      ${is213 ? `
      <p class="a5-indent2">๑.๒ สำนวนคดีนี้</p>
      <div class="a5-indent3 a5-cbline">${a5Cb(true, 'ครบระยะเวลา ๖๐ วัน ในวันที่')}${a5F(a5DateShort(deadline), 170)} และการขอขยายระยะเวลาในครั้งนี้เป็นครั้งที่ ${a5F(String(roundNo), 55)}</div>
      <p class="a5-indent3">(กรณีเคยขอขยายระยะเวลามาแล้วให้ระบุเพิ่มเติมว่า “โดยที่ผ่านมาได้มีการขอขยายระยะเวลามาแล้วจำนวน ${a5F(String(approved.length), 50)} ครั้ง
        รวมเป็นจำนวน ${a5F(String(priorDays), 55)} วัน และจะครบกำหนดระยะเวลาที่ขอขยายในวันที่ ${a5F(nx.d, 50)} เดือน ${a5F(nx.mo, 110)} พ.ศ. ${a5F(nx.y, 60)}”)</p>
      <div class="a5-indent3 a5-cbline">${a5Cb(false, 'ครบระยะเวลา ๒ ปี ในวันที่')}${a5F(a5DateShort(deadline2Y), 260)}</div>
      <p class="a5-indent2">๑.๓ ชื่อ-สกุล ${a5F(intake.investigator || '', 200)} ตำแหน่ง ${a5F('พนักงาน ป.ป.ท.', 150)} สังกัด ${a5F(intake.unit || '', 170)} ผู้รับผิดชอบสำนวน</p>` : `
      <p class="a5-indent2">๑.๒ สำนวนคดีนี้เป็นการไต่สวนโดย (คณะอนุกรรมการไต่สวน/คณะพนักงานไต่สวน)
        ตามคำสั่ง${a5F(i.committee213?.orderNo || '', 200)} ลับ ที่ ${a5F('', 90)}/${a5F('', 70)}
        ลง${a5DateParts(i.committee213?.orderDate, 50, 110, 60)} โดยมีองค์ประกอบดังนี้</p>
      <p class="a5-indent3">(๑) ${a5F(intake.director || '', 220)} เป็น (ประธานอนุกรรมการ/หัวหน้าพนักงาน ป.ป.ท.)</p>
      <p class="a5-indent3">(๒) ${a5F((intake.team || [])[0] || '', 220)} เป็น (อนุกรรมการ/พนักงาน ป.ป.ท.)</p>
      <p class="a5-indent3">(๓) ${a5F(i.inquiry644?.investigator || intake.investigator || '', 220)} เป็น (อนุกรรมการและเลขานุการ/พนักงาน ป.ป.ท. เจ้าของสำนวนคดี)</p>
      <p class="a5-indent2">๑.๓ สำนวนการไต่สวนคดีนี้ ครบระยะเวลา ๒ ปี ในวันที่ ${a5F(a5DateShort(deadline), 180)} และการขอขยายระยะเวลาในครั้งนี้ เป็นครั้งที่ ${a5F(String(roundNo), 55)}</p>
      <p class="a5-indent3">(กรณีเคยขอขยายระยะเวลามาแล้วให้ระบุเพิ่มเติมว่า “โดยที่ผ่านมาได้มีการขอขยายระยะเวลามาแล้วจำนวน ${a5F(String(approved.length), 50)} ครั้ง
        รวมเป็นจำนวน ${a5F(String(priorDays), 55)} วัน และจะครบกำหนดระยะเวลาที่ขอขยายในวันที่ ${a5F(nx.d, 50)} เดือน ${a5F(nx.mo, 110)} พ.ศ. ${a5F(nx.y, 60)}”)</p>`}

      <p class="a5-num-h a5-indent"><b>๒. ข้อกฎหมาย</b></p>
      <p class="a5-indent2">๒.๑ พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม (ฉบับที่ ๔) มาตรา ๒๓ ประกอบบทเฉพาะกาล มาตรา ๒๐ วรรคสอง</p>
      <p class="a5-indent2">๒.๒ ระเบียบคณะกรรมการ ป.ป.ท. ว่าด้วยหลักเกณฑ์และวิธีการไต่สวน พ.ศ. ๒๕๖๘ ข้อ ${is213 ? '๓๘' : '๖๔'}</p>

      <p class="a5-num-h a5-indent"><b>๓. ข้อเท็จจริง</b></p>
      <p class="a5-indent2">${is213 ? 'พนักงาน ป.ป.ท. เจ้าของสำนวน/ผู้รับผิดชอบสำนวน' : 'อนุกรรมการและเลขานุการ/พนักงาน ป.ป.ท. เจ้าของสำนวน/ผู้รับผิดชอบสำนวน'} ขอชี้แจงข้อเท็จจริงการดำเนินการ ดังนี้</p>
      <p class="a5-indent2">๓.๑ รายละเอียดการดำเนินการที่ผ่านมา (พอสังเขป)</p>
      <div class="a5-line">${a5F(rep.workLog || '', 640)}</div>
      <div class="a5-line">${a5F('', 640)}</div>
      <p class="a5-indent2">๓.๒ การดำเนินการที่เหลืออยู่</p>
      <div class="a5-line">${a5F('', 640)}</div>
      <div class="a5-line">${a5F('', 640)}</div>
      ${is213 ? `
      <p class="a5-indent2">๓.๓ ปัญหาและอุปสรรคที่ไม่สามารถดำเนินการแล้วเสร็จภายในระยะเวลา</p>
      <div class="a5-line">${a5F(pending?.reason || approved.at(-1)?.reason || rep.lateReport || '', 640)}</div>
      <div class="a5-line">${a5F('', 640)}</div>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}` : `
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <p class="a5-indent2">๓.๓ ปัญหาและอุปสรรคที่ไม่สามารถดำเนินการแล้วเสร็จภายในระยะเวลา</p>
      <div class="a5-line">${a5F(pending?.reason || approved.at(-1)?.reason || rep.lateReport || '', 640)}</div>
      <div class="a5-line">${a5F('', 640)}</div>`}

      <p class="a5-num-h a5-indent"><b>๔. ข้อพิจารณา</b></p>
      <p class="a5-indent2">${is213 ? 'พนักงาน ป.ป.ท. เจ้าของสำนวน/ผู้รับผิดชอบสำนวน' : 'คณะอนุกรรมการไต่สวน/คณะพนักงานไต่สวน'} จึงขออนุมัติขยายระยะเวลาการไต่สวน
        ครั้งที่ ${a5F(String(roundNo), 55)} จำนวน ${a5F(String(days), 60)} วัน นับตั้งแต่วันที่ ${a5F(st.d, 50)} เดือน ${a5F(st.mo, 110)} พ.ศ. ${a5F(st.y, 60)}
        ทั้งนี้จะครบกำหนดระยะเวลาที่ขอขยายในวันที่ ${a5F(nx.d, 50)} เดือน ${a5F(nx.mo, 110)} พ.ศ. ${a5F(nx.y, 60)}</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณา หากเห็นชอบ ขอได้โปรดอนุมัติตามข้อ ๓</p>
      <div class="a5-sign">${a5SignCol(intake.investigator, is213 ? 'พนักงาน ป.ป.ท. เจ้าของสำนวน / เจ้าหน้าที่ ป.ป.ท. ผู้ช่วย' : 'อนุกรรมการและเลขานุการ / พนักงาน ป.ป.ท. หรือเจ้าหน้าที่ ป.ป.ท. เจ้าของสำนวน', '')}</div>

      ${opinionBlock('๕', 'ความเห็นผู้บังคับบัญชาชั้นต้น', ' (หัวหน้าพนักงาน ป.ป.ท.)', 0, 'หัวหน้าพนักงาน ป.ป.ท.')}
      ${opinionBlock('๖', 'ความเห็นผู้อำนวยการกอง/สำนัก', ` (หัวหน้าพนักงาน ป.ป.ท.) (เรื่องที่ ${a5F(c.id || '', 120)} คำสั่งที่ ${a5F(intake.orderNo || '', 190)})`, 1, 'หัวหน้าพนักงาน ป.ป.ท.')}
      ${a5Foot()}${A5_PG}${a5PgNo(3)}
      ${opinionBlock('๗', 'ความเห็นผู้ช่วยเลขาธิการ / รองเลขาธิการฯ', ` (เรื่องที่ ${a5F(c.id || '', 120)} คำสั่งที่ ${a5F(intake.orderNo || '', 190)})`, 2, 'ผู้ช่วยเลขาธิการ / รองเลขาธิการ ป.ป.ท.')}
      ${opinionBlock('๘', 'ความเห็นเลขาธิการฯ', ` (เรื่องที่ ${a5F(c.id || '', 120)} คำสั่งที่ ${a5F(intake.orderNo || '', 190)})`, 3, 'เลขาธิการคณะกรรมการ ป.ป.ท.')}

      <p class="a5-num-h"><b>เรียน ประธานกรรมการ ป.ป.ท.</b> (เรื่องที่ ${a5F(c.id || '', 120)} คำสั่งที่ ${a5F(intake.orderNo || '', 210)})</p>
      <p class="a5-indent2">เพื่อประโยชน์ในการพิจารณาขยายระยะเวลา${is213 ? 'การไต่สวน' : 'ดำเนินการไต่สวน'}ตามพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม และเรื่องดังกล่าวอยู่ระหว่างดำเนินการยังไม่แล้วเสร็จตามเงื่อนไขระยะเวลาที่กำหนดไว้ จึงเห็นควรบรรจุเข้าวาระประชุมคณะกรรมการ ป.ป.ท. เพื่อพิจารณา</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณา</p>
      <div class="a5-sign">${a5SignCol(rep.lateReport ? 'เลขาธิการคณะกรรมการ ป.ป.ท.' : '', 'เลขาธิการ ป.ป.ท.', '')}</div>

      <div class="a5-note">
        <p><b>หมายเหตุ</b></p>
        <p>๑. ผู้รับผิดชอบสามารถปรับเนื้อหาให้ตรงกับข้อเท็จจริงของคดีและหากข้อความใดไม่ใช้ให้ตัดทิ้ง</p>
        <p>๒. ให้แนบเอกสาร ดังต่อไปนี้</p>
        <p class="a5-indent">๒.๑ แผนงานคดี และบันทึกการปฏิบัติงาน</p>
        <p class="a5-indent">๒.๒ เอกสารหลักฐานที่ระบุวันที่สำนักงาน ป.ป.ท. รับเรื่อง</p>
        ${is213 ? '' : '<p class="a5-indent">๒.๓ คำสั่งแต่งตั้งไต่สวน</p>'}
        <p>๓. การขอขยายระยะเวลาดังกล่าวต้องเสนอก่อนครบกำหนด ๑๕ วัน เป็นอย่างช้า</p>
      </div>
      <p class="a5-form-code">${escapeHtml(formCode)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๔ — บันทึกข้อความ รายงานการไต่สวนเบื้องต้น · ๖ หน้า ===== */
  function paper213(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, p = i.prelim || {}, intake = i.intake || {}, m62 = intake.m62 || {}, m = i.committee213 || {}, q = i.inquiry644 || {};
    const deadline60 = p.deadlineAt || addDays(intake.receivedFirstAt, 60);
    const accused = a5AccusedLine(state);
    const subject = state.documentData?.documentSubject || c.subject || '';
    const chain = p.reviewChain || [];
    const lvl = n => chain.find(x => x.level === n) || {};
    const fromNacc = Boolean(m62.flag) || String(c.decision || '').includes('62');
    const issues = p.issues || {};
    const team = intake.team || [];
    const res = m.result || '';
    const isSub = m.orderType === '24v3';
    /* ตัวเลือกข้อ ๑๔.๑ (๑)–(๑๘) ตามต้นฉบับ — ติ๊กตามมติ/ข้อเสนอที่บันทึกไว้ */
    const PROPOSALS = [
      [res === 'รับไว้ไต่สวน', 'เห็นควรรับไว้ไต่สวน ตามนัยมาตรา ๒๔ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากปรากฏพฤติการณ์และพยานหลักฐานเพียงพอที่จะดำเนินการไต่สวนข้อเท็จจริง โดยเห็นควรมอบหมายคณะพนักงานไต่สวน หรือโดยเห็นควรตั้งคณะอนุกรรมการไต่สวน เนื่องจากเป็นเรื่องที่สำคัญหรือมีความซับซ้อน (ให้ระบุว่าสำคัญหรือซับซ้อนอย่างไร โดยพิจารณาจากหลักเกณฑ์และเงื่อนไขตามมติคณะกรรมการ ป.ป.ท. ครั้งที่ ๑๖/๒๕๖๘ ลงวันที่ ๕ มีนาคม ๒๕๖๘ แจ้งเวียนตามหนังสือกองกฎหมาย ด่วนที่สุด ที่ ปป ๐๐๐๒/ว ๕๕๙ ลงวันที่ ๖ มีนาคม ๒๕๖๘)'],
      [res === 'ไม่รับไว้ไต่สวน', 'เห็นควรไม่รับไว้ไต่สวนข้อเท็จจริง เนื่องจากไม่ปรากฏพฤติการณ์และพยานหลักฐานเพียงพอจะดำเนินการไต่สวนข้อเท็จจริง'],
      [false, 'ไม่รับเรื่องไว้พิจารณา เนื่องจากผู้ถูกกล่าวหาไม่ใช่เจ้าหน้าที่รัฐ ตามนัยมาตรา ๓ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม'],
      [false, 'ไม่รับเรื่องไว้พิจารณา เนื่องจากไม่ใช่การกล่าวหาว่ากระทำทุจริตในภาครัฐ ตามนัยมาตรา ๓ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม'],
      [false, 'เห็นควรส่งเรื่องคืนคณะกรรมการ ป.ป.ช. ดำเนินการตามอำนาจหน้าที่ต่อไป ตามนัยมาตรา ๑๘/๑ (ข)(๓) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากขณะรับเรื่องจากคณะกรรมการ ป.ป.ช. ได้ล่วงพ้นเวลาที่จะดำเนินการทางวินัยและดำเนินคดีอาญาแก่ผู้ถูกร้องแล้ว'],
      [false, 'เห็นควรส่งเรื่องคืนคณะกรรมการ ป.ป.ช. ดำเนินการตามอำนาจหน้าที่ต่อไป ตามนัยมาตรา ๑๘/๑ (ข)(๓) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากขณะรับเรื่องจากคณะกรรมการ ป.ป.ช. เหลือเวลาไม่ถึง ๖ เดือนและไม่อยู่ในวิสัยที่จะดำเนินการให้แล้วเสร็จก่อนล่วงพ้นเวลาดังกล่าวได้']
    ];
    const PROPOSALS2 = [
      [false, 'เห็นควรส่งเรื่องคืนคณะกรรมการ ป.ป.ช. ดำเนินการตามอำนาจหน้าที่ต่อไป ตามนัยมาตรา ๑๘/๓ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นกรณีร้องเรียนว่าร่ำรวยผิดปกติ / เป็นกรณีร้องเรียนความผิดตามพระราชบัญญัติว่าด้วยความผิดเกี่ยวกับการเสนอราคาต่อหน่วยงานของรัฐ พ.ศ. ๒๕๔๒ / เป็นกรณีร้องเรียนผู้บริหารท้องถิ่นว่ามีส่วนร่วมในการกระทำความผิด / จึงเป็นเรื่องที่ไม่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ท. หรือเป็นเรื่องที่ไม่อยู่ในหน้าที่และอำนาจของคณะกรรมการ ป.ป.ท. รวมอยู่ด้วย'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๕ (๑) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่คณะกรรมการ ป.ป.ช. รับไว้พิจารณาหรือได้วินิจฉัยเสร็จเด็ดขาดแล้ว'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๕ (๒) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่คณะกรรมการ ป.ป.ท. ได้วินิจฉัยเสร็จเด็ดขาดแล้ว และไม่มีพยานหลักฐานใหม่ซึ่งเป็นสาระสำคัญแห่งคดี'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๕ (๓) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่เป็นคดีอาญาในประเด็นเดียวกันและศาลประทับฟ้องหรือพิพากษาหรือมีคำสั่งเสร็จเด็ดขาดแล้วโดยไม่มีการถอนฟ้องหรือทิ้งฟ้อง หรือเป็นกรณีที่ศาลยังไม่ได้วินิจฉัยในเนื้อหาแห่งคดี'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๕ (๔) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากผู้ถูกร้องตาย'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๕) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่ผู้ถูกร้องพ้นจากการเป็นเจ้าหน้าที่ของรัฐก่อนถูกกล่าวหาเกินห้าปี'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๑) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่ไม่ระบุพยานหลักฐานหรือระบุพฤติการณ์แห่งการกระทำที่ชัดเจนเพียงพอที่จะดำเนินการไต่สวนได้'],
      [false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๒) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่ล่วงเลยมาแล้วเกินห้าปีนับแต่วันเกิดเหตุจนถึงวันที่มีการกล่าวหาและเป็นเรื่องที่ไม่อาจหาพยานหลักฐานเพียงพอที่จะดำเนินการไต่สวนต่อไปได้']
    ];
    const cbRow = (on, text) => `<div class="a5-cbline a5-indent3">${a5Cb(on, text)}</div>`;
    const numRow = (no, on, text) => `<div class="a5-cbline a5-indent3"><span class="a5-opt-no">(${no})</span>${a5Cb(on, text)}</div>`;
    const opinionSign = (name, role) => `<div class="a5-sign">${a5SignCol(name, role)}</div>`;
    return `<section class="a5-paper">
      ${a5MemoHdr()}
      ${a5MemoMeta(intake.unit || 'สำนัก/กอง', c.id, p.submittedAt || todayISO())}
      <div class="a5-line a5-memo-row"><b>เรื่อง</b> รายงานการไต่สวนเบื้องต้น เรื่องที่ ${a5F(c.id || '', 150)} (คดีรับจากสำนักงาน ป.ป.ช. มาตรา ๖๒ / คดีประพฤติมิชอบ)</div>
      <div class="a5-line"><b>เรียน</b> เลขาธิการคณะกรรมการ ป.ป.ท.</div>

      <p class="a5-num-h a5-indent"><b>๑. การรับเรื่อง</b> (เลือกใส่เฉพาะกรณีตามข้อเท็จจริง)</p>
      <p class="a5-indent2"><b>${a5Cb(fromNacc, '')}(คดีรับจากสำนักงาน ป.ป.ช. มาตรา ๖๒)</b></p>
      <p class="a5-indent2">๑.๑ การรับเรื่องจากสำนักงาน ป.ป.ช.</p>
      <p class="a5-indent3">(๑) เมื่อวันที่ ${a5F(a5DateShort(m62.sourceMtiDate), 150)} สำนักงาน ป.ป.ช. รับเรื่องที่ ${a5F(m62.sourceLetter || '', 180)} (ระบุเลขเรื่องของสำนักงาน ป.ป.ช.)
        จาก ${a5F('', 200)} (ระบุช่องทางการรับเรื่อง เช่น บัตรสนเท่ห์ ผู้ร้อง พนักงานสอบสวน สถานีตำรวจ สำนักงานตรวจเงินแผ่นดิน หรือ ${a5F('', 180)})</p>
      <p class="a5-indent3">(๒) สำนักงาน ป.ป.ช./สำนักงาน ป.ป.ช. จังหวัด ${a5F('', 180)} ส่งเรื่องมายังสำนักงาน ป.ป.ท.
        ตามมติคณะกรรมการ ป.ป.ช. ครั้งที่ ${a5F('', 110)} เมื่อวันที่ ${a5F(a5DateShort(m62.sourceMtiDate), 180)}</p>
      <p class="a5-indent2">๑.๒ การรับเรื่องของสำนักงาน ป.ป.ท.</p>
      <p class="a5-indent3">(๑) เมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)} สำนักงาน ป.ป.ท./สำนักงาน ป.ป.ท. โดยสำนักงาน ปปท. เขต ${a5F(intake.unit || '', 130)}
        รับเรื่องจากสำนักงาน ป.ป.ช. /สำนักงาน ป.ป.ช. จังหวัด ${a5F('', 160)} ครบกำหนด ๖๐ วัน วันที่ ${a5F(a5DateShort(deadline60), 160)}</p>
      <p class="a5-indent3">(๒) เมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)} สำนัก/กอง รับสำนวนจากศูนย์รับเรื่องร้องเรียน กองบริหารคดี</p>
      <p class="a5-indent3">(๓) เมื่อวันที่ ${a5F(a5DateShort(intake.assignedAt || intake.orderDate), 150)} นาย/นาง/นางสาว ${a5F(intake.investigator || '', 180)}
        พนักงาน ป.ป.ท. สำนัก/กอง ${a5F(intake.unit || '', 160)} ได้รับมอบหมายให้เป็นผู้รับผิดชอบสำนวน โดยมี นาย/นาง/นางสาว ${a5F(team[0] || '', 180)} เจ้าหน้าที่ ป.ป.ท. เป็นผู้ช่วย</p>
      <p class="a5-indent3">(๔) เมื่อวันที่ ${a5F('', 150)} นาย/นาง/นางสาว ${a5F('', 170)} พนักงาน ป.ป.ท. สำนัก/กอง ${a5F('', 150)}
        ได้รับมอบหมายให้เป็นผู้รับผิดชอบสำนวนต่อจากนาย/นาง/นางสาว ${a5F('', 170)} พนักงาน ป.ป.ท. สำนัก/กอง ${a5F('', 150)}</p>
      <p class="a5-indent2"><b>${a5Cb(!fromNacc, '')}(คดีประพฤติมิชอบ)</b></p>
      <p class="a5-indent2">๑.๑ เมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)} สำนักงาน ป.ป.ท./สำนักงาน ป.ป.ท. โดยสำนักงาน ปปท. เขต ${a5F(intake.unit || '', 140)}
        รับเรื่อง ${a5F('', 170)} ระบุช่องทางรับเรื่อง เช่น หนังสือร้องเรียน สายด่วน ๑๒๐๖ เว็บไซต์สำนักงาน ป.ป.ท. ${a5F('', 160)} ครบกำหนด ๖๐ วัน วันที่ ${a5F(a5DateShort(deadline60), 160)}</p>
      <p class="a5-indent2">๑.๒ เมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)} สำนัก/กอง รับสำนวนจากศูนย์รับเรื่องร้องเรียน กองบริหารคดี</p>
      <p class="a5-indent2">๑.๓ เมื่อวันที่ ${a5F(a5DateShort(intake.assignedAt || intake.orderDate), 150)} นาย/นาง/นางสาว ${a5F(intake.investigator || '', 180)}
        พนักงาน ป.ป.ท. สำนัก/กอง ${a5F(intake.unit || '', 160)} ได้รับมอบหมายให้เป็นผู้รับผิดชอบสำนวน โดยมี นาย/นาง/นางสาว ${a5F(team[0] || '', 180)} เจ้าหน้าที่ ป.ป.ท. เป็นผู้ช่วย</p>
      <p class="a5-indent2">๑.๔ เมื่อวันที่ ${a5F('', 150)} นาย/นาง/นางสาว ${a5F('', 170)} พนักงาน ป.ป.ท. สำนัก/กอง ${a5F('', 150)}
        ได้รับมอบหมายให้เป็นผู้รับผิดชอบสำนวนต่อจากนาย/นาง/นางสาว ${a5F('', 170)} พนักงาน ป.ป.ท. สำนัก/กอง ${a5F('', 150)}</p>
      <p class="a5-num-h a5-indent"><b>๒. ผู้ร้องเรียน</b> (ระบุชื่อและที่อยู่ หรือขอปกปิดชื่อ โดยกำหนดเป็นลำดับ) เช่น ผู้ร้องเรียนปกปิดตามพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑</p>
      <div class="a5-line a5-indent2">${a5F(c.complainant || '', 600)}</div>
      <p class="a5-num-h a5-indent"><b>๓. ผู้ถูกร้องเรียน</b> (ให้ระบุชื่อ นามสกุล หมายเลขบัตรประจำตัวประชาชน ตำแหน่ง ยศและสังกัด สถานะปัจจุบัน เป็นรายบุคคล โดยกำหนดเป็นผู้ถูกร้องเรียนเป็นลำดับ หากผู้ถูกกล่าวหามีจำนวนมากอาจทำเป็นบัญชีแนบท้ายที่ได้จากการตรวจสอบ)</p>
      <div class="a5-line a5-indent2">${a5F(accused, 600)}</div>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}

      <p class="a5-num-h a5-indent"><b>๔. ข้อกล่าวหา/ร้องเรียนและพฤติการณ์จากคำกล่าวหา/ร้องเรียน</b></p>
      <p class="a5-indent2"><b>๔.๑ ข้อกล่าวหา/ร้องเรียน</b> (สรุปประเด็นข้อกล่าวหา/ร้องเรียน ตามคำกล่าวหา/ร้องเรียน)</p>
      <div class="a5-line a5-indent2">${a5F(q.allegations || subject, 590)}</div>
      <p class="a5-indent2"><b>๔.๒ พฤติการณ์</b> (สรุปข้อเท็จจริงจากคำกล่าวหา/ร้องเรียน)</p>
      <div class="a5-line a5-indent2">${a5F(subject, 590)}</div>
      <p class="a5-num-h a5-indent"><b>๕. การตรวจสอบข้อเท็จจริง</b> (สรุปข้อเท็จจริงที่ได้รับให้ครบ)</p>
      <p class="a5-indent2">๕.๑ คำให้การของผู้กล่าวหา/ร้องเรียน/พยาน ${a5F('', 340)}</p>
      <p class="a5-indent2">๕.๒ ข้อเท็จจริงที่ได้จากการขอทราบข้อเท็จจริงจากหน่วยงาน ${a5F('', 300)}</p>
      <p class="a5-indent2">๕.๓ ผลการดำเนินการสอบข้อเท็จจริง/วินัย/ละเมิดของหน่วยงานต้นสังกัด ${a5F('', 280)}</p>
      <p class="a5-indent2">๕.๔ อื่น ๆ เช่น การตรวจสอบในท้องที่เกิดเหตุหรือดำเนินการอื่น (ถ้ามี) ${a5F(p.workLog || '', 280)}</p>
      <p class="a5-num-h a5-indent"><b>๖. วัน เวลา และสถานที่เกิดเหตุ</b> (หากยังไม่ชัดเจน ควรกำหนดโดยประมาณ) ${a5F(p.place || '', 300)}</p>
      <p class="a5-num-h a5-indent"><b>๗. ความเสียหาย</b> (หากยังไม่ชัดเจน ควรกำหนดโดยประมาณ) ${a5F(issues.damage || '', 350)}</p>
      <p class="a5-num-h a5-indent"><b>๘. พยานหลักฐานประกอบ</b> (พยานหลักฐานที่ผู้กล่าวหาอ้างประกอบคำกล่าวหา/ร้องเรียน หรือที่ได้มาจากการตรวจสอบข้อเท็จจริง ให้ระบุแยกเป็นข้อ ๆ โดยไม่ต้องใส่รายละเอียด ให้ระบุจำนวน)</p>
      <p class="a5-indent2">๘.๑ พยานบุคคล/พยานผู้เชี่ยวชาญ ${a5F((p.witnesses || []).join(', '), 340)}</p>
      <p class="a5-indent2">๘.๒ พยานเอกสาร ${a5F(p.evidence || '', 420)}</p>
      <p class="a5-indent2">๘.๓ พยานวัตถุ ${a5F('', 440)}</p>
      <p class="a5-indent2">๘.๔ พยานอื่น ๆ (ถ้ามี) ${a5F('', 400)}</p>
      <p class="a5-num-h a5-indent"><b>๙. กฎหมายและระเบียบที่เกี่ยวข้องในช่วงระยะเวลากระทำความผิด</b> (กฎหมายหรือระเบียบที่เกี่ยวกับอำนาจหน้าที่ของผู้ถูกร้องเรียน บทความผิดทางอาญาและวินัย ระเบียบ ข้อบังคับ ประกาศ หรือกฎหมายที่เกี่ยวข้องกับการปฏิบัติงานที่ถูกร้องเรียน ให้ระบุชื่อกฎหมายพร้อมมาตรา หากเป็นระเบียบ ข้อบังคับ ประกาศ หรือกฎหมายเฉพาะให้พิมพ์เนื้อหาด้วย)</p>
      <div class="a5-line a5-indent2">${a5F('', 590)}</div>
      <p class="a5-num-h a5-indent"><b>๑๐. อายุความ</b> (หากกำหนดโดยชัดเจนไม่ได้ ให้กำหนดโดยประมาณ จากทุกฐานความผิดที่เกี่ยวข้อง โดยเฉพาะฐานความผิดที่มีอายุความน้อยที่สุด และกำหนดวันขาดอายุความ)</p>
      <div class="a5-line a5-indent2">มาตรา ${a5F(p.limitation?.shortSection || '', 80)} อายุความ ${a5F(p.limitation?.shortYears || '', 60)} ปี ขาดอายุความวันที่ ${a5F(a5DateShort(p.limitation?.shortExpiry) || p.limitation?.shortExpiry || '', 180)}</div>
      <p class="a5-num-h a5-indent"><b>๑๑. มาตรการคุ้มครองเบื้องต้นตามมาตรา ๕๓</b> (ให้ระบุว่า มีหรือไม่มีการใช้มาตรการคุ้มครองพยานเบื้องต้น ตามมาตรา ๕๓) ${a5F('', 300)}</p>
      <p class="a5-num-h a5-indent"><b>๑๒. ข้อพิจารณา</b> (พิจารณาผลการตรวจสอบข้อเท็จจริง โดยต้องพิจารณาใน ๔ ประเด็น ดังนี้)</p>
      <p class="a5-indent2">๑๒.๑ ประเด็นเกี่ยวกับสถานะของผู้ถูกร้องเรียน เริ่มต้นด้วยการวิเคราะห์ความเป็นหน่วยงานของรัฐที่ผู้ถูกร้องเรียนสังกัดว่าเป็นหน่วยงานประเภทส่วนราชการ รัฐวิสาหกิจ หรือหน่วยงานอื่นของรัฐ จากนั้นวิเคราะห์ว่า (ขณะเกิดเหตุผู้ถูกร้องเรียนเป็นเจ้าหน้าที่ของรัฐประเภท ${a5F(issues.status || '', 150)} ตำแหน่ง ${a5F('', 150)} ระดับ ${a5F('', 110)} สังกัด ${a5F(c.agency || '', 170)})</p>
      <p class="a5-indent2">๑๒.๒ ประเด็นเกี่ยวกับขอบเขตอำนาจหน้าที่ของผู้ถูกร้องเรียน ${a5F(issues.authority || '', 300)}</p>
      <p class="a5-indent2">๑๒.๓ ประเด็นเกี่ยวกับการกระทำของผู้ถูกร้องเรียนว่าถูกต้องตามอำนาจหน้าที่หรือไม่ อย่างไร ${a5F(issues.action || '', 260)}</p>
      <p class="a5-indent2">๑๒.๔ ประเด็นเกี่ยวกับความเสียหาย ${a5F(issues.damage || '', 350)}</p>
      <p class="a5-num-h a5-indent"><b>๑๓. ความเห็น</b> (โดยนำข้อ ๕ และ ข้อ ๑๒ มาประกอบการพิจารณา)</p>
      <p class="a5-indent2">(ให้วินิจฉัยพฤติการณ์จากคำกล่าวหา/ร้องเรียนและข้อเท็จจริงจากการตรวจสอบปรับเข้ากับหลักกฎหมาย ระเบียบ คำสั่ง มติ ข้อบังคับต่าง ๆ ว่าเป็นคำกล่าวหา/ร้องเรียนที่ถูกต้องตามเงื่อนไขที่จะรับไว้</p>
      ${a5Foot()}${A5_PG}${a5PgNo(3)}
      <p class="a5-indent2">ดำเนินการไต่สวนต่อไปหรือไม่ โดยแต่งตั้งคณะพนักงานไต่สวน หรือแต่งตั้งคณะอนุกรรมการไต่สวน เนื่องจากเป็นเรื่องสำคัญหรือมีความซับซ้อนแล้วแต่กรณี เพื่อประกอบการพิจารณา)</p>
      <div class="a5-line a5-indent2">${a5F(p.report || '', 590)}</div>
      ${cbRow(res === 'รับไว้ไต่สวน' && !isSub, 'เห็นควรรับพิจารณาดำเนินการไต่สวนโดยแต่งตั้งคณะพนักงานไต่สวน ประกอบด้วย')}
      <p class="a5-indent4">(๑) ${a5F(intake.investigator || '', 260)} พนักงาน ป.ป.ท. เจ้าของสำนวน</p>
      <p class="a5-indent4">(๒) ${a5F(team[0] || '', 260)} เจ้าหน้าที่ ป.ป.ท.</p>
      <p class="a5-indent4">(๓) ${a5F(team[1] || '', 260)} เจ้าหน้าที่ ป.ป.ท.</p>
      ${cbRow(res === 'รับไว้ไต่สวน' && isSub, 'เห็นควรรับพิจารณาดำเนินการไต่สวนข้อเท็จจริง โดยแต่งตั้งคณะอนุกรรมการไต่สวน ประกอบด้วย')}
      <p class="a5-indent4">(๑) ${a5F('', 250)} ประธานอนุกรรมการ · ตำแหน่ง ${a5F('', 130)} สังกัด ${a5F('', 130)}</p>
      <p class="a5-indent4">(๒) ${a5F('', 250)} อนุกรรมการ · ตำแหน่ง ${a5F('', 130)} สังกัด ${a5F('', 130)}</p>
      <p class="a5-indent4">(๓) ${a5F('', 250)} อนุกรรมการและเลขานุการ · ตำแหน่ง ${a5F('', 130)} สังกัด ${a5F('', 130)}</p>

      <p class="a5-num-h a5-indent"><b>๑๔. ข้อเสนอ</b></p>
      <p class="a5-indent2">๑๔.๑ พิจารณาดำเนินการ (เลือกกรณีใดกรณีหนึ่งตามข้อเท็จจริง)</p>
      ${PROPOSALS.map(([on, t], n) => numRow(a5Num(n + 1), on, t)).join('')}
      ${a5Foot()}${A5_PG}${a5PgNo(4)}
      ${PROPOSALS2.slice(0, 6).map(([on, t], n) => numRow(a5Num(n + 7), on, t)).join('')}
      ${numRow('๑๓', false, PROPOSALS2[6][1])}
      ${numRow('๑๔', false, PROPOSALS2[7][1])}
      ${numRow('๑๕', false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๓) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่คณะกรรมการ ป.ป.ท. เห็นว่าไม่ใช่เป็นการกระทำผิดวินัยอย่างร้ายแรง')}
      <div class="a5-cbline a5-indent4">${a5Cb(false, 'เห็นควรส่งให้ผู้บังคับบัญชาหรือผู้มีอำนาจแต่งตั้งถอดถอน หรือไม่ เนื่องจาก')} ${a5F('', 200)}</div>
      <div class="a5-cbline a5-indent4">${a5Cb(false, 'ไม่ส่ง')} ${a5F('', 120)} เนื่องจาก ${a5F('', 220)}</div>
      ${numRow('๑๖', false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๔) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องประพฤติมิชอบที่ไม่ใช่การกระทำความผิดวินัยและไม่ก่อให้เกิดความเสียหายแก่ราชการอย่างร้ายแรง')}
      <div class="a5-cbline a5-indent4">${a5Cb(false, 'เห็นควรส่งให้ผู้บังคับบัญชาหรือผู้มีอำนาจแต่งตั้งถอดถอน หรือไม่ เนื่องจาก')} ${a5F('', 200)}</div>
      <div class="a5-cbline a5-indent4">${a5Cb(false, 'ไม่ส่ง')} ${a5F('', 120)} เนื่องจาก ${a5F('', 220)}</div>
      ${numRow('๑๗', false, 'ไม่รับเรื่องไว้พิจารณา ตามนัยมาตรา ๒๖ (๕) แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม เนื่องจากเป็นเรื่องที่')}
      ${a5Foot()}${A5_PG}${a5PgNo(5)}
      <p class="a5-indent3">องค์กรบริหารงานบุคคลหรือหน่วยงานของรัฐกำลังพิจารณาอยู่หรือได้พิจารณาเป็นที่ยุติแล้ว และไม่มีเหตุแสดงให้เห็นว่าการพิจารณานั้นไม่ชอบ</p>
      <div class="a5-cbline a5-indent3"><span class="a5-opt-no">(๑๘)</span>${a5Cb(res === 'ให้ไต่สวนเบื้องต้นเพิ่มเติม', 'อื่น ๆ')} ${a5F(res === 'ให้ไต่สวนเบื้องต้นเพิ่มเติม' ? (m.note || res) : '', 330)}</div>
      <p class="a5-indent2">๑๔.๒ นำเสนอคณะกรรมการ ป.ป.ท. เพื่อพิจารณา</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณา</p>
      ${opinionSign(intake.investigator, 'พนักงาน ป.ป.ท. ผู้รับผิดชอบสำนวน')}

      <p class="a5-num-h a5-indent"><b>๑๕. ความเห็นผู้บังคับบัญชาชั้นต้น</b> (หัวหน้าพนักงาน ป.ป.ท.) (เรื่องที่ ${a5F(c.id || '', 140)})</p>
      <p class="a5-indent2">(ให้เสนอความเห็นพร้อมเหตุผล เช่น เห็นควรรับ / ไม่รับไว้พิจารณา เนื่องจาก) ${a5F(lvl(2).opinion || '', 280)}</p>
      ${opinionSign(lvl(2).by || intake.director || '', 'หัวหน้าพนักงาน ป.ป.ท.')}
      <p class="a5-num-h a5-indent"><b>๑๖. ความเห็นผู้อำนวยการสำนัก</b> (หัวหน้าพนักงาน ป.ป.ท.) (เรื่องที่ ${a5F(c.id || '', 140)})</p>
      <p class="a5-indent2">(ให้เสนอความเห็นพร้อมเหตุผล เช่น เห็นควรรับ / ไม่รับไว้พิจารณา เนื่องจาก) ${a5F(lvl(3).opinion || '', 280)}</p>
      ${opinionSign(lvl(3).by || '', 'ผู้อำนวยการสำนัก/กอง')}
      <p class="a5-num-h a5-indent"><b>๑๗. ความเห็นรองเลขาธิการฯ</b> (เรื่องที่ ${a5F(c.id || '', 140)}) ${a5F(lvl(3).opinion || '', 260)}</p>
      <div class="a5-line">${a5F('', 640)}</div>
      ${opinionSign(lvl(3).by || '', 'รองเลขาธิการ ป.ป.ท.')}
      <p class="a5-num-h a5-indent"><b>๑๘. ความเห็นเลขาธิการฯ</b></p>
      ${cbRow(res === 'รับไว้ไต่สวน' && !isSub, 'รับไว้ไต่สวน เนื่องจากปรากฏพฤติการณ์ และพยานหลักฐานเพียงพอจะดำเนินการไต่สวน โดยมอบหมายคณะพนักงานไต่สวน')}
      ${cbRow(res === 'รับไว้ไต่สวน' && isSub, 'รับไว้ไต่สวน เนื่องจากปรากฏพฤติการณ์ และพยานหลักฐานเพียงพอจะดำเนินการไต่สวนข้อเท็จจริง โดยเสนอคณะกรรมการ ป.ป.ท. ตั้งคณะอนุกรรมการไต่สวน เนื่องจากเป็นเรื่องที่สำคัญหรือซับซ้อน')}
      <div class="a5-cbline a5-indent3">${a5Cb(false, 'ไม่รับไว้พิจารณา ตามนัยมาตรา')}</div>
      <table class="a5-tbl a5-sec-grid"><tbody>
        <tr><td>${a5Cb(false, '๒๕ (๑)')}</td><td>${a5Cb(false, '๒๖ (๑)')}</td></tr>
        <tr><td>${a5Cb(false, '๒๕ (๒)')}</td><td>${a5Cb(false, '๒๖ (๒)')}</td></tr>
        <tr><td>${a5Cb(false, '๒๕ (๓)')}</td><td>${a5Cb(false, '๒๖ (๓)')}</td></tr>
        <tr><td>${a5Cb(false, '๒๕ (๔)')}</td><td>${a5Cb(false, '๒๖ (๔)')}</td></tr>
        <tr><td>${a5Cb(false, '๒๕ (๕)')}</td><td>${a5Cb(false, '๒๖ (๕)')}</td></tr>
      </tbody></table>
      <p>แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม</p>
      ${a5Foot()}${A5_PG}${a5PgNo(6)}
      ${cbRow(false, 'ไม่รับเรื่องไว้พิจารณา เนื่องจากผู้ถูกกล่าวหาไม่ใช่เจ้าหน้าที่ของรัฐ')}
      ${cbRow(false, 'ไม่รับเรื่องไว้พิจารณา เนื่องจากไม่ใช่การกล่าวหาว่าเจ้าหน้าที่ของรัฐกระทำทุจริตในภาครัฐ')}
      ${cbRow(res === 'ส่งสำนักงาน ป.ป.ช.', 'เห็นควรส่งเรื่องคืนคณะกรรมการ ป.ป.ช.')}
      ${cbRow(false, 'เห็นควรยุติการไต่สวนเนื่องจากผู้ถูกร้องตาย')}
      ${cbRow(res === 'ไม่รับไว้ไต่สวน', 'ไม่รับไว้ไต่สวนข้อเท็จจริง เนื่องจากไม่ปรากฏพฤติการณ์หรือพยานหลักฐานว่าผู้ถูกกล่าวหาได้กระทำการทุจริตในภาครัฐ')}
      <div class="a5-cbline a5-indent3">${a5Cb(false, 'อื่น ๆ')} ${a5F(lvl(4).opinion || '', 400)}</div>
      ${opinionSign(lvl(4).by || '', 'เลขาธิการคณะกรรมการ ป.ป.ท.')}
      <p class="a5-num-h"><b>เรียน ประธานกรรมการ ป.ป.ท.</b> (เรื่องที่ ${a5F(c.id || '', 180)})</p>
      <p class="a5-indent2">ด้วย เลขาธิการคณะกรรมการ ป.ป.ท. ได้มอบหมายให้พนักงาน ป.ป.ท. ดำเนินการไต่สวนเบื้องต้น ตามนัยมาตรา ๒๔ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม พนักงาน ป.ป.ท. ได้ดำเนินการเสร็จเรียบร้อยแล้วตามรายงานการไต่สวนเบื้องต้นที่เสนอมาพร้อมนี้</p>
      <p class="a5-indent2">เห็นควรบรรจุเข้าวาระการประชุมคณะกรรมการ ป.ป.ท.</p>
      <div class="a5-cbline a5-indent3">${a5Cb(Boolean(m.mtiNo), 'เพื่อพิจารณา')}</div>
      <div class="a5-cbline a5-indent3">${a5Cb(false, 'เพื่อทราบ')}</div>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณา</p>
      ${opinionSign(m.decidedBy || '', 'เลขาธิการคณะกรรมการ ป.ป.ท.')}
      <p class="a5-form-code">${escapeHtml(A5_FORMS['213'].code)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๕ — หนังสือส่งบันทึกแจ้งข้อกล่าวหาและสิทธิคัดค้าน · ๒ หน้า ===== */
  function paperNoticeAccusation(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, q = i.inquiry644 || {}, m = i.committee213 || {}, intake = i.intake || {};
    const accused = a5AccusedLine(state);
    const orderNo = m.orderNo || intake.orderNo || '';
    return `<section class="a5-paper">
      ${a5LetterHdr('ตัวอย่างหนังสือส่งบันทึกแจ้งข้อกล่าวหาและสิทธิคัดค้าน “หากเป็นคณะอนุกรรมการไต่สวนให้เปลี่ยนจากคณะพนักงานไต่สวนเป็นคณะอนุกรรมการไต่สวน และคำสั่งเปลี่ยนเป็นคำสั่งคณะกรรมการ ป.ป.ท.”', c.id, q.noticeSentAt || todayISO())}
      <div class="a5-line"><b>เรื่อง</b> แจ้งข้อกล่าวหาและสิทธิคัดค้านคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน (เรื่องที่ ${a5F(c.id || '', 150)})</div>
      <div class="a5-line"><b>เรียน</b> ${a5F(accused, 400)} <span class="a5-hint">(ให้ระบุชื่อผู้ถูกกล่าวหา)</span></div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> ๑. สำเนาคำสั่งสำนักงาน ป.ป.ท. ลับที่ ${a5F(orderNo, 130)}/${a5F('', 70)} ลงวันที่ ${a5F(a5DateShort(m.orderDate || intake.orderDate), 150)} จำนวน ${a5F('', 60)} แผ่น</div>
      <div class="a5-line a5-indent3">๒. บันทึกการแจ้งข้อกล่าวหาและสิทธิคัดค้านคณะพนักงานไต่สวน จำนวน ๒ ฉบับ</div>
      <p class="a5-indent2">ด้วย สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) ได้มีคำสั่ง ลับที่ ${a5F(orderNo, 130)}/${a5F('', 70)} ลงวันที่ ${a5F(a5DateShort(m.orderDate || intake.orderDate), 140)} เรื่อง แต่งตั้งคณะพนักงานไต่สวน/ กรณีกล่าวหา ${a5F(accused, 200)} ตำแหน่ง ${a5F('', 150)} สังกัด ${a5F(c.agency || '', 200)} ผู้ถูกกล่าวหา ว่ากระทำการทุจริตในภาครัฐ รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย ๑</p>
      <p class="a5-indent2">เพื่อดำเนินการตามมาตรา ๓๓ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม จึงขอส่งบันทึกแจ้งข้อกล่าวหาและสิทธิคัดค้านคณะพนักงานไต่สวน มายังท่าน จำนวน ๒ ฉบับ รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย ๒ โดยขอให้ท่านดำเนินการ ดังนี้</p>
      <p class="a5-indent2">๑. ลงลายมือชื่อและวันเดือนปีที่รับทราบข้อกล่าวหาในบันทึกการแจ้งข้อกล่าวหาทั้ง ๒ ฉบับ ท่านเก็บไว้เอง จำนวน ๑ ฉบับ แล้วส่งอีก จำนวน ๑ ฉบับ กลับคืนไปยัง กอง/สำนัก ${a5F(intake.unit || '', 180)} สำนักงาน ป.ป.ท. อาคารซอฟต์แวร์ปาร์ค ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี ๑๑๑๒๐ โดยจะถือว่าวันที่ระบุในใบตอบรับทางไปรษณีย์เป็นวันที่ท่านได้รับแจ้งข้อกล่าวหา</p>
      <p class="a5-indent2">๒. ชี้แจงแก้ข้อกล่าวหาภายใน ๓๐ วัน นับแต่วันที่ได้รับแจ้ง โดยท่านจะชี้แจงเป็นหนังสือหรือด้วยวาจาก็ได้และมีสิทธิที่จะแสดงพยานหลักฐานหรือนำพยานบุคคลไปให้ถ้อยคำประกอบการชี้แจง หากชี้แจงด้วยวาจามีสิทธินำทนายความหรือบุคคลที่ท่านไว้วางใจไม่เกิน ๒ คน เข้าฟังการชี้แจงหรือให้ถ้อยคำ หากพ้นกำหนดเวลา ๓๐ วันแล้ว ท่านไม่ชี้แจงแก้ข้อกล่าวหาจะถือว่าผู้ถูกกล่าวหาได้รับทราบข้อกล่าวหาและไม่ประสงค์ที่จะแก้ข้อกล่าวหา</p>
      <p class="a5-indent2">๓. การคัดค้านคณะพนักงานไต่สวน ให้ทำคำร้องเป็นหนังสือ ระบุชื่อและนามสกุลของผู้ถูกคัดค้าน พร้อมทั้งแสดงข้อเท็จจริงที่เป็นเหตุแห่งการคัดค้านไว้ในคำร้องคัดค้านด้วยว่าจะทำให้การไต่สวนข้อเท็จจริงไม่ได้ความจริงและความยุติธรรมอย่างใด โดยต้องยื่นคำร้องต่อสำนักงาน ป.ป.ท. ภายใน ๓๐ วัน นับแต่วันที่ผู้ถูกกล่าวหาทราบเหตุแห่งการคัดค้าน</p>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <p class="a5-indent2">อนึ่ง หากท่านประสงค์จะไปรับทราบข้อกล่าวหาด้วยตนเอง ขอให้ท่านไปพบคณะพนักงานไต่สวน ในวันที่ ${a5F('', 160)} เวลา ${a5F('', 90)} ณ กอง/สำนัก ${a5F(intake.unit || '', 170)} สำนักงาน ป.ป.ท. อาคารซอฟต์แวร์ปาร์ค ชั้น ${a5F('', 60)} ถนนแจ้งวัฒนะ ตำบลคลองเกลือ อำเภอปากเกร็ด จังหวัดนนทบุรี ทั้งนี้ หากท่านไม่มีทนายความและประสงค์จะให้สำนักงาน ป.ป.ท. จัดหาทนายความให้ ขอให้แจ้ง นาย/นาง/นางสาว ${a5F(intake.investigator || '', 200)} โทร. ${a5F('', 140)} พนักงาน ป.ป.ท. เจ้าของสำนวน ทราบล่วงหน้าก่อนวันนัด</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อทราบ</p>
      <div class="a5-sign a5-sign-center">${a5SignCol(intake.director || '', 'หัวหน้าพนักงาน ป.ป.ท. /ประธานอนุกรรมการไต่สวน', 'ขอแสดงความนับถือ')}</div>
      ${a5LetterFoot(intake.unit, intake.investigator, 'เจ้าของสำนวน')}
      <p class="a5-form-code">${escapeHtml(A5_FORMS.notice.code)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๖ — บันทึกการแจ้งข้อกล่าวหาและสิทธิคัดค้าน · ๓ หน้า ===== */
  function paperRecordAccusation(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, q = i.inquiry644 || {}, intake = i.intake || {}, m = i.committee213 || {};
    const accused = a5AccusedLine(state);
    const team = intake.team || [];
    const OBJECTIONS = [
      'ผู้ไต่สวนรู้เห็นเหตุการณ์หรือเคยสอบสวนหรือพิจารณาเกี่ยวกับเรื่องที่กล่าวหาในฐานะอื่นที่มิใช่ในฐานะพนักงาน ป.ป.ท. หรือเจ้าหน้าที่ ป.ป.ท. มาก่อน',
      'ผู้ไต่สวนมีส่วนได้เสียในเรื่องที่กล่าวหา',
      'ผู้ไต่สวนมีสาเหตุโกรธเคืองกับผู้กล่าวหาหรือผู้ถูกกล่าวหา',
      'ผู้ไต่สวนเป็นผู้กล่าวหา หรือผู้ถูกกล่าวหา หรือเป็นคู่สมรส บุพการี ผู้สืบสันดาน หรือพี่น้องร่วมบิดามารดา หรือร่วมบิดาหรือมารดากับผู้กล่าวหาหรือผู้ถูกกล่าวหา',
      'ผู้ไต่สวนมีความสัมพันธ์ใกล้ชิดในฐานะญาติ หรือเป็นหุ้นส่วน หรือมีผลประโยชน์ร่วมกัน หรือขัดแย้งกันทางธุรกิจกับผู้กล่าวหาหรือผู้ถูกกล่าวหา'
    ];
    return `<section class="a5-paper">
      ${a5PgNo(1)}
      <header class="a5-hdr a5-hdr-record">
        <p class="a5-hdr-org">สำนักงาน ป.ป.ท.</p>
        <h2 class="a5-hdr-title">บันทึกการแจ้งข้อกล่าวหาและสิทธิคัดค้านคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน</h2>
        <p class="a5-letter-org a5-right">${A5_OFFICE_ADDR}</p>
        <p class="a5-letter-date">${a5DateParts(q.noticeSentAt || todayISO())}</p>
      </header>
      <p class="a5-indent2"><b>ส่วนที่ ๑ การแจ้งข้อกล่าวหา</b></p>
      <p class="a5-indent2">ด้วย สำนักงาน ป.ป.ท./คณะกรรมการ ป.ป.ท. ได้มีคำสั่งที่ ${a5F(m.orderNo || intake.orderNo || '', 160)} ลงวันที่ ${a5F(a5DateShort(m.orderDate || intake.orderDate), 160)} แต่งตั้งคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน เพื่อดำเนินการไต่สวน กรณีกล่าวหา ${a5F(accused, 230)} (ชื่อ – นามสกุล ตำแหน่งและสังกัดของผู้ถูกกล่าวหา) ว่ากระทำความผิดฐาน ${a5F(q.allegations || c.subject || '', 230)} (ทุจริตต่อหน้าที่ หรือกระทำความผิดต่อตำแหน่งหน้าที่ราชการ หรือกระทำความผิดต่อตำแหน่งหน้าที่ในการยุติธรรม หรือประพฤติมิชอบ ระบุข้อความตามคำสั่งแต่งตั้งพนักงาน ป.ป.ท./คณะอนุกรรมการ) ปรากฏตามเอกสารแนบท้ายบันทึกฉบับนี้</p>
      <p class="a5-indent2">บัดนี้ คณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน ขอแจ้งให้ท่านทราบก่อนแจ้งข้อกล่าวหาว่าในการชี้แจงแก้ข้อกล่าวหา ผู้ถูกกล่าวหาอาจแก้ข้อกล่าวหาโดยทำเป็นหนังสือหรือมาชี้แจงด้วยวาจาก็ได้ และผู้ถูกกล่าวหามีสิทธิที่จะให้ถ้อยคำหรือไม่ก็ได้ ถ้าผู้ถูกกล่าวหาให้ถ้อยคำ ถ้อยคำของผู้ถูกกล่าวหานั้นอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้</p>
      <p class="a5-indent2">ในการชี้แจงแก้ข้อกล่าวหาด้วยวาจาผู้ถูกกล่าวหามีสิทธิที่จะนำทนายความหรือบุคคลซึ่งผู้ถูกกล่าวหาไว้วางใจไม่เกินสองคนเข้าฟังการให้ถ้อยคำของตนได้ ก่อนเริ่มถามคำให้การในคดีที่มีอัตราโทษจำคุกหรือประหารชีวิต หากผู้ถูกกล่าวหาไม่มีทนายความและต้องการทนายความสำนักงาน ป.ป.ท. จะจัดหาทนายความให้ คดีที่ผู้ถูกกล่าวหามีอายุไม่เกินสิบแปดปีในวันที่แจ้งข้อกล่าวหา หากผู้ถูกกล่าวหาไม่มีทนายความ สำนักงาน ป.ป.ท. จะจัดหาทนายความให้ และผู้ถูกกล่าวหาจะนำพยานหลักฐานมาเอง หรือจะอ้างพยานหลักฐานโดยขอให้คณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน พิจารณาเรียกพยานหลักฐานนั้นมาก็ได้ ทั้งนี้ มีสิทธิที่จะชี้แจงข้อกล่าวหาและนำพยานหลักฐานมาสืบแก้ข้อกล่าวหาภายในเวลาอันสมควร แต่อย่างช้าไม่เกิน ๓๐ วัน นับแต่วันที่ได้รับทราบข้อกล่าวหาหรือถือว่าได้รับทราบข้อกล่าวหา คณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน ได้รวบรวมพยานหลักฐานที่เกี่ยวข้องกับข้อกล่าวหาแล้ว จึงขอแจ้งข้อกล่าวหาให้ผู้ถูกกล่าวหาทราบ ดังนี้</p>
      <p class="a5-indent2">๑. ประเด็นเกี่ยวกับเหตุการณ์หรือเรื่องราวที่เกิดขึ้น</p>
      <p class="a5-indent3">ระบุข้อเท็จจริงและพฤติการณ์ในการกระทำผิดเท่าที่จะทำให้ผู้ถูกกล่าวหาเข้าใจข้อกล่าวหาได้ดี จัดลำดับเหตุการณ์ว่ามีความเป็นมาอย่างไร โดยมีรายละเอียดเกี่ยวกับบุคคล สิ่งของ เวลา และสถานที่ตามสมควรและผู้ถูกกล่าวหาเข้าไปเกี่ยวข้องกับเหตุการณ์นั้นอย่างไร ${a5F(q.statements || '', 260)}</p>
      <p class="a5-indent2">๒. ประเด็นเกี่ยวกับองค์ประกอบความผิด</p>
      <p class="a5-indent3">จากการไต่สวนข้อเท็จจริงฟังได้ว่า (พิจารณาองค์ประกอบความผิดตามกฎหมายที่จะแจ้งข้อกล่าวหาต่อผู้ถูกกล่าวหาแต่ละคนแล้วอ้างข้อเท็จจริงว่าผู้ถูกกล่าวหาทำอะไร อย่างไร ให้ครบทุกองค์ประกอบความผิด ตามลำดับประเด็น)</p>
      <p class="a5-indent4">- ประเด็นเกี่ยวกับสถานะ ตำแหน่ง และความเป็นเจ้าหน้าที่ของรัฐ</p>
      <p class="a5-indent4">- ประเด็นเกี่ยวกับอำนาจหน้าที่</p>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <p class="a5-indent4">- ประเด็นเกี่ยวกับการกระทำผิดต่อตำแหน่งหน้าที่</p>
      <p class="a5-indent4">- ประเด็นเกี่ยวกับความเสียหาย</p>
      <p class="a5-indent2">๓. ประเด็นผู้ถูกกล่าวหากระทำผิดกฎหมายในข้อหา</p>
      <p class="a5-indent3">จึงขอแจ้งข้อกล่าวหาว่า ท่านกระทำความผิดทางอาญาในข้อหา ${a5F(q.allegations || '', 300)} (อ้างว่าผู้ถูกกล่าวหากระทำความผิดกฎหมายในฐานความผิดใด โดยระบุข้อความในกฎหมายลงไป แต่ไม่จำเป็นต้องระบุเลขมาตรา)</p>
      <p class="a5-indent3">และมีความผิดทางวินัยฐาน ${a5F('', 380)}</p>
      <p class="a5-indent3">เหตุเกิดวันที่ ${a5F(a5DateShort(i.prelim?.place ? '' : ''), 140)} (หรือระหว่างวันที่ ${a5F('', 120)} ถึงวันที่ ${a5F('', 120)}) สถานที่เกิดเหตุอยู่ในท้องที่ตำบล ${a5F('', 150)} อำเภอ ${a5F('', 150)} จังหวัด ${a5F('', 170)}</p>
      <p class="a5-indent2"><b>ส่วนที่ ๒ การแจ้งสิทธิคัดค้านคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน</b></p>
      <p class="a5-indent2">คณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน ประกอบด้วยบุคคลตามรายชื่อ ดังต่อไปนี้</p>
      <p class="a5-indent3">๑. ${a5F(intake.director || '', 320)} พนักงาน ป.ป.ท./ประธานอนุกรรมการ</p>
      <p class="a5-indent3">๒. ${a5F(team[0] || '', 320)} เจ้าหน้าที่ ป.ป.ท./อนุกรรมการ</p>
      <p class="a5-indent3">๓. ${a5F(q.investigator || intake.investigator || '', 280)} พนักงาน ป.ป.ท. เจ้าของสำนวน/อนุกรรมการและเลขานุการ</p>
      <p class="a5-indent2">ขอแจ้งให้ทราบว่าผู้ถูกกล่าวหามีสิทธิคัดค้านผู้ได้รับการแต่งตั้งเป็นคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน โดยผู้ถูกกล่าวหาจะต้องทำคำร้องเป็นหนังสือระบุชื่อและนามสกุลของผู้ถูกคัดค้าน พร้อมทั้งแสดงข้อเท็จจริงที่เป็นเหตุแห่งการคัดค้านไว้ในคำร้องคัดค้านด้วยว่าจะทำให้การไต่สวนข้อเท็จจริงไม่ได้ความจริงและความยุติธรรมอย่างใด และยื่นคำร้องคัดค้านเป็นหนังสือต่อสำนักงาน ป.ป.ท. ภายใน ๓๐ วัน นับแต่วันที่ผู้ถูกกล่าวหาทราบเหตุแห่งการคัดค้านอย่างหนึ่งอย่างใด ดังต่อไปนี้</p>
      ${OBJECTIONS.map((t, n) => `<p class="a5-indent2">(${a5Num(n + 1)}) ${t}</p>`).join('')}
      <p class="a5-indent2">ทั้งนี้ กรณีที่ผู้ถูกกล่าวหามิได้ดำเนินการให้ครบถ้วนตามเงื่อนไขข้างต้น ให้ถือว่าผู้ถูกกล่าวหาไม่ประสงค์ที่จะคัดค้านผู้ที่ได้รับการแต่งตั้งเป็นคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน ในกรณีดังกล่าว</p>
      <div class="a5-sign a5-sign-stack a5-sign-left">
        ${a5SignCol(intake.director || '', 'พนักงาน ป.ป.ท./ประธานอนุกรรมการ', 'ลงชื่อ')}
        ${a5SignCol(team[0] || '', 'เจ้าหน้าที่ ป.ป.ท./อนุกรรมการ', 'ลงชื่อ')}
        ${a5SignCol(q.investigator || intake.investigator || '', 'พนักงาน ป.ป.ท. เจ้าของสำนวน/อนุกรรมการและเลขานุการ', 'ลงชื่อ')}
      </div>
      ${a5Foot()}${A5_PG}${a5PgNo(3)}
      <p class="a5-indent2"><b>ส่วนที่ ๓ การรับทราบข้อกล่าวหา</b></p>
      <p class="a5-indent2">ข้าพเจ้า ${a5F(accused, 280)} (ระบุชื่อ-นามสกุลของผู้ถูกกล่าวหา) ได้รับทราบและเข้าใจข้อกล่าวหาโดยตลอดและได้รับทราบสิทธิการคัดค้านผู้ได้รับแต่งตั้งเป็นคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวนแล้ว โดยได้รับบันทึกนี้จำนวน ๑ ฉบับ และสำเนาคำสั่งคณะกรรมการ ป.ป.ท. ที่ ${a5F(m.orderNo || '', 160)} ลงวันที่ ${a5F(a5DateShort(m.orderDate), 160)} จำนวน ๑ ฉบับ ไว้แล้ว เมื่อวันที่ ${a5F('', 60)} เดือน ${a5F('', 120)} พ.ศ. ${a5F('', 70)} (คือวันที่ได้รับหนังสือแจ้งให้รับทราบข้อกล่าวหาตามที่ระบุในไปรษณีย์ตอบรับ) และประสงค์ที่จะชี้แจงแก้ข้อกล่าวหาภายในวันที่ ${a5F('', 60)} เดือน ${a5F('', 120)} พ.ศ. ${a5F('', 70)} (ต้องชี้แจงภายใน ๓๐ วันนับแต่วันที่ได้รับทราบข้อกล่าวหาหรือถือว่าได้รับทราบข้อกล่าวหา) หากพ้นกำหนดนี้แล้ว ให้ถือว่าข้าพเจ้าไม่ประสงค์ที่จะชี้แจงแก้ข้อกล่าวหา และในกรณีที่ข้าพเจ้าประสงค์จะคัดค้านคณะพนักงานไต่สวน/คณะอนุกรรมการไต่สวน ข้าพเจ้าจะต้องยื่นคำร้องเป็นหนังสือต่อสำนักงาน ป.ป.ท. ภายใน ๓๐ วัน นับแต่วันที่ทราบเหตุคัดค้าน เพื่อเป็นหลักฐานจึงลงลายมือชื่อไว้เป็นสำคัญ</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', 'ผู้ถูกกล่าวหา', 'ลงชื่อ')}</div>
      <div class="a5-note">
        <p><b>หมายเหตุ</b> บันทึกนี้ให้ทำเป็น ๓ ฉบับ เก็บไว้ในสำนวนการไต่สวนจำนวน ๑ ฉบับ</p>
        <p class="a5-indent">ส่งให้ผู้ถูกกล่าวหาจำนวน ๒ ฉบับ เพื่อให้ผู้ถูกกล่าวหาลงลายมือชื่อและวันเดือนปีที่รับทราบข้อกล่าวหา ผู้ถูกกล่าวหาเก็บไว้ จำนวน ๑ ฉบับ และส่งกลับคืน จำนวน ๑ ฉบับ เก็บรวมไว้ในสำนวนการไต่สวน</p>
      </div>
      <p class="a5-form-code">${escapeHtml(A5_FORMS.record.code)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๗ — รายงานการไต่สวน · ๓ หน้า ===== */
  function paper644(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, q = i.inquiry644 || {}, m = i.committee213 || {}, mc = i.committee644 || {}, intake = i.intake || {}, m62 = intake.m62 || {};
    const accused = a5AccusedLine(state);
    const witnesses = (q.witnesses || []).filter(Boolean).join(', ');
    const subject = state.documentData?.documentSubject || c.subject || '';
    const fromNacc = Boolean(m62.flag) || String(c.decision || '').includes('62');
    const team = intake.team || [];
    return `<section class="a5-paper">
      <header class="a5-hdr a5-hdr-report">
        <p class="a5-hdr-org">สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</p>
        <h2 class="a5-hdr-title">รายงานการไต่สวน</h2>
      </header>
      <div class="a5-line"><b>เรื่องที่</b> ${a5F(c.id || '', 560)}</div>
      <div class="a5-line"><b>สำนัก/กอง</b> ${a5F(intake.unit || '', 300)} <span class="a5-hint">ที่เป็นเจ้าของเรื่อง (ตามเลขเรื่อง)</span></div>
      <p class="a5-right">${a5DateParts(q.submittedAt || todayISO())}</p>
      <div class="a5-line"><b>เรียน</b> ประธานกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ</div>

      <p class="a5-num-h"><b>๑. การรับเรื่อง</b> (เลือกใส่เฉพาะกรณีตามข้อเท็จจริง)</p>
      <div class="a5-cbline a5-indent2"><b>${a5Cb(fromNacc, 'กรณีรับจากสำนักงาน ป.ป.ช. ตามมาตรา ๖๒')}</b></div>
      <p class="a5-indent2">๑.๑ เมื่อวันที่ ${a5F(a5DateShort(m62.sourceMtiDate), 150)} สำนักงาน ป.ป.ช. รับเรื่องที่ ${a5F(m62.sourceLetter || '', 160)} (เลขอ้างอิง/เลขดำติดตามที่ ${a5F('', 110)}) จาก ${a5F('', 180)} (ระบุช่องทางการรับเรื่อง เช่น บัตรสนเท่ห์ ผู้ร้อง พนักงานสอบสวน สถานีตำรวจ สำนักงานตรวจเงินแผ่นดิน หรือ ${a5F('', 180)})</p>
      <p class="a5-indent2">๑.๒ สำนักงาน ป.ป.ช./สำนักงาน ป.ป.ช. จังหวัด ${a5F('', 140)} ส่งเรื่องมายังสำนักงาน ป.ป.ท. /สำนักงาน ปปท. เขต ${a5F(intake.unit || '', 130)} ตามมติคณะกรรมการ ป.ป.ช. ครั้งที่ ${a5F('', 100)} เมื่อวันที่ ${a5F(a5DateShort(m62.sourceMtiDate), 150)} ตามหนังสือ ป.ป.ช. ที่ ${a5F(m62.sourceLetter || '', 170)}</p>
      <p class="a5-indent2">๑.๓ สำนักงาน ป.ป.ท. /สำนักงาน ปปท. เขต ${a5F(intake.unit || '', 140)} รับเรื่องเมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 160)}</p>
      <p class="a5-indent2">๑.๔ คณะกรรมการ ป.ป.ท. มีมติให้ไต่สวน ตามคำสั่งคณะกรรมการ ป.ป.ท. /สำนักงาน ป.ป.ท. ลับ ที่ ${a5F(m.orderNo || '', 200)} (ในกรณีที่มีคำสั่งให้แก้ไขเพิ่มเติม-ไต่สวนบุคคลใดเพิ่มเติม ให้ระบุไว้ด้วย)</p>
      <div class="a5-cbline a5-indent2"><b>${a5Cb(!fromNacc, 'กรณีคดีประพฤติมิชอบ')}</b></div>
      <p class="a5-indent2">๑.๑ เมื่อวันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)} สำนักงาน ป.ป.ท./สำนักงาน ป.ป.ท. โดยสำนักงาน ปปท. เขต ${a5F(intake.unit || '', 140)} รับเรื่อง ${a5F('', 160)} ระบุช่องทางรับเรื่อง เช่น หนังสือร้องเรียน สายด่วน ๑๒๐๖ เว็บไซต์สำนักงาน ป.ป.ท. ${a5F('', 130)} วันที่ ${a5F(a5DateShort(intake.receivedFirstAt), 150)}</p>
      <p class="a5-indent2">๑.๒ คณะกรรมการ ป.ป.ท. มีมติให้ไต่สวน ตามคำสั่งคณะกรรมการ ป.ป.ท. /สำนักงาน ป.ป.ท. ลับ ที่ ${a5F(m.orderNo || '', 200)} (ในกรณีที่มีคำสั่งให้แก้ไขเพิ่มเติม-ไต่สวนบุคคลใดเพิ่มเติม ให้ระบุไว้ด้วย)</p>
      <p class="a5-num-h"><b>๒. ผู้กล่าวหา</b> (ระบุชื่อ-สกุล ตำแหน่ง และที่อยู่ หรือขอปกปิดชื่อ) ${a5F(c.complainant || '', 330)}</p>
      <p class="a5-num-h"><b>๓. ผู้ถูกกล่าวหา</b> (ให้ระบุชื่อ-สกุล หมายเลขบัตรประจำตัวประชาชน ตำแหน่ง ยศ สังกัด และที่อยู่ (ตามทะเบียนราษฎรขณะแจ้งข้อกล่าวหา) สถานะปัจจุบันเป็นรายบุคคล (หากถูกไล่ออกให้ระบุคำสั่งหรือเหตุที่ถูกไล่ออกด้วย) โดยกำหนดผู้ถูกกล่าวหาเป็นลำดับ หากผู้ถูกกล่าวหามีจำนวนมากอาจทำเป็นบัญชีแนบท้ายที่ได้จากการตรวจสอบ)</p>
      <div class="a5-line a5-indent2">${a5F(accused, 600)}</div>
      <p class="a5-num-h"><b>๔. ข้อกล่าวหา พฤติการณ์ที่กล่าวหา</b> (สรุปพฤติการณ์ตามคำกล่าวหาของผู้กล่าวหาหรือจากคำสั่งแต่งตั้ง)</p>
      <div class="a5-line a5-indent2">${a5F(q.allegations || subject, 600)}</div>
      <p class="a5-num-h"><b>๕. การรวบรวมพยานหลักฐาน</b> (สรุปคำให้การของผู้ให้ถ้อยคำให้ชัดเจนว่าบุคคลนั้นให้การในประเด็นใด มีสาระสำคัญว่าอย่างไร โดยเรียงลำดับตามความสำคัญ และสรุปประเด็นสำคัญของเอกสาร)</p>
      <p class="a5-indent2">๕.๑ พยานบุคคล (สรุปคำให้การผู้กล่าวหา/พยาน) ${a5F(witnesses, 300)}</p>
      <p class="a5-indent2">๕.๒ พยานเอกสาร (สรุปข้อเท็จจริงจากพยานเอกสารที่รวบรวม) ${a5F(q.statements || '', 280)}</p>
      <p class="a5-indent2">๕.๓ พยานวัตถุ และพยานอื่น ๆ ${a5F('', 380)}</p>
      <p class="a5-indent2">๕.๔ ผลการดำเนินการสอบข้อเท็จจริง/วินัย/ละเมิดของหน่วยงานต้นสังกัด ${a5F('', 260)}</p>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}

      <p class="a5-num-h"><b>๖. การดำเนินการอื่น ๆ</b></p>
      <p class="a5-indent2">๖.๑ การคุ้มครองพยาน ${a5F(q.witnessProtection || '', 400)}</p>
      <p class="a5-indent2">๖.๒ การกันบุคคลหรือผู้ถูกกล่าวหาไว้เป็นพยาน ${a5F('', 350)}</p>
      <p class="a5-indent2">๖.๓ การดำเนินการอื่น ๆ (ถ้ามี) เช่น การสืบพยานบุคคลไว้ล่วงหน้า ${a5F('', 280)}</p>
      <p class="a5-num-h"><b>๗. วันเวลาและสถานที่เกิดเหตุ</b> ${a5F(i.prelim?.place || '', 400)}</p>
      <p class="a5-num-h"><b>๘. ความเสียหาย</b> ${a5F(i.prelim?.issues?.damage || '', 440)}</p>
      <p class="a5-num-h"><b>๙. อายุความ</b> (ให้ระบุอายุความและวันขาดอายุความของการกระทำความผิดที่ถูกกล่าวหาทุกข้อกล่าวหา)</p>
      <div class="a5-line a5-indent2">มาตรา ${a5F(i.prelim?.limitation?.longSection || '', 80)} อายุความ ${a5F(i.prelim?.limitation?.longYears || '', 60)} ปี ขาดอายุความวันที่ ${a5F(a5DateShort(i.prelim?.limitation?.longExpiry) || i.prelim?.limitation?.longExpiry || '', 180)}</div>
      <p class="a5-num-h"><b>๑๐. กฎหมายและระเบียบที่เกี่ยวข้อง</b> (กฎหมายหรือระเบียบที่เกี่ยวกับอำนาจหน้าที่ของผู้ถูกร้องเรียน บทความผิดทางอาญาและวินัย ระเบียบ ข้อบังคับ ประกาศ หรือกฎหมายที่เกี่ยวข้องกับการปฏิบัติงานที่ถูกร้องเรียน หากเป็นระเบียบ ข้อบังคับ ประกาศ หรือกฎหมายเฉพาะให้พิมพ์เนื้อหาด้วย ให้ระบุชื่อกฎหมายพร้อมมาตรา)</p>
      <div class="a5-line a5-indent2">${a5F('', 600)}</div>
      <p class="a5-num-h"><b>๑๑. การแจ้งคำสั่ง การคัดค้าน/ผลการคัดค้านผู้ไต่สวน การแจ้งข้อกล่าวหา การชี้แจงแก้ข้อกล่าวหา</b></p>
      <p class="a5-indent2">๑๑.๑ การแจ้งคำสั่ง การคัดค้าน/ผลการคัดค้านผู้ไต่สวน</p>
      <p class="a5-indent3">ได้แจ้งคำสั่งให้ผู้ถูกกล่าวหาทราบแล้ว ตามหนังสือ ${a5F(m.orderNo || '', 300)}</p>
      <p class="a5-indent3">การคัดค้านผู้ไต่สวน/ผลการคัดค้าน ${a5F('', 350)}</p>
      <p class="a5-indent2">๑๑.๒ การแจ้งข้อกล่าวหา</p>
      <p class="a5-indent3">ได้แจ้งข้อกล่าวหาให้ผู้ถูกกล่าวหาทราบ ตามหนังสือ ${a5F('', 170)} เมื่อวันที่ ${a5F(a5DateShort(q.noticeSentAt), 150)} ทางไปรษณีย์ลงทะเบียนตอบรับ และผู้ถูกกล่าวหาได้รับทราบข้อกล่าวหา ทางไปรษณีย์/รับทราบด้วยตนเองแล้ว เมื่อวันที่ ${a5F(a5DateShort(q.noticeSentAt), 170)}</p>
      <p class="a5-indent3">ข้อกล่าวหาที่แจ้ง (รายละเอียดตามบันทึกการแจ้งข้อกล่าวหา) ${a5F(q.allegations || '', 250)}</p>
      <p class="a5-indent2">๑๑.๓ การชี้แจงแก้ข้อกล่าวหา</p>
      <p class="a5-indent3">(๑) คำให้การผู้ถูกกล่าวหา/หนังสือชี้แจงแก้ข้อกล่าวหา ${a5F('', 280)}</p>
      <p class="a5-indent3">(๒) พยานหลักฐานของผู้ถูกกล่าวหา</p>
      <p class="a5-indent4">(๒.๑) พยานบุคคล ${a5F('', 350)}</p>
      <p class="a5-indent4">(๒.๒) พยานเอกสาร ${a5F('', 350)}</p>
      <p class="a5-indent4">(๒.๓) พยานวัตถุ/อื่น ๆ ${a5F('', 340)}</p>
      <p class="a5-num-h"><b>๑๒. เหตุผลในการพิจารณาวินิจฉัย</b> (ให้สรุปพฤติการณ์และพยานหลักฐานโดยปรับให้เข้ากับองค์ประกอบข้อกฎหมาย โดยให้พิจารณาผู้ถูกกล่าวหาแต่ละรายตามลำดับ)</p>
      <p class="a5-indent2">๑๒.๑ ประเด็นเกี่ยวกับสถานะของผู้ถูกกล่าวหา ${a5F(i.prelim?.issues?.status || '', 300)}</p>
      <p class="a5-indent2">๑๒.๒ ประเด็นเกี่ยวกับอำนาจหน้าที่ของผู้ถูกกล่าวหา ${a5F(i.prelim?.issues?.authority || '', 290)}</p>
      <p class="a5-indent2">๑๒.๓ ประเด็นเกี่ยวกับการกระทำของผู้ถูกกล่าวหา ${a5F(i.prelim?.issues?.action || '', 290)}</p>
      <p class="a5-indent2">๑๒.๔ ประเด็นความเสียหาย ${a5F(i.prelim?.issues?.damage || '', 350)}</p>
      <p class="a5-indent2">คดีมีประเด็นที่ต้องวินิจฉัยว่า ${a5F('', 380)}</p>
      <p class="a5-indent2">ข้อเท็จจริงจากการไต่สวนได้ความว่า ${a5F(q.summary || '', 360)}</p>
      ${a5Foot()}${A5_PG}${a5PgNo(3)}

      <p class="a5-indent2">พิเคราะห์แล้วเห็นว่า (ให้ปรับข้อเท็จจริงให้เข้ากับข้อกฎหมายตามองค์ประกอบความผิดในแต่ละฐาน) ${a5F(q.report || '', 300)}</p>
      <p class="a5-indent2">ความเห็น/มติ (ในกรณีที่คณะอนุกรรมการไต่สวน/คณะพนักงานไต่สวน มีความเห็นแย้ง ให้ระบุเสียงข้างมากและข้างน้อย พร้อมทั้งเหตุผลในการวินิจฉัย หรือในกรณีที่คณะพนักงานไต่สวน ซึ่งไม่สามารถหาเสียงข้างมากได้ ให้ระบุเหตุผลในการวินิจฉัยของแต่ละคน) ${a5F(mc.result || '', 260)}</p>
      <p class="a5-indent2">(ในกรณีที่แจ้งข้อกล่าวหาผู้ถูกกล่าวหาฐานความผิดใดแล้ว จะต้องมีความเห็นในทุกข้อกล่าวหา)</p>
      <p class="a5-num-h"><b>๑๓. สรุปบทความผิดผู้ถูกกล่าวหาแต่ละรายตามลำดับ</b></p>
      <p class="a5-indent2">- กรณีให้ข้อกล่าวหาตกไป (ให้สรุปความเห็นโดยย่อและให้มีความเห็นทางคดี ${a5F(mc.result === 'ข้อกล่าวหาไม่มีมูล/สิทธิฟ้องระงับ' ? (mc.note || mc.result) : '', 230)} จึงเห็นควรให้ข้อกล่าวหาตกไป)</p>
      <p class="a5-indent2">- กรณีมีมูลความผิด</p>
      <p class="a5-indent3">- ความผิดทางอาญา ให้ระบุฐานความผิดตามประมวลกฎหมายอาญา มาตรา ${a5F('', 140)} หรือตามกฎหมายอื่น มาตรา ${a5F('', 200)}</p>
      <p class="a5-indent3">- ความผิดทางวินัย ให้ระบุฐานความผิดวินัย ${a5F('', 180)} ตามกฎหมายของหน่วยงาน ${a5F('', 180)}</p>
      <p class="a5-indent2">- กรณีอื่น ๆ เช่น กรณีไม่มีความผิดทางอาญาแต่มีความผิดทางวินัย หรือกรณีเพิกถอนคำสั่งทางปกครองตามมาตรา ๔๖ แห่งพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม, ส่งเรื่องให้ต้นสังกัดดำเนินการในส่วนที่เกี่ยวข้อง, ส่งคณะกรรมการ ป.ป.ช. เป็นต้น</p>
      <div class="a5-line a5-indent2">${a5F(mc.note || '', 600)}</div>
      <p class="a5-num-h"><b>๑๔. ข้อเสนอ</b></p>
      <p class="a5-indent2">เห็นควรเสนอเรื่องให้คณะกรรมการ ป.ป.ท. พิจารณาวินิจฉัยชี้มูลตามความเห็นในข้อ ๑๓</p>
      <div class="a5-sign a5-sign-stack a5-sign-left">
        ${a5SignCol(intake.director || '', 'ประธานอนุกรรมการ/พนักงาน ป.ป.ท.', 'ลงชื่อ')}
        ${a5SignCol(team[0] || '', 'อนุกรรมการ/เจ้าหน้าที่ ป.ป.ท.', 'ลงชื่อ')}
        ${a5SignCol(q.investigator || intake.investigator || '', 'อนุกรรมการและเลขานุการ/พนักงาน ป.ป.ท. เจ้าของสำนวน', 'ลงชื่อ')}
      </div>
      <p class="a5-form-code">${escapeHtml(A5_FORMS['644'].code)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๘ + ๙ + ๑๐ — หนังสือเกี่ยวกับพนักงานอัยการ · ฉบับละ ๑ หน้า ===== */
  function paperProsecutorLetters(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, o = i.outcome || {}, q = i.inquiry644 || {}, intake = i.intake || {};
    const accused = a5AccusedLine(state);
    const allegations = q.allegations || c.subject || '';
    const prosecutor = o.prosecutor || '';
    const inv = q.investigator || intake.investigator || '';
    const today = todayISO();
    const SEC_GEN = 'เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ';
    return `<section class="a5-paper">
      ${a5LetterHdr('ตัวอย่างหนังสือแจ้งให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการเพื่อฟ้องคดีต่อศาล', c.id, today)}
      <div class="a5-line"><b>เรื่อง</b> ขอให้ไปพบพนักงานอัยการ</div>
      <div class="a5-line"><b>เรียน</b> ${a5F(accused, 380)} <span class="a5-hint">(ชื่อ – นามสกุล ผู้ถูกกล่าวหา)</span></div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> สำเนาหนังสือสำนักงานอัยการ ${a5F(prosecutor, 190)} (ผู้ฟ้องคดี) ที่ ${a5F('', 130)}</div>
      <div class="a5-line a5-indent3">ลงวันที่ ${a5F('', 150)} <span class="a5-hint">(หนังสือที่แจ้งว่าเห็นชอบให้สั่งฟ้องผู้ถูกกล่าวหา)</span></div>
      <p class="a5-indent2">ด้วยพนักงานอัยการได้มีคำสั่งฟ้องท่านต่อศาล ${a5F(`ศาล${A5_COURT}`, 250)} (ที่มีเขตอำนาจพิจารณาพิพากษา) ในความผิดฐาน ${a5F(allegations, 250)} (ฐานความผิดตามที่พนักงานอัยการแจ้ง) รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย</p>
      <p class="a5-indent2">สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) จึงขอแจ้งให้ท่านทราบและขอให้ท่านไปพบพนักงานอัยการ ณ สำนักงานอัยการ ${a5F(prosecutor, 200)} (ผู้ฟ้องคดี) ในวันที่ ${a5F('', 180)} เวลา ${a5F('', 90)} น. ในกรณีที่ท่านประสงค์จะยื่นคำร้องขอปล่อยตัวชั่วคราวในชั้นพนักงานอัยการหรือชั้นศาลขอให้เตรียมหลักประกันไปพร้อมด้วย</p>
      <p class="a5-indent2">อนึ่ง หากท่านไม่ไปพบพนักงานอัยการตามวันเวลาที่กำหนด อาจเป็นเหตุให้ถูกออกหมายจับเพื่อนำตัวส่งฟ้องศาลต่อไปได้</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อทราบ</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', SEC_GEN, 'ขอแสดงความนับถือ', 'หรือผู้ที่ได้รับมอบหมาย')}</div>
      ${a5LetterFoot(intake.unit, inv)}
      ${a5Foot()}

      ${A5_PG}

      ${a5LetterHdr('ตัวอย่างหนังสือแจ้งผู้บังคับบัญชา กรณีให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการเพื่อฟ้องคดีต่อศาล', c.id, today)}
      <div class="a5-line"><b>เรื่อง</b> แจ้งคำสั่งฟ้องคดีของพนักงานอัยการ</div>
      <div class="a5-line"><b>เรียน</b> ${a5F(c.agency || '', 340)} <span class="a5-hint">(ผู้บังคับบัญชาหรือผู้มีอำนาจแต่งตั้งถอดถอนผู้ถูกกล่าวหา)</span></div>
      <div class="a5-line"><b>อ้างถึง</b> หนังสือสำนักงาน ป.ป.ท. ${a5F(state.documentData?.dispatchLetterNo || '', 260)}</div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> สำเนาหนังสือสำนักงานอัยการ ${a5F(prosecutor, 190)} (ผู้ฟ้องคดี) ที่ ${a5F('', 130)}</div>
      <div class="a5-line a5-indent3">ลงวันที่ ${a5F('', 150)} <span class="a5-hint">(หนังสือที่แจ้งว่าเห็นชอบให้สั่งฟ้องผู้ถูกกล่าวหา)</span></div>
      <p class="a5-indent2">ตามที่ได้แจ้งให้ท่านทราบว่าคณะกรรมการ ป.ป.ท. ได้ชี้มูลความผิด ${a5F(accused, 230)} (ระบุชื่อ-สกุล ตำแหน่งของผู้ถูกกล่าวหา) ในฐานความผิด ${a5F(allegations, 230)} (ตามมติของคณะกรรมการ ป.ป.ท.) โดยในส่วนของความผิดทางอาญาได้ส่งเรื่องให้พนักงานอัยการดำเนินการ ความละเอียดแจ้งแล้ว นั้น</p>
      <p class="a5-indent2">สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) ขอเรียนว่า พนักงานอัยการได้มีคำสั่งฟ้อง ${a5F(accused, 220)} (ระบุชื่อ-สกุล ตำแหน่งของผู้ถูกกล่าวหา) ในความผิดฐาน ${a5F(allegations, 220)} (ฐานความผิดตามที่พนักงานอัยการแจ้ง) โดยกำหนดให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการ ณ สำนักงานอัยการ ${a5F(prosecutor, 190)} (ผู้ฟ้องคดี) ในวันที่ ${a5F('', 170)} เวลา ${a5F('', 90)} น. รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย ทั้งนี้ หากผู้ถูกกล่าวหาประสงค์จะยื่นคำร้องขอปล่อยตัวชั่วคราวในชั้นพนักงานอัยการหรือชั้นศาลขอให้เตรียมหลักประกันไปในวันดังกล่าว</p>
      <p class="a5-indent2">อนึ่ง หากผู้ถูกกล่าวหาไม่ไปพบพนักงานอัยการตามวันเวลาที่กำหนด อาจเป็นเหตุให้ถูกออกหมายจับเพื่อนำตัวส่งฟ้องศาลต่อไปได้</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดทราบ และแจ้งให้ผู้ถูกกล่าวหาทราบด้วย จักขอบคุณมาก</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', SEC_GEN, 'ขอแสดงความนับถือ', 'หรือผู้ที่ได้รับมอบหมาย')}</div>
      ${a5LetterFoot(intake.unit, inv)}
      ${a5Foot()}

      ${A5_PG}

      ${a5LetterHdr('ตัวอย่างหนังสือแจ้งพนักงานอัยการ แจ้งกำหนดนัดไปรายงานตัวของผู้ถูกกล่าวหา', c.id, today)}
      <div class="a5-line"><b>เรื่อง</b> การแจ้งให้ผู้ถูกกล่าวหามาพบพนักงานอัยการ</div>
      <div class="a5-line"><b>เรียน</b> ${a5F(prosecutor, 340)} <span class="a5-hint">(อัยการผู้ฟ้องคดี)</span></div>
      <div class="a5-line"><b>อ้างถึง</b> หนังสือสำนักงานอัยการ (ผู้ฟ้องคดี) ที่ ${a5F('', 150)} ลงวันที่ ${a5F('', 150)}</div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> สำเนาหนังสือสำนักงาน ป.ป.ท. ที่ ปป ๐๐../${a5F(c.id || '', 120)} ลงวันที่ ${a5F('', 140)}</div>
      <div class="a5-line a5-indent3"><span class="a5-hint">(หนังสือที่แจ้งผู้ถูกกล่าวหามาพบพนักงานอัยการ)</span></div>
      <p class="a5-indent2">ตามที่สำนักงานอัยการ (ผู้ฟ้องคดี) แจ้งให้ทราบว่า พนักงานอัยการได้มีคำสั่งฟ้อง ${a5F(accused, 230)} (ชื่อ – นามสกุล ผู้ถูกกล่าวหา) ในฐานความผิด ${a5F(allegations, 230)} และขอให้สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) แจ้งให้ผู้ถูกกล่าวหามาพบพนักงานอัยการตามวันเวลาที่กำหนด ความละเอียดแจ้งแล้ว นั้น</p>
      <p class="a5-indent2">สำนักงาน ป.ป.ท. ขอเรียนว่า ได้มีหนังสือแจ้งให้ ${a5F(accused, 230)} (ชื่อ – นามสกุล ผู้ถูกกล่าวหา) ผู้ถูกกล่าวหามาพบพนักงานอัยการ ณ สำนักงานอัยการ ${a5F(prosecutor, 200)} (ผู้ฟ้องคดี) ในวันที่ ${a5F('', 170)} เวลา ${a5F('', 90)} น. แล้ว รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดทราบ และหากถึงกำหนดวันนัด ผู้กล่าวหามาพบพนักงานอัยการหรือไม่ โปรดแจ้งให้ทราบด้วย จักขอบคุณมาก</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', SEC_GEN, 'ขอแสดงความนับถือ', 'หรือผู้ที่ได้รับมอบหมาย')}</div>
      ${a5LetterFoot(intake.unit, inv)}
      <p class="a5-form-code">${escapeHtml(`${A5_FORMS.p8.code} · ${A5_FORMS.p9.code} · ${A5_FORMS.p10.code}`)}</p>
    </section>`;
  }

  /* ===== แบบ ปปท. ๑๑–๒๐ — ชุดเอกสารหมายจับ · รวม ๑๕ หน้า ===== */
  function paperWarrants(state) {
    const c = state.caseData || {}, i = state.inquiry || {}, q = i.inquiry644 || {}, o = i.outcome || {}, intake = i.intake || {}, m = i.committee213 || {}, mc = i.committee644 || {};
    const w = o.warrant || {};
    const accused = a5AccusedLine(state);
    const inv = q.investigator || intake.investigator || '';
    const allegations = q.allegations || c.subject || '';
    const prosecutor = o.prosecutor || '';
    const today = todayISO();
    const court = w.court || `ศาล${A5_COURT}`;
    const SEC_GEN = 'เลขาธิการคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ';
    /* แถวหัวข้อ:ค่า แบบเส้นใต้ทึบ (แบบพิมพ์ศาล/ตำหนิรูปพรรณ) */
    const row = (label, ...cells) => `<div class="a5-line a5-urow"><span class="a5-ulabel">${label}</span>${cells.join('')}</div>`;
    /* ชุดช่องติ๊กลักษณะรูปพรรณ (แบบ ๑๖) */
    const traits = (label, ...opts) => `<tr><th>${escapeHtml(label)}</th><td>${opts.map(t => `<span class="a5-cbopt">${a5Cb(false, t)}</span>`).join('')}</td></tr>`;
    const warrantBody = (isAfter) => `
      <div class="a5-warrant-top">
        <span class="a5-circle"></span>
        <span>(๔๗ ทวิ)</span>
        <span class="a5-box-inline">${isAfter ? 'เหตุเกิด ๓๐ เม.ย. ๕๙ เป็นต้นไป' : 'กรณีเหตุเกิดก่อน ๓๐ เม.ย. ๕๙'}</span>
        <span class="a5-right-note">สำหรับศาลใช้</span>
      </div>
      <p class="a5-warrant-title">หมายจับ</p>
      <div class="a5-court-crest"><img class="a5-garuda" src="${A5_GARUDA_IMG}" alt="ตราครุฑ" width="54" height="58"></div>
      <p class="a5-right">ที่ ${a5Us(w.warrantNo || '', 130)}/๒๕${a5Us('', 50)}</p>
      <h3 class="a5-center a5-king">ในพระปรมาภิไธยพระมหากษัตริย์</h3>
      <p class="a5-right"><b>ศาล</b> ${a5Us(court, 280)}</p>
      <p class="a5-right">วันที่ ${a5Us('', 60)} เดือน ${a5Us('', 130)} พุทธศักราช ๒๕${a5Us('', 50)}</p>
      <p class="a5-center"><b>ความอาญา</b></p>
      <p class="a5-right">คณะกรรมการ ป.ป.ท. โดย นาย/นาง/นางสาว ${a5Us(inv, 200)} พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. <b>ผู้ร้อง</b></p>
      ${row('หมายถึง', a5Us('ผู้บัญชาการตำรวจแห่งชาติ , คณะกรรมการ ป.ป.ท.', 420))}
      ${row('ด้วย', a5Us(accused, 450))}
      ${row('ซึ่งต้องหาว่ากระทำความผิดฐาน', a5Us(allegations, 380))}
      <p>กรณีมีหลักฐานตามสมควรว่า* ชื่อ-สกุล ผู้ถูกกล่าวหา ${a5Us(accused, 330)}</p>
      <div class="a5-cbline a5-indent">${a5Cb(true, '๑. ได้หรือน่าจะได้กระทำความผิดอาญาซึ่งมีอัตราโทษจำคุกอย่างสูงเกินสามปี')}</div>
      <div class="a5-cbline a5-indent">${a5Cb(true, '๒. ได้หรือน่าจะได้กระทำความผิดอาญาและมีเหตุอันควรเชื่อว่า')}</div>
      <div class="a5-cbline a5-indent2">${a5Cb(true, '๒.๑ จะหลบหนี')}</div>
      <div class="a5-cbline a5-indent2">${a5Cb(false, '๒.๒ จะไปยุ่งเหยิงกับพยานหลักฐาน')}</div>
      <div class="a5-cbline a5-indent2">${a5Cb(false, '๒.๓ ก่อเหตุอันตรายประการอื่น')}</div>
      <div class="a5-cbline a5-indent">${a5Cb(false, '๓. อื่นๆ')} ${a5Us('', 380)}</div>
      <p class="a5-indent">เพราะฉะนั้นให้ท่านจับตัว* ชื่อ-สกุล ผู้ถูกกล่าวหา ${a5Us(accused, 300)}</p>
      ${row('เลขประจำตัวประชาชน', a5Us('', 200), '<span class="a5-ulabel">เชื้อชาติ</span>', a5Us('', 150))}
      ${row('สัญชาติ', a5Us('', 130), '<span class="a5-ulabel">อาชีพ</span>', a5Us('', 130), '<span class="a5-ulabel">อยู่บ้านเลขที่</span>', a5Us('', 110), '<span class="a5-ulabel">หมู่ที่</span>', a5Us('', 70))}
      ${row('ถนน', a5Us('', 140), '<span class="a5-ulabel">ตรอก/ซอย</span>', a5Us('', 140), '<span class="a5-ulabel">ใกล้เคียง</span>', a5Us('', 140))}
      ${row('ตำบล/แขวง', a5Us('', 150), '<span class="a5-ulabel">อำเภอ/เขต</span>', a5Us('', 150), '<span class="a5-ulabel">จังหวัด</span>', a5Us('', 150))}
      ${row('โทรศัพท์', a5Us('', 150), '<span class="a5-ulabel">ไปส่งที่</span>', a5Us(prosecutor || 'สำนักงานอัยการพิเศษฝ่าย', 280))}
      <p>ภายในอายุความ ${a5Us(i.prelim?.limitation?.longYears || '', 70)} ปี นับแต่วันที่ ${a5Us('', 70)} เดือน ${a5Us('', 120)} พ.ศ. ๒๕${a5Us('', 50)} เพื่อจะได้ดำเนินการตามกฎหมาย แต่ไม่เกินวันที่ ${a5Us('', 70)} เดือน ${a5Us('', 120)} พ.ศ. ๒๕${a5Us('', 50)}</p>
      <div class="a5-sign">${a5SignCol('', 'ผู้พิพากษา', '')}</div>
      <p class="a5-right a5-hint">(พลิก)</p>
      <div class="a5-note">
        ${isAfter
        ? `<p><b>หมายเหตุ :</b> * ผู้ถูกกล่าวหาได้หลบหนีไปเมื่อวันที่ ${a5F('', 180)} ในระหว่างถูกดำเนินคดี จึงมิให้นับระยะเวลาที่ผู้ต้องหาหลบหนีรวมเป็นส่วนหนึ่งของอายุความ ตามมาตรา ๖๑/๑ แห่ง พ.ร.บ. มาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม</p>`
        : `<p><b>หมายเหตุ :</b> * ให้ระบุชื่อตัว ชื่อสกุล และแนบตำหนิรูปพรรณของบุคคลที่จะถูกจับ เท่าที่ทราบไปพร้อมกับหมายนี้ด้วย</p>
           <p class="a5-indent">* เป็นการจับตัวเพื่อนำส่งพนักงานอัยการ เพื่อฟ้องคดีต่อศาล</p>`}
      </div>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <p class="a5-center"><b>บันทึก</b></p>
      <p class="a5-center">วันที่ ${a5F('', 110)} เดือน ${a5F('', 150)} พ.ศ. ๒๕${a5F('', 80)}</p>
      <p>เจ้าพนักงานผู้จัดการตามหมายได้แจ้งข้อความในหมายให้แก่ผู้เกี่ยวข้องทราบและได้ส่งหมายให้ตรวจดูแล้ว</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', 'เจ้าพนักงานผู้จัดการตามหมาย', '')}</div>
      <p class="a5-indent">ข้าพเจ้าผู้มีชื่อข้างท้ายนี้ได้รับทราบข้อความในหมาย และได้ตรวจดูหมายแล้ว</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', 'ผู้รับทราบ', '')}</div>
      <p class="a5-center a5-warn-h"><b>คำเตือน</b></p>
      <p class="a5-indent2">เจ้าพนักงานผู้จัดการตามหมายพึงปฏิบัติตามกฎหมาย และต้องแจ้งข้อกล่าวหาให้ผู้ถูกจับทราบ แสดงหมายจับต่อผู้ถูกจับ พร้อมทั้งแจ้งให้ผู้ถูกจับทราบถึงสิทธิตามประมวลกฎหมายวิธีพิจารณาความอาญา มาตรา ๘</p>`;

    return `<section class="a5-paper">
      ${/* ---- แบบ ปปท. ๑๑ คำร้องขอหมายจับ (๓ หน้า) ---- */ ''}
      <div class="a5-court-crest"><img class="a5-garuda" src="${A5_GARUDA_IMG}" alt="ตราครุฑ" width="54" height="58"></div>
      <div class="a5-court-caption"><p>( คำร้อง )</p><p>ขอหมายจับ</p></div>
      <p class="a5-right">ที่ ${a5Us('', 130)}/${a5Us('', 90)}</p>
      <p class="a5-req-mark">รับคำร้อง</p>
      <p class="a5-req-mark">เรียกสอบ</p>
      <div class="a5-line"><span>${a5Us('', 190)} ผู้พิพากษา</span><span class="a5-grow"></span><b>ศาล</b> ${a5Us(court, 260)}</div>
      <p class="a5-right">วันที่ ${a5Us('', 60)} เดือน ${a5Us('', 130)} พุทธศักราช ๒๕${a5Us('', 50)}</p>
      <p class="a5-center"><b>ความอาญา</b></p>
      <p class="a5-right">คณะกรรมการ ป.ป.ท. โดย นาย/นาง/นางสาว ${a5Us(inv, 190)} พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. <b>ผู้ร้อง</b></p>
      ${row('ข้าพเจ้า', a5Us(inv, 230), '<span class="a5-ulabel">ตำแหน่ง</span>', a5Us('พนักงาน ป.ป.ท.', 190))}
      ${row('อายุ', a5Us('', 90), '<span class="a5-ulabel">ปี อาชีพ</span>', a5Us('รับราชการ', 120), '<span class="a5-ulabel">สถานที่ทำงาน</span>', a5Us('สำนักงาน ป.ป.ท.', 170))}
      ${row('แขวง/ตำบล', a5Us('คลองเกลือ', 140), '<span class="a5-ulabel">เขต/อำเภอ</span>', a5Us('ปากเกร็ด', 140), '<span class="a5-ulabel">จังหวัด</span>', a5Us('นนทบุรี', 130))}
      ${row('โทรศัพท์', a5Us('', 180))}
      <p>ขอยื่นคำร้องขอออกหมายจับต่อศาล ดังมีข้อความที่จะกล่าวต่อไปนี้</p>
      <p class="a5-indent"><b>ข้อ ๑.</b> ด้วย ${a5Cb(true, '')}พนักงานอัยการ สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5Us(prosecutor, 200)} ได้ขอให้ พนักงาน ป.ป.ท./อนุกรรมการและเลขานุการ ขอศาล${A5_COURT} ${a5Us('', 180)} ขออนุมัติหมายจับ ${a5Us(accused, 230)} เลขประจำตัวประชาชน ${a5Us('', 190)}</p>
      <p class="a5-indent2">${a5Cb(true, '')}ปรากฏจากรายงานการไต่สวนและวินิจฉัยชี้มูลของ คณะกรรมการ ป.ป.ท. ว่า นาย/นาง/นางสาว ${a5Us(accused, 250)} ผู้ถูกกล่าวหา</p>
      ${row('อายุ', a5Us('', 90), '<span class="a5-ulabel">ปี เชื้อชาติ</span>', a5Us('', 120), '<span class="a5-ulabel">สัญชาติ</span>', a5Us('', 120), '<span class="a5-ulabel">อาชีพ</span>', a5Us('', 110))}
      ${row('อยู่บ้านเลขที่', a5Us('', 130), '<span class="a5-ulabel">หมู่ที่</span>', a5Us('', 90), '<span class="a5-ulabel">ถนน</span>', a5Us('', 130))}
      ${row('ตรอก/ซอย', a5Us('', 130), '<span class="a5-ulabel">ใกล้เคียง</span>', a5Us('', 130), '<span class="a5-ulabel">ตำบล/แขวง</span>', a5Us('', 130))}
      ${row('อำเภอ/เขต', a5Us('', 140), '<span class="a5-ulabel">จังหวัด</span>', a5Us('', 140), '<span class="a5-ulabel">โทรศัพท์</span>', a5Us('', 130))}
      <p>ซึ่งมีตำหนิรูปพรรณตามที่แนบมาพร้อมนี้</p>
      <div class="a5-cbline a5-indent">${a5Cb(true, 'ได้หรือน่าจะได้กระทำความผิดอาญาร้ายแรงซึ่งมีอัตราโทษจำคุกอย่างสูงเกิน ๓ ปี')}</div>
      <div class="a5-cbline a5-indent">${a5Cb(true, 'ได้หรือน่าจะได้กระทำความผิดอาญา และน่าจะหลบหนีหรือจะไปยุ่งเหยิงกับพยานหลักฐานหรือก่ออันตรายประการอื่น')}</div>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      ${row('เหตุเกิดที่', a5Us(i.prelim?.place || '', 430))}
      <p>เมื่อวันที่ ${a5Us('', 90)} เดือน ${a5Us('', 130)} พุทธศักราช ${a5Us('', 90)} เวลา ${a5Us('', 90)} น.</p>
      <p>มีพฤติการณ์กระทำความผิดที่เกี่ยวกับเหตุออกหมายจับ กล่าวคือ</p>
      <p class="a5-indent2">ตามวันเวลาเกิดเหตุ ชื่อ-สกุล สถานะ ตำแหน่ง อำนาจหน้าที่ผู้ถูกกล่าวหา ${a5F(accused, 280)}</p>
      <p class="a5-indent2">พิจารณาพยานหลักฐานจากการไต่สวน ทั้งพยานบุคคลและพยานเอกสารรับฟังได้ความว่า เมื่อวันที่ ${a5F(q.summary || '', 330)}</p>
      <div class="a5-line">${a5F('', 640)}</div>
      <p class="a5-indent2">การกระทำดังกล่าวข้างต้นของผู้ถูกกล่าวหา เป็นเหตุทำให้ (ความเสียหาย) ${a5F(i.prelim?.issues?.damage || '', 300)}</p>
      <p class="a5-indent2">ดังนั้น การกระทำของผู้ถูกกล่าวหา จึงเป็นการกระทำทุจริตในภาครัฐอันเป็นความผิดตามประมวลกฎหมายอาญา/กฎหมายอื่น ๆ ${a5F(allegations, 280)}</p>
      <p class="a5-indent2">คณะอนุกรรมการไต่สวน/คณะพนักงานไต่สวน ได้แจ้งคำสั่งคณะกรรมการ ป.ป.ท. ที่ ${a5F(m.orderNo || '', 170)} ลงวันที่ ${a5F(a5DateShort(m.orderDate), 150)} เรื่องแต่งตั้งคณะอนุกรรมการไต่สวน/คณะพนักงานไต่สวน กรณีเจ้าหน้าที่ของรัฐกระทำทุจริตในภาครัฐ และสิทธิคัดค้านให้ผู้ถูกกล่าวหาทราบแล้วและได้รวบรวมพยานหลักฐานที่เกี่ยวข้องของผู้ถูกกล่าวหาแล้ว และได้แจ้งข้อกล่าวหาแก่ผู้ถูกกล่าวหา โดยวิธีส่งบันทึกแจ้งข้อกล่าวหาทางไปรษณีย์ ตามหนังสือสำนักงาน ป.ป.ท. ลับ ที่ ${a5F('', 140)} ลงวันที่ ${a5F(a5DateShort(q.noticeSentAt), 140)} พร้อมบันทึกการแจ้งข้อกล่าวหา ฉบับลงวันที่ ${a5F(a5DateShort(q.noticeSentAt), 140)} ส่งไปยัง ณ ภูมิลำเนาของผู้ถูกกล่าวหา ตามหลักฐานทางทะเบียนราษฎร ณ บ้านเลขที่ ${a5F('', 170)} ซึ่งผู้ถูกกล่าวหาได้รับทราบข้อกล่าวหาแล้ว ต่อมาได้มีหนังสือชี้แจงแก้ข้อกล่าวหา ฉบับลงวันที่ ${a5F('', 150)}</p>
      <p class="a5-indent2">ต่อมา คณะกรรมการ ป.ป.ท. ได้มีมติการประชุม ครั้งที่ ${a5F(mc.mtiNo || '', 130)} ลงวันที่ ${a5F(a5DateShort(mc.mtiDate), 140)} ระเบียบวาระที่ ${a5F('', 110)} คณะกรรมการ ป.ป.ท. ได้มีมติวินิจฉัยชี้มูลความผิดทางอาญาและวินัยแก่ ${a5F(accused, 230)} (ชื่อ-สกุล ผู้ถูกกล่าวหา) ดังนี้</p>
      <p class="a5-indent2">ประเด็นที่ ๑ ผู้ถูกกล่าวหา เป็นความผิดตามประมวลกฎหมายอาญา/กฎหมายอื่น ๆ ${a5F(allegations, 260)} (ให้แยกประเด็นละมาตรา)</p>
      <p class="a5-indent2">เมื่อวันที่ ${a5F(a5DateShort(o.disciplineSentAt || mc.mtiDate), 150)} คณะกรรมการ ป.ป.ท. ได้ส่งรายงานการไต่สวน พร้อมด้วยเอกสารประกอบเรื่องกล่าวหา เรื่องที่ ${a5F(c.id || '', 140)} ไปยังอธิบดีอัยการ สำนักงานคดีปราบปรามการทุจริต ${a5F(prosecutor, 170)} โดยขอให้พิจารณาคดีอาญาแก่ ${a5F(accused, 210)} (ชื่อ-สกุล ผู้ถูกกล่าวหา) ตามหนังสือสำนักงาน ป.ป.ท. ลับ ที่ ปป ๐๐../${a5F('', 120)} ลงวันที่ ${a5F('', 140)}</p>
      <p class="a5-indent2">เมื่อวันที่ ${a5F('', 140)} พนักงานอัยการ สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 170)} ได้มีหนังสือแจ้งว่าได้มีคำสั่งฟ้อง ${a5F(accused, 210)} ในความผิดตามประมวลกฎหมายอาญา/กฎหมายอื่น ๆ ${a5F(allegations, 220)} โดยให้ส่งตัวผู้ถูกกล่าวหาไปยังสำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 160)} เพื่อฟ้องต่อศาล${A5_COURT} ${a5F('', 140)} ในวันที่ ${a5F('', 140)} เวลา ${a5F('', 90)} นาฬิกา ตามหนังสือ สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F('', 150)} ที่ ${a5F('', 120)} ลงวันที่ ${a5F('', 140)}</p>
      <p class="a5-indent2">สำนักงาน ป.ป.ท. มีหนังสือ ลับ ที่ ปป ๐๐../${a5F('', 120)} ลงวันที่ ${a5F('', 140)} ถึงผู้ถูกกล่าวหาแจ้งให้ไปพบพนักงานอัยการที่สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 160)} ในวันที่ ${a5F('', 140)} เวลา ${a5F('', 90)} นาฬิกา โดยได้ส่งหนังสือดังกล่าวไปยังภูมิลำเนาตามทะเบียนราษฎรของผู้ถูกกล่าวหา ณ บ้านเลขที่ ${a5F('', 170)} ด้วยวิธีการส่งไปรษณีย์ด่วนพิเศษในประเทศ (EMS) ซึ่งผู้ถูกกล่าวหาได้รับทราบแล้ว ปรากฏตามไปรษณีย์ตอบรับ ${a5F(state.documentData?.dispatchEms || '', 190)}</p>
      <p class="a5-indent2">ต่อมาพนักงานอัยการ สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 160)} แจ้งว่า ผู้ถูกกล่าวหาไม่ได้ไปพบพนักงานอัยการเพื่อยื่นฟ้องต่อศาล${A5_COURT} ${a5F('', 140)} ในวันที่ ${a5F('', 140)} เวลา ${a5F('', 90)} นาฬิกา ตามกำหนดนัดข้างต้น และไม่แจ้งเหตุขัดข้องให้ทราบและ</p>
      ${a5Foot()}${A5_PG}${a5PgNo(3)}
      <p>ไม่สามารถติดต่อด้วยวิธีอื่นใดได้ กรณีมีพฤติการณ์หลบหนีและเพื่อมิให้เสียหายแก่คดี จึงขอให้พนักงาน ป.ป.ท./อนุกรรมการและเลขานุการคณะอนุกรรมการไต่สวนดำเนินการออกหมายจับ ${a5F(accused, 220)} ต่อศาล${A5_COURT} ${a5F('', 140)} โดยยื่นคำร้องต่อศาลเพื่อขอให้ออกหมายจับ ${a5F(accused, 220)} เนื่องจากผู้ถูกกล่าวหา ได้หรือน่าจะได้กระทำความผิดอาญาตามประมวลกฎหมายอาญา/กฎหมายอื่น ๆ ซึ่งมีอัตราโทษ ${a5F('', 170)} และมีพฤติการณ์หลบหนี จึงมีเหตุที่จะออกหมายจับได้ ตามประมวลกฎหมายวิธีพิจารณาความอาญา มาตรา ๖๖ (๒) ตามหนังสือสำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F('', 150)} ที่ ${a5F('', 120)} ลงวันที่ ${a5F('', 140)}</p>
      <p class="a5-indent2">เป็นการกระทำความผิดฐาน ${a5F(allegations, 280)} ตามประมวลกฎหมายอาญา/กฎหมายอื่น ๆ มาตรา ${a5F('', 170)} รายละเอียดข้อมูลและพยานหลักฐาน ปรากฏตามเอกสารที่แนบมาพร้อมนี้</p>
      <p class="a5-indent2">อนึ่ง คดีดังกล่าวเหตุเกิดขึ้นหลังวันที่ ๓๐ เมษายน ๒๕๕๙ โดยผู้ถูกกล่าวหาได้หลบหนีไป เมื่อวันที่ ${a5F('', 180)} ในระหว่างถูกดำเนินคดี จึงมิให้นับระยะเวลาที่ผู้ต้องหาหลบหนีรวมเป็นส่วนหนึ่งของอายุความ ตามมาตรา ๖๑/๑ แห่ง พ.ร.บ. มาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม (ใช้ในกรณีเหตุเกิดขึ้นหลังวันที่ ๓๐ เมษายน ๒๕๕๙)</p>
      <p class="a5-indent"><b>ข้อ ๒.</b> ผู้ร้องประสงค์จะทำการจับกุม ${a5F(accused, 300)}</p>
      <p class="a5-indent2">จึงขอให้ศาลออกหมายจับ ${a5F(accused, 280)} มาดำเนินคดี</p>
      <p class="a5-indent2">ผู้ร้อง ${a5Cb(false, 'เคย')} ${a5Cb(true, 'ไม่เคย')} ร้องขอให้ศาล ${a5F(A5_COURT, 220)} ออกหมายจับบุคคลดังกล่าว โดยอาศัยเหตุแห่งการร้องขอเดียวกันนี้ หรือเหตุอื่น (ระบุ) ${a5F('', 180)}</p>
      <p class="a5-indent2">และศาลมีคำสั่ง ${a5F(w.note || '', 380)}</p>
      <p class="a5-center">ควรมิควรแล้วแต่จะโปรด</p>
      <div class="a5-sign a5-sign-stack">
        ${a5SignCol(inv, 'พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. ผู้ร้อง', 'ลงชื่อ')}
        ${a5SignCol(inv, 'พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. ผู้เรียง/พิมพ์', 'ลงชื่อ')}
      </div>
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๒ บันทึกคำเบิกความ (๑ หน้า) ---- */ ''}
      <p class="a5-court-title">บันทึกคำเบิกความ</p>
      <p class="a5-right"><b>ศาล</b> ${a5Us(court, 280)}</p>
      <p class="a5-right">วันที่ ${a5Us('', 60)} เดือน ${a5Us('', 130)} พุทธศักราช ๒๕${a5Us('', 50)}</p>
      <p class="a5-center"><b>ความอาญา</b></p>
      <p class="a5-right">คณะกรรมการ ป.ป.ท. โดย นาย/นาง ${a5Us(inv, 200)} พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. <b>ผู้ร้อง</b></p>
      <p class="a5-indent2">พยานได้ปฏิญาณหรือสาบานตนแล้วเบิกความต่อศาล มีสาระสำคัญว่า</p>
      ${row('พยานชื่อ', a5Us(inv, 220), '<span class="a5-ulabel">พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. อายุ</span>', a5Us('', 80), '<span class="a5-ulabel">ปี อาชีพ</span>', a5Us('รับราชการ', 120))}
      ${row('ตั้งบ้านเรือนอยู่เลขที่', a5Us('', 380))}
      <p>เกี่ยวพันกับคดีนี้โดยเป็นผู้ร้องและรู้เห็นในคดีนี้คือ</p>
      <p class="a5-indent2">(เป็นอนุกรรมการและเลขานุการ คณะอนุกรรมการไต่สวน/เป็นพนักงาน ป.ป.ท. เจ้าของสำนวนคดี) โดยเป็นคดีที่คณะกรรมการ ป.ป.ช. ได้มอบหมายให้คณะกรรมการ ป.ป.ท. ดำเนินการแทน ตามมาตรา ๖๒ แห่งพระราชบัญญัติประกอบรัฐธรรมนูญว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๖๑ โดยสำนักงาน ป.ป.ช. ได้ส่งเรื่องมายังสำนักงาน ป.ป.ท. เพื่อดำเนินการตามพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม ซึ่งมีพฤติการณ์แห่งคดี คือ ${a5F(q.summary || '', 280)} (ให้นำพฤติการณ์ที่ระบุในคำร้องขอออกหมายจับมาระบุให้ครบถ้วน)</p>
      <div class="a5-line">${a5F('', 640)}</div>
      <div class="a5-line">${a5F('', 640)}</div>
      <p class="a5-indent2">ต่อมาคณะกรรมการ ป.ป.ท. มีมติชี้มูลความผิด และส่งสำนวนไปยังสำนักงานอัยการคดีพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 170)} พนักงานอัยการมีคำสั่งฟ้องคดี และแจ้งให้สำนักงาน ป.ป.ท. แจ้งให้ผู้ถูกกล่าวหาไปพบพนักงานอัยการ แต่ผู้ถูกกล่าวหาไม่ไปพบพนักงานอัยการตามแจ้ง และพฤติการณ์น่าเชื่อว่า ผู้ถูกกล่าวหาได้กระทำความผิดจริงและหลบหนี รายละเอียดข้อมูลพยานหลักฐานปรากฏตามเอกสารที่แนบมาพร้อมนี้</p>
      <p class="a5-indent2">จึงขอประทานอนุญาตศาล โปรดออกหมายจับผู้ต้องหาตามคำร้อง</p>
      <div class="a5-sign">${a5SignCol(inv, 'พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. พยานผู้ร้อง', 'ลงชื่อ')}</div>
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๓ รายงานกระบวนการพิจารณา (๒ หน้า) ---- */ ''}
      <p class="a5-court-title a5-left">รายงาน<br>กระบวนการ<br>พิจารณา</p>
      <p class="a5-right">คดีหมายเลขดำที่ ${a5Us('', 130)}/ ๒๕${a5Us('', 50)}</p>
      <p class="a5-right">คดีหมายเลขแดงที่ ${a5Us('', 130)}/ ๒๕${a5Us('', 50)}</p>
      <p class="a5-right"><b>ศาล</b> ${a5Us(court, 260)}</p>
      <p class="a5-center">วันที่ ${a5Us('', 60)} เดือน ${a5Us('', 130)} พุทธศักราช ๒๕${a5Us('', 50)}</p>
      <p class="a5-center"><b>ความอาญา</b></p>
      <p class="a5-indent">คณะกรรมการ ป.ป.ท. โดย นาย/นาง/นางสาว ${a5Us(inv, 200)} พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. <b>ผู้ร้อง</b></p>
      <p>ผู้พิพากษาออกนั่งพิจารณาคดีนี้เวลา ${a5Us('', 130)} นาฬิกา</p>
      <p class="a5-indent2">วันนี้ ${a5Us(inv, 190)} พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. ตำแหน่ง ${a5Us('พนักงาน ป.ป.ท.', 170)}</p>
      <p class="a5-right">ได้ยื่นคำร้องขอให้ศาลออกหมายจับ</p>
      <p>สอบพยานผู้ร้องซึ่งเบิกความประกอบพยานหลักฐานที่แนบมาพร้อมคำร้อง ${a5Us('', 120)} ปาก จำนวน ${a5Us('', 120)}</p>
      <p class="a5-indent2">คดีเสร็จสิ้นการไต่สวน ให้รอฟังคำสั่ง</p>
      <p class="a5-right">/อ่านแล้ว</p>
      <div class="a5-sign a5-sign-stack">
        ${a5SignCol('', 'ผู้พิพากษา บันทึก/อ่าน', '')}
        ${a5SignCol(inv, 'พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท. ผู้ร้อง', '')}
      </div>
      <p class="a5-center a5-order-h"><b>คำสั่ง</b></p>
      <p class="a5-indent2">พิเคราะห์พยานหลักฐานของผู้ร้องแล้วเห็นว่า ${a5F(w.note || '', 320)}</p>
      <div class="a5-line">${a5F('', 640)}</div>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <p class="a5-indent2">กรณีมีพยานหลักฐานตามควรว่า ชื่อ-สกุล ผู้ถูกกล่าวหา ${a5F(accused, 280)}</p>
      <div class="a5-cbline a5-indent">${a5Cb(true, 'ได้หรือน่าจะได้กระทำความผิดอาญาร้ายแรงซึ่งมีอัตราโทษจำคุกอย่างสูงเกิน ๓ ปี')}</div>
      <div class="a5-cbline a5-indent">${a5Cb(false, 'ได้หรือน่าจะได้กระทำความผิดอาญา และน่าจะหลบหนีหรือจะไปยุ่งเหยิงกับพยานหลักฐานหรือก่ออันตรายประการอื่น')}</div>
      <p>จึงอนุญาตให้ออกหมายจับ ${a5F(accused, 280)} ตามขอ</p>
      <p>และเมื่อจัดการตามหมายจับได้แล้ว ให้ส่งบันทึกการจับกุมต่อศาลภายใน ${a5F('', 110)} วัน</p>
      <p class="a5-indent2">ให้ถ่ายสำเนา ${a5F('', 380)}</p>
      <p>เพื่อเก็บไว้กับคำร้องและสำเนาหมาย</p>
      <p class="a5-indent2">ได้อ่านคำสั่งให้ผู้ร้องฟังโดยชอบแล้ว</p>
      <p class="a5-right">/อ่านแล้ว</p>
      <div class="a5-sign">${a5SignCol('', 'ผู้พิพากษา', '')}</div>
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๔ หมายจับ (เหตุเกิดก่อน ๓๐ เม.ย. ๕๙ — อายุความไม่สะดุดหยุดลง) ---- */ ''}
      ${warrantBody(false)}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๕ หมายจับ (เหตุเกิด ๓๐ เม.ย. ๕๙ เป็นต้นไป — อายุความสะดุดหยุดลง) ---- */ ''}
      ${warrantBody(true)}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๖ ตำหนิรูปพรรณผู้กระทำความผิด (๒ หน้า) ---- */ ''}
      <div class="a5-photo-box">ภาพถ่าย<br>ผู้ถูกกล่าวหา<br>จาก ทร.14</div>
      <div class="a5-court-crest"><img class="a5-garuda" src="${A5_GARUDA_IMG}" alt="ตราครุฑ" width="46" height="50"></div>
      <p class="a5-center"><b>สำนักงาน ป.ป.ท.</b></p>
      <p class="a5-center a5-trait-title"><b>ตำหนิรูปพรรณผู้กระทำความผิด</b></p>
      <p class="a5-hint">(เติมข้อความในช่องว่าง และกาเครื่องหมาย ✓ ใน ☐ หน้าข้อความที่ต้องการได้มากกว่าหนึ่งรายการ)</p>
      ${row('ส่วนราชการ กลุ่ม/กอง/สำนัก', a5Us(intake.unit || '', 280), '<span class="a5-ulabel">สำนักงาน ป.ป.ท.</span>')}
      ${row('หมายจับที่', a5Us(w.warrantNo || '', 200), '<span class="a5-ulabel">คดี ป.ป.ท. ที่</span>', a5Us(c.id || '', 190))}
      ${row('วันเดือนปีที่ส่งรายงาน', a5Us(a5DateShort(today), 380))}
      ${row('ความผิดฐาน', a5Us(allegations, 430))}
      ${row('วันเดือนปี เวลา และสถานที่เกิดเหตุ', a5Us(i.prelim?.place || '', 330))}
      ${row('วันขาดอายุความหรือกำหนดล่วงเลยในการลงอาญา', a5Us(a5DateShort(i.prelim?.limitation?.longExpiry) || '', 240))}
      ${row('ชื่อนามสกุล (ภาษาไทย)', a5Us(accused, 250), `<span class="a5-ulabel">เพศ</span>${a5Cb(false, 'ชาย')}${a5Cb(false, 'หญิง')}`)}
      ${row('ชื่อนามสกุล (ภาษาอังกฤษตามหนังสือเดินทาง)', a5Us('', 300))}
      <p class="a5-hint">เลขบัตรประจำตัวประชาชน / บัตรประจำตัวเจ้าหน้าที่ของรัฐ – พนักงานองค์การของรัฐ / ใบสำคัญประจำตัวคนต่างด้าว / หนังสือเดินทาง</p>
      ${row('เลขประจำตัว', a5Us('', 430))}
      ${row('ชื่ออื่น', a5Us('', 230), '<span class="a5-ulabel">ชื่อสกุลอื่น</span>', a5Us('', 230))}
      ${row('วันเดือนปีเกิด', a5Us('', 190), '<span class="a5-ulabel">เชื้อชาติ</span>', a5Us('', 150), '<span class="a5-ulabel">สัญชาติ</span>', a5Us('', 150))}
      ${row('ประวัติ คดี', a5Us(c.id || '', 430))}
      ${row('ชื่อนามสกุลบิดา', a5Us('', 230), '<span class="a5-ulabel">ที่พัก</span>', a5Us('', 230))}
      ${row('ชื่อนามสกุลมารดา', a5Us('', 230), '<span class="a5-ulabel">ที่พัก</span>', a5Us('', 230))}
      ${row('ชื่อนามสกุลสามี/ภรรยา', a5Us('', 220), '<span class="a5-ulabel">ที่พัก</span>', a5Us('', 220))}
      ${row('ญาติ / เพื่อนสนิท', a5Us('', 230), '<span class="a5-ulabel">ที่พัก</span>', a5Us('', 230))}
      ${row('อาชีพ อดีต', a5Us('', 430))}
      ${row('สถานที่ทำงาน', a5Us(c.agency || '', 430))}
      ${row('ที่อยู่ครั้งสุดท้าย', a5Us('', 430))}
      ${row('ภูมิลำเนาเดิม', a5Us('', 430))}
      ${row('แหล่งที่ไปเป็นประจำ', a5Us('', 430))}
      ${row('กลุ่มหรือแกงค์ที่มั่วสุม', a5Us('', 430))}
      ${row('รายชื่อบุคคลในกลุ่ม', a5Us('', 430))}
      ${row('ตำหนิรูปพรรณ สูง', a5Us('', 110), '<span class="a5-ulabel">ซม. น้ำหนัก</span>', a5Us('', 110), '<span class="a5-ulabel">กก. หมู่โลหิต</span>', a5Us('', 110))}
      <table class="a5-tbl a5-trait-tbl"><tbody>
        ${traits('รูปร่าง', 'สูง', 'สันทัด', 'เตี้ย', 'ล่ำสัน', 'อ้วน', 'ผอม', 'อื่น ๆ')}
        ${traits('ผิว', 'ขาว', 'ขาวเหลือง', 'ดำ', 'ดำแดง', 'ตกกระ', 'ละเอียด', 'หยาบ', 'อื่น ๆ')}
        ${traits('รูปหน้า', 'กลม', 'รูปไข่', 'สามเหลี่ยม', 'สี่เหลี่ยม', 'แหลมหลิม', 'อื่น ๆ')}
        ${traits('ผม', 'เป๋', 'แสกกลาง', 'เสย', 'เส้นผมตรง', 'เป็นคลื่น', 'หยิก', 'ผมฟู', 'หนา', 'บาง', 'ดำ', 'ขาว', 'หงอก', 'หงอกประปราย', 'แดง', 'ทอง', 'อื่น ๆ')}
      </tbody></table>
      ${a5Foot()}${A5_PG}${a5PgNo(2)}
      <table class="a5-tbl a5-trait-tbl"><tbody>
        ${traits('ศีรษะ', 'ล้านเถิก', 'ล้านเลี่ยน', 'ล้านครึ่งศีรษะ', 'ล้านง่ามถ่อ', 'อื่น ๆ')}
        ${traits('หน้าผาก', 'กว้าง', 'แคบ', 'โหนก', 'ตรง', 'ลาด', 'สั้น', 'อื่น ๆ')}
        ${traits('คิ้ว', 'หนา', 'บาง', 'ต่อ', 'ห่าง', 'สั้น', 'ชู', 'ดำ', 'ขาว', 'แดง', 'หงอกประปราย', 'อื่น ๆ')}
        ${traits('ตา', 'โต', 'เล็ก', 'ชั้นเดียว', 'สองชั้น', 'โปน', 'ลึก', 'ปรือ', 'หยี', 'เหล่', 'เข', 'เอก', 'ถั่ว', 'อื่น ๆ')}
        ${traits('หู', 'กาง', 'ลีบ', 'กลม', 'สามเหลี่ยม', 'สี่เหลี่ยม', 'กะหล่ำปลี', 'ติ่งหูเหลี่ยม', 'ติ่งหูราบ', 'ติ่งหูย้อย', 'อื่น ๆ')}
        ${traits('จมูก', 'ดั้งจมูกราบ', 'ดั้งจมูกโด่ง', 'ดั้งจมูกลึก', 'สันจมูกตรง', 'สันจมูกโค้ง', 'สันจมูกเหลี่ยม', 'สันจมูกสั้น', 'จมูกกว้าง', 'จมูกแคบ', 'จมูกเชิด', 'จมูกงุ้ม', 'อื่น ๆ')}
        ${traits('ปาก', 'หนา', 'บาง', 'กว้าง', 'แคบ', 'รูปกระจับ', 'บนยื่น', 'ล่างยื่น', 'ไม่มีร่องปาก', 'อื่น ๆ')}
        ${traits('ฟัน', 'ใหญ่', 'เล็ก', 'เรียบ', 'เก', 'ห่าง', 'ยื่น', 'หลอ', 'ขาว', 'เหลือง', 'ดำ', 'เลี่ยม', 'อื่น ๆ')}
        ${traits('คาง', 'ตรง', 'สั้น', 'ยื่น', 'ป้าน', 'บุ๋ม', 'เหลี่ยม', 'อื่น ๆ')}
        ${traits('หนวดและเครา', 'หนา', 'บาง', 'เล็กเรียว', 'ยาว', 'สั้น', 'ปลายงอน', 'สีดำ', 'แดง', 'หงอกขาว', 'หงอกประปราย', 'อื่น ๆ')}
        ${traits('สำเนียง', 'ภาคกลาง', 'ภาคเหนือ', 'ภาคตะวันออกเฉียงเหนือ', 'ภาคตะวันออก', 'ภาคตะวันตก', 'ภาคใต้', 'จีน', 'อื่น ๆ')}
        ${traits('เสียง', 'ดัง', 'ค่อย', 'แหบ', 'แหลม', 'ทุ้ม', 'อื่น ๆ')}
        ${traits('ตำหนิ', 'ไฝ', 'ปาน', 'แผลเป็น', 'อื่น ๆ')}
      </tbody></table>
      ${row('สี ขนาด ตำแหน่ง', a5Us('', 430))}
      ${row('ลายสัก', a5Us('', 450))}
      ${row('รูป สี ตำแหน่ง', a5Us('', 440))}
      ${row('ลักษณะพิการ', a5Us('', 450))}
      ${row('ลักษณะอันน่าสังเกต', a5Us('', 440))}
      <div class="a5-sign a5-sign-center">${a5SignCol(inv, 'พนักงาน ป.ป.ท./เจ้าหน้าที่ ป.ป.ท.', '(ลงชื่อ)', 'ตำแหน่ง')}</div>
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๗ หนังสือแจ้งผลการดำเนินการ กรณีออกหมายจับแล้ว ---- */ ''}
      ${a5LetterHdr('ตัวอย่างหนังสือแจ้งผลดำเนินการ กรณีออกหมายจับแล้ว', c.id, today)}
      <div class="a5-line"><b>เรื่อง</b> แจ้งผลการดำเนินการเพื่อให้ได้ตัวผู้ถูกกล่าวหา</div>
      <div class="a5-line"><b>เรียน</b> อัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 260)}</div>
      <div class="a5-line"><b>อ้างถึง</b> หนังสือสำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F('', 230)}</div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> ๑. สำเนาหมายจับศาล${A5_COURT} ${a5F('', 190)}</div>
      <div class="a5-line a5-indent3">ที่ ${a5F(w.warrantNo || '', 150)} ลงวันที่ ${a5F('', 150)} จำนวน ${a5F('', 80)} แผ่น</div>
      <div class="a5-line a5-indent3">๒. สำเนาตำหนิรูปพรรณผู้ถูกกล่าวหา จำนวน ${a5F('', 90)} แผ่น</div>
      <div class="a5-line a5-indent3">๓. สำเนารายการข้อมูลทะเบียนราษฎรของผู้ถูกกล่าวหา จำนวน ${a5F('', 90)} แผ่น</div>
      <p class="a5-indent2">ตามหนังสือที่อ้างถึง สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 170)} แจ้งว่า ${a5F(accused, 200)} (ชื่อ-สกุล ผู้ถูกกล่าวหา) มิได้ไปพบพนักงานอัยการตามกำหนดนัด โดยไม่ได้แจ้งเหตุผลให้ทราบ จึงไม่อาจยื่นฟ้องได้ และเห็นว่าผู้ถูกกล่าวหามีพฤติการณ์หลบหนี จึงขอให้สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.) ดำเนินการขอออกหมายจับผู้ถูกกล่าวหาดังกล่าวต่อศาลอาญาทุจริตและประพฤติมิชอบ ${a5F('', 150)} ความละเอียดแจ้งแล้ว นั้น</p>
      <p class="a5-indent2">สำนักงาน ป.ป.ท. ขอเรียนว่า ศาล${A5_COURT} ${a5F('', 150)} ได้ออกหมายจับ ${a5F(accused, 200)} (ชื่อ-สกุล ผู้ถูกกล่าวหา) ตามหมายจับที่ ${a5F(w.warrantNo || '', 160)} ลงวันที่ ${a5F('', 150)} เป็นที่เรียบร้อยแล้ว รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย และจะได้เร่งรัดติดตามจับและควบคุมตัวผู้ถูกกล่าวหา เพื่อนำตัวส่งไปยังพนักงานอัยการเพื่อดำเนินคดีต่อไป ทั้งนี้หากผู้ถูกกล่าวหาไปพบพนักงานอัยการภายหลังศาลออกหมายจับขอโปรดแจ้งให้ทราบด้วย เพื่อจักได้ดำเนินการในส่วนที่เกี่ยวข้อง</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดทราบ</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', SEC_GEN, 'ขอแสดงความนับถือ', 'หรือผู้ที่ได้รับมอบหมาย')}</div>
      ${a5LetterFoot(intake.unit, inv)}
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๘ หนังสือแจ้งผู้บัญชาการตำรวจแห่งชาติ ---- */ ''}
      ${a5LetterHdr('ตัวอย่างหนังสือแจ้งผู้บัญชาการตำรวจแห่งชาติให้ดำเนินการจับกุมผู้ถูกกล่าวหาตามหมายศาล', c.id, today)}
      <div class="a5-line"><b>เรื่อง</b> ขอให้ดำเนินการจับกุมผู้ถูกกล่าวหาตามหมายจับ</div>
      <div class="a5-line"><b>เรียน</b> ผู้บัญชาการตำรวจแห่งชาติ</div>
      <div class="a5-line"><b>สิ่งที่ส่งมาด้วย</b> สำเนาหมายจับและตำหนิรูปพรรณผู้กระทำผิด จำนวน ${a5F('', 90)} แผ่น</div>
      <p class="a5-indent2">ด้วยศาล${A5_COURT} ${a5F('', 150)} ได้ออกหมายจับ ${a5F(accused, 210)} (ชื่อ-สกุล ผู้ถูกกล่าวหา) บัตรประจำตัวประชาชนเลขที่ ${a5F('', 180)} ตามหมายจับที่ ${a5F(w.warrantNo || '', 140)} ลงวันที่ ${a5F('', 150)} ซึ่งต้องหาว่ากระทำความผิดฐาน ${a5F(allegations, 200)} โดยในการดำเนินการจับกุมนั้น คณะกรรมการ ป.ป.ท. ได้มีมติมอบหมายให้เจ้าพนักงานตำรวจดำเนินการจับกุมผู้ถูกกล่าวหาตามหมายจับดังกล่าว เพื่อดำเนินการให้เป็นไปตามพระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการสืบจับตามหน้าที่และอำนาจต่อไป ผลเป็นประการใดโปรดแจ้งให้ทราบด้วย จักขอบคุณมาก</p>
      <div class="a5-sign a5-sign-center">${a5SignCol('', SEC_GEN, 'ขอแสดงความนับถือ', 'ผู้ที่ได้รับมอบหมาย')}</div>
      ${a5LetterFoot(intake.unit, inv)}
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๑๙ บันทึกข้อความส่งหมายจับให้ กอท. ---- */ ''}
      ${a5MemoHdr()}
      ${a5MemoMeta(intake.unit, c.id, today)}
      <div class="a5-line a5-memo-row"><b>เรื่อง</b> ขอส่งสำเนาหมายจับผู้ถูกกล่าวหา ${a5F(accused, 400)}</div>
      <div class="a5-line"><b>เรียน</b> ผอ. กอท.</div>
      <p class="a5-indent2">ด้วยคณะกรรมการ ป.ป.ท. ได้ชี้มูลความผิดคดีเรื่องที่ ${a5F(c.id || '', 190)} และเรื่องที่ ${a5F('', 190)} กรณีกล่าวหา ${a5F(accused, 230)} ว่ากระทำทุจริตในภาครัฐ และสำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต ${a5F(prosecutor, 150)} มีความเห็นสั่งฟ้องคดีต่อศาล แต่เนื่องจากผู้ถูกกล่าวหาไม่ไปพบพนักงานอัยการตามกำหนดนัด และแจ้งให้สำนักงาน ป.ป.ท. เป็นผู้ดำเนินการร้องขอต่อศาลให้ออกหมายจับ</p>
      <p class="a5-indent2">บัดนี้ ผู้รับผิดชอบ ได้ยื่นคำร้องขอหมายจับผู้ถูกกล่าวหาดังกล่าว และศาล${A5_COURT} ${a5F('', 140)} ได้อนุมัติหมายจับที่ ${a5F(w.warrantNo || '', 120)}/${a5F('', 80)} ลงวันที่ ${a5F('', 160)} จึงขอส่งสำเนาหมายจับและสำเนาเอกสารหลักฐานที่เกี่ยวข้อง พร้อมรับรองสำเนาถูกต้อง ดังนี้</p>
      <p class="a5-indent2">๑. สำเนาหมายจับศาล${A5_COURT} ${a5F('', 140)} ที่ ${a5F(w.warrantNo || '', 110)}/${a5F('', 80)} ลงวันที่ ${a5F('', 150)}</p>
      <p class="a5-indent2">๒. สำเนาตำหนิรูปพรรณผู้ถูกกล่าวหา</p>
      <p class="a5-indent2">๓. สำเนารายการข้อมูลทะเบียนราษฎรของผู้ถูกกล่าวหา</p>
      <p class="a5-indent2">๔. สำเนาหนังสือแจ้งสำนักงานตำรวจแห่งชาติ</p>
      <p>มายังท่าน เพื่อดำเนินการในส่วนที่เกี่ยวข้องต่อไป รายละเอียดปรากฏตามเอกสารที่แนบมาพร้อมนี้</p>
      <p class="a5-indent2">จึงเรียนมาเพื่อพิจารณา</p>
      <div class="a5-sign">${a5SignCol('', 'ผอ. กอท.', '')}</div>
      ${a5Foot()}

      ${A5_PG}
      ${/* ---- แบบ ปปท. ๒๐ ผนึกซองขอหมายจับ (หน้าซอง) ---- */ ''}
      <div class="a5-envelope">
        <p><b>เรื่อง</b> ขอหมายจับ</p>
        <p><b>เรียน</b> อธิบดีผู้พิพากษาศาล${A5_COURT} ${a5F('', 150)}</p>
        <p class="a5-env-gap">สำนัก/กอง ${a5F(intake.unit || '', 200)}</p>
        <p>สำนักงาน ป.ป.ท.</p>
        <p>คดีอาญา เลขดำ ป.ป.ท. ที่ ${a5F(c.id || '', 150)}/${a5F('', 90)}</p>
        <p>ข้อหา “ฐาน ${a5F(allegations, 480)}</p>
        <div class="a5-line">${a5F('', 560)}</div>
        <p>${a5F('', 300)}”</p>
        <p>จำนวน ๑ หมาย</p>
        <p>อายุความ ${a5F(i.prelim?.limitation?.longYears || '', 80)} ปี (วันขาดอายุความ วันที่ ${a5F(a5DateShort(i.prelim?.limitation?.longExpiry) || '', 190)})</p>
        <p class="a5-env-gap">นาย/นาง/นางสาว ${a5F(inv, 280)} ผู้ร้อง</p>
        <p>โทร. ${a5F('', 220)}</p>
      </div>
      <p class="a5-form-code">${escapeHtml(`${A5_FORMS.p11.code} – ${A5_FORMS.p20.code}`)}</p>
    </section>`;
  }

  /* ===== แบบตรวจสอบข้อเท็จจริง ม.๕๘/๒ – ๕๘/๓ (คงโครงสร้างเดิม ปรับหัวกระดาษ/ช่องกรอกให้ตรงแนวแบบพิมพ์) ===== */
  function paperSpecial58(state) {
    const c = state.caseData || {}, s = state.inquiry?.special || {};
    return `<section class="a5-paper">
      ${a5MemoHdr()}
      ${a5MemoMeta(s.agency || '', c.id, s.reportedAt || todayISO())}
      <div class="a5-line a5-memo-row"><b>เรื่อง</b> รายงานผลการตรวจสอบข้อเท็จจริง (มาตรา ๕๘/๒ – ๕๘/๓) เรื่องที่ ${a5F(c.id || '', 160)}</div>
      <div class="a5-line"><b>เรียน</b> เลขาธิการคณะกรรมการ ป.ป.ท.</div>
      <div class="a5-line"><b>เรื่องที่ร้องเรียน</b> ${a5F(state.documentData?.documentSubject || c.subject || '', 440)}</div>
      <div class="a5-line"><b>ผู้ตรวจสอบ</b> ${a5F(s.assignee || '', 220)} <b>หน่วยงานที่แจ้ง</b> ${a5F(s.agency || '', 220)}</div>
      <p class="a5-num-h a5-indent"><b>๑. ผลการตรวจสอบข้อเท็จจริง</b></p>
      <div class="a5-line a5-indent2">${a5F(s.result || '', 600)}</div>
      <div class="a5-line a5-indent2">${a5F('', 600)}</div>
      <p class="a5-num-h a5-indent"><b>๒. การแจ้งหน่วยงานแก้ไขและประกาศสาธารณะ</b></p>
      <p class="a5-indent2">หน่วยงานที่เกี่ยวข้องรับไปดำเนินการแก้ไขตามข้อเสนอแนะ ${a5F(s.note || '', 320)}</p>
      <div class="a5-cbline a5-indent2">${a5Cb(Boolean(s.publicNotice), 'ประกาศให้ประชาชนทราบแล้ว')} ${a5F(typeof s.publicNotice === 'string' ? s.publicNotice : '', 260)}</div>
      <p class="a5-num-h a5-indent"><b>๓. ข้อเสนอ</b></p>
      <p class="a5-indent2">จึงเรียนมาเพื่อโปรดพิจารณา</p>
      <div class="a5-sign">${a5SignCol(s.assignee || '', 'ผู้ตรวจสอบข้อเท็จจริง')}</div>
      <p class="a5-form-code">๕๘/๒-๕๘/๓</p>
    </section>`;
  }

  /* ---------- รายการสำนวน ---------- */
  const A5_MENU = Object.freeze({
    all: 'รายการสำนวนคดี',
    prelim: 'ไต่สวนเบื้องต้น (213)',
    inquiry: 'ไต่สวนชี้มูล (644)',
    review: 'รอความเห็นตามลำดับชั้น',
    committee: 'เรื่องเสนอ คกก.',
    ext: 'รออนุมัติขยายเวลา',
    due: 'ใกล้ครบกำหนด',
    fast: 'ใบด่วน/เร่งด่วน',
    m62: 'คดีรับจาก ป.ป.ช.',
    '582': 'ตรวจสอบข้อเท็จจริง 58/2'
  });
  function a5qFilter(c, a5q) {
    const i = c.inquiry || {}, w = c.workflow || {}, st = w.stage || '';
    const dl = currentDeadline(c), tone = dl ? deadlineTone(dl) : null;
    switch (a5q) {
      case 'prelim': return ['a5-prelim', 'a5-prelim-review', 'a7-213'].includes(st);
      case 'inquiry': return ['a5-inquiry', 'a5-inquiry-review', 'a7-644'].includes(st);
      case 'review': return ['a5-prelim-review', 'a5-inquiry-review'].includes(st);
      case 'committee': return ['a7-213', 'a7-644'].includes(st);
      case 'ext': {
        const p = i.prelim || {}, q = i.inquiry644 || {};
        return (p.extensionHistory || []).some(h => h.status === 'PENDING') || (q.extensionHistory || []).some(h => h.status === 'PENDING') || !!p.additionalExtensionPending || !!q.additionalExtensionPending;
      }
      case 'due': return !!tone && tone.tone !== 'ok';
      case 'fast': return !!(i.prelim?.fastTrack || i.inquiry644?.fastTrack);
      case 'm62': return !!(i.intake?.m62?.flag);
      case '582': return c.caseData?.decision === '58/2';
      case 'all':
      default: return true;
    }
  }
  function allA5Cases() {
    const store = readStore();
    let changed = false;
    Object.values(store).forEach(s => { if (normalizeIncomingCase(s)) changed = true; });
    if (changed) writeStore(store);
    return Object.values(store).filter(s => {
      const stage = s.workflow?.stage || '';
      return stage.startsWith('a5-') || stage === 'closed' || (stage === 'activity5-dispatch' && s.workflow?.complete) || s.caseData?.decision === '58/2' || s.caseData?.decision === '62';
    }).sort((a, b) => String(b.caseData?.id || '').localeCompare(String(a.caseData?.id || '')));
  }
  function phaseLabel(state) {
    const stage = state.workflow?.stage || '';
    const i = state.inquiry;
    if (stage === 'closed') return 'ปิดสำนวน';
    if (stage === 'a5-intake') return i?.intake?.transfer?.status === 'PENDING' ? 'รอปลายทางรับโอน' : 'รอรับสำนวน/มอบหมาย';
    if (stage === 'a5-prelim') return `ไต่สวนเบื้องต้น (213) — ${i?.prelim?.status || ''}`;
    if (stage === 'a5-prelim-review') return 'เสนอ 213 ตามลำดับชั้น';
    if (stage === 'a7-213') return `คกก. พิจารณา 213 — ${i?.committee213?.result || 'รอมติ'}`;
    if (stage === 'a5-inquiry') return `ไต่สวนชี้มูล (644) — ${i?.inquiry644?.status || ''}`;
    if (stage === 'a5-inquiry-review') return 'เสนอ 644 ตามลำดับชั้น';
    if (stage === 'a7-644') return `คกก. พิจารณา 644 — ${i?.committee644?.result || 'รอมติ'}`;
    if (stage === 'a5-outcome') return `ดำเนินการตามมติ — ${i?.outcome?.type || ''}`;
    if (stage === 'a5-prosecutor') return `อัยการสั่งการ — ${i?.prosecutor?.orderType || 'รอคำสั่ง'}`;
    if (stage === 'activity5-dispatch') return 'ส่งถึงเขตผู้รับผิดชอบแล้ว';
    if (state.caseData?.decision === '58/2') return 'ตรวจสอบข้อเท็จจริง (58/2)';
    if (state.caseData?.decision === '62') return `คดี ม.62 (ป.ป.ช.) — ${state.workflow?.status || ''}`;
    return state.workflow?.status || stage;
  }
  function currentDeadline(state) {
    const i = state.inquiry;
    if (i?.prelim?.additionalDeadlineAt && ['a5-prelim', 'a5-prelim-review'].includes(state.workflow?.stage)) return i.prelim.additionalDeadlineAt;
    if (i?.inquiry644?.additionalDeadlineAt && ['a5-inquiry', 'a5-inquiry-review'].includes(state.workflow?.stage)) return i.inquiry644.additionalDeadlineAt;
    if (i?.prelim?.deadlineAt && ['a5-prelim', 'a5-prelim-review'].includes(state.workflow?.stage)) return i.prelim.deadlineAt;
    if (i?.inquiry644?.deadlineAt && ['a5-inquiry', 'a5-inquiry-review'].includes(state.workflow?.stage)) return i.inquiry644.deadlineAt;
    return '';
  }
  function renderA5List(activeRole, filters) {
    const root = $('#a5App');
    if (!root) return;
    const cases = allA5Cases();
    const q = (filters?.q || '').toLowerCase(), region = filters?.region || '', phase = filters?.phase || '', investigator = filters?.investigator || '', a5q = filters?.a5q || '';
    const rows = cases.filter(c => {
      const i = c.inquiry || {};
      const searchable = [c.caseData?.id, c.caseData?.subject, c.caseData?.agency, c.caseData?.complainant, i?.intake?.investigator, i?.inquiry644?.investigator].join(' ').toLowerCase();
      return (!q || searchable.includes(q)) && (!region || (i?.intake?.unit || c.caseData?.region) === region) &&
        (!phase || phaseLabel(c) === phase) && (!investigator || (i?.intake?.investigator || i?.inquiry644?.investigator || '') === investigator) &&
        (!a5q || a5qFilter(c, a5q));
    });
    const total = cases.length, pending = cases.filter(c => ['a5-intake'].includes(c.workflow?.stage)).length,
      working = cases.filter(c => ['a5-prelim', 'a5-prelim-review', 'a5-inquiry', 'a5-inquiry-review', 'a7-213', 'a7-644'].includes(c.workflow?.stage)).length,
      done = cases.filter(c => c.workflow?.stage === 'closed' || c.caseData?.decision === '58/2').length;
    $('#a5DashboardTotal').textContent = total; $('#a5DashboardPending').textContent = pending; $('#a5DashboardWorking').textContent = working; $('#a5DashboardDone').textContent = done;
    const investigatorOptions = INVESTIGATORS.map(x => `<option ${investigator === x ? 'selected' : ''}>${x}</option>`).join('');
    const phaseOptions = [...new Set(cases.map(phaseLabel))].map(x => `<option ${phase === x ? 'selected' : ''}>${x}</option>`).join('');
    const body = rows.map(c => {
      const i = c.inquiry || {}, dl = currentDeadline(c), tone = dl ? deadlineTone(dl) : null, age = caseAgeTone(i);
      return `<tr data-a5-case="${escapeHtml(c.caseData?.id)}" tabindex="0"><td><strong>${escapeHtml(c.caseData?.id || '')}</strong><small>เลขรับบริการ ${c.caseData?.trackingYear || ''} / PIN ${c.caseData?.trackingCode || ''}</small></td><td><strong>${escapeHtml(c.caseData?.subject || '')}</strong><small>${escapeHtml(c.caseData?.agency || '')}</small></td><td><strong>${escapeHtml(c.caseData?.complainant || '')}</strong><small>${escapeHtml(i?.intake?.unit || c.caseData?.region || '')}</small></td><td>${escapeHtml(i?.inquiry644?.investigator || i?.intake?.investigator || 'ยังไม่มอบหมาย')}</td><td><span class="ws-status ${c.workflow?.stage === 'closed' ? 'success' : ''}">${escapeHtml(phaseLabel(c))}</span></td><td>${dl ? `<span class="ws-deadline ${tone.tone}">${escapeHtml(tone.label)}</span>` : '<span class="ws-deadline muted">—</span>'}${age ? `<br><span class="ws-deadline ${age.tone}">${escapeHtml(age.label)}</span>` : ''}</td></tr>`;
    }).join('') || '<tr><td colspan="6" class="ws-empty">ไม่พบสำนวนตามเงื่อนไข</td></tr>';
    $('#a5CaseRows').innerHTML = body;
    $$('[data-a5-case]', root).forEach(r => { const open = () => { window.EXMIS?.showA5(r.dataset.a5Case); }; r.onclick = open; r.onkeydown = e => { if (e.key === 'Enter') open(); }; });
  }

  /* ---------- editor ตามเฟสและบทบาท ---------- */
  function caseReadonlyA5(state) {
    const c = state.caseData, d = state.documentData || {}, i = state.inquiry;
    return `<div class="ws-readonly"><dl><div><dt>เลขสำนวน</dt><dd>${escapeHtml(c.id)}</dd></div><div><dt>เลขรับบริการ / PIN</dt><dd>${c.trackingYear || ''} / ${c.trackingCode || ''}</dd></div><div><dt>เรื่อง</dt><dd>${escapeHtml(d.documentSubject || c.subject)}</dd></div><div><dt>ผู้ร้อง</dt><dd>${escapeHtml(c.complainant)}</dd></div><div><dt>ผู้ถูกร้อง/หน่วยงาน</dt><dd>${escapeHtml(c.agency)}</dd></div><div><dt>มาตรา/ผลการพิจารณา</dt><dd>${escapeHtml(d.decision || '')} · ${escapeHtml(c.channel || '')}</dd></div><div><dt>วันรับเรื่องครั้งแรก (เริ่มนับเวลา)</dt><dd>${escapeHtml(i?.intake?.receivedFirstAt || '')}</dd></div><div><dt>เลขหนังสือส่ง (จาก ก4)</dt><dd>${escapeHtml(d.dispatchLetterNo || '')} · ${escapeHtml(d.dispatchSendMethod || '')} ${escapeHtml(d.dispatchEms || '')}</dd></div></dl></div>`;
  }
  function transferPanelHtml(i, role) {
    let out = '';
    const tr = i.intake.transfer || {}, trp = i.intake.transferPost || {};
    if (tr.status === 'PENDING') {
      out += `<div class="ws-callout">สถานะ: รอปลายทางรับโอน (${escapeHtml(tr.target)}) — ส่งโดย ${escapeHtml(tr.by)} ${escapeHtml(tr.at)}${tr.note ? ` · ${escapeHtml(tr.note)}` : ''}</div><div class="ws-grid-2"><div class="ws-field"><label>หมายเหตุ (รับ/ปฏิเสธ)</label><input id="a5TransferNote" placeholder="ระบุหมายเหตุ"></div></div><div class="ws-actions"><button class="ws-button primary" data-a5-action="transfer-accept">รับโอน (รับเป็นเจ้าของเรื่อง)</button><button class="ws-button danger" data-a5-action="transfer-reject">ปฏิเสธ — เรื่องคงอยู่ที่สำนักงานเดิม</button></div>`;
    }
    if (trp.status === 'PENDING') {
      out += `<div class="ws-callout">โอนหลังมอบหมาย: เสนอโอนไป ${escapeHtml(trp.target)} — รอเลขาธิการอนุมัติ (โดย ${escapeHtml(trp.by || '')})${trp.note ? ` · ${escapeHtml(trp.note)}` : ''}</div>${role === 'secretary' ? `<div class="ws-actions"><button class="ws-button primary" data-a5-action="transfer-post-approve">เลขาธิการอนุมัติโอน</button><button class="ws-button danger" data-a5-action="transfer-post-reject">ไม่อนุมัติ</button></div>` : '<p class="ws-policy-note">รอเลขาธิการพิจารณาอนุมัติ</p>'}`;
    }
    return out;
  }
  function intakeEditor(state, role) {
    const i = state.inquiry, c = state.caseData, m62 = i.intake.m62 || {};
    const canAssign = ['clerk', 'director'].includes(role);
    return `<section class="ws-section"><h3>ข้อมูลสำนวนจากสำนักงาน ป.ป.ท.</h3>${caseReadonlyA5(state)}</section>
    <section class="ws-section"><h3>1. ตรวจสอบและมอบหมายผู้รับผิดชอบ</h3><div class="ws-grid-2">
      <div class="ws-field"><label>หน่วยงานเจ้าของสำนวน (เขต/กอง)</label><select id="a5Unit" ${canAssign ? '' : 'disabled'}>${UNITS.map(u => `<option ${(i.intake.unit || c.region) === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div class="ws-field"><label>ผอ. (หัวหน้าพนักงาน ป.ป.ท.)</label><input id="a5Director" value="${escapeHtml(i.intake.director || '')}" placeholder="เช่น ผอ.สำนักงาน ป.ป.ท. เขต 2" ${canAssign ? '' : 'disabled'}></div>
      <div class="ws-field"><label>ผู้รับผิดชอบสำนวน (นักสืบ) *</label><select id="a5Investigator" ${canAssign ? '' : 'disabled'}>${INVESTIGATORS.map(x => `<option ${i.intake.investigator === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="ws-field"><label>ผู้ร่วมปฏิบัติงาน (หลายคนได้)</label><input id="a5Team" value="${escapeHtml((i.intake.team || []).join(', '))}" placeholder="คั่นด้วยจุลภาค" ${canAssign ? '' : 'disabled'}></div>
    </div><p class="ws-policy-note">ผู้รับผิดชอบหลักต้องเป็นพนักงาน ป.ป.ท. เท่านั้น (ตามกฎหมาย)</p></section>
    <section class="ws-section"><h3>2. คำสั่ง/หนังสือมอบหมาย</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขที่คำสั่ง/หนังสือมอบหมาย</label><input id="a5OrderNo" value="${escapeHtml(i.intake.orderNo || '')}" placeholder="เช่น คำสั่งที่ 45/2569" ${canAssign ? '' : 'disabled'}></div><div class="ws-field"><label>วันที่</label>${ThaiDatePicker.html('a5OrderDate', { value: i.intake.orderDate || '', placeholder: 'เลือกวันที่', disabled: !canAssign })}</div></div></section>
    <section class="ws-section"><h3>3. คดีที่รับจาก ป.ป.ช. (มาตรา 62)</h3><label class="ws-choice"><input type="checkbox" id="a5M62Flag" ${m62.flag ? 'checked' : ''} ${canAssign ? '' : 'disabled'}><span><strong>เป็นคดีที่คณะกรรมการ ป.ป.ช. มอบหมาย (ม.62)</strong><small>ต้องมีมติ ป.ป.ช. มอบหมายทุกสำนวน — ตรวจอำนาจก่อน (อายุความเหลือ <6 เดือน → ส่งคืน ป.ป.ช.)</small></span></label><div class="ws-grid-2" id="a5M62Fields"><div class="ws-field"><label>เลขหนังสือ/มติ ป.ป.ช.</label><input id="a5M62Letter" value="${escapeHtml(m62.sourceLetter || '')}" placeholder="เช่น มติที่ 5/2569"></div><div class="ws-field"><label>วันที่มีมติ</label>${ThaiDatePicker.html('a5M62Date', { value: m62.sourceMtiDate || '', placeholder: 'เลือกวันที่มีมติ' })}</div><div class="ws-field ws-field-full"><label>ผลตรวจอำนาจ/อายุความ</label><input id="a5M62Age" value="${escapeHtml(m62.ageCheck || '')}" placeholder="เช่น อายุความเหลือมากกว่า 6 เดือน — อยู่ในอำนาจ ป.ป.ท."></div></div></section>
    ${transferPanelHtml(i, role)}
    ${role === 'clerk' ? `<section class="ws-section"><h3>ส่งผิดสำนักงาน (ก่อนมอบหมาย)</h3><div class="ws-grid-2"><div class="ws-field"><label>โอนไปยัง</label><select id="a5TransferTarget">${UNITS.filter(u => u !== (i.intake.unit || c.region)).map(u => `<option>${u}</option>`).join('')}</select></div><div class="ws-field"><label>หมายเหตุ</label><input id="a5TransferNoteReq" placeholder="เหตุผลที่ส่งผิด"></div></div><button type="button" class="ws-button secondary" data-a5-action="transfer-request">ส่งคำขอโอน (สถานะรอปลายทางรับโอน)</button></section>` : ''}`;
  }
  function extSectionHtml(reportType, inquiry, role) {
    const rep = reportOf(reportType, inquiry);
    const next = extensionRound(reportType, inquiry);
    const pending = pendingExtension(reportType, inquiry);
    const age = caseAgeTone(inquiry);
    const tone = rep.deadlineAt ? deadlineTone(rep.deadlineAt) : null;
    const approvedCount = rep.extensionHistory.filter(h => h.status === 'APPROVED').length;
    const rounds = EXTENSION_RULES[reportType].rounds.map((r, idx) => {
      const cls = idx < approvedCount ? 'used' : (idx === approvedCount && !pending ? 'next' : '');
      return `<span class="a5-ext-round ${cls}" title="${ROLE_LABELS[r]}">${idx + 1}\u00b7${escapeHtml(ROLE_LABELS[r].split(' ')[0])}</span>`;
    }).join('');
    let actionHtml = '';
    if (pending) {
      actionHtml = `<p class="ws-callout">คำขอขยายครั้งที่ ${pending.round} (${pending.requestedDays} วัน) รอ ${ROLE_LABELS[pending.role]} พิจารณา — เหตุผล: ${escapeHtml(pending.reason || '')}</p>`;
      actionHtml += pending.role === role
        ? `<div class="ws-actions"><button class="ws-button primary" data-a5-action="approve-extension">อนุมัติขยาย</button><button class="ws-button danger" data-a5-action="deny-extension">ไม่อนุมัติ</button></div>`
        : '<p class="ws-policy-note">รอผู้อนุมัติพิจารณา</p>';
    } else if (next && next.role === 'committee') {
      actionHtml = `<button type="button" class="ws-button danger" data-a5-action="extension-late">เสนอ คกก. ขอขยายครั้งที่ ${next.round} (รายงานเหตุล่าช้า)</button>`;
    } else if (next) {
      actionHtml = `<button type="button" class="ws-button secondary" data-a5-action="request-extension">ยื่นคำขอขยาย (รอบ ${next.round}: ${ROLE_LABELS[next.role]})</button>`;
    } else {
      actionHtml = `<p class="ws-policy-note">ขยายครบทุกครั้งแล้ว — ดำเนินการตามคำสั่ง/มติคณะกรรมการ (คำสั่งตามมติบอร์ด)</p>`;
    }
    const history = rep.extensionHistory.length
      ? rep.extensionHistory.map(h => {
          let st = h.status === 'PENDING' ? 'รออนุมัติ' : h.status === 'DENIED' ? `ไม่อนุมัติ${h.denyNote ? ` (${escapeHtml(h.denyNote)})` : ''}` : `${escapeHtml(h.approvedBy || h.role)} อนุมัติ ${h.requestedDays} วัน`;
          return `<li>ครั้งที่ ${h.round} · ${st} · ${escapeHtml(h.reason || '')} <time>${h.requestedAt || h.approvedAt || ''}</time></li>`;
        }).join('')
      : '<li>ยังไม่มีการขยายเวลา</li>';
    return `<div class="a5-ext-list"><div class="a5-ext-track"><span class="a5-ext-label">รอบขยาย ${reportType}:</span>${rounds}</div>${tone ? `<p class="ws-deadline ${tone.tone}">${escapeHtml(tone.label)}</p>` : ''}${age ? `<p class="ws-deadline ${age.tone}">${escapeHtml(age.label)}</p>` : ''}${actionHtml}<ul class="ws-history">${history}</ul></div>`;
  }
  function progressSectionHtml(reportType, inquiry, role) {
    const rep = reportOf(reportType, inquiry);
    const reports = rep.progressReports || [];
    const list = reports.length ? `<ul class="ws-history">${reports.map(r => `<li>${escapeHtml(r.text)}<time>${escapeHtml(r.at || '')} · ${escapeHtml(r.by || '')}</time></li>`).join('')}</ul>` : '<p class="ws-policy-note">ยังไม่มีรายงานความคืบหน้า — ระหว่างการขยายเวลาต้องรายงานความคืบหน้าทุก 15 วัน (ระเบียบฯ ข้อ 38/64)</p>';
    return `<section class="ws-section"><h3>รายงานความคืบหน้า (ทุก 15 วัน ระหว่างขยายเวลา)</h3>${list}${role === 'investigator' ? `<div class="ws-field"><label>บันทึกรายงานความคืบหน้าครั้งล่าสุด</label><textarea id="a5ProgressText" placeholder="ระบุความคืบหน้า เอกสารที่ได้ กำหนดการถัดไป"></textarea></div><button type="button" class="ws-button secondary" data-a5-action="progress-report">บันทึกรายงานความคืบหน้า</button>` : ''}</section>`;
  }
  function additionalDeadlineHtml(reportType, inquiry, role) {
    const rep = reportOf(reportType, inquiry);
    if (!rep.additionalDeadlineAt) return '';
    const tone = deadlineTone(rep.additionalDeadlineAt);
    const pending = rep.additionalExtensionPending;
    let action = '';
    if (pending) {
      action = role === 'director'
        ? `<div class="ws-actions"><button type="button" class="ws-button primary" data-a5-action="approve-additional-extension">อนุมัติขยายไต่สวนเพิ่มเติม</button><button type="button" class="ws-button danger" data-a5-action="deny-additional-extension">ไม่อนุมัติ</button></div>`
        : `<p class="ws-policy-note">รอหัวหน้าพนักงาน ป.ป.ท. (ผอ.) พิจารณาคำขอขยาย — เหตุผล: ${escapeHtml(pending.reason || '')}</p>`;
    } else if (rep.additionalExtendedOnce) {
      action = '<p class="ws-policy-note">ขยายไต่สวนเพิ่มเติมครบ 1 ครั้งแล้ว (30+30) — ครบกำหนดต้องเสนอ คกก.</p>';
    } else if (role === 'investigator') {
      action = `<button type="button" class="ws-button secondary" data-a5-action="request-additional-extension">ขอขยายไต่สวนเพิ่มเติมอีก 30 วัน (ได้ครั้งเดียว)</button>`;
    }
    return `<div class="ws-callout">กำหนดไต่สวนเพิ่มเติม: <span class="ws-deadline ${tone.tone}">${escapeHtml(tone.label)}</span></div>${action}`;
  }
  function chainHtml(reportType, inquiry, role) {
    const cs = chainState(reportType, inquiry);
    return `<div class="a5-ext-list"><strong>ลำดับชั้นตรวจรายงาน ${reportType}:</strong><ol class="ws-list">${cs.steps.map(s => { const d = cs.done.find(x => x.level === s.level); const isCurrent = cs.current && cs.current.level === s.level; return `<li>${d ? `✅ ${escapeHtml(d.label)} — ${escapeHtml(d.by)}${d.skip ? ' (ข้าม)' : ''}: ${escapeHtml(d.opinion || '')}` : `<b>${escapeHtml(s.label)}</b>${isCurrent ? ' ← รอตรวจ' : s.optional ? ' (ไม่บังคับ)' : ''}`}</li>`; }).join('')}</ol>${cs.complete ? '<p class="ws-policy-note">ตรวจครบทุกชั้นแล้ว — พร้อมเสนอคณะกรรมการ</p>' : `<div class="ws-field"><label>ความเห็น (${ROLE_LABELS[role]})</label><textarea id="a5ChainOpinion" placeholder="บันทึกความเห็น..."></textarea></div>${cs.current?.role === role ? '<button type="button" class="ws-button primary" data-a5-action="chain-approve">เห็นชอบ — ส่งชั้นถัดไป</button>' : cs.current?.role === 'director' && role === 'director' ? '' : ''}${role === 'secretary' && cs.current?.level === 4 ? '<label class="ws-choice"><input type="checkbox" id="a5SupportFlag"><span><strong>ส่งคณะอนุกรรมการสนับสนุนเลขาธิการฯ (กรณียุ่งยากซับซ้อน)</strong></span></label>' : ''}${['director', 'secretary', 'group-director'].includes(role) ? '<button type="button" class="ws-button danger" data-a5-action="chain-return">ส่งกลับแก้ไข (ไต่สวนเพิ่มเติม 30 วัน)</button>' : ''}${role === 'group-director' && !cs.done.some(d => d.level === 1) ? '<button type="button" class="ws-button ghost" data-a5-action="chain-skip-group">ไม่อยู่ในสายงาน — ข้ามชั้น</button>' : ''}`}</div>`;
  }
  function prelimEditor(state, role) {
    const i = state.inquiry, p = i.prelim, c = state.caseData;
    const isInvestigator = role === 'investigator';
    return `<section class="ws-section"><h3>กรอบเวลาไต่สวนเบื้องต้น (60 วัน นับจากวันรับเรื่องครั้งแรก ${escapeHtml(i.intake.receivedFirstAt || '')})</h3>${extSectionHtml('213', i, role)}
    <div class="ws-grid-2"><div class="ws-field"><label>วันที่เริ่มนับ (วันรับเรื่องครั้งแรก)</label><input type="date" value="${escapeHtml(p.startedAt || i.intake.receivedFirstAt || '')}" disabled></div><div class="ws-field"><label>วันครบกำหนด</label><input type="date" value="${escapeHtml(p.deadlineAt || '')}" disabled></div></div></section>
    ${progressSectionHtml('213', i, role)}<section class="ws-section"><h3>1. แผนงานคดีและบันทึกการปฏิบัติงาน</h3><div class="ws-field"><label>แผนงานคดี (Case Plan)</label><textarea id="a5Plan" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.plan || '')}</textarea></div><div class="ws-grid-2"><div class="ws-field"><label>สถานะแผนคดี</label><input value="${escapeHtml(p.planStatus || '')}" disabled><small>หัวหน้าพนักงาน ป.ป.ท. ต้องอนุมัติแผนก่อนใช้มาตรา 18</small></div>${p.planStatus === 'รออนุมัติจากหัวหน้าพนักงาน' && role === 'director' ? '<div class="ws-field"><button type="button" class="ws-button primary" data-a5-action="plan-approve-213">อนุมัติแผนคดี</button></div>' : ''}</div><div class="ws-field"><label>บันทึกการปฏิบัติงาน/ความคืบหน้า</label><textarea id="a5WorkLog" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.workLog || '')}</textarea></div></section>
    <section class="ws-section"><h3>2. วิเคราะห์ประเด็นแห่งคดี 4 ประเด็น</h3><div class="ws-grid-2">${[['status', 'สถานะผู้ถูกร้อง'], ['authority', 'ขอบเขตอำนาจหน้าที่'], ['action', 'การกระทำถูกต้องตามอำนาจหน้าที่หรือไม่'], ['damage', 'ความเสียหาย']].map(([k, l]) => `<div class="ws-field"><label>${l}</label><textarea id="a5Issue_${k}" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.issues?.[k] || '')}</textarea></div>`).join('')}</div>
    <div class="ws-callout">กิจกรรมแทรก: คุ้มครองพยาน (ก6) · หมายค้น (ก9) — จัดทำคำขอ → ส่ง ก6/ก9 → บันทึกผล (ไม่หยุดนับเวลา 213)</div><div class="ws-grid-2"><div class="ws-field"><label>คุ้มครองพยาน (ก6)${p.witnessProtectionReq ? ` — <span class="ws-status">${p.witnessProtectionReq.status === 'result' ? 'รับผลแล้ว' : 'ส่ง ก6 แล้ว'}</span>` : ''}</label><input id="a5A6" value="${escapeHtml(p.witnessProtection || p.evidence || '')}" placeholder="ผลการคุ้มครองจาก ก6" ${isInvestigator ? '' : 'disabled'}><div class="ws-actions" style="margin-top:.45rem;position:static">${isInvestigator ? `<button type="button" class="ws-button secondary" data-a5-action="witness-request">${p.witnessProtectionReq && p.witnessProtectionReq.status !== 'result' ? 'ส่ง ก6 แล้ว — แก้คำขอ' : 'จัดทำคำขอคุ้มครอง → ก6'}</button><button type="button" class="ws-button ghost" data-a5-action="witness-result" ${p.witnessProtectionReq ? '' : 'disabled'}>บันทึกผลจาก ก6</button>` : ''}</div></div><div class="ws-field"><label>หมายค้น (ก9)${p.searchWarrantReq ? ` — <span class="ws-status">${p.searchWarrantReq.status === 'result' ? 'รับผลแล้ว' : 'ส่ง ก9 แล้ว'}</span>` : ''}</label><input id="a5A9" value="${escapeHtml(p.searchWarrantResult || p.searchWarrant || '')}" placeholder="เลขคำร้อง/ผลศาล" ${isInvestigator ? '' : 'disabled'}><div class="ws-actions" style="margin-top:.45rem;position:static">${isInvestigator ? `<button type="button" class="ws-button secondary" data-a5-action="search-request">${p.searchWarrantReq && p.searchWarrantReq.status !== 'result' ? 'ส่ง ก9 แล้ว — แก้คำขอ' : 'จัดทำคำร้องหมายค้น → ก9'}</button><button type="button" class="ws-button ghost" data-a5-action="search-result" ${p.searchWarrantReq ? '' : 'disabled'}>บันทึกผล ก9</button>` : ''}</div></div></div>
    ${(p.issues?.status && !p.issues.authority) ? '' : ''}<p class="ws-policy-note">ถ้าตรวจพบว่าอยู่ในอำนาจ ป.ป.ช. → เตรียมส่ง ป.ป.ช. (ระบุในสรุปรายงาน)</p></section>
    ${additionalDeadlineHtml('213', i, role)}
    <section class="ws-section"><h3>3. สรุปรายงานไต่สวนเบื้องต้น (รายงาน 213)</h3><div class="ws-field"><label>สรุปผล + ความเห็นเสนอ (รับไว้ไต่สวน/ไม่รับ/ส่ง ป.ป.ช.)</label><textarea id="a5PrelimReport" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.report || '')}</textarea></div></section>`;
  }
  function prelimReviewEditor(state, role) {
    const i = state.inquiry;
    if (i.prelim.supportPending) {
      return `<section class="ws-section"><h3>คณะอนุกรรมการสนับสนุนเลขาธิการฯ — ความเห็นประกอบ (กรณียุ่งยากซับซ้อน)</h3>${paper213(state)}<div class="ws-field"><label>ความเห็นคณะอนุกรรมการสนับสนุนฯ</label><textarea id="a5SupportOpinion">${escapeHtml(i.prelim.supportOpinion || '')}</textarea></div></section>`;
    }
    return `<section class="ws-section"><h3>รายงาน 213 — ตรวจตามลำดับชั้น</h3>${paper213(state)}${chainHtml('213', i, role)}${i.prelim.fastTrack ? '<p class="ws-policy-note">ใช้ใบด่วน (ขอบรรจุวาระเร่งด่วน) — เสนอตรงคณะกรรมการ</p>' : ''}</section>`;
  }
  function committee213Editor(state, role) {
    const i = state.inquiry, m = i.committee213, p = i.prelim || {};
    const cRound = EXTENSION_RULES['213'].rounds.filter(r => r === 'committee').length;
    const cDone = (p.extensionHistory || []).filter(h => h.role === 'committee').length;
    const late = p.lateReport && cDone < cRound;
    if (late) {
      const lr = p.lateRound || cDone + 3;
      const isFinal = lr >= EXTENSION_RULES['213'].rounds.length;
      return `<section class="ws-section"><h3>ขยายไต่สวนเบื้องต้น — คณะกรรมการพิจารณาครั้งที่ ${lr}${isFinal ? ' (ครั้งสุดท้าย — แจงเรื่อง ต่อมติบอร์ด)' : ' (ขอเวลาเพิ่มเติม)'}</h3><div class="ws-callout">เลขาธิการคณะกรรมการ ป.ป.ท. พิจารณาเอง — มอบหมายมิได้ (คำสั่ง คกก. ป.ป.ท. ที่ 218/2568 ข้อ 14 วรรค 3)</div><div class="ws-field"><label>รายงานเหตุผลความจำเป็นและหลักฐาน (จากผู้รับผิดชอบสำนวน)</label><textarea disabled>${escapeHtml(p.lateReport)}</textarea></div><div class="ws-field"><label>ความเห็นเลขาธิการ / คณะกรรมการ</label><textarea id="a5CommitteeExtOpinion" placeholder="บันทึกความเห็นและแนวทางแก้ไข"></textarea></div><p class="ws-policy-note">อนุมัติขยายได้ครั้งละไม่เกิน 60 วัน — ไม่อนุมัติต้องเร่งรัดให้ดำเนินการแล้วเสร็จ</p></section>`;
    }
    return `<section class="ws-section"><h3>รายงาน 213 — คณะกรรมการ ป.ป.ท. พิจารณา</h3>${paper213(state)}<div class="ws-choice-grid">${MTI_213_RESULTS.map(r => `<label class="ws-choice"><input type="radio" name="a5Mti213" value="${r}" ${m.result === r ? 'checked' : ''}><span><strong>${r}</strong></span></label>`).join('')}</div><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ</label><input id="a5Mti213No" value="${escapeHtml(m.mtiNo || '')}"></div><div class="ws-field"><label>วันที่มีมติ</label>${ThaiDatePicker.html('a5Mti213Date', { value: m.mtiDate || '', placeholder: 'เลือกวันที่มีมติ' })}</div><div class="ws-field ws-field-full"><label>ข้อความในมติ/หมายเหตุ</label><textarea id="a5Mti213Note">${escapeHtml(m.note || '')}</textarea></div></div>
    <aside class="ws-callout">รับไว้ไต่สวน → เลือกชุดไต่สวน (ม.24 ว.3 คณะอนุกรรมการ — ประธานกรรมการลงนาม, นับ 270 วันจากวันมติ / ม.24 ว.1 คณะพนักงาน — เลขาธิการลงนาม, นับจากวันลงนาม) + ระบุผู้รับผิดชอบชั้น 644</aside>
    <div class="ws-grid-2"><div class="ws-field"><label>ประเภทชุดไต่สวน</label><select id="a5OrderType"><option value="24v3" ${m.orderType === '24v3' || role === 'committee' ? 'selected' : ''}>คณะอนุกรรมการไต่สวน (ม.24 ว.3)</option><option value="24v1" ${m.orderType === '24v1' ? 'selected' : ''}>คณะพนักงานไต่สวน (ม.24 ว.1)</option></select></div><div class="ws-field"><label>เลขที่คำสั่งแต่งตั้ง</label><input id="a5OrderNo644" value="${escapeHtml(m.orderNo || '')}" placeholder="ระบบออกให้อัตโนมัติเมื่อบันทึกมติ"></div><div class="ws-field"><label>ผู้รับผิดชอบชั้น 644</label><select id="a5Investigator644">${INVESTIGATORS.map(x => `<option ${(m.investigator644 || i.intake.investigator) === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>หนังสือส่งมอบสำนวน (ถ้าคนละคนกับชั้น 213)</label><input id="a5Handover" value="${escapeHtml(m.handoverDoc?.letterNo || '')}" placeholder="เลขหนังสือส่งมอบสำนวน"></div></div>${state.workflow?.status?.includes('ปรับองค์คณะ') ? '<button type="button" class="ws-button primary" data-a5-action="org-approve">อนุมัติปรับองค์คณะ</button>' : ''}</section>`;
  }
  function inquiryEditor(state, role) {
    const i = state.inquiry, q = i.inquiry644, m = i.committee213;
    const isInvestigator = role === 'investigator';
    return `<section class="ws-section"><h3>คำสั่งแต่งตั้งและกรอบเวลาไต่สวนชี้มูล (270 วัน + ขยาย 5 รอบ)</h3><div class="ws-grid-2"><div class="ws-field"><label>ชุดไต่สวน</label><input value="${m.orderType === '24v3' ? 'คณะอนุกรรมการไต่สวน (ม.24 ว.3)' : 'คณะพนักงานไต่สวน (ม.24 ว.1)'} ${m.orderNo || ''}" disabled></div><div class="ws-field"><label>ผู้รับผิดชอบชั้น 644</label><input value="${escapeHtml(q.investigator || i.intake.investigator || '')}" disabled>${m.handoverDoc?.letterNo ? `<small>หนังสือส่งมอบสำนวน: ${escapeHtml(m.handoverDoc.letterNo)}</small>` : ''}</div><div class="ws-field"><label>เริ่มนับ 270 วัน</label><input type="date" value="${escapeHtml(q.startedAt || '')}" disabled><small>ว.3 = วันบอร์ดมีมติ / ว.1 = วันเลขาธิการลงนาม</small></div><div class="ws-field"><label>วันครบกำหนด</label><input type="date" value="${escapeHtml(q.deadlineAt || '')}" disabled></div></div>${extSectionHtml('644', i, role)}
    <div class="ws-field"><label>แผนงานคดี (ชั้น 644)</label><textarea id="a5Plan644" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.plan || '')}</textarea></div>${q.planStatus === 'รออนุมัติจากหัวหน้าพนักงาน' && role === 'director' ? '<button type="button" class="ws-button primary" data-a5-action="plan-approve-644">อนุมัติแผนคดี 644</button>' : `<small>สถานะแผน: ${escapeHtml(q.planStatus || '')}</small>`}</section>
    ${progressSectionHtml('644', i, role)}<section class="ws-section"><h3>1. การไต่สวน</h3><div class="ws-field"><label>ผู้ถูกกล่าวหา (ทีละบรรทัด)</label><textarea id="a5Accused" ${isInvestigator ? '' : 'disabled'}>${escapeHtml((q.accused || []).join('\n'))}</textarea></div><div class="ws-field"><label>ข้อกล่าวหา</label><textarea id="a5Allegations" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.allegations || '')}</textarea></div><div class="ws-grid-2"><div class="ws-field"><label>วันที่แจ้งข้อกล่าวหา</label>${ThaiDatePicker.html('a5NoticeDate', { value: q.noticeSentAt || '', placeholder: 'เลือกวันที่แจ้งข้อกล่าวหา', disabled: !isInvestigator })}<small>แจ้งเมื่อหลักฐานเพียงพอ — เปิดโอกาสชี้แจงก่อนสรุป 644</small></div><div class="ws-field"><label>กันบุคคลเป็นพยาน (ม.58)</label><input id="a5Witnesses" value="${escapeHtml((q.witnesses || []).join(', '))}" ${isInvestigator ? '' : 'disabled'}></div></div><div class="ws-field"><label>บันทึกถ้อยคำ/คำชี้แจง</label><textarea id="a5Statements" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.statements || '')}</textarea></div>
    <div class="ws-callout">กิจกรรมแทรก: คุ้มครองพยาน (ก6) · หมายค้น (ก9) — จัดทำคำขอ → ส่ง ก6/ก9 → บันทึกผล</div><div class="ws-grid-2"><div class="ws-field"><label>คุ้มครองพยาน (ก6)${q.witnessProtectionReq ? ` — <span class="ws-status">${q.witnessProtectionReq.status === 'result' ? 'รับผลแล้ว' : 'ส่ง ก6 แล้ว'}</span>` : ''}</label><input id="a5InqA6" value="${escapeHtml(q.witnessProtection || '')}" placeholder="ผลการคุ้มครองจาก ก6" ${isInvestigator ? '' : 'disabled'}><div class="ws-actions" style="margin-top:.45rem;position:static">${isInvestigator ? `<button type="button" class="ws-button secondary" data-a5-action="witness-request">${q.witnessProtectionReq && q.witnessProtectionReq.status !== 'result' ? 'ส่ง ก6 แล้ว — แก้คำขอ' : 'จัดทำคำขอคุ้มครอง → ก6'}</button><button type="button" class="ws-button ghost" data-a5-action="witness-result" ${q.witnessProtectionReq ? '' : 'disabled'}>บันทึกผลจาก ก6</button>` : ''}</div></div><div class="ws-field"><label>หมายค้น (ก9)${q.searchWarrantReq ? ` — <span class="ws-status">${q.searchWarrantReq.status === 'result' ? 'รับผลแล้ว' : 'ส่ง ก9 แล้ว'}</span>` : ''}</label><input id="a5InqA9" value="${escapeHtml(q.searchWarrantResult || q.searchWarrant || '')}" placeholder="เลขคำร้อง/ผลศาล" ${isInvestigator ? '' : 'disabled'}><div class="ws-actions" style="margin-top:.45rem;position:static">${isInvestigator ? `<button type="button" class="ws-button secondary" data-a5-action="search-request">${q.searchWarrantReq && q.searchWarrantReq.status !== 'result' ? 'ส่ง ก9 แล้ว — แก้คำขอ' : 'จัดทำคำร้องหมายค้น → ก9'}</button><button type="button" class="ws-button ghost" data-a5-action="search-result" ${q.searchWarrantReq ? '' : 'disabled'}>บันทึกผล ก9</button>` : ''}</div></div></div></section>
    ${additionalDeadlineHtml('644', i, role)}
    <section class="ws-section"><h3>2. สรุปรายงานการไต่สวนชี้มูล (รายงาน 644)</h3><div class="ws-field"><label>สรุปผล + ความเห็นชี้มูล</label><textarea id="a5InqReport" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.report || '')}</textarea></div></section>`;
  }
  function inquiryReviewEditor(state, role) {
    const i = state.inquiry;
    if (i.inquiry644.supportPending) {
      return `<section class="ws-section"><h3>คณะอนุกรรมการสนับสนุนเลขาธิการฯ — ความเห็นประกอบ (644)</h3>${paper644(state)}<div class="ws-field"><label>ความเห็นคณะอนุกรรมการสนับสนุนฯ</label><textarea id="a5SupportOpinion644">${escapeHtml(i.inquiry644.supportOpinion || '')}</textarea></div></section>`;
    }
    return `<section class="ws-section"><h3>รายงาน 644 — ตรวจตามลำดับชั้น</h3>${paper644(state)}${chainHtml('644', i, role)}${i.inquiry644.fastTrack ? '<p class="ws-policy-note">ใช้ใบด่วน — เสนอตรงคณะกรรมการ</p>' : ''}</section>`;
  }
  function committee644Editor(state, role) {
    const i = state.inquiry, m = i.committee644, q = i.inquiry644 || {};
    const cRound = EXTENSION_RULES['644'].rounds.filter(r => r === 'committee').length;
    const cDone = (q.extensionHistory || []).filter(h => h.role === 'committee').length;
    const late = q.lateReport && cDone < cRound;
    if (late) {
      const lr = q.lateRound || cDone + 5;
      const isFinal = lr >= EXTENSION_RULES['644'].rounds.length;
      return `<section class="ws-section"><h3>ขยายไต่สวนชี้มูล — คณะกรรมการพิจารณาครั้งที่ ${lr}${isFinal ? ' (ครั้งสุดท้าย — แจงบอร์ด รอผลมติ)' : ' (เสนอ คกก. แจงเหตุผล)'}</h3><div class="ws-callout">เลขาธิการคณะกรรมการ ป.ป.ท. พิจารณาเอง — มอบหมายมิได้ (คำสั่ง คกก. ป.ป.ท. ที่ 218/2568 ข้อ 14 วรรค 3)</div><div class="ws-field"><label>รายงานเหตุผลความจำเป็นและหลักฐาน (จากผู้รับผิดชอบสำนวน)</label><textarea disabled>${escapeHtml(q.lateReport)}</textarea></div><div class="ws-field"><label>ความเห็นเลขาธิการ / คณะกรรมการ</label><textarea id="a5CommitteeExtOpinion" placeholder="บันทึกความเห็นและแนวทางแก้ไข"></textarea></div><p class="ws-policy-note">อนุมัติขยายได้ครั้งละไม่เกิน 60 วัน — ไม่อนุมัติต้องเร่งรัดให้ดำเนินการแล้วเสร็จ</p></section>`;
    }
    return `<section class="ws-section"><h3>รายงาน 644 — คณะกรรมการ ป.ป.ท. วินิจฉัยชี้มูล</h3>${paper644(state)}<div class="ws-choice-grid">${MTI_644_RESULTS.map(r => `<label class="ws-choice"><input type="radio" name="a5Mti644" value="${r}" ${m.result === r ? 'checked' : ''}><span><strong>${r}</strong></span></label>`).join('')}</div><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ</label><input id="a5Mti644No" value="${escapeHtml(m.mtiNo || '')}"></div><div class="ws-field"><label>วันที่มีมติ</label>${ThaiDatePicker.html('a5Mti644Date', { value: m.mtiDate || '', placeholder: 'เลือกวันที่มีมติ' })}</div><div class="ws-field ws-field-full"><label>ข้อความในมติ/หมายเหตุ</label><textarea id="a5Mti644Note">${escapeHtml(m.note || '')}</textarea></div></div><aside class="ws-callout">ชี้มูลอาญา+วินัย → ส่งอัยการ (A10) + แจ้งต้นสังกัดวินัย 60 วัน (A8) · ม.18/4 แยก ร้ายแรง/ไม่ร้ายแรง · ไม่มีมูล → แจ้ง 15 วัน · ส่ง ป.ป.ช./พนักงานสอบสวน → หนังสือส่งมอบ</aside>${state.workflow?.status?.includes('ปรับองค์คณะ') ? '<button type="button" class="ws-button primary" data-a5-action="org-approve">อนุมัติปรับองค์คณะ</button>' : ''}</section>`;
  }
  function warrantSection(i, role) {
    const o = i.outcome || {}, w = o.warrant || {};
    const steps = [['none', 'ยังไม่ได้ยื่นคำร้อง'], ['filed', 'ยื่นคำร้องต่อศาลแล้ว'], ['issued', 'ศาลออกหมายจับแล้ว'], ['denied', 'ศาลไม่ออกหมายจับ'], ['arrested', 'ดำเนินการตามหมาย'], ['notified', 'แจ้งหน่วยงานแล้ว']];
    const st = steps.find(s => s[0] === (w.status || 'none')) || steps[0];
    const can = ['clerk', 'investigator'].includes(role);
    return `<section class="ws-section"><h3>การขอหมายจับ / ส่งศาล <span class="ws-status">${st[1]}</span></h3><div class="ws-grid-2"><div class="ws-field"><label>ศาล</label><input id="a5WarrantCourt" value="${escapeHtml(w.court || '')}" placeholder="ศาลอาญาคดีทุจริตและประพฤติมิชอบ" ${can ? '' : 'disabled'}></div><div class="ws-field"><label>หมายจับที่ / ลงวันที่</label><input id="a5WarrantNo" value="${escapeHtml(w.warrantNo || '')}" placeholder="หมายจับที่ ... ลงวันที่ ..." ${can ? '' : 'disabled'}></div></div><div class="ws-actions" style="position:static;flex-wrap:wrap">${can ? `<button type="button" class="ws-button secondary" data-a5-action="warrant-file">ยื่นคำร้องขอหมายจับต่อศาล</button><button type="button" class="ws-button secondary" data-a5-action="warrant-court" ${w.status === 'filed' ? '' : 'disabled'}>บันทึกผลศาล</button><button type="button" class="ws-button secondary" data-a5-action="warrant-arrest" ${w.status === 'issued' ? '' : 'disabled'}>บันทึกการจับกุม</button><button type="button" class="ws-button primary" data-a5-action="warrant-notify" ${w.status === 'arrested' ? '' : 'disabled'}>แจ้งหน่วยงาน (อัยการ/ผบ.ตร./กอท.)</button>` : ''}</div>${w.note ? `<p class="ws-policy-note">${escapeHtml(w.note)}</p>` : ''}<p class="ws-policy-note">เอกสาร: คำร้องขอหมายจับ (แบบ ปปท. 11) → บันทึกคำเบิกความ (12) → รายงานกระบวนการพิจารณา (13) → หมายจับ (14/15) → ตำหนิรูปพรรณ (16) → แจ้งผลการออกหมาย (17) → แจ้ง ผบ.ตร. (18) → บันทึกส่งหมายจับ กอท. (19) → ผนึกซอง (20)</p></section>`;
  }
  function outcomeEditor(state, role) {
    const i = state.inquiry, o = i.outcome, m = i.committee644, m62 = i.intake.m62 || {};
    const result = m.result || '';
    const isClerk = ['clerk', 'investigator'].includes(role);
    return `<section class="ws-section"><h3>ผลมติคณะกรรมการ: ${escapeHtml(result || 'ยังไม่มีมติ')}</h3><div class="ws-grid-2"><div class="ws-field"><label>แนวทางดำเนินการ</label><input value="${escapeHtml(result)}" disabled></div><div class="ws-field"><label>เลขหนังสือ/เอกสารส่ง</label><input id="a5OutLetters" value="${escapeHtml(o.letters || '')}" ${isClerk ? '' : 'disabled'}></div>${result.includes('อาญา') ? `<div class="ws-field"><label>พนักงานอัยการ (เขตอำนาจ)</label><input id="a5OutProsecutor" value="${escapeHtml(o.prosecutor || '')}" placeholder="อัยการคดีทุจริต / อัยการทหาร" ${isClerk ? '' : 'disabled'}></div>` : ''}${result.includes('วินัย') ? `<div class="ws-field"><label>หน่วยงานต้นสังกัด (วินัย 60 วัน)</label><input id="a5OutDiscipline" value="${escapeHtml(o.disciplineAgency || '')}" ${isClerk ? '' : 'disabled'}></div>` : ''}<div class="ws-field ws-field-full"><label>การติดตามผล (กบต.)</label><textarea id="a5OutFollowup" ${isClerk ? '' : 'disabled'}>${escapeHtml(o.followup || '')}</textarea></div></div>${result.includes('ไม่มีมูล') ? '<p class="ws-policy-note">ต้องแจ้งผู้ถูกกล่าวหา/ต้นสังกัดภายใน 15 วันนับแต่วันที่มีมติ (ระบุในเลขหนังสือ)</p>' : ''}${result.includes('อาญา') ? warrantSection(i, role) : ''}${m62.flag ? `<section class="ws-section"><h3>รายงานผลกลับ ป.ป.ช. (มาตรา 65)</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือรายงานผล</label><input id="a5M62Report" value="${escapeHtml(m62.report65Letter || '')}" placeholder="เช่น หนังสือที่ สปท 0012/2569"></div><div class="ws-field"><label>วันที่</label>${ThaiDatePicker.html('a5M62ReportDate', { value: m62.report65Date || '', placeholder: 'เลือกวันที่' })}</div></div></section>` : ''}</section>`;
  }
  function prosecutorEditor(state, role) {
    const i = state.inquiry, p = i.prosecutor;
    return `<section class="ws-section"><h3>พนักงานอัยการสั่งการ (กิจกรรมที่ 10)</h3><div class="ws-callout">${p.orderType ? `คำสั่งอัยการ: ${escapeHtml(p.orderType)}${p.orderDetail ? ` — ${escapeHtml(p.orderDetail)}` : ''}` : 'รอคำสั่งจากพนักงานอัยการ (อาจสั่งให้ไต่สวนเพิ่มเติม/เพิ่มผู้ถูกกล่าวหา/แยกสำนวน)'}</div>
    <div class="ws-field"><label>คำสั่งอัยการ</label><select id="a5ProsecutorOrder">${PROSECUTOR_ORDERS.map(x => `<option ${p.orderType === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>รายละเอียดคำสั่ง</label><textarea id="a5ProsecutorDetail">${escapeHtml(p.orderDetail || '')}</textarea></div><label class="ws-choice"><input type="checkbox" id="a5A7Approve"><span><strong>กรณีแยกสำนวน — คณะกรรมการ ป.ป.ท. เห็นชอบแล้ว</strong><small>การแยกสำนวนต้องเสนอให้กิจกรรมที่ 7 เห็นชอบก่อน</small></span></label>
    <div class="ws-field"><label>เลขหนังสือส่งผลกลับอัยการ</label><input id="a5ProsecutorLetters" value="${escapeHtml(p.letters || '')}" placeholder="เช่น หนังสือที่ สปท 0013/2569"></div></section>`;
  }
  function specialEditor(state, role) {
    const i = state.inquiry, s = i.special, c = state.caseData;
    return `<section class="ws-section"><h3>ตรวจสอบข้อเท็จจริง (มาตรา 58/2-58/3) — ไม่มีเลขสำนวน ไม่เข้าระบบไต่สวน</h3><div class="ws-grid-2"><div class="ws-field"><label>ประเภท</label><select id="a5SpecialType"><option value="582" ${s.type === '582' || c.decision === '58/2' ? 'selected' : ''}>58/2 ปัญหาความเดือดร้อน</option><option value="583" ${s.type === '583' ? 'selected' : ''}>58/3 โครงการวงเงินสูงเกินจริง</option></select></div><div class="ws-field"><label>ผอ. มอบหมายเจ้าหน้าที่</label><input id="a5SpecialAssignee" value="${escapeHtml(s.assignee || '')}" placeholder="ชื่อเจ้าหน้าที่ ป.ป.ท. ผู้ตรวจสอบ"></div><div class="ws-field"><label>หน่วยงานที่แจ้ง (58/2: หน่วยงานรัฐ / 58/3: สตง.)</label><input id="a5SpecialAgency" value="${escapeHtml(s.agency || '')}"></div><div class="ws-field"><label>วันที่รายงาน/แจ้ง</label>${ThaiDatePicker.html('a5SpecialDate', { value: s.reportedAt || '', placeholder: 'เลือกวันที่รายงาน/แจ้ง' })}</div><div class="ws-field ws-field-full"><label>ผลการดำเนินการ/หมายเหตุ</label><textarea id="a5SpecialResult">${escapeHtml(s.result || '')}</textarea></div></div><div class="ws-actions">${s.secretaryAt ? `<span class="ws-status success">เสนอเลขาธิการแล้ว ${escapeHtml(s.secretaryAt)}</span>` : '<button class="ws-button secondary" data-a5-action="special-secretary">เสนอเลขาธิการตามลำดับชั้น</button>'}<button class="ws-button secondary" data-a5-action="special-notice">หน่วยงานไม่แก้ไข — ประกาศให้ประชาชนทราบ</button><button class="ws-button danger" data-a5-action="special-switch">พบพฤติการณ์ทุจริต — เปลี่ยนเส้นทางเข้าคดี</button></div>${s.publicNotice ? '<p class="ws-policy-note">✅ ประกาศให้ประชาชนทราบแล้ว (58/2)</p>' : ''}${s.switched ? '<p class="ws-policy-note">⚠️ เปลี่ยนเส้นทางเข้าสู่คดีตามอำนาจแล้ว</p>' : ''}</section>`;
  }
  function adminCaseTools(state, role) {
    if (role !== 'clerk') return '';
    const i = state.inquiry;
    return `<section class="ws-section"><h3>บริหารสำนวน (ธุรการคดี)</h3><div class="ws-grid-2"><div class="ws-field"><label>โอนสำนวน (หลังมอบหมาย — เสนอเลขาธิการ)</label><select id="a5TransferPostTarget">${UNITS.filter(u => u !== (i.intake.unit || state.caseData?.region)).map(u => `<option>${u}</option>`).join('')}</select></div><div class="ws-field"><label>เลขหนังสือของสองหน่วยงาน</label><input id="a5TransferPostLetter" placeholder="เช่น สปท 1/2569 / สปท 2/2569"></div><div class="ws-field"><label>รวมสำนวนกับ</label><input id="a5MergeWith" placeholder="เลขสำนวนหลัก (ใหม่รวมเข้าเก่า)"><button type="button" class="ws-button ghost" data-a5-action="merge-case">รวมสำนวน</button></div><div class="ws-field"><label>เปลี่ยนผู้รับผิดชอบ</label><select id="a5ChangeInvestigator">${INVESTIGATORS.map(x => `<option ${(i.inquiry644?.investigator || i.intake.investigator) === x ? 'selected' : ''}>${x}</option>`).join('')}</select><button type="button" class="ws-button ghost" data-a5-action="change-investigator">เปลี่ยนผู้รับผิดชอบ</button></div><div class="ws-field"><label>ปรับองค์คณะไต่สวน</label><button type="button" class="ws-button secondary" data-a5-action="org-change-request">เสนอ คกก. ปรับองค์คณะ</button></div><div class="ws-field"><label>แยกสำนวน</label><button type="button" class="ws-button secondary" data-a5-action="split-case">แยกเรื่องและออกเลขใหม่</button></div></div><div class="ws-actions"><button class="ws-button secondary" data-a5-action="transfer-post-request">ยื่นโอน (เสนอเลขาธิการ)</button></div></section>`;
  }

  /* ---------- actions + editor select ---------- */
  function captureDetail(state, role) {
    const i = ensureInquiry(state);
    const v = id => $('#' + id)?.value?.trim() || '';
    const cb = id => Boolean($('#' + id)?.checked);
    if (state.workflow?.stage === 'a5-intake') {
      i.intake.unit = v('a5Unit') || i.intake.unit; i.intake.director = v('a5Director') || i.intake.director;
      i.intake.investigator = v('a5Investigator') || i.intake.investigator;
      i.intake.team = v('a5Team') ? v('a5Team').split(',').map(s => s.trim()).filter(Boolean) : i.intake.team;
      i.intake.orderNo = v('a5OrderNo') || i.intake.orderNo; i.intake.orderDate = v('a5OrderDate') || i.intake.orderDate;
      const m62 = i.intake.m62 || {};
      m62.flag = cb('a5M62Flag'); m62.sourceLetter = v('a5M62Letter'); m62.sourceMtiDate = v('a5M62Date'); m62.ageCheck = v('a5M62Age');
      if (m62.flag) state.caseData.decision = '62';
    }
    if (state.workflow?.stage === 'a5-prelim') {
      i.prelim.plan = v('a5Plan') || i.prelim.plan; i.prelim.workLog = v('a5WorkLog') || i.prelim.workLog;
      i.prelim.issues.status = v('a5Issue_status'); i.prelim.issues.authority = v('a5Issue_authority'); i.prelim.issues.action = v('a5Issue_action'); i.prelim.issues.damage = v('a5Issue_damage');
      i.prelim.evidence = v('a5A6') || i.prelim.evidence; i.prelim.searchWarrant = v('a5A9') || i.prelim.searchWarrant; i.prelim.report = v('a5PrelimReport') || i.prelim.report;
    }
    if (state.workflow?.stage === 'a5-inquiry') {
      i.inquiry644.plan = v('a5Plan644') || i.inquiry644.plan;
      i.inquiry644.accused = v('a5Accused') ? v('a5Accused').split('\n').map(s => s.trim()).filter(Boolean) : i.inquiry644.accused;
      i.inquiry644.allegations = v('a5Allegations') || i.inquiry644.allegations;
      i.inquiry644.noticeSentAt = v('a5NoticeDate') || i.inquiry644.noticeSentAt;
      i.inquiry644.witnesses = v('a5Witnesses') ? v('a5Witnesses').split(',').map(s => s.trim()).filter(Boolean) : i.inquiry644.witnesses;
      i.inquiry644.statements = v('a5Statements') || i.inquiry644.statements;
      i.inquiry644.witnessProtection = v('a5InqA6') || i.inquiry644.witnessProtection; i.inquiry644.searchWarrant = v('a5InqA9') || i.inquiry644.searchWarrant;
      i.inquiry644.report = v('a5InqReport') || i.inquiry644.report;
    }
    if (state.workflow?.stage === 'a5-outcome') {
      i.outcome.letters = v('a5OutLetters') || i.outcome.letters; i.outcome.prosecutor = v('a5OutProsecutor') || i.outcome.prosecutor;
      i.outcome.disciplineAgency = v('a5OutDiscipline') || i.outcome.disciplineAgency; i.outcome.followup = v('a5OutFollowup') || i.outcome.followup;
      const m62 = i.intake.m62 || {};
      m62.report65Letter = v('a5M62Report'); m62.report65Date = v('a5M62ReportDate');
    }
    if (state.workflow?.stage === 'a5-prosecutor') {
      i.prosecutor.orderType = v('a5ProsecutorOrder') || i.prosecutor.orderType; i.prosecutor.orderDetail = v('a5ProsecutorDetail') || i.prosecutor.orderDetail; i.prosecutor.letters = v('a5ProsecutorLetters') || i.prosecutor.letters;
    }
    if (state.caseData?.decision === '58/2' || i.special.type) {
      i.special.type = v('a5SpecialType') || i.special.type; i.special.assignee = v('a5SpecialAssignee') || i.special.assignee;
      i.special.agency = v('a5SpecialAgency') || i.special.agency; i.special.reportedAt = v('a5SpecialDate') || i.special.reportedAt; i.special.result = v('a5SpecialResult') || i.special.result;
    }
    return state;
  }
  function editorForA5(state, role) {
    const stage = state.workflow?.stage || '';
    if (state.caseData?.decision === '58/2') return specialEditor(state, role);
    switch (stage) {
      case 'a5-intake': return intakeEditor(state, role);
      case 'a5-prelim': return prelimEditor(state, role);
      case 'a5-prelim-review': return prelimReviewEditor(state, role);
      case 'a7-213': return committee213Editor(state, role);
      case 'a5-inquiry': return inquiryEditor(state, role);
      case 'a5-inquiry-review': return inquiryReviewEditor(state, role);
      case 'a7-644': return committee644Editor(state, role);
      case 'a5-outcome': return outcomeEditor(state, role);
      case 'a5-prosecutor': return prosecutorEditor(state, role);
      case 'closed': return `<section class="ws-section"><div class="ws-callout">สำนวนปิดแล้ว — ${escapeHtml(state.inquiry?.outcome?.closedBy || '')} ${escapeHtml(state.inquiry?.outcome?.closedAt || '')}</div>${state.inquiry?.intake?.m62?.recalled ? '<p class="ws-policy-note">ป.ป.ช. เรียกสำนวนกลับไปดำเนินการเอง</p>' : ''}</section>`;
      default: return `<section class="ws-section"><div class="ws-callout">เฟส ${escapeHtml(stage)} — กำลังดำเนินการ</div></section>`;
    }
  }
  function actionsForA5(state, role) {
    const stage = state.workflow?.stage || '';
    if (state.caseData?.decision === '58/2') return '<button class="ws-button primary" data-a5-action="special-save">บันทึกผลการตรวจสอบ</button>';
    const reset = '<button class="ws-button ghost" data-a5-action="back">กลับรายการ</button>';
    switch (stage) {
      case 'a5-intake': return `${reset}<button class="ws-button primary" data-a5-action="accept-case">รับสำนวนและมอบหมายนักสืบ</button>`;
      case 'a5-prelim': return `${reset}<button class="ws-button secondary" data-a5-action="prelim-save">บันทึกร่าง</button>${role === 'investigator' ? '<button class="ws-button secondary" data-a5-action="prelim-plan">ส่งแผนคดีขออนุมัติ</button><button class="ws-button primary" data-a5-action="prelim-submit">เสนอรายงาน 213 ตามลำดับชั้น</button>' : ''}`;
      case 'a5-prelim-review': return `${reset}<button class="ws-button secondary" data-a5-action="chain-return">ส่งกลับแก้ไข</button>${state.inquiry?.prelim?.supportPending ? '<button class="ws-button primary" data-a5-action="support-record">รับทราบความเห็นอนุฯ — เสนอ คกก.</button>' : ''}`;
      case 'a7-213': {
        const cDone213 = (state.inquiry?.prelim?.extensionHistory || []).filter(h => h.role === 'committee').length;
        const late = state.inquiry?.prelim?.lateReport && cDone213 < 2;
        const cRound213 = state.inquiry?.prelim?.lateRound || cDone213 + 3;
        return late ? `${reset}<button class="ws-button primary" data-a5-action="ext-committee-approve">อนุมัติขยาย (ครั้งที่ ${cRound213})</button><button class="ws-button danger" data-a5-action="ext-committee-deny">ไม่อนุมัติขยาย</button>` : `${reset}<button class="ws-button primary" data-a5-action="mti213-decide">บันทึกมติ คกก.</button>`;
      }
      case 'a5-inquiry': return `${reset}<button class="ws-button secondary" data-a5-action="inquiry-save">บันทึกร่าง</button>${role === 'investigator' ? '<button class="ws-button primary" data-a5-action="inquiry-submit">เสนอรายงาน 644 ตามลำดับชั้น</button>' : ''}`;
      case 'a5-inquiry-review': return `${reset}<button class="ws-button secondary" data-a5-action="chain-return">ส่งกลับแก้ไข</button>${state.inquiry?.inquiry644?.supportPending ? '<button class="ws-button primary" data-a5-action="support-record">รับทราบความเห็นอนุฯ — เสนอ คกก.</button>' : ''}`;
      case 'a7-644': {
        const cDone644 = (state.inquiry?.inquiry644?.extensionHistory || []).filter(h => h.role === 'committee').length;
        const late = state.inquiry?.inquiry644?.lateReport && cDone644 < 2;
        const cRound644 = state.inquiry?.inquiry644?.lateRound || cDone644 + 5;
        return late ? `${reset}<button class="ws-button primary" data-a5-action="ext-committee-approve">อนุมัติขยาย (ครั้งที่ ${cRound644})</button><button class="ws-button danger" data-a5-action="ext-committee-deny">ไม่อนุมัติขยาย</button>` : `${reset}<button class="ws-button primary" data-a5-action="mti644-decide">บันทึกมติชี้มูล คกก.</button>`;
      }
      case 'a5-outcome': return `${reset}<button class="ws-button secondary" data-a5-action="outcome-save">บันทึกการดำเนินการ</button>${state.inquiry?.outcome?.type?.includes('อาญา') ? '<button class="ws-button primary" data-a5-action="send-prosecutor">ส่งอัยการ (กิจกรรมที่ 10)</button>' : ''}${state.inquiry?.intake?.m62?.flag ? '<button class="ws-button secondary" data-a5-action="m62-report">รายงานผลกลับ ป.ป.ช. (ม.65)</button>' : ''}${state.inquiry?.intake?.m62?.report65Letter ? '<button class="ws-button danger" data-a5-action="m62-recall">ป.ป.ช. เรียกสำนวนกลับ</button>' : ''}<button class="ws-button primary" data-a5-action="close-case">ปิดสำนวน</button>`;
      case 'a5-prosecutor': return `${reset}<button class="ws-button secondary" data-a5-action="prosecutor-order">บันทึกคำสั่งอัยการ</button><button class="ws-button primary" data-a5-action="prosecutor-return">ส่งผลกลับอัยการ + รายงาน คกก.</button>`;
      case 'closed': return `${reset}<button class="ws-button secondary" data-a5-action="reopen">เปิดสำนวนใหม่ (ทบทวนมติ)</button>`;
      default: return reset;
    }
  }

  function renderA5Detail(id, role) {
    const root = $('#a5App');
    if (!root) return;
    const state = getState(id);
    if (!state) { notify('error', 'ไม่พบสำนวน', id); return; }
    ensureInquiry(state);
    const c = state.caseData, w = state.workflow;
    const isSpecial = c.decision === '58/2';
    root.innerHTML = `${headerA5(role)}<main class="ws-container"><button class="ws-button ghost" id="a5BackList">กลับรายการสำนวน</button>
    <section class="ws-card ws-case-head"><div><p class="ws-kicker">${escapeHtml(c.channel || '')} · ${escapeHtml(state.inquiry.intake.unit || c.region || '')}</p><h1>${escapeHtml(c.id)}</h1><div class="ws-case-meta"><span>${escapeHtml(state.documentData?.documentSubject || c.subject)}</span><span>เลขรับบริการ ${c.trackingYear || ''} / PIN ${c.trackingCode || ''}</span><span>ผู้รับผิดชอบ: ${escapeHtml(state.inquiry.inquiry644?.investigator || state.inquiry.intake.investigator || 'ยังไม่มอบหมาย')}</span></div></div><div><span class="ws-status ${w.stage === 'closed' ? 'success' : ''}">${escapeHtml(phaseLabel(state))}</span><p style="margin:.4rem 0 0;font-size:.8rem;color:#687789">${escapeHtml(w.status || '')}</p></div></section>
    ${isSpecial ? '' : stagebarA5(state)}
    <div class="document-workspace"><section class="ws-card ws-editor"><header class="ws-editor-head"><div><p class="ws-kicker">${ROLE_LABELS[role] || role}</p><h2>${isSpecial ? 'ตรวจสอบข้อเท็จจริง' : 'ดำเนินการสำนวนคดี'}</h2></div><span class="ws-status">${escapeHtml(phaseLabel(state))}</span></header><div class="ws-editor-body">${editorForA5(state, role)}${adminCaseTools(state, role)}<div class="ws-section"><h3>ประวัติการตัดสินใจ</h3><ul class="ws-history">${(state.decisionHistory || []).map(x => `<li>${escapeHtml(x.text)}<time>${x.time}</time></li>`).join('') || '<li>ยังไม่มีประวัติ</li>'}</ul></div>${state.inquiry.publicUpdates.length ? `<div class="ws-section"><h3>สถานะที่ผู้ร้องเห็น</h3><ul class="ws-history">${state.inquiry.publicUpdates.map(x => `<li>${escapeHtml(x.text)}<time>${x.at}</time></li>`).join('')}</ul></div>` : ''}</div></section>
    <aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs">${docTabsA5(state)}</div><button class="ws-button secondary" data-a5-action="print">พิมพ์/PDF</button><button type="button" class="ws-button secondary ws-doc-pane-toggle" title="ย่อแผงเอกสาร" aria-label="ย่อแผงเอกสาร" aria-expanded="true" style="padding:.42rem .62rem;line-height:1">»</button></div><button type="button" class="ws-doc-pane-rail" title="ขยายแผงเอกสาร" aria-label="ขยายแผงเอกสาร">«<span>เอกสาร</span></button><div class="ws-paper-stage" id="a5PaperStage">${paperForTab(state, 'plan')}</div><div class="doc-edit-bar" id="a5DocEditBar" aria-label="จัดรูปแบบข้อความ"><select class="doc-edit-font" data-format="fontName" title="ฟอนต์"><option value="">ฟอนต์</option><option>Sarabun</option><option>TH Sarabun New</option><option>Tahoma</option><option>Times New Roman</option><option>Angsana New</option></select><select class="doc-edit-size" data-format="fontSize" title="ขนาดตัวอักษร"><option value="">ขนาด</option><option value="3">16</option><option value="4">18</option><option value="5">20</option><option value="6">24</option><option value="7">32</option></select><span class="doc-edit-bar-sep"></span><button type="button" data-format="bold" title="ตัวหนา"><b>B</b></button><button type="button" data-format="italic" title="ตัวเอียง"><i>I</i></button><button type="button" data-format="underline" title="ขีดเส้นใต้"><u>U</u></button><span class="doc-edit-bar-sep"></span><label class="doc-edit-color" title="สีตัวอักษร"><input type="color" data-format="foreColor" value="#17232e"></label><span class="doc-edit-bar-sep"></span><button type="button" data-format="justifyLeft" title="ชิดซ้าย">ซ้าย</button><button type="button" data-format="justifyCenter" title="กึ่งกลาง">กลาง</button><button type="button" data-format="justifyRight" title="ชิดขวา">ขวา</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="insertUnorderedList" title="รายการหัวข้อ">•≡</button><button type="button" data-format="insertOrderedList" title="รายการลำดับเลข">1≡</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="outdent" title="ลดย่อหน้า">⤺</button><button type="button" data-format="indent" title="เพิ่มย่อหน้า">⤻</button><span class="doc-edit-bar-sep"></span><button type="button" data-format="undo" title="เลิกทำ">↶</button><button type="button" data-format="redo" title="ทำซ้ำ">↷</button><span class="doc-edit-bar-sep"></span><span class="doc-edit-bar-tip">แก้ไขได้ทุกช่องบนฟอร์มจริง — ลากเลือกข้อความแล้วจัดรูปแบบ</span></div><button type="button" class="doc-edit-fab" id="a5DocEditFab" title="แก้ไขเอกสารเหมือน Word"><span class="doc-edit-fab-icon">✏️</span><span class="doc-edit-fab-label">แก้ไขเอกสาร</span></button></aside></div>
    <div class="ws-actions">${actionsForA5(state, role)}</div></main>`;
    $('#a5BackList').onclick = () => { view = 'list'; renderA5(role); };
    wireA5(state, role);
    wireA5Search(role);
    wireA5FontControls();
  }
  function docTabsA5(state) {
    const w = state.workflow || {}, stage = w.stage || '';
    const i = state.inquiry || {};
    const hasExt213 = (i.prelim?.extensionHistory || []).length > 0 || ['a5-prelim', 'a5-prelim-review', 'a7-213'].includes(stage);
    const hasExt644 = (i.inquiry644?.extensionHistory || []).length > 0;
    const inPrelim = ['a5-prelim', 'a5-prelim-review', 'a7-213'].includes(stage);
    const inInquiry = ['a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(stage);
    const tabs = [['plan', 'แผนงานคดี'], ['213', 'รายงาน 213']];
    if (hasExt213) tabs.push(['ext213', 'ขอขยาย 213']);
    if (inInquiry) {
      tabs.push(['644', 'รายงาน 644']);
      if (hasExt644) tabs.push(['ext644', 'ขอขยาย 644']);
      tabs.push(['notice', 'แจ้งข้อกล่าวหา'], ['record', 'บันทึกแจ้งข้อกล่าวหา']);
    }
    if (inPrelim || inInquiry) tabs.push(['mti', 'มติ คกก.']);
    if (['a5-outcome', 'a5-prosecutor', 'closed'].includes(stage)) tabs.push(['letters', 'หนังสืออัยการ'], ['warrants', 'หมายจับ']);
    return tabs.map(([k, l]) => `<button type="button" class="ws-doc-tab ${k === 'plan' ? 'active' : ''}" data-a5-doc="${k}">${l}</button>`).join('');
  }
  function fitA5Paper() {
    const stage = $('#a5PaperStage');
    if (!stage) return;
    const paper = stage.querySelector('.a5r-paper');
    if (!paper) return;
    const avail = (stage.clientWidth || 794) - 8;
    const s = Math.min(1, avail / 794);
    const pages = paper.querySelectorAll('.a5r-page').length || 1;
    if (s < 1) {
      paper.style.transform = `scale(${s})`;
      paper.style.width = `${Math.round(794 * s)}px`;
      paper.style.height = `${Math.round(1123 * s * pages)}px`;
    } else {
      paper.style.transform = '';
      paper.style.width = '';
      paper.style.height = '';
    }
  }
  function paperForTab(state, tab) {
    if (state.caseData?.decision === '58/2') return paperSpecial58(state);
    switch (tab) {
      case 'plan': return paperPlan(state);
      case '213': return paper213(state);
      case 'ext213': return paperExt(state, '213');
      case '644': return paper644(state);
      case 'ext644': return paperExt(state, '644');
      case 'notice': return paperNoticeAccusation(state);
      case 'record': return paperRecordAccusation(state);
      case 'letters': return paperProsecutorLetters(state);
      case 'warrants': return paperWarrants(state);
      case 'mti': return paperMti(state, state.workflow?.stage === 'a7-644' || state.workflow?.stage === 'a5-outcome' || state.workflow?.stage === 'a5-prosecutor' || state.workflow?.stage === 'closed' ? '644' : '213');
      case 'letter': return paperShell('หนังสือส่งสำนวนคดี', [['เลขที่', state.documentData?.dispatchLetterNo || ''], ['ถึง', state.inquiry.intake.unit || ''], ['วิธีจัดส่ง', state.documentData?.dispatchSendMethod || ''], ['เลข EMS', state.documentData?.dispatchEms || '']], `<p class="ws-paper-text">ส่งสำนวนคดี ${escapeHtml(state.caseData.id)} ไปยัง ${escapeHtml(state.inquiry.intake.unit || '')} เพื่อดำเนินการตามอำนาจหน้าที่ ตามมติ/คำสั่งที่เกี่ยวข้อง</p>`, [{ role: 'หัวหน้าพนักงาน ป.ป.ท.', name: state.inquiry.intake.director || '' }]);
      default: return paper213(state);
    }
  }

  /* ---------- Intelligent Suggest (port จาก A4 — ระบบรับเรื่องร้องเรียน) ---------- */
  function correctThaiWriting(value) {
    const replacements = [
      [/\s{2,}/g, ' '], [/เจา้หน้าที่/g, 'เจ้าหน้าที่'], [/จังหวะด/g, 'จังหวัด'], [/อัติโนมัติ/g, 'อัตโนมัติ'],
      [/ผอ\.?\s*ศรร\.?/g, 'ผู้อำนวยการศูนย์รับเรื่องร้องเรียน'], [/ผอ\.?\s*กบค\.?/g, 'ผู้อำนวยการกองบริหารคดี'], [/ป\.?ป\.?ช\.?/g, 'ป.ป.ช.'], [/ป\.?ป\.?ท\.?/g, 'ป.ป.ท.'],
      [/ส่งกลับไปแก้/g, 'ส่งกลับเพื่อแก้ไข'], [/เช็ค/g, 'ตรวจสอบ'], [/เบิกจ่ายเท็จ/g, 'เบิกจ่ายอันเป็นเท็จ'], [/ชี้มูลผิด/g, 'ชี้มูลความผิด']
    ];
    return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value || '')).trim();
  }
  function formalizeWriting(value) {
    return correctThaiWriting(value)
      .replace(/อยากให้/g, 'เห็นควรให้')
      .replace(/โอเค/g, 'เห็นชอบ')
      .replace(/ทำต่อ/g, 'ดำเนินการต่อ')
      .replace(/ส่งต่อไป/g, 'ส่งต่อเพื่อดำเนินการ')
      .replace(/ไม่จบ/g, 'ไม่แล้วเสร็จ')
      .replace(/ไปดู/g, 'ไปตรวจสอบ');
  }
  const A5_SUGGESTION_STORAGE_KEY = 'ecmis-a5-suggestions-v1';
  const A5_DEFAULT_SUGGESTIONS = {
    keywords: ['โปรดตรวจสอบข้อเท็จจริงเพิ่มเติม', 'เอกสารประกอบยังไม่ครบถ้วน', 'รอเอกสารหลักฐานจากหน่วยงานที่เกี่ยวข้อง', 'เสนอให้สอบปากคำพยานเพิ่มเติม'],
    notAcceptReasons: ['ข้อเท็จจริงไม่เพียงพอต่อการดำเนินการ', 'ไม่อยู่ในอำนาจหน้าที่ของสำนักงาน ป.ป.ท.', 'ไม่ปรากฏพฤติการณ์หรือบุคคลที่เกี่ยวข้องชัดเจน', 'เรื่องอยู่ระหว่างการพิจารณาของหน่วยงานอื่น'],
    contexts: {
      a5Plan: ['รวบรวมพยานหลักฐานจากหน่วยงานต้นสังกัด', 'สอบปากคำผู้กล่าวหาและพยานบุคคลที่เกี่ยวข้อง', 'ตรวจสอบสถานที่เกิดเหตุและจัดทำแผนที่', 'ขอเอกสารการจัดซื้อจัดจ้างและหลักฐานการเงิน', 'รอผลการตรวจสอบจากหน่วยงานภายนอก'],
      a5WorkLog: ['ได้รวบรวมพยานหลักฐานและเอกสารที่เกี่ยวข้องแล้ว', 'สอบปากคำผู้ที่เกี่ยวข้องจำนวน 3 ปาก', 'ขอข้อมูลเพิ่มเติมจากหน่วยงานต้นสังกัดแล้ว', 'ตรวจสอบข้อเท็จจริงและประเด็นแห่งคดีครบถ้วน'],
      a5Allegations: ['ร้องเรียนการจัดซื้อจัดจ้างไม่เป็นไปตามระเบียบ', 'การใช้อำนาจโดยมิชอบของเจ้าหน้าที่รัฐ', 'การเรียกรับผลประโยชน์เพื่อแลกกับการอนุมัติ', 'การเบิกจ่ายงบประมาณอันเป็นเท็จ'],
      a5Accused: ['นาย', 'นาง', 'นางสาว'],
      a5ChainOpinion: ['เห็นชอบตามความเห็นและข้อเสนอของผู้รับผิดชอบสำนวน', 'ตรวจสอบข้อเท็จจริงและรวบรวมเอกสารเพิ่มเติมก่อนเสนอ', 'เห็นควรเสนอคณะกรรมการพิจารณา', 'ส่งกลับให้แก้ไขรายงานให้ครบถ้วน'],
      a5CommitteeExtOpinion: ['อนุมัติให้ขยายระยะเวลาออกไปอีก', 'ไม่อนุมัติให้ขยายระยะเวลา — ให้เร่งรัดดำเนินการ', 'ให้รายงานความคืบหน้าทุก 15 วัน', 'ครั้งสุดท้ายแล้ว หากยังไม่แล้วเสร็จให้เสนอคณะกรรมการพิจารณา'],
      a5Mti213Note: ['มติรับไว้ไต่สวน — ตั้งคณะอนุกรรมการไต่สวนตาม ม.24 ว.3', 'มติรับไว้ไต่สวน — ตั้งคณะพนักงานไต่สวนตาม ม.24 ว.1', 'ไม่รับไว้ไต่สวน — สิทธิฟ้องระงับตาม ม.25-26', 'ส่งสำนักงาน ป.ป.ช. ตาม ม.18/1(ข)(3)'],
      a5Mti644Note: ['ชี้มูลความผิดอาญาและวินัย — ส่งอัยการและต้นสังกัด', 'ชี้มูลวินัยอย่างเดียว — ส่งต้นสังกัดดำเนินการ', 'ยุติเรื่อง — ข้อกล่าวหาไม่มีมูล', 'ส่งพนักงานสอบสวนดำเนินคดีอาญา'],
      a5SpecialResult: ['ตรวจสอบข้อเท็จจริงแล้วไม่พบพฤติการณ์ทุจริต', 'พบความเดือดร้อนของประชาชน — แจ้งหน่วยงานแก้ไข', 'พบพฤติการณ์ทุจริต — เปลี่ยนเส้นทางเข้าคดี', 'แจ้งสำนักงานการตรวจเงินแผ่นดิน (สตง.) ตาม ม.58/3'],
      a5SupportOpinion: ['เห็นสอดคล้องกับคณะพนักงานไต่สวน — เสนอคณะกรรมการพิจารณา', 'มีความเห็นเพิ่มเติมให้ตรวจสอบประเด็น', 'เห็นควรให้รวบรวมพยานหลักฐานเพิ่มเติม']
    },
    usage: {}
  };
  function a5ReadSuggestions() {
    try {
      const stored = JSON.parse(localStorage.getItem(A5_SUGGESTION_STORAGE_KEY) || 'null');
      if (!stored) return structuredClone(A5_DEFAULT_SUGGESTIONS);
      return { ...structuredClone(A5_DEFAULT_SUGGESTIONS), ...stored, contexts: { ...structuredClone(A5_DEFAULT_SUGGESTIONS.contexts), ...(stored.contexts || {}) }, usage: stored.usage || {} };
    } catch { return structuredClone(A5_DEFAULT_SUGGESTIONS); }
  }
  function a5WriteSuggestions(settings) { localStorage.setItem(A5_SUGGESTION_STORAGE_KEY, JSON.stringify(settings)); }
  function a5LearnContextSuggestion(context, value) {
    const text = String(value || '').trim().replace(/\s+/g, ' ');
    if (text.length < 8 || text.length > 160) return;
    const settings = a5ReadSuggestions();
    const usageKey = `${context}:${text}`;
    settings.usage[usageKey] = (settings.usage[usageKey] || 0) + 1;
    settings.contexts[context] = settings.contexts[context] || [];
    if (settings.usage[usageKey] >= 2 && !settings.contexts[context].includes(text)) settings.contexts[context].unshift(text);
    a5WriteSuggestions(settings);
  }
  function a5ContextualSuggestions(context, value) {
    const settings = a5ReadSuggestions();
    const unique = [...(settings.contexts[context] || []), ...settings.keywords].filter((text, index, array) => array.indexOf(text) === index && !value.includes(text));
    const terms = value.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    return unique.map((text, index) => ({ text, index, score: terms.reduce((score, term) => score + (text.toLowerCase().includes(term) ? 2 : 0), 0) + (settings.usage[`${context}:${text}`] || 0) })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3).map(item => item.text);
  }
  function attachIntelligentSuggestion(id, label, context = id) {
    const input = $(`#${id}`);
    if (!input || input.parentElement?.querySelector(`.smart-inline[data-context="${context}"]`)) return;
    input.closest('.ws-field')?.classList.add('smart-field');
    const panel = document.createElement('div');
    panel.className = 'smart-inline';
    panel.dataset.context = context;
    const popoverId = `smart-inline-${id}`;
    panel.innerHTML = `<button type="button" class="smart-inline-trigger" aria-expanded="false" aria-controls="${popoverId}"><span class="smart-inline-dot"></span><span>คำแนะนำการเขียน</span><small>พร้อมตรวจ</small></button><div class="smart-inline-popover ws-hidden" id="${popoverId}" role="listbox"></div>`;
    input.insertAdjacentElement('afterend', panel);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', popoverId);
    input.setAttribute('aria-expanded', 'false');
    const trigger = $('.smart-inline-trigger', panel), popover = $('.smart-inline-popover', panel);
    let closeTimer = 0, renderTimer = 0, activeIndex = -1;
    const open = () => { clearTimeout(closeTimer); panel.classList.add('open'); popover.classList.remove('ws-hidden'); trigger.setAttribute('aria-expanded', 'true'); input.setAttribute('aria-expanded', 'true'); };
    const close = () => { panel.classList.remove('open'); popover.classList.add('ws-hidden'); trigger.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-expanded', 'false'); activeIndex = -1; };
    const applyValue = value => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); panel.classList.add('suggestion-selected'); setTimeout(() => panel.classList.remove('suggestion-selected'), 420); };
    const render = () => {
      const value = input.value.trim(), corrected = correctThaiWriting(value), formal = formalizeWriting(value), suggestions = a5ContextualSuggestions(context, value);
      const actions = [];
      if (value && corrected !== value) actions.push(`<button type="button" role="option" class="smart-inline-action" data-smart-value="${escapeHtml(corrected)}"><span>แก้คำและช่องว่าง</span><small>${escapeHtml(corrected)}</small></button>`);
      if (value && formal !== value && formal !== corrected) actions.push(`<button type="button" role="option" class="smart-inline-action" data-smart-value="${escapeHtml(formal)}"><span>ปรับเป็นภาษาราชการ</span><small>${escapeHtml(formal)}</small></button>`);
      const suggestionHtml = suggestions.map(text => `<button type="button" role="option" class="smart-inline-suggestion" data-smart-suggestion="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('');
      popover.innerHTML = `${actions.join('')}${suggestionHtml ? `<div class="smart-inline-suggestions"><span>${value ? 'ข้อความที่เกี่ยวข้อง' : 'เริ่มต้นด้วยข้อความแนะนำ'}</span>${suggestionHtml}</div>` : ''}${!actions.length && !suggestions.length ? '<p class="smart-inline-clear">ข้อความชัดเจนแล้ว</p>' : ''}`;
      $('small', trigger).textContent = actions.length ? `พบ ${actions.length} จุดที่ปรับได้` : suggestions.length ? `${suggestions.length} ข้อเสนอ` : 'ตรวจแล้ว';
      $$('[data-smart-value]', popover).forEach(button => button.onclick = () => applyValue(button.dataset.smartValue));
      $$('[data-smart-suggestion]', popover).forEach(button => button.onclick = () => { const text = button.dataset.smartSuggestion; if (input.tagName === 'INPUT') applyValue(text); else if (!input.value.includes(text)) applyValue([input.value.trim(), text].filter(Boolean).join('\n')); });
      activeIndex = -1;
    };
    trigger.onclick = () => { render(); panel.classList.contains('open') ? close() : open(); };
    input.addEventListener('focus', () => { render(); open(); });
    input.addEventListener('input', () => { clearTimeout(renderTimer); renderTimer = setTimeout(() => { render(); open(); }, 180); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' || event.key === 'Tab') { close(); return; }
      if (event.ctrlKey && event.code === 'Space') { event.preventDefault(); render(); open(); return; }
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
      const options = $$('[role="option"]', popover);
      if (!options.length) return;
      if (event.key === 'Enter') { if (activeIndex < 0) return; event.preventDefault(); options[activeIndex].click(); return; }
      event.preventDefault();
      open();
      activeIndex = event.key === 'ArrowDown' ? (activeIndex + 1) % options.length : (activeIndex - 1 + options.length) % options.length;
      options.forEach((option, index) => option.classList.toggle('is-active', index === activeIndex));
      options[activeIndex].scrollIntoView({ block: 'nearest' });
    });
    input.addEventListener('blur', () => { closeTimer = setTimeout(close, 180); });
    panel.addEventListener('mousedown', event => event.preventDefault());
    input.addEventListener('change', () => a5LearnContextSuggestion(context, input.value));
    render();
  }
  function wireA5Suggestions() {
    ['a5Plan', 'a5Plan644', 'a5WorkLog', 'a5Allegations', 'a5ChainOpinion', 'a5CommitteeExtOpinion', 'a5Mti213Note', 'a5Mti644Note', 'a5SpecialResult', 'a5SupportOpinion', 'a5SupportOpinion644'].forEach(id => attachIntelligentSuggestion(id, 'คำแนะนำการเขียน', id));
  }
  function wireA5(state, role) {
    ThaiDatePicker.wireAll($('#a5App'));
    wireA5Suggestions();
    /* ---------- Word Engine A5: แก้ไขเอกสารบนฟอร์มจริง (เหมือน Word) ---------- */
    const docStage = $('#a5PaperStage'), docFab = $('#a5DocEditFab'), docBar = $('#a5DocEditBar');
    const applyHtmlOverrides = () => {
      if (!state.inquiry?.docEdits) return;
      $$('#a5PaperStage .a5-fill[data-htmlslot]').forEach(el => {
        const ov = state.inquiry.docEdits[el.dataset.htmlslot];
        if (ov !== undefined) el.textContent = ov;
      });
    };
    const a5SetEditMode = on => {
      if (on) {
        $$('#a5PaperStage [data-slot]').forEach(s => s.setAttribute('contenteditable', 'true'));
        $$('#a5PaperStage .a5-fill').forEach((el, i) => {
          if (!el.dataset.htmlslot) el.dataset.htmlslot = 'html-' + ($('.ws-doc-tab.active')?.dataset?.a5Doc || 'paper') + '-' + i;
          el.setAttribute('contenteditable', 'true');
        });
        // เอกสาร HTML (ไม่ใช่ภาพฟอร์ม) — แก้ได้ทั้งเอกสาร เหมือนระบบรับเรื่อง
        $$('#a5PaperStage .a5-paper:not(.a5r-paper)').forEach(p => p.setAttribute('contenteditable', 'true'));
        $$('#a5PaperStage .a5-lock').forEach(el => el.setAttribute('contenteditable', 'false'));
      } else {
        $$('#a5PaperStage [data-slot], #a5PaperStage .a5-fill').forEach(s => s.removeAttribute('contenteditable'));
        $$('#a5PaperStage .a5-paper:not(.a5r-paper)').forEach(p => p.removeAttribute('contenteditable'));
        $$('#a5PaperStage .a5-lock').forEach(el => el.removeAttribute('contenteditable'));
      }
      docStage?.classList.toggle('doc-edit-mode', on);
      docFab?.classList.toggle('active', on);
      docBar?.classList.toggle('show', on);
      if (on) applyHtmlOverrides();
    };
    if (docStage && !docStage.dataset.wordBound) {
      docStage.dataset.wordBound = '1';
      let docEditTimer = 0;
      const flushDocEdits = () => { if (state.inquiry?.docEdits) saveState(state.caseData.id, state); };
      docStage.addEventListener('input', e => {
        const slot = e.target.closest('[data-slot], [data-htmlslot]');
        if (!slot) return;
        state.inquiry = state.inquiry || {};
        state.inquiry.docEdits = state.inquiry.docEdits || {};
        state.inquiry.docEdits[slot.dataset.slot || slot.dataset.htmlslot] = slot.textContent;
        clearTimeout(docEditTimer);
        docEditTimer = setTimeout(flushDocEdits, 400);
      });
      // blur: บันทึกเท่านั้น ไม่ re-render (ฟอร์มรูปจริง layout คงที่ — re-render ทำลาย selection/scroll)
      docStage.addEventListener('blur', e => {
        const slot = e.target.closest('[data-slot], [data-htmlslot]');
        if (!slot) return;
        if (state.inquiry?.docEdits) { clearTimeout(docEditTimer); flushDocEdits(); }
      }, true);
      // delegation ระดับ document: ปุ่ม FAB/format bar ทนต่อทุก re-render (re-resolve องค์ประกอบทุกคลิก)
      if (!document.__a5WordBound) {
        document.__a5WordBound = '1';
        const toggleEditMode = () => {
          const stage = $('#a5PaperStage');
          if (!stage) return;
          const on = !stage.classList.contains('doc-edit-mode');
          const tab = $('.ws-doc-tab.active')?.dataset?.a5Doc || 'paper';
          const fills = $$('#a5PaperStage .a5-fill');
          $$('#a5PaperStage .a5-paper:not(.a5r-paper), #a5PaperStage [data-slot], #a5PaperStage .a5-fill').forEach(el => {
            if (on) {
              if (el.classList.contains('a5-fill') && !el.dataset.htmlslot) el.dataset.htmlslot = 'html-' + tab + '-' + fills.indexOf(el);
              el.setAttribute('contenteditable', 'true');
            } else el.removeAttribute('contenteditable');
          });
          $$('#a5PaperStage .a5-lock').forEach(el => on ? el.setAttribute('contenteditable', 'false') : el.removeAttribute('contenteditable'));
          stage.classList.toggle('doc-edit-mode', on);
          $('#a5DocEditFab')?.classList.toggle('active', on);
          $('#a5DocEditBar')?.classList.toggle('show', on);
        };
        document.addEventListener('click', e => {
          if (e.target.closest('#a5DocEditFab')) { toggleEditMode(); return; }
          const fmt = e.target.closest('[data-format]');
          if (fmt) document.execCommand(fmt.dataset.format);
        });
        document.addEventListener('change', e => {
          const fmt = e.target.closest('[data-format]');
          if (fmt && e.target.value) document.execCommand(fmt.dataset.format, false, e.target.value);
        });
        document.addEventListener('mousedown', e => {
          if (e.target.closest('.doc-edit-bar') && !e.target.closest('select, input, label')) e.preventDefault();
        }, true);
        window.addEventListener('resize', () => fitA5Paper());
      }
      // MutationObserver: ทุกครั้งที่ stage ถูก re-render (สลับแท็บ/action) ให้คง edit mode + scale หน้ากระดาษ
      const docEditObserver = new MutationObserver(() => {
        if (docStage?.classList.contains('doc-edit-mode')) a5SetEditMode(true);
        fitA5Paper();
      });
      docEditObserver.observe(docStage, { childList: true });
      fitA5Paper();
    }
    // ปุ่มย่อ/ขยายแผงเอกสาร (เหมือนระบบรับเรื่อง)
    const a5DocWs = document.querySelector('#a5App .document-workspace');
    if (a5DocWs && !a5DocWs.dataset.paneBound) {
      a5DocWs.dataset.paneBound = '1';
      const setPaneCollapsed = collapsed => {
        a5DocWs.classList.toggle('pane-collapsed', collapsed);
        const toggle = $('.ws-doc-pane-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', String(!collapsed));
        try { localStorage.setItem('ecmis-a5-docpane-collapsed', collapsed ? '1' : '0'); } catch {}
        setTimeout(() => fitA5Paper(), 60);
      };
      try { if (localStorage.getItem('ecmis-a5-docpane-collapsed') === '1') setPaneCollapsed(true); } catch {}
      a5DocWs.addEventListener('click', e => {
        const t = e.target.closest('.ws-doc-pane-toggle, .ws-doc-pane-rail');
        if (!t) return;
        if (t.classList.contains('ws-doc-pane-rail')) setPaneCollapsed(false);
        else setPaneCollapsed(!a5DocWs.classList.contains('pane-collapsed'));
      });
    }
    // ลากแถบจัดรูปแบบ + ปุ่มแก้ไขเอกสารไปมาได้อิสระ (จำตำแหน่งไว้)
    const makeDraggable = (el, storageKey) => {
      if (!el || el.dataset.dragBound) return;
      el.dataset.dragBound = '1';
      el.style.cursor = 'grab';
      el.style.touchAction = 'none';
      let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, dragging = false;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const [lx, ly] = saved.split(',').map(Number);
          if (Number.isFinite(lx) && Number.isFinite(ly)) {
            el.style.position = 'fixed';
            el.style.left = lx + 'px';
            el.style.top = ly + 'px';
            el.style.transform = 'none';
            el.style.margin = '0';
          }
        }
      } catch {}
      el.addEventListener('pointerdown', e => {
        if (el !== docFab && e.target.closest('button, select, input, a')) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
        moved = false; dragging = true;
        el.style.position = 'fixed';
        el.style.left = ox + 'px';
        el.style.top = oy + 'px';
        el.style.transform = 'none';
        el.style.margin = '0';
        el.style.transition = 'none';
        el.style.cursor = 'grabbing';
        try { el.setPointerCapture(e.pointerId); } catch {}
      });
      el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 3) moved = true;
        if (!moved) return;
        const nx = ox + dx, ny = oy + dy;
        el.style.left = Math.max(0, Math.min(nx, (window.innerWidth || 1200) - 40)) + 'px';
        el.style.top = Math.max(0, Math.min(ny, (window.innerHeight || 800) - 40)) + 'px';
      });
      const endDrag = e => {
        if (!dragging) return;
        dragging = false;
        el.style.cursor = 'grab';
        el.style.transition = '';
        if (moved) {
          try { localStorage.setItem(storageKey, el.style.left + ',' + el.style.top); } catch {}
        }
      };
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('click', e => { if (moved) { e.stopPropagation(); moved = false; } });
    };
    makeDraggable(docBar, 'ecmis-a5-docbar-pos');
    $$('#a5App [data-a5-doc]').forEach(b => b.onclick = () => {
      $$('#a5App [data-a5-doc]').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', String(on)); });
      $('#a5PaperStage').innerHTML = paperForTab(captureDetail(state, role), b.dataset.a5Doc);
    });
    $('#a5App').onclick = async event => {
      const actionButton = event.target.closest('[data-a5-action]');
      if (!actionButton) return;
      const action = actionButton.dataset.a5Action;
      if (action === 'print') { window.print(); return; }
      if (action === 'back') { view = 'list'; renderA5(role); return; }
      event.preventDefault();
      const st = captureDetail(getState(state.caseData.id), role);
      const i = st.inquiry, w = st.workflow;
      const add = text => { st.decisionHistory = st.decisionHistory || []; st.decisionHistory.push({ text, time: now() }); };
      const v = id => $('#' + id)?.value?.trim() || '';
      const cb = id => Boolean($('#' + id)?.checked);
      const popup = (title, fields, confirmText) => swalForm(title, `<div id="swalForm">${fields.map(([id, label, type = 'text', ph = '']) => type === 'checkbox' ? `<label class="ws-choice" style="text-align:left;margin-bottom:.5rem"><input data-sf="${id}" type="checkbox" ${ph ? 'checked' : ''}><span><strong>${label}</strong></span></label>` : type === 'select' ? `<div class="ws-field" style="text-align:left"><label>${label}</label><select data-sf="${id}" style="width:100%;padding:.55rem;border:1px solid #c9d2dc;border-radius:.5rem;background:#fff">${String(ph).split('|').map(o => `<option>${o}</option>`).join('')}</select></div>` : `<div class="ws-field" style="text-align:left"><label>${label}</label><input data-sf="${id}" type="${type}" placeholder="${ph}" style="width:100%;padding:.55rem;border:1px solid #c9d2dc;border-radius:.5rem"></div>`).join('')}</div>`, confirmText);

      if (action === 'accept-case') {
        if (i.intake.m62?.flag && !i.intake.m62.ageCheck) return notify('warning', 'คดี ม.62 ต้องตรวจอำนาจก่อน', 'กรอกผลตรวจอำนาจ/อายุความ (ถ้าเหลือ <6 เดือน ต้องส่งคืน ป.ป.ช.)');
        if (!i.intake.investigator) return notify('warning', 'ยังไม่ได้เลือกผู้รับผิดชอบ', 'มอบหมายนักสืบ (พนักงาน ป.ป.ท.) ก่อนรับสำนวน');
        if (!i.intake.orderNo || !i.intake.orderDate) return notify('warning', 'ยังไม่มีคำสั่ง/หนังสือมอบหมาย', 'กรอกเลขที่และวันที่คำสั่ง');
        w.stage = 'a5-prelim'; w.owner = 'investigator'; w.status = 'รอนักสืบจัดทำแผนคดี'; i.status = 'prelim';
        i.intake.assignedAt = now(); i.intake.acceptedAt = now();
        i.prelim.startedAt = i.prelim.startedAt || i.intake.receivedFirstAt || todayISO();
        i.prelim.deadlineAt = addDays(i.prelim.startedAt, 60);
        add(`${ROLE_LABELS[role]} รับสำนวนและมอบหมาย ${i.intake.investigator} (${i.intake.unit}) — เริ่มนับ 60 วันจาก ${i.prelim.startedAt}`);
        publish(st, `สำนักงานรับเรื่องของท่านไว้แล้ว อยู่ระหว่างไต่สวนเบื้องต้น (ครบ ${i.prelim.deadlineAt})`);
      }
      if (action === 'transfer-request') {
        const target = v('a5TransferTarget'), note = v('a5TransferNoteReq');
        if (!target) return notify('warning', 'เลือกหน่วยงานปลายทาง', '');
        i.intake.transfer = { status: 'PENDING', target, note, by: ROLE_LABELS[role], at: now() };
        w.status = `รอปลายทางรับโอน (${target})`; add(`ส่งคำขอโอนไป ${target} — สถานะรอปลายทางรับโอน (ยังไม่มอบหมายผู้รับผิดชอบ)`);
      }
      if (action === 'transfer-accept') {
        i.intake.transfer.status = 'APPROVED'; i.intake.unit = i.intake.transfer.target; w.status = 'รับโอนแล้ว — รอมอบหมายผู้รับผิดชอบ';
        add(`ปลายทางรับโอน: ${i.intake.unit} — กรอบเวลาไม่เริ่มใหม่`); publish(st, `โอนสำนวนไปยัง ${i.intake.unit}`);
      }
      if (action === 'transfer-reject') {
        i.intake.transfer.status = 'REJECTED'; w.status = 'ปลายทางปฏิเสธการรับโอน — เรื่องคงอยู่ที่สำนักงานเดิม';
        add(`ปลายทางปฏิเสธการรับโอน${v('a5TransferNote') ? ` (${v('a5TransferNote')})` : ''} — เรื่องคงอยู่ที่สำนักงานเดิม`);
      }
      if (action === 'prelim-save') { add('บันทึกร่างไต่สวนเบื้องต้น'); }
      if (action === 'prelim-plan') {
        if (!i.prelim.plan) return notify('warning', 'ยังไม่มีแผนคดี', 'กรอกแผนงานคดีก่อนส่งขออนุมัติ');
        i.prelim.planStatus = 'รออนุมัติจากหัวหน้าพนักงาน'; w.status = 'รอ ผอ. อนุมัติแผนคดี'; add('นักสืบส่งแผนคดีขออนุมัติจากหัวหน้าพนักงาน ป.ป.ท.');
      }
      if (action === 'plan-approve-213') { i.prelim.planStatus = 'approved'; i.prelim.planApprovedBy = ROLE_LABELS[role]; i.prelim.planApprovedAt = now(); add(`${ROLE_LABELS[role]} อนุมัติแผนคดี 213`); }
      if (action === 'plan-approve-644') { i.inquiry644.planStatus = 'approved'; i.inquiry644.planApprovedBy = ROLE_LABELS[role]; i.inquiry644.planApprovedAt = now(); add(`${ROLE_LABELS[role]} อนุมัติแผนคดี 644`); }
      if (action === 'prelim-submit') {
        if (!i.prelim.plan || i.prelim.planStatus !== 'approved') return notify('warning', 'แผนคดีไม่ครบ', 'จัดทำแผนคดีและรออนุมัติจากหัวหน้าพนักงานก่อนเสนอ 213');
        if (!i.prelim.report) return notify('warning', 'ยังไม่มีสรุปรายงาน 213', 'สรุปผลและความเห็นก่อนเสนอตามลำดับชั้น');
        const fast = await popup('เสนอรายงาน 213', [['a5FastTrack', 'เร่งด่วน (ใบด่วน — ใกล้ขาดอายุความ)?', 'checkbox']], 'เสนอ');
        i.prelim.fastTrack = Boolean(fast.value?.a5FastTrack);
        if (i.prelim.fastTrack) { w.stage = 'a7-213'; w.owner = 'committee'; w.status = 'ใบด่วน — คกก. พิจารณา 213 (ขอบรรจุวาระเร่งด่วน)'; i.committee213.note = `${i.committee213.note || ''}\n[ใบด่วน] ขอบรรจุวาระการประชุมเร่งด่วนพร้อมเหตุผลอันสมควร`; add('เสนอรายงาน 213 แบบใบด่วน (เร่งด่วน) — ตรงเข้าคณะกรรมการ'); }
        else { w.stage = 'a5-prelim-review'; w.owner = 'group-director'; w.status = 'รอตรวจตามลำดับชั้น (ผอ.กลุ่ม → ผอ.เขต/กอง → ผู้ช่วย/รองเลขาธิการ → เลขาธิการ)'; i.prelim.submittedAt = now(); add('นักสืบเสนอรายงาน 213 ตามลำดับชั้น'); }
      }
      if (action === 'chain-approve') {
        const reportType = reportTypeForStage(w.stage);
        const opinion = v('a5ChainOpinion') || '';
        if (!opinion) return notify('warning', 'ยังไม่มีความเห็น', 'บันทึกความเห็นก่อนเห็นชอบ');
        if (reportType === '213' && role === 'secretary' && cb('a5SupportFlag')) {
          i.prelim.supportPending = true; i.prelim.supportBy = ROLE_LABELS[role]; w.status = 'คณะอนุกรรมการสนับสนุนเลขาธิการฯ พิจารณา (ยุ่งยากซับซ้อน)';
          const r = chainApprove(st, reportType, role, opinion); add(`${ROLE_LABELS[role]} เห็นชอบรายงาน 213 — ส่งคณะอนุกรรมการสนับสนุนฯ ให้ความเห็นประกอบ`);
        } else if (reportType === '644' && role === 'secretary' && cb('a5SupportFlag')) {
          i.inquiry644.supportPending = true; i.inquiry644.supportBy = ROLE_LABELS[role]; w.status = 'คณะอนุกรรมการสนับสนุนเลขาธิการฯ พิจารณา (644)';
          chainApprove(st, reportType, role, opinion); add(`${ROLE_LABELS[role]} เห็นชอบรายงาน 644 — ส่งคณะอนุกรรมการสนับสนุนฯ`);
        } else {
          const r = chainApprove(st, reportType, role, opinion);
          if (!r.ok) return notify('warning', 'ไม่สามารถตรวจได้', r.message);
          if (r.complete) { w.stage = reportType === '213' ? 'a7-213' : 'a7-644'; w.owner = 'committee'; w.status = `รอคณะกรรมการ ป.ป.ท. พิจารณา (${reportType})`; add(`ตรวจรายงาน ${reportType} ครบทุกชั้น — เสนอคณะกรรมการ (กิจกรรมที่ 7)`); }
          else { w.status = `รอ ${ROLE_LABELS[r.current.role]} ตรวจ (ชั้น ${r.current.label})`; w.owner = r.current.role; add(`${ROLE_LABELS[role]} เห็นชอบรายงาน ${reportType} — ส่งชั้นถัดไป`); }
        }
      }
      if (action === 'chain-skip-group') {
        const reportType = reportTypeForStage(w.stage);
        const r = chainSkipGroup(st, reportType, role, v('a5ChainOpinion'));
        if (!r.ok) return notify('warning', 'ข้ามไม่ได้', r.message);
        add('ข้ามชั้น ผอ.กลุ่มงาน (ไม่อยู่ในสายงานของสำนวน)');
      }
      if (action === 'chain-return') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        w.stage = reportType === '213' ? 'a5-prelim' : 'a5-inquiry'; w.owner = 'investigator'; w.status = `ส่งกลับ — ไต่สวน${reportType === '213' ? 'เบื้องต้น' : 'ชี้มูล'}เพิ่มเติม (30 วัน)`;
        rep.additionalDeadlineAt = addDays(todayISO(), 30); rep.additionalExtendedOnce = false;
        add(`${ROLE_LABELS[role]} ส่งกลับรายงาน ${reportType} — ไต่สวนเพิ่มเติมภายใน 30 วัน`);
      }
      if (action === 'support-record') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        if (reportType === '213') i.prelim.supportOpinion = v('a5SupportOpinion'); else i.inquiry644.supportOpinion = v('a5SupportOpinion644');
        rep.supportPending = false;
        w.stage = reportType === '213' ? 'a7-213' : 'a7-644'; w.owner = 'committee'; w.status = `คกก. พิจารณา (${reportType}) พร้อมความเห็นอนุกรรมการสนับสนุนฯ`;
        add(`คณะอนุกรรมการสนับสนุนฯ ให้ความเห็นประกอบรายงาน ${reportType} — เสนอคณะกรรมการ`);
      }
      if (action === 'mti213-decide') {
        const result = $('input[name="a5Mti213"]:checked')?.value;
        if (!result) return notify('warning', 'ยังไม่ได้เลือกผลมติ', '');
        i.committee213.result = result; i.committee213.mtiNo = v('a5Mti213No'); i.committee213.mtiDate = v('a5Mti213Date'); i.committee213.note = v('a5Mti213Note');
        i.committee213.decidedAt = now(); i.committee213.decidedBy = ROLE_LABELS[role];
        add(`คณะกรรมการ ป.ป.ท. มีมติ 213: ${result}${i.committee213.mtiNo ? ` (${i.committee213.mtiNo})` : ''}`);
        if (result === 'รับไว้ไต่สวน') {
          i.committee213.orderType = v('a5OrderType') || (role === 'secretary' ? '24v1' : '24v3');
          i.committee213.orderNo = i.committee213.orderNo || issueOrderNo213();
          i.committee213.orderDate = i.committee213.orderDate || todayISO();
          i.committee213.investigator644 = v('a5Investigator644') || i.intake.investigator;
          i.committee213.handoverDoc = { flag: i.committee213.investigator644 !== i.intake.investigator, letterNo: v('a5Handover'), date: todayISO() };
          w.stage = 'a5-inquiry'; w.owner = 'investigator'; w.status = 'รอคำสั่งแต่งตั้งชุดไต่สวน';
          i.inquiry644.investigator = i.committee213.investigator644;
          i.inquiry644.startedAt = i.committee213.orderType === '24v3' ? (i.committee213.mtiDate || todayISO()) : (i.committee213.orderDate || todayISO());
          i.inquiry644.deadlineAt = addDays(i.inquiry644.startedAt, 270);
          if (i.committee213.handoverDoc.flag && !i.committee213.handoverDoc.letterNo) return notify('warning', 'ต้องมีหนังสือส่งมอบสำนวน', `ผู้รับผิดชอบ 213 (${i.intake.investigator}) กับ 644 (${i.committee213.investigator644}) เป็นคนละคน — กรอกเลขหนังสือส่งมอบ`);
          publish(st, `คณะกรรมการรับไว้ไต่สวนแล้ว — อยู่ระหว่างไต่สวนชี้มูล (ครบ ${i.inquiry644.deadlineAt})`);
          add(`แต่งตั้ง${i.committee213.orderType === '24v3' ? 'คณะอนุกรรมการไต่สวน (ม.24 ว.3)' : 'คณะพนักงานไต่สวน (ม.24 ว.1)'} ${i.committee213.orderNo} — เริ่มนับ 270 วันจาก ${i.inquiry644.startedAt}`);
        } else if (result === 'ไม่รับไว้ไต่สวน') { w.stage = 'a5-outcome'; w.owner = 'clerk'; w.status = 'แจ้งผลผู้ร้อง/ผู้ถูกกล่าวหา (15 วัน)'; i.outcome.type = result; publish(st, 'คณะกรรมการมีมติไม่รับเรื่องไว้ไต่สวน'); }
        else if (result.includes('เพิ่มเติม')) { w.stage = 'a5-prelim'; w.owner = 'investigator'; w.status = 'ไต่สวนเบื้องต้นเพิ่มเติม (30 วัน + ขยายต่อบอร์ด 1 ครั้ง 30 วัน)'; i.prelim.additionalDeadlineAt = addDays(todayISO(), 30); i.prelim.additionalExtendedOnce = false; }
        else { w.stage = 'a5-outcome'; w.owner = 'clerk'; w.status = 'จัดทำหนังสือส่ง ป.ป.ช.'; i.outcome.type = result; publish(st, 'คณะกรรมการมีมติส่งเรื่องไปยังสำนักงาน ป.ป.ช.'); }
      }
      if (action === 'inquiry-save') { add('บันทึกร่างไต่สวนชี้มูล'); }
      if (action === 'inquiry-submit') {
        if (!i.inquiry644.plan || i.inquiry644.planStatus !== 'approved') return notify('warning', 'แผนคดี 644 ไม่ครบ', 'จัดทำแผนคดีและรออนุมัติก่อนเสนอ 644');
        if (!i.inquiry644.report) return notify('warning', 'ยังไม่มีสรุปรายงาน 644', 'สรุปผลและความเห็นชี้มูลก่อนเสนอ');
        const fast = await popup('เสนอรายงาน 644', [['a5FastTrack644', 'เร่งด่วน (ใบด่วน)?', 'checkbox']], 'เสนอ');
        i.inquiry644.fastTrack = Boolean(fast.value?.a5FastTrack644);
        if (i.inquiry644.fastTrack) { w.stage = 'a7-644'; w.owner = 'committee'; w.status = 'ใบด่วน — คกก. วินิจฉัย 644'; add('เสนอรายงาน 644 แบบใบด่วน'); }
        else { w.stage = 'a5-inquiry-review'; w.owner = 'group-director'; w.status = 'รอตรวจตามลำดับชั้น (ผอ.กลุ่ม → ผอ.เขต/กอง → ผู้ช่วย/รองเลขาธิการ → เลขาธิการ)'; i.inquiry644.submittedAt = now(); add('คณะผู้ไต่สวนเสนอรายงาน 644 ตามลำดับชั้น'); }
      }
      if (action === 'mti644-decide') {
        const result = $('input[name="a5Mti644"]:checked')?.value;
        if (!result) return notify('warning', 'ยังไม่ได้เลือกผลมติชี้มูล', '');
        i.committee644.result = result; i.committee644.mtiNo = v('a5Mti644No'); i.committee644.mtiDate = v('a5Mti644Date'); i.committee644.note = v('a5Mti644Note');
        i.committee644.decidedAt = now(); i.committee644.decidedBy = ROLE_LABELS[role];
        add(`คณะกรรมการ ป.ป.ท. มีมติชี้มูล 644: ${result}${i.committee644.mtiNo ? ` (${i.committee644.mtiNo})` : ''}`);
        if (result.includes('เพิ่มเติม')) { w.stage = 'a5-inquiry'; w.owner = 'investigator'; w.status = 'ไต่สวนชี้มูลเพิ่มเติม (30 วัน + ขยายต่อบอร์ด 1 ครั้ง 30 วัน)'; i.inquiry644.additionalDeadlineAt = addDays(todayISO(), 30); i.inquiry644.additionalExtendedOnce = false; }
        else { w.stage = 'a5-outcome'; w.owner = 'clerk'; w.status = `ดำเนินการตามมติ: ${result}`; i.outcome.type = result; publish(st, result.includes('ไม่มีมูล') ? 'คณะกรรมการมีมติว่าข้อกล่าวหาไม่มีมูล — แจ้งผลภายใน 15 วัน' : `คณะกรรมการมีมติ: ${result}`); }
      }
      if (action === 'outcome-save') { add('บันทึกการดำเนินการตามมติ'); }
      if (action === 'send-prosecutor') {
        if (!i.outcome.letters && !i.outcome.prosecutor) return notify('warning', 'ข้อมูลไม่ครบ', 'กรอกเลขหนังสือนำส่งและพนักงานอัยการก่อนส่ง');
        w.stage = 'a5-prosecutor'; w.owner = 'clerk'; w.status = 'ส่งอัยการแล้ว — รออัยการสั่งการ (กิจกรรมที่ 10)';
        add(`ส่งสำนวนให้พนักงานอัยการ${i.outcome.prosecutor ? ` (${i.outcome.prosecutor})` : ''} เลขหนังสือ ${i.outcome.letters}`);
        publish(st, `คณะกรรมการชี้มูลแล้ว — ส่งสำนวนให้พนักงานอัยการ${i.outcome.letters ? ` (เลขหนังสือ ${i.outcome.letters})` : ''}`);
      }
      if (action === 'prosecutor-order') {
        i.prosecutor.orderType = v('a5ProsecutorOrder') || i.prosecutor.orderType; i.prosecutor.orderDetail = v('a5ProsecutorDetail') || i.prosecutor.orderDetail; i.prosecutor.orderedAt = now();
        if (i.prosecutor.orderType.includes('แยก') && !cb('a5A7Approve')) return notify('warning', 'แยกสำนวนต้องเสนอ คกก. เห็นชอบก่อน', 'ติ้กยืนยันว่า คกก. เห็นชอบการแยกสำนวนแล้ว');
        w.status = `ดำเนินการตามคำสั่งอัยการ: ${i.prosecutor.orderType}`; add(`อัยการสั่งการ: ${i.prosecutor.orderType}${i.prosecutor.orderDetail ? ` — ${i.prosecutor.orderDetail}` : ''}`);
      }
      if (action === 'prosecutor-return') {
        i.prosecutor.executedAt = now(); i.prosecutor.returnedAt = now(); i.prosecutor.letters = v('a5ProsecutorLetters') || i.prosecutor.letters; i.prosecutor.reportA7 = true;
        w.stage = 'a5-outcome'; w.status = `ส่งผลกลับอัยการแล้ว (${i.prosecutor.letters || 'ไม่มีเลขหนังสือ'}) — รายงาน คกก. ตามกรณี`; i.outcome.type = i.committee644.result || i.outcome.type;
        add(`ดำเนินการตามคำสั่งอัยการแล้ว — ส่งผลกลับอัยการ${i.prosecutor.reportA7 ? ' และรายงานคณะกรรมการตามกรณี' : ''}`);
      }
      if (action === 'm62-report') {
        const m62 = i.intake.m62 || {};
        if (!m62.report65Letter || !m62.report65Date) return notify('warning', 'ข้อมูลไม่ครบ', 'กรอกเลขหนังสือและวันที่รายงานผลกลับ ป.ป.ช. (ม.65)');
        add(`รายงานผลการดำเนินการต่อคณะกรรมการ ป.ป.ช. ตามมาตรา 65 — ${m62.report65Letter} (${m62.report65Date})`);
        publish(st, `รายงานผลต่อ ป.ป.ช. แล้ว (${m62.report65Letter})`);
      }
      if (action === 'm62-recall') {
        i.intake.m62.recalled = true; w.stage = 'closed'; w.status = 'ป.ป.ช. เรียกสำนวนกลับไปดำเนินการเอง'; w.complete = true;
        add('ป.ป.ช. ไม่เห็นด้วยกับมติ — เรียกสำนวนกลับไปดำเนินการเอง'); publish(st, 'สำนักงาน ป.ป.ช. เรียกสำนวนกลับไปดำเนินการเอง');
      }
      if (action === 'witness-request' || action === 'search-request') {
        const rep = reportTypeForStage(w.stage) === '644' ? i.inquiry644 : i.prelim;
        const isWitness = action === 'witness-request';
        const pop = await popup(isWitness ? 'จัดทำคำขอคุ้มครองพยาน (ส่ง กิจกรรมที่ 6)' : 'จัดทำคำร้องขอหมายค้น (ส่ง กิจกรรมที่ 9)', isWitness ? [['a5WpPerson', 'ผู้ถูกคุ้มครอง (ผู้ร้อง/พยาน) *', 'text', 'ระบุชื่อ'], ['a5WpRisk', 'เหตุผลความเสี่ยง *', 'text', 'เช่น ถูกข่มขู่/เกรงอันตราย']] : [['a5SqTarget', 'สถานที่ที่จะตรวจค้น *', 'text', 'ระบุสถานที่'], ['a5SqReason', 'เหตุผลและความจำเป็น *', 'text', 'ระบุพฤติการณ์']], isWitness ? 'ส่ง ก6' : 'ส่ง ก9');
        if (pop.dismiss) return;
        if (isWitness) {
          if (!pop.value?.a5WpPerson || !pop.value?.a5WpRisk) return notify('warning', 'กรอกข้อมูลครบ', 'ผู้ถูกคุ้มครอง + เหตุผลความเสี่ยง');
          rep.witnessProtectionReq = { person: pop.value.a5WpPerson, risk: pop.value.a5WpRisk, by: ROLE_LABELS[role], at: now(), status: 'sent' };
          w.status = `ส่งคำขอคุ้มครองพยาน (${pop.value.a5WpPerson}) ไป กิจกรรมที่ 6`;
          add(`${ROLE_LABELS[role]} จัดทำคำขอคุ้มครองพยาน (${pop.value.a5WpPerson}) — ${pop.value.a5WpRisk} → ส่ง ก6`);
        } else {
          if (!pop.value?.a5SqTarget || !pop.value?.a5SqReason) return notify('warning', 'กรอกข้อมูลครบ', 'สถานที่ + เหตุผลความจำเป็น');
          rep.searchWarrantReq = { target: pop.value.a5SqTarget, reason: pop.value.a5SqReason, by: ROLE_LABELS[role], at: now(), status: 'sent' };
          w.status = `ส่งคำร้องขอหมายค้น (${pop.value.a5SqTarget}) ไป กิจกรรมที่ 9`;
          add(`${ROLE_LABELS[role]} จัดทำคำร้องขอหมายค้น (${pop.value.a5SqTarget}) — ${pop.value.a5SqReason} → ส่ง ก9`);
        }
      }
      if (action === 'witness-result' || action === 'search-result') {
        const rep = reportTypeForStage(w.stage) === '644' ? i.inquiry644 : i.prelim;
        const isWitness = action === 'witness-result';
        const req = isWitness ? rep.witnessProtectionReq : rep.searchWarrantReq;
        if (!req) return notify('warning', 'ยังไม่มีคำขอ', 'จัดทำคำขอก่อนส่ง ก6/ก9');
        const pop = await popup(isWitness ? 'บันทึกผลจาก กิจกรรมที่ 6' : 'บันทึกผลจาก กิจกรรมที่ 9', [[isWitness ? 'a5WpResult' : 'a5SqResult', isWitness ? 'ผลการคุ้มครอง/คำสั่ง *' : 'ผลคำสั่งศาล *', 'text', isWitness ? 'เช่น ศาลมีคำสั่งคุ้มครอง 6 เดือน' : 'เช่น ศาลอนุญาตให้ออกหมายค้น']], 'บันทึกผล');
        if (!pop.value?.[isWitness ? 'a5WpResult' : 'a5SqResult']) return notify('warning', 'กรอกผล', '');
        req.status = 'result';
        if (isWitness) { rep.witnessProtection = pop.value.a5WpResult; } else { rep.searchWarrantResult = pop.value.a5SqResult; }
        w.status = isWitness ? 'ได้รับผลการคุ้มครองพยานจาก ก6' : 'ได้รับผลหมายค้นจาก ก9';
        add(`${isWitness ? 'รับผลคุ้มครองพยาน' : 'รับผลหมายค้น'} จาก ก${isWitness ? '6' : '9'}: ${pop.value[isWitness ? 'a5WpResult' : 'a5SqResult']}`);
      }
      if (action === 'warrant-file') {
        const pop = await popup('ยื่นคำร้องขอหมายจับต่อศาล', [['a5WcCourt', 'ศาล *', 'text', 'ศาลอาญาคดีทุจริตและประพฤติมิชอบ'], ['a5WcDate', 'วันที่ยื่นคำร้อง', 'text', '']], 'ยื่นคำร้อง');
        if (!pop.value?.a5WcCourt) return notify('warning', 'ระบุศาล', '');
        i.outcome.warrant = { status: 'filed', court: pop.value.a5WcCourt, filedAt: pop.value.a5WcDate || now() };
        w.status = 'ยื่นคำร้องขอหมายจับต่อศาลแล้ว — รอศาลพิจารณา';
        add(`ยื่นคำร้องขอหมายจับต่อ ${pop.value.a5WcCourt} (แบบ ปปท. 11) — ${pop.value.a5WcDate || ''}`);
      }
      if (action === 'warrant-court') {
        if (!i.outcome.warrant || i.outcome.warrant.status !== 'filed') return notify('warning', 'ต้องยื่นคำร้องก่อน', '');
        const pop = await popup('บันทึกผลศาล', [['a5WcIssue', 'ผลคำสั่งศาล', 'select', 'ออกหมายจับ|ไม่ออกหมายจับ'], ['a5WcNo', 'หมายจับที่ / ลงวันที่', 'text', 'หมายจับที่ ... ลงวันที่ ...']], 'บันทึกผล');
        if (pop.dismiss) return;
        const issued = pop.value?.a5WcIssue !== 'ไม่ออกหมายจับ';
        i.outcome.warrant.status = issued ? 'issued' : 'denied';
        i.outcome.warrant.warrantNo = pop.value?.a5WcNo || '';
        w.status = issued ? `ศาลออกหมายจับแล้ว${pop.value?.a5WcNo ? ` (${pop.value.a5WcNo})` : ''} — ดำเนินการจับกุม` : 'ศาลไม่ออกหมายจับ — ดำเนินการตามคำสั่งศาล';
        add(`ศาล${issued ? 'ออก' : 'ไม่ออก'}หมายจับ${pop.value?.a5WcNo ? ` (${pop.value.a5WcNo})` : ''} — ${issued ? 'แบบ ปปท. 14/15 + ตำหนิรูปพรรณ 16' : 'แจ้งผู้รับผิดชอบ'}`);
      }
      if (action === 'warrant-arrest') {
        if (!i.outcome.warrant || i.outcome.warrant.status !== 'issued') return notify('warning', 'ต้องมีหมายจับก่อน', '');
        const pop = await popup('บันทึกการจับกุม', [['a5WaResult', 'ผลการจับกุม', 'select', 'จับกุมได้|ยังจับกุมไม่ได้'], ['a5WaNote', 'หมายเหตุ', 'text', '']], 'บันทึก');
        if (pop.dismiss) return;
        i.outcome.warrant.status = 'arrested';
        i.outcome.warrant.arrest = pop.value?.a5WaResult || '';
        i.outcome.warrant.note = pop.value?.a5WaNote || '';
        w.status = pop.value?.a5WaResult === 'จับกุมได้' ? 'จับกุมผู้ถูกกล่าวหาได้ — ส่งบันทึกการจับกุมต่อศาลภายใน 48 ชั่วโมง' : 'ยังจับกุมไม่ได้ — ติดตามตามหมายจับ';
        add(`การจับกุม: ${pop.value?.a5WaResult || ''}${pop.value?.a5WaNote ? ` — ${pop.value.a5WaNote}` : ''}`);
      }
      if (action === 'warrant-notify') {
        if (!i.outcome.warrant || i.outcome.warrant.status !== 'arrested') return notify('warning', 'ต้องจับกุม/ดำเนินการตามหมายก่อน', '');
        i.outcome.warrant.status = 'notified';
        i.outcome.warrant.notifiedAt = now();
        w.status = 'แจ้งหน่วยงานแล้ว (อัยการ/ผบ.ตร./กอท.) — หนังสือแจ้งผลการออกหมายจับ';
        add('แจ้งผลการออกหมายจับ: อัยการ (แบบ ปปท. 17) · ผบ.ตร. (แบบ ปปท. 18) · กอท. (แบบ ปปท. 19) · ผนึกซอง (แบบ ปปท. 20)');
      }
      if (action === 'close-case') {
        const confirmed = await confirmDo('ปิดสำนวน', 'ยืนยันปิดสำนวนคดีนี้?', 'ปิดสำนวน');
        if (!confirmed.isConfirmed) return;
        w.stage = 'closed'; w.status = 'ปิดสำนวน'; w.complete = true;
        i.outcome.closedAt = now(); i.outcome.closedBy = ROLE_LABELS[role];
        add(`${ROLE_LABELS[role]} ปิดสำนวน`); publish(st, `การดำเนินการเสร็จสิ้น${i.outcome.letters ? ` — เลขหนังสือ ${i.outcome.letters}` : ''}`);
      }
      if (action === 'reopen') { w.stage = 'a5-outcome'; w.status = 'ทบทวนมติ — พยานหลักฐานใหม่'; w.complete = false; add('เปิดสำนวนใหม่เพื่อทบทวนมติ (พยานหลักฐานใหม่)'); }
      if (action === 'request-extension') {
        const reportType = reportTypeForStage(w.stage);
        const next = extensionRound(reportType, i);
        if (!next) return notify('warning', 'ขยายครบทุกครั้งแล้ว', 'ต้องเสนอคณะกรรมการ (รายงานเหตุล่าช้า)');
        const pop = await popup(`ยื่นขยาย${reportType === '213' ? 'ไต่สวนเบื้องต้น' : 'ไต่สวนชี้มูล'}ครั้งที่ ${next.round}`, [['a5ExtReason', 'เหตุผลและความจำเป็น *', 'text', 'ระบุเหตุผล...'], ['a5ExtDays', `จำนวนวัน (ไม่เกิน ${next.maxDays})`, 'number', '60']], 'ยื่นคำขอ');
        if (!pop.value?.a5ExtReason) return notify('warning', 'ต้องระบุเหตุผล', '');
        const r = requestExtension(st, reportType, pop.value.a5ExtReason, Number(pop.value.a5ExtDays) || 60, role);
        if (!r.ok) return notify('error', 'ยื่นไม่ได้', r.message);
        w.status = `รออนุมัติขยายครั้งที่ ${r.next.round}`;
      }
      if (action === 'approve-extension') {
        const reportType = reportTypeForStage(w.stage);
        const pending = pendingExtension(reportType, i);
        if (!pending) return notify('warning', 'ไม่มีคำขอรอพิจารณา', '');
        if (pending.role !== role) return notify('warning', 'ไม่มีสิทธิ์', `${ROLE_LABELS[pending.role]} เป็นผู้พิจารณา`);
        const pop = await popup(`อนุมัติขยายครั้งที่ ${pending.round}`, [['a5ApproveDays', `จำนวนวัน (ขอ ${pending.requestedDays} วัน)`, 'number', String(pending.requestedDays)], ['a5ApproveNote', 'หมายเหตุ', 'text', '']], 'อนุมัติ');
        const r = applyExtension(st, reportType, pop.value?.a5ApproveNote || pending.reason, role, Number(pop.value?.a5ApproveDays) || pending.requestedDays);
        if (!r.ok) return notify('error', 'อนุมัติไม่ได้', r.message);
        w.status = `ขยายครั้งที่ ${pending.round} แล้ว — ครบ ${r.deadline}`;
      }
      if (action === 'deny-extension') {
        const reportType = reportTypeForStage(w.stage);
        const pop = await popup('ไม่อนุมัติคำขอขยาย', [['a5DenyNote', 'เหตุผล', 'text', '']], 'ไม่อนุมัติ');
        const r = denyExtension(st, reportType, role, pop.value?.a5DenyNote || '');
        if (!r.ok) return notify('error', 'ปฏิเสธไม่ได้', r.message);
        w.status = `คำขอขยายไม่ผ่าน — ดำเนินการต่อภายในเวลาที่เหลือ (ครบ ${reportOf(reportType, i).deadlineAt})`;
      }
      if (action === 'extension-late') {
        const reportType = reportTypeForStage(w.stage);
        const pop = await popup('ขยายครบแล้วยังไม่แล้วเสร็จ', [['a5LateReport', 'รายงานเหตุผลและความจำเป็น *', 'text', 'ระบุเหตุผลล่าช้า...'], ['a5LateEvidence', 'หลักฐานงานที่ผ่านมา', 'text', 'รายการหลักฐาน']], 'เสนอ คกก.');
        if (!pop.value?.a5LateReport) return notify('warning', 'ต้องกรอกรายงานเหตุล่าช้า', '');
        const extNext = extensionRound(reportType, i);
        reportOf(reportType, i).lateReport = `${pop.value.a5LateReport}${pop.value.a5LateEvidence ? `\n[หลักฐาน] ${pop.value.a5LateEvidence}` : ''}`;
        reportOf(reportType, i).lateRound = extNext?.round || EXTENSION_RULES[reportType].rounds.length;
        w.stage = reportType === '213' ? 'a7-213' : 'a7-644'; w.owner = 'committee'; w.status = `คกก. พิจารณาขยาย${reportType}ครั้งที่ ${reportOf(reportType, i).lateRound} (เลขาธิการพิจารณาเอง — มอบหมายมิได้ 218/2568 ข้อ 14)`;
        add(`ขยายครบแล้วยังไม่เสร็จ — เสนอรายงานเหตุล่าช้าต่อคณะกรรมการ${i.intake ? ` (ครบ 2 ปี: ${caseAgeTone(i)?.label || '-'})` : ''}`);
      }
      if (action === 'progress-report') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        const text = v('a5ProgressText');
        if (!text) return notify('warning', 'กรอกเนื้อหารายงานความคืบหน้าก่อน', '');
        rep.progressReports = rep.progressReports || [];
        rep.progressReports.push({ text, at: now(), by: ROLE_LABELS[role] });
        add(`บันทึกรายงานความคืบหน้า${reportType === '213' ? ' (ไต่สวนเบื้องต้น)' : ' (ไต่สวนชี้มูล)'}: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`);
        notify('success', 'บันทึกรายงานความคืบหน้าแล้ว', 'รายงานครบถ้วนตามข้อกำหนดทุก 15 วันระหว่างขยายเวลา');
      }
      if (action === 'ext-committee-approve') {
        const reportType = reportTypeForStage(w.stage);
        const rules = EXTENSION_RULES[reportType];
        const rep = reportOf(reportType, i);
        const cRound = rep.lateRound || extensionRound(reportType, i)?.round || rules.rounds.length;
        const isFinal = cRound >= rules.rounds.length;
        const pop = await popup(`คกก. อนุมัติขยาย ${reportType} (ครั้งที่ ${cRound})`, [['a5ExtDays', 'จำนวนวัน (20-60)', 'number', '60'], ['a5ExtReason', 'เหตุผล/เงื่อนไข', 'text', '']], 'อนุมัติขยาย');
        if (pop.dismiss) return;
        const days = Math.min(Math.max(20, Number(pop.value?.a5ExtDays) || 60), 60);
        rep.extensionHistory.push({ round: cRound, role: 'committee', requestedDays: days, reason: pop.value?.a5ExtReason || rep.lateReport || '', requestedBy: 'คณะกรรมการ ป.ป.ท.', requestedAt: now(), status: 'APPROVED', approvedBy: 'คณะกรรมการ ป.ป.ท.', approvedAt: now() });
        rep.deadlineAt = addDays(rep.deadlineAt, days);
        rep.lateReport = ''; rep.lateRound = '';
        w.stage = reportType === '213' ? 'a5-prelim' : 'a5-inquiry';
        w.owner = 'investigator';
        w.status = `คกก. อนุมัติขยายครั้งที่ ${cRound} แล้ว (${days} วัน) — ครบ ${rep.deadlineAt}${isFinal ? ' (ครั้งสุดท้าย — คำสั่งตามมติบอร์ด)' : ''}`;
        add(`คณะกรรมการ ป.ป.ท. อนุมัติขยาย${reportType}ครั้งที่ ${cRound} (${days} วัน)${pop.value?.a5ExtReason ? ` — ${pop.value.a5ExtReason}` : ''}${isFinal ? ' — ครั้งสุดท้ายแล้ว' : ''}`);
        publish(st, `ขยายระยะเวลาครั้งที่ ${cRound} (${reportType}) — ครบ ${rep.deadlineAt}${isFinal ? ' · คำสั่งตามมติบอร์ด' : ''}`);
      }
      if (action === 'ext-committee-deny') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        const pop = await popup(`คกก. ไม่อนุมัติขยาย ${reportType}`, [['a5ExtDenyNote', 'เหตุผล/คำสั่ง', 'text', '']], 'ไม่อนุมัติ');
        if (pop.dismiss) return;
        rep.extensionHistory.push({ round: rep.lateRound || EXTENSION_RULES[reportType].rounds.length, role: 'committee', requestedDays: 0, reason: rep.lateReport || '', requestedBy: 'คณะกรรมการ ป.ป.ท.', requestedAt: now(), status: 'DENIED', deniedBy: 'คณะกรรมการ ป.ป.ท.', deniedAt: now(), denyNote: pop.value?.a5ExtDenyNote || '' });
        rep.lateReport = ''; rep.lateRound = '';
        w.stage = reportType === '213' ? 'a5-prelim' : 'a5-inquiry';
        w.owner = 'investigator';
        w.status = 'คกก. ไม่อนุมัติขยาย — เร่งดำเนินการให้แล้วเสร็จโดยเร็ว';
        add(`คณะกรรมการ ป.ป.ท. ไม่อนุมัติขยาย${reportType}${pop.value?.a5ExtDenyNote ? ` — ${pop.value.a5ExtDenyNote}` : ''}`);
      }
      if (action === 'request-additional-extension') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        if (!rep.additionalDeadlineAt) return notify('warning', 'ไม่มีกำหนดไต่สวนเพิ่มเติมที่ต้องขยาย', '');
        if (rep.additionalExtendedOnce) return notify('warning', 'ขยายไต่สวนเพิ่มเติมได้เพียงครั้งเดียว', 'ครบกำหนดแล้วต้องเสนอคณะกรรมการ (รายงานเหตุล่าช้า)');
        if (rep.additionalExtensionPending) return notify('warning', 'มีคำขอรอพิจารณาอยู่แล้ว', '');
        const pop = await popup('ขอขยายไต่สวนเพิ่มเติมอีก 30 วัน', [['a5AddExtReason', 'เหตุผลและความจำเป็น *', 'text', 'ระบุเหตุผล...']], 'ยื่นคำขอ');
        if (!pop.value?.a5AddExtReason) return notify('warning', 'ต้องระบุเหตุผล', '');
        rep.additionalExtensionPending = { reason: pop.value.a5AddExtReason, requestedBy: ROLE_LABELS[role], requestedAt: now() };
        w.status = `รอ ผอ. อนุมัติขยายไต่สวนเพิ่มเติม (${reportType})`;
        add(`${ROLE_LABELS[role]} ยื่นคำขอขยายไต่สวนเพิ่มเติมอีก 30 วัน (${reportType}) — ${pop.value.a5AddExtReason}`);
      }
      if (action === 'approve-additional-extension') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        if (!rep.additionalExtensionPending) return notify('warning', 'ไม่มีคำขอรอพิจารณา', '');
        rep.additionalDeadlineAt = addDays(rep.additionalDeadlineAt, 30);
        rep.additionalExtendedOnce = true;
        add(`${ROLE_LABELS[role]} อนุมัติขยายไต่สวนเพิ่มเติมอีก 30 วัน (${reportType}) — ครบกำหนดใหม่ ${rep.additionalDeadlineAt}`);
        rep.additionalExtensionPending = null;
        w.status = `ไต่สวน${reportType === '213' ? 'เบื้องต้น' : 'ชี้มูล'}เพิ่มเติม (ขยายแล้ว) — ครบ ${rep.additionalDeadlineAt}`;
      }
      if (action === 'deny-additional-extension') {
        const reportType = reportTypeForStage(w.stage);
        const rep = reportOf(reportType, i);
        if (!rep.additionalExtensionPending) return notify('warning', 'ไม่มีคำขอรอพิจารณา', '');
        add(`${ROLE_LABELS[role]} ไม่อนุมัติคำขอขยายไต่สวนเพิ่มเติม (${reportType})`);
        rep.additionalExtensionPending = null;
        w.status = `คำขอขยายไต่สวนเพิ่มเติมไม่ผ่าน — ดำเนินการต่อภายในเวลาที่เหลือ (ครบ ${rep.additionalDeadlineAt})`;
      }
      if (action === 'special-save') { add(`บันทึกผลการตรวจสอบข้อเท็จจริง (${i.special.type === '583' ? '58/3 — แจ้ง สตง.' : '58/2 — แจ้งหน่วยงานรัฐ'})`); publish(st, 'อยู่ระหว่างการตรวจสอบข้อเท็จจริง'); }
      if (action === 'special-secretary') { i.special.secretaryAt = now(); add('เสนอรายงานตรวจสอบข้อเท็จจริงต่อเลขาธิการตามลำดับชั้น'); }
      if (action === 'special-notice') { i.special.publicNotice = true; add('หน่วยงานไม่ดำเนินการแก้ไข — สำนักงาน ป.ป.ท. ประกาศให้ประชาชนทราบเป็นการทั่วไป (58/2)'); publish(st, 'ประกาศให้ประชาชนทราบเป็นการทั่วไป'); }
      if (action === 'special-switch') {
        const ok = await confirmDo('เปลี่ยนเส้นทางเข้าคดี', 'พบพฤติการณ์ทุจริต — เปลี่ยนจากเส้นตรวจสอบข้อเท็จจริงเข้าสู่เส้นทางคดีตามอำนาจ?', 'เปลี่ยนเส้นทาง');
        if (!ok.isConfirmed) return;
        i.special.switched = true; st.caseData.decision = '18/1ก';
        w.stage = 'a5-intake'; w.owner = 'clerk'; w.status = 'เปลี่ยนเส้นทางเข้าคดีแล้ว — รอรับสำนวน'; w.complete = false;
        add('พบพฤติการณ์ทุจริต — เปลี่ยนเส้นทางเข้าสู่คดีตามอำนาจหน้าที่ (เลขสำนวนใหม่)'); publish(st, 'เปลี่ยนเส้นทางดำเนินการเข้าสู่กระบวนการคดี');
      }
      if (action === 'transfer-post-request') {
        const target = v('a5TransferPostTarget'), letter = v('a5TransferPostLetter');
        if (!target) return notify('warning', 'เลือกหน่วยงานปลายทาง', '');
        i.intake.transferPost = { status: 'PENDING', target, letterSource: letter, letterTarget: '', by: ROLE_LABELS[role], at: now() };
        w.status = `เสนอเลขาธิการอนุมัติโอนไป ${target}`; add(`เสนอโอนสำนวนไป ${target}${letter ? ` (${letter})` : ''} — รอเลขาธิการอนุมัติ (กรอบเวลาไม่เริ่มใหม่)`);
      }
      if (action === 'transfer-post-approve') {
        i.intake.transferPost.status = 'APPROVED'; i.intake.transferPost.approvedBy = ROLE_LABELS[role]; i.intake.transferPost.at = now();
        i.intake.unit = i.intake.transferPost.target;
        add(`เลขาธิการอนุมัติโอนสำนวนไป ${i.intake.unit} — บันทึกหลักฐานระหว่างสองหน่วยงานแล้ว, กรอบเวลาไม่เริ่มใหม่`); publish(st, `โอนสำนวนไปยัง ${i.intake.unit}`);
      }
      if (action === 'transfer-post-reject') { i.intake.transferPost.status = 'REJECTED'; add('เลขาธิการไม่อนุมัติการโอน — สำนวนคงอยู่ที่หน่วยงานเดิม'); }
      if (action === 'merge-case') {
        const target = v('a5MergeWith');
        if (!target) return notify('warning', 'ระบุเลขสำนวนหลัก', 'ใหม่รวมเข้าเก่า — ใช้กรอบเวลาสำนวนเก่า');
        add(`รวมสำนวนเข้ากับ ${target} (ใหม่รวมเข้าเก่า — ยึดกรอบเวลาสำนวนหลัก, เวลาไม่เริ่มใหม่)`);
      }
      if (action === 'change-investigator') {
        const next = v('a5ChangeInvestigator');
        if (!next || next === (i.inquiry644?.investigator || i.intake.investigator)) return notify('warning', 'เลือกผู้รับผิดชอบคนใหม่', 'ต้องต่างจากคนเดิม');
        add(`เปลี่ยนผู้รับผิดชอบจาก ${i.inquiry644?.investigator || i.intake.investigator || '—'} เป็น ${next} (เก็บประวัติคนเดิม-คนใหม่ใน log)`);
        if (i.inquiry644?.investigator) i.inquiry644.investigator = next; else i.intake.investigator = next;
      }
      if (action === 'org-change-request') {
        w.status = 'เสนอ คกก. พิจารณาปรับองค์คณะไต่สวน'; add('เสนอปรับปรุงองค์คณะไต่สวนต่อคณะกรรมการ (ผ่านหัวหน้าพนักงานตามลำดับชั้น)');
      }
      if (action === 'org-approve') { w.status = w.status.includes('ปรับองค์คณะ') ? 'อนุมัติปรับองค์คณะแล้ว — ดำเนินการต่อ' : w.status; add('คณะกรรมการอนุมัติปรับปรุงองค์คณะไต่สวน'); }
      if (action === 'split-case') {
        const ok = await confirmDo('แยกสำนวน', 'แยกเรื่องและออกเลขสำนวนใหม่ (เชื่อมโยงกับสำนวนเดิม)?', 'แยกสำนวน');
        if (!ok.isConfirmed) return;
        const newId = `${st.caseData.id}#แยก1`;
        const clone = JSON.parse(JSON.stringify(st));
        clone.caseData = { ...clone.caseData, id: newId, subject: `${clone.caseData.subject} (แยก)`, received: now() };
        clone.workflow = { owner: 'clerk', stage: 'a5-intake', status: 'สำนวนแยกใหม่ — รอรับสำนวน', complete: false };
        clone.inquiry = defaultInquiry(clone);
        clone.inquiry.intake.handoffRef = st.caseData.id;
        clone.decisionHistory = [{ text: `แยกจากสำนวน ${st.caseData.id} — ออกเลขสำนวนใหม่`, time: now() }];
        const store = readStore(); store[newId] = clone; writeStore(store);
        add(`แยกสำนวน — ออกเลขสำนวนใหม่ ${newId} (เชื่อมโยงกับสำนวนเดิม)`);
        notify('success', 'แยกสำนวนแล้ว', `เลขสำนวนใหม่: ${newId}`);
      }
      if (action === 'org-approve-pending' || action === 'prosecutor-execute') { i.prosecutor.executedAt = now(); add('ดำเนินการตามคำสั่งอัยการแล้ว'); }
      saveState(st.caseData.id, st);
      renderA5Detail(st.caseData.id, role);
    };
  }

  const FONT_SIZE_STORAGE_KEY = 'ecmis-a4-font-size-v2';
  const DEFAULT_FONT_SIZE_STEP = 1;
  function fontSizeControlsA5() {
    return `<div class="ws-font-controls" role="group" aria-label="ปรับขนาดตัวอักษร"><span>ขนาดตัวอักษร</span><button type="button" data-font-size="decrease" aria-label="ลดขนาดตัวอักษร">A−</button><button type="button" data-font-size="reset" aria-label="ใช้ขนาดตัวอักษรปกติ">A</button><button type="button" data-font-size="increase" aria-label="เพิ่มขนาดตัวอักษร">A+</button><output id="a5FontSizeValue" aria-live="polite">100%</output></div>`;
  }
  function applyFontSizeA5(step) {
    const normalized = Math.max(-1, Math.min(3, Number(step) || 0));
    const fontSize = 16 + normalized;
    document.documentElement.style.fontSize = `${fontSize}px`;
    try { localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(normalized)); } catch {}
    const output = $('#a5FontSizeValue') || $('#fontSizeValue');
    if (output) output.textContent = `${Math.round((fontSize / 16) * 100)}%`;
    $$('[data-font-size]').forEach(button => button.classList.toggle('active', button.dataset.fontSize === 'reset' && normalized === DEFAULT_FONT_SIZE_STEP));
    return normalized;
  }
  function wireA5FontControls() {
    let step = DEFAULT_FONT_SIZE_STEP;
    try {
      const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (stored !== null) step = Number(stored);
    } catch {}
    applyFontSizeA5(Number.isFinite(step) ? step : DEFAULT_FONT_SIZE_STEP);
  }
  const A5_SEARCH_ACTIONS = [
    { label: 'รับสำนวนและมอบหมายนักสืบ', kw: 'รับสำนวน มอบหมาย accept intake', action: 'accept-case' },
    { label: 'จัดทำแผนคดีไต่สวน (213)', kw: 'แผนคดี แผน 213 plan', action: 'prelim-plan' },
    { label: 'เสนอรายงาน 213 ตามลำดับชั้น', kw: 'เสนอรายงาน 213 report', action: 'prelim-submit' },
    { label: 'บันทึกมติ คกก. (รับไต่สวน)', kw: 'มติ คกก. mti 213 รับไต่สวน', action: 'mti213-decide' },
    { label: 'เสนอรายงาน 644 ตามลำดับชั้น', kw: 'เสนอรายงาน 644 report', action: 'inquiry-submit' },
    { label: 'บันทึกมติชี้มูล คกก.', kw: 'มติชี้มูล คกก. mti 644', action: 'mti644-decide' },
    { label: 'ยื่นคำขอขยายเวลา', kw: 'ขยายเวลา extension 60 วัน', action: 'request-extension' },
    { label: 'จัดทำคำขอคุ้มครองพยาน (ก6)', kw: 'คุ้มครองพยาน ก6 witness', action: 'witness-request' },
    { label: 'จัดทำคำร้องขอหมายค้น (ก9)', kw: 'หมายค้น ก9 search warrant', action: 'search-request' },
    { label: 'ยื่นคำร้องขอหมายจับต่อศาล', kw: 'หมายจับ ศาล warrant', action: 'warrant-file' },
    { label: 'แจ้งหน่วยงาน (อัยการ/ผบ.ตร./กอท.)', kw: 'แจ้งหน่วยงาน notify หมายจับ', action: 'warrant-notify' },
    { label: 'พิมพ์/PDF เอกสาร', kw: 'พิมพ์ pdf print เอกสาร', action: 'print' },
    { label: 'ปิดสำนวน', kw: 'ปิดสำนวน close', action: 'close-case' }
  ];
  function wireA5Search(role) {
    const searchInput = $('#a5SearchInput'), searchResults = $('#a5SearchResults');
    if (!searchInput || searchInput.dataset.bound) return;
    searchInput.dataset.bound = '1';
    let searchTimer = null;
    const norm = s => String(s || '').toLowerCase();
    const closeSearch = () => { searchResults.classList.add('ws-hidden'); searchResults.innerHTML = ''; };
    const openTarget = prefer => {
      if (view === 'detail') {
        const h1 = document.querySelector('#a5App .ws-case-head h1');
        if (h1 && h1.textContent.trim()) return h1.textContent.trim();
      }
      const all = allA5Cases();
      const hit = prefer ? all.find(prefer) : null;
      return (hit || all[0])?.caseData?.id || '';
    };
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { closeSearch(); return; }
        const caseHits = allA5Cases().filter(st => {
          const c = st.caseData || {}, w = st.workflow || {}, i = st.inquiry || {};
          const hay = [c.id, c.trackingYear, c.trackingCode, c.subject, c.complainant, c.agency, c.region, phaseLabel(st), w.status, w.stage, i.intake?.unit, i.intake?.investigator, (i.inquiry644?.accused || []).join(' '), i.inquiry644?.allegations, i.prelim?.plan].map(norm).join(' ');
          return hay.includes(q);
        });
        const docHits = Object.entries(A5_FORMS).filter(([id, f]) => norm(id + ' ' + f.code + ' ' + f.name).includes(q));
        const actionHits = A5_SEARCH_ACTIONS.filter(a => norm(a.label + ' ' + a.kw).includes(q));
        let html = '';
        if (caseHits.length) html += `<div class="ws-search-group">คดี (${caseHits.length})</div>` + caseHits.slice(0, 6).map(st => { const c = st.caseData; return `<button type="button" class="ws-search-item" data-a5-search-case="${escapeHtml(c.id)}"><span>${escapeHtml(c.subject || c.id)}</span><small>${escapeHtml(c.id)} · ${escapeHtml(phaseLabel(st))}</small></button>`; }).join('');
        if (docHits.length) html += `<div class="ws-search-group">เอกสาร (${docHits.length})</div>` + docHits.slice(0, 6).map(([id, f]) => `<button type="button" class="ws-search-item" data-a5-search-doc="${id}"><span>${f.code} ${escapeHtml(f.name)}</span></button>`).join('');
        if (actionHits.length) html += `<div class="ws-search-group">ฟังก์ชัน (${actionHits.length})</div>` + actionHits.slice(0, 6).map(a => `<button type="button" class="ws-search-item" data-a5-search-action="${a.action}"><span>${a.label}</span></button>`).join('');
        if (!html) html = '<div class="ws-search-empty">ไม่พบสิ่งที่ค้นหา</div>';
        searchResults.innerHTML = html;
        searchResults.classList.remove('ws-hidden');
      }, 180);
    });
    searchResults.addEventListener('click', e => {
      const caseBtn = e.target.closest('[data-a5-search-case]');
      if (caseBtn) { window.EXMIS?.showA5(caseBtn.dataset.a5SearchCase); closeSearch(); searchInput.blur(); return; }
      const docBtn = e.target.closest('[data-a5-search-doc]');
      if (docBtn) {
        const target = openTarget();
        window.EXMIS?.showA5(target);
        setTimeout(() => { const tab = document.querySelector(`#a5App [data-a5-doc="${docBtn.dataset.a5SearchDoc}"]`); if (tab) tab.click(); }, 80);
        closeSearch(); searchInput.blur(); return;
      }
      const actBtn = e.target.closest('[data-a5-search-action]');
      if (actBtn) {
        const target = openTarget();
        window.EXMIS?.showA5(target);
        setTimeout(() => { const btn = [...document.querySelectorAll('#a5App [data-a5-action]')].find(b => b.dataset.a5Action === actBtn.dataset.a5SearchAction && !b.disabled); if (btn) btn.click(); }, 80);
        closeSearch(); searchInput.blur();
      }
    });
  }
  function headerA5(role) {
    return `<header class="ws-topbar"><div class="ws-topbar-inner"><div class="ws-search"><input id="a5SearchInput" type="search" placeholder="ค้นหาคดี เอกสาร ฟังก์ชัน..." autocomplete="off" aria-label="ค้นหาทุกอย่าง"><div class="ws-search-results ws-hidden" id="a5SearchResults"></div></div><a class="ws-brand" href="index.html"><span class="ws-brand-mark">ศร</span><span><strong>E-CMIS</strong><small>ระบบบริหารจัดการเรื่องร้องเรียน</small></span></a><div class="ws-profile">${fontSizeControlsA5()}<span>สิทธิ์การทำงาน</span><select class="ws-role-select" id="wsRoleA5">${ROLE_ORDER.map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`).join('')}</select></div></div></header>`;
  }

  /* ---------- view + render ---------- */
  let view = 'list';
  function activeRole() {
    const stored = sessionStorage.getItem(A5_ROLE_KEY);
    if (stored && ROLE_LABELS[stored]) return stored;
    const a4 = sessionStorage.getItem(ROLE_KEY);
    const map = { admin: 'clerk', officer: 'investigator', center: 'director', division: 'director', acting: 'secretary' };
    return map[a4] || 'clerk';
  }
  function renderA5(role = activeRole()) {
    const root = $('#a5App');
    if (!root) return;
    const a5q = new URLSearchParams(location.search).get('a5q') || '';
    const filters = { q: $('#a5FilterSearch')?.value, region: $('#a5FilterRegion')?.value, phase: $('#a5FilterPhase')?.value, investigator: $('#a5FilterInvestigator')?.value, a5q };
    const menuLabel = A5_MENU[a5q];
    const banner = menuLabel ? `<div class="ws-callout a5q-banner">กำลังแสดง: <strong>${escapeHtml(menuLabel)}</strong> <a class="a5q-clear" href="?view=a5&role=${encodeURIComponent(role)}" title="แสดงสำนวนทั้งหมด">ล้างตัวกรอง</a></div>` : '';
    root.innerHTML = `${headerA5(role)}<main class="ws-container"><section id="a5ListView"><div class="ws-page-head"><div><p class="ws-kicker">ระบบกระบวนการดำเนินงานเรื่องร้องเรียนกล่าวหา</p><h1>${escapeHtml(menuLabel || 'รายการสำนวนคดี')}</h1><p>สำนวนที่ส่งต่อจากสำนักงาน ป.ป.ท. — ไต่สวนเบื้องต้น → คณะกรรมการ → ไต่สวนชี้มูล → อัยการ/ติดตาม → ปิดสำนวน</p></div></div>${banner}
    <section class="ws-dashboard" aria-label="ภาพรวมสำนวน"><article class="ws-dashboard-card overview"><span>สำนวนทั้งหมด</span><strong id="a5DashboardTotal">0</strong><p>ทุกเฟส</p></article><article class="ws-dashboard-card pending"><span>รอรับสำนวน</span><strong id="a5DashboardPending">0</strong><p>รอธุรการคดีมอบหมาย</p></article><article class="ws-dashboard-card reviewing"><span>อยู่ระหว่างไต่สวน</span><strong id="a5DashboardWorking">0</strong><p>213 / 644 / คกก.</p></article><article class="ws-dashboard-card completed"><span>เสร็จสิ้น</span><strong id="a5DashboardDone">0</strong><p>ปิดสำนวน / 58/2</p></article></section>
    <section class="ws-card ws-filters"><div class="ws-filter-grid"><div class="ws-field"><label>คำค้น</label><input id="a5FilterSearch" placeholder="เลขสำนวน เรื่อง หน่วยงาน นักสืบ"></div><div class="ws-field"><label>หน่วยงาน/เขต</label><select id="a5FilterRegion"><option value="">ทุกหน่วยงาน</option>${UNITS.map(u => `<option>${u}</option>`).join('')}</select></div><div class="ws-field"><label>เฟส/สถานะ</label><select id="a5FilterPhase"><option value="">ทุกเฟส</option></select></div><div class="ws-field"><label>ผู้รับผิดชอบ</label><select id="a5FilterInvestigator"><option value="">ทั้งหมด</option>${INVESTIGATORS.map(x => `<option>${x}</option>`).join('')}</select></div></div></section>
    <section class="ws-card"><div class="ws-table-wrap"><table class="ws-table"><thead><tr><th>เลขสำนวน/เลขรับบริการ</th><th>เรื่อง/หน่วยงาน</th><th>ผู้ร้อง/ปลายทาง</th><th>ผู้รับผิดชอบ</th><th>เฟส/สถานะ</th><th>กรอบเวลา</th></tr></thead><tbody id="a5CaseRows"></tbody></table></div></section></section></main>`;
    $('#wsRoleA5').onchange = e => { sessionStorage.setItem(A5_ROLE_KEY, e.target.value); renderA5(e.target.value); };
    
    wireA5Search(role);
    wireA5FontControls();
    const phaseSelect = $('#a5FilterPhase');
    [...new Set(allA5Cases().map(phaseLabel))].forEach(p => { const o = document.createElement('option'); o.textContent = p; phaseSelect.appendChild(o); });
    ['Search', 'Region', 'Phase', 'Investigator'].forEach(x => { const el = $(`#a5Filter${x}`); if (el) el.addEventListener(x === 'Search' ? 'input' : 'change', () => renderA5(role)); });
    renderA5List(role, filters);
  }

  /* ---------- migration ---------- */
  function migrateLegacy() {
    try {
      if (localStorage.getItem(MIGRATED_KEY) === '1') return;
      const store = readStore();
      const handoffs = readLegacy(LEGACY_HANDOFF_KEY);
      for (const ref of Object.keys(handoffs.records || {})) {
        const h = handoffs.records[ref];
        const s = store[h?.sourceReference || ref];
        if (s) { ensureInquiry(s); s.inquiry.intake.handoffRef = h?.handoffId || ref; s.inquiry.intake.unit = h?.destinationUnit || s.inquiry.intake.unit || s.caseData?.region || ''; }
      }
      const a5 = readLegacy(LEGACY_A5_KEY);
      for (const c of a5.cases || []) {
        const ref = c.sourceReference || String(c.activity4HandoffId || '').replace('activity4:', '').replace(':activity5', '');
        const s = store[ref] || store[c.referenceNo];
        if (s) { ensureInquiry(s); if (c.report213?.startedAt) { s.inquiry.prelim.startedAt = c.report213.startedAt; s.inquiry.prelim.deadlineAt = c.report213.deadlineAt; } }
      }
      // หมายเหตุ: การแปลงเฟส activity5-dispatch (complete) -> a5-intake ไม่ทำที่นี่อีกต่อไป
      // (เดิมทำครั้งเดียวตาม MIGRATED_KEY ทำให้เคสที่มาถึงทีหลังค้างที่ debug fallback)
      // ย้ายไปที่ normalizeIncomingCase() ซึ่งทำงานทุกครั้งที่อ่านสำนวน (allA5Cases/getState)
      writeStore(store);
      localStorage.setItem(MIGRATED_KEY, '1');
    } catch (err) { console.error('A5 migration failed', err); }
  }

  function showView(which) {
    const a4 = document.getElementById('staffApp'), a5 = document.getElementById('a5App');
    if (!a4 || !a5) return;
    a4.classList.toggle('ws-hidden', which !== 'a4');
    a5.classList.toggle('ws-hidden', which !== 'a5');
    const url = new URL(location.href);
    if (which === 'a5') url.searchParams.set('view', 'a5'); else url.searchParams.delete('view');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    document.body.classList.remove('ecmis-sidebar-mobile-open');
  }
  function showA5(caseId) {
    showView('a5');
    const role = activeRole();
    if (caseId) renderA5Detail(caseId, role); else renderA5(role);
  }
  function showA4() { showView('a4'); }

  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  rootScope.EXMIS = rootScope.EXMIS || {};
  Object.assign(rootScope.EXMIS, {
    showA5, showA4, createInquiry: defaultInquiry,
    extensionRound, canApproveExtension, requestExtension, applyExtension, denyExtension, pendingExtension, deadlineTone, daysLeft, addDays,
    chainState, chainApprove, chainSkipGroup, caseAgeTone, parseThaiDate,
    journeyStages, phaseLabel, currentDeadline, ensureInquiry,
    paperForTab, docTabsA5, paperPlan, paperExt, paper213, paper644, paperMti, paperNoticeAccusation, paperRecordAccusation, paperProsecutorLetters, paperWarrants, paperSpecial58,
    editorForA5, actionsForA5, extSectionHtml, progressSectionHtml, reportOf, reportTypeForStage,
    a5qFilter, A5_MENU, renderA5List, allA5Cases, fitA5Paper,
    attachIntelligentSuggestion, wireA5Suggestions, correctThaiWriting, formalizeWriting, a5ContextualSuggestions, a5LearnContextSuggestion,
    fontSizeControlsA5, applyFontSizeA5, wireA5FontControls,
    migrateLegacy, STORAGE_KEY
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!document.getElementById('a5App')) return;
      migrateLegacy();
      const initial = new URLSearchParams(location.search).get('view') === 'a5';
      if (initial) showA5(new URLSearchParams(location.search).get('case') || null);
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = rootScope.EXMIS;
})();
