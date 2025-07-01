import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase 설정
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 글쓰기 주제 (확장된 목록)
const topics = [
  '비트코인 가격 분석과 향후 전망',
  '이더리움 2.0과 스테이킹 전략',
  '알트코인 시장 동향 분석',
  'DeFi 프로토콜 수익률 비교',
  'NFT 시장의 최신 트렌드',
  '중앙은행 디지털화폐(CBDC) 영향',
  '암호화폐 규제 동향과 시장 반응',
  '레이어2 솔루션 비교 분석',
  '메타버스 토큰 투자 가이드',
  '웹3.0 관련 암호화폐 전망',
  '기관 투자자들의 암호화폐 채택',
  '스테이블코인 시장 분석',
  '크로스체인 브릿지 보안 이슈',
  '암호화폐 마이닝 산업 변화',
  '탈중앙화 거래소(DEX) 비교',
  '게임파이(GameFi) 토큰 분석',
  '소셜 토큰과 커뮤니티 경제',
  '암호화폐 세금 및 회계 처리',
  '블록체인 인터넷 혁명',
  '암호화폐 파생상품 거래 전략'
];

// 글쓰기 스타일
const writingStyles = [
  { style: '전문 분석가', tone: '데이터 중심의 객관적' },
  { style: '친근한 가이드', tone: '초보자도 이해하기 쉬운' },
  { style: '시장 전문가', tone: '경험에 기반한 실용적' },
  { style: '트렌드 헌터', tone: '최신 동향에 민감한' },
  { style: '리스크 매니저', tone: '신중하고 보수적' },
  { style: '기술 분석가', tone: '차트와 지표 중심' },
  { style: '펀더멘털 분석가', tone: '기본가치 중심' }
];

// GPT 사용자 생성/조회
async function ensureGPTUser() {
  try {
    // 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'gpt@coindex.ai')
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // Auth에서 기존 사용자 찾기
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers?.users?.find(user => user.email === 'gpt@coindex.ai');
    
    let authUserId = existingAuthUser?.id;

    // 기존 Auth 사용자가 없으면 생성
    if (!authUserId) {
      const { data: authData } = await supabase.auth.admin.createUser({
        email: 'gpt@coindex.ai',
        password: Math.random().toString(36).slice(-16),
        email_confirm: true,
        user_metadata: { name: 'AI 분석가', nickname: 'AI 분석가' }
      });
      authUserId = authData.user.id;
    }

    // Users 테이블에 추가
    const { data: userData } = await supabase.from('users').insert({
      id: authUserId,
      email: 'gpt@coindex.ai',
      password: 'gpt_auto_password_2024',
      name: 'AI 분석가',
      nickname: 'AI 분석가',
      phone: '010-0000-0000',
      gradient_colors: JSON.stringify(['#667eea', '#764ba2'])
    }).select().single();

    console.log('✅ GPT 사용자 준비 완료:', authUserId);
    return authUserId;

  } catch (error) {
    console.error('GPT 사용자 생성 오류:', error);
    return null;
  }
}

