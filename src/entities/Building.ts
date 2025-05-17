import * as THREE from 'three';
import { Unit } from './Unit';

export enum BuildingType {
  REFINERY = 'REFINERY',
  BARRACKS = 'BARRACKS',
}

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

  constructor(type: BuildingType, position: THREE.Vector3, scene: THREE.Scene, camera: THREE.Camera) {
    this.type = type;
    this.health = 100;
    this.maxHealth = 100;
    this.constructionTime = 5; // seconds
    this.constructionProgress = 0;
    this.isConstructed = false;
    this.scene = scene;
    this.camera = camera;

    // Use MeshStandardMaterial for lighting
    const material = new THREE.MeshStandardMaterial({
      color: type === BuildingType.REFINERY ? 0x4caf50 : 0x2196f3,
      metalness: 0.7,
      roughness: 0.3,
    });
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    this.mesh = new THREE.Mesh(geometry, material);
    // Position above ground (y = height / 2)
    this.mesh.position.set(position.x, 1, position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  startUnitProduction() {
    if (this.type !== BuildingType.BARRACKS) return;
    this.productionQueue++;
    console.log('[DEBUG] startUnitProduction called. Queue:', this.productionQueue);
    if (!this.isProducing) {
      this.isProducing = true;
      this.productionProgress = 0;
    }
  }

  update(deltaTime: number) {
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
    if (this.type === BuildingType.BARRACKS && this.isConstructed && this.isProducing) {
      this.productionProgress += deltaTime;
      if (this.productionProgress >= this.productionTime) {
        this.productionProgress = 0;
        this.productionQueue--;
        // Spawn a new unit next to the building
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