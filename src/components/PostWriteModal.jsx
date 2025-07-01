import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function PostWriteModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: formData.title,
        content: formData.content,
        is_gpt: false
      });

      if (error) throw error;

      alert('글이 작성되었습니다.');
      setFormData({ title: '', content: '' });
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative max-w-2xl w-full card-modern p-6 max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold gradient-text mb-6">새 글 작성</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">내용</label>
            <textarea
              required
              rows={10}
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface resize-none"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="내용을 입력하세요"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? '작성 중...' : '작성하기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 