'use strict';
const byId=Object.fromEntries(cities.map(c=>[c.id,c]));
const sourceItems=[
 [
  "UNESCO · Ясауи кесенесі",
  "https://whc.unesco.org/en/list/1103/"
 ],
 [
  "UNESCO · Жібек жолы дәлізі",
  "https://whc.unesco.org/en/list/1442/"
 ],
 [
  "UNESCO · Талғар және Қаялық",
  "https://whc.unesco.org/en/list/1442/maps/"
 ],
 [
  "«Әзірет Сұлтан» · Тайқазан",
  "https://azretsultan.kz/taj-azan-hiv/"
 ],
 [
  "Archaeology.kz · Отырар",
  "https://archaeology.kz/heritages/244-otyrar-zhane-otyrar-alqaby"
 ],
 [
  "Archaeology.kz · Арыстан баб",
  "https://archaeology.kz/heritages/217-arystan-bab-kesene-meshiti"
 ],
 [
  "Archaeology.kz · Тараз",
  "https://archaeology.kz/heritages/633-taraz-qalasy"
 ],
 [
  "«Ежелгі Тараз» · Айша бибі",
  "https://ezhelgi-taraz.kz/kk/page/ajsha-bibi-kesenesi-xi-xiivv"
 ],
 [
  "«Ежелгі Тараз» · Қарахан",
  "https://ezhelgi-taraz.kz/kk/page/arakhan-kesenesi-khi-khii"
 ],
 [
  "«Ежелгі Тараз» · Бабаджа хатун",
  "https://www.ezhelgi-taraz.kz/kk/page/babadzha-khatun-kesenesi-khi"
 ],
 [
  "Abai Instituty · Сайрам",
  "https://oq.gov.kz/ru/abai/sayram-ispiddgab"
 ],
 [
  "Kazakhstan.travel · Қарашаш ана",
  "https://kazakhstan.travel/kz/attractions/473"
 ],
 [
  "Kazakhstan.travel · Ибраһим ата",
  "https://kazakhstan.travel/kz/attractions/474"
 ],
 [
  "Archaeology.kz · Талхир",
  "https://archaeology.kz/heritages/65-talgar-talhir-qalasy"
 ],
 [
  "Archaeology.kz · Қаялық",
  "https://archaeology.kz/heritages/61-qoilyq-kayalyk-qalasy"
 ]
];
let selectedCity='turkestan', selectedRoute='short', custom=[];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
function cityImage(c){return c.photoUrl||(c.photo?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(c.photo)+'?width=1280':'')}
function photoAttribution(c){if(!c.photoPage)return '';return '<a href="'+c.photoPage+'" target="_blank" rel="noopener noreferrer">'+c.credit+'</a>'+(c.photoLicense?' · <a href="'+c.photoLicense+'" target="_blank" rel="noopener noreferrer">Лицензия</a>':'')+(c.photoTerms?' · <a href="'+c.photoTerms+'" target="_blank" rel="noopener noreferrer">Пайдалану шарты</a>':'');}
function visual(c,type){const photo=cityImage(c), label=photo?c.photoSubject:'КӨРКЕМ ИЛЛЮСТРАЦИЯ';return '<div class="'+type+' city-'+c.id+(photo?'':' no-photo')+'">'+(photo?'<img loading="lazy" src="'+photo+'" alt="'+c.photoSubject+'">':'')+'<span class="visual-label">'+label+'</span></div>'+(c.photoPage?'<div class="photo-attribution">'+photoAttribution(c)+'</div>':'')}
function card(c){return '<article class="city-card" data-tilt>'+visual(c,'city-visual')+'<button class="save-city" type="button" data-save-city="'+c.id+'" aria-label="'+c.name+' қаласын сақтау"><svg class="ui-icon ui-icon-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button><div class="city-body"><span class="city-region">'+c.regionLabel+'</span><h3>'+c.name+'</h3><p>'+c.site+'</p><div class="city-meta"><span>'+c.kind+'</span><a href="./city-'+c.id+'.html">Тарихын ашу <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a></div></div></article>'}
function renderCities(region='all'){$('#cityGrid').innerHTML=cities.filter(c=>region==='all'||c.region===region).map(card).join('')}
function renderPins(){$('#mapPins').innerHTML=cities.map(c=>'<button type="button" class="map-pin '+(c.id===selectedCity?'active':'')+'" data-pin="'+c.id+'" style="left:'+(c.x/10)+'%;top:'+(c.y/5.4)+'%" aria-label="'+c.name+' картасы"><i></i>'+c.name+'</button>').join('')}
function mapLine(){if(!$('#activeMapLine'))return;let ids=selectedRoute==='custom'?custom:(presets[selectedRoute]?.stops||[]);const path=ids.filter(id=>byId[id]).map(id=>byId[id].x+','+byId[id].y).join(' ');$('#activeMapLine').setAttribute('points',path)}
function renderMap(){const c=byId[selectedCity];renderPins();$('#mapDetail').innerHTML='<div class="map-small">'+c.regionLabel+' · '+c.kind+'</div><h3>'+c.name+'</h3><p>'+c.role+'</p><ul><li><strong>Нақты нысан:</strong> '+c.site+'</li><li><strong>Мәртебе:</strong> '+c.status+'</li></ul><p>'+c.visit+'</p><div class="detail-actions"><button class="outline-btn" type="button" data-city-open="'+c.id+'">Тарихын оқу <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></button><a class="outline-btn" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/search?query='+encodeURIComponent(c.site+', Қазақстан')+'">Сыртқы карта <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a></div><a href="'+c.source+'" target="_blank" rel="noopener noreferrer">Дереккөз: '+c.sourceLabel+' <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a>';mapLine()}
function showCity(id){const c=byId[id];if(!c)return;const d=$('#cityDialog');$('#dialogContent').innerHTML=visual(c,'dialog-visual')+'<div class="dialog-body"><div class="kicker">'+c.regionLabel+' · '+c.kind+'</div><h2>'+c.name+'</h2><p>'+c.role+'</p><h3>Нені білу маңызды?</h3><p>'+c.fact+'</p><h3>Сапарға жоспар</h3><p>'+c.visit+'</p><p class="dialog-note">'+c.status+' · Нысанның кіру жағдайын сапар алдында нақтылаңыз.</p><p><a target="_blank" rel="noopener noreferrer" href="'+c.source+'">Тарихи дереккөз <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a>'+(c.photoPage?' · <a target="_blank" rel="noopener noreferrer" href="'+c.photoPage+'">Фото: '+c.credit+' <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a>':'')+'</p></div>';d.showModal()}
// journey.js installs the shared automotive planner after this base UI loads.
function renderBuilder(){const result=$('#routeResult');if(result)result.innerHTML='<p role="status">Автомобиль жоспары жүктелуде…</p>'}
function renderSources(){$('#sourceList').innerHTML=sourceItems.map(x=>'<div class="source-item"><span>'+x[0]+'</span><a href="'+x[1]+'" target="_blank" rel="noopener noreferrer" aria-label="'+x[0]+' дереккөзі жаңа терезеде ашылады">Ашу <svg class="ui-icon ui-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 19 19 5M5 5h14v14"/></svg></a></div>').join('')}
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-city-open]');if(open){showCity(open.dataset.cityOpen);return}
 const pin=e.target.closest('[data-pin]');if(pin){selectedCity=pin.dataset.pin;renderMap();return}
 const filter=e.target.closest('[data-filter]');if(filter){$$('[data-filter]').forEach(x=>x.classList.toggle('active',x===filter));renderCities(filter.dataset.filter);return}
 const route=e.target.closest('[data-route]');if(route){selectedRoute=route.dataset.route;renderBuilder();return}
 const add=e.target.closest('[data-add]');if(add){let id=add.dataset.add;custom=custom.includes(id)?custom.filter(x=>x!==id):custom.concat(id);renderBuilder();return}

});
$('#dialogClose').addEventListener('click',()=>$('#cityDialog').close());
$('#cityDialog').addEventListener('click',e=>{if(e.target===$('#cityDialog'))$('#cityDialog').close()});
$('#clearCustom')?.addEventListener('click',()=>{custom=[];renderBuilder()});
$('#menuToggle').addEventListener('click',e=>{let nav=$('#mainNav'),expanded=e.currentTarget.getAttribute('aria-expanded')==='true';e.currentTarget.setAttribute('aria-expanded',String(!expanded));nav.classList.toggle('open',!expanded)});
$$('#mainNav a').forEach(a=>a.addEventListener('click',()=>{$('#mainNav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false')}));
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.closest('.city-visual,.dialog-visual')?.classList.add('no-photo');e.target.style.display='none'}},true);
if($('#cityGrid'))renderCities();if($('#mapPins'))renderMap();if($('#routeResult'))renderBuilder();if($('#sourceList'))renderSources();

