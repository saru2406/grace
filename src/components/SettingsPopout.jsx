import React, { useEffect, useRef, useState } from 'react';
import { Sliders, X, Check, Copy, RotateCcw } from 'lucide-react';

export function SettingsPopout({
  isOpen,
  onClose,
  userSettings = {},
  onUpdateSetting,
  specs = {},
  steamUser,
  profileName,
  onProfileNameChange,
  onResetData
}) {
  const popoutRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (isOpen && popoutRef.current && !popoutRef.current.contains(e.target)) {
        const toggleBtn = document.getElementById('open-settings-btn');
        if (!toggleBtn || !toggleBtn.contains(e.target)) {
          onClose();
        }
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetFps = userSettings.targetFps || 60;
  const fpsDetail = userSettings.fpsDetail || 'detailed';
  const showBottlenecks = userSettings.showBottlenecks !== false;
  const ambientBlur = userSettings.ambientBlur !== false;

  const handleCopySpecs = () => {
    const gpuName = specs?.gpu?.name || 'Unselected GPU';
    const cpuName = specs?.cpu?.name || 'Unselected CPU';
    const ramSize = specs?.ram ? `${specs.ram}GB RAM` : '16GB RAM';
    const resNode = specs?.resolution ? specs.resolution.toUpperCase() : '1440P';
    const presetNode = specs?.preset ? specs.preset.toUpperCase() : 'HIGH';

    const text = `PC Rig: ${gpuName} • ${cpuName} • ${ramSize} | Testing @ ${resNode} ${presetNode}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {});
  };

  return (
    <div id="settings-popout" className="profile-popout" ref={popoutRef}>
      <div className="popout-arrow"></div>
      <div className="popout-scroll-container">
        <div className="popout-header">
          <div className="popout-title">
            <Sliders size={15} />
            <span>Preferences &amp; Rig Options</span>
          </div>
          <button
            id="close-settings-popout"
            className="popout-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* 1. Target Framerate Baseline */}
        <div className="popout-section">
          <div className="popout-section-title-row">
            <span className="popout-section-title">Target Refresh Rate</span>
            <span className="popout-active-val">{targetFps} FPS</span>
          </div>
          <div className="popout-segmented-grid">
            {[60, 120, 144, 240].map(fps => (
              <button
                key={fps}
                type="button"
                className={`popout-seg-btn ${targetFps === fps ? 'active' : ''}`}
                onClick={() => onUpdateSetting && onUpdateSetting('targetFps', fps)}
              >
                {fps} Hz
              </button>
            ))}
          </div>
        </div>

        {/* 2. FPS Card Detail Mode */}
        <div className="popout-section">
          <div className="popout-section-title-row">
            <span className="popout-section-title">Card FPS Display</span>
          </div>
          <div className="popout-segmented-grid">
            <button
              type="button"
              className={`popout-seg-btn ${fpsDetail === 'detailed' ? 'active' : ''}`}
              onClick={() => onUpdateSetting && onUpdateSetting('fpsDetail', 'detailed')}
            >
              AVG + 1% Lows
            </button>
            <button
              type="button"
              className={`popout-seg-btn ${fpsDetail === 'simple' ? 'active' : ''}`}
              onClick={() => onUpdateSetting && onUpdateSetting('fpsDetail', 'simple')}
            >
              AVG Only
            </button>
          </div>
        </div>

        {/* 3. Hardware Bottleneck Indicators */}
        <div className="popout-section">
          <div className="popout-row-toggle" onClick={() => onUpdateSetting && onUpdateSetting('showBottlenecks', !showBottlenecks)}>
            <div className="popout-toggle-info">
              <span className="popout-toggle-label">Bottleneck Badges</span>
              <span className="popout-toggle-sub">Show GPU/CPU bound tags on game cards</span>
            </div>
            <div className={`popout-switch-track ${showBottlenecks ? 'on' : 'off'}`}>
              <span className="popout-switch-thumb" />
            </div>
          </div>
        </div>

        {/* 4. Ambient Game Blur vs AMOLED Black */}
        <div className="popout-section">
          <div className="popout-row-toggle" onClick={() => onUpdateSetting && onUpdateSetting('ambientBlur', !ambientBlur)}>
            <div className="popout-toggle-info">
              <span className="popout-toggle-label">Ambient Artwork Blur</span>
              <span className="popout-toggle-sub">{ambientBlur ? 'Dynamic game backdrop' : 'Deep AMOLED black (Battery saver)'}</span>
            </div>
            <div className={`popout-switch-track ${ambientBlur ? 'on' : 'off'}`}>
              <span className="popout-switch-thumb" />
            </div>
          </div>
        </div>

        {/* 5. Quick Export / Copy Rig */}
        <div className="popout-section">
          <button
            type="button"
            className="btn-copy-rig-specs"
            onClick={handleCopySpecs}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copied ? 'Rig Specs Copied to Clipboard!' : 'Share / Copy Active Rig Specs'}</span>
          </button>
        </div>

        {/* 6. Profile Setting */}
        <div className="popout-section">
          <div className="popout-section-title">Gamer Tag / Profile</div>
          <label className="profile-name-field" htmlFor="profile-name-input">
            <input
              id="profile-name-input"
              className="profile-name-input"
              type="text"
              value={profileName || ''}
              onChange={(e) => onProfileNameChange(e.target.value)}
              placeholder="Enter gamer tag"
              maxLength={32}
            />
          </label>
        </div>

        {/* 7. Connected Accounts */}
        <div className="popout-section">
          <div className="popout-section-title">Accounts</div>
          <div id="settings-accounts-summary" className="popout-accounts-summary">
            {steamUser ? (
              <span style={{ color: '#ffffff', fontWeight: 600 }}>
                Connected as <strong>{steamUser.name}</strong> ({steamUser.games.length} games imported)
              </span>
            ) : (
              <span style={{ color: 'var(--ctp-subtext0)' }}>Steam not connected.</span>
            )}
          </div>
        </div>

        {/* 8. Data Reset */}
        <div className="popout-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <button
            id="clear-all-data-btn"
            className="btn-clear-data"
            type="button"
            onClick={onResetData}
          >
            <RotateCcw size={12} style={{ marginRight: 5 }} />
            Reset All Saved Data
          </button>
        </div>
      </div>
    </div>
  );
}
