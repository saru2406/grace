import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

const steamGridApiKey = process.env.STEAMGRID_API_KEY || '';
const igdbClientId = process.env.IGDB_CLIENT_ID || '';
const igdbAccessToken = process.env.IGDB_ACCESS_TOKEN || '';

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

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'steam-api-middleware',
      configureServer(server) {
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
      '/api/igdb': {
        target: 'https://api.igdb.com/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/igdb/, ''),
        headers: igdbProxyHeaders
      }
    }
  }
});
