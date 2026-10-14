import { rooms, demoScenes, demoExhibits, demoConfig } from './data.js';
import { curatedExhibits } from './curated.js';
import { createViewer, projectMarker } from './panorama.js';
import { initializeBackend, isConfigured, getMuseum, fileUrl } from './backend.js';
import { showAdmin } from './admin.js';

const root = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const state = { sceneId: 'hall-1', scenes: demoScenes, exhibits: curatedExhibits, config: demoConfig, portraitUrl: demoConfig.hero_image_path, started: false, map: false, sound: false, backendError: '', viewer: null, audio: null, loading: false };
let transitionId = 0;
const icons = {
  compass: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  return: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 11 12 4l9 7M5 10v10h14V10"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>',
  volume: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9zm12-1a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9zm12 1 5 5m0-5-5 5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 5 19 19M19 5 5 19"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14"/></svg>',
};
const scene = () => state.scenes.find(x => x.id === state.sceneId) || state.scenes[0] || demoScenes[0];
const room = () => rooms[scene().room_id] || rooms.hall;
const roomScene = id => state.scenes.find(s => s.room_id === id)?.id || demoScenes.find(s => s.room_id === id)?.id;
const roomExhibits = id => {
  return state.exhibits.filter(e => e.room_id === id && e.published);
};

async function loadData() {
  if (!isConfigured()) return;
  try {
    const data = await getMuseum();
    state.config = data.config?.person_name === 'Тұлға туралы музей' ? demoConfig : data.config || demoConfig;
    state.scenes = data.scenes.length ? data.scenes : demoScenes;
    state.exhibits = data.exhibits.length ? data.exhibits : curatedExhibits;
    if (state.config.hero_image_path) state.portraitUrl = await fileUrl(state.config.hero_image_path).catch(() => null);
  } catch (e) { state.backendError = `Деректер жаңартылмады: ${e.message}`; }
}

function sceneLinks() {
  return ['life','works','legacy'].map(id => `<button class="room-link ${room().name === rooms[id].name ? 'current' : ''}" data-room="${id}"><span class="room-num">${rooms[id].number}</span><span>${esc(rooms[id].name)}</span><span class="room-link-arrow">↗</span></button>`).join('');
}

function mapHTML() {
  return `<div class="map-card" role="dialog" aria-label="Музей картасы"><div class="map-heading"><span>МУЗЕЙ ЖОСПАРЫ</span><button class="plain-icon" id="close-map" aria-label="Картаны жабу">${icons.close}</button></div>
    <div class="floor-plan"><button data-room="works" class="plan-room plan-up ${room().name === rooms.works.name?'active':''}">II<span>Еңбектері</span></button>
    <button data-room="life" class="plan-room plan-left ${room().name === rooms.life.name?'active':''}">I<span>Өмір жолы</span></button>
    <button data-room="hall" class="plan-room plan-middle ${room().name === rooms.hall.name?'active':''}">⌂<span>Басты зал</span></button>
    <button data-room="legacy" class="plan-room plan-right ${room().name === rooms.legacy.name?'active':''}">III<span>Мұрасы</span></button></div>
    <p>Залға өту үшін оның атауын басыңыз</p></div>`;
}

function welcomeHTML() {
  return `<div class="welcome" id="welcome"><div class="welcome-scrim"></div><div class="welcome-content">
    <div class="eyebrow"><span class="gold-line"></span> ИНТЕРАКТИВТІ 360° МУЗЕЙ</div>
    <h1>${esc((state.config.museum_name || 'Алакөл шежіресінің шырақшысы').split(':')[0])}<span class="gold-stop">.</span></h1>
    <p class="welcome-subtitle">${esc((state.config.museum_name || '').split(':').slice(1).join(':').trim() || 'Бір ғұмыр. Өшпес із. Ұрпаққа қалған мұра.')}</p>
    <p class="welcome-note">${esc(state.config.person_name || demoConfig.person_name)} · Өмірі, еңбектері мен мұрасы сақталған отбасылық мұрағат.</p>
    <button class="primary-button" id="start-tour">Экскурсияны бастау <span>${icons.arrow}</span></button>
    <div class="welcome-hint"><span class="mouse-symbol">◎</span> 360° кеңістікті қарап шығыңыз</div>
  </div><div class="welcome-bottom">ЦИФРЛЫҚ МҰРА <span>•</span> 2026</div></div>`;
}

