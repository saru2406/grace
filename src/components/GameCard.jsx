import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { DEFAULT_PLACEHOLDER_COVER } from '../services/gameAssets.js';

export function GameCard({
  item,
  index = 0,
  isConfigured,
  onHover,
  onLeave,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
  fpsDetail = 'detailed',
  showBottlenecks = true,
  targetFps = 60
}) {
  const [loaded, setLoaded] = useState(false);
  const { game, avgFps, low1PercentFps, bottleneck } = item;

  let fpsRatingClass = 'fps-unconfigured';
  if (isConfigured) {
    if (avgFps >= targetFps * 1.3) fpsRatingClass = 'fps-ultra';
    else if (avgFps >= targetFps) fpsRatingClass = 'fps-good';
    else if (avgFps >= targetFps * 0.75) fpsRatingClass = 'fps-fair';
    else fpsRatingClass = 'fps-poor';
  }

  let bottleneckClass = 'pill-balanced';
  if (bottleneck.culprit === 'GPU') bottleneckClass = 'pill-gpu';
  else if (bottleneck.culprit === 'CPU') bottleneckClass = 'pill-cpu';

  const bottleneckLabel = !isConfigured
    ? 'Rig Unset'
    : (bottleneck.culprit ? `${bottleneck.culprit} Bound` : 'Balanced');

  return (
    <div
      className="game-card"
      data-game-id={game.id}
      data-fps={isConfigured ? avgFps : ''}
      onMouseEnter={() => onHover(game)}
      onMouseLeave={onLeave}
      onClick={() => onSelect(game)}
      role="button"
      tabIndex={0}
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
          src={game.coverUrl || DEFAULT_PLACEHOLDER_COVER}
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
            e.target.src = DEFAULT_PLACEHOLDER_COVER;
          }}
        />
        <button
          type="button"
          className={`favorite-toggle ${isFavorite ? 'active' : ''}`}
          aria-label={isFavorite ? `Remove ${game.title} from favourites` : `Add ${game.title} to favourites`}
          title={isFavorite ? `Remove from favourites` : `Add to favourites`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id);
          }}
        >
          <Star
            size={14}
            className="fav-icon"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={isFavorite ? 2.5 : 2}
          />
        </button>

        {game.supportsRayTracing && (
          <span className="card-feature-badge" title="Hardware Ray Tracing Supported">
            RTX
          </span>
        )}

        {(game.isSteamOwned || item.isSteamOwned) && (
          <span
            className="card-steam-badge"
            title={game.steamPlaytime ? `Owned on Steam (${game.steamPlaytime})` : 'Owned in Steam Library'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-10 9.94c0 4.67 3.2 8.59 7.54 9.68l2.67-3.86a3.2 3.2 0 0 1-.21-1.16c0-.36.06-.7.17-1.02L8.5 13.2a3.7 3.7 0 0 1-1.3-.23l-3.32 1.38A9.97 9.97 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2zm-4.8 12.3l2.65-1.1a3.67 3.67 0 0 1 2.35.53l-1.1 1.6a1.8 1.8 0 0 0-1.28.3c-.6.4-.85 1.18-.6 1.82l-2.02-3.15zm7.3 2.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm0-3.3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/>
            </svg>
            {game.steamPlaytime && game.steamPlaytime !== 'Owned' && game.steamPlaytime !== 'Library' && game.steamPlaytime !== 'Played'
              ? game.steamPlaytime
              : 'Steam'}
          </span>
        )}
      </div>

      <div className="card-content">
        <div className="card-header-info">
          <h3 className="card-title" title={game.title}>{game.title}</h3>
          <p className="card-genre">
            {game.genre || 'PC Game'}
            {game.releaseYear ? ` • ${game.releaseYear}` : ''}
          </p>
        </div>

        {/* Aligned FPS Telemetry Dashboard */}
        <div className={`card-perf-panel ${fpsDetail === 'simple' ? 'simple-mode' : ''}`}>
          <div className="card-perf-stat stat-avg">
            <span className="perf-label">AVG FPS</span>
            <span className={`perf-num ${fpsRatingClass}`}>
              {isConfigured ? avgFps : '—'}
            </span>
          </div>

          {fpsDetail !== 'simple' && (
            <>
              <div className="card-perf-divider" />
              <div className="card-perf-stat stat-low">
                <span className="perf-label">1% LOW</span>
                <span className="perf-num perf-low-num">
                  {isConfigured ? low1PercentFps : '—'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer with Bottleneck status */}
        <div className="card-footer">
          {showBottlenecks && (
            <span className={`bottleneck-pill ${bottleneckClass}`}>
              {bottleneckLabel}
            </span>
          )}
          <span className="card-footer-category" style={{ marginLeft: showBottlenecks ? 'auto' : '0' }}>
            {game.category ? game.category.toUpperCase() : 'AAA'}
          </span>
        </div>
      </div>
    </div>
  );
}
