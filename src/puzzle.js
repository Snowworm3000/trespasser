// puzzle.js
// Puzzle generation and solver logic for Trespasser minigame

export const SIDES = 12;
export const RADIUS = 180;
export const CENTER = 200;
export const SHAPE_ROTATION = 15; // degrees
export const VERSION = '0.0.0'; // Sync with package.json

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function getPolygonPoints(sides = SIDES, radius = RADIUS, center = CENTER) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2 + degToRad(SHAPE_ROTATION);
    return [
      center + radius * Math.cos(angle),
      center + radius * Math.sin(angle),
    ];
  });
}

export function mod360(angle) {
  return ((angle % 360) + 360) % 360;
}

function hasAngleOrOpposite(list, angle) {
  const a0 = mod360(angle);
  const a180 = mod360(angle + 180);
  return list.some(a => {
    const ma = mod360(a);
    return Math.abs(ma - a0) < 1 || Math.abs(ma - a180) < 1;
  });
}

// Convert position (0-11) to angle
function positionToAngle(pos) {
  return (pos * 30 + 15) % 360;
}

// Convert angle to position (0-11)
function angleToPosition(angle) {
  const normalized = ((angle - 15 + 360) % 360);
  return Math.round(normalized / 30) % 12;
}

export function generatePuzzle(minLit = 3, maxLit = 4, options = {}) {
  // 1. Randomly select minLit-maxLit lit edges
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const litEdges = [];
  while (litEdges.length < numLit) {
    const idx = Math.floor(Math.random() * SIDES);
    if (!litEdges.includes(idx)) litEdges.push(idx);
  }
  litEdges.sort((a, b) => a - b);

  // 2. Randomly assign 1-3 emitters and 1-2 blockers per circle
  let totalEmitters = 0;
  const circles = [50, 90, 130].map((radius) => {
    const numEmit = Math.floor(Math.random() * 3) + 1; // 1-3 emitters
    const numBlock = Math.floor(Math.random() * 2) + 1; // 1-2 blockers
    totalEmitters += numEmit;
    
    // Track used positions (0-11) for this circle
    const usedPositions = new Set();
    
    // Place emitters at random positions
    const lasers = [];
    while (lasers.length < numEmit) {
      const pos = Math.floor(Math.random() * SIDES);
      const oppositePos = (pos + 6) % 12;
      
      if (!usedPositions.has(pos) && !usedPositions.has(oppositePos)) {
        usedPositions.add(pos);
        usedPositions.add(oppositePos);
        lasers.push(positionToAngle(pos));
      }
    }
    
    // Place blockers at random positions
    const blockers = [];
    while (blockers.length < numBlock) {
      const pos = Math.floor(Math.random() * SIDES);
      const oppositePos = (pos + 6) % 12;
      
      if (!usedPositions.has(pos) && !usedPositions.has(oppositePos)) {
        usedPositions.add(pos);
        usedPositions.add(oppositePos);
        blockers.push(positionToAngle(pos));
      }
    }
    
    return { radius, lasers, blockers };
  });

  // 3. Place emitters to guarantee solvability while maintaining position constraints
  for (let i = 0; i < litEdges.length; ++i) {
    const cidx = i % 3;
    const targetPos = litEdges[i];
    const targetAngle = positionToAngle(targetPos);
    
    // Get all used positions in this circle
    const usedPositions = new Set();
    for (const laser of circles[cidx].lasers.slice(1)) {
      const pos = angleToPosition(laser);
      usedPositions.add(pos);
      usedPositions.add((pos + 6) % 12);
    }
    for (const blocker of circles[cidx].blockers) {
      const pos = angleToPosition(blocker);
      usedPositions.add(pos);
      usedPositions.add((pos + 6) % 12);
    }
    
    // If target position and its opposite are free, we can place the emitter
    if (!usedPositions.has(targetPos) && !usedPositions.has((targetPos + 6) % 12)) {
      circles[cidx].lasers[0] = targetAngle;
    }
  }

  return { litEdges, circles };
}

// Helper function to check if two objects are at the same position
function areAtSamePosition(angle1, angle2) {
  const pos1 = angleToPosition(angle1);
  const pos2 = angleToPosition(angle2);
  return pos1 === pos2 || pos1 === (pos2 + 6) % 12 || pos2 === (pos1 + 6) % 12;
}

export function isPuzzleSolvable(puzzle, points) {
  // Try all 12^3 = 1728 possible rotation combinations
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
              originalAngle: angle // Store original angle for position checks
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
              originalAngle: angle // Store original angle for position checks
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
            let hitObj = null;
            // Blockers: treat as circles
            for (const blocker of blockers) {
              // Only check collision if blocker and emitter are on the same circle AND at same/opposite positions
              if (blocker.idx === emitter.idx && areAtSamePosition(blocker.originalAngle, emitter.originalAngle)) {
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
                    hitObj = blocker;
                  }
                }
              } else if (blocker.idx !== emitter.idx) {
                // For blockers on different circles, always check collision
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
                    hitObj = blocker;
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
                  hitObj = other;
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
                  hitObj = edge;
                }
              }
            }
            // If the closest hit is the lit edge, it's hittable
            if (hitType === 'edge' && hitObj.i === litIdx) {
              hit = true;
              break;
            }
          }
          if (!hit) {
            allLit = false;
            break;
          }
        }
        if (allLit) return true;
      }
    }
  }
  return false;
} 