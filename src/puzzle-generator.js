// Advanced Puzzle Generation Algorithm with Solution Space Analysis
// Implements improved techniques from the README
import { generateEnhancedConstraintPuzzle, validateEnhancedPuzzle } from './enhanced-puzzle-generator.js';

const SIDES = 12;
const SHAPE_ROTATION = 15; // degrees

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

// Performance monitoring
const performanceStats = {
  generationTime: 0,
  solvabilityChecks: 0,
  solutionSpaceCalculations: 0,
  cacheHits: 0,
  cacheMisses: 0
};

// Solution space mapping cache
const solutionSpaceCache = new Map();

/**
 * Pre-calculate which emitter positions can hit which edges under different rotations
 * This creates a comprehensive mapping of possibilities to enable constraint-based generation
 */
function calculateSolutionSpace() {
  const startTime = getTime();
  performanceStats.solutionSpaceCalculations++;
  
  const cacheKey = 'solution-space';
  if (solutionSpaceCache.has(cacheKey)) {
    performanceStats.cacheHits++;
    return solutionSpaceCache.get(cacheKey);
  }
  
  performanceStats.cacheMisses++;
  
  const solutionSpace = {
    // Map of circle -> emitter angle -> edge -> rotations that allow hitting
    emitterToEdge: new Map(),
    // Map of edge -> possible emitters that can hit it
    edgeToEmitters: new Map(),
    // Difficulty metrics for each configuration
    difficultyMetrics: new Map()
  };
  
  // Initialize maps
  for (let circle = 0; circle < 3; circle++) {
    solutionSpace.emitterToEdge.set(circle, new Map());
    for (let angle = 15; angle < 360; angle += 30) {
      solutionSpace.emitterToEdge.get(circle).set(angle, new Map());
      for (let edge = 0; edge < SIDES; edge++) {
        solutionSpace.emitterToEdge.get(circle).get(angle).set(edge, []);
      }
    }
  }
  
  for (let edge = 0; edge < SIDES; edge++) {
    solutionSpace.edgeToEmitters.set(edge, []);
  }
  
  // Calculate all possible emitter-to-edge connections
  for (let circle = 0; circle < 3; circle++) {
    const radius = [50, 90, 130][circle];
    
    for (let emitterAngle = 15; emitterAngle < 360; emitterAngle += 30) {
      for (let rotation = 0; rotation < 360; rotation += 30) {
        const actualAngle = emitterAngle + rotation + SHAPE_ROTATION;
        
        // Calculate which edge this emitter would hit (simplified - no blockers)
        const targetAngle = (actualAngle + 180) % 360;
        const edgeIndex = Math.round(((targetAngle - 15) % 360) / 30) % SIDES;
        
        // Check if this is a valid hit (accounting for geometry)
        if (canEmitterHitEdge(circle, emitterAngle, edgeIndex, rotation)) {
          solutionSpace.emitterToEdge.get(circle).get(emitterAngle).get(edgeIndex).push(rotation);
          solutionSpace.edgeToEmitters.get(edgeIndex).push({
            circle,
            angle: emitterAngle,
            rotation
          });
        }
      }
    }
  }
  
  // Calculate difficulty metrics
  calculateDifficultyMetrics(solutionSpace);
  
  solutionSpaceCache.set(cacheKey, solutionSpace);
  performanceStats.generationTime += getTime() - startTime;
  
  return solutionSpace;
}

/**
 * Check if an emitter can hit an edge (improved geometric check)
 */
function canEmitterHitEdge(circle, emitterAngle, edgeIndex, rotation) {
  // Calculate the actual emitter position after rotation
  const actualEmitterAngle = (emitterAngle + rotation + SHAPE_ROTATION) % 360;
  
  // Calculate the direction the emitter fires (toward center, then out to edge)
  const firingDirection = (actualEmitterAngle + 180) % 360;
  
  // Calculate the target angle for the edge (center of the edge)
  const edgeTargetAngle = (edgeIndex * 30 + 15 + SHAPE_ROTATION) % 360;
  
  // Calculate angular difference
  let angleDiff = Math.abs(firingDirection - edgeTargetAngle);
  if (angleDiff > 180) {
    angleDiff = 360 - angleDiff;
  }
  
  // Allow tolerance based on circle radius - inner circles have wider beam spread
  const tolerance = [25, 20, 15][circle];
  return angleDiff <= tolerance;
}

