import React from 'react';
import { useMission } from '@/context/MissionContext';

export default function TeamCoordinationPanel() {
  const { teamRoles = {}, setTeamRole, subsystemOwners = {} } = useMission();
  const roles = Object.keys(teamRoles);

  return (
    <div className="glass-card p-3 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">Role-Based Coordination</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {roles.map((role) => (
          <label key={role} className="flex items-center gap-2">
            <span className="w-28">{role}</span>
            <input className="flex-1 px-2 py-1 bg-background/30 border border-border/50 rounded" value={teamRoles[role] || ''} onChange={(e) => setTeamRole(role, e.target.value)} placeholder="Operator name" />
          </label>
        ))}
      </div>
      <div className="mt-3 text-xs">
        <div className="font-semibold mb-1">AI Recommendations</div>
        <ul className="list-disc ml-4">
          <li>Comms: Validate backup UHF prior to next flare window.</li>
          <li>Navigation: Increase tracking frequency during risk bands.</li>
          <li>Propulsion: Prepare contingency TCM with low Δv.</li>
        </ul>
      </div>
    </div>
  );
}
