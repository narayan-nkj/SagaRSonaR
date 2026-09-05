# AbyssWatch Visual System and Component Contract

## Design Direction

The visual direction is **deep-ocean mission control**: technical, focused, and operational. The interface should look appropriate for a marine research or coastal infrastructure operations room while remaining clear enough for a non-technical SIH evaluator.

Do not use generic dashboard gradients, bright white backgrounds, stock business illustrations, or unexplained AI buzzwords. Every visual element should support the workflow of surveying, comparing, explaining, reviewing, and reporting.

## Color and Semantic States

| Semantic meaning | Color | UI applications |
|---|---|---|
| Normal | `#48E0B2` | Green map tiles, normal regions, positive status |
| Unusual | `#F4C95D` | Yellow map tiles, warnings, watch-list items |
| Highly anomalous | `#FF6B6B` | Red map tiles, urgent items, high-priority nodes |
| Unknown classification | `#B993FF` | Unknown badges and review queue |
| Known object | `#65A9FF` | Known-object badges |
| False positive | `#8DA7B8` | Resolved/false-positive status |

## Typography and Layout

Use a legible sans-serif such as Inter or Geist. Use a monospace face for coordinates, timestamps, anomaly IDs, confidence scores, and model versions. Establish a clear scale: compact labels at 11–12px, metadata at 12–13px, body copy at 14–15px, card headings at 16–18px, and page titles at 28–36px.

The desktop shell should use a 248px navigation rail, a flexible content canvas, and a 24–32px page gutter. Cards should use a deep panel background, a subtle border, 16–20px radius, and restrained shadow. Keep map and evidence viewers visually dominant; avoid giving every card equal visual weight.

## Reusable Components

| Component | Required behavior |
|---|---|
| `AppShell` | Provides sidebar, top bar, breadcrumbs, responsive navigation, and page outlet |
| `MetricCard` | Displays metric label, value, trend, semantic color, and optional icon |
| `StatusBadge` | Renders Normal, Unusual, Highly Anomalous, Unknown, Known Object, Pending, or False Positive |
| `NormalityMap` | Shows dark map, tile overlay, legend, node markers, selected state, filters, and controls |
| `MapLegend` | Explains green, yellow, and red normality states in plain language |
| `AnomalyNode` | Clickable marker with severity treatment and accessible label |
| `AnomalyDetailPanel` | Displays classification, score breakdown, coordinates, depth, timestamp, and action buttons |
| `SonarViewer` | Modal evidence viewer with image, zoom control, metadata, and baseline comparison toggle |
| `ExplanationDrawer` | Presents AI-assisted explanation, score factors, evidence cards, confidence, and disclaimer |
| `TimelineChart` | Recharts line/area chart for anomaly count or anomaly score across survey dates |
| `ReviewDecisionCard` | Presents four human review actions, notes, class selection, and save controls |
| `ActiveLearningWidget` | Shows current model, feedback samples, retraining set, and next model |
| `ReportSummary` | Renders survey totals, map snapshot, priority table, chart, methodology, and export controls |
| `Toast` | Confirms upload, review decisions, exports, and state changes without blocking the user |

## Accessibility and Presentation Rules

Use keyboard-focusable buttons, visible focus rings, sufficient color contrast, descriptive map marker labels, and text labels alongside color indicators. Do not rely on color alone to communicate anomaly status. Keep all important actions visible in a static screenshot, including the selected anomaly's classification and review controls.

Every AI-generated or simulated interpretation must be labeled **AI-assisted explanation**. The report must include a prototype disclaimer stating that the output is intended for operational review and SIH demonstration, not certified marine assessment.
