'use strict';
// Presentation timing is separate from road planning and never changes SRT state.
class CaravanJourney {
 constructor({count,dwellMs=20000,travel=()=>{},halt=()=>{},change=()=>{},clock={now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:id=>clearTimeout(id)}}={}){
  if(!Number.isInteger(count)||count<1)throw new Error('A journey needs at least one stop');
  Object.assign(this,{count,dwellMs,travel,halt,change,clock,index:-1,phase:'idle',playing:false,remaining:dwellMs,deadline:0,timer:null,token:0,needsTravel:false});
 }
 snapshot(){const left=this.playing&&this.phase==='reading'?Math.max(0,this.deadline-this.clock.now()):this.remaining;return{index:this.index,phase:this.phase,playing:this.playing,remainingMs:left,dwellMs:this.dwellMs,progress:this.phase==='finished'?1:1-left/this.dwellMs};}
 emit(){this.change(this.snapshot());}
 clear(){if(this.timer!==null)this.clock.clear(this.timer);this.timer=null;}
 schedule(){this.deadline=this.clock.now()+this.remaining;this.clear();const token=this.token;this.timer=this.clock.set(()=>{if(token!==this.token||!this.playing)return;this.timer=null;if(this.index===this.count-1)this.finish();else this.go(this.index+1,true);},this.remaining);}
 go(index,playing=this.playing){
  if(!Number.isInteger(index)||index<0||index>=this.count)return;
  this.clear();const token=++this.token;this.halt();this.index=index;this.phase='traveling';this.playing=playing;this.remaining=this.dwellMs;this.needsTravel=false;this.emit();
  let arrival;try{arrival=this.travel(index);}catch{arrival=undefined;}
  Promise.resolve(arrival).catch(()=>{}).then(()=>{if(token!==this.token)return;this.phase='reading';if(this.playing)this.schedule();this.emit();});
 }
 start(){this.go(0,true);}
 pause(){if(!this.playing)return;this.remaining=this.snapshot().remainingMs;this.clear();++this.token;this.playing=false;if(this.phase==='traveling'){this.needsTravel=true;this.phase='reading';this.halt();}this.emit();}
 resume(){if(this.phase==='idle'||this.phase==='finished'){this.start();return;}if(this.playing)return;if(this.needsTravel||this.phase==='traveling'){this.go(this.index,true);return;}this.playing=true;this.schedule();this.emit();}
 next(){if(this.index<this.count-1)this.go(this.index+1,this.playing);else this.finish();}
 previous(){if(this.index>0)this.go(this.index-1,this.playing);}
 finish(){this.clear();++this.token;this.halt();this.phase='finished';this.playing=false;this.remaining=0;this.emit();}
 stop(){this.clear();++this.token;this.halt();this.phase='idle';this.playing=false;this.index=-1;this.remaining=this.dwellMs;this.emit();}
}
if(typeof module!=='undefined'&&module.exports)module.exports=CaravanJourney;
