import React, { FC, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  Node,
  Edge,
  OnNodesChange,
  NodeChange,
  useReactFlow,
  ReactFlowProvider,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import { initialNodes, viewSizeOptions } from './constants';
import { Presentation, TextStyle, ViewNodeData } from './types';
import ViewNode from './components/ViewNode';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';

const nodeTypes = { viewNode: ViewNode };

const App: FC = () => {
  const { fitView } = useReactFlow();
  
  const [nodes, setNodes] = useState<Node<ViewNodeData>[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node<ViewNodeData> | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const highlightedElementRef = useRef<HTMLElement | SVGElement | null>(null);

  useEffect(() => {
    const currentlySelected = nodes.find(n => n.selected);
    setSelectedNode(currentlySelected || null);
  }, [nodes]);

  const clearHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
        if (highlightedElementRef.current instanceof SVGElement) {
            highlightedElementRef.current.style.filter = '';
        } else {
            highlightedElementRef.current.style.backgroundColor = '';
            highlightedElementRef.current.style.boxShadow = '';
            highlightedElementRef.current.style.borderRadius = '';
        }
        highlightedElementRef.current = null;
    }
  }, []);

  const handleToggleHighlighter = useCallback(() => {
      setIsHighlighterActive(prev => {
          if (prev) { // If turning off
              clearHighlight();
          }
          return !prev;
      });
  }, [clearHighlight]);

  const handleHighlightElement = useCallback((element: HTMLElement | SVGElement) => {
    clearHighlight();

    if (element instanceof SVGElement) {
        element.style.filter = 'drop-shadow(2px 2px 3px rgba(255, 255, 0, 0.8)) drop-shadow(-2px -2px 3px rgba(255, 255, 0, 0.8))';
    } else {
        // Apply new highlight for HTML elements
        element.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
        element.style.boxShadow = '0 0 0 2px rgba(255, 255, 0, 0.7)';
        element.style.borderRadius = '3px';
    }
    highlightedElementRef.current = element;
  }, [clearHighlight]);
  
  const onFocus = useCallback((id: string) => {
    // First, set the node as selected. This will trigger a re-render
    // which, if in edit mode, will show the EditorPanel and shrink the flow canvas.
    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === id })));
    
    // Use setTimeout to defer fitView until after the re-render has completed.
    setTimeout(() => {
        fitView({ nodes: [{ id }], duration: 800, padding: 0.1 });
    }, 0);
  }, [fitView, setNodes]);

  const handleNodeDataChange = useCallback((nodeId: string, newData: Partial<ViewNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNodeData = { ...node.data, ...newData };
          return { ...node, data: updatedNodeData };
        }
        return node;
      })
    );
  }, []);

  const nodesForFlow = useMemo(() => (
    nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            id: node.id,
            isReadOnly,
            onFocus,
            onNodeDataChange: handleNodeDataChange,
            isHighlighterActive,
            onHighlightElement: handleHighlightElement,
        }
    }))
  ), [nodes, isReadOnly, onFocus, handleNodeDataChange, isHighlighterActive, handleHighlightElement]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isReadOnly && changes.some(c => c.type !== 'select')) {
        return;
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [isReadOnly]
  );
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node<ViewNodeData>) => {
    // Selection is now handled by onNodesChange and the useEffect hook.
    // This handler can be used for other click-specific logic if needed.
  }, []);

  const handlePaneClick = useCallback(() => {
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    clearHighlight();
  }, [setNodes, clearHighlight]);

  const handleAddView = useCallback(() => {
    const newNodeId = uuidv4();
    const newNode: Node<ViewNodeData> = {
      id: newNodeId,
      type: 'viewNode',
      position: { x: Math.round((Math.random() * 200 + 50) / 16) * 16, y: Math.round(Math.random() * 200 / 16) * 16 },
      style: { width: `${viewSizeOptions[1].width}px`, height: `${viewSizeOptions[1].height}px` },
      data: {
        title: 'New View',
        elements: [
          { id: uuidv4(), type: 'text', content: 'Start adding content', style: TextStyle.Body }
        ],
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, []);

  const handleNodeSizeChange = useCallback((nodeId: string, width: number, height: number) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, style: { ...node.style, width: `${width}px`, height: `${height}px` } }
          : node
      )
    );
  }, []);

  const handleSave = useCallback(() => {
    // Create a deep copy to clean up data before saving
    const nodesToSave = JSON.parse(JSON.stringify(nodes));
    nodesToSave.forEach((node: Node<ViewNodeData>) => {
        delete node.data.id;
        delete node.data.onFocus;
        delete node.data.isReadOnly;
        delete node.data.onNodeDataChange;
    });

    const presentation: Presentation = { nodes: nodesToSave };
    const dataStr = JSON.stringify(presentation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'presentation.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes]);

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
              if (presentation.nodes) {
                // Deselect all nodes upon loading a new presentation
                const nodesToLoad = presentation.nodes.map(n => ({...n, selected: false}));
                setNodes(nodesToLoad);
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

  const snapGrid: [number, number] = [16, 16];

  return (
    <div className="w-screen h-screen flex flex-col font-sans">
      <Toolbar
        onAddView={handleAddView}
        onSave={handleSave}
        onLoad={handleLoad}
        isReadOnly={isReadOnly}
        onToggleReadOnly={() => {
            // If turning off readonly mode, ensure highlighter is also turned off
            if (isReadOnly) { // isReadOnly is true, about to become false
                if (isHighlighterActive) {
                    handleToggleHighlighter();
                }
            }
            setIsReadOnly(prev => !prev);
            setNodes(nds => nds.map(n => ({...n, selected: false})));
        }}
        isHighlighterActive={isHighlighterActive}
        onToggleHighlighter={handleToggleHighlighter}
      />
      <div className={`flex-grow flex min-h-0 ${isHighlighterActive ? 'highlighter-cursor' : ''}`}>
        <div className="flex-grow h-full relative">
            <ReactFlow
              nodes={nodesForFlow}
              onNodesChange={onNodesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50"
              proOptions={{ hideAttribution: true }}
              nodesDraggable={!isReadOnly}
              nodesConnectable={false}
              elementsSelectable={true}
              snapToGrid={true}
              snapGrid={snapGrid}
            >
              <Controls />
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
        </div>
        {selectedNode && !isReadOnly && (
            <EditorPanel 
              key={selectedNode.id}
              node={selectedNode} 
              onNodeDataChange={handleNodeDataChange}
              onNodeSizeChange={handleNodeSizeChange}
              onClose={() => handlePaneClick()} // Re-use handlePaneClick to deselect
              allNodes={nodes}
              sizeOptions={viewSizeOptions}
            />
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