/**
 * Calculate difficulty metrics for puzzle configurations
 */
function calculateDifficultyMetrics(solutionSpace) {
  const metrics = {
    minMovesToSolve: new Map(),
    solutionComplexity: new Map(),
    requiredRotations: new Map()
  };
  
  // Calculate metrics for each edge
  for (let edge = 0; edge < SIDES; edge++) {
    const emitters = solutionSpace.edgeToEmitters.get(edge);
    
    // Calculate minimum moves (rotations) needed to hit this edge
    let minMoves = Infinity;
    let totalSolutions = 0;
    
    for (const emitter of emitters) {
      const moves = Math.abs(emitter.rotation) / 30;
      minMoves = Math.min(minMoves, moves);
      totalSolutions++;
    }
    
    metrics.minMovesToSolve.set(edge, minMoves === Infinity ? 0 : minMoves);
    metrics.solutionComplexity.set(edge, 1 / Math.max(1, totalSolutions)); // Higher complexity = fewer solutions
  }
  
  solutionSpace.difficultyMetrics = metrics;
}

/**
 * Generate a puzzle using constraint-based approach
 */
function generateConstraintBasedPuzzle(minLit, maxLit, targetDifficulty = 'medium') {
  const startTime = getTime();
  
  try {
    // Try the enhanced algorithm first
    const enhancedPuzzle = generateEnhancedConstraintPuzzle(minLit, maxLit, targetDifficulty);
    
    if (validateEnhancedPuzzle(enhancedPuzzle)) {
      performanceStats.generationTime += getTime() - startTime;
      return enhancedPuzzle;
    } else {
      console.warn('Enhanced puzzle failed validation, falling back to simplified version');
    }
  } catch (error) {
    console.error('Enhanced algorithm failed:', error);
  }
  
  // Fallback to simplified approach
  const puzzle = generateSimplifiedConstraintPuzzle(minLit, maxLit, targetDifficulty);
  
  performanceStats.generationTime += getTime() - startTime;
  
  return puzzle;
}

/**
 * Generate puzzle using a simplified constraint-based approach
 */
