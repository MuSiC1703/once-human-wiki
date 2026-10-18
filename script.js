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
      fetch('data/deviants.json', { cache: 'no-cache' }),
      fetch('data/variants.json', { cache: 'no-cache' }).catch(() => null)
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
  search: '',
  category: 'all',
  favoriteMorphs: JSON.parse(localStorage.getItem('oh_fav_morphs') || '{}'),
  view: 'deviants',
  traitScope: 'all'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  bindEvents();
  render();
  updateFavCount();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    let isRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing) {
        isRefreshing = true;
        console.log('🔄 Активирована новая версия кэша! Перезагрузка страницы...');
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(
      (reg) => {
        console.log('✅ Service Worker активен:', reg.scope);
        reg.update();
      },
      (err) => console.warn('⚠️ Service Worker не зарегистрирован:', err)
    );
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
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

  document.getElementById('resetBtn')?.addEventListener('click', resetFilters);

  // Кнопки разделения девиантов: Все, Боевые, Территориальные, Ремесло / Крафт
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = btn.dataset.category || 'all';
      render();
    });
  });

  // Вкладки разделов (Девианты, База перков)
  document.getElementById('deviantsView')?.addEventListener('click', () => { state.view = 'deviants'; render(); });
  document.getElementById('traitsView')?.addEventListener('click', () => { state.view = 'traits'; render(); });

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('deviantModal')?.addEventListener('click', e => { if (e.target.id === 'deviantModal') closeModal(); });

  // Управление модальным окном видеогайда
  document.getElementById('videoModalBtn')?.addEventListener('click', openVideoModal);
  document.getElementById('videoModalClose')?.addEventListener('click', closeVideoModal);
  document.getElementById('videoModal')?.addEventListener('click', e => { if (e.target.id === 'videoModal') closeVideoModal(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeVideoModal();
    }
  });

  // Централизованное делегирование событий для грида
  const grid = document.getElementById('deviantsGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const traitRef = e.target.closest('.trait-reference');
      if (traitRef) {
        e.stopPropagation();
        openModal(traitRef.dataset.id);
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
      if (e.key === 'Enter' || e.key === ' ') {
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
  state.traitScope = 'all';

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const searchClearBtn = document.getElementById('searchClearBtn');
  if (searchClearBtn) searchClearBtn.style.display = 'none';

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.category === 'all' || btn.dataset.scope === 'all'));
  });

  render();
}

