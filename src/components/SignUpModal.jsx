import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateGradientColors } from '../lib/supabase';

export default function SignUpModal({ isOpen, onClose }) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nickname: '',
    phone: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const gradientColors = generateGradientColors();
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.nickname,
        formData.phone,
        gradientColors
      );

      if (error) throw error;

      alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative max-w-md w-full card-modern p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold gradient-text mb-6">회원가입</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이메일 (ID)</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호 확인</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이름</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">닉네임</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전화번호</label>
            <input
              type="tel"
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-0000-0000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
} 