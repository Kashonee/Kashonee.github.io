export const directions = {E:[1,0],N:[0,-1],W:[-1,0],S:[0,1]};
export const labels = {E:'Оңға',N:'Жоғары',W:'Солға',S:'Төмен'};
export const missions = [
  {id:'first',title:'Алғашқы алгоритм',concept:'Тізбектілік',grade:'5-сынып',level:'Бастапқы',minutes:5,start:[0,4],goal:[4,4],walls:[],limit:8,description:'Роботты найзағай белгісі бар қуат көзіне жеткіз. Әр команда роботты бір торға жылжытады.',question:'Қуат көзіне жету үшін робот неше рет оңға жүруі керек?',hint:['Робот пен қуат көзі бір қатарда тұр. Олардың арасындағы торларды сана.','Бір «Оңға» командасы бір торға жылжытады. Командалар санын қашықтықпен салыстыр.'],optimal:4},
  {id:'route',title:'Кедергіні айналып өт',concept:'Декомпозиция',grade:'5–6 сыныптар',level:'Бастапқы',minutes:7,start:[0,4],goal:[3,1],walls:[[1,4],[1,3],[1,2],[3,3],[4,3]],limit:12,description:'Қабырғаға соғылмай, қуат көзіне баратын жолды тап. Жолды екі бөлікке бөл.',question:'Алдымен қай бағытта жүру қажет? Жолды неше бөлікке бөлдің?',hint:['Оң жақтағы қабырғаға қара. Оның үстіңгі шеті қай қатарда?','Мәселені екіге бөл: алдымен қабырғадан жоғары көтеріл, содан кейін мақсатқа қарай жүр.'],optimal:6},
  {id:'loop',title:'Қайталауды қысқарт',concept:'Цикл',grade:'6-сынып',level:'Орташа',minutes:8,start:[0,4],goal:[4,0],walls:[],limit:12,description:'Алдымен оңға, одан кейін жоғары жүр. Қайталанатын қадамдарды «Қайталау» блогымен қысқарт.',question:'Сегіз қозғалысты екі цикл блогымен қалай жазуға болады?',hint:['Қай бағыттағы команда бірнеше рет қатарынан қайталанады?','«Қайталау» блогында бағыт пен қайталау санын таңда. Екі блокпен жолдың екі бөлігін жаз.'],optimal:8,require:'repeat'},
  {id:'branch',title:'Жолға қарай шешім қабылда',concept:'Тармақталу',grade:'7-сынып',level:'Орташа',minutes:10,start:[0,4],goal:[4,3],walls:[[2,4],[3,4],[4,4],[1,2],[2,2]],limit:12,description:'«Егер жол ашық» блогын қолдан. Алдыңғы бағыт жабық болса, басқа бағытты таңда.',question:'Жол ашық болғанда және жабық болғанда қандай екі әрекет орындалады?',hint:['Шарт әр орындалғанда роботтың дәл сол сәттегі орнын тексереді.','Оңға жол ашық болса оңға жүр, әйтпесе жоғары жүр деген блокты байқап көр. Содан кейін жолды жалғастыр.'],optimal:5,require:'if'},
  {id:'debug',title:'Алгоритмдегі қатені тап',concept:'Қатені түзету',grade:'7-сынып',level:'Орташа',minutes:8,start:[0,4],goal:[3,2],walls:[[2,4],[2,3],[4,2]],limit:12,description:'Дайын алгоритмде қате бар. Қадамдап орындап, қабырғаға соғылатын команданы ауыстыр.',question:'Алғашқы қате қай қадамда пайда болады? Оны қалай түзетесің?',hint:['«Бір қадам» батырмасымен орындап, әр команданың нәтижесін бақыла.','Екінші оңға қадам қабырғаға тіреледі. Қабырғаны жоғары жағынан айналып өт.'],optimal:5,initial:[{type:'move',dir:'E'},{type:'move',dir:'E'},{type:'move',dir:'N'},{type:'move',dir:'N'},{type:'move',dir:'E'}]},
  {id:'mission',title:'Ақылды маршрут',concept:'Оңтайландыру',grade:'8-сынып',level:'Күрделі',minutes:12,start:[0,4],goal:[4,0],walls:[[1,4],[1,3],[1,2],[3,1],[3,2],[3,3]],limit:16,description:'Тізбек, цикл немесе шартты біріктір. Қауіпсіз жол құр және шешіміңнің тиімділігін түсіндір.',question:'Қай жол қысқа? Неге сен таңдаған алгоритмді тиімді деп ойлайсың?',hint:['Мақсатқа жететін бір жолды тап, содан кейін ғана қысқартуға кіріс.','Жоғарғы қатар бос. Алдымен сол қатарға шығатын жолды қарастыр.'],optimal:8}
];
export function canMove(mission,position,dir){
  const d=directions[dir]; if(!d)return false;
  const x=position[0]+d[0],y=position[1]+d[1];
  return x>=0&&y>=0&&x<5&&y<5&&!mission.walls.some(w=>w[0]===x&&w[1]===y);
}
export function expand(program){
  if(!Array.isArray(program)||program.length>24)throw Error('Алгоритмде 24 блоктан артық болмауы керек.');
  return program.flatMap((c,index)=>{
    if(!c||!directions[c.dir]||!['move','repeat','if'].includes(c.type))throw Error('Команда дұрыс емес.');
    if(c.type==='if'&&!directions[c.other])throw Error('Шарттың екінші бағытын таңда.');
    const count=c.type==='repeat'?Number(c.count):1;
    if(!Number.isInteger(count)||count<1||count>8)throw Error('Қайталау саны 1 мен 8 арасында болуы керек.');
    return Array.from({length:count},()=>({...c,index}));
  });
}
export function traceProgram(mission,program){
  let position=[...mission.start]; const trace=[];
  for(const c of expand(program)){
    const dir=c.type==='if'&&!canMove(mission,position,c.dir)?c.other:c.dir;
    if(!canMove(mission,position,dir))return {position,trace,success:false,error:'blocked',failedBlock:c.index};
    const delta=directions[dir];position=[position[0]+delta[0],position[1]+delta[1]];
    trace.push({position:[...position],block:c.index,dir});
  }
  const reached=position.every((n,i)=>n===mission.goal[i]);
  const requirement=!mission.require||program.some(c=>c.type===mission.require);
  return {position,trace,success:reached&&requirement,error:!reached?'unfinished':!requirement?'requirement':null};
}
export const quizQuestions = [
  {q:'Алгоритм дегеніміз не?',options:['Мәселені шешетін реттелген қадамдар','Кез келген сурет','Тек компьютердің атауы'],answer:0,skill:'Тізбектілік'},
  {q:'Робот 2 тор оңға, 1 тор жоғары жүруі керек. Қай тізбек дұрыс?',options:['Жоғары, жоғары, оңға','Оңға, оңға, жоғары','Оңға, төмен, солға'],answer:1,skill:'Тізбектілік'},
  {q:'«Егер жаңбыр жауса, қолшатыр ал» — алгоритмнің қай түрі?',options:['Цикл','Тек тізбек','Тармақталу'],answer:2,skill:'Тармақталу'},
  {q:'«Оңға» командасын 5 рет жазуды қалай қысқартамыз?',options:['Қайталау 5 рет: оңға','Егер оңға болса: тоқта','Бір рет солға жүр'],answer:0,skill:'Цикл'},
  {q:'Алгоритм қате нәтиже берді. Не істеген дұрыс?',options:['Бірден барлық команданы жою','Қадамдап тексеріп, алғашқы қатені табу','Нәтижені тексермей қабылдау'],answer:1,skill:'Қатені түзету'}
];

