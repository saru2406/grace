import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Monitor,
  CircuitBoard,
  Cpu,
  MemoryStick,
  X,
  Check,
  RefreshCw,
  GripHorizontal
} from 'lucide-react';
import { GPUS, CPUS, RAM_OPTIONS } from '../data/hardware';
import { detectSystemHardware, DetectedHardware } from '../utils/hardwareDetector';
import { CustomDropdown } from './CustomDropdown';
import { MaterialSpinner } from './MaterialSpinner';
import { useDraggable } from '../hooks/useDraggable';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  useDraggable(dialogRef, '.modal-drag-handle', isOpen);

  const [isDetecting, setIsDetecting] = useState(true);
  const [progressText, setProgressText] = useState('Detecting hardware specs...');
  const [detected, setDetected] = useState<DetectedHardware | null>(null);

  // Editable selections before confirmation
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '1440p' | '4k'>('1080p');
  const [selectedGpuId, setSelectedGpuId] = useState<string>(GPUS[0]?.id || 'rtx-4060');
  const [selectedCpuId, setSelectedCpuId] = useState<string>(CPUS[0]?.id || 'r7-7800x3d');
  const [selectedRam, setSelectedRam] = useState<number>(16);

  const runDetection = useCallback(async () => {
    setIsDetecting(true);
    setProgressText('Detecting hardware specs...');
    try {
      const data = await detectSystemHardware((step) => {
        setProgressText(step);
      });
      setDetected(data);
      const res = data?.matchedResolution || '1080p';
      const gpu = data?.matchedGpu || GPUS[0];
      const cpu = data?.matchedCpu || CPUS[0];
      const ram = data?.matchedRam || 16;
      setSelectedResolution(res);
      setSelectedGpuId(gpu.id);
      setSelectedCpuId(cpu.id);
      setSelectedRam(ram);
    } catch (err) {
      console.error('Failed to detect hardware:', err);
      setSelectedResolution('1080p');
      setSelectedGpuId(GPUS[0]?.id || 'rtx-4060');
      setSelectedCpuId(CPUS[0]?.id || 'r7-7800x3d');
      setSelectedRam(16);
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

  const gpuGroups = React.useMemo(() => {
    return ['NVIDIA', 'AMD', 'Intel'].map((brand) => {
      const brandGpus = GPUS.filter((g) => g.brand === brand);
      return {
        label: `${brand} Graphics Cards`,
        options: brandGpus.map((g) => ({
          value: g.id,
          label: `${g.name} (${g.vram}GB)`
        }))
      };
    });
  }, []);

  const cpuGroups = React.useMemo(() => {
    return ['AMD', 'Intel'].map((brand) => {
      const brandCpus = CPUS.filter((c) => c.brand === brand);
      return {
        label: `${brand} Processors`,
        options: brandCpus.map((c) => ({
          value: c.id,
          label: c.name
        }))
      };
    });
  }, []);

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
        ref={dialogRef}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="modal-drag-handle" title="Drag to move" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}>
              <GripHorizontal size={16} />
            </div>
            <button
              className="detect-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
              type="button"
              style={{ position: 'relative' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="detect-modal-body">
          {isDetecting ? (
            <div className="detect-loading-view">
              <MaterialSpinner size={32} strokeWidth={5} />
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
                <CustomDropdown
                  className="detect-spec-select"
                  value={selectedGpuId}
                  placeholder="Select GPU"
                  searchable={true}
                  groups={gpuGroups}
                  onChange={(val) => setSelectedGpuId(val)}
                  ariaLabel="Select Graphics Card"
                />
                {detected && !detected.gpuDetectionReliable && (
                  <p className="detect-field-hint">
                    Your browser hid the physical adapter ({detected.rawGpu}). Please verify this selection manually.
                  </p>
                )}
              </div>

              {/* Processor (CPU) */}
              <div className="detect-field">
                <label className="detect-field-label">
                  <Cpu size={14} strokeWidth={2} className="detect-field-icon" />
                  <span>Processor</span>
                </label>
                <CustomDropdown
                  className="detect-spec-select"
                  value={selectedCpuId}
                  placeholder="Select CPU"
                  searchable={true}
                  groups={cpuGroups}
                  onChange={(val) => setSelectedCpuId(val)}
                  ariaLabel="Select Processor"
                />
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
              disabled={isDetecting}
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

