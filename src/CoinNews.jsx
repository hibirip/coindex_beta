import { useEffect, useState } from 'react';

const RSS_URL = '/api/news';

export default function CoinNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const fetchRss = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📰 뉴스 데이터 가져오는 중...');
      const res = await fetch(RSS_URL);
      if (!res.ok) throw new Error(`뉴스 fetch 실패: ${res.status}`);
      const data = await res.json();
      console.log('✅ 뉴스 데이터 성공:', data.length, '개');
      setNews(data);
      
      // 영어 뉴스 번역 시작
      data.forEach(item => {
        if (item.title && !item.title.match(/[가-힣]/)) {
          translateText(item.title, `${item.id}-title`);
        }
        if (item.summary && !item.summary.match(/[가-힣]/)) {
          translateText(item.summary, `${item.id}-summary`);
        }
      });
    } catch (e) {
      console.error('❌ 뉴스 fetch 에러:', e);
      setError('뉴스를 불러오는데 실패했습니다.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRss();
    const interval = setInterval(fetchRss, 30 * 60 * 1000); // 30분마다
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { id: 'all', name: '전체', icon: '📰' },
    { id: 'btc', name: 'Bitcoin', icon: '₿' },
    { id: 'eth', name: 'Ethereum', icon: 'Ξ' },
    { id: 'altcoin', name: 'Altcoin', icon: '🪙' },
    { id: 'defi', name: 'DeFi', icon: '🏦' },
    { id: 'nft', name: 'NFT', icon: '🎨' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-modern p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card-modern p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">{error}</div>
            <button onClick={fetchRss} className="btn-primary">
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold gradient-text">코인 뉴스</h1>
          <button onClick={fetchRss} className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-light-surface dark:bg-dark-surface text-light-muted dark:text-dark-muted hover:bg-primary-100 dark:hover:bg-primary-900/20'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 뉴스 리스트 */}
      <div className="card-modern p-6">
        {news.length === 0 ? (
          <div className="text-center py-12 text-light-muted dark:text-dark-muted">
            뉴스가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, index) => (
              <article key={item.id || index} className="group">
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block p-4 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                >
                  <div className="flex gap-4">
                    {/* 썸네일 */}
                    {item.thumbnail && (
                      <div className="flex-shrink-0">
                        <img 
                          src={item.thumbnail} 
                          alt="뉴스 썸네일"
                          className="w-20 h-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* 뉴스 내용 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-light-text dark:text-dark-text mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {translations[`${item.id}-title`] || item.title}
                        {translations[`${item.id}-title`] && (
                          <span className="text-xs text-primary-400 ml-2">(번역됨)</span>
                        )}
                      </h3>
                      <p className="text-sm text-light-muted dark:text-dark-muted mb-3 line-clamp-2">
                        {translations[`${item.id}-summary`] || item.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-primary-500 font-medium">{item.source}</span>
                          <span className="text-light-muted dark:text-dark-muted">
                            {item.published_at ? new Date(item.published_at).toLocaleString('ko-KR') : ''}
                          </span>
                        </div>
                        <span className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          자세히 보기 →
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 