# ArchitectAI

**AI-powered system design simulator with failure cascade simulation and traffic modeling**

Built by **Prapti**

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Python](https://img.shields.io/badge/Python-3.11-yellow)
![React Flow](https://img.shields.io/badge/React_Flow-v12-purple)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google-blue)

---

## Features

### 1. Failure Cascade Engine
Click any node to simulate it going down. The system uses **BFS on the dependency graph** to propagate failures to all downstream services, turning them red in sequence with a realistic 300ms delay between each node. A node only goes fully down when **all** of its upstream dependencies are down — real graph traversal, not visual toggling.

### 2. Traffic Simulation
A slider controls requests/sec (0–100K). As traffic increases, nodes show load indicator bars and transition from green (healthy) → yellow (degraded at 70% capacity) → red (overloaded at 90% capacity). Load propagates through the graph proportionally to edge throughput — queuing theory in action.

### 3. Side-by-Side Architecture Comparison
Generate two different architectures for the same system (e.g. SQL vs NoSQL approach). The app scores each on 5 axes — **latency, scalability, consistency, cost, complexity** — with winners highlighted per axis. Scores are derived from the AI response, not hardcoded. Choose from preset variant pairs (SQL vs NoSQL, Monolith vs Microservices, Synchronous vs Event-driven) and get an AI-generated tradeoff summary.

### 4. Scale Q&A Chat
Ask contextual questions about the current architecture in the sidebar chat panel. Gemini answers with 2–4 sentences referencing actual node names from your diagram — e.g. "How would you handle 10x traffic?" or "What's the single point of failure?"

### 5. Export to PNG
One-click export of the architecture diagram as a high-resolution PNG. Captures the React Flow viewport with the dark theme and node colors preserved, excluding UI chrome (controls, minimap).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Diagram Engine | @xyflow/react (React Flow v12) |
| UI Components | shadcn/ui patterns, custom dark theme |
| Backend | FastAPI, Python 3.11 |
| AI | Google Gemini (google-genai SDK) |
| State | In-memory / React state (no DB) |

---

## How to Run

### Backend (port 8000)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
User Prompt
    │
    ▼
PromptBar ──POST──▶ FastAPI /api/generate ──▶ Claude (Session 2) / Mock
    │                        │
    ▼                        ▼
ArchCanvas ◀── ArchGraph ── Sidebar (scores, tradeoffs, scale)
    │
    ├── graphEngine.ts    → BFS failure cascade
    ├── simulationEngine.ts → traffic flow propagation
    └── useFailureCascade / useSimulation hooks
```

**Key engineering decisions:**

- **BFS failure cascade** with upstream dependency tracking — nodes degrade partially when losing one input, go fully down when losing all inputs
- **Proportional load distribution** across edges based on configured throughput values
- **Layered node positioning** enforced in the AI system prompt (clients y=80, LBs y=220, services y=380, data y=540)
- **3-line Claude integration swap** in `backend/main.py` — mock stub today, real API in Session 2

---

## Environment Variables

| File | Variable | Purpose |
|------|----------|---------|
| `backend/.env` | `GEMINI_API_KEY` | Google Gemini API key |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## Screenshots

> _Coming soon — add screenshots of the WhatsApp architecture, failure cascade, and traffic simulation here._

---

## License

MIT — Built as a portfolio project by Prapti.
