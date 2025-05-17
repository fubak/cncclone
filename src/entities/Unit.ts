import * as THREE from 'three';
import { MovementIndicator } from './MovementIndicator';
import { ResourceNode } from './ResourceNode';
import { Building } from './Building';

export enum UnitType {
  INFANTRY = 'INFANTRY',
  HARVESTER = 'HARVESTER',
  TANK = 'TANK',
  ARTILLERY = 'ARTILLERY',
  ANTI_AIR = 'ANTI_AIR',
  SCOUT = 'SCOUT',
}

export interface UnitStats {
  health: number;
  speed: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  cost: number;
  productionTime: number;
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.INFANTRY]: {
    health: 100,
    speed: 5,
    attackDamage: 10,
    attackRange: 2,
    attackCooldown: 1,
    cost: 50,
    productionTime: 10,
  },
  [UnitType.HARVESTER]: {
    health: 80,
    speed: 4,
    attackDamage: 0,
    attackRange: 0,
    attackCooldown: 0,
    cost: 100,
    productionTime: 15,
  },
  [UnitType.TANK]: {
    health: 200,
    speed: 3,
    attackDamage: 25,
    attackRange: 3,
    attackCooldown: 1.5,
    cost: 150,
    productionTime: 20,
  },
  [UnitType.ARTILLERY]: {
    health: 120,
    speed: 2,
    attackDamage: 40,
    attackRange: 8,
    attackCooldown: 3,
    cost: 200,
    productionTime: 25,
  },
  [UnitType.ANTI_AIR]: {
    health: 90,
    speed: 4,
    attackDamage: 15,
    attackRange: 5,
    attackCooldown: 0.8,
    cost: 120,
    productionTime: 15,
  },
  [UnitType.SCOUT]: {
    health: 60,
    speed: 7,
    attackDamage: 5,
    attackRange: 1,
    attackCooldown: 0.5,
    cost: 80,
    productionTime: 8,
  },
};

export class Unit {
  private id: number;
  private mesh: THREE.Mesh;
  private stats: UnitStats;
  private targetPosition: THREE.Vector3 | null = null;
  private isSelected: boolean = false;
  private selectionCircle: THREE.Mesh | null = null;
  private movementIndicator: MovementIndicator;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private health: number;
  private maxHealth: number;
  private healthBarSprite: THREE.Sprite;
  private healthBarCanvas: HTMLCanvasElement;
  private healthBarCtx: CanvasRenderingContext2D | null;
  private unitType: UnitType;
  private nameLabel: THREE.Sprite;
  private targetUnit: Unit | null = null;
  private isEnemy: boolean = false;
  private harvestTarget: ResourceNode | null = null;
  private returnTarget: Building | null = null;
  private harvestCooldown: number = 1.0;
  private lastHarvestTime: number = 0;
  private carriedResources: number = 0;
  private maxCarriedResources: number = 100;
  private harvestRate: number = 50;
  private onResourceDeposited?: (amount: number) => void;
  private lastAttackTime: number = 0;
  private projectilePool: THREE.Mesh[] = [];
  private maxProjectiles: number = 20;
  private attackEffect: THREE.Mesh | null = null;

  constructor(
    id: number,
    position: THREE.Vector3,
    scene: THREE.Scene,
    camera: THREE.Camera,
    unitType: UnitType = UnitType.INFANTRY,
    isEnemy: boolean = false
  ) {
    this.id = id;
    this.scene = scene;
    this.camera = camera;
    this.unitType = unitType;
    this.isEnemy = isEnemy;
    this.stats = UNIT_STATS[unitType];
    this.health = this.stats.health;
    this.maxHealth = this.stats.health;

    // Create unit mesh
    const geometry = this.getUnitGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: this.getUnitColor(),
      metalness: 0.7,
      roughness: 0.3,
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

    // Create movement indicator
    this.movementIndicator = new MovementIndicator();
    this.scene.add(this.movementIndicator.getMesh());

    // Create health bar
    this.healthBarCanvas = document.createElement('canvas');
    this.healthBarCanvas.width = 128;
    this.healthBarCanvas.height = 16;
    this.healthBarCtx = this.healthBarCanvas.getContext('2d');
    const healthBarTexture = new THREE.CanvasTexture(this.healthBarCanvas);
    const healthBarMaterial = new THREE.SpriteMaterial({ map: healthBarTexture, transparent: true });
    this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
    this.healthBarSprite.scale.set(1.2, 0.18, 1);
    this.healthBarSprite.position.set(0, 1.0, 0);
    this.mesh.add(this.healthBarSprite);

    // Create name label
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
    const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
    this.nameLabel = new THREE.Sprite(nameMaterial);
    this.nameLabel.scale.set(2, 0.5, 1);
    this.nameLabel.position.set(0, 1.3, 0);
    this.mesh.add(this.nameLabel);

    // Initialize projectile pool
    this.initializeProjectilePool();

    this.updateHealthBar();
  }

