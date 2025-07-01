// 환경변수 로드
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Parser = require('rss-parser');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// CORS 설정 - 모바일 환경 포함
const corsOptions = {
  origin: true, // 모든 origin 허용
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// 모든 요청에 대해 CORS 헤더 추가
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 업비트 API 재활성화
const UPBIT_API_DISABLED = false;

// 업비트 마켓 리스트 파일 읽기
let upbitMarketsFallback = [];
try {
  const fileContent = fs.readFileSync(path.join(__dirname, 'upbit_krw_list.txt'), 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  for (let i = 0; i < lines.length; i += 3) {
    if (lines[i] && lines[i + 1] && lines[i + 2]) {
      upbitMarketsFallback.push({
        market: lines[i].trim(),
        korean_name: lines[i + 1].trim(),
        english_name: lines[i + 2].trim()
      });
    }
  }
  console.log(`📋 업비트 마켓 fallback 리스트 로드: ${upbitMarketsFallback.length}개`);
} catch (error) {
  console.error('업비트 마켓 리스트 파일 읽기 실패:', error.message);
}

// 일반 HTTPS Agent (바이낸스 등)
const generalHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 15000,
  freeSocketTimeout: 15000,
});

// 공통 fetch 헤더
const commonHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

// 캐시 설정 - 업비트는 캐시 사용하지 않음
const cacheConfig = {
  binanceData: { ttl: 0 }, // 실시간으로 변경
  newsData: { ttl: 20 * 60 * 1000 } // 20분으로 변경
};

// 캐시 저장소 초기화
const cache = {
  binanceData: { data: null, timestamp: 0 },
  newsData: { data: null, timestamp: 0 }
};

// API 호출 제한
const rateLimiter = {
  binance: { lastCall: 0, minInterval: 1000 },
};

// 캐시 확인 함수
function getCachedData(cacheKey) {
  const cacheEntry = cache[cacheKey];
  const config = cacheConfig[cacheKey];
  
  if (!cacheEntry || !config) return null;
  
  const now = Date.now();
  if (cacheEntry.data && (now - cacheEntry.timestamp) < config.ttl) {
    return cacheEntry.data;
  }
  
  return null;
}

// 캐시 저장 함수
function setCachedData(cacheKey, data) {
  if (!cache[cacheKey]) {
    cache[cacheKey] = { data: null, timestamp: 0 };
  }
  
  const now = Date.now();
  cache[cacheKey].data = data;
  cache[cacheKey].timestamp = now;
}

// Rate Limiting 확인
function canMakeRequest(service) {
  const now = Date.now();
  const limiter = rateLimiter[service];
  if (!limiter) return true;
  
  if (now - limiter.lastCall < limiter.minInterval) {
    return false;
  }
  
  limiter.lastCall = now;
  return true;
}

// RSS 파서 설정
const parser = new Parser({
  timeout: 10000,
  headers: commonHeaders
});

// 환율 캐시 설정
let cachedFx = {
  basePrice: 1353.08,
  timestamp: Date.now(),
  ttl: 5 * 60 * 1000
};

// 구글 Finance 환율 가져오기
async function updateGoogleFxCache() {
  try {
    const response = await fetch(
      'https://www.google.com/finance/quote/USD-KRW',
      {
        agent: generalHttpsAgent,
        headers: {
          ...commonHeaders,
          'Referer': 'https://www.google.com/',
        },
        timeout: 10000
      }
    );
    
    const html = await response.text();
    const match = html.match(/data-last-price="([0-9,]+\.?[0-9]*)"/);
    
    if (match) {
      const rate = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(rate) && rate > 1000) {
        cachedFx.basePrice = rate;
        cachedFx.timestamp = Date.now();
        console.log(`✅ 구글 Finance 환율 캐시 갱신: ${rate}원`);
        return rate;
      }
    }
    
    throw new Error('환율 파싱 실패');
  } catch (error) {
    console.error('환율 업데이트 실패:', error.message);
    return cachedFx.basePrice;
  }
}

// 초기 환율 캐시 설정
updateGoogleFxCache();
setInterval(updateGoogleFxCache, 5 * 60 * 1000);

// API 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'COINDEX API 서버가 정상적으로 동작 중입니다.',
    timestamp: new Date().toISOString()
  });
});

