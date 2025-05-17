# Nexus Clash: Strategos

A modern real-time strategy game built with Three.js, set in a near-future world where two global factions compete for control over Promethium Crystal deposits.

## Gameplay Features

- **Resource System:** Promethium resource nodes appear in clusters of various sizes. Each node shrinks and disappears as it is depleted.
- **Harvester Unit:** Special yellow harvester units can be selected and commanded to harvest from resource clusters. Harvesters gather resources over time and display their carried amount in real time.
- **Real-Time UI Overlays:**
  - Selected unit stats (bottom left)
  - Global resource counter (top left)
  - Minimap placeholder (bottom right)
- **All overlays update live as the game progresses.**
- **Building Construction System:** Place and build structures (e.g., refineries, barracks) with real-time ghost preview and finalized placement. Buildings now use metallic/rough materials for improved visuals.
- **Building Selection & Highlight:** Click buildings to select them, with a visible highlight ring.
- **Barracks Unit Production:** Select a Barracks to open a robust production UI, queue units, and see real-time progress.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the game at `http://localhost:3002`

## Project Structure

- `src/` - Source code
  - `main.ts` - Main game entry point
  - `utils/` - Utility classes and functions
- `docs/` - Project documentation
- `dist/` - Production build output

## Technologies Used

- Three.js for 3D rendering (with advanced materials for buildings)
- TypeScript for type safety
- Vite for build tooling
- Docker for containerization
- Nginx for production serving

## License

This project is proprietary and confidential.

## Known Issues
- SoundManager: NotSupportedError for missing or unsupported sound files (e.g., select.wav)

## Troubleshooting
- If you see a NotSupportedError in the console, ensure all sound files (e.g., select.wav, move.wav, attack.wav) exist in the public/sounds/ directory and are supported by your browser.