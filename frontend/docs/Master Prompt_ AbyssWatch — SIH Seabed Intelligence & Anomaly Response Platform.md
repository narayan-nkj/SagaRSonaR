# Master Prompt: AbyssWatch — SIH Seabed Intelligence & Anomaly Response Platform

Build a polished, responsive frontend prototype called **AbyssWatch** for a Smart India Hackathon-style problem statement: **AI-assisted seabed survey analysis for faster detection, classification, and human verification of underwater anomalies**.

This is a **frontend-only demo** intended for an SIH jury presentation. Do not build a real backend, authentication system, payment flow, or production machine-learning pipeline. Use realistic mock data and local component state so the full operator journey is clickable and demonstrable.

## Product Positioning

AbyssWatch is an operator console for marine survey teams, ports, coastal security units, and underwater infrastructure agencies. It transforms sonar survey uploads into an explainable seabed baseline, anomaly map, temporal comparison, human-review queue, and exportable survey report.

The interface should feel like a credible mission-control product: **dark oceanic, high-contrast, calm, technical, and evidence-led**. Avoid generic SaaS styling, excessive gradients, cartoon illustrations, or a consumer dashboard appearance.

## Required Technology

Use the following frontend stack:

| Area | Requirement |
|---|---|
| Framework | React with TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Mapping | Leaflet or MapLibre with a dark basemap and a custom seabed survey overlay |
| Charts | Recharts |
| Networking | Axios, used through a small mock API service layer |
| Icons | Lucide React or an equivalent icon library |
| State | React hooks and lightweight local state; do not add unnecessary global state libraries |
|

## Page Architecture: Five Demonstrable Pages

Create exactly **five primary routed pages**. Required screens such as processing, explanation, review, and report should appear as full-page states, panels, drawers, or modal overlays inside these five routes so the prototype remains compact.

### Page 1 — Mission Dashboard `/dashboard`

Create a command-center landing page with:

- Left vertical navigation containing the AbyssWatch mark, Dashboard, Upload Survey, Baseline & Anomalies, Temporal Comparison, Human Review, and Report.
- Top bar showing the active survey name, survey status, operator profile, notifications, and a compact "Demo Mode" badge.
- Hero heading: **"Seabed intelligence, made reviewable."**
- Primary CTA: **Upload New Survey**.
- Four prominent metric cards: **Normal Regions**, **Known Anomalies**, **Unknown Anomalies**, and **New Changes**. Use the sample values 84, 12, 7, and 5.
- A large "Normality Map" preview with a dark map, grid/tile overlay, and green/yellow/red areas. Include a legend: Normal, Unusual, Highly Anomalous.
- A right-side "Priority Queue" listing Anomaly #017, #021, #009, and #004 with severity, classification, confidence, and review status.
- A lower "Survey Activity" Recharts area or line chart showing anomaly count across the last six survey runs.
- A compact "Active Learning" widget displaying Current Model **v1.0**, Feedback Samples **18**, Potential Retraining Set **7**, and Next Model **v1.1**.

### Page 2 — Upload & Processing `/upload`

Combine Upload Survey and Processing into one route with an interactive two-state flow.

Upload state:

- A drag-and-drop sonar image/file zone with an illustrative first sonar image already available as a sample.
- Fields for Survey Name, Vessel/Platform, Area, Survey Date, Depth Range, and Baseline Reference.
- File cards for `survey_2026_08_27.sl2`, `transect_B_04.png`, and `metadata.json` with file type, size, and validation status.
- Primary action: **Start Analysis**.
- Validation callout: "All required metadata present. Ready for processing."

Processing state after clicking Start Analysis:

- Show a stepper with Ingest Survey, Register Coordinates, Compare Baseline, Detect Anomalies, and Prepare Review Queue.
- Use animated progress bars and a simulated 0–100% status. The prototype may complete automatically after a short delay.
- Display a sonar preview with a scanline treatment and a live processing log.
- Show completion message: **"Analysis complete. 7 unknown anomalies require review."**
- CTA: **Open Anomaly Map**.

### Page 3 — Baseline & Anomaly Map `/map`

This is the main analysis workspace and should receive the strongest visual emphasis.

- Full-height dark Leaflet or MapLibre map area showing a stylized seabed survey grid around a coastal/harbor region.
- Overlay color-coded tiles: green for normal, yellow for unusual, red for highly anomalous.
- Plot at least 10 clickable anomaly nodes. Make Anomaly #017 selected by default and visually prominent.
- Add controls for layer visibility, tile opacity, zoom, fit survey, and map/satellite toggle.
- Add a filter bar for All, Unknown, Known Object, New Change, and High Priority.
- Include a floating side panel titled **"Anomaly #017"** with:
  - Classification: Unknown
  - Overall Score: 92/100
  - Spatial Deviation Score: 88/100
  - Temporal Change Score: 95/100
  - Depth: 38.4 m
  - Coordinates: 18.9387° N, 72.8353° E
  - Detected: 27 Aug 2026, 14:32 UTC
  - Buttons: **View Sonar**, **View Explanation**, **Review**
