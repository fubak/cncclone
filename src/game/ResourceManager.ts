import * as THREE from 'three';
import { ResourceNode } from '../entities/ResourceNode';
import { Unit } from '../entities/Unit';
import { Building, BuildingType } from '../entities/Building';

export class ResourceManager {
  private promethium: number = 0;
  private energyCredits: number = 0;
  private power: number = 0;
  private maxPower: number = 0;
  private powerConsumption: number = 0;
  private resourceNodes: ResourceNode[] = [];
  private buildings: Building[] = [];
  private harvesters: Unit[] = [];
  private refineries: Building[] = [];
  private powerPlants: Building[] = [];

  constructor() {}

  public addResourceNode(node: ResourceNode): void {
    this.resourceNodes.push(node);
  }

  public addBuilding(building: Building): void {
    this.buildings.push(building);
    if (building.type === BuildingType.REFINERY) {
      this.refineries.push(building);
      this.powerConsumption += 10; // Each refinery consumes 10 power
    }
  }

  public addHarvester(harvester: Unit): void {
    this.harvesters.push(harvester);
  }

public update(deltaTime: number): void {
  // Update power generation and consumption
  this.updatePower();
  
  // Update resource processing
  this.updateResourceProcessing(deltaTime);
}

private updatePower(): void {
   // Re-aggregate every frame
  this.power = 0;
  this.powerConsumption = 0;
  
  // Single pass through buildings
  this.buildings.forEach(b => {
    if (b.isConstructed) {
      // Add to power if it's a power plant (or store in dedicated array)
      if (b.type === BuildingType.POWER_PLANT) {
        this.power += b.getPowerOutput();
      }
      // Add to consumption for all buildings
      this.powerConsumption += b.getPowerConsumption();
    }
  });

   const powerEfficiency =
     this.powerConsumption === 0 ? 1 : Math.min(1, this.power / this.powerConsumption);
    // Update building states based on power
    this.buildings.forEach(building => {
      if (building.type === BuildingType.REFINERY) {
        // Refineries operate at reduced efficiency when underpowered
        building.setPowerEfficiency(powerEfficiency);
      }
    });
  }

  private updateResourceProcessing(deltaTime: number): void {
    // Process Promethium into Energy Credits at refineries
    this.refineries.forEach(refinery => {
      if (refinery.isConstructed) {
        // Passive energy credit generation
        this.energyCredits += 2 * deltaTime;
        const efficiency = refinery.getPowerEfficiency();
        const processingRate = 10 * efficiency * deltaTime; // Base rate of 10 per second
        if (this.promethium >= processingRate) {
          this.promethium -= processingRate;
          this.energyCredits += processingRate * 0.8; // 80% conversion rate
        }
      }
    });
  }

  public depositPromethium(amount: number): void {
    this.promethium += amount;
  }

  public getPromethium(): number {
    return this.promethium;
  }

  public getEnergyCredits(): number {
    return this.energyCredits;
  }

  public getPower(): number {
    return this.power;
  }

  public getMaxPower(): number {
    return this.maxPower;
  }

  public getPowerConsumption(): number {
    return this.powerConsumption;
  }

public getPowerEfficiency(): number {
  return this.powerConsumption === 0 ? 1 : Math.min(1, this.power / this.powerConsumption);
}

  public canAfford(energyCredits: number): boolean {
    return this.energyCredits >= energyCredits;
  }

  public spendEnergyCredits(amount: number): boolean {
    if (this.canAfford(amount)) {
      this.energyCredits -= amount;
      return true;
    }
    return false;
  }

  public removeResourceNode(node: ResourceNode): void {
    this.resourceNodes = this.resourceNodes.filter(n => n !== node);
  }
} 