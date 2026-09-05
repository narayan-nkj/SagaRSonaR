# S.A.G.A.R. Command

**Seabed Anomaly Grid & Analysis Repository**

S.A.G.A.R. Command is a comprehensive, modern dashboard application built for seabed survey analysis and real-time anomaly detection. It visualizes map-based marine data, tracks temporal comparisons of geographical metrics, and supports human-in-the-loop review for machine learning-detected subsea anomalies.

## Tech Stack

### Frontend
*   **Core**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS v4, Lucide React
*   **Routing**: React Router DOM
*   **Mapping**: MapLibre GL, React Map GL
*   **Charts**: Recharts

### Backend
*   **Core**: Node.js, Express, TypeScript
*   **Tools**: ts-node-dev, CORS, dotenv

## Project Structure

The project has been architected to accommodate both the frontend client application and the backend API server in a unified workspace.

```text
abyss-watch/
├── backend/                       # Backend API (Node.js + Express)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/                # Environment and DB config
│       ├── controllers/           # Route handlers
│       ├── middlewares/           # Express middlewares (auth, validation)
│       ├── models/                # Database models/schemas
│       ├── routes/                # Express route definitions
│       ├── services/              # Core business logic
│       ├── utils/                 # Helper utilities
│       └── server.ts              # Entry point for backend server
│
├── src/                           # Frontend Client (React)
│   ├── assets/
│   ├── components/                # Reusable UI components
│   ├── contexts/                  # React Contexts (State Management)
│   ├── data/                      # Mock data and local datasets
│   ├── pages/                     # Main page views (Dashboard, MapWorkspace, etc.)
│   ├── services/                  # Frontend API integrations
│   ├── utils/                     # Utility functions
│   ├── App.tsx                    # Root application component
│   └── main.tsx                   # Frontend entry point
│
├── public/                        # Static assets
├── vite.config.ts                 # Vite bundler configuration (including /api proxy)
├── package.json                   # Frontend dependencies and scripts
└── tsconfig.json                  # Frontend TypeScript configuration
```

## Quick Start

### 1. Running the Frontend

The frontend development server runs on `localhost:5173` by default and proxies `/api` requests to the backend server.

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

### 2. Running the Backend

The backend development server runs on `localhost:5000` by default.

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Start the Express server with hot-reloading
npm run dev
```

## Features & UI Architecture

- **Premium SaaS Dashboard**: Features a high-contrast dark theme (Background: `#0B0E14`, Surfaces: `#12161E`) with strict adherence to professional spacing, typography, and responsive grid layouts (scaling to `xl:grid-cols-3`).
- **AI Analysis Widgets**: Real-time integration of AI-driven evidence and severity reporting for selected anomalies, complete with skeleton loading states.
- **Real-Time Map Workspace**: Integrated with MapLibre GL for viewing deep-sea anomaly detections across different harbors with Sonar overlay controls.
- **Temporal Comparison**: Historical tracking of structural anomalies over time with toggleable baseline modes.
- **Human Review System**: Dashboard tailored for human validators to verify or reject AI-detected anomalies, training models via an Active Learning loop.
