import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  SAMPLE_STEAM_PROFILES,
  resolveSteamAccount,
  parsePastedGamesList,
  getStoredSteamApiKey,
  saveSteamApiKey
} from '../services/authAndSteam.js';
import { SteamProfileSkeleton } from './SkeletonLoader.jsx';

export function SteamImportModal({
  isOpen,
  onClose,
  onImportProfile,
  currentSteamUser,
  onDisconnectSteam
}) {
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' | 'paste' | 'curated'
  const [steamQuery, setSteamQuery] = useState('');
  const [apiKey, setApiKey] = useState(getStoredSteamApiKey);
  const [showApiKeyInput, setShowApiKeyInput] = useState(Boolean(getStoredSteamApiKey()));
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resolvedResult, setResolvedResult] = useState(null);

  // Quick Paste state
  const [pasteText, setPasteText] = useState('');
  const [parsedPasteGames, setParsedPasteGames] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // When paste text changes, live parse
  useEffect(() => {
    if (!pasteText.trim()) {
      setParsedPasteGames([]);
      return;
    }
    const games = parsePastedGamesList(pasteText);
    setParsedPasteGames(games);
  }, [pasteText]);

  if (!isOpen) return null;

  async function handleFetchSteamAccount(e) {
    if (e) e.preventDefault();
    const q = steamQuery.trim();
    if (!q) {
      setErrorMessage('Please enter a Steam username, 64-bit ID, or profile link.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setResolvedResult(null);
    setStatusMessage('Connecting to Steam Community servers...');

    try {
      if (apiKey.trim()) {
        saveSteamApiKey(apiKey.trim());
      }
      const data = await resolveSteamAccount({ query: q, apiKey: apiKey.trim() });
      if (!data || !data.success) {
        setErrorMessage(data?.error || 'Could not find Steam profile. Please ensure the profile is public.');
      } else {
        setResolvedResult(data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch Steam profile. Please check your connection.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }

  function handleConfirmImport() {
    if (!resolvedResult || !resolvedResult.profile) return;
    const { profile, games } = resolvedResult;

    // Build user profile object
    const finalProfile = {
      id: `steam-${profile.steamId64 || profile.customUrl || profile.name}`,
      name: profile.name,
      steamId: profile.steamId64,
      avatar: profile.avatar,
      customUrl: profile.customUrl,
      level: profile.level || 25,
      headline: profile.location || 'Steam Member',
      games: games.length > 0 ? games : [
        { title: 'Counter-Strike 2', id: 5363838, steamAppId: 730, playtime: 'Owned' },
        { title: 'Cyberpunk 2077', id: 5209422, steamAppId: 1091500, playtime: 'Owned' },
        { title: 'Elden Ring', id: 5277816, steamAppId: 1245620, playtime: 'Owned' },
        { title: 'Black Myth: Wukong', id: 5269886, steamAppId: 2358720, playtime: 'Owned' },
        { title: 'Helldivers 2', id: 5403655, steamAppId: 553850, playtime: 'Owned' }
      ]
    };

    onImportProfile(finalProfile);
  }

  function handleImportPasted() {
    if (parsedPasteGames.length === 0) return;

    const profileName = currentSteamUser?.name || 'Steam Gamer';
    const profile = {
      id: currentSteamUser?.id || `steam-custom-${Date.now()}`,
      name: profileName,
      avatar: currentSteamUser?.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      games: parsedPasteGames
    };

    onImportProfile(profile);
  }

  return (
    <div
      id="steam-import-modal"
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box modal-steam" style={{ maxWidth: '640px' }}>
        <button
          id="close-steam-modal"
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#66c0f4' }}>
              <path d="M12 2a10 10 0 0 0-10 9.94c0 4.67 3.2 8.59 7.54 9.68l2.67-3.86a3.2 3.2 0 0 1-.21-1.16c0-.36.06-.7.17-1.02L8.5 13.2a3.7 3.7 0 0 1-1.3-.23l-3.32 1.38A9.97 9.97 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-4.8 12.3l2.65-1.1a3.67 3.67 0 0 1 2.35.53l-1.1 1.6a1.8 1.8 0 0 0-1.28.3c-.6.4-.85 1.18-.6 1.82l-2.02-3.15zm7.3 2.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm0-3.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/>
            </svg>
            <h2 className="modal-title" style={{ margin: 0 }}>Import Steam Library</h2>
          </div>
          <p className="modal-subtitle">Sync your Steam account or import games to benchmark against your hardware rig.</p>
        </div>

        {/* Connected account banner if active */}
        {currentSteamUser && (
          <div style={{
            background: 'rgba(102, 192, 244, 0.08)',
            border: '1px solid rgba(102, 192, 244, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={currentSteamUser.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
                alt={currentSteamUser.name}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  Connected as {currentSteamUser.name}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  {currentSteamUser.games ? `${currentSteamUser.games.length} Steam games tracked` : 'Profile linked'}
                </div>
              </div>
            </div>
            {onDisconnectSteam && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => {
                  onDisconnectSteam();
                  setResolvedResult(null);
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            🎮 Account Sync
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            📋 Quick Paste Games
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'curated' ? 'active' : ''}`}
            onClick={() => setActiveTab('curated')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            🌟 Curated Libraries
          </button>
        </div>

        {/* TAB 1: Steam Account Sync */}
        {activeTab === 'sync' && (
          <div>
            <form onSubmit={handleFetchSteamAccount}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ctp-subtext0)', marginBottom: '6px' }}>
                  Steam Username, ID64, or Community Profile URL:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    id="steam-custom-id-input"
                    className="search-input"
                    style={{ flex: 1, padding: '9px 12px', fontSize: '13px' }}
                    placeholder="e.g. gaben or https://steamcommunity.com/id/gaben"
                    value={steamQuery}
                    onChange={(e) => setSteamQuery(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    id="steam-fetch-btn"
                    className="btn-primary"
                    type="submit"
                    disabled={isLoading || !steamQuery.trim()}
                    style={{ minWidth: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isLoading ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>
              </div>

              {/* Steam Web API Key Option */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  >
                    <input
                      type="checkbox"
                      checked={showApiKeyInput}
                      onChange={(e) => setShowApiKeyInput(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Steam Web API Key (Optional — for full automated library sync)
                  </label>
                  <a
                    href="https://steamcommunity.com/dev/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#66c0f4', textDecoration: 'none' }}
                  >
                    Get Free Key ↗
                  </a>
                </div>

                {showApiKeyInput && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="password"
                      className="search-input"
                      style={{ width: '100%', padding: '7px 10px', fontSize: '12px' }}
                      placeholder="Paste your 32-character Steam Web API key here"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>
                      Key is saved locally in your browser. Allows fetching your complete list of owned Steam games with playtimes.
                    </p>
                  </div>
                )}
              </div>
            </form>

            {/* Live Skeleton Loading state */}
            {isLoading && (
              <SteamProfileSkeleton statusText={statusMessage || 'Connecting to Steam Web network...'} />
            )}

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                background: 'rgba(235, 87, 87, 0.12)',
                border: '1px solid rgba(235, 87, 87, 0.35)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                color: '#ff8585',
                fontSize: '12px',
                lineHeight: 1.4
              }}>
                <strong>Import Notice:</strong> {errorMessage}
              </div>
            )}

            {/* Resolved Profile Card */}
            {resolvedResult && resolvedResult.profile && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(102, 192, 244, 0.4)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <img
                    src={resolvedResult.profile.avatar}
                    alt={resolvedResult.profile.name}
                    style={{ width: '56px', height: '56px', borderRadius: '8px', border: '2px solid rgba(102, 192, 244, 0.5)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{resolvedResult.profile.name}</span>
                      <span style={{ fontSize: '10px', background: 'rgba(102, 192, 244, 0.2)', color: '#66c0f4', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        STEAM VERIFIED
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                      {resolvedResult.profile.location || 'Steam Member'} • ID: {resolvedResult.profile.steamId64}
                    </div>
                    {resolvedResult.profile.memberSince && (
                      <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.45)', marginTop: '1px' }}>
                        Member since {resolvedResult.profile.memberSince}
                      </div>
                    )}
                  </div>
                </div>

                {/* Games status */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '14px',
                  fontSize: '12px'
                }}>
                  {resolvedResult.games && resolvedResult.games.length > 0 ? (
                    <div>
                      <div style={{ color: '#4cd964', fontWeight: 700, marginBottom: '4px' }}>
                        ✓ Successfully loaded {resolvedResult.games.length} owned games directly from Steam!
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                        Top games: {resolvedResult.games.slice(0, 4).map(g => `${g.title} (${g.playtime})`).join(', ')}...
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: '2px' }}>
                        Steam Account Connected!
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                        To fetch full game playtimes from Valve servers, enter your Steam API key above, or click below to import popular benchmarked titles.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '9px 16px', fontWeight: 700, fontSize: '13px' }}
                    onClick={handleConfirmImport}
                  >
                    {resolvedResult.games && resolvedResult.games.length > 0
                      ? `Import ${resolvedResult.games.length} Steam Games to Library`
                      : 'Sync Profile & Track Library'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Quick Paste Games */}
        {activeTab === 'paste' && (
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px' }}>
              Copy games from your Steam Library or wishlist, paste them below, and we will automatically benchmark each title:
            </p>
            <textarea
              className="search-input"
              rows={7}
              style={{
                width: '100%',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.5,
                resize: 'vertical',
                marginBottom: '10px'
              }}
              placeholder={`Cyberpunk 2077\nElden Ring\nCounter-Strike 2\nBlack Myth: Wukong\nHelldivers 2\nSpace Marine 2`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: parsedPasteGames.length > 0 ? '#4cd964' : 'rgba(255,255,255,0.5)' }}>
                {parsedPasteGames.length > 0
                  ? `✓ Identified ${parsedPasteGames.length} unique game${parsedPasteGames.length === 1 ? '' : 's'}`
                  : 'Enter game titles above'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setPasteText(`Cyberpunk 2077\nElden Ring\nCounter-Strike 2\nBlack Myth: Wukong\nWarhammer 40,000: Space Marine 2\nBaldur's Gate 3\nHelldivers 2\nRed Dead Redemption 2`)}
                >
                  Insert Sample List
                </button>
                {pasteText && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={() => setPasteText('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={parsedPasteGames.length === 0}
              style={{ width: '100%', padding: '10px', fontWeight: 700, fontSize: '13px' }}
              onClick={handleImportPasted}
            >
              Import {parsedPasteGames.length} Game{parsedPasteGames.length === 1 ? '' : 's'} to Library
            </button>
          </div>
        )}

        {/* TAB 3: Curated Libraries */}
        {activeTab === 'curated' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SAMPLE_STEAM_PROFILES.map((profile) => (
              <div
                key={profile.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#66c0f4';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => onImportProfile(profile)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={profile.avatar}
                    style={{ width: '44px', height: '44px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)' }}
                    alt={profile.name}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {profile.name}
                      <span style={{ fontSize: '10px', color: '#66c0f4', background: 'rgba(102,192,244,0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                        Lvl {profile.level}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                      {profile.headline} • {profile.games.length} Owned Games
                    </div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 700 }}
                  type="button"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

