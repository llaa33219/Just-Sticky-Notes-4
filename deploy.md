# Just Sticky Notes - Cloudflare Workers 배포 가이드

## 🚀 빠른 시작

### 1. 사전 요구사항
```bash
# Node.js 16 이상 설치 확인
node --version

# Wrangler CLI 설치
npm install -g wrangler

# Cloudflare 계정 로그인
wrangler login
```

### 2. 프로젝트 설정
```bash
# 프로젝트 클론
git clone <your-repo-url>
cd just-sticky-notes

# 의존성 설치
npm install
```

### 3. R2 스토리지 설정
```bash
# R2 bucket 생성
wrangler r2 bucket create just-sticky-notes-storage

# bucket 이름이 다른 경우 wrangler.toml 수정
# bucket_name = "your-bucket-name"
```

### 4. 배포
```bash
# 개발 환경에서 테스트
npm run dev

# 프로덕션 배포
npm run deploy
```

## ⚙️ 환경 설정

### wrangler.toml 설정
```toml
name = "just-sticky-notes"
main = "worker.js"
compatibility_date = "2024-01-01"

# R2 버킷 바인딩
[[r2_buckets]]
binding = "STICKY_NOTES_BUCKET"
bucket_name = "just-sticky-notes-storage"

# 환경 변수
[vars]
ENVIRONMENT = "production"
```

### 선택적 설정

#### KV 네임스페이스 (세션 관리용)
```bash
# KV 네임스페이스 생성
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview

# wrangler.toml에 추가
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

## 🧪 테스트

### 로컬 개발
```bash
# 로컬 개발 서버 (로컬 시뮬레이션)
npm run dev

# 실제 Cloudflare 환경에서 테스트
npm run preview
```

### API 테스트
```bash
# 헬스체크
curl https://your-worker.workers.dev/api/health

# 디버그 정보
curl https://your-worker.workers.dev/api/debug

# 노트 목록
curl https://your-worker.workers.dev/api/notes
```

## 📊 모니터링

### 로그 확인
```bash
# 실시간 로그 스트림
wrangler tail

# 특정 필터
wrangler tail --filter=error
```

### 메트릭 확인
- Cloudflare Dashboard → Workers → Analytics
- 요청 수, 응답 시간, 오류율
- CPU 사용량, 메모리 사용량

## 🔧 디버깅

### 일반적인 문제들

#### 1. R2 bucket 연결 오류
```bash
# bucket 존재 확인
wrangler r2 bucket list

# 권한 확인
wrangler r2 object get just-sticky-notes-storage/notes.json
```

#### 2. WebSocket 연결 실패
- HTTPS 환경에서만 WebSocket 작동
- 로컬 개발 시 `wss://` 대신 `ws://` 사용

#### 3. 메모리 초과 오류
- 큰 노트 데이터 확인
- R2에서 오래된 노트 정리

### 개발 도구
```bash
# 개발자 도구에서 디버깅
console.log('Debug:', debugStickyNotes.getConnectionInfo());

# 성능 측정
console.log('Latency:', debugStickyNotes.getLatencyInfo());
```

## 🔒 보안 고려사항

### CORS 설정
- 프로덕션에서는 특정 도메인만 허용 고려
- `Access-Control-Allow-Origin` 제한

### Rate Limiting
```javascript
// worker.js에 추가
const RATE_LIMIT = 100; // 분당 요청 제한
```

### 입력 검증
- 텍스트 길이 제한 (현재 500자)
- XSS 방지를 위한 HTML 이스케이프

## 💰 비용 최적화

### 무료 티어 한도
- 요청: 100,000건/일
- CPU Time: 10ms/일 (누적)
- R2: 10GB 저장용량/월

### 최적화 팁
1. **압축**: Gzip 압축 활성화
2. **캐싱**: 정적 자원 캐싱
3. **지연 로딩**: 필요한 기능만 로드
4. **R2 정리**: 오래된 노트 자동 삭제

## 🚀 고급 설정

### 커스텀 도메인
```bash
# 커스텀 도메인 추가
wrangler route add your-domain.com/* your-worker-name
```

### 환경별 배포
```bash
# 스테이징 환경
wrangler deploy --env staging

# 프로덕션 환경
wrangler deploy --env production
```

### CI/CD 설정
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
```

## 📞 문제 해결

### 자주 묻는 질문

#### Q: WebSocket이 연결되지 않아요
A: HTTPS 환경인지 확인하고, 브라우저 개발자 도구에서 오류 메시지를 확인하세요.

#### Q: 노트가 저장되지 않아요
A: R2 bucket 권한과 바인딩을 확인하세요.

#### Q: 성능이 느려요
A: CPU 시간 사용량과 메모리 사용량을 확인하고, 불필요한 작업을 최적화하세요.

### 지원 및 문의
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord 커뮤니티](https://discord.gg/cloudflaredev)

---

**🎯 성공적인 배포를 위한 체크리스트:**
- [ ] Node.js 16+ 설치
- [ ] Wrangler CLI 설치 및 로그인
- [ ] R2 bucket 생성 및 바인딩
- [ ] wrangler.toml 설정 확인
- [ ] 로컬 테스트 완료
- [ ] 프로덕션 배포
- [ ] API 엔드포인트 테스트
- [ ] WebSocket 연결 테스트 