function getFiltered() {
  let list = [...DEVIANTS];

  if (state.category !== 'all') {
    list = list.filter(d => (d.category || []).includes(state.category));
  }

  if (state.search) {
    const q = state.search;
    list = list.filter(d => {
      const loc = getDeviantLocationInfo(d);
      const locText = [loc.spot, loc.spotShort, loc.scenarioLabel, loc.srcTitle, loc.coords || '', d.acquisition?.location || '', d.acquisition?.method || '', d.acquisition?.tips || ''].join(' ');
      const traitsText = d.traits ? (d.traits.recommended || []).map(t => (t.name || '') + ' ' + (t.name_ru || '') + ' ' + (t.effect || '')).join(' ') : '';
      const variantsText = (d.variants || []).map(v => `${v.name_ru} ${v.name_en} ${v.trait?.name || ''} ${v.trait?.name_ru || ''} ${v.trait?.effect || ''} ${v.source || ''}`).join(' ');
      const haystack = [d.name_ru, d.name_en, d.shortDesc, d.fullDesc, ...(d.abilities || []), ...(d.category || []).map(c => CATEGORIES[c] || c), ...(d.roles || []), ...(d.moodBoosters || []), traitsText, locText, variantsText].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  list.sort((a, b) => a.name_ru.localeCompare(b.name_ru, 'ru'));
  return list;
}

function render() {
  const isTraitsView = state.view === 'traits';
  const isDeviantsView = state.view === 'deviants';

  const categoryTabsBar = document.getElementById('categoryTabsBar');
  const statsBar = document.getElementById('statsBar');
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');

  document.getElementById('deviantsView')?.classList.toggle('active', isDeviantsView);
  document.getElementById('traitsView')?.classList.toggle('active', isTraitsView);

  if (categoryTabsBar) categoryTabsBar.style.display = isDeviantsView ? 'flex' : 'none';
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
  const countTerritory = document.getElementById('countTerritory');
  const countCrafting = document.getElementById('countCrafting');

  if (countAll) countAll.textContent = DEVIANTS.length;
  if (countCombat) countCombat.textContent = DEVIANTS.filter(d => (d.category || []).includes('combat')).length;
  if (countTerritory) countTerritory.textContent = DEVIANTS.filter(d => (d.category || []).includes('territory')).length;
  if (countCrafting) countCrafting.textContent = DEVIANTS.filter(d => (d.category || []).includes('crafting')).length;

  updateFavCount();
}

function renderTraits() {
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  const statsBar = document.getElementById('statsBar');
  const grouped = new Map();

  // Собираем только рекомендованные черты девиантов (блок избегаемых убран)
  DEVIANTS.forEach(deviant => {
    (deviant.traits?.recommended || []).forEach(trait => {
      const key = trait.name;
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: trait.name,
          nameRu: trait.name_ru || trait.name,
          effects: new Set(),
          deviants: [],
          categories: new Set()
        });
      }
      const group = grouped.get(key);
      if (trait.effect) {
        group.effects.add(trait.effect.trim());
      }
      if (!group.deviants.some(entry => entry.id === deviant.id)) {
        group.deviants.push(deviant);
      }
      (deviant.category || []).forEach(c => group.categories.add(c));
    });
  });

  const query = (state.search || '').trim().toLowerCase();
  const allTraits = [...grouped.values()].map(t => ({
    ...t,
    effects: [...t.effects]
  }));

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

  // Подсчёт количества черт по категориям девиантов: Все, Боевые, Территориальные, Ремесло / Крафт
  const counts = {
    all: searchedTraits.length,
    combat: searchedTraits.filter(t => t.categories.has('combat')).length,
    territory: searchedTraits.filter(t => t.categories.has('territory')).length,
    crafting: searchedTraits.filter(t => t.categories.has('crafting')).length
  };

  const activeScope = state.traitScope || 'all';

  // Рендерим кнопки категорий перков в едином дизайне с карточками девиантов
  if (statsBar) {
    statsBar.innerHTML = `
      <div class="category-tabs-bar" role="tablist" aria-label="Категории перков" style="padding-top: 0;">
        <button class="category-btn traits-chip ${activeScope === 'all' ? 'active' : ''}" data-scope="all" type="button">
          <span>Все</span><b class="chip-count">${counts.all}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'combat' ? 'active' : ''}" data-scope="combat" type="button">
          <span>⚔️ Боевые</span><b class="chip-count">${counts.combat}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'territory' ? 'active' : ''}" data-scope="territory" type="button">
          <span>🏡 Территориальные</span><b class="chip-count">${counts.territory}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'crafting' ? 'active' : ''}" data-scope="crafting" type="button">
          <span>🔨 Ремесло / Крафт</span><b class="chip-count">${counts.crafting}</b>
        </button>
      </div>
    `;

    statsBar.querySelectorAll('.traits-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.traitScope = chip.dataset.scope;
        renderTraits();
      });
    });
  }

  // Фильтрация черт по выбранной категории
  const filteredTraits = searchedTraits.filter(trait => {
    if (activeScope !== 'all' && !trait.categories.has(activeScope)) return false;
    return true;
  });

  if (!filteredTraits.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const renderCardHTML = (trait) => {
    return `
      <article class="trait-card trait-recommended">
        <div class="trait-card-heading">
          <h2>${escapeHtml(trait.nameRu)}</h2>
          <div class="trait-badges">
            ${trait.categories.has('combat') ? '<span class="trait-scope-badge scope-combat">⚔️ Боевой</span>' : ''}
            ${trait.categories.has('territory') ? '<span class="trait-scope-badge scope-territory">🏡 Территориальный</span>' : ''}
            ${trait.categories.has('crafting') ? '<span class="trait-scope-badge scope-crafting">🔨 Ремесло / Крафт</span>' : ''}
            <span class="trait-kind recommended">⭐ Топ выбор</span>
          </div>
        </div>
        ${trait.nameRu !== trait.name ? `<div class="trait-name-en">${escapeHtml(trait.name)}</div>` : ''}
        <div class="trait-effects-wrap">
          ${trait.effects.map(eff => `<p class="trait-effect">${escapeHtml(eff)}</p>`).join('')}
        </div>
        <div class="trait-footer">
          <div class="trait-deviants-label">Подходит для девиантов (${trait.deviants.length})</div>
          <div class="trait-deviants">
            ${trait.deviants.map(dev => `
              <button class="trait-reference" data-id="${escapeHtml(dev.id)}" type="button" title="Открыть карточку: ${escapeHtml(dev.name_ru)}">${escapeHtml(dev.name_ru)}</button>
            `).join('')}
          </div>
        </div>
      </article>
    `;
  };

  const sortedTraits = [...filteredTraits].sort((a, b) => a.nameRu.localeCompare(b.nameRu, 'ru'));

  grid.innerHTML = `
    <div class="traits-subgrid" style="grid-column: 1 / -1; width: 100%;">
      ${sortedTraits.map(renderCardHTML).join('')}
    </div>
  `;
}

