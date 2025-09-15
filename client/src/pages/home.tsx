import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import HazardInputPanel from "@/components/HazardInputPanel";
import TrajectoryVisualization from "@/components/TrajectoryVisualization";
import DecisionLog from "@/components/DecisionLog";
import CrewSummary from "@/components/CrewSummary";
import MoonPhaseWidget from "@/components/MoonPhaseWidget";
import InteractiveMissionTimeline from "@/components/InteractiveMissionTimeline";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import MultiHazardPanel from "@/components/MultiHazardPanel";
import CommsHealthWidget from "@/components/CommsHealthWidget";
import HazardBanner from "@/components/HazardBanner";
import DSNHandoverWidget from "@/components/DSNHandoverWidget";
import TelemetryScheduler from "@/components/TelemetryScheduler";
import NavigationPanel from "@/components/NavigationPanel";
import SimulationPanel from "@/components/SimulationPanel";
import CommsRedundancyPanel from "@/components/CommsRedundancyPanel";
import SystemConfigPanel from "@/components/SystemConfigPanel";
import TeamCoordinationPanel from "@/components/TeamCoordinationPanel";
import EmergencyRecoveryPanel from "@/components/EmergencyRecoveryPanel";
import ContinuousLearningPanel from "@/components/ContinuousLearningPanel";
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { DrilldownModal, useDrilldown } from "@/components/DrilldownModals";
import { ConfidenceDetailsModal } from "@/components/ConfidenceDetailsModal";
import { AutonomyDashboard } from "@/components/AutonomyDashboard";
import { useCombinedRisk } from "@/context/MissionContext";
import { useEffect, useState } from "react";
import { useMission } from "@/context/MissionContext";
import { activeRLevelFromHazards } from "@/types/odin";
import assistantName from "@/lib/assistantName";

