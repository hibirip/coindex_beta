# 🚀 COINDEX 통합 마이그레이션 가이드

3개의 Supabase 프로젝트를 하나로 통합하는 완전한 가이드입니다.

## 📋 목차

1. [준비 사항](#준비-사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [데이터 마이그레이션](#데이터-마이그레이션)
4. [뉴스 크롤러 설정](#뉴스-크롤러-설정)
5. [검증 및 테스트](#검증-및-테스트)
6. [배포](#배포)
7. [문제 해결](#문제-해결)

---

## 🛠️ 준비 사항

### 1. 환경 요구사항
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### 2. 프로젝트 정보 수집
다음 정보를 미리 준비하세요:

**🎯 새로운 통합 Supabase 프로젝트:**
- URL: `https://uzdfqhmdrzcwylnfbxku.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Service Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**📊 기존 소스 프로젝트들:**
- `coin_comm` (users, posts, likes)
- `coin-supabase-news` (news)
- `coin_user` (폐기 예정)

### 3. 의존성 설치
```bash
# 마이그레이션 도구 설치
npm install @supabase/supabase-js node-cron rss-parser axios cheerio dotenv

# 또는 package-migration.json 사용
cp package-migration.json package.json
npm install
```

---

## 🗄️ 데이터베이스 설정

### 1. SQL 스키마 실행

Supabase 대시보드의 SQL Editor에서 `supabase-migration-complete.sql` 실행:

```sql
-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. 테이블 생성
-- (전체 SQL 파일 실행)
```

### 2. RLS 정책 확인

다음 정책들이 올바르게 설정되었는지 확인:

- ✅ Users: 프로필 조회 가능, 본인만 수정 가능
- ✅ Posts: 모든 사람 조회 가능, 작성자만 수정/삭제 가능
- ✅ Likes: 모든 사람 조회 가능, 본인만 관리 가능
- ✅ News: 모든 사람 조회 가능

### 3. 인덱스 확인

성능 최적화를 위한 인덱스들이 생성되었는지 확인:

```sql
-- 인덱스 확인 쿼리
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## 📊 데이터 마이그레이션

### 1. 환경 변수 설정

`env-example.txt`를 참고하여 `.env` 파일 생성:

```env
# 타겟 프로젝트
SUPABASE_URL=https://uzdfqhmdrzcwylnfbxku.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# 소스 프로젝트들
SOURCE_COMM_URL=https://your-comm-project.supabase.co
SOURCE_COMM_KEY=your-comm-service-key
SOURCE_NEWS_URL=https://your-news-project.supabase.co
SOURCE_NEWS_KEY=your-news-service-key

# OpenAI (GPT 자동 글 생성용)
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2. 마이그레이션 실행

#### 🔄 전체 마이그레이션 (권장)
```bash
node data-migration.js migrate
```

#### 📝 단계별 마이그레이션
```bash
# 1. Users 테이블
node data-migration.js users

# 2. Posts 테이블
node data-migration.js posts

# 3. Likes 테이블
node data-migration.js likes

# 4. News 테이블
node data-migration.js news

# 5. 검증
node data-migration.js validate
```

#### 📋 JSON 파일에서 직접 삽입
```bash
# JSON 파일이 있는 경우
node data-migration.js json users users-data.json
node data-migration.js json posts posts-data.json
```

### 3. 마이그레이션 결과 확인

`migration-report.json` 파일에서 결과 확인:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "results": {
    "users": 150,
    "posts": 1250,
    "likes": 3400,
    "news": 580
  },
  "success": true
}
```

---

## 📰 뉴스 크롤러 설정

### 1. RSS 소스 설정

`news-rss-crawler.js`에서 RSS 소스 확인 및 수정:

```javascript
const RSS_SOURCES = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'news',
    language: 'en'
  },
  // ... 더 많은 소스들
];
```

### 2. 크롤러 테스트

```bash
# 테스트 실행 (첫 번째 소스만)
node news-rss-crawler.js test

# 한 번만 실행
node news-rss-crawler.js once
```

### 3. 크롤러 시작

```bash
# 백그라운드에서 지속 실행
node news-rss-crawler.js start

# 또는 PM2 사용 (권장)
npm install -g pm2
pm2 start news-rss-crawler.js --name "coindex-news-crawler"
pm2 startup
pm2 save
```

### 4. 크롤러 모니터링

```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs coindex-news-crawler

# 재시작
pm2 restart coindex-news-crawler
```

---

## ✅ 검증 및 테스트

### 1. 데이터 무결성 검증

```sql
-- 사용자 수 확인
SELECT COUNT(*) as user_count FROM users;

-- 게시글 수 확인
SELECT COUNT(*) as post_count FROM posts WHERE is_deleted = false;

-- 좋아요 수 확인
SELECT COUNT(*) as like_count FROM likes;

-- 뉴스 수 확인
SELECT COUNT(*) as news_count FROM news;

-- 참조 무결성 확인
SELECT COUNT(*) as orphan_posts 
FROM posts p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE u.id IS NULL;
```

### 2. 성능 테스트

```sql
-- 인기 게시글 조회 성능
EXPLAIN ANALYZE 
SELECT * FROM popular_posts LIMIT 10;

-- 최신 뉴스 조회 성능
EXPLAIN ANALYZE 
SELECT * FROM latest_news LIMIT 20;

-- 사용자 통계 조회 성능
EXPLAIN ANALYZE 
SELECT * FROM user_stats ORDER BY total_likes DESC LIMIT 10;
```

### 3. API 테스트

프론트엔드에서 다음 기능들이 정상 작동하는지 확인:

- ✅ 사용자 로그인/회원가입
- ✅ 게시글 작성/수정/삭제
- ✅ 좋아요 기능
- ✅ 뉴스 목록 조회
- ✅ 검색 기능

---

## 🚀 배포

### 1. Vercel 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:

```env
SUPABASE_URL=https://uzdfqhmdrzcwylnfbxku.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-your-openai-api-key
ENABLE_CRON_JOBS=true
NEWS_FETCH_INTERVAL=30
```

### 2. 백그라운드 작업 설정

#### Vercel Cron Jobs (권장)
`vercel.json` 파일 생성:

```json
{
  "crons": [
    {
      "path": "/api/cron/news-crawler",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/gpt-posts",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

#### 별도 서버 (대안)
```bash
# VPS나 클라우드 서버에서
git clone your-repo
cd your-repo
npm install
pm2 start news-rss-crawler.js
pm2 start gpt-post-generator.js
```

### 3. 도메인 설정

- 메인 도메인: `https://coindex.ai`
- API 도메인: `https://api.coindex.ai`
- 대시보드: `https://admin.coindex.ai`

---

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. RLS 정책 오류
```
Error: new row violates row-level security policy
```

**해결방법:**
```sql
-- 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- 정책 재생성
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts" ON posts 
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 2. 외래 키 제약 조건 오류
```
Error: insert or update on table "posts" violates foreign key constraint
```

**해결방법:**
```sql
-- 참조 무결성 확인
SELECT p.id, p.user_id 
FROM posts p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE u.id IS NULL;

-- 문제 데이터 수정 또는 삭제
```

#### 3. 마이그레이션 중단
```
Error: Request timeout
```

**해결방법:**
```bash
# 배치 크기 줄이기
# data-migration.js에서 batchSize를 500 → 100으로 변경

# 네트워크 타임아웃 늘리기
# CONFIG.timeout을 60000으로 설정
```

#### 4. RSS 크롤링 실패
```
Error: RSS parsing failed
```

**해결방법:**
```javascript
// User-Agent 변경
headers: {
  'User-Agent': 'Mozilla/5.0 (compatible; COINDEX-Bot/1.0)'
}

// 타임아웃 늘리기
timeout: 60000
```

### 로그 확인 방법

```bash
# 마이그레이션 로그
tail -f migration.log

# 크롤러 로그
pm2 logs coindex-news-crawler

# Supabase 로그
# Supabase 대시보드 → Logs → API/Database
```

### 성능 최적화

```sql
-- 인덱스 사용률 확인
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- 느린 쿼리 확인
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **환경 변수**: `.env` 파일의 모든 값이 올바른지 확인
2. **네트워크**: Supabase와의 연결이 정상인지 확인
3. **권한**: Service Key가 올바른 권한을 가지고 있는지 확인
4. **로그**: 상세한 오류 메시지 확인

**연락처:**
- 이메일: admin@coindex.ai
- GitHub Issues: https://github.com/coindex/migration-tools/issues

---

## 🎉 완료!

모든 단계를 완료하면 COINDEX 통합 데이터베이스가 준비됩니다:

- ✅ 통합된 사용자 시스템
- ✅ 실시간 뉴스 수집
- ✅ GPT 자동 글 생성
- ✅ 확장 가능한 아키텍처
- ✅ 최적화된 성능

**다음 단계:**
1. 프론트엔드 연동 테스트
2. 사용자 피드백 수집
3. 추가 기능 개발
4. 모니터링 시스템 구축 