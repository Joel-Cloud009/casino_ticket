# 🌅 대부도 워크샵 럭키 드로우

사내 워크샵용 뽑기권 앱. 참가자는 **링크(QR)만 열고 이름 입력**하면 끝.

- 사이트: https://workshopticket.netlify.app (무대 화면: `/stage.html`)
- 저장소: https://github.com/Joel-Cloud009/casino_ticket (비공개)
- DB: Supabase (`config.js` 의 프로젝트)

---

## 같이 개발하기

### 처음 한 번

```bash
git clone https://github.com/Joel-Cloud009/casino_ticket.git
cd casino_ticket
```

기본 브랜치가 `dev` 라서 자동으로 `dev` 로 받아짐. (`git branch` 로 `* dev` 확인)

### 매번

1. 작업 전: `git pull`
2. 수정 → 로컬에서 확인 (아래 "로컬 미리보기")
3. 작업 후: `git add -A` → `git commit -m "무엇을 바꿨는지"` → `git push`

### 규칙

- **모두 `dev` 브랜치에서 작업.** `dev` 에 올리면 GitHub 에 저장만 되고 사이트는 안 바뀜.
- **`main` 에 올리면 사이트가 자동 배포**되고 Netlify 크레딧이 듦 → 배포 담당 1명만, 모아서 한 번에.
- **GitHub PR(풀 리퀘스트)은 만들지 않기** (미리보기 배포가 돌아서 크레딧 소모).
- 같은 파일을 동시에 크게 고치면 충돌 → 누가 어느 부분을 맡을지 미리 정하기.
- Claude Code 로 작업한다면 `CLAUDE.md` 에 같은 규칙이 있어 자동으로 따름.

### 로컬 미리보기

이 폴더에서:

```bash
python -m http.server 3950
```

→ 브라우저에서 http://localhost:3950 (무대: http://localhost:3950/stage.html)
같은 와이파이의 폰: `http://<내 PC IP>:3950`

> ⚠️ 로컬에서도 **실제 Supabase** 에 연결됨. 테스트로 지급·뽑기를 하면 실제 데이터가 바뀌니, 끝나면 아래 초기화 쿼리로 정리.

### 배포 (배포 담당만)

```bash
git checkout main
git merge dev
git push origin main      # → Netlify 자동 배포 (1분 내)
git checkout dev
```

`schema.sql` 이 바뀌었다면 **배포 전에** Supabase SQL Editor 에서 `schema.sql` 전체를 먼저 실행.

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html`, `app.js`, `style.css` | 메인 앱 (참가자·관리자) |
| `stage.html` | 무대(프로젝터) 화면. `?demo` 붙이면 당첨 발표 미리보기 |
| `config.js` | Supabase 주소·공개 키 (`service_role` 키는 절대 넣지 말 것) |
| `schema.sql` | DB 구조·규칙·함수 전부 (여러 번 실행해도 안전) |
| `prizes/` | 상품 사진 |
| `print/` | 참가자용 QR 코드·인쇄 포스터 |
| `manifest.json`, `icon-*.png` | 홈 화면에 추가할 때 앱 이름·아이콘 |
| `CHANGELOG.md` | 변경 기록 (무엇을 왜 바꿨는지) |

---

## 처음 세팅 (이미 완료됨 — 새로 만들 때만)

1. Supabase 프로젝트 → **SQL Editor** 에 `schema.sql` 전체 붙여넣고 Run (관리자 코드는 `'CHANGE_ME'` 부분)
2. Project Settings → API 의 URL·anon 키를 `config.js` 에
3. Netlify 에서 이 GitHub 저장소 연결 (Production branch `main`, Branch deploys: production only, 빌드 명령·폴더 비움)
4. 앱 접속 → 이름 입력 → 현황 탭 맨 아래 `관리자 코드 입력`

### 상품 넣기 (상품이 비어 있을 때 한 번만)

```sql
-- 워크샵 경품 시트 기준 (C상 현금 10만원은 비어퐁 전용이라 뽑기에 없음). 합계 200
-- premium = 고급 상품: 한 사람이 고급 상품을 2개 이상 받지 않음 (일반 상품이 다 떨어지면 예외)
insert into ticket_prizes (grade, name, emoji, quantity, remaining, sort, announce, premium, image_url) values
  ('A상', '현금 20만원', '💰',   1,   1, 1, true,  true,  'prizes/cash-200k.jpg'),
  ('B상', '주류',        '🍾',   1,   1, 2, true,  true,  'prizes/liquor.jpg'),
  ('D상', '초콜릿',      '🍫',   2,   2, 3, true,  true,  'prizes/chocolate.jpg'),
  ('E상', '현금 5만원',  '💵',   1,   1, 4, true,  true,  'prizes/cash-50k.jpg'),
  ('F상', '스팸',        '🥫',   2,   2, 5, true,  false, null),
  ('G상', '현금 3만원',  '💵',   3,   3, 6, true,  false, 'prizes/cash-30k.jpg'),
  ('H상', '현금 1만원',  '💵',  10,  10, 7, true,  false, 'prizes/cash-10k.jpg'),
  ('I상', '젤리',        '🍬', 180, 180, 8, false, false, 'prizes/jelly.jpg');
