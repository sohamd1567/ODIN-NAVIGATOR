import React from 'react';

type Props = {
  runAnalysis: (missionId?: string) => void;
};

export default function ODINAnalysis({ runAnalysis }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button className="button-odin" onClick={() => runAnalysis()}>Run ODIN Analysis</button>
    </div>
  );
}
