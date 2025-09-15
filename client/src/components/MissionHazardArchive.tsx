import React from 'react';
import assistantName from '@/lib/assistantName';

type ArchiveRow = { id: string; date: string; type: string; severity: string };

const sampleRows: ArchiveRow[] = [
  { id: '1', date: '2025-08-31', type: 'solar-flare', severity: 'M1.0' },
  { id: '2', date: '2025-07-12', type: 'space-debris', severity: 'N/A' },
  { id: '3', date: '2025-06-02', type: 'neo', severity: 'S' },
];

export default function MissionHazardArchive() {
  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EA8E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5" rx="2"></rect>
        </svg>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#CFEFE2' }}>Mission Hazard Archive</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#" style={{ color: '#9FD6A8', fontSize: 13, textDecoration: 'none' }}>CSV</a>
          <a href="#" style={{ color: '#9FD6A8', fontSize: 13, textDecoration: 'none' }}>JSON</a>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#9FD6A8', fontFamily: 'monospace' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#CFEFE2' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#CFEFE2' }}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '8px 6px', color: '#9FD6A8', fontFamily: 'monospace' }}>{r.date}</td>
                <td style={{ padding: '8px 6px', color: '#DDEDE0' }}>{r.type}</td>
                <td style={{ padding: '8px 6px', color: '#FFDDA8' }}>{r.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
