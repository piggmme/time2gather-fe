# 다국어 폰트 운영 기준

적용 기준일: 2026-10-26. 대상: 서비스에서 지원하는 22개 언어의 홈·소개, 약속 생성·투표·결과, 관리자 화면.

## 선정 원칙

국가별 인기 순위나 선호도 1위라는 주장을 사용하지 않는다. 문자 지원, 자형·결합문자 품질, 작은 UI와 숫자의 가독성을 기준으로 선정한다. 같은 문자 체계를 쓰는 언어는 적합한 폰트를 공유한다. 언어마다 다른 폰트를 쓰기 위해 불필요하게 22개 패밀리를 도입하지 않는다.

폰트 설정의 단일 기준은 [`src/i18n/fonts.ts`](../src/i18n/fonts.ts)의 `localeTypography`다. 지원 언어를 추가하면 이 설정과 아래 표도 함께 갱신한다.

## 언어별 설정

| 언어 | 코드 | 기본 폰트 | 선택 이유 / 예외 |
|---|---|---|---|
| 영어 | `en` | Inter | 작은 화면의 UI와 시간·숫자 표현 |
| 스페인어 | `es` | Inter | 악센트 등 라틴 확장 문자 지원 |
| 프랑스어 | `fr` | Inter | 라틴 문자·악센트·합자 지원 |
| 포르투갈어 | `pt` | Inter | 라틴 확장 문자 지원 |
| 독일어 | `de` | Inter | 움라우트·ß 등 문자 지원 |
| 인도네시아어 | `id` | Inter | 라틴 문자 UI의 일관성 |
| 튀르키예어 | `tr` | Inter | 점 있는/없는 I 등 라틴 확장 문자 지원 |
| 하우사어 | `ha` | Inter | 현재 번역의 라틴 표기 및 확장 문자 지원 |
| 나이지리아 피진어 | `pcm` | Inter | 현재 번역의 라틴 표기 지원 |
| 러시아어 | `ru` | Golos Text | 키릴 문자 지원과 화면 본문 가독성 |
| 베트남어 | `vi` | Be Vietnam Pro | 베트남어의 복합 발음기호를 고려한 자형 설계 |
| 한국어 | `ko` | Noto Sans KR | 한국어에 맞는 한글·한자 자형 |
| 일본어 | `ja` | Noto Sans JP | 일본어의 가나·한자 자형 |
| 중국어 간체 | `zh-CN` | Noto Sans SC | 간체 중국어에 맞는 한자 자형 |
| 아랍어 | `ar` | Noto Sans Arabic | 아랍 문자 연결과 발음기호 지원 |
| 아랍어·이집트 | `ar-EG` | Noto Sans Arabic | 같은 아랍 문자 체계를 공유 |
| 우르두어 | `ur` | Noto Nastaliq Urdu | 본문·제목은 Nastaliq, 버튼·입력칸·탭·시간대 선택 요약은 Noto Sans Arabic |
| 힌디어 | `hi` | Noto Sans Devanagari | 데바나가리 결합문자·모음부호 지원 |
| 마라티어 | `mr` | Noto Sans Devanagari | 같은 데바나가리 문자 체계를 공유 |
| 벵골어 | `bn` | Noto Sans Bengali | 벵골 문자 결합과 모음부호 지원 |
| 텔루구어 | `te` | Noto Sans Telugu | 텔루구 문자 결합과 모음부호 지원 |
| 태국어 | `th` | Noto Sans Thai | 위아래로 결합하는 태국어 모음·성조부호 지원 |

## 로딩과 언어 변경

