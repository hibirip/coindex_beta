import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import ProfileAvatar from './components/ProfileAvatar';

export default function MyPage() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setUserInfo(data);
      setNickname(data.nickname);
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 변경
  const handleNicknameUpdate = async () => {
    setLoading(true);
    
    try {
      const { error } = await updateProfile({ nickname });
      
      if (error) throw error;
      
      alert('닉네임이 변경되었습니다.');
      setEditing(false);
      fetchUserInfo();
    } catch (error) {
      console.error('Error updating nickname:', error);
      alert('닉네임 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-light-muted dark:text-dark-muted">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 프로필 섹션 */}
      <div className="card-modern p-6">
        <h1 className="text-2xl font-bold gradient-text mb-6">마이페이지</h1>
        
        <div className="flex items-center gap-6 mb-8">
          <ProfileAvatar
            gradientColors={userInfo?.gradient_colors}
            nickname={userInfo?.nickname}
            size="xl"
          />
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
              {userInfo?.name}
            </h2>
            <p className="text-light-muted dark:text-dark-muted">
              {userInfo?.email}
            </p>
          </div>
        </div>

        {/* 회원 정보 */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">이메일 (ID)</label>
              <input
                type="text"
                value={userInfo?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-gray-100 dark:bg-gray-800 opacity-75"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">이름</label>
              <input
                type="text"
                value={userInfo?.name || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-gray-100 dark:bg-gray-800 opacity-75"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">닉네임</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={!editing}
                  className="flex-1 px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
                />
                {editing ? (
                  <>
                    <button
                      onClick={handleNicknameUpdate}
                      className="btn-primary"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setNickname(userInfo?.nickname || '');
                      }}
                      className="btn-secondary"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary"
                  >
                    변경
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">전화번호</label>
              <input
                type="text"
                value={userInfo?.phone || '-'}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-gray-100 dark:bg-gray-800 opacity-75"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">가입일</label>
            <input
              type="text"
              value={userInfo?.created_at ? new Date(userInfo.created_at).toLocaleString() : '-'}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-gray-100 dark:bg-gray-800 opacity-75"
            />
          </div>
        </div>
      </div>

      {/* 활동 내역 */}
      <div className="card-modern p-6">
        <h2 className="text-xl font-bold gradient-text mb-4">내 활동</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">0</div>
            <div className="text-sm text-light-muted dark:text-dark-muted">작성한 글</div>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">0</div>
            <div className="text-sm text-light-muted dark:text-dark-muted">좋아요 수</div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">0</div>
            <div className="text-sm text-light-muted dark:text-dark-muted">댓글 수</div>
          </div>
        </div>
      </div>
    </div>
  );
} 