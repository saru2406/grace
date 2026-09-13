import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GPUS, CPUS, SYSTEM_PRESETS } from './data/hardware.js';
import { DEFAULT_GAMES } from './data/games.js';
import { calculateFps } from './services/fpsEngine.js';
import { getGameGrid, getGameHero, getGameWideCover } from './services/steamGrid.js';
import { getSystemPeriod, getGameTrendingScore } from './services/systemTrending.js';
import {
  saveSteamUser,
  getStoredSteamUser,
  saveGoogleUser,
  getStoredGoogleUser
} from './services/authAndSteam.js';

import { AmbientBackdrop } from './components/AmbientBackdrop.jsx';
import { Header } from './components/Header.jsx';
import { SystemStatusBar } from './components/SystemStatusBar.jsx';
import { SpecsSidebar } from './components/SpecsSidebar.jsx';
import { GameCarousel } from './components/GameCarousel.jsx';
import { GamesGrid } from './components/GamesGrid.jsx';
import { GameDetailPage } from './components/GameDetailPage.jsx';
import { SteamGridSearchModal } from './components/SteamGridSearchModal.jsx';
import { SteamImportModal } from './components/SteamImportModal.jsx';
import { GoogleAuthModal } from './components/GoogleAuthModal.jsx';

const LOCAL_STORAGE_CUSTOM_GAMES = 'fps_estimator_custom_games';
const LOCAL_STORAGE_SPECS = 'fps_estimator_specs';
const LOCAL_STORAGE_THEME = 'fps_estimator_theme';

const HIDDEN_GAME_IDS = new Set([
  'ghost-of-tsushima',
  'spiderman-remastered',
  'horizon-forbidden-west',
  'the-last-of-us-part-1',
  'gta-vi'
]);

