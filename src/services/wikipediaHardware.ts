/**
 * Wikipedia Hardware Service
 * Dynamically resolves, fetches, and caches high-resolution hardware photography
 * from Wikipedia and Wikimedia Commons for GPUs and CPUs.
 */

// Verified, high-resolution authentic Wikipedia & Wikimedia Commons images by series and architecture
const WIKI_HARDWARE_IMAGES = {
  // NVIDIA GPUs
  'rtx-50': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/RTX_5090_-_du%C5%BCa_wydajno%C5%9B%C4%87_du%C5%BCym_kosztem_%282160p_30fps_VP9_LQ-96kbit_AAC%29-00.00.04.100.png/960px-RTX_5090_-_du%C5%BCa_wydajno%C5%9B%C4%87_du%C5%BCym_kosztem_%282160p_30fps_VP9_LQ-96kbit_AAC%29-00.00.04.100.png',
  'rtx-40': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Leistungsanalyse_NVIDIA_GeForce_RTX_4090_%28Geekerwan%29_02_cropped.jpg/960px-Leistungsanalyse_NVIDIA_GeForce_RTX_4090_%28Geekerwan%29_02_cropped.jpg',
  'rtx-30': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/RTX_3090_Founders_Edition.jpg/960px-RTX_3090_Founders_Edition.jpg',
  'rtx-20': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/NVIDIA_Titan_RTX_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_001.png/960px-NVIDIA_Titan_RTX_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_001.png',
  'gtx-16': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/ASUS_TUF_Gaming_X3_20190601.jpg/960px-ASUS_TUF_Gaming_X3_20190601.jpg',
  'gtx-10': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/GeForce_GTX_1080ti_Front.jpg/960px-GeForce_GTX_1080ti_Front.jpg',
  'gtx-9': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Nvidia%4028nm%40Maxwell%40GM200%40GeForce_GTX_980_Ti%40A_TAIWAN_1542A1_TFH800.COW_GM200-310-A1_DSC00002.jpg/960px-Nvidia%4028nm%40Maxwell%40GM200%40GeForce_GTX_980_Ti%40A_TAIWAN_1542A1_TFH800.COW_GM200-310-A1_DSC00002.jpg',
  'gtx-7': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/NVIDIA_GeForce_GTX_TITAN.jpg/960px-NVIDIA_GeForce_GTX_TITAN.jpg',

  // AMD GPUs
  'rx-7': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Sapphire_AMD_Radeon_RX_7900_XTX.jpg/960px-Sapphire_AMD_Radeon_RX_7900_XTX.jpg',
  'rx-6': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Amd-radeon-rx6800xt-from2020year-front.jpg/960px-Amd-radeon-rx6800xt-from2020year-front.jpg',
  'rx-5000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/AMD%407nm%40RDNA_1th_gen%40Navi10%40Radeon_RX_5700_XT%40215-0917210%40_DSCx1%40NIR.jpg/960px-AMD%407nm%40RDNA_1th_gen%40Navi10%40Radeon_RX_5700_XT%40215-0917210%40_DSCx1%40NIR.jpg',
  'rx-500': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/XFX_AMD_Radeon_RX_570_RS_8GB_XXX_Edition_-_top.jpg/960px-XFX_AMD_Radeon_RX_570_RS_8GB_XXX_Edition_-_top.jpg',
  'rx-vega': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/AMD%4014nm%40GCN_5th_gen%40Vega10%40Radeon_RX_Vega_64%40ES-Sample%40_DSC01129.jpg/960px-AMD%4014nm%40GCN_5th_gen%40Vega10%40Radeon_RX_Vega_64%40ES-Sample%40_DSC01129.jpg',

  // Intel GPUs
  'arc-': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Intel_Arc_A770_front.jpg/960px-Intel_Arc_A770_front.jpg',
  'intel-arc': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Intel_Arc_A770_front.jpg/960px-Intel_Arc_A770_front.jpg',
  'intel-iris': '/components/gpu-intel.jpg',
  'intel-uhd': '/components/gpu-intel.jpg',

  // AMD CPUs
  'ryzen-9000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Video_zum_AMD_Ryzen_7_9800X3D_%28ZMASLO%29_31.png/960px-Video_zum_AMD_Ryzen_7_9800X3D_%28ZMASLO%29_31.png',
  'ryzen-7000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Video_zum_AMD_Ryzen_7_9800X3D_%28ZMASLO%29_31.png/960px-Video_zum_AMD_Ryzen_7_9800X3D_%28ZMASLO%29_31.png',
  'ryzen-5000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Ryzen3pro2100ge-ph-gerald.jpg/960px-Ryzen3pro2100ge-ph-gerald.jpg',
  'ryzen-3000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Ryzen3pro2100ge-ph-gerald.jpg/960px-Ryzen3pro2100ge-ph-gerald.jpg',
  'ryzen-2000': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Ryzen3pro2100ge-ph-gerald.jpg/960px-Ryzen3pro2100ge-ph-gerald.jpg',

  // Intel CPUs
  'intel-14': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Intel_Core_i7_13700K.jpg/960px-Intel_Core_i7_13700K.jpg',
  'intel-13': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Intel_Core_i7_13700K.jpg/960px-Intel_Core_i7_13700K.jpg',
  'intel-12': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/2023_Intel_Core_i7_12700KF_%285%29.jpg/960px-2023_Intel_Core_i7_12700KF_%285%29.jpg',
  'intel-10': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Intel_Core_i5_-10500TE_top_IMGP4955_smial_wp.JPG/960px-Intel_Core_i5_-10500TE_top_IMGP4955_smial_wp.JPG',
  'intel-8': 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Intel_i7_8700K.jpg/960px-Intel_i7_8700K.jpg'
};

