import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SYSTEM_PRESETS } from '../data/hardware.js';

interface QuickBuildsPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  gpu?: any;
  cpu?: any;
  onApplyPreset?: (preset: any) => void;
}

export function QuickBuildsPopout({
  isOpen,
  onClose,
  gpu,
  cpu,
  onApplyPreset
}: QuickBuildsPopoutProps) {
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

  return createPortal(
    <div className="detect-modal-backdrop" onClick={onClose}>
      <div
        className="detect-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="detect-modal-dialog-inner">
          {/* Modal Header */}
          <div className="detect-modal-header">
            <div className="detect-header-title-group">
              <h2 className="detect-modal-title">Quick Builds</h2>
              <p className="detect-modal-subtitle">Choose a pre-configured hardware preset</p>
            </div>
            <button
              className="detect-modal-close"
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="detect-modal-body">
            <div className="quick-builds-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SYSTEM_PRESETS.map((p) => {
                const isSelected = gpu?.id === p.gpuId && cpu?.id === p.cpuId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`detect-res-btn preset-chip ${isSelected ? 'active' : ''}`}
                    title={`${p.badge} — ${p.gpuId.toUpperCase()} + ${p.cpuId.toUpperCase()}`}
                    onClick={() => {
                      if (onApplyPreset) onApplyPreset(p);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      borderRadius: '10px'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 500 }}>{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
