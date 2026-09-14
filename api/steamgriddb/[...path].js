/**
 * Vercel Serverless Function: SteamGridDB API Proxy
 * Compatible with node-steamgriddb (https://github.com/SteamGridDB/node-steamgriddb)
 */

const STEAMGRID_BASE = 'https://www.steamgriddb.com/api/v2';

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

  const apiKey = (process.env.STEAMGRID_API_KEY || process.env.VITE_STEAMGRID_API_KEY || '').trim();

  const pathParts = req.query.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

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
  }
}
