// ================================================
// 🚀 COINDEX 데이터 마이그레이션 스크립트
// 3개 Supabase 프로젝트 → 1개 통합 프로젝트
// ================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ================================================
// 🔧 설정 (환경변수에서 가져오기)
// ================================================
const CONFIG = {
  // 🎯 새로운 통합 프로젝트 (타겟)
  TARGET: {
    url: process.env.SUPABASE_URL || 'https://uzdfqhmdrzcwylnfbxku.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZGZxaG1kcnpjd3lsbmZieGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTEyNywiZXhwIjoyMDY2ODg3MTI3fQ.o6nt5SH_-q_sihUECv7yXGditr4A3eV1Ea9QD_OHeDs'
  },
  
  // 📊 기존 프로젝트들 (소스)
  SOURCES: {
    COMM: {
      url: process.env.SOURCE_COMM_URL || 'https://your-comm-project.supabase.co',
      serviceKey: process.env.SOURCE_COMM_KEY || 'your-comm-service-key'
    },
    NEWS: {
      url: process.env.SOURCE_NEWS_URL || 'https://your-news-project.supabase.co',
      serviceKey: process.env.SOURCE_NEWS_KEY || 'your-news-service-key'
    }
  }
};

// ================================================
// 🔌 Supabase 클라이언트 생성
// ================================================
const targetClient = createClient(CONFIG.TARGET.url, CONFIG.TARGET.serviceKey);
const commClient = createClient(CONFIG.SOURCES.COMM.url, CONFIG.SOURCES.COMM.serviceKey);
const newsClient = createClient(CONFIG.SOURCES.NEWS.url, CONFIG.SOURCES.NEWS.serviceKey);

