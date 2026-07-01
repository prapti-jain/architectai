import json
import os
import time
import traceback
from typing import Optional, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import errors as genai_errors

from models.schemas import (
    ArchGraph,
    AskRequest,
    AskResponse,
    CompareSummaryRequest,
    CompareSummaryResponse,
    GenerateRequest,
    GenerateResponse,
)
from prompts.system_design import SYSTEM_DESIGN_PROMPT

load_dotenv(override=True)

GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]
RETRY_DELAYS = [1, 3]  # seconds before 2nd and 3rd attempts per model


def get_gemini_client() -> genai.Client:
    load_dotenv(override=True)
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


client = get_gemini_client()

app = FastAPI(title="ArchitectAI", version="0.1.0")

DEFAULT_CORS_ORIGINS = "http://localhost:3000,https://architectai-y9wy.vercel.app"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_system_name(prompt: str) -> str:
    text = prompt.strip()
    for prefix in ("Design ", "design ", "Build ", "build ", "Create ", "create "):
        if text.startswith(prefix):
            text = text[len(prefix) :].strip()
            break
    return text.split("(")[0].strip() or "Demo System"


def get_mock_graph(variant: Optional[str] = None, prompt: Optional[str] = None) -> dict:
    """Reference architecture used when Gemini is unavailable."""
    system_name = extract_system_name(prompt) if prompt else "WhatsApp"
    mock = {
        "system": system_name,
        "description": (
            f"Reference architecture template for {system_name}. "
            "Gemini is temporarily unavailable (quota or rate limit) — this demo topology "
            "illustrates the simulator; node layout is not AI-generated for this system."
        ),
        "nodes": [
            {"id": "mobile-client", "type": "CLIENT", "label": "Mobile Client", "description": "iOS and Android clients with WebSocket connections", "tech": "React Native", "scale": "2B users", "capacity": 999999, "position": {"x": 520, "y": 80}, "status": "healthy", "currentLoad": 0},
            {"id": "websocket-lb", "type": "LOAD_BALANCER", "label": "WebSocket LB", "description": "Layer 7 load balancer for persistent WebSocket connections", "tech": "HAProxy", "scale": "50K conn/s", "capacity": 50000, "position": {"x": 300, "y": 220}, "status": "healthy", "currentLoad": 0},
            {"id": "media-lb", "type": "LOAD_BALANCER", "label": "Media LB", "description": "Load balancer for media upload/download traffic", "tech": "NGINX", "scale": "30K req/s", "capacity": 30000, "position": {"x": 700, "y": 220}, "status": "healthy", "currentLoad": 0},
            {"id": "chat-service", "type": "SERVICE", "label": "Chat Service", "description": "Handles message routing, delivery, and E2E encryption", "tech": "Erlang/OTP", "scale": "10K msg/s", "capacity": 10000, "position": {"x": 180, "y": 380}, "status": "healthy", "currentLoad": 0},
            {"id": "presence-service", "type": "SERVICE", "label": "Presence Service", "description": "Tracks online/offline status and last seen timestamps", "tech": "Go", "scale": "8K updates/s", "capacity": 8000, "position": {"x": 380, "y": 380}, "status": "healthy", "currentLoad": 0},
            {"id": "media-service", "type": "SERVICE", "label": "Media Service", "description": "Processes image, video, and document uploads", "tech": "Java", "scale": "5K uploads/s", "capacity": 5000, "position": {"x": 620, "y": 380}, "status": "healthy", "currentLoad": 0},
            {"id": "notification-service", "type": "SERVICE", "label": "Notification Service", "description": "Push notifications via APNs and FCM", "tech": "Python", "scale": "12K push/s", "capacity": 12000, "position": {"x": 820, "y": 380}, "status": "healthy", "currentLoad": 0},
            {"id": "cassandra", "type": "DATABASE", "label": "Cassandra", "description": "Distributed NoSQL for message history and metadata", "tech": "Apache Cassandra", "scale": "Petabytes", "capacity": 20000, "position": {"x": 180, "y": 540}, "status": "healthy", "currentLoad": 0},
            {"id": "redis", "type": "CACHE", "label": "Redis", "description": "In-memory cache for sessions, presence, and hot data", "tech": "Redis Cluster", "scale": "50K ops/s", "capacity": 50000, "position": {"x": 380, "y": 540}, "status": "healthy", "currentLoad": 0},
            {"id": "s3", "type": "DATABASE", "label": "S3", "description": "Object storage for media files and backups", "tech": "Amazon S3", "scale": "Exabytes", "capacity": 99999, "position": {"x": 620, "y": 540}, "status": "healthy", "currentLoad": 0},
            {"id": "kafka", "type": "QUEUE", "label": "Kafka", "description": "Event streaming for async message delivery and fan-out", "tech": "Apache Kafka", "scale": "40K events/s", "capacity": 40000, "position": {"x": 820, "y": 540}, "status": "healthy", "currentLoad": 0},
        ],
        "edges": [
            {"id": "e1", "source": "mobile-client", "target": "websocket-lb", "label": "WebSocket", "animated": True, "throughput": 45000},
            {"id": "e2", "source": "mobile-client", "target": "media-lb", "label": "HTTPS", "animated": True, "throughput": 25000},
            {"id": "e3", "source": "websocket-lb", "target": "chat-service", "animated": True, "throughput": 28000},
            {"id": "e4", "source": "websocket-lb", "target": "presence-service", "animated": True, "throughput": 17000},
            {"id": "e5", "source": "media-lb", "target": "media-service", "animated": True, "throughput": 22000},
            {"id": "e6", "source": "chat-service", "target": "cassandra", "label": "write", "animated": True, "throughput": 15000},
            {"id": "e7", "source": "chat-service", "target": "redis", "label": "cache", "animated": True, "throughput": 35000},
            {"id": "e8", "source": "chat-service", "target": "kafka", "label": "publish", "animated": True, "throughput": 12000},
            {"id": "e9", "source": "presence-service", "target": "redis", "animated": True, "throughput": 20000},
            {"id": "e10", "source": "media-service", "target": "s3", "animated": True, "throughput": 18000},
            {"id": "e11", "source": "notification-service", "target": "kafka", "label": "consume", "animated": True, "throughput": 10000},
        ],
        "tradeoffs": [
            f"[DEMO MODE] Live Gemini generation failed — showing reference topology for '{system_name}', not a real {system_name} design.",
            "Cassandra chosen over PostgreSQL for write-heavy message storage at scale, accepting eventual consistency for cross-region replication.",
            "WebSocket connections pinned to specific servers — requires sticky sessions and complicates horizontal scaling.",
            "Event streaming decouples delivery from core services but adds latency for offline processing.",
            "In-memory cache cluster mitigates hot keys but popular entities remain a bottleneck.",
        ],
        "scale_numbers": {
            "users": "2B",
            "messages_per_day": "100B",
            "p99_latency": "50ms",
            "storage": "Petabytes",
            "uptime": "99.99%",
        },
        "scores": {
            "latency": 7,
            "scalability": 9,
            "consistency": 6,
            "cost": 5,
            "complexity": 8,
        },
    }

    if variant:
        mock = json.loads(json.dumps(mock))
        mock["system"] = f"{system_name} ({variant})"
        mock["description"] = f"Demo variant: {variant}. " + mock["description"]
        mock["scores"] = {
            "latency": 8,
            "scalability": 7,
            "consistency": 8,
            "cost": 6,
            "complexity": 6,
        }
        for node in mock["nodes"]:
            if node["id"] == "cassandra":
                node["label"] = "PostgreSQL"
                node["tech"] = "PostgreSQL + Citus"
                node["description"] = "Distributed SQL for strong consistency message storage"

    return mock


