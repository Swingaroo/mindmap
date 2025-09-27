import React, { FC, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
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
  NodeProps,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import showdown from 'showdown';

import { getInitialNodes, viewSizeOptions } from './constants';
import { Presentation, TextStyle, ViewNodeData, ViewElement, DiagramElement, ImageElement } from './types';
import ViewNode from './components/ViewNode';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';
import DiagramEditor from './components/diagram/DiagramEditor';
import { useTranslation, TFunction, I18nProvider } from './i18n';

const nodeTypes = { viewNode: ViewNode };
declare const html2pdf: any;

const PrintableDocument: FC<{
  pageLayout: Node<ViewNodeData>[][],
  onRendered: () => void,
}> = ({ pageLayout, onRendered }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // With images preloaded, we only need a very short delay to ensure the DOM is painted.
    const timer = setTimeout(() => {
        onRendered();
    }, 100);
    return () => clearTimeout(timer);
  }, [onRendered]);

  const A4_LANDSCAPE_WIDTH_PX = 1122;
  const A4_LANDSCAPE_HEIGHT_PX = 794;
  const PADDING = 40;
  const GAP = 20;

  const printableWidth = A4_LANDSCAPE_WIDTH_PX - PADDING * 2;
  const printableHeight = A4_LANDSCAPE_HEIGHT_PX - PADDING * 2;

  // Re-create the node map logic here as it's self-contained for printing
  const nodeToPageMap = useMemo(() => {
      const map = new Map<string, number>();
      pageLayout.forEach((pageNodes, index) => {
        pageNodes.forEach(node => map.set(node.id, index + 1));
      });
      return map;
  }, [pageLayout]);

  return (
    <div>
      {pageLayout.map((pageNodes, index) => {
        // FIX: Cast node.style.width to string before parseFloat to handle `string | number` type.
        const totalContentWidth = pageNodes.reduce((acc, node) => acc + parseFloat(String(node.style?.width ?? '0')), 0) + (pageNodes.length > 1 ? GAP * (pageNodes.length - 1) : 0);
        // FIX: Cast node.style.height to string before parseFloat to handle `string | number` type.
        const maxContentHeight = Math.max(0, ...pageNodes.map(node => parseFloat(String(node.style?.height ?? '0'))));
        
        if (totalContentWidth === 0 || maxContentHeight === 0) {
            return (
                 <div key={index} style={{
                    width: `${A4_LANDSCAPE_WIDTH_PX}px`,
                    height: `${A4_LANDSCAPE_HEIGHT_PX}px`,
                    backgroundColor: '#ffffff',
                    pageBreakAfter: index < pageLayout.length - 1 ? 'always' : 'auto',
                }}></div>
            );
        }

        const scaleX = totalContentWidth > printableWidth ? printableWidth / totalContentWidth : 1;
        const scaleY = maxContentHeight > printableHeight ? printableHeight / maxContentHeight : 1;
        const scale = Math.min(scaleX, scaleY);

        const containerWidth = totalContentWidth * scale;
        const containerHeight = maxContentHeight * scale;

        return (
          <div key={index} style={{
            width: `${A4_LANDSCAPE_WIDTH_PX}px`,
            height: `${A4_LANDSCAPE_HEIGHT_PX}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: `${PADDING}px`,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            pageBreakAfter: index < pageLayout.length - 1 ? 'always' : 'auto',
          }}>
            <div style={{
                display: 'flex',
                gap: `${GAP * scale}px`,
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                alignItems: 'center',
            }}>
              {pageNodes.map(node => {
                // FIX: Cast node.style.width to string before parseFloat to handle `string | number` type.
                const nodeWidth = parseFloat(String(node.style?.width ?? '0'));
                // FIX: Cast node.style.height to string before parseFloat to handle `string | number` type.
                const nodeHeight = parseFloat(String(node.style?.height ?? '0'));
                
                const scaledNodeWidth = nodeWidth * scale;
                const scaledNodeHeight = nodeHeight * scale;

                const printElements = node.data.elements.map(el => {
                    if (el.type === 'link') {
                        const pageNum = nodeToPageMap.get(el.targetViewId);
                        const linkText = `${el.content}${pageNum ? ` (p. ${pageNum})` : ''}`;
                        return {...el, content: linkText };
                    }
                    return el;
                });

                const viewNodeProps: NodeProps<ViewNodeData> = {
                    id: node.id,
                    data: {
                        ...node.data,
                        elements: printElements,
                        isReadOnly: true,
                        onFocus: (targetId) => alert(t('pdf.linkAlert', { page: nodeToPageMap.get(targetId) || '?' })),
                    },
                    selected: false,
                    type: 'viewNode',
                    xPos: 0,
                    yPos: 0,
                    zIndex: 1,
                    dragging: false,
                    isConnectable: false,
                };

                return (
                    <div key={node.id} style={{
                        width: `${scaledNodeWidth}px`,
                        height: `${scaledNodeHeight}px`,
                    }}>
                        <ViewNode {...viewNodeProps} />
                    </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const App: FC = () => {
  const { t, locale } = useTranslation();
  const { fitView } = useReactFlow();
  
  const [nodes, setNodes] = useState<Node<ViewNodeData>[]>(() => getInitialNodes(t));
  const [selectedNode, setSelectedNode] = useState<Node<ViewNodeData> | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const highlightedElementRef = useRef<HTMLElement | SVGElement | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
        title: t('defaults.newNodeTitle'),
        elements: [
          { id: uuidv4(), type: 'text', content: t('defaults.newNodeContent'), style: TextStyle.Body }
        ],
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [t]);

  const handleNodeSizeChange = useCallback((nodeId: string, width: number, height: number) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, style: { ...node.style, width: `${width}px`, height: `${height}px` } }
          : node
      )
    );
  }, []);

  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    setNodes(currentNodes => {
        const nodesWithoutDeleted = currentNodes.filter(node => node.id !== nodeIdToDelete);
        
        return nodesWithoutDeleted.map(node => {
            const elementsWithCleanedLinks = node.data.elements.filter(element => 
                !(element.type === 'link' && element.targetViewId === nodeIdToDelete)
            );

            if (elementsWithCleanedLinks.length === node.data.elements.length) {
                return node; // No changes
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    elements: elementsWithCleanedLinks,
                }
            };
        });
    });
  }, [setNodes]);

  const handleSave = useCallback(() => {
    const presentation: Presentation = { nodes };
    const dataStr = JSON.stringify(presentation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = t('app.defaultJsonFilename');

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, [nodes, t]);

 const handleExport = useCallback(async (format: 'pdf' | 'html') => {
    setIsGeneratingPdf(true);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    try {
      const imageUrls = nodes.flatMap(node =>
        node.data.elements
          .filter((el): el is ImageElement => el.type === 'image')
          .map(el => el.src)
      );
      const preloadPromises = imageUrls.map(src =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        })
      );
      await Promise.all(preloadPromises);

      const sortedNodes = [...nodes].sort((a, b) => {
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      });
      const smallNodeWidth = `${viewSizeOptions[0].width}px`;
      const pageLayout: Node<ViewNodeData>[][] = [];
      let i = 0;
      while (i < sortedNodes.length) {
        const current = sortedNodes[i];
        const isCurrentSmall = current.style?.width === smallNodeWidth;
        if (isCurrentSmall && i + 1 < sortedNodes.length) {
          const next = sortedNodes[i + 1];
          const isNextSmall = next.style?.width === smallNodeWidth;
          const yDifference = Math.abs(current.position.y - next.position.y);
          if (isNextSmall && yDifference < 100) {
            pageLayout.push([current, next]);
            i += 2; continue;
          }
        }
        pageLayout.push([current]);
        i += 1;
      }

      await new Promise<void>(resolve => {
        root.render(
          <I18nProvider>
            <PrintableDocument
              pageLayout={pageLayout}
              onRendered={resolve}
            />
          </I18nProvider>
        );
      });
      
      if (format === 'pdf') {
        const opt = {
          margin: 0,
          filename: t('app.defaultPdfFilename'),
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'px', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['css'] }
        };
        await html2pdf().from(container).set(opt).save();
      } else { // html
        const htmlContent = container.innerHTML;
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="${locale}">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${t('app.defaultPdfFilename').replace('.pdf', '')}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://cdn.jsdelivr.net/npm/reactflow@11.11.4/dist/style.css" rel="stylesheet">
          </head>
          <body class="bg-gray-200 p-8 font-sans">
              ${htmlContent}
          </body>
          </html>
        `;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const dataUri = URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', t('app.defaultHtmlFilename'));
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        URL.revokeObjectURL(dataUri);
      }

    } catch (error) {
      console.error(`${format.toUpperCase()} generation failed:`, error);
      const errorKey = format === 'pdf' ? 'errors.pdfGenerationFailed' : 'errors.htmlGenerationFailed';
      alert(t(errorKey));
    } finally {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsGeneratingPdf(false);
    }
  }, [nodes, locale, t]);

  const handleSaveToPdf = useCallback(() => handleExport('pdf'), [handleExport]);
  const handleSaveToHtml = useCallback(() => handleExport('html'), [handleExport]);

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
                alert(t('errors.invalidFileFormat'));
              }
            }
          } catch (error) {
            alert(t('errors.fileLoadFailed'));
            console.error(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const handleToggleMiniMap = () => setIsMiniMapVisible(prev => !prev);

  const snapGrid: [number, number] = [16, 16];

  return (
    <div className="w-screen h-screen flex flex-col font-sans relative">
      {isGeneratingPdf && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex flex-col items-center justify-center z-50 text-white">
          <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl font-medium mt-4">{t('pdf.generating')}</span>
        </div>
      )}
      <Toolbar
        onAddView={handleAddView}
        onSave={handleSave}
        onSaveToPdf={handleSaveToPdf}
        onSaveToHtml={handleSaveToHtml}
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
        isMiniMapVisible={isMiniMapVisible}
        onToggleMiniMap={handleToggleMiniMap}
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
              <Controls showInteractive={false} />
              {isMiniMapVisible && (
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
              )}
            </ReactFlow>
        </div>
        {selectedNode && !isReadOnly && (
            <EditorPanel 
              key={selectedNode.id}
              node={selectedNode} 
              onNodeDataChange={handleNodeDataChange}
              onNodeSizeChange={handleNodeSizeChange}
              onDeleteNode={handleDeleteNode}
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