let DEVIANTS = [];
let CATEGORIES = {};
let META = {};
let VARIANTS = {};

const ROLE_GROUPS = {
  damage: { label: 'Урон в бою', category: 'combat', roles: ['Ближний бой', 'Взрывной урон', 'Ледяной урон', 'Метка цели', 'Огонь', 'Урон', 'Усиление оружия'] },
  support: { label: 'Поддержка', roles: ['Воскрешение', 'Восстановление игрока', 'Восстановление рассудка', 'Восстановление энергии', 'Лечение', 'Отдых', 'Поддержка', 'Поддержка базы'] },
  control: { label: 'Контроль', roles: ['Заморозка', 'Контроль', 'Контроль врагов', 'Контроль толпы', 'Ловушки', 'Отвлечение', 'Приманка'] },
  defense: { label: 'Защита', roles: ['Защита', 'Защита базы', 'Защитный расходник', 'Перенос урона'] },
  resources: { label: 'Сбор ресурсов', roles: ['Добыча древесины', 'Добыча нефти', 'Добыча руды', 'Добыча шкур', 'Награды', 'Сбор растений', 'Фарм ресурсов', 'Экспедиции'] },
  farming: { label: 'Фермерство', roles: ['Мутация культур', 'Полив', 'Посадка и сбор', 'Приготовление пищи', 'Фермерство'] },
  production: { label: 'Производство и расходники', roles: ['Маскировка', 'Метательное оружие', 'Переработка топлива', 'Продление прихотей', 'Работа печей', 'Ремонт', 'Ремонт базы', 'Тактические предметы', 'Тактический расходник', 'Усиление турелей и дронов'] },
  utility: { label: 'Мобильность и утилиты', roles: ['Мобильность', 'Переносимый вес', 'PvP', 'Рыбалка', 'Скрытность', 'Телепортация', 'Телепортация базы', 'Телепортация команды', 'Энергоснабжение базы'] }
};

// Функция санитизации данных для безопасного вывода в HTML
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Приоритет локальных кэшированных картинок (WebP) перед удаленным CDN
function getDeviantImage(d) {
  return d.id ? `images/${d.id}.webp` : (d.image || '');
}

// Каскадная обработка ошибок загрузки изображений (Local -> CDN -> Эмодзи)
function handleImageError(img) {
  if (!img) return;
  const remote = img.getAttribute('data-remote');
  if (remote && img.src !== remote) {
    img.removeAttribute('data-remote');
    img.src = remote;
    return;
  }
  const parent = img.parentElement;
  if (parent) {
    const fallback = img.getAttribute('data-fallback') || '◈';
    parent.innerHTML = `<div class="placeholder">${escapeHtml(fallback)}</div>`;
  }
}

// ==========================================
// ИНТЕРАКТИВНЫЕ ЛОКАЦИИ, СЦЕНАРИИ И КООРДИНАТЫ
// ==========================================

const SCENARIO_DEFS = {
  all: { id: 'all', label: 'Все сценарии', title: 'Все сценарии (Manibus, Evolution, WoW)', icon: '🌐', class: 'sc-all' },
  winter: { id: 'winter', label: 'Way of Winter', title: 'Сценарий The Way of Winter (Аркам)', icon: '❄️', class: 'sc-winter' },
  manibus: { id: 'manibus', label: 'Manibus', title: 'Сценарий Manibus (Novice / Hard)', icon: '🔥', class: 'sc-manibus' },
  prism: { id: 'prism', label: 'Prismverse / SCP', title: 'Сценарий Prismverse\'s Clash / SCP', icon: '🔮', class: 'sc-prism' },
  collab: { id: 'collab', label: 'Коллаборация', title: 'Особое событие / Коллаборация (Palworld)', icon: '⚡', class: 'sc-collab' }
};

const SOURCE_DEFS = {
  silo: { id: 'silo', label: 'Бункер (Silo)', title: 'Бункер сдерживания (Securement Silo)', icon: '🏛️', class: 'src-silo', spawnNote: 'Инстанс подземелья (Securement Silo)' },
  monolith: { id: 'monolith', label: 'Монолит', title: 'Монолит (Мировой босс)', icon: '⚔️', class: 'src-monolith', spawnNote: 'Мировой босс / Монолит' },
  world: { id: 'world', label: 'Открытый мир', title: 'Открытый мир / Исследование', icon: '🌲', class: 'src-world', spawnNote: 'Точки спавна в открытом мире' },
  quest: { id: 'quest', label: 'Квест Lowe', title: 'Сюжетное задание / Задание Lowe', icon: '📜', class: 'src-quest', spawnNote: 'Награда за цепочку заданий' },
  gathering: { id: 'gathering', label: 'Сбор / Ресурсы', title: 'Сбор ресурсов, рыбалка или фермерство', icon: '⛏️', class: 'src-gathering', spawnNote: 'Добыча руды, рыбалка, огород или рубка' },
  event: { id: 'event', label: 'Эвент / PvP', title: 'Публичные эвенты и PvP активности', icon: '🛡️', class: 'src-event', spawnNote: 'Публичные события и испытания' }
};

