import React from 'react';
import { useMission } from '@/context/MissionContext';
import { useNotificationStore } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { activeRLevelFromHazards } from '@/types/odin';
import { AlertTriangle, Radio, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function HazardBanner() {
  const { hazards, addLog, addMissionEvent } = useMission();
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();
  const r = activeRLevelFromHazards(hazards);
  const solar = hazards.find(h => h.kind === 'solar-flare');
  
  if (!solar || !r) return null;
  
  const cls = solar.details?.class || 'M1.0';
  const ar = solar.details?.sourceRegion || 'AR3751';
  const text = `Solar Flare ${cls} detected (${ar}) – ${r.r} radio blackout. Follow comms redundancy protocol.`;
  
  const handleUHFValidation = () => {
    console.log('🔧 UHF Validation button clicked!');
    const correlationId = crypto?.randomUUID?.() || String(Date.now());
    const relatedLogId = Date.now() - 1;
    const id = Date.now();
    
    // Add to decision log
    addLog({ 
      id, 
      timestamp: new Date().toISOString().replace('T',' ').substring(0,19), 
      type: 'COMMS_ACTION', 
      severity: 'info', 
      subsystem: 'comms', 
      data: { action: 'UHF validation confirmed', correlationId, relatedLogId } 
    });
    
    // Add mission event
    addMissionEvent({ 
      id: `uhfconf-${id}`, 
      ts: Date.now(), 
      type: 'comm', 
      label: 'UHF Validation Confirmed', 
      meta: { logId: id } 
    });
    
    // Create success notification
    addNotification({
      severity: 'info',
      title: 'UHF Validation Confirmed',
      message: 'Communication backup system validated and ready for use during solar flare event.',
      source: 'Communications',
      actions: [
        {
          label: 'View Comm Status',
          onClick: () => {
            // Could trigger navigation to communications tab
            console.log('Navigate to communications status');
          },
          ariaLabel: 'View detailed communication system status'
        }
      ]
    });
    
    // Also show a toast for immediate feedback
    toast({
      title: "✅ UHF Validation Confirmed",
      description: "Communication backup system validated and ready for use.",
      duration: 4000,
    });
    
    console.log('🔧 UHF Validation completed - log and notification added');
  };

  const handleDismissBanner = () => {
    // This could remove the hazard or mark it as acknowledged
    console.log('Banner dismissed');
  };

  return (
    <div 
      className="w-full mb-2 px-4 py-3 rounded-lg border border-yellow-500/60 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 text-yellow-100 shadow-lg backdrop-blur-sm" 
      role="alert" 
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-sm mb-1">
              Solar Flare Event Active
            </div>
            <div className="text-xs text-yellow-200" aria-label={`Hazard details: ${text}`}>
              {text}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-200">
                {cls} Class
              </Badge>
              <Badge variant="outline" className="text-xs border-red-400/50 text-red-200">
                {r.r} Blackout
              </Badge>
              <Badge variant="outline" className="text-xs border-blue-400/50 text-blue-200">
                {ar}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUHFValidation}
            className="text-xs border-yellow-400/50 hover:bg-yellow-400/10 text-yellow-100 hover:text-yellow-50"
          >
            <Radio className="h-3 w-3 mr-1" />
            Confirm UHF Validation
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismissBanner}
            className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-400/10 h-8 w-8 p-0"
            aria-label="Dismiss hazard banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
