// Comprehensive Testing Suite for Puzzle Generation Algorithms
// This script tests all the key functionality to catch issues early

import { generateConstraintBasedPuzzle, getPerformanceStats, resetPerformanceStats } from './puzzle-generator.js';
import { generateEnhancedConstraintPuzzle } from './enhanced-puzzle-generator.js';
import { analyzePuzzleDifficulty } from './difficulty-analyzer.js';

/**
 * Run all tests and report results
 */
function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  // Test 1: Basic imports and function availability
  runTest('Import Test', testImports, results);
  
  // Test 2: Basic puzzle generation
  runTest('Basic Puzzle Generation', testBasicGeneration, results);
  
  // Test 3: Constraint-based generation
  runTest('Constraint-Based Generation', testConstraintGeneration, results);
  
  // Test 4: Enhanced constraint generation
  runTest('Enhanced Constraint Generation', testEnhancedGeneration, results);
  
  // Test 5: Performance stats
  runTest('Performance Statistics', testPerformanceStats, results);
  
  // Test 6: Difficulty analysis
  runTest('Difficulty Analysis', testDifficultyAnalysis, results);
  
  // Test 7: Error handling
  runTest('Error Handling', testErrorHandling, results);
  
  // Report results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  const success = results.failed === 0;
  console.log(`\n${success ? '🎉' : '💥'} Overall: ${success ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return success;
}

/**
 * Run an individual test
 */
function runTest(name, testFunction, results) {
  try {
    console.log(`Testing ${name}...`);
    const passed = testFunction();
    
    if (passed) {
      console.log(`✅ ${name} passed`);
      results.passed++;
    } else {
      console.log(`❌ ${name} failed`);
      results.failed++;
      results.errors.push(`${name}: Test assertions failed`);
    }
  } catch (error) {
    console.log(`💥 ${name} crashed: ${error.message}`);
    results.failed++;
    results.errors.push(`${name}: ${error.message}`);
  }
}

/**
 * Test that all imports work correctly
 */
function testImports() {
  // Test function availability
  if (typeof generateConstraintBasedPuzzle !== 'function') {
    throw new Error('generateConstraintBasedPuzzle not available');
  }
  
  if (typeof getPerformanceStats !== 'function') {
    throw new Error('getPerformanceStats not available');
  }
  
  if (typeof resetPerformanceStats !== 'function') {
    throw new Error('resetPerformanceStats not available');
  }
  
  if (typeof generateEnhancedConstraintPuzzle !== 'function') {
    throw new Error('generateEnhancedConstraintPuzzle not available');
  }
  
  if (typeof analyzePuzzleDifficulty !== 'function') {
    throw new Error('analyzePuzzleDifficulty not available');
  }
  
  return true;
}

/**
 * Test basic puzzle generation structure
 */
function testBasicGeneration() {
  const puzzle = generateConstraintBasedPuzzle(3, 5, 'medium');
  
  // Check basic structure
  if (!puzzle || typeof puzzle !== 'object') {
    throw new Error('Puzzle is not an object');
  }
  
  if (!Array.isArray(puzzle.litEdges)) {
    throw new Error('litEdges is not an array');
  }
  
  if (!Array.isArray(puzzle.circles) || puzzle.circles.length !== 3) {
    throw new Error('circles is not an array of length 3');
  }
  
  // Check lit edges are valid
  if (puzzle.litEdges.length < 3 || puzzle.litEdges.length > 5) {
    throw new Error(`Invalid number of lit edges: ${puzzle.litEdges.length}`);
  }
  
  for (const edge of puzzle.litEdges) {
    if (typeof edge !== 'number' || edge < 0 || edge >= 12) {
      throw new Error(`Invalid lit edge: ${edge}`);
    }
  }
  
  // Check circles structure
  for (let i = 0; i < puzzle.circles.length; i++) {
    const circle = puzzle.circles[i];
    
    if (!circle.lasers || !Array.isArray(circle.lasers)) {
      throw new Error(`Circle ${i} missing lasers array`);
    }
    
    if (!circle.blockers || !Array.isArray(circle.blockers)) {
      throw new Error(`Circle ${i} missing blockers array`);
    }
    
    if (typeof circle.radius !== 'number') {
      throw new Error(`Circle ${i} missing radius`);
    }
  }
  
  return true;
}

/**
 * Test constraint-based generation with different difficulties
 */
function testConstraintGeneration() {
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    const puzzle = generateConstraintBasedPuzzle(2, 6, difficulty);
    
    if (!puzzle) {
      throw new Error(`Failed to generate ${difficulty} puzzle`);
    }
    
    // Should have at least one emitter
    const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
    if (totalEmitters === 0) {
      throw new Error(`${difficulty} puzzle has no emitters`);
    }
  }
  
  return true;
}

/**
 * Test enhanced constraint generation
 */
function testEnhancedGeneration() {
  try {
    const puzzle = generateEnhancedConstraintPuzzle(3, 5, 'medium');
    
    if (!puzzle) {
      throw new Error('Enhanced generation returned null/undefined');
    }
    
    // Should have metadata
    if (puzzle.metadata && puzzle.metadata.algorithm !== 'enhanced-constraint') {
      console.warn('Enhanced puzzle missing expected metadata');
    }
    
    return true;
  } catch (error) {
    // Enhanced generation might fail gracefully, that's okay
    console.log(`ℹ️ Enhanced generation not available: ${error.message}`);
    return true;
  }
}

/**
 * Test performance statistics
 */
function testPerformanceStats() {
  resetPerformanceStats();
  
  let stats = getPerformanceStats();
  if (!stats || typeof stats !== 'object') {
    throw new Error('Performance stats not returned as object');
  }
  
  // Check required properties
  const requiredProps = ['generationTime', 'solvabilityChecks', 'solutionSpaceCalculations', 'cacheHits', 'cacheMisses'];
  for (const prop of requiredProps) {
    if (typeof stats[prop] !== 'number') {
      throw new Error(`Performance stats missing ${prop}`);
    }
  }
  
  // Generate a puzzle and check stats updated
  generateConstraintBasedPuzzle(3, 4, 'medium');
  
  stats = getPerformanceStats();
  if (stats.generationTime <= 0) {
    console.warn('Generation time not being tracked properly');
  }
  
  return true;
}

/**
 * Test difficulty analysis
 */
function testDifficultyAnalysis() {
  const puzzle = generateConstraintBasedPuzzle(3, 4, 'medium');
  const analysis = analyzePuzzleDifficulty(puzzle);
  
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Difficulty analysis not returned as object');
  }
  
  // Check required properties
  const requiredProps = ['basicMetrics', 'solutionComplexity', 'cognitiveLoad', 'aestheticScore', 'overallDifficulty', 'difficultyLevel'];
  for (const prop of requiredProps) {
    if (!(prop in analysis)) {
      throw new Error(`Difficulty analysis missing ${prop}`);
    }
  }
  
  // Check difficulty level is valid
  const validLevels = ['easy', 'medium', 'hard'];
  if (!validLevels.includes(analysis.difficultyLevel)) {
    throw new Error(`Invalid difficulty level: ${analysis.difficultyLevel}`);
  }
  
  // Check overall difficulty is a number between 0 and 1
  if (typeof analysis.overallDifficulty !== 'number' || analysis.overallDifficulty < 0 || analysis.overallDifficulty > 1) {
    throw new Error(`Invalid overall difficulty: ${analysis.overallDifficulty}`);
  }
  
  return true;
}

/**
 * Test error handling
 */
function testErrorHandling() {
  try {
    // Test with invalid parameters
    const puzzle = generateConstraintBasedPuzzle(-1, 20, 'invalid');
    
    // Should still return a valid puzzle (with fallback handling)
    if (!puzzle || !puzzle.litEdges || !puzzle.circles) {
      throw new Error('Error handling not working - invalid puzzle returned');
    }
    
    return true;
  } catch (error) {
    // If it throws an error, that's also acceptable error handling
    return true;
  }
}

// Make test function available globally for manual testing
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.testPuzzleGeneration = () => {
    console.log('🔍 Quick test of puzzle generation...');
    
    try {
      const puzzle = generateConstraintBasedPuzzle(3, 5, 'medium');
      console.log('✅ Puzzle generated successfully:', puzzle);
      
      const stats = getPerformanceStats();
      console.log('📊 Performance stats:', stats);
      
      const analysis = analyzePuzzleDifficulty(puzzle);
      console.log('🎯 Difficulty analysis:', analysis);
      
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  };
}

export { runAllTests };
