import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import hazardRouter from './routes/hazard';
import { getSolarFlares, getNeoFeed, getMoonPosition } from './services/space';
import httpClient from './lib/httpClient';

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

// Minimal helper to synthesize a trajectory path and simple stats
function synthesizeTrajectory(moonPos: any) {
  // For demo: produce a few control points forming a curved path from Earth to Moon
  // Coordinates are normalized for the front-end SVG viewBox used by TrajectoryVisualization
  const start = { x: 70, y: 100 }; // Earth
  const end = { x: 330, y: 80 }; // Moon
  const mid = { x: 200, y: 60 + ((moonPos?.data?.table?.rows?.[0]?.cells?.[0]?.position?.horizontal?.altitude?.degrees || 0) / 90) * 40 };

  // Rough estimate of travel time: scale with distance (use moon distance km if available)
  const distance_km = Number(moonPos?.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || 384400);
  // assume spacecraft average speed 5 km/s for demo -> time (s) = distance / speed
  const avgSpeed = 5; // km/s
  const timeSeconds = distance_km / avgSpeed;
  const timeDays = timeSeconds / (60 * 60 * 24);

  // simple delta-v estimate: small constant plus scaled component
  const deltaV = Math.max(0.5, (distance_km / 100000) * 0.1); // km/s

  const pathD = `M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`;

  return {
    path: pathD,
    control: mid,
    points: [start, mid, end],
    travel_time_days: Number(timeDays.toFixed(2)),
    delta_v_km_s: Number(deltaV.toFixed(3)),
    distance_km,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // NASA and Astronomy API integration for real space data
  const NASA_API_KEY = process.env.NASA_API_KEY;
  const ASTRONOMY_APP_ID = process.env.ASTRONOMY_APP_ID;
  const ASTRONOMY_APP_SECRET = process.env.ASTRONOMY_APP_SECRET;

  app.get("/api/solar-flares", async (req, res) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const data = await getSolarFlares(startDate, endDate);
      if (Array.isArray(data)) {
        return res.json(data.slice(0, 5));
      }
      return res.json(data);
    } catch (error) {
      console.error('Error fetching solar flare data:', error);
      res.status(500).json({ error: 'Failed to fetch solar flare data' });
    }
  });

  // Get near-Earth asteroid data from NASA NEO API
  app.get("/api/near-earth-objects", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await getNeoFeed(today, today);
      const asteroids = Object.values(data.near_earth_objects)[0] as any[] || [];
      const hazardousAsteroids = asteroids.filter(asteroid => 
        asteroid.is_potentially_hazardous_asteroid || 
        parseFloat(asteroid.close_approach_data?.[0]?.miss_distance?.kilometers || '0') < 10000000
      ).slice(0, 3);
      res.json(hazardousAsteroids);
    } catch (error) {
      console.error('Error fetching NEO data:', error);
      res.status(500).json({ error: 'Failed to fetch asteroid data' });
    }
  });

  // Get current moon data from Astronomy API
  app.get("/api/moon-data", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const position = await getMoonPosition(today, 28.5, -80.6);

      // Try to fetch phase via the public moon phase endpoint using the same service, but the service currently exposes position only
      // For now we synthesize a simple phase object from position response where possible
      const moonData = {
        date: today,
        moonPhase: {
          phase: position?.data?.phase?.phase_name || 'Unknown',
          illumination: position?.data?.phase?.illumination || 0,
          age: position?.data?.phase?.age || 0
        },
        moonPosition: {
          azimuth: position?.data?.table?.rows?.[0]?.cells?.[0]?.position?.horizontal?.azimuth?.degrees || 0,
          altitude: position?.data?.table?.rows?.[0]?.cells?.[0]?.position?.horizontal?.altitude?.degrees || 0,
          distance: position?.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || 384400,
          angularDiameter: position?.data?.table?.rows?.[0]?.cells?.[0]?.position?.angular_diameter?.degrees || 0.5
        }
      };

      res.json(moonData);
    } catch (error) {
      console.error('Error fetching moon data:', error);
      res.status(500).json({ error: 'Failed to fetch moon data' });
    }
  });

  // Lightweight moon summary endpoint for client widgets
  app.get('/api/space/moon', async (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const lat = parseFloat(String(req.query.lat || '28.5'));
      const lon = parseFloat(String(req.query.lon || '-80.6'));
      const cacheKey = `moon:${date}:${lat}:${lon}`;
      const cached = getCache(cacheKey);
      if (cached) return res.json(cached);

      const position = await getMoonPosition(date, lat, lon);

      // Try to extract a small, consistent shape for client widgets
      const phase = position?.data?.phase?.phase_name || position?.data?.phase?.phase || 'Unknown';
      const illumination = position?.data?.phase?.illumination ?? position?.data?.phase?.illumination_percentage ?? 0;
      const distance_km = position?.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || position?.distance || 384400;

      const payload = { date, phase, illumination, distance_km };
      setCache(cacheKey, payload, 15 * 60); // 15 minutes TTL
      res.json(payload);
    } catch (err) {
      console.error('Error in /api/space/moon:', err);
      res.status(500).json({ error: 'Failed to fetch moon summary' });
    }
  });

  // Space weather summary (solar flares + NEO simplified)
  app.get('/api/space-weather', async (req, res) => {
    const cacheKey = 'space-weather';
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fallback: false });

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const flares = await getSolarFlares(startDate, endDate).catch(e => { throw e; });
      const neos = await getNeoFeed(startDate, endDate).catch(e => { throw e; });

      const summary = {
        flares: Array.isArray(flares) ? flares.slice(0, 5) : [],
        near_earth_objects: neos?.near_earth_objects || {},
        timestamp: new Date().toISOString()
      };

      setCache(cacheKey, summary, 60);
      res.json({ ...summary, fallback: false });
    } catch (err: any) {
      console.error('Error in /api/space-weather:', err);
      const cachedFallback = getCache('space-weather');
      if (cachedFallback) {
        res.setHeader('X-ODIN-Fallback', 'true');
        return res.json({ ...cachedFallback, fallback: true });
      }

      // Rate limit detection: if message or status mentions 429
      const isRateLimited = String(err?.message || '').includes('429') || String(err?.status || '').includes('429');
      if (isRateLimited) res.setHeader('X-ODIN-RateLimit', 'true');

      res.status(500).json({ error: 'Failed to fetch space weather', rateLimited: isRateLimited });
    }
  });

  // Trajectory endpoint: synthesizes a live trajectory using moon position and space weather context
  app.get('/api/trajectory', async (req, res) => {
    const cacheKey = 'trajectory';
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fallback: false });

    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const moonPos = await getMoonPosition(date, 28.5, -80.6);

      const traj = synthesizeTrajectory(moonPos);

      const payload = {
        path: traj.path,
        points: traj.points,
        travel_time_days: traj.travel_time_days,
        delta_v_km_s: traj.delta_v_km_s,
        distance_km: traj.distance_km,
        timestamp: new Date().toISOString(),
      };

      setCache(cacheKey, payload, 30); // short TTL
      res.json({ ...payload, fallback: false });
    } catch (err: any) {
      console.error('Error in /api/trajectory:', err);
      const cachedFallback = getCache('trajectory');
      if (cachedFallback) {
        res.setHeader('X-ODIN-Fallback', 'true');
        return res.json({ ...cachedFallback, fallback: true });
      }

      const isRateLimited = String(err?.message || '').includes('429') || String(err?.status || '').includes('429');
      if (isRateLimited) res.setHeader('X-ODIN-RateLimit', 'true');
      res.status(500).json({ error: 'Failed to synthesize trajectory', rateLimited: isRateLimited });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ODIN systems operational",
      timestamp: new Date().toISOString(),
      apis: {
        nasa: !!NASA_API_KEY,
        astronomy: !!(ASTRONOMY_APP_ID && ASTRONOMY_APP_SECRET),
        mode: (!NASA_API_KEY || !ASTRONOMY_APP_ID || !ASTRONOMY_APP_SECRET) ? "demo" : "live"
      }
    });
  });

  // Hazard analysis (ML-driven) route
  app.use('/api/hazard', hazardRouter);

  // Research endpoints for predictive hazard modeling, backups, replay and briefings
  try {
    // dynamic import (ESM-friendly) to avoid require in ESM contexts
    import('./routes.research').then(mod => {
      const researchRouter = mod.default;
      if (researchRouter) app.use('/api/research', researchRouter);
    }).catch(err => {
      console.warn('research routes not available', err);
    });
  } catch (e) {
    console.warn('research routes not available', e);
  }

  const httpServer = createServer(app);
  return httpServer;
}
