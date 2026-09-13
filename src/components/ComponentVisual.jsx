import React, { useState } from 'react';
import { CircuitBoard, Cpu, MemoryStick } from 'lucide-react';

export function GpuVisual({ gpu }) {
  const [loaded, setLoaded] = useState(false);

  if (!gpu) {
    return (
      <div className="component-placeholder">
        <CircuitBoard size={24} strokeWidth={1.8} className="placeholder-icon" />
        <span className="placeholder-text">GPU</span>
      </div>
    );
  }

  const brand = gpu.brand || 'NVIDIA';
  let imgPath = '/components/gpu-nvidia.jpg';
  let brandClass = 'brand-nvidia';
  if (brand === 'AMD') {
    imgPath = '/components/gpu-amd.jpg';
    brandClass = 'brand-amd';
  } else if (brand === 'Intel') {
    imgPath = '/components/gpu-intel.jpg';
    brandClass = 'brand-intel';
  }

  return (
    <div className={`component-img-wrap ${!loaded ? 'skeleton-loading' : ''}`}>
      <img
        src={imgPath}
        alt={gpu.name}
        className="component-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className={`component-brand-tag ${brandClass}`}>{brand}</span>
    </div>
  );
}

export function CpuVisual({ cpu }) {
  const [loaded, setLoaded] = useState(false);

  if (!cpu) {
    return (
      <div className="component-placeholder">
        <Cpu size={24} strokeWidth={1.8} className="placeholder-icon" />
        <span className="placeholder-text">CPU</span>
      </div>
    );
  }

  const brand = cpu.brand || 'AMD';
  const isAmd = brand === 'AMD';
  const imgPath = isAmd ? '/components/cpu-amd.jpg' : '/components/cpu-intel.jpg';
  const brandClass = isAmd ? 'brand-amd' : 'brand-intel';

  return (
    <div className={`component-img-wrap ${!loaded ? 'skeleton-loading' : ''}`}>
      <img
        src={imgPath}
        alt={cpu.name}
        className="component-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className={`component-brand-tag ${brandClass}`}>{brand}</span>
    </div>
  );
}

export function RamVisual({ ram }) {
  const [loaded, setLoaded] = useState(false);

  if (!ram) {
    return (
      <div className="component-placeholder">
        <MemoryStick size={24} strokeWidth={1.8} className="placeholder-icon" />
        <span className="placeholder-text">RAM</span>
      </div>
    );
  }

  return (
    <div className={`component-img-wrap ${!loaded ? 'skeleton-loading' : ''}`}>
      <img
        src="/components/ram.png"
        alt={`${ram}GB RAM`}
        className="component-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className="component-brand-tag brand-ram">{ram}GB</span>
    </div>
  );
}
