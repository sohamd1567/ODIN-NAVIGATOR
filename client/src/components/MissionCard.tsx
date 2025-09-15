import React from 'react';
import { motion } from 'framer-motion';

interface MissionCardProps {
  id: string;
  rocket_name: string;
  mission_name: string;
  launch_date: string;
  status: string;
  payload?: string;
  objective?: string;
  outcome?: string;
}

export default function MissionCard(props: MissionCardProps) {
  const { rocket_name, mission_name, launch_date, status, payload, objective, outcome } = props;

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="w-64 h-40 rounded-xl shadow-md bg-white/5 p-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-300">{rocket_name}</div>
          <div className="text-lg font-semibold text-white">{mission_name}</div>
        </div>
        <div className={`px-2 py-1 rounded ${status === 'Success' ? 'bg-green-600' : 'bg-red-600'} text-white text-xs`}>{status}</div>
      </div>

      <div className="mt-3 text-sm text-slate-300">{launch_date}</div>

      <div className="mt-2 text-xs text-slate-400">
        <div><strong>Payload:</strong> {payload}</div>
        <div><strong>Objective:</strong> {objective}</div>
      </div>
    </motion.div>
  );
}