// In-memory cache for dynamic Wikipedia requests during session
const memoryCache = new Map();

/**
 * Maps a hardware object to its series key for instant Wikipedia photo retrieval
 */
export function getHardwareWikiDefault(item, type = 'gpu') {
  if (!item || !item.id) return null;
  const id = item.id.toLowerCase();

  if (type === 'gpu') {
    if (id.startsWith('rtx-50')) return WIKI_HARDWARE_IMAGES['rtx-50'];
    if (id.startsWith('rtx-40')) return WIKI_HARDWARE_IMAGES['rtx-40'];
    if (id.startsWith('rtx-30')) return WIKI_HARDWARE_IMAGES['rtx-30'];
    if (id.startsWith('rtx-20')) return WIKI_HARDWARE_IMAGES['rtx-20'];
    if (id.startsWith('gtx-16')) return WIKI_HARDWARE_IMAGES['gtx-16'];
    if (id.startsWith('gtx-10')) return WIKI_HARDWARE_IMAGES['gtx-10'];
    if (id.startsWith('gtx-9')) return WIKI_HARDWARE_IMAGES['gtx-9'];
    if (id.startsWith('gtx-7')) return WIKI_HARDWARE_IMAGES['gtx-7'];

    if (id.startsWith('rx-79') || id.startsWith('rx-78') || id.startsWith('rx-77') || id.startsWith('rx-76')) return WIKI_HARDWARE_IMAGES['rx-7'];
    if (id.startsWith('rx-6')) return WIKI_HARDWARE_IMAGES['rx-6'];
    if (id.startsWith('rx-57') || id.startsWith('rx-56') || id.startsWith('rx-55')) return WIKI_HARDWARE_IMAGES['rx-5000'];
    if (id.startsWith('rx-59') || id.startsWith('rx-58') || id.startsWith('rx-550')) return WIKI_HARDWARE_IMAGES['rx-500'];
    if (id.includes('vega')) return WIKI_HARDWARE_IMAGES['rx-vega'];

    if (id.startsWith('arc-')) return WIKI_HARDWARE_IMAGES['arc-'];
    if (id.includes('intel-arc')) return WIKI_HARDWARE_IMAGES['intel-arc'];
    if (id.includes('iris')) return WIKI_HARDWARE_IMAGES['intel-iris'];
    if (id.includes('uhd')) return WIKI_HARDWARE_IMAGES['intel-uhd'];

    if (item.brand === 'NVIDIA') return WIKI_HARDWARE_IMAGES['rtx-40'];
    if (item.brand === 'AMD') return WIKI_HARDWARE_IMAGES['rx-7'];
    if (item.brand === 'Intel') return WIKI_HARDWARE_IMAGES['arc-'];
  } else {
    // CPU
    if (id.startsWith('r7-98') || id.startsWith('r9-9')) return WIKI_HARDWARE_IMAGES['ryzen-9000'];
    if (id.startsWith('r9-7') || id.startsWith('r7-7') || id.startsWith('r5-7')) return WIKI_HARDWARE_IMAGES['ryzen-7000'];
    if (id.startsWith('r7-5') || id.startsWith('r5-5')) return WIKI_HARDWARE_IMAGES['ryzen-5000'];
    if (id.startsWith('r5-3') || id.includes('3600')) return WIKI_HARDWARE_IMAGES['ryzen-3000'];
    if (id.startsWith('r7-2') || id.includes('2700')) return WIKI_HARDWARE_IMAGES['ryzen-2000'];

    if (id.includes('14900') || id.includes('14700') || id.includes('14600')) return WIKI_HARDWARE_IMAGES['intel-14'];
    if (id.includes('13900') || id.includes('13700') || id.includes('13600') || id.includes('13400')) return WIKI_HARDWARE_IMAGES['intel-13'];
    if (id.includes('12700') || id.includes('12600') || id.includes('12400') || id.includes('12100')) return WIKI_HARDWARE_IMAGES['intel-12'];
    if (id.includes('10900') || id.includes('10700') || id.includes('10400')) return WIKI_HARDWARE_IMAGES['intel-10'];
    if (id.includes('8700') || id.includes('8400')) return WIKI_HARDWARE_IMAGES['intel-8'];

    if (item.brand === 'AMD') return WIKI_HARDWARE_IMAGES['ryzen-7000'];
    if (item.brand === 'Intel') return WIKI_HARDWARE_IMAGES['intel-13'];
  }

  return null;
}

