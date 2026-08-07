/* E-CMIS กิจกรรมที่ 5 — ระบบกระบวนการดำเนินงานเรื่องร้องเรียนกล่าวหา
 * แนวทางเดียวกับ activity4-workspace.js (IIFE เดียว, render-string, SweetAlert,
 * localStorage ร่วมกับกิจกรรมที่ 4 — สำนวนเดียวต่อเนื่อง ไม่มีรอยต่อ)
 *
 * ครอบคลุม 17 กระบวนงานตามกระบวนการไต่สวน.xlsx (sheet6):
 *  1 รับเรื่อง/ตรวจ/มอบหมาย (+โอนก่อนมอบหมาย สถานะรอปลายทางรับโอน)  2 ไต่สวนเบื้องต้น 213
 *  3 กิจกรรมแทรก (คุ้มครองพยาน A6 / หมายค้น A9)                     4 ขยายเวลา 213 (ยื่น/อนุมัติ/ปฏิเสธ)
 *  5 213 ไม่เสร็จ 180 วัน → คกก. (ครั้งที่ 3)                         6 ตรวจ/เสนอ 213 ตามลำดับชั้น 4 ชั้น
 *  7 ผลมติ 213 (+ตั้งชุดไต่สวน 24ว.1/24ว.3, หนังสือส่งมอบ 213→644)    8 ไต่สวนชี้มูล 644
 *  9 ขยายเวลา 644 (+ครั้งที่ 5, 2 ปี/3 ปี/5 ปี)                      10 ตรวจ/เสนอ 644 ตามลำดับชั้น
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
    '213': { baseDays: 60, rounds: ['director', 'secretary', 'committee'], label: 'ไต่สวนเบื้องต้น (213)' },
    '644': { baseDays: 270, rounds: ['director', 'director', 'secretary', 'secretary', 'committee'], label: 'ไต่สวนชี้มูล (644)' }
  });
  const EXTENSION_DAYS = 60;
  const REVIEW_CHAIN = Object.freeze({
    '213': [
      { level: 1, role: 'group-director', label: 'ผอ.กลุ่มงาน (เฉพาะสายจริง)', optional: true },
      { level: 2, role: 'director', label: 'ผอ.เขต/กอง/สำนัก (หัวหน้าพนักงาน)' },
      { level: 3, role: 'secretary', label: 'ผู้ช่วย/รอง/เลขาธิการ ป.ป.ท.' }
    ],
    '644': [
      { level: 1, role: 'group-director', label: 'ผอ.กลุ่มงาน (เฉพาะสายจริง)', optional: true },
      { level: 2, role: 'director', label: 'ผอ.เขต/กอง/สำนัก (หัวหน้าพนักงาน)' },
      { level: 3, role: 'secretary', label: 'ผู้ช่วย/รอง/เลขาธิการ ป.ป.ท.' }
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
  function swalForm(title, html, confirmText = 'ยืนยัน') { if (!window.Swal) return Promise.resolve({ isConfirmed: true, value: {} }); return Swal.fire({ title, html, showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: 'ยกเลิก', confirmButtonColor: '#082b50', cancelButtonColor: '#687789', preConfirm: () => { const out = {}; $$('#swalForm [data-sf]').forEach(el => out[el.dataset.sf] = el.value.trim()); return out; } }); }

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
    cs.rep.reviewChain.push({ level: step.level, role, label: step.label, opinion, by: ROLE_LABELS[role], at: now() });
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
    const stages = [
      { key: 'intake', label: 'รับเรื่อง', state: true },
      { key: 'screening', label: 'กลั่นกรอง/มอบหมาย', state: ['admin', 'officer'].includes(w.stage) || isA5 },
      { key: 'review', label: 'พิจารณา Form 3', state: ['center', 'division', 'acting'].includes(w.stage) || isA5 },
      { key: 'approve', label: 'อนุมัติ/เลขสำนวน', state: ['division', 'acting'].includes(w.stage) || isA5 },
      { key: 'dispatch', label: 'จัดส่งเขต/สำนัก', state: ['officer-dispatch', 'activity5-dispatch'].includes(w.stage) || isA5 },
      { key: 'a5-intake', label: 'รับสำนวน/มอบหมาย', state: ['a5-intake'].includes(w.stage) || ['a5-prelim', 'a5-prelim-review', 'a7-213', 'a5-inquiry', 'a5-inquiry-review', 'a7-644', 'a5-outcome', 'a5-prosecutor', 'closed'].includes(w.stage) },
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
    return `<nav class="ws-card ws-stagebar" aria-label="เส้นทางสำนวนคดี"><div class="ws-stage-track">${stages.map((s, idx) => {
      const done = idx < current;
      const active = idx === current;
      return `<span class="ws-stage-node ${done ? 'done' : ''} ${active ? 'active' : ''}" title="${escapeHtml(s.label)}"><b>${idx + 1}</b><small>${escapeHtml(s.label)}</small></span>`;
    }).join('')}</div><p class="ws-stage-caption">รับเรื่อง → อนุมัติ → จัดส่งเขต → รับสำนวน → ไต่สวน 213 → กลั่นกรอง → มติรับไต่สวน → ไต่สวน 644 → กลั่นกรอง → มติชี้มูล → ดำเนินการตามมติ → ส่งอัยการ/ต้นสังกัด → ปิด — หนึ่งสำนวนต่อเนื่อง</p></nav>`;
  }

  /* ---------- เอกสาร ---------- */
  function crest() { return `<div class="ws-paper-crest" aria-hidden="true"><svg viewBox="0 0 60 60" width="52" height="52"><circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M30 8l5 10 11-2-6 10 10 5-10 6 2 11-10-5-10 5 2-11-10-6 10-5-6-10 11 2z" fill="currentColor" opacity=".85"/><text x="30" y="34" text-anchor="middle" font-size="9" fill="#fff">ป.ป.ท.</text></svg></div>`; }
  function paperShell(title, meta, body, signers = []) {
    return `<section class="ws-paper"><header class="ws-paper-head">${crest()}<div><h2>${escapeHtml(title)}</h2><p>สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ (สำนักงาน ป.ป.ท.)</p></div></header><dl class="ws-paper-meta">${meta.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v || '')}</dd></div>`).join('')}</dl><div class="ws-paper-body">${body}</div><footer class="ws-paper-sign">${signers.map(s => `<div><p>${escapeHtml(s.role || '')}</p><strong>${escapeHtml(s.name || '')}</strong><p>${escapeHtml(s.date || '')}</p></div>`).join('')}</footer></section>`;
  }
  function paper213(state) {
    const c = state.caseData, i = state.inquiry, p = i?.prelim || {};
    return paperShell('รายงานการไต่สวนเบื้องต้น (แบบ 213)', [
      ['เลขที่สำนวน', c.id], ['เลขรับบริการ', `${c.trackingYear} / ${c.trackingCode}`], ['เรื่อง', state.documentData?.documentSubject || c.subject],
      ['ผู้ร้องเรียน', c.complainant], ['ผู้ถูกร้อง/หน่วยงาน', c.agency], ['เขต/สำนัก', i?.intake?.unit || c.region],
      ['ผู้รับผิดชอบสำนวน', i?.intake?.investigator || ''], ['เริ่มนับ 60 วัน (วันรับเรื่องครั้งแรก)', p.startedAt || i?.intake?.receivedFirstAt || ''], ['วันครบกำหนด', p.deadlineAt || '']
    ],
      `<h3>ประเด็นแห่งคดี 4 ประเด็น</h3><div class="ws-grid-2">${[['status', 'สถานะผู้ถูกร้อง'], ['authority', 'ขอบเขตอำนาจหน้าที่'], ['action', 'การกระทำถูกต้องตามอำนาจหน้าที่หรือไม่'], ['damage', 'ความเสียหาย']].map(([k, l]) => `<div class="ws-field"><label>${l}</label><p>${escapeHtml(p.issues?.[k] || 'ยังไม่ระบุ')}</p></div>`).join('')}</div><h3>สรุปผลการไต่สวนเบื้องต้น</h3><p class="ws-paper-text">${escapeHtml(p.report || 'ยังไม่ได้สรุปรายงาน')}</p><h3>ความเห็นเสนอ</h3><p class="ws-paper-text">${escapeHtml(p.workLog || 'ยังไม่ระบุ')}</p>`,
      [{ role: 'หัวหน้าพนักงาน ป.ป.ท. (ผอ.)', name: i?.intake?.director || '' }, { role: 'เลขาธิการคณะกรรมการ ป.ป.ท.', name: '' }]);
  }
  function paper644(state) {
    const c = state.caseData, i = state.inquiry, q = i?.inquiry644 || {}, m = i?.committee213 || {};
    return paperShell('รายงานการไต่สวนเพื่อวินิจฉัยชี้มูล (แบบ 644)', [
      ['เลขที่สำนวน', c.id], ['เลขรับบริการ', `${c.trackingYear} / ${c.trackingCode}`], ['เรื่อง', state.documentData?.documentSubject || c.subject],
      ['คำสั่งแต่งตั้ง', `${m.orderType === '24v3' ? 'คณะอนุกรรมการไต่สวน (ม.24 ว.3)' : 'คณะพนักงานไต่สวน (ม.24 ว.1)'} ${m.orderNo || ''}`],
      ['เริ่มนับ 270 วัน', q.startedAt || ''], ['วันครบกำหนด', q.deadlineAt || '']
    ],
      `<h3>ผู้ถูกกล่าวหา</h3><ul class="ws-list">${(q.accused || []).map(a => `<li>${escapeHtml(a)}</li>`).join('') || '<li>ยังไม่ระบุ</li>'}</ul><h3>ข้อกล่าวหา</h3><p class="ws-paper-text">${escapeHtml(q.allegations || 'ยังไม่ระบุ')}</p><h3>การแจ้งข้อกล่าวหา</h3><p class="ws-paper-text">${q.noticeSentAt ? `แจ้งแล้วเมื่อ ${q.noticeSentAt}` : 'ยังไม่ได้แจ้ง'} · ${escapeHtml(q.statements || '')}</p><h3>สรุปความเห็นชี้มูล</h3><p class="ws-paper-text">${escapeHtml(q.report || 'ยังไม่ได้สรุปรายงาน')}</p>`,
      [{ role: 'หัวหน้าพนักงาน ป.ป.ท. (ผอ.)', name: i?.intake?.director || '' }, { role: 'เลขาธิการคณะกรรมการ ป.ป.ท.', name: '' }]);
  }
  function paperMti(state, which) {
    const c = state.caseData, i = state.inquiry, m = which === '213' ? i?.committee213 : i?.committee644;
    return paperShell(`มติคณะกรรมการ ป.ป.ท. (${which === '213' ? 'ไต่สวนเบื้องต้น' : 'วินิจฉัยชี้มูล'})`, [
      ['เลขที่สำนวน', c.id], ['เรื่อง', state.documentData?.documentSubject || c.subject], ['มติที่', m?.mtiNo || ''], ['วันที่', m?.mtiDate || '']
    ],
      `<p class="ws-paper-text"><strong>ผลมติ: ${escapeHtml(m?.result || 'ยังไม่มีมติ')}</strong></p><p class="ws-paper-text">${escapeHtml(m?.note || '')}</p>`,
      [{ role: 'ประธานกรรมการ ป.ป.ท.', name: '' }]);
  }

  /* ---------- รายการสำนวน ---------- */
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
    const q = (filters?.q || '').toLowerCase(), region = filters?.region || '', phase = filters?.phase || '', investigator = filters?.investigator || '';
    const rows = cases.filter(c => {
      const i = c.inquiry || {};
      const searchable = [c.caseData?.id, c.caseData?.subject, c.caseData?.agency, c.caseData?.complainant, i?.intake?.investigator, i?.inquiry644?.investigator].join(' ').toLowerCase();
      return (!q || searchable.includes(q)) && (!region || (i?.intake?.unit || c.caseData?.region) === region) &&
        (!phase || phaseLabel(c) === phase) && (!investigator || (i?.intake?.investigator || i?.inquiry644?.investigator || '') === investigator);
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
    if (i.intake.transfer.status === 'PENDING') {
      out += `<div class="ws-callout">สถานะ: รอปลายทางรับโอน (${escapeHtml(i.intake.transfer.target)}) — ส่งโดย ${escapeHtml(i.intake.transfer.by)} ${escapeHtml(i.intake.transfer.at)}${i.intake.transfer.note ? ` · ${escapeHtml(i.intake.transfer.note)}` : ''}</div><div class="ws-grid-2"><div class="ws-field"><label>หมายเหตุ (รับ/ปฏิเสธ)</label><input id="a5TransferNote" placeholder="ระบุหมายเหตุ"></div></div><div class="ws-actions"><button class="ws-button primary" data-a5-action="transfer-accept">รับโอน (รับเป็นเจ้าของเรื่อง)</button><button class="ws-button danger" data-a5-action="transfer-reject">ปฏิเสธ — เรื่องคงอยู่ที่สำนักงานเดิม</button></div>`;
    }
    if (i.intake.transferPost.status === 'PENDING') {
      out += `<div class="ws-callout">โอนหลังมอบหมาย: เสนอโอนไป ${escapeHtml(i.intake.transferPost.target)} — รอเลขาธิการอนุมัติ (โดย ${escapeHtml(i.intake.transferPost.by)})</div>${role === 'secretary' ? `<div class="ws-actions"><button class="ws-button primary" data-a5-action="transfer-post-approve">เลขาธิการอนุมัติโอน</button><button class="ws-button danger" data-a5-action="transfer-post-reject">ไม่อนุมัติ</button></div>` : '<p class="ws-policy-note">รอเลขาธิการพิจารณาอนุมัติ</p>'}`;
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
    <section class="ws-section"><h3>2. คำสั่ง/หนังสือมอบหมาย</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขที่คำสั่ง/หนังสือมอบหมาย</label><input id="a5OrderNo" value="${escapeHtml(i.intake.orderNo || '')}" placeholder="เช่น คำสั่งที่ 45/2569" ${canAssign ? '' : 'disabled'}></div><div class="ws-field"><label>วันที่</label><input id="a5OrderDate" type="date" value="${escapeHtml(i.intake.orderDate || '')}" ${canAssign ? '' : 'disabled'}></div></div></section>
    <section class="ws-section"><h3>3. คดีที่รับจาก ป.ป.ช. (มาตรา 62)</h3><label class="ws-choice"><input type="checkbox" id="a5M62Flag" ${m62.flag ? 'checked' : ''} ${canAssign ? '' : 'disabled'}><span><strong>เป็นคดีที่คณะกรรมการ ป.ป.ช. มอบหมาย (ม.62)</strong><small>ต้องมีมติ ป.ป.ช. มอบหมายทุกสำนวน — ตรวจอำนาจก่อน (อายุความเหลือ <6 เดือน → ส่งคืน ป.ป.ช.)</small></span></label><div class="ws-grid-2" id="a5M62Fields"><div class="ws-field"><label>เลขหนังสือ/มติ ป.ป.ช.</label><input id="a5M62Letter" value="${escapeHtml(m62.sourceLetter || '')}" placeholder="เช่น มติที่ 5/2569"></div><div class="ws-field"><label>วันที่มีมติ</label><input id="a5M62Date" type="date" value="${escapeHtml(m62.sourceMtiDate || '')}"></div><div class="ws-field ws-field-full"><label>ผลตรวจอำนาจ/อายุความ</label><input id="a5M62Age" value="${escapeHtml(m62.ageCheck || '')}" placeholder="เช่น อายุความเหลือมากกว่า 6 เดือน — อยู่ในอำนาจ ป.ป.ท."></div></div></section>
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
    } else if (next) {
      actionHtml = `<button type="button" class="ws-button secondary" data-a5-action="request-extension">ยื่นคำขอขยาย (รอบ ${next.round}: ${ROLE_LABELS[next.role]})</button>`;
    } else {
      actionHtml = `<button type="button" class="ws-button danger" data-a5-action="extension-late">ขยายครบแล้ว — เสนอ คกก. (รายงานเหตุล่าช้า)</button>`;
    }
    const history = rep.extensionHistory.length
      ? rep.extensionHistory.map(h => {
          let st = h.status === 'PENDING' ? 'รออนุมัติ' : h.status === 'DENIED' ? `ไม่อนุมัติ${h.denyNote ? ` (${escapeHtml(h.denyNote)})` : ''}` : `${escapeHtml(h.approvedBy || h.role)} อนุมัติ ${h.requestedDays} วัน`;
          return `<li>ครั้งที่ ${h.round} · ${st} · ${escapeHtml(h.reason || '')} <time>${h.requestedAt || h.approvedAt || ''}</time></li>`;
        }).join('')
      : '<li>ยังไม่มีการขยายเวลา</li>';
    return `<div class="a5-ext-list"><div class="a5-ext-track"><span class="a5-ext-label">รอบขยาย ${reportType}:</span>${rounds}</div>${tone ? `<p class="ws-deadline ${tone.tone}">${escapeHtml(tone.label)}</p>` : ''}${age ? `<p class="ws-deadline ${age.tone}">${escapeHtml(age.label)}</p>` : ''}${actionHtml}<ul class="ws-history">${history}</ul></div>`;
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
    return `<div class="a5-ext-list"><strong>ลำดับชั้นตรวจรายงาน ${reportType}:</strong><ol class="ws-list">${cs.steps.map(s => { const d = cs.done.find(x => x.level === s.level); const isCurrent = cs.current && cs.current.level === s.level; return `<li>${d ? `✅ ${escapeHtml(d.label)} — ${escapeHtml(d.by)}${d.skip ? ' (ข้าม)' : ''}: ${escapeHtml(d.opinion || '')}` : `<b>${escapeHtml(s.label)}</b>${isCurrent ? ' ← รอตรวจ' : s.optional ? ' (ไม่บังคับ)' : ''}`}</li>`; }).join('')}</ol>${cs.complete ? '<p class="ws-policy-note">ตรวจครบทุกชั้นแล้ว — พร้อมเสนอคณะกรรมการ</p>' : `<div class="ws-field"><label>ความเห็น (${ROLE_LABELS[role]})</label><textarea id="a5ChainOpinion" placeholder="บันทึกความเห็น..."></textarea></div>${cs.current?.role === role ? '<button type="button" class="ws-button primary" data-a5-action="chain-approve">เห็นชอบ — ส่งชั้นถัดไป</button>' : cs.current?.role === 'director' && role === 'director' ? '' : ''}${role === 'secretary' && cs.current?.role === 'secretary' ? '<label class="ws-choice"><input type="checkbox" id="a5SupportFlag"><span><strong>ส่งคณะอนุกรรมการสนับสนุนเลขาธิการฯ (กรณียุ่งยากซับซ้อน)</strong></span></label>' : ''}${['director', 'secretary', 'group-director'].includes(role) ? '<button type="button" class="ws-button danger" data-a5-action="chain-return">ส่งกลับแก้ไข (ไต่สวนเพิ่มเติม 30 วัน)</button>' : ''}${role === 'group-director' && !cs.done.some(d => d.level === 1) ? '<button type="button" class="ws-button ghost" data-a5-action="chain-skip-group">ไม่อยู่ในสายงาน — ข้ามชั้น</button>' : ''}`}</div>`;
  }
  function prelimEditor(state, role) {
    const i = state.inquiry, p = i.prelim, c = state.caseData;
    const isInvestigator = role === 'investigator';
    return `<section class="ws-section"><h3>กรอบเวลาไต่สวนเบื้องต้น (60 วัน นับจากวันรับเรื่องครั้งแรก ${escapeHtml(i.intake.receivedFirstAt || '')})</h3>${extSectionHtml('213', i, role)}
    <div class="ws-grid-2"><div class="ws-field"><label>วันที่เริ่มนับ (วันรับเรื่องครั้งแรก)</label><input type="date" value="${escapeHtml(p.startedAt || i.intake.receivedFirstAt || '')}" disabled></div><div class="ws-field"><label>วันครบกำหนด</label><input type="date" value="${escapeHtml(p.deadlineAt || '')}" disabled></div></div></section>
    <section class="ws-section"><h3>1. แผนงานคดีและบันทึกการปฏิบัติงาน</h3><div class="ws-field"><label>แผนงานคดี (Case Plan)</label><textarea id="a5Plan" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.plan || '')}</textarea></div><div class="ws-grid-2"><div class="ws-field"><label>สถานะแผนคดี</label><input value="${escapeHtml(p.planStatus || '')}" disabled><small>หัวหน้าพนักงาน ป.ป.ท. ต้องอนุมัติแผนก่อนใช้มาตรา 18</small></div>${p.planStatus === 'รออนุมัติจากหัวหน้าพนักงาน' && role === 'director' ? '<div class="ws-field"><button type="button" class="ws-button primary" data-a5-action="plan-approve-213">อนุมัติแผนคดี</button></div>' : ''}</div><div class="ws-field"><label>บันทึกการปฏิบัติงาน/ความคืบหน้า</label><textarea id="a5WorkLog" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.workLog || '')}</textarea></div></section>
    <section class="ws-section"><h3>2. วิเคราะห์ประเด็นแห่งคดี 4 ประเด็น</h3><div class="ws-grid-2">${[['status', 'สถานะผู้ถูกร้อง'], ['authority', 'ขอบเขตอำนาจหน้าที่'], ['action', 'การกระทำถูกต้องตามอำนาจหน้าที่หรือไม่'], ['damage', 'ความเสียหาย']].map(([k, l]) => `<div class="ws-field"><label>${l}</label><textarea id="a5Issue_${k}" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(p.issues?.[k] || '')}</textarea></div>`).join('')}</div>
    <div class="ws-callout">กิจกรรมแทรก: ขอคุ้มครองพยาน → กิจกรรมที่ 6 · ขอหมายค้น → กิจกรรมที่ 9 (ไม่หยุดนับเวลา 213) — บันทึกคำขอ/ผลในฟิลด์ด้านล่าง</div><div class="ws-grid-2"><div class="ws-field"><label>คำขอคุ้มครองพยาน (A6)</label><input id="a5A6" value="${escapeHtml(p.evidence || '')}" placeholder="ระบุผู้ขอ/ผู้ถูกคุ้มครอง/ผล" ${isInvestigator ? '' : 'disabled'}></div><div class="ws-field"><label>คำร้องขอหมายค้น (A9)</label><input id="a5A9" value="${escapeHtml(p.searchWarrant || '')}" placeholder="เลขคำร้อง/ผลศาล" ${isInvestigator ? '' : 'disabled'}></div></div>
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
    const i = state.inquiry, m = i.committee213;
    return `<section class="ws-section"><h3>รายงาน 213 — คณะกรรมการ ป.ป.ท. พิจารณา</h3>${paper213(state)}<div class="ws-choice-grid">${MTI_213_RESULTS.map(r => `<label class="ws-choice"><input type="radio" name="a5Mti213" value="${r}" ${m.result === r ? 'checked' : ''}><span><strong>${r}</strong></span></label>`).join('')}</div><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ</label><input id="a5Mti213No" value="${escapeHtml(m.mtiNo || '')}"></div><div class="ws-field"><label>วันที่มีมติ</label><input id="a5Mti213Date" type="date" value="${escapeHtml(m.mtiDate || '')}"></div><div class="ws-field ws-field-full"><label>ข้อความในมติ/หมายเหตุ</label><textarea id="a5Mti213Note">${escapeHtml(m.note || '')}</textarea></div></div>
    <aside class="ws-callout">รับไว้ไต่สวน → เลือกชุดไต่สวน (ม.24 ว.3 คณะอนุกรรมการ — ประธานกรรมการลงนาม, นับ 270 วันจากวันมติ / ม.24 ว.1 คณะพนักงาน — เลขาธิการลงนาม, นับจากวันลงนาม) + ระบุผู้รับผิดชอบชั้น 644</aside>
    <div class="ws-grid-2"><div class="ws-field"><label>ประเภทชุดไต่สวน</label><select id="a5OrderType"><option value="24v3" ${m.orderType === '24v3' || role === 'committee' ? 'selected' : ''}>คณะอนุกรรมการไต่สวน (ม.24 ว.3)</option><option value="24v1" ${m.orderType === '24v1' ? 'selected' : ''}>คณะพนักงานไต่สวน (ม.24 ว.1)</option></select></div><div class="ws-field"><label>เลขที่คำสั่งแต่งตั้ง</label><input id="a5OrderNo644" value="${escapeHtml(m.orderNo || '')}" placeholder="ระบบออกให้อัตโนมัติเมื่อบันทึกมติ"></div><div class="ws-field"><label>ผู้รับผิดชอบชั้น 644</label><select id="a5Investigator644">${INVESTIGATORS.map(x => `<option ${(m.investigator644 || i.intake.investigator) === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>หนังสือส่งมอบสำนวน (ถ้าคนละคนกับชั้น 213)</label><input id="a5Handover" value="${escapeHtml(m.handoverDoc?.letterNo || '')}" placeholder="เลขหนังสือส่งมอบสำนวน"></div></div>${state.workflow?.status?.includes('ปรับองค์คณะ') ? '<button type="button" class="ws-button primary" data-a5-action="org-approve">อนุมัติปรับองค์คณะ</button>' : ''}</section>`;
  }
  function inquiryEditor(state, role) {
    const i = state.inquiry, q = i.inquiry644, m = i.committee213;
    const isInvestigator = role === 'investigator';
    return `<section class="ws-section"><h3>คำสั่งแต่งตั้งและกรอบเวลาไต่สวนชี้มูล (270 วัน + ขยาย 5 รอบ)</h3><div class="ws-grid-2"><div class="ws-field"><label>ชุดไต่สวน</label><input value="${m.orderType === '24v3' ? 'คณะอนุกรรมการไต่สวน (ม.24 ว.3)' : 'คณะพนักงานไต่สวน (ม.24 ว.1)'} ${m.orderNo || ''}" disabled></div><div class="ws-field"><label>ผู้รับผิดชอบชั้น 644</label><input value="${escapeHtml(q.investigator || i.intake.investigator || '')}" disabled>${m.handoverDoc?.letterNo ? `<small>หนังสือส่งมอบสำนวน: ${escapeHtml(m.handoverDoc.letterNo)}</small>` : ''}</div><div class="ws-field"><label>เริ่มนับ 270 วัน</label><input type="date" value="${escapeHtml(q.startedAt || '')}" disabled><small>ว.3 = วันบอร์ดมีมติ / ว.1 = วันเลขาธิการลงนาม</small></div><div class="ws-field"><label>วันครบกำหนด</label><input type="date" value="${escapeHtml(q.deadlineAt || '')}" disabled></div></div>${extSectionHtml('644', i, role)}
    <div class="ws-field"><label>แผนงานคดี (ชั้น 644)</label><textarea id="a5Plan644" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.plan || '')}</textarea></div>${q.planStatus === 'รออนุมัติจากหัวหน้าพนักงาน' && role === 'director' ? '<button type="button" class="ws-button primary" data-a5-action="plan-approve-644">อนุมัติแผนคดี 644</button>' : `<small>สถานะแผน: ${escapeHtml(q.planStatus || '')}</small>`}</section>
    <section class="ws-section"><h3>1. การไต่สวน</h3><div class="ws-field"><label>ผู้ถูกกล่าวหา (ทีละบรรทัด)</label><textarea id="a5Accused" ${isInvestigator ? '' : 'disabled'}>${escapeHtml((q.accused || []).join('\n'))}</textarea></div><div class="ws-field"><label>ข้อกล่าวหา</label><textarea id="a5Allegations" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.allegations || '')}</textarea></div><div class="ws-grid-2"><div class="ws-field"><label>วันที่แจ้งข้อกล่าวหา</label><input id="a5NoticeDate" type="date" value="${escapeHtml(q.noticeSentAt || '')}" ${isInvestigator ? '' : 'disabled'}><small>แจ้งเมื่อหลักฐานเพียงพอ — เปิดโอกาสชี้แจงก่อนสรุป 644</small></div><div class="ws-field"><label>กันบุคคลเป็นพยาน (ม.58)</label><input id="a5Witnesses" value="${escapeHtml((q.witnesses || []).join(', '))}" ${isInvestigator ? '' : 'disabled'}></div></div><div class="ws-field"><label>บันทึกถ้อยคำ/คำชี้แจง</label><textarea id="a5Statements" ${isInvestigator ? '' : 'disabled'}>${escapeHtml(q.statements || '')}</textarea></div>
    <div class="ws-callout">กิจกรรมแทรก: คุ้มครองพยาน (A6) / หมายค้น (A9) — บันทึกคำขอ/ผลด้านล่าง</div><div class="ws-grid-2"><div class="ws-field"><label>คุ้มครองพยาน (A6)</label><input id="a5InqA6" value="${escapeHtml(q.witnessProtection || '')}" placeholder="ผู้ขอ/ผล" ${isInvestigator ? '' : 'disabled'}></div><div class="ws-field"><label>หมายค้น (A9)</label><input id="a5InqA9" value="${escapeHtml(q.searchWarrant || '')}" placeholder="เลขคำร้อง/ผล" ${isInvestigator ? '' : 'disabled'}></div></div></section>
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
    const i = state.inquiry, m = i.committee644;
    return `<section class="ws-section"><h3>รายงาน 644 — คณะกรรมการ ป.ป.ท. วินิจฉัยชี้มูล</h3>${paper644(state)}<div class="ws-choice-grid">${MTI_644_RESULTS.map(r => `<label class="ws-choice"><input type="radio" name="a5Mti644" value="${r}" ${m.result === r ? 'checked' : ''}><span><strong>${r}</strong></span></label>`).join('')}</div><div class="ws-grid-2"><div class="ws-field"><label>เลขที่มติ</label><input id="a5Mti644No" value="${escapeHtml(m.mtiNo || '')}"></div><div class="ws-field"><label>วันที่มีมติ</label><input id="a5Mti644Date" type="date" value="${escapeHtml(m.mtiDate || '')}"></div><div class="ws-field ws-field-full"><label>ข้อความในมติ/หมายเหตุ</label><textarea id="a5Mti644Note">${escapeHtml(m.note || '')}</textarea></div></div><aside class="ws-callout">ชี้มูลอาญา+วินัย → ส่งอัยการ (A10) + แจ้งต้นสังกัดวินัย 60 วัน (A8) · ม.18/4 แยก ร้ายแรง/ไม่ร้ายแรง · ไม่มีมูล → แจ้ง 15 วัน · ส่ง ป.ป.ช./พนักงานสอบสวน → หนังสือส่งมอบ</aside>${state.workflow?.status?.includes('ปรับองค์คณะ') ? '<button type="button" class="ws-button primary" data-a5-action="org-approve">อนุมัติปรับองค์คณะ</button>' : ''}</section>`;
  }
  function outcomeEditor(state, role) {
    const i = state.inquiry, o = i.outcome, m = i.committee644, m62 = i.intake.m62 || {};
    const result = m.result || '';
    const isClerk = ['clerk', 'investigator'].includes(role);
    return `<section class="ws-section"><h3>ผลมติคณะกรรมการ: ${escapeHtml(result || 'ยังไม่มีมติ')}</h3><div class="ws-grid-2"><div class="ws-field"><label>แนวทางดำเนินการ</label><input value="${escapeHtml(result)}" disabled></div><div class="ws-field"><label>เลขหนังสือ/เอกสารส่ง</label><input id="a5OutLetters" value="${escapeHtml(o.letters || '')}" ${isClerk ? '' : 'disabled'}></div>${result.includes('อาญา') ? `<div class="ws-field"><label>พนักงานอัยการ (เขตอำนาจ)</label><input id="a5OutProsecutor" value="${escapeHtml(o.prosecutor || '')}" placeholder="อัยการคดีทุจริต / อัยการทหาร" ${isClerk ? '' : 'disabled'}></div>` : ''}${result.includes('วินัย') ? `<div class="ws-field"><label>หน่วยงานต้นสังกัด (วินัย 60 วัน)</label><input id="a5OutDiscipline" value="${escapeHtml(o.disciplineAgency || '')}" ${isClerk ? '' : 'disabled'}></div>` : ''}<div class="ws-field ws-field-full"><label>การติดตามผล (กบต.)</label><textarea id="a5OutFollowup" ${isClerk ? '' : 'disabled'}>${escapeHtml(o.followup || '')}</textarea></div></div>${result.includes('ไม่มีมูล') ? '<p class="ws-policy-note">ต้องแจ้งผู้ถูกกล่าวหา/ต้นสังกัดภายใน 15 วันนับแต่วันที่มีมติ (ระบุในเลขหนังสือ)</p>' : ''}${m62.flag ? `<section class="ws-section"><h3>รายงานผลกลับ ป.ป.ช. (มาตรา 65)</h3><div class="ws-grid-2"><div class="ws-field"><label>เลขหนังสือรายงานผล</label><input id="a5M62Report" value="${escapeHtml(m62.report65Letter || '')}" placeholder="เช่น หนังสือที่ สปท 0012/2569"></div><div class="ws-field"><label>วันที่</label><input id="a5M62ReportDate" type="date" value="${escapeHtml(m62.report65Date || '')}"></div></div></section>` : ''}</section>`;
  }
  function prosecutorEditor(state, role) {
    const i = state.inquiry, p = i.prosecutor;
    return `<section class="ws-section"><h3>พนักงานอัยการสั่งการ (กิจกรรมที่ 10)</h3><div class="ws-callout">${p.orderType ? `คำสั่งอัยการ: ${escapeHtml(p.orderType)}${p.orderDetail ? ` — ${escapeHtml(p.orderDetail)}` : ''}` : 'รอคำสั่งจากพนักงานอัยการ (อาจสั่งให้ไต่สวนเพิ่มเติม/เพิ่มผู้ถูกกล่าวหา/แยกสำนวน)'}</div>
    <div class="ws-field"><label>คำสั่งอัยการ</label><select id="a5ProsecutorOrder">${PROSECUTOR_ORDERS.map(x => `<option ${p.orderType === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><div class="ws-field"><label>รายละเอียดคำสั่ง</label><textarea id="a5ProsecutorDetail">${escapeHtml(p.orderDetail || '')}</textarea></div><label class="ws-choice"><input type="checkbox" id="a5A7Approve"><span><strong>กรณีแยกสำนวน — คณะกรรมการ ป.ป.ท. เห็นชอบแล้ว</strong><small>การแยกสำนวนต้องเสนอให้กิจกรรมที่ 7 เห็นชอบก่อน</small></span></label>
    <div class="ws-field"><label>เลขหนังสือส่งผลกลับอัยการ</label><input id="a5ProsecutorLetters" value="${escapeHtml(p.letters || '')}" placeholder="เช่น หนังสือที่ สปท 0013/2569"></div></section>`;
  }
  function specialEditor(state, role) {
    const i = state.inquiry, s = i.special, c = state.caseData;
    return `<section class="ws-section"><h3>ตรวจสอบข้อเท็จจริง (มาตรา 58/2-58/3) — ไม่มีเลขสำนวน ไม่เข้าระบบไต่สวน</h3><div class="ws-grid-2"><div class="ws-field"><label>ประเภท</label><select id="a5SpecialType"><option value="582" ${s.type === '582' || c.decision === '58/2' ? 'selected' : ''}>58/2 ปัญหาความเดือดร้อน</option><option value="583" ${s.type === '583' ? 'selected' : ''}>58/3 โครงการวงเงินสูงเกินจริง</option></select></div><div class="ws-field"><label>ผอ. มอบหมายเจ้าหน้าที่</label><input id="a5SpecialAssignee" value="${escapeHtml(s.assignee || '')}" placeholder="ชื่อเจ้าหน้าที่ ป.ป.ท. ผู้ตรวจสอบ"></div><div class="ws-field"><label>หน่วยงานที่แจ้ง (58/2: หน่วยงานรัฐ / 58/3: สตง.)</label><input id="a5SpecialAgency" value="${escapeHtml(s.agency || '')}"></div><div class="ws-field"><label>วันที่รายงาน/แจ้ง</label><input id="a5SpecialDate" type="date" value="${escapeHtml(s.reportedAt || '')}"></div><div class="ws-field ws-field-full"><label>ผลการดำเนินการ/หมายเหตุ</label><textarea id="a5SpecialResult">${escapeHtml(s.result || '')}</textarea></div></div><div class="ws-actions">${s.secretaryAt ? `<span class="ws-status success">เสนอเลขาธิการแล้ว ${escapeHtml(s.secretaryAt)}</span>` : '<button class="ws-button secondary" data-a5-action="special-secretary">เสนอเลขาธิการตามลำดับชั้น</button>'}<button class="ws-button secondary" data-a5-action="special-notice">หน่วยงานไม่แก้ไข — ประกาศให้ประชาชนทราบ</button><button class="ws-button danger" data-a5-action="special-switch">พบพฤติการณ์ทุจริต — เปลี่ยนเส้นทางเข้าคดี</button></div>${s.publicNotice ? '<p class="ws-policy-note">✅ ประกาศให้ประชาชนทราบแล้ว (58/2)</p>' : ''}${s.switched ? '<p class="ws-policy-note">⚠️ เปลี่ยนเส้นทางเข้าสู่คดีตามอำนาจแล้ว</p>' : ''}</section>`;
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
      case 'a7-213': return `${reset}<button class="ws-button primary" data-a5-action="mti213-decide">บันทึกมติ คกก.</button>`;
      case 'a5-inquiry': return `${reset}<button class="ws-button secondary" data-a5-action="inquiry-save">บันทึกร่าง</button>${role === 'investigator' ? '<button class="ws-button primary" data-a5-action="inquiry-submit">เสนอรายงาน 644 ตามลำดับชั้น</button>' : ''}`;
      case 'a5-inquiry-review': return `${reset}<button class="ws-button secondary" data-a5-action="chain-return">ส่งกลับแก้ไข</button>${state.inquiry?.inquiry644?.supportPending ? '<button class="ws-button primary" data-a5-action="support-record">รับทราบความเห็นอนุฯ — เสนอ คกก.</button>' : ''}`;
      case 'a7-644': return `${reset}<button class="ws-button primary" data-a5-action="mti644-decide">บันทึกมติชี้มูล คกก.</button>`;
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
    <aside class="ws-doc-pane"><div class="ws-doc-toolbar"><div class="ws-doc-tabs">${docTabsA5(state)}</div><button class="ws-button secondary" data-a5-action="print">พิมพ์/PDF</button></div><div class="ws-paper-stage" id="a5PaperStage">${paperForTab(state, '213')}</div></aside></div>
    <div class="ws-actions">${actionsForA5(state, role)}</div></main>`;
    $('#a5BackList').onclick = () => { view = 'list'; renderA5(role); };
    wireA5(state, role);
  }
  function docTabsA5(state) {
    const tabs = [['213', 'รายงาน 213'], ['644', 'รายงาน 644'], ['mti', 'มติ คกก.'], ['letter', 'หนังสือส่ง']];
    return tabs.map(([k, l]) => `<button type="button" class="ws-doc-tab ${k === '213' ? 'active' : ''}" data-a5-doc="${k}">${l}</button>`).join('');
  }
  function paperForTab(state, tab) {
    if (state.caseData?.decision === '58/2') return paperShell('บันทึกการตรวจสอบข้อเท็จจริง (58/2-58/3)', [['เรื่อง', state.caseData.subject], ['ผู้ตรวจ', state.inquiry.special.assignee], ['หน่วยงานที่แจ้ง', state.inquiry.special.agency], ['วันที่', state.inquiry.special.reportedAt]], `<p class="ws-paper-text">${escapeHtml(state.inquiry.special.result || '')}</p>`);
    if (tab === '644') return paper644(state);
    if (tab === 'mti') return paperMti(state, state.workflow?.stage === 'a7-644' || state.workflow?.stage === 'a5-outcome' || state.workflow?.stage === 'a5-prosecutor' || state.workflow?.stage === 'closed' ? '644' : '213');
    if (tab === 'letter') return paperShell('หนังสือส่งสำนวนคดี', [['เลขที่', state.documentData?.dispatchLetterNo || ''], ['ถึง', state.inquiry.intake.unit || ''], ['วิธีจัดส่ง', state.documentData?.dispatchSendMethod || ''], ['เลข EMS', state.documentData?.dispatchEms || '']], `<p class="ws-paper-text">ส่งสำนวนคดี ${escapeHtml(state.caseData.id)} ไปยัง ${escapeHtml(state.inquiry.intake.unit || '')} เพื่อดำเนินการตามอำนาจหน้าที่ ตามมติ/คำสั่งที่เกี่ยวข้อง</p>`, [{ role: 'หัวหน้าพนักงาน ป.ป.ท.', name: state.inquiry.intake.director || '' }]);
    return paper213(state);
  }

  function wireA5(state, role) {
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
      const popup = (title, fields, confirmText) => swalForm(title, `<div id="swalForm">${fields.map(([id, label, type = 'text', ph = '']) => `<div class="ws-field" style="text-align:left"><label>${label}</label><input data-sf="${id}" type="${type}" placeholder="${ph}" style="width:100%;padding:.55rem;border:1px solid #c9d2dc;border-radius:.5rem"></div>`).join('')}</div>`, confirmText);

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
        const fast = await popup('เสนอรายงาน 213', [['a5FastTrack', 'เร่งด่วน (ใบด่วน — ใกล้ขาดอายุความ)?', 'text', 'ไม่ / ใช่']], 'เสนอ');
        i.prelim.fastTrack = fast.value?.a5FastTrack ? /ใช่|ด่วน/i.test(fast.value.a5FastTrack) : false;
        if (i.prelim.fastTrack) { w.stage = 'a7-213'; w.owner = 'committee'; w.status = 'ใบด่วน — คกก. พิจารณา 213 (ขอบรรจุวาระเร่งด่วน)'; i.committee213.note = `${i.committee213.note || ''}\n[ใบด่วน] ขอบรรจุวาระการประชุมเร่งด่วนพร้อมเหตุผลอันสมควร`; add('เสนอรายงาน 213 แบบใบด่วน (เร่งด่วน) — ตรงเข้าคณะกรรมการ'); }
        else { w.stage = 'a5-prelim-review'; w.owner = 'group-director'; w.status = 'รอตรวจตามลำดับชั้น (ผอ.กลุ่ม → ผอ.เขต/กอง → ผู้ช่วย/รอง/เลขาธิการ)'; i.prelim.submittedAt = now(); add('นักสืบเสนอรายงาน 213 ตามลำดับชั้น'); }
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
        const fast = await popup('เสนอรายงาน 644', [['a5FastTrack644', 'เร่งด่วน (ใบด่วน)?', 'text', 'ไม่ / ใช่']], 'เสนอ');
        i.inquiry644.fastTrack = fast.value?.a5FastTrack644 ? /ใช่|ด่วน/i.test(fast.value.a5FastTrack644) : false;
        if (i.inquiry644.fastTrack) { w.stage = 'a7-644'; w.owner = 'committee'; w.status = 'ใบด่วน — คกก. วินิจฉัย 644'; add('เสนอรายงาน 644 แบบใบด่วน'); }
        else { w.stage = 'a5-inquiry-review'; w.owner = 'group-director'; w.status = 'รอตรวจตามลำดับชั้น (644)'; i.inquiry644.submittedAt = now(); add('คณะผู้ไต่สวนเสนอรายงาน 644 ตามลำดับชั้น'); }
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
        reportOf(reportType, i).lateReport = `${pop.value.a5LateReport}${pop.value.a5LateEvidence ? `\n[หลักฐาน] ${pop.value.a5LateEvidence}` : ''}`;
        w.stage = reportType === '213' ? 'a7-213' : 'a7-644'; w.owner = 'committee'; w.status = `คกก. พิจารณาขยาย${reportType} (เลขาธิการพิจารณาเอง — มอบหมายมิได้ 218/2568 ข้อ 14)`;
        add(`ขยายครบแล้วยังไม่เสร็จ — เสนอรายงานเหตุล่าช้าต่อคณะกรรมการ${i.intake ? ` (ครบ 2 ปี: ${caseAgeTone(i)?.label || '-'})` : ''}`);
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

  function headerA5(role) {
    return `<header class="ws-topbar"><div class="ws-topbar-inner"><a class="ws-brand" href="index.html"><span class="ws-brand-mark">ศร</span><span><strong>E-CMIS</strong><small>ระบบบริหารจัดการเรื่องร้องเรียน</small></span></a><div class="ws-profile"><span>สิทธิ์การทำงาน</span><select class="ws-role-select" id="wsRoleA5">${ROLE_ORDER.map(r => `<option value="${r}" ${r === role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`).join('')}</select><button type="button" class="ws-button secondary" id="a5BackToA4">งานรับเรื่อง</button></div></div></header>`;
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
    const filters = { q: $('#a5FilterSearch')?.value, region: $('#a5FilterRegion')?.value, phase: $('#a5FilterPhase')?.value, investigator: $('#a5FilterInvestigator')?.value };
    root.innerHTML = `${headerA5(role)}<main class="ws-container"><section id="a5ListView"><div class="ws-page-head"><div><p class="ws-kicker">ระบบกระบวนการดำเนินงานเรื่องร้องเรียนกล่าวหา</p><h1>รายการสำนวนคดี</h1><p>สำนวนที่ส่งต่อจากสำนักงาน ป.ป.ท. — ไต่สวนเบื้องต้น → คณะกรรมการ → ไต่สวนชี้มูล → อัยการ/ติดตาม → ปิดสำนวน</p></div></div>
    <section class="ws-dashboard" aria-label="ภาพรวมสำนวน"><article class="ws-dashboard-card overview"><span>สำนวนทั้งหมด</span><strong id="a5DashboardTotal">0</strong><p>ทุกเฟส</p></article><article class="ws-dashboard-card pending"><span>รอรับสำนวน</span><strong id="a5DashboardPending">0</strong><p>รอธุรการคดีมอบหมาย</p></article><article class="ws-dashboard-card reviewing"><span>อยู่ระหว่างไต่สวน</span><strong id="a5DashboardWorking">0</strong><p>213 / 644 / คกก.</p></article><article class="ws-dashboard-card completed"><span>เสร็จสิ้น</span><strong id="a5DashboardDone">0</strong><p>ปิดสำนวน / 58/2</p></article></section>
    <section class="ws-card ws-filters"><div class="ws-filter-grid"><div class="ws-field"><label>คำค้น</label><input id="a5FilterSearch" placeholder="เลขสำนวน เรื่อง หน่วยงาน นักสืบ"></div><div class="ws-field"><label>หน่วยงาน/เขต</label><select id="a5FilterRegion"><option value="">ทุกหน่วยงาน</option>${UNITS.map(u => `<option>${u}</option>`).join('')}</select></div><div class="ws-field"><label>เฟส/สถานะ</label><select id="a5FilterPhase"><option value="">ทุกเฟส</option></select></div><div class="ws-field"><label>ผู้รับผิดชอบ</label><select id="a5FilterInvestigator"><option value="">ทั้งหมด</option>${INVESTIGATORS.map(x => `<option>${x}</option>`).join('')}</select></div></div></section>
    <section class="ws-card"><div class="ws-table-wrap"><table class="ws-table"><thead><tr><th>เลขสำนวน/เลขรับบริการ</th><th>เรื่อง/หน่วยงาน</th><th>ผู้ร้อง/ปลายทาง</th><th>ผู้รับผิดชอบ</th><th>เฟส/สถานะ</th><th>กรอบเวลา</th></tr></thead><tbody id="a5CaseRows"></tbody></table></div></section></section></main>`;
    $('#wsRoleA5').onchange = e => { sessionStorage.setItem(A5_ROLE_KEY, e.target.value); renderA5(e.target.value); };
    $('#a5BackToA4').onclick = () => window.EXMIS?.showA4();
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
