import React, { useState, useEffect } from "react";
import {
  ChevronLeft, Star, Trash2, Clock, Monitor, Cpu, HardDrive, MemoryStick,
  Gauge, Zap, Activity, Layers, AlertTriangle, CheckCircle, XCircle, Info, Shield, ExternalLink
} from "lucide-react";
import { calculateFps, calculateResolutionComparison } from "../services/fpsEngine.js";
import { getGameHero, getGameWideCover, getGameLogo } from "../services/steamGrid.js";
import { getGameMetadata, getGameReleaseInfo } from "../data/gameMetadata.js";
import { DEFAULT_PLACEHOLDER_COVER } from "../services/gameAssets.js";
import { enrichSingleGame } from "../services/igdb.js";

export function GameDetailPage({ game, gpu, cpu, ram, resolution, preset, upscaling, rayTracing, pathTracing, isFavorite, onToggleFavorite, onDeleteGame, onBack, onWideArtChange, onSelectResolution }) {
  const [heroUrl, setHeroUrl] = useState("");
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState(game?.logoUrl || "");
  const [logoLoaded, setLogoLoaded] = useState(Boolean(game?.logoUrl));
  const [logoFailed, setLogoFailed] = useState(false);
  const [reqTab, setReqTab] = useState("recommended");
  const [visible, setVisible] = useState(false);
  const [igdbData, setIgdbData] = useState(null);
  const [igdbLoading, setIgdbLoading] = useState(true);

  // Trigger entrance animation on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    const initialLogo = game.logoUrl || "";
    setLogoUrl(initialLogo);
    setLogoLoaded(Boolean(initialLogo));
    setLogoFailed(false);

    if (initialLogo) return () => { cancelled = true; };

    getGameLogo(game.steamGridId, game.steamAppId, game.title)
      .then(logo => {
        if (!cancelled && logo?.url) {
          setLogoUrl(logo.url);
          setLogoLoaded(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLogoFailed(true);
      });

    return () => { cancelled = true; };
  }, [game]);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    const initialHero = game.heroUrl || game.wideCoverUrl ||
      (game.steamAppId ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_hero.jpg` : game.coverUrl);
    const chosenHero = initialHero || game.coverUrl || "";
    setHeroUrl(chosenHero);
    if (onWideArtChange && chosenHero) onWideArtChange(chosenHero);
    setHeroLoaded(false); setThumbLoaded(false);

    if (game.heroUrl || game.wideCoverUrl) {
      return () => { cancelled = true; };
    }

    getGameWideCover(game.steamGridId, game.steamAppId)
      .then(wide => {
        if (!cancelled && wide?.url && wide.url !== chosenHero) {
          setHeroUrl(wide.url);
          if (onWideArtChange) onWideArtChange(wide.url);
        }
      })
      .catch(console.warn);

    return () => { cancelled = true; };
  }, [game, onWideArtChange]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onBack]);

  // IGDB enrichment - fetch live game details for accuracy
  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    setIgdbLoading(true);
    setIgdbData(null);
    enrichSingleGame(game)
      .then(data => {
        if (!cancelled) {
          setIgdbData(data || null);
          setIgdbLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIgdbLoading(false);
      });
    return () => { cancelled = true; };
  }, [game]);

  if (!game) return null;

  const metadata = getGameMetadata(game);
  const releaseInfo = getGameReleaseInfo(game);
  const showIgdbSkeleton = igdbLoading && !igdbData;
  const steamRatingDisplay = igdbData?.igdbRating != null ? `${igdbData.igdbRating}%` : metadata.steamRating;
  const isConfigured = Boolean(gpu && cpu);
  const fpsData = calculateFps(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, pathTracing, upscaling });
  const resComparison = calculateResolutionComparison(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, pathTracing, upscaling });

  let fpsColor = "var(--ctp-subtext0)";
  if (isConfigured) {
    fpsColor = "#ffffff";
  }

  const activeReqs = reqTab === "minimum" ? metadata.requirements.minimum : metadata.requirements.recommended;

  const isBorked = metadata.proton.tier === "Borked" || metadata.proton.tier === "Unsupported";
  const protonColor = "rgba(255, 255, 255, 0.4)";

  const resMeta: Record<string, { label: string; name: string; dims: string }> = {
    "1080p": { label: "1080p", name: "Full HD", dims: "1920 × 1080" },
    "1440p": { label: "1440p", name: "Quad HD", dims: "2560 × 1440" },
    "4k": { label: "4K", name: "Ultra HD", dims: "3840 × 2160" }
  };


  return (
    <div
      className={`gdp-root ${visible ? "gdp-visible" : ""}`}
    >
      {/* Floating Navigation: Just the back button and right next to it the favourite button (no container, no repeated game name) */}
      <div className="gdp-nav-actions">
        <button className="gdp-back-btn" onClick={onBack} type="button" id="gdp-sticky-back-btn">
          <ChevronLeft size={16} />
          Back to Library
        </button>
        {onToggleFavorite && (
          <button
            type="button"
            className={`gdp-fav-pill-btn ${isFavorite ? "active" : ""}`}
            onClick={onToggleFavorite}
            title={isFavorite ? `Remove ${game.title} from favourites` : `Add ${game.title} to favourites`}
          >
            <Star size={13} fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 2.5 : 2} />
            <span>{isFavorite ? "Favourited" : "Favourite"}</span>
          </button>
        )}
        {onDeleteGame && (
          <button
            type="button"
            className="gdp-back-btn gdp-delete-btn"
            onClick={() => {
              onDeleteGame(game.id);
              if (onBack) onBack();
            }}
            title={`Delete ${game.title} from library`}
          >
            <Trash2 size={13} />
            <span>Delete Game</span>
          </button>
        )}
      </div>

      {/* Hero Banner */}
      <div className={`gdp-hero ${heroLoaded ? "hero-loaded" : "hero-loading"}`}
        style={{ backgroundImage: heroLoaded ? `url("${heroUrl || game.coverUrl}")` : "none" }}>
        {!heroLoaded && <div className="gdp-hero-skeleton" />}
        {(heroUrl || game.coverUrl) ? (
          <img
            src={heroUrl || game.coverUrl}
            alt=""
            decoding="async"
            style={{ display: "none" }}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && !heroLoaded) {
                setHeroLoaded(true);
              }
            }}
            onLoad={() => setHeroLoaded(true)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              if (heroUrl && game.coverUrl && heroUrl !== game.coverUrl) {
                setHeroUrl(game.coverUrl);
              } else {
                setHeroLoaded(true);
              }
            }}
          />
        ) : null}
        <div className="gdp-hero-overlay" />

        <div className="gdp-hero-content">
          <div className="gdp-thumb-wrap" style={{ viewTransitionName: 'game-cover' }}>
            {!thumbLoaded && <div className="gdp-thumb-skeleton" />}
            <img
              className={`gdp-thumb ${thumbLoaded ? "loaded" : ""}`}
              src={game.coverUrl}
              alt={game.title}
              decoding="async"
              ref={(el) => {
                if (el && el.complete && el.naturalWidth > 0 && !thumbLoaded) {
                  setThumbLoaded(true);
                }
              }}
              onLoad={() => setThumbLoaded(true)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_PLACEHOLDER_COVER;
                setThumbLoaded(true);
              }}
            />
          </div>
          <div className="gdp-hero-text">
            {!logoLoaded && !logoFailed ? (
              <div className="gdp-logo-wrap">
                <div className="skeleton-loading" style={{ width: '180px', height: '42px', borderRadius: '10px' }} />
              </div>
            ) : logoUrl && !logoFailed ? (
              <div className="gdp-logo-wrap">
                <img
                  className={`gdp-logo-img ${logoLoaded ? "loaded" : ""}`}
                  src={logoUrl}
                  alt={game.title}
                  decoding="async"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoFailed(true)}
                />
              </div>
            ) : (
              <h1 className="gdp-title">{game.title}</h1>
            )}
            <p className="gdp-subtitle">
              <span>{igdbData?.genres?.[0] || game.genre}</span>
              <span className="gdp-sub-sep">&bull;</span>
              <span>
                {(() => {
                  // IGDB is the authority — use it when loaded
                  if (igdbData?.releaseDate) {
                    const d = new Date(igdbData.releaseDate);
                    return d <= new Date()
                      ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : `Upcoming (${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })})`;
                  }
                  // While IGDB is loading: just show the year, never guess "Upcoming"
                  if (game.releaseYear) return String(game.releaseYear);
                  return '';
                })()}
              </span>
            </p>

            {/* Prominently Display Developer and Publisher */}
            <div className="gdp-studios-strip">
              <div className="gdp-studio-card">
                <span className="gdp-studio-label">DEVELOPER</span>
                {showIgdbSkeleton ? (
                  <div className="skeleton-loading" style={{ width: '110px', height: '14px', borderRadius: '4px' }} />
                ) : (
                  <span className="gdp-studio-name">{igdbData?.developer || metadata.developer || 'Game Studio'}</span>
                )}
              </div>
              <div className="gdp-studio-divider" />
              <div className="gdp-studio-card">
                <span className="gdp-studio-label">PUBLISHER</span>
                {showIgdbSkeleton ? (
                  <div className="skeleton-loading" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
                ) : (
                  <span className="gdp-studio-name">{igdbData?.publisher || metadata.publisher || game.publisher || metadata.developer || 'Publisher'}</span>
                )}
              </div>
              {igdbData?.genres?.length > 0 && (
                <>
                  <div className="gdp-studio-divider" />
                  <div className="gdp-studio-card">
                    <span className="gdp-studio-label">GENRE</span>
                    <span className="gdp-studio-name">{igdbData.genres.slice(0, 2).join(' / ')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="gdp-badges game-detail-tags">
              <div className="meta-score-badge">
                <span className="score-num">{igdbData?.metacriticRating || igdbData?.igdbRating || metadata.metacritic}</span>
                <span className="score-lbl">{igdbData?.metacriticRating ? 'METACRITIC' : 'METASCORE'}</span>
              </div>
              {steamRatingDisplay && (
                <a
                  href={game.steamAppId ? `https://store.steampowered.com/app/${game.steamAppId}#app_reviews_hash` : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="steam-rating-badge"
                  title="View Steam Reviews"
                >
                  <Star size={12} />
                  <span>{steamRatingDisplay}</span>
                </a>
              )}
              <a
                href={game.steamAppId ? `https://www.protondb.com/app/${game.steamAppId}` : `https://www.protondb.com/search?q=${encodeURIComponent(game.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`proton-badge ${isBorked ? "proton-borked" : ""}`}
                title="View ProtonDB Reports"
              >
                <span className="proton-dot" style={{ backgroundColor: protonColor }} />
                <span>Proton: <strong>{isBorked ? "Unsupported" : metadata.proton.tier}</strong></span>
              </a>
              {/* Store links from IGDB */}
              {igdbData?.websites?.filter(w => [13,16,17].includes(w.category)).map((site, i) => {
                const labels = { 13: 'Steam', 16: 'Epic', 17: 'GOG' };
                return (
                  <a key={i} href={site.url} target="_blank" rel="noopener noreferrer" className="igdb-store-badge">
                    <ExternalLink size={10} />
                    <span>{labels[site.category] || 'Store'}</span>
                  </a>
                );
              })}
            </div>

            {/* IGDB Live Description — seamlessly injected into hero, no separate section */}
            {igdbData?.summary && (
              <p className="gdp-igdb-summary">{igdbData.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div className="gdp-body">

        {/* LEFT COLUMN */}
        <div className="gdp-col-left">

          {/* FPS Banner */}
          <section className="gdp-section gdp-fps-banner">
            <div className="gdp-section-title-row">
              <Gauge size={15} />
              <span>Estimated FPS</span>
            </div>
            <div className="detail-fps-value-group" style={{ marginBottom: 12 }}>
              <span className="detail-fps-num" style={{ color: fpsColor }}>{isConfigured ? fpsData.avgFps : "—"}</span>
              <span className="detail-fps-unit">EST. FPS</span>
            </div>
            <div className="detail-stats-grid">
              <div className="detail-stat-card">
                <span className="detail-stat-label">1% Lows</span>
                <span className="detail-stat-val">{isConfigured ? `${fpsData.low1PercentFps} FPS` : "—"}</span>
              </div>
              <div className="detail-stat-card">
                <span className="detail-stat-label">Frametime</span>
                <span className="detail-stat-val">{isConfigured ? `${fpsData.frametimeMs} ms` : "—"}</span>
              </div>
              <div className="detail-stat-card">
                <span className="detail-stat-label">Bottleneck</span>
                <span className="detail-stat-val">{isConfigured ? `${fpsData.bottleneck.culprit} (${fpsData.bottleneck.percentage}%)` : "—"}</span>
              </div>
            </div>
          </section>

          {/* FPS Graph */}
          <section className="gdp-section gdp-fps-graph-section">
            <div className="gdp-section-title-row">
              <Activity size={15} />
              <span>FPS Graph</span>
            </div>

            <div className="fps-graph-wrapper">
              <div className="fps-graph-rows">
                {Array.isArray(resComparison) && resComparison.map(item => {
                  const isNumeric = isConfigured && typeof item.avgFps === "number";
                  const pct = isNumeric ? Math.max(4, Math.min(100, (item.avgFps / 165) * 100)) : 0;
                  const isCurrentRes = item.resolution === resolution;
                  const is60 = isNumeric && item.avgFps >= 60;
                  const is120 = isNumeric && item.avgFps >= 120;
                  const isSub30 = isNumeric && item.avgFps < 30;
                  const meta = resMeta[item.resolution] || { label: item.resolution, name: item.resolution, dims: "" };
                  
                  return (
                    <div
                      key={item.resolution}
                      className={`fps-graph-row ${isCurrentRes ? "active-row" : ""}`}
                      onClick={() => onSelectResolution && onSelectResolution(item.resolution)}
                      title={onSelectResolution ? `Click to switch to ${meta.name}` : undefined}
                      role={onSelectResolution ? "button" : undefined}
                    >
                      <div className="fps-graph-row-header">
                        <div className="fps-graph-res-group">
                          <span className="fps-graph-res-badge">{meta.label}</span>
                          <span className="fps-graph-res-name">{meta.name}</span>
                        </div>

                        <div className="fps-graph-stat-group">
                          {isNumeric && typeof item.low1PercentFps === "number" && (
                            <span className="fps-graph-low1">1% low: {item.low1PercentFps}</span>
                          )}
                          <div className="fps-graph-num-wrap">
                            <span className={`fps-graph-val-big ${isSub30 ? 'fps-val-sub30' : is60 ? 'fps-val-smooth' : ''}`}>
                              {isNumeric ? item.avgFps : "—"}
                            </span>
                            <span className="fps-graph-val-unit">FPS</span>
                          </div>
                        </div>
                      </div>

                      <div className="fps-graph-track-container">
                        <div className="fps-graph-track">
                          {isNumeric && (
                            <div
                              className={`fps-graph-fill ${isCurrentRes ? 'fill-active' : ''} ${is120 ? 'fill-ultra' : is60 ? 'fill-smooth' : isSub30 ? 'fill-low' : 'fill-playable'}`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Linux / Proton */}
          <section className="gdp-section gdp-proton-section">
            <div className="gdp-section-title-row">
              <Shield size={15} />
              <span>Steam Deck &amp; Linux</span>
              <span className="proton-pill" style={{ color: "var(--ctp-text)", background: "rgba(255,255,255,0.08)", marginLeft: "auto" }}>
                {isBorked ? "UNSUPPORTED" : metadata.proton.tier.toUpperCase()}
              </span>
            </div>
            <div className="proton-clean-card">
              <p className="proton-summary-text">
                {isBorked
                  ? "Currently unsupported on Linux and Steam Deck."
                  : metadata.proton.status || "Runs smoothly via Proton on Steam Deck and Linux."}
              </p>
              <div className="proton-badges-row">
                <span className={`proton-pill-tag ${isBorked ? "pill-warn" : "pill-good"}`}>
                  Steam Deck: {isBorked ? "Unsupported" : "Playable"}
                </span>
                <span className={`proton-pill-tag ${metadata.proton.worksOnline ? "pill-good" : "pill-warn"}`}>
                  Online: {metadata.proton.worksOnline ? "Working" : "Windows Only"}
                </span>
              </div>
              <div className="proton-action-buttons">
                <a
                  href={game.steamAppId ? `https://www.protondb.com/app/${game.steamAppId}` : `https://www.protondb.com/search?q=${encodeURIComponent(game.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gdp-action-btn proton-btn"
                >
                  <ExternalLink size={12} />
                  <span>ProtonDB Reports</span>
                </a>
                <a
                  href={game.steamAppId ? `https://store.steampowered.com/app/${game.steamAppId}#app_reviews_hash` : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gdp-action-btn reviews-btn"
                >
                  <Star size={12} />
                  <span>Steam Reviews</span>
                </a>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="gdp-col-right">

          {/* HowLongToBeat */}
          <section className="gdp-section">
            <div className="gdp-section-title-row">
              <Clock size={15} />
              <span>Time to Complete</span>
            </div>
            <div className="hltb-cards-grid">
              <div className="hltb-card">
                <span className="hltb-label">Main Story</span>
                <span className="hltb-hours">{metadata.hltb.main > 0 ? `${metadata.hltb.main}h` : "MP"}</span>
                <span className="hltb-desc">Core Campaign</span>
              </div>
              <div className="hltb-card">
                <span className="hltb-label">+ Extras</span>
                <span className="hltb-hours">{metadata.hltb.extra > 0 ? `${metadata.hltb.extra}h` : "MP"}</span>
                <span className="hltb-desc">Side Content</span>
              </div>
              <div className="hltb-card">
                <span className="hltb-label">100%</span>
                <span className="hltb-hours">{metadata.hltb.completionist > 0 ? `${metadata.hltb.completionist}h` : "∞"}</span>
                <span className="hltb-desc">Completionist</span>
              </div>
            </div>
          </section>

          {/* System Requirements */}
          <section className="gdp-section">
            <div className="gdp-section-title-row">
              <Monitor size={15} />
              <span>System Requirements</span>
              <div className="reqs-tab-group" style={{ marginLeft: "auto" }}>
                <button type="button" className={`reqs-tab-btn ${reqTab === "minimum" ? "active" : ""}`} onClick={() => setReqTab("minimum")}>Min</button>
                <button type="button" className={`reqs-tab-btn ${reqTab === "recommended" ? "active" : ""}`} onClick={() => setReqTab("recommended")}>Rec</button>
              </div>
            </div>
            <div className="reqs-box">
              <div className="reqs-grid">
                {[
                  [<Monitor size={12} />, "OS", activeReqs.os],
                  [<Cpu size={12} />, "CPU", activeReqs.cpu],
                  [<Activity size={12} />, "GPU", activeReqs.gpu],
                  [<Zap size={12} />, "VRAM", activeReqs.vram],
                  [<MemoryStick size={12} />, "RAM", activeReqs.ram],
                  [<HardDrive size={12} />, "Storage", activeReqs.storage],
                ].map(([icon, key, val]) => (
                  <div className="req-item" key={key}>
                    <span className="req-key" style={{ display: "flex", alignItems: "center", gap: 4 }}>{icon} {key}</span>
                    <span className="req-val">{val}</span>
                  </div>
                ))}
              </div>
              <div className="rig-check-banner">
                {isConfigured ? (
                  <><CheckCircle size={14} color="var(--ctp-text)" /><div><strong>Rig Check:</strong> {reqTab === "recommended" ? "Meets recommended specs." : "Exceeds minimum."}</div></>
                ) : (
                  <><Info size={14} /><div>Select GPU &amp; CPU to compare against requirements.</div></>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
