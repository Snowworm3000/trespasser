# Evolutionary Algorithm Design for Trespasser Puzzle Generation

## Problem Analysis

### Issues with Current Constraint-Based Algorithm
1. **Poor Emitter Distribution**: Heavily biases toward innermost circle
2. **Low Solvability**: Most generated puzzles are unsolvable
3. **Lack of Variety**: Similar patterns generated repeatedly
4. **Missing Challenge**: No multi-circle interaction required

### Requirements for Better Algorithm
1. **High Solvability Rate**: >90% of generated puzzles should be solvable
2. **Varied Emitter Distribution**: All three circles should be utilized
3. **Appropriate Difficulty**: Require rotations on multiple circles
4. **Pattern Diversity**: Generate visually and mechanically diverse puzzles
5. **Performance**: Generate puzzles in reasonable time (<1 second)

## Evolutionary Algorithm Design

### Core Concept
Use genetic algorithms to evolve puzzle configurations that optimize multiple objectives:
- **Solvability**: Puzzle must have at least one solution
- **Difficulty**: Require strategic thinking and multiple circle rotations
- **Distribution**: Emitters spread across all circles
- **Aesthetics**: Visually pleasing patterns

### Representation (Genome)
Each puzzle is represented as a chromosome with the following structure:

```javascript
const chromosome = {
  // Lit edges (3-6 edges)
  litEdges: [0, 3, 7, 10], // Array of edge indices
  
  // Circle configurations (3 circles)
  circles: [
    {
      emitters: [2, 8],      // Emitter positions (0-11)
      blockers: [5]          // Blocker positions (0-11)
    },
    {
      emitters: [1, 9],
      blockers: [4, 11]
    },
    {
      emitters: [6],
      blockers: [0, 3]
    }
  ]
}
```

### Population Management
- **Population Size**: 50-100 individuals
- **Elite Preservation**: Keep top 20% of population
- **Generation Limit**: Maximum 100 generations
- **Convergence**: Stop early if best fitness plateaus

### Fitness Function (Multi-Objective)

The fitness function combines multiple weighted objectives:

```javascript
fitness = w1 * solvability + 
          w2 * difficulty + 
          w3 * distribution + 
          w4 * aesthetics + 
          w5 * variety
```

#### 1. Solvability (Weight: 0.4)
- **Score 1.0**: Puzzle has valid solution
- **Score 0.0**: Puzzle is unsolvable
- **Implementation**: Fast heuristic solvability check + occasional full validation

#### 2. Difficulty (Weight: 0.25)
- **Easy Target**: 2-4 total rotations needed
- **Medium Target**: 4-7 total rotations needed  
- **Hard Target**: 7-12 total rotations needed
- **Score**: Gaussian function around target range

#### 3. Distribution (Weight: 0.2)
- **Measure**: How evenly emitters are distributed across circles
- **Penalty**: Heavy penalty if any circle has 0 emitters
- **Bonus**: Reward for using all three circles effectively

#### 4. Aesthetics (Weight: 0.1)
- **Symmetry**: Partial credit for rotational symmetry
- **Balance**: Avoid clustering all elements in one area
- **Edge Patterns**: Prefer some structure over pure randomness

#### 5. Variety (Weight: 0.05)
- **Uniqueness**: Compare against recently generated puzzles
- **Pattern Diversity**: Avoid repeating common configurations

### Genetic Operators

#### Selection
- **Tournament Selection**: Select parents via tournaments of size 3-5
- **Elitism**: Always preserve best 20% of population
- **Diversity Pressure**: Occasionally select diverse individuals over locally optimal ones

#### Crossover (Probability: 0.8)
**Multi-point Crossover with Repair**:
1. **Lit Edges**: Blend parent edge sets, ensure 3-6 edges
2. **Circle-by-Circle**: Inherit each circle from random parent
3. **Repair**: Fix invalid configurations (overlapping emitters/blockers)

```javascript
// Example crossover
parent1 = { litEdges: [1,4,7], circles: [c1a, c2a, c3a] }
parent2 = { litEdges: [2,5,8,11], circles: [c1b, c2b, c3b] }

// Possible offspring
child = { 
  litEdges: [1,4,5,8],  // Blend with size constraints
  circles: [c1a, c2b, c3a] // Random selection per circle
}
```

#### Mutation (Probability: 0.3)

**Multi-level Mutation**:
1. **Lit Edge Mutation** (10% chance):
   - Add/remove random edge
   - Shift edge position by ±1

