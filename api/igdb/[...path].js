/**
 * Vercel Serverless Function: IGDB API v4 Proxy with Twitch OAuth2 Authentication
 * Implements the official IGDB Getting Started specification:
 * https://api-docs.igdb.com/#getting-started
 */

const IGDB_BASE = 'https://api.igdb.com/v4';

// In-memory token cache across warm serverless invocations
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtain or refresh a Twitch OAuth2 App Access Token via Client Credentials Grant
 * POST https://id.twitch.tv/oauth2/token?client_id=...&client_secret=...&grant_type=client_credentials
 */
async function getTwitchAppAccessToken(clientId, clientSecret) {
  if (!clientId || !clientSecret) return null;

  // Use cached token if still valid (with a 2-minute safety buffer)
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
      headers: {
        'Accept': 'application/json'
      }
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data && data.access_token) {
        cachedToken = data.access_token;
        const expiresIn = data.expires_in || 3600;
        // Expire 120 seconds early to avoid race conditions
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Client-ID, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.IGDB_CLIENT_ID || '';
  const clientSecret = process.env.IGDB_CLIENT_SECRET || '';
  const directToken = process.env.IGDB_ACCESS_TOKEN || '';

  if (!clientId) {
    return res.status(200).json({
      error: 'IGDB_CLIENT_ID is not configured in Vercel environment variables.'
    });
  }

  // Determine effective access token
  let accessToken = null;

  // 1. If client secret is provided (or if access token looks like a secret ~30 chars), attempt OAuth exchange
  const candidateSecret = clientSecret || (directToken && directToken.length <= 32 ? directToken : null);
  if (candidateSecret) {
    accessToken = await getTwitchAppAccessToken(clientId, candidateSecret);
  }

  // 2. If no token obtained from OAuth, use directToken if available
  if (!accessToken && directToken) {
    accessToken = directToken.trim();
  }

  if (!accessToken) {
    return res.status(200).json({
      error: 'IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in Vercel environment variables.'
    });
  }

  // Extract subpath (e.g. /games, /search, /covers)
  const pathParts = req.query.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
  const targetUrl = `${IGDB_BASE}/${subPath}`;

  // Normalize request body for IGDB (Apicalypse text/plain query format)
  let body = req.body;
  if (typeof body === 'object' && body !== null) {
    body = JSON.stringify(body);
  }

  const forwardHeaders = {
    'Client-ID': clientId.trim(),
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'text/plain',
    'Accept': 'application/json'
  };

  try {
    let igdbRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method === 'GET' ? undefined : (body || '')
    });

    // If 401 Unauthorized occurs and we have a candidate secret, invalidate cached token and retry once
    if (igdbRes.status === 401 && candidateSecret) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const refreshedToken = await getTwitchAppAccessToken(clientId, candidateSecret);
      if (refreshedToken) {
        forwardHeaders['Authorization'] = `Bearer ${refreshedToken}`;
        igdbRes = await fetch(targetUrl, {
          method: req.method,
          headers: forwardHeaders,
          body: req.method === 'GET' ? undefined : (body || '')
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
