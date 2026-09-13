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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        payload = {};
      }
    }
    payload = payload || {};

    const { query, apiKey } = payload;
    const parsed = parseSteamInput(query);
    if (!parsed || !parsed.id) {
      return res.status(200).json({ success: false, error: 'Invalid Steam username, ID, or URL provided.' });
    }

    const profileUrl = `https://steamcommunity.com/${parsed.type}/${encodeURIComponent(parsed.id)}/?xml=1`;
    const xmlResponse = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/xml, application/xml, */*'
      }
    });

    if (!xmlResponse.ok) {
      return res.status(200).json({ success: false, error: 'Failed to contact Steam community servers.' });
    }

    const xml = await xmlResponse.text();
    const errorTag = extractXmlTag(xml, 'error');
    if (errorTag) {
      return res.status(200).json({ success: false, error: errorTag });
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

    let games = [];
    if (apiKey && steamID64) {
      const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(apiKey.trim())}&steamid=${encodeURIComponent(steamID64)}&include_appinfo=1&include_played_free_games=1&format=json`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (apiRes.ok) {
        try {
          const apiData = await apiRes.json();
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
      } else if (apiRes.status === 401 || apiRes.status === 403) {
        return res.status(200).json({
          success: false,
          error: 'Invalid Steam Web API Key provided. Please verify your key at steamcommunity.com/dev/apikey'
        });
      }
    }

    return res.status(200).json({
      success: true,
      profile: userProfile,
      games,
      hasApiKey: Boolean(apiKey),
      gameCount: games.length
    });
  } catch (err) {
    console.error('Steam resolve error on Vercel:', err);
    return res.status(200).json({ success: false, error: err.message || 'Internal server error' });
  }
}
