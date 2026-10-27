const assert=require('node:assert/strict');
const Journey=require('../caravan-core.js');
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
function setup(options={}){
 let time=0,id=0,halts=0;const jobs=new Map(),arrivals=[],seen=[];
 const clock={now:()=>time,set:(fn,ms)=>{jobs.set(++id,{fn,at:time+ms});return id;},clear:key=>jobs.delete(key)};
 const engine=new Journey({count:3,dwellMs:20000,clock,halt:()=>halts++,travel:index=>{seen.push(index);if(options.manualArrival)return new Promise(resolve=>arrivals.push(resolve));},...options});
 const tick=async ms=>{const end=time+ms;while(true){const next=[...jobs].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;time=next[1].at;jobs.delete(next[0]);next[1].fn();await flush();}time=end;await flush();};
 return{engine,jobs,arrivals,seen,tick,get halts(){return halts;}};
}
(async()=>{
 const a=setup();a.engine.start();await flush();assert.equal(a.engine.snapshot().phase,'reading');await a.tick(19999);assert.equal(a.engine.snapshot().index,0);await a.tick(1);assert.equal(a.engine.snapshot().index,1);await a.tick(40000);assert.equal(a.engine.snapshot().phase,'finished');assert.equal(a.engine.snapshot().playing,false);assert.equal(a.jobs.size,0);assert.deepEqual(a.seen,[0,1,2]);
 const b=setup();b.engine.start();await flush();await b.tick(7000);b.engine.pause();assert.equal(b.engine.snapshot().remainingMs,13000);assert.equal(b.jobs.size,0);await b.tick(90000);assert.equal(b.engine.snapshot().index,0);b.engine.resume();await b.tick(12999);assert.equal(b.engine.snapshot().index,0);await b.tick(1);assert.equal(b.engine.snapshot().index,1);
 const c=setup({manualArrival:true});c.engine.start();c.engine.pause();assert.equal(c.engine.snapshot().playing,false);c.arrivals[0]();await flush();assert.equal(c.jobs.size,0);c.engine.resume();assert.deepEqual(c.seen,[0,0]);c.arrivals[1]();await flush();assert.equal(c.engine.snapshot().remainingMs,20000);assert.equal(c.jobs.size,1);
 const d=setup({manualArrival:true});d.engine.start();d.engine.next();d.arrivals[0]();await flush();assert.equal(d.engine.snapshot().index,1);assert.equal(d.engine.snapshot().phase,'traveling');assert.equal(d.jobs.size,0);d.arrivals[1]();await flush();assert.equal(d.engine.snapshot().phase,'reading');assert.equal(d.jobs.size,1);
 const e=setup();e.engine.start();await flush();e.engine.pause();e.engine.next();await flush();assert.equal(e.engine.snapshot().index,1);assert.equal(e.engine.snapshot().playing,false);assert.equal(e.jobs.size,0);e.engine.previous();await flush();assert.equal(e.engine.snapshot().index,0);assert.equal(e.engine.snapshot().playing,false);e.engine.go(2,false);await flush();assert.equal(e.engine.snapshot().index,2);assert.equal(e.jobs.size,0);
 const f=setup({manualArrival:true});f.engine.start();f.engine.start();f.engine.start();f.arrivals[0]();f.arrivals[1]();await flush();assert.equal(f.jobs.size,0);f.arrivals[2]();await flush();assert.equal(f.jobs.size,1);f.engine.stop();assert.equal(f.jobs.size,0);assert.equal(f.engine.snapshot().phase,'idle');await f.tick(60000);assert.equal(f.engine.snapshot().index,-1);
 const g=setup({manualArrival:true});g.engine.start();g.engine.stop();g.arrivals[0]();await flush();assert.equal(g.jobs.size,0);assert.equal(g.engine.snapshot().phase,'idle');g.engine.go(99,true);g.engine.go(-1,true);assert.equal(g.engine.snapshot().index,-1);
 const h=setup();h.engine.start();await flush();h.engine.go(2,true);await flush();await h.tick(20000);assert.equal(h.engine.snapshot().phase,'finished');h.engine.resume();await flush();assert.equal(h.engine.snapshot().index,0);assert.equal(h.engine.snapshot().playing,true);assert.equal(h.jobs.size,1);
 console.log('PASS: timed sequence, completion, pause/resume with remaining time, interrupted flights, stale arrivals, paused navigation, replay and close cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
