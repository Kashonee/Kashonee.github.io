'use strict';
(() => {
  const stages = Array.from(document.querySelectorAll('.stage'));
  const stageButtons = Array.from(document.querySelectorAll('[data-stage]'));
  const routeButtons = Array.from(document.querySelectorAll('[data-defense-route]'));
  const previous = document.getElementById('previousStage');
  const next = document.getElementById('nextStage');
  const counter = document.getElementById('stageCounter');
  const announcement = document.getElementById('stageAnnouncement');
  const speedInput = document.getElementById('defenseSpeed');
  const speedOutput = document.getElementById('defenseSpeedValue');
  const fullscreenButton = document.getElementById('fullscreenToggle');
  const fullscreenLabel = document.getElementById('fullscreenLabel');
  const fullscreenStatus = document.getElementById('fullscreenStatus');
  const root = document.documentElement;
  const routeIds = ['short', 'medium', 'long'];
  const labels = ['Мақсат', 'Модель', 'Масштаб', 'Салыстыру', 'Қорытынды'];
  let current = 0;

  function showStage(index, focus = true) {
    const requested = Number(index);
    current = Number.isFinite(requested) ? Math.max(0, Math.min(stages.length - 1, Math.trunc(requested))) : 0;
    stages.forEach((stage, i) => {
      stage.hidden = i !== current;
      stage.classList.toggle('is-entering', i === current);
    });
    stageButtons.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('is-complete', i < current);
    });
    previous.disabled = current === 0;
    next.disabled = current === stages.length - 1;
    counter.textContent = (current + 1) + ' / ' + stages.length;
    announcement.textContent = (current + 1) + ' / ' + stages.length + '. ' + labels[current];
    document.title = labels[current] + ' — Жобаны қорғау · Silk Road Travel';
    const hash = '#' + stages[current].id;
    if (location.hash !== hash) {
      try { history.replaceState(null, '', hash); } catch (_) { /* Navigation still works when history is restricted. */ }
    }
    if (focus) {
      stages[current].focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function stageFromHash() {
    const index = stages.findIndex(stage => '#' + stage.id === location.hash);
    showStage(index < 0 ? 0 : index, false);
  }

  function selectRoute(id) {
    const route = presets[id];
    const link=document.getElementById('defenseRoadLink');if(link)link.href=SRT.href('map.html',{...SRT.state,kind:id,visit:null});
    if (!route) return;
    routeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.defenseRoute === id)));
    document.getElementById('scopeDays').textContent = String(route.days);
    document.getElementById('scopeDistance').textContent = String(route.distance);
    document.getElementById('scopeCities').textContent = String(route.cities);
    document.getElementById('scopePath').textContent = route.detail;
    document.getElementById('scopeWarning').textContent = route.warning;
  }

  function renderComparison() {
    const speed = Math.max(40, Math.min(80, Number(speedInput.value) || 55));
    speedOutput.innerHTML = speed + ' <span>км/сағ</span>';
    speedInput.setAttribute('aria-valuetext', speed + ' км/сағ');
    const maximum = Math.max(...routeIds.map(id => presets[id].distance));
    document.getElementById('comparisonChart').innerHTML = routeIds.map(id => {
      const route = presets[id];
      const width = (route.distance / maximum * 100).toFixed(2);
      return '<div class="compare-row"><div class="compare-label"><b>' + route.days + ' күн <span>· ' + route.cities + ' орталық</span></b><strong>' + route.distance + ' км</strong></div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="--bar-width:' + width + '%"></div></div><p class="compare-time">Таза жүріс: <strong>' + fmtHours(route.distance / speed) + '</strong></p></div>';
    }).join('');
  }

  stageButtons.forEach(button => button.addEventListener('click', () => showStage(button.dataset.stage)));
  previous.addEventListener('click', () => showStage(current - 1));
  next.addEventListener('click', () => showStage(current + 1));
  routeButtons.forEach(button => button.addEventListener('click', () => selectRoute(button.dataset.defenseRoute)));
  speedInput.addEventListener('input', renderComparison);
  window.addEventListener('hashchange', stageFromHash);
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"]'))) return;
    const space = event.key === ' ' || event.key === 'Spacebar';
    if (space && target && target.closest('button, a, summary, [role="button"]')) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || space) { event.preventDefault(); showStage(current + 1); }
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); showStage(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); showStage(0); }
    else if (event.key === 'End') { event.preventDefault(); showStage(stages.length - 1); }
  });

  const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
  function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function updateFullscreen() {
    const active = Boolean(fullscreenElement());
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenLabel.textContent = active ? 'Экранды кішірейту' : 'Толық экран';
  }
  if (requestFullscreen && exitFullscreen && document.fullscreenEnabled !== false && document.webkitFullscreenEnabled !== false) {
    fullscreenButton.hidden = false;
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (fullscreenElement()) await exitFullscreen.call(document);
        else await requestFullscreen.call(root);
        fullscreenStatus.textContent = '';
      } catch (_) {
        fullscreenStatus.textContent = 'Толық экран қолжетімсіз. Таныстырылымды осы терезеде жалғастыра аласыз.';
      }
      updateFullscreen();
    });
    document.addEventListener('fullscreenchange', updateFullscreen);
    document.addEventListener('webkitfullscreenchange', updateFullscreen);
  }

  document.getElementById('cityModel').innerHTML = cities.map(city => '<article><h2>' + city.name + '</h2><p>' + city.site + '</p></article>').join('');
  selectRoute('short');
  renderComparison();
  stageFromHash();
})();

