import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

// OpenAI 설정 (무료 대안 텍스트 생성기 포함)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase 설정
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 암호화폐 분석 주제 (실제 시장 관련)
const topics = [
  '비트코인 가격 급등 원인 분석',
  '이더리움 가스비 최적화 전략',
  '알트코인 시즌 진입 신호',
  'DeFi 수익률 파밍 가이드',
  'NFT 시장 붕괴 후 회복 전망',
  '스테이블코인 디페깅 리스크',
  '중앙은행 금리와 암호화폐',
  '기관투자자 비트코인 매집',
  '레이어2 생태계 성장 분석',
  '웹3 게임 토큰 투자 전략',
  '크로스체인 브릿지 보안 이슈',
  '암호화폐 세금 절약 방법',
  '메타버스 토큰 장기 전망',
  '탈중앙화 거래소 수수료 비교',
  '스테이킹 보상률 최대화'
];

// 다양한 글쓰기 스타일
const writingStyles = [
  { style: '전문 분석가', tone: '차트와 데이터 중심' },
  { style: '친근한 멘토', tone: '초보자도 이해하기 쉬운' },
  { style: '현실적 투자자', tone: '실전 경험 기반' },
  { style: '신중한 전문가', tone: '리스크 중심' },
  { style: '트렌드 분석가', tone: '최신 동향 파악' }
];

// GPT 사용자 확인/생성
async function ensureGPTUser() {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'gpt@coindex.ai')
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // 새 사용자 생성 (Auth 없이 직접)
    const { data: newUser } = await supabase.from('users').insert({
      email: 'gpt@coindex.ai',
      password: 'gpt_auto_2024',
      name: 'AI 분석가',
      nickname: 'AI 분석가',
      phone: '010-0000-0000',
      gradient_colors: JSON.stringify(['#667eea', '#764ba2'])
    }).select().single();

    console.log('✅ GPT 사용자 생성:', newUser.id);
    return newUser.id;

  } catch (error) {
    console.error('GPT 사용자 오류:', error);
    return null;
  }
}

