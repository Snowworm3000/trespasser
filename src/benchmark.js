// Benchmark utility for comparing puzzle generation algorithms
import { generateConstraintBasedPuzzle, getPerformanceStats, resetPerformanceStats } from './puzzle-generator.js';

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
 * Benchmark the original random generation algorithm
 */
function benchmarkOriginalAlgorithm(generatePuzzle, isPuzzleSolvable, points, iterations = 100) {
  console.log('Benchmarking Original Algorithm...');
  
  const stats = {
    totalTime: 0,
    totalAttempts: 0,
    solvablePuzzles: 0,
    averageAttempts: 0,
    successRate: 0,
    averageTimePerPuzzle: 0
  };
  
  const startTime = getTime();
  
  for (let i = 0; i < iterations; i++) {
    let attempts = 1;
    let puzzle = generatePuzzle(3, 6); // Use same range as constraint-based
    let solvable = isPuzzleSolvable(puzzle, points);
    
    // Try up to 100 times to get a solvable puzzle
    while (!solvable && attempts < 100) {
      puzzle = generatePuzzle(3, 6);
      solvable = isPuzzleSolvable(puzzle, points);
      attempts++;
    }
    
    stats.totalAttempts += attempts;
    if (solvable) {
      stats.solvablePuzzles++;
    }
  }
  
  stats.totalTime = getTime() - startTime;
  stats.averageAttempts = stats.totalAttempts / iterations;
  stats.successRate = (stats.solvablePuzzles / iterations) * 100;
  stats.averageTimePerPuzzle = stats.totalTime / iterations;
  
  return stats;
}

/**
 * Benchmark the new constraint-based algorithm
 */
