import { Router } from 'express';
import { ppoAgent } from '../ai/ppo';
const router = Router();
// POST /api/hazard/analyze
// Body: { hazard_type, hazard_severity (0-1), baseline_time_days, baseline_dv_km_s, distance_km, fuel_pct }
router.post('/analyze', async (req, res) => {
    try {
        const body = (req.body || {});
        const hazard_type = body.hazard_type ?? 'unknown';
        const hazard_severity = Number(body.hazard_severity ?? 0.5); // 0..1
        const baseline_time_days = Number(body.baseline_time_days ?? 3.5);
        const baseline_dv_km_s = Number(body.baseline_dv_km_s ?? 0);
        const distance_km = Number(body.distance_km ?? 384400);
        const fuel_pct = Number(body.fuel_pct ?? 1);
        // Prepare input for agent: [hazard_severity (0..10), distance_km, baseline_dv_m_s, fuel_pct]
        const severity_for_agent = Math.max(0, Math.min(1, hazard_severity)) * 10;
        const baseline_dv_m_s = baseline_dv_km_s * 1000; // convert km/s -> m/s
        const agentInput = [severity_for_agent, distance_km, baseline_dv_m_s, fuel_pct];
        try {
            const [dv_adj_m_s, time_adj_days] = await ppoAgent.predict(agentInput);
            const dv_adj_km_s = dv_adj_m_s / 1000;
            const optimized_time = baseline_time_days + time_adj_days;
            const optimized_dv = baseline_dv_km_s + dv_adj_km_s;
            const resp = {
                optimized_time,
                optimized_dv,
                dv_adj: dv_adj_km_s,
                time_adj: time_adj_days,
                selected_strategy: 'ppo_suggestion',
                status: 'ok'
            };
            return res.json(resp);
        }
        catch (agentErr) {
            console.error('PPO agent failed', agentErr);
            const resp = {
                optimized_time: baseline_time_days,
                optimized_dv: baseline_dv_km_s,
                dv_adj: 0,
                time_adj: 0,
                selected_strategy: 'baseline',
                status: 'fallback'
            };
            return res.json(resp);
        }
    }
    catch (err) {
        console.error('hazard analyze unexpected error', err);
        return res.status(500).json({ error: 'hazard analysis failed', status: 'error' });
    }
});
export default router;
