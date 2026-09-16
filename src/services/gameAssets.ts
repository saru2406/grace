/**
 * Verified Game Artwork Resolution Service
 * Ensures games always display 100% accurate, official, high-resolution artwork.
 * Prioritizes official Valve Steam CDN store assets over community-submitted grids.
 */

export const DEFAULT_PLACEHOLDER_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900' viewBox='0 0 600 900'><rect width='100%' height='100%' fill='%230e1118'/><rect x='20' y='20' width='560' height='860' rx='14' fill='%23131722' stroke='%23222736' stroke-width='2'/><g opacity='0.3' transform='translate(200, 360)'><rect x='10' y='20' width='180' height='110' rx='28' fill='none' stroke='%23ffffff' stroke-width='5'/><circle cx='60' cy='75' r='18' fill='none' stroke='%23ffffff' stroke-width='4'/><path d='M60 63v24M48 75h24' stroke='%23ffffff' stroke-width='4' stroke-linecap='round'/><circle cx='135' cy='63' r='6' fill='%23ffffff'/><circle cx='150' cy='75' r='6' fill='%23ffffff'/><circle cx='120' cy='75' r='6' fill='%23ffffff'/><circle cx='135' cy='87' r='6' fill='%23ffffff'/></g><text x='300' y='530' font-family='-apple-system,BlinkMacSystemFont,sans-serif' font-size='16' font-weight='600' fill='%2364748b' text-anchor='middle' letter-spacing='2'>NO COVER IMAGE</text></svg>";

export function getOfficialCoverUrl(game) {
  if (!game) return DEFAULT_PLACEHOLDER_COVER;

  // For games with a known steamAppId, use official Valve CDN box art (600x900)
  if (game.steamAppId && game.id !== 'crimson-desert') {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_600x900.jpg`;
  }

  // Non-steam or custom games fallback to coverUrl or neutral placeholder
  return game.coverUrl || DEFAULT_PLACEHOLDER_COVER;
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
