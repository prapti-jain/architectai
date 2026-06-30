'use client'

import { useCallback, useState } from 'react'
import { ArchGraph } from '@/lib/types'
import { mockWhatsAppGraph } from '@/lib/mockData'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type GenerateSource = 'gemini' | 'mock'

interface GenerateResult {
  graph: ArchGraph
  source: GenerateSource
}

async function fetchArchitecture(prompt: string, variant?: string): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, variant }),
  })
  if (!res.ok) throw new Error(`Generation failed: ${res.statusText}`)
  const data = await res.json()
  return {
    graph: data.graph ?? data,
    source: data.source === 'mock' ? 'mock' : 'gemini',
  }
}

export function useArchitecture() {
  const [graph, setGraph] = useState<ArchGraph | null>(mockWhatsAppGraph)
  const [compareGraph, setCompareGraph] = useState<ArchGraph | null>(null)
  const [compareVariants, setCompareVariants] = useState<{ a: string; b: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)

  const generateArchitecture = useCallback(async (prompt: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { graph: data, source } = await fetchArchitecture(prompt)
      setGraph(data)
      setCompareGraph(null)
      setCompareVariants(null)
      setHasGenerated(true)
      setUsingMockData(source === 'mock')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate architecture')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateDualComparison = useCallback(
    async (prompt: string, variantA: string, variantB: string) => {
      setIsLoading(true)
      setError(null)
      setCompareGraph(null)
      setCompareVariants({ a: variantA, b: variantB })

      try {
        const [resultA, resultB] = await Promise.all([
          fetchArchitecture(prompt, variantA),
          fetchArchitecture(prompt, variantB),
        ])

        setGraph(resultA.graph)
        setCompareGraph(resultB.graph)
        setHasGenerated(true)
        setUsingMockData(resultA.source === 'mock' || resultB.source === 'mock')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate comparison')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearComparison = useCallback(() => {
    setCompareGraph(null)
    setCompareVariants(null)
  }, [])

  const dismissMockBanner = useCallback(() => {
    setUsingMockData(false)
  }, [])

  const resetToMock = useCallback(() => {
    setGraph(mockWhatsAppGraph)
    setCompareGraph(null)
    setCompareVariants(null)
    setHasGenerated(false)
    setUsingMockData(false)
    setError(null)
  }, [])

  return {
    graph,
    compareGraph,
    compareVariants,
    isLoading,
    error,
    hasGenerated,
    usingMockData,
    generateArchitecture,
    generateDualComparison,
    clearComparison,
    dismissMockBanner,
    resetToMock,
  }
}
