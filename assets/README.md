# 대부도 워크샵 럭키 드로우 · 디자인 리소스

게임 로비 톤(기본) + Dragon Thunder Link 컨셉(뽑기·당첨·무대·포스터) PNG 리소스 묶음입니다.
`code/style.css` · `code/stage.html` 의 **클래스 이름 그대로** 쓰도록 정리했습니다. 처음엔 `_preview/demo.html` 을 열어 조립 예시를 보세요.

## 규칙

- **2배 해상도.** CSS 크기는 파일 크기의 절반입니다 (표의 "CSS 크기").
- **글자는 리소스에 없음.** 버튼 글자, 등급 이름(1등·2등…), 상품명, 사람 이름은 전부 HTML 글자(시스템 서체)로 올립니다. 결과 문구 로고(`fx/title-*`)와 앱 아이콘·포스터만 글자가 그려져 있습니다.
- **9-slice 이미지**는 표의 값으로 `border-image` 를 씁니다. 값은 2배 px 이고, CSS border 폭은 그 절반입니다.

```css
/* 예: 주 버튼 (slice 62 64 → border 31px 32px) */
.btn.gold {
  border-style: solid; border-width: 31px 32px; padding: 0; height: 62px;
  border-image: url(assets/buttons/btn-primary.png) 62 64 fill / 31px 32px stretch;
  background: none; box-shadow: none;
}
/* 예: 카드 (slice 60 → border 30px) */
.card { border-style: solid; border-width: 30px; padding: 0;  /* 안쪽 여백은 border 가 대신함 */
  border-image: url(assets/panels/card.png) 60 fill / 30px stretch; background: none; }
```
- `fill` 이 있는 것은 몸통까지 이미지가 채웁니다 → 기존 `background`·`box-shadow` 는 지워 주세요.
- **가운데가 투명한 액자**(`panels/photo-frame`, `ticket/ticket-window-frame`, `stage/stage-photo-frame`)는 `fill` 없이 `::after` 로 사진 위에 겹칩니다.
- 버튼 높이는 이미지 그대로 **62px** (그림자·두께 포함, 눌리는 몸통 48px + 아래 두께). 터치 영역 44px 이상 충족.
- 용량: 화면 배경과 무대 발표 배경은 **`.webp` 를 쓰세요** (14~42KB). PNG 원본은 200KB를 넘습니다.
- 포스터(2.5MB)는 인쇄용이라 페이지에 올리지 않습니다.

## 뽑기 연출 · 등급별 사용표 (요청서 4-1장)

| 단계 | 전설 `fx-legend` | 영웅 `fx-epic` | 희귀 `fx-rare` | 일반 `fx-common` |
|---|---|---|---|---|
| ① 긁기 시작: 뜯는 선 빛 | `tear-glow-legend` | `tear-glow-epic` | `tear-glow-rare` | 없음 |
| ① 티켓 뒤 오라 `--fx-aura-img` | `aura-legend` | `aura-epic` | `aura-rare` | 없음 |
| ① 광선 `--fx-rays-img` | `rays-gold` | `rays-magenta` | `rays-blue` | 없음 |
| ② 고조 (번개) | `charge-1→2→3` | `charge-1→2` | `charge-1` | 없음 |
| ③ 당첨 문구 `.fx-title` | `title-jackpot` (게임판 `title-grand-jackpot`) | `title-big-win` (`title-major-jackpot`) | `title-nice` (`title-awesome`) | 없음 (지금처럼) |
| ③ 파티클 `.coin` | `coin-w` + `coin-w-tilt` + `gem-red` + `spark` | `coin-w` + `gem-magenta` + `spark` | `coin-w` + `gem-blue` | `coin-w` 12개 (지금처럼) |
| ③ 꽃가루 `.confetti` | gold·red·magenta·purple | magenta·gold·purple | 없음 | 없음 |
| ③ 번쩍임 | `flash-legend` | `flash-epic` | 없음 | 없음 |
| ④ 다른 사람 배너 | `win-banner-legend` + `title-jackpot` | `win-banner-epic` + `title-big-win` | (배너 없음) | — |
| ⑤ 홈 최근 당첨 줄 | `list-row-legend` | `list-row-epic` | `list-row` | `list-row` |
| ⑥ 무대 발표 배경 | `announce-bg-legend` + `rays-gold` | `announce-bg-epic` + `rays-magenta` | `announce-bg-rare` + `rays-blue` | 발표 없음 |
| ⑥ 무대 문구 | `title-jackpot` | `title-big-win` | `title-congratulations` | — |

