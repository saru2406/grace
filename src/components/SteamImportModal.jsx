import React, { useState, useEffect } from 'react';
import { SAMPLE_STEAM_PROFILES } from '../services/authAndSteam.js';

export function SteamImportModal({ isOpen, onClose, onImportProfile, onCustomImport }) {
  const [customId, setCustomId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="steam-import-modal"
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box modal-steam">
        <button
          id="close-steam-modal"
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">Import Steam Library</h2>
          <p className="modal-subtitle">Connect your Steam account to automatically benchmark your owned games.</p>
        </div>

        {/* Custom Steam ID Input */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ctp-subtext0)', marginBottom: '6px' }}>
            Enter Custom Steam ID or Profile URL:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              id="steam-custom-id-input"
              className="search-input"
              style={{ flex: 1, padding: '9px 12px' }}
              placeholder="e.g. gaben, 76561197960287930"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
            <button
              id="steam-fetch-btn"
              className="btn-primary"
              type="button"
              onClick={() => {
                if (customId.trim()) onCustomImport(customId.trim());
              }}
            >
              Fetch
            </button>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--ctp-subtext0)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Or test with sample gamer accounts:
        </div>

        {/* Profiles List */}
        <div id="steam-profiles-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SAMPLE_STEAM_PROFILES.map((profile) => (
            <div
              key={profile.id}
              style={{
                background: 'var(--ctp-surface0)',
                border: '1px solid var(--ctp-surface1)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--ctp-teal)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--ctp-surface1)'}
              onClick={() => onImportProfile(profile)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={profile.avatar}
                  style={{ width: '40px', height: '40px', borderRadius: '6px' }}
                  alt={profile.name}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ctp-text)' }}>
                    {profile.name} (Level {profile.level})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ctp-subtext0)' }}>
                    {profile.games.length} Owned PC Games
                  </div>
                </div>
              </div>
              <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '11px' }}>
                Import Library
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
