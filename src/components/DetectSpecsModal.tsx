import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Monitor,
  CircuitBoard,
  Cpu,
  MemoryStick,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { GPUS, CPUS, RAM_OPTIONS } from '../data/hardware.js';
import { detectSystemHardware, DetectedHardware } from '../utils/hardwareDetector.js';

interface DetectSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (specs: {
    resolution: '1080p' | '1440p' | '4k';
    gpu: typeof GPUS[0];
    cpu: typeof CPUS[0];
    ram: number;
  }) => void;
}

export function DetectSpecsModal({ isOpen, onClose, onApply }: DetectSpecsModalProps) {
  const [isDetecting, setIsDetecting] = useState(true);
  const [progressText, setProgressText] = useState('Detecting hardware specs...');
  const [detected, setDetected] = useState<DetectedHardware | null>(null);

  // Editable selections before confirmation
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '1440p' | '4k'>('1080p');
  const [selectedGpuId, setSelectedGpuId] = useState<string>('');
  const [selectedCpuId, setSelectedCpuId] = useState<string>('');
  const [selectedRam, setSelectedRam] = useState<number>(16);

  const runDetection = useCallback(async () => {
    setIsDetecting(true);
    setProgressText('Detecting hardware specs...');
    try {
      const data = await detectSystemHardware((step) => {
        setProgressText(step);
      });
      setDetected(data);
      setSelectedResolution(data.matchedResolution);
      setSelectedGpuId(data.matchedGpu.id);
      setSelectedCpuId(data.matchedCpu.id);
      setSelectedRam(data.matchedRam);
    } catch (err) {
      console.error('Failed to detect hardware:', err);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      runDetection();
    }
  }, [isOpen, runDetection]);

  // Handle ESC key
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

  const handleConfirm = () => {
    const matchedGpu = GPUS.find(g => g.id === selectedGpuId) || detected?.matchedGpu || GPUS[0];
    const matchedCpu = CPUS.find(c => c.id === selectedCpuId) || detected?.matchedCpu || CPUS[0];

    onApply({
      resolution: selectedResolution,
      gpu: matchedGpu,
      cpu: matchedCpu,
      ram: selectedRam
    });
    onClose();
  };

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
            <h2 className="detect-modal-title">
              {isDetecting ? 'Detecting PC Specs' : 'Confirm Detected Specs'}
            </h2>
            <p className="detect-modal-subtitle">
              {isDetecting
                ? 'Querying browser hardware adapters...'
                : 'Review detected specifications before inputting them to your rig.'}
            </p>
          </div>
          <button
            className="detect-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="detect-modal-body">
          {isDetecting ? (
            <div className="detect-loading-view">
              <svg className="initial-spinner" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="6" />
              </svg>
              <span className="detect-loading-text">{progressText}</span>
            </div>
          ) : detected ? (
            <div className="detect-form-fields">
              {/* Display Resolution */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <Monitor size={14} strokeWidth={2} className="detect-field-icon" />
                  <span>Display Resolution</span>
                </label>
                <div className="detect-segmented-res">
                  {(['1080p', '1440p', '4k'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`detect-res-btn ${selectedResolution === r ? 'active' : ''}`}
                      onClick={() => setSelectedResolution(r)}
                    >
                      {r === '4k' ? '4K UHD' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphics Card (GPU) */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <CircuitBoard size={14} strokeWidth={2} className="detect-field-icon" />
                  <span>Graphics Card</span>
                </label>
                <select
                  className="detect-spec-select"
                  value={selectedGpuId}
                  onChange={(e) => setSelectedGpuId(e.target.value)}
                >
                  {['NVIDIA', 'AMD', 'Intel'].map((brand) => {
                    const brandGpus = GPUS.filter((g) => g.brand === brand);
                    return (
                      <optgroup key={brand} label={`${brand} Graphics Cards`}>
                        {brandGpus.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.vram}GB)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Processor (CPU) */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <Cpu size={14} strokeWidth={2} className="detect-field-icon" />
                  <span>Processor</span>
                </label>
                <select
                  className="detect-spec-select"
                  value={selectedCpuId}
                  onChange={(e) => setSelectedCpuId(e.target.value)}
                >
                  {['AMD', 'Intel'].map((brand) => {
                    const brandCpus = CPUS.filter((c) => c.brand === brand);
                    return (
                      <optgroup key={brand} label={`${brand} Processors`}>
                        {brandCpus.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Memory (RAM) */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <MemoryStick size={14} strokeWidth={2} className="detect-field-icon" />
                  <span>Memory (RAM)</span>
                </label>
                <div className="detect-segmented-res">
                  {RAM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`detect-res-btn ${selectedRam === opt.value ? 'active' : ''}`}
                      onClick={() => setSelectedRam(opt.value)}
                    >
                      {opt.value} GB
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimal Footnote (No box container) */}
              <p className="detect-privacy-footnote">
                Browsers restrict hardware telemetry for privacy: RAM is reported up to 8 GB, and processors only report core counts without model names.
              </p>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="detect-modal-footer">
          <div className="detect-footer-left">
            {!isDetecting && (
              <button
                type="button"
                className="detect-rescan-btn"
                onClick={runDetection}
                title="Scan again"
              >
                <RefreshCw size={13} />
                <span>Re-detect</span>
              </button>
            )}
          </div>
          <div className="detect-footer-right">
            <button
              type="button"
              className="detect-btn-discard"
              onClick={onClose}
              disabled={isDetecting}
            >
              <X size={14} />
              <span>Discard</span>
            </button>
            <button
              type="button"
              className="detect-btn-apply"
              onClick={handleConfirm}
              disabled={isDetecting || !detected}
            >
              <Check size={15} />
              <span>Yes, Input in Sidebar</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
