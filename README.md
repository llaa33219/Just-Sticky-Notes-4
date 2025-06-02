# Just Sticky Notes 📝 - Cloudflare Workers Edition

실시간 스티키 노트 커뮤니티 사이트입니다. 나무 배경의 무한 캔버스에서 다른 사용자들과 함께 스티키 노트를 공유할 수 있습니다.

## ✨ 주요 기능

### 🎨 **사용자 경험**
- **나무 텍스처 배경**: 따뜻한 나무 배경의 무한 캔버스
- **구글 로그인**: 떨어지는 애니메이션이 있는 스티키 노트로 로그인
- **handwriting 폰트**: 손글씨 느낌의 Caveat, Kalam 폰트 사용
- **6가지 스티키 노트 색상**: 노란색, 주황색, 분홍색, 보라색, 파란색, 초록색

### 🛠️ **도구 및 기능**
- **이동 도구**: 캔버스 팬/줌 (마우스 휠, 드래그)
- **스티키 노트 생성**: 텍스트 + 그리기가 통합된 캔버스
- **그리기 도구**: 펜, 밑줄, 동그라미, 지우기
- **실시간 드래그**: 내가 만든 노트를 드래그해서 이동 가능
- **키보드 단축키**: `M` (이동), `N` (노트 생성), `+/-` (줌)

### 🌐 **실시간 기능**
- **WebSocket 실시간 통신**: 즉시 동기화
- **사용자 입장/퇴장 알림**: 실시간 참여자 확인
- **자동 재연결**: 30초 heartbeat + 페이지 포커스 시 재동기화
- **연결 상태 표시**: 상태바에 연결 상태 표시

## 🏗️ 기술 스택

### **Frontend**
- **Vanilla JavaScript**: 프레임워크 없는 순수 JS (Worker 내장)
- **CSS3**: 애니메이션, Grid/Flexbox, 반응형 디자인 (Worker 내장)
- **HTML5 Canvas**: 그리기 기능
- **Google Fonts**: Caveat, Kalam 손글씨 폰트

### **Backend** 
- **Cloudflare Workers**: 서버리스 컴퓨팅 플랫폼
- **WebSocket API**: 실시간 통신 (Worker 네이티브 지원)
- **R2 Object Storage**: 스티키 노트 데이터 저장
- **완전 독립형**: 별도 정적 파일 호스팅 불필요

### **배포 및 인프라**
- **Cloudflare Workers**: 단일 Worker로 모든 기능 처리
- **R2 Bucket**: `STICKY_NOTES_BUCKET` 환경 변수로 설정
- **글로벌 엣지**: 전 세계 200+ 데이터센터에서 실행
- **무료 티어**: Cloudflare 무료 계정으로 운영 가능

## 🚀 배포하기

### 1. **사전 준비**
```bash
# Node.js 설치 (16.0 이상)
node --version

# Wrangler CLI 설치
npm install -g wrangler

# Cloudflare 계정 로그인
wrangler login
```

### 2. **프로젝트 설정**
```bash
git clone <your-repo>
cd just-sticky-notes
npm install
```

### 3. **R2 Bucket 설정**
```bash
# R2 bucket 생성
wrangler r2 bucket create just-sticky-notes-storage

# wrangler.toml에서 bucket_name 확인/수정
# bucket_name = "just-sticky-notes-storage"
```

### 4. **배포**
```bash
# 개발 서버 실행 (로컬 테스트)
npm run dev

# 프로덕션 배포
npm run deploy
```

### 5. **환경 변수 설정 (선택사항)**
```bash
# 환경 변수 설정
wrangler secret put ENVIRONMENT
# 입력: production

# KV 네임스페이스 생성 (세션 관리용)
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview
```

### 6. **배포 확인**
- `https://your-worker-name.your-subdomain.workers.dev`에서 사이트 확인
- `/api/health`에서 API 상태 확인
- `/api/debug`에서 R2 연결 상태 확인

## 📁 프로젝트 구조 (Workers Edition)

```
just-sticky-notes/
├── worker.js               # 메인 Worker 파일 (모든 기능 포함)
├── wrangler.toml           # Wrangler 설정 파일
├── package.json            # 프로젝트 설정
├── README.md              # 이 파일
├── .gitignore             # Git 제외 파일들
└── legacy/                # 기존 Pages 버전 파일들
    ├── _worker.js         # 기존 Worker 파일
    ├── index.html         # 기존 HTML
    ├── styles.css         # 기존 CSS
    └── app.js             # 기존 JavaScript
```

## 🔧 API 엔드포인트

