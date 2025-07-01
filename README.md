# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Trespasser Minigame Recreation

This project is a web-based recreation of the Trespasser minigame from Ratchet & Clank, implemented in React and SVG.

## How the Minigame Works

- The main puzzle is a regular 12-sided polygon (dodecagon).
- Several edges of the dodecagon are randomly lit up (red). The goal is to target all of these with laser beams.
- There are three concentric circles at the center, each with a set of laser emitters and blockers attached at fixed positions.
- Emitters can fire a laser beam toward the center of the puzzle. Blockers block beams that intersect them.
- The circles can be rotated in 30° increments. Rotating a circle rotates all its attached emitters and blockers.
- If a laser beam has a clear line of sight to a lit edge (not blocked by a blocker or another emitter), that edge turns green.
- The puzzle is solved when all lit edges are hit by beams.

## Controls

- **Up/Down Arrow Keys:** Select which circle is active (highlighted in yellow).
- **Left/Right Arrow Keys:** Rotate the selected circle by 30° increments.
- **New Puzzle Button:** Generate a new random puzzle.
- **Lit Edges Range:** Adjust the minimum and maximum number of lit edges for new puzzles.
- **Auto-regenerate if unsolvable:** If enabled, the app will keep generating puzzles until a solvable one is found.
- **Attempts:** Shows how many attempts it took to generate the last solvable puzzle.

## Code Structure

- `App.jsx` contains all the main logic and rendering for the puzzle.
- The dodecagon and circles are rendered using SVG.
- Puzzle state (emitters, blockers, lit edges) is generated randomly and stored in React state.
- A brute-force solver checks if a puzzle is solvable by trying all possible circle rotations.

## Puzzle Generation Algorithm

- Lit edges are randomly selected within the user-specified range.
- Emitters and blockers are randomly placed on each circle, ensuring no overlap.
- The number of emitters is always at least the number of lit edges.
- For each lit edge, at least one emitter is positioned so it can hit that edge (to increase the chance of solvability).
- If auto-regenerate is enabled, the app repeatedly generates puzzles until a solvable one is found (up to 1000 attempts).
- Solvability is checked by brute-forcing all possible circle rotations (12^3 = 1728 combinations).

### Limitations

- The current algorithm is not very efficient: it generates random puzzles and checks for solvability after the fact, which can require many attempts, especially for harder puzzles.
- The brute-force solver is computationally expensive and does not scale well for more complex variants.
- The guarantee of solvability is only partial: while at least one emitter is aligned for each lit edge, blockers or other emitters may still prevent a solution.

## Aims for a Better Puzzle Generation Algorithm

- **Direct Construction:** Instead of generating random puzzles and checking for solvability, construct puzzles by placing emitters and blockers in a way that guarantees a solution from the start.
- **Constraint Satisfaction:** Use a constraint satisfaction approach to ensure that, for each lit edge, there is at least one rotation configuration where it can be hit, and that no blockers or emitters can prevent all solutions.
- **Backtracking/Heuristics:** Use backtracking or heuristic search to place emitters and blockers, pruning configurations that would make the puzzle unsolvable.
- **Difficulty Control:** Allow for more precise control over puzzle difficulty by adjusting the number and placement of emitters, blockers, and lit edges, and by analyzing the solution space.
- **Performance:** Reduce the number of generation attempts and the need for brute-force checking, making puzzle generation faster and more scalable.

## Running the App

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Open the app in your browser (usually at http://localhost:5173)

---

Feel free to contribute improvements or suggestions!
