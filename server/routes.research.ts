import express from 'express';
import research from './services/research';

const router = express.Router();

router.post('/predict-hazards', async (req, res) => {
  const { traj, startDate, endDate } = req.body;
  if (!traj || !startDate || !endDate) return res.status(400).json({ error: 'traj, startDate, endDate required' });
  try {
    const hazards = await research.predictHazardsForTrajectory(traj, startDate, endDate);
    res.json({ status: 'ok', hazards });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

router.post('/generate-backups', (req, res) => {
  const { traj } = req.body;
  if (!traj) return res.status(400).json({ error: 'traj required' });
  const backups = research.generateBackupsForTrajectory(traj);
  res.json({ status: 'ok', backups });
});

router.post('/replay-trajectory', async (req, res) => {
  const { traj, startDate, endDate } = req.body;
  if (!traj || !startDate || !endDate) return res.status(400).json({ error: 'traj, startDate, endDate required' });
  try {
    const hazards = await research.predictHazardsForTrajectory(traj, startDate, endDate);
    const failures = hazards.filter((h: any) => h.type === 'solar_flare' || h.type === 'neo');
    let correctedTraj = { ...traj };
    const corrections: any[] = [];
    for (const f of failures) {
      const { corrected, correction } = research.applyOdinCorrection(correctedTraj, { time: f.timestamp, type: f.type });
      correctedTraj = corrected;
      if (correction) corrections.push({ hazard: f, correction });
      await research.logLesson(traj.missionId || 'unknown', { time: f.timestamp || new Date().toISOString(), summary: `ODIN correction for ${f.type}`, details: { hazard: f, correction } });
    }
    res.json({ status: 'ok', hazards, failures, corrections, correctedTrajectory: correctedTraj });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

router.post('/briefing', async (req, res) => {
  const { date, lat, lon, startDate, endDate } = req.body;
  try {
    const briefing = await research.composeBriefing(date || new Date().toISOString().slice(0,10), lat, lon, startDate, endDate);
    res.json({ status: 'ok', briefing });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

router.post('/log-lesson', async (req, res) => {
  const { missionId, lesson } = req.body;
  if (!missionId || !lesson) return res.status(400).json({ error: 'missionId and lesson required' });
  try {
    await research.logLesson(missionId, lesson);
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

router.get('/lessons/:missionId', async (req, res) => {
  const missionId = req.params.missionId;
  if (!missionId) return res.status(400).json({ error: 'missionId required' });
  try {
    const lessons = await research.getLessons(missionId);
    res.json({ status: 'ok', lessons });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

export default router;
