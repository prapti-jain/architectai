'use client'

import { useState, useRef, useEffect } from 'react'
import { ArchGraph } from '@/lib/types'
import { useScaleChat } from '@/hooks/useScaleChat'

const SUGGESTED_QUESTIONS = [
  'How would you handle 10x traffic?',
  "What's the single point of failure?",
  'How would you reduce cost?',
]

interface ScaleChatProps {
  graph: ArchGraph
}

export function ScaleChat({ graph }: ScaleChatProps) {
  const { messages, isLoading, askQuestion } = useScaleChat()
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [messages, isLoading])

  const handleSubmit = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return
    setInput('')
    askQuestion(trimmed, graph)
  }

  return (
    <section className="flex flex-col border-t border-[#1e1e2e] min-h-[220px] max-h-[320px]">
      <div className="p-3 pb-2">
        <h3 className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
          Scale Q&A
        </h3>
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 space-y-3 min-h-0"
      >
        {isLoading && (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Ask about scaling, failures, or tradeoffs for this architecture.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.timestamp} className="space-y-1.5">
            <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-2.5 py-2">
              <p className="text-[11px] text-blue-400 font-medium leading-relaxed">
                {msg.question}
              </p>
            </div>
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2.5 py-2">
              <p className="text-[11px] text-gray-300 leading-relaxed">{msg.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 pt-2 border-t border-[#1e1e2e] space-y-2">
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSubmit(q)}
              disabled={isLoading}
              className="text-[9px] text-gray-500 hover:text-gray-300 bg-[#1a1a24] hover:bg-[#2a2a3a] border border-[#2a2a3a] px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex gap-1.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about scaling, failures, or tradeoffs..."
            disabled={isLoading}
            className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-2.5 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
          >
            Ask
          </button>
        </form>
      </div>
    </section>
  )
}
