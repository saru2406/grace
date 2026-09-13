import React from 'react';
import { GPUS, CPUS, RAM_OPTIONS, SYSTEM_PRESETS } from '../data/hardware.js';
import { GpuVisual, CpuVisual, RamVisual } from './ComponentVisual.jsx';

export function SpecsSidebar({
  gpu,
  cpu,
  ram,
  resolution,
  preset,
  upscaling,
  rayTracing,
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
  onSetGpuBrandFilter,
  onSetCpuBrandFilter,
  onResetSpecs,
  onApplyPreset,
  onSaveRigTemplate,
  onDeleteRigTemplate
}) {
  const gpuBrands = gpuBrandFilter === 'all' ? ['NVIDIA', 'AMD', 'Intel'] : [gpuBrandFilter];
  const cpuBrands = cpuBrandFilter === 'all' ? ['AMD', 'Intel'] : [cpuBrandFilter];

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveToast, setSaveToast] = React.useState('');
  const saveInputRef = React.useRef(null);

  const canSave = Boolean(gpu && cpu && ram);

  const defaultSuggestedName = React.useMemo(() => {
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
    <aside className="specs-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="15" x2="23" y2="15"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="15" x2="4" y2="15"></line>
          </svg>
          Rig Configuration
        </h2>
        <button id="reset-specs-btn" className="btn-reset-specs" type="button" onClick={onResetSpecs}>
          Reset
        </button>
      </div>

      {/* Quick Builds / Presets Section */}
      <div className="spec-group quick-builds-group">
        <label className="spec-label">
          <span>Quick Builds</span>
          <span className="spec-badge">Presets</span>
        </label>
        <div className="quick-builds-grid" id="quick-builds-container">
          {SYSTEM_PRESETS.map((p) => {
            const isSelected = gpu?.id === p.gpuId && cpu?.id === p.cpuId;
            return (
              <button
                key={p.id}
                type="button"
                className={`preset-chip ${isSelected ? 'active' : ''}`}
                title={`${p.badge} — ${p.gpuId.toUpperCase()} + ${p.cpuId.toUpperCase()}`}
                onClick={() => onApplyPreset && onApplyPreset(p)}
              >
                <span>{p.name}</span>
              </button>
            );
          })}
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
              <span className="empty-note-sub">Configure specs below and click Save Rig at the bottom to quickly reload builds.</span>
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
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

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
      <div className="spec-group">
        <label className="switch-label" htmlFor="ray-tracing-toggle">
          <div className="switch-title-wrap">
            <span className="switch-title">Ray Tracing</span>
            {gpu && (
              <span className={`rt-capability-badge ${gpu.rtScore > 0 ? 'rt-ready' : 'rt-unsupported'}`}>
                {gpu.rtScore > 0 ? 'RT Capable' : 'No Hardware RT'}
              </span>
            )}
          </div>
          <div className="switch-container">
            <span className={`switch-state-label ${rayTracing ? 'active' : ''}`}>
              {rayTracing ? 'ON' : 'OFF'}
            </span>
            <input
              type="checkbox"
              id="ray-tracing-toggle"
              className="switch-input"
              checked={rayTracing}
              onChange={(e) => onToggleRayTracing(e.target.checked)}
            />
            <span className="switch-slider"></span>
          </div>
        </label>
      </div>

      {/* Save Rig — pinned at bottom of sidebar */}
      <div className="specs-sidebar-footer">
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Current Rig
          </button>
        )}
        {saveToast && (
          <div className="save-rig-toast-msg">{saveToast}</div>
        )}
      </div>
    </aside>
  );
}
