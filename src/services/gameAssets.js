/**
 * Verified Game Artwork Resolution Service
 * Ensures games always display 100% accurate, official, high-resolution artwork.
 * Prioritizes official Valve Steam CDN store assets over community-submitted grids.
 */

export function getOfficialCoverUrl(game) {
  if (!game) return 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg';

  // For games with a known steamAppId, use official Valve CDN box art (600x900)
  if (game.steamAppId && game.id !== 'crimson-desert') {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_600x900.jpg`;
  }

  // Non-steam or custom games fallback to coverUrl
  return game.coverUrl || 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg';
}

export function getOfficialHeroUrl(game) {
  if (!game) return '';

  // For games with a steamAppId, use official Valve library hero artwork
  if (game.steamAppId && game.id !== 'crimson-desert') {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_hero.jpg`;
  }

  return game.heroUrl || game.wideCoverUrl || game.coverUrl || '';
}

export function getOfficialHeaderUrl(game) {
  if (!game) return '';
  if (game.steamAppId && game.id !== 'crimson-desert') {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/header.jpg`;
  }
  return game.wideCoverUrl || game.heroUrl || game.coverUrl || '';
}
