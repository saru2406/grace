const STEAM_STORE_BASE = 'https://store.steampowered.com/api';

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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
  const targetUrl = `${STEAM_STORE_BASE}/${subPath}${queryString}`;

  try {
    const steamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json'
      }
    });

    const contentType = steamRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await steamRes.json();
      return res.status(steamRes.status).json(data);
    }

    const text = await steamRes.text();
    return res.status(steamRes.status).send(text);
  } catch (err) {
    console.error('Steam store API proxy error:', err);
    return res.status(502).json({ error: err.message });
  }
}
