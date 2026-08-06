(() => {
  const ROLE_KEY = 'ecmis-a4-role';
  const REGION_KEY = 'ecmis-a4-regional-region';
  const COLLAPSED_KEY = 'ecmis-a4-sidebar-collapsed';
  const ROLE_LABELS = {
    admin: 'ธุรการ ศรร.',
    officer: 'เจ้าหน้าที่รับเรื่อง',
    'regional-officer': 'เจ้าหน้าที่เขต',
    center: 'ผอ.ศรร.',
    division: 'ผอ.กบค.',
    acting: 'ผู้รักษาราชการแทนตามคำสั่ง',
    anonymous: 'กล่องบัตรสนเท่ห์'
  };
  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4"/></svg>',
    assigned: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l2 2 4-4"/><circle cx="12" cy="9" r="5"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
    form: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
    review: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5M8 11l2 2 4-4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.4 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></svg>',
    anonymous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11h18M7 11l1-5h8l1 5"/><circle cx="8" cy="15" r="2"/><circle cx="16" cy="15" r="2"/><path d="M10 15h4"/></svg>'
  };

  function currentRole() {
    const role = new URLSearchParams(location.search).get('role') || sessionStorage.getItem(ROLE_KEY) || 'admin';
    return ROLE_LABELS[role] ? role : 'admin';
  }

  function roleUrl(path, role, extra = {}) {
    const url = new URL(path, location.href);
    url.searchParams.set('role', role);
    if (role === 'regional-officer') {
      const region = new URLSearchParams(location.search).get('region') || sessionStorage.getItem(REGION_KEY) || 'เขต 1';
      url.searchParams.set('region', region);
    }
    Object.entries(extra).forEach(([key, value]) => url.searchParams.set(key, value));
    return `${url.pathname.split('/').pop()}${url.search}`;
  }

  function menuFor(role) {
    const list = [{ label: 'รายการเรื่องร้องเรียน', icon: 'dashboard', href: roleUrl('staff-workflow.html', role) }];
    if (role === 'admin') {
      list.push(
        { label: 'เรื่องยังไม่มอบหมาย', icon: 'inbox', href: roleUrl('staff-workflow.html', role, { queue: 'unassigned' }) },
        { label: 'เรื่องมอบหมายแล้ว', icon: 'assigned', href: roleUrl('staff-workflow.html', role, { queue: 'assigned' }) },
        { label: 'บันทึกเรื่องร้องเรียน', icon: 'form', href: roleUrl('staff-intake.html', role) },
        { label: 'จัดการคำแนะนำ', icon: 'settings', command: 'manageSuggestions' },
        { label: 'จัดการผู้ปฏิบัติงานแทน', icon: 'settings', command: 'manageBackups' }
      );
    } else if (role === 'officer' || role === 'regional-officer') {
      list.push({ label: 'บันทึกเรื่องร้องเรียน', icon: 'form', href: roleUrl('staff-intake.html', role) });
    } else if (role === 'anonymous') {
      list[0] = { label: 'กล่องบัตรสนเท่ห์', icon: 'anonymous', href: roleUrl('staff-workflow.html', role) };
    } else {
      list.push({ label: 'เรื่องรอพิจารณา', icon: 'review', href: roleUrl('staff-workflow.html', role) });
    }
    if (role !== 'anonymous') {
      list.push({ label: 'สำนวนคดี (กิจกรรมที่ 5)', icon: 'review', href: roleUrl('staff-workflow.html', role, { view: 'a5' }) });
    }
    return list;
  }

  function isActive(item) {
    if (!item.href || item.command) return false;
    const current = new URL(location.href);
    const target = new URL(item.href, location.href);
    if (current.pathname.split('/').pop() !== target.pathname.split('/').pop()) return false;
    if (target.searchParams.has('view')) return current.searchParams.get('view') === target.searchParams.get('view');
    if (current.searchParams.has('view')) return false;
    if (target.searchParams.has('queue')) return current.searchParams.get('queue') === target.searchParams.get('queue');
    return !current.searchParams.has('queue');
  }

  function menuMarkup(role) {
    return menuFor(role).map(item => {
      const body = `<span class="ecmis-sidebar-icon">${ICONS[item.icon]}</span><span class="ecmis-sidebar-label">${item.label}</span>`;
      if (item.command) return `<button type="button" class="ecmis-sidebar-command" data-sidebar-command="${item.command}" title="${item.label}">${body}</button>`;
      return `<a class="ecmis-sidebar-link${isActive(item) ? ' active' : ''}" href="${item.href}" title="${item.label}"${isActive(item) ? ' aria-current="page"' : ''}>${body}</a>`;
    }).join('');
  }

  function render() {
    const host = document.querySelector('.a4-workspace, .a4-walkin-shell');
    if (!host) return;
    const role = currentRole();
    let sidebar = document.getElementById('ecmisSidebar');
    if (!sidebar) {
      document.body.classList.add('ecmis-sidebar-enabled');
      document.body.classList.toggle('ecmis-sidebar-collapsed', localStorage.getItem(COLLAPSED_KEY) === 'true');
      sidebar = document.createElement('aside');
      sidebar.id = 'ecmisSidebar';
      sidebar.className = 'ecmis-sidebar';
      sidebar.setAttribute('aria-label', 'เมนูหลัก');
      host.prepend(sidebar);
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'ecmis-sidebar-overlay';
      overlay.setAttribute('aria-label', 'ปิดเมนู');
      host.prepend(overlay);
      overlay.addEventListener('click', () => document.body.classList.remove('ecmis-sidebar-mobile-open'));
    }
    sidebar.innerHTML = `<div class="ecmis-sidebar-brand"><span class="ecmis-sidebar-logo">ป.ป.ท.</span><span class="ecmis-sidebar-brand-text"><strong>E-CMIS</strong><small>COMPLAINT MANAGEMENT</small></span></div><nav class="ecmis-sidebar-nav"><div class="ecmis-sidebar-section">เมนูตามสิทธิ์</div>${menuMarkup(role)}</nav><footer class="ecmis-sidebar-footer"><div class="ecmis-sidebar-user"><span class="ecmis-sidebar-avatar">${ROLE_LABELS[role].slice(0, 2)}</span><span class="ecmis-sidebar-user-copy"><strong>${ROLE_LABELS[role]}</strong><small>สิทธิ์การทำงานปัจจุบัน</small></span></div><button type="button" class="ecmis-sidebar-toggle" aria-label="ย่อหรือขยายเมนู" title="ย่อหรือขยายเมนู"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button></footer>`;
    sidebar.querySelector('.ecmis-sidebar-toggle').addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('ecmis-sidebar-collapsed');
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    });
    sidebar.querySelectorAll('[data-sidebar-command]').forEach(button => button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.sidebarCommand);
      if (target) target.click();
      else {
        sessionStorage.setItem('ecmis-a4-sidebar-command', button.dataset.sidebarCommand);
        location.href = roleUrl('staff-workflow.html', role);
      }
      document.body.classList.remove('ecmis-sidebar-mobile-open');
    }));
    ensureMobileToggle();
    const pendingCommand = sessionStorage.getItem('ecmis-a4-sidebar-command');
    const pendingTarget = pendingCommand && document.getElementById(pendingCommand);
    if (pendingTarget) {
      sessionStorage.removeItem('ecmis-a4-sidebar-command');
      requestAnimationFrame(() => pendingTarget.click());
    }
  }

  function ensureMobileToggle() {
    const topbar = document.querySelector('.ws-topbar-inner');
    if (!topbar || topbar.querySelector('.ecmis-sidebar-mobile-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ecmis-sidebar-mobile-toggle';
    button.setAttribute('aria-label', 'เปิดเมนูหลัก');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    button.addEventListener('click', () => document.body.classList.toggle('ecmis-sidebar-mobile-open'));
    topbar.prepend(button);
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.addEventListener('change', event => {
      if (event.target.id !== 'wsRole' && event.target.id !== 'wsRegionalRegion') return;
      requestAnimationFrame(render);
    });
    window.addEventListener('popstate', render);
  });
})();
