// scripts/train_odin_model.mjs
// Train a tiny TFJS model and export to client/public/models/odin-model/
import * as tf from '@tensorflow/tfjs-node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '..', 'client', 'public', 'models', 'odin-model');

function makeData(n = 2000) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    const velocity = Math.random();
    const fuel = Math.random();
    const angle = Math.random(); // 0..1 from 0..90deg mapped
    const thrust = Math.random();
    const year = Math.random(); // 0..1 for 2010..2030
    const score = 0.35 * velocity + 0.3 * fuel + 0.15 * (1 - angle) + 0.15 * thrust + 0.05 * year;
    const success = 1 / (1 + Math.exp(-8 * (score - 0.5)));
    const label = success > Math.random() ? [1, 0] : [0, 1]; // [success, failure]
    xs.push([velocity, fuel, angle, thrust, year]);
    ys.push(label);
  }
  return { xs: tf.tensor2d(xs), ys: tf.tensor2d(ys) };
}

async function main() {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

  const { xs, ys } = makeData(2500);
  await model.fit(xs, ys, { epochs: 15, batchSize: 64, verbose: 1, validationSplit: 0.1 });

  await fs.promises.mkdir(outDir, { recursive: true });
  const saveURL = 'file://' + outDir;
  await model.save(saveURL);
  xs.dispose(); ys.dispose();
  console.log('Model saved to', outDir);
}

main().catch(err => { console.error(err); process.exit(1); });
