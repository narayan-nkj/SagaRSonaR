# AbyssWatch Page Architecture and SIH Demo Flow

## Product Summary

**AbyssWatch** is an explainable seabed sonar intelligence console. It helps operators compare new sonar surveys against a trusted seabed baseline, identify spatial and temporal anomalies, prioritize review, capture human feedback, and prepare a survey report.

The prototype uses five primary routes. Several requested screens are represented as guided states inside these routes so the experience remains compact, easy to understand, and suitable for an SIH jury demo.

| Route | Primary purpose | Included states |
|---|---|---|
| `/dashboard` | Mission overview | Dashboard, metric summary, priority queue, normality map preview, active learning |
| `/upload` | Bring in a new survey | Upload Survey, validation, Processing, completion handoff |
| `/map` | Investigate detected locations | Seabed Baseline, Anomaly Map, node pop-up, sonar modal, explanation drawer |
| `/comparison` | Establish why a location changed | Temporal Comparison, evidence summary, AI explanation, trend chart |
| `/review` | Close the human-in-the-loop cycle | Human Review, feedback capture, Active Learning update, Report tab |

## Recommended Jury Walkthrough

The operator begins on the Dashboard, where the four headline metrics establish the scale of the survey. The normality map and priority queue make the problem visible without requiring technical explanation. The operator then selects **Upload New Survey** and moves through the upload and simulated processing state.

After processing, the operator opens the Anomaly Map. Anomaly #017 is selected by default, and the detail panel exposes the classification, scores, coordinates, and available actions. The operator opens the sonar evidence and AI explanation, then moves to Temporal Comparison to show that the anomaly is a new change rather than a persistent seabed feature.

The operator enters Human Review, chooses one of the four review decisions, and demonstrates that the feedback sample count changes. Finally, the operator opens the Report tab to show a concise operational summary and the export controls.

> **One-line SIH pitch:** AbyssWatch converts large, difficult-to-review sonar surveys into an explainable, prioritized, and human-validated anomaly workflow.

## Success Criteria for the Prototype

The prototype is successful if a first-time viewer can understand the product's purpose within 30 seconds, navigate the complete operator flow without a dead end, identify the difference between normal, unusual, and highly anomalous regions, inspect the evidence behind Anomaly #017, make a review decision, and see that human feedback contributes to the next model version.

## 7-Day Frontend Execution Mapping

| Day | Implementation focus | Visible milestone |
|---|---|---|
| Day 1 | Set up React, TypeScript, Vite, Tailwind, routing, shell layout, and mock data | Dashboard loads and a first sonar image is visible |
| Day 2 | Build map shell, baseline overlay, legend, and map controls | Seabed Baseline Map is visible |
| Day 3 | Add anomaly nodes, selection state, detail panel, and unknown anomaly queue | Unknown Anomaly Panel is usable |
| Day 4 | Add sonar modal, filters, and evidence metadata | Operator can inspect an anomaly |
| Day 5 | Add temporal comparison, AI explanation, priority selection, and score charts | Dashboard is close to complete |
| Day 6 | Add human review, feedback state, active-learning widget, and report view | Complete operator flow is clickable |
| Day 7 | Polish spacing, empty/loading/success states, responsiveness, screenshots, and backup demo path | Jury-ready demo build |

## Backup Demo Path

If the upload simulation or map library fails during a live presentation, use the Dashboard preview as the fallback entry point. Keep the Dashboard, the Anomaly #017 detail panel, and the Human Review state populated entirely by local mock data. The backup path should be: Dashboard → Anomaly #017 → View Explanation → Review → Confirm Unknown → Report.
