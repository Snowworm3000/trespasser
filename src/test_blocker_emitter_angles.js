import { generatePuzzle } from './puzzle.js';

const N = 10000; // Number of puzzles to test
let violations = 0;

// Convert angle to position (0-11)
function angleToPosition(angle) {
  // Subtract the 15° offset, normalize to 0-360, then divide by 30° to get position
  const normalized = ((angle - 15 + 360) % 360);
  return Math.round(normalized / 30) % 12;
}

for (let i = 0; i < N; ++i) {
  const p = generatePuzzle(3, 6);
  for (const [circleIdx, circle] of p.circles.entries()) {
    for (const blocker of circle.blockers) {
      const blockerPos = angleToPosition(blocker);
      for (const emitter of circle.lasers) {
        const emitterPos = angleToPosition(emitter);
        
        // Check if blocker is at same position as emitter
        if (blockerPos === emitterPos) {
          console.error(`Violation: Blocker at same position as emitter on circle ${circleIdx}`);
          console.error(`Blocker angle: ${blocker} (pos ${blockerPos}), Emitter angle: ${emitter} (pos ${emitterPos})`);
          console.error('Puzzle:', JSON.stringify(p, null, 2));
          violations++;
        }
        
        // Check if blocker is 6 positions away (180 degrees) from emitter
        const oppositePos = (emitterPos + 6) % 12;
        if (blockerPos === oppositePos) {
          console.error(`Violation: Blocker 180° (6 positions) from emitter on circle ${circleIdx}`);
          console.error(`Blocker angle: ${blocker} (pos ${blockerPos}), Emitter angle: ${emitter} (pos ${emitterPos})`);
          console.error('Puzzle:', JSON.stringify(p, null, 2));
          violations++;
        }
      }
    }
  }
}

if (violations === 0) {
  console.log(`PASS: No violations found in ${N} puzzles.`);
} else {
  console.error(`FAIL: Found ${violations} violations in ${N} puzzles.`);
  process.exit(1);
} 