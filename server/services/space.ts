/**
 * Helper functions to fetch space data from external APIs (NASA DONKI, NEO, AstronomyAPI).
 * These functions centralize HTTP calls, headers and error handling so routes can remain concise.
 */
import fetch from 'node-fetch';
import httpClient from '../lib/httpClient';

const NASA_API_KEY = process.env.NASA_API_KEY;
const ASTRONOMY_APP_ID = process.env.ASTRONOMY_APP_ID;
const ASTRONOMY_APP_SECRET = process.env.ASTRONOMY_APP_SECRET;

/**
 * Fetch solar flare events from NASA DONKI FLR endpoint.
 * startDate and endDate should be YYYY-MM-DD strings.
 */
export async function getSolarFlares(startDate: string, endDate: string): Promise<any> {
  try {
    if (!NASA_API_KEY) {
      // If no API key is provided we return a small mock to keep callers working in demo mode.
      return [
        {
          flrID: 'mock-flare-1',
          classType: 'M1.0',
          beginTime: new Date().toISOString(),
          peakTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        },
      ];
    }

  const url = `https://api.nasa.gov/DONKI/FLR?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&api_key=${encodeURIComponent(NASA_API_KEY)}`;
  return httpClient.getJson(url, {}, 8000, 2);
  } catch (err) {
    // Bubble up so callers can decide how to handle (or catch here and return mock)
    throw err;
  }
}

/**
 * Fetch Near-Earth Object (NEO) feed from NASA.
 * startDate and endDate should be YYYY-MM-DD strings.
 */
export async function getNeoFeed(startDate: string, endDate: string): Promise<any> {
  try {
    if (!NASA_API_KEY) {
      // demo/mock data when no key available
      return {
        near_earth_objects: {
          [startDate]: [
            {
              id: 'mock-neo-1',
              name: '(MOCK 2025)',
              is_potentially_hazardous_asteroid: false,
              close_approach_data: [{ miss_distance: { kilometers: '1234567' } }],
            },
          ],
        },
      };
    }

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&api_key=${encodeURIComponent(NASA_API_KEY)}`;
  return httpClient.getJson(url, {}, 8000, 2);
  } catch (err) {
    throw err;
  }
}

/**
 * Get the moon position (and related data) from AstronomyAPI.
 * date should be YYYY-MM-DD, lat/lon are decimal degrees.
 * Requires ASTRONOMY_APP_ID and ASTRONOMY_APP_SECRET in env.
 */
export async function getMoonPosition(date: string, lat = 28.5, lon = -80.6): Promise<any> {
  try {
    if (!ASTRONOMY_APP_ID || !ASTRONOMY_APP_SECRET) {
      // return a reasonable mock when credentials are not present
      return {
        date,
        data: {
          table: {
            rows: [
              {
                cells: [
                  {
                    position: {
                      horizontal: { azimuth: { degrees: 135.5 }, altitude: { degrees: 25.3 } },
                    },
                    distance: { kilometers: 384400 },
                  },
                ],
              },
            ],
          },
        },
      };
    }

  const auth = `Basic ${Buffer.from(`${ASTRONOMY_APP_ID}:${ASTRONOMY_APP_SECRET}`).toString('base64')}`;

  const url = `https://api.astronomyapi.com/api/v2/bodies/positions/moon?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&elevation=0&from_date=${encodeURIComponent(date)}&to_date=${encodeURIComponent(date)}&time=12:00:00`;

  return httpClient.getJson(url, { headers: { Authorization: auth } }, 8000, 2);
  } catch (err) {
    throw err;
  }
}

export default {
  getSolarFlares,
  getNeoFeed,
  getMoonPosition,
};
