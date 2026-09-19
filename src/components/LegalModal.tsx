import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, GripHorizontal } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';

export function LegalModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('privacy');
  const dialogRef = useRef(null);

  useDraggable(dialogRef, '.modal-drag-handle', isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
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
        style={{ maxWidth: '600px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="detect-modal-dialog-inner" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="detect-modal-header">
            <div className="detect-header-title-group">
              <h2 className="detect-modal-title">Legal & Compliance</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="modal-drag-handle" title="Drag to move" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}>
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

          <div style={{ display: 'flex', gap: '6px', padding: '16px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'cookies' ? 'active' : ''}`}
              onClick={() => setActiveTab('cookies')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Cookie Policy
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
              onClick={() => setActiveTab('refunds')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Refund Policy
            </button>
          </div>

          <div className="detect-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              {activeTab === 'privacy' && (
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '12px' }}>Privacy Policy</h3>
                  <p>Last Updated: {new Date().toLocaleDateString()}</p>
                  <p>We respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>1. Data Collection</h4>
                  <p>We practice data minimization. We only collect the information necessary to provide you with the core functionality of this tool (estimating FPS). All of your hardware settings and custom game data are stored locally on your device.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>2. Third-Party Integrations</h4>
                  <p>If you choose to sync your Steam account, we fetch your public game library from the Steam Web API. We do not store or transmit your Steam Web API Key anywhere other than your local browser storage.</p>
                  <p>Game images are fetched from Steam's content delivery network (CDN). Steam may log these requests according to their own privacy policies.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>3. Analytics</h4>
                  <p>We currently do not use third-party analytics trackers.</p>
                </div>
              )}

              {activeTab === 'terms' && (
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '12px' }}>Terms & Conditions</h3>
                  <p>By using this website, you agree to these Terms and Conditions.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>1. Use of the Service</h4>
                  <p>This service provides estimated frames per second (FPS) for various PC games based on hardware specifications. These are estimates only and not guarantees of performance.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>2. Intellectual Property</h4>
                  <p>All game titles, cover art, and logos displayed on this site are the property of their respective publishers and are used for informational purposes only. We claim no ownership over these assets.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>3. Disclaimer of Warranties</h4>
                  <p>The service is provided "as is" without warranty of any kind. We make no claims or promises regarding the accuracy, reliability, or completeness of the estimates provided.</p>
                </div>
              )}

              {activeTab === 'cookies' && (
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '12px' }}>Cookie Policy</h3>
                  <p>We use local storage (similar to cookies) to enhance your experience by saving your preferences, hardware configurations, and imported games.</p>
                  <h4 style={{ color: '#fff', margin: '16px 0 8px' }}>Strictly Necessary Data</h4>
                  <p>All data we store is strictly necessary for the application to function according to your inputs. We do not set any third-party tracking, advertising, or analytics cookies.</p>
                  <p>You can clear your local storage at any time using the "Reset saved data" button in the Settings menu, or by clearing your browser data.</p>
                </div>
              )}

              {activeTab === 'refunds' && (
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '12px' }}>Refund Policy</h3>
                  <p>Because this service is provided free of charge, there are no purchases or transactions made on this site.</p>
                  <p>Therefore, a refund policy does not apply to our direct services. If we introduce premium features in the future, a comprehensive refund policy will be updated here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

