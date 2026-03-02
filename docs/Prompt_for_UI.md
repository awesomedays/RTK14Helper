# UI 전면 리뉴얼 프롬프트

## 프로젝트 개요

"삼국지 14 내정도우미" — 바닐라 JS/HTML/CSS 웹앱 (프레임워크 없음, 빌드 없음).
파일: `index.html`, `app.js`, `style.css`, `data.js` (자동생성).

현재 UI 테마: 어두운 금색 한풍(漢風) 스타일 (`--bg-dark: #1c1810`, `--accent-gold: #c8a84e` 등).
변경 목표: **Notion 스타일** (밝은 배경, 깔끔한 산세리프, 미니멀 보더, 넓은 여백).

---

## 1. 탭 구조 변경

### 현재 (index.html header nav, app.js 탭 스위칭)

7개 탭이 1단 구조로 나열:
```
[내정 최적화] [무장 검색] [무장 비교] [보유 무장] [보유도시] [군단관리] [내정관리]
```

### 변경 후: 2단 탭 구조

**상위 탭** (카테고리):
```
[현재]  [전체]
```

**하위 탭** — 상위 탭 선택에 따라 변경:

- **"현재" 선택 시** (왼쪽→오른쪽):
  ```
  [보유무장] [보유도시] [군단관리] [내정관리]
  ```

- **"전체" 선택 시** (왼쪽→오른쪽):
  ```
  [무장 검색] [무장 비교] [내정 최적화]
  ```

### 구현 포인트

- `index.html`: header nav를 상위/하위 2개 nav로 분리
- `app.js` 탭 스위칭 (현재 ~line 1135-1145): 상위 탭 클릭 시 하위 탭 목록 변경 + 첫 번째 하위 탭 자동 활성화
- `state.currentTab` 유지, 상위 탭 상태 추가 (예: `state.currentCategory: 'current'`)
- 탭 ID 매핑: `tab-roster`, `tab-cities`, `tab-corps`, `tab-admin`, `tab-search`, `tab-compare`, `tab-optimize`
- 내정관리 탭 전환 시 `renderAdminCitySlots()` 호출하는 로직 유지

---

## 2. Notion 스타일 전면 적용

### CSS 변수 교체 (style.css :root)

현재 한풍 테마 → Notion 스타일로 교체:

```
배경: 밝은 흰색/회색 계열 (#ffffff, #f7f6f3, #fbfbfa)
텍스트: 어두운 (#37352f, #787774, #9b9a97)
보더: 연한 회색 (#e9e9e7, #dfdfde)
악센트: Notion 블루 (#2eaadc) 또는 중립적 다크 (#37352f)
radius: 4px~6px (Notion은 약간의 둥근 모서리)
폰트: 시스템 산세리프 (Inter, -apple-system, Segoe UI, sans-serif)
```

### 주요 스타일 변경 대상

| 요소 | 현재 | Notion 스타일 |
|------|------|---------------|
| body 배경 | `#1c1810` (어두운 갈색) | `#ffffff` (흰색) |
| header | 어두운 패널 + 금색 보더 | 깔끔한 흰색/연회색, 하단 1px 보더 |
| 테이블 | 어두운 배경 + 금색 헤더 | Notion 데이터베이스 스타일 (흰 배경, 연회색 줄무늬) |
| 버튼 | 금색/빨간색 테두리 | Notion 버튼 (연한 배경, hover시 약간 어두움) |
| 입력 필드 | 어두운 배경 | 흰 배경 + 연회색 보더, focus시 파란 보더 |
| 카드 | 어두운 패널 + 금색 그림자 | 흰 배경 + 연한 그림자 또는 보더 |
| 뱃지 | 금색 계열 | Notion 태그 스타일 (파스텔 배경색) |
| 모달 | 어두운 배경 + 장식 | 깔끔한 흰색 모달 + backdrop blur |

