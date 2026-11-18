(() => {
  'use strict';

  const cfg = window.FOOD_MAP_CONFIG || {};
  const VISIBLE_STATUSES = new Set(['確認中', '已確認', '待修改']);

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
        <li><strong>本人或經同意</strong>：送出者是店家本人，或已取得店家同意。</li>
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
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    return rows.slice(1).filter((r) => r.some((c) => c.trim() !== '')).map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (r[idx] || '').trim();
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
    const url = new URL(window.location.href);
    url.searchParams.set('store', storeId);
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
      state.allStores = seedList.filter((s) => VISIBLE_STATUSES.has(s['狀態']));
      applyFilters();
      checkDeepLink();
      return;
    }

    try {
      const res = await fetch(csvUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const parsed = parseCSV(text);
      state.allStores = parsed.filter((s) => s['店名'] && VISIBLE_STATUSES.has(s['狀態']));
    } catch (err) {
      console.error('載入試算表失敗:', err);
      showToast('無法讀取試算表資料，暫時顯示種子店家資料');
      banner.classList.remove('hidden');
      state.allStores = seedList;
    }
    applyFilters();
    checkDeepLink();
  }

  function applyFilters() {
    const q = state.searchQuery.trim().toLowerCase();
    const filtered = state.allStores.filter((s) => {
      if (state.selectedCategory !== '全部' && s['類別'] !== state.selectedCategory) return false;
      if (state.selectedCity !== '全部' && s['縣市'] !== state.selectedCity) return false;
      if (q) {
        const hay = `${s['店名']} ${s['一句話介紹']} ${s['縣市']} ${s['區']} ${s['類別']}`.toLowerCase();
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
      filtered.sort((a, b) => String(a['類別'] || '').localeCompare(String(b['類別'] || ''), 'zh-Hant'));
    }

    state.filteredStores = filtered;
    document.getElementById('store-count-label').textContent = `已收錄 ${filtered.length} 家脆友小店`;
    document.getElementById('list-summary').textContent = `共 ${filtered.length} 家`;

    renderMarkers();
    renderList();
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
    if (status === '確認中') return '<span class="badge badge-pending">確認中</span>';
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
              <span class="badge badge-cat">${escHtml(s['類別'])}</span>
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

    const threadsHandle = (store['Threads 帳號'] || '').replace(/^@+/, '');
    const igHandle = (store['IG 帳號'] || '').replace(/^@+/, '');
    const threadsUrl = threadsHandle ? `https://www.threads.net/@${encodeURIComponent(threadsHandle)}` : '';
    const igUrl = igHandle ? `https://www.instagram.com/${encodeURIComponent(igHandle)}` : '';

    let navUrl = '';
    if (store['有沒有實體店面'] !== '否' && store['地址']) {
      const q = `${store['縣市']}${store['區']}${store['地址']} ${store['店名']}`;
      navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    } else if (coords && coords.exact) {
      navUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }

    const addressLine = store['有沒有實體店面'] === '否'
      ? `${escHtml(store['縣市'])}${escHtml(store['區'])}（純宅配／網購）`
      : `${escHtml(store['縣市'])}${escHtml(store['區'])}${escHtml(store['地址'])}`;

    content.innerHTML = `
      <div class="card-top" style="padding-right:32px;">
        <h3 class="card-title">${escHtml(store['店名'])}</h3>
        ${statusBadgeHtml(store['狀態'])}
      </div>
      <div class="badges">
        <span class="badge badge-cat">${escHtml(store['類別'])}</span>
        <span class="badge">${escHtml(store['縣市'])}${escHtml(store['區'])}</span>
        ${store['等級徽章'] ? `<span class="badge badge-level">${escHtml(store['等級徽章'])}</span>` : ''}
        <span class="badge">👣 人氣 ${getStorePopularity(store)}</span>
      </div>
      ${store['一句話介紹'] ? `<p class="card-intro">${escHtml(store['一句話介紹'])}</p>` : ''}
      <p class="card-meta">📍 ${addressLine}</p>
      ${store['營業時間'] ? `<p class="card-meta">🕒 ${escHtml(store['營業時間'])}</p>` : ''}
      ${store['電話'] ? `<p class="card-meta">📞 <a href="tel:${escHtml(store['電話'])}">${escHtml(store['電話'])}</a></p>` : ''}

      <div class="drawer-actions">
        <button class="action-btn primary ${threadsUrl ? '' : 'disabled'}" id="btn-visit-threads" type="button" ${threadsUrl ? '' : 'disabled'}>去 Threads</button>
        <button class="action-btn ${igUrl ? '' : 'disabled'}" id="btn-visit-ig" type="button" ${igUrl ? '' : 'disabled'}>去 IG</button>
        <a class="action-btn ${navUrl ? '' : 'disabled'}" href="${navUrl || '#'}" target="_blank" rel="noopener noreferrer">導航</a>
        <button class="action-btn" id="btn-drawer-share" type="button">分享店家</button>
      </div>
      <div class="drawer-report">
        <button class="link-muted" id="btn-report-store" type="button">回報資訊有誤</button>
      </div>
    `;

    drawer.classList.remove('hidden');

    if (coords && state.map) {
      state.map.setView([coords.lat, coords.lng], coords.exact ? 15 : 12, { animate: true });
    }

    if (threadsUrl) {
      document.getElementById('btn-visit-threads').addEventListener('click', () => visitStoreExternal(store, threadsUrl, 'threads'));
    }
    if (igUrl) {
      document.getElementById('btn-visit-ig').addEventListener('click', () => visitStoreExternal(store, igUrl, 'ig'));
    }
    document.getElementById('btn-drawer-share').addEventListener('click', () => openShareModal(store));
    document.getElementById('btn-report-store').addEventListener('click', () => {
      const adminHandle = cfg.ADMIN_THREADS_HANDLE || 'its.all.good.73';
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
    if (!url || url === '__EVENT_WEBHOOK_URL__' || state.user.isDemo) return null;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
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
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('store');
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

      const fd = new FormData(form);
      const hasStore = fd.get('有沒有實體店面') === 'true';
      const payload = {
        '店名': String(fd.get('店名') || '').trim(),
        '類別': String(fd.get('類別') || '').trim(),
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
      if (!payload['類別']) return showFormError('請選擇類別');
      if (!payload['縣市'] || !payload['區']) return showFormError('請填寫縣市與區');
      if (hasStore && !payload['地址']) return showFormError('有實體店面時請填寫地址');
      if (!payload['Threads 帳號'] && !payload['IG 帳號']) {
        return showFormError('Threads 帳號與 IG 帳號至少要填一個');
      }
      if ([...payload['一句話介紹']].length > 30) {
        return showFormError('一句話介紹最多 30 個字');
      }
      if (!payload['同意聲明']) return showFormError('請勾選同意聲明');

      const webhookUrl = (cfg.SUBMIT_WEBHOOK_URL || '').trim();
      if (!webhookUrl || webhookUrl === '__SUBMIT_WEBHOOK_URL__') {
        return showFormError('尚未在 config.js 設定 SUBMIT_WEBHOOK_URL（n8n 收單網址）');
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

        const newStore = {
          ...payload,
          '有沒有實體店面': hasStore ? '是' : '否',
          '編號': data.id,
          '送出時間': new Date().toISOString(),
          '狀態': '確認中',
          '緯度': '',
          '經度': '',
        };
        state.lastSubmittedStore = newStore;
        state.allStores.unshift(newStore);
        applyFilters();

        document.getElementById('success-id').textContent = data.id || '已送出';
        form.classList.add('hidden');
        successBox.classList.remove('hidden');
        form.reset();
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
      applyFilters();
    });

    document.getElementById('city-filter').addEventListener('change', (e) => {
      state.selectedCity = e.target.value;
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
      const link = document.createElement('a');
      link.download = `${state.shareTargetStore['店名']}-脆友美食地圖.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('已下載宣傳圖卡！');
    });

    document.getElementById('btn-copy-link').addEventListener('click', async () => {
      if (!state.shareTargetStore) return;
      const url = getStoreShareUrl(state.shareTargetStore['編號']);
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
      openExternalUrl(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`);
    });

    document.getElementById('btn-share-line').addEventListener('click', async () => {
      if (!state.shareTargetStore) return;
      const store = state.shareTargetStore;
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

  function renderAuthGate(containerId, desc) {
    const gate = document.getElementById(containerId);
    const hasLiff = (cfg.LIFF_ID || '').trim() && cfg.LIFF_ID !== '__LIFF_ID__';
    gate.innerHTML = `
      <div class="auth-gate-icon">💬</div>
      <h3>用 LINE 登入開始互推集點</h3>
      <p>${escHtml(desc)}</p>
      <button class="btn-line" type="button" data-login-btn="1">${hasLiff ? 'LINE 帳號登入' : '體驗預覽登入（Demo）'}</button>
    `;
    gate.querySelector('[data-login-btn]').addEventListener('click', loginWithLiffOrDemo);
  }

  function getDailyTaskStores() {
    const confirmed = state.allStores.filter((s) => s['狀態'] === '已確認');
    const others = state.allStores.filter((s) => s['狀態'] !== '已確認');
    return [...confirmed, ...others].slice(0, 3);
  }

  function renderTasksView() {
    const gate = document.getElementById('tasks-auth-gate');
    const content = document.getElementById('tasks-content');
    if (!state.user.loggedIn) {
      gate.classList.remove('hidden');
      content.classList.add('hidden');
      renderAuthGate('tasks-auth-gate', '看地圖不用登入；參加今日三家互推任務、查看本週人氣與熱心榜時，請先用 LINE 登入。');
      return;
    }
    gate.classList.add('hidden');
    content.classList.remove('hidden');

    const dailyStores = getDailyTaskStores();
    const completedCount = dailyStores.filter((s) => state.user.visitedToday.includes(s['編號'])).length;
    const popularTop = [...state.allStores].sort((a, b) => getStorePopularity(b) - getStorePopularity(a)).slice(0, 5);

    content.innerHTML = `
      <section class="panel-card">
        <h3>今日互推任務 <span>${completedCount} / ${dailyStores.length}</span></h3>
        <p class="panel-sub">優先配對互補類別與新加入的小店。逛完 3 家額外獲得 +5 點！</p>
        ${dailyStores.map((s) => {
          const done = state.user.visitedToday.includes(s['編號']);
          return `
            <div class="task-item">
              <div class="task-info">
                <div class="task-title">${escHtml(s['店名'])}</div>
                <div class="task-meta">${escHtml(s['類別'])} · ${escHtml(s['縣市'])}${escHtml(s['區'])}</div>
              </div>
              <button class="btn-primary btn-sm" data-task-visit="${escHtml(s['編號'])}" type="button">${done ? '已逛 ✓' : '去逛 +1'}</button>
            </div>
          `;
        }).join('')}
      </section>

      <section class="panel-card">
        <h3>本週人氣店家榜（Top 5）</h3>
        <p class="panel-sub">前三名將登上 @its.all.good.73「本週脆友小店」貼文推薦。</p>
        ${popularTop.map((s, idx) => `
          <div class="rank-row">
            <span><span class="rank-num ${idx < 3 ? 'top' : ''}">${idx + 1}</span>${escHtml(s['店名'])}（${escHtml(s['類別'])}）</span>
            <strong>${getStorePopularity(s)} 次去逛</strong>
          </div>
        `).join('')}
      </section>

      <section class="panel-card">
        <h3>本週互推夥伴</h3>
        <p class="panel-sub">每週配對兩家互補類別的店，發文介紹對方並貼回連結，管理員確認後加分。</p>
        <div class="collab-form">
          <input id="collab-post-url" type="url" placeholder="貼上你的 Threads 互推貼文連結..." />
          <button id="btn-submit-collab" class="btn-outline btn-sm" type="button">回報連結</button>
        </div>
      </section>
    `;

    content.querySelectorAll('[data-task-visit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-task-visit');
        const store = state.allStores.find((x) => x['編號'] === id);
        if (!store) return;
        const t = (store['Threads 帳號'] || '').replace(/^@+/, '');
        const ig = (store['IG 帳號'] || '').replace(/^@+/, '');
        const url = t ? `https://www.threads.net/@${encodeURIComponent(t)}` : (ig ? `https://www.instagram.com/${encodeURIComponent(ig)}` : '');
        if (url) {
          visitStoreExternal(store, url, t ? 'threads' : 'ig');
          renderTasksView();
        } else {
          switchTab('map');
          openStoreDrawer(store, getStoreCoords(store));
        }
      });
    });

    const collabBtn = document.getElementById('btn-submit-collab');
    if (collabBtn) {
      collabBtn.addEventListener('click', async () => {
        const input = document.getElementById('collab-post-url');
        const link = (input.value || '').trim();
        if (!link.startsWith('http')) return showToast('請輸入有效的 Threads 貼文連結');
        await postActionEvent('submit_collab', { postUrl: link });
        input.value = '';
        showToast('已送出互推貼文連結，等待確認加分！');
      });
    }
  }

  function renderMeView() {
    const gate = document.getElementById('me-auth-gate');
    const content = document.getElementById('me-content');
    if (!state.user.loggedIn) {
      gate.classList.remove('hidden');
      content.classList.add('hidden');
      renderAuthGate('me-auth-gate', '登入後可查看累積點數、等級徽章，並綁定管理你在地圖上的店家。');
      return;
    }
    gate.classList.add('hidden');
    content.classList.remove('hidden');

    const myStores = state.allStores.filter((s) => s['店家 LINE 帳號'] === state.user.userId || (state.user.isDemo && s['編號'] === 'FM-DEMO01'));
    const avatarHtml = state.user.pictureUrl
      ? `<img src="${escHtml(state.user.pictureUrl)}" alt="" />`
      : escHtml((state.user.displayName || '友').slice(0, 1));

    content.innerHTML = `
      <section class="panel-card">
        <div class="profile-header">
          <div class="profile-avatar">${avatarHtml}</div>
          <div>
            <div class="task-title">${escHtml(state.user.displayName || '脆友玩家')}</div>
            <div class="badges" style="margin-top:4px;">
              <span class="badge badge-level">${escHtml(state.user.level)}</span>
              <span class="badge">${escHtml(state.user.role)}</span>
            </div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-box"><div class="stat-val">${state.user.points}</div><div class="stat-lbl">累積點數</div></div>
          <div class="stat-box"><div class="stat-val">${state.user.visitedToday.length}/20</div><div class="stat-lbl">今日去逛</div></div>
          <div class="stat-box"><div class="stat-val">${state.user.sharesToday}/5</div><div class="stat-lbl">今日分享</div></div>
        </div>
      </section>

      <section class="panel-card">
        <h3>我的店家</h3>
        ${myStores.length === 0
          ? '<p class="panel-sub">尚未綁定店家。點擊右下角「＋ 登錄我的店」即可免費上架並綁定你的 LINE 帳號！</p>'
          : myStores.map((s) => `
              <div class="task-item">
                <div class="task-info">
                  <div class="task-title">${escHtml(s['店名'])} ${statusBadgeHtml(s['狀態'])}</div>
                  <div class="task-meta">代號 ${escHtml(s['編號'])} · 被逛 ${getStorePopularity(s)} 次</div>
                </div>
                <button class="btn-outline btn-sm" data-share-mine="${escHtml(s['編號'])}" type="button">分享宣傳卡</button>
              </div>
            `).join('')
        }
      </section>
    `;

    content.querySelectorAll('[data-share-mine]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const store = state.allStores.find((x) => x['編號'] === btn.getAttribute('data-share-mine'));
        if (store) openShareModal(store);
      });
    });
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
    document.getElementById('rules-inline-body').innerHTML = PUBLIC_RULES_HTML;
    document.getElementById('rules-modal-body').innerHTML = PUBLIC_RULES_HTML;
    populateCitySelects();
    initMap();
    initForm();
    bindEvents();
    loadStores();
    initLiff();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
