import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, GripHorizontal, ShieldAlert } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';

interface FeatureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  wikiUrl: string;
  wikiText: string;
  isPt?: boolean;
}

export function FeatureInfoModal({ isOpen, onClose, title, message, wikiUrl, wikiText, isPt }: FeatureInfoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useDraggable(dialogRef, '.modal-drag-handle', isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="detect-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="detect-modal-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '380px' }}
      >
        <div className="detect-modal-dialog-inner">
          {/* Modal Header */}
          <div className="detect-modal-header">
            <div className="detect-header-title-group">
              <h2 className="detect-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color={isPt ? "#e2e8f0" : "#ffbd2e"} />
                {title}
              </h2>
              <p className="detect-modal-subtitle">Hardware limitation information</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="modal-drag-handle" title="Drag to move" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', borderRadius: '4px', cursor: 'grab' }}>
                <GripHorizontal size={16} />
              </div>
              <button
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
          <div className="detect-modal-body">
            <div className="detect-form-fields">
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                {message}
              </p>
              
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#66c0f4',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '12px',
                  background: 'rgba(102, 192, 244, 0.1)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginTop: '8px',
                  alignSelf: 'flex-start'
                }}
              >
                <ShieldAlert size={16} />
                {wikiText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

