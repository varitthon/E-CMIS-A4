/* Shared Thai Buddhist-Era (พ.ศ.) date-only picker — reuses the .thai-date-field /
 * .thai-calendar-popover / .tc-* markup+CSS already shipped for the incident
 * date/time widget (complaint-form.html, staff-intake.html, staff-workflow.html filter).
 * Any page that loads this script gets window.ThaiDatePicker = { html, wireAll }.
 */
(function (global) {
  const THAI_MONTH_NAMES = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const pad2 = n => String(n).padStart(2, '0');
  const isoOf = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
  const todayISO = () => { const t = new Date(); return isoOf(t.getFullYear(), t.getMonth(), t.getDate()) };
  const attrEscape = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  function formatThaiBE(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d || !THAI_MONTH_NAMES[m - 1]) return '';
    return `${d} ${THAI_MONTH_NAMES[m - 1]} พ.ศ. ${y + 543}`;
  }
  function html(id, opts = {}) {
    const value = opts.value || '';
    const placeholder = opts.placeholder || 'เลือกวันที่';
    const ariaLabel = opts.ariaLabel || `เลือกวันที่ (ปฏิทินไทย) — ${placeholder}`;
    const disabledAttr = opts.disabled ? ' disabled' : '';
    const clearBtn = opts.clearable === false ? '' : `<button type="button" class="tc-today-btn" id="${id}TcClear">ล้างค่า</button>`;
    return `<div class="thai-date-field" data-tdp-id="${id}"><button type="button" class="thai-date-display" id="${id}Trigger"${disabledAttr}><span id="${id}DisplayText"></span></button><input type="hidden" id="${id}"${opts.name ? ` name="${attrEscape(opts.name)}"` : ''} value="${attrEscape(value)}" data-tdp-placeholder="${attrEscape(placeholder)}"><div class="thai-calendar-popover ws-hidden" id="${id}CalendarPopover" role="dialog" aria-label="${attrEscape(ariaLabel)}"><div class="tc-header"><button type="button" class="tc-nav" id="${id}TcPrev" aria-label="เดือนก่อนหน้า">‹</button><div class="tc-title-selects"><select class="tc-select" id="${id}TcMonth" aria-label="เลือกเดือน"></select><select class="tc-select" id="${id}TcYear" aria-label="เลือกปี พ.ศ."></select></div><button type="button" class="tc-nav" id="${id}TcNext" aria-label="เดือนถัดไป">›</button></div><div class="tc-weekdays"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="tc-days" id="${id}TcDays"></div><div class="tc-footer"><button type="button" class="tc-today-btn" id="${id}TcToday">วันนี้</button>${clearBtn}</div></div></div>`;
  }
  function wire(id) {
    const input = document.getElementById(id);
    if (!input || input.dataset.tdpWired) return;
    input.dataset.tdpWired = 'true';
    const trigger = document.getElementById(id + 'Trigger');
    const displayText = document.getElementById(id + 'DisplayText');
    const popover = document.getElementById(id + 'CalendarPopover');
    const monthSel = document.getElementById(id + 'TcMonth');
    const yearSel = document.getElementById(id + 'TcYear');
    const daysWrap = document.getElementById(id + 'TcDays');
    const prevBtn = document.getElementById(id + 'TcPrev');
    const nextBtn = document.getElementById(id + 'TcNext');
    const todayBtn = document.getElementById(id + 'TcToday');
    const clearBtn = document.getElementById(id + 'TcClear');
    if (!trigger || !popover || !monthSel || !yearSel || !daysWrap) return;
    const placeholder = input.dataset.tdpPlaceholder || 'เลือกวันที่';
    const view = { year: new Date().getFullYear(), month: new Date().getMonth() };
    function updateDisplay() {
      displayText.textContent = formatThaiBE(input.value) || placeholder;
    }
    function initSelects() {
      monthSel.replaceChildren(...THAI_MONTH_NAMES.map((name, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = name; return o }));
      const currentBEYear = new Date().getFullYear() + 543;
      const years = []; for (let y = currentBEYear + 5; y >= currentBEYear - 100; y--) years.push(y);
      yearSel.replaceChildren(...years.map(beYear => { const o = document.createElement('option'); o.value = String(beYear - 543); o.textContent = String(beYear); return o }));
      monthSel.addEventListener('change', () => { view.month = Number(monthSel.value); renderCalendar() });
      yearSel.addEventListener('change', () => { view.year = Number(yearSel.value); renderCalendar() });
    }
    function renderCalendar() {
      monthSel.value = String(view.month);
      yearSel.value = String(view.year);
      const firstWeekday = new Date(view.year, view.month, 1).getDay();
      const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
      const selectedISO = input.value;
      const nowISO = todayISO();
      const cells = [];
      for (let i = 0; i < firstWeekday; i++) cells.push('<span></span>');
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = isoOf(view.year, view.month, d);
        const cls = ['tc-day'];
        if (iso === nowISO) cls.push('tc-day-today');
        if (iso === selectedISO) cls.push('tc-day-selected');
        cells.push(`<button type="button" class="${cls.join(' ')}" data-iso="${iso}">${d}</button>`);
      }
      daysWrap.innerHTML = cells.join('');
      daysWrap.querySelectorAll('[data-iso]').forEach(btn => btn.addEventListener('click', () => selectDate(btn.dataset.iso)));
    }
    function selectDate(iso) {
      input.value = iso;
      updateDisplay();
      closePicker();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function changeMonth(delta) {
      view.month += delta;
      if (view.month < 0) { view.month = 11; view.year-- }
      if (view.month > 11) { view.month = 0; view.year++ }
      renderCalendar();
    }
    function onDocClick(evt) { if (!evt.target.closest(`[data-tdp-id="${id}"]`)) closePicker() }
    function openPicker() {
      if (trigger.disabled) return;
      const existing = input.value;
      const base = existing ? new Date(existing + 'T00:00:00') : new Date();
      view.year = base.getFullYear(); view.month = base.getMonth();
      renderCalendar();
      popover.classList.remove('ws-hidden');
      document.addEventListener('click', onDocClick);
    }
    function closePicker() {
      popover.classList.add('ws-hidden');
      document.removeEventListener('click', onDocClick);
    }
    function togglePicker() { popover.classList.contains('ws-hidden') ? openPicker() : closePicker() }
    prevBtn?.addEventListener('click', () => changeMonth(-1));
    nextBtn?.addEventListener('click', () => changeMonth(1));
    todayBtn?.addEventListener('click', () => { const t = new Date(); view.year = t.getFullYear(); view.month = t.getMonth(); selectDate(todayISO()) });
    clearBtn?.addEventListener('click', () => { input.value = ''; updateDisplay(); closePicker(); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })) });
    trigger.addEventListener('click', evt => { evt.stopPropagation(); togglePicker() });
    initSelects();
    updateDisplay();
  }
  function wireAll(root) {
    (root || document).querySelectorAll('.thai-date-field[data-tdp-id]').forEach(field => wire(field.dataset.tdpId));
  }
  global.ThaiDatePicker = { html, wireAll, formatThaiBE };
})(window);