// ================================================
// 📝 로깅 유틸리티
// ================================================
const log = {
  info: (msg) => console.log(`✅ ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.log(`❌ ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.log(`⚠️ ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`🎉 ${new Date().toISOString()} - ${msg}`)
};

// ================================================
// 🔄 데이터 마이그레이션 함수들
// ================================================

/**
 * 1️⃣ Users 테이블 마이그레이션
 */
async function migrateUsers() {
  log.info('👥 Users 마이그레이션 시작...');
  
  try {
    // 기존 comm 프로젝트에서 users 데이터 가져오기
    const { data: sourceUsers, error: fetchError } = await commClient
      .from('users')
      .select('*');
    
    if (fetchError) {
      log.error(`Users 데이터 가져오기 실패: ${fetchError.message}`);
      return false;
    }
    
    if (!sourceUsers || sourceUsers.length === 0) {
      log.warn('마이그레이션할 Users 데이터가 없습니다.');
      return true;
    }
    
    // 데이터 변환 (필요시 필드 매핑)
    const transformedUsers = sourceUsers.map(user => ({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      nickname: user.nickname,
      phone: user.phone,
      gradient_colors: user.gradient_colors || '["#3B82F6", "#8B5CF6"]',
      avatar_url: user.avatar_url,
      bio: user.bio,
      is_active: user.is_active !== false, // 기본값 true
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
    
    // 배치 단위로 삽입 (500개씩)
    const batchSize = 500;
    let successCount = 0;
    
    for (let i = 0; i < transformedUsers.length; i += batchSize) {
      const batch = transformedUsers.slice(i, i + batchSize);
      
      const { error: insertError } = await targetClient
        .from('users')
        .upsert(batch, { onConflict: 'id' });
      
      if (insertError) {
        log.error(`Users 배치 ${i}-${i + batch.length} 삽입 실패: ${insertError.message}`);
      } else {
        successCount += batch.length;
        log.info(`Users 배치 ${i}-${i + batch.length} 삽입 완료`);
      }
    }
    
    log.success(`👥 Users 마이그레이션 완료: ${successCount}/${sourceUsers.length}`);
    return true;
    
  } catch (error) {
    log.error(`Users 마이그레이션 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 2️⃣ Posts 테이블 마이그레이션
 */
async function migratePosts() {
  log.info('📝 Posts 마이그레이션 시작...');
  
  try {
    const { data: sourcePosts, error: fetchError } = await commClient
      .from('posts')
      .select('*');
    
    if (fetchError) {
      log.error(`Posts 데이터 가져오기 실패: ${fetchError.message}`);
      return false;
    }
    
    if (!sourcePosts || sourcePosts.length === 0) {
      log.warn('마이그레이션할 Posts 데이터가 없습니다.');
      return true;
    }
    
    const transformedPosts = sourcePosts.map(post => ({
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      category: post.category || 'general',
      tags: post.tags || [],
      image_urls: post.image_urls || [],
      view_count: post.view_count || 0,
      like_count: 0, // 좋아요는 별도 마이그레이션 후 계산
      comment_count: 0, // 댓글도 별도 마이그레이션 후 계산
      is_pinned: post.is_pinned || false,
      is_deleted: post.is_deleted || false,
      created_at: post.created_at,
      updated_at: post.updated_at
    }));
    
    const batchSize = 500;
    let successCount = 0;
    
    for (let i = 0; i < transformedPosts.length; i += batchSize) {
      const batch = transformedPosts.slice(i, i + batchSize);
      
      const { error: insertError } = await targetClient
        .from('posts')
        .upsert(batch, { onConflict: 'id' });
      
      if (insertError) {
        log.error(`Posts 배치 ${i}-${i + batch.length} 삽입 실패: ${insertError.message}`);
      } else {
        successCount += batch.length;
        log.info(`Posts 배치 ${i}-${i + batch.length} 삽입 완료`);
      }
    }
    
    log.success(`📝 Posts 마이그레이션 완료: ${successCount}/${sourcePosts.length}`);
    return true;
    
  } catch (error) {
    log.error(`Posts 마이그레이션 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 3️⃣ Likes 테이블 마이그레이션
 */
async function migrateLikes() {
  log.info('👍 Likes 마이그레이션 시작...');
  
  try {
    const { data: sourceLikes, error: fetchError } = await commClient
      .from('likes')
      .select('*');
    
    if (fetchError) {
      log.error(`Likes 데이터 가져오기 실패: ${fetchError.message}`);
      return false;
    }
    
    if (!sourceLikes || sourceLikes.length === 0) {
      log.warn('마이그레이션할 Likes 데이터가 없습니다.');
      return true;
    }
    
    const transformedLikes = sourceLikes.map(like => ({
      id: like.id,
      post_id: like.post_id,
      user_id: like.user_id,
      created_at: like.created_at
    }));
    
    const batchSize = 1000;
    let successCount = 0;
    
    for (let i = 0; i < transformedLikes.length; i += batchSize) {
      const batch = transformedLikes.slice(i, i + batchSize);
      
      const { error: insertError } = await targetClient
        .from('likes')
        .upsert(batch, { onConflict: 'id' });
      
      if (insertError) {
        log.error(`Likes 배치 ${i}-${i + batch.length} 삽입 실패: ${insertError.message}`);
      } else {
        successCount += batch.length;
        log.info(`Likes 배치 ${i}-${i + batch.length} 삽입 완료`);
      }
    }
    
    log.success(`👍 Likes 마이그레이션 완료: ${successCount}/${sourceLikes.length}`);
    return true;
    
  } catch (error) {
    log.error(`Likes 마이그레이션 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 4️⃣ News 테이블 마이그레이션
 */
async function migrateNews() {
  log.info('📰 News 마이그레이션 시작...');
  
  try {
    const { data: sourceNews, error: fetchError } = await newsClient
      .from('news')
      .select('*');
    
    if (fetchError) {
      log.error(`News 데이터 가져오기 실패: ${fetchError.message}`);
      return false;
    }
    
    if (!sourceNews || sourceNews.length === 0) {
      log.warn('마이그레이션할 News 데이터가 없습니다.');
      return true;
    }
    
    const transformedNews = sourceNews.map(news => ({
      id: news.id,
      title: news.title,
      summary: news.summary,
      content: news.content,
      link: news.link,
      thumbnail: news.thumbnail,
      source: news.source,
      category: news.category || 'general',
      tags: news.tags || [],
      published_at: news.published_at,
      view_count: news.view_count || 0,
      is_featured: news.is_featured || false,
      created_at: news.created_at,
      updated_at: news.updated_at
    }));
    
    const batchSize = 500;
    let successCount = 0;
    
    for (let i = 0; i < transformedNews.length; i += batchSize) {
      const batch = transformedNews.slice(i, i + batchSize);
      
      const { error: insertError } = await targetClient
        .from('news')
        .upsert(batch, { onConflict: 'id' });
      
      if (insertError) {
        log.error(`News 배치 ${i}-${i + batch.length} 삽입 실패: ${insertError.message}`);
      } else {
        successCount += batch.length;
        log.info(`News 배치 ${i}-${i + batch.length} 삽입 완료`);
      }
    }
    
    log.success(`📰 News 마이그레이션 완료: ${successCount}/${sourceNews.length}`);
    return true;
    
  } catch (error) {
    log.error(`News 마이그레이션 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 5️⃣ 좋아요 카운트 업데이트
 */
async function updateLikeCounts() {
  log.info('🔄 좋아요 카운트 업데이트 시작...');
  
  try {
    // 각 게시글의 좋아요 수 계산 및 업데이트
    const { error } = await targetClient.rpc('update_all_like_counts');
    
    if (error) {
      // RPC 함수가 없으면 직접 업데이트
      const { data: posts } = await targetClient.from('posts').select('id');
      
      for (const post of posts || []) {
        const { count } = await targetClient
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        await targetClient
          .from('posts')
          .update({ like_count: count || 0 })
          .eq('id', post.id);
      }
    }
    
    log.success('🔄 좋아요 카운트 업데이트 완료');
    return true;
    
  } catch (error) {
    log.error(`좋아요 카운트 업데이트 중 오류: ${error.message}`);
    return false;
  }
}

/**
 * 6️⃣ 데이터 검증
 */
async function validateMigration() {
  log.info('🔍 마이그레이션 검증 시작...');
  
  try {
    const tables = ['users', 'posts', 'likes', 'news'];
    const results = {};
    
    for (const table of tables) {
      const { count, error } = await targetClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        log.error(`${table} 테이블 검증 실패: ${error.message}`);
        results[table] = 'ERROR';
      } else {
        results[table] = count;
        log.info(`${table}: ${count}개 레코드`);
      }
    }
    
    // 결과 파일로 저장
    const reportPath = path.join(__dirname, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      success: Object.values(results).every(v => v !== 'ERROR')
    }, null, 2));
    
    log.success(`🔍 마이그레이션 검증 완료 - 리포트: ${reportPath}`);
    return true;
    
  } catch (error) {
    log.error(`마이그레이션 검증 중 오류: ${error.message}`);
    return false;
  }
}

// ================================================
// 🚀 메인 마이그레이션 실행
// ================================================
async function runMigration() {
  log.info('🚀 COINDEX 데이터 마이그레이션 시작');
  
  const startTime = Date.now();
  const results = {};
  
  try {
    // 1. Users 마이그레이션
    results.users = await migrateUsers();
    
    // 2. Posts 마이그레이션
    results.posts = await migratePosts();
    
    // 3. Likes 마이그레이션
    results.likes = await migrateLikes();
    
    // 4. News 마이그레이션
    results.news = await migrateNews();
    
    // 5. 좋아요 카운트 업데이트
    results.likeCounts = await updateLikeCounts();
    
    // 6. 검증
    results.validation = await validateMigration();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    if (successCount === totalCount) {
      log.success(`🎉 마이그레이션 완료! (${duration}초 소요)`);
      log.success(`✅ 모든 단계 성공: ${successCount}/${totalCount}`);
    } else {
      log.warn(`⚠️ 마이그레이션 부분 완료: ${successCount}/${totalCount} (${duration}초 소요)`);
      log.warn('실패한 단계:', Object.entries(results).filter(([_, success]) => !success).map(([step]) => step));
    }
    
    return results;
    
  } catch (error) {
    log.error(`마이그레이션 중 치명적 오류: ${error.message}`);
    return results;
  }
}

// ================================================
// 📊 JSON 데이터 직접 삽입 함수 (백업용)
// ================================================
async function insertFromJSON(tableName, jsonData) {
  log.info(`📊 ${tableName} JSON 데이터 삽입 시작...`);
  
  try {
    if (!Array.isArray(jsonData)) {
      log.error(`${tableName}: 유효하지 않은 JSON 데이터 형식`);
      return false;
    }
    
    const batchSize = 500;
    let successCount = 0;
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      
      const { error } = await targetClient
        .from(tableName)
        .upsert(batch);
      
      if (error) {
        log.error(`${tableName} 배치 ${i}-${i + batch.length} 삽입 실패: ${error.message}`);
      } else {
        successCount += batch.length;
        log.info(`${tableName} 배치 ${i}-${i + batch.length} 삽입 완료`);
      }
    }
    
    log.success(`📊 ${tableName} JSON 삽입 완료: ${successCount}/${jsonData.length}`);
    return true;
    
  } catch (error) {
    log.error(`${tableName} JSON 삽입 중 오류: ${error.message}`);
    return false;
  }
}

// ================================================
// 🔧 명령행 인터페이스
// ================================================
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      runMigration();
      break;
    case 'users':
      migrateUsers();
      break;
    case 'posts':
      migratePosts();
      break;
    case 'likes':
      migrateLikes();
      break;
    case 'news':
      migrateNews();
      break;
    case 'validate':
      validateMigration();
      break;
    case 'json':
      const tableName = process.argv[3];
      const jsonFile = process.argv[4];
      if (!tableName || !jsonFile) {
        console.log('사용법: node data-migration.js json <table_name> <json_file>');
        process.exit(1);
      }
      const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      insertFromJSON(tableName, jsonData);
      break;
    default:
      console.log(`
🚀 COINDEX 데이터 마이그레이션 도구

사용법:
  node data-migration.js migrate     # 전체 마이그레이션 실행
  node data-migration.js users       # Users 테이블만 마이그레이션
  node data-migration.js posts       # Posts 테이블만 마이그레이션
  node data-migration.js likes       # Likes 테이블만 마이그레이션
  node data-migration.js news        # News 테이블만 마이그레이션
  node data-migration.js validate    # 마이그레이션 검증
  node data-migration.js json <table> <file.json>  # JSON 파일에서 직접 삽입

환경변수:
  SUPABASE_URL              # 타겟 Supabase URL
  SUPABASE_SERVICE_KEY      # 타겟 Supabase Service Key
  SOURCE_COMM_URL           # 소스 커뮤니티 프로젝트 URL
  SOURCE_COMM_KEY           # 소스 커뮤니티 프로젝트 Key
  SOURCE_NEWS_URL           # 소스 뉴스 프로젝트 URL
  SOURCE_NEWS_KEY           # 소스 뉴스 프로젝트 Key
      `);
      break;
  }
}

module.exports = {
  runMigration,
  migrateUsers,
  migratePosts,
  migrateLikes,
  migrateNews,
  validateMigration,
  insertFromJSON
}; 