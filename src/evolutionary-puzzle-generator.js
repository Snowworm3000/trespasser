// Evolutionary Algorithm for Trespasser Puzzle Generation
// Implements genetic algorithm with multi-objective optimization

const SIDES = 12;
const MAX_GENERATIONS = 50;
const POPULATION_SIZE = 60;
const ELITE_RATIO = 0.2;
const CROSSOVER_RATE = 0.8;
const MUTATION_RATE = 0.3;

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
 * Evolutionary Puzzle Generator Class
 */
class EvolutionaryPuzzleGenerator {
  constructor() {
    this.generationCount = 0;
    this.bestFitness = 0;
    this.convergenceCounter = 0;
    this.fitnessHistory = [];
  }

  /**
   * Generate a puzzle using evolutionary algorithm
   */
  generatePuzzle(difficulty = 'medium', options = {}) {
    const startTime = getTime();
    console.log(`🧬 Starting evolutionary puzzle generation (${difficulty})...`);
    
    const config = this.getDifficultyConfig(difficulty);
    const population = this.initializePopulation(config);
    
    let bestIndividual = null;
    let generation = 0;
    
    while (generation < MAX_GENERATIONS && !this.shouldTerminate()) {
      // Evaluate fitness for entire population
      this.evaluatePopulation(population, config);
      
      // Find best individual
      population.sort((a, b) => b.fitness - a.fitness);
      const currentBest = population[0];
      
      if (!bestIndividual || currentBest.fitness > bestIndividual.fitness) {
        bestIndividual = { ...currentBest };
        this.convergenceCounter = 0;
      } else {
        this.convergenceCounter++;
      }
      
      // Log progress
      if (generation % 10 === 0) {
        console.log(`Generation ${generation}: Best fitness = ${currentBest.fitness.toFixed(3)}`);
      }
      
      // Create next generation
      const newPopulation = this.evolvePopulation(population, config);
      population.splice(0, population.length, ...newPopulation);
      
      generation++;
    }
    
    const totalTime = getTime() - startTime;
    console.log(`🎯 Evolution complete! Best fitness: ${bestIndividual.fitness.toFixed(3)}, Time: ${totalTime.toFixed(0)}ms`);
    
    return {
      puzzle: this.chromosomeToPuzzle(bestIndividual),
      metadata: {
        fitness: bestIndividual.fitness,
        generations: generation,
        timeMs: totalTime,
        fitnessBreakdown: bestIndividual.fitnessBreakdown
      }
    };
  }

  /**
   * Get difficulty configuration
   */
  getDifficultyConfig(difficulty) {
    const configs = {
      easy: {
        litEdgeRange: [3, 4],
        targetRotations: [2, 4],
        emitterRange: [4, 6],
        blockerRange: [1, 3],
        weights: { solvability: 0.5, difficulty: 0.2, distribution: 0.2, aesthetics: 0.1 }
      },
      medium: {
        litEdgeRange: [3, 5],
        targetRotations: [4, 7],
        emitterRange: [5, 8],
        blockerRange: [2, 4],
        weights: { solvability: 0.4, difficulty: 0.3, distribution: 0.2, aesthetics: 0.1 }
      },
      hard: {
        litEdgeRange: [4, 6],
        targetRotations: [6, 10],
        emitterRange: [6, 9],
        blockerRange: [3, 6],
        weights: { solvability: 0.4, difficulty: 0.3, distribution: 0.2, aesthetics: 0.1 }
      }
    };
    return configs[difficulty] || configs.medium;
  }

  /**
   * Initialize random population
   */
  initializePopulation(config) {
    const population = [];
    
    for (let i = 0; i < POPULATION_SIZE; i++) {
      const chromosome = this.createRandomChromosome(config);
      population.push(chromosome);
    }
    
    return population;
  }

