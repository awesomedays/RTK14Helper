// ===== CONFIGURATION =====

const AFFAIRS_CONFIG = {
  agriculture: {
    name: '농업',
    icon: '🌾',
    description: '기본: 정치 | 핵심 개성: 농정, 둔전',
    baseCalc: (o) => o.politics,
    baseStat: '정치',
    traitBonuses: { '농정': 15, '둔전': 10, '능리': 5, '진흥': 5 }
  },
  commerce: {
    name: '상업',
    icon: '💰',
    description: '기본: 정치 | 핵심 개성: 징세, 조달',
    baseCalc: (o) => o.politics,
    baseStat: '정치',
    traitBonuses: { '징세': 15, '조달': 10, '능리': 5, '진흥': 5 }
  },
  security: {
    name: '치안',
    icon: '🛡️',
    description: '기본: 정치×0.4 + 통솔×0.3 + 매력×0.3 | 핵심 개성: 교화, 법률',
    baseCalc: (o) => Math.round(o.politics * 0.4 + o.leadership * 0.3 + o.charm * 0.3),
    baseStat: '혼합',
    traitBonuses: { '교화': 12, '법률': 10, '명성': 8, '능리': 5 }
  },
  training: {
    name: '훈련',
    icon: '⚔️',
    description: '기본: 통솔 | 핵심 개성: 교련, 규율',
    baseCalc: (o) => o.leadership,
    baseStat: '통솔',
    traitBonuses: { '교련': 15, '규율': 10, '위무': 8, '독려': 5 }
  },
  walls: {
    name: '성벽',
    icon: '🏯',
    description: '기본: 정치 | 핵심 개성: 축성, 발명',
    baseCalc: (o) => o.politics,
    baseStat: '정치',
    traitBonuses: { '축성': 15, '발명': 10, '능리': 5 }
  },
  development: {
    name: '개발',
    icon: '🔨',
    description: '기본: 정치 | 핵심 개성: 개수, 진흥',
    baseCalc: (o) => o.politics,
    baseStat: '정치',
    traitBonuses: { '개수': 15, '진흥': 10, '능리': 8, '발명': 5 }
  }
};

const PAGE_SIZE = 50;

const TAB_CATEGORIES = {
  current: [
    { id: 'roster', label: '보유무장' },
    { id: 'cities', label: '보유도시' },
    { id: 'corps', label: '군단관리' },
    { id: 'admin', label: '내정관리' },
    { id: 'summon', label: '호출현황' },
    { id: 'appointment', label: '임명현황' }
  ],
  all: [
    { id: 'search', label: '무장 검색' },
    { id: 'compare', label: '무장 비교' },
    { id: 'optimize', label: '내정 최적화' }
  ]
};

// ===== STATE =====

let state = {
  currentCategory: 'current',
  currentTab: 'roster',
  currentAffair: 'agriculture',
  optimizeSort: { key: 'score', dir: 'desc' },
  searchSort: { key: 'id', dir: 'asc' },
  optimizeShown: PAGE_SIZE,
  searchShown: PAGE_SIZE,
  compareIds: [],
  rosterIds: [],
  rosterSort: { key: 'name', dir: 'asc' },
  // 보유도시
  ownedCityIds: [],
  // 군단관리
  corps: [],
  corpsNextId: 1,
  // 내정관리
  tradeNations: { ansik: false, cheonchuk: false, daejin: false, guisang: false },
  manualTrade: { ansik: [], cheonchuk: [], daejin: [], guisang: [] },
  citySlotOverrides: {},
  cityRecruitDisabled: {},
  assignmentResult: null,
  // 호출현황
  summonedIds: new Set(),
  // 임명현황
  appointmentIds: new Set()
};

// ===== ROSTER PERSISTENCE =====

const ROSTER_KEY = 'rtk14_roster';

function saveRoster() {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(state.rosterIds));
}

function loadRoster() {
  try {
    const saved = localStorage.getItem(ROSTER_KEY);
    if (saved) state.rosterIds = [...new Set(JSON.parse(saved))];
  } catch (e) { /* ignore */ }
}

// ===== CITIES PERSISTENCE =====

const CITIES_KEY = 'rtk14_cities';

function saveCities() {
  localStorage.setItem(CITIES_KEY, JSON.stringify(state.ownedCityIds));
}

function loadCities() {
  try {
    const saved = localStorage.getItem(CITIES_KEY);
    if (saved) state.ownedCityIds = [...new Set(JSON.parse(saved))];
  } catch (e) { /* ignore */ }
}

// ===== CORPS PERSISTENCE =====

const CORPS_KEY = 'rtk14_corps';

function saveCorps() {
  localStorage.setItem(CORPS_KEY, JSON.stringify({
    corps: state.corps,
    nextId: state.corpsNextId
  }));
}

function loadCorps() {
  try {
    const saved = localStorage.getItem(CORPS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.corps = data.corps || [];
      state.corpsNextId = data.nextId || 1;
      // Migrate old memberIds format → ranks format
      for (const c of state.corps) {
        if (c.memberIds && !c.ranks) {
          c.ranks = c.memberIds.length > 0
            ? [{ id: 1, name: '멤버', memberIds: c.memberIds }]
            : [];
          c.rankNextId = 2;
          delete c.memberIds;
        }
        if (!c.ranks) { c.ranks = []; c.rankNextId = 1; }
        if (!c.rankNextId) c.rankNextId = 1;
      }
    }
  } catch (e) { /* ignore */ }
}

// ===== TRADE PERSISTENCE =====

const TRADE_KEY = 'rtk14_trade';

function saveTradeNations() {
  localStorage.setItem(TRADE_KEY, JSON.stringify(state.tradeNations));
}