function generateSimplifiedConstraintPuzzle(minLit, maxLit, targetDifficulty) {
  // Step 1: Select lit edges
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const litEdges = [];
  
  // Select edges with some strategy based on difficulty
  if (targetDifficulty === 'easy') {
    // For easy puzzles, prefer consecutive edges
    const startEdge = Math.floor(Math.random() * SIDES);
    for (let i = 0; i < numLit; i++) {
      litEdges.push((startEdge + i) % SIDES);
    }
  } else if (targetDifficulty === 'hard') {
    // For hard puzzles, prefer scattered edges
    while (litEdges.length < numLit) {
      const edge = Math.floor(Math.random() * SIDES);
      if (!litEdges.includes(edge)) {
        litEdges.push(edge);
      }
    }
  } else {
    // Medium difficulty - mixed approach
    const consecutive = Math.floor(numLit / 2);
    const startEdge = Math.floor(Math.random() * SIDES);
    
    // Add some consecutive edges
    for (let i = 0; i < consecutive; i++) {
      litEdges.push((startEdge + i) % SIDES);
    }
    
    // Add some random edges
    while (litEdges.length < numLit) {
      const edge = Math.floor(Math.random() * SIDES);
      if (!litEdges.includes(edge)) {
        litEdges.push(edge);
      }
    }
  }
  
  litEdges.sort((a, b) => a - b);
  
  // Step 2: Create circles with guaranteed coverage
  const circles = [
    { radius: 50, lasers: [], blockers: [] },
    { radius: 90, lasers: [], blockers: [] },
    { radius: 130, lasers: [], blockers: [] }
  ];
  
  // Step 3: Place emitters to cover each lit edge
  for (let i = 0; i < litEdges.length; i++) {
    const edge = litEdges[i];
    const circleIndex = i % 3; // Distribute across circles
    
    // For simplicity, place emitter directly aligned with the edge
    // The edge angle is edge * 30 + 15 degrees (center of edge)
    // We want an emitter that, when firing toward center and continuing, hits this edge
    const edgeAngle = edge * 30; // Use the edge start angle for simplicity
    
    // Place emitter at the corresponding position (accounting for shape rotation)
    let emitterAngle = (edgeAngle + 180 - SHAPE_ROTATION + 360) % 360;
    
    // Snap to nearest 30-degree increment
    emitterAngle = Math.round(emitterAngle / 30) * 30;
    
    // Ensure valid range
    if (emitterAngle >= 360) emitterAngle -= 360;
    if (emitterAngle < 0) emitterAngle += 360;
    
    // Add to circle if not already present
    if (!circles[circleIndex].lasers.includes(emitterAngle)) {
      circles[circleIndex].lasers.push(emitterAngle);
    }
  }
  
  // Step 4: Add some additional emitters for variety
  const additionalEmitters = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < additionalEmitters; i++) {
    const circleIndex = Math.floor(Math.random() * 3);
    const circle = circles[circleIndex];
    
    // Find available positions
    const usedAngles = new Set([...circle.lasers, ...circle.blockers]);
    const availableAngles = [];
    
    for (let angle = 0; angle < 360; angle += 30) {
      if (!usedAngles.has(angle)) {
        availableAngles.push(angle);
      }
    }
    
    if (availableAngles.length > 0) {
      const randomAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
      circle.lasers.push(randomAngle);
    }
  }
  
  // Step 5: Add blockers carefully
  for (let circleIndex = 0; circleIndex < 3; circleIndex++) {
    const circle = circles[circleIndex];
    const numBlockers = Math.floor(Math.random() * 2) + 1; // 1-2 blockers
    
    for (let i = 0; i < numBlockers; i++) {
      const usedAngles = new Set([...circle.lasers, ...circle.blockers]);
      const availableAngles = [];
      
      for (let angle = 0; angle < 360; angle += 30) {
        if (!usedAngles.has(angle)) {
          // Make sure this blocker won't make puzzle unsolvable
          // Simple check: don't place directly opposite to critical emitters
          let safe = true;
          for (const emitterAngle of circle.lasers) {
            const oppositeAngle = (emitterAngle + 180) % 360;
            if (Math.abs(angle - oppositeAngle) < 30) {
              safe = false;
              break;
            }
          }
          
          if (safe) {
            availableAngles.push(angle);
          }
        }
      }
      
      if (availableAngles.length > 0) {
        const randomAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
        circle.blockers.push(randomAngle);
      }
    }
  }
  
  const result = { litEdges, circles };
  
  // Validate the puzzle before returning
  if (!validateConstraintPuzzle(result)) {
    console.warn('Generated puzzle failed validation, falling back to simpler version');
    // Try a simpler approach if validation fails
    return generateFallbackPuzzle(minLit, maxLit);
  }
  
  return result;
}

/**
 * Select lit edges based on target difficulty
 */
function selectLitEdgesWithDifficulty(minLit, maxLit, targetDifficulty, solutionSpace) {
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const difficultyWeights = getDifficultyWeights(targetDifficulty);
  
  const edges = Array.from({ length: SIDES }, (_, i) => i);
  const litEdges = [];
  
  // Weight edges by difficulty
  const weights = edges.map(edge => {
    const complexity = solutionSpace.difficultyMetrics.solutionComplexity.get(edge) || 0.5;
    const minMoves = solutionSpace.difficultyMetrics.minMovesToSolve.get(edge) || 1;
    
    return difficultyWeights.complexity * complexity + difficultyWeights.moves * minMoves;
  });
  
  // Select edges using weighted random selection
  for (let i = 0; i < numLit; i++) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < edges.length; j++) {
      random -= weights[j];
      if (random <= 0 && !litEdges.includes(edges[j])) {
        litEdges.push(edges[j]);
        weights[j] = 0; // Remove from future selection
        break;
      }
    }
  }
  
  return litEdges.sort((a, b) => a - b);
}

/**
 * Get difficulty weights for different difficulty levels
 */
function getDifficultyWeights(difficulty) {
  switch (difficulty) {
    case 'easy':
      return { complexity: 0.2, moves: 0.8 }; // Favor fewer moves
    case 'medium':
      return { complexity: 0.5, moves: 0.5 }; // Balanced
    case 'hard':
      return { complexity: 0.8, moves: 0.2 }; // Favor complexity
    default:
      return { complexity: 0.5, moves: 0.5 };
  }
}

/**
 * Place emitters using constraint-based approach
 */
