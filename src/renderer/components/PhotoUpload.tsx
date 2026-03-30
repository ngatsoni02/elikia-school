import React, { useRef } from 'react';
import { CameraIcon } from './icons';
import { getAvatarUrl } from '../utils/avatar';

interface PhotoUploadProps {
  photoPath: string | undefined;
  prenom: string;
  nom: string;
  onPhotoChange: (dataUrl: string) => void;
  size?: 'sm' | 'lg';
}

export const PhotoUpload = ({ photoPath, prenom, nom, onPhotoChange, size = 'lg' }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhoto = photoPath && photoPath.length > 0 && !photoPath.includes('placeholder')
    ? photoPath
    : getAvatarUrl(prenom || '?', nom || '?');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner un fichier image (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La taille de l\'image ne doit pas depasser 2 Mo.');
      return;
    }

    // Resize and convert to data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        } else {
          if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        onPhotoChange(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const dim = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const iconDim = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  const badgeDim = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <img
          src={currentPhoto}
          alt={`${prenom} ${nom}`}
          className={`${dim} rounded-full object-cover border-2 border-brand-border shadow-md group-hover:border-brand-primary transition-colors`}
        />
        <div className={`absolute bottom-0 right-0 ${badgeDim} bg-brand-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <CameraIcon className={`${iconDim} text-white p-0.5`} />
        </div>
        <div className={`absolute inset-0 ${dim} rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
          <CameraIcon className="w-6 h-6 text-white" />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <span className="text-xs text-brand-text-secondary">Cliquer pour changer</span>
    </div>
  );
};
