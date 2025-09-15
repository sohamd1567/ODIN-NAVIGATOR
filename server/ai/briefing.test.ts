/**
 * Test suite for AI Briefing Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIBriefingService } from './briefing';

describe('AIBriefingService', () => {
  let briefingService: AIBriefingService;
  let mockContext: any;

  beforeEach(() => {
    briefingService = new AIBriefingService();
    mockContext = {
      hazards: [
        { type: 'solar_flare', severity: 'medium' },
        { type: 'communication_loss', severity: 'high' }
      ],
      systemHealth: { overall: 'nominal' },
      missionPhase: 'cruise',
      timeframe: '2025-09-15'
    };
  });

  describe('generateMissionBriefing', () => {
    it('should generate a summary briefing', async () => {
      const briefing = await briefingService.generateMissionBriefing(mockContext, { format: 'summary' });
      
      expect(briefing).toContain('ODIN MISSION BRIEFING');
      expect(briefing).toContain('Mission Phase: cruise');
      expect(briefing).toContain('Active Hazards: 2');
    });

    it('should generate a detailed briefing', async () => {
      const briefing = await briefingService.generateMissionBriefing(mockContext, { format: 'detailed' });
      
      expect(briefing).toContain('SYSTEM STATUS');
      expect(briefing).toContain('RECOMMENDATIONS');
      expect(briefing).toContain('NEXT ACTIONS');
    });

    it('should handle empty hazards', async () => {
      const contextWithoutHazards = { ...mockContext, hazards: [] };
      const briefing = await briefingService.generateMissionBriefing(contextWithoutHazards);
      
      expect(briefing).toContain('Active Hazards: 0');
      expect(briefing).not.toContain('ACTIVE HAZARDS:');
    });
  });

  describe('generateExecutiveSummary', () => {
    it('should generate an executive summary', async () => {
      const summary = await briefingService.generateExecutiveSummary(mockContext);
      
      expect(summary).toContain('ODIN MISSION BRIEFING');
      expect(summary).toContain('Generated:');
    });
  });

  describe('generateSafetyBriefing', () => {
    it('should generate a safety-focused briefing', async () => {
      const safetyBriefing = await briefingService.generateSafetyBriefing(mockContext);
      
      expect(safetyBriefing).toContain('ODIN MISSION BRIEFING');
      expect(safetyBriefing).toContain('Active Hazards: 2');
    });
  });

  describe('fallback behavior', () => {
    it('should use fallback when no API key is available', async () => {
      // This tests the fallback path when GROQ_API_KEY is not set
      const briefing = await briefingService.generateMissionBriefing(mockContext);
      
      expect(briefing).toBeDefined();
      expect(briefing.length).toBeGreaterThan(0);
    });
  });
});
