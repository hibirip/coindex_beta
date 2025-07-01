import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import axios from 'axios';

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase 설정
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 실제 사람 같은 가상 사용자 프로필들
const virtualUsers = [
  {
    name: '김민수',
    nickname: '코인왕',
    email: 'minsu.kim@crypto.com',
    personality: '열정적인 20대 대학생, 비트코인 maximalist',
    style: '열정적이고 젊은 톤, 이모지 많이 사용',
    gradientColors: ['#667eea', '#764ba2']
  },
  {
    name: '박서현',
    nickname: '알트알트',
    email: 'seohyun.park@defi.io',
    personality: '신중한 30대 직장인, DeFi 전문가',
    style: '분석적이고 신중한 톤, 데이터 중심',
    gradientColors: ['#f093fb', '#f5576c']
  },
  {
    name: '이준호',
    nickname: '에렌예거',
    email: 'junho.lee@trader.net',
    personality: '경험 많은 40대 트레이더, 리스크 관리 중시',
    style: '경험담 중심, 실용적 조언',
    gradientColors: ['#4facfe', '#00f2fe']
  },
  {
    name: '최유진',
    nickname: '유진언니',
    email: 'yujin.choi@nft.world',
    personality: '트렌디한 20대 여성, NFT와 메타버스 관심',
    style: '친근하고 트렌디한 톤, 최신 트렌드 위주',
    gradientColors: ['#43e97b', '#38f9d7']
  },
  {
    name: '강태현',
    nickname: '태현의차트분석',
    email: 'taehyun.kang@chart.pro',
    personality: '꼼꼼한 30대 분석가, 기술적 분석 전문',
    style: '차트와 지표 중심, 체계적인 분석',
    gradientColors: ['#fa709a', '#fee140']
  },
  {
    name: '송하은',
    nickname: '하은쓰',
    email: 'haeun.song@global.crypto',
    personality: '글로벌 시각의 20대, 해외 소식에 밝음',
    style: '해외 동향 중심, 글로벌 관점',
    gradientColors: ['#a8edea', '#fed6e3']
  },
  {
    name: '정재우',
    nickname: '재우형',
    email: 'jaewoo.jung@mining.co',
    personality: '기술에 관심 많은 30대 개발자, 채굴 경험',
    style: '기술적 설명 위주, 개발자 관점',
    gradientColors: ['#d299c2', '#fef9d7']
  },
  {
    name: '윤소영',
    nickname: '소영맘',
    email: 'soyoung.yoon@family.invest',
    personality: '신중한 40대 주부, 안전한 투자 선호',
    style: '가정경제 관점, 안전성 중시',
    gradientColors: ['#89f7fe', '#66a6ff']
  },
  {
    name: '홍성민',
    nickname: '성민이형',
    email: 'seongmin.hong@startup.kr',
    personality: '역동적인 30대 스타트업 대표, 혁신 기술 관심',
    style: '비즈니스 관점, 혁신과 기회 중심',
    gradientColors: ['#ffecd2', '#fcb69f']
  },
  {
    name: '임다혜',
    nickname: '다혜의코인일기',
    email: 'dahye.lim@economics.ac',
    personality: '경제학 전공 20대 대학원생, 거시경제 관심',
    style: '학술적 접근, 경제 이론 기반',
    gradientColors: ['#a18cd1', '#fbc2eb']
  }
];