- 세 레이아웃이 공통 [`LocaleFonts.astro`](../src/components/LocaleFonts.astro)를 사용한다. 홈 화면에서 이름만 지정돼 있던 Inter도 실제 웹폰트로 로딩한다.
- Google Fonts CSS2에서 **현재 언어의 패밀리와 Inter만** 요청한다. 우르두어는 컨트롤용 Noto Sans Arabic도 요청한다. 모든 언어의 폰트를 한꺼번에 다운로드하지 않는다.
- 가변 폰트는 제공되는 굵기 범위를 요청한다. Be Vietnam Pro는 실제 사용하는 정적 굵기 400·500·600·700·800을 요청한다. Urdu Nastaliq는 제공 범위인 400–700을 사용하며, 더 굵은 스타일은 가장 가까운 굵기로 표시된다.
- `display=swap`으로 글자를 먼저 보여준다. Google Fonts에 접속하지 못해도 지역별 OS 폰트와 `system-ui`로 읽을 수 있으며, 폰트 실패가 언어 변경을 막지 않는다.
- 클라이언트에서 언어를 바꿀 때 `setLocale()`가 HTML의 `lang`·`dir`과 폰트 스타일시트를 함께 변경한다. 폼과 투표 상태를 유지하고, 이전 폰트 스타일시트는 새 요청이 끝나면 제거한다.
- 실제 패밀리는 `--font-ui`, 컨트롤은 `--font-controls`로 적용한다. 특정 컴포넌트에서 폰트 이름을 다시 고정하지 않는다.
- 폰트는 Google Fonts/Google Fonts의 파일 CDN에서 브라우저로 로딩된다. 폰트 파일을 저장소에 복제하거나 서비스가 재배포하는 방식은 아니다. 외부 요청을 없애려면 후속 작업으로 OFL 고지를 포함한 셀프 호스팅과 서브셋 전략을 설계한다.

## 행간과 모바일

[`src/styles/typography.scss`](../src/styles/typography.scss)가 공통 적용 규칙을 관리한다.

- 일반 본문 행간은 1.6, 아랍·인도계·태국어는 1.65다.
- 우르두어 본문은 Nastaliq 자형이 잘리지 않도록 2.0, 제목은 1.9를 사용한다. 버튼·입력칸 등은 Noto Sans Arabic과 행간 1.6을 사용해 작은 컨트롤 안에서 읽을 수 있게 한다.
- 아랍·우르두·인도계·태국어 제목에 라틴 문자를 위한 음수 자간을 강제하지 않는다. 한국어 어절 유지, 일·중 문장부호 처리 등 기존 언어별 줄바꿈 규칙을 유지한다.
- 시간표와 숫자 정렬 영역의 기존 `tabular-nums`를 유지한다. 폰트가 바뀌어도 시간대 변환과 날짜 정렬 로직은 바꾸지 않는다.
- 320px·390px 모바일에서 버튼, 언어 선택, 날짜, 시간, 결합문자가 겹치거나 잘리지 않는지 확인한다. `font-family` 설정뿐 아니라 브라우저가 실제 렌더링한 웹폰트도 확인해야 한다.

## 검증과 변경 절차

```sh
npm run test:globalization
npm run check:i18n
node node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc --noEmit
npm run build
```

1. `localeTypography`에 언어와 패밀리·폴백·필요한 행간을 추가한다.
2. API가 제공하는 정확한 패밀리 이름과 굵기 범위를 확인한다. 범위가 다르면 `weightRanges`도 갱신한다.
3. 공식 자료에서 문자 지원과 라이선스를 확인하고 이 표에 기록한다.
4. 직접 진입, 페이지 이동, 새로고침 없는 언어 변경, 입력 중인 폼의 보존을 검사한다.
5. 실제 번역 문구와 모바일 폭으로 글자 누락·겹침·잘림을 확인한다. 폰트 CDN 차단 상태에서도 UI가 사용 가능한지 검사한다.

`scripts/test-globalization.mjs`는 22개 언어의 설정 누락, 현재 언어용 요청 구성, CJK 패밀리 분리, 우르두어 컨트롤 예외를 검사한다. 특정 개발 PC의 pnpm 경로가 다르면 설치된 TypeScript 실행 파일로 타입 검사를 실행한다.

### 2026-10-26 구현 검증