function render() {
  state.viewer?.destroy(); state.viewer = null;
  const s = scene(), r = room();
  document.title = `${r.name} · ${state.config.museum_name || 'Мұрагер'}`;
  root.innerHTML = `<main class="museum">
    <div class="panorama" id="panorama"><div class="marker-layer" id="markers"></div><div class="loading-indicator" id="loading"><span class="spinner"></span> Көрініс жүктелуде…</div></div>
    <div class="vignette"></div>
    <header class="topbar"><div class="brand"><div class="brand-seal">M<span>✦</span></div><div class="brand-copy"><strong>${esc((state.config.museum_name || 'Алакөл мұражайы').split(':')[0])}</strong><small>ВИРТУАЛДЫ МУЗЕЙ</small></div></div>
      <nav class="top-nav" aria-label="Негізгі бөлімдер"><button data-room="hall" class="${s.room_id==='hall'?'active':''}">Басты зал</button><button data-room="life" class="${s.room_id==='life'?'active':''}">Өмір жолы</button><button data-room="works" class="${s.room_id==='works'?'active':''}">Еңбектері</button><button data-room="legacy" class="${s.room_id==='legacy'?'active':''}">Мұрасы</button></nav>
      <div class="top-right"><span class="live-dot"></span><span>ВИРТУАЛДЫ ТУР</span><span class="top-separator"></span><a href="/admin" class="admin-link">Басқару ↗</a></div>
    </header>
    <section class="room-hero"><span class="room-kicker"><span class="gold-line"></span>${r.kicker}</span><h2>${esc(r.name)}</h2><p>${esc(r.summary)}</p>
      ${s.room_id === 'hall' ? `<div class="person-name">${esc(state.config.person_name || '')}</div><p class="person-bio">${esc(state.config.biography || '')}</p>` : ''}
      ${s.room_id === 'life' ? '<button class="timeline-open" id="timeline-open">Өмір хронологиясы ↗</button>' : ''}
      <div class="hero-rule"></div><span class="room-index">${r.number} <i>/</i> 03</span>
    </section>
    <aside class="room-panel"><div class="room-panel-heading"><span>МУЗЕЙ КЕҢІСТІГІ</span><span class="tiny-diamond">◆</span></div>${sceneLinks()}</aside>
    <div class="help-caption"><span class="hint-circle">+</span> Белгіні басып, экспонатты ашыңыз</div>
    <button class="gallery-launch" id="gallery-open" aria-label="Зал экспонаттарын ашу">МҰРАҒАТ <b>${roomExhibits(s.room_id).length}</b> <span>↗</span></button>
    <div class="bottom-bar"><div class="bottom-actions"><button class="round-button" id="zoom-in" aria-label="Жақындату" title="Жақындату">${icons.plus}</button><button class="round-button" id="zoom-out" aria-label="Алыстату" title="Алыстату">${icons.minus}</button><span class="control-divider"></span><button class="round-button ${state.sound?'selected':''}" id="sound" aria-label="Дыбысты қосу немесе өшіру" title="Фондық дыбыс">${state.sound?icons.volume:icons.mute}</button></div>
      <div class="scene-switch"><span class="scene-overline">ҚАЗІРГІ КӨРІНІС</span><strong>${esc(s.title)}</strong><span class="scene-nav">${state.scenes.filter(x=>x.room_id===s.room_id).map((x,i)=>`<button aria-label="${esc(x.title)}" data-scene="${esc(x.id)}" class="${x.id===s.id?'active':''}">${String(i+1).padStart(2,'0')}</button>`).join('')}</span></div>
      <div class="bottom-actions right"><button class="round-button" id="fullscreen" aria-label="Толық экран" title="Толық экран">${icons.expand}</button><button class="map-button" id="map-toggle">${icons.map}<span>Музей картасы</span></button></div></div>
    ${state.map ? mapHTML() : ''}
    ${state.backendError ? `<div class="error-toast" role="alert">${esc(state.backendError)}</div>` : ''}
    ${!state.started ? welcomeHTML() : ''}
  </main>`;
  root.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => goRoom(button.dataset.room)));
  root.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => goScene(button.dataset.scene)));
  root.querySelector('#start-tour')?.addEventListener('click', () => { state.started = true; root.querySelector('#welcome')?.remove(); });
  root.querySelector('#map-toggle').addEventListener('click', () => { state.map = !state.map; renderMapOnly(); });
  root.querySelector('#close-map')?.addEventListener('click', () => { state.map = false; renderMapOnly(); });
  root.querySelector('#fullscreen').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  root.querySelector('#zoom-in').addEventListener('click', () => state.viewer?.zoom(-.15));
  root.querySelector('#zoom-out').addEventListener('click', () => state.viewer?.zoom(.15));
  root.querySelector('#sound').addEventListener('click', toggleSound);
  root.querySelector('#timeline-open')?.addEventListener('click', showTimeline);
  root.querySelector('#gallery-open').addEventListener('click', () => showGallery());
  openPanorama(s);
}

