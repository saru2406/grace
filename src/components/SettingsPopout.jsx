import React, { useEffect, useRef } from 'react';

export function SettingsPopout({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  steamUser,
  googleUser,
  onResetData
}) {
  const popoutRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (isOpen && popoutRef.current && !popoutRef.current.contains(e.target)) {
        // Only close if not clicking the toggle button
        const toggleBtn = document.getElementById('open-settings-btn');
        if (!toggleBtn || !toggleBtn.contains(e.target)) {
          onClose();
        }
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div id="settings-popout" className="profile-popout" ref={popoutRef}>
      <div className="popout-arrow"></div>

      <div className="popout-header">
        <div className="popout-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Preferences</span>
        </div>
        <button
          id="close-settings-popout"
          className="popout-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Theme Setting */}
      <div className="popout-section">
        <div className="popout-section-title">Theme</div>
        <div className="theme-options-grid" id="theme-options-grid">
          <div
            className={`theme-card-option ${theme === 'ambient' ? 'active' : ''}`}
            data-theme="ambient"
            onClick={() => onSelectTheme('ambient')}
          >
            <div className="theme-preview-dots">
              <span className="theme-dot" style={{ background: 'linear-gradient(135deg, #ffffff, #94a3b8)' }}></span>
              <span className="theme-dot" style={{ background: '#64748b' }}></span>
            </div>
            <span className="theme-name">Game Blur (Default)</span>
          </div>

          <div
            className={`theme-card-option ${theme === 'amoled' ? 'active' : ''}`}
            data-theme="amoled"
            onClick={() => onSelectTheme('amoled')}
          >
            <div className="theme-preview-dots">
              <span className="theme-dot" style={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.3)' }}></span>
              <span className="theme-dot" style={{ background: '#ffffff' }}></span>
            </div>
            <span className="theme-name">AMOLED Black</span>
          </div>

          <div
            className={`theme-card-option ${theme === 'midnight' ? 'active' : ''}`}
            data-theme="midnight"
            onClick={() => onSelectTheme('midnight')}
          >
            <div className="theme-preview-dots">
              <span className="theme-dot" style={{ background: '#0f172a' }}></span>
              <span className="theme-dot" style={{ background: '#475569' }}></span>
            </div>
            <span className="theme-name">Midnight Slate</span>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="popout-section">
        <div className="popout-section-title">Accounts</div>
        <div id="settings-accounts-summary" className="popout-accounts-summary">
          <div>
            {steamUser ? (
              <span style={{ color: 'var(--ctp-teal)' }}>
                Connected as <strong>{steamUser.name}</strong> ({steamUser.games.length} games imported)
              </span>
            ) : (
              <span style={{ color: 'var(--ctp-subtext0)' }}>Steam not connected.</span>
            )}
          </div>
          <div>
            {googleUser ? (
              <span style={{ color: 'var(--ctp-blue)' }}>
                Connected as <strong>{googleUser.email}</strong>
              </span>
            ) : (
              <span style={{ color: 'var(--ctp-subtext0)' }}>Google Account not connected.</span>
            )}
          </div>
        </div>
      </div>

      {/* Data Reset */}
      <div className="popout-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <button
          id="clear-all-data-btn"
          className="btn-clear-data"
          type="button"
          onClick={onResetData}
        >
          Reset All Saved Data
        </button>
      </div>
    </div>
  );
}