- 22개 언어의 약속 검색 화면에서 브라우저의 실제 렌더링 폰트를 확인했다. CSS 선언뿐 아니라 Chrome의 플랫폼 폰트 정보에서 해당 웹폰트의 사용을 확인했다.
- 12개 대표 언어·문자 조합의 홈을 320px에서 확인했고, 22개 언어의 서비스 화면을 390px에서 확인했다. 페이지의 가로 넘침이 없었다.
- 작성 중인 약속 이름을 유지하면서 일본어→우르두어→베트남어→영어로 전환했다. 폰트도 변경됐고 활성 폰트 스타일시트 ID는 하나로 유지됐다.
- 폰트 CDN을 차단한 320px 우르두어 화면에서도 제목이 보이고 페이지가 가로로 넘치지 않았다.
- 빌드·타입 검사·폰트 설정 관련 ESLint·번역 검사·시간대 및 폰트 회귀 검사를 통과했다. 이 기록은 로컬 검증이며 운영 배포 기록은 별도로 남긴다.

모바일 예시: [일본어](screenshots/typography-ja-mobile.png), [우르두어](screenshots/typography-ur-mobile.png), [베트남어](screenshots/typography-vi-mobile.png).

### 2026-10-26 운영 배포

- Cloud Build `4b2571fb-de31-4311-9821-6b952f4a56b1` 성공. 이미지 `web:locale-fonts-20261026-1015`, Cloud Run 리비전 `time2gather-web-00075-qac`에 운영 트래픽 100%를 연결했다.
- Firebase Hosting 배포를 완료하고 웹 재작성을 새 리비전에 고정했다. 이전 리비전 `time2gather-web-00073-len`은 보존했으며 API는 배포하지 않았다.
- 새 리비전에서 22개 언어의 폰트 링크를 확인했다. 운영 도메인의 Header·MeetingLiveView·Daily JavaScript와 Daily CSS는 검증한 로컬 빌드와 바이트 단위로 일치했다.
- `https://time2gather.org`에서 22개 언어를 직접 열어 Chrome이 지정된 웹폰트를 실제 사용하는 것을 확인했다. 390px에서 가로 넘침이 없었다.
- 운영 화면에서 작성 중인 약속 이름을 유지하며 일본어·우르두어·베트남어·영어로 전환했다. 현재 언어에 맞는 폰트 링크가 적용됐고 브라우저 런타임 오류는 없었다. 검증용 입력은 제출하지 않았으며 운영 모임을 생성하지 않았다.

## 공식 근거와 라이선스

아래 자료 확인일: **2026-10-26 KST**. 이 근거는 서체의 문자 지원과 설계 목적에 관한 것으로, 국가별 선호도 순위를 뜻하지 않는다. 채택한 패밀리는 SIL Open Font License 1.1로 제공된다.

- [Inter 공식 설명](https://rsms.me/inter/): 화면용 설계, 큰 x-height, tabular figures 등. [Google Fonts 메타데이터](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb): 라틴·그리스·키릴·베트남어 subset 및 OFL.
- [Noto 공식 사용 안내](https://notofonts.github.io/noto-docs/website/use/): 문자별 폰트 구성, KR/JP/SC 구분, 아랍 문자와 Nastaliq 및 상업적 이용 안내.
- [Be Vietnam Pro 공식 프로젝트](https://github.com/bettergui/BeVietnamPro): 베트남어 발음기호 자형 설계. [Google Fonts 설명](https://github.com/google/fonts/blob/main/ofl/bevietnampro/DESCRIPTION.en_us.html), [OFL 원문](https://github.com/google/fonts/blob/main/ofl/bevietnampro/OFL.txt).
- [Golos Text 공식 프로젝트](https://github.com/googlefonts/golos-text): 화면 본문용 설계, 키릴 문자와 가변 굵기, OFL.
- [Google Fonts CSS2 API](https://developers.google.com/fonts/docs/css2): 패밀리·굵기 범위 요청과 `display=swap`.

모든 12개 패밀리의 실제 CSS2 요청이 HTTP 200과 `@font-face`를 반환하는 것도 구현 검증에서 확인했다. 배포 시에는 브라우저의 네트워크 정책과 CDN 접근 가능 여부를 별도로 확인한다.
