import React, { useState, useEffect, useRef, useCallback } from "react";
import { GAME_METADATA, getGameReleaseInfo } from "../data/gameMetadata.js";
import { getGameWideCover, getGameHero } from "../services/steamGrid.js";
import { getSystemPeriod, getGameTrendingScore } from "../services/systemTrending.js";

export function GameCarousel({ games, isConfigured, onSelectGame, onActiveGameChange }) {
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
  const [wideArtUrl, setWideArtUrl] = useState("");
  const [loadedWideArtUrl, setLoadedWideArtUrl] = useState("");
  const [loadedBoxGameId, setLoadedBoxGameId] = useState(null);
  const timerRef = useRef(null);

  const activeGame = featuredGames[currentIndex] || featuredGames[0];
  const boxArtLoaded = loadedBoxGameId === activeGame?.id;
  const wideArtLoaded = loadedWideArtUrl === wideArtUrl;

  useEffect(() => { if (activeGame && onActiveGameChange) onActiveGameChange(activeGame); }, [activeGame, onActiveGameChange]);

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

  const nextSlide = useCallback(() => {
    if (!featuredGames || featuredGames.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % featuredGames.length);
  }, [featuredGames]);

  const prevSlide = useCallback(() => {
    if (!featuredGames || featuredGames.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + featuredGames.length) % featuredGames.length);
  }, [featuredGames]);

  useEffect(() => {
    if (isPaused || !featuredGames || featuredGames.length <= 1) return;
    timerRef.current = setInterval(nextSlide, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, nextSlide, featuredGames]);

  if (!featuredGames || !featuredGames.length || !activeGame) return null;

  const metadata = GAME_METADATA[activeGame.id] || { metacritic: 88, steamRating: "92%", proton: { tier: "Verified" }, hltb: { main: 25 } };
  const releaseInfo = getGameReleaseInfo(activeGame);
  const isBorked = metadata.proton?.tier === "Borked";
  const protonTier = isBorked ? "Unsupported" : (metadata.proton?.tier || "Verified");

  return (
    <div className="game-carousel" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} role="region" aria-label="Featured Games Carousel">

      {/* Background: Wide landscape art */}
      <div className="carousel-slide-backdrop">
        {!wideArtLoaded && <div className="carousel-bg-skeleton" />}
        <img
          key={wideArtUrl}
          src={wideArtUrl}
          alt=""
          className={"carousel-bg-img" + (wideArtLoaded ? " loaded" : "")}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && loadedWideArtUrl !== wideArtUrl) {
              setLoadedWideArtUrl(wideArtUrl);
            }
          }}
          onLoad={() => setLoadedWideArtUrl(wideArtUrl)}
          onError={(e) => {
            setLoadedWideArtUrl(wideArtUrl);
            if (activeGame?.coverUrl && e.target.src !== activeGame.coverUrl) {
              e.target.onerror = null;
              e.target.src = activeGame.coverUrl;
            }
          }}
        />
        <div className="carousel-gradient-overlay" />
      </div>

      {/* Slide Content */}
      <div className="carousel-content">
        {/* Left: Text Info */}
        <div className="carousel-left">
          <div className="carousel-meta-row">
            <span className="carousel-badge-featured">TRENDING &bull; {systemPeriod.monthShort.toUpperCase()} {systemPeriod.year}</span>
            <span className="carousel-badge-genre">{activeGame.genre}</span>
            <span className="carousel-badge-year">{releaseInfo.isUnreleased ? `UNRELEASED • ${releaseInfo.fullLabel}` : releaseInfo.shortLabel}</span>
          </div>
          <h2 className="carousel-title">{activeGame.title}</h2>
          <p className="carousel-desc">{activeGame.description}</p>
          <div className="carousel-stats-strip">
            <div className="carousel-stat-pill"><span className="carousel-stat-lbl">METASCORE</span><span className="carousel-stat-num">{metadata.metacritic}</span></div>
            <div className="carousel-stat-pill"><span className="carousel-stat-lbl">STEAM</span><span className="carousel-stat-num">&#9733; {metadata.steamRating}</span></div>
            <div className={"carousel-stat-pill" + (isBorked ? " stat-borked" : "")}><span className="carousel-stat-lbl">PROTON</span><span className="carousel-stat-num">{protonTier}</span></div>
            {metadata.hltb?.main > 0 && <div className="carousel-stat-pill"><span className="carousel-stat-lbl">CAMPAIGN</span><span className="carousel-stat-num">{metadata.hltb.main}h</span></div>}
          </div>
          <div className="carousel-action-row">
            <button type="button" className="carousel-cta-btn" onClick={() => onSelectGame(activeGame)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              View Details &amp; Benchmark
            </button>
          </div>
        </div>

        {/* Right: Portrait box art card */}
        <div
          className="carousel-poster-card"
          role="button"
          tabIndex={0}
          aria-label={`View details for ${activeGame.title}`}
          onClick={() => onSelectGame(activeGame)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectGame(activeGame);
            }
          }}
        >
          {!boxArtLoaded && <div className="carousel-poster-skeleton" />}
          <img
            key={activeGame.id + "-box"}
            src={activeGame.coverUrl}
            alt={activeGame.title}
            className={"carousel-poster-img" + (boxArtLoaded ? " loaded" : "")}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && loadedBoxGameId !== activeGame.id) {
                setLoadedBoxGameId(activeGame.id);
              }
            }}
            onLoad={() => setLoadedBoxGameId(activeGame.id)}
            onError={(e) => {
              setLoadedBoxGameId(activeGame.id);
              e.target.onerror = null;
              e.target.src = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg';
            }}
          />
          <div className="carousel-poster-hover-hint">View Details</div>
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
      >&#8249;</button>
      <button
        type="button"
        className="carousel-arrow carousel-arrow-right"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          nextSlide();
        }}
        aria-label="Next"
      >&#8250;</button>

      <div className="carousel-dots">
        {featuredGames.map((g, idx) => (
          <button key={g.id} type="button" className={"carousel-dot" + (idx === currentIndex ? " active" : "")} onClick={() => setCurrentIndex(idx)} aria-label={`Slide ${idx + 1}: ${g.title}`} />
        ))}
      </div>
    </div>
  );
}
