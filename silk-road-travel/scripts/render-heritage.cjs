// Rebuild the static city chapters from the same data used in the animated tour.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'heritage-data.js'),'utf8')+'\nthis.data=HERITAGE_CONTENT;',context);
const data=context.data,escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const refs=list=>'<div class="heritage-citations">'+list.map(id=>{const ref=data.sources[id];if(!ref)throw Error('Missing source '+id);return '<a href="'+escape(ref.url)+'" target="_blank" rel="noopener">'+escape(ref.label)+'</a>';}).join('')+'</div>';
const block=b=>'<section class="heritage-topic"><h3>'+escape(b.title)+'</h3><p>'+escape(b.text)+'</p>'+refs(b.refs)+'</section>';
for(const [id,city] of Object.entries(data.cities)){
 const file=path.join(root,'city-'+id+'.html');let html=fs.readFileSync(file,'utf8');
 const used=[...new Set([...city.history,...city.monuments,city.distinction].flatMap(b=>b.refs))];
 const chapter='<section class="heritage-expanded" id="city-history"><div class="heritage-facts">'+city.facts.map(f=>'<span>'+escape(f)+'</span>').join('')+'</div>'+city.history.map(block).join('')+'<h3 class="heritage-group-title">Көретін нысандар мен ерекшеліктер</h3>'+city.monuments.map(block).join('')+'<aside class="heritage-evidence">'+block(city.distinction)+'</aside><section class="heritage-observe"><h3>Сапарда неге назар аударамыз?</h3><p>'+escape(city.observe)+'</p><small>Silk Road Travel авторлық бақылау және сапарды жоспарлау кеңесі.</small></section><details class="heritage-bibliography"><summary>Дереккөздер · тексерілді: '+data.checked+'</summary><ol>'+used.map(id=>{const r=data.sources[id];return '<li><a href="'+escape(r.url)+'" target="_blank" rel="noopener">'+escape(r.title)+'</a><small>'+escape(r.meta)+'</small></li>';}).join('')+'</ol></details></section>';
 const markerStart='<!-- HERITAGE:START -->',markerEnd='<!-- HERITAGE:END -->';
 if(html.includes(markerStart)){const start=html.indexOf(markerStart),end=html.indexOf(markerEnd,start)+markerEnd.length;html=html.slice(0,start)+markerStart+chapter+markerEnd+html.slice(end);}
 else{
  for(const title of ['Ұлы Жібек жолындағы орны','Қандай мұра сақталған?','Сапарды қалай жоспарлауға болады?']){const literal='<h3>'+title+'</h3>';const start=html.indexOf(literal);if(start===-1)throw Error('Missing old section '+id+': '+title);const end=html.indexOf('</p>',start)+4;html=html.slice(0,start)+html.slice(end);}
  const heading='<h2>Тарихтан<br>бүгінгі сапарға.</h2>';if(!html.includes(heading))throw Error('Missing article heading '+id);html=html.replace(heading,heading+markerStart+chapter+markerEnd);
 }
 if(!html.includes('./heritage.css'))html=html.replace('</head>','<link rel="stylesheet" href="./heritage.css?v=20261028-history"></head>');
 html=html.replace('app.js?v=20261027-car','app.js?v=20261028-history');fs.writeFileSync(file,html);
}
// Keep the research bibliography in sync with the new city chapters.
const appFile=path.join(root,'app.js');let app=fs.readFileSync(appFile,'utf8');const start=app.indexOf('const sourceItems=['),end=app.indexOf('];',start)+2;if(start<0)throw Error('Missing research sources');app=app.slice(0,start)+'const sourceItems='+JSON.stringify(Object.values(data.sources).map(s=>[s.label,s.url]),null,1)+';'+app.slice(end);fs.writeFileSync(appFile,app);
console.log('Built six static city chapters and the '+Object.keys(data.sources).length+'-source research bibliography.');
