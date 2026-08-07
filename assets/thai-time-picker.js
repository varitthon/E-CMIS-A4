/* Shared 24-hour wheel time picker — reuses the .thai-time-field / .time-picker-popover /
 * .tp-* markup+CSS already shipped for the incident date/time widget (complaint-form.html,
 * staff-intake.html). Any page that loads this script gets window.ThaiTimePicker = { html, wireAll }.
 * Value format stored in the hidden input: "HH:MM" (24-hour, zero-padded) or '' when unset.
 */
(function (global) {
  const pad2 = n => String(n).padStart(2, '0');
  const WHEEL_ITEM_HEIGHT = 38;
  const attrEscape = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  function formatDisplay(value) {
    if (!value) return '';
    const [h, m] = value.split(':');
    if (h === undefined || m === undefined) return '';
    return `${h} : ${m} น.`;
  }
  function html(id, opts = {}) {
    const value = opts.value || '';
    const placeholder = opts.placeholder || 'เลือกเวลา';
    const title = opts.title || 'เลือกเวลา';
    const disabledAttr = opts.disabled ? ' disabled' : '';
    const clearBtn = opts.clearable === false ? '' : `<button type="button" class="tp-btn tp-btn-ghost" id="${id}Clear">ล้างค่า</button>`;
    return `<div class="thai-time-field" data-tdp-time-id="${id}"><button type="button" class="thai-time-trigger" id="${id}Trigger"${disabledAttr}><span id="${id}DisplayText"></span><span class="thai-time-badge">24 ชม.</span></button><input type="hidden" id="${id}"${opts.name ? ` name="${attrEscape(opts.name)}"` : ''} value="${attrEscape(value)}" data-tdp-time-placeholder="${attrEscape(placeholder)}"><div class="time-picker-popover ws-hidden" id="${id}Popover" role="dialog" aria-label="เลือกเวลา (24 ชั่วโมง)"><div class="tp-title">${attrEscape(title)} <span class="tp-24-badge">24 ชม.</span></div><div class="tp-manual-entry"><input type="text" inputmode="numeric" maxlength="2" class="tp-manual-input" id="${id}HourInput" aria-label="พิมพ์ชั่วโมง"><span class="tp-manual-colon">:</span><input type="text" inputmode="numeric" maxlength="2" class="tp-manual-input" id="${id}MinuteInput" aria-label="พิมพ์นาที"><span class="tp-manual-unit">น.</span></div><div class="tp-wheels"><div class="tp-wheel-highlight"></div><div class="tp-wheel-wrap"><div class="tp-wheel-col" id="${id}HourWheel"><div class="tp-wheel-track" id="${id}HourTrack"></div></div><div class="tp-wheel-fade tp-wheel-fade-top"></div><div class="tp-wheel-fade tp-wheel-fade-bottom"></div></div><div class="tp-wheel-colon">:</div><div class="tp-wheel-wrap"><div class="tp-wheel-col" id="${id}MinuteWheel"><div class="tp-wheel-track" id="${id}MinuteTrack"></div></div><div class="tp-wheel-fade tp-wheel-fade-top"></div><div class="tp-wheel-fade tp-wheel-fade-bottom"></div></div><div class="tp-wheel-unit">น.</div></div><div class="tp-actions"><button type="button" class="tp-btn tp-btn-ghost" id="${id}Dismiss">ปิดตัวเลือก</button>${clearBtn}<button type="button" class="tp-btn tp-btn-primary" id="${id}Confirm">ยืนยันการเลือก</button></div></div></div>`;
  }
  function wire(id) {
    const input = document.getElementById(id);
    if (!input || input.dataset.tdpTimeWired) return;
    input.dataset.tdpTimeWired = 'true';
    const trigger = document.getElementById(id + 'Trigger');
    const displayText = document.getElementById(id + 'DisplayText');
    const popover = document.getElementById(id + 'Popover');
    const hourInput = document.getElementById(id + 'HourInput');
    const minuteInput = document.getElementById(id + 'MinuteInput');
    const hourWheelEl = document.getElementById(id + 'HourWheel');
    const hourTrackEl = document.getElementById(id + 'HourTrack');
    const minuteWheelEl = document.getElementById(id + 'MinuteWheel');
    const minuteTrackEl = document.getElementById(id + 'MinuteTrack');
    const dismissBtn = document.getElementById(id + 'Dismiss');
    const confirmBtn = document.getElementById(id + 'Confirm');
    const clearBtn = document.getElementById(id + 'Clear');
    if (!trigger || !popover || !hourWheelEl || !minuteWheelEl) return;
    const placeholder = input.dataset.tdpTimePlaceholder || 'เลือกเวลา';
    const state = { hour: null, minute: null };
    function updateDisplay() {
      displayText.textContent = formatDisplay(input.value) || placeholder;
    }
    function initWheel(colEl, trackEl, count, onChange) {
      trackEl.replaceChildren();
      for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'tp-wheel-item'; item.textContent = pad2(i); item.dataset.value = String(i);
        trackEl.appendChild(item);
      }
      const items = trackEl.children;
      let dragging = false, moved = false, startY = 0, startScroll = 0, scrollEndTimer = null;
      function nearestIndex() { return Math.max(0, Math.min(count - 1, Math.round(colEl.scrollTop / WHEEL_ITEM_HEIGHT))) }
      function highlightActive() { const idx = nearestIndex(); for (let i = 0; i < items.length; i++) items[i].classList.toggle('active', i === idx); return idx }
      function snapTo(index, smooth) { colEl.scrollTo({ top: Math.max(0, Math.min(count - 1, index)) * WHEEL_ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' }) }
      colEl.addEventListener('scroll', () => {
        onChange(highlightActive(), false);
        if (dragging) return;
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => { const idx = nearestIndex(); snapTo(idx, true); onChange(idx, true) }, 120);
      });
      colEl.addEventListener('pointerdown', evt => {
        dragging = true; moved = false; startY = evt.clientY; startScroll = colEl.scrollTop;
        colEl.classList.add('dragging'); colEl.setPointerCapture(evt.pointerId);
      });
      colEl.addEventListener('pointermove', evt => {
        if (!dragging) return;
        const dy = evt.clientY - startY; if (Math.abs(dy) > 2) moved = true;
        colEl.scrollTop = startScroll - dy;
      });
      function endDrag() {
        if (!dragging) return; dragging = false; colEl.classList.remove('dragging');
        const idx = nearestIndex(); snapTo(idx, true); onChange(idx, true);
      }
      colEl.addEventListener('pointerup', endDrag);
      colEl.addEventListener('pointercancel', endDrag);
      colEl.addEventListener('click', evt => {
        if (moved) return;
        const item = evt.target.closest('.tp-wheel-item'); if (!item) return;
        const idx = Number(item.dataset.value); snapTo(idx, true); onChange(idx, true);
      });
      return { setValue(idx, smooth) { snapTo(idx, !!smooth); highlightActive() } };
    }
    const hourWheelApi = initWheel(hourWheelEl, hourTrackEl, 24, idx => { state.hour = idx; hourInput.value = pad2(idx) });
    const minuteWheelApi = initWheel(minuteWheelEl, minuteTrackEl, 60, idx => { state.minute = idx; minuteInput.value = pad2(idx) });
    function wireManualInput(inputEl, max, wheelApi, setter, getter) {
      inputEl.addEventListener('input', () => { inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 2) });
      inputEl.addEventListener('change', () => {
        const n = parseInt(inputEl.value, 10);
        if (isNaN(n)) { inputEl.value = pad2(getter() ?? 0); return }
        const clamped = Math.max(0, Math.min(max, n));
        setter(clamped); inputEl.value = pad2(clamped); wheelApi.setValue(clamped, true);
      });
      inputEl.addEventListener('keydown', evt => { if (evt.key === 'Enter') inputEl.blur() });
    }
    wireManualInput(hourInput, 23, hourWheelApi, v => state.hour = v, () => state.hour);
    wireManualInput(minuteInput, 59, minuteWheelApi, v => state.minute = v, () => state.minute);
    function onDocClick(evt) { if (!evt.target.closest(`[data-tdp-time-id="${id}"]`)) closePicker() }
    function openPicker() {
      if (trigger.disabled) return;
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes();
      if (input.value) {
        const parts = input.value.split(':');
        if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) { h = Number(parts[0]); m = Number(parts[1]) }
      }
      state.hour = h; state.minute = m;
      hourInput.value = pad2(h); minuteInput.value = pad2(m);
      popover.classList.remove('ws-hidden');
      document.addEventListener('click', onDocClick);
      requestAnimationFrame(() => { hourWheelApi.setValue(h); minuteWheelApi.setValue(m) });
    }
    function closePicker() {
      popover.classList.add('ws-hidden');
      document.removeEventListener('click', onDocClick);
    }
    function togglePicker() { popover.classList.contains('ws-hidden') ? openPicker() : closePicker() }
    trigger.addEventListener('click', evt => { evt.stopPropagation(); togglePicker() });
    dismissBtn?.addEventListener('click', () => closePicker());
    clearBtn?.addEventListener('click', () => {
      input.value = '';
      state.hour = null; state.minute = null;
      updateDisplay();
      closePicker();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    confirmBtn?.addEventListener('click', () => {
      if (state.hour != null && state.minute != null) input.value = `${pad2(state.hour)}:${pad2(state.minute)}`;
      updateDisplay();
      closePicker();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    updateDisplay();
  }
  function wireAll(root) {
    (root || document).querySelectorAll('.thai-time-field[data-tdp-time-id]').forEach(field => wire(field.dataset.tdpTimeId));
  }
  global.ThaiTimePicker = { html, wireAll, formatDisplay };
})(window);
