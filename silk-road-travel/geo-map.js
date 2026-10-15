(function(){
 'use strict';
 const el=document.getElementById('liveMap');
 if(!el)return;
 const sites=[
  {id:'turkestan',label:'Қожа Ахмет Ясауи кесенесі',lat:43+17/60+51.7/3600,lon:68+16/60+15.8/3600,source:'https://whc.unesco.org/en/list/1103/maps/',sourceName:'UNESCO · географиялық деректер'},
  {id:'otyrar',label:'Отырар археологиялық орны',lat:42.852822,lon:68.302987,source:'https://rdr.ucl.ac.uk/articles/dataset/Otrar_archaeological_site_digital_geospatial_dataset_2016/11690835',sourceName:'University College London · Otrar geospatial dataset (2020)'},
  {id:'taraz',label:'Көне Тараз музейі',lat:42.89980,lon:71.36690,source:'https://kazakhstan.travel/en/attractions/199',sourceName:'Kazakhstan.travel · Көне Тараз музейі'},
  {id:'sairam',label:'Қарашаш ана кесенесі',lat:42.29930,lon:69.75746,source:'https://kazakhstan.travel/en/attractions/473',sourceName:'Kazakhstan.travel · Қарашаш ана'},
  {id:'talgar',label:'Талхир қалашығы',lat:43+16/60+40/3600,lon:77+13/60+20/3600,source:'https://whc.unesco.org/en/list/1442/maps/',sourceName:'UNESCO · 1442-012 Site of Talgar'},
  {id:'qoylyq',label:'Қаялық қалашығы',lat:45+39/60+56/3600,lon:80+15/60+38/3600,source:'https://whc.unesco.org/en/list/1442/maps/',sourceName:'UNESCO · 1442-011 Site of Kayalyk'}
 ];
 const names=Object.fromEntries(sites.map(s=>[s.id,s]));
 const params=new URLSearchParams(location.search);
 const animate=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let chosen=names[params.get('city')]?params.get('city'):'turkestan',region='all',map=null;
 const markers=new Map();
 const state=document.getElementById('mapLoadState');
 const nationalBounds=[[40.55,46.4],[55.45,87.4]];
 function osmLink(s){return'https://www.openstreetmap.org/?mlat='+s.lat.toFixed(6)+'&mlon='+s.lon.toFixed(6)+'#map=15/'+s.lat.toFixed(6)+'/'+s.lon.toFixed(6)}
 function visible(){return sites.filter(s=>region==='all'||byId[s.id].region===region)}
 function buttonMode(id){['mapFullCountry','mapAllSites','mapSelected'].forEach(key=>document.getElementById(key).classList.toggle('active',id===key))}
 function renderList(){
  document.getElementById('geoCityList').innerHTML=visible().map(s=>'<button type="button" data-geo-site="'+s.id+'" class="'+(s.id===chosen?'active':'')+'"><span>'+(sites.indexOf(s)+1)+'</span>'+byId[s.id].name+'</button>').join('')
 }
 function info(){
  const s=names[chosen],c=byId[chosen];
  document.getElementById('mapDetail').innerHTML='<div class="map-small">'+c.regionLabel+' · '+c.kind+'</div><h3>'+c.name+'</h3><div class="geo-site-name">'+s.label+'</div><p>'+c.role+'</p><div class="geo-coordinates"><span>НЫСАННЫҢ КООРДИНАТАСЫ · WGS84</span><code>'+s.lat.toFixed(6)+'° N, '+s.lon.toFixed(6)+'° E</code></div><a class="geo-marker-source-link" href="'+s.source+'" target="_blank" rel="noopener noreferrer">'+s.sourceName+' ↗</a><p>'+c.visit+'</p><div class="detail-actions"><a class="outline-btn" href="./city-'+c.id+'.html">Қала тарихы ↗</a><a class="outline-btn" href="'+osmLink(s)+'" target="_blank" rel="noopener noreferrer">OSM-та ашу ↗</a></div><p class="geo-site-footer">Белгі осы нысанға қатысты. Карточкадағы басқа кесенелер мен музейлер бөлек жерде болуы мүмкін.</p>';
  renderList()
 }
 function markerIcon(s){return L.divIcon({className:'geo-pin-icon',html:'<span class="geo-pin-dot '+(chosen===s.id?'selected':'')+'">'+(sites.indexOf(s)+1)+'</span>',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]})}
 function selectSite(id,focus=true){
  if(!names[id])return;chosen=id;info();
  if(map){sites.forEach(s=>markers.get(s.id)?.setIcon(markerIcon(s)));const s=names[id],m=markers.get(id);if(focus){buttonMode('mapSelected');map.flyTo([s.lat,s.lon],14,{animate:animate,duration:.7})}if(m&&map.hasLayer(m))m.openPopup()}
  else{const frame=document.getElementById('fallbackMapFrame'),s=names[id];if(frame)frame.src='https://www.openstreetmap.org/export/embed.html?bbox='+[s.lon-.035,s.lat-.02,s.lon+.035,s.lat+.02].join('%2C')+'&layer=mapnik&marker='+s.lat+'%2C'+s.lon}
 }
 info();
 document.getElementById('geoCityList').addEventListener('click',e=>{const b=e.target.closest('[data-geo-site]');if(b)selectSite(b.dataset.geoSite)});
 if(typeof window.L==='undefined'){
  el.innerHTML='<iframe id="fallbackMapFrame" class="map-fallback-frame" title="Қазақстанның OpenStreetMap картасы" src="https://www.openstreetmap.org/export/embed.html?bbox=46.4%2C40.5%2C87.4%2C55.5&layer=mapnik"></iframe>';state.classList.add('error');state.innerHTML='Картаның жеңіл көрінісі. Тізімнен нысанды таңдаңыз немесе <a href="https://www.openstreetmap.org/#map=5/48.2/67.1" target="_blank" rel="noopener">OSM-та ашыңыз ↗</a>';['mapFullCountry','mapAllSites','mapSelected','mapFullscreen','mapRegion'].forEach(id=>document.getElementById(id).disabled=true);return
 }
 map=L.map(el,{zoomControl:false,scrollWheelZoom:true,minZoom:3,maxZoom:19,worldCopyJump:true,zoomSnap:.25,zoomAnimation:animate,fadeAnimation:animate,markerZoomAnimation:animate});
 L.control.zoom({position:'topleft',zoomInTitle:'Жақындату',zoomOutTitle:'Алыстату'}).addTo(map);
 L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);
 map.attributionControl.setPrefix('<a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>');
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,noWrap:true,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(map);
 let tileSucceeded=false,tileFailures=0;
 tiles.on('tileload',()=>{tileSucceeded=true;state.classList.add('loaded')});
 tiles.on('tileerror',()=>{tileFailures++;if(!tileSucceeded&&tileFailures>=3){state.classList.add('error');state.innerHTML='Карта қабаты жүктелмеді. Интернетті тексеріңіз немесе <a href="https://www.openstreetmap.org/#map=5/48.2/67.1" target="_blank" rel="noopener">OSM-та ашыңыз ↗</a>'}});
 map.fitBounds(nationalBounds,{padding:[15,20]});buttonMode('mapFullCountry');
 sites.forEach(s=>{
  const c=byId[s.id],m=L.marker([s.lat,s.lon],{icon:markerIcon(s),title:c.name+': '+s.label,alt:c.name+': '+s.label,keyboard:true,riseOnHover:true});
  m.bindTooltip(c.name,{direction:'top',offset:[0,-15]});
  m.bindPopup('<b>'+c.name+'</b>'+s.label+'<br><a href="./city-'+c.id+'.html">Қала парағын ашу ↗</a>');
  m.on('click',()=>selectSite(s.id,false));m.addTo(map);markers.set(s.id,m)
 });
 function fitSites(){const points=visible().map(s=>[s.lat,s.lon]);if(points.length)map.fitBounds(points,{padding:[40,40],maxZoom:10});buttonMode('mapAllSites')}
 document.getElementById('mapFullCountry').addEventListener('click',()=>{map.fitBounds(nationalBounds,{padding:[15,20]});buttonMode('mapFullCountry')});
 document.getElementById('mapAllSites').addEventListener('click',fitSites);
 document.getElementById('mapSelected').addEventListener('click',()=>selectSite(chosen));
 document.getElementById('mapRegion').addEventListener('change',e=>{
  region=e.target.value;const shown=visible();sites.forEach(s=>{const m=markers.get(s.id),show=shown.includes(s);if(show&&!map.hasLayer(m))m.addTo(map);if(!show&&map.hasLayer(m))map.removeLayer(m)});
  if(!shown.some(s=>s.id===chosen)&&shown[0])selectSite(shown[0].id,false);renderList();fitSites()
 });
 const full=document.getElementById('mapFullscreen'),stage=document.getElementById('mapStage');
 function fullView(on){stage.classList.toggle('map-fullscreen',on);full.setAttribute('aria-pressed',String(on));full.setAttribute('aria-label',on?'Толық экраннан шығу':'Картаны толық экранға үлкейту');full.textContent=on?'×':'⛶';setTimeout(()=>map.invalidateSize(),80)}
 full.addEventListener('click',()=>fullView(!stage.classList.contains('map-fullscreen')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('map-fullscreen'))fullView(false)});
 if(names[params.get('city')])selectSite(chosen);
 window.addEventListener('resize',()=>map.invalidateSize());
})();