function renderMapOnly() {
  root.querySelector('.map-card')?.remove();
  if (state.map) {
    root.querySelector('.museum').insertAdjacentHTML('beforeend', mapHTML());
    root.querySelector('#close-map').addEventListener('click', () => { state.map = false; renderMapOnly(); });
    root.querySelector('.map-card').querySelectorAll('[data-room]').forEach(b => b.addEventListener('click', () => goRoom(b.dataset.room)));
  }
}

async function openPanorama(s) {
  const id = ++transitionId;
  let url;
  try { url = await fileUrl(s.panorama_path || demoScenes.find(x=>x.id===s.id)?.panorama_path, false); }
  catch (error) { state.backendError = `Панорама ашылмады: ${error.message}`; url = demoScenes.find(x=>x.id===s.id)?.panorama_path || '/panoramas/hall-1.jpg'; }
  if (id !== transitionId) return;
  const parent = root.querySelector('#panorama');
  state.viewer = createViewer(parent, {
    src: url, yaw: s.initial_yaw || 0, pitch: s.initial_pitch || 0,
    onReady: () => { if (id === transitionId) root.querySelector('#loading')?.remove(); },
    onError: msg => { if (id === transitionId) { root.querySelector('#loading').textContent = msg; root.querySelector('#loading').classList.add('load-error'); } },
    onChange: view => { if (id === transitionId) renderMarkers(view); },
  });
}

function hotspots() {
  const s = scene();
  const exhibits = roomExhibits(s.room_id).filter(e=>e.scene_id===s.id && e.featured && !(s.room_id==='hall' && e.kind==='photo'));
  const arrows = s.room_id === 'hall'
    ? [ { id:'nav-life', title:'Өмір жолы', yaw:-1.5, pitch:-.38, target:roomScene('life') }, { id:'nav-works', title:'Еңбектері мен шығармашылығы', yaw:0, pitch:-.59, target:roomScene('works') }, { id:'nav-legacy', title:'Марапаттары мен мұрасы', yaw:1.5, pitch:-.38, target:roomScene('legacy') } ]
    : [ { id:'nav-hall', title:'Басты залға оралу', yaw:3.05, pitch:-.38, target:roomScene('hall') } ];
  const second = state.scenes.filter(x=>x.room_id===s.room_id).find(x=>x.id!==s.id);
  if (second) arrows.push({ id:'nav-next', title:second.title, yaw: s.id.endsWith('-1') ? .74 : -.70, pitch:-.62, target:second.id });
  const portrait = s.room_id === 'hall' && s.id === 'hall-1' && state.portraitUrl ? [{ id:'portrait-live', title:'Мәкетай Жақыпбекұлының портретін ашу', yaw:0, pitch:.12, markerType:'portrait' }] : [];
  return [...exhibits.map(e=>({ ...e, markerType:'exhibit' })), ...arrows.map(a=>({ ...a, markerType:'navigation' })), ...portrait];
}

