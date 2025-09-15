import React from 'react';
import assistantName from '@/lib/assistantName';

type CrewBriefingPanelProps = {
  date?: string;
  summary?: string;
  warning?: string | null;
};

export default function CrewBriefingPanel({ date, summary, warning }: CrewBriefingPanelProps) {
  const now = date || new Date().toLocaleString();

  return (
    <div className="p-4" style={{ color: '#BFDCCF', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{assistantName} — Crew Briefing</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: '#4ade80', display: 'inline-block' }} aria-hidden />
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9FD6A8' }}>ACTIVE</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#9FD6A8', marginBottom: 10 }}>{now}</div>

      <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 10 }}>{summary || 'All systems nominal. No immediate crew actions required.'}</div>

      {warning ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,165,0,0.06)', color: '#FFD8A8' }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ fontSize: 13 }}>{warning}</div>
        </div>
      ) : null}
    </div>
  );
}
