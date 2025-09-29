import React, { FC, memo, useState, SVGProps, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import showdown from 'showdown';
import { ViewNodeData, TextStyle, DiagramState, ViewElement, ImageElement, RichTextElement, C4SystemContextDiagramState } from '../types';
import DiagramEditor from './diagram/DiagramEditor';
import C4SystemContextDiagramEditor from './c4diagram/C4SystemContextDiagramEditor';
import RichTextEditor from './richtext/RichTextEditor';
import Button from './ui/Button';
import { useTranslation, TFunction } from '../i18n';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);
converter.setOption('openLinksInNewWindow', true);

const ViewNode: FC<NodeProps<ViewNodeData>> = ({ data, selected }) => {
  const { id: nodeId, title, elements, onFocus, isReadOnly, onNodeDataChange, isHighlighterActive, onHighlightElement, printOptions, isGlobalDiagramDataVisible, viewNumber } = data;
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
  const [editingC4DiagramId, setEditingC4DiagramId] = useState<string | null>(null);
  const [editingRichTextId, setEditingRichTextId] = useState<string | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleDiagramChange = (diagramId: string, newDiagramState: DiagramState) => {
    if (!nodeId || !onNodeDataChange) return;
    const newElements = elements.map(el =>
      el.id === diagramId && el.type === 'diagram' ? { ...el, diagramState: newDiagramState } : el
    );
    onNodeDataChange(nodeId, { elements: newElements as ViewElement[] });
  };
  
  const handleC4DiagramChange = (diagramId: string, newDiagramState: C4SystemContextDiagramState) => {
    if (!nodeId || !onNodeDataChange) return;
    const newElements = elements.map(el =>
      el.id === diagramId && el.type === 'c4diagram' ? { ...el, diagramState: newDiagramState } : el
    );
    onNodeDataChange(nodeId, { elements: newElements as ViewElement[] });
  };
  
  const handleToggleDiagramEdit = (diagramId: string) => {
    setEditingDiagramId(prevId => (prevId === diagramId ? null : diagramId));
  };

  const handleToggleC4DiagramEdit = (diagramId: string) => {
    setEditingC4DiagramId(prevId => (prevId === diagramId ? null : diagramId));
  };

  const handleContentClick = (e: React.MouseEvent) => {
    if (isHighlighterActive && onHighlightElement && contentContainerRef.current) {
        e.stopPropagation();
        const target = e.target as HTMLElement;

        // If click is inside a diagram, let the diagram's handler take care of it.
        if (target.closest('.diagram-container') || target.closest('.c4-diagram-container')) {
            return;
        }

        // Allow links to function normally
        if (target.closest('a, button')) {
            return;
        }

        // Find the closest highlightable ancestor element.
        const highlightableElement = target.closest(
            'p, li, h1, h2, h3, h4, h5, h6, img, pre, blockquote, div.rich-text-content'
        );

        if (highlightableElement && contentContainerRef.current.contains(highlightableElement)) {
            onHighlightElement(highlightableElement as HTMLElement);
        }
    }
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFocus && nodeId) {
      onFocus(nodeId);
    }
  };

  return (
    <div
      className={`
        bg-white shadow-md border flex flex-col h-full w-full
        ${selected ? 'border-blue-500' : 'border-gray-300'} 
        transition-colors duration-150 ease-in-out
      `}
    >
      <div 
        className={`px-4 pt-3 pb-2 border-b border-gray-200 ${isReadOnly ? 'cursor-pointer' : 'cursor-move'} flex-shrink-0 flex justify-between items-center`}
        onDoubleClickCapture={handleHeaderDoubleClick}
      >
        <h3 className="font-semibold text-gray-800 break-words flex-grow pr-2">{title}</h3>
        {viewNumber != null && (
          <span className="text-sm font-medium text-gray-400 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            <span className="relative bottom-px">{viewNumber}</span>
          </span>
        )}
      </div>
      
      <div 
        ref={contentContainerRef}
        onClick={handleContentClick}
        className="p-4 space-y-2 flex-grow"
        style={{ overflow: 'hidden' }}
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
            case 'image': {
              const imgElement = element as ImageElement;
              if (imgElement.src === 'CONVERSION_FAILED') {
                return (
                  <div key={imgElement.id} className="p-4 border border-dashed border-red-300 bg-red-50 text-red-700 rounded text-center text-sm">
                    <p>{t('errors.imageLoadFailed')}</p>
                    {imgElement.caption && <p className="truncate text-xs text-red-500 mt-1">{imgElement.caption}</p>}
                  </div>
                );
              }
              return (
                <div key={imgElement.id}>
                  <img 
                    src={imgElement.src} 
                    alt={t('viewNode.altContentImage')}
                    className="max-w-full h-auto rounded"
                  />
                  {imgElement.caption && (
                    <p className="text-xs text-gray-600 mt-2 text-center italic">{imgElement.caption}</p>
                  )}
                </div>
              );
            }
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
            case 'richtext': {
                return (
                  <RichTextEditor
                    key={element.id}
                    element={element}
                    isEditing={editingRichTextId === element.id}
                    isReadOnly={!!isReadOnly}
                    onStartEdit={() => setEditingRichTextId(element.id)}
                    onSave={(newContent) => {
                        if (!nodeId || !onNodeDataChange) return;
                        if (newContent === element.content && editingRichTextId === element.id) {
                             setEditingRichTextId(null);
                             return;
                        }
                        const newElements = elements.map(el =>
                            el.id === element.id ? { ...el, content: newContent } : el
                        );
                        onNodeDataChange(nodeId, { elements: newElements as ViewElement[] });
                        setEditingRichTextId(null);
                    }}
                    t={t}
                  />
                );
            }
            case 'diagram': {
                const isEditingThisDiagram = editingDiagramId === element.id;
                // In Preview mode, pass the global toggle state. In Edit mode, always pass true
                // so that visibility is determined solely by the per-element `showData` property.
                const effectiveShowAllData = isReadOnly ? isGlobalDiagramDataVisible : true;
                return (
                    <div key={element.id} className="py-2 diagram-container">
                        <div className="relative">
                            {!isReadOnly && !isEditingThisDiagram && (
                                <div className="absolute top-2 right-2 z-10">
                                    <Button onClick={() => handleToggleDiagramEdit(element.id)} variant="outline" size="sm">
                                        <EditIcon className="w-4 h-4 mr-1" />
                                        {t('viewNode.editDiagram')}
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
                                t={t}
                                fixedWidth={printOptions?.fixedDiagramWidth}
                                showAllData={effectiveShowAllData}
                            />
                        </div>
                        {element.caption && (
                            <p className="text-xs text-gray-600 mt-2 text-center italic">{element.caption}</p>
                        )}
                    </div>
                );
            }
            case 'c4diagram': {
                const isEditingThisDiagram = editingC4DiagramId === element.id;
                return (
                    <div key={element.id} className="py-2 c4-diagram-container">
                        <div className="relative">
                            {!isReadOnly && !isEditingThisDiagram && (
                                <div className="absolute top-2 right-2 z-10">
                                    <Button onClick={() => handleToggleC4DiagramEdit(element.id)} variant="outline" size="sm">
                                        <EditIcon className="w-4 h-4 mr-1" />
                                        {t('viewNode.editDiagram')}
                                    </Button>
                                </div>
                            )}
                            <C4SystemContextDiagramEditor
                                diagramState={element.diagramState}
                                isReadOnly={isReadOnly || !isEditingThisDiagram}
                                onChange={(newState) => handleC4DiagramChange(element.id, newState)}
                                onDoneEditing={() => handleToggleC4DiagramEdit(element.id)}
                                height={element.height}
                                viewBox={element.viewBox}
                                t={t}
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

export default memo(ViewNode);