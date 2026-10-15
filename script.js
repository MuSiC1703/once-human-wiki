let DEVIANTS = [];
let CATEGORIES = {};
let META = {};
const ROLE_GROUPS = {
  damage: {label: 'Урон в бою', category: 'combat', roles: ['Ближний бой', 'Взрывной урон', 'Ледяной урон', 'Метка цели', 'Огонь', 'Урон', 'Усиление оружия']},
  support: {label: 'Поддержка', roles: ['Воскрешение', 'Восстановление игрока', 'Восстановление рассудка', 'Восстановление энергии', 'Лечение', 'Отдых', 'Поддержка', 'Поддержка базы']},
  control: {label: 'Контроль', roles: ['Заморозка', 'Контроль', 'Контроль врагов', 'Контроль толпы', 'Ловушки', 'Отвлечение', 'Приманка']},
  defense: {label: 'Защита', roles: ['Защита', 'Защита базы', 'Защитный расходник', 'Перенос урона']},
  resources: {label: 'Сбор ресурсов', roles: ['Добыча древесины', 'Добыча руды', 'Добыча шкур', 'Награды', 'Сбор растений', 'Фарм ресурсов', 'Экспедиции']},
  farming: {label: 'Фермерство', roles: ['Мутация культур', 'Полив', 'Посадка и сбор', 'Приготовление пищи', 'Фермерство']},
  production: {label: 'Производство и расходники', roles: ['Маскировка', 'Метательное оружие', 'Продление прихотей', 'Работа печей', 'Ремонт', 'Ремонт базы', 'Тактические предметы', 'Тактический расходник', 'Усиление турелей и дронов']},
  utility: {label: 'Мобильность и утилиты', roles: ['Мобильность', 'Переносимый вес', 'PvP', 'Рыбалка', 'Скрытность', 'Телепортация', 'Телепортация базы', 'Телепортация команды', 'Энергоснабжение базы']}
};

async function loadData() {
  try {
    const response = await fetch('data/deviants.json');
    if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
    
    const data = await response.json();
    DEVIANTS = data.deviants || [];
    CATEGORIES = data.categories || {};
    META = data.meta || {};
    
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
  search: '', category: 'all', role: 'all', confidence: 'all', sort: 'name',
  favOnly: false,
  favorites: JSON.parse(localStorage.getItem('oh_favorites') || '[]'),
  compareList: JSON.parse(localStorage.getItem('oh_compare') || '[]'),
  quickSection: null,
  view: 'deviants'
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  buildCategoryFilter();
  buildRoleFilter();
  bindEvents();
  render();
  updateFavCount();
});

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

function bindEvents() {
  document.getElementById('searchInput').addEventListener('input', e => { state.search = e.target.value.toLowerCase().trim(); render(); });
  document.getElementById('categoryFilter').addEventListener('change', e => { state.category = e.target.value; render(); });
  document.getElementById('roleFilter').addEventListener('change', e => { state.role = e.target.value; render(); });
  document.getElementById('confidenceFilter').addEventListener('change', e => { state.confidence = e.target.value; render(); });
  document.getElementById('sortSelect').addEventListener('change', e => { state.sort = e.target.value; render(); });
  document.getElementById('resetBtn').addEventListener('click', resetFilters);
  document.getElementById('favToggle').addEventListener('click', toggleFavFilter);
  document.getElementById('deviantsView').addEventListener('click', () => { state.view = 'deviants'; render(); });
  document.getElementById('traitsView').addEventListener('click', () => { state.view = 'traits'; render(); });

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => handleQuickSection(btn.dataset.section));
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('deviantModal').addEventListener('click', e => { if (e.target.id === 'deviantModal') closeModal(); });
  document.getElementById('compareClose').addEventListener('click', closeCompare);
  document.getElementById('compareModal').addEventListener('click', e => { if (e.target.id === 'compareModal') closeCompare(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCompare(); } });
}

function resetFilters() {
  state.search = ''; state.category = 'all'; state.role = 'all'; state.confidence = 'all';
  state.sort = 'name'; state.favOnly = false; state.quickSection = null;
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('roleFilter').value = 'all';
  document.getElementById('confidenceFilter').value = 'all';
  document.getElementById('sortSelect').value = 'name';
  document.getElementById('favToggle').classList.remove('active');
  document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
  render();
}

function toggleFavFilter() {
  state.favOnly = !state.favOnly;
  document.getElementById('favToggle').classList.toggle('active', state.favOnly);
  render();
}

