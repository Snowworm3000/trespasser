// Simplified Evolutionary Algorithm focused on the core issues
// - High solvability rate
// - Good emitter distribution across circles
// - Appropriate difficulty levels

const SIDES = 12;
const CENTER = 150;
const SHAPE_ROTATION = -15;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

// Real physics constants and geometry
const points = Array.from({ length: SIDES }, (_, i) => {
  const angle = (i * 360) / SIDES + SHAPE_ROTATION;
  const rad = degToRad(angle);
  return [CENTER + 180 * Math.cos(rad), CENTER + 180 * Math.sin(rad)];
});

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
 * Simplified Evolutionary Puzzle Generator
 * Focus: Generate solvable puzzles with good distribution
 */
class SimplifiedEvolutionaryGenerator {
  constructor() {
    this.populationSize = 20; // Reduced from 30
    this.maxGenerations = 15; // Reduced from 25
    this.eliteRatio = 0.3;
    this.solvabilityCache = new Map(); // Cache solvability results
  }

  /**
   * Generate puzzle using simplified evolutionary approach
   */
  generatePuzzle(difficulty = 'medium') {
    const startTime = getTime();
    console.log(`🧬 Starting simplified evolutionary generation (${difficulty})...`);
    
    // Clear solvability cache for new puzzle generation
    this.solvabilityCache.clear();
    
    const config = this.getDifficultyConfig(difficulty);
    
    // Create initial population
    let population = this.createInitialPopulation(config);
    let bestFitness = 0;
    let generation = 0;
    
    while (generation < this.maxGenerations) {
      // Evaluate fitness
      this.evaluatePopulation(population);
      
      // Sort by fitness (best first)
      population.sort((a, b) => b.fitness - a.fitness);
      
      const currentBest = population[0];
      if (currentBest.fitness > bestFitness) {
        bestFitness = currentBest.fitness;
        if (generation % 5 === 0) {
          console.log(`Generation ${generation}: Best fitness = ${bestFitness.toFixed(3)}, Solvable: ${currentBest.solvable}`);
        }
      }
      
      // If we found a good solvable puzzle, we can stop early
      if (currentBest.solvable && currentBest.fitness > 0.7) {
        console.log(`🎯 Found excellent puzzle at generation ${generation}!`);
        break;
      }
      
      // Create next generation
      population = this.evolvePopulation(population, config);
      generation++;
    }
    
    population.sort((a, b) => b.fitness - a.fitness);
    const bestPuzzle = population[0];
    
    const totalTime = getTime() - startTime;
    console.log(`🎯 Evolution complete! Best fitness: ${bestPuzzle.fitness.toFixed(3)}, Time: ${totalTime.toFixed(0)}ms`);
    
    return {
      puzzle: this.chromosomeToPuzzle(bestPuzzle),
      metadata: {
        fitness: bestPuzzle.fitness,
        generations: generation,
        timeMs: totalTime,
        solvable: bestPuzzle.solvable,
        fitnessBreakdown: bestPuzzle.breakdown
      }
    };
  }

  /**
   * Get difficulty configuration
   */
  getDifficultyConfig(difficulty) {
    const configs = {
      easy: {
        litEdges: [3, 4],
        totalEmitters: [4, 6],
        totalBlockers: [1, 2]
      },
      medium: {
        litEdges: [3, 5],
        totalEmitters: [5, 7],
        totalBlockers: [2, 3]
      },
      hard: {
        litEdges: [4, 6],
        totalEmitters: [6, 8],
        totalBlockers: [3, 4]
      }
    };
    return configs[difficulty] || configs.medium;
  }

  /**
   * Create initial population with some smart seeding
   */
  createInitialPopulation(config) {
    const population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const chromosome = this.createRandomChromosome(config);
      population.push(chromosome);
    }
    
