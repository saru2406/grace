import React from 'react';

export function SystemStatusBar({ isConfigured, summary }) {
  if (!isConfigured) {
    return (
      <div className="system-status-bar" id="system-status-bar">
        <div id="status-unconfigured" className="status-msg">
          <span className="status-indicator-dot"></span>
          <span>Select hardware to estimate FPS.</span>
        </div>
      </div>
    );
  }

  const { avgFps, lowFps, bottleneckText, bottleneckColor, smoothCount, totalCount, verdictText, verdictColor } = summary;

  return (
    <div className="system-status-bar" id="system-status-bar">
      <div id="status-configured" className="status-stats">
        <div className="stat-pill">
          <span className="stat-pill-label">AVG</span>
          <span id="summary-avg-fps" className="stat-pill-val color-mauve">{avgFps} FPS</span>
        </div>

        <div className="stat-pill">
          <span className="stat-pill-label">1% LOW</span>
          <span id="summary-1low-fps" className="stat-pill-val color-blue">{lowFps} FPS</span>
        </div>

        <div className="stat-pill">
          <span className="stat-pill-label">BOTTLENECK</span>
          <span id="summary-bottleneck-val" className="stat-pill-val" style={{ color: bottleneckColor }}>
            {bottleneckText}
          </span>
        </div>

        <div className="stat-pill">
          <span className="stat-pill-label">60+ FPS</span>
          <span id="summary-smooth-count" className="stat-pill-val color-green">
            {smoothCount} / {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
