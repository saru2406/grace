export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const term = req.query.term || '';
  if (!term.trim()) {
    return res.status(200).json({ total: 0, items: [] });
  }

  try {
    const storeUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term.trim())}&l=english&cc=US`;
    const upstreamRes = await fetch(storeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      }
    });

    const data = await upstreamRes.json();
    return res.status(200).json(data || { total: 0, items: [] });
  } catch (err) {
    console.error('Steam store search error:', err);
    return res.status(200).json({ total: 0, items: [] });
  }
}