### 움직임 설명 (CSS 로 구현)

- **뜯는 선 빛** (`tear-glow-*`): `.pt-cover` 왼쪽 끝에 붙임. 80×300 CSS, `left:-40px`. `opacity = --p` (뜯은 정도). 0.9초 주기로 opacity 0.75↔1 깜빡임 (번쩍임 아님, 부드럽게).
- **오라**: 지금 코드 그대로 (`opacity: --p × --fx`, `scale .75 → 1.2`). 크기 `.pt-aura` inset -70px → 이미지 400×400 CSS.
- **광선**: 지금 코드 그대로 회전 (9초 → 다 뜯으면 3초). 이음매 없는 24줄 방사형이라 어느 각도에서도 이어집니다.
- **고조 번개** (`charge-1/2/3`): 티켓 뒤 새 층 `.pt-charge` (450×550 CSS, 티켓 중앙 정렬). `--p` 구간마다 이미지 교체: 0.15 / 0.45 / 0.75. 단계가 바뀔 때 0.12초 동안 opacity 0→1 + scale 1.04→1. 번개는 0.18초마다 `scaleX(-1)` 와 원래 모양을 번갈아 보여 지직거리게. 전설만 3단계까지.
- **당첨 순간** (다 뜯은 직후, 전설 기준 총 약 2.4초):
  1. 0.00초 `flash-legend` 화면 가운데, 0→1→0 (1.1초, 지금 `fx-flash`). 1초에 3번 이상 번쩍이지 않음.
  2. 0.05초 오라 크게 (지금 `fx-burst`), 광선 2.5초 주기로 빨라짐.
  3. 0.10초 파티클 110개 터짐 (지금 `coin` 애니메이션), 이미지 4종을 무작위로. 크기 24~36px.
  4. 0.25초 결과 문구 로고: `scale .3 → 1.12 → 1`, `rotate -6° → 0` (0.7초). 이후 1.6초 주기로 `brightness 1 → 1.25`.
  5. 0.40초 꽃가루 110개 위에서 떨어짐 (지금 `fx-fall`), 이미지 6종 무작위, 회전.
- **영웅**: 위와 같고 파티클·꽃가루 60, 문구 `title-big-win`, 반짝임 없음.
- **희귀**: 번쩍임·꽃가루 없음, 파티클 30, 문구 `title-nice` 작게(현재 22px → 이미지 폭 180px).
- **무대 발표**: 배경 이미지 깔고 그 위에 `rays-*` 회전(전설 7초 / 영웅 14초 / 희귀 24초), 사진은 `stage-photo-frame` 액자. 문구 로고 폭: 전설 900px, 영웅 760px, 희귀(`CONGRATULATIONS`) 1000px. 코인 비는 `coin-w` + 보석 섞기.

## 토큰 (CSS 변수 이름은 지금 그대로)

| 변수 | 값 | 출처 |
|---|---|---|
| `--bg` | `#0E004F` | [측정] 로비 상단 바 |
| `--surface` | `#1F0B55` | [측정] 로비 하단 메뉴 |
| `--surface-2` | `#401692` | [측정] EVENT HUB 탭 |
| `--line` | `rgba(201,184,240,.16)` | [추정] |
| `--line-2` | `#8948C7` | [측정] EVENT HUB 탭 하이라이트 |
| `--text` | `#FFFFFF` | [측정] |
| `--muted` | `#C9B8F0` | [추정] surface 위 9.4:1 |
| `--dim` | `#A894D8` | [추정] surface 위 6.4:1 |
| `--gold` | `#FFE652` | [측정] 잭팟 숫자 |
| `--gold-ink` | `#3A1A00` | [추정] gold 위 12.6:1 |
| `--green` | `#62D22F` | [측정] BUY 버튼 |
| `--red` | `#FF6B6B` (글자) / `#EC3310` (면) | [추정] / [측정] 알림 배지 |
| `--blue` | `#4DB3FF` | [추정] |
| 팀 1~4 `TEAM_COLORS` | `#FF4A5C` `#4DB3FF` `#7FE85A` `#FFE14D` | [추정] 밝기 차례로 증가 (OKLab L .67/.74/.84/.91) |
| `--num`, body 서체 | 시스템 서체 `system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif` | 요청대로 |

