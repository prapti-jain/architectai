import { ArchEdge, ArchNode, NodeType } from './types'

export function buildAdjacencyList(edges: ArchEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>()
  for (const edge of edges) {
    const targets = adj.get(edge.source) ?? []
    targets.push(edge.target)
    adj.set(edge.source, targets)
  }
  return adj
}

export function buildReverseAdjacencyList(edges: ArchEdge[]): Map<string, string[]> {
  const reverse = new Map<string, string[]>()
  for (const edge of edges) {
    const sources = reverse.get(edge.target) ?? []
    sources.push(edge.source)
    reverse.set(edge.target, sources)
  }
  return reverse
}

export function getFailureCascade(failedNodeId: string, edges: ArchEdge[]): string[] {
  const forward = buildAdjacencyList(edges)
  const reverse = buildReverseAdjacencyList(edges)
  const downNodes = new Set<string>([failedNodeId])
  const cascade: string[] = []
  const queue: string[] = [failedNodeId]
  const visited = new Set<string>([failedNodeId])

  while (queue.length > 0) {
    const current = queue.shift()!
    const targets = forward.get(current) ?? []

    for (const target of targets) {
      if (visited.has(target)) continue

      const upstream = reverse.get(target) ?? []
      const allUpstreamDown = upstream.every((src) => downNodes.has(src))

      if (allUpstreamDown) {
        downNodes.add(target)
        cascade.push(target)
        queue.push(target)
        visited.add(target)
      }
    }
  }

  return cascade
}

export function getPartiallyAffected(
  failedNodes: Set<string>,
  edges: ArchEdge[],
  nodes: ArchNode[]
): string[] {
  const reverse = buildReverseAdjacencyList(edges)
  const affected: string[] = []

  for (const node of nodes) {
    if (failedNodes.has(node.id)) continue
    const upstream = reverse.get(node.id) ?? []
    if (upstream.length === 0) continue
    const downUpstream = upstream.filter((src) => failedNodes.has(src))
    if (downUpstream.length > 0 && downUpstream.length < upstream.length) {
      affected.push(node.id)
    }
  }

  return affected
}

export function getAffectedByFailure(
  failedNodeId: string,
  edges: ArchEdge[],
  nodes: ArchNode[]
): { directlyAffected: string[]; fullyDown: string[] } {
  const reverse = buildReverseAdjacencyList(edges)
  const downNodes = new Set<string>([failedNodeId, ...getFailureCascade(failedNodeId, edges)])
  const directlyAffected: string[] = []
  const fullyDown: string[] = []

  for (const node of nodes) {
    if (downNodes.has(node.id)) continue

    const upstream = reverse.get(node.id) ?? []
    if (upstream.length === 0) continue

    const downUpstream = upstream.filter((src) => downNodes.has(src))
    if (downUpstream.length > 0 && downUpstream.length < upstream.length) {
      directlyAffected.push(node.id)
    }
    if (upstream.length > 0 && downUpstream.length === upstream.length) {
      fullyDown.push(node.id)
    }
  }

  return { directlyAffected, fullyDown }
}

export function calculateNodeLoad(node: ArchNode, globalLoad: number): number {
  const baseTraffic = 10000
  const weight =
    node.type === NodeType.CLIENT
      ? 1.0
      : node.type === NodeType.LOAD_BALANCER
        ? 0.9
        : 0.8
  const load = (globalLoad * weight * baseTraffic) / node.capacity
  return Math.min(1, Math.max(0, load))
}

export function getNodeStatus(load: number): 'healthy' | 'degraded' | 'down' {
  if (load > 0.9) return 'down'
  if (load > 0.7) return 'degraded'
  return 'healthy'
}
