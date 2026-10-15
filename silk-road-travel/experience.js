(function(){
 'use strict';
 const params=new URLSearchParams(location.search);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const readStore=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const writeStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 let saved=new Set(readStore('srt-saved-cities',[]).filter(id=>byId[id]));
 let toastTimer;
 function notify(message){const t=$('#toast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
 function updateSaved(){
  if($('#savedCount'))$('#savedCount').textContent=saved.size;
  $$('[data-save-city]').forEach(b=>{const chosen=saved.has(b.dataset.saveCity);b.classList.toggle('saved',chosen);b.setAttribute('aria-pressed',String(chosen));if(b.classList.contains('save-detail'))b.textContent=chosen?'✓ Саяхат тізімінде сақталған':'♡ Саяхат тізіміне сақтау';else{b.textContent=chosen?'♥':'♡';b.setAttribute('aria-label',byId[b.dataset.saveCity].name+(chosen?' қаласын тізімнен алу':' қаласын сақтау'))}})
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
   $('#cityGrid').innerHTML=found.length?found.map(card).join(''):'<p class="empty-state">'+(onlySaved?'Сақталған қала жоқ. Қала карточкасындағы ♡ белгісін бас.':'Бұл іздеуге сәйкес қала табылмады.')+'</p>';
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
 if($('#routeResult')){
  const prior=readStore('srt-route',{kind:'short',custom:[]});
  selectedRoute=presets[params.get('route')]?params.get('route'):(presets[prior.kind]||prior.kind==='custom'?prior.kind:'short');
  custom=(prior.custom||[]).filter(id=>byId[id]);
  if(byId[params.get('add')]){selectedRoute='custom';if(!custom.includes(params.get('add')))custom.push(params.get('add'))}
  const originalBuilder=renderBuilder;
  renderBuilder=function(){
   originalBuilder();
   const p=presets[selectedRoute];
   if(p){
    const names={short:['Сәулет пен археология'],medium:['Сайрам және Түркістан','Түркістан және Отырар','Шымкентке оралу'],long:['Рухани Түркістан','Отырар алқабы','Сайрамнан Таразға','Талас қалалық мәдениеті','Алматыға ұзақ жол','Талхир мен Жетісу','Қаялық және Талдықорған']};
    $$('.day-card').forEach((d,i)=>{d.innerHTML='<details '+(i===0?'open':'')+'><summary><span>'+p.schedule[i][0]+'</span>'+names[selectedRoute][i]+'</summary><p>'+p.schedule[i][1]+'</p></details>'})
   }else{
    $('#selectedCities').innerHTML=custom.length?custom.map((id,i)=>'<div><span>'+(i+1)+'. '+byId[id].name+'</span><button type="button" data-order="'+i+'" data-direction="-1" '+(i===0?'disabled':'')+' aria-label="'+byId[id].name+' қаласын алға жылжыту">↑</button><button type="button" data-order="'+i+'" data-direction="1" '+(i===custom.length-1?'disabled':'')+' aria-label="'+byId[id].name+' қаласын кейін жылжыту">↓</button><button type="button" data-remove="'+id+'" aria-label="'+byId[id].name+' қаласын маршруттан алу">×</button></div>').join(''):'<span class="placeholder">Қалаларды сапар ретімен таңдаңыз</span>'
   }
   writeStore('srt-route',{kind:selectedRoute,custom});
   const link=$('.route-actions a');if(link)link.href=selectedRoute==='custom'?'./calculator.html?distance='+customDistance():'./calculator.html?route='+selectedRoute;
  };
  renderBuilder();
  document.addEventListener('click',e=>{
   const b=e.target.closest('[data-order]');
   if(b){const i=Number(b.dataset.order),j=i+Number(b.dataset.direction);if(j>=0&&j<custom.length){[custom[i],custom[j]]=[custom[j],custom[i]];renderBuilder()}}
   const remove=e.target.closest('[data-remove]');if(remove){custom=custom.filter(id=>id!==remove.dataset.remove);renderBuilder()}
  });
  $('#exportRoute').addEventListener('click',()=>{
   const p=presets[selectedRoute],km=p?p.distance:customDistance();
   if(!p&&custom.length<2){notify('Маршрутқа кемінде екі қала қосыңыз');return}
   const list=p?p.detail:custom.map(id=>byId[id].name).join(' → ');
   const itinerary=p?p.schedule.map(x=>x[0]+': '+x[1]).join('\n'):'Қалалардың реті: '+list;
   const text='SILK ROAD TRAVEL\n\n'+(p?p.name:'Өз бағытым')+'\n'+list+'\n\nЖоспарлық аралық: '+km+' км\nТаза жол уақыты: '+fmtHours(km/speed)+' ('+speed+' км/сағ)\n\n'+itinerary+'\n\nЕСКЕРТУ\nЖол көрсеткіштері — жоспарлық модель, нақты автожол өлшемі емес. Сапар алдында кіру шартын, жолды және ауа райын тексеріңіз.\n';
   const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Silk_Road_Travel_marshrut.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Маршрут мәтін файлы ретінде жүктелді')
  })
 }
 if($('#calcOutput')){
  const names={short:'1 күндік бағдар',medium:'3 күндік бағдар',long:'7 күндік бағдар'};
  const qroute=params.get('route'),qdistance=Number(params.get('distance'));
  if(presets[qroute])$('#calcRoute').value=qroute;
  if(qdistance>0&&qdistance<=5000){$('#calcRoute').value='custom';$('#calcDistance').value=Math.round(qdistance)}
  const defaults={short:4,medium:11,long:22,custom:4};
  function calculate(resetVisit=false){
   const kind=$('#calcRoute').value,p=presets[kind];$('#customKmWrap').hidden=kind!=='custom';
   if(resetVisit)$('#calcVisit').value=defaults[kind];
   const km=p?p.distance:Number($('#calcDistance').value),v=Number($('#calcSpeed').value),visit=Number($('#calcVisit').value),pause=Number($('#calcBreak').value);
   $('#calcSpeedText').textContent=v+' км/сағ';$('#calcVisitText').textContent=visit+' сағ';$('#calcBreakText').textContent=pause+' мин';
   if(!Number.isFinite(km)||km<1||km>5000){$('#calcOutput').innerHTML='<div class="calc-error">Қашықтықты 1–5000 км аралығында енгізіңіз.</div>';return}
   const road=km/v,breaks=Math.floor(road/2)*pause/60,total=road+breaks+visit,a=road/total*360,b=(road+visit)/total*360;
   $('#calcOutput').innerHTML='<div class="calc-kicker">'+(names[kind]||'ӨЗ ҚАШЫҚТЫҒЫҢЫЗ')+' · '+km+' КМ</div><div class="time-wheel" style="--road-angle:'+a+'deg;--visit-angle:'+b+'deg;--break-angle:360deg"><div><strong>'+fmtHours(total)+'</strong><span>белсенді сапардың болжамды уақыты</span></div></div><div class="calc-result-lines"><div><span>Таза жол</span><b>'+fmtHours(road)+'</b></div><div><span>Нысандармен танысу</span><b>'+fmtHours(visit)+'</b></div><div><span>Жолдағы үзілістер</span><b>'+fmtHours(breaks)+'</b></div></div><p class="calc-disclaimer">8 сағаттық белсенді күнге шартты бөлсек: '+Math.max(1,Math.ceil(total/8))+' күн. Бұл түнеу мен нақты нысандардың жұмыс уақытын ескермейді. Қашықтық — жоспарлық модель.</p>'
  }
  $('#calcRoute').addEventListener('change',()=>calculate(true));
  ['calcDistance','calcSpeed','calcVisit','calcBreak'].forEach(id=>$('#'+id).addEventListener('input',()=>calculate()));
  calculate(true)
 }
 if($('#virtualCard')){
  renderVirtual=function(){
   const c=cities[virtualIndex],photo=cityImage(c);
   $('#virtualSteps').innerHTML=cities.map((v,i)=>'<button class="'+(i===virtualIndex?'active':'')+'" type="button" data-virtual="'+i+'" aria-label="'+v.name+' аялдамасына өту">'+String(i+1).padStart(2,'0')+'</button>').join('');
   $('#virtualCard').innerHTML='<div class="tour-photo"'+(photo?' style="background-image:url(&quot;'+photo+'&quot;)"':'')+'></div><div class="tour-shade"></div><span class="tour-ornament" aria-hidden="true">✳</span><div class="tour-text"><small>АЯЛДАМА '+String(virtualIndex+1).padStart(2,'0')+' / 06 · '+c.regionLabel+'</small><h2>'+c.name+'</h2><p>'+c.role+'</p><div class="tour-focus"><strong>МАҢЫЗДЫ ДЕРЕК</strong><p>'+c.fact+'</p></div><a href="./city-'+c.id+'.html">Қаланың толық тарихын ашу ↗</a></div><div class="tour-bottom"><span>'+c.kind+' · '+c.status+'</span><div class="virtual-nav"><button type="button" data-step="-1" aria-label="Алдыңғы аялдама" '+(virtualIndex===0?'disabled':'')+'>←</button><button type="button" data-step="1" aria-label="Келесі аялдама" '+(virtualIndex===cities.length-1?'disabled':'')+'>→</button></div></div><div class="tour-credit">'+(c.photoPage?'<a href="'+c.photoPage+'" target="_blank" rel="noopener noreferrer">'+c.credit+' · лицензия ↗</a>':'Көркем фон · фотосурет немесе реконструкция емес')+'</div>'
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