## 추정한 값 목록

원본 가이드·Figma·버튼 원본이 없어서 아래는 캡처를 보고 만든 값입니다.

- 모든 버튼·패널의 **입체 표현**(빛 방향 왼쪽 위, 테 두께, 아래 두께 12px@2x, 그림자)
- 모서리 둥글기: 카드 20px, 입력칸 14px, 등급 배지 7px, 버튼 완전 둥근 알약
- 글자색 `muted`·`dim`, 구분선 `line`
- 팀 4색 전부 (색약 고려해 새로 정함)
- 결과 문구 로고 서체 (Rye, OFL 웹 서체로 근사. 게임 원본 레터링 아님)
- 등급별 색 대응: 전설=빨강+금, 영웅=자홍, 희귀=파랑
- 고조 단계 경계값 0.15 / 0.45 / 0.75, 연출 시간표
- 측정값도 압축된 캡처라 ±몇 단계 오차 가능

## 새로 필요한 원화 (아트팀)

지금 리소스로도 쓸 수는 있지만, 레퍼런스 수준을 원하면 아래는 원화로 교체를 권합니다.

1. **결과 문구 로고 3~6종** — GRAND/MAJOR JACKPOT, AWESOME 원본 레터링 PNG (지금 `fx/title-*` 자리 그대로 교체)
2. **W 동전 원본** — 게임 동전 PNG가 있으면 `fx/particles/coin-w*.png` 교체
3. **번개 이펙트 원본** — 번개 테 패널·고조 번개 (`fx/charge-*`, `panel-thunder` 모서리)
4. **잭팟 휠 프레임 원본** — 티켓 테두리(`ticket-frame`)를 휠 프레임 질감으로
5. **드래곤 일러스트**(선택) — 무대 발표 전설 배경에 크게
6. 게임 효과음 mp3/ogg (요청서 범위 밖)

## 리소스 전체 목록

### buttons/ — 버튼

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `btn-danger-pressed.png` | 260×124 | 130×62 | 13 | 62 64 fill | .btn.red:active |
| `btn-danger.png` | 260×124 | 130×62 | 13 | 62 64 fill | .btn.red (회수·삭제·닫기) |
| `btn-disabled.png` | 260×124 | 130×62 | 13 | 62 64 fill | .btn:disabled, .btn.gold:disabled |
| `btn-primary-pressed.png` | 260×124 | 130×62 | 13 | 62 64 fill | .btn.gold:active, .btn.draw-btn:active |
| `btn-primary.png` | 260×124 | 130×62 | 14 | 62 64 fill | .btn.gold, .btn.draw-btn, .hero-actions .btn.gold, 순위대로 지급·지급·팀 적용 |
| `btn-round-secondary.png` | 112×124 | 56×62 | 12 |  | 아이콘만 있는 둥근 버튼 (.admin-actions .btn.sm[aria-label] 등). 고정 크기 56×62 |
| `btn-secondary-pressed.png` | 260×124 | 130×62 | 13 | 62 64 fill | .btn.ghost:active |
| `btn-secondary.png` | 260×124 | 130×62 | 14 | 62 64 fill | .btn.ghost, .btn (기본), 관리 도구 막대의 버튼 |

