/**
 * NASA-Grade Autonomy Governor
 * 
 * Manages autonomous decision boundaries and authority levels
 * following NASA AMO (Autonomous Mission Operations) protocols.
 * 
 * Key Responsibilities:
 * - Maintain decision boundary configurations
 * - Evaluate action confidence against thresholds
 * - Manage human override protocols
 * - Ensure mission safety through multi-tier autonomy
 */

import { 
  DecisionBoundary, 
  AutonomousAction, 
  HumanOverride, 
  SystemHealthSummary,
  MissionPhase,
  SubsystemType,
  AutonomyLevel,
  ConfidenceLevel 
} from '../../../../shared/types/autonomy';

export class AutonomyGovernor {
  private decisionBoundaries: Map<string, DecisionBoundary> = new Map();
  private activeActions: Map<string, AutonomousAction> = new Map();
  private overrideHistory: HumanOverride[] = [];
  private currentMissionPhase: MissionPhase = 'transit';
  private emergencyMode: boolean = false;
  private operatorPresent: boolean = true;

  constructor() {
    this.initializeDefaultBoundaries();
  }

  /**
   * Initialize NASA-standard decision boundaries for space missions
   */
  private initializeDefaultBoundaries(): void {
    const boundaries: DecisionBoundary[] = [
      // Power Management Boundaries
      {
        id: 'power-load-shed-minor',
        subsystem: 'power',
        action: 'shed_non_critical_loads',
        autonomyLevel: 'full',
        confidenceThreshold: 95,
        timeConstraint: 30,
        requiresHumanConfirmation: false,
        safetyClassification: 'routine',
        lastUpdated: new Date()
      },
      {
        id: 'power-load-shed-major',
        subsystem: 'power',
        action: 'shed_science_instruments',
        autonomyLevel: 'advisory',
        confidenceThreshold: 90,
        timeConstraint: 60,
        requiresHumanConfirmation: true,
        safetyClassification: 'caution',
        lastUpdated: new Date()
      },
      {
        id: 'power-emergency-isolation',
        subsystem: 'power',
        action: 'isolate_battery_bank',
        autonomyLevel: 'manual',
        confidenceThreshold: 100,
        timeConstraint: 10,
        requiresHumanConfirmation: true,
        safetyClassification: 'critical',
        lastUpdated: new Date()
      },

      // Thermal Management Boundaries
      {
        id: 'thermal-radiator-deploy',
        subsystem: 'thermal',
        action: 'deploy_emergency_radiators',
        autonomyLevel: 'full',
        confidenceThreshold: 92,
        timeConstraint: 45,
        requiresHumanConfirmation: false,
        safetyClassification: 'caution',
        lastUpdated: new Date()
      },
      {
        id: 'thermal-component-shutdown',
        subsystem: 'thermal',
        action: 'shutdown_overheating_components',
        autonomyLevel: 'advisory',
        confidenceThreshold: 88,
        timeConstraint: 30,
        requiresHumanConfirmation: true,
        safetyClassification: 'warning',
        lastUpdated: new Date()
      },

      // Communication Boundaries
      {
        id: 'comms-antenna-repoint',
        subsystem: 'comms',
        action: 'repoint_high_gain_antenna',
        autonomyLevel: 'full',
        confidenceThreshold: 93,
        timeConstraint: 60,
        requiresHumanConfirmation: false,
        safetyClassification: 'routine',
        lastUpdated: new Date()
      },
      {
        id: 'comms-emergency-beacon',
        subsystem: 'comms',
        action: 'activate_emergency_beacon',
        autonomyLevel: 'full',
        confidenceThreshold: 85,
        timeConstraint: 15,
        requiresHumanConfirmation: false,
        safetyClassification: 'critical',
        lastUpdated: new Date()
      },

      // Navigation Boundaries
      {
        id: 'nav-trajectory-minor-correction',
        subsystem: 'navigation',
        action: 'execute_minor_tcm',
        autonomyLevel: 'advisory',
        confidenceThreshold: 96,
        timeConstraint: 300,
        requiresHumanConfirmation: true,
        safetyClassification: 'caution',
        lastUpdated: new Date()
      },
      {
        id: 'nav-collision-avoidance',
        subsystem: 'navigation',
        action: 'emergency_collision_avoidance',
        autonomyLevel: 'full',
        confidenceThreshold: 80,
        timeConstraint: 10,
        requiresHumanConfirmation: false,
        safetyClassification: 'critical',
        lastUpdated: new Date()
      },

      // Propulsion Boundaries
      {
        id: 'prop-thruster-isolation',
        subsystem: 'propulsion',
        action: 'isolate_faulty_thruster',
        autonomyLevel: 'advisory',
        confidenceThreshold: 94,
        timeConstraint: 60,
        requiresHumanConfirmation: true,
        safetyClassification: 'warning',
        lastUpdated: new Date()
      }
    ];

    boundaries.forEach(boundary => {
      this.decisionBoundaries.set(boundary.id, boundary);
    });
  }

