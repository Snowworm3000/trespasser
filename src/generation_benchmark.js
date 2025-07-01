const fs = require('fs');
const path = require('path');
const puzzle = require('./puzzle');

const N = parseInt(process.argv[2], 10) || 50;
const minLit = parseInt(process.argv[3], 10) || 3;
const maxLit = parseInt(process.argv[4], 10) || 4;

const logFile = path.join(__dirname, 'generation_benchmark.log');

function now() {
  const [s, ns] = process.hrtime();
  return s * 1000 + ns / 1e6;
}

function runBenchmark() {
  let totalTime = 0;
  let totalAttempts = 0;
  for (let i = 0; i < N; ++i) {
    let attempts = 0;
    let found = false;
    let puzzleInstance, points;
    const t0 = now();
    while (!found && attempts < 1000) {
      puzzleInstance = puzzle.generatePuzzle(minLit, maxLit);
      points = puzzle.getPolygonPoints();
      found = puzzle.isPuzzleSolvable(puzzleInstance, points);
      attempts++;
    }
    const t1 = now();
    totalTime += (t1 - t0);
    totalAttempts += attempts;
  }
  const avgTime = totalTime / N;
  const avgAttempts = totalAttempts / N;
  const log = `Version: ${puzzle.VERSION} | N: ${N} | minLit: ${minLit} | maxLit: ${maxLit} | AvgTime(ms): ${avgTime.toFixed(2)} | AvgAttempts: ${avgAttempts.toFixed(2)} | Date: ${new Date().toISOString()}`;
  fs.appendFileSync(logFile, log + '\n');
  console.log(log);
}

runBenchmark(); 