const DEVIANT_LOCATION_DATA = {
  'butterfly': { scenario: 'manibus', sourceType: 'world', spot: 'Пустой Monolith / Обучение', spotShort: 'Monolith (165, -3708)', coords: '165, -3708', easyTip: 'Обучение Manibus (Novice) или нижний этаж пустого Монолита' },
  'festering': { scenario: 'all', sourceType: 'monolith', spot: 'Monolith of Greed', spotShort: 'Monolith of Greed', coords: '6480, -5620', easyTip: 'Победа над Ravenous Hunter на сложности Normal или Hard' },
  'rebecca': { scenario: 'all', sourceType: 'silo', spot: 'LEA Research Lab', spotShort: 'LEA Lab', coords: '5320, -1450', easyTip: 'Финальный босс секретной лаборатории LEA в Red Sands' },
  'beaver': { scenario: 'all', sourceType: 'world', spot: 'Meyer’s Market (Доки)', spotShort: 'Meyer’s Docks', coords: '5760, -6750', easyTip: 'Деревянные мостки у реки к югу от рынка Мейера в Broken Delta' },
  'digby': { scenario: 'all', sourceType: 'gathering', spot: 'Рудные узлы мира', spotShort: 'Рудные жилы', coords: null, easyTip: 'Добыча медной или серебряной руды в любой точке карты' },
  'enchanting': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - Theta', spotShort: 'Silo Theta', coords: '340, -1200', easyTip: 'Награда за прохождение Бункера Theta в Red Sands' },
  'frog': { scenario: 'all', sourceType: 'world', spot: 'Broken Delta / Озеро', spotShort: 'Broken Delta', coords: '5652, -3856', easyTip: 'Юго-восток от Refinery Pollution Point у водоема' },
  'beehive': { scenario: 'all', sourceType: 'world', spot: 'Citrus County (Сады)', spotShort: 'Citrus County', coords: '5930, -5080', easyTip: 'Фермы Dayton Wetlands и Sutherland Family Orchard' },
  'harveseed': { scenario: 'all', sourceType: 'monolith', spot: 'Gaia Cliff Monolith', spotShort: 'Gaia Cliff', coords: '4320, -6050', easyTip: 'Победа над боссом Треантом (Treant) в Broken Delta' },
  'voodoo': { scenario: 'all', sourceType: 'world', spot: 'Coastside Plaza / Sunbury', spotShort: 'Coastside Plaza', coords: '7300, -4810', easyTip: 'Крыша школы Sunbury Middle School или Coastside Plaza' },
  'growshroom': { scenario: 'all', sourceType: 'gathering', spot: 'Пещера Sunbury', spotShort: 'Пещера Sunbury', coords: '5230, -6980', easyTip: 'Сбор любых грибов или пещера над школой Sunbury' },
  'atomic': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - EX1', spotShort: 'Silo EX1', coords: '1850, -3250', easyTip: 'Финальный босс в Бункере EX1 (Chalk Peak)' },
  'lonewolf': { scenario: 'all', sourceType: 'monolith', spot: 'Monolith of Thirst', spotShort: 'Monolith of Thirst', coords: '850, -4200', easyTip: 'Победа над Shadow Hunter в Chalk Peak' },
  'teddy': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - Theta', spotShort: 'Silo Theta', coords: '340, -1200', easyTip: 'Скрытый сундук после босса в Бункере Theta' },
  'eel': { scenario: 'all', sourceType: 'gathering', spot: 'Любые водоёмы мира', spotShort: 'Рыбалка', coords: null, easyTip: 'Рыбалка на тесто или специализированную наживку' },
  'gingerbread': { scenario: 'all', sourceType: 'world', spot: 'Dayton / Broken Delta', spotShort: 'Dayton / Delta', coords: '5900, -6100', easyTip: 'Пряничные домики в стартовых зонах Dayton Wetlands' },
  'pyro-dino': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - Phi', spotShort: 'Silo Phi', coords: '4250, -4100', easyTip: 'Секретная Seepage Zone в Бункере Phi (Iron River)' },
  'mr-wish': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - Sigma', spotShort: 'Silo Sigma', coords: '4901, -5421', easyTip: 'Скрытая keycard-комната с игровыми автоматами в Бункере Sigma' },
  'grumpy-bulb': { scenario: 'all', sourceType: 'gathering', spot: 'Домашний огород', spotShort: 'Грядки базы', coords: null, easyTip: 'Сбор урожая на домашнем участке при посадке семян' },
  'polar-jelly': { scenario: 'all', sourceType: 'event', spot: 'Эвент Cargo Scramble', spotShort: 'Cargo Scramble', coords: null, easyTip: 'Участие в публичном динамическом событии с медузой на грузовике' },
  'by-the-wind': { scenario: 'prism', sourceType: 'event', spot: 'Prime War / Frontier', spotShort: 'Prime War', coords: null, easyTip: 'Награда за победу над боссами Великой Войны на рубеже' },
  'shattered-maiden': { scenario: 'all', sourceType: 'silo', spot: 'Silo Theta / Квест Lowe', spotShort: 'Silo Theta', coords: '340, -1200', easyTip: 'Задание Farmside Fright от Lowe в Tall Grass Inn или Бункер Theta' },
  'mini-feaster': { scenario: 'all', sourceType: 'quest', spot: 'Квест Lowe / Mist Zones', spotShort: 'Mist Zones', coords: null, easyTip: 'Задание Lord of the Quest или зачистка зон тумана' },
  'mini-wonder': { scenario: 'all', sourceType: 'quest', spot: 'Blackfell / Крафт гранат', spotShort: 'Blackfell', coords: '4150, -1400', easyTip: 'Квест Lowe в Blackfell или крафт Vortex Generator' },
  'zeno-purifier': { scenario: 'manibus', sourceType: 'world', spot: 'Season Goals / Оружие', spotShort: 'Season Goals', coords: null, easyTip: 'Выполнение целей Challenge 1-го сезона Manibus' },
  'masonic-pyramid': { scenario: 'prism', sourceType: 'event', spot: 'Prime War (PvP)', spotShort: 'Prime War PvP', coords: null, easyTip: 'Участие в PvP-версии эвента Prime War на рубежах' },
  'hug-in-a-bowl': { scenario: 'all', sourceType: 'world', spot: 'Broken Delta', spotShort: 'Broken Delta', coords: '5767, -6038', easyTip: 'Лапшичные и кухни в поселениях Broken Delta' },
  'disco-ball': { scenario: 'all', sourceType: 'world', spot: 'Ходячий дом (Bus)', spotShort: 'Walking House', coords: null, easyTip: 'Поражение светофоров ходячего автобуса в Dayton / Delta' },
  'space-turner': { scenario: 'all', sourceType: 'world', spot: 'Дверные загадки Dayton', spotShort: 'Dayton Wetlands', coords: '6200, -5400', easyTip: 'Решение пространственных головоломок с дверями' },
  'dream-catcher': { scenario: 'all', sourceType: 'monolith', spot: 'Монолит Миража', spotShort: 'Mirage Monolith', coords: '2900, -3900', easyTip: 'Победа над третьим боссом Арахсиамом в Mirage Monolith' },
  'pup-buddy': { scenario: 'all', sourceType: 'world', spot: 'Морфические ящики Dayton', spotShort: 'Brookham (Dayton)', coords: '5670, -5380', easyTip: 'Поиск скрытых морфических сундуков в Brookham' },
  'strange-door': { scenario: 'all', sourceType: 'world', spot: 'Дверные аномалии Iron River', spotShort: 'Iron River', coords: '5050, -4380', easyTip: 'Прохождение пространственных дверных порталов' },
  'party-monkey': { scenario: 'all', sourceType: 'world', spot: 'Заводы Iron River', spotShort: 'Iron River', coords: '4850, -3950', easyTip: 'Выполнение производственных работ в Iron River' },
  'orb-lightning': { scenario: 'all', sourceType: 'world', spot: 'Военная база Gaia', spotShort: 'Gaia Base', coords: '3900, -4600', easyTip: 'Помещение у неработающих лифтов на военной базе Gaia' },
  'artisans-touch': { scenario: 'all', sourceType: 'world', spot: 'Blackfell Fallen Zone', spotShort: 'Blackfell Zone', coords: '4150, -1400', easyTip: 'Дроп с мини-босса «Скорняк» или «Прогноз погоды»' },
  'upper-world-spawn': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - PSI', spotShort: 'Silo PSI', coords: '2100, -2800', easyTip: 'Финальный босс в Бункере PSI' },
  'atomic-snail': { scenario: 'all', sourceType: 'event', spot: 'Prime War / Сундуки Stardust III', spotShort: 'Prime War III', coords: null, easyTip: 'Сундуки Stardust Advent III в Prime War либо открытый мир в SCP-сценарии' },
  'snow-globe': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - PSI', spotShort: 'Silo PSI', coords: '2100, -2800', easyTip: 'Дроп с финального босса в Бункере PSI' },
  'chefosaurus-rex': { scenario: 'all', sourceType: 'silo', spot: 'Securement Silo - Phi', spotShort: 'Silo Phi', coords: '4250, -4100', easyTip: 'Успешная зачистка Бункера Фи в Iron River' },
  'extradimensional-cat': { scenario: 'all', sourceType: 'world', spot: 'Поселения (Deadsville)', spotShort: 'Deadsville / Market', coords: '6020, -5680', easyTip: 'Возле Worldstone или внутри зданий Deadsville и Meyer’s Market' },
  'fetch-a-lot-bunny': { scenario: 'all', sourceType: 'gathering', spot: 'Деревья Драцены', spotShort: 'Драцена (Лес)', coords: null, easyTip: 'Рубка деревьев драцены вольфрамовым топором' },
  'nutcracker': { scenario: 'all', sourceType: 'monolith', spot: 'Forsaken Monolith', spotShort: 'Forsaken Monolith', coords: '4200, -1180', easyTip: 'Победа над пятым боссом Менсдевораном' },
  'h37': { scenario: 'all', sourceType: 'silo', spot: 'Silo Alpha / Greywater', spotShort: 'Silo Alpha', coords: '7120, -4930', easyTip: 'Квест «Осколки памяти» в Greywater Camp или Бункер Альфа' },
  'lethal-rabbit': { scenario: 'all', sourceType: 'gathering', spot: 'Дикие кролики по миру', spotShort: 'Охота на кроликов', coords: null, easyTip: 'Охота и свежевание диких кроликов на равнинах' },
  'paper-doll': { scenario: 'all', sourceType: 'world', spot: 'Breezy Shores / High Banks', spotShort: 'Breezy Shores', coords: '5750, -6400', easyTip: 'Поиск на крышах и в спальнях заброшенных домов' },
  'flame-essence': { scenario: 'all', sourceType: 'world', spot: 'Sutherland / Greywater', spotShort: 'Sutherland Plant', coords: '5100, -3150', easyTip: 'Трубы химзавода Сазерленда или промзона Greywater' },
  'rain-man': { scenario: 'all', sourceType: 'world', spot: 'Sutherland Chemical Plant', spotShort: 'Sutherland Plant', coords: '5410, -5520', easyTip: 'Победа над мини-боссом Rainfall Reaper' },
  'ice-pot': { scenario: 'winter', sourceType: 'world', spot: 'The Way of Winter (Arkam)', spotShort: 'Arkam (Зима)', coords: '-2850, 3100', easyTip: 'Исследование ледяных монолитов и руин биома Arkam' },
  'snowsprite': { scenario: 'winter', sourceType: 'world', spot: 'Хребты Arkam (Way of Winter)', spotShort: 'Хребты Arkam', coords: '-2400, 3500', easyTip: 'Ледяные алтари и бункерное хранилище в снежных горах Arkam' },
  'tar-pudding': { scenario: 'winter', sourceType: 'world', spot: 'Нефтяные вышки (WoW / Red Sands)', spotShort: 'Нефтяные вышки', coords: '5200, -2100', easyTip: 'Нефтяные насосы и битумные озёра на севере или в Red Sands' },
  'hydronaut-fish': { scenario: 'all', sourceType: 'gathering', spot: 'Побережья и доки', spotShort: 'Морская рыбалка', coords: null, easyTip: 'Рыбалка на редкие блесны или контейнеры в доках' },
  'invincible-sun': { scenario: 'all', sourceType: 'monolith', spot: 'Монолиты высокой сложности', spotShort: 'Мастер-монолиты', coords: null, easyTip: 'Эвенты Starfall и победа над эндгейм-боссами высокой сложности' },
  'snapshot': { scenario: 'all', sourceType: 'world', spot: 'Фотостудии и офисы Rosetta', spotShort: 'Офисы Rosetta', coords: null, easyTip: 'Поиск в закрытых офисах Rosetta и исследовательских центрах' },
  'whalepup': { scenario: 'all', sourceType: 'event', spot: 'Сезонные рейдовые награды', spotShort: 'Сезонные рейды', coords: null, easyTip: 'Высокоуровневые испытания и сезонные рейдовые эвенты' },
  'zapamander': { scenario: 'all', sourceType: 'world', spot: 'Электростанции Chalk Peak', spotShort: 'Chalk Peak', coords: '1400, -3600', easyTip: 'Зоны грозовых аномалий и ЛЭП возле электростанций' },
  'wish-box': { scenario: 'all', sourceType: 'world', spot: 'Пространственные сундуки', spotShort: 'Тайники загадок', coords: null, easyTip: 'Решение пространственных загадок и тайников' },
  'doctor-raven': { scenario: 'all', sourceType: 'world', spot: 'Лаборатории Red Sands', spotShort: 'Red Sands Labs', coords: '4950, -1650', easyTip: 'Фармацевтические клиники и больницы Red Sands' },
  'director-fox': { scenario: 'all', sourceType: 'world', spot: 'Небоскрёбы Blackfell', spotShort: 'Blackfell HQ', coords: '4250, -1350', easyTip: 'Штаб-квартиры корпораций и бизнес-центры Blackfell' },
  'brave-george': { scenario: 'all', sourceType: 'world', spot: 'Wish Land / Аттракционы', spotShort: 'Wish Land', coords: '-650, 4400', easyTip: 'Детские парки и средневековые аттракционы Wish Land' },
  'soul-summoner': { scenario: 'all', sourceType: 'world', spot: 'Кладбища и склепы', spotShort: 'Склепы (Ночь)', coords: '1900, -4800', easyTip: 'Ночные призрачные аномалии в туманных ущельях' },
  'gazocchio': { scenario: 'winter', sourceType: 'quest', spot: 'Vena Fjord / Wish Land - West', spotShort: 'Vena Fjord', coords: '-320, 4820', easyTip: 'Квест Lowe «Deviation - Gazocchio» в Vena Fjord (Way of Winter)' },
  'behemoth': { scenario: 'prism', sourceType: 'event', spot: 'Сценарий SCP / Fusion Pod', spotShort: 'SCP / Fusion Pod', coords: null, easyTip: 'Синтез девиантов в Лаборатории слияния или покупка Species Code' },
  'blackback': { scenario: 'collab', sourceType: 'quest', spot: 'Коллаборация / Задания Lowe', spotShort: 'Задания Lowe', coords: null, easyTip: 'Специальные задания спасения у персонажа Lowe' },
  'cattiva': { scenario: 'collab', sourceType: 'event', spot: 'Коллаборация Palworld (Архив)', spotShort: 'Эвент завершён', coords: null, easyTip: 'Событие завершено 21.01.2026. Доступен только обмен между игроками или Eternaland' },
  'chillet': { scenario: 'collab', sourceType: 'event', spot: 'Коллаборация Palworld (Архив)', spotShort: 'Эвент завершён', coords: null, easyTip: 'Событие завершено 21.01.2026. Доступен только обмен между игроками или Eternaland' }
};

