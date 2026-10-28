'use strict';
class QuizSession {
 constructor(bank, count = bank.length, random = Math.random) {
  if(!Array.isArray(bank)||!bank.length)throw new TypeError('Question bank is empty');
  const pool=[...bank];
  if(count<bank.length){for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}}
  this.questions=pool.slice(0,Math.max(1,Math.min(bank.length,Math.floor(count))));this.index=0;this.answers=[];this.finished=false;
 }
 get current(){return this.finished?null:this.questions[this.index];}
 get answered(){return this.answers.length>this.index;}
 get score(){return this.answers.reduce((sum,answer,i)=>sum+Number(answer===this.questions[i].answer),0);}
 answer(value){if(this.finished||this.answered||!Number.isInteger(value)||value<0||value>=this.current.options.length)return false;this.answers.push(value);return true;}
 next(){if(this.finished||!this.answered)return false;if(this.index===this.questions.length-1)this.finished=true;else this.index++;return true;}
 get mistakes(){return this.questions.slice(0,this.answers.length).map((question,i)=>({question,chosen:this.answers[i]})).filter(item=>item.chosen!==item.question.answer);}
}
if(typeof module!=='undefined'&&module.exports)module.exports=QuizSession;
