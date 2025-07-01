import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabase 설정 (anon 키 사용)
const supabaseUrl = 'https://uzdfqhmdrzcwylnfbxku.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZGZxaG1kcnpjd3lsbmZieGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExMjcsImV4cCI6MjA2Njg4NzEyN30.1GOgTRSA8ePGLiGPBmujLVd4sKAMXcnzunumL021vDk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 다양한 주제
const topics = [
  '비트코인 가격 전망 및 기술적 분석',
  '이더리움 2.0 업그레이드 영향',
  '알트코인 투자 전략과 리스크 관리',
  'DeFi 프로토콜 수익률 분석',
  'NFT 시장 트렌드와 미래 전망'
];

async function generateSimplePost() {
  try {
    console.log('🤖 테스트 분석글 생성 중...');

    // 기존 사용자 중 하나를 선택 (테스트용)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, nickname')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ 사용자를 찾을 수 없습니다:', userError);
      return;
    }

    const testUser = users[0];
    console.log(`📝 사용자: ${testUser.nickname} (${testUser.id})`);

    // 랜덤 주제 선택
    const topic = topics[Math.floor(Math.random() * topics.length)];
    console.log(`📝 주제: "${topic}"`);

    // GPT로 글 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 COINDEX의 전문 암호화폐 시장 분석가입니다. 한국어로 실용적인 투자 정보를 제공하세요.`
        },
        {
          role: "user",
          content: `"${topic}"에 대한 분석글을 작성해주세요. 
          
          형식:
          제목: [50자 이내의 흥미로운 제목]
          
          본문:
          [3-4문단으로 구성된 분석 내용]`
        }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });

    const response = completion.choices[0].message.content;
    
    // 제목과 본문 분리
    const titleMatch = response.match(/제목:\s*(.+)/);
    const contentMatch = response.match(/본문:\s*([\s\S]+)/);
    
    let title = titleMatch ? titleMatch[1].trim() : topic;
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

    console.log(`📌 제목: "${title}"`);
    console.log(`📄 본문 길이: ${content.length}자`);

    // 임시로 사용자로 로그인 (테스트용)
    // 실제로는 service_role 키가 필요합니다
    console.log('⚠️  실제 글 저장을 위해서는 Supabase Service Role 키가 필요합니다.');
    console.log('📝 생성된 글:');
    console.log('='.repeat(50));
    console.log(`제목: ${title}`);
    console.log('='.repeat(50));
    console.log(content);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 글 생성 중 오류:', error);
  }
}

generateSimplePost(); 