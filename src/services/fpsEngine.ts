import { BenchmarkData } from './benchmarkService';

export function calculateFps(game: any, gpu: any, cpu: any, ram: any, settings: any = {}, benchmarkData: BenchmarkData | null = null) {
  // If hardware is not yet selected, return unconfigured state
  if (!gpu || !cpu) {
    return {
      isConfigured: false,
      avgFps: null,
      low1PercentFps: null,
      frametimeMs: null,
      verdict: { tier: 'Select Specs', badgeClass: 'badge-unselected', color: 'var(--ctp-subtext0)', text: 'Awaiting Specs' },
      bottleneck: { culprit: 'None', percentage: 0, label: 'Awaiting Specs', color: 'var(--ctp-subtext0)', desc: 'Choose your GPU and CPU.' },
      requiredVram: 'N/A', gpuVram: 0, isVramBottleneck: false, tips: ['Please select hardware.']
    };
  }

  const { resolution = '1080p', preset = 'high', rayTracing = false, pathTracing = false, upscaling = 'off' } = settings;

  // GPU Architecture Nuances
  let gpuArchMult = 1.0;
  if (gpu.name.includes('RTX 40') || gpu.name.includes('RX 7')) gpuArchMult = 1.08; // Better memory compression / cache
  if (gpu.name.includes('RTX 30') || gpu.name.includes('RX 6')) gpuArchMult = 1.02;
  
  // CPU Architecture Nuances (Cache affects lows significantly)
  let isX3D = cpu.name.includes('X3D');
  let cpuCacheMult = isX3D ? 1.25 : 1.0; // Massive boost for X3D chips in gaming

  // Base Performance Anchoring
  let rawGpuFps = 0;
  let isAnchored = false;

  // 1. Resolution Multipliers
  const resMultipliers: any = { '1080p': 1.0, '1440p': 0.65, '4k': 0.38 };
  const resMult = resMultipliers[resolution] || 1.0;

  // 2. Preset Multipliers
  const presetMultipliers: any = { 'low': 1.45, 'medium': 1.20, 'high': 1.0, 'ultra': 0.80 };
  const presetMult = presetMultipliers[preset] || 1.0;

  // 3. Upscaling Multipliers (DLSS / FSR)
  const upscalingMultipliers: any = { 'off': 1.0, 'native': 1.0, 'none': 1.0, 'quality': 1.35, 'balanced': 1.55, 'performance': 1.85 };
  const upscalingMult = upscalingMultipliers[upscaling] || 1.0;

  // 4. RT / PT Penalties
  let rtMult = 1.0;
  let ptMult = 1.0;
  let rtWarning = false;
  let ptWarning = false;

  if (rayTracing && (game.supportsRayTracing || game.supportsPathTracing)) {
    if (gpu.rtScore <= 0) { rtMult = 0.15; rtWarning = true; } 
    else { rtMult = Math.max(0.3, 1 - (0.5 * (100 / Math.max(gpu.rtScore, 1)))); }
    if (gpu.name.includes('RTX 40')) rtMult *= 1.15; // SER overhead reduction
  }
  
  if (pathTracing && (game.supportsPathTracing || game.supportsRayTracing)) {
    if (gpu.rtScore < 60) { ptMult = 0.10; ptWarning = true; } 
    else { ptMult = Math.max(0.2, 1 - (0.75 * (100 / Math.max(gpu.rtScore, 1)))); }
    if (gpu.name.includes('RTX 40')) ptMult *= 1.25; // SER & Frame Gen benefits implicit for PT
  }

  // CALCULATE RAW GPU FPS
  if (benchmarkData) {
    isAnchored = true;
    // Use real-world anchor as the baseline (RTX 4090 performance)
    let anchorBase = benchmarkData.native1080p;
    if (resolution === '1440p') anchorBase = benchmarkData.native1440p;
    if (resolution === '4k') anchorBase = benchmarkData.native4k;
    
    // Apply RT/PT overrides from benchmark if available natively
    if (pathTracing && benchmarkData.pt4k) {
      anchorBase = resolution === '4k' ? benchmarkData.pt4k : resolution === '1440p' ? benchmarkData.pt1440p! : benchmarkData.pt1080p!;
      rtMult = 1.0; ptMult = 1.0; // Already factored in the anchor
    } else if (rayTracing && benchmarkData.rt4k) {
      anchorBase = resolution === '4k' ? benchmarkData.rt4k : resolution === '1440p' ? benchmarkData.rt1440p! : benchmarkData.rt1080p!;
      rtMult = 1.0; // Already factored in the anchor
    }
    
    // Scale from RTX 4090 (assume score 280) to current GPU
    const relativePerf = (gpu.score * gpuArchMult) / 280; 
    rawGpuFps = anchorBase * relativePerf * presetMult * rtMult * ptMult * upscalingMult;

  } else {
    // Fallback heuristic engine
    const gpuRelative = gpu.score / 100;
    const gpuScaling = Math.pow(gpuRelative, 1.08) * gpuArchMult;
    rawGpuFps = game.baseFps * gpuScaling * resMult * presetMult * rtMult * ptMult * upscalingMult;
  }

  // 5. CPU Ceiling FPS
  const cpuRelative = cpu.score / 100;
  const cpuScaling = Math.pow(cpuRelative, 0.90) * cpuCacheMult;
  
  // High upscaling loads the CPU more heavily because of higher frame outputs
  let cpuLoadMult = 1.0;
  if (upscaling === 'performance') cpuLoadMult = 0.85; // CPU struggles to feed frames at this rate
  
  const baseCpuCap = (cpu.fpsCap || 220) / (game.cpuIntensity || 1.0);
  let rawCpuFps = baseCpuCap * (0.35 + 0.65 * cpuScaling) * cpuLoadMult;

  // 6. VRAM / RAM Penalties
  let requiredVram = game.vramAt1080p || 6.0;
  if (resolution === '1440p') requiredVram = game.vramAt1440p || 8.5;
  if (resolution === '4k') requiredVram = game.vramAt4k || 12.0;
  if (preset === 'ultra') requiredVram *= 1.20;
  if (pathTracing) requiredVram *= 1.45;
  else if (rayTracing) requiredVram *= 1.25;

  let vramPenaltyAvg = 1.0, vramPenalty1Low = 1.0, isVramBottleneck = false;
  if (gpu.vram < requiredVram) {
    isVramBottleneck = true;
    const deficit = requiredVram - gpu.vram;
    vramPenaltyAvg = Math.max(0.35, Math.pow(0.80, deficit));
    vramPenalty1Low = Math.max(0.10, Math.pow(0.55, deficit)); // Extreme stuttering
  }

  let ramPenaltyAvg = 1.0, ramPenalty1Low = 1.0, isRamBottleneck = false;
  const recRam = game.ramRecommended || 16;
  if (ram < recRam) {
    isRamBottleneck = true;
    ramPenaltyAvg = Math.max(0.60, 1.0 - ((recRam - ram) * 0.05));
    ramPenalty1Low = Math.max(0.30, 1.0 - ((recRam - ram) * 0.09));
  }

  // 7. Bottleneck Resolution & Effective FPS
  let bottleneck = { culprit: 'Balanced', percentage: 0, label: 'Balanced Rig', color: 'var(--ctp-green)', desc: 'CPU and GPU are harmoniously paired.' };
  let effectiveFps;
  
  if (rawGpuFps > rawCpuFps * 1.1) {
    effectiveFps = rawCpuFps * 1.03;
    const pct = Math.min(75, Math.round(((rawGpuFps - rawCpuFps) / rawGpuFps) * 100));
    bottleneck = { culprit: 'CPU', percentage: pct, label: `CPU Limited (${pct}%)`, color: 'var(--ctp-peach)', desc: `GPU has more headroom, but CPU limits framerate.` };
  } else if (rawCpuFps > rawGpuFps * 1.15) {
    effectiveFps = rawGpuFps;
    const pct = Math.min(90, Math.round(((rawCpuFps - rawGpuFps) / rawCpuFps) * 100));
    bottleneck = { culprit: 'GPU', percentage: pct, label: `GPU Bound (${pct}%)`, color: 'var(--ctp-blue)', desc: `Graphics card is operating at full potential.` };
  } else {
    effectiveFps = (rawGpuFps + rawCpuFps) / 2;
  }

  // Apply memory limits
  effectiveFps = Math.max(5, Math.round(effectiveFps * vramPenaltyAvg * ramPenaltyAvg));

  // 8. 1% Lows & Frametime
  let lowRatio = 0.72;
  if (isX3D) lowRatio += 0.08; // X3D chips maintain incredibly tight 1% lows
  if (isVramBottleneck) lowRatio *= vramPenalty1Low;
  if (isRamBottleneck) lowRatio *= ramPenalty1Low;
  if (bottleneck.culprit === 'CPU') lowRatio *= 0.90; // CPU limit causes more stutter than GPU limit

  const low1PercentFps = Math.max(3, Math.round(effectiveFps * lowRatio));
  const frametimeMs = (1000 / effectiveFps).toFixed(1);

  // 9. Verdict
  let verdict = { tier: 'Smooth', badgeClass: 'badge-smooth', color: 'var(--ctp-green)', text: '60+ FPS Smooth' };
  if (effectiveFps >= 144) verdict = { tier: 'Esports Ready', badgeClass: 'badge-ultra', color: '#ffffff', text: '144+ FPS Esports' };
  else if (effectiveFps >= 60) verdict = { tier: 'Smooth & Ideal', badgeClass: 'badge-smooth', color: 'var(--ctp-green)', text: '60+ FPS Smooth' };
  else if (effectiveFps >= 45) verdict = { tier: 'Playable', badgeClass: 'badge-playable', color: 'var(--ctp-yellow)', text: '45-59 FPS Playable' };
  else if (effectiveFps >= 30) verdict = { tier: 'Console Baseline', badgeClass: 'badge-warning', color: 'var(--ctp-peach)', text: '30-44 FPS Console Pace' };
  else verdict = { tier: 'Stuttering / Heavy', badgeClass: 'badge-danger', color: 'var(--ctp-red)', text: '<30 FPS Struggling' };

  // 10. Tips
  const tips = [];
  if (isAnchored) tips.push(`Using real-world internet benchmark data for absolute accuracy.`);
  if (isVramBottleneck) tips.push(`VRAM Deficit (${gpu.vram}GB vs ${requiredVram.toFixed(1)}GB required): Lower texture quality.`);
  if (isRamBottleneck) tips.push(`RAM Deficit detected: Upgrading to 16GB/32GB will stabilize frametimes.`);
  if (bottleneck.culprit === 'CPU' && resolution === '1080p') tips.push(`CPU limited: Increase settings or enable 1440p with little FPS loss.`);
  if (bottleneck.culprit === 'GPU' && effectiveFps < 60 && upscaling === 'off') tips.push(`Turn on DLSS/FSR Quality to boost framerate by up to ~35%.`);
  if (rayTracing && rtWarning) tips.push(`GPU lacks dedicated RT cores: Turn off Ray Tracing for a massive FPS recovery.`);
  if (pathTracing && ptWarning) tips.push(`GPU lacks Path Tracing hardware capability: Turn off Path Tracing to restore normal framerates.`);

  return {
    avgFps: effectiveFps,
    low1PercentFps,
    frametimeMs,
    verdict,
    bottleneck,
    requiredVram: requiredVram.toFixed(1),
    gpuVram: gpu.vram,
    isVramBottleneck,
    tips,
    isAnchored
  };
}

// Calculate comparison across all 3 resolutions
export function calculateResolutionComparison(game: any, gpu: any, cpu: any, ram: any, settings: any = {}, benchmarkData: BenchmarkData | null = null) {
  const resolutions = ['1080p', '1440p', '4k'];
  if (!gpu || !cpu) {
    return resolutions.map(res => ({
      resolution: res,
      avgFps: '—',
      low1PercentFps: '—',
      verdict: { tier: 'Pending', text: 'Select Specs' },
      isCurrent: res === (settings.resolution || '1080p')
    }));
  }

  return resolutions.map(res => {
    const resResult = calculateFps(game, gpu, cpu, ram, { ...settings, resolution: res }, benchmarkData);
    return {
      resolution: res,
      avgFps: resResult.avgFps,
      low1PercentFps: resResult.low1PercentFps,
      verdict: resResult.verdict,
      isCurrent: res === settings.resolution
    };
  });
}
