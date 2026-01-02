'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { HiChatAlt2, HiLockClosed, HiOutlineTrash } from 'react-icons/hi';
import Image from 'next/image';

// --- STRICTURE INTERFACES ---
interface ProfileRelation {
  avatar_url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  created_at: string;
  content: string;
  nickname: string;
  avatar_url?: string | null; 
  profiles?: ProfileRelation | ProfileRelation[] | null;
}

export default function CommentSection({ slug }: { slug: string }) {
  const { user, username } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 1. Fetch Logs with Profile Join
  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          created_at,
          content,
          nickname,
          user_id,
          profiles:user_id (
            avatar_url
          )
        `)
        .eq('album_slug', slug)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rawComments = data as unknown as Comment[];

      const formattedData = rawComments.map((comment) => {
        const profileData = Array.isArray(comment.profiles) 
          ? comment.profiles[0] 
          : comment.profiles;

        return {
          ...comment,
          avatar_url: profileData?.avatar_url || null
        };
      });

      setComments(formattedData);
    } catch (err) {
      console.error('Vault Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 2. Submit Log Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !username) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          { 
            album_slug: slug, 
            content: newComment,
            nickname: username,
            user_id: user.id 
          }
        ]);

      if (!error) {
        setNewComment('');
        setShowForm(false);
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Log Logic
  const deleteComment = async (commentId: string) => {
  if (!window.confirm("Archive Notice: Permanently delete this log?")) return;

  // 1. Ask Supabase to delete it
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user?.id);

  // 2. If the database returns an error (like an RLS violation)
  if (error) {
    console.error('Delete Error:', error.message);
    alert("System Error: Could not remove log from database.");
    return;
  }

  // 3. Only if the database success, remove it from the screen
  setComments(prev => prev.filter(c => c.id !== commentId));
};
  return (
    <div className="max-w-2xl mx-auto mt-16 pt-10 border-t border-white/5 font-sans">
      
      {/* Header Row */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-2">
          <HiChatAlt2 className="text-neutral-500" size={20} />
          <h3 className="text-sm font-black uppercase tracking-widest text-white italic">Archivist Logs</h3>
        </div>
        
        {!showForm && user && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-[10px] font-black uppercase tracking-widest text-black bg-white px-5 py-2 rounded-full hover:bg-red-600 hover:text-white transition-all active:scale-95"
          >
            + Add Log
          </button>
        )}
      </div>

      {/* Guest View */}
      {!user && (
        <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
          <HiLockClosed className="text-neutral-700 mb-2" size={24} />
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
            Authentication Required to Post Logs
          </p>
          <a href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-400 transition-colors">
            Access Vault Account →
          </a>
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <form 
          onSubmit={handleSubmit} 
          className="mb-10 bg-neutral-900/40 p-6 rounded-3xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-red-600/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              Posting as <span className="text-red-500 italic">{username}</span>
            </span>
          </div>

          <textarea
            rows={3}
            placeholder="Log your thoughts on this archive..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-transparent text-sm text-neutral-200 placeholder:text-neutral-700 outline-none resize-none focus:placeholder-neutral-500 transition-all font-medium leading-relaxed"
            autoFocus
            required
          />

          <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-full hover:bg-red-500 transition disabled:opacity-50 shadow-lg shadow-red-900/20"
            >
              {submitting ? 'Archiving...' : 'Submit Log'}
            </button>
          </div>
        </form>
      )}

      {/* Logs List */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-neutral-800 border-t-red-600 rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl">
             <p className="text-neutral-600 italic text-[10px] font-black uppercase tracking-[0.2em]">
               Archive is currently silent.
             </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group relative">
              <div className="flex items-start justify-between gap-3 mb-1">
                
                <div className="flex items-center gap-3">
                  {/* Avatar with Italic Fallback */}
                  <div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/10 relative overflow-hidden flex items-center justify-center shrink-0">
                    {comment.avatar_url ? (
                      <Image
                        src={comment.avatar_url}
                        alt={comment.nickname}
                        fill
                        unoptimized={true}
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-red-500 italic select-none">
                        {comment.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="font-black text-white text-xs uppercase tracking-tight">
                      {comment.nickname}
                    </span>
                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* BIN ICON: Far Right End */}
                {user && user.id === comment.user_id && (
                  <button 
                    onClick={() => deleteComment(comment.id)}
                    className="p-1.5 text-neutral-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Log"
                  >
                    <HiOutlineTrash size={15} />
                  </button>
                )}
              </div>
              
              <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap pl-11">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}