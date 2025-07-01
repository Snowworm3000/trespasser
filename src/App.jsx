import { useMemo, useState, useEffect, useCallback } from 'react';
import './App.css';

// Dodecagon constants
const SIDES = 12;
const RADIUS = 180;
const CENTER = 200;
const SHAPE_ROTATION = 15; // degrees

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function getPolygonPoints(sides, radius, center) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2 + degToRad(SHAPE_ROTATION);
    return [
      center + radius * Math.cos(angle),
      center + radius * Math.sin(angle),
    ];
  });
}

// --- Random Puzzle Generation ---
function generatePuzzle(minLit, maxLit) {
  // 1. Randomly select minLit-maxLit lit edges
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const litEdges = [];
  while (litEdges.length < numLit) {
    const idx = Math.floor(Math.random() * SIDES);
    if (!litEdges.includes(idx)) litEdges.push(idx);
  }
  litEdges.sort((a, b) => a - b);

  // 2. Randomly assign 1-3 emitters and 1-2 blockers per circle
  // Ensure at least as many emitters as lit edges
  let totalEmitters = 0;
  const circles = [50, 90, 130].map((radius) => {
    const numEmit = Math.floor(Math.random() * 3) + 1; // 1-3 emitters
    const numBlock = Math.floor(Math.random() * 2) + 1; // 1-2 blockers
    totalEmitters += numEmit;
    // Place emitters and blockers at random angles (multiples of 30° + 15°), no overlap
    const usedAngles = new Set();
    const lasers = [];
    while (lasers.length < numEmit) {
      const angle = 15 + 30 * Math.floor(Math.random() * SIDES);
      if (!usedAngles.has(angle)) {
        lasers.push(angle);
        usedAngles.add(angle);
      }
    }
    const blockers = [];
    while (blockers.length < numBlock) {
      const angle = 15 + 30 * Math.floor(Math.random() * SIDES);
      if (!usedAngles.has(angle)) {
        blockers.push(angle);
        usedAngles.add(angle);
      }
    }
    return { radius, lasers, blockers };
  });
  // If not enough emitters, add more to random circles
  while (totalEmitters < numLit) {
    const idx = Math.floor(Math.random() * 3);
    // Find a new angle
    let angle;
    const used = new Set([...circles[idx].lasers, ...circles[idx].blockers]);
    do {
      angle = 15 + 30 * Math.floor(Math.random() * SIDES);
    } while (used.has(angle));
    circles[idx].lasers.push(angle);
    totalEmitters++;
  }

  // 3. Place emitters so that, with some rotation, each lit edge can be hit by at least one emitter
  // For simplicity, guarantee solvability by aligning one emitter per lit edge
  for (let i = 0; i < litEdges.length; ++i) {
    // Pick a random circle
    const cidx = i % 3;
    // Place an emitter so it can hit the lit edge (angle facing center of edge)
    const edgeAngle = (360 * litEdges[i]) / SIDES + 15; // center of edge
    // Ensure no overlap
    const used = new Set([...circles[cidx].lasers, ...circles[cidx].blockers]);
    if (!used.has(edgeAngle)) {
      circles[cidx].lasers[0] = edgeAngle; // Overwrite first emitter in each circle
    }
  }

  return { litEdges, circles };
}