function getDeviantLocationInfo(d) {
  if (!d) return {};
  const meta = DEVIANT_LOCATION_DATA[d.id] || {};
  let scenario = meta.scenario;
  let sourceType = meta.sourceType;
  let spot = meta.spot;
  let spotShort = meta.spotShort;
  let coords = meta.coords;
  let easyTip = meta.easyTip;

  const locText = [d.acquisition?.location, d.acquisition?.method, d.acquisition?.tips].filter(Boolean).join(' ');

  if (!coords) {
    const coordsMatch = locText.match(/(-?\d{2,5}\s*,\s*-?\d{2,5})/);
    if (coordsMatch) {
      coords = coordsMatch[1].replace(/\s+/g, ' ');
    }
  }

  if (!scenario) {
    if (/winter|arkam|ледян/i.test(locText)) scenario = 'winter';
    else if (/palworld|paradise island|otherworldly/i.test(locText)) scenario = 'collab';
    else if (/prime war|scp|pvp|frontier/i.test(locText)) scenario = 'prism';
    else if (/manibus/i.test(locText)) scenario = 'manibus';
    else scenario = 'all';
  }

  if (!sourceType) {
    if (/silo|силос|бункер|секретн.*лаборатори/i.test(locText)) sourceType = 'silo';
    else if (/monolith|монолит/i.test(locText)) sourceType = 'monolith';
    else if (/квест|lowe|задани/i.test(locText)) sourceType = 'quest';
    else if (/рыбал|рудн|гриб|дерев|кролик|огород|крафт/i.test(locText)) sourceType = 'gathering';
    else if (/эвент|event|cargo|prime war|battle pass|чек-ин/i.test(locText)) sourceType = 'event';
    else sourceType = 'world';
  }

  const scDef = SCENARIO_DEFS[scenario] || SCENARIO_DEFS.all;
  const srcDef = SOURCE_DEFS[sourceType] || SOURCE_DEFS.world;

  return {
    scenario,
    scenarioLabel: scDef.label,
    scenarioTitle: scDef.title,
    scIcon: scDef.icon,
    scClass: scDef.class,
    sourceType,
    srcLabel: srcDef.label,
    srcTitle: srcDef.title,
    srcIcon: srcDef.icon,
    srcClass: srcDef.class,
    spawnNote: srcDef.spawnNote,
    spot: spot || d.acquisition?.location || srcDef.title,
    spotShort: spotShort || spot || srcDef.label,
    coords: coords || null,
    easyTip: easyTip || d.acquisition?.tips || 'Проверьте локацию на карте'
  };
}

function copyCoordinates(coords, el) {
  if (!coords) return;
  const cleanCoords = coords.trim();
  navigator.clipboard.writeText(cleanCoords).then(() => {
    onCoordsCopied(cleanCoords, el);
  }).catch(() => {
    try {
      const ta = document.createElement('textarea');
      ta.value = cleanCoords;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onCoordsCopied(cleanCoords, el);
    } catch (e) {
      showToast(`Координаты: ${cleanCoords}`);
    }
  });
}

function onCoordsCopied(coords, el) {
  if (el) {
    const origHtml = el.innerHTML;
    el.classList.add('copied');
    const textEl = el.querySelector('.btn-copy-text');
    if (textEl) {
      textEl.textContent = '✔ Скопировано!';
    } else {
      el.textContent = '✔ Скопировано!';
    }
    setTimeout(() => {
      el.classList.remove('copied');
      el.innerHTML = origHtml;
    }, 2200);
  }
  showToast(`📍 Координаты [${coords}] скопированы в буфер обмена!`);
}

