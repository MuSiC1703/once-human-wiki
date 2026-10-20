let DEVIANTS = [];
let CATEGORIES = {};
let META = {};
let VARIANTS = {};
let PERKS = {};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDeviantImage(d) {
  return d.id ? `images/${d.id}.webp` : (d.image || '');
}

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
    img.style.display = 'none';
    let ph = parent.querySelector('.placeholder');
    if (!ph) {
      ph = document.createElement('div');
      ph.className = 'placeholder';
      parent.appendChild(ph);
    }
    ph.textContent = fallback;
    ph.style.display = 'flex';
  }
}

function renderCategoryTags(d) {
  return (d.category || []).map(c => {
    if (c === 'combat') return '<span class="cat-tag cat-combat">⚔️ Боевой</span>';
    if (c === 'territory') return '<span class="cat-tag cat-territory">🏡 Территориальный</span>';
    if (c === 'crafting' || c === 'artisan') return '<span class="cat-tag cat-artisan">🔨 Ремесленный</span>';
    return `<span class="cat-tag">${escapeHtml(c)}</span>`;
  }).join('');
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

function formatDate(iso) {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return iso;
}

async function loadData() {
  try {
    const [devRes, varRes, perkRes] = await Promise.all([
      fetch('data/deviants.json', { cache: 'no-cache' }),
      fetch('data/variants.json', { cache: 'no-cache' }).catch(() => null),
      fetch('data/perks.json', { cache: 'no-cache' }).catch(() => null)
    ]);

    if (!devRes.ok) throw new Error(`HTTP ошибка: ${devRes.status}`);

    const devData = await devRes.json();
    DEVIANTS = devData.deviants || [];
    CATEGORIES = devData.categories || {};
    META = devData.meta || {};

    if (varRes && varRes.ok) {
      try {
        const varData = await varRes.json();
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

    if (perkRes && perkRes.ok) {
      try {
        PERKS = await perkRes.json();
        console.log('📜 Загружена официальная база перков');
      } catch (err) {
        console.warn('⚠️ Ошибка парсинга data/perks.json:', err);
      }
    }

    document.getElementById('lastUpdate').textContent = formatDate(META.lastChecked);
    document.getElementById('totalCount').textContent = DEVIANTS.length;
    console.log(`✅ Успешно загружено ${DEVIANTS.length} девиантов из таблицы`);
  } catch (e) {
    console.error('❌ Ошибка загрузки данных:', e);
    document.getElementById('deviantsGrid').innerHTML =
      '<div class="empty-state"><h3>Ошибка загрузки данных</h3><p>Убедитесь, что вы открыли сайт через Live Server.</p></div>';
  }
}

const state = {
  search: '',
  category: 'all',
  favoriteMorphs: JSON.parse(localStorage.getItem('oh_fav_morphs') || '{}'),
  view: 'deviants',
  perkScope: 'all'
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
    }, 200));
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

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = btn.dataset.category || 'all';
      render();
    });
  });

  document.getElementById('deviantsView')?.addEventListener('click', () => { state.view = 'deviants'; render(); });
  document.getElementById('traitsView')?.addEventListener('click', () => { state.view = 'traits'; render(); });

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('deviantModal')?.addEventListener('click', e => { if (e.target.id === 'deviantModal') closeModal(); });

  document.getElementById('videoModalBtn')?.addEventListener('click', openVideoModal);
  document.getElementById('videoModalClose')?.addEventListener('click', closeVideoModal);
  document.getElementById('videoModal')?.addEventListener('click', e => { if (e.target.id === 'videoModal') closeVideoModal(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeVideoModal();
    }
  });

  const grid = document.getElementById('deviantsGrid');
  if (grid) {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.card');
      if (card && card.dataset.id) {
        openModal(card.dataset.id);
      }
    });

    grid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.card');
        if (card && card.dataset.id) {
          e.preventDefault();
          openModal(card.dataset.id);
        }
      }
    });
  }
}

