# **Implementation Plan: Nexus Clash \- Strategos**

## **Guiding Principles**

* **Iterative Development:** Build core systems first, then layer on complexity. Each phase should result in a testable, incrementally more complete version of the game.  
* **Placeholder Assets:** Use simple geometric shapes or freely available assets initially to focus on mechanics. Art integration will happen progressively.  
* **Modular Design:** Strive for loosely coupled systems to facilitate easier debugging, iteration, and future expansion (especially for multiplayer).  
* **Test Frequently:** Test each new feature or system thoroughly. Automated tests for core logic are highly recommended.  
* **Cursor Utilization:** Leverage Cursor for code generation, boilerplate reduction, understanding existing Three.js/JS concepts, debugging, and refactoring throughout all phases.  
* **Deterministic Logic (Multiplayer Prep):** Even for single-player, design core game logic (movement, combat calculations, resource changes) to be deterministic where feasible. This means given the same inputs and initial state, the outcome is always identical. This is crucial for potential future multiplayer lockstep synchronization. Avoid relying on Math.random() for critical gameplay outcomes directly; use seeded RNGs if randomness is needed.

## **Phase 0: Project Setup & Foundation (Sprints 1-2)**

Goal: Establish a working Three.js project with basic scene rendering and core utilities.  
Cursor Focus: Project scaffolding, Three.js boilerplate, utility function generation.

- [x] **Task 0.1: Environment & Tooling Setup**  
  * Initialize Node.js project (package.json).  
  * Setup bundler (e.g., Vite, Webpack) for module management and development server.  
  * Initialize Git repository and establish branching strategy (e.g., main, develop, feature branches).  
  * Install Three.js and any essential utility libraries (e.g., lodash or similar).  
  * Configure linter (ESLint) and formatter (Prettier) for code consistency.  
- [x] **Task 0.2: Basic Three.js Scene**  
  * Create main HTML file (index.html) and JavaScript entry point (main.js).  
  * Initialize Three.js renderer, scene, and a basic perspective camera.  
  * Add simple lighting (ambient, directional).  
  * Render a ground plane and a few primitive shapes (cubes, spheres) to verify setup.  
  * Implement a basic render loop using requestAnimationFrame.  
- [x] **Task 0.3: Game Loop & State Management (Initial Stub)**  
  * Establish a main game loop function (update, render).  
  * Create a placeholder for global game state management (e.g., a simple object or a more structured class).  
  * Implement basic time management (delta time calculation for frame-rate independent logic).  
- [x] **Task 0.4: Asset Loading Pipeline (Initial)**  
  * Create a simple asset manager class to handle loading of 3D models (glTF), textures.  
  * Test loading a basic glTF model and texture.

## **Phase 1: Core Interaction & Movement (Sprints 3-5)**

Goal: Implement RTS camera, unit selection, and basic direct unit movement.  
Cursor Focus: Vector math for camera, raycasting for selection, event handling.

- [x] **Task 1.1: RTS Camera Implementation**  
  * Implement camera controls:  
    * Panning (mouse drag with middle button, or edge scrolling, or WASD/arrow keys).  
    * Zooming (mouse wheel).  
    * Rotation (optional, e.g., holding Alt \+ middle mouse drag).  
  * Set camera limits (min/max zoom, pan boundaries).  
- [x] **Task 1.2: Input Handling System**  
  * Create a centralized input manager to handle mouse clicks (left, right, middle), mouse movement, and keyboard events.  
  * Map inputs to game actions (e.g., select, command, camera control).  
- [x] **Task 1.3: Entity Component System (ECS) \- Basic Structure (Optional but Recommended)**  
  * If opting for ECS (highly recommended for RTS complexity):  
    * Define basic Entity (ID), Component (data containers), and System (logic) structures.  
    * Implement core systems: RenderSystem, MovementSystem (initially simple).  
  * If not full ECS, establish clear class structures for game objects (e.g., Unit, Building).  