function handleQuickSection(section) {
  document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.quick-btn[data-section="${section}"]`).classList.add('active');
  state.quickSection = section === 'all' ? null : section;
  if (section === 'compare') { openCompareModal(); return; }
  render();
}

function getFiltered() {
  let list = [...DEVIANTS];
  if (state.quickSection === 'combat') list = list.filter(d => d.category.includes('combat'));
  else if (state.quickSection === 'base') list = list.filter(d => d.category.some(c => ['territory', 'crafting'].includes(c)));

  if (state.category !== 'all') list = list.filter(d => d.category.includes(state.category));
  if (state.role !== 'all') {
    const roleGroup = ROLE_GROUPS[state.role];
    list = list.filter(d => (!roleGroup?.category || d.category.includes(roleGroup.category)) && (d.roles || []).some(role => roleGroup?.roles.includes(role)));
  }
  if (state.confidence !== 'all') list = list.filter(d => d.confidence === state.confidence);
  if (state.favOnly) list = list.filter(d => state.favorites.includes(d.id));
  
  if (state.search) {
    const q = state.search;
    list = list.filter(d => {
      const traitsText = d.traits ? [...(d.traits.recommended || []), ...(d.traits.avoid || [])].map(t => t.name + ' ' + t.name_ru + ' ' + t.effect).join(' ') : '';
      const haystack = [d.name_ru, d.name_en, d.shortDesc, d.fullDesc, ...(d.abilities || []), ...(d.category || []).map(c => CATEGORIES[c] || c), ...(d.roles || []), ...(d.moodBoosters || []), traitsText].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  if (state.sort === 'name') list.sort((a, b) => a.name_ru.localeCompare(b.name_ru, 'ru'));
  else if (state.sort === 'category') list.sort((a, b) => a.category[0].localeCompare(b.category[0]));

  return list;
}

function render() {
  const isTraitsView = state.view === 'traits';
  document.getElementById('deviantFilters').hidden = isTraitsView;
  document.querySelector('.quick-sections').hidden = isTraitsView;
  document.getElementById('deviantsView').classList.toggle('active', !isTraitsView);
  document.getElementById('traitsView').classList.toggle('active', isTraitsView);

  if (isTraitsView) { renderTraits(); return; }

  const list = getFiltered();
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  renderStats();

  if (list.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = list.map(d => renderCard(d)).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => { if (!e.target.closest('.fav-btn') && !e.target.closest('.compare-btn')) openModal(card.dataset.id); });
  });
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(btn.dataset.id); });
  });
  grid.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); toggleCompare(btn.dataset.id); });
  });

  grid.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      const parent = img.parentElement;
      parent.innerHTML = `<div class="placeholder">${img.dataset.fallback || '◈'}</div>`;
    });
  });
}

function renderStats() {
  const bar = document.getElementById('statsBar');
  const counts = {};
  DEVIANTS.forEach(d => d.category.forEach(c => counts[c] = (counts[c] || 0) + 1));
  bar.innerHTML = Object.entries(counts).map(([k, v]) => `<div class="stat-chip">${CATEGORIES[k] || k}<b>${v}</b></div>`).join('');
}

function renderTraits() {
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  const grouped = new Map();

  DEVIANTS.forEach(deviant => {
    [['recommended', 'Рекомендуется'], ['avoid', 'Лучше избегать']].forEach(([kind, label]) => {
      (deviant.traits?.[kind] || []).forEach(trait => {
        const key = `${kind}|${trait.name}`;
        if (!grouped.has(key)) {
          grouped.set(key, {kind, label, name: trait.name, nameRu: trait.name_ru, effects: [], deviants: []});
        }
        const group = grouped.get(key);
        let effect = group.effects.find(entry => entry.text === trait.effect);
        if (!effect) {
          effect = {text: trait.effect};
          group.effects.push(effect);
        }
        if (!group.deviants.some(entry => entry.id === deviant.id)) group.deviants.push(deviant);
      });
    });
  });

  const query = state.search;
  const traits = [...grouped.values()]
    .filter(trait => !query || [trait.name, trait.nameRu, ...trait.effects.map(effect => effect.text), ...trait.deviants.map(deviant => deviant.name_ru)].join(' ').toLowerCase().includes(query))
    .sort((a, b) => (a.nameRu || a.name).localeCompare(b.nameRu || b.name, 'ru'));

  document.getElementById('statsBar').innerHTML = `<div class="stat-chip">Traits<b>${traits.length}</b></div>`;
  if (!traits.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  grid.innerHTML = traits.map(trait => `
    <article class="trait-card ${trait.kind === 'avoid' ? 'trait-avoid' : 'trait-recommended'}">
      <div class="trait-card-heading">
        <h2>${trait.nameRu || trait.name}</h2>
        <span class="trait-kind">${trait.label}</span>
      </div>
      ${trait.nameRu ? `<div class="trait-name-en">${trait.name}</div>` : ''}
      ${trait.effects.map(effect => `<p class="trait-effect">${effect.text}</p>`).join('')}
      <div class="trait-deviants-label">Связанные девианты</div>
      <div class="trait-deviants">${trait.deviants.map(deviant => `<button class="trait-reference" data-id="${deviant.id}" type="button">${deviant.name_ru}</button>`).join('')}</div>
    </article>
  `).join('');

  grid.querySelectorAll('.trait-reference').forEach(button => {
    button.addEventListener('click', () => openModal(button.dataset.id));
  });
}

function renderCard(d) {
  const isFav = state.favorites.includes(d.id);
  const isCompare = state.compareList.includes(d.id);
  const confLabel = { high: '✓', medium: '~', low: '!' }[d.confidence] || '';
  const confTitle = { high: 'Высокая достоверность', medium: 'Средняя достоверность', low: 'Низкая достоверность' }[d.confidence] || '';

  return `
    <article class="card" data-id="${d.id}">
      <div class="card-img">
        <img src="${d.image}" alt="${d.name_ru}" data-fallback="${d.imageFallback}" loading="lazy">
        <button class="compare-btn ${isCompare ? 'active' : ''}" data-id="${d.id}" title="Сравнить">⇄</button>
        <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${d.id}" title="В избранное">★</button>
        <div class="confidence-badge confidence-${d.confidence}" title="${confTitle}">${confLabel}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${d.name_ru} <span class="card-title-en">${d.name_en || ''}</span></div>
        <div class="card-category">${d.category.map(c => `<span class="cat-tag">${CATEGORIES[c] || c}</span>`).join('')}${(d.roles || []).map(role => `<span class="role-tag">${role}</span>`).join('')}</div>
        <div class="card-desc">${d.shortDesc}</div>
      </div>
    </article>
  `;
}

function openModal(id) {
  const d = DEVIANTS.find(x => x.id === id);
  if (!d) return;
  const body = document.getElementById('modalBody');

  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-img"><img src="${d.image}" alt="${d.name_ru}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>${d.imageFallback}</div>'"></div>
      <div class="modal-info">
        <h2>${d.name_ru}</h2>
        <div class="en-name">${d.name_en || ''}</div>
        <div class="purpose">${d.shortDesc}</div>
        <div class="card-category">${d.category.map(c => `<span class="cat-tag">${CATEGORIES[c] || c}</span>`).join('')}${(d.roles || []).map(role => `<span class="role-tag">${role}</span>`).join('')}</div>
      </div>
    </div>
    <div class="modal-section"><h3>Описание и способности</h3><p>${d.fullDesc}</p><ul style="margin-top:10px">${(d.abilities || []).map(a => `<li>${a}</li>`).join('')}</ul></div>
    <div class="modal-section">
      <h3>Как получить</h3>
      <div class="label">Локация</div><p>${d.acquisition?.location || '—'}</p>
      <div class="label">Способ</div><p>${d.acquisition?.method || '—'}</p>
      <div class="label">Советы по фарму</div><p>${d.acquisition?.tips || '—'}</p>
    </div>
    <div class="modal-section">
      <h3>🔆 Условия содержания (Mood Boosters)</h3>
      <p style="font-size:13px; color:var(--text-dim); margin-bottom:12px; font-style:italic;">Разместите девианта в Изолированном блоке безопасности и обеспечьте указанные условия настроения для 100% эффективности.</p>
      <div class="perk-list">
        ${(d.moodBoosters || []).map(m => `
          <div class="perk-item">
            <div class="perk-name">${m} <span class="perk-priority">ОБЯЗАТЕЛЬНО</span></div>
            <div class="perk-desc">Разместите этот источник настроения рядом с блоком безопасности.</div>
            <div class="perk-why">Без этого условия девиант будет терять настроение, что снизит его эффективность.</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="modal-section">
      <h3>Преимущества и недостатки</h3>
      <div class="pros-cons">
        <div class="pros"><h4>✓ Плюсы</h4><ul>${(d.pros || []).map(p => `<li>${p}</li>`).join('')}</ul></div>
        <div class="cons"><h4>✕ Минусы</h4><ul>${(d.cons || []).map(c => `<li>${c}</li>`).join('')}</ul></div>
      </div>
    </div>
    ${d.bestFor ? `<div class="modal-section"><h3>Кому подойдёт</h3><p>${d.bestFor}</p></div>` : ''}
    ${d.alternatives?.length ? `<div class="modal-section"><h3>Альтернативы</h3><p>${d.alternatives.join(', ')}</p></div>` : ''}
    <div class="sources">
      <strong>Источники:</strong> ${(d.sources || []).join(' · ')}<br>
      <strong>Дата проверки:</strong> ${formatDate(d.lastChecked)}<br>
      <em style="margin-top:8px; display:block;">${META.disclaimer}</em>
    </div>
  `;
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
    body.innerHTML = `<table class="compare-table"><thead><tr><th style="width:20%">Параметр</th>${items.map(d => `<th>${d.name_ru}</th>`).join('')}</tr></thead><tbody>${fields.map(([label, fn]) => `<tr><td><strong>${label}</strong></td>${items.map(d => `<td>${fn(d)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  document.getElementById('compareModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCompare() { document.getElementById('compareModal').classList.remove('open'); document.body.style.overflow = ''; }
