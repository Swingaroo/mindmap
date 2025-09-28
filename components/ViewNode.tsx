import React, { FC, memo, useState, SVGProps, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import showdown from 'showdown';
import { ViewNodeData, TextStyle, DiagramState, ViewElement, ImageElement, RichTextElement } from '../types';
import DiagramEditor from './diagram/DiagramEditor';
import Button from './ui/Button';
import { useTranslation, TFunction } from '../i18n';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);
converter.setOption('openLinksInNewWindow', true);

// A floating toolbar for the rich text editor
const RichTextToolbar: FC<{ onSave: () => void; onFormat: (command: string) => void; t: TFunction }> = ({ onSave, onFormat, t }) => {
    const FormatButton: FC<{ command: string, titleKey: string, children: React.ReactNode }> = ({ command, titleKey, children }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                onFormat(command);
            }}
            title={t(titleKey)}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-700 hover:bg-gray-200"
            tabIndex={-1}
        >
            {children}
        </button>
    );

    return (
        <div className="p-1 bg-white border border-gray-300 rounded-md shadow-lg flex items-center gap-1 flex-wrap">
            <FormatButton command="bold" titleKey="richTextEditor.bold"><BoldIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="italic" titleKey="richTextEditor.italic"><ItalicIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="underline" titleKey="richTextEditor.underline"><UnderlineIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="strikeThrough" titleKey="richTextEditor.strikethrough"><StrikeThroughIcon className="w-5 h-5" /></FormatButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <FormatButton command="insertUnorderedList" titleKey="richTextEditor.unorderedList"><ListUnorderedIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="insertOrderedList" titleKey="richTextEditor.orderedList"><ListOrderedIcon className="w-5 h-5" /></FormatButton>
            <div className="flex-grow" />
            <Button
                onMouseDown={(e) => {
                    e.preventDefault();
                    onSave();
                }}
                size="sm"
                variant="secondary"
                tabIndex={-1}
            >
                <CheckIcon className="w-4 h-4 mr-1" />
                {t('richTextEditor.done')}
            </Button>
        </div>
    );
};

// A component to display and edit a single rich text element
const RichTextElementDisplay: FC<{
    element: RichTextElement;
    isEditing: boolean;
    isReadOnly: boolean;
    onStartEdit: () => void;
    onSave: (newContent: string) => void;
    t: TFunction;
}> = ({ element, isEditing, isReadOnly, onStartEdit, onSave, t }) => {
    const richTextRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && richTextRef.current) {
            richTextRef.current.focus();
            // Move cursor to the end
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(richTextRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }, [isEditing]);

    const handleSave = () => {
        if (isEditing && richTextRef.current) {
            onSave(richTextRef.current.innerHTML);
        }
    };
    
    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        richTextRef.current?.focus();
    };

    return (
        <div className="relative rich-text-content">
            {isEditing && !isReadOnly && (
                <div 
                    ref={toolbarRef}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20"
                >
                    <RichTextToolbar onSave={handleSave} onFormat={handleFormat} t={t} />
                </div>
            )}

            {!isReadOnly && !isEditing && (
                <div className="absolute top-0 right-0 z-10">
                    <Button onClick={onStartEdit} variant="outline" size="sm">
                        <EditIcon className="w-4 h-4 mr-1" />
                        {t('viewNode.editRichText')}
                    </Button>
                </div>
            )}
            
            <div
                ref={richTextRef}
                contentEditable={isEditing && !isReadOnly}
                suppressContentEditableWarning
                className={`nodrag text-sm text-gray-700 break-words
                            [&_ul]:list-disc [&_ul]:pl-5
                            [&_ol]:list-decimal [&_ol]:pl-5
                            ${isEditing && !isReadOnly
                                ? 'p-2 min-h-[80px] focus:outline-none ring-2 ring-indigo-500 rounded-md bg-white'
                                : ''
                            }`}
                dangerouslySetInnerHTML={{ __html: element.content }}
            />
        </div>
    );
};


const ViewNode: FC<NodeProps<ViewNodeData>> = ({ data, selected }) => {
  const { id: nodeId, title, elements, onFocus, isReadOnly, onNodeDataChange, isHighlighterActive, onHighlightElement, printOptions, isGlobalDiagramDataVisible, viewNumber } = data;
  const [editingDiagramId, setEditingDiagramId] = useState<string | null>(null);
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
                  <RichTextElementDisplay
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
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

// SVG Icons for Rich Text Editor
const BoldIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
  </svg>
);
const ItalicIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="19" y1="4" x2="10" y2="4"></line>
    <line x1="14" y1="20" x2="5" y2="20"></line>
    <line x1="15" y1="4" x2="9" y2="20"></line>
  </svg>
);
const UnderlineIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
    <line x1="4" y1="21" x2="20" y2="21"></line>
  </svg>
);
const StrikeThroughIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
        <path d="M14 12a4 4 0 0 1 0 8H6"></path>
        <line x1="4" y1="12" x2="20" y2="12"></line>
    </svg>
);
const ListUnorderedIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);
const ListOrderedIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="10" y1="6" x2="21" y2="6"></line>
        <line x1="10" y1="12" x2="21" y2="12"></line>
        <line x1="10" y1="18" x2="21" y2="18"></line>
        <path d="M4 6h1v4"></path>
        <path d="M4 10h2"></path>
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
    </svg>
);

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