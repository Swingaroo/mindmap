import React, { FC, memo, useState, SVGProps, useRef } from 'react';
import { NodeProps } from 'reactflow';
import showdown from 'showdown';
import { ViewNodeData, TextStyle, DiagramState, ViewElement } from '../types';
import DiagramEditor from './diagram/DiagramEditor';
import Button from './ui/Button';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

const ViewNode: FC<NodeProps<ViewNodeData>> = ({ data, selected }) => {
  const { id: nodeId, title, elements, onFocus, isReadOnly, onNodeDataChange, isHighlighterActive, onHighlightElement } = data;
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const handleDiagramChange = (diagramId: string, newDiagramState: DiagramState) => {
    if (!nodeId || !onNodeDataChange) return;
    const newElements = elements.map(el =>
      el.id === diagramId && el.type === 'diagram' ? { ...el, diagramState: newDiagramState } : el
    );
    onNodeDataChange(nodeId, { elements: newElements as ViewElement[] });
  };
  
  const handleToggleDiagramEdit = (diagramId: string) => {
    setEditingDiagramId(prevId => (prevId === diagramId ? null : diagramId));
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (isHighlighterActive && onHighlightElement && contentContainerRef.current) {
        e.stopPropagation();
        const target = e.target as HTMLElement;

        // If click is inside a diagram, let the diagram's handler take care of it.
        if (target.closest('.diagram-container')) {
            return;
        }

        // Allow links to function normally
        if (target.closest('a, button')) {
            return;
        }

        // Find the closest highlightable ancestor element.
        const highlightableElement = target.closest(
            'p, li, h1, h2, h3, h4, h5, h6, img, pre, blockquote'
        );

        if (highlightableElement && contentContainerRef.current.contains(highlightableElement)) {
            onHighlightElement(highlightableElement as HTMLElement);
        }
    }
  };

  return (
    <div className={`
      bg-white shadow-md border h-full w-full
      ${selected ? 'border-blue-500' : 'border-gray-300'} 
      transition-colors duration-150 ease-in-out flex flex-col
    `}>
      <div className="px-4 pt-3 pb-2 border-b border-gray-200 cursor-move">
        <h3 className="font-semibold text-gray-800 break-words">{title}</h3>
      </div>
      
      <div 
        ref={contentContainerRef}
        onClick={handleContentClick}
        className="p-4 space-y-2 flex-grow overflow-y-auto"
      >
        {elements.map(element => {
          switch (element.type) {
            case 'text':
              if (element.style === TextStyle.Body) {
                const htmlContent = converter.makeHtml(element.content);
                return (
                  <div
                    key={element.id}
                    className="nodrag text-sm text-gray-700 break-words 
                               [&_ul]:list-disc [&_ul]:pl-5
                               [&_ol]:list-decimal [&_ol]:pl-5
                               [&_strong]:font-bold [&_b]:font-bold
                               [&_em]:italic [&_i]:italic
                               [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                );
              }
              return (
                <p 
                  key={element.id} 
                  className="text-xl font-bold text-gray-900 break-words"
                >
                  {element.content}
                </p>
              );
            case 'image':
              return (
                <img 
                  key={element.id} 
                  src={element.src} 
                  alt="view content" 
                  className="max-w-full h-auto rounded"
                />
              );
            case 'link':
              return (
                 <button
                    key={element.id}
                    onClick={() => onFocus?.(element.targetViewId)}
                    className="w-full text-left text-sm text-indigo-600 hover:text-indigo-800 hover:underline p-1 rounded transition-colors"
                 >
                    &rarr; {element.content}
                 </button>
              );
            case 'diagram': {
                const isEditingThisDiagram = editingDiagramId === element.id;
                return (
                    <div key={element.id} className="py-2 diagram-container">
                        <div className="relative">
                            {!isReadOnly && !isEditingThisDiagram && (
                                <div className="absolute top-2 right-2 z-10">
                                    <Button onClick={() => handleToggleDiagramEdit(element.id)} variant="outline" size="sm">
                                        <EditIcon className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            )}
                            <DiagramEditor
                                diagramState={element.diagramState}
                                isReadOnly={isReadOnly || !isEditingThisDiagram}
                                onChange={(newState) => handleDiagramChange(element.id, newState)}
                                onDoneEditing={() => handleToggleDiagramEdit(element.id)}
                                height={element.height}
                                viewBox={element.viewBox}
                                isHighlighterActive={isHighlighterActive}
                                onHighlightElement={onHighlightElement}
                            />
                        </div>
                        {element.caption && (
                            <p className="text-xs text-gray-600 mt-2 text-center italic">{element.caption}</p>
                        )}
                    </div>
                );
            }
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

const EditIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

const CheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);


export default memo(ViewNode);