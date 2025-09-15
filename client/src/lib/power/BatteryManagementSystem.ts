/**
 * NASA-Grade Battery Management System
 * 
 * Intelligent power management with predictive analytics,
 * State of Health (SoH) monitoring, and automated load balancing
 * following NASA power system reliability protocols.
 * 
 * Features:
 * - Predictive power consumption forecasting
 * - Real-time SoH/SoC monitoring with trend analysis
 * - Automated load shedding during emergencies
 * - Battery bank switching and thermal runaway protection
 */

import { 
  SystemHealthSummary,
  SpaceEnvironment,
  PowerForecast,
  PowerTrend,
  BatteryForecast,
  PowerEvent,
  ResourceRequirement
} from '../../../../shared/types/autonomy';

export interface BatteryState {
  soc: number; // State of Charge 0-100%
  soh: number; // State of Health 0-100%
  sop: number; // State of Power - Available power in watts
  temperature: number; // Celsius
  voltage: number; // Volts
  current: number; // Amperes (+ charging, - discharging)
  cycleCount: number; // Total charge/discharge cycles
  predictedLifeRemaining: number; // hours at current usage
  thermalRunawayRisk: number; // 0-100% risk assessment
  lastCalibration: Date;
}

export interface PowerManagementAction {
  id: string;
  trigger: 'low_soc' | 'thermal_limit' | 'solar_storm' | 'load_spike' | 'thermal_runaway';
  action: 'shed_load' | 'switch_battery_bank' | 'activate_backup' | 'emergency_mode' | 'isolate_bank';
  affectedSystems: string[];
  powerSavings: number; // watts
  missionImpact: 'none' | 'minor' | 'moderate' | 'severe';
  executionTime: number; // seconds
  reversible: boolean;
  confidence: number; // 0-100%
  timestamp: Date;
}

export interface PowerLoad {
  id: string;
  name: string;
  category: 'critical' | 'essential' | 'operational' | 'science' | 'non_essential';
  currentDraw: number; // watts
  nominalDraw: number; // watts
  dutyCycle: number; // 0-100% typical usage
  priority: number; // 1-10, 10 being highest
  sheddable: boolean;
  minimumRuntime: number; // seconds before safe shutdown
  powerProfile: PowerProfile;
}

export interface PowerProfile {
  startup: number; // watts during startup
  nominal: number; // watts during normal operation
  peak: number; // watts during peak operation
  standby: number; // watts in standby mode
  startupTime: number; // seconds to reach nominal
}

export interface BatteryBank {
  id: string;
  name: string;
  capacity: number; // Amp-hours
  nominalVoltage: number; // Volts
  state: BatteryState;
  cellCount: number;
  chemistry: 'li_ion' | 'li_po' | 'nimh' | 'ni_cd';
  temperatureRange: [number, number]; // [min, max] Celsius
  active: boolean;
  isolated: boolean;
  maintenanceRequired: boolean;
  cycleHistory: CycleRecord[];
}

export interface CycleRecord {
  timestamp: Date;
  startSoc: number;
  endSoc: number;
  depthOfDischarge: number; // 0-100%
  averageTemperature: number;
  peakCurrent: number;
  energyTransferred: number; // Wh
}

export interface PowerGenerationSource {
  id: string;
  name: string;
  type: 'solar' | 'rtg' | 'fuel_cell' | 'backup';
  currentOutput: number; // watts
  maximumOutput: number; // watts
  efficiency: number; // 0-100%
  degradation: number; // 0-100% from original capacity
  predictedOutput: PowerTrend[];
  active: boolean;
  faultStatus: string[];
}

export class BatteryManagementSystem {
  private batteryBanks: Map<string, BatteryBank> = new Map();
  private powerLoads: Map<string, PowerLoad> = new Map();
  private generationSources: Map<string, PowerGenerationSource> = new Map();
  private powerHistory: PowerTrend[] = [];
  private loadSheddingHistory: PowerManagementAction[] = [];
  private emergencyMode: boolean = false;
  private minSocThreshold: number = 20; // Critical SoC threshold
  private sohThreshold: number = 80; // Minimum acceptable SoH

  constructor() {
    this.initializeBatteryBanks();
    this.initializePowerLoads();
    this.initializeGenerationSources();
    this.startMonitoring();
  }

