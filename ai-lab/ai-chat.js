import {AI_API_BASE} from './ai-config.js?v=mentor-ai-1';

const rooms = new Map();
const errors = {
  not_configured: 'ЖИ қосылымы әлі бапталмаған. Төмендегі дайын кеңестерді қолдана аласың.',
  invalid_class_code: 'Сабақ коды сәйкес келмеді. Мұғалімнен кодты нақтылап ал.',
  rate_limited: 'Сұрақтар тым жиі жіберілді. Бір минуттан кейін қайта көр.',
  busy: 'Көмекші қазір бос емес. Біраздан кейін қайта көр.',
  provider_limit: 'ЖИ қызметінің тегін лимитіне жеттік. Кейінірек қайтала немесе дайын кеңесті қолдан.',
  request_too_large: 'Сұрағыңды қысқартып, қайта жібер.',
  conversation_too_long: 'Талқылау ұзарды. Жаңа талқылауды бастап көр.',
  origin_not_allowed: 'Бұл сайтқа ЖИ сервері әлі рұқсат бермеген. Мұғалімге хабарла.',
  request_failed: 'Жауапты алу мүмкін болмады. Қайта көр немесе дайын кеңесті қолдан.'
};

export function aiChatHTML(){return `<section class="live-ai" aria-labelledby="live-ai-heading">
 <div class="live-ai-heading"><h2 id="live-ai-heading">ЖИ-мен осы жерде талқыла</h2><span id="live-ai-provider">Қосылым тексерілуде</span></div>
 <p class="live-ai-description">Өз нұсқаңды айт. Көмекші бір жетекші сұрақпен келесі қадамыңды ойластыруға көмектеседі.</p>
 <p id="live-ai-status" class="live-ai-status" role="status">ЖИ қосылымы тексерілуде…</p>
 <form id="ai-code-form" class="ai-code-form" hidden><label for="ai-class-code">Мұғалім берген сабақ коды<input id="ai-class-code" type="password" maxlength="100" autocomplete="off"></label><button class="button secondary" type="submit">Кодты қолдану</button></form>
 <div id="live-ai-messages" class="live-ai-messages" role="log" aria-label="ЖИ-мен талқылау" aria-live="polite"></div>
 <div class="live-ai-starters"><button type="button" data-ai-question="Менің алгоритмімді тексеруге бір жетекші сұрақ қой." disabled>Алгоритмімді талқылау</button><button type="button" data-ai-question="Қате қадамды өзім табуым үшін нені тексерейін?" disabled>Қатені іздеу</button></div>
 <form id="live-ai-form"><label for="live-ai-input">Сұрағың немесе өз түсіндірмең</label><textarea id="live-ai-input" rows="3" maxlength="1200" placeholder="Менің ойымша ... Бірақ ... жерінде қиналдым." disabled></textarea><div class="live-ai-actions"><button type="submit" class="button primary" id="live-ai-send" disabled>Сұрақты жіберу</button><button type="button" class="button secondary" id="live-ai-cancel" hidden>Тоқтату</button><button type="button" class="text-button" id="live-ai-retry" hidden>Қайта жіберу</button><button type="button" class="text-button" id="live-ai-new">Жаңа талқылау</button></div></form>
 <p id="live-ai-error" class="live-ai-error" role="alert" hidden></p>
 <p class="live-ai-data">Жіберілетіні: осы миссия, алгоритмің, болжамың, орындалған қадамдар және хабарламаң. Аты-жөніңді не басқа жеке деректерді жазба. Жауапты робот алаңында тексер. Бұл талқылау бет ашық тұрғанда ғана сақталады.</p>
 </section>`;}

