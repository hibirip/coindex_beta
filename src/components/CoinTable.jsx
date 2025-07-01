import React, { useEffect, useRef, useState } from 'react';

function percent(val, digits = 2) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return (val > 0 ? '+' : '') + val.toFixed(digits) + '%';
}

function price(val, digits = 0, unit = '₩') {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return unit + val.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function volume(val) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  if (val >= 1e12) return (val / 1e12).toFixed(0) + '조원';
  if (val >= 1e8) return (val / 1e8).toFixed(0) + '억원';
  if (val >= 1e4) return (val / 1e4).toFixed(0) + '만원';
  return val.toLocaleString() + '원';
}

// 코인 심볼별 로고 URL
function getCoinLogoUrl(symbol) {
  return `https://static.upbit.com/logos/${symbol.toUpperCase()}.png`;
}

function StarIcon({ filled, ...props }) {
  return filled ? (
    <svg viewBox="0 0 20 20" fill="#facc15" stroke="#facc15" width={14} height={14} {...props}>
      <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" stroke="#9ca3af" width={14} height={14} {...props}>
      <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
    </svg>
  );
}

export default function CoinTable({ upbitData, binanceData, exchangeRate, searchTerm }) {
  const [flashMap, setFlashMap] = useState({});
  const prevPrices = useRef({});
  // 거래대금 기준 고정 정렬 (변경 불가)
  const [sortKey, setSortKey] = useState('acc_trade_price_24h');
  const [sortOrder, setSortOrder] = useState('desc');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coinFavorites') || '[]');
    } catch {
      return [];
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  // 안정적인 정렬을 위한 초기 순서 저장
  const [initialOrder, setInitialOrder] = useState({});

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 바이낸스 데이터를 맵으로 변환
  const binanceMap = {};
  if (binanceData) {
    binanceData.forEach(coin => {
      if (coin.symbol.endsWith('USDT')) {
        const symbol = coin.symbol.replace('USDT', '');
        binanceMap[symbol] = coin;
      }
    });
  }

  // 김프 계산 함수
  const calculateKimchiPremium = (upbitPrice, binancePrice) => {
    if (!upbitPrice || !binancePrice || !exchangeRate) return null;
    const binancePriceKRW = binancePrice * exchangeRate;
    return ((upbitPrice - binancePriceKRW) / binancePriceKRW) * 100;
  };

  // 업비트 데이터 처리 및 중복 제거
  let processedCoins = [];
  const uniqueMarkets = new Set();
  
  if (upbitData && upbitData.length > 0) {
    processedCoins = upbitData
      .filter(coin => {
        // 중복 제거
        if (uniqueMarkets.has(coin.market)) {
          return false;
        }
        uniqueMarkets.add(coin.market);
        return true;
      })
      .map(coin => {
        const symbol = coin.market.replace('KRW-', '');
        const binanceCoin = binanceMap[symbol];
        const kimchiPremium = calculateKimchiPremium(
          coin.trade_price, 
          binanceCoin ? parseFloat(binanceCoin.lastPrice) : null
        );

        // 업비트 마켓에서 한글명 찾기
        const marketInfo = coin.korean_name || coin.market.replace('KRW-', '');

        return {
          ...coin,
          symbol,
          koreanName: marketInfo,
          kimchiPremium,
          binancePrice: binanceCoin ? parseFloat(binanceCoin.lastPrice) : null
        };
      });

    // 초기 순서 설정 (거래대금 기준 내림차순으로 고정)
    processedCoins.sort((a, b) => {
      const aVal = a.acc_trade_price_24h || 0;
      const bVal = b.acc_trade_price_24h || 0;
      if (aVal === bVal) {
        // 거래대금이 같으면 심볼 순으로 안정적 정렬
        return a.symbol.localeCompare(b.symbol);
      }
      return bVal - aVal; // 내림차순
    });

    // 초기 순서를 인덱스로 저장 (순서 고정용)
    const newInitialOrder = {};
    processedCoins.forEach((coin, index) => {
      newInitialOrder[coin.market] = index;
    });
    setInitialOrder(newInitialOrder);
  }

  // 가격 변동 감지 및 플래시 효과
  useEffect(() => {
    if (!processedCoins.length) return;
    const newFlashMap = {};
    
    processedCoins.forEach((coin) => {
      const prev = prevPrices.current[coin.market];
      if (prev !== undefined && prev !== coin.trade_price) {
        if (coin.trade_price > prev) {
          newFlashMap[coin.market] = 'up';
        } else if (coin.trade_price < prev) {
          newFlashMap[coin.market] = 'down';
        }
      }
      prevPrices.current[coin.market] = coin.trade_price;
    });
    
    if (Object.keys(newFlashMap).length > 0) {
      setFlashMap(newFlashMap);
      const timeout = setTimeout(() => setFlashMap({}), 200);
      return () => clearTimeout(timeout);
    }
  }, [processedCoins]);

  const toggleFavorite = (symbol) => {
    setFavorites((prev) => {
      let next;
      if (prev.includes(symbol)) {
        next = prev.filter((s) => s !== symbol);
      } else {
        next = [...prev, symbol];
      }
      localStorage.setItem('coinFavorites', JSON.stringify(next));
      return next;
    });
  };

  if (!processedCoins.length) {
    return (
      <div className="text-center py-8 text-light-muted dark:text-dark-muted">
        코인 데이터를 불러오는 중입니다...
      </div>
    );
  }

  // 검색 필터링
  let filteredCoins = processedCoins;
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filteredCoins = processedCoins.filter(coin => {
      const symbol = coin.symbol.toLowerCase();
      const name = coin.koreanName.toLowerCase();
      return symbol.includes(term) || name.includes(term);
    });
  }

  // 거래대금 기준 고정 정렬 (순서 변경 없음)
  let sortedCoins = [...filteredCoins];
  
  // 초기 순서 기준으로 안정적 정렬
  sortedCoins.sort((a, b) => {
    const aOrder = initialOrder[a.market] ?? 999999;
    const bOrder = initialOrder[b.market] ?? 999999;
    return aOrder - bOrder;
  });

  // 정렬 기능 제거 (고정 정렬)
  const handleSort = (key) => {
    // 거래대금 기준 고정 정렬이므로 정렬 변경 불가
    return;
  };

  const getSortIcon = (key) => {
    // 거래대금만 정렬 표시
    if (key === 'acc_trade_price_24h') {
      return <span className="inline-block align-middle ml-1">▼</span>;
    }
    return null;
  };

  // 모바일 카드 렌더링
  const renderMobileCard = (coin) => {
    const isFavorite = favorites.includes(coin.symbol);
    const isPositive = coin.signed_change_rate >= 0;
    const flash = flashMap[coin.market];
    
    return (
      <div 
        key={coin.market}
        className={`
          bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700
          ${isFavorite ? 'ring-2 ring-yellow-300 dark:ring-yellow-600' : ''}
          ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}
          transition-all duration-200
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleFavorite(coin.symbol)}
              className="flex-shrink-0 p-1 hover:scale-110 transition-transform"
            >
              <StarIcon filled={isFavorite} />
            </button>
            <img 
              src={getCoinLogoUrl(coin.symbol)} 
              alt={coin.symbol}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/32/888888/ffffff?text=${coin.symbol[0]}`;
              }}
            />
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {coin.koreanName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {coin.symbol}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${
              flash === 'up' ? 'text-red-500' : 
              flash === 'down' ? 'text-blue-500' : 
              'text-black dark:text-gray-200'
            }`}>
              {price(coin.trade_price)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400 mb-1">전일대비</div>
            <div className={`font-semibold ${
              isPositive ? 'text-red-500' : 'text-blue-500'
            }`}>
              {percent(coin.signed_change_rate * 100)}
            </div>
            <div className={`text-xs ${
              isPositive ? 'text-red-400' : 'text-blue-400'
            }`}>
              {price(coin.signed_change_price)}
            </div>
          </div>
          
          <div>
            <div className="text-gray-500 dark:text-gray-400 mb-1">거래대금</div>
            <div className="font-medium text-gray-700 dark:text-gray-300">
              {volume(coin.acc_trade_price_24h)}
            </div>
          </div>
          
          {coin.kimchiPremium !== null && (
            <div className="col-span-2">
              <div className="text-gray-500 dark:text-gray-400 mb-1">김치프리미엄</div>
              <div className={`font-semibold ${
                coin.kimchiPremium > 0 ? 'text-red-500' : 
                coin.kimchiPremium < 0 ? 'text-blue-500' : 
                'text-gray-500 dark:text-gray-400'
              }`}>
                {percent(coin.kimchiPremium)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 모바일 버전
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* 거래대금 기준 고정 정렬 안내 */}
        <div className="flex items-center justify-center mb-4">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              📊 거래대금 순 정렬
            </span>
          </div>
        </div>

        {/* 모바일 카드 리스트 */}
        {sortedCoins.map(renderMobileCard)}
        
        {/* 검색 결과가 없을 때 */}
        {filteredCoins.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">"{searchTerm}" 검색 결과가 없습니다</p>
              <p className="text-sm">다른 검색어로 시도해보세요</p>
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes flash-up {
            0% { background-color: rgba(239, 68, 68, 0); }
            50% { background-color: rgba(239, 68, 68, 0.15); }
            100% { background-color: rgba(239, 68, 68, 0); }
          }
          
          @keyframes flash-down {
            0% { background-color: rgba(59, 130, 246, 0); }
            50% { background-color: rgba(59, 130, 246, 0.15); }
            100% { background-color: rgba(59, 130, 246, 0); }
          }
          
          .flash-up {
            animation: flash-up 0.2s ease-in-out;
          }
          
          .flash-down {
            animation: flash-down 0.2s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // 데스크톱 버전
  return (
    <div className="overflow-x-auto rounded-lg dark:bg-gray-900/50">
      <table className="w-full">
        <thead className="dark:bg-gray-800/50">
          <tr className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <th className="text-left py-1.5 px-2 font-medium">
              <div className="flex items-center gap-1">
                <span>코인</span>
              </div>
            </th>
            <th className="text-right py-1.5 px-2 font-medium">
              <div className="flex items-center justify-end gap-1">
                <span>현재가</span>
              </div>
            </th>
            <th className="text-right py-1.5 px-2 font-medium">
              <div className="flex items-center justify-end gap-1">
                <span>전일대비</span>
              </div>
            </th>
            <th className="text-right py-1.5 px-2 font-medium hidden sm:table-cell">
              <div className="flex items-center justify-end gap-1">
                <span>거래대금</span>
                {getSortIcon('acc_trade_price_24h')}
              </div>
            </th>
            <th className="text-right py-1.5 px-2 font-medium hidden md:table-cell">
              <div className="flex items-center justify-end gap-1">
                <span>김프</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCoins.map((coin) => {
            const isFavorite = favorites.includes(coin.symbol);
            const isPositive = coin.signed_change_rate >= 0;
            const flash = flashMap[coin.market];
            
            return (
              <tr 
                key={coin.market} 
                className={`
                  border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200
                  ${isFavorite ? 'bg-yellow-50/20 dark:bg-yellow-900/5 hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10' : ''}
                  ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}
                `}
              >
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(coin.symbol)}
                      className="flex-shrink-0 p-0.5 hover:scale-110 transition-transform"
                      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <StarIcon filled={isFavorite} />
                    </button>
                    <img 
                      src={getCoinLogoUrl(coin.symbol)} 
                      alt={coin.symbol}
                      className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/20/888888/ffffff?text=${coin.symbol[0]}`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                        {coin.koreanName}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-500">
                        {coin.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-1.5 px-2">
                  <div className={`font-semibold text-xs transition-all duration-200 ${
                    flash === 'up' ? 'text-red-500' : 
                    flash === 'down' ? 'text-blue-500' : 
                    'text-black dark:text-gray-200'
                  }`}>
                    {price(coin.trade_price)}
                  </div>
                  {coin.binancePrice && exchangeRate && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {price(coin.binancePrice * exchangeRate)}
                    </div>
                  )}
                </td>
                <td className="text-right py-1.5 px-2">
                  <div className={`text-xs font-semibold ${
                    isPositive ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    <div>{percent(coin.signed_change_rate * 100)}</div>
                    <div className="text-[10px] opacity-80">{price(coin.signed_change_price)}</div>
                  </div>
                </td>
                <td className="text-right py-1.5 px-2 hidden sm:table-cell">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {volume(coin.acc_trade_price_24h)}
                  </div>
                </td>
                <td className="text-right py-1.5 px-2 hidden md:table-cell">
                  <div className={`text-xs font-semibold ${
                    coin.kimchiPremium > 0 ? 'text-red-500' : 
                    coin.kimchiPremium < 0 ? 'text-blue-500' : 
                    'text-gray-500 dark:text-gray-400'
                  }`}>
                    {coin.kimchiPremium !== null ? percent(coin.kimchiPremium) : '-'}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* 검색 결과가 없을 때 */}
      {filteredCoins.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">"{searchTerm}" 검색 결과가 없습니다</p>
            <p className="text-sm">다른 검색어로 시도해보세요</p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes flash-up {
          0% { background-color: rgba(239, 68, 68, 0); }
          50% { background-color: rgba(239, 68, 68, 0.15); }
          100% { background-color: rgba(239, 68, 68, 0); }
        }
        
        @keyframes flash-down {
          0% { background-color: rgba(59, 130, 246, 0); }
          50% { background-color: rgba(59, 130, 246, 0.15); }
          100% { background-color: rgba(59, 130, 246, 0); }
        }
        
        .flash-up {
          animation: flash-up 0.2s ease-in-out;
        }
        
        .flash-down {
          animation: flash-down 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
} 