'use strict';
class QuizSession {
 constructor(bank, count = bank.length, random = Math.random) {
  if(!Array.isArray(bank)||!bank.length)throw new TypeError('Question bank is empty');
  const pool=[...bank];
  if(count<bank.length){for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}}
  this.questions=pool.slice(0,Math.max(1,Math.min(bank.length,Math.floor(count))));this.index=0;this.answers=[];this.finished=false;
 }
 snapshot(){return {ids:this.questions.map(q=>q.id),index:this.index,answers:[...this.answers],finished:this.finished};}
 static restore(bank,data){if(!data||!Array.isArray(data.ids)||![10,30].includes(data.ids.length)||new Set(data.ids).size!==data.ids.length)return null;const questions=data.ids.map(id=>bank.find(q=>q.id===id));if(questions.some(q=>!q)||!Number.isInteger(data.index)||data.index<0||data.index>=questions.length||!Array.isArray(data.answers)||![data.index,data.index+1].includes(data.answers.length)||data.answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=questions[i].options.length)||data.finished)return null;const session=new QuizSession(questions);session.index=data.index;session.answers=[...data.answers];return session;}
 get current(){return this.finished?null:this.questions[this.index];}
 get answered(){return this.answers.length>this.index;}
 get score(){return this.answers.reduce((sum,answer,i)=>sum+Number(answer===this.questions[i].answer),0);}
 answer(value){if(this.finished||this.answered||!Number.isInteger(value)||value<0||value>=this.current.options.length)return false;this.answers.push(value);return true;}
 next(){if(this.finished||!this.answered)return false;if(this.index===this.questions.length-1)this.finished=true;else this.index++;return true;}
 get mistakes(){return this.questions.slice(0,this.answers.length).map((question,i)=>({question,chosen:this.answers[i]})).filter(item=>item.chosen!==item.question.answer);}
}
if(typeof module!=='undefined'&&module.exports)module.exports=QuizSession;
