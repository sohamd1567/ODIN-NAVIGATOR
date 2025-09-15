// client/src/services/tensorflow.ts
// Lazy-loaded TensorFlow.js helpers for ODIN dashboard

// We import tf dynamically to keep initial bundle light.
let tfRef: typeof import('@tensorflow/tfjs') | null = null;
let modelRef: import('@tensorflow/tfjs').LayersModel | null = null;

async function ensureTF() {
  if (!tfRef) {
    const tf = await import('@tensorflow/tfjs');
    try {
      await tf.setBackend('webgl');
    } catch {
      await tf.setBackend('cpu');
    }
    await tf.ready();
    tfRef = tf;
  }
  return tfRef!;
}

export async function loadModel(modelUrl: string = '/models/odin-model/model.json') {
  const tf = await ensureTF();
  if (modelRef) return modelRef;
  try {
    modelRef = await tf.loadLayersModel(modelUrl);
  } catch (err) {
    console.warn('[ODIN][TF] Failed to load model at', modelUrl, err);
    modelRef = null; // we'll fall back to heuristic if needed
  }
  return modelRef;
}

// Normalize features into a 2D tensor [1, 5]
function toTensor(tf: typeof import('@tensorflow/tfjs'), input: { velocity: number; fuel: number; angle: number; thrust: number; year: number }) {
  // Basic normalization heuristics (tweak as needed)
  const v = Math.max(0, Math.min(1, input.velocity));
  const f = Math.max(0, Math.min(1, input.fuel));
  const a = Math.max(0, Math.min(1, Math.abs(input.angle) / 90)); // 0..1 from 0..90 deg
  const t = Math.max(0, Math.min(1, input.thrust));
  const y = Math.max(0, Math.min(1, (input.year - 2010) / 20)); // map 2010..2030 -> 0..1
  return tf.tensor2d([[v, f, a, t, y]]);
}

export type OdinAIInput = { velocity: number; fuel: number; angle: number; thrust: number; year: number };
export type OdinAIPrediction = { successProbability: number; failureProbability: number };

export async function runAnalysis(input: OdinAIInput): Promise<OdinAIPrediction> {
  const tf = await ensureTF();
  await loadModel();

  // If no model, heuristic fallback
  if (!modelRef) {
    // Simple heuristic: balanced success based on velocity, fuel, low angle, thrust, recency bias
    const score = 0.35 * input.velocity + 0.3 * input.fuel + 0.15 * (1 - Math.min(1, Math.abs(input.angle) / 90)) + 0.15 * input.thrust + 0.05 * Math.max(0, Math.min(1, (input.year - 2010) / 20));
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-6 * (x - 0.5)));
    const success = Math.max(0.01, Math.min(0.99, sigmoid(score)));
    return { successProbability: success, failureProbability: 1 - success };
  }

  // Use the model
  const x = toTensor(tf, input);
  try {
    const y = modelRef.predict(x) as import('@tensorflow/tfjs').Tensor;
    const data = await y.data();
    // Expect softmax [success, failure] or [failure, success] — we try to infer
    let success = data.length >= 2 ? Math.max(data[0], data[1]) === data[0] ? data[0] : data[1] : Number(data[0] || 0.5);
    // If sum ~1, assume [p_success, p_failure]; else normalize
    const sum = Array.from(data).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 1e-3 && data.length >= 2) {
      success = Number(data[0]) / Math.max(1e-6, sum);
    }
    const successClamped = Math.max(0.01, Math.min(0.99, success));
    return { successProbability: successClamped, failureProbability: 1 - successClamped };
  } finally {
    x.dispose();
  }
}
