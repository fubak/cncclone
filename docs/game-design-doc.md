# **Game Design Document: Nexus Clash \- Strategos**

## **Introduction**

**Nexus Clash: Strategos** is a modern real-time strategy (RTS) game set in a near-future world where two distinct global factions, the **Western Coalition (WEC)** and the **Eastern Syndicate (ESY)**, compete for control over newly discovered **Promethium Crystal** deposits. These crystals are a revolutionary resource, vital for next-generation technology and energy production. Drawing inspiration from classic RTS titles, the game emphasizes deep strategic base building, multi-layered resource management, tactical unit deployment, and pronounced faction asymmetry.

The initial development focuses on delivering a comprehensive **single-player experience**, including an interactive tutorial, narrative-driven mini-campaigns for each faction, and robust AI skirmish modes. However, the core architecture of **Nexus Clash: Strategos** will be designed with future **online multiplayer** capabilities in mind. The game is intended for web browsers, leveraging the **Three.js** library for 3D rendering to create an accessible, performant, and visually engaging strategic experience.

## **Table of Contents**

1. [Game Overview & Narrative Premise](#bookmark=id.c7bk82ir7hss)  
2. [Core Gameplay Mechanics](#bookmark=id.b78ts8ogihzw)  
   * [Base Building & Expansion](#bookmark=id.85kloyf9fg3v)  
   * [Resource Management: Promethium & Energy Credits](#bookmark=id.r1bo5rkmbxdc)  
   * [Power Grid System](#bookmark=id.xcbtd7o2zhqz)  
   * [Unit Production & Technology Tiers](#bookmark=id.qclkybaa9niy)  
   * [Combat System & Unit Abilities](#bookmark=id.msrq0djb4rsm)  
   * [Intelligence & Fog of War](#bookmark=id.x67nqaqumro)  
3. [Factions & Asymmetry](#bookmark=id.p2ioix55e2)  
   * [Western Coalition (WEC)](#bookmark=id.1tdg3iuag5j)  
   * [Eastern Syndicate (ESY)](#bookmark=id.fvc090cj8ecs)  
4. [Single-Player Experience (Initial Focus)](#bookmark=id.s6vv61tlc0ji)  
   * [Interactive Tutorial System](#bookmark=id.fc79jgfdodvr)  
   * [Narrative Mini-Campaigns](#bookmark=id.kcipx8bsw9eq)  
   * [Skirmish Mode (vs. AI)](#bookmark=id.3dtia62nhx9v)  
5. [Multiplayer Considerations (Future Scope)](#bookmark=id.r31whtf5cybm)  
6. [Map Design Principles](#bookmark=id.x5w2qg9zlx16)  
7. [Art Style & Visuals](#bookmark=id.wl9a25soacek)  
8. [Sound Design & Music](#bookmark=id.os8wahgx1jv3)  
9. [Technical Implementation (Three.js Focus)](#bookmark=id.y9i51kxct3w2)  
   * [Core Engine & Libraries](#bookmark=id.slw5dkoccaw7)  
   * [3D Assets & Optimization Strategy](#bookmark=id.9yolbdr7vpek)  
   * [User Interface (UI) & User Experience (UX)](#bookmark=id.nuekg5kim9rw)  
   * [AI Design Philosophy](#bookmark=id.tu1d9ad83pw9)  
10. [Development Roadmap & Milestones](#bookmark=id.r6vophxjl8xq)  
11. [Monetization Strategy (Post-Launch Consideration)](#bookmark=id.hlu42lbt584a)

## **1\. Game Overview & Narrative Premise**

**Nexus Clash: Strategos** places players at the helm of one of two dominant global powers in a near-future setting. The discovery of Promethium Crystals—a mineral capable of revolutionizing energy and manufacturing—has created a new nexus of global power, leading to escalating tensions and strategic confrontations over resource-rich territories.

The narrative avoids simplistic "good vs. evil" tropes. Instead, it presents the **Western Coalition (WEC)**, a technologically advanced alliance emphasizing precision and information dominance, and the **Eastern Syndicate (ESY)**, an industrial powerhouse focused on resilience, mass production, and fortified control. Each faction has its own distinct ideology, strategic doctrine, and motivations for securing Promethium, believing its approach is essential for global stability and progress. The game challenges players to master their chosen faction's unique strengths and navigate complex tactical scenarios.

## **2\. Core Gameplay Mechanics**

### **Base Building & Expansion**

Players establish and expand their operational presence by constructing a variety of structures. Effective base layout and strategic expansion are crucial for defense and resource control.

* **Command Center (HQ):** The heart of the base. Produces initial constructor units (e.g., WEC Engineer, ESY Drone Overseer). Provides a foundational level of Power. Upgrading the HQ often unlocks higher technology tiers.  
* **Promethium Refinery:** Processes raw Promethium Crystals into usable Energy Credits. Requires Power to operate efficiently.  
* **Power Plant (WEC: Fusion Reactor, ESY: Geothermal Plant):** Generates essential Power for the base. Can be upgraded for increased output or efficiency.  
* **Unit Production Structures (Faction Specific):**  
  * *Barracks/Biolab:* Trains infantry units.  
  * *Vehicle Factory/Assembly Plant:* Manufactures ground vehicles.  
  * *Airfield/Drone Nexus:* Constructs aerial units.  
* **Research Facility (WEC: Advanced Development Lab, ESY: Experimental Weapons Complex):** Unlocks new unit types, upgrades for existing units, global abilities, and faction-specific technologies.  
* **Defensive Structures:** Includes automated turrets, energy shields (WEC), fortified bunkers (ESY), anti-air emplacements, and sensor towers. Each faction has unique defensive options.  
* **Support Structures:** Buildings that might provide passive bonuses, increase unit caps, or enable specialized functions (e.g., repair bays, stealth generators).

### **Resource Management: Promethium & Energy Credits**

The game economy revolves around two primary resources:

* **Promethium Crystals:** The raw, strategic resource. Found in glowing, crystalline formations across the map. Harvester units (e.g., WEC "Collector" Drones, ESY "Extractor" Crawlers) gather Promethium and transport it to Refineries. Deposits are finite but may vary in richness.  
* **Energy Credits (EC):** The refined currency used for constructing buildings, training units, researching technologies, and activating certain abilities. Generated by Promethium Refineries processing raw Promethium. The rate of EC generation is tied to the number of active refineries and their operational efficiency (influenced by Power).

### **Power Grid System**

A critical layer of resource management, distinct from Energy Credits, that dictates operational capacity:

* **Generation:** Power is primarily generated by dedicated Power Plants and a small amount from the HQ. Some advanced technologies or unique structures might offer alternative Power generation methods.  
* **Consumption:** All active buildings (except the HQ and Power Plants themselves) and some high-tier units or abilities consume Power. Consumption is clearly displayed.  
* **Network & Distribution (Potential Mechanic):** Consider if Power needs to be "distributed" via pylons or if structures simply draw from a global pool. A network could add strategic targets (destroying a key pylon could black out a section of the base). For initial simplicity, a global pool is likely better.  
* **Consequences of Shortfall:** If Power demand exceeds supply:  
  * Production speeds (units, research) are significantly reduced.  
  * Refinery efficiency drops (less EC per Promethium).  
  * Defensive structures may operate at reduced effectiveness or deactivate entirely.  
  * Visual cues (flickering lights, warning icons, slower animations) will indicate low Power status.  
* **Management:** Players must strategically balance expansion, production, and Power generation. Overextending without sufficient Power can cripple an economy and defense.

### **Unit Production & Technology Tiers**

Units form the backbone of a player's army and are produced from specialized structures.

* **Technology Tiers (T1, T2, T3):** Advancement is typically gated by upgrading the Command Center or specific Research Facilities. Higher tiers unlock more powerful and specialized units, advanced upgrades, and game-changing abilities.  
* **Production Queues:** Players can queue multiple units for production at each structure.  
* **Rally Points:** Customizable rally points for newly produced units (ground, air, or to other units for guard/follow).  
* **Unit Upgrades:** Researchable improvements for existing units (e.g., increased armor, enhanced weaponry, new abilities).

### **Combat System & Unit Abilities**

Combat is real-time, tactical, and emphasizes unit composition, positioning, flanking, and the timely use of abilities.

* **Core Combat Triangle:** A foundational rock-paper-scissors dynamic (e.g., anti-infantry units are strong vs. infantry but weak vs. vehicles; anti-vehicle units excel against armor but are vulnerable to air; anti-air counters aircraft).  
* **Beyond the Triangle:** Specialized units and abilities will create more nuanced interactions and counter-play opportunities (e.g., EMP effects disabling vehicles, stealth units bypassing defenses, artillery providing long-range siege).  
* **Unit Abilities:** Many units will possess 1-2 active or passive abilities that add tactical depth:  
  * *Active:* Require player command (e.g., WEC Ranger's "Focus Fire," ESY Juggernaut's "Siege Mode").  
  * *Passive:* Always in effect or trigger automatically (e.g., WEC Stealth Tank's cloaking when stationary, ESY Conscript's "Swarm Tactics" bonus when near other Conscripts).  
* **Veterancy:** Units can gain experience (e.g., 1-3 levels) through combat, leading to minor improvements in stats (health, damage, rate of fire) or unlocking a specific veteran ability. This encourages players to preserve experienced units.  
* **Faction Super Abilities:** Each faction gains access to powerful, game-altering abilities on long cooldowns, unlocked via high-tier research or specific structures. These require significant investment and strategic timing.

### **Intelligence & Fog of War**

* **Fog of War:** The map is initially shrouded. Areas become revealed as units explore.  
* **Line of Sight (LOS):** Revealed areas will return to a "shroud of war" (terrain visible, but no enemy units or structures unless in current unit/building LOS).  
* **Sensor Towers/Scouting Units:** Specialized units or structures can provide increased LOS, detect stealthed units, or temporarily reveal areas of the map.

## **3\. Factions & Asymmetry**

The core design philosophy is to make each faction feel distinct in its economic management, technological progression, unit roster, and strategic approach.

### **Western Coalition (WEC)**

* **Ideology:** Progress through technological supremacy, precision warfare, information dominance, and adaptable force projection.  
* **Visual Style:** Sleek, angular, advanced materials, often utilizing blues, silvers, and whites with energy-based visual effects. Units may feature holographic elements or advanced sensor arrays.  
* **Economic Focus:** Relies on high-efficiency structures and potentially higher initial costs for advanced tech, but with significant payoffs. May have mechanics related to optimizing power flow or data networks for bonuses.  
* **Military Doctrine:** Emphasizes specialized, high-cost, high-impact units. Air superiority, stealth, and advanced weapon systems are common. Units often have multiple impactful abilities requiring micromanagement.  
* **Strengths:** Superior technology, powerful individual units, strong air force, advanced intelligence/stealth capabilities, potent active abilities.  
* **Weaknesses:** Higher unit costs (losses are more painful), slower base production rates for some units, can be vulnerable if their technological edge is matched or countered by mass.  
* **Unique Mechanics/Units (Examples):**  
  * **"Aegis" Energy Shielding:** Researchable tech that provides rechargeable shields to key units and structures.  
  * **Chrono Troopers:** Elite infantry capable of short-range tactical jumps or temporary time distortions (slowing enemies).  
  * **"Spectre" Stealth Fighter:** Aircraft with active camouflage, ideal for surgical strikes on high-value targets.  
  * **"Helios" Beam Cannon Tank:** A T3 vehicle that charges up a devastating, pinpoint energy beam.  
  * **Unique Building: "Skynet Uplink":** Unlocks powerful global support powers (e.g., targeted EMP strikes, temporary global unit speed boost, revealing a large map area). Power-intensive.  
* **Super Ability Example:** **Orbital Precision Strike:** A player-targeted, high-damage orbital laser or kinetic bombardment.

### **Eastern Syndicate (ESY)**

* **Ideology:** Strength through industrial might, overwhelming numbers, fortified entrenchment, and relentless advancement.  
* **Visual Style:** Robust, utilitarian, heavily armored, often utilizing reds, dark greys, and blacks with more conventional ballistic and explosive visual effects. Units appear rugged and imposing.  
* **Economic Focus:** Benefits from mass production capabilities and potentially more resilient resource gathering. May have mechanics that reward large-scale infrastructure or population (unit count).  
* **Military Doctrine:** Relies on cost-effective, mass-producible units that can overwhelm opponents. Strong ground forces, heavy armor, and potent defensive emplacements. Units might have simpler abilities but gain strength in numbers.  
* **Strengths:** Faster unit production, lower individual unit costs, strong base defenses, resilient units and structures, abilities that enhance grouped units.  
* **Weaknesses:** Less sophisticated individual units, typically slower or less versatile air power, can be outmaneuvered or suffer against highly specialized enemy tech if not adapted.  
* **Unique Mechanics/Units (Examples):**  
  * **"Swarm Protocol":** Many ESY infantry and light vehicles gain small combat bonuses when grouped closely together.  
  * **Conscript Legions:** Extremely cheap, rapidly produced basic infantry, weak individually but dangerous in large numbers. Can be upgraded with "For the Syndicate\!" charge ability.  
  * **"Juggernaut" Siege Platform:** A slow-moving artillery unit that must deploy to fire, devastating against structures and static defenses.  
  * **"Bear" Heavy Tank:** A durable, heavily armed tank that can be upgraded with reactive armor or dozer blades for clearing light obstacles/infantry.  
  * **Unique Building: "Industrial Core":** Boosts the production speed of adjacent unit production structures and reduces their cost slightly. Can be upgraded to enhance these bonuses.  
* **Super Ability Example:** **Iron Curtain Protocol:** Temporarily makes all friendly units and structures in a large target area invulnerable for a short duration.

## **4\. Single-Player Experience (Initial Focus)**

The initial release will prioritize a polished and engaging single-player experience.

### **Interactive Tutorial System**

* A multi-stage, guided tutorial introducing players to fundamental RTS concepts: camera controls, base building, resource gathering (Promethium & EC), Power Grid management, unit production, combat basics (moving, attacking, unit abilities), UI navigation, and basic strategies for each faction.  
* Will use contextual pop-ups, voice-over guidance, and clear objectives.

### **Narrative Mini-Campaigns**

* One distinct mini-campaign (e.g., 4-6 missions) for both WEC and ESY.  
* These campaigns will explore the faction's perspective on the Promethium conflict, introduce their key units and technologies through story-driven objectives, and feature unique map designs and scripted events.  
* Aims to build lore, showcase faction identities, and provide varied gameplay challenges.

### **Skirmish Mode (vs. AI)**

* Players can set up custom games against AI opponents on various maps.  
* Selectable Factions (WEC, ESY).  
* Adjustable AI difficulty levels (e.g., Easy, Medium, Hard, Brutal). Each level will affect AI resourcefulness, build orders, tactical acumen, and potentially resource handicaps.  
* Initial focus on 1v1 skirmishes, with potential for team-based AI games (e.g., 2v2) if development allows.  
* Variety of maps with different layouts and resource distributions.

## **5\. Multiplayer Considerations (Future Scope)**

While not part of the initial release, the game's architecture will be designed with future multiplayer functionality in mind to facilitate smoother implementation later.

* **Deterministic Game Logic:** All game simulations (movement, combat, resource changes) must produce identical results given the same sequence of commands and starting state. This is crucial for lockstep synchronization, which is common in RTS games to minimize network traffic.  
* **Command-Based Networking:** Instead of syncing full game states frequently, only player commands (build unit, move unit, use ability) would be sent to all clients, who then execute them deterministically.  
* **Client-Server Architecture (Planned):** A central server (e.g., using Node.js and WebSockets) would manage game lobbies, player connections, relay commands, and potentially handle authoritative game start/end conditions.  
* **State Desynchronization Handling:** Strategies for detecting and potentially correcting desyncs, though the primary goal is to prevent them through robust deterministic logic.  
* **Data Structures:** Game object data (units, buildings) will be designed to be easily serializable for potential state saving/loading or debugging network issues.  
* **Balance:** Gameplay balance will initially focus on single-player vs. AI, but with an eye towards future player-vs-player dynamics.

## **6\. Map Design Principles**

Maps are critical for replayability and strategic depth.

* **Initial Set:** The game will launch with 3-5 polished maps designed primarily for 1v1 encounters, thoroughly tested for balance between factions and offering diverse strategic challenges.  
* **Layout Variety:** Maps will feature a mix of:  
  * Open terrain for large engagements.  
  * Chokepoints for defensive stands and ambushes.  
  * High ground providing tactical advantages (e.g., increased range or vision).  
  * Varied Promethium deposit locations (e.g., easily defensible main deposits, riskier expansion deposits).  
* **Strategic Objectives (Optional):** Some maps might include neutral "Tech Structures" (e.g., capturable observatories for temporary map vision, abandoned Promethium silos for a resource boost) to create additional points of conflict.  
* **Visual Clarity:** Terrain features, pathable vs. unpathable areas, and resource locations must be clearly communicated visually.  
* **Aesthetics & Themes:** Diverse visual themes for maps (e.g., arctic research outposts, desert mining operations, overgrown industrial zones, ruined urban centers) to provide variety.  
* **Scalability:** Map data will be stored in a flexible format (e.g., JSON or a custom format) to allow for easier creation of new maps. A basic internal map editor is a long-term goal.

## **7\. Art Style & Visuals**

* **Target Style: "Optimized Stylized Realism."** The game will aim for a modern, visually appealing 3D aesthetic that is clear, readable, and performant within web browsers. It avoids photorealism in favor of well-defined shapes, impactful designs, and slightly stylized textures and effects.  
* **Faction Identity:** Distinct visual languages for WEC (sleek, high-tech, energy effects) and ESY (robust, industrial, ballistic effects). Color palettes will be consistent and aid in faction recognition (e.g., WEC: blues/silvers; ESY: reds/dark greys).  
* **Unit Design:** Units must be easily identifiable by their silhouette, scale, and primary function, even from a zoomed-out RTS perspective. Animations should clearly convey actions (moving, attacking, ability use).  
* **Environment Design:** Environments will be detailed enough to be immersive but optimized for performance. Attention to lighting, atmospheric effects, and small details that bring maps to life.  
* **Special Effects (VFX):** Weapon fire, explosions, ability activations, and resource gathering effects should be visually satisfying and provide clear feedback, while being optimized to prevent performance drops during large battles.  
* **User Interface (UI):** Clean, modern, and intuitive. See [User Interface (UI) & User Experience (UX)](#bookmark=id.nuekg5kim9rw).

## **8\. Sound Design & Music**

Sound is crucial for immersion, feedback, and faction identity.

* **Overall Quality:** Aim for crisp, impactful, and clear audio.  
* **Unit Responses:** Unique voice lines for unit selection, movement commands, and attack orders, specific to each faction to enhance personality.  
* **Weapon & Ability Sounds:** Distinct and satisfying sounds for all weapons, explosions, and special abilities. WEC might feature more energy-based sounds, while ESY focuses on heavier ballistic and mechanical sounds.  
* **Environmental Audio:** Ambient sounds for different map themes (wind, machinery hums, wildlife) to create atmosphere.  
* **UI Sounds:** Non-intrusive but clear audio feedback for button clicks, build completions, research finished, and critical warnings (e.g., "Base under attack," "Low Power," "Unit lost").  
* **Music:**  
  * **Dynamic Score:** Music that adapts to the game state (e.g., calmer, more ambient tracks during base building and exploration; more intense, driving tracks during combat).  
  * **Faction Themes:** Subtle thematic differences in the musical score when playing as or encountering different factions.  
* **Technology:** Web Audio API for spatial audio (3D sound positioning) and dynamic effects.  
* **Sourcing:** A mix of high-quality licensed sound libraries and custom-created sounds for key elements, especially unique unit abilities and faction themes.

## **9\. Technical Implementation (Three.js Focus)**

Developing a full 3D RTS in a web browser using Three.js presents unique challenges and opportunities.

### **Core Engine & Libraries**

* **Rendering Engine:** **Three.js** (WebGL). This will handle all 3D rendering, scene management, lighting, and materials.  
* **Game Logic:** Primarily custom JavaScript/TypeScript. Code will be modular and organized for maintainability.  
* **Pathfinding:** Implementation of the A\* algorithm (or a similar efficient algorithm like Jump Point Search). Performance for many units is critical; consider using WebAssembly for the core pathfinding logic if pure JS proves too slow. Libraries like pathfinding.js can be evaluated.  
* **Physics:** Minimal physics requirements. Primarily for:  
  * Projectile motion (can be faked or use simple physics).  
  * Basic collision detection (unit-to-unit, unit-to-terrain/structure). A lightweight library like SAT.js for 2D projections or custom bounding box checks might suffice, avoiding full 3D physics engine overhead.  
* **State Management:** A clear system for managing game state (units, buildings, resources, player status). Libraries like Redux or Zustand could be considered if complexity warrants, or a custom event-driven model.  
* **AI Engine:** Custom AI logic (see [AI Design Philosophy](#bookmark=id.tu1d9ad83pw9)).

### **3D Assets & Optimization Strategy**

* **Modeling Software:** Blender is preferred for creating custom 3D models and animations.  
* **Asset Format:** glTF (.glb) is the target format due to its efficiency and suitability for web delivery with Three.js.  
* **Optimization Techniques (Crucial for Web Performance):**  
  * **Low Poly Counts:** Models will be designed with performance in mind from the start.  
  * **Level of Detail (LOD):** Aggressive use of LOD for all units and complex structures. Simpler models are swapped in at greater distances.  
  * **Texture Atlasing:** Combining multiple textures into single larger textures to reduce draw calls.  
  * **Instanced Rendering:** Using THREE.InstancedMesh for rendering large numbers of identical units (e.g., infantry squads, swarms of drones) to significantly improve performance.  
  * **Baked Lighting:** For static environmental elements where possible to reduce real-time lighting calculations.  
  * **Frustum Culling:** Automatically handled by Three.js, but ensure objects outside the camera's view are not unnecessarily processed.  
  * **Shader Optimization:** Custom shaders will be kept as simple as possible while achieving the desired visual style.  
  * **Asset Compression:** Use tools like Draco mesh compression (supported by glTF) for smaller file sizes.

### **User Interface (UI) & User Experience (UX)**

* **Technology:** Primarily HTML/CSS/JS overlaid on the WebGL canvas for complex UI elements like build menus, resource displays, command cards, and the minimap. This offers greater flexibility, accessibility, and ease of development compared to building all UI within Three.js.  
* **In-World UI:** Three.js can be used for elements like unit health bars, selection circles, or status icons that need to exist within the 3D scene.  
* **Design Principles:**  
  * **Clarity:** Information must be easy to read and understand at a glance.  
  * **Efficiency:** Common actions should require minimal clicks. Hotkeys for all major commands.  
  * **Feedback:** Clear visual and audio feedback for all player interactions.  
  * **Consistency:** UI elements and interactions should behave predictably.  
  * **Minimalism:** Avoid cluttering the screen; information should be available when needed but not overwhelming.  
* **Responsiveness:** The UI should adapt gracefully to different browser window sizes, though a minimum resolution will be defined.

### **AI Design Philosophy**

* **Goal-Oriented AI:** AI opponents will operate based on strategic and tactical goals (e.g., scouting, expanding, securing resources, building a balanced army, exploiting weaknesses, defending key points).  
* **Behavior Trees or Finite State Machines (FSMs):** These will be used to model AI decision-making processes, allowing for complex and adaptable behaviors.  
* **Difficulty Scaling:** AI difficulty will be scaled by adjusting factors such as:  
  * Resource efficiency / income bonuses (subtle at lower levels, more pronounced at higher).  
  * Build order complexity and adaptability.  
  * Unit micro-management capabilities.  
  * Reaction time and tactical awareness.  
  * APM (Actions Per Minute) limits to feel more human-like.  
* **Personalities (Optional):** Different AI "personalities" could favor specific strategies (e.g., aggressive rusher, defensive turtler, tech-focused).  
* **Learning/Adaptation (Long-term):** Very basic adaptation to player strategies might be considered for higher difficulties, but true machine learning AI is out of scope for the initial release.

## **10\. Development Roadmap & Milestones**

This is a high-level, iterative roadmap. Detailed sprint planning will occur throughout development.  
Assumptions: Small, focused development team.

1. **Phase 1: Foundation & Core Engine (3-5 Months)**  
   * **Tasks:** Setup Three.js environment, basic scene rendering, RTS camera controls (pan, zoom, rotate), basic asset loading pipeline. Implement fundamental unit selection (single click, box select) and movement commands (right-click move, attack-move).  
   * **Milestone 1:** A single controllable 3D unit can be selected and moved around a basic 3D map with functional RTS camera.  
   * **Risk:** Performance of pathfinding with many units.  
   * **Mitigation:** Prototype and test pathfinding early (A\* with potential WebAssembly optimization).  
2. **Phase 2: Core Gameplay Loop \- Part 1 (Resource & Build) (4-6 Months)**  
   * **Tasks:** Implement Promethium deposits and harvester unit logic. Implement Refinery and Energy Credit generation. Implement basic Power Plant and Power Grid mechanics (generation, consumption, low-power effects). Implement Command Center and one basic unit production structure (e.g., Barracks). Basic UI for resources, power, and unit production.  
   * **Milestone 2:** Player can build a minimal base (HQ, Refinery, Power Plant, Barracks), harvest Promethium, generate EC and Power, and produce one basic combat unit. Core resource and power feedback loops are functional.  
3. **Phase 3: Core Gameplay Loop \- Part 2 (Combat & AI) (4-6 Months)**  
   * **Tasks:** Implement basic combat (one distinct unit for WEC, one for ESY, with attack animations and health). Implement Fog of War and basic Line of Sight. Develop foundational AI: resource gathering, base building (simple predefined order), producing units, and basic attack commands (move to enemy base and attack).  
   * **Milestone 3:** A single player can play a rudimentary game loop against a basic AI on one map (build, harvest, produce, simple combat, win/lose condition based on destroying enemy HQ).  
4. **Phase 4: Faction Implementation & Initial Content (6-9 Months)**  
   * **Tasks:** Design and implement 3-4 core units for WEC with unique abilities. Design and implement 3-4 core units for ESY with unique abilities. Implement basic tech tree/upgrades for these units. Implement faction-specific visual styles for buildings and units. Develop the interactive tutorial. Start design of 2-3 campaign missions for one faction.  
   * **Milestone 4:** Both factions are playable with a small but distinct set of units and basic upgrades. Tutorial introduces core mechanics. First campaign mission playable. AI can utilize faction units.  
5. **Phase 5: Content Expansion & Polish (Single-Player Focus) (5-7 Months)**  
   * **Tasks:** Complete the unit rosters for both factions (target 8-10 units per faction). Implement faction super abilities. Finalize tech trees. Complete both mini-campaigns (4-6 missions each). Create 3-5 skirmish maps. Refine AI with more advanced strategies, difficulty scaling, and faction-specific behaviors. Integrate final art assets, sound effects, and music. Extensive playtesting and balancing.  
   * **Milestone 5 (Alpha):** Game is feature-complete for the single-player experience. All units, campaigns, and skirmish maps are implemented. Significant balancing and bug fixing.  
6. **Phase 6: Beta Testing & Launch Preparation (3-4 Months)**  
   * **Tasks:** Conduct closed and then potentially open beta testing. Gather player feedback. Final performance optimization across target browsers. Address remaining bugs. Marketing and community engagement.  
   * **Milestone 6 (Beta):** Game is stable, balanced based on beta feedback, and ready for public release.  
   * **Launch:** Deploy initial single-player version.

**Key Development Risks & Mitigation Strategies:**

* **RTS Complexity with Three.js:** Building all necessary RTS systems (pathfinding for many units, complex AI, robust UI interaction with 3D scene) from scratch or with minimal libraries is a major undertaking.  
  * **Mitigation:** Prioritize robust prototyping of these systems. Allocate significant development time. Start with simpler versions of systems and iterate. Focus on one feature at a time.  
* **Web Browser Performance:** Maintaining acceptable performance (framerate, responsiveness) with numerous 3D units, effects, and AI calculations.  
  * **Mitigation:** Continuous performance profiling from day one. Aggressive and early implementation of optimization techniques (LODs, instancing, texture atlasing, shader optimization). Set realistic targets for unit counts and visual fidelity.  
* **AI Development:** Creating AI that is challenging, believable, and fun to play against is notoriously difficult.  
  * **Mitigation:** Iterative AI development. Start with simple scripted behaviors and gradually add complexity. Study established RTS AI patterns. Focus on making AI behave reasonably before making it "smart."  
* **Scope Creep:** The desire to add more features, units, or complexity can derail the project.  
  * **Mitigation:** Adhere strictly to the defined scope for the initial single-player release. Defer non-essential features (including multiplayer) to post-launch updates. Regular review of project scope against timelines.

## **11\. Monetization Strategy (Post-Launch Consideration)**

The initial single-player focused release of **Nexus Clash: Strategos** will likely be one of the following:

* **Premium Title:** A one-time purchase price for the full single-player game.  
* **Free-to-Play with Full Unlock:** Offer a substantial demo (e.g., tutorial, one campaign, limited skirmish) for free, with a single IAP to unlock the full game content.

Future Monetization (If Multiplayer is Developed and Successful):  
If the game gains traction and multiplayer is implemented, the following could be considered, always adhering to a "no pay-to-win" philosophy:

* **Cosmetic Items:** Unit skins, base decals, announcer packs, UI themes.  
* **New Map Packs:** Paid DLC offering new sets of skirmish/multiplayer maps.  
* **New Factions or Mini-Campaigns:** Larger DLC packs introducing entirely new playable factions or standalone narrative campaigns.  
* **Battle Passes (Seasonal):** If a competitive multiplayer scene develops, seasonal battle passes offering cosmetic rewards and progression could be an option.

The primary goal of any monetization will be to fund further development and support the game, while respecting the player base and maintaining fair gameplay.

This document provides a comprehensive blueprint for **Nexus Clash: Strategos**. It will be a living document, subject to revision and refinement as development progresses and new insights are gained.