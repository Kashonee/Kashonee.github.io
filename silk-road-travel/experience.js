(function(){
 'use strict';
 const SAVED_ICONS={"heart": "<svg class=\"ui-icon ui-icon-heart\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z\"/></svg>", "filled": "<svg class=\"ui-icon ui-icon-heart\" viewBox=\"0 0 24 24\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z\"/></svg>", "check": "<svg class=\"ui-icon ui-icon-check\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m5 12 4 4L19 6\"/></svg>"};
 const params=new URLSearchParams(location.search);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const readStore=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const writeStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 let saved=new Set(readStore('srt-saved-cities',[]).filter(id=>byId[id]));
 let toastTimer;
 function notify(message){const t=$('#toast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
 function updateSaved(){
  if($('#savedCount'))$('#savedCount').textContent=saved.size;
  $$('[data-save-city]').forEach(b=>{const chosen=saved.has(b.dataset.saveCity);b.classList.toggle('saved',chosen);b.setAttribute('aria-pressed',String(chosen));if(b.classList.contains('save-detail')){b.innerHTML=(chosen?SAVED_ICONS.check:SAVED_ICONS.heart)+'<span>'+(chosen?'Саяхат тізімінде сақталған':'Саяхат тізіміне сақтау')+'</span>'}else{b.innerHTML=chosen?SAVED_ICONS.filled:SAVED_ICONS.heart;b.setAttribute('aria-label',byId[b.dataset.saveCity].name+(chosen?' қаласын тізімнен алу':' қаласын сақтау'))}})
 }
 const observer=(!reduced&&'IntersectionObserver' in window)?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08}):null;
 if(observer)document.documentElement.classList.add('js-motion');
 function revealNodes(){if(!observer)return;$$('.portal-card,.city-card,.insight-grid article,.region-card,.comparison,.research-card,.formula-card').forEach((e,i)=>{if(!e.dataset.observed){e.dataset.observed='1';e.classList.add('reveal');e.style.transitionDelay=Math.min(i%4,3)*60+'ms';observer.observe(e)}})}
 let currentRegion='all',onlySaved=params.get('saved')==='1';
 if($('#cityGrid')){
  renderCities=function(region=currentRegion){
   currentRegion=region;
   const term=($('#citySearch')?.value||'').trim().toLocaleLowerCase('kk');
   const found=cities.filter(c=>(region==='all'||c.region===region)&&(!onlySaved||saved.has(c.id))&&(!term||(c.name+' '+c.site+' '+c.role).toLocaleLowerCase('kk').includes(term)));
   $('#cityGrid').innerHTML=found.length?found.map(card).join(''):'<p class="empty-state">'+(onlySaved?'Сақталған қала жоқ. Қала карточкасындағы жүрек белгісін бас.':'Бұл іздеуге сәйкес қала табылмады.')+'</p>';
   $('#savedFilter').classList.toggle('active',onlySaved);$('#savedFilter').setAttribute('aria-pressed',String(onlySaved));updateSaved();revealNodes()
  };
  $('#citySearch').addEventListener('input',()=>renderCities());
  $('#savedFilter').addEventListener('click',()=>{onlySaved=!onlySaved;renderCities()});
  renderCities()
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-save-city]');
  if(b){const id=b.dataset.saveCity;if(!byId[id])return;const had=saved.has(id);had?saved.delete(id):saved.add(id);writeStore('srt-saved-cities',Array.from(saved));updateSaved();notify(byId[id].name+(had?' тізімнен алынды':' саяхат тізіміне сақталды'));if($('#cityGrid')&&onlySaved)renderCities()}
 });
 updateSaved();revealNodes();
 function progress(){const height=document.documentElement.scrollHeight-innerHeight;const value=height>0?scrollY/height*100:0;const bar=$('.reading-progress');if(bar)bar.style.width=value+'%'}
 window.addEventListener('scroll',progress,{passive:true});window.addEventListener('resize',progress);progress();
 if(!reduced&&window.matchMedia('(hover:hover)').matches){
  document.addEventListener('pointermove',e=>{const target=e.target.closest('[data-tilt]');if(!target)return;const r=target.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;target.style.transform='perspective(1100px) rotateX('+(-dy*3)+'deg) rotateY('+(dx*4)+'deg) translateY(-2px)'});
  document.addEventListener('pointerout',e=>{const target=e.target.closest('[data-tilt]');if(target&&!target.contains(e.relatedTarget))target.style.transform=''})
 }
 if($('#mapLayer')){
  let zoom=1;
  const setZoom=()=>{$('#mapLayer').style.transform='scale('+zoom+')';$('#mapZoomIn').disabled=zoom>=1.5;$('#mapZoomOut').disabled=zoom<=1;notify('Карта масштабы: '+Math.round(zoom*100)+'%')};
  $('#mapZoomIn').addEventListener('click',()=>{zoom=Math.min(1.5,zoom+.25);setZoom()});
  $('#mapZoomOut').addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);setZoom()});
  $('#mapReset').addEventListener('click',()=>{zoom=1;setZoom()});
  if(byId[params.get('city')]){selectedCity=params.get('city');renderMap()}
 }
 if($('#virtualCard')){
  renderVirtual=function(){
   const c=cities[virtualIndex],photo=cityImage(c);
   $('#virtualSteps').innerHTML=cities.map((v,i)=>'<button class="'+(i===virtualIndex?'active':'')+'" type="button" data-virtual="'+i+'" aria-label="'+v.name+' аялдамасына өту">'+String(i+1).padStart(2,'0')+'</button>').join('');
   $('#virtualCard').innerHTML='<div class="tour-photo"'+(photo?' style="background-image:url(&quot;'+photo+'&quot;)"':'')+'></div><div class="tour-shade"></div><span class="tour-ornament" aria-hidden="true"><svg class="ui-icon ui-icon-compass" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 2l2.6 9.4L26 6l-5.4 7.4L30 16l-9.4 2.6L26 26l-7.4-5.4L16 30l-2.6-9.4L6 26l5.4-7.4L2 16l9.4-2.6L6 6l7.4 5.4L16 2Z"/><circle cx="16" cy="16" r="1.7" fill="currentColor" stroke="none"/></svg></span><div class="tour-text"><small>АЯЛДАМА '+String(virtualIndex+1).padStart(2,'0')+' / 06 · '+c.regionLabel+'</small><h2>'+c.name+'</h2><p>'+c.role+'</p><div class="tour-focus"><strong>МАҢЫЗДЫ ДЕРЕК</strong><p>'+c.fact+'</p></div><a href="./city-'+c.id+'.html">Қаланың толық тарихын ашу <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a></div><div class="tour-bottom"><span>'+c.kind+' · '+c.status+'</span><div class="virtual-nav"><button type="button" data-step="-1" aria-label="Алдыңғы аялдама" '+(virtualIndex===0?'disabled':'')+'>←</button><button type="button" data-step="1" aria-label="Келесі аялдама" '+(virtualIndex===cities.length-1?'disabled':'')+'>→</button></div></div><div class="tour-credit">'+(c.photoPage?'<a href="'+c.photoPage+'" target="_blank" rel="noopener noreferrer">'+c.credit+' · лицензия <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a>':'Көркем фон · фотосурет немесе реконструкция емес')+'</div>'
  };
  renderVirtual();
  document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||$('#cityDialog').open)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();virtualIndex=Math.max(0,Math.min(cities.length-1,virtualIndex+(e.key==='ArrowRight'?1:-1)));renderVirtual()}})
 }
 if($('#quizPanel')){
  let answers=[];
  const originalQuiz=renderQuiz;
  function best(){const score=readStore('srt-quiz-best',null);if($('#bestScore'))$('#bestScore').textContent=score===null?'Ең жақсы нәтиже әлі жоқ':'Ең жақсы нәтиже: '+score+' / '+quiz.length}
  renderQuiz=function(){
   originalQuiz();$('#quizPanel').style.setProperty('--quiz-progress',Math.min(100,(quizIndex+1)/quiz.length*100)+'%');
   if(quizIndex>=quiz.length){const old=readStore('srt-quiz-best',0);writeStore('srt-quiz-best',Math.max(old,quizScore));best();const review=document.createElement('div');review.className='quiz-review';review.innerHTML='<strong>Есіңде сақта</strong>'+quiz.map((q,i)=>'<p>'+(answers[i]===q.answer?'✓':'○')+' '+q.why+'</p>').join('');$('#quizPanel').append(review)}
  };
  document.addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(b)answers[quizIndex]=Number(b.dataset.answer);if(e.target.closest('[data-quiz-reset]'))answers=[]});
  renderQuiz();best()
 }
})();

