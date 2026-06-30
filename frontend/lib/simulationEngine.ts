import { ArchEdge, ArchNode } from './types'

export function calculateAllLoads(
  nodes: ArchNode[],
  edges: ArchEdge[],
  requestsPerSec: number
): Map<string, number> {
  const loadMap = new Map<string, number>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const incoming = new Map<string, string[]>()
  const outgoing = new Map<string, { target: string; throughput: number }[]>()

  for (const node of nodes) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  }

  for (const edge of edges) {
    incoming.get(edge.target)?.push(edge.source)
    outgoing.get(edge.source)?.push({ target: edge.target, throughput: edge.throughput })
  }

  const entryNodes = nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0)
  const nodeTraffic = new Map<string, number>()

  for (const node of entryNodes) {
    nodeTraffic.set(node.id, requestsPerSec)
  }

  const visited = new Set<string>()
  const queue = [...entryNodes.map((n) => n.id)]

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    const traffic = nodeTraffic.get(nodeId) ?? 0
    const node = nodeMap.get(nodeId)
    if (!node) continue

    const load = Math.min(1, traffic / node.capacity)
    loadMap.set(nodeId, load)

    const targets = outgoing.get(nodeId) ?? []
    const totalThroughput = targets.reduce((sum, t) => sum + t.throughput, 0)

    if (totalThroughput > 0) {
      for (const { target, throughput } of targets) {
        const proportion = throughput / totalThroughput
        const targetTraffic = (nodeTraffic.get(target) ?? 0) + traffic * proportion
        nodeTraffic.set(target, targetTraffic)

        if (!visited.has(target)) {
          queue.push(target)
        }
      }
    }
  }

  for (const node of nodes) {
    if (!loadMap.has(node.id)) {
      loadMap.set(node.id, 0)
    }
  }

  return loadMap
}

export function getSystemHealth(loadMap: Map<string, number>): 'healthy' | 'degraded' | 'critical' {
  let hasDegraded = false

  for (const load of loadMap.values()) {
    if (load > 0.9) return 'critical'
    if (load >= 0.7) hasDegraded = true
  }

  return hasDegraded ? 'degraded' : 'healthy'
}
