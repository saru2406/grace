import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import { flushSync } from 'react-dom';
import { PanelLeft, Plus, Search, Cpu } from 'lucide-react';
import { GPUS, CPUS, SYSTEM_PRESETS } from './data/hardware.js';
import { DEFAULT_GAMES } from './data/games.js';
import { calculateFps } from './services/fpsEngine.js';
import { getGameGrid, getGameHero, getGameWideCover, getGameLogo } from './services/steamGrid.js';
import { getSystemPeriod, getGameTrendingScore } from './services/systemTrending.js';
import { searchGamesWithContext } from './services/gameSearch.js';

import { AmbientBackdrop } from './components/AmbientBackdrop.jsx';
import { ArcSidebar } from './components/ArcSidebar.jsx';
import { SystemStatusBar } from './components/SystemStatusBar.jsx';
import { GameCarousel } from './components/GameCarousel.jsx';
import { GamesGrid } from './components/GamesGrid.jsx';
import { Footer } from './components/Footer.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { GameDetailPageSkeleton } from './components/SkeletonLoader.jsx';
import { MobileBottomNav } from './components/MobileBottomNav.jsx';

// Code-split heavy modals and detail page for instant initial load
const GameDetailPage = React.lazy(() => import('./components/GameDetailPage.jsx').then(m => ({ default: m.GameDetailPage })));
const SteamGridSearchModal = React.lazy(() => import('./components/SteamGridSearchModal.jsx').then(m => ({ default: m.SteamGridSearchModal })));

const LOCAL_STORAGE_CUSTOM_GAMES = 'fps_estimator_custom_games';
const LOCAL_STORAGE_DELETED_GAMES = 'fps_estimator_deleted_games';
const LOCAL_STORAGE_SPECS = 'fps_estimator_specs';
const LOCAL_STORAGE_USER_SETTINGS = 'fps_estimator_user_settings';
const LOCAL_STORAGE_PROFILE_NAME = 'fps_estimator_profile_name';
const LOCAL_STORAGE_CUSTOM_PRESETS = 'fps_estimator_saved_rig_templates';
const LOCAL_STORAGE_FAVORITES = 'fps_estimator_favorites';

const DEFAULT_USER_SETTINGS = {
  targetFps: 60,
  fpsDetail: 'detailed',
  showBottlenecks: true,
  ambientBlur: true,
  rounding: 'rectangle'
};

function isMobileUserAgent() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isSmallViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

