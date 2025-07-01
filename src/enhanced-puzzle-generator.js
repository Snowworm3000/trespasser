// Enhanced Constraint-Based Puzzle Generator
// Implements advanced techniques from the README including:
// - Solution Space Analysis
// - Constraint Satisfaction
// - Intelligent Blocker Placement
// - Difficulty Control

const SIDES = 12;
const SHAPE_ROTATION = 15;

// Cross-platform performance timing
const getTime = () => {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  } else if (typeof Date !== 'undefined') {
    return Date.now();
  } else {
    return 0;
  }
};

/**
 * Enhanced Solution Space Analyzer
 * Pre-calculates all valid emitter-to-edge connections
 */
class SolutionSpaceAnalyzer {
  constructor() {
    this.solutionMap = new Map();
    this.difficultyMap = new Map();
    this.initialized = false;
  }
  
  initialize() {
    if (this.initialized) return;
    
    console.log('Initializing Solution Space Analysis...');
    const startTime = getTime();
    
    // For each circle, emitter position, and rotation, calculate which edges can be hit
    for (let circle = 0; circle < 3; circle++) {
      const radius = [50, 90, 130][circle];
      const circleKey = `circle_${circle}`;
      this.solutionMap.set(circleKey, new Map());
      
      for (let emitterPos = 0; emitterPos < 12; emitterPos++) {
        const emitterAngle = emitterPos * 30; // 0, 30, 60, ... 330
        const posKey = `pos_${emitterPos}`;
        this.solutionMap.get(circleKey).set(posKey, new Map());
        
        for (let rotation = 0; rotation < 12; rotation++) {
          const rotAngle = rotation * 30; // 0, 30, 60, ... 330
          const rotKey = `rot_${rotation}`;
          
          // Calculate actual emitter position after rotation
          const actualEmitterAngle = (emitterAngle + rotAngle + SHAPE_ROTATION) % 360;
          
          // Calculate beam direction (toward center, then continuing to edge)
          const beamDirection = (actualEmitterAngle + 180) % 360;
          
          // Find which edges this beam can hit
          const hittableEdges = [];
          for (let edge = 0; edge < SIDES; edge++) {
            const edgeCenter = (edge * 30 + 15 + SHAPE_ROTATION) % 360;
            
            // Calculate angular difference
            let angleDiff = Math.abs(beamDirection - edgeCenter);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            
            // Tolerance based on circle radius (inner circles have wider spread)
            const tolerance = [30, 25, 20][circle];
            
            if (angleDiff <= tolerance) {
              hittableEdges.push(edge);
            }
          }
          
          this.solutionMap.get(circleKey).get(posKey).set(rotKey, hittableEdges);
        }
      }
    }
    
    // Calculate difficulty metrics
    this.calculateDifficultyMetrics();
    
    this.initialized = true;
    console.log(`Solution space analysis completed in ${getTime() - startTime}ms`);
  }
  
  calculateDifficultyMetrics() {
    // For each edge, calculate how many ways it can be hit
    for (let edge = 0; edge < SIDES; edge++) {
      let totalSolutions = 0;
      let minRotations = Infinity;
      
      for (let circle = 0; circle < 3; circle++) {
        const circleKey = `circle_${circle}`;
        
        for (let pos = 0; pos < 12; pos++) {
          const posKey = `pos_${pos}`;
          
          for (let rot = 0; rot < 12; rot++) {
            const rotKey = `rot_${rot}`;
            const hittableEdges = this.solutionMap.get(circleKey).get(posKey).get(rotKey);
            
            if (hittableEdges.includes(edge)) {
              totalSolutions++;
              minRotations = Math.min(minRotations, rot);
            }
          }
        }
      }
      
      this.difficultyMap.set(edge, {
        solutionCount: totalSolutions,
        minRotations: minRotations === Infinity ? 12 : minRotations,
        difficulty: 1 / Math.max(1, totalSolutions) // Higher difficulty = fewer solutions
      });
    }
  }
  
  getEdgeDifficulty(edge) {
    return this.difficultyMap.get(edge) || { solutionCount: 0, minRotations: 12, difficulty: 1 };
  }
  
