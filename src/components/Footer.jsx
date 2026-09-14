import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-top-row">
          <div className="footer-brand">
            <span className="footer-brand-title">Grace by saru</span>
          </div>

        </div>

        <div className="footer-separator" />

        <div className="footer-bottom-row">
          <p className="footer-disclaimer">
            Game artwork, titles, logos, and trademarks are property of their respective publishers and copyright owners. Framerate estimations are calculated via empirical hardware scaling and bottleneck telemetry for system planning and configuration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
