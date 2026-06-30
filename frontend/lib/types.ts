export enum NodeType {
  CLIENT = 'CLIENT',
  LOAD_BALANCER = 'LOAD_BALANCER',
  SERVICE = 'SERVICE',
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  QUEUE = 'QUEUE',
  CDN = 'CDN',
}

export interface ArchNode {
  id: string
  type: NodeType
  label: string
  description: string
  tech: string
  scale: string
  capacity: number
  position: { x: number; y: number }
  status: 'healthy' | 'degraded' | 'down'
  currentLoad: number
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated: boolean
  throughput: number
}

export interface ArchGraph {
  system: string
  description: string
  nodes: ArchNode[]
  edges: ArchEdge[]
  tradeoffs: string[]
  scale_numbers: Record<string, string>
  scores?: {
    latency: number
    scalability: number
    consistency: number
    cost: number
    complexity: number
  }
}

export interface SimulationState {
  isRunning: boolean
  requestsPerSec: number
  globalLoad: number
}

export interface ArchScores {
  latency: number
  scalability: number
  consistency: number
  cost: number
  complexity: number
}
