import { GPUS, CPUS } from '../data/hardware.js';

export interface DetectedHardware {
  // Raw readings
  rawResolution: string;
  rawGpu: string;
  rawCpu: string;
  rawRam: string;
  
  // Matched DB items
  matchedResolution: '1080p' | '1440p' | '4k';
  matchedGpu: typeof GPUS[0];
  matchedCpu: typeof CPUS[0];
  matchedRam: number;
}

/**
 * Detects display resolution and maps to target game resolution.
 */
function detectResolution(): { raw: string; matched: '1080p' | '1440p' | '4k' } {
  const width = window.screen.width || 1920;
  const height = window.screen.height || 1080;
  const dpr = window.devicePixelRatio || 1;
  const effectiveWidth = Math.round(width * dpr);
  const effectiveHeight = Math.round(height * dpr);

  const raw = `${width} × ${height}${dpr > 1 ? ` (DPR ${dpr.toFixed(1)}: ${effectiveWidth} × ${effectiveHeight})` : ''}`;

  // Evaluate against max dimensions (accounting for high-DPI scaling)
  const maxW = Math.max(width, effectiveWidth);
  const maxH = Math.max(height, effectiveHeight);

  let matched: '1080p' | '1440p' | '4k' = '1080p';
  if (maxW >= 3400 || maxH >= 1950) {
    matched = '4k';
  } else if (maxW >= 2300 || maxH >= 1300) {
    matched = '1440p';
  } else {
    matched = '1080p';
  }

  return { raw, matched };
}

/**
 * Extracts GPU model from WebGL unmasked renderer and matches with GPUS list.
 */
function detectGpu(): { raw: string; matched: typeof GPUS[0] } {
  let renderer = '';
  let vendor = '';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      }
      if (!renderer) {
        renderer = gl.getParameter(gl.RENDERER) || '';
      }
      if (!vendor) {
        vendor = gl.getParameter(gl.VENDOR) || '';
      }
    }
  } catch {
    // Ignore WebGL context error
  }

  const cleanRenderer = (renderer || 'Generic Graphics Adapter')
    .replace(/^ANGLE \(([^,]+),\s*/i, '')
    .replace(/\s*Direct3D.*$/i, '')
    .replace(/\s*vs_\d+_\d+.*$/i, '')
    .replace(/\s*\(0x[0-9a-fA-F]+\)/g, '')
    .replace(/\)\s*$/, '')
    .trim();

  const raw = cleanRenderer || 'Standard Display Adapter';
  const lowerRaw = (raw + ' ' + vendor).toLowerCase();

  // Find best GPU match
  let bestMatch: typeof GPUS[0] = GPUS[0];
  let highestScore = -999;

  for (const g of GPUS) {
    let score = 0;
    const lowerName = g.name.toLowerCase();
    const lowerId = g.id.toLowerCase();
    const brand = g.brand.toLowerCase();

    // Enforce Brand consistency
    if (lowerRaw.includes(brand)) {
      score += 35;
    } else if (
      (brand === 'nvidia' && (lowerRaw.includes('amd') || lowerRaw.includes('intel') || lowerRaw.includes('radeon'))) ||
      (brand === 'amd' && (lowerRaw.includes('nvidia') || lowerRaw.includes('geforce') || lowerRaw.includes('intel'))) ||
      (brand === 'intel' && (lowerRaw.includes('nvidia') || lowerRaw.includes('geforce') || lowerRaw.includes('amd') || lowerRaw.includes('radeon')))
    ) {
      score -= 200; // Heavy penalty for brand conflict
    }

    // Extract model tokens (e.g. "4070", "3080", "a750", "b580", "7800", "1660")
    const modelMatches = lowerName.match(/\b[a-z]?\d{3,4}[a-z]?\b/g) || [];
    for (const token of modelMatches) {
      if (lowerRaw.includes(token)) {
        score += 65; // Heavily weight model identifier
      }
    }

    // Check specific qualifiers (ti, super, xt, xtx)
    const rawHasTi = /\bti\b/i.test(lowerRaw);
    const nameHasTi = /\bti\b/i.test(lowerName);
    if (rawHasTi && nameHasTi) score += 25;
    else if (!rawHasTi && nameHasTi) score -= 20;

    const rawHasSuper = /\bsuper\b/i.test(lowerRaw);
    const nameHasSuper = /\bsuper\b/i.test(lowerName);
    if (rawHasSuper && nameHasSuper) score += 25;
    else if (!rawHasSuper && nameHasSuper) score -= 20;

    const rawHasXt = /\bxt\b/i.test(lowerRaw);
    const nameHasXt = /\bxt\b/i.test(lowerName);
    if (rawHasXt && nameHasXt) score += 25;
    else if (!rawHasXt && nameHasXt) score -= 20;

    if (lowerRaw.includes('780m') && lowerId.includes('780m')) score += 50;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = g;
    }
  }

  // Fallback if no strong match found (score < 40)
  if (highestScore < 40) {
    if (lowerRaw.includes('nvidia')) {
      bestMatch = GPUS.find(g => g.id === 'rtx-4060') || GPUS[0];
    } else if (lowerRaw.includes('amd') || lowerRaw.includes('radeon')) {
      bestMatch = GPUS.find(g => g.id === 'rx-7600') || GPUS[0];
    } else if (lowerRaw.includes('intel')) {
      bestMatch = GPUS.find(g => g.id === 'arc-a750') || GPUS[0];
    } else {
      bestMatch = GPUS.find(g => g.id === 'rtx-3060') || GPUS[0];
    }
  }

  return { raw, matched: bestMatch };
}