// 텍스트 기반 글 생성 (OpenAI API 대안)
function generateOfflinePost() {
  const style = writingStyles[Math.floor(Math.random() * writingStyles.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  const templates = [
    {
      title: `${topic} - 이번 주 핵심 포인트`,
      content: `안녕하세요, AI 분석가입니다! 🤖

📊 **${topic}**에 대해 분석해보겠습니다.

**현재 시장 상황:**
- 최근 거래량이 크게 증가하고 있습니다
- 기술적 지표들이 긍정적 신호를 보이고 있어요
- 기관투자자들의 관심도 높아지는 추세입니다

**투자 포인트:**
1. 단기적으로는 변동성이 클 수 있으니 주의하세요
2. 장기 관점에서는 상승 여력이 있어 보입니다
3. 리스크 관리를 위해 분할 매수를 추천합니다

**결론:**
시장의 흐름을 잘 관찰하면서 신중하게 접근하시기 바랍니다. 투자에는 항상 위험이 따르니까요! 💡

여러분의 생각은 어떠신가요? 댓글로 의견 나누어 주세요! 👍`
    },
    {
      title: `${topic} 심층 분석 리포트`,
      content: `🔍 **${topic} 분석 보고서**

**주요 동향:**
요즘 이 분야에서 흥미로운 움직임들이 포착되고 있습니다. 특히 최근 몇 주간의 데이터를 보면 분명한 패턴이 나타나고 있어요.

**기술적 분석:**
• 차트상에서 중요한 지지/저항 구간이 형성되었습니다
• 거래량 패턴이 과거 상승기와 유사한 모습을 보입니다
• 단기 이평선들이 긍정적으로 배열되기 시작했어요

**펀더멘털 요소:**
시장의 기본적인 수급 구조도 개선되고 있습니다. 특히 개발팀의 로드맵 진행 상황과 파트너십 확대가 긍정적인 요소로 작용하고 있어요.

**투자 전략:**
- 💚 진입: 현재 구간에서 분할 매수 고려
- 🎯 목표: 단계적 수익 실현 권장  
- ⚠️ 리스크: 전체 시장 변동성 주의

모든 투자 결정은 개인의 판단에 따라 신중히 하시기 바랍니다! 📈`
    }
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    title: template.title,
    content: template.content,
    topic,
    style: style.style
  };
}

// 온라인 GPT 글 생성
async function generateOnlinePost() {
  try {
    const style = writingStyles[Math.floor(Math.random() * writingStyles.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 COINDEX의 암호화폐 전문 분석가입니다. ${style.style} 스타일로 ${style.tone} 글을 작성합니다. 
          한국어로 작성하고, 실제 투자자들에게 유용한 정보를 제공하세요.
          제목은 40자 이내, 본문은 300-500자 정도로 작성해주세요.`
        },
        {
          role: "user",
          content: `"${topic}"에 대한 분석글을 작성해주세요.
          
          형식:
          제목: [간결하고 흥미로운 제목]
          
          본문:
          [커뮤니티 톤의 친근한 분석글]
          
          이모지를 적절히 사용하고, 실용적인 투자 인사이트를 포함해주세요.`
        }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const response = completion.choices[0].message.content;
    
    const titleMatch = response.match(/제목:\s*(.+)/);
    const contentMatch = response.match(/본문:\s*([\s\S]+)/);
    
    let title = titleMatch ? titleMatch[1].trim() : topic;
    let content = contentMatch ? contentMatch[1].trim() : response;

    // 제목 길이 조정
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
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
      style: style.style
    };

  } catch (error) {
    console.log('⚠️ OpenAI API 제한으로 오프라인 모드 사용');
    return generateOfflinePost();
  }
}

// 커뮤니티에 글 업로드
async function postToCommunity() {
  try {
    console.log('🤖 새로운 분석글 생성 중...');

    const gptUserId = await ensureGPTUser();
    if (!gptUserId) {
      console.error('❌ GPT 사용자를 찾을 수 없습니다.');
      return;
    }

    // 글 생성 (OpenAI 또는 오프라인)
    const post = await generateOnlinePost();
    
    if (!post) {
      console.error('❌ 글 생성에 실패했습니다.');
      return;
    }

    console.log(`📝 주제: "${post.topic}"`);
    console.log(`✍️ 스타일: ${post.style}`);

    // 랜덤 좋아요 수 생성 (3~25개)
    const randomLikes = Math.floor(Math.random() * 23) + 3;

    // 커뮤니티 posts 테이블에 저장
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: gptUserId,
        title: post.title,
        content: post.content,
        is_gpt: true,
        likes_count: randomLikes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 글 업로드 실패:', error);
      return;
    }

    console.log('✅ 커뮤니티 글 업로드 성공!');
    console.log(`📌 제목: "${post.title}"`);
    console.log(`❤️ 좋아요: ${randomLikes}개`);
    console.log(`🆔 포스트 ID: ${data.id}`);
    console.log(`⏰ 업로드 시간: ${new Date().toLocaleString('ko-KR')}`);

    // 100개 초과시 오래된 글 삭제
    await cleanupOldPosts();

  } catch (error) {
    console.error('❌ 글 업로드 중 오류:', error);
  }
}

// 오래된 글 정리 (100개 초과시)
async function cleanupOldPosts() {
  try {
    // 전체 글 개수 확인
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (count > 100) {
      console.log(`📊 총 글 수: ${count}개 (100개 초과)`);
      
      // 가장 오래된 글들 조회 (초과분만큼)
      const deleteCount = count - 100;
      const { data: oldPosts } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .order('created_at', { ascending: true })
        .limit(deleteCount);

      if (oldPosts && oldPosts.length > 0) {
        // 관련 좋아요 먼저 삭제
        const postIds = oldPosts.map(post => post.id);
        await supabase
          .from('likes')
          .delete()
          .in('post_id', postIds);

        // 오래된 글들 삭제
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .in('id', postIds);

        if (deleteError) {
          console.error('❌ 오래된 글 삭제 실패:', deleteError);
        } else {
          console.log(`🗑️ 오래된 글 ${deleteCount}개 삭제 완료`);
          console.log(`📝 현재 총 글 수: 100개`);
        }
      }
    }
  } catch (error) {
    console.error('❌ 글 정리 중 오류:', error);
  }
}

// 시스템 상태 확인
async function checkSystemStatus() {
  try {
    const { data: posts } = await supabase.from('posts').select('id, created_at, is_gpt').order('created_at', { ascending: false }).limit(5);
    const { data: users } = await supabase.from('users').select('id').eq('email', 'gpt@coindex.ai').single();
    
    console.log('✅ 시스템 상태 정상');
    console.log(`👤 GPT 사용자: ${users ? '준비완료' : '미생성'}`);
    console.log(`📋 최근 글: ${posts?.length || 0}개`);
    
    if (posts && posts.length > 0) {
      const gptPosts = posts.filter(p => p.is_gpt);
      console.log(`🤖 GPT 글: ${gptPosts.length}개`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 시스템 상태 확인 실패:', error);
    return false;
  }
}

// 메인 시스템
async function main() {
  console.log('🚀 COINDEX 커뮤니티 AI 분석가 시작!');
  console.log('📋 기능:');
  console.log('   • 5~15분 랜덤 간격으로 분석글 업로드');
  console.log('   • 커뮤니티 "최신 분석 토론"에 자동 게시');
  console.log('   • 다양한 주제와 스타일로 자연스러운 글 작성');
  
  // 시스템 상태 확인
  const isHealthy = await checkSystemStatus();
  if (!isHealthy) {
    console.error('❌ 시스템 상태 불안정');
    process.exit(1);
  }

  // GPT 사용자 준비
  await ensureGPTUser();

  // 즉시 첫 글 업로드
  console.log('🔥 첫 번째 분석글 업로드 중...');
  await postToCommunity();

  // 5~15분 랜덤 간격으로 글 업로드
  function scheduleNextPost() {
    const randomMinutes = Math.floor(Math.random() * 11) + 5; // 5~15분
    const nextTime = new Date(Date.now() + randomMinutes * 60 * 1000);
    
    console.log(`⏰ 다음 글 업로드 예정: ${nextTime.toLocaleString('ko-KR')} (${randomMinutes}분 후)`);
    
    setTimeout(async () => {
      console.log(`\n📝 [${new Date().toLocaleString('ko-KR')}] 정기 분석글 업로드`);
      await postToCommunity();
      scheduleNextPost(); // 다음 예약
    }, randomMinutes * 60 * 1000);
  }

  scheduleNextPost();

  console.log('✅ AI 분석가 시스템이 가동되었습니다!');
  console.log('   커뮤니티 페이지에서 글을 확인하세요!');
  console.log('   Ctrl+C를 눌러 종료할 수 있습니다.\n');
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 AI 분석가 시스템을 종료합니다...');
  process.exit(0);
});

// 시스템 시작
main().catch(console.error); 