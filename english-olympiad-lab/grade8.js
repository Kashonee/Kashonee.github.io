/* Grade 8 archive, source-based analysis and learner evidence. No external requests. */
window.GRADE8 = (() => {
 'use strict';
 const D=window.GRADE8_DATA, stages={district:'Аудандық',regional:'Облыстық',national:'Республикалық'};
 let ctx,year='all',stage='all',wordQuery='',wordSource='all';
 const empty=()=>({exams:{},practice:{},words:{}});
 const norm=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/\bdoesn't\b/g,'does not').replace(/\bdidn't\b/g,'did not').replace(/\bhaven't\b/g,'have not').replace(/\bhasn't\b/g,'has not').replace(/\bit's\b/g,'it is').replace(/[^\p{L}\p{N}']/gu,' ').trim().replace(/\s+/g,' ');
 const slots=e=>e.sections.flatMap(s=>s.items.map(q=>({...q,id:s.id+'-'+q.n,section:s.id})));
 const exam=id=>D.exams.find(e=>e.id===id),topic=id=>D.topics.find(t=>t.id===id);
 function sanitize(raw){
  const out=empty();if(!raw||typeof raw!=='object')return out;
  function attempt(e,a){
   if(!a||typeof a!=='object')return null;
   const answers={};for(const q of slots(e))if(typeof a.answers?.[q.id]==='string')answers[q.id]=a.answers[q.id].slice(0,2000);
   const writing=(e.wordLimits||[]).map((_,i)=>typeof a.writing?.[i]==='string'?a.writing[i].slice(0,20000):'');
   return {answers,writing,at:Number.isFinite(a.at)?Math.max(0,Math.min(a.at,Date.now())):null};
  }
  for(const e of D.exams){const r=raw.exams?.[e.id];if(!r)continue;out.exams[e.id]={draft:attempt(e,r.draft),attempts:(Array.isArray(r.attempts)?r.attempts:[]).slice(-5).filter(a=>Number.isFinite(a?.at)).map(a=>attempt(e,a)).filter(Boolean)};}
  for(const t of D.topics){const r=raw.practice?.[t.id];if(!r)continue;const values={};drills(t.id).forEach((q,i)=>{if(typeof r.values?.[i]==='string')values[i]=r.values[i].slice(0,2000);});out.practice[t.id]={values,checked:r.checked===true};}
  for(const w of D.vocab){const r=raw.words?.[w.id];if(r&&Number.isInteger(r.step)&&r.step>=1&&r.step<=5&&Number.isFinite(r.due))out.words[w.id]={step:r.step,due:Math.max(0,r.due)};}
  return out;
 }
 function grade(q,value){
  if(!String(value??'').trim())return 'blank';
  if(q.review)return 'pending';
  const accepted=q.accept||[q.key];
  if(accepted.some(a=>norm(a)===norm(value)))return 'correct';
  return q.flexible?'pending':'wrong';
 }
 function score(e,a){
  const r={correct:0,wrong:0,pending:0,blank:0,points:0,max:0};
  for(const q of slots(e)){const g=grade(q,a?.answers?.[q.id]);r[g]++;if(!q.review)r.max+=q.points;if(g==='correct')r.points+=q.points;}
  return r;
 }
 const local=()=>{const s=ctx.getState();return s.grade8??(s.grade8=empty());};
 const latest=e=>local().exams[e.id]?.attempts?.at(-1);
 function evidence(progress=local()){
  const rows=D.topics.map(t=>({...t,refs:[],correct:0,wrong:0,pending:0,blank:0}));
  for(const e of D.exams)for(const q of slots(e)){
   const t=rows.find(t=>t.id===q.topic),a=progress.exams[e.id]?.attempts?.at(-1);if(!t)continue;
   t.refs.push({exam:e.id,id:q.id,n:q.n,section:q.section,review:!!q.review});
   const g=a?grade(q,a.answers[q.id]):'blank';t[g]++;
  }
  return rows.sort((a,b)=>Number(b.wrong>0)-Number(a.wrong>0)||(b.wrong/(b.correct+b.wrong||1)-a.wrong/(a.correct+a.wrong||1))||Number(a.correct>0)-Number(b.correct>0)||b.refs.length-a.refs.length);
 }
 function drills(id){
  if(id==='V05')return [
   {prompt:'Complete the word: You need written permi___ion. Write the full word.',key:'permission',explanation:'Permission: қос s; -sion тұлғасы.'},
   {prompt:'Is “carefully” a real English word? Write Yes or No.',key:'Yes',explanation:'Careful + -ly → carefully. Үстеу іс-әрекеттің қалай жасалғанын көрсетеді.'},
   {prompt:'Is “beautifullly” spelled correctly? Write Yes or No.',key:'No',explanation:'Дұрыс жазылуы: beautifully, екі l.'}];
  const lesson=window.LESSONS?.find(l=>l.code===id);if(lesson)return lesson.practice.slice(0,3).map(q=>({prompt:q.q,key:q.answer,accept:q.accept||[q.answer],explanation:q.explanation}));
  if(id==='Q01')return [
   {prompt:'Complete the tag: You enjoy reading, ___?',key:"don't you",explanation:'Present Simple, болымды сөйлем: do + not + you.'},
   {prompt:'Ask about the time: The club starts at six. ___ does the club start?',key:'What time',explanation:'Уақытты сұрау: What time + does + subject + verb?'},
   {prompt:'Write the possessive: the notebook of my sister → my ___ notebook',key:"sister's",explanation:'Жекеше иелік тұлға: sister + ’s.'}];
  const passage='A school garden club meets on Wednesdays. Last month the students collected rainwater instead of using tap water. They used less water, but the vegetables grew just as well. Maya wrote a short report to help other schools try the idea. The club is free, but new members must register by Monday.';
  if(id==='R01')return [
   {prompt:passage+'\nTrue or False: The club meets on Mondays.',key:'False',explanation:'Wednesday — кездесу күні; Monday — тіркелу мерзімі.'},
   {prompt:'True, False or Doesn’t Say: The club has twenty members.',key:'Doesn’t Say',explanation:'Мәтінде қатысушылар саны жоқ.'},
   {prompt:'What must new members do by Monday? Write the verb.',key:'register',explanation:'must register by Monday — тікелей берілген шарт.'}];
  if(id==='R02')return [
   {prompt:passage+'\nChoose the main idea: A) A garden experiment can save water. B) Vegetables need no water. C) School clubs are expensive.',key:'A',explanation:'Тәжірибе суды азайтты, көкөністер бұрынғыдай өсті.'},
   {prompt:'Why did Maya write the report? A) To close the club. B) To share a useful method. C) To sell vegetables.',key:'B',explanation:'help other schools try the idea — тәжірибені бөлісу мақсаты.'},
   {prompt:'Can we conclude the students used no water at all? Write Yes or No.',key:'No',explanation:'Less water — азырақ су, no water деген емес.'}];
  return [
   {prompt:'The club collected rainwater. ___ helped it use less tap water. (This / These)',key:'This',explanation:'This алдыңғы тұтас ойға сілтейді.'},
   {prompt:'The experiment saved water. ___, the vegetables grew just as well. (Moreover / Because)',key:'Moreover',explanation:'Moreover екінші артықшылықты қосады.'},
   {prompt:'Match the paraphrase: “registration is required” = A) joining needs no action B) you must sign up',key:'B',explanation:'Required және must бір міндеттілікті жеткізеді.'}];
 }
 const E=v=>ctx.esc(v),A=(path,text,cls='btn light')=>`<a class="${cls}" href="#/grade8${path}">${E(text)}</a>`;
 const badge=(text,cls='neutral')=>`<span class="pill ${cls}">${E(text)}</span>`;
 const title=(h,p)=>`<div class="page-head"><div><div class="eyebrow">8 СЫНЫП · OLYMPIAD LAB</div><h1>${E(h)}</h1><p>${E(p)}</p></div></div>`;
 const tabs=active=>`<nav class="g8-tabs" aria-label="8 сынып бөлімдері">${[['','Материалдар'],['/analysis','Тесттерді талдау'],['/path','Жеке дайындық'],['/vocab','Сөздік · 50 сөз']].map(([p,t])=>`<a href="#/grade8${p}" class="g8-tab ${active===p?'active':''}" ${active===p?'aria-current="page"':''}>${E(t)}</a>`).join('')}</nav>`;
 const wrap=(html,name,active='')=>ctx.shell(title(name,'2024–2025 және 2025–2026 · аудандық, облыстық, республикалық кезеңдер')+tabs(active)+`<div class="g8-content">${html}</div>`,name);
 function card(e){
  const a=latest(e),s=score(e,a),draft=local().exams[e.id]?.draft;
  return `<article class="card g8-paper"><div class="flex-between">${badge(e.year)}${badge(stages[e.stage],e.stage==='national'?'purple':'neutral')}</div><h2>${E(stages[e.stage])} кезең</h2><p>${slots(e).length} жауап · ${e.maxScore} балл${e.minutes?' · '+e.minutes+' минут':''}</p><p>${e.stage==='district'?'Грамматика, сөздік және Reading':'Reading · Use of English · Writing'}</p><div class="g8-paper-status">${a?badge('Автотексеру: '+s.points+'/'+s.max,'good'):badge(draft?'Басталған':'Әлі орындалмады')}${a?'<small>Жазылым және даулы жауаптар бөлек тексеріледі.</small>':''}</div><div class="tools-row">${A('/exam/'+e.id,draft?'Жалғастыру':a?'Нәтижені қарау':'Нұсқаны ашу','btn')}${A('/analysis/'+e.id,'Талдау','text-link')}</div><div class="tools-row"><a href="${E(e.test)}" target="_blank" rel="noopener">Тапсырмалар PDF</a><a href="${E(e.keys)}" target="_blank" rel="noopener">Түпнұсқа кілт${e.keys.endsWith('.docx')?' DOCX':''}</a></div></article>`;
 }
 function hub(){
  const list=D.exams.filter(e=>(year==='all'||e.year===year)&&(stage==='all'||e.stage===stage));
  wrap(`<section class="g8-hero"><div><span class="eyebrow">ТҮПНҰСҚАДАН ЖЕКЕ ДАЙЫНДЫҚҚА</span><h2>Нұсқаны орында.<br>Қажет тақырыбыңды тап.</h2><p>Алты комплект, жауап кілттері және әр сұраққа байланыстырылған тақырыптар. Нәтижең келесі жаттығуды таңдауға көмектеседі.</p><div class="tools-row">${A('/path','Дайындық жолын ашу','btn')}${A('/analysis','Не тексеріледі?','btn light')}</div></div><div class="g8-hero-count"><strong>6</strong><span>нұсқа</span><p>240 жауап тармағы<br>50 сөз бен тіркес</p></div></section><div class="g8-filters"><label>Оқу жылы<select data-g8-filter="year"><option value="all">Барлық жылдар</option>${['2024–2025','2025–2026'].map(v=>`<option ${year===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Кезең<select data-g8-filter="stage"><option value="all">Барлық кезеңдер</option>${Object.entries(stages).map(([v,t])=>`<option value="${v}" ${stage===v?'selected':''}>${t}</option>`).join('')}</select></label><span role="status">${list.length} нұсқа</span></div><div class="g8-grid">${list.map(card).join('')}</div><p class="note spaced">Материалдар сіз жүктеген архивтен алынды. Тақырыптар мен сөздікке берілген түсіндірмелер — дайындыққа арналған әдістемелік талдау. Жауаптар жалпы нәтиже файлына бірге сақталады.</p>`,'8 сынып · Олимпиада архиві');
 }
 function analysis(id){
  const e=exam(id),rows=evidence().map(t=>({...t,refs:t.refs.filter(r=>!e||r.exam===e.id)})).filter(t=>t.refs.length).sort((a,b)=>b.refs.length-a.refs.length);
  wrap(`${e?A('','Барлық нұсқаларға оралу','text-link'):''}<section class="card"><h2>${e?E(stages[e.stage]+' · '+e.year):'Тесттер нені тексереді?'}</h2><p>Аудандық кезеңде қысқа грамматикалық және лексикалық таңдау басым. Облыстық кезеңде мәтін байланысы, сөзжасам, шақ және Passive тексеріледі. Республикалық нұсқаларда multiple matching, қате табу, трансформация және жазылым жанрлары қосылады.</p><p class="note">Сандар — осы алты файлдағы тармақ саны. Бұл келесі олимпиада тақырыптарының болжамы емес. Әр сұраққа негізгі бір тақырып белгіленді.</p></section>${e?`<section class="card spaced"><h2>Нұсқаның құрылымы</h2><p>${e.maxScore} түпнұсқа балл · ${slots(e).length} автоматты/қолмен тексерілетін жауап${e.minutes?' · '+e.minutes+' минут':''}</p>${e.wordLimits?'<p>Writing: '+e.wordLimits.map((l,i)=>`${i+1}-жұмыс ${l.join('–')} сөз`).join('; ')+'. Мұғалім мазмұн, құрылым, грамматика және лексиканы тексереді.</p>':''}${e.notes.map(n=>`<p class="g8-note">${E(n)}</p>`).join('')}${A('/exam/'+e.id,'Осы нұсқаны орындау','btn')}</section>`:''}<div class="g8-topic-list spaced">${rows.map(t=>`<article class="card"><div class="flex-between"><h3>${E(t.title)}</h3>${badge(t.refs.length+' тармақ')}</div><p>${E(t.focus)}</p><details><summary>Дәлелдер: кезең және сұрақ</summary><div class="g8-refs">${t.refs.map(r=>A('/exam/'+r.exam+'/'+r.section,stages[exam(r.exam).stage]+' '+exam(r.exam).year+' · '+r.section+' №'+r.n+(r.review?' · даулы':''),'g8-ref')).join('')}</div></details><div class="tools-row">${A('/train/'+t.id,'Тақырыпты жаттықтыру','text-link')}</div></article>`).join('')}</div>${!e?`<section class="card spaced"><h2>Жазылым картасы</h2><div class="table-wrap"><table><thead><tr><th>Нұсқа</th><th>Жанр және көлем</th></tr></thead><tbody><tr><td>Облыстық 2024–2025</td><td>Story · 120–130 сөз</td></tr><tr><td>Облыстық 2025–2026</td><td>Story · 140–160 сөз</td></tr><tr><td>Республикалық 2024–2025</td><td>Blog entry, opinion essay, article немесе for-and-against essay · 120–130 сөз</td></tr><tr><td>Республикалық 2025–2026</td><td>Екі жұмыс: picture description · 50–70; essay · 150–160 сөз</td></tr></tbody></table></div></section>`:''}`,'8 сынып · Тесттерді талдау','/analysis');
 }
 function path(){
  const rows=evidence(),finished=D.exams.filter(e=>latest(e)).length,weak=rows.filter(t=>t.wrong>0),first=D.exams.find(e=>!latest(e));
  wrap(`<section class="card"><h2>${finished?'Нәтижеңе негізделген келесі қадам':'Алдымен бастапқы нәтиже жина'}</h2><p>${finished?`${finished}/6 нұсқа тексерілді. ${weak.length} тақырыпта қате бар. Алдымен қате үлгіні түсін, үш жаңа тапсырманы орында, кейін басқа жылдың нұсқасымен тексер.`:'Аудандық нұсқадан баста. Сайт жауаптарды грамматика, сөздік және Reading бойынша топтастырады. Әзірге жеке әлсіз тақырып анықталған жоқ.'}</p><div class="tools-row">${weak.length?A('/train/'+weak[0].id,'Басым тақырып: '+weak[0].title,'btn'):A('/exam/'+(first?.id||D.exams[0].id),'Бастапқы нұсқаны орындау','btn')}${first&&finished?A('/exam/'+first.id,'Басқа нұсқамен тексеру','btn light'):''}${A('/vocab','Сөздерді қайталау')}</div></section><div class="g8-topic-list spaced">${rows.map(t=>{const p=local().practice[t.id],ds=drills(t.id),passed=p?.checked?ds.filter((q,i)=>grade(q,p.values[i])==='correct').length:null;return `<article class="card"><div class="flex-between"><h3>${E(t.title)}</h3>${badge(t.wrong?'Қайталау керек':t.correct?'Жауаптар бар':'Әлі тексерілмеді',t.wrong?'warn':t.correct?'good':'neutral')}</div><p>${E(t.focus)}</p><p>Түпнұсқада: ${t.correct} дұрыс · ${t.wrong} қате · ${t.pending} қолмен тексеру · ${t.blank} жауапсыз / тексерілмеген</p>${passed!==null?`<p>Бөлек жаттығу: ${passed}/${ds.length} дұрыс. Бұл нәтиже түпнұсқа балын өзгертпейді.</p>`:''}<div class="tools-row">${A('/train/'+t.id,'3 жаңа тапсырма','btn light')}${A('/analysis','Түпнұсқадағы дәлелдер','text-link')}</div></article>`;}).join('')}</div><section class="card spaced"><h2>Дайындық реті</h2><p>Аудандық: шақтар, предлогтар, артикльдер, questions және сөздік. Облыстық: Passive, word formation, gapped text және story. Республикалық: парафраз, қате түзету, трансформация, picture description және essay.</p><p>Әр сабақ: 5 минут ереже, 10 минут жаңа тапсырма, 5 минут қатені түсіндіру. Бірнеше күннен кейін басқа нұсқада қайта тексер.</p></section>`,'8 сынып · Жеке дайындық','/path');
 }
 function ensure(e){const all=local().exams;return all[e.id]??(all[e.id]={draft:{answers:{},writing:[]},attempts:[]});}
 function feedback(q,value){const g=grade(q,value);return `<div class="g8-feedback ${g}"><strong>${E({correct:'Дұрыс',wrong:'Қате',pending:'Мұғаліммен тексер',blank:'Жауап берілмеді'}[g])}</strong>${g!=='blank'?`<p>Түпнұсқа кілті: <span lang="en">${E(q.key)}</span></p>${q.review?'<p>'+E(q.review)+'</p>':''}<p>${E(topic(q.topic)?.focus||'')}</p>${A('/train/'+q.topic,'Осы тақырыпты жаттықтыру','text-link')}`:''}</div>`;}
 function answerCard(e,s,q,a,locked){
  const id=s.id+'-'+q.n,v=a.answers[id]||'',opts=q.options||q.choices?.map(x=>({value:x,text:x}));
  return `<fieldset class="g8-answer" id="g8-${id}"><legend>${E(s.title)} · №${q.n} ${q.points>1?'· '+q.points+' балл':''}</legend>${q.prompt?`<p lang="en" class="g8-prompt">${E(q.prompt)}</p>`:''}${q.hint?'<p class="note">'+E(q.hint)+'</p>':''}${opts?`<div class="g8-options">${opts.map(o=>`<label class="${v===o.value?'selected':''}"><input type="radio" name="g8-${id}" value="${E(o.value)}" data-g8-answer="${id}" data-exam="${e.id}" ${v===o.value?'checked':''} ${locked?'disabled':''}><span lang="en">${q.options?E(o.value)+'. ':''}${E(o.text)}</span></label>`).join('')}</div>`:`<label class="visually-hidden" for="g8-input-${id}">${E(s.title)} №${q.n} жауабы</label><input class="answer-input" id="g8-input-${id}" data-g8-answer="${id}" data-exam="${e.id}" maxlength="2000" value="${E(v)}" ${locked?'disabled':''} autocomplete="off" spellcheck="false" lang="en">`}${locked?feedback(q,v):''}</fieldset>`;
 }
 function paper(id,part){
  const e=exam(id);if(!e){hub();return;}const r=ensure(e);if(!r.draft&&!r.attempts.length)r.draft={answers:{},writing:[]};
  const a=r.draft||r.attempts.at(-1),locked=!r.draft,s=e.sections.find(s=>s.id===part)||e.sections[0],sc=score(e,a),filled=slots(e).filter(q=>a.answers[q.id]?.trim()).length;
  wrap(`${A('','Материалдарға оралу','text-link')}<section class="card spaced"><div class="flex-between"><h2>${E(stages[e.stage]+' · '+e.year)}</h2>${badge(locked?'Тексерілген әрекет':'Жауап парағы',locked?'good':'neutral')}</div><p>${e.maxScore} түпнұсқа балл${e.minutes?' · '+e.minutes+' минут':''} · <span id="g8-filled">${filled}</span>/${slots(e).length} жауап</p><p class="note">Түпнұсқа мәтінін оқып, нөміріне сәйкес жауап бер. Уақыт өзің бақылайтын анықтама ретінде көрсетілген. Жазылымды мұғалім тексереді.</p>${locked?`<div class="g8-score"><strong>${sc.points}/${sc.max}</strong><span>автоматты балл<br>${sc.correct} дұрыс · ${sc.wrong} қате · ${sc.pending} қолмен тексеру · ${sc.blank} бос</span></div><p class="note">Даулы тармақтар автоматты максимумнан шығарылды. Жазылым бұл балға қосылмайды.</p><div class="tools-row">${A('/path','Жеке ұсыныстар','btn')}<button class="btn light" data-g8-action="retry" data-exam="${e.id}">Жаңа әрекет</button></div>`:''}${e.notes.length?`<details class="spaced"><summary>Тапсырма мен кілт туралы ескертпелер</summary>${e.notes.map(n=>'<p>'+E(n)+'</p>').join('')}</details>`:''}<div class="tools-row"><a href="${E(e.test)}" target="_blank" rel="noopener">Түпнұсқа PDF</a><a href="${E(e.keys)}" target="_blank" rel="noopener">Жауап кілті</a></div></section><nav class="g8-tabs spaced" aria-label="Нұсқа бөлімдері">${e.sections.map(p=>A('/exam/'+e.id+'/'+p.id,p.title,p.id===s.id?'g8-tab active':'g8-tab')).join('')}</nav><div class="g8-exam-layout"><section class="card g8-source"><h2>Түпнұсқа · ${E(s.title)}</h2>${s.id==='writing'&&e.writingImage?`<img class="g8-writing-image" src="${E(e.writingImage)}" alt="Балалар сыныпты тазалап жатыр: бірі тақтаны сүртеді, бірі еденді сыпырады.">`:''}<div lang="en" class="g8-source-text">${E(s.source)}</div></section><section aria-label="Жауап парағы">${s.items.map(q=>answerCard(e,s,q,a,locked)).join('')}${s.id==='writing'?(e.wordLimits||[]).map((limit,i)=>`<section class="card g8-writing"><h2>Writing · ${i+1}-жұмыс</h2><p>${limit.join('–')} сөз. Жоғарыдағы түпнұсқа тақырыптарының тиістісін таңда.</p><label for="g8-write-${i}">Ағылшын тіліндегі мәтінің</label><textarea id="g8-write-${i}" class="writing-area" data-g8-write="${i}" data-exam="${e.id}" maxlength="20000" lang="en" ${locked?'readonly':''}>${E(a.writing?.[i]||'')}</textarea><p id="g8-count-${i}" role="status">${wordCount(a.writing?.[i])} / ${limit.join('–')} сөз</p><p class="note">Мұғалім мазмұнды, логиканы, грамматиканы және лексиканы бағалайды. Автоматты сапа балы қойылмайды.</p></section>`).join(''):''}</section></div><section class="card spaced"><div class="tools-row">${!locked?`<button class="btn" data-g8-action="submit" data-exam="${e.id}">Барлық бөлімнің жауабын тексеру</button>`:A('/path','Нәтиже бойынша дайындалу','btn')}${e.sections.filter(p=>p.id!==s.id).map(p=>A('/exam/'+e.id+'/'+p.id,p.title)).join('')}</div>${!locked?'<p class="note">Барлық бөлімді аяқтағанда тексер. Бос жауаптар тексерілмеген болып қалады. Кілт ашылғаннан кейін осы әрекеттің жауаптары бекітіледі.</p>':''}<div class="saved-dot">${E(ctx.storageLabel())}</div></section>`,'8 сынып · '+stages[e.stage]);
 }
 const wordCount=t=>(String(t||'').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
 function train(id){
  const t=topic(id);if(!t){path();return;}const qs=drills(id),p=local().practice[id]||{values:{},checked:false},l=id==='V05'?null:window.LESSONS?.find(l=>l.code===id);
  wrap(`${A('/path','Жеке дайындыққа оралу','text-link')}<section class="card spaced"><h2>${E(t.title)}</h2><p>${E(t.focus)}</p>${l?`<ul>${l.rules.map(r=>'<li>'+E(r)+'</li>').join('')}</ul>${t.lesson?'<a class="text-link" href="#/learn/'+t.lesson+'">Толық сабақты ашу</a>':''}`:'<p>Алдымен мәтіндегі дәлелді белгіле. Парафразды таны, жауапты өз біліміңмен толықтырма.</p>'}</section><p class="note spaced">Бұлар — түпнұсқа жауаптарын қайталамайтын бөлек авторлық жаттығулар. Олардың нәтижесі нұсқаның балын өзгертпейді.</p>${qs.map((q,i)=>`<section class="card spaced"><label for="g8-drill-${i}"><strong>Жаттығу ${i+1}</strong></label><p class="g8-prompt" lang="en">${E(q.prompt)}</p><input class="answer-input" id="g8-drill-${i}" data-g8-drill="${i}" data-topic="${E(id)}" value="${E(p.values[i]||'')}" maxlength="2000" ${p.checked?'disabled':''} lang="en" autocomplete="off">${p.checked?`<div class="g8-feedback ${grade(q,p.values[i])}"><strong>${grade(q,p.values[i])==='correct'?'Дұрыс':'Қайта қара'}</strong><p lang="en">${E(q.key)}</p><p>${E(q.explanation)}</p></div>`:''}</section>`).join('')}<button class="btn spaced" data-g8-action="${p.checked?'drill-retry':'drill-check'}" data-topic="${E(id)}">${p.checked?'Қайта жаттығу':'Жаттығуды тексеру'}</button>`,'8 сынып · Тақырыптық жаттығу','/path');
 }
 function vocab(){
  const list=D.vocab.filter(w=>(wordSource==='all'||w.exam===wordSource)&&(!wordQuery||norm(w.word+' '+w.translation+' '+w.phrase).includes(norm(wordQuery))));
  wrap(`<section class="card"><h2>Сөзді жеке емес, тіркесімен үйрен</h2><p>Тесттерден алынған 50 сөз бен тіркес. Алдымен мағынасын есіңе түсір, карточканы аш, кейін өз сөйлеміңді айт. «Есімде» келесі қайталауды 1, 3, 7, 14, 30 күнге жоспарлайды.</p></section><div class="g8-filters spaced"><label>Сөз іздеу<input type="search" id="g8-word-search" value="${E(wordQuery)}" placeholder="word / аударма"></label><label>Дереккөз<select data-g8-filter="word-source"><option value="all">Барлық 6 нұсқа</option>${D.exams.map(e=>`<option value="${e.id}" ${wordSource===e.id?'selected':''}>${E(stages[e.stage]+' '+e.year)}</option>`).join('')}</select></label><span role="status">${list.length} сөз</span><button class="btn light small" data-g8-action="word-search">Іздеу</button></div><div class="g8-grid">${list.map(w=>{const r=local().words[w.id],due=!r||r.due<=Date.now(),e=exam(w.exam);return `<article class="card g8-word"><span class="note">${E(stages[e.stage]+' '+e.year)}</span><h2 lang="en">${E(w.word)}</h2><p lang="en">${E(w.phrase)}</p><details><summary>Мағынасын ашу</summary><p>${E(w.translation)}</p><div class="tools-row"><button class="btn light small" data-g8-action="word-again" data-word="${w.id}">Қайталау керек</button><button class="btn small" data-g8-action="word-known" data-word="${w.id}">Есімде</button></div></details><p class="note">${due?'Қазір қайталау':r?'Келесі қайталау: '+new Date(r.due).toLocaleDateString('kk-KZ',{timeZone:'Asia/Almaty'}):''}</p>${A('/exam/'+w.exam,'Түпнұсқада қарау','text-link')}</article>`;}).join('')||'<p>Бұл іздеу бойынша сөз табылмады.</p>'}</div>`,'8 сынып · Сөздік қор','/vocab');
 }
 function render(parts){
  if(parts[1]==='exam')paper(parts[2],parts[3]);else if(parts[1]==='analysis')analysis(parts[2]);else if(parts[1]==='path')path();else if(parts[1]==='train')train(parts[2]);else if(parts[1]==='vocab')vocab();else hub();
 }
 function action(el){
  const act=el.dataset.g8Action,e=exam(el.dataset.exam),t=topic(el.dataset.topic);
  if(act==='submit'&&e){const r=ensure(e);if(r.draft){r.attempts.push({...r.draft,at:Date.now()});r.attempts=r.attempts.slice(-5);r.draft=null;ctx.save();}paper(e.id,location.hash.split('/')[4]);window.scrollTo({top:0,behavior:'instant'});document.getElementById('main')?.focus({preventScroll:true});}
  if(act==='retry'&&e){ensure(e).draft={answers:{},writing:[]};ctx.save();paper(e.id);}
  if(act==='drill-check'&&t){const p=local().practice[t.id]??(local().practice[t.id]={values:{}});p.checked=true;ctx.save();train(t.id);}
  if(act==='drill-retry'&&t){local().practice[t.id]={values:{},checked:false};ctx.save();train(t.id);}
  if(act==='word-search'){wordQuery=document.getElementById('g8-word-search').value.trim();vocab();}
  if(act==='word-known'||act==='word-again'){
   const w=D.vocab.find(w=>w.id===el.dataset.word);if(!w)return;const prev=local().words[w.id],step=act==='word-known'?Math.min(5,(prev?.step||0)+1):1;
   local().words[w.id]={step,due:Date.now()+(act==='word-known'?[1,3,7,14,30][step-1]*86400000:600000)};ctx.save();vocab();
  }
 }
 function input(el){
  const e=exam(el.dataset.exam);
  if(el.dataset.g8Answer&&e){const r=ensure(e);if(!r.draft)return;const q=slots(e).find(q=>q.id===el.dataset.g8Answer);if(!q)return;r.draft.answers[q.id]=el.value.slice(0,2000);ctx.save();const n=document.getElementById('g8-filled');if(n)n.textContent=slots(e).filter(q=>r.draft.answers[q.id]?.trim()).length;}
  if(el.dataset.g8Write!==undefined&&e){const r=ensure(e),i=Number(el.dataset.g8Write);if(!r.draft||!e.wordLimits?.[i])return;r.draft.writing[i]=el.value.slice(0,20000);ctx.save();const n=document.getElementById('g8-count-'+i);if(n)n.textContent=wordCount(el.value)+' / '+e.wordLimits[i].join('–')+' сөз';}
  if(el.dataset.g8Drill!==undefined&&topic(el.dataset.topic)){const id=el.dataset.topic,p=local().practice[id]??(local().practice[id]={values:{},checked:false});if(!p.checked&&drills(id)[Number(el.dataset.g8Drill)]){p.values[el.dataset.g8Drill]=el.value.slice(0,2000);ctx.save();}}
 }
 function change(el){
  if(el.dataset.g8Filter==='year'){year=el.value;hub();}if(el.dataset.g8Filter==='stage'){stage=el.value;hub();}if(el.dataset.g8Filter==='word-source'){wordSource=el.value;vocab();}
 }
 function teacherSummary(progress){const rows=evidence(progress),finished=D.exams.filter(e=>progress.exams[e.id]?.attempts?.length);if(!finished.length)return '';
  return `<section class="card spaced"><h2>8 сынып · Олимпиада нәтижелері</h2><p>${finished.length}/6 нұсқа тексерілді. Жазылым мен даулы тармақтарды жеке қараңыз.</p>${finished.map(e=>{const a=progress.exams[e.id].attempts.at(-1),s=score(e,a);return `<details><summary>${E(stages[e.stage]+' '+e.year)} · ${s.points}/${s.max} автоматты балл</summary><p>${s.correct} дұрыс · ${s.wrong} қате · ${s.pending} қолмен тексеру · ${s.blank} бос</p>${(a.writing||[]).map((w,i)=>'<h3>Writing '+(i+1)+'</h3><div class="teacher-text">'+E(w||'Жазылмаған')+'</div>').join('')}${slots(e).filter(q=>['wrong','pending'].includes(grade(q,a.answers[q.id]))).map(q=>`<p>${E(q.id)} · ${E(topic(q.topic)?.title)}<br>Жауап: ${E(a.answers[q.id])}<br>Кілт: ${E(q.key)}${q.review?'<br>'+E(q.review):''}</p>`).join('')}</details>`;}).join('')}<h3>Алдымен қайталау керек</h3><p>${E(rows.filter(t=>t.wrong).map(t=>t.title+' ('+t.wrong+' қате)').join('; ')||'Автоматты тексерілетін жауаптарда қате тіркелмеді.')}</p></section>`;
 }
 function reportText(progress){
  if(!progress)return '';
  return ['\n8 СЫНЫП · ТҮПНҰСҚА ОЛИМПИАДА НҰСҚАЛАРЫ',...D.exams.flatMap(e=>{
   const r=progress.exams[e.id],a=r?.draft||r?.attempts?.at(-1);if(!a)return [];const s=score(e,a),submitted=!r.draft;
   return [stages[e.stage]+' '+e.year,submitted?`${s.points}/${s.max} автоматты балл; ${s.correct} дұрыс; ${s.wrong} қате; ${s.pending} қолмен тексеру; ${s.blank} бос`:'Аяқталмаған жауап парағы. Балл есептелмейді.',...slots(e).filter(q=>a.answers[q.id]).map(q=>`${q.id} · ${topic(q.topic)?.title}\nЖауап: ${a.answers[q.id]}${submitted?'\nКілт: '+q.key+'; '+grade(q,a.answers[q.id]):''}${q.review?'\n'+q.review:''}`),...(a.writing||[]).map((w,i)=>'Writing '+(i+1)+' · '+wordCount(w)+' сөз\n'+w)];
  }),'Жеке басымдықтар: '+evidence(progress).filter(t=>t.wrong).map(t=>t.title+' — '+t.wrong+' қате').join('; ')].join('\n');
 }
 return {empty,sanitize,grade,score,evidence,drills,slots,render,input,change,action,teacherSummary,reportText,init:c=>{ctx=c;}};
})();