// --- Puzzle Solvability Checker ---
function isPuzzleSolvable(puzzle, points) {
  // Try all 12^3 = 1728 possible rotation combinations
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
            let hitObj = null;
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

function App() {
  // --- Settings State ---
  const [minLit, setMinLit] = useState(3);
  const [maxLit, setMaxLit] = useState(4);
  const [autoSolve, setAutoSolve] = useState(true);
  const [attempts, setAttempts] = useState(1);

  // --- Puzzle State ---
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(minLit, maxLit));
  const [rotations, setRotations] = useState([0, 0, 0]);
  const [selected, setSelected] = useState(0);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Touch event handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only trigger if the swipe is long enough
    if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

    // Determine if the swipe is more horizontal or vertical
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Right swipe
        setRotations((rots) => rots.map((r, i) => i === selected ? (r + 30) % 360 : r));
      } else {
        // Left swipe
        setRotations((rots) => rots.map((r, i) => i === selected ? (r - 30 + 360) % 360 : r));
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Down swipe
        setSelected((s) => (s + 1) % 3);
      } else {
        // Up swipe
        setSelected((s) => (s - 1 + 3) % 3);
      }
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  // --- Puzzle Generation with Solvability Check ---
  const points = useMemo(() => getPolygonPoints(SIDES, RADIUS, CENTER), []);
  const [internalPuzzle, setInternalPuzzle] = useState(puzzle);
  const [internalAttempts, setInternalAttempts] = useState(attempts);

  useEffect(() => {
    let tries = 1;
    let newPuzzle = generatePuzzle(minLit, maxLit);
    let solvable = isPuzzleSolvable(newPuzzle, points);
    if (autoSolve) {
      while (!solvable && tries < 1000) {
        newPuzzle = generatePuzzle(minLit, maxLit);
        solvable = isPuzzleSolvable(newPuzzle, points);
        tries++;
      }
    }
    setInternalPuzzle(newPuzzle);
    setInternalAttempts(tries);
    setPuzzle(newPuzzle);
    setAttempts(tries);
    setRotations([0, 0, 0]);
    setSelected(0);
    // eslint-disable-next-line
  }, [minLit, maxLit, autoSolve]);

  // Use internalPuzzle for emitters/blockers
  const CIRCLES = internalPuzzle.circles;
  const LIT_EDGES = internalPuzzle.litEdges;

  // Check solvability (expensive, so memoize)
  const solvable = useMemo(() => isPuzzleSolvable(internalPuzzle, points), [internalPuzzle, points]);

  // --- UI Handlers ---
  const handleMinLit = (e) => {
    const val = Math.max(1, Math.min(Number(e.target.value), maxLit));
    setMinLit(val);
  };
  const handleMaxLit = (e) => {
    const val = Math.max(minLit, Math.min(Number(e.target.value), SIDES));
    setMaxLit(val);
  };
  const handleAutoSolve = (e) => {
    setAutoSolve(e.target.checked);
  };
  const newPuzzleBtn = () => {
    if (autoSolve) {
      let tries = 1;
      let newPuzzle = generatePuzzle(minLit, maxLit);
      let solvable = isPuzzleSolvable(newPuzzle, points);
      while (!solvable && tries < 1000) {
        newPuzzle = generatePuzzle(minLit, maxLit);
        solvable = isPuzzleSolvable(newPuzzle, points);
        tries++;
      }
      setInternalPuzzle(newPuzzle);
      setAttempts(tries);
      setInternalAttempts(tries);
      setRotations([0, 0, 0]);
      setSelected(0);
    } else {
      setInternalPuzzle(generatePuzzle(minLit, maxLit));
      setAttempts(1);
      setInternalAttempts(1);
      setRotations([0, 0, 0]);
      setSelected(0);
    }
  };

  // Keyboard controls
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      setSelected((s) => (s - 1 + 3) % 3);
    } else if (e.key === 'ArrowDown') {
      setSelected((s) => (s + 1) % 3);
    } else if (e.key === 'ArrowLeft') {
      setRotations((rots) => rots.map((r, i) => i === selected ? (r - 30 + 360) % 360 : r));
    } else if (e.key === 'ArrowRight') {
      setRotations((rots) => rots.map((r, i) => i === selected ? (r + 30) % 360 : r));
    }
  }, [selected]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Helper: get all emitters and blockers in world coordinates
  const emitters = CIRCLES.flatMap((circle, idx) =>
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
  const blockers = CIRCLES.flatMap((circle, idx) =>
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

  // Helper function to check if two angles correspond to same/opposite positions
  function areAtSamePosition(angle1, angle2) {
    // Convert angles to positions (0-11)
    function angleToPosition(angle) {
      const normalized = ((angle - 15 + 360) % 360);
      return Math.round(normalized / 30) % 12;
    }
    
    const pos1 = angleToPosition(angle1);
    const pos2 = angleToPosition(angle2);
    return pos1 === pos2 || pos1 === (pos2 + 6) % 12 || pos2 === (pos1 + 6) % 12;
  }

  function getBeamHit(emitter) {
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
      if (blocker.idx === emitter.idx && areAtSamePosition(blocker.angle - rotations[blocker.idx] - SHAPE_ROTATION, emitter.angle - rotations[emitter.idx] - SHAPE_ROTATION - 180)) {
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
    let edgeHit = null;
    for (const edge of edgeLines) {
      // Ray/segment intersection
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
          edgeHit = edge;
        }
      }
    }
    // Return hit info
    return { x: emitter.x + minT * dx, y: emitter.y + minT * dy, hitType, hitObj, edgeHit };
  }

  // For each emitter, compute beam
  const beams = emitters.map((emitter) => {
    return { emitter, ...getBeamHit(emitter) };
  });

  // Which lit edges are hit by a beam?
  const litHit = new Set();
  beams.forEach((b) => {
    if (b.hitType === 'edge' && LIT_EDGES.includes(b.hitObj.i)) {
      litHit.add(b.hitObj.i);
    }
  });
  const puzzleSolved = LIT_EDGES.every((i) => litHit.has(i));

  // Updated renderLasersAndBlockers to use rotation and new emitter design
  function renderLasersAndBlockers(circle, idx) {
    const laserRadius = 13;
    const blockerSize = 18;
    return (
      <g key={idx}>
        {/* Emitters (drawn first) */}
        {circle.lasers.map((angle, i) => {
          const rotated = angle + rotations[idx] + SHAPE_ROTATION;
          const rad = degToRad(rotated);
          const ex = CENTER + circle.radius * Math.cos(rad);
          const ey = CENTER + circle.radius * Math.sin(rad);
          return (
            <g key={i}>
              <circle
                cx={ex}
                cy={ey}
                r={laserRadius}
                fill="#fff"
                stroke="#f00"
                strokeWidth={4}
              />
              <circle
                cx={ex}
                cy={ey}
                r={5}
                fill="#f00"
              />
            </g>
          );
        })}
        {/* Blockers (drawn last, on top) */}
        {circle.blockers.map((angle, i) => {
          const rotated = angle + rotations[idx] + SHAPE_ROTATION;
          const rad = degToRad(rotated);
          const bx = CENTER + circle.radius * Math.cos(rad);
          const by = CENTER + circle.radius * Math.sin(rad);
          return (
            <rect
              key={i}
              x={bx - blockerSize / 2}
              y={by - blockerSize / 2}
              width={blockerSize}
              height={blockerSize}
              fill="#333"
              stroke="#fff"
              strokeWidth={2}
              transform={`rotate(${rotated},${bx},${by})`}
              rx={4}
            />
          );
        })}
      </g>
    );
  }

  return (
    <div className="trespasser-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <h1>R&C Trespasser puzzle</h1>
      <svg width={CENTER * 2} height={CENTER * 2}>
        {/* Draw dodecagon edges */}
        {points.map((pt, i) => {
          const next = points[(i + 1) % SIDES];
          const isLit = LIT_EDGES.includes(i);
          const isGreen = litHit.has(i);
          return (
            <line
              key={i}
              x1={pt[0]}
              y1={pt[1]}
              x2={next[0]}
              y2={next[1]}
              stroke={isLit ? (isGreen ? 'lime' : 'red') : '#888'}
              strokeWidth={isLit ? 6 : 3}
              strokeLinecap="round"
            />
          );
        })}
        {/* Draw dodecagon vertices (for clarity) */}
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} fill="#222" />
        ))}
        {/* Draw concentric circles for laser/blocker bases */}
        <circle cx={CENTER} cy={CENTER} r={50} fill="none" stroke="#4af" strokeWidth={2} />
        <circle cx={CENTER} cy={CENTER} r={90} fill="none" stroke="#4fa" strokeWidth={2} />
        <circle cx={CENTER} cy={CENTER} r={130} fill="none" stroke="#4ff" strokeWidth={2} />
        {/* Render lasers and blockers for each circle */}
        {CIRCLES.map((circle, idx) => renderLasersAndBlockers(circle, idx))}
        {/* Draw laser beams */}
        {beams.map((b, i) => (
          <line
            key={i}
            x1={b.emitter.x}
            y1={b.emitter.y}
            x2={b.x}
            y2={b.y}
            stroke="#f00"
            strokeWidth={3}
            strokeDasharray="6 4"
          />
        ))}
        {/* Highlight selected circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CIRCLES[selected].radius}
          fill="none"
          stroke="#ff0"
          strokeWidth={4}
          pointerEvents="none"
          style={{ filter: 'drop-shadow(0 0 8px #ff0)' }}
        />
      </svg>
      <p>Lit edges are shown in <span style={{color:'red'}}>red</span>.<br/>
      Use <b>Up/Down</b> to select a circle, <b>Left/Right</b> to rotate.</p>
      {puzzleSolved && (
        <div style={{color:'lime', fontWeight:'bold', fontSize:'2rem', marginTop:'1em'}}>Puzzle Solved!</div>
      )}
      {!solvable && (
        <div style={{color:'red', fontWeight:'bold', fontSize:'1.2rem', marginTop:'1em'}}>This puzzle is NOT solvable.</div>
      )}
      <div style={{marginBottom:'1em'}}>
        <label>Lit Edges: </label>
        <input type="number" min={1} max={maxLit} value={minLit} onChange={handleMinLit} style={{width:40}} />
        <span> to </span>
        <input type="number" min={minLit} max={SIDES} value={maxLit} onChange={handleMaxLit} style={{width:40}} />
        <label style={{marginLeft:'1em'}}>
          <input type="checkbox" checked={autoSolve} onChange={handleAutoSolve} /> Auto-regenerate if unsolvable
        </label>
        <span style={{marginLeft:'1em'}}>Attempts: {internalAttempts}</span>
      </div>
      <button onClick={newPuzzleBtn} style={{marginTop:'1em',fontSize:'1.1em'}}>New Puzzle</button>
    </div>
  );
}

export default App;