- Clicking a different node must update the panel with its own mock values.
- View Sonar opens a modal with the cropped sonar image, zoom controls, transect metadata, and a "Compare with baseline" switch.
- View Explanation opens an explanation drawer containing a score breakdown, evidence cards, confidence indicator, and a simple visual explanation of the model's decision. Use copy such as "High contrast edge cluster differs from the local seabed texture".
- Review navigates to or opens the Human Review state.

### Page 4 — Temporal Comparison & Explanation `/comparison`

Create a split-screen investigation page.

- Header: **"What changed beneath the surface?"** with survey selector for Current Survey, Previous Survey, and Baseline.
- Left side: synchronized side-by-side sonar or seabed imagery for Previous Survey and Current Survey.
- Right side: Recharts temporal trend showing anomaly score over six survey dates.
- Add a change heatmap/overlay that marks stable regions, emerging changes, and resolved anomalies.
- Include an "Evidence Summary" card for Anomaly #017 with:
  - Spatial deviation: High
  - Temporal change: Very high
  - First observed: 27 Aug 2026
  - Prior state: Not present
  - Recommended priority: Immediate review
- Include an "AI Explanation" panel with a concise, human-readable explanation and confidence bar. Clearly label generated content as **AI-assisted explanation**.
- Add a compact timeline scrubber and a "Show only changed regions" toggle.

### Page 5 — Human Review & Report `/review`

Use a two-column review workspace with a report export section below or as a tab inside the same route.

Review state:

- Left queue of anomalies with status chips: Pending, Confirmed Unknown, Known Object, False Positive.
- Center evidence viewer with sonar crop, map location, anomaly scores, and explanation.
- Right review decision card with required buttons:
  - **Confirm Unknown**
  - **Label as Known Object**
  - **False Positive**
  - **Add New Class**
- When a decision is clicked, update the anomaly status, add a feedback sample, increment the Active Learning widget, and show a non-blocking success toast.
- Add a notes field and optional class selector for Known Object and Add New Class.
- Add "Next anomaly" and "Save review" controls.

Report state/tab:

- Title: **"Survey Intelligence Report"**.
- Summary cards for survey coverage, normal regions, known anomalies, unknown anomalies, and new changes.
- Include a compact map snapshot, top-priority anomaly table, timeline chart, methodology note, and human-review summary.
- Buttons: **Export PDF**, **Download CSV**, and **Share Demo Link**. These can trigger a mock toast rather than perform real exports.
- Add a visible disclaimer: "Prototype output for operational review and SIH demonstration; not a substitute for certified marine assessment."

## Visual Language

Use a premium dark-ocean palette:

| Token | Value | Usage |
|---|---|---|
| Deep Navy | `#07111F` | Main background |
| Ocean Panel | `#0D1B2A` | Cards and panels |
| Elevated Panel | `#12263A` | Hover/selected surfaces |
| Seafoam | `#48E0B2` | Normal state, positive metrics, primary accents |
| Signal Yellow | `#F4C95D` | Unusual state, warnings |
| Coral Red | `#FF6B6B` | Highly anomalous/high-priority state |
| Ice Text | `#E7F2F8` | Primary text |
| Muted Blue | `#8DA7B8` | Secondary text |

Use Inter, Geist, or a similarly clear sans-serif. Use a monospace font only for coordinates, IDs, timestamps, and model metadata. Apply 16–20px corner radii, subtle 1px borders, restrained shadows, and clear hierarchy.

## Interaction and Demo Requirements

The prototype must be fully navigable using the sidebar and in-page CTAs. Use React state for the upload-to-processing transition, selected anomaly, explanation drawer, sonar modal, review decision, report tab, filters, and timeline selection. Make all major buttons functional. Include loading, empty, success, and reviewed states where appropriate.

Seed the UI with credible sample content instead of lorem ipsum. Keep the layout responsive: desktop-first for an SIH presentation, with tablet and mobile fallbacks. Preserve map usability on smaller screens by turning side panels into bottom sheets.

## Implementation Constraints

Create reusable components for MetricCard, StatusBadge, MapLegend, AnomalyNode, AnomalyDetailPanel, SonarViewer, ExplanationDrawer, ReviewDecisionCard, ActiveLearningWidget, TimelineChart, and ReportSummary. Keep mock data in a dedicated `src/data` file and Axios calls in a dedicated `src/services/api.ts` mock service. Use typed interfaces for surveys, anomalies, review decisions, and model feedback.

Prioritize a believable operator flow and visual polish over backend complexity. The final result should look ready for an SIH jury demo and should communicate the core innovation clearly within the first 30 seconds.

## SIH Demo Narrative

The demo should make this story obvious: **upload a sonar survey → compare it to the seabed baseline → detect normal, unusual, and highly anomalous regions → explain why a location was flagged → let a human validate it → use feedback to improve the next model → generate an operational report**.

Start the app on `/dashboard` with Anomaly #017 selected in the preview so the evaluator immediately sees the system's central value.
