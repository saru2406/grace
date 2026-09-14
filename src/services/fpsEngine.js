export function calculateFps(game, gpu, cpu, ram, settings = {}) {
  // If hardware is not yet selected, return unconfigured state
  if (!gpu || !cpu) {
    return {
      isConfigured: false,
      avgFps: null,
      low1PercentFps: null,
      frametimeMs: null,
      verdict: {
        tier: 'Select Specs',
        badgeClass: 'badge-unselected',
        color: 'var(--ctp-subtext0)',
        text: 'Awaiting Specs'
      },
      bottleneck: {
        culprit: 'None',
        percentage: 0,
        label: 'Awaiting Specs',
        color: 'var(--ctp-subtext0)',
        desc: 'Choose your GPU and CPU on the right to estimate framerates.'
      },
      requiredVram: 'N/A',
      gpuVram: 0,
      isVramBottleneck: false,
      tips: [
        'Please select a Graphics Card (GPU) and Processor (CPU) from the right sidebar, or click one of the Quick Builds above to start estimating framerates!'
      ]
    };
  }

  const { resolution = '1080p', preset = 'high', rayTracing = false, pathTracing = false, upscaling = 'off' } = settings;

  // 1. Resolution Load Multiplier (affects GPU primarily)
  const resMultipliers = {
    '1080p': 1.0,
    '1440p': 0.68,
    '4k': 0.42
  };
  const resMult = resMultipliers[resolution] || 1.0;

  // 2. Graphics Preset Multiplier
  const presetMultipliers = {
    'low': 1.38,
    'medium': 1.15,
    'high': 1.0,
    'ultra': 0.82
  };
  const presetMult = presetMultipliers[preset] || 1.0;

  // 3. Ray Tracing & Path Tracing Multipliers
  let rtMult = 1.0;
  let rtWarning = false;
  if (rayTracing && (game.supportsRayTracing || game.supportsPathTracing)) {
    if (gpu.rtScore <= 0) {
      rtMult = 0.18; // Unsupported or software emulation penalty
      rtWarning = true;
    } else {
      const rtEfficacy = Math.min(1.4, gpu.rtScore / 100);
      const baseImpact = game.rtImpact || 0.40;
      const mitigatedImpact = baseImpact * (1.1 - 0.22 * rtEfficacy);
      rtMult = Math.max(0.25, 1 - mitigatedImpact);
    }
  }

  let ptMult = 1.0;
  let ptWarning = false;
  if (pathTracing && (game.supportsPathTracing || game.supportsRayTracing)) {
    if (gpu.rtScore < 60) {
      ptMult = 0.12; // Massive penalty for unsupported/weak RT hardware on Path Tracing
      ptWarning = true;
    } else {
      const ptEfficacy = Math.min(1.5, gpu.rtScore / 110);
      const basePtImpact = game.ptImpact || 0.62;
      const mitigatedPtImpact = basePtImpact * (1.1 - 0.20 * ptEfficacy);
      ptMult = Math.max(0.20, 1 - mitigatedPtImpact);
    }
  }

  // 4. Upscaling Multiplier (DLSS / FSR / XeSS)
  // Upscaling only accelerates GPU rendering
  const upscalingMultipliers = {
    'off': 1.0,
    'quality': 1.32,
    'balanced': 1.48,
    'performance': 1.70
  };
  const upscalingMult = upscalingMultipliers[upscaling] || 1.0;

  // 5. Raw GPU Potential FPS
  const gpuRelative = gpu.score / 100;
  const rawGpuFps = game.baseFps * gpuRelative * resMult * presetMult * rtMult * ptMult * upscalingMult;

  // 6. CPU Ceiling FPS
  // Resolution does NOT decrease CPU frame limits, but game CPU intensity scales it
  const cpuRelative = cpu.score / 100;
  const baseCpuCap = (cpu.fpsCap || 200) / (game.cpuIntensity || 1.0);
  const rawCpuFps = baseCpuCap * (0.4 + 0.6 * cpuRelative);

  // 7. VRAM Demand & Penalties
  let requiredVram = game.vramAt1080p || 6.0;
  if (resolution === '1440p') requiredVram = game.vramAt1440p || 8.5;
  if (resolution === '4k') requiredVram = game.vramAt4k || 12.0;
  if (preset === 'ultra') requiredVram *= 1.15;
  if (pathTracing && (game.supportsPathTracing || game.supportsRayTracing)) requiredVram *= 1.40;
  else if (rayTracing && (game.supportsRayTracing || game.supportsPathTracing)) requiredVram *= 1.20;

  let vramPenaltyAvg = 1.0;
  let vramPenalty1Low = 1.0;
  let isVramBottleneck = false;
  if (gpu.vram < requiredVram) {
    const deficit = requiredVram - gpu.vram;
    isVramBottleneck = true;
    vramPenaltyAvg = Math.max(0.55, 1.0 - deficit * 0.07);
    vramPenalty1Low = Math.max(0.28, 1.0 - deficit * 0.16); // Severe 1% low drop when paging to system RAM
  }

  // 8. RAM Penalties
  let ramPenaltyAvg = 1.0;
  let ramPenalty1Low = 1.0;
  let isRamBottleneck = false;
  if (ram < (game.ramRecommended || 16)) {
    isRamBottleneck = true;
    ramPenaltyAvg = 0.88;
    ramPenalty1Low = 0.68;
  } else if (ram >= 32) {
    ramPenaltyAvg = 1.03;
    ramPenalty1Low = 1.05;
  }

  // 9. Bottleneck Resolution & Effective FPS
  let bottleneck = {
    culprit: 'Balanced',
    percentage: 0,
    label: 'Balanced Rig',
    color: 'var(--ctp-green)',
    desc: 'CPU and GPU are harmoniously paired for this title.'
  };

  let effectiveFps;
  if (rawGpuFps > rawCpuFps * 1.1) {
    // CPU cannot keep up with GPU
    effectiveFps = rawCpuFps * 1.02;
    const pct = Math.min(65, Math.round(((rawGpuFps - rawCpuFps) / rawGpuFps) * 100));
    bottleneck = {
      culprit: 'CPU',
      percentage: pct,
      label: `CPU Limited (${pct}%)`,
      color: 'var(--ctp-peach)',
      desc: `Your GPU has more headroom, but the CPU limits framerate at this resolution.`
    };
  } else if (rawCpuFps > rawGpuFps * 1.15) {
    // GPU is the primary limiter (Standard desirable scenario in gaming)
    effectiveFps = rawGpuFps;
    const pct = Math.min(85, Math.round(((rawCpuFps - rawGpuFps) / rawCpuFps) * 100));
    bottleneck = {
      culprit: 'GPU',
      percentage: pct,
      label: `GPU Bound (${pct}%)`,
      color: 'var(--ctp-blue)',
      desc: `Graphics card is operating at full potential. Ideal GPU utilization.`
    };
  } else {
    // Balanced
    effectiveFps = (rawGpuFps + rawCpuFps) / 2;
  }

  // Apply VRAM and RAM penalties
  effectiveFps = Math.max(12, Math.round(effectiveFps * vramPenaltyAvg * ramPenaltyAvg));

  // 10. 1% Low FPS Calculation
  let lowRatio = 0.74; // Standard frametime variance
  if (cpu.score >= 140) lowRatio += 0.05; // 3D V-Cache or high IPC improves 1% lows
  if (isVramBottleneck) lowRatio *= vramPenalty1Low;
  if (isRamBottleneck) lowRatio *= ramPenalty1Low;

  let low1PercentFps = Math.max(8, Math.round(effectiveFps * lowRatio));

  // 11. Frame Time in Milliseconds
  const frametimeMs = (1000 / effectiveFps).toFixed(1);

  // 12. Performance Tier Verdict
  let verdict = {
    tier: 'Smooth',
    badgeClass: 'badge-smooth',
    color: 'var(--ctp-green)',
    text: '60+ FPS Smooth'
  };

  if (effectiveFps >= 120) {
    verdict = {
      tier: 'Ultra High Refresh',
      badgeClass: 'badge-ultra',
      color: '#ffffff',
      text: '120+ FPS Ultra Refresh'
    };
  } else if (effectiveFps >= 60) {
    verdict = {
      tier: 'Smooth & Ideal',
      badgeClass: 'badge-smooth',
      color: 'var(--ctp-green)',
      text: '60+ FPS Smooth'
    };
  } else if (effectiveFps >= 45) {
    verdict = {
      tier: 'Playable',
      badgeClass: 'badge-playable',
      color: 'var(--ctp-yellow)',
      text: '45-59 FPS Playable'
    };
  } else if (effectiveFps >= 30) {
    verdict = {
      tier: 'Console Baseline',
      badgeClass: 'badge-warning',
      color: 'var(--ctp-peach)',
      text: '30-44 FPS Console Pace'
    };
  } else {
    verdict = {
      tier: 'Stuttering / Heavy',
      badgeClass: 'badge-danger',
      color: 'var(--ctp-red)',
      text: '<30 FPS Struggling'
    };
  }

  // 13. Tailored Optimization Advice
  const tips = [];
  if (isVramBottleneck) {
    tips.push(`VRAM Deficit (${gpu.vram}GB vs ${requiredVram.toFixed(1)}GB required): Lower texture quality or resolution to avoid sudden stutters.`);
  }
  if (isRamBottleneck) {
    tips.push(`8GB RAM detected: Upgrading to 16GB or 32GB will dramatically stabilize 1% low frametimes.`);
  }
  if (bottleneck.culprit === 'CPU' && resolution === '1080p') {
    tips.push(`CPU limited: You can increase settings to High/Ultra or enable 1440p with little to no FPS loss.`);
  }
  if (bottleneck.culprit === 'GPU' && effectiveFps < 60 && upscaling === 'off') {
    tips.push(`Turn on DLSS/FSR Quality to boost framerate by up to ~30% with minimal image degradation.`);
  }
  if (rayTracing && rtWarning) {
    tips.push(`GPU lacks dedicated RT cores: Turn off Ray Tracing for a massive FPS recovery.`);
  }
  if (pathTracing && ptWarning) {
    tips.push(`GPU lacks Path Tracing hardware capability: Turn off Path Tracing to restore normal framerates.`);
  }

  return {
    avgFps: effectiveFps,
    low1PercentFps,
    frametimeMs,
    verdict,
    bottleneck,
    requiredVram: requiredVram.toFixed(1),
    gpuVram: gpu.vram,
    isVramBottleneck,
    tips
  };
}

// Calculate comparison across all 3 resolutions (1080p, 1440p, 4K) for a single game
export function calculateResolutionComparison(game, gpu, cpu, ram, settings = {}) {
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
    const resResult = calculateFps(game, gpu, cpu, ram, { ...settings, resolution: res });
    return {
      resolution: res,
      avgFps: resResult.avgFps,
      low1PercentFps: resResult.low1PercentFps,
      verdict: resResult.verdict,
      isCurrent: res === settings.resolution
    };
  });
}