  /**
   * Create a random valid chromosome
   */
  createRandomChromosome(config) {
    const numLitEdges = config.litEdgeRange[0] + 
      Math.floor(Math.random() * (config.litEdgeRange[1] - config.litEdgeRange[0] + 1));
    
    // Generate lit edges
    const litEdges = [];
    while (litEdges.length < numLitEdges) {
      const edge = Math.floor(Math.random() * 12);
      if (!litEdges.includes(edge)) {
        litEdges.push(edge);
      }
    }
    
    // Generate circles with emitters and blockers
    const circles = [];
    const totalEmitters = config.emitterRange[0] + 
      Math.floor(Math.random() * (config.emitterRange[1] - config.emitterRange[0] + 1));
    const totalBlockers = config.blockerRange[0] + 
      Math.floor(Math.random() * (config.blockerRange[1] - config.blockerRange[0] + 1));
    
    // Distribute emitters across circles (ensure each circle gets at least one)
    const emitterDistribution = this.distributeElements(totalEmitters, 3, 1);
    const blockerDistribution = this.distributeElements(totalBlockers, 3, 0);
    
    for (let i = 0; i < 3; i++) {
      const circle = {
        emitters: [],
        blockers: []
      };
      
      // Add emitters
      const numEmitters = emitterDistribution[i];
      while (circle.emitters.length < numEmitters) {
        const pos = Math.floor(Math.random() * 12);
        if (!circle.emitters.includes(pos) && !circle.blockers.includes(pos)) {
          circle.emitters.push(pos);
        }
      }
      
      // Add blockers
      const numBlockers = blockerDistribution[i];
      while (circle.blockers.length < numBlockers) {
        const pos = Math.floor(Math.random() * 12);
        if (!circle.emitters.includes(pos) && !circle.blockers.includes(pos)) {
          circle.blockers.push(pos);
        }
      }
      
      circles.push(circle);
    }
    
    return {
      litEdges: litEdges.sort((a, b) => a - b),
      circles: circles,
      fitness: 0,
      fitnessBreakdown: {}
    };
  }

  /**
   * Distribute elements across containers with minimum constraints
   */
  distributeElements(total, containers, minPerContainer) {
    const distribution = new Array(containers).fill(minPerContainer);
    let remaining = total - (containers * minPerContainer);
    
    while (remaining > 0) {
      const container = Math.floor(Math.random() * containers);
      distribution[container]++;
      remaining--;
    }
    
    return distribution;
  }

  /**
   * Evaluate fitness for entire population
   */
  evaluatePopulation(population, config) {
    for (const individual of population) {
      individual.fitness = this.calculateFitness(individual, config);
    }
  }

  /**
   * Calculate multi-objective fitness
   */
  calculateFitness(chromosome, config) {
    // Work directly with chromosome format instead of converting
    const solvability = this.calculateSolvabilityFromChromosome(chromosome);
    const difficulty = this.calculateDifficultyFromChromosome(chromosome, config);
    const distribution = this.calculateDistributionFitness(chromosome);
    const aesthetics = this.calculateAestheticsFitness(chromosome);
    
    // Store breakdown for debugging
    chromosome.fitnessBreakdown = {
      solvability,
      difficulty,
      distribution,
      aesthetics
    };
    
    // Weighted combination
    const weights = config.weights;
    return weights.solvability * solvability +
           weights.difficulty * difficulty +
           weights.distribution * distribution +
           weights.aesthetics * aesthetics;
  }

  /**
   * Calculate solvability fitness directly from chromosome
   */
  calculateSolvabilityFromChromosome(chromosome) {
    // Fast heuristic check first
    if (!this.heuristicSolvabilityCheckChromosome(chromosome)) {
      return 0.0;
    }
    
    // Full brute force check for promising candidates
    return this.bruteForceSolvabilityCheckChromosome(chromosome) ? 1.0 : 0.0;
  }

  /**
   * Fast heuristic solvability check for chromosome
   */
  heuristicSolvabilityCheckChromosome(chromosome) {
    // Check if each lit edge can potentially be hit by at least one emitter
    for (const edge of chromosome.litEdges) {
      let canBeHit = false;
      
      for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
        const circle = chromosome.circles[circleIdx];
        for (const emitterPos of circle.emitters) {
          if (this.canEmitterHitEdge(emitterPos, edge, circleIdx)) {
            canBeHit = true;
            break;
          }
        }
        if (canBeHit) break;
      }
      
      if (!canBeHit) return false;
    }
    
