#!/bin/bash

echo "Starting SagaRSonaR Pipeline..."

echo "Closing ports 8000 and 5173 to prevent conflicts..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "Starting Backend (FastAPI)..."

# Start the backend in the background
cd backend
# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "Starting Frontend (React/Vite)..."

# Start the frontend in the background
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Both services are now running!"
echo "Backend API: http://localhost:8000"
echo "Frontend UI: http://localhost:5173"
echo "Press [Ctrl+C] to stop all services."

# Trap SIGINT (Ctrl+C) to gracefully shut down both background processes
trap "echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Wait indefinitely so the script doesn't exit immediately
wait $BACKEND_PID $FRONTEND_PID