export const finalQuizQuestions = [
  {q:'Кітапты сөреге қою үшін «кітапты ал → сөрені тап → орнына қой» деп жаздық. Бұл не?',options:['Кездейсоқ сөздер','Реттелген әрекеттерден тұратын алгоритм','Тек бір шарт'],answer:1,skill:'Тізбектілік'},
  {q:'Робот 1 тор жоғары, одан кейін 3 тор оңға жүруі керек. Қай тізбек дұрыс?',options:['Оңға, жоғары, жоғары, оңға','Оңға, оңға, оңға, төмен','Жоғары, оңға, оңға, оңға'],answer:2,skill:'Тізбектілік'},
  {q:'«Егер есік ашық болса, кір; әйтпесе қоңырауды бас». Мұнда не бар?',options:['Шартқа байланысты екі әрекеттің бірін таңдау','Бір әрекетті міндетті түрде қайталау','Ешқандай реті жоқ әрекеттер'],answer:0,skill:'Тармақталу'},
  {q:'«Қайталау 3 рет: жоғары» блогына қай тізбек сәйкес?',options:['Жоғары, оңға, жоғары','Жоғары, жоғары, жоғары','Оңға, оңға, оңға'],answer:1,skill:'Цикл'},
  {q:'Робот үшінші қадамда қабырғаға тірелді. Қатені қалай тексересің?',options:['Бірден мақсатты ауыстырамын','Нәтижеге қарамай қайта іске қосамын','Алғашқы екі қадамды сақтап, үшінші команда мен жолды тексеремін'],answer:2,skill:'Қатені түзету'}
];

export const quizSets = {
  initial: {variant: 'A-v1', label: 'A нұсқасы · жаттығуға дейін', questions: quizQuestions},
  final: {variant: 'B-v1', label: 'B нұсқасы · жаттығудан кейін', questions: finalQuizQuestions}
};
