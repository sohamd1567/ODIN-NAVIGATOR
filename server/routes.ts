import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // NASA and Astronomy API integration for real space data
  const NASA_API_KEY = process.env.NASA_API_KEY;
  const ASTRONOMY_APP_ID = process.env.ASTRONOMY_APP_ID;
  const ASTRONOMY_APP_SECRET = process.env.ASTRONOMY_APP_SECRET;

  // Get current solar flare data from NASA DONKI API
  app.get("/api/solar-flares", async (req, res) => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDate}&api_key=${NASA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data.slice(0, 5)); // Latest 5 events
    } catch (error) {
      console.error('Error fetching solar flare data:', error);
      res.status(500).json({ error: 'Failed to fetch solar flare data' });
    }
  });

  // Get near-Earth asteroid data from NASA NEO API
  app.get("/api/near-earth-objects", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`NASA NEO API error: ${response.status}`);
      }
      
      const data = await response.json();
      const asteroids = Object.values(data.near_earth_objects)[0] as any[];
      
      // Filter for potentially hazardous or close-approach objects
      const hazardousAsteroids = asteroids.filter(asteroid => 
        asteroid.is_potentially_hazardous_asteroid || 
        parseFloat(asteroid.close_approach_data[0]?.miss_distance.kilometers) < 10000000
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
      const authHeader = `Basic ${Buffer.from(`${ASTRONOMY_APP_ID}:${ASTRONOMY_APP_SECRET}`).toString('base64')}`;
      
      // Get moon phase data
      const phaseResponse = await fetch(
        `https://api.astronomyapi.com/api/v2/moon/phase?lat=28.5&lon=-80.6&date=${today}&format=json`,
        {
          headers: {
            'Authorization': authHeader
          }
        }
      );
      
      if (!phaseResponse.ok) {
        throw new Error(`Astronomy API phase error: ${phaseResponse.status}`);
      }
      
      const phaseData = await phaseResponse.json();
      
      // Get moon position data  
      const positionResponse = await fetch(
        `https://api.astronomyapi.com/api/v2/bodies/positions/moon?lat=28.5&lon=-80.6&elevation=0&from_date=${today}&to_date=${today}&time=12:00:00`,
        {
          headers: {
            'Authorization': authHeader
          }
        }
      );
      
      if (!positionResponse.ok) {
        throw new Error(`Astronomy API position error: ${positionResponse.status}`);
      }
      
      const positionData = await positionResponse.json();
      
      const moonData = {
        date: today,
        moonPhase: {
          phase: phaseData.data?.phase?.phase_name || 'Unknown',
          illumination: phaseData.data?.phase?.illumination || 0,
          age: phaseData.data?.phase?.age || 0
        },
        moonPosition: {
          azimuth: positionData.data?.table?.rows?.[0]?.cells?.[0]?.position?.horizontal?.azimuth?.degrees || 0,
          altitude: positionData.data?.table?.rows?.[0]?.cells?.[0]?.position?.horizontal?.altitude?.degrees || 0,
          distance: positionData.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || 384400,
          angularDiameter: positionData.data?.table?.rows?.[0]?.cells?.[0]?.position?.angular_diameter?.degrees || 0.5
        }
      };
      
      res.json(moonData);
    } catch (error) {
      console.error('Error fetching moon data:', error);
      res.status(500).json({ error: 'Failed to fetch moon data' });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ODIN systems operational",
      timestamp: new Date().toISOString(),
      apis: {
        nasa: !!NASA_API_KEY,
        astronomy: !!(ASTRONOMY_APP_ID && ASTRONOMY_APP_SECRET)
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