def _is_retryable_error(exc: Exception) -> bool:
    status_code = getattr(exc, "status_code", None)
    if status_code in (429, 503):
        return True
    msg = str(exc)
    return "429" in msg or "503" in msg or "RESOURCE_EXHAUSTED" in msg or "UNAVAILABLE" in msg


def _should_try_next_model(exc: Exception) -> bool:
    if _is_retryable_error(exc):
        return True
    msg = str(exc)
    return "404" in msg or "NOT_FOUND" in msg


def generate_content_with_retry(contents: str) -> str:
    last_exc: Optional[Exception] = None
    active_client = get_gemini_client()

    for model in GEMINI_MODELS:
        for attempt in range(len(RETRY_DELAYS) + 1):
            try:
                response = active_client.models.generate_content(
                    model=model,
                    contents=contents,
                )
                print(f"GEMINI OK: model={model}")
                return response.text or ""
            except Exception as exc:
                last_exc = exc
                if not _should_try_next_model(exc):
                    raise
                if attempt < len(RETRY_DELAYS) and _is_retryable_error(exc):
                    delay = RETRY_DELAYS[attempt]
                    print(f"GEMINI RETRY: model={model} attempt {attempt + 1}, waiting {delay}s...")
                    time.sleep(delay)
                    continue
                print(f"GEMINI: model={model} unavailable, trying next model...")
                break

    raise last_exc  # type: ignore[misc]


