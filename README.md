# SagaRSonaR

> **Note:** This repository represents the **Final Project Submission**. All final changes, features, and fixes have been committed and integrated.

SagaRSonaR (SonarVision) is a full-stack application featuring a React-based frontend and a robust FastAPI-based backend. It's designed to provide a comprehensive pipeline with ML inference capabilities, data processing, and an interactive UI for analyzing seabed sonar scans.

## Features
- **Interactive Anomaly Detection**: Map-based visualization of sonar anomalies.
- **Optical Image Verification**: Seamless workflow for uploading and analyzing optical imagery to verify sonar targets, supporting side-by-side evidence comparison.
- **Glassmorphic UI**: Beautiful, dark-themed frosted glass aesthetic with buttery-smooth map transitions.
- **Real-time Scoring**: Combined confidence scores using both sonar parameters (Spatial Deviation, Temporal Change) and optical evidence.

## Project Structure

The project is divided into two main parts:
- **`frontend/`**: Contains the React/Vite web application.
- **`backend/`**: Contains the FastAPI server, ML models, and data processing scripts.

## Prerequisites

Make sure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **Python** (3.8 or higher)
- **Git**

---

## Getting Started

Follow the instructions below to get both the frontend and backend running locally.

### 1. Starting the Backend (FastAPI)

The backend handles the core logic, ML provider capabilities, and database operations.

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Set up a Python Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in any required variables.
   ```bash
   cp .env.example .env
   ```

5. **Run the Server**:
   Start the FastAPI development server using Uvicorn.
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend API will be available at `http://localhost:8000`. You can view the interactive API documentation at `http://localhost:8000/docs`.

---

### 2. Starting the Frontend (React + Vite)

The frontend provides an interactive user interface using React, MapLibre, and Recharts.

1. **Open a new terminal window** (keep the backend running in the other).

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will typically be accessible at `http://localhost:5173` (check the terminal output for the exact URL).

---

## Docker (Optional)

If you prefer using Docker to run the entire application (both frontend and backend), you can start it using Docker Compose from the root directory:
```bash
docker-compose up --build
```

## Contributing
Please see `frontend/CONTRIBUTING.md` for guidelines on how to contribute to this project.
