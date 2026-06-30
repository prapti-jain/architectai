'use client'

import { useCallback, useState } from 'react'
import { ArchGraph } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface ScaleChatMessage {
  question: string
  answer: string
  timestamp: number
}

export function useScaleChat() {
  const [messages, setMessages] = useState<ScaleChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const askQuestion = useCallback(async (question: string, graph: ArchGraph) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, graph }),
      })
      if (!res.ok) throw new Error('Failed to get answer')
      const data: { answer: string; success?: boolean } = await res.json()
      const answer = data.success === false
        ? 'Gemini unavailable — could not answer right now. Try again when quota resets.'
        : data.answer
      setMessages((prev) => [
        { question, answer, timestamp: Date.now() },
        ...prev,
      ])
    } catch {
      setMessages((prev) => [
        {
          question,
          answer: 'Network error — could not reach the server.',
          timestamp: Date.now(),
        },
        ...prev,
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { messages, isLoading, askQuestion }
}
