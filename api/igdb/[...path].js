const IGDB_BASE = 'https://api.igdb.com/v4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Client-ID, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const clientId = process.env.IGDB_CLIENT_ID || '';
  const accessToken = process.env.IGDB_ACCESS_TOKEN || '';

  if (!clientId || !accessToken) {
    return res.status(200).json({
      error: 'IGDB_CLIENT_ID or IGDB_ACCESS_TOKEN not configured in Vercel environment variables'
    });
  }

  const pathParts = req.query.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
  const targetUrl = `${IGDB_BASE}/${subPath}`;

  try {
    let body = req.body;
    if (typeof body === 'object' && body !== null) {
      body = JSON.stringify(body);
    }

    const igdbRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: req.method === 'GET' ? undefined : (body || '')
    });

    const data = await igdbRes.json();
    return res.status(igdbRes.status).json(data);
  } catch (err) {
    console.error('IGDB proxy error:', err);
    return res.status(502).json({ error: err.message });
  }
}
