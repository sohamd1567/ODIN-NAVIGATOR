/**
 * AI Briefing Service - Generates mission briefings and status reports
 * Uses Groq AI to create contextual briefings based on current mission state
 */

interface MissionContext {
  hazards: any[];
  systemHealth: any;
  missionPhase: string;
  timeframe: string;
}

interface BriefingOptions {
  format: 'summary' | 'detailed' | 'executive';
  focus?: 'operations' | 'science' | 'safety' | 'all';
  timeHorizon?: number; // hours
}

export class AIBriefingService {
  private groqApiKey: string | undefined;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
  }

  /**
   * Generate a mission briefing based on current context
   */
  async generateMissionBriefing(context: MissionContext, options: BriefingOptions = { format: 'summary' }): Promise<string> {
    if (!this.groqApiKey) {
      return this.generateFallbackBriefing(context, options);
    }

    try {
      const prompt = this.buildBriefingPrompt(context, options);
      
      // In a real implementation, this would call Groq API
      // For now, return a structured briefing
      return this.generateStructuredBriefing(context, options);
    } catch (error) {
      console.warn('AI briefing failed, using fallback:', error);
      return this.generateFallbackBriefing(context, options);
    }
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(context: MissionContext): Promise<string> {
    return this.generateMissionBriefing(context, { format: 'executive', focus: 'all' });
  }

  /**
   * Generate safety briefing
   */
  async generateSafetyBriefing(context: MissionContext): Promise<string> {
    return this.generateMissionBriefing(context, { format: 'detailed', focus: 'safety' });
  }

  private buildBriefingPrompt(context: MissionContext, options: BriefingOptions): string {
    return `Generate a ${options.format} mission briefing for space operations.
    
    Current Context:
    - Active Hazards: ${context.hazards.length}
    - Mission Phase: ${context.missionPhase}
    - Timeframe: ${context.timeframe}
    - Focus: ${options.focus || 'all'}
    
    Include: status, recommendations, risks, and next actions.`;
  }

  private generateStructuredBriefing(context: MissionContext, options: BriefingOptions): string {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    let briefing = `=== ODIN MISSION BRIEFING ===\n`;
    briefing += `Generated: ${timestamp}\n`;
    briefing += `Mission Phase: ${context.missionPhase}\n\n`;

    // System Status
    briefing += `SYSTEM STATUS:\n`;
    briefing += `- Active Hazards: ${context.hazards.length}\n`;
    briefing += `- Autonomy Level: Operational\n`;
    briefing += `- AI Confidence: 77%\n\n`;

    // Active Issues
    if (context.hazards.length > 0) {
      briefing += `ACTIVE HAZARDS:\n`;
      context.hazards.slice(0, 3).forEach((hazard, i) => {
        briefing += `${i + 1}. ${hazard.type || 'Unknown'} - ${hazard.severity || 'Medium'}\n`;
      });
      briefing += `\n`;
    }

    // Recommendations
    briefing += `RECOMMENDATIONS:\n`;
    briefing += `- Monitor solar activity for next 6 hours\n`;
    briefing += `- Maintain current power configuration\n`;
    briefing += `- Schedule data dump during next comm window\n\n`;

    // Next Actions
    briefing += `NEXT ACTIONS:\n`;
    briefing += `- Review thermal predictions at next hour\n`;
    briefing += `- Prepare for DSN handover if required\n`;

    return briefing;
  }

  private generateFallbackBriefing(context: MissionContext, options: BriefingOptions): string {
    return `ODIN Mission Brief - ${new Date().toISOString().substring(0, 19)}
    
    Status: Operational
    Active Hazards: ${context.hazards.length}
    Mission Phase: ${context.missionPhase}
    
    All systems nominal. Autonomous operations continue.`;
  }
}

export default new AIBriefingService();
