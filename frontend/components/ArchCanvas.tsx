'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ArchGraph } from '@/lib/types'
import { getNodeStatus } from '@/lib/graphEngine'
import { ClientNode } from './NodeTypes/ClientNode'
import { LoadBalancerNode } from './NodeTypes/LoadBalancerNode'
import { ServiceNode } from './NodeTypes/ServiceNode'
import { DatabaseNode } from './NodeTypes/DatabaseNode'
import { CacheNode } from './NodeTypes/CacheNode'
import { QueueNode } from './NodeTypes/QueueNode'

const nodeTypes = {
  CLIENT: ClientNode,
  LOAD_BALANCER: LoadBalancerNode,
  SERVICE: ServiceNode,
  DATABASE: DatabaseNode,
  CACHE: CacheNode,
  QUEUE: QueueNode,
  CDN: ClientNode,
}

interface ArchCanvasProps {
  graph: ArchGraph
  failedNodes: Set<string>
  affectedNodes: Set<string>
  loadMap: Map<string, number>
  showLoad: boolean
  onNodeClick: (nodeId: string) => void
}

export function ArchCanvas({
  graph,
  failedNodes,
  affectedNodes,
  loadMap,
  showLoad,
  onNodeClick,
}: ArchCanvasProps) {
  const flowRef = useRef<HTMLDivElement>(null)
  const [hideChrome, setHideChrome] = useState(false)
  const [showExportToast, setShowExportToast] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const initialNodes: Node[] = useMemo(
    () =>
      graph.nodes.map((node) => {
        const load = loadMap.get(node.id) ?? 0
        const isFailed = failedNodes.has(node.id)
        const status = isFailed ? 'down' : getNodeStatus(load)

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node,
            currentLoad: load,
            status,
            isFailed,
            isAffected: affectedNodes.has(node.id),
            showLoad,
            onNodeClick,
          },
        }
      }),
    [graph.nodes, loadMap, failedNodes, affectedNodes, showLoad, onNodeClick]
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        animated: edge.animated,
        style: { stroke: '#4a4a6a', strokeWidth: 1.5 },
        labelStyle: { fill: '#6b6b8a', fontSize: 10 },
        labelBgStyle: { fill: '#0a0a0f', fillOpacity: 0.8 },
      })),
    [graph.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(
      graph.nodes.map((node) => {
        const load = loadMap.get(node.id) ?? 0
        const isFailed = failedNodes.has(node.id)
        const status = isFailed ? 'down' : getNodeStatus(load)

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node,
            currentLoad: load,
            status,
            isFailed,
            isAffected: affectedNodes.has(node.id),
            showLoad,
            onNodeClick,
          },
        }
      })
    )
    setEdges(
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        animated: edge.animated,
        style: { stroke: '#4a4a6a', strokeWidth: 1.5 },
        labelStyle: { fill: '#6b6b8a', fontSize: 10 },
        labelBgStyle: { fill: '#0a0a0f', fillOpacity: 0.8 },
      }))
    )
  }, [graph, loadMap, failedNodes, affectedNodes, showLoad, onNodeClick, setNodes, setEdges])

  const onInit = useCallback((instance: { fitView: (opts?: object) => void }) => {
    setTimeout(() => instance.fitView({ padding: 0.2 }), 50)
  }, [])

  const handleExport = useCallback(async () => {
    const viewport = flowRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!viewport || isExporting) return

    setIsExporting(true)
    setHideChrome(true)
    await new Promise((r) => setTimeout(r, 100))

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#0a0a0f',
        pixelRatio: 2,
        cacheBust: true,
      })

      const filename = `${graph.system.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'architecture'}-architecture.png`
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()

      setShowExportToast(true)
      setTimeout(() => setShowExportToast(false), 2000)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setHideChrome(false)
      setIsExporting(false)
    }
  }, [graph.system, isExporting])

  return (
    <div className="w-full h-full relative" ref={flowRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#2a2a3a"
        />
        {!hideChrome && (
          <Controls
            className="!bg-[#1a1a24] !border-[#2a2a3a] !shadow-lg [&>button]:!bg-[#1a1a24] [&>button]:!border-[#2a2a3a] [&>button]:!text-gray-400 [&>button:hover]:!bg-[#2a2a3a]"
          />
        )}
        {!hideChrome && (
          <MiniMap
            className="!bg-[#1a1a24] !border-[#2a2a3a]"
            nodeColor={(n) => {
              if (failedNodes.has(n.id)) return '#ef4444'
              const load = loadMap.get(n.id) ?? 0
              if (load > 0.9) return '#ef4444'
              if (load > 0.7) return '#eab308'
              return '#22c55e'
            }}
            maskColor="rgba(10, 10, 15, 0.8)"
          />
        )}
        {!hideChrome && (
          <Panel position="bottom-left" className="!m-4 !mb-[88px]">
            <button
              onClick={handleExport}
              disabled={isExporting}
              title="Export as PNG"
              className="w-[26px] h-[26px] flex items-center justify-center bg-[#1a1a24] border border-[#2a2a3a] text-gray-400 hover:bg-[#2a2a3a] hover:text-white rounded transition-colors disabled:opacity-50 shadow-lg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </Panel>
        )}
      </ReactFlow>

      {showExportToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-[#0F6E56] text-white text-xs font-medium rounded-lg shadow-lg">
          Exported!
        </div>
      )}
    </div>
  )
}
