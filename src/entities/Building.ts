import * as THREE from 'three';
import { Unit } from './Unit';

export enum BuildingType {
  COMMAND_CENTER = 'COMMAND_CENTER',
  REFINERY = 'REFINERY',
  BARRACKS = 'BARRACKS',
  POWER_PLANT = 'POWER_PLANT',
  FACTORY = 'FACTORY',
  DEFENSE_TURRET = 'DEFENSE_TURRET',
}

export interface BuildingStats {
  health: number;
  powerOutput: number;
  powerConsumption: number;
  constructionTime: number;
  cost: number;
}

export const BUILDING_STATS: Record<BuildingType, BuildingStats> = {
  [BuildingType.COMMAND_CENTER]: {
    health: 1000,
    powerOutput: 50,
    powerConsumption: 0,
    constructionTime: 30,
    cost: 0,
  },
  [BuildingType.REFINERY]: {
    health: 400,
    powerOutput: 0,
    powerConsumption: 10,
    constructionTime: 15,
    cost: 100,
  },
  [BuildingType.BARRACKS]: {
    health: 500,
    powerOutput: 0,
    powerConsumption: 5,
    constructionTime: 20,
    cost: 150,
  },
  [BuildingType.POWER_PLANT]: {
    health: 300,
    powerOutput: 100,
    powerConsumption: 0,
    constructionTime: 10,
    cost: 200,
  },
  [BuildingType.FACTORY]: {
    health: 600,
    powerOutput: 0,
    powerConsumption: 15,
    constructionTime: 25,
    cost: 300,
  },
  [BuildingType.DEFENSE_TURRET]: {
    health: 200,
    powerOutput: 0,
    powerConsumption: 5,
    constructionTime: 8,
    cost: 100,
  },
};

export class Building {
  public mesh: THREE.Mesh;
  public type: BuildingType;
  public health: number;
  public maxHealth: number;
  public constructionTime: number;
  public constructionProgress: number;
  public isConstructed: boolean;
  public isProducing: boolean = false;
  public productionProgress: number = 0;
  public productionTime: number = 3; // seconds per unit
  public productionQueue: number = 0;
  public onUnitProduced?: (unit: Unit) => void;
  public scene: THREE.Scene;
  public camera: THREE.Camera;
  private powerEfficiency: number = 1;
  private powerOutput: number = 0;
  private powerConsumption: number = 0;
  private cost: number = 0;
  private healthBarSprite: THREE.Sprite;
  private healthBarCanvas: HTMLCanvasElement;
  private healthBarCtx: CanvasRenderingContext2D | null;
  private nameLabel: THREE.Sprite;
  private isSelected: boolean = false;
  private selectionRing: THREE.Mesh | null = null;

  constructor(type: BuildingType, position: THREE.Vector3, scene: THREE.Scene, camera: THREE.Camera) {
    this.type = type;
    this.scene = scene;
    this.camera = camera;

    // Get building stats
    const stats = BUILDING_STATS[type];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.powerOutput = stats.powerOutput;
    this.powerConsumption = stats.powerConsumption;
    this.constructionTime = stats.constructionTime;
    this.cost = stats.cost;
    this.constructionProgress = 0;
    this.isConstructed = false;

    // Create building mesh
    const material = new THREE.MeshStandardMaterial({
      color: this.getBuildingColor(),
      metalness: 0.7,
      roughness: 0.3,
    });
    const geometry = this.getBuildingGeometry();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position.x, this.getBuildingHeight() / 2, position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Create selection ring
    const ringGeometry = new THREE.RingGeometry(1.2, 1.4, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.visible = false;
    this.mesh.add(this.selectionRing);

    // Create health bar
    this.healthBarCanvas = document.createElement('canvas');
    this.healthBarCanvas.width = 128;
    this.healthBarCanvas.height = 16;
    this.healthBarCtx = this.healthBarCanvas.getContext('2d');
    const healthBarTexture = new THREE.CanvasTexture(this.healthBarCanvas);
    const healthBarMaterial = new THREE.SpriteMaterial({ map: healthBarTexture, transparent: true });
    this.healthBarSprite = new THREE.Sprite(healthBarMaterial);
    this.healthBarSprite.scale.set(1.2, 0.18, 1);
    this.healthBarSprite.position.set(0, this.getBuildingHeight() + 0.5, 0);
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
      nameCtx.strokeText(this.type, 128, 32);
      nameCtx.fillText(this.type, 128, 32);
    }
    const nameTexture = new THREE.CanvasTexture(nameCanvas);
    const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
    this.nameLabel = new THREE.Sprite(nameMaterial);
    this.nameLabel.scale.set(2, 0.5, 1);
    this.nameLabel.position.set(0, this.getBuildingHeight() + 0.8, 0);
    this.mesh.add(this.nameLabel);

    this.updateHealthBar();
  }

  private getBuildingColor(): number {
    switch (this.type) {
      case BuildingType.COMMAND_CENTER:
        return 0x2196f3; // Blue
      case BuildingType.REFINERY:
        return 0x4caf50; // Green
      case BuildingType.BARRACKS:
        return 0x9c27b0; // Purple
      case BuildingType.POWER_PLANT:
        return 0xff9800; // Orange
      case BuildingType.FACTORY:
        return 0xf44336; // Red
      case BuildingType.DEFENSE_TURRET:
        return 0x607d8b; // Blue Grey
      default:
        return 0x808080; // Gray
    }
  }