function resetFilters() {
  state.search = '';
  state.category = 'all';
  state.perkScope = 'all';

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

  if (state.category === 'artisan' || state.category === 'crafting') {
    list = list.filter(d => (d.category || []).includes('crafting') || (d.category || []).includes('artisan'));
  } else if (state.category !== 'all') {
    list = list.filter(d => (d.category || []).includes(state.category));
  }

  if (state.search) {
    const q = state.search;
    list = list.filter(d => {
      const variantsText = (d.variants || []).map(v => `${v.name_ru} ${v.fullName_ru || ''} ${v.perk1 || ''} ${v.perk2 || ''} ${v.perk3 || ''} ${v.location || ''}`).join(' ');
      const skillsText = d.skills ? `${d.skills.skill1 || ''} ${d.skills.skill2 || ''} ${(d.skills.mechanics || []).join(' ')}` : '';
      const abilityText = d.ability || '';
      const craftText = `${d.materials || ''} ${d.craftItems || ''}`;
      const containmentText = (d.containment || []).join(' ');
      const catText = (d.category || []).map(c => c === 'combat' ? 'боевой' : (c === 'territory' ? 'территориальный' : 'ремесленный крафтовый')).join(' ');

      const haystack = [
        d.name_ru,
        d.name_en,
        d.shortDesc,
        d.fullDesc,
        d.location,
        d.perk1,
        d.perk2,
        d.perk3,
        skillsText,
        abilityText,
        craftText,
        containmentText,
        catText,
        variantsText
      ].filter(Boolean).join(' ').toLowerCase();

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
  const countCrafting = document.getElementById('countCrafting') || document.getElementById('countArtisan');

  if (countAll) countAll.textContent = DEVIANTS.length;
  if (countCombat) countCombat.textContent = DEVIANTS.filter(d => (d.category || []).includes('combat')).length;
  if (countTerritory) countTerritory.textContent = DEVIANTS.filter(d => (d.category || []).includes('territory')).length;
  if (countCrafting) countCrafting.textContent = DEVIANTS.filter(d => (d.category || []).includes('crafting') || (d.category || []).includes('artisan')).length;

  updateFavCount();
}

function renderCard(d) {
  const favMorphId = state.favoriteMorphs[d.id];
  const favVariant = (favMorphId && d.variants) ? d.variants.find(v => v.id === favMorphId) : null;

  const cardImg = favVariant ? favVariant.image : getDeviantImage(d);
  const cardRemote = favVariant ? (favVariant.remoteImage || '') : (d.image || '');
  const morphCount = (Array.isArray(d.variants) && d.variants.length > 0) ? d.variants.length : 0;

  return `
    <article class="card ${favVariant ? 'has-fav-morph' : ''}" data-id="${escapeHtml(d.id)}" tabindex="0" role="button" aria-label="${escapeHtml(d.name_ru)}">
      <div class="card-img">
        <img src="${escapeHtml(cardImg)}" data-remote="${escapeHtml(cardRemote)}" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" loading="lazy" onerror="handleImageError(this)">
        ${favVariant 
          ? `<div class="card-fav-morph-badge" title="Выбранный вами морф: ${escapeHtml(favVariant.name_ru)}">⭐ ${escapeHtml(favVariant.name_ru)}</div>`
          : (morphCount > 0 ? `<div class="card-shiny-badge" title="Имеет ${morphCount} редких морфов">✨ Морфы: ${morphCount}</div>` : '')
        }
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(d.name_ru)} <span class="card-title-en">${escapeHtml(d.name_en || '')}</span></div>
        ${favVariant ? `<div class="card-morph-selected-title">✨ Активен морф: <b>${escapeHtml(favVariant.name_ru)}</b></div>` : ''}
        <div class="card-category">
          ${renderCategoryTags(d)}
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
  const baseImg = getDeviantImage(d);

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
          ${renderCategoryTags(d)}
        </div>
      </div>
    </div>

    <!-- БЛОК 1: СПОСОБНОСТИ И МЕХАНИКИ -->
    <div class="modal-section">
      <h3>⚡ Способности и механика</h3>
      ${d.category.includes('combat') && d.skills ? `
        <div class="skill-row">
          <div class="skill-key-badge">E</div>
          <div class="skill-body">
            <strong>Скилл 1:</strong>
            ${escapeHtml(d.skills.skill1 || '—')}
          </div>
        </div>
        <div class="skill-row">
          <div class="skill-key-badge skill-key-x">X</div>
          <div class="skill-body">
            <strong>Скилл 2 (Рейтинг навыка - 5):</strong>
            ${escapeHtml(d.skills.skill2 || '—')}
          </div>
        </div>
        ${(d.skills.mechanics && Array.isArray(d.skills.mechanics) && d.skills.mechanics.length > 0) ? `
          <div class="mechanics-box">
            <div class="mechanics-title">🎯 Механика навыков:</div>
            <ul class="mechanics-list">
              ${d.skills.mechanics.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      ` : ''}

      ${d.category.includes('territory') ? `
        <div class="skill-row">
          <div class="skill-key-badge" style="background: linear-gradient(135deg, #2563eb, #1d4ed8);">🏡</div>
          <div class="skill-body">
            <strong>Способность:</strong>
            ${escapeHtml(d.ability || '—')}
          </div>
        </div>
      ` : ''}

      ${d.category.includes('crafting') ? `
        <div class="craft-detail-box">
          <div class="craft-box-item">
            <div class="craft-label">📦 Производимые материалы:</div>
            <div class="craft-text">${escapeHtml(d.materials || '—')}</div>
          </div>
          <div class="craft-box-item">
            <div class="craft-label">🔨 Создаваемые предметы:</div>
            <div class="craft-text">${escapeHtml(d.craftItems || '—')}</div>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- БЛОК 3: УСЛОВИЯ СОДЕРЖАНИЯ (MOOD BOOSTERS) -->
    <div class="modal-section">
      <h3>🔆 Предпочтения в колбе (Условия содержания)</h3>
      <p style="font-size:13px; color:var(--text-dim); margin-bottom:10px; font-style:italic;">
        Обеспечьте эти условия в Изолированном блоке безопасности для максимальной эффективности и быстрого восстановления.
      </p>
      <div class="containment-chips">
        ${(() => {
          const chips = Array.isArray(d.containment)
            ? d.containment
            : (typeof d.containment === 'string' && d.containment.trim() ? [d.containment.trim()] : []);
          return chips.length > 0
            ? chips.map(c => `<div class="containment-chip">✓ ${escapeHtml(c)}</div>`).join('')
            : '<div class="containment-chip">Стандартные условия содержания</div>';
        })()}
      </div>
    </div>

    <!-- БЛОК 3: МОРФЫ И ВАРИАЦИИ -->
    <div class="modal-section modal-morph-section">
      <div class="morph-section-header">
        <div class="morph-title-wrap">
          <span class="morph-sparkle-icon">✨</span>
          <h3>${(Array.isArray(d.variants) && d.variants.length > 0) ? `Морфы и вариации (${d.variants.length})` : 'Рекомендованные перки и получение'}</h3>
        </div>
      </div>
      ${(Array.isArray(d.variants) && d.variants.length > 0) ? `
        <div class="morph-tabs-bar" role="tablist" aria-label="Вариации девианта">
          <button class="morph-tab-btn ${activeMorphId === 'original' ? 'active' : ''}" data-morph="original" type="button">
            <span class="tab-icon">★</span>
            <span class="tab-text">Оригинал (Базовый)</span>
          </button>
          ${d.variants.map((v, idx) => {
            const isThisFav = state.favoriteMorphs[d.id] === v.id;
            return `
              <button class="morph-tab-btn ${activeMorphId === v.id ? 'active' : ''} ${isThisFav ? 'is-fav-tab' : ''} ${v.isBestChoice ? 'is-best-tab' : ''}" data-morph="${escapeHtml(v.id)}" data-idx="${idx}" type="button">
                <span class="tab-icon">${isThisFav ? '⭐' : (v.isBestChoice ? '👑' : '✨')}</span>
                <span class="tab-text">${escapeHtml(v.name_ru)}</span>
              </button>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div class="morph-display-box" id="morphDisplayBox"></div>
    </div>

    <!-- БЛОК: ГДЕ ПОЛУЧИТЬ -->
    <div class="modal-section modal-location-card">
      <div class="modal-loc-header">
        <div class="modal-loc-title-group">
          <div class="modal-loc-main-title">
            <span class="loc-header-pin">📍</span>
            <h3>Где получить</h3>
          </div>
          <span class="loc-pill sc-all" id="modalLocFormBadge">★ Базовая форма</span>
        </div>
      </div>

      <div class="modal-loc-box method-box">
        <div class="loc-box-label" id="modalLocLabel">Местоположение / Источник:</div>
        <div class="method-desc" id="modalLocDesc">${escapeHtml(d.location || 'Открытый мир / Исследование / Бункеры')}</div>
      </div>
    </div>
  `;

  function updateMorphView(morphId) {
    const modalImgWrap = body.querySelector('.modal-img');
    let modalImgEl = modalImgWrap ? modalImgWrap.querySelector('img') : null;
    if (modalImgWrap) {
      const ph = modalImgWrap.querySelector('.placeholder');
      if (ph) ph.remove();
      if (!modalImgEl) {
        modalImgWrap.insertAdjacentHTML('afterbegin', `<img src="" alt="${escapeHtml(d.name_ru)}" data-fallback="${escapeHtml(d.imageFallback || '◈')}" onerror="handleImageError(this)">`);
        modalImgEl = modalImgWrap.querySelector('img');
      }
      modalImgEl.style.display = '';
    }
    const morphDisplayBox = body.querySelector('#morphDisplayBox');
    const morphBtns = body.querySelectorAll('.morph-tab-btn');

    morphBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.morph === morphId);
    });

    const locDescEl = body.querySelector('#modalLocDesc');
    const locBadgeEl = body.querySelector('#modalLocFormBadge');
    if (locDescEl) {
      if (morphId === 'original') {
        locDescEl.textContent = d.location || 'Открытый мир / Исследование / Бункеры';
        if (locBadgeEl) locBadgeEl.textContent = '★ Базовая форма';
      } else {
        const v = (d.variants || []).find(x => x.id === morphId);
        if (v) {
          locDescEl.textContent = v.location || d.location || 'Открытый мир / Исследование / Бункеры';
          if (locBadgeEl) locBadgeEl.textContent = `✨ ${v.name_ru}`;
        }
      }
    }

    if (morphId === 'original') {
      if (modalImgEl) {
        modalImgEl.setAttribute('data-remote', d.remoteImage || d.image || '');
        modalImgEl.src = baseImg;
        modalImgEl.classList.remove('is-morph-active');
      }
      const hasCurrentFav = !!state.favoriteMorphs[d.id];
      if (morphDisplayBox) {
        morphDisplayBox.innerHTML = `
          <div class="morph-preview-card">
            <div class="morph-card-top">
              <div class="morph-card-badge">★ Базовая форма (Оригинал)</div>
              ${hasCurrentFav ? `
                <button type="button" class="btn-morph-fav-action btn-reset-morph-fav" id="btnResetMorphFav">
                  <span>↩ Вернуть базовый вид (убрать морф из избранного)</span>
                </button>
              ` : ''}
            </div>
            <div class="morph-card-title">${escapeHtml(d.name_ru)}</div>
            <div class="morph-card-sub">Стандартная форма девианта с базовыми характеристиками и условиями содержания.</div>

            ${d.isBestChoice ? `
              <div class="modal-choice-banner is-best" style="margin-top: 6px; margin-bottom: 8px; padding: 8px 12px;">
                <span class="choice-star" style="font-size: 18px;">👑</span>
                <div class="choice-text">
                  <strong style="color: #fde68a; font-size: 13px;">⭐ ЛУЧШИЙ ВЫБОР: ДА</strong>
                  <span style="font-size: 11.5px;">Базовая форма девианта официально рекомендована в качестве лучшего варианта!</span>
                </div>
              </div>
            ` : `
              <div class="modal-choice-banner is-normal" style="margin-top: 6px; margin-bottom: 8px; padding: 8px 12px;">
                <span class="choice-star" style="font-size: 16px;">✦</span>
                <div class="choice-text">
                  <strong style="font-size: 13px;">ЛУЧШИЙ ВЫБОР: НЕТ</strong>
                  <span style="font-size: 11.5px;">Базовый вариант девианта.</span>
                </div>
              </div>
            `}

            ${d.location ? `
              <div class="morph-source-row">
                <span class="morph-source-icon">📍</span>
                <span class="morph-source-text"><strong>Где получить:</strong> ${escapeHtml(d.location)}</span>
              </div>
            ` : ''}
            
            <div class="perks-grid-3" style="margin-top: 10px;">
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 1 (Основной)</div>
                <div class="perk-col-val">${escapeHtml(d.perk1 || '—')}</div>
              </div>
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 2 (${d.category.includes('combat') ? 'Боевой' : (d.category.includes('territory') ? 'Территориальный' : 'Ремесленный')})</div>
                <div class="perk-col-val">${escapeHtml(d.perk2 || '—')}</div>
              </div>
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 3 (Крафтовый)</div>
                <div class="perk-col-val">${escapeHtml(d.perk3 || '—')}</div>
              </div>
            </div>
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
                const vMatch = (d.variants || []).find(x => x.id === b.dataset.morph);
                if (icon) icon.textContent = (vMatch && vMatch.isBestChoice) ? '👑' : '✨';
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
        modalImgEl.setAttribute('data-remote', v.remoteImage || '');
        modalImgEl.src = v.image;
        modalImgEl.classList.add('is-morph-active');
      }

      const isFav = state.favoriteMorphs[d.id] === v.id;

      if (morphDisplayBox) {
        morphDisplayBox.innerHTML = `
          <div class="morph-preview-card active-morph ${isFav ? 'is-favorited-card' : ''}">
            <div class="morph-card-top">
              <div class="morph-card-badge morph-badge-rainbow">✨ Редкий Морф</div>
              <button type="button" class="btn-morph-fav-action ${isFav ? 'active' : ''}" id="btnToggleMorphFav">
                <span class="star-icon">${isFav ? '★' : '☆'}</span>
                <span class="action-text">${isFav ? 'В избранном (Основной вид)' : 'Сделать этот морф основным'}</span>
              </button>
            </div>
            
            <div class="morph-card-title">
              ${escapeHtml(v.fullName_ru || v.name_ru)}
            </div>

            <!-- СТАТУС ЛУЧШИЙ ВЫБОР -->
            ${v.isBestChoice ? `
              <div class="modal-choice-banner is-best" style="margin-top: 6px; margin-bottom: 8px; padding: 8px 12px;">
                <span class="choice-star" style="font-size: 18px;">👑</span>
                <div class="choice-text">
                  <strong style="color: #fde68a; font-size: 13px;">⭐ ЛУЧШИЙ ВЫБОР: ДА</strong>
                  <span style="font-size: 11.5px;">Этот морф официально отмечен в таблице как один из лучших выборов!</span>
                </div>
              </div>
            ` : `
              <div class="modal-choice-banner is-normal" style="margin-top: 6px; margin-bottom: 8px; padding: 8px 12px;">
                <span class="choice-star" style="font-size: 16px;">✦</span>
                <div class="choice-text">
                  <strong style="font-size: 13px;">ЛУЧШИЙ ВЫБОР: НЕТ</strong>
                  <span style="font-size: 11.5px;">Альтернативная косметическая вариация.</span>
                </div>
              </div>
            `}

            <div class="morph-source-row">
              <span class="morph-source-icon">📍</span>
              <span class="morph-source-text"><strong>Где получить:</strong> ${escapeHtml(v.location || 'Открытый мир / Исследование')}</span>
            </div>

            <div class="perks-grid-3" style="margin-top: 10px;">
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 1 (Основной)</div>
                <div class="perk-col-val">${escapeHtml(v.perk1 || '—')}</div>
              </div>
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 2</div>
                <div class="perk-col-val">${escapeHtml(v.perk2 || '—')}</div>
              </div>
              <div class="perk-col-card">
                <div class="perk-col-label">Перк 3 (Крафтовый)</div>
                <div class="perk-col-val">${escapeHtml(v.perk3 || '—')}</div>
              </div>
            </div>
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
                const vMatch = (d.variants || []).find(x => x.id === b.dataset.morph);
                if (icon) icon.textContent = thisFav ? '⭐' : ((vMatch && vMatch.isBestChoice) ? '👑' : '✨');
              }
            });
            updateMorphView(v.id);
            updateGridCard(d.id);
          });
        }
      }
    }
  }

  updateMorphView(activeMorphId);

  const morphBtns = body.querySelectorAll('.morph-tab-btn');
  morphBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateMorphView(btn.dataset.morph);
    });
  });

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

