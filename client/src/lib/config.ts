// Centralized thresholds and model configs (TODO: adjust per mission)
export const THRESHOLDS = {
  comms: {
    latencyMs: 500,
    packetLossPct: 5,
    snrDb: 3, // TODO: confirm
  },
};

export const MODEL = {
  version: 'odin-ml-v0.9.0', // TODO: wire from backend
  inferenceWs: '/ws/inference', // TODO: env var
};