/**
 * Dynamically queries Wikipedia MediaWiki Search & Summary API for the specific hardware piece.
 * Returns { url, sourceTitle, isWiki: true }
 */
export async function fetchWikipediaHardwareImage(item, type = 'gpu') {
  if (!item || !item.id) return null;

  const cacheKey = `wiki_img_${type}_${item.id}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.url) {
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (e) {}

  // Fallback default from verified Wikipedia Commons registry
  const fallbackUrl = getHardwareWikiDefault(item, type);

  // Generate candidate search queries for Wikipedia
  const cleanName = (item.name || '')
    .replace(/\(.*?\)/g, '')
    .replace(/NVIDIA GeForce/i, 'GeForce')
    .replace(/AMD Radeon/i, 'Radeon')
    .trim();

  const searchCandidates = [
    cleanName,
    item.name ? item.name.replace(/\(.*?\)/g, '').trim() : '',
    type === 'gpu' ? `${item.brand || ''} ${cleanName}` : `${cleanName} processor`
  ].filter(Boolean);

  for (const query of searchCandidates) {
    try {
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const res = await fetch(apiUrl);
      if (!res.ok) continue;

      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      pages.sort((a, b) => (a.index || 99) - (b.index || 99));

      for (const p of pages) {
        if (p.thumbnail && p.thumbnail.source) {
          const result = {
            url: p.thumbnail.source,
            sourceTitle: p.title,
            isWiki: true
          };
          memoryCache.set(cacheKey, result);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}
          return result;
        }
      }
    } catch (err) {
      // Network failure or offline
      break;
    }
  }

  // Return mapped default if live search found nothing
  if (fallbackUrl) {
    const defaultResult = {
      url: fallbackUrl,
      sourceTitle: item.name,
      isWiki: true
    };
    memoryCache.set(cacheKey, defaultResult);
    return defaultResult;
  }

  return null;
}
