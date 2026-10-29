/* Presentation behaviour only. Route, map and research data stay in their modules. */
(function () {
  'use strict';
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('menuToggle');
  if (nav && toggle) {
    const mobile = window.matchMedia('(max-width: 1050px)');
    const sync = () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-label', open ? 'Мәзірді жабу' : 'Мәзірді ашу');
      // display:none also removes the closed menu from the keyboard sequence.
      nav.inert = mobile.matches && !open;
    };
    const close = (restoreFocus) => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      sync();
      if (restoreFocus) toggle.focus();
    };
    // The base app owns the open/close click; this runs immediately afterwards.
    toggle.addEventListener('click', sync);
    nav.addEventListener('click', e => { if (e.target.closest('a')) sync(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
    });
    document.addEventListener('click', e => {
      if (mobile.matches && !nav.contains(e.target) && !toggle.contains(e.target)) close(false);
    });
    document.addEventListener('focusin', e => {
      if (mobile.matches && !nav.contains(e.target) && !toggle.contains(e.target)) close(false);
    });
    mobile.addEventListener('change', () => close(false));
    sync();
  }

  // Complete keyboard interaction for the existing route tab group.
  const tabs = Array.from(document.querySelectorAll('.segmented [role="tab"]'));
  if (tabs.length) {
    const syncTabs = () => tabs.forEach(tab => { tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    tabs.forEach((tab, index) => tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      e.preventDefault();
      tabs[next].click();
      tabs[next].focus();
      syncTabs();
    }));
    document.addEventListener('click', e => { if (e.target.closest('.segmented [role="tab"]')) syncTabs(); });
    syncTabs();
  }
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const syncFilters = () => filters.forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
  document.addEventListener('click', e => { if (e.target.closest('[data-filter]')) syncFilters(); });
  syncFilters();

  // A failed third-party image keeps its caption and source link usable.
  document.querySelectorAll('.editorial-photo img, .feature-image img').forEach(img => {
    const failed = () => {
      const holder = img.closest('.editorial-photo, .feature-image');
      if (!holder || holder.querySelector('.image-unavailable')) return;
      img.hidden = true;
      const message = document.createElement('span');
      message.className = 'image-unavailable';
      message.textContent = 'Фотосурет жүктелмеді';
      holder.append(message);
    };
    img.addEventListener('error', failed);
    if (img.complete && img.naturalWidth === 0) failed();
  });
})();
