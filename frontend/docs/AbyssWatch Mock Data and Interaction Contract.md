# AbyssWatch Mock Data and Interaction Contract

## TypeScript Domain Models

Use typed interfaces similar to the following. Keep mock data in `src/data/mockData.ts` and expose simulated requests through `src/services/api.ts` using Axios-shaped functions.

```ts
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
}

export interface ModelFeedback {
  currentModel: string;
  feedbackSamples: number;
  potentialRetrainingSet: number;
  nextModel: string;
}
```

## Seed Values

The Dashboard must begin with the following metrics so that the visual story is immediately legible: Normal Regions **84**, Known Anomalies **12**, Unknown Anomalies **7**, and New Changes **5**. The selected item should be **Anomaly #017**, classified as Unknown, with an overall score of **92/100**, spatial deviation of **88/100**, temporal change of **95/100**, confidence of **91%**, depth of **38.4 m**, and priority **Immediate**.

Create at least ten anomaly records. Include a mixture of unknown objects, known objects, new changes, unusual regions, and false positives. Use realistic but clearly mock marine-survey metadata. Avoid presenting the coordinates as proof of a real survey; include a small `DEMO DATA` label in the application shell.

## Mock Service Functions

Implement functions with short artificial delays so the interface can show believable loading states:

```ts
getDashboardMetrics(): Promise<DashboardMetrics>
getSurveys(): Promise<Survey[]>
getAnomalies(filters?: AnomalyFilters): Promise<Anomaly[]>
getAnomalyById(id: string): Promise<Anomaly>
startSurveyProcessing(surveyId: string): Promise<ProcessingJob>
getTemporalSeries(anomalyId: string): Promise<TemporalPoint[]>
submitReview(anomalyId: string, decision: ReviewDecision): Promise<Anomaly>
getReportSummary(surveyId: string): Promise<ReportSummary>
```

The service layer can return local data. Keep Axios in the codebase by creating an Axios instance and typing the mock functions as if they could later call a backend. Do not add real API keys or external credentials.

## State Transitions

| User action | Expected result |
|---|---|
| Click Upload New Survey | Navigate to `/upload` |
| Click Start Analysis | Show upload validation, then Processing state |
| Processing completes | Show completion message and Open Anomaly Map CTA |
| Click Open Anomaly Map | Navigate to `/map` with Anomaly #017 selected |
| Click a map node | Replace the detail panel data with the selected anomaly |
| Click View Sonar | Open evidence modal |
| Click View Explanation | Open AI explanation drawer |
| Click Review | Navigate to `/review` with the selected anomaly active |
| Click a review decision | Update status, increment feedback samples, show success toast |
| Click Temporal Comparison | Navigate to `/comparison` with the active anomaly selected |
| Click Report | Open report view/tab on `/review` |
| Click export controls | Show a mock export-success toast |

## Sample Explanation Copy

For Anomaly #017, use this human-readable explanation: "The model detected a high-contrast edge cluster that differs from the local seabed texture. The feature was not present in the previous survey and remains spatially coherent across adjacent tiles. Because the temporal change score is high, the model recommends immediate human review."

Label this content **AI-assisted explanation** and show the spatial and temporal score contributions beside it. The copy should make the model's reasoning understandable without claiming certainty.
