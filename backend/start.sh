#!/bin/zsh
set -e

DIR="${0:A:h}"
cd "$DIR"

# Free port 8000 if something is already bound to it
if lsof -ti :8000 >/dev/null 2>&1; then
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  sleep 0.5
fi

if [[ ! -d ".venv" ]]; then
  echo "Virtual environment not found. Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

exec .venv/bin/python -m uvicorn main:app --reload --port 8000
