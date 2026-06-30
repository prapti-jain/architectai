'use client'

import { useState } from 'react'

export interface VariantPair {
  label: string
  a: string
  b: string
}

export const VARIANT_PAIRS: VariantPair[] = [
  {
    label: 'SQL vs NoSQL',
    a: 'SQL/relational database approach',
    b: 'NoSQL/distributed database approach',
  },
  {
    label: 'Monolith vs Microservices',
    a: 'monolithic architecture',
    b: 'microservices architecture',
  },
  {
    label: 'Synchronous vs Event-driven',
    a: 'synchronous request-response architecture',
    b: 'event-driven asynchronous architecture',
  },
]

interface PromptBarProps {
  onGenerate: (prompt: string) => void
  onCompare: (prompt: string, variantA: string, variantB: string) => void
  isLoading: boolean
}

const EXAMPLES = ['WhatsApp', 'Twitter', 'Netflix', 'Uber', 'Zoom', 'Airbnb']

export function PromptBar({ onGenerate, onCompare, isLoading }: PromptBarProps) {
  const [prompt, setPrompt] = useState('Design WhatsApp')
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [selectedPair, setSelectedPair] = useState<VariantPair>(VARIANT_PAIRS[0])

  const handleGenerate = () => {
    if (prompt.trim()) onGenerate(prompt.trim())
  }

  const handleCompareClick = () => {
    if (!prompt.trim()) return
    setShowCompareModal(true)
  }

  const handleCompareConfirm = (pair: VariantPair = selectedPair) => {
    if (!prompt.trim()) return
    setShowCompareModal(false)
    onCompare(prompt.trim(), pair.a, pair.b)
  }

  return (
    <>
      <header className="h-14 bg-[#0f0f14] border-b border-[#1e1e2e] flex flex-col relative z-20">
        <div className="flex items-center h-14 px-4 gap-4">
          <div className="flex-shrink-0">
            <div className="text-white font-bold text-base tracking-tight">ArchitectAI</div>
            <div className="text-gray-500 text-[10px]">by Prapti</div>
          </div>

          <div className="flex-1 max-w-2xl mx-auto">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe a system... e.g. Design WhatsApp"
              className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={handleCompareClick}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-300 border border-[#2a2a3a] hover:bg-[#1a1a24] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Compare
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-2 -mt-1">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isLoading}
              onClick={() => {
                const next = `Design ${example}`
                setPrompt(next)
                onGenerate(next)
              }}
              className="text-[10px] text-gray-500 hover:text-gray-300 bg-[#1a1a24] hover:bg-[#2a2a3a] px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </header>

      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f0f14] border border-[#2a2a3a] rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-white text-sm font-semibold mb-1">Compare Architectures</h3>
            <p className="text-gray-500 text-xs mb-4">
              Choose two variants to generate side-by-side for &ldquo;{prompt.trim()}&rdquo;
            </p>

            <div className="space-y-2 mb-4">
              {VARIANT_PAIRS.map((pair) => (
                <button
                  key={pair.label}
                  onClick={() => setSelectedPair(pair)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedPair.label === pair.label
                      ? 'border-[#0F6E56] bg-[#0F6E56]/10 text-white'
                      : 'border-[#2a2a3a] bg-[#1a1a24] text-gray-300 hover:border-[#3a3a4a]'
                  }`}
                >
                  {pair.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-3 py-1.5 text-xs text-gray-400 border border-[#2a2a3a] hover:bg-[#1a1a24] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompareConfirm()}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#0F6E56] hover:bg-[#0d5c47] disabled:opacity-50 rounded-lg transition-colors"
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
