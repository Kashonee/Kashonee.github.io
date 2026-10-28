const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const QuizSession=require('../quiz-core.js');
const context=vm.createContext({});for(const file of ['heritage-data.js','quiz-data.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),context);
const bank=vm.runInContext('SRT_QUIZ',context),sources=vm.runInContext('HERITAGE_CONTENT.sources',context);
assert.equal(bank.length,30);assert.equal(new Set(bank.map(q=>q.id)).size,30);assert.equal(new Set(bank.map(q=>q.topic)).size,7);
for(const q of bank){assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.question&&q.explanation);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3);assert.ok(sources[q.source]||['planning','routes'].includes(q.source));}
const full=new QuizSession(bank);assert.equal(full.next(),false);assert.equal(full.answer(-1),false);assert.equal(full.answer(3),false);assert.equal(full.answer(1.5),false);
for(let i=0;i<30;i++){assert.equal(full.current.id,bank[i].id);assert.ok(full.answer(bank[i].answer));assert.equal(full.answer(bank[i].answer),false);assert.ok(full.next());}
assert.equal(full.score,30);assert.equal(full.finished,true);assert.equal(full.current,null);assert.equal(full.mistakes.length,0);assert.equal(full.answer(0),false);assert.equal(full.next(),false);
const quick=new QuizSession(bank,10,()=>.2);assert.equal(quick.questions.length,10);assert.equal(new Set(quick.questions.map(q=>q.id)).size,10);assert.notEqual(quick.questions[0].id,bank[0].id);
for(let i=0;i<10;i++){const a=quick.current.answer;quick.answer(i%2?a:(a+1)%3);quick.next();}assert.equal(quick.score,5);assert.equal(quick.mistakes.length,5);assert.equal(quick.finished,true);
assert.throws(()=>new QuizSession([]));assert.equal(new QuizSession(bank,100).questions.length,30);assert.equal(new QuizSession(bank,0).questions.length,1);
const again=new QuizSession(bank,10,()=>.7);assert.equal(again.score,0);assert.equal(again.answers.length,0);assert.notDeepEqual(again.questions.map(q=>q.id),quick.questions.map(q=>q.id));
console.log('PASS: 30 unique sourced questions; all/quick modes, no duplicate scoring, invalid-answer guard, completion, mistake review, replay and unique random sampling.');
