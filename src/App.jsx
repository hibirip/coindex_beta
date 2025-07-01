import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './Home';
import CoinPrice from './CoinPrice';
import CoinNews from './CoinNews';
import Event from './Event';
import Community from './Community';
import MyPage from './MyPage';
import SignInModal from './components/SignInModal';
import SignUpModal from './components/SignUpModal';
import ProfileAvatar from './components/ProfileAvatar';
// import CoinNews from './CoinNews';
// import CoinStatus from './CoinStatus';
// import Community from './Community';
// 아래 컴포넌트는 더미로 곧 생성 예정
// const CoinPrice = () => <div className="text-gray-400">코인시세 페이지</div>;
const CoinStatus = () => <div className="text-gray-400">코인시황 페이지</div>;

// Heroicons (Sun, Moon) SVG 직접 사용
function SunIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.06 1.06M6.343 17.657l-1.06 1.06m12.02 0l-1.06-1.06M6.343 6.343l-1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"></path>
    </svg>
  );
}
function MoonIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"></path>
    </svg>
  );
}

const MENU_ITEMS = [
  { name: '홈', link: '/' },
  { name: '코인시세', link: '/price' },
  { name: '코인시황', link: '/status' },
  { name: '코인뉴스', link: '/news' },
  { name: '분석&커뮤니티', link: '/community' },
  { name: '이벤트', link: '/event' },
];

function MainBanner() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const timer = setTimeout(() => setShouldLoadVideo(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mb-8">
      <div className="relative w-full h-[250px] card-modern overflow-hidden group">
        {shouldLoadVideo && !isMobile ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          >
            <source src="/banner-video.webm" type="video/webm" />
            <source src="/banner-video.mp4" type="video/mp4" />
          </video>
        ) : (
          <img 
            src="/banner-poster.jpg" 
            alt="COINDEX 배너"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-700/10" />
        
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-500 rounded-full blur-3xl opacity-10" />
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-700 rounded-full opacity-10" />
      </div>
    </div>
  );
}

function DarkModeToggle({ isDark, onToggle }) {
  return (
    <button 
      onClick={onToggle}
      className="p-2.5 rounded-xl glass hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all duration-200"
      aria-label={isDark ? '라이트모드로 전환' : '다크모드로 전환'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-yellow-500" />
      ) : (
        <MoonIcon className="w-5 h-5 text-primary-600" />
      )}
    </button>
  );
}

function Header({ isDark, onToggleDarkMode }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 사용자 정보 가져오기
  useEffect(() => {
    if (user) {
      const fetchUserInfo = async () => {
        const { supabase } = await import('./lib/supabase');
        const { data } = await supabase
          .from('users')
          .select('nickname, gradient_colors')
          .eq('id', user.id)
          .single();
        setUserInfo(data);
      };
      fetchUserInfo();
    }
  }, [user]);

  // 모바일 메뉴가 열릴 때 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg' : 'bg-light-surface/95 dark:bg-dark-surface/95'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="COINDEX"
              className="h-8 object-contain hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {MENU_ITEMS.map((item) => {
              const isActive = location.pathname === item.link;
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 우측 액션 버튼 */}
          <div className="flex items-center space-x-3">
            <DarkModeToggle isDark={isDark} onToggle={onToggleDarkMode} />
            
            {/* 데스크톱 사용자 메뉴 */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  <Link to="/mypage" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <ProfileAvatar
                      gradientColors={userInfo?.gradient_colors}
                      nickname={userInfo?.nickname}
                      size="sm"
                    />
                    <span className="hidden sm:block text-sm font-medium">마이페이지</span>
                  </Link>
                  <button 
                    onClick={() => signOut()}
                    className="btn-secondary"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setSignInModalOpen(true)}
                    className="btn-primary"
                  >
                    로그인
                  </button>
                  <button 
                    onClick={() => setSignUpModalOpen(true)}
                    className="btn-secondary"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
            
            {/* 모바일 메뉴 버튼 */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-16 z-40">
            {/* 배경 오버레이 */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* 메뉴 컨텐츠 */}
            <div className="relative bg-light-surface dark:bg-dark-surface border-b border-light-border dark:border-dark-border shadow-xl">
              <div className="px-4 py-6 space-y-1">
                {/* 네비게이션 메뉴 */}
                {MENU_ITEMS.map((item) => {
                  const isActive = location.pathname === item.link;
                  return (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-light-text dark:text-dark-text'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* 구분선 */}
                <hr className="my-4 border-light-border dark:border-dark-border" />
                
                {/* 사용자 메뉴 */}
                {user ? (
                  <div className="space-y-2">
                    <Link 
                      to="/mypage" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <ProfileAvatar
                        gradientColors={userInfo?.gradient_colors}
                        nickname={userInfo?.nickname}
                        size="sm"
                      />
                      <span className="font-medium">마이페이지</span>
                    </Link>
                    <button 
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSignInModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                    >
                      로그인
                    </button>
                    <button 
                      onClick={() => {
                        setSignUpModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 border border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      회원가입
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    
    {/* 모달들 */}
    <SignInModal
      isOpen={signInModalOpen}
      onClose={() => setSignInModalOpen(false)}
      onSignUpClick={() => setSignUpModalOpen(true)}
    />
    
    <SignUpModal
      isOpen={signUpModalOpen}
      onClose={() => setSignUpModalOpen(false)}
    />
  </>
  );
}

function SideBanner() {
  return (
    <div className="sticky top-20">
      <div className="card-modern h-[600px] p-6 flex flex-col items-center justify-center">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold gradient-text mb-2">광고 영역</h3>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            프리미엄 서비스를 만나보세요
          </p>
        </div>
        <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

function AppContent() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('isDarkMode');
      return saved === null ? false : JSON.parse(saved);
    } catch {
      return false;
    }
  });

  // 다크모드 전환 시 body에 dark 클래스 토글
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    try {
      localStorage.setItem('isDarkMode', JSON.stringify(isDark));
    } catch {}
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-200">
      <Header isDark={isDark} onToggleDarkMode={toggleDarkMode} />

      {/* 헤더 높이만큼 여백 */}
      <div className="h-16" />

      {/* 메인 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 메인베너 */}
        <MainBanner />

        {/* 메인 컨텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-8">
          {/* 왼쪽 사이드바 */}
          <aside className="hidden lg:block">
            <SideBanner />
          </aside>

          {/* 메인 컨텐츠 */}
                     <main className="min-w-0">
             <Routes>
               <Route path="/" element={<Home />} />
               <Route path="/price" element={<CoinPrice />} />
               <Route path="/news" element={<CoinNews />} />
               <Route path="/event" element={<Event />} />
               <Route path="/status" element={<CoinStatus />} />
               <Route path="/community" element={<Community />} />
               <Route path="/mypage" element={<MyPage />} />
             </Routes>
           </main>

          {/* 오른쪽 사이드바 */}
          <aside className="hidden lg:block">
            <SideBanner />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}