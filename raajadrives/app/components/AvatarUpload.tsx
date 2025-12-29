'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import imageCompression from 'browser-image-compression';
import { HiCamera, HiRefresh, HiTrash } from 'react-icons/hi';

interface AvatarProps {
  currentUrl: string | null;
  onUploadSuccess: (newUrl: string | null) => void;
}

export default function AvatarUpload({ currentUrl, onUploadSuccess }: AvatarProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!user || !event.target.files?.[0]) return;

      const file = event.target.files[0];

      // --- 1. COMPRESSION LOGIC ---
      const options = {
        maxSizeMB: 0.2,          // Limit to 200KB to save Supabase storage
        maxWidthOrHeight: 500,   // standard profile pic size
        useWebWorker: true,
        fileType: 'image/webp'   // WebP provides best compression/quality
      };

      const compressedFile = await imageCompression(file, options);

      // --- 2. STORAGE CLEANUP ---
      // This deletes the old file so your 'avatars' bucket doesn't fill up with garbage
      if (currentUrl && currentUrl.includes('avatars')) {
        const urlParts = currentUrl.split('avatars/');
        const oldPath = urlParts.pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // --- 3. UPLOAD NEW FILE ---
      // We use the User ID as a folder name for security (RLS)
      const fileName = `${user.id}/${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      // --- 4. GET PUBLIC URL & UPDATE DB ---
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      onUploadSuccess(publicUrl);
    } catch (err) {
      console.error('Upload Error:', err);
      alert("Failed to update profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove profile picture?")) return;
    setUploading(true);
    
    try {
      if (currentUrl && currentUrl.includes('avatars')) {
        const oldPath = currentUrl.split('avatars/').pop();
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
      }

      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user?.id);
      onUploadSuccess(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        {/* Main Avatar Display */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-red-600/30 p-1.5 bg-neutral-900 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800 relative">
            <img 
              src={currentUrl || '/images/logo-2.jpeg'} 
              className={`w-full h-full object-cover transition-opacity duration-500 ${uploading ? 'opacity-20' : 'opacity-100'}`}
              alt="Avatar"
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <HiRefresh className="text-red-600 animate-spin" size={40} />
              </div>
            )}
          </div>
        </div>

        {/* Camera Upload Button */}
        <label className="absolute bottom-1 right-1 p-3 bg-red-600 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-neutral-950 shadow-xl z-10">
          <HiCamera className="text-white" size={20} />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleUpdate} 
            disabled={uploading} 
          />
        </label>
      </div>

      {/* Helper Text / Actions */}
      <div className="text-center">
        {uploading ? (
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse">
            Processing WebP Archive...
          </p>
        ) : currentUrl && (
          <button 
            onClick={handleRemove}
            className="text-[9px] font-black text-neutral-600 hover:text-red-500 uppercase tracking-[0.3em] flex items-center gap-1.5 transition-colors mx-auto"
          >
            <HiTrash size={14} /> Remove Photo
          </button>
        )}
      </div>
    </div>
  );
}