'use strict';
(()=>{
 const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s)), esc=SRT.escape;
 function links(){ $$('a[href="./map.html"],a[href="./routes.html"],a[href="./calculator.html"],a[data-plan-link]').forEach(a=>{const page=a.dataset.planLink||a.getAttribute('href').split('/').pop();a.dataset.planLink=page;a.href=SRT.href(page);}); }
 document.addEventListener('srt:planchange',links);
 const tickets=new WeakMap();
 function roadPanel(el,plan,refresh=false){
  const ticket=(tickets.get(el)||0)+1;tickets.set(el,ticket);const list=SRT.ids(plan);
  if(list.length<2){el.innerHTML='<p role="status">Есептеу үшін кемінде екі нысанды таңдаңыз.</p>';return;}
  const paint=item=>{if(tickets.get(el)!==ticket)return;el.innerHTML=SRT.metrics(item,plan)+SRT.legs(item,plan)+SRT.navigation(list)+'<button type="button" class="outline-btn" data-road-retry>Жол дерегін жаңарту</button>';el.querySelector('[data-road-retry]').onclick=()=>roadPanel(el,SRT.state,true);};
  const hit=SRT.cached(list);if(hit&&!refresh){paint(hit);return;}
  el.innerHTML='<p class="road-loading" role="status">Автомобиль жолы мен уақыты есептелуде…</p>'+SRT.navigation(list);
  SRT.route(list,refresh).then(paint).catch(()=>{if(tickets.get(el)!==ticket)return;el.innerHTML='<p role="status">Жол сервисінен жауап алынбады. Учаскелерді навигаторда ашып, жолды тексеріңіз.</p>'+SRT.navigation(list)+'<button type="button" class="outline-btn" data-road-retry>Қайта есептеу</button>';el.querySelector('[data-road-retry]').onclick=()=>roadPanel(el,SRT.state,true);});
 }
 if($('#routeResult')){
  selectedRoute=SRT.state.kind;custom=[...SRT.state.stops];speed=SRT.state.speed;
  const speedSlider=$('#speed');speedSlider.min=20;speedSlider.max=140;speedSlider.value=speed;
  renderBuilder=function(){
   const changed=selectedRoute!==SRT.state.kind||custom.join('|')!==SRT.state.stops.join('|');const plan=SRT.save({kind:selectedRoute,stops:custom,speed,visit:changed?null:SRT.state.visit});links();
   $('#speedValue').textContent=speed+' км/сағ';$('#routeTimeMode').value=plan.timeMode;$('#routeManualSpeed').hidden=plan.timeMode!=='manual';
   $('#customBuilder').hidden=selectedRoute!=='custom';$('#routePreset').hidden=selectedRoute==='custom';
   $$('.segmented button').forEach(b=>{const on=b.dataset.route===selectedRoute;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});
   const p=presets[selectedRoute], list=SRT.ids(plan);
   if(p)$('#routePreset').innerHTML='<div class="route-intro"><h3>'+p.name+'</h3><p>'+list.map(id=>esc(placeById[id].name)).join(' → ')+'</p></div>'+p.schedule.map(day=>'<details class="route-day"><summary>'+day[0]+'</summary><p>'+day[1]+'</p></details>').join('')+'<p class="road-note">Қала орталықтары — транзит нүктелері. Нақты қонақүй немесе көлік тұрағы маршрутқа кірмейді.</p>';
   $('#customChoices').innerHTML=[...heritageSites,...transitSites].map(s=>'<button type="button" class="city-choice '+(custom.includes(s.id)?'chosen':'')+'" data-place="'+s.id+'" aria-pressed="'+custom.includes(s.id)+'">'+esc(s.name)+'</button>').join('');
   $('#selectedCities').innerHTML=custom.length?custom.map((id,i)=>'<div class="chosen-stop"><span>'+(i+1)+'. '+esc(placeById[id].name)+'</span><button type="button" data-move="'+i+'" data-dir="-1" '+(i===0?'disabled':'')+' aria-label="Алға жылжыту">↑</button><button type="button" data-move="'+i+'" data-dir="1" '+(i===custom.length-1?'disabled':'')+' aria-label="Кейін жылжыту">↓</button><button type="button" data-drop="'+id+'" aria-label="Аялдаманы алып тастау">×</button></div>').join(''):'<p>Нысандарды сапар ретімен таңдаңыз.</p>';
   if(!$('#returnTrip'))$('#customBuilder').insertAdjacentHTML('beforeend','<label class="return-trip"><input id="returnTrip" type="checkbox"> Бастапқы нүктеге қайту</label>');$('#returnTrip').checked=plan.round;
   $('#routeResult').innerHTML='<div class="res-kicker">САПАР ЖОСПАРЫ</div><h3>'+(p?p.days+' күндік бағдар':'Өз бағытым')+'</h3><p>'+list.map(id=>esc(placeById[id].name)).join(' → ')+'</p><div id="routeRoad"></div>'+'<a class="outline-btn" data-plan-link="map.html" href="'+SRT.href('map.html')+'">Осы маршрутты картадан көру</a>';
   roadPanel($('#routeRoad'),plan);links();
  };
  document.addEventListener('click',e=>{const add=e.target.closest('[data-place]'),move=e.target.closest('[data-move]'),drop=e.target.closest('[data-drop]');if(add){const id=add.dataset.place;custom=custom.includes(id)?custom.filter(x=>x!==id):[...custom,id];renderBuilder();}if(move){const i=Number(move.dataset.move),j=i+Number(move.dataset.dir);if(j>=0&&j<custom.length){[custom[i],custom[j]]=[custom[j],custom[i]];renderBuilder();}}if(drop){custom=custom.filter(x=>x!==drop.dataset.drop);renderBuilder();}});
  document.addEventListener('change',e=>{if(e.target.id==='returnTrip'){SRT.save({round:e.target.checked});renderBuilder();}});
  $('#routeTimeMode').addEventListener('change',e=>{SRT.save({timeMode:e.target.value});renderBuilder();});
  $('#exportRoute').onclick=()=>{const plan=SRT.state,item=SRT.cached(SRT.ids());if(!item){$('#routeRoad').insertAdjacentHTML('beforeend','<p role="status">Жүктеу үшін алдымен жол есебін алыңыз.</p>');return;}const r=item.data.routes[0],timing=SRT.total(item,plan),text='Silk Road Travel\n'+item.ids.map(id=>placeById[id].name).join(' → ')+'\n'+SRT.km(r.distance)+' км\nЕсеп: '+(plan.timeMode==='manual'?'өз орташа жылдамдығым '+plan.speed+' км/сағ':'автомобиль сервисі')+'\nТаза жүріс: '+fmtHours(timing.road)+'\nҮзіліс пен аралау: '+fmtHours(timing.breaks+timing.visit)+'\n'+r.legs.map((l,i)=>placeById[item.ids[i]].name+' → '+placeById[item.ids[i+1]].name+': '+SRT.km(l.distance)+' км · '+fmtHours(plan.timeMode==='manual'?l.distance/1000/plan.speed:l.duration/3600)+'\n'+SRT.drivingLink(item.ids[i],item.ids[i+1])).join('\n')+'\nДерек: '+item.provider+'\n'+item.url+'\nАлынған күні: '+new Date(item.time).toLocaleDateString('kk-KZ')+'\nЖоспар сілтемесі: '+new URL(SRT.href('map.html'),location.href)+'\nКіру жолы, жұмыс уақыты, жол жағдайы сапар алдында тексеріледі.';const u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='Silk_Road_Travel_route.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
  renderBuilder();
 }
 if($('#calcOutput')){
  const route=$('#calcRoute');route.value=SRT.state.kind;$('#calcSpeed').min=20;$('#calcSpeed').max=140;$('#calcTimeMode').value=SRT.state.timeMode;$('#calcSpeed').value=SRT.state.speed;$('#calcVisit').max=48;$('#calcVisit').step='.25';$('#calcVisit').value=SRT.visits();$('#calcBreak').value=SRT.state.pause;
  $('#calcRoute').querySelector('option[value="custom"]').textContent='Менің таңдалған нысандарым';
  const explain=document.createElement('p');explain.className='road-note';explain.innerHTML='Қашықтық картадағы нысандарға дейінгі автожолдан алынады. <a data-plan-link="routes.html" href="'+SRT.href('routes.html')+'">Нысандарды өзгерту</a>';$('#calcRoute').parentElement.append(explain);
  function calculate(reset=false){const plan=SRT.save({kind:route.value,timeMode:$('#calcTimeMode').value,speed:Number($('#calcSpeed').value),visit:reset?null:Number($('#calcVisit').value),pause:Number($('#calcBreak').value)});$('#calcManualSpeed').hidden=plan.timeMode!=='manual';if(reset)$('#calcVisit').value=SRT.visits(plan);$('#calcSpeedText').textContent=plan.speed+' км/сағ';$('#calcVisitText').textContent=SRT.visits(plan)+' сағ';$('#calcBreakText').textContent=plan.pause+' мин';roadPanel($('#calcOutput'),plan);links();}
  route.addEventListener('change',()=>calculate(true));$('#calcTimeMode').addEventListener('change',()=>calculate());['calcSpeed','calcVisit','calcBreak'].forEach(id=>$('#'+id).addEventListener('input',()=>calculate()));calculate();
 }
 function passport(site){return '<article class="visit-card"><h3>'+esc(site.name)+'</h3><dl><dt>Орналасуы</dt><dd>'+esc(site.location)+'</dd><dt>Аралау үшін жоспар</dt><dd>'+site.minutes+' минут · авторлық жоспарлау шамасы</dd><dt>Жұмыс уақыты</dt><dd>'+esc(site.hours||'Расталған кесте енгізілмеген; ресми дереккөзден нақтылаңыз')+'</dd><dt>Кіру ақысы</dt><dd>'+esc(site.fee||'Расталған тариф енгізілмеген')+'</dd>'+(site.phone?'<dt>Порталда жарияланған байланыс</dt><dd><a href="tel:'+site.phone.replace(/[^+\d]/g,'')+'">'+site.phone+'</a></dd>':'')+'</dl><p class="road-note">Координат нысанды белгілейді. Автокөлік кіреберісі мен қолжетімділік жағдайы бөлек тексеріледі.</p><div class="passport-actions"><a href="'+SRT.drivingLink(null,site.id)+'" target="_blank" rel="noopener">Көлікпен жету</a><a href="'+SRT.mapLink(site)+'" target="_blank" rel="noopener">Нақты орнын ашу</a>'+(site.coordinateSource?'<a href="'+site.coordinateSource+'" target="_blank" rel="noopener">Координат дереккөзі</a>':'')+'<a href="'+site.source+'" target="_blank" rel="noopener">'+site.sourceName+'</a><a href="./routes.html?add='+site.id+'">Маршрутқа қосу</a></div><small>Дереккөзді тексеру күні: 27.10.2026. Кесте мен тариф өзгеруі мүмкін.</small></article>';}
 const cityMatch=location.pathname.match(/city-([a-z]+)\.html$/);
 if(cityMatch){const c=cityMatch[1],section=document.createElement('section');section.className='section visitor-section';section.innerHTML='<div class="wrap"><div class="kicker">БАРУҒА АРНАЛҒАН МӘЛІМЕТ</div><h2>Әр ескерткіш — бөлек аялдама.</h2><div class="visitor-grid">'+heritageSites.filter(s=>s.city===c).map(passport).join('')+'</div></div>';const before=$('.next-city');before?before.before(section):$('main').append(section);}
 if($('#virtualCard')){
  const currentRender=renderVirtual;renderVirtual=function(){currentRender();const c=cities[virtualIndex],task=observationTasks[c.id],s=placeById[c.id];
   $('#virtualCard').insertAdjacentHTML('beforeend','<div class="tour-learning"><h3>Бақыла және түсіндір</h3><p>'+task.focus+'</p><details><summary>'+task.question+'</summary><p>'+task.answer+'</p></details><div class="passport-actions">'+heritageSites.filter(x=>x.city===c.id).map(x=>'<a href="./map.html?city='+x.id+'">'+x.name+'</a>').join('')+'</div></div>');
   if(!cityImage(c)){const photo=$('#virtualCard .tour-photo');photo.innerHTML='<iframe title="'+c.name+' тарихи орнының картасы" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox='+[s.lon-.02,s.lat-.012,s.lon+.02,s.lat+.012].join('%2C')+'&layer=mapnik&marker='+s.lat+'%2C'+s.lon+'"></iframe><span class="map-view-label">Нақты орынның картасы · OpenStreetMap</span>';$('#virtualCard').classList.add('tour-map-view');}else $('#virtualCard').classList.remove('tour-map-view');
  };renderVirtual();
 }
 links();
})();
