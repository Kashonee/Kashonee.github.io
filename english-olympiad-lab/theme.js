/* One preference shared by the public site and both account interfaces. */
(() => {
 let preference='system';try{preference=localStorage.getItem('qaisar-theme')||'system';}catch{}
 if(!['light','dark','system'].includes(preference))preference='system';
 const system=window.matchMedia?.('(prefers-color-scheme: dark)');
 function apply(){const dark=preference==='dark'||preference==='system'&&system?.matches;document.documentElement.setAttribute('data-theme',dark?'dark':'light');document.documentElement.style.colorScheme=dark?'dark':'light';return dark?'dark':'light';}
 window.QAISAR_THEME={current:apply,get preference(){return preference;},set(value){preference=['light','dark','system'].includes(value)?value:'system';try{localStorage.setItem('qaisar-theme',preference);}catch{}return apply();},toggle(){return this.set(apply()==='dark'?'light':'dark');}};
 system?.addEventListener?.('change',()=>{if(preference==='system')apply();});apply();
})();
