'use client'

import { ArchGraph, NodeType } from '@/lib/types'
import { NODE_COLORS } from './NodeTypes/nodeStyles'
import { ScaleChat } from './ScaleChat'

interface SidebarProps {
  graph: ArchGraph
}

const SCORE_LABELS = ['latency', 'scalability', 'consistency', 'cost', 'complexity'] as const

function getScoreColor(score: number): string {
  if (score > 7) return '#22c55e'
  if (score >= 5) return '#eab308'
  return '#ef4444'
}

export function Sidebar({ graph }: SidebarProps) {
  const scaleEntries = Object.entries(graph.scale_numbers)

  return (
    <aside className="w-[260px] min-w-[260px] h-full bg-[#0f0f14] border-r border-[#1e1e2e] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
      <section className="p-4 border-b border-[#1e1e2e]">
        <h2 className="text-white font-semibold text-lg">{graph.system}</h2>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{graph.description}</p>
      </section>

      {/* Scale Numbers */}
      <section className="p-4 border-b border-[#1e1e2e]">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">
          Scale
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {scaleEntries.map(([key, value]) => (
            <div
              key={key}
              className="bg-[#1a1a24] rounded-lg p-2.5 border border-[#2a2a3a]"
            >
              <div className="text-white font-bold text-sm">{value}</div>
              <div className="text-gray-500 text-[10px] mt-0.5 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Scores */}
      {graph.scores && (
        <section className="p-4 border-b border-[#1e1e2e]">
          <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">
            Architecture Scores
          </h3>
          <div className="space-y-2.5">
            {SCORE_LABELS.map((key) => {
              const score = graph.scores![key]
              return (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-400 capitalize">{key}</span>
                    <span className="text-white font-medium">{score}/10</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${score * 10}%`,
                        backgroundColor: getScoreColor(score),
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Tradeoffs */}
      <section className="p-4 border-b border-[#1e1e2e] flex-shrink-0 overflow-y-auto max-h-[180px]">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">
          Tradeoffs
        </h3>
        <ul className="space-y-2">
          {graph.tradeoffs.map((tradeoff, i) => (
            <li key={i} className="flex gap-2 text-[11px] text-gray-400 leading-relaxed">
              <span className="text-yellow-500 flex-shrink-0 mt-0.5">⚠</span>
              <span>{tradeoff}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Node Legend */}
      <section className="p-4 border-b border-[#1e1e2e] flex-shrink-0">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">
          Node Types
        </h3>
        <div className="space-y-1.5">
          {Object.values(NodeType).map((type) => {
            const colors = NODE_COLORS[type]
            return (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors.accent }}
                />
                <span className="text-[11px] text-gray-400 capitalize">
                  {type.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            )
          })}
        </div>
      </section>
      </div>

      <ScaleChat graph={graph} />
    </aside>
  )
}
