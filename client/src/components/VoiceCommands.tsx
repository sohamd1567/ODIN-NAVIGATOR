import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Brain, MessageSquare } from 'lucide-react';

interface VoiceCommand {
  id: string;
  timestamp: Date;
  transcript: string;
  confidence: number;
  intent: string;
  parameters?: Record<string, any>;
  response: string;
  status: 'processing' | 'completed' | 'failed';
  actionTaken?: string;
}

interface Props {
  missionState?: any;
  onCommand?: (command: VoiceCommand) => void;
  autoListen?: boolean;
}

const VoiceCommands: React.FC<Props> = ({ 
  missionState, 
  onCommand, 
  autoListen = false 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<any>(null);

  // Simulated voice recognition since Web Speech API might not be available
  const simulatedCommands = [
    { phrase: "show mission status", intent: "status_request", response: "Displaying mission overview. All systems nominal." },
    { phrase: "battery level", intent: "power_query", response: "Battery state of charge is currently 78 percent." },
    { phrase: "navigation check", intent: "nav_status", response: "Navigation systems operational. Current position dispersion within acceptable limits." },
    { phrase: "hazard report", intent: "hazard_query", response: "Solar flare activity detected. Implementing protective protocols." },
    { phrase: "thermal status", intent: "thermal_query", response: "Thermal systems stable. Primary battery temperature 34.2 degrees Celsius." },
    { phrase: "ai recommendations", intent: "ai_request", response: "Generating intelligent recommendations based on current mission parameters." },
    { phrase: "emergency protocol", intent: "emergency", response: "Emergency protocols ready. Please specify the nature of the emergency." },
    { phrase: "communication test", intent: "comm_test", response: "Communication systems functional. Signal strength nominal." },
    { phrase: "run diagnostics", intent: "diagnostics", response: "Initiating comprehensive system diagnostics. Estimated completion in 3 minutes." },
    { phrase: "prediction timeline", intent: "prediction", response: "AI predictive timeline updated. Next critical event in 2.4 hours." }
  ];

  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript = event.results[i][0].transcript;
            processVoiceCommand(transcript, event.results[i][0].confidence);
          } else {
            setCurrentTranscript(event.results[i][0].transcript);
          }
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        // Fallback to simulated commands on error
        simulateVoiceCommand();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
  };

  const simulateVoiceCommand = () => {
    const randomCommand = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
    const confidence = 0.85 + Math.random() * 0.15; // 85-100% confidence
    
    setTimeout(() => {
      processVoiceCommand(randomCommand.phrase, confidence);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const processVoiceCommand = (transcript: string, confidence: number) => {
    setCurrentTranscript('');
    
    // AI Intent Recognition (simulated)
    const intent = recognizeIntent(transcript);
    const response = generateResponse(intent, transcript);
    
    const command: VoiceCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      transcript,
      confidence,
      intent: intent.type,
      parameters: intent.parameters,
      response: response.text,
      status: 'processing',
      actionTaken: response.action
    };

    setCommands(prev => [command, ...prev].slice(0, 10)); // Keep last 10 commands

    // Simulate processing time
    setTimeout(() => {
      setCommands(prev => prev.map(cmd => 
        cmd.id === command.id ? { ...cmd, status: 'completed' } : cmd
      ));

      // Speak the response if voice is enabled
      if (voiceEnabled && response.text) {
        speakResponse(response.text);
      }

      // Call the callback if provided
      if (onCommand) {
        onCommand({ ...command, status: 'completed' });
      }
    }, 800 + Math.random() * 1200);
  };

  const recognizeIntent = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('battery') || lowerTranscript.includes('power')) {
      return {
        type: 'power_query',
        parameters: { system: 'battery', level: missionState?.power?.batterySOC }
      };
    }
    
    if (lowerTranscript.includes('navigation') || lowerTranscript.includes('position')) {
      return {
        type: 'nav_status',
        parameters: { dispersion: missionState?.navigation?.dispersion }
      };
    }
    
    if (lowerTranscript.includes('hazard') || lowerTranscript.includes('danger') || lowerTranscript.includes('alert')) {
      return {
        type: 'hazard_query',
        parameters: { hazards: missionState?.hazards }
      };
    }
    
    if (lowerTranscript.includes('thermal') || lowerTranscript.includes('temperature')) {
      return {
        type: 'thermal_query',
        parameters: { temperature: missionState?.hazards?.thermal?.temperature }
      };
    }
    
    if (lowerTranscript.includes('status') || lowerTranscript.includes('overview')) {
      return {
        type: 'status_request',
        parameters: { full_status: true }
      };
    }
    
    if (lowerTranscript.includes('ai') || lowerTranscript.includes('recommend') || lowerTranscript.includes('suggest')) {
      return {
        type: 'ai_request',
        parameters: { type: 'recommendations' }
      };
    }
    
    if (lowerTranscript.includes('emergency') || lowerTranscript.includes('critical')) {
      return {
        type: 'emergency',
        parameters: { level: 'high' }
      };
    }

    if (lowerTranscript.includes('diagnostic') || lowerTranscript.includes('test')) {
      return {
        type: 'diagnostics',
        parameters: { scope: 'comprehensive' }
      };
    }

    if (lowerTranscript.includes('prediction') || lowerTranscript.includes('timeline') || lowerTranscript.includes('forecast')) {
      return {
        type: 'prediction',
        parameters: { horizon: '12h' }
      };
    }
    
    return {
      type: 'unknown',
      parameters: { transcript }
    };
  };

  const generateResponse = (intent: any, transcript: string) => {
    switch (intent.type) {
      case 'power_query':
        const batteryLevel = missionState?.power?.batterySOC || 78;
        return {
          text: `Battery state of charge is ${batteryLevel}%. ${batteryLevel > 50 ? 'Power levels are stable.' : 'Consider power conservation measures.'}`,
          action: 'POWER_STATUS_DISPLAYED'
        };
        
      case 'nav_status':
        const dispersion = missionState?.navigation?.dispersion || 12;
        return {
          text: `Navigation systems operational. Position dispersion is ${dispersion} kilometers. ${dispersion < 20 ? 'Within nominal parameters.' : 'Approaching trajectory correction threshold.'}`,
          action: 'NAV_STATUS_DISPLAYED'
        };
        
      case 'hazard_query':
        const hasHazards = missionState?.hazards?.solarFlare?.active || missionState?.hazards?.thermal?.temperature > 35;
        return {
          text: hasHazards ? 'Active hazards detected. Solar flare activity and elevated thermal conditions. Protective protocols engaged.' : 'No significant hazards detected. All environmental parameters within safe limits.',
          action: 'HAZARD_REPORT_GENERATED'
        };
        
      case 'thermal_query':
        const temp = missionState?.hazards?.thermal?.temperature || 34.2;
        return {
          text: `Primary battery temperature ${temp.toFixed(1)} degrees Celsius. ${temp > 35 ? 'Temperature elevated, monitoring closely.' : 'Thermal systems stable.'}`,
          action: 'THERMAL_STATUS_DISPLAYED'
        };
        
      case 'status_request':
        return {
          text: 'Mission status nominal. All primary systems operational. AI autonomy level at 87%. No critical issues detected.',
          action: 'MISSION_OVERVIEW_DISPLAYED'
        };
        
      case 'ai_request':
        return {
          text: 'AI recommendation engine active. Analyzing current mission parameters and generating optimized action suggestions.',
          action: 'AI_RECOMMENDATIONS_GENERATED'
        };
        
      case 'emergency':
        return {
          text: 'Emergency protocols armed and ready. Please specify the nature of the emergency for targeted response procedures.',
          action: 'EMERGENCY_PROTOCOLS_READY'
        };
        
      case 'diagnostics':
        return {
          text: 'Initiating comprehensive system diagnostics. Full health check will complete in approximately 3 minutes.',
          action: 'DIAGNOSTICS_INITIATED'
        };
        
      case 'prediction':
        return {
          text: 'AI predictive timeline updated. Next significant event projected in 2.4 hours. Confidence level 89%.',
          action: 'PREDICTION_TIMELINE_UPDATED'
        };
        
      default:
        return {
          text: `Command received: "${transcript}". AI is analyzing the request and will provide appropriate response.`,
          action: 'UNKNOWN_COMMAND_PROCESSED'
        };
    }
  };

  const speakResponse = (text: string) => {
    if (speechSynthRef.current && voiceEnabled) {
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        // Fallback to simulated command
        setIsListening(true);
        simulateVoiceCommand();
        setTimeout(() => setIsListening(false), 3000);
      }
    }
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    initializeVoiceRecognition();
    
    // Auto-listen simulation for demo purposes
    if (autoListen) {
      const interval = setInterval(() => {
        if (!isListening && Math.random() > 0.7) {
          simulateVoiceCommand();
        }
      }, 15000); // Every 15 seconds, 30% chance

      return () => clearInterval(interval);
    }
  }, [autoListen, isListening]);

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'emergency': return 'text-red-400';
      case 'power_query': return 'text-yellow-400';
      case 'hazard_query': return 'text-orange-400';
      case 'ai_request': return 'text-purple-400';
      case 'nav_status': return 'text-blue-400';
      case 'thermal_query': return 'text-cyan-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="voice-commands bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Voice Command Interface</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded border transition-colors ${
              voiceEnabled 
                ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                : 'bg-gray-500/20 border-gray-500/40 text-gray-400'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full border-2 transition-all duration-300 ${
              isListening 
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-2 rounded border bg-orange-500/20 border-orange-500/40 text-orange-400"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Current Transcript */}
      {currentTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">Listening...</span>
          </div>
          <p className="text-foreground mt-1">{currentTranscript}</p>
        </motion.div>
      )}

      {/* Command History */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {commands.map((command, index) => (
            <motion.div
              key={command.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-background/30 border border-border/50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className={`text-sm font-medium ${getIntentColor(command.intent)}`}>
                    {command.intent.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {command.confidence.toFixed(2)}% confidence
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    command.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                    command.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {command.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">Command:</span>
                  <p className="text-sm text-foreground italic">"{command.transcript}"</p>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground">AI Response:</span>
                  <p className="text-sm text-foreground">{command.response}</p>
                </div>

                {command.actionTaken && (
                  <div className="text-xs text-muted-foreground">
                    Action: {command.actionTaken}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {commands.length === 0 && (
          <div className="text-center py-8">
            <Mic className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No voice commands yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click the microphone to start voice interaction
            </p>
          </div>
        )}
      </div>

      {/* Voice Command Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-green-400">
            {commands.filter(c => c.status === 'completed').length}
          </div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-blue-400">
            {commands.length > 0 ? (commands.reduce((sum, c) => sum + c.confidence, 0) / commands.length * 100).toFixed(0) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Accuracy</div>
        </div>
        <div className="p-2 bg-background/30 rounded border border-border/20 text-center">
          <div className="text-lg font-mono font-bold text-purple-400">
            {new Set(commands.map(c => c.intent)).size}
          </div>
          <div className="text-xs text-muted-foreground">Intent Types</div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommands;
