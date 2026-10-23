const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.resolve(__dirname,'..');
function boot(stored,options={}){
 const nodes=new Map(),events={},children=[],blobs=new Map(),downloads=[],storage=new Map();let now=Date.parse('2026-10-23T05:00:00Z');
 if(stored)storage.set('english-olympiad-lab-v1',JSON.stringify(stored));if(options.raw!==undefined)storage.set('english-olympiad-lab-v1',options.raw);
 const flags={failRead:false,failWrite:false,...options};
 class FakeDate extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}}
 function node(tag='div'){const classes=new Set(),handlers={},sub=new Map();return {tagName:tag.toUpperCase(),dataset:{},innerHTML:'',textContent:'',style:{},value:'',checked:false,selectionStart:0,classList:{add(v){classes.add(v);},remove(v){classes.delete(v);},toggle(v,b){if(b===undefined)b=!classes.has(v);b?classes.add(v):classes.delete(v);},contains(v){return classes.has(v);}},setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},addEventListener(t,fn){handlers[t]=fn;},focus(){this.focused=true;},setSelectionRange(){},closest(){return null;},querySelector(s){if(!sub.has(s))sub.set(s,node('button'));return sub.get(s);},querySelectorAll(){return [];},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},remove(){const i=children.indexOf(this);if(i>=0)children.splice(i,1);},click(){if(this.tagName==='A')downloads.push({name:this.download,blob:blobs.get(this.href)});this.onclick?.();}};}
 const document={documentElement:node('html'),title:'',hidden:false,body:{appendChild(el){children.push(el);}},getElementById(id){if(!nodes.has(id)){const el=node();el.id=id;el.addEventListener=(t,fn)=>events[id+':'+t]=fn;nodes.set(id,el);}return nodes.get(id);},createElement:node,addEventListener(t,fn){events[t]=fn;},querySelector(){return node();},querySelectorAll(){return [];}};
 const window={__TEST__:true,scrollY:0,scrollTo(){},addEventListener(t,fn){events['window:'+t]=fn;}};if(options.cloud)window.LAB_CLOUD=options.cloud;
 const timers=[];const ctx={window,document,location:{hash:'#/home'},localStorage:{getItem(k){if(flags.failRead)throw Error('Storage blocked');return storage.get(k)??null;},setItem(k,v){if(flags.failWrite)throw Error('Quota exceeded');storage.set(k,String(v));}},console,setTimeout(){},clearTimeout(){},setInterval(fn){timers.push(fn);},URL:{createObjectURL(blob){const key='blob:test-'+blobs.size;blobs.set(key,blob);return key;},revokeObjectURL(){}},Blob,Date:FakeDate,Set,JSON,Math};
 vm.createContext(ctx);for(const f of ['theme.js','ui-icons.js','data.js','lessons.js','words.js','retests.js','reading.js','mocks.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 const lab=window.__LAB__;
 function navigate(route){ctx.location.hash=route;lab.render();}
 function input(dataset,value,extra={}){const el=Object.assign(node('input'),{dataset,value},extra);events.input({target:el,isComposing:false});return el;}
 function click(dataset){const el=Object.assign(node('button'),{dataset});el.parentElement={querySelectorAll(){return [el];}};events.click({target:{closest(selector){return selector==='[data-action]'?el:null;}}});return el;}
 function change(dataset,value,extra={}){const el=Object.assign(node('select'),{dataset,value},extra);events.change({target:el});return el;}
 function activeDialog(){return [...children].reverse().find(x=>x.tagName==='DIALOG'&&x.open);}
 return {lab,D:window.DIAGNOSTIC,L:window.LESSONS,words:window.WORDS,ctx,nodes,events,storage,flags,downloads,children,navigate,input,click,change,node,activeDialog,advance(ms){now+=ms;},tick(){timers.forEach(fn=>fn());},html:()=>nodes.get('app').innerHTML};
}
module.exports={boot};
