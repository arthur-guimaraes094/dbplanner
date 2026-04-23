import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge
} from '@xyflow/react';
import type { Connection, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TableNode from './TableNode';

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

interface CanvasProps {
  nodes: any[];
  edges: any[];
  setEdges: any;
  onNodesChange: any;
  onEdgesChange: any;
}

export default function Canvas({ 
  nodes, 
  edges, 
  setEdges, 
  onNodesChange, 
  onEdgesChange 
}: CanvasProps) {
  
  const [hoveredEdge, setHoveredEdge] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds: any) => addEdge(params, eds)),
    [setEdges]
  );

  const displayNodes = nodes.map((node: any) => {
    if (!hoveredEdge) return { ...node, className: (node.className || '').replace(/highlighted-node|dimmed-node/g, '').trim() };
    const isRelated = node.id === hoveredEdge.source || node.id === hoveredEdge.target;
    const baseClass = (node.className || '').replace(/highlighted-node|dimmed-node/g, '').trim();
    return { ...node, className: `${baseClass} ${isRelated ? 'highlighted-node' : 'dimmed-node'}`.trim() };
  });

  const displayEdges = edges.map((edge: any) => {
    if (!hoveredEdge) return { ...edge, className: (edge.className || '').replace(/highlighted-edge|dimmed-edge/g, '').trim() };
    const isRelated = edge.id === hoveredEdge.id;
    const baseClass = (edge.className || '').replace(/highlighted-edge|dimmed-edge/g, '').trim();
    return { 
      ...edge, 
      className: `${baseClass} ${isRelated ? 'highlighted-edge' : 'dimmed-edge'}`.trim(),
      style: isRelated ? { ...edge.style, strokeWidth: 4, stroke: '#60a5fa' } : edge.style
    };
  });

  return (
    <div className="canvas-area">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onEdgeMouseEnter={(_, edge) => setHoveredEdge(edge)}
        onEdgeMouseLeave={() => setHoveredEdge(null)}
        defaultEdgeOptions={{ 
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5, 5' },
          className: 'pulsing-edge'
        }}
        fitView
      >
        <Controls />
        <MiniMap nodeColor="#1e293b" maskColor="rgba(15, 23, 42, 0.8)" />
        <Background color="#334155" gap={16} />
      </ReactFlow>
    </div>
  );
}
