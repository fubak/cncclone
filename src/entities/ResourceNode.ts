import * as THREE from 'three';

export class ResourceNode {
  private mesh: THREE.Mesh;
  private position: THREE.Vector3;
  private amount: number;
  private maxAmount: number;
  private static nextId: number = 1;
  private resourceId: number;

  constructor(position: THREE.Vector3, amount: number = 1000) {
    this.position = position.clone();
    this.amount = amount;
    this.maxAmount = amount;
    this.resourceId = ResourceNode.nextId++;
    // Simple blue crystal/cylinder mesh
    const geometry = new THREE.CylinderGeometry(0.6, 0.8, 0.5, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0x3399ff, emissive: 0x224488, metalness: 0.5, roughness: 0.3 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 0.25; // Stand on ground, match new height
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.resourceId = this.resourceId;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getAmount(): number {
    return this.amount;
  }

  public harvest(amount: number): number {
    const harvested = Math.min(this.amount, amount);
    this.amount -= harvested;
    // Optionally scale mesh down as depleted
    this.mesh.scale.y = Math.max(0.2, this.amount / this.maxAmount);
    return harvested;
  }

  public isDepleted(): boolean {
    return this.amount <= 0;
  }

  public getResourceId(): number {
    return this.resourceId;
  }
} 