import React, { useState } from 'react';

export function GpuVisual({ gpu }) {
  const [loaded, setLoaded] = useState(false);

  if (!gpu) {
    return (
      <div className="component-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="placeholder-icon">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="placeholder-icon">
          <rect x="4" y="4" width="16" height="16" rx="2"></rect>
          <rect x="9" y="9" width="6" height="6"></rect>
          <line x1="9" y1="1" x2="9" y2="4"></line>
          <line x1="15" y1="1" x2="15" y2="4"></line>
          <line x1="9" y1="20" x2="9" y2="23"></line>
          <line x1="15" y1="20" x2="15" y2="23"></line>
          <line x1="20" y1="9" x2="23" y2="9"></line>
          <line x1="20" y1="15" x2="23" y2="15"></line>
          <line x1="1" y1="9" x2="4" y2="9"></line>
          <line x1="1" y1="15" x2="4" y2="15"></line>
        </svg>
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="placeholder-icon">
          <path d="M6 19v-3"></path>
          <path d="M10 19v-3"></path>
          <path d="M14 19v-3"></path>
          <path d="M18 19v-3"></path>
          <rect x="2" y="5" width="20" height="11" rx="1"></rect>
        </svg>
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
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className="component-brand-tag brand-ram">{ram}GB</span>
    </div>
  );
}
