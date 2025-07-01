// Test import functionality
try {
  console.log('Testing imports...');
  
  // Test puzzle-generator imports
  const { 
    generateConstraintBasedPuzzle, 
    getPerformanceStats, 
    resetPerformanceStats,
    calculateSolutionSpace,
    clearCache,
    validateConstraintPuzzle
  } = await import('./puzzle-generator.js');
  
  console.log('✓ puzzle-generator.js imports successful');
  console.log('  - generateConstraintBasedPuzzle:', typeof generateConstraintBasedPuzzle);
  console.log('  - getPerformanceStats:', typeof getPerformanceStats);
  console.log('  - resetPerformanceStats:', typeof resetPerformanceStats);
  console.log('  - calculateSolutionSpace:', typeof calculateSolutionSpace);
  console.log('  - clearCache:', typeof clearCache);
  console.log('  - validateConstraintPuzzle:', typeof validateConstraintPuzzle);
  
  // Test calling getPerformanceStats
  const stats = getPerformanceStats();
  console.log('✓ getPerformanceStats() call successful:', stats);
  
} catch (error) {
  console.error('❌ Import test failed:', error);
}