### panels/ — 패널·카드·입력칸·탭바

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `avatar-ring-team-1.png` | 112×112 | 56×56 | 19 |  | .avatar (1팀). 56×56 background, 글자는 HTML |
| `avatar-ring-team-2.png` | 112×112 | 56×56 | 20 |  | .avatar (2팀). 56×56 background, 글자는 HTML |
| `avatar-ring-team-3.png` | 112×112 | 56×56 | 21 |  | .avatar (3팀). 56×56 background, 글자는 HTML |
| `avatar-ring-team-4.png` | 112×112 | 56×56 | 20 |  | .avatar (4팀). 56×56 background, 글자는 HTML |
| `balance-box.png` | 160×100 | 80×50 | 6 | 48 50 fill | .me-balance |
| `card-hero.png` | 240×240 | 120×120 | 81 | 70 fill | .hero, .pz.featured |
| `card.png` | 200×200 | 100×100 | 54 | 60 fill | .card, .team-bars, #rooms-done |
| `input-focus.png` | 172×124 | 86×62 | 11 | 46 fill | .input:focus |
| `input.png` | 160×112 | 80×56 | 5 | 40 fill | .input, select.input, textarea.input |
| `list-row-epic.png` | 180×140 | 90×70 | 36 | 50 fill | .lb-row.tier-epic |
| `list-row-legend.png` | 190×150 | 95×75 | 39 | 54 fill | .lb-row.tier-legend |
| `list-row.png` | 160×120 | 80×60 | 28 | 40 fill | .lb-row, .pz (일반 상품 카드) |
| `panel-thunder.png` | 300×300 | 150×150 | 108 | 84 fill | 컨셉 패널 공통 (.ws-banner 테두리 등) |
| `photo-frame.png` | 160×160 | 80×80 | 7 | 40 fill | .pz-img, .draw-emoji 위에 겹치는 금테 (가운데 투명) |
| `tab-active.png` | 140×132 | 70×66 | 14 |  | .tab.active 배경 (고정 70×66, background-size:100% 100%) |
| `tabbar.png` | 240×172 | 120×86 | 53 | 64 fill | .tabbar |
| `toast-error.png` | 200×112 | 100×56 | 30 | 52 fill | .toast.error |
| `toast.png` | 200×112 | 100×56 | 30 | 52 fill | .toast |
| `win-banner-epic.png` | 300×300 | 150×150 | 107 | 84 fill | .win-banner (영웅) |
| `win-banner-legend.png` | 300×300 | 150×150 | 107 | 84 fill | .win-banner.tier-legend |
| `win-banner-rare.png` | 300×300 | 150×150 | 108 | 84 fill | .win-banner (기본·희귀) |

### badges/ — 배지

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `count-badge.png` | 52×52 | 26×26 | 3 |  | 선택: 알림 숫자 배경 26×26 |
| `grade-plate-dim.png` | 120×72 | 60×36 | 4 | 24 fill | 품절 상품의 .grade |
| `grade-plate.png` | 120×72 | 60×36 | 4 | 24 fill | .grade, .pz.featured .grade, 무대 .p-grade (글자는 시스템 서체로 HTML) |
| `hot-ribbon.png` | 120×64 | 60×32 | 5 |  | 선택: 새 당첨 표시. 고정 60×32 |
| `premium-ribbon.png` | 180×64 | 90×32 | 3 | 30 24 fill | .badge.premium ("1인 1개") |
| `stamp-soldout.png` | 300×130 | 150×65 | 33 |  | .pz.soldout .pz-img::after, 무대 .prize.soldout .p-emoji::after (150×65) |
| `state-dot-open.png` | 28×28 | 14×14 | 2 |  | .ds-state i, .live-dot.on (14×14) |
| `state-open.png` | 120×64 | 60×32 | 9 | 30 34 fill | .ds-state (열림), 무대 .status.open |
| `state-wait.png` | 120×64 | 60×32 | 5 | 30 34 fill | .ds-state (닫힘), 무대 .status |
| `team-chip-1.png` | 120×64 | 60×32 | 8 | 30 34 fill | .badge.team (1팀), 무대 .team |
| `team-chip-2.png` | 120×64 | 60×32 | 8 | 30 34 fill | .badge.team (2팀), 무대 .team |
| `team-chip-3.png` | 120×64 | 60×32 | 9 | 30 34 fill | .badge.team (3팀), 무대 .team |
| `team-chip-4.png` | 120×64 | 60×32 | 8 | 30 34 fill | .badge.team (4팀), 무대 .team |