  /**
   * Initialize spacecraft battery banks
   */
  private initializeBatteryBanks(): void {
    const banks: BatteryBank[] = [
      {
        id: 'primary-bank',
        name: 'Primary Battery Bank',
        capacity: 100, // Ah
        nominalVoltage: 28.0,
        state: {
          soc: 85.5,
          soh: 96.2,
          sop: 2800,
          temperature: 18.5,
          voltage: 28.4,
          current: -15.2,
          cycleCount: 1247,
          predictedLifeRemaining: 8760, // 1 year
          thermalRunawayRisk: 2.1,
          lastCalibration: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        cellCount: 8,
        chemistry: 'li_ion',
        temperatureRange: [-20, 60],
        active: true,
        isolated: false,
        maintenanceRequired: false,
        cycleHistory: []
      },
      {
        id: 'backup-bank',
        name: 'Backup Battery Bank',
        capacity: 75, // Ah
        nominalVoltage: 28.0,
        state: {
          soc: 92.1,
          soh: 89.7,
          sop: 2100,
          temperature: 16.8,
          voltage: 28.6,
          current: 0.0,
          cycleCount: 856,
          predictedLifeRemaining: 6240, // ~9 months
          thermalRunawayRisk: 1.3,
          lastCalibration: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        },
        cellCount: 6,
        chemistry: 'li_ion',
        temperatureRange: [-20, 60],
        active: false,
        isolated: false,
        maintenanceRequired: false,
        cycleHistory: []
      },
      {
        id: 'emergency-bank',
        name: 'Emergency Reserve Bank',
        capacity: 50, // Ah
        nominalVoltage: 28.0,
        state: {
          soc: 100.0,
          soh: 98.5,
          sop: 1400,
          temperature: 15.2,
          voltage: 29.2,
          current: 0.0,
          cycleCount: 12,
          predictedLifeRemaining: 35040, // ~4 years
          thermalRunawayRisk: 0.5,
          lastCalibration: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        cellCount: 4,
        chemistry: 'li_ion',
        temperatureRange: [-20, 60],
        active: false,
        isolated: false,
        maintenanceRequired: false,
        cycleHistory: []
      }
    ];

    banks.forEach(bank => {
      this.batteryBanks.set(bank.id, bank);
    });
  }

  /**
   * Initialize power loads and their characteristics
   */
  private initializePowerLoads(): void {
    const loads: PowerLoad[] = [
      {
        id: 'flight-computer',
        name: 'Flight Computer',
        category: 'critical',
        currentDraw: 45.0,
        nominalDraw: 45.0,
        dutyCycle: 100,
        priority: 10,
        sheddable: false,
        minimumRuntime: 0,
        powerProfile: {
          startup: 65.0,
          nominal: 45.0,
          peak: 85.0,
          standby: 25.0,
          startupTime: 30
        }
      },
      {
        id: 'communications',
        name: 'Communication System',
        category: 'critical',
        currentDraw: 125.0,
        nominalDraw: 125.0,
        dutyCycle: 85,
        priority: 9,
        sheddable: false,
        minimumRuntime: 10,
        powerProfile: {
          startup: 180.0,
          nominal: 125.0,
          peak: 250.0,
          standby: 15.0,
          startupTime: 45
        }
      },
      {
        id: 'life-support',
        name: 'Life Support Systems',
        category: 'critical',
        currentDraw: 185.0,
        nominalDraw: 185.0,
        dutyCycle: 100,
        priority: 10,
        sheddable: false,
        minimumRuntime: 0,
        powerProfile: {
          startup: 220.0,
          nominal: 185.0,
          peak: 285.0,
          standby: 85.0,
          startupTime: 60
        }
      },
      {
        id: 'navigation',
        name: 'Navigation & Guidance',
        category: 'essential',
        currentDraw: 75.0,
        nominalDraw: 75.0,
        dutyCycle: 95,
        priority: 8,
        sheddable: false,
        minimumRuntime: 30,
        powerProfile: {
          startup: 95.0,
          nominal: 75.0,
          peak: 125.0,
          standby: 35.0,
          startupTime: 20
        }
      },
      {
        id: 'thermal-control',
        name: 'Thermal Control System',
        category: 'essential',
        currentDraw: 95.0,
        nominalDraw: 95.0,
        dutyCycle: 75,
        priority: 7,
        sheddable: true,
        minimumRuntime: 120,
        powerProfile: {
          startup: 120.0,
          nominal: 95.0,
          peak: 185.0,
          standby: 25.0,
          startupTime: 15
        }
      },
      {
        id: 'science-primary',
        name: 'Primary Science Instruments',
        category: 'science',
        currentDraw: 165.0,
        nominalDraw: 165.0,
        dutyCycle: 60,
        priority: 6,
        sheddable: true,
        minimumRuntime: 300,
        powerProfile: {
          startup: 200.0,
          nominal: 165.0,
          peak: 275.0,
          standby: 45.0,
          startupTime: 90
        }
      },
      {
        id: 'science-secondary',
        name: 'Secondary Science Instruments',
        category: 'science',
        currentDraw: 85.0,
        nominalDraw: 85.0,
        dutyCycle: 40,
        priority: 4,
        sheddable: true,
        minimumRuntime: 180,
        powerProfile: {
          startup: 110.0,
          nominal: 85.0,
          peak: 145.0,
          standby: 25.0,
          startupTime: 60
        }
      },
      {
        id: 'cameras',
        name: 'Imaging Cameras',
        category: 'operational',
        currentDraw: 55.0,
        nominalDraw: 55.0,
        dutyCycle: 25,
        priority: 3,
        sheddable: true,
        minimumRuntime: 30,
        powerProfile: {
          startup: 75.0,
          nominal: 55.0,
          peak: 95.0,
          standby: 8.0,
          startupTime: 10
        }
      },
      {
        id: 'backup-systems',
        name: 'Backup & Redundant Systems',
        category: 'non_essential',
        currentDraw: 35.0,
        nominalDraw: 35.0,
        dutyCycle: 10,
        priority: 2,
        sheddable: true,
        minimumRuntime: 0,
        powerProfile: {
          startup: 45.0,
          nominal: 35.0,
          peak: 65.0,
          standby: 15.0,
          startupTime: 20
        }
      }
    ];

    loads.forEach(load => {
      this.powerLoads.set(load.id, load);
    });
  }

  /**
   * Initialize power generation sources
   */
  private initializeGenerationSources(): void {
    const sources: PowerGenerationSource[] = [
      {
        id: 'solar-array',
        name: 'Solar Panel Array',
        type: 'solar',
        currentOutput: 450.0,
        maximumOutput: 600.0,
        efficiency: 22.5,
        degradation: 8.2, // 8.2% degradation
        predictedOutput: [],
        active: true,
        faultStatus: []
      },
      {
        id: 'rtg-backup',
        name: 'Radioisotope Thermoelectric Generator',
        type: 'rtg',
        currentOutput: 45.0,
        maximumOutput: 50.0,
        efficiency: 7.5,
        degradation: 2.1,
        predictedOutput: [],
        active: false,
        faultStatus: []
      }
    ];

    sources.forEach(source => {
      this.generationSources.set(source.id, source);
    });
  }

  /**
   * Generate comprehensive power forecast
   */
  public generatePowerForecast(
    timeHorizon: number, // hours
    environment: SpaceEnvironment
  ): PowerForecast {
    const generation = this.predictPowerGeneration(timeHorizon, environment);
    const consumption = this.predictPowerConsumption(timeHorizon);
    const batteryState = this.predictBatteryState(timeHorizon, generation, consumption);
    const criticalEvents = this.predictPowerEvents(timeHorizon, environment);

    return {
      generation,
      consumption,
      batteryState,
      criticalEvents
    };
  }

  /**
   * Predict power generation based on environmental conditions
   */
  private predictPowerGeneration(timeHorizon: number, environment: SpaceEnvironment): PowerTrend[] {
    const predictions: PowerTrend[] = [];
    const stepSize = 900; // 15-minute intervals
    const steps = Math.floor(timeHorizon * 3600 / stepSize);

    for (let i = 0; i < steps; i++) {
      const timestamp = new Date(Date.now() + i * stepSize * 1000);
      
      // Calculate solar power based on sun exposure and solar activity
      const solarArray = this.generationSources.get('solar-array')!;
      const sunExposure = environment.temperature?.sunExposure / 100 || 0.5; // Default 50% exposure
      const solarEfficiencyFactor = 1.0 - (environment.solarActivity.solarWindSpeed - 400) / 2000;
      
      const solarPower = solarArray.maximumOutput * 
                        (1 - solarArray.degradation / 100) * 
                        sunExposure * 
                        Math.max(0.1, solarEfficiencyFactor);

      // RTG provides constant power
      const rtg = this.generationSources.get('rtg-backup')!;
      const rtgPower = rtg.active ? rtg.currentOutput * (1 - rtg.degradation / 100) : 0;

      const totalGeneration = solarPower + rtgPower;
      
      predictions.push({
        timestamp,
        value: totalGeneration,
        confidence: Math.max(60, 95 - i) // Decreasing confidence over time
      });
    }

    return predictions;
  }

  /**
   * Predict power consumption patterns
   */
  private predictPowerConsumption(timeHorizon: number): PowerTrend[] {
    const predictions: PowerTrend[] = [];
    const stepSize = 900; // 15-minute intervals
    const steps = Math.floor(timeHorizon * 3600 / stepSize);

    for (let i = 0; i < steps; i++) {
      const timestamp = new Date(Date.now() + i * stepSize * 1000);
      
      let totalConsumption = 0;
      const loadValues = Array.from(this.powerLoads.values());
      
      for (const load of loadValues) {
        if (!load.sheddable || load.category === 'critical') {
          // Critical loads always consume nominal power
          totalConsumption += load.nominalDraw;
        } else {
          // Non-critical loads vary with duty cycle and mission phase
          const dutyCycleFactor = load.dutyCycle / 100;
          const variationFactor = 0.8 + 0.4 * Math.random(); // ±20% variation
          totalConsumption += load.nominalDraw * dutyCycleFactor * variationFactor;
        }
      }

      predictions.push({
        timestamp,
        value: totalConsumption,
        confidence: Math.max(70, 90 - i * 0.5)
      });
    }

    return predictions;
  }

  /**
   * Predict battery state evolution
   */
  private predictBatteryState(
    timeHorizon: number, 
    generation: PowerTrend[], 
    consumption: PowerTrend[]
  ): BatteryForecast[] {
    const predictions: BatteryForecast[] = [];
    
    // Get current active battery bank
    const activeBanks = Array.from(this.batteryBanks.values()).filter(bank => bank.active);
    const primaryBank = activeBanks[0] || this.batteryBanks.get('primary-bank')!;
    
    let currentSoc = primaryBank.state.soc;
    let currentSoh = primaryBank.state.soh;
    let currentTemp = primaryBank.state.temperature;

    for (let i = 0; i < generation.length; i++) {
      const netPower = generation[i].value - consumption[i].value;
      const chargeRate = netPower / primaryBank.nominalVoltage; // Simplified
      
      // Update SoC based on charge/discharge
      const socChange = (chargeRate * 0.25) / primaryBank.capacity * 100; // 15-min interval
      currentSoc = Math.max(0, Math.min(100, currentSoc + socChange));
      
      // SoH degrades slowly over time
      currentSoh = Math.max(50, currentSoh - 0.0001); // Very slow degradation
      
      // Temperature changes based on charge rate and ambient
      const thermalEffect = Math.abs(chargeRate) * 0.1;
      currentTemp = 15 + thermalEffect + Math.sin(i * 0.1) * 3; // Simplified thermal model

      predictions.push({
        timestamp: generation[i].timestamp,
        soc: currentSoc,
        soh: currentSoh,
        temperature: currentTemp,
        confidence: generation[i].confidence
      });
    }

    return predictions;
  }

  /**
   * Predict critical power events
   */
  private predictPowerEvents(timeHorizon: number, environment: SpaceEnvironment): PowerEvent[] {
    const events: PowerEvent[] = [];
    
    // Solar storm events
    environment.solarActivity.predictedFlares.forEach(flare => {
      if (flare.estimatedArrival <= new Date(Date.now() + timeHorizon * 3600 * 1000)) {
        const powerReduction = flare.magnitude * 50; // Watts reduction per flare magnitude
        
        events.push({
          timestamp: flare.estimatedArrival,
          event: 'low_generation',
          impact: -powerReduction,
          duration: flare.duration * 3600
        });
      }
    });

    // Predicted high demand periods
    const currentTime = new Date();
    const nextMaintenanceWindow = new Date(currentTime.getTime() + 6 * 3600 * 1000); // 6 hours
    
    events.push({
      timestamp: nextMaintenanceWindow,
      event: 'high_demand',
      impact: 150,
      duration: 1800 // 30 minutes
    });

    return events;
  }

  /**
   * Execute automated power management action
   */
  public executePowerManagementAction(trigger: string, severity: number): PowerManagementAction | null {
    const actionId = `pwr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    let action: PowerManagementAction;

    switch (trigger) {
      case 'low_soc':
        action = this.handleLowSocEvent(actionId, severity);
        break;
      case 'thermal_runaway':
        action = this.handleThermalRunawayEvent(actionId, severity);
        break;
      case 'solar_storm':
        action = this.handleSolarStormEvent(actionId, severity);
        break;
      case 'load_spike':
        action = this.handleLoadSpikeEvent(actionId, severity);
        break;
      default:
        return null;
    }

    // Execute the action
    const success = this.applyPowerAction(action);
    if (success) {
      this.loadSheddingHistory.push(action);
      return action;
    }

    return null;
  }

  /**
   * Handle low State of Charge emergency
   */
  private handleLowSocEvent(actionId: string, severity: number): PowerManagementAction {
    const activeBanks = Array.from(this.batteryBanks.values()).filter(bank => bank.active);
    const currentSoc = activeBanks.reduce((avg, bank) => avg + bank.state.soc, 0) / activeBanks.length;

    if (currentSoc < 10) {
      // Critical: Activate emergency mode
      return {
        id: actionId,
        trigger: 'low_soc',
        action: 'emergency_mode',
        affectedSystems: ['science-primary', 'science-secondary', 'cameras', 'backup-systems'],
        powerSavings: 340,
        missionImpact: 'severe',
        executionTime: 5,
        reversible: true,
        confidence: 95,
        timestamp: new Date()
      };
    } else if (currentSoc < 20) {
      // Warning: Shed non-critical loads
      return {
        id: actionId,
        trigger: 'low_soc',
        action: 'shed_load',
        affectedSystems: ['science-secondary', 'cameras', 'backup-systems'],
        powerSavings: 175,
        missionImpact: 'moderate',
        executionTime: 10,
        reversible: true,
        confidence: 90,
        timestamp: new Date()
      };
    } else {
      // Caution: Switch to backup bank
      return {
        id: actionId,
        trigger: 'low_soc',
        action: 'switch_battery_bank',
        affectedSystems: [],
        powerSavings: 0,
        missionImpact: 'minor',
        executionTime: 30,
        reversible: true,
        confidence: 88,
        timestamp: new Date()
      };
    }
  }

  /**
   * Handle thermal runaway emergency
   */
  private handleThermalRunawayEvent(actionId: string, severity: number): PowerManagementAction {
    return {
      id: actionId,
      trigger: 'thermal_runaway',
      action: 'isolate_bank',
      affectedSystems: ['affected-battery-bank'],
      powerSavings: 0,
      missionImpact: 'moderate',
      executionTime: 2,
      reversible: false,
      confidence: 98,
      timestamp: new Date()
    };
  }

  /**
   * Handle solar storm power management
   */
  private handleSolarStormEvent(actionId: string, severity: number): PowerManagementAction {
    if (severity > 7) {
      return {
        id: actionId,
        trigger: 'solar_storm',
        action: 'shed_load',
        affectedSystems: ['science-primary', 'cameras'],
        powerSavings: 220,
        missionImpact: 'moderate',
        executionTime: 15,
        reversible: true,
        confidence: 85,
        timestamp: new Date()
      };
    } else {
      return {
        id: actionId,
        trigger: 'solar_storm',
        action: 'activate_backup',
        affectedSystems: ['rtg-backup'],
        powerSavings: -45, // Additional generation
        missionImpact: 'minor',
        executionTime: 60,
        reversible: true,
        confidence: 92,
        timestamp: new Date()
      };
    }
  }

  /**
   * Handle unexpected load spike
   */
  private handleLoadSpikeEvent(actionId: string, severity: number): PowerManagementAction {
    return {
      id: actionId,
      trigger: 'load_spike',
      action: 'shed_load',
      affectedSystems: ['backup-systems'],
      powerSavings: 35,
      missionImpact: 'none',
      executionTime: 5,
      reversible: true,
      confidence: 80,
      timestamp: new Date()
    };
  }

  /**
   * Apply power management action to systems
   */
  private applyPowerAction(action: PowerManagementAction): boolean {
    try {
      switch (action.action) {
        case 'shed_load':
          return this.shedLoadSystems(action.affectedSystems);
        case 'switch_battery_bank':
          return this.switchBatteryBank();
        case 'activate_backup':
          return this.activateBackupSystems(action.affectedSystems);
        case 'emergency_mode':
          return this.activateEmergencyMode(action.affectedSystems);
        case 'isolate_bank':
          return this.isolateBatteryBank(action.affectedSystems[0]);
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to apply power action:', error);
      return false;
    }
  }

  /**
   * Shed power from specified load systems
   */
  private shedLoadSystems(systemIds: string[]): boolean {
    systemIds.forEach(systemId => {
      const load = this.powerLoads.get(systemId);
      if (load && load.sheddable) {
        load.currentDraw = load.powerProfile.standby;
      }
    });
    return true;
  }

  /**
   * Switch to backup battery bank
   */
  private switchBatteryBank(): boolean {
    const primaryBank = this.batteryBanks.get('primary-bank');
    const backupBank = this.batteryBanks.get('backup-bank');
    
    if (primaryBank && backupBank && !backupBank.isolated) {
      primaryBank.active = false;
      backupBank.active = true;
      return true;
    }
    return false;
  }

  /**
   * Activate backup power systems
   */
  private activateBackupSystems(systemIds: string[]): boolean {
    systemIds.forEach(systemId => {
      const source = this.generationSources.get(systemId);
      if (source) {
        source.active = true;
      }
    });
    return true;
  }

  /**
   * Activate emergency power mode
   */
  private activateEmergencyMode(systemIds: string[]): boolean {
    this.emergencyMode = true;
    return this.shedLoadSystems(systemIds);
  }

  /**
   * Isolate battery bank for safety
   */
  private isolateBatteryBank(bankId: string): boolean {
    const bank = this.batteryBanks.get(bankId);
    if (bank) {
      bank.isolated = true;
      bank.active = false;
      
      // Switch to emergency bank if available
      const emergencyBank = this.batteryBanks.get('emergency-bank');
      if (emergencyBank && !emergencyBank.isolated) {
        emergencyBank.active = true;
      }
      return true;
    }
    return false;
  }

  /**
   * Update battery telemetry data
   */
  public updateBatteryState(bankId: string, state: Partial<BatteryState>): void {
    const bank = this.batteryBanks.get(bankId);
    if (bank) {
      Object.assign(bank.state, state);
      
      // Check for thermal runaway
      if (state.temperature && state.temperature > 45) {
        bank.state.thermalRunawayRisk = Math.min(100, 
          bank.state.thermalRunawayRisk + (state.temperature - 45) * 2
        );
      }

      // Update cycle count if SoC changed significantly
      if (state.soc !== undefined) {
        this.updateCycleCount(bank, state.soc);
      }
    }
  }

  /**
   * Update charge/discharge cycle tracking
   */
  private updateCycleCount(bank: BatteryBank, newSoc: number): void {
    const lastRecord = bank.cycleHistory[bank.cycleHistory.length - 1];
    
    if (!lastRecord || Math.abs(newSoc - lastRecord.endSoc) > 10) {
      // Significant SoC change - record cycle data
      const cycleRecord: CycleRecord = {
        timestamp: new Date(),
        startSoc: lastRecord ? lastRecord.endSoc : bank.state.soc,
        endSoc: newSoc,
        depthOfDischarge: lastRecord ? Math.abs(newSoc - lastRecord.endSoc) : 0,
        averageTemperature: bank.state.temperature,
        peakCurrent: Math.abs(bank.state.current),
        energyTransferred: Math.abs(newSoc - (lastRecord?.endSoc || bank.state.soc)) * 
                          bank.capacity * bank.nominalVoltage / 100
      };

      bank.cycleHistory.push(cycleRecord);
      
      // Keep last 1000 cycles
      if (bank.cycleHistory.length > 1000) {
        bank.cycleHistory.splice(0, bank.cycleHistory.length - 1000);
      }

      // Update cycle count for significant cycles (>20% DoD)
      if (cycleRecord.depthOfDischarge > 20) {
        bank.state.cycleCount++;
      }
    }
  }

  /**
   * Get comprehensive power status
   */
  public getPowerStatus() {
    const batteryStatus: Record<string, any> = {};
    const bankEntries = Array.from(this.batteryBanks.entries());
    
    for (const [bankId, bank] of bankEntries) {
      batteryStatus[bankId] = {
        ...bank.state,
        active: bank.active,
        isolated: bank.isolated,
        capacity: bank.capacity,
        health: this.assessBatteryHealth(bank)
      };
    }

    const generationStatus: Record<string, any> = {};
    const sourceEntries = Array.from(this.generationSources.entries());
    
    for (const [sourceId, source] of sourceEntries) {
      generationStatus[sourceId] = {
        currentOutput: source.currentOutput,
        efficiency: source.efficiency,
        active: source.active,
        degradation: source.degradation
      };
    }

    const loadStatus: Record<string, any> = {};
    const loadEntries = Array.from(this.powerLoads.entries());
    
    for (const [loadId, load] of loadEntries) {
      loadStatus[loadId] = {
        currentDraw: load.currentDraw,
        category: load.category,
        priority: load.priority,
        sheddable: load.sheddable
      };
    }

    return {
      batteries: batteryStatus,
      generation: generationStatus,
      loads: loadStatus,
      emergencyMode: this.emergencyMode,
      totalGeneration: this.calculateTotalGeneration(),
      totalConsumption: this.calculateTotalConsumption(),
      powerMargin: this.calculatePowerMargin(),
      lastUpdate: new Date()
    };
  }

  /**
   * Assess individual battery health
   */
  private assessBatteryHealth(bank: BatteryBank): string {
    const soc = bank.state.soc;
    const soh = bank.state.soh;
    const temp = bank.state.temperature;
    const runawayRisk = bank.state.thermalRunawayRisk;

    if (runawayRisk > 50 || temp > 50 || bank.isolated) {
      return 'critical';
    } else if (soc < this.minSocThreshold || soh < this.sohThreshold || temp > 40) {
      return 'warning';
    } else if (soc < 30 || soh < 90 || temp > 35) {
      return 'caution';
    } else {
      return 'nominal';
    }
  }

  /**
   * Calculate total power generation
   */
  private calculateTotalGeneration(): number {
    const sourceValues = Array.from(this.generationSources.values());
    return sourceValues
      .filter(source => source.active)
      .reduce((total, source) => total + source.currentOutput, 0);
  }

  /**
   * Calculate total power consumption
   */
  private calculateTotalConsumption(): number {
    const loadValues = Array.from(this.powerLoads.values());
    return loadValues.reduce((total, load) => total + load.currentDraw, 0);
  }

  /**
   * Calculate power margin (generation - consumption)
   */
  private calculatePowerMargin(): number {
    return this.calculateTotalGeneration() - this.calculateTotalConsumption();
  }

  /**
   * Start continuous battery monitoring
   */
  private startMonitoring(): void {
    // In a real system, this would interface with hardware sensors
    // For now, we'll simulate periodic updates
    setInterval(() => {
      this.updateTelemetryData();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Simulate telemetry data updates
   */
  private updateTelemetryData(): void {
    const bankEntries = Array.from(this.batteryBanks.entries());
    
    for (const [bankId, bank] of bankEntries) {
      if (bank.active && !bank.isolated) {
        // Simulate small variations in telemetry
        const currentDraw = this.calculateTotalConsumption();
        const powerMargin = this.calculatePowerMargin();
        
        // Update SoC based on power balance
        if (powerMargin < 0) {
          bank.state.soc = Math.max(0, bank.state.soc - 0.1);
          bank.state.current = Math.abs(powerMargin) / bank.nominalVoltage;
        } else {
          bank.state.soc = Math.min(100, bank.state.soc + 0.05);
          bank.state.current = -powerMargin / bank.nominalVoltage;
        }

        // Update voltage based on SoC
        bank.state.voltage = bank.nominalVoltage * (0.85 + 0.15 * bank.state.soc / 100);
        
        // Gradual SoH degradation
        bank.state.soh = Math.max(50, bank.state.soh - 0.0001);
      }
    }
  }
}
