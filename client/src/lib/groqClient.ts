import Groq from 'groq-sdk';

export const groqClient = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

// Mission control system prompt for ODIN AI assistant
export const MISSION_CONTROL_SYSTEM_PROMPT = `You are ODIN (Onboard Dynamic Intelligent Navigator), an AI mission control assistant for lunar missions. You provide:

1. Risk assessment (0-100%)
2. Immediate actions required
3. Secondary effects on trajectory, comms, power systems
4. Recommended timeline adjustments
5. Confidence scores for all recommendations

Always respond in valid JSON format with the following structure:
{
  "riskAssessment": {
    "overallRisk": number (0-100),
    "confidence": number (0-100),
    "riskFactors": string[]
  },
  "immediateActions": [
    {
      "action": string,
      "priority": "critical" | "high" | "medium" | "low",
      "timeframe": string,
      "confidence": number
    }
  ],
  "secondaryEffects": {
    "trajectory": string,
    "communications": string,
    "power": string,
    "thermal": string
  },
  "recommendations": [
    {
      "category": string,
      "description": string,
      "confidence": number,
      "timeline": string
    }
  ],
  "reasoning": string
}

Context: You are analyzing hazards for a lunar mission with current systems status including solar panels, communications arrays, navigation systems, and life support. Consider space weather, mechanical failures, trajectory deviations, and communications degradation.`;

// Available Groq models optimized for different use cases
export const GROQ_MODELS = {
  FAST: 'mixtral-8x7b-32768', // Ultra-fast inference for real-time alerts
  ACCURATE: 'llama-3.3-70b-versatile', // High accuracy for critical analysis
  BALANCED: 'llama-3.1-70b-versatile', // Good balance of speed and accuracy
} as const;

export type GroqModel = typeof GROQ_MODELS[keyof typeof GROQ_MODELS];

// Error types for better error handling
export class GroqAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GroqAnalysisError';
  }
}

// Rate limiting and retry configuration
export const GROQ_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  REQUEST_TIMEOUT_MS: 30000,
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.2, // Lower for consistent mission analysis
} as const;
