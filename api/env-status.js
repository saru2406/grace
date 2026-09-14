export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const steamKey = (process.env.STEAMGRID_API_KEY || process.env.VITE_STEAMGRID_API_KEY || '').trim();
  const clientId = (process.env.IGDB_CLIENT_ID || process.env.VITE_IGDB_CLIENT_ID || '').trim();
  const clientSecret = (process.env.IGDB_CLIENT_SECRET || process.env.VITE_IGDB_CLIENT_SECRET || '').trim();
  const accessToken = (process.env.IGDB_ACCESS_TOKEN || process.env.VITE_IGDB_ACCESS_TOKEN || '').trim();

  res.status(200).json({
    hasSteamGridKey: Boolean(steamKey),
    hasIgdbKeys: Boolean(clientId && (clientSecret || accessToken))
  });
}