/**
 * Runs a micro computational benchmark to estimate single-core performance.
 */
function runMicroCpuBenchmark(): number {
  const start = performance.now();
  let count = 0;
  for (let i = 0; i < 600000; i++) {
    count += Math.sqrt(i) * Math.sin(i);
  }
  const duration = performance.now() - start;
  // Prevent dead code elimination
  if (count === -99999) console.log(count);
  return duration;
}

/**
 * Detects CPU concurrency and estimates CPU tier and closest model.
 */
function detectCpu(): { raw: string; matched: typeof CPUS[0] } {
  const concurrency = navigator.hardwareConcurrency || 8;
  const duration = runMicroCpuBenchmark();

  const isFast = duration < 30; // Very fast modern core

  const raw = `${concurrency} Logical Cores / Threads (Benchmark: ${duration.toFixed(0)}ms)`;

  // Match based on concurrency and speed
  let targetId = 'r5-7600x';

  if (concurrency >= 24) {
    targetId = isFast ? 'i9-14900k' : 'r9-7950x3d';
  } else if (concurrency >= 16) {
    if (isFast) {
      targetId = 'r7-7800x3d';
    } else {
      targetId = 'r7-5700x3d';
    }
  } else if (concurrency >= 12) {
    if (isFast) {
      targetId = 'r5-7600x';
    } else {
      targetId = 'i5-12400f';
    }
  } else if (concurrency >= 8) {
    targetId = isFast ? 'i5-12400f' : 'i7-8700k';
  } else {
    targetId = 'i5-8400';
  }

  const matched = CPUS.find(c => c.id === targetId) || CPUS[0];
  return { raw, matched };
}

/**
 * Detects device memory and matches to nearest RAM option.
 */
function detectRam(): { raw: string; matched: number } {
  const memory = (navigator as any).deviceMemory || 16;
  let matched = 16;
  if (memory >= 32) {
    matched = 32;
  } else if (memory >= 16) {
    matched = 16;
  } else if (memory >= 8) {
    matched = 16;
  } else {
    matched = 8;
  }

  const raw = `${memory} GB (Reported by Device API)`;
  return { raw, matched };
}

/**
 * Public detection function with simulated async step delay for smooth UI experience.
 */
export async function detectSystemHardware(onProgress?: (step: string) => void): Promise<DetectedHardware> {
  if (onProgress) onProgress('Detecting display resolution...');
  await new Promise(resolve => setTimeout(resolve, 120));
  const res = detectResolution();

  if (onProgress) onProgress('Querying graphics card...');
  await new Promise(resolve => setTimeout(resolve, 140));
  const gpu = detectGpu();

  if (onProgress) onProgress('Checking processor cores...');
  await new Promise(resolve => setTimeout(resolve, 120));
  const cpu = detectCpu();

  if (onProgress) onProgress('Finalizing specifications...');
  await new Promise(resolve => setTimeout(resolve, 80));
  const ram = detectRam();

  return {
    rawResolution: res.raw,
    rawGpu: gpu.raw,
    rawCpu: cpu.raw,
    rawRam: ram.raw,
    matchedResolution: res.matched,
    matchedGpu: gpu.matched,
    matchedCpu: cpu.matched,
    matchedRam: ram.matched
  };
}
