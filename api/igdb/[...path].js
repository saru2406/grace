/**
 * Vercel Serverless Function: IGDB API v4 Proxy with Twitch OAuth2 Authentication
 * Implements official IGDB specification: https://api-docs.igdb.com/#getting-started
 */

const IGDB_BASE = 'https://api.igdb.com/v4';

// In-memory token cache across warm serverless invocations
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain or refresh a Twitch OAuth2 App Access Token via Client Credentials Grant
 */
async function getTwitchAppAccessToken(clientId, clientSecret) {
  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      grant_type: 'client_credentials'
    });

    const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
      method: 'POST',
      headers: { Accept: 'application/json' }
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data && data.access_token) {
        cachedToken = data.access_token;
        const expiresIn = data.expires_in || 3600;
        tokenExpiresAt = Date.now() + Math.max(expiresIn - 120, 60) * 1000;
        return cachedToken;
      }
    } else {
      const errData = await tokenRes.json().catch(() => ({}));
      console.warn('Twitch OAuth token request rejected:', errData);
    }
  } catch (err) {
    console.error('Error contacting Twitch OAuth endpoint:', err);
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Client-ID, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both standard names and VITE_ prefixed names in Vercel environment variables
  const clientId = (process.env.IGDB_CLIENT_ID || process.env.VITE_IGDB_CLIENT_ID || '').trim();
  const clientSecret = (process.env.IGDB_CLIENT_SECRET || process.env.VITE_IGDB_CLIENT_SECRET || '').trim();
  const directToken = (process.env.IGDB_ACCESS_TOKEN || process.env.VITE_IGDB_ACCESS_TOKEN || '').trim();

  if (!clientId) {
    return res.status(200).json({
      error: 'IGDB_CLIENT_ID is not configured in Vercel environment variables.'
    });
  }

  let accessToken = null;
  const candidateSecret = clientSecret || (directToken && directToken.length <= 32 ? directToken : null);
  if (candidateSecret) {
    accessToken = await getTwitchAppAccessToken(clientId, candidateSecret);
  }

  if (!accessToken && directToken) {
    accessToken = directToken;
  }

  if (!accessToken) {
    return res.status(200).json({
      error: 'IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET (or IGDB_ACCESS_TOKEN) in Vercel environment variables.'
    });
  }

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
  const targetUrl = `${IGDB_BASE}/${subPath}${queryString}`;

  let body = req.body;
  if (typeof body === 'object' && body !== null) {
    body = JSON.stringify(body);
  }

  const forwardHeaders = {
    'Client-ID': clientId,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'text/plain',
    Accept: 'application/json'
  };

  try {
    let igdbRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (body || '')
    });

    if (igdbRes.status === 401 && candidateSecret) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const refreshedToken = await getTwitchAppAccessToken(clientId, candidateSecret);
      if (refreshedToken) {
        forwardHeaders.Authorization = `Bearer ${refreshedToken}`;
        igdbRes = await fetch(targetUrl, {
          method: req.method,
          headers: forwardHeaders,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (body || '')
        });
      }
    }

    const contentType = igdbRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await igdbRes.json();
      return res.status(igdbRes.status).json(data);
    }

    const text = await igdbRes.text();
    return res.status(igdbRes.status).send(text);
  } catch (err) {
    console.error('IGDB proxy request failed:', err);
    return res.status(502).json({ error: err.message || 'Failed to contact IGDB' });
  }
}
