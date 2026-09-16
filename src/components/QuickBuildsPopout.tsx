import React, { useEffect, useRef } from 'react';
import { Zap, X } from 'lucide-react';
import { SYSTEM_PRESETS } from '../data/hardware.js';

export function QuickBuildsPopout({
  isOpen,
  onClose,
  gpu,
  cpu,
  onApplyPreset
}) {
  const popoutRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (isOpen && popoutRef.current && !popoutRef.current.contains(e.target)) {
        const toggleBtn = document.getElementById('open-quickbuilds-btn');
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

  return (
    <div id="quickbuilds-popout" className="profile-popout settings-popout-compact" ref={popoutRef}>
      <div className="popout-arrow"></div>
      <div className="popout-scroll-container">
        <div className="popout-header">
          <div className="popout-header-main">
            <div className="popout-header-icon">
              <Zap size={14} />
            </div>
            <div className="popout-header-text">
              <div className="popout-title">Quick Builds</div>
            </div>
          </div>
          <button
            className="popout-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="popout-section">
          <div className="quick-builds-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {SYSTEM_PRESETS.map((p) => {
              const isSelected = gpu?.id === p.gpuId && cpu?.id === p.cpuId;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`preset-chip ${isSelected ? 'active' : ''}`}
                  title={`${p.badge} — ${p.gpuId.toUpperCase()} + ${p.cpuId.toUpperCase()}`}
                  onClick={() => {
                    if (onApplyPreset) onApplyPreset(p);
                    onClose();
                  }}
                  style={{ width: '100%', padding: '10px 8px', textAlign: 'center', borderRadius: '8px' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
