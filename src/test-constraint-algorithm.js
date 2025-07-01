// Simple test to verify the constraint-based algorithm
import { generateConstraintBasedPuzzle } from './puzzle-generator.js';

function testConstraintBasedAlgorithm() {
  console.log('Testing Constraint-Based Algorithm...');
  
  try {
    // Test basic generation
    const puzzle = generateConstraintBasedPuzzle(3, 5, 'medium');
    
    console.log('Generated puzzle:', puzzle);
    console.log('Lit edges:', puzzle.litEdges);
    console.log('Circles:', puzzle.circles);
    
    // Verify basic structure
    if (!puzzle.litEdges || !Array.isArray(puzzle.litEdges)) {
      throw new Error('Invalid lit edges');
    }
    
    if (!puzzle.circles || !Array.isArray(puzzle.circles) || puzzle.circles.length !== 3) {
      throw new Error('Invalid circles');
    }
    
    // Verify each circle has required properties
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
    
    console.log('✅ Basic structure test passed');
    
    // Verify puzzle has emitters
    const totalEmitters = puzzle.circles.reduce((sum, circle) => sum + circle.lasers.length, 0);
    if (totalEmitters === 0) {
      throw new Error('Puzzle has no emitters');
    }
    
    console.log(`✅ Puzzle has ${totalEmitters} emitters`);
    
    // Verify puzzle has reasonable number of lit edges
    if (puzzle.litEdges.length < 3 || puzzle.litEdges.length > 5) {
      throw new Error(`Unexpected number of lit edges: ${puzzle.litEdges.length}`);
    }
    
    console.log(`✅ Puzzle has ${puzzle.litEdges.length} lit edges`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run test if called directly
if (typeof window !== 'undefined') {
  window.testConstraintBasedAlgorithm = testConstraintBasedAlgorithm;
}

export { testConstraintBasedAlgorithm };
