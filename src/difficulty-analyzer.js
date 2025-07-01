// Difficulty Analysis Utility
// Provides detailed analysis of puzzle difficulty and solution complexity

/**
 * Analyze the difficulty of a puzzle
 */
function analyzePuzzleDifficulty(puzzle, solutionSpace = null) {
  const analysis = {
    basicMetrics: calculateBasicMetrics(puzzle),
    solutionComplexity: calculateSolutionComplexity(puzzle),
    cognitiveLoad: calculateCognitiveLoad(puzzle),
    aestheticScore: calculateAestheticScore(puzzle),
    overallDifficulty: 0,
    difficultyLevel: 'medium',
    recommendations: []
  };
  
  // Calculate overall difficulty score
  analysis.overallDifficulty = (
    analysis.basicMetrics.score * 0.3 +
    analysis.solutionComplexity.score * 0.4 +
    analysis.cognitiveLoad.score * 0.2 +
    (1 - analysis.aestheticScore.score) * 0.1 // Lower aesthetic score = higher difficulty
  );
  
  // Determine difficulty level
  if (analysis.overallDifficulty < 0.3) {
    analysis.difficultyLevel = 'easy';
  } else if (analysis.overallDifficulty < 0.7) {
    analysis.difficultyLevel = 'medium';
  } else {
    analysis.difficultyLevel = 'hard';
  }
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);
  
  return analysis;
}

/**
 * Calculate basic difficulty metrics
 */
function calculateBasicMetrics(puzzle) {
  const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
  const totalBlockers = puzzle.circles.reduce((sum, circle) => sum + circle.blockers.length, 0);
  const numLitEdges = puzzle.litEdges.length;
  
  // Normalize scores to 0-1 range
  const emitterScore = Math.min(totalEmitters / 12, 1); // Max reasonable: 12 emitters
  const blockerScore = Math.min(totalBlockers / 8, 1);   // Max reasonable: 8 blockers
  const edgeScore = Math.min(numLitEdges / 8, 1);        // Max reasonable: 8 lit edges
  
  const score = (emitterScore + blockerScore + edgeScore) / 3;
  
  return {
    score,
    totalEmitters,
    totalBlockers,
    numLitEdges,
    emitterDensity: totalEmitters / 36, // 36 possible positions
    blockerDensity: totalBlockers / 36,
    litEdgeDensity: numLitEdges / 12    // 12 possible edges
  };
}

/**
 * Calculate solution complexity metrics
 */
function calculateSolutionComplexity(puzzle) {
  // Estimate minimum number of rotations needed
  const minRotations = estimateMinimumRotations(puzzle);
  
  // Calculate interdependency between circles
  const interdependency = calculateCircleInterdependency(puzzle);
  
  // Calculate solution uniqueness (how many different ways to solve)
  const uniqueness = calculateSolutionUniqueness(puzzle);
  
  const score = (
    Math.min(minRotations / 10, 1) * 0.4 +     // More rotations = harder
    interdependency * 0.4 +                     // More interdependency = harder  
    (1 - uniqueness) * 0.2                      // Fewer solutions = harder
  );
  
  return {
    score,
    minRotations,
    interdependency,
    uniqueness,
    estimatedSolveTime: minRotations * 2 + interdependency * 5 // seconds
  };
}

/**
 * Estimate minimum rotations needed to solve
 */
function estimateMinimumRotations(puzzle) {
  let totalRotations = 0;
  
  // Simple heuristic: assume each lit edge needs at least one rotation
  // and account for conflicts between emitters
  for (const edge of puzzle.litEdges) {
    // Find the closest emitter that could hit this edge
    let minRotationsForEdge = Infinity;
    
    for (let circleIdx = 0; circleIdx < puzzle.circles.length; circleIdx++) {
      const circle = puzzle.circles[circleIdx];
      
      for (const emitterAngle of circle.lasers) {
        // Calculate how many rotations needed to align this emitter with the edge
        const targetAngle = (edge * 30 + 15) % 360;
        const currentDirection = (emitterAngle + 180) % 360;
        const rotationNeeded = Math.min(
          Math.abs(targetAngle - currentDirection),
          360 - Math.abs(targetAngle - currentDirection)
        ) / 30;
        
        minRotationsForEdge = Math.min(minRotationsForEdge, rotationNeeded);
      }
    }
    
    totalRotations += minRotationsForEdge === Infinity ? 3 : minRotationsForEdge;
  }
  
  return Math.min(totalRotations, 20); // Cap at reasonable maximum
}

/**
 * Calculate interdependency between circles
 */
