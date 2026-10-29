'use strict';
// Links open the providers' own search; imported points never use a viewport as a destination.
const SRTAddress = (()=>{
 const domains={google:['google.com','google.kz','google.ru','maps.google.com','maps.google.kz','maps.google.ru','maps.app.goo.gl','goo.gl'],yandex:['yandex.kz','yandex.ru','yandex.com','maps.yandex.kz','maps.yandex.ru','maps.yandex.com'],dgis:['2gis.kz','2gis.ru','2gis.com','go.2gis.com']};
 const point=(lat,lon)=>{if(!['number','string'].includes(typeof lat)||!['number','string'].includes(typeof lon))return null;if(typeof lat==='string'&&!lat.trim()||typeof lon==='string'&&!lon.trim())return null;lat=Number(lat);lon=Number(lon);return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:null;};
 const pair=(value,reverse=false)=>{if(!value||!/^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(value))return null;const p=value.split(',');return reverse?point(p[1],p[0]):point(p[0],p[1]);};
 const decode=s=>{try{return decodeURIComponent(s)}catch{return s}};
 function provider(host){host=host.toLowerCase().replace(/^www\./,'');return Object.keys(domains).find(key=>domains[key].includes(host))||null;}
 function searchLinks(query){const text=String(query).trim();return {google:'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:text}),yandex:'https://yandex.kz/maps/?'+new URLSearchParams({text}),dgis:'https://2gis.kz/search/'+encodeURIComponent(text)};}
 function pointLinks(p){return {google:'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:p.lat+','+p.lon}),yandex:'https://yandex.kz/maps/?'+new URLSearchParams({pt:p.lon+','+p.lat,z:'17'}),dgis:'https://2gis.kz/geo/'+p.lon+','+p.lat};}
 function parse(value){
  const text=String(value).trim();if(text.length>12000)return {status:'invalid'};const found=text.match(/https?:\/\/[^\s<>"\u00ab\u00bb]+/i);if(!found)return {status:'invalid'};
  let url;try{url=new URL(found[0]);}catch{return {status:'invalid'}}
  const kind=provider(url.hostname);if(!kind||url.username||url.password||url.port||url.protocol!=='https:')return {status:'invalid'};
  if(kind==='google'&&/^google\./.test(url.hostname.replace(/^www\./,''))&&!url.pathname.startsWith('/maps'))return {status:'invalid'};
  if(kind==='yandex'&&!/^\/(maps|navi)(?:\/|$)/.test(url.pathname))return {status:'invalid'};
  const out={provider:kind,url:url.href,status:'unresolved'},q=url.searchParams,path=decode(url.pathname),raw=decode(url.href);let p=null,center=null;
  if(kind==='google'){
   // An explicit place pin has precedence over @lat,lon camera coordinates.
   const pins=[...raw.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
   if(pins.length===1&&!/\/dir\//.test(path))p=point(pins[0][1],pins[0][2]);
   if(!p&&!/\/dir\//.test(path)&&q.get('map_action')!=='pano')p=pair(q.get('query'))||pair(q.get('q'));
   const camera=path.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);center=camera?point(camera[1],camera[2]):pair(q.get('center'));
  }else if(kind==='yandex'){
   p=pair(q.get('whatshere[point]'),true);
   if(!p&&q.has('pt')&&!q.get('pt').includes('~'))p=pair(q.get('pt').split(',').slice(0,2).join(','),true);
   if(!p&&!q.has('rtext'))p=pair(q.get('text'));
   center=pair(q.get('ll'),true);
  }else{
   const pin=path.match(/\/geo\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\/|$)/);if(pin)p=point(pin[2],pin[1]);
   center=pair((q.get('m')||'').split('/')[0],true);
  }
  if(p)return {...out,status:'point',point:p};
  if(center)return {...out,status:'view',center};
  return out;
 }
 return {parse,searchLinks,pointLinks,point};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SRTAddress;
