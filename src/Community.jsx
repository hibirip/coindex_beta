import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import ProfileAvatar from './components/ProfileAvatar';
import PostWriteModal from './components/PostWriteModal';
import PostEditModal from './components/PostEditModal';
import SignInModal from './components/SignInModal';

export default function Community() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [userProfiles, setUserProfiles] = useState({});
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 10;

  // URL 파라미터에서 postId 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const postId = urlParams.get('postId');
    if (postId) {
      setExpandedPostId(postId);
      // URL에서 파라미터 제거
      navigate('/community', { replace: true });
      
      // 잠시 후 해당 글로 스크롤
      setTimeout(() => {
        const element = document.getElementById(`post-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [location.search, navigate]);

  // 게시글 목록 가져오기
  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      
      // 인기글 (좋아요 순 상위 3개, AI 분석가 제외)
      const { data: popular } = await supabase
        .from('posts')
        .select('*, user:users(id, nickname, gradient_colors)')
        .eq('is_gpt', false)
        .order('likes_count', { ascending: false })
        .limit(3);

      // 전체 글 개수 조회 (AI 분석가 포함)
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // 페이지네이션된 최신글 (created_at 기준 최신순, AI 분석가 포함)
      // 최신 업로드된 글이 항상 맨 위로 오도록 정렬
      const from = (page - 1) * postsPerPage;
      const to = from + postsPerPage - 1;
      
      const { data: recent } = await supabase
        .from('posts')
        .select('*, user:users(id, nickname, gradient_colors)')
        .order('created_at', { ascending: false }) // 최신글이 맨 위로
        .range(from, to);

      setPopularPosts(popular || []);
      setPosts(recent || []);
      setTotalPosts(count || 0);

      // 사용자 프로필 정보 저장
      const profiles = {};
      [...(popular || []), ...(recent || [])].forEach(post => {
        if (post.user) {
          profiles[post.user_id] = post.user;
        }
      });
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 좋아요 상태 확인
  const checkLikeStatus = async (postIds) => {
    if (!user || postIds.length === 0) return {};
    
    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    const likedPosts = {};
    (data || []).forEach(like => {
      likedPosts[like.post_id] = true;
    });
    return likedPosts;
  };

  // 좋아요 토글 (새로고침 시 현재 페이지 유지)
  const toggleLike = async (postId) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 이미 좋아요했는지 확인
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (existing) {
        // 좋아요 취소
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        // likes_count 감소
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        // 좋아요 추가
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });
        
        // likes_count 증가
        await supabase.rpc('increment_likes', { post_id: postId });
      }

      fetchPosts(currentPage); // 현재 페이지에서 새로고침
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // 게시글 삭제 (삭제 후 첫 페이지로 이동)
  const deletePost = async (postId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      // 삭제 후 첫 페이지로 이동하여 최신 목록 확인
      setCurrentPage(1);
      fetchPosts(1);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
    
    // 실시간 구독: 새 글이 추가되면 첫 페이지로 이동하여 최신 목록 표시
    const subscription = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'posts'
          // AI 분석가 글도 포함하여 모든 글 감지
        }, 
        (payload) => {
          console.log('새 글이 업로드됨:', payload.new);
          // 새 글이 추가되면 첫 페이지로 이동하여 최신글 확인
          if (currentPage !== 1) {
            setCurrentPage(1);
            fetchPosts(1);
          } else {
            fetchPosts(1); // 이미 첫 페이지면 새로고침
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public', 
          table: 'posts'
          // AI 분석가 글도 포함하여 모든 글 감지
        },
        (payload) => {
          console.log('글이 삭제됨:', payload.old);
          // 글이 삭제되면 현재 페이지 새로고침
          fetchPosts(currentPage);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentPage]);

  // 좋아요 상태 확인
  const [likedPosts, setLikedPosts] = useState({});
  useEffect(() => {
    const postIds = [...posts, ...popularPosts].map(p => p.id);
    checkLikeStatus(postIds).then(setLikedPosts);
  }, [posts, popularPosts, user]);

  const TopPostCard = ({ post, rank }) => {
    const profile = userProfiles[post.user_id];
    const isExpanded = expandedPostId === post.id;

    return (
      <div 
        id={`post-${post.id}`}
        className="card-modern p-4 cursor-pointer transition-all hover:shadow-lg border-l-4 border-yellow-500"
        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white text-sm font-bold rounded-full">
              {rank}
            </div>
            <ProfileAvatar
              gradientColors={profile?.gradient_colors}
              nickname={profile?.nickname || '익명'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-light-text dark:text-dark-text truncate">
                {profile?.nickname || '익명'}
              </div>
              <h3 className="font-semibold text-light-text dark:text-dark-text truncate">
                {post.title}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes_count || 0}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
            <p className="text-light-muted dark:text-dark-muted whitespace-pre-wrap">
              {post.content}
            </p>
            <div className="flex items-center justify-between mt-4 text-xs text-light-muted dark:text-dark-muted">
              <span>{new Date(post.created_at).toLocaleString()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(post.id);
                }}
                className={`flex items-center gap-1 transition-colors ${
                  likedPosts[post.id]
                    ? 'text-red-500'
                    : 'text-light-muted dark:text-dark-muted hover:text-red-500'
                }`}
              >
                <svg className="w-4 h-4" fill={likedPosts[post.id] ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                좋아요
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PostCard = ({ post, isPopular = false }) => {
    const isAuthor = user?.id === post.user_id;
    const profile = userProfiles[post.user_id];
    const isLiked = likedPosts[post.id];
    const isExpanded = expandedPostId === post.id;

    return (
      <div 
        id={`post-${post.id}`}
        className={`card-modern p-4 cursor-pointer transition-all hover:shadow-lg ${isPopular ? 'border-2 border-primary-500' : ''}`}
        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              gradientColors={profile?.gradient_colors}
              nickname={profile?.nickname || '익명'}
              size="sm"
            />
            <div>
              <div className="font-medium text-light-text dark:text-dark-text">
                {profile?.nickname || '익명'}
              </div>
              <div className="text-xs text-light-muted dark:text-dark-muted">
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPost(post);
                    setEditModalOpen(true);
                  }}
                  className="text-xs text-primary-500 hover:text-primary-600"
                >
                  수정
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePost(post.id);
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            )}
            
            <svg 
              className={`w-4 h-4 transition-transform text-light-muted dark:text-dark-muted ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2 text-light-text dark:text-dark-text">
          {isPopular && <span className="text-yellow-500 mr-2">🔥</span>}
          {post.title}
        </h3>
        
        {isExpanded ? (
          <p className="text-light-muted dark:text-dark-muted mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
        ) : (
          <p className="text-light-muted dark:text-dark-muted mb-3 line-clamp-3">
            {post.content}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(post.id);
            }}
            className={`flex items-center gap-1 transition-colors ${
              isLiked
                ? 'text-red-500'
                : 'text-light-muted dark:text-dark-muted hover:text-red-500'
            }`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likes_count || 0}
          </button>
        </div>
      </div>
    );
  };

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = () => {
    if (user) {
      setWriteModalOpen(true);
    } else {
      setSignInModalOpen(true);
    }
  };

  // 글쓰기 성공 시 첫 페이지로 이동
  const handleWriteSuccess = () => {
    setWriteModalOpen(false);
    setCurrentPage(1); // 첫 페이지로 이동
    fetchPosts(1); // 최신 목록 가져오기
  };

  // 글 수정 성공 시 현재 페이지 유지
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingPost(null);
    fetchPosts(currentPage); // 현재 페이지에서 새로고침
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedPostId(null); // 페이지 변경시 확장된 글 닫기
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // 페이지네이션 컴포넌트
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5; // 표시할 페이지 번호 개수
      
      let start = Math.max(1, currentPage - Math.floor(showPages / 2));
      let end = Math.min(totalPages, start + showPages - 1);
      
      // 끝에서부터 계산했을 때 start 조정
      if (end - start < showPages - 1) {
        start = Math.max(1, end - showPages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* 이전 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border
                   text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {/* 첫 페이지 */}
        {getPageNumbers()[0] > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border
                       text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg"
            >
              1
            </button>
            {getPageNumbers()[0] > 2 && (
              <span className="px-2 text-light-muted dark:text-dark-muted">...</span>
            )}
          </>
        )}

        {/* 페이지 번호들 */}
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border
                       ${page === currentPage
                         ? 'bg-primary-500 text-white border-primary-500'
                         : 'text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg'
                       }`}
          >
            {page}
          </button>
        ))}

        {/* 마지막 페이지 */}
        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <span className="px-2 text-light-muted dark:text-dark-muted">...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border
                       text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* 다음 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border
                   text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 인기글 섹션 */}
      {popularPosts.length > 0 && (
        <div className="card-modern p-6">
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">🔥 분석글 TOP3</h2>
          <div className="space-y-3">
            {popularPosts.slice(0, 3).map((post, index) => (
              <TopPostCard key={post.id} post={post} rank={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="card-modern p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text">최신 분석 & 토론</h2>
          <div className="text-sm text-light-muted dark:text-dark-muted">
            총 {totalPosts}개 글 • {currentPage}/{totalPages} 페이지
          </div>
        </div>
        
        <div className="space-y-4 mb-16">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-light-muted dark:text-dark-muted">
              아직 작성된 글이 없습니다.
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        <Pagination />
        
        {/* 글쓰기 버튼 - 우측하단 고정 */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={handleWriteClick}
            className="btn-primary"
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* 모달들 */}
      <PostWriteModal
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onSuccess={handleWriteSuccess}
      />
      
      <PostEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPost(null);
        }}
        post={editingPost}
        onSuccess={handleEditSuccess}
      />

      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </div>
  );
} 