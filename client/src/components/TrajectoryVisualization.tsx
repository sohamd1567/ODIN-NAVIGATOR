import React, { useRef, useState, useCallback, useEffect } from 'react';
import TrajectoryScene, { TrajectorySceneHandles } from './r3f/TrajectoryScene';
import Controls from './r3f/Controls';
import useTelemetry from '@/hooks/useTelemetry';

type Props = {
  showTrajectory?: boolean;
  isAnimating?: boolean;
};

export default function TrajectoryVisualization({ showTrajectory = true, isAnimating = false }: Props): JSX.Element {
  const sceneRef = useRef<TrajectorySceneHandles>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(isAnimating);
  const telemetryTargetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const handleTogglePlay = useCallback(() => setPlaying(p => !p), []);
  const handleReset = useCallback(() => sceneRef.current?.resetView(), []);

  // Keep playing state in sync with prop
  useEffect(() => {
    setPlaying(isAnimating);
  }, [isAnimating]);

  // Keyboard shortcuts: Space toggle play, R reset camera
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      else if (e.key.toLowerCase() === 'r') { sceneRef.current?.resetView(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Telemetry: subscribe and ease progress toward target when not playing
  useTelemetry((frame) => {
    telemetryTargetRef.current = showTrajectory ? frame.t : 0;
  });

  useEffect(() => {
    function step() {
      setProgress(cur => {
        const target = telemetryTargetRef.current;
        if (playing) return cur; // user controls via animation
        const diff = target - cur;
        if (Math.abs(diff) < 0.002) return target;
        return cur + diff * 0.12;
      });
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [playing]);

  return (
    <div className="flex flex-col h-[540px] md:h-[600px]">
      <div className="flex-1 rounded-lg overflow-hidden border border-white/10 bg-[#05070a]">
        <TrajectoryScene ref={sceneRef} progress={showTrajectory ? progress : 0} playing={playing} onProgress={setProgress} />
      </div>
      <Controls
        playing={playing}
        progress={progress}
        onTogglePlay={handleTogglePlay}
        onProgressChange={setProgress}
        onResetView={handleReset}
      />
    </div>
  );
}

