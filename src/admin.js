import { rooms, demoScenes } from './data.js';
import { createViewer } from './panorama.js';
import { isConfigured, isAuthenticated, signIn, signOut, getMuseum, fileUrl, saveRecord, removeExhibit, upload, removeFile, saveConfig } from './backend.js';

export function showAdmin(root, { esc, icons, onReturn }) {
  let tab = 'exhibits';
  let model = { config: {}, scenes: demoScenes, exhibits: [] };
  let selected = null, editing = null, preview = null, working = false;
  const returnLink = `<a class="admin-return" href="/">← Музейге оралу</a>`;
  function alertMessage(message, error = false) {
    const slot = root.querySelector('#admin-notice');
    if (slot) { slot.textContent = message; slot.className = `admin-notice ${error?'bad':'good'}`; }
  }
  function layout(content) {
    preview?.destroy(); preview = null;
    root.innerHTML = `<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo">M<span>✦</span> <strong>Мұрагер</strong></div><div class="admin-side-label">БАСҚАРУ ПАНЕЛІ</div>
      <nav><button data-tab="exhibits" class="${tab==='exhibits'?'active':''}">▦ <span>Экспонаттар</span></button><button data-tab="panoramas" class="${tab==='panoramas'?'active':''}">◎ <span>Панорамалар</span></button><button data-tab="settings" class="${tab==='settings'?'active':''}">⚙ <span>Музей туралы</span></button></nav>
      <div class="admin-side-bottom">${returnLink}<button id="logout">Шығу →</button></div></aside>
      <main class="admin-main"><header class="admin-top"><span>МУЗЕЙ БАСҚАРМАСЫ <b>/</b> ${tab==='exhibits'?'Экспонаттар':tab==='panoramas'?'Панорамалар':'Музей туралы'}</span><span class="admin-status"><i></i> Әкімші</span></header>
      <div class="admin-content"><div id="admin-notice" role="status"></div>${content}</div></main></div>`;
    root.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click', () => { tab=el.dataset.tab; selected=null; render(); }));
    root.querySelector('#logout').addEventListener('click', async () => { await signOut(); loginPage(); });
  }
  function setupPage() {
    root.innerHTML = `<div class="admin-auth"><div class="auth-panel"><div class="auth-mark">M<span>✦</span></div><span class="section-eyebrow">МУЗЕЙ БАСҚАРУ</span><h1>Дерекқорды қосу</h1><p>Қорғалған әкімшілік панельді ашу үшін Supabase жобасын қосыңыз.</p><ol><li><code>supabase/schema.sql</code> файлын Supabase SQL Editor арқылы орындаңыз.</li><li>Алғашқы әкімшіні Auth жүйесінде жасаңыз және нұсқаулық бойынша оған рұқсат беріңіз.</li><li><code>public/config.local.example.json</code> көшірмесін <code>public/config.local.json</code> деп сақтап, жоба URL мекенжайы мен publishable key енгізіңіз.</li></ol><p>Тек жариялауға арналған кілтті пайдаланыңыз. Құпия қызмет кілтін браузерге енгізбеңіз.</p>${returnLink}</div></div>`;
  }
  function loginPage() {
    if (!isConfigured()) return setupPage();
    root.innerHTML=`<div class="admin-auth"><div class="auth-panel"><div class="auth-mark">M<span>✦</span></div><span class="section-eyebrow">МУЗЕЙ БАСҚАРУ</span><h1>Қош келдіңіз</h1><p>Экспонаттарды басқару үшін әкімші тіркелгісімен кіріңіз.</p>
      <form id="login-form"><label>Электрондық пошта<input name="email" type="email" autocomplete="username" required placeholder="email@example.com"></label><label>Құпиясөз<input name="password" type="password" autocomplete="current-password" required placeholder="••••••••"></label><button class="admin-submit" type="submit">Кіру →</button></form><p class="form-error" id="login-error" role="alert"></p>${returnLink}</div></div>`;
    root.querySelector('#login-form').addEventListener('submit', async e=>{
      e.preventDefault(); const form=e.currentTarget; const button=form.querySelector('button'); button.disabled=true; button.textContent='Тексерілуде…';
      try { await signIn(form.email.value, form.password.value); await load(); render(); }
      catch(err) { root.querySelector('#login-error').textContent=err.message; button.disabled=false; button.textContent='Кіру →'; }
    });
  }
  async function load() { model=await getMuseum(true); if(!model.scenes.length) model.scenes=demoScenes; }
  async function start() { if(!isConfigured()) return setupPage(); if(!isAuthenticated()) return loginPage(); try { await load(); render(); } catch(e) { await signOut(); loginPage(); const target=root.querySelector('#login-error'); if(target) target.textContent=e.message; } }
  function render() { if(tab==='exhibits') exhibitsPage(); else if(tab==='panoramas') panoramasPage(); else settingsPage(); }
  const roomOptions = selectedRoom => Object.entries(rooms).map(([id,r])=>`<option value="${id}" ${selectedRoom===id?'selected':''}>${esc(r.name)}</option>`).join('');
  function exhibitsPage() {
    const items = model.exhibits.slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    layout(`<div class="admin-title-row"><div><span class="section-eyebrow">ҚОРДАҒЫ МАТЕРИАЛДАР</span><h1>Экспонаттар</h1><p>Фотосуреттер, құжаттар, кітаптар және медиаматериалдар.</p></div><button id="add-exhibit" class="admin-submit">+ Жаңа экспонат</button></div>
      <div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>АТАУЫ</th><th>ЗАЛ</th><th>ТҮРІ</th><th>МӘРТЕБЕСІ</th><th></th></tr></thead><tbody>
      ${items.map(item=>`<tr><td><span class="table-square">${({photo:'▧',document:'▤',book:'▥',audio:'♫',video:'▷',text:'☷'})[item.kind]||'✦'}</span><strong>${esc(item.title)}</strong></td><td>${esc(rooms[item.room_id]?.name||'—')}</td><td>${esc(({photo:'Фотосурет',document:'Құжат',book:'Кітап',audio:'Аудио',video:'Бейне',text:'Мәлімет'})[item.kind]||item.kind)}</td><td><span class="status-pill ${item.published?'is-public':''}">${item.published?'Жарияланған':'Жоба'}</span></td><td><button class="table-edit" data-edit="${esc(item.id)}">Өңдеу ↗</button></td></tr>`).join('') || `<tr><td colspan="5" class="empty-row">Әзірге экспонат жоқ. Алғашқы материалды қосыңыз.</td></tr>`}</tbody></table></div></div>`);
    root.querySelector('#add-exhibit').addEventListener('click', () => { editing=null; editorPage(); });
    root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', () => { editing=model.exhibits.find(x=>x.id===b.dataset.edit); editorPage(); }));
  }
  function editorPage() {
    const item=editing||{};
    selected=item.scene_id || model.scenes.find(x=>x.room_id===(item.room_id||'hall'))?.id || 'hall-1';
    layout(`<div class="editor-heading"><button id="editor-back" class="text-back">← Экспонаттар тізімі</button><h1>${editing?'Экспонатты өңдеу':'Жаңа экспонат'}</h1><p>Файлды қосып, экспонаттың залдағы орнын белгілеңіз.</p></div>
      <form id="exhibit-form" class="editor-grid"><div class="form-card"><h2>Негізгі мәліметтер</h2>
      <label>Экспонат атауы *<input required name="title" value="${esc(item.title||'')}" placeholder="Мысалы: Қолжазба"></label>
      <label>Қысқаша сипаттама<textarea name="description" rows="4" placeholder="Дереккөзге сүйенген сипаттама">${esc(item.description||'')}</textarea></label>
      <div class="two-cols"><label>Зал<select id="editor-room" name="room_id">${roomOptions(item.room_id||'hall')}</select></label>
      <label>Материал түрі<select name="kind">${['photo','document','book','audio','video','text'].map((kind,i)=>`<option value="${kind}" ${item.kind===kind?'selected':''}>${['Фотосурет','Құжат','Кітап','Аудио','Бейне','Мәлімет'][i]}</option>`).join('')}</select></label></div>
      <div class="two-cols"><label>Мерзімі (егер белгілі болса)<input name="date_label" value="${esc(item.date_label||'')}" placeholder="Расталған жыл"></label><label>Орын (егер белгілі болса)<input name="location_label" value="${esc(item.location_label||'')}" placeholder="Расталған орын"></label></div>
      <label>Дереккөз / архив сілтемесі<input name="source_reference" value="${esc(item.source_reference||'')}" placeholder="Бастапқы файл, қор немесе сипаттама"></label>
      <label>Медиафайл <small>Фото, PDF, Word, аудио немесе бейне · 50 МБ дейін</small><input type="file" name="media" accept="image/*,.pdf,.doc,.docx,.odt,audio/*,video/*"></label>
      <label>Мұқаба немесе құжаттың қауіпсіз алдын ала көрінісі <small>Кітапқа PDF жүктегенде мұқаба суретін бөлек таңдаңыз.</small><input type="file" name="cover" accept="image/jpeg,image/png,image/webp"></label>
      ${item.media_path?`<div class="attached">✓ Тіркелген файл: ${esc(item.media_path.split('/').at(-1))}</div>`:''}
      <div class="two-cols"><label>Рет саны<input name="sort_order" type="number" min="0" value="${item.sort_order??0}"></label><label class="checkbox-label"><input name="published" type="checkbox" ${item.published?'checked':''}> Жариялау</label></div>
      <label class="checkbox-label"><input name="featured" type="checkbox" ${item.featured??true?'checked':''}> Панорамада белгі көрсету</label></div>
      <div class="form-card position-card"><h2>Панорамадағы орны</h2><p>Көріністі айналдырып, қажетті жерді басыңыз. Белгі сол жерге қойылады.</p>
      <label>Көрініс<select name="scene_id" id="editor-scene">${model.scenes.filter(x=>x.room_id===(item.room_id||'hall')).map(x=>`<option value="${esc(x.id)}" ${selected===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>
      <div class="admin-preview" id="admin-preview"><span class="preview-loading">Панорама жүктелуде…</span><span class="preview-pin" id="preview-pin">✦</span></div>
      <div class="two-cols"><label>Горизонталь бұрышы, рад<input name="yaw" type="number" step="0.001" min="-3.142" max="3.142" value="${item.yaw??0}"></label><label>Тік бұрышы, рад<input name="pitch" type="number" step="0.001" min="-1.57" max="1.57" value="${item.pitch??0}"></label></div>
      <div class="form-actions"><button class="admin-submit" type="submit" id="save-exhibit">Сақтау →</button>${editing?`<button type="button" class="danger-button" id="delete-exhibit">Жою</button>`:''}</div></div></form>`);
    const form=root.querySelector('#exhibit-form');
    root.querySelector('#editor-back').addEventListener('click',()=>{editing=null;exhibitsPage();});
    root.querySelector('#editor-room').addEventListener('change',e=>{
      const sceneSelect=root.querySelector('#editor-scene');
      sceneSelect.innerHTML=model.scenes.filter(x=>x.room_id===e.target.value).map(x=>`<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');
      selected=sceneSelect.value; loadPreview();
    });
    root.querySelector('#editor-scene').addEventListener('change',e=>{selected=e.target.value;loadPreview();});
    loadPreview();
    form.addEventListener('submit',async e=>{
      e.preventDefault(); if(working) return;
      working=true;const btn=root.querySelector('#save-exhibit');btn.disabled=true;btn.textContent='Сақталуда…';
      let newPath, newCover;
      try {
        const f=new FormData(form); const media=f.get('media');
        if(media?.size) { if(media.size>50*1024*1024) throw new Error('Файл 50 МБ-тан аспауы керек.'); newPath=await upload(media,'exhibits'); }
        const cover=f.get('cover');if(cover?.size){if(cover.size>20*1024*1024)throw new Error('Мұқаба 20 МБ-тан аспауы керек.');newCover=await upload(cover,'covers');}
        const data={ title:String(f.get('title')).trim(),description:String(f.get('description')||'').trim(),kind:f.get('kind'),room_id:f.get('room_id'),scene_id:f.get('scene_id'),
          date_label:String(f.get('date_label')||'').trim()||null,location_label:String(f.get('location_label')||'').trim()||null,source_reference:String(f.get('source_reference')||'').trim()||null,
          yaw:Number(f.get('yaw'))||0,pitch:Number(f.get('pitch'))||0,sort_order:Number(f.get('sort_order'))||0,published:f.get('published')==='on',featured:f.get('featured')==='on',
          ...newPath?{media_path:newPath}:{},...newCover?{cover_path:newCover}:{}};
        if(!data.title) throw new Error('Экспонат атауын енгізіңіз.');
        await saveRecord('exhibits',data,editing?.id||null);
        await load(); editing=null; exhibitsPage(); alertMessage('Экспонат сәтті сақталды.');
      } catch(err) { if(newPath) await removeFile(newPath).catch(()=>{});if(newCover)await removeFile(newCover).catch(()=>{}); alertMessage(err.message,true); btn.disabled=false;btn.textContent='Сақтау →'; }
      finally { working=false; }
    });
    root.querySelector('#delete-exhibit')?.addEventListener('click',async()=>{
      if(!confirm('Экспонатты біржола жою керек пе?')) return;
      try { const oldPath=editing.media_path; await removeExhibit(editing.id); if(oldPath) await removeFile(oldPath).catch(()=>{}); await load(); editing=null; exhibitsPage(); alertMessage('Экспонат жойылды.'); }
      catch(err){alertMessage(err.message,true);}
    });
  }
  async function loadPreview() {
    preview?.destroy(); preview=null;
    const el=root.querySelector('#admin-preview'); if(!el)return;
    el.querySelector('canvas')?.remove();
    const scene=model.scenes.find(x=>x.id===selected); if(!scene)return;
    const pin=el.querySelector('#preview-pin');
    pin.style.display='none';
    try {
      const url=await fileUrl(scene.panorama_path,true);
      if(!el.isConnected || selected!==scene.id)return;
      preview=createViewer(el,{src:url,onReady:()=>{el.querySelector('.preview-loading')?.remove();},onError:msg=>alertMessage(msg,true),onClick:({yaw,pitch})=>{
        const form=root.querySelector('#exhibit-form'); if(!form)return;
        form.elements.yaw.value=yaw.toFixed(3);form.elements.pitch.value=pitch.toFixed(3);
        pin.style.display='block';pin.style.left='50%';pin.style.top='50%';
        alertMessage('Орын белгіленді. Сақтау түймесін басыңыз.');
      }});
    } catch(e){alertMessage(`Панораманы ашу мүмкін болмады: ${e.message}`,true);}
  }
  function panoramasPage(){
    layout(`<div class="admin-title-row"><div><span class="section-eyebrow">360° КЕҢІСТІКТЕР</span><h1>Панорамалар</h1><p>Әр залдағы екі көріністің фондарын ауыстырыңыз. Файл нақты 2:1 equirectangular болуы керек.</p></div></div>
      <div class="scene-cards">${model.scenes.map(s=>`<article class="scene-card"><img src="${esc(s.panorama_path?.startsWith('/')?s.panorama_path:'/panoramas/hall-1.jpg')}" alt=""><div><span>${esc(rooms[s.room_id]?.name||'Зал')}</span><h2>${esc(s.title)}</h2><label class="upload-label">Панораманы ауыстыру<input type="file" data-upload-scene="${esc(s.id)}" accept="image/jpeg,image/png,image/webp"></label></div></article>`).join('')}</div>`);
    root.querySelectorAll('[data-upload-scene]').forEach(input=>input.addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try {
        if(file.size>20*1024*1024)throw new Error('Панорама 20 МБ-тан аспауы керек.');
        await verifyRatio(file);
        alertMessage('Панорама жүктелуде…');
        const path=await upload(file,'panoramas');
        try { await saveRecord('scenes',{panorama_path:path},input.dataset.uploadScene); }
        catch(err){await removeFile(path).catch(()=>{});throw err;}
        await load(); panoramasPage();alertMessage('Панорама жаңартылды. Жария беттегі көріністі тексеріңіз.');
      }catch(err){alertMessage(err.message,true);}
    }));
  }
  function verifyRatio(file){return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);Math.abs(image.width/image.height-2)<.015?resolve():reject(new Error('Панорама енінің биіктігіне қатынасы 2:1 болуы керек.'));};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Сурет файлы ашылмады.'));};image.src=url;
  });}
  function settingsPage(){
    const c=model.config||{};
    layout(`<div class="admin-title-row"><div><span class="section-eyebrow">МУЗЕЙ ДЕРЕКТЕРІ</span><h1>Музей туралы</h1><p>Нақты тұлғаның тек расталған мәліметтерін жариялаңыз.</p></div></div>
      <form id="museum-form" class="form-card settings-card"><label>Музей атауы<input name="museum_name" required value="${esc(c.museum_name||'Мұрагер')}"></label>
      <label>Тұлғаның толық аты-жөні<input name="person_name" value="${esc(c.person_name||'')}" placeholder="Деректер тексерілген соң енгізіңіз"></label>
      <label>Қысқаша өмірбаян<textarea name="biography" rows="6" placeholder="Расталған өмірбаян">${esc(c.biography||'')}</textarea></label>
      <label>Портрет суреті<input type="file" name="portrait" accept="image/*"></label>
      ${c.hero_image_path?`<div class="attached">✓ Портрет жүктелген</div>`:''}<button class="admin-submit" type="submit">Өзгерістерді сақтау →</button></form>`);
    root.querySelector('#museum-form').addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget,f=new FormData(form);let newPath;
      try {const file=f.get('portrait');if(file?.size){if(file.size>20*1024*1024)throw new Error('Сурет 20 МБ-тан аспауы керек.');newPath=await upload(file,'portraits');}
        await saveConfig({museum_name:String(f.get('museum_name')).trim(),person_name:String(f.get('person_name')).trim(),biography:String(f.get('biography')).trim(),...newPath?{hero_image_path:newPath}:{}});
        await load();settingsPage();alertMessage('Музей мәліметтері сақталды.');
      }catch(err){if(newPath)await removeFile(newPath).catch(()=>{});alertMessage(err.message,true);}
    });
  }
  start();
}
