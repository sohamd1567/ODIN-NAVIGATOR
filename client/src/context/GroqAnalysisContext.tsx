import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { useGroqAnalysis } from '../hooks/useGroqAnalysis';
import type { 
  AIAnalysisResult, 
  HazardEvent, 
  MissionState,
  AIAnalysisContext,
  StreamingAnalysisState 
} from '../types/odin';

interface AnalysisHistoryEntry {
  id: string;
  hazard: HazardEvent;
  result: AIAnalysisResult;
  timestamp: number;
  requestDuration: number;
  model: string;
  fallbackUsed: boolean;
}

interface GroqAnalysisState {
  isAnalyzing: boolean;
  error: string | null;
  analysisHistory: AnalysisHistoryEntry[];
  streamingState: StreamingAnalysisState;
  apiStatus: 'connected' | 'disconnected' | 'error' | 'checking';
  analysisQueue: Array<{ hazard: HazardEvent; context?: Partial<AIAnalysisContext> }>;
  confidenceThreshold: number; // Minimum confidence for auto-actions
}

type GroqAnalysisAction = 
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ANALYSIS'; payload: AnalysisHistoryEntry }
  | { type: 'UPDATE_STREAMING'; payload: Partial<StreamingAnalysisState> }
  | { type: 'SET_API_STATUS'; payload: GroqAnalysisState['apiStatus'] }
  | { type: 'ADD_TO_QUEUE'; payload: { hazard: HazardEvent; context?: Partial<AIAnalysisContext> } }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'SET_CONFIDENCE_THRESHOLD'; payload: number }
  | { type: 'CLEAR_HISTORY' };

const initialState: GroqAnalysisState = {
  isAnalyzing: false,
  error: null,
  analysisHistory: [],
  streamingState: {
    isStreaming: false,
    currentChunk: '',
    partialResult: {},
    error: null,
    requestId: null,
  },
  apiStatus: 'checking',
  analysisQueue: [],
  confidenceThreshold: 70, // 70% minimum confidence for automated actions
};

function groqAnalysisReducer(state: GroqAnalysisState, action: GroqAnalysisAction): GroqAnalysisState {
  switch (action.type) {
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_ANALYSIS':
      return { 
        ...state, 
        analysisHistory: [action.payload, ...state.analysisHistory].slice(0, 50) // Keep last 50
      };
    case 'UPDATE_STREAMING':
      return { 
        ...state, 
        streamingState: { ...state.streamingState, ...action.payload }
      };
    case 'SET_API_STATUS':
      return { ...state, apiStatus: action.payload };
    case 'ADD_TO_QUEUE':
      return { 
        ...state, 
        analysisQueue: [...state.analysisQueue, action.payload]
      };
    case 'REMOVE_FROM_QUEUE':
      return { 
        ...state, 
        analysisQueue: state.analysisQueue.filter(item => item.hazard.id !== action.payload)
      };
    case 'SET_CONFIDENCE_THRESHOLD':
      return { ...state, confidenceThreshold: action.payload };
    case 'CLEAR_HISTORY':
      return { ...state, analysisHistory: [] };
    default:
      return state;
  }
}

interface GroqAnalysisContextType extends GroqAnalysisState {
  analyzeHazard: (hazard: HazardEvent, context?: Partial<AIAnalysisContext>) => Promise<AIAnalysisResult>;
  analyzeHazardStream: (
    hazard: HazardEvent, 
    onProgress: (chunk: string, partial: Partial<AIAnalysisResult>) => void,
    context?: Partial<AIAnalysisContext>
  ) => Promise<AIAnalysisResult>;
  queueAnalysis: (hazard: HazardEvent, context?: Partial<AIAnalysisContext>) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  retryAnalysis: (entryId: string) => Promise<void>;
  checkApiStatus: () => Promise<void>;
  setConfidenceThreshold: (threshold: number) => void;
  clearHistory: () => void;
  getAnalysisForHazard: (hazardId: string) => AnalysisHistoryEntry | null;
  getRecentHighConfidenceAnalyses: () => AnalysisHistoryEntry[];
}

const GroqAnalysisContext = createContext<GroqAnalysisContextType | null>(null);

interface GroqAnalysisProviderProps {
  children: React.ReactNode;
  missionState?: Partial<MissionState>;
}

