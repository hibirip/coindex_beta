import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PostEditModal({ isOpen, onClose, post, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content
      });
    }
  }, [post]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!post) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: formData.title,
          content: formData.content
        })
        .eq('id', post.id);

      if (error) throw error;

      alert('글이 수정되었습니다.');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('글 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !post) return null;

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

        <h2 className="text-2xl font-bold gradient-text mb-6">글 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">제목</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? '수정 중...' : '수정하기'}
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