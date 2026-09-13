/**
 * Gaming-aware Search Engine
 * Handles tags, common gaming acronyms, slang, prefixes, and fuzzy aliases
 */

const GAMING_ALIASES = {
  // Resident Evil aliases
  're': ['resident evil: requiem', 'resident evil 4 remake', 'resident evil village', 'resident evil', 're4', 're9', 're8'],
  're9': ['resident evil: requiem', 'resident evil 9'],
  'requiem': ['resident evil: requiem'],
  're4': ['resident evil 4 remake', 'resident evil 4'],
  're4r': ['resident evil 4 remake'],
  're8': ['resident evil village'],
  're7': ['resident evil 7: biohazard'],
  're2': ['resident evil 2'],
  're3': ['resident evil 3'],
  'village': ['resident evil village'],
  'biohazard': ['resident evil: requiem', 'resident evil 4 remake', 'resident evil village', 'resident evil'],

  // Minecraft aliases
  'mine': ['minecraft'],
  'mc': ['minecraft'],
  'craft': ['minecraft'],
  'voxel': ['minecraft'],
  
  // Counter-Strike aliases
  'cs': ['counter-strike 2', 'cs2'],
  'cs2': ['counter-strike 2'],
  'csgo': ['counter-strike 2'],
  
  // Cyberpunk aliases
  'cyber': ['cyberpunk 2077'],
  'cp': ['cyberpunk 2077'],
  'cp2077': ['cyberpunk 2077'],
  'nightcity': ['cyberpunk 2077'],
  
  // Red Dead Redemption aliases
  'rdr': ['red dead redemption 2'],
  'rdr2': ['red dead redemption 2'],
  'arthur': ['red dead redemption 2'],
  
  // Call of Duty aliases
  'cod': ['call of duty: warzone'],
  'warzone': ['call of duty: warzone'],
  'mw': ['call of duty: warzone'],
  
  // Grand Theft Auto aliases
  'gta': ['grand theft auto v', 'grand theft auto vi'],
  'gta5': ['grand theft auto v'],
  'gtav': ['grand theft auto v'],
  'gta6': ['grand theft auto vi'],
  'gtavi': ['grand theft auto vi'],
  
  // Black Myth Wukong
  'wukong': ['black myth: wukong'],
  'bmw': ['black myth: wukong'],
  'monkey': ['black myth: wukong'],
  
  // Baldur's Gate
  'bg3': ["baldur's gate 3"],
  'baldurs': ["baldur's gate 3"],
  
  // Spider-man
  'spider': ["marvel's spider-man remastered"],
  'spiderman': ["marvel's spider-man remastered"],
  
  // Valorant
  'val': ['valorant'],
  'valo': ['valorant'],
  
  // Fortnite
  'fort': ['fortnite'],
  'fn': ['fortnite'],
  
  // Elden Ring
  'elden': ['elden ring'],
  'er': ['elden ring'],
  
  // Helldivers
  'helldiver': ['helldivers 2'],
  'hd2': ['helldivers 2'],
  
  // Space Marine
  'sm2': ['warhammer 40,000: space marine 2'],
  'spacemarine': ['warhammer 40,000: space marine 2'],
  'warhammer': ['warhammer 40,000: space marine 2'],
  
  // Witcher
  'witcher': ['the witcher 3: wild hunt (next-gen)'],
  'witcher3': ['the witcher 3: wild hunt (next-gen)'],
  'geralt': ['the witcher 3: wild hunt (next-gen)'],
  
  // DOOM
  'doom': ['doom eternal', 'doom: the dark ages'],
  
  // Monster Hunter
  'mh': ['monster hunter wilds', 'monster hunter: world'],
  'mhw': ['monster hunter: world'],
  
  // S.T.A.L.K.E.R.
  'stalker': ['s.t.a.l.k.e.r. 2: heart of chornobyl'],
  'stalker2': ['s.t.a.l.k.e.r. 2: heart of chornobyl'],

  // Silent Hill
  'sh2': ['silent hill 2 (2024)', 'silent hill 2'],
  'silenthill': ['silent hill 2 (2024)'],

  // God of War
  'gow': ['god of war ragnarök'],
  'ragnarok': ['god of war ragnarök'],

  // The Last of Us
  'tlou': ['the last of us part i'],

  // Ghost of Tsushima
  'got': ['ghost of tsushima director’s cut'],
  'tsushima': ['ghost of tsushima director’s cut'],

  // Rainbow Six
  'r6': ["tom clancy's rainbow six siege"],
  'siege': ["tom clancy's rainbow six siege"],

  // League of Legends
  'lol': ['league of legends'],
  'league': ['league of legends'],

  // Pragmata
  'prag': ['pragmata'],
  'pragmata': ['pragmata'],

  // Borderlands
  'bl4': ['borderlands 4'],
  'borderlands': ['borderlands 4'],

  // Expedition 33
  'e33': ['clair obscur: expedition 33'],
  'expedition': ['clair obscur: expedition 33'],
  'expedition33': ['clair obscur: expedition 33']
};

