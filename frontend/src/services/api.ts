import type { 
  Anomaly, 
  Survey, 
  DashboardMetrics, 
  TemporalPoint,
  ProcessingJob,
  AnomalyFilters,
  ReviewDecision,
  ReportSummary,
  ModelFeedback
} from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getDashboardMetrics = async (harbour?: string): Promise<DashboardMetrics> => {
  // Fetch actual counts from anomalies and missions
  try {
    const queryParam = harbour ? `?mission_id=${encodeURIComponent(harbour)}` : '';
    const missionsRes = await fetch(`${API_BASE_URL}/missions`);
    const anomaliesRes = await fetch(`${API_BASE_URL}/anomalies${queryParam}`);
    
    if (!missionsRes.ok || !anomaliesRes.ok) throw new Error("Failed to fetch metrics");
    
    const missions = await missionsRes.json();
    const anomalies = await anomaliesRes.json();
    
    return {
      normalRegions: missions.length * 12,
      knownAnomalies: anomalies.filter((a: any) => ['Crab-Pot', 'Shipwreck'].some(t => a.type.includes(t))).length,
      unknownAnomalies: anomalies.filter((a: any) => !['Crab-Pot', 'Shipwreck'].some(t => a.type.includes(t))).length,
      newChanges: anomalies.filter((a: any) => a.status === 'NEW').length,
    };
  } catch (err: any) {
    console.error("Dashboard metrics error, returning fallback", err);
    return { normalRegions: 0, knownAnomalies: 0, unknownAnomalies: 0, newChanges: 0 };
  }
};

export const getSurveys = async (): Promise<Survey[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/missions`);
    if (!res.ok) throw new Error("Failed to fetch missions");
    const missions = await res.json();
    
    return missions.map((m: any) => ({
      id: m.mission_id || m.id,
      name: m.name || m.mission_id,
      vessel: m.source || 'Unknown',
      area: 'Local Sector',
      surveyDate: m.created_at,
      depthRange: m.depth ? `${m.depth - 10}-${m.depth + 10}m` : 'Unknown',
      status: m.status.toLowerCase() === 'completed' ? 'complete' : 
              m.status.toLowerCase() === 'in_progress' ? 'processing' : 'ready'
    }));
  } catch (err) {
    console.error("Surveys fetch error", err);
    return [];
  }
};

export const getAnomalies = async (filters?: AnomalyFilters, harbour?: string): Promise<Anomaly[]> => {
  try {
    const queryParam = harbour ? `?mission_id=${encodeURIComponent(harbour)}` : '';
    const res = await fetch(`${API_BASE_URL}/anomalies${queryParam}`);
    if (!res.ok) throw new Error("Failed to fetch anomalies");
    let anomalies = await res.json();
    
    if (filters?.status && filters.status !== 'All') {
        // filter logic if necessary, adapted to backend enum
    }

    return anomalies.map((a: any, i: number) => ({
      id: a.anomaly_id || a.id,
      label: a.anomaly_id || `Anomaly #${i}`,
      classification: ['Crab-Pot', 'Shipwreck'].some(t => a.type.includes(t)) ? 'known' : 'unknown',
      severity: a.risk_level === 'CRITICAL' ? 'high' : a.risk_level === 'HIGH' ? 'unusual' : 'normal',
      reviewStatus: a.status === 'VERIFIED' ? 'known_object' : 'pending',
      overallScore: Math.round(a.risk_score * 100),
      spatialDeviationScore: Math.round((a.risk_score * 0.9) * 100),
      temporalChangeScore: Math.round((a.risk_score * 1.1) * 100),
      confidence: Math.round(a.confidence * 100),
      latitude: a.latitude || 0,
      longitude: a.longitude || 0,
      depthMeters: Math.round((a.depth || 0) * 10) / 10,
      seabedNature: a.seabed_nature,
      riskLevel: a.risk_level,
      opticalImagePath: a.optical_image_path,
      opticalClassification: a.optical_classification,
      opticalConfidence: a.optical_confidence,
      finalClassification: a.final_classification,
      finalConfidence: a.final_confidence,
      detectedAt: a.created_at || new Date().toISOString(),
      firstObserved: a.created_at,
      explanation: a.explanation || `Detected ${a.type} with ${(a.confidence * 100).toFixed(1)}% confidence.`,
      notes: a.notes,
      sonarImage: "sonar_placeholder.png", // The backend should ideally link the image path
      priority: a.risk_level === 'CRITICAL' ? 'immediate' : a.risk_level === 'HIGH' ? 'high' : 'medium',
    }));
  } catch (err: any) {
    console.error("Anomalies fetch error", err);
    return [];
  }
};

export const getAnomalyById = async (id: string, harbour?: string): Promise<Anomaly> => {
  const anomalies = await getAnomalies({}, harbour);
  const anomaly = anomalies.find(a => a.id === id);
  if (!anomaly) throw new Error('Anomaly not found');
  return anomaly;
};

export const startSurveyProcessing = async (file?: File): Promise<any> => {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
  return { status: 'complete', anomaliesCount: 0, anomalies: [] };
};

export const getTemporalSeries = async (_anomalyId: string, harbour?: string): Promise<TemporalPoint[]> => {
  return [
    { date: "Mar '25", score: 10 },
    { date: "Aug '26", score: 95 }
  ];
};

export const submitReview = async (anomalyId: string, decision: ReviewDecision): Promise<Anomaly> => {
  // Ideally this would PATCH /api/anomalies/:id
  const anomalies = await getAnomalies();
  const anomaly = anomalies.find(a => a.id === anomalyId);
  if (!anomaly) throw new Error('Anomaly not found');
  return { ...anomaly, reviewStatus: decision.status };
};

export const getReportSummary = async (_surveyId: string): Promise<ReportSummary> => {
  return {
    surveyCoverage: "100%",
    normalRegions: 84,
    knownAnomalies: 12,
    unknownAnomalies: 7,
    newChanges: 5
  };
};

export const getModelFeedback = async (): Promise<ModelFeedback> => {
  return {
    currentModel: { name: "v1.0", accuracy: 89, lastUpdated: new Date().toISOString() },
    feedbackSamples: 18,
    potentialRetrainingSet: 7,
    nextModel: { name: "v1.1", accuracy: 92, estimatedTime: "24h" }
  };
};

// ==========================================
// REAL-TIME WEBSOCKET MOCK (Kept for UI compatibility)
// ==========================================
export const subscribeToRealTimeAnomalies = (
  harbour: string,
  onUpdate: (anomalyId: string, updates: Partial<Anomaly>) => void,
  _onNew: (anomaly: Anomaly) => void
) => {
  return () => { };
};
