import React, { useState, useEffect } from 'react';

interface SchoolLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allowUpload?: boolean;
}

export const KEMENAG_LOGO_URL = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Kementerian_Agama_new_logo.png/330px-Kementerian_Agama_new_logo.png?utm_source=id.wikipedia.org&utm_campaign=index&utm_content=thumbnail';

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  size = 'md',
  className = '',
  allowUpload = false,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(KEMENAG_LOGO_URL);

  useEffect(() => {
    const saved = localStorage.getItem('mtsn3_kemenag_logo');
    if (saved) {
      setLogoSrc(saved);
    }
  }, []);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setLogoSrc(base64);
          localStorage.setItem('mtsn3_kemenag_logo', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={logoSrc}
        alt="Logo Kementerian Agama Republik Indonesia - MTsN 3 Banyuwangi"
        className={`${sizeClasses[size]} object-contain filter drop-shadow-xs transition-transform hover:scale-105`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback to local SVG if external CDN fails
          (e.currentTarget as HTMLImageElement).src = '/logo-m3b.svg';
        }}
      />
      {allowUpload && (
        <label 
          className="absolute -bottom-1 -right-1 bg-emerald-700 text-white rounded-full p-1 cursor-pointer hover:bg-emerald-800 shadow-md transition"
          title="Unggah Logo Baru MTsN 3 Banyuwangi"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
        </label>
      )}
    </div>
  );
};
