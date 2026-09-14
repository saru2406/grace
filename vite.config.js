import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

const steamGridApiKey = process.env.STEAMGRID_API_KEY || process.env.VITE_STEAMGRID_API_KEY || '';
const igdbClientId = process.env.IGDB_CLIENT_ID || process.env.VITE_IGDB_CLIENT_ID || '';
const igdbAccessToken = process.env.IGDB_ACCESS_TOKEN || process.env.VITE_IGDB_ACCESS_TOKEN || '';
const steamApiKey = process.env.STEAM_API_KEY || process.env.VITE_STEAM_API_KEY || '';

const steamGridProxyHeaders = steamGridApiKey
  ? { Authorization: `Bearer ${steamGridApiKey}` }
  : {};

const igdbProxyHeaders = igdbClientId && igdbAccessToken
  ? {
      'Client-ID': igdbClientId,
      Authorization: `Bearer ${igdbAccessToken}`
    }
  : {};

function extractXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function parseSteamInput(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profileMatch) return { type: 'profiles', id: profileMatch[1] };

  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([a-zA-Z0-9_-]+)/i);
  if (vanityMatch) return { type: 'id', id: vanityMatch[1] };

  if (/^\d{17}$/.test(trimmed)) return { type: 'profiles', id: trimmed };
  return { type: 'id', id: trimmed.replace(/[^a-zA-Z0-9_-]/g, '') };
}

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/xml, */*',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const steamGridApiKey = env.STEAMGRID_API_KEY || process.env.STEAMGRID_API_KEY || '';
  const igdbClientId = env.IGDB_CLIENT_ID || process.env.IGDB_CLIENT_ID || '';
  const igdbClientSecret = env.IGDB_CLIENT_SECRET || process.env.IGDB_CLIENT_SECRET || '';
  const igdbAccessToken = env.IGDB_ACCESS_TOKEN || process.env.IGDB_ACCESS_TOKEN || '';

  const steamGridProxyHeaders = steamGridApiKey
    ? { Authorization: `Bearer ${steamGridApiKey}` }
    : {};

  return {
  plugins: [
    react(),
    {
      name: 'steam-api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/env-status', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            hasSteamGridKey: Boolean(steamGridApiKey && steamGridApiKey.trim()),
            hasIgdbKeys: Boolean(igdbClientId.trim() && (igdbClientSecret.trim() || igdbAccessToken.trim()))
          }));
        });

        server.middlewares.use('/api/steam-resolve', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { query, apiKey } = payload;
              const parsed = parseSteamInput(query);
              if (!parsed || !parsed.id) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid Steam username, ID, or URL provided.' }));
                return;
              }

              // Fetch Steam Community profile XML
              const profileUrl = `https://steamcommunity.com/${parsed.type}/${encodeURIComponent(parsed.id)}/?xml=1`;
              const xmlRes = await httpsGet(profileUrl);

              if (xmlRes.statusCode !== 200 || !xmlRes.data) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Failed to contact Steam community servers.' }));
                return;
              }

              const xml = xmlRes.data;
              const errorTag = extractXmlTag(xml, 'error');
              if (errorTag) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: errorTag }));
                return;
              }

              const steamID64 = extractXmlTag(xml, 'steamID64') || (parsed.type === 'profiles' ? parsed.id : '');
              const steamID = extractXmlTag(xml, 'steamID') || parsed.id;
              const avatarFull = extractXmlTag(xml, 'avatarFull') || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
              const customURL = extractXmlTag(xml, 'customURL') || parsed.id;
              const location = extractXmlTag(xml, 'location') || '';
              const memberSince = extractXmlTag(xml, 'memberSince') || '';
              const privacyState = extractXmlTag(xml, 'privacyState') || 'public';

              const userProfile = {
                steamId64: steamID64,
                name: steamID,
                avatar: avatarFull,
                customUrl: customURL,
                location,
                memberSince,
                privacyState
              };

              // If Steam Web API key is provided, fetch owned games from Valve Web API
              let games = [];
              if (apiKey && steamID64) {
                const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(apiKey.trim())}&steamid=${encodeURIComponent(steamID64)}&include_appinfo=1&include_played_free_games=1&format=json`;
                const apiRes = await httpsGet(apiUrl);
                if (apiRes.statusCode === 200) {
                  try {
                    const apiData = JSON.parse(apiRes.data);
                    const rawGames = apiData?.response?.games || [];
                    games = rawGames.map(g => ({
                      steamAppId: g.appid,
                      title: g.name,
                      playtimeMinutes: g.playtime_forever,
                      playtime: g.playtime_forever > 0 ? `${Math.round(g.playtime_forever / 60)} hrs` : '0 hrs',
                      iconUrl: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : '',
                      coverUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/library_600x900.jpg`,
                      heroUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/library_hero.jpg`,
                      wideCoverUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`
                    })).sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
                  } catch (e) {
                    console.warn('Failed to parse Steam API response:', e);
                  }
                } else if (apiRes.statusCode === 401 || apiRes.statusCode === 403) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Invalid Steam Web API Key provided. Please verify your key at steamcommunity.com/dev/apikey'
                  }));
                  return;
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                profile: userProfile,
                games,
                hasApiKey: Boolean(apiKey),
                gameCount: games.length
              }));
            } catch (err) {
              console.error('Steam resolve middleware error:', err);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Internal server error' }));
            }
          });
        });

        server.middlewares.use('/api/steam-store-search', async (req, res) => {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost:5173');
            const term = parsedUrl.searchParams.get('term') || '';
            if (!term.trim()) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ total: 0, items: [] }));
              return;
            }
            const storeUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term.trim())}&l=english&cc=US`;
            const steamRes = await httpsGet(storeUrl);
            res.setHeader('Content-Type', 'application/json');
            res.end(steamRes.data || JSON.stringify({ total: 0, items: [] }));
          } catch (err) {
            console.error('Steam store search error:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ total: 0, items: [] }));
          }
        });

        // Twitch OAuth2 token manager for IGDB
        let cachedTwitchToken = null;
        let twitchTokenExpiry = 0;

        async function getTwitchToken() {
          if (cachedTwitchToken && Date.now() < twitchTokenExpiry) {
            return cachedTwitchToken;
          }

          const candidateSecret = igdbClientSecret || (igdbAccessToken && igdbAccessToken.length <= 32 ? igdbAccessToken : null);
          if (igdbClientId && candidateSecret) {
            try {
              const params = new URLSearchParams({
                client_id: igdbClientId.trim(),
                client_secret: candidateSecret.trim(),
                grant_type: 'client_credentials'
              });
              const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
              });
              if (tokenRes.ok) {
                const data = await tokenRes.json();
                if (data && data.access_token) {
                  cachedTwitchToken = data.access_token;
                  twitchTokenExpiry = Date.now() + Math.max((data.expires_in || 3600) - 120, 60) * 1000;
                  return cachedTwitchToken;
                }
              }
            } catch (err) {
              console.warn('Vite proxy Twitch OAuth token error:', err);
            }
          }

          return igdbAccessToken ? igdbAccessToken.trim() : (cachedTwitchToken || '');
        }

        server.middlewares.use('/api/igdb', async (req, res) => {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Client-ID, Authorization');
            res.statusCode = 200;
            res.end();
            return;
          }

          let token = await getTwitchToken();
          if (!igdbClientId || !token) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              error: 'IGDB credentials not configured. Please set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET (or IGDB_ACCESS_TOKEN) in .env.'
            }));
            return;
          }

          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const subPath = (req.url || '').replace(/^\//, '').split('?')[0];
              const targetUrl = `https://api.igdb.com/v4/${subPath}`;

              const headers = {
                'Client-ID': igdbClientId.trim(),
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain',
                'Accept': 'application/json'
              };

              let igdbRes = await fetch(targetUrl, {
                method: req.method,
                headers,
                body: req.method === 'GET' ? undefined : (body || '')
              });

              // Retry on 401 if candidate secret is available
              const candidateSecret = igdbClientSecret || (igdbAccessToken && igdbAccessToken.length <= 32 ? igdbAccessToken : null);
              if (igdbRes.status === 401 && candidateSecret) {
                cachedTwitchToken = null;
                twitchTokenExpiry = 0;
                const freshToken = await getTwitchToken();
                if (freshToken) {
                  headers['Authorization'] = `Bearer ${freshToken}`;
                  igdbRes = await fetch(targetUrl, {
                    method: req.method,
                    headers,
                    body: req.method === 'GET' ? undefined : (body || '')
                  });
                }
              }

              res.statusCode = igdbRes.status;
              res.setHeader('Content-Type', igdbRes.headers.get('content-type') || 'application/json');
              const text = await igdbRes.text();
              res.end(text);
            } catch (e) {
              console.error('Vite /api/igdb proxy error:', e);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message || 'IGDB request failed' }));
            }
          });
        });
      }
    }
  ],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api/steamgriddb': {
        target: 'https://www.steamgriddb.com/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steamgriddb/, ''),
        headers: steamGridProxyHeaders
      },
      '/api/steamstore': {
        target: 'https://store.steampowered.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steamstore/, '')
      }
    }
  }
};
});
