'use client'

import { useCallback, useState } from 'react'
import { ArchEdge, ArchNode } from '@/lib/types'
import { getFailureCascade, getPartiallyAffected } from '@/lib/graphEngine'

const CASCADE_DELAY_MS = 300

export function useFailureCascade() {
  const [failedNodes, setFailedNodes] = useState<Set<string>>(new Set())
  const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set())

  const triggerFailure = useCallback(
    (nodeId: string, edges: ArchEdge[], nodes: ArchNode[]) => {
      const cascade = getFailureCascade(nodeId, edges)
      const initialFailed = new Set([nodeId])

      setFailedNodes(initialFailed)
      setAffectedNodes(new Set(getPartiallyAffected(initialFailed, edges, nodes)))

      cascade.forEach((id, index) => {
        setTimeout(() => {
          setFailedNodes((prev) => {
            const next = new Set([...prev, id])
            setAffectedNodes(new Set(getPartiallyAffected(next, edges, nodes)))
            return next
          })
        }, (index + 1) * CASCADE_DELAY_MS)
      })
    },
    []
  )

  const resetFailures = useCallback(() => {
    setFailedNodes(new Set())
    setAffectedNodes(new Set())
  }, [])

  return {
    failedNodes,
    affectedNodes,
    triggerFailure,
    resetFailures,
  }
}