- [x] **Task 1.4: Unit Representation & Selection**  
  * Create a Unit class/entity type.  
  * Instantiate a few placeholder units (e.g., cubes) on the map.  
  * Implement single unit selection via mouse click (raycasting from camera to ground/units).  
  * Implement box selection (drag to select multiple units).  
  * Visual feedback for selected units (e.g., highlight, selection circle/decal).  
- [x] **Task 1.5: Basic Unit Movement (Direct)**  
  * Implement right-click command to issue a move order to selected unit(s).  
  * Units move in a straight line towards the target point.  
  * No pathfinding or collision avoidance yet.  
  * Basic formation movement (selected units maintain relative positions or move to nearby distinct points).  
- [x] **Task 1.6: Terrain Representation**  
  * Define the ground plane as the primary navigable area.  
  * Establish how terrain height/obstacles will be represented later for pathfinding.

## **Phase 2: Pathfinding & Advanced Movement (Sprints 6-9)**

Goal: Units can navigate around static obstacles using A pathfinding.\*  
Cursor Focus: Algorithm implementation, grid data structures, debugging path results.

- [x] **Task 2.1: Grid System for Pathfinding**  
  * Overlay a logical grid on the game world for pathfinding.  
  * Define grid cell properties (walkable, unwalkable, movement cost).  
  * Implement a way to mark cells as unwalkable (e.g., based on static obstacle positions).  
- [x] *Task 2.2: Pathfinding Algorithm Implementation (A)*\*  
  * Implement the A\* pathfinding algorithm.  
    * Nodes, open list, closed list, heuristic function (e.g., Manhattan or Euclidean distance).  
  * Optimize for performance (e.g., binary heap for open list).  
  * Consider using a well-tested library if custom implementation is too time-consuming, but ensure it can be integrated with your grid and unit systems.  
- [x] **Task 2.3: Integrate Pathfinding with Unit Movement**  
  * When a move command is issued, request a path from the A\* system.  
  * Units follow the sequence of waypoints returned by A\*.  
  * Implement path smoothing if desired (e.g., Catmull-Rom splines or simple smoothing).  
- [x] **Task 2.4: Basic Static Obstacle Avoidance**  
  * Ensure units pathfind around predefined static obstacles (e.g., rocks, unbuildable terrain).  
  * Dynamic obstacle avoidance (other units) will be a later refinement.

## **Phase 3: Resource & Basic Building Systems (Sprints 10-14)**

Goal: Implement the core economic loop: harvesting Promethium, generating EC, managing Power, and constructing basic buildings.  
Cursor Focus: System logic for resource flow, UI updates, building placement logic.

- [x] **Task 3.1: Promethium Resource Nodes**  
  * Create PromethiumNode entities/objects.  
  * Visual representation (e.g., glowing crystals).  
  * Data: amount of Promethium, regeneration rate (if any, initially finite).  