export default function Home() {
  const drill = useDrilldown();
  const combinedRisk = useCombinedRisk();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState("");
  const [showConfidence, setShowConfidence] = useState(false);
  const [activeView, setActiveView] = useState<'mission' | 'autonomy'>('mission');
  const { simulationMode } = useMission();
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [prevSim, setPrevSim] = useState(simulationMode);
  const { hazards } = useMission();
  const activeR = activeRLevelFromHazards(hazards);
  const { addLog, addMissionEvent } = useMission();
  useEffect(() => {
    if (combinedRisk >= 70) {
      const id = Date.now();
      addLog({
        id,
        timestamp: new Date().toISOString().replace('T',' ').substring(0,19),
        type: 'NAV_ACTION',
        severity: 'warning',
        subsystem: 'nav',
        actionRequired: true,
        data: {
          action: 'Prepare low-Δv TCM',
          est_delay_min: 20,
          fuel_margin_ms: 45,
          uncertainty: 'Increased dispersion observed; prepare contingency burn. '
        }
      });
      addMissionEvent({ id: `tcm-${id}`, ts: Date.now()+30*60_000, type: 'burn', label: 'TCM Prep Window', durationMs: 10*60_000, meta: { logId: id } });
    }
  }, [combinedRisk]);

  const handleAnalysis = (hazard: string) => {
    setSelectedHazard(hazard);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 3000);
  };

  // Watch simulation mode for exit to show transient banner and animate sync
  useEffect(() => {
  if (prevSim && !simulationMode) {
      setSyncBanner("Exiting Simulation Mode… syncing to live telemetry.");
      const t = setTimeout(() => setSyncBanner(null), 3000);
      return () => clearTimeout(t);
    }
    setPrevSim(simulationMode);
  }, [simulationMode]);

  return (
    <div className="min-h-screen cosmic-bg text-foreground font-sans overflow-x-hidden">
      <StarField />

      <header className="odin-header" role="banner" aria-label="ODIN header navigation">
        <div className="logo-section">
          <div className="w-10 h-10 rounded-full" style={{ background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', boxShadow: '0 0 24px rgba(0,217,255,0.35)' }} aria-hidden />
          <div>
            <h1 className="text-xl font-bold" data-testid="title-odin">{assistantName}</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Optimal Dynamic Interplanetary Navigator</p>
          </div>
        </div>
        <div className="mission-selector">
          <div className="flex gap-2 mr-4">
            <button 
              onClick={() => setActiveView('mission')}
              className={`px-3 py-1 text-sm rounded ${activeView === 'mission' ? 'bg-accent-primary text-white' : 'bg-transparent text-text-secondary border border-text-secondary/30'}`}
            >
              Mission Control
            </button>
            <button 
              onClick={() => setActiveView('autonomy')}
              className={`px-3 py-1 text-sm rounded ${activeView === 'autonomy' ? 'bg-accent-primary text-white' : 'bg-transparent text-text-secondary border border-text-secondary/30'}`}
            >
              Autonomy Systems
            </button>
          </div>
          <label className="sr-only" htmlFor="mission">Select mission</label>
          <select id="mission" className="input-field" aria-label="Mission selector">
            <option>Earth–Moon Transit</option>
            <option>Mars Supply Run</option>
            <option>Asteroid Belt Survey</option>
          </select>
        </div>
        <div className="status-indicators" aria-live="polite">
          <MoonPhaseWidget />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--success)', display: 'inline-block' }} aria-hidden />
            <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="status-active">ACTIVE</span>
          </div>
        </div>
        <div className="user-profile">
          <div className="w-8 h-8 rounded-full" style={{ background: '#222', border: '1px solid rgba(255,255,255,0.1)' }} aria-label="User profile" />
        </div>
      </header>

      <main role="main" aria-label="ODIN Mission Control Interface" className="main-container" style={{ padding: 16, gap: 16 }}>
        {activeR && <HazardBanner />}
        {syncBanner && (
          <div className="col-span-3 mb-2 px-3 py-2 rounded border border-yellow-500/60 bg-yellow-900/30 text-yellow-200 text-sm" role="status" aria-live="polite">{syncBanner}</div>
        )}
        
        {activeView === 'autonomy' ? (
          <AutonomyDashboard 
            systemHealth={{
              overall: 'nominal',
              subsystems: {
                comms: { status: 'nominal', confidence: 95, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                power: { status: 'nominal', confidence: 92, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                thermal: { status: 'nominal', confidence: 88, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                navigation: { status: 'nominal', confidence: 97, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                propulsion: { status: 'nominal', confidence: 90, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                life_support: { status: 'nominal', confidence: 94, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true },
                science: { status: 'nominal', confidence: 89, lastAssessment: new Date(), criticalParameters: [], autonomyAvailable: true }
              },
              activeAlerts: [],
              predictiveHealth: []
            }}
            environment={{
              solarActivity: { flareRisk: 'low', solarWindSpeed: 400, kpIndex: 2, predictedFlares: [] },
              radiation: { totalDose: 12.5, doseRate: 0.05, shieldingEffectiveness: 85, saaTransit: false },
              temperature: { sunExposure: 75, earthAlbedo: 35, deepSpaceView: 90, predictedTempSwing: 15 },
              micrometeorite: { fluxDensity: 0.001, averageVelocity: 20, riskLevel: 'low' },
              communicationConditions: { signalStrength: -75, dataRate: 256, latency: 1200, blackoutRisk: 'low', nextDsnHandover: new Date(Date.now() + 4 * 60 * 60 * 1000) }
            }}
            missionPhase="transit"
          />
        ) : (
          <>
            {/* Left Sidebar */}
            <section aria-labelledby="hazard-assessment" className="glass-card" style={{ gridColumn: '1', gridRow: '2' }}>
              <h2 id="hazard-assessment" className="text-lg font-semibold" style={{ marginBottom: 8 }}>Mission Hazard Assessment</h2>
              <HazardInputPanel onAnalysis={handleAnalysis} isAnalyzing={isAnalyzing} analysisComplete={analysisComplete} />
              <div style={{ marginTop: 16 }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowConfidence(true)} aria-label="Show ODIN Confidence details">
                    <ConfidenceMeter value={Math.round(Math.random() * 80 + 10)} />
                  </button>
                  <div className="text-xs text-muted-foreground">Combined Risk: <span className="font-mono text-primary">{combinedRisk}</span></div>
                </div>
              </div>
              <div className="mt-4">
                <MultiHazardPanel />
              </div>
              <div className="mt-4">
                <CommsHealthWidget />
              </div>
              <div className="mt-4">
                <DSNHandoverWidget />
              </div>
              <div className="mt-4">
                <TelemetryScheduler />
              </div>
              <div className="mt-4">
                <NavigationPanel />
              </div>
              <div className="mt-4">
                <CommsRedundancyPanel />
              </div>
              <div className="mt-4">
                <SystemConfigPanel />
              </div>
              <div className="mt-4">
                <TeamCoordinationPanel />
              </div>
              <div className="mt-4">
                <EmergencyRecoveryPanel />
              </div>
              <div className="mt-4">
                <ContinuousLearningPanel />
              </div>
              <div className="mt-4">
                <SimulationPanel />
              </div>
            </section>

            {/* Main Viewport */}
            <section className="glass-card" style={{ gridColumn: '2', gridRow: '2', display: 'flex', flexDirection: 'column' }}>
              <TrajectoryVisualization showTrajectory={analysisComplete} isAnimating={isAnalyzing} />
            </section>

            {/* Right Panel */}
            <aside className="glass-card" style={{ gridColumn: '3', gridRow: '2', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>AI Mission Analysis</h2>
                <AIAnalysisPanel />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>Decision Log</h2>
                <div className="decision-log-card" style={{ padding: 8 }}>
                  <DecisionLog isAnalyzing={isAnalyzing} analysisComplete={analysisComplete} hazardType={selectedHazard} />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ marginBottom: 8 }}>Timeline</h2>
                <InteractiveMissionTimeline />
              </div>
            </aside>
          </>
        )}

        {/* Footer/Status row */}
        <footer className="glass-card" style={{ gridColumn: '1 / span 3', gridRow: '3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{assistantName} v2.1.0 | Mission Control Interface | <span style={{ color: 'var(--accent-primary)' }}>Earth-Moon Transit Authority</span></p>
        </footer>
      </main>
  <DrilldownModal open={drill.open} onClose={drill.hide} />
  <ConfidenceDetailsModal open={showConfidence} onClose={() => setShowConfidence(false)} />
     </div>
  );
}
