// A very small PPO-like policy network implementation for demo purposes.
// The tensorflow native binary can be large and cause high memory use at startup.
// We lazy-load @tensorflow/tfjs-node when predict() is called to keep server
import * as tf from '@tensorflow/tfjs-node';
// Lightweight PPO-like agent for inference (demo).
// Not a production RL implementation; provides a simple policy network for
// returning two continuous adjustments: [deltaV_adjustment, time_adjustment].
//
// Input vector (assumed order):
// [hazard_severity, distance_km, baseline_dv, fuel_pct]
// - hazard_severity: 0..10 (higher is worse)
// - distance_km: kilometers to target (e.g., ~384400 for Moon)
// - baseline_dv: baseline delta-v estimate in m/s
// - fuel_pct: 0..1 fraction of remaining fuel
//
// Output values (interpretation is up to caller):
// - deltaV_adjustment: meters/sec (can be negative to reduce burn or positive to increase)
// - time_adjustment: days (positive to add time, negative to shorten)
export class PPOAgent {
    model = null;
    // createModel builds and returns a small tf.Sequential model.
    // The caller can keep the returned model or let this class hold it.
    createModel() {
        const model = tf.sequential();
        // input shape: 4 features
        model.add(tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
        // two outputs in [-1, 1] range via tanh
        model.add(tf.layers.dense({ units: 2, activation: 'tanh' }));
        model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
        this.model = model;
        return model;
    }
    // Predict adjustments. Accepts a numeric input array and returns a Promise of two numbers.
    // If a model isn't available or an error occurs, returns a safe fallback [0.05, 0.1].
    async predict(input) {
        // Basic validation: ensure 4 inputs
        if (!input || input.length < 4) {
            // fallback small adjustment
            return [0.05, 0.1];
        }
        // Ensure we have a model; if not, create a default one
        if (!this.model) {
            try {
                this.createModel();
            }
            catch (err) {
                // If TF native fails to initialize, return fallback
                return [0.05, 0.1];
            }
        }
        try {
            // Normalize inputs to help model generalize — simple min-max heuristics
            const [hazard_severity, distance_km, baseline_dv, fuel_pct] = input;
            const normSeverity = Math.max(0, Math.min(10, hazard_severity)) / 10; // 0..1
            const normDistance = (distance_km || 384400) / 384400; // ~1 for lunar distance
            const normDv = (baseline_dv || 0) / 1000; // scale m/s to ~0.. few units
            const normFuel = Math.max(0, Math.min(1, fuel_pct));
            const tensor = tf.tensor2d([[normSeverity, normDistance, normDv, normFuel]]);
            const out = this.model.predict(tensor);
            const arr = await out.data();
            tensor.dispose();
            out.dispose();
            // Scale outputs to meaningful ranges for this domain
            const deltaV_adjustment = Number(arr[0]) * 100; // map tanh(-1..1) -> -100..100 m/s
            const time_adjustment = Number(arr[1]) * 1.0; // map tanh -> -1..1 days
            // Safe defaults if values are NaN
            const dv = Number.isFinite(deltaV_adjustment) ? deltaV_adjustment : 0.05;
            const tm = Number.isFinite(time_adjustment) ? time_adjustment : 0.1;
            return [dv, tm];
        }
        catch (err) {
            // On any error, return a small safe adjustment
            return [0.05, 0.1];
        }
    }
    // Stub: loadModel from filesystem (expects tfjs layers format)
    async loadModel(path) {
        if (!path)
            return Promise.resolve();
        try {
            // tf.loadLayersModel expects file:// prefix when loading from disk
            const model = await tf.loadLayersModel(`file://${path}/model.json`);
            this.model = model;
        }
        catch (err) {
            // ignore errors in stub
        }
    }
    // Stub: saveModel to filesystem (tfjs layers format)
    async saveModel(path) {
        if (!path || !this.model)
            return Promise.resolve();
        try {
            await this.model.save(`file://${path}`);
        }
        catch (err) {
            // ignore in stub
        }
    }
}
// Export a singleton instance for easy import elsewhere
export const ppoAgent = new PPOAgent();
export default PPOAgent;