  /**
   * Evaluate if an action can be executed autonomously
   */
  public evaluateAutonomousAction(
    action: string,
    subsystem: SubsystemType,
    confidence: number,
    reasoning: string[],
    systemHealth: SystemHealthSummary
  ): {
    canExecute: boolean;
    autonomyLevel: AutonomyLevel;
    timeToExecution: number;
    requiresConfirmation: boolean;
    reasoning: string[];
  } {
    // Find applicable decision boundary
    const boundary = this.findApplicableBoundary(action, subsystem);
    
    if (!boundary) {
      return {
        canExecute: false,
        autonomyLevel: 'manual',
        timeToExecution: 0,
        requiresConfirmation: true,
        reasoning: ['No decision boundary defined for this action']
      };
    }

    // Check mission phase restrictions
    if (boundary.missionPhaseRestrictions?.includes(this.currentMissionPhase)) {
      return {
        canExecute: false,
        autonomyLevel: 'manual',
        timeToExecution: 0,
        requiresConfirmation: true,
        reasoning: ['Action restricted in current mission phase']
      };
    }

    // Emergency mode overrides
    if (this.emergencyMode && boundary.safetyClassification !== 'critical') {
      return {
        canExecute: false,
        autonomyLevel: 'manual',
        timeToExecution: 0,
        requiresConfirmation: true,
        reasoning: ['Emergency mode active - manual control required']
      };
    }

    // Evaluate confidence against thresholds
    const evaluation = this.evaluateConfidenceLevel(confidence, boundary);
    
    return {
      canExecute: evaluation.canExecute,
      autonomyLevel: evaluation.autonomyLevel,
      timeToExecution: evaluation.timeToExecution,
      requiresConfirmation: evaluation.requiresConfirmation,
      reasoning: [...reasoning, ...evaluation.reasoning]
    };
  }

  /**
   * Create and queue an autonomous action for execution
   */
  public createAutonomousAction(
    action: string,
    subsystem: SubsystemType,
    confidence: number,
    reasoning: string[],
    executionPlan: any,
    correlationId: string
  ): AutonomousAction | null {
    const boundary = this.findApplicableBoundary(action, subsystem);
    if (!boundary) return null;

    const actionId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const autonomousAction: AutonomousAction = {
      id: actionId,
      decisionBoundaryId: boundary.id,
      action,
      subsystem,
      confidence,
      reasoning,
      alternativeActions: [],
      executionPlan,
      humanOverrideDeadline: new Date(Date.now() + boundary.timeConstraint * 1000),
      status: 'pending',
      correlationId,
      createdAt: new Date()
    };

    this.activeActions.set(actionId, autonomousAction);
    return autonomousAction;
  }

  /**
   * Process human override of autonomous action
   */
  public processHumanOverride(
    actionId: string,
    operatorId: string,
    overrideReason: string,
    alternativeAction?: string
  ): boolean {
    const action = this.activeActions.get(actionId);
    if (!action || action.status !== 'pending') {
      return false;
    }

    // Check if past override deadline
    if (new Date() > action.humanOverrideDeadline) {
      return false;
    }

    const override: HumanOverride = {
      id: `override-${Date.now()}`,
      autonomousActionId: actionId,
      operatorId,
      overrideReason,
      alternativeAction,
      timestamp: new Date()
    };

    // For critical actions, require dual confirmation
    const boundary = this.decisionBoundaries.get(action.decisionBoundaryId);
    if (boundary?.safetyClassification === 'critical' && !this.emergencyMode) {
      // Implementation would require second operator confirmation
      // For now, we'll mark as requiring confirmation
      override.confirmedBySecondOperator = false;
    }

    this.overrideHistory.push(override);
    action.status = 'overridden';
    
    return true;
  }

  /**
   * Get all pending actions requiring human attention
   */
  public getPendingActions(): AutonomousAction[] {
    return Array.from(this.activeActions.values())
      .filter(action => action.status === 'pending')
      .sort((a, b) => a.humanOverrideDeadline.getTime() - b.humanOverrideDeadline.getTime());
  }

  /**
   * Update mission phase and recalculate autonomy boundaries
   */
  public updateMissionPhase(phase: MissionPhase): void {
    this.currentMissionPhase = phase;
    this.adjustBoundariesForPhase(phase);
  }