  private getBuildingGeometry(): THREE.BufferGeometry {
    switch (this.type) {
      case BuildingType.COMMAND_CENTER:
        return new THREE.BoxGeometry(4, 3, 4);
      case BuildingType.REFINERY:
        return new THREE.CylinderGeometry(1, 1.5, 2, 8);
      case BuildingType.BARRACKS:
        return new THREE.BoxGeometry(3, 2, 3);
      case BuildingType.POWER_PLANT:
        return new THREE.CylinderGeometry(1, 1, 2, 8);
      case BuildingType.FACTORY:
        return new THREE.BoxGeometry(3, 2.5, 4);
      case BuildingType.DEFENSE_TURRET:
        return new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
      default:
        return new THREE.BoxGeometry(2, 2, 2);
    }
  }

  private getBuildingHeight(): number {
    switch (this.type) {
      case BuildingType.COMMAND_CENTER:
        return 3;
      case BuildingType.REFINERY:
        return 2;
      case BuildingType.BARRACKS:
        return 2;
      case BuildingType.POWER_PLANT:
        return 2;
      case BuildingType.FACTORY:
        return 2.5;
      case BuildingType.DEFENSE_TURRET:
        return 1.5;
      default:
        return 2;
    }
  }

  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (this.selectionRing) {
      this.selectionRing.visible = selected;
    }
  }

  public isBuildingSelected(): boolean {
    return this.isSelected;
  }

  public setPowerEfficiency(efficiency: number): void {
    this.powerEfficiency = Math.max(0, Math.min(1, efficiency));
  }

  public getPowerEfficiency(): number {
    return this.powerEfficiency;
  }

  public getPowerOutput(): number {
    return this.isConstructed ? this.powerOutput * this.powerEfficiency : 0;
  }

  public getPowerConsumption(): number {
    return this.isConstructed ? this.powerConsumption : 0;
  }

  public getCost(): number {
    return this.cost;
  }

  private cachedPosition: THREE.Vector3 | null = null;

   public getPosition(): THREE.Vector3 {
    // Only clone when position has changed
    if (!this.cachedPosition || !this.cachedPosition.equals(this.mesh.position)) {
      this.cachedPosition = this.mesh.position.clone();
    }
    return this.cachedPosition;
   }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    if (this.health <= 0) {
      this.destroy();
    }
  }

  private disposeMaterial(material: THREE.Material | THREE.Material[]): void {
    if (Array.isArray(material)) {
      material.forEach(m => this.disposeMaterial(m));
      return;
    }
    
    // Dispose texture if present
    if ('map' in material && material.map) {
      material.map.dispose();
    }
    material.dispose();
  }

   private destroy(): void {
     // Remove from scene
     this.scene.remove(this.mesh);
     // Clean up resources
     this.healthBarCanvas.remove();
     // Dispose mesh geometry and material
     this.mesh.geometry.dispose();
    this.disposeMaterial(this.mesh.material);
     // Dispose selection ring
     if (this.selectionRing) {
       this.selectionRing.geometry.dispose();
      this.disposeMaterial(this.selectionRing.material);
     }
     // Dispose health bar sprite texture and material
    this.disposeMaterial(this.healthBarSprite.material);
     // Dispose name label texture and material
    this.disposeMaterial(this.nameLabel.material);
   }

  private updateHealthBar(): void {
    if (!this.healthBarCtx) return;
    const healthPercent = this.health / this.maxHealth;
    
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
  }

  public startUnitProduction() {
    if (this.type !== BuildingType.BARRACKS && this.type !== BuildingType.FACTORY) return;
    this.productionQueue++;
    if (!this.isProducing) {
      this.isProducing = true;
      this.productionProgress = 0;
    }
  }

  public update(deltaTime: number) {
    if (!this.isConstructed) {
      this.constructionProgress += deltaTime;
      if (this.constructionProgress >= this.constructionTime) {
        this.isConstructed = true;
        (this.mesh.material as THREE.Material).opacity = 1;
        (this.mesh.material as THREE.Material).transparent = false;
      } else {
        (this.mesh.material as THREE.Material).opacity = 0.5;
        (this.mesh.material as THREE.Material).transparent = true;
      }
    }

    if ((this.type === BuildingType.BARRACKS || this.type === BuildingType.FACTORY) && 
        this.isConstructed && this.isProducing) {
      this.productionProgress += deltaTime * this.powerEfficiency;
      if (this.productionProgress >= this.productionTime) {
        this.productionProgress = 0;
        this.productionQueue--;
        if (this.onUnitProduced) {
          const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(2, 0, 0));
          const newUnit = new Unit(Date.now(), spawnPos, this.scene, this.camera);
          this.onUnitProduced(newUnit);
        }
        if (this.productionQueue > 0) {
          this.isProducing = true;
        } else {
          this.isProducing = false;
        }
      }
    }
  }
} 