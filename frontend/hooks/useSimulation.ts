'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArchEdge, ArchNode, SimulationState } from '@/lib/types'
import { calculateAllLoads, getSystemHealth } from '@/lib/simulationEngine'

export function useSimulation(nodes: ArchNode[], edges: ArchEdge[]) {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    requestsPerSec: 10000,
    globalLoad: 0,
  })
  const [loadMap, setLoadMap] = useState<Map<string, number>>(new Map())
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recalculateLoads = useCallback(
    (rps: number) => {
      const loads = calculateAllLoads(nodes, edges, rps)
      setLoadMap(loads)
      setSystemHealth(getSystemHealth(loads))
      const maxLoad = Math.max(...Array.from(loads.values()), 0)
      setSimulationState((prev) => ({ ...prev, globalLoad: maxLoad }))
    },
    [nodes, edges]
  )

  const setRequestsPerSec = useCallback(
    (rps: number) => {
      setSimulationState((prev) => ({ ...prev, requestsPerSec: rps }))
      recalculateLoads(rps)
    },
    [recalculateLoads]
  )

  const startSimulation = useCallback(() => {
    setSimulationState((prev) => ({ ...prev, isRunning: true }))
    recalculateLoads(simulationState.requestsPerSec)
  }, [recalculateLoads, simulationState.requestsPerSec])

  const stopSimulation = useCallback(() => {
    setSimulationState((prev) => ({ ...prev, isRunning: false }))
  }, [])

  useEffect(() => {
    if (simulationState.isRunning) {
      intervalRef.current = setInterval(() => {
        recalculateLoads(simulationState.requestsPerSec)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [simulationState.isRunning, simulationState.requestsPerSec, recalculateLoads])

  useEffect(() => {
    if (nodes.length > 0) {
      recalculateLoads(simulationState.requestsPerSec)
    }
  }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    simulationState,
    loadMap,
    systemHealth,
    setRequestsPerSec,
    startSimulation,
    stopSimulation,
  }
}
