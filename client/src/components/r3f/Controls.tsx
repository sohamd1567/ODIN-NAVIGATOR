import React from 'react';

type ControlsProps = {
  playing: boolean;
  progress: number; // 0..1
  onTogglePlay: () => void;
  onProgressChange: (p: number) => void;
  onResetView: () => void;
};

export default function Controls({ playing, progress, onTogglePlay, onProgressChange, onResetView }: ControlsProps) {
  return (
    <div className="flex items-center gap-3 p-2">
      <button
        className="px-3 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-sm"
        aria-pressed={playing}
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={onTogglePlay}
      >
        {playing ? 'Pause' : 'Play'}
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(progress * 100)}
        onChange={(e) => onProgressChange(Number(e.target.value) / 100)}
        aria-label="Trajectory progress"
        className="w-full accent-cyan-400"
      />

      <button
        className="px-3 py-1 rounded bg-slate-700/80 hover:bg-slate-600 text-white text-sm"
        onClick={onResetView}
        aria-label="Reset camera view"
      >
        Reset View
      </button>
    </div>
  );
}
