# 🎰 뽑기권 카지노 — 설치 가이드

참가자는 **링크만 열고 이름 입력**하면 끝. 아래는 주최자만 하면 됩니다. (약 10분)

## 1. Supabase 준비

1. [supabase.com/dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
   - 새로 만들기 권장 (`New project`, 리전은 **Northeast Asia (Seoul)**)
   - 기존 "유저 문의 검색기" 프로젝트를 써도 됩니다. 모든 테이블/함수가 `ticket_` 으로 시작해서 겹치지 않아요.
3. 왼쪽 메뉴 **SQL Editor** → `schema.sql` 내용 전체 붙여넣기
4. **붙여넣은 SQL 에서 `'CHANGE_ME'` 를 원하는 관리자 코드로 변경** (6자 이상, 추측 어렵게)
5. **Run** 클릭 → `Success` 확인

## 2. 앱 설정

1. Supabase **Project Settings → API** (또는 **Data API / API Keys**) 에서 복사
   - Project URL (`https://xxxx.supabase.co`)
   - `anon` `public` 키 (또는 `sb_publishable_...` 키)
2. `config.js` 의 두 값을 교체

> ⚠️ `service_role` / `secret` 키는 절대 넣지 마세요.

## 3. 배포 (Netlify Drop)

1. [app.netlify.com](https://app.netlify.com) 에 로그인 (GitHub/Google 가능 — 로그인 안 하면 사이트가 곧 삭제됨)
2. [app.netlify.com/drop](https://app.netlify.com/drop) 에 **`ticket_casino` 폴더째 드래그**
   (schema.sql 도 함께 공개되므로 관리자 코드가 보일 수 있음)
3. 생성된 주소(`https://xxxx.netlify.app`)를 참가자에게 공유 (QR 코드로 만들면 편해요)
   - Site configuration → Change site name 에서 주소 이름 변경 가능

수정 후 재배포: 사이트 → **Deploys** 탭 → `ticket_casino` 폴더 다시 드래그

## 4. 첫 관리자 되기

1. 앱 접속 → 이름 입력해서 입장
2. **현황판** 탭 맨 아래 `관리자 코드 입력` → 1단계에서 정한 코드 입력
3. 이후 다른 사람은 **관리** 탭에서 `관리자 지정` 버튼으로 권한 부여

## 사용법

| 누가 | 무엇을 | 어디서 |
|---|---|---|
| 관리자 | 뽑기권 지급/회수 (개인 · 팀 · 전원) | 관리 탭 |
| 관리자 | 🏆 팀 순위 지급 (1등팀~4등팀 한 번에) | 관리 탭 |
| 관리자 | 팀 일괄 배정 (`[1팀] 홍길동, 김철수` 붙여넣기) · 개인별 팀 변경 | 관리 탭 |
| 관리자 | 뽑기 열기/닫기 · 무대 화면 열기 | 관리 탭 |
| 관리자 | 상품 등록/수정 (꽝 포함) · 수령 완료 표시 | 상품 탭 |
| 참가자 | 뽑기권 1장으로 복권 뽑기 → 탭을 밀어서 뜯기 | 뽑기 탭 |
| 모두 | 상품 목록 · 남은 수량 · 당첨자 | 상품 탭 |
| 무대 | 남은 복권 수 · 상품 현황 · 실시간 결과 · 당첨 발표 | `stage.html` (PC/프로젝터) |
| 관리자 | 게임방 만들기 → 베팅 마감 → 🏆 승자 선택 | 게임방 탭 |
| 관리자 | 방 취소 (건 사람 전원 환불) | 게임방 탭 |
| 참가자 | 방에 1장 걸기 / 마감 전 취소 | 게임방 탭 |
| 모두 | 전원 보유량 실시간 확인 | 현황판 탭 |
| 참가자 | 본인 거래 기록 확인 | 기록 탭 |
| 관리자 | 전체 거래 기록 확인 | 기록 탭 |

## 부정 방지 장치

- **1기기 1이름**: 처음 입장한 기기에 이름이 연결됨. 다른 사람이 같은 이름으로 입장 불가.
  폰을 바꿨거나 브라우저 데이터를 지웠다면 → 관리자가 `기기 초기화` 후 재입장.
- **한 방에 1장만**: DB 제약으로 강제 (버튼 연타·동시 요청해도 불가)
- **모든 처리는 서버에서**: 잔액 변경은 DB 함수로만 가능 → 브라우저 조작으로 우회 불가
- **정합성 검사**: 현황판에 `총 발행 = 보유 합계 + 걸린 판돈 + 뽑기 사용` 이 항상 표시. 다르면 빨간 경고.
- **거래 기록**: 모든 지급·베팅·정산·삭제가 기록됨. 참가자는 본인 기록만, 관리자는 전체 기록을 볼 수 있음 (서버에서 제한)
- 관리자 코드 5회 틀리면 해당 참가자는 잠김 (기록에도 남음)

## 워크샵 전 체크리스트

- [ ] **전날 앱에 한 번 접속** (무료 플랜은 7일 미사용 시 일시정지 → 대시보드에서 Restore)
- [ ] 폰 2대로 입장 → 지급 → 걸기 → 승자 선택 → 뽑기 리허설
- [ ] 무대 PC 에서 `stage.html` 열고 **🔊 소리 켜기** 한 번 클릭 + F 키로 전체화면
- [ ] 리허설 데이터 초기화 (SQL Editor 에서 실행). 상품 목록·관리자 코드는 유지, 상품 수량은 처음으로:

```sql
truncate ticket_logs, ticket_bets, ticket_rooms, ticket_draws, ticket_secrets, ticket_players restart identity cascade;
update ticket_prizes set remaining = quantity;
update ticket_settings set value = 'false' where key = 'draw_open';
```

## 상자 방식 뽑기

- 상자 전체 복권 수 = 모든 상품 수량의 합 (꽝 포함). 예: A상 1 + B상 3 + C상 10 + 꽝 86 = 100장
- 뽑을 때마다 남은 수에 비례한 확률로 1장이 나옴 → 상품 수량이 정확히 맞아떨어짐
- 결과는 뽑는 순간 서버에서 정해지지만, **무대 화면에는 본인이 다 뜯었을 때** 공개됨
- 뜯기 전에 앱을 닫아도 다음에 열면 이어서 뜯기

## 관리자 코드 변경 / 잠김 해제 (SQL Editor)

```sql
update ticket_config set value = '새코드' where key = 'admin_code';
update ticket_secrets set admin_fail = 0;  -- 잠김 해제
```
