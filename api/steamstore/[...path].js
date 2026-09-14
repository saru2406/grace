export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
  const targetUrl = `https://store.steampowered.com/api/${pathStr}${queryString}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    const data = await upstreamRes.text();
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    return res.status(upstreamRes.status).send(data);
  } catch (err) {
    console.error('SteamStore Vercel proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from Steam Store', details: err.message });
  }
}
