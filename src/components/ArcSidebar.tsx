import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Home,
  Plus,
  Settings,
  Cpu,
  X,
  Save,
  Info,
  MonitorCheck
} from 'lucide-react';
import { GPUS, CPUS, RAM_OPTIONS, SYSTEM_PRESETS } from '../data/hardware.js';
import { GpuVisual, CpuVisual, RamVisual } from './ComponentVisual.jsx';
import { SettingsPopout } from './SettingsPopout.jsx';
import { QuickBuildsPopout } from './QuickBuildsPopout.jsx';
import { DetectSpecsModal } from './DetectSpecsModal.jsx';

export function ArcSidebar({
  // Navigation & Header props
  profileName,
  onGoHome,
  onOpenSteamGridSearch,
  isPopoutOpen,
  onTogglePopout,
  onClosePopout,
  userSettings = {},
  onUpdateSetting,
  onProfileNameChange,
  onResetData,

  // Hardware & Specs props
  gpu,
  cpu,
  ram,
  resolution,
  preset,
  upscaling,
  rayTracing,
  pathTracing,
  gpuBrandFilter,
  cpuBrandFilter,
  savedRigTemplates = [],
  onSelectGpu,
  onSelectCpu,
  onSelectRam,
  onSelectResolution,
  onSelectPreset,
  onSelectUpscaling,
  onToggleRayTracing,
  onTogglePathTracing,
  onSetGpuBrandFilter,
  onSetCpuBrandFilter,
  onResetSpecs,
  onApplyPreset,
  onApplyDetectedSpecs,
  onSaveRigTemplate,
  onDeleteRigTemplate,

  // Sidebar state
  isMobileOpen = false,
  onCloseMobile
}) {
  const gpuBrands = gpuBrandFilter === 'all' ? ['NVIDIA', 'AMD', 'Intel'] : [gpuBrandFilter];
  const cpuBrands = cpuBrandFilter === 'all' ? ['AMD', 'Intel'] : [cpuBrandFilter];

  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveToast, setSaveToast] = useState('');
  const [showRtInfo, setShowRtInfo] = useState(false);
  const [showPtInfo, setShowPtInfo] = useState(false);
  const [isQuickBuildsOpen, setIsQuickBuildsOpen] = useState(false);
  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false);
  const saveInputRef = useRef(null);

  const canSave = Boolean(gpu && cpu && ram);
  const supportsRt = Boolean(gpu && gpu.rtScore > 0);
  const supportsPt = Boolean(gpu && gpu.rtScore >= 60);

  // Resizable sidebar logic
  const DEFAULT_SIDEBAR_WIDTH = 300;
  const MIN_SIDEBAR_WIDTH = 230;
  const MAX_SIDEBAR_WIDTH = 480;

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('fps_estimator_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_SIDEBAR_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startX = mouseDownEvent.clientX;
    const startW = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newW = startW + deltaX;
      newW = Math.min(Math.max(newW, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
      setSidebarWidth(newW);
    };

    const onMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('sidebar-resizing');
      setIsResizing(false);

      const finalDelta = upEvent.clientX - startX;
      let finalW = startW + finalDelta;
      if (finalW >= MIN_SIDEBAR_WIDTH && finalW <= MAX_SIDEBAR_WIDTH) {
        try {
          localStorage.setItem('fps_estimator_sidebar_width', String(Math.round(finalW)));
        } catch {}
      }
    };

    document.body.classList.add('sidebar-resizing');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const handleResetSidebarWidth = useCallback(() => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    try {
      localStorage.setItem('fps_estimator_sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  }, []);

  // Global hotkey 'Ctrl+Space' (or Ctrl+K or '/') to open Add Game
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      const isCtrlSpace = (e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ' || e.key === 'Space');
      if (
        isCtrlSpace ||
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))
      ) {
        e.preventDefault();
        if (onOpenSteamGridSearch) onOpenSteamGridSearch('');
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onOpenSteamGridSearch]);

  const defaultSuggestedName = useMemo(() => {
    if (!gpu && !cpu) return 'My Custom Rig';
    const gpuShort = gpu ? gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '').replace('Intel ', '') : '';
    const cpuShort = cpu ? (cpu.name.includes('Ryzen') ? cpu.name.match(/Ryzen \d \w+/)?.[0] || 'Ryzen' : cpu.name.match(/Core i\d-\w+/)?.[0] || 'Core') : '';
    return [gpuShort, cpuShort].filter(Boolean).join(' + ') || 'My Custom Rig';
  }, [gpu, cpu]);

  const handleStartSave = () => {
    if (!canSave) {
      setSaveToast('Select GPU, CPU, and RAM first');
      setTimeout(() => setSaveToast(''), 3000);
      return;
    }
    setSaveName(defaultSuggestedName);
    setIsSaving(true);
    setTimeout(() => {
      if (saveInputRef.current) {
        saveInputRef.current.focus();
        saveInputRef.current.select();
      }
    }, 50);
  };

  const handleConfirmSave = (e) => {
    if (e) e.preventDefault();
    const finalName = (saveName || '').trim() || defaultSuggestedName;
    if (onSaveRigTemplate) {
      onSaveRigTemplate(finalName);
      setSaveToast(`"${finalName}" saved`);
      setTimeout(() => setSaveToast(''), 2500);
    }
    setIsSaving(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="arc-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`arc-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px`, maxWidth: `${sidebarWidth}px` }}
      >
        {/* Resize Handle for Desktop */}
        <div
          className="arc-resize-handle"
          onMouseDown={startResizing}
          onDoubleClick={handleResetSidebarWidth}
          title="Drag to resize sidebar • Double-click to reset"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="arc-resize-line" />
        </div>

        {/* ============================================================
            1. ARC TOP WINDOW BAR (App Title, Home)
            ============================================================ */}
        <div className="arc-topbar">
          <div className="arc-brand" onClick={() => onGoHome && onGoHome()} style={{ cursor: onGoHome ? 'pointer' : 'default' }}>
            <span className="arc-brand-title" style={{ fontFamily: "'Chelsea Market', cursive" }}>Grace</span>
          </div>

          <div className="arc-topbar-actions">
            {onGoHome && (
              <button
                type="button"
                className="arc-topbar-btn arc-home-btn"
                onClick={onGoHome}
                title="Go to Home / Library"
                aria-label="Go to Home / Library"
              >
                <Home size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
            2. ARC COMMAND BAR (Add Game... Ctrl+Space)
            ============================================================ */}
        <div className="arc-command-section">
          <button
            id="open-steamgrid-search-btn"
            className="arc-command-bar"
            type="button"
            onClick={() => onOpenSteamGridSearch && onOpenSteamGridSearch('')}
            title="Search and add games (Ctrl+Space)"
          >
            <div className="arc-command-left">
              <Plus size={14} strokeWidth={2.2} />
              <span className="arc-command-text">Add game...</span>
            </div>
            <kbd className="arc-command-kbd">Ctrl+Space</kbd>
          </button>
        </div>

        {/* ============================================================
            3. ARC ACTIONS (Preferences & Quick Builds Popouts)
            ============================================================ */}
        <div className="arc-actions-row" style={{ flexDirection: 'column', gap: '8px' }}>
          <div className="profile-popout-wrapper" style={{ width: '100%' }}>
            <button
              id="open-settings-btn"
              className={`arc-settings-btn ${isPopoutOpen ? 'active' : ''}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickBuildsOpen(false);
                onTogglePopout();
              }}
              title="Preferences"
              aria-label="Preferences"
            >
              <Settings size={15} strokeWidth={2} />
              <span className="arc-settings-btn-text">
                Preferences
              </span>
            </button>

            <SettingsPopout
              isOpen={isPopoutOpen}
              onClose={onClosePopout}
              userSettings={userSettings}
              onUpdateSetting={onUpdateSetting}
              specs={{ gpu, cpu, ram, resolution, preset, upscaling, rayTracing }}
              profileName={profileName}
              onProfileNameChange={onProfileNameChange}
              onResetData={onResetData}
            />
          </div>

          <div className="profile-popout-wrapper" style={{ width: '100%' }}>
            <button
              id="open-quickbuilds-btn"
              className={`arc-settings-btn ${isQuickBuildsOpen ? 'active' : ''}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isPopoutOpen) onClosePopout();
                setIsQuickBuildsOpen(prev => !prev);
              }}
              title="Quick Builds"
              aria-label="Quick Builds"
            >
              <Cpu size={15} strokeWidth={2} />
              <span className="arc-settings-btn-text">
                Quick Builds
              </span>
            </button>

            <QuickBuildsPopout
              isOpen={isQuickBuildsOpen}
              onClose={() => setIsQuickBuildsOpen(false)}
              gpu={gpu}
              cpu={cpu}
              onApplyPreset={onApplyPreset}
            />
          </div>

          <div className="profile-popout-wrapper" style={{ width: '100%' }}>
            <button
              id="open-detect-specs-btn"
              className="arc-settings-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isPopoutOpen) onClosePopout();
                setIsQuickBuildsOpen(false);
                setIsDetectModalOpen(true);
              }}
              title="Detect My PC Specs"
              aria-label="Detect My PC Specs"
            >
              <MonitorCheck size={15} strokeWidth={2} />
              <span className="arc-settings-btn-text">
                Detect My PC Specs
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================
            4. RIG CONFIGURATION SECTION HEADER & RESET
            ============================================================ */}
        <div className="arc-section-divider">
          <div className="arc-section-heading">
            <Cpu size={13} strokeWidth={2} />
            <span>Rig Configuration</span>
          </div>
          <button
            id="reset-specs-btn"
            className="arc-reset-btn"
            type="button"
            onClick={onResetSpecs}
            title="Reset specs to default"
          >
            Reset
          </button>
        </div>

        {/* ============================================================
            5. SCROLLABLE HARDWARE SELECTORS & PRESETS
            ============================================================ */}
        <div className="arc-sidebar-scroll-area">

          {/* GPU Section */}
          <div className="spec-group">
            <label className="spec-label" htmlFor="gpu-select">
              <span>Graphics Card</span>
              <span id="gpu-vram-badge" className="spec-badge">{gpu ? `${gpu.vram} GB` : '—'}</span>
            </label>

            <div className="spec-row-with-preview">
              <div className="spec-inputs-col">
                <div className="brand-filter-pills" id="gpu-brand-filter">
                  {['all', 'NVIDIA', 'AMD', 'Intel'].map(brand => (
                    <button
                      key={brand}
                      type="button"
                      className={`brand-pill ${gpuBrandFilter === brand ? 'active' : ''}`}
                      data-brand={brand}
                      onClick={() => onSetGpuBrandFilter(brand)}
                    >
                      {brand === 'all' ? 'All' : brand}
                    </button>
                  ))}
                </div>

                <select
                  id="gpu-select"
                  className="spec-select"
                  value={gpu ? gpu.id : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSelectGpu(val ? (GPUS.find(g => g.id === val) || null) : null);
                  }}
                >
                  <option value="">Select GPU</option>
                  {gpuBrands.map(brand => {
                    const brandGpus = GPUS.filter(g => g.brand === brand);
                    if (brandGpus.length === 0) return null;
                    return (
                      <optgroup key={brand} label={`${brand} Graphics Cards`}>
                        {brandGpus.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.vram}GB)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div className="component-square-box" id="gpu-visual-preview">
                <GpuVisual gpu={gpu} />
              </div>
            </div>
          </div>

          {/* CPU Section */}
          <div className="spec-group">
            <label className="spec-label" htmlFor="cpu-select">
              <span>Processor</span>
              <span id="cpu-tier-badge" className="spec-badge">{cpu ? cpu.tier : '—'}</span>
            </label>

            <div className="spec-row-with-preview">
              <div className="spec-inputs-col">
                <div className="brand-filter-pills" id="cpu-brand-filter">
                  {['all', 'AMD', 'Intel'].map(brand => (
                    <button
                      key={brand}
                      type="button"
                      className={`brand-pill ${cpuBrandFilter === brand ? 'active' : ''}`}
                      data-brand={brand}
                      onClick={() => onSetCpuBrandFilter(brand)}
                    >
                      {brand === 'all' ? 'All' : brand}
                    </button>
                  ))}
                </div>

                <select
                  id="cpu-select"
                  className="spec-select"
                  value={cpu ? cpu.id : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSelectCpu(val ? (CPUS.find(c => c.id === val) || null) : null);
                  }}
                >
                  <option value="">Select CPU</option>
                  {cpuBrands.map(brand => {
                    const brandCpus = CPUS.filter(c => c.brand === brand);
                    if (brandCpus.length === 0) return null;
                    return (
                      <optgroup key={brand} label={`${brand} Processors`}>
                        {brandCpus.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div className="component-square-box" id="cpu-visual-preview">
                <CpuVisual cpu={cpu} />
              </div>
            </div>
          </div>

          {/* RAM Section */}
          <div className="spec-group">
            <label className="spec-label" htmlFor="ram-select">
              <span>Memory (RAM)</span>
              <span id="ram-status-badge" className="spec-badge">{ram ? `${ram} GB` : '—'}</span>
            </label>

            <div className="spec-row-with-preview">
              <div className="spec-inputs-col">
                <select
                  id="ram-select"
                  className="spec-select"
                  value={ram || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    onSelectRam(val);
                  }}
                >
                  <option value="">Select RAM</option>
                  {RAM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="component-square-box" id="ram-visual-preview">
                <RamVisual ram={ram} />
              </div>
            </div>
          </div>

          {/* Resolution Segmented Control */}
          <div className="spec-group">
            <label className="spec-label">Target Resolution</label>
            <div className="segmented-control" id="resolution-control">
              {['1080p', '1440p', '4k'].map(res => (
                <button
                  key={res}
                  type="button"
                  className={`segmented-btn ${resolution === res ? 'active' : ''}`}
                  data-res={res}
                  onClick={() => onSelectResolution(res)}
                >
                  {res === '4k' ? '4K UHD' : res}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Preset */}
          <div className="spec-group">
            <label className="spec-label">Graphics Preset</label>
            <div className="segmented-control" id="preset-control">
              {['low', 'medium', 'high', 'ultra'].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`segmented-btn ${preset === p ? 'active' : ''}`}
                  data-preset={p}
                  onClick={() => onSelectPreset(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Upscaling */}
          <div className="spec-group">
            <label className="spec-label" htmlFor="upscaling-select">
              <span>Upscaling (DLSS / FSR / XeSS)</span>
            </label>
            <select
              id="upscaling-select"
              className="spec-select"
              value={upscaling}
              onChange={(e) => onSelectUpscaling(e.target.value)}
            >
              <option value="none">Native (Disabled)</option>
              <option value="quality">Quality (+20% FPS)</option>
              <option value="balanced">Balanced (+35% FPS)</option>
              <option value="performance">Performance (+50% FPS)</option>
              <option value="ultra-performance">Ultra Performance (+70% FPS)</option>
            </select>
          </div>

          {/* Ray Tracing */}
          <div className={`spec-group ${showRtInfo ? 'has-rt-popup-open' : ''}`} style={showRtInfo ? { position: 'relative', zIndex: 1000 } : undefined}>
            <div className={`rt-toggle-wrapper ${!supportsRt ? 'rt-disabled-wrapper' : ''} ${showRtInfo ? 'popup-active' : ''}`} style={showRtInfo ? { position: 'relative', zIndex: 1000 } : undefined}>
              <label
                className={`switch-label ${!supportsRt ? 'disabled' : ''}`}
                onClick={(e) => {
                  if (!supportsRt) {
                    e.preventDefault();
                    setShowRtInfo(prev => !prev);
                  }
                }}
              >
                <div className="switch-title-wrap">
                  <span className="switch-title">Ray Tracing</span>
                  {!supportsRt && (
                    <div className="rt-info-container">
                      <button
                        type="button"
                        className="rt-info-btn"
                        title="This card does not support hardware ray tracing."
                        aria-label="Ray tracing unsupported."
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRtInfo(prev => !prev);
                        }}
                      >
                        <Info size={13} className="rt-info-icon" />
                      </button>
                      <div className={`rt-info-tooltip ${showRtInfo ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="rt-info-tooltip-header">
                          <Info size={12} className="rt-info-tooltip-icon" />
                          <span>No Hardware Ray Tracing</span>
                        </div>
                        <p className="rt-info-tooltip-msg">
                          {gpu
                            ? `${gpu.name} does not support hardware ray tracing.`
                            : 'Select a graphics card with ray tracing support to enable this toggle.'}
                        </p>
                        <a
                          href="https://en.wikipedia.org/wiki/Ray_tracing_(graphics)"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rt-info-tooltip-link"
                        >
                          Learn what ray tracing is on Wikipedia ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`switch-container ${!supportsRt ? 'disabled' : ''}`}>
                  <span className={`switch-state-label ${supportsRt && rayTracing ? 'active' : ''} ${!supportsRt ? 'disabled' : ''}`}>
                    {supportsRt && rayTracing ? 'ON' : 'OFF'}
                  </span>
                  <input
                    type="checkbox"
                    id="ray-tracing-toggle"
                    className="switch-input"
                    checked={supportsRt && Boolean(rayTracing)}
                    disabled={!supportsRt}
                    onChange={(e) => {
                      if (supportsRt) {
                        onToggleRayTracing(e.target.checked);
                      }
                    }}
                  />
                  <span className="switch-slider"></span>
                </div>
              </label>
            </div>
          </div>

          {/* Path Tracing */}
          <div className={`spec-group ${showPtInfo ? 'has-pt-popup-open' : ''}`} style={showPtInfo ? { position: 'relative', zIndex: 999 } : undefined}>
            <div className={`pt-toggle-wrapper ${!supportsPt ? 'pt-disabled-wrapper' : ''} ${showPtInfo ? 'popup-active' : ''}`} style={showPtInfo ? { position: 'relative', zIndex: 999 } : undefined}>
              <label
                className={`switch-label ${!supportsPt ? 'disabled' : ''}`}
                onClick={(e) => {
                  if (!supportsPt) {
                    e.preventDefault();
                    setShowPtInfo(prev => !prev);
                  }
                }}
              >
                <div className="switch-title-wrap">
                  <span className="switch-title">Path Tracing</span>
                  {!supportsPt && (
                    <div className="pt-info-container">
                      <button
                        type="button"
                        className="pt-info-btn"
                        title="This card does not support full path tracing."
                        aria-label="Path tracing unsupported."
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPtInfo(prev => !prev);
                        }}
                      >
                        <Info size={13} className="pt-info-icon" />
                      </button>
                      <div className={`pt-info-tooltip ${showPtInfo ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="pt-info-tooltip-header">
                          <Info size={12} className="pt-info-tooltip-icon" />
                          <span>No Path Tracing Support</span>
                        </div>
                        <p className="pt-info-tooltip-msg">
                          {gpu
                            ? `${gpu.name} lacks hardware path tracing acceleration (RTX 3070+ / RTX 40 series recommended).`
                            : 'Select a high-end graphics card with path tracing support to enable this toggle.'}
                        </p>
                        <a
                          href="https://en.wikipedia.org/wiki/Path_tracing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pt-info-tooltip-link"
                        >
                          Learn what path tracing is on Wikipedia ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`switch-container ${!supportsPt ? 'disabled' : ''}`}>
                  <span className={`switch-state-label ${supportsPt && pathTracing ? 'active' : ''} ${!supportsPt ? 'disabled' : ''}`}>
                    {supportsPt && pathTracing ? 'ON' : 'OFF'}
                  </span>
                  <input
                    type="checkbox"
                    id="path-tracing-toggle"
                    className="switch-input"
                    checked={supportsPt && Boolean(pathTracing)}
                    disabled={!supportsPt}
                    onChange={(e) => {
                      if (supportsPt) {
                        onTogglePathTracing(e.target.checked);
                      }
                    }}
                  />
                  <span className="switch-slider"></span>
                </div>
              </label>
            </div>
          </div>

          {/* Saved Rigs Section with Delete & Inline Save */}
          <div className="spec-group quick-builds-group saved-rigs-group">
            <label className="spec-label">
              <span>Saved Rigs</span>
              <span className="spec-badge">{savedRigTemplates.length}</span>
            </label>
            
            <div className="saved-rigs-list" id="saved-rig-templates-container">
              {savedRigTemplates.length === 0 ? (
                <div className="empty-template-note">
                  <span>No custom rigs saved yet.</span>
                  <span className="empty-note-sub">Configure specs and click Save Current Rig below to quickly reload builds.</span>
                </div>
              ) : (
                savedRigTemplates.map((template) => {
                  const isCurrent = gpu?.id === template.gpuId &&
                    cpu?.id === template.cpuId &&
                    ram === template.ram &&
                    resolution === template.resolution &&
                    preset === template.preset;

                  return (
                    <div
                      key={template.id}
                      className={`saved-rig-card ${isCurrent ? 'active' : ''}`}
                      onClick={() => onApplyPreset && onApplyPreset(template)}
                      title={`Load ${template.name} — ${template.resolution.toUpperCase()} ${template.preset.toUpperCase()}`}
                      tabIndex={0}
                      role="button"
                    >
                      <div className="saved-rig-card-body">
                        <div className="saved-rig-header-row">
                          <span className="saved-rig-card-title">{template.name}</span>
                          {isCurrent && <span className="saved-rig-active-tag">Active</span>}
                        </div>
                        <div className="saved-rig-specs-pill">
                          <span>{template.resolution.toUpperCase()} · {template.preset}</span>
                          <span>{template.ram}GB RAM</span>
                          {template.rayTracing && <span>RT</span>}
                        </div>
                      </div>

                      {onDeleteRigTemplate && (
                        <button
                          type="button"
                          className="saved-rig-remove-btn"
                          title="Delete saved rig"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRigTemplate(template.id);
                          }}
                          aria-label={`Delete ${template.name}`}
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            6. ARC SIDEBAR FOOTER (Save Rig Button / Form)
            ============================================================ */}
        <div className="arc-sidebar-footer">
          {isSaving ? (
            <form className="save-rig-inline-form" onSubmit={handleConfirmSave}>
              <input
                ref={saveInputRef}
                type="text"
                className="save-rig-input"
                value={saveName}
                placeholder="Enter rig name..."
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={28}
              />
              <div className="save-rig-btn-row">
                <button type="submit" className="btn-save-confirm">
                  Save
                </button>
                <button type="button" className="btn-save-cancel" onClick={() => setIsSaving(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className={`btn-primary btn-save-template ${!canSave ? 'btn-save-inactive' : ''}`}
              onClick={handleStartSave}
              title={canSave ? 'Save current hardware configuration' : 'Select GPU, CPU, and RAM first'}
            >
              <Save size={13} strokeWidth={2.5} />
              Save Current Rig
            </button>
          )}
          {saveToast && (
            <div className="save-rig-toast-msg">{saveToast}</div>
          )}
        </div>
      </aside>

      {isDetectModalOpen && (
        <DetectSpecsModal
          isOpen={isDetectModalOpen}
          onClose={() => setIsDetectModalOpen(false)}
          onApply={(specs) => {
            if (onApplyDetectedSpecs) {
              onApplyDetectedSpecs(specs);
            } else {
              onSelectResolution(specs.resolution);
              onSelectGpu(specs.gpu);
              onSelectCpu(specs.cpu);
              onSelectRam(specs.ram);
            }
          }}
        />
      )}
    </>
  );
}
