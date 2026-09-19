import React, { useState, useEffect } from 'react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('fps_estimator_cookie_consent');
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fps_estimator_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: '500px',
      margin: '0 auto',
      background: 'rgba(25, 25, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 9999,
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
    }}>
      <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.5 }}>
        <strong>Cookie & Privacy Notice</strong><br />
        We use local storage strictly for functional purposes—like saving your PC specs, preferences, and custom games—so you don't have to re-enter them. We do not use tracking cookies or third-party analytics. 
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleAccept}
          className="btn-primary"
          style={{ padding: '6px 16px', fontSize: '13px' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