function renderTraits() {
  const grid = document.getElementById('deviantsGrid');
  const empty = document.getElementById('emptyState');
  const statsBar = document.getElementById('statsBar');

  if (!PERKS || Object.keys(PERKS).length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>Перки загружаются...</h3></div>';
    return;
  }

  const allItems = [];

  (PERKS.general || []).forEach(p => allItems.push({ ...p, category: 'general', catLabel: '🧬 Основной', badgeClass: 'scope-general' }));
  (PERKS.combat || []).forEach(p => allItems.push({ ...p, category: 'combat', catLabel: '⚔️ Боевой', badgeClass: 'scope-combat' }));
  (PERKS.territory || []).forEach(p => allItems.push({ ...p, category: 'territory', catLabel: '🏡 Территориальный', badgeClass: 'scope-territory' }));
  (PERKS.artisan || []).forEach(p => allItems.push({ ...p, category: 'artisan', catLabel: '🔨 Ремесленный', badgeClass: 'scope-artisan' }));
  (PERKS.crafting_animal || []).forEach(p => allItems.push({ ...p, category: 'crafting', subCategory: 'animal', catLabel: '🧪 Крафтовый (Животное)', badgeClass: 'scope-crafting', isCraftDual: true }));
  (PERKS.crafting_furniture || []).forEach(p => allItems.push({ ...p, category: 'crafting', subCategory: 'furniture', catLabel: '🧪 Крафтовый (Мебель)', badgeClass: 'scope-crafting', isCraftDual: true }));
  (PERKS.chaos || []).forEach(p => allItems.push({ ...p, category: 'chaos', catLabel: '🌀 Хаосный', badgeClass: 'scope-chaos' }));

  const query = (state.search || '').trim().toLowerCase();

  const searched = allItems.filter(p => {
    if (!query) return true;
    const haystack = [
      p.name,
      p.description || '',
      p.combatEffect || '',
      p.territoryEffect || '',
      p.catLabel
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const counts = {
    all: searched.length,
    general: searched.filter(p => p.category === 'general').length,
    combat: searched.filter(p => p.category === 'combat').length,
    territory: searched.filter(p => p.category === 'territory').length,
    artisan: searched.filter(p => p.category === 'artisan').length,
    crafting: searched.filter(p => p.category === 'crafting').length,
    chaos: searched.filter(p => p.category === 'chaos').length
  };

  const activeScope = state.perkScope || 'all';

  if (statsBar) {
    statsBar.innerHTML = `
      <div class="category-tabs-bar" role="tablist" aria-label="Категории перков" style="padding-top: 0;">
        <button class="category-btn traits-chip ${activeScope === 'all' ? 'active' : ''}" data-scope="all" type="button">
          <span>Все</span><b class="chip-count">${counts.all}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'general' ? 'active' : ''}" data-scope="general" type="button">
          <span>🧬 Основные</span><b class="chip-count">${counts.general}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'combat' ? 'active' : ''}" data-scope="combat" type="button">
          <span>⚔️ Боевые</span><b class="chip-count">${counts.combat}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'territory' ? 'active' : ''}" data-scope="territory" type="button">
          <span>🏡 Территориальные</span><b class="chip-count">${counts.territory}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'artisan' ? 'active' : ''}" data-scope="artisan" type="button">
          <span>🔨 Ремесленные</span><b class="chip-count">${counts.artisan}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'crafting' ? 'active' : ''}" data-scope="crafting" type="button">
          <span>🧪 Крафтовые</span><b class="chip-count">${counts.crafting}</b>
        </button>
        <button class="category-btn traits-chip ${activeScope === 'chaos' ? 'active' : ''}" data-scope="chaos" type="button">
          <span>🌀 Хаосные</span><b class="chip-count">${counts.chaos}</b>
        </button>
      </div>
    `;

    statsBar.querySelectorAll('.traits-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.perkScope = chip.dataset.scope;
        renderTraits();
      });
    });
  }

  const filtered = searched.filter(p => {
    if (activeScope !== 'all' && p.category !== activeScope) return false;
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  grid.innerHTML = `
    <div class="traits-subgrid" style="grid-column: 1 / -1; width: 100%;">
      ${filtered.map(p => `
        <article class="trait-card trait-card-${escapeHtml(p.category)}">
          <div class="trait-card-heading">
            ${p.icon ? `
              <div class="trait-icon-frame">
                <img src="${escapeHtml(p.icon)}" alt="${escapeHtml(p.name)}" class="trait-icon-img" loading="lazy" />
              </div>
            ` : ''}
            <div class="trait-title-group">
              <h2 class="trait-name-ru">${escapeHtml(p.name)}</h2>
              <div class="trait-badges">
                <span class="trait-scope-badge ${escapeHtml(p.badgeClass)}">${escapeHtml(p.catLabel)}</span>
              </div>
            </div>
          </div>
          
          <div class="trait-desc-box">
            ${p.isCraftDual ? `
              <div class="craft-effect-box">
                <div class="craft-effect-row">
                  <div class="effect-heading">⚔️ На боевых девиантах:</div>
                  <p>${escapeHtml(p.combatEffect || '—')}</p>
                </div>
                <div class="craft-effect-row">
                  <div class="effect-heading">🏡 На территориальных и ремесленных девиантах:</div>
                  <p>${escapeHtml(p.territoryEffect || '—')}</p>
                </div>
              </div>
            ` : `
              <div class="trait-desc-label">Описание:</div>
              <div class="trait-desc-content">
                <p>${escapeHtml(p.description)}</p>
              </div>
            `}
          </div>
        </article>
      `).join('')}
    </div>
  `;
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

const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