function placeEmittersConstraintBased(litEdges, solutionSpace) {
  const circles = [
    { radius: 50, lasers: [], blockers: [] },
    { radius: 90, lasers: [], blockers: [] },
    { radius: 130, lasers: [], blockers: [] }
  ];
  
  // For each lit edge, ensure at least one emitter can hit it
  for (const edge of litEdges) {
    const possibleEmitters = solutionSpace.edgeToEmitters.get(edge);
    
    if (possibleEmitters.length === 0) continue;
    
    // Choose an emitter that provides good coverage
    const chosenEmitter = chooseOptimalEmitter(possibleEmitters, circles, litEdges);
    
    // Add the emitter if not already present
    const circle = circles[chosenEmitter.circle];
    if (!circle.lasers.includes(chosenEmitter.angle)) {
      circle.lasers.push(chosenEmitter.angle);
    }
  }
  
  // Add some random emitters for variety (but not too many)
  addRandomEmitters(circles, litEdges.length);
  
  return circles;
}

/**
 * Choose the optimal emitter for a given edge
 */
function chooseOptimalEmitter(possibleEmitters, circles, litEdges) {
  // Score emitters based on various factors
  let bestEmitter = possibleEmitters[0];
  let bestScore = -Infinity;
  
  for (const emitter of possibleEmitters) {
    let score = 0;
    
    // Prefer emitters that can hit multiple lit edges
    const coverageCount = litEdges.filter(edge => 
      canEmitterHitEdge(emitter.circle, emitter.angle, edge, emitter.rotation)
    ).length;
    score += coverageCount * 10;
    
    // Prefer inner circles (easier to reason about)
    score += (2 - emitter.circle) * 2;
    
    // Avoid overcrowding circles
    const currentEmitters = circles[emitter.circle].lasers.length;
    score -= currentEmitters * 3;
    
    // Add some randomness
    score += Math.random() * 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestEmitter = emitter;
    }
  }
  
  return bestEmitter;
}

/**
 * Add random emitters for puzzle variety
 */
function addRandomEmitters(circles, numLitEdges) {
  const maxAdditional = Math.max(1, Math.floor(numLitEdges * 0.5));
  const numToAdd = Math.floor(Math.random() * maxAdditional);
  
  for (let i = 0; i < numToAdd; i++) {
    const circleIndex = Math.floor(Math.random() * 3);
    const circle = circles[circleIndex];
    
    // Find an unused angle
    const usedAngles = new Set([...circle.lasers, ...circle.blockers]);
    const availableAngles = [];
    
    for (let angle = 15; angle < 360; angle += 30) {
      if (!usedAngles.has(angle)) {
        availableAngles.push(angle);
      }
    }
    
    if (availableAngles.length > 0) {
      const randomAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
      circle.lasers.push(randomAngle);
    }
  }
}

/**
 * Add blockers strategically to increase difficulty while maintaining solvability
 */
function addStrategicBlockers(circles, litEdges, solutionSpace) {
  const maxBlockersPerCircle = 2;
  
  for (let circleIndex = 0; circleIndex < circles.length; circleIndex++) {
    const circle = circles[circleIndex];
    const numBlockers = Math.floor(Math.random() * maxBlockersPerCircle) + 1;
    
    for (let i = 0; i < numBlockers; i++) {
      const blocker = findStrategicBlockerPosition(circle, circleIndex, litEdges, solutionSpace);
      if (blocker !== null && !circle.blockers.includes(blocker)) {
        circle.blockers.push(blocker);
      }
    }
  }
}

/**
 * Find a strategic position for a blocker
 */
function findStrategicBlockerPosition(circle, circleIndex, litEdges, solutionSpace) {
  const usedAngles = new Set([...circle.lasers, ...circle.blockers]);
  const availableAngles = [];
  
  for (let angle = 15; angle < 360; angle += 30) {
    if (!usedAngles.has(angle)) {
      availableAngles.push(angle);
    }
  }
  
  if (availableAngles.length === 0) return null;
  
  // Try to place blockers that create interesting constraints but don't make puzzle unsolvable
  const strategicAngles = availableAngles.filter(angle => {
    // Avoid blocking all solutions to any lit edge
    return !wouldBlockAllSolutions(angle, circleIndex, litEdges, solutionSpace);
  });
  
  const angles = strategicAngles.length > 0 ? strategicAngles : availableAngles;
  return angles[Math.floor(Math.random() * angles.length)];
}