export function mountAIChat(root, {missionId, getContext}) {
  const shell = root.querySelector('.live-ai');
  if(!shell)return ()=>{};
  if(!rooms.has(missionId))rooms.set(missionId,{messages:[],draft:'',error:''});
  const room = rooms.get(missionId);
  const find = selector => shell.querySelector(selector);
  const input=find('#live-ai-input'),log=find('#live-ai-messages'),status=find('#live-ai-status');
  let active=true,ready=false,busy=false,requiresCode=false,controller=null;
  let code='';
  try { code=sessionStorage.getItem('tamashalike-ai-class-code')||''; } catch { /* Session storage is optional. */ }
  let clientId;
  try { clientId=sessionStorage.getItem('tamashalike-ai-client');if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem('tamashalike-ai-client',clientId);} } catch { clientId=crypto.randomUUID(); }
  input.value=room.draft;
  function paintMessages(){
    log.replaceChildren();
    if(!room.messages.length){const p=document.createElement('p');p.className='live-ai-empty';p.textContent='Алдымен өз шешіміңді не қиналған жеріңді жаз.';log.append(p);}
    for(const message of room.messages){const article=document.createElement('div');article.className='live-ai-message '+message.role;const label=document.createElement('strong');label.textContent=message.role==='user'?'Сен':'ЖИ көмекші';const text=document.createElement('p');text.textContent=message.content;article.append(label,text);log.append(article);}
    log.scrollTop=log.scrollHeight;
  }
  function paintControls(){
    input.disabled=!ready||busy||requiresCode&&!code;
    find('#live-ai-send').disabled=input.disabled;
    find('#live-ai-send').hidden=busy;
    find('#live-ai-cancel').hidden=!busy;
    find('#live-ai-new').disabled=busy||!room.messages.length;
    find('#live-ai-retry').hidden=busy||!ready||room.messages.at(-1)?.role!=='user';
    shell.querySelectorAll('[data-ai-question]').forEach(button=>button.disabled=input.disabled);
    log.setAttribute('aria-busy',String(busy));
    const error=find('#live-ai-error');error.hidden=!room.error;error.textContent=room.error;
  }
  function showStatus(text){status.textContent=text;}
  function headers(){return {'Content-Type':'application/json','X-Client-Id':clientId,...(code?{'X-Class-Code':code}:{})};}
  async function send(text, retry=false){
    if(!ready||busy||requiresCode&&!code)return;
    const content=(retry?room.messages.at(-1)?.content:text)?.trim();if(!content)return;
    room.error='';
    if(!retry){if(room.messages.at(-1)?.role==='user')room.messages.pop();room.messages.push({role:'user',content:content.slice(0,1200)});room.draft='';input.value='';}
    while(room.messages.length>9||room.messages.reduce((n,m)=>n+m.content.length,0)>5500)room.messages.splice(0,2);
    busy=true;controller=new AbortController();const timer=setTimeout(()=>controller?.abort(),35000);
    paintMessages();paintControls();showStatus('ЖИ жауабы дайындалуда…');
    try {
      const response=await fetch(AI_API_BASE.replace(/\/$/,'')+'/api/ai/chat',{method:'POST',headers:headers(),credentials:'omit',body:JSON.stringify({context:getContext(),messages:room.messages}),signal:controller.signal});
      const data=await response.json();
      if(!active)return;
      if(!response.ok)throw Object.assign(new Error(data.error||'request_failed'),{code:data.error});
      if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('empty_response');
      room.messages.push({role:'assistant',content:data.reply.slice(0,5000)});showStatus('ЖИ жауабын оқып, өз шешіміңді тексер.');
    } catch(error) {
      if(!active)return;
      room.error=error.name==='AbortError'?'Сұрау тоқтатылды. Қаласаң, қайта жібер.':errors[error.code]||errors.request_failed;
      if(error.code==='invalid_class_code'){code='';try{sessionStorage.removeItem('tamashalike-ai-class-code');}catch{}find('#ai-code-form').hidden=false;}
      showStatus('Бұл сұраққа ЖИ жауабы алынбады.');
    } finally {
      clearTimeout(timer);busy=false;controller=null;
      if(active){paintMessages();paintControls();}
    }
  }
  const onInput=()=>{room.draft=input.value;};
  const onSubmit=event=>{event.preventDefault();send(input.value);};
  const onCode=event=>{event.preventDefault();code=find('#ai-class-code').value.trim();try{sessionStorage.setItem('tamashalike-ai-class-code',code);}catch{}showStatus(code?'Сабақ коды келесі сұрақпен тексеріледі.':'Мұғалім берген сабақ кодын енгіз.');paintControls();};
  const onClick=event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.aiQuestion)send(button.dataset.aiQuestion);if(button.id==='live-ai-cancel')controller?.abort();if(button.id==='live-ai-retry')send('',true);if(button.id==='live-ai-new'){room.messages=[];room.error='';paintMessages();paintControls();showStatus('Жаңа талқылау. Өз нұсқаңнан баста.');}};
  input.addEventListener('input',onInput);find('#live-ai-form').addEventListener('submit',onSubmit);find('#ai-code-form').addEventListener('submit',onCode);shell.addEventListener('click',onClick);
  paintMessages();paintControls();
  async function check(){
    if(!AI_API_BASE){find('#live-ai-provider').textContent='Әзірге қосылмаған';showStatus(errors.not_configured);return;}
    controller=new AbortController();const timer=setTimeout(()=>controller?.abort(),10000);
    try{
      const response=await fetch(AI_API_BASE.replace(/\/$/,'')+'/api/ai/health',{credentials:'omit',signal:controller.signal});const data=await response.json();if(!active)return;
      ready=response.ok&&data.ready===true;requiresCode=data.requiresCode===true;
      find('#live-ai-provider').textContent=ready?'Groq · қосылым бапталған':'Қосылмаған';
      find('#ai-code-form').hidden=!ready||!requiresCode;
      showStatus(!ready?errors.not_configured:requiresCode&&!code?'Бастау үшін мұғалім берген сабақ кодын енгіз.':'Өз нұсқаңды жазып, талқылауды баста.');paintControls();
    }catch{if(active){find('#live-ai-provider').textContent='Қосылым жоқ';showStatus('ЖИ серверіне қосылу мүмкін болмады. Дайын кеңестерді қолдана аласың.');}}
    finally{clearTimeout(timer);controller=null;}
  }
  check();
  return ()=>{active=false;controller?.abort();input.removeEventListener('input',onInput);find('#live-ai-form').removeEventListener('submit',onSubmit);find('#ai-code-form').removeEventListener('submit',onCode);shell.removeEventListener('click',onClick);};
}
