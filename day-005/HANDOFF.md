# Day 005 — 취향 너머의 음악을 발견하는 법

## 작품 개요
- **텍스트**: "취향 너머의 음악을 발견하는 법"
- **원본 소스**: ANTIEGG 뉴스레터 (https://antiegg.kr/34050)
- **컨셉**: 스크롤형 악보 · 음표↔사람 실루엣 모프 · 오케스트라 사운드
- **인터랙션**: 자동 재생 + 클릭 시작

## 핵심 컨셉
오선 위 음표가 악장이 진행됨에 따라 점점 사람 실루엣으로 변하고, 각자 취미 활동 포즈를 취함. 스마트폰 알고리즘에 갇힌 취향에서 낯선 음악의 세계로 탈출하는 메타포.

## 6개 악장 구조
모든 악장은 Bach "Prelude in C major" BWV 846의 하모니 진행을 뼈대로 변주:

| Movement | 성격 | 가사 (paraphrase) |
|----------|------|-------------------|
| I. Andante (dolce, ♩=96) | 원형 아르페지오 | 듣던 노래만 매일 반복해 / 알고리즘이 고른 노래 |
| II. Moderato (cantabile) | 리듬 변형 | 비슷한 멜로디 비슷한 리듬 / 익숙함에 갇혀 |
| III. Lento (sognando, 3/4) | 왈츠 재편 | 취향은 점점 좁아지는데 / 새로움은 어디 |
| IV. Misterioso (espressivo) | 반음 장식, 몽환 | 낯선 세계로 발걸음을 떼어봐 |
| V. Vivace (con brio) | 래그타임 싱코페이션 | 텍스트로 탐험하고 지도를 돌려 |
| VI. Maestoso (trionfale, ff) | 피날레 | 취향 너머의 음악을 / 발견하는 / 법 |

## 사람 실루엣 30종
덩어리진 블랙 실루엣 SVG path (Nantes 합창단 포스터 스타일):
서기/걷기/달리기/점프(높이+옆)/자전거/요가(나무,전사,코브라)/공중회전/서핑/스케이트/기타/바이올린/피아노/드럼/발레 그랑제테/탱고/힙합/훌라후프/등반/낚시/골프/축구킥/배구 스파이크/등산/스쿼트/쉐프/명상/낙하산(피날레 전용)

## 5단계 인터랙션 흐름
1. 첫 화면: Movement I만 노출
2. 클릭/스크롤/키 입력으로 시작
3. 자동 스크롤 + 악장별 멜로디 순차 재생
4. 다음 줄 악보가 현재 재생 중에 페이드인 (긴장감)
5. 마지막 Movement VI 재생 후 악보에서 멈춤

## 인터랙션 디테일
- 음표 재생 시 해당 실루엣이 튕김 (spin/bigjump/wiggle/tilt/bounce — 포즈별 자동 매칭)
- 가사도 음표와 함께 40ms 지연으로 작게 튕김
- 호버 시 살짝 움직임 (소리 X, 멜로디와 충돌 방지)

## 사운드 (Web Audio API)
- 일반 악장: triangle/sine 피아노 톤
- **피날레(Movement VI)**: 오케스트라 레이어
  - 스트링 (sine + 5.2Hz 비브라토)
  - 브라스 (sawtooth 한 옥타브 아래 + 로우패스)
  - 파이프오르간 sub (풀 코드에만)
  - 팀파니 (피치 디케이 + 노이즈)
  - 심벌 (하이패스 노이즈, 최종 코드)
  - 리버브 (ConvolverNode + 인공 임펄스 2.2초)
- 최종 C major 풀 보이싱 코드 (C3~C6, 8성) 2.8배 길이로 여운

## 디자인 시스템
- 배경: `#f3efe6` (종이 베이지)
- 잉크: `#1a1a1a`
- 파란 조판부호: 오선 · 음표 · 손그림 필터(feTurbulence)
- 오선은 단정하게 (휘어짐 X — 여러 시도 후 단순화로 결정)
- 줄 간격 `LINE_GAP = 7` (기본 10의 0.7배)

## 상단 헤더 (악보 타이틀)
- `position: fixed`로 고정
- 스크롤 전: 풀 헤더 (Opus No.005 / 한글 제목 / 영문 부제 / 템포 / 크레딧)
- 스크롤 후: 컴팩트 바 (한글 제목만)
- 동적 스페이서로 악보 영역 밀리지 않음

## 악보 디테일
- [쪽 번호 위치] 주황 마커
- 높은음자리표, 박자표 (4/4, 3/4)
- 악장별 템포 마킹 (I. Andante 등) + 이탈리아어 표정 (dolce, cantabile 등)
- 다이나믹 기호 (p → mp → pp → mf → f → ff 점진 증가)
- 마디 번호 누적
- 종지선 (double bar / final double bar)
- 마지막 악장 끝에 "Fine."

## 기술 스택
- 순수 HTML/CSS/JS
- SVG 손그림 필터 (`feTurbulence` + `feDisplacementMap`)
- Web Audio API (오케스트라 합성)
- SVG `transform` attribute 기반 bounce 애니메이션 (CSS transform과 충돌 방지)

## 주요 이슈/러닝
- **CSS vs SVG transform 충돌**: bounce 시 CSS `translateY`가 원래 SVG transform(translate+scale)을 덮어써서 사람이 왼쪽으로 튀는 버그 → SVG transform attribute를 직접 애니메이션하는 방식으로 해결
- **오선 휘어짐**: wavy/waterfall/clouded 모드 구현했다가 "단정하게" 요청으로 전부 제거 — 처음부터 취향 확인했으면 스킵 가능
- **가사-음표 매핑**: 초기에 음절 수 < 음표 수 불일치 → 기사 내용 paraphrase로 가사 확장해서 해결
- **Web Audio 정책**: 사용자 클릭 전에는 오디오 차단 → 첫 클릭/스크롤/키 이벤트로 kickOff
- **피날레 오버**: 초기 풀스크린 선언 타이포는 과하다는 피드백 → 제거하고 악보 마지막에서 멈춤

## 재활용 가능 레시피
- 30개 블랙 실루엣 SVG path 풀
- 오케스트라 사운드 레이어 (`playOrchestral`, `playTimpani`, `playCymbal`)
- 인공 리버브 (ConvolverNode + 노이즈 impulse)
- 손그림 질감 필터
- 컴팩트 상단 헤더 + 동적 스페이서 패턴
