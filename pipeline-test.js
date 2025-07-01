// Test the complete pipeline: evolutionary algorithm -> puzzle format -> UI compatibility
console.log('🧪 Testing complete evolutionary algorithm pipeline...');

// Simulate the pipeline that happens in the app
import { simplifiedEvolutionaryGenerator } from './src/simplified-evolutionary-generator.js';

try {
  console.log('Step 1: Generate evolutionary puzzle');
  const result = simplifiedEvolutionaryGenerator.generatePuzzle('medium');
  console.log('✅ Generated puzzle:', result.puzzle);
  
  console.log('\nStep 2: Verify UI compatibility');
  const circles = result.puzzle.circles;
  
  // Check that all expected properties are present
  circles.forEach((circle, index) => {
    console.log(`Circle ${index}:`, circle);
    
    if (!circle.radius) {
      throw new Error(`Circle ${index} missing radius property`);
    }
    
    if (!Array.isArray(circle.lasers)) {
      throw new Error(`Circle ${index} lasers is not an array`);
    }
    
    if (!Array.isArray(circle.blockers)) {
      throw new Error(`Circle ${index} blockers is not an array`);
    }
    
    // Check angle values are reasonable
    [...circle.lasers, ...circle.blockers].forEach(angle => {
      if (typeof angle !== 'number' || angle < 0 || angle >= 360) {
        throw new Error(`Invalid angle: ${angle} in circle ${index}`);
      }
    });
    
    console.log(`✅ Circle ${index} structure is valid`);
  });
  
  console.log('\nStep 3: Test rendering compatibility');
  // Simulate what the UI does when rendering
  const SIDES = 12;
  const CENTER = 150;
  
  circles.forEach((circle, idx) => {
    console.log(`Testing circle ${idx} rendering:`);
    
    // Test laser rendering
    circle.lasers.forEach((angle, i) => {
      const rotated = angle + 0; // No rotation for test
      const rad = (rotated * Math.PI) / 180;
      const ex = CENTER + circle.radius * Math.cos(rad);
      const ey = CENTER + circle.radius * Math.sin(rad);
      
      if (isNaN(ex) || isNaN(ey)) {
        throw new Error(`Invalid coordinates for laser ${i} in circle ${idx}`);
      }
      
      console.log(`  Laser ${i}: angle=${angle}°, pos=(${ex.toFixed(1)}, ${ey.toFixed(1)})`);
    });
    
    // Test blocker rendering
    circle.blockers.forEach((angle, i) => {
      const rotated = angle + 0; // No rotation for test
      const rad = (rotated * Math.PI) / 180;
      const bx = CENTER + circle.radius * Math.cos(rad);
      const by = CENTER + circle.radius * Math.sin(rad);
      
      if (isNaN(bx) || isNaN(by)) {
        throw new Error(`Invalid coordinates for blocker ${i} in circle ${idx}`);
      }
      
      console.log(`  Blocker ${i}: angle=${angle}°, pos=(${bx.toFixed(1)}, ${by.toFixed(1)})`);
    });
  });
  
  console.log('\n🎉 Complete pipeline test successful!');
  console.log('✅ Evolutionary algorithm produces UI-compatible puzzles');
  
} catch (error) {
  console.error('❌ Pipeline test failed:', error);
  process.exit(1);
}
