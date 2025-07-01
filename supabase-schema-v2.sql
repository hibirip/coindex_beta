-- 예약된 GPT 글 테이블 (새로 추가)
CREATE TABLE IF NOT EXISTS gpt_scheduled_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    writing_style VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_gpt_scheduled_posts_scheduled_time ON gpt_scheduled_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_gpt_scheduled_posts_is_published ON gpt_scheduled_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_gpt_scheduled_posts_published_at ON gpt_scheduled_posts(published_at DESC);

-- 기존 posts 테이블에 컬럼 추가 (있으면 무시)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS gpt_scheduled_id UUID REFERENCES gpt_scheduled_posts(id);

-- RLS 정책 추가
ALTER TABLE gpt_scheduled_posts ENABLE ROW LEVEL SECURITY;

-- 예약된 글은 모두 볼 수 있음
CREATE POLICY IF NOT EXISTS "Anyone can view scheduled posts" ON gpt_scheduled_posts
    FOR SELECT USING (true);

-- 서비스 롤만 예약된 글 관리 가능
CREATE POLICY IF NOT EXISTS "Service role can manage scheduled posts" ON gpt_scheduled_posts
    FOR ALL USING (true); 