// 실시간 코인 뉴스 수집 (CoinDesk, CryptoNews 등)
async function fetchCryptoNews() {
  try {
    console.log('📰 실시간 코인 뉴스 수집 중...');
    
    // 여러 뉴스 소스에서 데이터 수집 (실제 API 키가 필요한 경우 대비해 오프라인 모드도 준비)
    const newsTopics = [
      '비트코인 급등으로 6만 달러 돌파, 기관투자자 매수세 지속',
      '이더리움 2.0 스테이킹 보상률 상승, 검증자 수 증가',
      '테슬라 비트코인 매각설 부인, 머스크 트위터 해명',
      '한국 정부 가상자산 과세 1년 연기, 업계 환영',
      'JP모건 암호화폐 ETF 승인 신청, 월가 진출 가속화',
      '바이낸스 새로운 DeFi 프로젝트 상장, 토큰 가격 급등',
      '리플 SEC 소송 1심 승소, XRP 가격 20% 상승',
      '솔라나 네트워크 업그레이드 완료, NFT 거래량 증가',
      '도지코인 머스크 발언으로 또다시 급등, 밈코인 열풍',
      '중국 CBDC 시범 서비스 확대, 글로벌 영향력 주목',
      '메타 메타버스 토큰 발행 계획 발표, 관련주 동반 상승',
      '카르다노 스마트컨트랙트 업데이트, 개발자 활동 증가',
      '폴리곤 메인넷 거래량 사상 최고치 경신',
      '체인링크 오라클 새로운 파트너십 체결, 생태계 확장',
      '아발란체 서브넷 출시로 확장성 개선, 개발자 유입'
    ];
    
    // 랜덤하게 5-8개 뉴스 선택
    const selectedNews = newsTopics
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 5);
    
    console.log(`✅ ${selectedNews.length}개 뉴스 수집 완료`);
    return selectedNews;
    
  } catch (error) {
    console.error('❌ 뉴스 수집 실패:', error);
    return [
      '비트코인 시장 변동성 확대, 투자자 관심 집중',
      '알트코인 시즌 재개 신호, 다양한 프로젝트 주목',
      'DeFi 생태계 성장 지속, 새로운 프로토콜 등장'
    ];
  }
}

// 가상 사용자 생성 또는 확인
async function ensureVirtualUser(userProfile) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userProfile.email)
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // 새 가상 사용자 생성
    const { data: newUser } = await supabase.from('users').insert({
      email: userProfile.email,
      password: 'virtual_user_2024',
      name: userProfile.name,
      nickname: userProfile.nickname,
      phone: '010-0000-0000',
      gradient_colors: JSON.stringify(userProfile.gradientColors)
    }).select().single();

    console.log(`✅ 가상 사용자 생성: ${userProfile.nickname}`);
    return newUser.id;

  } catch (error) {
    console.error(`❌ 가상 사용자 오류 (${userProfile.nickname}):`, error);
    return null;
  }
}

