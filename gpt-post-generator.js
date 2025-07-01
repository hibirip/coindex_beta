import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import cron from 'node-cron';

// Supabase 설정
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key 필요
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 다양한 문체와 주제
const writingStyles = [
  { style: '전문적이고 분석적인', tone: '객관적이고 데이터 기반의' },
  { style: '친근하고 대화체의', tone: '이해하기 쉽고 재미있는' },
  { style: '열정적이고 긍정적인', tone: '희망적이고 동기부여가 되는' },
  { style: '신중하고 균형잡힌', tone: '양면을 모두 고려하는' },
  { style: '간결하고 핵심적인', tone: '바쁜 투자자를 위한 요약형' },
  { style: '경험담을 담은', tone: '개인적이고 솔직한' },
  { style: '교육적이고 설명적인', tone: '초보자도 이해할 수 있는' }
];

const topics = [
  '비트코인 가격 전망 및 기술적 분석',
  '이더리움 2.0 업그레이드 영향',
  '알트코인 투자 전략과 리스크 관리',
  'DeFi 프로토콜 수익률 분석',
  'NFT 시장 트렌드와 미래 전망',
  '암호화폐 규제 정책이 시장에 미치는 영향',
  '시장 심리 지표와 투자 타이밍',
  '온체인 데이터로 보는 시장 동향',
  '거시경제 상황과 암호화폐 상관관계',
  '신규 블록체인 프로젝트 분석',
  '스테이킹과 유동성 채굴 수익률 비교',
  '중앙은행 디지털화폐(CBDC) 영향',
  '메타버스와 게임파이 토큰 전망',
  '레이어2 솔루션 비교 분석',
  '암호화폐 세금 최적화 전략',
  '기관 투자자의 암호화폐 진입 효과',
  '탈중앙화 거래소(DEX) vs 중앙화 거래소',
  '암호화폐 포트폴리오 리밸런싱 전략',
  '도미넌스 지표로 보는 시장 사이클',
  '암호화폐 보안과 지갑 관리법'
];

// GPT 사용자 생성 (한 번만 실행)
async function createGPTUser() {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'gpt@coindex.ai')
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // Auth에서 기존 사용자 찾기
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    let authUserId = null;
    
    if (!listError && authUsers?.users) {
      const existingAuthUser = authUsers.users.find(user => user.email === 'gpt@coindex.ai');
      
      if (existingAuthUser) {
        console.log('✅ 기존 Auth 사용자 발견, Users 테이블에 추가 중...');
        authUserId = existingAuthUser.id;
      }
    }

    // 기존 Auth 사용자가 없으면 새로 생성
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'gpt@coindex.ai',
        password: Math.random().toString(36).slice(-16),
        email_confirm: true,
        user_metadata: {
          name: 'AI 분석가',
          nickname: 'AI 분석가'
        }
      });

      if (authError) {
        console.error('Auth 사용자 생성 실패:', authError);
        return null;
      }
      
      authUserId = authData.user.id;
    }

    // Users 테이블에 추가
    const { data: userData, error: userError } = await supabase.from('users').insert({
      id: authUserId,
      email: 'gpt@coindex.ai',
      password: 'gpt_auto_password_2024',
      name: 'AI 분석가',
      nickname: 'AI 분석가',
      phone: '010-0000-0000',
      gradient_colors: JSON.stringify(['#667eea', '#764ba2'])
    }).select().single();

    if (userError) {
      console.error('Users 테이블 삽입 실패:', userError);
      return null;
    }

    console.log('✅ GPT 사용자 생성 완료:', authUserId);
    return authUserId;

  } catch (error) {
    console.error('GPT 사용자 생성 중 오류:', error);
    return null;
  }
}

