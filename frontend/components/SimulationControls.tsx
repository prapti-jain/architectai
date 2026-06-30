'use client'

interface SimulationControlsProps {
  requestsPerSec: number
  isRunning: boolean
  systemHealth: 'healthy' | 'degraded' | 'critical'
  onRequestsChange: (rps: number) => void
  onStart: () => void
  onStop: () => void
  onResetFailures: () => void
}

function formatRps(rps: number): string {
  if (rps >= 1000) return `${Math.round(rps / 1000)}K req/s`
  return `${rps} req/s`
}

const healthColors = {
  healthy: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
  degraded: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
}

export function SimulationControls({
  requestsPerSec,
  isRunning,
  systemHealth,
  onRequestsChange,
  onStart,
  onStop,
  onResetFailures,
}: SimulationControlsProps) {
  const health = healthColors[systemHealth]

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-[#0f0f14]/95 backdrop-blur-sm border border-[#2a2a3a] rounded-xl px-5 py-4 shadow-2xl min-w-[480px]">
      <div className="flex items-center gap-2 mb-3">
        {isRunning && (
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
        <span className="text-white text-sm font-medium">Traffic Simulation</span>
        <span
          className={`ml-auto text-xs px-2.5 py-0.5 rounded-full ${health.bg} ${health.text} capitalize flex items-center gap-1.5`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
          {systemHealth}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100000}
            step={1000}
            value={requestsPerSec}
            onChange={(e) => onRequestsChange(Number(e.target.value))}
            className="w-full h-1.5 bg-[#2a2a3a] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-500">0</span>
            <span className="text-xs text-white font-mono">{formatRps(requestsPerSec)}</span>
            <span className="text-[10px] text-gray-500">100K</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isRunning ? (
            <button
              onClick={onStop}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={onStart}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors"
            >
              Start
            </button>
          )}
          <button
            onClick={onResetFailures}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 border border-[#2a2a3a] hover:bg-[#1a1a24] rounded-lg transition-colors"
          >
            Reset failures
          </button>
        </div>
      </div>
    </div>
  )
}
