import React from 'react';

export function SplashScreen({ isFadingOut }) {
  return (
    <div className={`splash-screen-container ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <h1 className="initial-splash-brand">Grace</h1>
      <svg className="initial-spinner" viewBox="0 0 50 50">
        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="6" />
      </svg>
    </div>
  );
}

