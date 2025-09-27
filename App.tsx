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
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import showdown from 'showdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { getInitialNodes, viewSizeOptions } from './constants';
import { Presentation, TextStyle, ViewNodeData, ViewElement } from './types';
import ViewNode from './components/ViewNode';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';
import DiagramEditor from './components/diagram/DiagramEditor';
import { useTranslation, TFunction } from './i18n';

const nodeTypes = { viewNode: ViewNode };

// PDF Rendering Components
const pdfConverter = new showdown.Converter();
pdfConverter.setOption('simpleLineBreaks', true);
pdfConverter.setOption('openLinksInNewWindow', true);

interface PdfViewNodeProps {
  node: Node<ViewNodeData>;
  nodeToPageMap: Map<string, number>;
  t: TFunction;
}

const PdfViewNode: FC<PdfViewNodeProps> = ({ node, nodeToPageMap, t }) => {
    const { title, elements } = node.data;
    return (
        <div className="bg-white border border-gray-300 h-full w-full flex flex-col font-sans">
            <div className="px-4 pt-3 pb-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 break-words">{title}</h3>
            </div>
            <div className="p-4 space-y-2 flex-grow overflow-y-auto">
                {elements.map(element => {
                    switch (element.type) {
                        case 'text':
                            if (element.style === TextStyle.Body) {
                                const htmlContent = pdfConverter.makeHtml(element.content);
                                return <div key={element.id} className="text-sm text-gray-700 break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_p]:m-0" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
                            }
                            return <p key={element.id} className="text-xl font-bold text-gray-900 break-words">{element.content}</p>;
                        case 'image':
                            return (
                                <div key={element.id} className="py-2">
                                    <img src={element.src} alt={t('pdf.altContentImage')} className="max-w-full h-auto rounded" />
                                    {element.caption && <p className="text-xs text-gray-600 mt-2 text-center italic">{element.caption}</p>}
                                </div>
                            );
                        case 'link': {
                            const pageNum = nodeToPageMap.get(element.targetViewId);
                            const linkText = `${element.content}${pageNum ? ` (p. ${pageNum})` : ''}`;
                            return <div key={element.id} className="w-full text-left text-sm text-indigo-600 p-1">&rarr; {linkText}</div>;
                        }
                        case 'diagram':
                            return (
                                <div key={element.id} className="py-2">
                                    <DiagramEditor diagramState={element.diagramState} isReadOnly={true} onChange={() => {}} height={element.height} viewBox={element.viewBox} />
                                    {element.caption && <p className="text-xs text-gray-600 mt-2 text-center italic">{element.caption}</p>}
                                </div>
                            );
                        default: return null;
                    }
                })}
            </div>
        </div>
    );
};

interface PdfPageProps {
  pageNodes: Node<ViewNodeData>[];
  nodeToPageMap: Map<string, number>;
  onRender: () => void;
  t: TFunction;
}

const PdfPage: FC<PdfPageProps> = ({ pageNodes, nodeToPageMap, onRender, t }) => {
  useEffect(() => {
    // Let the event loop tick once to ensure DOM is painted, especially for images
    const timer = setTimeout(() => {
        onRender();
    }, 100); // A small delay to help with image loading
    return () => clearTimeout(timer);
  }, [onRender]);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '16px',
  };

  return (
    <div style={containerStyle}>
      {pageNodes.map(node => (
        <div key={node.id} style={{ width: node.style?.width, height: node.style?.height, flexShrink: 0 }}>
          <PdfViewNode node={node} nodeToPageMap={nodeToPageMap} t={t} />
        </div>
      ))}
    </div>
  );
};


const App: FC = () => {
  const { t } = useTranslation();
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

  const handleSave = useCallback(() => {
    // The `nodes` state is already clean. The functions and extra properties are only
    // added in the `nodesForFlow` memo, so no cleanup is needed here.
    const presentation: Presentation = { nodes };
    const dataStr = JSON.stringify(presentation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = t('app.defaultJsonFilename');

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);

    // Append to the DOM, click, and then remove for better browser compatibility.
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, [nodes, t]);

  const handleSaveToPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const A4_WIDTH = 841.89;
      const A4_HEIGHT = 595.28;
      const MARGIN = 30;
      const contentWidth = A4_WIDTH - MARGIN * 2;
      const contentHeight = A4_HEIGHT - MARGIN * 2;

      // 1. Group nodes for pages
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

      // 2. Create node to page map
      const nodeToPageMap = new Map<string, number>();
      pageLayout.forEach((pageNodes, index) => {
        pageNodes.forEach(node => nodeToPageMap.set(node.id, index + 1));
      });

      // 3. Render each page and add to PDF
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.position = 'absolute';
      offscreenContainer.style.left = '-9999px';
      offscreenContainer.style.top = '0px';
      document.body.appendChild(offscreenContainer);
      const root = ReactDOM.createRoot(offscreenContainer);

      for (let i = 0; i < pageLayout.length; i++) {
        if (i > 0) pdf.addPage();
        const pageNodes = pageLayout[i];
        
        await new Promise<void>(resolve => {
            root.render(<PdfPage pageNodes={pageNodes} nodeToPageMap={nodeToPageMap} onRender={resolve} t={t} />);
        });
        
        const canvas = await html2canvas(offscreenContainer.firstChild as HTMLElement, { scale: 2, logging: false });
        const imgData = canvas.toDataURL('image/png');
        
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.height / imgProps.width;
        let imgWidth = contentWidth;
        let imgHeight = imgWidth * ratio;
        if (imgHeight > contentHeight) {
            imgHeight = contentHeight;
            imgWidth = imgHeight / ratio;
        }
        
        const x = (A4_WIDTH - imgWidth) / 2;
        const y = (A4_HEIGHT - imgHeight) / 2;
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      }
      
      root.unmount();
      document.body.removeChild(offscreenContainer);

      // 4. Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(
          t('pdf.pageOf', { currentPage: i, totalPages: pageCount }),
          A4_WIDTH - MARGIN, 
          A4_HEIGHT - 10, 
          { align: 'right' }
        );
      }

      pdf.save(t('app.defaultPdfFilename'));
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert(t('errors.pdfGenerationFailed'));
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [nodes, t]);

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