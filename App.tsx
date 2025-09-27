

import React, { FC, useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import { initialNodes, initialEdges } from './constants';
import { ViewNodeData, Presentation, TextStyle, ViewElement } from './types';
import ViewNode from './components/ViewNode';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';

const nodeTypes = { viewNode: ViewNode };

const App: FC = () => {
  const { getNodes, fitView } = useReactFlow();
  
  const onFocus = useCallback((id: string) => {
    const allNodes = getNodes();
    const targetNode = allNodes.find((n): n is Node<ViewNodeData> => n.id === id);
    if (targetNode) {
      fitView({ nodes: [targetNode], duration: 800, padding: 0.2 });
      // This will be handled by onNodeClick to open the editor
    }
  }, [getNodes, fitView]);

  const addOnFocusToNode = useCallback((node: Node<ViewNodeData>): Node<ViewNodeData> => {
    return { ...node, data: { ...node.data, onFocus } };
  }, [onFocus]);
  
  const [nodes, setNodes] = useState<Node<ViewNodeData>[]>(() => initialNodes.map(addOnFocusToNode));
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<ViewNodeData> | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isReadOnly) return;
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [isReadOnly]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isReadOnly) return;
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [isReadOnly]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;
      setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#4f46e5' } }, eds));
    },
    [isReadOnly]
  );
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<ViewNodeData>) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleAddView = useCallback(() => {
    const newNodeId = uuidv4();
    const newNode: Node<ViewNodeData> = {
      id: newNodeId,
      type: 'viewNode',
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 },
      data: {
        title: 'New View',
        elements: [
          { id: uuidv4(), type: 'text', content: 'Start adding content', style: TextStyle.Body }
        ],
        onFocus: onFocus,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [onFocus]);

  const handleNodeDataChange = useCallback((nodeId: string, newData: Partial<ViewNodeData>) => {
    const updatedNode = { ...selectedNode!.data, ...newData };
    setNodes((nds) =>
      nds.map((node) => 
        node.id === nodeId ? { ...node, data: updatedNode } : node
      )
    );
    setSelectedNode(prev => (prev && prev.id === nodeId ? { ...prev, data: updatedNode } : prev));
  }, [selectedNode]);

  const handleSave = useCallback(() => {
    const presentation: Presentation = { nodes, edges };
    const dataStr = JSON.stringify(presentation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'presentation.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const result = e.target?.result;
            if (typeof result === 'string') {
              const presentation: Presentation = JSON.parse(result);
              if (presentation.nodes && presentation.edges) {
                const nodesWithFocus = presentation.nodes.map(addOnFocusToNode);
                setNodes(nodesWithFocus);
                setEdges(presentation.edges);
                setSelectedNode(null);
                setTimeout(() => fitView({ duration: 500 }), 100);
              } else {
                alert('Invalid file format.');
              }
            }
          } catch (error) {
            alert('Error loading file.');
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="w-screen h-screen flex flex-col font-sans">
      <Toolbar
        onAddView={handleAddView}
        onSave={handleSave}
        onLoad={handleLoad}
        isReadOnly={isReadOnly}
        onToggleReadOnly={() => {
            setIsReadOnly(prev => !prev);
            setSelectedNode(null);
        }}
      />
      <div className="flex-grow flex relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={!isReadOnly}
        >
          <Controls />
          <Background />
          <MiniMap 
            pannable 
            zoomable
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
            }}
            nodeColor={(node) => node.selected ? '#4f46e5' : '#c7d2fe'}
            nodeStrokeColor="#4f46e5"
            nodeBorderRadius={2}
          />
        </ReactFlow>
        {selectedNode && !isReadOnly && (
          <div className="absolute right-0 top-0 h-full">
            <EditorPanel 
              key={selectedNode.id}
              node={selectedNode} 
              onNodeDataChange={handleNodeDataChange}
              onClose={() => setSelectedNode(null)}
              allNodes={nodes}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const AppWrapper: FC = () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);

export default AppWrapper;