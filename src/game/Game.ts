import * as THREE from 'three';
import { CameraController } from '../core/CameraController';
import { InputManager } from '../core/InputManager';
import { Unit } from '../entities/Unit';
import { SoundManager } from '../SoundManager';
import { ResourceNode } from '../entities/ResourceNode';
import { Building, BuildingType } from '../entities/Building';

class EffectManager {
  private scene: THREE.Scene;
  private effects: { mesh: THREE.Mesh, ttl: number }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnAttackEffect(position: THREE.Vector3) {
    const geometry = new THREE.RingGeometry(0.6, 0.8, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 0.6;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.effects.push({ mesh, ttl: 0.3 });
  }

  public spawnDeathEffect(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.5, 12, 12);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 0.5;
    this.scene.add(mesh);
    this.effects.push({ mesh, ttl: 0.4 });
  }

  public update(deltaTime: number) {
    for (const effect of this.effects) {
      effect.ttl -= deltaTime;
      if (effect.mesh.material instanceof THREE.Material) {
        effect.mesh.material.opacity = Math.max(0, effect.ttl * 2);
      }
    }
    // Remove expired effects
    this.effects = this.effects.filter(effect => {
      if (effect.ttl <= 0) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        (effect.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });
  }
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cameraController: CameraController;
  private inputManager: InputManager;
  private units: Unit[] = [];
  private clock: THREE.Clock;
  private gameOver: boolean = false;
  private gameResult: 'win' | 'lose' | null = null;
  private overlayDiv: HTMLDivElement | null = null;
  private unitStatsDiv: HTMLDivElement | null = null;
  private minimapDiv: HTMLDivElement | null = null;
  private effectManager: EffectManager;
  private resourceNodes: ResourceNode[] = [];
  private resourceCounterDiv: HTMLDivElement | null = null;
  private selectedUnitIds: number[] = [];
  private buildings: Building[] = [];
  private isPlacingBuilding: boolean = false;
  private currentBuildingType: BuildingType | null = null;
  private ghostBuilding: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private productionOverlayDiv: HTMLDivElement | null = null;
  private buildingMenuDiv: HTMLDivElement | null = null;
  private selectedBuilding: Building | null = null;
  private buildingHighlight: THREE.Mesh | null = null;
  private buildingJustSelected: boolean = false;
  private lastProductionOverlayBuilding: Building | null = null;
  private lastProductionOverlayState: { isProducing: boolean; queue: number } | null = null;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Initialize clock for delta time
    this.clock = new THREE.Clock();

    // Initialize controllers
    this.cameraController = new CameraController(this.camera);
    this.effectManager = new EffectManager(this.scene);
    this.inputManager = new InputManager(
      this.cameraController,
      (...args) => { if (!this.gameOver) this.onUnitSelected(...args); },
      (...args) => { if (!this.gameOver) this.onMoveCommand(...args); },
      (...args) => { if (!this.gameOver) this.onAttackCommand(...args); },
      this.camera,
      this.scene
    );

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Create test units
    this.units.push(new Unit(1, new THREE.Vector3(0, 0.5, 0), this.scene, this.camera));
    this.units.push(new Unit(2, new THREE.Vector3(2, 0.5, 2), this.scene, this.camera));
    this.units.push(new Unit(3, new THREE.Vector3(-2, 0.5, -2), this.scene, this.camera));
    // Add a Harvester unit (yellow)
    this.units.push(new Unit(10, new THREE.Vector3(4, 0.5, -4), this.scene, this.camera, 5, 'Harvester'));

    // Create enemy units
    this.units.push(new Unit(4, new THREE.Vector3(5, 0.5, 5), this.scene, this.camera, 5, 'Enemy', true));
    this.units.push(new Unit(5, new THREE.Vector3(7, 0.5, 5), this.scene, this.camera, 5, 'Enemy', true));

    // Add units to scene
    this.units.forEach(unit => {
      this.scene.add(unit.getMesh());
    });

    // Add resource clusters (Promethium deposits)
    const clusterCenters = [
      new THREE.Vector3(8, 0, 0),
      new THREE.Vector3(-8, 0, 8),
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-12, 0, -8),
    ];
    this.resourceNodes = [];
    clusterCenters.forEach(center => {
      const clusterSize = Math.floor(Math.random() * 5) + 3; // 3-7 nodes
      for (let i = 0; i < clusterSize; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2 + 0.5;
        const offset = new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        const nodePos = center.clone().add(offset);
        const nodeAmount = Math.floor(Math.random() * 500) + 700; // 700-1200
        const node = new ResourceNode(nodePos, nodeAmount);
        // Randomize size a bit
        const scale = 0.7 + Math.random() * 0.8;
        node.getMesh().scale.set(scale, scale, scale);
        this.resourceNodes.push(node);
        this.scene.add(node.getMesh());
      }
    });

