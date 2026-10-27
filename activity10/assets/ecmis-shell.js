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

  /* โหมดสาธิต: สวิตช์ "เติมข้อมูลตัวอย่าง (สำนวน 0001/2569)" — โหลดจากโฟลเดอร์เดียวกับไฟล์นี้
     ทุกหน้าที่ใช้ shell ได้ทันทีโดยไม่ต้องแก้ <script> ในแต่ละหน้า */
  (function loadDemoCase() {
    const self = document.currentScript && document.currentScript.src;
    if (!self || global.ECMIS_DEMO) return;
    const s = document.createElement('script');
    s.src = self.replace(/ecmis-shell\.js[^/]*$/, 'ecmis-demo-case.js?v=20261014_1');
    document.head.appendChild(s);
  })();

  /* ช่องข้อความยาวมีไมค์พูดเป็นข้อความ + ทุก select ค้นหาได้ (ecmis-input-enhance.js) — ทุกหน้าที่ใช้ shell */
  (function loadInputEnhance() {
    const self = document.currentScript && document.currentScript.src;
    if (!self || global.ECMISInputEnhance) return;
    const s = document.createElement('script');
    s.src = self.replace(/ecmis-shell\.js[^/]*$/, 'ecmis-input-enhance.js?v=20261027_2');
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
      { title: 'ผลมติจากผู้บริหารลงนามแล้ว', text: 'สำนวน 0038/2568 ผู้บริหารลงนามแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'คำร้องขอเปิดเผยข้อมูลข่าวสาร', text: 'คำร้อง 100101/2569 เข้าสู่ระบบแล้ว ส่งกอง/สำนักที่รับผิดชอบ', icon: 'fa-envelope', urgent: false },
      { title: 'คดีปกครอง', text: 'คดีปกครอง 100207/2569 รอส่งพนักงานอัยการดำเนินคดีแทน', icon: 'fa-scale-balanced', urgent: false }
    ],
    legal_officer: [
      { title: 'เตือนกรอบเวลาเร่งด่วน (เหลือ 2 วัน)', text: 'สำนวน คดี-100001/2569 ครบกำหนดยกร่างความเห็น', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'ได้รับมอบหมายสำนวนใหม่', text: 'สำนวน คดี-100003/2569 รอนิติกรจัดทำความเห็นแย้ง', icon: 'fa-clipboard-list', urgent: false },
      { title: 'คำร้องขอเปิดเผยข้อมูลข่าวสาร', text: 'คำร้อง 100103/2569 รอนิติกรทำความเห็นเสนอ', icon: 'fa-envelope', urgent: false }
    ],
    dir_legal: [
      { title: 'มอบหมายสำนวนคดีใหม่', text: 'สำนวน คดี-100003/2569 รอมอบหมายกลุ่มงาน', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'ตรวจพิจารณาความเห็น', text: 'สำนวน คดี-100004/2569 รอ ผอ.กอง ตรวจพิจารณาและสั่งการ', icon: 'fa-clipboard-list', urgent: false },
      { title: 'คดีปกครอง', text: 'คดีปกครอง-100205/2569 เสนอ ผอ.กองกฎหมาย ตรวจ', icon: 'fa-landmark', urgent: false }
    ],
    group_director: [
      { title: 'มอบหมายนิติกร', text: 'สำนวน คดี-100002/2569 รอ ผอ.กลุ่มงาน มอบหมายนิติกร', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'ตรวจร่างความเห็นนิติกร', text: 'สำนวน คดี-100004/2569 เสนอ ผอ.กลุ่ม ตรวจร่างความเห็น', icon: 'fa-clipboard-list', urgent: false },
      { title: 'คดีปกครอง', text: 'คดีปกครอง-100204/2569 เสนอ ผอ.กลุ่ม ตรวจร่างคำให้การ', icon: 'fa-landmark', urgent: false }
    ],
    deputy_sg: [
      { title: 'รอลงนามความเห็นแย้ง', text: 'สำนวน คดี-100006/2569 เสนอผู้บริหารลงนาม', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'คำร้องขอเปิดเผยข้อมูล', text: 'คำร้อง-100105/2569 เสนอผู้บริหารเห็นชอบมติ', icon: 'fa-envelope', urgent: false },
      { title: 'คดีปกครอง', text: 'คดีปกครอง-100206/2569 เสนอผู้บริหารลงนามคำให้การ', icon: 'fa-landmark', urgent: false }
    ],
    sub_secretariat: [
      { title: 'รอจัดทำรายงานความเห็นเสนอคณะอนุกรรมการฯ', text: 'คำร้อง-100301/2569 ได้รับมอบหมายจาก ผอ.กลุ่มงานความเห็นแย้ง', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'รอบรรจุวาระและนัดหมายประชุม', text: 'คำร้อง-100302/2569 ผ่านการตรวจความครบถ้วนแล้ว', icon: 'fa-calendar-days', urgent: false },
      { title: 'รอจัดทำผลมติคณะอนุกรรมการฯ', text: 'คำร้อง-100303/2569 คณะอนุกรรมการมีมติแล้ว', icon: 'fa-clipboard-list', urgent: false }
    ],
    subcommittee_screen: [
      { title: 'รอพิจารณาตามระเบียบวาระ', text: 'มีเรื่องเข้าวาระการประชุมกลั่นกรองการเปิดเผยข้อมูลข่าวสาร 3 เรื่อง', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'เอกสารประกอบการประชุม', text: 'ฝ่ายเลขานุการฯ จัดส่งเอกสารประกอบการประชุมแล้ว', icon: 'fa-paperclip', urgent: false }
    ],
    secgen: [
      { title: 'รอเห็นชอบและลงนามมติคณะอนุกรรมการฯ', text: 'คำร้อง-100303/2569 รองเลขาธิการ ป.ป.ท. ให้ความเห็นแล้ว', icon: 'fa-circle-exclamation', urgent: true },
      { title: 'รอมอบหมายเรื่องใหม่', text: 'มีคำขอเปิดเผยข้อมูลข่าวสารรอมอบหมาย', icon: 'fa-envelope', urgent: false }
    ],
    _default: [
      { title: 'รายการงานใหม่', text: 'มีงานกฎหมายในทางคดีเข้าระบบ', icon: 'fa-clipboard-list', urgent: false }
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

    if (global.ECMISSidebar) global.ECMISSidebar.render();
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
    danger: { color: '#dc2626', dot: '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' },
    warning: { color: '#b45309', dot: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' },
    info: { color: '#2563eb', dot: '<i class="fa-solid fa-envelope" aria-hidden="true"></i>' }
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
        + '<strong style="' + (n.urgent ? 'color:#dc2626;' : '') + '"><i class="fa-solid ' + n.icon + '" aria-hidden="true"></i> ' + n.title + '</strong>'
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

  /* ปุ่ม ☰ บน topbar — sidebar สร้างโดย assets/ecmis-sidebar.js (มือถือ = drawer, เดสก์ท็อป = ย่อ/ขยาย) */
  function toggleSidebar() {
    if (global.ECMISSidebar) global.ECMISSidebar.toggle();
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
    if (themeBtn) themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
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
        + '<span>จำลองผลมติคณะกรรมการ ป.ป.ท. (bypass)</span></label>'
        + '<div style="margin-top:4px;color:#64748b;font-size:0.9em">เปิด = ธุรการบันทึกผลพิจารณาของคณะกรรมการ ป.ป.ท.แทน ได้ในระบบนี้</div>';
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
    { label: 'กิจกรรมที่ 10.1', ids: ['case_bureau_investigator', 'admin_legal', 'dir_legal', 'group_director', 'legal_officer'] },
    { label: '10.2 — คำขอเปิดเผยข้อมูลข่าวสาร', ids: ['sub_secretariat', 'subcommittee_screen', 'deputy_sg', 'secgen'] },
    { label: '10.2 — อุทธรณ์คำสั่งไม่เปิดเผยข้อมูล', ids: ['case_bureau_admin', 'district_admin', 'case_bureau_director', 'appeal_subcommittee_secretariat', 'appeal_ruling_subcommittee', 'original_officer', 'case_tracking_secretary'] },
    { label: '10.3 — คดีปกครอง', ids: ['case_group_director', 'case_legal_officer'] }
  ];
  const ROLE_LEGACY_IDS = {
    'Kanda.R': 'admin_legal', 'Napas.S': 'dir_legal', 'Arnon.C': 'group_director',
    'Nattapol.B': 'legal_officer', 'Surapong.W': 'deputy_sg', 'Apichat.S': 'secgen'
  };

  /* บทบาทที่เพิ่มคำพิพากษาอย่างเดียว (Activity10.VERDICT_ONLY_ROLES) ไม่มีรายการงาน — ไปสารบบคำพิพากษาแทน */
  (function redirectVerdictOnlyRole() {
    const A = global.Activity10;
    const role = sessionStorage.getItem('ecmis_role') || '';
    const file = global.location.pathname.split('/').pop() || '01-work-inbox.html';
    if (A && (A.VERDICT_ONLY_ROLES || []).indexOf(role) >= 0 && file === '01-work-inbox.html') {
      global.location.replace('registry.html');
    }
  })();

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
  global.ecmisRoleDisplay = resolveRoleDisplay;
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

  /* ==========================================================================
     ขั้นตอนก่อนหน้า (พับได้) — แสดงเฉพาะขั้นตอนปัจจุบัน ส่วนข้อมูลจากขั้นตอนก่อนหน้าพับไว้
     หน้าใส่ data-prev-step="<ชื่อหัวข้อ>" ที่การ์ดอ่านอย่างเดียว (และ data-prev-step-tag="<ป้ายสั้น>" ถ้ามี)
     ตัวช่วยนี้ห่อการ์ดด้วย <details class="prev-step"> ปิดไว้ก่อน โดย "ย้าย" การ์ดเดิมเข้าไป
     (ไม่คัดลอก) ⇒ id, ตัวฟังเหตุการณ์ และโค้ดเติมข้อมูลของหน้าเดิมทำงานเหมือนเดิม
     - การ์ดที่สคริปต์สร้างทีหลังก็ถูกห่อ (MutationObserver) และจำสถานะเปิด/ปิดตาม id/ชื่อหัวข้อ
     - การ์ดที่ถูกซ่อน (d-none / hidden / display:none) ⇒ ซ่อนทั้งกล่อง
     - พิมพ์หน้า ⇒ เปิดทุกกล่องชั่วคราว · ช่องกรอกในกล่องไม่ผ่านการตรวจ ⇒ เปิดกล่องให้เห็น
     ========================================================================== */
  const PREV_STEP_ATTR = 'data-prev-step';
  const prevStepOpenState = new Map();
  let prevStepObserver = null;

  function prevStepKey(el) {
    return el.id || el.getAttribute(PREV_STEP_ATTR) || '';
  }

  function isHiddenCard(el) {
    return el.classList.contains('d-none') || el.hidden || el.style.display === 'none';
  }

  function syncPrevStepVisibility(el) {
    const body = el.parentNode;
    if (body && body.classList && body.classList.contains('prev-step-body')) {
      body.parentNode.hidden = isHiddenCard(el);
    }
  }

  function wrapPrevStep(el) {
    if (!el.parentNode || (el.parentNode.classList && el.parentNode.classList.contains('prev-step-body'))) return;
    const box = document.createElement('details');
    box.className = 'prev-step';
    const summary = document.createElement('summary');
    const icon = document.createElement('span');
    icon.className = 'prev-step-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    const title = document.createElement('span');
    title.className = 'prev-step-title';
    title.textContent = el.getAttribute(PREV_STEP_ATTR);
    summary.appendChild(icon);
    summary.appendChild(title);
    const tagText = el.getAttribute('data-prev-step-tag');
    if (tagText) {
      const tag = document.createElement('span');
      tag.className = 'prev-step-tag';
      tag.textContent = tagText;
      summary.appendChild(tag);
    }
    /* data-prev-step-current = ส่วนของขั้นตอนปัจจุบัน (เปิดไว้ก่อน แถบสีน้ำเงิน) — 2026-10-21
       data-prev-step-hint = ข้อความกำกับด้านขวา (ค่าเริ่มต้น "ข้อมูลขั้นตอนก่อนหน้า") */
    const isCurrent = el.hasAttribute('data-prev-step-current');
    if (isCurrent) box.classList.add('prev-step--current');
    /* หัวกล่องพับแทนหัวการ์ด — ซ่อนหัวการ์ดด้านใน ไม่ให้ซ้ำ (ส่วนขั้นปัจจุบันเสมอ / อื่น ๆ ใส่ data-prev-step-hide-head) */
    if (isCurrent || el.hasAttribute('data-prev-step-hide-head')) box.classList.add('prev-step--nohead');
    const hint = document.createElement('span');
    hint.className = 'prev-step-hint';
    hint.textContent = el.getAttribute('data-prev-step-hint') || (isCurrent ? 'ขั้นตอนปัจจุบัน' : 'ข้อมูลขั้นตอนก่อนหน้า');
    summary.appendChild(hint);
    const body = document.createElement('div');
    body.className = 'prev-step-body';
    box.appendChild(summary);
    box.appendChild(body);
    el.parentNode.insertBefore(box, el);
    body.appendChild(el);
    const key = prevStepKey(el);
    const remembered = prevStepOpenState.get(key);
    box.open = remembered != null ? remembered : el.hasAttribute('data-prev-step-open') || isCurrent;
    box.addEventListener('toggle', function () { prevStepOpenState.set(key, box.open); });
    box.hidden = isHiddenCard(el);
    if (global.MutationObserver) {
      new MutationObserver(function () { syncPrevStepVisibility(el); })
        .observe(el, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    }
  }

  function collapsePrevSteps(root) {
    (root || document).querySelectorAll('[' + PREV_STEP_ATTR + ']').forEach(wrapPrevStep);
  }

  function setAllPrevSteps(open) {
    document.querySelectorAll('details.prev-step').forEach(function (box) { box.open = open; });
  }

  /* เปิดกล่องที่มี element นี้อยู่ (ใช้ก่อนโฟกัส/เลื่อนไปยังช่องในกล่องที่พับ หรือในสคริปต์สาธิต) */
  function openPrevStepOf(target) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    let box = el && el.closest ? el.closest('details.prev-step') : null;
    while (box) {
      box.open = true;
      box = box.parentElement ? box.parentElement.closest('details.prev-step') : null;
    }
  }

  function initPrevSteps() {
    collapsePrevSteps(document);
    if (!prevStepObserver && global.MutationObserver && document.body) {
      prevStepObserver = new MutationObserver(function (records) {
        records.forEach(function (r) {
          r.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.hasAttribute(PREV_STEP_ATTR)) wrapPrevStep(n);
            collapsePrevSteps(n);
          });
        });
      });
      prevStepObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  let prevStepPrintState = null;
  global.addEventListener('beforeprint', function () {
    prevStepPrintState = Array.from(document.querySelectorAll('details.prev-step')).map(function (b) { return [b, b.open]; });
    setAllPrevSteps(true);
  });
  global.addEventListener('afterprint', function () {
    (prevStepPrintState || []).forEach(function (p) { p[0].open = p[1]; });
    prevStepPrintState = null;
  });
  document.addEventListener('invalid', function (e) { openPrevStepOf(e.target); }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPrevSteps);
  else initPrevSteps();

  /* รายการตรวจแบบไอคอน (แทนสัญลักษณ์ตัวอักษร) — items = [[ข้อความ, ผ่าน?], ...] */
  function renderCheckList(target, items) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    el.textContent = '';
    (items || []).forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'check-item ' + (item[1] ? 'is-ok' : 'is-no');
      row.innerHTML = item[1]
        ? '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>';
      const text = document.createElement('span');
      text.textContent = item[0];
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = item[1] ? ' (ตรวจแล้ว)' : ' (ยังไม่ตรวจ)';
      row.appendChild(text);
      row.appendChild(sr);
      el.appendChild(row);
    });
  }

  /* ป้ายบนหัวกล่องพับที่มี element นี้อยู่ (เช่น เลขคดีที่เดิมอยู่บนหัวการ์ดที่ถูกซ่อน) */
  function setPrevStepTag(target, text) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    const box = el && el.closest ? el.closest('details.prev-step') : null;
    if (!box) return;
    const summary = box.querySelector(':scope > summary');
    let tag = summary.querySelector('.prev-step-tag');
    if (!tag) {
      tag = document.createElement('span');
      tag.className = 'prev-step-tag';
      summary.insertBefore(tag, summary.querySelector('.prev-step-hint'));
    }
    tag.textContent = text || '';
    tag.hidden = !text;
  }

  global.ECMISPrevStep = {
    setTag: setPrevStepTag,
    collapse: collapsePrevSteps,
    openAll: function () { setAllPrevSteps(true); },
    closeAll: function () { setAllPrevSteps(false); },
    openFor: openPrevStepOf,
  };
  global.ECMIS_renderCheckList = renderCheckList;
})(window);