function calculateCircleInterdependency(puzzle) {
  let interdependency = 0;
  
  // Check for blocking relationships between circles
  for (let i = 0; i < puzzle.circles.length; i++) {
    for (let j = i + 1; j < puzzle.circles.length; j++) {
      const circle1 = puzzle.circles[i];
      const circle2 = puzzle.circles[j];
      
      // Count potential conflicts
      let conflicts = 0;
      
      for (const emitter1 of circle1.lasers) {
        for (const blocker2 of circle2.blockers) {
          // Check if blocker2 could potentially block emitter1
          const angleDiff = Math.abs(((emitter1 - blocker2 + 180) % 360) - 180);
          if (angleDiff < 45) { // Within blocking range
            conflicts++;
          }
        }
      }
      
      interdependency += conflicts / (circle1.lasers.length * circle2.blockers.length || 1);
    }
  }
  
  return Math.min(interdependency, 1);
}

/**
 * Calculate solution uniqueness (0 = unique solution, 1 = many solutions)
 */
function calculateSolutionUniqueness(puzzle) {
  // Simplified heuristic based on emitter-to-edge ratios
  const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
  const numLitEdges = puzzle.litEdges.length;
  
  if (numLitEdges === 0) return 1;
  
  const ratio = totalEmitters / numLitEdges;
  
  // More emitters relative to lit edges = more possible solutions
  return Math.min(ratio / 3, 1); // Normalize to 0-1
}

/**
 * Calculate cognitive load metrics
 */
function calculateCognitiveLoad(puzzle) {
  // Working memory load
  const workingMemoryLoad = calculateWorkingMemoryLoad(puzzle);
  
  // Visual complexity
  const visualComplexity = calculateVisualComplexity(puzzle);
  
  // Pattern recognition difficulty
  const patternDifficulty = calculatePatternDifficulty(puzzle);
  
  const score = (workingMemoryLoad + visualComplexity + patternDifficulty) / 3;
  
  return {
    score,
    workingMemoryLoad,
    visualComplexity,
    patternDifficulty,
    estimatedCognitiveEffort: score * 10 // 1-10 scale
  };
}

/**
 * Calculate working memory load
 */
function calculateWorkingMemoryLoad(puzzle) {
  // Number of items player needs to track simultaneously
  const itemsToTrack = (
    puzzle.litEdges.length +                    // Lit edges to hit
    puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0) * 0.5 + // Emitters (weighted)
    puzzle.circles.reduce((sum, circle) => sum + circle.blockers.length, 0) * 0.3   // Blockers (weighted)
  );
  
  // Miller's rule: 7±2 items in working memory
  return Math.min(itemsToTrack / 9, 1);
}

/**
 * Calculate visual complexity
 */
function calculateVisualComplexity(puzzle) {
  const totalElements = (
    puzzle.litEdges.length +
    puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length + circle.blockers.length, 0)
  );
  
  // Check for symmetry (reduces perceived complexity)
  const symmetryFactor = calculateSymmetryFactor(puzzle);
  
  const baseComplexity = Math.min(totalElements / 20, 1);
  return baseComplexity * (1 - symmetryFactor * 0.3); // Symmetry reduces complexity
}

/**
 * Calculate symmetry factor
 */
function calculateSymmetryFactor(puzzle) {
  // Check for rotational symmetry in lit edges
  let symmetryScore = 0;
  
  // Check 2-fold, 3-fold, 4-fold, and 6-fold symmetry
  for (const fold of [2, 3, 4, 6]) {
    if (hasRotationalSymmetry(puzzle.litEdges, fold)) {
      symmetryScore = Math.max(symmetryScore, 1 / fold);
    }
  }
  
  return symmetryScore;
}

/**
 * Check if lit edges have rotational symmetry
 */
function hasRotationalSymmetry(litEdges, fold) {
  const angleStep = 360 / fold;
  
  for (const edge of litEdges) {
    let hasSymmetricPartner = false;
    
    for (let i = 1; i < fold; i++) {
      const symmetricEdge = (edge + (i * 12 / fold)) % 12;
      if (litEdges.includes(Math.floor(symmetricEdge))) {
        hasSymmetricPartner = true;
        break;
      }
    }
    
    if (!hasSymmetricPartner) return false;
  }
  
  return true;
}

/**
 * Calculate pattern recognition difficulty
 */
function calculatePatternDifficulty(puzzle) {
  // Check for common patterns that are easier to recognize
  const hasCommonPatterns = checkForCommonPatterns(puzzle);
  
  // Check for regularity in spacing
  const spacingRegularity = calculateSpacingRegularity(puzzle);
  
  return (1 - hasCommonPatterns) * 0.6 + (1 - spacingRegularity) * 0.4;
}

/**
 * Check for common recognizable patterns
 */
