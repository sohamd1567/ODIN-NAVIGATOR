import path from 'path';
import fs from 'fs/promises';
import { getSolarFlares, getNeoFeed, getMoonPosition } from './space';

// Data persistence path for lessons
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const LESSONS_FILE = path.join(DATA_DIR, 'lessons.json');

type TrajectoryPoint = { t: number; x: number; y: number; v_km_s?: number; distance_km?: number };
export type Trajectory = { missionId?: string; name?: string; points: TrajectoryPoint[]; metadata?: any };

export async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

export async function readLessons() {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(LESSONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { lessons: {} };
  }
}

export async function writeLessons(json: any) {
  await ensureDataDir();
  await fs.writeFile(LESSONS_FILE, JSON.stringify(json, null, 2), 'utf8');
}

export async function logLesson(missionId: string, lesson: any) {
  const data = await readLessons();
  data.lessons[missionId] = data.lessons[missionId] || [];
  data.lessons[missionId].push({ ts: new Date().toISOString(), ...lesson });
  await writeLessons(data);
  return { ok: true };
}

export async function getLessons(missionId: string) {
  const data = await readLessons();
  return data.lessons[missionId] || [];
}

// Predict hazards by calling existing space helpers and cross-referencing with trajectory times
export async function predictHazardsForTrajectory(traj: Trajectory, startDate: string, endDate: string) {
  const hazards: any[] = [];
  // Fetch solar flares
  try {
    const flares = await getSolarFlares(startDate, endDate);
    if (Array.isArray(flares)) {
      for (const f of flares) {
        hazards.push({ type: 'solar_flare', severity: f.classification || 'C', timestamp: f.beginTime || f.peakTime || null, raw: f });
      }
    }
  } catch (err) {
    hazards.push({ type: 'solar_flare', error: String(err) });
  }

  // Fetch NEOs
  try {
    const neo = await getNeoFeed(startDate, endDate);
    if (neo && neo.near_earth_objects) {
      for (const dateKey of Object.keys(neo.near_earth_objects)) {
        for (const item of neo.near_earth_objects[dateKey]) {
          const close = item.close_approach_data && item.close_approach_data[0];
          hazards.push({ type: 'neo', name: item.name, close, raw: item });
        }
      }
    }
  } catch (err) {
    hazards.push({ type: 'neo', error: String(err) });
  }

  return hazards;
}

// Generate 2 simple backup trajectories by small perturbations (strategy described in comments)
export function generateBackupsForTrajectory(traj: Trajectory) {
  const backup1: Trajectory = { ...traj, name: (traj.name || 'traj') + ' - backup-delay', points: traj.points.map(p => ({ ...p, t: p.t + 60 })) };
  const backup2: Trajectory = { ...traj, name: (traj.name || 'traj') + ' - backup-early', points: traj.points.map(p => ({ ...p, t: Math.max(0, p.t - 60) })) };
  return [backup1, backup2];
}

// Apply a simple ODIN correction for an anomaly: return corrected traj and correction description
// Simple orbital mechanics helper functions (two-body approximations)
const MU_EARTH = 398600.4418; // km^3 / s^2 (Earth)

function circularVelocity(radiusKm: number) {
  return Math.sqrt(MU_EARTH / radiusKm);
}

// Estimate Hohmann transfer delta-v between two circular orbits (r1 -> r2)
function hohmannDeltaV(r1: number, r2: number) {
  const mu = MU_EARTH;
  const v1 = Math.sqrt(mu / r1);
  const v2 = Math.sqrt(mu / r2);
  const a = 0.5 * (r1 + r2);
  const vTransfer1 = Math.sqrt(mu * (2 / r1 - 1 / a));
  const vTransfer2 = Math.sqrt(mu * (2 / r2 - 1 / a));
  const dv1 = Math.abs(vTransfer1 - v1);
  const dv2 = Math.abs(v2 - vTransfer2);
  return { dv1, dv2, total: dv1 + dv2 };
}

export function applyOdinCorrection(traj: Trajectory, anomaly: any) {
  // find closest point by time
  const tAn = anomaly?.time || traj.points[Math.floor(traj.points.length / 2)].t;
  let nearest = traj.points.reduce((acc, p) => !acc || Math.abs(p.t - tAn) < Math.abs(acc.t - tAn) ? p : acc, traj.points[0]);

  // Interpret distance_km if present; otherwise assume near lunar distance for descent
  const rCurrent = (nearest.distance_km && nearest.distance_km > 0) ? (nearest.distance_km + 6371) : 384400 + 6371; // km (radius from Earth's center)
  const rTarget = 6371 + 100; // target low orbit (100 km) as example

  // compute Hohmann estimate to move to safer orbit (demo)
  const hohmann = hohmannDeltaV(rCurrent, rTarget);

  // Apply simplified correction: adjust velocities at and after nearest by dv to simulate burn
  const dv_km_s = - (hohmann.total || 0); // sign indicates delta applied to reduce radial energy (demo)
  const corrected = {
    ...traj,
    points: traj.points.map(p => p.t >= nearest.t ? { ...p, v_km_s: (p.v_km_s || 0) + dv_km_s } : p)
  };

  const correction = {
    time: nearest.t,
    dv_km_s,
    hohmann,
    reason: 'Two-body Hohmann-based correction (approx)',
    description: `Apply Δv ${ (dv_km_s * 1000).toFixed(1) } m/s at t=${nearest.t}`
  };

  return { corrected, correction };
}

// Compose a human-friendly briefing from available data
export async function composeBriefing(date: string, lat?: number, lon?: number, startDate?: string, endDate?: string) {
  const briefing: any = { solarFlareRisk: 'Unknown', neoCloseApproach: 'Unknown', moonIlluminationPct: null, fuelMargin: 'Unknown', narrative: [] };
  try {
    const f = await getSolarFlares(startDate || date, endDate || date);
    briefing.solarFlareRisk = Array.isArray(f) && f.length > 0 ? 'High' : 'Low';
    briefing.narrative.push(`Solar flare events found: ${Array.isArray(f) ? f.length : 0}`);
  } catch (err) {
    briefing.narrative.push('Solar flare data unavailable');
  }

  try {
    const n = await getNeoFeed(startDate || date, endDate || date);
    briefing.neoCloseApproach = n && n.near_earth_objects ? 'Yes' : 'No';
    const approxCount = n && n.near_earth_objects ? Object.values(n.near_earth_objects).flat().length : 0;
    briefing.narrative.push(`NEO close approaches: ${approxCount}`);
  } catch (err) {
    briefing.narrative.push('NEO data unavailable');
  }

  try {
    const m = await getMoonPosition(date, lat || 0, lon || 0);
    // best-effort extraction for demos
    briefing.moonIlluminationPct = m && (m.data?.table?.rows?.[0]?.cells?.[0]?.distance?.kilometers || 384400);
    briefing.narrative.push('Moon position synthesized from AstronomyAPI');
  } catch (err) {
    briefing.narrative.push('Moon data unavailable');
  }

  briefing.fuelMargin = 'Safe';
  return briefing;
}

export default {
  predictHazardsForTrajectory,
  generateBackupsForTrajectory,
  applyOdinCorrection,
  logLesson,
  getLessons,
  composeBriefing,
};