/**
 * Filter games by search query with intelligent gaming context & tag matching.
 * Always factors in popularity so top hits are prioritized.
 * @param {Array} games - List of game items or objects
 * @param {string} query - Raw user search input
 * @returns {Array} - Filtered and relevance/popularity-sorted games
 */
export function searchGamesWithContext(games, query) {
  if (!query || !query.trim()) return games;

  const rawQ = query.toLowerCase().trim();
  const cleanQ = rawQ.replace(/[^a-z0-9]/g, '');
  const tokens = rawQ.split(/\s+/).filter(Boolean);

  // Check if entire query or any token maps to gaming aliases
  const aliasTargets = new Set();
  if (GAMING_ALIASES[rawQ]) {
    GAMING_ALIASES[rawQ].forEach(t => aliasTargets.add(t));
  }
  if (cleanQ && GAMING_ALIASES[cleanQ]) {
    GAMING_ALIASES[cleanQ].forEach(t => aliasTargets.add(t));
  }
  tokens.forEach(token => {
    const cleanTok = token.replace(/[^a-z0-9]/g, '');
    if (GAMING_ALIASES[token]) {
      GAMING_ALIASES[token].forEach(t => aliasTargets.add(t));
    }
    if (cleanTok && GAMING_ALIASES[cleanTok]) {
      GAMING_ALIASES[cleanTok].forEach(t => aliasTargets.add(t));
    }
  });

  const scored = [];

  for (const item of games) {
    const game = item.game || item;
    const title = (game.title || '').toLowerCase();
    const cleanTitle = title.replace(/[^a-z0-9]/g, '');
    const genre = (game.genre || '').toLowerCase();
    const publisher = (game.publisher || '').toLowerCase();
    const desc = (game.description || '').toLowerCase();

    // Extract tags (array or string)
    const tags = Array.isArray(game.tags)
      ? game.tags.map(t => String(t).toLowerCase())
      : (typeof game.tags === 'string' ? game.tags.toLowerCase().split(/\s*,\s*|\s+/) : []);

    let score = 0;

    // 1. Tag exact or prefix match (e.g. "re9", "re", "re4", "mc", "cs")
    if (tags.includes(rawQ) || (cleanQ && tags.includes(cleanQ))) {
      score += 130;
    } else if (tags.some(t => t.startsWith(rawQ) || (cleanQ && t.startsWith(cleanQ)))) {
      score += 95;
    } else if (tags.some(t => t.includes(rawQ) || (cleanQ && t.includes(cleanQ)))) {
      score += 70;
    }

    // 2. Exact title match
    if (title === rawQ || (cleanQ && cleanTitle === cleanQ)) {
      score += 115;
    }
    // 3. Title starts with search query (e.g. "mine" -> "minecraft")
    else if (title.startsWith(rawQ) || (cleanQ && cleanTitle.startsWith(cleanQ))) {
      score += 85;
    }
    // 4. Word within title starts with query (e.g. "craft" -> "minecraft")
    else if (title.includes(rawQ) || (cleanQ && cleanTitle.includes(cleanQ))) {
      score += 60;
    }

    // 5. Alias match (e.g. "re" -> RE4/RE9, "mine" -> Minecraft, "cs" -> CS2)
    aliasTargets.forEach(target => {
      const cleanTarget = target.replace(/[^a-z0-9]/g, '');
      if (title.includes(target) || cleanTitle.includes(cleanTarget) || tags.includes(target) || tags.includes(cleanTarget)) {
        score += 80;
      }
    });

    // 6. Individual tokens match title, tags, or description
    let tokenMatches = 0;
    for (const token of tokens) {
      const cleanTok = token.replace(/[^a-z0-9]/g, '');
      if (tags.includes(token) || (cleanTok && tags.includes(cleanTok))) {
        tokenMatches += 2.0;
      } else if (title.includes(token) || (cleanTok && cleanTitle.includes(cleanTok))) {
        tokenMatches += 1.5;
      } else if (genre.includes(token)) {
        tokenMatches += 0.8;
      } else if (publisher.includes(token) || desc.includes(token)) {
        tokenMatches += 0.4;
      }
    }

    if (tokenMatches > 0) {
      score += tokenMatches * 20;
    }

    // 7. Factor in game popularity so most popular matching games rank first
    if (score > 0) {
      const pop = typeof game.popularity === 'number' ? game.popularity : 85;
      score += (pop * 0.35);
      scored.push({ item, score, popularity: pop });
    }
  }

  // Sort descending by score, tie-break by popularity
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.01) return b.score - a.score;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  return scored.map(s => s.item);
}
