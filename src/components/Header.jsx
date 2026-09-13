import React from 'react';
import { SettingsPopout } from './SettingsPopout';

export function Header({
  steamUser,
  googleUser,
  onOpenSteamModal,
  onOpenGoogleModal,
  onOpenSteamGridSearch,
  isPopoutOpen,
  onTogglePopout,
  onClosePopout,
  theme,
  onSelectTheme,
  onResetData,
  loadingPct = 0,
  loadingDone = true
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <h1 className="brand-title">FPS <span>Estimator</span></h1>
      </div>

      <div className="header-actions">
        {/* Steam Account & Library Sync */}
        <button
          id="steam-login-btn"
          className={`btn-steam ${steamUser ? 'connected' : ''}`}
          type="button"
          onClick={onOpenSteamModal}
          title="Import owned games from Steam profile"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-10 9.94c0 4.67 3.2 8.59 7.54 9.68l2.67-3.86a3.2 3.2 0 0 1-.21-1.16c0-.36.06-.7.17-1.02L8.5 13.2a3.7 3.7 0 0 1-1.3-.23l-3.32 1.38A9.97 9.97 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-4.8 12.3l2.65-1.1a3.67 3.67 0 0 1 2.35.53l-1.1 1.6a1.8 1.8 0 0 0-1.28.3c-.6.4-.85 1.18-.6 1.82l-2.02-3.15zm7.3 2.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm0-3.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/>
          </svg>
          <span id="steam-btn-text">
            {steamUser ? `${steamUser.name} (${steamUser.games.length})` : 'Steam Import'}
          </span>
        </button>

        {/* Google Account Button */}
        <button
          id="google-login-btn"
          className={`btn-google ${googleUser ? 'connected' : ''}`}
          type="button"
          onClick={onOpenGoogleModal}
          title="Sign in to sync builds"
        >
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span id="google-btn-text">
            {googleUser ? googleUser.name.split(' ')[0] : 'Google'}
          </span>
        </button>

        {/* Add Game Button */}
        <button
          id="open-steamgrid-search-btn"
          className="btn-primary"
          type="button"
          onClick={onOpenSteamGridSearch}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Add Game
        </button>

        {/* Profile & Settings Icon Button with Tooltip Popout */}
        <div className="profile-popout-wrapper">
          <button
            id="open-settings-btn"
            className="btn-profile-settings"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePopout();
            }}
            title="Preferences"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          <SettingsPopout
            isOpen={isPopoutOpen}
            onClose={onClosePopout}
            theme={theme}
            onSelectTheme={onSelectTheme}
            steamUser={steamUser}
            googleUser={googleUser}
            onResetData={onResetData}
          />
        </div>
      </div>

      {/* Page-level loading bar at the bottom of the header */}
      {!loadingDone && (
        <div className="header-loading-bar-wrap">
          <div className="header-loading-bar" style={{ width: `${loadingPct}%` }} />
        </div>
      )}
    </header>
  );
}
