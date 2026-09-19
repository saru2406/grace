import React, { useState, useEffect } from 'react';
import { X, Star, Check, Info } from 'lucide-react';
import { calculateFps, calculateResolutionComparison } from '../services/fpsEngine.js';
import { getGameHero } from '../services/steamGrid.js';
import { getGameMetadata, getGameReleaseInfo } from '../data/gameMetadata.js';
import { enrichSingleGame } from '../services/igdb.js';

export function GameDetailModal({
  game,
  gpu,
  cpu,
  ram,
  resolution,
  preset,
  upscaling,
  rayTracing,
  pathTracing,
  onClose
}) {
  const [heroUrl, setHeroUrl] = useState('');
  const [reqTab, setReqTab] = useState('recommended'); // 'minimum' | 'recommended'
  const [igdbData, setIgdbData] = useState(null);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    setHeroUrl(game.coverUrl);
    setIgdbData(null);

    if (game.steamGridId) {
      getGameHero(game.steamGridId).then(hero => {
        if (!cancelled && hero && hero.url) {
          setHeroUrl(hero.url);
        }
      }).catch(console.warn);
    }

    enrichSingleGame(game).then(data => {
      if (!cancelled && data) {
        setIgdbData(data);
      }
    }).catch(console.warn);

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game, onClose]);

  if (!game) return null;

  const metadata = getGameMetadata(game);
  const releaseInfo = getGameReleaseInfo(game);
  const isConfigured = Boolean(gpu && cpu);

  // Safe calculateFps call
  const fpsData = calculateFps(game, gpu, cpu, ram || 16, {
    resolution,
    preset,
    rayTracing,
    pathTracing,
    upscaling
  });

  // calculateResolutionComparison returns an ARRAY of objects:
  // [{ resolution: '1080p', avgFps, low1PercentFps, isCurrent, verdict }, ...]
  const resComparison = calculateResolutionComparison(game, gpu, cpu, ram || 16, {
    resolution,
    preset,
    rayTracing,
    pathTracing,
    upscaling
  });

  let fpsColor = '#ffffff';
  if (!isConfigured) fpsColor = 'var(--ctp-subtext0)';

  const activeReqs = reqTab === 'minimum' ? metadata.requirements.minimum : metadata.requirements.recommended;

  // Proton badge color & status
  const isBorked = metadata.proton.tier === 'Borked' || metadata.proton.tier === 'Unsupported';
  const protonColor = 'rgba(255, 255, 255, 0.4)';

  return (
    <div
      id="game-detail-modal"
      className="detect-modal-backdrop open"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target instanceof HTMLElement && e.target.classList.contains('detect-modal-backdrop')) onClose();
      }}
    >
      <div className="detect-modal-dialog modal-detail" style={{ maxWidth: '760px', overflowY: 'auto', padding: 0 }}>
        <button
          id="close-detail-modal"
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Hero Banner Header */}
        <div
          id="modal-hero"
          className="modal-hero"
          style={{ backgroundImage: `url("${heroUrl || game.coverUrl}")` }}
        >
          <div className="modal-hero-content">
            <img
              id="modal-thumb"
              className="modal-thumb"
              src={game.coverUrl}
              alt={game.title}
            />
            <div className="modal-hero-text">
              <h2 id="modal-title" className="modal-title">{game.title}</h2>
              <p id="modal-genre" className="modal-genre">
                {igdbData?.genres?.[0] || game.genre} • {releaseInfo.isUnreleased ? `Upcoming (${releaseInfo.shortLabel})` : releaseInfo.fullLabel} • {igdbData?.developer || game.developer || metadata.developer}
              </p>
              
              {/* Quick Info Badges: Metacritic, Steam, Proton */}
              <div className="game-detail-tags">
                <div className="meta-score-badge" title="Metacritic Metascore">
                  <span className="score-num">{metadata.metacritic}</span>
                  <span className="score-lbl">METASCORE</span>
                </div>
                {metadata.steamRating && (
                  <div className="steam-rating-badge" title="Steam User Reviews">
                    <Star size={13} fill="currentColor" stroke="none" />
                    <span>{metadata.steamRating}</span>
                  </div>
                )}
                <div
                  className={`proton-badge ${isBorked ? 'proton-borked' : ''}`}
                  style={{ borderColor: protonColor }}
                  title={`Linux & Steam Deck: ${metadata.proton.status}`}
                >
                  <span className="proton-dot" style={{ backgroundColor: protonColor }}></span>
                  <span>Proton: <strong>{isBorked ? 'Unsupported' : metadata.proton.tier}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {/* Main Rig FPS Estimation Card */}
          <div className="detail-fps-banner">
            <div className="detail-fps-main">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="detail-fps-label">FPS on Your Selected Rig</span>
                <span className="rig-preset-badge">
                  {resolution.toUpperCase()} • {preset.toUpperCase()} PRESET
                </span>
              </div>
              <div className="detail-fps-value-group">
                <span id="modal-fps-num" className="detail-fps-num" style={{ color: fpsColor }}>
                  {isConfigured ? fpsData.avgFps : '—'}
                </span>
                <span className="detail-fps-unit">FPS AVG</span>
              </div>
            </div>

            <div className="detail-stats-grid">
              <div className="detail-stat-card">
                <span className="detail-stat-label">1% Lows</span>
                <span id="modal-1low-val" className="detail-stat-val">
                  {isConfigured ? `${fpsData.low1PercentFps} FPS` : '—'}
                </span>
              </div>
              <div className="detail-stat-card">
                <span className="detail-stat-label">Frametime</span>
                <span id="modal-frametime-val" className="detail-stat-val">
                  {isConfigured ? `${fpsData.frametimeMs} ms` : '—'}
                </span>
              </div>
              <div className="detail-stat-card">
                <span className="detail-stat-label">Bottleneck</span>
                <span
                  id="modal-bottleneck-pill"
                  className="detail-stat-val"
                >
                  {isConfigured ? `${fpsData.bottleneck.culprit} (${fpsData.bottleneck.percentage}%)` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* HowLongToBeat Time Taken to Complete */}
          <div className="detail-section">
            <h3 className="detail-section-title">Time to Complete</h3>
            <div className="hltb-cards-grid">
              <div className="hltb-card">
                <span className="hltb-label">Main Story</span>
                <span className="hltb-hours">{metadata.hltb.main > 0 ? `${metadata.hltb.main} Hours` : 'Multiplayer'}</span>
                <span className="hltb-desc">Core Campaign</span>
              </div>
              <div className="hltb-card">
                <span className="hltb-label">Main + Extras</span>
                <span className="hltb-hours">{metadata.hltb.extra > 0 ? `${metadata.hltb.extra} Hours` : 'Multiplayer'}</span>
                <span className="hltb-desc">Side Quests & Exploration</span>
              </div>
              <div className="hltb-card">
                <span className="hltb-label">Completionist</span>
                <span className="hltb-hours">{metadata.hltb.completionist > 0 ? `${metadata.hltb.completionist} Hours` : 'Endless'}</span>
                <span className="hltb-desc">100% Achievements</span>
              </div>
            </div>
          </div>

          {/* System Requirements (Minimum & Recommended) */}
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="detail-section-title">System Requirements</h3>
              
              <div className="reqs-tab-group">
                <button
                  type="button"
                  className={`reqs-tab-btn ${reqTab === 'minimum' ? 'active' : ''}`}
                  onClick={() => setReqTab('minimum')}
                >
                  Minimum
                </button>
                <button
                  type="button"
                  className={`reqs-tab-btn ${reqTab === 'recommended' ? 'active' : ''}`}
                  onClick={() => setReqTab('recommended')}
                >
                  Recommended
                </button>
              </div>
            </div>

            <div className="reqs-box">
              <div className="reqs-grid">
                <div className="req-item">
                  <span className="req-key">OS</span>
                  <span className="req-val">{activeReqs.os}</span>
                </div>
                <div className="req-item">
                  <span className="req-key">Processor (CPU)</span>
                  <span className="req-val">{activeReqs.cpu}</span>
                </div>
                <div className="req-item">
                  <span className="req-key">Graphics Card (GPU)</span>
                  <span className="req-val">{activeReqs.gpu}</span>
                </div>
                <div className="req-item">
                  <span className="req-key">Video Memory (VRAM)</span>
                  <span className="req-val">{activeReqs.vram}</span>
                </div>
                <div className="req-item">
                  <span className="req-key">System Memory (RAM)</span>
                  <span className="req-val">{activeReqs.ram}</span>
                </div>
                <div className="req-item">
                  <span className="req-key">Storage Space</span>
                  <span className="req-val">{activeReqs.storage}</span>
                </div>
              </div>

              {/* Live Rig Compatibility Check */}
              <div className="rig-check-banner">
                {isConfigured ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    <div>
                      <strong>Rig Check:</strong>{' '}
                      {reqTab === 'recommended' ? 'Meets recommended hardware tier.' : 'Exceeds minimum requirements.'}
                    </div>
                  </>
                ) : (
                  <>
                    <Info size={14} />
                    <div>Select hardware to compare against requirements.</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Linux, SteamOS & Anti-Cheat Compatibility */}
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="detail-section-title">Linux &amp; Steam Deck Compatibility</h3>
              <span
                className="proton-pill"
                style={{
                  borderColor: protonColor,
                  color: 'var(--ctp-text)',
                  background: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                {isBorked ? 'UNSUPPORTED' : metadata.proton.tier.toUpperCase()}
              </span>
            </div>

            <div className={`proton-box ${isBorked ? 'proton-box-borked' : ''}`}>
              <div className="proton-grid">
                <div className="proton-item">
                  <span className="req-key">Anti-Cheat / DRM</span>
                  <span className="req-val">{metadata.proton.antiCheat || 'Standard / None'}</span>
                </div>
                <div className="proton-item">
                  <span className="req-key">Online Multiplayer</span>
                  <span className="req-val">
                    {metadata.proton.worksOnline ? 'Functional under Linux/Proton' : 'Blocked by Anti-Cheat on Linux'}
                  </span>
                </div>
              </div>
              <div className="proton-verdict-note">
                <Info size={14} />
                <span className="proton-note-text">{metadata.proton.status}</span>
              </div>
            </div>
          </div>

          {/* Resolution Scaling Potential */}
          <div className="detail-section">
            <h3 className="detail-section-title">Resolution Scaling</h3>
            <div id="modal-res-bars" className="res-bars-grid">
              {Array.isArray(resComparison) && resComparison.map(item => {
                const maxBarFps = 165;
                const isNumeric = isConfigured && typeof item.avgFps === 'number';
                const pct = isNumeric ? Math.min(100, (item.avgFps / maxBarFps) * 100) : 0;
                const isCurrentRes = item.resolution === resolution;

                let resLabel = '1080p Full HD';
                if (item.resolution === '1440p') resLabel = '1440p Quad HD';
                if (item.resolution === '4k') resLabel = '4K Ultra HD';

                return (
                  <div key={item.resolution} className={`res-bar-row ${isCurrentRes ? 'active-res-row' : ''}`}>
                    <div className="res-bar-header">
                      <span className="res-bar-label">
                        {resLabel}
                        {isCurrentRes && <span className="active-res-badge">ACTIVE</span>}
                      </span>
                      <span className="res-bar-val">
                        {isNumeric ? `${item.avgFps} FPS` : '—'}
                      </span>
                    </div>
                    <div className="res-bar-track">
                      <div
                        className="res-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: (item.avgFps || 0) >= 60
                            ? 'linear-gradient(90deg, #64748b 0%, #ffffff 100%)'
                            : 'linear-gradient(90deg, #334155 0%, #94a3b8 100%)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Diagnostics & Tips */}
          <div className="detail-section">
            <h3 className="detail-section-title">Performance Diagnostics</h3>
            <div id="modal-tips-box" className="detail-tips-box">
              {fpsData.tips.map((tip, idx) => (
                <p key={idx}>{tip}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
