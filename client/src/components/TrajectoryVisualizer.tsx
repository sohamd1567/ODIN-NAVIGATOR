import React from 'react';
// Deprecated: Legacy D3 visualizer replaced by the R3F-based TrajectoryVisualization wrapper.
// This file remains only to preserve import compatibility across the app.
import TrajectoryVisualization from './TrajectoryVisualization';

export default function TrajectoryVisualizer(props: any) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('[ODIN] TrajectoryVisualizer is deprecated. Use TrajectoryVisualization (R3F) instead.');
  }
  return <TrajectoryVisualization {...props} />;
}
