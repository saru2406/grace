// Real product photography component visualizer matching AMOLED aesthetics

export function getGpuImage(gpu) {
  if (!gpu) {
    return `
      <div class="component-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="placeholder-icon">
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
        <span class="placeholder-text">GPU</span>
      </div>
    `;
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

  return `
    <div class="component-img-wrap skeleton-loading">
      <img 
        src="${imgPath}" 
        alt="${gpu.name}" 
        class="component-real-img" 
        loading="lazy" 
        onload="this.parentElement.classList.remove('skeleton-loading')" 
        onerror="this.parentElement.classList.remove('skeleton-loading')"
      />
      <span class="component-brand-tag ${brandClass}">${brand}</span>
    </div>
  `;
}

export function getCpuImage(cpu) {
  if (!cpu) {
    return `
      <div class="component-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="placeholder-icon">
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
        <span class="placeholder-text">CPU</span>
      </div>
    `;
  }

  const brand = cpu.brand || 'AMD';
  const isAmd = brand === 'AMD';
  const imgPath = isAmd ? '/components/cpu-amd.jpg' : '/components/cpu-intel.jpg';
  const brandClass = isAmd ? 'brand-amd' : 'brand-intel';

  return `
    <div class="component-img-wrap skeleton-loading">
      <img 
        src="${imgPath}" 
        alt="${cpu.name}" 
        class="component-real-img" 
        loading="lazy" 
        onload="this.parentElement.classList.remove('skeleton-loading')" 
        onerror="this.parentElement.classList.remove('skeleton-loading')"
      />
      <span class="component-brand-tag ${brandClass}">${brand}</span>
    </div>
  `;
}

export function getRamImage(ram) {
  if (!ram) {
    return `
      <div class="component-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="placeholder-icon">
          <path d="M6 19v-3"></path>
          <path d="M10 19v-3"></path>
          <path d="M14 19v-3"></path>
          <path d="M18 19v-3"></path>
          <rect x="2" y="5" width="20" height="11" rx="1"></rect>
        </svg>
        <span class="placeholder-text">RAM</span>
      </div>
    `;
  }

  return `
    <div class="component-img-wrap skeleton-loading">
      <img 
        src="/components/ram.png" 
        alt="${ram}GB RAM" 
        class="component-real-img" 
        loading="lazy" 
        onload="this.parentElement.classList.remove('skeleton-loading')" 
        onerror="this.parentElement.classList.remove('skeleton-loading')"
      />
      <span class="component-brand-tag brand-ram">${ram}GB</span>
    </div>
  `;
}