function renderMarkers(view) {
  const layer = root.querySelector('#markers'); if (!layer) return;
  const marks = hotspots();
  const existing = new Map([...layer.querySelectorAll('[data-marker]')].map(el=>[el.dataset.marker,el]));
  for (const mark of marks) {
    const p = projectMarker(mark, view);
    let button = existing.get(mark.id); existing.delete(mark.id);
    if (!p) { button?.remove(); continue; }
    if (!button) {
      button = document.createElement('button');
      button.className = mark.markerType === 'navigation' ? 'hotspot-nav' : mark.markerType === 'portrait' ? 'panorama-portrait' : 'hotspot-exhibit';
      button.dataset.marker = mark.id;
      button.setAttribute('aria-label', mark.title);
      button.innerHTML = mark.markerType === 'navigation' ? `<span class="nav-glyph">${icons.arrow}</span><span>${esc(mark.title)}</span>` : mark.markerType === 'portrait' ? `<img alt="Тұлғаның портреті" src="${esc(state.portraitUrl)}">` : `<span class="exhibit-pulse">✦</span><span class="exhibit-label">${esc(mark.title)}</span>`;
      button.addEventListener('click', () => mark.markerType === 'navigation' ? goScene(mark.target) : showExhibit(mark.markerType === 'portrait' ? roomExhibits('hall').find(e=>e.id==='demo-1') || roomExhibits('hall')[0] : mark));
      layer.append(button);
    }
    button.style.transform = `translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`;
  }
  for (const orphan of existing.values()) orphan.remove();
}

function goRoom(id) { const target = roomScene(id); if (target) goScene(target); }
function goScene(id) {
  if (!state.scenes.some(s=>s.id===id) || (id===state.sceneId && state.started)) return;
  state.sceneId = id; state.map = false; state.started = true;
  render();
}

function showGallery(filter = 'all') {
  root.querySelector('.modal-shade')?.remove();
  const items = roomExhibits(scene().room_id);
  const visible = filter === 'all' ? items : items.filter(e => e.kind === filter);
  const options = [['all','Барлығы'],['photo','Фотосуреттер'],['book','Кітаптар'],['document','Құжаттар'],['text','Мәліметтер']]
    .filter(([kind]) => kind === 'all' || items.some(e => e.kind === kind));
  root.querySelector('.museum').insertAdjacentHTML('beforeend', `<div class="modal-shade"><div class="gallery-modal" role="dialog" aria-modal="true" aria-label="Зал экспонаттары">
    <button class="modal-close" id="close-gallery" aria-label="Жабу">${icons.close}</button><span class="eyebrow small"><span class="gold-line"></span> АРХИВ ЖИНАҒЫ</span>
    <h3>${esc(room().name)}</h3><p class="gallery-intro">${visible.length} экспонат · Суретті немесе атауды басып, материалды ашыңыз.</p>
    <div class="gallery-filters">${options.map(([kind,title])=>`<button data-filter="${kind}" class="${filter===kind?'selected':''}">${title}</button>`).join('')}</div>
    <div class="gallery-grid">${visible.map(e=>`<button class="gallery-item" data-item="${esc(e.id)}"><span class="gallery-thumb">${(e.cover_path||e.media_path?.startsWith('/') && !e.media_path.toLowerCase().endsWith('.pdf')) && (e.cover_path||e.media_path).startsWith('/') ? `<img loading="lazy" alt="" src="${esc(e.cover_path||e.media_path)}">` : `<span class="gallery-symbol">✦</span>`}</span><strong>${esc(e.title)}</strong><small>${esc(({photo:'Фотосурет',book:'Кітап',document:'Құжат',text:'Өмір дерегі'})[e.kind]||'Мәлімет')}</small></button>`).join('')}</div>
    ${!visible.length?'<p>Бұл санатта материал жоқ.</p>':''}</div></div>`);
  const shade=root.querySelector('.modal-shade');
  shade.querySelector('#close-gallery').addEventListener('click',()=>shade.remove());
  shade.addEventListener('click',e=>{if(e.target===shade)shade.remove();});
  shade.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>showGallery(b.dataset.filter)));
  shade.querySelectorAll('[data-item]').forEach(b=>b.addEventListener('click',()=>{
    const item=visible.find(e=>e.id===b.dataset.item);if(item)showExhibit(item);
  }));
  visible.forEach(item=>{
    const path=item.cover_path || item.media_path;
    if(!path || path.startsWith('/') || path.toLowerCase().endsWith('.pdf'))return;
    fileUrl(path).then(url=>{
      const thumb=[...shade.querySelectorAll('[data-item]')].find(el=>el.dataset.item===item.id)?.querySelector('.gallery-thumb');
      if(!thumb)return;
      const img=document.createElement('img');img.loading='lazy';img.alt='';img.src=url;
      img.onload=()=>{if(thumb.isConnected)thumb.replaceChildren(img);};
    }).catch(()=>{});
  });
}

