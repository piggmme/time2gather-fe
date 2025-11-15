# Time2Gather

Astro + React 기반의 일정 관리 애플리케이션

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