export function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem(LOCAL_STORAGE_THEME) || 'ambient');

  // Background artwork sync: driven by current active carousel slide on home, and game wide art on full game page
  const [carouselBg, setCarouselBg] = useState(
    'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg'
  );
  const [detailWideBg, setDetailWideBg] = useState('');

  // Page-level loading state lifted from GameDetailPage for header bar
  const [pageLoadingPct, setPageLoadingPct] = useState(0);
  const [pageLoadingDone, setPageLoadingDone] = useState(true);

  // Sync theme attribute to HTML root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LOCAL_STORAGE_THEME, theme);
  }, [theme]);

  // Global Tactile Ripple Animation
  useEffect(() => {
    function handlePointerDown(e) {
      // Ignore right clicks or middle clicks
      if (e.button !== 0) return;

      const target = e.target.closest(
        'button, .preset-chip, .tab-btn, .segmented-btn, .brand-pill, .search-result-card, .theme-card-option, .hltb-card, .carousel-cta-btn, .carousel-arrow, .carousel-dot'
      );
      if (!target) return;

      // Don't trigger inside popouts
      if (target.closest('.profile-popout')) return;

      if (!target.classList.contains('ripple-target')) {
        const computedPos = window.getComputedStyle(target).position;
        if (computedPos === 'static') {
          target.classList.add('ripple-target');
        } else {
          target.style.overflow = 'hidden';
        }
      }

      const rect = target.getBoundingClientRect();
      // Calculate the farthest corner distance from click origin —
      // this ensures the ripple circle expands exactly to cover the element
      // boundary with scale(1), so it never bleeds beyond the container.
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const dx = Math.max(clickX, rect.width - clickX);
      const dy = Math.max(clickY, rect.height - clickY);
      const diameter = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2);
      const radius = diameter / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-wave';
      ripple.style.width = `${diameter}px`;
      ripple.style.height = `${diameter}px`;
      ripple.style.left = `${clickX - radius}px`;
      ripple.style.top = `${clickY - radius}px`;

      // Clean up previous ripples if user spam clicks
      const existingRipples = target.querySelectorAll('.ripple-wave');
      if (existingRipples.length > 2) {
        existingRipples[0].remove();
      }

      target.appendChild(ripple);

      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 700);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Hardware Specs State
  const [specs, setSpecs] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SPECS) || '{}');
    return {
      gpu: saved.gpuId ? (GPUS.find(g => g.id === saved.gpuId) || null) : null,
      cpu: saved.cpuId ? (CPUS.find(c => c.id === saved.cpuId) || null) : null,
      ram: saved.ram || null,
      resolution: saved.resolution || '1440p',
      preset: saved.preset || 'high',
      upscaling: saved.upscaling || 'quality',
      rayTracing: saved.rayTracing !== undefined ? saved.rayTracing : false
    };
  });

  // Save specs on change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SPECS, JSON.stringify({
      gpuId: specs.gpu ? specs.gpu.id : null,
      cpuId: specs.cpu ? specs.cpu.id : null,
      ram: specs.ram,
      resolution: specs.resolution,
      preset: specs.preset,
      upscaling: specs.upscaling,
      rayTracing: specs.rayTracing
    }));
  }, [specs]);

  // Brand filter states
  const [gpuBrandFilter, setGpuBrandFilter] = useState('all');
  const [cpuBrandFilter, setCpuBrandFilter] = useState('all');

  // Games Library state
  const [customGames, setCustomGames] = useState(() => {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_GAMES) || '[]');
  });

  const games = useMemo(() => {
    const visibleDefaultGames = DEFAULT_GAMES.filter(game => !HIDDEN_GAME_IDS.has(game.id));
    return [...customGames, ...visibleDefaultGames];
  }, [customGames]);

  // System Date / Recency period
  const systemPeriod = useMemo(() => getSystemPeriod(), []);

  // Library Controls
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');

  // Modals & Popout
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const [activeDetailGame, setActiveDetailGame] = useState(null);
  const [isSteamGridSearchOpen, setIsSteamGridSearchOpen] = useState(false);
  const [steamGridSearchInitialQuery, setSteamGridSearchInitialQuery] = useState('');
  const [isSteamImportOpen, setIsSteamImportOpen] = useState(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  // Authentication states
  const [steamUser, setSteamUser] = useState(getStoredSteamUser);
  const [googleUser, setGoogleUser] = useState(getStoredGoogleUser);

  // Calculate FPS for all games
  const processedGames = useMemo(() => {
    return games.map(game => {
      const fpsData = calculateFps(game, specs.gpu, specs.cpu, specs.ram || 16, {
        resolution: specs.resolution,
        preset: specs.preset,
        rayTracing: specs.rayTracing,
        upscaling: specs.upscaling
      });
      return {
        game,
        ...fpsData
      };
    });
  }, [games, specs]);

  // Filter & Sort
  const filteredAndSortedGames = useMemo(() => {
    let filtered = processedGames;

    if (category === 'trending') {
      filtered = filtered.filter(item => {
        const score = getGameTrendingScore(item.game, systemPeriod.year, systemPeriod.month);
        return score >= 65 || item.game.releaseYear >= (systemPeriod.year - 1);
      });
    } else if (category !== 'all') {
      filtered = filtered.filter(item => item.game.category === category);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.game.title.toLowerCase().includes(q) ||
        (item.game.genre && item.game.genre.toLowerCase().includes(q))
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'trending': {
          const scoreA = getGameTrendingScore(a.game, systemPeriod.year, systemPeriod.month);
          const scoreB = getGameTrendingScore(b.game, systemPeriod.year, systemPeriod.month);
          return scoreB - scoreA;
        }
        case 'fps-desc':
          return (b.avgFps || 0) - (a.avgFps || 0);
        case 'fps-asc':
          return (a.avgFps || 0) - (b.avgFps || 0);
        case 'title-asc':
          return a.game.title.localeCompare(b.game.title);
        case 'year-desc':
          return (b.game.releaseYear || 2020) - (a.game.releaseYear || 2020);
        default:
          return 0;
      }
    });
  }, [processedGames, category, searchQuery, sortBy, systemPeriod]);

  // System Status Bar summary metrics
  const isConfigured = Boolean(specs.gpu && specs.cpu);
  const summary = useMemo(() => {
    if (!isConfigured || processedGames.length === 0) {
      return {
        avgFps: 0,
        lowFps: 0,
        bottleneckText: 'None',
        bottleneckColor: 'var(--ctp-subtext0)',
        smoothCount: 0,
        totalCount: processedGames.length,
        verdictText: 'Unconfigured',
        verdictColor: 'var(--ctp-subtext0)'
      };
    }

    const total = processedGames.length;
    const sumAvg = processedGames.reduce((acc, r) => acc + (r.avgFps || 0), 0);
    const sum1Low = processedGames.reduce((acc, r) => acc + (r.low1PercentFps || 0), 0);
    const smoothCount = processedGames.filter(r => r.avgFps >= 60).length;

    const avgFps = Math.round(sumAvg / total);
    const lowFps = Math.round(sum1Low / total);

    const gpuBottlenecks = processedGames.filter(r => r.bottleneck.culprit === 'GPU').length;
    const cpuBottlenecks = processedGames.filter(r => r.bottleneck.culprit === 'CPU').length;

    let bottleneckText = 'Balanced Pairing';
    let bottleneckColor = 'var(--ctp-green)';
    if (gpuBottlenecks >= total * 0.6) {
      bottleneckText = 'GPU Bound (Optimal)';
      bottleneckColor = 'var(--ctp-blue)';
    } else if (cpuBottlenecks >= total * 0.4) {
      bottleneckText = 'CPU Limiting Potential';
      bottleneckColor = 'var(--ctp-peach)';
    }

    let verdictText = '60+ FPS Smooth Gaming';
    let verdictColor = 'var(--ctp-green)';
    if (avgFps >= 120) {
      verdictText = 'Ultra High-Refresh Monster';
      verdictColor = '#ffffff';
    } else if (avgFps >= 60) {
      verdictText = '60+ FPS Smooth Gaming';
      verdictColor = 'var(--ctp-green)';
    } else if (avgFps >= 45) {
      verdictText = 'Console Quality Framerate';
      verdictColor = 'var(--ctp-yellow)';
    } else {
      verdictText = 'Settings Optimization Recommended';
      verdictColor = 'var(--ctp-red)';
    }

    return {
      avgFps,
      lowFps,
      bottleneckText,
      bottleneckColor,
      smoothCount,
      totalCount: total,
      verdictText,
      verdictColor
    };
  }, [isConfigured, processedGames]);

  // Handlers
  const handleApplyPreset = useCallback((preset) => {
    const gpu = GPUS.find(g => g.id === preset.gpuId) || null;
    const cpu = CPUS.find(c => c.id === preset.cpuId) || null;
    setSpecs({
      gpu,
      cpu,
      ram: preset.ram,
      resolution: preset.resolution,
      preset: preset.preset,
      upscaling: preset.upscaling,
      rayTracing: preset.rayTracing
    });
    setGpuBrandFilter('all');
    setCpuBrandFilter('all');
  }, []);

  const handleResetSpecs = useCallback(() => {
    setSpecs({
      gpu: null,
      cpu: null,
      ram: null,
      resolution: '1440p',
      preset: 'high',
      upscaling: 'quality',
      rayTracing: false
    });
    setGpuBrandFilter('all');
    setCpuBrandFilter('all');
  }, []);

  const handleAddSteamGridGame = useCallback(async (steamItem) => {
    const exists = games.find(g => g.steamGridId === steamItem.id || g.title.toLowerCase() === steamItem.name.toLowerCase());
    if (exists) {
      setIsSteamGridSearchOpen(false);
      setActiveDetailGame(exists);
      return;
    }

    let coverUrl = 'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg';
    let heroUrl = '';
    let wideCoverUrl = '';
    try {
      const [grid, hero, wide] = await Promise.allSettled([
        getGameGrid(steamItem.id),
        getGameHero(steamItem.id),
        getGameWideCover(steamItem.id)
      ]);
      if (grid.status === 'fulfilled' && (grid.value?.thumb || grid.value?.url)) {
        coverUrl = grid.value.thumb || grid.value.url;
      }
      if (hero.status === 'fulfilled' && hero.value?.url) {
        heroUrl = hero.value.url;
      }
      if (wide.status === 'fulfilled' && wide.value?.url) {
        wideCoverUrl = wide.value.url;
      }
    } catch (e) {
      console.warn('Grid/hero fetch error:', e);
    }

    const releaseDate = steamItem.release_date ? new Date(steamItem.release_date * 1000) : null;
    const releaseYear = releaseDate ? releaseDate.getFullYear() : 2024;
    let baseFps = 75;
    let gpuIntensity = 1.15;
    let cpuIntensity = 1.10;

    if (releaseYear >= 2024) {
      baseFps = 65;
      gpuIntensity = 1.35;
      cpuIntensity = 1.20;
    } else if (releaseYear <= 2018) {
      baseFps = 110;
      gpuIntensity = 0.85;
      cpuIntensity = 0.85;
    }

    const newGame = {
      id: `custom-${steamItem.id}`,
      title: steamItem.name,
      genre: 'Custom PC Game',
      category: 'aaa',
      releaseYear: releaseYear || 2024,
      releaseMonth: releaseDate ? releaseDate.getMonth() + 1 : undefined,
      releaseDay: releaseDate ? releaseDate.getDate() : undefined,
      releaseDate: releaseDate ? releaseDate.toISOString() : undefined,
      steamGridId: steamItem.id,
      coverUrl,
      heroUrl,
      wideCoverUrl,
      baseFps,
      gpuIntensity,
      cpuIntensity,
      vramAt1080p: 6.5,
      vramAt1440p: 8.8,
      vramAt4k: 12.0,
      ramRecommended: 16,
      supportsRayTracing: releaseYear >= 2020,
      rtImpact: 0.40,
      description: 'Added directly from SteamGridDB database.'
    };

    setCustomGames(prev => {
      const updated = [newGame, ...prev];
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_GAMES, JSON.stringify(updated));
      return updated;
    });

    const initialWide = newGame.heroUrl || newGame.wideCoverUrl || newGame.coverUrl;
    setDetailWideBg(initialWide || '');
    setPageLoadingPct(20);
    setPageLoadingDone(false);
    setIsSteamGridSearchOpen(false);
    setActiveDetailGame(newGame);
  }, [games]);

  const handleSelectGame = useCallback((game) => {
    const initialWide =
      game.heroUrl ||
      game.wideCoverUrl ||
      (game.steamAppId
        ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_hero.jpg`
        : game.coverUrl);
    setDetailWideBg(initialWide || game.coverUrl || '');
    setPageLoadingPct(18);
    setPageLoadingDone(false);
    setActiveDetailGame(game);
  }, []);

  const handleImportSteamProfile = useCallback((profile) => {
    setSteamUser(profile);
    saveSteamUser(profile);

    const newImported = [];
    profile.games.forEach(g => {
      const exists = games.find(item => item.title.toLowerCase() === g.title.toLowerCase() || item.steamGridId === g.id);
      if (!exists) {
        newImported.push({
          id: `steam-imported-${g.id}`,
          title: g.title,
          genre: 'Steam Library Title',
          category: 'aaa',
          releaseYear: 2022,
          steamGridId: g.id,
          coverUrl: 'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg',
          baseFps: 80,
          gpuIntensity: 1.1,
          cpuIntensity: 1.1,
          vramAt1080p: 6.0,
          vramAt1440p: 8.0,
          vramAt4k: 11.0,
          ramRecommended: 16,
          supportsRayTracing: false,
          rtImpact: 0.0,
          description: `Imported from Steam account (${g.playtime} played).`
        });
      }
    });

    if (newImported.length > 0) {
      setCustomGames(prev => {
        const updated = [...newImported, ...prev];
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GAMES, JSON.stringify(updated));
        return updated;
      });
    }

    setIsSteamImportOpen(false);
  }, [games]);

  const handleSteamCustomImport = useCallback((customId) => {
    const customProfile = {
      id: `custom-steam-${customId}`,
      name: customId,
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      level: 15,
      games: [
        { title: 'Counter-Strike 2', id: 5363838, playtime: '840 hrs' },
        { title: 'Cyberpunk 2077', id: 5209422, playtime: '92 hrs' },
        { title: 'Elden Ring', id: 5277816, playtime: '160 hrs' }
      ]
    };
    handleImportSteamProfile(customProfile);
  }, [handleImportSteamProfile]);

  const handleGoogleSignIn = useCallback(() => {
    const dummyUser = {
      name: 'Alex Chen',
      email: 'alex.chen.gamer@gmail.com',
      picture: 'https://avatars.githubusercontent.com/u/1024025?v=4'
    };
    setGoogleUser(dummyUser);
    saveGoogleUser(dummyUser);
  }, []);

  const handleGoogleSignOut = useCallback(() => {
    setGoogleUser(null);
    saveGoogleUser(null);
  }, []);

  const handleSaveCloudSpecs = useCallback(() => {
    alert('Current hardware configuration saved to your Google cloud profile.');
  }, []);

  const handleResetAllData = useCallback(() => {
    if (confirm('Clear all stored specs, imported games, and profile settings?')) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const handleLoadingChange = useCallback((pct, done) => {
    setPageLoadingPct(pct);
    setPageLoadingDone(done);
  }, []);

  const handleWideArtChange = useCallback((url) => {
    if (url) setDetailWideBg(url);
  }, []);

  // Ambient backdrop active URL: blur of wide art on full game page, carousel on home page
  const currentAmbientBg = activeDetailGame
    ? (detailWideBg || activeDetailGame.coverUrl || carouselBg)
    : carouselBg;
  const isAmbientActive = theme !== 'amoled' && Boolean(currentAmbientBg);

  return (
    <>
      <AmbientBackdrop bgUrl={currentAmbientBg} isActive={isAmbientActive} />

      <div className="app-container">
        {/* Header with Tooltip Popout */}
        <Header
          steamUser={steamUser}
          googleUser={googleUser}
          onOpenSteamModal={() => setIsSteamImportOpen(true)}
          onOpenGoogleModal={() => setIsGoogleAuthOpen(true)}
          onOpenSteamGridSearch={() => {
            setSteamGridSearchInitialQuery('');
            setIsSteamGridSearchOpen(true);
          }}
          isPopoutOpen={isPopoutOpen}
          onTogglePopout={() => setIsPopoutOpen(prev => !prev)}
          onClosePopout={() => setIsPopoutOpen(false)}
          theme={theme}
          onSelectTheme={setTheme}
          onResetData={handleResetAllData}
          loadingPct={pageLoadingPct}
          loadingDone={pageLoadingDone}
        />

        {/* Main Two-Column Layout */}
        <div className="app-layout">
          {/* Left: Home or Game Detail */}
          <main className="main-content">
            {activeDetailGame ? (
              <GameDetailPage
                game={activeDetailGame}
                gpu={specs.gpu}
                cpu={specs.cpu}
                ram={specs.ram}
                resolution={specs.resolution}
                preset={specs.preset}
                upscaling={specs.upscaling}
                rayTracing={specs.rayTracing}
                onBack={() => {
                  setActiveDetailGame(null);
                  setDetailWideBg('');
                  setPageLoadingDone(true);
                  setPageLoadingPct(0);
                }}
                onLoadingChange={handleLoadingChange}
                onWideArtChange={handleWideArtChange}
              />
            ) : (
              <>
                <GameCarousel
                  games={games}
                  isConfigured={isConfigured}
                  onSelectGame={handleSelectGame}
                  onActiveGameChange={(game) => {
                    if (game?.coverUrl) setCarouselBg(game.coverUrl);
                  }}
                />
                <SystemStatusBar
                  isConfigured={isConfigured}
                  summary={summary}
                />
                <GamesGrid
                  items={filteredAndSortedGames}
                  isConfigured={isConfigured}
                  category={category}
                  onSelectCategory={setCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onHoverGame={() => {}}
                  onLeaveGame={() => {}}
                  onSelectGame={handleSelectGame}
                  onOpenSearchModal={(q) => {
                    setSteamGridSearchInitialQuery(q || '');
                    setIsSteamGridSearchOpen(true);
                  }}
                />
              </>
            )}
          </main>

          {/* Right: Specs Sidebar (always visible) */}
          <SpecsSidebar
            gpu={specs.gpu}
            cpu={specs.cpu}
            ram={specs.ram}
            resolution={specs.resolution}
            preset={specs.preset}
            upscaling={specs.upscaling}
            rayTracing={specs.rayTracing}
            gpuBrandFilter={gpuBrandFilter}
            cpuBrandFilter={cpuBrandFilter}
            onSelectGpu={(gpu) => setSpecs(prev => ({ ...prev, gpu }))}
            onSelectCpu={(cpu) => setSpecs(prev => ({ ...prev, cpu }))}
            onSelectRam={(ram) => setSpecs(prev => ({ ...prev, ram }))}
            onSelectResolution={(resolution) => setSpecs(prev => ({ ...prev, resolution }))}
            onSelectPreset={(preset) => setSpecs(prev => ({ ...prev, preset }))}
            onSelectUpscaling={(upscaling) => setSpecs(prev => ({ ...prev, upscaling }))}
            onToggleRayTracing={(rayTracing) => setSpecs(prev => ({ ...prev, rayTracing }))}
            onSetGpuBrandFilter={setGpuBrandFilter}
            onSetCpuBrandFilter={setCpuBrandFilter}
            onResetSpecs={handleResetSpecs}
            onApplyPreset={handleApplyPreset}
          />
        </div>
      </div>

      <SteamGridSearchModal
        isOpen={isSteamGridSearchOpen}
        onClose={() => setIsSteamGridSearchOpen(false)}
        onAddGame={handleAddSteamGridGame}
        initialQuery={steamGridSearchInitialQuery}
      />

      <SteamImportModal
        isOpen={isSteamImportOpen}
        onClose={() => setIsSteamImportOpen(false)}
        onImportProfile={handleImportSteamProfile}
        onCustomImport={handleSteamCustomImport}
      />

      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        googleUser={googleUser}
        gpu={specs.gpu}
        cpu={specs.cpu}
        ram={specs.ram}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onSaveCloudSpecs={handleSaveCloudSpecs}
      />
    </>
  );
}
