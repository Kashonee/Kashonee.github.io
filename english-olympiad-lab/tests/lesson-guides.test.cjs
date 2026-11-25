const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./harness.cjs');
test('all 21 lessons have complete learner-friendly explanations and 200 worked examples',()=>{
 const b=boot(),guides=b.ctx.window.LESSON_GUIDES;assert.equal(Object.keys(guides).length,21);let count=0;
 for(const l of b.L){const g=guides[l.code];assert.ok(g);assert.ok(g.hook.length>70);assert.ok(g.idea.length>70);assert.ok(g.steps.length>=3);assert.ok(g.comparison.length>=3);assert.ok(g.mistakes.length>=2);assert.ok(g.quick.length>=2);assert.ok(g.takeaway.length>30);assert.equal(l.summary,g.summary);for(const s of g.steps){assert.ok(s.title);assert.ok(s.text.length>50);assert.ok(s.pattern);assert.ok(s.examples.length>=2);for(const e of s.examples){assert.ok(e.en);assert.ok(e.kk);assert.ok(e.why);count++;}}}
 assert.equal(count,200);
});
test('every lesson renders examples, reasons, contrasts, mistakes and self checks with unique IDs',()=>{
 const b=boot();for(const l of b.L){b.navigate('#/learn/'+l.code);const html=b.html();assert.match(html,/БІРГЕ ТҮСІНІП АЛАЙЫҚ/);assert.match(html,/Неге\?/);assert.match(html,/Айырмасын қатар көр/);assert.match(html,/Осы жерден жиі шатасамыз/);assert.match(html,/Жауабы мен себебін көру/);assert.match(html,/Енді өзің орындап көр/);const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,l.code);assert.ok(!html.includes('<iframe'));}
});
test('tense guide includes every tense-aspect form without opening all advanced material by default',()=>{
 const b=boot(),g=b.ctx.window.LESSON_GUIDES.G01;assert.equal(g.steps.length,12);assert.equal(g.steps.filter(s=>s.advanced).length,6);const text=g.steps.map(s=>s.title).join(' ');for(const name of ['Present Simple','Present Continuous','Past Simple','Past Continuous','Present Perfect','Present Perfect Continuous','Past Perfect','Past Perfect Continuous','Future Continuous','Future Perfect','Future Perfect Continuous'])assert.ok(text.includes(name));b.navigate('#/learn/G01');assert.ok(!b.html().includes('class="guide-advanced" open'));
});
test('17 Russian lessons cover all 16 grammar topics with indexed counts above 10000',()=>{
 const b=boot(),videos=b.ctx.window.LESSON_VIDEOS;assert.equal(Object.values(videos).flat().length,17);for(let i=1;i<=16;i++){const code='G'+String(i).padStart(2,'0');assert.ok(videos[code]?.length);for(const v of videos[code]){assert.equal(v.language,'ru');assert.match(v.id,/^[A-Za-z0-9_-]{11}$/);assert.ok(v.views>=10000);assert.ok(v.title);assert.ok(v.channel);assert.ok(v.focus);}}
});
test('video players load on explicit request, use known nocookie IDs and can be closed',()=>{
 const b=boot();b.navigate('#/learn/G01');const before=JSON.stringify(b.lab.getState());assert.ok(!b.html().includes('<iframe'));const el=b.click({action:'lesson-video',code:'G01',videoIndex:'0'}),host=b.nodes.get('guide-player-G01-0');assert.match(host.innerHTML,/youtube-nocookie\.com\/embed\/gPy4KYVKxDc/);assert.match(host.innerHTML,/referrerpolicy="strict-origin-when-cross-origin"/);assert.ok(!host.innerHTML.includes('autoplay=1'));assert.equal(el['aria-expanded'],'true');b.ctx.window.LESSON_HELP.toggleVideo(el);assert.equal(host.innerHTML,'');assert.equal(el['aria-expanded'],'false');b.click({action:'lesson-video',code:'G01',videoIndex:'999'});assert.equal(host.innerHTML,'');assert.equal(JSON.stringify(b.lab.getState()),before);
});
test('grade 8 training shares the same grammar explanations while retaining separate practice',()=>{
 const b=boot();for(let i=1;i<=16;i++){const code='G'+String(i).padStart(2,'0');if(!b.ctx.window.GRADE8_DATA.topics.some(t=>t.id===code))continue;b.navigate('#/grade8/train/'+code);assert.match(b.html(),/guide-compact/);assert.match(b.html(),/Орысша видеосабақ/);assert.match(b.html(),/Жаттығу 3/);const ids=Array.from(b.html().matchAll(/\bid="([^"]+)"/g),m=>m[1]);assert.equal(ids.length,new Set(ids).size,code);}
});
test('lesson reading and video display do not fabricate assessed progress',()=>{
 const b=boot(),before=JSON.stringify(b.lab.getState());for(const code of ['G01','G08','G11','V01'])b.navigate('#/learn/'+code);assert.equal(JSON.stringify(b.lab.getState()),before);assert.equal(b.lab.summary().entered,0);assert.equal(b.lab.practiceCorrect('G01'),0);assert.equal(b.lab.currentProgress('G01').passed,false);
});
test('lesson content is escaped and invalid guide IDs cannot inject markup',()=>{
 const b=boot(),g=b.ctx.window.LESSON_GUIDES.G01;g.hook='<img src=x onerror=alert(1)>';b.navigate('#/learn/G01');assert.ok(!b.html().includes('<img src=x'));assert.match(b.html(),/&lt;img/);assert.equal(b.ctx.window.LESSON_HELP.render('<script>'), '');assert.equal(b.ctx.window.LESSON_HELP.render('__proto__'),'');
});
