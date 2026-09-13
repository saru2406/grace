/**
 * IGDB (Internet Game Database) API Service
 * Requests are proxied through the host/server so credentials stay off the client bundle.
 */

const IGDB_PROXY_BASE = '/api/igdb';

const igdbCache = new Map();

/**
 * Core fetch helper for IGDB API
 */
async function fetchIGDB(endpoint, body) {
  const cacheKey = `${endpoint}::${body}`;
  if (igdbCache.has(cacheKey)) {
    return igdbCache.get(cacheKey);
  }

  try {
    const res = await fetch(`${IGDB_PROXY_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body
    });

    if (!res.ok) {
      console.warn(`IGDB fetch failed: ${res.status}`, endpoint);
      return null;
    }

    const data = await res.json();
    igdbCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('IGDB fetch error:', err);
    return null;
  }
}

/**
 * Search IGDB for a game by title.
 * Returns the best match with full details.
 */
export async function searchIGDBGame(title) {
  if (!title) return null;

  // Clean and normalize the title for search
  const cleanTitle = title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();

  const body = `
    search "${cleanTitle}";
    fields name, summary, first_release_date, genres.name, themes.name, 
           rating, rating_count, aggregated_rating, aggregated_rating_count,
           involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
           platforms.name, game_modes.name, player_perspectives.name,
           cover.url, screenshots.url, videos.video_id,
           websites.url, websites.category,
           similar_games.name,
           category, status, storyline,
           multiplayer_modes.onlinecoop, multiplayer_modes.offlinecoop, multiplayer_modes.onlinemax;
    where category = 0;
    limit 5;
  `;

  const results = await fetchIGDB('/games', body);
  if (!results || !Array.isArray(results) || results.length === 0) return null;

  // Find the best match by normalizing names
  const normQuery = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let best = null;
  let bestScore = -1;

  for (const game of results) {
    if (!game.name) continue;
    const normName = game.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let score = 0;
    if (normName === normQuery) score = 100;
    else if (normName.includes(normQuery) || normQuery.includes(normName)) score = 60;
    else {
      // Check word overlap
      const queryWords = normQuery.split(/(?=[A-Z])|(?<=[a-z])(?=[0-9])/).filter(Boolean);
      const nameWords = normName.split(/(?=[A-Z])|(?<=[a-z])(?=[0-9])/).filter(Boolean);
      const overlap = queryWords.filter(w => normName.includes(w)).length;
      score = Math.round((overlap / Math.max(queryWords.length, 1)) * 50);
    }
    
    // Boost score for games with ratings (more likely to be a major title)
    if (game.rating_count > 100) score += 5;
    if (game.aggregated_rating_count > 10) score += 5;

    if (score > bestScore) {
      bestScore = score;
      best = game;
    }
  }

  return best || results[0];
}

/**
 * Get enriched game data from IGDB for a given game title.
 * Returns a structured object with all relevant fields normalized
 * for use throughout the app.
 */
export async function getIGDBGameDetails(title) {
  const game = await searchIGDBGame(title);
  if (!game) return null;

  // Parse developer and publisher from involved companies
  let developer = null;
  let publisher = null;
  if (game.involved_companies && Array.isArray(game.involved_companies)) {
    for (const ic of game.involved_companies) {
      if (!ic.company?.name) continue;
      if (ic.developer && !developer) developer = ic.company.name;
      if (ic.publisher && !publisher) publisher = ic.company.name;
    }
  }

  // Parse genres
  const genres = game.genres?.map(g => g.name).filter(Boolean) || [];
  const themes = game.themes?.map(t => t.name).filter(Boolean) || [];

  // Parse release date (IGDB uses Unix timestamps)
  let releaseDate = null;
  let releaseYear = null;
  if (game.first_release_date) {
    const d = new Date(game.first_release_date * 1000);
    releaseYear = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    releaseDate = `${releaseYear}-${mm}-${dd}`;
  }

  // Parse rating (IGDB uses 0-100 scale from Metacritic via aggregated_rating)
  const igdbRating = game.rating ? Math.round(game.rating) : null;
  const metacriticRating = game.aggregated_rating ? Math.round(game.aggregated_rating) : null;

  // Parse cover URL (IGDB returns //images.igdb.com/... format)
  let coverUrl = null;
  if (game.cover?.url) {
    coverUrl = 'https:' + game.cover.url.replace('t_thumb', 't_cover_big');
  }

  // Parse screenshots
  const screenshots = (game.screenshots || [])
    .slice(0, 6)
    .map(s => s.url ? 'https:' + s.url.replace('t_thumb', 't_screenshot_big') : null)
    .filter(Boolean);

  // Parse YouTube video IDs
  const videoIds = (game.videos || [])
    .map(v => v.video_id)
    .filter(Boolean);

  // Parse platforms
  const platforms = (game.platforms || []).map(p => p.name).filter(Boolean);

  // Parse game modes
  const gameModes = (game.game_modes || []).map(m => m.name).filter(Boolean);

  // Check multiplayer info
  let hasOnlineCoop = false;
  let hasOfflineCoop = false;
  if (game.multiplayer_modes && Array.isArray(game.multiplayer_modes)) {
    for (const mode of game.multiplayer_modes) {
      if (mode.onlinecoop) hasOnlineCoop = true;
      if (mode.offlinecoop) hasOfflineCoop = true;
    }
  }

  // Parse store links / websites
  const websites = (game.websites || [])
    .filter(w => w.url && w.category)
    .map(w => ({ url: w.url, category: w.category }));

  return {
    igdbId: game.id,
    igdbTitle: game.name,
    summary: game.summary || null,
    storyline: game.storyline || null,
    developer,
    publisher,
    genres,
    themes,
    releaseDate,
    releaseYear,
    igdbRating,
    metacriticRating,
    coverUrl,
    screenshots,
    videoIds,
    platforms,
    gameModes,
    hasOnlineCoop,
    hasOfflineCoop,
    websites,
    status: game.status, // 0=released, 2=alpha, 3=beta, 4=early access, 5=offline, 6=cancelled, 7=rumored
  };
}

/**
 * Batch enrich an array of games with IGDB data.
 * Returns a Map of gameId -> IGDB details.
 * Fetches sequentially to avoid rate-limiting (4 req/sec limit on free tier).
 */
export async function enrichGamesWithIGDB(games, onProgress) {
  const results = new Map();
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    try {
      const details = await getIGDBGameDetails(game.title);
      if (details) {
        results.set(game.id, details);
      }
    } catch (err) {
      console.warn(`IGDB enrichment failed for ${game.title}:`, err);
    }

    if (onProgress) onProgress(i + 1, games.length);
    
    // Respect IGDB rate limit: 4 requests/second
    if (i < games.length - 1) {
      await delay(260);
    }
  }

  return results;
}

/**
 * Lightweight per-game lookup for on-demand detail enrichment.
 * Used in GameDetailPage to enrich a single game when the user opens it.
 */
export async function enrichSingleGame(game) {
  try {
    return await getIGDBGameDetails(game.title);
  } catch {
    return null;
  }
}