// 단일 글 생성
async function generateSinglePost() {
  try {
    const style = writingStyles[Math.floor(Math.random() * writingStyles.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 COINDEX의 전문 암호화폐 시장 분석가입니다. ${style.style} 문체로 ${style.tone} 글을 작성합니다. 
          한국어로 작성하고, 실제 투자자들에게 도움이 되는 실용적인 정보를 제공하세요.
          제목은 50자 이내로, 본문은 400-600자 정도로 작성해주세요.`
        },
        {
          role: "user", 
          content: `"${topic}"에 대한 분석글을 작성해주세요.
          
          형식:
          제목: [흥미로운 제목]
          
          본문:
          [2-3문단으로 구성된 분석 내용]
          
          실용적인 정보와 투자 인사이트를 포함해주세요.`
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    
    // 제목과 본문 분리
    const titleMatch = response.match(/제목:\s*(.+)/);
    const contentMatch = response.match(/본문:\s*([\s\S]+)/);
    
    let title = titleMatch ? titleMatch[1].trim() : topic;
    let content = contentMatch ? contentMatch[1].trim() : response;

    // 제목 길이 조정
    if (title.length > 70) {
      title = title.substring(0, 67) + '...';
    }

    // 본문 정리
    content = content
      .replace(/^제목:.+$/gm, '')
      .replace(/^본문:\s*/gm, '')
      .trim();

    return {
      title,
      content,
      topic,
      writing_style: style.style
    };

  } catch (error) {
    console.error('글 생성 오류:', error);
    return null;
  }
}

// 10개 글 배치 생성 및 예약
async function generateBatchPosts() {
  console.log('📝 10개 분석글 배치 생성 시작...');
  
  const posts = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    console.log(`   글 ${i + 1}/10 생성 중...`);
    
    const post = await generateSinglePost();
    if (post) {
      // 1분~10분 사이 랜덤 시간 설정
      const randomMinutes = Math.floor(Math.random() * 10) + 1;
      const scheduledTime = new Date(now.getTime() + (randomMinutes * 60 * 1000));
      
      posts.push({
        ...post,
        scheduled_time: scheduledTime.toISOString()
      });
    }
    
    // API 제한 방지를 위한 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 데이터베이스에 저장
  if (posts.length > 0) {
    const { data, error } = await supabase
      .from('gpt_scheduled_posts')
      .insert(posts)
      .select();

    if (error) {
      console.error('❌ 배치 글 저장 실패:', error);
    } else {
      console.log(`✅ ${posts.length}개 분석글 예약 완료!`);
      console.log('📅 업로드 예정 시간:');
      posts.forEach((post, index) => {
        const time = new Date(post.scheduled_time).toLocaleString('ko-KR');
        console.log(`   ${index + 1}. "${post.title}" - ${time}`);
      });
    }
  }
}

// 예약된 글 업로드
async function publishScheduledPosts() {
  try {
    const now = new Date();
    
    // 업로드 시간이 된 예약 글 조회
    const { data: readyPosts, error } = await supabase
      .from('gpt_scheduled_posts')
      .select('*')
      .eq('is_published', false)
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true });

    if (error || !readyPosts || readyPosts.length === 0) {
      return;
    }

    const gptUserId = await ensureGPTUser();
    if (!gptUserId) {
      console.error('❌ GPT 사용자를 찾을 수 없습니다.');
      return;
    }

    for (const scheduledPost of readyPosts) {
      // posts 테이블에 실제 글 생성
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: gptUserId,
          title: scheduledPost.title,
          content: scheduledPost.content,
          is_gpt: true,
          gpt_scheduled_id: scheduledPost.id
        })
        .select()
        .single();

      if (postError) {
        console.error('❌ 글 업로드 실패:', postError);
        continue;
      }

      // 예약 글을 발행됨으로 표시
      await supabase
        .from('gpt_scheduled_posts')
        .update({
          is_published: true,
          published_at: now.toISOString()
        })
        .eq('id', scheduledPost.id);

      console.log(`📤 글 업로드 완료: "${scheduledPost.title}"`);
      console.log(`🆔 포스트 ID: ${newPost.id}`);
    }

  } catch (error) {
    console.error('❌ 예약 글 업로드 오류:', error);
  }
}

// 시스템 상태 확인
async function checkSystemHealth() {
  try {
    // 데이터베이스 연결 확인
    const { data, error } = await supabase.from('posts').select('count').limit(1);
    if (error) throw error;

    // 예약된 글 상태 확인
    const { data: scheduledCount } = await supabase
      .from('gpt_scheduled_posts')
      .select('id', { count: 'exact' })
      .eq('is_published', false);

    console.log('✅ 시스템 상태 정상');
    console.log(`📋 대기 중인 예약 글: ${scheduledCount?.length || 0}개`);
    
    return true;
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);
    return false;
  }
}

// 메인 시스템
async function main() {
  console.log('🚀 COINDEX AI 고급 분석가 시스템 시작!');
  console.log('📋 시스템 기능:');
  console.log('   • 2시간마다 10개 분석글 미리 생성');
  console.log('   • 1~10분 랜덤 간격으로 자동 업로드');
  console.log('   • 자연스러운 커뮤니티 활동 시뮬레이션');
  
  // 환경변수 확인
  if (!process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ 환경변수를 설정해주세요:');
    console.error('   - SUPABASE_SERVICE_KEY');
    console.error('   - OPENAI_API_KEY');
    process.exit(1);
  }

  // 시스템 상태 확인
  const isHealthy = await checkSystemHealth();
  if (!isHealthy) {
    console.error('❌ 시스템 상태가 불안정합니다.');
    process.exit(1);
  }

  // GPT 사용자 준비
  await ensureGPTUser();

  // 즉시 첫 배치 생성
  console.log('🔥 첫 번째 배치 글 생성 중...');
  await generateBatchPosts();

  // 2시간마다 10개 글 생성 (0분에 실행)
  cron.schedule('0 */2 * * *', async () => {
    const now = new Date();
    console.log(`\n⏰ [${now.toLocaleString('ko-KR')}] 정기 배치 글 생성`);
    await generateBatchPosts();
  });

  // 1분마다 예약된 글 업로드 확인
  cron.schedule('* * * * *', async () => {
    await publishScheduledPosts();
  });

  console.log('✅ AI 고급 분석가 시스템이 가동되었습니다!');
  console.log('   Ctrl+C를 눌러 종료할 수 있습니다.');
  console.log('\n📊 실시간 로그:');
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 AI 고급 분석가 시스템을 종료합니다...');
  process.exit(0);
});

// 시스템 시작
main().catch(console.error); 