function renderCard(d) {
  const confLabel = { high: '✓', medium: '~', low: '!' }[d.confidence] || '';
  const confTitle = { high: 'Высокая достоверность', medium: 'Средняя достоверность', low: 'Низкая достоверность' }[d.confidence] || '';
  
  // Проверяем, есть ли у этого девианта сохранённый избранный морф
  const favMorphId = state.favoriteMorphs[d.id];
  const favVariant = (favMorphId && d.variants) ? d.variants.find(v => v.id === favMorphId) : null;

  // Если выбран избранный морф — показываем картинку морфа, иначе базовую
  const cardImg = favVariant ? favVariant.image : getDeviantImage(d);
  const cardRemote = favVariant ? (favVariant.remoteImage || '') : (d.image || '');

  // Ограничиваем количество ролей на превью до 2 для чистоты интерфейса
  const allRoles = d.roles || [];
  const previewRoles = allRoles.slice(0, 2);
  const extraRolesCount = allRoles.length - previewRoles.length;

  return `
    <article class="card ${favVariant ? 'has-fav-morph' : ''}" data-id="${escapeHtml(d.id)}" tabindex="0" role="button" aria-label="${escapeHtml(d.name_ru)}">
      <div class="card-img">
        <img src="${escapeHtml(cardImg)}" data-remote="${escapeHtml(cardRemote)}" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" loading="lazy">
        ${favVariant 
          ? `<div class="card-fav-morph-badge" title="Выбранный вами морф: ${escapeHtml(favVariant.name_ru)}">★ ${escapeHtml(favVariant.name_ru)}</div>`
          : ((d.variants && d.variants.length > 0) ? `<div class="card-shiny-badge" title="Имеет ${d.variants.length} редких морфов">🌈 Морфы (${d.variants.length})</div>` : '')
        }
        <div class="confidence-badge confidence-${escapeHtml(d.confidence)}" title="${escapeHtml(confTitle)}">${escapeHtml(confLabel)}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(d.name_ru)} <span class="card-title-en">${escapeHtml(d.name_en || '')}</span></div>
        ${favVariant ? `<div class="card-morph-selected-title">✨ Активен морф: <b>${escapeHtml(favVariant.name_ru)}</b></div>` : ''}
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

function renderDeviantTraitsBlock(d) {
  if (!d.traits) return '';
  const recommended = d.traits.recommended || [];
  if (recommended.length === 0) return '';

  return `
    <div class="morph-traits-wrapper">
      <div class="morph-traits-header">
        <span class="morph-traits-icon">🧬</span>
        <span class="morph-traits-title">Врождённые черты при поимке (Рекомендуемые)</span>
      </div>

      <div class="traits-tier-group">
        <div class="label traits-tier-label label-recommended">
          ✓ Рекомендуемые черты (Искать при фарме):
        </div>
        <div class="perk-list">
          ${recommended.map((trait, idx) => `
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
      </div>
    </div>
  `;
}

function openModal(id) {
  const d = DEVIANTS.find(x => x.id === id);
  if (!d) return;
  const body = document.getElementById('modalBody');
  const baseImg = getDeviantImage(d);
  const locInfo = getDeviantLocationInfo(d);

  // Проверяем, есть ли избранный морф для этого девианта
  const favMorphId = state.favoriteMorphs[d.id] || null;
  const hasFavMorph = favMorphId && d.variants && d.variants.some(v => v.id === favMorphId);
  const activeMorphId = hasFavMorph ? favMorphId : 'original';
  const activeVariant = hasFavMorph ? d.variants.find(v => v.id === favMorphId) : null;

  const currentDisplayImg = activeVariant ? activeVariant.image : baseImg;
  const currentRemoteImg = activeVariant ? (activeVariant.remoteImage || '') : (d.image || '');

  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-img">
        <img src="${escapeHtml(currentDisplayImg)}" data-remote="${escapeHtml(currentRemoteImg)}" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" onerror="handleImageError(this)" class="${activeVariant ? 'is-morph-active' : ''}">
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

    <div class="modal-section">
      <h3>Описание и способности</h3>
      <p>${escapeHtml(d.fullDesc)}</p>
      <ul style="margin-top:10px">${(d.abilities || []).map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
    </div>

    ${(d.variants && d.variants.length > 0) ? `
      <!-- Каталог редких морфов и цветовых вариаций с функцией избранного -->
      <div class="modal-section modal-morph-section">
        <div class="morph-section-header">
          <div class="morph-title-wrap">
            <span class="morph-sparkle-icon">✨</span>
            <h3>Редкие Морфы и цветовые вариации (${d.variants.length})</h3>
          </div>
          <span class="morph-live-badge">🌈 Эксклюзивные скины</span>
        </div>
        <p class="morph-intro-text">
          В Once Human некоторые девианты имеют альтернативный окрас (Shiny) с врождёнными эксклюзивными пассивными свойствами. Нажмите на форму, чтобы примерить скин и добавить его в избранное:
        </p>

        <div class="morph-tabs-bar" role="tablist" aria-label="Вариации девианта">
          <button class="morph-tab-btn ${activeMorphId === 'original' ? 'active' : ''}" data-morph="original" type="button">
            <span class="tab-icon">★</span>
            <span class="tab-text">Оригинал (Базовый)</span>
          </button>
          ${d.variants.map((v, idx) => {
            const isThisFav = state.favoriteMorphs[d.id] === v.id;
            return `
              <button class="morph-tab-btn ${activeMorphId === v.id ? 'active' : ''} ${isThisFav ? 'is-fav-tab' : ''}" data-morph="${escapeHtml(v.id)}" data-idx="${idx}" type="button">
                <span class="tab-icon">${isThisFav ? '⭐' : '🌈'}</span>
                <span class="tab-text">${escapeHtml(v.name_ru)}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="morph-display-box" id="morphDisplayBox"></div>
      </div>
    ` : ''}

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

      <div class="modal-loc-box method-box">
        <div class="loc-box-label">⚡ Способ поимки</div>
        <div class="method-desc">${escapeHtml(d.acquisition?.method || '—')}</div>
      </div>
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

    ${(!d.variants || d.variants.length === 0) && d.traits ? `
      <div class="modal-section">
        ${renderDeviantTraitsBlock(d)}
      </div>
    ` : ''}

    <div class="sources">
      <strong>Источники:</strong> ${(d.sources || []).map(s => escapeHtml(s)).join(' · ')}<br>
      <strong>Дата проверки:</strong> ${escapeHtml(formatDate(d.lastChecked))}
    </div>
  `;


  // Интерактивное переключение редких морфов и выбор избранного
  function updateMorphView(morphId) {
    const modalImgEl = body.querySelector('.modal-img img');
    const morphDisplayBox = body.querySelector('#morphDisplayBox');
    const morphBtns = body.querySelectorAll('.morph-tab-btn');

    morphBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.morph === morphId);
    });

    if (morphId === 'original') {
      if (modalImgEl) {
        modalImgEl.src = baseImg;
        modalImgEl.setAttribute('data-remote', d.image || '');
        modalImgEl.classList.remove('is-morph-active');
      }
      const hasCurrentFav = !!state.favoriteMorphs[d.id];
      if (morphDisplayBox) {
        morphDisplayBox.innerHTML = `
          <div class="morph-preview-card">
            <div class="morph-card-top">
              <div class="morph-card-badge">★ Стандартный вид</div>
              ${hasCurrentFav ? `
                <button type="button" class="btn-morph-fav-action btn-reset-morph-fav" id="btnResetMorphFav">
                  <span>↩ Вернуть базовый вид (убрать морф из избранного)</span>
                </button>
              ` : ''}
            </div>
            <div class="morph-card-title">${escapeHtml(d.name_ru)}</div>
            <div class="morph-card-sub">Базовая форма девианта с классическими характеристиками и условиями содержания.</div>
            ${renderDeviantTraitsBlock(d)}
          </div>
        `;
        const resetBtn = morphDisplayBox.querySelector('#btnResetMorphFav');
        if (resetBtn) {
          resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            delete state.favoriteMorphs[d.id];
            localStorage.setItem('oh_fav_morphs', JSON.stringify(state.favoriteMorphs));
            updateFavCount();
            showToast(`Установлен базовый вид для ${d.name_ru}`);
            body.querySelectorAll('.morph-tab-btn').forEach(b => {
              b.classList.remove('is-fav-tab');
              if (b.dataset.morph !== 'original') {
                const icon = b.querySelector('.tab-icon');
                if (icon) icon.textContent = '🌈';
              }
            });
            updateMorphView('original');
            updateGridCard(d.id);
          });
        }
      }
    } else {
      const v = (d.variants || []).find(x => x.id === morphId);
      if (!v) return;

      if (modalImgEl) {
        modalImgEl.src = v.image;
        modalImgEl.setAttribute('data-remote', v.remoteImage || '');
        modalImgEl.classList.add('is-morph-active');
      }

      const isFav = state.favoriteMorphs[d.id] === v.id;

      if (morphDisplayBox) {
        morphDisplayBox.innerHTML = `
          <div class="morph-preview-card active-morph ${isFav ? 'is-favorited-card' : ''}">
            <div class="morph-card-top">
              <div class="morph-card-badge morph-badge-rainbow">🌈 Редкий Морф</div>
              <button type="button" class="btn-morph-fav-action ${isFav ? 'active' : ''}" id="btnToggleMorphFav">
                <span class="star-icon">${isFav ? '★' : '☆'}</span>
                <span class="action-text">${isFav ? 'В избранном (Основной вид)' : 'Сделать этот морф основным'}</span>
              </button>
            </div>
            <div class="morph-card-title">
              ${escapeHtml(v.name_ru)} 
              <span class="morph-en">(${escapeHtml(v.name_en)})</span>
              <span class="morph-rarity">· ${escapeHtml(v.rarity || 'Редкая вариация')}</span>
            </div>
            
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
            ${renderDeviantTraitsBlock(d)}
          </div>
        `;

        const favBtn = morphDisplayBox.querySelector('#btnToggleMorphFav');
        if (favBtn) {
          favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.favoriteMorphs[d.id] === v.id) {
              delete state.favoriteMorphs[d.id];
              localStorage.setItem('oh_fav_morphs', JSON.stringify(state.favoriteMorphs));
              updateFavCount();
              showToast(`Морф "${v.name_ru}" убран из избранного`);
            } else {
              state.favoriteMorphs[d.id] = v.id;
              localStorage.setItem('oh_fav_morphs', JSON.stringify(state.favoriteMorphs));
              updateFavCount();
              showToast(`⭐ "${v.name_ru}" выбран как основной вид девианта`);
            }
            body.querySelectorAll('.morph-tab-btn').forEach(b => {
              const thisFav = state.favoriteMorphs[d.id] === b.dataset.morph;
              b.classList.toggle('is-fav-tab', thisFav);
              if (b.dataset.morph !== 'original') {
                const icon = b.querySelector('.tab-icon');
                if (icon) icon.textContent = thisFav ? '⭐' : '🌈';
              }
            });
            updateMorphView(v.id);
            updateGridCard(d.id);
          });
        }
      }
    }
  }

  if (d.variants && d.variants.length > 0) {
    updateMorphView(activeMorphId);

    const morphBtns = body.querySelectorAll('.morph-tab-btn');
    morphBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateMorphView(btn.dataset.morph);
      });
    });
  }

  document.getElementById('deviantModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateGridCard(id) {
  const d = DEVIANTS.find(x => x.id === id);
  if (!d) return;
  const existingCard = document.querySelector(`.card[data-id="${id}"]`);
  if (existingCard) {
    const temp = document.createElement('div');
    temp.innerHTML = renderCard(d);
    existingCard.replaceWith(temp.firstElementChild);
  }
}

function closeModal() {
  document.getElementById('deviantModal').classList.remove('open');
  document.body.style.overflow = '';
}

function openVideoModal() {
  const videoModal = document.getElementById('videoModal');
  const videoIframeWrap = document.getElementById('videoIframeWrap');
  if (!videoModal || !videoIframeWrap) return;

  videoIframeWrap.innerHTML = `
    <iframe 
      src="https://www.youtube-nocookie.com/embed/krGj5SokgQk?autoplay=1&rel=0" 
      title="Видеогайд Once Human: Девианты (1vampire)" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen>
    </iframe>
  `;
  videoModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const videoModal = document.getElementById('videoModal');
  const videoIframeWrap = document.getElementById('videoIframeWrap');
  if (!videoModal) return;

  videoModal.classList.remove('open');
  if (videoIframeWrap) {
    videoIframeWrap.innerHTML = '';
  }
  document.body.style.overflow = '';
}

function updateFavCount() {
  const favEl = document.getElementById('favCount');
  if (favEl) favEl.textContent = Object.keys(state.favoriteMorphs).length;
}

// Кнопка "Наверх"
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});