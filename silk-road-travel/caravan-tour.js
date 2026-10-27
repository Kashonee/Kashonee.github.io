'use strict';
(()=>{
 const dialog=document.getElementById('caravanDialog');if(!dialog)return;
 const $=id=>document.getElementById(id),esc=SRT.escape;
 const stops=[
  {city:'turkestan',site:'turkestan',chapter:'РУХАНИ ОРТАЛЫҚ',story:'Ясы атауымен белгілі Түркістан сауда мен рухани байланыстың маңызды орталығы болды. Қожа Ахмет Ясауи кесенесі 2003 жылы UNESCO Дүниежүзілік мұра тізіміне енді.'},
  {city:'otyrar',site:'arystanbab',chapter:'СЫРДАРИЯ БОЙЫНДАҒЫ ТОРАП',story:'Арыс пен Сырдария тоғысындағы Отырар керуен жолдарының маңызды торабы болды. Бұл аялдамада Отырар өңіріндегі Арыстанбаб кесенесін көреміз; Отырар қалашығы одан бөлек орналасқан.'},
  {city:'sairam',site:'sairam',chapter:'ИСПИДЖАБ МҰРАСЫ',story:'Ортағасырлық Испиджабпен байланысты Сайрам сауда және мәдени байланыстар орталығы болды. Қарашаш ана мен Ибраһим ата кесенелері осы өңірдің рухани мұрасын танытады.'},
  {city:'taraz',site:'aisha-bibi',chapter:'ТАЛАС АҢҒАРЫ',story:'Тараз Талас аңғарындағы көне қалалық мәдениет пен сауда орталығы болды. Қала маңындағы Айша бибі кесенесі өңірдің сәулет мұрасын танытады; Көне Тараз қалашығы қала ішінде орналасқан.'},
  {city:'talgar',site:'talgar',chapter:'ТАУ ЕТЕГІНДЕГІ САУДА',story:'Іле Алатауы етегіндегі ортағасырлық Талхирде қолөнер мен сауда дамыды. Талхир қалашығы UNESCO тізіміндегі Жібек жолының Чанъань–Тянь-Шань дәлізінің құрамына кіреді.'},
  {city:'qoylyq',site:'qoylyq',chapter:'ЖЕТІСУДАҒЫ КЕЗДЕСУ',story:'Қарлұқ дәуіріндегі Қаялықта сауда, мәдениет және діни байланыстар тоғысты. Қазіргі Қойлық ауылының шығыс шетіндегі қалашық UNESCO Жібек жолы дәлізінің құрамына кіреді.'}
 ];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let map=null,markers=[],flightCleanup=null,progressTimer=null,photoTimer=null,opener=null,lastIndex=-1,resizeFrame=null;
 function mapMessage(text){$('caravanMapMessage').textContent=text;$('caravanMapMessage').hidden=!text;}
 function halt(){if(flightCleanup){const clean=flightCleanup;flightCleanup=null;clean();}map?.stop();}
 function prepareMap(){
  if(map)return;
  if(typeof window.L==='undefined'){
   $('caravanMap').innerHTML='<iframe id="caravanMapFallback" title="Саяхат аялдамасының OpenStreetMap картасы" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
   mapMessage('Карта анимациясы жүктелмеді. Фотосаяхат пен аялдамаларды таңдау қолжетімді.');return;
  }
  map=L.map('caravanMap',{scrollWheelZoom:false,minZoom:4,maxZoom:17,zoomControl:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,noWrap:true,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map).on('tileerror',()=>mapMessage('Карта суреті жүктелмеді. Интернет байланысын тексеріңіз; фото мен тарихты оқуға болады.')).on('tileload',()=>mapMessage(''));
  L.control.scale({imperial:false}).addTo(map);
  markers=stops.map((stop,i)=>{const site=placeById[stop.site],city=byId[stop.city];const marker=L.marker([site.lat,site.lon],{title:city.name,alt:city.name,icon:L.divIcon({className:'caravan-marker-shell',html:'<span class="caravan-marker">'+(i+1)+'</span>',iconSize:[38,38],iconAnchor:[19,19]})}).addTo(map);marker.bindTooltip(city.name,{direction:'top',offset:[0,-20]});marker.on('click',()=>engine.go(i,engine.snapshot().playing));return marker;});
  map.fitBounds(stops.map(stop=>{const p=placeById[stop.site];return[p.lat,p.lon];}),{padding:[55,55],animate:false});
  // A user who moves the map is reading; don't pull it away automatically.
  map.on('dragstart',()=>engine.pause());
 }
 function travel(index){
  const p=placeById[stops[index].site];
  markers.forEach((marker,i)=>{const el=marker.getElement();el?.classList.toggle('is-current',i===index);el?.classList.toggle('is-visited',i<index);marker.setZIndexOffset(i===index?1000:0);});
  if(!map){const frame=$('caravanMapFallback');if(frame)frame.src='https://www.openstreetmap.org/export/embed.html?bbox='+[p.lon-.025,p.lat-.015,p.lon+.025,p.lat+.015].join('%2C')+'&layer=mapnik&marker='+p.lat+'%2C'+p.lon;return Promise.resolve();}
  map.invalidateSize({animate:false,pan:false});
  if(reduced.matches){map.setView([p.lat,p.lon],14,{animate:false});return Promise.resolve();}
  return new Promise(resolve=>{
   let timeout;
   const done=()=>{clearTimeout(timeout);map.off('moveend',done);if(flightCleanup===done)flightCleanup=null;resolve();};
   flightCleanup=done;map.once('moveend',done);
   timeout=setTimeout(()=>{map.stop();map.setView([p.lat,p.lon],14,{animate:false});done();},3600);
   try{map.flyTo([p.lat,p.lon],14,{duration:2.6,easeLinearity:.25});}catch{done();mapMessage('Карта қозғалысы қолжетімсіз. Аялдама туралы мәлімет көрсетілді.');}
  });
 }
 function photo(index){
  clearTimeout(photoTimer);const city=byId[stops[index].city],image=$('caravanPhoto'),url=cityImage(city);image.hidden=true;$('caravanPhotoState').hidden=false;$('caravanPhotoState').textContent='Фотосурет жүктелуде…';
  const fail=()=>{if(lastIndex!==index)return;clearTimeout(photoTimer);image.hidden=true;$('caravanPhotoState').hidden=false;$('caravanPhotoState').textContent='Фотосурет жүктелмеді. Төмендегі «Фото дереккөзі» сілтемесін ашуға болады.';};
  image.onload=()=>{if(lastIndex!==index)return;clearTimeout(photoTimer);image.style.removeProperty('display');image.hidden=false;$('caravanPhotoState').hidden=true;};image.onerror=fail;
  image.alt=city.photoSubject;image.src=url;photoTimer=setTimeout(fail,12000);
  $('caravanPhotoCaption').textContent=city.photoSubject;
  $('caravanPhotoCredit').innerHTML=photoAttribution(city);
  $('caravanPhotoSource').href=city.photoPage;
 }
 function updateProgress(){const s=engine.snapshot();$('caravanProgressFill').style.transform='scaleX('+Math.max(0,Math.min(1,s.progress))+')';$('caravanProgress').setAttribute('aria-valuenow',String(Math.round(s.progress*100)));$('caravanProgressLabel').textContent=s.phase==='finished'?'Алты тарихи орталықпен таныстыңыз.':s.phase==='traveling'?'Карта келесі аялдамаға жақындап келеді…':s.playing?'Келесі аялдамаға '+Math.ceil(s.remainingMs/1000)+' секунд':'Пауза · оқуға асықпаңыз';}
 function render(s){
  if(s.index<0)return;
  const stop=stops[s.index],city=byId[stop.city],site=placeById[stop.site];
  if(lastIndex!==s.index){lastIndex=s.index;photo(s.index);$('caravanCity').textContent=city.name;$('caravanChapter').textContent=stop.chapter;$('caravanStory').textContent=stop.story;$('caravanSite').textContent=site.name;$('caravanHistorySource').href=city.source;$('caravanCityLink').href='./city-'+city.id+'.html';$('caravanStoryPanel').scrollTop=0;}
  $('caravanCount').textContent=String(s.index+1).padStart(2,'0')+' / 06';
  $('caravanStatus').textContent=s.phase==='finished'?'Сапар аяқталды':s.playing?(s.phase==='traveling'?'Келесі аялдамаға жол':'Тарихпен танысу'):'Сапар кідіртілді';
  $('caravanPause').textContent=s.phase==='finished'?'Қайта бастау':s.playing?'Пауза':'Жалғастыру';
  $('caravanPrevious').disabled=s.index===0;$('caravanNext').disabled=s.index===stops.length-1;
  $('caravanStoryPanel').classList.toggle('is-traveling',s.phase==='traveling');
  $('caravanStops').querySelectorAll('button').forEach((button,i)=>{if(i===s.index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');button.classList.toggle('is-visited',i<s.index);});
  $('caravanAnnounce').textContent=(s.phase==='finished'?'Сапар аяқталды. ':s.phase==='traveling'?'Жақындап келеміз: ':'Аялдама: ')+city.name+'. '+(s.index+1)+' / 6.';
  updateProgress();
 }
 const engine=new CaravanJourney({count:stops.length,travel,halt,change:render});
 $('caravanStops').innerHTML=stops.map((stop,i)=>'<li><button type="button" data-caravan-stop="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+esc(byId[stop.city].name)+'</button></li>').join('');
 $('caravanStops').addEventListener('click',e=>{const button=e.target.closest('[data-caravan-stop]');if(button)engine.go(Number(button.dataset.caravanStop),engine.snapshot().playing);});
 function close(){if(document.fullscreenElement===dialog)document.exitFullscreen?.().catch(()=>{});dialog.close();}
 function cleanup(){engine.stop();clearInterval(progressTimer);clearTimeout(photoTimer);cancelAnimationFrame(resizeFrame);progressTimer=null;lastIndex=-1;document.body.classList.remove('caravan-is-open');opener?.focus({preventScroll:true});}
 $('caravanLaunch').addEventListener('click',()=>{
  opener=document.activeElement;dialog.showModal();document.body.classList.add('caravan-is-open');lastIndex=-1;
  prepareMap();map?.invalidateSize({animate:false,pan:false});engine.start();clearInterval(progressTimer);progressTimer=setInterval(updateProgress,200);$('caravanPause').focus({preventScroll:true});
 });
 $('caravanPause').addEventListener('click',()=>engine.snapshot().playing?engine.pause():engine.resume());
 $('caravanNext').addEventListener('click',()=>engine.next());$('caravanPrevious').addEventListener('click',()=>engine.previous());$('caravanReplay').addEventListener('click',()=>engine.start());$('caravanClose').addEventListener('click',close);dialog.addEventListener('close',cleanup);
 $('caravanFullscreen').hidden=!dialog.requestFullscreen;
 $('caravanFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===dialog)await document.exitFullscreen();else await dialog.requestFullscreen();}catch{$('caravanAnnounce').textContent='Браузер толық экранға рұқсат бермеді. Кеңейтілген көрсетілім ашық.';}});
 document.addEventListener('fullscreenchange',()=>{$('caravanFullscreen').textContent=document.fullscreenElement===dialog?'Экраннан шығу':'Толық экран';resize();});
 function resize(){if(!dialog.open)return;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>map?.invalidateSize({animate:false,pan:false}));}
 window.addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)engine.pause();});
 reduced.addEventListener?.('change',()=>{if(dialog.open)engine.pause();});
 dialog.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea'))return;if(e.key==='Escape')return;if(e.target.closest('#caravanMap'))return;if(e.key==='ArrowRight'){e.preventDefault();engine.next();}else if(e.key==='ArrowLeft'){e.preventDefault();engine.previous();}else if(e.code==='Space'&&!e.target.closest('button,a')){e.preventDefault();engine.snapshot().playing?engine.pause():engine.resume();}});
 // Reading a linked source pauses playback before the new tab opens.
 dialog.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>engine.pause()));
 ['wheel','touchstart'].forEach(event=>$('caravanStoryPanel').addEventListener(event,()=>engine.pause(),{passive:true}));
})();
