// Minimal ambient types to silence TypeScript for d3 during prototyping
declare module 'd3' {
  const d3: any;
  export = d3;
}
