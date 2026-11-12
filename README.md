# Time2Gather

Astro + React 기반의 일정 관리 애플리케이션

## 다국어 작업 지침

문구·화면 변경 시 전체 지원 언어에 반영하는 원칙, 번역 파일 위치, 검증·배포 완료 기준은 [다국어 작업 지침](docs/i18n-guidelines.md)을 따릅니다. 자동 작업 에이전트도 `AGENTS.md`를 통해 이 지침을 참조합니다.

## 다국어 폰트

22개 지원 언어의 폰트 구성, 선정 근거, 로딩 방식과 관리 절차는 [다국어 폰트 운영 기준](docs/typography.md)을 참고하세요. 실제 설정은 `src/i18n/fonts.ts`에서 관리합니다.

일정·장소 투표의 참여자 표시는 [참여자 표시 동작과 검증](docs/participant-visibility.md)에 정리되어 있습니다.

## 🐳 Docker로 실행하기

### 사전 요구사항
- Docker가 설치되어 있어야 합니다.

### Docker 이미지 빌드

```bash
docker build -t time2gather:latest .
```

### Docker 컨테이너 실행

#### 기본 실행 (포트 3000)
```bash
docker run -d -p 3000:3000 --name time2gather time2gather:latest
```
