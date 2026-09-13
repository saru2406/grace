const API_KEY = '4cfb690f7e0a2aace2617077f4a42aac';
const API_BASE_PROXY = '/api/steamgriddb';
const API_BASE_DIRECT = 'https://www.steamgriddb.com/api/v2';

const cache = new Map();

/**
 * Perform an authenticated request to SteamGridDB with proxy and fallback
 */
async function fetchSteamGrid(endpoint) {
  if (cache.has(endpoint)) {
    return cache.get(endpoint);
  }

  // 1. Try local dev proxy first (avoids CORS and injects headers securely)
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
    console.warn('Local SteamGridDB proxy unavailable, attempting direct fallback...', err);
  }

  // 2. Fallback to direct call with Bearer token
  try {
    const res = await fetch(`${API_BASE_DIRECT}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      cache.set(endpoint, data);
      return data;
    }
  } catch (corsErr) {
    // 3. Fallback via public CORS proxy if direct browser fetch blocked by CORS
    try {
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(`${API_BASE_DIRECT}${endpoint}`)}`;
      const res = await fetch(corsProxyUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        cache.set(endpoint, data);
        return data;
      }
    } catch (proxyErr) {
      console.error('All SteamGridDB fetch attempts failed:', proxyErr);
    }
  }

  return null;
}

/**
 * Search games by query term
 */
export async function searchGames(query) {
  if (!query || query.trim().length < 2) return [];
  const endpoint = `/search/autocomplete/${encodeURIComponent(query.trim())}`;
  const response = await fetchSteamGrid(endpoint);
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
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