function showExhibit(exhibit) {
  root.querySelector('.modal-shade')?.remove();
  const picture = (exhibit.cover_path || exhibit.media_path) && ['photo','document','book'].includes(exhibit.kind);
  root.querySelector('.museum').insertAdjacentHTML('beforeend', `<div class="modal-shade"><div class="exhibit-modal" role="dialog" aria-modal="true" aria-label="${esc(exhibit.title)}">
    <button class="modal-close" id="close-exhibit" aria-label="Жабу">${icons.close}</button>
    <div class="modal-art" id="modal-art">${picture ? '<div class="spinner"></div>' : `<div class="abstract-art ${esc(exhibit.kind)}"><span>✦</span><small>МҰРАҒАТ <b>/</b> ${esc(rooms[exhibit.room_id]?.number || '00')}</small></div>`}</div>
    <div class="modal-information"><div class="eyebrow small"><span class="gold-line"></span> ${exhibit.temporary?'УАҚЫТША ЭКСПОНАТ':'МУЗЕЙ ЭКСПОНАТЫ'}</div>
      <h3>${esc(exhibit.title)}</h3><p class="modal-description">${esc(exhibit.description || 'Сипаттама әзірге енгізілмеген.')}</p>
      <div class="exhibit-fields"><div><span>ТҮРІ</span><strong>${esc(({photo:'Фотосурет',document:'Құжат',book:'Кітап',audio:'Аудио',video:'Бейне',text:'Мәлімет'})[exhibit.kind] || 'Мәлімет')}</strong></div>
      ${exhibit.date_label?`<div><span>УАҚЫТЫ</span><strong>${esc(exhibit.date_label)}</strong></div>`:''}
      ${exhibit.location_label?`<div><span>ОРНЫ</span><strong>${esc(exhibit.location_label)}</strong></div>`:''}</div>
      ${exhibit.temporary?'<div class="temporary-note">Бұл орын нақты материал қосылғанда жаңартылады. Көрсетілген деректер тарихи факт емес.</div>':''}
      ${exhibit.source_reference?`<p class="source-reference">ДЕРЕККӨЗ: ${/^https:\/\//.test(exhibit.source_reference)?`<a href="${esc(exhibit.source_reference)}" target="_blank" rel="noopener">Алакөл аудандық орталық кітапханасы ↗</a>`:esc(exhibit.source_reference)}</p>`:''}
      <div class="media-actions" id="media-actions"></div>
    </div></div></div>`);
  const shade = root.querySelector('.modal-shade');
  const close = () => shade.remove();
  shade.addEventListener('click', e => { if(e.target===shade) close(); });
  shade.querySelector('#close-exhibit').addEventListener('click', close);
  if (exhibit.media_path || exhibit.cover_path) {
    fileUrl(exhibit.cover_path || exhibit.media_path).then(url => {
      if (!shade.isConnected) return;
      const art=shade.querySelector('#modal-art'), actions=shade.querySelector('#media-actions');
      if (exhibit.kind==='audio') art.innerHTML=`<div class="player-art">♫<audio controls src="${esc(url)}"></audio></div>`;
      else if (exhibit.kind==='video') art.innerHTML=`<video controls playsinline src="${esc(url)}"></video>`;
      else if (exhibit.media_path?.toLowerCase().endsWith('.pdf') && !exhibit.cover_path) { art.innerHTML=`<iframe title="${esc(exhibit.title)}" src="${esc(url)}"></iframe>`; actions.innerHTML=`<a target="_blank" rel="noopener" href="${esc(url)}">Сканерленген беттерді ашу ↗</a>`; }
      else if (['photo','book','document'].includes(exhibit.kind) && !/\.(docx?|odt)$/i.test(exhibit.media_path || '')) {
        art.innerHTML=`<img alt="${esc(exhibit.title)}" src="${esc(url)}">`;
        actions.innerHTML=`<a target="_blank" rel="noopener" href="${esc(url)}">Суретті үлкейту ↗</a>`;
      } else { art.innerHTML='<div class="abstract-art document"><span>▣</span></div>'; actions.innerHTML=`<a href="${esc(url)}" download>Құжатты жүктеу ↗</a>`; }
      if (exhibit.cover_path && exhibit.media_path && exhibit.cover_path !== exhibit.media_path) {
        fileUrl(exhibit.media_path).then(pdf=>{ if(shade.isConnected) actions.insertAdjacentHTML('beforeend',`<a target="_blank" rel="noopener" href="${esc(pdf)}">Сканерленген беттерді ашу ↗</a>`); }).catch(()=>{});
      }
    }).catch(e => { const art=shade.querySelector('#modal-art'); if(art) art.textContent=`Файл ашылмады: ${e.message}`; });
  }
}

function showTimeline() {
  const dated = state.exhibits.filter(e=>e.room_id==='life' && e.published && e.date_label).sort((a,b)=>String(a.date_label).localeCompare(String(b.date_label),'kk'));
  root.querySelector('.modal-shade')?.remove();
  root.querySelector('.museum').insertAdjacentHTML('beforeend', `<div class="modal-shade"><div class="timeline-modal" role="dialog" aria-modal="true" aria-label="Өмір хронологиясы"><button class="modal-close" id="close-timeline" aria-label="Жабу">${icons.close}</button><span class="eyebrow small"><span class="gold-line"></span> ӨМІР БЕЛЕСТЕРІ</span><h3>Өмір хронологиясы</h3>
    ${dated.length ? `<div class="timeline-events">${dated.map(e=>`<button data-timeline="${esc(e.id)}"><time>${esc(e.date_label)}</time><span><strong>${esc(e.title)}</strong><small>${esc(e.description||'')}</small></span><b>↗</b></button>`).join('')}</div>` : `<div class="timeline-empty">Тұлғаның өміріндегі оқиғалар расталған мерзімдер қосылғаннан кейін осында көрсетіледі.</div>`}</div></div>`);
  const shade=root.querySelector('.modal-shade');
  shade.querySelector('#close-timeline').addEventListener('click',()=>shade.remove());
  shade.addEventListener('click',e=>{if(e.target===shade)shade.remove();});
  shade.querySelectorAll('[data-timeline]').forEach(button=>button.addEventListener('click',()=>{const e=dated.find(x=>x.id===button.dataset.timeline);if(e)showExhibit(e);}));
}

function toggleSound() {
  state.sound = !state.sound;
  const button=root.querySelector('#sound');
  button.innerHTML=state.sound?icons.volume:icons.mute;
  button.classList.toggle('selected',state.sound);
  if (state.sound) {
    const ctx = state.audio?.ctx || new AudioContext();
    if (!state.audio) {
      const gain=ctx.createGain(); gain.gain.value=.012; gain.connect(ctx.destination);
      const notes=[110,164.81,220].map(freq=>{ const osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=freq; osc.connect(gain); osc.start(); return osc; });
      state.audio={ctx,gain,notes};
    }
    ctx.resume();
  } else state.audio?.ctx.suspend();
}

document.addEventListener('keydown', e => { if (e.key==='Escape') { root.querySelector('.modal-shade')?.remove(); if(state.map){ state.map=false; renderMapOnly(); } } });
await initializeBackend();
if (location.pathname.startsWith('/admin')) showAdmin(root, { esc, icons, onReturn: () => { history.pushState({}, '', '/'); loadData().then(render); } });
else { await loadData(); render(); }
window.addEventListener('popstate', () => location.reload());