export function App() {
  const [appLoading, setAppLoading] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => isMobileUserAgent() || isSmallViewport());

  useEffect(() => {
    let isCancelled = false;
    let removeTimer: number | undefined;

    const startFadeOut = () => {
      if (isCancelled) return;
      setIsSplashFading(true);
      removeTimer = window.setTimeout(() => {
        if (!isCancelled) setAppLoading(false);
      }, 1200); // Wait for 1.2s fade out animation
    };

    const fontPromise = (typeof document !== 'undefined' && document.fonts)
      ? document.fonts.ready
      : Promise.resolve();

    Promise.all([
      fontPromise,
      new Promise(resolve => setTimeout(resolve, 1000))
    ]).then(() => {
      startFadeOut();
    });

    return () => {
      isCancelled = true;
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    const createRipple = (event: MouseEvent) => {
      const el = (event.target as HTMLElement).closest('button, .preset-chip, .game-card, .tab-btn, .segmented-btn, .saved-rig-card, .btn-primary, .btn-secondary') as HTMLElement;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const size = Math.max(el.clientWidth, el.clientHeight) * 2.5;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      el.style.setProperty('--ripple-x', `${x}px`);
      el.style.setProperty('--ripple-y', `${y}px`);
      el.style.setProperty('--ripple-size', `${size}px`);

      if (el.dataset.rippleTimeout) {
        clearTimeout(Number(el.dataset.rippleTimeout));
      }

      let origPosition = el.dataset.origPosition;
      if (!origPosition) {
        origPosition = window.getComputedStyle(el).position;
        el.dataset.origPosition = origPosition;
      }

      if (origPosition === 'static') {
        el.style.position = 'relative';
      }

      el.classList.remove('ripple-active');
      void el.offsetWidth; // Force reflow
      el.classList.add('ripple-active');
      
      // Cleanup class after animation finishes
      const timeoutId = window.setTimeout(() => {
        el.classList.remove('ripple-active');
        if (el.dataset.origPosition === 'static') {
          el.style.position = '';
        }
        delete el.dataset.rippleTimeout;
        delete el.dataset.origPosition;
      }, 600);
      
      el.dataset.rippleTimeout = timeoutId.toString();
    };

    document.addEventListener('mousedown', createRipple);
    return () => document.removeEventListener('mousedown', createRipple);
  }, []);

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

  // Arc Sidebar mobile drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickBuildsOpen, setIsQuickBuildsOpen] = useState(false);
  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false);

  // Background artwork sync: driven by current active carousel slide on home, and game wide art on full game page
  const [carouselBg, setCarouselBg] = useState(
    () => DEFAULT_GAMES[0]?.heroUrl || DEFAULT_GAMES[0]?.wideCoverUrl || DEFAULT_GAMES[0]?.coverUrl || ''
  );
  const [detailWideBg, setDetailWideBg] = useState('');
  const [activeDetailGame, setActiveDetailGame] = useState(null);
  const [transitioningGameId, setTransitioningGameId] = useState(null);


  useEffect(() => {
    if (userSettings.theme === 'catppuccin-mocha' && !activeDetailGame) {
      document.documentElement.setAttribute('data-theme', 'catppuccin-mocha');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    document.documentElement.setAttribute('data-rounding', userSettings.rounding || 'rectangle');
  }, [userSettings.theme, userSettings.rounding, activeDetailGame]);


  // Hardware Specs State
  const [specs, setSpecs] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SPECS) || '{}');
    const gpu = saved.gpuId ? (GPUS.find(g => g.id === saved.gpuId) || null) : null;
    const canRt = Boolean(gpu && gpu.rtScore > 0);
    const canPt = Boolean(gpu && gpu.rtScore >= 60);
    return {
      gpu,
      cpu: saved.cpuId ? (CPUS.find(c => c.id === saved.cpuId) || null) : null,
      ram: saved.ram || null,
      resolution: saved.resolution || '1440p',
      preset: saved.preset || 'high',
      upscaling: saved.upscaling || 'quality',
      rayTracing: canRt ? (saved.rayTracing !== undefined ? saved.rayTracing : false) : false,
      pathTracing: canPt ? (saved.pathTracing !== undefined ? saved.pathTracing : false) : false
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
      rayTracing: specs.rayTracing,
      pathTracing: specs.pathTracing
    }));
  }, [specs]);

  // Brand filter states
  const [gpuBrandFilter, setGpuBrandFilter] = useState('all');
  const [cpuBrandFilter, setCpuBrandFilter] = useState('all');

  // Games Library state
  const [customGames, setCustomGames] = useState(() => {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_GAMES) || '[]');
  });
  const [deletedGameIds, setDeletedGameIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DELETED_GAMES) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_DELETED_GAMES, JSON.stringify(deletedGameIds));
  }, [deletedGameIds]);

  const games = useMemo(() => {
    const deletedSet = new Set(deletedGameIds);
    const visibleDefaultGames = DEFAULT_GAMES.filter(game => !deletedSet.has(game.id));
    const visibleCustomGames = customGames.filter(game => !deletedSet.has(game.id));
    return [...visibleCustomGames, ...visibleDefaultGames];
  }, [customGames, deletedGameIds]);

  const handleDeleteGame = useCallback((gameId) => {
    setCustomGames(prev => {
      const updated = prev.filter(g => g.id !== gameId);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_GAMES, JSON.stringify(updated));
      return updated;
    });
    setDeletedGameIds(prev => {
      if (prev.includes(gameId)) return prev;
      return [...prev, gameId];
    });
    setFavoriteGameIds(prev => prev.filter(id => id !== gameId));
    setActiveDetailGame(prev => (prev && prev.id === gameId ? null : prev));
  }, []);

  // System Date / Recency period
  const systemPeriod = useMemo(() => getSystemPeriod(), []);

  // Library Controls
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState('trending');

  // Modals & Popout
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const [isSteamGridSearchOpen, setIsSteamGridSearchOpen] = useState(false);
  const [steamGridSearchInitialQuery, setSteamGridSearchInitialQuery] = useState('');

  // Profile & Rig Templates
  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem(LOCAL_STORAGE_PROFILE_NAME) || 'Gamer';
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

  // Calculate FPS for all games
  const processedGames = useMemo(() => {
    return games.map(game => {
      const fpsData = calculateFps(game, specs.gpu, specs.cpu, specs.ram || 16, {
        resolution: specs.resolution,
        preset: specs.preset,
        rayTracing: specs.rayTracing,
        pathTracing: specs.pathTracing,
        upscaling: specs.upscaling
      });

      return {
        game,
        isSteamOwned: Boolean(game.isSteamOwned),
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
    } else if (category === 'favorites') {
      filtered = filtered.filter(item => favoriteGameIds.includes(item.game.id));
    } else if (category === 'recently-added') {
      filtered = filtered.filter(item => item.game.id.startsWith('custom-') || item.game.isCustom);
    } else if (category === 'path-tracing') {
      filtered = filtered.filter(item => {
        const tags = Array.isArray(item.game.tags) ? item.game.tags : [];
        const tagText = tags.join(' ').toLowerCase();
        return Boolean(
          item.game.supportsPathTracing ||
          item.game.category === 'rt' ||
          tagText.includes('path tracing') ||
          tagText.includes('path-tracing')
        );
      });
    } else if (category !== 'all') {
      filtered = filtered.filter(item => item.game.category === category);
    }

    if (deferredSearchQuery.trim()) {
      filtered = searchGamesWithContext(filtered, deferredSearchQuery);
      // Fallback: if category filter yielded 0 results for search query, search all games
      if (filtered.length === 0 && category !== 'all') {
        filtered = searchGamesWithContext(processedGames, deferredSearchQuery);
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
  }, [processedGames, category, favoriteGameIds, deferredSearchQuery, sortBy, systemPeriod]);

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
    const canRt = Boolean(gpu && gpu.rtScore > 0);
    setSpecs({
      gpu,
      cpu,
      ram: preset.ram,
      resolution: preset.resolution,
      preset: preset.preset,
      upscaling: preset.upscaling,
      rayTracing: canRt ? Boolean(preset.rayTracing) : false
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

    const sid = steamItem.steamAppId || (typeof steamItem.id === 'number' ? steamItem.id : null);
    let coverUrl = steamItem.thumb || steamItem.url || (sid ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${sid}/library_600x900.jpg` : 'https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg');
    let heroUrl = steamItem.heroUrl || (sid ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${sid}/library_hero.jpg` : '');
    let wideCoverUrl = steamItem.wideCoverUrl || (sid ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${sid}/header.jpg` : '');
    let logoUrl = steamItem.logoUrl || '';
    try {
      const [grid, hero, wide, logo] = await Promise.allSettled([
        getGameGrid(steamItem.id, sid),
        getGameHero(steamItem.id, sid),
        getGameWideCover(steamItem.id, sid),
        getGameLogo(steamItem.id, sid, steamItem.name)
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
      id: `custom-${steamItem.id || ''}-${Date.now()}`,
      title: steamItem.name,
      genre: 'PC Game',
      publisher: steamItem.publisher || 'PC Publisher',
      category: 'aaa',
      releaseYear: releaseYear || 2024,
      releaseMonth: releaseDate ? releaseDate.getMonth() + 1 : undefined,
      releaseDay: releaseDate ? releaseDate.getDate() : undefined,
      releaseDate: releaseDate ? releaseDate.toISOString() : undefined,
      addedAt: Date.now(),
      isCustom: true,
      steamGridId: steamItem.id,
      steamAppId: sid,
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
      description: 'Added directly from game catalog search.'
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

    if (document.startViewTransition) {
      flushSync(() => {
        setTransitioningGameId(game.id);
      });
      document.startViewTransition(() => {
        flushSync(() => {
          setDetailWideBg(initialWide || game.coverUrl || '');
          setActiveDetailGame(game);
        });
        window.scrollTo({ top: 0, behavior: 'instant' });
      }).finished.finally(() => {
        setTransitioningGameId(null);
      });
    } else {
      setDetailWideBg(initialWide || game.coverUrl || '');
      setActiveDetailGame(game);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  const handleBackToLibrary = useCallback(() => {
    const savedY = libraryScrollPosRef.current || 0;
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setActiveDetailGame(null);
          setDetailWideBg('');
        });
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' });
        });
      });
    } else {
      setActiveDetailGame(null);
      setDetailWideBg('');
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      });
    }
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

  const activeMobileTab = isMobileSidebarOpen
    ? 'rig'
    : isQuickBuildsOpen
    ? 'builds'
    : isPopoutOpen
    ? 'settings'
    : isSteamGridSearchOpen
    ? 'search'
    : 'library';

  const handleSelectMobileTab = useCallback((tab) => {
    if (tab === 'library') {
      if (activeDetailGame) handleBackToLibrary();
      setIsMobileSidebarOpen(false);
      setIsQuickBuildsOpen(false);
      setIsPopoutOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'rig') {
      setIsQuickBuildsOpen(false);
      setIsPopoutOpen(false);
      setIsMobileSidebarOpen(prev => !prev);
    } else if (tab === 'builds') {
      setIsMobileSidebarOpen(false);
      setIsPopoutOpen(false);
      setIsQuickBuildsOpen(prev => !prev);
    } else if (tab === 'search') {
      setIsMobileSidebarOpen(false);
      setIsQuickBuildsOpen(false);
      setIsPopoutOpen(false);
      setSteamGridSearchInitialQuery('');
      setIsSteamGridSearchOpen(true);
    } else if (tab === 'settings') {
      setIsMobileSidebarOpen(false);
      setIsQuickBuildsOpen(false);
      setIsPopoutOpen(prev => !prev);
    }
  }, [activeDetailGame, handleBackToLibrary]);

  return (
    <>
      {appLoading && <SplashScreen isFadingOut={isSplashFading} />}
      <AmbientBackdrop bgUrl={currentAmbientBg} isActive={isAmbientActive} />

      <div className={`app-shell ${isMobile ? 'mobile-device' : ''}`}>
        {/* Arc Unified Left Sidebar */}
        <ArcSidebar
          profileName={profileName}
          onGoHome={handleBackToLibrary}
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
          gpu={specs.gpu}
          cpu={specs.cpu}
          ram={specs.ram}
          resolution={specs.resolution}
          preset={specs.preset}
          upscaling={specs.upscaling}
          rayTracing={specs.rayTracing}
          pathTracing={specs.pathTracing}
          gpuBrandFilter={gpuBrandFilter}
          cpuBrandFilter={cpuBrandFilter}
          onSelectGpu={(gpu) => setSpecs(prev => ({
            ...prev,
            gpu,
            rayTracing: (gpu && gpu.rtScore > 0) ? prev.rayTracing : false,
            pathTracing: (gpu && gpu.rtScore >= 60) ? prev.pathTracing : false
          }))}
          onSelectCpu={(cpu) => setSpecs(prev => ({ ...prev, cpu }))}
          onSelectRam={(ram) => setSpecs(prev => ({ ...prev, ram }))}
          onSelectResolution={(resolution) => setSpecs(prev => ({ ...prev, resolution }))}
          onSelectPreset={(preset) => setSpecs(prev => ({ ...prev, preset }))}
          onSelectUpscaling={(upscaling) => setSpecs(prev => ({ ...prev, upscaling }))}
          onToggleRayTracing={(rayTracing) => setSpecs(prev => {
            if (!prev.gpu || prev.gpu.rtScore <= 0) {
              return { ...prev, rayTracing: false };
            }
            return { ...prev, rayTracing };
          })}
          onTogglePathTracing={(pathTracing) => setSpecs(prev => {
            if (!prev.gpu || prev.gpu.rtScore < 60) {
              return { ...prev, pathTracing: false };
            }
            return { ...prev, pathTracing };
          })}
          onSetGpuBrandFilter={setGpuBrandFilter}
          onSetCpuBrandFilter={setCpuBrandFilter}
          onResetSpecs={handleResetSpecs}
          onApplyPreset={handleApplyPreset}
          onApplyDetectedSpecs={(detected) => {
            setSpecs(prev => ({
              ...prev,
              resolution: detected.resolution,
              gpu: detected.gpu,
              cpu: detected.cpu,
              ram: detected.ram,
              rayTracing: (detected.gpu && detected.gpu.rtScore > 0) ? prev.rayTracing : false,
              pathTracing: (detected.gpu && detected.gpu.rtScore >= 60) ? prev.pathTracing : false
            }));
            if (detected.gpu) setGpuBrandFilter('all');
            if (detected.cpu) setCpuBrandFilter('all');
          }}
          savedRigTemplates={savedRigTemplates}
          onSaveRigTemplate={handleSaveRigTemplate}
          onDeleteRigTemplate={handleDeleteRigTemplate}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isQuickBuildsOpen={isQuickBuildsOpen}
          onOpenQuickBuilds={() => setIsQuickBuildsOpen(true)}
          onCloseQuickBuilds={() => setIsQuickBuildsOpen(false)}
          isDetectModalOpen={isDetectModalOpen}
          onOpenDetectModal={() => setIsDetectModalOpen(true)}
          onCloseDetectModal={() => setIsDetectModalOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="main-viewport">
          {/* Mobile floating top app bar */}
          <div className="arc-mobile-header">
            <button
              type="button"
              className="arc-mobile-toggle-btn"
              onClick={() => {
                setIsQuickBuildsOpen(false);
                setIsPopoutOpen(false);
                setIsMobileSidebarOpen(true);
              }}
              aria-label="Open hardware rig configuration"
            >
              <Cpu size={15} />
              <div className="arc-mobile-rig-summary">
                <span className="arc-mobile-rig-title">
                  {specs.gpu
                    ? specs.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '').replace('Intel Arc ', '')
                    : 'Setup Rig'}
                </span>
                <span className="arc-mobile-rig-res">{specs.resolution.toUpperCase()}</span>
              </div>
            </button>

            <div
              className="arc-mobile-brand-wrap"
              onClick={() => {
                if (activeDetailGame) handleBackToLibrary();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span className="arc-mobile-brand" style={{ fontFamily: "'Chelsea Market', cursive" }}>Grace</span>
              <span className="arc-mobile-badge-chip">FPS</span>
            </div>

            <div className="arc-mobile-actions">
              <button
                type="button"
                className="arc-mobile-action-btn"
                onClick={() => {
                  setSteamGridSearchInitialQuery('');
                  setIsSteamGridSearchOpen(true);
                }}
                title="Search games"
                aria-label="Search games"
              >
                <Search size={15} />
              </button>
              <button
                type="button"
                className="arc-mobile-action-btn arc-mobile-action-btn-primary"
                onClick={() => {
                  setSteamGridSearchInitialQuery('');
                  setIsSteamGridSearchOpen(true);
                }}
                title="Add game"
                aria-label="Add game"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <main className="main-content">
            {activeDetailGame ? (
              <React.Suspense fallback={<GameDetailPageSkeleton />}>
                <GameDetailPage
                  game={activeDetailGame}
                  gpu={specs.gpu}
                  cpu={specs.cpu}
                  ram={specs.ram}
                  resolution={specs.resolution}
                  preset={specs.preset}
                  upscaling={specs.upscaling}
                  rayTracing={specs.rayTracing}
                  pathTracing={specs.pathTracing}
                  isFavorite={favoriteGameIds.includes(activeDetailGame.id)}
                  onToggleFavorite={() => handleToggleFavorite(activeDetailGame.id)}
                  onDeleteGame={handleDeleteGame}
                  onBack={handleBackToLibrary}
                  onWideArtChange={handleWideArtChange}
                  onSelectResolution={(res) => setSpecs(prev => ({ ...prev, resolution: res }))}
                />
              </React.Suspense>
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
                  transitioningGameId={transitioningGameId}
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
                  onDeleteGame={handleDeleteGame}
                  transitioningGameId={transitioningGameId}
                  favoriteIds={favoriteGameIds}
                  onOpenSearchModal={(q) => {
                    setSteamGridSearchInitialQuery(q || '');
                    setIsSteamGridSearchOpen(true);
                  }}
                  userSettings={userSettings}
                  customGameCount={customGames.length}
                />
              </>
            )}
          </main>

          {/* Global Footer */}
          <Footer />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onSelectTab={handleSelectMobileTab}
        isRigConfigured={isConfigured}
      />

      {isSteamGridSearchOpen && (
        <React.Suspense fallback={null}>
          <SteamGridSearchModal
            isOpen={isSteamGridSearchOpen}
            onClose={() => setIsSteamGridSearchOpen(false)}
            onAddGame={handleAddSteamGridGame}
            initialQuery={steamGridSearchInitialQuery}
          />
        </React.Suspense>
      )}

    </>
  );
}
