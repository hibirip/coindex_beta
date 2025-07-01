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

  // 업비트 전체 마켓 정보를 저장할 상태
  // koreanPopularCoins는 fallback용으로만 사용

  // 환율 정보 가져오기
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/fx');
      const data = await response.json();
      if (data && data.USD_KRW) {
        setExchangeRate(data.USD_KRW);
        console.log('✅ 환율 정보 업데이트:', data.USD_KRW);
      }
    } catch (error) {
      console.error('환율 정보 가져오기 실패:', error.message);
    }
  };

  // 바이낸스 데이터 가져오기 (업비트 보조용)
  const fetchBinanceData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/binance');
      if (response.ok) {
        const data = await response.json();
        setBinanceData(data);
        console.log('✅ 바이낸스 보조 데이터 로드:', data.length);
      } else {
        throw new Error(`바이낸스 API 오류: ${response.status}`);
      }
    } catch (error) {
      console.error('바이낸스 데이터 가져오기 실패:', error.message);
      setBinanceData([]);
    }
  };

  // 업비트 마켓 목록 가져오기 (하루 1번만 요청)
  const fetchUpbitMarkets = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/upbit/markets');
      if (response.ok) {
        const markets = await response.json();
        setUpbitMarkets(markets);
        console.log('✅ 업비트 마켓 목록 로드:', markets.length);
        return markets;
      } else {
        throw new Error(`업비트 마켓 API 오류: ${response.status}`);
      }
    } catch (error) {
      console.error('업비트 마켓 목록 가져오기 실패:', error.message);
      // 실패 시 빈 배열 반환 (바이낸스 데이터라도 보여주기 위해)
      setUpbitMarkets([]);
      return [];
    }
  };

  // 업비트 실시간 시세 가져오기 (모든 코인, 0.5초마다)
  const fetchUpbitTicker = async (markets) => {
    try {
      if (!markets || markets.length === 0) {
        console.log('⚠️ 마켓 목록이 없어서 시세 요청을 건너뜁니다');
        return;
      }

      // 업비트 API 제한: 한 번에 최대 100개까지만 요청 가능
      const chunks = [];
      for (let i = 0; i < markets.length; i += 100) {
        chunks.push(markets.slice(i, i + 100));
      }

      // console.log(`📊 업비트 전체 시세 요청: ${markets.length}개 마켓 (${chunks.length}번 요청)`);
      
      let allData = [];
      for (const chunk of chunks) {
        const marketString = chunk.map(m => m.market).join(',');
        const response = await fetch(`http://localhost:4000/api/upbit?markets=${marketString}`);
        
        if (response.ok) {
          const chunkData = await response.json();
          allData = [...allData, ...chunkData];
          // console.log(`✅ 업비트 시세 청크 로드: ${chunkData.length}개`);
        } else {
          throw new Error(`업비트 시세 API 오류: ${response.status}`);
        }
        
        // API 제한을 위해 잠시 대기 (50ms)
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
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
      // console.log(`✅ 업비트 전체 시세 업데이트 완료: ${mergedData.length}개 코인`);
      return mergedData;
      
    } catch (error) {
      console.error('업비트 시세 가져오기 실패:', error.message);
      // 실패 시 바이낸스 기반 데이터로 fallback
      await fetchBinanceData();
    }
  };

  // 초기 데이터 로딩 (마켓 목록 + 환율)
  const fetchInitialData = async () => {
    console.log('🔄 초기 데이터 로딩 시작...');
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
        
        // 실시간 틱 업데이트 시작 (0.3초마다)
        tickInterval = setInterval(() => {
          updateTickData(markets);
        }, 300); // 0.3초마다 업데이트
        
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