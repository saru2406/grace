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
  const sysMonth = systemMonth ?? (new Date().getMonth() + 1);

  const gYear = game.releaseYear || 2024;
  const gMonth = game.releaseMonth || 6;
  const pop = game.popularity || 85;

  const yearDelta = sysYear - gYear;
  let recencyScore = 0;

  if (yearDelta === 0) {
    // Released in current system year: reward games near current month
    const monthDelta = Math.abs(sysMonth - gMonth);
    recencyScore = Math.max(75, 100 - (monthDelta * 2.5));
  } else if (yearDelta === 1) {
    // Released last year: still extremely relevant
    recencyScore = 84;
  } else if (yearDelta === -1) {
    // Next year anticipated blockbuster
    recencyScore = 90;
  } else if (yearDelta > 1) {
    // Older library titles: decay with year distance
    recencyScore = Math.max(15, 68 - (yearDelta * 14));
  } else {
    // Distant future
    recencyScore = 40;
  }

  // 60% recency weight + 40% popularity weight
  return (recencyScore * 0.6) + (pop * 0.4);
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
