import React, { useState, useEffect } from "react";
import {
  ChevronLeft, Star, Clock, Monitor, Cpu, HardDrive, MemoryStick,
  Gauge, Zap, Activity, Layers, AlertTriangle, CheckCircle, XCircle, Info, Shield, ExternalLink
} from "lucide-react";
import { calculateFps, calculateResolutionComparison } from "../services/fpsEngine.js";
import { getGameHero, getGameWideCover, getGameLogo } from "../services/steamGrid.js";
import { getGameMetadata, getGameReleaseInfo } from "../data/gameMetadata.js";
import { DEFAULT_PLACEHOLDER_COVER } from "../services/gameAssets.js";
import { enrichSingleGame } from "../services/igdb.js";

export function GameDetailPage({ game, gpu, cpu, ram, resolution, preset, upscaling, rayTracing, isFavorite, onToggleFavorite, onBack, onWideArtChange }) {
  const [heroUrl, setHeroUrl] = useState("");
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState(game?.logoUrl || "");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [reqTab, setReqTab] = useState("recommended");
  const [visible, setVisible] = useState(false);
  const [igdbData, setIgdbData] = useState(null);

  useEffect(() => {
    if (!game) return;
    setVisible(false);
    const enterTimer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(enterTimer);
  }, [game]);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    const initialLogo = game.logoUrl || "";
    setLogoUrl(initialLogo);
    setLogoLoaded(Boolean(initialLogo));
    setLogoFailed(false);

    if (initialLogo) return;

    getGameLogo(game.steamGridId, game.steamAppId, game.title)
      .then(logo => {
        if (!cancelled && logo?.url) {
          setLogoUrl(logo.url);
          setLogoLoaded(true);
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
    setIgdbData(null);
    enrichSingleGame(game)
      .then(data => {
        if (!cancelled && data) setIgdbData(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [game]);

  if (!game) return null;

  const metadata = getGameMetadata(game);
  const releaseInfo = getGameReleaseInfo(game);
  const steamRatingDisplay = igdbData?.igdbRating != null ? `${igdbData.igdbRating}%` : metadata.steamRating;
  const isConfigured = Boolean(gpu && cpu);
  const fpsData = calculateFps(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, upscaling });
  const resComparison = calculateResolutionComparison(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, upscaling });

  let fpsColor = "var(--ctp-subtext0)";
  if (isConfigured) {
    fpsColor = "#ffffff";
  }

  const activeReqs = reqTab === "minimum" ? metadata.requirements.minimum : metadata.requirements.recommended;

  const isBorked = metadata.proton.tier === "Borked" || metadata.proton.tier === "Unsupported";
  const protonColor = "rgba(255, 255, 255, 0.4)";

  const resLabels = { "1080p": "1080p Full HD", "1440p": "1440p Quad HD", "4k": "4K Ultra HD" };


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
      </div>

      {/* Hero Banner */}
      <div className={`gdp-hero ${heroLoaded ? "hero-loaded" : "hero-loading"}`}
        style={{ backgroundImage: heroLoaded ? `url("${heroUrl || game.coverUrl}")` : "none" }}>
        {!heroLoaded && <div className="gdp-hero-skeleton" />}
        <img
          src={heroUrl || game.coverUrl}
          alt=""
          style={{ display: "none" }}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0 && !heroLoaded) {
              setHeroLoaded(true);
            }
          }}
          onLoad={() => setHeroLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            if (heroUrl && game.coverUrl && heroUrl !== game.coverUrl) {
              setHeroUrl(game.coverUrl);
            } else {
              setHeroLoaded(true);
            }
          }}
        />
        <div className="gdp-hero-overlay" />

        <div className="gdp-hero-content">
          <div className="gdp-thumb-wrap">
            {!thumbLoaded && <div className="gdp-thumb-skeleton" />}
            <img
              className={`gdp-thumb ${thumbLoaded ? "loaded" : ""}`}
              src={game.coverUrl}
              alt={game.title}
              ref={(el) => {
                if (el && el.complete && el.naturalWidth > 0 && !thumbLoaded) {
                  setThumbLoaded(true);
                }
              }}
              onLoad={() => setThumbLoaded(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_PLACEHOLDER_COVER;
                setThumbLoaded(true);
              }}
            />
          </div>
          <div className="gdp-hero-text">
            {logoUrl && !logoFailed ? (
              <div className="gdp-logo-wrap">
                <img
                  className={`gdp-logo-img ${logoLoaded ? "loaded" : ""}`}
                  src={logoUrl}
                  alt={game.title}
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
                <span className="gdp-studio-name">{igdbData?.developer || metadata.developer || 'Game Studio'}</span>
              </div>
              <div className="gdp-studio-divider" />
              <div className="gdp-studio-card">
                <span className="gdp-studio-label">PUBLISHER</span>
                <span className="gdp-studio-name">{igdbData?.publisher || metadata.publisher || game.publisher || metadata.developer || 'Publisher'}</span>
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
                <div className="steam-rating-badge">
                  <Star size={12} />
                  <span>{steamRatingDisplay}</span>
                </div>
              )}
              <div className={`proton-badge ${isBorked ? "proton-borked" : ""}`} style={{ borderColor: protonColor }}>
                <span className="proton-dot" style={{ backgroundColor: protonColor }} />
                <span>Proton: <strong>{isBorked ? "Unsupported" : metadata.proton.tier}</strong></span>
              </div>
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
              <span className="rig-preset-badge">{resolution.toUpperCase()} &bull; {preset.toUpperCase()}</span>
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

          {/* Resolution Scaling */}
          <section className="gdp-section">
            <div className="gdp-section-title-row">
              <Layers size={15} />
              <span>Resolution Scaling</span>
            </div>
            <div className="res-bars-grid">
              {Array.isArray(resComparison) && resComparison.map(item => {
                const isNumeric = isConfigured && typeof item.avgFps === "number";
                const pct = isNumeric ? Math.min(100, (item.avgFps / 165) * 100) : 0;
                const isCurrentRes = item.resolution === resolution;
                return (
                  <div key={item.resolution} className={`res-bar-row ${isCurrentRes ? "active-res-row" : ""}`}>
                    <div className="res-bar-header">
                      <span className="res-bar-label">
                        {resLabels[item.resolution] || item.resolution}
                        {isCurrentRes && <span className="active-res-badge">ACTIVE</span>}
                      </span>
                      <span className="res-bar-val">{isNumeric ? `${item.avgFps} FPS` : "—"}</span>
                    </div>
                    <div className="res-bar-track">
                      <div className="res-bar-fill" style={{
                        width: `${pct}%`,
                        background: (item.avgFps || 0) >= 60 ? "linear-gradient(90deg,#64748b 0%,#ffffff 100%)" : "linear-gradient(90deg,#334155 0%,#94a3b8 100%)"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Linux / Proton */}
          <section className="gdp-section">
            <div className="gdp-section-title-row">
              <Shield size={15} />
              <span>Linux &amp; Steam Deck</span>
              <span className="proton-pill" style={{ borderColor: protonColor, color: "var(--ctp-text)", background: "rgba(255,255,255,0.07)", marginLeft: "auto" }}>
                {isBorked ? "UNSUPPORTED" : metadata.proton.tier.toUpperCase()}
              </span>
            </div>
            <div className={`proton-box ${isBorked ? "proton-box-borked" : ""}`}>
              <div className="proton-grid">
                <div className="proton-item">
                  <span className="req-key">Anti-Cheat / DRM</span>
                  <span className="req-val">{metadata.proton.antiCheat || "Standard / None"}</span>
                </div>
                <div className="proton-item">
                  <span className="req-key">Online Multiplayer</span>
                  <span className="req-val">
                    {metadata.proton.worksOnline ? "Functional under Linux/Proton" : "Blocked by Anti-Cheat on Linux"}
                  </span>
                </div>
              </div>
              <div className="proton-verdict-note">
                <span className="proton-note-icon">{isBorked ? <XCircle size={14} color="var(--ctp-subtext0)" /> : <Info size={14} />}</span>
                <span className="proton-note-text">{metadata.proton.status}</span>
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
