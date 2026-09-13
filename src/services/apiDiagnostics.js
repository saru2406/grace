/**
 * API Diagnostics Service
 * Verifies connectivity, credentials, and response latency for SteamGridDB, IGDB, and Steam Store APIs.
 */

export async function fetchEnvStatus() {
  try {
    const res = await fetch('/api/env-status', { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silently continue if /api/env-status is not available
  }
  return null;
}

export async function testSteamGridApi(envStatus = null) {
  // If envStatus indicates key is absent, report immediately
  if (envStatus && envStatus.hasSteamGridKey === false) {
    return {
      id: 'steamgriddb',
      name: 'SteamGridDB API',
      envVar: 'STEAMGRID_API_KEY',
      ok: false,
      status: 'unconfigured',
      latency: null,
      message: 'STEAMGRID_API_KEY is not configured in .env',
      hint: 'Add your key to .env (see .env.example) to enable custom game art and grids.'
    };
  }

  const start = performance.now();
  try {
    const res = await fetch('/api/steamgriddb/search/autocomplete/Cyberpunk', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    const latency = Math.round(performance.now() - start);

    if (res.status === 401 || res.status === 403) {
      return {
        id: 'steamgriddb',
        name: 'SteamGridDB API',
        envVar: 'STEAMGRID_API_KEY',
        ok: false,
        status: 'unauthorized',
        latency,
        message: 'Invalid API key format or unauthorized (HTTP 401)',
        hint: 'Verify STEAMGRID_API_KEY in your .env file.'
      };
    }

    if (!res.ok) {
      return {
        id: 'steamgriddb',
        name: 'SteamGridDB API',
        envVar: 'STEAMGRID_API_KEY',
        ok: false,
        status: 'error',
        latency,
        message: `HTTP ${res.status}: ${res.statusText}`,
        hint: 'Check your proxy connection or network.'
      };
    }

    const data = await res.json();

    // Check if Vercel serverless proxy gracefully returned unconfigured notice
    if (data && data.success === false && data.message && data.message.includes('STEAMGRID_API_KEY')) {
      return {
        id: 'steamgriddb',
        name: 'SteamGridDB API',
        envVar: 'STEAMGRID_API_KEY',
        ok: false,
        status: 'unconfigured',
        latency,
        message: 'STEAMGRID_API_KEY is not configured',
        hint: 'Add STEAMGRID_API_KEY to .env and restart Vite dev server.'
      };
    }

    if (data && (data.success === true || Array.isArray(data.data))) {
      const count = Array.isArray(data.data) ? data.data.length : 0;
      return {
        id: 'steamgriddb',
        name: 'SteamGridDB API',
        envVar: 'STEAMGRID_API_KEY',
        ok: true,
        status: 'operational',
        latency,
        message: `Operational (${count} sample games matched)`,
        hint: envStatus && envStatus.hasSteamGridKey ? 'API key active and verified.' : 'Public fallback mode active.'
      };
    }

    return {
      id: 'steamgriddb',
      name: 'SteamGridDB API',
      envVar: 'STEAMGRID_API_KEY',
      ok: false,
      status: 'unexpected',
      latency,
      message: data?.message || data?.errors?.[0] || 'Unexpected response format',
      hint: 'Check API key permissions.'
    };
  } catch (err) {
    return {
      id: 'steamgriddb',
      name: 'SteamGridDB API',
      envVar: 'STEAMGRID_API_KEY',
      ok: false,
      status: 'offline',
      latency: Math.round(performance.now() - start),
      message: err.message || 'Failed to connect to proxy endpoint',
      hint: 'Make sure the Vite dev server is running.'
    };
  }
}

export async function testIgdbApi(envStatus = null) {
  // If envStatus indicates keys are absent, report immediately
  if (envStatus && envStatus.hasIgdbKeys === false) {
    return {
      id: 'igdb',
      name: 'IGDB / Twitch API',
      envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
      ok: false,
      status: 'unconfigured',
      latency: null,
      message: 'IGDB credentials not configured in .env',
      hint: 'Add IGDB_CLIENT_ID and IGDB_ACCESS_TOKEN to .env for detailed game metadata.'
    };
  }

  const start = performance.now();
  try {
    const res = await fetch('/api/igdb/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Accept: 'application/json'
      },
      body: 'fields name; limit 1;',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    const latency = Math.round(performance.now() - start);

    if (res.status === 401 || res.status === 403) {
      return {
        id: 'igdb',
        name: 'IGDB / Twitch API',
        envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
        ok: false,
        status: 'unauthorized',
        latency,
        message: 'Authentication failed (HTTP 401/403)',
        hint: 'Verify IGDB_CLIENT_ID and IGDB_ACCESS_TOKEN in .env.'
      };
    }

    if (!res.ok) {
      return {
        id: 'igdb',
        name: 'IGDB / Twitch API',
        envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
        ok: false,
        status: 'error',
        latency,
        message: `HTTP ${res.status}: ${res.statusText}`,
        hint: 'Check proxy connection to api.igdb.com.'
      };
    }

    const data = await res.json();

    if (data && data.error) {
      return {
        id: 'igdb',
        name: 'IGDB / Twitch API',
        envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
        ok: false,
        status: 'unconfigured',
        latency,
        message: typeof data.error === 'string' ? data.error : 'IGDB credentials missing',
        hint: 'Add IGDB_CLIENT_ID and IGDB_ACCESS_TOKEN to .env.'
      };
    }

    if (Array.isArray(data)) {
      const sample = data[0]?.name ? `Sample: "${data[0].name}"` : 'Verified';
      return {
        id: 'igdb',
        name: 'IGDB / Twitch API',
        envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
        ok: true,
        status: 'operational',
        latency,
        message: `Authenticated & operational (${sample})`,
        hint: 'Full game metadata and descriptions active.'
      };
    }

    return {
      id: 'igdb',
      name: 'IGDB / Twitch API',
      envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
      ok: false,
      status: 'unexpected',
      latency,
      message: 'Unexpected IGDB response structure',
      hint: 'Check IGDB query syntax.'
    };
  } catch (err) {
    return {
      id: 'igdb',
      name: 'IGDB / Twitch API',
      envVar: 'IGDB_CLIENT_ID & IGDB_ACCESS_TOKEN',
      ok: false,
      status: 'offline',
      latency: Math.round(performance.now() - start),
      message: err.message || 'Failed to connect to proxy endpoint',
      hint: 'Make sure the Vite dev server is running.'
    };
  }
}

export async function testSteamStoreApi() {
  const start = performance.now();
  try {
    const res = await fetch('/api/steamstore/storesearch/?term=portal&l=english&cc=US', {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        id: 'steamstore',
        name: 'Steam Store Search',
        envVar: 'None (Public fallback)',
        ok: false,
        status: 'error',
        latency,
        message: `HTTP ${res.status}: ${res.statusText}`,
        hint: 'Public Steam search might be throttled.'
      };
    }

    const data = await res.json();
    const count = data.total || (Array.isArray(data.items) ? data.items.length : 0);
    return {
      id: 'steamstore',
      name: 'Steam Store Search',
      envVar: 'None (Public fallback)',
      ok: true,
      status: 'operational',
      latency,
      message: `Operational (${count} results indexed)`,
      hint: 'Public fallback active for game banners and Steam AppIDs.'
    };
  } catch (err) {
    return {
      id: 'steamstore',
      name: 'Steam Store Search',
      envVar: 'None (Public fallback)',
      ok: false,
      status: 'offline',
      latency: Math.round(performance.now() - start),
      message: err.message || 'Network request failed',
      hint: 'Check internet connection.'
    };
  }
}

export async function runAllApiDiagnostics() {
  const envStatus = await fetchEnvStatus();
  const results = await Promise.all([
    testSteamGridApi(envStatus),
    testIgdbApi(envStatus),
    testSteamStoreApi()
  ]);
  return results;
}