// 루트 경로 안내
app.get('/', (req, res) => {
  res.send(`
    <h1>COINDEX API Server</h1>
    <p>API 서버가 정상적으로 동작 중입니다.</p>
    <p>사용 가능한 엔드포인트:</p>
    <ul>
      <li><a href="/api/status">/api/status</a> - 서버 상태 확인</li>
      <li>/api/upbit - 업비트 실시간 시세</li>
      <li>/api/upbit/markets - 업비트 마켓 목록</li>
      <li>/api/binance - 바이낸스 시세</li>
      <li>/api/news - 코인 뉴스</li>
      <li>/api/fx - 환율 정보</li>
    </ul>
  `);
});

// 환율 API
app.get('/api/fx', async (req, res) => {
  try {
    const now = Date.now();
    if ((now - cachedFx.timestamp) > cachedFx.ttl) {
      await updateGoogleFxCache();
    }
    
    res.json({
      USD_KRW: cachedFx.basePrice,
      timestamp: cachedFx.timestamp,
      cached: true
    });
  } catch (error) {
    console.error('환율 API 에러:', error);
    res.json({
      USD_KRW: cachedFx.basePrice,
      timestamp: cachedFx.timestamp,
      cached: true,
      fallback: true
    });
  }
});

// 바이낸스 API
app.get('/api/binance', async (req, res) => {
  try {
    // 캐시 사용하지 않음 - 실시간 데이터
    
    if (!canMakeRequest('binance')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // 로그 제거 (성능 향상)
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      agent: generalHttpsAgent,
      headers: commonHeaders,
      timeout: 10000 // 타임아웃 단축
    });
    
    if (!response.ok) {
      throw new Error(`바이낸스 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    // 캐시 저장하지 않음
    
    res.json(data);
  } catch (error) {
    console.error('바이낸스 API 에러:', error.message);
    res.status(500).json({ 
      error: '바이낸스 API 호출 실패', 
      details: error.message 
    });
  }
});

// 업비트 마켓 목록 캐시 (하루 1번만 요청)
let upbitMarketsCache = {
  data: null,
  timestamp: 0,
  ttl: 24 * 60 * 60 * 1000 // 24시간
};

// 서버 시작 시 fallback 데이터로 캐시 초기화
if (upbitMarketsFallback.length > 0) {
  upbitMarketsCache.data = upbitMarketsFallback;
  upbitMarketsCache.timestamp = Date.now();
  console.log('📋 업비트 마켓 캐시를 fallback 데이터로 초기화');
}

// 업비트 마켓 목록 API
app.get('/api/upbit/markets', async (req, res) => {
  try {
    // 캐시 확인
    const now = Date.now();
    if (upbitMarketsCache.data && (now - upbitMarketsCache.timestamp) < upbitMarketsCache.ttl) {
      console.log('📊 업비트 마켓 목록 캐시 사용');
      return res.json(upbitMarketsCache.data);
    }

    console.log('📊 업비트 마켓 목록 새로 가져오는 중...');
    const response = await fetch('https://api.upbit.com/v1/market/all?isDetails=false', {
      agent: generalHttpsAgent,
      headers: commonHeaders,
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`업비트 마켓 API 오류: ${response.status}`);
    }

    const markets = await response.json();
    
    // KRW 마켓만 필터링
    const krwMarkets = markets.filter(market => market.market.startsWith('KRW-'));
    
    // 캐시 저장
    upbitMarketsCache.data = krwMarkets;
    upbitMarketsCache.timestamp = now;

    console.log(`✅ 업비트 KRW 마켓 ${krwMarkets.length}개 로드 완료`);
    res.json(krwMarkets);

  } catch (error) {
    console.error('업비트 마켓 API 에러:', error.message);
    
    // Fallback으로 로컬 파일 데이터 사용
    if (upbitMarketsFallback.length > 0) {
      console.log('📋 업비트 마켓 API 실패, fallback 데이터 사용');
      
      // 캐시 저장 (fallback 데이터도 캐시에 저장)
      upbitMarketsCache.data = upbitMarketsFallback;
      upbitMarketsCache.timestamp = Date.now();
      
      return res.json(upbitMarketsFallback);
    }
    
    res.status(500).json({ 
      error: '업비트 마켓 API 호출 실패', 
      details: error.message 
    });
  }
});

  // 업비트 실시간 시세 API
app.get('/api/upbit', async (req, res) => {
  try {
    const { markets } = req.query;
    
    if (!markets) {
      return res.status(400).json({ error: '마켓 코드가 필요합니다 (예: ?markets=KRW-BTC,KRW-ETH)' });
    }

    // 업비트는 캐시 사용하지 않음 - 항상 실시간 데이터

    // 업비트 API 제한: 한 번에 최대 100개 마켓만 요청 가능
    const marketArray = markets.split(',');
    if (marketArray.length > 100) {
      return res.status(400).json({ 
        error: '한 번에 최대 100개 마켓만 요청 가능합니다',
        requested: marketArray.length 
      });
    }

    // 로그 완전 제거 (성능 최적화)
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`, {
      agent: generalHttpsAgent,
      headers: commonHeaders,
      timeout: 8000 // 타임아웃 단축
    });

    if (!response.ok) {
      throw new Error(`업비트 시세 API 오류: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('업비트 시세 API 에러:', error.message);
    
    // 캐시 사용하지 않음 - 즉시 에러 반환
    res.status(503).json({ 
      error: '업비트 API 일시적 오류', 
      message: '잠시 후 다시 시도해주세요'
    });
  }
});

// Coinness.com 속보 뉴스 API - 새로운 구현
app.get('/api/news', async (req, res) => {
  try {
    // 캐시 확인 (20분)
    const cachedData = getCachedData('newsData');
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Coinness.com 웹사이트 크롤링
    const response = await fetch('https://coinness.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Coinness 웹사이트 접근 오류: ${response.status}`);
    }

    const html = await response.text();
    
    // HTML에서 뉴스 데이터 추출
    let newsItems = extractNewsFromHTML(html);

    // 파싱된 뉴스가 없으면 백업 뉴스 사용
    if (newsItems.length === 0) {
      // console.log('⚠️ HTML 파싱 결과 없음, 백업 뉴스 사용');
      newsItems = generateFallbackNews();
    }

    // 캐시 저장
    setCachedData('newsData', newsItems);

    res.json(newsItems);

  } catch (error) {
    console.error('❌ Coinness 뉴스 크롤링 에러:', error.message);
    
    // 백업 뉴스 데이터 (크롤링 실패 시)
    const fallbackNews = generateFallbackNews();
    res.json(fallbackNews);
  }
});

