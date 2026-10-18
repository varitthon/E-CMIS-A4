/* ==========================================================================
   E-CMIS กิจกรรมที่ 10 — แถบเมนูข้างซ้าย (sidebar) สร้างด้วย JS ทั้งหมด
   รูปแบบเดียวกับ intake-investigation/assets/ecmis-sidebar.js (ก4/ก5):
   แบรนด์ · กลุ่มเมนู (งานของฉัน: รายการงาน + หนังสือแจ้ง ·
   ค้นหา · รายงาน — กลุ่มรายงานเห็นเฉพาะสายงานกฎหมาย) · ส่วนท้าย (ผู้ใช้ · ย่อ/ขยาย · ออกจากระบบ)
   ไม่มีลิงก์ไปกิจกรรมที่ 7
   (ใช้สวิตช์ "จำลองผลจากกิจกรรมที่ 7 (bypass)" ในเมนูโปรไฟล์แทนตามเดิม)
   โหลดแบบ defer หลัง ecmis-shell.js — ใช้ getCurrentRole/ecmisRoleDisplay/confirmLogout ของ shell
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.ECMISSidebar) return; // บางหน้าโหลดสคริปต์ shell ซ้ำ — กันสร้างสองชุด

  const COLLAPSED_KEY = 'ecmis_sidebar_collapsed';
  const INBOX = '01-work-inbox.html';
  const MOBILE_MAX = 900;
  const ICONS = {
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    report: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/></svg>'
  };
  /* กลุ่มเมนู (หัวข้อคงที่) — เลือกหมวดงาน 10.1/10.2/10.3 ที่การ์ดในหน้ารายการงาน;
     legalOnly = เห็นเฉพาะบทบาทสายงานกฎหมาย (Activity10.isLegalViewRole) */
  const NAV_GROUPS = [
    { id: 'work', label: 'งานของฉัน', items: [
      { href: INBOX, label: 'รายการงาน', icon: 'inbox' },
      { href: 'notices.html', label: 'หนังสือแจ้งจากหน่วยงานอื่น', icon: 'mail', count: noticeCount }
    ] },
    { id: 'search', label: 'ค้นหา', items: [
      { href: 'search-case.html', label: 'ค้นหาสำนวน', icon: 'search' }
    ] },
    { id: 'reports', label: 'รายงาน', legalOnly: true, items: [
      { href: 'board-report.html', label: 'รายงานผลตามมติคณะกรรมการ', icon: 'report' },
      { href: 'registry.html', label: 'สารบบคำวินิจฉัย/คำพิพากษา', icon: 'book' },
      { href: 'dasdbord.html', label: 'แดชบอร์ดสถิติ', icon: 'chart' }
    ] }
  ];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function currentFile() {
    return global.location.pathname.split('/').pop() || INBOX;
  }

  function sessionRole() {
    try { return global.sessionStorage.getItem('ecmis_role') || ''; } catch (e) { return ''; }
  }

  function isLegalRole() {
    const A = global.Activity10;
    return !!(A && typeof A.isLegalViewRole === 'function' && A.isLegalViewRole(sessionRole()));
  }

  /* จำนวนหนังสือแจ้งถึงหน่วยของผู้ใช้ (ตรรกะเดียวกับหน้า notices.html) — ข้อมูลยังไม่พร้อมคืน 0 */
  function noticeCount() {
    const A = global.Activity10;
    if (!A || typeof A.buildAlerts !== 'function' || typeof global.getCurrentRole !== 'function') return 0;
    try {
      const unit = typeof global.ecmisCurrentUnit === 'function' ? global.ecmisCurrentUnit() : '';
      return A.buildAlerts(A.getCases(), global.getCurrentRole(), new Date(), { unit: unit })
        .filter(function (a) { return a.kind === 'notice'; }).length;
    } catch (e) {
      return 0;
    }
  }

  function linkMarkup(item, file) {
    const on = file === item.href;
    const n = item.count ? item.count() : 0;
    return '<a class="ecmis-sidebar-nav-link' + (on ? ' active' : '') + '" href="' + item.href + '"'
      + (on ? ' aria-current="page"' : '') + ' title="' + esc(item.label) + (n ? ' (' + n + ')' : '') + '">'
      + ICONS[item.icon] + '<span class="ecmis-sidebar-label">' + esc(item.label) + '</span>'
      + (n ? '<span class="ecmis-sidebar-count" aria-label="' + n + ' รายการ">' + n + '</span>' : '')
      + '</a>';
  }

  function navMarkup() {
    const file = currentFile();
    const legal = isLegalRole();
    return '<nav class="ecmis-sidebar-nav" aria-label="เมนูหลัก">'
      + NAV_GROUPS.filter(function (g) { return !g.legalOnly || legal; }).map(function (g) {
        return '<div class="ecmis-sidebar-group" data-group="' + g.id + '">'
          + '<div class="ecmis-sidebar-group-title">' + esc(g.label) + '</div>'
          + g.items.map(function (item) { return linkMarkup(item, file); }).join('')
          + '</div>';
      }).join('')
      + '</nav>';
  }

  function isCollapsed() {
    try { return global.localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch (e) { return false; }
  }

  function roleDisplay() {
    const roleId = typeof global.getCurrentRole === 'function' ? global.getCurrentRole() : '';
    const cur = typeof global.ecmisRoleDisplay === 'function' ? global.ecmisRoleDisplay(roleId) : null;
    return cur || { name: 'ผู้ใช้งาน', role: 'สำนักงาน ป.ป.ท.', av: '?' };
  }

  function footerMarkup() {
    const cur = roleDisplay();
    return '<footer class="ecmis-sidebar-footer">'
      + '<div class="ecmis-sidebar-user" title="' + esc(cur.name) + ' — ' + esc(cur.role) + '">'
      + '<span class="ecmis-sidebar-avatar">' + esc(cur.av) + '</span>'
      + '<span class="ecmis-sidebar-user-copy"><strong>' + esc(cur.name) + '</strong><small>' + esc(cur.role) + '</small></span>'
      + '</div>'
      + '<div class="ecmis-sidebar-tools">'
      + '<button type="button" class="ecmis-sidebar-toggle" aria-label="ย่อหรือขยายเมนู" title="ย่อหรือขยายเมนู">' + ICONS.chevron + '</button>'
      + '</div>'
      + '<button type="button" class="ecmis-sidebar-logout" aria-label="ออกจากระบบ" title="ออกจากระบบ">'
      + ICONS.logout + '<span class="ecmis-sidebar-label">ออกจากระบบ</span></button>'
      + '</footer>';
  }

  function logout(e) {
    if (typeof global.confirmLogout === 'function' && global.Swal) {
      global.confirmLogout(e);
      return;
    }
    sessionStorage.removeItem('ecmis_role');
    global.location.href = 'login.html';
  }

  function isMobile() {
    return global.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle('ecmis-sidebar-collapsed', collapsed);
    try { global.localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch (e) { /* จำค่าไม่ได้ */ }
  }

  /* ปุ่ม ☰ บน topbar (toggleSidebar ของ shell) — มือถือเปิด/ปิด drawer, เดสก์ท็อปย่อ/ขยาย */
  function toggle() {
    if (isMobile()) document.body.classList.toggle('ecmis-sidebar-mobile-open');
    else setCollapsed(!document.body.classList.contains('ecmis-sidebar-collapsed'));
  }

  /* ผูกครั้งเดียวที่ <aside> — ปุ่มข้างในถูกสร้างใหม่ทุกครั้งที่ render() */
  function bind(sidebar) {
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('.ecmis-sidebar-toggle')) {
        setCollapsed(!document.body.classList.contains('ecmis-sidebar-collapsed'));
        return;
      }
      if (e.target.closest('.ecmis-sidebar-logout')) {
        logout(e);
      }
    });
  }

  function render() {
    const main = document.querySelector('body > .main');
    if (!main) return;
    let sidebar = document.getElementById('ecmisSidebar');
    if (!sidebar) {
      document.body.classList.add('ecmis-sidebar-enabled');
      document.body.classList.toggle('ecmis-sidebar-collapsed', isCollapsed());
      sidebar = document.createElement('aside');
      sidebar.id = 'ecmisSidebar';
      sidebar.className = 'ecmis-sidebar no-print';
      sidebar.setAttribute('aria-label', 'เมนูหลัก');
      sidebar.setAttribute('data-demo-skip', '');
      document.body.insertBefore(sidebar, main);
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'ecmis-sidebar-overlay';
      overlay.setAttribute('aria-label', 'ปิดเมนู');
      overlay.addEventListener('click', function () {
        document.body.classList.remove('ecmis-sidebar-mobile-open');
      });
      document.body.insertBefore(overlay, main);
      bind(sidebar);
    }
    sidebar.innerHTML = '<a class="ecmis-sidebar-brand" href="' + INBOX + '" title="กลับหน้ารายการงาน">'
      + '<img class="ecmis-sidebar-logo" src="pacc_logo.png" alt="ตราสัญลักษณ์ ป.ป.ท." />'
      + '<span class="ecmis-sidebar-brand-text"><strong>E-CMIS</strong><small>ระบบกฎหมายในทางคดี</small></span></a>'
      + navMarkup()
      + '<div class="ecmis-sidebar-spacer"></div>'
      + footerMarkup();
  }

  global.ECMISSidebar = { render: render, toggle: toggle };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
  global.addEventListener('resize', function () {
    if (!isMobile()) document.body.classList.remove('ecmis-sidebar-mobile-open');
  });
})(window);