export const GroqAnalysisProvider: React.FC<GroqAnalysisProviderProps> = ({ 
  children, 
  missionState 
}) => {
  const [state, dispatch] = useReducer(groqAnalysisReducer, initialState);
  const groqHook = useGroqAnalysis(missionState);

  // Sync hook state with context state
  useEffect(() => {
    dispatch({ type: 'SET_ANALYZING', payload: groqHook.isAnalyzing });
  }, [groqHook.isAnalyzing]);

  useEffect(() => {
    dispatch({ type: 'SET_ERROR', payload: groqHook.error });
  }, [groqHook.error]);

  useEffect(() => {
    dispatch({ type: 'UPDATE_STREAMING', payload: groqHook.streamingState });
  }, [groqHook.streamingState]);

  const checkApiStatus = useCallback(async () => {
    // Don't run health checks automatically to avoid unnecessary API calls
    dispatch({ type: 'SET_API_STATUS', payload: 'disconnected' });
  }, []);

  // Don't check API status on mount to prevent automatic connections
  // useEffect(() => {
  //   checkApiStatus();
  // }, [checkApiStatus]);

  const analyzeHazard = useCallback(async (
    hazard: HazardEvent, 
    context?: Partial<AIAnalysisContext>
  ): Promise<AIAnalysisResult> => {
    const startTime = Date.now();
    
    try {
      const result = await groqHook.analyzeHazard(hazard, context);
      const endTime = Date.now();
      
      const entry: AnalysisHistoryEntry = {
        id: `${hazard.id}-${startTime}`,
        hazard,
        result,
        timestamp: startTime,
        requestDuration: endTime - startTime,
        model: hazard.severity >= 4 ? 'llama-3.3-70b-versatile' : 'mixtral-8x7b-32768',
        fallbackUsed: state.error !== null,
      };
      
      dispatch({ type: 'ADD_ANALYSIS', payload: entry });
      
      // Update API status on successful analysis
      if (state.apiStatus !== 'connected') {
        dispatch({ type: 'SET_API_STATUS', payload: 'connected' });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: 'SET_API_STATUS', payload: 'error' });
      throw error;
    }
  }, [groqHook, state.error, state.apiStatus]);

  const analyzeHazardStream = useCallback(async (
    hazard: HazardEvent,
    onProgress: (chunk: string, partial: Partial<AIAnalysisResult>) => void,
    context?: Partial<AIAnalysisContext>
  ): Promise<AIAnalysisResult> => {
    const startTime = Date.now();
    
    try {
      const result = await groqHook.analyzeHazardStream(hazard, onProgress, context);
      const endTime = Date.now();
      
      const entry: AnalysisHistoryEntry = {
        id: `${hazard.id}-${startTime}-stream`,
        hazard,
        result,
        timestamp: startTime,
        requestDuration: endTime - startTime,
        model: hazard.severity >= 4 ? 'llama-3.3-70b-versatile' : 'mixtral-8x7b-32768',
        fallbackUsed: state.error !== null,
      };
      
      dispatch({ type: 'ADD_ANALYSIS', payload: entry });
      
      if (state.apiStatus !== 'connected') {
        dispatch({ type: 'SET_API_STATUS', payload: 'connected' });
      }
      
      return result;
    } catch (error) {
      dispatch({ type: 'SET_API_STATUS', payload: 'error' });
      throw error;
    }
  }, [groqHook, state.error, state.apiStatus]);

  const queueAnalysis = useCallback((hazard: HazardEvent, context?: Partial<AIAnalysisContext>) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: { hazard, context } });
  }, []);

  const processQueue = useCallback(async () => {
    for (const item of state.analysisQueue) {
      try {
        await analyzeHazard(item.hazard, item.context);
        dispatch({ type: 'REMOVE_FROM_QUEUE', payload: item.hazard.id });
      } catch (error) {
        console.error('Queue processing failed for hazard:', item.hazard.id, error);
        // Keep in queue for retry
      }
    }
  }, [state.analysisQueue, analyzeHazard]);

  const clearQueue = useCallback(() => {
    state.analysisQueue.forEach(item => {
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: item.hazard.id });
    });
  }, [state.analysisQueue]);

  const retryAnalysis = useCallback(async (entryId: string) => {
    const entry = state.analysisHistory.find(e => e.id === entryId);
    if (entry) {
      await analyzeHazard(entry.hazard);
    }
  }, [state.analysisHistory, analyzeHazard]);

  const setConfidenceThreshold = useCallback((threshold: number) => {
    dispatch({ type: 'SET_CONFIDENCE_THRESHOLD', payload: threshold });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const getAnalysisForHazard = useCallback((hazardId: string): AnalysisHistoryEntry | null => {
    return state.analysisHistory.find(entry => entry.hazard.id === hazardId) || null;
  }, [state.analysisHistory]);

  const getRecentHighConfidenceAnalyses = useCallback((): AnalysisHistoryEntry[] => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return state.analysisHistory.filter(entry => 
      entry.timestamp > oneDayAgo && 
      entry.result.riskAssessment.confidence >= state.confidenceThreshold
    );
  }, [state.analysisHistory, state.confidenceThreshold]);

  const contextValue: GroqAnalysisContextType = {
    ...state,
    analyzeHazard,
    analyzeHazardStream,
    queueAnalysis,
    processQueue,
    clearQueue,
    retryAnalysis,
    checkApiStatus,
    setConfidenceThreshold,
    clearHistory,
    getAnalysisForHazard,
    getRecentHighConfidenceAnalyses,
  };

  return (
    <GroqAnalysisContext.Provider value={contextValue}>
      {children}
    </GroqAnalysisContext.Provider>
  );
};

export const useGroqAnalysisContext = (): GroqAnalysisContextType => {
  const context = useContext(GroqAnalysisContext);
  if (!context) {
    throw new Error('useGroqAnalysisContext must be used within GroqAnalysisProvider');
  }
  return context;
};
