import * as THREE from 'three';

export class MovementIndicator {
  private mesh: THREE.Mesh;
  private arrowMesh: THREE.Mesh;
  private targetPosition: THREE.Vector3;
  private isVisible: boolean = false;
  private fadeOutTime: number = 0;
  private readonly FADE_DURATION: number = 1.0; // seconds

  constructor() {
    // Create the target circle
    const circleGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(circleGeometry, circleMaterial);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.visible = false;

    // Create the direction arrow
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0);
    arrowShape.lineTo(-0.2, 0.5);
    arrowShape.lineTo(0.2, 0.5);
    arrowShape.lineTo(0, 0);

    const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
    this.arrowMesh.rotation.x = -Math.PI / 2;
    this.arrowMesh.visible = false;

    // Add arrow to the circle
    this.mesh.add(this.arrowMesh);

    this.targetPosition = new THREE.Vector3();
  }

  public show(position: THREE.Vector3, direction: THREE.Vector3): void {
    this.targetPosition.copy(position);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.1; // Slightly above ground

    // Calculate arrow rotation
    const angle = Math.atan2(direction.x, direction.z);
    this.arrowMesh.rotation.z = angle;

    this.mesh.visible = true;
    this.arrowMesh.visible = true;
    this.isVisible = true;
    this.fadeOutTime = 0;
  }

  public update(deltaTime: number): void {
    if (this.isVisible) {
      this.fadeOutTime += deltaTime;
      if (this.fadeOutTime >= this.FADE_DURATION) {
        this.hide();
      } else {
        const opacity = 0.8 * (1 - this.fadeOutTime / this.FADE_DURATION);
        (this.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        (this.arrowMesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    }
  }

  public hide(): void {
    this.mesh.visible = false;
    this.arrowMesh.visible = false;
    this.isVisible = false;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
} 