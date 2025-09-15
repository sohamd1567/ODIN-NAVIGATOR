import create from 'zustand';

interface LaunchStoreState {
  tab: 'timeline' | 'trajectories' | 'failures' | 'simulation';
  setTab: (t: LaunchStoreState['tab']) => void;
}

// Use `any` for the internal set updater to keep the store minimal for this prototype.
export const useLaunchStore = (create as any)((set: any) => ({
  tab: 'timeline',
  setTab: (t: any) => set({ tab: t })
}));
