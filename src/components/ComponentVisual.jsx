import React, { useState, useEffect } from 'react';
import { CircuitBoard, Cpu, MemoryStick } from 'lucide-react';
import { getHardwareWikiDefault, fetchWikipediaHardwareImage } from '../services/wikipediaHardware.js';

export function GpuVisual({ gpu }) {
  const [loaded, setLoaded] = useState(false);
  const defaultWiki = gpu ? getHardwareWikiDefault(gpu, 'gpu') : null;
  const [wikiImg, setWikiImg] = useState(defaultWiki);

  useEffect(() => {
    if (!gpu) {
      setWikiImg(null);
      return;
    }
    const initial = getHardwareWikiDefault(gpu, 'gpu');
    setWikiImg(initial);
    setLoaded(false);

    let cancelled = false;
    fetchWikipediaHardwareImage(gpu, 'gpu').then(res => {
      if (!cancelled && res?.url) {
        setWikiImg(res.url);
      }
    });

    return () => { cancelled = true; };
  }, [gpu?.id]);

  if (!gpu) {
    return (
      <div className="component-placeholder">
        <CircuitBoard size={24} strokeWidth={1.8} className="placeholder-icon" />
        <span className="placeholder-text">GPU</span>
      </div>
    );
  }

  const brand = gpu.brand || 'NVIDIA';
  let fallbackImg = '/components/gpu-nvidia.jpg';
  let brandClass = 'brand-nvidia';
  if (brand === 'AMD') {
    fallbackImg = '/components/gpu-amd.jpg';
    brandClass = 'brand-amd';
  } else if (brand === 'Intel') {
    fallbackImg = '/components/gpu-intel.jpg';
    brandClass = 'brand-intel';
  }

  const imgSrc = wikiImg || fallbackImg;

  return (
    <div className={`component-img-wrap ${!loaded ? 'skeleton-loading' : ''}`} title={`Photo from Wikipedia: ${gpu.name}`}>
      <img
        key={imgSrc}
        src={imgSrc}
        alt={gpu.name}
        className="component-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          if (e.target.src !== fallbackImg) {
            e.target.src = fallbackImg;
          }
        }}
      />
      <span className={`component-brand-tag ${brandClass}`}>{brand}</span>
      <span className="component-wiki-badge" title="Source: Wikipedia / Wikimedia">W</span>
    </div>
  );
}

export function CpuVisual({ cpu }) {
  const [loaded, setLoaded] = useState(false);
  const defaultWiki = cpu ? getHardwareWikiDefault(cpu, 'cpu') : null;
  const [wikiImg, setWikiImg] = useState(defaultWiki);

  useEffect(() => {
    if (!cpu) {
      setWikiImg(null);
      return;
    }
    const initial = getHardwareWikiDefault(cpu, 'cpu');
    setWikiImg(initial);
    setLoaded(false);

    let cancelled = false;
    fetchWikipediaHardwareImage(cpu, 'cpu').then(res => {
      if (!cancelled && res?.url) {
        setWikiImg(res.url);
      }
    });

    return () => { cancelled = true; };
  }, [cpu?.id]);

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
  const fallbackImg = isAmd ? '/components/cpu-amd.jpg' : '/components/cpu-intel.jpg';
  const brandClass = isAmd ? 'brand-amd' : 'brand-intel';
  const imgSrc = wikiImg || fallbackImg;

  return (
    <div className={`component-img-wrap ${!loaded ? 'skeleton-loading' : ''}`} title={`Photo from Wikipedia: ${cpu.name}`}>
      <img
        key={imgSrc}
        src={imgSrc}
        alt={cpu.name}
        className="component-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          if (e.target.src !== fallbackImg) {
            e.target.src = fallbackImg;
          }
        }}
      />
      <span className={`component-brand-tag ${brandClass}`}>{brand}</span>
      <span className="component-wiki-badge" title="Source: Wikipedia / Wikimedia">W</span>
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
        src="/components/ram.png?v=2"
        alt={`${ram}GB RAM`}
        className="component-real-img ram-real-img"
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className="component-brand-tag brand-ram">{ram}GB</span>
    </div>
  );
}