// 포스트 생성
async function generatePost() {
  try {
    console.log('🤖 새로운 분석글 생성 시작...');

    // GPT 사용자 ID 가져오기
    let gptUserId = await createGPTUser();
    
    // 기존 사용자가 있는지 다시 확인
    if (!gptUserId) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'gpt@coindex.ai')
        .single();
      
      gptUserId = existingUser?.id;
    }

    if (!gptUserId) {
      console.error('❌ GPT 사용자를 찾을 수 없습니다.');
      return;
    }

    // 랜덤 스타일과 주제 선택
    const style = writingStyles[Math.floor(Math.random() * writingStyles.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    console.log(`📝 주제: "${topic}" | 스타일: ${style.style}`);

    // GPT로 글 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 COINDEX의 전문 암호화폐 시장 분석가입니다. ${style.style} 문체로 ${style.tone} 글을 작성합니다. 
          한국어로 작성하고, 실제 투자자들에게 도움이 되는 실용적인 정보를 제공하세요.
          제목은 50자 이내로, 본문은 500-800자 정도로 작성해주세요.`
        },
        {
          role: "user",
          content: `"${topic}"에 대한 분석글을 작성해주세요. 
          
          형식:
          제목: [50자 이내의 흥미로운 제목]
          
          본문:
          [3-4문단으로 구성된 분석 내용]
          
          현재 시장 상황을 반영하고, 구체적인 투자 인사이트나 주의사항을 포함해주세요.`
        }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });

    const response = completion.choices[0].message.content;
    
    // 제목과 본문 분리
    const titleMatch = response.match(/제목:\s*(.+)/);
    const contentMatch = response.match(/본문:\s*([\s\S]+)/);
    
    let title = titleMatch ? titleMatch[1].trim() : topics[Math.floor(Math.random() * topics.length)];
    let content = contentMatch ? contentMatch[1].trim() : response;

    // 제목이 너무 길면 자르기
    if (title.length > 80) {
      title = title.substring(0, 77) + '...';
    }

    // 본문 정리
    content = content
      .replace(/^제목:.+$/gm, '')
      .replace(/^본문:\s*/gm, '')
      .trim();

    // Supabase에 저장
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: gptUserId,
        title,
        content,
        is_gpt: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 포스트 저장 실패:', error);
    } else {
      console.log(`✅ 새 분석글 생성 완료!`);
      console.log(`📌 제목: "${title}"`);
      console.log(`📄 글자수: ${content.length}자`);
      console.log(`🆔 포스트 ID: ${data.id}`);
    }

  } catch (error) {
    console.error('❌ 포스트 생성 중 오류:', error);
  }
}

// 서버 상태 확인
async function checkHealth() {
  try {
    const { data, error } = await supabase.from('posts').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase 연결 정상');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error);
    return false;
  }
}

// 메인 함수
async function main() {
  console.log('🚀 COINDEX AI 분석가 시스템 시작!');
  console.log('⏰ 1분마다 자동으로 분석글을 생성합니다.');
  
  // 환경변수 체크
  if (!process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ 환경변수를 설정해주세요:');
    console.error('   - SUPABASE_SERVICE_KEY');
    console.error('   - OPENAI_API_KEY');
    process.exit(1);
  }

  // 서버 상태 확인
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    console.error('❌ 서버 연결에 문제가 있습니다.');
    process.exit(1);
  }

  // 즉시 한 번 실행
  console.log('🔥 첫 번째 분석글 생성 중...');
  await generatePost();
  
  // 1분마다 실행하는 cron job
  cron.schedule('*/1 * * * *', async () => {
    const now = new Date();
    console.log(`\n⏰ [${now.toLocaleString('ko-KR')}] 정기 분석글 생성 시작`);
    await generatePost();
  });

  console.log('✅ 자동 생성 시스템이 가동되었습니다!');
  console.log('   Ctrl+C를 눌러 종료할 수 있습니다.');
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 AI 분석가 시스템을 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 AI 분석가 시스템을 종료합니다...');
  process.exit(0);
});

main().catch(console.error); 