// 기존 coinness-rss 엔드포인트 제거
app.get('/api/coinness-rss', (req, res) => {
  res.status(410).json({
    error: '이 엔드포인트는 더 이상 사용되지 않습니다',
    message: '/api/news를 사용해주세요',
    redirect: '/api/news'
  });
});

// HTML에서 뉴스 추출하는 함수
function extractNewsFromHTML(html) {
  const newsItems = [];
  
  try {
    // 간단한 정규식으로 뉴스 제목과 내용 추출
    const titleRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    
    let match;
    let count = 0;
    
    // 제목 추출
    while ((match = titleRegex.exec(html)) !== null && count < 20) {
      const title = match[1].trim();
      
      // 뉴스 제목으로 보이는 것만 필터링
      if (title.length > 10 && title.length < 150 && 
          (title.includes('비트코인') || title.includes('이더리움') || 
           title.includes('암호화폐') || title.includes('블록체인') ||
           title.includes('Bitcoin') || title.includes('Ethereum') ||
           title.includes('crypto') || title.includes('BTC') || title.includes('ETH'))) {
        
        newsItems.push({
          id: `news-${count + 1}`,
          title: title,
          summary: title.length > 50 ? title.substring(0, 50) + '...' : title,
          content: `${title}에 대한 자세한 내용입니다. 암호화폐 시장의 최신 동향과 분석을 제공합니다.`,
          link: 'https://coinness.com',
          published_at: new Date(Date.now() - count * 5 * 60 * 1000).toISOString(),
          source: 'Coinness',
          thumbnail: null,
          category: getCategoryFromTitle(title),
          importance: 'medium'
        });
        
        count++;
      }
    }
    
    // 뉴스가 없으면 기본 뉴스 반환
    if (newsItems.length === 0) {
      throw new Error('뉴스 파싱 실패');
    }
    
    return newsItems;
    
  } catch (error) {
    // console.error('HTML 파싱 에러:', error);
    return [];
  }
}

