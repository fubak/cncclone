import * as THREE from 'three';
import { MovementIndicator } from './MovementIndicator';

export class Unit {
  private id: number;
  private mesh: THREE.Mesh;
  private speed: number;
  private targetPosition: THREE.Vector3 | null = null;
  private isSelected: boolean = false;
  private selectionCircle: THREE.Mesh | null = null;
  private movementIndicator: MovementIndicator;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private health: number = 100;
  private maxHealth: number = 100;
  private healthBarSprite: THREE.Sprite;
  private healthBarCanvas: HTMLCanvasElement;
  private healthBarCtx: CanvasRenderingContext2D | null;
  private unitType: string = 'Unit';
  private nameLabel: THREE.Sprite;
  private attackRange: number = 2;
  private attackDamage: number = 10;
  private attackCooldown: number = 1;
  private lastAttackTime: number = 0;
  private targetUnit: Unit | null = null;
  private isEnemy: boolean = false;
  private harvestTarget: any = null; // ResourceNode
  private harvestCooldown: number = 1.0; // seconds per gather
  private lastHarvestTime: number = 0;
  private carriedResources: number = 0;

  constructor(id: number, position: THREE.Vector3, scene: THREE.Scene, camera: THREE.Camera, speed: number = 5, unitType: string = 'Unit', isEnemy: boolean = false) {
    this.id = id;
    this.speed = speed;
    this.scene = scene;
    this.camera = camera;
    this.unitType = unitType;
    this.isEnemy = isEnemy;

    // Create a simple cube mesh for the unit
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    let color = 0x00ff00;
    if (isEnemy) color = 0xff0000;
    else if (unitType === 'Harvester') color = 0xffcc00;
    const material = new THREE.MeshStandardMaterial({ 
      color: color
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.userData.unitId = id;

    // Create selection circle
    const circleGeometry = new THREE.RingGeometry(0.6, 0.7, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    this.selectionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    this.selectionCircle.rotation.x = -Math.PI / 2;
    this.selectionCircle.visible = false;
    this.mesh.add(this.selectionCircle);

    // Create movement indicator and add it to the scene
    this.movementIndicator = new MovementIndicator();
    this.scene.add(this.movementIndicator.getMesh());

    // Create health bar sprite (always faces camera)
    this.healthBarCanvas = document.createElement('canvas');
    this.healthBarCanvas.width = 128;
    this.healthBarCanvas.height = 16;
    this.healthBarCtx = this.healthBarCanvas.getContext('2d');
    const healthBarTexture = new THREE.CanvasTexture(this.healthBarCanvas);
    const healthBarMaterial = new THREE.SpriteMaterial({ map: healthBarTexture, transparent: true });
    this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
    this.healthBarSprite.scale.set(1.2, 0.18, 1); // width, height, depth
    this.healthBarSprite.position.set(0, 1.0, 0); // Above the unit
    this.mesh.add(this.healthBarSprite);

    // Create name label sprite
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nameCtx = nameCanvas.getContext('2d');
    if (nameCtx) {
      nameCtx.font = '32px Arial';
      nameCtx.textAlign = 'center';
      nameCtx.textBaseline = 'middle';
      nameCtx.fillStyle = 'white';
      nameCtx.strokeStyle = 'black';
      nameCtx.lineWidth = 4;
      nameCtx.strokeText(this.unitType, 128, 32);
      nameCtx.fillText(this.unitType, 128, 32);
    }
    const nameTexture = new THREE.CanvasTexture(nameCanvas);
    const spriteMat = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
    this.nameLabel = new THREE.Sprite(spriteMat);
    this.nameLabel.scale.set(2, 0.5, 1);
    this.nameLabel.position.set(0, 1.3, 0); // Above the health bar
    this.scene.add(this.nameLabel);
  }

  public getId(): number {
    return this.id;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (this.selectionCircle) {
      this.selectionCircle.visible = selected;
    }
  }

  public isUnitSelected(): boolean {
    return this.isSelected;
  }

  public moveTo(position: THREE.Vector3): void {
    this.targetPosition = position.clone();
    
    // Show movement indicator
    if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.mesh.position).normalize();
      this.movementIndicator.show(this.targetPosition, direction);
    }
  }

  public update(deltaTime: number): void {
    // Update movement indicator
    this.movementIndicator.update(deltaTime);

    // Update health bar and name label positions to follow the unit
    const unitPos = this.mesh.position;
    this.nameLabel.position.set(unitPos.x, unitPos.y + 1.3, unitPos.z);
    this.updateHealthBar();

    // Harvester logic
    if (this.unitType === 'Harvester' && this.harvestTarget) {
      const dist = this.mesh.position.distanceTo(this.harvestTarget.getPosition());
      if (dist > 1.5) {
        // Move toward resource
        const direction = this.harvestTarget.getPosition().clone().sub(this.mesh.position);
        direction.normalize();
        const movement = direction.multiplyScalar(this.speed * deltaTime);
        this.mesh.position.add(movement);
      } else if (!this.harvestTarget.isDepleted()) {
        // In range, gather resources
        const now = performance.now() / 1000;
        if (now - this.lastHarvestTime >= this.harvestCooldown) {
          const gathered = this.harvestTarget.harvest(50); // Gather 50 per tick
          this.carriedResources += gathered;
          this.lastHarvestTime = now;
        }
      }
      if (this.harvestTarget.isDepleted()) {
        this.harvestTarget = null;
      }
      return;
    }

    // Handle movement and attacking
    if (this.targetUnit) {
      const distanceToTarget = this.mesh.position.distanceTo(this.targetUnit.getPosition());
      
      if (distanceToTarget <= this.attackRange) {
        // In range, attack if cooldown is ready
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
          this.attack(this.targetUnit);
          this.lastAttackTime = currentTime;
        }
      } else {
        // Move towards target
        const direction = this.targetUnit.getPosition().clone().sub(this.mesh.position);
        direction.normalize();
        const movement = direction.multiplyScalar(this.speed * deltaTime);
        this.mesh.position.add(movement);
      }
    } else if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.mesh.position);
      const distance = direction.length();

