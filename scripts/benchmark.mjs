import { performance } from "node:perf_hooks";
const iterations = 100_000;
const start = performance.now();
for (let index = 0; index < iterations; index++)
  void { x: index / 3, y: index / 7 };
console.log(
  JSON.stringify({
    note: "Node baseline only; use the calibration lab performance panel for layout benchmarks.",
    iterations,
    milliseconds: performance.now() - start,
  }),
);
