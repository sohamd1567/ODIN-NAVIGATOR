// Modular mission dataset format for counterfactual analysis
// Each mission: { id, name, year, trajectory: [points], anomalies: [points] }
// Each trajectory point: { t, x, y, velocity, burn, label }
// Each anomaly: { t, x, y, type, details }

export interface TrajectoryPoint {
  t: number; // normalized time 0..1
  x: number;
  y: number;
  velocity: number;
  burn?: number;
  label?: string;
}

export interface AnomalyPoint {
  t: number;
  x: number;
  y: number;
  type: string;
  details: string;
}

export interface MissionDataset {
  id: string;
  name: string;
  year: number;
  trajectory: TrajectoryPoint[];
  anomalies: AnomalyPoint[];
}

// Example: Chandrayaan-2 descent crash (2019, but for demo)
export const missions: MissionDataset[] = [
  {
    id: 'chandrayaan2',
    name: 'Chandrayaan-2',
    year: 2019,
    trajectory: [
      { t: 0, x: 70, y: 100, velocity: 10, label: 'TLI' },
      { t: 0.2, x: 120, y: 80, velocity: 9.5 },
      { t: 0.5, x: 200, y: 70, velocity: 7.2, label: 'LOI' },
      { t: 0.8, x: 300, y: 85, velocity: 2.5 },
      { t: 0.95, x: 330, y: 80, velocity: 1.8, label: 'Descent' },
      { t: 1, x: 340, y: 90, velocity: 0.0, label: 'Landing' }
    ],
    anomalies: [
      { t: 0.97, x: 335, y: 85, type: 'velocity_drift', details: 'Descent velocity exceeded safe threshold; crash occurred.' }
    ]
  },
  // Add more missions (2012–2018) as needed
];