    // Load sound effects
    SoundManager.load('select', '/sounds/select.wav');
    SoundManager.load('move', '/sounds/move.wav');
    SoundManager.load('attack', '/sounds/attack.wav');

    // Set up event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mousedown', this.onMouseDown.bind(this));

    // Create overlay for win/lose
    this.overlayDiv = document.createElement('div');
    this.overlayDiv.style.position = 'fixed';
    this.overlayDiv.style.top = '0';
    this.overlayDiv.style.left = '0';
    this.overlayDiv.style.width = '100vw';
    this.overlayDiv.style.height = '100vh';
    this.overlayDiv.style.display = 'flex';
    this.overlayDiv.style.flexDirection = 'column';
    this.overlayDiv.style.alignItems = 'center';
    this.overlayDiv.style.justifyContent = 'center';
    this.overlayDiv.style.background = 'rgba(0,0,0,0.5)';
    this.overlayDiv.style.color = 'white';
    this.overlayDiv.style.fontSize = '4rem';
    this.overlayDiv.style.zIndex = '9999';
    this.overlayDiv.style.pointerEvents = 'none';
    this.overlayDiv.style.visibility = 'hidden';
    
    // Add message span
    const messageSpan = document.createElement('span');
    messageSpan.style.marginBottom = '2rem';
    this.overlayDiv.appendChild(messageSpan);
    
    // Add restart button
    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Restart';
    restartBtn.style.fontSize = '2rem';
    restartBtn.style.padding = '1rem 2rem';
    restartBtn.style.cursor = 'pointer';
    restartBtn.style.borderRadius = '0.5rem';
    restartBtn.style.border = 'none';
    restartBtn.style.background = '#222';
    restartBtn.style.color = 'white';
    restartBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    restartBtn.onclick = () => window.location.reload();
    restartBtn.tabIndex = 0;
    this.overlayDiv.appendChild(restartBtn);
    
    document.body.appendChild(this.overlayDiv);

    // Create unit stats overlay (bottom left)
    this.unitStatsDiv = document.createElement('div');
    this.unitStatsDiv.style.position = 'fixed';
    this.unitStatsDiv.style.left = '24px';
    this.unitStatsDiv.style.bottom = '24px';
    this.unitStatsDiv.style.minWidth = '220px';
    this.unitStatsDiv.style.maxWidth = '320px';
    this.unitStatsDiv.style.background = 'rgba(30,30,30,0.85)';
    this.unitStatsDiv.style.color = 'white';
    this.unitStatsDiv.style.fontSize = '1.1rem';
    this.unitStatsDiv.style.padding = '16px 20px 16px 20px';
    this.unitStatsDiv.style.borderRadius = '10px';
    this.unitStatsDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    this.unitStatsDiv.style.zIndex = '9998';
    this.unitStatsDiv.style.pointerEvents = 'none';
    this.unitStatsDiv.style.display = 'none';
    document.body.appendChild(this.unitStatsDiv);

    // Create minimap placeholder (bottom right)
    this.minimapDiv = document.createElement('div');
    this.minimapDiv.style.position = 'fixed';
    this.minimapDiv.style.right = '24px';
    this.minimapDiv.style.bottom = '24px';
    this.minimapDiv.style.width = '180px';
    this.minimapDiv.style.height = '180px';
    this.minimapDiv.style.background = 'rgba(40,40,40,0.85)';
    this.minimapDiv.style.border = '2px solid #888';
    this.minimapDiv.style.borderRadius = '10px';
    this.minimapDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    this.minimapDiv.style.zIndex = '9998';
    this.minimapDiv.style.display = 'flex';
    this.minimapDiv.style.alignItems = 'flex-end';
    this.minimapDiv.style.justifyContent = 'center';
    this.minimapDiv.style.pointerEvents = 'none';
    this.minimapDiv.innerHTML = '<span style="color:#fff;opacity:0.7;font-size:1.1rem;margin-bottom:10px;">Minimap (WIP)</span>';
    document.body.appendChild(this.minimapDiv);

