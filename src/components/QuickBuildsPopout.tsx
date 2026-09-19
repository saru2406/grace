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
          <div className="detect-modal-body" style={{ padding: '0 16px 16px 16px' }}>
            <div className="quick-builds-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SYSTEM_PRESETS.map((p) => {
                const isSelected = gpu?.id === p.gpuId && cpu?.id === p.cpuId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`detect-res-btn preset-list-item ${isSelected ? 'active' : ''}`}
                    title={`${p.gpuId.toUpperCase()} + ${p.cpuId.toUpperCase()}`}
                    onClick={() => {
                      if (onApplyPreset) onApplyPreset(p);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{p.name}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{p.gpuId.replace('rtx-','RTX ').replace('rx-','RX ')} + {p.cpuId.toUpperCase()}</span>
                    </div>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      padding: '4px 8px', 
                      background: 'rgba(255,255,255,0.1)', 
                      borderRadius: '4px',
                      color: 'rgba(255,255,255,0.8)'
                    }}>
                      {p.badge}
                    </span>
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
