import React, { useState, useEffect } from 'react';

export function AmbientBackdrop({ bgUrl, isActive }) {
  const [loadedUrl, setLoadedUrl] = useState('');

  useEffect(() => {
    if (!bgUrl) {
      setLoadedUrl('');
      return;
    }

    // Immediately clear loaded URL so the backdrop goes black 
    // and we don't show the previous game's background while loading
    setLoadedUrl('');
    
    let cancelled = false;
    const img = new Image();
    img.src = bgUrl;
    img.onload = () => {
      if (!cancelled) {
        setLoadedUrl(bgUrl);
      }
    };
    
    return () => { cancelled = true; };
  }, [bgUrl]);

  return (
    <div
      className={`ambient-backdrop ${isActive && loadedUrl === bgUrl ? 'active' : ''}`}
      style={{ backgroundImage: loadedUrl ? `url("${loadedUrl}")` : 'none' }}
    />
  );
}
