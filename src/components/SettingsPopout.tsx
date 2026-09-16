import React, { useEffect, useRef, useState } from 'react';
import { Sliders, X, RotateCcw, ArrowRight } from 'lucide-react';
import { runAllApiDiagnostics } from '../services/apiDiagnostics.js';

export function SettingsPopout({
  isOpen,
  onClose,
  userSettings = {},
  onUpdateSetting,
  profileName,
  onProfileNameChange,
  onResetData
}) {
  const popoutRef = useRef(null);
  const [apiResults, setApiResults] = useState([]);
  const [isCheckingApis, setIsCheckingApis] = useState(false);

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

  const fpsDetail = userSettings.fpsDetail || 'detailed';
  const showBottlenecks = userSettings.showBottlenecks !== false;
  const ambientBlur = userSettings.ambientBlur !== false;

  const handleCheckApiStatus = async () => {
    setIsCheckingApis(true);
    try {
      const results = await runAllApiDiagnostics();
      setApiResults(results || []);
    } catch {
      setApiResults([]);
    } finally {
      setIsCheckingApis(false);
    }
  };

  return (
    <div id="settings-popout" className="profile-popout settings-popout-compact" ref={popoutRef}>
      <div className="popout-arrow"></div>
      <div className="popout-scroll-container">
        <div className="popout-header">
          <div className="popout-header-main">
            <div className="popout-header-icon">
              <Sliders size={14} />
            </div>
            <div className="popout-header-text">
              <div className="popout-title">Preferences</div>
            </div>
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

        <div className="popout-section">
          <div className="popout-section-header">
            <span className="popout-section-title">Quick settings</span>
          </div>

          <div className="mini-grid">
            <div className="mini-grid-row">
              <span className="mini-grid-label">Card FPS display</span>
              <div className="popout-segmented-grid two-up">
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

            <div className="mini-grid-row">
              <span className="mini-grid-label">Homepage theme</span>
              <div className="popout-segmented-grid two-up">
                <button
                  type="button"
                  className={`popout-seg-btn ${userSettings.theme !== 'catppuccin-mocha' ? 'active' : ''}`}
                  onClick={() => onUpdateSetting && onUpdateSetting('theme', 'default')}
                >
                  Default
                </button>
                <button
                  type="button"
                  className={`popout-seg-btn ${userSettings.theme === 'catppuccin-mocha' ? 'active' : ''}`}
                  onClick={() => onUpdateSetting && onUpdateSetting('theme', 'catppuccin-mocha')}
                >
                  Mocha
                </button>
              </div>
            </div>

            <div className="mini-grid-row">
              <span className="mini-grid-label">UI Rounding</span>
              <div className="popout-segmented-grid two-up">
                <button
                  type="button"
                  className={`popout-seg-btn ${userSettings.rounding !== 'pill' ? 'active' : ''}`}
                  onClick={() => onUpdateSetting && onUpdateSetting('rounding', 'rectangle')}
                >
                  Rectangle
                </button>
                <button
                  type="button"
                  className={`popout-seg-btn ${userSettings.rounding === 'pill' ? 'active' : ''}`}
                  onClick={() => onUpdateSetting && onUpdateSetting('rounding', 'pill')}
                >
                  Pill
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="popout-section compact-toggles">
          <div className="mini-toggle-row" onClick={() => onUpdateSetting && onUpdateSetting('showBottlenecks', !showBottlenecks)}>
            <div className="popout-toggle-info">
              <span className="popout-toggle-label">Bottleneck badges</span>
              <span className="popout-toggle-sub">GPU/CPU bound tags</span>
            </div>
            <div className={`popout-switch-track ${showBottlenecks ? 'on' : 'off'}`}>
              <span className="popout-switch-thumb" />
            </div>
          </div>

          <div className="mini-toggle-row" onClick={() => onUpdateSetting && onUpdateSetting('ambientBlur', !ambientBlur)}>
            <div className="popout-toggle-info">
              <span className="popout-toggle-label">Ambient blur</span>
              <span className="popout-toggle-sub">{ambientBlur ? 'Dynamic backdrop' : 'AMOLED black'}</span>
            </div>
            <div className={`popout-switch-track ${ambientBlur ? 'on' : 'off'}`}>
              <span className="popout-switch-thumb" />
            </div>
          </div>
        </div>

        <div className="popout-section compact-form">
          <span className="popout-section-title">Profile</span>
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

        <div className="popout-section compact-footer">
          <div className="mini-grid-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <button
              id="check-api-status-btn"
              className="btn-clear-data"
              type="button"
              onClick={handleCheckApiStatus}
              disabled={isCheckingApis}
              style={{ justifyContent: 'center' }}
            >
              <ArrowRight size={12} />
              <span>{isCheckingApis ? 'Checking API status...' : 'Test API status'}</span>
            </button>

            {apiResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {apiResults.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{result.name}</span>
                    <span
                      style={{
                        color: result.ok ? '#7ef0b1' : '#ffb4b4',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {result.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            id="clear-all-data-btn"
            className="btn-clear-data"
            type="button"
            onClick={onResetData}
          >
            <RotateCcw size={12} />
            <span>Reset saved data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
