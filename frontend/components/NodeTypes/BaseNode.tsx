'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ArchNode, NodeType } from '@/lib/types'
import { NODE_COLORS, getLoadColor, getStatusBorder } from './nodeStyles'

export interface NodeData extends ArchNode {
  isFailed?: boolean
  isAffected?: boolean
  showLoad?: boolean
  onNodeClick?: (id: string) => void
}

function BaseNodeComponent({ data, type: nodeTypeKey }: NodeProps) {
  const data_ = data as unknown as NodeData
  const nodeType = (data_.type ?? nodeTypeKey) as NodeType
  const colors = NODE_COLORS[nodeType] ?? NODE_COLORS[NodeType.SERVICE]
  const load = data_.currentLoad ?? 0
  const status = data_.status ?? 'healthy'
  const borderColor = data_.isFailed
    ? '#ef4444'
    : data_.isAffected
      ? '#eab308'
      : getStatusBorder(status)

  return (
    <div
      className={`arch-node group relative cursor-pointer rounded-lg shadow-lg transition-all duration-200 ${
        data_.isFailed ? 'node-failed' : ''
      } ${data_.isAffected && !data_.isFailed ? 'node-affected' : ''}`}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${borderColor}`,
        minWidth: 140,
      }}
      onClick={() => data_.onNodeClick?.(data_.id)}
      title="Click to simulate failure"
    >
      <div
        className="absolute left-0 right-0 top-0 h-1 rounded-t-lg"
        style={{ backgroundColor: colors.accent }}
      />

      <Handle type="target" position={Position.Top} className="!bg-[#4a4a6a] !w-2 !h-2 !border-0" />

      <div className="px-3 py-2.5 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: colors.accent, color: '#fff' }}
          >
            {colors.badge}
          </span>
          {data_.scale && (
            <span className="text-[9px] text-gray-500 ml-auto">{data_.scale}</span>
          )}
        </div>

        <div className="text-[13px] font-bold text-gray-900 leading-tight">{data_.label}</div>
        <div className="text-[11px] text-gray-500 mt-0.5">{data_.tech}</div>
      </div>

      {data_.showLoad && (
        <div className="px-3 pb-2">
          <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.min(100, load * 100)}%`,
                backgroundColor: getLoadColor(load),
              }}
            />
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#4a4a6a] !w-2 !h-2 !border-0" />

      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-[10px] text-gray-400 bg-[#1a1a24] px-2 py-0.5 rounded">
        click to simulate failure
      </div>
    </div>
  )
}

export const BaseNode = memo(BaseNodeComponent)
