export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.STEAMGRID_API_KEY || process.env.VITE_STEAMGRID_API_KEY || '';

  const { path, ...queryParams } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');

  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      val.forEach(v => searchParams.append(key, v));
    } else if (val !== undefined) {
      searchParams.append(key, val);
    }
  });

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const targetUrl = `https://www.steamgriddb.com/api/v2/${pathStr}${queryString}`;

  const headers = {
    'Accept': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers
    });

    const data = await upstreamRes.text();
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    return res.status(upstreamRes.status).send(data);
  } catch (err) {
    console.error('SteamGridDB Vercel proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from SteamGridDB', details: err.message });
  }
}