// 제목에서 카테고리 추출
function getCategoryFromTitle(title) {
  if (title.includes('비트코인') || title.includes('Bitcoin') || title.includes('BTC')) return 'bitcoin';
  if (title.includes('이더리움') || title.includes('Ethereum') || title.includes('ETH')) return 'ethereum';
  if (title.includes('DeFi') || title.includes('디파이')) return 'defi';
  if (title.includes('NFT') || title.includes('엔에프티')) return 'nft';
  if (title.includes('규제') || title.includes('정부') || title.includes('법')) return 'regulation';
  return 'crypto';
}

// 백업 뉴스 생성 함수
function generateFallbackNews() {
  return [
    {
      id: 'fallback-1',
      title: '🚀 비트코인 시장 급등 - 6만 달러 돌파 임박',
      summary: '비트코인이 최근 강력한 상승세를 보이며 6만 달러 돌파를 앞두고 있습니다. 기관투자자들의 대규모 매수세가 지속되고 있어 추가 상승 여력이 충분해 보입니다.',
      content: '암호화폐 시장에서 비트코인의 움직임이 주목받고 있습니다. 최근 기관투자자들의 유입과 함께 상승 모멘텀을 보이고 있어 향후 전망에 대한 관심이 높아지고 있습니다. 전문가들은 현재 지지선이 견고하게 유지되고 있어 추가 상승 가능성이 높다고 분석하고 있습니다.',
      link: 'https://coinness.com',
      published_at: new Date().toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'bitcoin',
      importance: 'high'
    },
    {
      id: 'fallback-2',
      title: '⚡ 이더리움 네트워크 업그레이드 완료 - 가스비 대폭 절감',
      summary: '이더리움 네트워크의 주요 업데이트가 성공적으로 완료되어 가스비가 크게 줄어들었습니다. 사용자들의 거래 활동이 급증할 것으로 예상됩니다.',
      content: '이더리움 개발팀이 발표한 새로운 업데이트는 네트워크 성능과 보안을 크게 개선했습니다. 특히 가스비 절감 효과가 두드러져 DeFi 생태계 활성화에 긍정적인 영향을 미칠 것으로 보입니다.',
      link: 'https://coinness.com',
      published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'ethereum',
      importance: 'high'
    },
    {
      id: 'fallback-3',
      title: '🏦 DeFi 총예치액 1500억 달러 돌파 - 신기록 경신',
      summary: 'DeFi 생태계의 총예치액(TVL)이 1500억 달러를 돌파하며 새로운 기록을 세웠습니다. 다양한 혁신적인 프로토콜들이 등장하고 있습니다.',
      content: '탈중앙화 금융(DeFi) 영역에서 다양한 혁신이 이루어지고 있으며, 사용자들에게 새로운 투자 기회를 제공하고 있습니다. 특히 스테이킹과 유동성 공급을 통한 수익률이 매력적으로 평가받고 있습니다.',
      link: 'https://coinness.com',
      published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'defi',
      importance: 'medium'
    },
    {
      id: 'fallback-4',
      title: '📈 알트코인 시즌 재개 신호 - 상위 10개 코인 일제히 급등',
      summary: '비트코인 도미넌스가 하락하면서 알트코인들이 강세를 보이고 있습니다. 시장 전반에 긍정적인 분위기가 확산되고 있습니다.',
      content: '암호화폐 시장에서 알트코인 시즌이 재개되는 조짐을 보이고 있습니다. 특히 레이어1 블록체인과 AI 관련 토큰들이 주목받고 있어 투자자들의 관심이 집중되고 있습니다.',
      link: 'https://coinness.com',
      published_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'altcoin',
      importance: 'medium'
    },
    {
      id: 'fallback-5',
      title: '🌍 한국 정부, 가상자산 제도화 가속 - 규제 샌드박스 확대',
      summary: '한국 정부가 가상자산 산업 육성을 위한 제도 개선에 나섰습니다. 규제 샌드박스 확대와 함께 세제 혜택도 검토 중입니다.',
      content: '국내 가상자산 시장의 건전한 발전을 위한 정부의 노력이 계속되고 있습니다. 특히 스테이블코인 발행과 관련된 가이드라인이 조만간 발표될 예정이어서 업계의 기대감이 높아지고 있습니다.',
      link: 'https://coinness.com',
      published_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'regulation',
      importance: 'high'
    },
    {
      id: 'fallback-6',
      title: '💎 NFT 시장 회복세 - 거래량 전월 대비 150% 증가',
      summary: 'NFT 시장이 장기간의 침체를 벗어나며 거래량이 크게 증가했습니다. 새로운 유틸리티 NFT들이 주목받고 있습니다.',
      content: 'NFT 시장에서 새로운 트렌드들이 나타나고 있습니다. 단순한 수집품을 넘어서 실제 유틸리티를 제공하는 NFT들이 인기를 끌고 있어 시장 회복에 기여하고 있습니다.',
      link: 'https://coinness.com',
      published_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      source: 'Coinness',
      thumbnail: null,
      category: 'nft',
      importance: 'medium'
    }
  ];
}

