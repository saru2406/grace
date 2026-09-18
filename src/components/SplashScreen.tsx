import React from 'react';
import { MaterialSpinner } from './MaterialSpinner';

export function SplashScreen({ isFadingOut }) {
  return (
    <div className={`splash-screen-container ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <div className="splash-ambient-blur" aria-hidden="true" />
      <div className="splash-content">
        <h1 className="initial-splash-brand">Grace</h1>
        <MaterialSpinner size={32} strokeWidth={5} color="#ffffff" className="initial-spinner" />
      </div>
    </div>
  );
}

