# 뷰파인더 속 마법 같은 세상
### Day 009 — Interactive Media Art

---

## 프로젝트 개요

**출처** : EYESMAG — 포토그래퍼 사샤 엘라지 인터뷰
**URL** : https://www.eyesmag.com/posts/164249/sashaelage-interview-
**메인 텍스트** : 뷰파인더 속 마법 같은 세상
**파일** : `index.html` (단일 파일, 로컬 이미지 의존)
**소스 이미지** : `source_extendbackground.jpg` (말 사진, 가로형으로 확장된 버전)

---

## 컨셉

포토그래퍼의 시선을 관객이 직접 체험. 검은 화면에 뷰파인더 UI만 떠 있는
상태에서 시작해, 촬영 버튼(클릭)을 누르며 필름 한 장씩 소진한다. 클릭마다
화면 전체의 컬러톤이 바뀌고 패널 배치도 새로 롤링된다. 필름이 다 떨어지면
지금까지의 촬영이 "현상"되듯 피날레 타이포그래피가 3D 공간에서 수렴해 완성된다.

---

## 인터랙션 플로우

```
┌────────────────────┐
│ [0] INTRO          │  검은 배경 + 뷰파인더 UI만
│                    │  클릭 → 첫 컷 등장 (필름 소비 X)
└─────────┬──────────┘
          ↓ click
┌────────────────────┐
│ [1] SHOOT          │  말 이미지 패널 등장, 자동 루프
│ 05 LEFT            │  클릭 = 촬영
│                    │   - 필름 1장 소비
│                    │   - 톤 순환 (쿨블루→마젠타→세피아→그린)
│                    │   - 패널 위치·크기 새로 롤링
│                    │   - 셔터음 재생
└─────────┬──────────┘
          ↓ × 5
┌────────────────────┐
│ [2] FINALE         │  블록이 3D 공간에서 수렴
│                    │  "뷰파인더 속 / 마법 같은 세상"
│                    │  톤 자동 순환 (2.4s 간격)
│                    │  글리치 튕김 + 미세 호흡
└─────────┬──────────┘
          ↓ click
┌────────────────────┐
│ [3] EXIT MOTION    │  블록이 역재생으로 흩어짐 (2.2s)
│                    │  페이드아웃
└─────────┬──────────┘
          ↓
       [INTRO] 재시작
```

---

## 기술 구조

### Canvas 레이어

- **#cv-far / #cv-mid / #cv-near** — 메인 아트웍 3장 (현재는 `#cv` 단일)
- **#finale** — 피날레 전용 캔버스 (CSS opacity transition + filter 애니)

### 주요 전역 상태

```js
let introActive = true;     // 인트로 여부
let clickCount  = 0;         // 촬영 횟수
let finaleOn    = false;     // 피날레 진입 여부
let finalePhase = 'idle';    // 'converge' | 'settled' | 'explode'
let finaleBlocks = [];       // 피날레 텍스트 블록 배열
```

### 7가지 렌더링 모드 (메인 캔버스)

| 모드 | 설명 |
|---|---|
| `original` | 원본 사진 |
| `dot` | 사각 도트 (밝기 기반 + 방사 감쇠) |
| `halftone` | 원형 할프톤 |
| `ascii` | 문자 아스키아트 |
| `pixel` | 모자이크 |
| `glitch` | RGB 채널 분리 + 수평 슬라이스 |
| `duotone` / `duotone_pink` / `duotone_blue` / `duotone_orange` | 컬러 필터 듀오톤 |

**중심/외곽 차등 할당**
- 중심 반경 22% 안: 텍스처 모드 섞어 사용
- 외곽: `original` + `duotone` 변종만 (비트맵 렌더 제외)

**콘트라스트 증폭**: 이미지 자체가 중간톤 47%에 몰려있어 픽셀 레벨에서 1.8배 증폭.

### 클릭마다 바뀌는 것

1. **톤 필터** — `TONE_PRESETS`(5단계) 중 하나를 `cv.style.filter`에 적용
2. **패널 배치** — `buildPanels(clickCount)`로 seed 바꿔 위치·크기 재생성
3. **전환 애니** — `triggerAll()`로 모든 패널이 페이드 전환

### 피날레 3D 시스템

```js
PERSP_FOCAL = 800
project(x, y, z, FW, FH) → { px, py, scale }
  scale = FOCAL / (FOCAL + z)
```

각 텍스트 블록은 3D 월드 좌표 `(x, y, z)`를 가짐.
- **시작** : 극좌표로 흩어진 xy + z∈[-300, +600]
- **목표** : 격자 샘플링으로 추출한 텍스트 마스크 위치 + z=0
- **수렴** : ease-out cubic, 행별 staggered delay
- **정착 후** : 미세 호흡(±1.5px, 고유 phase) + 주기적 글리치 튕김(RGB 시프트 고스트)
- **종료** : 다시 극좌표로 흩어지며 ease-in cubic, 2.2초

**Painter's algorithm** : 매 프레임 z 내림차순 정렬 후 후방부터 그림.
후방 블록은 작고 회색, 전방은 크고 밝음.

### 사운드 (Web Audio)

- **playShutter()** — 미러업 + 셔터 닫힘 + 금속 울림 3레이어 합성
- **playFinaleSound()** — whoosh + 고음 상승

### UI 레이어

```
#vf-frame      외곽 얇은 테두리
#c-tl/tr/bl/br 코너 L자 마커
#crosshair     중앙 십자선
#vf-circle     원형 뷰파인더
#scanline      수직 스캔라인
#rec           좌상단 REC 점멸
#expo          우하단 노출 정보
#meta          좌상단 메타 텍스트
#film-counter  하단 필름 슬롯 5개 + 카운트
```

---

## 파일 구성

```
day-009/
├── index.html                  — 단일 아트웍
├── source_extendbackground.jpg — 말 이미지 (가로형 확장)
├── source.webp                 — 원본 세로형 말 이미지 (미사용)
├── ref_01.jpg / ref_02.png     — 레퍼런스 이미지
├── viewfinder_brief.md         — (이전) 기획 브리프
└── HANDOFF.md                  — (현재 문서)
```

---

## 알려진 이슈 / 다음 확장

### 고려할 점
- [ ] 모바일 터치 이벤트 — 현재 `click`만 바인딩됨
- [ ] 이미지 로드 실패 시 fallback 없음 (로컬 서버 필요)
- [ ] 피날레 진입 시 첫 프레임 일시 정지(블록 배열 준비) — 거의 안 보이지만 미세

### 확장 아이디어
- 피날레 텍스트 **순환** — 한글 → 영문("A MAGICAL WORLD / INSIDE THE VIEWFINDER") → 날짜
- **마우스 인터랙션** — 피날레 정착 블록에 마우스 커서 반발/끌림
- 메인 아트웍에서 **스냅샷 콜라주** — 이전에 찍은 프레임이 배경에 희미하게
- 피날레 블록 **색상 변조** — 톤 순환에 맞춰 블록 자체 RGB도 변화

---

## 로컬 실행

```bash
cd motion-typo
python3 -m http.server 8765
# → http://localhost:8765/day-009/
```

로컬 서버 없이 `file://`로 열면 이미지 CORS로 `getImageData`가 막히므로
모든 렌더 모드가 빈 화면. 반드시 서버로 열어야 함.

---

*최종 업데이트: 2026.04.27 / Kiro 세션*
