import React from 'react';
import { useMission } from '@/context/MissionContext';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ContinuousLearningPanel() {
  const { commsHistory = [] } = useMission();
  const data = commsHistory.slice(-200).map(s => ({ ts: s.ts, conf: 70 + Math.sin(s.ts/1e6)*10 })); // TODO: replace with real model confidence
  return (
    <div className="glass-card p-3 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Continuous Learning & Optimization</h3>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="ts" hide />
            <YAxis width={28} domain={[0,100]} />
            <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} />
            <Line dataKey="conf" stroke="#06b6d4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs">
        <div className="font-semibold mb-1">Insights</div>
        <ul className="list-disc ml-4">
          <li>Confidence correlates with SNR during flare windows. Tune FEC thresholds.</li>
          <li>Schedule data dumps away from risk bands to reduce loss spikes.</li>
          <li>Consider adaptive buffer sizing during DSN handovers.</li>
        </ul>
      </div>
    </div>
  );
}