function showToast(message) {
  let toast = document.getElementById('wikiToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wikiToast';
    toast.className = 'wiki-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2800);
}

async function loadData() {
  try {
    const [response, varResponse] = await Promise.all([
      fetch('data/deviants.json'),
      fetch('data/variants.json').catch(() => null)
    ]);

    if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
    
    const data = await response.json();
    DEVIANTS = data.deviants || [];
    CATEGORIES = data.categories || {};
    META = data.meta || {};
    
    if (varResponse && varResponse.ok) {
      try {
        const varData = await varResponse.json();
        VARIANTS = varData.variants || {};
        DEVIANTS.forEach(d => {
          if (VARIANTS[d.id]) {
            d.variants = VARIANTS[d.id];
          }
        });
        console.log(`🌈 Загружены редкие морфы для ${Object.keys(VARIANTS).length} девиантов`);
      } catch (err) {
        console.warn('⚠️ Ошибка парсинга data/variants.json:', err);
      }
    }

    document.getElementById('lastUpdate').textContent = formatDate(META.lastChecked);
    document.getElementById('totalCount').textContent = DEVIANTS.length;
    console.log(`✅ Успешно загружено ${DEVIANTS.length} девиантов из data/deviants.json`);
  } catch (e) {
    console.error('❌ Ошибка загрузки данных:', e);
    document.getElementById('deviantsGrid').innerHTML =
      '<div class="empty-state"><h3>Ошибка загрузки данных</h3><p>Убедитесь, что вы открыли файл через Live Server (правая кнопка мыши -> Open with Live Server), а не двойным кликом.</p></div>';
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

const state = {
  search: '', category: 'all', role: 'all', scenario: 'all', source: 'all', confidence: 'all', sort: 'name',
  favOnly: false,
  colorblind: JSON.parse(localStorage.getItem('oh_colorblind') || 'false'),
  favorites: JSON.parse(localStorage.getItem('oh_favorites') || '[]'),
  compareList: JSON.parse(localStorage.getItem('oh_compare') || '[]'),
  quickSection: null,
  view: 'deviants',
  traitScope: 'all',
  traitKind: 'all'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  buildCategoryFilter();
  buildRoleFilter();
  bindEvents();
  initColorblindMode();
  if (window.FusionLab) {
    window.FusionLab.init(DEVIANTS);
  }
  render();
  updateFavCount();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    navigator.serviceWorker.register('./sw.js').then(
      (reg) => {
        console.log('✅ Service Worker активен:', reg.scope);
        reg.update();
      },
      (err) => console.warn('⚠️ Service Worker не зарегистрирован:', err)
    );
  }
}

function buildCategoryFilter() {
  const select = document.getElementById('categoryFilter');
  Object.entries(CATEGORIES).forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

function buildRoleFilter() {
  const select = document.getElementById('roleFilter');
  const availableRoles = new Set(DEVIANTS.flatMap(deviant => deviant.roles || []));
  Object.entries(ROLE_GROUPS).filter(([, group]) => group.roles.some(role => availableRoles.has(role))).forEach(([key, group]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = group.label;
    select.appendChild(option);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function updateFilterCount() {
  let count = 0;
  if (state.category !== 'all') count++;
  if (state.role !== 'all') count++;
  if (state.scenario !== 'all') count++;
  if (state.source !== 'all') count++;
  if (state.confidence !== 'all') count++;
  if (state.sort !== 'name') count++;

  const badge = document.getElementById('filterCountBadge');
  const toggleBtn = document.getElementById('filterToggleBtn');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  if (toggleBtn) {
    toggleBtn.classList.toggle('has-active', count > 0);
  }
}

function updateCompareBadge() {
  const badge = document.getElementById('compareCountBadge');
  const btn = document.getElementById('compareHubBtn');
  const count = state.compareList.length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  if (btn) {
    btn.classList.toggle('active', count > 0);
  }
}

function bindEvents() {
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      state.search = e.target.value.toLowerCase().trim();
      if (searchClearBtn) searchClearBtn.style.display = state.search ? 'inline-flex' : 'none';
      render();
    }, 250));
  }

  searchClearBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    state.search = '';
    searchClearBtn.style.display = 'none';
    render();
  });

  // Кнопка открытия/закрытия панели расширенных фильтров
  const filterToggleBtn = document.getElementById('filterToggleBtn');
  const filtersDrawer = document.getElementById('deviantFilters');
  filterToggleBtn?.addEventListener('click', () => {
    if (!filtersDrawer) return;
    const isHidden = filtersDrawer.style.display === 'none';
    filtersDrawer.style.display = isHidden ? 'block' : 'none';
    filterToggleBtn.classList.toggle('is-open', isHidden);
  });

  // Кнопка сравнения в панели управления
  document.getElementById('compareHubBtn')?.addEventListener('click', openCompareModal);

  // Выпадающие списки в панели фильтров
  ['categoryFilter', 'roleFilter', 'scenarioFilter', 'sourceFilter', 'confidenceFilter', 'sortSelect'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', e => {
      if (id === 'categoryFilter') state.category = e.target.value;
      if (id === 'roleFilter') state.role = e.target.value;
      if (id === 'scenarioFilter') state.scenario = e.target.value;
      if (id === 'sourceFilter') state.source = e.target.value;
      if (id === 'confidenceFilter') state.confidence = e.target.value;
      if (id === 'sortSelect') state.sort = e.target.value;
      updateFilterCount();
      render();
    });
  });

  document.getElementById('resetBtn')?.addEventListener('click', resetFilters);

  // Интерактивные чипы-фильтры со встроенными счётчиками
  document.querySelectorAll('.filter-chip[data-section]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.favOnly = false;
      document.getElementById('favToggle')?.classList.remove('active');
      state.quickSection = chip.dataset.section === 'all' ? null : chip.dataset.section;
      render();
    });
  });

  // Чекбокс-чип избранного
  document.getElementById('favToggle')?.addEventListener('click', () => {
    state.favOnly = !state.favOnly;
    const favChip = document.getElementById('favToggle');
    favChip?.classList.toggle('active', state.favOnly);
    if (state.favOnly) {
      document.querySelectorAll('.filter-chip[data-section]').forEach(c => c.classList.remove('active'));
    } else {
      document.querySelector('.filter-chip[data-section="all"]')?.classList.add('active');
      state.quickSection = null;
    }
    render();
  });

  // Вкладки разделов (Девианты, Перки, Лаборатория слияния)
  document.getElementById('deviantsView')?.addEventListener('click', () => { state.view = 'deviants'; render(); });
  document.getElementById('traitsView')?.addEventListener('click', () => { state.view = 'traits'; render(); });
  document.getElementById('labView')?.addEventListener('click', () => { state.view = 'lab'; render(); });

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('deviantModal')?.addEventListener('click', e => { if (e.target.id === 'deviantModal') closeModal(); });
  document.getElementById('compareClose')?.addEventListener('click', closeCompare);
  document.getElementById('compareModal')?.addEventListener('click', e => { if (e.target.id === 'compareModal') closeCompare(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCompare(); } });
  document.getElementById('colorblindToggle')?.addEventListener('click', toggleColorblindMode);

  // Централизованное делегирование событий для грида (Event Delegation)
  const grid = document.getElementById('deviantsGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        e.stopPropagation();
        toggleFavorite(favBtn.dataset.id);
        return;
      }

      const compareBtn = e.target.closest('.compare-btn');
      if (compareBtn) {
        e.stopPropagation();
        toggleCompare(compareBtn.dataset.id);
        return;
      }

      const traitRef = e.target.closest('.trait-reference');
      if (traitRef) {
        e.stopPropagation();
        openModal(traitRef.dataset.id);
        return;
      }

      const scBadge = e.target.closest('.loc-sc-badge');
      if (scBadge) {
        e.stopPropagation();
        const sc = scBadge.dataset.scenario;
        if (sc) {
          state.scenario = sc;
          const sel = document.getElementById('scenarioFilter');
          if (sel) sel.value = sc;
          updateFilterCount();
          render();
          showToast(`Фильтр по сценарию: ${scBadge.textContent.trim()}`);
        }
        return;
      }

      const srcBadge = e.target.closest('.loc-src-badge');
      if (srcBadge) {
        e.stopPropagation();
        const src = srcBadge.dataset.source;
        if (src) {
          state.source = src;
          const sel = document.getElementById('sourceFilter');
          if (sel) sel.value = src;
          updateFilterCount();
          render();
          showToast(`Фильтр по источнику: ${srcBadge.textContent.trim()}`);
        }
        return;
      }

      const coordsBadge = e.target.closest('.loc-coords-badge');
      if (coordsBadge) {
        e.stopPropagation();
        const coords = coordsBadge.dataset.coords;
        if (coords) {
          copyCoordinates(coords, coordsBadge);
        }
        return;
      }

      const card = e.target.closest('.card');
      if (card) {
        openModal(card.dataset.id);
      }
    });

    grid.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.fav-btn') && !e.target.closest('.compare-btn')) {
        const card = e.target.closest('.card');
        if (card) {
          e.preventDefault();
          openModal(card.dataset.id);
        }
      }
    });

    grid.addEventListener('error', (e) => {
      if (e.target && e.target.tagName === 'IMG') {
        handleImageError(e.target);
      }
    }, true);
  }
}

