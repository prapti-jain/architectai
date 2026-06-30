#!/bin/zsh
set -e

ROOT="${0:A:h}"

# Free ports 3000 and 8000 if already in use
for port in 3000 8000; do
  if lsof -ti :"$port" >/dev/null 2>&1; then
    lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
  fi
done
sleep 0.5

# Start backend in background
cd "$ROOT/backend"
if [[ ! -d ".venv" ]]; then
  echo "Backend venv not found. Run: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi
.venv/bin/python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd "$ROOT"

echo "Backend running on :8000, Frontend running on :3000"

# Start frontend in foreground
cd "$ROOT/frontend"
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT INT TERM
npm run dev
