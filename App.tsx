import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Node,
  Edge,
  Connection,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import { Presentation, ViewNodeData, TextElement, ImageElement, LinkElement } from './types';
import ViewNode from './components/ViewNode';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';
import { initialNodes, initialEdges } from './constants';

const nodeTypes = {
  viewNode: ViewNode,
};

function Flow() {
  const [nodes, setNodes] = useState<Node<ViewNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { setViewport } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#4f46e5' } }, eds)),
    [setEdges]
  );

  const handleAddView = useCallback(() => {
    const newNodeId = uuidv4();
    const newNode: Node<ViewNodeData> = {
      id: newNodeId,
      type: 'viewNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        title: 'New View',
        elements: [],
        onFocus: (id) => focusOnNode(id)
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (!isReadOnly) {
        setSelectedNodeId(node.id);
    }
  }, [isReadOnly]);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);
  
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const updateNodeData = useCallback((nodeId: string, newData: Partial<ViewNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);
  
  const handleSave = useCallback(() => {
    const presentation: Presentation = { nodes, edges };
    const dataStr = JSON.stringify(presentation, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const presentation: Presentation = JSON.parse(content);
          if (presentation.nodes && presentation.edges) {
            // Re-assign onFocus function
            const nodesWithFocus = presentation.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onFocus: (id: string) => focusOnNode(id)
              }
            }));
            setNodes(nodesWithFocus);
            setEdges(presentation.edges);
            setSelectedNodeId(null);
          } else {
            alert('Invalid presentation file format.');
          }
        } catch (error) {
          console.error('Failed to load presentation:', error);
          alert('Failed to read or parse the presentation file.');
        }
      };
      reader.readAsText(file);
    }
     // Reset file input value to allow loading the same file again
     if(event.target) event.target.value = '';
  }, [setNodes, setEdges]);
  
  const focusOnNode = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if(node && node.position) {
            const x = node.position.x + (node.width ? node.width / 2 : 150);
            const y = node.position.y + (node.height ? node.height / 2 : 75);
            setViewport({ x, y, zoom: 1.5 }, { duration: 800 });
            if (!isReadOnly) {
                setSelectedNodeId(nodeId);
            }
        }
  }, [nodes, setViewport, isReadOnly]);

  const toggleReadOnlyMode = useCallback(() => {
    setIsReadOnly(prev => !prev);
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col font-sans bg-gray-50">
      <Toolbar 
        onAddView={handleAddView} 
        onSave={handleSave} 
        onLoad={handleLoad} 
        isReadOnly={isReadOnly}
        onToggleReadOnly={toggleReadOnlyMode}
      />
      <div className="flex-grow flex relative">
        <div className="flex-grow h-full">
           {isReadOnly && (
            <div className="absolute top-4 right-4 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full z-20 shadow">
                READ-ONLY MODE
            </div>
           )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onPaneClick={clearSelection}
            fitView
            className="bg-gray-100"
            nodesDraggable={!isReadOnly}
            nodesConnectable={!isReadOnly}
            elementsSelectable={!isReadOnly}
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        {selectedNode && !isReadOnly && (
          <EditorPanel
            key={selectedNode.id}
            node={selectedNode}
            onNodeDataChange={updateNodeData}
            onClose={clearSelection}
            allNodes={nodes}
          />
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="application/json"
        className="hidden"
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}