function resetFilters() {
  state.search = '';
  state.category = 'all';
  state.role = 'all';
  state.scenario = 'all';
  state.source = 'all';
  state.confidence = 'all';
  state.sort = 'name';
  state.favOnly = false;
  state.quickSection = null;
  state.traitScope = 'all';
  state.traitKind = 'all';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const searchClearBtn = document.getElementById('searchClearBtn');
  if (searchClearBtn) searchClearBtn.style.display = 'none';

  ['categoryFilter', 'roleFilter', 'scenarioFilter', 'sourceFilter', 'confidenceFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'all';
  });
  const sortSel = document.getElementById('sortSelect');
  if (sortSel) sortSel.value = 'name';

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.filter-chip[data-section="all"]')?.classList.add('active');
  document.getElementById('favToggle')?.classList.remove('active');

  updateFilterCount();
  render();
}

function toggleFavFilter() {
  state.favOnly = !state.favOnly;
  document.getElementById('favToggle')?.classList.toggle('active', state.favOnly);
  render();
}

function handleQuickSection(section) {
  state.quickSection = section === 'all' ? null : section;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filter-chip[data-section="${section}"]`)?.classList.add('active');
  render();
}

function getFiltered() {
  let list = [...DEVIANTS];
  if (state.quickSection === 'combat') list = list.filter(d => d.category.includes('combat'));
  else if (state.quickSection === 'base') list = list.filter(d => d.category.some(c => ['territory', 'crafting'].includes(c)));
  else if (state.quickSection === 'winter') list = list.filter(d => getDeviantLocationInfo(d).scenario === 'winter');
  else if (state.quickSection === 'silos') list = list.filter(d => getDeviantLocationInfo(d).sourceType === 'silo');
  else if (state.quickSection === 'shiny') list = list.filter(d => d.variants && d.variants.length > 0);

  if (state.category !== 'all') list = list.filter(d => d.category.includes(state.category));
  if (state.role !== 'all') {
    const roleGroup = ROLE_GROUPS[state.role];
    list = list.filter(d => (!roleGroup?.category || d.category.includes(roleGroup.category)) && (d.roles || []).some(role => roleGroup?.roles.includes(role)));
  }
  if (state.scenario !== 'all') {
    list = list.filter(d => {
      const loc = getDeviantLocationInfo(d);
      return loc.scenario === state.scenario || (state.scenario === 'manibus' && loc.scenario === 'all');
    });
  }
  if (state.source !== 'all') {
    list = list.filter(d => getDeviantLocationInfo(d).sourceType === state.source);
  }
  if (state.confidence !== 'all') list = list.filter(d => d.confidence === state.confidence);
  if (state.favOnly) list = list.filter(d => state.favorites.includes(d.id));
  
  if (state.search) {
    const q = state.search;
    list = list.filter(d => {
      const loc = getDeviantLocationInfo(d);
      const locText = [loc.spot, loc.spotShort, loc.scenarioLabel, loc.srcTitle, loc.coords || '', d.acquisition?.location || '', d.acquisition?.method || '', d.acquisition?.tips || ''].join(' ');
      const traitsText = d.traits ? [...(d.traits.recommended || []), ...(d.traits.avoid || [])].map(t => (t.name || '') + ' ' + (t.name_ru || '') + ' ' + (t.effect || '')).join(' ') : '';
      const variantsText = (d.variants || []).map(v => `${v.name_ru} ${v.name_en} ${v.trait?.name || ''} ${v.trait?.name_ru || ''} ${v.trait?.effect || ''} ${v.source || ''}`).join(' ');
      const haystack = [d.name_ru, d.name_en, d.shortDesc, d.fullDesc, ...(d.abilities || []), ...(d.category || []).map(c => CATEGORIES[c] || c), ...(d.roles || []), ...(d.moodBoosters || []), traitsText, locText, variantsText].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  if (state.sort === 'name') list.sort((a, b) => a.name_ru.localeCompare(b.name_ru, 'ru'));
  else if (state.sort === 'category') list.sort((a, b) => a.category[0].localeCompare(b.category[0]));

  return list;
}

function render() {
  const isTraitsView = state.view === 'traits';
  const isLabView = state.view === 'lab';
  const isDeviantsView = state.view === 'deviants';

  const mainControls = document.getElementById('mainControls');
  const chipFilterBar = document.getElementById('chipFilterBar');
  const filterToggleBtn = document.getElementById('filterToggleBtn');
  const compareHubBtn = document.getElementById('compareHubBtn');
  const advancedDrawer = document.getElementById('deviantFilters');
  const statsBar = document.getElementById('statsBar');
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  const labSec = document.getElementById('labSection');

  document.getElementById('deviantsView')?.classList.toggle('active', isDeviantsView);
  document.getElementById('traitsView')?.classList.toggle('active', isTraitsView);
  document.getElementById('labView')?.classList.toggle('active', isLabView);

  if (labSec) labSec.style.display = isLabView ? 'block' : 'none';

  if (isLabView) {
    if (mainControls) mainControls.style.display = 'none';
    if (grid) grid.style.display = 'none';
    if (empty) empty.style.display = 'none';
    window.FusionLab?.onShow();
    return;
  }

  if (mainControls) mainControls.style.display = 'flex';
  if (chipFilterBar) chipFilterBar.style.display = isDeviantsView ? 'flex' : 'none';
  if (filterToggleBtn) filterToggleBtn.style.display = isDeviantsView ? 'inline-flex' : 'none';
  if (compareHubBtn) compareHubBtn.style.display = isDeviantsView ? 'inline-flex' : 'none';
  if (advancedDrawer && isTraitsView) advancedDrawer.style.display = 'none';
  if (statsBar) statsBar.style.display = isTraitsView ? 'flex' : 'none';

  if (grid) grid.style.display = '';

  if (isTraitsView) {
    renderTraits();
    return;
  }

  const list = getFiltered();
  renderStats();

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = list.map(d => renderCard(d)).join('');
}

function renderStats() {
  const countAll = document.getElementById('countAll');
  const countCombat = document.getElementById('countCombat');
  const countBase = document.getElementById('countBase');
  const countWinter = document.getElementById('countWinter');
  const countSilos = document.getElementById('countSilos');
  const countShiny = document.getElementById('countShiny');
  const countFav = document.getElementById('countFav');

  if (countAll) countAll.textContent = DEVIANTS.length;
  if (countCombat) countCombat.textContent = DEVIANTS.filter(d => d.category.includes('combat')).length;
  if (countBase) countBase.textContent = DEVIANTS.filter(d => d.category.some(c => ['territory', 'crafting'].includes(c))).length;
  if (countWinter) countWinter.textContent = DEVIANTS.filter(d => getDeviantLocationInfo(d).scenario === 'winter').length;
  if (countSilos) countSilos.textContent = DEVIANTS.filter(d => getDeviantLocationInfo(d).sourceType === 'silo').length;
  if (countShiny) countShiny.textContent = DEVIANTS.filter(d => d.variants && d.variants.length > 0).length;
  if (countFav) countFav.textContent = state.favorites.length;

  updateFilterCount();
  updateCompareBadge();
}

const GENERAL_TRAIT_PREFIXES = [
  'cheer up', 'covert energy', 'feeling blue', 'growing pains', 
  'optimist', 'rise and shine', 'worn-out', 'power drain', 'save energy'
];

function getTraitScope(trait) {
  const lowerName = (trait.name || '').toLowerCase();
  if (GENERAL_TRAIT_PREFIXES.some(p => lowerName.startsWith(p))) {
    return 'general';
  }
  
  const cats = new Set();
  (trait.deviants || []).forEach(d => (d.category || []).forEach(c => cats.add(c)));
  
  if (cats.has('combat') && !cats.has('territory') && !cats.has('crafting')) {
    return 'combat';
  }
  if (cats.has('territory') && !cats.has('combat') && !cats.has('crafting')) {
    return 'territory';
  }
  if (cats.has('crafting') && !cats.has('combat') && !cats.has('territory')) {
    return 'crafting';
  }
  if (cats.has('territory') || cats.has('crafting')) {
    return cats.has('crafting') ? 'crafting' : 'territory';
  }
  return 'general';
}

function renderTraits() {
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  const statsBar = document.getElementById('statsBar');
  const grouped = new Map();

  DEVIANTS.forEach(deviant => {
    [['recommended', 'Рекомендуется'], ['avoid', 'Лучше избегать']].forEach(([kind, label]) => {
      (deviant.traits?.[kind] || []).forEach(trait => {
        const key = `${kind}|${trait.name}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            kind,
            label,
            name: trait.name,
            nameRu: trait.name_ru || trait.name,
            effects: new Set(),
            deviants: []
          });
        }
        const group = grouped.get(key);
        if (trait.effect) {
          group.effects.add(trait.effect.trim());
        }
        if (!group.deviants.some(entry => entry.id === deviant.id)) {
          group.deviants.push(deviant);
        }
      });
    });
  });

  const query = (state.search || '').trim().toLowerCase();
  const allTraits = [...grouped.values()].map(t => {
    const item = { ...t, effects: [...t.effects] };
    item.scope = getTraitScope(item);
    return item;
  });

  // Фильтрация по поисковой строке
  const searchedTraits = allTraits.filter(trait => {
    if (!query) return true;
    const haystack = [
      trait.name,
      trait.nameRu,
      ...trait.effects,
      ...trait.deviants.map(d => d.name_ru),
      ...trait.deviants.map(d => d.name_en || '')
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  // Подсчёт количества черт по сферам применения для кнопок-чипов
  const counts = {
    all: searchedTraits.length,
    combat: searchedTraits.filter(t => t.scope === 'combat').length,
    territory: searchedTraits.filter(t => t.scope === 'territory').length,
    crafting: searchedTraits.filter(t => t.scope === 'crafting').length,
    general: searchedTraits.filter(t => t.scope === 'general').length,
    recommended: searchedTraits.filter(t => t.kind === 'recommended').length,
    avoid: searchedTraits.filter(t => t.kind === 'avoid').length
  };

  const activeScope = state.traitScope || 'all';
  const activeKind = state.traitKind || 'all';

  // Рендерим интерактивную панель управления чертами в statsBar
  if (statsBar) {
    statsBar.innerHTML = `
      <div class="traits-toolbar">
        <div class="traits-scopes" role="tablist" aria-label="Сфера действия черт">
          <button class="traits-chip ${activeScope === 'all' ? 'active' : ''}" data-scope="all" type="button">
            <span>Все</span> <b class="badge-count">${counts.all}</b>
          </button>
          <button class="traits-chip ${activeScope === 'combat' ? 'active' : ''}" data-scope="combat" type="button">
            <span>⚔️ Боевые</span> <b class="badge-count">${counts.combat}</b>
          </button>
          <button class="traits-chip ${activeScope === 'territory' ? 'active' : ''}" data-scope="territory" type="button">
            <span>🏭 Для базы</span> <b class="badge-count">${counts.territory}</b>
          </button>
          <button class="traits-chip ${activeScope === 'crafting' ? 'active' : ''}" data-scope="crafting" type="button">
            <span>🧪 Крафтовые</span> <b class="badge-count">${counts.crafting}</b>
          </button>
          <button class="traits-chip ${activeScope === 'general' ? 'active' : ''}" data-scope="general" type="button">
            <span>🧬 Общие</span> <b class="badge-count">${counts.general}</b>
          </button>
        </div>
        <div class="traits-kinds" role="group" aria-label="Полярность черт">
          <button class="traits-kind-btn ${activeKind === 'all' ? 'active' : ''}" data-kind="all" type="button">Все</button>
          <button class="traits-kind-btn kind-recommended ${activeKind === 'recommended' ? 'active' : ''}" data-kind="recommended" type="button">✦ Рекомендуемые (${counts.recommended})</button>
          <button class="traits-kind-btn kind-avoid ${activeKind === 'avoid' ? 'active' : ''}" data-kind="avoid" type="button">✕ Избегать (${counts.avoid})</button>
        </div>
      </div>
    `;

    statsBar.querySelectorAll('.traits-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.traitScope = chip.dataset.scope;
        renderTraits();
      });
    });

    statsBar.querySelectorAll('.traits-kind-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.traitKind = btn.dataset.kind;
        renderTraits();
      });
    });
  }

  // Фильтрация черт по выбранной сфере и полярности
  const filteredTraits = searchedTraits.filter(trait => {
    if (activeScope !== 'all' && trait.scope !== activeScope) return false;
    if (activeKind !== 'all' && trait.kind !== activeKind) return false;
    return true;
  });

  if (!filteredTraits.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const SCOPE_META = {
    combat: { label: 'Боевая', icon: '⚔️', css: 'scope-combat' },
    territory: { label: 'Для базы', icon: '🏭', css: 'scope-territory' },
    crafting: { label: 'Крафт', icon: '🧪', css: 'scope-crafting' },
    general: { label: 'Общая', icon: '🧬', css: 'scope-general' }
  };

  const renderCardHTML = (trait) => {
    const sc = SCOPE_META[trait.scope] || SCOPE_META.general;
    return `
      <article class="trait-card ${trait.kind === 'avoid' ? 'trait-avoid' : 'trait-recommended'}">
        <div class="trait-card-heading">
          <h2>${escapeHtml(trait.nameRu)}</h2>
          <div class="trait-badges">
            <span class="trait-scope-badge ${sc.css}" title="Сфера применения">${sc.icon} ${sc.label}</span>
            <span class="trait-kind ${escapeHtml(trait.kind)}">${escapeHtml(trait.label)}</span>
          </div>
        </div>
        ${trait.nameRu !== trait.name ? `<div class="trait-name-en">${escapeHtml(trait.name)}</div>` : ''}
        <div class="trait-effects-wrap">
          ${trait.effects.map(eff => `<p class="trait-effect">${escapeHtml(eff)}</p>`).join('')}
        </div>
        <div class="trait-footer">
          <div class="trait-deviants-label">Связанные девианты (${trait.deviants.length})</div>
          <div class="trait-deviants">
            ${trait.deviants.map(dev => `
              <button class="trait-reference" data-id="${escapeHtml(dev.id)}" type="button" title="Открыть карточку: ${escapeHtml(dev.name_ru)}">${escapeHtml(dev.name_ru)}</button>
            `).join('')}
          </div>
        </div>
      </article>
    `;
  };

  const recommended = filteredTraits
    .filter(t => t.kind === 'recommended')
    .sort((a, b) => a.nameRu.localeCompare(b.nameRu, 'ru'));
    
  const avoid = filteredTraits
    .filter(t => t.kind === 'avoid')
    .sort((a, b) => a.nameRu.localeCompare(b.nameRu, 'ru'));

  let html = '';
  if (recommended.length > 0) {
    html += `
      <div class="traits-section-heading">
        <h2 style="color: var(--accent-2); font-family: 'Cinzel', serif;">✦ Рекомендуемые черты (${recommended.length})</h2>
      </div>
      <div class="traits-subgrid">
        ${recommended.map(renderCardHTML).join('')}
      </div>
    `;
  }

  if (avoid.length > 0) {
    html += `
      <div class="traits-section-heading" style="${recommended.length > 0 ? 'margin-top: 32px;' : ''}">
        <h2 style="color: var(--danger); font-family: 'Cinzel', serif;">✕ Черты, которых лучше избегать (${avoid.length})</h2>
      </div>
      <div class="traits-subgrid">
        ${avoid.map(renderCardHTML).join('')}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function renderCard(d) {
  const isFav = state.favorites.includes(d.id);
  const isCompare = state.compareList.includes(d.id);
  const confLabel = { high: '✓', medium: '~', low: '!' }[d.confidence] || '';
  const confTitle = { high: 'Высокая достоверность', medium: 'Средняя достоверность', low: 'Низкая достоверность' }[d.confidence] || '';
  const localImg = getDeviantImage(d);

  // Ограничиваем количество ролей на превью до 2 для чистоты интерфейса
  const allRoles = d.roles || [];
  const previewRoles = allRoles.slice(0, 2);
  const extraRolesCount = allRoles.length - previewRoles.length;

  return `
    <article class="card" data-id="${escapeHtml(d.id)}" tabindex="0" role="button" aria-label="${escapeHtml(d.name_ru)}">
      <div class="card-img">
        <img src="${escapeHtml(localImg)}" data-remote="${escapeHtml(d.image || '')}" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" loading="lazy">
        <button class="compare-btn ${isCompare ? 'active' : ''}" data-id="${escapeHtml(d.id)}" title="Сравнить" type="button">⇄</button>
        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${escapeHtml(d.id)}" title="В избранное" type="button">★</button>
        ${(d.variants && d.variants.length > 0) ? `<div class="card-shiny-badge" title="Имеет ${d.variants.length} редких морфов">🌈 Морфы (${d.variants.length})</div>` : ''}
        <div class="confidence-badge confidence-${escapeHtml(d.confidence)}" title="${escapeHtml(confTitle)}">${escapeHtml(confLabel)}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(d.name_ru)} <span class="card-title-en">${escapeHtml(d.name_en || '')}</span></div>
        <div class="card-category">
          ${d.category.map(c => `<span class="cat-tag">${escapeHtml(CATEGORIES[c] || c)}</span>`).join('')}
          ${previewRoles.map(role => `<span class="role-tag">${escapeHtml(role)}</span>`).join('')}
          ${extraRolesCount > 0 ? `<span class="role-tag role-tag-more" title="Ещё роли: ${escapeHtml(allRoles.slice(2).join(', '))}">+${extraRolesCount}</span>` : ''}
        </div>
        <div class="card-desc">${escapeHtml(d.shortDesc)}</div>
      </div>
    </article>
  `;
}

function openModal(id) {
  const d = DEVIANTS.find(x => x.id === id);
  if (!d) return;
  const body = document.getElementById('modalBody');
  const localImg = getDeviantImage(d);
  const locInfo = getDeviantLocationInfo(d);

  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-img">
        <img src="${escapeHtml(localImg)}" data-remote="${escapeHtml(d.image || '')}" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" onerror="handleImageError(this)">
      </div>
      <div class="modal-info">
        <h2>${escapeHtml(d.name_ru)}</h2>
        <div class="en-name">${escapeHtml(d.name_en || '')}</div>
        <div class="purpose">${escapeHtml(d.shortDesc)}</div>
        <div class="card-category">
          ${d.category.map(c => `<span class="cat-tag">${escapeHtml(CATEGORIES[c] || c)}</span>`).join('')}
          ${(d.roles || []).map(role => `<span class="role-tag">${escapeHtml(role)}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- Интерактивная тактическая справка по локациям и поимке -->
    <div class="modal-section modal-location-card">
      <div class="modal-loc-header">
        <div class="modal-loc-title-group">
          <div class="modal-loc-main-title">
            <span class="loc-header-pin">📍</span>
            <h3>Где и как поймать (Локации и сценарии)</h3>
          </div>
          <div class="modal-loc-pills">
            <span class="loc-pill ${locInfo.scClass}">${locInfo.scIcon} ${escapeHtml(locInfo.scenarioTitle)}</span>
            <span class="loc-pill ${locInfo.srcClass}">${locInfo.srcIcon} ${escapeHtml(locInfo.srcTitle)}</span>
          </div>
        </div>
      </div>

      <div class="modal-loc-grid">
        <div class="modal-loc-box spot-box">
          <div class="loc-box-label">Рекомендуемое место спавна</div>
          <div class="spot-title">${escapeHtml(locInfo.spot)}</div>
          <div class="spot-desc">${escapeHtml(d.acquisition?.location || 'Открытый мир')}</div>
        </div>

        ${locInfo.coords ? `
          <div class="modal-loc-box coords-box">
            <div class="loc-box-label">Координаты на карте Once Human</div>
            <div class="coords-action-row">
              <div class="coords-chip">
                <span class="coords-icon">🎯</span>
                <span class="coords-value">[ ${escapeHtml(locInfo.coords)} ]</span>
              </div>
              <button type="button" class="btn-copy-coords" id="btnModalCopyCoords" data-coords="${escapeHtml(locInfo.coords)}" title="Скопировать координаты для карты или чата игры">
                <svg class="copy-svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span class="btn-copy-text">Копировать</span>
              </button>
            </div>
            <div class="coords-hint">💡 Нажмите M в игре для перехода к точке или вставьте координаты в чат отряда</div>
          </div>
        ` : `
          <div class="modal-loc-box coords-box general-spawn-box">
            <div class="loc-box-label">Тип спавна</div>
            <div class="general-spawn-title">${escapeHtml(locInfo.spotShort)}</div>
            <div class="coords-hint">💡 Точная точка зависит от подземелья, эвента или ресурсов на карте</div>
          </div>
        `}
      </div>

      <div class="modal-loc-steps">
        <div class="loc-step-item">
          <div class="step-badge method-badge">⚡ Способ поимки</div>
          <div class="step-text">${escapeHtml(d.acquisition?.method || '—')}</div>
        </div>
        ${d.acquisition?.tips ? `
          <div class="loc-step-item">
            <div class="step-badge tip-badge">💡 Совет по фарму</div>
            <div class="step-text">${escapeHtml(d.acquisition?.tips)}</div>
          </div>
        ` : ''}
      </div>
    </div>

    ${(d.variants && d.variants.length > 0) ? `
      <!-- Каталог редких морфов и цветовых вариаций -->
      <div class="modal-section modal-morph-section">
        <div class="morph-section-header">
          <div class="morph-title-wrap">
            <span class="morph-sparkle-icon">✨</span>
            <h3>Редкие Морфы и цветовые вариации (${d.variants.length})</h3>
          </div>
          <span class="morph-live-badge">🌈 Эксклюзивные скины</span>
        </div>
        <p class="morph-intro-text">
          В Once Human некоторые девианты имеют альтернативный окрас (Shiny) с врождёнными эксклюзивными пассивными свойствами. Нажмите на форму, чтобы примерить скин и изучить её бонус:
        </p>

        <div class="morph-tabs-bar" role="tablist" aria-label="Вариации девианта">
          <button class="morph-tab-btn active" data-morph="original" type="button">
            <span class="tab-icon">★</span>
            <span class="tab-text">Оригинал (Базовый)</span>
          </button>
          ${d.variants.map((v, idx) => `
            <button class="morph-tab-btn" data-morph="${escapeHtml(v.id)}" data-idx="${idx}" type="button">
              <span class="tab-icon">🌈</span>
              <span class="tab-text">${escapeHtml(v.name_ru)}</span>
            </button>
          `).join('')}
        </div>

        <div class="morph-display-box" id="morphDisplayBox">
          <div class="morph-preview-card">
            <div class="morph-card-badge">★ Стандартный вид</div>
            <div class="morph-card-title">${escapeHtml(d.name_ru)}</div>
            <div class="morph-card-sub">Базовая форма девианта с классическими характеристиками и условиями содержания.</div>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="modal-section">
      <h3>Описание и способности</h3>
      <p>${escapeHtml(d.fullDesc)}</p>
      <ul style="margin-top:10px">${(d.abilities || []).map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
    </div>

    <div class="modal-section">
      <h3>🔆 Условия содержания (Mood Boosters)</h3>
      <p style="font-size:13px; color:var(--text-dim); margin-bottom:12px; font-style:italic;">Разместите девианта в Изолированном блоке безопасности и обеспечьте указанные условия настроения для 100% эффективности.</p>
      <div class="perk-list">
        ${(d.moodBoosters || []).map(m => `
          <div class="perk-item">
            <div class="perk-name">${escapeHtml(m)} <span class="perk-priority">ОБЯЗАТЕЛЬНО</span></div>
            <div class="perk-desc">Разместите этот источник настроения рядом с блоком безопасности.</div>
            <div class="perk-why">Без этого условия девиант будет терять настроение, что снизит его эффективность.</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${d.traits ? `
      <div class="modal-section">
        <h3>🧬 Врождённые черты (Traits Tier-List)</h3>
        <p style="font-size:13px; color:var(--text-dim); margin-bottom:12px; font-style:italic;">
          Рекомендуемые и нежелательные черты характера при поимке девианта.
        </p>

        ${d.traits.recommended?.length ? `
          <div class="label" style="color: #4ade80; margin-bottom: 8px; font-weight: 600;">
            ✓ Рекомендуемые черты (Искать при фарме):
          </div>
          <div class="perk-list" style="margin-bottom: 16px;">
            ${d.traits.recommended.map((trait, idx) => `
              <div class="perk-item" style="border-left-color: ${idx === 0 ? 'var(--accent-2)' : '#4ade80'};">
                <div class="perk-name">
                  ${escapeHtml(trait.name_ru || trait.name)}
                  ${idx === 0 
                    ? '<span class="perk-priority" style="background: rgba(214, 160, 93, 0.2); color: var(--accent-2); border: 1px solid var(--accent-2);">👑 ТОП ВЫБОР</span>' 
                    : '<span class="perk-priority" style="background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid #4ade80;">РЕКОМЕНДУЕТСЯ</span>'}
                </div>
                <div class="perk-desc" style="color: var(--text);">
                  <strong>Эффект:</strong> ${escapeHtml(trait.effect)}
                </div>
                ${trait.why ? `<div class="perk-why">💡 <strong>Зачем:</strong> ${escapeHtml(trait.why)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${d.traits.avoid?.length ? `
          <div class="label" style="color: var(--danger); margin-bottom: 8px; font-weight: 600;">
            ✕ Черты-ловушки (Снижают эффективность):
          </div>
          <div class="perk-list">
            ${d.traits.avoid.map(trait => `
              <div class="perk-item" style="border-left-color: var(--danger); background: rgba(240, 68, 78, 0.05);">
                <div class="perk-name" style="color: #ff9da4;">
                  ${escapeHtml(trait.name_ru || trait.name)}
                  <span class="perk-priority" style="background: rgba(240, 68, 78, 0.2); color: var(--danger); border: 1px solid var(--danger);">ИЗБЕГАТЬ</span>
                </div>
                <div class="perk-desc" style="color: var(--text-dim);">
                  <strong>Эффект:</strong> ${escapeHtml(trait.effect)}
                </div>
                ${trait.why ? `<div class="perk-why" style="color: #ff858d;">⚠️ <strong>Минус:</strong> ${escapeHtml(trait.why)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : ''}
    <div class="modal-section">
      <h3>Преимущества и недостатки</h3>
      <div class="pros-cons">
        <div class="pros"><h4>✓ Плюсы</h4><ul>${(d.pros || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>
        <div class="cons"><h4>✕ Минусы</h4><ul>${(d.cons || []).map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></div>
      </div>
    </div>
    ${d.bestFor ? `<div class="modal-section"><h3>Кому подойдёт</h3><p>${escapeHtml(d.bestFor)}</p></div>` : ''}
    <div class="sources">
      <strong>Источники:</strong> ${(d.sources || []).map(s => escapeHtml(s)).join(' · ')}<br>
      <strong>Дата проверки:</strong> ${escapeHtml(formatDate(d.lastChecked))}
    </div>
  `;

  const modalCopyBtn = document.getElementById('btnModalCopyCoords');
  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyCoordinates(modalCopyBtn.dataset.coords, modalCopyBtn);
    });
  }

  // Интерактивное переключение редких морфов (Shiny)
  const modalImgEl = body.querySelector('.modal-img img');
  const morphDisplayBox = body.querySelector('#morphDisplayBox');
  const morphBtns = body.querySelectorAll('.morph-tab-btn');

  morphBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      morphBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const morphId = btn.dataset.morph;

      if (morphId === 'original') {
        if (modalImgEl) {
          modalImgEl.src = localImg;
          modalImgEl.setAttribute('data-remote', d.image || '');
          modalImgEl.classList.remove('is-morph-active');
        }
        if (morphDisplayBox) {
          morphDisplayBox.innerHTML = `
            <div class="morph-preview-card">
              <div class="morph-card-badge">★ Стандартный вид</div>
              <div class="morph-card-title">${escapeHtml(d.name_ru)}</div>
              <div class="morph-card-sub">Базовая форма девианта с классическими характеристиками и условиями содержания.</div>
            </div>
          `;
        }
      } else {
        const idx = parseInt(btn.dataset.idx, 10);
        const v = (d.variants || [])[idx];
        if (!v) return;

        if (modalImgEl) {
          modalImgEl.src = v.image;
          modalImgEl.setAttribute('data-remote', v.remoteImage || '');
          modalImgEl.classList.add('is-morph-active');
        }

        if (morphDisplayBox) {
          morphDisplayBox.innerHTML = `
            <div class="morph-preview-card active-morph">
              <div class="morph-card-top">
                <div class="morph-card-badge morph-badge-rainbow">🌈 Редкий Морф</div>
                <span class="morph-rarity">${escapeHtml(v.rarity || 'Редкая вариация')}</span>
              </div>
              <div class="morph-card-title">${escapeHtml(v.name_ru)} <span class="morph-en">(${escapeHtml(v.name_en)})</span></div>
              
              <div class="morph-trait-highlight">
                <div class="morph-trait-header">
                  <span class="morph-trait-label">Эксклюзивная черта морфа:</span>
                  <span class="morph-trait-pill">✦ ${escapeHtml(v.trait?.name_ru || v.trait?.name || 'Эксклюзив')}</span>
                </div>
                <div class="morph-trait-effect"><strong>Эффект:</strong> ${escapeHtml(v.trait?.effect || '—')}</div>
              </div>

              <div class="morph-source-row">
                <span class="morph-source-icon">📍</span>
                <span class="morph-source-text"><strong>Где искать:</strong> ${escapeHtml(v.source || 'Открытый мир / Бункеры')}</span>
              </div>
            </div>
          `;
        }
      }
    });
  });

  document.getElementById('deviantModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() { document.getElementById('deviantModal').classList.remove('open'); document.body.style.overflow = ''; }

function toggleFavorite(id) {
  const idx = state.favorites.indexOf(id);
  idx >= 0 ? state.favorites.splice(idx, 1) : state.favorites.push(id);
  localStorage.setItem('oh_favorites', JSON.stringify(state.favorites));
  updateFavCount(); render();
}

function updateFavCount() { document.getElementById('favCount').textContent = state.favorites.length; }

function toggleCompare(id) {
  const idx = state.compareList.indexOf(id);
  if (idx >= 0) state.compareList.splice(idx, 1);
  else {
    if (state.compareList.length >= 4) { alert('Максимум 4 девианта для сравнения'); return; }
    state.compareList.push(id);
  }
  localStorage.setItem('oh_compare', JSON.stringify(state.compareList));
  render();
}

function openCompareModal() {
  const body = document.getElementById('compareBody');
  if (state.compareList.length < 2) {
    body.innerHTML = '<p style="padding:20px;color:var(--text-dim)">Выберите минимум 2 девианта для сравнения (нажмите кнопку ⇄ на карточках).</p>';
  } else {
    const items = state.compareList.map(id => DEVIANTS.find(d => d.id === id)).filter(Boolean);
    const fields = [
      ['Тип и роли', d => [...d.category.map(c => CATEGORIES[c] || c), ...(d.roles || [])].join(', ')],
      ['Назначение', d => d.shortDesc],
      ['Mood Boosters', d => (d.moodBoosters || []).join(', ') || '—'],
      ['Плюсы', d => (d.pros || []).join('; ')],
      ['Минусы', d => (d.cons || []).join('; ')],
      ['Кому подойдёт', d => d.bestFor || '—']
    ];
    body.innerHTML = `
      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>
              <th style="width:20%">Параметр</th>
              ${items.map(d => `<th>${escapeHtml(d.name_ru)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${fields.map(([label, fn]) => `
              <tr>
                <td><strong>${escapeHtml(label)}</strong></td>
                ${items.map(d => `<td>${escapeHtml(fn(d))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  document.getElementById('compareModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCompare() { document.getElementById('compareModal').classList.remove('open'); document.body.style.overflow = ''; }

function initColorblindMode() {
  const btn = document.getElementById('colorblindToggle');
  const status = document.getElementById('cbStatus');
  if (!btn || !status) return;

  if (state.colorblind) {
    document.body.classList.add('colorblind-mode');
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    status.textContent = 'ВКЛ';
  } else {
    document.body.classList.remove('colorblind-mode');
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    status.textContent = 'ВЫКЛ';
  }
}

function toggleColorblindMode() {
  state.colorblind = !state.colorblind;
  localStorage.setItem('oh_colorblind', JSON.stringify(state.colorblind));
  initColorblindMode();
  showToast(state.colorblind 
    ? '👁️ Контрастный режим ВКЛЮЧЁН (Адаптирован для дальтоников)' 
    : '👁️ Контрастный режим ВЫКЛЮЧЕН (Стандартная тема)');
}

// Кнопка "Наверх"
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});