/* ==========================================================================
   E-CMIS Activity 10 — Shared page shell runtime
   (sidebar collapse, theme, font size, profile/notif dropdowns, logout)

   Extracted from the near-identical inline <script> boilerplate that used
   to be copied into every activity10/*.html page. Page-specific logic
   (table rendering, form handlers, case actions) stays inline per page.
   Depends on: activity10/assets/ecmis-shell.css (class names/DOM ids) and,
   if present on the page, a page-defined renderSidebarMenu() — the sidebar
   menu items differ per page/role so that stays out of this shared file.
   ========================================================================== */
(function (global) {
  'use strict';

  let fontSizeLevel = 0;

  /* โหมดสาธิต: สวิตช์ "เติมข้อมูลตัวอย่าง (สำนวน 0005/2569)" — โหลดจากโฟลเดอร์เดียวกับไฟล์นี้
     ทุกหน้าที่ใช้ shell ได้ทันทีโดยไม่ต้องแก้ <script> ในแต่ละหน้า */
  (function loadDemoCase() {
    const self = document.currentScript && document.currentScript.src;
    if (!self || global.ECMIS_DEMO) return;
    const s = document.createElement('script');
    s.src = self.replace(/ecmis-shell\.js[^/]*$/, 'ecmis-demo-case.js?v=20261005_4');
    document.head.appendChild(s);
  })();

  const ROLE_DISPLAY = {
    'admin_legal': { name: 'นางกานดา รักษ์ธรรม', role: 'เจ้าหน้าที่ธุรการกองกฎหมาย', av: 'ก', intake: true },
    'Kanda.R': { name: 'นางกานดา รักษ์ธรรม', role: 'เจ้าหน้าที่ธุรการกองกฎหมาย', av: 'ก', intake: true },
    'dir_legal': { name: 'นายนภัส สอนดี', role: 'ผู้อำนวยการกองกฎหมาย', av: 'น', intake: false },
    'Napas.S': { name: 'นายนภัส สอนดี', role: 'ผู้อำนวยการกองกฎหมาย', av: 'น', intake: false },
    'group_director': { name: 'นายอานนท์ ชินประชา', role: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง', av: 'อ', intake: false },
    'Arnon.C': { name: 'นายอานนท์ ชินประชา', role: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง', av: 'อ', intake: false },
    'legal_officer': { name: 'นายณัฐพล บัวทุม', role: 'นิติกรชำนาญการพิเศษ', av: 'ณ', intake: false },
    'Nattapol.B': { name: 'นายณัฐพล บัวทุม', role: 'นิติกรชำนาญการพิเศษ', av: 'ณ', intake: false },
    'deputy_sg': { name: 'นายสุรพงษ์ วัฒนา', role: 'รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย', av: 'ส', intake: false },
    'Surapong.W': { name: 'นายสุรพงษ์ วัฒนา', role: 'รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย', av: 'ส', intake: false },
    'secgen': { name: 'นายอภิชาติ สุจริตกุล', role: 'เลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย', av: 'อ', intake: false },
    'Apichat.S': { name: 'นายอภิชาติ สุจริตกุล', role: 'เลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย', av: 'อ', intake: false }
  };

  const NOTIF_BY_ROLE = {
    admin_legal: [
      { title: '📨 ผลมติจากผู้บริหารลงนามแล้ว', text: 'สำนวน 0038/2568 ผู้บริหารลงนามแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด', icon: '🔴', urgent: true },
      { title: '📋 คำร้องขอเปิดเผยข้อมูลข่าวสาร', text: 'คำร้อง 100101/2569 เข้าสู่ระบบแล้ว ส่งกอง/สำนักที่รับผิดชอบ', icon: '📨', urgent: false },
      { title: '🏛️ คดีศาลปกครอง', text: 'คดีปกครอง 100207/2569 รอส่งพนักงานอัยการดำเนินคดีแทน', icon: '⚖️', urgent: false }
    ],
    legal_officer: [
      { title: '🔴 เตือนกรอบเวลาเร่งด่วน (เหลือ 2 วัน)', text: 'สำนวน คดี-100001/2569 ครบกำหนดยกร่างความเห็น', icon: '🔴', urgent: true },
      { title: '📋 ได้รับมอบหมายสำนวนใหม่', text: 'สำนวน คดี-100003/2569 รอนิติกรจัดทำความเห็นแย้ง', icon: '📋', urgent: false },
      { title: '📨 คำร้องขอเปิดเผยข้อมูลข่าวสาร', text: 'คำร้อง 100103/2569 รอนิติกรทำความเห็นเสนอ', icon: '📨', urgent: false }
    ],
    dir_legal: [
      { title: '🔴 มอบหมายสำนวนคดีใหม่', text: 'สำนวน คดี-100003/2569 รอมอบหมายกลุ่มงาน', icon: '🔴', urgent: true },
      { title: '📋 ตรวจพิจารณาความเห็น', text: 'สำนวน คดี-100004/2569 รอ ผอ.กอง ตรวจพิจารณาและสั่งการ', icon: '📋', urgent: false },
      { title: '🏛️ คดีศาลปกครอง', text: 'คดีปกครอง-100205/2569 เสนอ ผอ.กองกฎหมาย ตรวจ', icon: '🏛️', urgent: false }
    ],
    group_director: [
      { title: '🔴 มอบหมายนิติกร', text: 'สำนวน คดี-100002/2569 รอ ผอ.กลุ่มงาน มอบหมายนิติกร', icon: '🔴', urgent: true },
      { title: '📋 ตรวจร่างความเห็นนิติกร', text: 'สำนวน คดี-100004/2569 เสนอ ผอ.กลุ่ม ตรวจร่างความเห็น', icon: '📋', urgent: false },
      { title: '🏛️ คดีศาลปกครอง', text: 'คดีปกครอง-100204/2569 เสนอ ผอ.กลุ่ม ตรวจร่างคำให้การ', icon: '🏛️', urgent: false }
    ],
    deputy_sg: [
      { title: '🔴 รอลงนามความเห็นแย้ง', text: 'สำนวน คดี-100006/2569 เสนอผู้บริหารลงนาม', icon: '🔴', urgent: true },
      { title: '📨 คำร้องขอเปิดเผยข้อมูล', text: 'คำร้อง-100105/2569 เสนอผู้บริหารเห็นชอบมติ', icon: '📨', urgent: false },
      { title: '🏛️ คดีศาลปกครอง', text: 'คดีปกครอง-100206/2569 เสนอผู้บริหารลงนามคำให้การ', icon: '🏛️', urgent: false }
    ],
    sub_secretariat: [
      { title: '🔴 รอจัดทำรายงานความเห็นเสนอคณะอนุกรรมการฯ', text: 'คำร้อง-100301/2569 ได้รับมอบหมายจาก ผอ.กลุ่มงานความเห็นแย้ง', icon: '🔴', urgent: true },
      { title: '📅 รอบรรจุวาระและนัดหมายประชุม', text: 'คำร้อง-100302/2569 ผ่านการตรวจความครบถ้วนแล้ว', icon: '📅', urgent: false },
      { title: '📋 รอจัดทำผลมติคณะอนุกรรมการฯ', text: 'คำร้อง-100303/2569 คณะอนุกรรมการมีมติแล้ว', icon: '📋', urgent: false }
    ],
    subcommittee_screen: [
      { title: '🔴 รอพิจารณาตามระเบียบวาระ', text: 'มีเรื่องเข้าวาระการประชุมกลั่นกรองการเปิดเผยข้อมูลข่าวสาร 3 เรื่อง', icon: '🔴', urgent: true },
      { title: '📎 เอกสารประกอบการประชุม', text: 'ฝ่ายเลขานุการฯ จัดส่งเอกสารประกอบการประชุมแล้ว', icon: '📎', urgent: false }
    ],
    secgen: [
      { title: '🔴 รอเห็นชอบและลงนามมติคณะอนุกรรมการฯ', text: 'คำร้อง-100303/2569 รองเลขาธิการ ป.ป.ท. ให้ความเห็นแล้ว', icon: '🔴', urgent: true },
      { title: '📨 รอมอบหมายเรื่องใหม่', text: 'มีคำขอเปิดเผยข้อมูลข่าวสารรอมอบหมาย', icon: '📨', urgent: false }
    ],
    _default: [
      { title: '📨 รายการงานใหม่', text: 'มีงานกฎหมายในทางคดีเข้าระบบ', icon: '📋', urgent: false }
    ]
  };
  // Legacy display-name aliases point at the same lists as their role-id key.
  NOTIF_BY_ROLE['Kanda.R'] = NOTIF_BY_ROLE.admin_legal;
  NOTIF_BY_ROLE['Nattapol.B'] = NOTIF_BY_ROLE.legal_officer;
  NOTIF_BY_ROLE['Napas.S'] = NOTIF_BY_ROLE.dir_legal;
  NOTIF_BY_ROLE['Arnon.C'] = NOTIF_BY_ROLE.group_director;
  NOTIF_BY_ROLE['Surapong.W'] = NOTIF_BY_ROLE.deputy_sg;
  NOTIF_BY_ROLE['Pimchanok.T'] = NOTIF_BY_ROLE.sub_secretariat;
  NOTIF_BY_ROLE['Kitti.P'] = NOTIF_BY_ROLE.subcommittee_screen;
  NOTIF_BY_ROLE['Apichat.S'] = NOTIF_BY_ROLE.secgen;

  function getCurrentRole() {
    return sessionStorage.getItem('ecmis_role') || 'admin_legal';
  }

  /* ROLE_DISPLAY covers the 10.1 roles and stays authoritative for them so the
     existing pages keep their exact wording. Roles that only appear in newer
     activities (10.2 onwards) are resolved from the full ECMIS.ROLES registry
     instead of silently falling back to "ธุรการกองกฎหมาย". */
  function resolveRoleDisplay(roleId) {
    if (ROLE_DISPLAY[roleId]) return ROLE_DISPLAY[roleId];

    const registry = (global.ECMIS && global.ECMIS.ROLES) || null;
    if (registry) {
      const r = registry.find(function (x) { return x.id === roleId || x.login === roleId; });
      if (r) {
        const shortName = String(r.name || '').replace(/^(นางสาว|นาง|นาย|พ\.ต\.ท\.)/, '').trim();
        return {
          name: r.name,
          role: r.title,
          av: shortName.charAt(0) || '?',
          org: r.org || r.group,
          intake: false
        };
      }
    }
    return ROLE_DISPLAY['admin_legal'];
  }

  function updateRoleDisplay() {
    const roleId = getCurrentRole();
    const btnIntake = document.getElementById('btnBoardIntake');
    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRoleTitle');

    const cur = resolveRoleDisplay(roleId);
    if (avatar) avatar.innerText = cur.av;
    if (nameEl) nameEl.innerText = cur.name;
    if (roleEl) roleEl.innerText = cur.role;
    if (btnIntake) btnIntake.style.display = cur.intake ? 'inline-flex' : 'none';

    const cardName = document.getElementById('profileCardName');
    const cardTitle = document.getElementById('profileCardTitle');
    const cardOrg = document.getElementById('profileCardOrg');
    if (cardName) cardName.innerText = cur.name;
    if (cardTitle) cardTitle.innerText = cur.role;
    if (cardOrg && cur.org) cardOrg.innerText = cur.org + ' · สำนักงาน ป.ป.ท.';

    if (typeof global.renderSidebarMenu === 'function') global.renderSidebarMenu();
    renderNotifications();
    renderAct7Switch();
  }

  /* ==========================================================================
     การแจ้งเตือน (TOR 10.1.6 / 10.2.4) — สร้างสดจากข้อมูลสำนวนด้วย
     Activity10.buildAlerts (ไม่มีตาราง); สถานะอ่านเก็บใน localStorage
     คีย์ ecmis_alert_read_<role> (อาร์เรย์ของ alert id). ถ้าไม่มี Activity10
     (เช่นหน้า login) ใช้รายการคงที่ NOTIF_BY_ROLE เดิมเป็น fallback */
  const ALERT_READ_PREFIX = 'ecmis_alert_read_';
  const ALERT_MAX_SHOWN = 30;
  const LEGAL_DIV_UNIT = 'กองกฎหมาย (กอท.)';
  const LEGAL_DIV_ROLES = ['admin_legal', 'Kanda.R', 'dir_legal', 'Napas.S', 'group_director', 'Arnon.C', 'legal_officer', 'Nattapol.B'];
  const LEVEL_STYLE = {
    danger: { color: '#dc2626', dot: '🔴' },
    warning: { color: '#b45309', dot: '🟠' },
    info: { color: '#2563eb', dot: '📨' }
  };

  function escHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function readAlertSet(roleId) {
    try {
      const raw = global.localStorage.getItem(ALERT_READ_PREFIX + roleId);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      return new Set();
    }
  }

  function writeAlertSet(roleId, set) {
    try {
      global.localStorage.setItem(ALERT_READ_PREFIX + roleId, JSON.stringify(Array.from(set)));
    } catch (e) { /* โหมด private/เต็ม: แจ้งเตือนยังแสดงได้ แค่จำสถานะอ่านไม่ได้ */ }
  }

  /* หน่วยงานของผู้ใช้ปัจจุบัน ใช้จับคู่หนังสือแจ้งภายใน (10.1.9 / 10.2.6) */
  function currentUnit(roleId) {
    if (global.ECMIS102 && typeof global.ECMIS102.currentUnit === 'function') {
      const u = global.ECMIS102.currentUnit();
      if (u) return u;
    }
    const registry = (global.ECMIS && global.ECMIS.ROLES) || [];
    const r = registry.find(function (x) { return x.id === roleId || x.login === roleId; });
    if (r && (r.org || r.group)) return r.org || r.group;
    return LEGAL_DIV_ROLES.indexOf(roleId) >= 0 ? LEGAL_DIV_UNIT : '';
  }

  function computeAlerts(roleId) {
    try {
      return global.Activity10.buildAlerts(global.Activity10.getCases(), roleId, new Date(), { unit: currentUnit(roleId) });
    } catch (e) {
      return [];
    }
  }

  function setBadges(count) {
    document.querySelectorAll('.noti-badge').forEach(function (el) {
      el.innerText = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  /* หน้าส่วนใหญ่มีแค่กระดิ่ง + ตัวเลขคงที่ ไม่มี dropdown — สร้างให้ตอนรันไทม์
     เพื่อไม่ต้องแก้ HTML ทีละหน้า (หน้าคิวงานมี dropdown ของตัวเองอยู่แล้ว) */
  function ensureNotifUi() {
    if (document.getElementById('notifDropdown')) return;
    const badge = document.querySelector('.noti-badge');
    const bell = badge && badge.closest('.circle-icon-btn');
    if (!bell) return;
    const group = bell.parentNode;
    const menu = document.createElement('div');
    menu.className = 'notif-dropdown-menu';
    menu.id = 'notifDropdown';
    menu.innerHTML = '<div class="notif-dropdown-header"><span>การแจ้งเตือน</span></div><div id="notifListContainer"></div>';
    group.parentNode.insertBefore(menu, group.nextSibling);
    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleNotifDropdown();
    });
  }

  function renderAlertList(container, alerts, readSet) {
    const shown = alerts.slice(0, ALERT_MAX_SHOWN);
    if (!shown.length) {
      container.innerHTML = '<div class="notif-item"><span>ไม่มีรายการแจ้งเตือน</span></div>';
      return;
    }
    container.innerHTML = shown.map(function (a) {
      const st = LEVEL_STYLE[a.level] || LEVEL_STYLE.info;
      const isRead = readSet.has(a.id);
      return '<div class="notif-item" data-alert-id="' + escHtml(a.id) + '" data-href="' + escHtml(a.href) + '"'
        + ' style="cursor:pointer;' + (isRead ? 'opacity:.6;' : 'background:rgba(37,99,235,.05);') + '">'
        + '<strong style="color:' + st.color + ';">' + st.dot + ' ' + escHtml(a.title) + '</strong>'
        + '<span>' + escHtml(a.detail) + '</span>'
        + '</div>';
    }).join('') + (alerts.length > shown.length
      ? '<div class="notif-item"><span>และอีก ' + (alerts.length - shown.length) + ' รายการ</span></div>' : '');
  }

  function renderNotifications() {
    const roleId = getCurrentRole();
    if (!global.Activity10 || typeof global.Activity10.buildAlerts !== 'function') {
      renderStaticNotifications(roleId);
      return;
    }
    ensureNotifUi();
    const container = document.getElementById('notifListContainer');
    const alerts = computeAlerts(roleId);
    const readSet = readAlertSet(roleId);
    const unread = alerts.filter(function (a) { return !readSet.has(a.id); }).length;
    setBadges(unread);
    if (!container) return;

    const header = document.querySelector('#notifDropdown .notif-dropdown-header');
    if (header) {
      header.innerHTML = '<span>การแจ้งเตือน (' + alerts.length + ')</span>'
        + '<span id="notifMarkAllRead" style="font-size:0.8em;color:#2563eb;cursor:pointer;">อ่านทั้งหมด</span>';
      header.querySelector('#notifMarkAllRead').onclick = function (e) {
        e.stopPropagation();
        writeAlertSet(roleId, new Set(alerts.map(function (a) { return a.id; })));
        renderNotifications();
      };
    }
    renderAlertList(container, alerts, readSet);
    container.onclick = function (e) {
      const item = e.target.closest('.notif-item[data-alert-id]');
      if (!item) return;
      const set = readAlertSet(roleId);
      set.add(item.getAttribute('data-alert-id'));
      writeAlertSet(roleId, set);
      global.location.href = item.getAttribute('data-href');
    };
  }

  function renderStaticNotifications(roleId) {
    const container = document.getElementById('notifListContainer');
    const badge = document.getElementById('topbarNotiBadge');
    if (!container) return;

    const notifs = NOTIF_BY_ROLE[roleId] || NOTIF_BY_ROLE._default;

    if (badge) badge.innerText = notifs.length;
    container.innerHTML = notifs.map(function (n) {
      return '<div class="notif-item">'
        + '<strong style="' + (n.urgent ? 'color:#dc2626;' : '') + '">' + n.title + '</strong>'
        + '<span>' + n.text + '</span>'
        + '</div>';
    }).join('');
  }

  function toggleProfileDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('show');
    const notif = document.getElementById('notifDropdown');
    if (notif) notif.classList.remove('show');
  }

  function toggleNotifDropdown() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.toggle('show');
    const profile = document.getElementById('profileDropdown');
    if (profile) profile.classList.remove('show');
  }

  function confirmLogout(e) {
    if (e) e.preventDefault();
    Swal.fire({
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบ E-CMIS หรือไม่',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    }).then(function (res) {
      if (res.isConfirmed) {
        sessionStorage.removeItem('ecmis_role');
        window.location.href = 'login.html';
      }
    });
  }

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  }

  function changeFontSize(dir) {
    fontSizeLevel = Math.max(-1, Math.min(2, fontSizeLevel + dir));
    const sizeMap = { '-1': '12px', '0': '13.5px', '1': '15px', '2': '16.5px' };
    document.documentElement.style.setProperty('--base-font-size', sizeMap[fontSizeLevel]);
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.innerText = isDark ? '☀️' : '🌙';
  }

  global.onclick = function (e) {
    if (!e.target.closest('.user-profile-top')) {
      const profile = document.getElementById('profileDropdown');
      if (profile) profile.classList.remove('show');
    }
    if (!e.target.closest('.circle-icon-btn') && !e.target.closest('#notifDropdown')) {
      const notif = document.getElementById('notifDropdown');
      if (notif) notif.classList.remove('show');
    }
  };

  /* ============================================================
     Sidebar page-info icon (ⓘ) — click shows กลุ่มผู้ใช้งาน /
     วัตถุประสงค์ / องค์ประกอบหลัก / ขั้นตอนการทำงาน / ความต้องการที่
     เกี่ยวข้อง สำหรับหน้าปัจจุบัน คีย์ด้วยชื่อไฟล์ (location.pathname)
     ยังไม่มีข้อมูลของหน้าไหนให้ modal แสดงข้อความ fallback แทนที่จะพัง —
     content รอบแรกทำแค่ 13 หน้า Flow 4 อุทธรณ์ (10-2-appeal-01 ถึง 13)
     ตามที่ผู้ใช้ขอ ("apply on appeal page first") หน้าอื่นจะเติมทีหลัง
     ไม่ต้องแก้ไฟล์ HTML รายหน้าเลย เพราะ shell นี้ถูก include อยู่แล้ว
     ทุกหน้า (76/79 ไฟล์) — inject ไอคอน+modal ผ่าน JS ล้วน ๆ */
  const PAGE_INFO = {
    '10-2-appeal-01-legal-admin-intake.html': {
      userGroup: 'ธุรการกองบริหารคดี (เจ้าหน้าที่ระดับปฏิบัติการ, สายส่วนกลาง)',
      objective: 'บันทึกรับหนังสืออุทธรณ์ที่ผู้ยื่นคำขอส่งเข้ามาทางส่วนกลาง (เขต/walk-in/ไปรษณีย์/อิเล็กทรอนิกส์) และคีย์เข้าสู่ระบบ E-CMIS ก่อนส่งต่อให้ ผอ.กองบริหารคดีพิจารณามอบหมาย — สายที่สองคือ "เขต" ที่ยื่นตรงและส่งถึงนิติกรได้เลย ดู 10-2-appeal-01b-district-intake.html',
      mainComponents: [
        'การ์ด "ข้อมูลคำร้องเดิม" — เลขสำนวนคดีที่เกี่ยวข้อง, ผู้รับผิดชอบสำนวนเดิม+สังกัด, มติ 3 ช่วง (ชี้มูล/ร่างเสนอบอร์ด/บอร์ดตอบกลับ), มติบอร์ดกิจกรรมที่ 7 ครั้งอื่นบนสำนวนเดียวกัน (อ้างอิง), เอกสารแนบทั้งหมดของคำร้อง',
        'เลขที่หนังสือรับ + วันที่ลงรับ (auto-suggest)',
        'ช่องทางยื่นอุทธรณ์ (เลือกจากตัวเลือกบนหน้า: ยื่นที่เขต, ยื่นด้วยตนเอง (Walk-in), ยื่นทางไปรษณีย์, ยื่นทางอิเล็กทรอนิกส์)',
        'เอกสารแนบ (ไม่บังคับ, แนบได้หลายไฟล์ ไฟล์ขนาดใหญ่ได้ แสดงชื่อ+ขนาดต่อไฟล์)',
      ],
      workflow: [
        'เลือกคำร้องที่ต้องการรับเรื่อง (ถ้าเข้าหน้าโดยไม่ระบุ ?id=)',
        'ทบทวนการ์ด "ข้อมูลคำร้องเดิม" ทั้งประวัติมติและเอกสารก่อนรับเรื่อง',
        'ตรวจสอบ/แก้ไขเลขที่หนังสือรับและวันที่ลงรับ',
        'เลือกช่องทางยื่น ระบุเขต/วันที่รับ ณ จุดยื่นตามช่องทางที่เลือก',
        'แนบสำเนาหนังสืออุทธรณ์ (ไม่บังคับ)',
        'กดปุ่ม "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ" (ไม่มีลายเซ็น เป็นงานธุรการบันทึกข้อมูล)',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง" สายส่วนกลาง',
        'ต่อจาก Flow 1 ที่คำร้องปิดสำนวนด้วยมติไม่อนุญาตเปิดเผย (L2_CASE_CLOSED_DENY_ASSIGNED)',
        'เขียนสถานะ L2_PENDING_BUREAU_DIRECTOR_ASSIGN ส่งต่อ ผอ.กองบริหารคดีพิจารณามอบหมาย (appeal-02)',
      ],
    },
    '10-2-appeal-01b-district-intake.html': {
      userGroup: 'เจ้าหน้าที่เขต (สายเขต)',
      objective: 'บันทึกรับหนังสืออุทธรณ์ที่ยื่นตรงที่เขตและคีย์เข้าสู่ระบบ E-CMIS ส่งตรงถึงนิติกรเจ้าของสำนวนได้เลย โดยไม่ต้องผ่านกองบริหารคดี (สั้นกว่าสายส่วนกลาง 2 ขั้น)',
      mainComponents: [
        'การ์ด "ข้อมูลคำร้องเดิม" (เหมือน appeal-01)',
        'เลขที่หนังสือรับ + วันที่ลงรับ (auto-suggest)',
        'ช่องทางยื่นอุทธรณ์',
        'เอกสารแนบ (ไม่บังคับ)',
        'เลือกนิติกรเจ้าของเรื่อง (default = เจ้าของสำนวนเดิม)',
      ],
      workflow: [
        'เลือกคำร้องที่ต้องการรับเรื่อง (ถ้าเข้าหน้าโดยไม่ระบุ ?id=)',
        'ทบทวนการ์ด "ข้อมูลคำร้องเดิม"',
        'กรอกเลขที่หนังสือรับ/วันที่ลงรับ/ช่องทางยื่น',
        'เลือกนิติกรเจ้าของเรื่อง',
        'กดปุ่ม "บันทึกรับเรื่องอุทธรณ์และเข้าสู่ระบบ"',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง" สายเขต — จุดเริ่มต้นทางที่ 2 คู่กับ appeal-01',
        'เขียนสถานะ L2_PENDING_CASE_OWNER_APPEAL_OPINION ส่งต่อนิติกรเจ้าของสำนวนโดยตรง (appeal-04) — จุดเดียวกับที่สายส่วนกลางมาบรรจบ (appeal-03)',
      ],
    },
    '10-2-appeal-02-case-bureau-director-assign.html': {
      userGroup: 'ผู้อำนวยการกองบริหารคดี (สายส่วนกลาง)',
      objective: 'พิจารณาเรื่องอุทธรณ์ที่ธุรการกองบริหารคดีรับเข้ามา และมอบหมายให้ ผอ.กลุ่มงานบริหารติดตามคดีดำเนินการต่อ',
      mainComponents: [
        'การ์ดข้อมูลคำร้องเดิม + ข้อมูลรับหนังสืออุทธรณ์จาก appeal-01',
        'หมายเหตุ (ไม่บังคับ)',
      ],
      workflow: [
        'ทบทวนข้อมูลคำร้อง',
        'กดปุ่ม "พิจารณาและมอบหมาย" (ไม่มีลายเซ็น เป็นการมอบหมายงานภายใน)',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง" สายส่วนกลาง — รับต่อจาก appeal-01 โดยตรง',
        'เขียนสถานะ L2_PENDING_TRACKING_DIRECTOR_ASSIGN ส่งต่อ ผอ.กลุ่มงานบริหารติดตามคดี (appeal-03)',
      ],
    },
    '10-2-appeal-03-case-tracking-director-assign.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานบริหารติดตามคดี (สายส่วนกลาง)',
      objective: 'พิจารณาเรื่องอุทธรณ์ที่ ผอ.กองบริหารคดีมอบหมายมา และเลือก/มอบหมายนิติกรเจ้าของเรื่องดำเนินการต่อ',
      mainComponents: [
        'การ์ดข้อมูลคำร้องเดิม + ข้อมูลรับหนังสืออุทธรณ์',
        'เลือกนิติกรเจ้าของเรื่อง (default = เจ้าของสำนวนเดิม)',
        'หมายเหตุ (ไม่บังคับ)',
      ],
      workflow: [
        'ทบทวนข้อมูลคำร้อง',
        'เลือกนิติกรเจ้าของเรื่อง',
        'กดปุ่ม "พิจารณาและมอบหมายนิติกร"',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง" สายส่วนกลาง — รับต่อจาก appeal-02 โดยตรง',
        'เขียนสถานะ L2_PENDING_CASE_OWNER_APPEAL_OPINION ส่งต่อนิติกรเจ้าของสำนวนที่เลือกไว้ (appeal-04) — จุดเดียวกับที่สายเขตมาบรรจบ (appeal-01b)',
      ],
    },
    '10-2-appeal-04-case-owner-opinion.html': {
      userGroup: 'นิติกร/นักสืบเจ้าของเรื่อง (เจ้าของสำนวนเดิม)',
      objective: 'แจ้งผู้อุทธรณ์ และจัดทำความเห็นของเจ้าของสำนวนต่อคำอุทธรณ์ ก่อนเข้าสู่ขั้นตอนของฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์',
      mainComponents: [
        'การ์ดข้อมูลจากขั้นตอนก่อนหน้า + ลายเซ็นสะสม',
        'ความเห็น (textarea, ไม่บังคับ)',
        'แนบไฟล์ประกอบ (ไม่บังคับ, หลายไฟล์)',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: [
        'ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า',
        'กรอกความเห็นของเจ้าของสำนวน (ไม่บังคับ)',
        'แนบไฟล์ประกอบหากมี',
        'กดปุ่ม "ลงนามและส่งต่อ" แล้วลงนามในหน้าต่างลายเซ็น',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง"',
        'รับต่อจาก 2 สายที่บรรจบกัน (สถานะ L2_PENDING_CASE_OWNER_APPEAL_OPINION): สายเขต appeal-01b ส่งตรงมาเลย, สายส่วนกลาง appeal-01→02→03 กว่าจะถึงนิติกร',
        'สลับลำดับ: คณะอนุกรรมการฯ วินิจฉัยก่อน แล้วฝ่ายเลขาฯ ค่อยบรรจุวาระทีหลัง (รวมกับ appeal-07)',
        'เขียนสถานะ L2_PENDING_APPEAL_RULING ส่งต่อคณะอนุกรรมการวินิจฉัยอุทธรณ์โดยตรง (appeal-06)',
      ],
    },
    '10-2-appeal-06-subcommittee-ruling.html': {
      userGroup: 'คณะอนุกรรมการวินิจฉัยอุทธรณ์คำสั่งไม่เปิดเผยข้อมูลหรือข้อเท็จจริง',
      objective: 'พิจารณาคำอุทธรณ์ตามระเบียบวาระ และมีคำวินิจฉัยว่าจะยืนตามคำสั่งเดิม หรือกลับคำสั่งเดิมทั้งหมด/บางส่วน',
      mainComponents: [
        'การ์ดข้อมูลจากขั้นตอนก่อนหน้า + ลายเซ็นสะสม',
        'ผลคำวินิจฉัย (เลือกจากตัวเลือกบนหน้า: เห็นด้วยกับคำสั่งเดิม (ไม่เปิดเผย), กลับคำสั่งเดิม (ให้เปิดเผยทั้งหมด), กลับคำสั่งบางส่วน (ให้เปิดเผยบางส่วน))',
        'เหตุผลประกอบคำวินิจฉัย (textarea, บังคับกรอก)',
        'แนบไฟล์ประกอบ (ไม่บังคับ)',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: [
        'ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า',
        'เลือกผลคำวินิจฉัย (บังคับเลือก)',
        'กรอกเหตุผลประกอบคำวินิจฉัย (บังคับ)',
        'แนบไฟล์ประกอบหากมี',
        'กดปุ่ม "ลงนามและบันทึกคำวินิจฉัย" แล้วลงนามในหน้าต่างลายเซ็น',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง"',
        'รับต่อจาก appeal-04 โดยตรง (สถานะ L2_PENDING_APPEAL_RULING — สลับลำดับมาก่อนขั้นบรรจุวาระแล้ว)',
        'เขียนสถานะ L2_PENDING_APPEAL_MEMO ส่งต่อฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์ (appeal-07)',
      ],
    },
    '10-2-appeal-07-secretariat-memo.html': {
      userGroup: 'ฝ่ายเลขาคณะอนุกรรมการวินิจฉัยอุทธรณ์',
      objective: 'บันทึกวันที่ประชุม/เลขที่วาระ และจัดทำบันทึกคำวินิจฉัยอุทธรณ์เป็นเอกสารทางการ เพื่อเสนอ ผอ.กองบริหารคดี ลงนามต่อไป — รวมขั้น "บรรจุวาระ" (เดิม appeal-05) เข้ามาในหน้าเดียวแล้ว',
      mainComponents: [
        'วันที่ประชุม + เลขที่วาระ (auto-suggest) — ย้ายมาจาก appeal-05 เดิม',
        'เอกสารบันทึกคำวินิจฉัยอุทธรณ์ (สร้างจากผลคำวินิจฉัยของ appeal-06)',
        'ความเห็นเพิ่มเติม (ไม่บังคับ) + แนบไฟล์ประกอบ (ไม่บังคับ)',
        'ลายเซ็นดิจิทัล (ลายเซ็นเดียว ครอบคลุมทั้งบรรจุวาระและเสนอบันทึก)',
      ],
      workflow: [
        'ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้าและเอกสารบันทึกคำวินิจฉัยที่ระบบจัดทำให้',
        'ตรวจสอบ/แก้ไขวันที่ประชุมและเลขที่วาระ',
        'กรอกความเห็นเพิ่มเติมและแนบไฟล์หากมี',
        'กดปุ่ม "ลงนามบันทึกวาระและเสนอ" แล้วลงนามในหน้าต่างลายเซ็น',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง"',
        'รับต่อจาก appeal-06 (สถานะ L2_PENDING_APPEAL_MEMO)',
        'ขั้นตอน ผอ.กลุ่มงานติดตามคดีลงนามรับรอง (เดิม appeal-08) ถูกตัดออก',
        'ขั้นตอน "เลขาฯ จัดทำวาระ" (เดิม appeal-05) ถูกรวมเข้ามาในหน้านี้แล้ว',
        'เขียนสถานะ L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE ส่งต่อ ผอ.กองบริหารคดี โดยตรง (appeal-09)',
      ],
    },
    '10-2-appeal-09-case-bureau-director-board-propose.html': {
      userGroup: 'ผู้อำนวยการกองบริหารคดี',
      objective: 'พิจารณาเรื่อง ลงนามในฐานะผู้เสนอเรื่อง และออกเลขหนังสือส่งยื่นเรื่องเข้ากิจกรรมที่ 7 (คณะกรรมการ ป.ป.ท. เต็มคณะ) ในขั้นตอนเดียวกัน',
      mainComponents: [
        'เอกสารบันทึกคำวินิจฉัยอุทธรณ์ + ลายเซ็นสะสม (read-only)',
        'ความเห็นเพิ่มเติม (ไม่บังคับ)',
        'เลขที่หนังสือส่ง (auto-suggest) + วันที่ส่ง (auto) — ดูดมาจากขั้นตอนธุรการออกเลขส่งเดิม (appeal-10)',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: [
        'ตรวจสอบข้อมูลและลายเซ็นสะสมจากขั้นตอนก่อนหน้าทั้งหมด',
        'กรอกความเห็นเพิ่มเติม (ไม่บังคับ)',
        'ตรวจสอบ/แก้ไขเลขที่หนังสือส่งและวันที่ส่ง',
        'กดปุ่ม "ลงนามเสนอ + ออกเลขส่งยื่นกิจกรรมที่ 7" แล้วลงนามในหน้าต่างลายเซ็น',
        'คำร้องจะรอผลจริงจากกิจกรรมที่ 7 (สถานะ L2_APPEAL_SUBMITTED_TO_BOARD ยังไม่มี route ต่อ จนกว่าจะ "ทราบมติ")',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 6 "อุทธรณ์คำสั่ง" — ขั้นตอนสุดท้ายของ sheet 6',
        'รับต่อจาก appeal-07 โดยตรง (สถานะ L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE — ขั้นตอน appeal-08 เดิมถูกตัดออก)',
        'ขั้นตอนธุรการออกเลขส่งแยกหน้า (เดิม appeal-10) ถูกรวมเข้ามาในหน้านี้',
        'ต่อยอดด้วยสถานะคั่นกลาง "มติบอร์ดตอบกลับแล้ว" ที่ console snippet [H2] เขียนตรงเข้า L2_PENDING_APPEAL_NOTICE_DRAFT ส่งต่อ appeal-12 ทันที (ขั้นตอนธุรการบันทึกมติบอร์ดแยกหน้า เดิม appeal-11 ถูกตัดออก)',
      ],
    },
    '10-2-appeal-12-tracking-secretary-notice-draft.html': {
      userGroup: 'เลขานุการกลุ่มงานบริหารติดตามคดี',
      objective: 'จัดทำหนังสือแจ้งผลมติคณะกรรมการ ป.ป.ท. และส่งสำเนามติให้เจ้าของสำนวน ก่อนที่เจ้าของสำนวนจะแจ้งผลผู้อุทธรณ์',
      mainComponents: [
        'ร่างหนังสือแจ้งผลมติ (สร้างจากมติที่ console snippet [H2] เขียนตรงเข้า case)',
        'เลขที่หนังสือแจ้งผลมติ + วันที่หนังสือ (auto-suggest)',
        'ความเห็นเพิ่มเติม (ไม่บังคับ) + แนบไฟล์ประกอบ (ไม่บังคับ)',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: [
        'ตรวจสอบร่างหนังสือแจ้งผลมติที่ระบบจัดทำให้',
        'ตรวจสอบ/แก้ไขเลขที่และวันที่หนังสือ',
        'กรอกความเห็นเพิ่มเติมและแนบไฟล์หากมี',
        'กดปุ่ม "ลงนามและส่งหนังสือแจ้งผลมติ" แล้วลงนามในหน้าต่างลายเซ็น',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 7 "แจ้งผลอุทธรณ์"',
        'รับต่อจากมติกิจกรรมที่ 7 โดยตรง (สถานะ L2_PENDING_APPEAL_NOTICE_DRAFT) — ขั้นตอนธุรการบันทึกมติบอร์ด (เดิม appeal-11) ถูกตัดออก',
        'เขียนสถานะ L2_PENDING_APPEAL_CASE_OWNER_NOTIFY ส่งต่อนิติกรเจ้าของสำนวน (appeal-13)',
      ],
    },
    '10-2-appeal-13-case-owner-notify-appellant.html': {
      userGroup: 'นิติกร/นักสืบเจ้าของเรื่อง (เจ้าของสำนวนเดิม)',
      objective: 'แจ้งผลคำวินิจฉัยตามมติคณะกรรมการ ป.ป.ท. ให้ผู้อุทธรณ์ทราบภายใน 5 วัน — ขั้นตอนสุดท้ายของ Flow การอุทธรณ์ทั้งหมด',
      mainComponents: [
        'หนังสือแจ้งผลมติ (read-only จาก appeal-12)',
        'วันที่แจ้งผู้อุทธรณ์ (บังคับ) + ช่องทางแจ้ง (เลือกจากตัวเลือกบนหน้า: แจ้งที่ส่วนกลาง, แจ้งผ่านเขต)',
        'ความเห็นเพิ่มเติม (ไม่บังคับ)',
        'กำหนดผู้อุทธรณ์รับทราบผล (คำนวณอัตโนมัติ 5 วันจากวันที่แจ้ง)',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: [
        'ตรวจสอบหนังสือแจ้งผลมติและข้อมูลจากขั้นตอนก่อนหน้าทั้งหมด',
        'ระบุวันที่แจ้งผู้อุทธรณ์และช่องทางแจ้ง',
        'กรอกความเห็นเพิ่มเติม (ไม่บังคับ)',
        'กดปุ่ม "ลงนามและแจ้งผลผู้อุทธรณ์" แล้วลงนามในหน้าต่างลายเซ็น — ปิดเคสทันที',
      ],
      relatedRequirements: [
        'อยู่ในผัง TO-BE10.2 sheet 7 "แจ้งผลอุทธรณ์" (พับรวมขั้นแจ้งผลกับขั้นผู้อุทธรณ์รับทราบเป็นหน้าเดียว เพราะผู้อุทธรณ์ไม่ใช่ผู้ใช้งานระบบ)',
        'รับต่อจาก appeal-12 (สถานะ L2_PENDING_APPEAL_CASE_OWNER_NOTIFY)',
        'เขียนสถานะ L2_APPEAL_CASE_CLOSED_NOTIFIED (terminal จริง — จบทั้ง sheet 6+7 ของ Flow 4)',
      ],
    },

    /* ------------------------------------------------------- 10.2 หลัก
       (Flow 1-3: มติคณะอนุกรรมการ → แยกสาย DENY/DISCLOSE-PARTIAL → แจ้งผล)
       เพิ่มตามคำขอ "try to add to whole 10.2" — ครอบคลุมทุกหน้า 10-2-*.html
       ที่ไม่ใช่สาย appeal ด้านบน (ซึ่งทำไปแล้วรอบแรก) */
    '02-board-intake.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: 'ลงทะเบียนรับคำขอ/คำร้องเข้าสู่ระบบ E-CMIS และเสนอ ผอ.กองกฎหมายพิจารณาสั่งการ เป็นจุดเริ่มต้นร่วมของกิจกรรม 10.1, 10.2 และ 10.3',
      mainComponents: [
        'หมวดหมู่งาน (เลือกได้ทั้งกิจกรรม 10.1 / 10.2 / 10.3)',
        'ข้อมูลผู้ยื่นคำขอ/คำร้องและรายละเอียด',
        'เอกสารแนบ',
      ],
      workflow: [
        'เลือกหมวดหมู่งานที่ตรงกับเรื่องที่รับ',
        'กรอกข้อมูลผู้ยื่นคำขอและรายละเอียด',
        'แนบเอกสารประกอบ',
        'กดบันทึกเพื่อเข้าสู่ระบบ (ไม่มีลายเซ็น เป็นงานธุรการลงทะเบียน)',
      ],
      relatedRequirements: [
        'จุดเริ่มต้นร่วมของทั้ง 3 กิจกรรม แยกเส้นทางตามหมวดหมู่ที่เลือก',
        'สำหรับหมวด 10.2 เขียนสถานะส่งต่อผู้อำนวยการกองกฎหมายพิจารณาสั่งการ',
      ],
    },
    '10-2-01-legal-director-assign.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: 'พิจารณาสั่งการคำร้องที่ธุรการลงทะเบียนไว้ และมอบหมายให้ ผอ.กลุ่มงานความเห็นแย้งตรวจประเด็นกฎหมาย',
      mainComponents: ['ข้อมูลคำร้องจากขั้นตอนก่อนหน้า', 'ความเห็นสั่งการ', 'มอบหมายถึง ผอ.กลุ่มงานความเห็นแย้ง', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบข้อมูลคำร้อง', 'ระบุความเห็นสั่งการ', 'กดลงนามมอบหมาย แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากธุรการกองกฎหมายที่ลงทะเบียนรับเรื่อง', 'เขียนสถานะส่งต่อ ผอ.กลุ่มงานความเห็นแย้ง'],
    },
    '10-2-02-group-director-assign.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง',
      objective: 'ตรวจสอบประเด็นกฎหมายเบื้องต้น และมอบหมายให้ฝ่ายเลขานุการคณะอนุกรรมการฯ จัดทำรายงานความเห็น',
      mainComponents: ['ข้อมูลคำร้องและความเห็นสั่งการจากขั้นตอนก่อนหน้า', 'ความเห็น/ข้อสังเกตประเด็นกฎหมาย', 'มอบหมายถึงฝ่ายเลขานุการฯ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า', 'ระบุความเห็นประเด็นกฎหมาย', 'กดลงนามมอบหมาย แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจาก ผอ.กองกฎหมาย', 'เขียนสถานะส่งต่อฝ่ายเลขานุการคณะอนุกรรมการฯ'],
    },
    '10-2-03-secretariat-opinion.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: 'จัดทำรายงานความเห็นเสนอคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      mainComponents: ['ข้อมูลคำร้องและความเห็นจากขั้นตอนก่อนหน้า', 'รายงานความเห็น (ข้อเท็จจริง/ข้อกฎหมาย)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า', 'จัดทำรายงานความเห็น', 'กดลงนามและส่งต่อ แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจาก ผอ.กลุ่มงานความเห็นแย้ง', 'เขียนสถานะส่งต่อ ผอ.กลุ่มงานความเห็นแย้งตรวจความครบถ้วน'],
    },
    '10-2-04-group-director-verify.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง',
      objective: 'ตรวจสอบความครบถ้วนของประเด็นกฎหมายในรายงานความเห็นก่อนบรรจุวาระประชุม',
      mainComponents: ['รายงานความเห็นจากฝ่ายเลขานุการฯ', 'ความเห็นการตรวจสอบความครบถ้วน', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบความครบถ้วนของรายงานความเห็น', 'ระบุความเห็น (ผ่าน/ส่งกลับแก้ไข)', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อฝ่ายเลขานุการฯ บรรจุวาระ'],
    },
    '10-2-05-secretariat-agenda.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: 'บรรจุวาระ นัดหมาย และจัดส่งเอกสารประกอบการประชุมคณะอนุกรรมการฯ',
      mainComponents: ['วันที่ประชุม + เลขที่วาระ', 'เอกสารประกอบการประชุม'],
      workflow: ['ระบุวันที่ประชุมและเลขที่วาระ', 'แนบเอกสารประกอบการประชุม', 'กดบันทึกและส่งต่อ (ไม่มีลายเซ็น)'],
      relatedRequirements: ['รับต่อจาก ผอ.กลุ่มงานความเห็นแย้งที่ตรวจความครบถ้วนแล้ว', 'เขียนสถานะส่งต่อคณะอนุกรรมการฯ พิจารณาตามระเบียบวาระ'],
    },
    '10-2-06-subcommittee-resolution.html': {
      userGroup: 'คณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: 'พิจารณาคำร้องตามระเบียบวาระและมีมติที่ประชุมว่าจะเปิดเผยข้อมูล เปิดเผยบางส่วน หรือไม่อนุญาตเปิดเผย พร้อมระบุสถานะคดีที่เกี่ยวข้อง',
      mainComponents: [
        'มติที่ประชุม (เลือกจากตัวเลือกบนหน้า: อนุญาตเปิดเผย, อนุญาตเปิดเผยบางส่วน, ไม่อนุญาตเปิดเผย, อื่นๆ)',
        'สถานะคดีที่เกี่ยวข้อง (เลือกจากตัวเลือกบนหน้า: คดีเสร็จสิ้นแล้ว, อยู่ระหว่างไต่สวน)',
        'ความเห็นคณะอนุกรรมการฯ และรายละเอียดมติ',
        'ลายเซ็นดิจิทัล',
      ],
      workflow: ['ตรวจสอบข้อมูลคำร้อง', 'เลือกมติที่ประชุมและสถานะคดี', 'กรอกความเห็นและรายละเอียดมติ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: [
        'รับต่อจากฝ่ายเลขานุการฯ ที่บรรจุวาระแล้ว',
        'มติและสถานะคดีที่เลือกในหน้านี้เป็นตัวกำหนดเส้นทางของคำร้องตลอดทั้งกิจกรรม 10.2 ที่เหลือ (สาย DENY / DISCLOSE-PARTIAL / คดีเสร็จสิ้น / อยู่ระหว่างไต่สวน)',
      ],
    },
    '10-2-33-legal-admin-comment.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: 'รับเรื่องหลังคณะอนุกรรมการฯ มีมติ แล้วส่งต่อ ผอ.กองกฎหมายมอบหมาย (ไม่ลงนาม ไม่เปลี่ยนแปลงมติ/สถานะคดี)',
      mainComponents: ['รายละเอียดคำขอ (read-only)', 'หมายเหตุ (ไม่บังคับ)'],
      workflow: ['ตรวจสอบรายละเอียดคำขอ', 'กรอกหมายเหตุ (ถ้ามี)', 'กดรับเรื่องและส่ง ผอ.กองกฎหมาย'],
      relatedRequirements: ['รับต่อจากคณะอนุกรรมการฯ ที่มีมติแล้ว', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายมอบหมาย'],
    },
    '10-2-34-legal-director-comment.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: 'มอบหมายฝ่ายเลขานุการฯ ต่อจากธุรการกองกฎหมายรับเรื่อง ก่อนฝ่ายเลขานุการฯ ทำบันทึกผลมติเลขา',
      mainComponents: ['รายละเอียดคำขอและหมายเหตุธุรการ (read-only)', 'มอบหมายให้ (เลือกผู้รับมอบหมาย)', 'ความเห็น', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบรายละเอียดคำขอและหมายเหตุจากธุรการ', 'เลือกผู้รับมอบหมาย และกรอกความเห็น (ถ้ามี)', 'กดมอบหมายและลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากธุรการกองกฎหมายรับเรื่อง', 'เขียนสถานะส่งต่อฝ่ายเลขานุการฯ ทำบันทึกผลมติเลขา'],
    },
    '10-2-07-secretariat-resolution-doc.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: 'จัดทำบันทึกข้อความสรุปผลมติ ออกเลขหนังสือส่งภายใน และลงนามในฐานะผู้เสนอเรื่อง ก่อนเสนอ ผอ.กองกฎหมายให้ความเห็น',
      mainComponents: ['บันทึกข้อความสรุปผลมติ (สร้างจากมติของ 10-2-06)', 'เลขที่หนังสือส่งภายใน (auto-suggest)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกข้อความที่ระบบจัดทำให้', 'ตรวจสอบ/แก้ไขเลขที่หนังสือส่งภายใน', 'กดลงนามในฐานะผู้เสนอเรื่อง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจาก ผอ.กองกฎหมายที่มอบหมายแล้ว', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายให้ความเห็น (ความเห็นที่ 5)'],
    },
    '10-2-08-legal-director-propose.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: 'ให้ความเห็นประกอบ (ความเห็นที่ 5) และลงนามกำกับความเห็นของตนเองในบันทึกข้อความ ก่อนธุรการออกเลขส่งเสนอผู้บริหาร',
      mainComponents: ['บันทึกข้อความจากฝ่ายเลขานุการฯ (read-only)', 'ความเห็นประกอบ (ความเห็นที่ 5)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกข้อความ', 'กรอกความเห็นประกอบ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อธุรการกองกฎหมายออกเลขส่งเสนอผู้บริหาร'],
    },
    '10-2-09-legal-admin-dispatch.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: 'ออกเลขหนังสือส่งและเสนอผู้บริหาร โดยเลือกส่งต่อรองเลขาธิการ (กรณีมอบอำนาจ) หรือเลขาธิการโดยตรง',
      mainComponents: ['เลขที่หนังสือส่ง (auto-suggest)', 'เลือกสายเสนอผู้บริหาร (รองเลขาธิการ / เลขาธิการ)'],
      workflow: ['ตรวจสอบ/แก้ไขเลขที่หนังสือส่ง', 'เลือกสายเสนอผู้บริหารที่ถูกต้อง', 'กดบันทึกและส่งต่อ (ไม่มีลายเซ็น เป็นงานธุรการออกเลขส่ง)'],
      relatedRequirements: ['รับต่อจาก ผอ.กองกฎหมายที่ให้ความเห็นแล้ว', 'เขียนสถานะส่งต่อรองเลขาธิการฯ หรือเลขาธิการฯ ตามสายที่เลือก'],
    },
    '10-2-32-deputy-sg-opinion-sign.html': {
      userGroup: 'รองเลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย',
      objective: 'ให้ความเห็น (ความเห็นที่ 6) และลงนามปฏิบัติราชการแทนเลขาธิการ ป.ป.ท. ต่อเรื่องที่ธุรการเสนอมาตามสายมอบอำนาจ',
      mainComponents: ['บันทึกข้อความและมติจากขั้นตอนก่อนหน้า (read-only)', 'ความเห็นประกอบ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกข้อความและมติ', 'กรอกความเห็นประกอบ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากธุรการกองกฎหมายที่เลือกสายมอบอำนาจ', 'เขียนสถานะส่งต่อธุรการกองกฎหมายรับทราบมติ'],
    },
    '10-2-31-secgen-opinion-sign.html': {
      userGroup: 'เลขาธิการ คณะกรรมการ ป.ป.ท. ผู้ดูแลกองกฎหมาย',
      objective: 'ให้ความเห็น (ความเห็นที่ 7) และลงนามต่อเรื่องที่ธุรการเสนอมาโดยตรง (ไม่ผ่านการมอบอำนาจ) — เป็นชั้นอนุมัติเดียว ไม่มีสายลำดับชั้นต่อจากนี้',
      mainComponents: ['บันทึกข้อความและมติจากขั้นตอนก่อนหน้า (read-only)', 'ความเห็นประกอบ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกข้อความและมติ', 'กรอกความเห็นประกอบ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['รับต่อจากธุรการกองกฎหมายที่เลือกส่งตรงถึงเลขาธิการฯ', 'เขียนสถานะส่งต่อธุรการกองกฎหมายรับทราบมติ'],
    },
    '10-2-10-legal-admin-receive-outcome.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: 'รับทราบมติของรองเลขาธิการ/เลขาธิการ ป.ป.ท. ผู้ดูแลกองกฎหมาย แล้วส่งต่อตามมติที่คณะอนุกรรมการฯ บันทึกไว้ตั้งแต่ต้น (ไม่เปลี่ยนแปลงมติ)',
      mainComponents: ['มติและความเห็นจากขั้นตอนก่อนหน้าทั้งหมด (read-only)'],
      workflow: ['ตรวจสอบมติที่ตอบกลับมา', 'กดรับทราบและส่งต่อ (ไม่มีลายเซ็น เป็นงานธุรการรับมติ)'],
      relatedRequirements: [
        'รับต่อจากรองเลขาธิการฯ หรือเลขาธิการฯ (ตามสายที่ธุรการเลือกไว้)',
        'ส่งต่อตามมติเดิม: สาย "ไม่อนุญาตเปิดเผย" ไปฝ่ายเลขานุการฯ จัดทำบันทึกมติไม่อนุญาต, สาย "เปิดเผย/เปิดเผยบางส่วน" ไปตามสถานะคดี (คดีเสร็จสิ้นแล้ว หรืออยู่ระหว่างไต่สวน)',
      ],
    },
    '10-2-15-secretariat-deny-memo.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: '[สายไม่อนุญาตเปิดเผย] จัดทำบันทึกและมติไม่อนุญาตเปิดเผยข้อมูล ลงนาม และออกเลขหนังสือส่งภายใน',
      mainComponents: ['บันทึกมติไม่อนุญาตเปิดเผยข้อมูล', 'เลขที่หนังสือส่งภายใน (auto-suggest)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า', 'จัดทำบันทึกมติไม่อนุญาตเปิดเผย', 'กดลงนามและออกเลขส่ง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "ไม่อนุญาตเปิดเผยข้อมูล" — รับต่อจากธุรการที่รับทราบมติแล้ว', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายลงนามในฐานะผู้เสนอเรื่อง'],
    },
    '10-2-16-legal-director-deny-propose.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: '[สายไม่อนุญาตเปิดเผย] ลงนามในฐานะผู้เสนอเรื่องต่อมติไม่อนุญาตเปิดเผยข้อมูล ก่อนธุรการออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.',
      mainComponents: ['บันทึกมติไม่อนุญาตเปิดเผยข้อมูล (read-only)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกมติ', 'กดลงนามในฐานะผู้เสนอเรื่อง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "ไม่อนุญาตเปิดเผยข้อมูล" — รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อธุรการกองกฎหมายออกเลขส่งเสนอเลขาธิการคณะกรรมการ ป.ป.ท.'],
    },
    '10-2-17-legal-admin-deny-dispatch-committee.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: '[สายไม่อนุญาตเปิดเผย] ออกเลขส่งและมอบหมายกอง/สำนักเจ้าของสำนวนดำเนินการแจ้งผลผู้ยื่นคำขอ — ปิดสำนวนของสายนี้',
      mainComponents: ['เลขที่หนังสือส่ง (auto-suggest)', 'มอบหมายถึงกอง/สำนักเจ้าของสำนวน'],
      workflow: ['ตรวจสอบ/แก้ไขเลขที่หนังสือส่ง', 'เลือกกอง/สำนักเจ้าของสำนวนที่รับผิดชอบ', 'กดบันทึกและปิดสำนวน (ไม่มีลายเซ็น เป็นงานธุรการส่งมอบ)'],
      relatedRequirements: [
        'เฉพาะคำร้องสาย "ไม่อนุญาตเปิดเผยข้อมูล" — รับต่อจาก ผอ.กองกฎหมายที่ลงนามเสนอเรื่องแล้ว',
        'สถานะปิดสำนวนของหน้านี้เป็นจุดตั้งต้นของ Flow การอุทธรณ์ (หากผู้ยื่นคำขอใช้สิทธิ์อุทธรณ์ในภายหลัง)',
      ],
    },
    '10-2-22-secretariat-close-memo.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — คดีเสร็จสิ้นแล้ว] จัดทำบันทึกและมติเปิดเผยข้อมูล ลงนาม และออกเลขหนังสือส่งภายใน',
      mainComponents: ['บันทึกมติเปิดเผยข้อมูล', 'เลขที่หนังสือส่งภายใน (auto-suggest)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบข้อมูลจากขั้นตอนก่อนหน้า', 'จัดทำบันทึกมติเปิดเผยข้อมูล', 'กดลงนามและออกเลขส่ง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่คดีเสร็จสิ้นแล้ว — รับต่อจากธุรการที่รับทราบมติแล้ว', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายลงนามในฐานะผู้เสนอเรื่อง'],
    },
    '10-2-23-legal-director-close-propose.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — คดีเสร็จสิ้นแล้ว] ลงนามในฐานะผู้เสนอเรื่องต่อมติเปิดเผยข้อมูล',
      mainComponents: ['บันทึกมติเปิดเผยข้อมูล (read-only)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกมติ', 'กดลงนามในฐานะผู้เสนอเรื่อง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่คดีเสร็จสิ้นแล้ว — รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อธุรการกองกฎหมายออกเลขส่งและมอบหมาย'],
    },
    '10-2-24-legal-admin-close-dispatch.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — คดีเสร็จสิ้นแล้ว] ออกเลขส่งและมอบหมายกอง/สำนักเจ้าของสำนวนดำเนินการแจ้งผล — ปิดสำนวนของสายนี้',
      mainComponents: ['เลขที่หนังสือส่ง (auto-suggest)', 'มอบหมายถึงกอง/สำนักเจ้าของสำนวน'],
      workflow: ['ตรวจสอบ/แก้ไขเลขที่หนังสือส่ง', 'เลือกกอง/สำนักเจ้าของสำนวนที่รับผิดชอบ', 'กดบันทึกและปิดสำนวน (ไม่มีลายเซ็น เป็นงานธุรการส่งมอบ)'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่คดีเสร็จสิ้นแล้ว — รับต่อจาก ผอ.กองกฎหมาย', 'สถานะปิดสำนวนจริง จบสายนี้'],
    },
    '10-2-25-secretariat-committee-memo-draft.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] จัดทำมติคณะอนุกรรมการกลั่นกรองและบันทึกเสนอเลขาธิการ ลงนามในฐานะผู้เสนอเรื่อง เพื่อนำเรื่องเข้ากิจกรรมที่ 7 อีกรอบ',
      mainComponents: ['บันทึกเสนอเลขาธิการ (ข้อเท็จจริง/มติ/ผู้รับผิดชอบข้อมูล)', 'ลายเซ็นดิจิทัล'],
      workflow: ['จัดทำบันทึกเสนอเลขาธิการ', 'กดลงนามในฐานะผู้เสนอเรื่อง แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจากธุรการที่รับทราบมติแล้ว', 'เขียนสถานะส่งต่อ ผอ.กลุ่มงานความเห็นแย้งพิจารณาอนุมัติ'],
    },
    '10-2-27-group-director-committee-approve.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] พิจารณาอนุมัติบันทึกเสนอเลขาธิการ ก่อนส่งต่อ ผอ.กองกฎหมายให้ความเห็น',
      mainComponents: ['บันทึกเสนอเลขาธิการ (read-only)', 'ความเห็นการอนุมัติ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกเสนอเลขาธิการ', 'พิจารณาอนุมัติ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายให้ความเห็น'],
    },
    '10-2-26-legal-director-committee-opinion.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] พิจารณาและให้ความเห็นในบันทึกเสนอเลขาธิการ ก่อนธุรการออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท.',
      mainComponents: ['บันทึกเสนอเลขาธิการ (read-only)', 'ความเห็นประกอบ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบบันทึกเสนอเลขาธิการ', 'กรอกความเห็นประกอบ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจาก ผอ.กลุ่มงานความเห็นแย้งที่อนุมัติแล้ว', 'เขียนสถานะส่งต่อธุรการกองกฎหมายออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท.'],
    },
    '10-2-29-legal-admin-committee-dispatch.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] ออกเลขส่งเสนอรองเลขาธิการ ป.ป.ท. เพื่อนำเรื่องเข้ากิจกรรมที่ 7 อีกรอบ',
      mainComponents: ['เลขที่หนังสือส่ง (auto-suggest)'],
      workflow: ['ตรวจสอบ/แก้ไขเลขที่หนังสือส่ง', 'กดบันทึกและส่งต่อ (ไม่มีลายเซ็น เป็นงานธุรการออกเลขส่ง)', 'คำร้องจะรอผลจริงจากกิจกรรมที่ 7 อีกรอบ'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจาก ผอ.กองกฎหมาย', 'ต่อยอดด้วยเหตุการณ์ภายนอก "มติบอร์ดตอบกลับแล้ว" ก่อนเข้าหน้าธุรการรับมติ'],
    },
    '10-2-30-legal-admin-receive-board-round2.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] รับมติจากกิจกรรมที่ 7 (คณะกรรมการ ป.ป.ท. เต็มคณะ) แล้วส่งต่อ ผอ.กองกฎหมายรับทราบ',
      mainComponents: ['มติจากกิจกรรมที่ 7 (read-only)'],
      workflow: ['ตรวจสอบมติที่ตอบกลับมา', 'กดรับทราบและส่งต่อ (ไม่มีลายเซ็น เป็นงานธุรการรับมติ)'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจากเหตุการณ์ภายนอก "มติบอร์ดตอบกลับแล้ว"', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายรับทราบมติคณะกรรมการ ป.ป.ท.'],
    },
    '10-2-35-legal-director-board-ack.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] รับทราบมติคณะกรรมการ ป.ป.ท. และลงนาม ก่อนส่งต่อ ผอ.กลุ่มงานความเห็นแย้งรับทราบ',
      mainComponents: ['มติคณะกรรมการ ป.ป.ท. (read-only)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบมติคณะกรรมการ ป.ป.ท.', 'กดรับทราบและลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจากธุรการที่รับมติแล้ว', 'เขียนสถานะส่งต่อ ผอ.กลุ่มงานความเห็นแย้งรับทราบมติ'],
    },
    '10-2-36-group-director-board-ack.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน — อยู่ระหว่างไต่สวน] รับทราบมติคณะกรรมการ ป.ป.ท. และลงนาม ก่อนส่งต่อฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติ',
      mainComponents: ['มติคณะกรรมการ ป.ป.ท. (read-only)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบมติคณะกรรมการ ป.ป.ท.', 'กดรับทราบและลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" ที่อยู่ระหว่างไต่สวน — รับต่อจาก ผอ.กองกฎหมาย', 'เขียนสถานะส่งต่อฝ่ายเลขานุการฯ จัดทำหนังสือแจ้งมติ (จุดเดียวกับที่คำร้อง "คดีเสร็จสิ้นแล้ว" มาบรรจบ)'],
    },
    '10-2-11-secretariat-disclose-partial-notice-draft.html': {
      userGroup: 'ฝ่ายเลขานุการคณะอนุกรรมการพิจารณากลั่นกรองการเปิดเผยข้อมูลข่าวสาร',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน] จัดทำหนังสือแจ้งมติเสนอผู้ยื่นคำขอ',
      mainComponents: ['ร่างหนังสือแจ้งมติ', 'เลขที่หนังสือ (auto-suggest)'],
      workflow: ['จัดทำร่างหนังสือแจ้งมติ', 'ตรวจสอบเลขที่หนังสือ', 'กดบันทึกและส่งต่อ (ไม่มีลายเซ็น)'],
      relatedRequirements: ['รับต่อจากธุรการ (รับมติรอบแรก) หรือ ผอ.กลุ่มงานความเห็นแย้ง (รับมติรอบสอง — อยู่ระหว่างไต่สวน) แล้วแต่เส้นทาง', 'เขียนสถานะส่งต่อ ผอ.กลุ่มงานความเห็นแย้งให้ความเห็นหนังสือแจ้งมติ'],
    },
    '10-2-37-group-director-notice-review.html': {
      userGroup: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน] ให้ความเห็นและลงนามหนังสือแจ้งมติ ก่อนส่งต่อ ผอ.กองกฎหมายตรวจและลงนาม',
      mainComponents: ['ร่างหนังสือแจ้งมติ (read-only)', 'ความเห็นประกอบ', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบร่างหนังสือแจ้งมติ', 'กรอกความเห็นประกอบ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" — รับต่อจากฝ่ายเลขานุการฯ', 'เขียนสถานะส่งต่อ ผอ.กองกฎหมายตรวจและลงนามหนังสือแจ้งมติ'],
    },
    '10-2-13-legal-director-disclose-partial-notice-sign.html': {
      userGroup: 'ผู้อำนวยการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน] ตรวจและลงนามหนังสือแจ้งมติผู้ยื่นคำขอ ก่อนธุรการออกเลขส่งและแจ้งผล',
      mainComponents: ['หนังสือแจ้งมติ (read-only)', 'ลายเซ็นดิจิทัล'],
      workflow: ['ตรวจสอบหนังสือแจ้งมติ', 'กดลงนาม แล้วลงนามในหน้าต่างลายเซ็น'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" — รับต่อจาก ผอ.กลุ่มงานความเห็นแย้ง', 'เขียนสถานะส่งต่อธุรการกองกฎหมายออกเลขส่งและแจ้งผลผู้ยื่นคำขอ'],
    },
    '10-2-14-legal-admin-disclose-partial-notice-dispatch.html': {
      userGroup: 'เจ้าหน้าที่ธุรการกองกฎหมาย',
      objective: '[สายเปิดเผย/เปิดเผยบางส่วน] ออกเลขส่งและแจ้งผลผู้ยื่นคำขอ — ปิดสำนวนของสายนี้',
      mainComponents: ['เลขที่หนังสือส่ง (auto-suggest)', 'วันที่แจ้งผล'],
      workflow: ['ตรวจสอบ/แก้ไขเลขที่หนังสือส่ง', 'กดบันทึกและแจ้งผลผู้ยื่นคำขอ (ไม่มีลายเซ็น เป็นงานธุรการออกเลขส่ง)'],
      relatedRequirements: ['เฉพาะคำร้องสาย "เปิดเผย/เปิดเผยบางส่วน" — รับต่อจาก ผอ.กองกฎหมาย', 'สถานะปิดสำนวนจริง จบสายนี้ (ไม่มีสิทธิ์อุทธรณ์ต่อ เพราะเป็นผลที่เป็นคุณต่อผู้ยื่นคำขอ)'],
    },
  };

  function currentPageFile() {
    const path = global.location.pathname;
    const base = path.substring(path.lastIndexOf('/') + 1);
    return base || 'index.html';
  }

  function injectPageInfoStyles() {
    const style = document.createElement('style');
    style.textContent =
      '.page-info-btn{margin-top:10px;width:30px;height:30px;border-radius:50%;' +
      'background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.28);color:#fff;' +
      'display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;' +
      'transition:background .15s;}' +
      '.page-info-btn:hover{background:rgba(255,255,255,0.24);}' +
      '.page-info-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);' +
      'display:flex;align-items:center;justify-content:center;z-index:2147483100;padding:20px;}' +
      '.page-info-card{background:#fff;color:#1e293b;border-radius:12px;max-width:640px;width:100%;' +
      'max-height:85vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,.35);}' +
      '.page-info-header{padding:18px 22px;border-bottom:1px solid #e2e8f0;display:flex;' +
      'align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:#fff;}' +
      '.page-info-header h3{margin:0;font-size:1.05em;font-weight:700;color:#1e3a8a;}' +
      '.page-info-close{background:none;border:none;font-size:18px;color:#64748b;cursor:pointer;' +
      'width:28px;height:28px;border-radius:6px;}' +
      '.page-info-close:hover{background:#f1f5f9;}' +
      '.page-info-body{padding:18px 22px;}' +
      '.page-info-section{margin-bottom:16px;}' +
      '.page-info-section:last-child{margin-bottom:0;}' +
      '.page-info-section h4{margin:0 0 6px;font-size:.82em;font-weight:700;color:#1e3a8a;' +
      'text-transform:uppercase;letter-spacing:.4px;}' +
      '.page-info-section p{margin:0;font-size:.92em;line-height:1.6;color:#334155;}' +
      '.page-info-section ul{margin:0;padding-left:18px;font-size:.92em;line-height:1.7;color:#334155;}' +
      '.page-info-empty{font-size:.92em;color:#64748b;text-align:center;padding:20px 0;}';
    document.head.appendChild(style);
  }

  function renderPageInfoBody(info) {
    if (!info) {
      return '<div class="page-info-empty">ยังไม่มีข้อมูลสรุปสำหรับหน้านี้</div>';
    }
    const section = function (title, content) {
      const body = Array.isArray(content)
        ? '<ul>' + content.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>'
        : '<p>' + content + '</p>';
      return '<div class="page-info-section"><h4>' + title + '</h4>' + body + '</div>';
    };
    return (
      section('กลุ่มผู้ใช้งาน', info.userGroup) +
      section('วัตถุประสงค์', info.objective) +
      section('องค์ประกอบหลัก', info.mainComponents) +
      section('ขั้นตอนการทำงาน', info.workflow) +
      section('ความต้องการที่เกี่ยวข้อง', info.relatedRequirements)
    );
  }

  function closePageInfoModal() {
    const overlay = document.getElementById('pageInfoOverlay');
    if (overlay) overlay.remove();
  }

  function openPageInfoModal() {
    closePageInfoModal();
    const info = PAGE_INFO[currentPageFile()];
    const overlay = document.createElement('div');
    overlay.className = 'page-info-overlay';
    overlay.id = 'pageInfoOverlay';
    overlay.innerHTML =
      '<div class="page-info-card">' +
      '<div class="page-info-header"><h3>ℹ️ ข้อมูลสรุปหน้านี้</h3>' +
      '<button type="button" class="page-info-close" id="pageInfoCloseBtn">✕</button></div>' +
      '<div class="page-info-body">' + renderPageInfoBody(info) + '</div>' +
      '</div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePageInfoModal();
    });
    document.body.appendChild(overlay);
    document.getElementById('pageInfoCloseBtn').addEventListener('click', closePageInfoModal);
  }

  function injectPageInfoIcon() {
    const host = document.querySelector('.sidebar-bottom');
    if (!host || document.querySelector('.page-info-btn')) return;
    injectPageInfoStyles();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-info-btn';
    btn.title = 'ข้อมูลสรุปหน้านี้';
    btn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    btn.addEventListener('click', openPageInfoModal);
    host.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPageInfoIcon);
  } else {
    injectPageInfoIcon();
  }

  /* TOR 10.1.10.6 / 10.2.7.1 / 10.3.4.2(3): every upload must take Word, Excel
     and PDF. Pages set accept= inline; this fills in any input that was missed
     (e.g. built later by page JS) so the list can't drift again. */
  const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';

  function applyDocAccept(root) {
    (root || document).querySelectorAll('input[type="file"]').forEach(function (el) {
      const acc = el.getAttribute('accept') || '';
      if (!/\.xlsx/.test(acc) || !/\.docx/.test(acc) || !/\.pdf/.test(acc)) {
        el.setAttribute('accept', DOC_ACCEPT);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyDocAccept(); });
  } else {
    applyDocAccept();
  }

  /* ==========================================================================
     P10 — สวิตช์ "จำลองผลจากกิจกรรมที่ 7 (bypass)" ในเมนูโปรไฟล์ (ทุกหน้า)
     แสดงเฉพาะบทบาทที่ส่งเรื่องเข้ากิจกรรมที่ 7 (ธุรการกองกฎหมาย / ธุรการกองบริหารคดี /
     ธุรการเขต) เก็บใน localStorage คีย์ ecmis_act7_bypass ("0" = ปิด; ไม่มีคีย์ = เปิด)
     ECMIS_ACT7.isOn() ใช้ตัดสินว่าจะแสดงปุ่มบันทึกผลแทนกิจกรรมที่ 7 หรือไม่
     (ตรรกะเดียวกับ assets/ecmis-act7-bypass.js — ไฟล์นั้นไม่ทับถ้ามีตัวนี้อยู่แล้ว) */
  const ACT7_KEY = 'ecmis_act7_bypass';
  const ACT7_ROLES = ['admin_legal', 'case_bureau_admin', 'district_admin'];
  if (!global.ECMIS_ACT7) {
    global.ECMIS_ACT7 = {
      KEY: ACT7_KEY,
      roles: ACT7_ROLES.slice(),
      isOn: function () {
        try {
          const v = global.localStorage.getItem(ACT7_KEY);
          return v === null || v === undefined ? true : v !== '0';
        } catch (e) { return true; }
      },
      setOn: function (on) {
        try { global.localStorage.setItem(ACT7_KEY, on ? '1' : '0'); } catch (e) { /* จำค่าไม่ได้ */ }
        try {
          document.dispatchEvent(new global.CustomEvent('ecmis-act7-change', { detail: { on: !!on } }));
        } catch (e) { /* ไม่มี DOM */ }
      },
      canSeeSwitch: function (roleId) {
        return ACT7_ROLES.indexOf(roleId === 'Kanda.R' ? 'admin_legal' : roleId) >= 0;
      }
    };
  }

  function renderAct7Switch() {
    const body = document.querySelector('#profileDropdown .profile-dropdown-body');
    if (!body) return;
    const act7 = global.ECMIS_ACT7;
    let box = document.getElementById('act7SwitchBox');
    if (!act7.canSeeSwitch(getCurrentRole())) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.id = 'act7SwitchBox';
      box.style.cssText = 'margin-top:10px;padding:8px 10px;border:1px dashed #94a3b8;border-radius:8px;font-size:0.85em';
      box.innerHTML = '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-weight:600">'
        + '<input type="checkbox" id="act7SwitchInput" style="width:auto;margin:0" />'
        + '<span>จำลองผลจากกิจกรรมที่ 7 (bypass)</span></label>'
        + '<div style="margin-top:4px;color:#64748b;font-size:0.9em">เปิด = ธุรการบันทึกผลพิจารณาแทนกิจกรรมที่ 7 ได้ในระบบนี้</div>';
      const note = body.querySelector('.profile-note');
      body.insertBefore(box, note || null);
      box.querySelector('input').addEventListener('change', function (e) {
        global.ECMIS_ACT7.setOn(e.target.checked);
      });
    }
    box.querySelector('input').checked = act7.isOn();
  }
  document.addEventListener('DOMContentLoaded', renderAct7Switch);
  global.renderAct7Switch = renderAct7Switch;

  /* ==========================================================================
     สลับบทบาทจากเมนูโปรไฟล์ (คลิกชื่อผู้ใช้ ไม่ต้องออกจากระบบ) — ชุดบทบาทเดียวกับ ROLE_GROUPS ใน login.html
     (แก้กลุ่มบทบาทที่นั่นแล้วต้องแก้ที่นี่คู่กัน) เปลี่ยนแล้วไปหน้ารายการงานของบทบาทใหม่ */
  const SWITCHER_GROUPS = [
    { label: 'กิจกรรมที่ 10.1', ids: ['case_management', 'admin_legal', 'dir_legal', 'group_director', 'legal_officer'] },
    { label: '10.2 — คำขอเปิดเผยข้อมูลข่าวสาร', ids: ['sub_secretariat', 'subcommittee_screen', 'deputy_sg', 'secgen'] },
    { label: '10.2 — อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล', ids: ['case_bureau_admin', 'district_admin', 'case_bureau_director', 'case_tracking_director', 'appeal_subcommittee_secretariat', 'appeal_ruling_subcommittee', 'original_officer', 'case_tracking_secretary'] },
    { label: '10.3 — คดีศาลปกครอง', ids: ['case_group_director', 'case_legal_officer', 'registry', 'chairman'] }
  ];
  const ROLE_LEGACY_IDS = {
    'Kanda.R': 'admin_legal', 'Napas.S': 'dir_legal', 'Arnon.C': 'group_director',
    'Nattapol.B': 'legal_officer', 'Surapong.W': 'deputy_sg', 'Apichat.S': 'secgen'
  };

  function switchRole(roleId) {
    if (!roleId || roleId === getCurrentRole()) return;
    sessionStorage.setItem('ecmis_role', roleId);
    window.location.href = '01-work-inbox.html';
  }

  /* สไตล์รายการบทบาท — ฉีดจาก JS เพื่อไม่ต้องแก้ <link> css ในทุกหน้า; ใช้ตัวแปรสีเดิมจึงรองรับโหมดมืด */
  const ROLE_SWITCH_CSS = ''
    + '#profileDropdown.profile-dropdown-menu{width:340px}'
    + '.role-switch-title{width:100%;border:1px solid var(--border-color);background:var(--bg-body);border-radius:8px;padding:7px 10px;margin-bottom:6px;font:inherit;font-size:.8em;font-weight:700;color:var(--text-title);display:flex;align-items:center;gap:6px;cursor:pointer;text-align:left}'
    + '.role-switch-title:hover,.role-switch-title:focus-visible{border-color:#2563eb;outline:none}'
    + '.role-switch-title .role-switch-chev{margin-left:auto;color:#64748b;transition:transform .15s}'
    + '#roleSwitchBox.is-collapsed .role-switch-list{display:none}'
    + '#roleSwitchBox.is-collapsed .role-switch-chev{transform:rotate(-90deg)}'
    + '.role-switch-list{max-height:min(46vh,360px);overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;padding:4px;margin-bottom:6px}'
    + '.role-switch-group{font-size:.72em;font-weight:700;color:#1e3a8a;padding:6px 8px 2px;position:sticky;top:-4px;background:var(--bg-card)}'
    + '.role-switch-item{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;text-align:left;padding:6px 8px;border-radius:6px;cursor:pointer;color:inherit;font:inherit}'
    + '.role-switch-item:hover,.role-switch-item:focus-visible{background:var(--bg-body);outline:none}'
    + '.role-switch-item.is-current{background:rgba(37,99,235,.10);cursor:default}'
    + '.role-switch-av{flex:0 0 30px;height:30px;border-radius:50%;background:#e2e8f0;color:#1e3a8a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85em}'
    + '.role-switch-item.is-current .role-switch-av{background:#2563eb;color:#fff}'
    + '.role-switch-text{min-width:0;flex:1;line-height:1.3}'
    + '.role-switch-name{display:block;font-weight:700;font-size:.86em;color:var(--text-title)}'
    + '.role-switch-role{display:block;font-size:.76em;color:#64748b}'
    + '.role-switch-check{color:#2563eb;font-size:.85em}';

  function roleInitial(name) {
    return String(name || '').replace(/^(นางสาว|นาง|นาย|พ\.ต\.ท\.)/, '').trim().charAt(0) || '?';
  }

  function roleItemHtml(r, current) {
    const isCur = r.id === current;
    return '<button type="button" class="role-switch-item' + (isCur ? ' is-current' : '') + '" data-role="' + escHtml(r.id) + '"'
      + (isCur ? ' aria-current="true"' : '') + ' title="' + escHtml(r.org || '') + '">'
      + '<span class="role-switch-av">' + escHtml(roleInitial(r.name)) + '</span>'
      + '<span class="role-switch-text"><span class="role-switch-name">' + escHtml(r.name) + '</span>'
      + '<span class="role-switch-role">' + escHtml(r.title) + '</span></span>'
      + (isCur ? '<i class="fa-solid fa-check role-switch-check"></i>' : '')
      + '</button>';
  }

  /* แสดง/ซ่อนรายการบทบาท — ค่าตั้งต้นซ่อน (เมนูสั้น) จำค่าล่าสุดใน localStorage คีย์ ecmis_role_list_open */
  const ROLE_LIST_KEY = 'ecmis_role_list_open';
  function isRoleListOpen() {
    try { return global.localStorage.getItem(ROLE_LIST_KEY) === '1'; } catch (e) { return false; }
  }
  function setRoleListOpen(open) {
    try { global.localStorage.setItem(ROLE_LIST_KEY, open ? '1' : '0'); } catch (e) { /* จำค่าไม่ได้ */ }
    const box = document.getElementById('roleSwitchBox');
    if (!box) return;
    box.classList.toggle('is-collapsed', !open);
    const btn = box.querySelector('.role-switch-title');
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.title = open ? 'ซ่อนรายการบทบาท' : 'แสดงรายการบทบาท';
    }
  }

  /* รายการ "สลับบทบาท" ในเมนูโปรไฟล์ (คลิกชื่อผู้ใช้) — ชื่อบรรทัดแรก ตำแหน่งบรรทัดที่สอง จัดกลุ่มตามกิจกรรม */
  function renderRoleSwitcher() {
    const body = document.querySelector('#profileDropdown .profile-dropdown-body');
    const registry = (global.ECMIS && global.ECMIS.ROLES) || [];
    if (!body || !registry.length) return;
    if (!document.getElementById('roleSwitchStyle')) {
      const st = document.createElement('style');
      st.id = 'roleSwitchStyle';
      st.textContent = ROLE_SWITCH_CSS;
      document.head.appendChild(st);
    }
    const current = ROLE_LEGACY_IDS[getCurrentRole()] || getCurrentRole();
    const groups = SWITCHER_GROUPS.map(function (g) {
      const items = g.ids.map(function (id) {
        const r = registry.find(function (x) { return x.id === id; });
        return r ? roleItemHtml(r, current) : '';
      }).join('');
      return items ? '<div class="role-switch-group">' + escHtml(g.label) + '</div>' + items : '';
    }).join('');

    let box = document.getElementById('roleSwitchBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'roleSwitchBox';
      const card = body.querySelector('.profile-card');
      body.insertBefore(box, card ? card.nextSibling : body.firstChild);
      box.addEventListener('click', function (e) {
        if (e.target.closest('.role-switch-title')) {
          setRoleListOpen(box.classList.contains('is-collapsed'));
          return;
        }
        const item = e.target.closest('.role-switch-item');
        if (item) switchRole(item.getAttribute('data-role'));
      });
    }
    const cur = resolveRoleDisplay(getCurrentRole());
    box.innerHTML = '<button type="button" class="role-switch-title" aria-controls="roleSwitchList">'
      + '<i class="fa-solid fa-user-gear"></i><span>สลับบทบาท <span style="font-weight:400;color:#64748b">· ' + escHtml(cur.role) + '</span></span>'
      + '<i class="fa-solid fa-chevron-down role-switch-chev"></i></button>'
      + '<div class="role-switch-list" id="roleSwitchList" role="list">' + groups + '</div>';
    setRoleListOpen(isRoleListOpen());
    const note = body.querySelector('.profile-note');
    if (note) note.style.display = 'none';
  }
  document.addEventListener('DOMContentLoaded', renderRoleSwitcher);
  global.renderRoleSwitcher = renderRoleSwitcher;

  global.getCurrentRole = getCurrentRole;
  /* หน้าที่ไม่เรียก updateRoleDisplay() เอง ก็ยังได้แจ้งเตือนจริง */
  document.addEventListener('DOMContentLoaded', function () {
    if (global.Activity10 && document.querySelector('.noti-badge')) renderNotifications();
  });
  global.updateRoleDisplay = updateRoleDisplay;
  global.renderNotifications = renderNotifications;
  global.ecmisCurrentUnit = function () { return currentUnit(getCurrentRole()); };
  global.toggleProfileDropdown = toggleProfileDropdown;
  global.toggleNotifDropdown = toggleNotifDropdown;
  global.confirmLogout = confirmLogout;
  global.toggleSidebar = toggleSidebar;
  global.changeFontSize = changeFontSize;
  global.toggleTheme = toggleTheme;
  global.ECMIS_DOC_ACCEPT = DOC_ACCEPT;
  global.applyDocAccept = applyDocAccept;
})(window);
