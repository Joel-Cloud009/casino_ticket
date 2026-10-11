# 대부도 워크샵 럭키 드로우 — Claude 작업 규칙

SC사업본부 2026 대부도 워크샵(10.15–16)용 뽑기 웹앱. 팀 게임은 오프라인, 앱은 뽑기권 지급·복권 뽑기·당첨 확인용 (게임방 탭은 숨김). 빌드 도구 없는 순수 HTML/CSS/JS + Supabase. 사용자와 대화는 한국어로.

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` + `app.js` + `style.css` | 메인 앱 (참가자 폰·관리자). 탭: 게임·현황·뽑기·상품·기록·관리 |
| `stage.html` | 무대(프로젝터) 화면. 로그인 없이 공개 데이터만 읽음. `?demo` 로 당첨 발표 미리보기 |
| `config.js` | Supabase URL + anon(publishable) 키. 공개돼도 되는 값. service_role 키는 절대 넣지 말 것 |
| `schema.sql` | DB 테이블·RLS·함수 전부. 여러 번 실행해도 안전(멱등). **데이터(상품 목록 등)는 넣지 말 것** |
| `prizes/` | 상품 사진 (DB `ticket_prizes.image_url` 에 `prizes/xxx.jpg` 로 연결) |
| `assets/` | 디자인 리소스 (Claude Design 제작, 2배 PNG). 목록·9-slice 값·들어갈 클래스는 `assets/README.md` |
| `print/` | 참가자용 QR·포스터 (사이트 주소 `workshopticket.netlify.app`) |
| `_mock*.html` | 가짜 데이터로 화면만 확인하는 테스트 페이지. `.gitignore` 됨 |

모든 쓰기는 `schema.sql` 의 `security definer` 함수(`ticket_*`)로만 한다. 클라이언트는 기기 토큰(`p_token`)을 넘기고, 서버가 관리자 여부·잔액·정합성을 검사한다. 테이블에 직접 쓰는 코드를 만들지 말 것.

## 작업 시작 시

`HANDOFF.md` 가 있으면 먼저 읽고 "이어서 할 일"을 사용자에게 요약해 준다. 특히 **배포 전 `schema.sql` 재실행 여부**를 확인한다.

## 브랜치와 배포 (중요)

- **작업 시작 전 항상** `git branch --show-current` 로 확인하고, `dev` 가 아니면 `git checkout dev` (없으면 `git checkout -b dev origin/dev`) 후 `git pull` 부터 한다. 사용자에게 따로 묻지 않아도 된다.
- Netlify 가 GitHub `main` 브랜치만 자동 배포한다. **push 한 번 = 배포 1회 = Netlify 크레딧 소모.**
- 평소 작업은 **`dev` 브랜치**에 커밋하고 `git push origin dev` (백업만, 배포 없음).
- **`main` 에는 사용자가 "배포하자/패치하자"고 할 때만** `dev` 를 머지해서 push 한다.
- GitHub **PR 을 만들지 말 것** (Netlify Deploy Preview 가 돌아서 크레딧 소모).
- 답변 끝에 "배포 대기 중인 수정 N개"(dev 가 main 보다 앞선 커밋 수)를 알려준다.

## schema.sql 을 바꿨을 때

1. 사용자에게 Supabase SQL Editor 에서 `schema.sql` 전체 재실행을 요청한다.
2. 재실행이 끝난 뒤에 앱 코드를 배포한다 (순서가 바뀌면 새 함수가 없어 오류).
3. 함수 인자를 바꿀 때는 기존 시그니처를 `drop function if exists` 로 지우고 `grant execute` 도 새 시그니처로 맞춘다.

## 확인 방법

- 로컬 미리보기: `python -m http.server 3950` (이 폴더에서) → `http://localhost:3950`. 실제 Supabase 에 연결되므로 실제 데이터가 바뀐다.
- 화면만 볼 때는 `_mock.html` 처럼 `window.supabase` 를 가짜로 바꾼 테스트 페이지를 만들어 쓴다 (커밋 안 됨).
- `node --check app.js` 로 문법 확인.

## 디자인 톤: 게임 로비 (2026-10-11~)

회사 게임 로비 톤 + 최근 콘텐츠 "Dragon Thunder Link" 컨셉. 리소스는 `assets/` (Claude Design), 적용 규칙은 `assets/README.md`.
- 바탕 `#0E004F`, 강조 금색 `#FFE652`, 주 버튼 초록 알약. 서체는 시스템 서체(굵게 800~900), 웹 서체 안 씀
- 부품은 9-slice PNG(`border-image`). `style.css` 맨 끝 "게임 로비 테마" 구역이 위쪽 기본 규칙을 덮어씀 (border-width 0 + 이미지 폭 지정 → 레이아웃은 그대로)
- 뽑기 연출 등급: 상품 목록 맨 위 = legend, 고급 상품 = epic, 무대 발표 상품 = rare, 나머지(젤리) = common. `app.js` 의 `FX`·`PARTICLES`·`CHARGE_MAX`, 결과 문구는 `TITLE_SET` ('short' / 'game')
- 이모지 대신 `assets/icons/` 이미지. 팀 색 4개는 명도까지 다르게 (`TEAM_COLORS`). 티켓 안 글자는 가로 한 줄(줄바꿈 금지)
- 등급 글자(A상 등)는 데이터에서 넣음. 이미지나 CSS `content` 로 박지 말 것