  findEmitterForEdge(edge, preferredCircle = null) {
    const solutions = [];
    
    const circlesToCheck = preferredCircle !== null ? [preferredCircle] : [0, 1, 2];
    
    for (const circle of circlesToCheck) {
      const circleKey = `circle_${circle}`;
      
      for (let pos = 0; pos < 12; pos++) {
        const posKey = `pos_${pos}`;
        
        for (let rot = 0; rot < 12; rot++) {
          const rotKey = `rot_${rot}`;
          const hittableEdges = this.solutionMap.get(circleKey).get(posKey).get(rotKey);
          
          if (hittableEdges.includes(edge)) {
            solutions.push({
              circle,
              position: pos,
              rotation: rot,
              emitterAngle: pos * 30,
              rotationAngle: rot * 30,
              difficulty: rot // Prefer solutions requiring fewer rotations
            });
          }
        }
      }
    }
    
    // Sort by difficulty (prefer fewer rotations)
    solutions.sort((a, b) => a.difficulty - b.difficulty);
    
    return solutions;
  }
}

// Global analyzer instance
const analyzer = new SolutionSpaceAnalyzer();

/**
 * Enhanced Constraint-Based Puzzle Generator
 */
function generateEnhancedConstraintPuzzle(minLit, maxLit, targetDifficulty = 'medium') {
  const startTime = getTime();
  
  // Initialize solution space analysis
  analyzer.initialize();
  
  // Step 1: Select lit edges based on difficulty
  const litEdges = selectEdgesWithDifficultyControl(minLit, maxLit, targetDifficulty);
  
  // Step 2: Use constraint satisfaction to place emitters
  const circles = placeEmittersWithConstraints(litEdges);
  
  // Step 3: Add intelligent blockers
  addIntelligentBlockers(circles, litEdges, targetDifficulty);
  
  const generationTime = getTime() - startTime;
  console.log(`Enhanced puzzle generated in ${generationTime}ms`);
  
  return {
    litEdges,
    circles,
    metadata: {
      algorithm: 'enhanced-constraint',
      difficulty: targetDifficulty,
      generationTime
    }
  };
}

/**
 * Select edges with difficulty control
 */
function selectEdgesWithDifficultyControl(minLit, maxLit, targetDifficulty) {
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const edges = Array.from({ length: SIDES }, (_, i) => i);
  
  // Calculate weights based on difficulty
  const weights = edges.map(edge => {
    const difficulty = analyzer.getEdgeDifficulty(edge);
    
    switch (targetDifficulty) {
      case 'easy':
        return 1 / (difficulty.difficulty + 0.1); // Prefer easier edges
      case 'hard':
        return difficulty.difficulty + 0.1; // Prefer harder edges
      default:
        return 0.5 + Math.random() * 0.5; // Mixed
    }
  });
  
  const selectedEdges = [];
  
  // Weighted random selection
  for (let i = 0; i < numLit; i++) {
    const totalWeight = weights.reduce((sum, w, idx) => 
      selectedEdges.includes(idx) ? sum : sum + w, 0);
    
    if (totalWeight <= 0) break;
    
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < edges.length; j++) {
      if (selectedEdges.includes(j)) continue;
      
      random -= weights[j];
      if (random <= 0) {
        selectedEdges.push(j);
        break;
      }
    }
  }
  
  return selectedEdges.sort((a, b) => a - b);
}

/**
 * Use constraint satisfaction to place emitters
 */
function placeEmittersWithConstraints(litEdges) {
  const circles = [
    { radius: 50, lasers: [], blockers: [] },
    { radius: 90, lasers: [], blockers: [] },
    { radius: 130, lasers: [], blockers: [] }
  ];
  
  const usedPositions = new Set(); // Track used circle-position combinations
  
  // For each lit edge, find the best emitter placement
  for (let i = 0; i < litEdges.length; i++) {
    const edge = litEdges[i];
    
    // Find possible solutions for this edge
    const solutions = analyzer.findEmitterForEdge(edge);
    
    if (solutions.length === 0) {
      console.warn(`No solutions found for edge ${edge}`);
      continue;
    }
    
    // Find best solution that doesn't conflict with existing emitters
    let bestSolution = null;
    
    for (const solution of solutions) {
      const posKey = `${solution.circle}-${solution.position}`;
      
      if (!usedPositions.has(posKey)) {
        bestSolution = solution;
        break;
      }
    }
    
    // If no non-conflicting solution, use the best one anyway
    if (!bestSolution) {
      bestSolution = solutions[0];
    }
    
    // Add emitter to circle
    const circle = circles[bestSolution.circle];
    if (!circle.lasers.includes(bestSolution.emitterAngle)) {
      circle.lasers.push(bestSolution.emitterAngle);
      usedPositions.add(`${bestSolution.circle}-${bestSolution.position}`);
    }
  }
  
  // Add some variety emitters (but not too many)
  const varietyEmitters = Math.min(2, Math.floor(litEdges.length * 0.3));
  
  for (let i = 0; i < varietyEmitters; i++) {
    const circle = Math.floor(Math.random() * 3);
    const position = Math.floor(Math.random() * 12);
    const angle = position * 30;
    
    if (!circles[circle].lasers.includes(angle)) {
      circles[circle].lasers.push(angle);
    }
  }
  
  return circles;
}

