import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SignInModal({ isOpen, onClose, onSignUpClick }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      
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

        <h2 className="text-2xl font-bold gradient-text mb-6">로그인</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-light-muted dark:text-dark-muted">
            아직 계정이 없으신가요?{' '}
            <button
              onClick={() => {
                onClose();
                onSignUpClick();
              }}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 