const STEAMGRID_BASE = 'https://www.steamgriddb.com/api/v2';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.STEAMGRID_API_KEY || '';
  if (!apiKey) {
    // Return gracefully with success: false and empty data so clients fallback cleanly
    return res.status(200).json({
      success: false,
      data: [],
      message: 'STEAMGRID_API_KEY is not configured in Vercel environment variables. Falling back to Steam store search.'
    });
  }

  // Extract path parts following /api/steamgriddb
  const pathParts = req.query.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  // Build query string excluding 'path' param
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

  try {
    const steamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    const data = await steamResponse.json();
    return res.status(steamResponse.status).json(data);
  } catch (err) {
    console.error('SteamGridDB proxy error:', err);
    return res.status(200).json({ success: false, data: [], error: err.message });
  }
}
