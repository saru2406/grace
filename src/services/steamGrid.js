const API_BASE_PROXY = '/api/steamgriddb';

const cache = new Map();

/**
 * Perform a request through the host-side SteamGridDB proxy.
 */
async function fetchSteamGrid(endpoint) {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  try {
    const res = await fetch(`${API_BASE_PROXY}${endpoint}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      cache.set(endpoint, data);
      return data;
    }
  } catch (err) {
    console.warn('SteamGridDB proxy request failed:', err);
  }

  return null;
}

/**
 * Search games by query term
 */
export async function searchGames(query) {
  if (!query || query.trim().length < 1) return [];
  const rawQ = query.trim().toLowerCase();
  const endpoint = `/search/autocomplete/${encodeURIComponent(query.trim())}`;
  const response = await fetchSteamGrid(endpoint);
  let results = (response && response.success && Array.isArray(response.data)) ? response.data : [];

  // Alias lookup to assist global search for common shorthand like "re", "re9", "mc", "cs"
  const aliases = {
    're': 'Resident Evil',
    're9': 'Resident Evil Requiem',
    'requiem': 'Resident Evil Requiem',
    're requiem': 'Resident Evil Requiem',
    'resident evil requiem': 'Resident Evil Requiem',
    're 9': 'Resident Evil Requiem',
    'resident evil 9': 'Resident Evil Requiem',
    're4': 'Resident Evil 4',
    're4r': 'Resident Evil 4',
    're8': 'Resident Evil Village',
    'mc': 'Minecraft',
    'mine': 'Minecraft',
    'cs': 'Counter-Strike 2',
    'cs2': 'Counter-Strike 2',
    'csgo': 'Counter-Strike: Global Offensive',
    'rdr': 'Red Dead Redemption 2',
    'rdr2': 'Red Dead Redemption 2',
    'gta': 'Grand Theft Auto',
    'gta6': 'Grand Theft Auto VI',
    'gtavi': 'Grand Theft Auto VI',
    'cp': 'Cyberpunk 2077',
    'cp2077': 'Cyberpunk 2077',
    'cyber': 'Cyberpunk 2077',
    'sm2': 'Space Marine 2',
    'hd2': 'Helldivers 2',
    'bg3': "Baldur's Gate 3",
    'mhw': 'Monster Hunter: World'
  };

  if (aliases[rawQ]) {
    try {
      const aliasEndpoint = `/search/autocomplete/${encodeURIComponent(aliases[rawQ])}`;
      const aliasRes = await fetchSteamGrid(aliasEndpoint);
      if (aliasRes && aliasRes.success && Array.isArray(aliasRes.data)) {
        const seen = new Set(results.map(r => r.id));
        const aliasItems = aliasRes.data.filter(r => !seen.has(r.id));
        results = [...aliasItems, ...results];
      }
    } catch (err) {
      console.warn('Alias search fallback error:', err);
    }
  }

  return results;
}

/**
/**
 * Get grid poster cover (600x900) for a game ID or steamAppId
 */
export async function getGameGrid(gameId, steamAppId) {
  if (gameId) {
    const endpoint = `/grids/game/${gameId}?dimensions=600x900`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url,
        author: item.author?.name
      };
    }
  }

  if (steamAppId) {
    const endpoint = `/grids/steam/${steamAppId}?dimensions=600x900`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url,
        author: item.author?.name
      };
    }
    return {
      thumb: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900.jpg`,
      url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900.jpg`
    };
  }

  return null;
}

/**
 * Get wide hero banner for a game ID or steamAppId (from SteamGridDB heroes endpoint)
 */
export async function getGameHero(gameId, steamAppId) {
  if (gameId) {
    const endpoint = `/heroes/game/${gameId}`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url
      };
    }
  }

  if (steamAppId) {
    const endpoint = `/heroes/steam/${steamAppId}`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url
      };
    }
    // High-resolution Steam library hero fallback
    return {
      thumb: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`,
      url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_hero.jpg`
    };
  }

  return null;
}

/**
 * Get wide cover art (landscape capsule or hero) from SteamGridDB or Steam CDN
 */
export async function getGameWideCover(gameId, steamAppId) {
  // 1. Try SteamGridDB hero first
  const hero = await getGameHero(gameId, steamAppId);
  if (hero && hero.url) {
    return hero;
  }

  // 2. Try SteamGridDB wide grids (920x430 or 460x215)
  if (gameId) {
    const endpoint = `/grids/game/${gameId}?dimensions=920x430,460x215`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url
      };
    }
  }

  if (steamAppId) {
    const endpoint = `/grids/steam/${steamAppId}?dimensions=920x430,460x215`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const item = response.data[0];
      return {
        thumb: item.thumb,
        url: item.url
      };
    }

    // Official Steam header fallback
    return {
      thumb: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`,
      url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`
    };
  }

  return null;
}

/**
 * Get transparent logo from SteamGridDB API or Steam CDN
/**
 * Get transparent logo from SteamGridDB API or Steam CDN
 * Supports full game title lookup to ensure exact matching for all games.
 */
export async function getGameLogo(gameId, steamAppId, gameTitle) {
  // 1. Try SteamGridDB by gameId
  if (gameId) {
    const endpoint = `/logos/game/${gameId}`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const official = response.data.find(l => l.style === 'official' && !l.epilepsy) ||
                       response.data.find(l => !l.epilepsy) ||
                       response.data[0];
      return {
        thumb: official.thumb,
        url: official.url
      };
    }
  }

  // 2. Try SteamGridDB by steamAppId
  if (steamAppId) {
    const endpoint = `/logos/steam/${steamAppId}`;
    const response = await fetchSteamGrid(endpoint);
    if (response && response.success && response.data?.length > 0) {
      const official = response.data.find(l => l.style === 'official' && !l.epilepsy) ||
                       response.data.find(l => !l.epilepsy) ||
                       response.data[0];
      return {
        thumb: official.thumb,
        url: official.url
      };
    }

    // 3. Official Steam transparent PNG logo fallback
    return {
      thumb: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/logo.png`,
      url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/logo.png`
    };
  }

  // 3. Fallback: Search SteamGridDB by full game title with exact matching & multi-word support
  if (gameTitle && typeof gameTitle === 'string' && gameTitle.trim().length > 0) {
    try {
      const cleanTitle = gameTitle.trim();
      // Remove colons and excess punctuation that can disrupt SteamGridDB autocomplete
      const sanitizedTitle = cleanTitle.replace(/[:\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
      
      let searchRes = await fetchSteamGrid(`/search/autocomplete/${encodeURIComponent(sanitizedTitle)}`);
      if (!searchRes || !searchRes.success || !Array.isArray(searchRes.data) || searchRes.data.length === 0) {
        searchRes = await fetchSteamGrid(`/search/autocomplete/${encodeURIComponent(cleanTitle)}`);
      }

      if (searchRes && searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
        const normTarget = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 3a. Exact alphanumeric match (e.g. "resident evil: requiem" matches "Resident Evil Requiem")
        let bestMatch = searchRes.data.find(item => {
          const normItem = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normItem === normTarget;
        });

        // 3b. Match all significant words (ensure distinctive words like "requiem" are required)
        if (!bestMatch) {
          const keyWords = cleanTitle.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
          bestMatch = searchRes.data.find(item => {
            const itemLower = item.name.toLowerCase();
            return keyWords.every(kw => itemLower.includes(kw));
          });
        }

        // 3c. If still not matched, check substring containment
        if (!bestMatch) {
          bestMatch = searchRes.data.find(item => {
            const itemLower = item.name.toLowerCase();
            const targetLower = cleanTitle.toLowerCase();
            return itemLower.includes(targetLower) || targetLower.includes(itemLower);
          });
        }

        if (bestMatch && bestMatch.id) {
          const logoRes = await fetchSteamGrid(`/logos/game/${bestMatch.id}`);
          if (logoRes && logoRes.success && logoRes.data?.length > 0) {
            const official = logoRes.data.find(l => l.style === 'official' && !l.epilepsy) ||
                             logoRes.data.find(l => !l.epilepsy) ||
                             logoRes.data[0];
            return {
              thumb: official.thumb,
              url: official.url
            };
          }
        }
      }
    } catch (err) {
      console.warn('Logo search fallback error for', gameTitle, err);
    }
  }

  return null;
}