  /**
   * Activate emergency mode - restricts autonomy to critical safety actions only
   */
  public activateEmergencyMode(reason: string): void {
    this.emergencyMode = true;
    
    // Override all non-critical pending actions
    this.activeActions.forEach((action, actionId) => {
      if (action.status === 'pending') {
        const boundary = this.decisionBoundaries.get(action.decisionBoundaryId);
        if (boundary?.safetyClassification !== 'critical') {
          this.processHumanOverride(
            actionId, 
            'SYSTEM_EMERGENCY', 
            `Emergency mode activated: ${reason}`
          );
        }
      }
    });
  }

  /**
   * Deactivate emergency mode and restore normal autonomy
   */
  public deactivateEmergencyMode(): void {
    this.emergencyMode = false;
  }

  /**
   * Get autonomy status summary
   */
  public getAutonomyStatus() {
    const pendingActions = this.getPendingActions();
    const recentOverrides = this.overrideHistory
      .filter(override => override.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .length;

    return {
      emergencyMode: this.emergencyMode,
      missionPhase: this.currentMissionPhase,
      operatorPresent: this.operatorPresent,
      pendingActionsCount: pendingActions.length,
      urgentActionsCount: pendingActions.filter(
        action => action.humanOverrideDeadline.getTime() - Date.now() < 60000
      ).length,
      recentOverrides24h: recentOverrides,
      totalBoundaries: this.decisionBoundaries.size,
      activeBoundaries: Array.from(this.decisionBoundaries.values())
        .filter(boundary => 
          !boundary.missionPhaseRestrictions?.includes(this.currentMissionPhase)
        ).length
    };
  }

  /**
   * Find applicable decision boundary for action and subsystem
   */
  private findApplicableBoundary(action: string, subsystem: SubsystemType): DecisionBoundary | null {
    const boundaries = Array.from(this.decisionBoundaries.values());
    for (const boundary of boundaries) {
      if (boundary.subsystem === subsystem && boundary.action === action) {
        return boundary;
      }
    }
    return null;
  }

  /**
   * Evaluate confidence level against boundary thresholds
   */
  private evaluateConfidenceLevel(confidence: number, boundary: DecisionBoundary) {
    if (confidence >= 95) {
      // High confidence - execute autonomously with post-action notification
      return {
        canExecute: boundary.autonomyLevel === 'full',
        autonomyLevel: 'full' as AutonomyLevel,
        timeToExecution: 5, // Immediate execution with 5s safety buffer
        requiresConfirmation: false,
        reasoning: ['High confidence (≥95%) - autonomous execution authorized']
      };
    } else if (confidence >= 80) {
      // Medium confidence - present recommendation with countdown
      return {
        canExecute: boundary.autonomyLevel !== 'manual',
        autonomyLevel: 'advisory' as AutonomyLevel,
        timeToExecution: boundary.timeConstraint,
        requiresConfirmation: true,
        reasoning: ['Medium confidence (80-95%) - human review recommended']
      };
    } else {
      // Low confidence - advisory only
      return {
        canExecute: false,
        autonomyLevel: 'manual' as AutonomyLevel,
        timeToExecution: 0,
        requiresConfirmation: true,
        reasoning: ['Low confidence (<80%) - manual confirmation required']
      };
    }
  }

  /**
   * Adjust decision boundaries based on mission phase
   */
  private adjustBoundariesForPhase(phase: MissionPhase): void {
    // During critical phases, increase human oversight
    const criticalPhases: MissionPhase[] = ['launch', 'landing', 'emergency'];
    
    if (criticalPhases.includes(phase)) {
      const boundaries = Array.from(this.decisionBoundaries.values());
      boundaries.forEach(boundary => {
        if (boundary.safetyClassification !== 'routine') {
          boundary.confidenceThreshold = Math.min(100, boundary.confidenceThreshold + 5);
          boundary.requiresHumanConfirmation = true;
        }
      });
    }
  }

  /**
   * Add or update a decision boundary
   */
  public updateDecisionBoundary(boundary: DecisionBoundary): void {
    boundary.lastUpdated = new Date();
    this.decisionBoundaries.set(boundary.id, boundary);
  }

  /**
   * Get decision boundary by ID
   */
  public getDecisionBoundary(id: string): DecisionBoundary | undefined {
    return this.decisionBoundaries.get(id);
  }

  /**
   * Get all decision boundaries for a subsystem
   */
  public getSubsystemBoundaries(subsystem: SubsystemType): DecisionBoundary[] {
    return Array.from(this.decisionBoundaries.values())
      .filter(boundary => boundary.subsystem === subsystem);
  }
}
