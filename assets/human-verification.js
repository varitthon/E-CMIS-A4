(() => {
  const states = new Map();
  const containers = new Map();
  const normalizeKey = key => String(key || '').trim();
  const render = container => {
    const key = normalizeKey(container.dataset.humanVerification);
    if (!key || container.dataset.humanVerificationReady) return;
    container.dataset.humanVerificationReady = 'true';
    container.classList.add('human-verification');
    container.innerHTML = `<button type="button" class="human-verification__button" aria-pressed="false" aria-describedby="human-verification-feedback-${key}"><span class="human-verification__check" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="human-verification__label">ฉันไม่ใช่โปรแกรมอัตโนมัติ</span><span class="human-verification__brand"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.8"/><path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>PACC Verify</span></span></button><p class="human-verification__feedback" id="human-verification-feedback-${key}" aria-live="polite"></p>`;
    containers.set(key, container);
    const button = container.querySelector('button');
    button.addEventListener('click', () => {
      if (states.get(key) || button.classList.contains('is-loading')) return;
      button.classList.add('is-loading');
      button.querySelector('.human-verification__label').textContent = 'กำลังตรวจสอบ...';
      container.querySelector('.human-verification__feedback').textContent = '';
      setTimeout(() => {
        states.set(key, true);
        button.classList.remove('is-loading');
        button.setAttribute('aria-pressed', 'true');
        button.querySelector('.human-verification__label').textContent = 'ยืนยันตัวตนสำเร็จ';
      }, 650);
    });
  };
  const mount = root => root.querySelectorAll('[data-human-verification]').forEach(render);
  const requireVerification = (key, message = 'กรุณายืนยันว่าไม่ใช่โปรแกรมอัตโนมัติก่อนดำเนินการ') => {
    key = normalizeKey(key);
    if (states.get(key)) return true;
    const container = containers.get(key) || document.querySelector(`[data-human-verification="${CSS.escape(key)}"]`);
    if (container) {
      render(container);
      container.querySelector('.human-verification__feedback').textContent = message;
      container.querySelector('button').focus();
    }
    return false;
  };
  const reset = key => {
    key = normalizeKey(key);
    states.set(key, false);
    const container = containers.get(key);
    if (!container) return;
    const button = container.querySelector('button');
    button.classList.remove('is-loading');
    button.setAttribute('aria-pressed', 'false');
    button.querySelector('.human-verification__label').textContent = 'ฉันไม่ใช่โปรแกรมอัตโนมัติ';
    container.querySelector('.human-verification__feedback').textContent = '';
  };
  window.PACCHumanVerification = { mount, isVerified: key => Boolean(states.get(normalizeKey(key))), require: requireVerification, reset };
  addEventListener('DOMContentLoaded', () => mount(document));
})();