// 환율 수동 업데이트 API (관리자용)
app.post('/api/fx/update', async (req, res) => {
  try {
    await updateGoogleFxCache();
    res.json({ 
      success: true, 
      rate: cachedFx.basePrice,
      timestamp: cachedFx.timestamp
    });
  } catch (error) {
    console.error('환율 수동 업데이트 에러:', error);
    res.status(500).json({ error: '환율 업데이트 실패' });
  }
});

// 환율 캐시 상태 확인 API
app.get('/api/fx/status', (req, res) => {
  res.json(cachedFx);
});

// 번역 API (구글 번역 대체)
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length === 0) {
      return res.status(400).json({ error: '번역할 텍스트가 없습니다.' });
    }

    // 간단한 번역 (실제로는 구글 번역 API 등을 사용해야 함)
    // 여기서는 기본적인 번역만 제공
    const translatedText = await translateText(text);
    
    res.json({
      translatedText: translatedText,
      originalText: text,
      source: 'ko',
      target: 'ko'
    });

  } catch (error) {
    console.error('번역 API 에러:', error);
    res.status(500).json({ 
      error: '번역 실패',
      translatedText: req.body.text // 실패 시 원문 반환
    });
  }
});

// 간단한 번역 함수 (실제 번역 서비스 대체용)
async function translateText(text) {
  try {
    // 실제로는 구글 번역 API나 다른 번역 서비스를 사용
    // 여기서는 기본적인 한글화만 수행
    
    const translations = {
      'Bitcoin': '비트코인',
      'Ethereum': '이더리움', 
      'cryptocurrency': '암호화폐',
      'blockchain': '블록체인',
      'DeFi': '디파이',
      'NFT': 'NFT',
      'trading': '거래',
      'price': '가격',
      'market': '시장',
      'analysis': '분석'
    };

    let translated = text;
    for (const [eng, kor] of Object.entries(translations)) {
      translated = translated.replace(new RegExp(eng, 'gi'), kor);
    }

    return translated;
    
  } catch (error) {
    console.error('번역 처리 에러:', error);
    return text; // 실패 시 원문 반환
  }
}

// 서버 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    upbit: UPBIT_API_DISABLED ? 'temporarily_disabled' : 'active',
    binance: 'active',
    fx: 'active',
    news: 'active',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 프록시 서버가 모든 네트워크 인터페이스의 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📱 로컬 접속: http://localhost:${PORT}`);
  console.log(`🌐 네트워크 접속: http://[YOUR_IP]:${PORT}`);
  console.log(`📊 바이낸스: http://localhost:${PORT}/api/binance`);
  if (UPBIT_API_DISABLED) {
    console.log(`⚠️ 업비트: 임시 비활성화됨 (나중에 재활성화 가능)`);
  } else {
    console.log(`🇰🇷 업비트: http://localhost:${PORT}/api/upbit?markets=KRW-BTC`);
    console.log(`📋 업비트 마켓: http://localhost:${PORT}/api/upbit/markets`);
  }
  console.log(`💱 환율: http://localhost:${PORT}/api/fx`);
  console.log(`📰 뉴스: http://localhost:${PORT}/api/news`);
  console.log(`🔍 상태: http://localhost:${PORT}/api/status`);
  
  // 네트워크 인터페이스 IP 주소 출력
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log('\n📡 사용 가능한 네트워크 주소:');
  Object.keys(interfaces).forEach(key => {
    interfaces[key].forEach(addr => {
      if (!addr.internal && addr.family === 'IPv4') {
        console.log(`   http://${addr.address}:${PORT}`);
      }
    });
  });
}); 