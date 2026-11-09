// Copies only public setup source. This page never receives an API key.
(() => {
 const allowed=new Set(['backend/ai-review.sql','supabase/functions/check-writing/index.ts']),cache=new Map();
 async function read(path){if(!allowed.has(path))throw Error('Белгісіз файл.');if(cache.has(path))return cache.get(path);const response=await fetch(path,{cache:'no-cache'});if(!response.ok)throw Error('Файл жүктелмеді. Жүктеу сілтемесін қолданып көріңіз.');const text=await response.text();cache.set(path,text);return text;}
 document.querySelectorAll('[data-source]').forEach(async el=>{try{el.textContent=await read(el.dataset.source);}catch(e){el.textContent=e.message;}});
 document.addEventListener('click',async event=>{const button=event.target.closest('[data-copy]');if(!button)return;const status=document.getElementById('ai-setup-status');button.disabled=true;try{const text=await read(button.dataset.copy);await navigator.clipboard.writeText(text);status.textContent='Код көшірілді. Оны Supabase редакторына қойыңыз.';}catch{status.textContent='Автоматты көшіру қолжетімсіз. «Кодын қарау» бөлімін ашып, мәтінді қолмен көшіріңіз немесе файлды жүктеңіз.';}finally{button.disabled=false;}});
})();
