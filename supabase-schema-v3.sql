-- 기존 posts 테이블에 예약 시스템 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 기존 게시글들은 모두 발행된 상태로 설정
UPDATE posts SET is_published = true WHERE is_published IS NULL;

-- 예약된 글 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(is_published, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_posts_published_time ON posts(is_published, created_at);

-- 가상 사용자들을 위한 기본 데이터 (선택사항)
-- 실행 시 자동으로 생성되므로 주석 처리

/*
INSERT INTO users (email, password, name, nickname, phone, gradient_colors) VALUES
('minsu.kim@crypto.com', 'virtual_user_2024', '김민수', '코인왕', '010-0000-0000', '["#667eea", "#764ba2"]'),
('seohyun.park@defi.io', 'virtual_user_2024', '박서현', '알트알트', '010-0000-0000', '["#f093fb", "#f5576c"]'),
('junho.lee@trader.net', 'virtual_user_2024', '이준호', '에렌예거', '010-0000-0000', '["#4facfe", "#00f2fe"]'),
('yujin.choi@nft.world', 'virtual_user_2024', '최유진', '유진언니', '010-0000-0000', '["#43e97b", "#38f9d7"]'),
('taehyun.kang@chart.pro', 'virtual_user_2024', '강태현', '태현의차트분석', '010-0000-0000', '["#fa709a", "#fee140"]'),
('haeun.song@global.crypto', 'virtual_user_2024', '송하은', '하은쓰', '010-0000-0000', '["#a8edea", "#fed6e3"]'),
('jaewoo.jung@mining.co', 'virtual_user_2024', '정재우', '재우형', '010-0000-0000', '["#d299c2", "#fef9d7"]'),
('soyoung.yoon@family.invest', 'virtual_user_2024', '윤소영', '소영맘', '010-0000-0000', '["#89f7fe", "#66a6ff"]'),
('seongmin.hong@startup.kr', 'virtual_user_2024', '홍성민', '성민이형', '010-0000-0000', '["#ffecd2", "#fcb69f"]'),
('dahye.lim@economics.ac', 'virtual_user_2024', '임다혜', '다혜의코인일기', '010-0000-0000', '["#a18cd1", "#fbc2eb"]')
ON CONFLICT (email) DO NOTHING;
*/ 