### bars/ — 막대

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `bar-fill-gold.png` | 120×32 | 60×16 | 2 | 14 18 fill | .ds-bar i, 무대 .counter .bar i |
| `bar-fill-team-1.png` | 120×32 | 60×16 | 2 | 14 18 fill | .team-bar .bar i (1팀) |
| `bar-fill-team-2.png` | 120×32 | 60×16 | 2 | 14 18 fill | .team-bar .bar i (2팀) |
| `bar-fill-team-3.png` | 120×32 | 60×16 | 2 | 14 18 fill | .team-bar .bar i (3팀) |
| `bar-fill-team-4.png` | 120×32 | 60×16 | 2 | 14 18 fill | .team-bar .bar i (4팀) |
| `bar-track.png` | 120×40 | 60×20 | 2 | 18 20 fill | .ds-bar, .team-bar .bar, 무대 .counter .bar |

### icons/ — 아이콘

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `icon-arrow.png` | 48×48 | 24×24 | 2 |  | .pt-tab 화살표 |
| `icon-check.png` | 48×48 | 24×24 | 6 |  | .integrity.ok |
| `icon-draw.png` | 48×48 | 24×24 | 3 |  | 버튼 안 티켓 아이콘 / 기록 "복권 뽑기" (🎟️ 대체) |
| `icon-give.png` | 48×48 | 24×24 | 4 |  | 기록 "지급" (🎁 대체) |
| `icon-join.png` | 48×48 | 24×24 | 4 |  | 기록 "입장" (👋 대체) |
| `icon-stage.png` | 48×48 | 24×24 | 4 |  | "무대 화면 열기" (📺 대체) |
| `icon-team.png` | 48×48 | 24×24 | 5 |  | 기록 "팀 배정", 관리 "팀 일괄 배정" |
| `icon-trophy.png` | 48×48 | 24×24 | 5 |  | 관리 "팀 순위 지급" (🏆 대체) |
| `tab-admin-off.png` | 48×48 | 24×24 | 3 |  | .tab — 관리 아이콘 24×24 |
| `tab-admin-on.png` | 48×48 | 24×24 | 6 |  | .tab .active — 관리 아이콘 24×24 |
| `tab-draw-off.png` | 48×48 | 24×24 | 2 |  | .tab — 뽑기 아이콘 24×24 |
| `tab-draw-on.png` | 48×48 | 24×24 | 3 |  | .tab .active — 뽑기 아이콘 24×24 |
| `tab-home-off.png` | 48×48 | 24×24 | 2 |  | .tab — 홈 아이콘 24×24 |
| `tab-home-on.png` | 48×48 | 24×24 | 5 |  | .tab .active — 홈 아이콘 24×24 |
| `tab-logs-off.png` | 48×48 | 24×24 | 1 |  | .tab — 기록 아이콘 24×24 |
| `tab-logs-on.png` | 48×48 | 24×24 | 3 |  | .tab .active — 기록 아이콘 24×24 |
| `tab-prizes-off.png` | 48×48 | 24×24 | 2 |  | .tab — 상품 아이콘 24×24 |
| `tab-prizes-on.png` | 48×48 | 24×24 | 4 |  | .tab .active — 상품 아이콘 24×24 |