function benchmarkConstraintBasedAlgorithm(isPuzzleSolvable, points, iterations = 100) {
  console.log('Benchmarking Constraint-Based Algorithm...');
  
  resetPerformanceStats();
  
  const stats = {
    totalTime: 0,
    totalAttempts: iterations, // Always 1 attempt per puzzle
    solvablePuzzles: 0,
    averageAttempts: 1,
    successRate: 0,
    averageTimePerPuzzle: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  const startTime = getTime();
  
  // Test different difficulty levels
  const difficulties = ['easy', 'medium', 'hard'];
  const puzzlesPerDifficulty = Math.floor(iterations / difficulties.length);
  
  for (const difficulty of difficulties) {
    for (let i = 0; i < puzzlesPerDifficulty; i++) {
      try {
        const puzzle = generateConstraintBasedPuzzle(3, 6, difficulty);
        
        // Actually test if the puzzle is solvable using the main solver
        const solvable = isPuzzleSolvable(puzzle, points);
        if (solvable) {
          stats.solvablePuzzles++;
        }
      } catch (error) {
        console.error('Error generating constraint-based puzzle:', error);
      }
    }
  }
  
  stats.totalTime = getTime() - startTime;
  stats.successRate = (stats.solvablePuzzles / iterations) * 100;
  stats.averageTimePerPuzzle = stats.totalTime / iterations;
  
  const perfStats = getPerformanceStats();
  stats.cacheHits = perfStats.cacheHits;
  stats.cacheMisses = perfStats.cacheMisses;
  
  return stats;
}

/**
 * Run comprehensive benchmark comparing both algorithms
 */
function runComprehensiveBenchmark(generatePuzzle, isPuzzleSolvable, points, iterations = 100) {
  console.log('Running Comprehensive Benchmark...');
  console.log(`Testing ${iterations} puzzle generations for each algorithm`);
  
  // Benchmark original algorithm
  const originalStats = benchmarkOriginalAlgorithm(generatePuzzle, isPuzzleSolvable, points, iterations);
  
  // Wait a bit to separate the tests
  setTimeout(() => {
    // Benchmark constraint-based algorithm
    const constraintStats = benchmarkConstraintBasedAlgorithm(isPuzzleSolvable, points, iterations);
    
    // Compare results
    const comparison = compareAlgorithms(originalStats, constraintStats);
    
    // Display results
    displayBenchmarkResults(originalStats, constraintStats, comparison);
  }, 100);
}

/**
 * Compare the performance of both algorithms
 */
function compareAlgorithms(originalStats, constraintStats) {
  return {
    timeImprovement: ((originalStats.averageTimePerPuzzle - constraintStats.averageTimePerPuzzle) / originalStats.averageTimePerPuzzle) * 100,
    attemptReduction: ((originalStats.averageAttempts - constraintStats.averageAttempts) / originalStats.averageAttempts) * 100,
    successRateImprovement: constraintStats.successRate - originalStats.successRate,
    efficiencyGain: (originalStats.totalAttempts / constraintStats.totalAttempts)
  };
}

/**
 * Display benchmark results
 */
function displayBenchmarkResults(originalStats, constraintStats, comparison) {
  console.log('\n=== BENCHMARK RESULTS ===\n');
  
  console.log('Original Random Algorithm:');
  console.log(`  Total Time: ${originalStats.totalTime.toFixed(2)}ms`);
  console.log(`  Average Time per Puzzle: ${originalStats.averageTimePerPuzzle.toFixed(2)}ms`);
  console.log(`  Average Attempts: ${originalStats.averageAttempts.toFixed(2)}`);
  console.log(`  Success Rate: ${originalStats.successRate.toFixed(1)}%`);
  console.log(`  Total Attempts: ${originalStats.totalAttempts}`);
  
  console.log('\nConstraint-Based Algorithm:');
  console.log(`  Total Time: ${constraintStats.totalTime.toFixed(2)}ms`);
  console.log(`  Average Time per Puzzle: ${constraintStats.averageTimePerPuzzle.toFixed(2)}ms`);
  console.log(`  Average Attempts: ${constraintStats.averageAttempts.toFixed(2)}`);
  console.log(`  Success Rate: ${constraintStats.successRate.toFixed(1)}%`);
  console.log(`  Cache Hits: ${constraintStats.cacheHits}`);
  console.log(`  Cache Misses: ${constraintStats.cacheMisses}`);
  
  console.log('\nPerformance Comparison:');
  console.log(`  Time Improvement: ${comparison.timeImprovement > 0 ? '+' : ''}${comparison.timeImprovement.toFixed(1)}%`);
  console.log(`  Attempt Reduction: ${comparison.attemptReduction.toFixed(1)}%`);
  console.log(`  Success Rate Improvement: ${comparison.successRateImprovement > 0 ? '+' : ''}${comparison.successRateImprovement.toFixed(1)}%`);
  console.log(`  Efficiency Gain: ${comparison.efficiencyGain.toFixed(2)}x`);
  
  // Determine overall winner
  const winner = determineWinner(comparison);
  console.log(`\n🏆 Overall Winner: ${winner}`);
}

/**
 * Determine which algorithm performed better
 */
function determineWinner(comparison) {
  let score = 0;
  
  if (comparison.timeImprovement > 0) score += 2;
  if (comparison.attemptReduction > 0) score += 3;
  if (comparison.successRateImprovement > 0) score += 2;
  if (comparison.efficiencyGain > 1) score += 1;
  
  return score >= 4 ? 'Constraint-Based Algorithm' : 
         score >= 2 ? 'Mixed Results (Constraint-Based has advantages)' : 
         'Original Algorithm';
}

/**
 * Test puzzle quality metrics
 */
function testPuzzleQuality(generatePuzzle, isPuzzleSolvable, points, iterations = 50) {
  console.log('\n=== PUZZLE QUALITY ANALYSIS ===\n');
  
  const originalQuality = analyzePuzzleQuality('Original', (minLit, maxLit) => {
    let attempts = 1;
    let puzzle = generatePuzzle(minLit, maxLit);
    let solvable = isPuzzleSolvable(puzzle, points);
    
    while (!solvable && attempts < 100) {
      puzzle = generatePuzzle(minLit, maxLit);
      solvable = isPuzzleSolvable(puzzle, points);
      attempts++;
    }
    
    return { puzzle, solvable, attempts };
  }, iterations);
  
  const constraintQuality = analyzePuzzleQuality('Constraint-Based', (minLit, maxLit) => {
    const puzzle = generateConstraintBasedPuzzle(minLit, maxLit, 'medium');
    return { puzzle, solvable: true, attempts: 1 };
  }, iterations);
  
  console.log('Quality Comparison:');
  console.log(`  Variety Score - Original: ${originalQuality.varietyScore.toFixed(2)}, Constraint-Based: ${constraintQuality.varietyScore.toFixed(2)}`);
  console.log(`  Complexity Score - Original: ${originalQuality.complexityScore.toFixed(2)}, Constraint-Based: ${constraintQuality.complexityScore.toFixed(2)}`);
}

/**
 * Analyze puzzle quality metrics
 */
function analyzePuzzleQuality(algorithmName, generateFunc, iterations) {
  const puzzles = [];
  
  for (let i = 0; i < iterations; i++) {
    const result = generateFunc(3, 6);
    if (result.solvable) {
      puzzles.push(result.puzzle);
    }
  }
  
  // Calculate variety score (how different the puzzles are)
  let varietyScore = 0;
  for (let i = 0; i < puzzles.length - 1; i++) {
    for (let j = i + 1; j < puzzles.length; j++) {
      varietyScore += calculatePuzzleDifference(puzzles[i], puzzles[j]);
    }
  }
  varietyScore = varietyScore / (puzzles.length * (puzzles.length - 1) / 2);
  
  // Calculate complexity score (average complexity of puzzles)
  let complexityScore = 0;
  puzzles.forEach(puzzle => {
    complexityScore += calculatePuzzleComplexity(puzzle);
  });
  complexityScore = complexityScore / puzzles.length;
  
  console.log(`${algorithmName} Quality Metrics:`);
  console.log(`  Puzzles Generated: ${puzzles.length}/${iterations}`);
  console.log(`  Variety Score: ${varietyScore.toFixed(2)}`);
  console.log(`  Complexity Score: ${complexityScore.toFixed(2)}`);
  
  return { varietyScore, complexityScore };
}

/**
 * Calculate how different two puzzles are
 */
function calculatePuzzleDifference(puzzle1, puzzle2) {
  let difference = 0;
  
  // Compare lit edges
  const edges1 = new Set(puzzle1.litEdges);
  const edges2 = new Set(puzzle2.litEdges);
  const edgeIntersection = [...edges1].filter(x => edges2.has(x)).length;
  const edgeUnion = new Set([...edges1, ...edges2]).size;
  difference += 1 - (edgeIntersection / edgeUnion);
  
  // Compare emitter configurations
  for (let i = 0; i < 3; i++) {
    const lasers1 = new Set(puzzle1.circles[i].lasers);
    const lasers2 = new Set(puzzle2.circles[i].lasers);
    const laserIntersection = [...lasers1].filter(x => lasers2.has(x)).length;
    const laserUnion = new Set([...lasers1, ...lasers2]).size;
    if (laserUnion > 0) {
      difference += (1 - (laserIntersection / laserUnion)) * 0.3;
    }
  }
  
  return difference / 2; // Normalize to 0-1
}

/**
 * Calculate puzzle complexity
 */
function calculatePuzzleComplexity(puzzle) {
  let complexity = 0;
  
  // More lit edges = higher complexity
  complexity += puzzle.litEdges.length * 0.2;
  
  // More emitters = higher complexity
  const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
  complexity += totalEmitters * 0.1;
  
  // More blockers = higher complexity
  const totalBlockers = puzzle.circles.reduce((sum, circle) => sum + circle.blockers.length, 0);
  complexity += totalBlockers * 0.15;
  
  return complexity;
}

export {
  runComprehensiveBenchmark,
  testPuzzleQuality,
  benchmarkOriginalAlgorithm,
  benchmarkConstraintBasedAlgorithm
};
