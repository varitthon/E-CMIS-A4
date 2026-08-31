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

  const ROLE_DISPLAY = {
    'admin_legal': { name: 'นางกานดา รักษ์ธรรม', role: 'เจ้าหน้าที่ธุรการกองกฎหมาย', av: 'ก', intake: true },
    'Kanda.R': { name: 'นางกานดา รักษ์ธรรม', role: 'เจ้าหน้าที่ธุรการกองกฎหมาย', av: 'ก', intake: true },
    'dir_legal': { name: 'นายนภัส สอนดี', role: 'ผู้อำนวยการกองกฎหมาย', av: 'น', intake: false },
    'Napas.S': { name: 'นายนภัส สอนดี', role: 'ผู้อำนวยการกองกฎหมาย', av: 'น', intake: false },
    'group_director': { name: 'นายอานนท์ ชินประชา', role: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง', av: 'อ', intake: false },
    'Arnon.C': { name: 'นายอานนท์ ชินประชา', role: 'ผู้อำนวยการกลุ่มงานความเห็นแย้ง', av: 'อ', intake: false },
    'legal_officer': { name: 'นายณัฐพล บัวทุม', role: 'นิติกรชำนาญการพิเศษ', av: 'ณ', intake: false },
    'Nattapol.B': { name: 'นายณัฐพล บัวทุม', role: 'นิติกรชำนาญการพิเศษ', av: 'ณ', intake: false },
    'deputy_sg': { name: 'นายสุรพงษ์ วัฒนา', role: 'รองเลขาธิการ ป.ป.ท.', av: 'ส', intake: false },
    'Surapong.W': { name: 'นายสุรพงษ์ วัฒนา', role: 'รองเลขาธิการ ป.ป.ท.', av: 'ส', intake: false }
  };

  const NOTIF_BY_ROLE = {
    admin_legal: [
      { title: '📨 ผลมติจากผู้บริหารลงนามแล้ว', text: 'สำนวน 0038/2568 ผู้บริหารลงนามแล้ว รอธุรการส่งหนังสือถึงอัยการสูงสุด', icon: '🔴', urgent: true },
      { title: '📋 คำร้องขอเปิดเผยข้อมูลข่าวสาร', text: 'คำร้อง 100101/2569 เข้าสู่ระบบแล้ว ส่งกอง/สำนักที่รับผิดชอบ', icon: '📨', urgent: false },
      { title: '🏛️ คดีศาลปกครอง', text: 'คดีปกครอง 100207/2569 รอส่งพนักงานอัยการดำเนินคดีแทน', icon: '⚖️', urgent: false }
    ],
    legal_officer: [
      { title: '🔴 เตือนกรอบเวลาเร่งด่วน (เหลือ 2 วัน)', text: 'สำนวน คดี-100001/2569 ครบกำหนดยกร่างความเห็นแย้ง', icon: '🔴', urgent: true },
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

  function getCurrentRole() {
    return sessionStorage.getItem('ecmis_role') || 'admin_legal';
  }

  function updateRoleDisplay() {
    const roleId = getCurrentRole();
    const btnIntake = document.getElementById('btnBoardIntake');
    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRoleTitle');

    const cur = ROLE_DISPLAY[roleId] || ROLE_DISPLAY['admin_legal'];
    if (avatar) avatar.innerText = cur.av;
    if (nameEl) nameEl.innerText = cur.name;
    if (roleEl) roleEl.innerText = cur.role;
    if (btnIntake) btnIntake.style.display = cur.intake ? 'inline-flex' : 'none';

    const cardName = document.getElementById('profileCardName');
    const cardTitle = document.getElementById('profileCardTitle');
    if (cardName) cardName.innerText = cur.name;
    if (cardTitle) cardTitle.innerText = cur.role;

    if (typeof global.renderSidebarMenu === 'function') global.renderSidebarMenu();
    renderNotifications();
  }

  function renderNotifications() {
    const roleId = getCurrentRole();
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

  global.getCurrentRole = getCurrentRole;
  global.updateRoleDisplay = updateRoleDisplay;
  global.renderNotifications = renderNotifications;
  global.toggleProfileDropdown = toggleProfileDropdown;
  global.toggleNotifDropdown = toggleNotifDropdown;
  global.confirmLogout = confirmLogout;
  global.toggleSidebar = toggleSidebar;
  global.changeFontSize = changeFontSize;
  global.toggleTheme = toggleTheme;
})(window);
