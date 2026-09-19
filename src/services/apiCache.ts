/**
 * Persistent Client-Side API Response Cache
 * Dual-tier caching: L1 (in-memory Map) + L2 (localStorage with TTL & quota management).
 * Drastically cuts down redundant network requests for SteamGridDB, IGDB, and game metadata.
 */

const STORAGE_PREFIX = 'grace_cache_';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// L1 in-memory cache for zero-latency lookups during current session
const memoryCache = new Map<string, any>();

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Retrieves a cached item from memory or localStorage.
 */
export function getCachedApi<T>(key: string): T | null {
  const normalizedKey = key.trim();

  // Check L1 memory cache first
  if (memoryCache.has(normalizedKey)) {
    return memoryCache.get(normalizedKey) as T;
  }

  // Check L2 localStorage
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${normalizedKey}`);
    if (!raw) return null;

    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    const now = Date.now();

    // Check expiration
    if (envelope.ttl && (now - envelope.timestamp > envelope.ttl)) {
      localStorage.removeItem(`${STORAGE_PREFIX}${normalizedKey}`);
      return null;
    }

    // Populate L1 cache for subsequent fast reads
    memoryCache.set(normalizedKey, envelope.data);
    return envelope.data;
  } catch (err) {
    return null;
  }
}

/**
 * Stores an item in both L1 memory cache and L2 localStorage.
 */
export function setCachedApi<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  const normalizedKey = key.trim();

  // Save to L1 memory
  memoryCache.set(normalizedKey, data);

  // Save to L2 localStorage
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    };
    localStorage.setItem(`${STORAGE_PREFIX}${normalizedKey}`, JSON.stringify(envelope));
  } catch (err) {
    // If quota exceeded, purge oldest cache keys
    try {
      pruneOldestCacheEntries();
      const envelope: CacheEnvelope<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      };
      localStorage.setItem(`${STORAGE_PREFIX}${normalizedKey}`, JSON.stringify(envelope));
    } catch {
      // Gracefully ignore write failures
    }
  }
}

/**
 * Checks if a key exists and is unexpired.
 */
export function hasCachedApi(key: string): boolean {
  return getCachedApi(key) !== null;
}

/**
 * Prunes the oldest 25% of cache entries when localStorage quota is near capacity.
 */
function pruneOldestCacheEntries(): void {
  const entries: { key: string; timestamp: number }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_PREFIX)) {
      try {
        const item = JSON.parse(localStorage.getItem(k) || '{}');
        entries.push({ key: k, timestamp: item.timestamp || 0 });
      } catch {
        entries.push({ key: k, timestamp: 0 });
      }
    }
  }

  // Sort oldest first
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest quarter
  const countToRemove = Math.max(1, Math.floor(entries.length * 0.25));
  for (let i = 0; i < countToRemove; i++) {
    localStorage.removeItem(entries[i].key);
  }
}
