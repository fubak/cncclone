import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class AssetManager {
  private static instance: AssetManager;
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private loadedAssets: Map<string, THREE.Texture | THREE.Object3D>;

  private constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.loadedAssets = new Map();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public async loadTexture(path: string): Promise<THREE.Texture> {
    if (this.loadedAssets.has(path)) {
      return this.loadedAssets.get(path) as THREE.Texture;
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.loadedAssets.set(path, texture);
          resolve(texture);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  public async loadModel(path: string): Promise<THREE.Object3D> {
    if (this.loadedAssets.has(path)) {
      return this.loadedAssets.get(path) as THREE.Object3D;
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          this.loadedAssets.set(path, model);
          resolve(model);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  public getAsset(path: string): THREE.Texture | THREE.Object3D | undefined {
    return this.loadedAssets.get(path);
  }

  public clearAssets(): void {
    this.loadedAssets.clear();
  }
} 