def call_gemini_text(prompt: str, *, fallback: Optional[str] = "Unable to generate a response right now. Please try again.") -> Tuple[str, bool]:
    try:
        text = generate_content_with_retry(prompt).strip()
        return text, True
    except Exception:
        print("GEMINI TEXT ERROR:", traceback.format_exc())
        if fallback is not None:
            return fallback, False
        return "", False


def compact_graph_summary(graph: ArchGraph) -> dict:
    node_type = lambda t: t.value if hasattr(t, "value") else t
    return {
        "system": graph.system,
        "nodes": [{"label": n.label, "type": node_type(n.type)} for n in graph.nodes],
        "scores": graph.scores.model_dump() if graph.scores else None,
    }


def call_gemini(prompt: str, variant: str = None) -> Tuple[dict, str]:
    try:
        if variant:
            user_prompt = (
                f"Design the architecture for: {prompt}.\n\n"
                f"IMPORTANT: You must design a **{variant}** variant of this system. "
                f"Use technologies, data stores, and service boundaries appropriate for a {variant} design. "
                f"Explain in the description and tradeoffs how this {variant} approach differs from a standard/default architecture. "
                f"Include the variant approach in the system field (e.g. \"{prompt} ({variant})\")."
            )
        else:
            user_prompt = f"Design the architecture for: {prompt}. Use a standard, production-grade approach."

        full_prompt = SYSTEM_DESIGN_PROMPT + "\n\n" + user_prompt

        raw = generate_content_with_retry(full_prompt)
        print("GEMINI RAW RESPONSE:", raw[:500])

        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw), "gemini"
    except Exception:
        print("GEMINI ERROR:", traceback.format_exc())
        return get_mock_graph(variant, prompt=prompt), "mock"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/test-gemini")
async def test_gemini():
    try:
        raw = generate_content_with_retry("Reply with one sentence describing a simple cache system.")
        return {"success": True, "raw": raw[:200]}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_architecture(request: GenerateRequest):
    result, source = call_gemini(request.prompt, request.variant)
    return GenerateResponse(graph=ArchGraph(**result), source=source)


@app.post("/api/ask", response_model=AskResponse)
async def ask_scale_question(request: AskRequest):
    graph_json = json.dumps(request.graph.model_dump())
    prompt = (
        f"You are a system design expert. Here is the current architecture: {graph_json}. "
        f"The user asks: {request.question}. "
        f"Answer in 2-4 sentences, specific to this architecture. Reference actual node names from the graph."
    )
    answer, success = call_gemini_text(prompt)
    return AskResponse(answer=answer, success=success)


@app.post("/api/compare-summary", response_model=CompareSummaryResponse)
async def compare_summary(request: CompareSummaryRequest):
    graph_a = json.dumps(compact_graph_summary(request.graph_a))
    graph_b = json.dumps(compact_graph_summary(request.graph_b))
    prompt = (
        f"You are a system design expert. Compare these two architecture variants and summarize "
        f"the key tradeoffs in 2-3 sentences.\n\n"
        f"Architecture A:\n{graph_a}\n\n"
        f"Architecture B:\n{graph_b}\n\n"
        f"Be specific about latency, consistency, scalability, cost, and complexity differences."
    )
    summary, success = call_gemini_text(prompt, fallback=None)
    return CompareSummaryResponse(summary=summary, success=success)
