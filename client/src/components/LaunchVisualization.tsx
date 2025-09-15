import React, { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLaunchStore } from '../stores/useLaunchStore';
import { schemeCategory10 } from 'd3-scale-chromatic';
import launchesRaw from '../../../data/launches.json';
import MissionCard from './MissionCard';

// Note: This file assumes Plotly and react-plotly.js are installed. Cesium integration is optional and commented.

type LaunchRecord = {
  id: string;
  rocket_name: string;
  mission_name: string;
  launch_date: string;
  launch_site: string;
  country: string;
  status: 'Success' | 'Failure';
  peak_altitude_km: number;
  distance_traveled_km: number;
  trajectory_coords: number[][]; // [lat, lon, alt]
  payload: string;
  objective: string;
  outcome: string;
};

const launches = (launchesRaw as unknown) as LaunchRecord[];

export default function LaunchVisualization() {
  const tab = useLaunchStore((s: any) => s.tab);
  const setTab = useLaunchStore((s: any) => s.setTab);

  const years = useMemo(() => [2012,2013,2014,2015,2016,2017,2018], []);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [showAircraft, setShowAircraft] = useState(true);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>(() => Object.fromEntries(filtered.map(l => [l.id, true])));
  const [play, setPlay] = useState(false);
  const [simYear, setSimYear] = useState(2012);

  // Filter launches 2012-2018
  const filtered = useMemo(() => launches.filter(l => {
    const y = Number(l.launch_date.split('-')[0]);
    return y >= 2012 && y <= 2018;
  }), []);

  const timelineData = useMemo(() => {
    return filtered.map(l => ({ x: Number(l.launch_date.split('-')[0]), y: l.mission_name, status: l.status, rocket_name: l.rocket_name, date: l.launch_date }));
  }, [filtered]);

  useEffect(() => {
    let id: any;
    if (play) {
      id = setInterval(() => setSimYear(y => Math.min(2018, y+1)), 1200);
    }
    return () => clearInterval(id);
  }, [play]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex bg-gradient-to-r from-slate-700 to-slate-600 rounded-full p-1">
          <button onClick={() => setTab('timeline')} className={`px-4 py-2 rounded-full ${tab==='timeline'?'bg-white/6':''}`}>Timeline</button>
          <button onClick={() => setTab('trajectories')} className={`px-4 py-2 rounded-full ${tab==='trajectories'?'bg-white/6':''}`}>Trajectories</button>
          <button onClick={() => setTab('failures')} className={`px-4 py-2 rounded-full ${tab==='failures'?'bg-white/6':''}`}>Failures</button>
          <button onClick={() => setTab('simulation')} className={`px-4 py-2 rounded-full ${tab==='simulation'?'bg-white/6':''}`}>Simulation</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-slate-300">Year:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-white/5 rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white/2 rounded-lg p-4">
        {tab === 'timeline' && (
          <Plot
            data={[{
              x: timelineData.map(d => d.x),
              y: timelineData.map(d => d.y),
              mode: 'markers',
              marker: { color: timelineData.map(d => d.status === 'Success' ? 'green' : 'red'), size: 10 },
              type: 'scatter',
              hoverinfo: 'text',
              text: timelineData.map(d => `${d.rocket_name}<br/>${d.date}<br/>${d.status}`)
            }]}
            layout={{ title: 'Launches 2012–2018', xaxis: { title: 'Year', range: [2011.5, 2018.5] }, yaxis: { title: 'Mission' }, height: 450 }}
            config={{ responsive: true }}
          />
        )}

        {tab === 'trajectories' && (
          <div>
            <div className="mb-4 flex items-center gap-4">
              <div>Toggle aircraft:</div>
              <div className="flex gap-2 flex-wrap">
                {filtered.map((l, idx) => (
                  <label key={l.id} className="flex items-center gap-2 text-sm" style={{ color: '#DCEFF0' }}>
                    <input type="checkbox" checked={visibleMap[l.id] ?? true} onChange={e => setVisibleMap(m => ({ ...m, [l.id]: e.target.checked }))} />
                    <span style={{ color: schemeCategory10[idx % schemeCategory10.length] }}>{l.mission_name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Plot
              data={filtered.filter(l => visibleMap[l.id]).map((l, idx) => ({ x: l.trajectory_coords.map(p => p[1]), y: l.trajectory_coords.map(p => p[0]), z: l.trajectory_coords.map(p => p[2]), type: 'scatter3d', mode: 'lines+markers', line: { width: 2, color: schemeCategory10[idx % schemeCategory10.length] }, name: l.mission_name }))}
              layout={{ title: 'Trajectories (3D)', height: 600 }}
              config={{ responsive: true }}
            />
          </div>
        )}

        {tab === 'failures' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Plot data={[{ values: [filtered.filter(f=>f.status==='Success').length, filtered.filter(f=>f.status==='Failure').length], labels: ['Success','Failure'], type: 'pie' }]} layout={{ title: 'Success vs Failure' }} />
            </div>
            <div>
              <Plot data={[{ x: Array.from(new Set(filtered.map(f=>f.rocket_name))), y: Array.from(new Set(filtered.map(f=>f.rocket_name))).map(name => filtered.filter(f=>f.rocket_name===name && f.status==='Failure').length), type: 'bar' }]} layout={{ title: 'Failures by rocket' }} />
            </div>
            <div>
              <Plot data={[{ x: Array.from(new Set(filtered.map(f=>f.launch_site))), y: ['Success','Failure'], z: [] as any, type: 'heatmap' }]} layout={{ title: 'Launch sites heatmap' }} />
            </div>
          </div>
        )}

        {tab === 'simulation' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setPlay(p => !p)} className="px-3 py-1 rounded bg-slate-700 text-white">{play ? 'Pause' : 'Play'}</button>
              <input type="range" min={2012} max={2018} step={1} value={simYear} onChange={e => setSimYear(Number(e.target.value))} />
              <div className="ml-4 text-sm text-slate-300">Year: {simYear}</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {filtered.filter(f => Number(f.launch_date.split('-')[0]) === simYear).map(l => (
                <MissionCard key={l.id} id={l.id} rocket_name={l.rocket_name} mission_name={l.mission_name} launch_date={l.launch_date} status={l.status} payload={l.payload} objective={l.objective} outcome={l.outcome} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
