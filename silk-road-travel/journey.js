'use strict';
(()=>{
 const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s)), esc=SRT.escape;
 function links(){ $$('a[href="./map.html"],a[href="./routes.html"],a[href="./calculator.html"],a[data-plan-link]').forEach(a=>{const page=a.dataset.planLink||a.getAttribute('href').split('/').pop();a.dataset.planLink=page;a.href=SRT.href(page);}); }
 document.addEventListener('srt:planchange',links);
 const tickets=new WeakMap();
 function roadPanel(el,plan,refresh=false){
  const ticket=(tickets.get(el)||0)+1;tickets.set(el,ticket);const list=SRT.ids(plan);
  if(list.length<2){el.innerHTML='<p role="status">Есептеу үшін кемінде екі нысанды таңдаңыз.</p>';return;}
  const paint=item=>{if(tickets.get(el)!==ticket)return;el.innerHTML=SRT.metrics(item,plan)+SRT.legs(item,plan)+SRT.navigation(list)+'<button type="button" class="outline-btn" data-road-retry>Жол дерегін жаңарту</button>';el.querySelector('[data-road-retry]').onclick=()=>roadPanel(el,SRT.state,true);document.dispatchEvent(new CustomEvent('srt:roadready',{detail:{item,plan}}));};
  const hit=SRT.cached(list);if(hit&&!refresh){paint(hit);return;}
  el.innerHTML='<p class="road-loading" role="status">Автомобиль жолы мен уақыты есептелуде…</p>'+SRT.navigation(list);
  SRT.route(list,refresh).then(paint).catch(()=>{if(tickets.get(el)!==ticket)return;el.innerHTML='<p role="status">Жол сервисінен жауап алынбады. Учаскелерді навигаторда ашып, жолды тексеріңіз.</p>'+SRT.navigation(list)+'<button type="button" class="outline-btn" data-road-retry>Қайта есептеу</button>';el.querySelector('[data-road-retry]').onclick=()=>roadPanel(el,SRT.state,true);});
 }

 function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 if($('#routeResult')){
  selectedRoute=SRT.state.kind;custom=[...SRT.state.stops];
  renderBuilder=function(){
   const changed=selectedRoute!==SRT.state.kind||custom.join('|')!==SRT.state.stops.join('|');const plan=SRT.save({kind:selectedRoute,stops:custom,visit:changed?null:SRT.state.visit});
   $('#customBuilder').hidden=selectedRoute!=='custom';$('#routePreset').hidden=selectedRoute==='custom';
   $$('.segmented button').forEach(b=>{const active=b.dataset.route===selectedRoute;b.classList.toggle('selected',active);b.setAttribute('aria-selected',String(active));});
   const preset=presets[selectedRoute],list=SRT.ids(plan),unique=[...new Set(list)],heritage=unique.filter(id=>!placeById[id].transit);
   if(preset)$('#routePreset').innerHTML='<div class="route-intro"><h3>'+esc(preset.name)+'</h3><p>'+list.map(id=>esc(placeById[id].name)).join(' → ')+'</p></div>'+preset.schedule.map(day=>'<details class="route-day"><summary>'+esc(day[0])+'</summary><p>'+esc(day[1])+'</p></details>').join('')+'<p class="road-note">Күндер бойынша бөліну — сапар жоспары. Жол мен аралау уақыты калькуляторда жеке есептеледі.</p>';
   $('#customChoices').innerHTML=[...heritageSites,...transitSites].map(site=>'<button type="button" class="city-choice '+(custom.includes(site.id)?'chosen':'')+'" data-place="'+site.id+'" aria-pressed="'+custom.includes(site.id)+'">'+esc(site.name)+'</button>').join('');
   $('#selectedCities').innerHTML=custom.length?custom.map((id,i)=>'<div class="chosen-stop"><span>'+(i+1)+'. '+esc(placeById[id].name)+'</span><button type="button" data-move="'+i+'" data-dir="-1" '+(i===0?'disabled':'')+' aria-label="Аялдаманы алға жылжыту">↑</button><button type="button" data-move="'+i+'" data-dir="1" '+(i===custom.length-1?'disabled':'')+' aria-label="Аялдаманы кейін жылжыту">↓</button><button type="button" data-drop="'+id+'" aria-label="Аялдаманы алып тастау">×</button></div>').join(''):'<p>Аялдамаларды сапар ретімен таңдаңыз.</p>';
   if(!$('#returnTrip'))$('#customBuilder').insertAdjacentHTML('beforeend','<label class="return-trip"><input id="returnTrip" type="checkbox"> Бастапқы нүктеге қайту</label>');$('#returnTrip').checked=plan.round;
   $('#routeResult').innerHTML='<div class="res-kicker">МЕНІҢ МАРШРУТЫМ</div><h3>'+(preset?preset.days+' күндік бағдар':'Өз бағытым')+'</h3><p>'+heritage.length+' тарихи нысан · '+list.length+' аялдама</p><ol class="route-stop-list">'+list.map(id=>'<li>'+esc(placeById[id].name)+(placeById[id].transit?' <small>транзит</small>':'')+'</li>').join('')+'</ol>'+(list.length>=2?'<a class="outline-btn" data-plan-link="calculator.html" href="'+SRT.href('calculator.html')+'">Қашықтық пен уақытты есептеу</a><a class="outline-btn" data-plan-link="map.html" href="'+SRT.href('map.html')+'">Аялдамаларды картадан көру</a>':'<p>Жалғастыру үшін кемінде екі аялдама таңдаңыз.</p>');
   $('#exportRoute').disabled=list.length===0;links();
  };
  document.addEventListener('click',e=>{const add=e.target.closest('[data-place]'),move=e.target.closest('[data-move]'),drop=e.target.closest('[data-drop]');if(add){const id=add.dataset.place;custom=custom.includes(id)?custom.filter(x=>x!==id):[...custom,id];renderBuilder();}if(move){const i=Number(move.dataset.move),j=i+Number(move.dataset.dir);if(j>=0&&j<custom.length){[custom[i],custom[j]]=[custom[j],custom[i]];renderBuilder();}}if(drop){custom=custom.filter(x=>x!==drop.dataset.drop);renderBuilder();}});
  document.addEventListener('change',e=>{if(e.target.id==='returnTrip'){SRT.save({round:e.target.checked});renderBuilder();}});
  $('#exportRoute').onclick=()=>{const list=SRT.ids();download('Silk Road Travel — аялдамалар жоспары\n\n'+list.map((id,i)=>{const site=placeById[id];return(i+1)+'. '+site.name+'\n'+site.lat+', '+site.lon;}).join('\n\n')+'\n\nМаршрут: '+new URL(SRT.href('routes.html'),location.href)+'\nҚашықтық пен уақыт: '+new URL(SRT.href('calculator.html'),location.href),'Silk_Road_Travel_stops.txt');};
  renderBuilder();
 }
 if($('#calcOutput')){
  const slider=$('#calcSpeed'),number=$('#calcSpeedNumber'),mode=$('#calcTimeMode');
  function calculate(patch={}){
   const plan=SRT.save(patch),list=SRT.ids(plan);mode.value=plan.timeMode;slider.value=plan.speed;number.value=plan.speed;
   $('#calcPlanName').textContent=presets[plan.kind]?.name||'Өз бағытым';$('#calcPlanPath').textContent=list.length?list.map(id=>placeById[id].name).join(' → '):'Маршруттар бөлімінен аялдамаларды таңдаңыз.';
   $('#calcVisit').max=48;$('#calcVisit').step='.25';$('#calcVisit').value=SRT.visits(plan);$('#calcVisitText').textContent=SRT.visits(plan)+' сағ';$('#calcBreak').value=plan.pause;$('#calcBreakText').textContent=plan.pause+' мин';
   $('#calcModeStatus').textContent=plan.timeMode==='manual'?'Өз есебіңіз қосылды: '+plan.speed+' км/сағ.':'Қазір карта сервисінің уақыт болжамы көрсетіледі. Жылдамдықты енгізсеңіз, өз есебіңіз қосылады.';
   $('#calcExportStatus').textContent='';roadPanel($('#calcOutput'),plan);links();
  }
  function useSpeed(value){number.setCustomValidity('');calculate({speed:Number(value),timeMode:'manual'});}
  slider.addEventListener('input',()=>useSpeed(slider.value));
  number.addEventListener('input',()=>{const n=Number(number.value);if(number.value!==''&&Number.isInteger(n)&&n>=20&&n<=140)useSpeed(n);});
  number.addEventListener('change',()=>{const n=Number(number.value);if(number.value===''||!Number.isInteger(n)||n<20||n>140){number.setCustomValidity('20 мен 140 аралығындағы бүтін санды енгізіңіз.');number.reportValidity();}else useSpeed(n);});
  mode.addEventListener('change',()=>{number.setCustomValidity('');calculate({timeMode:mode.value});});
  $('#calcVisit').addEventListener('input',e=>calculate({visit:Number(e.target.value)}));$('#calcBreak').addEventListener('input',e=>calculate({pause:Number(e.target.value)}));
  $('#exportCalculation').onclick=()=>{const plan=SRT.state,item=SRT.cached(SRT.ids());if(!item){$('#calcExportStatus').textContent='Алдымен автожол есебінің жүктелуін күтіңіз.';return;}const route=item.data.routes[0],t=SRT.total(item,plan);download('Silk Road Travel — сапар есебі\n'+item.ids.map(id=>placeById[id].name).join(' → ')+'\n'+SRT.km(route.distance)+' км\nЕсеп: '+(plan.timeMode==='manual'?'өз орташа жылдамдығым '+plan.speed+' км/сағ':'карта сервисінің болжамы')+'\nЖол: '+fmtHours(t.road)+'\nКарта сервисінің бастапқы болжамы: '+fmtHours(t.service)+'\nАралау: '+fmtHours(t.visit)+'\nҮзіліс: '+fmtHours(t.breaks)+'\nБарлығы: '+fmtHours(t.total)+'\n\n'+route.legs.map((leg,i)=>placeById[item.ids[i]].name+' → '+placeById[item.ids[i+1]].name+': '+SRT.km(leg.distance)+' км · '+fmtHours(plan.timeMode==='manual'?leg.distance/1000/plan.speed:leg.duration/3600)).join('\n')+'\n\nДерек: '+item.provider+'\n'+item.url+'\nАлынған уақыты: '+new Date(item.time).toLocaleString('kk-KZ')+'\nЖоспар: '+new URL(SRT.href('calculator.html'),location.href)+'\nУақыт — болжам. Түнеу, кептеліс пен ауа райы есепке кірмейді.','Silk_Road_Travel_calculation.txt');};
  calculate();
 }
 function passport(site){return '<article class="visit-card"><h3>'+esc(site.name)+'</h3><dl><dt>Орналасуы</dt><dd>'+esc(site.location)+'</dd><dt>Аралау үшін жоспар</dt><dd>'+site.minutes+' минут · авторлық жоспарлау шамасы</dd><dt>Жұмыс уақыты</dt><dd>'+esc(site.hours||'Расталған кесте енгізілмеген; ресми дереккөзден нақтылаңыз')+'</dd><dt>Кіру ақысы</dt><dd>'+esc(site.fee||'Расталған тариф енгізілмеген')+'</dd>'+(site.phone?'<dt>Порталда жарияланған байланыс</dt><dd><a href="tel:'+site.phone.replace(/[^+\d]/g,'')+'">'+site.phone+'</a></dd>':'')+'</dl><p class="road-note">'+esc(site.access||'')+'</p><p class="road-note">Координат нысанды белгілейді. Автокөлік кіреберісі мен қолжетімділік жағдайы бөлек тексеріледі.</p><div class="passport-actions"><a href="'+SRT.drivingLink(null,site.id)+'" target="_blank" rel="noopener">Көлікпен жету</a><a href="'+SRT.mapLink(site)+'" target="_blank" rel="noopener">Нақты орнын ашу</a>'+(site.coordinateSource?'<a href="'+site.coordinateSource+'" target="_blank" rel="noopener">Координат дереккөзі</a>':'')+'<a href="'+site.source+'" target="_blank" rel="noopener">'+site.sourceName+'</a>'+(site.visitSource?'<a href="'+site.visitSource+'" target="_blank" rel="noopener">Келушіге арналған дереккөз</a>':'')+(site.ticketSource?'<a href="'+site.ticketSource+'" target="_blank" rel="noopener">Ресми билет бағалары</a>':'')+'<a href="./routes.html?add='+site.id+'">Маршрутқа қосу</a></div><small>Дереккөзді тексеру күні: '+(site.checked||'27.10.2026')+'. Кесте мен тариф өзгеруі мүмкін.</small></article>';}
 const cityMatch=location.pathname.match(/city-([a-z]+)\.html$/);
 if(cityMatch){const c=cityMatch[1],section=document.createElement('section');section.className='section visitor-section';section.innerHTML='<div class="wrap"><div class="kicker">БАРУҒА АРНАЛҒАН МӘЛІМЕТ</div><h2>Әр ескерткіш — бөлек аялдама.</h2><div class="visitor-grid">'+heritageSites.filter(s=>s.city===c).map(passport).join('')+'</div></div>';const before=$('.next-city');before?before.before(section):$('main').append(section);}
 links();
})();
