import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { registerRoutes } from '../routes';
import request from 'supertest';

let server: any;
let app: express.Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(() => {
  // close server if started
  try {
    server.close && server.close();
  } catch (e) {
    // ignore
  }
});

describe('/api/space/moon', () => {
  it('returns moon summary schema', async () => {
    const res = await request(app).get('/api/space/moon');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('date');
    expect(res.body).toHaveProperty('phase');
    expect(res.body).toHaveProperty('illumination');
    expect(res.body).toHaveProperty('distance_km');
  });

  it('accepts a date query param', async () => {
    const res = await request(app).get('/api/space/moon?date=2025-08-29');
    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2025-08-29');
  });
});
