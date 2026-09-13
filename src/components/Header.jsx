import React, { useEffect } from 'react';
import { Plus, Download, User } from 'lucide-react';
import { SettingsPopout } from './SettingsPopout';

export function Header({
  steamUser,
  profileName,
  onOpenSteamModal,
  onOpenSteamGridSearch,
  isPopoutOpen,
  onTogglePopout,
  onClosePopout,
  userSettings,
  onUpdateSetting,
  specs,
  onProfileNameChange,
  onResetData
}) {
  // Global hotkey 'Ctrl+K' or '/' to quickly open the Add Game modal
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))
      ) {
        e.preventDefault();
        if (onOpenSteamGridSearch) onOpenSteamGridSearch('');
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onOpenSteamGridSearch]);

  return (
    <header className="app-header">
      {/* 1. Left: Brand Section */}
      <div className="brand-section">
        <h1 className="brand-title">FPS Estimator</h1>
      </div>

      {/* 2. Center: Prominent Add Game / Search Catalog Button */}
      <div className="header-center-action">
        <button
          id="open-steamgrid-search-btn"
          className="header-add-pill-btn"
          type="button"
          onClick={() => onOpenSteamGridSearch && onOpenSteamGridSearch('')}
          title="Search and add games (Ctrl+K or /)"
        >
          <div className="add-pill-left">
            <Plus size={14} strokeWidth={2} />
            <span className="add-pill-text">Add game...</span>
          </div>
          <kbd className="add-pill-kbd">Ctrl+K</kbd>
        </button>
      </div>

      {/* 3. Right: Action Buttons with Good Design */}
      <div className="header-actions">
        {/* Steam Account & Library Sync */}
        <button
          id="steam-login-btn"
          className={`btn-steam ${steamUser ? 'connected' : ''}`}
          type="button"
          onClick={onOpenSteamModal}
          title={steamUser ? `Synced with ${steamUser.name}` : 'Import Steam profile'}
        >
          {steamUser?.avatar ? (
            <img
              src={steamUser.avatar}
              alt={steamUser.name}
              style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <Download size={14} strokeWidth={2} />
          )}
          <span id="steam-btn-text">
            {steamUser ? steamUser.name : 'Steam Import'}
          </span>
          {steamUser && <span className="steam-online-dot" />}
        </button>

        {/* Profile & Settings Icon Button with Popout */}
        <div className="profile-popout-wrapper">
          <button
            id="open-settings-btn"
            className={`btn-profile-settings ${isPopoutOpen ? 'active' : ''}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePopout();
            }}
            title="Rig Options & Preferences"
            aria-label="Preferences"
          >
            <User size={17} strokeWidth={2} />
          </button>

          <SettingsPopout
            isOpen={isPopoutOpen}
            onClose={onClosePopout}
            userSettings={userSettings}
            onUpdateSetting={onUpdateSetting}
            specs={specs}
            steamUser={steamUser}
            profileName={profileName}
            onProfileNameChange={onProfileNameChange}
            onResetData={onResetData}
          />
        </div>
      </div>
    </header>
  );
}
