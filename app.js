(() => {
  'use strict';

  const cfg = window.TICKET_CONFIG || {};
  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const TOKEN_KEY = 'ticket_casino_token';
  const TEAMS = 4;
  // 팀 색 (혁혁 브라더스 팝 축제 테마): 칩·막대·아바타 채움 전용, 위 글자는 항상 잉크
  const TEAM_COLORS = ['#FF6B5E', '#3FA9F5', '#2DBE8C', '#9B7BEA', '#FFD23F', '#F58BC0', '#7FD3E8', '#C8D96B'];
  const GRADE_COLORS = ['#FF4D3D', '#FFD23F', '#3FA9F5', '#2DBE8C', '#9B7BEA', '#FF6B5E'];
  // 결과 외침 글자: 'short' = 대박! · BIG WIN! · 축하해요!  /  'game' = GRAND JACKPOT · MAJOR JACKPOT · AWESOME (게임 문구)
  const TITLE_SET = 'short';
  const TITLES = {
    short: { legend: '대박!', epic: 'BIG WIN!', rare: '축하해요!' },
    game: { legend: 'GRAND JACKPOT', epic: 'MAJOR JACKPOT', rare: 'AWESOME' },
  };
  // 선 아이콘 (이모지 대신, 2px 잉크 선)
  const svg = (d, w = 22, sw = 2) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const TICKET_D = '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/>';
  const ICON = {
    rooms: svg('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/>'),
    home: svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
    draw: svg(TICKET_D),
    prizes: svg('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/>'),
    logs: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>'),
    admin: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>', 14, 3),
    chevron: svg('<path d="M9 6l6 6-6 6"/>', 18, 3),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 16, 2.4),
    unlock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.6-1.8"/>', 16, 2.4),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', 16),
    ticket: svg(TICKET_D, 20, 2.2),
    monitor: svg('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>', 18, 2.2),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 20, 2.6),
    sad: svg('<circle cx="12" cy="12" r="9"/><path d="M8.5 16.5c1.8-2 5.2-2 7 0M9 9.5h.01M15 9.5h.01"/>', 40),
    alert: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>', 16, 2.4),
    tool: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4z"/>', 34),
    plug: svg('<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>', 34),
    // 기록 종류별 아이콘 (18px)
    l_ticket: svg(TICKET_D, 18),
    l_gift: svg('<path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S10 2 7.5 3.5 9 7 12 7zM12 7s2-5 4.5-3.5S15 7 12 7z"/>', 18),
    l_users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>', 18),
    l_enter: svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>', 18),
    l_undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', 18),
    l_x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 18),
    l_trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>', 18),
    l_key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>', 18),
    l_phone: svg('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>', 18),
    l_trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', 18),
    l_dice: svg('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/>', 18),
    l_dot: svg('<circle cx="12" cy="12" r="3"/>', 18),
  };

  // ---- 혁혁 브라더스 장식 조각 (README "타이틀 로고" · "장식") ----
  // 가시 24개 별 (혁 · 혁 별 스티커, QR 모서리 별) / 꼭짓점 36개 별폭발 (당첨 순간에만)
  const STAR24 = '98,50 86.7,59.8 91.6,74 76.9,76.9 74,91.6 59.8,86.7 50,98 40.2,86.7 26,91.6 23.1,76.9 8.4,74 13.3,59.8 2,50 13.3,40.2 8.4,26 23.1,23.1 26,8.4 40.2,13.3 50,2 59.8,13.3 74,8.4 76.9,23.1 91.6,26 86.7,40.2';
  const STAR36 = '99,50 85.5,56.2 96,66.8 81.2,68 87.5,81.5 73.1,77.6 74.5,92.4 62.3,83.8 58.5,98.3 50,86 41.5,98.3 37.7,83.8 25.5,92.4 26.9,77.6 12.5,81.5 18.8,68 4,66.8 14.5,56.2 1,50 14.5,43.8 4,33.2 18.8,32 12.5,18.5 26.9,22.4 25.5,7.6 37.7,16.2 41.5,1.7 50,14 58.5,1.7 62.3,16.2 74.5,7.6 73.1,22.4 87.5,18.5 81.2,32 96,33.2 85.5,43.8';
  const SPARK_D = 'M12 1C13 8 16 11 23 12C16 13 13 16 12 23C11 16 8 13 1 12C8 11 11 8 12 1Z';
  const spark = (fill, size = 18, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"${extra}><path d="${SPARK_D}" fill="${fill}" stroke="#1E1A2E" stroke-width="2" stroke-linejoin="round"/></svg>`;
  // 별 안 "혁": 반드시 Jua + 흰색 + 잉크 단단한 그림자 하나 (Bagel Fat One·외곽선 금지 → "헉"처럼 읽힘)
  const hyukStar = (fill, size, fontSize, shadowPx, rot, sw, overlap = 0) => `
    <div class="hy-star" style="width:${size}px;height:${size}px;transform:rotate(${rot}deg)${overlap ? `;margin-left:-${overlap}px` : ''}">
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${STAR24}" fill="#1E1A2E" transform="translate(${size >= 100 ? 3.5 : size >= 60 ? 4 : 5} ${size >= 100 ? 3.5 : size >= 60 ? 4 : 5})"/><polygon points="${STAR24}" fill="${fill}" stroke="#1E1A2E" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>
      <span style="font-size:${fontSize}px;text-shadow:${shadowPx}px ${shadowPx}px 0 #1E1A2E">혁</span>
    </div>`;
  const BURST = `<svg class="burst" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><polygon points="${STAR36}" fill="#1E1A2E" transform="translate(1.8 1.8)"/><polygon points="${STAR36}" fill="#FFD23F" stroke="#1E1A2E" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;

  // 홈 행사 배너 (EventBanner): 가장 작은 타이틀 로고 + LIVE 칩 + 날짜
  const WS_BANNER = `
    <div class="ws-banner">
      <svg class="ws-deco" width="120" height="70" viewBox="0 0 120 70" aria-hidden="true"><g stroke="#1E1A2E" stroke-width="1.6"><circle cx="20" cy="14" r="4" fill="#FF4D3D"/><rect x="60" y="48" width="8" height="12" rx="2" fill="#3FA9F5" transform="rotate(30 64 54)"/><circle cx="98" cy="20" r="3.5" fill="#2DBE8C"/></g></svg>
      <div class="ws-text">
        <div class="ws-line">
          ${hyukStar('#FF4D3D', 32, 19, 1.5, -10, 2)}${hyukStar('#3FA9F5', 32, 19, 1.5, 9, 2, 3)}
          <span class="ws-bros">브라더스</span><span class="ws-with">와 함께하는</span>
        </div>
        <h1 class="ws-title"><span class="hl">SC사업본부 워크샵</span></h1>
      </div>
      <div class="ws-meta">
        <span class="chip live"><i class="dot"></i>LIVE</span>
        <span class="ws-date">10.15 – 16</span>
      </div>
    </div>`;

  const state = {
    token: null,
    me: null,            // {id, name, is_admin}
    players: [],
    rooms: [],
    bets: [],            // 진행 중인 방의 베팅만
    logs: [],
    stats: null,
    settings: {},
    prizes: [],
    draws: [],
    tab: 'board',
    picking: null,       // 승자 선택 중인 방 id
    onlyMine: false,
    live: false,
    seenDraws: null,     // 최근 당첨 목록에서 새로 들어온 줄만 반짝이게
    seenRooms: null,     // 게임방: 새로 생긴 방 / 새로 건 사람 / 바뀐 판돈만 애니메이션
    seenBets: new Set(),
    prevPots: new Map(),
    editingPrize: null,
  };

  // 뽑기 화면 상태 (실시간 갱신과 별개로 유지)
  const drawUI = { mode: 'idle', draw: null, progress: 0 };

  // ------------------------------------------------------------------
  // 유틸
  // ------------------------------------------------------------------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel) => $app.querySelector(sel);
  const teamColor = (t) => TEAM_COLORS[(t - 1) % TEAM_COLORS.length];
  const teamBadge = (t) => (t ? `<span class="badge team" style="--c:${teamColor(t)}">${t}팀</span>` : '');
  // 팀 칩: 팀 색 채움 + 잉크 글자 (팀 미정이면 크림)
  const teamChip = (t, cls = '') => `<span class="chip team ${cls}" style="--c:${t ? teamColor(t) : '#FFF6E5'}">${t ? `${t}팀` : '팀 미정'}</span>`;
  // 팀 고르는 select 를 고른 팀 색으로 채움
  const paintTeamSelect = (sel) => { sel.style.setProperty('--c', sel.value ? teamColor(Number(sel.value)) : '#FFF6E5'); };
  const MINUS = '−';

  let toastTimer = null;
  function toast(msg, isError = false) {
    $toast.textContent = msg;
    $toast.className = 'toast' + (isError ? ' error' : '');
    $toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $toast.hidden = true; }, isError ? 3500 : 2000);
  }

  function fmtTime(iso) {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function newToken() {
    if (crypto.randomUUID) return crypto.randomUUID() + '-' + crypto.randomUUID();
    const a = new Uint8Array(32);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function loadToken() {
    try {
      let t = localStorage.getItem(TOKEN_KEY);
      if (!t) { t = newToken(); localStorage.setItem(TOKEN_KEY, t); }
      return t;
    } catch {
      // 저장소가 막힌 브라우저(일부 시크릿 모드): 이번 접속 동안만 유지
      return newToken();
    }
  }

  // ------------------------------------------------------------------
  // 소리
  // ------------------------------------------------------------------
  let ac = null;
  // p = 뜯은 정도(0~1), k = 연출 세기(0~1): 좋은 상품일수록 뜯는 소리가 높아짐
  function beep(kind, p = 0, k = 0) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const now = ac.currentTime;
      const tone = (freq, start, len, vol, type = 'sine') => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, now + start);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
        o.connect(g).connect(ac.destination);
        o.start(now + start); o.stop(now + start + len + 0.02);
      };
      if (kind === 'rip') tone(180 + Math.random() * 120 + p * k * 700, 0, 0.04, 0.05 + p * k * 0.03, 'sawtooth');
      if (kind === 'pop') tone(880, 0, 0.14, 0.08, 'triangle');
      if (kind === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, i === 4 ? 0.7 : 0.18, 0.12, 'triangle'));
      if (kind === 'fanfare') {
        [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.2, 0.14, 'triangle'));
        [1047, 1319, 1568].forEach((f) => tone(f, 0.48, 1.1, 0.09, 'triangle'));
      }
      if (kind === 'jackpot') {
        [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.08, 0.15, 0.12, 'triangle'));
        [1047, 1319, 1568, 2093].forEach((f) => tone(f, 0.72, 1.8, 0.08, 'triangle'));
        [131, 196].forEach((f) => tone(f, 0.72, 1.2, 0.12, 'sawtooth'));
      }
      if (kind === 'lose') { tone(392, 0, 0.2, 0.1, 'triangle'); tone(330, 0.18, 0.4, 0.1, 'triangle'); }
    } catch {}
  }

  // ------------------------------------------------------------------
  // 설정 확인
  // ------------------------------------------------------------------
  if (!window.supabase || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('YOUR-PROJECT')
      || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes('YOUR-')) {
    $app.innerHTML = `
      <div class="center-screen"><div class="msg-card">
        <div class="logo">${ICON.tool}</div>
        <h1>설정이 필요해요</h1>
        <p>config.js 에 Supabase URL 과 anon 키를 넣어주세요.</p>
      </div></div>`;
    return;
  }

  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ------------------------------------------------------------------
  // 서버 호출
  // ------------------------------------------------------------------
  let busy = false;
  async function call(fn, args = {}, okMsg = null) {
    if (busy) return null;
    busy = true;
    $app.classList.add('busy');
    try {
      const { data, error } = await sb.rpc(fn, { p_token: state.token, ...args });
      if (error) {
        toast(error.message || '요청에 실패했어요.', true);
        return null;
      }
      if (okMsg) toast(okMsg);
      await refresh();
      return { data };
    } catch {
      toast('네트워크 오류예요. 잠시 후 다시 시도해 주세요.', true);
      return null;
    } finally {
      busy = false;
      $app.classList.remove('busy');
    }
  }

  let refreshing = false;
  let refreshAgain = false;
  async function refresh() {
    if (!state.me) return;
    if (refreshing) { refreshAgain = true; return; }
    refreshing = true;
    try {
      do {
        refreshAgain = false;
        await fetchAll();
      } while (refreshAgain);
    } finally {
      refreshing = false;
    }
  }

  async function fetchAll() {
    const [p, r, b, l, s, st, pz, dr] = await Promise.all([
      sb.from('ticket_players').select('id,name,balance,is_admin,team')
        .order('balance', { ascending: false }).order('name'),
      sb.from('ticket_rooms').select('*').order('id', { ascending: false }).limit(500),
      sb.from('ticket_bets').select('room_id,player_id,created_at,ticket_rooms!inner(status)')
        .in('ticket_rooms.status', ['open', 'locked']).order('created_at'),
      sb.rpc('ticket_get_logs', { p_token: state.token, p_limit: 300 }),
      sb.from('ticket_stats').select('*').single(),
      sb.from('ticket_settings').select('*'),
      sb.from('ticket_prizes').select('*').order('sort').order('id'),
      sb.from('ticket_draws').select('*').order('id', { ascending: false }).limit(2000),
    ]);
    const err = [p, r, b, l, s, st, pz, dr].find((x) => x.error);
    if (err) {
      console.error(err.error);
      return;
    }
    state.players = p.data;
    state.rooms = r.data;
    state.bets = b.data;
    state.logs = l.data;
    state.stats = s.data;
    state.settings = Object.fromEntries(st.data.map((x) => [x.key, x.value]));
    state.prizes = pz.data;
    state.draws = dr.data;

    const meRow = state.players.find((x) => x.id === state.me.id);
    if (!meRow) {
      // 삭제되었거나 기기 초기화된 경우
      const { data } = await sb.rpc('ticket_whoami', { p_token: state.token });
      if (!data) { state.me = null; renderJoin(); return; }
    } else {
      state.me.is_admin = meRow.is_admin;
      state.me.name = meRow.name;
    }
    renderData();
  }

  let refreshTimer = null;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 150);
  }

  function startRealtime() {
    const ch = sb.channel('ticket-casino-live');
    for (const table of ['ticket_players', 'ticket_rooms', 'ticket_bets', 'ticket_settings', 'ticket_prizes', 'ticket_draws']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh);
    }
    ch.subscribe((status) => {
      state.live = status === 'SUBSCRIBED';
      renderHeader();
      if (state.live) scheduleRefresh();
    });
    // 실시간 연결이 끊겨도 주기적으로 갱신
    setInterval(refresh, 15000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
    });
  }

  // ------------------------------------------------------------------
  // 입장 화면
  // ------------------------------------------------------------------
  function renderJoin() {
    $app.innerHTML = `
      <div class="join-screen">
        <svg class="join-deco" width="390" height="844" viewBox="0 0 390 844" aria-hidden="true">
          <g stroke="#1E1A2E" stroke-width="2" stroke-linejoin="round">
            <rect x="38" y="92" width="14" height="24" rx="3" fill="#FF4D3D" transform="rotate(-24 45 104)"/>
            <rect x="322" y="66" width="12" height="22" rx="3" fill="#3FA9F5" transform="rotate(28 328 77)"/>
            <circle cx="348" cy="232" r="8" fill="#FFD23F"/>
            <circle cx="30" cy="306" r="7" fill="#2DBE8C"/>
            <rect x="318" y="336" width="13" height="13" rx="2" fill="#9B7BEA" transform="rotate(20 324 342)"/>
            <rect x="62" y="206" width="10" height="20" rx="3" fill="#FFD23F" transform="rotate(40 67 216)"/>
            <circle cx="190" cy="54" r="5" fill="#FF4D3D"/>
            <rect x="24" y="676" width="12" height="22" rx="3" fill="#2DBE8C" transform="rotate(-30 30 687)"/>
            <circle cx="360" cy="650" r="7" fill="#FF4D3D"/>
            <rect x="344" y="742" width="12" height="12" rx="2" fill="#FFD23F" transform="rotate(16 350 748)"/>
          </g>
          <path d="${SPARK_D}" transform="translate(300 128) scale(1.2)" fill="#FFD23F" stroke="#1E1A2E" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
          <path d="${SPARK_D}" transform="translate(56 130) scale(0.8)" fill="#3FA9F5" stroke="#1E1A2E" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
          <path d="M14 612 q10 -12 20 0 t20 0 t20 0" fill="none" stroke="#FF4D3D" stroke-width="4" stroke-linecap="round"/>
          <path d="M316 590 q10 -12 20 0 t20 0 t20 0" fill="none" stroke="#3FA9F5" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <div class="join-head">
          <div class="tag-mint">LUCKY DRAW</div>
          <div class="join-stars">${hyukStar('#FF4D3D', 104, 62, 3, -10, 3)}${hyukStar('#3FA9F5', 104, 62, 3, 9, 3, 6)}</div>
          <div class="join-bros"><span class="hl">브라더스</span><span class="join-with">와 함께하는</span></div>
          <div class="ink-sticker">SC사업본부 워크샵</div>
          <div class="join-lead">이름만 입력하면 <span class="hl">바로 참여!</span></div>
          <div class="chip yellow join-date">10.15 – 16</div>
        </div>
        <form class="join-card" id="join-form">
          <div class="join-tag" aria-hidden="true">꽝 없음!</div>
          <label class="join-label" for="join-name">이름을 입력하고 입장하세요</label>
          <input class="input" id="join-name" maxlength="20" placeholder="이름" autocomplete="off" required>
          <button class="btn primary block lg" type="submit">입장하기${ICON.arrow}</button>
        </form>
        <div class="join-note">처음 입장한 기기에 이름이 연결돼요.<br>다른 기기로 바꾸려면 관리자에게 기기 초기화를 요청하세요.</div>
        <a class="join-stage" href="stage.html">${ICON.monitor}무대 화면으로 보기 (입장 없이)</a>
      </div>`;
    const $form = document.getElementById('join-form');
    const $name = document.getElementById('join-name');
    $name.focus();
    $form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $name.value.trim();
      if (!name) return;
      const btn = $form.querySelector('button');
      btn.disabled = true;
      try {
        const { data, error } = await sb.rpc('ticket_join', { p_name: name, p_token: state.token });
        if (error) { toast(error.message, true); return; }
        state.me = data;
        startMain();
      } catch {
        toast('네트워크 오류예요. 잠시 후 다시 시도해 주세요.', true);
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ------------------------------------------------------------------
  // 메인 화면 뼈대 (한 번만 그림 → 입력 중인 값이 실시간 갱신에 지워지지 않음)
  // ------------------------------------------------------------------
  let started = false;
  function startMain() {
    renderShell();
    refresh();
    if (!started) { started = true; startRealtime(); }
  }

  function renderShell() {
    const teamOpts = Array.from({ length: TEAMS }, (_, i) => `<option value="${i + 1}">${i + 1}팀</option>`).join('');
    const rankRows = [4, 3, 2, 1].map((amt, i) => `
      <div class="rank-row">
        <span class="rank-label ${i === 0 ? 'first' : ''}">${i + 1}등</span>
        <select class="input rank-team" data-rank="${i + 1}" aria-label="${i + 1}등 팀"><option value="">팀 선택</option>${teamOpts}</select>
        <input class="input rank-amt" type="number" inputmode="numeric" min="0" max="1000" value="${amt}" aria-label="${i + 1}등 지급 수량">
        <span class="rank-unit">장</span>
      </div>`).join('');

    $app.innerHTML = `
      <div class="header">
        <div class="me-box">
          <div class="avatar" id="me-avatar"></div>
          <div class="me-info">
            <div class="me-name" id="me-name"></div>
            <div class="me-sub" id="me-sub"></div>
          </div>
          <div class="me-balance" id="me-bal">${ICON.ticket}<div class="me-bal-text"><div class="unit">보유</div><div class="num-row"><span class="num">-</span><span class="num-unit">장</span></div></div></div>
        </div>
      </div>
      <nav class="tabbar" id="tabs" aria-label="하단 메뉴"></nav>

      <section data-view="rooms">
        <div class="page-head"><h2 class="page-title">게임방</h2></div>
        <div class="card hidden" id="room-create">
          <h3>게임방 만들기</h3>
          <div class="row">
            <input class="input" id="room-title" maxlength="30" placeholder="예: 1라운드 블랙잭">
            <button class="btn primary" data-action="create-room">만들기</button>
          </div>
        </div>
        <div id="rooms-active"></div>
        <div class="section-title">끝난 게임</div>
        <div class="card" id="rooms-done"></div>
      </section>

      <section data-view="board">
        ${WS_BANNER}
        <div class="hero" id="hero"></div>
        <div class="section-head"><span>팀별 당첨</span><small>주요 상품 수 · 뽑은 장수</small></div>
        <div class="card team-card">
          <div class="team-bars" id="team-summary"></div>
          <div id="integrity"></div>
        </div>
        <div class="section-head"><span>최근 당첨</span><small id="stats"></small></div>
        <div class="lb-list" id="board"></div>
        <div class="footer-link" id="claim-link">
          <button data-action="claim-admin">관리자 코드 입력</button>
        </div>
      </section>

      <section data-view="draw">
        <div class="page-head"><h2 class="page-title">뽑기</h2><span class="tilt-tag blue">1장 = 1번</span></div>
        <div id="draw-status"></div>
        <div class="draw-stage" id="draw-stage"></div>
        <div class="section-title">내 뽑기 결과</div>
        <div class="card list-card" id="my-draws"></div>
      </section>

      <section data-view="prizes">
        <div class="page-head"><h2 class="page-title">상품</h2>${spark('#3FA9F5', 26, ' class="page-spark" style="transform:rotate(12deg)"')}</div>
        <div id="pool-summary"></div>
        <div id="prize-list"></div>
        <div class="card hidden" id="prize-form-card">
          <h3 id="prize-form-title">상품 추가</h3>
          <div class="form-grid">
            <div class="row">
              <div style="flex:1"><label for="pf-grade">등급</label><input class="input" id="pf-grade" maxlength="20" placeholder="예: A상"></div>
              <div style="width:90px"><label for="pf-emoji">이모지</label><input class="input" id="pf-emoji" maxlength="8" placeholder="🎁" style="text-align:center"></div>
            </div>
            <label for="pf-name">상품 이름</label>
            <input class="input" id="pf-name" maxlength="40" placeholder="예: 무선 이어폰">
            <label for="pf-desc">설명 (선택)</label>
            <input class="input" id="pf-desc" maxlength="200" placeholder="예: 최신형, 색상 랜덤">
            <label for="pf-image">사진 주소 (선택 · 비우면 이모지)</label>
            <input class="input" id="pf-image" maxlength="1000" placeholder="prizes/cash.jpg 또는 https://...">
            <img class="pf-preview hidden" id="pf-preview" alt="">

            <div class="row">
              <div style="flex:1"><label for="pf-qty">수량</label><input class="input" id="pf-qty" type="number" inputmode="numeric" min="0" max="10000" value="1"></div>
              <div style="flex:1"><label for="pf-sort">표시 순서</label><input class="input" id="pf-sort" type="number" inputmode="numeric" value="1"></div>
            </div>
            <label class="toggle" style="margin-top:4px"><input type="checkbox" id="pf-announce" checked> ${ICON.monitor} 무대 화면에서 크게 발표</label>
            <label class="toggle"><input type="checkbox" id="pf-premium"> 고급 상품 (한 사람이 고급 상품을 2개 이상 받지 않게)</label>
            <label class="toggle"><input type="checkbox" id="pf-blank"> 꽝 (상품 없음)</label>
            <div class="row" style="margin-top:6px">
              <button class="btn primary" style="flex:1" data-action="save-prize">저장</button>
              <button class="btn ghost hidden" id="pf-cancel" data-action="cancel-prize">취소</button>
            </div>
          </div>
        </div>
      </section>

      <section data-view="logs">
        <div class="page-head"><h2 class="page-title">기록</h2>${spark('#2DBE8C', 24, ' class="page-spark" style="transform:rotate(-10deg)"')}</div>
        <div class="stat-tiles" id="log-stats"></div>
        <div class="card log-card">
          <div class="row log-head">
            <h3 id="logs-title">내 기록</h3>
            <label class="toggle hidden" id="only-mine-wrap"><input type="checkbox" id="only-mine"> 내 기록만</label>
          </div>
          <div id="logs"></div>
        </div>
      </section>

      <section data-view="admin">
        <div class="page-head"><h2 class="page-title">관리</h2><span class="tilt-tag grape">관리자 전용</span></div>
        <div class="card">
          <h3>뽑기 설정</h3>
          <div class="row" style="justify-content:space-between">
            <div id="draw-open-text"></div>
            <button class="btn" id="draw-open-btn" data-action="toggle-draw"></button>
          </div>
          <a class="btn block stage-link" href="stage.html" target="_blank">${ICON.monitor}무대 화면 열기</a>
        </div>

        <div class="card">
          <div id="ticket-budget"></div>
        </div>

        <div class="card">
          <h3>팀 순위 지급</h3>
          <div class="form-grid">
            ${rankRows}
            <input class="input" id="rank-note" maxlength="80" placeholder="메모 (예: 레크리에이션 1)">
            <button class="btn primary" data-action="grant-ranks">순위대로 지급</button>
          </div>
        </div>

        <div class="card">
          <h3>뽑기권 지급 / 회수</h3>
          <div class="form-grid">
            <label for="g-target">대상</label>
            <select class="input" id="g-target"></select>
            <label for="g-amount">수량</label>
            <div class="row">
              <input class="input" id="g-amount" type="number" inputmode="numeric" min="1" max="1000" value="1">
              <div class="quick">
                <button class="btn sm ghost" data-action="qty" data-n="1">1</button>
                <button class="btn sm ghost" data-action="qty" data-n="5">5</button>
                <button class="btn sm ghost" data-action="qty" data-n="10">10</button>
              </div>
            </div>
            <label for="g-note">메모 (선택)</label>
            <input class="input" id="g-note" maxlength="100" placeholder="예: 레크리에이션 1등">
            <div class="row" style="margin-top:4px">
              <button class="btn primary" style="flex:1" data-action="grant">지급</button>
              <button class="btn red" style="flex:1" data-action="revoke">회수</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>팀 일괄 배정</h3>
          <textarea class="input" id="team-import" rows="5" placeholder="[1팀] 홍길동, 김철수, 이영희&#10;[2팀] 박민수, 정승혁&#10;..."></textarea>
          <div class="small muted" style="margin:6px 0 10px">
            한 줄에 한 팀씩 "1팀: 이름, 이름" 형식. 아직 입장 안 한 이름은 미리 등록돼요.
          </div>
          <button class="btn block" data-action="import-teams">팀 적용</button>
        </div>

        <div class="card">
          <h3>참가자 관리</h3>
          <div id="admin-players"></div>
        </div>
      </section>`;

    // 팀 순위 지급: 고른 팀 색으로 칸을 채움 (보기만 바뀜)
    $app.querySelectorAll('.rank-team').forEach((sel) => sel.addEventListener('change', () => paintTeamSelect(sel)));
    $('#only-mine').addEventListener('change', (e) => {
      state.onlyMine = e.target.checked;
      renderLogs();
    });
    $('#room-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAction('create-room', {});
    });
    $('#pf-image').addEventListener('input', updateImagePreview);
    drawUI.mode = 'idle';
    drawUI.draw = null;
    renderData();
    renderDrawStage();
  }

  // ------------------------------------------------------------------
  // 데이터 렌더링
  // ------------------------------------------------------------------
  const nameOf = (id) => state.players.find((p) => p.id === id)?.name ?? '(삭제됨)';
  const roomOf = (id) => state.rooms.find((r) => r.id === id);
  const isActive = (r) => r.status === 'open' || r.status === 'locked';
  const myBalance = () => state.players.find((p) => p.id === state.me.id)?.balance ?? 0;
  const pool = () => ({
    total: state.prizes.reduce((s, p) => s + p.quantity, 0),
    remaining: state.prizes.reduce((s, p) => s + p.remaining, 0),
  });
  const drawOpen = () => state.settings.draw_open === 'true';
  // 상품 사진이 있으면 사진, 없으면 이모지 (사진을 못 불러오면 이모지로 대체)
  const prizeVisual = (prizeId, emoji) => {
    const url = state.prizes.find((p) => p.id === prizeId)?.image_url;
    return url
      ? `<img class="prize-photo" src="${esc(url)}" alt="" onerror="this.replaceWith(document.createTextNode(this.dataset.fallback))" data-fallback="${esc(emoji)}">`
      : esc(emoji);
  };
  function updateImagePreview() {
    const url = $('#pf-image')?.value.trim();
    const img = $('#pf-preview');
    if (!img) return;
    img.classList.toggle('hidden', !url);
    if (url) img.src = url;
  }
  // 연출 등급: 상품 목록 맨 위 = legend, 고급 상품 = epic, 무대 발표 상품 = rare, 나머지(젤리 등) = common
  // glow = 뜯을 때 새어 나오는 빛 세기, banner = 홈에서 다른 사람에게 크게 알림
  const FX = {
    legend: { label: TITLES[TITLE_SET].legend, glow: 1,   coins: 110, confetti: 110, flash: true,  sound: 'jackpot', banner: true,  vibrate: [120, 60, 120, 60, 420] },
    epic:   { label: TITLES[TITLE_SET].epic,   glow: .75, coins: 70,  confetti: 60,  flash: true,  sound: 'fanfare', banner: true,  vibrate: [100, 60, 260] },
    rare:   { label: TITLES[TITLE_SET].rare,   glow: .45, coins: 36,  confetti: 0,   flash: false, sound: 'win',     banner: false, vibrate: [80, 60, 160] },
    common: { label: '',                       glow: 0,   coins: 12,  confetti: 0,   flash: false, sound: 'pop',     banner: false, vibrate: [60] },
  };
  // 등급별 색종이 조각 (원색 채움 + 잉크 테두리): 모양 = circle · rect · spark, 색 = 아래 팔레트
  const PARTICLES = { legend: ['circle', 'rect', 'spark', 'spark'], epic: ['circle', 'rect', 'spark'], rare: ['circle', 'rect'], common: ['circle', 'rect'] };
  const CONFETTI = {
    legend: ['#FF4D3D', '#FFD23F', '#3FA9F5', '#2DBE8C', '#9B7BEA'],
    epic: ['#FFD23F', '#9B7BEA', '#3FA9F5', '#FF4D3D'],
    rare: ['#3FA9F5', '#2DBE8C', '#FFD23F'],
    common: ['#FFD23F', '#FF6B5E', '#2DBE8C'],
  };
  const CHARGE_MAX = { legend: 3, epic: 2, rare: 1, common: 0 };   // 긁는 중 반짝이 단계 (--p 0.15 / 0.45 / 0.75)
  // 결과 외침 글자 (Bagel Fat One + 잉크 외곽선 + 단단한 그림자). 이미지 안 씀
  const titleText = (tier, cls) => `<div class="${cls} shout shout-${tier}">${esc(FX[tier].label)}</div>`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const prizeTier = (prizeId) => {
    const p = state.prizes.find((x) => x.id === prizeId);
    if (!p || p.is_blank) return 'common';
    if (state.prizes.find((x) => !x.is_blank)?.id === p.id) return 'legend';
    if (p.premium) return 'epic';
    if (p.announce !== false) return 'rare';
    return 'common';
  };
  const gradeColor = (prizeId) => {
    const idx = state.prizes.filter((p) => !p.is_blank).findIndex((p) => p.id === prizeId);
    return GRADE_COLORS[Math.max(0, idx) % GRADE_COLORS.length];
  };

  function renderData() {
    if (!state.me || !$('#tabs')) return;
    if (state.tab === 'admin' && !state.me.is_admin) state.tab = 'board';
    renderHeader();
    renderTabs();
    renderRooms();
    renderBoard();
    renderDrawInfo();
    renderPrizes();
    renderLogs();
    if (state.me.is_admin) renderAdmin();
  }

  function renderHeader() {
    if (!state.me || !$('#me-name')) return;
    const meRow = state.players.find((p) => p.id === state.me.id);
    $('#me-name').textContent = state.me.name;
    $('#me-avatar').textContent = [...state.me.name][0] || '?';
    $('#me-avatar').style.setProperty('--c', meRow?.team ? teamColor(meRow.team) : '#FFF6E5');
    $('#me-sub').innerHTML =
      teamChip(meRow?.team)
      + (state.me.is_admin ? '<span class="chip grape">관리자</span>' : '')
      + `<span class="live-dot ${state.live ? 'on' : ''}" title="${state.live ? '실시간 연결됨' : '연결 중'}"></span>`;
    const $bal = $('#me-bal');
    const $num = $bal.querySelector('.num');
    const next = meRow ? String(meRow.balance) : '-';
    if ($num.textContent !== next) {
      const changed = $num.textContent !== '-';
      $num.textContent = next;
      if (changed) {
        $bal.classList.remove('bump');
        void $bal.offsetWidth;
        $bal.classList.add('bump');
      }
    }
  }

  function renderTabs() {
    // 게임방 탭은 숨김 (기능·DB 는 그대로). 다시 쓰려면 맨 앞에 ['rooms', ICON.rooms, '게임'] 추가
    const tabs = [['board', ICON.home, '홈'], ['draw', ICON.draw, '뽑기'], ['prizes', ICON.prizes, '상품'], ['logs', ICON.logs, '기록']];
    if (state.me.is_admin) tabs.push(['admin', ICON.admin, '관리']);
    $('#tabs').innerHTML = tabs.map(([k, icon, label]) =>
      `<button class="tab ${state.tab === k ? 'active' : ''}" data-action="tab" data-tab="${k}"${state.tab === k ? ' aria-current="page"' : ''}>
        <span class="tab-icon">${icon}</span><span class="tab-label">${label}</span></button>`).join('');
    $app.querySelectorAll('section[data-view]').forEach((s) => {
      s.classList.toggle('hidden', s.dataset.view !== state.tab);
    });
  }

  function renderRooms() {
    const me = state.me;
    const myBal = myBalance();
    $('#room-create').classList.toggle('hidden', !me.is_admin);

    const active = state.rooms.filter(isActive);
    if (state.picking && !active.some((r) => r.id === state.picking)) state.picking = null;
    const first = state.seenRooms === null;
    state.seenRooms = state.seenRooms || new Set();

    $('#rooms-active').innerHTML = active.length === 0
      ? `<div class="card empty">진행 중인 게임이 없어요.${me.is_admin ? '<br>위에서 방을 만들어 보세요.' : ''}</div>`
      : active.map((r) => {
        const roomBets = state.bets.filter((b) => b.room_id === r.id);
        const mine = roomBets.some((b) => b.player_id === me.id);
        const picking = state.picking === r.id;
        const enter = !first && !state.seenRooms.has(r.id);
        const tick = state.prevPots.has(r.id) && state.prevPots.get(r.id) !== roomBets.length;

        const chip = (b) => {
          const p = state.players.find((x) => x.id === b.player_id);
          const pop = !first && !state.seenBets.has(`${r.id}/${b.player_id}`) ? ' pop' : '';
          const ini = `<i class="ini" style="--c:${p?.team ? teamColor(p.team) : '#FFF6E5'}">${esc([...nameOf(b.player_id)][0] || '?')}</i>`;
          return picking
            ? `<button class="chip pick${pop}" data-action="pick-winner" data-room="${r.id}" data-player="${b.player_id}">${ini}${esc(nameOf(b.player_id))}</button>`
            : `<span class="chip ${b.player_id === me.id ? 'mine' : ''}${pop}">${ini}${esc(nameOf(b.player_id))}</span>`;
        };
        const chips = roomBets.length === 0
          ? '<span class="muted small">아직 아무도 걸지 않았어요.</span>'
          : roomBets.map(chip).join('');

        let actions = '';
        if (r.status === 'open') {
          actions = mine
            ? `<span class="muted small" style="flex:1;align-self:center">1장 걸었어요</span>
               <button class="btn ghost" data-action="unbet" data-room="${r.id}">걸기 취소</button>`
            : `<button class="btn primary main" data-action="bet" data-room="${r.id}" ${myBal < 1 ? 'disabled' : ''}>
                 ${myBal < 1 ? '뽑기권이 없어요' : '1장 걸기'}</button>`;
        } else {
          actions = `<span class="muted small locked-note">${ICON.lock} 마감 · 결과 대기 중${mine ? ' (참여 중)' : ''}</span>`;
        }

        const admin = me.is_admin ? `
          <div class="admin-actions">
            ${r.status === 'open'
              ? `<button class="btn sm" data-action="lock" data-room="${r.id}">베팅 마감</button>`
              : `<button class="btn sm" data-action="unlock" data-room="${r.id}">베팅 재개</button>`}
            ${picking
              ? `<button class="btn sm ghost" data-action="pick-cancel">선택 취소</button>`
              : `<button class="btn sm green" data-action="pick-start" data-room="${r.id}" ${roomBets.length === 0 ? 'disabled' : ''}>승자 선택</button>`}
            <button class="btn sm red" data-action="cancel-room" data-room="${r.id}">방 취소·환불</button>
            <button class="btn sm red" data-action="delete-room" data-room="${r.id}" aria-label="삭제">${ICON.trash}</button>
          </div>
          ${picking ? '<div class="pick-hint">위 참가자 중 승자를 눌러주세요</div>' : ''}` : '';

        return `
          <div class="card room ${r.status}${enter ? ' enter' : ''}">
            <div class="room-head">
              <div>
                <div class="room-state ${r.status}"><i></i>${r.status === 'open' ? '베팅 중' : '마감'} · ${roomBets.length}명 참여</div>
                <div class="room-title">${esc(r.title)}</div>
              </div>
              <div class="pot${tick ? ' tick' : ''}"><div class="unit">판돈</div><div class="num">${roomBets.length}</div></div>
            </div>
            <div class="chips">${chips}</div>
            <div class="room-actions">${actions}</div>
            ${admin}
          </div>`;
      }).join('');
    active.forEach((r) => {
      state.seenRooms.add(r.id);
      state.prevPots.set(r.id, state.bets.filter((b) => b.room_id === r.id).length);
    });
    state.seenBets = new Set(state.bets.map((b) => `${b.room_id}/${b.player_id}`));

    const done = state.rooms.filter((r) => !isActive(r))
      .sort((a, b) => String(b.closed_at).localeCompare(String(a.closed_at)))
      .slice(0, 30);
    $('#rooms-done').innerHTML = done.length === 0
      ? '<div class="empty">아직 끝난 게임이 없어요.</div>'
      : done.map((r) => `
        <div class="done-row">
          <div>
            <div class="done-title">${esc(r.title)}</div>
            <div class="small muted">${r.closed_at ? fmtTime(r.closed_at) : ''}</div>
          </div>
          <div class="row" style="gap:10px">
            <div style="text-align:right">
              ${r.status === 'settled'
                ? `<div><b>${esc(nameOf(r.winner_id))}</b></div><div class="small done-pot">+${r.pot}장</div>`
                : '<span class="badge cancelled">취소·환불</span>'}
            </div>
            ${me.is_admin ? `<button class="btn sm red" data-action="delete-room" data-room="${r.id}" aria-label="삭제">${ICON.trash}</button>` : ''}
          </div>
        </div>`).join('');
  }

  function renderBoard() {
    // 뜯어서 공개된 당첨만 (무대와 같은 기준). 무대 발표를 끈 상품(젤리 등)은 이름 없이 개수만
    const won = state.draws.filter((d) => d.revealed && !d.is_blank);
    const isMajor = (d) => state.prizes.find((p) => p.id === d.prize_id)?.announce !== false;
    const major = won.filter(isMajor)
      .sort((a, b) => String(b.revealed_at).localeCompare(String(a.revealed_at)));

    // 내 뽑기권 카드
    const meRow = state.players.find((p) => p.id === state.me.id);
    const myWins = won.filter((d) => d.player_id === state.me.id).length;
    const bal = meRow?.balance ?? 0;
    $('#hero').innerHTML = `
      <div class="hero-top">
        <span class="hero-label">내 뽑기권</span>
        <span class="hero-wins">${myWins ? `내 당첨 <b>${myWins}개</b>` : ''}</span>
      </div>
      <div class="hero-num"><b>${bal}</b><span>장</span>
        <svg class="hero-art" width="96" height="60" viewBox="0 0 96 60" aria-hidden="true"><g stroke="#1E1A2E" stroke-width="2.5" stroke-linejoin="round"><rect x="28" y="6" width="60" height="34" rx="6" fill="#FF4D3D" transform="rotate(10 58 23)"/><rect x="10" y="16" width="62" height="36" rx="6" fill="#FFD23F" transform="rotate(-6 41 34)"/></g><path d="M54 18 L56 50" stroke="#1E1A2E" stroke-width="2" stroke-dasharray="3 3" transform="rotate(-6 41 34)"/><path d="${SPARK_D}" transform="translate(20 23) scale(0.62)" fill="#FFFFFF" stroke="#1E1A2E" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
      </div>
      <div class="hero-actions">
        <button class="btn primary ${bal < 1 ? 'off' : ''}" data-action="tab" data-tab="draw">${ICON.ticket} 뽑기 하러 가기</button>
        <button class="btn" data-action="tab" data-tab="prizes">상품 보기</button>
      </div>`;

    // 팀별 당첨 막대: 주요 상품 수 (뽑기 당시 팀 기준)
    const teamSums = Array.from({ length: TEAMS }, (_, i) => ({
      team: i + 1,
      sum: major.filter((d) => d.team === i + 1).length,
      cnt: state.draws.filter((d) => d.revealed && d.team === i + 1).length,
    }));
    const maxSum = Math.max(1, ...teamSums.map((t) => t.sum));
    $('#team-summary').innerHTML = teamSums.map((t) => `
      <div class="team-bar" style="--c:${teamColor(t.team)}">
        <span class="team-name">${t.team}팀</span>
        <span class="bar"><i class="${t.sum ? '' : 'zero'}" style="width:${Math.round((t.sum / maxSum) * 100)}%"></i></span>
        <span class="team-sum">${t.sum}</span>
        <span class="team-cnt">${t.cnt}장</span>
      </div>`).join('');

    const s = state.stats;
    if (s) {
      const drawn = s.drawn ?? 0;
      const ok = s.issued === s.held + s.staked + drawn;
      const detail = `보유 ${s.held}${s.staked ? ` + 판돈 ${s.staked}` : ''} + 뽑기 ${drawn}`;
      $('#integrity').innerHTML = ok
        ? `<div class="integrity ok"><span class="ic">${svg('<path d="M20 6 9 17l-5-5"/>', 10, 4)}</span>총 발행 ${s.issued}장 = ${detail} · 정합성 확인됨</div>`
        : `<div class="integrity bad"><span class="ic">${svg('<path d="M12 6v8M12 18h.01"/>', 10, 4)}</span>수량 불일치 · 총 발행 ${s.issued}장 ≠ ${detail}</div>`;
    }

    const minor = won.length - major.length;
    $('#stats').textContent = won.length ? `주요 ${major.length}개${minor ? ` · 그 외 ${minor}개` : ''}` : '';

    // 데이터를 처음 받기 전(빈 화면)에는 '이미 본 당첨'을 기록하지 않음 → 첫 화면에서 옛 당첨이 새것처럼 뜨지 않게
    const loaded = !!state.stats;
    if (!loaded) state.seenDraws = null;

    // 다른 사람의 큰 당첨(epic 이상)은 어느 탭에 있든 위쪽 배너로
    if (loaded && state.seenDraws) {
      major.filter((d) => !state.seenDraws.has(d.id) && d.player_id !== state.me.id && FX[prizeTier(d.prize_id)].banner)
        .reverse().forEach(queueWinBanner);
    }

    $('#board').innerHTML = major.slice(0, 50).map((d) => {
      const flash = state.seenDraws && !state.seenDraws.has(d.id);
      const tier = prizeTier(d.prize_id);
      return `
        <div class="lb-row tier-${tier} ${d.player_id === state.me.id ? 'me' : ''} ${flash ? 'flash' : ''}">
          <span class="draw-emoji">${prizeVisual(d.prize_id, d.emoji)}</span>
          <span class="nm"><b>${esc(d.player_name)}${d.player_id === state.me.id ? ' <em>나</em>' : ''}</b>
            <small>${teamChip(d.team, 'xs')}${fmtTime(d.revealed_at || d.created_at)}</small></span>
          <span class="feed-prize">${tier === 'legend' ? '<span class="daebak">대박</span>' : ''}<span class="fp-line"><b class="grade">${esc(d.grade)}</b><span class="fp-name">${esc(d.prize_name)}</span></span></span>
        </div>`;
    }).join('') || '<div class="empty">아직 당첨이 없어요.</div>';
    if (loaded) state.seenDraws = new Set(won.map((d) => d.id));

    $('#claim-link').classList.toggle('hidden', state.me.is_admin);
  }

  // ------------------------------------------------------------------
  // 뽑기
  // ------------------------------------------------------------------
  function pendingDraw() {
    return state.draws.find((d) => d.player_id === state.me.id && !d.revealed) || null;
  }

  function drawBlockReason() {
    const pl = pool();
    if (state.prizes.length === 0) return '상품이 아직 준비되지 않았어요';
    if (pl.remaining === 0) return '복권이 모두 소진됐어요';
    if (!drawOpen()) return '아직 뽑기 시간이 아니에요';
    if (myBalance() < 1) return '뽑기권이 없어요';
    return null;
  }

  // 실시간 갱신마다 바뀌는 부분 (카드 자체는 건드리지 않음)
  function renderDrawInfo() {
    const pl = pool();
    const pct = pl.total ? Math.round((pl.remaining / pl.total) * 100) : 0;
    $('#draw-status').innerHTML = `
      <div class="draw-status ${drawOpen() ? 'open' : ''}">
        <div class="ds-row">
          <span class="ds-state"><i></i>${drawOpen() ? '뽑기 진행 중' : '뽑기 대기 중'}</span>
          <span class="ds-left">남은 복권 <b>${pl.remaining}</b> / ${pl.total}</span>
        </div>
        <div class="ds-bar" role="progressbar" aria-label="남은 복권" aria-valuemin="0" aria-valuemax="${pl.total}" aria-valuenow="${pl.remaining}"><i class="${pct ? '' : 'zero'}" style="width:${pct}%"></i></div>
      </div>`;
    // 카드는 다시 그리지 않고 숫자만 갱신 (뜯는 중이면 그대로)
    if (drawUI.mode === 'idle' && $('#pt-count')) {
      $('#pt-count').textContent = `${pl.remaining}/${pl.total}`;
    }

    // 다른 기기에서 뽑고 안 뜯은 복권이 있으면 이어서 뜯기
    if (drawUI.mode === 'idle') {
      const pend = pendingDraw();
      if (pend) {
        drawUI.mode = 'ready';
        drawUI.draw = pend;
        drawUI.progress = 0;
        renderDrawStage();
      } else {
        updateDrawButton();
      }
    } else if (drawUI.mode === 'revealed') {
      updateDrawButton();
    }

    const mine = state.draws.filter((d) => d.player_id === state.me.id && d.revealed);
    $('#my-draws').innerHTML = mine.length === 0
      ? '<div class="empty">아직 뽑은 복권이 없어요.</div>'
      : mine.map((d) => `
        <div class="draw-row ${d.is_blank ? 'blank' : 'win'}">
          <div class="draw-emoji">${d.is_blank ? ICON.sad : prizeVisual(d.prize_id, d.emoji)}</div>
          <div class="dr-body">
            <div class="dr-title"><b class="grade">${esc(d.grade)}</b>${d.is_blank ? '' : esc(d.prize_name)}</div>
            <div class="small muted">${fmtTime(d.revealed_at || d.created_at)}</div>
          </div>
          ${d.is_blank ? '' : (d.claimed ? '<span class="badge open">수령 완료</span>' : '<span class="badge locked">수령 대기</span>')}
        </div>`).join('');
  }

  function updateDrawButton() {
    const btn = $('#draw-btn');
    if (!btn) return;
    const reason = drawBlockReason();
    btn.disabled = !!reason;
    btn.innerHTML = reason ? esc(reason) : `${ICON.ticket} ${drawUI.mode === 'revealed' ? `한 장 더 뽑기 · 남은 ${myBalance()}장` : '뽑기권 1장 사용하기'}`;
  }

  // 카드 영역: 뽑기 흐름이 바뀔 때만 다시 그림
  function renderDrawStage() {
    const $st = $('#draw-stage');
    if (!$st) return;
    const pl = pool();
    const d = drawUI.draw;
    const no = d ? String(d.id).padStart(6, '0') : '------';
    const revealed = drawUI.mode === 'revealed';
    const peelable = drawUI.mode === 'ready';
    const tier = d && !d.is_blank ? prizeTier(d.prize_id) : '';

    $st.innerHTML = `
      <div class="pt-card ${revealed ? (d.is_blank ? 'lose' : 'win') : ''} ${tier ? `fx-${tier}` : ''} ${peelable ? 'peelable' : ''}" id="pt-card">
        <div class="pt-aura" aria-hidden="true"></div>
        <div class="pt-charge" aria-hidden="true">${['#FFD23F', '#3FA9F5', '#FFFFFF', '#FF4D3D', '#FFD23F', '#2DBE8C'].map((c, i) => spark(c, 26, ` class="cs cs${i + 1}"`)).join('')}</div>
        <div class="pt-inner">
          <i class="pt-notch top" aria-hidden="true"></i><i class="pt-notch bottom" aria-hidden="true"></i>
          <div class="pt-top">
            <span class="pt-brand">${spark('#FFFFFF', 18)}럭키 뽑기권</span>
            <span class="pt-no">No. ${no}</span>
          </div>
          <div class="pt-window" id="pt-window">
            <div class="pt-prize">
              <div class="pt-grade">${d ? esc(d.is_blank ? '꽝' : d.grade) : '?'}</div>
              <div class="pt-emoji">${d ? (d.is_blank ? ICON.sad : prizeVisual(d.prize_id, d.emoji)) : ''}</div>
              <div class="pt-pname">${d && !d.is_blank ? esc(d.prize_name) : ''}</div>
            </div>
            <div class="pt-cover ${peelable ? 'peelable' : ''}" id="pt-cover" style="width:${revealed ? 0 : 100}%"${peelable ? ' aria-label="복권 열어 보기"' : ''}>
              <div class="pt-cover-bg" id="pt-cover-bg">
                <div class="pt-open"><b>${peelable ? '열어 보기 →' : 'LUCKY'}</b><span>${peelable ? '오른쪽으로 밀어서 뜯기' : '뽑기권 1장으로 한 장'}</span></div>
              </div>
              <div class="pt-tab">${ICON.chevron}</div>
            </div>
            <div class="pt-tear" id="pt-tear" aria-hidden="true"><span class="pt-handle">${ICON.chevron}</span></div>
          </div>
        </div>
        <div class="pt-coins" id="pt-coins"></div>
      </div>
      <div class="pt-result" id="pt-result">${revealed ? resultHtml(d) : (peelable ? '<div class="pt-note">결과는 이미 정해져 있어요. 뜯는 순간 무대에 공개돼요</div>' : '')}</div>
      ${peelable ? '' : '<button class="btn primary block draw-btn" id="draw-btn" data-action="draw"></button>'}`;

    updateDrawButton();
    if (peelable) bindPeel();
  }

  // 다 뜯은 순간 (WinReveal): 외침 글자 → 노란 별폭발 위 기울인 상품 카드 → 등급 알약 · 상품 이름 · 당첨자
  function resultHtml(d) {
    if (d.is_blank) return `<div class="res lose"><div class="res-big">꽝!</div><div class="res-sub">다음 기회에</div></div>`;
    const tier = prizeTier(d.prize_id);
    const meRow = state.players.find((p) => p.id === state.me.id);
    const team = d.team ?? meRow?.team;
    const announce = state.prizes.find((p) => p.id === d.prize_id)?.announce !== false;
    return `<div class="res win res-${tier}">
      ${FX[tier].label ? titleText(tier, 'fx-title') : ''}
      <div class="wr-burst">${BURST}
        <div class="wr-card"><span class="wr-grade">${esc(d.grade)}</span><div class="wr-photo">${prizeVisual(d.prize_id, d.emoji)}</div><i class="wr-tape" aria-hidden="true"></i></div>
      </div>
      <div class="res-big">${esc(d.grade)} 당첨</div>
      <div class="res-prize">${esc(d.prize_name)}</div>
      <div class="wr-who">${teamChip(team)}<b>${esc(d.player_name || state.me.name)}</b></div>
      ${announce ? `<div class="wr-stage">${ICON.monitor}지금 무대 화면에 발표되고 있어요</div>` : ''}
    </div>`;
  }

  // 왼쪽 → 오른쪽으로 뜯기 (덮개는 오른쪽에 붙어 있고 왼쪽부터 줄어듦)
  function bindPeel() {
    const cover = $('#pt-cover');
    const win = $('#pt-window');
    $('#pt-cover-bg').style.width = `${win.clientWidth}px`;  // 덮개 무늬가 같이 찌그러지지 않게
    let startX = null;
    let startP = 0;
    let moved = 0;
    let lastRip = 0;
    const card = $('#pt-card');
    const tier = drawUI.draw && !drawUI.draw.is_blank ? prizeTier(drawUI.draw.prize_id) : 'common';
    const k = FX[tier].glow;
    const tear = $('#pt-tear');

    // 뜯은 정도를 --p 로 넘김 → 좋은 상품일수록 뜯는 선에서 빛이 새어 나오고 점점 세짐 (style.css '뽑기 연출')
    const setP = (p) => {
      drawUI.progress = p;
      cover.style.width = `${(1 - p) * 100}%`;
      card.style.setProperty('--p', p.toFixed(3));
      card.classList.toggle('charging', p > 0.01);
      card.dataset.charge = Math.min(CHARGE_MAX[tier], p >= 0.75 ? 3 : p >= 0.45 ? 2 : p >= 0.15 ? 1 : 0);
      if (tear) tear.style.left = `calc(${(p * 100).toFixed(2)}% - 40px)`;
      if (Math.abs(p - lastRip) > 0.06) {
        lastRip = p;
        beep('rip', p, k);
        if (k >= 0.75 && navigator.vibrate) navigator.vibrate(8 + Math.round(p * 20));
      }
    };

    cover.addEventListener('pointerdown', (e) => {
      if (drawUI.mode !== 'ready') return;
      startX = e.clientX;
      startP = drawUI.progress;
      moved = 0;
      try { cover.setPointerCapture(e.pointerId); } catch {}
    });
    cover.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      setP(Math.min(1, Math.max(0, startP + (e.clientX - startX) / win.clientWidth)));
    });
    const end = () => {
      if (startX === null) return;
      startX = null;
      if (moved < 6 || drawUI.progress > 0.18) animateP(1);
      else animateP(0);
    };
    cover.addEventListener('pointerup', end);
    cover.addEventListener('pointercancel', end);

    function animateP(target) {
      drawUI.mode = target === 1 ? 'peeling' : 'ready';
      const from = drawUI.progress;
      const dur = Math.max(250, Math.abs(target - from) * 1500);
      const t0 = performance.now();
      const stepFn = (t) => {
        const u = Math.min(1, (t - t0) / dur);
        const e = target === 1 ? u * u * (3 - 2 * u) : 1 - (1 - u) * (1 - u);
        setP(from + (target - from) * e);
        if (u < 1) requestAnimationFrame(stepFn);
        else if (target === 1) onRevealed();
      };
      requestAnimationFrame(stepFn);
    }
  }

  async function onRevealed() {
    const d = drawUI.draw;
    drawUI.mode = 'revealed';
    const card = $('#pt-card');
    card.classList.remove('charging');
    card.classList.add(d.is_blank ? 'lose' : 'win');
    $('#pt-cover').remove();
    $('#pt-tear')?.remove();
    delete card.dataset.charge;
    $('#pt-result').innerHTML = resultHtml(d);
    // 결과 문구가 폰 화면 아래에 걸리지 않게 보이는 곳으로
    $('#pt-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (d.is_blank) {
      beep('lose');
    } else {
      const tier = prizeTier(d.prize_id);
      const fx = FX[tier];
      beep(fx.sound);
      burstCoins(fx.coins, tier);
      if (fx.flash) flashScreen(tier);
      if (fx.confetti) confetti(fx.confetti, tier);
      if (navigator.vibrate) navigator.vibrate(fx.vibrate);
    }
    const btn = document.createElement('button');
    btn.className = 'btn primary block draw-btn';
    btn.id = 'draw-btn';
    btn.dataset.action = 'draw';
    $('#draw-stage').appendChild(btn);
    updateDrawButton();
    // 다 뜯었으니 무대 화면에 공개
    try { await sb.rpc('ticket_reveal', { p_token: state.token, p_draw: d.id }); } catch {}
    refresh();
  }

  function burstCoins(n = 36, tier = 'common') {
    const box = $('#pt-coins');
    if (!box) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div');
      const shape = pick(PARTICLES[tier]);
      const color = pick(CONFETTI[tier]);
      c.className = `coin bit-${shape}`;
      const size = shape === 'spark' ? 22 + Math.round(Math.random() * 10) : 10 + Math.round(Math.random() * 8);
      c.style.width = `${size}px`;
      c.style.height = `${shape === 'rect' ? Math.round(size * 1.7) : size}px`;
      c.style.left = c.style.top = `${-size / 2}px`;
      if (shape === 'spark') c.innerHTML = spark(color, size);
      else c.style.setProperty('--c', color);
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * (110 + n * 1.6);
      c.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      c.style.setProperty('--dy', `${Math.sin(ang) * dist - 60}px`);
      c.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
      c.style.animationDelay = `${Math.random() * 0.15}s`;
      box.appendChild(c);
      setTimeout(() => c.remove(), 1800);
    }
  }

  // 화면 전체에 덮는 연출 층 (꽃가루, 번쩍임, 당첨 배너)
  function fxLayer() {
    let el = document.getElementById('fx-layer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fx-layer';
      el.className = 'fx-layer';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  function confetti(n, tier = 'epic') {
    const layer = fxLayer();
    const colors = CONFETTI[tier] || CONFETTI.legend;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      const color = colors[i % colors.length];
      // 색종이: 원 · 둥근 사각형 · 반짝이 (원색 + 잉크 2px 테두리)
      const shape = i % 7 === 0 ? 'spark' : i % 3 === 0 ? 'circle' : 'rect';
      c.className = `confetti bit-${shape}`;
      c.style.left = `${Math.random() * 100}%`;
      if (shape === 'spark') { c.innerHTML = spark(color, 20); } else { c.style.setProperty('--c', color); }
      c.style.setProperty('--dx', `${Math.random() * 120 - 60}px`);
      c.style.setProperty('--r', `${Math.random() * 1080 - 540}deg`);
      c.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
      c.style.animationDelay = `${Math.random() * 0.5}s`;
      layer.appendChild(c);
      setTimeout(() => c.remove(), 4600);
    }
  }

  function flashScreen(tier) {
    const f = document.createElement('div');
    f.className = `fx-flash fx-flash-${tier}`;
    fxLayer().appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  // 홈 등에서 다른 사람의 큰 당첨을 위쪽 배너로 알림 (한 번에 하나씩, 내가 뜯는 중엔 잠시 미룸)
  const bannerQueue = [];
  let bannerBusy = false;
  function queueWinBanner(d) {
    bannerQueue.push(d);
    showNextBanner();
  }
  function showNextBanner() {
    if (bannerBusy || !bannerQueue.length) return;
    if (drawUI.mode === 'ready' || drawUI.mode === 'peeling') { setTimeout(showNextBanner, 1500); return; }
    bannerBusy = true;
    const d = bannerQueue.shift();
    const tier = prizeTier(d.prize_id);
    const el = document.createElement('div');
    el.className = `win-banner tier-${tier}`;
    el.innerHTML = `
      <div class="wb-label">${titleText(tier, 'wb-title')}</div>
      <div class="wb-body">
        <span class="draw-emoji">${prizeVisual(d.prize_id, d.emoji)}</span>
        <span class="wb-who"><b>${esc(d.player_name)}</b><small>${d.team ? teamChip(d.team, 'xs') : ''}</small></span>
        <span class="wb-prize"><b class="grade">${esc(d.grade)}</b>${esc(d.prize_name)}</span>
      </div>`;
    fxLayer().appendChild(el);
    confetti(tier === 'legend' ? 60 : 24, tier);
    beep(tier === 'legend' ? 'fanfare' : 'win');
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { el.remove(); bannerBusy = false; showNextBanner(); }, 450);
    }, tier === 'legend' ? 5200 : 4000);
  }

  async function doDraw() {
    if (drawBlockReason()) return;
    const res = await call('ticket_draw');
    if (!res) return;
    const d = res.data;
    // 실시간 갱신이 먼저 같은 복권을 띄웠을 수 있음
    if (drawUI.mode === 'ready' && drawUI.draw?.id === d.id) return;
    drawUI.mode = 'ready';
    drawUI.draw = d;
    drawUI.progress = 0;
    renderDrawStage();
  }

  // ------------------------------------------------------------------
  // 상품
  // ------------------------------------------------------------------
  function renderPrizes() {
    const pl = pool();
    const admin = state.me.is_admin;
    const revealed = state.draws.filter((d) => d.revealed);
    const blanks = state.prizes.filter((p) => p.is_blank);
    const real = state.prizes.filter((p) => !p.is_blank);

    $('#pool-summary').innerHTML = `
      <div class="pool">
        <span class="pool-note">${blanks.length ? `꽝 ${blanks.reduce((s, b) => s + b.quantity, 0)}장 포함` : '꽝 없이 모두 하나씩'}</span>
        <span>상자에 남은 복권 <b>${pl.remaining}</b> / ${pl.total}</span>
      </div>`;

    const tile = (p, i) => {
      const won = revealed.filter((d) => d.prize_id === p.id);
      const left = p.quantity - won.length;   // 무대와 같은 기준: 뜯어서 공개된 것만 차감
      const col = GRADE_COLORS[i % GRADE_COLORS.length];
      // SOLD OUT 도장: 1등 카드는 "다 나갔어요"까지, 타일은 SOLD OUT 두 줄. 사진만 흑백, 글자는 그대로
      const stamp = left > 0 ? '' : (i === 0
        ? '<div class="stamp big"><small>SOLD OUT</small><b>다<br>나갔어요</b></div>'
        : '<div class="stamp">SOLD<br>OUT</div>');
      return `
        <div class="pz ${i === 0 ? 'featured' : ''} ${left <= 0 ? 'soldout' : ''}" style="--g:${col}">
          <div class="pz-img">${prizeVisual(p.id, p.emoji)}${stamp}</div>
          <div class="pz-body">
            <div class="pz-top"><span class="grade">${esc(p.grade)}</span>${p.premium ? '<span class="badge premium">1인 1개</span>' : ''}<span class="pz-left"><b>${left}</b> / ${p.quantity}</span></div>
            <div class="pz-name">${esc(p.name)}</div>
            ${p.description ? `<div class="pz-desc">${esc(p.description)}</div>` : ''}
            ${won.length && p.announce === false ? `<div class="winners"><span class="chip winner">당첨 ${won.length}명</span></div>` : ''}
            ${won.length && p.announce !== false ? `<div class="winners">${won.map((d) => `
              <${admin ? 'button' : 'span'} class="chip winner ${d.claimed ? 'claimed' : ''}" style="--c:${d.team ? teamColor(d.team) : '#FFFFFF'}" ${admin ? `data-action="toggle-claim" data-draw="${d.id}"` : ''}>
                ${esc(d.player_name)}${d.claimed ? ICON.check : ''}
              </${admin ? 'button' : 'span'}>`).join('')}${i === 0 ? '<span class="won-word">당첨!</span>' : ''}</div>` : ''}
            ${admin ? `<div class="pz-admin">
              <button class="btn sm ghost" data-action="edit-prize" data-prize="${p.id}">수정</button>
              ${p.remaining === p.quantity ? `<button class="btn sm red" data-action="delete-prize" data-prize="${p.id}" aria-label="삭제">${ICON.trash}</button>` : ''}
              <span class="small muted">실제 ${p.remaining}${p.announce === false ? ' · 발표 안 함' : ''}</span>
            </div>` : ''}
          </div>
        </div>`;
    };

    $('#prize-list').innerHTML = (real.length === 0 && blanks.length === 0)
      ? `<div class="card empty">아직 등록된 상품이 없어요.${admin ? '<br>아래에서 상품을 추가해 주세요.' : ''}</div>`
      : `<div class="pz-grid">${real.map(tile).join('')}</div>` + blanks.map((p) => `
        <div class="card blank-row">
          <span>${esc(p.emoji)} <b>${esc(p.grade)}</b> ${p.quantity}장</span>
          ${admin ? `<span class="row" style="gap:6px">
            <button class="btn sm ghost" data-action="edit-prize" data-prize="${p.id}">수정</button>
            ${p.remaining === p.quantity ? `<button class="btn sm red" data-action="delete-prize" data-prize="${p.id}">삭제</button>` : ''}
          </span>` : ''}
        </div>`).join('');

    $('#prize-form-card').classList.toggle('hidden', !admin);
    if (admin) {
      $('#prize-form-title').textContent = state.editingPrize ? '상품 수정' : '상품 추가';
      $('#pf-cancel').classList.toggle('hidden', !state.editingPrize);
    }
  }

  function fillPrizeForm(p) {
    $('#pf-grade').value = p?.grade ?? '';
    $('#pf-emoji').value = p?.emoji ?? '';
    $('#pf-name').value = p?.name ?? '';
    $('#pf-desc').value = p?.description ?? '';
    $('#pf-image').value = p?.image_url ?? '';
    updateImagePreview();
    $('#pf-qty').value = p?.quantity ?? 1;
    $('#pf-sort').value = p?.sort ?? (state.prizes.length + 1);
    $('#pf-blank').checked = p?.is_blank ?? false;
    $('#pf-announce').checked = p?.announce ?? true;
    $('#pf-premium').checked = p?.premium ?? false;
  }

  // ------------------------------------------------------------------
  // 기록
  // ------------------------------------------------------------------
  function describeLog(l) {
    const p = l.player_id ? esc(nameOf(l.player_id)) : '';
    const a = l.actor_id ? esc(nameOf(l.actor_id)) : '';
    const room = l.room_id ? `[${esc(roomOf(l.room_id)?.title ?? '방')}]` : '[삭제된 방]';
    const note = l.note ? ` <span class="muted">(${esc(l.note)})</span>` : '';
    switch (l.kind) {
      case 'join':   return `${p} 입장${note}`;
      case 'grant':  return `${a} → <b>${p}</b> 지급${note}`;
      case 'revoke': return `${a} → <b>${p}</b> 회수${note}`;
      case 'bet':    return `<b>${p}</b> ${room} 1장 걸기`;
      case 'unbet':  return `<b>${p}</b> ${room} 걸기 취소`;
      case 'payout': return `<b>${p}</b> ${room} 승리!`;
      case 'refund': return `<b>${p}</b> ${room} 환불`;
      case 'room':   return `${a} ${l.room_id ? room : ''} ${esc(l.note ?? '')}`;
      case 'admin':  return `${!p || a === p ? a : `${a} → ${p}`} ${esc(l.note ?? '')}`;
      case 'reset':  return `${a} → ${p} ${esc(l.note ?? '')}`;
      case 'delete': return `${a} ${esc(l.note ?? '')}`;
      case 'team':   return `${a} → ${p} ${esc(l.note ?? '')}`;
      case 'prize':  return `${a} ${esc(l.note ?? '')}`;
      case 'draw':   return `<b>${p}</b> 복권 뽑기`;
      default:       return `${esc(l.kind)} ${p}${note}`;
    }
  }

  // 기록 종류별 아이콘 상자 (LogList): [아이콘, 채움색]
  function logIcon(l) {
    const teamOf = (id) => state.players.find((x) => x.id === id)?.team;
    switch (l.kind) {
      case 'join':   return [ICON.l_enter, '#FFF6E5'];
      case 'grant':  return [ICON.l_gift, '#2DBE8C'];
      case 'revoke': return [ICON.l_undo, '#FFD9D4'];
      case 'bet':    return [ICON.l_ticket, '#FFD23F'];
      case 'unbet':  return [ICON.l_x, '#FFF6E5'];
      case 'payout': return [ICON.l_trophy, '#FFD23F'];
      case 'refund': return [ICON.l_undo, '#3FA9F5'];
      case 'room':   return [ICON.l_dice, '#FFF6E5'];
      case 'admin':  return [ICON.l_key, '#9B7BEA'];
      case 'reset':  return [ICON.l_phone, '#FFF6E5'];
      case 'delete': return [ICON.l_trash, '#FFD9D4'];
      case 'team': { const t = teamOf(l.player_id); return [ICON.l_users, t ? teamColor(t) : '#FFF6E5']; }
      case 'prize':  return [ICON.l_gift, '#FFD23F'];
      case 'draw':   return [ICON.l_ticket, '#FFD23F'];
      default:       return [ICON.l_dot, '#FFF6E5'];
    }
  }

  function renderLogs() {
    if (!$('#logs')) return;
    // 서버가 일반 참가자에겐 본인 기록만, 관리자에겐 전체 기록을 내려줌
    const admin = state.me.is_admin;
    $('#logs-title').textContent = admin ? '전체 기록' : '내 기록';
    $('#only-mine-wrap').classList.toggle('hidden', !admin);
    const id = state.me.id;
    const list = admin && state.onlyMine
      ? state.logs.filter((l) => l.player_id === id || l.actor_id === id)
      : state.logs;
    $('#logs').innerHTML = list.length === 0
      ? '<div class="empty">기록이 없어요.</div>'
      : list.map((l) => {
        const [icon, fill] = logIcon(l);
        return `
        <div class="log">
          <div class="log-ic" style="--c:${fill}">${icon}</div>
          <div class="body"><div class="log-text">${describeLog(l)}</div><div class="time">${fmtTime(l.created_at)}</div></div>
          ${l.amount ? `<div class="amt ${l.amount > 0 ? 'plus' : 'minus'}">${l.amount > 0 ? '+' : MINUS}${Math.abs(l.amount)}</div>` : ''}
        </div>`;
      }).join('');

    // 요약 타일 (StatTiles): 받은 뽑기권 = 지금 보유 + 뽑은 복권 + 걸어 둔 판돈, 대박 = 맨 위·고급 상품 당첨
    const myDraws = state.draws.filter((d) => d.player_id === id);
    const staked = state.bets.filter((b) => b.player_id === id).length;
    const got = myBalance() + myDraws.length + staked;
    const big = myDraws.filter((d) => d.revealed && !d.is_blank && ['legend', 'epic'].includes(prizeTier(d.prize_id))).length;
    $('#log-stats').innerHTML = `
      <div class="stat mint"><span>받은 뽑기권</span><b>+${got}</b></div>
      <div class="stat blue"><span>뽑은 복권</span><b>${myDraws.length}</b></div>
      <div class="stat red"><span>대박</span><b>${big}</b>${spark('#FFD23F', 26, ' class="stat-spark"')}</div>`;
  }

  // ------------------------------------------------------------------
  // 관리
  // ------------------------------------------------------------------
  function renderAdmin() {
    // 뽑기 설정
    const open = drawOpen();
    $('#draw-open-text').innerHTML = open
      ? '<span class="status-chip on"><i></i>뽑기 진행 중</span><div class="small muted">참가자들이 지금 뽑을 수 있어요</div>'
      : '<span class="status-chip"><i></i>뽑기 닫힘</span><div class="small muted">관리자 포함 아무도 뽑을 수 없어요</div>';
    const $ob = $('#draw-open-btn');
    $ob.innerHTML = open ? `${ICON.lock}뽑기 닫기` : `${ICON.unlock}뽑기 열기`;
    $ob.className = `btn ${open ? 'red' : 'green'} toggle-btn`;

    // 뽑기권 수량: 상품을 남김없이 다 나가게 하려면 지급 총량 = 상품 총수
    const total = pool().total;
    const issued = state.stats?.issued ?? 0;
    const left = total - issued;
    const usedPct = total ? Math.min(100, Math.round((issued / total) * 100)) : 0;
    $('#ticket-budget').innerHTML = `
      <div class="budget-head"><h3>뽑기권 수량</h3><span>지급 <b>${issued}</b> / ${total}장</span></div>
      <div class="budget-bar ${left < 0 ? 'over' : ''}" role="progressbar" aria-label="지급한 뽑기권" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${issued}"><i class="${usedPct ? '' : 'zero'}" style="width:${usedPct}%"></i></div>
      <div class="budget ${left < 0 ? 'over' : left === 0 ? 'done' : ''}">더 지급할 수 있는 뽑기권<span class="chip ${left < 0 ? 'soft-red' : left === 0 ? 'mint' : 'yellow'}">${left}장</span></div>
      <div class="small ${left < 0 ? 'budget-warn' : 'muted'}" style="margin-top:8px">${left < 0
        ? `상품보다 ${-left}장 더 지급됐어요. 마지막에 뽑을 상품이 없는 사람이 생겨요.`
        : left === 0 ? '지급량과 상품 수가 딱 맞아요. 모두 뽑으면 상품이 남지 않아요.'
        : `${left}장을 더 지급해야 상품이 남지 않아요.`}</div>`;

    // 팀 순위 지급: 팀별 인원 표시
    $app.querySelectorAll('.rank-team').forEach((sel) => {
      [...sel.options].forEach((o) => {
        if (!o.value) return;
        const n = state.players.filter((p) => p.team === Number(o.value)).length;
        o.textContent = `${o.value}팀 (${n}명)`;
      });
      paintTeamSelect(sel);
    });

    // 지급 대상
    const $sel = $('#g-target');
    const prev = $sel.value;
    const byName = [...state.players].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    const teamOpts = Array.from({ length: TEAMS }, (_, i) => {
      const n = state.players.filter((p) => p.team === i + 1).length;
      return `<option value="team:${i + 1}">${i + 1}팀 전원 (${n}명)</option>`;
    }).join('');
    $sel.innerHTML = '<option value="">— 대상 선택 —</option>'
      + `<option value="all">전원 (${state.players.length}명)</option>`
      + teamOpts
      + byName.map((p) => `<option value="${p.id}">${esc(p.name)}${p.team ? ` · ${p.team}팀` : ''} (${p.balance}장)</option>`).join('');
    if ([...$sel.options].some((o) => o.value === prev)) $sel.value = prev;

    // 참가자 목록
    const teamSelect = (p) => `
      <select class="input team-select" data-change="set-team" data-player="${p.id}" aria-label="${esc(p.name)} 팀" style="--c:${p.team ? teamColor(p.team) : '#FFF6E5'}">
        <option value="">팀 없음</option>
        ${Array.from({ length: TEAMS }, (_, i) => `<option value="${i + 1}" ${p.team === i + 1 ? 'selected' : ''}>${i + 1}팀</option>`).join('')}
      </select>`;
    $('#admin-players').innerHTML = byName.map((p) => `
      <div class="player-row">
        <div class="name">
          <b>${esc(p.name)}</b> ${p.is_admin ? '<span class="badge admin">관리자</span>' : ''}
          <div class="small muted">${p.balance}장</div>
        </div>
        <div class="acts">
          ${teamSelect(p)}
          <button class="btn sm" data-action="target" data-player="${p.id}">선택</button>
          ${p.id === state.me.id ? '' : `
            <button class="btn sm ghost" data-action="toggle-admin" data-player="${p.id}" data-value="${!p.is_admin}">
              ${p.is_admin ? '관리자 해제' : '관리자 지정'}</button>
            <button class="btn sm ghost" data-action="reset-device" data-player="${p.id}">기기 초기화</button>
            <button class="btn sm red" data-action="delete-player" data-player="${p.id}">삭제</button>`}
        </div>
      </div>`).join('') || '<div class="empty">참가자가 없어요.</div>';
  }

  // "[1팀] 홍길동, 김철수" / "1팀: 홍길동 김철수" / "1팀" 다음 줄부터 이름 나열 등
  // 팀 줄 오타("2틴: ...")가 앞 팀에 섞여 들어가지 않도록, 이상한 줄은 errors 로 돌려준다
  function parseTeams(text) {
    const rows = [];
    const errors = [];
    const seen = new Map();
    let cur = null;
    text.split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const at = `${i + 1}번째 줄 "${line.length > 24 ? `${line.slice(0, 24)}…` : line}"`;
      const m = line.match(/^\[?\s*(\d+)\s*팀\s*\]?\s*[:：\-]?\s*(.*)$/);
      let rest = line;
      if (m) {
        cur = Number(m[1]);
        rest = m[2];
        if (cur < 1 || cur > TEAMS) { errors.push(`${at}: ${cur}팀은 없어요 (1~${TEAMS}팀)`); cur = null; return; }
      } else if (/[:：[\]]/.test(line) || /^\d/.test(line) || /^\S*(팀|조|team)$/i.test(line.split(/[\s,，]/)[0])) {
        errors.push(`${at}: 팀 이름을 못 알아봤어요. "2팀: 이름, 이름" 형식인지 확인해 주세요`);
        cur = null;
        return;
      } else if (!cur) {
        errors.push(`${at}: 어느 팀인지 없어요. 줄 앞에 "1팀:" 을 붙여 주세요`);
        return;
      }
      const names = (rest.includes(',') || rest.includes('，') ? rest.split(/[,，]/) : rest.split(/\s+/))
        .map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
      for (const name of names) {
        if (name.length > 20) { errors.push(`${at}: "${name}" 은(는) 20자가 넘어요`); continue; }
        const key = name.toLowerCase();
        if (seen.has(key)) { errors.push(`"${name}" 이(가) ${seen.get(key)}팀과 ${cur}팀에 두 번 들어 있어요`); continue; }
        seen.set(key, cur);
        rows.push({ name, team: cur });
      }
    });
    return { rows, errors };
  }

  // ------------------------------------------------------------------
  // 이벤트
  // ------------------------------------------------------------------
  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    handleAction(el.dataset.action, el.dataset);
  });
  $app.addEventListener('change', async (e) => {
    const el = e.target.closest('[data-change="set-team"]');
    if (!el) return;
    const player = Number(el.dataset.player);
    const team = el.value ? Number(el.value) : null;
    await call('ticket_admin_set_team', { p_target: player, p_team: team },
      `${nameOf(player)}님 → ${team ? `${team}팀` : '팀 없음'}`);
  });

  async function handleAction(action, d) {
    const room = d.room ? Number(d.room) : null;
    const player = d.player ? Number(d.player) : null;

    switch (action) {
      case 'tab':
        state.tab = d.tab;
        renderTabs();
        window.scrollTo({ top: 0 });
        break;

      case 'bet':
        await call('ticket_bet', { p_room: room }, '1장 걸었어요!');
        break;
      case 'unbet':
        await call('ticket_unbet', { p_room: room }, '걸기를 취소했어요.');
        break;

      case 'create-room': {
        const $t = $('#room-title');
        const title = $t.value.trim();
        if (!title) { $t.focus(); return; }
        if (await call('ticket_create_room', { p_title: title }, '방을 만들었어요.')) $t.value = '';
        break;
      }
      case 'lock':
        await call('ticket_admin_lock_room', { p_room: room, p_locked: true }, '베팅을 마감했어요.');
        break;
      case 'unlock':
        await call('ticket_admin_lock_room', { p_room: room, p_locked: false }, '베팅을 재개했어요.');
        break;
      case 'pick-start':
        state.picking = room;
        renderRooms();
        break;
      case 'pick-cancel':
        state.picking = null;
        renderRooms();
        break;
      case 'pick-winner': {
        const r = roomOf(room);
        const pot = state.bets.filter((b) => b.room_id === room).length;
        if (!confirm(`[${r?.title}]\n${nameOf(player)}님을 승자로 확정할까요?\n판돈 ${pot}장이 지급돼요.`)) return;
        if (await call('ticket_admin_settle', { p_room: room, p_winner: player }, `${nameOf(player)}님에게 ${pot}장 지급!`)) {
          state.picking = null;
          renderRooms();
        }
        break;
      }
      case 'cancel-room': {
        const r = roomOf(room);
        if (!confirm(`[${r?.title}] 방을 취소할까요?\n건 뽑기권은 모두 돌려줘요.`)) return;
        await call('ticket_admin_cancel_room', { p_room: room }, '방을 취소하고 환불했어요.');
        break;
      }
      case 'delete-room': {
        const r = roomOf(room);
        const staked = state.bets.filter((b) => b.room_id === room).length;
        const msg = isActive(r)
          ? `[${r.title}] 방을 삭제할까요?\n${staked ? `건 ${staked}장은 모두 돌려주고 ` : ''}목록에서 사라져요.`
          : `[${r?.title}] 방을 목록에서 삭제할까요?\n이미 지급된 상금은 그대로 유지돼요.`;
        if (!confirm(msg)) return;
        if (state.picking === room) state.picking = null;
        await call('ticket_admin_delete_room', { p_room: room }, '방을 삭제했어요.');
        break;
      }

      case 'draw':
        await doDraw();
        break;

      case 'claim-admin': {
        const code = prompt('관리자 코드를 입력하세요');
        if (!code) return;
        const res = await call('ticket_become_admin', { p_code: code });
        if (res && res.data === true) toast('관리자가 되었어요');
        else if (res) toast('코드가 틀렸어요. (5회 틀리면 잠겨요)', true);
        break;
      }

      // ---- 상품 ----
      case 'save-prize': {
        const args = {
          p_id: state.editingPrize,
          p_grade: $('#pf-grade').value.trim(),
          p_name: $('#pf-name').value.trim(),
          p_emoji: $('#pf-emoji').value.trim(),
          p_description: $('#pf-desc').value.trim(),
          p_image_url: $('#pf-image').value.trim() || null,
          p_quantity: parseInt($('#pf-qty').value, 10),
          p_is_blank: $('#pf-blank').checked,
          p_sort: parseInt($('#pf-sort').value, 10) || 0,
          p_announce: $('#pf-announce').checked,
          p_premium: $('#pf-premium').checked,
        };
        if (!args.p_grade) { toast('등급을 입력해 주세요. (예: A상, 꽝)', true); return; }
        if (!Number.isInteger(args.p_quantity) || args.p_quantity < 0) { toast('수량을 확인해 주세요.', true); return; }
        if (await call('ticket_admin_save_prize', args, state.editingPrize ? '상품을 수정했어요.' : '상품을 추가했어요.')) {
          state.editingPrize = null;
          fillPrizeForm(null);
          renderPrizes();
        }
        break;
      }
      case 'edit-prize': {
        const p = state.prizes.find((x) => x.id === Number(d.prize));
        if (!p) return;
        state.editingPrize = p.id;
        fillPrizeForm(p);
        renderPrizes();
        $('#prize-form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'cancel-prize':
        state.editingPrize = null;
        fillPrizeForm(null);
        renderPrizes();
        break;
      case 'delete-prize': {
        const p = state.prizes.find((x) => x.id === Number(d.prize));
        if (!confirm(`[${p?.grade}] ${p?.name || ''} 상품을 삭제할까요?`)) return;
        await call('ticket_admin_delete_prize', { p_id: Number(d.prize) }, '상품을 삭제했어요.');
        break;
      }
      case 'toggle-claim': {
        const dr = state.draws.find((x) => x.id === Number(d.draw));
        if (!dr) return;
        const next = !dr.claimed;
        if (!confirm(`${dr.player_name}님 [${dr.grade}] ${next ? '수령 완료로 표시' : '수령 표시 취소'}할까요?`)) return;
        await call('ticket_admin_set_claimed', { p_draw: dr.id, p_claimed: next }, next ? '수령 완료로 표시했어요.' : '수령 표시를 취소했어요.');
        break;
      }

      // ---- 관리 ----
      case 'toggle-draw': {
        const next = !drawOpen();
        if (!confirm(next ? '뽑기를 열까요? 참가자들이 바로 뽑을 수 있어요.' : '뽑기를 닫을까요?')) return;
        await call('ticket_admin_set_draw_open', { p_open: next }, next ? '뽑기를 열었어요.' : '뽑기를 닫았어요.');
        break;
      }
      case 'grant-ranks': {
        const ranks = [];
        const lines = [];
        $app.querySelectorAll('.rank-row').forEach((row) => {
          const sel = row.querySelector('.rank-team');
          const team = sel.value ? Number(sel.value) : null;
          const amount = parseInt(row.querySelector('.rank-amt').value, 10) || 0;
          if (!team || amount <= 0) return;
          const n = state.players.filter((p) => p.team === team).length;
          ranks.push({ rank: Number(sel.dataset.rank), team, amount });
          lines.push(`${sel.dataset.rank}등 ${team}팀 (${n}명) → 1인당 ${amount}장`);
        });
        if (!ranks.length) { toast('팀과 수량을 선택해 주세요.', true); return; }
        if (new Set(ranks.map((r) => r.team)).size !== ranks.length) { toast('같은 팀이 두 번 선택됐어요.', true); return; }
        const sum = ranks.reduce((s, r) => s + r.amount * state.players.filter((p) => p.team === r.team).length, 0);
        const after = pool().total - (state.stats?.issued ?? 0) - sum;
        lines.push('', `합계 ${sum}장 → 지급 후 잔량 ${after}장${after < 0 ? ' (상품보다 많아요!)' : ''}`);
        if (!confirm(`아래처럼 지급할까요?\n\n${lines.join('\n')}`)) return;
        const res = await call('ticket_admin_grant_ranks', { p_ranks: ranks, p_note: $('#rank-note').value.trim() || null });
        if (res) {
          toast(`${res.data.players}명에게 지급했어요.`);
          $app.querySelectorAll('.rank-team').forEach((s) => { s.value = ''; });
          $('#rank-note').value = '';
        }
        break;
      }
      case 'import-teams': {
        const { rows, errors } = parseTeams($('#team-import').value);
        if (errors.length) {
          alert(`입력에 확인할 곳이 있어서 팀 배정을 하지 않았어요.\n\n${errors.map((e) => `• ${e}`).join('\n')}`);
          return;
        }
        if (!rows.length) { toast('"1팀: 이름, 이름" 형식으로 입력해 주세요.', true); return; }
        const known = new Set(state.players.map((p) => p.name.toLowerCase()));
        const fresh = rows.filter((r) => !known.has(r.name.toLowerCase()));
        const per = Array.from({ length: TEAMS }, (_, i) => `${i + 1}팀 ${rows.filter((r) => r.team === i + 1).length}명`).join(' · ');
        if (!confirm(`${rows.length}명 팀 배정\n${per}${fresh.length ? `\n\n아직 입장 안 한 ${fresh.length}명은 미리 등록돼요:\n${fresh.map((r) => r.name).join(', ')}` : ''}`)) return;
        const res = await call('ticket_admin_import_teams', { p_rows: rows });
        if (res) {
          toast(`팀 배정 완료 (기존 ${res.data.updated}명 · 신규 ${res.data.created}명)`);
          $('#team-import').value = '';
        }
        break;
      }
      case 'qty':
        $('#g-amount').value = d.n;
        break;
      case 'target':
        $('#g-target').value = String(player);
        $('#g-target').scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'grant':
      case 'revoke': {
        const target = $('#g-target').value;
        const amount = parseInt($('#g-amount').value, 10);
        const note = $('#g-note').value.trim();
        if (!target) { toast('대상을 선택해 주세요.', true); return; }
        if (!Number.isInteger(amount) || amount < 1) { toast('수량을 1 이상으로 입력해 주세요.', true); return; }

        if (target.startsWith('team:')) {
          const team = Number(target.slice(5));
          const n = state.players.filter((p) => p.team === team).length;
          if (action === 'revoke') { toast('팀 단위 회수는 할 수 없어요. 한 명씩 회수해 주세요.', true); return; }
          if (!n) { toast(`${team}팀에 배정된 사람이 없어요.`, true); return; }
          if (!confirm(`${team}팀 전원(${n}명)에게 ${amount}장씩 지급할까요?`)) return;
          if (await call('ticket_admin_grant_team', { p_team: team, p_amount: amount, p_note: note || null }, `${team}팀 ${n}명에게 ${amount}장씩 지급했어요.`)) {
            $('#g-note').value = '';
          }
          break;
        }

        if (target === 'all') {
          if (action === 'revoke') { toast('전원 회수는 할 수 없어요.', true); return; }
          if (!confirm(`전원(${state.players.length}명)에게 ${amount}장씩 지급할까요?`)) return;
        }
        const signed = action === 'grant' ? amount : -amount;
        const who = target === 'all' ? '전원' : `${nameOf(Number(target))}님`;
        const ok = await call('ticket_admin_grant', {
          p_target: target === 'all' ? null : Number(target),
          p_amount: signed,
          p_note: note || null,
        }, `${who}에게 ${amount}장 ${action === 'grant' ? '지급' : '회수'}했어요.`);
        if (ok) $('#g-note').value = '';
        break;
      }
      case 'toggle-admin': {
        const value = d.value === 'true';
        if (!confirm(`${nameOf(player)}님을 ${value ? '관리자로 지정' : '관리자에서 해제'}할까요?`)) return;
        await call('ticket_admin_set_admin', { p_target: player, p_value: value }, '변경했어요.');
        break;
      }
      case 'reset-device':
        if (!confirm(`${nameOf(player)}님의 기기 연결을 초기화할까요?\n다음에 이 이름으로 입장하는 기기가 새로 연결돼요.`)) return;
        await call('ticket_admin_reset_device', { p_target: player }, '기기를 초기화했어요.');
        break;
      case 'delete-player': {
        const p = state.players.find((x) => x.id === player);
        const staked = state.bets.filter((b) => b.player_id === player).length;
        const lines = [`${nameOf(player)}님을 명단에서 삭제할까요?`, '', `· 보유 뽑기권 ${p?.balance ?? 0}장 소멸`];
        if (staked) lines.push(`· 진행 중인 방에 건 ${staked}장도 판돈에서 빠짐`);
        lines.push('· 되돌릴 수 없어요');
        if (!confirm(lines.join('\n'))) return;
        await call('ticket_admin_delete_player', { p_target: player }, `${nameOf(player)}님을 삭제했어요.`);
        break;
      }
    }
  }

  // ------------------------------------------------------------------
  // 시작
  // ------------------------------------------------------------------
  (async () => {
    state.token = loadToken();
    try {
      const { data, error } = await sb.rpc('ticket_whoami', { p_token: state.token });
      if (error) throw error;
      if (data) { state.me = data; startMain(); } else { renderJoin(); }
    } catch (e) {
      console.error(e);
      $app.innerHTML = `
        <div class="center-screen"><div class="msg-card">
          <div class="logo">${ICON.plug}</div>
          <h1>서버에 연결할 수 없어요</h1>
          <p>config.js 설정과 schema.sql 실행 여부를 확인해 주세요.</p>
          <button class="btn primary block" onclick="location.reload()">다시 시도</button>
        </div></div>`;
    }
  })();
})();
