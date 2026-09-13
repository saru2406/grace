// Authentication & Library Import Service for Steam
import { DEFAULT_GAMES } from '../data/games.js';

const LOCAL_STORAGE_STEAM = 'fps_estimator_steam_user';
const LOCAL_STORAGE_STEAM_API_KEY = 'fps_estimator_steam_api_key';

// Sample curated Steam library profiles that users can quick-import
export const SAMPLE_STEAM_PROFILES = [
  {
    id: 'steam-aaa-enthusiast',
    name: 'Valkyrie_Rig',
    steamId: '76561198012345678',
    avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    level: 54,
    headline: 'High-End 4K & Ultrawide Benchmarking',
    games: [
      { title: 'Cyberpunk 2077', id: 5209422, steamAppId: 1091500, playtime: '185 hrs' },
      { title: 'Black Myth: Wukong', id: 5269886, steamAppId: 2358720, playtime: '72 hrs' },
      { title: 'Elden Ring', id: 5277816, steamAppId: 1245620, playtime: '240 hrs' },
      { title: 'Warhammer 40,000: Space Marine 2', id: 5309406, steamAppId: 2183900, playtime: '58 hrs' },
      { title: 'Red Dead Redemption 2', id: 5249031, steamAppId: 1174180, playtime: '165 hrs' },
      { title: 'Helldivers 2', id: 5403655, steamAppId: 553850, playtime: '112 hrs' },
      { title: 'God of War Ragnarök', id: 5296432, steamAppId: 2322010, playtime: '46 hrs' },
      { title: 'Hogwarts Legacy', id: 5267354, steamAppId: 990080, playtime: '64 hrs' },
      { title: 'Monster Hunter: World', id: 16347, steamAppId: 582010, playtime: '310 hrs' }
    ]
  },
  {
    id: 'steam-competitive-fps',
    name: 'Vortex_Frag',
    steamId: '76561198987654321',
    avatar: 'https://avatars.steamstatic.com/c4ad9b30c3adbb0cf51a87e597c55c7b3ddb2591_full.jpg',
    level: 38,
    headline: 'Competitive Esports & High-Refresh Focus',
    games: [
      { title: 'Counter-Strike 2', id: 5363838, steamAppId: 730, playtime: '1,640 hrs' },
      { title: 'Deadlock', id: 5453171, steamAppId: 1422450, playtime: '135 hrs' },
      { title: 'Marvel Rivals', id: 5447951, steamAppId: 2767030, playtime: '88 hrs' },
      { title: 'Apex Legends', id: 35001, steamAppId: 1172470, playtime: '720 hrs' },
      { title: 'Call of Duty: Warzone', id: 5257960, steamAppId: 1938090, playtime: '420 hrs' },
      { title: 'Tom Clancy\'s Rainbow Six Siege', id: 7154, steamAppId: 359550, playtime: '510 hrs' },
      { title: 'Tekken 8', id: 5360955, steamAppId: 1778820, playtime: '94 hrs' },
      { title: 'DOOM Eternal', id: 5209479, steamAppId: 782330, playtime: '52 hrs' }
    ]
  },
  {
    id: 'steam-rpg-story',
    name: 'Chronos_Narrative',
    steamId: '76561198112233445',
    avatar: 'https://avatars.steamstatic.com/b5bd56998534f146cfd0f513904a08bc7ec7591e_full.jpg',
    level: 45,
    headline: 'Immersive RPGs & Story Masterpieces',
    games: [
      { title: "Baldur's Gate 3", id: 5138060, steamAppId: 1086940, playtime: '215 hrs' },
      { title: 'The Witcher 3: Wild Hunt (Next-Gen)', id: 4265, steamAppId: 292030, playtime: '190 hrs' },
      { title: 'Ghost of Tsushima', id: 5261245, steamAppId: 2215430, playtime: '74 hrs' },
      { title: 'The Last of Us Part I', id: 5335165, steamAppId: 1888930, playtime: '48 hrs' },
      { title: 'Kingdom Come: Deliverance II', id: 5449615, steamAppId: 1771300, playtime: '65 hrs' },
      { title: 'Metaphor: ReFantazio', id: 5439691, steamAppId: 2679460, playtime: '82 hrs' },
      { title: 'Final Fantasy XVI', id: 5267223, steamAppId: 2515020, playtime: '55 hrs' },
      { title: 'Balatro', id: 5403326, steamAppId: 2379780, playtime: '145 hrs' }
    ]
  },
  {
    id: 'steam-horror-survival',
    name: 'Requiem_Hunter',
    steamId: '76561198223344556',
    avatar: 'https://avatars.steamstatic.com/b09ce1533ad3b66ae8cfbe0ea34138e4dfaa1815_full.jpg',
    level: 32,
    headline: 'Survival Horror & Dark Atmosphere',
    games: [
      { title: 'Resident Evil: Requiem', id: 5491566, playtime: '42 hrs' },
      { title: 'Resident Evil 4 Remake', id: 3168, steamAppId: 2050650, playtime: '68 hrs' },
      { title: 'Resident Evil Village', id: 5262085, steamAppId: 1196590, playtime: '54 hrs' },
      { title: 'Silent Hill 2 (2024)', id: 36708, steamAppId: 2124490, playtime: '38 hrs' },
      { title: 'S.T.A.L.K.E.R. 2: Heart of Chornobyl', id: 5270202, steamAppId: 1643320, playtime: '45 hrs' },
      { title: 'Lies of P', id: 5285351, steamAppId: 1627720, playtime: '76 hrs' },
      { title: 'Alan Wake 2', id: 5309266, playtime: '32 hrs' }
    ]
  }
];

