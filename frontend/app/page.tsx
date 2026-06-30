'use client'

import { useCallback } from 'react'
import { PromptBar } from '@/components/PromptBar'
import { ArchCanvas } from '@/components/ArchCanvas'
import { Sidebar } from '@/components/Sidebar'
import { SimulationControls } from '@/components/SimulationControls'
import { ComparePanel } from '@/components/ComparePanel'
import { useArchitecture } from '@/hooks/useArchitecture'
import { useSimulation } from '@/hooks/useSimulation'
import { useFailureCascade } from '@/hooks/useFailureCascade'

export default function Home() {
  const {
    graph,
    compareGraph,
    compareVariants,
    isLoading,
    error,
    usingMockData,
    generateArchitecture,
    generateDualComparison,
    clearComparison,
    dismissMockBanner,
  } = useArchitecture()

  const { failedNodes, affectedNodes, triggerFailure, resetFailures } =
    useFailureCascade()

  const {
    simulationState,
    loadMap,
    systemHealth,
    setRequestsPerSec,
    startSimulation,
    stopSimulation,
  } = useSimulation(graph?.nodes ?? [], graph?.edges ?? [])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (!graph) return
      triggerFailure(nodeId, graph.edges, graph.nodes)
    },
    [graph, triggerFailure]
  )

  const handleGenerate = (prompt: string) => {
    clearComparison()
    generateArchitecture(prompt)
  }

  const handleCompare = (prompt: string, variantA: string, variantB: string) => {
    generateDualComparison(prompt, variantA, variantB)
  }

  const handleResetFailures = () => {
    resetFailures()
  }

  if (!graph) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-gray-400">Loading architecture...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PromptBar
        onGenerate={handleGenerate}
        onCompare={handleCompare}
        isLoading={isLoading}
      />

      {usingMockData && (
        <div className="bg-yellow-900/40 border-b border-yellow-700/60 text-yellow-100 text-xs px-4 py-2 flex items-center justify-center gap-3">
          <span>
            Gemini unavailable (quota exceeded) — showing <strong>demo reference architecture</strong>.
            Sidebar title reflects your prompt; topology is a template until quota resets.
          </span>
          <button
            type="button"
            onClick={dismissMockBanner}
            className="text-yellow-300/80 hover:text-yellow-100 underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border-b border-red-800 text-red-300 text-xs px-4 py-2 text-center">
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar graph={graph} />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative" style={{ backgroundColor: '#0a0a0f' }}>
            <ArchCanvas
              graph={graph}
              failedNodes={failedNodes}
              affectedNodes={affectedNodes}
              loadMap={loadMap}
              showLoad={simulationState.isRunning}
              onNodeClick={handleNodeClick}
            />
            <SimulationControls
              requestsPerSec={simulationState.requestsPerSec}
              isRunning={simulationState.isRunning}
              systemHealth={systemHealth}
              onRequestsChange={setRequestsPerSec}
              onStart={startSimulation}
              onStop={stopSimulation}
              onResetFailures={handleResetFailures}
            />
          </div>

          {compareGraph && (
            <ComparePanel
              primaryGraph={graph}
              compareGraph={compareGraph}
              variantLabelA={compareVariants?.a}
              variantLabelB={compareVariants?.b}
              onClose={clearComparison}
            />
          )}
        </main>
      </div>
    </div>
  )
}
