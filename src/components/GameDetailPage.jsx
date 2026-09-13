import React, { useState, useEffect } from "react";
import {
  ChevronLeft, Star, Clock, Monitor, Cpu, HardDrive, MemoryStick,
  Gauge, Zap, Activity, Layers, AlertTriangle, CheckCircle, XCircle, Info, Shield
} from "lucide-react";
import { calculateFps, calculateResolutionComparison } from "../services/fpsEngine.js";
import { getGameHero, getGameWideCover } from "../services/steamGrid.js";
import { getGameMetadata, getGameReleaseInfo } from "../data/gameMetadata.js";

export function GameDetailPage({ game, gpu, cpu, ram, resolution, preset, upscaling, rayTracing, onBack, onLoadingChange, onWideArtChange }) {
  const [heroUrl, setHeroUrl] = useState("");
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [reqTab, setReqTab] = useState("recommended");
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingDone, setLoadingDone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!game) return;
    setLoadingPct(0); setLoadingDone(false); setVisible(false);
    if (onLoadingChange) onLoadingChange(0, false);
    let pct = 0;
    const tick = () => {
      pct = pct < 70 ? pct + Math.random() * 18 + 6 : pct < 90 ? pct + Math.random() * 4 + 1 : pct < 95 ? pct + 0.5 : pct;
      if (pct > 95) pct = 95;
      setLoadingPct(pct);
      if (onLoadingChange) onLoadingChange(pct, false);
    };
    const interval = setInterval(tick, 60);
    const enterTimer = setTimeout(() => setVisible(true), 30);
    const finishTimer = setTimeout(() => {
      clearInterval(interval);
      setLoadingPct(100);
      if (onLoadingChange) onLoadingChange(100, false);
      setTimeout(() => {
        setLoadingDone(true);
        if (onLoadingChange) onLoadingChange(100, true);
      }, 380);
    }, 1200);
    return () => { clearInterval(interval); clearTimeout(enterTimer); clearTimeout(finishTimer); };
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

  if (!game) return null;

  const metadata = getGameMetadata(game);
  const releaseInfo = getGameReleaseInfo(game);
  const isConfigured = Boolean(gpu && cpu);
  const fpsData = calculateFps(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, upscaling });
  const resComparison = calculateResolutionComparison(game, gpu, cpu, ram || 16, { resolution, preset, rayTracing, upscaling });

  let fpsColor = "var(--ctp-subtext0)";
  if (isConfigured) {
    if (fpsData.avgFps >= 100) fpsColor = "#ffffff";
    else if (fpsData.avgFps >= 60) fpsColor = "#4ade80";
    else if (fpsData.avgFps >= 30) fpsColor = "#facc15";
    else fpsColor = "#f87171";
  }

  const activeReqs = reqTab === "minimum" ? metadata.requirements.minimum : metadata.requirements.recommended;

  const isBorked = metadata.proton.tier === "Borked" || metadata.proton.tier === "Unsupported";
  let protonColor = "#4ade80";
  if (isBorked) protonColor = "#f87171";
  else if (metadata.proton.tier === "Silver") protonColor = "#facc15";
  else if (metadata.proton.tier === "Gold") protonColor = "#e2e8f0";
  else if (metadata.proton.tier === "Platinum") protonColor = "#ffffff";

  const resLabels = { "1080p": "1080p Full HD", "1440p": "1440p Quad HD", "4k": "4K Ultra HD" };

  return (
    <div className={`gdp-root ${visible ? "gdp-visible" : ""}`}>

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

        <button className="gdp-back-btn" onClick={onBack} type="button">
          <ChevronLeft size={16} />
          Back to Library
        </button>

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
                e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80";
                setThumbLoaded(true);
              }}
            />
          </div>
          <div className="gdp-hero-text">
            <h1 className="gdp-title">{game.title}</h1>
            <p className="gdp-subtitle">{game.genre} &bull; {releaseInfo.isUnreleased ? `Unreleased • ${releaseInfo.fullLabel}` : releaseInfo.fullLabel} &bull; {metadata.developer}</p>
            <div className="gdp-badges game-detail-tags">
              <div className="meta-score-badge">
                <span className="score-num">{metadata.metacritic}</span>
                <span className="score-lbl">METASCORE</span>
              </div>
              <div className="steam-rating-badge">
                <Star size={12} />
                <span>{metadata.steamRating}</span>
              </div>
              <div className={`proton-badge ${isBorked ? "proton-borked" : ""}`} style={{ borderColor: protonColor }}>
                <span className="proton-dot" style={{ backgroundColor: protonColor }} />
                <span>Proton: <strong>{isBorked ? "Unsupported" : metadata.proton.tier}</strong></span>
              </div>
            </div>
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
              <span>FPS on Your Rig</span>
              <span className="rig-preset-badge">{resolution.toUpperCase()} &bull; {preset.toUpperCase()}</span>
            </div>
            <div className="detail-fps-value-group" style={{ marginBottom: 12 }}>
              <span className="detail-fps-num" style={{ color: fpsColor }}>{isConfigured ? fpsData.avgFps : "—"}</span>
              <span className="detail-fps-unit">FPS AVG</span>
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
                <span className="detail-stat-val" style={{
                  color: fpsData.bottleneck.culprit === "GPU" ? "var(--ctp-blue)"
                       : fpsData.bottleneck.culprit === "CPU" ? "var(--ctp-peach)" : "#4ade80"
                }}>{isConfigured ? `${fpsData.bottleneck.culprit} (${fpsData.bottleneck.percentage}%)` : "—"}</span>
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
              <span className="proton-pill" style={{ borderColor: protonColor, color: protonColor, background: isBorked ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.07)", marginLeft: "auto" }}>
                {isBorked ? "BORKED" : metadata.proton.tier.toUpperCase()}
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
                  <span className="req-val" style={{ color: metadata.proton.worksOnline ? "#4ade80" : "#f87171" }}>
                    {metadata.proton.worksOnline ? "Functional under Linux/Proton" : "Blocked by Anti-Cheat on Linux"}
                  </span>
                </div>
              </div>
              <div className="proton-verdict-note">
                <span className="proton-note-icon">{isBorked ? <XCircle size={14} color="#f87171" /> : <Info size={14} />}</span>
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
                  <><CheckCircle size={14} color="#4ade80" /><div><strong>Rig Check:</strong> {reqTab === "recommended" ? "Meets recommended specs." : "Exceeds minimum."}</div></>
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
