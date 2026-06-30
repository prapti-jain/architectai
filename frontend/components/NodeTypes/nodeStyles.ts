import { NodeType } from '@/lib/types'

export const NODE_COLORS: Record<
  NodeType,
  { accent: string; bg: string; badge: string }
> = {
  [NodeType.CLIENT]: { accent: '#0F6E56', bg: '#E1F5EE', badge: 'CLI' },
  [NodeType.LOAD_BALANCER]: { accent: '#534AB7', bg: '#EEEDFE', badge: 'LB' },
  [NodeType.SERVICE]: { accent: '#185FA5', bg: '#E6F1FB', badge: 'SVC' },
  [NodeType.DATABASE]: { accent: '#BA7517', bg: '#FAEEDA', badge: 'DB' },
  [NodeType.CACHE]: { accent: '#993C1D', bg: '#FAECE7', badge: 'CACHE' },
  [NodeType.QUEUE]: { accent: '#993556', bg: '#FBEAF0', badge: 'Q' },
  [NodeType.CDN]: { accent: '#0F6E56', bg: '#E1F5EE', badge: 'CDN' },
}

export function getLoadColor(load: number): string {
  if (load > 0.9) return '#ef4444'
  if (load > 0.7) return '#eab308'
  return '#22c55e'
}

export function getStatusBorder(status: string): string {
  if (status === 'down') return '#ef4444'
  if (status === 'degraded') return '#eab308'
  return '#22c55e'
}