2. **Emitter Mutation** (15% chance):
   - Move emitter to adjacent position
   - Add/remove emitter (within constraints)
   - Transfer emitter between circles

3. **Blocker Mutation** (10% chance):
   - Move blocker to adjacent position
   - Add/remove blocker
   - Transfer blocker between circles

4. **Structural Mutation** (5% chance):
   - Major reorganization of circle configuration
   - Rebalance emitter distribution

### Constraint Handling

#### Hard Constraints (Must be satisfied)
1. **Valid Ranges**: 3-6 lit edges, reasonable emitter/blocker counts
2. **No Overlaps**: Emitters and blockers cannot occupy same position
3. **Minimum Coverage**: At least as many emitters as lit edges
4. **Circle Distribution**: Each circle must have at least some elements

#### Soft Constraints (Optimized via fitness)
1. **Solvability**: Strong preference for solvable puzzles
2. **Difficulty Balance**: Match target difficulty level
3. **Multi-circle Usage**: Encourage using all circles

### Algorithm Flow

```
1. Initialize Population
   - Generate random valid chromosomes
   - Ensure diversity in initial population
   - Repair any constraint violations

2. For each generation:
   a. Evaluate Fitness
      - Calculate multi-objective fitness for each individual
      - Cache expensive solvability checks when possible
      
   b. Selection
      - Tournament selection for parents
      - Preserve elite individuals
      
   c. Reproduction
      - Crossover selected parents
      - Apply mutations to offspring
      - Repair constraint violations
      
   d. Replacement
      - Combine parents, elite, and offspring
      - Select best individuals for next generation
      
   e. Termination Check
      - Stop if maximum generations reached
      - Stop if fitness convergence detected
      - Return best individual found

3. Post-processing
   - Validate final puzzle thoroughly
   - Apply minor aesthetic improvements
   - Return optimized puzzle
```

### Performance Optimizations

#### Fast Fitness Evaluation
1. **Heuristic Solvability**: Quick geometric checks before expensive validation
2. **Cached Calculations**: Store expensive computations (solution space analysis)
3. **Incremental Updates**: Calculate fitness changes from mutations efficiently
4. **Parallel Evaluation**: Evaluate population fitness in parallel when possible

#### Smart Population Management
1. **Seeded Initialization**: Start with some known good patterns
2. **Diversity Maintenance**: Prevent premature convergence
3. **Adaptive Parameters**: Adjust mutation/crossover rates based on progress
4. **Memory Management**: Efficient chromosome representation

### Implementation Strategy

#### Phase 1: Core Algorithm (Focus)
1. Create clean puzzle representation
2. Implement basic genetic operators
3. Build multi-objective fitness function
4. Add constraint handling and repair

#### Phase 2: Optimization
1. Add performance optimizations
2. Implement advanced selection strategies
3. Fine-tune algorithm parameters
4. Add diversity preservation mechanisms

#### Phase 3: Integration
1. Create simple API interface
2. Add difficulty level support
3. Integrate with existing UI
4. Add comprehensive testing

### Expected Outcomes

#### Quality Improvements
- **Solvability**: 90-95% of generated puzzles should be solvable
- **Distribution**: Emitters spread across all circles in 80%+ of puzzles
- **Variety**: Significantly more diverse puzzle patterns
- **Difficulty**: Better match between target and actual difficulty

#### Performance Targets
- **Generation Time**: <2 seconds for medium difficulty
- **Success Rate**: <5 generation attempts needed for good puzzle
- **Scalability**: Algorithm should work for different puzzle sizes/constraints

### API Design

```javascript
// Simple, focused API
const EvolutionaryPuzzleGenerator = {
  // Generate single puzzle
  generatePuzzle(difficulty = 'medium', options = {}) {
    // Returns: { puzzle, metadata }
  },
  
  // Generate multiple candidates
  generateCandidates(count = 3, difficulty = 'medium') {
    // Returns: [{ puzzle, fitness, metadata }, ...]
  },
  
  // Evolve specific puzzle
  improvePuzzle(basePuzzle, targetFitness = 0.8) {
    // Returns: { improvedPuzzle, improvement }
  }
}
```

This evolutionary approach should solve the core issues with the constraint-based algorithm by:
1. **Optimizing for multiple objectives simultaneously**
2. **Naturally encouraging emitter distribution through fitness**
3. **Generating diverse solutions through population-based search**
4. **Ensuring high solvability through direct optimization**
5. **Providing fine-grained difficulty control**