    return true;
  }

  /**
   * Brute force solvability check for chromosome
   */
  bruteForceSolvabilityCheckChromosome(chromosome) {
    // Try all rotation combinations (12^3 = 1728)
    for (let r1 = 0; r1 < 12; r1++) {
      for (let r2 = 0; r2 < 12; r2++) {
        for (let r3 = 0; r3 < 12; r3++) {
          if (this.isPuzzleSolvedWithRotationsChromosome(chromosome, [r1, r2, r3])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if chromosome is solved with given rotations
   */
  isPuzzleSolvedWithRotationsChromosome(chromosome, rotations) {
    const hitEdges = new Set();
    
    for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
      const circle = chromosome.circles[circleIdx];
      const rotation = rotations[circleIdx];
      
      for (const emitterPos of circle.emitters) {
        const rotatedPos = (emitterPos + rotation) % 12;
        const emitterAngle = rotatedPos * 30;
        const beamAngle = (emitterAngle + 180) % 360;
        
        // Check which edge this beam hits
        for (let edge = 0; edge < 12; edge++) {
          const edgeStart = edge * 30;
          const edgeEnd = (edge + 1) * 30;
          
          if (this.angleIntersectsEdge(beamAngle, edgeStart, edgeEnd)) {
            // Check if beam is blocked
            if (!this.isBeamBlockedChromosome(circleIdx, rotatedPos, rotations, chromosome)) {
              hitEdges.add(edge);
            }
            break; // A beam can only hit one edge
          }
        }
      }
    }
    
    // Check if all lit edges are hit
    return chromosome.litEdges.every(edge => hitEdges.has(edge));
  }

  /**
   * Check if beam from emitter is blocked (chromosome version)
   */
  isBeamBlockedChromosome(emitterCircle, emitterPos, rotations, chromosome) {
    const beamAngle = (emitterPos * 30 + 180) % 360;
    
    // Check blockers on outer circles (they can block inner beams)
    for (let circleIdx = emitterCircle + 1; circleIdx < 3; circleIdx++) {
      const circle = chromosome.circles[circleIdx];
      const rotation = rotations[circleIdx];
      
      for (const blockerPos of circle.blockers) {
        const rotatedBlockerPos = (blockerPos + rotation) % 12;
        const blockerAngle = rotatedBlockerPos * 30;
        
        // Check if blocker is in beam path (within ~15 degrees)
        const angleDiff = Math.abs(((beamAngle - blockerAngle + 180) % 360) - 180);
        if (angleDiff < 15) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Fast heuristic solvability check
   */
  heuristicSolvabilityCheck(puzzle) {
    // Check if each lit edge can potentially be hit by at least one emitter
    for (const edge of puzzle.litEdges) {
      let canBeHit = false;
      
      for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
        const circle = puzzle.circles[circleIdx];
        // Handle both chromosome format (emitters) and puzzle format (lasers)
        const emitters = circle.emitters || circle.lasers || [];
        for (const emitterPos of emitters) {
          if (this.canEmitterHitEdge(emitterPos, edge, circleIdx)) {
            canBeHit = true;
            break;
          }
        }
        if (canBeHit) break;
      }
      
      if (!canBeHit) return false;
    }
    
    return true;
  }

  /**
   * Check if emitter can potentially hit edge (ignoring blockers for now)
   */
  canEmitterHitEdge(emitterPos, edge, circleIdx) {
    // Calculate the angle range the edge occupies
    const edgeStartAngle = edge * 30;
    const edgeEndAngle = (edge + 1) * 30;
    const edgeCenterAngle = edge * 30 + 15;
    
    // For each possible rotation of the circle
    for (let rotation = 0; rotation < 12; rotation++) {
      const rotatedEmitterPos = (emitterPos + rotation) % 12;
      const emitterAngle = rotatedEmitterPos * 30;
      
      // The beam goes from emitter position toward center, then continues to edge
      // For inner circles, the beam angle is the emitter angle + 180
      const beamAngle = (emitterAngle + 180) % 360;
      
      // Check if beam angle intersects with edge
      // Need to handle wrap-around at 0/360 degrees
      const beamHitsEdge = this.angleIntersectsEdge(beamAngle, edgeStartAngle, edgeEndAngle);
      
      if (beamHitsEdge) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if beam angle intersects with edge angle range
   */
  angleIntersectsEdge(beamAngle, edgeStart, edgeEnd) {
    // Normalize angles to 0-360 range
    beamAngle = ((beamAngle % 360) + 360) % 360;
    edgeStart = ((edgeStart % 360) + 360) % 360;
    edgeEnd = ((edgeEnd % 360) + 360) % 360;
    
    // Handle edge case where edge spans 0 degrees
    if (edgeEnd < edgeStart) {
      return beamAngle >= edgeStart || beamAngle <= edgeEnd;
    } else {
      return beamAngle >= edgeStart && beamAngle <= edgeEnd;
    }
  }

  /**
   * Brute force solvability check
   */
  bruteForceSolvabilityCheck(puzzle) {
    // Try all rotation combinations (12^3 = 1728)
    for (let r1 = 0; r1 < 12; r1++) {
      for (let r2 = 0; r2 < 12; r2++) {
        for (let r3 = 0; r3 < 12; r3++) {
          if (this.isPuzzleSolvedWithRotations(puzzle, [r1, r2, r3])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if puzzle is solved with given rotations
   */
  isPuzzleSolvedWithRotations(puzzle, rotations) {
    const hitEdges = new Set();
    
    for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
      const circle = puzzle.circles[circleIdx];
      const rotation = rotations[circleIdx];
      
      // Handle both chromosome format (emitters) and puzzle format (lasers)
      const emitters = circle.emitters || circle.lasers || [];
      
      for (const emitterPos of emitters) {
        const rotatedPos = (emitterPos + rotation) % 12;
        const beamAngle = (rotatedPos * 30 + 180) % 360;
        
        // Check which edge this beam hits
        const targetEdge = Math.floor(((beamAngle - 15) % 360) / 30);
        
        // Check if beam is blocked
        if (!this.isBeamBlocked(circleIdx, rotatedPos, rotations, puzzle)) {
          hitEdges.add(targetEdge);
        }
      }
    }
    
    // Check if all lit edges are hit
    return puzzle.litEdges.every(edge => hitEdges.has(edge));
  }

  /**
   * Check if beam from emitter is blocked
   */
  isBeamBlocked(emitterCircle, emitterPos, rotations, puzzle) {
    const beamAngle = (emitterPos * 30 + 180) % 360;
    
    // Check blockers on outer circles (they can block inner beams)
    for (let circleIdx = emitterCircle + 1; circleIdx < 3; circleIdx++) {
      const circle = puzzle.circles[circleIdx];
      const rotation = rotations[circleIdx];
      
      // Handle both chromosome format (blockers) and puzzle format (blockers)
      const blockers = circle.blockers || [];
      
      for (const blockerPos of blockers) {
        const rotatedBlockerPos = (blockerPos + rotation) % 12;
        const blockerAngle = rotatedBlockerPos * 30;
        
        // Check if blocker is in beam path (within ~15 degrees)
        const angleDiff = Math.abs(((beamAngle - blockerAngle + 180) % 360) - 180);
        if (angleDiff < 15) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate difficulty fitness from chromosome
   */
  calculateDifficultyFromChromosome(chromosome, config) {
    const estimatedRotations = this.estimateRequiredRotationsChromosome(chromosome);
    const targetRange = config.targetRotations;
    
    if (estimatedRotations >= targetRange[0] && estimatedRotations <= targetRange[1]) {
      return 1.0;
    } else {
      // Gaussian falloff from target range
      const center = (targetRange[0] + targetRange[1]) / 2;
      const distance = Math.abs(estimatedRotations - center);
      return Math.exp(-distance * distance / (2 * 2 * 2)); // sigma = 2
    }
  }

  /**
   * Estimate required rotations for chromosome
   */
  estimateRequiredRotationsChromosome(chromosome) {
    // Simplified estimation based on spread of lit edges
    let totalRotations = 0;
    
    for (const edge of chromosome.litEdges) {
      let minRotations = Infinity;
      
      for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
        const circle = chromosome.circles[circleIdx];
        for (const emitterPos of circle.emitters) {
          const rotationsNeeded = this.calculateRotationsToHitEdge(emitterPos, edge);
          minRotations = Math.min(minRotations, rotationsNeeded);
        }
      }
      
      totalRotations += minRotations === Infinity ? 3 : minRotations;
    }
    
    return totalRotations;
  }

  /**
   * Calculate rotations needed for emitter to hit edge
   */
  calculateRotationsToHitEdge(emitterPos, edge) {
    const edgeAngle = edge * 30 + 15;
    const currentBeamAngle = (emitterPos * 30 + 180) % 360;
    
    // Find minimum rotations needed
    let minRotations = Infinity;
    for (let rotation = 0; rotation < 12; rotation++) {
      const newBeamAngle = (currentBeamAngle + rotation * 30) % 360;
      const angleDiff = Math.abs(((newBeamAngle - edgeAngle + 180) % 360) - 180);
      if (angleDiff < 15) {
        minRotations = Math.min(minRotations, rotation);
      }
    }
    
    return minRotations;
  }

  /**
   * Calculate distribution fitness (how well emitters are spread across circles)
   */
  calculateDistributionFitness(chromosome) {
    const emitterCounts = chromosome.circles.map(circle => circle.emitters.length);
    const totalEmitters = emitterCounts.reduce((sum, count) => sum + count, 0);
    
    if (totalEmitters === 0) return 0;
    
    // Penalty for empty circles
    const emptyCircles = emitterCounts.filter(count => count === 0).length;
    const emptyPenalty = emptyCircles * 0.3;
    
    // Calculate distribution evenness
    const idealDistribution = totalEmitters / 3;
    const variance = emitterCounts.reduce((sum, count) => 
      sum + Math.pow(count - idealDistribution, 2), 0) / 3;
    const evenness = Math.exp(-variance / (totalEmitters * 0.5));
    
    return Math.max(0, evenness - emptyPenalty);
  }

  /**
   * Calculate aesthetics fitness
   */
  calculateAestheticsFitness(chromosome) {
    const symmetryScore = this.calculateSymmetryScore(chromosome);
    const balanceScore = this.calculateBalanceScore(chromosome);
    
    return (symmetryScore + balanceScore) / 2;
  }

  /**
   * Calculate symmetry score
   */
  calculateSymmetryScore(chromosome) {
    // Check for rotational symmetry in lit edges
    let bestSymmetryScore = 0;
    
    for (const fold of [2, 3, 4, 6]) {
      let symmetryScore = 0;
      const angleStep = 12 / fold;
      
      for (const edge of chromosome.litEdges) {
        let hasSymmetricPartner = false;
        for (let i = 1; i < fold; i++) {
          const symmetricEdge = (edge + i * angleStep) % 12;
          if (chromosome.litEdges.includes(symmetricEdge)) {
            hasSymmetricPartner = true;
            break;
          }
        }
        if (hasSymmetricPartner) symmetryScore++;
      }
      
      symmetryScore /= chromosome.litEdges.length;
      bestSymmetryScore = Math.max(bestSymmetryScore, symmetryScore);
    }
    
    return bestSymmetryScore;
  }

  /**
   * Calculate balance score
   */
  calculateBalanceScore(chromosome) {
    // Simple balance metric based on element distribution
    const totalElements = chromosome.circles.reduce((sum, circle) => 
      sum + circle.emitters.length + circle.blockers.length, 0);
    
    if (totalElements === 0) return 0;
    
    // Prefer more balanced distributions
    const circleCounts = chromosome.circles.map(circle => 
      circle.emitters.length + circle.blockers.length);
    const maxCount = Math.max(...circleCounts);
    const minCount = Math.min(...circleCounts);
    
    return 1 - (maxCount - minCount) / totalElements;
  }

  /**
   * Evolve population to create next generation
   */
  evolvePopulation(population, config) {
    const newPopulation = [];
    const eliteCount = Math.floor(POPULATION_SIZE * ELITE_RATIO);
    
    // Preserve elite individuals
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...population[i] });
    }
    
    // Generate offspring
    while (newPopulation.length < POPULATION_SIZE) {
      const parent1 = this.tournamentSelection(population, 3);
      const parent2 = this.tournamentSelection(population, 3);
      
      let offspring;
      if (Math.random() < CROSSOVER_RATE) {
        offspring = this.crossover(parent1, parent2, config);
      } else {
        offspring = { ...parent1 };
      }
      
      if (Math.random() < MUTATION_RATE) {
        this.mutate(offspring, config);
      }
      
      this.repairChromosome(offspring, config);
      newPopulation.push(offspring);
    }
    
    return newPopulation;
  }

  /**
   * Tournament selection
   */
  tournamentSelection(population, tournamentSize) {
    let best = null;
    
    for (let i = 0; i < tournamentSize; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best;
  }

  /**
   * Crossover two parents
   */
  crossover(parent1, parent2, config) {
    const offspring = {
      litEdges: [],
      circles: [],
      fitness: 0,
      fitnessBreakdown: {}
    };
    
    // Crossover lit edges (blend with size constraints)
    const allEdges = [...new Set([...parent1.litEdges, ...parent2.litEdges])];
    const targetSize = config.litEdgeRange[0] + 
      Math.floor(Math.random() * (config.litEdgeRange[1] - config.litEdgeRange[0] + 1));
    
    offspring.litEdges = allEdges.slice(0, targetSize).sort((a, b) => a - b);
    
    // Crossover circles (inherit each circle from random parent)
    for (let i = 0; i < 3; i++) {
      const sourceParent = Math.random() < 0.5 ? parent1 : parent2;
      offspring.circles.push({
        emitters: [...sourceParent.circles[i].emitters],
        blockers: [...sourceParent.circles[i].blockers]
      });
    }
    
    return offspring;
  }

  /**
   * Mutate a chromosome
   */
  mutate(chromosome, config) {
    // Lit edge mutation
    if (Math.random() < 0.1) {
      if (Math.random() < 0.5 && chromosome.litEdges.length > config.litEdgeRange[0]) {
        // Remove edge
        const index = Math.floor(Math.random() * chromosome.litEdges.length);
        chromosome.litEdges.splice(index, 1);
      } else if (chromosome.litEdges.length < config.litEdgeRange[1]) {
        // Add edge
        let newEdge;
        do {
          newEdge = Math.floor(Math.random() * 12);
        } while (chromosome.litEdges.includes(newEdge));
        chromosome.litEdges.push(newEdge);
        chromosome.litEdges.sort((a, b) => a - b);
      }
    }
    
    // Circle mutations
    for (let circleIdx = 0; circleIdx < 3; circleIdx++) {
      const circle = chromosome.circles[circleIdx];
      
      // Emitter mutations
      if (Math.random() < 0.15) {
        if (Math.random() < 0.5 && circle.emitters.length > 0) {
          // Move emitter
          const index = Math.floor(Math.random() * circle.emitters.length);
          let newPos;
          do {
            newPos = Math.floor(Math.random() * 12);
          } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
          circle.emitters[index] = newPos;
        } else {
          // Add/remove emitter
          if (Math.random() < 0.5 && circle.emitters.length > 0) {
            // Remove
            const index = Math.floor(Math.random() * circle.emitters.length);
            circle.emitters.splice(index, 1);
          } else {
            // Add
            let newPos;
            do {
              newPos = Math.floor(Math.random() * 12);
            } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
            circle.emitters.push(newPos);
          }
        }
      }
      
      // Blocker mutations
      if (Math.random() < 0.1) {
        if (Math.random() < 0.5 && circle.blockers.length > 0) {
          // Move blocker
          const index = Math.floor(Math.random() * circle.blockers.length);
          let newPos;
          do {
            newPos = Math.floor(Math.random() * 12);
          } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
          circle.blockers[index] = newPos;
        } else {
          // Add/remove blocker
          if (Math.random() < 0.5 && circle.blockers.length > 0) {
            // Remove
            const index = Math.floor(Math.random() * circle.blockers.length);
            circle.blockers.splice(index, 1);
          } else {
            // Add
            let newPos;
            do {
              newPos = Math.floor(Math.random() * 12);
            } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
            circle.blockers.push(newPos);
          }
        }
      }
    }
  }

  /**
   * Repair chromosome to ensure validity
   */
  repairChromosome(chromosome, config) {
    // Ensure lit edges are within range
    while (chromosome.litEdges.length < config.litEdgeRange[0]) {
      let newEdge;
      do {
        newEdge = Math.floor(Math.random() * 12);
      } while (chromosome.litEdges.includes(newEdge));
      chromosome.litEdges.push(newEdge);
    }
    
    while (chromosome.litEdges.length > config.litEdgeRange[1]) {
      const index = Math.floor(Math.random() * chromosome.litEdges.length);
      chromosome.litEdges.splice(index, 1);
    }
    
    chromosome.litEdges.sort((a, b) => a - b);
    
    // Ensure each circle has at least one emitter
    for (const circle of chromosome.circles) {
      if (circle.emitters.length === 0) {
        let newPos;
        do {
          newPos = Math.floor(Math.random() * 12);
        } while (circle.blockers.includes(newPos));
        circle.emitters.push(newPos);
      }
      
      // Remove overlaps
      circle.blockers = circle.blockers.filter(pos => !circle.emitters.includes(pos));
    }
  }

  /**
   * Convert chromosome to puzzle format
   */
  chromosomeToPuzzle(chromosome) {
    return {
      litEdges: [...chromosome.litEdges],
      circles: chromosome.circles.map(circle => ({
        lasers: [...circle.emitters],
        blockers: [...circle.blockers]
      }))
    };
  }

  /**
   * Check termination conditions
   */
  shouldTerminate() {
    return this.convergenceCounter > 10; // Stop if no improvement for 10 generations
  }
}

// Export the generator
const evolutionaryGenerator = new EvolutionaryPuzzleGenerator();

export {
  evolutionaryGenerator,
  EvolutionaryPuzzleGenerator
};
