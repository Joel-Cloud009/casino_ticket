-- =====================================================================
-- 뽑기권 카지노 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전합니다. (테이블/함수 이름은 모두 ticket_ 로 시작)
--
-- !!! 실행 전에 아래 '관리자 코드'를 꼭 바꾸세요 !!!
-- =====================================================================

-- ---------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------
create table if not exists ticket_players (
  id         bigint generated always as identity primary key,
  name       text not null,
  balance    int  not null default 0 check (balance >= 0),
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists ticket_players_name_uq on ticket_players (lower(name));

-- 기기 토큰 (이름 도용 방지). 아무도 API 로 읽을 수 없음.
create table if not exists ticket_secrets (
  player_id  bigint primary key references ticket_players(id) on delete cascade,
  token      text,               -- null = 관리자가 기기 초기화함
  admin_fail int not null default 0
);
create unique index if not exists ticket_secrets_token_uq on ticket_secrets (token);

-- 설정값 (관리자 코드). 아무도 API 로 읽을 수 없음.
create table if not exists ticket_config (
  key   text primary key,
  value text not null
);

create table if not exists ticket_rooms (
  id         bigint generated always as identity primary key,
  title      text not null,
  status     text not null default 'open'
             check (status in ('open', 'locked', 'settled', 'cancelled')),
  created_by bigint references ticket_players(id) on delete set null,
  winner_id  bigint references ticket_players(id) on delete set null,
  pot        int  not null default 0,
  created_at timestamptz not null default now(),
  closed_at  timestamptz
);

-- (room_id, player_id) 기본키 → 한 방에 한 사람당 최대 1장
create table if not exists ticket_bets (
  room_id    bigint not null references ticket_rooms(id) on delete cascade,
  player_id  bigint not null references ticket_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

-- 모든 거래 기록 (감사 로그)
create table if not exists ticket_logs (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind       text not null,  -- join, grant, revoke, bet, unbet, payout, refund, admin, reset, delete, room
  player_id  bigint references ticket_players(id) on delete set null,
  actor_id   bigint references ticket_players(id) on delete set null,
  room_id    bigint references ticket_rooms(id) on delete set null,
  amount     int  not null default 0,
  note       text
);
create index if not exists ticket_logs_created_idx on ticket_logs (created_at desc);

-- ---------------------------------------------------------------------
-- 관리자 코드 (여기를 바꾸세요! 추측하기 어려운 6자 이상 권장)
-- 나중에 바꾸려면: update ticket_config set value = '새코드' where key = 'admin_code';
-- ---------------------------------------------------------------------
insert into ticket_config (key, value) values ('admin_code', '1q2w3e4r')
on conflict (key) do update set value = excluded.value
  where ticket_config.value = 'CHANGE_ME';  -- 아직 미설정일 때만 덮어씀 (설정된 코드는 재실행해도 유지)

-- ---------------------------------------------------------------------
-- 접근 권한: 읽기만 공개, 쓰기는 아래 함수로만 가능
-- ---------------------------------------------------------------------
alter table ticket_players enable row level security;
alter table ticket_secrets enable row level security;
alter table ticket_config  enable row level security;
alter table ticket_rooms   enable row level security;
alter table ticket_bets    enable row level security;
alter table ticket_logs    enable row level security;

drop policy if exists ticket_players_read on ticket_players;
drop policy if exists ticket_rooms_read   on ticket_rooms;
drop policy if exists ticket_bets_read    on ticket_bets;
drop policy if exists ticket_logs_read    on ticket_logs;
create policy ticket_players_read on ticket_players for select using (true);
create policy ticket_rooms_read   on ticket_rooms   for select using (true);
create policy ticket_bets_read    on ticket_bets    for select using (true);
-- ticket_secrets / ticket_config / ticket_logs 는 정책이 없으므로 API 로 직접 접근 불가
-- (기록은 ticket_get_logs 함수로만: 일반 참가자는 본인 기록, 관리자는 전체)

revoke all on ticket_players, ticket_rooms, ticket_bets, ticket_logs, ticket_secrets, ticket_config
  from anon, authenticated;
grant select on ticket_players, ticket_rooms, ticket_bets to anon, authenticated;

-- ---------------------------------------------------------------------
-- 내부 헬퍼
-- ---------------------------------------------------------------------
create or replace function ticket__me(p_token text, p_admin boolean default false)
returns ticket_players
language plpgsql security definer set search_path = public as $$
declare r ticket_players;
begin
  if p_token is null or length(p_token) < 20 then
    raise exception '로그인 정보가 없어요. 새로고침 후 다시 입장해 주세요.';
  end if;
  select p.* into r
    from ticket_players p join ticket_secrets s on s.player_id = p.id
   where s.token = p_token;
  if not found then
    raise exception '로그인 정보가 없어요. 새로고침 후 다시 입장해 주세요.';
  end if;
  if p_admin and not r.is_admin then
    raise exception '관리자만 할 수 있어요.';
  end if;
  return r;
end $$;

create or replace function ticket__log(
  p_kind text, p_player bigint, p_actor bigint, p_room bigint, p_amount int, p_note text)
returns void
language sql security definer set search_path = public as $$
  insert into ticket_logs (kind, player_id, actor_id, room_id, amount, note)
  values (p_kind, p_player, p_actor, p_room, p_amount, p_note);
$$;

-- ---------------------------------------------------------------------
-- 입장 / 로그인
-- ---------------------------------------------------------------------
create or replace function ticket_whoami(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare r ticket_players;
begin
  select p.* into r
    from ticket_players p join ticket_secrets s on s.player_id = p.id
   where s.token = p_token and p_token is not null;
  if not found then return null; end if;
  return json_build_object('id', r.id, 'name', r.name, 'is_admin', r.is_admin);
end $$;

create or replace function ticket_join(p_name text, p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_name   text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_player ticket_players;
  v_tok    text;
  v_bound  bigint;
begin
  if length(v_name) < 1 or length(v_name) > 20 then
    raise exception '이름은 1~20자로 입력해 주세요.';
  end if;
  if p_token is null or length(p_token) < 20 then
    raise exception '잘못된 요청이에요. 새로고침해 주세요.';
  end if;

  -- 이 기기가 이미 다른 이름으로 등록되어 있으면 거부 (1기기 1인)
  select player_id into v_bound from ticket_secrets where token = p_token;

  select * into v_player from ticket_players where lower(name) = lower(v_name) for update;

  if found then
    if v_bound is not null and v_bound <> v_player.id then
      raise exception '이 기기는 이미 다른 이름으로 등록되어 있어요.';
    end if;
    select token into v_tok from ticket_secrets where player_id = v_player.id;
    if v_tok is null then
      -- 관리자가 기기 초기화한 이름 → 새 기기로 연결
      insert into ticket_secrets (player_id, token) values (v_player.id, p_token)
      on conflict (player_id) do update set token = excluded.token;
      perform ticket__log('join', v_player.id, v_player.id, null, 0, '새 기기로 다시 연결');
    elsif v_tok <> p_token then
      raise exception '"%" 은(는) 이미 다른 기기에서 사용 중인 이름이에요. 본인이라면 관리자에게 기기 초기화를 요청하세요.', v_player.name;
    end if;
  else
    if v_bound is not null then
      raise exception '이 기기는 이미 다른 이름으로 등록되어 있어요.';
    end if;
    begin
      insert into ticket_players (name) values (v_name) returning * into v_player;
    exception when unique_violation then
      raise exception '"%" 은(는) 이미 사용 중인 이름이에요.', v_name;
    end;
    insert into ticket_secrets (player_id, token) values (v_player.id, p_token);
    perform ticket__log('join', v_player.id, v_player.id, null, 0, null);
  end if;

  return json_build_object('id', v_player.id, 'name', v_player.name, 'is_admin', v_player.is_admin);
end $$;

-- 거래 기록 조회: 관리자는 전체, 일반 참가자는 본인이 대상이거나 직접 한 기록만
create or replace function ticket_get_logs(p_token text, p_limit int default 300)
returns setof ticket_logs
language plpgsql security definer set search_path = public as $$
declare me ticket_players := ticket__me(p_token);
begin
  return query
    select * from ticket_logs l
     where me.is_admin or l.player_id = me.id or l.actor_id = me.id
     order by l.id desc
     limit least(greatest(coalesce(p_limit, 300), 1), 1000);
end $$;

-- 관리자 코드로 관리자 되기 (5회 틀리면 잠김)
-- 성공하면 true, 코드가 틀리면 false
create or replace function ticket_become_admin(p_token text, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  me     ticket_players := ticket__me(p_token);
  v_code text;
  v_fail int;
begin
  select value into v_code from ticket_config where key = 'admin_code';
  if v_code is null or v_code = 'CHANGE_ME' then
    raise exception '관리자 코드가 아직 설정되지 않았어요. (schema.sql 참고)';
  end if;
  select admin_fail into v_fail from ticket_secrets where player_id = me.id for update;
  if v_fail >= 5 then
    raise exception '시도 횟수를 초과했어요. 기존 관리자에게 권한을 요청하세요.';
  end if;
  if p_code is distinct from v_code then
    update ticket_secrets set admin_fail = admin_fail + 1 where player_id = me.id;
    perform ticket__log('admin', me.id, me.id, null, 0, '관리자 코드 입력 실패');
    return false;  -- 예외를 던지면 실패 횟수 증가가 롤백되므로 false 반환
  end if;
  update ticket_players set is_admin = true where id = me.id;
  update ticket_secrets set admin_fail = 0 where player_id = me.id;
  perform ticket__log('admin', me.id, me.id, null, 0, '관리자 코드로 관리자 됨');
  return true;
end $$;

-- ---------------------------------------------------------------------
-- 관리자 기능
-- ---------------------------------------------------------------------
-- p_target 이 null 이면 전원에게 지급
create or replace function ticket_admin_grant(p_token text, p_target bigint, p_amount int, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  t  ticket_players;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 100), '');
begin
  if p_amount is null or p_amount = 0 or abs(p_amount) > 1000 then
    raise exception '수량은 -1000 ~ 1000 사이(0 제외)로 입력해 주세요.';
  end if;

  if p_target is null then
    if p_amount < 0 then raise exception '전원 회수는 할 수 없어요. 한 명씩 회수해 주세요.'; end if;
    for t in select * from ticket_players order by id for update loop
      update ticket_players set balance = balance + p_amount where id = t.id;
      perform ticket__log('grant', t.id, me.id, null, p_amount, coalesce(v_note, '전원 지급'));
    end loop;
    return;
  end if;

  select * into t from ticket_players where id = p_target for update;
  if not found then raise exception '없는 참가자예요.'; end if;
  if t.balance + p_amount < 0 then
    raise exception '%님의 보유량(%장)보다 많이 회수할 수 없어요.', t.name, t.balance;
  end if;
  update ticket_players set balance = balance + p_amount where id = t.id;
  perform ticket__log(case when p_amount > 0 then 'grant' else 'revoke' end,
                      t.id, me.id, null, p_amount, v_note);
end $$;

create or replace function ticket_admin_set_admin(p_token text, p_target bigint, p_value boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  t  ticket_players;
begin
  if p_target = me.id and not p_value then
    raise exception '자기 자신의 관리자 권한은 해제할 수 없어요.';
  end if;
  select * into t from ticket_players where id = p_target for update;
  if not found then raise exception '없는 참가자예요.'; end if;
  update ticket_players set is_admin = p_value where id = t.id;
  perform ticket__log('admin', t.id, me.id, null, 0,
                      case when p_value then '관리자 권한 부여' else '관리자 권한 해제' end);
end $$;

create or replace function ticket_admin_reset_device(p_token text, p_target bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare me ticket_players := ticket__me(p_token, true);
begin
  if p_target = me.id then raise exception '자기 자신은 초기화할 수 없어요.'; end if;
  update ticket_secrets set token = null, admin_fail = 0 where player_id = p_target;
  if not found then raise exception '없는 참가자예요.'; end if;
  perform ticket__log('reset', p_target, me.id, null, 0, '기기 초기화 (다음 입장 기기로 연결됨)');
end $$;

-- 참가자 완전 삭제: 이름·보유 뽑기권·진행 중 판돈·기기 연결을 모두 제거
-- 보유분과 진행 중인 방에 건 판돈은 소멸 처리 (정합성 유지를 위해 -N 으로 기록)
-- 과거 기록은 남되 이름은 '(삭제됨)' 으로 표시됨
create or replace function ticket_admin_delete_player(p_token text, p_target bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  t  ticket_players;
  v_staked int;
begin
  if p_target = me.id then raise exception '자기 자신은 삭제할 수 없어요.'; end if;

  -- 잠금 순서: 방 → 참가자 (베팅/정산 함수와 동일)
  perform 1 from ticket_rooms r
   where r.status in ('open', 'locked')
     and exists (select 1 from ticket_bets b where b.room_id = r.id and b.player_id = p_target)
   order by r.id for update;
  select * into t from ticket_players where id = p_target for update;
  if not found then raise exception '없는 참가자예요.'; end if;

  -- 진행 중인 방의 판돈에서 빼기
  with gone as (
    update ticket_rooms r set pot = pot - 1
     where r.status in ('open', 'locked')
       and exists (select 1 from ticket_bets b where b.room_id = r.id and b.player_id = t.id)
    returning 1
  )
  select count(*) into v_staked from gone;

  perform ticket__log('delete', null, me.id, null, -(t.balance + v_staked),
    '참가자 삭제: ' || t.name || ' (보유 ' || t.balance || '장'
    || case when v_staked > 0 then ', 판돈 ' || v_staked || '장' else '' end || ' 소멸)');

  delete from ticket_players where id = t.id;  -- 베팅·기기 연결은 cascade 로 함께 삭제
end $$;

-- ---------------------------------------------------------------------
-- 게임방
-- ---------------------------------------------------------------------
create or replace function ticket_create_room(p_token text, p_title text)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  v_title text := btrim(coalesce(p_title, ''));
  v_id bigint;
begin
  if length(v_title) < 1 or length(v_title) > 30 then
    raise exception '방 이름은 1~30자로 입력해 주세요.';
  end if;
  insert into ticket_rooms (title, created_by) values (v_title, me.id) returning id into v_id;
  perform ticket__log('room', null, me.id, v_id, 0, '방 생성');
  return v_id;
end $$;

create or replace function ticket_bet(p_token text, p_room bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token);
  r  ticket_rooms;
  v_bal int;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;
  if r.status <> 'open' then raise exception '베팅이 마감된 방이에요.'; end if;

  select balance into v_bal from ticket_players where id = me.id for update;
  if exists (select 1 from ticket_bets where room_id = p_room and player_id = me.id) then
    raise exception '이미 이 방에 1장을 걸었어요.';
  end if;
  if v_bal < 1 then raise exception '뽑기권이 없어요.'; end if;

  insert into ticket_bets (room_id, player_id) values (p_room, me.id);
  update ticket_players set balance = balance - 1 where id = me.id;
  update ticket_rooms set pot = pot + 1 where id = p_room;
  perform ticket__log('bet', me.id, me.id, p_room, -1, null);
end $$;

create or replace function ticket_unbet(p_token text, p_room bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token);
  r  ticket_rooms;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;
  if r.status <> 'open' then raise exception '베팅이 마감되어 취소할 수 없어요.'; end if;

  delete from ticket_bets where room_id = p_room and player_id = me.id;
  if not found then raise exception '이 방에 건 뽑기권이 없어요.'; end if;
  update ticket_players set balance = balance + 1 where id = me.id;
  update ticket_rooms set pot = pot - 1 where id = p_room;
  perform ticket__log('unbet', me.id, me.id, p_room, 1, null);
end $$;

-- 마감(locked) ↔ 재개(open)
create or replace function ticket_admin_lock_room(p_token text, p_room bigint, p_locked boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  ticket_rooms;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;
  if r.status not in ('open', 'locked') then raise exception '이미 끝난 방이에요.'; end if;
  update ticket_rooms set status = case when p_locked then 'locked' else 'open' end where id = p_room;
  perform ticket__log('room', null, me.id, p_room, 0, case when p_locked then '베팅 마감' else '베팅 재개' end);
end $$;

create or replace function ticket_admin_settle(p_token text, p_room bigint, p_winner bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  ticket_rooms;
  v_pot int;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;
  if r.status not in ('open', 'locked') then raise exception '이미 끝난 방이에요.'; end if;
  if not exists (select 1 from ticket_bets where room_id = p_room and player_id = p_winner) then
    raise exception '승자는 이 방에 건 사람 중에서 골라야 해요.';
  end if;

  select count(*) into v_pot from ticket_bets where room_id = p_room;
  perform 1 from ticket_players where id = p_winner for update;
  update ticket_players set balance = balance + v_pot where id = p_winner;
  update ticket_rooms
     set status = 'settled', winner_id = p_winner, pot = v_pot, closed_at = now()
   where id = p_room;
  perform ticket__log('payout', p_winner, me.id, p_room, v_pot, null);
end $$;

create or replace function ticket_admin_cancel_room(p_token text, p_room bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  ticket_rooms;
  b  record;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;
  if r.status not in ('open', 'locked') then raise exception '이미 끝난 방이에요.'; end if;

  for b in select player_id from ticket_bets where room_id = p_room order by player_id loop
    update ticket_players set balance = balance + 1 where id = b.player_id;
    perform ticket__log('refund', b.player_id, me.id, p_room, 1, null);
  end loop;
  update ticket_rooms set status = 'cancelled', closed_at = now() where id = p_room;
  perform ticket__log('room', null, me.id, p_room, 0, '방 취소 (전원 환불)');
end $$;

-- 게임방 삭제: 진행 중이면 건 사람 전원 환불 후 삭제, 끝난 방은 목록에서만 제거
-- (이미 지급된 상금은 그대로 유지)
create or replace function ticket_admin_delete_room(p_token text, p_room bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  ticket_rooms;
  b  record;
begin
  select * into r from ticket_rooms where id = p_room for update;
  if not found then raise exception '없는 방이에요.'; end if;

  if r.status in ('open', 'locked') then
    for b in select player_id from ticket_bets where room_id = p_room order by player_id loop
      update ticket_players set balance = balance + 1 where id = b.player_id;
      perform ticket__log('refund', b.player_id, me.id, p_room, 1, '방 삭제 환불');
    end loop;
  end if;

  perform ticket__log('room', null, me.id, null, 0, '방 삭제: ' || r.title);
  delete from ticket_rooms where id = p_room;  -- 베팅은 cascade, 기록의 방 연결은 null 처리
end $$;

-- =====================================================================
-- 팀 · 뽑기 · 상품
-- =====================================================================
alter table ticket_players add column if not exists team smallint check (team between 1 and 8);

-- 공개 설정값 (뽑기 오픈 여부 등)
create table if not exists ticket_settings (
  key   text primary key,
  value text not null
);
insert into ticket_settings (key, value) values ('draw_open', 'false') on conflict (key) do nothing;

-- 상품 (꽝도 하나의 상품으로 등록: is_blank = true)
-- 상자 방식: 전체 복권 = 모든 상품 quantity 합. 뽑을 때마다 remaining 감소.
create table if not exists ticket_prizes (
  id          bigint generated always as identity primary key,
  grade       text not null,                 -- 예: 'A상', '꽝'
  name        text not null default '',      -- 예: '무선 이어폰'
  emoji       text not null default '🎁',
  description text,
  quantity    int  not null check (quantity >= 0),
  remaining   int  not null check (remaining >= 0),
  is_blank    boolean not null default false,
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  check (remaining <= quantity)
);
-- 무대 화면에서 크게 발표할지 (흔한 상품은 끄면 실시간 목록에만 표시)
alter table ticket_prizes add column if not exists announce boolean not null default true;

-- 뽑기 결과. revealed = 본인이 복권을 다 뜯었는지 (무대 화면은 뜯은 것만 표시)
create table if not exists ticket_draws (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  player_id   bigint references ticket_players(id) on delete set null,
  player_name text not null,
  team        smallint,
  prize_id    bigint references ticket_prizes(id) on delete set null,
  grade       text not null,
  prize_name  text not null,
  emoji       text not null,
  is_blank    boolean not null,
  revealed    boolean not null default false,
  revealed_at timestamptz,
  claimed     boolean not null default false
);
create index if not exists ticket_draws_player_idx on ticket_draws (player_id);

alter table ticket_settings enable row level security;
alter table ticket_prizes   enable row level security;
alter table ticket_draws    enable row level security;
drop policy if exists ticket_settings_read on ticket_settings;
drop policy if exists ticket_prizes_read   on ticket_prizes;
drop policy if exists ticket_draws_read    on ticket_draws;
create policy ticket_settings_read on ticket_settings for select using (true);
create policy ticket_prizes_read   on ticket_prizes   for select using (true);
create policy ticket_draws_read    on ticket_draws    for select using (true);
revoke all on ticket_settings, ticket_prizes, ticket_draws from anon, authenticated;
grant select on ticket_settings, ticket_prizes, ticket_draws to anon, authenticated;

-- ---------------------------------------------------------------------
-- 팀
-- ---------------------------------------------------------------------
create or replace function ticket_admin_set_team(p_token text, p_target bigint, p_team smallint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  t  ticket_players;
begin
  if p_team is not null and (p_team < 1 or p_team > 8) then raise exception '팀 번호가 올바르지 않아요.'; end if;
  select * into t from ticket_players where id = p_target for update;
  if not found then raise exception '없는 참가자예요.'; end if;
  update ticket_players set team = p_team where id = t.id;
  perform ticket__log('team', t.id, me.id, null, 0,
    case when p_team is null then '팀 해제' else p_team || '팀 배정' end);
end $$;

-- 팀 일괄 배정: [{"name":"홍길동","team":1}, ...]
-- 아직 입장하지 않은 이름은 미리 등록됨 (그 이름으로 처음 입장하는 기기에 연결)
create or replace function ticket_admin_import_teams(p_token text, p_rows jsonb)
returns json
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  jsonb;
  v_name text;
  v_team smallint;
  v_id bigint;
  v_created int := 0;
  v_updated int := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' then raise exception '잘못된 형식이에요.'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_name := btrim(regexp_replace(coalesce(r->>'name', ''), '\s+', ' ', 'g'));
    v_team := (r->>'team')::smallint;
    if length(v_name) < 1 or length(v_name) > 20 then continue; end if;
    if v_team is null or v_team < 1 or v_team > 8 then continue; end if;

    select id into v_id from ticket_players where lower(name) = lower(v_name) for update;
    if not found then
      insert into ticket_players (name, team) values (v_name, v_team) returning id into v_id;
      perform ticket__log('join', v_id, me.id, null, 0, '관리자가 미리 등록');
      v_created := v_created + 1;
    else
      update ticket_players set team = v_team where id = v_id;
      v_updated := v_updated + 1;
    end if;
    perform ticket__log('team', v_id, me.id, null, 0, v_team || '팀 배정');
  end loop;
  return json_build_object('created', v_created, 'updated', v_updated);
end $$;

-- 팀 순위 지급: [{"rank":1,"team":3,"amount":4}, ...]  (한 번에 처리)
create or replace function ticket_admin_grant_ranks(p_token text, p_ranks jsonb, p_note text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  r  jsonb;
  t  ticket_players;
  v_team smallint;
  v_amount int;
  v_rank int;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 80), '');
  v_count int := 0;
  v_seen smallint[] := '{}';
begin
  if jsonb_typeof(p_ranks) <> 'array' then raise exception '잘못된 형식이에요.'; end if;
  for r in select * from jsonb_array_elements(p_ranks) loop
    v_team := (r->>'team')::smallint;
    v_amount := (r->>'amount')::int;
    v_rank := (r->>'rank')::int;
    if v_team is null or v_amount is null or v_amount = 0 then continue; end if;
    if v_amount < 0 or v_amount > 1000 then raise exception '수량은 1~1000 사이로 입력해 주세요.'; end if;
    if v_team = any(v_seen) then raise exception '%팀이 두 번 선택됐어요.', v_team; end if;
    v_seen := v_seen || v_team;
    for t in select * from ticket_players where team = v_team order by id for update loop
      update ticket_players set balance = balance + v_amount where id = t.id;
      perform ticket__log('grant', t.id, me.id, null, v_amount,
        coalesce(v_note || ' · ', '') || coalesce(v_rank || '등 ', '') || v_team || '팀');
      v_count := v_count + 1;
    end loop;
  end loop;
  return json_build_object('players', v_count);
end $$;

-- 특정 팀 전원 지급
create or replace function ticket_admin_grant_team(p_token text, p_team smallint, p_amount int, p_note text)
returns json
language plpgsql security definer set search_path = public as $$
begin
  return ticket_admin_grant_ranks(p_token,
    jsonb_build_array(jsonb_build_object('team', p_team, 'amount', p_amount)), p_note);
end $$;

-- ---------------------------------------------------------------------
-- 상품 관리
-- ---------------------------------------------------------------------
create or replace function ticket_admin_set_draw_open(p_token text, p_open boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare me ticket_players := ticket__me(p_token, true);
begin
  insert into ticket_settings (key, value) values ('draw_open', p_open::text)
  on conflict (key) do update set value = excluded.value;
  perform ticket__log('admin', null, me.id, null, 0, case when p_open then '뽑기 오픈' else '뽑기 닫음' end);
end $$;

-- p_id 가 null 이면 추가, 아니면 수정
drop function if exists ticket_admin_save_prize(text, bigint, text, text, text, text, int, boolean, int);
create or replace function ticket_admin_save_prize(
  p_token text, p_id bigint, p_grade text, p_name text, p_emoji text,
  p_description text, p_quantity int, p_is_blank boolean, p_sort int, p_announce boolean default true)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  pr ticket_prizes;
  v_drawn int;
  v_id bigint;
  v_grade text := left(btrim(coalesce(p_grade, '')), 20);
begin
  if length(v_grade) < 1 then raise exception '등급을 입력해 주세요. (예: A상, 꽝)'; end if;
  if p_quantity is null or p_quantity < 0 or p_quantity > 10000 then
    raise exception '수량은 0~10000 사이로 입력해 주세요.';
  end if;

  if p_id is null then
    insert into ticket_prizes (grade, name, emoji, description, quantity, remaining, is_blank, sort, announce)
    values (v_grade, left(btrim(coalesce(p_name, '')), 40), coalesce(nullif(btrim(p_emoji), ''), '🎁'),
            nullif(left(btrim(coalesce(p_description, '')), 200), ''), p_quantity, p_quantity,
            coalesce(p_is_blank, false), coalesce(p_sort, 0), coalesce(p_announce, true))
    returning id into v_id;
    perform ticket__log('prize', null, me.id, null, 0, '상품 추가: ' || v_grade);
    return v_id;
  end if;

  select * into pr from ticket_prizes where id = p_id for update;
  if not found then raise exception '없는 상품이에요.'; end if;
  v_drawn := pr.quantity - pr.remaining;
  if p_quantity < v_drawn then
    raise exception '이미 %개가 뽑혀서 수량을 %개보다 줄일 수 없어요.', v_drawn, v_drawn;
  end if;
  update ticket_prizes set
    grade = v_grade,
    name = left(btrim(coalesce(p_name, '')), 40),
    emoji = coalesce(nullif(btrim(p_emoji), ''), '🎁'),
    description = nullif(left(btrim(coalesce(p_description, '')), 200), ''),
    quantity = p_quantity,
    remaining = p_quantity - v_drawn,
    is_blank = coalesce(p_is_blank, false),
    sort = coalesce(p_sort, 0),
    announce = coalesce(p_announce, true)
  where id = p_id;
  perform ticket__log('prize', null, me.id, null, 0, '상품 수정: ' || v_grade);
  return p_id;
end $$;

create or replace function ticket_admin_delete_prize(p_token text, p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token, true);
  pr ticket_prizes;
begin
  select * into pr from ticket_prizes where id = p_id for update;
  if not found then raise exception '없는 상품이에요.'; end if;
  if pr.remaining <> pr.quantity then
    raise exception '이미 뽑힌 상품은 삭제할 수 없어요. 수량을 줄여 주세요.';
  end if;
  delete from ticket_prizes where id = p_id;
  perform ticket__log('prize', null, me.id, null, 0, '상품 삭제: ' || pr.grade);
end $$;

create or replace function ticket_admin_set_claimed(p_token text, p_draw bigint, p_claimed boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare me ticket_players := ticket__me(p_token, true);
begin
  update ticket_draws set claimed = p_claimed where id = p_draw;
  if not found then raise exception '없는 뽑기 기록이에요.'; end if;
end $$;

-- ---------------------------------------------------------------------
-- 뽑기
-- ---------------------------------------------------------------------
-- 뽑기권 1장으로 상자에서 1장 뽑기. 결과는 본인만 알고, 뜯기 전까지 무대에 안 나옴.
create or replace function ticket_draw(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  me ticket_players := ticket__me(p_token);
  v_open boolean;
  v_bal int;
  v_total int;
  v_pick int;
  pr ticket_prizes;
  chosen ticket_prizes;
  v_id bigint;
begin
  select value = 'true' into v_open from ticket_settings where key = 'draw_open';
  if not coalesce(v_open, false) and not me.is_admin then
    raise exception '아직 뽑기 시간이 아니에요.';
  end if;
  if exists (select 1 from ticket_draws where player_id = me.id and not revealed) then
    raise exception '먼저 뽑은 복권을 뜯어 주세요.';
  end if;

  -- 동시에 여러 명이 뽑아도 상자 수량이 꼬이지 않도록 상품 전체 잠금 (상품 → 참가자 순)
  perform 1 from ticket_prizes order by id for update;
  select balance into v_bal from ticket_players where id = me.id for update;
  if v_bal < 1 then raise exception '뽑기권이 없어요.'; end if;

  select coalesce(sum(remaining), 0) into v_total from ticket_prizes;
  if v_total = 0 then raise exception '복권이 모두 소진됐어요.'; end if;

  v_pick := floor(random() * v_total)::int;
  for pr in select * from ticket_prizes where remaining > 0 order by sort, id loop
    if v_pick < pr.remaining then chosen := pr; exit; end if;
    v_pick := v_pick - pr.remaining;
  end loop;

  update ticket_prizes set remaining = remaining - 1 where id = chosen.id;
  update ticket_players set balance = balance - 1 where id = me.id;
  insert into ticket_draws (player_id, player_name, team, prize_id, grade, prize_name, emoji, is_blank)
  values (me.id, me.name, me.team, chosen.id, chosen.grade, chosen.name, chosen.emoji, chosen.is_blank)
  returning id into v_id;
  perform ticket__log('draw', me.id, me.id, null, -1, null);

  return json_build_object(
    'id', v_id, 'grade', chosen.grade, 'prize_name', chosen.name, 'emoji', chosen.emoji,
    'is_blank', chosen.is_blank, 'remaining', v_total - 1,
    'total', (select coalesce(sum(quantity), 0) from ticket_prizes));
end $$;

-- 복권을 다 뜯었을 때 호출 → 무대 화면에 공개
create or replace function ticket_reveal(p_token text, p_draw bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare me ticket_players := ticket__me(p_token);
begin
  update ticket_draws set revealed = true, revealed_at = now()
   where id = p_draw and player_id = me.id and not revealed;
end $$;

grant execute on function ticket_admin_set_team(text, bigint, smallint)                        to anon, authenticated;
grant execute on function ticket_admin_import_teams(text, jsonb)                               to anon, authenticated;
grant execute on function ticket_admin_grant_ranks(text, jsonb, text)                          to anon, authenticated;
grant execute on function ticket_admin_grant_team(text, smallint, int, text)                   to anon, authenticated;
grant execute on function ticket_admin_set_draw_open(text, boolean)                            to anon, authenticated;
grant execute on function ticket_admin_save_prize(text, bigint, text, text, text, text, int, boolean, int, boolean) to anon, authenticated;
grant execute on function ticket_admin_delete_prize(text, bigint)                              to anon, authenticated;
grant execute on function ticket_admin_set_claimed(text, bigint, boolean)                      to anon, authenticated;
grant execute on function ticket_draw(text)                                                    to anon, authenticated;
grant execute on function ticket_reveal(text, bigint)                                          to anon, authenticated;

-- ---------------------------------------------------------------------
-- 함수 실행 권한: 내부 헬퍼는 막고, 공개 함수만 허용
-- ---------------------------------------------------------------------
revoke execute on function ticket__me(text, boolean) from public, anon, authenticated;
revoke execute on function ticket__log(text, bigint, bigint, bigint, int, text) from public, anon, authenticated;

grant execute on function ticket_whoami(text)                              to anon, authenticated;
grant execute on function ticket_join(text, text)                          to anon, authenticated;
grant execute on function ticket_get_logs(text, int)                       to anon, authenticated;
grant execute on function ticket_become_admin(text, text)                  to anon, authenticated;
grant execute on function ticket_admin_grant(text, bigint, int, text)      to anon, authenticated;
grant execute on function ticket_admin_set_admin(text, bigint, boolean)    to anon, authenticated;
grant execute on function ticket_admin_reset_device(text, bigint)          to anon, authenticated;
grant execute on function ticket_admin_delete_player(text, bigint)         to anon, authenticated;
grant execute on function ticket_create_room(text, text)                   to anon, authenticated;
grant execute on function ticket_bet(text, bigint)                         to anon, authenticated;
grant execute on function ticket_unbet(text, bigint)                       to anon, authenticated;
grant execute on function ticket_admin_lock_room(text, bigint, boolean)    to anon, authenticated;
grant execute on function ticket_admin_settle(text, bigint, bigint)        to anon, authenticated;
grant execute on function ticket_admin_cancel_room(text, bigint)           to anon, authenticated;
grant execute on function ticket_admin_delete_room(text, bigint)           to anon, authenticated;

-- ---------------------------------------------------------------------
-- 정합성 검증용 통계: issued(관리자 순발행) = held(보유) + staked(진행 중 판돈) + drawn(뽑기에 사용) 이어야 정상
-- (참가자 삭제로 소멸된 뽑기권은 issued 에서 차감)
-- 기록 테이블은 비공개이므로 뷰 소유자 권한으로 합계만 계산해서 공개
-- ---------------------------------------------------------------------
create or replace view ticket_stats with (security_invoker = off) as
select
  (select coalesce(sum(amount), 0) from ticket_logs where kind in ('grant', 'revoke', 'delete'))::int as issued,
  (select coalesce(sum(balance), 0) from ticket_players)::int                             as held,
  (select coalesce(sum(pot), 0) from ticket_rooms where status in ('open', 'locked'))::int as staked,
  (select count(*) from ticket_players)::int                                              as players,
  (select count(*) from ticket_draws)::int                                                as drawn;
grant select on ticket_stats to anon, authenticated;

-- ---------------------------------------------------------------------
-- 실시간 반영 켜기
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['ticket_players', 'ticket_rooms', 'ticket_bets',
                           'ticket_settings', 'ticket_prizes', 'ticket_draws'] loop
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
  -- 기록은 비공개라 실시간 전송 대상에서 제외
  if exists (select 1 from pg_publication_tables
              where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_logs') then
    alter publication supabase_realtime drop table public.ticket_logs;
  end if;
end $$;
