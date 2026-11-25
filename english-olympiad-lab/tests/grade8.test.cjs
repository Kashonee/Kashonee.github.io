const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./harness.cjs');
const setup=()=>{const b=boot();return {...b,g:b.ctx.window.GRADE8,d:b.ctx.window.GRADE8_DATA};};
test('six complete papers have unique slots, valid topic tags, source files and 50 sourced words',()=>{
 const {g,d}=setup();assert.equal(d.exams.length,6);assert.equal(d.vocab.length,50);assert.equal(d.exams.reduce((n,e)=>n+g.slots(e).length,0),240);
 for(const e of d.exams){const qs=g.slots(e);assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);for(const q of qs){assert.ok(d.topics.some(t=>t.id===q.topic));assert.ok(q.key);assert.ok(e.sections.find(s=>s.id===q.section).source.length>500);if(q.choices)assert.ok(q.choices.includes(q.key));if(e.stage==='district'){assert.equal(q.options.length,5);assert.deepEqual(Array.from(q.options,o=>o.value),['A','B','C','D','E']);assert.ok(q.prompt);}}for(const file of [e.test,e.keys,e.writingImage].filter(Boolean))assert.ok(fs.existsSync(path.join(__dirname,'..',file)));}
 for(const w of d.vocab)assert.ok(d.exams.some(e=>e.id===w.exam));
});
test('source keys score every eligible item and district weights total 50',()=>{
 const {g,d}=setup();for(const e of d.exams){const qs=g.slots(e),answers=Object.fromEntries(qs.map(q=>[q.id,q.key])),s=g.score(e,{answers});assert.equal(s.wrong,0,e.id);assert.equal(s.blank,0);assert.equal(s.points,s.max);assert.equal(s.pending,qs.filter(q=>q.review).length);if(e.stage==='district')assert.equal(qs.reduce((s,q)=>s+q.points,0),50);}
});
test('disputed keys are pending, excluded from auto maximum and never counted wrong',()=>{
 const {g,d}=setup();const e=d.exams.find(e=>e.id==='regional-2025'),q=g.slots(e).find(q=>q.id==='use-14');assert.equal(g.grade(q,'is'),'pending');assert.equal(g.grade(q,'were'),'pending');assert.equal(g.grade(q,''),'blank');assert.equal(g.score(e,{answers:{'use-14':'is'}}).max,39);
});
test('accepted variants normalize typography; unmatched transformations stay for manual review',()=>{
 const {g,d}=setup(),e=d.exams.find(e=>e.id==='national-2024'),q=g.slots(e).find(q=>q.id==='use-13');assert.equal(g.grade(q,'I HAVEN’T been abroad since 2022.'),'correct');assert.equal(g.grade(q,'Since 2022, I have not travelled abroad.'),'pending');const r=g.slots(d.exams.find(e=>e.id==='regional-2025')).find(q=>q.id==='use-3');assert.equal(g.grade(r,'which'),'correct');
});
test('blank work never fabricates topic weaknesses or mastery',()=>{
 const {g}=setup();assert.ok(g.evidence().every(t=>t.correct===0&&t.wrong===0&&t.pending===0&&t.blank===t.refs.length));
});
test('submit locks work, preserves blanks and prioritizes an observed grammar error',()=>{
 const b=setup();b.navigate('#/grade8/exam/district-2025');b.input({g8Answer:'test-2',exam:'district-2025'},'A');b.click({g8Action:'submit',exam:'district-2025'});const r=b.lab.getState().grade8.exams['district-2025'];assert.equal(r.draft,null);assert.equal(r.attempts.length,1);assert.equal(b.g.score(b.d.exams.find(e=>e.id==='district-2025'),r.attempts[0]).blank,29);assert.equal(b.g.evidence()[0].id,'G01');b.input({g8Answer:'test-2',exam:'district-2025'},'D');assert.equal(r.attempts[0].answers['test-2'],'A');b.navigate('#/grade8/path');assert.match(b.html(),/Ағылшын шақтары/);assert.match(b.html(),/8 сынып архиві: 1 қате/);
});
test('new attempts retain previous evidence until submitted and history is bounded',()=>{
 const b=setup();b.navigate('#/grade8/exam/district-2025');for(let i=0;i<7;i++){if(i)b.click({g8Action:'retry',exam:'district-2025'});b.input({g8Answer:'test-2',exam:'district-2025'},'A');b.click({g8Action:'submit',exam:'district-2025'});}b.click({g8Action:'retry',exam:'district-2025'});assert.equal(b.lab.getState().grade8.exams['district-2025'].attempts.length,5);assert.equal(b.g.evidence()[0].wrong,1);
});
test('answers, both writing tasks, practice and vocabulary survive save and sanitize',()=>{
 const b=setup();b.navigate('#/grade8/exam/national-2025/writing');b.input({g8Write:'0',exam:'national-2025'},'The children are cleaning their classroom.');b.input({g8Write:'1',exam:'national-2025'},'My ideal job is teaching.');b.input({g8Answer:'use-1',exam:'national-2025'},'allowed');b.navigate('#/grade8/train/G01');b.input({g8Drill:'0',topic:'G01'},'visited');b.click({g8Action:'drill-check',topic:'G01'});b.click({g8Action:'word-known',word:'g8-word-1'});const saved=JSON.parse(b.storage.get('english-olympiad-lab-v1')),next=setup();const clean=next.lab.sanitize(saved).grade8;assert.equal(clean.exams['national-2025'].draft.writing.length,2);assert.equal(clean.exams['national-2025'].draft.answers['use-1'],'allowed');assert.equal(clean.practice.G01.values[0],'visited');assert.equal(clean.practice.G01.checked,true);assert.equal(clean.words['g8-word-1'].step,1);assert.ok(clean.words['g8-word-1'].due>Date.now()-40*86400000);assert.equal(saved.answers[1],undefined);
});
test('schema ignores unknown IDs, bounds text/history and never imports computed scores',()=>{
 const {g}=setup(),raw={exams:{'district-2025':{draft:{answers:{'test-1':'x'.repeat(3000),evil:'injected'},writing:[],score:50},attempts:Array.from({length:9},()=>({at:1,answers:{'test-1':'A'}}))},evil:{score:99}},practice:{evil:{checked:true}},words:{evil:{step:5,due:1}}};const n=g.sanitize(raw);assert.equal(n.exams['district-2025'].draft.answers['test-1'].length,2000);assert.equal(n.exams['district-2025'].draft.answers.evil,undefined);assert.equal(n.exams['district-2025'].draft.score,undefined);assert.equal(n.exams['district-2025'].attempts.length,5);assert.equal(n.exams.evil,undefined);assert.equal(n.practice.evil,undefined);
});
test('all new routes render with unique IDs and escape pupil writing',()=>{
 const b=setup();for(const route of ['#/grade8','#/grade8/analysis','#/grade8/path','#/grade8/vocab',...b.d.topics.map(t=>'#/grade8/train/'+t.id),...b.d.exams.flatMap(e=>['#/grade8/analysis/'+e.id,...e.sections.map(s=>'#/grade8/exam/'+e.id+'/'+s.id)])]){b.navigate(route);assert.ok(b.html().length>2000,route);const ids=Array.from(b.html().matchAll(/(?:^|\s)id="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,route);}b.input({g8Write:'0',exam:'national-2025'},'</textarea><img src=x onerror=alert(1)>');b.navigate('#/grade8/exam/national-2025/writing');assert.ok(!b.html().includes('<img src=x'));assert.match(b.html(),/&lt;\/textarea&gt;/);
});
test('targeted practice is separate from original test evidence',()=>{
 const b=setup();for(const t of b.d.topics){const qs=b.g.drills(t.id);assert.equal(qs.length,3);for(const q of qs){assert.ok(q.prompt);assert.ok(q.key);assert.ok(q.explanation);assert.equal(b.g.grade(q,q.key),'correct');}}b.navigate('#/grade8/train/G01');b.input({g8Drill:'0',topic:'G01'},'visited');b.click({g8Action:'drill-check',topic:'G01'});assert.ok(b.g.evidence().every(t=>t.correct===0&&t.wrong===0));
});
test('teacher report includes source scores and writing, safely escaped',()=>{
 const b=setup();b.navigate('#/grade8/exam/national-2025/writing');b.input({g8Write:'0',exam:'national-2025'},'<script>unsafe</script>');b.click({g8Action:'submit',exam:'national-2025'});const html=b.g.teacherSummary(b.lab.getState().grade8);assert.match(html,/Writing 1/);assert.ok(!html.includes('<script>unsafe'));assert.match(html,/&lt;script&gt;/);b.navigate('#/transfer');assert.match(b.html(),/8 сынып · Олимпиада нәтижелері/);
});
