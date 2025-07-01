# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# COINDEX - 실시간 암호화폐 시세 서비스

## 🚀 주요 기능
- **실시간 코인 시세**: 업비트 API를 통한 실시간 데이터
- **김치프리미엄**: 바이낸스와의 가격 차이 계산
- **모바일 최적화**: 반응형 디자인으로 모든 기기 지원
- **커뮤니티**: 사용자 간 분석글 공유
- **AI 자동 포스팅**: GPT 기반 1분마다 자동 분석글 생성

## 📱 모바일 접속 방법

### 1. 개발 서버 시작
```bash
# 프록시 서버 시작 (백그라운드)
node proxy-server.cjs &

# 프론트엔드 개발 서버 시작
npm run dev
```

### 2. 모바일에서 접속
- **컴퓨터와 모바일이 같은 Wi-Fi에 연결되어 있어야 합니다**
- 브라우저에서 `http://192.168.1.100:5173` 접속
- (IP 주소는 컴퓨터 환경에 따라 다를 수 있음)

### 3. 네트워크 IP 확인 방법
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

## 🛠️ 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 확인)
# VITE_API_URL=http://192.168.1.100:4000

# 프록시 서버 시작
node proxy-server.cjs

# 개발 서버 시작 (새 터미널)
npm run dev
```

## 🔧 문제 해결

### 모바일에서 코인 시세가 안 보이는 경우
1. **네트워크 연결 확인**: 컴퓨터와 모바일이 같은 Wi-Fi 네트워크에 있는지 확인
2. **방화벽 설정**: 컴퓨터의 방화벽이 포트 4000, 5173을 차단하지 않는지 확인
3. **IP 주소 확인**: `.env` 파일의 `VITE_API_URL`이 올바른 IP 주소인지 확인

### 햄버거 메뉴가 작동하지 않는 경우
- 페이지를 새로고침해보세요
- 브라우저 캐시를 삭제해보세요

### API 요청 실패 시
```bash
# 프록시 서버 상태 확인
curl http://localhost:4000/api/status

# 프록시 서버 재시작
pkill -f proxy-server.cjs
node proxy-server.cjs &
```

## 🌐 접속 주소
- **로컬**: http://localhost:5173
- **모바일**: http://192.168.1.100:5173
- **API 서버**: http://192.168.1.100:4000

## 📊 API 엔드포인트
- `/api/upbit` - 업비트 시세 데이터
- `/api/binance` - 바이낸스 시세 데이터
- `/api/fx` - 환율 정보
- `/api/news` - 암호화폐 뉴스
- `/api/status` - 서버 상태 확인
