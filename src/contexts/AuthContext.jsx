import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      // 이메일 인증 완료 시 users 테이블에 정보 업데이트
      if (event === 'SIGNED_IN' && session?.user && session.user.email_confirmed_at) {
        // 이미 users 테이블에 데이터가 있는지 확인
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        // users 테이블에 데이터가 없으면 user_metadata에서 가져와서 저장
        if (!existingUser && session.user.user_metadata) {
          await supabase.from('users').insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata.name || '',
            nickname: session.user.user_metadata.nickname || '',
            phone: session.user.user_metadata.phone || '',
            gradient_colors: session.user.user_metadata.gradient_colors || '#667eea,#764ba2'
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, name, nickname, phone, gradientColors) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        data: {
          name,
          nickname,
          phone,
          gradient_colors: gradientColors
        }
      }
    });

    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    return { data, error };
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 