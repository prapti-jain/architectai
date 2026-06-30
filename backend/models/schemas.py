from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class NodeType(str, Enum):
    CLIENT = "CLIENT"
    LOAD_BALANCER = "LOAD_BALANCER"
    SERVICE = "SERVICE"
    DATABASE = "DATABASE"
    CACHE = "CACHE"
    QUEUE = "QUEUE"
    CDN = "CDN"


class Position(BaseModel):
    x: float
    y: float


class ArchNode(BaseModel):
    id: str
    type: NodeType
    label: str
    description: str
    tech: str
    scale: str
    capacity: int
    position: Position
    status: str = "healthy"
    currentLoad: float = 0


class ArchEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = True
    throughput: int


class ArchScores(BaseModel):
    latency: int = Field(ge=1, le=10)
    scalability: int = Field(ge=1, le=10)
    consistency: int = Field(ge=1, le=10)
    cost: int = Field(ge=1, le=10)
    complexity: int = Field(ge=1, le=10)


class ArchGraph(BaseModel):
    system: str
    description: str
    nodes: list[ArchNode]
    edges: list[ArchEdge]
    tradeoffs: list[str]
    scale_numbers: dict[str, str]
    scores: Optional[ArchScores] = None


class GenerateRequest(BaseModel):
    prompt: str
    variant: Optional[str] = None


class GenerateResponse(BaseModel):
    graph: ArchGraph
    source: str  # "gemini" | "mock"


class AskRequest(BaseModel):
    question: str
    graph: ArchGraph


class AskResponse(BaseModel):
    answer: str
    success: bool = True


class CompareSummaryRequest(BaseModel):
    graph_a: ArchGraph
    graph_b: ArchGraph


class CompareSummaryResponse(BaseModel):
    summary: str
    success: bool = True