    // Create global resource counter overlay (top left)
    this.resourceCounterDiv = document.createElement('div');
    this.resourceCounterDiv.style.position = 'fixed';
    this.resourceCounterDiv.style.left = '24px';
    this.resourceCounterDiv.style.top = '24px';
    this.resourceCounterDiv.style.background = 'rgba(30,30,60,0.85)';
    this.resourceCounterDiv.style.color = 'white';
    this.resourceCounterDiv.style.fontSize = '1.3rem';
    this.resourceCounterDiv.style.padding = '10px 18px';
    this.resourceCounterDiv.style.borderRadius = '8px';
    this.resourceCounterDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    this.resourceCounterDiv.style.zIndex = '9999';
    this.resourceCounterDiv.style.pointerEvents = 'none';
    document.body.appendChild(this.resourceCounterDiv);

    // Create production overlay (hidden by default)
    this.productionOverlayDiv = document.createElement('div');
    this.productionOverlayDiv.style.position = 'fixed';
    this.productionOverlayDiv.style.right = '24px';
    this.productionOverlayDiv.style.top = '24px';
    this.productionOverlayDiv.style.background = 'rgba(30,30,60,0.92)';
    this.productionOverlayDiv.style.color = 'white';
    this.productionOverlayDiv.style.fontSize = '1.2rem';
    this.productionOverlayDiv.style.padding = '18px 24px';
    this.productionOverlayDiv.style.borderRadius = '8px';
    this.productionOverlayDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    this.productionOverlayDiv.style.zIndex = '9999';
    this.productionOverlayDiv.style.display = 'none';
    this.productionOverlayDiv.style.pointerEvents = 'auto';
    this.productionOverlayDiv.addEventListener('mousedown', (e) => e.stopPropagation());
    this.productionOverlayDiv.addEventListener('mouseup', (e) => e.stopPropagation());
    this.productionOverlayDiv.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(this.productionOverlayDiv);

    // Create building menu overlay (hidden by default)
    this.buildingMenuDiv = document.createElement('div');
    this.buildingMenuDiv.style.position = 'fixed';
    this.buildingMenuDiv.style.left = '50%';
    this.buildingMenuDiv.style.top = '50%';
    this.buildingMenuDiv.style.transform = 'translate(-50%, -50%)';
    this.buildingMenuDiv.style.background = 'rgba(30,30,60,0.97)';
    this.buildingMenuDiv.style.color = 'white';
    this.buildingMenuDiv.style.fontSize = '1.3rem';
    this.buildingMenuDiv.style.padding = '32px 48px';
    this.buildingMenuDiv.style.borderRadius = '12px';
    this.buildingMenuDiv.style.boxShadow = '0 4px 24px rgba(0,0,0,0.35)';
    this.buildingMenuDiv.style.zIndex = '10000';
    this.buildingMenuDiv.style.display = 'none';
    this.buildingMenuDiv.style.textAlign = 'center';
    document.body.appendChild(this.buildingMenuDiv);

    // Create building selection highlight (hidden by default)
    const highlightGeometry = new THREE.RingGeometry(1.3, 1.6, 32);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    this.buildingHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    this.buildingHighlight.rotation.x = -Math.PI / 2;
    this.buildingHighlight.visible = false;
    this.scene.add(this.buildingHighlight);

    // Start animation loop
    this.animate();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onUnitSelected(unitIds: number[]): void {
    this.selectedUnitIds = unitIds;
    if (!this.buildingJustSelected) {
      this.selectedBuilding = null;
    }
    this.buildingJustSelected = false;
    this.units.forEach(unit => {
      unit.setSelected(unitIds.includes(unit.getId()));
    });
    if (unitIds.length > 0) {
      SoundManager.play('select');
    }
    this.updateUnitStatsOverlay();
    this.updateResourceCounter();
    this.updateProductionOverlay();
    this.updateBuildingHighlight();
  }

