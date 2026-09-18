import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { GAME_METADATA } from "../data/gameMetadata.js";
import { getGameWideCover, getGameHero } from "../services/steamGrid.js";
import { getSystemPeriod, getGameTrendingScore } from "../services/systemTrending.js";
import { DEFAULT_PLACEHOLDER_COVER } from "../services/gameAssets.js";
import { calculateFps } from "../services/fpsEngine.js";
import { triggerHeartBurst } from "../utils/heartBurst.js";

export function GameCarousel({
  games,
  isConfigured,
  specs,
  userSettings = {},
  onSelectGame,
  onActiveGameChange,
  onToggleFavorite,
  favoriteIds = [],
  transitioningGameId = null
}) {
  const systemPeriod = React.useMemo(() => getSystemPeriod(), []);

  const featuredGames = React.useMemo(() => {
    if (!games || games.length === 0) return [];

    // Dynamically score games based on the host system year & month
    const scored = [...games].map(game => ({
      game,
      score: getGameTrendingScore(game, systemPeriod.year, systemPeriod.month)
    }));

    // Sort descending by recency to system date and popularity
    scored.sort((a, b) => b.score - a.score);

    // Pick top 8 dynamic trending titles
    return scored.slice(0, 8).map(s => s.game);
  }, [games, systemPeriod]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [wideArtUrl, setWideArtUrl] = useState(() => {
    const initial = featuredGames[0];
    if (!initial) return null;
    return initial.heroUrl || initial.wideCoverUrl ||
      (initial.steamAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${initial.steamAppId}/library_hero.jpg` : initial.coverUrl) || null;
  });
  const [loadedWideArtUrl, setLoadedWideArtUrl] = useState("");
  const [loadedBoxGameId, setLoadedBoxGameId] = useState(null);
  const timerRef = useRef(null);

  const activeGame = featuredGames[currentIndex] || featuredGames[0];
  const boxArtLoaded = loadedBoxGameId === activeGame?.id;
  const wideArtLoaded = loadedWideArtUrl === wideArtUrl;

  useEffect(() => {
    if (activeGame && onActiveGameChange) {
      const art = wideArtUrl || activeGame.heroUrl || activeGame.wideCoverUrl || activeGame.coverUrl;
      onActiveGameChange(activeGame, art);
    }
  }, [activeGame, wideArtUrl, onActiveGameChange]);

  // Reset and fetch wide art on slide change
  useEffect(() => {
    if (!activeGame) return;

    // Initial fallback wide art
    const initialWide = activeGame.heroUrl || activeGame.wideCoverUrl ||
      (activeGame.steamAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${activeGame.steamAppId}/library_hero.jpg` : activeGame.coverUrl);
    setWideArtUrl(initialWide || activeGame.coverUrl);

    let cancelled = false;
    getGameWideCover(activeGame.steamGridId, activeGame.steamAppId)
      .then(wide => {
        if (!cancelled && wide?.url) {
          setWideArtUrl(wide.url);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [currentIndex, activeGame]);

  const [slideDir, setSlideDir] = useState('next');
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const nextSlide = useCallback(() => {
    if (!featuredGames || featuredGames.length <= 1) return;
    setSlideDir('next');
    setCurrentIndex(prev => (prev + 1) % featuredGames.length);
  }, [featuredGames]);

  const prevSlide = useCallback(() => {
    if (!featuredGames || featuredGames.length <= 1) return;
    setSlideDir('prev');
    setCurrentIndex(prev => (prev - 1 + featuredGames.length) % featuredGames.length);
  }, [featuredGames]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      setIsPaused(true);
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      // Trigger horizontal slide if swipe is primarily horizontal and > 38px
      if (Math.abs(deltaX) > 38 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    if (isPaused || !featuredGames || featuredGames.length <= 1) return;
    timerRef.current = setInterval(nextSlide, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, nextSlide, featuredGames]);

  if (!featuredGames || !featuredGames.length || !activeGame) return null;

  const metadata = GAME_METADATA[activeGame.id] || { metacritic: 88, proton: { tier: "Verified" }, hltb: { main: 25 } };
  const isBorked = metadata.proton?.tier === "Borked";
  const protonTier = isBorked ? "Unsupported" : (metadata.proton?.tier || "Verified");

  // Calculate live FPS estimate for the currently focused carousel game
  const fpsData = React.useMemo(() => {
    if (!activeGame || !specs?.gpu || !specs?.cpu) return null;
    return calculateFps(activeGame, specs.gpu, specs.cpu, specs.ram || 16, {
      resolution: specs.resolution || '1440p',
      preset: specs.preset || 'high',
      rayTracing: specs.rayTracing,
      upscaling: specs.upscaling || 'quality'
    });
  }, [activeGame, specs]);

  return (
    <div
      className="game-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Featured Games Carousel"
    >

      {/* Background: Wide landscape art */}
      <div className="carousel-slide-backdrop">
        {!wideArtLoaded && <div className="carousel-bg-skeleton" />}
        {wideArtUrl ? (
          <img
            key={wideArtUrl}
            src={wideArtUrl}
            alt=""
            decoding="async"
            className={"carousel-bg-img" + (wideArtLoaded ? " loaded" : "")}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && loadedWideArtUrl !== wideArtUrl) {
                setLoadedWideArtUrl(wideArtUrl);
              }
            }}
            onLoad={() => setLoadedWideArtUrl(wideArtUrl)}
            onError={(e) => {
              setLoadedWideArtUrl(wideArtUrl);
              if (activeGame?.coverUrl && e.currentTarget.src !== activeGame.coverUrl) {
                e.currentTarget.onerror = null;
                e.currentTarget.src = activeGame.coverUrl;
              }
            }}
          />
        ) : null}
        <div className="carousel-gradient-overlay" />
      </div>

      {/* Slide Content */}
      <div key={activeGame.id + '-' + slideDir} className={`carousel-content ${slideDir === 'next' ? 'carousel-slide-anim-next' : 'carousel-slide-anim-prev'}`}>
        {/* Left: Text Info */}
        <div className="carousel-left">
          <div className="carousel-meta-row" />
          {activeGame.logoUrl ? (
            <div className="carousel-logo-wrap">
              <img
                key={activeGame.id + "-logo"}
                src={activeGame.logoUrl}
                alt={activeGame.title}
                decoding="async"
                className="carousel-logo-img"
              />
            </div>
          ) : (
            <h2 className="carousel-title">{activeGame.title}</h2>
          )}
          <p className="carousel-desc">{activeGame.description}</p>
          <div className="carousel-action-row">
            <button type="button" className="carousel-cta-btn" onClick={() => onSelectGame(activeGame)}>
              <ArrowRight size={15} strokeWidth={2.5} />
              View Details &amp; Benchmark
            </button>
            {onToggleFavorite && activeGame && (
              <button
                type="button"
                className={`carousel-fav-btn ${favoriteIds.includes(activeGame.id) ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHeartBurst(e.currentTarget);
                  onToggleFavorite(activeGame.id);
                }}
                title={favoriteIds.includes(activeGame.id) ? `Remove ${activeGame.title} from favourites` : `Add ${activeGame.title} to favourites`}
              >
                <Heart className="fav-icon" size={14} fill={favoriteIds.includes(activeGame.id) ? "currentColor" : "none"} strokeWidth={favoriteIds.includes(activeGame.id) ? 2.5 : 2} />
                <span>{favoriteIds.includes(activeGame.id) ? "Favourited" : "Favourite"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Group showing transparent FPS details on the left, right beside the game box art */}
        <div className="carousel-right-group">
          {/* Transparent FPS Telemetry (no container, no 60hz ready tag) */}
          <div
            className="carousel-fps-clean"
            role="button"
            tabIndex={0}
            aria-label={`Performance estimate for ${activeGame.title}`}
            onClick={() => onSelectGame(activeGame)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectGame(activeGame);
              }
            }}
          >
            <div className="carousel-fps-clean-tag">
              {specs?.resolution ? specs.resolution.toUpperCase() : '1440P'} • {specs?.preset ? specs.preset.toUpperCase() : 'HIGH'}
            </div>

            {fpsData ? (
              <div className="carousel-fps-clean-body">
                <div className="carousel-fps-clean-main">
                  <span className="clean-fps-val">{fpsData.avgFps}</span>
                  <span className="clean-fps-lbl">AVG FPS</span>
                </div>

                <div className="carousel-fps-clean-sub">
                  <div className="clean-sub-item">
                    <span className="clean-sub-lbl">1% LOW</span>
                    <span className="clean-sub-num">{fpsData.low1PercentFps} FPS</span>
                  </div>
                  <div className="clean-sub-item">
                    <span className="clean-sub-lbl">LATENCY</span>
                    <span className="clean-sub-num">{fpsData.frametimeMs}ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="carousel-fps-clean-unconfigured">
                <span className="clean-unconf-title">Select Specs</span>
                <span className="clean-unconf-sub">Pick GPU &amp; CPU in sidebar</span>
              </div>
            )}
          </div>

          {/* Portrait box art card */}
          <div
            className="carousel-poster-card"
            style={{ viewTransitionName: transitioningGameId === activeGame?.id ? 'game-cover' : 'none' }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${activeGame?.title}`}
            onClick={() => onSelectGame(activeGame)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectGame(activeGame);
              }
            }}
          >
            {onToggleFavorite && activeGame && (
              <button
                type="button"
                className={`favorite-toggle ${favoriteIds.includes(activeGame.id) ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHeartBurst(e.currentTarget);
                  onToggleFavorite(activeGame.id);
                }}
                title={favoriteIds.includes(activeGame.id) ? `Remove ${activeGame.title} from favourites` : `Add ${activeGame.title} to favourites`}
              >
                <Heart
                  size={14}
                  className="fav-icon"
                  fill={favoriteIds.includes(activeGame.id) ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={favoriteIds.includes(activeGame.id) ? 2.5 : 2}
                />
              </button>
            )}
            {!boxArtLoaded && <div className="carousel-poster-skeleton" />}
            <img
              key={activeGame.id + "-box"}
              src={activeGame.coverUrl}
              alt={activeGame.title}
              decoding="async"
              className={"carousel-poster-img" + (boxArtLoaded ? " loaded" : "")}
              ref={(el) => {
                if (el && el.complete && el.naturalWidth > 0 && loadedBoxGameId !== activeGame.id) {
                  setLoadedBoxGameId(activeGame.id);
                }
              }}
              onLoad={() => setLoadedBoxGameId(activeGame.id)}
              onError={(e) => {
                setLoadedBoxGameId(activeGame.id);
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_PLACEHOLDER_COVER;
              }}
            />
            <div className="carousel-poster-hover-hint">View Details</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-left"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        className="carousel-arrow carousel-arrow-right"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          nextSlide();
        }}
        aria-label="Next"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>

      <div className="carousel-dots">
        {featuredGames.map((g, idx) => (
          <button key={g.id} type="button" className={"carousel-dot" + (idx === currentIndex ? " active" : "")} onClick={() => setCurrentIndex(idx)} aria-label={`Slide ${idx + 1}: ${g.title}`} />
        ))}
      </div>
    </div>
  );
}
