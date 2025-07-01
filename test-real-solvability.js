// Test to verify the fixed evolutionary algorithm generates actually solvable puzzles
import { simplifiedEvolutionaryGenerator } from './src/simplified-evolutionary-generator.js';

console.log('🧪 Testing FIXED evolutionary algorithm solvability...');

// Generate the same points as in App.jsx
const SIDES = 12;
const CENTER = 150;
const SHAPE_ROTATION = -15;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

const points = Array.from({ length: SIDES }, (_, i) => {
  const angle = (i * 360) / SIDES + SHAPE_ROTATION;
  const rad = degToRad(angle);
  return [CENTER + 180 * Math.cos(rad), CENTER + 180 * Math.sin(rad)];
});

// This is the REAL solvability checker from App.jsx
function isPuzzleSolvableReal(puzzle, points) {
  const SIDES = 12;
  for (let r0 = 0; r0 < SIDES; ++r0) {
    for (let r1 = 0; r1 < SIDES; ++r1) {
      for (let r2 = 0; r2 < SIDES; ++r2) {
        const rotations = [r0 * 30, r1 * 30, r2 * 30];
        // Compute emitters and blockers for this rotation
        const emitters = puzzle.circles.flatMap((circle, idx) =>
          circle.lasers.map((angle, i) => {
            const rotated = angle + rotations[idx] + SHAPE_ROTATION;
            const rad = degToRad(rotated);
            return {
              idx,
              angle: rotated + 180, // Fire toward center
              x: CENTER + circle.radius * Math.cos(rad),
              y: CENTER + circle.radius * Math.sin(rad),
              radius: circle.radius,
              laserIdx: i,
            };
          })
        );
        const blockers = puzzle.circles.flatMap((circle, idx) =>
          circle.blockers.map((angle) => {
            const rotated = angle + rotations[idx] + SHAPE_ROTATION;
            const rad = degToRad(rotated);
            return {
              idx,
              angle: rotated,
              x: CENTER + circle.radius * Math.cos(rad),
              y: CENTER + circle.radius * Math.sin(rad),
              radius: circle.radius,
            };
          })
        );
        // Helper: get dodecagon edge lines
        const edgeLines = points.map((pt, i) => {
          const next = points[(i + 1) % SIDES];
          return { i, x1: pt[0], y1: pt[1], x2: next[0], y2: next[1] };
        });
        // For each lit edge, can it be hit by any emitter?
        let allLit = true;
        for (const litIdx of puzzle.litEdges) {
          let hit = false;
          for (const emitter of emitters) {
            // Project a ray from emitter.x/y at emitter.angle
            const rad = degToRad(emitter.angle);
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);
            // Find intersection with blockers (as circles)
            let minT = Infinity;
            let hitType = null;
            // Blockers: treat as circles
            for (const blocker of blockers) {
              // Only check collision if blocker and emitter are on different circles OR at same/opposite positions
              const sameCircle = blocker.idx === emitter.idx;
              const sameOrOppositePos = Math.abs(((blocker.angle - emitter.angle + 180) % 360) - 180) < 1;
              
              if (!sameCircle || sameOrOppositePos) {
                const bx = blocker.x - emitter.x;
                const by = blocker.y - emitter.y;
                const proj = bx * dx + by * dy;
                if (proj <= 0) continue;
                const perp2 = (bx * bx + by * by) - proj * proj;
                const r2 = 12 * 12;
                if (perp2 < r2) {
                  const t = proj - Math.sqrt(r2 - perp2);
                  if (t < minT) {
                    minT = t;
                    hitType = 'blocker';
                  }
                }
              }
            }
            // Emitters: treat as circles, block if facing each other or from behind
            for (const other of emitters) {
              if (other === emitter) continue;
              const ox = other.x - emitter.x;
              const oy = other.y - emitter.y;
              const proj = ox * dx + oy * dy;
              if (proj <= 0) continue;
              const perp2 = (ox * ox + oy * oy) - proj * proj;
              const r2 = 13 * 13;
              if (perp2 < r2) {
                const t = proj - Math.sqrt(r2 - perp2);
                if (t < minT) {
                  minT = t;
                  hitType = 'emitter';
                }
              }
            }
            // Dodecagon edges
            for (const edge of edgeLines) {
              const x3 = edge.x1, y3 = edge.y1, x4 = edge.x2, y4 = edge.y2;
              const denom = (dx * (y4 - y3) - dy * (x4 - x3));
              if (Math.abs(denom) < 1e-6) continue;
              const t2 = ((x3 - emitter.x) * (y4 - y3) - (y3 - emitter.y) * (x4 - x3)) / denom;
              const t1 = ((x3 - emitter.x) * dy - (y3 - emitter.y) * dx) / denom;
              if (t2 > 0 && t1 >= 0 && t1 <= 1) {
                if (t2 < minT) {
                  minT = t2;
                  hitType = 'edge';
                  if (edge.i === litIdx) {
                    hit = true;
                    break;
                  }
                }
              }
            }
            if (hit) break;
          }
          if (!hit) {
            allLit = false;
            break;
          }
        }
        if (allLit) {
          return true;
        }
      }
    }
  }
  return false;
}

