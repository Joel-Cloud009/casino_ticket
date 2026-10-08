(() => {
  'use strict';

  const cfg = window.TICKET_CONFIG || {};
  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const TOKEN_KEY = 'ticket_casino_token';
  const TEAMS = 4;
  const TEAM_COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#22b8cf', '#f06595'];
  const GRADE_COLORS = ['#f2c14e', '#c0a6ff', '#6cb4ff', '#3ecf8e', '#ff922b', '#f06595'];
  const FILLER_SYMBOLS = ['🍒', '🍋', '🔔', '🍉', '⭐', '🍀'];

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
    tab: 'rooms',
    picking: null,       // 승자 선택 중인 방 id
    onlyMine: false,
    live: false,
    prevBalances: new Map(),
    editingPrize: null,
  };

  // 뽑기 화면 상태 (실시간 갱신과 별개로 유지)
  const drawUI = { mode: 'idle', draw: null, progress: 0 };
  const symbolCache = new Map();

  // ------------------------------------------------------------------
  // 유틸
  // ------------------------------------------------------------------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel) => $app.querySelector(sel);
  const teamColor = (t) => TEAM_COLORS[(t - 1) % TEAM_COLORS.length];
  const teamBadge = (t) => (t ? `<span class="badge team" style="--c:${teamColor(t)}">${t}팀</span>` : '');

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
  function beep(kind) {
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
      if (kind === 'rip') tone(180 + Math.random() * 120, 0, 0.04, 0.05, 'sawtooth');
      if (kind === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, i === 4 ? 0.7 : 0.18, 0.12, 'triangle'));
      if (kind === 'lose') { tone(392, 0, 0.2, 0.1, 'triangle'); tone(330, 0.18, 0.4, 0.1, 'triangle'); }
    } catch {}
  }

  // ------------------------------------------------------------------
  // 설정 확인
  // ------------------------------------------------------------------
  if (!window.supabase || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('YOUR-PROJECT')
      || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY.includes('YOUR-')) {
    $app.innerHTML = `
      <div class="center-screen"><div class="join">
        <div class="logo">🛠️</div>
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
      <div class="center-screen"><form class="join" id="join-form">
        <div class="logo">🎰</div>
        <h1>뽑기권 카지노</h1>
        <p>이름을 입력하고 입장하세요</p>
        <input class="input" id="join-name" maxlength="20" placeholder="이름" autocomplete="off" required>
        <button class="btn gold block" type="submit">입장하기</button>
        <p class="small muted" style="margin-top:16px">처음 입장한 기기에 이름이 연결돼요.<br>다른 기기로 바꾸려면 관리자에게 기기 초기화를 요청하세요.</p>
        <a class="small muted" href="stage.html" style="display:inline-block;margin-top:18px">📺 무대 화면으로 보기 (입장 없이)</a>
      </form></div>`;
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
        <span class="rank-label">${i + 1}등</span>
        <select class="input rank-team" data-rank="${i + 1}"><option value="">팀 선택</option>${teamOpts}</select>
        <input class="input rank-amt" type="number" inputmode="numeric" min="0" max="1000" value="${amt}">
        <span class="muted small">장</span>
      </div>`).join('');

    $app.innerHTML = `
      <div class="header">
        <div class="me-box">
          <div>
            <div class="me-name" id="me-name"></div>
            <div class="me-sub" id="me-sub"></div>
          </div>
          <div class="me-balance" id="me-bal"><div class="num">-</div><div class="unit">내 뽑기권</div></div>
        </div>
        <nav class="tabs" id="tabs"></nav>
      </div>

      <section data-view="rooms">
        <div class="card hidden" id="room-create">
          <h3>게임방 만들기</h3>
          <div class="row">
            <input class="input" id="room-title" maxlength="30" placeholder="예: 1라운드 블랙잭">
            <button class="btn gold" data-action="create-room">만들기</button>
          </div>
        </div>
        <div id="rooms-active"></div>
        <div class="section-title">끝난 게임</div>
        <div class="card" id="rooms-done"></div>
      </section>

      <section data-view="board">
        <div class="team-summary" id="team-summary"></div>
        <div class="stats" id="stats"></div>
        <div id="integrity"></div>
        <div class="card"><table class="board" id="board"></table></div>
        <div class="footer-link" id="claim-link">
          <button data-action="claim-admin">관리자 코드 입력</button>
        </div>
      </section>

      <section data-view="draw">
        <div id="draw-status"></div>
        <div class="draw-stage" id="draw-stage"></div>
        <div class="section-title">내 뽑기 결과</div>
        <div class="card" id="my-draws"></div>
      </section>

      <section data-view="prizes">
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
            <div class="row">
              <div style="flex:1"><label for="pf-qty">수량</label><input class="input" id="pf-qty" type="number" inputmode="numeric" min="0" max="10000" value="1"></div>
              <div style="flex:1"><label for="pf-sort">표시 순서</label><input class="input" id="pf-sort" type="number" inputmode="numeric" value="1"></div>
            </div>
            <label class="toggle" style="margin-top:4px"><input type="checkbox" id="pf-announce" checked> 📺 무대 화면에서 크게 발표</label>
            <label class="toggle"><input type="checkbox" id="pf-blank"> 꽝 (상품 없음)</label>
            <div class="row" style="margin-top:6px">
              <button class="btn gold" style="flex:1" data-action="save-prize">저장</button>
              <button class="btn ghost hidden" id="pf-cancel" data-action="cancel-prize">취소</button>
            </div>
          </div>
        </div>
      </section>

      <section data-view="logs">
        <div class="card">
          <div class="row" style="justify-content:space-between;margin-bottom:6px">
            <h3 style="margin:0" id="logs-title">내 기록</h3>
            <label class="toggle hidden" id="only-mine-wrap"><input type="checkbox" id="only-mine"> 내 기록만</label>
          </div>
          <div id="logs"></div>
        </div>
      </section>

      <section data-view="admin">
        <div class="card">
          <h3>🎟️ 뽑기 설정</h3>
          <div class="row" style="justify-content:space-between">
            <div id="draw-open-text"></div>
            <button class="btn" id="draw-open-btn" data-action="toggle-draw"></button>
          </div>
          <a class="btn ghost block" href="stage.html" target="_blank" style="margin-top:10px;display:block;text-align:center;text-decoration:none">📺 무대 화면 열기</a>
        </div>

        <div class="card">
          <h3>🏆 팀 순위 지급</h3>
          <div class="form-grid">
            ${rankRows}
            <input class="input" id="rank-note" maxlength="80" placeholder="메모 (예: 레크리에이션 1)">
            <button class="btn gold" data-action="grant-ranks">순위대로 지급</button>
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
              <button class="btn gold" style="flex:1" data-action="grant">지급</button>
              <button class="btn red" style="flex:1" data-action="revoke">회수</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>👥 팀 일괄 배정</h3>
          <textarea class="input" id="team-import" rows="5" placeholder="[1팀] 홍길동, 김철수, 이영희&#10;[2팀] 박민수, 정승혁&#10;..."></textarea>
          <div class="small muted" style="margin:6px 0 10px">
            한 줄에 한 팀씩 "1팀: 이름, 이름" 형식. 아직 입장 안 한 이름은 미리 등록돼요.
          </div>
          <button class="btn gold block" data-action="import-teams">팀 적용</button>
        </div>

        <div class="card">
          <h3>참가자 관리</h3>
          <div id="admin-players"></div>
        </div>
      </section>`;

    $('#only-mine').addEventListener('change', (e) => {
      state.onlyMine = e.target.checked;
      renderLogs();
    });
    $('#room-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAction('create-room', {});
    });
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
  const gradeColor = (prizeId) => {
    const idx = state.prizes.filter((p) => !p.is_blank).findIndex((p) => p.id === prizeId);
    return GRADE_COLORS[Math.max(0, idx) % GRADE_COLORS.length];
  };

  function renderData() {
    if (!state.me || !$('#tabs')) return;
    if (state.tab === 'admin' && !state.me.is_admin) state.tab = 'rooms';
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
    $('#me-name').innerHTML = `${esc(state.me.name)} ${teamBadge(meRow?.team)}`;
    $('#me-sub').innerHTML =
      `<span class="live-dot ${state.live ? 'on' : ''}"></span>${state.live ? '실시간 연결됨' : '연결 중…'}`
      + (state.me.is_admin ? ' · <span class="badge admin">관리자</span>' : '');
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
    const tabs = [['rooms', '🎲 게임'], ['board', '📊 현황'], ['draw', '🎟️ 뽑기'], ['prizes', '🎁 상품'], ['logs', '🧾 기록']];
    if (state.me.is_admin) tabs.push(['admin', '🔑 관리']);
    $('#tabs').innerHTML = tabs.map(([k, label]) =>
      `<button class="tab ${state.tab === k ? 'active' : ''}" data-action="tab" data-tab="${k}">${label}</button>`).join('');
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

    $('#rooms-active').innerHTML = active.length === 0
      ? `<div class="card empty">진행 중인 게임이 없어요.${me.is_admin ? '<br>위에서 방을 만들어 보세요.' : ''}</div>`
      : active.map((r) => {
        const roomBets = state.bets.filter((b) => b.room_id === r.id);
        const mine = roomBets.some((b) => b.player_id === me.id);
        const picking = state.picking === r.id;

        const chips = roomBets.length === 0
          ? '<span class="muted small">아직 아무도 걸지 않았어요.</span>'
          : roomBets.map((b) => picking
            ? `<button class="chip pick" data-action="pick-winner" data-room="${r.id}" data-player="${b.player_id}">${esc(nameOf(b.player_id))}</button>`
            : `<span class="chip ${b.player_id === me.id ? 'mine' : ''}">${esc(nameOf(b.player_id))}</span>`).join('');

        let actions = '';
        if (r.status === 'open') {
          actions = mine
            ? `<span class="muted small" style="flex:1;align-self:center">✅ 1장 걸었어요</span>
               <button class="btn ghost" data-action="unbet" data-room="${r.id}">걸기 취소</button>`
            : `<button class="btn gold main" data-action="bet" data-room="${r.id}" ${myBal < 1 ? 'disabled' : ''}>
                 ${myBal < 1 ? '뽑기권이 없어요' : '🎟️ 1장 걸기'}</button>`;
        } else {
          actions = `<span class="muted small">🔒 베팅 마감 · 결과 대기 중${mine ? ' (참여 중)' : ''}</span>`;
        }

        const admin = me.is_admin ? `
          <div class="admin-actions">
            ${r.status === 'open'
              ? `<button class="btn sm" data-action="lock" data-room="${r.id}">베팅 마감</button>`
              : `<button class="btn sm" data-action="unlock" data-room="${r.id}">베팅 재개</button>`}
            ${picking
              ? `<button class="btn sm ghost" data-action="pick-cancel">선택 취소</button>`
              : `<button class="btn sm green" data-action="pick-start" data-room="${r.id}" ${roomBets.length === 0 ? 'disabled' : ''}>🏆 승자 선택</button>`}
            <button class="btn sm red" data-action="cancel-room" data-room="${r.id}">방 취소·환불</button>
            <button class="btn sm red" data-action="delete-room" data-room="${r.id}">🗑️ 삭제</button>
          </div>
          ${picking ? '<div class="pick-hint">👆 위 참가자 중 승자를 눌러주세요</div>' : ''}` : '';

        return `
          <div class="card">
            <div class="room-head">
              <div>
                <div class="room-title">${esc(r.title)}</div>
                <span class="badge ${r.status}">${r.status === 'open' ? '베팅 중' : '마감'}</span>
                <span class="muted small">· ${roomBets.length}명 참여</span>
              </div>
              <div class="pot"><div class="num">${roomBets.length}</div><div class="unit">판돈(장)</div></div>
            </div>
            <div class="chips">${chips}</div>
            <div class="room-actions">${actions}</div>
            ${admin}
          </div>`;
      }).join('');

    const done = state.rooms.filter((r) => !isActive(r))
      .sort((a, b) => String(b.closed_at).localeCompare(String(a.closed_at)))
      .slice(0, 30);
    $('#rooms-done').innerHTML = done.length === 0
      ? '<div class="empty">아직 끝난 게임이 없어요.</div>'
      : done.map((r) => `
        <div class="done-row">
          <div>
            <div style="font-weight:600">${esc(r.title)}</div>
            <div class="small muted">${r.closed_at ? fmtTime(r.closed_at) : ''}</div>
          </div>
          <div class="row" style="gap:10px">
            <div style="text-align:right">
              ${r.status === 'settled'
                ? `<div>🏆 <b>${esc(nameOf(r.winner_id))}</b></div><div class="small" style="color:var(--gold)">+${r.pot}장</div>`
                : '<span class="badge cancelled">취소·환불</span>'}
            </div>
            ${me.is_admin ? `<button class="btn sm red" data-action="delete-room" data-room="${r.id}" title="삭제">🗑️</button>` : ''}
          </div>
        </div>`).join('');
  }

  function renderBoard() {
    // 팀별 요약
    $('#team-summary').innerHTML = Array.from({ length: TEAMS }, (_, i) => {
      const t = i + 1;
      const members = state.players.filter((p) => p.team === t);
      const sum = members.reduce((s, p) => s + p.balance, 0);
      return `
        <div class="team-box" style="--c:${teamColor(t)}">
          <div class="team-name">${t}팀</div>
          <div class="team-sum">${sum}<span>장</span></div>
          <div class="team-cnt">${members.length}명</div>
        </div>`;
    }).join('');

    const s = state.stats;
    if (s) {
      $('#stats').innerHTML = `
        <div class="stat"><div class="num">${s.players}</div><div class="label">참가자</div></div>
        <div class="stat"><div class="num">${s.held}</div><div class="label">보유 합계</div></div>
        <div class="stat"><div class="num">${s.staked}</div><div class="label">걸린 판돈</div></div>`;
      const drawn = s.drawn ?? 0;
      const ok = s.issued === s.held + s.staked + drawn;
      const detail = `보유 ${s.held} + 판돈 ${s.staked} + 뽑기 사용 ${drawn}`;
      $('#integrity').innerHTML = ok
        ? `<div class="integrity ok">✔ 정합성 정상 · 총 발행 ${s.issued}장 = ${detail}</div>`
        : `<div class="integrity bad">⚠ 수량 불일치 · 총 발행 ${s.issued}장 ≠ ${detail}</div>`;
    }

    const stakeBy = new Map();
    for (const b of state.bets) stakeBy.set(b.player_id, (stakeBy.get(b.player_id) || 0) + 1);

    let rank = 0;
    let prevBal = null;
    const rows = state.players.map((p, i) => {
      if (p.balance !== prevBal) { rank = i + 1; prevBal = p.balance; }
      const before = state.prevBalances.get(p.id);
      const flash = before !== undefined && before !== p.balance;
      const stake = stakeBy.get(p.id);
      return `
        <tr class="${p.id === state.me.id ? 'me' : ''} ${flash ? 'flash' : ''}">
          <td class="rank">${rank}</td>
          <td>${teamBadge(p.team)} ${esc(p.name)}
            ${p.id === state.me.id ? '<span class="badge me">나</span>' : ''}
            ${p.is_admin ? '<span class="badge admin">관리자</span>' : ''}</td>
          <td class="stake">${stake ? `판돈 ${stake}` : ''}</td>
          <td class="bal">${p.balance}</td>
        </tr>`;
    }).join('');
    $('#board').innerHTML = rows || '<tr><td class="empty">참가자가 없어요.</td></tr>';
    state.prevBalances = new Map(state.players.map((p) => [p.id, p.balance]));

    $('#claim-link').classList.toggle('hidden', state.me.is_admin);
  }

  // ------------------------------------------------------------------
  // 뽑기
  // ------------------------------------------------------------------
  function pendingDraw() {
    return state.draws.find((d) => d.player_id === state.me.id && !d.revealed) || null;
  }

  function symbolsFor(draw) {
    if (symbolCache.has(draw.id)) return symbolCache.get(draw.id);
    let syms;
    if (!draw.is_blank) {
      syms = [draw.emoji, draw.emoji, draw.emoji];
    } else {
      // 꽝: 두 개만 같은 그림 (아깝게 놓친 느낌)
      const pool = [...new Set(state.prizes.filter((p) => !p.is_blank).map((p) => p.emoji))];
      for (const f of FILLER_SYMBOLS) if (pool.length < 3 && !pool.includes(f)) pool.push(f);
      const a = pool[Math.floor(Math.random() * pool.length)];
      const others = pool.filter((x) => x !== a);
      const b = others[Math.floor(Math.random() * others.length)];
      syms = [a, a, b].sort(() => Math.random() - 0.5);
    }
    symbolCache.set(draw.id, syms);
    return syms;
  }

  function drawBlockReason() {
    const pl = pool();
    if (state.prizes.length === 0) return '상품이 아직 준비되지 않았어요';
    if (pl.remaining === 0) return '복권이 모두 소진됐어요';
    if (!drawOpen() && !state.me.is_admin) return '아직 뽑기 시간이 아니에요';
    if (myBalance() < 1) return '뽑기권이 없어요';
    return null;
  }

  // 실시간 갱신마다 바뀌는 부분 (카드 자체는 건드리지 않음)
  function renderDrawInfo() {
    const pl = pool();
    $('#draw-status').innerHTML = `
      <div class="draw-status ${drawOpen() ? 'open' : ''}">
        <span>${drawOpen() ? '🟢 뽑기 진행 중' : '⏸ 뽑기 대기 중'}${!drawOpen() && state.me.is_admin ? ' (관리자는 테스트 가능)' : ''}</span>
        <b>남은 복권 ${String(pl.remaining).padStart(3, '0')} / ${String(pl.total).padStart(3, '0')}</b>
      </div>`;
    // 카드는 다시 그리지 않고 숫자만 갱신 (뜯는 중이면 그대로)
    if (drawUI.mode === 'idle' && $('#pt-count')) {
      $('#pt-count').textContent = `${String(pl.remaining).padStart(3, '0')}/${String(pl.total).padStart(3, '0')}`;
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
          <div class="draw-emoji">${d.is_blank ? '😢' : esc(d.emoji)}</div>
          <div style="flex:1">
            <div><b>${esc(d.grade)}</b> ${d.is_blank ? '' : esc(d.prize_name)}</div>
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
    btn.textContent = reason || (drawUI.mode === 'revealed' ? '🎟️ 한 장 더 뽑기' : '🎟️ 뽑기권 1장으로 복권 뽑기');
  }

  // 카드 영역: 뽑기 흐름이 바뀔 때만 다시 그림
  function renderDrawStage() {
    const $st = $('#draw-stage');
    if (!$st) return;
    const pl = pool();
    const d = drawUI.draw;
    const syms = d ? symbolsFor(d) : ['❔', '❔', '❔'];
    const no = d ? String(d.id).padStart(6, '0') : '------';
    const revealed = drawUI.mode === 'revealed';
    const peelable = drawUI.mode === 'ready';

    $st.innerHTML = `
      <div class="pt-card ${revealed ? (d.is_blank ? 'lose' : 'win') : ''}" id="pt-card">
        <div class="pt-top">
          <div class="pt-badge"><small>ROUND</small><span>${no}</span><b id="pt-count">${String(pl.remaining).padStart(3, '0')}/${String(pl.total).padStart(3, '0')}</b></div>
          <div class="pt-title">LUCKY<br><span>TICKET</span></div>
        </div>
        <div class="pt-window" id="pt-window">
          <div class="pt-rows">
            ${syms.map((s) => `<div class="pt-row"><span>${esc(s)}</span></div>`).join('')}
          </div>
          <div class="pt-cover ${peelable ? 'peelable' : ''}" id="pt-cover" style="height:${revealed ? 0 : 100}%">
            <div class="pt-open">${peelable ? 'Open Here!' : ''}</div>
            <div class="pt-tab">${peelable ? '⬆' : '🎟️'}</div>
          </div>
        </div>
        <div class="pt-coins" id="pt-coins"></div>
      </div>
      <div class="pt-result" id="pt-result">${revealed ? resultHtml(d) : (peelable ? '<div class="muted">👆 아래 탭을 위로 밀어서 뜯어보세요</div>' : '')}</div>
      ${peelable ? '' : '<button class="btn gold block draw-btn" id="draw-btn" data-action="draw"></button>'}`;

    updateDrawButton();
    if (peelable) bindPeel();
  }

  function resultHtml(d) {
    return d.is_blank
      ? `<div class="res lose"><div class="res-big">꽝!</div><div>다음 기회에 😢</div></div>`
      : `<div class="res win"><div class="res-big">🎉 ${esc(d.grade)} 당첨!</div><div class="res-prize">${esc(d.emoji)} ${esc(d.prize_name)}</div></div>`;
  }

  function bindPeel() {
    const cover = $('#pt-cover');
    const win = $('#pt-window');
    let startY = null;
    let startP = 0;
    let moved = 0;
    let lastRip = 0;

    const setP = (p) => {
      drawUI.progress = p;
      cover.style.height = `${(1 - p) * 100}%`;
      if (Math.abs(p - lastRip) > 0.06) { lastRip = p; beep('rip'); }
    };

    cover.addEventListener('pointerdown', (e) => {
      if (drawUI.mode !== 'ready') return;
      startY = e.clientY;
      startP = drawUI.progress;
      moved = 0;
      cover.setPointerCapture(e.pointerId);
    });
    cover.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      moved = Math.max(moved, Math.abs(startY - e.clientY));
      setP(Math.min(1, Math.max(0, startP + (startY - e.clientY) / win.clientHeight)));
    });
    const end = () => {
      if (startY === null) return;
      startY = null;
      if (moved < 6 || drawUI.progress > 0.18) animateP(1);
      else animateP(0);
    };
    cover.addEventListener('pointerup', end);
    cover.addEventListener('pointercancel', end);

    function animateP(target) {
      drawUI.mode = target === 1 ? 'peeling' : 'ready';
      const from = drawUI.progress;
      const dur = Math.max(250, Math.abs(target - from) * 1100);
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
    card.classList.add(d.is_blank ? 'lose' : 'win');
    $('#pt-cover').remove();
    $('#pt-result').innerHTML = resultHtml(d);
    if (d.is_blank) {
      beep('lose');
    } else {
      beep('win');
      burstCoins();
      if (navigator.vibrate) navigator.vibrate([80, 60, 160]);
    }
    const btn = document.createElement('button');
    btn.className = 'btn gold block draw-btn';
    btn.id = 'draw-btn';
    btn.dataset.action = 'draw';
    $('#draw-stage').appendChild(btn);
    updateDrawButton();
    // 다 뜯었으니 무대 화면에 공개
    try { await sb.rpc('ticket_reveal', { p_token: state.token, p_draw: d.id }); } catch {}
    refresh();
  }

  function burstCoins() {
    const box = $('#pt-coins');
    if (!box) return;
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('div');
      c.className = 'coin';
      const ang = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 170;
      c.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      c.style.setProperty('--dy', `${Math.sin(ang) * dist - 60}px`);
      c.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
      c.style.animationDelay = `${Math.random() * 0.15}s`;
      box.appendChild(c);
      setTimeout(() => c.remove(), 1800);
    }
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
        <div>
          <div class="muted small">상자에 남은 복권</div>
          <div class="pool-num">${String(pl.remaining).padStart(3, '0')}<span> / ${String(pl.total).padStart(3, '0')}</span></div>
        </div>
        <div class="pool-blank">${blanks.length ? `꽝 포함 · 꽝 ${blanks.reduce((s, b) => s + b.quantity, 0)}장` : ''}</div>
      </div>`;

    const card = (p, i) => {
      const won = revealed.filter((d) => d.prize_id === p.id);
      const left = p.quantity - won.length;   // 무대와 같은 기준: 뜯어서 공개된 것만 차감
      const col = GRADE_COLORS[i % GRADE_COLORS.length];
      return `
        <div class="card prize ${left <= 0 ? 'soldout' : ''}" style="--g:${col}">
          <div class="prize-head">
            <div class="prize-emoji">${esc(p.emoji)}</div>
            <div style="flex:1;min-width:0">
              <span class="grade">${esc(p.grade)}</span>
              <div class="prize-name">${esc(p.name)}</div>
              ${p.description ? `<div class="small muted">${esc(p.description)}</div>` : ''}
            </div>
            <div class="prize-left"><b>${left}</b><span>/ ${p.quantity}</span></div>
          </div>
          ${won.length ? `<div class="winners">${won.map((d) => `
            <${admin ? 'button' : 'span'} class="chip winner ${d.claimed ? 'claimed' : ''}" ${admin ? `data-action="toggle-claim" data-draw="${d.id}"` : ''}>
              ${teamBadge(d.team)} ${esc(d.player_name)} ${d.claimed ? '✓' : ''}
            </${admin ? 'button' : 'span'}>`).join('')}</div>` : ''}
          ${admin ? `<div class="admin-actions">
            <button class="btn sm ghost" data-action="edit-prize" data-prize="${p.id}">수정</button>
            ${p.remaining === p.quantity ? `<button class="btn sm red" data-action="delete-prize" data-prize="${p.id}">삭제</button>` : ''}
            <span class="small muted" style="align-self:center">실제 남은 ${p.remaining}${p.announce === false ? ' · 무대 발표 안 함' : ''}</span>
          </div>` : ''}
        </div>`;
    };

    $('#prize-list').innerHTML = (real.length === 0 && blanks.length === 0)
      ? `<div class="card empty">아직 등록된 상품이 없어요.${admin ? '<br>아래에서 상품을 추가해 주세요.' : ''}</div>`
      : real.map(card).join('') + blanks.map((p) => `
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
    $('#pf-qty').value = p?.quantity ?? 1;
    $('#pf-sort').value = p?.sort ?? (state.prizes.length + 1);
    $('#pf-blank').checked = p?.is_blank ?? false;
    $('#pf-announce').checked = p?.announce ?? true;
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
      case 'join':   return `👋 ${p} 입장${note}`;
      case 'grant':  return `🎁 ${a} → <b>${p}</b> 지급${note}`;
      case 'revoke': return `↩️ ${a} → <b>${p}</b> 회수${note}`;
      case 'bet':    return `🎟️ <b>${p}</b> ${room} 1장 걸기`;
      case 'unbet':  return `✖️ <b>${p}</b> ${room} 걸기 취소`;
      case 'payout': return `🏆 <b>${p}</b> ${room} 승리!`;
      case 'refund': return `💸 <b>${p}</b> ${room} 환불`;
      case 'room':   return `🎲 ${a} ${l.room_id ? room : ''} ${esc(l.note ?? '')}`;
      case 'admin':  return `🔑 ${!p || a === p ? a : `${a} → ${p}`} ${esc(l.note ?? '')}`;
      case 'reset':  return `📱 ${a} → ${p} ${esc(l.note ?? '')}`;
      case 'delete': return `🗑️ ${a} ${esc(l.note ?? '')}`;
      case 'team':   return `👥 ${a} → ${p} ${esc(l.note ?? '')}`;
      case 'prize':  return `🎁 ${a} ${esc(l.note ?? '')}`;
      case 'draw':   return `🎟️ <b>${p}</b> 복권 뽑기`;
      default:       return `${esc(l.kind)} ${p}${note}`;
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
      : list.map((l) => `
        <div class="log">
          <div class="time">${fmtTime(l.created_at)}</div>
          <div class="body">${describeLog(l)}</div>
          ${l.amount ? `<div class="amt ${l.amount > 0 ? 'plus' : 'minus'}">${l.amount > 0 ? '+' : ''}${l.amount}</div>` : ''}
        </div>`).join('');
  }

  // ------------------------------------------------------------------
  // 관리
  // ------------------------------------------------------------------
  function renderAdmin() {
    // 뽑기 설정
    const open = drawOpen();
    $('#draw-open-text').innerHTML = open
      ? '<b style="color:var(--green)">🟢 뽑기 열림</b><div class="small muted">참가자들이 지금 뽑을 수 있어요</div>'
      : '<b>⏸ 뽑기 닫힘</b><div class="small muted">관리자만 테스트로 뽑을 수 있어요</div>';
    const $ob = $('#draw-open-btn');
    $ob.textContent = open ? '닫기' : '열기';
    $ob.className = `btn ${open ? 'red' : 'green'}`;

    // 팀 순위 지급: 팀별 인원 표시
    $app.querySelectorAll('.rank-team').forEach((sel) => {
      [...sel.options].forEach((o) => {
        if (!o.value) return;
        const n = state.players.filter((p) => p.team === Number(o.value)).length;
        o.textContent = `${o.value}팀 (${n}명)`;
      });
    });

    // 지급 대상
    const $sel = $('#g-target');
    const prev = $sel.value;
    const byName = [...state.players].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    const teamOpts = Array.from({ length: TEAMS }, (_, i) => {
      const n = state.players.filter((p) => p.team === i + 1).length;
      return `<option value="team:${i + 1}">🏳️ ${i + 1}팀 전원 (${n}명)</option>`;
    }).join('');
    $sel.innerHTML = '<option value="">— 대상 선택 —</option>'
      + `<option value="all">👥 전원 (${state.players.length}명)</option>`
      + teamOpts
      + byName.map((p) => `<option value="${p.id}">${esc(p.name)}${p.team ? ` · ${p.team}팀` : ''} (${p.balance}장)</option>`).join('');
    if ([...$sel.options].some((o) => o.value === prev)) $sel.value = prev;

    // 참가자 목록
    const teamSelect = (p) => `
      <select class="input team-select" data-change="set-team" data-player="${p.id}" style="--c:${p.team ? teamColor(p.team) : 'var(--line)'}">
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
          <button class="btn sm gold" data-action="target" data-player="${p.id}">선택</button>
          ${p.id === state.me.id ? '' : `
            <button class="btn sm ghost" data-action="toggle-admin" data-player="${p.id}" data-value="${!p.is_admin}">
              ${p.is_admin ? '관리자 해제' : '관리자 지정'}</button>
            <button class="btn sm ghost" data-action="reset-device" data-player="${p.id}">기기 초기화</button>
            <button class="btn sm red" data-action="delete-player" data-player="${p.id}">삭제</button>`}
        </div>
      </div>`).join('') || '<div class="empty">참가자가 없어요.</div>';
  }

  // "[1팀] 홍길동, 김철수" / "1팀: 홍길동 김철수" / "1팀" 다음 줄부터 이름 나열 등
  function parseTeams(text) {
    const rows = [];
    let cur = null;
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const m = line.match(/^\[?\s*(\d+)\s*팀\s*\]?\s*[:：\-]?\s*(.*)$/);
      let rest = line;
      if (m) { cur = Number(m[1]); rest = m[2]; }
      if (!cur || cur < 1 || cur > TEAMS) continue;
      const names = (rest.includes(',') || rest.includes('，') ? rest.split(/[,，]/) : rest.split(/\s+/))
        .map((s) => s.trim()).filter(Boolean);
      for (const name of names) rows.push({ name, team: cur });
    }
    return rows;
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
        await call('ticket_bet', { p_room: room }, '1장 걸었어요! 🎟️');
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
        if (await call('ticket_admin_settle', { p_room: room, p_winner: player }, `🏆 ${nameOf(player)}님에게 ${pot}장 지급!`)) {
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
        if (res && res.data === true) toast('관리자가 되었어요 🔑');
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
          p_quantity: parseInt($('#pf-qty').value, 10),
          p_is_blank: $('#pf-blank').checked,
          p_sort: parseInt($('#pf-sort').value, 10) || 0,
          p_announce: $('#pf-announce').checked,
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
        await call('ticket_admin_set_draw_open', { p_open: next }, next ? '뽑기를 열었어요 🎟️' : '뽑기를 닫았어요.');
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
        if (!confirm(`아래처럼 지급할까요?\n\n${lines.join('\n')}`)) return;
        const res = await call('ticket_admin_grant_ranks', { p_ranks: ranks, p_note: $('#rank-note').value.trim() || null });
        if (res) {
          toast(`${res.data.players}명에게 지급했어요 🏆`);
          $app.querySelectorAll('.rank-team').forEach((s) => { s.value = ''; });
          $('#rank-note').value = '';
        }
        break;
      }
      case 'import-teams': {
        const rows = parseTeams($('#team-import').value);
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
        <div class="center-screen"><div class="join">
          <div class="logo">⚠️</div>
          <h1>서버에 연결할 수 없어요</h1>
          <p>config.js 설정과 schema.sql 실행 여부를 확인해 주세요.</p>
          <button class="btn gold block" onclick="location.reload()">다시 시도</button>
        </div></div>`;
    }
  })();
})();
