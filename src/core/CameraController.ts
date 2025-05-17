import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private desiredTarget: THREE.Vector3;
  private distance: number;
  private minDistance: number = 5;
  private maxDistance: number = 50;
  private minPolarAngle: number = Math.PI / 6; // 30 degrees
  private maxPolarAngle: number = Math.PI / 2.5; // 72 degrees
  private rotationSpeed: number = 0.5;
  private zoomSpeed: number = 0.5;
  private panSpeed: number = 0.5;
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private mapMinX: number = -25;
  private mapMaxX: number = 25;
  private mapMinZ: number = -25;
  private mapMaxZ: number = 25;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.target = new THREE.Vector3(0, 0, 0);
    this.desiredTarget = this.target.clone();
    this.distance = 20;
    this.updateCameraPosition();
  }

  public onMouseDown(event: MouseEvent): void {
    if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] onMouseDown', {button: event.button, isDragging: this.isDragging});
    if (event.button === 1 || event.button === 2) { // Middle or right mouse button
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
      if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] Drag start', this.previousMousePosition);
    }
  }

  public onMouseUp(event: MouseEvent): void {
    if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] onMouseUp', {button: event.button, isDragging: this.isDragging});
    if (event.button === 1 || event.button === 2) {
      this.isDragging = false;
      if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] Drag end');
    }
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] onMouseMove', {clientX: event.clientX, clientY: event.clientY, isDragging: this.isDragging});
    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y,
    };

    // Rotate camera around target
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(deltaMove.x * this.rotationSpeed * 0.01);
    this.camera.position.applyMatrix4(rotationMatrix);

    // Update previous position
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };

    this.updateCameraPosition();
  }

  public onMouseWheel(event: WheelEvent): void {
    // Zoom in/out
    const zoomDelta = event.deltaY * this.zoomSpeed * 0.01;
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.distance + zoomDelta)
    );
    this.updateCameraPosition();
  }

  public onKeyDown(event: KeyboardEvent): void {
    const moveDistance = this.panSpeed * (this.distance / 10);
    const moveVector = new THREE.Vector3();

    switch (event.key.toLowerCase()) {
      case 'w':
        moveVector.z = -moveDistance;
        break;
      case 's':
        moveVector.z = moveDistance;
        break;
      case 'a':
        moveVector.x = -moveDistance;
        break;
      case 'd':
        moveVector.x = moveDistance;
        break;
      default:
        return;
    }

    // Transform the movement vector based on camera rotation
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(this.camera.rotation.y);
    moveVector.applyMatrix4(rotationMatrix);

    this.desiredTarget.add(moveVector);
    this.clampDesiredTargetToBounds();
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    // Smoothly interpolate target towards desiredTarget
    this.target.lerp(this.desiredTarget, 0.15); // 0.15 = smoothing factor

    // Calculate camera position based on target, distance, and angles
    const phi = THREE.MathUtils.clamp(
      this.camera.rotation.x,
      this.minPolarAngle,
      this.maxPolarAngle
    );
    const theta = this.camera.rotation.y;

    this.camera.position.x = this.target.x + this.distance * Math.sin(phi) * Math.sin(theta);
    this.camera.position.y = this.target.y + this.distance * Math.cos(phi);
    this.camera.position.z = this.target.z + this.distance * Math.sin(phi) * Math.cos(theta);

    this.camera.lookAt(this.target);
  }

  private clampDesiredTargetToBounds(): void {
    this.desiredTarget.x = Math.max(this.mapMinX, Math.min(this.mapMaxX, this.desiredTarget.x));
    this.desiredTarget.z = Math.max(this.mapMinZ, Math.min(this.mapMaxZ, this.desiredTarget.z));
  }

  public endDrag(): void {
    if (this.isDragging) {
      this.isDragging = false;
      if ((window as any).VERBOSE_LOGGING) console.log('[CameraController] Drag forcibly ended');
    }
  }

  public onPointerLockMove(dx: number, dy: number): void {
    // Rotate camera around target using relative movement
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(dx * this.rotationSpeed * 0.01);
    this.camera.position.applyMatrix4(rotationMatrix);
    this.updateCameraPosition();
  }
} 