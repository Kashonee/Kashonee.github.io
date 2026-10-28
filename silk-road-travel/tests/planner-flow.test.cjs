const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
function setup(page='calculator',search='',withCache=true){
 const nodes=new Map(),events={},storage=new Map();let fetches=0,downloads=[];
 class Element{
  constructor(id=''){this.id=id;this.dataset={};this.events={};this.value='';this.hidden=false;this.textContent='';this.validity='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this._html='';}
  set innerHTML(value){this._html=value;register(value);}get innerHTML(){return this._html;}
  insertAdjacentHTML(position,value){register(value);} addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  setAttribute(name,value){this[name]=value;}setCustomValidity(value){this.validity=value;}reportValidity(){this.reported=true;}
  emit(type){for(const fn of this.events[type]||[])fn({target:this,currentTarget:this});}
  querySelector(sel){if(sel.startsWith('#'))return nodes.get(sel.slice(1))||null;if(sel==='[data-road-retry]')return this.retry??=new Element();return null;}
  querySelectorAll(){return [];}focus(){}append(){}click(){if(this.download)downloads.push(this.download);}remove(){}
 }
 function register(html){for(const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){const id=match[1];if(!nodes.has(id))nodes.set(id,new Element(id));const node=nodes.get(id),value=match[0].match(/\bvalue="([^"]+)"/);if(value)node.value=value[1];}}
 register(file(page+'.html'));
 const doc={querySelector:sel=>sel.startsWith('#')?nodes.get(sel.slice(1))||null:null,querySelectorAll:()=>[],getElementById:id=>nodes.get(id)||null,addEventListener:(type,fn)=>(events[type]??=[]).push(fn),dispatchEvent:e=>{for(const fn of events[e.type]||[])fn(e);},createElement:()=>new Element(),body:new Element()};
 const context=vm.createContext({document:doc,location:{search,pathname:'/'+page+'.html',href:'https://example.test/'+page+'.html'+search},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},URL,URLSearchParams,CustomEvent:class{constructor(type){this.type=type;}},console,setTimeout,clearTimeout,AbortController,Blob,fetch:()=>{fetches++;return Promise.reject(new Error('Network is not used in these fixtures'));},window:{addEventListener(){}},matchMedia:()=>({matches:false})});
 const run=code=>vm.runInContext(code,context);for(const name of ['travel-data.js','site-data.js'])run(file(name));
 if(withCache){const item=run(`(()=>{const ids=['turkestan','otyrar','arystanbab','turkestan'];return {ids,data:{code:'Ok',routes:[{distance:100000,duration:7200,legs:[{distance:40000,duration:3000},{distance:20000,duration:1000},{distance:40000,duration:3200}],geometry:{type:'LineString',coordinates:ids.map(id=>[placeById[id].lon,placeById[id].lat])}}],waypoints:ids.map(id=>({location:[placeById[id].lon,placeById[id].lat],distance:0}))},time:Date.now(),provider:'OSRM / OpenStreetMap',url:'https://router.project-osrm.org/route/v1/driving/test-fixture'}})()`);const key=run("['turkestan','otyrar','arystanbab','turkestan'].map(id=>id+':'+placeById[id].lon+','+placeById[id].lat).join('|')");storage.set('srt-car-road-v3',JSON.stringify([[key,item]]));}
 run(file('planner-core.js'));run(file('app.js'));return {run,nodes,context,storage,doc,get fetches(){return fetches;}};
}
const calc=setup();calc.run(file('journey.js'));const s=()=>calc.run('SRT.state');
assert.equal(s().timeMode,'road');assert.equal(calc.fetches,0);assert.match(calc.nodes.get('calcOutput').innerHTML,/2 сағ/);assert.ok(!calc.nodes.has('calcRoute'));assert.ok(calc.nodes.get('calcSpeedNumber'));
const number=calc.nodes.get('calcSpeedNumber');number.value='100';number.emit('input');assert.equal(s().timeMode,'manual');assert.equal(s().speed,100);assert.equal(calc.run('SRT.total(SRT.cached(SRT.ids())).road'),1);assert.equal(calc.run('SRT.total(SRT.cached(SRT.ids())).service'),2);assert.match(calc.nodes.get('calcOutput').innerHTML,/100 км\/сағ/);
number.value='87';number.emit('input');assert.equal(s().speed,87);assert.equal(calc.nodes.get('calcSpeed').value,87);assert.ok(Math.abs(calc.run('SRT.total(SRT.cached(SRT.ids())).road')-100/87)<1e-9);
number.value='200';number.emit('change');assert.ok(number.validity);assert.equal(s().speed,87);number.value='';number.emit('change');assert.equal(s().speed,87);
const slider=calc.nodes.get('calcSpeed');slider.value='120';slider.emit('input');assert.equal(s().speed,120);assert.equal(number.validity,'');
const mode=calc.nodes.get('calcTimeMode');mode.value='road';mode.emit('change');assert.equal(s().timeMode,'road');assert.equal(calc.run('SRT.total(SRT.cached(SRT.ids())).road'),2);assert.equal(calc.fetches,0);
calc.run("SRT.save({kind:'custom',stops:['taraz','karakhan'],speed:93,timeMode:'manual',round:true,visit:2.5,pause:15})");const href=calc.run("SRT.href('map.html')"),restored=setup('map',new URL(href,'https://example.test').search,false);assert.equal(JSON.stringify(restored.run('SRT.state')),JSON.stringify(s()));assert.equal(restored.run('SRT.ids().join(",")'),'taraz,karakhan,taraz');assert.equal(restored.run('SRT.normalize({speed:1000}).speed'),140);
const routes=setup('routes','',false);routes.run(file('journey.js'));assert.equal(routes.fetches,0);assert.match(routes.nodes.get('routeResult').innerHTML,/route-stop-list/);assert.doesNotMatch(routes.nodes.get('routeResult').innerHTML,/road-metrics|leg-table|км\/сағ/);
routes.run("selectedRoute='custom';custom=['taraz','karakhan'];renderBuilder()");assert.equal(routes.run('SRT.ids().join(",")'),'taraz,karakhan');routes.run("SRT.save({round:true});renderBuilder()");assert.equal(routes.run('SRT.ids().join(",")'),'taraz,karakhan,taraz');routes.run("custom=[];renderBuilder()");assert.equal(routes.nodes.get('exportRoute').disabled,true);assert.equal(routes.fetches,0);
// Execute the map's no-Leaflet path: all place details remain available without a routing request.
const map=setup('map','',false);map.nodes.get('mapRegion').value='all';map.run(file('geo-map.js'));assert.equal(map.fetches,0);assert.equal(map.nodes.get('mapSavedRoad').hidden,true);assert.match(map.nodes.get('mapDetail').innerHTML,/Ясауи/);assert.match(map.nodes.get('mapRoutePath').textContent,/Отырар/);map.nodes.get('mapPlanStops').onclick();assert.equal(map.fetches,0);
assert.doesNotMatch(file('geo-map.js'),/SRT\.(route|metrics|legs)\(/);
for(const name of ['routes.html','map.html'])assert.doesNotMatch(file(name),/id="(?:speed|mapRouteSpeed|mapTimeMode|timeMode)"/);
console.log('PASS: no routing requests on Routes or Map; editable speed selects manual mode; original provider time retained; invalid input; range control; auto mode; integer precision; plan URL persistence; route selection/return/empty state; map fallback.');
