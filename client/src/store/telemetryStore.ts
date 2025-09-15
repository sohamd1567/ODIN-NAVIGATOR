import { create } from 'zustand';

type Hazard = { id: string; x: number; y: number; r: number; type: string };
export type TelemetryFrame = { id: string; t: number; hazards?: Hazard[]; ts: number };

type State = {
  frames: Record<string, TelemetryFrame[]>;
  addFrame: (frame: TelemetryFrame) => void;
  getLatest: (id: string) => TelemetryFrame | undefined;
  clear: (id?: string) => void;
};

const MAX_FRAMES = 300; // keep ~1 minute at 200ms cadence

const creator = (set: (fn: (state: State) => Partial<State>) => void, get: () => State): State => ({
  frames: {},
  addFrame: (frame: TelemetryFrame) => set((state: State) => {
    const list = state.frames[frame.id] ? [...state.frames[frame.id], frame] : [frame];
    if (list.length > MAX_FRAMES) list.splice(0, list.length - MAX_FRAMES);
    return { frames: { ...state.frames, [frame.id]: list } };
  }),
  getLatest: (id: string) => {
    const arr = get().frames[id];
    return arr && arr.length ? arr[arr.length - 1] : undefined;
  },
  clear: (id?: string) => set((state: State) => {
    if (!id) return { frames: {} };
    const { [id]: _omit, ...rest } = state.frames;
    return { frames: rest };
  }),
});

export const useTelemetryStore = create(creator);