### **REST API**
- `GET /api/notes`: 모든 스티키 노트 조회
- `GET /api/health`: 서버 상태 확인
- `GET /api/debug`: 디버그 정보 (R2 연결 상태 등)

### **WebSocket** (`/ws`)
```javascript
// 연결
const ws = new WebSocket('wss://your-worker.workers.dev/ws');

// 메시지 타입들
{
  type: 'auth',           // 사용자 인증
  type: 'load_notes',     // 노트 로드 요청
  type: 'create_note',    // 새 노트 생성
  type: 'update_note',    // 노트 위치 업데이트  
  type: 'delete_note',    // 노트 삭제
  type: 'sync_request',   // 동기화 요청
  type: 'ping'            // 연결 상태 확인
}
```

## 🎮 사용법

### **기본 조작**
1. **로그인**: 구글 스티키 노트 클릭 (데모 모드)
2. **이동**: `M` 키 또는 이동 도구 선택 후 캔버스 드래그
3. **줌**: 마우스 휠 또는 `+`/`-` 키
4. **노트 생성**: `N` 키 또는 노트 도구 선택 후 캔버스 클릭

### **노트 편집**
1. **색상 선택**: 6가지 색상 중 선택
2. **텍스트 입력**: 투명 텍스트 영역에 글 작성
3. **그리기**: 펜/밑줄/동그라미 도구로 그리기
4. **저장**: "붙이기" 버튼으로 캔버스에 추가

### **실시간 협업**
- **다른 사용자 노트**: 실시간으로 나타남
- **내 노트 이동**: 드래그해서 위치 변경 가능 (다른 사용자에게도 실시간 반영)
- **자동 동기화**: 페이지 포커스 시 자동으로 최신 상태 동기화

## ⚡ Workers 최적화 특징

### **성능**
- **엣지 컴퓨팅**: 사용자에게 가장 가까운 데이터센터에서 실행
- **제로 콜드 스타트**: 즉시 실행, 서버 대기 시간 없음
- **메모리 효율**: 단일 Worker에서 모든 기능 처리
- **WebSocket 네이티브**: 별도 프록시 없이 직접 WebSocket 지원

### **확장성**
- **무제한 동시 접속**: Cloudflare 네트워크 규모로 확장
- **글로벌 배포**: 코드 변경 없이 전 세계 배포
- **자동 스케일링**: 트래픽에 따라 자동으로 인스턴스 증감

### **보안**
- **DDoS 보호**: Cloudflare 네트워크 레벨 보호
- **SSL/TLS**: 자동 HTTPS 인증서
- **격리된 실행**: V8 isolate 기반 보안 실행 환경

## 📊 개발 도구

### **로컬 개발**
```bash
# 로컬 개발 서버 (핫 리로드)
npm run dev

# 원격 개발 (실제 Cloudflare 환경)
npm run preview
```

### **디버깅**
```bash
# Worker 로그 실시간 확인
wrangler tail

# R2 bucket 내용 확인
wrangler r2 object get just-sticky-notes-storage/notes.json
```

### **모니터링**
- **Cloudflare Dashboard**: Workers 메트릭 및 로그
- **Analytics**: 요청 수, 응답 시간, 오류율
- **Real User Monitoring**: 실제 사용자 성능 데이터

## 🔒 보안 및 제한사항

### **보안**
- **CORS 설정**: 적절한 CORS 헤더
- **입력 검증**: 텍스트 길이 및 형식 검증
- **Rate Limiting**: Workers 자체 요청 제한

### **제한사항**
- **CPU Time**: 요청당 최대 100ms (무료), 30초 (유료)
- **Memory**: 128MB 메모리 제한
- **Request Size**: 100MB 요청 크기 제한
- **WebSocket**: 연결당 1분 CPU 시간 제한

## 💰 비용 정보

### **무료 티어**
- **요청**: 매일 100,000건
- **CPU Time**: 매일 10ms (누적)
- **R2**: 매월 10GB 저장용량
- **대역폭**: 무제한

### **유료 플랜**
- **요청**: $0.15/백만 건
- **CPU Time**: $12.50/백만 GB-초
- **R2**: $0.015/GB/월

## 🤝 기여하기

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📈 로드맵

- [ ] **Durable Objects**: 더 고급 상태 관리
- [ ] **KV Storage**: 사용자 세션 및 설정 저장
- [ ] **Analytics**: 상세한 사용자 분석
- [ ] **Caching**: 정적 자원 캐싱 최적화
- [ ] **Multi-region**: 지역별 데이터 복제

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

### 🎯 **Just Sticky Notes Workers** - *엣지에서 실행되는 실시간 협업 도구* ⚡📝✨ 