import { useState, useEffect } from 'react';

const useCryptoData = () => {
  const [binanceData, setBinanceData] = useState([]);
  const [upbitData, setUpbitData] = useState([]);
  const [upbitMarkets, setUpbitMarkets] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(1350);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 업비트 API 재활성화
  const UPBIT_API_DISABLED = false;

  // API URL 환경변수 기반 설정
  const getApiUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    // 로그 제거 (성능 향상)
    return apiUrl;
  };

  // API 요청 함수 (에러 처리 강화)
  const apiRequest = async (endpoint, options = {}) => {
    const maxRetries = 2; // 재시도 횟수 줄임
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${getApiUrl()}${endpoint}`;
        // 로그 제거
        
        const response = await fetch(url, {
          ...options,
          timeout: 8000, // 타임아웃 단축
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // 재시도 전 대기 시간 단축
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }
    }

    throw lastError;
  };

  // 업비트 전체 마켓 정보를 저장할 상태
  // koreanPopularCoins는 fallback용으로만 사용

  // 환율 정보 가져오기
  const fetchExchangeRate = async () => {
    try {
      const data = await apiRequest('/api/fx');
      if (data && data.USD_KRW) {
        setExchangeRate(data.USD_KRW);
        // 로그 제거
      }
    } catch (error) {
      console.error('환율 정보 가져오기 실패:', error.message);
    }
  };

  // 바이낸스 데이터 가져오기 (업비트 보조용)
  const fetchBinanceData = async () => {
    try {
      const data = await apiRequest('/api/binance');
      setBinanceData(data);
      // 로그 제거
    } catch (error) {
      console.error('바이낸스 데이터 가져오기 실패:', error.message);
      setBinanceData([]);
    }
  };

  // 업비트 마켓 목록 가져오기 (하루 1번만 요청)
  const fetchUpbitMarkets = async () => {
    try {
      const markets = await apiRequest('/api/upbit/markets');
      setUpbitMarkets(markets);
      // 로그 제거
      return markets;
    } catch (error) {
      console.error('업비트 마켓 목록 가져오기 실패:', error.message);
      // 실패 시 빈 배열 반환 (바이낸스 데이터라도 보여주기 위해)
      setUpbitMarkets([]);
      return [];
    }
  };

  // 업비트 실시간 시세 가져오기 (최적화된 청크 처리)
  const fetchUpbitTicker = async (markets) => {
    try {
      if (!markets || markets.length === 0) {
        return;
      }

      // 50개씩 청크 분할 (Rate Limit 회피)
      const chunks = [];
      for (let i = 0; i < markets.length; i += 50) {
        chunks.push(markets.slice(i, i + 50));
      }
      
      let allData = [];
      for (const chunk of chunks) {
        const marketString = chunk.map(m => m.market).join(',');
        
        try {
          const chunkData = await apiRequest(`/api/upbit?markets=${marketString}`);
          allData = [...allData, ...chunkData];
        } catch (error) {
          console.error(`업비트 시세 청크 로드 실패:`, error.message);
          // 일부 청크 실패해도 계속 진행
        }
        
        // 청크 간 대기시간 150ms (Rate Limit 회피)
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      // 마켓 정보와 시세 데이터 병합 (한글명 추가)
      const marketMap = markets.reduce((acc, market) => {
        acc[market.market] = market;
        return acc;
      }, {});

      const mergedData = allData.map(ticker => ({
        ...ticker,
        korean_name: marketMap[ticker.market]?.korean_name || ticker.market.replace('KRW-', ''),
        english_name: marketMap[ticker.market]?.english_name || ticker.market.replace('KRW-', '')
      }));

      setUpbitData(mergedData);
      return mergedData;
      
    } catch (error) {
      console.error('업비트 시세 가져오기 실패:', error.message);
      // 실패 시 바이낸스 기반 데이터로 fallback
      await fetchBinanceData();
    }
  };

  // 초기 데이터 로딩 (마켓 목록 + 환율)
  const fetchInitialData = async () => {
    // 로그 제거
    setError(null);
    
    try {
      // 환율 정보 가져오기
      await fetchExchangeRate();
      
      // 업비트 마켓 목록 가져오기 (하루 1번)
      const markets = await fetchUpbitMarkets();
      
      // 바이낸스 데이터 가져오기 (김프 계산용)
      await fetchBinanceData();
      
      return markets;
    } catch (error) {
      console.error('초기 데이터 로딩 실패:', error.message);
      setError(error.message);
      throw error;
    }
  };

  // 실시간 틱 데이터 업데이트 (0.5초마다)
  const updateTickData = async (markets) => {
    try {
      if (markets && markets.length > 0) {
        await fetchUpbitTicker(markets);
      }
    } catch (error) {
      console.error('실시간 틱 업데이트 실패:', error.message);
    }
  };

  useEffect(() => {
    let tickInterval;
    
    const initializeData = async () => {
      try {
        // 초기 데이터 로딩
        const markets = await fetchInitialData();
        setLoading(false);
        
        // 첫 번째 틱 데이터 로딩
        await updateTickData(markets);
        
        // 실시간 틱 업데이트 시작 (0.5초로 복원)
        tickInterval = setInterval(() => {
          updateTickData(markets);
        }, 500); // 0.5초로 복원!
        
      } catch (error) {
        setLoading(false);
      }
    };

    initializeData();

    // 환율은 5분마다 업데이트
    const exchangeInterval = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => {
      if (tickInterval) clearInterval(tickInterval);
      clearInterval(exchangeInterval);
    };
  }, []);

  // 수동 새로고침 함수
  const refetch = async () => {
    setLoading(true);
    try {
      const markets = await fetchInitialData();
      await updateTickData(markets);
    } catch (error) {
      console.error('수동 새로고침 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    binanceData,
    upbitData, // 실제 업비트 데이터
    upbitMarkets, // 실제 업비트 마켓 목록
    exchangeRate,
    loading,
    error,
    refetch
  };
};

export default useCryptoData; 