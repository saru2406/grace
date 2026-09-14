export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Client-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.IGDB_CLIENT_ID || process.env.VITE_IGDB_CLIENT_ID || '';
  const accessToken = process.env.IGDB_ACCESS_TOKEN || process.env.VITE_IGDB_ACCESS_TOKEN || '';

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
  const targetUrl = `https://api.igdb.com/v4/${pathStr}${queryString}`;

  const headers = {
    'Content-Type': 'text/plain',
    'Accept': 'application/json'
  };

  if (clientId) headers['Client-ID'] = clientId.trim();
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken.trim()}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    });

    const data = await upstreamRes.text();
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    return res.status(upstreamRes.status).send(data);
  } catch (err) {
    console.error('IGDB Vercel proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from IGDB', details: err.message });
  }
}
