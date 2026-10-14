export const rooms = {
  hall: { name: 'Басты зал', kicker: 'МУЗЕЙГЕ ҚОШ КЕЛДІҢІЗ', number: '00', summary: 'Өмір мен шығармашылық ізіне саяхат осы жерден басталады.', tint: '#b68b51' },
  life: { name: 'Өмір жолы', kicker: 'I ЗАЛ · ТҰЛҒА ТАРИХЫ', number: '01', summary: 'Балалық шақ, білім, отбасы және өмірдің маңызды белестері.', tint: '#a78767' },
  works: { name: 'Еңбектері мен шығармашылығы', kicker: 'II ЗАЛ · ШЫҒАРМАШЫЛЫҚ', number: '02', summary: 'Кітаптар, қолжазбалар және кәсіби еңбектер.', tint: '#957959' },
  legacy: { name: 'Марапаттары мен мұрасы', kicker: 'III ЗАЛ · МҰРА', number: '03', summary: 'Марапаттар, алғыс хаттар және кейінгі ұрпаққа қалған із.', tint: '#ae8d65' },
};

export const demoScenes = [
  { id: 'hall-1', room_id: 'hall', title: 'Орталық алаң', panorama_path: '/panoramas/hall-1.jpg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 0 },
  { id: 'hall-2', room_id: 'hall', title: 'Кіреберіс', panorama_path: '/panoramas/hall-2.jpg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 1 },
  { id: 'life-1', room_id: 'life', title: 'Өмір белестері', panorama_path: '/panoramas/life-1.jpg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 0 },
  { id: 'life-2', room_id: 'life', title: 'Естеліктер', panorama_path: '/panoramas/life-2.jpg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 1 },
  { id: 'works-1', room_id: 'works', title: 'Еңбектер залы', panorama_path: '/panoramas/works-1.jpg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 0 },
  { id: 'works-2', room_id: 'works', title: 'Кітаптар бұрышы', panorama_path: '/panoramas/heritage.svg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 1 },
  { id: 'legacy-1', room_id: 'legacy', title: 'Жетістіктер', panorama_path: '/panoramas/heritage.svg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 0 },
  { id: 'legacy-2', room_id: 'legacy', title: 'Мұрағат', panorama_path: '/panoramas/heritage.svg', initial_yaw: 0, initial_pitch: 0, published: true, sort_order: 1 },
];

// Deliberately content-free demonstration records: no invented biographical facts.
export const demoExhibits = [
  { id: 'demo-1', scene_id: 'hall-1', room_id: 'hall', title: 'Тұлғаның портреті', description: 'Бұл орынға тұлғаның фотосуреті мен расталған өмірбаяндық мәліметтері орналастырылады.', kind: 'photo', yaw: 0, pitch: .07, published: true, temporary: true, sort_order: 0 },
  { id: 'demo-2', scene_id: 'life-1', room_id: 'life', title: 'Өмірбаяндық мұрағат', description: 'Мұнда отбасы және өмір белестері туралы құжаттар мен фотосуреттер жинақталады.', kind: 'document', yaw: -.47, pitch: .08, published: true, temporary: true, sort_order: 0 },
  { id: 'demo-3', scene_id: 'life-2', room_id: 'life', title: 'Өмір кезеңдері', description: 'Расталған мерзімдер мен деректер енгізілген соң осы жерде интерактивті хронология пайда болады.', kind: 'text', yaw: .0, pitch: .08, published: true, temporary: true, sort_order: 1 },
  { id: 'demo-4', scene_id: 'works-1', room_id: 'works', title: 'Кітаптар жинағы', description: 'Бұл витринаға кітап мұқабалары, библиографиялық деректер және рұқсат етілген электрондық нұсқалар қосылады.', kind: 'book', yaw: 0, pitch: .04, published: true, temporary: true, sort_order: 0 },
  { id: 'demo-5', scene_id: 'works-2', room_id: 'works', title: 'Қолжазбалар', description: 'Қолжазбалардың түпнұсқа суреттері мен сипаттамалары кейіннен толықтырылады.', kind: 'document', yaw: .05, pitch: .08, published: true, temporary: true, sort_order: 1 },
  { id: 'demo-6', scene_id: 'legacy-1', room_id: 'legacy', title: 'Марапаттар топтамасы', description: 'Расталған марапаттар мен грамоталардың көшірмелері осы бөлімге енгізіледі.', kind: 'document', yaw: 0, pitch: .06, published: true, temporary: true, sort_order: 0 },
  { id: 'demo-7', scene_id: 'legacy-2', room_id: 'legacy', title: 'Естеліктер мұрағаты', description: 'Замандастар естелігі мен аудио, бейне жазбаларды орналастыруға арналған орын.', kind: 'audio', yaw: .03, pitch: .08, published: true, temporary: true, sort_order: 1 },
];

export const demoConfig = { museum_name: 'Алакөл шежіресінің шырақшысы: Мәкетай Жақыпбекұлының тарихи мұрасы және цифрлық портреті', person_name: 'Мәкетай (Марлен) Жақыпбекұлы', biography: '1935–2008 · Ұстаз, өлкетанушы, Алакөл тарихы мен шежіресін жинақтаушы. Өмірбаяндық мәлімет: Алакөл аудандық орталық кітапханасы.', hero_image_path: '/assets/photos/p05.jpg' };
