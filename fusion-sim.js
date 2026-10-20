/**
 * Once Human Wiki — Симулятор слияния девиантов (Deviation Fusion / Merge)
 * Полная реплика внутриигрового интерфейса капсулы слияния (Merge UI)
 */

(function () {
  'use strict';

  // Звуковой синтезатор интерфейса (Web Audio API)
  const SoundFX = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (_) {}
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },
    playClick() {
      if (!state.sound) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (_) {}
    },
    playSurge() {
      if (!state.sound) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.9);
      } catch (_) {}
    },
    playSuccess(isGodRoll) {
      if (!state.sound) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = isGodRoll ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const startTime = this.ctx.currentTime + (idx * 0.1);
          gain.gain.setValueAtTime(0.07, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.4);
        });
      } catch (_) {}
    }
  };

  // Внутреннее состояние лаборатории
  const state = {
    fusionData: null,
    deviantsList: [],
    selectedInspectOutcome: 'p1', // 'p1' или 'p2'
    drawerTargetParent: null,      // 'p1', 'p2', 'donor0', 'donor1', 'donor2'
    drawerCategory: 'all',
    drawerSearch: '',
    sound: true,
    p1: {
      id: null,
      rating: 4,
      activity: 4,
      perks: []
    },
    p2: {
      id: null,
      rating: 4,
      activity: 4,
      perks: []
    },
    donors: [null, null, null], // До 3 жертвенных девиантов-доноров (Sacrifice Donors)
    animalId: 'none',
    animalTraitId: 'none',
    mutagenId: 'none',
    instant: false,
    isFusing: false,
    lastResult: null,
    monteCarlo: null
  };

  // Резервные данные на случай офлайна/сбоя fetch
  const FALLBACK_FUSION_DATA = {
    mechanics: {
      baseInheritOneParent: 0.35,
      baseInheritBothParents: 0.75,
      donorInheritOne: 0.25,
      donorInheritTwo: 0.45,
      donorInheritThree: 0.60,
      parentAndDonorSynergy: 0.65,
      donorRatingBonusPerHighTier: 0.05,
      animalDonorMultiplier: 10.0,
      animalDonorMaxCap: 0.95,
      baseNegativeRisk: 0.20,
      purifierNegativeRisk: 0.01,
      ratingMutationUpChance: 0.25,
      ratingMutationDownChance: 0.10
    },
    animals: [
      {
        id: "wolf",
        name_ru: "Волк (Лесной / Снежный)",
        icon: "🐺",
        description: "Хищник. Передаёт мощные боевые черты: урон и шанс критического удара.",
        traits: [
          { id: "aggressive", name_ru: "Агрессивный", effect: "Урон боевого девианта +12%, крит +5%" },
          { id: "feral_instincts", name_ru: "Звериные инстинкты", effect: "Критический урон +20%" },
          { id: "swift", name_ru: "Быстроногий", effect: "Скорость перемещения +15%" }
        ]
      },
      {
        id: "bear",
        name_ru: "Медведь (Гризли / Полярный)",
        icon: "🐻",
        description: "Крупный зверь с колоссальной выносливостью. Источник защитных перков и переносимого веса.",
        traits: [
          { id: "thick_hide", name_ru: "Толстая шкура", effect: "Снижение входящего урона на 15%" },
          { id: "beast_of_burden", name_ru: "Вьючное животное", effect: "Макс. переносимый вес +8–15 кг" },
          { id: "iron_constitution", name_ru: "Железная конституция", effect: "Регенерация энергии +10%" }
        ]
      },
      {
        id: "boar",
        name_ru: "Дикий кабан",
        icon: "🐗",
        description: "Неприхотливый зверь. Идеален для усиления территориальных девиантов (сбор и раскопки).",
        traits: [
          { id: "forager", name_ru: "Природный собиратель", effect: "Эффективность добычи ресурсов на территории +15%" },
          { id: "toughness", name_ru: "Живучесть", effect: "Замедляет падение настроения на 30%" },
          { id: "mud_lover", name_ru: "Любитель грязи", effect: "Иммунитет к негативным факторам погоды" }
        ]
      },
      {
        id: "deer",
        name_ru: "Олень / Лань",
        icon: "🦌",
        description: "Мирное животное. Источник черт спокойствия, сохранения настроения и быстрой регенерации.",
        traits: [
          { id: "docile", name_ru: "Покладистый", effect: "Порог активности снижен, быстрее выходит на работу (+20%)" },
          { id: "cheer_up", name_ru: "Подбодрение", effect: "Максимальный запас настроения +30%" }
        ]
      },
      {
        id: "leopard",
        name_ru: "Леопард",
        icon: "🐆",
        description: "Стремительный хищник. Передаёт перки на урон по уязвимым местам и внезапные атаки.",
        traits: [
          { id: "weakspot_hunter", name_ru: "Охотник за уязвимостями", effect: "Урон девианта по слабым точкам боссов +25%" },
          { id: "adrenaline", name_ru: "Адреналин", effect: "При низком HP урон утраивается на 8 сек" }
        ]
      },
      {
        id: "crocodile",
        name_ru: "Крокодил",
        icon: "🐊",
        description: "Древний бронированный хищник. Дает колоссальные сопротивления стихиям.",
        traits: [
          { id: "armored_scales", name_ru: "Бронированная чешуя", effect: "Сопротивление всем видам стихийного урона +30%" },
          { id: "ambush", name_ru: "Засада", effect: "Первый удар из режима скрытности крит +50%" }
        ]
      }
    ],
    mutagens: [
      { id: "none", name_ru: "Без мутагена", icon: "⚪", effect: "Стандартное наследование без катализаторов." },
      { id: "species_grade_s", name_ru: "Мутаген вида: Ранг S", icon: "🧬", effect: "100% гарантия фиксации целевого вида девианта." },
      { id: "species_grade_a", name_ru: "Мутаген вида: Ранг A", icon: "🧪", effect: "85% шанс фиксации целевого вида девианта." },
      { id: "chaos_mutagen", name_ru: "Мутаген Хаоса", icon: "🌌", effect: "Шанс получить девиантов, не спавнящихся в сценарии!" },
      { id: "skill_mutagen", name_ru: "Мутаген навыка", icon: "⚡", effect: "Гарантирует дополнительную боевую технику 1-го уровня." },
      { id: "stabilizer", name_ru: "Стабилизатор мутаций", icon: "🔒", effect: "100% гарантия сохранения лучшего перка родителя." },
      { id: "purifier", name_ru: "Очищающий катализатор", icon: "✨", effect: "Снижает риск негативных дебаффов с 20% до 1%." }
    ],
    commonTraits: [
      { id: "t_aggro", name_ru: "Агрессивный", name_en: "Aggressive", kind: "positive", tier: "gold", effect: "Урон боевого девианта +12%" },
      { id: "t_cheer", name_ru: "Подбодрение", name_en: "Cheer Up", kind: "positive", tier: "gold", effect: "Максимальное настроение +30%" },
      { id: "t_burden", name_ru: "Вьючное животное", name_en: "Beast of Burden", kind: "positive", tier: "gold", effect: "Макс. переносимый вес игрока +8 кг" },
      { id: "t_moon", name_ru: "Хвала Луне - Звёздная ночь", name_en: "Praise the Moon - Starry Night", kind: "positive", tier: "gold", effect: "Ночью наносите на 6% больше урона" },
      { id: "t_workaholic", name_ru: "Трудоголик", name_en: "Workaholic", kind: "positive", tier: "purple", effect: "Скорость работы на территории +15%" },
      { id: "t_thick", name_ru: "Толстая шкура", name_en: "Thick Hide", kind: "positive", tier: "purple", effect: "Снижение входящего урона на 15%" },
      { id: "t_swift", name_ru: "Быстроногий", name_en: "Swift", kind: "positive", tier: "purple", effect: "Скорость перемещения +15%" },
      { id: "t_night_owl", name_ru: "Полуночник", name_en: "Night Owl", kind: "positive", tier: "blue", effect: "Ночью эффективность работы +20%" },
      { id: "t_sunbather", name_ru: "Любитель солнца", name_en: "Sunbather", kind: "positive", tier: "blue", effect: "В солнечную погоду настроение не падает" },
      { id: "t_feral", name_ru: "Звериные инстинкты", name_en: "Feral Instincts", kind: "positive", tier: "gold", effect: "Критический урон +20%" },
      { id: "t_sluggish", name_ru: "Медлительный", name_en: "Sluggish", kind: "negative", tier: "red", effect: "Скорость атак и работы снижена на 15%" },
      { id: "t_fragile", name_ru: "Хрупкий", name_en: "Fragile", kind: "negative", tier: "red", effect: "Максимальное здоровье девианта -25%" },
      { id: "t_gluttonous", name_ru: "Прожорливый", name_en: "Gluttonous", kind: "negative", tier: "red", effect: "Требует на 30% больше энергии для работы" },
      { id: "t_lazy", name_ru: "Лентяй", name_en: "Slacker", kind: "negative", tier: "red", effect: "Скорость работы и выработки ресурсов на базе снижена на 20%" },
      { id: "t_cowardly", name_ru: "Трусливый", name_en: "Cowardly", kind: "negative", tier: "red", effect: "Время перезарядки боевого навыка девианта увеличено на 25%" },
      { id: "t_defective", name_ru: "Брак мутации", name_en: "Defective Mutation", kind: "negative", tier: "red", effect: "Снижает базовые характеристики силы или активности на 1★" }
    ]
  };

  // Инициализация симулятора
  async function init(deviants) {
    state.deviantsList = deviants || [];
    try {
      const res = await fetch('data/fusion_data.json', { cache: 'no-cache' });
      if (res.ok) {
        state.fusionData = await res.json();
      } else {
        state.fusionData = FALLBACK_FUSION_DATA;
      }
    } catch (e) {
      console.warn('⚠️ Загрузка fusion_data.json через fetch не удалась, используем встроенные данные:', e);
      state.fusionData = FALLBACK_FUSION_DATA;
    }

    renderLabUI();
  }

  function onShow() {
    if (!document.getElementById('mergeScreen')) {
      renderLabUI();
    } else {
      updateCalculations();
    }
  }

  function getDeviantImg(d) {
    if (!d) return 'icons/icon.svg';
    if (d.id) return `images/${d.id}.webp`;
    return d.image || 'icons/icon.svg';
  }

  function getDeviant(id) {
    if (!id || id === 'none') return null;
    const dev = state.deviantsList.find(d => d.id === id);
    if (dev) {
      return {
        ...dev,
        image: getDeviantImg(dev)
      };
    }
    return null;
  }

  // Построение точного внутриигрового интерфейса Once Human «Merge»
  function renderLabUI() {
    const container = document.getElementById('labSection');
    if (!container) return;

    container.innerHTML = `
      <!-- ПОМЕТКА СИМУЛЯТОРА: ПРЕДУПРЕЖДЕНИЕ О ВЕРОЯТНОСТЯХ -->
      <div class="lab-disclaimer-banner">
        <div class="disclaimer-badge">
          <span class="disc-icon">⚠️</span>
          <span>ОБРАТИТЕ ВНИМАНИЕ: СИМУЛЯТОР ВЕРОЯТНОСТЕЙ</span>
        </div>
        <p class="disclaimer-text">
          Данный раздел является <strong>неофициальным симулятором</strong>. Все математические расчёты и шансы основаны на известных механиках игры и тестах сообщества, но носят <strong>исключительно ознакомительный характер</strong>, могут содержать погрешности и отличаться от реальной игры. Симулятор <strong>не даёт никаких гарантий</strong>, что в игре вам обязательно повезёт на аналогичные исходы.
        </p>
      </div>

      <div id="mergeScreen" class="merge-screen">
        
        <!-- ВЕРХНИЙ ХЕДЕР ИГРОВОГО ТЕРМИНАЛА -->
        <div class="merge-header">
          <div class="merge-brand">
            <h2 class="merge-title">СЛИЯНИЕ ДЕВИАНТОВ</h2>
            <div class="merge-subtitle">
              <span>Вероятность слияния в следующих девиантов</span>
            </div>
          </div>
          <div class="merge-quick-tools">
            <div class="merge-tool-item">
              <label for="labPresetSelect">⚡ Шаблон:</label>
              <select id="labPresetSelect" class="merge-select">
                <option value="empty" selected>-- Своя сборка (С нуля) --</option>
                <option value="vampire_lonewolf_55">🐺 5-5 Одинокий волк (1 донор + зверь + мутаген)</option>
                <option value="vampire_butterfly_55">🦋 5-5 Баттерфляй (1 донор + зверь + очиститель)</option>
                <option value="vampire_digby_55">⛏️ 5-5 Дигби (2 донора + стабилизатор)</option>
                <option value="vampire_donors_80">🧬 3 Донора (Макс. 80% на целевой вид)</option>
                <option value="vampire_pyramid_4in1">🧬 Селекция 4-в-1 (Пирамида поколений)</option>
              </select>
            </div>
            <div class="merge-tool-item">
              <label class="merge-instant-label">
                <input type="checkbox" id="labInstantToggle" ${state.instant ? 'checked' : ''}>
                <span>⚡ Мгновенно</span>
              </label>
            </div>
            <div class="merge-tool-item">
              <button type="button" id="labSoundToggle" class="merge-sound-toggle" title="Включить / отключить звуки">
                <span id="labSoundIcon">${state.sound ? '🔊' : '🔇'}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ОСНОВНАЯ ПАНОРАМНАЯ СЕТКА ИГРЫ (3 КОЛОНКИ: PREVIEW | DETAILS | APPARATUS) -->
        <div class="merge-main-grid">
          
          <!-- ЛЕВАЯ КОЛОНКА: PREVIEW СТОЛБЕЦ ПОТОМКОВ (КАК В ИГРЕ) -->
          <div class="merge-col-preview">
            <div class="preview-panel-header">
              <span class="preview-heading">Результаты слияния</span>
            </div>
            <div class="preview-table-header">
              <span class="th-dev">Девиант</span>
              <span class="th-traits"></span>
              <span class="th-rate">Шанс</span>
            </div>
            
            <div class="preview-cards-list" id="previewCardsList">
              <!-- Карточки генерируются динамически -->
            </div>
          </div>

          <!-- ЦЕНТРАЛЬНАЯ КОЛОНКА: ДЕТАЛЬНАЯ ИНСПЕКЦИЯ ЧЕРТ (КАК В ИГРЕ) -->
          <div class="merge-col-details" id="mergeInspectCol">
            <div class="inspect-card">
              <div class="inspect-title-row">
                <h3 class="inspect-name" id="inspectDeviantName">| Ожидание выбора родителей</h3>
                <div class="inspect-chance" id="inspectDeviantChance">
                  Шанс получения <span class="cyan-val" id="inspectChanceVal">—</span>
                </div>
              </div>

              <div class="inspect-categories" id="inspectCategoriesList">
                <!-- Группы черт с бирюзовыми шкалами шансов -->
              </div>
            </div>
          </div>

          <!-- ПРАВАЯ КОЛОНКА: 3D-АППАРАТ КАПСУЛЫ СЛИЯНИЯ (FUSION POD APPARATUS) -->
          <div class="merge-col-apparatus">
            
            <div class="apparatus-stage">
              
              <!-- РОДИТЕЛЬ 1: ЛЕВАЯ ВОДЯНАЯ КАПСУЛА И КОЛБА -->
              <div class="pod-parent-node node-left" id="p1Node">
                <div class="bubble-capsule" id="p1Bubble" title="Нажмите, чтобы сменить девианта">
                  <div class="bubble-glow"></div>
                  <img src="" alt="" id="p1Avatar" class="bubble-avatar">
                  <div class="bubble-badge">Р1</div>
                </div>
                <div class="node-meta">
                  <div class="node-name" id="p1NodeName">Бабочка</div>
                  <div class="node-stat-bars" id="p1StatBars"></div>
                  <div class="node-actions">
                    <button type="button" class="btn-node-edit" id="p1ChangeBtn">⇄ Сменить</button>
                    <button type="button" class="btn-node-add" id="p1AddPerkBtn">+ Перк</button>
                  </div>
                  <div class="node-perks-chips" id="p1ChipsList"></div>
                </div>
                <div class="tube-connector tube-left"></div>
              </div>

              <!-- ЦЕНТРАЛЬНАЯ КАМЕРА FUSION MATERIALS -->
              <div class="pod-center-cylinder" id="podCenterCylinder">
                <div class="cylinder-cap cap-top">
                  <div class="cap-screws"></div>
                  <div class="piping-system"></div>
                </div>
                
                <div class="cylinder-glass">
                  <div class="glass-reflection"></div>
                  <div class="cylinder-fluid" id="cylinderFluid">
                    <div class="fluid-bubble b1"></div>
                    <div class="fluid-bubble b2"></div>
                    <div class="fluid-bubble b3"></div>
                  </div>

                  <div class="materials-band" id="materialsBand" title="Лимит камеры: максимум 3 материала суммарно (доноры + животное + мутаген)">
                    <span>Материалы слияния</span>
                    <span class="materials-counter-badge" id="materialsCounterBadge">0 / 3</span>
                  </div>

                  <!-- Внутренние плавающие слоты материалов -->
                  <div class="cylinder-slots">
                    
                    <!-- Слоты жертвенных девиантов-доноров (до 3 шт) -->
                    <div class="cylinder-donors-block">
                      <div class="cylinder-donors-title">
                        <span>Доноры генов (до 3)</span>
                        <span class="burn-badge">🔥 Сгорают</span>
                      </div>
                      <div class="cylinder-donors-row" id="cylinderDonorsRow">
                        <!-- Генерируется динамически -->
                      </div>
                    </div>

                    <!-- Слот скотоводства -->
                    <div class="cylinder-slot-pill" id="animalSlotPill" title="Нажмите для настройки животного">
                      <div class="pill-icon" id="animalPillIcon">🐺</div>
                      <div class="pill-text">
                        <div class="pill-label">СКОТОВОДСТВО (x10)</div>
                        <div class="pill-val" id="animalPillVal">Волк: Агрессивный</div>
                      </div>
                    </div>

                    <!-- Слот мутагена -->
                    <div class="cylinder-slot-pill" id="mutagenSlotPill" title="Нажмите для настройки мутагена">
                      <div class="pill-icon" id="mutagenPillIcon">✨</div>
                      <div class="pill-text">
                        <div class="pill-label">МУТАГЕН / КАТАЛИЗАТОР</div>
                        <div class="pill-val" id="mutagenPillVal">Очиститель (-дефекты)</div>
                      </div>
                    </div>

                  </div>
                </div>

                <div class="cylinder-cap cap-bottom">
                  <div class="cap-screws"></div>
                </div>
              </div>

              <!-- РОДИТЕЛЬ 2: ПРАВАЯ ВОДЯНАЯ КАПСУЛА И ВОРОНКА -->
              <div class="pod-parent-node node-right" id="p2Node">
                <div class="bubble-capsule" id="p2Bubble" title="Нажмите, чтобы сменить девианта">
                  <div class="bubble-glow"></div>
                  <img src="" alt="" id="p2Avatar" class="bubble-avatar">
                  <div class="bubble-badge">Р2</div>
                </div>
                <div class="node-meta">
                  <div class="node-name" id="p2NodeName">Одинокий волк</div>
                  <div class="node-stat-bars" id="p2StatBars"></div>
                  <div class="node-actions">
                    <button type="button" class="btn-node-edit" id="p2ChangeBtn">⇄ Сменить</button>
                    <button type="button" class="btn-node-add" id="p2AddPerkBtn">+ Перк</button>
                  </div>
                  <div class="node-perks-chips" id="p2ChipsList"></div>
                </div>
                <div class="tube-connector tube-right"></div>
              </div>

            </div>

            <!-- ПОДНОЖИЕ И КНОПКА ЗАПУСКА СЛИЯНИЯ В СТИЛЕ ИГРЫ -->
            <div class="apparatus-pedestal">
              <div class="pedestal-plate">
                <button id="beginFusionBtn" class="btn-begin-fusion" type="button">
                  <span class="btn-fusion-glare"></span>
                  <span class="btn-fusion-text">НАЧАТЬ СЛИЯНИЕ</span>
                </button>
              </div>

              <div class="pedestal-subrow">
                <button id="batch100Btn" class="btn-game-sub" type="button" title="Прогнать 100 виртуальных попыток по теории вероятностей">
                  🎲 Тест 100 попыток (Монте-Карло)
                </button>
                <button id="resetLabBtn" class="btn-game-sub" type="button" title="Сбросить билд к начальным настройкам">
                  ↺ Сбросить настройки
                </button>
              </div>
            </div>

          </div>

        </div>

        <!-- КАРТОЧКА РЕЗУЛЬТАТА СЛИЯНИЯ (REVEAL POPUP) -->
        <div class="merge-result-popup" id="mergeResultPopup" style="display:none;">
          <div class="result-backdrop" id="resultBackdrop"></div>
          <div class="result-dialog">
            <button class="result-close-btn" id="resultCloseBtn">×</button>
            <div id="resultDialogBody"></div>
          </div>
        </div>

        <!-- ИГРОВОЙ ДРОБЕР ВЫБОРА ДЕВИАНТА (IN-GAME DRAWER) -->
        <div class="merge-drawer-overlay" id="deviantDrawerOverlay" style="display:none;">
          <div class="merge-drawer-panel">
            <div class="drawer-header">
              <div class="drawer-title-wrap">
                <h3 class="drawer-title">Выбор девианта</h3>
                <span class="drawer-selected-type" id="drawerTargetLabel">Для Родителя 1</span>
              </div>
              <button class="drawer-close" id="drawerCloseBtn">×</button>
            </div>

            <!-- Вкладки категорий как в игре (бабочка, меч, дом, колба) -->
            <div class="drawer-categories-bar">
              <button class="drawer-cat-btn active" data-cat="all" title="Все девианты">🦋 Все</button>
              <button class="drawer-cat-btn" data-cat="combat" title="Боевые девианты">⚔️ Боевые</button>
              <button class="drawer-cat-btn" data-cat="territory" title="Территориальные">🏭 База</button>
              <button class="drawer-cat-btn" data-cat="crafting" title="Ремесленные девианты">🔨 Ремесленные</button>
            </div>

            <div class="drawer-search-wrap">
              <input type="text" id="drawerSearchInput" placeholder="Поиск девианта по имени или роли..." class="drawer-search-input">
            </div>

            <div class="drawer-grid" id="drawerGrid">
              <!-- Квадратные плитки девиантов в стиле инвентаря игры -->
            </div>

            <div class="drawer-footer">
              <div class="drawer-footer-count">Всего доступно: <strong id="drawerTotalCount">65</strong></div>
              <div class="drawer-footer-actions">
                <button class="btn-game-sub" id="drawerClearBtn" style="display:none; color:#ff9da4; border-color:rgba(230,80,90,0.5);" type="button">🗑️ Очистить слот</button>
                <button class="btn-drawer-confirm" id="drawerConfirmBtn" type="button">✔ Выбрать девианта</button>
              </div>
            </div>
          </div>
        </div>

        <!-- МОДАЛКА НАСТРОЙКИ СКОТОВОДСТВА И МУТАГЕНА -->
        <div class="modal" id="catalystModal">
          <div class="modal-content" style="max-width: 520px; background: rgba(9, 23, 31, 0.98); border: 1px solid #1a7a85;">
            <button class="modal-close" id="catalystModalClose">×</button>
            <h3 style="color:#24e5d6; font-family:'Cinzel', serif; margin-bottom:14px;" id="catalystModalTitle">
              Настройка катализатора
            </h3>
            <div id="catalystModalContent"></div>
          </div>
        </div>

        <!-- МОДАЛЬНОЕ ОКНО НАСТРОЙКИ ДЕВИАНТА-ДОНОРА -->
        <div class="modal" id="donorConfigModal">
          <div class="modal-content" style="max-width: 520px; background: rgba(9, 23, 31, 0.98); border: 1px solid #1a7a85;">
            <button class="modal-close" id="donorConfigModalClose">×</button>
            <div id="donorConfigModalBody"></div>
          </div>
        </div>

        <!-- МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ПЕРКА -->
        <div class="modal" id="perkSelectModal">
          <div class="modal-content" style="max-width: 540px; background: rgba(9, 23, 31, 0.98); border: 1px solid #1a7a85;">
            <button class="modal-close" id="perkModalClose">×</button>
            <h3 style="color:#24e5d6; margin-bottom:12px;" id="perkModalTitle">Выберите черту для добавления</h3>
            <input type="text" id="perkSearchInput" placeholder="Поиск перка..." class="merge-select" style="width:100%; margin-bottom:12px;">
            <div class="perk-modal-list" id="perkModalList"></div>
          </div>
        </div>

        <!-- МОДАЛЬНОЕ ОКНО СТАТИСТИКИ 100 ПОПЫТОК -->
        <div class="modal" id="batchModal">
          <div class="modal-content modal-wide" style="max-width: 680px; background: rgba(9, 23, 31, 0.98); border: 1px solid #1a7a85;">
            <button class="modal-close" id="batchModalClose">×</button>
            <div id="batchModalBody"></div>
          </div>
        </div>

        <!-- ВИДЕО-ГАЙД ПО СЛИЯНИЮ ДЕВИАНТОВ (1VAMPIRE) — скрыт для GitHub-релиза. Чтобы включить обратно, удалите style="display: none;" -->
        <div class="merge-video-section" style="display: none;">
          <div class="video-section-header">
            <div class="v-header-title">
              <span class="v-badge">▶ Видео-гайд</span>
              <h3 id="videoSectionTitle">Подробный разбор механики скрещивания девиантов (1vampire)</h3>
            </div>
            <a href="https://www.youtube.com/watch?v=krGj5SokgQk" target="_blank" rel="noopener noreferrer" class="btn-open-youtube" id="btnOpenYoutube" title="Открыть видео на YouTube в новой вкладке">
              <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span id="btnYoutubeLabel">Смотреть на YouTube</span>
            </a>
          </div>
          <div class="video-player-container">
            <iframe 
              id="fusionVideoIframe"
              src="https://www.youtube-nocookie.com/embed/krGj5SokgQk" 
              title="Разбор скрещивания девиантов Once Human (1vampire)" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin" 
              allowfullscreen 
              class="video-iframe">
            </iframe>
          </div>
        </div>

        <!-- БАЗА ЗНАНИЙ: РУКОВОДСТВО ПОД ТЕРМИНАЛОМ -->
        <div class="merge-guide-section">
          <div class="guide-title-row">
            <h3>🎓 База знаний: Руководство по выведению идеального девианта</h3>
          </div>
          
          <div class="guide-accordion">
            <details class="guide-item" open>
              <summary class="guide-summary">
                <span>🧬 1. Золотое правило «1/1» и сохранение редких девиантов</span>
              </summary>
              <div class="guide-content">
                <p>
                  Каждый девиант в Once Human имеет ровно <strong>1 попытку скрещивания</strong> (<code>Fusion Chance = 1</code>). После использования в капсуле слияния он остаётся у вас, но больше никогда не сможет выступать родителем.
                </p>
                <p>
                  <strong>Совет профессионала:</strong> Никогда не скрещивайте девианта с 1 редким перком со случайным мусорным девиантом. Сначала подберите ему пару с совместимыми чертами или подготовьте катализатор скотоводства, чтобы не потерять ценный ген!
                </p>
              </div>
            </details>

            <details class="guide-item">
              <summary class="guide-summary">
                <span>🐾 2. Как животные скотоводства дают множитель x10</span>
              </summary>
              <div class="guide-content">
                <p>
                  В системе ранчо Once Human дикие животные (волки, медведи, кабаны, крокодилы) приручаются с уникальными природными перками рангов S/A/B.
                </p>
                <p>
                  Помещая взрослое животное или полученную эссенцию в центральный слот материалов капсулы слияния, вы даёте девианту <strong>множитель x10 к шансу передачи этого перка</strong> (повышая вероятность до 95%).
                </p>
                <ul>
                  <li><strong>Волки / Леопарды:</strong> доноры для боевых девиантов (Агрессивный, Звериные инстинкты, Урон по уязвимостям).</li>
                  <li><strong>Медведи:</strong> доноры для выживания (Толстая шкура, Вьючное животное на переносимый вес).</li>
                  <li><strong>Кабаны / Олени:</strong> доноры для базы (Природный собиратель, Покладистый, Подбодрение).</li>
                </ul>
              </div>
            </details>

            <details class="guide-item">
              <summary class="guide-summary">
                <span>📐 3. Стратегия «Пирамиды поколений» (Селекция 4 в 1)</span>
              </summary>
              <div class="guide-content">
                <p>
                  Чтобы получить девианта с 4–5 золотыми чертами (God-Roll), игроки используют селекционную лестницу:
                </p>
                <ol>
                  <li><strong>Поколение 1:</strong> Скрещиваем Девианта A (перк 1) + Девианта B (перк 2) ➔ получаем Потомка AB (перки 1 + 2).</li>
                  <li>Параллельно: Скрещиваем Девианта C (перк 3) + Девианта D (перк 4) ➔ получаем Потомка CD (перки 3 + 4).</li>
                  <li><strong>Поколение 2:</strong> Скрещиваем Потомка AB + Потомка CD с Очищающим мутагеном ➔ получаем идеального <strong>God-Roll девианта ABCD</strong>!</li>
                </ol>
                <p>
                  В нашем симуляторе используйте кнопку <strong>«🧬 Сделать потомка Родителем 1»</strong>, чтобы шаг за шагом смоделировать этот процесс!
                </p>
              </div>
            </details>

            <details class="guide-item">
              <summary class="guide-summary">
                <span>🧪 4. Мутагены и защита от брака (красных дебаффов)</span>
              </summary>
              <div class="guide-content">
                <p>
                  При скрещивании без защиты всегда есть базовый <strong>20% риск случайной мутации</strong>, которая может добавить девианту красный перк (например, <em>«Медлительный»</em> -15% скорости, или <em>«Хрупкий»</em> -25% здоровья).
                </p>
                <p>
                  Использование <strong>Очищающего катализатора (Purifier)</strong> снижает этот риск до 1%, защищая вашего финального питомца от брака.
                </p>
              </div>
            </details>

            <details class="guide-item">
              <summary class="guide-summary">
                <span>🔨 5. Рецепты крафта Fusion Pod и мутагенов на Большом Верстаке Синтеза</span>
              </summary>
              <div class="guide-content">
                <p><strong>Постройка Капсулы Слияния (Fusion Pod):</strong></p>
                <ul>
                  <li><strong>Обычные сценарии (Manibus, Way of Winter и др.):</strong> <code>10x Металлический лом</code>, <code>20x Бронзовый слиток</code>, <code>20x Стекло</code>, <code>3x Резина</code>.</li>
                  <li><strong>SCP сценарий (Survive, Capture, Preserve):</strong> <code>20x Легированная сталь</code>, <code>20x Детали</code>, <code>20x Стекло</code>, <code>3x Резина</code>.</li>
                  <li><em>Разблокировка:</em> Меморикс в Cradle (Crafting ➔ 05 Enlightenment за 7 Cipher и 2000 Energy Links), либо утилизация капсулы в поселениях через Recycling Tool.</li>
                </ul>
                <p><strong>Крафт мутагенов на Большом Верстаке Синтеза (Large Synthesis Bench):</strong></p>
                <ul>
                  <li><strong>Chaos Mutagen:</strong> 1x Chaos Code, 10x Золотая руда, 150x Источник звёздной пыли, 10x Резина.</li>
                  <li><strong>Grade S Species Mutagen:</strong> 1x Species Code, 20x Серебряная руда, 100x Источник звёздной пыли, 10x Резина.</li>
                  <li><strong>Grade A Species Mutagen:</strong> 1x Species Code, 20x Стальной слиток, 50x Источник звёздной пыли, 10x Резина.</li>
                  <li><strong>Коды видов (Species Codes):</strong> добываются в боях с дикими девиантами, в магазине арены (Arena Shop в SCP) и обменом между игроками.</li>
                </ul>
              </div>
            </details>

            <details class="guide-item">
              <summary class="guide-summary">
                <span>⚖️ 6. Лимит 3 материалов: почему нельзя взять всё сразу (Гайд 1vampire)</span>
              </summary>
              <div class="guide-content">
                <p>
                  В капсуле слияния Once Human центральная камера (<em>Fusion Materials</em>) имеет жёсткий лимит: <strong>максимум 3 предмета суммарно</strong> (<code>Selected type: 3/3</code>).
                </p>
                <p>
                  Этот лимит делят между собой <strong>жертвенные доноры</strong>, <strong>животные скотоводства</strong> и <strong>мутагены</strong>. Добавить 3 донора, животное и мутаген одновременно физически невозможно — это было бы 5 предметов! В игре вы обязаны выбрать стратегию:
                </p>
                <ul>
                  <li><strong>3 Донора (3/3):</strong> Максимальный шанс сохранения целевого вида (80.0%) и наибольший бонус к роллу характеристик 5/5. Скотоводство и мутагены при этом не используются.</li>
                  <li><strong>2 Донора + 1 Мутаген (3/3):</strong> Высокий шанс вида (75.0%) плюс эффект мутагена (например, 100% гарантия фиксации вида ранга S, стабилизатор перка или очиститель от дефектов).</li>
                  <li><strong>1 Донор + 1 Животное + 1 Мутаген (3/3):</strong> Сбалансированный селекционный билд: 66.7% шанс вида + буст x10 природной черты животного фермы + защита мутагеном.</li>
                  <li><strong>2 Донора + 1 Животное (3/3):</strong> 75.0% шанс вида + буст черты скотоводства.</li>
                </ul>
                <p>
                  <strong>Совет от 1vampire:</strong> Если ваша цель — гарантированно не потерять редкий вид девианта, используйте 3 одинаковых донора (80%) либо Мутаген вида ранга S (100%). Если цель — привить мощный звериный крит или урон, выделите 1 слот под животное!
                </p>
              </div>
            </details>
          </div>
        </div>

      </div>
    `;

    bindMergeEvents();
    renderApparatusNodes();
    updateCalculations();
  }

  // Подсчёт активных материалов в центральной колбе (максимум 3)
  function getActiveMaterialsCount() {
    const activeDonors = state.donors.filter(Boolean).length;
    const hasAnimal = (state.animalId && state.animalId !== 'none') ? 1 : 0;
    const hasMutagen = (state.mutagenId && state.mutagenId !== 'none') ? 1 : 0;
    return activeDonors + hasAnimal + hasMutagen;
  }

  // Отрисовка левой и правой колбы родителей
  function renderApparatusNodes() {
    ['p1', 'p2'].forEach(key => {
      const p = state[key];
      const dev = getDeviant(p.id);

      const bubbleEl = document.getElementById(`${key}Bubble`);
      const avatarEl = document.getElementById(`${key}Avatar`);
      const nameEl = document.getElementById(`${key}NodeName`);
      const statBarsEl = document.getElementById(`${key}StatBars`);
      const chipsEl = document.getElementById(`${key}ChipsList`);
      const changeBtn = document.getElementById(`${key}ChangeBtn`);

      if (!dev) {
        if (bubbleEl) bubbleEl.classList.add('bubble-empty');
        if (avatarEl) {
          avatarEl.src = 'icons/icon.svg';
          avatarEl.style.opacity = '0.35';
        }
        if (nameEl) nameEl.innerHTML = `<span style="color:#5c7c8a; font-size:13px; font-weight:600;">${key === 'p1' ? 'Родитель 1 не выбран' : 'Родитель 2 не выбран'}</span>`;
        if (changeBtn) changeBtn.textContent = '+ Выбрать';
        if (statBarsEl) {
          statBarsEl.innerHTML = `
            <div style="font-size:11px; color:#5c7c8a; text-align:center; padding:12px 0; line-height:1.4;">
              Нажмите «+ Выбрать», чтобы назначить девианта
            </div>
          `;
        }
        if (chipsEl) {
          chipsEl.innerHTML = `<span class="empty-chips">Слот пуст</span>`;
        }
        return;
      }

      if (bubbleEl) bubbleEl.classList.remove('bubble-empty');
      if (changeBtn) changeBtn.textContent = '⇄ Сменить';
      if (avatarEl) {
        avatarEl.src = dev.image;
        avatarEl.style.opacity = '1';
      }
      if (nameEl) nameEl.textContent = dev.name_ru;
      if (statBarsEl) {
        statBarsEl.innerHTML = `
          <div class="star-rating-line" title="Уровень силы девианта (1-5★). Кликните по звезде для изменения">
            <span class="stat-prefix">Сила:</span>
            <span class="stars-picker" data-parent="${key}" data-stat="rating">
              ${[1, 2, 3, 4, 5].map(s => `<span class="star-item ${s <= p.rating ? 'active' : ''}" data-val="${s}">★</span>`).join('')}
            </span>
            <span class="stat-num">${p.rating}/5</span>
          </div>
          <div class="star-rating-line" title="Активность / Энергия девианта (1-5★). Кликните по звезде для изменения">
            <span class="stat-prefix">Энергия:</span>
            <span class="stars-picker" data-parent="${key}" data-stat="activity">
              ${[1, 2, 3, 4, 5].map(s => `<span class="star-item ${s <= p.activity ? 'active' : ''}" data-val="${s}">★</span>`).join('')}
            </span>
            <span class="stat-num">${p.activity}/5</span>
          </div>
          <div class="node-fusion-chance" title="В Once Human у каждого пойманного девианта ровно 1 попытка слияния">
            <span class="chance-pill">Попытка: 1/1</span>
          </div>
        `;
      }

      if (chipsEl) {
        if (!p.perks || p.perks.length === 0) {
          chipsEl.innerHTML = `<span class="empty-chips">Без перков</span>`;
        } else {
          chipsEl.innerHTML = p.perks.map((perk, idx) => `
            <span class="node-perk-tag">
              ${escapeHtml(perk)}
              <b class="tag-del" data-parent="${key}" data-index="${idx}">×</b>
            </span>
          `).join('');
        }
      }
    });

    const activeMaterialsCount = getActiveMaterialsCount();
    const isMaterialsFull = activeMaterialsCount >= 3;

    // Обновляем бейдж счётчика материалов слияния в центральной колбе
    const counterBadge = document.getElementById('materialsCounterBadge');
    if (counterBadge) {
      if (isMaterialsFull) {
        counterBadge.classList.add('is-full');
        counterBadge.textContent = '3 / 3 МАКС.';
      } else {
        counterBadge.classList.remove('is-full');
        counterBadge.textContent = `${activeMaterialsCount} / 3`;
      }
    }

    // Обновляем плавающие слоты материалов в центральной колбе
    const animalPill = document.getElementById('animalSlotPill');
    const aPillVal = document.getElementById('animalPillVal');
    const aPillIcon = document.getElementById('animalPillIcon');
    if (animalPill && aPillVal && aPillIcon) {
      const oldRem = animalPill.querySelector('.pill-remove-btn');
      if (oldRem) oldRem.remove();

      if (state.animalId === 'none') {
        animalPill.classList.remove('is-active');
        if (isMaterialsFull) {
          animalPill.classList.add('locked');
          animalPill.title = 'Камера материалов заполнена (3/3). Удалите одного из доноров или мутаген.';
          aPillIcon.textContent = '🔒';
          aPillVal.textContent = 'Лимит 3/3 (заблокировано)';
        } else {
          animalPill.classList.remove('locked');
          animalPill.title = 'Нажмите для настройки животного (Скотоводство x10)';
          aPillIcon.textContent = '⚪';
          aPillVal.textContent = '+ Выбрать животное';
        }
      } else {
        animalPill.classList.remove('locked');
        animalPill.classList.add('is-active');
        animalPill.title = 'Животное активно. Кликните для настройки или нажмите × для удаления';
        const animal = state.fusionData?.animals?.find(a => a.id === state.animalId);
        const trait = animal?.traits?.find(t => t.id === state.animalTraitId);
        aPillIcon.textContent = animal?.icon || '🐾';
        aPillVal.textContent = `${animal?.name_ru.split(' ')[0]}: ${trait?.name_ru || 'Черта'}`;

        const remBtn = document.createElement('button');
        remBtn.type = 'button';
        remBtn.className = 'pill-remove-btn';
        remBtn.title = 'Убрать животное (освободить 1 слот)';
        remBtn.textContent = '×';
        remBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.animalId = 'none';
          state.animalTraitId = 'none';
          SoundFX.playClick();
          renderApparatusNodes();
          updateCalculations();
        });
        animalPill.appendChild(remBtn);
      }
    }

    // Обновляем слоты девиантов-доноров в центральной колбе
    const donorsRow = document.getElementById('cylinderDonorsRow');
    if (donorsRow) {
      const allTraits = state.fusionData?.commonTraits || FALLBACK_FUSION_DATA.commonTraits;
      donorsRow.innerHTML = [0, 1, 2].map(idx => {
        const d = state.donors[idx];
        if (d) {
          const perks = d.perks || [];
          const hasNeg = perks.some(p => {
            const t = allTraits.find(x => x.name_ru === p);
            return t?.kind === 'negative';
          });
          const perksText = perks.length > 0 ? perks.join(', ') : 'Без перков';
          return `
            <div class="donor-slot filled" data-slot="${idx}" title="Донор ${idx + 1}: ${escapeHtml(d.name_ru)} (★${d.rating || 4}). Черты: ${escapeHtml(perksText)}. Кликните для настройки перков">
              <button type="button" class="donor-slot-remove" data-slot="${idx}" title="Удалить донора (освободить 1 слот)">×</button>
              <img src="${getDeviantImg(d)}" class="donor-slot-img" alt="${escapeHtml(d.name_ru)}" onerror="this.onerror=null;this.src='icons/icon.svg';">
              <span class="donor-slot-name">${escapeHtml(d.name_ru)} <span class="donor-star-badge">★${d.rating || 4}</span></span>
              <span class="donor-slot-perkcount ${hasNeg ? 'has-defect' : ''}">
                ${hasNeg ? '⚠️ ' : '⚡ '}${perks.length > 0 ? `${perks.length} черт${perks.length === 1 ? 'а' : 'ы'}` : '+ черта'}
              </span>
            </div>
          `;
        } else if (isMaterialsFull) {
          return `
            <div class="donor-slot locked" data-slot="${idx}" title="Камера материалов заполнена (3/3). Удалите животное, мутаген или другого донора, чтобы добавить девианта">
              <div class="donor-empty-icon">🔒</div>
              <span class="donor-empty-label">Лимит 3/3</span>
            </div>
          `;
        } else {
          return `
            <div class="donor-slot empty" data-slot="${idx}" title="Нажмите, чтобы добавить девианта-донора №${idx + 1}">
              <div class="donor-empty-icon">+</div>
              <span class="donor-empty-label">Донор ${idx + 1}</span>
            </div>
          `;
        }
      }).join('');

      // Привязка событий клика на слоты доноров
      donorsRow.querySelectorAll('.donor-slot').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.classList.contains('donor-slot-remove')) return;
          const slot = parseInt(el.dataset.slot, 10);
          if (state.donors[slot]) {
            openDonorConfigModal(slot);
          } else if (el.classList.contains('locked')) {
            alert('Камера материалов заполнена (3/3). В Once Human в центральный отсек помещается не более 3 предметов суммарно. Удалите животное, мутаген или другого донора, чтобы освободить слот.');
            SoundFX.playClick();
          } else {
            openDeviantDrawer('donor' + slot);
          }
        });
      });

      donorsRow.querySelectorAll('.donor-slot-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const slot = parseInt(btn.dataset.slot, 10);
          state.donors[slot] = null;
          SoundFX.playClick();
          renderApparatusNodes();
          updateCalculations();
        });
      });
    }

    const mutagenPill = document.getElementById('mutagenSlotPill');
    const mPillVal = document.getElementById('mutagenPillVal');
    const mPillIcon = document.getElementById('mutagenPillIcon');
    if (mutagenPill && mPillVal && mPillIcon) {
      const oldRem = mutagenPill.querySelector('.pill-remove-btn');
      if (oldRem) oldRem.remove();

      if (state.mutagenId === 'none') {
        mutagenPill.classList.remove('is-active');
        if (isMaterialsFull) {
          mutagenPill.classList.add('locked');
          mutagenPill.title = 'Камера материалов заполнена (3/3). Удалите одного из доноров или животное.';
          mPillIcon.textContent = '🔒';
          mPillVal.textContent = 'Лимит 3/3 (заблокировано)';
        } else {
          mutagenPill.classList.remove('locked');
          mutagenPill.title = 'Нажмите для настройки мутагена / катализатора';
          mPillIcon.textContent = '⚪';
          mPillVal.textContent = '+ Выбрать мутаген';
        }
      } else {
        mutagenPill.classList.remove('locked');
        mutagenPill.classList.add('is-active');
        mutagenPill.title = 'Мутаген активен. Кликните для настройки или нажмите × для удаления';
        const mutagen = state.fusionData?.mutagens?.find(m => m.id === state.mutagenId);
        mPillIcon.textContent = mutagen?.icon || '🧪';
        mPillVal.textContent = mutagen?.name_ru || 'Мутаген';

        const remBtn = document.createElement('button');
        remBtn.type = 'button';
        remBtn.className = 'pill-remove-btn';
        remBtn.title = 'Убрать мутаген (освободить 1 слот)';
        remBtn.textContent = '×';
        remBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.mutagenId = 'none';
          SoundFX.playClick();
          renderApparatusNodes();
          updateCalculations();
        });
        mutagenPill.appendChild(remBtn);
      }
    }
  }

  // Расчёт вероятностей в реальном времени
  function calculateChances() {
    const mechanics = state.fusionData?.mechanics || FALLBACK_FUSION_DATA.mechanics;
    
    // Собираем девиантов-доноров
    const activeDonors = state.donors.filter(Boolean);
    const donorPerkCounts = {};
    activeDonors.forEach(d => {
      (d.perks || []).forEach(perk => {
        donorPerkCounts[perk] = (donorPerkCounts[perk] || 0) + 1;
      });
    });

    const allPerks = new Set([
      ...state.p1.perks,
      ...state.p2.perks,
      ...Object.keys(donorPerkCounts)
    ]);
    
    // Определим имя черты животного для совпадения
    let boostedPerkName = null;
    if (state.animalId !== 'none' && state.animalTraitId !== 'none') {
      const animal = state.fusionData?.animals?.find(a => a.id === state.animalId);
      const trait = animal?.traits?.find(t => t.id === state.animalTraitId);
      if (trait) boostedPerkName = trait.name_ru.toLowerCase();
    }

    const perkProbabilities = [];
    let stabilizerUsed = false;

    allPerks.forEach(perk => {
      const inP1 = state.p1.perks.includes(perk);
      const inP2 = state.p2.perks.includes(perk);
      const donorHits = donorPerkCounts[perk] || 0;
      
      let baseChance = 0.25;
      let sourceCategory = 'general'; // 'general' | 'donor'

      if (inP1 && inP2) {
        baseChance = mechanics.baseInheritBothParents; // 0.75
        sourceCategory = 'general';
      } else if ((inP1 || inP2) && donorHits > 0) {
        baseChance = mechanics.parentAndDonorSynergy || 0.65; // 0.65
        sourceCategory = 'general';
      } else if (inP1 || inP2) {
        baseChance = mechanics.baseInheritOneParent; // 0.35
        sourceCategory = 'general';
      } else {
        sourceCategory = 'donor';
        if (donorHits === 1) baseChance = mechanics.donorInheritOne || 0.25;
        else if (donorHits === 2) baseChance = mechanics.donorInheritTwo || 0.45;
        else baseChance = mechanics.donorInheritThree || 0.60;
      }

      let isBoostedByAnimal = false;
      if (boostedPerkName && (perk.toLowerCase().includes(boostedPerkName) || boostedPerkName.includes(perk.toLowerCase()))) {
        baseChance = Math.min(mechanics.animalDonorMaxCap, baseChance * mechanics.animalDonorMultiplier);
        isBoostedByAnimal = true;
      }

      let isStabilized = false;
      if (state.mutagenId === 'stabilizer' && (inP1 || inP2) && !stabilizerUsed) {
        baseChance = 1.0;
        isStabilized = true;
        stabilizerUsed = true;
      }

      const allTraits = state.fusionData?.commonTraits || FALLBACK_FUSION_DATA.commonTraits;
      const traitDef = allTraits.find(t => t.name_ru === perk);
      const kind = traitDef?.kind || 'positive';
      const effect = traitDef?.effect || '';

      if (kind === 'negative' && state.mutagenId === 'purifier') {
        baseChance = 0.01;
      }

      perkProbabilities.push({
        name: perk,
        kind,
        effect,
        inP1,
        inP2,
        donorHits,
        sourceCategory,
        chance: baseChance,
        percentage: Math.round(baseChance * 100),
        isBoostedByAnimal,
        isStabilized
      });
    });

    // Риск негативной мутации
    const negativeRisk = (state.mutagenId === 'purifier')
      ? mechanics.purifierNegativeRisk
      : mechanics.baseNegativeRisk;

    // Влияние высокоуровневых доноров на рейтинг (до 3 слотов)
    const highTierDonors = activeDonors.filter(d => (d.rating || 0) >= 4).length;
    const donorRatingBonus = highTierDonors * (mechanics.donorRatingBonusPerHighTier || 0.05);

    // Средние показатели родителей
    const avgRating = (state.p1.rating + state.p2.rating) / 2;
    const avgActivity = (state.p1.activity + state.p2.activity) / 2;

    // Расчет шансов на получение 5★ (по механике Once Human и гайду 1vampire)
    const bonusSkillMut = (state.mutagenId === 'skill_mutagen') ? 25 : 0;
    const bonusDonorPct = Math.round(donorRatingBonus * 100);

    let rating5Chance = 2;
    if (avgRating >= 5.0) rating5Chance = Math.min(95, 88 + bonusDonorPct);
    else if (avgRating >= 4.5) rating5Chance = Math.min(90, 50 + bonusDonorPct + bonusSkillMut);
    else if (avgRating >= 4.0) rating5Chance = Math.min(75, 25 + bonusDonorPct + bonusSkillMut);
    else if (avgRating >= 3.5) rating5Chance = Math.min(50, 10 + bonusDonorPct + bonusSkillMut);

    let activity5Chance = 2;
    if (avgActivity >= 5.0) activity5Chance = Math.min(95, 88 + bonusDonorPct);
    else if (avgActivity >= 4.5) activity5Chance = Math.min(90, 50 + bonusDonorPct);
    else if (avgActivity >= 4.0) activity5Chance = Math.min(75, 25 + bonusDonorPct);
    else if (avgActivity >= 3.5) activity5Chance = Math.min(50, 10 + bonusDonorPct);

    // Прогноз рейтинга
    const expectedRating = state.mutagenId === 'skill_mutagen'
      ? Math.min(5, Number((avgRating + 0.6 + donorRatingBonus).toFixed(1)))
      : Math.min(5, Number((avgRating + donorRatingBonus).toFixed(1)));
    const expectedActivity = Math.min(5, Number((avgActivity + donorRatingBonus * 0.5).toFixed(1)));

    // Шанс получить God-Roll 5-5 без негативных мутаций
    const godRoll55Chance = Math.max(1, Math.min(95, Math.round((rating5Chance / 100) * (activity5Chance / 100) * (1 - negativeRisk) * 100)));

    // Подсчет девиантов-доноров, совпадающих по виду с Родителями
    const p1MatchingDonors = (state.p1.id && activeDonors.length > 0) ? activeDonors.filter(d => d.id === state.p1.id).length : 0;
    const p2MatchingDonors = (state.p2.id && activeDonors.length > 0) ? activeDonors.filter(d => d.id === state.p2.id).length : 0;

    // Шанс выпадения конкретного вида девианта (по весовой формуле Once Human и гайду 1vampire)
    // Каждый родитель имеет базовый вес 1. Каждый однотипный донор добавляет +1 вес:
    // 0 доноров: 1 / (1 + 1) = 50.0%
    // 1 донор:   2 / (2 + 1) = 66.7%
    // 2 донора:  3 / (3 + 1) = 75.0%
    // 3 донора:  4 / (4 + 1) = 80.0%
    let p1DropRate = 50.0;
    let p2DropRate = 50.0;

    if (!state.p1.id && !state.p2.id) {
      p1DropRate = 0.0;
      p2DropRate = 0.0;
    } else if (state.p1.id && !state.p2.id) {
      p1DropRate = 100.0;
      p2DropRate = 0.0;
    } else if (!state.p1.id && state.p2.id) {
      p1DropRate = 0.0;
      p2DropRate = 100.0;
    } else if (state.p1.id === state.p2.id) {
      p1DropRate = 100.0;
      p2DropRate = 100.0;
    } else if (state.mutagenId === 'species_grade_s') {
      p1DropRate = 100.0;
      p2DropRate = 0.0;
    } else {
      const weight1 = 1 + p1MatchingDonors;
      const weight2 = 1 + p2MatchingDonors;
      const totalWeight = weight1 + weight2;
      let calculatedRate = Number(((weight1 / totalWeight) * 100).toFixed(1));

      if (state.mutagenId === 'species_grade_a') {
        calculatedRate = Math.max(85.0, calculatedRate);
      }
      p1DropRate = calculatedRate;
      p2DropRate = Number((100.0 - p1DropRate).toFixed(1));
    }

    return {
      perkProbabilities,
      negativeRisk: Math.round(negativeRisk * 100),
      expectedRating,
      expectedActivity,
      rating5Chance,
      activity5Chance,
      godRoll55Chance,
      highTierDonors,
      donorBonusPct: Math.round(donorRatingBonus * 100),
      p1MatchingDonors,
      p2MatchingDonors,
      p1DropRate,
      p2DropRate,
      activeDonorsCount: activeDonors.length
    };
  }

  // Обновление левой колонки (Preview Cards) и центральной (Inspect Details)
  function updateCalculations() {
    const calc = calculateChances();
    renderApparatusNodes();
    renderPreviewCards(calc);
    renderInspectDetails(calc);
  }

  // Отрисовка левой таблицы карточек возможных потомков (как в игре)
  function renderPreviewCards(calc) {
    const listEl = document.getElementById('previewCardsList');
    if (!listEl) return;

    if (!state.p1.id && !state.p2.id) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:32px 14px; color:#5c7c8a;">
          <div style="font-size:26px; margin-bottom:8px; opacity:0.6;">🧬</div>
          <div style="font-size:13px; font-weight:600; color:#8ea4af; margin-bottom:4px;">Слоты родителей пусты</div>
          <div style="font-size:11px; line-height:1.4;">Выберите девиантов в колбах аппарата справа для расчёта исходов слияния</div>
        </div>
      `;
      return;
    }

    const dev1 = getDeviant(state.p1.id);
    const dev2 = getDeviant(state.p2.id);

    // Собираем краткий список наследуемых черт
    const topTraitsP1 = state.p1.perks.slice(0, 3).join(', ') || 'Стандартные черты';
    const topTraitsP2 = state.p2.perks.slice(0, 3).join(', ') || 'Стандартные черты';

    const card1Active = state.selectedInspectOutcome === 'p1';
    const card2Active = state.selectedInspectOutcome === 'p2';

    const p1Gain = Number((calc.p1DropRate - 50.0).toFixed(1));
    const p2Gain = Number((calc.p2DropRate - 50.0).toFixed(1));

    let html = '';

    if (dev1) {
      html += `
        <div class="preview-card ${card1Active ? 'active' : ''}" data-outcome="p1">
          <div class="pcard-avatar-wrap">
            <img src="${dev1.image}" alt="${dev1.name_ru}" class="pcard-avatar" onerror="this.src='icons/icon.svg';">
          </div>
          <div class="pcard-info">
            <div class="pcard-name">${dev1.name_ru}</div>
            <div class="pcard-traits">${escapeHtml(topTraitsP1)}</div>
            ${calc.p1MatchingDonors > 0 && p1Gain > 0 ? `<div class="pcard-donor-tag">🧬 +${p1Gain}% от доноров (${calc.p1MatchingDonors} шт)</div>` : ''}
          </div>
          <div class="pcard-rate">${calc.p1DropRate.toFixed(1)}%</div>
        </div>
      `;
    }

    // Если родители разные и dev2 задан — показываем вторую карточку исхода
    if (dev2 && state.p1.id !== state.p2.id) {
      html += `
        <div class="preview-card ${card2Active ? 'active' : ''}" data-outcome="p2">
          <div class="pcard-avatar-wrap">
            <img src="${dev2.image}" alt="${dev2.name_ru}" class="pcard-avatar" onerror="this.src='icons/icon.svg';">
          </div>
          <div class="pcard-info">
            <div class="pcard-name">${dev2.name_ru}</div>
            <div class="pcard-traits">${escapeHtml(topTraitsP2)}</div>
            ${calc.p2MatchingDonors > 0 && p2Gain > 0 ? `<div class="pcard-donor-tag">🧬 +${p2Gain}% от доноров (${calc.p2MatchingDonors} шт)</div>` : ''}
          </div>
          <div class="pcard-rate">${calc.p2DropRate.toFixed(1)}%</div>
        </div>
      `;
    }

    listEl.innerHTML = html;
  }

  // Отрисовка центральной карточки инспекции черт (с бирюзовыми шкалами из игры)
  function renderInspectDetails(calc) {
    const inspectedKey = state.selectedInspectOutcome;
    let dev = getDeviant(state[inspectedKey]?.id);

    // Если у выбранного исхода нет девианта, но есть у другого родителя
    if (!dev) {
      const altKey = inspectedKey === 'p1' ? 'p2' : 'p1';
      if (state[altKey]?.id) {
        state.selectedInspectOutcome = altKey;
        dev = getDeviant(state[altKey].id);
      }
    }

    const nameEl = document.getElementById('inspectDeviantName');
    const chanceEl = document.getElementById('inspectDeviantChance');
    const catListEl = document.getElementById('inspectCategoriesList');

    if (!dev) {
      if (nameEl) nameEl.textContent = '| Ожидание выбора родителей';
      if (chanceEl) chanceEl.innerHTML = 'Шанс получения <span class="cyan-val">—</span>';
      if (catListEl) {
        catListEl.innerHTML = `
          <div style="text-align:center; padding:40px 20px; color:#5c7c8a;">
            <div style="font-size:32px; margin-bottom:10px; opacity:0.5;">🔬</div>
            <div style="font-size:14px; font-weight:600; color:#8ea4af; margin-bottom:6px;">Капсула слияния не загружена</div>
            <div style="font-size:12px; color:#4a6875; max-width:320px; margin:0 auto; line-height:1.4;">
              Выберите Родителя 1 и Родителя 2 в аппарате справа, добавьте доноров или катализаторы, чтобы увидеть детальный анализ наследования черт.
            </div>
          </div>
        `;
      }
      return;
    }

    const currentInspectKey = state.selectedInspectOutcome;
    const dropRate = (currentInspectKey === 'p1' ? calc.p1DropRate : calc.p2DropRate);
    const matchingDonors = (currentInspectKey === 'p1' ? calc.p1MatchingDonors : calc.p2MatchingDonors);
    const gain = Number((dropRate - 50.0).toFixed(1));

    if (nameEl) nameEl.textContent = `| ${dev.name_ru}`;
    if (chanceEl) {
      chanceEl.innerHTML = `Шанс получения <span class="cyan-val" id="inspectChanceVal">${dropRate.toFixed(1)}%</span>${matchingDonors > 0 && gain > 0 ? ` <span class="inspect-donor-pill" title="Увеличение шанса от доноров того же вида">🧬 +${gain}% (${matchingDonors} донор${matchingDonors === 1 ? '' : 'а'})</span>` : ''}`;
    }

    if (!catListEl) return;

    // Группируем черты по категориям: General, Sacrifice Donors, Livestock Boost
    const generalPerks = calc.perkProbabilities.filter(p => p.sourceCategory === 'general' && !p.isBoostedByAnimal);
    const donorPerks = calc.perkProbabilities.filter(p => p.sourceCategory === 'donor' && !p.isBoostedByAnimal);
    const animalPerks = calc.perkProbabilities.filter(p => p.isBoostedByAnimal);

    let html = '';

    // Блок прогноза характеристик и шанса 5-5 (как в гайде 1vampire)
    html += `
      <div class="inspect-rating-forecast">
        <div class="forecast-title">
          <span>Прогноз характеристик и 5-5</span>
          <span style="color:#ffd700; font-weight:700; font-size:12px;">★ 5-5</span>
        </div>
        <div class="forecast-bars">
          <div class="forecast-item">
            <span class="forecast-stat-label">Сила (Skill Rating):</span>
            <div class="forecast-values">
              <strong class="cyan-val">★ ${calc.expectedRating} / 5</strong>
              <span class="stat-chance-badge" title="Вероятность получить 5★ силы">${calc.rating5Chance}% шанс 5★</span>
            </div>
          </div>
          <div class="forecast-item">
            <span class="forecast-stat-label">Энергия (Activity):</span>
            <div class="forecast-values">
              <strong class="cyan-val">★ ${calc.expectedActivity} / 5</strong>
              <span class="stat-chance-badge" title="Вероятность получить 5★ активности">${calc.activity5Chance}% шанс 5★</span>
            </div>
          </div>
        </div>
        <div class="forecast-godroll">
          <span class="godroll-text">🏆 Идеал 5-5 (God-Roll):</span>
          <span class="godroll-val">${calc.godRoll55Chance}%</span>
        </div>
        ${calc.donorBonusPct > 0 ? `
          <span class="donor-boost-note">⚡ +${calc.donorBonusPct}% к мутации 5★ от ${calc.highTierDonors} высокоуровневых доноров</span>
        ` : ''}
      </div>
    `;

    // Категория 1: Гены родителей
    html += `
      <div class="inspect-group">
        <div class="group-title">Гены родителей</div>
        <div class="group-traits">
          ${generalPerks.length === 0 ? '<div class="empty-trait-row">Нет общих черт у родителей</div>' : ''}
          ${generalPerks.map(p => `
            <div class="trait-row">
              <div class="trait-name">
                <span class="trait-diamond">✦</span> ${escapeHtml(p.name)}
                ${p.inP1 && p.inP2 ? '<span class="badge-both">Общий</span>' : ''}
                ${p.donorHits > 0 ? `<span class="badge-donor">+Донор (${p.donorHits})</span>` : ''}
                ${p.isStabilized ? '<span class="badge-both">🔒 100% Фиксация</span>' : ''}
              </div>
              <div class="trait-bar-wrap">
                <div class="trait-bar-fill" style="width: ${p.percentage}%;"></div>
              </div>
              <div class="trait-chance-val">0% ➔ ${p.percentage}.00%</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Категория 2: Жертвенные доноры (Черты девиантов-доноров)
    if (donorPerks.length > 0 || state.donors.some(Boolean)) {
      html += `
        <div class="inspect-group group-donor">
          <div class="group-title">Жертвенные доноры (1–3 слота) <span class="burn-badge">🔥 Сгорают</span></div>
          <div class="group-traits">
            ${donorPerks.length === 0 ? '<div class="empty-trait-row">Назначьте девиантов-доноров в слоты капсулы</div>' : ''}
            ${donorPerks.map(p => {
              const isNeg = p.kind === 'negative';
              return `
                <div class="trait-row row-donor ${isNeg ? 'row-defect' : ''}">
                  <div class="trait-name">
                    <span class="trait-diamond">${isNeg ? '⚠️' : '🔥'}</span>
                    <span style="${isNeg ? 'color:#ff9da4; font-weight:700;' : ''}">${escapeHtml(p.name)}</span>
                    <span class="badge-donor">Доноров: ${p.donorHits}</span>
                    ${isNeg ? '<span class="neg-badge-mini" style="font-size:10px; color:#ff9da4; background:rgba(240,68,78,0.25); padding:1px 5px; border-radius:3px; margin-left:6px;">Дефект</span>' : ''}
                  </div>
                  <div class="trait-bar-wrap">
                    <div class="trait-bar-fill ${isNeg ? 'bar-red' : 'bar-purple'}" style="width: ${p.percentage}%;"></div>
                  </div>
                  <div class="trait-chance-val ${isNeg ? 'red-val' : 'purple-val'}">0% ➔ ${p.percentage}.00%</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Категория 3: Скотоводство (Буст от скотоводства x10)
    if (animalPerks.length > 0 || state.animalId !== 'none') {
      html += `
        <div class="inspect-group group-boosted">
          <div class="group-title">Скотоводство / Звериный буст (x10)</div>
          <div class="group-traits">
            ${animalPerks.map(p => `
              <div class="trait-row row-gold">
                <div class="trait-name">
                  <span class="trait-diamond">🐾</span> ${escapeHtml(p.name)}
                  <span class="badge-x10">Множитель x10</span>
                </div>
                <div class="trait-bar-wrap">
                  <div class="trait-bar-fill bar-gold" style="width: ${p.percentage}%;"></div>
                </div>
                <div class="trait-chance-val gold-val">0% ➔ ${p.percentage}.00%</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    catListEl.innerHTML = html;
  }

  // Запуск слияния девиантов (с быстрой/мгновенной анимацией)
  async function performFusion() {
    if (state.isFusing) return;
    if (!state.p1.id || !state.p2.id) {
      alert('Пожалуйста, выберите обоих родителей (Родитель 1 и Родитель 2) перед запуском слияния!');
      return;
    }
    state.isFusing = true;

    const fuseBtn = document.getElementById('beginFusionBtn');
    const cylinder = document.getElementById('podCenterCylinder');
    const fluid = document.getElementById('cylinderFluid');

    if (fuseBtn) fuseBtn.disabled = true;
    if (cylinder) cylinder.classList.add('fusing-active');
    if (fluid) fluid.classList.add('fluid-surging');

    SoundFX.playSurge();

    // Пользователь просил: "только не делай слияние 10 минут, как в игре :DDD , а в разумном понятие"
    const delay = state.instant ? 80 : 1300;
    await new Promise(r => setTimeout(r, delay));

    // Вычисляем результат броска кубика
    const result = runSingleSimulation();
    state.lastResult = result;

    if (cylinder) cylinder.classList.remove('fusing-active');
    if (fluid) fluid.classList.remove('fluid-surging');
    if (fuseBtn) fuseBtn.disabled = false;
    state.isFusing = false;

    SoundFX.playSuccess(result.is55GodRoll);
    showResultDialog(result);
  }

  // Логика броска кубика по правилам игры (на основе гайда 1vampire)
  function runSingleSimulation() {
    const calc = calculateChances();
    const mechanics = state.fusionData?.mechanics || FALLBACK_FUSION_DATA.mechanics;

    // 1. Определение вида девианта (с учетом влияния доноров и мутагенов)
    let chosenDevId = state.p1.id;
    if (state.mutagenId === 'species_grade_s') {
      chosenDevId = state.p1.id;
    } else if (state.mutagenId === 'chaos_mutagen') {
      if (Math.random() < 0.35 && state.deviantsList.length > 2) {
        const randomDev = state.deviantsList[Math.floor(Math.random() * state.deviantsList.length)];
        chosenDevId = randomDev.id;
      } else {
        chosenDevId = Math.random() < (calc.p1DropRate / 100) ? state.p1.id : state.p2.id;
      }
    } else {
      chosenDevId = Math.random() < (calc.p1DropRate / 100) ? state.p1.id : state.p2.id;
    }
    const dev = getDeviant(chosenDevId);

    // 2. Расчет рейтинга силы и активности с учетом мутагенеза и доноров
    let finalRating = Math.round((state.p1.rating + state.p2.rating) / 2);
    let finalActivity = Math.round((state.p1.activity + state.p2.activity) / 2);

    const activeDonors = state.donors.filter(Boolean);
    const highTierDonors = activeDonors.filter(d => (d.rating || 0) >= 4).length;
    const donorRatingBonus = highTierDonors * (mechanics.donorRatingBonusPerHighTier || 0.05);

    // Мутация Силы (Skill Rating)
    const mutationRoll = Math.random();
    const upChance = (state.mutagenId === 'skill_mutagen' ? 0.50 : mechanics.ratingMutationUpChance) + donorRatingBonus;
    if (mutationRoll < upChance) {
      finalRating = Math.min(5, finalRating + 1);
    } else if (mutationRoll > (1.0 - mechanics.ratingMutationDownChance)) {
      finalRating = Math.max(1, finalRating - 1);
    }

    // Мутация Активности / Энергии (Activity Rating)
    const actMutationRoll = Math.random();
    const actUpChance = mechanics.ratingMutationUpChance + donorRatingBonus * 0.5;
    if (actMutationRoll < actUpChance) {
      finalActivity = Math.min(5, finalActivity + 1);
    } else if (actMutationRoll > (1.0 - mechanics.ratingMutationDownChance)) {
      finalActivity = Math.max(1, finalActivity - 1);
    }

    // 3. Наследование перков (максимум 4 слота черт у девианта)
    const rolledPerks = [];
    calc.perkProbabilities.forEach(p => {
      if (Math.random() < p.chance) {
        rolledPerks.push({
          name: p.name,
          kind: p.kind || 'positive',
          effect: p.effect || '',
          isBoosted: p.isBoostedByAnimal,
          isStabilized: p.isStabilized,
          sourceCategory: p.sourceCategory
        });
      }
    });

    const inheritedPerks = rolledPerks.slice(0, 4);

    // 4. Проверка на негативную мутацию (унаследованная от донора/родителя или случайный дефект)
    let negativeTrait = inheritedPerks.find(p => p.kind === 'negative')?.name || null;
    if (!negativeTrait && Math.random() < (calc.negativeRisk / 100)) {
      const negPool = (state.fusionData?.commonTraits || FALLBACK_FUSION_DATA.commonTraits).filter(t => t.kind === 'negative');
      if (negPool.length > 0) {
        const picked = negPool[Math.floor(Math.random() * negPool.length)];
        negativeTrait = picked.name_ru;
        inheritedPerks.push({
          name: picked.name_ru,
          kind: 'negative',
          effect: picked.effect
        });
      }
    }

    // 5. Оценка качества результата (с учетом 5-5 статуса из видео 1vampire)
    const posCount = inheritedPerks.filter(p => p.kind === 'positive').length;
    const is55GodRoll = (finalRating === 5 && finalActivity === 5);
    let rank = 'B';
    let rankLabel = 'B-РАНГ (ХОРОШИЙ)';
    let rankBadgeClass = 'badge-rank-b';

    if (!negativeTrait && is55GodRoll && posCount >= 3) {
      rank = 'S';
      rankLabel = 'S-РАНГ 🏆 (ТОПОВЫЙ 5-5 GOD-ROLL)';
      rankBadgeClass = 'badge-rank-s';
    } else if (!negativeTrait && posCount >= 4 && finalRating >= 4) {
      rank = 'S';
      rankLabel = 'S-РАНГ 🏆 (GOD-ROLL — ИДЕАЛЬНЫЙ)';
      rankBadgeClass = 'badge-rank-s';
    } else if (!negativeTrait && posCount >= 3) {
      rank = 'A';
      rankLabel = 'A-РАНГ 🎖️ (ОТЛИЧНЫЙ БИЛД)';
      rankBadgeClass = 'badge-rank-a';
    } else if (negativeTrait || posCount <= 1) {
      rank = 'C';
      rankLabel = 'C-РАНГ ⚠️ (ДЕФЕКТ / МУТАЦИЯ)';
      rankBadgeClass = 'badge-rank-c';
    }

    return {
      deviant: dev,
      rating: finalRating,
      activity: finalActivity,
      is55GodRoll,
      perks: inheritedPerks,
      negativeTrait,
      rank,
      rankLabel,
      rankBadgeClass,
      consumedDonorsCount: activeDonors.length,
      timestamp: new Date().toLocaleTimeString('ru-RU')
    };
  }

  // Отрисовка диалога результата слияния
  function showResultDialog(res) {
    const popup = document.getElementById('mergeResultPopup');
    const body = document.getElementById('resultDialogBody');
    if (!popup || !body) return;

    body.innerHTML = `
      <div class="result-header">
        <div class="result-title-col">
          <span class="result-label">СЛИЯНИЕ ЗАВЕРШЕНО [${res.timestamp}]</span>
          <h3 class="result-name">${res.deviant.name_ru}</h3>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="rank-pill ${res.rankBadgeClass}">${res.rankLabel}</span>
            ${res.is55GodRoll ? '<div class="badge-55-gold">🔥 ТОПОВЫЙ 5-5 ДЕВИАНТ (МАКСИМАЛЬНЫЙ РАНГ)!</div>' : ''}
          </div>
        </div>
        <div class="result-avatar-wrap">
          <img src="${res.deviant.image}" alt="${res.deviant.name_ru}" class="result-avatar" onerror="this.onerror=null;this.src='icons/icon.svg';">
        </div>
      </div>

      ${res.consumedDonorsCount > 0 ? `
        <div class="result-burn-notice">
          🔥 <strong>${res.consumedDonorsCount} девианта-донора</strong> безвозвратно поглощены капсулой слияния!
        </div>
      ` : ''}

      <div class="result-stats-row">
        <div class="res-stat-badge">
          <span>Рейтинг силы (Skill):</span>
          <strong>${'★'.repeat(res.rating)}${'☆'.repeat(5 - res.rating)} (${res.rating}/5)</strong>
        </div>
        <div class="res-stat-badge">
          <span>Активность (Energy):</span>
          <strong>${'★'.repeat(res.activity)}${'☆'.repeat(5 - res.activity)} (${res.activity}/5)</strong>
        </div>
      </div>

      <div class="result-perks-section">
        <h4>Унаследованные черты (${res.perks.length}):</h4>
        <div class="result-perks-list">
          ${res.perks.length === 0 ? '<div class="empty-perks-text">Перки не унаследованы.</div>' : ''}
          ${res.perks.map(p => `
            <div class="result-perk-item ${p.kind === 'negative' ? 'perk-defect' : 'perk-success'}">
              <div class="r-perk-name">
                ${p.kind === 'negative' ? '⚠️' : '✓'} ${escapeHtml(p.name)}
                ${p.isBoosted ? '<span class="boost-tag">🐾 Буст скота x10</span>' : ''}
              </div>
              ${p.effect ? `<div class="r-perk-effect">${escapeHtml(p.effect)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="result-actions">
        <button id="promoteOffspringBtn" class="btn btn-promote" type="button" title="Перенести потомка в слот Родителя 1 для селекции следующего поколения">
          🧬 Сделать потомка Родителем 1 (Следующее поколение)
        </button>
        <button id="repeatFuseBtn" class="btn-game-sub" type="button">
          ↺ Повторить с теми же родителями
        </button>
      </div>
    `;

    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.getElementById('promoteOffspringBtn')?.addEventListener('click', () => {
      promoteOffspring();
      closeResultDialog();
    });
    document.getElementById('repeatFuseBtn')?.addEventListener('click', () => {
      closeResultDialog();
      performFusion();
    });
  }

  function closeResultDialog() {
    const popup = document.getElementById('mergeResultPopup');
    if (popup) popup.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Перенос потомка в Родитель 1 (для моделирования поколений)
  function promoteOffspring() {
    if (!state.lastResult) return;
    state.p1.id = state.lastResult.deviant.id;
    state.p1.rating = state.lastResult.rating;
    state.p1.activity = state.lastResult.activity;
    state.p1.perks = state.lastResult.perks.filter(p => p.kind === 'positive').map(p => p.name).slice(0, 4);

    updateCalculations();

    const p1Node = document.getElementById('p1Node');
    if (p1Node) {
      p1Node.classList.add('highlight-pulse');
      setTimeout(() => p1Node.classList.remove('highlight-pulse'), 1500);
    }
  }

  // ОТКРЫТИЕ ИГРОВОГО ДРОБЕРА ВЫБОРА ДЕВИАНТА (IN-GAME DRAWER)
  function openDeviantDrawer(targetParent) {
    if (targetParent && targetParent.startsWith('donor')) {
      const slotIndex = parseInt(targetParent.replace('donor', ''), 10);
      if (!state.donors[slotIndex] && getActiveMaterialsCount() >= 3) {
        alert('Камера материалов заполнена (3/3). В Once Human в центральный отсек аппарата помещается максимум 3 материала суммарно. Удалите животное, мутаген или другого донора, чтобы освободить слот.');
        return;
      }
    }

    state.drawerTargetParent = targetParent;
    const overlay = document.getElementById('deviantDrawerOverlay');
    const label = document.getElementById('drawerTargetLabel');
    const search = document.getElementById('drawerSearchInput');
    const clearBtn = document.getElementById('drawerClearBtn');
    if (!overlay) return;

    if (label) {
      if (targetParent === 'p1') label.textContent = 'Выбор для Родителя 1';
      else if (targetParent === 'p2') label.textContent = 'Выбор для Родителя 2';
      else if (targetParent.startsWith('donor')) {
        const slotNum = parseInt(targetParent.replace('donor', ''), 10) + 1;
        label.textContent = `Выбор жертвенного донора №${slotNum} (🔥 Сгорает при слиянии)`;
      }
    }

    if (clearBtn) {
      clearBtn.style.display = 'inline-block';
    }

    if (search) search.value = state.drawerSearch = '';
    state.drawerCategory = 'all';

    renderDrawerGrid();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeDeviantDrawer() {
    const overlay = document.getElementById('deviantDrawerOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Отрисовка квадратной сетки девиантов внутри дробера
  function renderDrawerGrid() {
    const grid = document.getElementById('drawerGrid');
    const totalCountEl = document.getElementById('drawerTotalCount');
    if (!grid) return;

    const q = state.drawerSearch.toLowerCase().trim();
    let currentSelectedId = null;
    if (state.drawerTargetParent === 'p1' || state.drawerTargetParent === 'p2') {
      currentSelectedId = state[state.drawerTargetParent]?.id;
    } else if (state.drawerTargetParent?.startsWith('donor')) {
      const idx = parseInt(state.drawerTargetParent.replace('donor', ''), 10);
      currentSelectedId = state.donors[idx]?.id;
    }

    const filtered = state.deviantsList.filter(d => {
      if (state.drawerCategory !== 'all') {
        if (!d.category || !d.category.includes(state.drawerCategory)) return false;
      }
      if (!q) return true;
      return (d.name_ru || '').toLowerCase().includes(q) || (d.name_en || '').toLowerCase().includes(q) || (d.roles || []).join(' ').toLowerCase().includes(q);
    });

    if (totalCountEl) totalCountEl.textContent = filtered.length;

    grid.innerHTML = filtered.map(d => {
      const isSelected = d.id === currentSelectedId;
      const imgSrc = getDeviantImg(d);
      return `
        <div class="drawer-deviant-tile ${isSelected ? 'selected' : ''}" data-id="${d.id}" title="${escapeHtml(d.name_ru)} (${escapeHtml(d.name_en)})">
          <div class="tile-img-wrap">
            <img src="${imgSrc}" alt="${escapeHtml(d.name_ru)}" class="tile-img" loading="lazy" onerror="this.onerror=null;this.src='icons/icon.svg';">
          </div>
          <div class="tile-name">${escapeHtml(d.name_ru)}</div>
          ${isSelected ? '<div class="tile-check">✓</div>' : ''}
        </div>
      `;
    }).join('');
  }

  // Открытие модалки настройки катализатора
  function openCatalystModal(type) {
    const modal = document.getElementById('catalystModal');
    const title = document.getElementById('catalystModalTitle');
    const content = document.getElementById('catalystModalContent');
    if (!modal || !content) return;

    const activeMaterials = getActiveMaterialsCount();

    if (type === 'animal') {
      const isLockedByLimit = state.animalId === 'none' && activeMaterials >= 3;
      title.textContent = '🐾 Выбор животного скотоводства (Буст x10)';
      content.innerHTML = `
        ${isLockedByLimit ? `
          <div style="background:rgba(230,80,90,0.2); border:1px solid rgba(230,80,90,0.5); color:#ff9da4; padding:9px 12px; border-radius:4px; font-size:12px; margin-bottom:12px; line-height:1.4;">
            ⚠️ <strong>Лимит камеры материалов исчерпан (3/3)!</strong> В Once Human центральный отсек вмещает строго до 3 предметов суммарно (доноры + скот + мутаген). Чтобы использовать животное, сначала удалите одного из доноров или мутаген.
          </div>
        ` : ''}
        <p style="font-size:13px; color:#ad9468; margin-bottom:12px;">
          Животные с фермы усиливают передачу совпадающих черт в 10 раз (до 95%). Занимает 1 слот из 3 в камере материалов:
        </p>
        <div class="modal-form-group">
          <label style="font-size:12px; color:#8ea4af; display:block; margin-bottom:6px;">Вид животного:</label>
          <select id="modalAnimalSelect" class="merge-select" style="width:100%; margin-bottom:12px;" ${isLockedByLimit ? 'disabled' : ''}>
            <option value="none">-- Без животного --</option>
            ${(state.fusionData?.animals || FALLBACK_FUSION_DATA.animals).map(a => `
              <option value="${a.id}" ${a.id === state.animalId ? 'selected' : ''}>${a.icon} ${a.name_ru}</option>
            `).join('')}
          </select>
        </div>
        <div class="modal-form-group">
          <label style="font-size:12px; color:#8ea4af; display:block; margin-bottom:6px;">Природная черта животного:</label>
          <select id="modalAnimalTraitSelect" class="merge-select" style="width:100%;" ${isLockedByLimit ? 'disabled' : ''}></select>
        </div>
        <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
          ${state.animalId !== 'none' ? `
            <button class="btn-game-sub" id="modalClearAnimalBtn" style="color:#ff9da4; border-color:rgba(230,80,90,0.5);" type="button">🗑️ Убрать животное</button>
          ` : ''}
          <button class="btn-drawer-confirm" id="modalSaveAnimalBtn" ${isLockedByLimit ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>✔ Применить животное</button>
        </div>
      `;

      updateModalAnimalTraitsSelect();
      document.getElementById('modalAnimalSelect')?.addEventListener('change', e => {
        state.animalId = e.target.value;
        updateModalAnimalTraitsSelect();
      });
      document.getElementById('modalClearAnimalBtn')?.addEventListener('click', () => {
        state.animalId = 'none';
        state.animalTraitId = 'none';
        closeCatalystModal();
        updateCalculations();
      });
      document.getElementById('modalSaveAnimalBtn')?.addEventListener('click', () => {
        if (isLockedByLimit && state.animalId !== 'none') return;
        const tSel = document.getElementById('modalAnimalTraitSelect');
        if (tSel) state.animalTraitId = tSel.value;
        closeCatalystModal();
        updateCalculations();
      });

    } else if (type === 'mutagen') {
      const isLockedByLimit = state.mutagenId === 'none' && activeMaterials >= 3;
      title.textContent = '🧪 Выбор мутагена капсулы слияния';
      content.innerHTML = `
        ${isLockedByLimit ? `
          <div style="background:rgba(230,80,90,0.2); border:1px solid rgba(230,80,90,0.5); color:#ff9da4; padding:9px 12px; border-radius:4px; font-size:12px; margin-bottom:12px; line-height:1.4;">
            ⚠️ <strong>Лимит камеры материалов исчерпан (3/3)!</strong> В Once Human центральный отсек вмещает строго до 3 предметов суммарно (доноры + скот + мутаген). Чтобы использовать мутаген, сначала удалите одного из доноров или животное.
          </div>
        ` : ''}
        <p style="font-size:13px; color:#ad9468; margin-bottom:12px;">
          Мутагены крафтятся на Большом Верстаке Синтеза из образцов ДНК. Занимает 1 слот из 3 в камере материалов:
        </p>
        <div class="modal-form-group">
          <select id="modalMutagenSelect" class="merge-select" style="width:100%;" ${isLockedByLimit ? 'disabled' : ''}>
            ${(state.fusionData?.mutagens || FALLBACK_FUSION_DATA.mutagens).map(m => `
              <option value="${m.id}" ${m.id === state.mutagenId ? 'selected' : ''}>${m.icon} ${m.name_ru}</option>
            `).join('')}
          </select>
        </div>
        <div id="modalMutagenDesc" style="margin-top:12px; font-size:12px; color:#24e5d6; background:rgba(36,229,214,0.08); padding:10px; border-radius:4px; border:1px solid rgba(36,229,214,0.2);"></div>
        <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
          ${state.mutagenId !== 'none' ? `
            <button class="btn-game-sub" id="modalClearMutagenBtn" style="color:#ff9da4; border-color:rgba(230,80,90,0.5);" type="button">🗑️ Убрать мутаген</button>
          ` : ''}
          <button class="btn-drawer-confirm" id="modalSaveMutagenBtn" ${isLockedByLimit ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>✔ Применить мутаген</button>
        </div>
      `;

      const updateDesc = () => {
        const m = (state.fusionData?.mutagens || FALLBACK_FUSION_DATA.mutagens).find(item => item.id === state.mutagenId);
        const descEl = document.getElementById('modalMutagenDesc');
        if (descEl && m) {
          descEl.innerHTML = `<strong>${m.effect}</strong>${m.recipe ? `<br><span style="color:#8ea4af; font-size:11px; margin-top:4px; display:block;">Рецепт: ${m.recipe}</span>` : ''}`;
        }
      };

      updateDesc();
      document.getElementById('modalMutagenSelect')?.addEventListener('change', e => {
        state.mutagenId = e.target.value;
        updateDesc();
      });
      document.getElementById('modalClearMutagenBtn')?.addEventListener('click', () => {
        state.mutagenId = 'none';
        closeCatalystModal();
        updateCalculations();
      });
      document.getElementById('modalSaveMutagenBtn')?.addEventListener('click', () => {
        if (isLockedByLimit && state.mutagenId !== 'none') return;
        closeCatalystModal();
        updateCalculations();
      });
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateModalAnimalTraitsSelect() {
    const atSel = document.getElementById('modalAnimalTraitSelect');
    if (!atSel) return;
    if (state.animalId === 'none') {
      atSel.innerHTML = '<option value="none">Черта не выбрана</option>';
      atSel.disabled = true;
      return;
    }
    atSel.disabled = false;
    const animal = (state.fusionData?.animals || FALLBACK_FUSION_DATA.animals).find(a => a.id === state.animalId);
    atSel.innerHTML = (animal?.traits || []).map(t => `
      <option value="${t.id}" ${t.id === state.animalTraitId ? 'selected' : ''}>★ ${t.name_ru} (${t.effect})</option>
    `).join('');
    if (animal?.traits?.[0] && !animal.traits.some(t => t.id === state.animalTraitId)) {
      state.animalTraitId = animal.traits[0].id;
      atSel.value = state.animalTraitId;
    }
  }

  function closeCatalystModal() {
    document.getElementById('catalystModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Настройка девианта-донора (перки, звезды, вид)
  function openDonorConfigModal(slotIndex) {
    const d = state.donors[slotIndex];
    if (!d) return;
    const modal = document.getElementById('donorConfigModal');
    const body = document.getElementById('donorConfigModalBody');
    if (!modal || !body) return;

    const allTraits = state.fusionData?.commonTraits || FALLBACK_FUSION_DATA.commonTraits;

    body.innerHTML = `
      <div class="donor-modal-header" style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
        <div style="width:56px; height:56px; border-radius:6px; background:radial-gradient(circle, rgba(192,132,252,0.3), rgba(0,0,0,0.8)); border:1px solid #c084fc; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          <img src="${getDeviantImg(d)}" alt="${escapeHtml(d.name_ru)}" style="width:100%; height:100%; object-fit:contain;" onerror="this.onerror=null;this.src='icons/icon.svg';">
        </div>
        <div>
          <span style="font-size:11px; color:#c084fc; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Жертвенный донор №${slotIndex + 1}</span>
          <h3 style="font-family:'Cinzel', serif; font-size:20px; color:#ffffff; margin:2px 0;">${escapeHtml(d.name_ru)}</h3>
          <span style="font-size:12px; color:#ff9da4;">🔥 Сгорает при слиянии</span>
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(192,132,252,0.3); border-radius:6px; padding:12px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; color:#e6f9fa; font-weight:600;">Уровень силы донора:</span>
          <span class="donor-modal-stars-picker" data-slot="${slotIndex}" style="cursor:pointer; font-size:18px;">
            ${[1, 2, 3, 4, 5].map(s => `<span class="donor-star-item ${s <= (d.rating || 4) ? 'active' : ''}" data-val="${s}" style="color:${s <= (d.rating || 4) ? '#ffd700' : 'rgba(255,255,255,0.2)'}; margin:0 2px;">★</span>`).join('')}
          </span>
          <strong style="color:#24e5d6; font-size:13px;">${d.rating || 4}/5★</strong>
        </div>
        <div style="font-size:11px; color:#8ea4af; margin-top:6px;">
          ★ Доноры с рейтингом 4★ и 5★ дают <strong>+5% к шансу положительной мутации</strong> в 5-5.
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h4 style="font-size:14px; color:#24e5d6; margin:0;">Перки и черты донора (${(d.perks || []).length}/4):</h4>
          ${(d.perks || []).length < 4 ? `
            <button type="button" class="btn-node-add" id="donorAddPerkBtn" data-slot="${slotIndex}">+ Добавить перк</button>
          ` : ''}
        </div>

        <div class="donor-modal-perks-list" style="display:flex; flex-direction:column; gap:8px;">
          ${(!d.perks || d.perks.length === 0) ? `
            <div style="font-size:12px; color:#8ea4af; font-style:italic; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px;">
              У этого донора пока нет черт. Нажмите «+ Добавить перк» выше (можно передать любые черты, включая боевые или дефекты вроде «Лентяй»).
            </div>
          ` : d.perks.map((pName, pIdx) => {
            const tDef = allTraits.find(t => t.name_ru === pName);
            const isNeg = tDef?.kind === 'negative';
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); border-left:3px solid ${isNeg ? '#f0444e' : '#24e5d6'}; padding:8px 12px; border-radius:4px;">
                <div>
                  <strong style="color:${isNeg ? '#ff9da4' : '#e6f9fa'}; font-size:13px;">${isNeg ? '⚠️ ' : '✓ '}${escapeHtml(pName)}</strong>
                  ${tDef?.effect ? `<div style="font-size:11px; color:#8ea4af; margin-top:2px;">${escapeHtml(tDef.effect)}</div>` : ''}
                </div>
                <button type="button" class="donor-perk-del-btn" data-slot="${slotIndex}" data-index="${pIdx}" style="cursor:pointer; color:#ff9da4; background:none; border:none; font-size:18px; font-weight:700; padding:2px 8px;" title="Удалить черту">×</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn-node-edit" id="donorChangeDevBtn" data-slot="${slotIndex}">⇄ Сменить вид</button>
          <button type="button" class="btn-game-sub" id="donorDeleteSlotBtn" data-slot="${slotIndex}" style="color:#ff9da4; border-color:rgba(230,80,90,0.5);">🗑️ Очистить</button>
        </div>
        <button type="button" class="btn-drawer-confirm" id="donorModalDoneBtn">✔ Готово</button>
      </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Клик по звездам донора
    body.querySelectorAll('.donor-star-item').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val, 10);
        if (!isNaN(val) && state.donors[slotIndex]) {
          state.donors[slotIndex].rating = val;
          SoundFX.playClick();
          renderApparatusNodes();
          updateCalculations();
          openDonorConfigModal(slotIndex);
        }
      });
    });

    // Добавление перка
    document.getElementById('donorAddPerkBtn')?.addEventListener('click', () => {
      openPerkSelectModal('donor' + slotIndex);
    });

    // Удаление перка
    body.querySelectorAll('.donor-perk-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pIdx = parseInt(btn.dataset.index, 10);
        if (state.donors[slotIndex]?.perks) {
          state.donors[slotIndex].perks.splice(pIdx, 1);
          SoundFX.playClick();
          renderApparatusNodes();
          updateCalculations();
          openDonorConfigModal(slotIndex);
        }
      });
    });

    // Смена девианта
    document.getElementById('donorChangeDevBtn')?.addEventListener('click', () => {
      closeDonorConfigModal();
      openDeviantDrawer('donor' + slotIndex);
    });

    // Удаление из слота
    document.getElementById('donorDeleteSlotBtn')?.addEventListener('click', () => {
      state.donors[slotIndex] = null;
      closeDonorConfigModal();
      renderApparatusNodes();
      updateCalculations();
    });

    // Кнопка Готово
    document.getElementById('donorModalDoneBtn')?.addEventListener('click', closeDonorConfigModal);
  }

  function closeDonorConfigModal() {
    document.getElementById('donorConfigModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Моделирование 100 скрещиваний (Монте-Карло тест)
  function runBatch100() {
    if (!state.p1.id || !state.p2.id) {
      alert('Пожалуйста, выберите обоих родителей (Родитель 1 и Родитель 2) перед запуском теста 100 попыток!');
      return;
    }
    const runs = 100;
    let countS = 0;
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let count55 = 0;
    let totalRating = 0;
    let totalActivity = 0;
    const traitHits = {};

    for (let i = 0; i < runs; i++) {
      const res = runSingleSimulation();
      if (res.rank === 'S') countS++;
      else if (res.rank === 'A') countA++;
      else if (res.rank === 'B') countB++;
      else countC++;

      if (res.is55GodRoll) count55++;

      totalRating += res.rating;
      totalActivity += res.activity;
      res.perks.forEach(p => {
        traitHits[p.name] = (traitHits[p.name] || 0) + 1;
      });
    }

    const avgRating = (totalRating / runs).toFixed(1);
    const avgActivity = (totalActivity / runs).toFixed(1);
    const modal = document.getElementById('batchModal');
    const body = document.getElementById('batchModalBody');
    if (!modal || !body) return;

    body.innerHTML = `
      <h2 style="color:#24e5d6; font-family:'Cinzel', serif; margin-bottom:12px;">
        🎲 Результаты 100 виртуальных скрещиваний
      </h2>
      <p style="color:#8ea4af; margin-bottom:14px; font-size:13px;">
        Математическая симуляция на основе выбранных родителей, катализатора скотоводства, мутагена и доноров:
      </p>

      <div class="batch-godroll-highlight">
        <div class="b-55-title">🔥 Получено топовых 5-5 девиантов: <strong>${count55} из 100 (${count55}%)</strong></div>
        <div class="b-55-sub">Девианты с максимальным рангом (Сила 5★ и Активность 5★ одновременно). Средние статы: <strong>${avgRating}★ Сила</strong> / <strong>${avgActivity}★ Активность</strong></div>
      </div>

      <div class="batch-stats-grid">
        <div class="batch-stat-card card-s">
          <div class="b-val">${countS}%</div>
          <div class="b-label">S-Ранг (God-Roll 🏆)</div>
        </div>
        <div class="batch-stat-card card-a">
          <div class="b-val">${countA}%</div>
          <div class="b-label">A-Ранг (Отличный 🎖️)</div>
        </div>
        <div class="batch-stat-card card-b">
          <div class="b-val">${countB}%</div>
          <div class="b-label">B-Ранг (Хороший 👍)</div>
        </div>
        <div class="batch-stat-card card-c">
          <div class="b-val">${countC}%</div>
          <div class="b-label">Брак / Мутация ⚠️</div>
        </div>
      </div>

      <div style="margin-top:20px;">
        <h4 style="margin-bottom:8px; color:#e6f9fa;">Частота наследования черт в 100 попытках:</h4>
        <div class="batch-traits-list">
          ${Object.entries(traitHits).sort((a, b) => b[1] - a[1]).map(([trait, hits]) => `
            <div class="batch-trait-row">
              <span class="b-tname">${escapeHtml(trait)}</span>
              <span class="b-thits">${hits} из 100 (${hits}%)</span>
              <div class="b-tbar"><div class="b-tbar-fill" style="width:${hits}%"></div></div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-top:18px; font-size:12px; color:#8ea4af; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <span>★ Средняя сила: <strong style="color:#24e5d6;">${avgRating} / 5★</strong></span>
        <span>⚡ Средняя активность: <strong style="color:#24e5d6;">${avgActivity} / 5★</strong></span>
        <span>🧬 Активных доноров в капсуле: <strong style="color:#ffd700;">${state.donors.filter(Boolean).length} / 3</strong></span>
      </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  // Применение готового шаблона (по мета-гайду 1vampire)
  function applyPreset(presetKey) {
    if (!presetKey) return;

    if (presetKey === 'empty') {
      state.p1 = { id: null, rating: 4, activity: 4, perks: [] };
      state.p2 = { id: null, rating: 4, activity: 4, perks: [] };
      state.donors = [null, null, null];
      state.animalId = 'none';
      state.animalTraitId = 'none';
      state.mutagenId = 'none';
      renderApparatusNodes();
      updateCalculations();
      return;
    }

    // Доноры для буста шанса мутации в 5-5 (+15% к броску)
    const digby = state.deviantsList.find(d => d.id === 'digby') || state.deviantsList[0];
    const bfly = state.deviantsList.find(d => d.id === 'butterfly') || state.deviantsList[1] || digby;
    const gel = state.deviantsList.find(d => d.id === 'gel') || state.deviantsList[2] || digby;

    const standardDonors = [
      { id: digby.id, name_ru: digby.name_ru, rating: 4, activity: 4, perks: ['Трудоголик'] },
      { id: bfly.id, name_ru: bfly.name_ru, rating: 4, activity: 4, perks: ['Агрессивный'] },
      { id: gel.id, name_ru: gel.name_ru, rating: 5, activity: 4, perks: ['Подбодрение'] }
    ];

    if (presetKey === 'vampire_lonewolf_55' || presetKey === 'lonewolf_crit') {
      const wolf = state.deviantsList.find(d => d.id === 'lonewolf') || state.deviantsList[0];
      state.p1.id = wolf.id;
      state.p1.rating = 4;
      state.p1.activity = 4;
      state.p1.perks = ['Звериные инстинкты', 'Агрессивный'];

      state.p2.id = wolf.id;
      state.p2.rating = 4;
      state.p2.activity = 4;
      state.p2.perks = ['Звериные инстинкты', 'Быстроногий'];

      // 1 донор + 1 скот + 1 мутаген = строго 3/3 материала
      state.donors = [standardDonors[0], null, null];
      state.animalId = 'wolf';
      state.animalTraitId = 'feral_instincts';
      state.mutagenId = 'skill_mutagen';

    } else if (presetKey === 'vampire_butterfly_55' || presetKey === 'butterfly_combat') {
      const butterfly = state.deviantsList.find(d => d.id === 'butterfly') || state.deviantsList[0];
      state.p1.id = butterfly.id;
      state.p1.rating = 4;
      state.p1.activity = 4;
      state.p1.perks = ['Агрессивный', 'Подбодрение'];

      state.p2.id = butterfly.id;
      state.p2.rating = 4;
      state.p2.activity = 4;
      state.p2.perks = ['Агрессивный', 'Хвала Луне - Звёздная ночь'];

      // 1 донор + 1 скот + 1 мутаген = строго 3/3 материала
      state.donors = [standardDonors[1], null, null];
      state.animalId = 'wolf';
      state.animalTraitId = 'aggressive';
      state.mutagenId = 'purifier';

    } else if (presetKey === 'vampire_digby_55' || presetKey === 'digby_harvester') {
      const digbyDev = state.deviantsList.find(d => d.id === 'digby') || state.deviantsList[0];
      state.p1.id = digbyDev.id;
      state.p1.rating = 4;
      state.p1.activity = 4;
      state.p1.perks = ['Трудоголик', 'Подбодрение'];

      state.p2.id = digbyDev.id;
      state.p2.rating = 4;
      state.p2.activity = 4;
      state.p2.perks = ['Трудоголик', 'Вьючное животное'];

      // 2 донора + 1 мутаген = строго 3/3 материала
      state.donors = [standardDonors[0], standardDonors[2], null];
      state.animalId = 'none';
      state.animalTraitId = 'none';
      state.mutagenId = 'stabilizer';

    } else if (presetKey === 'vampire_donors_80') {
      const wolf = state.deviantsList.find(d => d.id === 'lonewolf') || state.deviantsList[0];
      const digbyDev = state.deviantsList.find(d => d.id === 'digby') || state.deviantsList[0];
      state.p1.id = wolf.id;
      state.p1.rating = 4;
      state.p1.activity = 4;
      state.p1.perks = ['Звериные инстинкты', 'Агрессивный'];

      state.p2.id = digbyDev.id;
      state.p2.rating = 4;
      state.p2.activity = 4;
      state.p2.perks = ['Трудоголик', 'Подбодрение'];

      // 3 одинаковых донора целевого вида дают максимальный шанс 80.0% на целевой вид!
      state.donors = [
        { id: wolf.id, name_ru: wolf.name_ru, rating: 4, activity: 4, perks: ['Агрессивный'] },
        { id: wolf.id, name_ru: wolf.name_ru, rating: 4, activity: 4, perks: ['Быстроногий'] },
        { id: wolf.id, name_ru: wolf.name_ru, rating: 5, activity: 4, perks: ['Звериные инстинкты'] }
      ];
      state.animalId = 'none';
      state.animalTraitId = 'none';
      state.mutagenId = 'none';

    } else if (presetKey === 'vampire_pyramid_4in1') {
      const dev = state.deviantsList[0];
      state.p1.id = dev.id;
      state.p1.rating = 4;
      state.p1.activity = 4;
      state.p1.perks = ['Агрессивный', 'Звериные инстинкты'];

      state.p2.id = dev.id;
      state.p2.rating = 4;
      state.p2.activity = 4;
      state.p2.perks = ['Быстроногий', 'Подбодрение'];

      // 1 донор + 1 скот + 1 мутаген = строго 3/3 материала
      state.donors = [standardDonors[0], null, null];
      state.animalId = 'wolf';
      state.animalTraitId = 'aggressive';
      state.mutagenId = 'purifier';
    }

    renderApparatusNodes();
    updateCalculations();
  }

  // Добавление перка
  let currentTargetParent = 'p1';
  function openPerkSelectModal(parentKey) {
    if ((parentKey === 'p1' || parentKey === 'p2') && !state[parentKey].id) {
      openDeviantDrawer(parentKey);
      return;
    }
    currentTargetParent = parentKey;
    const modal = document.getElementById('perkSelectModal');
    const title = document.getElementById('perkModalTitle');
    const list = document.getElementById('perkModalList');
    const search = document.getElementById('perkSearchInput');
    if (!modal || !list) return;

    if (title) {
      if (parentKey === 'p1') {
        title.textContent = 'Добавить перк: Родитель 1';
      } else if (parentKey === 'p2') {
        title.textContent = 'Добавить перк: Родитель 2';
      } else if (parentKey && parentKey.startsWith('donor')) {
        const slot = parseInt(parentKey.replace('donor', ''), 10);
        const d = state.donors[slot];
        title.textContent = `Добавить перк: Донор #${slot + 1} (${d?.name_ru || 'Девиант'})`;
      }
    }
    if (search) search.value = '';

    renderPerkModalList('');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderPerkModalList(filterQuery) {
    const list = document.getElementById('perkModalList');
    if (!list) return;
    const q = (filterQuery || '').toLowerCase().trim();

    const allTraits = state.fusionData?.commonTraits || FALLBACK_FUSION_DATA.commonTraits;
    let existing = [];
    if (currentTargetParent === 'p1' || currentTargetParent === 'p2') {
      existing = state[currentTargetParent]?.perks || [];
    } else if (currentTargetParent && currentTargetParent.startsWith('donor')) {
      const slot = parseInt(currentTargetParent.replace('donor', ''), 10);
      existing = state.donors[slot]?.perks || [];
    }

    const filtered = allTraits.filter(t => {
      if (existing.includes(t.name_ru)) return false;
      if (!q) return true;
      return t.name_ru.toLowerCase().includes(q) || (t.name_en || '').toLowerCase().includes(q) || (t.effect || '').toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      list.innerHTML = `<div class="empty-perks-text">Нет доступных черт для добавления.</div>`;
      return;
    }

    list.innerHTML = filtered.map(t => `
      <div class="modal-perk-item" data-name="${escapeHtml(t.name_ru)}">
        <div class="m-perk-title">
          <span class="m-perk-tier ${t.kind === 'negative' ? 'tier-red' : 'tier-gold'}">●</span>
          <strong>${escapeHtml(t.name_ru)}</strong>
          <span style="color:#8ea4af; font-size:12px;">(${escapeHtml(t.name_en || '')})</span>
          ${t.kind === 'negative' ? '<span style="color:#ff9da4; font-size:11px; margin-left:6px; font-weight:600;">⚠️ Дефект</span>' : ''}
        </div>
        <div class="m-perk-effect">${escapeHtml(t.effect || '')}</div>
      </div>
    `).join('');
  }

  // Привязка событий
  function bindMergeEvents() {
    // Клики по левым карточкам предпросмотра
    document.getElementById('previewCardsList')?.addEventListener('click', e => {
      const card = e.target.closest('.preview-card');
      if (card && card.dataset.outcome) {
        state.selectedInspectOutcome = card.dataset.outcome;
        updateCalculations();
      }
    });

    // Открытие дробера девиантов
    document.getElementById('p1Bubble')?.addEventListener('click', () => openDeviantDrawer('p1'));
    document.getElementById('p1ChangeBtn')?.addEventListener('click', () => openDeviantDrawer('p1'));
    document.getElementById('p2Bubble')?.addEventListener('click', () => openDeviantDrawer('p2'));
    document.getElementById('p2ChangeBtn')?.addEventListener('click', () => openDeviantDrawer('p2'));

    // Добавление перков
    document.getElementById('p1AddPerkBtn')?.addEventListener('click', () => openPerkSelectModal('p1'));
    document.getElementById('p2AddPerkBtn')?.addEventListener('click', () => openPerkSelectModal('p2'));

    // Удаление перков
    document.getElementById('p1ChipsList')?.addEventListener('click', handlePerkRemove);
    document.getElementById('p2ChipsList')?.addEventListener('click', handlePerkRemove);

    // Клики по слотам материалов в цилиндре
    document.getElementById('animalSlotPill')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('pill-remove-btn')) return;
      if (state.animalId === 'none' && getActiveMaterialsCount() >= 3) {
        alert('Камера материалов заполнена (3/3). В Once Human в центральный отсек аппарата помещается не более 3 предметов суммарно. Удалите одного из доноров или мутаген перед добавлением животного.');
        SoundFX.playClick();
        return;
      }
      openCatalystModal('animal');
    });

    document.getElementById('mutagenSlotPill')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('pill-remove-btn')) return;
      if (state.mutagenId === 'none' && getActiveMaterialsCount() >= 3) {
        alert('Камера материалов заполнена (3/3). В Once Human в центральный отсек аппарата помещается не более 3 предметов суммарно. Удалите одного из доноров или животное перед добавлением мутагена.');
        SoundFX.playClick();
        return;
      }
      openCatalystModal('mutagen');
    });

    // Кнопка слияния
    document.getElementById('beginFusionBtn')?.addEventListener('click', performFusion);
    document.getElementById('batch100Btn')?.addEventListener('click', runBatch100);
    document.getElementById('resetLabBtn')?.addEventListener('click', () => {
      applyPreset('empty');
      const sel = document.getElementById('labPresetSelect');
      if (sel) sel.value = 'empty';
    });

    // Переключение звуков (Web Audio API)
    document.getElementById('labSoundToggle')?.addEventListener('click', () => {
      state.sound = !state.sound;
      const icon = document.getElementById('labSoundIcon');
      if (icon) icon.textContent = state.sound ? '🔊' : '🔇';
      if (state.sound) SoundFX.playClick();
    });

    // Интерактивный клик по звёздам (1-5★) силы и энергии родителей
    document.querySelector('.apparatus-stage')?.addEventListener('click', e => {
      const star = e.target.closest('.star-item');
      if (!star) return;
      const picker = star.closest('.stars-picker');
      if (!picker) return;
      const parentKey = picker.dataset.parent;
      const statKey = picker.dataset.stat;
      const val = parseInt(star.dataset.val, 10);
      if (parentKey && statKey && !isNaN(val)) {
        state[parentKey][statKey] = val;
        SoundFX.playClick();
        renderApparatusNodes();
        updateCalculations();
      }
    });

    // Пресеты и мгновенность
    document.getElementById('labPresetSelect')?.addEventListener('change', e => {
      applyPreset(e.target.value);
      SoundFX.playClick();
    });
    document.getElementById('labInstantToggle')?.addEventListener('change', e => { state.instant = e.target.checked; });

    // Дробер девиантов: категории, поиск, клик по плитке
    document.getElementById('drawerCloseBtn')?.addEventListener('click', closeDeviantDrawer);
    document.getElementById('deviantDrawerOverlay')?.addEventListener('click', e => {
      if (e.target.id === 'deviantDrawerOverlay') closeDeviantDrawer();
    });
    document.querySelectorAll('.drawer-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.drawer-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.drawerCategory = btn.dataset.cat;
        renderDrawerGrid();
      });
    });
    document.getElementById('drawerSearchInput')?.addEventListener('input', e => {
      state.drawerSearch = e.target.value;
      renderDrawerGrid();
    });
    document.getElementById('drawerGrid')?.addEventListener('click', e => {
      const tile = e.target.closest('.drawer-deviant-tile');
      if (tile && tile.dataset.id) {
        const target = state.drawerTargetParent;
        const dev = getDeviant(tile.dataset.id);
        const rec = dev?.traits?.recommended || [];
        const perks = rec.map(t => t.name_ru || t.name);

        if (target === 'p1' || target === 'p2') {
          state[target].id = tile.dataset.id;
          if (perks.length > 0) {
            state[target].perks = perks.slice(0, 4);
          }
        } else if (target && target.startsWith('donor')) {
          const slot = parseInt(target.replace('donor', ''), 10);
          state.donors[slot] = {
            id: dev.id,
            name_ru: dev.name_ru,
            rating: 4,
            activity: 4,
            perks: perks.length > 0 ? perks.slice(0, 2) : ['Природный инстинкт']
          };
        }

        closeDeviantDrawer();
        renderApparatusNodes();
        updateCalculations();
      }
    });

    document.getElementById('drawerClearBtn')?.addEventListener('click', () => {
      const target = state.drawerTargetParent;
      if (target && target.startsWith('donor')) {
        const slot = parseInt(target.replace('donor', ''), 10);
        state.donors[slot] = null;
      } else if (target === 'p1' || target === 'p2') {
        state[target].id = null;
        state[target].perks = [];
      }
      closeDeviantDrawer();
      renderApparatusNodes();
      updateCalculations();
    });
    document.getElementById('drawerConfirmBtn')?.addEventListener('click', closeDeviantDrawer);

    // Модалка результата
    document.getElementById('resultCloseBtn')?.addEventListener('click', closeResultDialog);
    document.getElementById('resultBackdrop')?.addEventListener('click', closeResultDialog);

    // Модалка катализатора
    document.getElementById('catalystModalClose')?.addEventListener('click', closeCatalystModal);
    document.getElementById('catalystModal')?.addEventListener('click', e => {
      if (e.target.id === 'catalystModal') closeCatalystModal();
    });

    // Модалка настройки донора
    document.getElementById('donorConfigModalClose')?.addEventListener('click', closeDonorConfigModal);
    document.getElementById('donorConfigModal')?.addEventListener('click', e => {
      if (e.target.id === 'donorConfigModal') closeDonorConfigModal();
    });

    // Модалка перков
    document.getElementById('perkModalClose')?.addEventListener('click', closePerkModal);
    document.getElementById('perkSelectModal')?.addEventListener('click', e => {
      if (e.target.id === 'perkSelectModal') closePerkModal();
    });
    document.getElementById('perkSearchInput')?.addEventListener('input', e => {
      renderPerkModalList(e.target.value);
    });
    document.getElementById('perkModalList')?.addEventListener('click', e => {
      const item = e.target.closest('.modal-perk-item');
      if (item && item.dataset.name) {
        if (currentTargetParent === 'p1' || currentTargetParent === 'p2') {
          if (state[currentTargetParent].perks.length < 4) {
            state[currentTargetParent].perks.push(item.dataset.name);
            renderApparatusNodes();
            updateCalculations();
          }
        } else if (currentTargetParent && currentTargetParent.startsWith('donor')) {
          const slot = parseInt(currentTargetParent.replace('donor', ''), 10);
          if (state.donors[slot]) {
            if (!state.donors[slot].perks) state.donors[slot].perks = [];
            if (state.donors[slot].perks.length < 4) {
              state.donors[slot].perks.push(item.dataset.name);
              renderApparatusNodes();
              updateCalculations();
              const donorModal = document.getElementById('donorConfigModal');
              if (donorModal && donorModal.classList.contains('open')) {
                openDonorConfigModal(slot);
              }
            }
          }
        }
        closePerkModal();
      }
    });

    // Модалка 100 попыток
    document.getElementById('batchModalClose')?.addEventListener('click', closeBatchModal);
    document.getElementById('batchModal')?.addEventListener('click', e => {
      if (e.target.id === 'batchModal') closeBatchModal();
    });

    // Закрытие по Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeDeviantDrawer();
        closeCatalystModal();
        closeDonorConfigModal();
        closePerkModal();
        closeBatchModal();
        closeResultDialog();
      }
    });
  }

  function handlePerkRemove(e) {
    const btn = e.target.closest('.tag-del');
    if (!btn) return;
    const parentKey = btn.dataset.parent;
    const idx = parseInt(btn.dataset.index, 10);
    if (parentKey && !isNaN(idx)) {
      state[parentKey].perks.splice(idx, 1);
      renderApparatusNodes();
      updateCalculations();
    }
  }

  function closePerkModal() {
    document.getElementById('perkSelectModal')?.classList.remove('open');
    const donorModal = document.getElementById('donorConfigModal');
    if (!donorModal || !donorModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }

  function closeBatchModal() {
    document.getElementById('batchModal')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Публичный интерфейс
  window.FusionLab = {
    init,
    onShow,
    performFusion,
    runBatch100,
    promoteOffspring,
    applyPreset
  };

})();