### ticket/ — 복권 티켓

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `ticket-cover-pattern.png` | 80×48 | 40×24 | 2 |  | .pt-cover-bg 반복 무늬 (background-size: 40px 24px, repeat). 늘어나도 안 깨짐 |
| `ticket-cover-shade.png` | 560×600 | 280×300 | 65 |  | .pt-cover-bg 위 그늘 (100% 100%) |
| `ticket-diamond.png` | 64×64 | 32×32 | 2 |  | 선택: 티켓 좌우 가운데 장식 32×32 |
| `ticket-frame.png` | 400×400 | 200×200 | 74 | 100 fill | .pt-card (테두리+남색 몸통, border-image fill) |
| `ticket-paper.png` | 560×600 | 280×300 | 74 |  | .pt-prize 배경 (background-size: cover) |
| `ticket-tab.png` | 84×600 | 42×300 | 7 |  | .pt-tab (42px × 100%) |
| `ticket-tear-line.png` | 16×40 | 8×20 | 1 |  | .pt-cover border-left 대신 세로 반복 (repeat-y, 8×20) |
| `ticket-window-frame.png` | 600×640 | 300×320 | 20 | 56 fill | .pt-window 위에 겹치는 금테 (가운데 투명, ::after) |

### fx/ — 뽑기 연출

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `aura-epic.png` | 800×800 | 400×400 | 137 |  | .pt-card.fx-epic → --fx-aura-img |
| `aura-legend.png` | 800×800 | 400×400 | 126 |  | .pt-card.fx-legend → --fx-aura-img |
| `aura-rare.png` | 800×800 | 400×400 | 141 |  | .pt-card.fx-rare → --fx-aura-img |
| `charge-1.png` | 900×1100 | 450×550 | 178 |  | 고조 1단계 (--p 0.15~0.45) .pt-charge 새 층 |
| `charge-2.png` | 900×1100 | 450×550 | 93 |  | 고조 2단계 (--p 0.45~0.75) |
| `charge-3.png` | 900×1100 | 450×550 | 112 |  | 고조 3단계 (--p 0.75~1) |
| `confetti/confetti-blue.png` | 32×32 | 16×16 | 1 |  | .confetti (background-image로, --c 대신) |
| `confetti/confetti-gold.png` | 56×32 | 28×16 | 2 |  | .confetti (background-image로, --c 대신) |
| `confetti/confetti-green.png` | 56×32 | 28×16 | 2 |  | .confetti (background-image로, --c 대신) |
| `confetti/confetti-magenta.png` | 56×32 | 28×16 | 2 |  | .confetti (background-image로, --c 대신) |
| `confetti/confetti-purple.png` | 32×32 | 16×16 | 2 |  | .confetti (background-image로, --c 대신) |
| `confetti/confetti-red.png` | 32×32 | 16×16 | 1 |  | .confetti (background-image로, --c 대신) |
| `flash-epic.png` | 750×750 | 375×375 | 69 |  | .fx-flash-epic |
| `flash-legend.png` | 750×750 | 375×375 | 65 |  | .fx-flash-legend |
| `particles/coin-w-tilt.png` | 96×96 | 48×48 | 7 |  | .coin (옆으로 도는 프레임, 섞어 쓰기) |
| `particles/coin-w.png` | 96×96 | 48×48 | 12 |  | .coin → --fx-coin-img (기본), .me-balance 아이콘 |
| `particles/gem-blue.png` | 80×80 | 40×40 | 8 |  | .coin 희귀에 섞기 |
| `particles/gem-magenta.png` | 80×80 | 40×40 | 8 |  | .coin 영웅에 섞기 |
| `particles/gem-red.png` | 80×80 | 40×40 | 7 |  | .coin 전설에 섞기 |
| `particles/spark-blue.png` | 64×64 | 32×32 | 4 |  | 긁는 중 번개 주변 반짝임 |
| `particles/spark.png` | 64×64 | 32×32 | 4 |  | 당첨 순간 반짝임, 배너 별 |
| `rays-blue.png` | 1000×1000 | 500×500 | 96 |  | --fx-rays-img (희귀), 무대 .an-rays |
| `rays-gold.png` | 1000×1000 | 500×500 | 94 |  | --fx-rays-img (전설), 무대 #announce.tier-legend .an-rays |
| `rays-magenta.png` | 1000×1000 | 500×500 | 96 |  | --fx-rays-img (영웅), 무대 .tier-epic .an-rays |
| `tear-glow-epic.png` | 160×600 | 80×300 | 69 |  | .pt-cover 왼쪽 끝 빛 (영웅) |
| `tear-glow-legend.png` | 160×600 | 80×300 | 66 |  | .pt-cover 왼쪽 끝 빛 (전설) |
| `tear-glow-rare.png` | 160×600 | 80×300 | 67 |  | .pt-cover 왼쪽 끝 빛 (희귀) |
| `title-awesome.png` | 900×240 | 450×120 | 168 |  | 게임 문구 버전: 희귀 |
| `title-big-win.png` | 860×240 | 430×120 | 177 |  | .res-epic .fx-title, .win-banner .wb-label (영웅) |
| `title-congratulations.png` | 1400×220 | 700×110 | 53 |  | 무대 #announce.tier-rare .an-congrats |
| `title-grand-jackpot.png` | 900×330 | 450×165 | 62 |  | 게임 문구 버전: 전설 |
| `title-jackpot.png` | 900×260 | 450×130 | 55 |  | .res-legend .fx-title (지금 문구), .win-banner.tier-legend .wb-label |
| `title-major-jackpot.png` | 900×330 | 450×165 | 62 |  | 게임 문구 버전: 영웅 |
| `title-nice.png` | 600×220 | 300×110 | 107 |  | .res-rare .fx-title |

