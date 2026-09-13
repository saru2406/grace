// Cloudflare Pages Function to proxy SteamGridDB API requests on Cloudflare's free tier
// Handles /api/steamgriddb/* routes automatically at the edge

const API_KEY = '4cfb690f7e0a2aace2617077f4a42aac';
const STEAMGRID_BASE = 'https://www.steamgriddb.com/api/v2';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Extract path following /api/steamgriddb
  const pathParts = params.path || [];
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
  const targetUrl = `${STEAMGRID_BASE}/${subPath}${url.search}`;

  try {
    const steamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const responseBody = await steamResponse.text();
    const headers = new Headers(steamResponse.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Type', 'application/json; charset=utf-8');

    return new Response(responseBody, {
      status: steamResponse.status,
      headers
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}
