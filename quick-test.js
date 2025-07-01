// Quick test of the optimized evolutionary algorithm
import { simplifiedEvolutionaryGenerator } from './src/simplified-evolutionary-generator.js';

console.log('🧪 Testing optimized evolutionary algorithm...');

async function testOptimized() {
  console.log('Testing 5 puzzles for speed and accuracy...\n');
  
  for (let i = 1; i <= 5; i++) {
    const startTime = Date.now();
    const result = simplifiedEvolutionaryGenerator.generatePuzzle('medium');
    const endTime = Date.now();
    
    console.log(`Test ${i}:`);
    console.log(`  ✅ Solvable: ${result.metadata.solvable}`);
    console.log(`  📊 Fitness: ${result.metadata.fitness.toFixed(3)}`);
    console.log(`  ⏱️  Total time: ${endTime - startTime}ms`);
    console.log(`  🧠 Generations: ${result.metadata.generations}`);
    console.log(`  📈 Lit edges: ${result.puzzle.litEdges.length}`);
    console.log('');
  }
}

testOptimized().catch(console.error);
