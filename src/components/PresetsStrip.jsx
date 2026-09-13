import React from 'react';
import { SYSTEM_PRESETS } from '../data/hardware.js';

export function PresetsStrip({ onApplyPreset }) {
  return (
    <div className="presets-strip">
      <div id="presets-container" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
        {SYSTEM_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-chip"
            title={preset.badge}
            onClick={() => onApplyPreset(preset)}
          >
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