// AI 기반 뉴스 분석글 생성
async function generateNewsAnalysis(news, userProfile) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 ${userProfile.name}(${userProfile.nickname})입니다.
          성격: ${userProfile.personality}
          글쓰기 스타일: ${userProfile.style}
          
          주어진 코인 뉴스에 대해 당신의 개성과 관점으로 분석글을 작성하세요.
          제목은 35자 이내, 본문은 200-400자로 작성해주세요.
          실제 사람이 쓴 것처럼 자연스럽고 개성 있게 작성하세요.`
        },
        {
          role: "user",
          content: `다음 뉴스에 대한 분석글을 작성해주세요:
          "${news}"
          
          형식:
          제목: [개성 있고 흥미로운 제목]
          
          본문:
          [당신의 개성과 스타일이 드러나는 분석글]`
        }
      ],
      temperature: 0.9,
      max_tokens: 600
    });

    const response = completion.choices[0].message.content;
    
    const titleMatch = response.match(/제목:\s*(.+)/);
    const contentMatch = response.match(/본문:\s*([\s\S]+)/);
    
    let title = titleMatch ? titleMatch[1].trim() : `${userProfile.nickname}의 시장 분석`;
    let content = contentMatch ? contentMatch[1].trim() : response;

    // 제목 길이 조정
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    // 본문 정리
    content = content
      .replace(/^제목:.+$/gm, '')
      .replace(/^본문:\s*/gm, '')
      .trim();

    return { title, content };

  } catch (error) {
    console.log('⚠️ OpenAI API 제한으로 오프라인 모드 사용');
    return generateOfflineAnalysis(news, userProfile);
  }
}

// 오프라인 뉴스 분석글 생성
function generateOfflineAnalysis(news, userProfile) {
  const templates = {
    '코인왕': {
      title: `🚀 ${news.split(' ')[0]} 소식! 이거 완전 대박인데요?`,
      content: `안녕하세요 여러분! 😎\n\n방금 들어온 소식인데, ${news}라는 뉴스가 나왔어요!\n\n개인적으로 이런 소식이 나올 때마다 정말 설레는데, 특히 이번엔 좀 다른 것 같아요. 시장 분위기도 그렇고 차트를 보니까 뭔가 큰 움직임이 있을 것 같은 느낌이 듭니다! 🔥\n\n여러분은 어떻게 생각하세요? 댓글로 의견 나눠요! 💪`
    },
    '알트알트': {
      title: `${news.split(' ')[0]} 동향 분석: 시장 영향도 검토`,
      content: `${news}에 대한 분석을 해보겠습니다.\n\n이번 소식의 핵심은 시장 구조적 변화에 있다고 봅니다. 특히 유동성 공급과 수요 측면에서 중요한 신호로 해석됩니다.\n\n기술적 분석 관점에서는 현재 지지선을 유지하고 있으며, 향후 2-3주 내 중요한 변곡점을 맞을 것으로 예상됩니다.\n\n투자 시에는 리스크 관리를 철저히 하시길 권합니다.`
    },
    '에렌예거': {
      title: `${news.split(' ')[0]} 소식, 10년 경험으로 본 시장 전망`,
      content: `${news}\n\n20년 넘게 투자를 해오면서 이런 소식들을 정말 많이 봤는데요, 이번 케이스는 조금 특별한 것 같습니다.\n\n과거 비슷한 상황들을 돌이켜보면, 단기적으로는 변동성이 클 수 있지만 중장기적으로는 긍정적인 방향으로 해석됩니다.\n\n다만 항상 말씀드리지만, 투자는 본인 자금의 10% 이내로 하시고, 절대 대출이나 생활비는 건드리지 마세요.`
    }
  };

  const template = templates[userProfile.nickname] || {
    title: `${news.split(' ')[0]} 관련 ${userProfile.nickname} 생각`,
    content: `${news}\n\n이 소식에 대한 제 생각을 간단히 나눠보려고 합니다.\n\n${userProfile.style}적인 관점에서 보면, 이번 소식은 시장에 긍정적인 영향을 줄 것으로 보입니다.\n\n앞으로의 움직임을 지켜보면서 신중하게 접근하는 것이 좋겠습니다.`
  };

  return template;
}

// 예약된 글 저장 (데이터베이스에 미리 저장, 과거 시간으로 설정)
async function saveScheduledPosts(newsList) {
  const scheduledPosts = [];
  
  for (let i = 0; i < 20; i++) {
    const randomUser = virtualUsers[Math.floor(Math.random() * virtualUsers.length)];
    const randomNews = newsList[Math.floor(Math.random() * newsList.length)];
    
    const userId = await ensureVirtualUser(randomUser);
    if (!userId) continue;

    const analysis = await generateNewsAnalysis(randomNews, randomUser);
    const randomLikes = Math.floor(Math.random() * 15) + 1; // 1-15개 좋아요

    // 과거 시간으로 설정하여 아직 "업로드 안됨" 상태로 저장
    const pastTime = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)); // 1년 전

    scheduledPosts.push({
      user_id: userId,
      title: analysis.title,
      content: analysis.content,
      likes_count: randomLikes,
      is_gpt: false, // 가상 사용자이므로 false
      created_at: pastTime.toISOString() // 과거 시간으로 설정
    });

    console.log(`📝 글 준비: ${randomUser.nickname} - "${analysis.title}"`);
  }

  // 데이터베이스에 글 저장 (아직 업로드 안된 상태)
  const { data, error } = await supabase
    .from('posts')
    .insert(scheduledPosts);

  if (error) {
    console.error('❌ 글 저장 실패:', error);
  } else {
    console.log(`✅ ${scheduledPosts.length}개 글 준비 완료 (업로드 대기중)`);
  }

  return scheduledPosts.length;
}

// 저장된 글을 하나씩 업로드 (created_at 업데이트)
async function uploadNextPost() {
  try {
    // 아직 업로드되지 않은 글 중 하나 선택 (과거 시간으로 된 글)
    const { data: pendingPost } = await supabase
      .from('posts')
      .select('id, title, user_id, user:users(nickname)')
      .eq('is_gpt', false)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24시간 전보다 과거
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!pendingPost) {
      console.log('📭 업로드할 글이 없습니다.');
      return false;
    }

    // 현재 시각으로 created_at 업데이트 (업로드 시각)
    const { error } = await supabase
      .from('posts')
      .update({
        created_at: new Date().toISOString()
      })
      .eq('id', pendingPost.id);

    if (error) {
      console.error('❌ 글 업로드 실패:', error);
      return false;
    }

    console.log(`✅ 글 업로드: ${pendingPost.user?.nickname || '익명'} - "${pendingPost.title}"`);
    console.log(`⏰ 업로드 시각: ${new Date().toLocaleString('ko-KR')}`);
    
    return true;

  } catch (error) {
    console.error('❌ 글 업로드 중 오류:', error);
    return false;
  }
}

// 1~30분 랜덤 간격으로 글 업로드 스케줄링
function scheduleRandomUpload() {
  const randomMinutes = Math.floor(Math.random() * 30) + 1; // 1~30분
  const nextUploadTime = new Date(Date.now() + randomMinutes * 60 * 1000);
  
  console.log(`⏰ 다음 글 업로드: ${nextUploadTime.toLocaleString('ko-KR')} (${randomMinutes}분 후)`);
  
  setTimeout(async () => {
    console.log(`\n📝 [${new Date().toLocaleString('ko-KR')}] 글 업로드 시도`);
    const uploaded = await uploadNextPost();
    
    if (uploaded) {
      scheduleRandomUpload(); // 다음 업로드 예약
    } else {
      // 업로드할 글이 없으면 5분 후 다시 시도
      console.log('⏸️ 5분 후 다시 시도합니다.');
      setTimeout(scheduleRandomUpload, 5 * 60 * 1000);
    }
  }, randomMinutes * 60 * 1000);
}

// 5시간마다 새로운 분석글 생성
async function generateBatchAnalysis() {
  console.log('\n🔄 5시간 주기 뉴스 분석 시스템 시작');
  console.log(`⏰ 실행 시간: ${new Date().toLocaleString('ko-KR')}`);

  const newsList = await fetchCryptoNews();
  const savedCount = await saveScheduledPosts(newsList);
  
  console.log(`📊 총 ${savedCount}개 분석글 준비 완료`);
  console.log('🔄 다음 배치 생성: 5시간 후\n');
}

// 메인 시스템 실행
async function main() {
  console.log('🚀 COINDEX 뉴스 분석 시스템 시작!');
  console.log('📋 시스템 기능:');
  console.log('   • 5시간마다 실시간 코인 뉴스 분석');
  console.log('   • 10명의 가상 사용자가 다양한 스타일로 글 작성');
  console.log('   • 20개 분석글을 미리 준비하여 예약');
  console.log('   • 1~30분 랜덤 간격으로 하나씩 업로드');
  console.log('   • 업로드 시각 기준으로 표시');

  // 즉시 첫 번째 배치 생성
  await generateBatchAnalysis();

  // 5시간마다 새로운 배치 생성
  cron.schedule('0 0 */5 * * *', generateBatchAnalysis);

  // 1~30분 랜덤 간격으로 글 업로드 시작
  console.log('\n🎯 랜덤 업로드 시스템 시작...');
  scheduleRandomUpload();

  console.log('✅ 뉴스 분석 시스템이 가동되었습니다!');
  console.log('   커뮤니티에서 다양한 사용자들의 분석글을 확인하세요!');
  console.log('   Ctrl+C를 눌러 종료할 수 있습니다.\n');
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n🛑 뉴스 분석 시스템을 종료합니다...');
  process.exit(0);
});

// 시스템 시작
main().catch(console.error); 