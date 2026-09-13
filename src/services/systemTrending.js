/**
 * Dynamic System Recency & Popularity Service
 * Dynamically queries the user's system clock (Date) for current year and month
 * to rank and feature the most popular games of the current period.
 */

export function getSystemPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1 - 12
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return {
    year,
    month,
    monthName: monthNames[now.getMonth()],
    monthShort: monthNames[now.getMonth()].slice(0, 3),
    formatted: `${monthNames[now.getMonth()]} ${year}`,
    isCurrentYear: (gYear) => gYear === year
  };
}

/**
 * Calculates a dynamic trending score (0 - 100) based on proximity
 * to the system's current year & month, combined with game popularity.
 */
export function getGameTrendingScore(game, systemYear, systemMonth) {
  if (!game) return 0;
  const sysYear = systemYear ?? new Date().getFullYear();
  const gYear = game.releaseYear || 2024;
  const pop = typeof game.popularity === 'number' ? game.popularity : 85;

  // Games released in the current or adjacent year get a slight freshness bonus,
  // but true player popularity remains the primary ordering factor.
  const yearDelta = Math.abs(sysYear - gYear);
  const freshnessBoost = yearDelta === 0 ? 4 : (yearDelta === 1 ? 2 : 0);

  return pop + freshnessBoost;
}

/**
 * Returns games sorted by popularity of current system year & month
 */
export function sortGamesBySystemPopularity(games) {
  if (!Array.isArray(games)) return [];
  const { year, month } = getSystemPeriod();
  return [...games].sort((a, b) => {
    const scoreA = getGameTrendingScore(a.game || a, year, month);
    const scoreB = getGameTrendingScore(b.game || b, year, month);
    return scoreB - scoreA;
  });
}
