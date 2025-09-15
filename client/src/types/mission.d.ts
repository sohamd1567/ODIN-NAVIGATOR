export interface TrajectoryPoint {
  x: number; // km
  y: number; // km
  altKm: number;
}

export type MissionOutcome = 'success' | 'failure';

export interface MissionData {
  id: string;
  missionName: string;
  launchDate: string; // ISO
  launchLocation: string;
  outcome: MissionOutcome;
  peakAltitudeKm: number;
  distanceTraveledKm: number;
  missionObjective: string;
  trajectoryData: TrajectoryPoint[];
  failurePoint?: { x: number; y: number; reason: string };
}