/**
 * Add intelligent blockers that create constraints without making puzzle unsolvable
 */
function addIntelligentBlockers(circles, litEdges, targetDifficulty) {
  const blockersPerCircle = targetDifficulty === 'hard' ? 2 : 1;
  
  for (let circleIdx = 0; circleIdx < circles.length; circleIdx++) {
    const circle = circles[circleIdx];
    
    for (let b = 0; b < blockersPerCircle; b++) {
      const blocker = findStrategicBlockerPosition(circle, circleIdx, litEdges);
      
      if (blocker !== null && !circle.blockers.includes(blocker)) {
        circle.blockers.push(blocker);
      }
    }
  }
}

/**
 * Find strategic blocker positions that add difficulty without breaking solvability
 */
function findStrategicBlockerPosition(circle, circleIdx, litEdges) {
  const usedAngles = new Set([...circle.lasers, ...circle.blockers]);
  const availablePositions = [];
  
  for (let pos = 0; pos < 12; pos++) {
    const angle = pos * 30;
    if (!usedAngles.has(angle)) {
      availablePositions.push(angle);
    }
  }
  
  if (availablePositions.length === 0) return null;
  
  // Score positions based on strategic value
  const scoredPositions = availablePositions.map(angle => {
    let score = Math.random(); // Base randomness
    
    // Prefer positions that create interesting constraints
    // but don't completely block critical paths
    
    // Avoid positions directly opposite to emitters on same circle
    for (const emitterAngle of circle.lasers) {
      const opposite = (emitterAngle + 180) % 360;
      const angleDiff = Math.abs(((angle - opposite + 180) % 360) - 180);
      
      if (angleDiff < 30) {
        score -= 0.5; // Penalize blocking direct opposite
      } else if (angleDiff < 60) {
        score += 0.2; // Slight bonus for creating constraint
      }
    }
    
    return { angle, score };
  });
  
  // Sort by score and pick the best
  scoredPositions.sort((a, b) => b.score - a.score);
  
  return scoredPositions[0].angle;
}

/**
 * Validate enhanced puzzle
 */
function validateEnhancedPuzzle(puzzle) {
  // Check basic structure
  if (!puzzle.litEdges || !Array.isArray(puzzle.litEdges) || puzzle.litEdges.length === 0) {
    return false;
  }
  
  if (!puzzle.circles || !Array.isArray(puzzle.circles) || puzzle.circles.length !== 3) {
    return false;
  }
  
  // Check that puzzle has emitters
  const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
  if (totalEmitters === 0) {
    return false;
  }
  
  // Quick solvability check using solution space analysis
  for (const edge of puzzle.litEdges) {
    const solutions = analyzer.findEmitterForEdge(edge);
    
    if (solutions.length === 0) {
      console.warn(`No solutions available for edge ${edge}`);
      return false;
    }
    
    // Check if any of the solutions match existing emitters
    let hasSolution = false;
    
    for (const solution of solutions) {
      const circle = puzzle.circles[solution.circle];
      if (circle.lasers.includes(solution.emitterAngle)) {
        hasSolution = true;
        break;
      }
    }
    
    if (!hasSolution) {
      console.warn(`No matching emitter found for edge ${edge}`);
      return false;
    }
  }
  
  return true;
}

export {
  generateEnhancedConstraintPuzzle,
  SolutionSpaceAnalyzer,
  validateEnhancedPuzzle
};