### 폰트

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
```
(기존 Google Fonts Noto Sans KR 링크는 유지하되, 시스템 폰트 우선)

---

## 3. 군단관리 탭 스타일 수정

### 현재 구조 (renderCorpsList, app.js ~line 492-590)

```
┌─ 군단 카드
│  ├─ 헤더: 군단명 + 역할뱃지 + 인원수 + 삭제
│  ├─ 도시 선택
│  ├─ 직급 추가 입력
│  ├─ 직급 1:
│  │   ├─ 직급 헤더
│  │   ├─ 무장A (세로)    ← 현재: 세로 나열
│  │   ├─ 무장B (세로)
│  │   └─ [무장 검색...]
│  └─ 직급 2: ...
```

### 변경 후

```
┌─ 군단 카드
│  ├─ 헤더: 군단명 + 역할뱃지 + 인원수 + 삭제
│  ├─ 도시 선택
│  ├─ 직급 추가 입력
│  ├─ 직급 1:
│  │   ├─ 직급명
│  │   ├─ [무장A 무장B 무장C ...] [무장 검색...]  ← 가로 나열 + 검색창 우측
│  └─ 직급 2: ...
```

### 구현 포인트

**A. 무장 가로 나열**
- `.corps-card__member-list`: `display: flex; flex-wrap: wrap; gap: 8px;` (현재 `flex-direction: column` → 제거)
- `.corps-member`: 카드 형태로 변경 (패딩, 보더, 약간의 배경색)

**B. 검색창 우측 배치**
- `.corps-rank` 내부를 `flex-wrap: wrap`으로 변경
- 직급 헤더 + 멤버 목록 + 검색창을 하나의 flex row로
- 검색창 `.corps-search-wrap`에 `margin-left: auto` 적용

**C. 스탯 색상 강조** (80이상, 90이상)
- 현재: `corps-member__stats` 안에 "통75 무92 지88 정45" 형태의 단순 텍스트
- 변경: 각 스탯을 개별 `<span>`으로 분리하여 조건부 클래스 적용
- app.js `renderCorpsList` 내 memberRows 생성 부분 (~line 509-515) 수정

```javascript
function statClass(val) {
  if (val >= 90) return 'stat--high';
  if (val >= 80) return 'stat--mid';
  return '';
}
// 렌더링:
`통<span class="${statClass(o.leadership)}">${o.leadership}</span> ...`
```

CSS:
```css
.stat--high { color: #d44; font-weight: 700; }  /* 90+ 빨강/진한색 */
.stat--mid  { color: #e8a; font-weight: 600; }  /* 80+ 중간색 */
```
(Notion 스타일에 맞게 색상 조정)

---

## 4. 내정관리 탭 스타일 수정

### 현재 구조 (index.html tab-admin 섹션)

```
├─ 교역 체크박스 + 배정실행 버튼 (filter-bar)
├─ 도시별 내정인원 테이블 (#admin-city-slots)
├─ 배정 결과 (#admin-results)
│  ├─ 교역요원 섹션        ← 현재: 맨 위
│  ├─ 도시별 배정 섹션
│  └─ 미배정 섹션
```

### 변경 후

**A. 초기조건 / 배정결과 시각적 분리**

```
┌─ 초기조건 영역 (카드/패널)
│  ├─ 교역 국가 체크박스
│  ├─ 도시별 내정인원 테이블
│  └─ [배정 실행] 버튼
├─ (시각적 구분선 또는 큰 여백)
└─ 배정결과 영역
   ├─ 도시별 배정 섹션     ← 순서 변경: 도시별 먼저
   ├─ 교역요원 섹션        ← 도시별 아래로 이동
   └─ 미배정 섹션
```

구현:
- `index.html`: 초기조건을 `<div class="admin-config">` 래퍼로 감싸기
- `app.js renderAssignmentResults()` (~line 836-927): 교역요원과 도시별 배정 순서 바꾸기 (도시별 먼저, 교역 나중에)
- CSS: `.admin-config`에 카드 스타일 (패딩, 보더, 배경), `.admin-results`에도 별도 스타일

**B. 교역요원 위치 변경**

`renderAssignmentResults()` 내에서:
```javascript
// 현재 순서: 교역요원 → 도시별 → 미배정
// 변경 순서: 도시별 → 교역요원 → 미배정
```

단순히 코드 블록 순서 변경.

**C. 개성 카드 형태 표기**

현재 admin-chip__stat에서:
```
무력92 [모집]    ← 대괄호 텍스트
통무184 [교련]
지정98 [특사]
```

변경:
```
무력92  모집     ← "모집"이 별도 뱃지/태그
통무184  교련
지정98  특사
```

구현:
- `renderOfficerChip()` 함수의 `showStat` 콜백 반환값 변경
- 또는 `renderOfficerChip()`에 별도 `traits` 파라미터 추가
- 개성을 `<span class="trait-tag trait-tag--모집">모집</span>` 형태로 렌더링
- Notion 스타일 태그: 파스텔 배경 + 둥근 모서리 + 작은 폰트

```css
.trait-tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 1px 8px;
  border-radius: 3px;
  font-weight: 500;
}
.trait-tag--모집 { background: #fde2e2; color: #c43030; }
.trait-tag--교련 { background: #d3e5ef; color: #2874a6; }
.trait-tag--특사 { background: #e8deee; color: #6b3fa0; }
```

---

## 5. 수정 파일 요약

| 파일 | 변경 범위 |
|------|----------|
| `style.css` | CSS 변수 전면 교체, 모든 컴포넌트 스타일 Notion 스타일로 수정 (사실상 전면 재작성) |
| `index.html` | header nav 2단 구조로 변경, 내정관리 초기조건 래퍼 추가 |
| `app.js` | 탭 스위칭 로직 변경, 군단 멤버 스탯 렌더링 변경, 내정 결과 순서 변경, 개성 태그 렌더링 |

---

## 6. 참고: 현재 주요 CSS 클래스

변경 시 참고해야 할 핵심 클래스:

- **레이아웃**: `.header`, `.tabs`, `.tab`, `.tab-content`, `.main`
- **테이블**: `.data-table`, `.table-wrap`, `.sortable`, `.score-bar`
- **필터**: `.filter-bar`, `.filter-group`, `.affair-selector`, `.affair-btn`
- **카드**: `.corps-card`, `.admin-city-card`, `.compare-grid`
- **뱃지**: `.trait-badge`, `.role-badge`, `.admin-chip`
- **모달**: `.modal-overlay`, `.modal`, `.modal__content`
- **입력**: `.autocomplete-list`, `.compare-search-wrap`

---

## 7. 주의사항

- `data.js`는 수정하지 않음 (자동생성 파일)
- `app.js`의 비즈니스 로직(배정 알고리즘, 데이터 모델, localStorage 등)은 변경하지 않음
- 기존 기능이 모두 정상 동작해야 함 (탭 전환, 검색, 자동완성, 모달, 정렬 등)
- 모바일 반응형 유지 (현재 768px 브레이크포인트)