    return population;
  }

  /**
   * Create a random chromosome with forced distribution
   */
  createRandomChromosome(config) {
    // Generate lit edges
    const numLitEdges = config.litEdges[0] + 
      Math.floor(Math.random() * (config.litEdges[1] - config.litEdges[0] + 1));
    
    const litEdges = [];
    while (litEdges.length < numLitEdges) {
      const edge = Math.floor(Math.random() * 12);
      if (!litEdges.includes(edge)) {
        litEdges.push(edge);
      }
    }
    litEdges.sort((a, b) => a - b);
    
    // Generate emitters with forced distribution across circles
    const totalEmitters = config.totalEmitters[0] + 
      Math.floor(Math.random() * (config.totalEmitters[1] - config.totalEmitters[0] + 1));
    
    const totalBlockers = config.totalBlockers[0] + 
      Math.floor(Math.random() * (config.totalBlockers[1] - config.totalBlockers[0] + 1));
    
    // Force at least one emitter per circle, distribute the rest
    const emitterDistribution = [1, 1, 1]; // Start with 1 per circle
    let remaining = totalEmitters - 3;
    while (remaining > 0) {
      const circle = Math.floor(Math.random() * 3);
      emitterDistribution[circle]++;
      remaining--;
    }
    
    // Distribute blockers (can be 0)
    const blockerDistribution = [0, 0, 0];
    remaining = totalBlockers;
    while (remaining > 0) {
      const circle = Math.floor(Math.random() * 3);
      blockerDistribution[circle]++;
      remaining--;
    }
    
    // Create circles
    const circles = [];
    for (let i = 0; i < 3; i++) {
      const circle = { emitters: [], blockers: [] };
      
      // Add emitters
      while (circle.emitters.length < emitterDistribution[i]) {
        const pos = Math.floor(Math.random() * 12);
        if (!circle.emitters.includes(pos) && !circle.blockers.includes(pos)) {
          circle.emitters.push(pos);
        }
      }
      
      // Add blockers
      while (circle.blockers.length < blockerDistribution[i]) {
        const pos = Math.floor(Math.random() * 12);
        if (!circle.emitters.includes(pos) && !circle.blockers.includes(pos)) {
          circle.blockers.push(pos);
        }
      }
      
      circles.push(circle);
    }
    
    return {
      litEdges,
      circles,
      fitness: 0,
      solvable: false,
      breakdown: {}
    };
  }

  /**
   * Evaluate population fitness
   */
  evaluatePopulation(population) {
    for (const individual of population) {
      this.calculateFitness(individual);
    }
  }

  /**
   * Calculate fitness with focus on solvability and distribution
   */
  calculateFitness(chromosome) {
    // Check solvability (most important)
    const solvable = this.isChromosomeSolvable(chromosome);
    chromosome.solvable = solvable;
    
    // Calculate distribution score
    const distributionScore = this.calculateDistributionScore(chromosome);
    
    // Calculate variety score (avoid too many emitters in one place)
    const varietyScore = this.calculateVarietyScore(chromosome);
    
    // Calculate aesthetic score (pattern quality)
    const aestheticScore = this.calculateAestheticScore(chromosome);
    
    chromosome.breakdown = {
      solvable: solvable ? 1 : 0,
      distribution: distributionScore,
      variety: varietyScore,
      aesthetic: aestheticScore
    };
    
    // Heavily weight solvability
    if (solvable) {
      chromosome.fitness = 0.6 + 0.2 * distributionScore + 0.1 * varietyScore + 0.1 * aestheticScore;
    } else {
      // Even unsolvable puzzles get some credit for good structure
      chromosome.fitness = 0.3 * distributionScore + 0.1 * varietyScore + 0.1 * aestheticScore;
    }
  }

  /**
   * Real physics-based solvability check (adapted from App.jsx)
   * Now with caching for performance
   */
  isChromosomeSolvable(chromosome) {
    // Create a cache key from the chromosome
    const cacheKey = JSON.stringify({
      litEdges: chromosome.litEdges,
      circles: chromosome.circles
    });
    
    // Check cache first
    if (this.solvabilityCache.has(cacheKey)) {
      return this.solvabilityCache.get(cacheKey);
    }
    
    // Convert chromosome to puzzle format for testing
    const puzzle = this.chromosomeToPuzzle(chromosome);
    
    // Try all 12^3 = 1728 possible rotation combinations
    let solvable = false;
    for (let r0 = 0; r0 < SIDES && !solvable; ++r0) {
      for (let r1 = 0; r1 < SIDES && !solvable; ++r1) {
        for (let r2 = 0; r2 < SIDES && !solvable; ++r2) {
          const rotations = [r0 * 30, r1 * 30, r2 * 30];
          
          // Compute emitters and blockers for this rotation
          const emitters = puzzle.circles.flatMap((circle, idx) =>
            circle.lasers.map((angle, i) => {
              const rotated = angle + rotations[idx] + SHAPE_ROTATION;
              const rad = degToRad(rotated);
              return {
                idx,
                angle: rotated + 180, // Fire toward center
                x: CENTER + circle.radius * Math.cos(rad),
                y: CENTER + circle.radius * Math.sin(rad),
                radius: circle.radius,
                laserIdx: i,
              };
            })
          );
          
          const blockers = puzzle.circles.flatMap((circle, idx) =>
            circle.blockers.map((angle) => {
              const rotated = angle + rotations[idx] + SHAPE_ROTATION;
              const rad = degToRad(rotated);
              return {
                idx,
                angle: rotated,
                x: CENTER + circle.radius * Math.cos(rad),
                y: CENTER + circle.radius * Math.sin(rad),
                radius: circle.radius,
              };
            })
          );
          
          // Helper: get dodecagon edge lines
          const edgeLines = points.map((pt, i) => {
            const next = points[(i + 1) % SIDES];
            return { i, x1: pt[0], y1: pt[1], x2: next[0], y2: next[1] };
          });
          
          // For each lit edge, can it be hit by any emitter?
          let allLit = true;
          for (const litIdx of puzzle.litEdges) {
            let hit = false;
            for (const emitter of emitters) {
              // Project a ray from emitter.x/y at emitter.angle
              const rad = degToRad(emitter.angle);
              const dx = Math.cos(rad);
              const dy = Math.sin(rad);
              
              // Find intersection with blockers and other emitters
              let minT = Infinity;
              let hitType = null;
              
              // Check blocker collisions
              for (const blocker of blockers) {
                const sameCircle = blocker.idx === emitter.idx;
                const sameOrOppositePos = Math.abs(((blocker.angle - emitter.angle + 180) % 360) - 180) < 1;
                
                if (!sameCircle || sameOrOppositePos) {
                  const bx = blocker.x - emitter.x;
                  const by = blocker.y - emitter.y;
                  const proj = bx * dx + by * dy;
                  if (proj <= 0) continue;
                  const perp2 = (bx * bx + by * by) - proj * proj;
                  const r2 = 12 * 12;
                  if (perp2 < r2) {
                    const t = proj - Math.sqrt(r2 - perp2);
                    if (t < minT) {
                      minT = t;
                      hitType = 'blocker';
                    }
                  }
                }
              }
              
              // Check emitter collisions
              for (const other of emitters) {
                if (other === emitter) continue;
                const ox = other.x - emitter.x;
                const oy = other.y - emitter.y;
                const proj = ox * dx + oy * dy;
                if (proj <= 0) continue;
                const perp2 = (ox * ox + oy * oy) - proj * proj;
                const r2 = 13 * 13;
                if (perp2 < r2) {
                  const t = proj - Math.sqrt(r2 - perp2);
                  if (t < minT) {
                    minT = t;
                    hitType = 'emitter';
                  }
                }
              }
              
              // Check dodecagon edge collisions
              for (const edge of edgeLines) {
                const x3 = edge.x1, y3 = edge.y1, x4 = edge.x2, y4 = edge.y2;
                const denom = (dx * (y4 - y3) - dy * (x4 - x3));
                if (Math.abs(denom) < 1e-6) continue;
                const t2 = ((x3 - emitter.x) * (y4 - y3) - (y3 - emitter.y) * (x4 - x3)) / denom;
                const t1 = ((x3 - emitter.x) * dy - (y3 - emitter.y) * dx) / denom;
                if (t2 > 0 && t1 >= 0 && t1 <= 1) {
                  if (t2 < minT) {
                    minT = t2;
                    hitType = 'edge';
                    if (edge.i === litIdx) {
                      hit = true;
                      break;
                    }
                  }
                }
              }
              
              if (hit) break;
            }
            if (!hit) {
              allLit = false;
              break;
            }
          }
          
          if (allLit) {
            solvable = true;
          }
        }
      }
    }
    
    // Cache the result
    this.solvabilityCache.set(cacheKey, solvable);
    
    return solvable;
  }

  /**
   * Calculate distribution score (how well emitters are spread)
   */
  calculateDistributionScore(chromosome) {
    const emitterCounts = chromosome.circles.map(circle => circle.emitters.length);
    const totalEmitters = emitterCounts.reduce((sum, count) => sum + count, 0);
    
    if (totalEmitters === 0) return 0;
    
    // Penalty for empty circles
    const emptyCircles = emitterCounts.filter(count => count === 0).length;
    if (emptyCircles > 0) return 0.1; // Heavy penalty
    
    // Calculate how evenly distributed
    const maxCount = Math.max(...emitterCounts);
    const minCount = Math.min(...emitterCounts);
    const evenness = 1 - (maxCount - minCount) / totalEmitters;
    
    return evenness;
  }

  /**
   * Calculate variety score (avoid clustering)
   */
  calculateVarietyScore(chromosome) {
    let varietyScore = 1.0;
    
    // Penalize for too many emitters in one circle
    for (const circle of chromosome.circles) {
      if (circle.emitters.length > 4) {
        varietyScore -= 0.2;
      }
    }
    
    // Bonus for using different angular positions
    const allPositions = chromosome.circles.flatMap(circle => circle.emitters);
    const uniquePositions = new Set(allPositions);
    const diversityBonus = uniquePositions.size / allPositions.length;
    
    return Math.max(0, varietyScore * diversityBonus);
  }

  /**
   * Calculate aesthetic score
   */
  calculateAestheticScore(chromosome) {
    let score = 0.5; // Base score
    
    // Bonus for symmetric lit edge patterns
    const litEdges = chromosome.litEdges;
    if (litEdges.length >= 2) {
      // Check for opposite pairs
      let oppositePairs = 0;
      for (const edge of litEdges) {
        const opposite = (edge + 6) % 12;
        if (litEdges.includes(opposite)) {
          oppositePairs++;
        }
      }
      score += oppositePairs * 0.1;
      
      // Check for consecutive patterns
      let consecutiveGroups = 0;
      for (let i = 0; i < litEdges.length - 1; i++) {
        if (litEdges[i + 1] === litEdges[i] + 1) {
          consecutiveGroups++;
        }
      }
      score += consecutiveGroups * 0.05;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Evolve population to next generation
   */
  evolvePopulation(population, config) {
    const newPopulation = [];
    const eliteCount = Math.floor(this.populationSize * this.eliteRatio);
    
    // Keep elite individuals
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push({ ...population[i], circles: population[i].circles.map(c => ({...c})) });
    }
    
    // Generate offspring
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.selectParent(population);
      const parent2 = this.selectParent(population);
      
      const offspring = this.crossover(parent1, parent2);
      this.mutate(offspring, config);
      
      newPopulation.push(offspring);
    }
    
    return newPopulation;
  }

  /**
   * Select parent using tournament selection
   */
  selectParent(population) {
    const tournamentSize = 3;
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
  crossover(parent1, parent2) {
    const offspring = {
      litEdges: [],
      circles: [],
      fitness: 0,
      solvable: false,
      breakdown: {}
    };
    
    // Blend lit edges from both parents
    const allEdges = [...new Set([...parent1.litEdges, ...parent2.litEdges])];
    const targetSize = Math.min(allEdges.length, Math.max(3, parent1.litEdges.length));
    offspring.litEdges = allEdges.slice(0, targetSize).sort((a, b) => a - b);
    
    // For each circle, randomly inherit from one parent
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
   * Mutate offspring
   */
  mutate(chromosome, config) {
    const mutationRate = 0.3;
    
    // Lit edge mutations
    if (Math.random() < mutationRate * 0.5) {
      if (Math.random() < 0.5 && chromosome.litEdges.length > 3) {
        // Remove edge
        const index = Math.floor(Math.random() * chromosome.litEdges.length);
        chromosome.litEdges.splice(index, 1);
      } else if (chromosome.litEdges.length < 6) {
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
      
      if (Math.random() < mutationRate) {
        // Emitter mutations
        if (Math.random() < 0.7 && circle.emitters.length > 0) {
          // Move an emitter
          const index = Math.floor(Math.random() * circle.emitters.length);
          let newPos;
          do {
            newPos = Math.floor(Math.random() * 12);
          } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
          circle.emitters[index] = newPos;
        } else {
          // Add/remove emitter
          if (Math.random() < 0.3 && circle.emitters.length > 1) {
            // Remove emitter
            const index = Math.floor(Math.random() * circle.emitters.length);
            circle.emitters.splice(index, 1);
          } else if (circle.emitters.length < 4) {
            // Add emitter
            let newPos;
            do {
              newPos = Math.floor(Math.random() * 12);
            } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
            circle.emitters.push(newPos);
          }
        }
      }
      
      // Blocker mutations
      if (Math.random() < mutationRate * 0.5) {
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
            // Remove blocker
            const index = Math.floor(Math.random() * circle.blockers.length);
            circle.blockers.splice(index, 1);
          } else if (circle.blockers.length < 3) {
            // Add blocker
            let newPos;
            do {
              newPos = Math.floor(Math.random() * 12);
            } while (circle.emitters.includes(newPos) || circle.blockers.includes(newPos));
            circle.blockers.push(newPos);
          }
        }
      }
    }
    
    // Ensure each circle has at least one emitter
    for (const circle of chromosome.circles) {
      if (circle.emitters.length === 0) {
        let newPos;
        do {
          newPos = Math.floor(Math.random() * 12);
        } while (circle.blockers.includes(newPos));
        circle.emitters.push(newPos);
      }
    }
  }

  /**
   * Convert chromosome to puzzle format
   */
  chromosomeToPuzzle(chromosome) {
    const RADII = [50, 90, 130]; // Standard radii for the three circles
    
    return {
      litEdges: [...chromosome.litEdges],
      circles: chromosome.circles.map((circle, index) => ({
        radius: RADII[index], // Add missing radius property
        lasers: circle.emitters.map(pos => 15 + 30 * pos), // Convert position to angle
        blockers: circle.blockers.map(pos => 15 + 30 * pos) // Convert position to angle
      }))
    };
  }
}

// Export the simplified generator
const simplifiedEvolutionaryGenerator = new SimplifiedEvolutionaryGenerator();

export {
  simplifiedEvolutionaryGenerator,
  SimplifiedEvolutionaryGenerator
};
