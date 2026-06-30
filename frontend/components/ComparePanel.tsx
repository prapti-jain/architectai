'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArchGraph } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const SUMMARY_DELAY_MS = 2000

interface ComparePanelProps {
  primaryGraph: ArchGraph
  compareGraph: ArchGraph
  variantLabelA?: string
  variantLabelB?: string
  onClose: () => void
}

const AXES = ['latency', 'scalability', 'consistency', 'cost', 'complexity'] as const

function getScoreColor(score: number): string {
  if (score > 7) return '#22c55e'
  if (score >= 5) return '#eab308'
  return '#ef4444'
}

function ScoreChart({
  graph,
  label,
  otherScores,
}: {
  graph: ArchGraph
  label: string
  otherScores?: ArchGraph['scores']
}) {
  const scores = graph.scores ?? {
    latency: 5,
    scalability: 5,
    consistency: 5,
    cost: 5,
    complexity: 5,
  }

  return (
    <div className="flex-1 bg-[#1a1a24] rounded-xl p-4 border border-[#2a2a3a]">
      <h4 className="text-white text-sm font-medium mb-3">{label}</h4>
      <div className="space-y-2">
        {AXES.map((axis) => {
          const score = scores[axis]
          const otherScore = otherScores?.[axis]
          const isWinner = otherScore !== undefined && score > otherScore
          const isTie = otherScore !== undefined && score === otherScore

          return (
            <div key={axis}>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="capitalize text-gray-400">{axis}</span>
                  {isWinner && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#0F6E56]/20 text-[#5eead4] border border-[#0F6E56]/40">
                      winner
                    </span>
                  )}
                  {isTie && otherScore !== undefined && (
                    <span className="text-[9px] text-gray-500">tie</span>
                  )}
                </div>
                <span className="text-white font-medium">{score}/10</span>
              </div>
              <div className="h-2 bg-[#0f0f14] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${score * 10}%`,
                    backgroundColor: isWinner ? '#0F6E56' : getScoreColor(score),
                    opacity: otherScore !== undefined && score < otherScore ? 0.5 : 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ComparePanel({
  primaryGraph,
  compareGraph,
  variantLabelA,
  variantLabelB,
  onClose,
}: ComparePanelProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryFailed, setSummaryFailed] = useState(false)
  const fetchIdRef = useRef(0)

  const fetchSummary = useCallback(
    (delayMs = SUMMARY_DELAY_MS) => {
      const fetchId = ++fetchIdRef.current
      setSummaryLoading(true)
      setSummaryFailed(false)
      setSummary(null)

      const run = () => {
        fetch(`${API_BASE}/api/compare-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph_a: primaryGraph, graph_b: compareGraph }),
        })
          .then((res) => res.json())
          .then((data: { summary: string; success: boolean }) => {
            if (fetchId !== fetchIdRef.current) return
            if (data.success && data.summary) {
              setSummary(data.summary)
              setSummaryFailed(false)
            } else {
              setSummary(null)
              setSummaryFailed(true)
            }
          })
          .catch(() => {
            if (fetchId !== fetchIdRef.current) return
            setSummary(null)
            setSummaryFailed(true)
          })
          .finally(() => {
            if (fetchId === fetchIdRef.current) setSummaryLoading(false)
          })
      }

      if (delayMs > 0) {
        const timer = setTimeout(run, delayMs)
        return () => clearTimeout(timer)
      }

      run()
      return undefined
    },
    [primaryGraph, compareGraph]
  )

  useEffect(() => {
    const cleanup = fetchSummary(SUMMARY_DELAY_MS)
    return () => {
      fetchIdRef.current += 1
      cleanup?.()
    }
  }, [fetchSummary])

  const handleRetrySummary = () => {
    fetchSummary(0)
  }

  return (
    <div className="border-t border-[#1e1e2e] bg-[#0f0f14] p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1a1a24] border border-[#2a2a3a] rounded-lg transition-colors text-sm"
        aria-label="Close comparison"
      >
        ×
      </button>

      <h3 className="text-white text-sm font-semibold mb-3 pr-8">Architecture Comparison</h3>

      <div className="flex gap-4">
        <ScoreChart
          graph={primaryGraph}
          label={variantLabelA ?? primaryGraph.system}
          otherScores={compareGraph.scores}
        />
        <ScoreChart
          graph={compareGraph}
          label={variantLabelB ?? compareGraph.system}
          otherScores={primaryGraph.scores}
        />
      </div>

      <div className="mt-3 min-h-[40px] flex items-center justify-center">
        {summaryLoading ? (
          <div className="flex items-center gap-1.5 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : summaryFailed ? (
          <button
            onClick={handleRetrySummary}
            className="text-xs font-medium text-[#5eead4] border border-[#0F6E56]/40 bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry summary
          </button>
        ) : (
          <p className="text-gray-400 text-xs text-center leading-relaxed">{summary}</p>
        )}
      </div>
    </div>
  )
}
