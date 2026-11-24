import test from 'node:test';
import assert from 'node:assert/strict';
import {missions,traceProgram,canMove,expand,quizQuestions,finalQuizQuestions,quizSets} from '../engine.js';
const move=dir=>({type:'move',dir});
test('Every mission is solvable with its required concept',()=>{
 const solutions=[
  [move('E'),move('E'),move('E'),move('E')],
  [...Array.from({length:3},()=>move('N')),...Array.from({length:3},()=>move('E'))],
  [{type:'repeat',dir:'E',count:4},{type:'repeat',dir:'N',count:4}],
  [move('E'),{type:'if',dir:'E',other:'N'},move('E'),move('E'),move('E')],
  [move('N'),move('N'),move('E'),move('E'),move('E')],
  [{type:'repeat',dir:'N',count:4},{type:'repeat',dir:'E',count:4}]
 ];
 missions.forEach((m,i)=>{const result=traceProgram(m,solutions[i]);assert.equal(result.success,true,m.id);assert.equal(result.trace.length,m.optimal,m.id);});
});
test('A blocked move stops at the first failing block without moving through it',()=>{
 const r=traceProgram(missions[4],missions[4].initial);assert.equal(r.error,'blocked');assert.equal(r.failedBlock,1);assert.deepEqual(r.position,[1,4]);assert.equal(r.trace.length,1);
});
test('Branches evaluate the current position each time',()=>{
 const program=Array.from({length:5},()=>({type:'if',dir:'E',other:'N'}));
 const r=traceProgram(missions[3],program);assert.equal(r.success,true);assert.deepEqual(r.trace.map(s=>s.dir),['E','N','E','E','E']);
});
test('A required concept must be present even when the goal is reached',()=>{
 const r=traceProgram(missions[2],[...Array.from({length:4},()=>move('E')),...Array.from({length:4},()=>move('N'))]);assert.equal(r.success,false);assert.equal(r.error,'requirement');
});
test('Repeat commands keep source block references for step highlighting',()=>{
 const r=traceProgram(missions[0],[{type:'repeat',dir:'E',count:4}]);assert.equal(r.success,true);assert.deepEqual(r.trace.map(s=>s.block),[0,0,0,0]);
});
test('Grid boundaries and unfinished routes are reported',()=>{
 assert.equal(canMove(missions[0],[0,4],'S'),false);assert.equal(canMove(missions[0],[0,4],'W'),false);assert.equal(traceProgram(missions[0],[move('N')]).error,'unfinished');assert.equal(traceProgram(missions[0],[]).success,false);
});
test('Interpreter rejects malformed or unbounded programs',()=>{
 for(const p of [[{type:'move',dir:'bad'}],[{type:'repeat',dir:'N',count:100000}],[{type:'repeat',dir:'N',count:1.5}],[{type:'if',dir:'N',other:'bad'}],Array.from({length:25},()=>move('N')),null])assert.throws(()=>expand(p));
});
test('Diagnostics have one valid answer per question',()=>{assert.equal(quizQuestions.length,5);quizQuestions.forEach(q=>assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length));});

test('Final diagnostics use different prompts for the same skills and preserve version labels',()=>{
 assert.equal(finalQuizQuestions.length,quizQuestions.length);
 finalQuizQuestions.forEach((q,i)=>{assert.equal(q.skill,quizQuestions[i].skill);assert.notEqual(q.q,quizQuestions[i].q);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);});
 assert.equal(quizSets.initial.variant,'A-v1');assert.equal(quizSets.final.variant,'B-v1');
});
