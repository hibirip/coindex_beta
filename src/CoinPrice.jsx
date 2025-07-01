import { useState, useMemo } from 'react';
import useCryptoData from './hooks/useCryptoData';
import CoinTable from './components/CoinTable';

export default function CoinPrice() {
  const { upbitData, binanceData, exchangeRate, loading, error } = useCryptoData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // 실제 데이터 기반 통계 계산
  const marketStats = useMemo(() => {
    if (!upbitData || upbitData.length === 0) {
      return {
        totalCoins: 0,
        upCount: 0,
        downCount: 0,
        flatCount: 0,
        totalMarketCap: 0,
        totalVolume: 0,
        avgChangeRate: 0,
        topGainer: null
      };
    }

    const upCoins = upbitData.filter(coin => coin.signed_change_rate > 0);
    const downCoins = upbitData.filter(coin => coin.signed_change_rate < 0);
    const flatCoins = upbitData.filter(coin => coin.signed_change_rate === 0);
    
    // 총 거래대금 계산 (원화 기준)
    const totalVolume = upbitData.reduce((sum, coin) => {
      return sum + (coin.acc_trade_price_24h || 0);
    }, 0);

    // 급등 코인 찾기 (가장 상승률이 높은 코인)
    const topGainer = upCoins.length > 0 
      ? upCoins.reduce((max, coin) => 
          coin.signed_change_rate > max.signed_change_rate ? coin : max
        )
      : null;

    return {
      totalCoins: upbitData.length,
      upCount: upCoins.length,
      downCount: downCoins.length,
      flatCount: flatCoins.length,
      totalVolume,
      topGainer
    };
  }, [upbitData]);
  
  return (
    <div className="space-y-6">
      {/* 4개 핵심 정보 카드 - 컴팩트 & 주요 정보 강조 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {/* 급등코인 카드 - 노란색 테마 + 로고 */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {marketStats.topGainer && (
                <img 
                  src={`https://static.upbit.com/logos/${marketStats.topGainer.market.replace('KRW-', '')}.png`}
                  alt={marketStats.topGainer.market}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div>
                <div className="text-2xl font-bold leading-none">
                  {marketStats.topGainer ? marketStats.topGainer.market.replace('KRW-', '') : 'N/A'}
                </div>
                <div className="text-xs opacity-80">급등코인</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-md p-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.388,9.624h-3.011v-3.01c0-0.208-0.168-0.377-0.376-0.377S9.624,6.405,9.624,6.614v3.01H6.613c-0.208,0-0.376,0.168-0.376,0.376s0.168,0.376,0.376,0.376h3.011v3.01c0,0.208,0.168,0.377,0.376,0.377s0.376-0.169,0.376-0.377v-3.01h3.011c0.208,0,0.376-0.168,0.376-0.376S13.596,9.624,13.388,9.624z M10,1.344c-4.781,0-8.656,3.875-8.656,8.656c0,4.781,3.875,8.656,8.656,8.656c4.781,0,8.656-3.875,8.656-8.656C18.656,5.219,14.781,1.344,10,1.344z M10,17.903c-4.365,0-7.904-3.538-7.904-7.903S5.635,2.096,10,2.096S17.903,5.635,17.903,10S14.365,17.903,10,17.903z"/>
              </svg>
            </div>
          </div>
          <div className="text-sm font-bold mt-1">
            {marketStats.topGainer ? `+${(marketStats.topGainer.signed_change_rate * 100).toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        {/* 상승 카드 - 빨간색 테마 */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold leading-none">{marketStats.upCount}</div>
              <div className="text-xs opacity-80">상승</div>
            </div>
            <div className="bg-white/20 rounded-md p-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-80 mt-1">
            {marketStats.totalCoins > 0 ? `${Math.round((marketStats.upCount / marketStats.totalCoins) * 100)}%` : '0%'}
          </div>
        </div>

        {/* 하락 카드 - 파란색 테마 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold leading-none">{marketStats.downCount}</div>
              <div className="text-xs opacity-80">하락</div>
            </div>
            <div className="bg-white/20 rounded-md p-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-80 mt-1">
            {marketStats.totalCoins > 0 ? `${Math.round((marketStats.downCount / marketStats.totalCoins) * 100)}%` : '0%'}
          </div>
        </div>

        {/* 환율 카드 - 초록색 테마 */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold leading-none">
                {exchangeRate ? exchangeRate.toFixed(1) : '0.0'}
              </div>
              <div className="text-xs opacity-80">USD/KRW</div>
            </div>
            <div className="bg-white/20 rounded-md p-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 6a1 1 0 112 0v.092a4.535 4.535 0 011.676.662C13.398 7.28 14 8.14 14 9c0 .845-.608 1.72-1.324 2.246A4.535 4.535 0 0111 11.908V12a1 1 0 11-2 0v-.092a4.535 4.535 0 01-1.676-.662C6.602 10.72 6 9.86 6 9c0-.845.608-1.72 1.324-2.246A4.535 4.535 0 019 6.092V6z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <div className="text-xs opacity-80 mt-1">원</div>
        </div>
      </div>

      {/* 시세 테이블 섹션 */}
      <div className="card-modern p-4 dark:bg-gray-900/80 dark:backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-light-muted dark:text-dark-muted">코인 데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-lg mb-4">데이터를 불러올 수 없습니다</div>
            <p className="text-light-muted dark:text-dark-muted mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              새로고침
            </button>
          </div>
        ) : (
          <>
            {/* 검색 바 */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="코인명 또는 심볼로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 pr-4 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 코인 테이블 */}
            <CoinTable 
              upbitData={upbitData}
              binanceData={binanceData}
              exchangeRate={exchangeRate}
              searchTerm={searchTerm}
            />
          </>
        )}
      </div>
    </div>
  );
} 