### backgrounds/ — 배경

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `bg-mobile.png` | 750×1624 | 375×812 | 249 |  | body (모바일). WebP 권장 |
| `bg-mobile.webp` | 750×1624 | 375×812 | 15 |  | body (모바일) — 14KB |
| `bg-stage.png` | 1920×1080 | 960×540 | 382 |  | 무대 body |
| `bg-stage.webp` | 1920×1080 | 960×540 | 25 |  | 무대 body — 24KB |

### banner/ — 워크샵 배너

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `ws-banner-bg.png` | 702×380 | 351×190 | 65 |  | .ws-banner 배경 (.ws-art 대신). 글자는 HTML |

### stage/ — 무대

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `announce-bg-epic.png` | 1920×1080 | 960×540 | 340 |  | #announce.tier-epic |
| `announce-bg-epic.webp` | 1920×1080 | 960×540 | 43 |  | 〃 WebP |
| `announce-bg-legend.png` | 1920×1080 | 960×540 | 348 |  | #announce.tier-legend |
| `announce-bg-legend.webp` | 1920×1080 | 960×540 | 43 |  | 〃 WebP |
| `announce-bg-rare.png` | 1920×1080 | 960×540 | 327 |  | #announce (희귀) |
| `announce-bg-rare.webp` | 1920×1080 | 960×540 | 33 |  | 〃 WebP |
| `stage-feed-row-big.png` | 160×120 | 80×60 | 30 | 34 fill | 무대 .feed-item.big |
| `stage-feed-row.png` | 140×100 | 70×50 | 21 | 28 fill | 무대 .feed-item |
| `stage-header-panel.png` | 240×160 | 120×80 | 57 | 48 fill | 무대 .feed / .counter 묶음 패널 |
| `stage-photo-frame.png` | 300×300 | 150×150 | 106 | 90 fill | 무대 .an-emoji .photo 둘레 액자 (가운데 투명) |
| `stage-prize-panel-first.png` | 180×180 | 90×90 | 47 | 48 fill | 무대 .prize.first |
| `stage-prize-panel.png` | 160×160 | 80×80 | 35 | 40 fill | 무대 .prize |

### app-icon/ — 앱 아이콘

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `apple-touch-icon.png` | 180×180 | 90×90 | 31 |  | apple-touch-icon.png |
| `icon-192.png` | 192×192 | 96×96 | 34 |  | icon-192.png |
| `icon-512.png` | 512×512 | 256×256 | 165 |  | icon-512.png |

### poster/ — 포스터

| 파일 | 2배 크기 | CSS 크기 | KB | 9-slice (2배 px) | 들어갈 곳 |
|---|---|---|---|---|---|
| `poster-a4.png` | 2480×3508 | 1240×1754 | 2530 |  | 인쇄 A4 300dpi. QR 자리 흰 칸(820×820px)에 기존 QR 얹기 |

---
`manifest.json` 에 같은 내용(크기, 9-slice, 들어갈 곳)이 기계용으로 들어 있습니다.