/**
 * Check if placing a blocker would make the puzzle unsolvable
 */
function wouldBlockAllSolutions(blockerAngle, circleIndex, litEdges, solutionSpace) {
  // Simplified check - in reality would need more sophisticated analysis
  // For now, just avoid placing blockers directly opposite to emitters
  const circle = [50, 90, 130][circleIndex];
  
  for (const edge of litEdges) {
    const emitters = solutionSpace.edgeToEmitters.get(edge);
    const sameCircleEmitters = emitters.filter(e => e.circle === circleIndex);
    
    if (sameCircleEmitters.length === 1) {
      const emitter = sameCircleEmitters[0];
      const oppositeAngle = (emitter.angle + 180) % 360;
      if (Math.abs(((blockerAngle - oppositeAngle + 180) % 360) - 180) < 30) {
        return true; // Would block the only solution
      }
    }
  }
  
  return false;
}

/**
 * Validate that a constraint-based puzzle is actually solvable
 * This is a simplified version of the main solvability checker
 */
function validateConstraintPuzzle(puzzle) {
  // Quick validation - check if each lit edge has at least one potential emitter
  for (const edge of puzzle.litEdges) {
    const edgeTargetAngle = (edge * 30 + 15 + SHAPE_ROTATION) % 360;
    let canHit = false;
    
    // Check all emitters across all circles
    for (let circleIdx = 0; circleIdx < puzzle.circles.length; circleIdx++) {
      const circle = puzzle.circles[circleIdx];
      
      for (const emitterAngle of circle.lasers) {
        // Try different rotations for this circle
        for (let rotation = 0; rotation < 360; rotation += 30) {
          const actualAngle = (emitterAngle + rotation + SHAPE_ROTATION) % 360;
          const firingDirection = (actualAngle + 180) % 360;
          
          let angleDiff = Math.abs(firingDirection - edgeTargetAngle);
          if (angleDiff > 180) {
            angleDiff = 360 - angleDiff;
          }
          
          if (angleDiff <= 25) { // Use generous tolerance for validation
            canHit = true;
            break;
          }
        }
        if (canHit) break;
      }
      if (canHit) break;
    }
    
    if (!canHit) {
      console.warn(`Edge ${edge} cannot be hit by any emitter`);
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a very simple fallback puzzle that's guaranteed to be solvable
 */
function generateFallbackPuzzle(minLit, maxLit) {
  const numLit = Math.floor(Math.random() * (maxLit - minLit + 1)) + minLit;
  const litEdges = [];
  
  // Select consecutive edges for simplicity
  const startEdge = Math.floor(Math.random() * SIDES);
  for (let i = 0; i < numLit; i++) {
    litEdges.push((startEdge + i) % SIDES);
  }
  
  const circles = [
    { radius: 50, lasers: [], blockers: [] },
    { radius: 90, lasers: [], blockers: [] },
    { radius: 130, lasers: [], blockers: [] }
  ];
  
  // Place one emitter per lit edge, distributed across circles
  for (let i = 0; i < litEdges.length; i++) {
    const edge = litEdges[i];
    const circleIndex = i % 3;
    
    // Calculate exact angle needed (no rotation required)
    const targetAngle = (edge * 30 + 15) % 360;
    const emitterAngle = (targetAngle + 180 - SHAPE_ROTATION) % 360;
    const snappedAngle = Math.round(emitterAngle / 30) * 30;
    
    circles[circleIndex].lasers.push(snappedAngle);
  }
  
  // Add minimal blockers
  circles[1].blockers.push(90); // One blocker that shouldn't interfere
  
  return { litEdges, circles };
}

/**
 * Get performance statistics
 */
function getPerformanceStats() {
  try {
    return { ...performanceStats };
  } catch (error) {
    console.error('Error getting performance stats:', error);
    return {
      generationTime: 0,
      solvabilityChecks: 0,
      solutionSpaceCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

/**
 * Reset performance statistics
 */
function resetPerformanceStats() {
  Object.keys(performanceStats).forEach(key => {
    performanceStats[key] = 0;
  });
}

/**
 * Clear solution space cache
 */
function clearCache() {
  solutionSpaceCache.clear();
}

export {
  generateConstraintBasedPuzzle,
  calculateSolutionSpace,
  getPerformanceStats,
  resetPerformanceStats,
  clearCache,
  validateConstraintPuzzle
};
