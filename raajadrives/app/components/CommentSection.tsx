'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Comment {
  id: string;
  created_at: string;
  content: string;
  nickname: string;
}

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 1. Wrap the fetch function in useCallback to prevent infinite loops
  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('album_slug', slug)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading comments:', error);
      } else {
        setComments(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      // Ensure loading is set to false only after the async work is done
      setLoading(false);
    }
  }, [slug]); // Only recreate this function if 'slug' changes

  // 2. The Effect now safely depends on the stable fetchComments function
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 3. Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          { 
            album_slug: slug, 
            content: newComment,
            nickname: nickname || 'Anonymous'
          }
        ]);

      if (!error) {
        setNewComment('');
        setShowForm(false);
        fetchComments(); // Refresh the list
      } else {
        alert('Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 pt-10 border-t border-neutral-800">
      
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white">Discussion</h3>
        
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-sm font-bold text-black bg-white px-4 py-2 rounded-full hover:bg-neutral-200 transition"
          >
            + Add a Comment
          </button>
        )}
      </div>

      {/* Form with Animation */}
      {showForm && (
        <form 
          onSubmit={handleSubmit} 
          className="mb-10 bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="mb-4">
            <input
              type="text"
              placeholder="Nickname (Optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-transparent text-sm text-neutral-300 placeholder:text-neutral-600 outline-none border-b border-neutral-800 focus:border-neutral-500 py-2 transition"
            />
          </div>
          <div className="mb-4">
            <textarea
              rows={3}
              placeholder="Share your thoughts on this album..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-600 outline-none resize-none focus:placeholder-neutral-500 transition"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-neutral-500 hover:text-white font-medium px-4 py-2 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-red-600 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-red-500 transition disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-neutral-600 italic text-sm text-center py-4">
            No comments yet. Be the first to verify the quality!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group border-b border-neutral-800/50 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400 select-none">
                  {comment.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-neutral-300 text-sm">
                  {comment.nickname}
                </span>
                <span className="text-xs text-neutral-600">
                  • {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap pl-8">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}