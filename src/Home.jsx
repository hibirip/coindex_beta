import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoinNews from './CoinNews';
import useCryptoData from './hooks/useCryptoData';
import CoinTable from './components/CoinTable';
import { supabase } from './lib/supabase';

function NewsPreview() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});

  const translateText = async (text, id) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTranslations(prev => ({
          ...prev,
          [id]: data.translatedText
        }));
      }
    } catch (error) {
      console.error('번역 실패:', error);
    }
  };

  useEffect(() => {
    async function fetchNews() {
      try {
        console.log('📰 홈페이지 뉴스 프리뷰 가져오는 중...');
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error(`뉴스 fetch 실패: ${res.status}`);
        const data = await res.json();
        console.log('✅ 홈페이지 뉴스 성공:', data.length, '개');
        const previewNews = data.slice(0, 4); // 최신 4개만 표시
        setNews(previewNews);
        
        // 영어 뉴스 번역 시작
        previewNews.forEach(item => {
          if (item.title && !item.title.match(/[가-힣]/)) {
            translateText(item.title, `${item.id}-title`);
          }
          if (item.summary && !item.summary.match(/[가-힣]/)) {
            translateText(item.summary, `${item.id}-summary`);
          }
        });
      } catch (error) {
        console.error('❌ 홈페이지 뉴스 에러:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center text-light-muted dark:text-dark-muted py-8">
        뉴스가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {news.map((item) => (
        <div key={item.id} className="group cursor-pointer">
          <div className="flex gap-3 p-4 rounded-xl bg-light-surface dark:bg-dark-surface hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200">
            {/* 썸네일 */}
            {item.thumbnail && (
              <div className="flex-shrink-0">
                <img 
                  src={item.thumbnail} 
                  alt="뉴스 썸네일"
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* 뉴스 내용 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {translations[`${item.id}-title`] || item.title}
                {translations[`${item.id}-title`] && (
                  <span className="text-xs text-primary-400 ml-1">(번역됨)</span>
                )}
              </h3>
              <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2">
                {translations[`${item.id}-summary`] || item.summary}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-light-muted dark:text-dark-muted">{item.source}</span>
                <span className="text-xs text-primary-500">
                  {new Date(item.published_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityPreview() {
  const [topPosts, setTopPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        // TOP3 글 가져오기 (좋아요 순, AI 분석가 제외 - 커뮤니티 페이지와 동일 조건)
        const { data: topData, error: topError } = await supabase
          .from('posts')
          .select('id, title, user:users(nickname), likes_count, created_at')
          .eq('is_gpt', false)
          .order('likes_count', { ascending: false })
          .limit(3);

        if (topError) throw topError;

        // 최신 글 3개 가져오기 (AI 분석가 제외 - 커뮤니티 페이지와 동일 조건)
        const { data: recentData, error: recentError } = await supabase
          .from('posts')
          .select('id, title, user:users(nickname), likes_count, created_at')
          .eq('is_gpt', false)
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentError) throw recentError;

        setTopPosts(topData || []);
        setRecentPosts(recentData || []);
      } catch (error) {
        console.error('❌ 커뮤니티 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    // 초기 데이터 로드
    fetchCommunityData();

    // 30초마다 데이터 새로고침 (GPT 글이 랜덤하게 업로드되므로)
    const interval = setInterval(fetchCommunityData, 30000);

    // 컴포넌트 언마운트 시 정리
    return () => clearInterval(interval);
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/community?postId=${postId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* TOP3 분석글 */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-3">🔥 분석글 TOP3</h3>
        <div className="space-y-2">
          {topPosts.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">글이 없습니다.</div>
          ) : (
            topPosts.map((post, index) => (
              <div 
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors group"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div className="flex-1 truncate group-hover:font-medium transition-all">
                  {post.title}
                </div>
                <div className="flex items-center gap-1 text-xs text-primary-500">
                  <span>👍</span>
                  <span>{post.likes_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 최신 토론 */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-3">💬 최신 토론</h3>
        <div className="space-y-2">
          {recentPosts.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">글이 없습니다.</div>
          ) : (
            recentPosts.map((post) => (
              <div 
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="flex items-center justify-between text-sm text-light-text dark:text-dark-text hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors group"
              >
                <div className="flex-1 truncate group-hover:font-medium transition-all">
                  {post.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted">
                  <span>{post.user?.nickname || '익명'}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { upbitData, binanceData, exchangeRate, loading, error } = useCryptoData();
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어가 있으면 전체 데이터에서 검색, 없으면 상위 10개 코인 선택 (거래대금 기준)
  const displayCoins = upbitData ? 
    searchTerm ? 
      upbitData // 검색 시에는 전체 데이터 사용 (CoinTable에서 필터링)
      : [...upbitData]
          .sort((a, b) => (b.acc_trade_price_24h || 0) - (a.acc_trade_price_24h || 0))
          .slice(0, 10) // 검색어 없을 때만 TOP 10
    : [];

  useEffect(() => {
    // html/body에 dark 클래스가 있으면 다크모드로 간주
    const checkDark = () => {
      return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    };
    setIsDark(checkDark());
    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const tradingViewTheme = isDark ? 'dark' : 'light';
  const tradingViewSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_12345&symbol=BINANCE:BTCUSDT&interval=15&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=${tradingViewTheme}&style=1&timezone=Asia%2FSeoul&withdateranges=1&hidevolume=1&hidelegend=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=ko`;

  return (
    <div className="space-y-6">
      {/* 비트코인 차트 섹션 */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">비트코인 실시간 차트</h2>
          <span className="text-sm text-light-muted dark:text-dark-muted">
            BTCUSDT • 15분
          </span>
        </div>
        <div className="w-full h-80 rounded-xl overflow-hidden shadow-inner-glow">
          <iframe
            src={tradingViewSrc}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            title="비트코인 실시간 차트"
          ></iframe>
        </div>
      </div>

      {/* 코인 시세 섹션 */}
      <div className="card-modern p-4 dark:bg-gray-900/80 dark:backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">
            {searchTerm ? `"${searchTerm}" 검색 결과` : '실시간 코인 시세 TOP 10'}
          </h2>
          <div className="flex items-center gap-4">
            {/* 환율 표시 */}
            {exchangeRate && (
              <div className="text-sm text-light-muted dark:text-dark-muted">
                <span className="mr-2">환율: ₩{exchangeRate.toLocaleString()}/USD</span>
                <span className="text-xs">
                  (실시간)
                </span>
              </div>
            )}
            <a href="/coin-price" className="text-sm text-primary-500 hover:text-primary-600 transition-colors">
              더보기 →
            </a>
          </div>
        </div>
        
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
              upbitData={displayCoins} 
              binanceData={binanceData} 
              exchangeRate={exchangeRate} 
              searchTerm={searchTerm}
            />
          </>
        )}
      </div>

      {/* 뉴스 프리뷰 섹션 */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">최신 뉴스</h2>
          <a href="/news" className="text-sm text-primary-500 hover:text-primary-600 transition-colors">
            더보기 →
          </a>
        </div>
        <NewsPreview />
      </div>

      {/* 분석&커뮤니티 섹션 */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">분석 & 커뮤니티</h2>
          <a href="/community" className="text-sm text-primary-500 hover:text-primary-600 transition-colors">
            더보기 →
          </a>
        </div>
        <CommunityPreview />
      </div>
    </div>
  );
} 