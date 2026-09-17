import React from 'react';

export function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-inner">
        <span className="footer-brand-title">Grace</span>
        <span className="footer-disclaimer">
          Game artwork, titles, logos, and trademarks are property of their respective publishers and copyright owners. Framerate estimations are calculated via empirical hardware scaling and bottleneck telemetry for system planning and configuration purposes.
        </span>
      </div>
    </footer>
  );
}