  private onMoveCommand(position: { x: number; y: number; z: number }): void {
    // Get selected units
    const selectedUnits = this.units.filter(unit => unit.isUnitSelected());
    const n = selectedUnits.length;
    if (n === 0) return;
    SoundManager.play('move');

    // Formation parameters
    const spacing = 1.5; // Distance between units
    const gridCols = Math.ceil(Math.sqrt(n));
    const gridRows = Math.ceil(n / gridCols);
    const center = new THREE.Vector3(position.x, position.y, position.z);

    // Calculate top-left corner of the grid
    const offsetX = -((gridCols - 1) * spacing) / 2;
    const offsetZ = -((gridRows - 1) * spacing) / 2;

    // Assign each unit a position in the grid
    selectedUnits.forEach((unit, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const target = new THREE.Vector3(
        center.x + offsetX + col * spacing,
        center.y,
        center.z + offsetZ + row * spacing
      );
      unit.moveTo(target);
    });
  }

  private onAttackCommand(targetId: number): void {
    // Get selected units
    const selectedUnits = this.units.filter(unit => unit.isUnitSelected());
    const targetUnit = this.units.find(unit => unit.getId() === targetId);
    // Check if right-clicked a resource node (by resourceId)
    const resourceNode = this.resourceNodes.find(node => node.getResourceId() === targetId);
    // If harvester(s) selected and resource node clicked, command to harvest
    if (selectedUnits.some(u => u.getUnitType() === 'Harvester')) {
      const harvesterUnits = selectedUnits.filter(u => u.getUnitType() === 'Harvester');
      if (resourceNode) {
        harvesterUnits.forEach(h => h.setHarvestTarget(resourceNode));
        return;
      }
    }
    // Otherwise, default to attack logic
    if (selectedUnits.length > 0 && targetUnit) {
      // Only allow attacking enemy units
      if (targetUnit.getIsEnemy()) {
        SoundManager.play('attack');
        selectedUnits.forEach(unit => {
          unit.setTarget(targetUnit);
          this.effectManager.spawnAttackEffect(targetUnit.getPosition());
        });
      }
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'b') {
      this.showBuildingMenu();
    }
    if (event.key === 'Escape' && this.isPlacingBuilding) {
      this.cancelBuildingPlacement();
    }
    if (event.key === 'Escape' && this.buildingMenuDiv && this.buildingMenuDiv.style.display === 'block') {
      this.hideBuildingMenu();
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.updateGhostBuilding();
  }

  private onMouseDown(event: MouseEvent): void {
    // If placing a building, handle placement and return early
    if (this.isPlacingBuilding && event.button === 0) {
      this.placeBuilding();
      return;
    }
    // Check if a building was clicked
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.camera);
    const buildingMeshes = this.buildings.map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(buildingMeshes);
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      const building = this.buildings.find(b => b.mesh === mesh) || null;
      if (building) {
        this.selectedBuilding = building;
        this.selectedUnitIds = [];
        this.buildingJustSelected = true;
        this.updateProductionOverlay();
        this.updateUnitStatsOverlay();
        this.updateBuildingHighlight();
        return;
      }
    }
    // If not clicking a building, deselect building
    this.selectedBuilding = null;
    this.updateBuildingHighlight();
    // ... existing code for unit selection ...
    // (call inputManager or existing unit selection logic)
  }

  private startBuildingPlacement(type: BuildingType): void {
    this.isPlacingBuilding = true;
    this.currentBuildingType = type;
    this.createGhostBuilding();
  }

  private createGhostBuilding(): void {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    this.ghostBuilding = new THREE.Mesh(geometry, material);
    this.scene.add(this.ghostBuilding);
  }

  private updateGhostBuilding(): void {
    if (!this.ghostBuilding || !this.isPlacingBuilding) return;
    // Use the ground plane for intersection
    const ground = this.scene.children.find(obj => obj.type === 'Mesh' && obj.rotation.x === -Math.PI / 2) as THREE.Mesh;
    if (!ground) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(ground);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.ghostBuilding.position.set(point.x, 1, point.z);
    }
  }

  private placeBuilding(): void {
    if (!this.ghostBuilding || !this.currentBuildingType) return;
    const position = this.ghostBuilding.position.clone();
    const building = new Building(this.currentBuildingType, position, this.scene, this.camera);
    // Wire up unit production callback
    building.onUnitProduced = (unit: Unit) => {
      this.units.push(unit);
      this.scene.add(unit.getMesh());
      SoundManager.play('select');
    };
    this.buildings.push(building);
    this.scene.add(building.mesh);
    this.cancelBuildingPlacement();
  }

  private cancelBuildingPlacement(): void {
    if (this.ghostBuilding) {
      this.scene.remove(this.ghostBuilding);
      this.ghostBuilding = null;
    }
    this.isPlacingBuilding = false;
    this.currentBuildingType = null;
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    if (this.gameOver) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const deltaTime = this.clock.getDelta();

    // Update units
    this.units.forEach(unit => {
      unit.update(deltaTime);
    });

    // Update buildings
    this.buildings.forEach(building => building.update(deltaTime));

    // Update effects
    this.effectManager.update(deltaTime);

    // Remove dead units
    const deadUnits = this.units.filter(unit => unit.isDead());
    deadUnits.forEach(unit => {
      // Spawn death effect at unit position
      this.effectManager.spawnDeathEffect(unit.getPosition());
      unit.cleanup(); // Clean up the unit's resources
    });
    this.units = this.units.filter(unit => !unit.isDead());

    // Remove depleted resource nodes
    const depletedNodes = this.resourceNodes.filter(node => node.isDepleted());
    depletedNodes.forEach(node => {
      this.scene.remove(node.getMesh());
    });
    this.resourceNodes = this.resourceNodes.filter(node => !node.isDepleted());

    // Check win/lose conditions
    const playerUnits = this.units.filter(u => !u.getIsEnemy());
    const enemyUnits = this.units.filter(u => u.getIsEnemy());
    if (!this.gameOver) {
      if (enemyUnits.length === 0) {
        this.endGame('win');
      } else if (playerUnits.length === 0) {
        this.endGame('lose');
      }
    }

    // Update resource counter every frame
    this.updateResourceCounter();

    // Update unit stats overlay every frame
    this.updateUnitStatsOverlay();

    // Update production overlay every frame
    this.updateProductionOverlay();

    // Update building highlight every frame
    this.updateBuildingHighlight();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  private endGame(result: 'win' | 'lose') {
    this.gameOver = true;
    this.gameResult = result;
    if (this.overlayDiv) {
      const messageSpan = this.overlayDiv.querySelector('span');
      if (messageSpan) {
        messageSpan.textContent = result === 'win' ? 'Victory!' : 'Defeat!';
      }
      this.overlayDiv.style.visibility = 'visible';
      this.overlayDiv.style.pointerEvents = 'auto';
    }
  }

  private updateResourceCounter() {
    if (!this.resourceCounterDiv) return;
    const total = this.units.filter(u => u.getUnitType() === 'Harvester').reduce((sum, h) => sum + (h.getCarriedResources?.() || 0), 0);
    this.resourceCounterDiv.textContent = `Resources: ${total}`;
  }

  private updateUnitStatsOverlay() {
    if (this.unitStatsDiv) {
      const selectedUnits = this.units.filter(unit => this.selectedUnitIds.includes(unit.getId()));
      if (selectedUnits.length === 0) {
        this.unitStatsDiv.style.display = 'none';
      } else {
        this.unitStatsDiv.innerHTML = `<b>Selected Units (${selectedUnits.length})</b><br><br>` +
          selectedUnits.map(unit => `
            <div style="margin-bottom: 10px;">
              <b>${unit.getUnitType()}</b> (ID: ${unit.getId()})<br>
              Health: ${unit['health']} / ${unit['maxHealth']}<br>
              Attack: ${unit['attackDamage'] ?? '-'}<br>
              Speed: ${unit['speed'] ?? '-'}<br>
              ${unit.getUnitType() === 'Harvester' ? `Carrying: ${unit.getCarriedResources?.() || 0}` : ''}
            </div>
          `).join('');
        this.unitStatsDiv.style.display = 'block';
      }
    }
  }

  private updateProductionOverlay() {
    if (!this.productionOverlayDiv) return;
    // Show if a Barracks is selected
    if (this.selectedBuilding && this.selectedBuilding.type === BuildingType.BARRACKS && this.selectedBuilding.isConstructed) {
      const selectedBarracks = this.selectedBuilding;
      // Only update if building or production state changed
      const currentState = { isProducing: selectedBarracks.isProducing, queue: selectedBarracks.productionQueue };
      if (
        this.lastProductionOverlayBuilding === selectedBarracks &&
        this.lastProductionOverlayState &&
        this.lastProductionOverlayState.isProducing === currentState.isProducing &&
        this.lastProductionOverlayState.queue === currentState.queue
      ) {
        // No change, do not update overlay
        return;
      }
      this.lastProductionOverlayBuilding = selectedBarracks;
      this.lastProductionOverlayState = currentState;
      console.log('[DEBUG] Showing production overlay for Barracks', selectedBarracks);
      this.productionOverlayDiv.style.display = 'block';
      this.productionOverlayDiv.style.pointerEvents = 'auto';
      let html = `<b>Barracks</b><br><br>`;
      if (selectedBarracks.isProducing) {
        const pct = Math.floor((selectedBarracks.productionProgress / selectedBarracks.productionTime) * 100);
        html += `<div style='margin-bottom:8px;'>Producing unit... <span style='color:#4caf50;'>${pct}%</span></div>`;
        html += `<div style='background:#222;border-radius:4px;width:180px;height:18px;overflow:hidden;margin-bottom:12px;'><div style='background:#4caf50;height:100%;width:${pct}%;'></div></div>`;
      }
      html += `<button id='produce-unit-btn' style='font-size:1rem;padding:8px 18px;border-radius:5px;background:#2196f3;color:white;border:none;cursor:pointer;'>Produce Unit</button>`;
      this.productionOverlayDiv.innerHTML = html;
      setTimeout(() => {
        const btn = document.getElementById('produce-unit-btn');
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            console.log('[DEBUG] Produce Unit button clicked');
            selectedBarracks.startUnitProduction();
            // Force overlay update after production state changes
            this.lastProductionOverlayState = null;
            this.updateProductionOverlay();
          };
        }
      }, 0);
    } else {
      this.productionOverlayDiv.style.display = 'none';
      this.lastProductionOverlayBuilding = null;
      this.lastProductionOverlayState = null;
    }
  }

  private showBuildingMenu() {
    if (!this.buildingMenuDiv) return;
    this.buildingMenuDiv.innerHTML = `
      <div style='margin-bottom:18px;font-size:1.5rem;'><b>Select Building to Place</b></div>
      <button id='menu-refinery' style='font-size:1.1rem;padding:14px 32px;margin:8px 0 16px 0;border-radius:8px;background:#4caf50;color:white;border:none;cursor:pointer;width:220px;'>Refinery</button><br>
      <button id='menu-barracks' style='font-size:1.1rem;padding:14px 32px;margin:8px 0 0 0;border-radius:8px;background:#2196f3;color:white;border:none;cursor:pointer;width:220px;'>Barracks</button>
      <div style='margin-top:24px;font-size:1rem;opacity:0.7;'>Press Escape to cancel</div>
    `;
    this.buildingMenuDiv.style.display = 'block';
    setTimeout(() => {
      const refineryBtn = document.getElementById('menu-refinery');
      const barracksBtn = document.getElementById('menu-barracks');
      if (refineryBtn) {
        refineryBtn.onclick = () => {
          this.hideBuildingMenu();
          this.startBuildingPlacement(BuildingType.REFINERY);
        };
      }
      if (barracksBtn) {
        barracksBtn.onclick = () => {
          this.hideBuildingMenu();
          this.startBuildingPlacement(BuildingType.BARRACKS);
        };
      }
    }, 0);
  }

  private hideBuildingMenu() {
    if (this.buildingMenuDiv) {
      this.buildingMenuDiv.style.display = 'none';
    }
  }

  private updateBuildingHighlight() {
    if (this.selectedBuilding && this.selectedBuilding.mesh) {
      this.buildingHighlight!.visible = true;
      this.buildingHighlight!.position.set(
        this.selectedBuilding.mesh.position.x,
        0.11, // Slightly above ground
        this.selectedBuilding.mesh.position.z
      );
    } else {
      this.buildingHighlight!.visible = false;
    }
  }
} 