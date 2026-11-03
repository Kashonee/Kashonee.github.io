const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx=vm.createContext({});for(const name of ['travel-data.js','site-data.js','heritage-data.js'])vm.runInContext(read(name),ctx);
const html=read('research.html'),template=read('scripts/research-content.template'),data=JSON.parse(read('research-files/research-data.json'));
assert.deepEqual(data.metrics.map(m=>m.days),[1,3,7]);
for(const m of data.metrics){
 const list=Array.from(vm.runInContext(`roadStops.${m.id}`,ctx)),unique=[...new Set(list)];
 assert.equal(m.stops,list.length);
 assert.equal(m.sites,unique.filter(id=>!vm.runInContext(`placeById['${id}'].transit`,ctx)).length);
 assert.equal(m.visitMinutes,unique.reduce((total,id)=>total+vm.runInContext(`placeById['${id}'].minutes||0`,ctx),0));
}
assert.equal(Object.keys(vm.runInContext('HERITAGE_CONTENT.sources',ctx)).length,15);
assert.ok(html.includes('id="sourceList"'),'The restored page should still display the sourced bibliography');
assert.ok(read('app.js').includes("if($('#sourceList'))renderSources()"));
for(const city of ['turkestan','otyrar','taraz','sairam','talgar','qoylyq'])assert.ok(html.includes('href="./city-'+city+'.html"'));
for(const km of ['170 км','430 км','1655 км'])assert.ok(html.includes(km));
assert.ok(html.includes('жоспарлық қосындысы; нақты автожол өлшемі емес'));
assert.ok(html.includes('хаттамасы сайтқа әлі енгізілмеген'));
assert.ok(html.includes('сандық қорытынды берілмейді'));
assert.ok(html.includes('href="./calculator.html">Автожол есебін салыстыру'));
assert.ok(!html.includes('{{')&&!template.includes('{{'));
assert.ok(html.includes(template.trim()));
const blank=read('research-files/test-protocol.csv').trim().split(/\r?\n/);
assert.equal(blank.length,13);assert.ok(blank.slice(1).every(row=>row==='"","","","","","","","","",""'));
assert.equal(read('research-files/site-catalogue.csv').trim().split(/\r?\n/).length,11);
console.log('PASS: restored research material, six cities, model distance caveat, sourced bibliography, honest trial disclosure, canonical data and blank protocol.');
