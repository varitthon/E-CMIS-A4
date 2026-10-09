/* ==========================================================================
   E-CMIS กิจกรรมที่ 10 — แถบเมนูข้างซ้าย (sidebar) สร้างด้วย JS ทั้งหมด
   รูปแบบเดียวกับ intake-investigation/assets/ecmis-sidebar.js (ก4/ก5):
   แบรนด์ · สวิตช์หมวดงาน 10.1/10.2/10.3 · ส่วนท้าย (ผู้ใช้ · ย่อ/ขยาย · ⓘ · ออกจากระบบ)
   ไม่มีรายการเมนูตามสิทธิ์ (ซ่อนทั้งหมดตามที่ตกลง) และไม่มีลิงก์ไปกิจกรรมที่ 7
   (ใช้สวิตช์ "จำลองผลจากกิจกรรมที่ 7 (bypass)" ในเมนูโปรไฟล์แทนตามเดิม)
   โหลดแบบ defer หลัง ecmis-shell.js — ใช้ getCurrentRole/ecmisRoleDisplay/confirmLogout ของ shell
   ========================================================================== */
(function (global) {
  'use strict';
  if (global.ECMISSidebar) return; // บางหน้าโหลดสคริปต์ shell ซ้ำ — กันสร้างสองชุด

  const COLLAPSED_KEY = 'ecmis_sidebar_collapsed';
  const INBOX = '01-work-inbox.html';
  const MOBILE_MAX = 900;
  const CATEGORIES = [
    { id: '10.1', label: 'คดีอาญาทุจริตฯ' },
    { id: '10.2', label: 'ข้อมูลข่าวสาร' },
    { id: '10.3', label: 'คดีปกครอง' }
  ];
  const ICONS = {
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>'
  };

  let activeCategory = null;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function currentFile() {
    return global.location.pathname.split('/').pop() || INBOX;
  }

  /* หมวดงานของหน้าปัจจุบันจากชื่อไฟล์: 10-2-* = 10.2, 10-3* = 10.3,
     หน้า 03–22 (สาย 10.1 เดิม) = 10.1; กล่องงานอ่านจาก ?cat (ค่าตั้งต้น 10.1);
     หน้ารับเรื่องกลาง (02) และแดชบอร์ด ไม่ผูกหมวด */
  function categoryFromPage() {
    const file = currentFile();
    if (file === INBOX) {
      const cat = new URLSearchParams(global.location.search).get('cat');
      return CATEGORIES.some(function (c) { return c.id === cat; }) ? cat : '10.1';
    }
    if (/^10-2-/.test(file)) return '10.2';
    if (/^10-3/.test(file)) return '10.3';
    if (/^\d{2}-/.test(file) && !/^0[12]-/.test(file)) return '10.1';
    return null;
  }

  function isCollapsed() {
    try { return global.localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch (e) { return false; }
  }

  function roleDisplay() {
    const roleId = typeof global.getCurrentRole === 'function' ? global.getCurrentRole() : '';
    const cur = typeof global.ecmisRoleDisplay === 'function' ? global.ecmisRoleDisplay(roleId) : null;
    return cur || { name: 'ผู้ใช้งาน', role: 'สำนักงาน ป.ป.ท.', av: '?' };
  }

  function switchMarkup() {
    return '<div class="ecmis-sidebar-switch" role="tablist" aria-label="สลับหมวดงานกฎหมายในทางคดี">'
      + CATEGORIES.map(function (c) {
        const on = c.id === activeCategory;
        return '<a class="ecmis-sidebar-switch-btn' + (on ? ' active' : '') + '" href="' + INBOX + '?cat=' + c.id + '"'
          + ' role="tab" aria-selected="' + on + '" data-cat="' + c.id + '" title="' + c.id + ' ' + esc(c.label) + '">'
          + '<strong>' + c.id + '</strong><span>' + esc(c.label) + '</span></a>';
      }).join('')
      + '</div>';
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

  /* อยู่ในกล่องงานแล้ว: สลับหมวดในหน้าเดิม ไม่ต้องโหลดหน้าใหม่ */
  function onSwitchClick(e, btn) {
    if (currentFile() !== INBOX || typeof global.selectCategory !== 'function') return;
    e.preventDefault();
    const cat = btn.getAttribute('data-cat');
    if (cat !== activeCategory) global.selectCategory(cat);
    document.body.classList.remove('ecmis-sidebar-mobile-open');
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
        return;
      }
      const tab = e.target.closest('[data-cat]');
      if (tab) onSwitchClick(e, tab);
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
      + switchMarkup()
      + '<div class="ecmis-sidebar-spacer"></div>'
      + footerMarkup();
    if (typeof global.injectPageInfoIcon === 'function') global.injectPageInfoIcon();
  }

  /* กล่องงานเรียกเมื่อเลือก/ยุบหมวด (selectCategory) ให้แท็บตรงกับการ์ดที่เปิดอยู่ */
  function setActiveCategory(cat) {
    activeCategory = cat || null;
    document.querySelectorAll('#ecmisSidebar .ecmis-sidebar-switch-btn').forEach(function (btn) {
      const on = btn.getAttribute('data-cat') === activeCategory;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
    });
  }

  activeCategory = categoryFromPage();
  global.ECMISSidebar = { render: render, toggle: toggle, setActiveCategory: setActiveCategory };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
  global.addEventListener('resize', function () {
    if (!isMobile()) document.body.classList.remove('ecmis-sidebar-mobile-open');
  });
})(window);
