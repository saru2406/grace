import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GPUS, CPUS, SYSTEM_PRESETS } from './data/hardware.js';
import { DEFAULT_GAMES } from './data/games.js';
import { calculateFps } from './services/fpsEngine.js';
import { getGameGrid, getGameHero, getGameWideCover, getGameLogo } from './services/steamGrid.js';
import { getSystemPeriod, getGameTrendingScore } from './services/systemTrending.js';
import {
  saveSteamUser,
  getStoredSteamUser
} from './services/authAndSteam.js';
import { searchGamesWithContext } from './services/gameSearch.js';

import { AmbientBackdrop } from './components/AmbientBackdrop.jsx';
import { Header } from './components/Header.jsx';
import { SystemStatusBar } from './components/SystemStatusBar.jsx';
import { SpecsSidebar } from './components/SpecsSidebar.jsx';
import { GameCarousel } from './components/GameCarousel.jsx';
import { GamesGrid } from './components/GamesGrid.jsx';
import { GameDetailPage } from './components/GameDetailPage.jsx';
import { SteamGridSearchModal } from './components/SteamGridSearchModal.jsx';
import { SteamImportModal } from './components/SteamImportModal.jsx';
import { Footer } from './components/Footer.jsx';

const LOCAL_STORAGE_CUSTOM_GAMES = 'fps_estimator_custom_games';
const LOCAL_STORAGE_SPECS = 'fps_estimator_specs';
const LOCAL_STORAGE_USER_SETTINGS = 'fps_estimator_user_settings';
const LOCAL_STORAGE_PROFILE_NAME = 'fps_estimator_profile_name';
const LOCAL_STORAGE_CUSTOM_PRESETS = 'fps_estimator_saved_rig_templates';
const LOCAL_STORAGE_FAVORITES = 'fps_estimator_favorites';

const DEFAULT_USER_SETTINGS = {
  targetFps: 60,
  fpsDetail: 'detailed',
  showBottlenecks: true,
  ambientBlur: true
};

const HIDDEN_GAME_IDS = new Set();