function checkForCommonPatterns(puzzle) {
  let patternScore = 0;
  
  // Check for consecutive lit edges
  let consecutiveGroups = 0;
  let currentGroup = 0;
  
  for (let i = 0; i < 12; i++) {
    if (puzzle.litEdges.includes(i)) {
      currentGroup++;
    } else {
      if (currentGroup > 0) {
        consecutiveGroups++;
        currentGroup = 0;
      }
    }
  }
  if (currentGroup > 0) consecutiveGroups++;
  
  // Prefer fewer, larger groups
  if (consecutiveGroups <= 2) patternScore += 0.3;
  
  // Check for opposite pairs
  let oppositePairs = 0;
  for (const edge of puzzle.litEdges) {
    const opposite = (edge + 6) % 12;
    if (puzzle.litEdges.includes(opposite)) {
      oppositePairs++;
    }
  }
  
  if (oppositePairs >= 2) patternScore += 0.3;
  
  return Math.min(patternScore, 1);
}

/**
 * Calculate spacing regularity
 */
function calculateSpacingRegularity(puzzle) {
  if (puzzle.litEdges.length < 2) return 1;
  
  const spacings = [];
  const sortedEdges = [...puzzle.litEdges].sort((a, b) => a - b);
  
  for (let i = 0; i < sortedEdges.length; i++) {
    const next = sortedEdges[(i + 1) % sortedEdges.length];
    const spacing = next > sortedEdges[i] ? 
      next - sortedEdges[i] : 
      (12 - sortedEdges[i]) + next;
    spacings.push(spacing);
  }
  
  // Calculate variance in spacings
  const meanSpacing = spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
  const variance = spacings.reduce((sum, s) => sum + Math.pow(s - meanSpacing, 2), 0) / spacings.length;
  
  // Lower variance = higher regularity
  return Math.max(0, 1 - variance / 10);
}

/**
 * Calculate aesthetic score
 */
function calculateAestheticScore(puzzle) {
  const symmetryScore = calculateSymmetryFactor(puzzle);
  const balance = calculateVisualBalance(puzzle);
  const elegance = calculateElegance(puzzle);
  
  const score = (symmetryScore + balance + elegance) / 3;
  
  return {
    score,
    symmetryScore,
    balance,
    elegance
  };
}

/**
 * Calculate visual balance
 */
function calculateVisualBalance(puzzle) {
  // Check distribution of elements across circles
  const emitterDistribution = puzzle.circles.map(circle => circle.lasers.length);
  const blockerDistribution = puzzle.circles.map(circle => circle.blockers.length);
  
  // Calculate balance scores
  const emitterBalance = 1 - (Math.max(...emitterDistribution) - Math.min(...emitterDistribution)) / 5;
  const blockerBalance = 1 - (Math.max(...blockerDistribution) - Math.min(...blockerDistribution)) / 3;
  
  return Math.max(0, (emitterBalance + blockerBalance) / 2);
}

/**
 * Calculate elegance (simplicity and purposefulness)
 */
function calculateElegance(puzzle) {
  const totalElements = puzzle.circles.reduce((sum, circle) => 
    sum + circle.lasers.length + circle.blockers.length, 0
  );
  const numLitEdges = puzzle.litEdges.length;
  
  // Elegance = achieving the goal with minimal elements
  const efficiency = numLitEdges / totalElements;
  
  // Penalize excessive complexity
  const complexityPenalty = Math.max(0, (totalElements - 15) / 10);
  
  return Math.max(0, Math.min(1, efficiency - complexityPenalty));
}

/**
 * Generate improvement recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.basicMetrics.emitterDensity > 0.8) {
    recommendations.push("Consider reducing the number of emitters for a cleaner puzzle");
  }
  
  if (analysis.basicMetrics.blockerDensity > 0.6) {
    recommendations.push("Too many blockers might make the puzzle frustrating");
  }
  
  if (analysis.solutionComplexity.minRotations > 15) {
    recommendations.push("Puzzle might require too many moves - consider simplifying");
  }
  
  if (analysis.cognitiveLoad.workingMemoryLoad > 0.8) {
    recommendations.push("High cognitive load - consider reducing visual complexity");
  }
  
  if (analysis.aestheticScore.symmetryScore < 0.2) {
    recommendations.push("Adding some symmetry could improve visual appeal");
  }
  
  if (analysis.solutionComplexity.uniqueness > 0.8) {
    recommendations.push("Many possible solutions - consider adding constraints for focus");
  }
  
  return recommendations;
}

export {
  analyzePuzzleDifficulty,
  calculateBasicMetrics,
  calculateSolutionComplexity,
  calculateCognitiveLoad,
  calculateAestheticScore
};
