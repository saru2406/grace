import React, { useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { SettingsPopout } from './SettingsPopout';

export function Header({
  profileName,
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
  // Global hotkey 'Ctrl+Space' (or Ctrl+K or '/') to quickly open the Add Game modal
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const isCtrlSpace = (e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ' || e.key === 'Space');
      if (
        isCtrlSpace ||
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
        <h1 className="brand-title">Grace</h1>
      </div>

      {/* 2. Center: Prominent Add Game / Search Catalog Button */}
      <div className="header-center-action">
        <button
          id="open-steamgrid-search-btn"
          className="header-add-pill-btn"
          type="button"
          onClick={() => onOpenSteamGridSearch && onOpenSteamGridSearch('')}
          title="Search and add games (Ctrl+Space)"
        >
          <div className="add-pill-left">
            <Plus size={14} strokeWidth={2} />
            <span className="add-pill-text">Add game...</span>
          </div>
          <kbd className="add-pill-kbd">Ctrl+Space</kbd>
        </button>
      </div>

      {/* 3. Right: Action Buttons with Good Design */}
      <div className="header-actions">
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
            profileName={profileName}
            onProfileNameChange={onProfileNameChange}
            onResetData={onResetData}
          />
        </div>
      </div>
    </header>
  );
}
