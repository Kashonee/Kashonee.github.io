import assert from 'node:assert/strict';
import fs from 'node:fs';
import{laws,stations,sources,getSaved}from'../dist/data.js';
assert.equal(laws.length,9);assert.equal(stations.length,6);assert.equal(stations.flatMap(s=>s.questions).length,18);
for(const s of stations){assert.equal(s.questions.length,3);for(const q of s.questions){assert.equal(q.options.length,3);assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3);assert.ok(q.why.length>30)}for(const r of s.refs)assert.ok(sources[r])}
assert.deepEqual(getSaved({getItem:()=>'{broken'}),{completed:[],answers:{},read:[]});assert.deepEqual(getSaved({getItem:()=>JSON.stringify({completed:[0,0,-1,6,'1',2],read:[1,9],answers:{}})}),{completed:[0,2],read:[1],answers:{}});
for(const name of ['exterior','lobby','classroom','corridor','office','lesson','garden','staff'])for(const face of ['front','back','left','right','up','down'])assert.ok(fs.statSync(`dist/panoramas/${name}-${face}.webp`).size>500);
const signs=JSON.parse(fs.readFileSync('dist/signs.json','utf8'));assert.equal(Object.keys(signs).length,8);assert.ok(signs.lobby.length>=11);for(const entries of Object.values(signs))for(const sign of entries){assert.equal(sign.corners.length,4);assert.ok(sign.lines.length>0);for(const corner of sign.corners)assert.ok(corner.every(Number.isFinite))}
for(const f of ['dist/app.js','dist/panorama.js','dist/data.js'])assert.ok(fs.readFileSync(f,'utf8').length>100);
console.log('PASS: 9 law branches, 6 stations, 18 questions, source references, progress validation, 48 panorama faces and projected vector signs.');
