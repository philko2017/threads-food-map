(() => {
  'use strict';

  const cfg = window.FOOD_MAP_CONFIG || {};
  const VISIBLE_STATUSES = new Set(['確認中', '已確認', '待修改']);
  const GENERIC_CATEGORIES = new Set(['小吃', '餐廳', '甜點', '伴手禮', '酒吧居酒屋', '']);

  function normalizeSingleTag(tag) {
    const t = String(tag || '').trim();
    if (!t) return '';
    if (t === '麵線' || t === '素麵線' || t === '麵線糊' || t.includes('麵線')) return '麵線';
    if (t === '古早味美食') return '古早味點心';
    if (t === '港式創意私房料理') return '異國美食';
    return t;
  }

  function parseStoreTags(store) {
    const raw = String(store['類別'] || '').trim();
    const parts = raw.split(/[,、，/]+/).map((p) => p.trim()).filter(Boolean);
    const tags = [];
    const addTag = (t) => {
      const norm = normalizeSingleTag(t);
      if (norm && !tags.includes(norm)) tags.push(norm);
    };

    const text = `${store['店名'] || ''} ${store['一句話介紹'] || ''}`;
    const specialtyRules = [
      [/臭豆腐/, '臭豆腐'],
      [/麵線/, '麵線'],
      [/鹹酥雞|鹽酥雞/, '鹹酥雞'],
      [/蔥抓餅|蔥油抓餅/, '蔥抓餅'],
      [/蔥油餅/, '蔥油餅'],
      [/白糖粿|狀元糕|紅豆餅|車輪餅|地瓜球|粉粿|雞蛋糕|麻糬|豆花|蘿蔔糕|糯米炸|古早味點心/, '古早味點心'],
      [/早午餐/, '早午餐'],
      [/臭臭鍋|鴨血煲|火鍋/, '火鍋'],
      [/河粉|越式|墨西哥|捲餅|塔可|港式|韓式|印度|泰式|拿坡里|希臘|和食|日本神戶/, '異國美食'],
      [/串炸|串揚/, '串炸居酒屋'],
      [/創意料理/, '創意料理'],
      [/芒果乾|梅肉|伴手禮|肉脯|肉鬆|囍餅|喜餅|餅行|餅店/, '伴手禮'],
      [/手路菜|辦桌/, '手路菜'],
      [/茶葉|製茶|茶行/, '茶葉'],
      [/咖啡|珈琲/, '咖啡'],
    ];

    parts.forEach((p) => {
      if (!GENERIC_CATEGORIES.has(p)) {
        addTag(p);
      } else {
        let matched = false;
        specialtyRules.forEach(([re, tag]) => {
          if (re.test(text)) {
            addTag(tag);
            matched = true;
          }
        });
        if (!matched) addTag(p);
      }
    });

    // 跨品項／老店複選補充（即使原本已有主分類，仍補齊兼具的特色標籤）
    if (/臭豆腐/.test(text)) addTag('臭豆腐');
    if (/麵線/.test(text)) addTag('麵線');
    if (/臭臭鍋|鴨血煲|火鍋/.test(text)) addTag('火鍋');
    if (/早午餐/.test(text)) addTag('早午餐');
    if (/咖啡|珈琲/.test(text)) addTag('咖啡');
    if (/越式|墨西哥|港式|韓式|印度|泰式|拿坡里|希臘|日本神戶/.test(text)) addTag('異國美食');
    if (/(1895|1916|1921|1923|1957|1976|50年|60年|62年|66年|百年)/.test(text)) addTag('50年以上老店');
    if (/餅店|餅行|囍餅|喜餅|白糖粿|麻糬|豆花|粉粿|紅豆餅|車輪餅|地瓜球|雞蛋糕|狀元糕|蘿蔔糕|糯米炸/.test(text) && !tags.includes('古早味點心')) {
      addTag('古早味點心');
    }

    if (tags.length === 0) addTag('小吃');
    return tags;
  }

  function enrichStore(store) {
    const _tags = parseStoreTags(store);
    return {
      ...store,
      _tags,
      '類別': _tags.join(', '),
    };
  }

  // 台灣各縣市代表座標（供純宅配或尚無經緯度的店家在地圖上顯示大概位置）
  const CITY_CENTERS = {
    '台北市': [25.0330, 121.5654],
    '新北市': [25.0120, 121.4657],
    '基隆市': [25.1276, 121.7392],
    '桃園市': [24.9936, 121.3010],
    '新竹市': [24.8138, 120.9675],
    '新竹縣': [24.8387, 121.0177],
    '苗栗縣': [24.5602, 120.8214],
    '台中市': [24.1477, 120.6736],
    '彰化縣': [24.0518, 120.5161],
    '南投縣': [23.9609, 120.9719],
    '雲林縣': [23.7092, 120.4313],
    '嘉義市': [23.4801, 120.4491],
    '嘉義縣': [23.4518, 120.2555],
    '台南市': [22.9997, 120.2270],
    '高雄市': [22.6273, 120.3014],
    '屏東縣': [22.5519, 120.5487],
    '宜蘭縣': [24.7021, 121.7377],
    '花蓮縣': [23.9872, 121.6016],
    '台東縣': [22.7972, 121.0714],
    '澎湖縣': [23.5712, 119.5793],
    '金門縣': [24.4493, 118.3767],
    '連江縣': [26.1505, 119.9297],
  };

  // 示範資料（尚未設定 SHEET_CSV_URL 時顯示）
  const DEMO_STORES = [
    {
      '編號': 'FM-DEMO01',
      '送出時間': '2026-11-18T10:00:00+08:00',
      '店名': '巷口手沖咖啡',
      '類別': '咖啡',
      '有沒有實體店面': '是',
      '縣市': '台北市',
      '區': '大安區',
      '地址': '忠孝東路四段100號',
      'Threads 帳號': 'its.all.good.73',
      'IG 帳號': 'its.all.good.73',
      '一句話介紹': '自家烘焙淺焙豆與肉桂捲',
      '電話': '02-2700-0001',
      '營業時間': '10:00-19:00',
      '緯度': '25.0418',
      '經度': '121.5462',
      '狀態': '已確認',
    },
    {
      '編號': 'FM-DEMO02',
      '送出時間': '2026-11-18T11:30:00+08:00',
      '店名': '阿嬤古早味布朗尼',
      '類別': '甜點',
      '有沒有實體店面': '否',
      '縣市': '新北市',
      '區': '板橋區',
      '地址': '',
      'Threads 帳號': 'its.all.good.73',
      'IG 帳號': '',
      '一句話介紹': '純宅配低糖生巧克力布朗尼',
      '電話': '',
      '營業時間': '週一至週五出貨',
      '緯度': '',
      '經度': '',
      '狀態': '確認中',
    },
    {
      '編號': 'FM-DEMO03',
      '送出時間': '2026-11-18T12:15:00+08:00',
      '店名': '深夜乾麵攤',
      '類別': '小吃',
      '有沒有實體店面': '是',
      '縣市': '台中市',
      '區': '西區',
      '地址': '公益路155號',
      'Threads 帳號': '',
      'IG 帳號': 'its.all.good.73',
      '一句話介紹': '手打麵條配秘製辣油',
      '電話': '',
      '營業時間': '18:00-01:00',
      '緯度': '24.1508',
      '經度': '120.6626',
      '狀態': '確認中',
    },
  ];

  const PUBLIC_RULES_HTML = `
    <div class="rules-section">
      <h4>收錄條件（四項都符合）</h4>
      <ol>
        <li><strong>查得到</strong>：Threads、IG 或 Google 地圖至少一個管道，看得到店家正在營業、有近期貼文。</li>
        <li><strong>是吃的</strong>：餐廳、小吃、咖啡、甜點、飲料、烘焙，以及可以直接吃的伴手禮。</li>
        <li><strong>公開或經同意</strong>：整理自店家公開社群／地圖資訊，或由店家本人與熱心網友登錄。</li>
        <li><strong>資料齊全</strong>：店名、類別、地區，加上至少一個聯絡管道。</li>
      </ol>
      <h4>不收錄，會直接下架</h4>
      <ul>
        <li>借地圖推銷非美食內容：投資理財、加盟招募、課程、直銷、借貸、代購</li>
        <li>高風險商品：電子菸、標榜療效的保健食品、成人或賭博相關</li>
        <li>假店家：帳號不存在、剛開的空帳號、冒用他人店名</li>
        <li>聯絡方式導向不明網址或要求私下匯款</li>
        <li>內容有歧視或攻擊其他店家</li>
      </ul>
      <h4>會請你修改，店家仍留在地圖上</h4>
      <ul>
        <li>地址查不到或定位錯誤、類別選錯、介紹全是廣告詞、同一家店登錄兩次（會合併成一筆）</li>
      </ul>
      <h4>狀態標籤的意思</h4>
      <ul>
        <li><strong>確認中</strong>：已上架，三天內完成審核</li>
        <li><strong>已確認</strong>：通過審核，標籤拿掉</li>
        <li><strong>待修改</strong>：資料需要更正，會私訊通知你</li>
      </ul>
    </div>
  `;

  const state = {
    allStores: [],
    filteredStores: [],
    selectedCategory: '全部',
    selectedCity: '全部',
    searchQuery: '',
    sortBy: 'newest',
    activeStore: null,
    lastSubmittedStore: null,
    shareTargetStore: null,
    map: null,
    clusterGroup: null,
    markersById: new Map(),
    user: {
      loggedIn: false,
      isDemo: false,
      userId: '',
      displayName: '',
      pictureUrl: '',
      role: '食客',
      points: 0,
      level: '🌱 新芽',
      visitedToday: [],
      sharesToday: 0,
    },
    popularityMap: {},
  };

  function getLevelByPoints(pts) {
    if (pts >= 100) return '🏆 互推達人';
    if (pts >= 20) return '🔥 熱心店家';
    return '🌱 新芽';
  }

  function getStorePopularity(store) {
    const id = store['編號'];
    if (state.popularityMap[id] != null) return state.popularityMap[id];
    const fromSheet = parseInt(store['人氣值'] || '0', 10);
    return Number.isNaN(fromSheet) ? 0 : fromSheet;
  }

  // 工具函式
  function initAnalytics() {
    const gaId = String(cfg.GA_MEASUREMENT_ID || '').trim();
    if (!/^G-[A-Z0-9]{4,20}$/i.test(gaId)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  }

  function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  function renderLaunchDateBanner() {
    const todayEl = document.getElementById('stat-today');
    const dayEl = document.getElementById('stat-launch-day');
    if (!todayEl || !dayEl) return;

    const launchStr = String(cfg.LAUNCH_DATE || '2026-11-18').trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(launchStr);
    const launchUtc = match
      ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : Date.UTC(2026, 10, 18);

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = Number(parts.find((p) => p.type === 'year').value);
    const m = Number(parts.find((p) => p.type === 'month').value);
    const d = Number(parts.find((p) => p.type === 'day').value);

    const pad = (n) => String(n).padStart(2, '0');
    todayEl.textContent = `${y}/${pad(m)}/${pad(d)}`;

    const todayUtc = Date.UTC(y, m - 1, d);
    const dayNum = Math.max(1, Math.floor((todayUtc - launchUtc) / 86400000) + 1);
    dayEl.textContent = dayNum.toLocaleString('zh-TW');
  }

  async function initVisitCounter() {
    const apiUrl = String(cfg.COUNTER_API_URL || '').trim();
    if (!apiUrl || apiUrl === '__COUNTER_API_URL__' || !isAllowedEndpointUrl(apiUrl)) return;

    const bar = document.getElementById('visit-stats-counts');
    const visitorsEl = document.getElementById('stat-visitors');
    const viewsEl = document.getElementById('stat-views');
    if (!bar || !visitorsEl || !viewsEl) return;

    const host = window.location.hostname || '';
    const isLocal = !host || host === 'localhost' || host === '127.0.0.1';
    const visitorKey = 'tfm_visitor_counted_v2';
    const cacheKey = 'tfm_visit_stats_cache_v2';

    let alreadyVisited = false;
    let cachedStats = null;
    try {
      alreadyVisited = window.localStorage.getItem(visitorKey) === '1';
      const rawCache = window.localStorage.getItem(cacheKey);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (parsed && typeof parsed.views === 'number' && typeof parsed.visitors === 'number') {
          cachedStats = parsed;
        }
      }
    } catch (_) {
      alreadyVisited = false;
    }

    function renderStats(visitors, views) {
      const safeViews = Math.max(views, visitors);
      const safeVisitors = Math.min(visitors, safeViews);
      visitorsEl.textContent = safeVisitors.toLocaleString('zh-TW');
      viewsEl.textContent = safeViews.toLocaleString('zh-TW');
      bar.classList.remove('hidden');
      try {
        window.localStorage.setItem(cacheKey, JSON.stringify({ visitors: safeVisitors, views: safeViews }));
      } catch (_) { }
    }

    if (cachedStats) {
      renderStats(cachedStats.visitors, cachedStats.views);
    }

    const mode = isLocal ? 'get' : (alreadyVisited ? 'view' : 'hit');
    const sep = apiUrl.includes('?') ? '&' : '?';

    async function requestCounter(timeoutMs = 8000) {
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
      try {
        const res = await fetch(`${apiUrl}${sep}mode=${mode}&_t=${Date.now()}`, {
          method: 'GET',
          signal: ctrl ? ctrl.signal : undefined,
        });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        if (!data || !data.ok || typeof data.visitors !== 'number' || typeof data.views !== 'number') {
          return null;
        }
        return data;
      } catch (_) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    try {
      let data = await requestCounter();
      if (!data) {
        await new Promise((r) => setTimeout(r, 800));
        data = await requestCounter();
      }
      if (!data) return;

      if (mode === 'hit') {
        try { window.localStorage.setItem(visitorKey, '1'); } catch (_) { }
      }
      renderStats(data.visitors, data.views);
    } catch (err) {
      console.warn('載入瀏覽計數器失敗:', err);
    }
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isValidSocialHandle(handle) {
    return /^[a-zA-Z0-9._]{1,60}$/.test(String(handle || ''));
  }

  function sanitizePhoneHref(phone) {
    const cleaned = String(phone || '').replace(/[^\d+\-()#\s]/g, '').trim();
    return /\d{5,}/.test(cleaned) ? cleaned : '';
  }

  function isValidPhone(phone) {
    return /^[0-9+\-()#\s]{5,30}$/.test(String(phone || '').trim());
  }

  function isAllowedEndpointUrl(rawUrl, { allowRelative = false } = {}) {
    const val = String(rawUrl || '').trim();
    if (!val) return false;
    if (allowRelative && (val.startsWith('./') || val.startsWith('/'))) return true;
    try {
      const parsed = new URL(val);
      if (parsed.protocol === 'https:') return true;
      if (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    if (rows.length < 2) return [];
    const headers = rows[0].map((h) => h.trim());
    const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
    return rows.slice(1).filter((r) => r.some((c) => c.trim() !== '')).map((r) => {
      const obj = Object.create(null);
      headers.forEach((h, idx) => {
        if (h && !FORBIDDEN_KEYS.has(h)) {
          obj[h] = (r[idx] || '').trim();
        }
      });
      return obj;
    });
  }

  function getStoreCoords(store) {
    const lat = parseFloat(store['緯度']);
    const lng = parseFloat(store['經度']);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng, exact: true };
    }
    const center = CITY_CENTERS[store['縣市']];
    if (center) {
      // 同一縣市的無座標店家做微小偏移，避免完全重疊
      const seed = (store['編號'] || store['店名'] || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const offsetLat = ((seed % 11) - 5) * 0.0025;
      const offsetLng = (((seed >> 3) % 11) - 5) * 0.0025;
      return { lat: center[0] + offsetLat, lng: center[1] + offsetLng, exact: false };
    }
    return null;
  }

  function getStoreShareUrl(storeId) {
    const base = window.location.origin !== 'null'
      ? `${window.location.origin}${window.location.pathname}`
      : window.location.href.split('?')[0].split('#')[0];
    const url = new URL(base);
    url.searchParams.set('v', '2');
    url.hash = `store=${encodeURIComponent(storeId)}`;
    return url.toString();
  }

  function getThreadsShareUrl(store) {
    const shareUrl = getStoreShareUrl(store['編號']);
    const text = `推薦一家在脆上發現的美食小店「${store['店名']}」（${store['縣市']}${store['區']}｜${store['類別']}）\n${store['一句話介紹'] || ''}\n來脆友美食地圖逛逛：${shareUrl}`.trim();
    return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
  }

  // 初始化地圖（Leaflet + OpenStreetMap）
  function initMap() {
    state.map = L.map('map', {
      center: [23.9739, 120.982],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(state.map);

    state.clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
    });
    state.map.addLayer(state.clusterGroup);
  }

  function populateCitySelects() {
    const cityFilter = document.getElementById('city-filter');
    const formCity = document.getElementById('f-city');
    Object.keys(CITY_CENTERS).forEach((city) => {
      const opt1 = document.createElement('option');
      opt1.value = city;
      opt1.textContent = city;
      cityFilter.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = city;
      opt2.textContent = city;
      formCity.appendChild(opt2);
    });
  }

  async function loadStores() {
    const csvUrl = (cfg.SHEET_CSV_URL || '').trim();
    const isDemo = !csvUrl || csvUrl === '__SHEET_CSV_URL__';
    const banner = document.getElementById('demo-banner');
    banner.classList.toggle('hidden', !isDemo);
    const seedList = Array.isArray(window.SEED_STORES) && window.SEED_STORES.length > 0 ? window.SEED_STORES : DEMO_STORES;

    if (isDemo) {
      banner.innerHTML = `目前顯示首批 ${seedList.length} 家脆友種子店家（設定 <code>config.js</code> 後將改讀即時試算表）。`;
      state.allStores = seedList
        .filter((s) => VISIBLE_STATUSES.has(s['狀態']))
        .map(enrichStore);
      renderCategoryChips();
      applyFilters();
      checkDeepLink();
      return;
    }

    if (!isAllowedEndpointUrl(csvUrl, { allowRelative: true })) {
      console.warn('SHEET_CSV_URL 格式不安全，已改用種子店家資料');
      banner.classList.remove('hidden');
      state.allStores = seedList.map(enrichStore);
      renderCategoryChips();
      applyFilters();
      checkDeepLink();
      return;
    }

    try {
      const res = await fetch(csvUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const parsed = parseCSV(text);
      state.allStores = parsed
        .filter((s) => s['店名'] && VISIBLE_STATUSES.has(s['狀態']))
        .map(enrichStore);
    } catch (err) {
      console.error('載入試算表失敗:', err);
      showToast('無法讀取試算表資料，暫時顯示種子店家資料');
      banner.classList.remove('hidden');
      state.allStores = seedList.map(enrichStore);
    }
    renderCategoryChips();
    applyFilters();
    checkDeepLink();
  }

  function renderCategoryChips() {
    const container = document.getElementById('category-chips');
    if (!container) return;
    const counts = new Map();
    state.allStores.forEach((s) => {
      const tags = Array.isArray(s._tags) ? s._tags : parseStoreTags(s);
      tags.forEach((cat) => {
        if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
      });
    });
    const categories = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))
      .map(([cat]) => cat);

    if (state.selectedCategory !== '全部' && !counts.has(state.selectedCategory)) {
      state.selectedCategory = '全部';
    }

    const chips = ['全部', ...categories];
    container.innerHTML = chips
      .map((cat) => {
        const active = state.selectedCategory === cat ? ' active' : '';
        return `<button class="chip${active}" data-category="${escHtml(cat)}" type="button">${escHtml(cat)}</button>`;
      })
      .join('');
  }

  function applyFilters() {
    const q = state.searchQuery.trim().toLowerCase();
    const filtered = state.allStores.filter((s) => {
      const tags = Array.isArray(s._tags) ? s._tags : [];
      if (state.selectedCategory !== '全部' && !tags.includes(state.selectedCategory)) return false;
      if (state.selectedCity !== '全部' && s['縣市'] !== state.selectedCity) return false;
      if (q) {
        const hay = `${s['店名']} ${s['一句話介紹']} ${s['縣市']} ${s['區']} ${tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sortBy === 'newest') {
      filtered.sort((a, b) => String(b['送出時間'] || '').localeCompare(String(a['送出時間'] || '')));
    } else if (state.sortBy === 'popular') {
      filtered.sort((a, b) => getStorePopularity(b) - getStorePopularity(a));
    } else if (state.sortBy === 'city') {
      filtered.sort((a, b) => `${a['縣市']}${a['區']}`.localeCompare(`${b['縣市']}${b['區']}`, 'zh-Hant'));
    } else if (state.sortBy === 'category') {
      filtered.sort((a, b) => String((a._tags && a._tags[0]) || a['類別'] || '').localeCompare(String((b._tags && b._tags[0]) || b['類別'] || ''), 'zh-Hant'));
    }

    state.filteredStores = filtered;
    document.getElementById('store-count-label').textContent = `已收錄 ${filtered.length} 家脆友小店`;
    document.getElementById('list-summary').textContent = `共 ${filtered.length} 家`;

    renderMarkers();
    renderList();
  }

  function createWarmMarkerIcon(store) {
    const label = escHtml(store['店名'] || '');
    return L.divIcon({
      className: 'warm-marker-wrap',
      html: `<div class="warm-marker-pin"></div><div class="warm-marker-label">${label}</div>`,
      iconSize: [120, 56],
      iconAnchor: [60, 32],
    });
  }

  function renderMarkers() {
    state.clusterGroup.clearLayers();
    state.markersById.clear();

    const bounds = [];
    state.filteredStores.forEach((store) => {
      const coords = getStoreCoords(store);
      if (!coords) return;

      const marker = L.marker([coords.lat, coords.lng], {
        title: store['店名'],
        icon: createWarmMarkerIcon(store),
      });
      marker.on('click', () => openStoreDrawer(store, coords));
      state.clusterGroup.addLayer(marker);
      state.markersById.set(store['編號'], { marker, coords, store });
      // 優先以台灣範圍內的店家做 fitBounds，避免海外店家將地圖縮得太遠
      if (coords.lat >= 21 && coords.lat <= 26.5 && coords.lng >= 118 && coords.lng <= 123) {
        bounds.push([coords.lat, coords.lng]);
      }
    });

    if (bounds.length > 0 && !state.activeStore) {
      state.map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }

  function statusBadgeHtml(status) {
    if (status === '待修改') return '<span class="badge badge-fix">待修改</span>';
    return '';
  }

  function renderList() {
    const container = document.getElementById('store-list');
    if (state.filteredStores.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#6b7280;margin-top:32px;">目前沒有符合條件的店家，試著調整篩選或搶先登錄第一家！</p>';
      return;
    }

    container.innerHTML = state.filteredStores
      .map((s) => {
        const deliveryTag = s['有沒有實體店面'] === '否' ? '<span class="badge">純宅配／網購</span>' : '';
        return `
          <article class="store-card-item" data-store-id="${escHtml(s['編號'])}">
            <div class="card-top">
              <h3 class="card-title">${escHtml(s['店名'])}</h3>
              ${statusBadgeHtml(s['狀態'])}
            </div>
            <div class="badges">
              ${(s._tags || [s['類別']]).map((t) => `<span class="badge badge-cat">${escHtml(t)}</span>`).join('')}
              <span class="badge">${escHtml(s['縣市'])}${escHtml(s['區'])}</span>
              ${deliveryTag}
            </div>
            ${s['一句話介紹'] ? `<p class="card-intro">${escHtml(s['一句話介紹'])}</p>` : ''}
            <p class="card-meta">${s['營業時間'] ? '🕒 ' + escHtml(s['營業時間']) : ''}</p>
          </article>
        `;
      })
      .join('');

    container.querySelectorAll('.store-card-item').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-store-id');
        const entry = state.markersById.get(id);
        const store = state.filteredStores.find((x) => x['編號'] === id);
        if (store) {
          switchTab('map');
          openStoreDrawer(store, entry ? entry.coords : getStoreCoords(store));
        }
      });
    });
  }

  function openStoreDrawer(store, coords) {
    state.activeStore = store;
    const drawer = document.getElementById('store-drawer');
    const content = document.getElementById('drawer-content');

    const rawThreads = (store['Threads 帳號'] || '').trim().replace(/^@+/, '');
    const rawIg = (store['IG 帳號'] || '').trim().replace(/^@+/, '');
    const threadsHandle = isValidSocialHandle(rawThreads) ? rawThreads : '';
    const igHandle = isValidSocialHandle(rawIg) ? rawIg : '';
    const threadsUrl = threadsHandle ? `https://www.threads.net/@${encodeURIComponent(threadsHandle)}` : '';
    const igUrl = igHandle ? `https://www.instagram.com/${encodeURIComponent(igHandle)}` : '';

    let navUrl = '';
    if (store['有沒有實體店面'] !== '否' && store['地址']) {
      const q = `${store['縣市']}${store['區']}${store['地址']} ${store['店名']}`;
      navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    } else if (coords && coords.exact && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
      navUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }

    const addressLine = store['有沒有實體店面'] === '否'
      ? `${escHtml(store['縣市'])}${escHtml(store['區'])}（純宅配／網購）`
      : `${escHtml(store['縣市'])}${escHtml(store['區'])}${escHtml(store['地址'])}`;
    const safeTel = sanitizePhoneHref(store['電話']);
    const phoneHtml = store['電話']
      ? (safeTel
        ? `<p class="card-meta">📞 <a href="tel:${escHtml(safeTel)}">${escHtml(store['電話'])}</a></p>`
        : `<p class="card-meta">📞 ${escHtml(store['電話'])}</p>`)
      : '';

    content.innerHTML = `
      <div class="card-top" style="padding-right:32px;">
        <h3 class="card-title">${escHtml(store['店名'])}</h3>
        ${statusBadgeHtml(store['狀態'])}
      </div>
      <div class="badges">
        ${(store._tags || [store['類別']]).map((t) => `<span class="badge badge-cat">${escHtml(t)}</span>`).join('')}
        <span class="badge">${escHtml(store['縣市'])}${escHtml(store['區'])}</span>
        ${store['等級徽章'] ? `<span class="badge badge-level">${escHtml(store['等級徽章'])}</span>` : ''}
      </div>
      ${store['一句話介紹'] ? `<p class="card-intro">${escHtml(store['一句話介紹'])}</p>` : ''}
      <p class="card-meta">📍 ${addressLine}</p>
      ${store['營業時間'] ? `<p class="card-meta">🕒 ${escHtml(store['營業時間'])}</p>` : ''}
      ${phoneHtml}

      <div class="drawer-actions">
        <button class="action-btn primary ${threadsUrl ? '' : 'disabled'}" id="btn-visit-threads" type="button" ${threadsUrl ? '' : 'disabled'}>去 Threads</button>
        <button class="action-btn ${igUrl ? '' : 'disabled'}" id="btn-visit-ig" type="button" ${igUrl ? '' : 'disabled'}>去 IG</button>
        <a class="action-btn ${navUrl ? '' : 'disabled'}" id="btn-visit-nav" href="${navUrl || '#'}" target="_blank" rel="noopener noreferrer">導航</a>
        <button class="action-btn" id="btn-drawer-share" type="button">分享店家</button>
      </div>
      <div class="drawer-report">
        <button class="link-muted" id="btn-report-store" type="button">回報資訊有誤</button>
      </div>
    `;

    drawer.classList.remove('hidden');

    trackEvent('view_store', {
      store_id: store['編號'],
      store_name: store['店名'],
      store_category: store['類別'],
      store_city: store['縣市'],
    });

    if (coords && state.map) {
      state.map.setView([coords.lat, coords.lng], coords.exact ? 15 : 12, { animate: true });
    }

    if (threadsUrl) {
      document.getElementById('btn-visit-threads').addEventListener('click', () => visitStoreExternal(store, threadsUrl, 'threads'));
    }
    if (igUrl) {
      document.getElementById('btn-visit-ig').addEventListener('click', () => visitStoreExternal(store, igUrl, 'ig'));
    }
    if (navUrl) {
      document.getElementById('btn-visit-nav').addEventListener('click', () => {
        trackEvent('click_nav', {
          store_id: store['編號'],
          store_name: store['店名'],
          store_city: store['縣市'],
        });
      });
    }
    document.getElementById('btn-drawer-share').addEventListener('click', () => {
      trackEvent('open_share', {
        store_id: store['編號'],
        store_name: store['店名'],
      });
      openShareModal(store);
    });
    document.getElementById('btn-report-store').addEventListener('click', () => {
      const rawAdmin = String(cfg.ADMIN_THREADS_HANDLE || '').trim().replace(/^@+/, '');
      const adminHandle = isValidSocialHandle(rawAdmin) ? rawAdmin : 'its.all.good.73';
      const msg = `想回報「${store['店名']}」（${store['編號']}）的資訊有誤：`;
      window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent('@' + adminHandle + ' ' + msg)}`, '_blank', 'noopener,noreferrer');
    });
  }

  function openExternalUrl(url) {
    if (window.liff && typeof window.liff.isInClient === 'function' && window.liff.isInClient()) {
      window.liff.openWindow({ url, external: true });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async function postActionEvent(action, extra = {}) {
    const url = (cfg.EVENT_WEBHOOK_URL || '').trim();
    if (!url || url === '__EVENT_WEBHOOK_URL__' || state.user.isDemo || !isAllowedEndpointUrl(url)) return null;
    try {
      const headers = { 'Content-Type': 'application/json; charset=utf-8' };
      if (window.liff && typeof window.liff.getIDToken === 'function') {
        const idToken = window.liff.getIDToken();
        if (idToken) headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action,
          userId: state.user.userId,
          displayName: state.user.displayName,
          ...extra,
        }),
      });
      return await res.json().catch(() => null);
    } catch (err) {
      console.warn('事件送出失敗:', err);
      return null;
    }
  }

  async function visitStoreExternal(store, targetUrl, channel) {
    const storeId = store['編號'];
    trackEvent('click_social', {
      channel,
      store_id: storeId,
      store_name: store['店名'],
      store_category: store['類別'],
    });
    if (state.user.loggedIn && store['狀態'] === '已確認' && store['店家 LINE 帳號'] !== state.user.userId) {
      if (!state.user.visitedToday.includes(storeId) && state.user.visitedToday.length < 20) {
        state.user.visitedToday.push(storeId);
        state.user.points += 1;
        state.user.level = getLevelByPoints(state.user.points);
        state.popularityMap[storeId] = getStorePopularity(store) + 1;
        postActionEvent('visit', { storeId, channel });
        showToast('已記錄去逛！+1 點');
      }
    } else if (state.user.loggedIn && store['狀態'] !== '已確認') {
      showToast('已開啟店家頁面（審核中店家暫不計點）');
    }
    openExternalUrl(targetUrl);
  }

  function drawShareCard(store) {
    const canvas = document.getElementById('share-card-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // 背景漸層
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fff7ed');
    grad.addColorStop(1, '#ffedd5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 卡片內框
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(24, 24, w - 48, h - 48, 22);
    ctx.fill();
    ctx.stroke();

    // 頂部品牌
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('脆友美食地圖｜Threads 獨立美食小店', 52, 74);

    // 類別＋地區標籤
    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${store['類別']}  ·  ${store['縣市']}${store['區']}`, 52, 118);

    // 店名
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(String(store['店名'] || '').slice(0, 14), 52, 182);

    // 一句話介紹
    ctx.fillStyle = '#57534e';
    ctx.font = '24px sans-serif';
    const intro = store['一句話介紹'] || '在 Threads 經營的在地好味道，歡迎來逛逛！';
    ctx.fillText(intro.slice(0, 26), 52, 232);

    // 社群帳號
    ctx.fillStyle = '#78716c';
    ctx.font = '18px sans-serif';
    const socialParts = [];
    if (store['Threads 帳號']) socialParts.push('Threads @' + store['Threads 帳號'].replace(/^@+/, ''));
    if (store['IG 帳號']) socialParts.push('IG @' + store['IG 帳號'].replace(/^@+/, ''));
    ctx.fillText(socialParts.join('   |   ') || '脆友美食地圖收錄店家', 52, 296);

    // 底部專屬編號與網址提示
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`店家代號 ${store['編號']}  ·  掃描或點連結在地圖查看`, 52, 356);
  }

  function openShareModal(store) {
    state.shareTargetStore = store;
    const shareUrl = getStoreShareUrl(store['編號']);
    const defaultText = `推薦一家在脆上發現的美食小店「${store['店名']}」（${store['縣市']}${store['區']}｜${store['類別']}）\n${store['一句話介紹'] || ''}\n來脆友美食地圖逛逛：${shareUrl}`.trim();
    document.getElementById('share-threads-text').value = defaultText;
    drawShareCard(store);
    openModal('share-modal');
  }

  function checkDeepLink() {
    const hashRaw = String(window.location.hash || '').replace(/^#/, '');
    const hashParams = new URLSearchParams(hashRaw);
    const searchParams = new URLSearchParams(window.location.search);
    const targetId = (hashParams.get('store') || searchParams.get('store') || '').trim();
    if (!targetId) return;
    const store = state.allStores.find((s) => s['編號'] === targetId);
    if (store) {
      const entry = state.markersById.get(targetId);
      openStoreDrawer(store, entry ? entry.coords : getStoreCoords(store));
    }
  }

  function switchTab(tabName) {
    document.querySelectorAll('.nav-btn[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    ['map', 'list', 'tasks', 'me'].forEach((t) => {
      const el = document.getElementById(`view-${t}`);
      if (el) el.classList.toggle('active', t === tabName);
    });
    const drawer = document.getElementById('store-drawer');
    if (drawer && tabName !== 'map') {
      drawer.classList.add('hidden');
      state.activeStore = null;
    }
    if (tabName === 'map' && state.map) {
      setTimeout(() => state.map.invalidateSize(), 60);
    } else if (tabName === 'tasks') {
      renderTasksView();
    } else if (tabName === 'me') {
      renderMeView();
    }
  }

  function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  // 表單邏輯
  function initForm() {
    const form = document.getElementById('submit-form');
    const errorBox = document.getElementById('form-error');
    const successBox = document.getElementById('form-success');
    const addressInput = document.getElementById('f-address');
    const addressReq = document.getElementById('address-req');
    const introInput = document.getElementById('f-intro');
    const introCount = document.getElementById('intro-count');
    const tagChipsBox = document.getElementById('f-category-chips');
    const customTagInput = document.getElementById('f-category-custom');
    const hiddenCategoryInput = document.getElementById('f-category');

    if (tagChipsBox) {
      tagChipsBox.addEventListener('click', (e) => {
        const chip = e.target.closest('.form-tag-chip');
        if (!chip) return;
        chip.classList.toggle('active');
      });
    }

    function collectFormCategory() {
      const selected = tagChipsBox
        ? [...tagChipsBox.querySelectorAll('.form-tag-chip.active')].map((el) => el.getAttribute('data-tag'))
        : [];
      const custom = customTagInput
        ? String(customTagInput.value || '').split(/[,、，/]+/).map((s) => s.trim()).filter(Boolean)
        : [];
      const merged = [];
      [...selected, ...custom].forEach((t) => {
        const norm = normalizeSingleTag(t);
        if (norm && !merged.includes(norm)) merged.push(norm);
      });
      const joined = merged.join(', ');
      if (hiddenCategoryInput) hiddenCategoryInput.value = joined;
      return joined;
    }

    document.querySelectorAll('input[name="有沒有實體店面"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const hasStore = e.target.value === 'true';
        addressReq.classList.toggle('hidden', !hasStore);
        addressInput.required = hasStore;
      });
    });

    introInput.addEventListener('input', () => {
      const len = [...introInput.value.trim()].length;
      introCount.textContent = `${len} / 30`;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.classList.add('hidden');

      const categoryStr = collectFormCategory();
      const fd = new FormData(form);
      const hasStore = fd.get('有沒有實體店面') === 'true';
      const payload = {
        '店名': String(fd.get('店名') || '').trim(),
        '類別': categoryStr,
        '有沒有實體店面': hasStore,
        '縣市': String(fd.get('縣市') || '').trim(),
        '區': String(fd.get('區') || '').trim(),
        '地址': String(fd.get('地址') || '').trim(),
        'Threads 帳號': String(fd.get('Threads 帳號') || '').trim().replace(/^@+/, ''),
        'IG 帳號': String(fd.get('IG 帳號') || '').trim().replace(/^@+/, ''),
        '一句話介紹': String(fd.get('一句話介紹') || '').trim(),
        '電話': String(fd.get('電話') || '').trim(),
        '營業時間': String(fd.get('營業時間') || '').trim(),
        '同意聲明': document.getElementById('f-consent').checked,
        '店家 LINE 帳號': state.user.loggedIn ? state.user.userId : '',
      };

      if (!payload['店名']) return showFormError('請填寫店名');
      if (!payload['類別']) return showFormError('請至少選擇或輸入一個特色分類');
      if (payload['類別'].length > 60) return showFormError('特色分類合計最多 60 字');
      if (!payload['縣市'] || !payload['區']) return showFormError('請填寫縣市與區');
      if (hasStore && !payload['地址']) return showFormError('有實體店面時請填寫地址');
      if (!payload['Threads 帳號'] && !payload['IG 帳號']) {
        return showFormError('Threads 帳號與 IG 帳號至少要填一個');
      }
      if (payload['Threads 帳號'] && !isValidSocialHandle(payload['Threads 帳號'])) {
        return showFormError('Threads 帳號請填寫純帳號名稱（僅限英數、底線或點號，勿貼網址）');
      }
      if (payload['IG 帳號'] && !isValidSocialHandle(payload['IG 帳號'])) {
        return showFormError('IG 帳號請填寫純帳號名稱（僅限英數、底線或點號，勿貼網址）');
      }
      if (payload['電話'] && !isValidPhone(payload['電話'])) {
        return showFormError('電話格式僅能包含數字與 + - ( ) #');
      }
      if ([...payload['一句話介紹']].length > 30) {
        return showFormError('一句話介紹最多 30 個字');
      }

      const webhookUrl = (cfg.SUBMIT_WEBHOOK_URL || '').trim();
      if (!webhookUrl || webhookUrl === '__SUBMIT_WEBHOOK_URL__') {
        return showFormError('尚未在 config.js 設定 SUBMIT_WEBHOOK_URL（n8n 收單網址）');
      }
      if (!isAllowedEndpointUrl(webhookUrl)) {
        return showFormError('SUBMIT_WEBHOOK_URL 必須為安全的 HTTPS 網址');
      }

      const btn = document.getElementById('btn-submit-form');
      btn.disabled = true;
      btn.textContent = '送出中...';

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.message || '送出失敗，請稍後再試');
        }

        const newStore = enrichStore({
          ...payload,
          '有沒有實體店面': hasStore ? '是' : '否',
          '編號': data.id,
          '送出時間': new Date().toISOString(),
          '狀態': '確認中',
          '緯度': '',
          '經度': '',
        });
        state.lastSubmittedStore = newStore;
        state.allStores.unshift(newStore);
        trackEvent('submit_store_success', {
          store_id: data.id || '',
          store_name: newStore['店名'],
          store_category: newStore['類別'],
          store_city: newStore['縣市'],
        });
        renderCategoryChips();
        applyFilters();

        document.getElementById('success-id').textContent = data.id || '已送出';
        form.classList.add('hidden');
        successBox.classList.remove('hidden');
        form.reset();
        if (tagChipsBox) {
          tagChipsBox.querySelectorAll('.form-tag-chip.active').forEach((c) => c.classList.remove('active'));
        }
        introCount.textContent = '0 / 30';
      } catch (err) {
        showFormError(err.message || '網路異常，請稍後再試');
      } finally {
        btn.disabled = false;
        btn.textContent = '送出並立即上架';
      }
    });

    function showFormError(msg) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }

    document.getElementById('btn-view-on-map').addEventListener('click', () => {
      closeModal('form-modal');
      form.classList.remove('hidden');
      successBox.classList.add('hidden');
      switchTab('map');
      if (state.lastSubmittedStore) {
        openStoreDrawer(state.lastSubmittedStore, getStoreCoords(state.lastSubmittedStore));
      }
    });

    document.getElementById('btn-share-threads-new').addEventListener('click', () => {
      if (state.lastSubmittedStore) {
        window.open(getThreadsShareUrl(state.lastSubmittedStore), '_blank', 'noopener,noreferrer');
      }
    });
  }

  function bindEvents() {
    document.getElementById('category-chips').addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      state.selectedCategory = btn.getAttribute('data-category');
      trackEvent('filter_category', { category: state.selectedCategory });
      applyFilters();
    });

    document.getElementById('city-filter').addEventListener('change', (e) => {
      state.selectedCity = e.target.value;
      trackEvent('filter_city', { city: state.selectedCity });
      applyFilters();
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      applyFilters();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });

    document.querySelectorAll('.nav-btn[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('drawer-close').addEventListener('click', () => {
      document.getElementById('store-drawer').classList.add('hidden');
      state.activeStore = null;
    });

    document.getElementById('btn-open-form').addEventListener('click', () => {
      document.getElementById('submit-form').classList.remove('hidden');
      document.getElementById('form-success').classList.add('hidden');
      document.getElementById('form-error').classList.add('hidden');
      openModal('form-modal');
    });

    document.getElementById('btn-rules-top').addEventListener('click', () => openModal('rules-modal'));
    const btnCopyright = document.getElementById('btn-copyright-top');
    if (btnCopyright) btnCopyright.addEventListener('click', () => openModal('copyright-modal'));

    document.getElementById('btn-download-card').addEventListener('click', () => {
      const canvas = document.getElementById('share-card-canvas');
      if (!canvas || !state.shareTargetStore) return;
      const safeName = String(state.shareTargetStore['店名'] || 'store')
        .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
        .replace(/\.{2,}/g, '_')
        .trim() || 'store';
      const link = document.createElement('a');
      link.download = `${safeName}-脆友美食地圖.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      trackEvent('share_store', { method: 'download_card', store_id: state.shareTargetStore['編號'], store_name: state.shareTargetStore['店名'] });
      showToast('已下載宣傳圖卡！');
    });

    document.getElementById('btn-copy-link').addEventListener('click', async () => {
      if (!state.shareTargetStore) return;
      const url = getStoreShareUrl(state.shareTargetStore['編號']);
      trackEvent('share_store', { method: 'copy_link', store_id: state.shareTargetStore['編號'], store_name: state.shareTargetStore['店名'] });
      try {
        await navigator.clipboard.writeText(url);
        showToast('已複製店家專屬連結！');
      } catch (_) {
        showToast('請手動複製連結：' + url);
      }
    });

    document.getElementById('btn-copy-threads-text').addEventListener('click', async () => {
      const text = document.getElementById('share-threads-text').value;
      try {
        await navigator.clipboard.writeText(text);
        showToast('已複製分享文案！');
      } catch (_) {
        showToast('複製失敗，請長按文字複製');
      }
    });

    document.getElementById('btn-share-threads').addEventListener('click', () => {
      const text = document.getElementById('share-threads-text').value;
      if (state.shareTargetStore) {
        trackEvent('share_store', { method: 'threads', store_id: state.shareTargetStore['編號'], store_name: state.shareTargetStore['店名'] });
      }
      openExternalUrl(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`);
    });

    document.getElementById('btn-share-line').addEventListener('click', async () => {
      if (!state.shareTargetStore) return;
      const store = state.shareTargetStore;
      trackEvent('share_store', { method: 'line', store_id: store['編號'], store_name: store['店名'] });
      const shareUrl = getStoreShareUrl(store['編號']);
      const text = `${store['店名']}（${store['縣市']}${store['區']}｜${store['類別']}）\n${store['一句話介紹'] || ''}\n👉 ${shareUrl}`.trim();

      if (window.liff && typeof window.liff.isApiAvailable === 'function' && window.liff.isApiAvailable('shareTargetPicker')) {
        try {
          const res = await window.liff.shareTargetPicker([{ type: 'text', text }]);
          if (res) {
            if (state.user.loggedIn && state.user.sharesToday < 5) {
              state.user.sharesToday += 1;
              state.user.points += 3;
              state.user.level = getLevelByPoints(state.user.points);
              postActionEvent('share', { storeId: store['編號'] });
              showToast('LINE 分享成功！+3 點');
            } else {
              showToast('LINE 分享成功！');
            }
          }
          return;
        } catch (err) {
          console.warn('shareTargetPicker error:', err);
        }
      }
      openExternalUrl(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
    });

    document.querySelectorAll('[data-close-modal]').forEach((el) => {
      el.addEventListener('click', () => closeModal(el.getAttribute('data-close-modal')));
    });

    document.getElementById('btn-locate').addEventListener('click', () => {
      trackEvent('locate_nearby');
      if (!navigator.geolocation) {
        return showToast('此瀏覽器不支援定位功能');
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          switchTab('map');
          state.map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
          showToast('已定位到你附近');
        },
        () => showToast('無法取得定位，請確認瀏覽器權限')
      );
    });

    window.addEventListener('hashchange', checkDeepLink);
  }

  function loginWithLiffOrDemo() {
    const liffId = (cfg.LIFF_ID || '').trim();
    if (liffId && liffId !== '__LIFF_ID__' && window.liff) {
      window.liff.login();
      return;
    }
    state.user = {
      loggedIn: true,
      isDemo: true,
      userId: 'U_DEMO_USER',
      displayName: '體驗小店長',
      pictureUrl: '',
      role: '店家',
      points: 24,
      level: getLevelByPoints(24),
      visitedToday: [],
      sharesToday: 0,
    };
    showToast('已進入體驗預覽模式（尚未綁定 LIFF）');
    renderTasksView();
    renderMeView();
  }

  function renderWipGate(containerId, title, desc) {
    const gate = document.getElementById(containerId);
    gate.innerHTML = `
      <div class="auth-gate-icon">🚧</div>
      <h3>${escHtml(title)}</h3>
      <p>${escHtml(desc)}</p>
      <button class="btn-outline" type="button" data-back-map="1">回地圖逛逛</button>
    `;
    gate.querySelector('[data-back-map]').addEventListener('click', () => switchTab('map'));
  }

  function renderTasksView() {
    const gate = document.getElementById('tasks-auth-gate');
    const content = document.getElementById('tasks-content');
    gate.classList.remove('hidden');
    content.classList.add('hidden');
    renderWipGate('tasks-auth-gate', '任務功能研發中', '每日互推任務與本週脆友小店排行目前正在研發中，現階段無須登入即可免費瀏覽地圖、搜尋附近與登錄店家！');
  }

  function renderMeView() {
    const gate = document.getElementById('me-auth-gate');
    const content = document.getElementById('me-content');
    gate.classList.remove('hidden');
    content.classList.add('hidden');
    renderWipGate('me-auth-gate', '個人頁面研發中', '「我的」個人頁面與店家認領管理功能目前正在研發中，現階段無須任何帳號登入，歡迎直接免費登錄與分享店家！');
  }

  async function initLiff() {
    const liffId = (cfg.LIFF_ID || '').trim();
    if (!liffId || liffId === '__LIFF_ID__' || !window.liff) return;
    try {
      await window.liff.init({ liffId });
      if (window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        state.user.loggedIn = true;
        state.user.isDemo = false;
        state.user.userId = profile.userId;
        state.user.displayName = profile.displayName;
        state.user.pictureUrl = profile.pictureUrl || '';
        const serverProfile = await postActionEvent('get_profile');
        if (serverProfile && serverProfile.ok) {
          state.user.points = serverProfile.points || 0;
          state.user.level = serverProfile.level || getLevelByPoints(state.user.points);
          state.user.role = serverProfile.role || '食客';
        }
      }
    } catch (err) {
      console.warn('LIFF 初始化失敗（仍可使用瀏覽器模式）:', err);
    }
  }

  function init() {
    initAnalytics();
    renderLaunchDateBanner();
    initVisitCounter();
    document.getElementById('rules-inline-body').innerHTML = PUBLIC_RULES_HTML;
    document.getElementById('rules-modal-body').innerHTML = PUBLIC_RULES_HTML;
    populateCitySelects();
    initMap();
    initForm();
    bindEvents();
    loadStores();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
