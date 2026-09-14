/**
 * Vercel Serverless Function: SteamGridDB API Proxy
 * Compatible with node-steamgriddb (https://github.com/SteamGridDB/node-steamgriddb)
 */

const STEAMGRID_BASE = 'https://www.steamgriddb.com/api/v2';

function getSubPath(req) {
  const queryPath = req.query?.path;
  if (Array.isArray(queryPath) && queryPath.length) {
    return queryPath.join('/');
  }

  if (typeof queryPath === 'string' && queryPath.trim()) {
    return queryPath;
  }

  try {
    const pathname = new URL(req.url || '/', 'https://localhost').pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'api' && parts.length > 2) {
      return parts.slice(2).join('/');
    }
    return parts.slice(1).join('/');
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both standard and VITE_ prefixed environment variables in Vercel
  const apiKey = (process.env.STEAMGRID_API_KEY || process.env.VITE_STEAMGRID_API_KEY || '').trim();

  const subPath = getSubPath(req);

  const queryParams = new URLSearchParams();
  Object.entries(req.query || {}).forEach(([k, v]) => {
    if (k !== 'path') {
      if (Array.isArray(v)) {
        v.forEach(val => queryParams.append(k, val));
      } else if (v !== undefined) {
        queryParams.append(k, v);
      }
    }
  });

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const targetUrl = `${STEAMGRID_BASE}/${subPath}${queryString}`;

  const isPublicEndpoint = subPath.startsWith('search/autocomplete');
  if (!apiKey && !isPublicEndpoint) {
    return res.status(200).json({
      success: false,
      data: [],
      message: 'STEAMGRID_API_KEY is not configured in Vercel environment variables.'
    });
  }

  const forwardHeaders = {
    Accept: 'application/json'
  };

  if (apiKey) {
    forwardHeaders.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const steamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders
    });

    const contentType = steamResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await steamResponse.json();
      return res.status(steamResponse.status).json(data);
    }

    const text = await steamResponse.text();
    return res.status(steamResponse.status).send(text);
  } catch (err) {
    console.error('SteamGridDB proxy error:', err);
    return res.status(200).json({
      success: false,
      data: [],
      error: err.message || 'Failed to contact SteamGridDB'
    });
  }
}
