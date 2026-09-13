export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const steamKey = process.env.STEAMGRID_API_KEY || '';
  const clientId = process.env.IGDB_CLIENT_ID || '';
  const clientSecret = process.env.IGDB_CLIENT_SECRET || '';
  const accessToken = process.env.IGDB_ACCESS_TOKEN || '';

  res.status(200).json({
    hasSteamGridKey: Boolean(steamKey.trim()),
    hasIgdbKeys: Boolean(clientId.trim() && (clientSecret.trim() || accessToken.trim()))
  });
}
