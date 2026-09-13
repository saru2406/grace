/**
 * Gaming-aware Search Engine
 * Handles tags, common gaming acronyms, slang, prefixes, and fuzzy aliases
 */

const GAMING_ALIASES = {
  // Resident Evil aliases
  're': ['resident evil: requiem', 'resident evil 4 remake (2023)', 'resident evil 4 (2005)', 'resident evil village', 'resident evil', 're4', 're9', 're8'],
  're9': ['resident evil: requiem', 'resident evil 9'],
  'requiem': ['resident evil: requiem'],
  're4': ['resident evil 4 remake (2023)', 'resident evil 4 (2005)'],
  're4r': ['resident evil 4 remake (2023)'],
  're4 remake': ['resident evil 4 remake (2023)'],
  're4 2005': ['resident evil 4 (2005)'],
  're4 original': ['resident evil 4 (2005)'],
  'resident evil 4 2005': ['resident evil 4 (2005)'],
  'resident evil 4 remake': ['resident evil 4 remake (2023)'],
  're8': ['resident evil village'],
  're7': ['resident evil 7: biohazard'],
  're2': ['resident evil 2'],
  're3': ['resident evil 3'],
  'village': ['resident evil village'],
  'biohazard': ['resident evil: requiem', 'resident evil 4 remake (2023)', 'resident evil 4 (2005)', 'resident evil village', 'resident evil'],

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
  const tokens = rawQ.split(/[\s,]+/).filter(Boolean);

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
    const titleWords = title.split(/[\s:,\-_./+]+/).filter(Boolean);
    const genre = (game.genre || '').toLowerCase();

    // Extract tags (array or string)
    const tags = Array.isArray(game.tags)
      ? game.tags.map(t => String(t).toLowerCase())
      : (typeof game.tags === 'string' ? game.tags.toLowerCase().split(/\s*,\s*|\s+/) : []);

    let score = 0;
    let matchedAny = false;

    // 1. Exact title match
    if (title === rawQ || (cleanQ && cleanTitle === cleanQ)) {
      score += 250;
      matchedAny = true;
    }
    // 2. Title starts with query (only for queries >= 3 chars, or exact first word match for short queries)
    else if (cleanQ.length >= 3 && (title.startsWith(rawQ) || cleanTitle.startsWith(cleanQ))) {
      score += 170;
      matchedAny = true;
    } else if (cleanQ.length < 3 && titleWords[0] && (titleWords[0] === rawQ || titleWords[0].replace(/[^a-z0-9]/g, '') === cleanQ)) {
      score += 170;
      matchedAny = true;
    }
    // 3. Word in title starts with query (only for queries >= 3 chars, or exact word match for short queries)
    else if (cleanQ.length >= 3 && titleWords.some(w => w.startsWith(rawQ) || (cleanQ && w.replace(/[^a-z0-9]/g, '').startsWith(cleanQ)))) {
      score += 130;
      matchedAny = true;
    } else if (cleanQ.length < 3 && titleWords.some(w => w === rawQ || w.replace(/[^a-z0-9]/g, '') === cleanQ)) {
      score += 130;
      matchedAny = true;
    }
    // 4. Substring anywhere in title (queries >= 4 chars only to avoid false matches)
    else if (cleanQ.length >= 4 && (title.includes(rawQ) || cleanTitle.includes(cleanQ))) {
      score += 85;
      matchedAny = true;
    }

    // 5. Tag match
    if (tags.includes(rawQ) || (cleanQ && tags.includes(cleanQ))) {
      score += 140;
      matchedAny = true;
    } else if (cleanQ.length >= 3 && tags.some(t => t.startsWith(rawQ) || t.startsWith(cleanQ))) {
      score += 90;
      matchedAny = true;
    }

    // 6. Gaming Alias match (e.g. "cs" -> Counter-Strike 2, "re" -> Resident Evil, "gta" -> GTA V)
    aliasTargets.forEach(target => {
      const cleanTarget = target.replace(/[^a-z0-9]/g, '');
      if (title.includes(target) || cleanTitle.includes(cleanTarget) || tags.includes(target) || tags.includes(cleanTarget)) {
        score += 160;
        matchedAny = true;
      }
    });

    // 7. Multi-token query handling
    if (tokens.length > 1) {
      let matchedTokens = 0;
      for (const tok of tokens) {
        const cTok = tok.replace(/[^a-z0-9]/g, '');
        if (!cTok) continue;
        const matchesTitle = titleWords.some(w => w === tok || (tok.length >= 3 && w.startsWith(tok)) || (tok.length >= 4 && w.includes(tok)));
        const matchesTag = tags.some(t => t === tok || (tok.length >= 3 && t.startsWith(tok)));
        const matchesGenre = genre.includes(tok);
        if (matchesTitle || matchesTag || matchesGenre) {
          matchedTokens++;
        }
      }
      if (matchedTokens === tokens.length) {
        score += 120;
        matchedAny = true;
      } else if (matchedTokens > 0 && matchedTokens >= tokens.length - 1) {
        score += 60;
        matchedAny = true;
      }
    }

    // 8. Factor in popularity score so top games rank cleanly
    if (matchedAny && score > 0) {
      const pop = typeof game.popularity === 'number' ? game.popularity : 85;
      score += (pop * 0.25);
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
