'use strict';
const SRT = (()=>{
 const storageKey='srt-plan-v2',cacheKey='srt-road-v2';
 const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const safeWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
 const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))&&v!==null&&v!==''?Math.min(max,Math.max(min,Number(v))):fallback;
 const defaults={kind:'short',stops:[],speed:55,visit:null,pause:20,round:false};
 function normalize(value={}){return{kind:Object.hasOwn(presets,value.kind)||value.kind==='custom'?value.kind:'short',stops:Array.isArray(value.stops)?value.stops.filter(id=>Object.hasOwn(placeById,id)).slice(0,16):[],speed:Math.round(clamp(value.speed,40,80,55)/5)*5,visit:value.visit===null||value.visit===undefined?null:clamp(value.visit,0,48,0),pause:clamp(value.pause,0,60,20),round:value.round===true};}
 const previous=safeRead('srt-route',{});
 let state=normalize(safeRead(storageKey,{...defaults,kind:previous?.kind||'short',stops:previous?.custom||[]}));
 const query=new URLSearchParams(location.search);
 if(query.has('route'))state.kind=query.get('route');
 if(query.has('stops'))state.stops=query.get('stops').split(',');
 for(const k of ['speed','visit','pause'])if(query.has(k))state[k]=query.get(k);
 if(query.has('round'))state.round=query.get('round')==='1';
 if(Object.hasOwn(placeById,query.get('add'))){state.kind='custom';if(!state.stops.includes(query.get('add')))state.stops.push(query.get('add'));}
 state=normalize(state);
 function save(patch={}){state=normalize({...state,...patch});safeWrite(storageKey,state);if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('srt:planchange'));return state;}
 function ids(plan=state){let list=plan.kind==='custom'?[...plan.stops]:[...roadStops[plan.kind]];if(plan.kind==='custom'&&plan.round&&list.length>1&&list.at(-1)!==list[0])list.push(list[0]);return list;}
 function href(page,plan=state){const p=new URLSearchParams({route:plan.kind,speed:String(plan.speed),pause:String(plan.pause),round:plan.round?'1':'0'});if(plan.stops.length)p.set('stops',plan.stops.join(','));if(plan.visit!==null)p.set('visit',String(plan.visit));return './'+page+'?'+p;}
 function visits(plan=state){if(plan.visit!==null)return plan.visit;return [...new Set(ids(plan))].reduce((sum,id)=>sum+(placeById[id].minutes||0),0)/60;}
 function total(distance,plan=state){const road=distance/plan.speed;const breaks=Math.max(0,Math.ceil(road/2)-1)*plan.pause/60;return {road,breaks,visit:visits(plan),total:road+breaks+visits(plan)};}
 function validate(data,count){const r=data.routes?.[0];if(data.code!=='Ok'||!r||!Number.isFinite(r.distance)||r.distance<=0||r.geometry?.type!=='LineString'||!Array.isArray(r.geometry.coordinates)||r.geometry.coordinates.length<2||!r.geometry.coordinates.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90)||r.legs?.length!==count-1||!r.legs.every(l=>Number.isFinite(l.distance)&&l.distance>=0)||data.waypoints?.length!==count)throw Error('Маршрут дерегі толық емес');return r;}
 const cache=new Map(),inflight=new Map();
 const persisted=safeRead(cacheKey,[]);
 if(Array.isArray(persisted))for(const entry of persisted){if(!Array.isArray(entry)||entry.length!==2)continue;const [key,value]=entry;if(value&&Date.now()-value.time<7*86400000&&Array.isArray(value.ids)&&value.ids.join('|')===key&&value.ids.every(id=>placeById[id])){try{validate(value.data,value.ids.length);cache.set(key,value)}catch{}}}
 const keyFor=list=>list.join('|');
 function cached(list=ids()){const key=keyFor(list),item=cache.get(key);if(item&&Date.now()-item.time<7*86400000)return item;cache.delete(key);return null;}
 let lastStart=0;
 async function route(list=ids(),refresh=false){
  if(list.length<2||list.length>17||list.some(id=>!Object.hasOwn(placeById,id)))throw Error('Кемінде екі нысанды таңдаңыз');
  const key=keyFor(list);if(!refresh&&cached(list))return cached(list);if(inflight.has(key))return inflight.get(key);
  const request=(async()=>{
   const delay=Math.max(0,lastStart+1100-Date.now());lastStart=Date.now()+delay;if(delay)await new Promise(r=>setTimeout(r,delay));
   const coordinates=list.map(id=>placeById[id].lon+','+placeById[id].lat).join(';');
   const url='https://router.project-osrm.org/route/v1/driving/'+coordinates+'?overview=full&geometries=geojson&steps=false&radiuses='+list.map(()=>1500).join(';');
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),15000);
   try{const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw Error('Жол сервисі жауап бермеді');const data=await response.json();validate(data,list.length);const item={ids:[...list],data,url,time:Date.now(),provider:'OSRM / OpenStreetMap'};cache.set(key,item);safeWrite(cacheKey,Array.from(cache.entries()).slice(-6));return item;}
   finally{clearTimeout(timer);}
  })();inflight.set(key,request);try{return await request}finally{inflight.delete(key)}
 }
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const km=n=>(n/1000).toFixed(1);
 function sourceNote(item){return '<p class="road-note">Дерек: <a href="'+escape(item.url)+'" target="_blank" rel="noopener">'+item.provider+'</a> · алынған күні '+new Date(item.time).toLocaleDateString('kk-KZ')+'. Автожол желісі бойынша есеп; кептеліс пен уақытша жабылулар ескерілмейді. Нысанның кіреберісіне дейінгі жаяу жол бөлек тексеріледі.</p>';}
 function legs(item,plan=state){const r=item.data.routes[0];return '<div class="table-scroll"><table class="leg-table"><caption>Автожол учаскелері · шартты орташа жылдамдық '+plan.speed+' км/сағ</caption><thead><tr><th>Учаске</th><th>Қашықтық</th><th>Таза жүріс</th></tr></thead><tbody>'+r.legs.map((l,i)=>'<tr><td>'+escape(placeById[item.ids[i]].name)+' → '+escape(placeById[item.ids[i+1]].name)+'</td><td>'+km(l.distance)+' км</td><td>'+fmtHours(l.distance/1000/plan.speed)+'</td></tr>').join('')+'</tbody></table></div>'+sourceNote(item);}
 function mapLink(site){return 'https://www.openstreetmap.org/?mlat='+site.lat+'&mlon='+site.lon+'#map=16/'+site.lat+'/'+site.lon;}
 save();return{get state(){return state},save,normalize,ids,href,visits,total,route,cached,validate,escape,km,legs,sourceNote,mapLink};
})();
