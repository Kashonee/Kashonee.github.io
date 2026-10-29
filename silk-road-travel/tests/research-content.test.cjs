const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx=vm.createContext({});for(const n of ['travel-data.js','site-data.js','heritage-data.js'])vm.runInContext(read(n),ctx);
const data=JSON.parse(read('research-files/research-data.json')),html=read('research.html');
for(const route of data.metrics){const list=vm.runInContext(`roadStops.${route.id}`,ctx),unique=[...new Set(list)];assert.equal(route.stops,list.length);assert.equal(route.sites,vm.runInContext(`new Set(roadStops.${route.id}.filter(id=>!placeById[id].transit)).size`,ctx));assert.equal(route.visitMinutes,vm.runInContext(`[...new Set(roadStops.${route.id})].reduce((n,id)=>n+(placeById[id].minutes||0),0)`,ctx));assert.deepEqual(route.orderedStops,Array.from(vm.runInContext(`roadStops.${route.id}.map(id=>placeById[id].name)`,ctx)));assert.ok(html.includes('width:'+route.sites*10+'%'));}
assert.equal(data.metrics.length,3);assert.deepEqual(data.metrics.map(r=>r.visitMinutes),[225,285,540]);
assert.equal((html.match(/<li id="ref-/g)||[]).length,15);
for(const section of ['passport','method','cities','routes','results','testing','conclusions','sources'])assert.ok(html.includes('id="research-'+section+'"'));
assert.ok(!html.includes('{{'));assert.ok(!html.includes('id="sourceList"'));assert.ok(!html.includes('visit=null'));
assert.ok(html.includes('хаттама сайтқа берілмеген'));assert.ok(html.includes('тексерілген автожол ұзындығы ретінде пайдаланылмайды'));
const blank=read('research-files/test-protocol.csv').trim().split(/\r?\n/);assert.equal(blank.length,13);assert.ok(blank.slice(1).every(row=>row==='"","","","","","","","","",""'));
const catalogue=read('research-files/site-catalogue.csv').trim().split(/\r?\n/);assert.equal(catalogue.length,11);
assert.ok(read('research-files/student-survey.txt').includes('8. Қандай'));
console.log('PASS: research metrics agree with canonical stops; 15 historical sources; eight sections; model/result distinction; blank protocol and download contents.');