  private getUnitGeometry(): THREE.BufferGeometry {
    switch (this.unitType) {
      case UnitType.INFANTRY:
        return new THREE.BoxGeometry(0.8, 1.2, 0.8);
      case UnitType.HARVESTER:
        return new THREE.BoxGeometry(1, 1, 1.5);
      case UnitType.TANK:
        return new THREE.BoxGeometry(1.5, 0.8, 2);
      case UnitType.ARTILLERY:
        return new THREE.BoxGeometry(1.2, 1, 2);
      case UnitType.ANTI_AIR:
        return new THREE.BoxGeometry(1, 1.5, 1);
      case UnitType.SCOUT:
        return new THREE.BoxGeometry(0.6, 0.8, 0.6);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private getUnitColor(): number {
    if (this.isEnemy) return 0xff0000;
    switch (this.unitType) {
      case UnitType.INFANTRY:
        return 0x2196f3;
      case UnitType.HARVESTER:
        return 0xffcc00;
      case UnitType.TANK:
        return 0x4caf50;
      case UnitType.ARTILLERY:
        return 0x9c27b0;
      case UnitType.ANTI_AIR:
        return 0xf44336;
      case UnitType.SCOUT:
        return 0x00bcd4;
      default:
        return 0x808080;
    }
  }

  private initializeProjectilePool(): void {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    for (let i = 0; i < this.maxProjectiles; i++) {
      const projectile = new THREE.Mesh(geometry, material);
      projectile.visible = false;
      this.scene.add(projectile);
      this.projectilePool.push(projectile);
    }
  }

  private getProjectile(): THREE.Mesh | null {
    return this.projectilePool.find(p => !p.visible) || null;
  }

  private fireProjectile(target: THREE.Vector3): void {
    const projectile = this.getProjectile();
    if (!projectile) return;

    const startPos = this.mesh.position.clone();
    startPos.y += 0.5;
    projectile.position.copy(startPos);
    projectile.visible = true;

    const direction = target.clone().sub(startPos).normalize();
    const distance = startPos.distanceTo(target);
    const speed = 20;
    const duration = distance / speed;

    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= duration) {
        projectile.visible = false;
        return;
      }

      const progress = elapsed / duration;
      projectile.position.lerpVectors(startPos, target, progress);
      requestAnimationFrame(animate);
    };

    animate();
  }

  public attack(target: Unit): void {
    if (!target || target.isDead()) {
      this.targetUnit = null;
      return;
    }

    const now = performance.now() / 1000;
    if (now - this.lastAttackTime >= this.stats.attackCooldown) {
      // Fire projectile
      const targetPos = target.getPosition().clone();
      targetPos.y += 0.5;
      this.fireProjectile(targetPos);

      // Deal damage
      target.takeDamage(this.stats.attackDamage);
      this.lastAttackTime = now;
    }
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
  }

