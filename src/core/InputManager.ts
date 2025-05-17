import { CameraController } from './CameraController';
import * as THREE from 'three';

export class InputManager {
  private cameraController: CameraController;
  private onUnitSelect: (unitIds: number[]) => void;
  private onUnitMove: (position: { x: number; y: number; z: number }) => void;
  private onUnitAttack: (targetId: number) => void;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // Selection state
  private isSelecting: boolean = false;
  private isDragging: boolean = false;
  private isShiftPressed: boolean = false;
  private selectedUnitIds: Set<number> = new Set();
  
  // Selection box
  private selectionBox: THREE.LineSegments;
  private selectionStart: THREE.Vector2 = new THREE.Vector2();
  private selectionEnd: THREE.Vector2 = new THREE.Vector2();
  private selectionPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private fillMesh: THREE.Mesh;

  private rendererDomElement: HTMLElement;

  constructor(
    cameraController: CameraController,
    onUnitSelect: (unitIds: number[]) => void,
    onUnitMove: (position: { x: number; y: number; z: number }) => void,
    onUnitAttack: (targetId: number) => void,
    camera: THREE.Camera,
    scene: THREE.Scene
  ) {
    this.cameraController = cameraController;
    this.onUnitSelect = onUnitSelect;
    this.onUnitMove = onUnitMove;
    this.onUnitAttack = onUnitAttack;
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Create selection box
    const points = [
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 0.1, 0)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a more visible material for the selection box
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00ff00,  // Bright green
      linewidth: 3,     // Increased line width
      depthTest: false, // Render on top
      depthWrite: false, // Don't write to depth buffer
      transparent: true, // Enable transparency
      opacity: 0.8      // Set opacity
    });
    
    // Create a fill material for the selection box
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide // Render both sides
    });
    
    // Create the line segments for the box outline
    this.selectionBox = new THREE.LineSegments(geometry, material);
    this.selectionBox.visible = false;
    this.selectionBox.renderOrder = 999; // Ensure it renders on top
    
    // Create a fill mesh for the box (rectangle with 2 triangles)
    const fillVertices = new Float32Array(4 * 3); // 4 corners, 3 coords each
    const fillIndices = new Uint16Array([0, 1, 2, 0, 2, 3]); // two triangles
    const fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute('position', new THREE.BufferAttribute(fillVertices, 3));
    fillGeometry.setIndex(new THREE.BufferAttribute(fillIndices, 1));
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.visible = false;
    fillMesh.renderOrder = 998; // Render just below the outline
    this.fillMesh = fillMesh; // Store for later updates
    
    // Add both to the scene
    this.scene.add(this.selectionBox);
    this.scene.add(fillMesh);
    
    this.rendererDomElement = document.querySelector('canvas')!;
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.rendererDomElement.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2) {
        e.preventDefault();
        this.rendererDomElement.requestPointerLock();
      }
      this.handleMouseDown(e);
    });
    document.addEventListener('mouseup', (e) => {
      if (document.pointerLockElement === this.rendererDomElement) {
        document.exitPointerLock();
      }
      this.handleMouseUp(e);
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.rendererDomElement) {
        this.handlePointerLockMove(e);
      } else {
        this.handleMouseMove(e);
      }
    });
    document.addEventListener('wheel', this.handleMouseWheel.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.rendererDomElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    window.addEventListener('blur', () => {
      if ((window as any).VERBOSE_LOGGING) console.log('[InputManager] window blur');
      this.cameraController.endDrag();
    });
    window.addEventListener('focus', () => {
      if ((window as any).VERBOSE_LOGGING) console.log('[InputManager] window focus');
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.rendererDomElement) {
        this.cameraController.endDrag();
      }
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 1) { // Middle mouse
      event.preventDefault();
      this.cameraController.onMouseDown(event);
      return;
    }
    
    if (event.button === 2) { // Right mouse
      event.preventDefault();
      this.updateMousePosition(event);
      // Check for resource node under mouse
      const resourceId = this.getResourceAtMouse();
      if (resourceId !== null) {
        this.onUnitAttack(resourceId);
        return;
      }
      // Get world position for unit movement
      const worldPos = this.getWorldPositionFromMouse();
      if (worldPos) {
        // Check if we clicked on a unit
        const unitId = this.getUnitAtMouse();
        if (unitId !== null) {
          this.onUnitAttack(unitId);
        } else if (this.selectedUnitIds.size > 0) {
          this.onUnitMove(worldPos);
        }
      }
      return;
    }
    
    if (event.button === 0) { // Left mouse
      if ((window as any).VERBOSE_LOGGING) console.log('Mouse down - starting selection');
      this.isSelecting = true;
      this.isDragging = false;
      
      // Update mouse position
      this.updateMousePosition(event);
      this.selectionStart.copy(this.mouse);
      this.selectionEnd.copy(this.mouse);
      
      // Clear selection if shift is not pressed
      if (!this.isShiftPressed) {
        this.selectedUnitIds.clear();
        this.onUnitSelect([]);
      }
      
      // Show selection box
      this.selectionBox.visible = true;
      if ((window as any).VERBOSE_LOGGING) console.log('Selection box visibility set to:', this.selectionBox.visible);
      this.updateSelectionBox();
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (event.button === 1) {
      this.cameraController.onMouseUp(event);
      return;
    }
    
    if (event.button === 2) {
      // Right click is handled in mouseDown for immediate response
      return;
    }
    
    if (event.button === 0 && this.isSelecting) {
      this.isSelecting = false;
      this.updateMousePosition(event);
      
      if (this.isDragging) {
        // Box selection
        const selectedUnits = this.getUnitsInSelectionBox();
        if (selectedUnits.length > 0) {
          if (this.isShiftPressed) {
            // Add to selection
            selectedUnits.forEach(id => this.selectedUnitIds.add(id));
          } else {
            // Replace selection
            this.selectedUnitIds.clear();
            selectedUnits.forEach(id => this.selectedUnitIds.add(id));
          }
          this.onUnitSelect(Array.from(this.selectedUnitIds));
        }
      } else {
        // Single click selection
        const unitId = this.getUnitAtMouse();
        if (unitId !== null) {
          if (this.isShiftPressed) {
            // Toggle selection
            if (this.selectedUnitIds.has(unitId)) {
              this.selectedUnitIds.delete(unitId);
            } else {
              this.selectedUnitIds.add(unitId);
            }
          } else {
            // Replace selection
            this.selectedUnitIds.clear();
            this.selectedUnitIds.add(unitId);
          }
          this.onUnitSelect(Array.from(this.selectedUnitIds));
        } else if (!this.isShiftPressed) {
          // Deselect all if clicking empty space
          this.selectedUnitIds.clear();
          this.onUnitSelect([]);
        }
      }
      
      // Hide selection box
      this.selectionBox.visible = false;
      this.isDragging = false;
      if (this.fillMesh) this.fillMesh.visible = false;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    this.cameraController.onMouseMove(event);
    
    if (this.isSelecting) {
      this.updateMousePosition(event);
      this.selectionEnd.copy(this.mouse);
      
      // Check if we're dragging (increased threshold)
      const dragDistance = this.selectionEnd.distanceTo(this.selectionStart);
      if (dragDistance > 0.05) { // Increased from 0.01 to 0.05
        this.isDragging = true;
        if ((window as any).VERBOSE_LOGGING) console.log('Dragging started, distance:', dragDistance);
      }
      
      // Always update the selection box while dragging
      if (this.isDragging) {
        this.updateSelectionBox();
      }
    }
  }

  private handleMouseWheel(event: WheelEvent): void {
    this.cameraController.onMouseWheel(event);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = true;
    }
    this.cameraController.onKeyDown(event);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Shift') {
      this.isShiftPressed = false;
    }
  }

  private updateMousePosition(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private getWorldPositionFromMouse(): { x: number; y: number; z: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectionPoint = new THREE.Vector3();
    
    if (this.raycaster.ray.intersectPlane(this.selectionPlane, intersectionPoint)) {
      return {
        x: intersectionPoint.x,
        y: intersectionPoint.y,
        z: intersectionPoint.z
      };
    }
    
    return null;
  }

  private getUnitAtMouse(): number | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes: THREE.Mesh[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.unitId !== undefined) {
        meshes.push(object);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes);
    return intersects.length > 0 ? intersects[0].object.userData.unitId : null;
  }

  private getWorldPositionFromScreen(screenPos: THREE.Vector2): { x: number; y: number; z: number } | null {
    // Create a ray from the camera through the screen point
    this.raycaster.setFromCamera(screenPos, this.camera);
    
    // Find intersection with the ground plane
    const intersectionPoint = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.selectionPlane, intersectionPoint)) {
      if ((window as any).VERBOSE_LOGGING) console.log('World position from screen:', {
        screen: { x: screenPos.x, y: screenPos.y },
        world: { x: intersectionPoint.x, y: intersectionPoint.y, z: intersectionPoint.z }
      });
      return {
        x: intersectionPoint.x,
        y: intersectionPoint.y,
        z: intersectionPoint.z
      };
    }
    
    if ((window as any).VERBOSE_LOGGING) console.log('No intersection found for screen position:', screenPos);
    return null;
  }

  private getUnitsInSelectionBox(): number[] {
    const start = this.getWorldPositionFromScreen(this.selectionStart);
    const end = this.getWorldPositionFromScreen(this.selectionEnd);
    
    if (!start || !end) return [];

    // Calculate selection box bounds
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minZ = Math.min(start.z, end.z);
    const maxZ = Math.max(start.z, end.z);

    const selectedUnits: number[] = [];
    
    // Get all unit meshes
    const meshes: THREE.Mesh[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.unitId !== undefined) {
        meshes.push(object);
      }
    });

    // Check each unit's position
    for (const mesh of meshes) {
      const position = mesh.position;
      // Add a small buffer to the selection box
      const buffer = 0.5; // Half the unit size
      if (
        position.x + buffer >= minX && position.x - buffer <= maxX &&
        position.z + buffer >= minZ && position.z - buffer <= maxZ
      ) {
        selectedUnits.push(mesh.userData.unitId);
      }
    }

    return selectedUnits;
  }

  private updateSelectionBox(): void {
    const start = this.getWorldPositionFromScreen(this.selectionStart);
    const end = this.getWorldPositionFromScreen(this.selectionEnd);
    
    if (!start || !end) {
      this.selectionBox.visible = false;
      this.scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.visible = false;
        }
      });
      return;
    }

    // Create points for the box
    const points = [
      new THREE.Vector3(start.x, 0.1, start.z),  // Top left
      new THREE.Vector3(end.x, 0.1, start.z),    // Top right
      new THREE.Vector3(end.x, 0.1, end.z),      // Bottom right
      new THREE.Vector3(start.x, 0.1, end.z),    // Bottom left
      new THREE.Vector3(start.x, 0.1, start.z)   // Back to top left
    ];

    // Create a new geometry from points
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Update the selection box
    this.selectionBox.geometry.dispose();
    this.selectionBox.geometry = geometry;
    this.selectionBox.visible = true;
    
    // Update the fill mesh as a rectangle (quad)
    if (this.fillMesh) {
      const fillPositions = this.fillMesh.geometry.getAttribute('position');
      // Set the 4 corners: TL, TR, BR, BL
      fillPositions.setXYZ(0, start.x, 0.1, start.z); // Top left
      fillPositions.setXYZ(1, end.x, 0.1, start.z);   // Top right
      fillPositions.setXYZ(2, end.x, 0.1, end.z);     // Bottom right
      fillPositions.setXYZ(3, start.x, 0.1, end.z);   // Bottom left
      fillPositions.needsUpdate = true;
      this.fillMesh.visible = true;
      this.fillMesh.geometry.computeVertexNormals();
      this.fillMesh.geometry.computeBoundingSphere();
    }

    // Force a render update
    this.selectionBox.updateMatrix();
    this.selectionBox.updateMatrixWorld(true);
  }

  private handlePointerLockMove(event: MouseEvent): void {
    // Only rotate camera if dragging
    if (!this.cameraController['isDragging']) return;
    this.cameraController.onPointerLockMove(event.movementX, event.movementY);
  }

  private getResourceAtMouse(): number | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes: THREE.Mesh[] = [];
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.resourceId !== undefined) {
        meshes.push(object);
      }
    });
    const intersects = this.raycaster.intersectObjects(meshes);
    return intersects.length > 0 ? intersects[0].object.userData.resourceId : null;
  }

  public cleanup(): void {
    // Remove event listeners
    this.rendererDomElement.removeEventListener('mousedown', (e) => {
      if (e.button === 1 || e.button === 2) e.preventDefault();
      this.handleMouseDown(e);
    });
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('wheel', this.handleMouseWheel.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
} 