```

상품 이름·수량·사진·무대 발표 여부는 이후 앱의 **상품 탭 → 수정**에서 바꾸면 됨 (배포 불필요).

---

## 사용법

| 누가 | 무엇을 | 어디서 |
|---|---|---|
| 관리자 | 뽑기권 지급/회수 (개인 · 팀 · 전원) | 관리 탭 |
| 관리자 | 팀 순위 지급 (1등팀~4등팀 한 번에) | 관리 탭 |
| 관리자 | 팀 일괄 배정 (`[1팀] 홍길동, 김철수` 붙여넣기) · 개인별 팀 변경 | 관리 탭 |
| 관리자 | 뽑기 열기/닫기 (닫혀 있으면 관리자 포함 아무도 못 뽑음) · 무대 화면 열기 | 관리 탭 |
| 관리자 | 상품 등록/수정 · 사진 주소 · 무대 발표 여부 · 수령 완료 표시 | 상품 탭 |
| 관리자 | 게임방 만들기 → 베팅 마감 → 승자 선택 / 방 취소·삭제 | 게임 탭 |
| 참가자 | 방에 1장 걸기 / 마감 전 취소 | 게임 탭 |
| 참가자 | 뽑기권 1장으로 복권 뽑기 → 탭을 오른쪽으로 밀어서 뜯기 | 뽑기 탭 |
| 모두 | 내 뽑기권 · 팀 현황 · 실시간 순위 | 현황 탭 |
| 모두 | 상품 목록 · 남은 수량 · 당첨자 | 상품 탭 |
| 참가자 / 관리자 | 본인 기록 / 전체 기록 | 기록 탭 |
| 무대 | 남은 복권 · 상품 현황 · 실시간 결과 · 당첨 발표 | `stage.html` |

## 상자 방식 뽑기

- 상자 전체 복권 수 = 모든 상품 수량의 합. 뽑을 때마다 남은 수에 비례한 확률로 1장 → 상품 수량이 정확히 맞아떨어짐
- 결과는 뽑는 순간 서버에서 정해지고, **무대에는 본인이 다 뜯었을 때** 공개
- 무대 발표가 꺼진 상품(예: 젤리)은 전체 화면 발표 없이 실시간 목록에만
- **고급 상품**(상품 탭 → 수정에서 체크)을 이미 받은 사람은 다음 뽑기에서 고급 상품이 빠짐. 단 일반 상품이 다 떨어지면 상자를 다 비우기 위해 고급 상품도 나옴

## 부정 방지

- **1기기 1이름**: 처음 입장한 기기에 이름이 연결 → 기기 바꾸면 관리자가 `기기 초기화`
- **한 방에 1장만**, **모든 처리는 서버 함수로만** (브라우저 조작으로 우회 불가)
- **정합성 검사**: 현황 탭에 `총 발행 = 보유 + 판돈 + 뽑기 사용` 상시 표시
- **거래 기록**: 참가자는 본인 것만, 관리자는 전체 (서버에서 제한)
- 관리자 코드 5회 틀리면 해당 참가자 잠김

## DB 초기화 쿼리 (SQL Editor)

**② 리허설 후 / 워크샵 직전 (추천)** — 상품 목록·사진은 유지, 수량만 처음으로:

```sql
truncate ticket_logs, ticket_bets, ticket_rooms, ticket_draws, ticket_secrets, ticket_players restart identity cascade;
update ticket_prizes set remaining = quantity;
update ticket_settings set value = 'false' where key = 'draw_open';
```

**① 상품까지 전부 지우기** — 이후 위의 "상품 넣기" 를 다시 실행:

```sql
truncate ticket_logs, ticket_bets, ticket_rooms, ticket_draws, ticket_secrets, ticket_players restart identity cascade;
truncate ticket_prizes restart identity cascade;
update ticket_settings set value = 'false' where key = 'draw_open';
```

관리자 코드는 어느 쪽이든 유지됨. 워크샵이 시작된 뒤에는 실행 금지.

### 관리자 코드 변경 / 잠김 해제

```sql
update ticket_config set value = '새코드' where key = 'admin_code';
update ticket_secrets set admin_fail = 0;  -- 잠김 해제
```

## 워크샵 전 체크리스트

- [ ] 전날 앱에 한 번 접속 (Supabase 무료 플랜은 7일 미사용 시 일시정지 → 대시보드에서 Restore)
- [ ] 폰 2대로 입장 → 지급 → 걸기 → 승자 선택 → 뽑기 리허설
- [ ] 무대 PC 에서 `stage.html` 열고 **소리 켜기** 클릭 + F 키 전체화면 (`?demo` 로 발표 화면 점검)
- [ ] 당일 장본 상품으로 이름·사진 수정 (상품 탭) → **뽑기 열기 전에** 확정
- [ ] QR 공유 직전 초기화 쿼리 ② 실행
