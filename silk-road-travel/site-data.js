'use strict';
// One catalogue for maps, planning and visitor cards. Coordinates mark the object,
// not a verified vehicle entrance. Visit minutes are our planning allowances.
const heritageSites = [
 {id:'turkestan',city:'turkestan',name:'Қожа Ахмет Ясауи кесенесі',lat:43.2976944444,lon:68.2710555556,location:'Түркістан, тарихи орталық',minutes:90,source:'https://whc.unesco.org/en/list/1103/maps/',sourceName:'UNESCO · нысан координаттары',visitSource:'https://azretsultan.kz/'},
 {id:'otyrar',city:'otyrar',name:'Отырар қалашығы',lat:42.852822,lon:68.302987,location:'Отырар алқабы, Шәуілдір маңы',minutes:90,source:'https://rdr.ucl.ac.uk/articles/dataset/Otrar_archaeological_site_digital_geospatial_dataset_2016/11690835',sourceName:'UCL · археологиялық геодерек',visitSource:'https://archaeology.kz/heritages/244-otyrar-zhane-otyrar-alqaby'},
 {id:'arystanbab',city:'otyrar',name:'Арыстанбаб кесенесі',lat:42.85142,lon:68.26884,location:'Отырар ауданы, Шәуілдір маңы',minutes:45,phone:'+7 747 532 67 65',source:'https://kazakhstan.travel/en/attractions/369',sourceName:'Kazakhstan.travel · Арыстанбаб'},
 {id:'taraz',city:'taraz',name:'Көне Тараз музейі',lat:42.89980,lon:71.36690,location:'Тараз, көне қала археологиялық кешені',minutes:60,source:'https://kazakhstan.travel/en/attractions/199',sourceName:'Kazakhstan.travel · Көне Тараз'},
 {id:'karakhan',city:'taraz',name:'Қарахан кесенесі',lat:42.89950,lon:71.36560,location:'Тараз, Қарахан саябағы, Төле би / Байзақ батыр көшелері',minutes:30,hours:'Порталда: күн сайын 09:00–18:00',fee:'Порталда: тегін',phone:'+7 7262 43 08 26',source:'https://kazakhstan.travel/en/attractions/198',sourceName:'Kazakhstan.travel · Қарахан'},
 {id:'aisha-bibi',city:'taraz',name:'Айша бибі кесенесі',lat:42.84060,lon:71.21060,location:'Айша бибі ауылы, Тараз маңы',minutes:45,hours:'Порталда: күн сайын 09:00–18:00',fee:'Порталда: шамамен 200 ₸; нақты тарифті тексеріңіз',phone:'+7 7262 57 92 64',source:'https://kazakhstan.travel/en/attractions/196',sourceName:'Kazakhstan.travel · Айша бибі'},
 {id:'sairam',city:'sairam',name:'Қарашаш ана кесенесі',lat:42.29930,lon:69.75746,location:'Сайрам, негізгі жол қиылысының маңы',minutes:30,source:'https://kazakhstan.travel/en/attractions/473',sourceName:'Kazakhstan.travel · Қарашаш ана'},
 {id:'ibrahim-ata',city:'sairam',name:'Ибраһим ата кесенесі',lat:42.31902,lon:69.78208,location:'Сайрам, солтүстік-батыс бөлігі',minutes:30,source:'https://kazakhstan.travel/en/attractions/474',sourceName:'Kazakhstan.travel · Ибраһим ата'},
 {id:'talgar',city:'talgar',name:'Талхир қалашығы',lat:43.2777777778,lon:77.2222222222,location:'Талғар, археологиялық қалашық',minutes:60,source:'https://whc.unesco.org/en/list/1442/maps/',sourceName:'UNESCO · 1442-012 Talgar'},
 {id:'qoylyq',city:'qoylyq',name:'Қаялық қалашығы',lat:45.6655555556,lon:80.2605555556,location:'Қойлық ауылының шығыс шеті',minutes:60,source:'https://whc.unesco.org/en/list/1442/maps/',sourceName:'UNESCO · 1442-011 Kayalyk'}
];
const transitSites=[
 {id:'shymkent',name:'Шымкент · қала орталығы',lat:42.3155,lon:69.5869,transit:true},
 {id:'almaty',name:'Алматы · қала орталығы',lat:43.2389,lon:76.8897,transit:true},
 {id:'taldykorgan',name:'Талдықорған · қала орталығы',lat:45.0156,lon:78.3739,transit:true}
];
const placeById=Object.fromEntries([...heritageSites,...transitSites].map(s=>[s.id,s]));
for(const city of cities){const site=placeById[city.id];city.lat=site.lat;city.lon=site.lon;}
const roadStops={
 short:['turkestan','otyrar','arystanbab','turkestan'],
 medium:['shymkent','sairam','ibrahim-ata','turkestan','otyrar','arystanbab','shymkent'],
 long:['turkestan','otyrar','arystanbab','sairam','ibrahim-ata','aisha-bibi','taraz','karakhan','almaty','talgar','qoylyq','taldykorgan']
};
const observationTasks={
 turkestan:{question:'UNESCO мәртебесі қай нысанға қатысты?',answer:'Қожа Ахмет Ясауи кесенесіне. Қаланың бүкіл аумағына емес.',focus:'Кесененің көлемін, күмбезін және порталын салыстыр.'},
 otyrar:{question:'Қалашық пен Арыстанбаб кесенесіне бір белгі жеткілікті ме?',answer:'Жоқ. Екі нысан бөлек орналасады; картада екеуін де таңдау қажет.',focus:'Қазба орны мен сақталған ғимараттың айырмасын түсіндір.'},
 taraz:{question:'Айша бибіні қала орталығындағы аялдамаға біріктіре салуға бола ма?',answer:'Ол қала маңындағы бөлек нысан. Оған жеке жол және аралау уақыты қосылады.',focus:'Көне Тараз, Қарахан және Айша бибі арасындағы орынды картадан салыстыр.'},
 sairam:{question:'Қарашаш анадан кейінгі бөлек аялдама қандай?',answer:'Ибраһим ата кесенесі. Екі нүктенің арасына жол уақыты қосылады.',focus:'Екі кесененің картадағы орналасуын қарап, аралықты маршрутқа қос.'},
 talgar:{question:'Талғардың UNESCO мұрасы нақты немен байланысты?',answer:'Талхир археологиялық қалашығымен, Жібек жолы дәлізінің құрамдас нысанымен.',focus:'Бүгінгі қала мен археологиялық орын ұғымдарын ажырат.'},
 qoylyq:{question:'Қаялыққа сапарды жоспарлағанда нені алдын ала анықтаймыз?',answer:'Археологиялық орынға кіру жолын, көлікпен жетуді және қайтар уақытты.',focus:'Қойлық ауылы мен Қаялық қалашығының орналасуын картадан қара.'}
};
