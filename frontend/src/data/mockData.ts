export type AnomalyClassification = "unknown" | "known" | "false_positive";
export type AnomalySeverity = "normal" | "unusual" | "high";
export type ReviewStatus = "pending" | "confirmed_unknown" | "known_object" | "false_positive";

export interface Survey {
  id: string;
  name: string;
  vessel: string;
  area: string;
  surveyDate: string;
  depthRange: string;
  status: "ready" | "processing" | "complete";
}

export interface Anomaly {
  id: string;
  label: string;
  classification: AnomalyClassification;
  severity: AnomalySeverity;
  reviewStatus: ReviewStatus;
  overallScore: number;
  spatialDeviationScore: number;
  temporalChangeScore: number;
  confidence: number;
  latitude: number;
  longitude: number;
  depthMeters: number;
  detectedAt: string;
  firstObserved: string;
  explanation: string;
  sonarImage: string;
  priority: "low" | "medium" | "high" | "immediate";
  notes?: string;
  customClassName?: string;
}

export interface ModelFeedback {
  currentModel: { name: string; accuracy: number; lastUpdated?: string };
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: { name: string; accuracy: number; estimatedTime?: string };
}

export interface DashboardMetrics {
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface ReportSummary {
  surveyCoverage: string;
  normalRegions: number;
  knownAnomalies: number;
  unknownAnomalies: number;
  newChanges: number;
}

export interface TemporalPoint {
  date: string;
  score: number;
}

export interface ProcessingJob {
  status: "complete";
  anomaliesCount: number;
}

export interface AnomalyFilters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface ReviewDecision {
  status: ReviewStatus;
  notes?: string;
  newClass?: string;
}

export const HARBOURS: Record<string, { lat: number; lng: number, waterCenter: { lat: number, lng: number }, spread: number, vessel: string }> = {
  'Thunder Bay, Lake Huron': { lat: 45.0600, lng: -83.4300, waterCenter: { lat: 45.0500, lng: -83.0000 }, spread: 0.02, vessel: 'AUV Iver3 (AI4Shipwrecks)' },
  'Mumbai Harbor Q3': { lat: 18.9387, lng: 72.8353, waterCenter: { lat: 18.9300, lng: 72.6500 }, spread: 0.02, vessel: 'R/V Samudra' },
  'Chennai Port': { lat: 13.0827, lng: 80.2707, waterCenter: { lat: 13.0800, lng: 80.4500 }, spread: 0.02, vessel: 'R/V Sagar Kanya' },
  'Kochi Harbor': { lat: 9.9312, lng: 76.2673, waterCenter: { lat: 9.9500, lng: 76.0500 }, spread: 0.02, vessel: 'R/V Sindhu Sadhana' },
  'Visakhapatnam Port': { lat: 17.6868, lng: 83.2185, waterCenter: { lat: 17.5500, lng: 83.4500 }, spread: 0.02, vessel: 'R/V Gaveshani' },
  'Jawaharlal Nehru Port': { lat: 18.9500, lng: 72.9500, waterCenter: { lat: 18.8000, lng: 72.8000 }, spread: 0.02, vessel: 'R/V Sagar Nidhi' },
  'Kolkata Port': { lat: 22.5314, lng: 88.3225, waterCenter: { lat: 21.3000, lng: 88.0000 }, spread: 0.02, vessel: 'R/V Sagar Manjusha' }, 
  'Paradip Port': { lat: 20.2662, lng: 86.6775, waterCenter: { lat: 20.1000, lng: 86.8500 }, spread: 0.02, vessel: 'R/V Anveshani' },
};

// Deleted mock arrays so the backend provides authentic data
