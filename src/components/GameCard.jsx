import React, { useState } from 'react';

export function GameCard({
  item,
  index = 0,
  isConfigured,
  onHover,
  onLeave,
  onSelect
}) {
  const [loaded, setLoaded] = useState(false);
  const { game, avgFps, low1PercentFps, bottleneck } = item;

  let badgeClass = 'fps-good';
  if (avgFps >= 100) badgeClass = 'fps-ultra';
  else if (avgFps >= 60) badgeClass = 'fps-good';
  else if (avgFps >= 30) badgeClass = 'fps-fair';
  else badgeClass = 'fps-poor';

  let pillClass = 'pill-balanced';
  if (bottleneck.culprit === 'GPU') pillClass = 'pill-gpu';
  else if (bottleneck.culprit === 'CPU') pillClass = 'pill-cpu';

  const fpsText = isConfigured ? avgFps : '—';
  const lowText = isConfigured ? `${low1PercentFps}` : '—';

  return (
    <div
      className="game-card"
      tabIndex={0}
      style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}
      onMouseEnter={() => onHover(game.coverUrl)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(game)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(game);
        }
      }}
    >
      <div className={`card-poster-wrap ${!loaded ? 'skeleton-loading' : ''}`}>
        <img
          className="card-poster"
          src={game.coverUrl || 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg'}
          alt={game.title}
          loading="lazy"
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && !loaded) {
              setLoaded(true);
            }
          }}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            setLoaded(true);
            e.target.onerror = null;
            e.target.src = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg';
          }}
        />
        <div className={`fps-badge ${badgeClass}`}>
          <span className="fps-value">{fpsText}</span>
          <span className="fps-unit">{isConfigured ? 'AVG' : 'UNSET'}</span>
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title" title={game.title}>{game.title}</h3>
        <p className="card-genre">{game.genre || 'PC Game'}</p>

        <div className="card-footer">
          <span className="low-fps">
            <strong style={{ color: 'var(--ctp-text)' }}>{lowText}</strong> Low
          </span>
          <span className={`bottleneck-pill ${pillClass}`}>
            {bottleneck.culprit || 'Balanced'}
          </span>
        </div>
      </div>
    </div>
  );
}
