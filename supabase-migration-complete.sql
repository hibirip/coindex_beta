-- ================================================
-- 🚀 COINDEX 통합 마이그레이션 SQL
-- 3개 Supabase 프로젝트 → 1개 통합 프로젝트
-- ================================================

-- ✨ 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 🗑️ 기존 테이블 삭제 (필요시)
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================================================
-- 👥 USERS 테이블 (메인 사용자 정보)
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(100),
    nickname VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    gradient_colors VARCHAR(255) DEFAULT '["#3B82F6", "#8B5CF6"]',
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📝 USERS 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ================================================
-- 📰 NEWS 테이블 (코인 뉴스)
-- ================================================
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    link TEXT UNIQUE,
    thumbnail TEXT,
    source VARCHAR(100),
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    published_at TEXT,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📝 NEWS 인덱스
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_created_at ON news(created_at DESC);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_featured ON news(is_featured) WHERE is_featured = true;
CREATE INDEX idx_news_link ON news(link);
CREATE INDEX idx_news_title_search ON news USING gin(to_tsvector('korean', title));
CREATE INDEX idx_news_content_search ON news USING gin(to_tsvector('korean', coalesce(content, summary)));

-- ================================================
-- 📝 POSTS 테이블 (사용자 게시글)
-- ================================================
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    tags TEXT[],
    image_urls TEXT[],
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📝 POSTS 인덱스
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_pinned ON posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_posts_active ON posts(is_deleted) WHERE is_deleted = false;
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_title_search ON posts USING gin(to_tsvector('korean', coalesce(title, '')));
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('korean', content));

-- ================================================
-- 👍 LIKES 테이블 (좋아요)
-- ================================================
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 📝 LIKES 인덱스
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

-- ================================================
-- 💬 COMMENTS 테이블 (댓글 - 추가 기능)
-- ================================================
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 📝 COMMENTS 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- ================================================
-- 🔧 트리거 함수 (업데이트 시간 자동 갱신)
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================
-- 🔧 좋아요 카운트 자동 업데이트 트리거
-- ================================================
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE PROCEDURE update_post_like_count();

-- ================================================
-- 🔧 댓글 카운트 자동 업데이트 트리거
-- ================================================
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE PROCEDURE update_post_comment_count();

-- ================================================
-- 🔒 RLS (Row Level Security) 정책
-- ================================================

-- USERS 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- POSTS 테이블 RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- LIKES 테이블 RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- COMMENTS 테이블 RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- NEWS 테이블 RLS (공개 읽기)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view news" ON news FOR SELECT USING (true);

-- ================================================
-- 📊 통계 뷰 (성능 최적화)
-- ================================================
CREATE VIEW popular_posts AS
SELECT 
    p.*,
    u.nickname,
    u.gradient_colors,
    u.avatar_url
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.is_deleted = false
ORDER BY p.like_count DESC, p.created_at DESC;

CREATE VIEW latest_news AS
SELECT *
FROM news
ORDER BY created_at DESC
LIMIT 50;

CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.nickname,
    COUNT(p.id) as post_count,
    COALESCE(SUM(p.like_count), 0) as total_likes
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.is_deleted = false
GROUP BY u.id, u.nickname;

-- ================================================
-- 🎯 샘플 데이터 (테스트용)
-- ================================================
-- AI 분석가 계정 생성
INSERT INTO users (id, email, nickname, name, gradient_colors, bio) VALUES 
('00000000-0000-0000-0000-000000000001', 'gpt@coindex.ai', 'AI 분석가', 'COINDEX AI', '["#FF6B6B", "#4ECDC4"]', '24시간 코인 시장을 분석하는 AI 분석가입니다.'),
('00000000-0000-0000-0000-000000000002', 'admin@coindex.ai', '관리자', 'COINDEX 관리자', '["#FFD93D", "#FF6B6B"]', 'COINDEX 플랫폼 관리자입니다.');

-- 샘플 뉴스 데이터
INSERT INTO news (title, summary, link, thumbnail, source, category) VALUES 
('비트코인 가격 급등, 새로운 최고치 경신', '비트코인이 새로운 역사적 최고치를 기록하며 투자자들의 관심을 끌고 있습니다.', 'https://example.com/news1', 'https://example.com/thumb1.jpg', 'CoinDesk', 'bitcoin'),
('이더리움 2.0 업그레이드 완료, 네트워크 성능 대폭 향상', '이더리움의 주요 업그레이드가 성공적으로 완료되어 거래 속도와 효율성이 크게 개선되었습니다.', 'https://example.com/news2', 'https://example.com/thumb2.jpg', 'CoinTelegraph', 'ethereum');

-- 샘플 게시글 데이터
INSERT INTO posts (user_id, title, content, category) VALUES 
('00000000-0000-0000-0000-000000000001', '비트코인 기술적 분석 - 상승 신호 포착', '최근 비트코인 차트를 분석한 결과, 강력한 상승 신호가 나타나고 있습니다. RSI 지표와 이동평균선 분석을 통해...', 'analysis'),
('00000000-0000-0000-0000-000000000001', '알트코인 시즌 도래? 주요 지표 분석', '비트코인 도미넌스 하락과 함께 알트코인들이 강세를 보이고 있습니다. 이번 분석에서는...', 'analysis');

-- ================================================
-- 📈 성능 모니터링 쿼리
-- ================================================
-- 인덱스 사용률 확인
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC;

-- 테이블 크기 확인
-- SELECT schemaname, tablename, pg_total_relation_size(schemaname||'.'||tablename) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY size DESC;

-- ================================================
-- ✅ 마이그레이션 완료
-- ================================================
-- 이 SQL을 실행하면 COINDEX 통합 데이터베이스가 완성됩니다.
-- 다음 단계: 기존 데이터 마이그레이션 스크립트 실행 