      if (distance > 0.1) {
        direction.normalize();
        const movement = direction.multiplyScalar(this.speed * deltaTime);
        this.mesh.position.add(movement);
      } else {
        this.targetPosition = null;
      }
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public setPosition(position: THREE.Vector3): void {
    this.mesh.position.copy(position);
  }

  public setHealth(health: number): void {
    this.health = Math.max(0, Math.min(health, this.maxHealth));
    this.updateHealthBar();
  }

  private updateHealthBar(): void {
    const healthPercent = this.health / this.maxHealth;
    if (!this.healthBarCtx) return;
    // Clear
    this.healthBarCtx.clearRect(0, 0, this.healthBarCanvas.width, this.healthBarCanvas.height);
    // Draw background
    this.healthBarCtx.fillStyle = 'rgba(0,0,0,0.5)';
    this.healthBarCtx.fillRect(0, 0, this.healthBarCanvas.width, this.healthBarCanvas.height);
    // Draw health
    let color = '#00ff00';
    if (healthPercent <= 0.2) color = '#ff0000';
    else if (healthPercent <= 0.5) color = '#ffff00';
    this.healthBarCtx.fillStyle = color;
    this.healthBarCtx.fillRect(2, 2, (this.healthBarCanvas.width - 4) * healthPercent, this.healthBarCanvas.height - 4);
    // Update texture
    const mat = this.healthBarSprite.material as THREE.SpriteMaterial;
    if (mat.map) {
      mat.map.needsUpdate = true;
    }
    this.healthBarSprite.visible = true;
  }

  public setUnitType(type: string): void {
    this.unitType = type;
    this.updateNameLabel();
  }

  public getUnitType(): string {
    return this.unitType;
  }

  private updateNameLabel(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeText(this.unitType, 128, 32);
      ctx.fillText(this.unitType, 128, 32);
      const newTexture = new THREE.CanvasTexture(canvas);
      (this.nameLabel.material as THREE.SpriteMaterial).map = newTexture;
      (this.nameLabel.material as THREE.SpriteMaterial).map.needsUpdate = true;
    }
  }

  public attack(target: Unit): void {
    if (target) {
      target.takeDamage(this.attackDamage);
    }
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
  }

  public setTarget(target: Unit | null): void {
    this.targetUnit = target;
    this.targetPosition = null; // Clear movement target when attacking
  }

  public cleanup(): void {
    // Remove all meshes from scene
    this.scene.remove(this.healthBarSprite);
    this.scene.remove(this.nameLabel);
    this.scene.remove(this.movementIndicator.getMesh());
    this.scene.remove(this.mesh);
    
    // Dispose of health bar sprite material/texture
    (this.healthBarSprite.material as THREE.SpriteMaterial).map?.dispose();
    this.healthBarSprite.material.dispose();
    this.nameLabel.material.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  public getIsEnemy(): boolean {
    return this.isEnemy;
  }

  public setHarvestTarget(resourceNode: any) {
    this.harvestTarget = resourceNode;
    this.targetUnit = null;
    this.targetPosition = resourceNode ? resourceNode.getPosition().clone() : null;
  }

  public getCarriedResources(): number {
    return this.carriedResources;
  }
} 