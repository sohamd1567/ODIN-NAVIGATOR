import type { Handler } from "@netlify/functions";

// Simple in-memory cache for demo/hackathon mode
const cache: Record<string, { ts: number; ttl: number; data: any }> = {};

function setCache(key: string, data: any, ttl = 60) {
  cache[key] = { ts: Date.now(), ttl, data };
}

function getCache(key: string) {
  const entry = cache[key];
  if (!entry) return null;
  if ((Date.now() - entry.ts) / 1000 > entry.ttl) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

// HTTP client for external API calls
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function getJson(url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<any> {
  const res = await fetchWithTimeout(url, { ...opts, method: 'GET' }, timeoutMs);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} when fetching ${url}: ${body}`);
  }
  return res.json();
}

// Moon position service
async function getMoonPosition(date: string, lat = 28.5, lon = -80.6): Promise<any> {
  try {
    const ASTRONOMY_APP_ID = process.env.ASTRONOMY_APP_ID;
    const ASTRONOMY_APP_SECRET = process.env.ASTRONOMY_APP_SECRET;

    if (!ASTRONOMY_APP_ID || !ASTRONOMY_APP_SECRET) {
      // Return a reasonable mock when credentials are not present
      return {
        date,
        data: {
          phase: {
            phase_name: "Waxing Gibbous",
            illumination: 0.75
          },
          table: {
            rows: [{
              cells: [{
                position: {
                  horizontal: { azimuth: { degrees: 135.5 }, altitude: { degrees: 25.3 } }
                },
                distance: { kilometers: 384400 }
              }]
            }]
          }
        }
      };
    }

    const auth = `Basic ${Buffer.from(`${ASTRONOMY_APP_ID}:${ASTRONOMY_APP_SECRET}`).toString('base64')}`;
    const url = `https://api.astronomyapi.com/api/v2/bodies/positions/moon?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&elevation=0&from_date=${encodeURIComponent(date)}&to_date=${encodeURIComponent(date)}&time=12:00:00`;

    return getJson(url, { headers: { Authorization: auth } }, 8000);
  } catch (err) {
    throw err;
  }
}

export const handler: Handler = async (event) => {
  try {
    const headers = {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type",
      "access-control-allow-methods": "GET, OPTIONS"
    };

    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const query = event.queryStringParameters || {};
    const date = query.date || new Date().toISOString().split('T')[0];
    const lat = parseFloat(query.lat || '28.5');
    const lon = parseFloat(query.lon || '-80.6');
    
    const cacheKey = `moon:${date}:${lat}:${lon}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(cached)
      };
    }

    const position = await getMoonPosition(date, lat, lon);

    // Extract a small, consistent shape for client widgets
    const phase = position?.data?.phase?.phase_name || position?.data?.phase?.phase || 'Unknown';
    const illumination = position?.data?.phase?.illumination ?? position?.data?.phase?.illumination_percentage ?? 0;
    const distance_km = position?.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || position?.distance || 384400;

    const payload = { date, phase, illumination, distance_km };
    setCache(cacheKey, payload, 15 * 60); // 15 minutes TTL

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('Error in space-moon function:', err);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({ error: 'Failed to fetch moon summary' })
    };
  }
};
