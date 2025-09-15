import { useCallback, useState, useRef } from 'react';
import { groqClient, MISSION_CONTROL_SYSTEM_PROMPT, GROQ_MODELS, GROQ_CONFIG, GroqAnalysisError } from '../lib/groqClient';
import type { 
  AIAnalysisResult, 
  AnalysisRequest, 
  StreamingAnalysisState, 
  AIAnalysisType,
  AIAnalysisContext,
  HazardEvent,
  MissionState
} from '../types/odin';

export interface UseGroqAnalysisReturn {
  analyzeHazard: (hazard: HazardEvent, context?: Partial<AIAnalysisContext>) => Promise<AIAnalysisResult>;
  analyzeHazardStream: (hazard: HazardEvent, onProgress: (chunk: string, partial: Partial<AIAnalysisResult>) => void, context?: Partial<AIAnalysisContext>) => Promise<AIAnalysisResult>;
  isAnalyzing: boolean;
  error: string | null;
  streamingState: StreamingAnalysisState;
  lastRequestId: string | null;
  retryLastAnalysis: () => Promise<AIAnalysisResult | null>;
}

export const useGroqAnalysis = (missionState?: Partial<MissionState>): UseGroqAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingAnalysisState>({
    isStreaming: false,
    currentChunk: '',
    partialResult: {},
    error: null,
    requestId: null,
  });
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const lastRequestRef = useRef<AnalysisRequest | null>(null);

  const buildAnalysisPrompt = useCallback((hazard: HazardEvent, context?: Partial<AIAnalysisContext>): string => {
    const missionContext = {
      currentTime: new Date().toISOString(),
      missionPhase: context?.missionPhase || 'cruise',
      timeToNextBurn: context?.timeToNextBurn,
      criticalSystems: context?.criticalSystemsStatus || {
        navigation: 'nominal',
        communications: 'nominal',
        power: 'nominal',
        propulsion: 'nominal',
      },
      consumables: context?.consumablesStatus || {
        propellant: 85,
        battery: 95,
        water: 90,
        oxygen: 88,
      },
      currentHazardLevel: missionState?.hazards?.length || 0,
      commsStatus: missionState?.comms || { uplinkMs: 0, downlinkMs: 0, packetLossPct: 0, dsnStation: 'DSS-43' },
    };

    return `Analyze this mission hazard:

HAZARD DETAILS:
- Type: ${hazard.kind}
- Label: ${hazard.label}
- Severity: ${hazard.severity}/5
- Start Time: ${new Date(hazard.startTs).toISOString()}
- End Time: ${hazard.endTs ? new Date(hazard.endTs).toISOString() : 'Ongoing'}
- Additional Details: ${JSON.stringify(hazard.details || {}, null, 2)}

CURRENT MISSION CONTEXT:
${JSON.stringify(missionContext, null, 2)}

Provide comprehensive analysis focusing on immediate risks, required actions, and mission impact. Consider the specific nature of this ${hazard.kind} event and its interaction with current mission state.`;
  }, [missionState]);

  const parseAnalysisResponse = useCallback((content: string): AIAnalysisResult => {
    try {
      // Try to parse as complete JSON first
      const parsed = JSON.parse(content);
      
      // Validate required fields
      if (!parsed.riskAssessment || !parsed.immediateActions || !parsed.recommendations) {
        throw new Error('Missing required analysis fields');
      }

      return parsed as AIAnalysisResult;
    } catch (parseError) {
      // Fallback: try to extract partial JSON from streaming content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
        } catch {
          // Ignore
        }
      }

      throw new GroqAnalysisError(
        `Failed to parse AI analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        'PARSE_ERROR',
        false
      );
    }
  }, []);

  const fallbackAnalysis = useCallback((hazard: HazardEvent): AIAnalysisResult => {
    const riskScore = hazard.severity * 20; // 1->20, 5->100
    
    return {
      riskAssessment: {
        overallRisk: riskScore,
        confidence: 60, // Lower confidence for fallback
        riskFactors: [`${hazard.kind} detected`, `Severity level ${hazard.severity}`, 'AI analysis unavailable'],
      },
      immediateActions: [
        {
          action: `Monitor ${hazard.kind} progression`,
          priority: hazard.severity >= 4 ? 'critical' : hazard.severity >= 3 ? 'high' : 'medium',
          timeframe: 'Immediate',
          confidence: 70,
        },
        {
          action: 'Notify mission control',
          priority: 'high',
          timeframe: '5 minutes',
          confidence: 90,
        },
      ],
      secondaryEffects: {
        trajectory: 'Monitor for navigation system impacts',
        communications: 'Potential signal degradation',
        power: 'Solar panel efficiency may be affected',
        thermal: 'Temperature variations possible',
      },
      recommendations: [
        {
          category: 'Monitoring',
          description: 'Increase telemetry frequency for affected systems',
          confidence: 80,
          timeline: 'Next 2 hours',
        },
        {
          category: 'Communications',
          description: 'Prepare backup communication protocols',
          confidence: 75,
          timeline: 'Within 30 minutes',
        },
      ],
      reasoning: 'Fallback rule-based analysis due to AI service unavailability. Based on hazard severity and type classification.',
    };
  }, []);

  const performAnalysisWithRetry = useCallback(async (
    prompt: string, 
    model: string, 
    useStreaming = false,
    onProgress?: (chunk: string, partial: Partial<AIAnalysisResult>) => void
  ): Promise<string> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= GROQ_CONFIG.MAX_RETRIES; attempt++) {
      try {
        if (useStreaming) {
          const stream = await groqClient.chat.completions.create({
            messages: [
              { role: 'system', content: MISSION_CONTROL_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            model,
            stream: true,
            temperature: GROQ_CONFIG.TEMPERATURE,
            max_tokens: GROQ_CONFIG.MAX_TOKENS,
          });

          let fullContent = '';
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            fullContent += delta;
            
            if (onProgress) {
              try {
                const partial = parseAnalysisResponse(fullContent);
                onProgress(delta, partial);
              } catch {
                // Partial parsing failed, continue streaming
                onProgress(delta, {});
              }
            }
          }
          
          return fullContent;
        } else {
          const response = await groqClient.chat.completions.create({
            messages: [
              { role: 'system', content: MISSION_CONTROL_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            model,
            temperature: GROQ_CONFIG.TEMPERATURE,
            max_tokens: GROQ_CONFIG.MAX_TOKENS,
          });

          return response.choices[0]?.message?.content || '';
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < GROQ_CONFIG.MAX_RETRIES) {
          const delay = GROQ_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw new GroqAnalysisError(
      `Analysis failed after ${GROQ_CONFIG.MAX_RETRIES} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      false
    );
  }, [parseAnalysisResponse]);

  const analyzeHazard = useCallback(async (
    hazard: HazardEvent, 
    context?: Partial<AIAnalysisContext>
  ): Promise<AIAnalysisResult> => {
    const requestId = `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLastRequestId(requestId);
    setIsAnalyzing(true);
    setError(null);

    const request: AnalysisRequest = {
      hazard,
      missionState: missionState || {},
      requestId,
      timestamp: Date.now(),
    };
    lastRequestRef.current = request;

    try {
      const prompt = buildAnalysisPrompt(hazard, context);
      const model = hazard.severity >= 4 ? GROQ_MODELS.ACCURATE : GROQ_MODELS.FAST;
      
      const content = await performAnalysisWithRetry(prompt, model);
      const result = parseAnalysisResponse(content);
      
      return result;
    } catch (analysisError) {
      const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
      setError(errorMessage);
      
      // Return fallback analysis for mission continuity
      console.warn('AI analysis failed, using fallback:', errorMessage);
      return fallbackAnalysis(hazard);
    } finally {
      setIsAnalyzing(false);
    }
  }, [buildAnalysisPrompt, performAnalysisWithRetry, parseAnalysisResponse, fallbackAnalysis, missionState]);

  const analyzeHazardStream = useCallback(async (
    hazard: HazardEvent,
    onProgress: (chunk: string, partial: Partial<AIAnalysisResult>) => void,
    context?: Partial<AIAnalysisContext>
  ): Promise<AIAnalysisResult> => {
    const requestId = `stream-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setLastRequestId(requestId);
    setIsAnalyzing(true);
    setError(null);
    setStreamingState({
      isStreaming: true,
      currentChunk: '',
      partialResult: {},
      error: null,
      requestId,
    });

    const request: AnalysisRequest = {
      hazard,
      missionState: missionState || {},
      requestId,
      timestamp: Date.now(),
    };
    lastRequestRef.current = request;

    try {
      const prompt = buildAnalysisPrompt(hazard, context);
      const model = hazard.severity >= 4 ? GROQ_MODELS.ACCURATE : GROQ_MODELS.FAST;
      
      const content = await performAnalysisWithRetry(prompt, model, true, (chunk, partial) => {
        setStreamingState(prev => ({
          ...prev,
          currentChunk: chunk,
          partialResult: partial,
        }));
        onProgress(chunk, partial);
      });
      
      const result = parseAnalysisResponse(content);
      
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        partialResult: result,
      }));
      
      return result;
    } catch (analysisError) {
      const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown streaming error';
      setError(errorMessage);
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
      }));
      
      console.warn('Streaming AI analysis failed, using fallback:', errorMessage);
      return fallbackAnalysis(hazard);
    } finally {
      setIsAnalyzing(false);
    }
  }, [buildAnalysisPrompt, performAnalysisWithRetry, parseAnalysisResponse, fallbackAnalysis, missionState]);

  const retryLastAnalysis = useCallback(async (): Promise<AIAnalysisResult | null> => {
    if (!lastRequestRef.current) {
      setError('No previous analysis to retry');
      return null;
    }

    const { hazard } = lastRequestRef.current;
    return analyzeHazard(hazard);
  }, [analyzeHazard]);

  return {
    analyzeHazard,
    analyzeHazardStream,
    isAnalyzing,
    error,
    streamingState,
    lastRequestId,
    retryLastAnalysis,
  };
};
