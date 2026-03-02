# RTK14Helper 퍼블리시 계획

## Context

RTK14Helper를 GitHub에 퍼블리시하고, GitHub Pages로 모바일 접근을 가능하게 하며, 기기 간 상태 동기화 기능을 추가한다. 퍼블리시 전 저장소 구조를 정리하고 README.md를 작성한다.

---

## Phase 1: 저장소 정리 (완료)

### 결과 폴더 구조

```
RTK14Helper/
├── index.html
├── app.js
├── style.css
├── data.js
├── README.md
├── Publish_Plan.md
├── .gitignore
├── data/
│   ├── RTK14_characters_PK.csv
│   ├── RTK14_characters.csv
│   └── RTK_cities.csv
├── scripts/
│   └── generate_data.js
└── docs/
    ├── Prompt.md
    └── Prompt_for_UI.md
```

### 수행한 작업

- `data/` 폴더 생성 → CSV 3개 파일 이동
- `docs/` 폴더 생성 → `Prompt.md`, `Prompt_for_UI.md` 이동
- `Example/` 폴더 삭제
- `scripts/generate_data.js`의 CSV 경로를 `data/`로 수정
- `.gitignore` 생성 (.claude/, node_modules/ 등 제외)

---

## Phase 2: README.md 작성 (완료)

프로젝트 제목, 주요 기능, 기술 스택, 사용법, 데이터 생성 방법, 프로젝트 구조를 포함한 README.md를 작성했다.

---

## Phase 3: GitHub 퍼블리시 (완료)

- 저장소: https://github.com/awesomedays/RTK14Helper
- GitHub Pages: https://awesomedays.github.io/RTK14Helper/
- 브랜치: `master`

---

## Phase 4: 상태 내보내기/가져오기 (완료)

### 기능

- **내보내기**: 헤더의 "내보내기" 버튼 → 모든 localStorage 상태를 `rtk14_state_YYYY-MM-DD.json`으로 다운로드
- **가져오기**: 헤더의 "가져오기" 버튼 → JSON 파일 업로드 → 상태 복원 후 새로고침

### 포함 상태 키

| localStorage 키 | 설명 |
|---|---|
| `rtk14_roster` | 보유무장 ID 목록 |
| `rtk14_cities` | 보유도시 ID 목록 |
| `rtk14_corps` | 군단 데이터 |
| `rtk14_trade` | 교역 국가 설정 |
| `rtk14_manual_trade` | 수동 교역 배정 |
| `rtk14_city_slots` | 도시별 배정인원 오버라이드 |
| `rtk14_city_recruit` | 도시별 모병 비활성 설정 |
| `rtk14_summon` | 호출 진행 상태 |
| `rtk14_appointment` | 임명 진행 상태 |

### 사용 흐름

1. PC에서 앱 사용 → 상태 설정 완료
2. "내보내기" 클릭 → JSON 파일 저장
3. JSON 파일을 모바일로 전송 (메신저, 클라우드 등)
4. 모바일에서 GitHub Pages URL 접속
5. "가져오기" 클릭 → JSON 파일 선택 → 동일 상태 복원