- [x] **Task 3.2: Harvester Unit Logic**  
  * Designate one placeholder unit as a "Harvester."  
  * Implement AI behavior:  
    * Find nearest Promethium Node.  
    * Move to Node, "harvest" for a duration (decrementing Node's amount).  
    * Return to a designated drop-off point (e.g., Command Center, later Refinery).  
    * Deposit resources.  
- [x] **Task 3.3: Refinery Structure & Energy Credits (EC)**  
  * Create Refinery building type.  
  * Harvesters now drop off Promethium at Refineries.  
  * Refineries process Promethium into Energy Credits (EC) over time.  
  * Implement EC as a global player resource.  
- [x] **Task 3.4: Power Plant & Power Grid System**  
  * Create PowerPlant building type.  
  * Power Plants generate Power (a global player resource).  
  * Buildings (Refinery, future production buildings) consume Power.  
  * Implement logic for low-power effects (e.g., reduced production/refining speed).  
- [x] **Task 3.5: Basic Construction System**  
  * Implement ability to place buildings (Command Center, Power Plant, Refinery initially).  
    * Placement validation (valid terrain, no collisions, within power range if applicable).  
    * Ghost building preview during placement.  
  * Constructor unit (e.g., WEC Engineer) "builds" the structure over time (visual progress, build timer).  
  * Deduct EC cost for construction.
- [x] Resource return logic for harvesters (drop-off at refineries)
- [x] Player starts with a constructed refinery
- [x] Passive energy credit generation from refineries
- [x] Building placement system (ghost preview, finalized placement, currently free for testing)

## **Phase 4: Combat Systems & Initial Faction Units (Sprints 15-20)**

Goal: Implement basic combat, unit production, and the first distinct units for each faction.  
Cursor Focus: Combat calculation logic, unit stats management, projectile systems.

- [x] **Task 4.1: Health & Damage System**  
  * Add HealthComponent to units and buildings.  
  * Implement damage calculation when an attack hits.  
  * Unit/building destruction (visuals, removal from game).  
- [x] **Task 4.2: Basic Attack Logic**  
  * Add AttackComponent to combat units (damage, range, attack speed/cooldown).  
  * Implement "attack-move" command.  
  * Units auto-acquire and attack enemy targets within range.  
  * Simple projectile system (if needed, e.g., for ranged units) or instant hit.  
- [x] **Task 4.3: Unit Production Structures**  
  * Implement Barracks (for infantry) and VehicleFactory (for vehicles) building types (or faction equivalents).  
  * Units are queued and produced from these structures, costing EC.  
- [x] **Task 4.4: Implement 1-2 Core Combat Units for WEC**  
  * Model (placeholder), stats, and basic attack for WEC units (e.g., Marine-equivalent, light vehicle).  
  * Focus on making them feel slightly different from ESY counterparts even with placeholders.  
- [x] **Task 4.5: Implement 1-2 Core Combat Units for ESY**  
  * Model (placeholder), stats, and basic attack for ESY units (e.g., Conscript-equivalent, light vehicle).  
- [x] **Task 4.6: Faction Identification**  
  * Assign units and buildings to factions (Player 1, Player 2/AI).  
  * Basic team colors/identifiers.
- [x] Expanded unit system: multiple unit types, stats, projectiles, and combat logic

## **Phase 5: Basic AI & Game Loop Completion (Sprints 21-25)**

Goal: Create a rudimentary AI opponent that can play a full game loop.  
Cursor Focus: AI decision trees/state machines, scripting AI behaviors.

1. **Task 5.1: AI Framework (State Machine/Behavior Tree)**  
   * Implement a basic AI agent class.  
   * Choose and implement a simple AI decision-making structure (e.g., Finite State Machine or basic Behavior Tree).  
2. **Task 5.2: AI Resource Gathering Behavior**  
   * AI builds Harvesters.  
   * AI assigns Harvesters to gather Promethium.  
3. **Task 5.3: AI Base Building Behavior**  
   * AI follows a simple scripted build order (e.g., build Power Plant, then Refinery, then Barracks).  
   * AI expands its base (e.g., builds more Power Plants as needed).  
4. **Task 5.4: AI Unit Production Behavior**  
   * AI produces combat units from its production structures.  
5. **Task 5.5: AI Attack Behavior**  
   * AI groups units into a simple "attack ball."  
   * AI issues attack-move commands towards the player's base when it has a certain army size.  
6. **Task 5.6: Basic Win/Loss Conditions**  
   * Game ends when one player's Command Center is destroyed.  
   * Display simple "You Win" / "You Lose" message.

## **Phase 6: UI/UX \- Initial Pass (Sprints 26-30)**

Goal: Implement essential UI elements for game interaction and information display using HTML/CSS overlays.  
Cursor Focus: DOM manipulation, CSS styling, event binding between Three.js and HTML UI.

1. **Task 6.1: Resource Display UI**  
   * Display player's current EC and Power (and Power surplus/deficit).  
2. **Task 6.2: Minimap (Basic)**  
   * Render a top-down view of the terrain.  
   * Show unit positions (simple dots) and building locations.  
   * Allow clicking on minimap to move camera view.  
3. **Task 6.3: Unit Selection & Info Panel**  
   * When units/buildings are selected, display their icon, name, health, and other key stats in a dedicated panel.  
4. **Task 6.4: Command Card UI**  
   * Contextual panel showing available actions for the selected unit/building (e.g., Move, Attack, Stop, Build Unit X, Set Rally Point).  
   * Buttons trigger game actions.  
5. **Task 6.5: Fog of War (Basic)**  
   * Implement basic fog of war:  
     * Map initially hidden.  
     * Areas revealed by unit Line of Sight (LOS).  
     * Revealed areas return to a "shroud" (terrain visible, units/buildings hidden) when no friendly LOS.  
6. **Task 6.6: Event Notifications & Alerts**  
   * Simple on-screen messages for key events (e.g., "Unit produced," "Building complete," "Base under attack").

## **Phase 7: Single-Player Content Framework (Sprints 31-35)**

Goal: Establish the systems for delivering tutorial and campaign missions.  
Cursor Focus: Scripting event sequences, UI for tutorial prompts, mission objective tracking.

1. **Task 7.1: Tutorial System Framework**  
   * Develop a system for scripting tutorial events (e.g., display text prompt, highlight UI element, wait for player action, grant reward/objective completion).  
   * UI elements for tutorial messages and guidance arrows.  
2. **Task 7.2: Implement First Tutorial Missions**  
   * Mission 1: Camera control, unit selection, basic movement.  
   * Mission 2: Resource gathering, basic building (Refinery, Power Plant).  
3. **Task 7.3: Campaign Mission System**  
   * System for loading specific maps with predefined unit/building placements.  
   * Scripting for mission objectives (primary, secondary), triggers, and story events/dialogue.  
   * Win/loss conditions specific to missions.  
4. **Task 7.4: Develop First Campaign Mission (WEC or ESY)**  
   * Implement one full mission from the GDD's mini-campaigns to test the system.

## **Phase 8: Iteration, Art Integration & Ongoing Development (Ongoing Sprints)**

Goal: Continuously refine gameplay, integrate proper art/sound, expand content, and optimize.  
Cursor Focus: Refactoring, asset integration, performance profiling, shader development.

1. **Task 8.1: Integrate First Pass Art Assets**  
   * Replace placeholder models for initial units and buildings with actual game assets (even if early versions).  
   * Improve visual effects (explosions, weapon fire).  
2. **Task 8.2: Sound Design Integration**  
   * Add sound effects for unit actions, combat, UI interactions.  
   * Implement background music.  
3. **Task 8.3: Refine & Expand Faction Uniqueness**  
   * Implement more units for each faction as per GDD.  
   * Implement unique faction abilities and tech tree elements.  
   * Ensure WEC and ESY playstyles feel distinct.  
4. **Task 8.4: AI Enhancements**  
   * Improve AI tactical decision-making, build order variety, and responsiveness.  
   * Implement different AI difficulty levels.  
5. **Task 8.5: Balancing**  
   * Regularly playtest and balance unit stats, costs, build times, and economic factors.  
6. **Task 8.6: Performance Profiling & Optimization**  
   * Continuously monitor performance (FPS, memory usage).  
   * Optimize bottlenecks in rendering, pathfinding, AI, or game logic.  
   * Implement LODs, instancing, and other techniques from the GDD.  
7. **Task 8.7: Expand Single-Player Content**  
   * Develop remaining tutorial and campaign missions.  
   * Create more skirmish maps.  
8. **Task 8.8: Bug Fixing & Polish**  
   * Address bugs as they arise.  
   * General polish to UI, controls, and overall feel.

**Current Testing State:**
- Building costs are set to 0 for rapid iteration.
- Debug overlays and logs are enabled for building placement and resource changes.
- All core resource and combat systems are functional and being iteratively refined.

## **Next Steps**
- [ ] Advanced AI (base building, resource gathering, combat tactics)
- [ ] Campaign scripting and mission objectives
- [ ] Art and sound integration (replace placeholders)
- [ ] UI/UX polish (minimap, overlays, tooltips, hotkeys)
- [ ] Performance optimization and bug fixing
- [ ] Playtesting and balancing

This implementation plan provides a structured approach. Remember that game development is highly iterative; be prepared to revisit earlier phases to refine systems as new features are added and new insights are gained. Good luck\!