function loadTradeNations() {
  try {
    const saved = localStorage.getItem(TRADE_KEY);
    if (saved) state.tradeNations = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

// ===== MANUAL TRADE PERSISTENCE =====

const MANUAL_TRADE_KEY = 'rtk14_manual_trade';

function saveManualTrade() {
  localStorage.setItem(MANUAL_TRADE_KEY, JSON.stringify(state.manualTrade));
}

function loadManualTrade() {
  try {
    const saved = localStorage.getItem(MANUAL_TRADE_KEY);
    if (saved) state.manualTrade = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

// ===== CITY SLOT OVERRIDES PERSISTENCE =====

const CITY_SLOTS_KEY = 'rtk14_city_slots';

function saveCitySlots() {
  localStorage.setItem(CITY_SLOTS_KEY, JSON.stringify(state.citySlotOverrides));
}

function loadCitySlots() {
  try {
    const saved = localStorage.getItem(CITY_SLOTS_KEY);
    if (saved) state.citySlotOverrides = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

function getCityRegionSlots(city) {
  const override = state.citySlotOverrides[city.id];
  return (override !== undefined && override !== null) ? override : city.regionSlots;
}

// ===== CITY RECRUIT DISABLED PERSISTENCE =====

const CITY_RECRUIT_KEY = 'rtk14_city_recruit';

function saveCityRecruit() {
  localStorage.setItem(CITY_RECRUIT_KEY, JSON.stringify(state.cityRecruitDisabled));
}

function loadCityRecruit() {
  try {
    const saved = localStorage.getItem(CITY_RECRUIT_KEY);
    if (saved) state.cityRecruitDisabled = JSON.parse(saved);
  } catch (e) { /* ignore */ }
}

// ===== SUMMON PERSISTENCE =====

const SUMMON_KEY = 'rtk14_summon';

function saveSummon() {
  localStorage.setItem(SUMMON_KEY, JSON.stringify([...state.summonedIds]));
}

function loadSummon() {
  try {
    const saved = localStorage.getItem(SUMMON_KEY);
    if (saved) state.summonedIds = new Set(JSON.parse(saved));
  } catch (e) { /* ignore */ }
}

// ===== APPOINTMENT PERSISTENCE =====

const APPOINTMENT_KEY = 'rtk14_appointment';

function saveAppointment() {
  localStorage.setItem(APPOINTMENT_KEY, JSON.stringify([...state.appointmentIds]));
}

function loadAppointment() {
  try {
    const saved = localStorage.getItem(APPOINTMENT_KEY);
    if (saved) state.appointmentIds = new Set(JSON.parse(saved));
  } catch (e) { /* ignore */ }
}

// ===== STATE EXPORT / IMPORT =====

const STATE_KEYS = [
  ROSTER_KEY, CITIES_KEY, 'rtk14_corps', 'rtk14_trade',
  MANUAL_TRADE_KEY, CITY_SLOTS_KEY, CITY_RECRUIT_KEY,
  SUMMON_KEY, APPOINTMENT_KEY
];

function exportState() {
  const data = {};
  for (const key of STATE_KEYS) {
    const val = localStorage.getItem(key);
    if (val) {
      try { data[key] = JSON.parse(val); } catch (e) { data[key] = val; }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `rtk14_state_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importState(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      for (const [key, val] of Object.entries(data)) {
        if (STATE_KEYS.includes(key)) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      }
      location.reload();
    } catch (e) {
      alert('상태 파일을 읽을 수 없습니다.');
    }
  };
  reader.readAsText(file);
}

// ===== SCORING =====

function calculateScore(officer, affairKey) {
  const config = AFFAIRS_CONFIG[affairKey];
  let score = config.baseCalc(officer);
  for (const [trait, bonus] of Object.entries(config.traitBonuses)) {
    if (officer.traits.includes(trait)) {
      score += bonus;
    }
  }
  return score;
}

function precomputeScores() {
  for (const officer of OFFICERS) {
    officer.scores = {};
    for (const key of Object.keys(AFFAIRS_CONFIG)) {
      officer.scores[key] = calculateScore(officer, key);
    }
    officer.total = officer.leadership + officer.power + officer.intelligence + officer.politics + officer.charm;
  }
}

// ===== KOREAN INITIAL CONSONANT SEARCH =====

const INITIAL_CONSONANTS = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ',
  'ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
];

function getInitialConsonant(char) {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return char;
  return INITIAL_CONSONANTS[Math.floor((code - 0xAC00) / 588)];
}

function getInitials(str) {
  return [...str].map(getInitialConsonant).join('');
}

function isAllConsonants(str) {
  return [...str].every(c => INITIAL_CONSONANTS.includes(c));
}

function matchesName(officer, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const name = officer.name.toLowerCase();
  if (name.includes(q)) return true;
  if (isAllConsonants(query)) {
    return getInitials(officer.name).includes(query);
  }
  return false;
}

// ===== FILTERING =====

function getOptimizeFilters() {
  return {
    corps: document.getElementById('opt-corps').value,
    location: document.getElementById('opt-location').value,
    minStat: parseInt(document.getElementById('opt-min-stat').value) || 0
  };
}

function getSearchFilters() {
  return {
    name: document.getElementById('search-name').value.trim(),
    gender: document.getElementById('search-gender').value,
    ideology: document.getElementById('search-ideology').value,
    corps: document.getElementById('search-corps').value,
    location: document.getElementById('search-location').value,
    trait: document.getElementById('search-trait').value
  };
}

function filterForOptimize(officers, filters, affairKey) {
  const config = AFFAIRS_CONFIG[affairKey];
  return officers.filter(o => {
    if (filters.corps && o.corps !== filters.corps) return false;
    if (filters.location && o.location !== filters.location) return false;
    if (filters.minStat && config.baseCalc(o) < filters.minStat) return false;
    return true;
  });
}

function filterForSearch(officers, filters) {
  return officers.filter(o => {
    if (!matchesName(o, filters.name)) return false;
    if (filters.gender && o.gender !== filters.gender) return false;
    if (filters.ideology && o.ideology !== filters.ideology) return false;
    if (filters.corps && o.corps !== filters.corps) return false;
    if (filters.location && o.location !== filters.location) return false;
    if (filters.trait && !o.traits.includes(filters.trait)) return false;
    return true;
  });
}

// ===== SORTING =====

function sortOfficers(officers, key, dir) {
  return [...officers].sort((a, b) => {
    let va, vb;
    if (key === 'score') {
      va = a.scores[state.currentAffair];
      vb = b.scores[state.currentAffair];
    } else if (key === 'baseStat') {
      const calc = AFFAIRS_CONFIG[state.currentAffair].baseCalc;
      va = calc(a);
      vb = calc(b);
    } else if (key === 'total') {
      va = a.total;
      vb = b.total;
    } else if (key === 'lp') {
      va = a.leadership + a.power;
      vb = b.leadership + b.power;
    } else if (key === 'ip') {
      va = a.intelligence + a.politics;
      vb = b.intelligence + b.politics;
    } else {
      va = a[key];
      vb = b[key];
    }
    if (typeof va === 'string') {
      const cmp = va.localeCompare(vb, 'ko');
      return dir === 'asc' ? cmp : -cmp;
    }
    return dir === 'asc' ? va - vb : vb - va;
  });
}

function corpsStatClass(val) {
  if (val >= 90) return 'stat--high';
  if (val >= 80) return 'stat--mid';
  return '';
}

// ===== RENDERING: Optimize Tab =====

function getScoreClass(score) {
  if (score >= 100) return 'score--exceptional';
  if (score >= 80) return 'score--high';
  if (score >= 60) return 'score--good';
  if (score >= 40) return 'score--mid';
  return 'score--low';
}

function getStatClass(val) {
  if (val >= 80) return 'stat-high';
  if (val >= 50) return 'stat-mid';
  return 'stat-low';
}

function renderTraitBadges(officer, affairKey) {
  if (!affairKey) {
    return officer.traits.map(t =>
      `<span class="trait-badge trait-badge--normal">${t}</span>`
    ).join('');
  }
  const config = AFFAIRS_CONFIG[affairKey];
  const bonuses = config.traitBonuses;
  const keyTraits = Object.keys(bonuses).filter(t => bonuses[t] >= 10);
  const supportTraits = Object.keys(bonuses).filter(t => bonuses[t] < 10);

  return officer.traits
    .filter(t => t in bonuses)
    .map(t => {
      const cls = keyTraits.includes(t) ? 'trait-badge--key' : 'trait-badge--support';
      const bonus = bonuses[t];
      return `<span class="trait-badge ${cls}">${t} +${bonus}</span>`;
    }).join('');
}

function renderOptimizeTable() {
  const affairKey = state.currentAffair;
  const config = AFFAIRS_CONFIG[affairKey];
  const filters = getOptimizeFilters();
  let officers = filterForOptimize(OFFICERS, filters, affairKey);
  officers = sortOfficers(officers, state.optimizeSort.key, state.optimizeSort.dir);

  document.getElementById('opt-count').textContent = `${officers.length}명의 무장`;
  document.getElementById('affair-info').innerHTML =
    `<strong>${config.icon} ${config.name}</strong> — ${config.description}`;

  const shown = officers.slice(0, state.optimizeShown);
  const tbody = document.getElementById('opt-tbody');
  tbody.innerHTML = shown.map((o, i) => {
    const base = config.baseCalc(o);
    const score = o.scores[affairKey];
    const pct = Math.min(score, 120);
    const cls = getScoreClass(score);
    return `<tr>
      <td class="col-rank">${i + 1}</td>
      <td><span class="officer-name" data-id="${o.id}">${o.name}</span></td>
      <td class="col-stat ${getStatClass(base)}">${base}</td>
      <td><div class="score-cell ${cls}">
        <div class="score-bar"><div class="score-bar__fill" style="width:${pct}%"></div></div>
        <span class="score-value">${score}</span>
      </div></td>
      <td><div class="trait-badges">${renderTraitBadges(o, affairKey)}</div></td>
      <td>${o.location}</td>
      <td>${o.corps || '재야'}</td>
    </tr>`;
  }).join('');

  const loadMore = document.getElementById('opt-load-more');
  loadMore.style.display = officers.length > state.optimizeShown ? '' : 'none';

  updateSortIndicators('opt-table', state.optimizeSort);
}

// ===== RENDERING: Search Tab =====

function renderSearchTable() {
  const filters = getSearchFilters();
  let officers = filterForSearch(OFFICERS, filters);
  officers = sortOfficers(officers, state.searchSort.key, state.searchSort.dir);

  document.getElementById('search-count').textContent = `${officers.length}명의 무장`;

  const shown = officers.slice(0, state.searchShown);
  const tbody = document.getElementById('search-tbody');
  tbody.innerHTML = shown.map(o => {
    return `<tr>
      <td class="col-id">${o.id}</td>
      <td><span class="officer-name" data-id="${o.id}">${o.name}</span></td>
      <td class="col-stat ${getStatClass(o.leadership)}">${o.leadership}</td>
      <td class="col-stat ${getStatClass(o.power)}">${o.power}</td>
      <td class="col-stat ${getStatClass(o.intelligence)}">${o.intelligence}</td>
      <td class="col-stat ${getStatClass(o.politics)}">${o.politics}</td>
      <td class="col-stat ${getStatClass(o.charm)}">${o.charm}</td>
      <td class="col-total ${getStatClass(o.total / 5)}">${o.total}</td>
      <td><div class="trait-badges">${o.traits.map(t => `<span class="trait-badge trait-badge--normal">${t}</span>`).join('')}</div></td>
      <td>${o.corps || '재야'}</td>
    </tr>`;
  }).join('');

  const loadMore = document.getElementById('search-load-more');
  loadMore.style.display = officers.length > state.searchShown ? '' : 'none';

  updateSortIndicators('search-table', state.searchSort);
}

// ===== RENDERING: Compare Tab =====

function renderCompare() {
  const grid = document.getElementById('compare-grid');
  const chips = document.getElementById('compare-chips');

  chips.innerHTML = state.compareIds.map(id => {
    const o = OFFICERS.find(x => x.id === id);
    return `<div class="compare-chip">
      <span>${o.name}</span>
      <button class="compare-chip__remove" data-id="${id}">&times;</button>
    </div>`;
  }).join('');

  if (state.compareIds.length === 0) {
    grid.innerHTML = '<p class="compare-placeholder">비교할 무장을 선택해주세요.</p>';
    return;
  }

  const selected = state.compareIds.map(id => OFFICERS.find(x => x.id === id));

  const statRows = [
    { label: '통솔', key: 'leadership' },
    { label: '무력', key: 'power' },
    { label: '지력', key: 'intelligence' },
    { label: '정치', key: 'politics' },
    { label: '매력', key: 'charm' },
    { label: '합계', key: 'total' }
  ];

  const affairRows = Object.entries(AFFAIRS_CONFIG).map(([key, cfg]) => ({
    label: `${cfg.icon} ${cfg.name}`,
    key: key
  }));

  function findBest(values) {
    const max = Math.max(...values);
    return values.map(v => v === max);
  }

  let html = '<table class="compare-table"><thead><tr><th></th>';
  html += selected.map(o => `<th>${o.name}</th>`).join('');
  html += '</tr></thead><tbody>';

  // Stats section
  html += `<tr class="compare-section-header"><td colspan="${selected.length + 1}">기본 능력치</td></tr>`;
  for (const row of statRows) {
    const values = selected.map(o => o[row.key]);
    const bests = findBest(values);
    html += `<tr><td>${row.label}</td>`;
    html += selected.map((o, i) => {
      const val = values[i];
      const maxVal = row.key === 'total' ? 500 : 100;
      const pct = (val / maxVal) * 100;
      const color = bests[i] ? 'var(--accent-blue)' : 'var(--border-dark)';
      return `<td class="${bests[i] ? 'best-value' : ''}">
        <span class="compare-bar" style="width:${pct}%;background:${color}"></span>${val}
      </td>`;
    }).join('');
    html += '</tr>';
  }

  // Affairs section
  html += `<tr class="compare-section-header"><td colspan="${selected.length + 1}">내정 점수</td></tr>`;
  for (const row of affairRows) {
    const values = selected.map(o => o.scores[row.key]);
    const bests = findBest(values);
    html += `<tr><td>${row.label}</td>`;
    html += selected.map((o, i) => {
      const val = values[i];
      const pct = Math.min(val, 120);
      const color = bests[i] ? 'var(--accent-blue)' : 'var(--border-dark)';
      return `<td class="${bests[i] ? 'best-value' : ''}">
        <span class="compare-bar" style="width:${pct}%;background:${color}"></span>${val}
      </td>`;
    }).join('');
    html += '</tr>';
  }

  // Traits section
  html += `<tr class="compare-section-header"><td colspan="${selected.length + 1}">개성</td></tr>`;
  const maxTraits = Math.max(...selected.map(o => o.traits.length));
  for (let i = 0; i < maxTraits; i++) {
    html += `<tr><td>${i === 0 ? '' : ''}</td>`;
    html += selected.map(o => {
      const t = o.traits[i] || '';
      return `<td>${t ? `<span class="trait-badge trait-badge--normal">${t}</span>` : ''}</td>`;
    }).join('');
    html += '</tr>';
  }

  html += '</tbody></table>';
  grid.innerHTML = html;
}

// ===== RENDERING: Roster Tab =====

function renderRoster() {
  const officers = state.rosterIds
    .map(id => OFFICERS.find(o => o.id === id))
    .filter(Boolean);

  const sorted = sortOfficers(officers, state.rosterSort.key, state.rosterSort.dir);

  document.getElementById('roster-count').textContent = `보유 무장: ${sorted.length}명`;

  const tbody = document.getElementById('roster-tbody');
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">무장을 검색하여 추가해주세요.</td></tr>';
    return;
  }

  tbody.innerHTML = sorted.map(o => `<tr>
    <td><span class="officer-name" data-id="${o.id}">${o.name}</span></td>
    <td class="col-stat-sm ${getStatClass(o.leadership)}">${o.leadership}</td>
    <td class="col-stat-sm ${getStatClass(o.power)}">${o.power}</td>
    <td class="col-stat-sm ${getStatClass(o.intelligence)}">${o.intelligence}</td>
    <td class="col-stat-sm ${getStatClass(o.politics)}">${o.politics}</td>
    <td class="col-stat-sm ${getStatClass(o.charm)}">${o.charm}</td>
    <td class="col-stat ${getStatClass((o.leadership + o.power) / 2)}">${o.leadership + o.power}</td>
    <td class="col-stat ${getStatClass((o.intelligence + o.politics) / 2)}">${o.intelligence + o.politics}</td>
    <td><div class="trait-badges">${o.traits.map(t =>
      `<span class="trait-badge trait-badge--normal">${t}</span>`
    ).join('')}</div></td>
    <td style="text-align:center"><button class="roster-remove" data-id="${o.id}">&times;</button></td>
  </tr>`).join('');

  updateSortIndicators('roster-table', state.rosterSort);
}

// ===== RENDERING: Cities Tab =====

function renderCities() {
  const cities = state.ownedCityIds
    .map(id => CITIES.find(c => c.id === id))
    .filter(Boolean);

  document.getElementById('cities-count').textContent = `보유 도시: ${cities.length}개`;

  const tbody = document.getElementById('cities-tbody');
  if (cities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">도시를 검색하여 추가해주세요.</td></tr>';
    return;
  }

  tbody.innerHTML = cities.map((c, i) => `<tr>
    <td style="text-align:center;font-weight:700;color:var(--accent-gold-bright)">${i + 1}</td>
    <td>${c.name}</td>
    <td class="col-stat">${c.province}</td>
    <td class="col-stat">${c.regionSlots}</td>
    <td style="text-align:center">
      <button class="city-move-up" data-id="${c.id}" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
      <button class="city-move-down" data-id="${c.id}" ${i === cities.length - 1 ? 'disabled' : ''}>&#9660;</button>
    </td>
    <td style="text-align:center"><button class="roster-remove" data-id="${c.id}">&times;</button></td>
  </tr>`).join('');
}

// ===== RENDERING: Corps Tab =====

function getAssignedOfficerIds() {
  const ids = new Set();
  for (const c of state.corps) {
    for (const rank of (c.ranks || [])) {
      for (const id of rank.memberIds) ids.add(id);
    }
  }
  return ids;
}

function renderCorpsList(focusTarget) {
  const container = document.getElementById('corps-list');

  if (state.corps.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">군단을 추가해주세요.</p>';
    return;
  }

  container.innerHTML = state.corps.map(corps => {
    const totalMembers = (corps.ranks || []).reduce((sum, r) => sum + r.memberIds.length, 0);

    const rankSections = (corps.ranks || []).length > 0
      ? corps.ranks.map(rank => {
          const members = rank.memberIds
            .map(id => OFFICERS.find(o => o.id === id))
            .filter(Boolean);

          const memberRows = members.map((o, i) => `<div class="corps-member">
              <span class="officer-name" data-id="${o.id}">${o.name}</span>
              <span class="corps-member__stats">통<span class="${corpsStatClass(o.leadership)}">${o.leadership}</span> 무<span class="${corpsStatClass(o.power)}">${o.power}</span> 지<span class="${corpsStatClass(o.intelligence)}">${o.intelligence}</span> 정<span class="${corpsStatClass(o.politics)}">${o.politics}</span></span>
              <button class="corps-member-up" data-corps-id="${corps.id}" data-rank-id="${rank.id}" data-officer-id="${o.id}" ${i === 0 ? 'disabled' : ''}>&#9650;</button>
              <button class="corps-member-down" data-corps-id="${corps.id}" data-rank-id="${rank.id}" data-officer-id="${o.id}" ${i === members.length - 1 ? 'disabled' : ''}>&#9660;</button>
              <button class="corps-member__remove" data-corps-id="${corps.id}" data-rank-id="${rank.id}" data-officer-id="${o.id}">&times;</button>
            </div>`).join('');

          return `<div class="corps-rank" data-rank-id="${rank.id}">
            <div class="corps-rank__header">
              <span class="corps-rank__name">${rank.name}</span>
              <span class="corps-rank__count">${members.length}명</span>
              <button class="corps-rank__delete" data-corps-id="${corps.id}" data-rank-id="${rank.id}">삭제</button>
            </div>
            <div class="corps-rank__body">
              <div class="corps-card__member-list">${memberRows}</div>
              <div class="compare-search-wrap corps-search-wrap">
                <input type="text" class="corps-member-input" data-corps-id="${corps.id}" data-rank-id="${rank.id}" placeholder="무장 검색..." autocomplete="off">
                <div class="autocomplete-list corps-member-autocomplete"></div>
              </div>
            </div>
          </div>`;
        }).join('')
      : '<p class="corps-empty-msg">직급을 추가해주세요.</p>';

    // City selector options
    const ownedCities = state.ownedCityIds
      .map(id => CITIES.find(c => c.id === id))
      .filter(Boolean);
    const allCities = CITIES;

    const sourceCityOptions = '<option value="">-- 선택 --</option>' +
      ownedCities.map(c =>
        `<option value="${c.id}" ${corps.sourceCity === c.id ? 'selected' : ''}>${c.name} (${c.province})</option>`
      ).join('');

    const targetCityOptions = '<option value="">-- 선택 --</option>' +
      allCities.map(c =>
        `<option value="${c.id}" ${corps.targetCity === c.id ? 'selected' : ''}>${c.name} (${c.province})</option>`
      ).join('');

    const isDefense = corps.role === '방어';

    const citySelector = `<div class="corps-city-selector">
      <div class="corps-city-field">
        <label>소속도시</label>
        <select class="corps-source-city" data-corps-id="${corps.id}">${sourceCityOptions}</select>
      </div>
      ${isDefense ? '' : `<span class="corps-city-arrow">→</span>
      <div class="corps-city-field">
        <label>목표도시</label>
        <select class="corps-target-city" data-corps-id="${corps.id}">${targetCityOptions}</select>
      </div>`}
    </div>`;

    return `<div class="corps-card corps-card--${corps.role}" data-corps-id="${corps.id}">
      <div class="corps-card__header">
        <h3 class="corps-card__name">${corps.name}</h3>
        <span class="role-badge role-badge--${corps.role}">${corps.role}</span>
        <span class="corps-card__count">${totalMembers}명</span>
        <button class="corps-card__delete" data-corps-id="${corps.id}">삭제</button>
      </div>
      ${citySelector}
      <div class="corps-card__body">
        <div class="corps-rank-add">
          <input type="text" class="corps-rank-input" data-corps-id="${corps.id}" placeholder="직급명..." autocomplete="off">
          <button class="corps-rank-add-btn" data-corps-id="${corps.id}">직급 추가</button>
        </div>
        ${rankSections}
      </div>
    </div>`;
  }).join('');

  // Restore focus for continuous search
  if (focusTarget) {
    const input = container.querySelector(
      `.corps-member-input[data-corps-id="${focusTarget.corpsId}"][data-rank-id="${focusTarget.rankId}"]`
    );
    if (input) {
      input.focus();
      input.value = '';
    }
  }
}

// ===== ASSIGNMENT ALGORITHM =====

const TRADE_NATION_NAMES = {
  ansik: '안식국',
  cheonchuk: '천축국',
  daejin: '대진국',
  guisang: '귀상국'
};

function runAssignment() {
  const assignedToCorps = getAssignedOfficerIds();
  // 수동 교역 배정 무장 ID 수집
  const manualTradeIds = new Set();
  for (const ids of Object.values(state.manualTrade)) {
    for (const id of ids) manualTradeIds.add(id);
  }
  let pool = state.rosterIds
    .filter(id => !assignedToCorps.has(id) && !manualTradeIds.has(id))
    .map(id => OFFICERS.find(o => o.id === id))
    .filter(Boolean);

  const activeNations = Object.entries(state.tradeNations)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const ownedCities = state.ownedCityIds
    .map(id => CITIES.find(c => c.id === id))
    .filter(Boolean);

  const N = ownedCities.length;
  const recruitN = ownedCities.filter(c => !state.cityRecruitDisabled[c.id]).length;
  const manualTradeCount = activeNations.reduce(
    (sum, n) => sum + (state.manualTrade[n] || []).filter(id => state.rosterIds.includes(id)).length, 0);
  const tradeSlots = 5 * activeNations.length - manualTradeCount;

  const result = {
    tradeAgents: {},
    cities: ownedCities.map(c => ({
      cityId: c.id,
      cityName: c.name,
      province: c.province,
      regionSlots: getCityRegionSlots(c),
      governor: null,
      recruiter: null,
      trainer: null,
      regionalAdmins: []
    })),
    unassigned: []
  };

  // ===== 분류 단계 =====
  const adminPool = [];
  const recruitPool = [];
  const trainPool = [];
  const tradePool = [];

  // Step 1: 지정 >= 145 → 내정 풀
  pool = pool.filter(o => {
    if ((o.intelligence + o.politics) >= 145) {
      adminPool.push(o);
      return false;
    }
    return true;
  });

  // Step 2: 모집 개성 → 모병 풀
  pool = pool.filter(o => {
    if (o.traits.includes('모집')) {
      recruitPool.push(o);
      return false;
    }
    return true;
  });

  // Step 3: 교련 개성 → 훈련 풀
  pool = pool.filter(o => {
    if (o.traits.includes('교련')) {
      trainPool.push(o);
      return false;
    }
    return true;
  });

  // Step 4: 특사 개성 → 교역 풀
  pool = pool.filter(o => {
    if (o.traits.includes('특사')) {
      tradePool.push(o);
      return false;
    }
    return true;
  });

  // Step 5: 모병 잔여 슬롯 채움 (무력 내림차순) — 모병 활성 도시 수 기준
  const recruitRemain = Math.max(0, recruitN - recruitPool.length);
  if (recruitRemain > 0 && pool.length > 0) {
    pool.sort((a, b) => b.power - a.power);
    recruitPool.push(...pool.splice(0, recruitRemain));
  }

  // Step 6: 훈련 잔여 슬롯 채움 (통솔+무력 내림차순)
  const trainRemain = Math.max(0, N - trainPool.length);
  if (trainRemain > 0 && pool.length > 0) {
    pool.sort((a, b) => (b.leadership + b.power) - (a.leadership + a.power));
    trainPool.push(...pool.splice(0, trainRemain));
  }

  // Step 7: 교역 잔여 슬롯 채움 (|지정 - 100| 오름차순)
  const tradeRemain = Math.max(0, tradeSlots - tradePool.length);
  if (tradeRemain > 0 && pool.length > 0) {
    pool.sort((a, b) => {
      const da = Math.abs((a.intelligence + a.politics) - 100);
      const db = Math.abs((b.intelligence + b.politics) - 100);
      return da - db;
    });
    tradePool.push(...pool.splice(0, tradeRemain));
  }

  // Step 8: 나머지 전부 → 내정 풀
  adminPool.push(...pool);
  pool = [];

  // ===== 배정 단계 =====

  // 교역: 특사 우선 + 지정 합 내림차순 정렬 후 라운드로빈 배정
  tradePool.sort((a, b) => {
    const traitA = a.traits.includes('특사') ? 1 : 0;
    const traitB = b.traits.includes('특사') ? 1 : 0;
    if (traitA !== traitB) return traitB - traitA;
    return (b.intelligence + b.politics) - (a.intelligence + a.politics);
  });
  for (const nation of activeNations) {
    const manualIds = (state.manualTrade[nation] || [])
      .filter(id => state.rosterIds.includes(id));
    result.tradeAgents[nation] = [...manualIds];
  }
  // 라운드로빈으로 국가에 분배 (각 국가 5명까지)
  let nationIdx = 0;
  const tradeOverflow = [];
  for (const officer of tradePool) {
    let placed = false;
    for (let attempt = 0; attempt < activeNations.length; attempt++) {
      const nation = activeNations[nationIdx % activeNations.length];
      nationIdx++;
      if (result.tradeAgents[nation].length < 5) {
        result.tradeAgents[nation].push(officer.id);
        placed = true;
        break;
      }
    }
    if (!placed) tradeOverflow.push(officer);
  }

  // 모병: 모집 개성 우선, 무력 내림차순 정렬 후 활성 도시당 1명
  recruitPool.sort((a, b) => {
    const traitA = a.traits.includes('모집') ? 1 : 0;
    const traitB = b.traits.includes('모집') ? 1 : 0;
    if (traitA !== traitB) return traitB - traitA;
    return b.power - a.power;
  });
  let recruitIdx = 0;
  for (let i = 0; i < result.cities.length && recruitIdx < recruitPool.length; i++) {
    if (state.cityRecruitDisabled[result.cities[i].cityId]) continue;
    result.cities[i].recruiter = recruitPool[recruitIdx].id;
    recruitIdx++;
  }
  const recruitOverflow = recruitPool.slice(recruitN);

  // 훈련: 교련 개성 우선, 통솔+무력 내림차순 정렬 후 도시당 1명
  trainPool.sort((a, b) => {
    const traitA = a.traits.includes('교련') ? 1 : 0;
    const traitB = b.traits.includes('교련') ? 1 : 0;
    if (traitA !== traitB) return traitB - traitA;
    return (b.leadership + b.power) - (a.leadership + a.power);
  });
  for (let i = 0; i < result.cities.length && i < trainPool.length; i++) {
    result.cities[i].trainer = trainPool[i].id;
  }
  const trainOverflow = trainPool.slice(N);

  // 내정: 지정 내림차순 정렬 → 상위 N명 태수, 나머지 지역내정 라운드로빈
  adminPool.sort((a, b) => {
    const ipA = a.intelligence + a.politics;
    const ipB = b.intelligence + b.politics;
    return ipB - ipA;
  });

  // 태수 배정 (상위 N명)
  for (let i = 0; i < result.cities.length && i < adminPool.length; i++) {
    result.cities[i].governor = adminPool[i].id;
  }

  // 지역내정 라운드로빈 (N번째 이후)
  const regionPool = adminPool.slice(N);
  if (result.cities.length > 0 && regionPool.length > 0) {
    const capacity = result.cities.map(c => c.regionSlots);
    let cityIdx = 0;

    for (const officer of regionPool) {
      let attempts = 0;
      while (capacity[cityIdx] <= 0 && attempts < result.cities.length) {
        cityIdx = (cityIdx + 1) % result.cities.length;
        attempts++;
      }
      if (attempts >= result.cities.length) {
        result.unassigned.push(officer.id);
        continue;
      }
      result.cities[cityIdx].regionalAdmins.push(officer.id);
      capacity[cityIdx]--;
      cityIdx = (cityIdx + 1) % result.cities.length;
    }
  }

  // 초과분 → 미할당
  for (const o of tradeOverflow) result.unassigned.push(o.id);
  for (const o of recruitOverflow) result.unassigned.push(o.id);
  for (const o of trainOverflow) result.unassigned.push(o.id);

  return result;
}

// ===== RENDERING: Admin Tab =====

function renderAdminCitySlots() {
  const container = document.getElementById('admin-city-slots');
  const cities = state.ownedCityIds
    .map(id => CITIES.find(c => c.id === id))
    .filter(Boolean);

  if (cities.length === 0) {
    container.innerHTML = '';
    return;
  }

  const rows = cities.map((c, i) => {
    const current = getCityRegionSlots(c);
    const isModified = state.citySlotOverrides[c.id] !== undefined && state.citySlotOverrides[c.id] !== c.regionSlots;
    const recruitEnabled = !state.cityRecruitDisabled[c.id];
    const modifiedStyle = isModified ? 'color:#2563eb;border-color:#2563eb;font-weight:600' : '';
    return `<tr>
      <td style="text-align:center;color:var(--text-muted)">${i + 1}</td>
      <td>${c.name} <span style="color:var(--text-muted)">(${c.province})</span></td>
      <td style="text-align:center"><input type="checkbox" class="city-recruit-checkbox" data-city-id="${c.id}" ${recruitEnabled ? 'checked' : ''}></td>
      <td style="text-align:center">${c.regionSlots}</td>
      <td style="text-align:center">
        <input type="number" class="city-slot-input" data-city-id="${c.id}" value="${current}" min="0" max="20" style="width:50px;text-align:center;${modifiedStyle}">
        ${isModified ? '<button class="city-slot-reset" data-city-id="' + c.id + '" title="기본값 복원">↺</button>' : ''}
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `<div class="admin-section">
    <h3 class="admin-section__title">도시별 내정인원</h3>
    <table class="data-table admin-city-slots-table">
      <thead><tr>
        <th style="width:50px">순위</th>
        <th>도시</th>
        <th style="width:60px">모병</th>
        <th style="width:70px">기본</th>
        <th style="width:100px">배정인원</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderTradeConfig() {
  const container = document.getElementById('trade-manual-config');
  const activeNations = Object.entries(state.tradeNations)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (activeNations.length === 0) {
    container.innerHTML = '';
    return;
  }

  const assignedIds = getAssignedOfficerIds();
  const allManualIds = new Set();
  for (const ids of Object.values(state.manualTrade)) {
    for (const id of ids) allManualIds.add(id);
  }

  let html = '<div style="margin-top:12px"><label style="font-size:0.85rem;color:var(--text-muted)">수동 교역 배정 (현재 이동 중인 무장)</label>';
  for (const nation of activeNations) {
    const ids = state.manualTrade[nation] || [];
    html += `<div class="trade-manual" data-nation="${nation}">`;
    html += `<span class="trade-manual__label">${TRADE_NATION_NAMES[nation]}</span>`;
    html += `<div class="trade-manual__body">`;
    for (const id of ids) {
      const o = OFFICERS.find(x => x.id === id);
      if (!o) continue;
      html += `<span class="trade-manual__chip">`;
      html += `<span class="officer-name" data-id="${o.id}">${o.name}</span>`;
      html += `<span class="trade-manual__chip-remove" data-nation="${nation}" data-officer-id="${id}">&times;</span>`;
      html += `</span>`;
    }
    html += `<div class="trade-manual__search">`;
    html += `<input class="trade-manual__input" data-nation="${nation}" placeholder="무장 검색..." autocomplete="off">`;
    html += `<div class="trade-manual-autocomplete"></div>`;
    html += `</div>`;
    html += `</div></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderOfficerChip(officerId, showStat, traitNames) {
  const o = OFFICERS.find(x => x.id === officerId);
  if (!o) return '<span class="text-muted">?</span>';
  const stat = showStat ? ` <span class="admin-chip__stat">${showStat(o)}</span>` : '';
  let traitHtml = '';
  if (traitNames) {
    traitHtml = traitNames
      .filter(t => o.traits.includes(t))
      .map(t => ` <span class="trait-tag trait-tag--${t}">${t}</span>`)
      .join('');
  }
  return `<span class="admin-chip"><span class="officer-name" data-id="${o.id}">${o.name}</span>${stat}${traitHtml}</span>`;
}

function renderAssignmentResults(result) {
  const container = document.getElementById('admin-results');
  if (!result) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">보유무장, 보유도시, 군단을 설정한 후 "배정 실행" 버튼을 눌러주세요.</p>';
    return;
  }

  let html = '';

  // 도시별 배정 섹션 (먼저 표시)
  if (result.cities.length > 0) {
    html += '<div class="admin-section"><h3 class="admin-section__title">도시별 배정</h3>';
    for (let i = 0; i < result.cities.length; i++) {
      const city = result.cities[i];
      html += `<div class="admin-city-card">`;
      html += `<h4 class="admin-city-card__title">${i + 1}순위 — ${city.cityName} <span class="admin-city-card__province">(${city.province})</span></h4>`;

      // 태수
      html += `<div class="admin-role"><span class="admin-role__label">태수</span>`;
      html += city.governor
        ? renderOfficerChip(city.governor, o => `지정${o.intelligence + o.politics}`)
        : '<span class="text-muted">미배정</span>';
      html += '</div>';

      // 도시내정 (모병, 훈련)
      html += `<div class="admin-role"><span class="admin-role__label">도시내정</span>`;
      html += `<div class="admin-chip-list">`;
      if (city.recruiter) {
        html += renderOfficerChip(city.recruiter, o => `무력${o.power}`, ['모집']);
      }
      if (city.trainer) {
        html += renderOfficerChip(city.trainer, o => `통무${o.leadership + o.power}`, ['교련']);
      }
      if (!city.recruiter && !city.trainer) {
        html += '<span class="text-muted">미배정</span>';
      }
      html += '</div></div>';

      // 지역내정
      html += `<div class="admin-role"><span class="admin-role__label">지역내정 (${city.regionalAdmins.length}/${city.regionSlots})</span>`;
      if (city.regionalAdmins.length > 0) {
        html += `<div class="admin-chip-list">`;
        html += city.regionalAdmins.map(id => renderOfficerChip(id, o => `지정${o.intelligence + o.politics}`)).join('');
        html += '</div>';
      } else {
        html += '<span class="text-muted">미배정</span>';
      }
      html += '</div>';

      html += '</div>';
    }
    html += '</div>';
  }

  // 교역요원 섹션
  const tradeEntries = Object.entries(result.tradeAgents);
  if (tradeEntries.length > 0) {
    html += '<div class="admin-section"><h3 class="admin-section__title">교역요원</h3>';
    for (const [nation, ids] of tradeEntries) {
      html += `<div class="admin-group">`;
      html += `<h4 class="admin-group__title">${TRADE_NATION_NAMES[nation]} (${ids.length}/5)</h4>`;
      html += `<div class="admin-chip-list">`;
      html += ids.map(id => renderOfficerChip(id, o => {
        const ip = o.intelligence + o.politics;
        return `지정${ip}`;
      }, ['특사'])).join('');
      html += '</div></div>';
    }
    html += '</div>';
  }

  // 미배정 섹션
  if (result.unassigned.length > 0) {
    html += '<div class="admin-section"><h3 class="admin-section__title">미배정 (' + result.unassigned.length + '명)</h3>';
    html += '<div class="admin-chip-list">';
    html += result.unassigned.map(id => renderOfficerChip(id, o => `지정${o.intelligence + o.politics}`)).join('');
    html += '</div></div>';
  }

  if (!html) {
    html = '<p style="text-align:center;padding:24px;color:var(--text-muted)">배정할 무장 또는 도시가 없습니다.</p>';
  }

  container.innerHTML = html;
}

// ===== RENDERING: Summon Tab =====

function buildSummonData() {
  const result = state.assignmentResult;
  if (!result) return null;

  const cityMap = new Map();

  for (const cityResult of result.cities) {
    const entry = {
      cityId: cityResult.cityId,
      cityName: cityResult.cityName,
      province: cityResult.province,
      officers: []
    };

    if (cityResult.governor) {
      entry.officers.push({ id: cityResult.governor, role: '태수' });
    }
    if (cityResult.recruiter) {
      entry.officers.push({ id: cityResult.recruiter, role: '모병' });
    }
    if (cityResult.trainer) {
      entry.officers.push({ id: cityResult.trainer, role: '훈련' });
    }
    for (const adminId of cityResult.regionalAdmins) {
      entry.officers.push({ id: adminId, role: '지역내정' });
    }

    cityMap.set(cityResult.cityId, entry);
  }

  for (const corps of state.corps) {
    if (corps.sourceCity == null) continue;
    const entry = cityMap.get(corps.sourceCity);
    if (!entry) continue;

    const existingIds = new Set(entry.officers.map(o => o.id));
    for (const rank of (corps.ranks || [])) {
      for (const memberId of rank.memberIds) {
        if (!existingIds.has(memberId)) {
          entry.officers.push({ id: memberId, role: `군단:${corps.name}` });
          existingIds.add(memberId);
        }
      }
    }
  }

  const data = Array.from(cityMap.values());
  for (const city of data) {
    city.officers.sort((a, b) => {
      const nameA = (OFFICERS.find(x => x.id === a.id) || {}).name || '';
      const nameB = (OFFICERS.find(x => x.id === b.id) || {}).name || '';
      return nameA.localeCompare(nameB, 'ko');
    });
  }
  return data;
}

function renderSummonTab() {
  const container = document.getElementById('summon-content');
  const data = buildSummonData();

  if (!data) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">"내정관리" 탭에서 "배정 실행"을 먼저 수행해주세요.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">보유도시가 없습니다.</p>';
    return;
  }

  let totalOfficers = 0;
  let totalSummoned = 0;
  for (const city of data) {
    totalOfficers += city.officers.length;
    totalSummoned += city.officers.filter(o => state.summonedIds.has(o.id)).length;
  }

  let html = '';

  html += `<div class="summon-header">`;
  html += `<span class="summon-progress-global">전체 호출 진행: <strong>${totalSummoned}/${totalOfficers}</strong></span>`;
  html += `<button class="btn btn--secondary" id="summon-reset-btn">초기화</button>`;
  html += `</div>`;

  for (let i = 0; i < data.length; i++) {
    const city = data[i];
    const summoned = city.officers.filter(o => state.summonedIds.has(o.id)).length;
    const total = city.officers.length;
    const allDone = total > 0 && summoned === total;

    html += `<div class="summon-city-card${allDone ? ' summon-city-card--done' : ''}">`;
    html += `<div class="summon-city-card__header">`;
    html += `<h4 class="summon-city-card__title">${i + 1}순위 — ${city.cityName} <span class="admin-city-card__province">(${city.province})</span></h4>`;
    html += `<span class="summon-city-card__progress">${summoned}/${total} 호출완료</span>`;
    html += `</div>`;

    html += `<div class="summon-officer-list">`;
    for (const officer of city.officers) {
      const o = OFFICERS.find(x => x.id === officer.id);
      if (!o) continue;
      const isSummoned = state.summonedIds.has(officer.id);
      html += `<button class="summon-officer${isSummoned ? ' summon-officer--done' : ''}" data-officer-id="${officer.id}">`;
      html += `<span class="summon-officer__check">${isSummoned ? '&#10003;' : ''}</span>`;
      html += `<span class="summon-officer__name">${o.name}</span>`;
      html += `<span class="summon-officer__role">${officer.role}</span>`;
      html += `</button>`;
    }
    html += `</div>`;

    html += `</div>`;
  }

  container.innerHTML = html;
}

// ===== RENDERING: Appointment Tab =====

function buildAppointmentData() {
  const result = state.assignmentResult;
  if (!result) return null;

  return result.cities.map(cityResult => {
    const governor = cityResult.governor ? [cityResult.governor] : [];
    const cityAdmin = [];
    if (cityResult.recruiter) cityAdmin.push(cityResult.recruiter);
    if (cityResult.trainer) cityAdmin.push(cityResult.trainer);
    const regional = [...cityResult.regionalAdmins];

    // 방어 군단: sourceCity가 이 도시이고 role이 '방어'인 군단의 멤버
    const existingIds = new Set([...governor, ...cityAdmin, ...regional]);
    const defense = [];
    for (const corps of state.corps) {
      if (corps.role !== '방어' || corps.sourceCity !== cityResult.cityId) continue;
      for (const rank of (corps.ranks || [])) {
        for (const memberId of rank.memberIds) {
          if (!existingIds.has(memberId)) {
            defense.push(memberId);
            existingIds.add(memberId);
          }
        }
      }
    }

    return {
      cityId: cityResult.cityId,
      cityName: cityResult.cityName,
      province: cityResult.province,
      groups: [
        { label: '태수', ids: governor },
        { label: '도시내정', ids: cityAdmin },
        { label: '지역내정', ids: regional },
        { label: '방어요원', ids: defense }
      ]
    };
  });
}

function renderAppointmentTab() {
  const container = document.getElementById('appointment-content');
  const data = buildAppointmentData();

  if (!data) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">"내정관리" 탭에서 "배정 실행"을 먼저 수행해주세요.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:24px;color:var(--text-muted)">보유도시가 없습니다.</p>';
    return;
  }

  let totalOfficers = 0;
  let totalAppointed = 0;
  for (const city of data) {
    for (const group of city.groups) {
      if (group.label === '방어요원') continue;
      totalOfficers += group.ids.length;
      totalAppointed += group.ids.filter(id => state.appointmentIds.has(id)).length;
    }
  }

  let html = '';

  html += `<div class="summon-header">`;
  html += `<span class="summon-progress-global">전체 임명 진행: <strong>${totalAppointed}/${totalOfficers}</strong></span>`;
  html += `<button class="btn btn--secondary" id="appointment-reset-btn">초기화</button>`;
  html += `</div>`;

  for (let i = 0; i < data.length; i++) {
    const city = data[i];
    let cityTotal = 0, cityDone = 0;
    for (const group of city.groups) {
      if (group.label === '방어요원') continue;
      cityTotal += group.ids.length;
      cityDone += group.ids.filter(id => state.appointmentIds.has(id)).length;
    }
    const allDone = cityTotal > 0 && cityDone === cityTotal;

    html += `<div class="summon-city-card${allDone ? ' summon-city-card--done' : ''}">`;
    html += `<div class="summon-city-card__header">`;
    html += `<h4 class="summon-city-card__title">${i + 1}순위 — ${city.cityName} <span class="admin-city-card__province">(${city.province})</span></h4>`;
    html += `<span class="summon-city-card__progress">${cityDone}/${cityTotal} 임명완료</span>`;
    html += `</div>`;

    for (const group of city.groups) {
      if (group.ids.length === 0) continue;
      if (group.label === '방어요원') {
        html += `<hr class="appointment-divider">`;
      }
      html += `<div class="admin-role">`;
      html += `<span class="admin-role__label">${group.label}</span>`;
      html += `<div class="summon-officer-list">`;
      for (const officerId of group.ids) {
        const o = OFFICERS.find(x => x.id === officerId);
        if (!o) continue;
        const isDone = state.appointmentIds.has(officerId);
        html += `<button class="summon-officer${isDone ? ' summon-officer--done' : ''}" data-officer-id="${officerId}">`;
        html += `<span class="summon-officer__check">${isDone ? '&#10003;' : ''}</span>`;
        html += `<span class="summon-officer__name">${o.name}</span>`;
        html += `</button>`;
      }
      html += `</div></div>`;
    }

    html += `</div>`;
  }

  container.innerHTML = html;
}

// ===== RENDERING: Modal =====

function showOfficerModal(officerId) {
  const o = OFFICERS.find(x => x.id === officerId);
  if (!o) return;

  const content = document.getElementById('modal-content');

  const statNames = [
    { key: 'leadership', label: '통솔' },
    { key: 'power', label: '무력' },
    { key: 'intelligence', label: '지력' },
    { key: 'politics', label: '정치' },
    { key: 'charm', label: '매력' }
  ];

  let html = `
    <div class="modal-header">
      <h2>${o.name}</h2>
      <div class="modal-header__meta">주의: ${o.ideology} | 성별: ${o.gender} | 상성: ${o.affinity}</div>
    </div>
    <div class="modal-stats">
      ${statNames.map(s => `
        <div class="modal-stat">
          <span class="modal-stat__label">${s.label}</span>
          <span class="modal-stat__value ${getStatClass(o[s.key])}">${o[s.key]}</span>
        </div>
      `).join('')}
    </div>
    <div class="modal-section">
      <div class="modal-section__title">내정 적성</div>
      <div class="modal-affair-list">
        ${Object.entries(AFFAIRS_CONFIG).map(([key, cfg]) => {
          const score = o.scores[key];
          const pct = Math.min(score, 120);
          const cls = getScoreClass(score);
          return `<div class="modal-affair-item">
            <span class="modal-affair-item__icon">${cfg.icon}</span>
            <span class="modal-affair-item__name">${cfg.name}</span>
            <div class="modal-affair-item__bar ${cls}">
              <div class="modal-affair-item__bar-fill score-bar__fill" style="width:${pct}%"></div>
            </div>
            <span class="modal-affair-item__score ${cls.replace('score--', 'score-value ')}">${score}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section__title">개성</div>
      <div class="trait-badges">
        ${o.traits.length ? o.traits.map(t => `<span class="trait-badge trait-badge--normal">${t}</span>`).join('') : '<span style="color:var(--text-muted)">없음</span>'}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-section__title">전법</div>
      <div class="trait-badges">
        ${o.tactics.length ? o.tactics.map(t => `<span class="trait-badge trait-badge--support">${t}</span>`).join('') : '<span style="color:var(--text-muted)">없음</span>'}
      </div>
    </div>
    <div class="modal-section">
      <div class="modal-info">
        군단: <strong>${o.corps || '재야'}</strong> | 소속: ${o.faction} | 소재: ${o.location}<br>
        생년: ${o.birthYear} | 등장: ${o.appearYear} | 몰년: ${o.deathYear}
      </div>
    </div>
  `;

  content.innerHTML = html;
  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
}

// ===== HELPERS =====

function updateSortIndicators(tableId, sortState) {
  const table = document.getElementById(tableId);
  table.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortState.key) {
      th.classList.add(sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function populateDropdown(selectId, items, labelFn) {
  const select = document.getElementById(selectId);
  const firstOption = select.querySelector('option');
  select.innerHTML = '';
  select.appendChild(firstOption);
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = labelFn ? labelFn(item) : item;
    select.appendChild(opt);
  });
}

// ===== INITIALIZATION =====

function init() {
  // State export/import
  document.getElementById('state-export').addEventListener('click', exportState);
  document.getElementById('state-import').addEventListener('change', (e) => {
    if (e.target.files[0]) importState(e.target.files[0]);
  });

  precomputeScores();

  // Populate dropdowns
  populateDropdown('opt-corps', CORPS_LIST);
  populateDropdown('opt-location', LOCATIONS_LIST);
  populateDropdown('search-corps', CORPS_LIST);
  populateDropdown('search-location', LOCATIONS_LIST);
  populateDropdown('search-ideology', IDEOLOGIES_LIST);
  populateDropdown('search-trait', ALL_TRAITS);

  // 2-tier tab system
  function renderSubTabs(category) {
    const container = document.getElementById('tabs-sub');
    const tabs = TAB_CATEGORIES[category];
    container.innerHTML = tabs.map((t, i) =>
      `<button class="tab-sub${i === 0 ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`
    ).join('');
  }

  const tabScrollPositions = {};

  function activateTab(tabId) {
    // 이전 탭 스크롤 위치 저장
    if (state.currentTab) {
      tabScrollPositions[state.currentTab] = window.scrollY;
    }

    document.querySelectorAll('.tab-sub').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    const subBtn = document.querySelector(`.tab-sub[data-tab="${tabId}"]`);
    if (subBtn) subBtn.classList.add('active');

    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');

    state.currentTab = tabId;
    if (tabId === 'admin') renderAdminCitySlots();
    if (tabId === 'summon') renderSummonTab();
    if (tabId === 'appointment') renderAppointmentTab();

    // 새 탭 스크롤 위치 복원
    const savedScroll = tabScrollPositions[tabId];
    window.scrollTo(0, savedScroll || 0);
  }

  // Top-level category switching
  document.getElementById('tabs-top').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-top');
    if (!btn) return;
    const category = btn.dataset.category;

    document.querySelectorAll('.tab-top').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    state.currentCategory = category;
    renderSubTabs(category);

    const firstTab = TAB_CATEGORIES[category][0].id;
    activateTab(firstTab);
  });

  // Sub-tab switching (event delegation for dynamic buttons)
  document.getElementById('tabs-sub').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-sub');
    if (!btn) return;
    activateTab(btn.dataset.tab);
  });

  // Initial render of sub-tabs
  renderSubTabs('current');
  activateTab('roster');

  // Affair type switching
  document.querySelectorAll('.affair-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.affair-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentAffair = btn.dataset.affair;
      state.optimizeShown = PAGE_SIZE;
      state.optimizeSort = { key: 'score', dir: 'desc' };
      renderOptimizeTable();
    });
  });

  // Optimize filters
  ['opt-corps', 'opt-location', 'opt-min-stat'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      state.optimizeShown = PAGE_SIZE;
      renderOptimizeTable();
    });
  });

  document.getElementById('opt-reset').addEventListener('click', () => {
    document.getElementById('opt-corps').value = '';
    document.getElementById('opt-location').value = '';
    document.getElementById('opt-min-stat').value = '0';
    state.optimizeShown = PAGE_SIZE;
    renderOptimizeTable();
  });

  document.getElementById('opt-load-more').addEventListener('click', () => {
    state.optimizeShown += PAGE_SIZE;
    renderOptimizeTable();
  });

  // Optimize table sorting
  document.getElementById('opt-table').addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.optimizeSort.key === key) {
      state.optimizeSort.dir = state.optimizeSort.dir === 'desc' ? 'asc' : 'desc';
    } else {
      state.optimizeSort = { key, dir: 'desc' };
    }
    renderOptimizeTable();
  });

  // Search filters
  let searchTimeout;
  const searchNameInput = document.getElementById('search-name');

  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchShown = PAGE_SIZE;
      renderSearchTable();
    }, 200);
  }

  searchNameInput.addEventListener('input', handleSearchInput);
  searchNameInput.addEventListener('compositionend', handleSearchInput);

  ['search-gender', 'search-ideology', 'search-corps', 'search-location', 'search-trait'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      state.searchShown = PAGE_SIZE;
      renderSearchTable();
    });
  });

  document.getElementById('search-reset').addEventListener('click', () => {
    searchNameInput.value = '';
    document.getElementById('search-gender').value = '';
    document.getElementById('search-ideology').value = '';
    document.getElementById('search-corps').value = '';
    document.getElementById('search-location').value = '';
    document.getElementById('search-trait').value = '';
    state.searchShown = PAGE_SIZE;
    renderSearchTable();
  });

  document.getElementById('search-load-more').addEventListener('click', () => {
    state.searchShown += PAGE_SIZE;
    renderSearchTable();
  });

  // Search table sorting
  document.getElementById('search-table').addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.searchSort.key === key) {
      state.searchSort.dir = state.searchSort.dir === 'desc' ? 'asc' : 'desc';
    } else {
      state.searchSort = { key, dir: 'desc' };
    }
    renderSearchTable();
  });

  // Officer name clicks (delegation)
  document.addEventListener('click', (e) => {
    const nameEl = e.target.closest('.officer-name');
    if (nameEl) {
      showOfficerModal(parseInt(nameEl.dataset.id));
    }
  });

  // Modal
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Compare tab
  const compareInput = document.getElementById('compare-input');
  const autocomplete = document.getElementById('compare-autocomplete');

  compareInput.addEventListener('input', () => {
    const q = compareInput.value.trim();
    if (!q) {
      autocomplete.classList.remove('show');
      return;
    }
    const matches = OFFICERS.filter(o => matchesName(o, q) && !state.compareIds.includes(o.id)).slice(0, 8);
    if (matches.length === 0) {
      autocomplete.classList.remove('show');
      return;
    }
    autocomplete.innerHTML = matches.map(o =>
      `<div class="autocomplete-item" data-id="${o.id}">
        <span>${o.name}</span>
        <span class="autocomplete-item__stats">통${o.leadership} 무${o.power} 지${o.intelligence} 정${o.politics} 매${o.charm}</span>
      </div>`
    ).join('');
    autocomplete.classList.add('show');
  });

  compareInput.addEventListener('compositionend', () => {
    compareInput.dispatchEvent(new Event('input'));
  });

  autocomplete.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    const id = parseInt(item.dataset.id);
    if (state.compareIds.length >= 4) return;
    state.compareIds.push(id);
    compareInput.value = '';
    autocomplete.classList.remove('show');
    renderCompare();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.compare-search-wrap')) {
      autocomplete.classList.remove('show');
    }
  });

  document.getElementById('compare-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('.compare-chip__remove');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    state.compareIds = state.compareIds.filter(x => x !== id);
    renderCompare();
  });

  // Roster tab
  const rosterInput = document.getElementById('roster-input');
  const rosterAutocomplete = document.getElementById('roster-autocomplete');
  let rosterAcIndex = -1;

  function updateActiveItem(items, index) {
    items.forEach((el, i) => el.classList.toggle('active', i === index));
  }

  function flashInput(el, cls) {
    el.classList.remove('flash-success', 'flash-fail');
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
  }

  rosterInput.addEventListener('input', () => {
    rosterAcIndex = -1;
    const q = rosterInput.value.trim();
    if (!q) {
      rosterAutocomplete.innerHTML = '';
      rosterAutocomplete.classList.remove('show');
      return;
    }
    const matches = OFFICERS.filter(o => matchesName(o, q) && !state.rosterIds.includes(o.id)).slice(0, 8);
    if (matches.length === 0) {
      rosterAutocomplete.innerHTML = '';
      rosterAutocomplete.classList.remove('show');
      return;
    }
    rosterAutocomplete.innerHTML = matches.map(o =>
      `<div class="autocomplete-item" data-id="${o.id}">
        <span>${o.name}</span>
        <span class="autocomplete-item__stats">통${o.leadership} 무${o.power} 지${o.intelligence} 정${o.politics} 매${o.charm}</span>
      </div>`
    ).join('');
    rosterAutocomplete.classList.add('show');
  });

  rosterInput.addEventListener('compositionend', () => {
    rosterInput.dispatchEvent(new Event('input'));
  });

  rosterInput.addEventListener('keydown', (e) => {
    if (e.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const items = rosterAutocomplete.querySelectorAll('.autocomplete-item');
      if (items.length) {
        const target = rosterAcIndex >= 0 ? items[rosterAcIndex] : items[0];
        if (target) { target.click(); flashInput(rosterInput, 'flash-success'); }
      } else if (rosterInput.value.trim()) {
        flashInput(rosterInput, 'flash-fail');
      }
      return;
    }

    const items = rosterAutocomplete.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      rosterAcIndex = Math.min(rosterAcIndex + 1, items.length - 1);
      updateActiveItem(items, rosterAcIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      rosterAcIndex = Math.max(rosterAcIndex - 1, 0);
      updateActiveItem(items, rosterAcIndex);
    } else if (e.key === 'Escape') {
      rosterAutocomplete.classList.remove('show');
      rosterAcIndex = -1;
    }
  });

  rosterAutocomplete.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    const id = parseInt(item.dataset.id);
    if (state.rosterIds.includes(id)) return;
    state.rosterIds.push(id);
    saveRoster();
    rosterInput.value = '';
    rosterAutocomplete.innerHTML = '';
    rosterAutocomplete.classList.remove('show');
    renderRoster();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#tab-roster .compare-search-wrap')) {
      rosterAutocomplete.classList.remove('show');
    }
  });

  document.getElementById('roster-tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('.roster-remove');
    if (!btn) return;
    const id = parseInt(btn.dataset.id);
    state.rosterIds = state.rosterIds.filter(x => x !== id);
    saveRoster();
    renderRoster();
  });

  document.getElementById('roster-table').addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const key = th.dataset.sort;
    if (state.rosterSort.key === key) {
      state.rosterSort.dir = state.rosterSort.dir === 'desc' ? 'asc' : 'desc';
    } else {
      state.rosterSort = { key, dir: 'desc' };
    }
    renderRoster();
  });

  document.getElementById('roster-clear').addEventListener('click', () => {
    if (state.rosterIds.length === 0) return;
    state.rosterIds = [];
    saveRoster();
    renderRoster();
  });

  // ===== Cities Tab =====
  const citiesInput = document.getElementById('cities-input');
  const citiesAutocomplete = document.getElementById('cities-autocomplete');
  let citiesAcIndex = -1;

  citiesInput.addEventListener('input', () => {
    citiesAcIndex = -1;
    const q = citiesInput.value.trim();
    if (!q) {
      citiesAutocomplete.innerHTML = '';
      citiesAutocomplete.classList.remove('show');
      return;
    }
    const matches = CITIES.filter(c =>
      c.name.includes(q) && !state.ownedCityIds.includes(c.id)
    ).slice(0, 8);
    if (matches.length === 0) {
      citiesAutocomplete.innerHTML = '';
      citiesAutocomplete.classList.remove('show');
      return;
    }
    citiesAutocomplete.innerHTML = matches.map(c =>
      `<div class="autocomplete-item" data-id="${c.id}">
        <span>${c.name}</span>
        <span class="autocomplete-item__stats">${c.province} | 지역내정 ${c.regionSlots}</span>
      </div>`
    ).join('');
    citiesAutocomplete.classList.add('show');
  });

  citiesInput.addEventListener('compositionend', () => {
    citiesInput.dispatchEvent(new Event('input'));
  });

  citiesInput.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const items = citiesAutocomplete.querySelectorAll('.autocomplete-item');
      if (items.length) {
        const target = citiesAcIndex >= 0 ? items[citiesAcIndex] : items[0];
        if (target) { target.click(); flashInput(citiesInput, 'flash-success'); }
      } else if (citiesInput.value.trim()) {
        flashInput(citiesInput, 'flash-fail');
      }
      return;
    }
    const items = citiesAutocomplete.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      citiesAcIndex = Math.min(citiesAcIndex + 1, items.length - 1);
      updateActiveItem(items, citiesAcIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      citiesAcIndex = Math.max(citiesAcIndex - 1, 0);
      updateActiveItem(items, citiesAcIndex);
    } else if (e.key === 'Escape') {
      citiesAutocomplete.classList.remove('show');
      citiesAcIndex = -1;
    }
  });

  citiesAutocomplete.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    const id = parseInt(item.dataset.id);
    if (state.ownedCityIds.includes(id)) return;
    state.ownedCityIds.push(id);
    saveCities();
    citiesInput.value = '';
    citiesAutocomplete.innerHTML = '';
    citiesAutocomplete.classList.remove('show');
    renderCities();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#tab-cities .compare-search-wrap')) {
      citiesAutocomplete.classList.remove('show');
    }
  });

  document.getElementById('cities-tbody').addEventListener('click', (e) => {
    const moveUp = e.target.closest('.city-move-up');
    const moveDown = e.target.closest('.city-move-down');
    const remove = e.target.closest('.roster-remove');

    if (moveUp) {
      const id = parseInt(moveUp.dataset.id);
      const idx = state.ownedCityIds.indexOf(id);
      if (idx > 0) {
        [state.ownedCityIds[idx - 1], state.ownedCityIds[idx]] =
          [state.ownedCityIds[idx], state.ownedCityIds[idx - 1]];
        saveCities();
        renderCities();
      }
    } else if (moveDown) {
      const id = parseInt(moveDown.dataset.id);
      const idx = state.ownedCityIds.indexOf(id);
      if (idx < state.ownedCityIds.length - 1) {
        [state.ownedCityIds[idx], state.ownedCityIds[idx + 1]] =
          [state.ownedCityIds[idx + 1], state.ownedCityIds[idx]];
        saveCities();
        renderCities();
      }
    } else if (remove) {
      const id = parseInt(remove.dataset.id);
      state.ownedCityIds = state.ownedCityIds.filter(x => x !== id);
      saveCities();
      renderCities();
    }
  });

  document.getElementById('cities-clear').addEventListener('click', () => {
    if (state.ownedCityIds.length === 0) return;
    state.ownedCityIds = [];
    saveCities();
    renderCities();
  });

  // ===== Corps Tab =====
  document.getElementById('corps-add-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('corps-name-input');
    const name = nameInput.value.trim();
    if (!name) {
      flashInput(nameInput, 'flash-fail');
      return;
    }
    const role = document.getElementById('corps-role-select').value;
    state.corps.push({
      id: state.corpsNextId++,
      name,
      role,
      ranks: [],
      rankNextId: 1,
      sourceCity: null,
      targetCity: null
    });
    saveCorps();
    nameInput.value = '';
    renderCorpsList();
  });

  // Corps event delegation
  const corpsList = document.getElementById('corps-list');

  corpsList.addEventListener('click', (e) => {
    // Delete corps
    const deleteBtn = e.target.closest('.corps-card__delete');
    if (deleteBtn) {
      const corpsId = parseInt(deleteBtn.dataset.corpsId);
      state.corps = state.corps.filter(c => c.id !== corpsId);
      saveCorps();
      renderCorpsList();
      return;
    }

    // Add rank
    const rankAddBtn = e.target.closest('.corps-rank-add-btn');
    if (rankAddBtn) {
      const corpsId = parseInt(rankAddBtn.dataset.corpsId);
      const corps = state.corps.find(c => c.id === corpsId);
      const input = rankAddBtn.parentElement.querySelector('.corps-rank-input');
      const name = input ? input.value.trim() : '';
      if (!name || !corps) {
        if (input) flashInput(input, 'flash-fail');
        return;
      }
      corps.ranks.push({ id: corps.rankNextId++, name, memberIds: [] });
      saveCorps();
      renderCorpsList();
      return;
    }

    // Delete rank
    const rankDeleteBtn = e.target.closest('.corps-rank__delete');
    if (rankDeleteBtn) {
      const corpsId = parseInt(rankDeleteBtn.dataset.corpsId);
      const rankId = parseInt(rankDeleteBtn.dataset.rankId);
      const corps = state.corps.find(c => c.id === corpsId);
      if (corps) {
        corps.ranks = corps.ranks.filter(r => r.id !== rankId);
        saveCorps();
        renderCorpsList();
      }
      return;
    }

    // Move member up
    const moveUp = e.target.closest('.corps-member-up');
    if (moveUp) {
      const corpsId = parseInt(moveUp.dataset.corpsId);
      const rankId = parseInt(moveUp.dataset.rankId);
      const officerId = parseInt(moveUp.dataset.officerId);
      const corps = state.corps.find(c => c.id === corpsId);
      const rank = corps && corps.ranks.find(r => r.id === rankId);
      if (rank) {
        const idx = rank.memberIds.indexOf(officerId);
        if (idx > 0) {
          [rank.memberIds[idx - 1], rank.memberIds[idx]] =
            [rank.memberIds[idx], rank.memberIds[idx - 1]];
          saveCorps();
          renderCorpsList();
        }
      }
      return;
    }

    // Move member down
    const moveDown = e.target.closest('.corps-member-down');
    if (moveDown) {
      const corpsId = parseInt(moveDown.dataset.corpsId);
      const rankId = parseInt(moveDown.dataset.rankId);
      const officerId = parseInt(moveDown.dataset.officerId);
      const corps = state.corps.find(c => c.id === corpsId);
      const rank = corps && corps.ranks.find(r => r.id === rankId);
      if (rank) {
        const idx = rank.memberIds.indexOf(officerId);
        if (idx < rank.memberIds.length - 1) {
          [rank.memberIds[idx], rank.memberIds[idx + 1]] =
            [rank.memberIds[idx + 1], rank.memberIds[idx]];
          saveCorps();
          renderCorpsList();
        }
      }
      return;
    }

    // Remove member
    const removeBtn = e.target.closest('.corps-member__remove');
    if (removeBtn) {
      const corpsId = parseInt(removeBtn.dataset.corpsId);
      const rankId = parseInt(removeBtn.dataset.rankId);
      const officerId = parseInt(removeBtn.dataset.officerId);
      const corps = state.corps.find(c => c.id === corpsId);
      const rank = corps && corps.ranks.find(r => r.id === rankId);
      if (rank) {
        rank.memberIds = rank.memberIds.filter(id => id !== officerId);
        saveCorps();
        renderCorpsList({ corpsId, rankId });
      }
      return;
    }

    // Autocomplete item click — add member to rank
    const acItem = e.target.closest('.corps-member-autocomplete .autocomplete-item');
    if (acItem) {
      const corpsId = parseInt(acItem.dataset.corpsId);
      const rankId = parseInt(acItem.dataset.rankId);
      const officerId = parseInt(acItem.dataset.officerId);
      const corps = state.corps.find(c => c.id === corpsId);
      const rank = corps && corps.ranks.find(r => r.id === rankId);
      if (rank && !rank.memberIds.includes(officerId)) {
        rank.memberIds.push(officerId);
        saveCorps();
        renderCorpsList({ corpsId, rankId });
      }
    }
  });

  // Enter key on rank-add input
  corpsList.addEventListener('keydown', (e) => {
    const rankInput = e.target.closest('.corps-rank-input');
    if (rankInput && !e.isComposing && e.key === 'Enter') {
      e.preventDefault();
      const addBtn = rankInput.parentElement.querySelector('.corps-rank-add-btn');
      if (addBtn) addBtn.click();
      return;
    }

    const input = e.target.closest('.corps-member-input');
    if (!input || e.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const acList = input.parentElement.querySelector('.corps-member-autocomplete');
      const items = acList.querySelectorAll('.autocomplete-item');
      if (items.length) {
        items[0].click();
      }
      return;
    }
    if (e.key === 'Escape') {
      const acList = input.parentElement.querySelector('.corps-member-autocomplete');
      acList.classList.remove('show');
    }
  });

  corpsList.addEventListener('input', (e) => {
    const input = e.target.closest('.corps-member-input');
    if (!input) return;

    const corpsId = parseInt(input.dataset.corpsId);
    const rankId = parseInt(input.dataset.rankId);
    const acList = input.parentElement.querySelector('.corps-member-autocomplete');
    const q = input.value.trim();

    if (!q) {
      acList.innerHTML = '';
      acList.classList.remove('show');
      return;
    }

    const assignedIds = getAssignedOfficerIds();
    const matches = OFFICERS.filter(o =>
      matchesName(o, q) &&
      state.rosterIds.includes(o.id) &&
      !assignedIds.has(o.id)
    ).slice(0, 8);

    if (matches.length === 0) {
      acList.innerHTML = '';
      acList.classList.remove('show');
      return;
    }

    acList.innerHTML = matches.map(o =>
      `<div class="autocomplete-item" data-corps-id="${corpsId}" data-rank-id="${rankId}" data-officer-id="${o.id}">
        <span>${o.name}</span>
        <span class="autocomplete-item__stats">통${o.leadership} 무${o.power} 지${o.intelligence} 정${o.politics}</span>
      </div>`
    ).join('');
    acList.classList.add('show');
  });

  corpsList.addEventListener('compositionend', (e) => {
    const input = e.target.closest('.corps-member-input');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  corpsList.addEventListener('change', (e) => {
    const sourceSelect = e.target.closest('.corps-source-city');
    if (sourceSelect) {
      const corpsId = parseInt(sourceSelect.dataset.corpsId);
      const corps = state.corps.find(c => c.id === corpsId);
      if (corps) {
        corps.sourceCity = sourceSelect.value ? parseInt(sourceSelect.value) : null;
        saveCorps();
      }
      return;
    }
    const targetSelect = e.target.closest('.corps-target-city');
    if (targetSelect) {
      const corpsId = parseInt(targetSelect.dataset.corpsId);
      const corps = state.corps.find(c => c.id === corpsId);
      if (corps) {
        corps.targetCity = targetSelect.value ? parseInt(targetSelect.value) : null;
        saveCorps();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.corps-search-wrap')) {
      document.querySelectorAll('.corps-member-autocomplete').forEach(el => el.classList.remove('show'));
    }
  });

  // ===== Admin Tab =====
  ['trade-ansik', 'trade-cheonchuk', 'trade-daejin', 'trade-guisang'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('change', () => {
      const key = id.replace('trade-', '');
      state.tradeNations[key] = el.checked;
      saveTradeNations();
      renderTradeConfig();
    });
  });

  document.getElementById('admin-run-btn').addEventListener('click', () => {
    state.assignmentResult = runAssignment();
    renderAssignmentResults(state.assignmentResult);
    renderSummonTab();
    renderAppointmentTab();
  });

  // City recruit checkboxes
  const adminCitySlots = document.getElementById('admin-city-slots');
  adminCitySlots.addEventListener('change', (e) => {
    const checkbox = e.target.closest('.city-recruit-checkbox');
    if (!checkbox) return;
    const cityId = parseInt(checkbox.dataset.cityId);
    if (checkbox.checked) {
      delete state.cityRecruitDisabled[cityId];
    } else {
      state.cityRecruitDisabled[cityId] = true;
    }
    saveCityRecruit();
  });

  // City slot overrides
  adminCitySlots.addEventListener('input', (e) => {
    const input = e.target.closest('.city-slot-input');
    if (!input) return;
    const cityId = parseInt(input.dataset.cityId);
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0) return;
    const city = CITIES.find(c => c.id === cityId);
    if (!city) return;
    if (val === city.regionSlots) {
      delete state.citySlotOverrides[cityId];
    } else {
      state.citySlotOverrides[cityId] = val;
    }
    saveCitySlots();
    renderAdminCitySlots();
  });

  adminCitySlots.addEventListener('click', (e) => {
    const resetBtn = e.target.closest('.city-slot-reset');
    if (!resetBtn) return;
    const cityId = parseInt(resetBtn.dataset.cityId);
    delete state.citySlotOverrides[cityId];
    saveCitySlots();
    renderAdminCitySlots();
  });

  // ===== Manual trade events =====
  const tradeManualEl = document.getElementById('trade-manual-config');

  tradeManualEl.addEventListener('input', (e) => {
    const input = e.target.closest('.trade-manual__input');
    if (!input) return;

    const nation = input.dataset.nation;
    const acList = input.parentElement.querySelector('.trade-manual-autocomplete');
    const q = input.value.trim();

    if (!q) {
      acList.innerHTML = '';
      acList.classList.remove('show');
      return;
    }

    const assignedIds = getAssignedOfficerIds();
    const allManualIds = new Set();
    for (const ids of Object.values(state.manualTrade)) {
      for (const id of ids) allManualIds.add(id);
    }

    const matches = OFFICERS.filter(o =>
      matchesName(o, q) &&
      state.rosterIds.includes(o.id) &&
      !assignedIds.has(o.id) &&
      !allManualIds.has(o.id)
    ).slice(0, 8);

    if (matches.length === 0) {
      acList.innerHTML = '';
      acList.classList.remove('show');
      return;
    }

    acList.innerHTML = matches.map(o =>
      `<div class="autocomplete-item" data-nation="${nation}" data-officer-id="${o.id}">
        <span>${o.name}</span>
        <span class="autocomplete-item__stats">지정${o.intelligence + o.politics}</span>
      </div>`
    ).join('');
    acList.classList.add('show');
  });

  tradeManualEl.addEventListener('compositionend', (e) => {
    const input = e.target.closest('.trade-manual__input');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  tradeManualEl.addEventListener('click', (e) => {
    // 자동완성 항목 클릭 → 추가
    const acItem = e.target.closest('.autocomplete-item');
    if (acItem) {
      const nation = acItem.dataset.nation;
      const officerId = parseInt(acItem.dataset.officerId);
      if (!state.manualTrade[nation]) state.manualTrade[nation] = [];
      if (!state.manualTrade[nation].includes(officerId)) {
        state.manualTrade[nation].push(officerId);
        saveManualTrade();
        renderTradeConfig();
      }
      return;
    }

    // 제거 버튼 클릭
    const removeBtn = e.target.closest('.trade-manual__chip-remove');
    if (removeBtn) {
      const nation = removeBtn.dataset.nation;
      const officerId = parseInt(removeBtn.dataset.officerId);
      state.manualTrade[nation] = (state.manualTrade[nation] || []).filter(id => id !== officerId);
      saveManualTrade();
      renderTradeConfig();
      return;
    }
  });

  tradeManualEl.addEventListener('keydown', (e) => {
    const input = e.target.closest('.trade-manual__input');
    if (!input) return;
    if (e.key === 'Escape') {
      const acList = input.parentElement.querySelector('.trade-manual-autocomplete');
      acList.classList.remove('show');
    }
    if (e.key === 'Enter') {
      const acList = input.parentElement.querySelector('.trade-manual-autocomplete');
      const first = acList.querySelector('.autocomplete-item');
      if (first) first.click();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.trade-manual__search')) {
      document.querySelectorAll('.trade-manual-autocomplete').forEach(el => el.classList.remove('show'));
    }
  });

  // ===== Summon tab events =====
  document.getElementById('summon-content').addEventListener('click', (e) => {
    const officerBtn = e.target.closest('.summon-officer');
    if (officerBtn) {
      const officerId = parseInt(officerBtn.dataset.officerId);
      if (state.summonedIds.has(officerId)) {
        state.summonedIds.delete(officerId);
      } else {
        state.summonedIds.add(officerId);
      }
      saveSummon();
      renderSummonTab();
      return;
    }

    if (e.target.closest('#summon-reset-btn')) {
      state.summonedIds.clear();
      saveSummon();
      renderSummonTab();
    }
  });

  // ===== Appointment tab events =====
  document.getElementById('appointment-content').addEventListener('click', (e) => {
    const officerBtn = e.target.closest('.summon-officer');
    if (officerBtn) {
      const officerId = parseInt(officerBtn.dataset.officerId);
      if (state.appointmentIds.has(officerId)) {
        state.appointmentIds.delete(officerId);
      } else {
        state.appointmentIds.add(officerId);
      }
      saveAppointment();
      renderAppointmentTab();
      return;
    }

    if (e.target.closest('#appointment-reset-btn')) {
      state.appointmentIds.clear();
      saveAppointment();
      renderAppointmentTab();
    }
  });

  // ===== Load all persistence & initial render =====
  loadRoster();
  loadCities();
  loadCorps();
  loadTradeNations();
  loadManualTrade();
  loadCitySlots();
  loadCityRecruit();
  loadSummon();
  loadAppointment();

  // Restore trade checkboxes
  document.getElementById('trade-ansik').checked = state.tradeNations.ansik;
  document.getElementById('trade-cheonchuk').checked = state.tradeNations.cheonchuk;
  document.getElementById('trade-daejin').checked = state.tradeNations.daejin;
  document.getElementById('trade-guisang').checked = state.tradeNations.guisang;

  renderOptimizeTable();
  renderSearchTable();
  renderRoster();
  renderCities();
  renderCorpsList();
  renderAdminCitySlots();
  renderTradeConfig();
}

document.addEventListener('DOMContentLoaded', init);
