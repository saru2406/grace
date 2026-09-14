export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const term = req.query.term || '';
  if (!term.trim()) {
    return res.status(200).json({ total: 0, items: [] });
  }

  try {
    const storeUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term.trim())}&l=english&cc=US`;
    const response = await fetch(storeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!response.ok) {
      return res.status(200).json({ total: 0, items: [] });
    }

    const data = await response.json();
    return res.status(200).json(data || { total: 0, items: [] });
  } catch (error) {
    console.error('Vercel Steam store search error:', error);
    return res.status(200).json({ total: 0, items: [] });
  }
}