export function getStoredSteamUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_STEAM) || 'null');
  } catch (e) {
    return null;
  }
}

export function saveSteamUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_STEAM, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_STEAM);
  }
}

export function getStoredSteamApiKey() {
  return localStorage.getItem(LOCAL_STORAGE_STEAM_API_KEY) || '';
}

export function saveSteamApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_STEAM_API_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_STEAM_API_KEY);
  }
}

function extractXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function parseSteamInputClient(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileMatch) return { type: 'profiles', id: profileMatch[1] };

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([a-zA-Z0-9_-]+)/i);
  if (vanityMatch) return { type: 'id', id: vanityMatch[1] };

  if (/^\d{17}$/.test(trimmed)) return { type: 'profiles', id: trimmed };
  return { type: 'id', id: trimmed.replace(/[^a-zA-Z0-9_-]/g, '') };
}

/**
 * Resolves a real Steam account profile and owned games (via backend or public fallback)
 */
export async function resolveSteamAccount({ query, apiKey = '' }) {
  if (!query || !query.trim()) {
    return { success: false, error: 'Please enter a Steam username, 64-bit ID, or profile URL.' };
  }

  // 1. Primary: Use local Vite dev server endpoint with server-side proxy
  try {
    const res = await fetch('/api/steam-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), apiKey: (apiKey || '').trim() })
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Local Steam resolve endpoint unavailable, attempting direct fallback...', err);
  }

  // 2. Secondary Fallback: Via public CORS proxy
  try {
    const parsed = parseSteamInputClient(query);
    if (!parsed || !parsed.id) {
      return { success: false, error: 'Could not parse Steam username or ID.' };
    }

    const targetUrl = `https://steamcommunity.com/${parsed.type}/${encodeURIComponent(parsed.id)}/?xml=1`;
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const res = await fetch(corsProxyUrl);

    if (res.ok) {
      const xml = await res.text();
      const errTag = extractXmlTag(xml, 'error');
      if (errTag) {
        return { success: false, error: errTag };
      }

      const steamID64 = extractXmlTag(xml, 'steamID64') || (parsed.type === 'profiles' ? parsed.id : '');
      const steamID = extractXmlTag(xml, 'steamID') || parsed.id;
      const avatarFull = extractXmlTag(xml, 'avatarFull') || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
      const customURL = extractXmlTag(xml, 'customURL') || parsed.id;
      const location = extractXmlTag(xml, 'location') || '';
      const memberSince = extractXmlTag(xml, 'memberSince') || '';

      return {
        success: true,
        profile: {
          steamId64: steamID64,
          name: steamID,
          avatar: avatarFull,
          customUrl: customURL,
          location,
          memberSince
        },
        games: [],
        hasApiKey: false,
        gameCount: 0
      };
    }
  } catch (proxyErr) {
    console.error('All Steam profile resolve methods failed:', proxyErr);
  }

  return { success: false, error: 'Could not connect to Steam servers. Please verify the profile is public or enter your Steam ID.' };
}

/**
 * Parses free text containing game titles (e.g. pasted from Steam library, text files, wishlist)
 */
export function parsePastedGamesList(text) {
  if (!text || !text.trim()) return [];

  // Split by newlines, semi-colons or commas
  const lines = text
    .split(/[\r\n;,]+/)
    .map(l => l.trim())
    .filter(Boolean);

  const seen = new Set();
  const matchedGames = [];

  const ignoredPatterns = [
    /^hours?\s*on\s*record/i,
    /^last\s*played/i,
    /^\d+(\.\d+)?\s*hrs?/i,
    /^achievements/i,
    /^install(ed)?/i,
    /^play$/i,
    /^https?:\/\//i
  ];

  for (const rawLine of lines) {
    let clean = rawLine.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    // Check if line should be ignored
    if (clean.length < 2 || ignoredPatterns.some(p => p.test(clean))) {
      continue;
    }

    // Strip trailing playtime if present e.g. "Cyberpunk 2077 - 120 hrs" or "Cyberpunk 2077 (120 hrs)"
    clean = clean.replace(/[-–—]\s*\d+[\d.,]*\s*hrs?/i, '').replace(/\(\s*\d+[\d.,]*\s*hrs?\s*\)/i, '').trim();
    if (clean.length < 2) continue;

    const lowerClean = clean.toLowerCase();
    if (seen.has(lowerClean)) continue;
    seen.add(lowerClean);

    // Try matching with DEFAULT_GAMES
    const existing = DEFAULT_GAMES.find(g => {
      const gLower = g.title.toLowerCase();
      if (gLower === lowerClean) return true;
      if (g.tags && g.tags.some(t => t.toLowerCase() === lowerClean)) return true;
      const strippedClean = lowerClean.replace(/[^a-z0-9]/g, '');
      const strippedExisting = gLower.replace(/[^a-z0-9]/g, '');
      return strippedClean === strippedExisting;
    });

    if (existing) {
      matchedGames.push({
        title: existing.title,
        id: existing.steamGridId || existing.id,
        steamGridId: existing.steamGridId,
        steamAppId: existing.steamAppId,
        coverUrl: existing.coverUrl,
        heroUrl: existing.heroUrl,
        wideCoverUrl: existing.wideCoverUrl,
        baseFps: existing.baseFps,
        category: existing.category,
        playtime: 'Played'
      });
    } else {
      matchedGames.push({
        title: clean,
        id: `steam-pasted-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        playtime: 'Library'
      });
    }
  }

  return matchedGames;
}


