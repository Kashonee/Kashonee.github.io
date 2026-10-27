'use strict';
const SRT = (()=>{
 const storageKey='srt-plan-v3',cacheKey='srt-car-road-v3',ttl=24*60*60*1000;
 const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))&&v!==null&&v!==''?Math.min(max,Math.max(min,Number(v))):fallback;
 const defaults={kind:'short',stops:[],speed:55,visit:null,pause:20,round:false,timeMode:'road'};
 function normalize(value={}){return{kind:Object.hasOwn(presets,value.kind)||value.kind==='custom'?value.kind:'short',stops:Array.isArray(value.stops)?value.stops.filter(id=>Object.hasOwn(placeById,id)).slice(0,16):[],speed:Math.round(clamp(value.speed,20,140,55)/5)*5,visit:value.visit===null||value.visit===undefined?null:clamp(value.visit,0,48,0),pause:clamp(value.pause,0,60,20),round:value.round===true,timeMode:value.timeMode==='manual'?'manual':'road'};}
 const old=safeRead('srt-route',{});
 let state=normalize(safeRead(storageKey,safeRead('srt-plan-v2',{...defaults,kind:old?.kind||'short',stops:old?.custom||[]})));
 const query=new URLSearchParams(location.search);
 if(query.has('route'))state.kind=query.get('route');
 if(query.has('stops'))state.stops=query.get('stops').split(',');
 for(const k of ['speed','visit','pause','timeMode'])if(query.has(k))state[k]=query.get(k);
 if(query.has('round'))state.round=query.get('round')==='1';
 state=normalize(state);
 if(Object.hasOwn(placeById,query.get('add'))){if(state.kind!=='custom')state.stops=[...new Set(roadStops[state.kind]||[])];state.kind='custom';if(!state.stops.includes(query.get('add')))state.stops.push(query.get('add'));state.visit=null;}
 state=normalize(state);
 function save(patch={}){state=normalize({...state,...patch});safeWrite(storageKey,state);if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('srt:planchange'));return state;}
 function ids(plan=state){let list=plan.kind==='custom'?[...plan.stops]:[...roadStops[plan.kind]];if(plan.kind==='custom'&&plan.round&&list.length>1&&list.at(-1)!==list[0])list.push(list[0]);return list;}
 function href(page,plan=state){const p=new URLSearchParams({route:plan.kind,speed:String(plan.speed),pause:String(plan.pause),round:plan.round?'1':'0',timeMode:plan.timeMode});if(plan.stops.length)p.set('stops',plan.stops.join(','));if(plan.visit!==null)p.set('visit',String(plan.visit));return './'+page+'?'+p;}
 function visits(plan=state){if(plan.visit!==null)return plan.visit;return [...new Set(ids(plan))].reduce((sum,id)=>sum+(placeById[id].minutes||0),0)/60;}
 function total(item,plan=state){const r=item.data.routes[0],road=plan.timeMode==='manual'?r.distance/1000/plan.speed:r.duration/3600;const breaks=Math.max(0,Math.ceil(road/2)-1)*plan.pause/60;return{road,breaks,visit:visits(plan),total:road+breaks+visits(plan),service:r.duration/3600};}
 const validPoint=p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
 function validate(data,count){
  const r=data?.routes?.[0];
  if(data?.code!=='Ok'||!r||!Number.isFinite(r.distance)||r.distance<=0||!Number.isFinite(r.duration)||r.duration<=0||r.geometry?.type!=='LineString'||!Array.isArray(r.geometry.coordinates)||r.geometry.coordinates.length<2||!r.geometry.coordinates.every(validPoint)||r.legs?.length!==count-1||!r.legs.every(l=>Number.isFinite(l.distance)&&l.distance>=0&&Number.isFinite(l.duration)&&l.duration>=0)||data.waypoints?.length!==count||!data.waypoints.every(w=>validPoint(w.location)&&Number.isFinite(w.distance)&&w.distance>=0&&w.distance<=1501))throw Error('Маршрут дерегі толық емес');
  if(Math.abs(r.legs.reduce((s,l)=>s+l.distance,0)-r.distance)>Math.max(10,count)||Math.abs(r.legs.reduce((s,l)=>s+l.duration,0)-r.duration)>Math.max(10,count))throw Error('Учаскелердің қосындысы сәйкес емес');
  return r;
 }
 const keyFor=list=>list.map(id=>id+':'+placeById[id].lon+','+placeById[id].lat).join('|');
 const cache=new Map(),inflight=new Map();
 const providers=[{base:'https://routing.openstreetmap.de/routed-car/route/v1/driving/',name:'FOSSGIS · OSRM / OpenStreetMap'},{base:'https://router.project-osrm.org/route/v1/driving/',name:'OSRM / OpenStreetMap'}];
 const persisted=safeRead(cacheKey,[]);
 if(Array.isArray(persisted))for(const entry of persisted){if(!Array.isArray(entry)||entry.length!==2)continue;const [key,value]=entry;if(value&&Number.isFinite(value.time)&&Date.now()>=value.time&&Date.now()-value.time<ttl&&Array.isArray(value.ids)&&value.ids.every(id=>Object.hasOwn(placeById,id))&&keyFor(value.ids)===key&&providers.some(p=>value.url?.startsWith(p.base))){try{validate(value.data,value.ids.length);cache.set(key,value)}catch{}}}
 function cached(list=ids()){const key=keyFor(list),item=cache.get(key);if(item&&Date.now()-item.time<ttl)return item;cache.delete(key);return null;}
 let lastStart=0;
 async function route(list=ids(),refresh=false){
  if(list.length<2||list.length>17||list.some(id=>!Object.hasOwn(placeById,id)))throw Error('Кемінде екі нысанды таңдаңыз');
  const key=keyFor(list);if(!refresh&&cached(list))return cached(list);if(inflight.has(key))return inflight.get(key);
  const request=(async()=>{
   const coordinates=list.map(id=>placeById[id].lon+','+placeById[id].lat).join(';');let lastError;
   for(const provider of providers){
    const delay=Math.max(0,lastStart+1100-Date.now());lastStart=Date.now()+delay;if(delay)await new Promise(r=>setTimeout(r,delay));
    const url=provider.base+coordinates+'?overview=full&geometries=geojson&steps=false&continue_straight=false&radiuses='+list.map(()=>1500).join(';');
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
    try{const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw Error('Жол сервисі жауап бермеді');const data=await response.json();validate(data,list.length);const item={ids:[...list],data,url,time:Date.now(),provider:provider.name};cache.set(key,item);safeWrite(cacheKey,Array.from(cache.entries()).slice(-6));return item;}
    catch(error){lastError=error}finally{clearTimeout(timer)}
   }
   throw lastError;
  })();inflight.set(key,request);try{return await request}finally{inflight.delete(key)}
 }
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const km=n=>(n/1000).toFixed(1);
 function drivingLink(from,to){const destination=placeById[to],p=new URLSearchParams({api:'1',destination:destination.lat+','+destination.lon,travelmode:'driving'});if(from){const origin=placeById[from];p.set('origin',origin.lat+','+origin.lon)}return 'https://www.google.com/maps/dir/?'+p;}
 function yandexLink(from,to){const a=placeById[from],b=placeById[to];return 'https://yandex.kz/maps/?'+new URLSearchParams({rtext:a.lat+','+a.lon+'~'+b.lat+','+b.lon,rtt:'auto'});}
 function navigation(list=ids()){return '<details class="road-navigation"><summary>Әр учаскені навигаторда ашу</summary><ol>'+list.slice(1).map((id,i)=>'<li>'+escape(placeById[list[i]].name)+' → '+escape(placeById[id].name)+'<span><a href="'+escape(drivingLink(list[i],id))+'" target="_blank" rel="noopener">Google Maps</a> · <a href="'+escape(yandexLink(list[i],id))+'" target="_blank" rel="noopener">Яндекс Карталар</a></span></li>').join('')+'</ol></details>';}
 function sourceNote(item){return '<p class="road-note">Дерек: <a href="'+escape(item.url)+'" target="_blank" rel="noopener">'+escape(item.provider)+'</a> · алынған уақыты '+new Date(item.time).toLocaleString('kk-KZ')+'. Қашықтық — автожол желісі бойынша; уақыт — көлік профилінің бағалауы. Кептеліс, ауа райы, шекарадағы кезек пен уақытша жабылу есепке кірмейді. <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Картадағы қатені хабарлау</a>.</p>';}
 function accessNotes(item){const points=item.data.waypoints.map((w,i)=>({w,id:item.ids[i]})).filter((p,i,a)=>a.findIndex(q=>q.id===p.id)===i&&p.w.distance>100);return points.length?'<details class="arrival-note"><summary>Нысанға соңғы жету бөлігін тексеріңіз</summary><p>Төмендегі сан — нысан белгісі мен сервис таңдаған автожол нүктесінің түзу аралығы. Ол жаяу маршрут ұзындығы емес; автотұрақ пен кіреберісті нақтылаңыз.</p><ul>'+points.map(p=>'<li>'+escape(placeById[p.id].name)+': '+Math.round(p.w.distance)+' м</li>').join('')+'</ul></details>':'';}
 function legs(item,plan=state){const r=item.data.routes[0],manual=plan.timeMode==='manual';return '<div class="table-scroll"><table class="leg-table"><caption>Автомобиль учаскелері'+(manual?' · өз есебіңіз '+plan.speed+' км/сағ':' · карта сервисінің есебі')+'</caption><thead><tr><th>Учаске</th><th>Автожол</th><th>Жол уақыты</th><th>Навигатор</th></tr></thead><tbody>'+r.legs.map((l,i)=>'<tr><td>'+escape(placeById[item.ids[i]].name)+' → '+escape(placeById[item.ids[i+1]].name)+'</td><td>'+km(l.distance)+' км</td><td>'+fmtHours(manual?l.distance/1000/plan.speed:l.duration/3600)+'</td><td><a href="'+escape(drivingLink(item.ids[i],item.ids[i+1]))+'" target="_blank" rel="noopener">Ашу</a></td></tr>').join('')+'</tbody></table></div>'+accessNotes(item)+sourceNote(item);}
 function metrics(item,plan=state){const t=total(item,plan),manual=plan.timeMode==='manual';return '<div class="road-metrics"><div><strong>'+km(item.data.routes[0].distance)+' км</strong><span>автожол желісі бойынша</span></div><div><strong>'+fmtHours(t.road)+'</strong><span>'+(manual?'өз есебіңіз · '+plan.speed+' км/сағ':'көлікпен · карта сервисі')+'</span></div><div><strong>'+fmtHours(t.total)+'</strong><span>жол + үзіліс + аралау</span></div></div><p class="road-note">Аралау: '+fmtHours(t.visit)+' · үзіліс: '+fmtHours(t.breaks)+'. Түнеу кірмейді. Үзілістер бүкіл жол уақытының әр 2 сағатына жоспарланады; аралау аялдамаларымен бірге реттеңіз.</p>'+(manual?'<p class="manual-time-note">Бұл — өзіңіз таңдаған орташа жылдамдықпен есеп. Карта сервисінің көлік уақыты: '+fmtHours(t.service)+'. Орташа жылдамдық жолдағы рұқсат етілген шекке тең емес.</p>':'');}
 function mapLink(site){return 'https://www.openstreetmap.org/?mlat='+site.lat+'&mlon='+site.lon+'#map=16/'+site.lat+'/'+site.lon;}
 save();return{get state(){return state},save,normalize,ids,href,visits,total,route,cached,validate,escape,km,legs,metrics,navigation,drivingLink,sourceNote,mapLink};
})();
