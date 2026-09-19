import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, ArrowRight, GripHorizontal } from 'lucide-react';
import { runAllApiDiagnostics } from '../services/apiDiagnostics.js';
import { useDraggable } from '../hooks/useDraggable';

interface SettingsPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings?: any;
  onUpdateSetting?: (key: string, value: any) => void;
  profileName?: string;
  onProfileNameChange?: (val: string) => void;
  onResetData?: () => void;
  specs?: any;
}

export function SettingsPopout({
  isOpen,
  onClose,
  userSettings = {},
  onUpdateSetting,
  profileName,
  onProfileNameChange,
  onResetData
}: SettingsPopoutProps) {
  const [apiResults, setApiResults] = useState<any[]>([]);
  const [isCheckingApis, setIsCheckingApis] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDraggable(dialogRef, '.modal-drag-handle', isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fpsDetail = userSettings?.fpsDetail || 'detailed';
  const showBottlenecks = userSettings?.showBottlenecks !== false;
  const ambientBlur = userSettings?.ambientBlur !== false;

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

  return createPortal(
    <div className="detect-modal-backdrop" onClick={onClose}>
      <div
        className="detect-modal-dialog settings-popout-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="detect-modal-dialog-inner">
          {/* Modal Header */}
          <div className="detect-modal-header">
            <div className="detect-header-title-group">
              <h2 className="detect-modal-title">Preferences</h2>
              <p className="detect-modal-subtitle">Customize benchmark display and interface settings</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="modal-drag-handle" title="Drag to move" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}>
                <GripHorizontal size={16} />
              </div>
              <button
                id="close-settings-popout"
                className="detect-modal-close"
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                style={{ position: 'relative' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="detect-modal-body settings-popout-body">
            <div className="detect-form-fields settings-popout-fields">
              {/* Card FPS display */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <span>Card FPS display</span>
                </label>
                <div className="detect-segmented-res">
                  <button
                    type="button"
                    className={`detect-res-btn ${fpsDetail === 'detailed' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('fpsDetail', 'detailed')}
                  >
                    AVG + 1% Lows
                  </button>
                  <button
                    type="button"
                    className={`detect-res-btn ${fpsDetail === 'simple' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('fpsDetail', 'simple')}
                  >
                    AVG Only
                  </button>
                </div>
              </div>

              {/* Homepage theme */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <span>Homepage theme</span>
                </label>
                <div className="detect-segmented-res">
                  <button
                    type="button"
                    className={`detect-res-btn ${userSettings?.theme !== 'catppuccin-mocha' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('theme', 'default')}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    className={`detect-res-btn ${userSettings?.theme === 'catppuccin-mocha' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('theme', 'catppuccin-mocha')}
                  >
                    Mocha
                  </button>
                </div>
              </div>

              {/* UI Rounding */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <span>UI Rounding</span>
                </label>
                <div className="detect-segmented-res">
                  <button
                    type="button"
                    className={`detect-res-btn ${userSettings?.rounding !== 'pill' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('rounding', 'rectangle')}
                  >
                    Rectangle
                  </button>
                  <button
                    type="button"
                    className={`detect-res-btn ${userSettings?.rounding === 'pill' ? 'active' : ''}`}
                    onClick={() => onUpdateSetting && onUpdateSetting('rounding', 'pill')}
                  >
                    Pill
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div
                className="detect-toggle-row settings-popout-toggle"
                onClick={() => onUpdateSetting && onUpdateSetting('showBottlenecks', !showBottlenecks)}
              >
                <div className="detect-toggle-info">
                  <span className="detect-toggle-title">Bottleneck badges</span>
                  <span className="detect-toggle-desc">GPU/CPU bound tags</span>
                </div>
                <div className={`popout-switch-track ${showBottlenecks ? 'on' : 'off'}`}>
                  <span className="popout-switch-thumb" />
                </div>
              </div>

              <div
                className="detect-toggle-row settings-popout-toggle"
                onClick={() => onUpdateSetting && onUpdateSetting('ambientBlur', !ambientBlur)}
              >
                <div className="detect-toggle-info">
                  <span className="detect-toggle-title">Ambient blur</span>
                  <span className="detect-toggle-desc">{ambientBlur ? 'Dynamic backdrop' : 'AMOLED black'}</span>
                </div>
                <div className={`popout-switch-track ${ambientBlur ? 'on' : 'off'}`}>
                  <span className="popout-switch-thumb" />
                </div>
              </div>

              {/* Profile */}
              <div className="detect-field settings-popout-profile">
                <label className="detect-field-label" htmlFor="profile-name-input">
                  <span>Profile Tag</span>
                </label>
                <input
                  id="profile-name-input"
                  className="detect-spec-select"
                  type="text"
                  value={profileName || ''}
                  onChange={(e) => onProfileNameChange && onProfileNameChange(e.target.value)}
                  placeholder="Enter gamer tag"
                  maxLength={32}
                />
              </div>

              {/* API Diagnostics Results */}
              {apiResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {apiResults.map((result) => (
                    <div
                      key={result.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        fontSize: '12px'
                      }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{result.name}</span>
                      <span
                        style={{
                          color: result.ok ? '#7ef0b1' : '#ffb4b4',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontSize: '11px'
                        }}
                      >
                        {result.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="detect-modal-footer">
            <div className="detect-footer-left">
              <button
                id="clear-all-data-btn"
                type="button"
                className="detect-rescan-btn"
                onClick={onResetData}
                title="Reset saved data"
              >
                <RotateCcw size={13} />
                <span>Reset saved data</span>
              </button>
            </div>
            <div className="detect-footer-right">
              <button
                id="check-api-status-btn"
                type="button"
                className="detect-btn-discard"
                onClick={handleCheckApiStatus}
                disabled={isCheckingApis}
              >
                <ArrowRight size={13} />
                <span>{isCheckingApis ? 'Testing...' : 'Test API status'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