  public isDead(): boolean {
    return this.health <= 0;
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

    // Update health bar and name label positions
    const unitPos = this.mesh.position;
    this.updateHealthBar();

    // Harvester logic
    if (this.unitType === UnitType.HARVESTER) {
      if (this.harvestTarget && this.carriedResources < this.maxCarriedResources) {
        const dist = this.mesh.position.distanceTo(this.harvestTarget.getPosition());
        if (dist > 1.5) {
          // Move toward resource
          const direction = this.harvestTarget.getPosition().clone().sub(this.mesh.position);
          direction.normalize();
          const movement = direction.multiplyScalar(this.stats.speed * deltaTime);
          this.mesh.position.add(movement);
        } else if (!this.harvestTarget.isDepleted()) {
          // In range, gather resources
          const now = performance.now() / 1000;
          if (now - this.lastHarvestTime >= this.harvestCooldown) {
            const gathered = this.harvestTarget.harvest(this.harvestRate);
            this.carriedResources += gathered;
            this.lastHarvestTime = now;
            
            // If full or resource depleted, start returning
            if (this.carriedResources >= this.maxCarriedResources || this.harvestTarget.isDepleted()) {
              this.harvestTarget = null;
              if (this.returnTarget && this.returnTarget.mesh) {
                this.moveTo(this.returnTarget.mesh.position);
              }
            }
          }
        } else {
          this.harvestTarget = null;
        }
      } else if (this.returnTarget && this.carriedResources > 0) {
        const dist = this.mesh.position.distanceTo(this.returnTarget.mesh.position);
        if (dist > 1.5) {
          // Move toward return target
          const direction = this.returnTarget.mesh.position.clone().sub(this.mesh.position);
          direction.normalize();
          const movement = direction.multiplyScalar(this.stats.speed * deltaTime);
          this.mesh.position.add(movement);
        } else {
          // Deposit resources
          if (this.onResourceDeposited) {
            this.onResourceDeposited(this.carriedResources);
          }
          this.carriedResources = 0;
          
          // Return to harvesting if there's a target
          if (this.harvestTarget) {
            this.moveTo(this.harvestTarget.getPosition());
          }
        }
      }
      return;
    }

    // Combat logic
    if (this.targetUnit) {
      const distanceToTarget = this.mesh.position.distanceTo(this.targetUnit.getPosition());
      
      if (distanceToTarget <= this.stats.attackRange) {
        // In range, attack if cooldown is ready
        this.attack(this.targetUnit);
      } else {
        // Move towards target
        const direction = this.targetUnit.getPosition().clone().sub(this.mesh.position);
        direction.normalize();
        const movement = direction.multiplyScalar(this.stats.speed * deltaTime);
        this.mesh.position.add(movement);
      }
    } else if (this.targetPosition) {
      const direction = this.targetPosition.clone().sub(this.mesh.position);
      const distance = direction.length();

      if (distance > 0.1) {
        direction.normalize();
        const movement = direction.multiplyScalar(this.stats.speed * deltaTime);
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

  public setUnitType(type: UnitType): void {
    this.unitType = type;
    this.stats = UNIT_STATS[type];
    this.health = this.stats.health;
    this.maxHealth = this.stats.health;
    this.updateNameLabel();
  }

  public getUnitType(): UnitType {
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

  public setTarget(target: Unit | null): void {
    this.targetUnit = target;
    this.targetPosition = null; // Clear movement target when attacking
  }

  public cleanup(): void {
    // Clean up projectiles
    this.projectilePool.forEach(projectile => {
      this.scene.remove(projectile);
      projectile.geometry.dispose();
      (projectile.material as THREE.Material).dispose();
    });

    // Clean up other resources
    this.scene.remove(this.mesh);
    this.scene.remove(this.movementIndicator.getMesh());
    this.healthBarCanvas.remove();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }

  public getIsEnemy(): boolean {
    return this.isEnemy;
  }

  public setHarvestTarget(resourceNode: ResourceNode) {
    this.harvestTarget = resourceNode;
    this.returnTarget = null; // Clear return target when starting new harvest
    if (resourceNode) {
      this.moveTo(resourceNode.getPosition());
    }
  }

  public setReturnTarget(building: Building) {
    this.returnTarget = building;
  }

  public setOnResourceDeposited(callback: (amount: number) => void) {
    this.onResourceDeposited = callback;
  }

  public getCarriedResources(): number {
    return this.carriedResources;
  }
} 