function isMobileUserAgent() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isSmallViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export function App() {
  const [isMobile, setIsMobile] = useState(() => isMobileUserAgent() || isSmallViewport());

  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(isMobileUserAgent() || isSmallViewport());
    };

    updateMobileState();
    window.addEventListener('resize', updateMobileState);

    return () => window.removeEventListener('resize', updateMobileState);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-mobile', isMobile ? 'true' : 'false');
  }, [isMobile]);

  // Gamer & App preferences (persisted)
  const [userSettings, setUserSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_SETTINGS) || '{}');
      return { ...DEFAULT_USER_SETTINGS, ...saved };
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  });

  const handleUpdateSetting = useCallback((key, value) => {
    setUserSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(LOCAL_STORAGE_USER_SETTINGS, JSON.stringify(next));
      return next;
    });
  }, []);

  // Remember library scroll position when navigating into game details
  const libraryScrollPosRef = useRef(0);

  // Background artwork sync: driven by current active carousel slide on home, and game wide art on full game page
  const [carouselBg, setCarouselBg] = useState(
    () => DEFAULT_GAMES[0]?.heroUrl || DEFAULT_GAMES[0]?.wideCoverUrl || DEFAULT_GAMES[0]?.coverUrl || ''
  );
  const [detailWideBg, setDetailWideBg] = useState('');

  // Neutral dark mode attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

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
  const [favoriteGameIds, setFavoriteGameIds] = useState(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem(LOCAL_STORAGE_FAVORITES) || '[]');
      return Array.isArray(savedFavorites) ? savedFavorites : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify(favoriteGameIds));
  }, [favoriteGameIds]);

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

  // Authentication states
  const [steamUser, setSteamUser] = useState(getStoredSteamUser);
  const [profileName, setProfileName] = useState(() => {
    const savedProfileName = localStorage.getItem(LOCAL_STORAGE_PROFILE_NAME);
    return savedProfileName || steamUser?.name || 'Gamer';
  });
  const [savedRigTemplates, setSavedRigTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_PRESETS) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_NAME, profileName || 'Gamer');
  }, [profileName]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRESETS, JSON.stringify(savedRigTemplates));
  }, [savedRigTemplates]);

  useEffect(() => {
    if (steamUser && !localStorage.getItem(LOCAL_STORAGE_PROFILE_NAME)) {
      setProfileName(steamUser.name || 'Gamer');
    }
  }, [steamUser]);

  // Calculate FPS for all games
  const processedGames = useMemo(() => {
    return games.map(game => {
      const fpsData = calculateFps(game, specs.gpu, specs.cpu, specs.ram || 16, {
        resolution: specs.resolution,
        preset: specs.preset,
        rayTracing: specs.rayTracing,
        upscaling: specs.upscaling
      });

      const isSteamOwned = Boolean(
        game.isSteamOwned ||
        (steamUser && Array.isArray(steamUser.games) && steamUser.games.some(g =>
          (g.title && g.title.toLowerCase() === game.title.toLowerCase()) ||
          (g.id && (game.steamGridId === g.id || game.id === g.id)) ||
          (g.steamAppId && game.steamAppId === g.steamAppId)
        ))
      );

      return {
        game,
        isSteamOwned,
        ...fpsData
      };
    });
  }, [games, specs, steamUser]);

  const steamGameCount = useMemo(() => {
    if (!steamUser) return 0;
    return processedGames.filter(item => item.isSteamOwned).length;
  }, [steamUser, processedGames]);

  // Filter & Sort
  const filteredAndSortedGames = useMemo(() => {
    let filtered = processedGames;

    if (category === 'trending') {
      filtered = filtered.filter(item => {
        const score = getGameTrendingScore(item.game, systemPeriod.year, systemPeriod.month);
        return score >= 65 || item.game.releaseYear >= (systemPeriod.year - 1);
      });
    } else if (category === 'favorites') {
      filtered = filtered.filter(item => favoriteGameIds.includes(item.game.id));
    } else if (category === 'steam') {
      filtered = filtered.filter(item => item.isSteamOwned);
    } else if (category !== 'all') {
      filtered = filtered.filter(item => item.game.category === category);
    }

    if (searchQuery.trim()) {
      filtered = searchGamesWithContext(filtered, searchQuery);
      // Fallback: if category filter yielded 0 results for search query, search all games
      if (filtered.length === 0 && category !== 'all') {
        filtered = searchGamesWithContext(processedGames, searchQuery);
      }
      // When searching under default popularity/trending sort, preserve relevance+popularity ranking
      if (sortBy === 'trending') {
        return filtered;
      }
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
  }, [processedGames, category, favoriteGameIds, searchQuery, sortBy, systemPeriod]);

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
    let bottleneckColor = 'var(--ctp-text)';
    if (gpuBottlenecks >= total * 0.6) {
      bottleneckText = 'GPU Bound';
      bottleneckColor = 'var(--ctp-text)';
    } else if (cpuBottlenecks >= total * 0.4) {
      bottleneckText = 'CPU Bound';
      bottleneckColor = 'var(--ctp-text)';
    }

    let verdictText = 'Smooth (60+ FPS)';
    let verdictColor = '#ffffff';
    if (avgFps >= 120) {
      verdictText = 'High Refresh (120+ FPS)';
      verdictColor = '#ffffff';
    } else if (avgFps >= 60) {
      verdictText = 'Smooth (60+ FPS)';
      verdictColor = '#ffffff';
    } else if (avgFps >= 45) {
      verdictText = 'Playable (45-60 FPS)';
      verdictColor = 'var(--ctp-subtext1)';
    } else {
      verdictText = 'Sub-optimal (<45 FPS)';
      verdictColor = 'var(--ctp-subtext0)';
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

  const handleSaveRigTemplate = useCallback((name) => {
    const trimmedName = (name || '').trim();
    if (!trimmedName || !specs.gpu || !specs.cpu || !specs.ram) {
      return;
    }

    setSavedRigTemplates(prev => {
      const template = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        badge: 'Saved Build',
        gpuId: specs.gpu.id,
        cpuId: specs.cpu.id,
        ram: specs.ram,
        resolution: specs.resolution,
        preset: specs.preset,
        upscaling: specs.upscaling,
        rayTracing: specs.rayTracing
      };

      const next = [template, ...prev.filter(item => item.name !== trimmedName)].slice(0, 8);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRESETS, JSON.stringify(next));
      return next;
    });
  }, [specs]);

  const handleDeleteRigTemplate = useCallback((templateId) => {
    setSavedRigTemplates(prev => {
      const next = prev.filter(item => item.id !== templateId);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_PRESETS, JSON.stringify(next));
      return next;
    });
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

  const handleToggleFavorite = useCallback((gameId) => {
    setFavoriteGameIds(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      }
      return [gameId, ...prev];
    });
  }, []);

  const handleAddSteamGridGame = useCallback(async (steamItem) => {
    const exists = games.find(g => g.steamGridId === steamItem.id || g.title.toLowerCase() === steamItem.name.toLowerCase());
    if (exists) {
      libraryScrollPosRef.current = window.scrollY || document.documentElement.scrollTop || 0;
      setIsSteamGridSearchOpen(false);
      setActiveDetailGame(exists);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    let coverUrl = 'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg';
    let heroUrl = '';
    let wideCoverUrl = '';
    let logoUrl = '';
    try {
      const [grid, hero, wide, logo] = await Promise.allSettled([
        getGameGrid(steamItem.id),
        getGameHero(steamItem.id),
        getGameWideCover(steamItem.id),
        getGameLogo(steamItem.id, steamItem.types?.includes('steam') ? steamItem.steamAppId : undefined, steamItem.name)
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
      if (logo.status === 'fulfilled' && (logo.value?.url || logo.value?.thumb)) {
        logoUrl = logo.value.url || logo.value.thumb;
      }
    } catch (e) {
      console.warn('Grid/hero/logo fetch error:', e);
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
      genre: 'PC Game',
      publisher: steamItem.publisher || 'PC Publisher',
      category: 'aaa',
      releaseYear: releaseYear || 2024,
      releaseMonth: releaseDate ? releaseDate.getMonth() + 1 : undefined,
      releaseDay: releaseDate ? releaseDate.getDate() : undefined,
      releaseDate: releaseDate ? releaseDate.toISOString() : undefined,
      steamGridId: steamItem.id,
      coverUrl,
      heroUrl,
      wideCoverUrl,
      logoUrl,
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

    libraryScrollPosRef.current = window.scrollY || document.documentElement.scrollTop || 0;
    const initialWide = newGame.heroUrl || newGame.wideCoverUrl || newGame.coverUrl;
    setDetailWideBg(initialWide || '');
    setIsSteamGridSearchOpen(false);
    setActiveDetailGame(newGame);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [games]);

  const handleSelectGame = useCallback((game) => {
    // Remember current library scroll position so we can restore it upon return
    libraryScrollPosRef.current = window.scrollY || document.documentElement.scrollTop || 0;

    const initialWide =
      game.heroUrl ||
      game.wideCoverUrl ||
      (game.steamAppId
        ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_hero.jpg`
        : game.coverUrl);
    setDetailWideBg(initialWide || game.coverUrl || '');
    setActiveDetailGame(game);
    // Scroll viewport immediately to top state for the game detail view
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setActiveDetailGame(null);
    setDetailWideBg('');
    const savedY = libraryScrollPosRef.current || 0;
    // Restore exact scroll position on the next animation frame after library DOM renders
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedY, behavior: 'instant' });
    });
  }, []);

  const handleImportSteamProfile = useCallback((profile) => {
    setSteamUser(profile);
    saveSteamUser(profile);

    const newImported = [];
    if (profile && Array.isArray(profile.games)) {
      profile.games.forEach(g => {
        const exists = games.find(item =>
          item.title.toLowerCase() === g.title.toLowerCase() ||
          (g.id && item.steamGridId === g.id) ||
          (g.steamAppId && item.steamAppId === g.steamAppId)
        );
        if (!exists) {
          const steamAppId = g.steamAppId || null;
          const coverUrl = g.coverUrl || (steamAppId
            ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900_2x.jpg`
            : 'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg');
          const heroUrl = g.heroUrl || (steamAppId
            ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_hero.jpg`
            : '');
          const wideCoverUrl = g.wideCoverUrl || (steamAppId
            ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`
            : '');
          const logoUrl = g.logoUrl || (steamAppId
            ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/logo.png`
            : '');

          newImported.push({
            id: `steam-imported-${g.id || g.steamAppId || Math.random().toString(36).slice(2, 9)}`,
            title: g.title,
            genre: g.genre || 'PC Game',
            publisher: g.publisher || 'Steam Library Import',
            category: g.category || 'aaa',
            releaseYear: g.releaseYear || 2022,
            steamAppId,
            steamGridId: g.id || null,
            coverUrl,
            heroUrl,
            wideCoverUrl,
            logoUrl,
            baseFps: g.baseFps || 80,
            gpuIntensity: g.gpuIntensity || 1.1,
            cpuIntensity: g.cpuIntensity || 1.1,
            vramAt1080p: g.vramAt1080p || 6.0,
            vramAt1440p: g.vramAt1440p || 8.0,
            vramAt4k: g.vramAt4k || 11.0,
            ramRecommended: g.ramRecommended || 16,
            supportsRayTracing: Boolean(g.supportsRayTracing),
            rtImpact: g.rtImpact || 0.0,
            isSteamOwned: true,
            steamPlaytime: g.playtime || '',
            description: g.description || `Imported from Steam account (${g.playtime ? g.playtime + ' played' : 'Owned on Steam'}).`
          });
        }
      });
    }

    if (newImported.length > 0) {
      setCustomGames(prev => {
        const updated = [...newImported, ...prev];
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_GAMES, JSON.stringify(updated));
        return updated;
      });
    }

    // Auto switch category to Steam so user immediately sees their games
    setCategory('steam');
    setIsSteamImportOpen(false);
  }, [games]);

  const handleDisconnectSteam = useCallback(() => {
    setSteamUser(null);
    saveSteamUser(null);
    setCategory(prev => prev === 'steam' ? 'all' : prev);
  }, []);

  const handleResetAllData = useCallback(() => {
    if (confirm('Clear all stored specs, imported games, and profile settings?')) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const handleWideArtChange = useCallback((url) => {
    if (url) setDetailWideBg(url);
  }, []);

  // Ambient backdrop active URL: blur of wide art on full game page, carousel on home page
  const currentAmbientBg = activeDetailGame
    ? (detailWideBg || activeDetailGame.coverUrl || carouselBg)
    : carouselBg;
  const isAmbientActive = Boolean(userSettings.ambientBlur && currentAmbientBg);

  return (
    <>
      <AmbientBackdrop bgUrl={currentAmbientBg} isActive={isAmbientActive} />

      <div className={`app-container ${isMobile ? 'mobile-device' : ''}`}>
        {/* Header with Gamer Settings Popout */}
        <Header
          steamUser={steamUser}
          profileName={profileName}
          onOpenSteamModal={() => setIsSteamImportOpen(true)}
          onOpenSteamGridSearch={(q) => {
            setSteamGridSearchInitialQuery(q || '');
            setIsSteamGridSearchOpen(true);
          }}
          isPopoutOpen={isPopoutOpen}
          onTogglePopout={() => setIsPopoutOpen(prev => !prev)}
          onClosePopout={() => setIsPopoutOpen(false)}
          onProfileNameChange={setProfileName}
          onResetData={handleResetAllData}
          userSettings={userSettings}
          onUpdateSetting={handleUpdateSetting}
          specs={specs}
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
                isFavorite={favoriteGameIds.includes(activeDetailGame.id)}
                onToggleFavorite={() => handleToggleFavorite(activeDetailGame.id)}
                onBack={handleBackToLibrary}
                onWideArtChange={handleWideArtChange}
              />
            ) : (
              <>
                <GameCarousel
                  games={games}
                  isConfigured={isConfigured}
                  specs={specs}
                  userSettings={userSettings}
                  onSelectGame={handleSelectGame}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteIds={favoriteGameIds}
                  onActiveGameChange={(game, artUrl) => {
                    const bg = artUrl || game?.heroUrl || game?.wideCoverUrl || game?.coverUrl;
                    if (bg) setCarouselBg(bg);
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
                  onToggleFavorite={handleToggleFavorite}
                  favoriteIds={favoriteGameIds}
                  onOpenSearchModal={(q) => {
                    setSteamGridSearchInitialQuery(q || '');
                    setIsSteamGridSearchOpen(true);
                  }}
                  userSettings={userSettings}
                  steamUser={steamUser}
                  steamGameCount={steamGameCount}
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
            savedRigTemplates={savedRigTemplates}
            onSaveRigTemplate={handleSaveRigTemplate}
            onDeleteRigTemplate={handleDeleteRigTemplate}
          />
        </div>

        {/* Global Footer with Copyright Notice */}
        <Footer />
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
        currentSteamUser={steamUser}
        onDisconnectSteam={handleDisconnectSteam}
      />

    </>
  );
}
