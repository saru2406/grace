import React, { useEffect } from 'react';

export function GoogleAuthModal({
  isOpen,
  onClose,
  googleUser,
  gpu,
  cpu,
  ram,
  onSignIn,
  onSignOut,
  onSaveCloudSpecs
}) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="google-auth-modal"
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box modal-google">
        <button
          id="close-google-modal"
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">Google Account Sync</h2>
          <p className="modal-subtitle">Save your current hardware configuration and benchmark profiles to the cloud.</p>
        </div>

        <div id="google-auth-state-box" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {googleUser ? (
            <>
              <div style={{ background: 'var(--ctp-surface0)', border: '1px solid var(--ctp-surface1)', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={googleUser.picture} style={{ width: '44px', height: '44px', borderRadius: '50%' }} alt="Google User" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ctp-text)' }}>{googleUser.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ctp-subtext0)' }}>{googleUser.email}</div>
                  </div>
                </div>
                <button id="google-signout-btn" className="btn-reset-specs" style={{ color: 'var(--ctp-red)' }} onClick={onSignOut}>
                  Sign Out
                </button>
              </div>

              <div style={{ background: 'var(--ctp-surface0)', border: '1px solid var(--ctp-surface1)', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ctp-subtext0)', marginBottom: '8px' }}>
                  Saved Cloud Rig
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--ctp-text)', marginBottom: '12px' }}>
                  GPU: <strong>{gpu ? gpu.name : 'None'}</strong><br />
                  CPU: <strong>{cpu ? cpu.name : 'None'}</strong><br />
                  RAM: <strong>{ram ? `${ram}GB` : 'None'}</strong>
                </p>
                <button
                  id="sync-cloud-specs-btn"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={onSaveCloudSpecs}
                >
                  Save Current Specs to Cloud
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                id="google-continue-btn"
                className="btn-google"
                style={{ justifyContent: 'center', padding: '12px', fontSize: '14px' }}
                onClick={onSignIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