async function testRealSolvability() {
  let totalTests = 10;
  let evolutionSaysTrue = 0;
  let realSaysTrue = 0;
  let bothSolvable = 0;
  
  console.log(`\n🔬 Testing ${totalTests} puzzles with REAL physics checker...`);
  
  for (let i = 0; i < totalTests; i++) {
    console.log(`\nTest ${i + 1}:`);
    
    const result = simplifiedEvolutionaryGenerator.generatePuzzle('medium');
    const puzzle = result.puzzle;
    const evolutionSolvable = result.metadata.solvable;
    const realSolvable = isPuzzleSolvableReal(puzzle, points);
    
    console.log(`  🧬 Evolution says: ${evolutionSolvable ? '✅ SOLVABLE' : '❌ NOT SOLVABLE'}`);
    console.log(`  🎯 Real physics says: ${realSolvable ? '✅ SOLVABLE' : '❌ NOT SOLVABLE'}`);
    console.log(`  📊 Agreement: ${evolutionSolvable === realSolvable ? '✅ PERFECT' : '⚠️  MISMATCH'}`);
    
    if (evolutionSolvable) evolutionSaysTrue++;
    if (realSolvable) realSaysTrue++;
    if (evolutionSolvable && realSolvable) bothSolvable++;
    
    console.log(`  📈 Puzzle details: ${puzzle.litEdges.length} lit edges, fitness: ${result.metadata.fitness.toFixed(3)}`);
    console.log(`  ⏱️  Generation time: ${result.metadata.timeMs.toFixed(1)}ms`);
  }
  
  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`  🧬 Evolution claims solvable: ${evolutionSaysTrue}/${totalTests} (${(evolutionSaysTrue/totalTests*100).toFixed(1)}%)`);
  console.log(`  🎯 Real physics confirms solvable: ${realSaysTrue}/${totalTests} (${(realSaysTrue/totalTests*100).toFixed(1)}%)`);
  console.log(`  ✅ Actually solvable puzzles: ${bothSolvable}/${totalTests} (${(bothSolvable/totalTests*100).toFixed(1)}%)`);
  
  if (realSaysTrue >= totalTests * 0.8) {
    console.log(`\n🎉 SUCCESS: Fixed evolutionary algorithm generates mostly solvable puzzles!`);
  } else {
    console.log(`\n❌ STILL BROKEN: Real solvability rate is too low.`);
  }
  
  if (evolutionSaysTrue === realSaysTrue) {
    console.log(`✅ PERFECT: Evolution's internal checker matches reality perfectly!`);
  } else {
    console.log(`⚠️  WARNING: Evolution's internal checker doesn't match reality.`);
  }
}

testRealSolvability().catch(console.error);
