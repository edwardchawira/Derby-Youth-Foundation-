"use client";

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface EditableProfilePhotoProps {
  profileId: string;
  userId: string;
  currentPhotoUrl: string;
  fullName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onPhotoUpdate?: (newUrl: string) => void;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48'
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

export default function EditableProfilePhoto({
  profileId,
  userId,
  currentPhotoUrl,
  fullName,
  size = 'lg',
  editable = true,
  onPhotoUpdate
}: EditableProfilePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath && oldPath.startsWith(userId)) {
          await supabase.storage
            .from('musician-profiles')
            .remove([`profile-photos/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('musician-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('musician-profiles')
        .getPublicUrl(filePath);

      const newPhotoUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('musician_profiles')
        .update({ profile_photo_url: newPhotoUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setPhotoUrl(newPhotoUrl);
      toast.success('Profile photo updated successfully!');

      if (onPhotoUpdate) {
        onPhotoUpdate(newPhotoUrl);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className="relative"
        onMouseEnter={() => editable && setHovering(true)}
        onMouseLeave={() => editable && setHovering(false)}
      >
        <Avatar className={`${sizeClasses[size]} border-4 border-gold transition-all duration-300 ${hovering && editable ? 'opacity-75' : ''}`}>
          <AvatarImage src={photoUrl} alt={fullName} />
          <AvatarFallback className="bg-gold/20 text-gold text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {editable && hovering && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="secondary"
              className="rounded-full bg-gold/90 hover:bg-gold text-background"
            >
              <Camera className={iconSizes[size]} />
            </Button>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
          </div>
        )}
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            disabled={uploading}
          />

          {size === 'xl' && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              size="sm"
              variant="outline"
              className="mt-4 w-full border-gold/50 hover:bg-gold/10"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
